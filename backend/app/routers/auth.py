from __future__ import annotations

import re

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token, get_current_user, hash_password, verify_password
from app.models.tenant import Tenant, TenantPlan
from app.models.tenant_membership import MemberRole, TenantMembership
from app.models.user import User
from app.schemas.auth import OAuthTokenResponse, TenantResponse, TokenResponse, UserLogin, UserResponse, UserSignup


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

    # Create user first so we have an ID
    user = User(
        full_name=payload.full_name.strip(),
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.flush()

    # Create default tenant for the new user
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

    # Link user to tenant as owner
    membership = TenantMembership(
        tenant_id=tenant.id,
        user_id=user.id,
        role=MemberRole.owner,
    )
    db.add(membership)

    # Set user's default tenant
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


@router.post("/token", response_model=OAuthTokenResponse)
def issue_oauth_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> OAuthTokenResponse:
    user = authenticate_user(form_data.username, form_data.password, db)
    token = create_access_token(user.id)
    return OAuthTokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse.model_validate(current_user)


@router.get("/me/tenant", response_model=TenantResponse)
def read_current_user_tenant(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TenantResponse:
    tenant = _get_user_tenant(db, current_user)
    if tenant is None:
        raise HTTPException(status_code=404, detail="No default tenant configured for this account.")
    return TenantResponse.model_validate(tenant)
