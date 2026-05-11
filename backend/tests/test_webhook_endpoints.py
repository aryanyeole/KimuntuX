"""Integration tests for 3.4 HTTP endpoints: send-email, event webhook, inbound parse."""
from __future__ import annotations

import json
import os
from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest

os.environ.setdefault("TESTING", "true")
os.environ.setdefault("KIMUX_FERNET_KEY", "iPk0unG1JxMSRewubVHdASEh8A80zLH6IURfLYXtDOo=")
os.environ.setdefault("KIMUX_REPLY_TOKEN_SECRET", "test-secret-for-webhook-endpoints-34")


@pytest.fixture(scope="module", autouse=True)
def _clear_sendgrid_public_key():
    """Clear the event webhook public key for this test module.

    If .env contains a real SENDGRID_EVENT_WEBHOOK_PUBLIC_KEY the router will
    validate signatures and reject unsigned test events. Tests that explicitly
    need the key (test_invalid_signature_stored_not_processed) set it themselves
    inside a try/finally, so clearing it here at module scope is safe.
    """
    from app.core.config import settings
    original = settings.sendgrid_event_webhook_public_key
    settings.sendgrid_event_webhook_public_key = None
    yield
    settings.sendgrid_event_webhook_public_key = original

from sqlalchemy import select

from app.core.reply_tokens import build_reply_to_address, generate_reply_token
from app.models.activity import Activity, ActivityType
from app.models.communication import Communication, CommunicationDirection
from app.models.lead import Lead, LeadSource, LeadStage
from app.models.webhook_event import WebhookEvent


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _build_multipart(fields: dict[str, str], boundary: str = "KimuXBound123") -> tuple[bytes, str]:
    """Construct a multipart/form-data body from a plain dict of string fields."""
    parts = []
    for name, value in fields.items():
        parts.append(
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="{name}"\r\n'
            f"\r\n"
            f"{value}\r\n"
        )
    parts.append(f"--{boundary}--\r\n")
    body = "".join(parts).encode("utf-8")
    content_type = f"multipart/form-data; boundary={boundary}"
    return body, content_type


def _make_lead(db_session, tenant_id: str, email: str | None = None) -> Lead:
    lead = Lead(
        tenant_id=tenant_id,
        first_name="Webhook",
        last_name="Lead",
        email=email or f"wh-{uuid4().hex[:6]}@test.io",
        source=LeadSource.landing_page,
        stage=LeadStage.new,
    )
    db_session.add(lead)
    db_session.commit()
    return lead


def _make_outbound_comm(db_session, tenant_id: str, lead: Lead, msg_id: str | None = None) -> Communication:
    comm = Communication(
        tenant_id=tenant_id,
        lead_id=lead.id,
        channel="email",
        direction=CommunicationDirection.outbound,
        subject="Hello",
        body="Body text",
        preview="Body text",
        status="sent",
        from_email="noreply@kimux.io",
        to_email=lead.email,
        provider_message_id=msg_id or f"msg-{uuid4().hex}",
    )
    db_session.add(comm)
    db_session.commit()
    return comm


# ---------------------------------------------------------------------------
# Send-email endpoint tests
# ---------------------------------------------------------------------------

class TestSendEmailEndpoint:
    def test_send_email_happy_path(self, client, auth_headers, db_session):
        tenant_id = auth_headers["X-Tenant-ID"]
        lead = _make_lead(db_session, tenant_id)

        mock_result = MagicMock()
        mock_result.message_id = "SG-HTTP-001"

        with patch("app.services.communication_service.sendgrid_client.send_email", return_value=mock_result):
            resp = client.post(
                f"/api/v1/crm/leads/{lead.id}/communications/send-email",
                json={"subject": "Hello Lead", "body": "Test body text"},
                headers=auth_headers,
            )

        assert resp.status_code == 201, resp.text
        data = resp.json()
        assert data["direction"] == "outbound"
        assert data["status"] == "sent"
        assert data["provider_message_id"] == "SG-HTTP-001"

    def test_send_email_unauthorized(self, client, db_session, auth_headers):
        tenant_id = auth_headers["X-Tenant-ID"]
        lead = _make_lead(db_session, tenant_id)
        resp = client.post(
            f"/api/v1/crm/leads/{lead.id}/communications/send-email",
            json={"subject": "Hi", "body": "Body"},
        )
        assert resp.status_code == 401

    def test_send_email_lead_not_found(self, client, auth_headers):
        resp = client.post(
            f"/api/v1/crm/leads/{uuid4()}/communications/send-email",
            json={"subject": "Hi", "body": "Body"},
            headers=auth_headers,
        )
        assert resp.status_code == 404

    def test_send_email_wrong_tenant_lead(self, client, auth_headers, db_session):
        """Lead belongs to a different tenant — must get 404, not 403 (don't leak existence)."""
        from app.models.tenant import Tenant, TenantPlan
        other_tenant = Tenant(
            name="Other Tenant",
            slug=f"other-{uuid4().hex[:6]}",
            plan=TenantPlan.free,
        )
        db_session.add(other_tenant)
        db_session.flush()
        lead = _make_lead(db_session, other_tenant.id)
        db_session.commit()

        resp = client.post(
            f"/api/v1/crm/leads/{lead.id}/communications/send-email",
            json={"subject": "Hi", "body": "Body"},
            headers=auth_headers,
        )
        assert resp.status_code == 404

    def test_send_email_sendgrid_failure_returns_502(self, client, auth_headers, db_session):
        tenant_id = auth_headers["X-Tenant-ID"]
        lead = _make_lead(db_session, tenant_id)

        with patch(
            "app.services.communication_service.sendgrid_client.send_email",
            side_effect=RuntimeError("SendGrid API down"),
        ):
            resp = client.post(
                f"/api/v1/crm/leads/{lead.id}/communications/send-email",
                json={"subject": "Fail", "body": "Body"},
                headers=auth_headers,
            )

        assert resp.status_code == 502
        assert "SendGrid API down" in resp.json()["detail"]


# ---------------------------------------------------------------------------
# Event webhook tests
# ---------------------------------------------------------------------------

class TestEventWebhook:
    _URL = "/api/v1/webhooks/sendgrid/events"

    def _event(self, msg_id: str, event_type: str, sg_event_id: str | None = None) -> dict:
        return {
            "event": event_type,
            "sg_event_id": sg_event_id or f"ev-{uuid4().hex}",
            "sg_message_id": msg_id,
            "email": "test@example.com",
            "timestamp": 1700000000,
        }

    def test_valid_batch_records_events(self, client, db_session, auth_headers):
        tenant_id = auth_headers["X-Tenant-ID"]
        lead = _make_lead(db_session, tenant_id)
        comm = _make_outbound_comm(db_session, tenant_id, lead)
        msg_id = comm.provider_message_id
        sg_id = f"ev-valid-{uuid4().hex}"

        events = [self._event(msg_id, "delivered", sg_id)]
        resp = client.post(self._URL, content=json.dumps(events), headers={"Content-Type": "application/json"})

        assert resp.status_code == 200
        assert resp.json()["received"] == 1

        we = db_session.scalar(
            select(WebhookEvent).where(WebhookEvent.provider_event_id == sg_id)
        )
        assert we is not None
        assert we.processed is True
        assert we.signature_valid is True

    def test_invalid_signature_stored_not_processed(self, client, db_session, auth_headers):
        """When SENDGRID_EVENT_WEBHOOK_PUBLIC_KEY is set, bad-sig events are stored but not processed."""
        from app.core.config import settings

        tenant_id = auth_headers["X-Tenant-ID"]
        lead = _make_lead(db_session, tenant_id)
        comm = _make_outbound_comm(db_session, tenant_id, lead)
        sg_id = f"ev-badsig-{uuid4().hex}"
        events = [self._event(comm.provider_message_id, "open", sg_id)]

        # Temporarily set a fake public key so the router validates
        original_key = settings.sendgrid_event_webhook_public_key
        settings.sendgrid_event_webhook_public_key = "fake-public-key"
        try:
            resp = client.post(
                self._URL,
                content=json.dumps(events),
                headers={
                    "Content-Type": "application/json",
                    "X-Twilio-Email-Event-Webhook-Signature": "bad-sig",
                    "X-Twilio-Email-Event-Webhook-Timestamp": "1700000000",
                },
            )
        finally:
            settings.sendgrid_event_webhook_public_key = original_key

        assert resp.status_code == 200
        assert resp.json()["received"] == 0

        we = db_session.scalar(
            select(WebhookEvent).where(WebhookEvent.provider_event_id == sg_id)
        )
        assert we is not None
        assert we.signature_valid is False
        assert we.processed is False

    def test_replay_same_event_is_idempotent(self, client, db_session, auth_headers):
        tenant_id = auth_headers["X-Tenant-ID"]
        lead = _make_lead(db_session, tenant_id)
        comm = _make_outbound_comm(db_session, tenant_id, lead)
        sg_id = f"ev-idem-{uuid4().hex}"
        event = self._event(comm.provider_message_id, "delivered", sg_id)

        resp1 = client.post(self._URL, content=json.dumps([event]), headers={"Content-Type": "application/json"})
        resp2 = client.post(self._URL, content=json.dumps([event]), headers={"Content-Type": "application/json"})

        assert resp1.status_code == 200
        assert resp2.status_code == 200

        # Only one WebhookEvent row should exist
        rows = list(db_session.scalars(
            select(WebhookEvent).where(WebhookEvent.provider_event_id == sg_id)
        ))
        assert len(rows) == 1

        # Only one Activity created
        activities = list(db_session.scalars(
            select(Activity).where(
                Activity.lead_id == lead.id,
                Activity.activity_type == ActivityType.email_delivered,
            )
        ))
        assert len(activities) == 1

    def test_mixed_batch_good_and_malformed(self, client, db_session, auth_headers):
        """Good event processed; malformed dict skipped; both return 200."""
        tenant_id = auth_headers["X-Tenant-ID"]
        lead = _make_lead(db_session, tenant_id)
        comm = _make_outbound_comm(db_session, tenant_id, lead)
        sg_id = f"ev-mixed-{uuid4().hex}"

        good_event = self._event(comm.provider_message_id, "open", sg_id)
        events = [good_event, "not-a-dict"]

        resp = client.post(self._URL, content=json.dumps(events), headers={"Content-Type": "application/json"})
        assert resp.status_code == 200
        # Only the good event counted
        assert resp.json()["received"] == 1


# ---------------------------------------------------------------------------
# Inbound parse webhook tests
# ---------------------------------------------------------------------------

class TestInboundWebhook:
    _URL = "/api/v1/webhooks/sendgrid/inbound"

    def test_inbound_via_token_creates_communication(self, client, db_session, auth_headers):
        tenant_id = auth_headers["X-Tenant-ID"]
        lead = _make_lead(db_session, tenant_id)
        out_comm = _make_outbound_comm(db_session, tenant_id, lead)

        token = generate_reply_token(tenant_id, lead.id, out_comm.id)
        to_addr = build_reply_to_address(token)
        msg_id = f"<inbound-tok-{uuid4().hex}@mail.com>"

        headers_block = f"Message-ID: {msg_id}\r\nIn-Reply-To: <orig@mail.com>\r\n"
        body, content_type = _build_multipart({
            "from": f"Lead User <{lead.email}>",
            "to": to_addr,
            "subject": "Re: Hello",
            "text": "Thanks for reaching out!",
            "html": "<p>Thanks!</p>",
            "headers": headers_block,
            "attachments": "0",
        })

        resp = client.post(self._URL, content=body, headers={"Content-Type": content_type})
        assert resp.status_code == 200
        assert resp.json()["received"] is True

        inbound = db_session.scalar(
            select(Communication).where(
                Communication.lead_id == lead.id,
                Communication.direction == CommunicationDirection.inbound,
            )
        )
        assert inbound is not None
        assert inbound.from_email == lead.email
        assert "Thanks for reaching out" in inbound.body

    def test_inbound_multipart_fields_parsed_correctly_from_cached_body(self, client, db_session, auth_headers):
        """Verify that all form fields are extracted after stream is consumed for sig check.

        Even though SENDGRID_INBOUND_VERIFY=False (dev mode), the router still calls
        request.body() before parsing. This test confirms the multipart parse works
        correctly from the buffered bytes — not from the (already-consumed) stream.
        """
        tenant_id = auth_headers["X-Tenant-ID"]
        email = f"cached-{uuid4().hex[:4]}@test.io"
        lead = _make_lead(db_session, tenant_id, email=email)
        out_comm = _make_outbound_comm(db_session, tenant_id, lead, msg_id=f"msg-{uuid4().hex}")

        token = generate_reply_token(tenant_id, lead.id, out_comm.id)
        to_addr = build_reply_to_address(token)
        msg_id = f"<cached-body-test-{uuid4().hex}@mail.com>"

        headers_block = f"Message-ID: {msg_id}\r\nSubject: Re: Check\r\n"
        distinct_body = "Distinct body content for cached-body test"
        body, content_type = _build_multipart({
            "from": f"Tester <{email}>",
            "to": to_addr,
            "subject": "Re: Check",
            "text": distinct_body,
            "html": "<p>Distinct</p>",
            "headers": headers_block,
            "attachments": "0",
        })

        resp = client.post(self._URL, content=body, headers={"Content-Type": content_type})
        assert resp.status_code == 200

        inbound = db_session.scalar(
            select(Communication).where(
                Communication.from_email == email,
                Communication.direction == CommunicationDirection.inbound,
            )
        )
        assert inbound is not None
        assert distinct_body in inbound.body
        assert inbound.subject == "Re: Check"

    def test_inbound_unroutable_returns_200_no_communication(self, client, db_session):
        msg_id = f"<unroutable-{uuid4().hex}@mail.com>"
        headers_block = f"Message-ID: {msg_id}\r\n"
        body, content_type = _build_multipart({
            "from": f"stranger-{uuid4().hex[:4]}@nowhere.com",
            "to": "outreach@kimux.io",
            "subject": "Random",
            "text": "Random email",
            "html": "<p>Random</p>",
            "headers": headers_block,
            "attachments": "0",
        })

        resp = client.post(self._URL, content=body, headers={"Content-Type": content_type})
        assert resp.status_code == 200
        # The WebhookEvent is stored (for audit) but no Communication is created
        we = db_session.scalar(
            select(WebhookEvent).where(
                WebhookEvent.event_type == "inbound_parse",
                WebhookEvent.tenant_id == None,  # noqa: E711
            )
        )
        assert we is not None

    def test_inbound_duplicate_message_id_is_idempotent(self, client, db_session, auth_headers):
        tenant_id = auth_headers["X-Tenant-ID"]
        lead = _make_lead(db_session, tenant_id)
        out_comm = _make_outbound_comm(db_session, tenant_id, lead)

        token = generate_reply_token(tenant_id, lead.id, out_comm.id)
        to_addr = build_reply_to_address(token)
        msg_id = f"<idem-inbound-{uuid4().hex}@mail.com>"

        headers_block = f"Message-ID: {msg_id}\r\n"
        body, content_type = _build_multipart({
            "from": f"<{lead.email}>",
            "to": to_addr,
            "subject": "Re: Hi",
            "text": "Reply body",
            "html": "<p>Reply</p>",
            "headers": headers_block,
            "attachments": "0",
        })

        resp1 = client.post(self._URL, content=body, headers={"Content-Type": content_type})
        resp2 = client.post(self._URL, content=body, headers={"Content-Type": content_type})

        assert resp1.status_code == 200
        assert resp2.status_code == 200

        inbounds = list(db_session.scalars(
            select(Communication).where(
                Communication.lead_id == lead.id,
                Communication.direction == CommunicationDirection.inbound,
                Communication.from_email == lead.email,
            )
        ))
        # Idempotency: only one inbound Communication row
        assert len(inbounds) == 1

    def test_inbound_invalid_signature_when_verify_enabled_returns_200(self, client):
        """When verify is on and sig is invalid, return 200 but don't create a Communication."""
        from app.core.config import settings

        original = settings.sendgrid_inbound_verify
        settings.sendgrid_inbound_verify = True
        try:
            msg_id = f"<sig-fail-{uuid4().hex}@mail.com>"
            headers_block = f"Message-ID: {msg_id}\r\n"
            body, content_type = _build_multipart({
                "from": "attacker@evil.com",
                "to": "outreach@kimux.io",
                "subject": "Forged",
                "text": "You've been hacked",
                "html": "",
                "headers": headers_block,
                "attachments": "0",
            })
            resp = client.post(
                self._URL,
                content=body,
                headers={
                    "Content-Type": content_type,
                    "X-Twilio-Email-Event-Webhook-Signature": "invalid-sig",
                    "X-Twilio-Email-Event-Webhook-Timestamp": "1700000000",
                },
            )
        finally:
            settings.sendgrid_inbound_verify = original

        assert resp.status_code == 200
        assert resp.json()["received"] is False
