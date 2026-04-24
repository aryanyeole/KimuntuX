"""Tests for communication_service — send, event webhook, inbound parse."""
from __future__ import annotations

import os
from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

os.environ.setdefault("TESTING", "true")
os.environ.setdefault("KIMUX_FERNET_KEY", "iPk0unG1JxMSRewubVHdASEh8A80zLH6IURfLYXtDOo=")
os.environ.setdefault("KIMUX_REPLY_TOKEN_SECRET", "test-secret-for-comm-service-pytest-33")

import app.models  # noqa: F401 — registers all models
from app.core.security import hash_password
from app.models.activity import Activity, ActivityType
from app.models.base import Base
from app.models.communication import Communication, CommunicationDirection
from app.models.lead import Lead, LeadSource, LeadStage
from app.models.tenant import Tenant, TenantPlan
from app.models.user import User
from app.models.webhook_event import WebhookEvent
from app.core.reply_tokens import generate_reply_token, build_reply_to_address
from app.services.communication_service import (
    ParsedInboundEmail,
    ingest_inbound_parse,
    record_event_webhook,
    send_outreach_email,
)
from app.services.exceptions import SendGridSendError, TenantIsolationError


# ---------------------------------------------------------------------------
# Isolated in-memory DB for this test module
# ---------------------------------------------------------------------------

_engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
_conn = _engine.connect()
_Session = sessionmaker(bind=_conn, autocommit=False, autoflush=False)


@pytest.fixture(scope="module", autouse=True)
def _tables():
    Base.metadata.create_all(bind=_conn)
    yield
    Base.metadata.drop_all(bind=_conn)


@pytest.fixture()
def db():
    session = _Session()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


# ---------------------------------------------------------------------------
# Seed helpers
# ---------------------------------------------------------------------------

def _make_tenant(db, name="Acme") -> Tenant:
    t = Tenant(name=name, slug=f"acme-{uuid4().hex[:6]}", plan=TenantPlan.free)
    db.add(t)
    db.flush()
    return t


def _make_user(db, tenant: Tenant) -> User:
    u = User(
        full_name="Agent Smith",
        email=f"agent-{uuid4().hex[:6]}@test.io",
        hashed_password=hash_password("pw"),
        is_active=True,
        default_tenant_id=tenant.id,
    )
    db.add(u)
    db.flush()
    return u


def _make_lead(db, tenant: Tenant, email="lead@example.com") -> Lead:
    lead = Lead(
        tenant_id=tenant.id,
        first_name="Alice",
        last_name="Smith",
        email=email,
        source=LeadSource.landing_page,
        stage=LeadStage.new,
    )
    db.add(lead)
    db.flush()
    return lead


def _make_outbound_comm(db, tenant: Tenant, lead: Lead, to_email: str, msg_id="msg-abc") -> Communication:
    comm = Communication(
        tenant_id=tenant.id,
        lead_id=lead.id,
        channel="email",
        direction=CommunicationDirection.outbound,
        subject="Hello",
        body="Hello from KimuX",
        preview="Hello from KimuX",
        status="sent",
        from_email="noreply@kimux.io",
        to_email=to_email,
        provider_message_id=msg_id,
    )
    db.add(comm)
    db.flush()
    return comm


def _make_parsed(
    from_email: str,
    to_address: str,
    text_body: str = "Hi there!",
    message_id: str | None = None,
) -> ParsedInboundEmail:
    return ParsedInboundEmail(
        from_email=from_email,
        from_name="Sender",
        to_address=to_address,
        subject="Re: Hello",
        text_body=text_body,
        html_body="<p>Hi</p>",
        message_id=message_id or f"<{uuid4().hex}@mail.example.com>",
        in_reply_to=None,
    )


# ---------------------------------------------------------------------------
# send_outreach_email tests
# ---------------------------------------------------------------------------

class TestSendOutreachEmail:
    def test_send_success_creates_comm_and_activity(self, db):
        tenant = _make_tenant(db)
        user = _make_user(db, tenant)
        lead = _make_lead(db, tenant, email="success@example.com")

        mock_result = MagicMock()
        mock_result.message_id = "SG-MSG-001"

        with patch("app.services.communication_service.sendgrid_client.send_email", return_value=mock_result):
            comm = send_outreach_email(db, tenant.id, lead.id, user, "Subject A", "Body A")

        assert comm.status == "sent"
        assert comm.provider_message_id == "SG-MSG-001"
        assert comm.direction == CommunicationDirection.outbound

        activities = list(db.scalars(
            select(Activity).where(
                Activity.lead_id == lead.id,
                Activity.activity_type == ActivityType.email_sent,
            )
        ))
        assert len(activities) == 1
        assert activities[0].meta["subject"] == "Subject A"

    def test_send_failure_sets_failed_status_and_raises(self, db):
        tenant = _make_tenant(db)
        user = _make_user(db, tenant)
        lead = _make_lead(db, tenant, email="failure@example.com")

        with patch(
            "app.services.communication_service.sendgrid_client.send_email",
            side_effect=RuntimeError("API error"),
        ):
            with pytest.raises(SendGridSendError):
                send_outreach_email(db, tenant.id, lead.id, user, "Subject B", "Body B")

        comm = db.scalar(
            select(Communication).where(
                Communication.lead_id == lead.id,
                Communication.direction == CommunicationDirection.outbound,
            )
        )
        assert comm is not None
        assert comm.status == "failed"

        # No Activity row for failed sends
        activities = list(db.scalars(
            select(Activity).where(
                Activity.lead_id == lead.id,
                Activity.activity_type == ActivityType.email_sent,
            )
        ))
        assert len(activities) == 0

    def test_send_wrong_tenant_raises_isolation_error(self, db):
        tenant_a = _make_tenant(db, "TenantA")
        tenant_b = _make_tenant(db, "TenantB")
        user = _make_user(db, tenant_b)
        lead_a = _make_lead(db, tenant_a, email="leadA@example.com")

        with pytest.raises(TenantIsolationError):
            send_outreach_email(db, tenant_b.id, lead_a.id, user, "Sub", "Bod")


# ---------------------------------------------------------------------------
# record_event_webhook tests
# ---------------------------------------------------------------------------

class TestRecordEventWebhook:
    def _base_event(self, msg_id: str, event_type: str, sg_event_id: str) -> dict:
        return {
            "event": event_type,
            "sg_event_id": sg_event_id,
            "sg_message_id": msg_id,
            "email": "lead@example.com",
            "timestamp": 1700000000,
        }

    def test_delivered_creates_activity_and_updates_status(self, db):
        tenant = _make_tenant(db)
        lead = _make_lead(db, tenant, email=f"ev1-{uuid4().hex[:4]}@x.com")
        comm = _make_outbound_comm(db, tenant, lead, lead.email, msg_id=f"msg-{uuid4().hex}")

        event = self._base_event(comm.provider_message_id, "delivered", f"ev-{uuid4().hex}")
        we = record_event_webhook(db, event, signature_valid=True)

        assert we.processed is True
        db.refresh(comm)
        assert comm.status == "delivered"

        activities = list(db.scalars(
            select(Activity).where(
                Activity.lead_id == lead.id,
                Activity.activity_type == ActivityType.email_delivered,
            )
        ))
        assert len(activities) == 1

    def test_status_ladder_open_after_delivered(self, db):
        tenant = _make_tenant(db)
        lead = _make_lead(db, tenant, email=f"ev2-{uuid4().hex[:4]}@x.com")
        comm = _make_outbound_comm(db, tenant, lead, lead.email, msg_id=f"msg-{uuid4().hex}")

        msg_id = comm.provider_message_id

        record_event_webhook(db, self._base_event(msg_id, "delivered", f"ev-{uuid4().hex}"), signature_valid=True)
        db.refresh(comm)
        assert comm.status == "delivered"

        record_event_webhook(db, self._base_event(msg_id, "open", f"ev-{uuid4().hex}"), signature_valid=True)
        db.refresh(comm)
        assert comm.status == "opened"

        record_event_webhook(db, self._base_event(msg_id, "click", f"ev-{uuid4().hex}"), signature_valid=True)
        db.refresh(comm)
        assert comm.status == "clicked"

    def test_no_downgrade_delivered_after_click(self, db):
        tenant = _make_tenant(db)
        lead = _make_lead(db, tenant, email=f"ev3-{uuid4().hex[:4]}@x.com")
        comm = _make_outbound_comm(db, tenant, lead, lead.email, msg_id=f"msg-{uuid4().hex}")

        msg_id = comm.provider_message_id

        # click first
        record_event_webhook(db, self._base_event(msg_id, "click", f"ev-{uuid4().hex}"), signature_valid=True)
        db.refresh(comm)
        assert comm.status == "clicked"

        # delivered arrives late (out of order) — should not downgrade
        record_event_webhook(db, self._base_event(msg_id, "delivered", f"ev-{uuid4().hex}"), signature_valid=True)
        db.refresh(comm)
        assert comm.status == "clicked"

    def test_idempotency_same_event_id(self, db):
        tenant = _make_tenant(db)
        lead = _make_lead(db, tenant, email=f"ev4-{uuid4().hex[:4]}@x.com")
        comm = _make_outbound_comm(db, tenant, lead, lead.email, msg_id=f"msg-{uuid4().hex}")

        sg_event_id = f"ev-idem-{uuid4().hex}"
        event = self._base_event(comm.provider_message_id, "open", sg_event_id)

        we1 = record_event_webhook(db, event, signature_valid=True)
        we2 = record_event_webhook(db, event, signature_valid=True)
        assert we1.id == we2.id

        activities = list(db.scalars(
            select(Activity).where(
                Activity.lead_id == lead.id,
                Activity.activity_type == ActivityType.email_opened,
            )
        ))
        assert len(activities) == 1

    def test_orphan_event_no_matching_comm(self, db):
        event = {
            "event": "delivered",
            "sg_event_id": f"orphan-{uuid4().hex}",
            "sg_message_id": "does-not-exist-xyz",
            "email": "nobody@example.com",
        }
        we = record_event_webhook(db, event, signature_valid=True)
        assert we.processed is True
        assert we.tenant_id is None
        assert we.communication_id is None

    def test_invalid_signature_stored_but_not_processed(self, db):
        tenant = _make_tenant(db)
        lead = _make_lead(db, tenant, email=f"ev5-{uuid4().hex[:4]}@x.com")
        comm = _make_outbound_comm(db, tenant, lead, lead.email, msg_id=f"msg-{uuid4().hex}")

        event = self._base_event(comm.provider_message_id, "delivered", f"ev-badsig-{uuid4().hex}")
        we = record_event_webhook(db, event, signature_valid=False)

        assert we.processed is False
        assert we.signature_valid is False
        db.refresh(comm)
        assert comm.status == "sent"  # unchanged


# ---------------------------------------------------------------------------
# ingest_inbound_parse tests
# ---------------------------------------------------------------------------

class TestIngestInboundParse:
    def test_inbound_via_token_routes_correctly(self, db):
        tenant = _make_tenant(db)
        lead = _make_lead(db, tenant, email=f"token-lead-{uuid4().hex[:4]}@x.com")
        # Simulate an existing outbound comm so we have a real comm.id for the token
        out_comm = _make_outbound_comm(db, tenant, lead, lead.email, msg_id=f"msg-{uuid4().hex}")

        token = generate_reply_token(tenant.id, lead.id, out_comm.id)
        to_addr = build_reply_to_address(token)

        parsed = _make_parsed(from_email=lead.email, to_address=to_addr)
        we = ingest_inbound_parse(db, parsed, signature_valid=True)

        assert we.processed is True
        assert we.tenant_id == tenant.id
        assert we.lead_id == lead.id
        assert we.communication_id == out_comm.id

        inbound = db.scalar(
            select(Communication).where(
                Communication.lead_id == lead.id,
                Communication.direction == CommunicationDirection.inbound,
            )
        )
        assert inbound is not None
        assert inbound.from_email == lead.email

    def test_inbound_via_fallback_routes_correctly(self, db):
        tenant = _make_tenant(db)
        sender_email = f"fallback-{uuid4().hex[:4]}@x.com"
        lead = _make_lead(db, tenant, email=sender_email)
        out_comm = _make_outbound_comm(db, tenant, lead, sender_email, msg_id=f"msg-{uuid4().hex}")

        # No reply+ token in to_address
        parsed = _make_parsed(
            from_email=sender_email,
            to_address="outreach@kimux.io",
        )
        we = ingest_inbound_parse(db, parsed, signature_valid=True)

        assert we.processed is True
        assert we.tenant_id == tenant.id
        assert we.lead_id == lead.id

    def test_inbound_unroutable_unknown_sender(self, db):
        parsed = _make_parsed(
            from_email="nobody-unknown@stranger.com",
            to_address="outreach@kimux.io",
        )
        we = ingest_inbound_parse(db, parsed, signature_valid=True)

        assert we.processed is True
        assert we.tenant_id is None
        assert we.communication_id is None

    def test_inbound_cross_tenant_attack_rejected(self, db):
        """From: matches outbounds in two tenants — must be rejected as unroutable."""
        shared_email = f"shared-{uuid4().hex[:4]}@x.com"
        tenant_a = _make_tenant(db, "Attacker-A")
        tenant_b = _make_tenant(db, "Victim-B")

        lead_a = _make_lead(db, tenant_a, email=shared_email)
        lead_b = _make_lead(db, tenant_b, email=shared_email)
        _make_outbound_comm(db, tenant_a, lead_a, shared_email, msg_id=f"msg-{uuid4().hex}")
        _make_outbound_comm(db, tenant_b, lead_b, shared_email, msg_id=f"msg-{uuid4().hex}")

        parsed = _make_parsed(from_email=shared_email, to_address="outreach@kimux.io")
        we = ingest_inbound_parse(db, parsed, signature_valid=True)

        assert we.processed is True
        assert we.tenant_id is None  # unroutable — not routed to either tenant

    def test_inbound_idempotency_same_message_id(self, db):
        tenant = _make_tenant(db)
        lead = _make_lead(db, tenant, email=f"idem-{uuid4().hex[:4]}@x.com")
        out_comm = _make_outbound_comm(db, tenant, lead, lead.email, msg_id=f"msg-{uuid4().hex}")

        token = generate_reply_token(tenant.id, lead.id, out_comm.id)
        to_addr = build_reply_to_address(token)
        msg_id = f"<idem-{uuid4().hex}@mail.com>"

        parsed = _make_parsed(from_email=lead.email, to_address=to_addr, message_id=msg_id)
        we1 = ingest_inbound_parse(db, parsed, signature_valid=True)
        we2 = ingest_inbound_parse(db, parsed, signature_valid=True)

        assert we1.id == we2.id

    def test_inbound_quoted_reply_stripped(self, db):
        tenant = _make_tenant(db)
        email = f"quoted-{uuid4().hex[:4]}@x.com"
        lead = _make_lead(db, tenant, email=email)
        out_comm = _make_outbound_comm(db, tenant, lead, email, msg_id=f"msg-{uuid4().hex}")

        token = generate_reply_token(tenant.id, lead.id, out_comm.id)
        to_addr = build_reply_to_address(token)

        raw_body = "Thanks!\n\nOn Mon, Alice wrote:\n> Hello there\n> How are you?"
        parsed = _make_parsed(from_email=email, to_address=to_addr, text_body=raw_body)
        we = ingest_inbound_parse(db, parsed, signature_valid=True)

        inbound = db.scalar(
            select(Communication).where(
                Communication.lead_id == lead.id,
                Communication.direction == CommunicationDirection.inbound,
                Communication.from_email == email,
            )
        )
        assert inbound is not None
        assert "Thanks!" in inbound.body
        # Quoted history should be stripped
        assert "On Mon, Alice wrote:" not in inbound.body

    def test_inbound_creates_note_added_activity(self, db):
        tenant = _make_tenant(db)
        email = f"act-{uuid4().hex[:4]}@x.com"
        lead = _make_lead(db, tenant, email=email)
        out_comm = _make_outbound_comm(db, tenant, lead, email, msg_id=f"msg-{uuid4().hex}")

        token = generate_reply_token(tenant.id, lead.id, out_comm.id)
        to_addr = build_reply_to_address(token)

        parsed = _make_parsed(from_email=email, to_address=to_addr)
        ingest_inbound_parse(db, parsed, signature_valid=True)

        acts = list(db.scalars(
            select(Activity).where(
                Activity.lead_id == lead.id,
                Activity.activity_type == ActivityType.note_added,
            )
        ))
        assert len(acts) >= 1
        assert email in acts[-1].description
