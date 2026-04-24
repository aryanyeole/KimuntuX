from __future__ import annotations

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "KimuntuX Backend"
    app_env: str = "development"
    api_v1_prefix: str = "/api/v1"
    database_url: str = "sqlite:///./kimuntu.db"
    jwt_secret_key: str = "change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    cors_origins: list[str] = ["http://localhost:3000"]
    gemini_api_key: str | None = None
    testing: bool = False

    # ── Encryption ────────────────────────────────────────────────────────────
    # Required for encrypting tenant credentials. Generate with:
    #   cd backend && python -m app.scripts.generate_fernet_key
    kimux_fernet_key: str | None = None

    # ── SendGrid ──────────────────────────────────────────────────────────────
    # Platform-owned SendGrid account. Per-tenant keys deferred to Phase 5.
    sendgrid_api_key: str | None = None

    # ECDSA public key from SendGrid Mail Settings → Event Webhook → Signature.
    # Required at startup if SENDGRID_API_KEY is set.
    sendgrid_event_webhook_public_key: str | None = None

    # Toggle signature verification on the Inbound Parse webhook.
    # Default false in dev (no MX record pointed at localhost).
    sendgrid_inbound_verify: bool = False
    sendgrid_inbound_public_key: str | None = None

    # ── Reply address tokens ──────────────────────────────────────────────────
    # HMAC secret for reply-to address tokens. Required at startup.
    # Generate with: python -c "import secrets; print(secrets.token_hex(32))"
    kimux_reply_token_secret: str | None = None
    reply_domain: str = "reply.kimux.io"

    # ── Outbound email sender ─────────────────────────────────────────────────
    default_sender_email: str | None = None
    default_sender_name: str = "KimuX"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        enable_decoding=False,
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


settings = Settings()
