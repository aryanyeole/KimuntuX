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
    meta: dict | None
    timestamp: datetime


class CommunicationListResponse(BaseModel):
    data: list[CommunicationResponse]
    total: int
