"""
blockchain/contracts/wallet.py
───────────────────────────────
High-level Python wrapper around the deployed KimuntuXWallet contract.

All ETH amounts are in ETH (float) at the API boundary and converted to/from
Wei internally so callers never deal with Wei directly.

Contract functions covered
--------------------------
Read (eth_call)
  • has_wallet(owner)                         → bool
  • get_eth_balance(owner)                    → float (ETH)
  • get_token_balance(owner, token)           → int (raw token units)
  • get_all_balances(owner)                   → WalletBalances
  • get_wallet_details(owner)                 → WalletDetails
  • get_total_wallets()                        → int
  • get_supported_tokens()                     → list[str] (addresses)
  • is_paused()                               → bool

Write (signed transaction)
  • create_wallet()
  • create_wallet_for(user)
  • deposit_eth(amount_eth)
  • credit_eth(user, amount_eth)
  • deposit_token(token, amount)
  • credit_token(user, token, amount)
  • withdraw_eth(amount_eth)
  • withdraw_all_eth()
  • withdraw_token(token, amount)
  • transfer_eth(recipient, amount_eth)
  • transfer_token(recipient, token, amount)
  • add_supported_token(token, symbol)
  • remove_supported_token(token)
  • authorize_platform(platform)
  • revoke_platform(platform)
  • update_minimum_withdrawal(amount_eth)
  • pause() / unpause()
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import TYPE_CHECKING

from web3 import Web3

from blockchain.exceptions import ContractCallError, InsufficientFundsError
from blockchain.web3_client import Web3Client

if TYPE_CHECKING:
    pass

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Data models
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class WalletBalances:
    """Returned by getAllBalances() — all balances for a single wallet."""
    eth_balance: float                           # ETH
    token_balances: dict[str, int] = field(default_factory=dict)
    # token_address (checksum) → raw token units (caller handles decimals)


@dataclass
class WalletDetails:
    """Returned by getWalletDetails()."""
    owner: str           # checksum address
    eth_balance: float   # ETH
    created_at: int      # Unix epoch seconds
    total_deposits: float
    total_withdrawals: float


# ─────────────────────────────────────────────────────────────────────────────
# WalletContract
# ─────────────────────────────────────────────────────────────────────────────

class WalletContract:
    """
    High-level wrapper around the deployed KimuntuXWallet contract.

    Parameters
    ----------
    client:
        The shared ``Web3Client`` singleton (injected for testability).
    """

    def __init__(self, client: Web3Client) -> None:
        self._client = client
        self._contract = client.wallet
        self._w3 = client.w3

    # ── Utilities ─────────────────────────────────────────────────────────

    def _eth_to_wei(self, eth: float) -> int:
        return self._w3.to_wei(eth, "ether")

    def _wei_to_eth(self, wei: int) -> float:
        return float(self._w3.from_wei(wei, "ether"))

    def _call(self, fn_name: str, *args):
        try:
            fn = getattr(self._contract.functions, fn_name)
            return fn(*args).call()
        except Exception as exc:
            raise ContractCallError(
                f"eth_call to {fn_name}({args}) failed: {exc}",
                detail={"function": fn_name, "args": args},
            ) from exc

    def _send(self, fn_name: str, *args, value_wei: int = 0) -> str:
        balance = self._w3.eth.get_balance(self._client.account.address)
        if balance < value_wei:
            raise InsufficientFundsError(
                "Platform wallet balance insufficient for attached value.",
                required_wei=value_wei,
                available_wei=balance,
            )

        tx_params = self._client.build_tx_params(value_wei=value_wei)
        fn = getattr(self._contract.functions, fn_name)
        tx = fn(*args).build_transaction(tx_params)
        tx["gas"] = self._client.estimate_gas(tx)
        return self._client.sign_and_send(tx)

    # ── Read functions ─────────────────────────────────────────────────────

    def has_wallet(self, owner: str) -> bool:
        """Return True if *owner* has a wallet in the contract."""
        return self._call("hasWallet", Web3.to_checksum_address(owner))

    def get_eth_balance(self, owner: str) -> float:
        """Return the wallet's ETH balance in ETH."""
        address = Web3.to_checksum_address(owner)
        wei = self._call("getETHBalance", address)
        return self._wei_to_eth(wei)

    def get_token_balance(self, owner: str, token: str) -> int:
        """Return the raw token balance (token-native units, not adjusted for decimals)."""
        return self._call(
            "getTokenBalance",
            Web3.to_checksum_address(owner),
            Web3.to_checksum_address(token),
        )

    def get_all_balances(self, owner: str) -> WalletBalances:
        """Return ETH and all token balances for *owner*."""
        address = Web3.to_checksum_address(owner)
        eth_wei, raw_token_balances, token_addresses = self._call(
            "getAllBalances", address
        )
        token_map = {
            Web3.to_checksum_address(addr): bal
            for addr, bal in zip(token_addresses, raw_token_balances)
        }
        return WalletBalances(
            eth_balance=self._wei_to_eth(eth_wei),
            token_balances=token_map,
        )

    def get_wallet_details(self, owner: str) -> WalletDetails:
        """Return full wallet metadata for *owner*."""
        address = Web3.to_checksum_address(owner)
        owner_addr, eth_wei, created_at, deposits_wei, withdrawals_wei = self._call(
            "getWalletDetails", address
        )
        return WalletDetails(
            owner=Web3.to_checksum_address(owner_addr),
            eth_balance=self._wei_to_eth(eth_wei),
            created_at=created_at,
            total_deposits=self._wei_to_eth(deposits_wei),
            total_withdrawals=self._wei_to_eth(withdrawals_wei),
        )

    def get_total_wallets(self) -> int:
        """Return the total number of wallets created."""
        return self._call("getTotalWallets")

    def get_supported_tokens(self) -> list[str]:
        """Return a list of supported token addresses (checksum)."""
        raw = self._call("getSupportedTokens")
        return [Web3.to_checksum_address(a) for a in raw]

    def is_paused(self) -> bool:
        """Return True if the contract is paused."""
        return self._call("paused")

    def minimum_withdrawal(self) -> float:
        """Return the minimum withdrawal amount in ETH."""
        return self._wei_to_eth(self._call("minimumWithdrawalAmount"))

    # ── Write: wallet creation ─────────────────────────────────────────────

    def create_wallet(self) -> str:
        """
        Create a wallet for the platform account.

        Returns the transaction hash.
        """
        tx_hash = self._send("createWallet")
        logger.info("createWallet tx sent: %s", tx_hash)
        return tx_hash

    def create_wallet_for(self, user: str) -> str:
        """
        Create a wallet for *user* (platform must be an authorised platform).

        Returns the transaction hash.
        """
        address = Web3.to_checksum_address(user)
        tx_hash = self._send("createWalletFor", address)
        logger.info("createWalletFor tx sent: user=%s → %s", address, tx_hash)
        return tx_hash

    # ── Write: deposits ────────────────────────────────────────────────────

    def deposit_eth(self, amount_eth: float) -> str:
        """
        Deposit ETH into the platform wallet's wallet.

        Returns the transaction hash.
        """
        amount_wei = self._eth_to_wei(amount_eth)
        tx_hash = self._send("depositETH", value_wei=amount_wei)
        logger.info("depositETH tx sent: %.6f ETH → %s", amount_eth, tx_hash)
        return tx_hash

    def credit_eth(self, user: str, amount_eth: float) -> str:
        """
        Credit *amount_eth* ETH to *user*'s wallet (authorised platform only).

        Returns the transaction hash.
        """
        address = Web3.to_checksum_address(user)
        amount_wei = self._eth_to_wei(amount_eth)
        tx_hash = self._send("creditETH", address, amount_wei, value_wei=amount_wei)
        logger.info(
            "creditETH tx sent: user=%s, %.6f ETH → %s", address, amount_eth, tx_hash
        )
        return tx_hash

    def deposit_token(self, token: str, amount: int) -> str:
        """
        Deposit ERC-20 tokens into the platform wallet's wallet.

        Parameters
        ----------
        token:
            Token contract address.
        amount:
            Amount in raw token units (caller must handle decimals).

        Returns the transaction hash.
        """
        token_addr = Web3.to_checksum_address(token)
        tx_hash = self._send("depositToken", token_addr, amount)
        logger.info("depositToken tx sent: token=%s, amount=%d → %s", token_addr, amount, tx_hash)
        return tx_hash

    def credit_token(self, user: str, token: str, amount: int) -> str:
        """
        Credit ERC-20 tokens to *user*'s wallet (authorised platform only).

        Returns the transaction hash.
        """
        user_addr = Web3.to_checksum_address(user)
        token_addr = Web3.to_checksum_address(token)
        tx_hash = self._send("creditToken", user_addr, token_addr, amount)
        logger.info(
            "creditToken tx sent: user=%s, token=%s, amount=%d → %s",
            user_addr, token_addr, amount, tx_hash,
        )
        return tx_hash

    # ── Write: withdrawals ─────────────────────────────────────────────────

    def withdraw_eth(self, amount_eth: float) -> str:
        """
        Withdraw *amount_eth* ETH from the platform wallet's wallet.

        Returns the transaction hash.
        """
        amount_wei = self._eth_to_wei(amount_eth)
        tx_hash = self._send("withdrawETH", amount_wei)
        logger.info("withdrawETH tx sent: %.6f ETH → %s", amount_eth, tx_hash)
        return tx_hash

    def withdraw_all_eth(self) -> str:
        """
        Withdraw the full ETH balance from the platform wallet's wallet.

        Returns the transaction hash.
        """
        tx_hash = self._send("withdrawAllETH")
        logger.info("withdrawAllETH tx sent: %s", tx_hash)
        return tx_hash

    def withdraw_token(self, token: str, amount: int) -> str:
        """
        Withdraw ERC-20 tokens from the platform wallet's wallet.

        Returns the transaction hash.
        """
        token_addr = Web3.to_checksum_address(token)
        tx_hash = self._send("withdrawToken", token_addr, amount)
        logger.info("withdrawToken tx sent: token=%s, amount=%d → %s", token_addr, amount, tx_hash)
        return tx_hash

    # ── Write: transfers ───────────────────────────────────────────────────

    def transfer_eth(self, recipient: str, amount_eth: float) -> str:
        """
        Transfer ETH between two wallets within the contract.

        Returns the transaction hash.
        """
        rec_addr = Web3.to_checksum_address(recipient)
        amount_wei = self._eth_to_wei(amount_eth)
        tx_hash = self._send("transferETH", rec_addr, amount_wei)
        logger.info(
            "transferETH tx sent: to=%s, %.6f ETH → %s", rec_addr, amount_eth, tx_hash
        )
        return tx_hash

    def transfer_token(self, recipient: str, token: str, amount: int) -> str:
        """
        Transfer ERC-20 tokens between two wallets within the contract.

        Returns the transaction hash.
        """
        rec_addr = Web3.to_checksum_address(recipient)
        token_addr = Web3.to_checksum_address(token)
        tx_hash = self._send("transferToken", rec_addr, token_addr, amount)
        logger.info(
            "transferToken tx sent: to=%s, token=%s, amount=%d → %s",
            rec_addr, token_addr, amount, tx_hash,
        )
        return tx_hash

    # ── Write: admin ───────────────────────────────────────────────────────

    def add_supported_token(self, token: str, symbol: str) -> str:
        """Add a supported ERC-20 token (owner only). Returns the transaction hash."""
        token_addr = Web3.to_checksum_address(token)
        tx_hash = self._send("addSupportedToken", token_addr, symbol)
        logger.info("addSupportedToken tx sent: %s (%s) → %s", token_addr, symbol, tx_hash)
        return tx_hash

    def remove_supported_token(self, token: str) -> str:
        """Remove a supported ERC-20 token (owner only). Returns the transaction hash."""
        token_addr = Web3.to_checksum_address(token)
        tx_hash = self._send("removeSupportedToken", token_addr)
        logger.info("removeSupportedToken tx sent: %s → %s", token_addr, tx_hash)
        return tx_hash

    def authorize_platform(self, platform: str) -> str:
        """Authorise a platform address to credit wallets (owner only). Returns tx hash."""
        address = Web3.to_checksum_address(platform)
        tx_hash = self._send("authorizePlatform", address)
        logger.info("authorizePlatform tx sent: %s → %s", address, tx_hash)
        return tx_hash

    def revoke_platform(self, platform: str) -> str:
        """Revoke a platform's authorisation (owner only). Returns tx hash."""
        address = Web3.to_checksum_address(platform)
        tx_hash = self._send("revokePlatform", address)
        logger.info("revokePlatform tx sent: %s → %s", address, tx_hash)
        return tx_hash

    def update_minimum_withdrawal(self, amount_eth: float) -> str:
        """Update the minimum withdrawal threshold (owner only). Returns tx hash."""
        amount_wei = self._eth_to_wei(amount_eth)
        tx_hash = self._send("updateMinimumWithdrawal", amount_wei)
        logger.info("updateMinimumWithdrawal tx sent: %.6f ETH → %s", amount_eth, tx_hash)
        return tx_hash

    def pause(self) -> str:
        """Pause the contract (owner only). Returns the transaction hash."""
        tx_hash = self._send("pause")
        logger.info("pause tx sent: %s", tx_hash)
        return tx_hash

    def unpause(self) -> str:
        """Unpause the contract (owner only). Returns the transaction hash."""
        tx_hash = self._send("unpause")
        logger.info("unpause tx sent: %s", tx_hash)
        return tx_hash
