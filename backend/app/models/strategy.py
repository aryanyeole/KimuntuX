from __future__ import annotations

import enum
from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class StrategyStatus(str, enum.Enum):
    draft = "draft"
    generating = "generating"
    active = "active"
    archived = "archived"


class Strategy(Base):
    __tablename__ = "strategies"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status: Mapped[StrategyStatus] = mapped_column(
        Enum(StrategyStatus, name="strategystatus"),
        nullable=False,
        default=StrategyStatus.draft,
    )

    # ── Phase A: Business ────────────────────────────────────────────────────
    business_type: Mapped[str] = mapped_column(String(50), nullable=False)
    industry: Mapped[str] = mapped_column(String(100), nullable=False)
    product_description: Mapped[str] = mapped_column(Text, nullable=False)
    pricing_model: Mapped[str | None] = mapped_column(String(50), nullable=True)
    growth_stage: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # ── Phase B: Market ───────────────────────────────────────────────────────
    target_audience: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    pain_point: Mapped[str | None] = mapped_column(Text, nullable=True)
    competitors: Mapped[list | None] = mapped_column(JSON, nullable=True)
    geography: Mapped[str | None] = mapped_column(String(50), nullable=True)
    languages: Mapped[list | None] = mapped_column(JSON, nullable=True)

    # ── Phase C: Resources ───────────────────────────────────────────────────
    monthly_budget: Mapped[float | None] = mapped_column(Float, nullable=True)
    team_size: Mapped[str | None] = mapped_column(String(20), nullable=True)
    tried_channels: Mapped[list | None] = mapped_column(JSON, nullable=True)
    primary_goal: Mapped[str | None] = mapped_column(String(50), nullable=True)
    target_timeline: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # ── AI Outputs ────────────────────────────────────────────────────────────
    strategy_output: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    strategy_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    current_phase: Mapped[str | None] = mapped_column(String(50), nullable=True)

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