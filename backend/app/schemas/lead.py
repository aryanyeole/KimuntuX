from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.activity import ActivityType
from app.models.lead import LeadClassification, LeadSource, LeadStage


# ---------------------------------------------------------------------------
# Lead schemas
# ---------------------------------------------------------------------------

class LeadCreate(BaseModel):
    first_name: str = Field(min_length=1, max_length=255)
    last_name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    phone: str | None = None
    company: str | None = None
    industry: str | None = None
    job_title: str | None = None
    source: LeadSource
    source_detail: str | None = None
    stage: LeadStage = LeadStage.new
    classification: LeadClassification = LeadClassification.cold
    ai_score: int = Field(default=0, ge=0, le=100)
    predicted_value: float = 0.0
    ltv: float = 0.0
    tags: list[str] = []
    notes: str | None = None
    custom_fields: dict = {}
    assigned_to: str | None = None
    campaign_id: str | None = None
    affiliate_id: str | None = None


class LeadUpdate(BaseModel):
    """All fields optional — only provided fields are applied."""
    first_name: str | None = Field(default=None, min_length=1, max_length=255)
    last_name: str | None = Field(default=None, min_length=1, max_length=255)
    email: EmailStr | None = None
    phone: str | None = None
    company: str | None = None
    industry: str | None = None
    job_title: str | None = None
    source: LeadSource | None = None
    source_detail: str | None = None
    stage: LeadStage | None = None
    classification: LeadClassification | None = None
    ai_score: int | None = Field(default=None, ge=0, le=100)
    predicted_value: float | None = None
    ltv: float | None = None
    tags: list[str] | None = None
    notes: str | None = None
    custom_fields: dict | None = None
    assigned_to: str | None = None
    campaign_id: str | None = None
    affiliate_id: str | None = None
    last_contact_at: datetime | None = None
    converted_at: datetime | None = None


class LeadStageUpdate(BaseModel):
    stage: LeadStage


class LeadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    id: str
    tenant_id: str | None
    first_name: str
    last_name: str
    email: str
    phone: str | None
    company: str | None
    industry: str | None
    job_title: str | None
    source: str
    source_detail: str | None
    stage: str
    classification: str
    ai_score: int
    predicted_value: float
    ltv: float
    tags: list
    notes: str | None
    custom_fields: dict
    assigned_to: str | None
    campaign_id: str | None
    affiliate_id: str | None
    created_at: datetime
    updated_at: datetime
    last_contact_at: datetime | None
    converted_at: datetime | None


class LeadListResponse(BaseModel):
    data: list[LeadResponse]
    total: int
    page: int
    limit: int
    total_pages: int


# ---------------------------------------------------------------------------
# Activity schemas
# ---------------------------------------------------------------------------

class ActivityCreate(BaseModel):
    activity_type: ActivityType
    description: str = Field(min_length=1, max_length=1024)
    meta: dict | None = None
    channel: str | None = None


class ActivityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    id: str
    lead_id: str
    # ORM attr is "activity_type"; Pydantic reads it by that name directly
    activity_type: str
    description: str
    meta: dict | None
    channel: str | None
    performed_by: str | None
    timestamp: datetime


# ---------------------------------------------------------------------------
# AI schemas
# ---------------------------------------------------------------------------

class AiScoreResponse(BaseModel):
    lead_id: str
    ai_score: int
    classification: str
    message: str
    # Gemini-enhanced fields (None when rule-based fallback is used)
    conversion_probability: float | None = None
    recommended_action: str | None = None
    reasoning: str | None = None


class AiOutreachRequest(BaseModel):
    tone: str = Field(default="professional", pattern="^(professional|friendly|urgent)$")
    channel: str = Field(default="email")


class AiOutreachResponse(BaseModel):
    lead_id: str
    subject: str
    body: str
    tone: str
    # Gemini-enhanced fields (None when template fallback is used)
    estimated_open_rate: float | None = None
    estimated_reply_rate: float | None = None
