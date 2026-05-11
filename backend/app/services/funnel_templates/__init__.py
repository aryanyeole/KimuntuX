"""funnel_templates — static HTML template fallback for funnel generation.

Used when ANTHROPIC_API_KEY is absent, FUNNEL_FALLBACK_ONLY=true, or the
Anthropic call fails with a known operational error (rate limit, timeout, etc.).

Templates use Jinja2 syntax (available as a transitive dep from Starlette).
Section visibility is controlled via CSS display:none injected by the template
based on the include_* boolean flags so the HTML is always structurally valid.
"""
from __future__ import annotations

import os
from datetime import datetime, timezone

from jinja2 import Environment, FileSystemLoader, Undefined, select_autoescape

from app.schemas.funnel import WizardInput

_TEMPLATES_DIR = os.path.dirname(__file__)

# ── Silent Undefined: missing template vars render as "" instead of raising ───


class _SilentUndefined(Undefined):
    """Jinja2 Undefined subclass that silently falls back to empty string."""

    def __str__(self) -> str:
        return ""

    def __iter__(self):
        return iter([])

    def __bool__(self) -> bool:
        return False


# ── Jinja2 environment ────────────────────────────────────────────────────────

_env = Environment(
    loader=FileSystemLoader(_TEMPLATES_DIR),
    autoescape=select_autoescape(["html"]),
    undefined=_SilentUndefined,
)

# ── Layout → template mapping ─────────────────────────────────────────────────

_LAYOUT_TO_TEMPLATE: dict[str, str] = {
    "minimal": "minimal.html",
    "modern":  "modern.html",
    "bold":    "bold.html",
    # "playful" is not yet a distinct template in V1; maps to modern.
    # A dedicated playful template will be added in Phase 5 polish.
    "playful": "modern.html",
}

# ── Color theme → accent hex ──────────────────────────────────────────────────

_COLOUR_TO_HEX: dict[str, str] = {
    "#2563eb": "#2563eb",   # Blue (stored as hex by the wizard)
    "#10b981": "#10b981",   # Green / Teal
    "#8b5cf6": "#8b5cf6",   # Purple
    "#f97316": "#f97316",   # Orange
    "#1f2937": "#1f2937",   # Monochrome / Dark
    "auto":    "#10b981",   # Sensible default: teal/green
    # Single-word aliases for robustness
    "blue":       "#2563eb",
    "green":      "#10b981",
    "purple":     "#8b5cf6",
    "orange":     "#f97316",
    "monochrome": "#1f2937",
}


def _resolve_accent(color_theme: str) -> str:
    return _COLOUR_TO_HEX.get(color_theme, "#10b981")


# ── Public API ────────────────────────────────────────────────────────────────

def render_fallback_html(wizard_input: WizardInput) -> str:
    """Render a static HTML template from the wizard input.

    Maps layout_style → template file and color_theme → accent hex.
    None / missing optional fields are coerced to empty strings so no
    literal "None" ever appears in the rendered output.
    """
    template_name = _LAYOUT_TO_TEMPLATE.get(wizard_input.layout_style, "modern.html")
    template = _env.get_template(template_name)

    key_services_list = wizard_input.key_services or []

    social_links = bool(
        wizard_input.instagram_url
        or wizard_input.linkedin_url
        or wizard_input.twitter_url
        or wizard_input.facebook_url
    )

    context = {
        # Brand
        "company_name":      wizard_input.company_name,
        "tagline":           wizard_input.tagline or "",
        "brand_voice":       wizard_input.brand_voice,
        # Business
        "short_description": wizard_input.short_description,
        "about_us":          wizard_input.about_us or "",
        "industry":          wizard_input.industry,
        "key_services_list": key_services_list,
        # Hero
        "hero_headline":     wizard_input.hero_headline,
        "hero_subheadline":  wizard_input.hero_subheadline or "",
        "primary_cta_text":  wizard_input.primary_cta_text,
        # Section toggles — used by template CSS display:none rules
        "include_features":     wizard_input.include_features,
        "include_services":     wizard_input.include_services,
        "include_about":        wizard_input.include_about,
        "include_testimonials": wizard_input.include_testimonials,
        "include_pricing":      wizard_input.include_pricing,
        "include_faq":          wizard_input.include_faq,
        "include_contact":      wizard_input.include_contact,
        # Contact
        "contact_email":    wizard_input.contact_email or "",
        "contact_phone":    wizard_input.contact_phone or "",
        "contact_location": wizard_input.contact_location or "",
        # Social
        "instagram_url":    wizard_input.instagram_url or "",
        "linkedin_url":     wizard_input.linkedin_url or "",
        "twitter_url":      wizard_input.twitter_url or "",
        "facebook_url":     wizard_input.facebook_url or "",
        "social_links":     social_links,
        # Visual
        "accent_color": _resolve_accent(wizard_input.color_theme),
        # Form
        "form_action":  "#",
        # Misc
        "current_year": datetime.now(timezone.utc).year,
    }

    return template.render(**context)
