"""Tests for ClickBankClient — all HTTP calls are mocked via httpx."""
from __future__ import annotations

import pytest
import httpx
from unittest.mock import patch, MagicMock

from app.integrations.clickbank import (
    ClickBankAuthError,
    ClickBankAPIError,
    ClickBankClient,
    ClickBankRateLimitError,
)


def _mock_response(status_code: int, json_body: dict | None = None, text: str = "") -> MagicMock:
    resp = MagicMock(spec=httpx.Response)
    resp.status_code = status_code
    resp.json.return_value = json_body or {}
    resp.text = text
    return resp


PRODUCT_FIXTURE = {
    "site": "vendor123",
    "title": "Weight Loss Secret",
    "categories": ["HEALTH_FITNESS"],
    "gravity": 85.4,
    "pct": 0.75,
    "initialAmount": 39.99,
    "hop": "https://vendor123.clickbank.net",
    "trend": "UP",
    "trendValue": 12.5,
}


def test_verify_credentials_success():
    client = ClickBankClient("DEV")
    mock_resp = _mock_response(200, {"products": [PRODUCT_FIXTURE]})
    with patch("httpx.Client") as MockClient:
        MockClient.return_value.__enter__.return_value.get.return_value = mock_resp
        assert client.verify_credentials() is True


def test_verify_credentials_auth_error():
    client = ClickBankClient("BAD")
    mock_resp = _mock_response(401, text="Unauthorized")
    with patch("httpx.Client") as MockClient:
        MockClient.return_value.__enter__.return_value.get.return_value = mock_resp
        with pytest.raises(ClickBankAuthError):
            client.verify_credentials()


def test_rate_limit_raises():
    client = ClickBankClient("DEV")
    mock_resp = _mock_response(429, text="Too Many Requests")
    with patch("httpx.Client") as MockClient:
        MockClient.return_value.__enter__.return_value.get.return_value = mock_resp
        with pytest.raises(ClickBankRateLimitError):
            client.fetch_marketplace_offers()


def test_fetch_marketplace_offers_normalizes():
    client = ClickBankClient("DEV")
    mock_resp = _mock_response(200, {"products": [PRODUCT_FIXTURE]})
    with patch("httpx.Client") as MockClient:
        MockClient.return_value.__enter__.return_value.get.return_value = mock_resp
        offers = client.fetch_marketplace_offers()
    assert len(offers) == 1
    o = offers[0]
    assert o["external_id"] == "vendor123"
    assert o["name"] == "Weight Loss Secret"
    assert o["niche"] == "Health Fitness"
    assert o["network"] == "ClickBank"
    assert o["gravity"] == 85.4
    assert o["commission_rate"] == 0.75
    assert o["aov"] == 39.99
    assert o["trend_direction"] == "up"
    assert o["trend_value"] == 12.5


def test_normalize_missing_categories():
    """Products with no categories should fall back to 'General'."""
    p = {**PRODUCT_FIXTURE, "categories": [], "site": "nocat"}
    normalized = ClickBankClient._normalize_product(p)
    assert normalized["niche"] == "General"


def test_normalize_down_trend():
    p = {**PRODUCT_FIXTURE, "trend": "DOWN", "site": "downtrend"}
    normalized = ClickBankClient._normalize_product(p)
    assert normalized["trend_direction"] == "down"


def test_fetch_account_products():
    client = ClickBankClient("DEV")
    mock_resp = _mock_response(200, {"products": [PRODUCT_FIXTURE]})
    with patch("httpx.Client") as MockClient:
        MockClient.return_value.__enter__.return_value.get.return_value = mock_resp
        products = client.fetch_account_products()
    assert len(products) == 1


def test_network_error_wrapped():
    client = ClickBankClient("DEV")
    with patch("httpx.Client") as MockClient:
        MockClient.return_value.__enter__.return_value.get.side_effect = httpx.NetworkError("connection refused")
        with pytest.raises(ClickBankAPIError, match="Network error"):
            client.fetch_marketplace_offers()
