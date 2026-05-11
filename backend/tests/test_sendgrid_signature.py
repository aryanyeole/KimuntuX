"""Tests for sendgrid_client signature verification."""
import base64
import os

os.environ.setdefault("TESTING", "true")
os.environ.setdefault("KIMUX_FERNET_KEY", "iPk0unG1JxMSRewubVHdASEh8A80zLH6IURfLYXtDOo=")
os.environ.setdefault("KIMUX_REPLY_TOKEN_SECRET", "test-secret-for-reply-tokens-pytest")

from app.integrations.sendgrid_client import (
    verify_event_webhook_signature,
    verify_inbound_parse_signature,
)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _generate_signed_pair(payload: bytes, timestamp: str):
    """Return (public_key_b64_str, signature_b64_str) signed exactly as SendGrid does.

    SendGrid signs: SHA-256(timestamp_bytes + payload_bytes) with ECDSA-P256.
    The public key is base64-encoded DER (SubjectPublicKeyInfo).
    """
    from cryptography.hazmat.primitives.asymmetric import ec
    from cryptography.hazmat.primitives import hashes, serialization

    private_key = ec.generate_private_key(ec.SECP256R1())
    public_key_obj = private_key.public_key()

    pub_der = public_key_obj.public_bytes(
        serialization.Encoding.DER,
        serialization.PublicFormat.SubjectPublicKeyInfo,
    )
    pub_b64 = base64.b64encode(pub_der).decode("ascii")

    signed_message = timestamp.encode() + payload
    sig_der = private_key.sign(signed_message, ec.ECDSA(hashes.SHA256()))
    sig_b64 = base64.b64encode(sig_der).decode("ascii")

    return pub_b64, sig_b64


FAKE_PUBLIC_KEY = "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEfake=="
FAKE_SIG = "MEYCIQCfake=="
FAKE_TIMESTAMP = "1713600000"
FAKE_PAYLOAD = b'[{"event":"open"}]'


# ── Happy-path tests (real key pair) ─────────────────────────────────────────

def test_verify_event_webhook_valid_signature_returns_true():
    """End-to-end: generate a real ECDSA key pair, sign a payload, verify it."""
    timestamp = "1700000000"
    payload = b'[{"event":"open","email":"test@example.com"}]'
    pub_key, signature = _generate_signed_pair(payload, timestamp)

    result = verify_event_webhook_signature(
        public_key=pub_key,
        payload_bytes=payload,
        signature=signature,
        timestamp=timestamp,
    )
    assert result is True


def test_verify_event_webhook_valid_key_wrong_payload_returns_false():
    """Correct key pair but payload was tampered after signing → must reject."""
    timestamp = "1700000000"
    payload = b'[{"event":"click","url":"https://example.com"}]'
    pub_key, signature = _generate_signed_pair(payload, timestamp)

    result = verify_event_webhook_signature(
        public_key=pub_key,
        payload_bytes=payload + b"tampered",
        signature=signature,
        timestamp=timestamp,
    )
    assert result is False


def test_verify_event_webhook_valid_key_wrong_timestamp_returns_false():
    """Replay with a different timestamp → signed message differs → must reject."""
    timestamp = "1700000000"
    payload = b'[{"event":"delivered"}]'
    pub_key, signature = _generate_signed_pair(payload, timestamp)

    result = verify_event_webhook_signature(
        public_key=pub_key,
        payload_bytes=payload,
        signature=signature,
        timestamp="9999999999",  # different timestamp
    )
    assert result is False


def test_verify_inbound_parse_valid_signature_returns_true():
    """Inbound parse uses the same ECDSA scheme; verify the delegation is correct."""
    timestamp = "1700000001"
    payload = b"--boundary\r\nContent-Disposition: form-data; name=\"text\"\r\n\r\nHello\r\n--boundary--"
    pub_key, signature = _generate_signed_pair(payload, timestamp)

    result = verify_inbound_parse_signature(
        public_key=pub_key,
        payload_bytes=payload,
        signature=signature,
        timestamp=timestamp,
    )
    assert result is True


# ── Rejection tests (fake / invalid inputs) ──────────────────────────────────

def test_verify_event_webhook_bad_key_returns_false():
    result = verify_event_webhook_signature(
        public_key=FAKE_PUBLIC_KEY,
        payload_bytes=FAKE_PAYLOAD,
        signature=FAKE_SIG,
        timestamp=FAKE_TIMESTAMP,
    )
    assert result is False


def test_verify_event_webhook_mutated_payload_returns_false():
    result = verify_event_webhook_signature(
        public_key=FAKE_PUBLIC_KEY,
        payload_bytes=FAKE_PAYLOAD + b"x",
        signature=FAKE_SIG,
        timestamp=FAKE_TIMESTAMP,
    )
    assert result is False


def test_verify_inbound_parse_delegates_same_scheme():
    r1 = verify_event_webhook_signature(
        public_key=FAKE_PUBLIC_KEY,
        payload_bytes=FAKE_PAYLOAD,
        signature=FAKE_SIG,
        timestamp=FAKE_TIMESTAMP,
    )
    r2 = verify_inbound_parse_signature(
        public_key=FAKE_PUBLIC_KEY,
        payload_bytes=FAKE_PAYLOAD,
        signature=FAKE_SIG,
        timestamp=FAKE_TIMESTAMP,
    )
    assert r1 == r2


def test_verify_never_raises_on_garbage_input():
    result = verify_event_webhook_signature(
        public_key="not-a-key",
        payload_bytes=b"",
        signature="not-a-sig",
        timestamp="",
    )
    assert result is False


def test_verify_empty_all_fields_returns_false():
    result = verify_event_webhook_signature(
        public_key="",
        payload_bytes=b"",
        signature="",
        timestamp="",
    )
    assert result is False
