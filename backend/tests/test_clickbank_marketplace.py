"""Integration tests for marketplace sync endpoint."""
from __future__ import annotations

from unittest.mock import patch

from app.core.tenancy import SYSTEM_TENANT_ID
from app.models.offer import Offer, OFFER_SOURCE_CB_MARKETPLACE


FAKE_PRODUCTS = [
    {
        "external_id": "vendor-mkt-1",
        "name": "Test Product A",
        "niche": "Health Fitness",
        "network": "ClickBank",
        "aov": 39.99,
        "gravity": 80.0,
        "commission_rate": 0.75,
        "trend_direction": "up",
        "trend_value": 10.0,
        "external_url": "https://vendor-mkt-1.clickbank.net",
    },
    {
        "external_id": "vendor-mkt-2",
        "name": "Test Product B",
        "niche": "Finance",
        "network": "ClickBank",
        "aov": 59.99,
        "gravity": 60.0,
        "commission_rate": 0.50,
        "trend_direction": "stable",
        "trend_value": None,
        "external_url": None,
    },
]


def test_marketplace_sync_populates_system_tenant(client, auth_headers, db_session):
    """POST marketplace/sync stores offers under SYSTEM_TENANT_ID."""
    with patch("app.integrations.clickbank.get_platform_client") as mock_factory, \
         patch("app.services.offer_service._maybe_cold_start_sync"):
        mock_client = mock_factory.return_value
        mock_client.fetch_marketplace_offers.return_value = FAKE_PRODUCTS

        resp = client.post("/api/v1/crm/offers/marketplace/sync", headers=auth_headers)

    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["synced"] >= 2
    assert body["created"] >= 2

    from sqlalchemy import select
    offers = list(
        db_session.scalars(
            select(Offer).where(
                Offer.tenant_id == SYSTEM_TENANT_ID,
                Offer.source == OFFER_SOURCE_CB_MARKETPLACE,
            )
        )
    )
    external_ids = {o.external_id for o in offers}
    assert "vendor-mkt-1" in external_ids
    assert "vendor-mkt-2" in external_ids


def test_marketplace_sync_is_idempotent(client, auth_headers, db_session):
    """Syncing twice should update, not duplicate."""
    with patch("app.integrations.clickbank.get_platform_client") as mock_factory, \
         patch("app.services.offer_service._maybe_cold_start_sync"):
        mock_client = mock_factory.return_value
        mock_client.fetch_marketplace_offers.return_value = FAKE_PRODUCTS

        resp1 = client.post("/api/v1/crm/offers/marketplace/sync", headers=auth_headers)
        resp2 = client.post("/api/v1/crm/offers/marketplace/sync", headers=auth_headers)

    assert resp1.status_code == 200
    assert resp2.status_code == 200
    # Second sync should report updated=2, created=0
    assert resp2.json()["created"] == 0
    assert resp2.json()["updated"] == 2


def test_all_tenants_see_marketplace_offers(client, auth_headers):
    """GET /offers returns marketplace offers for authenticated tenants."""
    with patch("app.services.offer_service._maybe_cold_start_sync"):
        resp = client.get("/api/v1/crm/offers", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    sources = {o["source"] for o in body["data"]}
    assert OFFER_SOURCE_CB_MARKETPLACE in sources


def test_marketplace_status_reflects_count(client, auth_headers):
    """GET marketplace/status returns non-zero count after sync."""
    with patch("app.services.offer_service._maybe_cold_start_sync"):
        resp = client.get("/api/v1/crm/offers/marketplace/status", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["offer_count"] >= 2
