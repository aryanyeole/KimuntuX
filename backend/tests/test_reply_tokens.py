"""Tests for reply_tokens.py — generate, verify, build, extract."""
import os
import pytest

os.environ.setdefault("KIMUX_REPLY_TOKEN_SECRET", "test-secret-for-reply-tokens-pytest")
os.environ.setdefault("KIMUX_FERNET_KEY", "iPk0unG1JxMSRewubVHdASEh8A80zLH6IURfLYXtDOo=")
os.environ.setdefault("TESTING", "true")

from app.core.reply_tokens import (
    generate_reply_token,
    verify_reply_token,
    build_reply_to_address,
    extract_token_from_address,
    ReplyTokenPayload,
)

TENANT = "00000000-0000-0000-0000-000000000001"
LEAD = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
COMM = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"


def test_round_trip():
    token = generate_reply_token(TENANT, LEAD, COMM)
    payload = verify_reply_token(token)
    assert payload is not None
    assert payload.tenant_id == TENANT
    assert payload.lead_id == LEAD
    assert payload.communication_id == COMM


def test_token_is_url_safe():
    token = generate_reply_token(TENANT, LEAD, COMM)
    # Must not contain + or / (standard base64 chars replaced in urlsafe variant)
    assert "+" not in token
    assert "/" not in token
    # Must have exactly one dot separating payload and signature
    assert token.count(".") == 1


def test_tamper_payload_rejected():
    token = generate_reply_token(TENANT, LEAD, COMM)
    payload_b64, sig_b64 = token.split(".")
    # Flip last char of payload segment
    tampered = payload_b64[:-1] + ("A" if payload_b64[-1] != "A" else "B")
    result = verify_reply_token(tampered + "." + sig_b64)
    assert result is None


def test_tamper_signature_rejected():
    token = generate_reply_token(TENANT, LEAD, COMM)
    payload_b64, sig_b64 = token.split(".")
    tampered_sig = sig_b64[:-1] + ("A" if sig_b64[-1] != "A" else "B")
    result = verify_reply_token(payload_b64 + "." + tampered_sig)
    assert result is None


def test_empty_token_returns_none():
    assert verify_reply_token("") is None


def test_malformed_no_dot_returns_none():
    assert verify_reply_token("nodothere") is None


def test_malformed_extra_dots_returns_none():
    token = generate_reply_token(TENANT, LEAD, COMM)
    assert verify_reply_token(token + ".extra") is None


def test_build_reply_to_address():
    token = generate_reply_token(TENANT, LEAD, COMM)
    addr = build_reply_to_address(token)
    assert addr.startswith("reply+")
    assert "@" in addr
    assert token in addr


def test_extract_token_from_plain_address():
    token = generate_reply_token(TENANT, LEAD, COMM)
    addr = build_reply_to_address(token)
    extracted = extract_token_from_address(addr)
    assert extracted == token


def test_extract_token_from_display_name_address():
    token = generate_reply_token(TENANT, LEAD, COMM)
    addr = build_reply_to_address(token)
    with_display = f"KimuX Reply <{addr}>"
    extracted = extract_token_from_address(with_display)
    assert extracted == token


def test_extract_token_non_reply_address_returns_none():
    assert extract_token_from_address("noreply@example.com") is None
    assert extract_token_from_address("support@kimux.io") is None


def test_extract_token_empty_string_returns_none():
    assert extract_token_from_address("") is None


def test_verify_then_build_and_extract_full_pipeline():
    token = generate_reply_token(TENANT, LEAD, COMM)
    addr = build_reply_to_address(token)
    extracted = extract_token_from_address(addr)
    payload = verify_reply_token(extracted)
    assert isinstance(payload, ReplyTokenPayload)
    assert payload.tenant_id == TENANT
    assert payload.lead_id == LEAD
    assert payload.communication_id == COMM
