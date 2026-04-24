"""Reply-to address token utilities.

Tokens encode tenant_id:lead_id:communication_id for routing inbound email replies.
Format: base64url(payload_bytes) + "." + base64url(first_16_bytes_of_HMAC-SHA256)

Reply address: reply+<token>@<REPLY_DOMAIN>
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import re
from dataclasses import dataclass

from app.core.config import settings


@dataclass
class ReplyTokenPayload:
    tenant_id: str
    lead_id: str
    communication_id: str


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(s: str) -> bytes:
    # Re-add padding
    padding = 4 - len(s) % 4
    if padding != 4:
        s += "=" * padding
    return base64.urlsafe_b64decode(s)


def _hmac_secret() -> bytes:
    secret = settings.kimux_reply_token_secret
    if not secret:
        raise RuntimeError(
            "KIMUX_REPLY_TOKEN_SECRET is not set. "
            "Generate with: python -c \"import secrets; print(secrets.token_hex(32))\""
        )
    return secret.encode("utf-8")


def generate_reply_token(tenant_id: str, lead_id: str, communication_id: str) -> str:
    """Return a compact URL-safe token encoding the three IDs."""
    payload_str = f"{tenant_id}:{lead_id}:{communication_id}"
    payload_bytes = payload_str.encode("utf-8")
    sig_bytes = hmac.new(_hmac_secret(), payload_bytes, hashlib.sha256).digest()[:16]
    return _b64url_encode(payload_bytes) + "." + _b64url_encode(sig_bytes)


def verify_reply_token(token: str) -> ReplyTokenPayload | None:
    """Verify token signature and return payload, or None if invalid."""
    try:
        parts = token.split(".")
        if len(parts) != 2:
            return None
        payload_bytes = _b64url_decode(parts[0])
        provided_sig = _b64url_decode(parts[1])
        expected_sig = hmac.new(_hmac_secret(), payload_bytes, hashlib.sha256).digest()[:16]
        if not hmac.compare_digest(provided_sig, expected_sig):
            return None
        tenant_id, lead_id, communication_id = payload_bytes.decode("utf-8").split(":", 2)
        return ReplyTokenPayload(
            tenant_id=tenant_id,
            lead_id=lead_id,
            communication_id=communication_id,
        )
    except Exception:
        return None


def build_reply_to_address(token: str) -> str:
    """Build the reply-to email address for the given token."""
    return f"reply+{token}@{settings.reply_domain}"


# Matches: reply+<token>@<anything>
_REPLY_PATTERN = re.compile(r"^reply\+([^@]+)@", re.IGNORECASE)


def extract_token_from_address(address: str) -> str | None:
    """Extract the token from a reply address, or None if the address doesn't match."""
    # Strip display name if present: "Name <addr>" → "addr"
    m_angle = re.search(r"<([^>]+)>", address)
    if m_angle:
        address = m_angle.group(1)
    address = address.strip()
    m = _REPLY_PATTERN.match(address)
    return m.group(1) if m else None
