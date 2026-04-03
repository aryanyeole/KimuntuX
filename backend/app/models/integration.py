from __future__ import annotations

import enum
from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import DateTime, Enum, Index, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class PlatformType(str, enum.Enum):
    ad_platform = "ad_platform"
    affiliate_network = "affiliate_network"
    payment_gateway = "payment_gateway"
    tool = "tool"


class IntegrationStatus(str, enum.Enum):
    connected = "connected"
    pending = "pending"
    disconnected = "disconnected"


class Integration(Base):
    __tablename__ = "integrations"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
    )
    tenant_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    platform_name: Mapped[str] = mapped_column(String(100), nullable=False)
    platform_type: Mapped[PlatformType] = mapped_column(
        Enum(PlatformType, name="platformtype"),
        nullable=False,
    )
    status: Mapped[IntegrationStatus] = mapped_column(
        Enum(IntegrationStatus, name="integrationstatus"),
        nullable=False,
        default=IntegrationStatus.disconnected,
    )
    # Stores non-sensitive config (never API secrets)
    config: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    connected_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_sync_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (
        Index("ix_integrations_tenant_id", "tenant_id"),
        Index("ix_integrations_platform_name", "platform_name"),
    )
