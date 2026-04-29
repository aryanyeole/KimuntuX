from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict

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
