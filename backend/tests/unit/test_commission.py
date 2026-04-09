"""
tests/unit/test_commission.py
──────────────────────────────
Unit tests for blockchain/contracts/commission.py.

All Web3 calls are mocked — no network or deployed contract required.

Run:
    pytest tests/unit/test_commission.py -v
"""

from __future__ import annotations

import pytest
from unittest.mock import MagicMock, patch

from blockchain.contracts.commission import (
    CommissionContract,
    CommissionRecord,
    CommissionStatus,
    ContractStats,
)
from blockchain.exceptions import ContractCallError, InsufficientFundsError


# ─────────────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────────────

AFFILIATE = "0x" + "a" * 40
MERCHANT = "0x" + "b" * 40
TX_ID = "order-001"

ONE_ETH_WEI = 10 ** 18


def _make_contract(
    *,
    balance_wei: int = 0,
    gas_price_wei: int = 20_000_000_000,
) -> CommissionContract:
    """Return a CommissionContract with a fully mocked Web3Client."""
    client = MagicMock()

    # w3 helpers
    client.w3.to_checksum_address.side_effect = lambda a: a
    client.w3.to_wei.side_effect = lambda v, unit: int(v * 1e18) if unit == "ether" else v
    client.w3.from_wei.side_effect = lambda v, unit: v / 1e18 if unit == "ether" else v
    client.w3.eth.get_balance.return_value = balance_wei

    # account
    client.account.address = "0x" + "0" * 40

    # contract functions
    client.commission = MagicMock()
    client.commission.functions = MagicMock()

    # gas helpers
    client.build_tx_params.return_value = {
        "from": "0x" + "0" * 40,
        "nonce": 1,
        "gasPrice": gas_price_wei,
        "value": 0,
        "chainId": 11155111,
    }
    client.estimate_gas.return_value = 100_000
    client.sign_and_send.return_value = "0x" + "d" * 64

    return CommissionContract(client)


def _mock_call(contract: CommissionContract, fn_name: str, return_value):
    """Set the return value for a specific contract eth_call."""
    fn_mock = MagicMock()
    fn_mock.return_value.call.return_value = return_value
    setattr(contract._contract.functions, fn_name, fn_mock)


def _mock_build_tx(contract: CommissionContract, fn_name: str):
    """Set up a function mock that supports build_transaction."""
    fn_mock = MagicMock()
    fn_mock.return_value.build_transaction.return_value = {
        "to": "0x" + "1" * 40,
        "data": "0x",
        "value": 0,
    }
    setattr(contract._contract.functions, fn_name, fn_mock)


# ─────────────────────────────────────────────────────────────────────────────
# Read tests
# ─────────────────────────────────────────────────────────────────────────────

class TestGetBalance:
    def test_returns_eth_float(self):
        contract = _make_contract()
        _mock_call(contract, "getBalance", ONE_ETH_WEI)

        result = contract.get_balance(AFFILIATE)
        assert result == pytest.approx(1.0)

    def test_zero_balance(self):
        contract = _make_contract()
        _mock_call(contract, "getBalance", 0)
        assert contract.get_balance(AFFILIATE) == 0.0

    def test_call_failure_raises(self):
        contract = _make_contract()
        fn_mock = MagicMock()
        fn_mock.return_value.call.side_effect = Exception("revert")
        contract._contract.functions.getBalance = fn_mock

        with pytest.raises(ContractCallError):
            contract.get_balance(AFFILIATE)


class TestGetCommission:
    def test_parses_record_correctly(self):
        contract = _make_contract()
        # (amount_wei, timestamp, tx_id, status_int)
        _mock_call(
            contract,
            "getCommission",
            (int(0.05 * 1e18), 1_700_000_000, "order-001", 1),  # APPROVED
        )

        record = contract.get_commission(AFFILIATE, 0)
        assert isinstance(record, CommissionRecord)
        assert record.amount_eth == pytest.approx(0.05)
        assert record.transaction_id == "order-001"
        assert record.status == CommissionStatus.APPROVED

    def test_pending_status(self):
        contract = _make_contract()
        _mock_call(contract, "getCommission", (100, 1700, "tx-2", 0))
        record = contract.get_commission(AFFILIATE, 1)
        assert record.status == CommissionStatus.PENDING


class TestGetAllCommissions:
    def test_empty_list(self):
        contract = _make_contract()
        _mock_call(contract, "getAllCommissions", [])
        assert contract.get_all_commissions(AFFILIATE) == []

    def test_multiple_records(self):
        contract = _make_contract()
        _mock_call(contract, "getAllCommissions", [
            (ONE_ETH_WEI // 10, 1700, "tx-1", 2),  # PAID
            (ONE_ETH_WEI // 20, 1800, "tx-2", 0),  # PENDING
        ])
        records = contract.get_all_commissions(AFFILIATE)
        assert len(records) == 2
        assert records[0].status == CommissionStatus.PAID
        assert records[1].status == CommissionStatus.PENDING


class TestGetContractStats:
    def test_converts_wei_to_eth(self):
        contract = _make_contract()
        _mock_call(
            contract,
            "getContractStats",
            (ONE_ETH_WEI * 10, ONE_ETH_WEI * 5, 300, int(0.01 * 1e18)),
        )
        stats = contract.get_contract_stats()
        assert stats.contract_balance_eth == pytest.approx(10.0)
        assert stats.total_paid_eth == pytest.approx(5.0)
        assert stats.platform_fee_rate_bps == 300
        assert stats.minimum_payout_eth == pytest.approx(0.01)


class TestIsAffiliate:
    def test_returns_true(self):
        contract = _make_contract()
        _mock_call(contract, "isAffiliate", True)
        assert contract.is_affiliate(AFFILIATE) is True

    def test_returns_false(self):
        contract = _make_contract()
        _mock_call(contract, "isAffiliate", False)
        assert contract.is_affiliate(AFFILIATE) is False


# ─────────────────────────────────────────────────────────────────────────────
# Write tests
# ─────────────────────────────────────────────────────────────────────────────

class TestRecordCommission:
    def test_valid_call_returns_tx_hash(self):
        contract = _make_contract(balance_wei=ONE_ETH_WEI)
        _mock_build_tx(contract, "recordCommission")

        tx_hash = contract.record_commission(
            affiliate=AFFILIATE,
            sale_amount_eth=1.0,
            commission_rate_bps=500,  # 5%
            transaction_id=TX_ID,
        )
        assert tx_hash.startswith("0x")
        contract._client.sign_and_send.assert_called_once()

    def test_invalid_rate_raises_value_error(self):
        contract = _make_contract()
        with pytest.raises(ValueError, match="10000"):
            contract.record_commission(AFFILIATE, 1.0, 10_001, TX_ID)

    def test_zero_rate_raises_value_error(self):
        contract = _make_contract()
        with pytest.raises(ValueError):
            contract.record_commission(AFFILIATE, 1.0, 0, TX_ID)

    def test_insufficient_balance_raises(self):
        # Platform wallet has 0 ETH, but commission requires ETH attachment
        contract = _make_contract(balance_wei=0)
        _mock_build_tx(contract, "recordCommission")

        with pytest.raises(InsufficientFundsError):
            contract.record_commission(AFFILIATE, 1.0, 500, TX_ID)

    def test_commission_amount_attached_as_value(self):
        """1 ETH sale at 5% = 0.05 ETH commission attached."""
        contract = _make_contract(balance_wei=ONE_ETH_WEI)
        _mock_build_tx(contract, "recordCommission")
        contract.record_commission(AFFILIATE, 1.0, 500, TX_ID)

        # build_tx_params should have been called with value = 0.05 ETH in wei
        expected_wei = int(0.05 * 1e18)
        contract._client.build_tx_params.assert_called_once_with(value_wei=expected_wei)


class TestRegisterAffiliate:
    def test_sends_transaction(self):
        contract = _make_contract()
        _mock_build_tx(contract, "registerAffiliate")
        tx = contract.register_affiliate(AFFILIATE)
        assert tx == "0x" + "d" * 64


class TestAuthorizeAndFeeRate:
    def test_set_fee_rate_above_max_raises(self):
        contract = _make_contract()
        with pytest.raises(ValueError, match="1000"):
            contract.set_platform_fee_rate(1001)

    def test_set_fee_rate_valid(self):
        contract = _make_contract()
        _mock_build_tx(contract, "setPlatformFeeRate")
        tx = contract.set_platform_fee_rate(300)
        assert tx.startswith("0x")


class TestWithdrawPlatformFeesWarning:
    def test_logs_warning(self, caplog):
        import logging
        contract = _make_contract()
        _mock_build_tx(contract, "withdrawPlatformFees")

        with caplog.at_level(logging.WARNING, logger="blockchain.contracts.commission"):
            contract.withdraw_platform_fees()

        assert any("known contract bug" in r.message for r in caplog.records)
