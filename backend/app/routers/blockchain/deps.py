"""
app/routers/blockchain/deps.py
────────────────────────────────
Shared dependencies and error mapping for all blockchain routers.
"""

from fastapi import HTTPException, status

from app.blockchain.exceptions import (
    BlockchainError,
    ContractCallError,
    GasError,
    InsufficientFundsError,
    TransactionRevertedError,
    TransactionTimeoutError,
)


def map_blockchain_error(exc: BlockchainError) -> HTTPException:
    """Convert a BlockchainError to an appropriate HTTP exception."""
    if isinstance(exc, (TransactionRevertedError, ContractCallError)):
        return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    if isinstance(exc, (InsufficientFundsError, GasError)):
        return HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail=str(exc))
    if isinstance(exc, TransactionTimeoutError):
        return HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail=str(exc))
    return HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))
