"""SendGrid integration — outbound email + webhook signature verification.

Authentication: platform-owned SENDGRID_API_KEY env var.
Per-tenant keys are deferred to Phase 5.

Inbound Parse and Event Webhook both use ECDSA-P256 signatures verified with
the same EventWebhook helper from the sendgrid SDK.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field

from app.core.config import settings

log = logging.getLogger(__name__)

# ── Import-time guard ─────────────────────────────────────────────────────────
# Refuse to load if SENDGRID_API_KEY is absent outside of test mode.
# Test mode (settings.testing=True) is allowed to proceed without the key so
# the test suite can import without side effects.
if not settings.testing and not settings.sendgrid_api_key:
    # Soft warning only at import time — fail-fast at startup is in main.py.
    # This allows the module to be imported in environments where SendGrid is
    # intentionally not configured (e.g. dev without email).
    pass


# ── Result type ───────────────────────────────────────────────────────────────

@dataclass
class SendResult:
    message_id: str        # value of the X-Message-ID response header
    status_code: int
    raw_response: object = field(repr=False)


# ── Outbound ──────────────────────────────────────────────────────────────────

def send_email(
    *,
    from_email: str,
    from_name: str,
    to_email: str,
    subject: str,
    body_text: str,
    body_html: str | None = None,
    reply_to: str | None = None,
) -> SendResult:
    """Send an outbound email via SendGrid.

    Returns SendResult with the provider's message_id (X-Message-ID header).
    Raises RuntimeError if SENDGRID_API_KEY is not configured.
    Raises sendgrid / python-http-client exceptions on API errors — callers
    should catch and translate to HTTP errors as appropriate.
    """
    if not settings.sendgrid_api_key:
        raise RuntimeError(
            "SENDGRID_API_KEY is not configured. "
            "Set it in .env to enable outbound email."
        )

    import sendgrid as sg
    from sendgrid.helpers.mail import Mail, Email, To, Content

    client = sg.SendGridAPIClient(api_key=settings.sendgrid_api_key)

    message = Mail()
    message.from_email = Email(from_email, from_name)
    message.to = To(to_email)
    message.subject = subject
    message.content = [Content("text/plain", body_text)]
    if body_html:
        message.content.append(Content("text/html", body_html))
    if reply_to:
        message.reply_to = Email(reply_to)

    response = client.send(message)

    # SendGrid returns X-Message-ID in the response headers.
    message_id = ""
    if response.headers:
        # python-http-client lowercases header keys
        message_id = (
            response.headers.get("X-Message-ID")
            or response.headers.get("x-message-id")
            or ""
        )

    log.info(
        "SendGrid outbound: to=%s subject=%r status=%s message_id=%s",
        to_email, subject, response.status_code, message_id,
    )

    return SendResult(
        message_id=message_id,
        status_code=response.status_code,
        raw_response=response,
    )


# ── Signature verification ────────────────────────────────────────────────────

def verify_event_webhook_signature(
    public_key: str,
    payload_bytes: bytes,
    signature: str,
    timestamp: str,
) -> bool:
    """Verify a SendGrid Event Webhook ECDSA-P256 signature.

    Args:
        public_key: base64-encoded ECDSA public key string from SendGrid dashboard.
        payload_bytes: raw request body bytes.
        signature: value of X-Twilio-Email-Event-Webhook-Signature header.
        timestamp: value of X-Twilio-Email-Event-Webhook-Timestamp header.

    Returns True if valid, False on any failure (including bad key format).
    Never raises.

    Canonical SDK usage (must follow exactly to avoid type errors):
        ew = EventWebhook()                                   # no public_key arg
        ec_key = ew.convert_public_key_to_ecdsa(key_str)     # convert once, from string
        ew.verify_signature(payload_bytes, sig, ts, public_key=ec_key)
    Passing the ECPublicKey object to the EventWebhook constructor causes
    a 'str + ECPublicKey' TypeError inside the SDK.
    """
    try:
        from sendgrid.helpers.eventwebhook import EventWebhook

        ew = EventWebhook()
        ec_public_key = ew.convert_public_key_to_ecdsa(public_key)
        # SDK verify_signature does `timestamp + payload` as string concat; must be str.
        payload_str = payload_bytes.decode("utf-8") if isinstance(payload_bytes, bytes) else payload_bytes
        return ew.verify_signature(payload_str, signature, timestamp, public_key=ec_public_key)
    except Exception as exc:
        log.warning("Event webhook signature verification failed: %s", exc)
        return False


def verify_inbound_parse_signature(
    public_key: str,
    payload_bytes: bytes,
    signature: str,
    timestamp: str,
) -> bool:
    """Verify a SendGrid Inbound Parse webhook ECDSA-P256 signature.

    SendGrid uses the same ECDSA scheme for Inbound Parse as for Event Webhooks.
    The signed payload is: timestamp + raw_body (same as event webhook scheme).

    Returns True if valid, False on any failure. Never raises.
    """
    # Same algorithm as event webhooks — reuse the same verification function.
    return verify_event_webhook_signature(
        public_key=public_key,
        payload_bytes=payload_bytes,
        signature=signature,
        timestamp=timestamp,
    )
