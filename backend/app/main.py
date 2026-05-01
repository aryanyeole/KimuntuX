from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import ResponseValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import app.models  # noqa: F401
from app.blockchain.exceptions import BlockchainError, ConfigurationError, ConnectionError
from app.blockchain.web3_client import get_client
from app.core.config import settings
from app.routers import admin, auth, contacts, crm, webhooks

# ── Fail-fast checks ──────────────────────────────────────────────────────────
# Catch missing secrets before the server accepts any requests.
if not settings.testing:
    if not settings.kimux_fernet_key:
        raise RuntimeError(
            "KIMUX_FERNET_KEY is not set. "
            "Generate one with: cd backend && python -m app.scripts.generate_fernet_key"
        )
    if not settings.kimux_reply_token_secret:
        raise RuntimeError(
            "KIMUX_REPLY_TOKEN_SECRET is not set. "
            "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\""
        )
    if settings.sendgrid_api_key and not settings.sendgrid_event_webhook_public_key:
        raise RuntimeError(
            "SENDGRID_EVENT_WEBHOOK_PUBLIC_KEY is not set. "
            "Find it in SendGrid Mail Settings → Event Webhook → Signature Verification."
        )
from app.core.database import SessionLocal, engine, ensure_sqlite_campaign_columns
from app.core.tenancy import SYSTEM_TENANT_ID
from app.models.tenant import Tenant, TenantPlan
from app.models.base import Base
from app.routers import auth, campaigns, contacts, crm
from app.routers.blockchain.commission import router as commission_router
from app.routers.blockchain.escrow import router as escrow_router
from app.routers.blockchain.network import router as network_router
from app.routers.blockchain.wallet import router as wallet_router
from app.schemas.blockchain import ErrorResponse

logger = logging.getLogger(__name__)


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description=(
        "Backend API for KimuX auth, contact forms, CRM features, and "
        "blockchain-enabled campaign and wallet workflows."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)


@app.exception_handler(ResponseValidationError)
async def response_validation_handler(
    _request: Request, exc: ResponseValidationError
) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={"detail": "Response validation failed", "errors": exc.errors()},
    )


@app.exception_handler(BlockchainError)
async def blockchain_error_handler(request: Request, exc: BlockchainError) -> JSONResponse:
    logger.error("Unhandled blockchain error on %s %s: %s", request.method, request.url.path, exc)
    return JSONResponse(
        status_code=503,
        content=ErrorResponse(error=str(exc), detail=getattr(exc, "detail", None)).model_dump(),
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _init_blockchain() -> tuple[bool, dict | None]:
    try:
        client = get_client()
        health = client.health_check()
        logger.info(
            "Blockchain ready - block=%s gas=%.1f gwei balance=%.6f ETH",
            health.get("latest_block"),
            health.get("gas_price_gwei", 0) or 0,
            health.get("platform_balance_eth", 0) or 0,
        )
        return True, health
    except (ConfigurationError, ConnectionError, BlockchainError) as exc:
        logger.warning("Blockchain unavailable at startup (%s) - CRM continues normally.", exc)
        return False, {
            "status": "unhealthy",
            "chain_id": None,
            "latest_block": None,
            "gas_price_gwei": None,
            "platform_balance_eth": None,
            "contracts": {},
            "error": str(exc),
        }


def _ensure_system_tenant() -> None:
    db = SessionLocal()
    try:
        tenant = db.get(Tenant, SYSTEM_TENANT_ID)
        if tenant is None:
            db.add(
                Tenant(
                    id=SYSTEM_TENANT_ID,
                    name="KimuX System",
                    slug="kimux-system",
                    plan=TenantPlan.enterprise,
                )
            )
            db.commit()
    finally:
        db.close()


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)
    ensure_sqlite_campaign_columns()
    _ensure_system_tenant()
    ready, health = _init_blockchain()
    app.state.blockchain_ready = ready
    app.state.blockchain_health = health

    # Anthropic / Funnel Builder — soft-fail: CRM works without the key
    if settings.anthropic_api_key:
        logger.info("Anthropic client ready for funnel generation")
    else:
        logger.warning(
            "ANTHROPIC_API_KEY not set — funnel generation will use "
            "static-template fallback"
        )


app.include_router(auth.router, prefix=settings.api_v1_prefix)
app.include_router(contacts.router, prefix=settings.api_v1_prefix)
app.include_router(campaigns.router, prefix=settings.api_v1_prefix)
app.include_router(crm.router, prefix=settings.api_v1_prefix)
app.include_router(admin.router, prefix=settings.api_v1_prefix)
app.include_router(webhooks.router, prefix=settings.api_v1_prefix)
app.include_router(commission_router, prefix=settings.api_v1_prefix)
app.include_router(wallet_router, prefix=settings.api_v1_prefix)
app.include_router(escrow_router, prefix=settings.api_v1_prefix)
app.include_router(network_router, prefix=settings.api_v1_prefix)


@app.get("/health", tags=["System"])
def health_check() -> dict:
    try:
        blockchain_health = get_client().health_check()
        app.state.blockchain_ready = blockchain_health.get("status") == "healthy"
        app.state.blockchain_health = blockchain_health
    except (ConfigurationError, ConnectionError, BlockchainError) as exc:
        blockchain_health = {
            "status": "unhealthy",
            "chain_id": None,
            "latest_block": None,
            "gas_price_gwei": None,
            "platform_balance_eth": None,
            "contracts": {},
            "error": str(exc),
        }
        app.state.blockchain_ready = False
        app.state.blockchain_health = blockchain_health

    return {
        "status": "ok",
        "environment": settings.app_env,
        "chain_id": blockchain_health.get("chain_id"),
        "latest_block": blockchain_health.get("latest_block"),
        "gas_price_gwei": blockchain_health.get("gas_price_gwei"),
        "platform_balance_eth": blockchain_health.get("platform_balance_eth"),
        "contracts": blockchain_health.get("contracts", {}),
        "error": blockchain_health.get("error"),
    }


@app.get("/", tags=["System"])
def root() -> dict:
    return {
        "name": settings.app_name,
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health",
    }
