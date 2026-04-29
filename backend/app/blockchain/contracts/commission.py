"""
app/blockchain/contracts/commission.py
────────────────────────────────────────
High-level wrapper around the deployed KimuXCommissionSystem contract.

All Wei/ETH conversions and exception mapping happen here so callers
never touch Web3 primitives.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from enum import IntEnum
from typing import TYPE_CHECKING

from web3 import Web3

from app.blockchain.exceptions import ContractCallError, InsufficientFundsError
from app.blockchain.web3_client import Web3Client

if TYPE_CHECKING:
    pass

logger = logging.getLogger(__name__)


class CommissionStatus(IntEnum):
    """Mirrors the Solidity CommissionStatus enum (0-indexed)."""
    PENDING = 0
    APPROVED = 1
    PAID = 2
    DISPUTED = 3


@dataclass
class CommissionRecord:
    """Represents a single Commission struct from the contract."""
    affiliate: str          # checksum address
    amount_eth: float       # net commission after platform fee
    timestamp: int          # Unix epoch seconds
    transaction_id: str
    status: CommissionStatus


@dataclass
class ContractStats:
    """Returned by getContractStats()."""
    contract_balance_eth: float
    total_paid_eth: float
    platform_fee_rate_bps: int   # basis points (300 = 3%)
    minimum_payout_eth: float


class CommissionContract:
    """High-level wrapper around the deployed KimuXCommissionSystem contract."""

    def __init__(self, client: Web3Client) -> None:
        self._client = client
        self._contract = client.commission
        self._w3 = client.w3

    def _eth_to_wei(self, eth: float) -> int:
        return self._w3.to_wei(eth, "ether")

    def _wei_to_eth(self, wei: int) -> float:
        return float(self._w3.from_wei(wei, "ether"))

    def _call(self, fn_name: str, *args):
        """Execute a read-only contract call, wrapping errors."""
        try:
            fn = getattr(self._contract.functions, fn_name)
            return fn(*args).call()
        except Exception as exc:
            raise ContractCallError(
                f"eth_call to {fn_name}({args}) failed: {exc}",
                detail={"function": fn_name, "args": args},
            ) from exc

    def _send(self, fn_name: str, *args, value_wei: int = 0) -> str:
        """Build, sign, and send a state-changing transaction. Returns tx hash."""
        balance = self._w3.eth.get_balance(self._client.account.address)
        if balance < value_wei:
            raise InsufficientFundsError(
                "Platform wallet balance is insufficient for the attached value.",
                required_wei=value_wei,
                available_wei=balance,
            )

        tx_params = self._client.build_tx_params(value_wei=value_wei)
        fn = getattr(self._contract.functions, fn_name)
        tx = fn(*args).build_transaction(tx_params)
        tx["gas"] = self._client.estimate_gas(tx)
        return self._client.sign_and_send(tx)

    # ── Read functions ─────────────────────────────────────────────────────

    def get_balance(self, affiliate: str) -> float:
        """Return the affiliate's claimable balance in ETH."""
        address = Web3.to_checksum_address(affiliate)
        wei = self._call("getBalance", address)
        return self._wei_to_eth(wei)

    def get_commission_count(self, affiliate: str) -> int:
        """Return the total number of commission records for an affiliate."""
        address = Web3.to_checksum_address(affiliate)
        return self._call("getCommissionCount", address)

    def get_commission(self, affiliate: str, index: int) -> CommissionRecord:
        """Return a single commission record by index."""
        address = Web3.to_checksum_address(affiliate)
        amount_wei, timestamp, tx_id, status_int = self._call("getCommission", address, index)
        return CommissionRecord(
            affiliate=address,
            amount_eth=self._wei_to_eth(amount_wei),
            timestamp=timestamp,
            transaction_id=tx_id,
            status=CommissionStatus(status_int),
        )

    def get_all_commissions(self, affiliate: str) -> list[CommissionRecord]:
        """Return all commission records for an affiliate."""
        address = Web3.to_checksum_address(affiliate)
        raw_list = self._call("getAllCommissions", address)
        records = []
        for item in raw_list:
            if len(item) == 5:
                record_affiliate, amount_wei, timestamp, tx_id, status = item
                record_affiliate = Web3.to_checksum_address(record_affiliate)
            else:
                amount_wei, timestamp, tx_id, status = item
                record_affiliate = address
            records.append(CommissionRecord(
                affiliate=record_affiliate,
                amount_eth=self._wei_to_eth(amount_wei),
                timestamp=timestamp,
                transaction_id=tx_id,
                status=CommissionStatus(status),
            ))
        return records

    def get_contract_stats(self) -> ContractStats:
        """Return aggregate platform statistics."""
        balance_wei, paid_wei, fee_rate, min_payout_wei = self._call("getContractStats")
        return ContractStats(
            contract_balance_eth=self._wei_to_eth(balance_wei),
            total_paid_eth=self._wei_to_eth(paid_wei),
            platform_fee_rate_bps=fee_rate,
            minimum_payout_eth=self._wei_to_eth(min_payout_wei),
        )

    def is_affiliate(self, address: str) -> bool:
        return self._call("isAffiliate", Web3.to_checksum_address(address))

    def is_merchant(self, address: str) -> bool:
        return self._call("isMerchant", Web3.to_checksum_address(address))

    def is_paused(self) -> bool:
        return self._call("paused")

    def is_transaction_processed(self, transaction_id: str) -> bool:
        return self._call("processedTransactions", transaction_id)

    def get_platform_fee_rate(self) -> int:
        return self._call("platformFeeRate")

    def get_minimum_payout(self) -> float:
        return self._wei_to_eth(self._call("minimumPayout"))

    # ── Write functions ────────────────────────────────────────────────────

    def register_affiliate(self, affiliate: str) -> str:
        address = Web3.to_checksum_address(affiliate)
        tx_hash = self._send("registerAffiliate", address)
        logger.info("registerAffiliate tx sent: %s -> %s", address, tx_hash)
        return tx_hash

    def register_self(self) -> str:
        tx_hash = self._send("registerSelf")
        logger.info("registerSelf tx sent: %s", tx_hash)
        return tx_hash

    def record_commission(
        self,
        affiliate: str,
        sale_amount_eth: float,
        commission_rate_bps: int,
        transaction_id: str,
    ) -> str:
        """
        Record and pay a commission for a completed sale.

        The contract computes:
            commission_amount = sale_amount * commission_rate_bps / 10_000
            platform_fee      = commission_amount * platformFeeRate / 10_000
            net_commission    = commission_amount - platform_fee

        We must attach at least commission_amount wei as msg.value.
        """
        if not 1 <= commission_rate_bps <= 10_000:
            raise ValueError(f"commission_rate_bps must be 1–10000, got {commission_rate_bps}")

        sale_wei = self._eth_to_wei(sale_amount_eth)
        commission_wei = (sale_wei * commission_rate_bps) // 10_000

        address = Web3.to_checksum_address(affiliate)
        tx_hash = self._send(
            "recordCommission",
            address,
            sale_wei,
            commission_rate_bps,
            transaction_id,
            value_wei=commission_wei,
        )
        logger.info(
            "recordCommission tx: affiliate=%s sale=%.6f ETH rate=%d bps tx_id=%s -> %s",
            address, sale_amount_eth, commission_rate_bps, transaction_id, tx_hash,
        )
        return tx_hash

    def approve_commission(self, affiliate: str, index: int) -> str:
        address = Web3.to_checksum_address(affiliate)
        tx_hash = self._send("approveCommission", address, index)
        logger.info("approveCommission tx sent: %s[%d] -> %s", address, index, tx_hash)
        return tx_hash

    def auto_approve(self, affiliate: str, transaction_id: str) -> str:
        address = Web3.to_checksum_address(affiliate)
        tx_hash = self._send("autoApprove", address, transaction_id)
        logger.info("autoApprove tx sent: %s tx_id=%s -> %s", address, transaction_id, tx_hash)
        return tx_hash

    def withdraw(self) -> str:
        tx_hash = self._send("withdraw")
        logger.info("withdraw tx sent: %s", tx_hash)
        return tx_hash

    def withdraw_amount(self, amount_eth: float) -> str:
        amount_wei = self._eth_to_wei(amount_eth)
        tx_hash = self._send("withdrawAmount", amount_wei)
        logger.info("withdrawAmount tx sent: %.6f ETH -> %s", amount_eth, tx_hash)
        return tx_hash

    def authorize_merchant(self, merchant: str, status: bool) -> str:
        address = Web3.to_checksum_address(merchant)
        tx_hash = self._send("authorizeMerchant", address, status)
        logger.info("authorizeMerchant tx sent: %s status=%s -> %s", address, status, tx_hash)
        return tx_hash

    def set_platform_fee_rate(self, rate_bps: int) -> str:
        if not 0 <= rate_bps <= 1000:
            raise ValueError(f"rate_bps must be 0–1000, got {rate_bps}")
        tx_hash = self._send("setPlatformFeeRate", rate_bps)
        logger.info("setPlatformFeeRate tx sent: %d bps -> %s", rate_bps, tx_hash)
        return tx_hash

    def set_minimum_payout(self, amount_eth: float) -> str:
        amount_wei = self._eth_to_wei(amount_eth)
        tx_hash = self._send("setMinimumPayout", amount_wei)
        logger.info("setMinimumPayout tx sent: %.6f ETH -> %s", amount_eth, tx_hash)
        return tx_hash

    def withdraw_platform_fees(self) -> str:
        """
        Withdraw accumulated platform fees (owner only).

        .. warning::
            Known contract bug: totalPending is always 0, meaning this call
            withdraws the entire contract balance including affiliate balances.
            Do not use in production until the contract is patched.
        """
        logger.warning(
            "withdraw_platform_fees: known contract bug — this will drain ALL "
            "contract ETH including affiliate balances. Use with caution."
        )
        tx_hash = self._send("withdrawPlatformFees")
        logger.info("withdrawPlatformFees tx sent: %s", tx_hash)
        return tx_hash

    def pause(self) -> str:
        tx_hash = self._send("pause")
        logger.info("pause tx sent: %s", tx_hash)
        return tx_hash

    def unpause(self) -> str:
        tx_hash = self._send("unpause")
        logger.info("unpause tx sent: %s", tx_hash)
        return tx_hash

    def record_and_wait(
        self,
        affiliate: str,
        sale_amount_eth: float,
        commission_rate_bps: int,
        transaction_id: str,
    ) -> dict:
        """Record a commission and block until the receipt is confirmed."""
        tx_hash = self.record_commission(
            affiliate, sale_amount_eth, commission_rate_bps, transaction_id
        )
        return self._client.wait_for_receipt(tx_hash)
