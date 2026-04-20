from __future__ import annotations

import enum
from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import DateTime, Enum, ForeignKey, Index, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class ActivityType(str, enum.Enum):
    email_sent = "email_sent"
    email_opened = "email_opened"
    email_clicked = "email_clicked"
    call = "call"
    meeting = "meeting"
    form_submit = "form_submit"
    page_visit = "page_visit"
    ad_click = "ad_click"
    chatbot = "chatbot"
    note_added = "note_added"
    stage_changed = "stage_changed"
    score_updated = "score_updated"


class Activity(Base):
    __tablename__ = "activities"

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
    lead_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("leads.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # "type" conflicts with SQLAlchemy's polymorphic discriminator convention,
    # so we use "activity_type" in Python and map it to the "type" column.
    activity_type: Mapped[ActivityType] = mapped_column(
        "type",
        Enum(ActivityType, name="activitytype"),
        nullable=False,
    )
    description: Mapped[str] = mapped_column(String(1024), nullable=False)
    # "metadata" is reserved by DeclarativeBase; map Python attr "meta" → DB col "metadata"
    meta: Mapped[dict | None] = mapped_column("metadata", JSON, nullable=True)
    channel: Mapped[str | None] = mapped_column(String(100), nullable=True)
    performed_by: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    lead = relationship("Lead", back_populates="activities")
    performer = relationship("User", foreign_keys=[performed_by])

    __table_args__ = (
        Index("ix_activities_lead_id_timestamp", "lead_id", "timestamp"),
    )
