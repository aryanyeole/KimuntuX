from __future__ import annotations

import enum
from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class TrendDirection(str, enum.Enum):
    up = "up"
    down = "down"
    stable = "stable"


class OfferStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"


# Offer source taxonomy (soft enum — validated in service layer, not DB):
#   "seed"                  — original seeded mock data
#   "clickbank_marketplace" — platform credentials, visible to ALL tenants
#   "clickbank_account"     — tenant credentials, visible only to that tenant
#   "manual"                — future user-created offers
OFFER_SOURCE_SEED = "seed"
OFFER_SOURCE_CB_MARKETPLACE = "clickbank_marketplace"
OFFER_SOURCE_CB_ACCOUNT = "clickbank_account"
OFFER_SOURCE_MANUAL = "manual"


class Offer(Base):
    __tablename__ = "offers"

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

    # Source taxonomy — determines visibility and sync behavior
    source: Mapped[str] = mapped_column(String(50), nullable=False, default=OFFER_SOURCE_SEED)

    # External identifier (e.g. ClickBank vendor site nickname).
    # Combined with tenant_id + source forms the upsert key.
    external_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    niche: Mapped[str] = mapped_column(String(100), nullable=False)
    network: Mapped[str] = mapped_column(String(100), nullable=False)

    # Financials
    aov: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    gravity: Mapped[float | None] = mapped_column(Float, nullable=True)
    commission_rate: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    conversion_rate: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Trend
    trend_direction: Mapped[TrendDirection] = mapped_column(
        Enum(TrendDirection, name="trenddirection"),
        nullable=False,
        default=TrendDirection.stable,
    )
    trend_value: Mapped[float | None] = mapped_column(Float, nullable=True)

    status: Mapped[OfferStatus] = mapped_column(
        Enum(OfferStatus, name="offerstatus"),
        nullable=False,
        default=OfferStatus.active,
    )
    external_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)

    last_synced_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (
        Index("ix_offers_niche", "niche"),
        Index("ix_offers_network", "network"),
        Index("ix_offers_status", "status"),
        Index("ix_offers_source", "source"),
        Index("ix_offers_external_id", "external_id"),
    )
