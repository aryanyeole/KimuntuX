"""ai_service.py

Two-mode AI service:
  - Gemini-powered when GEMINI_API_KEY is set in the environment
  - Rule-based fallback when the key is missing or any Gemini call fails

Never raises from a Gemini failure — always falls back gracefully.
"""

from __future__ import annotations

import json
import logging
import re
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.activity import Activity
from app.models.lead import Lead, LeadClassification, LeadSource, LeadStage
from app.schemas.lead import AiOutreachRequest, AiOutreachResponse, AiScoreResponse

log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Gemini client — initialised once at import time if the key exists
# ---------------------------------------------------------------------------

_gemini_client = None

def _get_gemini():
    """Return a cached google-genai Client or None if unavailable."""
    global _gemini_client
    if _gemini_client is not None:
        return _gemini_client
    if not settings.gemini_api_key:
        return None
    try:
        from google import genai  # type: ignore
        _gemini_client = genai.Client(api_key=settings.gemini_api_key)
        log.info("Gemini client initialised (google-genai)")
        return _gemini_client
    except Exception as exc:  # pragma: no cover
        log.warning("Failed to initialise Gemini: %s", exc)
        return None


def _call_gemini(prompt: str) -> str | None:
    """Send a prompt to Gemini and return the raw text, or None on any error."""
    client = _get_gemini()
    if client is None:
        return None
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        return response.text
    except Exception as exc:
        log.warning("Gemini call failed: %s", exc)
        return None


def _extract_json(text: str) -> dict | None:
    """
    Try to extract a JSON object from a Gemini response that may contain
    markdown fences or surrounding prose.
    """
    # Strip markdown code fences
    text = re.sub(r"```(?:json)?", "", text).strip()
    # Find the first {...} block
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        return None
    try:
        return json.loads(match.group())
    except json.JSONDecodeError:
        return None


# ---------------------------------------------------------------------------
# Scoring weights (rule-based fallback)
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


def _rule_based_score(lead: Lead, activity_count: int) -> tuple[int, LeadClassification]:
    source_val = lead.source.value if hasattr(lead.source, "value") else str(lead.source)
    stage_val = lead.stage.value if hasattr(lead.stage, "value") else str(lead.stage)
    raw = (
        _SOURCE_WEIGHT.get(source_val, 5)
        + _STAGE_WEIGHT.get(stage_val, 0)
        + _recency_score(lead.last_contact_at)
        + _activity_score(activity_count)
    )
    score = max(0, min(100, raw))
    return score, _classify(score)


# ---------------------------------------------------------------------------
# Score lead (Gemini-enhanced or rule-based)
# ---------------------------------------------------------------------------

def score_lead(db: Session, lead_id: str, tenant_id: str) -> AiScoreResponse:
    lead = db.scalar(select(Lead).where(Lead.id == lead_id, Lead.tenant_id == tenant_id))
    if lead is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")

    activity_count = db.scalar(
        select(func.count(Activity.id)).where(Activity.lead_id == lead_id)
    ) or 0

    # Always compute rule-based score first — used as baseline and as fallback
    rule_score, rule_classification = _rule_based_score(lead, activity_count)

    # Fetch recent activity descriptions for Gemini context (up to 10)
    recent_activities = db.scalars(
        select(Activity.description)
        .where(Activity.lead_id == lead_id)
        .order_by(Activity.timestamp.desc())
        .limit(10)
    ).all()

    last_contact_days = None
    if lead.last_contact_at:
        lc = lead.last_contact_at
        if lc.tzinfo is None:
            lc = lc.replace(tzinfo=timezone.utc)
        last_contact_days = (datetime.now(timezone.utc) - lc).days

    source_val = lead.source.value if hasattr(lead.source, "value") else str(lead.source)
    stage_val = lead.stage.value if hasattr(lead.stage, "value") else str(lead.stage)

    # ── Attempt Gemini scoring ────────────────────────────────────────────────
    conversion_probability = None
    recommended_action = None
    reasoning = None
    score = rule_score
    classification = rule_classification

    prompt = f"""You are an AI lead scoring assistant for KimuX, an AI-powered digital marketing CRM.
Analyze this lead and provide a score from 0 to 100 and classification.

Lead data:
- Name: {lead.first_name} {lead.last_name}
- Company: {lead.company or "Unknown"}
- Industry: {lead.industry or "Unknown"}
- Source: {source_val}
- Stage: {stage_val}
- Activity count: {activity_count}
- Days since last contact: {last_contact_days if last_contact_days is not None else "Never contacted"}
- Current rule-based score: {rule_score}

Recent activities:
{chr(10).join(f"- {a}" for a in recent_activities) if recent_activities else "- No activities recorded"}

Respond ONLY with valid JSON (no markdown, no explanation):
{{
  "score": <integer 0-100>,
  "classification": "<hot|warm|cold>",
  "conversion_probability": <float 0.0-1.0>,
  "recommended_action": "<one concise sentence>",
  "reasoning": "<two to three sentence explanation>"
}}"""

    raw_text = _call_gemini(prompt)
    if raw_text:
        parsed = _extract_json(raw_text)
        if parsed:
            try:
                g_score = int(parsed.get("score", rule_score))
                g_cls_str = str(parsed.get("classification", "")).lower()
                g_cls = LeadClassification[g_cls_str] if g_cls_str in ("hot", "warm", "cold") else rule_classification
                score = max(0, min(100, g_score))
                classification = g_cls
                conversion_probability = float(parsed.get("conversion_probability", 0))
                recommended_action = str(parsed.get("recommended_action", ""))
                reasoning = str(parsed.get("reasoning", ""))
                log.debug("Gemini scored lead %s → %d (%s)", lead_id, score, classification.value)
            except (KeyError, ValueError, TypeError) as exc:
                log.warning("Gemini response parse error for lead %s: %s — using rule-based", lead_id, exc)
                score, classification = rule_score, rule_classification
        else:
            log.warning("Gemini returned unparseable JSON for lead %s — using rule-based", lead_id)

    # Persist the result
    lead.ai_score = score
    lead.classification = classification
    db.commit()

    return AiScoreResponse(
        lead_id=lead_id,
        ai_score=score,
        classification=classification.value,
        message=f"Lead scored {score}/100 and classified as {classification.value}.",
        conversion_probability=conversion_probability,
        recommended_action=recommended_action,
        reasoning=reasoning,
    )


# ---------------------------------------------------------------------------
# Outreach generation (Gemini-enhanced or template-based)
# ---------------------------------------------------------------------------

_TEMPLATES: dict[tuple[str, str], tuple[str, str]] = {
    ("hot", "professional"): (
        "Exclusive opportunity tailored for {company}",
        "Hi {first_name},\n\n"
        "Based on your profile and recent engagement, I wanted to reach out personally. "
        "We have a solution that aligns precisely with what {company} is working toward.\n\n"
        "I would love to schedule a 20-minute call this week to walk you through it. "
        "Would Thursday or Friday work for you?\n\nBest regards,\nThe KimuX Team",
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
        "Happy to set up a call at your convenience.\n\nBest,\nThe KimuX Team",
    ),
    ("warm", "friendly"): (
        "Checking in, {first_name}",
        "Hey {first_name}!\n\n"
        "Just checking in to see how things are going. "
        "We have made some updates since we last connected and I think you will find them relevant.\n\n"
        "Let me know if you would like a quick walkthrough — always happy to chat!\n\nCheers,\nThe KimuX Team",
    ),
    ("warm", "urgent"): (
        "Do not miss out, {first_name} — act before Friday",
        "Hi {first_name},\n\n"
        "We are running a time-sensitive initiative and I wanted to make sure "
        "{company} was included. This window closes Friday.\n\n"
        "Can we jump on a quick 15-minute call today or tomorrow?\n\nTalk soon,\nThe KimuX Team",
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
        "No commitment, just a quick look. Interested?\n\nCheers,\nThe KimuX Team",
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


def _template_outreach(lead: Lead, tone: str) -> tuple[str, str]:
    """Return (subject, body) from the template map."""
    classification_val = (
        lead.classification.value if hasattr(lead.classification, "value") else str(lead.classification)
    )
    key = (classification_val, tone)
    subject_tpl, body_tpl = _TEMPLATES.get(
        key,
        _TEMPLATES.get((classification_val, "professional"), ("Hello {first_name}", "Hi {first_name},\n\n")),
    )
    ctx = {"first_name": lead.first_name, "company": lead.company or "your company"}
    return subject_tpl.format(**ctx), body_tpl.format(**ctx)


def generate_outreach(db: Session, lead_id: str, tenant_id: str, request: AiOutreachRequest) -> AiOutreachResponse:
    lead = db.scalar(select(Lead).where(Lead.id == lead_id, Lead.tenant_id == tenant_id))
    if lead is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")

    tone = request.tone
    channel = getattr(request, "channel", "email")
    classification_val = (
        lead.classification.value if hasattr(lead.classification, "value") else str(lead.classification)
    )
    source_val = lead.source.value if hasattr(lead.source, "value") else str(lead.source)

    # Fallback defaults
    subject, body = _template_outreach(lead, tone)
    estimated_open_rate = None
    estimated_reply_rate = None

    # ── Attempt Gemini outreach ───────────────────────────────────────────────
    prompt = f"""You are an AI outreach specialist for KimuX, a digital marketing platform.
Write a personalized {tone} outreach {channel} message for this lead.

Lead:
- Name: {lead.first_name} {lead.last_name}
- Company: {lead.company or "Unknown"}
- Industry: {lead.industry or "Unknown"}
- Source: {source_val}
- Classification: {classification_val}
- AI Score: {lead.ai_score}

Requirements:
- Tone: {tone}
- Channel: {channel}
- Concise and personalised — reference their industry and company
- Clear call-to-action at the end
- Do NOT use placeholder text like [Your Name] or [Company Name]; use "The KimuX Team" as sender

Respond ONLY with valid JSON (no markdown, no explanation):
{{
  "subject": "<email subject line or SMS header>",
  "body": "<full message body>",
  "estimated_open_rate": <float 0.0-1.0>,
  "estimated_reply_rate": <float 0.0-1.0>
}}"""

    raw_text = _call_gemini(prompt)
    if raw_text:
        parsed = _extract_json(raw_text)
        if parsed:
            try:
                g_subject = str(parsed.get("subject", "")).strip()
                g_body = str(parsed.get("body", "")).strip()
                if g_subject and g_body:
                    subject = g_subject
                    body = g_body
                    estimated_open_rate = float(parsed.get("estimated_open_rate", 0))
                    estimated_reply_rate = float(parsed.get("estimated_reply_rate", 0))
                    log.debug("Gemini outreach generated for lead %s", lead_id)
            except (KeyError, ValueError, TypeError) as exc:
                log.warning("Gemini outreach parse error for lead %s: %s — using template", lead_id, exc)
        else:
            log.warning("Gemini returned unparseable JSON for outreach lead %s — using template", lead_id)

    return AiOutreachResponse(
        lead_id=lead_id,
        subject=subject,
        body=body,
        tone=tone,
        estimated_open_rate=estimated_open_rate,
        estimated_reply_rate=estimated_reply_rate,
    )


# ---------------------------------------------------------------------------
# Bulk scoring — score all leads with ai_score == 0
# ---------------------------------------------------------------------------

def score_all_unscored(db: Session, tenant_id: str, *, force: bool = False) -> dict:
    """
    Score leads based on the force flag:
      force=False — only leads where ai_score == 0
      force=True  — all leads regardless of current score
    Returns a summary dict: {scored: int, skipped: int, errors: int}
    """
    query = select(Lead).where(Lead.tenant_id == tenant_id)
    if not force:
        query = query.where(Lead.ai_score == 0)
    leads = db.scalars(query).all()
    scored = 0
    errors = 0

    for lead in leads:
        try:
            score_lead(db, str(lead.id), tenant_id)
            scored += 1
        except HTTPException:
            pass
        except Exception as exc:
            log.warning("Unexpected error scoring lead %s: %s", lead.id, exc)
            errors += 1

    return {"scored": scored, "skipped": 0, "errors": errors, "total_processed": scored + errors}
