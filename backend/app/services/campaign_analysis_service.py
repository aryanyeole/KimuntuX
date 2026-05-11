from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime
from urllib import error, request as urllib_request

from app.core.config import settings

logger = logging.getLogger(__name__)

GEMINI_MODEL = "gemini-2.5-flash"


def _fallback_analysis() -> dict:
    return {
        "health_score": 0,
        "health_label": "Unknown",
        "summary": "Analysis unavailable — please try again.",
        "recommendations": [],
        "platform_breakdown": [],
        "next_steps": [],
    }


class CampaignAnalysisService:
    async def analyze(self, campaign: dict) -> dict:
        api_key = settings.gemini_api_key
        if not api_key:
            return _fallback_analysis()

        prompt = self._build_prompt(campaign)

        try:
            raw_text = await self._call_gemini(api_key, prompt)
            parsed = self._try_parse_json(raw_text)
            if isinstance(parsed, dict):
                return parsed
            logger.warning("Campaign analysis returned invalid JSON for campaign %s", campaign.get("id"))
        except Exception as exc:  # pragma: no cover - defensive fallback
            logger.warning("Campaign analysis failed for campaign %s: %s", campaign.get("id"), exc)

        return _fallback_analysis()

    @staticmethod
    def _format_datetime(value) -> str:
        if isinstance(value, datetime):
            return value.isoformat()
        if value:
            return str(value)
        return "recently scheduled"

    @staticmethod
    def _build_prompt(campaign: dict) -> str:
        metrics = campaign.get("metrics") or {}
        actuals = metrics.get("actuals") or {}
        affiliate_product = campaign.get("affiliate_product") or {}
        scheduling = campaign.get("scheduling") or {}
        campaign_window = scheduling.get("campaign_window") or {}
        content_pieces = campaign.get("content_pieces") or []
        platforms = campaign.get("platforms") or []
        notes = campaign.get("notes") or "None"

        piece_platforms: list[str] = []
        for piece in content_pieces:
            if isinstance(piece, dict):
                platform = str(piece.get("platform") or "").strip()
                if platform:
                    piece_platforms.append(platform)

        platforms_label = ", ".join(str(platform) for platform in platforms if str(platform).strip()) or "None"
        content_count = len(content_pieces)
        start_at = CampaignAnalysisService._format_datetime(campaign_window.get("start_at"))
        offer_name = affiliate_product.get("offer_name") or "Unknown offer"
        vendor = affiliate_product.get("vendor") or "Unknown vendor"
        schema = {
            "health_score": 75,
            "health_label": "Good",
            "summary": "One sentence overall assessment",
            "recommendations": [
                {
                    "title": "Short action title",
                    "description": "2-3 sentence specific recommendation with data references",
                    "priority": "high|medium|low",
                    "action": "Increase Budget|Pause Campaign|Refresh Creative|Scale Campaign|Review Targeting",
                }
            ],
            "platform_breakdown": [
                {
                    "platform": "Instagram",
                    "performance": "strong|average|weak",
                    "insight": "One sentence insight for this platform",
                }
            ],
            "next_steps": ["string — specific actionable next step"],
        }

        prompt = (
            "You are an expert digital marketing analyst. Analyze this affiliate marketing campaign and provide specific, data-driven recommendations.\n\n"
            f"Campaign: {campaign.get('name') or 'Untitled campaign'}\n"
            f"Offer: {offer_name} by {vendor}\n"
            f"Platforms: {platforms_label}\n"
            f"Running since: {start_at}\n\n"
            "Performance Metrics:\n"
            f"- Impressions: {int(actuals.get('impressions') or 0):,}\n"
            f"- Clicks: {int(actuals.get('clicks') or 0):,}\n"
            f"- CTR: {actuals.get('ctr') or 0}%\n"
            f"- Conversions: {int(actuals.get('conversions') or 0)}\n"
            f"- CVR: {actuals.get('cvr') or 0}%\n"
            f"- Spend: ${actuals.get('spend') or 0}\n"
            f"- Revenue: ${actuals.get('revenue') or 0}\n"
            f"- ROAS: {actuals.get('roas') or 0}x\n"
            f"- CPA: ${actuals.get('cpa') or 0}\n"
            f"- Leads: {int(actuals.get('leads') or 0)}\n\n"
            "KimuX Academy performance benchmarks:\n"
            "- CTR: Good >1% | Warning 0.5-1% | Bad <0.5% (below 0.5% means creative needs work)\n"
            "- ROAS: Good >3x | Acceptable 1.5-3x | Bad <1.5x (below 1x = pause immediately)\n"
            "- CVR: Good >2% | Acceptable 1-2% | Bad <1%\n"
            "- Hot Lead %: Good >20% of total leads | Bad <5% (below 5% = wrong audience)\n"
            "- Average Lead Score: Good >55 | Bad <35\n"
            "- CPL stability: Healthy = stable for 5+ consecutive days below target\n"
            "- Budget scaling rule: Only scale when ROAS >1.5x AND CPL stable 5+ days AND avg lead score >50\n"
            "- Max budget increase: 20% every 4 days — never more or algorithm resets\n"
            "- Creative refresh: Required every 14 days to prevent audience fatigue\n"
            "- Minimum test period: 7 days at $10/day before making scaling decisions\n\n"
            f"Content pieces: {content_count} pieces across {', '.join(sorted(set(piece_platforms))) if piece_platforms else platforms_label}\n"
            f"Campaign notes: {notes}\n\n"
            "Provide specific recommendations based on the actual numbers above. Reference specific metrics in your recommendations.\n"
            "Health score logic:\n"
            "- Score 80-100 = \"Strong\" - ROAS >3x, CTR >1%, Hot leads >20%\n"
            "- Score 60-79 = \"Good\" - ROAS >1.5x, CTR >0.5%, meeting most benchmarks\n"
            "- Score 40-59 = \"Average\" - some metrics below benchmark, optimization needed\n"
            "- Score 20-39 = \"Weak\" - multiple metrics below benchmark, significant changes needed\n"
            "- Score 0-19 = \"Critical\" - ROAS <1x or CTR <0.3%, pause and rebuild recommended\n\n"
            "Return ONLY valid JSON matching the exact schema provided. No markdown, no explanation.\n\n"
            f"Schema:\n{json.dumps(schema, indent=2)}"
        )
        return prompt

    async def _call_gemini(self, api_key: str, user_prompt: str) -> str:
        endpoint = (
            f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
            f"?key={api_key}"
        )
        payload = {
            "system_instruction": {
                "parts": [
                    {
                        "text": (
                            "You are a campaign analysis engine. You generate JSON only. "
                            "Never include markdown, code fences, or explanation."
                        )
                    }
                ]
            },
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": user_prompt}],
                }
            ],
            "generationConfig": {
                "responseMimeType": "application/json",
            },
        }

        request_data = json.dumps(payload).encode("utf-8")

        def _make_request() -> str:
            req = urllib_request.Request(
                endpoint,
                data=request_data,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            try:
                with urllib_request.urlopen(req, timeout=45) as response:
                    body = response.read().decode("utf-8")
            except error.HTTPError as exc:
                response_body = exc.read().decode("utf-8", errors="ignore")
                raise RuntimeError(response_body or exc.reason) from exc
            except error.URLError as exc:
                raise RuntimeError(str(exc.reason)) from exc

            try:
                parsed_body = json.loads(body)
                return (
                    parsed_body.get("candidates", [{}])[0]
                    .get("content", {})
                    .get("parts", [{}])[0]
                    .get("text", "")
                )
            except Exception as exc:
                raise RuntimeError("Could not parse Gemini API response envelope") from exc

        return await asyncio.to_thread(_make_request)

    @staticmethod
    def _try_parse_json(candidate_text: str) -> dict | None:
        cleaned = (candidate_text or "").strip()
        if cleaned.startswith("```"):
            lines = cleaned.splitlines()
            if lines and lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            cleaned = "\n".join(lines).strip()

        try:
            parsed = json.loads(cleaned)
        except json.JSONDecodeError:
            return None
        return parsed if isinstance(parsed, dict) else None