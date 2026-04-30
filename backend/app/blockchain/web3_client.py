"""
app/blockchain/web3_client.py
──────────────────────────────
Provides a singleton Web3Client that:
  • Connects to Sepolia via primary RPC with automatic fallback
  • Validates chain-id on startup so mis-configuration fails fast
  • Loads all deployed contracts from ABI files at startup
  • Exposes the platform account for signing transactions
  • Provides health-check and gas-price helpers used by contract wrappers

Usage
-----
    from app.blockchain.web3_client import get_client

    client = get_client()           # returns singleton, creates on first call
    contract = client.commission    # pre-loaded Contract object
    w3       = client.w3            # underlying Web3 instance

Architecture note: We use a single worker (not multiple) because the
Web3Client singleton holds a single stateful connection. Horizontal
scaling should be achieved by running multiple containers rather than
multiple workers in one process.
"""

from __future__ import annotations

import json
import logging
import time
from functools import lru_cache
from pathlib import Path
from typing import Optional

from web3 import Web3
from web3.contract import Contract
from web3.middleware import ExtraDataToPOAMiddleware
from eth_account import Account
from eth_account.signers.local import LocalAccount

from app.core.config import settings
from app.blockchain.exceptions import (
    ConfigurationError,
    ConnectionError,
    ContractNotFoundError,
    GasError,
    NetworkError,
)

logger = logging.getLogger(__name__)

# Path to bundled ABI files
_ABI_DIR = Path(__file__).parent / "abis"
_REPO_ROOT = Path(__file__).resolve().parents[3]
_ARTIFACTS_CANDIDATES = [
    _REPO_ROOT / "KimuX_BlockchainIntegration" / "artifacts" / "contracts",
    _REPO_ROOT / "KimuntuX_BlockchainIntegration" / "artifacts" / "contracts",
]

_ABI_ARTIFACT_ALIASES = {
    "CommissionSystem.json": ["KimuXCommissionSystem.json"],
    "Wallet.json": ["KimuXWallet.json"],
}


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _load_abi(filename: str) -> list:
    """Load and parse an ABI JSON file from the abis/ directory."""
    path = _ABI_DIR / filename
    if path.exists():
        with path.open() as fh:
            return json.load(fh)

    candidate_names = [*_ABI_ARTIFACT_ALIASES.get(filename, []), filename]

    for artifacts_dir in _ARTIFACTS_CANDIDATES:
        if not artifacts_dir.exists():
            continue
        for candidate in candidate_names:
            for artifact_path in artifacts_dir.rglob(candidate):
                if artifact_path.name.endswith(".dbg.json"):
                    continue
                with artifact_path.open() as fh:
                    artifact = json.load(fh)
                if "abi" in artifact:
                    return artifact["abi"]

    raise ConfigurationError(
        f"ABI file not found: {path}. "
        "Ensure app/blockchain/abis/ contains the compiled contract ABIs "
        "or KimuX_BlockchainIntegration/artifacts has been built."
    )


def _build_web3(rpc_url: str) -> Web3:
    """Create a Web3 instance connected to *rpc_url*."""
    w3 = Web3(Web3.HTTPProvider(rpc_url, request_kwargs={"timeout": 30}))
    w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
    return w3


def _try_connect(primary_url: str, fallback_url: Optional[str]) -> Web3:
    """
    Attempt connection to *primary_url*, then *fallback_url* if provided.

    Returns a connected Web3 instance or raises ``ConnectionError``.
    """
    for label, url in [("primary", primary_url), ("fallback", fallback_url)]:
        if not url:
            continue
        try:
            w3 = _build_web3(url)
            if w3.is_connected():
                logger.info("Connected to RPC via %s endpoint (%s)", label, url)
                return w3
            logger.warning("%s RPC not connected: %s", label.capitalize(), url)
        except Exception as exc:
            logger.warning("%s RPC error (%s): %s", label.capitalize(), url, exc)

    raise ConnectionError(
        "Unable to connect to the configured RPC endpoint. "
        "Check SEPOLIA_RPC_URL (and optionally SEPOLIA_RPC_FALLBACK) in your .env file.",
        detail={"primary": primary_url, "fallback": fallback_url},
    )


# ─────────────────────────────────────────────────────────────────────────────
# Web3Client
# ─────────────────────────────────────────────────────────────────────────────

class Web3Client:
    """
    Initialised once at startup. All state is read-only after __init__.

    Attributes
    ----------
    w3 : Web3
        Connected Web3 instance (Sepolia or configured network).
    account : LocalAccount
        Platform signing account derived from ``PLATFORM_PRIVATE_KEY``.
    commission : Contract
        Loaded KimuXCommissionSystem contract.
    wallet : Contract
        Loaded KimuXWallet contract.
    escrow : Contract | None
        Loaded PaymentEscrow contract (None if not configured).
    """

    def __init__(self) -> None:
        self._validate_config()

        # ── 1. Connect ─────────────────────────────────────────────────────
        self.w3: Web3 = _try_connect(settings.sepolia_rpc_url, settings.sepolia_rpc_fallback)

        # ── 2. Validate network ─────────────────────────────────────────────
        self._validate_network(settings.expected_chain_id)

        # ── 3. Load signing account ─────────────────────────────────────────
        self.account: LocalAccount = Account.from_key(settings.platform_private_key)
        logger.info("Platform wallet: %s", self.account.address)

        if settings.platform_address and (
            settings.platform_address.lower() != self.account.address.lower()
        ):
            raise ConfigurationError(
                "PLATFORM_ADDRESS does not match the address derived from "
                "PLATFORM_PRIVATE_KEY. Either remove PLATFORM_ADDRESS or correct it.",
                detail={
                    "configured": settings.platform_address,
                    "derived": self.account.address,
                },
            )

        # ── 4. Load contracts ───────────────────────────────────────────────
        self.commission: Contract = self._load_contract(
            "CommissionSystem.json",
            settings.commission_contract_address,
            "KimuXCommissionSystem",
        )
        self.wallet: Contract = self._load_contract(
            "Wallet.json",
            settings.wallet_contract_address,
            "KimuXWallet",
        )
        self.escrow: Contract | None = None
        if settings.escrow_contract_address:
            self.escrow = self._load_contract(
                "PaymentEscrow.json",
                settings.escrow_contract_address,
                "PaymentEscrow",
            )

        logger.info(
            "Contracts loaded — CommissionSystem: %s | Wallet: %s | Escrow: %s",
            settings.commission_contract_address,
            settings.wallet_contract_address,
            settings.escrow_contract_address or "disabled",
        )

    # ── Private helpers ────────────────────────────────────────────────────

    @staticmethod
    def _validate_config() -> None:
        """Fail fast on obviously wrong or missing settings."""
        missing = []
        if not settings.sepolia_rpc_url or "YOUR_ALCHEMY_KEY_HERE" in settings.sepolia_rpc_url:
            missing.append("SEPOLIA_RPC_URL")
        if not settings.platform_private_key:
            missing.append("PLATFORM_PRIVATE_KEY")
        if not settings.commission_contract_address or "Your" in settings.commission_contract_address:
            missing.append("COMMISSION_CONTRACT_ADDRESS")
        if not settings.wallet_contract_address or "Your" in settings.wallet_contract_address:
            missing.append("WALLET_CONTRACT_ADDRESS")

        if missing:
            raise ConfigurationError(
                f"Missing or placeholder values for: {', '.join(missing)}. "
                "Copy .env.example to .env and fill in real values.",
                detail={"missing_vars": missing},
            )

        if not settings.sepolia_rpc_fallback:
            logger.warning(
                "SEPOLIA_RPC_FALLBACK is not set. "
                "The service will have no redundancy if the primary RPC fails."
            )

    def _validate_network(self, expected_chain_id: int) -> None:
        """Raise NetworkError if connected to the wrong chain."""
        try:
            actual = self.w3.eth.chain_id
        except Exception as exc:
            raise ConnectionError(f"Failed to retrieve chain id: {exc}") from exc

        if actual != expected_chain_id:
            raise NetworkError(
                f"Connected to chain {actual}, expected {expected_chain_id}. "
                "Check your RPC URL.",
                expected_chain_id=expected_chain_id,
                actual_chain_id=actual,
            )
        logger.info("Network validated — chain id: %d", actual)

    def _load_contract(self, abi_filename: str, address: str, label: str) -> Contract:
        """
        Load contract ABI and verify the address has deployed code.

        Raises ContractNotFoundError if eth_get_code returns empty bytes.
        """
        abi = _load_abi(abi_filename)
        checksum_addr = Web3.to_checksum_address(address)

        code = self.w3.eth.get_code(checksum_addr)
        if code == b"" or code == "0x":
            raise ContractNotFoundError(
                f"{label} contract has no code at {checksum_addr}. "
                "Ensure the contract is deployed and the address is correct.",
                detail={"address": checksum_addr, "label": label},
            )

        contract = self.w3.eth.contract(address=checksum_addr, abi=abi)
        logger.debug("%s contract loaded at %s", label, checksum_addr)
        return contract

    # ── Public helpers used by contract wrappers ───────────────────────────

    def is_connected(self) -> bool:
        """Return True if the underlying Web3 connection is alive."""
        try:
            return self.w3.is_connected()
        except Exception:
            return False

    def health_check(self) -> dict:
        """Return a dict with connection health information for GET /health."""
        try:
            block = self.w3.eth.block_number
            gas_price_gwei = round(self.w3.from_wei(self.w3.eth.gas_price, "gwei"), 2)
            balance_wei = self.w3.eth.get_balance(self.account.address)
            return {
                "status": "healthy",
                "chain_id": self.w3.eth.chain_id,
                "latest_block": block,
                "gas_price_gwei": gas_price_gwei,
                "platform_balance_eth": round(float(self.w3.from_wei(balance_wei, "ether")), 6),
                "contracts": {
                    "commission": self._contract_status(self.commission),
                    "wallet": self._contract_status(self.wallet),
                    "escrow": self._contract_status(self.escrow),
                },
            }
        except Exception as exc:
            logger.error("Health check failed: %s", exc)
            return {"status": "unhealthy", "error": str(exc)}

    def _contract_status(self, contract: Contract | None) -> dict:
        if contract is None:
            return {"configured": False, "loaded": False}
        return {"configured": True, "loaded": True, "address": contract.address}

    def get_gas_price(self) -> int:
        """Return current gas price in Wei, capped at ``max_gas_price_gwei``."""
        raw_wei = self.w3.eth.gas_price
        current_gwei = float(self.w3.from_wei(raw_wei, "gwei"))
        cap_gwei = settings.max_gas_price_gwei

        if current_gwei > cap_gwei:
            raise GasError(
                f"Gas price {current_gwei:.1f} gwei exceeds cap of {cap_gwei} gwei. "
                "Transaction rejected to protect against unexpected fee spikes.",
                current_gwei=current_gwei,
                max_gwei=cap_gwei,
            )

        logger.debug("Gas price: %.1f gwei (cap: %d gwei)", current_gwei, cap_gwei)
        return raw_wei

    def estimate_gas(self, transaction: dict) -> int:
        """Estimate gas for *transaction* and apply the configured buffer."""
        try:
            estimated = self.w3.eth.estimate_gas(transaction)
        except Exception as exc:
            raise GasError(
                f"Gas estimation failed: {exc}",
                detail={"transaction": str(transaction)},
            ) from exc

        buffered = int(estimated * settings.gas_limit_buffer)
        rounded = ((buffered + 999) // 1000) * 1000
        logger.debug("Gas estimated: %d → buffered: %d", estimated, rounded)
        return rounded

    def build_tx_params(self, value_wei: int = 0) -> dict:
        """Return common transaction parameters for signing."""
        nonce = self.w3.eth.get_transaction_count(self.account.address, "pending")
        return {
            "from": self.account.address,
            "nonce": nonce,
            "gasPrice": self.get_gas_price(),
            "value": value_wei,
            "chainId": self.w3.eth.chain_id,
        }

    def sign_and_send(self, tx: dict) -> str:
        """Sign *tx* with the platform key and broadcast it. Returns tx hash."""
        signed = self.account.sign_transaction(tx)
        tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
        hex_hash = self.w3.to_hex(tx_hash)
        logger.info("Transaction sent: %s", hex_hash)
        return hex_hash

    def wait_for_receipt(self, tx_hash: str) -> dict:
        """
        Poll for the transaction receipt until confirmed or timeout.

        Raises TransactionTimeoutError or TransactionRevertedError.
        """
        from app.blockchain.exceptions import TransactionRevertedError, TransactionTimeoutError

        timeout = settings.transaction_timeout_seconds
        poll_interval = 3
        deadline = time.monotonic() + timeout

        logger.info("Waiting for receipt: %s (timeout=%ds)", tx_hash, timeout)

        while time.monotonic() < deadline:
            try:
                receipt = self.w3.eth.get_transaction_receipt(tx_hash)
                if receipt is not None:
                    if receipt.status == 0:
                        raise TransactionRevertedError(
                            f"Transaction {tx_hash} reverted on-chain.",
                            tx_hash=tx_hash,
                            revert_reason=None,
                        )
                    logger.info(
                        "Transaction confirmed in block %d: %s",
                        receipt.blockNumber,
                        tx_hash,
                    )
                    return dict(receipt)
            except TransactionRevertedError:
                raise
            except Exception as exc:
                logger.debug("Receipt poll error (will retry): %s", exc)

            time.sleep(poll_interval)

        raise TransactionTimeoutError(
            f"No receipt for {tx_hash} after {timeout}s.",
            tx_hash=tx_hash,
            timeout_seconds=timeout,
        )


# ─────────────────────────────────────────────────────────────────────────────
# Module-level singleton
# ─────────────────────────────────────────────────────────────────────────────

_client: Optional[Web3Client] = None


def get_client() -> Web3Client:
    """
    Return the shared Web3Client singleton.

    Creates the client on the first call (lazy initialization so the app can
    import this module during tests without immediately reading env vars).
    """
    global _client
    if _client is None:
        _client = Web3Client()
    return _client


def reset_client() -> None:
    """Discard the singleton. Call in tests to force re-initialization."""
    global _client
    _client = None
