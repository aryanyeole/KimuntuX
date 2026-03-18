"""
api/models.py
─────────────
Pydantic request and response models for all KimuntuX API endpoints.

Design decisions
----------------
- All ETH amounts in the API are floats (ETH), never Wei.
- Ethereum addresses are accepted as plain strings and validated with a
  simple hex check; checksumming happens in the contract wrappers.
- Response models mirror the dataclasses from the blockchain layer but
  are kept separate so the API schema can evolve independently.
"""

from __future__ import annotations

import re
from typing import Optional

from pydantic import BaseModel, Field, field_validator


# ─────────────────────────────────────────────────────────────────────────────
# Shared validators / types
# ─────────────────────────────────────────────────────────────────────────────

_ETH_ADDRESS_RE = re.compile(r"^0x[0-9a-fA-F]{40}$")
_TX_HASH_RE = re.compile(r"^0x[0-9a-fA-F]{64}$")


def _validate_eth_address(v: str) -> str:
    if not _ETH_ADDRESS_RE.match(v):
        raise ValueError(
            f"Invalid Ethereum address: {v!r}. "
            "Must be a 42-character hex string starting with '0x'."
        )
    return v


# ─────────────────────────────────────────────────────────────────────────────
# Common response shapes
# ─────────────────────────────────────────────────────────────────────────────

class TxResponse(BaseModel):
    """Returned immediately after a write transaction is submitted."""
    tx_hash: str = Field(..., description="Transaction hash (0x…)")
    status: str = Field("submitted", description="Always 'submitted' on success")

    model_config = {"json_schema_extra": {"example": {
        "tx_hash": "0xabc123…",
        "status": "submitted",
    }}}


class TxReceiptResponse(BaseModel):
    """Returned after waiting for a transaction to be mined."""
    tx_hash: str
    block_number: int
    gas_used: int
    status: str = Field(..., description="'success' or 'reverted'")


class ErrorResponse(BaseModel):
    """Standard error envelope."""
    error: str
    detail: Optional[dict] = None


# ─────────────────────────────────────────────────────────────────────────────
# Commission endpoints
# ─────────────────────────────────────────────────────────────────────────────

class RecordCommissionRequest(BaseModel):
    """POST /commissions/record"""
    affiliate: str = Field(..., description="Affiliate wallet address")
    sale_amount_eth: float = Field(..., gt=0, description="Gross sale amount in ETH")
    commission_rate_bps: int = Field(
        ..., ge=1, le=10_000,
        description="Commission rate in basis points (e.g. 500 = 5%)"
    )
    transaction_id: str = Field(
        ..., min_length=1, max_length=256,
        description="Unique identifier for this sale"
    )

    @field_validator("affiliate")
    @classmethod
    def validate_affiliate(cls, v: str) -> str:
        return _validate_eth_address(v)

    model_config = {"json_schema_extra": {"example": {
        "affiliate": "0xAbCd…",
        "sale_amount_eth": 0.5,
        "commission_rate_bps": 500,
        "transaction_id": "order-20260318-001",
    }}}


class ApproveCommissionRequest(BaseModel):
    """POST /commissions/approve"""
    affiliate: str
    index: int = Field(..., ge=0, description="Zero-based commission index")

    @field_validator("affiliate")
    @classmethod
    def validate_affiliate(cls, v: str) -> str:
        return _validate_eth_address(v)


class AutoApproveRequest(BaseModel):
    """POST /commissions/auto-approve"""
    affiliate: str
    transaction_id: str = Field(..., min_length=1, max_length=256)

    @field_validator("affiliate")
    @classmethod
    def validate_affiliate(cls, v: str) -> str:
        return _validate_eth_address(v)


class WithdrawAmountRequest(BaseModel):
    """POST /commissions/withdraw-amount"""
    amount_eth: float = Field(..., gt=0)


class RegisterAffiliateRequest(BaseModel):
    """POST /commissions/affiliates/register"""
    affiliate: str

    @field_validator("affiliate")
    @classmethod
    def validate_affiliate(cls, v: str) -> str:
        return _validate_eth_address(v)


class AuthorizeMerchantRequest(BaseModel):
    """POST /commissions/merchants/authorize"""
    merchant: str
    status: bool

    @field_validator("merchant")
    @classmethod
    def validate_merchant(cls, v: str) -> str:
        return _validate_eth_address(v)


class SetFeeRateRequest(BaseModel):
    """POST /commissions/fee-rate"""
    rate_bps: int = Field(..., ge=0, le=1000, description="0–1000 bps (max 10%)")


class SetMinimumPayoutRequest(BaseModel):
    """POST /commissions/minimum-payout"""
    amount_eth: float = Field(..., ge=0)


# ── Commission response models ─────────────────────────────────────────────

class CommissionRecordResponse(BaseModel):
    affiliate: str
    amount_eth: float
    timestamp: int
    transaction_id: str
    status: str   # "PENDING" | "APPROVED" | "PAID" | "DISPUTED"


class ContractStatsResponse(BaseModel):
    contract_balance_eth: float
    total_paid_eth: float
    platform_fee_rate_bps: int
    minimum_payout_eth: float


class BalanceResponse(BaseModel):
    affiliate: str
    balance_eth: float


class AffiliateStatusResponse(BaseModel):
    address: str
    is_affiliate: bool
    is_merchant: bool


# ─────────────────────────────────────────────────────────────────────────────
# Wallet endpoints
# ─────────────────────────────────────────────────────────────────────────────

class CreateWalletForRequest(BaseModel):
    """POST /wallets/create-for"""
    user: str

    @field_validator("user")
    @classmethod
    def validate_user(cls, v: str) -> str:
        return _validate_eth_address(v)


class CreditETHRequest(BaseModel):
    """POST /wallets/credit-eth"""
    user: str
    amount_eth: float = Field(..., gt=0)

    @field_validator("user")
    @classmethod
    def validate_user(cls, v: str) -> str:
        return _validate_eth_address(v)


class DepositETHRequest(BaseModel):
    """POST /wallets/deposit-eth"""
    amount_eth: float = Field(..., gt=0)


class WithdrawETHRequest(BaseModel):
    """POST /wallets/withdraw-eth"""
    amount_eth: float = Field(..., gt=0)


class TransferETHRequest(BaseModel):
    """POST /wallets/transfer-eth"""
    recipient: str
    amount_eth: float = Field(..., gt=0)

    @field_validator("recipient")
    @classmethod
    def validate_recipient(cls, v: str) -> str:
        return _validate_eth_address(v)


class AddTokenRequest(BaseModel):
    """POST /wallets/tokens/add"""
    token: str
    symbol: str = Field(..., min_length=1, max_length=16)

    @field_validator("token")
    @classmethod
    def validate_token(cls, v: str) -> str:
        return _validate_eth_address(v)


class UpdateMinimumWithdrawalRequest(BaseModel):
    """POST /wallets/minimum-withdrawal"""
    amount_eth: float = Field(..., ge=0)


# ── Wallet response models ─────────────────────────────────────────────────

class WalletDetailsResponse(BaseModel):
    owner: str
    eth_balance: float
    created_at: int
    total_deposits: float
    total_withdrawals: float


class WalletBalancesResponse(BaseModel):
    eth_balance: float
    token_balances: dict  # token_address → raw units


class WalletStatusResponse(BaseModel):
    address: str
    has_wallet: bool


# ─────────────────────────────────────────────────────────────────────────────
# Health
# ─────────────────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    chain_id: Optional[int] = None
    latest_block: Optional[int] = None
    gas_price_gwei: Optional[float] = None
    platform_balance_eth: Optional[float] = None
    error: Optional[str] = None
