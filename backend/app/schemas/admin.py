from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class AdminUserItem(BaseModel):
    id: str
    full_name: str
    email: EmailStr
    username: str
    password_note: str
    is_active: bool
    created_at: datetime


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
