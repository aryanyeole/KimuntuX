from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.offer import OfferStatus, TrendDirection


class OfferCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    niche: str = Field(min_length=1, max_length=100)
    network: str = Field(min_length=1, max_length=100)
    aov: float = Field(default=0.0, ge=0)
    gravity: float | None = None
    commission_rate: float = Field(default=0.0, ge=0, le=1)
    conversion_rate: float | None = None
    trend_direction: TrendDirection = TrendDirection.stable
    trend_value: float | None = None
    status: OfferStatus = OfferStatus.active
    external_url: str | None = None


class OfferResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    id: str
    name: str
    niche: str
    network: str
    aov: float
    gravity: float | None
    commission_rate: float
    conversion_rate: float | None
    trend_direction: str
    trend_value: float | None
    status: str
    external_url: str | None
    created_at: datetime


class OfferListResponse(BaseModel):
    data: list[OfferResponse]
    total: int
