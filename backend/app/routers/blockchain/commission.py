"""
app/routers/blockchain/commission.py
──────────────────────────────────────
FastAPI router for KimuXCommissionSystem interactions.

Endpoints
---------
GET  /commissions/stats
GET  /commissions/config
GET  /commissions/balance/{affiliate}
GET  /commissions/affiliates/{address}/status
GET  /commissions/status/{address}              (compat)
GET  /commissions/transactions/{transaction_id}
GET  /commissions/{affiliate}
GET  /commissions/rds/{affiliate}               (compat)
GET  /commissions/{affiliate}/{index}

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

from app.schemas.blockchain import (
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
from app.blockchain.contracts.commission import CommissionContract, CommissionStatus
from app.blockchain.exceptions import BlockchainError
from app.blockchain.web3_client import get_client
from app.routers.blockchain.deps import map_blockchain_error

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/commissions", tags=["Commission System"])


def _commission_contract() -> CommissionContract:
    return CommissionContract(get_client())


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
        raise map_blockchain_error(exc)


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
        raise map_blockchain_error(exc)


@router.get("/balance/{affiliate}", response_model=BalanceResponse)
def get_balance(affiliate: str):
    """Return the claimable balance for an affiliate address."""
    try:
        balance = _commission_contract().get_balance(affiliate)
        return BalanceResponse(affiliate=affiliate, balance_eth=balance)
    except BlockchainError as exc:
        raise map_blockchain_error(exc)
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
        raise map_blockchain_error(exc)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/status/{address}", response_model=AffiliateStatusResponse)
def get_affiliate_status_compat(address: str):
    """Compatibility route — same as /affiliates/{address}/status."""
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
        raise map_blockchain_error(exc)


@router.get("/rds/{affiliate}", response_model=CommissionHistoryResponse)
def get_all_commissions_compat(affiliate: str):
    """Compatibility route returning CommissionHistoryResponse shape."""
    records = get_all_commissions(affiliate)
    return CommissionHistoryResponse(
        commissions=[
            CommissionHistoryItemResponse(
                affiliate=r.affiliate,
                amount_eth=r.amount_eth,
                status=r.status,
                tx_id=r.transaction_id,
                created_at=r.timestamp,
            )
            for r in records
        ]
    )


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
        raise map_blockchain_error(exc)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


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
        raise map_blockchain_error(exc)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


# ─────────────────────────────────────────────────────────────────────────────
# Write endpoints
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/record", response_model=TxResponse, status_code=status.HTTP_202_ACCEPTED)
def record_commission(body: RecordCommissionRequest | LegacyRecordCommissionRequest):
    """Record and pay a commission for a completed sale."""
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
        raise map_blockchain_error(exc)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/approve", response_model=TxResponse, status_code=status.HTTP_202_ACCEPTED)
def approve_commission(body: ApproveCommissionRequest):
    """Approve a pending commission by index (merchant/owner only)."""
    try:
        tx_hash = _commission_contract().approve_commission(body.affiliate, body.index)
        return TxResponse(tx_hash=tx_hash)
    except BlockchainError as exc:
        raise map_blockchain_error(exc)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/auto-approve", response_model=TxResponse, status_code=status.HTTP_202_ACCEPTED)
def auto_approve(body: AutoApproveRequest):
    """Approve a pending commission by transaction ID (merchant/owner only)."""
    try:
        tx_hash = _commission_contract().auto_approve(body.affiliate, body.transaction_id)
        return TxResponse(tx_hash=tx_hash)
    except BlockchainError as exc:
        raise map_blockchain_error(exc)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/withdraw", response_model=TxResponse, status_code=status.HTTP_202_ACCEPTED)
def withdraw():
    """Withdraw the full balance for the platform wallet."""
    try:
        return TxResponse(tx_hash=_commission_contract().withdraw())
    except BlockchainError as exc:
        raise map_blockchain_error(exc)


@router.post("/withdraw-amount", response_model=TxResponse, status_code=status.HTTP_202_ACCEPTED)
def withdraw_amount(body: WithdrawAmountRequest):
    """Withdraw a specific ETH amount for the platform wallet."""
    try:
        return TxResponse(tx_hash=_commission_contract().withdraw_amount(body.amount_eth))
    except BlockchainError as exc:
        raise map_blockchain_error(exc)


@router.post("/affiliates/register", response_model=TxResponse, status_code=status.HTTP_202_ACCEPTED)
def register_affiliate(body: RegisterAffiliateRequest):
    """Register a new affiliate (owner only)."""
    try:
        return TxResponse(tx_hash=_commission_contract().register_affiliate(body.affiliate))
    except BlockchainError as exc:
        raise map_blockchain_error(exc)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/affiliates/register-self", response_model=TxResponse, status_code=status.HTTP_202_ACCEPTED)
def register_self():
    """Register the platform wallet as an affiliate."""
    try:
        return TxResponse(tx_hash=_commission_contract().register_self())
    except BlockchainError as exc:
        raise map_blockchain_error(exc)


@router.post("/merchants/authorize", response_model=TxResponse, status_code=status.HTTP_202_ACCEPTED)
def authorize_merchant(body: AuthorizeMerchantRequest):
    """Grant or revoke merchant status (owner only)."""
    try:
        return TxResponse(tx_hash=_commission_contract().authorize_merchant(body.merchant, body.status))
    except BlockchainError as exc:
        raise map_blockchain_error(exc)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/fee-rate", response_model=TxResponse, status_code=status.HTTP_202_ACCEPTED)
def set_fee_rate(body: SetFeeRateRequest):
    """Update the platform fee rate in basis points (owner only, max 1000)."""
    try:
        return TxResponse(tx_hash=_commission_contract().set_platform_fee_rate(body.rate_bps))
    except BlockchainError as exc:
        raise map_blockchain_error(exc)


@router.post("/minimum-payout", response_model=TxResponse, status_code=status.HTTP_202_ACCEPTED)
def set_minimum_payout(body: SetMinimumPayoutRequest):
    """Update the minimum payout threshold (owner only)."""
    try:
        return TxResponse(tx_hash=_commission_contract().set_minimum_payout(body.amount_eth))
    except BlockchainError as exc:
        raise map_blockchain_error(exc)


@router.post("/platform-fees/withdraw", response_model=TxResponse, status_code=status.HTTP_202_ACCEPTED)
def withdraw_platform_fees():
    """
    Withdraw accumulated platform fees (owner only).

    **Warning:** The current contract has a known bug where totalPending is always 0.
    See CommissionContract.withdraw_platform_fees for details.
    """
    try:
        return TxResponse(tx_hash=_commission_contract().withdraw_platform_fees())
    except BlockchainError as exc:
        raise map_blockchain_error(exc)


@router.post("/pause", response_model=TxResponse, status_code=status.HTTP_202_ACCEPTED)
def pause():
    """Pause the commission contract (owner only)."""
    try:
        return TxResponse(tx_hash=_commission_contract().pause())
    except BlockchainError as exc:
        raise map_blockchain_error(exc)


@router.post("/unpause", response_model=TxResponse, status_code=status.HTTP_202_ACCEPTED)
def unpause():
    """Unpause the commission contract (owner only)."""
    try:
        return TxResponse(tx_hash=_commission_contract().unpause())
    except BlockchainError as exc:
        raise map_blockchain_error(exc)
