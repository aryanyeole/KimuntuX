"""Blockchain integration layer for KimuntuX."""

from app.blockchain.exceptions import (
    BlockchainError,
    ConfigurationError,
    ConnectionError,
    ContractCallError,
    ContractNotFoundError,
    GasError,
    InsufficientFundsError,
    NetworkError,
    TransactionRevertedError,
    TransactionTimeoutError,
)
from app.blockchain.web3_client import Web3Client, get_client

__all__ = [
    "BlockchainError",
    "ConfigurationError",
    "ConnectionError",
    "ContractCallError",
    "ContractNotFoundError",
    "GasError",
    "InsufficientFundsError",
    "NetworkError",
    "TransactionRevertedError",
    "TransactionTimeoutError",
    "Web3Client",
    "get_client",
]
