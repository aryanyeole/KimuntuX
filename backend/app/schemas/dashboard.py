from __future__ import annotations

from pydantic import BaseModel


class PipelineStageEntry(BaseModel):
    stage: str
    count: int
    total_value: float


class SourceBreakdownEntry(BaseModel):
    source: str
    count: int
    avg_score: float


class RecentLeadEntry(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: str
    company: str | None
    source: str
    stage: str
    classification: str
    ai_score: int
    created_at: str


class DashboardSummaryResponse(BaseModel):
    total_leads: int
    hot_leads: int
    warm_leads: int
    cold_leads: int
    total_revenue: float
    conversion_rate: float
    avg_ai_score: float
    pipeline_summary: list[PipelineStageEntry]
    source_breakdown: list[SourceBreakdownEntry]
    recent_leads: list[RecentLeadEntry]
