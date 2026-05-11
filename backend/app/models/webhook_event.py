from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import (
    Boolean, DateTime, ForeignKey, Index, JSON, String, Text, UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class WebhookEvent(Base):
    __tablename__ = "webhook_events"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
    )

    # "sendgrid" for now; extensible for future providers
    provider: Mapped[str] = mapped_column(String(50), nullable=False, index=True)

    # "delivered", "open", "click", "bounce", "inbound_parse", etc.
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)

    # sg_event_id from SendGrid; null for inbound parse events (no sg_event_id)
    provider_event_id: Mapped[str | None] = mapped_column(
        String(255), nullable=True, index=True
    )

    tenant_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("tenants.id", ondelete="SET NULL"),
        nullable=True,
    )
    lead_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("leads.id", ondelete="SET NULL"),
        nullable=True,
    )
    communication_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("communications.id", ondelete="SET NULL"),
        nullable=True,
    )

    payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    signature_valid: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    processed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)

    received_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (
        # Deduplicate by (provider, provider_event_id).
        # NULLs are treated as distinct in both SQLite and Postgres UNIQUE constraints,
        # so inbound rows (null provider_event_id) never collide here.
        # Inbound dedup is handled in the service layer via Message-ID header instead.
        UniqueConstraint("provider", "provider_event_id", name="uq_webhook_event_provider_event_id"),
        Index("ix_webhook_events_communication_id", "communication_id"),
    )
