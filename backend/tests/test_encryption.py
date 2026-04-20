"""Tests for Fernet encryption utility."""
from __future__ import annotations

import pytest
from cryptography.fernet import Fernet, InvalidToken


def test_round_trip(monkeypatch):
    """encrypt → decrypt returns the original dict."""
    key = Fernet.generate_key().decode()
    monkeypatch.setattr("app.core.config.settings", type("S", (), {"kimux_fernet_key": key})())

    from app.core import encryption
    data = {"developer_key": "DEV123", "clerk_key": "CLERK456"}
    ciphertext = encryption.encrypt_secrets(data)
    assert isinstance(ciphertext, str)
    assert ciphertext != str(data)
    assert encryption.decrypt_secrets(ciphertext) == data


def test_tampered_ciphertext_raises(monkeypatch):
    """Altered ciphertext must raise InvalidToken."""
    key = Fernet.generate_key().decode()
    monkeypatch.setattr("app.core.config.settings", type("S", (), {"kimux_fernet_key": key})())

    from app.core import encryption
    ciphertext = encryption.encrypt_secrets({"k": "v"})
    tampered = ciphertext[:-4] + "AAAA"

    with pytest.raises(InvalidToken):
        encryption.decrypt_secrets(tampered)


def test_no_key_configured_raises(monkeypatch):
    """Missing Fernet key must raise ValueError on encrypt attempt."""
    monkeypatch.setattr("app.core.config.settings", type("S", (), {"kimux_fernet_key": None})())

    from app.core import encryption
    with pytest.raises(ValueError, match="KIMUX_FERNET_KEY"):
        encryption.encrypt_secrets({"k": "v"})
