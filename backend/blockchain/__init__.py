"""
blockchain package
──────────────────
Blockchain integration layer for KimuntuX.
"""

from blockchain.exceptions import (
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
from blockchain.web3_client import Web3Client, get_client

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
