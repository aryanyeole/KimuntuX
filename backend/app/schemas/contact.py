from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ContactSubmissionCreate(BaseModel):
    full_name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    company: str | None = Field(default=None, max_length=255)
    country: str | None = Field(default=None, max_length=100)
    company_size: str | None = Field(default=None, max_length=50)
    primary_interest: str | None = Field(default=None, max_length=100)
    message: str | None = None
    consent: bool = False
    source: str = "homepage"


class ContactSubmissionResponse(BaseModel):
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
