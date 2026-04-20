from __future__ import annotations

import enum
from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import DateTime, Enum, Float, ForeignKey, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class CampaignStatus(str, enum.Enum):
    draft = "draft"
    active = "active"
    paused = "paused"
    completed = "completed"


class Campaign(Base):
    __tablename__ = "campaigns"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
    )
    tenant_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("tenants.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    platform: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[CampaignStatus] = mapped_column(
        Enum(CampaignStatus, name="campaignstatus"),
        nullable=False,
        default=CampaignStatus.draft,
    )
    objective: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Budget
    budget_daily: Mapped[float | None] = mapped_column(Float, nullable=True)
    budget_total: Mapped[float | None] = mapped_column(Float, nullable=True)
    currency: Mapped[str] = mapped_column(String(10), nullable=False, default="USD")

    # Linked offer (stored as strings; FK to Offer added later if needed)
    offer_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    offer_network: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # JSON blobs
    targeting: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # metrics keys: impressions, clicks, leads, conversions, spend, revenue,
    #               ctr, cpl, cpa, roas
    metrics: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    # Scheduling
    start_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    end_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
