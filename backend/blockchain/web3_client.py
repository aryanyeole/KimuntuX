"""
blockchain/web3_client.py
─────────────────────────
Task 9.1.1 — Web3.py environment and connection management
Task 9.1.2 — Contract loading and configuration

Provides a singleton ``Web3Client`` that:
  • Connects to Sepolia via primary RPC with automatic fallback
  • Validates chain-id on startup so mis-configuration fails fast
  • Loads all deployed contracts from ABI files at startup
  • Exposes the platform account for signing transactions
  • Provides health-check and gas-price helpers used by contract wrappers

Usage
-----
    from blockchain.web3_client import get_client

    client = get_client()           # returns the singleton, creates it on first call
    contract = client.commission    # pre-loaded Contract object
    w3       = client.w3            # underlying Web3 instance
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

from config.settings import settings
from blockchain.exceptions import (
    ConfigurationError,
    ConnectionError,
    ContractNotFoundError,
    GasError,
    NetworkError,
)

logger = logging.getLogger(__name__)

# Path to bundled ABI files
_ABI_DIR = Path(__file__).parent / "abis"


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _load_abi(filename: str) -> list:
    """Load and parse an ABI JSON file from the abis/ directory."""
    path = _ABI_DIR / filename
    if not path.exists():
        raise ConfigurationError(
            f"ABI file not found: {path}. "
            "Ensure blockchain/abis/ contains the compiled contract ABIs."
        )
    with path.open() as fh:
        return json.load(fh)


def _build_web3(rpc_url: str) -> Web3:
    """Create a Web3 instance connected to *rpc_url*."""
    w3 = Web3(Web3.HTTPProvider(rpc_url, request_kwargs={"timeout": 30}))
    # Inject PoA middleware for Sepolia (extra data field > 32 bytes)
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
                logger.info("Connected to Sepolia via %s RPC (%s)", label, url)
                return w3
            logger.warning("%s RPC not connected: %s", label.capitalize(), url)
        except Exception as exc:
            logger.warning("%s RPC error (%s): %s", label.capitalize(), url, exc)

    raise ConnectionError(
        "Unable to connect to Sepolia. "
        "Check SEPOLIA_RPC_URL (and optionally SEPOLIA_RPC_FALLBACK) in your .env file.",
        detail={"primary": primary_url, "fallback": fallback_url},
    )


# ─────────────────────────────────────────────────────────────────────────────
# Web3Client
# ─────────────────────────────────────────────────────────────────────────────

class Web3Client:
    """
    Initialised once at startup.  All state is read-only after __init__.

    Attributes
    ----------
    w3 : Web3
        Connected Web3 instance (Sepolia).
    account : LocalAccount
        Platform signing account derived from ``PLATFORM_PRIVATE_KEY``.
    commission : Contract
        Loaded KimuntuXCommissionSystem contract.
    wallet : Contract
        Loaded KimuntuXWallet contract.
    """

    def __init__(self) -> None:
        cfg = settings.blockchain

        # ── 1. Validate settings early ────────────────────────────────────
        self._validate_config(cfg)

        # ── 2. Connect ─────────────────────────────────────────────────────
        self.w3: Web3 = _try_connect(cfg.sepolia_rpc_url, cfg.sepolia_rpc_fallback)

        # ── 3. Validate network ────────────────────────────────────────────
        self._validate_network(cfg.expected_chain_id)

        # ── 4. Load signing account ────────────────────────────────────────
        self.account: LocalAccount = Account.from_key(cfg.platform_private_key)
        logger.info("Platform wallet: %s", self.account.address)

        if cfg.platform_address and (
            cfg.platform_address.lower() != self.account.address.lower()
        ):
            raise ConfigurationError(
                "PLATFORM_ADDRESS does not match the address derived from "
                "PLATFORM_PRIVATE_KEY. Either remove PLATFORM_ADDRESS or correct it.",
                detail={
                    "configured": cfg.platform_address,
                    "derived": self.account.address,
                },
            )

        # ── 5. Load contracts ──────────────────────────────────────────────
        self.commission: Contract = self._load_contract(
            "CommissionSystem.json",
            cfg.commission_contract_address,
            "KimuntuXCommissionSystem",
        )
        self.wallet: Contract = self._load_contract(
            "Wallet.json",
            cfg.wallet_contract_address,
            "KimuntuXWallet",
        )

        logger.info(
            "Contracts loaded — CommissionSystem: %s | Wallet: %s",
            cfg.commission_contract_address,
            cfg.wallet_contract_address,
        )

    # ── Private helpers ────────────────────────────────────────────────────

    @staticmethod
    def _validate_config(cfg) -> None:
        """Fail fast on obviously wrong settings before touching the network."""
        missing = []
        if not cfg.sepolia_rpc_url or "YOUR_ALCHEMY_KEY_HERE" in cfg.sepolia_rpc_url:
            missing.append("SEPOLIA_RPC_URL")
        if not cfg.platform_private_key:
            missing.append("PLATFORM_PRIVATE_KEY")
        if not cfg.commission_contract_address or "Your" in cfg.commission_contract_address:
            missing.append("COMMISSION_CONTRACT_ADDRESS")
        if not cfg.wallet_contract_address or "Your" in cfg.wallet_contract_address:
            missing.append("WALLET_CONTRACT_ADDRESS")

        if missing:
            raise ConfigurationError(
                f"Missing or placeholder values for: {', '.join(missing)}. "
                "Copy .env.example to .env and fill in real values.",
                detail={"missing_vars": missing},
            )

    def _validate_network(self, expected_chain_id: int) -> None:
        """Raise NetworkError if connected to the wrong chain."""
        try:
            actual = self.w3.eth.chain_id
        except Exception as exc:
            raise ConnectionError(
                f"Failed to retrieve chain id: {exc}"
            ) from exc

        if actual != expected_chain_id:
            raise NetworkError(
                f"Connected to chain {actual}, expected {expected_chain_id} (Sepolia). "
                "Check your RPC URL.",
                expected_chain_id=expected_chain_id,
                actual_chain_id=actual,
            )
        logger.info("Network validated — chain id: %d (Sepolia)", actual)

    def _load_contract(
        self, abi_filename: str, address: str, label: str
    ) -> Contract:
        """
        Load contract ABI and verify the address has deployed code.

        Raises
        ------
        ContractNotFoundError
            If ``eth_get_code`` returns empty bytes for *address*.
        """
        abi = _load_abi(abi_filename)
        checksum_addr = Web3.to_checksum_address(address)

        code = self.w3.eth.get_code(checksum_addr)
        if code == b"" or code == "0x":
            raise ContractNotFoundError(
                f"{label} contract has no code at {checksum_addr}. "
                "Ensure the contract is deployed to Sepolia and the address is correct.",
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
        """
        Return a dict with connection health information.

        Used by ``GET /health`` to surface blockchain status without
        exposing sensitive details.
        """
        try:
            block = self.w3.eth.block_number
            gas_price_gwei = round(
                self.w3.from_wei(self.w3.eth.gas_price, "gwei"), 2
            )
            balance_wei = self.w3.eth.get_balance(self.account.address)
            return {
                "status": "healthy",
                "chain_id": self.w3.eth.chain_id,
                "latest_block": block,
                "gas_price_gwei": gas_price_gwei,
                "platform_balance_eth": round(
                    float(self.w3.from_wei(balance_wei, "ether")), 6
                ),
            }
        except Exception as exc:
            logger.error("Health check failed: %s", exc)
            return {"status": "unhealthy", "error": str(exc)}

    def get_gas_price(self) -> int:
        """
        Return current gas price in Wei, capped at ``max_gas_price_gwei``.

        Raises
        ------
        GasError
            If the live gas price exceeds the configured cap.
        """
        cfg = settings.blockchain
        raw_wei = self.w3.eth.gas_price
        current_gwei = float(self.w3.from_wei(raw_wei, "gwei"))
        cap_gwei = cfg.max_gas_price_gwei

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
        """
        Estimate gas for *transaction* and apply the configured buffer.

        Returns an integer gas limit rounded up to the nearest 1000.
        """
        cfg = settings.blockchain
        try:
            estimated = self.w3.eth.estimate_gas(transaction)
        except Exception as exc:
            raise GasError(
                f"Gas estimation failed: {exc}",
                detail={"transaction": str(transaction)},
            ) from exc

        buffered = int(estimated * cfg.gas_limit_buffer)
        # Round up to nearest 1000 for cleaner receipts
        rounded = ((buffered + 999) // 1000) * 1000
        logger.debug("Gas estimated: %d → buffered: %d", estimated, rounded)
        return rounded

    def build_tx_params(self, value_wei: int = 0) -> dict:
        """
        Return common transaction parameters for signing.

        Parameters
        ----------
        value_wei:
            Amount of ETH (in Wei) to attach to the transaction.
        """
        nonce = self.w3.eth.get_transaction_count(self.account.address, "pending")
        return {
            "from": self.account.address,
            "nonce": nonce,
            "gasPrice": self.get_gas_price(),
            "value": value_wei,
            "chainId": self.w3.eth.chain_id,
        }

    def sign_and_send(self, tx: dict) -> str:
        """
        Sign *tx* with the platform key and broadcast it.

        Returns
        -------
        str
            Transaction hash as a hex string (``0x...``).
        """
        signed = self.account.sign_transaction(tx)
        tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
        hex_hash = self.w3.to_hex(tx_hash)
        logger.info("Transaction sent: %s", hex_hash)
        return hex_hash

    def wait_for_receipt(self, tx_hash: str) -> dict:
        """
        Poll for the transaction receipt until confirmed or timeout.

        Returns
        -------
        dict
            The transaction receipt.

        Raises
        ------
        TransactionTimeoutError
            If no receipt is received within the configured timeout.
        TransactionRevertedError
            If the receipt status is 0 (reverted).
        """
        from blockchain.exceptions import TransactionRevertedError, TransactionTimeoutError

        cfg = settings.blockchain
        timeout = cfg.transaction_timeout_seconds
        poll_interval = 3  # seconds
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

        from blockchain.exceptions import TransactionTimeoutError
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
    Return the shared ``Web3Client`` singleton.

    Creates the client on the first call (lazy initialisation so the app can
    import this module during tests without immediately reading env vars).
    Thread safety: FastAPI runs in a single async event loop for startup,
    so the double-init race is not a concern in practice.
    """
    global _client
    if _client is None:
        _client = Web3Client()
    return _client


def reset_client() -> None:
    """
    Discard the singleton.

    Call this in tests to force re-initialisation with patched env vars.
    Not intended for production use.
    """
    global _client
    _client = None
