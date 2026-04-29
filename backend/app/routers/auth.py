from __future__ import annotations

import re

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token, get_current_user, hash_password, verify_password
from app.models.tenant import Tenant, TenantPlan
from app.models.tenant_membership import MemberRole, TenantMembership
from app.models.user import User
from app.schemas.auth import (
    AccountDeleteRequest,
    OAuthTokenResponse,
    PasswordChangeRequest,
    TenantResponse,
    TokenResponse,
    UserLogin,
    UserProfileUpdate,
    UserResponse,
    UserSignup,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def authenticate_user(email: str, password: str, db: Session) -> User:
    user = db.scalar(select(User).where(User.email == email.lower()))
    if user is None or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    return user


def _slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug[:80] or "tenant"


def _get_user_tenant(db: Session, user: User) -> Tenant | None:
    if not user.default_tenant_id:
        return None
    return db.scalar(select(Tenant).where(Tenant.id == user.default_tenant_id))


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: UserSignup, db: Session = Depends(get_db)) -> TokenResponse:
    existing_user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already registered")

    user = User(
        full_name=payload.full_name.strip(),
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
        phone=(payload.phone or "").strip() or None,
        address=(payload.address or "").strip() or None,
        signup_plan=payload.signup_plan,
    )
    db.add(user)
    db.flush()

    base_slug = _slugify(payload.full_name.strip())
    slug = base_slug
    counter = 1
    while db.scalar(select(Tenant).where(Tenant.slug == slug)):
        slug = f"{base_slug}-{counter}"
        counter += 1

    tenant = Tenant(
        name=f"{payload.full_name.strip()}'s Workspace",
        slug=slug,
        plan=TenantPlan.free,
    )
    db.add(tenant)
    db.flush()

    membership = TenantMembership(
        tenant_id=tenant.id,
        user_id=user.id,
        role=MemberRole.owner,
    )
    db.add(membership)

    user.default_tenant_id = tenant.id
    db.commit()
    db.refresh(user)
    db.refresh(tenant)

    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
        tenant=TenantResponse.model_validate(tenant),
    )


@router.post("/token", response_model=OAuthTokenResponse)
def token(
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> OAuthTokenResponse:
    user = authenticate_user(form.username, form.password, db)
    return OAuthTokenResponse(access_token=create_access_token(user.id))


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)) -> TokenResponse:
    user = authenticate_user(payload.email, payload.password, db)
    tenant = _get_user_tenant(db, user)
    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
        tenant=TenantResponse.model_validate(tenant) if tenant else None,
    )


@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse.model_validate(current_user)


@router.patch("/me", response_model=UserResponse)
def update_current_user(
    payload: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    data = payload.model_dump(exclude_unset=True)
    if not data:
        return UserResponse.model_validate(current_user)
    if "full_name" in data and data["full_name"] is not None:
        current_user.full_name = data["full_name"].strip()
    if "phone" in data:
        current_user.phone = (data["phone"] or "").strip() or None
    if "address" in data:
        current_user.address = (data["address"] or "").strip() or None
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.post("/me/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    payload: PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
    current_user.hashed_password = hash_password(payload.new_password)
    db.add(current_user)
    db.commit()


@router.post("/me/delete", status_code=status.HTTP_204_NO_CONTENT)
def delete_own_account(
    payload: AccountDeleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    if current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin accounts cannot be deleted through this endpoint.",
        )
    if not verify_password(payload.password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid password")

    uid = current_user.id
    memberships = list(db.scalars(select(TenantMembership).where(TenantMembership.user_id == uid)).all())
    tenant_ids = {m.tenant_id for m in memberships}
    for membership in memberships:
        db.delete(membership)
    db.flush()

    for tenant_id in tenant_ids:
        remaining = db.scalar(
            select(func.count()).select_from(TenantMembership).where(TenantMembership.tenant_id == tenant_id)
        )
        if remaining == 0:
            tenant = db.get(Tenant, tenant_id)
            if tenant:
                db.delete(tenant)

    user = db.get(User, uid)
    if user:
        db.delete(user)
    db.commit()


@router.get("/me/tenant", response_model=TenantResponse)
def read_current_user_tenant(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TenantResponse:
    tenant = _get_user_tenant(db, current_user)
    if tenant is None:
        raise HTTPException(status_code=404, detail="No default tenant configured for this account.")
    return TenantResponse.model_validate(tenant)
