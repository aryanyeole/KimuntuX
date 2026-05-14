from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import ResponseValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import inspect, text

import app.models  # noqa: F401
from app.core.bootstrap_admin import ensure_bootstrap_admin
from app.core.config import settings
from app.core.database import SessionLocal, engine, ensure_sqlite_campaign_columns
from app.core.tenancy import SYSTEM_TENANT_ID
from app.models.base import Base
from app.models.tenant import Tenant, TenantPlan
from app.routers import admin, auth, campaigns, campaigns, contacts, crm, support, public_funnels, webhooks

logger = logging.getLogger(__name__)

# Blockchain HTTP routes and Web3 startup are disabled; CRM and other APIs run without chain.
TEMP_DISABLE_BLOCKCHAIN = True

# ── Fail-fast checks ──────────────────────────────────────────────────────────
if not settings.testing:
    if not settings.kimux_fernet_key:
        raise RuntimeError(
            "KIMUX_FERNET_KEY is not set. "
            "Generate one with: cd backend && python -m app.scripts.generate_fernet_key"
        )
    if not settings.kimux_reply_token_secret:
        raise RuntimeError(
            "KIMUX_REPLY_TOKEN_SECRET is not set. "
            'Generate one with: python -c "import secrets; print(secrets.token_hex(32))"'
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
        "Backend API for KimuX auth, contact forms, CRM features, campaigns, and webhooks."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)


@app.exception_handler(ResponseValidationError)
async def response_validation_handler(
    _request: Request, exc: ResponseValidationError
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


def _ensure_users_is_admin_column() -> None:
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
            conn.execute(text("ALTER TABLE users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT 0"))


def _ensure_users_is_platform_admin_column() -> None:
    """RDS/legacy DBs may predate Alembic phase_25; align schema before ORM queries."""
    insp = inspect(engine)
    if not insp.has_table("users"):
        return
    col_names = {c["name"] for c in insp.get_columns("users")}
    if "is_platform_admin" in col_names:
        return
    with engine.begin() as conn:
        if engine.dialect.name == "postgresql":
            conn.execute(
                text(
                    "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_platform_admin "
                    "BOOLEAN NOT NULL DEFAULT FALSE"
                )
            )
        else:
            conn.execute(
                text(
                    "ALTER TABLE users ADD COLUMN is_platform_admin BOOLEAN NOT NULL DEFAULT 0"
                )
            )


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)
    ensure_sqlite_campaign_columns()
    _ensure_users_is_admin_column()
    _ensure_users_is_platform_admin_column()
    with SessionLocal() as db:
        ensure_bootstrap_admin(db)
    _ensure_system_tenant()

    if TEMP_DISABLE_BLOCKCHAIN:
        logger.warning("Blockchain routes and Web3 startup checks are disabled.")

    if settings.anthropic_api_key:
        logger.info("Anthropic client ready for funnel generation")
    else:
        logger.warning(
            "ANTHROPIC_API_KEY not set — funnel generation will use static-template fallback"
        )


app.include_router(auth.router, prefix=settings.api_v1_prefix)
app.include_router(contacts.router, prefix=settings.api_v1_prefix)
app.include_router(support.router, prefix=settings.api_v1_prefix)
app.include_router(campaigns.router, prefix=settings.api_v1_prefix)
app.include_router(crm.router, prefix=settings.api_v1_prefix)
app.include_router(admin.router, prefix=settings.api_v1_prefix)
app.include_router(public_funnels.router, prefix=settings.api_v1_prefix)
app.include_router(webhooks.router, prefix=settings.api_v1_prefix)


@app.get("/health", tags=["System"])
def health_check() -> dict:
    return {
        "status": "ok",
        "environment": settings.app_env,
        "blockchain": "disabled_temporarily",
    }


@app.get("/", tags=["System"])
def root() -> dict:
    return {
        "name": settings.app_name,
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health",
    }
