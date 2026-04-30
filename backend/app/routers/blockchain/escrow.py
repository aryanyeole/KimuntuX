"""Escrow contract routes."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, status

from app.blockchain.contracts.escrow import EscrowContract, EscrowStatus
from app.blockchain.exceptions import BlockchainError
from app.blockchain.web3_client import get_client
from app.routers.blockchain.deps import map_blockchain_error
from app.schemas.blockchain import (
    CreateEscrowRequest,
    EscrowConfigResponse,
    EscrowDisputeRequest,
    EscrowResponse,
    EscrowStatsResponse,
    ResolveDisputeRequest,
    SetArbiterAuthorizationRequest,
    SetAutoReleaseTimeoutRequest,
    SetEscrowFeeRateRequest,
    TxResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/escrows", tags=["Escrow"])


def _escrow_contract() -> EscrowContract:
    try:
        return EscrowContract(get_client())
    except ValueError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


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
    """Return escrow totals and a small recent-activity feed."""
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
        raise map_blockchain_error(exc)


@router.get("/config", response_model=EscrowConfigResponse)
def get_escrow_config():
    """Return the escrow fee rate, timeout, and pause status."""
    try:
        contract = _escrow_contract()
        stats = contract.get_contract_stats()
        return EscrowConfigResponse(
            escrow_fee_rate_bps=stats.fee_rate_bps,
            auto_release_timeout_seconds=contract.auto_release_timeout(),
            paused=contract.is_paused(),
        )
    except BlockchainError as exc:
        raise map_blockchain_error(exc)


@router.get("/{escrow_id}", response_model=EscrowResponse)
def get_escrow(escrow_id: int):
    """Return escrow details by numeric escrow ID."""
    try:
        return _serialize_escrow(_escrow_contract().get_escrow(escrow_id))
    except BlockchainError as exc:
        raise map_blockchain_error(exc)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/create", response_model=TxResponse, status_code=status.HTTP_202_ACCEPTED)
def create_escrow(body: CreateEscrowRequest):
    """Create a new on-chain escrow record."""
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
        raise map_blockchain_error(exc)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{escrow_id}/release", response_model=TxResponse, status_code=status.HTTP_202_ACCEPTED)
def release_escrow(escrow_id: int):
    try:
        return TxResponse(tx_hash=_escrow_contract().release_escrow(escrow_id))
    except BlockchainError as exc:
        raise map_blockchain_error(exc)


@router.post("/{escrow_id}/auto-release", response_model=TxResponse, status_code=status.HTTP_202_ACCEPTED)
def auto_release_escrow(escrow_id: int):
    try:
        return TxResponse(tx_hash=_escrow_contract().auto_release_escrow(escrow_id))
    except BlockchainError as exc:
        raise map_blockchain_error(exc)


@router.post("/{escrow_id}/refund", response_model=TxResponse, status_code=status.HTTP_202_ACCEPTED)
def refund_escrow(escrow_id: int):
    try:
        return TxResponse(tx_hash=_escrow_contract().refund_escrow(escrow_id))
    except BlockchainError as exc:
        raise map_blockchain_error(exc)


@router.post("/{escrow_id}/dispute", response_model=TxResponse, status_code=status.HTTP_202_ACCEPTED)
def dispute_escrow(escrow_id: int, body: EscrowDisputeRequest):
    try:
        return TxResponse(tx_hash=_escrow_contract().raise_dispute(escrow_id, body.reason))
    except BlockchainError as exc:
        raise map_blockchain_error(exc)


@router.post("/{escrow_id}/resolve", response_model=TxResponse, status_code=status.HTTP_202_ACCEPTED)
def resolve_escrow_dispute(escrow_id: int, body: ResolveDisputeRequest):
    try:
        return TxResponse(
            tx_hash=_escrow_contract().resolve_dispute(escrow_id, body.release_to_seller)
        )
    except BlockchainError as exc:
        raise map_blockchain_error(exc)


@router.post("/{escrow_id}/cancel", response_model=TxResponse, status_code=status.HTTP_202_ACCEPTED)
def cancel_escrow(escrow_id: int):
    try:
        return TxResponse(tx_hash=_escrow_contract().cancel_escrow(escrow_id))
    except BlockchainError as exc:
        raise map_blockchain_error(exc)


@router.post("/fee-rate", response_model=TxResponse, status_code=status.HTTP_202_ACCEPTED)
def set_escrow_fee_rate(body: SetEscrowFeeRateRequest):
    try:
        return TxResponse(tx_hash=_escrow_contract().set_escrow_fee_rate(body.rate_bps))
    except BlockchainError as exc:
        raise map_blockchain_error(exc)


@router.post("/auto-release-timeout", response_model=TxResponse, status_code=status.HTTP_202_ACCEPTED)
def set_auto_release_timeout(body: SetAutoReleaseTimeoutRequest):
    try:
        return TxResponse(tx_hash=_escrow_contract().set_auto_release_timeout(body.timeout_seconds))
    except BlockchainError as exc:
        raise map_blockchain_error(exc)


@router.post("/arbiters/authorize", response_model=TxResponse, status_code=status.HTTP_202_ACCEPTED)
def set_arbiter_authorization(body: SetArbiterAuthorizationRequest):
    try:
        return TxResponse(
            tx_hash=_escrow_contract().set_arbiter_authorization(body.arbiter, body.authorized)
        )
    except BlockchainError as exc:
        raise map_blockchain_error(exc)


@router.post("/fees/withdraw", response_model=TxResponse, status_code=status.HTTP_202_ACCEPTED)
def withdraw_escrow_fees():
    try:
        return TxResponse(tx_hash=_escrow_contract().withdraw_fees())
    except BlockchainError as exc:
        raise map_blockchain_error(exc)
