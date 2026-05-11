from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.communication import CommunicationChannel, CommunicationDirection


class CommunicationCreate(BaseModel):
    lead_id: str
    channel: CommunicationChannel
    direction: CommunicationDirection
    subject: str | None = None
    body: str = Field(min_length=1)
    meta: dict | None = None


class SendEmailRequest(BaseModel):
    subject: str = Field(min_length=1, max_length=512)
    body: str = Field(min_length=1)


class CommunicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    id: str
    lead_id: str
    channel: str
    direction: str
    subject: str | None
    body: str
    preview: str | None
    read: bool
    status: str | None = None
    from_email: str | None = None
    to_email: str | None = None
    provider_message_id: str | None = None
    meta: dict | None
    timestamp: datetime


class CommunicationListResponse(BaseModel):
    data: list[CommunicationResponse]
    total: int
