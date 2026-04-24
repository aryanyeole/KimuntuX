"""Webhook receivers — no auth required. Always return 200 to avoid provider retries.

Pattern:
  1. Read raw body immediately with `await request.body()`.
  2. Verify signature against those bytes.
  3. Parse the (already-buffered) bytes into structured data.
  The stream is consumed after step 1; all later parsing works from the same buffer.
"""
from __future__ import annotations

import email as _email
import email.utils as _email_utils
import json
import logging
import time

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.integrations.sendgrid_client import (
    verify_event_webhook_signature,
    verify_inbound_parse_signature,
)
from app.services.communication_service import (
    ParsedInboundEmail,
    ingest_inbound_parse,
    record_event_webhook,
)

log = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

_TIMESTAMP_TOLERANCE = 600  # seconds (10 minutes)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _timestamp_fresh(timestamp_str: str) -> bool:
    try:
        return abs(time.time() - int(timestamp_str)) <= _TIMESTAMP_TOLERANCE
    except (ValueError, TypeError):
        return False


def _parse_multipart_form(raw_body: bytes, content_type: str) -> dict[str, bytes]:
    """Parse multipart/form-data from already-buffered raw bytes.

    Constructs a fake RFC 822 message so the stdlib email parser can handle
    the multipart body without touching the (already-consumed) request stream.
    Returns {field_name: raw_bytes}.
    """
    try:
        fake_msg = _email.message_from_bytes(
            b"Content-Type: " + content_type.encode("latin-1") + b"\r\n\r\n" + raw_body
        )
        result: dict[str, bytes] = {}
        for part in fake_msg.walk():
            if part.get_content_disposition() != "form-data":
                continue
            name = part.get_param("name", header="content-disposition")
            if not name:
                continue
            payload = part.get_payload(decode=True)
            if payload is not None:
                result[name] = payload
        return result
    except Exception as exc:
        log.warning("Multipart parse error: %s", exc)
        return {}


def _parse_header_block(header_text: str) -> dict[str, str]:
    """Parse a raw email header block (as sent by SendGrid) into a lowercase-keyed dict."""
    result: dict[str, str] = {}
    try:
        msg = _email.message_from_string(header_text + "\r\n\r\n")
        for key in msg.keys():
            result[key.lower()] = msg[key]
    except Exception:
        pass
    return result


# ---------------------------------------------------------------------------
# POST /sendgrid/events
# ---------------------------------------------------------------------------

@router.post("/sendgrid/events")
async def sendgrid_events(request: Request, db: Session = Depends(get_db)) -> dict:
    """Receive SendGrid Event Webhook batch. Always return 200."""
    raw_body = await request.body()

    sig = request.headers.get("X-Twilio-Email-Event-Webhook-Signature", "")
    ts = request.headers.get("X-Twilio-Email-Event-Webhook-Timestamp", "")
    public_key = settings.sendgrid_event_webhook_public_key or ""

    # Signature + timestamp validation only when a public key is configured.
    # In dev (no key), all events are accepted to simplify local testing.
    if public_key:
        sig_ok = verify_event_webhook_signature(public_key, raw_body, sig, ts)
        ts_ok = _timestamp_fresh(ts)
        if not (sig_ok and ts_ok):
            log.warning("SendGrid event webhook: signature or timestamp invalid — storing with signature_valid=False")
            try:
                events = json.loads(raw_body)
                for ev in (events if isinstance(events, list) else [events]):
                    if isinstance(ev, dict):
                        record_event_webhook(db, ev, signature_valid=False)
            except Exception:
                record_event_webhook(
                    db,
                    {"raw": raw_body.decode("utf-8", errors="replace")},
                    signature_valid=False,
                )
            return {"received": 0}

    try:
        events = json.loads(raw_body)
    except Exception as exc:
        log.error("SendGrid events: invalid JSON: %s", exc)
        return {"received": 0}

    processed = 0
    for ev in (events if isinstance(events, list) else [events]):
        if not isinstance(ev, dict):
            continue
        try:
            record_event_webhook(db, ev, signature_valid=True)
            processed += 1
        except Exception as exc:
            log.error("Error processing SendGrid event %s: %s", ev.get("sg_event_id"), exc)

    return {"received": processed}


# ---------------------------------------------------------------------------
# POST /sendgrid/inbound
# ---------------------------------------------------------------------------

@router.post("/sendgrid/inbound")
async def sendgrid_inbound(request: Request, db: Session = Depends(get_db)) -> dict:
    """Receive SendGrid Inbound Parse webhook. Always return 200."""
    # Read stream once — all downstream parsing uses this buffer.
    raw_body = await request.body()

    if settings.sendgrid_inbound_verify:
        sig = request.headers.get("X-Twilio-Email-Event-Webhook-Signature", "")
        ts = request.headers.get("X-Twilio-Email-Event-Webhook-Timestamp", "")
        public_key = settings.sendgrid_inbound_public_key or ""
        sig_ok = bool(public_key) and verify_inbound_parse_signature(public_key, raw_body, sig, ts)
        if not sig_ok:
            log.warning("Inbound parse signature verification failed")
            return {"received": False}

    content_type = request.headers.get("content-type", "")
    # Parse from the cached raw bytes — stream was already consumed above.
    fields = _parse_multipart_form(raw_body, content_type)

    raw_from = fields.get("from", b"").decode("utf-8", errors="replace")
    from_name, from_email = _email_utils.parseaddr(raw_from)
    if not from_email:
        from_email = raw_from.strip()

    to_address = fields.get("to", b"").decode("utf-8", errors="replace").strip()
    subject = fields.get("subject", b"").decode("utf-8", errors="replace")
    text_body = fields.get("text", b"").decode("utf-8", errors="replace")
    html_body = fields.get("html", b"").decode("utf-8", errors="replace")

    # SendGrid sends the raw header block as a single "headers" form field.
    headers_text = fields.get("headers", b"").decode("utf-8", errors="replace")
    parsed_headers = _parse_header_block(headers_text)

    ts_fallback = request.headers.get("X-Twilio-Email-Event-Webhook-Timestamp", "0")
    message_id = parsed_headers.get("message-id", "").strip("<>") or f"unknown-{ts_fallback}"
    in_reply_to_raw = parsed_headers.get("in-reply-to", "").strip("<>").strip()
    in_reply_to = in_reply_to_raw or None

    # Collect attachment metadata only — no file bytes persisted in Phase 3.
    attachments: list[dict] = []
    try:
        num_attachments = int(fields.get("attachments", b"0").decode("utf-8", errors="replace") or "0")
    except ValueError:
        num_attachments = 0
    for i in range(1, num_attachments + 1):
        att_bytes = fields.get(f"attachment{i}")
        if att_bytes is not None:
            attachments.append({
                "filename": f"attachment{i}",
                "size": len(att_bytes),
                "content_type": "application/octet-stream",
            })

    parsed = ParsedInboundEmail(
        from_email=from_email,
        from_name=from_name,
        to_address=to_address,
        subject=subject,
        text_body=text_body,
        html_body=html_body,
        message_id=message_id,
        in_reply_to=in_reply_to,
        headers=parsed_headers,
        attachments=attachments,
    )

    ingest_inbound_parse(db, parsed, signature_valid=True)
    return {"received": True}
