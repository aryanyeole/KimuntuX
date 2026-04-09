"""
tests/unit/test_web3_client.py
───────────────────────────────
Unit tests for blockchain/web3_client.py.

All Web3 network calls are mocked so these tests run without a real
Sepolia connection or .env file.

Run:
    pytest tests/unit/test_web3_client.py -v
"""

from __future__ import annotations

import pytest
from unittest.mock import MagicMock, patch, PropertyMock

from blockchain.exceptions import (
    ConfigurationError,
    ConnectionError,
    ContractNotFoundError,
    GasError,
    NetworkError,
)


# ─────────────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────────────

VALID_ENV = {
    "SEPOLIA_RPC_URL": "https://eth-sepolia.g.alchemy.com/v2/test_key",
    "PLATFORM_PRIVATE_KEY": "a" * 64,   # 64 hex chars
    "COMMISSION_CONTRACT_ADDRESS": "0x" + "1" * 40,
    "WALLET_CONTRACT_ADDRESS": "0x" + "2" * 40,
    "EXPECTED_CHAIN_ID": "11155111",
}


def _make_mock_w3(chain_id: int = 11155111, connected: bool = True) -> MagicMock:
    w3 = MagicMock()
    w3.is_connected.return_value = connected
    w3.eth.chain_id = chain_id
    w3.eth.get_code.return_value = b"\x60\x80"   # non-empty = deployed
    w3.eth.gas_price = 20_000_000_000             # 20 gwei
    w3.from_wei.return_value = 20.0
    w3.to_hex.side_effect = lambda x: "0x" + x.hex() if isinstance(x, bytes) else str(x)
    return w3


# ─────────────────────────────────────────────────────────────────────────────
# _validate_config
# ─────────────────────────────────────────────────────────────────────────────

class TestValidateConfig:
    def test_placeholder_rpc_url_raises(self):
        from blockchain.web3_client import Web3Client
        cfg = MagicMock()
        cfg.sepolia_rpc_url = "https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY_HERE"
        cfg.platform_private_key = "a" * 64
        cfg.commission_contract_address = "0x" + "1" * 40
        cfg.wallet_contract_address = "0x" + "2" * 40

        with pytest.raises(ConfigurationError, match="SEPOLIA_RPC_URL"):
            Web3Client._validate_config(cfg)

    def test_placeholder_contract_address_raises(self):
        from blockchain.web3_client import Web3Client
        cfg = MagicMock()
        cfg.sepolia_rpc_url = "https://eth-sepolia.g.alchemy.com/v2/real_key"
        cfg.platform_private_key = "a" * 64
        cfg.commission_contract_address = "0xYourCommissionContractAddress"
        cfg.wallet_contract_address = "0x" + "2" * 40

        with pytest.raises(ConfigurationError, match="COMMISSION_CONTRACT_ADDRESS"):
            Web3Client._validate_config(cfg)

    def test_valid_config_passes(self):
        from blockchain.web3_client import Web3Client
        cfg = MagicMock()
        cfg.sepolia_rpc_url = "https://eth-sepolia.g.alchemy.com/v2/real_key"
        cfg.platform_private_key = "a" * 64
        cfg.commission_contract_address = "0x" + "1" * 40
        cfg.wallet_contract_address = "0x" + "2" * 40

        # Should not raise
        Web3Client._validate_config(cfg)


# ─────────────────────────────────────────────────────────────────────────────
# _try_connect
# ─────────────────────────────────────────────────────────────────────────────

class TestTryConnect:
    def test_connects_to_primary(self):
        from blockchain.web3_client import _try_connect
        mock_w3 = _make_mock_w3()

        with patch("blockchain.web3_client._build_web3", return_value=mock_w3):
            result = _try_connect("https://primary.rpc", None)

        assert result is mock_w3

    def test_falls_back_to_secondary(self):
        from blockchain.web3_client import _try_connect
        dead = MagicMock()
        dead.is_connected.return_value = False
        live = _make_mock_w3()

        call_count = 0

        def _build(url):
            nonlocal call_count
            call_count += 1
            return dead if call_count == 1 else live

        with patch("blockchain.web3_client._build_web3", side_effect=_build):
            result = _try_connect("https://primary.rpc", "https://fallback.rpc")

        assert result is live

    def test_raises_when_all_fail(self):
        from blockchain.web3_client import _try_connect
        dead = MagicMock()
        dead.is_connected.return_value = False

        with patch("blockchain.web3_client._build_web3", return_value=dead):
            with pytest.raises(ConnectionError):
                _try_connect("https://primary.rpc", "https://fallback.rpc")


# ─────────────────────────────────────────────────────────────────────────────
# _validate_network
# ─────────────────────────────────────────────────────────────────────────────

class TestValidateNetwork:
    def _make_client_stub(self, chain_id: int):
        """Return a partially-initialised Web3Client with mocked w3."""
        from blockchain import web3_client as wc
        client = object.__new__(wc.Web3Client)
        client.w3 = MagicMock()
        client.w3.eth.chain_id = chain_id
        return client

    def test_correct_chain_passes(self):
        client = self._make_client_stub(11155111)
        client._validate_network(11155111)  # should not raise

    def test_wrong_chain_raises(self):
        client = self._make_client_stub(1)  # mainnet
        with pytest.raises(NetworkError) as exc_info:
            client._validate_network(11155111)
        assert exc_info.value.actual_chain_id == 1
        assert exc_info.value.expected_chain_id == 11155111


# ─────────────────────────────────────────────────────────────────────────────
# get_gas_price
# ─────────────────────────────────────────────────────────────────────────────

class TestGetGasPrice:
    def _make_client_stub(self, gas_wei: int, cap_gwei: int = 100):
        from blockchain import web3_client as wc
        client = object.__new__(wc.Web3Client)
        client.w3 = MagicMock()
        client.w3.eth.gas_price = gas_wei
        # Realistic from_wei: convert wei → gwei
        client.w3.from_wei.side_effect = lambda v, unit: v / 1e9 if unit == "gwei" else v
        return client

    def test_below_cap_returns_price(self):
        from blockchain.web3_client import Web3Client
        from unittest.mock import patch

        client = self._make_client_stub(20_000_000_000)  # 20 gwei

        with patch("blockchain.web3_client.settings") as mock_settings:
            mock_settings.blockchain.max_gas_price_gwei = 100
            result = client.get_gas_price()

        assert result == 20_000_000_000

    def test_above_cap_raises(self):
        from blockchain.web3_client import Web3Client
        from unittest.mock import patch

        client = self._make_client_stub(150_000_000_000)  # 150 gwei

        with patch("blockchain.web3_client.settings") as mock_settings:
            mock_settings.blockchain.max_gas_price_gwei = 100
            with pytest.raises(GasError, match="150"):
                client.get_gas_price()


# ─────────────────────────────────────────────────────────────────────────────
# estimate_gas
# ─────────────────────────────────────────────────────────────────────────────

class TestEstimateGas:
    def test_applies_buffer_and_rounds(self):
        from blockchain import web3_client as wc
        from unittest.mock import patch

        client = object.__new__(wc.Web3Client)
        client.w3 = MagicMock()
        client.w3.eth.estimate_gas.return_value = 100_000  # raw estimate

        with patch("blockchain.web3_client.settings") as mock_settings:
            mock_settings.blockchain.gas_limit_buffer = 1.2
            result = client.estimate_gas({"to": "0x1234", "data": "0x"})

        # 100_000 * 1.2 = 120_000 → rounds to 120_000 (already multiple of 1000)
        assert result == 120_000

    def test_gas_estimation_failure_raises(self):
        from blockchain import web3_client as wc
        from unittest.mock import patch

        client = object.__new__(wc.Web3Client)
        client.w3 = MagicMock()
        client.w3.eth.estimate_gas.side_effect = Exception("out of gas")

        with patch("blockchain.web3_client.settings") as mock_settings:
            mock_settings.blockchain.gas_limit_buffer = 1.2
            with pytest.raises(GasError, match="out of gas"):
                client.estimate_gas({})


# ─────────────────────────────────────────────────────────────────────────────
# singleton helpers
# ─────────────────────────────────────────────────────────────────────────────

class TestSingleton:
    def test_reset_clears_singleton(self):
        import blockchain.web3_client as wc
        wc._client = MagicMock()
        wc.reset_client()
        assert wc._client is None

    def test_get_client_returns_same_instance(self):
        import blockchain.web3_client as wc
        mock = MagicMock()
        wc._client = mock
        assert wc.get_client() is mock
        wc.reset_client()
