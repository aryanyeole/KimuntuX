from __future__ import annotations

import asyncio
import json
import logging
from urllib import error, request as urllib_request

from app.core.config import settings

logger = logging.getLogger(__name__)

AYRSHARE_API_URL = "https://app.ayrshare.com/api/post"

# Maps KimuX title-case platform labels to the lowercase identifiers Ayrshare
# expects. X (formerly Twitter) must map to "twitter" — Ayrshare has not
# updated their identifier yet. Update this table when they do.
PLATFORM_MAP: dict[str, str] = {
    "Email": "email",
    "Instagram": "instagram",
    "LinkedIn": "linkedin",
    "Facebook": "facebook",
    "X": "twitter",
    "YouTube": "youtube",
    "TikTok": "tiktok",
}


class AyrshareService:
    """
    Service for publishing campaign content pieces to social platforms via Ayrshare.

    Current state: skeleton for handoff. The Ayrshare API call in
    ``_call_ayrshare`` is commented out and guarded by a NotImplementedError.
    Everything else — payload construction, platform mapping, DB result format —
    is fully implemented and exercised in mock mode.

    Activation checklist (in order):
      1. Add AYRSHARE_API_KEY=<key> to backend/.env
      2. Connect your social accounts in the Ayrshare dashboard (app.ayrshare.com)
      3. Uncomment the request block inside ``_call_ayrshare`` and delete the
         NotImplementedError line below it.
      4. Verify the mock_result early-return in ``publish_content_piece`` is
         removed — it exits before reaching ``_call_ayrshare`` when no key is set,
         so once you set the key it will automatically route to the real path.

    Ayrshare docs: https://docs.ayrshare.com/rest-api/endpoints/post
    """

    async def publish_content_piece(self, piece: dict, campaign: dict) -> dict:
        """
        Publish a single content piece to its target platform via Ayrshare.

        Builds the Ayrshare request body, dispatches it, and returns a
        ``publish_result`` dict that the scheduler writes back into
        ``campaign.content_pieces[n]["publish_result"]`` in the database.

        This method never raises — all exceptions are caught and returned as a
        ``{"status": "failed", "error": "..."}`` dict so that a failure on one
        piece never aborts the scheduler loop for other pieces.

        Args:
            piece: One element from ``campaign.content_pieces``. Expected keys:
                   platform, copy, cta_text, cta_link, hashtags, media, schedule.
            campaign: The campaign record as a plain dict. Used for the fallback
                      tracking link if ``piece["cta_link"]`` is absent.

        Returns:
            Dict that is stored verbatim in ``piece["publish_result"]``. Shape:
              - On mock:    {"status": "mock_posted", "platform": ...,
                             "external_post_id": ..., "post_url": None, "note": ...}
              - On success: {"status": "posted", "platform": ...,
                             "external_post_id": ..., "post_url": ...,
                             "raw_response": {...}}
              - On failure: {"status": "failed", "platform": ..., "error": "..."}

        Mock mode:
            When AYRSHARE_API_KEY is not configured the method returns a mock
            result immediately without calling Ayrshare. This lets the full
            scheduler loop run in development without a live account.
        """
        platform = self._get_platform_name(piece.get("platform", ""))
        body = self._build_post_body(piece, campaign)

        if not settings.ayrshare_api_key:
            mock_result = {
                "status": "mock_posted",
                "platform": platform,
                "external_post_id": f"mock-{piece.get('piece_id', 'unknown')}-{platform}",
                "post_url": None,
                "note": (
                    "Mock publish — AYRSHARE_API_KEY not configured. "
                    "Set the key and activate _call_ayrshare for real posting."
                ),
            }
            logger.info(
                "Ayrshare mock publish — piece=%s platform=%s",
                piece.get("piece_id"),
                platform,
            )
            return mock_result

        try:
            result = await self._call_ayrshare(body)
            # Ayrshare returns either a top-level "id" for a single platform or a
            # "postIds" list for multi-platform posts. We always send one platform
            # at a time, so "id" is the expected field. "postIds" is the fallback.
            external_id = result.get("id") or (
                result.get("postIds", [{}])[0].get("id") if result.get("postIds") else None
            )
            post_url = result.get("postUrl") or (
                result.get("postUrls", [None])[0] if result.get("postUrls") else None
            )
            return {
                "status": "posted",
                "platform": platform,
                "external_post_id": external_id,
                "post_url": post_url,
                "raw_response": result,
            }
        except Exception as exc:
            logger.error(
                "Ayrshare publish failed — piece=%s platform=%s error=%s",
                piece.get("piece_id"),
                platform,
                exc,
            )
            return {
                "status": "failed",
                "platform": platform,
                "error": str(exc),
            }

    def _build_post_body(self, piece: dict, campaign: dict) -> dict:
        """
        Map a KimuX content piece to the Ayrshare ``/api/post`` request body.

        Copy field selection by platform:
          - Instagram, Facebook, X  → copy.caption  (visual-first, caption-driven)
          - Email                   → copy.body      (full email body text)
          - YouTube, TikTok         → copy.script    (scripted video narration)
          - All others              → copy.body, fallback to copy.caption

        Each copy field may be either a plain string (user selected a variant
        and it was flattened when saving to the scheduler) or still an array of
        3 variants (no selection was made). We take the first non-empty element
        in array cases.

        Hashtags are stored as a list of sets: ``[[tag, tag], [tag, tag], ...]``.
        We always use the first set (index 0), which corresponds to the user's
        default selection. If the field has already been flattened to a plain
        list of strings by the preview save, we use it directly.

        CTA link appended from ``piece["cta_link"]``, falling back to the
        campaign-level ``tracking.base_hoplink``.

        Media: ``piece.media.image_url`` is added to ``mediaUrls`` only if it
        is a real HTTP URL — image prompt strings are excluded.

        Schedule: ``piece.schedule.publish_at`` is forwarded as ``scheduleDate``
        if present. Ayrshare expects ISO-8601 UTC (e.g. "2024-06-01T14:00:00Z").

        Args:
            piece: Content piece dict from ``campaign.content_pieces``.
            campaign: Full campaign dict for fallback tracking link.

        Returns:
            Dict ready to be JSON-serialised and sent to Ayrshare.
        """
        platform_key = piece.get("platform", "")
        ayrshare_platform = self._get_platform_name(platform_key)
        lowered = platform_key.lower()

        copy = piece.get("copy") or {}

        def _resolve(value) -> str:
            """Return first non-empty string from a value that may be a list."""
            if isinstance(value, list):
                return next((str(v) for v in value if v), "") or ""
            return str(value or "")

        caption = _resolve(copy.get("caption"))
        body_text = _resolve(copy.get("body"))
        script = _resolve(copy.get("script"))

        if lowered in {"instagram", "facebook", "x"}:
            post_text = caption or body_text
        elif lowered == "email":
            post_text = body_text or caption
        elif lowered in {"youtube", "tiktok"}:
            post_text = script or body_text
        else:
            post_text = body_text or caption

        # Hashtags: stored as [[tag, tag], [tag, tag], [tag, tag]] (3 variant sets).
        # If already flattened (user saved a specific set), raw_hashtags is a
        # plain list of strings — use it directly.
        raw_hashtags = piece.get("hashtags") or []
        if raw_hashtags and isinstance(raw_hashtags[0], list):
            flat_hashtags = [str(h) for h in raw_hashtags[0] if h]
        else:
            flat_hashtags = [str(h) for h in raw_hashtags if h]

        if flat_hashtags:
            post_text = f"{post_text}\n\n{' '.join(flat_hashtags)}".strip()

        # CTA link: piece-level first, then campaign tracking fallback.
        cta_link = piece.get("cta_link") or (
            (campaign.get("tracking") or {}).get("base_hoplink") or ""
        )
        if cta_link:
            post_text = f"{post_text}\n\n{cta_link}".strip()

        # Only attach real image URLs, not prompt strings.
        media_urls: list[str] = []
        image_url = (piece.get("media") or {}).get("image_url") or ""
        if image_url.startswith("http"):
            media_urls.append(image_url)

        # publish_at from the piece's own schedule (may be None if not yet set).
        schedule_date = (piece.get("schedule") or {}).get("publish_at")

        post_body: dict = {
            "post": post_text,
            "platforms": [ayrshare_platform],
        }

        if media_urls:
            post_body["mediaUrls"] = media_urls

        if schedule_date:
            post_body["scheduleDate"] = str(schedule_date)

        return post_body

    async def _call_ayrshare(self, body: dict) -> dict:
        """
        POST to the Ayrshare ``/api/post`` endpoint and return the parsed response.

        Uses the same stdlib urllib pattern as ``campaign_generator.py`` — no
        additional HTTP library dependency.

        Auth: Bearer token from ``settings.ayrshare_api_key`` (env var
        ``AYRSHARE_API_KEY``). Ayrshare uses a single API key per profile.
        For multi-profile setups (one per tenant) you would pass a
        ``profileKey`` field in the request body — see Ayrshare docs.

        Error codes to know:
          - HTTP 400 / code 190: expired or invalid API key
          - HTTP 400 / code 270: the platform account is not connected
          - HTTP 429:            rate limit hit — back off and retry

        Raises:
            RuntimeError: Wraps any HTTP error or JSON parse failure so the
                          caller (``publish_content_piece``) can handle it
                          uniformly without distinguishing network vs API errors.

        TODO: ACTIVATE FOR HANDOFF — uncomment the block below, then delete the
        NotImplementedError line. No other changes needed.
        """
        # TODO: ACTIVATE FOR HANDOFF
        # ── Uncomment this entire block to enable real Ayrshare publishing ────
        #
        # api_key = settings.ayrshare_api_key
        # request_data = json.dumps(body).encode("utf-8")
        #
        # def _make_request() -> dict:
        #     req = urllib_request.Request(
        #         AYRSHARE_API_URL,
        #         data=request_data,
        #         headers={
        #             "Content-Type": "application/json",
        #             "Authorization": f"Bearer {api_key}",
        #         },
        #         method="POST",
        #     )
        #     try:
        #         with urllib_request.urlopen(req, timeout=30) as response:
        #             response_body = response.read().decode("utf-8")
        #     except error.HTTPError as exc:
        #         error_body = exc.read().decode("utf-8", errors="ignore")
        #         raise RuntimeError(
        #             f"Ayrshare API HTTP {exc.code}: {error_body or exc.reason}"
        #         ) from exc
        #     except error.URLError as exc:
        #         raise RuntimeError(
        #             f"Ayrshare API request error: {exc.reason}"
        #         ) from exc
        #     try:
        #         return json.loads(response_body)
        #     except Exception as exc:
        #         raise RuntimeError(
        #             "Could not parse Ayrshare API response"
        #         ) from exc
        #
        # return await asyncio.to_thread(_make_request)
        # ── End of block ──────────────────────────────────────────────────────

        raise NotImplementedError(
            "_call_ayrshare is not yet activated. "
            "Set AYRSHARE_API_KEY in .env and uncomment the request block in this method."
        )

    def _get_platform_name(self, platform: str) -> str:
        """
        Map a KimuX platform label to the Ayrshare platform identifier.

        KimuX uses title-case labels (e.g. "Instagram", "X"); Ayrshare expects
        lowercase slugs. Unknown platforms are lower-cased and passed through so
        that new platforms added to KimuX do not silently break publishing.

        Gotcha: X (formerly Twitter) maps to "twitter" — Ayrshare has not
        renamed their identifier yet. If Ayrshare ever updates it, change the
        entry in the PLATFORM_MAP dict at the top of this file.

        Args:
            platform: KimuX platform label, e.g. "Instagram", "X", "YouTube".

        Returns:
            Ayrshare platform identifier, e.g. "instagram", "twitter", "youtube".
        """
        return PLATFORM_MAP.get(platform, platform.lower())
