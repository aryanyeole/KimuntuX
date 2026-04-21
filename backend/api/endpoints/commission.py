"""
api/endpoints/commission.py
────────────────────────────
FastAPI router for KimuXCommissionSystem interactions.

All blockchain errors are caught at the router level and mapped to
appropriate HTTP status codes so callers receive structured JSON errors
rather than 500 traces.

Endpoints
---------
GET  /commissions/stats
GET  /commissions/balance/{affiliate}
GET  /commissions/{affiliate}
GET  /commissions/{affiliate}/{index}
GET  /commissions/affiliates/{address}/status

POST /commissions/record
POST /commissions/approve
POST /commissions/auto-approve
POST /commissions/withdraw
POST /commissions/withdraw-amount
POST /commissions/affiliates/register
POST /commissions/affiliates/register-self
POST /commissions/merchants/authorize
POST /commissions/fee-rate
POST /commissions/minimum-payout
POST /commissions/platform-fees/withdraw
POST /commissions/pause
POST /commissions/unpause
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, status

from api.models import (
    ApproveCommissionRequest,
    AuthorizeMerchantRequest,
    AutoApproveRequest,
    AffiliateStatusResponse,
    BalanceResponse,
    CommissionConfigResponse,
    CommissionHistoryItemResponse,
    CommissionHistoryResponse,
    CommissionRecordResponse,
    CommissionTransactionStatusResponse,
    ContractStatsResponse,
    LegacyRecordCommissionRequest,
    RecordCommissionRequest,
    RegisterAffiliateRequest,
    SetFeeRateRequest,
    SetMinimumPayoutRequest,
    TxResponse,
    WithdrawAmountRequest,
)
from blockchain.contracts.commission import CommissionContract, CommissionStatus
from blockchain.exceptions import (
    BlockchainError,
    ContractCallError,
    GasError,
    InsufficientFundsError,
    TransactionRevertedError,
    TransactionTimeoutError,
)
from blockchain.web3_client import get_client

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/commissions", tags=["Commission System"])


# ─────────────────────────────────────────────────────────────────────────────
# Dependency
# ─────────────────────────────────────────────────────────────────────────────

def _commission_contract() -> CommissionContract:
    return CommissionContract(get_client())


# ─────────────────────────────────────────────────────────────────────────────
# Error mapping helper
# ─────────────────────────────────────────────────────────────────────────────

def _map_blockchain_error(exc: BlockchainError) -> HTTPException:
    """Convert a blockchain exception to an HTTP response."""
    if isinstance(exc, (TransactionRevertedError, ContractCallError)):
        return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    if isinstance(exc, (InsufficientFundsError, GasError)):
        return HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail=str(exc))
    if isinstance(exc, TransactionTimeoutError):
        return HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail=str(exc))
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)
    )


# ─────────────────────────────────────────────────────────────────────────────
# Read endpoints
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/stats", response_model=ContractStatsResponse)
def get_stats():
    """Return aggregate platform statistics from the commission contract."""
    try:
        stats = _commission_contract().get_contract_stats()
        return ContractStatsResponse(
            contract_balance_eth=stats.contract_balance_eth,
            total_paid_eth=stats.total_paid_eth,
            platform_fee_rate_bps=stats.platform_fee_rate_bps,
            minimum_payout_eth=stats.minimum_payout_eth,
        )
    except BlockchainError as exc:
        raise _map_blockchain_error(exc)


@router.get("/config", response_model=CommissionConfigResponse)
def get_commission_config():
    """Return fee, payout, and pause configuration for the commission contract."""
    try:
        contract = _commission_contract()
        return CommissionConfigResponse(
            platform_fee_rate_bps=contract.get_platform_fee_rate(),
            minimum_payout_eth=contract.get_minimum_payout(),
            paused=contract.is_paused(),
        )
    except BlockchainError as exc:
        raise _map_blockchain_error(exc)


@router.get("/balance/{affiliate}", response_model=BalanceResponse)
def get_balance(affiliate: str):
    """Return the claimable balance for an affiliate address."""
    try:
        balance = _commission_contract().get_balance(affiliate)
        return BalanceResponse(affiliate=affiliate, balance_eth=balance)
    except BlockchainError as exc:
        raise _map_blockchain_error(exc)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/affiliates/{address}/status", response_model=AffiliateStatusResponse)
def get_affiliate_status(address: str):
    """Check whether an address is a registered affiliate and/or merchant."""
    try:
        contract = _commission_contract()
        return AffiliateStatusResponse(
            address=address,
            is_affiliate=contract.is_affiliate(address),
            is_merchant=contract.is_merchant(address),
        )
    except BlockchainError as exc:
        raise _map_blockchain_error(exc)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/status/{address}", response_model=AffiliateStatusResponse)
def get_affiliate_status_compat(address: str):
    """Compatibility route for the current frontend service."""
    return get_affiliate_status(address)


@router.get("/transactions/{transaction_id}", response_model=CommissionTransactionStatusResponse)
def get_transaction_processed(transaction_id: str):
    """Return whether a sale transaction ID has already been processed on-chain."""
    try:
        processed = _commission_contract().is_transaction_processed(transaction_id)
        return CommissionTransactionStatusResponse(
            transaction_id=transaction_id,
            processed=processed,
        )
    except BlockchainError as exc:
        raise _map_blockchain_error(exc)


@router.get("/{affiliate}", response_model=list[CommissionRecordResponse])
def get_all_commissions(affiliate: str):
    """Return all commission records for an affiliate."""
    try:
        records = _commission_contract().get_all_commissions(affiliate)
        return [
            CommissionRecordResponse(
                affiliate=r.affiliate,
                amount_eth=r.amount_eth,
                timestamp=r.timestamp,
                transaction_id=r.transaction_id,
                status=r.status.name,
            )
            for r in records
        ]
    except BlockchainError as exc:
        raise _map_blockchain_error(exc)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/rds/{affiliate}", response_model=CommissionHistoryResponse)
def get_all_commissions_compat(affiliate: str):
    """Compatibility route for the current frontend service."""
    records = get_all_commissions(affiliate)
    return CommissionHistoryResponse(
        commissions=[
            CommissionHistoryItemResponse(
                affiliate=record.affiliate,
                amount_eth=record.amount_eth,
                status=record.status,
                tx_id=record.transaction_id,
                created_at=record.timestamp,
            )
            for record in records
        ]
    )


@router.get("/{affiliate}/{index}", response_model=CommissionRecordResponse)
def get_commission(affiliate: str, index: int):
    """Return a single commission record by index."""
    try:
        r = _commission_contract().get_commission(affiliate, index)
        return CommissionRecordResponse(
            affiliate=r.affiliate,
            amount_eth=r.amount_eth,
            timestamp=r.timestamp,
            transaction_id=r.transaction_id,
            status=r.status.name,
        )
    except BlockchainError as exc:
        raise _map_blockchain_error(exc)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


# ─────────────────────────────────────────────────────────────────────────────
# Write endpoints
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/record", response_model=TxResponse, status_code=status.HTTP_202_ACCEPTED)
def record_commission(body: RecordCommissionRequest | LegacyRecordCommissionRequest):
    """
    Record and pay a commission for a completed sale.

    The platform wallet must have enough ETH to cover the commission amount
    plus gas fees.
    """
    normalized = (
        RecordCommissionRequest(
            affiliate=body.affiliate,
            sale_amount_eth=body.amount_eth,
            commission_rate_bps=10000,
            transaction_id=body.tx_id,
        )
        if isinstance(body, LegacyRecordCommissionRequest)
        else body
    )
    try:
        tx_hash = _commission_contract().record_commission(
            affiliate=normalized.affiliate,
            sale_amount_eth=normalized.sale_amount_eth,
            commission_rate_bps=normalized.commission_rate_bps,
            transaction_id=normalized.transaction_id,
        )
        return TxResponse(tx_hash=tx_hash)
    except BlockchainError as exc:
        raise _map_blockchain_error(exc)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/approve", response_model=TxResponse, status_code=status.HTTP_202_ACCEPTED)
def approve_commission(body: ApproveCommissionRequest):
    """Approve a pending commission by index (merchant/owner only)."""
    try:
        tx_hash = _commission_contract().approve_commission(
            body.affiliate, body.index
        )
        return TxResponse(tx_hash=tx_hash)
    except BlockchainError as exc:
        raise _map_blockchain_error(exc)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/auto-approve", response_model=TxResponse, status_code=status.HTTP_202_ACCEPTED)
def auto_approve(body: AutoApproveRequest):
    """Approve a pending commission by transaction ID (merchant/owner only)."""
    try:
        tx_hash = _commission_contract().auto_approve(
            body.affiliate, body.transaction_id
        )
        return TxResponse(tx_hash=tx_hash)
    except BlockchainError as exc:
        raise _map_blockchain_error(exc)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/withdraw", response_model=TxResponse, status_code=status.HTTP_202_ACCEPTED)
def withdraw():
    """Withdraw the full balance for the platform wallet."""
    try:
        tx_hash = _commission_contract().withdraw()
        return TxResponse(tx_hash=tx_hash)
    except BlockchainError as exc:
        raise _map_blockchain_error(exc)


@router.post("/withdraw-amount", response_model=TxResponse, status_code=status.HTTP_202_ACCEPTED)
def withdraw_amount(body: WithdrawAmountRequest):
    """Withdraw a specific ETH amount for the platform wallet."""
    try:
        tx_hash = _commission_contract().withdraw_amount(body.amount_eth)
        return TxResponse(tx_hash=tx_hash)
    except BlockchainError as exc:
        raise _map_blockchain_error(exc)


@router.post(
    "/affiliates/register",
    response_model=TxResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def register_affiliate(body: RegisterAffiliateRequest):
    """Register a new affiliate (owner only)."""
    try:
        tx_hash = _commission_contract().register_affiliate(body.affiliate)
        return TxResponse(tx_hash=tx_hash)
    except BlockchainError as exc:
        raise _map_blockchain_error(exc)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post(
    "/affiliates/register-self",
    response_model=TxResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def register_self():
    """Register the platform wallet as an affiliate."""
    try:
        tx_hash = _commission_contract().register_self()
        return TxResponse(tx_hash=tx_hash)
    except BlockchainError as exc:
        raise _map_blockchain_error(exc)


@router.post(
    "/merchants/authorize",
    response_model=TxResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def authorize_merchant(body: AuthorizeMerchantRequest):
    """Grant or revoke merchant status (owner only)."""
    try:
        tx_hash = _commission_contract().authorize_merchant(body.merchant, body.status)
        return TxResponse(tx_hash=tx_hash)
    except BlockchainError as exc:
        raise _map_blockchain_error(exc)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/fee-rate", response_model=TxResponse, status_code=status.HTTP_202_ACCEPTED)
def set_fee_rate(body: SetFeeRateRequest):
    """Update the platform fee rate in basis points (owner only, max 1000)."""
    try:
        tx_hash = _commission_contract().set_platform_fee_rate(body.rate_bps)
        return TxResponse(tx_hash=tx_hash)
    except BlockchainError as exc:
        raise _map_blockchain_error(exc)


@router.post(
    "/minimum-payout",
    response_model=TxResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def set_minimum_payout(body: SetMinimumPayoutRequest):
    """Update the minimum payout threshold (owner only)."""
    try:
        tx_hash = _commission_contract().set_minimum_payout(body.amount_eth)
        return TxResponse(tx_hash=tx_hash)
    except BlockchainError as exc:
        raise _map_blockchain_error(exc)


@router.post(
    "/platform-fees/withdraw",
    response_model=TxResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def withdraw_platform_fees():
    """
    Withdraw accumulated platform fees (owner only).

    **Warning:** The current contract has a known bug.
    See ``CommissionContract.withdraw_platform_fees`` for details.
    """
    try:
        tx_hash = _commission_contract().withdraw_platform_fees()
        return TxResponse(tx_hash=tx_hash)
    except BlockchainError as exc:
        raise _map_blockchain_error(exc)


@router.post("/pause", response_model=TxResponse, status_code=status.HTTP_202_ACCEPTED)
def pause():
    """Pause the commission contract (owner only)."""
    try:
        tx_hash = _commission_contract().pause()
        return TxResponse(tx_hash=tx_hash)
    except BlockchainError as exc:
        raise _map_blockchain_error(exc)


@router.post("/unpause", response_model=TxResponse, status_code=status.HTTP_202_ACCEPTED)
def unpause():
    """Unpause the commission contract (owner only)."""
    try:
        tx_hash = _commission_contract().unpause()
        return TxResponse(tx_hash=tx_hash)
    except BlockchainError as exc:
        raise _map_blockchain_error(exc)
