from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.campaign import CampaignStatus


class CampaignCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    platform: str = Field(min_length=1, max_length=100)
    status: CampaignStatus = CampaignStatus.draft
    objective: str | None = None
    budget_daily: float | None = None
    budget_total: float | None = None
    currency: str = "USD"
    offer_name: str | None = None
    offer_network: str | None = None
    targeting: dict | None = None
    metrics: dict = {}
    start_date: datetime | None = None
    end_date: datetime | None = None


class CampaignUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    platform: str | None = Field(default=None, min_length=1, max_length=100)
    status: CampaignStatus | None = None
    objective: str | None = None
    budget_daily: float | None = None
    budget_total: float | None = None
    currency: str | None = None
    offer_name: str | None = None
    offer_network: str | None = None
    targeting: dict | None = None
    metrics: dict | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None


class CampaignResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    id: str
    name: str
    platform: str
    status: str
    objective: str | None
    budget_daily: float | None
    budget_total: float | None
    currency: str
    offer_name: str | None
    offer_network: str | None
    targeting: dict | None
    metrics: dict
    start_date: datetime | None
    end_date: datetime | None
    created_at: datetime
    updated_at: datetime


class CampaignListResponse(BaseModel):
    data: list[CampaignResponse]
    total: int
    page: int
    limit: int
    total_pages: int
