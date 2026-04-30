from __future__ import annotations
import base64
import logging
from uuid import uuid4
from urllib import error, request as urllib_request
from fastapi import HTTPException, status
from app.schemas.campaign import CampaignGenerateRequest
from app.core.config import settings

import asyncio
import json


logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "You are a campaign generation engine. You generate marketing campaign contracts as raw JSON only. "
    "Never include markdown, code fences, or explanation. Only output valid JSON matching the exact schema provided."
)

GEMINI_MODEL = "gemini-2.5-flash"

# Lightweight schema blueprint used to constrain LLM output shape.
def _creative_schema() -> dict:
    return {
        "name": "string — a compelling campaign name",
        "theme_color": "string — a hex color that fits the product vibe",
        "tags": ["string"],
        "notes": "string — one sentence describing the campaign strategy",
        "content_pieces": [
            {
                "platform": "string — must match one of the requested platforms exactly",
                "objective": "string",
                "cta_text": ["string — 3 different CTA button text variations"],
                "hashtags": [["string — set 1 of hashtags"], ["string — set 2"], ["string — set 3"]],
                "copy": {
                    "hook": ["string — 3 different hook variations"],
                    "headline": ["string — 3 different headline variations"],
                    "body": ["string — 3 different body copy variations"],
                    "caption": ["string — 3 different caption variations, null if not applicable"],
                    "subject_line": ["string — 3 email subject line variations, null if not Email platform"],
                    "script": ["string — 3 script variations, null if not YouTube or TikTok"],
                },
                "media": {
                    "image_prompt": ["string — 3 different image generation prompt variations"],
                    "video_prompt": ["string — 3 video prompt variations, null if not applicable"],
                    "thumbnail_prompt": ["string — 3 thumbnail prompt variations"],
                }
            }
        ],
    }

# Gemini may wrap JSON in markdown fences; normalize before parsing.
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
    # Route requests through mock mode or Gemini, then enforce required defaults.
    async def generate(self, request: CampaignGenerateRequest) -> dict:
        mock_mode = self._resolve_mock_mode(request.mock_mode)
        print(f"=== GENERATE CALLED — mock_mode={mock_mode} ===")
        if mock_mode:
            return self._build_mock_contract(request)
        else:
            return await self._generate_with_gemini(request)

    # Request flag overrides env; env defaults to mock mode enabled.
    @staticmethod
    def _resolve_mock_mode(request_value: bool | None) -> bool:
        if request_value is not None:
            return request_value
        return settings.gemini_mock_mode

    @staticmethod
    def _default_metrics() -> dict:
        return {
            "intent": {
                "primary_goal": "clicks",
                "budget": {
                    "amount": None,
                    "currency": "USD",
                    "cap_type": "lifetime",
                },
                "target_clicks": 0,
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
        }

    @staticmethod
    def _format_for_platform(platform: str) -> str:
        lowered = str(platform).strip().lower()
        if lowered == "email":
            return "email"
        if lowered in {"youtube", "tiktok"}:
            return "video"
        return "post"

    @staticmethod
    def _ensure_array(value, length: int = 3):
        if isinstance(value, list):
            if len(value) >= length:
                return value[:length]
            return value + [value[-1] if value else None] * (length - len(value))
        if isinstance(value, str):
            return [value] + [value] * (length - 1)
        return [None] * length

    def _ensure_hashtag_sets(self, value, length: int = 3) -> list[list[str]]:
        raw_sets = self._ensure_array(value, length)
        normalized_sets: list[list[str]] = []
        for hashtag_set in raw_sets:
            if isinstance(hashtag_set, list):
                normalized_sets.append([str(tag).strip() for tag in hashtag_set if str(tag).strip()])
            elif isinstance(hashtag_set, str) and hashtag_set.strip():
                normalized_sets.append([hashtag_set.strip()])
            else:
                normalized_sets.append([])
        return normalized_sets

    def _build_contract_from_gemini_output(
        self,
        gemini_output: dict,
        request: CampaignGenerateRequest,
        keywords: list[dict],
    ) -> dict:
        hoplink = str(request.affiliate_product.get("hoplink") or "")

        raw_content_pieces = gemini_output.get("content_pieces") if isinstance(gemini_output, dict) else []
        if not isinstance(raw_content_pieces, list):
            raw_content_pieces = []

        requested_platforms = [str(platform) for platform in request.platforms]
        allowed_platforms = set(requested_platforms)

        content_pieces: list[dict] = []
        for index, raw_piece in enumerate(raw_content_pieces):
            if not isinstance(raw_piece, dict):
                continue

            platform = str(raw_piece.get("platform") or "").strip()
            if not platform:
                continue
            if allowed_platforms and platform not in allowed_platforms:
                continue

            copy_payload = raw_piece.get("copy") if isinstance(raw_piece.get("copy"), dict) else {}
            media_payload = raw_piece.get("media") if isinstance(raw_piece.get("media"), dict) else {}
            cta_text = self._ensure_array(raw_piece.get("cta_text"), 3)
            hashtags = self._ensure_hashtag_sets(raw_piece.get("hashtags"), 3)
            hook = self._ensure_array(copy_payload.get("hook"), 3)
            headline = self._ensure_array(copy_payload.get("headline"), 3)
            body = self._ensure_array(copy_payload.get("body"), 3)
            caption = self._ensure_array(copy_payload.get("caption"), 3)
            subject_line = self._ensure_array(copy_payload.get("subject_line"), 3)
            script = self._ensure_array(copy_payload.get("script"), 3)
            image_prompt = self._ensure_array(media_payload.get("image_prompt"), 3)
            video_prompt = self._ensure_array(media_payload.get("video_prompt"), 3)
            thumbnail_prompt = self._ensure_array(media_payload.get("thumbnail_prompt"), 3)

            content_pieces.append(
                {
                    "piece_id": str(uuid4()),
                    "platform": platform,
                    "format": self._format_for_platform(platform),
                    "status": "draft",
                    "sequence_index": index,
                    "objective": raw_piece.get("objective"),
                    "cta_text": cta_text,
                    "cta_link": hoplink,
                    "hashtags": hashtags,
                    "copy": {
                        "hook": hook,
                        "headline": headline,
                        "body": body,
                        "caption": caption,
                        "subject_line": subject_line,
                        "script": script,
                    },
                    "media": {
                        "image_prompt": image_prompt,
                        "image_url": None,
                        "video_prompt": video_prompt,
                        "thumbnail_prompt": thumbnail_prompt,
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

        if not content_pieces:
            for index, platform in enumerate(requested_platforms):
                content_pieces.append(
                    {
                        "piece_id": str(uuid4()),
                        "platform": platform,
                        "format": self._format_for_platform(platform),
                        "status": "draft",
                        "sequence_index": index,
                        "objective": "Drive qualified clicks",
                        "cta_text": ["Learn More", "Get Started", "Shop Now"],
                        "cta_link": hoplink,
                        "hashtags": [[], [], []],
                        "copy": {
                            "hook": [None, None, None],
                            "headline": [None, None, None],
                            "body": [None, None, None],
                            "caption": [None, None, None],
                            "subject_line": [None, None, None],
                            "script": [None, None, None],
                        },
                        "media": {
                            "image_prompt": [None, None, None],
                            "image_url": None,
                            "video_prompt": [None, None, None],
                            "thumbnail_prompt": [None, None, None],
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

        tracking = {
            "base_hoplink": hoplink,
            "tracking_template": "{base}?utm_source={platform}&utm_medium=affiliate&utm_campaign=generated",
            "tracking_links": [
                {
                    "platform": platform,
                    "content_piece_id": next((cp["piece_id"] for cp in content_pieces if cp["platform"] == platform), None),
                    "final_url": f"{hoplink}?utm_source={platform.lower()}&utm_medium=affiliate&utm_campaign=generated",
                    "subid_map": {"variant": str(index + 1)},
                    "utm": {
                        "source": platform.lower(),
                        "medium": "affiliate",
                        "campaign": "generated_campaign",
                    },
                }
                for index, platform in enumerate(request.platforms)
            ],
            "attribution_model": "last_click",
        }

        tags_raw = gemini_output.get("tags") if isinstance(gemini_output, dict) else []
        tags = [str(tag).strip() for tag in tags_raw if str(tag).strip()] if isinstance(tags_raw, list) else []

        return {
            "name": (gemini_output.get("name") if isinstance(gemini_output, dict) else None) or f"{request.prompt[:60]} Campaign",
            "theme_color": (gemini_output.get("theme_color") if isinstance(gemini_output, dict) else None) or "#00C896",
            "platforms": request.platforms,
            "affiliate_product": request.affiliate_product,
            "audience": request.audience,
            "tracking": tracking,
            "scheduling": {
                "timezone": "UTC",
                "campaign_window": {
                    "start_at": None,
                    "end_at": None,
                    "cadence_default": "once",
                },
            },
            "metrics": self._default_metrics(),
            "content_pieces": content_pieces,
            "status": "draft",
            "is_used": False,
            "version": 1,
            "previous_version_id": None,
            "budget": {
                "daily_limit": None,
                "total_limit": None,
                "per_variant_limit": 10,
                "spent_to_date": 0,
                "currency": "USD",
            },
            "generation_config": {
                "topic": request.prompt,
                "keywords": [str(item.get("keyword")) for item in keywords if item.get("keyword")],
                "tone": "professional",
                "language": request.language,
                "num_variants": request.num_variants,
                "gemini_model": GEMINI_MODEL,
            },
            "tags": tags or ["generated", "affiliate", "ai"],
            "notes": (gemini_output.get("notes") if isinstance(gemini_output, dict) else None),
            "archive_reason": None,
            "deleted_at": None,
        }

    async def _fetch_keywords(self, topic: str) -> list[dict]:
        print(f"=== FETCHING KEYWORDS FOR: {topic} ===")
        if not settings.dataforseo_login or not settings.dataforseo_password:
            print("=== DATAFORSEO CREDENTIALS NOT SET — SKIPPING ===")
            return []

        endpoint = "https://api.dataforseo.com/v3/keywords_data/google/keywords_for_keywords/live"
        credentials = f"{settings.dataforseo_login}:{settings.dataforseo_password}".encode("utf-8")
        encoded_credentials = base64.b64encode(credentials).decode("utf-8")
        payload = json.dumps(
            [
                {
                    "keywords": [topic],
                    "language_code": "en",
                    "location_code": 2840,
                    "limit": 10
                }
            ]
        ).encode("utf-8")

        def _make_request() -> list[dict]:
            req = urllib_request.Request(
                endpoint,
                data=payload,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Basic {encoded_credentials}",
                },
                method="POST",
            )
            with urllib_request.urlopen(req, timeout=30) as response:
                body = response.read().decode("utf-8")

            parsed = json.loads(body)
            collected: list[dict] = []
            for task in parsed.get("tasks", []) or []:
                for result in task.get("result", []) or []:
                    keyword = result.get("keyword")
                    if not keyword:
                        continue
                    search_volume = int(result.get("search_volume") or 0)
                    competition = float(result.get("competition") or 0.0)
                    cpc = float(result.get("cpc") or 0.0)
                    collected.append(
                        {
                            "keyword": str(keyword),
                            "search_volume": search_volume,
                            "keyword_difficulty": int(competition * 100),
                            "cpc": cpc,
                        }
                    )

            collected.sort(key=lambda entry: entry.get("search_volume", 0), reverse=True)
            return collected[:10]

        try:
            keywords = await asyncio.to_thread(_make_request)
            print(f"=== DATAFORSEO KEYWORDS FETCHED: {keywords} ===")
            return keywords
        except Exception as exc:  # noqa: BLE001
            print(f"=== DATAFORSEO FAILED: {exc} ===")
            logger.warning("DataForSEO keyword fetch failed: %s", exc)
            return []

    @staticmethod
    def _build_keyword_context(keywords: list[dict]) -> str:
        if not keywords:
            return ""
        lines = ["High-opportunity keywords to use naturally in headlines, body, and CTAs:"]
        for item in keywords:
            keyword = str(item.get("keyword") or "").strip()
            if not keyword:
                continue
            search_volume = int(item.get("search_volume") or 0)
            keyword_difficulty = int(item.get("keyword_difficulty") or 0)
            cpc = float(item.get("cpc") or 0.0)
            lines.append(
                f'- "{keyword}" — volume: {search_volume:,} | difficulty: {keyword_difficulty} | cpc: ${cpc:.2f}'
            )
        return "\n".join(lines) if len(lines) > 1 else ""

    @staticmethod
    def _build_audience_context(audience: dict | None) -> str:
        if not isinstance(audience, dict) or not audience:
            return ""

        demographics = audience.get("demographics") if isinstance(audience.get("demographics"), dict) else {}
        region = audience.get("region") if isinstance(audience.get("region"), dict) else {}

        lines: list[str] = []

        age_range = demographics.get("age_range")
        if age_range and age_range not in {"Any", "All"}:
            lines.append(f"- Age range: {age_range}")

        gender_focus = demographics.get("gender_focus")
        if gender_focus and gender_focus not in {"Any", "All"}:
            lines.append(f"- Gender: {gender_focus}")

        interests = demographics.get("interests")
        if isinstance(interests, list):
            filtered_interests = [str(item).strip() for item in interests if str(item).strip()]
            if filtered_interests:
                lines.append(f"- Interests: {', '.join(filtered_interests)}")

        income_band = demographics.get("income_band")
        if income_band and income_band not in {"Any", "All"}:
            lines.append(f"- Income: {income_band}")

        countries = region.get("countries")
        if isinstance(countries, list):
            filtered_countries = [str(item).strip() for item in countries if str(item).strip()]
            if filtered_countries:
                lines.append(f"- Countries: {', '.join(filtered_countries)}")

        languages = region.get("languages")
        if isinstance(languages, list) and languages:
            primary_language = str(languages[0]).strip()
            if primary_language and primary_language not in {"Any", "All"}:
                lines.append(f"- Language: {primary_language}")

        if not lines:
            return ""

        return "Target audience — write copy that speaks directly to these people:\n" + "\n".join(lines)

    # Deterministic local payload for development and offline testing.
    def _build_mock_contract(self, request: CampaignGenerateRequest) -> dict:
        offer_name = str(request.affiliate_product.get("offer_name") or "Your Offer")

        def _mock_piece(platform: str) -> dict:
            lowered = platform.lower()
            prompt = request.prompt
            is_email = lowered == "email"
            is_video = lowered in {"youtube", "tiktok"}

            return {
                "platform": platform,
                "objective": "Drive qualified traffic with platform-native messaging",
                "cta_text": ["Learn More", "Shop Now", "Get Yours Today"],
                "hashtags": [
                    ["#affiliate", "#marketing", "#growth"],
                    ["#deal", "#offer", "#sale"],
                    ["#trending", "#viral", "#new"],
                ],
                "copy": {
                    "hook": [
                        f"Hook variant 1 for {prompt} on {platform}",
                        f"Hook variant 2 — different angle for {prompt}",
                        f"Hook variant 3 — urgent take on {prompt}",
                    ],
                    "headline": [
                        f"{offer_name} on {platform} — Variant 1",
                        f"Why {offer_name} is perfect for you — Variant 2",
                        f"Limited time: {offer_name} — Variant 3",
                    ],
                    "body": [
                        f"Body variant 1 for {prompt} on {platform} focused on practical benefits and easy next steps.",
                        f"Body variant 2 for {prompt} on {platform} built around social proof and credibility.",
                        f"Body variant 3 for {prompt} on {platform} using urgency and scarcity framing.",
                    ],
                    "caption": [
                        f"Caption variant 1 for {prompt} on {platform}",
                        f"Caption variant 2 — social proof angle for {prompt}",
                        f"Caption variant 3 — urgent angle for {prompt}",
                    ],
                    "subject_line": [
                        f"Subject variant 1 for {offer_name}",
                        f"Subject variant 2 — different angle for {offer_name}",
                        f"Subject variant 3 — urgent angle for {offer_name}",
                    ] if is_email else [None, None, None],
                    "script": [
                        f"Script variant 1 for {prompt} on {platform}",
                        f"Script variant 2 — social proof approach for {prompt}",
                        f"Script variant 3 — urgency close for {prompt}",
                    ] if is_video else [None, None, None],
                },
                "media": {
                    "image_prompt": [
                        f"Marketing visual variant 1 for {prompt} on {platform}",
                        f"Lifestyle shot variant 2 for {prompt}",
                        f"Product focus variant 3 for {prompt}",
                    ],
                    "video_prompt": [None, None, None],
                    "thumbnail_prompt": [
                        "Bold thumbnail variant 1",
                        "Minimal thumbnail variant 2",
                        "High contrast thumbnail variant 3",
                    ],
                    "image_url": None,
                },
            }

        creative_output = {
            "name": f"{offer_name} Growth Campaign",
            "theme_color": "#00C896",
            "tags": ["generated", "affiliate", "ai"],
            "notes": f"Mock creative strategy focused on performance messaging for {offer_name}.",
            "content_pieces": [_mock_piece(platform) for platform in request.platforms],
        }
        return self._build_contract_from_gemini_output(creative_output, request, [])

    # Production generation path with retry when JSON parse fails.
    async def _generate_with_gemini(self, request: CampaignGenerateRequest) -> dict:
        print("=== ENTERING GEMINI GENERATION ===")
        api_key = settings.gemini_api_key
        print(f"API KEY PRESENT: {bool(api_key)}")
        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Campaign generation failed: GEMINI_API_KEY is not configured.",
            )

        prompt_words = request.prompt.lower().split()
        filler = {'a', 'an', 'the', 'for', 'to', 'how', 'and', 'or', 'of', 'in', 'on', 'with', 'that', 'this', 'is', 'are', 'from'}
        meaningful_words = [w for w in prompt_words if w not in filler]

        interests = []
        if request.audience:
            interests = (request.audience.get("demographics") or {}).get("interests") or []
        seed = (
            interests[0] if interests
            else " ".join(meaningful_words[:2])
        )
        print(f"=== DATAFORSEO SEED KEYWORD: {seed} ===")
        keywords = await self._fetch_keywords(seed)

        commission_value = request.affiliate_product.get("commission", {}).get("value", 0)
        try:
            commission_percent = float(commission_value) * 100
        except (TypeError, ValueError):
            commission_percent = 0.0

        base_user_prompt = (
            "Generate creative marketing content for an affiliate campaign.\n\n"
            f"Product prompt: {request.prompt}\n"
            f"Target platforms: {json.dumps(request.platforms)}\n"
            f"Affiliate offer: {request.affiliate_product.get('offer_name', '')} by {request.affiliate_product.get('vendor', '')}\n"
            f"Affiliate link: {request.affiliate_product.get('hoplink', '')}\n\n"
            "Generate one content piece per platform listed above. Each piece must have copy tailored specifically for that platform's format and audience.\n\n"
            "For each content piece, generate exactly 3 genuinely different creative variations for every element (headlines, body copy, CTAs, hashtags, image prompts etc). "
            "Variations should have meaningfully different angles, tones, or approaches — not just minor wording changes. "
            "For example: variation 1 might focus on benefits, variation 2 on social proof, variation 3 on urgency/scarcity. "
            "Each array must contain exactly 3 items. Never return a single string where an array is expected.\n\n"
            "IMPORTANT: Never mention commission rates, affiliate percentages, earnings, or any financial/business details in the copy. "
            "Write all copy from the perspective of a genuine product recommendation. "
            "All copy must be consumer-facing, natural sounding, and focused purely on the product's benefits.\n\n"
            "Return ONLY a JSON object matching this exact schema:\n"
            f"{json.dumps(_creative_schema(), indent=2)}"
        )

        keyword_context = self._build_keyword_context(keywords)
        print(f"=== KEYWORD CONTEXT BEING INJECTED: '{keyword_context}' ===")
        if keyword_context:
            base_user_prompt += f"\n\n{keyword_context}"

        audience_context = self._build_audience_context(request.audience)
        if audience_context:
            base_user_prompt += f"\n\n{audience_context}"

        first_attempt = await self._call_gemini(api_key, base_user_prompt)
        parsed = self._try_parse_json(first_attempt)
        if parsed is not None:
            return self._build_contract_from_gemini_output(parsed, request, keywords)

        retry_prompt = base_user_prompt + "\nReturn raw JSON only. Do not include markdown, fences, comments, or prose."
        second_attempt = await self._call_gemini(api_key, retry_prompt)
        parsed_retry = self._try_parse_json(second_attempt)
        if parsed_retry is not None:
            return self._build_contract_from_gemini_output(parsed_retry, request, keywords)

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Campaign generation failed: Gemini returned invalid JSON after retry.",
        )

    # Raw Gemini API caller; returns response text field only.
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

    # Accept only JSON objects to match campaign contract expectations.
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
