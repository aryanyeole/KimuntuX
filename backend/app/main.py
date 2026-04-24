from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Backend API for KimuntuX auth, contact forms, and future CRM features.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "environment": settings.app_env}


app.include_router(auth.router, prefix=settings.api_v1_prefix)
app.include_router(contacts.router, prefix=settings.api_v1_prefix)
app.include_router(crm.router, prefix=settings.api_v1_prefix)
app.include_router(admin.router, prefix=settings.api_v1_prefix)
app.include_router(webhooks.router, prefix=settings.api_v1_prefix)
