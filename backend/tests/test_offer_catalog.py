"""Tests for Phase 2.5 offer catalog: curated visibility, user-added isolation, admin gate, AI classify."""
from __future__ import annotations

from unittest.mock import patch

import pytest

from app.models.offer import Offer, OFFER_SOURCE_CURATED, OFFER_SOURCE_USER_ADDED
from app.core.tenancy import SYSTEM_TENANT_ID


# ── Curated offer visibility ───────────────────────────────────────────────────

def test_curated_offers_visible_to_all_tenants(client, auth_headers, db_session):
    """Curated offers under SYSTEM_TENANT_ID appear in tenant's offer list."""
    # Insert a curated offer directly
    curated = Offer(
        tenant_id=SYSTEM_TENANT_ID,
        source=OFFER_SOURCE_CURATED,
        external_id="test-curated-1",
        name="Test Curated Offer",
        niche="Health",
        network="ClickBank",
        aov=47.0,
        gravity=80.0,
        commission_rate=0.75,
    )
    db_session.add(curated)
    db_session.commit()

    resp = client.get("/api/v1/crm/offers", headers=auth_headers)
    assert resp.status_code == 200
    names = [o["name"] for o in resp.json()["data"]]
    assert "Test Curated Offer" in names


def test_curated_offers_not_shown_under_wrong_source_filter(client, auth_headers, db_session):
    """Filtering source=user_added excludes curated offers."""
    curated = Offer(
        tenant_id=SYSTEM_TENANT_ID,
        source=OFFER_SOURCE_CURATED,
        external_id="test-curated-filter",
        name="Should Not Appear",
        niche="Health",
        network="ClickBank",
        aov=47.0,
        gravity=80.0,
        commission_rate=0.75,
    )
    db_session.add(curated)
    db_session.commit()

    resp = client.get("/api/v1/crm/offers?source=user_added", headers=auth_headers)
    assert resp.status_code == 200
    names = [o["name"] for o in resp.json()["data"]]
    assert "Should Not Appear" not in names


# ── User-added offer isolation ────────────────────────────────────────────────

def test_user_added_offer_created_and_isolated(client, auth_headers, db_session):
    """POST /crm/offers creates a user_added offer scoped to the tenant."""
    resp = client.post(
        "/api/v1/crm/offers",
        json={"name": "My Tracked Offer", "niche": "Fitness", "network": "BuyGoods"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["source"] == "user_added"
    assert body["name"] == "My Tracked Offer"

    tenant_id = auth_headers["X-Tenant-ID"]
    from sqlalchemy import select
    offer = db_session.scalar(
        select(Offer).where(
            Offer.tenant_id == tenant_id,
            Offer.source == OFFER_SOURCE_USER_ADDED,
            Offer.name == "My Tracked Offer",
        )
    )
    assert offer is not None


def test_user_can_delete_own_user_added_offer(client, auth_headers, db_session):
    """DELETE /crm/offers/{id} removes user_added offer."""
    tenant_id = auth_headers["X-Tenant-ID"]
    offer = Offer(
        tenant_id=tenant_id,
        source=OFFER_SOURCE_USER_ADDED,
        name="To Delete",
        niche="Self Help",
        network="ClickBank",
        aov=37.0,
        gravity=None,
        commission_rate=0.75,
    )
    db_session.add(offer)
    db_session.commit()
    offer_id = str(offer.id)

    resp = client.delete(f"/api/v1/crm/offers/{offer_id}", headers=auth_headers)
    assert resp.status_code == 204

    db_session.expire_all()
    from sqlalchemy import select
    gone = db_session.scalar(select(Offer).where(Offer.id == offer_id))
    assert gone is None


def test_user_cannot_delete_curated_offer(client, auth_headers, db_session):
    """DELETE /crm/offers/{id} on a curated offer returns 403."""
    curated = Offer(
        tenant_id=auth_headers["X-Tenant-ID"],
        source=OFFER_SOURCE_CURATED,
        name="Curated Not Deletable",
        niche="Health",
        network="ClickBank",
        aov=59.0,
        gravity=100.0,
        commission_rate=0.5,
    )
    db_session.add(curated)
    db_session.commit()

    resp = client.delete(f"/api/v1/crm/offers/{curated.id}", headers=auth_headers)
    assert resp.status_code == 403


# ── Admin gate ────────────────────────────────────────────────────────────────

def test_admin_offers_endpoint_requires_platform_admin(client, auth_headers):
    """Non-admin cannot access /admin/offers."""
    resp = client.get("/api/v1/admin/offers", headers=auth_headers)
    assert resp.status_code == 403


def test_admin_seed_curated_requires_platform_admin(client, auth_headers):
    """Non-admin cannot POST /admin/offers/seed-curated."""
    resp = client.post("/api/v1/admin/offers/seed-curated", headers=auth_headers)
    assert resp.status_code == 403


# ── classify_offer ────────────────────────────────────────────────────────────

def test_classify_offer_rule_based_fallback():
    """Rule-based classify_offer returns non-empty list without Gemini."""
    from app.services.ai_service import _rule_based_classify

    class FakeOffer:
        name = "Test Supplement"
        niche = "Weight Loss"
        network = "ClickBank"
        aov = 69.0
        gravity = 80.0
        commission_rate = 0.75

    tags = _rule_based_classify(FakeOffer())
    assert len(tags) > 0
    categories = {t["category"] for t in tags}
    assert "traffic_fit" in categories
    assert "audience" in categories
    for t in tags:
        assert "label" in t
        assert "confidence" in t
        assert 0 <= t["confidence"] <= 1


def test_classify_offer_never_raises():
    """classify_offer never raises even if Gemini is down."""
    from app.services.ai_service import classify_offer

    class FakeOffer:
        name = "Broken Offer"
        niche = "Unknown"
        network = "SomeNet"
        aov = 0
        gravity = None
        commission_rate = 0

    with patch("app.services.ai_service._get_gemini", side_effect=RuntimeError("no gemini")):
        tags = classify_offer(FakeOffer())
    assert isinstance(tags, list)


def test_classify_offer_tiktok_tag_for_weight_loss():
    """Weight loss niche gets a TikTok-friendly tag from rules."""
    from app.services.ai_service import _rule_based_classify

    class Offer:
        name = "Slim Fast"
        niche = "Weight Loss"
        network = "ClickBank"
        aov = 37.0
        gravity = 30.0
        commission_rate = 0.75

    tags = _rule_based_classify(Offer())
    labels = [t["label"] for t in tags]
    assert "TikTok-friendly" in labels


def test_classify_offer_high_ticket_tag():
    """AOV > $200 gets High-ticket tag."""
    from app.services.ai_service import _rule_based_classify

    class Offer:
        name = "Premium Course"
        niche = "Make Money Online"
        network = "MaxWeb"
        aov = 997.0
        gravity = 52.0
        commission_rate = 0.50

    tags = _rule_based_classify(Offer())
    labels = [t["label"] for t in tags]
    assert "High-ticket" in labels
