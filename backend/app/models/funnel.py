from __future__ import annotations

import enum
from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import DateTime, Enum, ForeignKey, Index, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class FunnelStatus(str, enum.Enum):
    draft = "draft"
    generating = "generating"
    ready = "ready"
    failed = "failed"


class Funnel(Base):
    __tablename__ = "funnels"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
    )
    tenant_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_by_user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[FunnelStatus] = mapped_column(
        Enum(FunnelStatus, name="funnelstatus"),
        nullable=False,
        default=FunnelStatus.draft,
        index=True,
    )
    wizard_input: Mapped[dict] = mapped_column(JSON, nullable=False)
    generated_html: Mapped[str | None] = mapped_column(Text, nullable=True)
    generation_metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    edit_history: Mapped[list] = mapped_column(JSON, nullable=False, default=list)

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

    __table_args__ = (
        Index("ix_funnels_tenant_id_created_at", "tenant_id", "created_at"),
    )
