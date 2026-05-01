from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.integrations import sendgrid_client
from app.models.activity import Activity, ActivityType
from app.models.communication import Communication, CommunicationChannel, CommunicationDirection
from app.models.lead import Lead
from app.models.webhook_event import WebhookEvent
from app.core.config import settings
from app.core.reply_tokens import (
    build_reply_to_address,
    extract_token_from_address,
    generate_reply_token,
    verify_reply_token,
)
from app.schemas.communication import (
    CommunicationCreate,
    CommunicationListResponse,
    CommunicationResponse,
)
from app.services.exceptions import SendGridSendError, TenantIsolationError

_PREVIEW_LEN = 100

# Status precedence — higher number wins; never downgrade.
_STATUS_PRECEDENCE: dict[str, int] = {
    "queued": 0,
    "sent": 1,
    "delivered": 2,
    "opened": 3,
    "clicked": 4,
    "bounced": 5,
    "failed": 5,
}

# SendGrid event type → (ActivityType, Communication.status value)
_SG_EVENT_MAP: dict[str, tuple[ActivityType, str]] = {
    "delivered": (ActivityType.email_delivered, "delivered"),
    "open":      (ActivityType.email_opened,    "opened"),
    "click":     (ActivityType.email_clicked,   "clicked"),
    "bounce":    (ActivityType.email_bounced,   "bounced"),
}


# ---------------------------------------------------------------------------
# Dataclass for parsed inbound emails (populated by the router from
# multipart/form-data sent by SendGrid Inbound Parse)
# ---------------------------------------------------------------------------

@dataclass
class ParsedInboundEmail:
    from_email: str
    from_name: str
    to_address: str
    subject: str
    text_body: str
    html_body: str
    message_id: str
    in_reply_to: str | None
    headers: dict[str, Any] = field(default_factory=dict)
    attachments: list[dict[str, Any]] = field(default_factory=list)

    def as_dict(self) -> dict:
        return {
            "from_email": self.from_email,
            "from_name": self.from_name,
            "to_address": self.to_address,
            "subject": self.subject,
            "text_body": self.text_body,
            "html_body": self.html_body,
            "message_id": self.message_id,
            "in_reply_to": self.in_reply_to,
            "headers": self.headers,
            "attachments": self.attachments,
        }


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _get_lead_for_tenant(db: Session, lead_id: str, tenant_id: str) -> Lead:
    lead = db.scalar(select(Lead).where(Lead.id == lead_id, Lead.tenant_id == tenant_id))
    if lead is None:
        raise TenantIsolationError(
            f"Lead {lead_id} does not exist or does not belong to tenant {tenant_id}"
        )
    return lead


def _create_activity(
    db: Session,
    *,
    lead: Lead,
    activity_type: ActivityType,
    description: str,
    meta: dict | None = None,
    channel: str | None = "email",
    performed_by: str | None = None,
) -> Activity:
    act = Activity(
        tenant_id=lead.tenant_id,
        lead_id=lead.id,
        activity_type=activity_type,
        description=description,
        meta=meta,
        channel=channel,
        performed_by=performed_by,
    )
    db.add(act)
    return act


def _upgrade_status(current: str | None, new_status: str) -> str:
    """Return the higher-precedence status; never downgrade."""
    current_p = _STATUS_PRECEDENCE.get(current or "queued", 0)
    new_p = _STATUS_PRECEDENCE.get(new_status, 0)
    return new_status if new_p > current_p else (current or "queued")


# ---------------------------------------------------------------------------
# Existing CRUD (unchanged)
# ---------------------------------------------------------------------------

def get_communications(
    db: Session,
    tenant_id: str,
    *,
    lead_id: str | None = None,
) -> CommunicationListResponse:
    query = (
        select(Communication)
        .where(Communication.tenant_id == tenant_id)
        .order_by(Communication.timestamp.desc())
    )
    if lead_id:
        if not db.scalar(
            select(Lead.id).where(Lead.id == lead_id, Lead.tenant_id == tenant_id)
        ):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
        query = query.where(Communication.lead_id == lead_id)

    comms = list(db.scalars(query))
    return CommunicationListResponse(
        data=[CommunicationResponse.model_validate(c) for c in comms],
        total=len(comms),
    )


def create_communication(
    db: Session, data: CommunicationCreate, tenant_id: str
) -> Communication:
    if not db.scalar(
        select(Lead.id).where(Lead.id == data.lead_id, Lead.tenant_id == tenant_id)
    ):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")

    preview = data.body[:_PREVIEW_LEN].replace("\n", " ")
    comm = Communication(
        tenant_id=tenant_id,
        lead_id=data.lead_id,
        channel=data.channel,
        direction=data.direction,
        subject=data.subject,
        body=data.body,
        preview=preview,
        meta=data.meta,
    )
    db.add(comm)
    db.commit()
    db.refresh(comm)
    return comm


# ---------------------------------------------------------------------------
# Phase 3.3 — outbound send
# ---------------------------------------------------------------------------

def send_outreach_email(
    db: Session,
    tenant_id: str,
    lead_id: str,
    user,
    subject: str,
    body: str,
) -> Communication:
    """Send an outbound email to a lead via SendGrid.

    Raises TenantIsolationError if lead doesn't belong to tenant_id.
    Raises SendGridSendError on API failure.
    """
    lead = _get_lead_for_tenant(db, lead_id, tenant_id)

    from_email = settings.default_sender_email or "contact@kimux.io"
    from_name = settings.default_sender_name or "KimuX"

    preview = body[:_PREVIEW_LEN].replace("\n", " ")
    comm = Communication(
        tenant_id=tenant_id,
        lead_id=lead.id,
        channel=CommunicationChannel.email,
        direction=CommunicationDirection.outbound,
        subject=subject,
        body=body,
        preview=preview,
        status="queued",
        from_email=from_email,
        to_email=lead.email,
        provider_message_id=None,
    )
    db.add(comm)
    db.flush()  # assign comm.id without committing

    reply_token = generate_reply_token(tenant_id, lead.id, comm.id)
    reply_to_addr = build_reply_to_address(reply_token)

    try:
        result = sendgrid_client.send_email(
            from_email=from_email,
            from_name=from_name,
            to_email=lead.email,
            subject=subject,
            body_text=body,
            reply_to=reply_to_addr,
        )
    except Exception as exc:
        comm.status = "failed"
        db.commit()
        raise SendGridSendError(str(exc)) from exc

    comm.provider_message_id = result.message_id
    comm.status = "sent"

    _create_activity(
        db,
        lead=lead,
        activity_type=ActivityType.email_sent,
        description=f"Outbound email sent: {subject}",
        meta={"provider_message_id": result.message_id, "subject": subject},
        performed_by=str(user.id) if user else None,
    )

    db.commit()
    db.refresh(comm)
    return comm


# ---------------------------------------------------------------------------
# Phase 3.3 — event webhook ingestion
# ---------------------------------------------------------------------------

def record_event_webhook(
    db: Session,
    event: dict,
    signature_valid: bool,
) -> WebhookEvent:
    """Persist one SendGrid event-webhook event. Idempotent by sg_event_id."""
    sg_event_id = event.get("sg_event_id")
    event_type = event.get("event", "unknown")

    # Idempotency: if we've already processed this exact event_id, return existing row.
    if sg_event_id:
        existing = db.scalar(
            select(WebhookEvent).where(
                WebhookEvent.provider == "sendgrid",
                WebhookEvent.provider_event_id == sg_event_id,
            )
        )
        if existing is not None:
            return existing

    we = WebhookEvent(
        provider="sendgrid",
        event_type=event_type,
        provider_event_id=sg_event_id,
        payload=event,
        signature_valid=signature_valid,
        processed=False,
    )
    db.add(we)
    db.flush()

    if not signature_valid:
        db.commit()
        db.refresh(we)
        return we

    # Locate the Communication this event belongs to via sg_message_id.
    sg_message_id = event.get("sg_message_id") or event.get("smtp-id") or ""
    comm: Communication | None = None
    if sg_message_id:
        comm = db.scalar(
            select(Communication).where(
                Communication.provider_message_id == sg_message_id
            )
        )

    if comm is None:
        # Orphan event — no matching outbound. Normal in production.
        we.processed = True
        db.commit()
        db.refresh(we)
        return we

    # Map event type → Activity + status upgrade, or ignore benign event types.
    mapping = _SG_EVENT_MAP.get(event_type)
    if mapping is None:
        # processed, dropped, deferred, spamreport, etc. — update IDs but no Activity.
        we.tenant_id = comm.tenant_id
        we.communication_id = comm.id
        we.processed = True
        db.commit()
        db.refresh(we)
        return we

    activity_type, new_status = mapping

    # Upgrade comm status (one-way ladder).
    comm.status = _upgrade_status(comm.status, new_status)

    lead = db.scalar(select(Lead).where(Lead.id == comm.lead_id))
    if lead is not None:
        _create_activity(
            db,
            lead=lead,
            activity_type=activity_type,
            description=f"Email {event_type}: {comm.subject or '(no subject)'}",
            meta={"sg_event_id": sg_event_id, "sg_message_id": sg_message_id},
        )

    we.tenant_id = comm.tenant_id
    we.lead_id = comm.lead_id
    we.communication_id = comm.id
    we.processed = True

    db.commit()
    db.refresh(we)
    return we


# ---------------------------------------------------------------------------
# Phase 3.3 — inbound parse ingestion
# ---------------------------------------------------------------------------

def ingest_inbound_parse(
    db: Session,
    parsed: ParsedInboundEmail,
    signature_valid: bool,
) -> WebhookEvent:
    """Persist an inbound email from SendGrid Inbound Parse. Idempotent by Message-ID."""
    # Idempotency: scan existing inbound_parse events for same message_id.
    existing_events = list(
        db.scalars(
            select(WebhookEvent).where(
                WebhookEvent.provider == "sendgrid",
                WebhookEvent.event_type == "inbound_parse",
            )
        )
    )
    for ev in existing_events:
        if ev.payload and ev.payload.get("message_id") == parsed.message_id:
            return ev

    we = WebhookEvent(
        provider="sendgrid",
        event_type="inbound_parse",
        provider_event_id=None,
        payload=parsed.as_dict(),
        signature_valid=signature_valid,
        processed=False,
    )
    db.add(we)
    db.flush()

    # ── Routing ──────────────────────────────────────────────────────────────
    tenant_id: str | None = None
    lead_id: str | None = None
    replied_to_comm_id: str | None = None

    token = extract_token_from_address(parsed.to_address)
    token_payload = verify_reply_token(token) if token else None

    if token_payload is not None:
        # Token path: definitive routing via encoded tenant/lead/comm IDs.
        tenant_id = token_payload.tenant_id
        lead_id = token_payload.lead_id
        replied_to_comm_id = token_payload.communication_id
    else:
        # Fallback: find prior outbound Communications whose to_email matches sender.
        matching_comms = list(
            db.scalars(
                select(Communication).where(
                    Communication.to_email == parsed.from_email,
                    Communication.direction == CommunicationDirection.outbound,
                )
            )
        )
        unique_tenants = {c.tenant_id for c in matching_comms if c.tenant_id}
        if len(unique_tenants) == 1:
            tenant_id = unique_tenants.pop()
            tenant_comms = [c for c in matching_comms if c.tenant_id == tenant_id]
            latest = max(tenant_comms, key=lambda c: c.timestamp)
            lead_id = latest.lead_id
            replied_to_comm_id = latest.id
        else:
            # Zero or multiple tenants → unroutable.
            we.processed = True
            db.commit()
            db.refresh(we)
            return we

    # Defensive: verify resolved lead actually belongs to resolved tenant.
    lead = db.scalar(
        select(Lead).where(Lead.id == lead_id, Lead.tenant_id == tenant_id)
    )
    if lead is None:
        we.processed = True
        db.commit()
        db.refresh(we)
        return we

    # ── Strip quoted reply history ────────────────────────────────────────────
    try:
        from email_reply_parser import EmailReplyParser
        stripped = EmailReplyParser.parse_reply(parsed.text_body)
    except Exception:
        stripped = parsed.text_body

    if not (stripped and stripped.strip()):
        stripped = parsed.text_body

    # ── Persist inbound Communication ─────────────────────────────────────────
    preview = stripped[:_PREVIEW_LEN].replace("\n", " ")
    inbound_comm = Communication(
        tenant_id=tenant_id,
        lead_id=lead.id,
        channel=CommunicationChannel.email,
        direction=CommunicationDirection.inbound,
        subject=parsed.subject,
        body=stripped,
        preview=preview,
        from_email=parsed.from_email,
        to_email=parsed.to_address,
        in_reply_to_message_id=parsed.in_reply_to,
        read=False,
        meta={
            "attachment_count": len(parsed.attachments),
            "attachment_names": [a.get("filename", "") for a in parsed.attachments],
        },
    )
    db.add(inbound_comm)
    db.flush()

    _create_activity(
        db,
        lead=lead,
        activity_type=ActivityType.note_added,
        description=f"Received reply from {parsed.from_email}",
        meta={"message_id": parsed.message_id, "in_reply_to": parsed.in_reply_to},
    )

    we.tenant_id = tenant_id
    we.lead_id = lead.id
    we.communication_id = replied_to_comm_id
    we.processed = True

    db.commit()
    db.refresh(we)
    return we
