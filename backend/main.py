"""
main.py
────────
KimuntuX Blockchain-only entry point.

Use this when running the blockchain API standalone (without the CRM backend).
For the full unified app (CRM + blockchain), use: uvicorn app.main:app

Start:
    uvicorn main:app --reload --host 0.0.0.0 --port 8001
"""

from __future__ import annotations

import logging
import sys

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.endpoints.commission import router as commission_router
from api.endpoints.wallet import router as wallet_router
from api.models import ErrorResponse, HealthResponse
from blockchain.exceptions import BlockchainError, ConfigurationError, ConnectionError
from blockchain.web3_client import get_client
from config.settings import settings

logging.basicConfig(
    level=getattr(logging, settings.app.log_level, logging.INFO),
    format="%(asctime)s %(levelname)-8s %(name)s — %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.app.app_name,
    description="KimuntuX Blockchain API — commission and wallet endpoints.",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event() -> None:
    logger.info("Starting %s …", settings.app.app_name)
    try:
        client = get_client()
        health = client.health_check()
        logger.info(
            "Blockchain ready — block=%s, gas=%.1f gwei, balance=%.6f ETH",
            health.get("latest_block"),
            health.get("gas_price_gwei", 0),
            health.get("platform_balance_eth", 0),
        )
    except (ConfigurationError, ConnectionError) as exc:
        logger.critical("STARTUP FAILED: %s", exc)
        raise SystemExit(1) from exc
    except BlockchainError as exc:
        logger.critical("Blockchain init error: %s", exc)
        raise SystemExit(1) from exc


@app.on_event("shutdown")
async def shutdown_event() -> None:
    logger.info("Shutting down %s", settings.app.app_name)


@app.exception_handler(BlockchainError)
async def blockchain_error_handler(request: Request, exc: BlockchainError) -> JSONResponse:
    logger.error("Unhandled blockchain error: %s", exc)
    return JSONResponse(
        status_code=503,
        content=ErrorResponse(error=str(exc), detail=exc.detail).model_dump(),
    )


@app.exception_handler(Exception)
async def generic_error_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unexpected error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(error="An unexpected error occurred.").model_dump(),
    )


app.include_router(commission_router, prefix="/api/v1")
app.include_router(wallet_router, prefix="/api/v1")


@app.get("/health", response_model=HealthResponse, tags=["System"])
def health_check():
    try:
        data = get_client().health_check()
        return HealthResponse(**data)
    except BlockchainError as exc:
        return HealthResponse(status="unhealthy", error=str(exc))


@app.get("/", tags=["System"])
def root():
    return {
        "name": settings.app.app_name,
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.app.api_host,
        port=settings.app.api_port,
        reload=settings.app.debug,
        log_level=settings.app.log_level.lower(),
    )
