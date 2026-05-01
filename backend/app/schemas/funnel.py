from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.models.funnel import FunnelStatus


class WizardInput(BaseModel):
    # Step 1 — Brand Basics
    company_name: str
    tagline: str | None = None
    brand_voice: Literal["professional", "casual", "luxury", "playful", "friendly"] = "professional"
    logo_url: str | None = None  # placeholder; not used in V1 (Phase 5 + S3)

    # Step 2 — Business Overview
    short_description: str
    about_us: str | None = None
    industry: str
    key_services: list[str] = Field(min_length=1, max_length=10)

    # Step 3 — Hero CTA
    hero_headline: str
    hero_subheadline: str | None = None
    primary_cta_text: str
    main_goal: Literal["consult", "buy", "signup", "contact", "learn_more"] = "signup"

    # Step 4 — Sections Layout
    include_features: bool = True
    include_services: bool = True
    include_about: bool = True
    include_testimonials: bool = False
    include_pricing: bool = False
    include_faq: bool = False
    include_contact: bool = True
    layout_style: Literal["minimal", "modern", "bold", "playful"] = "modern"

    # Step 5 — Contact & Social
    contact_email: str | None = Field(
        default=None,
        max_length=200,
        pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$",
        description=(
            "Public-facing contact email displayed on the funnel page as a "
            "mailto link. Validated permissively — any string with the "
            "shape local@domain.tld is accepted, including RFC-reserved "
            "test domains (.test, .example, .invalid). KimuX never sends "
            "mail to this address; deliverability is the funnel visitor's "
            "concern, not ours."
        ),
    )
    contact_phone: str | None = None
    contact_location: str | None = None
    instagram_url: str | None = None
    linkedin_url: str | None = None
    twitter_url: str | None = None
    facebook_url: str | None = None

    # Step 6 — Visual Style
    color_theme: str = "auto"
    font_style: str = "auto"


class FunnelCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    wizard_input: WizardInput


class FunnelUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)


class FunnelResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    id: str
    tenant_id: str
    created_by_user_id: str
    title: str
    status: str
    wizard_input: dict
    generated_html: str | None
    generation_metadata: dict | None
    error_message: str | None
    edit_history: list
    created_at: datetime
    updated_at: datetime


class FunnelListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    id: str
    title: str
    status: str
    error_message: str | None
    created_at: datetime
    updated_at: datetime


class FunnelListResponse(BaseModel):
    items: list[FunnelListItem]
    total: int
