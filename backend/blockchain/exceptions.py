"""
blockchain/exceptions.py
────────────────────────
Custom exception hierarchy for all blockchain-related errors.

Raise these from `web3_client.py` and contract wrappers so that the
FastAPI layer can catch them at a single point and return structured
HTTP responses without leaking internal Web3.py stack traces.

Hierarchy
---------
BlockchainError                   (base — never raised directly)
├── ConnectionError               — cannot reach any RPC endpoint
├── NetworkError                  — wrong chain-id, unexpected network
├── ContractError                 — base for on-chain interaction problems
│   ├── ContractNotFoundError     — contract not deployed at given address
│   ├── ContractCallError         — eth_call reverted / bad return data
│   └── TransactionError          — transaction reverted or failed
│       ├── TransactionRevertedError  — explicit EVM revert (has reason)
│       ├── TransactionTimeoutError   — receipt not seen within timeout
│       └── InsufficientFundsError    — sender balance too low for gas
├── GasError                      — gas estimation or price limit exceeded
└── ConfigurationError            — bad environment variables / settings
"""

from __future__ import annotations


# ─────────────────────────────────────────────────────────────────────────────
# Base
# ─────────────────────────────────────────────────────────────────────────────

class BlockchainError(Exception):
    """Root of all blockchain-related exceptions.

    All subclasses accept an optional *detail* kwarg so callers can
    attach structured context without subclassing further.
    """

    def __init__(self, message: str, *, detail: dict | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.detail = detail or {}

    def __repr__(self) -> str:
        return f"{type(self).__name__}({self.message!r}, detail={self.detail!r})"


# ─────────────────────────────────────────────────────────────────────────────
# Connection / Network
# ─────────────────────────────────────────────────────────────────────────────

class ConnectionError(BlockchainError):  # noqa: A001  (shadows built-in intentionally)
    """Failed to connect to any configured RPC endpoint.

    Raised when both the primary and fallback RPC URLs are unreachable
    or return non-200 responses.
    """


class NetworkError(BlockchainError):
    """Connected to the wrong Ethereum network.

    Raised when the chain-id returned by the node does not match
    ``settings.blockchain.expected_chain_id``.

    Attributes
    ----------
    expected_chain_id:
        The chain-id we required (e.g. 11155111 for Sepolia).
    actual_chain_id:
        The chain-id the node actually returned.
    """

    def __init__(
        self,
        message: str,
        *,
        expected_chain_id: int,
        actual_chain_id: int,
        detail: dict | None = None,
    ) -> None:
        super().__init__(message, detail=detail)
        self.expected_chain_id = expected_chain_id
        self.actual_chain_id = actual_chain_id


# ─────────────────────────────────────────────────────────────────────────────
# Contract errors
# ─────────────────────────────────────────────────────────────────────────────

class ContractError(BlockchainError):
    """Base class for errors that arise from interacting with a contract."""


class ContractNotFoundError(ContractError):
    """No code exists at the given contract address.

    Raised during startup when ``web3.eth.get_code(address)`` returns
    empty bytes, indicating the contract has not been deployed.
    """


class ContractCallError(ContractError):
    """A read-only ``eth_call`` failed or returned unexpected data.

    Raised for reverts on view/pure functions and ABI decode errors.
    """


class TransactionError(ContractError):
    """Base class for errors that occur during transaction submission."""


class TransactionRevertedError(TransactionError):
    """The EVM explicitly reverted the transaction.

    Attributes
    ----------
    tx_hash:
        The transaction hash, if the tx was submitted before reverting.
    revert_reason:
        Human-readable revert reason string extracted from the receipt
        or from the ``eth_call`` simulation, if available.
    """

    def __init__(
        self,
        message: str,
        *,
        tx_hash: str | None = None,
        revert_reason: str | None = None,
        detail: dict | None = None,
    ) -> None:
        super().__init__(message, detail=detail)
        self.tx_hash = tx_hash
        self.revert_reason = revert_reason


class TransactionTimeoutError(TransactionError):
    """Transaction was submitted but a receipt was not seen in time.

    Attributes
    ----------
    tx_hash:
        The hash of the submitted transaction.
    timeout_seconds:
        How long we waited before giving up.
    """

    def __init__(
        self,
        message: str,
        *,
        tx_hash: str,
        timeout_seconds: int,
        detail: dict | None = None,
    ) -> None:
        super().__init__(message, detail=detail)
        self.tx_hash = tx_hash
        self.timeout_seconds = timeout_seconds


class InsufficientFundsError(TransactionError):
    """The signing account does not have enough ETH to pay for gas.

    Attributes
    ----------
    required_wei:
        Estimated gas cost in Wei.
    available_wei:
        Current balance of the signing account in Wei.
    """

    def __init__(
        self,
        message: str,
        *,
        required_wei: int,
        available_wei: int,
        detail: dict | None = None,
    ) -> None:
        super().__init__(message, detail=detail)
        self.required_wei = required_wei
        self.available_wei = available_wei


# ─────────────────────────────────────────────────────────────────────────────
# Gas / Configuration
# ─────────────────────────────────────────────────────────────────────────────

class GasError(BlockchainError):
    """Gas estimation failed or the current gas price exceeds the cap.

    Attributes
    ----------
    current_gwei:
        The gas price (in gwei) that triggered the error, if available.
    max_gwei:
        The configured ``MAX_GAS_PRICE_GWEI`` cap.
    """

    def __init__(
        self,
        message: str,
        *,
        current_gwei: float | None = None,
        max_gwei: int | None = None,
        detail: dict | None = None,
    ) -> None:
        super().__init__(message, detail=detail)
        self.current_gwei = current_gwei
        self.max_gwei = max_gwei


class ConfigurationError(BlockchainError):
    """Invalid or missing environment variable / settings.

    Raised on startup before any network connection is attempted so the
    process exits immediately with a clear message.
    """
