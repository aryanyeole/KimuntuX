from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.models.user import User


def ensure_bootstrap_admin(db: Session) -> None:
    email = (settings.bootstrap_admin_email or "").strip().lower()
    password = settings.bootstrap_admin_password or ""
    if not email or not password:
        return

    user = db.scalar(select(User).where(User.email == email))
    pw_hash = hash_password(password)
    name = (settings.bootstrap_admin_full_name or "Admin").strip() or "Admin"

    if user is None:
        db.add(
            User(
                full_name=name,
                email=email,
                hashed_password=pw_hash,
                is_active=True,
                is_admin=True,
            )
        )
    else:
        user.full_name = name
        user.hashed_password = pw_hash
        user.is_active = True
        user.is_admin = True

    db.commit()
