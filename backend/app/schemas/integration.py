from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.integration import IntegrationStatus, PlatformType


class IntegrationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    id: str
    tenant_id: str | None
    platform_name: str
    platform_type: str
    status: str
    config: dict
    connected_at: datetime | None
    last_sync_at: datetime | None
    created_at: datetime


class IntegrationListResponse(BaseModel):
    data: list[IntegrationResponse]


# ── SendGrid email-sender config ───────────────────────────────────────────────

class SendGridConnectRequest(BaseModel):
    sender_email: EmailStr
    sender_name: str


class SendGridStatusResponse(BaseModel):
    connected: bool
    sender_email: str | None = None
    sender_name: str | None = None
