"""
main.py
────────
KimuX Backend — FastAPI application entry point.

Start development server:
    uvicorn main:app --reload --host 0.0.0.0 --port 8000

Start production server:
    uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1

Architecture note: We use a single worker (not multiple) because the
Web3Client singleton holds a single stateful connection.  Horizontal
scaling should be achieved by running multiple containers rather than
multiple workers in one process.
"""

from __future__ import annotations

import logging
import sys

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.endpoints.commission import router as commission_router
from api.endpoints.wallet import router as wallet_router
from api.endpoints.escrow import router as escrow_router
from api.endpoints.network import router as network_router
from api.models import ErrorResponse, HealthResponse
from app.routers.auth import router as auth_router
from app.routers.contacts import router as contacts_router
from app.routers.crm import router as crm_router
from blockchain.exceptions import BlockchainError, ConfigurationError, ConnectionError
from blockchain.web3_client import get_client
from config.settings import settings

# ─────────────────────────────────────────────────────────────────────────────
# Logging
# ─────────────────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=getattr(logging, settings.app.log_level, logging.INFO),
    format="%(asctime)s %(levelname)-8s %(name)s — %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Application factory
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title=settings.app.app_name,
    description=(
        "REST API for the KimuX platform blockchain integration layer. "
        "Provides endpoints for commission recording, affiliate management, "
        "and user wallet operations on the Sepolia testnet."
    ),
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — tighten origins for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────────────────────────────────────
# Startup / shutdown
# ─────────────────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup_event() -> None:
    """
    Initialise the Web3 connection and load contracts on startup.

    The app refuses to start if the blockchain connection or contracts
    cannot be established — fail fast rather than serve broken requests.
    """
    logger.info("Starting %s …", settings.app.app_name)
    try:
        client = get_client()
        health = client.health_check()
        logger.info(
            "Blockchain ready — block=%s, gas=%.1f gwei, platform_balance=%.6f ETH",
            health.get("latest_block"),
            health.get("gas_price_gwei", 0),
            health.get("platform_balance_eth", 0),
        )
    except (ConfigurationError, ConnectionError) as exc:
        logger.critical("STARTUP FAILED: %s", exc)
        # Re-raise so uvicorn exits with a non-zero status
        raise SystemExit(1) from exc
    except BlockchainError as exc:
        logger.critical("Blockchain initialisation error: %s", exc)
        raise SystemExit(1) from exc


@app.on_event("shutdown")
async def shutdown_event() -> None:
    logger.info("Shutting down %s", settings.app.app_name)


# ─────────────────────────────────────────────────────────────────────────────
# Global exception handlers
# ─────────────────────────────────────────────────────────────────────────────

@app.exception_handler(BlockchainError)
async def blockchain_error_handler(request: Request, exc: BlockchainError) -> JSONResponse:
    """Catch any unhandled BlockchainError and return a structured 503."""
    logger.error("Unhandled blockchain error: %s", exc)
    return JSONResponse(
        status_code=503,
        content=ErrorResponse(error=str(exc), detail=exc.detail).model_dump(),
    )


@app.exception_handler(Exception)
async def generic_error_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all for unexpected errors — never leak stack traces."""
    logger.exception("Unexpected error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(error="An unexpected error occurred.").model_dump(),
    )


# ─────────────────────────────────────────────────────────────────────────────
# Routers
# ─────────────────────────────────────────────────────────────────────────────

app.include_router(commission_router, prefix="/api/v1")
app.include_router(wallet_router, prefix="/api/v1")
app.include_router(escrow_router, prefix="/api/v1")
app.include_router(network_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(contacts_router, prefix="/api/v1")
app.include_router(crm_router, prefix="/api/v1")


# ─────────────────────────────────────────────────────────────────────────────
# Health endpoints
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse, tags=["System"])
def health_check():
    """
    Return blockchain connectivity status.

    Used by load balancers and monitoring systems.
    Returns 200 even when unhealthy — callers should inspect ``status``.
    """
    try:
        data = get_client().health_check()
        return HealthResponse(**data)
    except BlockchainError as exc:
        return HealthResponse(status="unhealthy", error=str(exc))


@app.get("/", tags=["System"])
def root():
    """API root — redirect users to /docs."""
    return {
        "name": settings.app.app_name,
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health",
    }


# ─────────────────────────────────────────────────────────────────────────────
# Dev entrypoint
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.app.api_host,
        port=settings.app.api_port,
        reload=settings.app.debug,
        log_level=settings.app.log_level.lower(),
    )
