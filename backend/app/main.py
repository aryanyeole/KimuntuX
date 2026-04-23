from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.exceptions import ResponseValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.core.bootstrap_admin import ensure_bootstrap_admin
from api.endpoints.commission import router as commission_router
from api.endpoints.escrow import router as escrow_router
from api.endpoints.network import router as network_router
from api.endpoints.wallet import router as wallet_router
from app.core.config import settings
from app.core.database import SessionLocal, engine, ensure_sqlite_campaign_columns
from app.models.base import Base
from app.models import Campaign, ContactSubmission, SupportMessage, User  # noqa: F401
from app.routers import admin, auth, campaigns, contacts, crm, support
from blockchain.exceptions import BlockchainError, ConfigurationError, ConnectionError
from blockchain.web3_client import get_client

logger = logging.getLogger(__name__)

# ── Fail-fast checks ──────────────────────────────────────────────────────────
# Catch missing Phase 2 secrets before the server accepts any requests.
if not settings.kimux_fernet_key:
    raise RuntimeError(
        "KIMUX_FERNET_KEY is not set. "
        "Generate one with: cd backend && python -m app.scripts.generate_fernet_key"
    )

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Backend API for KimuX auth, contact forms, and future CRM features.",
)


@app.exception_handler(ResponseValidationError)
async def response_validation_handler(
    _request, exc: ResponseValidationError
) -> JSONResponse:
    """Return JSON (not HTML) so clients see why /auth/login response failed validation."""
    return JSONResponse(
        status_code=500,
        content={"detail": "Response validation failed", "errors": exc.errors()},
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _ensure_users_is_admin_column() -> None:
    from sqlalchemy import inspect

    insp = inspect(engine)
    if not insp.has_table("users"):
        return
    col_names = {c["name"] for c in insp.get_columns("users")}
    if "is_admin" in col_names:
        return
    with engine.begin() as conn:
        if engine.dialect.name == "postgresql":
            conn.execute(
                text(
                    "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE"
                )
            )
        else:
            conn.execute(
                text("ALTER TABLE users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT 0")
            )


@app.on_event("startup")
def create_tables() -> None:
    Base.metadata.create_all(bind=engine)
    _ensure_users_is_admin_column()
    with SessionLocal() as db:
        ensure_bootstrap_admin(db)
    ensure_sqlite_campaign_columns()

    try:
        get_client()
    except (ConfigurationError, ConnectionError, BlockchainError) as exc:
        logger.exception("Blockchain startup failed")
        raise RuntimeError(f"Blockchain startup failed: {exc}") from exc


@app.get("/health")
def health_check() -> dict:
    try:
        blockchain_health = get_client().health_check()
        return {
            "status": blockchain_health.get("status", "healthy"),
            "environment": settings.app_env,
            "chain_id": blockchain_health.get("chain_id"),
            "latest_block": blockchain_health.get("latest_block"),
            "gas_price_gwei": blockchain_health.get("gas_price_gwei"),
            "platform_balance_eth": blockchain_health.get("platform_balance_eth"),
            "contracts": blockchain_health.get("contracts", {}),
            "error": blockchain_health.get("error"),
        }
    except BlockchainError as exc:
        return {
            "status": "unhealthy",
            "environment": settings.app_env,
            "chain_id": None,
            "latest_block": None,
            "gas_price_gwei": None,
            "platform_balance_eth": None,
            "contracts": {},
            "error": str(exc),
        }


app.include_router(auth.router, prefix=settings.api_v1_prefix)
app.include_router(contacts.router, prefix=settings.api_v1_prefix)
app.include_router(admin.router, prefix=settings.api_v1_prefix)
app.include_router(support.router, prefix=settings.api_v1_prefix)
app.include_router(campaigns.router, prefix=settings.api_v1_prefix)
app.include_router(crm.router, prefix=settings.api_v1_prefix)
app.include_router(admin.router, prefix=settings.api_v1_prefix)
app.include_router(support.router, prefix=settings.api_v1_prefix)
app.include_router(commission_router, prefix=settings.api_v1_prefix)
app.include_router(wallet_router, prefix=settings.api_v1_prefix)
app.include_router(escrow_router, prefix=settings.api_v1_prefix)
app.include_router(network_router, prefix=settings.api_v1_prefix)
