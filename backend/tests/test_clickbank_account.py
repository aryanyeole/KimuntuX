"""Integration tests for ClickBank tenant account connect/disconnect/sync."""
from __future__ import annotations

from unittest.mock import patch, MagicMock

from cryptography.fernet import Fernet

from app.integrations.clickbank import ClickBankAuthError
from app.models.integration_credential import IntegrationCredential
from app.models.offer import Offer, OFFER_SOURCE_CB_ACCOUNT


_TEST_FERNET_KEY = Fernet.generate_key().decode()


FAKE_ACCOUNT_PRODUCTS = [
    {
        "external_id": "my-product-1",
        "name": "My Vendor Product",
        "niche": "Software",
        "network": "ClickBank",
        "aov": 97.0,
        "gravity": 0.0,
        "commission_rate": 0.0,
        "trend_direction": "stable",
        "trend_value": None,
        "external_url": "https://my-product-1.clickbank.net",
    }
]


def _patch_fernet(monkeypatch):
    monkeypatch.setattr(
        "app.core.config.settings",
        type("S", (), {
            "kimux_fernet_key": _TEST_FERNET_KEY,
            "clickbank_developer_key": None,
        })(),
    )


def test_connect_with_invalid_keys_returns_400(client, auth_headers, monkeypatch):
    """Bad credentials → 400 with descriptive error."""
    _patch_fernet(monkeypatch)
    with patch("app.integrations.clickbank.ClickBankClient.verify_credentials",
               side_effect=ClickBankAuthError("Bad credentials")):
        resp = client.post(
            "/api/v1/crm/integrations/clickbank/account/connect",
            json={"developer_key": "BAD"},
            headers=auth_headers,
        )
    assert resp.status_code == 400
    assert "Invalid ClickBank credentials" in resp.json()["detail"]


def test_connect_with_valid_keys_encrypts_and_persists(
    client, auth_headers, db_session, monkeypatch
):
    """Valid credentials are encrypted and stored; plaintext never appears."""
    _patch_fernet(monkeypatch)
    with patch("app.integrations.clickbank.ClickBankClient.verify_credentials", return_value=True), \
         patch("app.integrations.clickbank.ClickBankClient.fetch_account_summary", return_value={}):
        resp = client.post(
            "/api/v1/crm/integrations/clickbank/account/connect",
            json={"developer_key": "DEVKEY", "account_nickname": "MyAccount"},
            headers=auth_headers,
        )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["connected"] is True
    assert body["account_nickname"] == "MyAccount"

    # Fetch the stored credential
    tenant_id = auth_headers["X-Tenant-ID"]
    from sqlalchemy import select
    cred = db_session.scalar(
        select(IntegrationCredential).where(
            IntegrationCredential.tenant_id == tenant_id,
            IntegrationCredential.platform_name == "clickbank",
        )
    )
    assert cred is not None
    # Plaintext must NOT appear in stored value
    assert "DEVKEY" not in cred.encrypted_secrets


def test_credentials_encrypted_at_rest(client, auth_headers, db_session, monkeypatch):
    """Stored encrypted_secrets decrypts to original values."""
    _patch_fernet(monkeypatch)
    tenant_id = auth_headers["X-Tenant-ID"]
    from sqlalchemy import select
    cred = db_session.scalar(
        select(IntegrationCredential).where(
            IntegrationCredential.tenant_id == tenant_id,
            IntegrationCredential.platform_name == "clickbank",
        )
    )
    if cred is None:
        pytest.skip("Credential not found — run connect test first")

    from app.core.encryption import decrypt_secrets
    secrets = decrypt_secrets(cred.encrypted_secrets)
    assert secrets["developer_key"] == "DEVKEY"


def test_account_status_shows_connected(client, auth_headers, monkeypatch):
    _patch_fernet(monkeypatch)
    resp = client.get(
        "/api/v1/crm/integrations/clickbank/account/status",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["connected"] is True


def test_sync_without_connection_returns_400(client, auth_headers, db_session, monkeypatch):
    """Syncing account offers for a tenant with no credential → 400."""
    _patch_fernet(monkeypatch)
    # Use a fresh headers dict with a tenant that has no credential
    # We'll test via a direct service call with a fake tenant_id
    from app.services.offer_service import sync_tenant_clickbank_offers
    import pytest
    from fastapi import HTTPException

    with pytest.raises(HTTPException) as exc_info:
        sync_tenant_clickbank_offers(db_session, "00000000-0000-0000-0000-000000000099")
    assert exc_info.value.status_code == 400


def test_sync_account_offers_upserts(client, auth_headers, db_session, monkeypatch):
    """POST account/sync stores tenant offers under OFFER_SOURCE_CB_ACCOUNT."""
    _patch_fernet(monkeypatch)
    tenant_id = auth_headers["X-Tenant-ID"]

    with patch("app.integrations.clickbank.ClickBankClient.fetch_account_products",
               return_value=FAKE_ACCOUNT_PRODUCTS):
        resp = client.post(
            "/api/v1/crm/integrations/clickbank/account/sync",
            headers=auth_headers,
        )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["synced"] >= 1

    from sqlalchemy import select
    offers = list(
        db_session.scalars(
            select(Offer).where(
                Offer.tenant_id == tenant_id,
                Offer.source == OFFER_SOURCE_CB_ACCOUNT,
            )
        )
    )
    assert any(o.external_id == "my-product-1" for o in offers)


def test_disconnect_removes_credential_keeps_offers(client, auth_headers, db_session, monkeypatch):
    """Disconnect removes IntegrationCredential but leaves Offer rows intact."""
    _patch_fernet(monkeypatch)
    tenant_id = auth_headers["X-Tenant-ID"]

    from sqlalchemy import select
    offers_before = db_session.scalars(
        select(Offer).where(
            Offer.tenant_id == tenant_id,
            Offer.source == OFFER_SOURCE_CB_ACCOUNT,
        )
    ).all()
    offer_count_before = len(offers_before)

    resp = client.delete(
        "/api/v1/crm/integrations/clickbank/account/disconnect",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert "disconnected" in resp.json()["detail"]

    # Credential gone
    cred = db_session.scalar(
        select(IntegrationCredential).where(
            IntegrationCredential.tenant_id == tenant_id,
            IntegrationCredential.platform_name == "clickbank",
        )
    )
    assert cred is None

    # Offers retained
    db_session.expire_all()
    offers_after = db_session.scalars(
        select(Offer).where(
            Offer.tenant_id == tenant_id,
            Offer.source == OFFER_SOURCE_CB_ACCOUNT,
        )
    ).all()
    assert len(offers_after) == offer_count_before
