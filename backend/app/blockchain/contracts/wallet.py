"""
app/blockchain/contracts/wallet.py
────────────────────────────────────
High-level Python wrapper around the deployed KimuXWallet contract.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field

from web3 import Web3

from app.blockchain.exceptions import ContractCallError, InsufficientFundsError
from app.blockchain.web3_client import Web3Client

logger = logging.getLogger(__name__)


@dataclass
class WalletBalances:
    eth_balance: float
    token_balances: dict[str, int] = field(default_factory=dict)


@dataclass
class WalletDetails:
    owner: str
    eth_balance: float
    created_at: int
    total_deposits: float
    total_withdrawals: float


class WalletContract:
    def __init__(self, client: Web3Client) -> None:
        self._client = client
        self._contract = client.wallet
        self._w3 = client.w3

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

    def has_wallet(self, owner: str) -> bool:
        return self._call("hasWallet", Web3.to_checksum_address(owner))

    def get_eth_balance(self, owner: str) -> float:
        address = Web3.to_checksum_address(owner)
        wei = self._call("getETHBalance", address)
        return self._wei_to_eth(wei)

    def get_token_balance(self, owner: str, token: str) -> int:
        return self._call(
            "getTokenBalance",
            Web3.to_checksum_address(owner),
            Web3.to_checksum_address(token),
        )

    def get_all_balances(self, owner: str) -> WalletBalances:
        address = Web3.to_checksum_address(owner)
        eth_wei, raw_token_balances, token_addresses = self._call("getAllBalances", address)
        token_map = {
            Web3.to_checksum_address(addr): bal
            for addr, bal in zip(token_addresses, raw_token_balances)
        }
        return WalletBalances(eth_balance=self._wei_to_eth(eth_wei), token_balances=token_map)

    def get_wallet_details(self, owner: str) -> WalletDetails:
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
        return self._call("getTotalWallets")

    def is_authorized_platform(self, platform: str) -> bool:
        return self._call("authorizedPlatforms", Web3.to_checksum_address(platform))

    def get_supported_tokens(self) -> list[str]:
        raw = self._call("getSupportedTokens")
        return [Web3.to_checksum_address(a) for a in raw]

    def is_paused(self) -> bool:
        return self._call("paused")

    def minimum_withdrawal(self) -> float:
        return self._wei_to_eth(self._call("minimumWithdrawalAmount"))

    def create_wallet(self) -> str:
        tx_hash = self._send("createWallet")
        logger.info("createWallet tx sent: %s", tx_hash)
        return tx_hash

    def create_wallet_for(self, user: str) -> str:
        address = Web3.to_checksum_address(user)
        tx_hash = self._send("createWalletFor", address)
        logger.info("createWalletFor tx sent: user=%s -> %s", address, tx_hash)
        return tx_hash

    def deposit_eth(self, amount_eth: float) -> str:
        amount_wei = self._eth_to_wei(amount_eth)
        tx_hash = self._send("depositETH", value_wei=amount_wei)
        logger.info("depositETH tx sent: %.6f ETH -> %s", amount_eth, tx_hash)
        return tx_hash

    def credit_eth(self, user: str, amount_eth: float) -> str:
        address = Web3.to_checksum_address(user)
        amount_wei = self._eth_to_wei(amount_eth)
        tx_hash = self._send("creditETH", address, amount_wei, value_wei=amount_wei)
        logger.info("creditETH tx sent: user=%s %.6f ETH -> %s", address, amount_eth, tx_hash)
        return tx_hash

    def deposit_token(self, token: str, amount: int) -> str:
        token_addr = Web3.to_checksum_address(token)
        tx_hash = self._send("depositToken", token_addr, amount)
        logger.info("depositToken tx sent: token=%s amount=%d -> %s", token_addr, amount, tx_hash)
        return tx_hash

    def credit_token(self, user: str, token: str, amount: int) -> str:
        user_addr = Web3.to_checksum_address(user)
        token_addr = Web3.to_checksum_address(token)
        tx_hash = self._send("creditToken", user_addr, token_addr, amount)
        logger.info(
            "creditToken tx sent: user=%s token=%s amount=%d -> %s",
            user_addr, token_addr, amount, tx_hash,
        )
        return tx_hash

    def withdraw_eth(self, amount_eth: float) -> str:
        amount_wei = self._eth_to_wei(amount_eth)
        tx_hash = self._send("withdrawETH", amount_wei)
        logger.info("withdrawETH tx sent: %.6f ETH -> %s", amount_eth, tx_hash)
        return tx_hash

    def withdraw_all_eth(self) -> str:
        tx_hash = self._send("withdrawAllETH")
        logger.info("withdrawAllETH tx sent: %s", tx_hash)
        return tx_hash

    def withdraw_token(self, token: str, amount: int) -> str:
        token_addr = Web3.to_checksum_address(token)
        tx_hash = self._send("withdrawToken", token_addr, amount)
        logger.info("withdrawToken tx sent: token=%s amount=%d -> %s", token_addr, amount, tx_hash)
        return tx_hash

    def transfer_eth(self, recipient: str, amount_eth: float) -> str:
        rec_addr = Web3.to_checksum_address(recipient)
        amount_wei = self._eth_to_wei(amount_eth)
        tx_hash = self._send("transferETH", rec_addr, amount_wei)
        logger.info("transferETH tx sent: to=%s %.6f ETH -> %s", rec_addr, amount_eth, tx_hash)
        return tx_hash

    def transfer_token(self, recipient: str, token: str, amount: int) -> str:
        rec_addr = Web3.to_checksum_address(recipient)
        token_addr = Web3.to_checksum_address(token)
        tx_hash = self._send("transferToken", rec_addr, token_addr, amount)
        logger.info(
            "transferToken tx sent: to=%s token=%s amount=%d -> %s",
            rec_addr, token_addr, amount, tx_hash,
        )
        return tx_hash

    def add_supported_token(self, token: str, symbol: str) -> str:
        token_addr = Web3.to_checksum_address(token)
        tx_hash = self._send("addSupportedToken", token_addr, symbol)
        logger.info("addSupportedToken tx sent: %s (%s) -> %s", token_addr, symbol, tx_hash)
        return tx_hash

    def remove_supported_token(self, token: str) -> str:
        token_addr = Web3.to_checksum_address(token)
        tx_hash = self._send("removeSupportedToken", token_addr)
        logger.info("removeSupportedToken tx sent: %s -> %s", token_addr, tx_hash)
        return tx_hash

    def authorize_platform(self, platform: str) -> str:
        address = Web3.to_checksum_address(platform)
        tx_hash = self._send("authorizePlatform", address)
        logger.info("authorizePlatform tx sent: %s -> %s", address, tx_hash)
        return tx_hash

    def revoke_platform(self, platform: str) -> str:
        address = Web3.to_checksum_address(platform)
        tx_hash = self._send("revokePlatform", address)
        logger.info("revokePlatform tx sent: %s -> %s", address, tx_hash)
        return tx_hash

    def update_minimum_withdrawal(self, amount_eth: float) -> str:
        amount_wei = self._eth_to_wei(amount_eth)
        tx_hash = self._send("updateMinimumWithdrawal", amount_wei)
        logger.info("updateMinimumWithdrawal tx sent: %.6f ETH -> %s", amount_eth, tx_hash)
        return tx_hash

    def pause(self) -> str:
        tx_hash = self._send("pause")
        logger.info("pause tx sent: %s", tx_hash)
        return tx_hash

    def unpause(self) -> str:
        tx_hash = self._send("unpause")
        logger.info("unpause tx sent: %s", tx_hash)
        return tx_hash
