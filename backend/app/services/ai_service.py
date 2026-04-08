from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.activity import Activity
from app.models.lead import Lead, LeadClassification, LeadSource, LeadStage
from app.schemas.lead import AiOutreachRequest, AiOutreachResponse, AiScoreResponse


# ---------------------------------------------------------------------------
# Scoring weights (rule-based; swap for LLM enrichment in Phase 4)
# ---------------------------------------------------------------------------

_SOURCE_WEIGHT: dict[str, int] = {
    LeadSource.landing_page.value: 15,
    LeadSource.affiliate_link.value: 12,
    LeadSource.facebook_ads.value: 10,
    LeadSource.google_ads.value: 10,
    LeadSource.instagram.value: 8,
    LeadSource.tiktok_ads.value: 8,
    LeadSource.website_widget.value: 6,
    LeadSource.api.value: 5,
}

_STAGE_WEIGHT: dict[str, int] = {
    LeadStage.new.value: 0,
    LeadStage.contacted.value: 5,
    LeadStage.qualified.value: 15,
    LeadStage.proposal.value: 20,
    LeadStage.negotiation.value: 25,
    LeadStage.won.value: 30,
    LeadStage.lost.value: -30,
}


def _recency_score(last_contact: datetime | None) -> int:
    if last_contact is None:
        return -5
    now = datetime.now(timezone.utc)
    if last_contact.tzinfo is None:
        last_contact = last_contact.replace(tzinfo=timezone.utc)
    days = (now - last_contact).days
    if days <= 3:
        return 15
    if days <= 7:
        return 10
    if days <= 30:
        return 5
    return -5


def _activity_score(count: int) -> int:
    if count == 0:
        return 0
    if count <= 3:
        return 5
    if count <= 10:
        return 15
    return 20


def _classify(score: int) -> LeadClassification:
    if score >= 70:
        return LeadClassification.hot
    if score >= 40:
        return LeadClassification.warm
    return LeadClassification.cold


# ---------------------------------------------------------------------------
# Score lead
# ---------------------------------------------------------------------------

def score_lead(db: Session, lead_id: str) -> AiScoreResponse:
    lead = db.scalar(select(Lead).where(Lead.id == lead_id))
    if lead is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")

    activity_count = db.scalar(
        select(func.count(Activity.id)).where(Activity.lead_id == lead_id)
    ) or 0

    source_val = lead.source.value if hasattr(lead.source, "value") else str(lead.source)
    stage_val = lead.stage.value if hasattr(lead.stage, "value") else str(lead.stage)

    raw = (
        _SOURCE_WEIGHT.get(source_val, 5)
        + _STAGE_WEIGHT.get(stage_val, 0)
        + _recency_score(lead.last_contact_at)
        + _activity_score(activity_count)
    )
    score = max(0, min(100, raw))
    classification = _classify(score)

    lead.ai_score = score
    lead.classification = classification
    db.commit()

    return AiScoreResponse(
        lead_id=lead_id,
        ai_score=score,
        classification=classification.value,
        message=f"Lead scored {score}/100 and classified as {classification.value}.",
    )


# ---------------------------------------------------------------------------
# Outreach generation (template-based; swap body for LLM call in Phase 4)
# ---------------------------------------------------------------------------

# Keys: (classification, tone) -> (subject_template, body_template)
# {first_name} and {company} are interpolated at call time.
_TEMPLATES: dict[tuple[str, str], tuple[str, str]] = {
    ("hot", "professional"): (
        "Exclusive opportunity tailored for {company}",
        "Hi {first_name},\n\n"
        "Based on your profile and recent engagement, I wanted to reach out personally. "
        "We have a solution that aligns precisely with what {company} is working toward.\n\n"
        "I would love to schedule a 20-minute call this week to walk you through it. "
        "Would Thursday or Friday work for you?\n\n"
        "Best regards,\nThe KimuX Team",
    ),
    ("hot", "friendly"): (
        "Hey {first_name} — let us make something happen!",
        "Hi {first_name}!\n\n"
        "You have been on our radar and honestly, we think you are a great fit. "
        "We have something exciting in the works that we think {company} would love.\n\n"
        "Would you be up for a quick chat? No pressure — just want to share what we have been building.\n\n"
        "Cheers,\nThe KimuX Team",
    ),
    ("hot", "urgent"): (
        "Last chance — offer closing soon for {company}",
        "Hi {first_name},\n\n"
        "I will keep this brief: we have a limited-time offer closing at the end of this week. "
        "Given your interest level, I did not want you to miss it.\n\n"
        "Reply to this email or book a slot directly — I will make sure you get priority access.\n\n"
        "Talk soon,\nThe KimuX Team",
    ),
    ("warm", "professional"): (
        "Following up — next steps for {company}",
        "Hi {first_name},\n\n"
        "I wanted to follow up on our previous interaction and see if you had any questions "
        "or if there is anything we can clarify about how KimuX can support {company}.\n\n"
        "Happy to set up a call at your convenience.\n\n"
        "Best,\nThe KimuX Team",
    ),
    ("warm", "friendly"): (
        "Checking in, {first_name}",
        "Hey {first_name}!\n\n"
        "Just checking in to see how things are going. "
        "We have made some updates since we last connected and I think you will find them relevant.\n\n"
        "Let me know if you would like a quick walkthrough — always happy to chat!\n\n"
        "Cheers,\nThe KimuX Team",
    ),
    ("warm", "urgent"): (
        "Do not miss out, {first_name} — act before Friday",
        "Hi {first_name},\n\n"
        "We are running a time-sensitive initiative and I wanted to make sure "
        "{company} was included. This window closes Friday.\n\n"
        "Can we jump on a quick 15-minute call today or tomorrow?\n\n"
        "Talk soon,\nThe KimuX Team",
    ),
    ("cold", "professional"): (
        "Introducing KimuX — built for businesses like {company}",
        "Hi {first_name},\n\n"
        "I came across {company} and wanted to introduce KimuX — "
        "an AI-powered platform helping businesses automate marketing and grow affiliate revenue.\n\n"
        "I would love to share how we have helped similar companies. Would a brief call next week work?\n\n"
        "Best,\nThe KimuX Team",
    ),
    ("cold", "friendly"): (
        "Hi {first_name}, thought you might find this useful",
        "Hey {first_name}!\n\n"
        "I know you are probably busy, so I will keep this short — "
        "we built something at KimuX that I genuinely think could help {company}.\n\n"
        "No commitment, just a quick look. Interested?\n\n"
        "Cheers,\nThe KimuX Team",
    ),
    ("cold", "urgent"): (
        "{first_name}, limited spots available — claim yours now",
        "Hi {first_name},\n\n"
        "We are opening up a limited number of onboarding spots this month "
        "and I wanted to reach out to {company} before they are all taken.\n\n"
        "If you are even slightly curious, now is the time to act. Reply and I will get you set up.\n\n"
        "Talk soon,\nThe KimuX Team",
    ),
}


def generate_outreach(db: Session, lead_id: str, request: AiOutreachRequest) -> AiOutreachResponse:
    lead = db.scalar(select(Lead).where(Lead.id == lead_id))
    if lead is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")

    classification_val = (
        lead.classification.value if hasattr(lead.classification, "value") else str(lead.classification)
    )
    tone = request.tone
    key = (classification_val, tone)

    # Fall back to professional if exact (classification, tone) pair is not defined
    subject_tpl, body_tpl = _TEMPLATES.get(
        key,
        _TEMPLATES.get((classification_val, "professional"), ("Hello {first_name}", "Hi {first_name},\n\n")),
    )

    company = lead.company or "your company"
    ctx = {"first_name": lead.first_name, "company": company}
    return AiOutreachResponse(
        lead_id=lead_id,
        subject=subject_tpl.format(**ctx),
        body=body_tpl.format(**ctx),
        tone=tone,
    )
