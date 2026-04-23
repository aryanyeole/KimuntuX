from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class AdminUserItem(BaseModel):
    id: str
    full_name: str
    email: EmailStr
    username: str
    password_note: str
    phone: str | None = None
    address: str | None = None
    signup_plan: str | None = None
    is_active: bool
    is_admin: bool
    created_at: datetime


class AdminUserRoleUpdate(BaseModel):
    is_admin: bool = Field(description="Grant or revoke administrator access")


class AdminContactItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    full_name: str
    email: EmailStr
    company: str | None
    country: str | None
    company_size: str | None
    primary_interest: str | None
    message: str | None
    consent: bool
    source: str
    created_at: datetime


class AdminSupportMessageItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    to_address: str
    from_email: str
    from_name: str | None
    subject: str
    body: str | None
    created_at: datetime
