"""anthropic_client.py — thin wrapper around the Anthropic Messages API.

Single responsibility: take a system prompt + user prompt, stream the
response, extract HTML, return a structured result dict.  No business
logic, no prompt building — those live in funnel_prompt.py.
"""
from __future__ import annotations

import logging
import re

from app.core.config import settings

log = logging.getLogger(__name__)


# ── Exceptions ────────────────────────────────────────────────────────────────

class AnthropicError(Exception):
    """Base for all Anthropic integration errors."""


class AnthropicNotConfigured(AnthropicError):
    """Raised when ANTHROPIC_API_KEY is not configured."""


class AnthropicRateLimited(AnthropicError):
    """Raised on 429 rate-limit responses."""


class AnthropicTimeout(AnthropicError):
    """Raised when the request times out."""


class AnthropicAuthError(AnthropicError):
    """Raised on 401 authentication errors."""


class AnthropicServerError(AnthropicError):
    """Raised on 5xx server errors from Anthropic."""


class AnthropicInsufficientCredits(AnthropicError):
    """Anthropic returned a 400 indicating the account is out of credits.

    Treated as an operational error (eligible for static-template fallback),
    not a configuration bug.  Distinct from other 400 errors (e.g. malformed
    prompt) which should surface as failures so engineers can fix them.
    """


# ── Client ────────────────────────────────────────────────────────────────────

class AnthropicClient:
    """Narrow Anthropic Messages API wrapper for funnel HTML generation.

    Instantiate per-call — there is no expensive state to share, and
    instantiation-time validation ensures the key is always present.
    """

    def __init__(self) -> None:
        if not settings.anthropic_api_key:
            raise AnthropicNotConfigured(
                "ANTHROPIC_API_KEY is not set. "
                "Funnel generation will fall back to static templates."
            )
        import anthropic  # imported lazily so the module loads without the package installed
        self._client = anthropic.Anthropic(
            api_key=settings.anthropic_api_key,
            timeout=90.0,
        )

    def generate_html(
        self,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 16000,
        model: str = "claude-sonnet-4-5",
    ) -> dict:
        """Stream a response from Claude and return structured HTML result.

        Returns:
            {
                "html":          str   — extracted HTML (may be the full raw_text if
                                         extraction heuristics find no fenced block),
                "model":         str   — model ID echoed back,
                "input_tokens":  int,
                "output_tokens": int,
                "stop_reason":   str   — "end_turn", "max_tokens", etc.,
                "raw_text":      str   — full streamed response before HTML extraction,
            }

        Raises AnthropicRateLimited, AnthropicTimeout, AnthropicAuthError, or
        AnthropicServerError for known API failure modes.  Unexpected exceptions
        propagate as-is so callers can decide whether to fallback or fail.
        """
        import anthropic

        try:
            text_chunks: list[str] = []
            input_tokens = 0
            output_tokens = 0
            stop_reason = "end_turn"

            with self._client.messages.stream(
                model=model,
                max_tokens=max_tokens,
                system=system_prompt,
                messages=[{"role": "user", "content": user_prompt}],
            ) as stream:
                for chunk in stream.text_stream:
                    text_chunks.append(chunk)

                final = stream.get_final_message()
                input_tokens = final.usage.input_tokens
                output_tokens = final.usage.output_tokens
                stop_reason = final.stop_reason or "end_turn"

            raw_text = "".join(text_chunks)
            html = _extract_html(raw_text)

            log.info(
                "Anthropic generation complete: model=%s in=%d out=%d stop=%s",
                model, input_tokens, output_tokens, stop_reason,
            )

            return {
                "html": html,
                "model": model,
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "stop_reason": stop_reason,
                "raw_text": raw_text,
            }

        except anthropic.BadRequestError as exc:
            raise _classify_bad_request(exc) from exc
        except anthropic.RateLimitError as exc:
            raise AnthropicRateLimited(f"Rate limited by Anthropic: {exc}") from exc
        except anthropic.APITimeoutError as exc:
            raise AnthropicTimeout(f"Anthropic request timed out: {exc}") from exc
        except anthropic.AuthenticationError as exc:
            # Scrub any potential key reference from the message before logging
            raise AnthropicAuthError("Anthropic authentication failed — check ANTHROPIC_API_KEY") from exc
        except anthropic.InternalServerError as exc:
            raise AnthropicServerError(f"Anthropic server error: {exc}") from exc


# ── Bad-request classifier ────────────────────────────────────────────────────

def _classify_bad_request(exc: Exception) -> AnthropicError:
    """Map a BadRequestError to the most specific AnthropicError subclass.

    Only the "credit balance too low" message is classified as
    AnthropicInsufficientCredits — an operational condition eligible for
    static-template fallback.  All other 400s (malformed prompt, bad
    parameter, etc.) become the generic AnthropicError base class so they
    surface as funnel failures and get investigated.

    Uses a conservative substring match: "credit balance" is specific enough
    to avoid false positives while covering minor wording variations.
    """
    if "credit balance" in str(exc).lower():
        return AnthropicInsufficientCredits(str(exc))
    return AnthropicError(f"Anthropic bad request: {exc}")


# ── HTML extraction helper ────────────────────────────────────────────────────

def _extract_html(raw_text: str) -> str:
    """Extract the HTML document from model output.

    Priority order:
    1. ```html ... ``` fenced code block — most reliable signal.
    2. <!DOCTYPE html> or <html onwards — strips any preamble text.
    3. Raw text fallback — let the caller validate and decide.
    """
    # 1. Fenced block
    fence_match = re.search(r"```html\s*\n([\s\S]*?)\n```", raw_text, re.IGNORECASE)
    if fence_match:
        return fence_match.group(1).strip()

    # 2. DOCTYPE / <html tag
    lower = raw_text.lower()
    for marker in ("<!doctype html>", "<html"):
        idx = lower.find(marker)
        if idx != -1:
            return raw_text[idx:].strip()

    # 3. Return as-is; caller's validation step will catch missing markers
    return raw_text.strip()
