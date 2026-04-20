"""strategy_service.py

Handles the Strategy Marketing Engine:
  - Persists wizard answers
  - Calls Gemini to generate a full marketing strategy
  - Falls back to a template strategy if Gemini is unavailable or fails
"""

from __future__ import annotations

import json
import logging
import re

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.strategy import Strategy, StrategyStatus
from app.schemas.strategy import StrategyWizardInput

log = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Fallback template strategy
# ---------------------------------------------------------------------------

def _fallback_strategy(wizard: StrategyWizardInput) -> dict:
    budget = wizard.monthly_budget or 0
    goal = wizard.primary_goal or "leads"
    industry = wizard.industry
    timeline = wizard.target_timeline or 90

    if budget < 500:
        paid_pct, organic_pct, tools_pct = "0%", "80%", "20%"
        channels = {"seo": 8, "paid_social": 2, "google_ads": 1, "email": 9, "social_organic": 7, "affiliate": 5}
    elif budget < 2000:
        paid_pct, organic_pct, tools_pct = "30%", "55%", "15%"
        channels = {"seo": 7, "paid_social": 6, "google_ads": 5, "email": 8, "social_organic": 6, "affiliate": 5}
    else:
        paid_pct, organic_pct, tools_pct = "50%", "35%", "15%"
        channels = {"seo": 6, "paid_social": 8, "google_ads": 8, "email": 7, "social_organic": 5, "affiliate": 6}

    return {
        "target_personas": [
            {
                "name": "Primary Buyer",
                "age": "25-44",
                "location": wizard.geography or "national",
                "role": "Decision Maker",
                "pain_points": [wizard.pain_point or f"Key challenge in {industry}"],
                "buying_triggers": ["ROI proof", "Peer recommendation", "Free trial"],
                "preferred_channels": ["Email", "LinkedIn", "Google Search"],
            }
        ],
        "usp": {
            "statement": f"The only {industry} solution that delivers measurable results fast.",
            "proof_points": [
                "Proven ROI in under 30 days",
                "No long-term contracts",
                "Dedicated onboarding support",
            ],
        },
        "positioning": (
            f"For {wizard.target_audience or 'growing businesses'} who need better results, "
            f"{wizard.business_type} is the {industry} solution that drives {goal} "
            f"unlike traditional alternatives."
        ),
        "gtm_strategy": {
            "phase1": {
                "name": "Foundation",
                "duration": "Days 1-30",
                "tactics": [
                    "Define ICP and build target list",
                    "Set up email nurture sequence (5 emails)",
                    "Publish 4 SEO blog posts targeting core keywords",
                    "Launch social profiles and post 3x/week",
                ],
            },
            "phase2": {
                "name": "Activation",
                "duration": "Days 31-60",
                "tactics": [
                    "Launch lead magnet (checklist, template, or mini-course)",
                    "Start retargeting campaign",
                    "Begin weekly email newsletter",
                    "Launch affiliate/referral program",
                ],
            },
            "phase3": {
                "name": "Scale",
                "duration": f"Days 61-{timeline}",
                "tactics": [
                    "Scale winning ad creatives",
                    "Add paid search for high-intent keywords",
                    "Launch customer case studies",
                    "Expand to second channel based on data",
                ],
            },
        },
        "channel_scores": channels,
        "ninety_day_plan": [
            {
                "week": "1-2",
                "tasks": ["Finalize ICP", "Set up analytics", "Create content calendar"],
                "kpis": ["Analytics tracking live", "10 target accounts identified"],
            },
            {
                "week": "3-4",
                "tasks": ["Publish first 2 blog posts", "Launch email sequence", "Post on social daily"],
                "kpis": ["First 100 website visitors", "50 email subscribers"],
            },
            {
                "week": "5-8",
                "tasks": ["Publish lead magnet", "Start paid retargeting", "A/B test email subject lines"],
                "kpis": ["25 leads captured", "Email open rate >30%"],
            },
            {
                "week": "9-12",
                "tasks": ["Scale top-performing content", "Launch referral program", "Review and optimize all channels"],
                "kpis": [f"50+ {goal}", "CAC under target", "Channel ROI measured"],
            },
        ],
        "budget_allocation": {
            "organic": organic_pct,
            "paid": paid_pct,
            "tools": tools_pct,
        },
        "strategy_score": 62,
        "key_insight": (
            f"With a ${int(budget)}/month budget focused on {goal}, "
            f"prioritize email and organic content before scaling paid channels."
        ),
    }


# ---------------------------------------------------------------------------
# Gemini helpers (reuse pattern from ai_service)
# ---------------------------------------------------------------------------

def _call_gemini(prompt: str) -> str | None:
    from app.core.config import settings
    if not settings.gemini_api_key:
        return None
    try:
        from google import genai  # type: ignore
        client = genai.Client(api_key=settings.gemini_api_key)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        return response.text
    except Exception as exc:
        log.warning("Gemini strategy call failed: %s", exc)
        return None


def _extract_json(text: str) -> dict | None:
    text = re.sub(r"```(?:json)?", "", text).strip()
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        return None
    try:
        return json.loads(match.group())
    except json.JSONDecodeError:
        return None


# ---------------------------------------------------------------------------
# AI strategy generation
# ---------------------------------------------------------------------------

def generate_strategy_with_ai(strategy: Strategy) -> dict:
    """
    Call Gemini with the full business profile and return the parsed strategy dict.
    Falls back to _fallback_strategy() if Gemini is unavailable or returns bad JSON.
    """
    wizard = StrategyWizardInput(
        business_type=strategy.business_type,
        industry=strategy.industry,
        product_description=strategy.product_description,
        pricing_model=strategy.pricing_model,
        growth_stage=strategy.growth_stage,
        target_audience=strategy.target_audience,
        pain_point=strategy.pain_point,
        competitors=strategy.competitors,
        geography=strategy.geography,
        languages=strategy.languages,
        monthly_budget=strategy.monthly_budget,
        team_size=strategy.team_size,
        tried_channels=strategy.tried_channels,
        primary_goal=strategy.primary_goal,
        target_timeline=strategy.target_timeline,
    )

    prompt = f"""You are KimuX's AI Chief Marketing Officer. Generate a complete marketing strategy based on the following business profile. Respond ONLY in valid JSON, no markdown, no preamble.

Business Profile:
- Type: {strategy.business_type}
- Industry: {strategy.industry}
- Product: {strategy.product_description}
- Pricing: {strategy.pricing_model or "not specified"}
- Stage: {strategy.growth_stage or "not specified"}
- Target Audience: {strategy.target_audience or "not specified"}
- Pain Point: {strategy.pain_point or "not specified"}
- Competitors: {strategy.competitors or []}
- Geography: {strategy.geography or "national"}
- Budget: ${strategy.monthly_budget or 0}/month
- Team Size: {strategy.team_size or "1"}
- Goal: {strategy.primary_goal or "leads"}
- Timeline: {strategy.target_timeline or 90} days

Generate this JSON structure:
{{
  "target_personas": [{{"name": "string", "age": "string", "location": "string", "role": "string", "pain_points": ["string"], "buying_triggers": ["string"], "preferred_channels": ["string"]}}],
  "usp": {{"statement": "string (25 words max)", "proof_points": ["string", "string", "string"]}},
  "positioning": "For [target] who [need], [brand] is the [category] that [benefit] unlike [competitor]",
  "gtm_strategy": {{"phase1": {{"name": "string", "duration": "string", "tactics": ["string"]}}, "phase2": {{"name": "string", "duration": "string", "tactics": ["string"]}}, "phase3": {{"name": "string", "duration": "string", "tactics": ["string"]}}}},
  "channel_scores": {{"seo": 0, "paid_social": 0, "google_ads": 0, "email": 0, "social_organic": 0, "affiliate": 0}},
  "ninety_day_plan": [{{"week": "1-2", "tasks": ["string"], "kpis": ["string"]}}, {{"week": "3-4", "tasks": ["string"], "kpis": ["string"]}}, {{"week": "5-8", "tasks": ["string"], "kpis": ["string"]}}, {{"week": "9-12", "tasks": ["string"], "kpis": ["string"]}}],
  "budget_allocation": {{"organic": "percentage", "paid": "percentage", "tools": "percentage"}},
  "strategy_score": 0,
  "key_insight": "One sentence summary of the most important strategic recommendation"
}}

Be specific to their industry and budget. If budget is under $500/month, prioritize organic and email. If over $2000, include paid channels."""

    raw = _call_gemini(prompt)
    if raw:
        parsed = _extract_json(raw)
        if parsed:
            log.debug("Gemini strategy generated for strategy %s", strategy.id)
            return parsed
        log.warning("Gemini returned unparseable JSON for strategy %s — using fallback", strategy.id)
    else:
        log.info("Gemini unavailable for strategy %s — using fallback", strategy.id)

    return _fallback_strategy(wizard)


# ---------------------------------------------------------------------------
# Service functions
# ---------------------------------------------------------------------------

def create_strategy(db: Session, user_id: str, wizard_input: StrategyWizardInput) -> Strategy:
    """
    Persist wizard answers, call AI, store output, return completed strategy.
    """
    strategy = Strategy(
        user_id=user_id,
        status=StrategyStatus.generating,
        business_type=wizard_input.business_type,
        industry=wizard_input.industry,
        product_description=wizard_input.product_description,
        pricing_model=wizard_input.pricing_model,
        growth_stage=wizard_input.growth_stage,
        target_audience=wizard_input.target_audience,
        pain_point=wizard_input.pain_point,
        competitors=wizard_input.competitors,
        geography=wizard_input.geography,
        languages=wizard_input.languages,
        monthly_budget=wizard_input.monthly_budget,
        team_size=wizard_input.team_size,
        tried_channels=wizard_input.tried_channels,
        primary_goal=wizard_input.primary_goal,
        target_timeline=wizard_input.target_timeline,
    )
    db.add(strategy)
    db.flush()  # get strategy.id before AI call

    # Generate strategy (synchronous — Gemini latency is acceptable here)
    output = generate_strategy_with_ai(strategy)

    strategy.strategy_output = output
    strategy.strategy_score = int(output.get("strategy_score", 0))

    # Derive current phase from growth_stage
    phase_map = {
        "idea": "foundation",
        "prelaunch": "foundation",
        "launched": "growth",
        "scaling": "scale",
    }
    strategy.current_phase = phase_map.get(wizard_input.growth_stage or "", "foundation")
    strategy.status = StrategyStatus.active

    db.commit()
    db.refresh(strategy)
    return strategy


def get_user_strategies(db: Session, user_id: str) -> list[Strategy]:
    return list(
        db.scalars(
            select(Strategy)
            .where(Strategy.user_id == user_id)
            .order_by(Strategy.created_at.desc())
        )
    )


def get_strategy_by_id(db: Session, strategy_id: str, user_id: str) -> Strategy:
    strategy = db.scalar(
        select(Strategy).where(
            Strategy.id == strategy_id,
            Strategy.user_id == user_id,
        )
    )
    if strategy is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategy not found")
    return strategy