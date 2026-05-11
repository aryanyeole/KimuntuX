from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Wizard input
# ---------------------------------------------------------------------------

class StrategyWizardInput(BaseModel):
    # Phase A — Business (required)
    business_type: str = Field(..., description="B2B, B2C, SaaS, Marketplace, or Other")
    industry: str = Field(..., description="e.g. Health & Wellness, SaaS, E-commerce")
    product_description: str = Field(..., min_length=10)

    # Phase A — optional
    pricing_model: str | None = Field(
        default=None,
        description="subscription, one-time, freemium, service, physical",
    )
    growth_stage: str | None = Field(
        default=None,
        description="idea, prelaunch, launched, scaling",
    )

    # Phase B — Market
    target_audience: dict[str, Any] | None = None
    pain_point: str | None = None
    competitors: list[str] | None = Field(default=None, max_length=3)
    geography: str | None = Field(default=None, description="local, national, global")
    languages: list[str] | None = None

    # Phase C — Resources
    monthly_budget: float | None = Field(default=None, ge=0)
    team_size: str | None = Field(
        default=None,
        description="1, 2-5, 6-20, 20+",
    )
    tried_channels: list[str] | None = None
    primary_goal: str | None = Field(
        default=None,
        description="leads, sales, brand_awareness, retention",
    )
    target_timeline: int | None = Field(
        default=None,
        description="30, 60, 90, or 180 days",
    )


# ---------------------------------------------------------------------------
# Responses
# ---------------------------------------------------------------------------

class StrategyResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    user_id: str
    status: str

    # Wizard inputs
    business_type: str
    industry: str
    product_description: str
    pricing_model: str | None
    growth_stage: str | None
    target_audience: dict[str, Any] | None
    pain_point: str | None
    competitors: list[str] | None
    geography: str | None
    languages: list[str] | None
    monthly_budget: float | None
    team_size: str | None
    tried_channels: list[str] | None
    primary_goal: str | None
    target_timeline: int | None

    # AI outputs
    strategy_output: dict[str, Any] | None
    strategy_score: int | None
    current_phase: str | None

    created_at: datetime
    updated_at: datetime


class StrategyListResponse(BaseModel):
    data: list[StrategyResponse]
    total: int