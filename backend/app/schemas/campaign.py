from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


# Shared literals used across campaign request/response contracts.
CampaignStatus = Literal[
    "draft",
    "generating",
    "compliance_check",
    "ready",
    "testing",
    "optimizing",
    "scaling",
    "paused",
    "archived",
]
PieceStatus = Literal["draft", "scheduled", "posted"]
ContentPieceType = Literal["ad_copy", "social_post", "email", "video_script", "seo_meta"]
ContentPlatform = Literal["facebook", "instagram", "google", "tiktok", "linkedin", "twitter", "email"]
ComplianceStatus = Literal["approved", "requires_rewrite", "blocked"]
PerformanceStatus = Literal["untested", "testing", "winning", "paused", "scaling"]
CommissionModel = Literal["percentage", "fixed"]
PrimaryGoal = Literal["clicks", "conversions", "impressions"]
RecurrenceType = Literal["once", "weekly", "biweekly", "monthly"]


class Commission(BaseModel):
    model: CommissionModel
    value: float = Field(gt=0)
    currency: str = Field(min_length=3, max_length=3)
    payout_frequency: str | None = Field(default=None, max_length=50)

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        return value.upper()


class AffiliateProduct(BaseModel):
    product_id: str = Field(min_length=1, max_length=100)
    vendor: str = Field(min_length=1, max_length=255)
    offer_name: str = Field(min_length=1, max_length=255)
    hoplink: str = Field(min_length=1, max_length=2048)
    commission: Commission
    niche: str | None = Field(default=None, max_length=100)
    source_network: str | None = Field(default=None, max_length=100)


class AudienceDemographics(BaseModel):
    age_range: str | None = Field(default=None, max_length=50)
    gender_focus: str | None = Field(default=None, max_length=50)
    income_band: str | None = Field(default=None, max_length=50)
    interests: list[str] = Field(default_factory=list)


class AudienceRegion(BaseModel):
    countries: list[str] = Field(default_factory=list)
    languages: list[str] = Field(default_factory=list)
    timezone: str | None = Field(default=None, max_length=100)


class Audience(BaseModel):
    personas: list[str] = Field(default_factory=list)
    demographics: AudienceDemographics | None = None
    region: AudienceRegion | None = None


class TrackingLink(BaseModel):
    platform: str = Field(min_length=1, max_length=100)
    content_piece_id: str | None = Field(default=None, max_length=36)
    final_url: str = Field(min_length=1, max_length=2048)
    subid_map: dict[str, str] = Field(default_factory=dict)
    utm: dict[str, str] = Field(default_factory=dict)


class Tracking(BaseModel):
    base_hoplink: str = Field(min_length=1, max_length=2048)
    tracking_template: str | None = Field(default=None, max_length=2048)
    tracking_links: list[TrackingLink] = Field(default_factory=list)
    attribution_model: str | None = Field(default=None, max_length=100)


class CampaignWindow(BaseModel):
    start_at: datetime | None = None
    end_at: datetime | None = None
    cadence_default: RecurrenceType = "once"


class Scheduling(BaseModel):
    timezone: str = Field(min_length=1, max_length=100)
    campaign_window: CampaignWindow = Field(default_factory=CampaignWindow)


class MetricsBudget(BaseModel):
    amount: float | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, min_length=3, max_length=3)
    cap_type: str | None = Field(default=None, max_length=50)

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value.upper()


class MetricsIntent(BaseModel):
    primary_goal: PrimaryGoal
    budget: MetricsBudget | None = None
    target_clicks: int | None = Field(default=None, ge=0)
    target_ctr: float | None = Field(default=None, ge=0)
    target_conversions: int | None = Field(default=None, ge=0)
    target_cvr: float | None = Field(default=None, ge=0)
    target_roas: float | None = Field(default=None, ge=0)


class MetricsActuals(BaseModel):
    impressions: int = Field(default=0, ge=0)
    clicks: int = Field(default=0, ge=0)
    conversions: int = Field(default=0, ge=0)
    revenue: float = Field(default=0, ge=0)
    spend: float = Field(default=0, ge=0)
    ctr: float | None = Field(default=None, ge=0)
    cvr: float | None = Field(default=None, ge=0)
    roas: float | None = Field(default=None, ge=0)
    last_synced_at: datetime | None = None


class Metrics(BaseModel):
    intent: MetricsIntent
    actuals: MetricsActuals = Field(default_factory=MetricsActuals)


class CampaignBudget(BaseModel):
    daily_limit: float | None = Field(default=None, ge=0)
    total_limit: float | None = Field(default=None, ge=0)
    per_variant_limit: float = Field(default=10, ge=0)
    spent_to_date: float = Field(default=0, ge=0)
    currency: str = Field(default="USD", min_length=3, max_length=3)

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        return value.upper()


class GenerationConfig(BaseModel):
    topic: str | None = Field(default=None, max_length=255)
    keywords: list[str] = Field(default_factory=list)
    tone: str | None = Field(default=None, max_length=100)
    language: str = Field(default="en", min_length=2, max_length=20)
    num_variants: int = Field(default=15, ge=1)
    gemini_model: str | None = Field(default=None, max_length=100)


class ContentCopy(BaseModel):
    hook: list | str | None = None
    headline: list | str | None = None
    body: list | str | None = None
    caption: list | str | None = None
    subject_line: list | str | None = None
    script: list | str | None = None


class ContentMedia(BaseModel):
    image_prompt: list | str | None = None
    image_url: str | None = None
    video_prompt: list | str | None = None
    thumbnail_prompt: list | str | None = None


class ContentCompliance(BaseModel):
    disclosures: list[str] = Field(default_factory=list)
    restricted_terms: list[str] = Field(default_factory=list)


class ContentSchedule(BaseModel):
    publish_at: datetime | None = None
    timezone: str | None = Field(default=None, max_length=100)
    recurrence: RecurrenceType | None = None
    end_at: datetime | None = None


class PublishResult(BaseModel):
    external_post_id: str | None = Field(default=None, max_length=255)
    posted_at: datetime | None = None
    error_message: str | None = None


class ContentPiecePerformance(BaseModel):
    ctr: float | None = Field(default=None, ge=0)
    cpc: float | None = Field(default=None, ge=0)
    cpa: float | None = Field(default=None, ge=0)
    roas: float | None = Field(default=None, ge=0)
    impressions: int = Field(default=0, ge=0)
    status: PerformanceStatus = "untested"


class ContentPiece(BaseModel):
    piece_id: str = Field(min_length=1, max_length=36)
    platform: str = Field(min_length=1)
    format: str = Field(min_length=1)
    status: str = "draft"
    sequence_index: int = Field(default=0, ge=0)
    objective: str | None = None
    cta_text: list | str | None = None
    cta_link: str | None = None
    hashtags: list | None = None
    copy: ContentCopy | None = None
    media: ContentMedia | None = None
    compliance: dict[str, list[str]] | None = None
    compliance_score: float | None = Field(default=None, ge=0, le=10)
    compliance_status: str | None = None
    schedule: dict[str, str | None] | None = None
    publish_result: dict[str, str | None] | None = None

# Core campaign payload shared by create and response models.
class CampaignBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    status: CampaignStatus = "draft"
    theme_color: str | None = Field(default=None, max_length=20)
    platforms: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    version: int = Field(default=1, ge=1)
    previous_version_id: str | None = Field(default=None, max_length=36)

    affiliate_product: AffiliateProduct
    audience: Audience | None = None
    tracking: Tracking
    scheduling: Scheduling
    metrics: Metrics | None = None
    content_pieces: list[ContentPiece] = Field(default_factory=list)
    budget: CampaignBudget = Field(default_factory=CampaignBudget)
    generation_config: GenerationConfig = Field(default_factory=GenerationConfig)

    notes: str | None = None
    archive_reason: str | None = Field(default=None, max_length=255)
    deleted_at: datetime | None = None

    @field_validator("platforms")
    @classmethod
    def validate_platforms(cls, value: list[str]) -> list[str]:
        cleaned = [platform.strip() for platform in value if isinstance(platform, str) and platform.strip()]
        if len(cleaned) != len(value):
            raise ValueError("Platforms must be non-empty strings")
        return cleaned

# Create payload currently mirrors CampaignBase.
class CampaignCreate(CampaignBase):
    pass


# Partial-update payload for campaign edits and scheduling changes.
class CampaignUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    status: CampaignStatus | None = None
    is_used: bool | None = None
    theme_color: str | None = Field(default=None, max_length=20)
    platforms: list[str] | None = None
    tags: list[str] | None = None
    version: int | None = Field(default=None, ge=1)
    previous_version_id: str | None = Field(default=None, max_length=36)

    affiliate_product: AffiliateProduct | None = None
    audience: Audience | None = None
    tracking: Tracking | None = None
    scheduling: Scheduling | None = None
    metrics: Metrics | None = None
    content_pieces: list[ContentPiece] | None = None
    budget: CampaignBudget | None = None
    generation_config: GenerationConfig | None = None

    notes: str | None = None
    archive_reason: str | None = Field(default=None, max_length=255)
    deleted_at: datetime | None = None

    @field_validator("platforms")
    @classmethod
    def validate_platforms(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return value
        cleaned = [platform.strip() for platform in value if isinstance(platform, str) and platform.strip()]
        if len(cleaned) != len(value):
            raise ValueError("Platforms must be non-empty strings")
        return cleaned


# Request body accepted by POST /campaigns/generate.
class CampaignGenerateRequest(BaseModel):
    prompt: str = Field(min_length=1)
    platforms: list[str]
    affiliate_product: dict
    audience: dict | None = None
    num_variants: int = Field(default=3, ge=1)
    language: str = Field(default="en", min_length=2, max_length=20)
    mock_mode: bool | None = None

    @field_validator("platforms")
    @classmethod
    def validate_platforms(cls, value: list[str]) -> list[str]:
        cleaned = [platform.strip() for platform in value if isinstance(platform, str) and platform.strip()]
        if not cleaned:
            raise ValueError("At least one platform is required")
        if len(cleaned) != len(value):
            raise ValueError("Platforms must be non-empty strings")
        return cleaned


# Response model with immutable identity and timestamps.
class CampaignResponse(CampaignBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime


class CampaignUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    status: CampaignStatus | None = None
    is_used: bool | None = None
    theme_color: str | None = Field(default=None, max_length=20)
    platforms: list[str] | None = None
    tags: list[str] | None = None
    version: int | None = Field(default=None, ge=1)
    previous_version_id: str | None = Field(default=None, max_length=36)

    affiliate_product: AffiliateProduct | None = None
    audience: Audience | None = None
    tracking: Tracking | None = None
    scheduling: Scheduling | None = None
    metrics: Metrics | None = None
    content_pieces: list[ContentPiece] | None = None
    budget: CampaignBudget | None = None
    generation_config: GenerationConfig | None = None

    notes: str | None = None
    archive_reason: str | None = Field(default=None, max_length=255)
    deleted_at: datetime | None = None

    @field_validator("platforms")
    @classmethod
    def validate_platforms(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return value
        cleaned = [platform.strip() for platform in value if isinstance(platform, str) and platform.strip()]
        if len(cleaned) != len(value):
            raise ValueError("Platforms must be non-empty strings")
        return cleaned


class CampaignResponse(CampaignBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    is_used: bool = False


# Paginated campaigns list envelope for CRM list endpoints.
class CampaignListResponse(BaseModel):
    items: list[CampaignResponse]
    total: int
    page: int = 1
    per_page: int = 20
    pages: int
