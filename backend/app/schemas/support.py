from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class SupportInquiryCreate(BaseModel):
    from_name: str | None = Field(default=None, max_length=255)
    from_email: EmailStr
    subject: str = Field(default="Support request", max_length=500)
    message: str = Field(min_length=1)


class SupportInquiryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    to_address: str
    from_email: str
    from_name: str | None
    subject: str
    body: str | None
    created_at: datetime
