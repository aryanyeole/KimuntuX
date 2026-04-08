from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.contact_submission import ContactSubmission
from app.models.support_message import SupportMessage
from app.models.user import User
from app.schemas.admin import AdminContactItem, AdminSupportMessageItem, AdminUserItem

router = APIRouter(prefix="/admin", tags=["admin"])

_PASSWORD_NOTE = "Secured — passwords are hashed; plain text is not stored."


@router.get("/users", response_model=list[AdminUserItem])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> list[AdminUserItem]:
    users = db.scalars(select(User).order_by(User.created_at.desc())).all()
    return [
        AdminUserItem(
            id=u.id,
            full_name=u.full_name,
            email=u.email,
            username=u.email,
            password_note=_PASSWORD_NOTE,
            is_active=u.is_active,
            created_at=u.created_at,
        )
        for u in users
    ]


@router.get("/contact-submissions", response_model=list[AdminContactItem])
def list_contact_submissions(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> list[AdminContactItem]:
    rows = db.scalars(select(ContactSubmission).order_by(ContactSubmission.created_at.desc())).all()
    return list(rows)


@router.get("/support-messages", response_model=list[AdminSupportMessageItem])
def list_support_messages(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> list[AdminSupportMessageItem]:
    rows = db.scalars(select(SupportMessage).order_by(SupportMessage.created_at.desc())).all()
    return list(rows)
