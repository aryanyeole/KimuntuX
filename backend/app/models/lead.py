from __future__ import annotations

import enum
from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Index, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class LeadSource(str, enum.Enum):
    facebook_ads = "facebook_ads"
    google_ads = "google_ads"
    tiktok_ads = "tiktok_ads"
    instagram = "instagram"
    landing_page = "landing_page"
    affiliate_link = "affiliate_link"
    website_widget = "website_widget"
    api = "api"


class LeadStage(str, enum.Enum):
    new = "new"
    contacted = "contacted"
    qualified = "qualified"
    proposal = "proposal"
    negotiation = "negotiation"
    won = "won"
    lost = "lost"


class LeadClassification(str, enum.Enum):
    hot = "hot"
    warm = "warm"
    cold = "cold"


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
    )
    tenant_id: Mapped[str | None] = mapped_column(String(36), nullable=True)

    # Contact info
    first_name: Mapped[str] = mapped_column(String(255), nullable=False)
    last_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    company: Mapped[str | None] = mapped_column(String(255), nullable=True)
    industry: Mapped[str | None] = mapped_column(String(255), nullable=True)
    job_title: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Acquisition
    source: Mapped[LeadSource] = mapped_column(
        Enum(LeadSource, name="leadsource"), nullable=False
    )
    source_detail: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Pipeline state
    stage: Mapped[LeadStage] = mapped_column(
        Enum(LeadStage, name="leadstage"),
        nullable=False,
        default=LeadStage.new,
    )
    classification: Mapped[LeadClassification] = mapped_column(
        Enum(LeadClassification, name="leadclassification"),
        nullable=False,
        default=LeadClassification.cold,
    )

    # AI scoring
    ai_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    predicted_value: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    ltv: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # Metadata
    tags: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    custom_fields: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    # Relationships (FKs stored as strings; Campaign FK added when Campaign model exists)
    assigned_to: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    campaign_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    affiliate_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

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
    last_contact_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    converted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationship back-ref to User (for assigned_to)
    assignee = relationship("User", foreign_keys=[assigned_to])

    __table_args__ = (
        Index("ix_leads_stage", "stage"),
        Index("ix_leads_source", "source"),
        Index("ix_leads_classification", "classification"),
        Index("ix_leads_tenant_id", "tenant_id"),
    )
