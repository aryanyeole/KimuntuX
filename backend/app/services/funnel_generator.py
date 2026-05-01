"""funnel_generator.py — async background task for funnel HTML generation.

FB3: real Claude (Anthropic) generation with static-template fallback.

Generation path selection (in priority order):
  1. FUNNEL_FALLBACK_ONLY=true          → always use fallback template
  2. ANTHROPIC_API_KEY missing          → fallback + log INFO
  3. AnthropicError (rate limit etc.)   → fallback + log WARNING
  4. HTML validation fails              → fallback + log WARNING
  5. All checks pass                    → mark_ready with AI HTML
  6. Unexpected non-Anthropic exception → mark_failed (NOT silent fallback,
                                          because silent fallback masks bugs)

The synchronous Anthropic call is offloaded to a thread pool via
asyncio.to_thread so it doesn't block the event loop during streaming.
"""
from __future__ import annotations

import asyncio
import logging
import time
from datetime import datetime, timezone

from app.core.config import settings
from app.core.database import SessionLocal
from app.integrations.anthropic_client import (
    AnthropicClient,
    AnthropicError,
    AnthropicInsufficientCredits,
    AnthropicNotConfigured,
    AnthropicRateLimited,
    AnthropicServerError,
    AnthropicTimeout,
)
from app.schemas.funnel import WizardInput
from app.services import funnel_service
from app.services.funnel_prompt import build_generation_prompt
from app.services.funnel_templates import render_fallback_html

log = logging.getLogger(__name__)

_KIMUX_MARKER = "KIMUX_LEAD_FORM"


# ── HTML validation ───────────────────────────────────────────────────────────

def _validate_html(html: str) -> tuple[bool, str]:
    """Return (ok, reason) for the generated HTML.

    Checks:
    - Non-empty string
    - Contains an HTML document marker (<html or <!DOCTYPE)
    - Contains the KIMUX_LEAD_FORM marker that FB5 rewrites
    """
    if not html or not html.strip():
        return False, "empty response"
    lower = html.lower()
    if "<html" not in lower and "<!doctype" not in lower:
        return False, "no <html> or <!DOCTYPE> found in output"
    if _KIMUX_MARKER not in html:
        return False, f"missing {_KIMUX_MARKER} marker — form action cannot be wired by FB5"
    return True, "ok"


# ── Anthropic generation (synchronous, runs in thread pool) ──────────────────

def _run_anthropic(wizard_input: WizardInput) -> dict:
    """Call Anthropic synchronously.  Designed to run in asyncio.to_thread."""
    system_prompt, user_prompt = build_generation_prompt(wizard_input)
    client = AnthropicClient()
    return client.generate_html(system_prompt, user_prompt)


# ── Main async background task ────────────────────────────────────────────────

async def generate_funnel_async(funnel_id: str, tenant_id: str) -> None:
    """Background task: generate funnel HTML via Anthropic or static fallback.

    Opens its own DB session — must not receive the request session, which
    is closed before background tasks run in production.
    """
    db = SessionLocal()
    try:
        # Step 1 — mark as generating
        funnel = funnel_service.mark_generating(db, tenant_id, funnel_id)
        if funnel is None:
            log.warning("generate_funnel_async: funnel %s not found (tenant=%s)", funnel_id, tenant_id)
            return

        wizard_input_dict = funnel.wizard_input or {}
        wizard_input = WizardInput(**wizard_input_dict)
        t_start = time.monotonic()

        # ── Step 2 — decide path ──────────────────────────────────────────────
        use_fallback = False
        fallback_reason = ""

        if settings.funnel_fallback_only:
            use_fallback = True
            fallback_reason = "forced"
            log.info("Funnel %s: FUNNEL_FALLBACK_ONLY=true, using static template", funnel_id)

        elif not settings.anthropic_api_key:
            use_fallback = True
            fallback_reason = "missing_key"
            log.info(
                "Funnel %s: ANTHROPIC_API_KEY not set, using static template fallback",
                funnel_id,
            )

        if not use_fallback:
            # ── Anthropic path ─────────────────────────────────────────────────
            try:
                result = await asyncio.to_thread(_run_anthropic, wizard_input)
                html = result["html"]

                ok, reason = _validate_html(html)
                if ok:
                    generation_seconds = round(time.monotonic() - t_start, 2)
                    metadata = {
                        "model_used":         result["model"],
                        "input_tokens":       result["input_tokens"],
                        "output_tokens":      result["output_tokens"],
                        "generation_seconds": generation_seconds,
                        "generated_at":       datetime.now(timezone.utc).isoformat(),
                        "source":             "anthropic",
                        "stop_reason":        result.get("stop_reason", "end_turn"),
                    }
                    funnel_service.mark_ready(db, tenant_id, funnel_id, html, metadata)
                    log.info(
                        "Funnel %s ready: source=anthropic model=%s in=%d out=%d seconds=%.1f",
                        funnel_id, result["model"],
                        result["input_tokens"], result["output_tokens"],
                        generation_seconds,
                    )
                    return

                # Validation failed — fall through to template
                log.warning(
                    "Funnel %s: Anthropic HTML failed validation (%s) — falling back to template",
                    funnel_id, reason,
                )
                use_fallback = True
                fallback_reason = "validation_failed"

            except AnthropicInsufficientCredits as exc:
                # Credits depleted — operational condition, use static template
                log.warning(
                    "Funnel %s: Anthropic credits exhausted, falling back to static "
                    "template. Top up at console.anthropic.com.",
                    funnel_id,
                )
                use_fallback = True
                fallback_reason = "insufficient_credits"

            except (AnthropicRateLimited, AnthropicTimeout, AnthropicServerError) as exc:
                # Transient operational failures — safe to fall back
                log.warning(
                    "Funnel %s: Anthropic transient error (%s: %s) — falling back to template",
                    funnel_id, type(exc).__name__, exc,
                )
                use_fallback = True
                fallback_reason = "api_error"

            except AnthropicNotConfigured:
                # Defensive — key check above should prevent this
                use_fallback = True
                fallback_reason = "missing_key"

            except AnthropicError as exc:
                # Remaining AnthropicErrors — generic bad request (malformed prompt,
                # bad parameter, auth error, etc.) are NOT silently fallback-eligible;
                # they indicate a config or code bug that engineers must fix.
                log.error(
                    "Funnel %s: Anthropic API error (%s: %s) — marking failed",
                    funnel_id, type(exc).__name__, exc,
                )
                funnel_service.mark_failed(db, tenant_id, funnel_id, str(exc))
                return

            except Exception:
                # Unknown error — do NOT silently fall back; this masks real bugs
                log.exception("Funnel %s: unexpected error during Anthropic generation", funnel_id)
                funnel_service.mark_failed(db, tenant_id, funnel_id, "Unexpected generation error — check server logs")
                return

        # ── Fallback path ─────────────────────────────────────────────────────
        if use_fallback:
            try:
                html = render_fallback_html(wizard_input)
                generation_seconds = round(time.monotonic() - t_start, 2)
                metadata = {
                    "model_used":         "fallback-template",
                    "input_tokens":       0,
                    "output_tokens":      0,
                    "tokens_used":        0,
                    "generation_seconds": generation_seconds,
                    "generated_at":       datetime.now(timezone.utc).isoformat(),
                    "source":             "fallback",
                    "fallback_reason":    fallback_reason,
                }
                funnel_service.mark_ready(db, tenant_id, funnel_id, html, metadata)
                log.info(
                    "Funnel %s ready: source=fallback reason=%s seconds=%.3f",
                    funnel_id, fallback_reason, generation_seconds,
                )
            except Exception:
                log.exception("Funnel %s: fallback template render failed", funnel_id)
                funnel_service.mark_failed(db, tenant_id, funnel_id, "Template render failed — check server logs")

    except Exception:
        log.exception("Funnel %s: unhandled exception in generate_funnel_async", funnel_id)
        try:
            funnel_service.mark_failed(db, tenant_id, funnel_id, "Unhandled generation error — check server logs")
        except Exception:
            pass
    finally:
        db.close()
