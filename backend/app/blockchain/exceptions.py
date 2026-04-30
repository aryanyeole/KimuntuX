"""Custom exceptions for blockchain operations."""


class BlockchainError(Exception):
    """Base exception for all blockchain-related errors."""

    def __init__(self, message: str, detail: dict = None, **kwargs):
        super().__init__(message)
        merged = dict(detail or {})
        merged.update(kwargs)
        self.detail = merged


class ConfigurationError(BlockchainError):
    """Raised when blockchain configuration is invalid or missing."""


class ConnectionError(BlockchainError):
    """Raised when unable to connect to the blockchain RPC."""


class NetworkError(BlockchainError):
    """Raised when connected to the wrong chain."""


class ContractNotFoundError(BlockchainError):
    """Raised when a contract address has no deployed code."""


class ContractCallError(BlockchainError):
    """Raised when a read-only contract call fails."""


class TransactionRevertedError(BlockchainError):
    """Raised when a transaction is reverted on-chain."""


class TransactionTimeoutError(BlockchainError):
    """Raised when no receipt arrives within the timeout."""


class InsufficientFundsError(BlockchainError):
    """Raised when the platform wallet has insufficient ETH."""


class GasError(BlockchainError):
    """Raised when gas price exceeds the configured cap, or estimation fails."""
