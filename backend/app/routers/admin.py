from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token, get_current_admin, get_platform_admin_user
from app.models.contact_submission import ContactSubmission
from app.models.support_message import SupportMessage
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.admin import AdminContactItem, AdminSupportMessageItem, AdminUserItem, AdminUserRoleUpdate
from app.schemas.auth import TenantResponse, TokenResponse, UserResponse
from app.schemas.offer import OfferListResponse, OfferResponse
from app.services import offer_service

router = APIRouter(prefix="/admin", tags=["admin"])

_PASSWORD_NOTE = "Secured — passwords are hashed; plain text is not stored."


def _admin_user_item(u: User) -> AdminUserItem:
    return AdminUserItem(
        id=u.id,
        full_name=u.full_name,
        email=u.email,
        username=u.email,
        password_note=_PASSWORD_NOTE,
        phone=getattr(u, "phone", None),
        address=getattr(u, "address", None),
        signup_plan=getattr(u, "signup_plan", None),
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
    tenant = None
    if target.default_tenant_id:
        tenant = db.get(Tenant, target.default_tenant_id)
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(target),
        tenant=TenantResponse.model_validate(tenant) if tenant else None,
    )


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


# ── Platform admin: curated offers catalog ───────────────────────────────────


@router.get("/offers", response_model=OfferListResponse)
def list_curated_offers(
    niche: str | None = None,
    network: str | None = None,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_platform_admin_user),
) -> OfferListResponse:
    """List all curated offers (admin view — not tenant-scoped)."""
    return offer_service.get_curated_offers(db, niche=niche, network=network)


@router.post(
    "/offers/seed-curated",
    status_code=status.HTTP_201_CREATED,
)
def seed_curated_offers(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_platform_admin_user),
) -> dict:
    """Load curated_offers_starter.json into the DB (idempotent upsert)."""
    return offer_service.seed_curated_offers(db)


@router.post(
    "/offers/{offer_id}/regenerate-tags",
    response_model=OfferResponse,
)
def regenerate_tags(
    offer_id: str,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_platform_admin_user),
) -> OfferResponse:
    """Re-run AI tagging for a single curated offer."""
    offer = offer_service.regenerate_ai_tags_for_offer(db, offer_id)
    return OfferResponse.model_validate(offer)


@router.patch("/offers/{offer_id}", response_model=OfferResponse)
def update_curated_offer(
    offer_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_platform_admin_user),
) -> OfferResponse:
    """Update any field on a curated offer."""
    offer = offer_service.admin_update_offer(db, offer_id, payload)
    return OfferResponse.model_validate(offer)


@router.delete("/offers/{offer_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
def delete_curated_offer(
    offer_id: str,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_platform_admin_user),
) -> Response:
    """Delete a curated offer."""
    offer_service.admin_delete_offer(db, offer_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
