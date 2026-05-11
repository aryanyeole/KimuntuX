from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base

import enum


# Campaign lifecycle states used by both generation and CRM workflows.
class CampaignStatus(str, enum.Enum):
    draft = "draft"
    generating = "generating"
    compliance_check = "compliance_check"
    ready = "ready"
    testing = "testing"
    optimizing = "optimizing"
    scaling = "scaling"
    paused = "paused"
    archived = "archived"

# DB-level default budget payload for newly created campaigns.
def _default_budget() -> dict:
    return {
        "daily_limit": None,
        "total_limit": None,
        "per_variant_limit": 10,
        "spent_to_date": 0,
        "currency": "USD",
    }

# DB-level default AI generation settings for newly created campaigns.
def _default_generation_config() -> dict:
    return {
        "topic": None,
        "keywords": [],
        "tone": None,
        "language": "en",
        "num_variants": 15,
        "gemini_model": None,
    }

# Canonical campaign storage model for generated and scheduled campaigns.
class Campaign(Base):
    __tablename__ = "campaigns"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    tenant_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("tenants.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[CampaignStatus] = mapped_column(String(32), default=CampaignStatus.draft, nullable=False)
    theme_color: Mapped[str | None] = mapped_column(String(20), nullable=True)
    platforms: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    previous_version_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    is_used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    affiliate_product: Mapped[dict] = mapped_column(JSON, nullable=False)
    audience: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    tracking: Mapped[dict] = mapped_column(JSON, nullable=False)
    scheduling: Mapped[dict] = mapped_column(JSON, nullable=False)
    metrics: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    content_pieces: Mapped[list[dict]] = mapped_column(JSON, default=list, nullable=False)
    budget: Mapped[dict] = mapped_column(JSON, default=_default_budget, nullable=False)
    generation_config: Mapped[dict] = mapped_column(JSON, default=_default_generation_config, nullable=False)

    tags: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    archive_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
