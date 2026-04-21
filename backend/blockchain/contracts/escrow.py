"""
blockchain/contracts/escrow.py
──────────────────────────────
High-level wrapper around the deployed PaymentEscrow contract.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from enum import IntEnum

from web3 import Web3

from blockchain.exceptions import ContractCallError, InsufficientFundsError
from blockchain.web3_client import Web3Client

logger = logging.getLogger(__name__)


class EscrowStatus(IntEnum):
    ACTIVE = 0
    RELEASED = 1
    REFUNDED = 2
    DISPUTED = 3
    CANCELLED = 4


@dataclass
class EscrowRecord:
    escrow_id: int
    buyer: str
    seller: str
    amount_eth: float
    escrow_fee_eth: float
    created_at: int
    release_time: int
    status: EscrowStatus
    product_id: str
    notes: str
    arbiter: str


@dataclass
class EscrowStats:
    contract_balance_eth: float
    total_locked_value_eth: float
    total_created: int
    total_completed: int
    fee_rate_bps: int


class EscrowContract:
    def __init__(self, client: Web3Client) -> None:
        if client.escrow is None:
            raise ValueError("Escrow contract is not configured.")
        self._client = client
        self._contract = client.escrow
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

    def create_escrow(
        self,
        seller: str,
        product_id: str,
        notes: str,
        arbiter: str,
        amount_eth: float,
    ) -> str:
        seller_addr = Web3.to_checksum_address(seller)
        arbiter_addr = Web3.to_checksum_address(arbiter)
        amount_wei = self._eth_to_wei(amount_eth)
        tx_hash = self._send(
            "createEscrow",
            seller_addr,
            product_id,
            notes,
            arbiter_addr,
            value_wei=amount_wei,
        )
        logger.info(
            "createEscrow tx sent: seller=%s product_id=%s amount=%.6f ETH -> %s",
            seller_addr,
            product_id,
            amount_eth,
            tx_hash,
        )
        return tx_hash

    def get_escrow(self, escrow_id: int) -> EscrowRecord:
        (
            raw_escrow_id,
            buyer,
            seller,
            amount_wei,
            fee_wei,
            created_at,
            release_time,
            status_int,
            product_id,
            notes,
            arbiter,
        ) = self._call("getEscrow", escrow_id)
        return EscrowRecord(
            escrow_id=raw_escrow_id,
            buyer=Web3.to_checksum_address(buyer),
            seller=Web3.to_checksum_address(seller),
            amount_eth=self._wei_to_eth(amount_wei),
            escrow_fee_eth=self._wei_to_eth(fee_wei),
            created_at=created_at,
            release_time=release_time,
            status=EscrowStatus(status_int),
            product_id=product_id,
            notes=notes,
            arbiter=Web3.to_checksum_address(arbiter),
        )

    def get_contract_stats(self) -> EscrowStats:
        balance_wei, locked_wei, total_created, total_completed, fee_rate = self._call(
            "getContractStats"
        )
        return EscrowStats(
            contract_balance_eth=self._wei_to_eth(balance_wei),
            total_locked_value_eth=self._wei_to_eth(locked_wei),
            total_created=total_created,
            total_completed=total_completed,
            fee_rate_bps=fee_rate,
        )

    def is_paused(self) -> bool:
        return self._call("paused")

    def auto_release_timeout(self) -> int:
        return self._call("autoReleaseTimeout")

    def release_escrow(self, escrow_id: int) -> str:
        tx_hash = self._send("releaseEscrow", escrow_id)
        logger.info("releaseEscrow tx sent: escrow_id=%d -> %s", escrow_id, tx_hash)
        return tx_hash

    def auto_release_escrow(self, escrow_id: int) -> str:
        tx_hash = self._send("autoReleaseEscrow", escrow_id)
        logger.info("autoReleaseEscrow tx sent: escrow_id=%d -> %s", escrow_id, tx_hash)
        return tx_hash

    def refund_escrow(self, escrow_id: int) -> str:
        tx_hash = self._send("refundEscrow", escrow_id)
        logger.info("refundEscrow tx sent: escrow_id=%d -> %s", escrow_id, tx_hash)
        return tx_hash

    def raise_dispute(self, escrow_id: int, reason: str) -> str:
        tx_hash = self._send("raiseDispute", escrow_id, reason)
        logger.info("raiseDispute tx sent: escrow_id=%d -> %s", escrow_id, tx_hash)
        return tx_hash

    def resolve_dispute(self, escrow_id: int, release_to_seller: bool) -> str:
        tx_hash = self._send("resolveDispute", escrow_id, release_to_seller)
        logger.info(
            "resolveDispute tx sent: escrow_id=%d release_to_seller=%s -> %s",
            escrow_id,
            release_to_seller,
            tx_hash,
        )
        return tx_hash

    def cancel_escrow(self, escrow_id: int) -> str:
        tx_hash = self._send("cancelEscrow", escrow_id)
        logger.info("cancelEscrow tx sent: escrow_id=%d -> %s", escrow_id, tx_hash)
        return tx_hash

    def set_escrow_fee_rate(self, rate_bps: int) -> str:
        tx_hash = self._send("setEscrowFeeRate", rate_bps)
        logger.info("setEscrowFeeRate tx sent: %d bps -> %s", rate_bps, tx_hash)
        return tx_hash

    def set_auto_release_timeout(self, timeout_seconds: int) -> str:
        tx_hash = self._send("setAutoReleaseTimeout", timeout_seconds)
        logger.info("setAutoReleaseTimeout tx sent: %d seconds -> %s", timeout_seconds, tx_hash)
        return tx_hash

    def set_arbiter_authorization(self, arbiter: str, authorized: bool) -> str:
        arbiter_addr = Web3.to_checksum_address(arbiter)
        tx_hash = self._send("setArbiterAuthorization", arbiter_addr, authorized)
        logger.info(
            "setArbiterAuthorization tx sent: arbiter=%s authorized=%s -> %s",
            arbiter_addr,
            authorized,
            tx_hash,
        )
        return tx_hash

    def withdraw_fees(self) -> str:
        tx_hash = self._send("withdrawFees")
        logger.info("withdrawFees tx sent: %s", tx_hash)
        return tx_hash

    def get_recent_escrows(self, limit: int = 5) -> list[EscrowRecord]:
        stats = self.get_contract_stats()
        total = stats.total_created
        if total <= 0:
            return []
        start = max(1, total - limit + 1)
        return [self.get_escrow(escrow_id) for escrow_id in range(total, start - 1, -1)]
