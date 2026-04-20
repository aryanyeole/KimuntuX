"""
api/endpoints/escrow.py
───────────────────────
FastAPI router for PaymentEscrow interactions.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, status

from api.models import CreateEscrowRequest, EscrowResponse, EscrowStatsResponse, TxResponse
from blockchain.contracts.escrow import EscrowContract, EscrowStatus
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
router = APIRouter(prefix="/escrows", tags=["Escrow"])


def _escrow_contract() -> EscrowContract:
    try:
        return EscrowContract(get_client())
    except ValueError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


def _map_blockchain_error(exc: BlockchainError) -> HTTPException:
    if isinstance(exc, (TransactionRevertedError, ContractCallError)):
        return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    if isinstance(exc, (InsufficientFundsError, GasError)):
        return HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail=str(exc))
    if isinstance(exc, TransactionTimeoutError):
        return HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail=str(exc))
    return HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))


def _serialize_escrow(record) -> EscrowResponse:
    return EscrowResponse(
        escrow_id=record.escrow_id,
        buyer=record.buyer,
        seller=record.seller,
        amount_eth=record.amount_eth,
        escrow_fee_eth=record.escrow_fee_eth,
        created_at=record.created_at,
        release_time=record.release_time,
        status=record.status.name,
        product_id=record.product_id,
        notes=record.notes,
        arbiter=record.arbiter,
    )


@router.get("/stats", response_model=EscrowStatsResponse)
def get_escrow_stats():
    """Return escrow statistics and a recent escrow feed."""
    try:
        contract = _escrow_contract()
        stats = contract.get_contract_stats()
        recent = contract.get_recent_escrows(limit=5)
        active_count = sum(1 for escrow in recent if escrow.status == EscrowStatus.ACTIVE)
        return EscrowStatsResponse(
            active_escrows=active_count,
            total_locked_value=stats.total_locked_value_eth,
            recent_escrows=[_serialize_escrow(record) for record in recent],
            total_escrows=stats.total_created,
            completed_escrows=stats.total_completed,
            escrow_fee_rate_bps=stats.fee_rate_bps,
        )
    except BlockchainError as exc:
        raise _map_blockchain_error(exc)


@router.post("/create", response_model=TxResponse, status_code=status.HTTP_202_ACCEPTED)
def create_escrow(body: CreateEscrowRequest):
    """Create a new escrow on-chain."""
    try:
        tx_hash = _escrow_contract().create_escrow(
            seller=body.seller,
            product_id=body.product_id,
            notes=body.notes or "",
            arbiter=body.arbiter,
            amount_eth=body.amount_eth,
        )
        return TxResponse(tx_hash=tx_hash)
    except BlockchainError as exc:
        raise _map_blockchain_error(exc)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/{escrow_id}", response_model=EscrowResponse)
def get_escrow(escrow_id: int):
    """Get escrow details by ID."""
    try:
        return _serialize_escrow(_escrow_contract().get_escrow(escrow_id))
    except BlockchainError as exc:
        raise _map_blockchain_error(exc)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
