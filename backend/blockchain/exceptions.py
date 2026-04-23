"""
blockchain/exceptions.py
────────────────────────
Custom exceptions for blockchain operations.
"""


class BlockchainError(Exception):
    """Base exception for all blockchain-related errors."""

    def __init__(self, message: str, detail: dict = None, **kwargs):
        super().__init__(message)
        merged_detail = dict(detail or {})
        merged_detail.update(kwargs)
        self.detail = merged_detail


class ConfigurationError(BlockchainError):
    """Raised when blockchain configuration is invalid or missing."""
    pass


class ConnectionError(BlockchainError):
    """Raised when unable to connect to blockchain RPC."""
    pass


class NetworkError(BlockchainError):
    """Raised when network-related errors occur."""
    pass


class ContractNotFoundError(BlockchainError):
    """Raised when a contract cannot be loaded or found."""
    pass


class ContractCallError(BlockchainError):
    """Raised when a contract call fails."""
    pass


class TransactionRevertedError(BlockchainError):
    """Raised when a transaction is reverted by the blockchain."""
    pass


class TransactionTimeoutError(BlockchainError):
    """Raised when a transaction times out waiting for confirmation."""
    pass


class InsufficientFundsError(BlockchainError):
    """Raised when account has insufficient funds for transaction."""
    pass


class GasError(BlockchainError):
    """Raised when gas-related errors occur."""
    pass
