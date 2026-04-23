"""Fernet symmetric encryption for storing tenant integration secrets.

Usage:
    from app.core.encryption import encrypt_secrets, decrypt_secrets
    blob = encrypt_secrets({"developer_key": "...", "clerk_key": "..."})
    data = decrypt_secrets(blob)

Key management:
    Generate a key with: python -m app.scripts.generate_fernet_key
    Store the key in KIMUX_FERNET_KEY env var.
    Migrate to AWS Secrets Manager in Phase 5.
"""
from __future__ import annotations

import json

from cryptography.fernet import Fernet, InvalidToken


def _get_fernet() -> Fernet:
    from app.core.config import settings
    key = settings.kimux_fernet_key
    if not key:
        raise ValueError(
            "KIMUX_FERNET_KEY is not configured. "
            "Generate one with: python -m app.scripts.generate_fernet_key"
        )
    return Fernet(key.encode() if isinstance(key, str) else key)


def encrypt_secrets(data: dict) -> str:
    """JSON-serialize and Fernet-encrypt a secrets dict. Returns base64 string."""
    f = _get_fernet()
    return f.encrypt(json.dumps(data).encode()).decode()


def decrypt_secrets(encrypted: str) -> dict:
    """Fernet-decrypt and JSON-deserialize. Raises InvalidToken on tamper."""
    f = _get_fernet()
    try:
        return json.loads(f.decrypt(encrypted.encode()))
    except InvalidToken:
        raise InvalidToken("Encrypted credential is invalid or was tampered with.")
