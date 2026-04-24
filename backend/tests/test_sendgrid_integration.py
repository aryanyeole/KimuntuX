"""Integration tests for Phase 3.6 SendGrid email-sender config endpoints."""
from __future__ import annotations

import os
from unittest.mock import MagicMock, patch

import pytest

os.environ.setdefault("TESTING", "true")
os.environ.setdefault("KIMUX_FERNET_KEY", "iPk0unG1JxMSRewubVHdASEh8A80zLH6IURfLYXtDOo=")
os.environ.setdefault("KIMUX_REPLY_TOKEN_SECRET", "test-secret-for-sendgrid-integration-36")

from sqlalchemy import select

from app.models.integration import Integration, IntegrationStatus


BASE = "/api/v1/crm/integrations/sendgrid"
CONNECT_PAYLOAD = {"sender_email": "hello@kimux.io", "sender_name": "KimuX Team"}


class TestSendGridConfig:
    def test_status_disconnected_before_connect(self, client, auth_headers):
        resp = client.get(f"{BASE}/status", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["connected"] is False
        assert data["sender_email"] is None

    def test_connect_creates_integration_row(self, client, auth_headers, db_session):
        resp = client.post(f"{BASE}/connect", json=CONNECT_PAYLOAD, headers=auth_headers)
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["connected"] is True
        assert data["sender_email"] == "hello@kimux.io"
        assert data["sender_name"] == "KimuX Team"

        tenant_id = auth_headers["X-Tenant-ID"]
        row = db_session.scalar(
            select(Integration).where(
                Integration.platform_name == "sendgrid",
                Integration.tenant_id == tenant_id,
            )
        )
        assert row is not None
        assert row.status == IntegrationStatus.connected
        assert row.config["sender_email"] == "hello@kimux.io"

    def test_status_connected_after_connect(self, client, auth_headers):
        resp = client.get(f"{BASE}/status", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["connected"] is True
        assert data["sender_email"] == "hello@kimux.io"

    def test_connect_idempotent_updates_config(self, client, auth_headers):
        new_payload = {"sender_email": "updated@kimux.io", "sender_name": "KimuX Updated"}
        resp = client.post(f"{BASE}/connect", json=new_payload, headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["sender_email"] == "updated@kimux.io"

        # Reset for next tests
        client.post(f"{BASE}/connect", json=CONNECT_PAYLOAD, headers=auth_headers)

    def test_connect_rejects_invalid_email(self, client, auth_headers):
        resp = client.post(
            f"{BASE}/connect",
            json={"sender_email": "not-an-email", "sender_name": "Test"},
            headers=auth_headers,
        )
        assert resp.status_code == 422

    def test_test_send_success(self, client, auth_headers):
        mock_result = MagicMock()
        mock_result.message_id = "SG-TEST-001"
        mock_result.status_code = 202

        with patch("app.services.integration_service.sendgrid_client.send_email", return_value=mock_result):
            resp = client.post(f"{BASE}/test-send", headers=auth_headers)

        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["success"] is True
        assert data["message_id"] == "SG-TEST-001"

    def test_test_send_failure_returns_502(self, client, auth_headers):
        with patch(
            "app.services.integration_service.sendgrid_client.send_email",
            side_effect=RuntimeError("SENDGRID_API_KEY not configured"),
        ):
            resp = client.post(f"{BASE}/test-send", headers=auth_headers)

        assert resp.status_code == 502
        assert "SENDGRID_API_KEY" in resp.json()["detail"]

    def test_disconnect_clears_config(self, client, auth_headers, db_session):
        resp = client.delete(f"{BASE}/disconnect", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["connected"] is False

        tenant_id = auth_headers["X-Tenant-ID"]
        row = db_session.scalar(
            select(Integration).where(
                Integration.platform_name == "sendgrid",
                Integration.tenant_id == tenant_id,
            )
        )
        db_session.refresh(row)
        assert row.status == IntegrationStatus.disconnected
        assert row.config == {}

    def test_disconnect_when_not_connected_returns_400(self, client, auth_headers):
        resp = client.delete(f"{BASE}/disconnect", headers=auth_headers)
        assert resp.status_code == 400

    def test_test_send_when_not_connected_returns_400(self, client, auth_headers):
        resp = client.post(f"{BASE}/test-send", headers=auth_headers)
        assert resp.status_code == 400
        assert "Configure" in resp.json()["detail"]

    def test_status_route_not_caught_by_generic_connect(self, client, auth_headers):
        """GET /sendgrid/status must not be matched by POST /{platform_name}/connect."""
        resp = client.get(f"{BASE}/status", headers=auth_headers)
        assert resp.status_code == 200
        assert "connected" in resp.json()
