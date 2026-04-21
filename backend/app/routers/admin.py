from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token, get_current_admin
from app.models.contact_submission import ContactSubmission
from app.models.support_message import SupportMessage
from app.models.user import User
from app.schemas.admin import AdminContactItem, AdminSupportMessageItem, AdminUserItem, AdminUserRoleUpdate
from app.schemas.auth import TokenResponse

router = APIRouter(prefix="/admin", tags=["admin"])

_PASSWORD_NOTE = "Secured — passwords are hashed; plain text is not stored."


def _admin_user_item(u: User) -> AdminUserItem:
    return AdminUserItem(
        id=u.id,
        full_name=u.full_name,
        email=u.email,
        username=u.email,
        password_note=_PASSWORD_NOTE,
        is_active=u.is_active,
        is_admin=bool(getattr(u, "is_admin", False)),
        created_at=u.created_at,
    )


@router.get("/users", response_model=list[AdminUserItem])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> list[AdminUserItem]:
    users = db.scalars(select(User).order_by(User.created_at.desc())).all()
    return [_admin_user_item(u) for u in users]


@router.post("/users/{user_id}/access-token", response_model=TokenResponse)
def issue_user_access_token(
    user_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> TokenResponse:
    """Issue a JWT for the target user so an admin can use the app as that account (impersonation)."""
    target = db.get(User, user_id)
    if target is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    token = create_access_token(target.id)
    return TokenResponse(access_token=token, user=target)


@router.patch("/users/{user_id}/role", response_model=AdminUserItem)
def update_user_admin_role(
    user_id: str,
    payload: AdminUserRoleUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> AdminUserItem:
    """Grant or revoke admin. Cannot remove your own admin flag (avoid lockout)."""
    target = db.get(User, user_id)
    if target is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if target.id == admin.id and not payload.is_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot remove your own administrator access.",
        )
    target.is_admin = payload.is_admin
    db.add(target)
    db.commit()
    db.refresh(target)
    return _admin_user_item(target)


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
