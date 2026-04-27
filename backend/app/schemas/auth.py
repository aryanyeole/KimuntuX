from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

SignupPlan = Literal["starter", "growth", "scalex"]


class UserSignup(BaseModel):
    full_name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    phone: str = Field(min_length=5, max_length=64, description="Contact phone at signup")
    address: str = Field(min_length=5, max_length=512, description="Street / city / region at signup")
    signup_plan: SignupPlan = Field(description="Selected pricing tier (payment integration later)")


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class UserProfileUpdate(BaseModel):
    full_name: str | None = Field(None, min_length=1, max_length=255)
    phone: str | None = Field(None, max_length=64)
    address: str | None = Field(None, max_length=512)


class PasswordChangeRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=6, max_length=128)


class AccountDeleteRequest(BaseModel):
    password: str = Field(min_length=1, max_length=128)


class TenantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    slug: str
    plan: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    full_name: str
    email: EmailStr
    phone: str | None = None
    address: str | None = None
    signup_plan: str | None = None
    is_active: bool
    is_admin: bool
    default_tenant_id: str | None = None
    created_at: datetime

    @field_validator("is_active", "is_admin", mode="before")
    @classmethod
    def bool_none_to_false(cls, v: object) -> bool:
        return False if v is None else bool(v)

    @field_validator("full_name", mode="before")
    @classmethod
    def empty_name_to_unknown(cls, v: object) -> str:
        if v is None or (isinstance(v, str) and not v.strip()):
            return "User"
        return str(v)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    tenant: TenantResponse | None = None


class OAuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
