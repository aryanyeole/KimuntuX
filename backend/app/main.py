from __future__ import annotations

import logging
import sys

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.routers import auth, contacts, crm

# Configure logging before creating any loggers
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)-8s %(name)s — %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="KimuntuX API — CRM, Auth, and Blockchain integration.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── CRM / Auth routers ────────────────────────────────────────────────────────
app.include_router(auth.router, prefix=settings.api_v1_prefix)
app.include_router(contacts.router, prefix=settings.api_v1_prefix)
app.include_router(crm.router, prefix=settings.api_v1_prefix)

# ── Blockchain routers ────────────────────────────────────────────────────────
# Loaded conditionally — the CRM app starts fine without blockchain env vars.
# If web3 is installed and the modules import cleanly, the routers are added.
_blockchain_loaded = False
try:
    from api.endpoints.commission import router as commission_router
    from api.endpoints.wallet import router as wallet_router
    from blockchain.exceptions import BlockchainError

    app.include_router(commission_router, prefix=settings.api_v1_prefix)
    app.include_router(wallet_router, prefix=settings.api_v1_prefix)

    @app.exception_handler(BlockchainError)
    async def blockchain_error_handler(request: Request, exc: BlockchainError) -> JSONResponse:
        logger.error("Blockchain error on %s %s: %s", request.method, request.url.path, exc)
        return JSONResponse(
            status_code=503,
            content={"error": str(exc), "detail": exc.detail},
        )

    _blockchain_loaded = True
    logger.info("Blockchain routers registered at %s/commissions and %s/wallets",
                settings.api_v1_prefix, settings.api_v1_prefix)

except ImportError as exc:
    logger.warning("Blockchain routers not loaded (missing dependency): %s", exc)
except Exception as exc:
    logger.warning("Blockchain routers not loaded: %s", exc)


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
def health_check() -> dict:
    result: dict = {"status": "ok", "environment": settings.app_env}
    if _blockchain_loaded:
        try:
            from blockchain.web3_client import get_client
            result["blockchain"] = get_client().health_check()
        except Exception as exc:
            result["blockchain"] = {"status": "unavailable", "error": str(exc)}
    else:
        result["blockchain"] = {"status": "not_configured"}
    return result


# ── Generic error handler ─────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def generic_error_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unexpected error on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"error": "An unexpected error occurred."})
