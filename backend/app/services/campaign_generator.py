from __future__ import annotations

import asyncio
import json
import os
from uuid import uuid4
from urllib import error, request as urllib_request

from fastapi import HTTPException, status

from app.schemas.campaign import CampaignGenerateRequest


SYSTEM_PROMPT = (
    "You are a campaign generation engine. You generate marketing campaign contracts as raw JSON only. "
    "Never include markdown, code fences, or explanation. Only output valid JSON matching the exact schema provided."
)

GEMINI_MODEL = "gemini-1.5-flash"


def _expected_campaign_schema() -> dict:
    return {
        "name": "string",
        "status": "draft|generating|compliance_check|ready|testing|optimizing|scaling|paused|archived",
        "theme_color": "string|null",
        "platforms": ["string"],
        "version": "int",
        "previous_version_id": "string|null",
        "affiliate_product": {
            "product_id": "string",
            "vendor": "string",
            "offer_name": "string",
            "hoplink": "string",
            "commission": {
                "model": "percentage|fixed",
                "value": "float",
                "currency": "string",
                "payout_frequency": "string|null",
            },
            "niche": "string|null",
            "source_network": "string|null",
        },
        "audience": "object|null",
        "tracking": {
            "base_hoplink": "string",
            "tracking_template": "string|null",
            "tracking_links": [
                {
                    "platform": "string",
                    "content_piece_id": "string|null",
                    "final_url": "string",
                    "subid_map": {"key": "value"},
                    "utm": {"source": "string", "medium": "string", "campaign": "string"},
                }
            ],
            "attribution_model": "string|null",
        },
        "scheduling": {
            "timezone": "string",
            "campaign_window": {
                "start_at": "ISO datetime|null",
                "end_at": "ISO datetime|null",
                "cadence_default": "once|weekly|biweekly|monthly",
            },
        },
        "metrics": {
            "intent": {
                "primary_goal": "clicks|conversions|impressions",
                "budget": {
                    "amount": "float|null",
                    "currency": "string|null",
                    "cap_type": "string|null",
                },
                "target_clicks": "int|null",
                "target_ctr": "float|null",
                "target_conversions": "int|null",
                "target_cvr": "float|null",
                "target_roas": "float|null",
            },
            "actuals": {
                "impressions": "int",
                "clicks": "int",
                "conversions": "int",
                "revenue": "float",
                "spend": "float",
                "ctr": "float|null",
                "cvr": "float|null",
                "roas": "float|null",
                "last_synced_at": "ISO datetime|null",
            },
        },
        "content_pieces": [
            {
                "piece_id": "string",
                "platform": "string",
                "format": "string",
                "status": "draft|scheduled|posted",
                "sequence_index": "int",
                "objective": "string|null",
                "cta_text": "string|null",
                "cta_link": "string|null",
                "hashtags": ["string"],
                "copy": {
                    "hook": "string|null",
                    "headline": "string|null",
                    "body": "string|null",
                    "caption": "string|null",
                    "subject_line": "string|null",
                    "script": "string|null",
                },
                "media": {
                    "image_prompt": "string|null",
                    "image_url": "string|null",
                    "video_prompt": "string|null",
                    "thumbnail_prompt": "string|null",
                },
                "compliance": {
                    "disclosures": ["string"],
                    "restricted_terms": ["string"],
                },
                "schedule": {
                    "publish_at": "ISO datetime|null",
                    "timezone": "string|null",
                    "recurrence": "once|weekly|biweekly|monthly|null",
                    "end_at": "ISO datetime|null",
                },
                "publish_result": {
                    "external_post_id": "string|null",
                    "posted_at": "ISO datetime|null",
                    "error_message": "string|null",
                }
            }
        ],
        "tags": ["string"],
        "notes": "string|null",
        "archive_reason": "string|null",
        "deleted_at": "ISO datetime|null",
        "generation_config": {
            "topic": "string",
            "keywords": ["string"],
            "tone": "string",
            "language": "string",
            "num_variants": "int",
            "gemini_model": "string",
        },
        "budget": {
            "daily_limit": "float|null",
            "total_limit": "float|null",
            "per_variant_limit": "float",
            "spent_to_date": "float",
            "currency": "string",
        },
    }


def _strip_markdown_fences(text: str) -> str:
    cleaned = (text or "").strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        cleaned = "\n".join(lines).strip()
    return cleaned


class CampaignGeneratorService:
    async def generate(self, request: CampaignGenerateRequest) -> dict:
        mock_mode = self._resolve_mock_mode(request.mock_mode)

        if mock_mode:
            payload = self._build_mock_contract(request)
        else:
            payload = await self._generate_with_gemini(request)

        payload["status"] = "draft"
        payload["is_used"] = False
        payload["version"] = 1
        payload["previous_version_id"] = None
        payload["generation_config"] = {
            "topic": request.prompt,
            "keywords": [],
            "tone": "professional",
            "language": request.language,
            "num_variants": request.num_variants,
            "gemini_model": GEMINI_MODEL,
        }
        payload["budget"] = {
            "daily_limit": None,
            "total_limit": None,
            "per_variant_limit": 10,
            "spent_to_date": 0,
            "currency": "USD",
        }

        return payload

    @staticmethod
    def _resolve_mock_mode(request_value: bool | None) -> bool:
        if request_value is not None:
            return request_value

        env_value = os.getenv("GEMINI_MOCK_MODE", "true")
        return str(env_value).strip().lower() != "false"

    @staticmethod
    def _build_mock_contract(request: CampaignGenerateRequest) -> dict:
        prompt = request.prompt.strip()
        platforms = request.platforms
        affiliate_product = request.affiliate_product
        audience = request.audience
        hoplink = str(affiliate_product.get("hoplink") or "https://example.com/offer")

        content_pieces: list[dict] = []
        for index, platform in enumerate(platforms):
            content_pieces.append(
                {
                    "piece_id": str(uuid4()),
                    "platform": platform,
                    "format": "post",
                    "status": "draft",
                    "sequence_index": index,
                    "objective": "Drive qualified clicks",
                    "cta_text": "Learn More",
                    "cta_link": hoplink,
                    "hashtags": ["#affiliate", "#marketing", "#growth"],
                    "copy": {
                        "hook": f"{platform.title()} angle for {prompt}",
                        "headline": f"{prompt} on {platform.title()}",
                        "body": f"Discover how {prompt} can help your audience achieve better outcomes.",
                        "caption": f"{prompt} offer now live for {platform}.",
                        "subject_line": f"{prompt}: new offer for your audience",
                        "script": f"Quick intro for {platform}: {prompt}. CTA: Learn More.",
                    },
                    "media": {
                        "image_prompt": f"Marketing visual for {prompt} on {platform}",
                        "image_url": None,
                        "video_prompt": f"15 second script for {platform} about {prompt}",
                        "thumbnail_prompt": f"Bold thumbnail for {platform} campaign",
                    },
                    "compliance": {
                        "disclosures": ["Affiliate links may generate commissions"],
                        "restricted_terms": [],
                    },
                    "schedule": {
                        "publish_at": None,
                        "timezone": None,
                        "recurrence": "once",
                        "end_at": None,
                    },
                    "publish_result": None,
                }
            )

        return {
            "name": f"{prompt[:60]} Campaign",
            "theme_color": "#00C896",
            "platforms": platforms,
            "affiliate_product": affiliate_product,
            "audience": audience,
            "tracking": {
                "base_hoplink": hoplink,
                "tracking_template": "{base}?utm_source={platform}&utm_medium=affiliate&utm_campaign=generated",
                "tracking_links": [
                    {
                        "platform": platform,
                        "content_piece_id": content_pieces[idx]["piece_id"],
                        "final_url": f"{hoplink}?utm_source={platform.lower()}&utm_medium=affiliate&utm_campaign=generated",
                        "subid_map": {"variant": str(idx + 1)},
                        "utm": {
                            "source": platform.lower(),
                            "medium": "affiliate",
                            "campaign": "generated_campaign",
                        },
                    }
                    for idx, platform in enumerate(platforms)
                ],
                "attribution_model": "last_click",
            },
            "scheduling": {
                "timezone": "UTC",
                "campaign_window": {
                    "start_at": None,
                    "end_at": None,
                    "cadence_default": "once",
                },
            },
            "metrics": {
                "intent": {
                    "primary_goal": "clicks",
                    "budget": {
                        "amount": None,
                        "currency": "USD",
                        "cap_type": "lifetime",
                    },
                    "target_clicks": 100,
                    "target_ctr": None,
                    "target_conversions": None,
                    "target_cvr": None,
                    "target_roas": None,
                },
                "actuals": {
                    "impressions": 0,
                    "clicks": 0,
                    "conversions": 0,
                    "revenue": 0,
                    "spend": 0,
                    "ctr": None,
                    "cvr": None,
                    "roas": None,
                    "last_synced_at": None,
                },
            },
            "content_pieces": content_pieces,
            "tags": ["generated", "affiliate", "ai"],
            "notes": f"Auto-generated from prompt: {prompt}",
            "archive_reason": None,
            "deleted_at": None,
        }

    async def _generate_with_gemini(self, request: CampaignGenerateRequest) -> dict:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Campaign generation failed: GEMINI_API_KEY is not configured.",
            )

        schema = _expected_campaign_schema()
        base_user_prompt = (
            "Generate a campaign contract as JSON.\n"
            f"User prompt: {request.prompt}\n"
            f"Target platforms: {json.dumps(request.platforms)}\n"
            f"Affiliate product details: {json.dumps(request.affiliate_product)}\n"
            f"Audience details: {json.dumps(request.audience)}\n"
            f"Number of content pieces to generate (one per platform): {len(request.platforms)}\n"
            f"Expected JSON schema: {json.dumps(schema)}"
        )

        first_attempt = await self._call_gemini(api_key, base_user_prompt)
        parsed = self._try_parse_json(first_attempt)
        if parsed is not None:
            return parsed

        retry_prompt = base_user_prompt + "\nReturn raw JSON only. Do not include markdown, fences, comments, or prose."
        second_attempt = await self._call_gemini(api_key, retry_prompt)
        parsed_retry = self._try_parse_json(second_attempt)
        if parsed_retry is not None:
            return parsed_retry

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Campaign generation failed: Gemini returned invalid JSON after retry.",
        )

    async def _call_gemini(self, api_key: str, user_prompt: str) -> str:
        endpoint = (
            f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
            f"?key={api_key}"
        )
        payload = {
            "system_instruction": {
                "parts": [{"text": SYSTEM_PROMPT}]
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
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Campaign generation failed: Gemini API HTTP error: {response_body or exc.reason}",
                ) from exc
            except error.URLError as exc:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Campaign generation failed: Gemini API request error: {exc.reason}",
                ) from exc

            try:
                parsed_body = json.loads(body)
                return (
                    parsed_body.get("candidates", [{}])[0]
                    .get("content", {})
                    .get("parts", [{}])[0]
                    .get("text", "")
                )
            except Exception as exc:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Campaign generation failed: Could not parse Gemini API response envelope.",
                ) from exc

        return await asyncio.to_thread(_make_request)

    @staticmethod
    def _try_parse_json(candidate_text: str) -> dict | None:
        cleaned = _strip_markdown_fences(candidate_text)
        try:
            parsed = json.loads(cleaned)
        except json.JSONDecodeError:
            return None
        if isinstance(parsed, dict):
            return parsed
        return None
