from __future__ import annotations

from web3.exceptions import TransactionNotFound

from fastapi import APIRouter, HTTPException

from api.models import TransactionStatusResponse
from blockchain.web3_client import get_client

router = APIRouter(prefix="/network", tags=["Network"])


@router.get("/transactions/{tx_hash}", response_model=TransactionStatusResponse)
def get_transaction_status(tx_hash: str):
    """Return the current lifecycle status for a submitted blockchain transaction."""
    try:
        client = get_client()
        receipt = client.w3.eth.get_transaction_receipt(tx_hash)
        latest_block = client.w3.eth.block_number
        return TransactionStatusResponse(
            tx_hash=tx_hash,
            status="success" if receipt.status == 1 else "reverted",
            block_number=receipt.blockNumber,
            gas_used=receipt.gasUsed,
            confirmations=max(latest_block - receipt.blockNumber + 1, 0),
        )
    except TransactionNotFound:
        try:
            get_client().w3.eth.get_transaction(tx_hash)
            return TransactionStatusResponse(tx_hash=tx_hash, status="pending")
        except TransactionNotFound:
            return TransactionStatusResponse(tx_hash=tx_hash, status="not_found")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
