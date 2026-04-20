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

    # ── Phase 2: Encryption + ClickBank ──────────────────────────────────────
    # Required for encrypting tenant credentials. Generate with:
    #   cd backend && python -m app.scripts.generate_fernet_key
    kimux_fernet_key: str | None = None

    # Platform-level ClickBank credential (single developer key, post-Aug 2023 auth model).
    # Used for marketplace data — visible to all tenants.
    # Obtain from https://accounts.clickbank.com/developer/index.htm
    clickbank_developer_key: str | None = None

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
