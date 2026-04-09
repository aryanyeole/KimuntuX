from __future__ import annotations

from typing import Optional

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ── App ───────────────────────────────────────────────────────────────────
    app_name: str = "KimuntuX Backend"
    app_env: str = "development"
    api_v1_prefix: str = "/api/v1"

    # ── Database ──────────────────────────────────────────────────────────────
    database_url: str = "sqlite:///./kimuntu.db"

    # ── Auth / JWT ────────────────────────────────────────────────────────────
    jwt_secret_key: str = "change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # ── CORS ──────────────────────────────────────────────────────────────────
    cors_origins: list[str] = ["http://localhost:3000"]

    # ── Blockchain (optional — app starts without these) ─────────────────────
    sepolia_rpc_url: Optional[str] = None
    sepolia_rpc_fallback: Optional[str] = None
    platform_private_key: Optional[str] = None
    platform_address: Optional[str] = None
    commission_contract_address: Optional[str] = None
    wallet_contract_address: Optional[str] = None
    escrow_contract_address: Optional[str] = None
    gas_limit_buffer: float = 1.2
    max_gas_price_gwei: int = 100
    transaction_timeout_seconds: int = 180

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


settings = Settings()
