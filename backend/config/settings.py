"""
config/settings.py
──────────────────
Centralised configuration for the KimuX backend.

All values come from environment variables (or a .env file).
Pydantic-settings validates types and raises clear errors on startup
if required variables are missing, so the app fails fast before serving
any requests.

Usage
-----
    from config.settings import settings

    url  = settings.blockchain.sepolia_rpc_url
    addr = settings.blockchain.commission_contract_address
"""

from __future__ import annotations

import logging
from functools import cached_property
from typing import Optional

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Blockchain settings
# ─────────────────────────────────────────────────────────────────────────────

class BlockchainSettings(BaseSettings):
    """All blockchain-related environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── RPC Providers ────────────────────────────────────────────────────────
    sepolia_rpc_url: str = Field(
        ...,
        description="Primary EVM RPC endpoint (Sepolia, localhost Hardhat, or another supported network).",
    )
    sepolia_rpc_fallback: Optional[str] = Field(
        None,
        description="Optional fallback RPC endpoint used when the primary is unavailable.",
    )

    # ── Network ──────────────────────────────────────────────────────────────
    expected_chain_id: int = Field(
        11155111,
        description="Expected chain ID. The client raises an error if the "
                    "connected network does not match this value.",
    )

    # ── Platform Wallet ──────────────────────────────────────────────────────
    platform_private_key: str = Field(
        ...,
        description="Hex private key for the platform wallet that signs and "
                    "pays gas for all on-chain operations. No 0x prefix.",
    )
    platform_address: Optional[str] = Field(
        None,
        description="Platform wallet public address. Derived from the private "
                    "key at runtime if not supplied explicitly.",
    )

    # ── Contract Addresses ───────────────────────────────────────────────────
    commission_contract_address: str = Field(
        ...,
        description="Deployed KimuXCommissionSystem contract address.",
    )
    wallet_contract_address: str = Field(
        ...,
        description="Deployed KimuXWallet contract address.",
    )
    escrow_contract_address: Optional[str] = Field(
        None,
        description="Deployed PaymentEscrow contract address (optional).",
    )

    # ── Gas Configuration ────────────────────────────────────────────────────
    gas_limit_buffer: float = Field(
        1.2,
        description="Multiply the estimated gas by this factor to add a safety "
                    "buffer. 1.2 = 20 % buffer.",
        ge=1.0,
        le=3.0,
    )
    max_gas_price_gwei: int = Field(
        100,
        description="Hard cap on gas price in gwei. Transactions are rejected "
                    "if the network price exceeds this value.",
        gt=0,
    )
    transaction_timeout_seconds: int = Field(
        180,
        description="Seconds to wait for a transaction receipt before timing out.",
        gt=0,
    )

    # ── Validators ───────────────────────────────────────────────────────────

    @field_validator("platform_private_key")
    @classmethod
    def _validate_private_key(cls, v: str) -> str:
        # Strip optional 0x prefix
        key = v.removeprefix("0x").strip()
        if len(key) != 64:
            raise ValueError(
                "PLATFORM_PRIVATE_KEY must be exactly 32 bytes "
                f"(64 hex characters). Got {len(key)} characters."
            )
        try:
            int(key, 16)
        except ValueError:
            raise ValueError("PLATFORM_PRIVATE_KEY contains non-hex characters.")
        return key  # store without 0x so Web3.py accepts it directly

    @field_validator(
        "commission_contract_address",
        "wallet_contract_address",
        mode="before",
    )
    @classmethod
    def _validate_contract_address(cls, v: str) -> str:
        if not isinstance(v, str) or not v.startswith("0x") or len(v) != 42:
            raise ValueError(
                f"Contract address must be a 42-character hex string starting "
                f"with '0x'. Got: {v!r}"
            )
        return v

    @model_validator(mode="after")
    def _warn_no_fallback(self) -> "BlockchainSettings":
        if not self.sepolia_rpc_fallback:
            logger.warning(
                "SEPOLIA_RPC_FALLBACK is not set. "
                "The service will have no redundancy if the primary RPC fails."
            )
        return self


# ─────────────────────────────────────────────────────────────────────────────
# Application settings
# ─────────────────────────────────────────────────────────────────────────────

class AppSettings(BaseSettings):
    """General application settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "KimuX Backend"
    debug: bool = False
    log_level: str = Field("INFO", pattern=r"^(DEBUG|INFO|WARNING|ERROR|CRITICAL)$")

    api_host: str = "0.0.0.0"
    api_port: int = Field(8000, gt=0, le=65535)

    # Cache
    cache_ttl_seconds: int = Field(30, description="TTL for blockchain read caches.", gt=0)

    # Rate limiting
    rate_limit_requests: int = Field(100, gt=0)
    rate_limit_window_seconds: int = Field(60, gt=0)

    # Database / Redis
    database_url: Optional[str] = None
    redis_url: str = "redis://localhost:6379/0"


# ─────────────────────────────────────────────────────────────────────────────
# Combined settings container
# ─────────────────────────────────────────────────────────────────────────────

class _Settings:
    """
    Lazy-loading settings container.

    Individual settings groups are loaded on first access so that the
    app can import this module freely without immediately hitting the
    environment variables (useful in test environments where you want
    to patch env vars before the first read).
    """

    @cached_property
    def blockchain(self) -> BlockchainSettings:
        return BlockchainSettings()  # type: ignore[call-arg]

    @cached_property
    def app(self) -> AppSettings:
        return AppSettings()  # type: ignore[call-arg]


# Public singleton — import this everywhere
settings = _Settings()
