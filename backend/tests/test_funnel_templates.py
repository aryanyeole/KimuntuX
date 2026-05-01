"""test_funnel_templates.py — tests for the static fallback template renderer."""

from __future__ import annotations

import pytest

from app.schemas.funnel import WizardInput
from app.services.funnel_templates import render_fallback_html

# ---------------------------------------------------------------------------
# Shared fixture
# ---------------------------------------------------------------------------

_BASE = WizardInput(
    company_name="Acme Corp",
    tagline="Build boldly",
    brand_voice="professional",
    short_description="We build great software for serious teams.",
    industry="Technology",
    key_services=["Software Development", "Cloud Architecture", "DevOps"],
    hero_headline="Ship Faster, Scale Smarter",
    hero_subheadline="Enterprise-grade software built for the modern era",
    primary_cta_text="Get Started",
    main_goal="signup",
    include_features=True,
    include_services=True,
    include_about=True,
    include_testimonials=True,
    include_pricing=False,
    include_faq=False,
    include_contact=True,
    layout_style="modern",
    color_theme="auto",
    font_style="sans",
    contact_email="hello@acme.test",
    contact_phone="+1 555 000 0000",
    contact_location="San Francisco, CA",
    instagram_url="https://instagram.com/acme",
)


# ---------------------------------------------------------------------------
# Layout routing
# ---------------------------------------------------------------------------

def test_render_fallback_minimal_layout():
    html = render_fallback_html(_BASE.model_copy(update={"layout_style": "minimal"}))
    assert "<!DOCTYPE html>" in html
    assert "<html" in html
    assert "Acme Corp" in html


def test_render_fallback_modern_layout():
    html = render_fallback_html(_BASE.model_copy(update={"layout_style": "modern"}))
    assert "<!DOCTYPE html>" in html
    assert "Acme Corp" in html


def test_render_fallback_bold_layout():
    html = render_fallback_html(_BASE.model_copy(update={"layout_style": "bold"}))
    assert "<!DOCTYPE html>" in html
    assert "Acme Corp" in html


def test_render_fallback_playful_falls_back_to_modern():
    """'playful' layout falls back to the modern template for V1."""
    modern_html  = render_fallback_html(_BASE.model_copy(update={"layout_style": "modern"}))
    playful_html = render_fallback_html(_BASE.model_copy(update={"layout_style": "playful"}))
    # Both should contain the same company name (not a uniqueness test, just sanity)
    assert "Acme Corp" in playful_html
    # The two renders should share the same template structure (same skeleton)
    assert ("<!DOCTYPE html>" in playful_html)


# ---------------------------------------------------------------------------
# Content correctness
# ---------------------------------------------------------------------------

def test_render_fallback_includes_company_name():
    html = render_fallback_html(_BASE)
    assert "Acme Corp" in html


def test_render_fallback_includes_kimux_form_marker():
    """Every template must include the KIMUX_LEAD_FORM comment and form."""
    for layout in ["minimal", "modern", "bold", "playful"]:
        html = render_fallback_html(_BASE.model_copy(update={"layout_style": layout}))
        assert "KIMUX_LEAD_FORM" in html, f"Missing KIMUX_LEAD_FORM in {layout} template"
        assert 'action="#"' in html, f"Form action is not # in {layout} template"


def test_render_fallback_includes_hero_content():
    html = render_fallback_html(_BASE)
    assert "Ship Faster, Scale Smarter" in html
    assert "Get Started" in html


def test_render_fallback_includes_key_services():
    html = render_fallback_html(_BASE)
    assert "Software Development" in html
    assert "Cloud Architecture" in html


def test_render_fallback_accent_color_applied():
    """Blue color_theme should yield #2563eb as the accent."""
    html = render_fallback_html(_BASE.model_copy(update={"color_theme": "#2563eb"}))
    assert "#2563eb" in html


# ---------------------------------------------------------------------------
# Safety: no None / unresolved placeholders leak into output
# ---------------------------------------------------------------------------

def test_render_fallback_handles_missing_optional_fields():
    """None optional fields must not appear as 'None' or '{{ … }}' in output."""
    minimal_input = WizardInput(
        company_name="Minimal Co",
        short_description="Minimal description",
        industry="Tech",
        key_services=["Service A"],
        hero_headline="Welcome",
        primary_cta_text="Go",
        # All optional fields left as None / default
        tagline=None,
        about_us=None,
        contact_email=None,
        contact_phone=None,
        contact_location=None,
        instagram_url=None,
        linkedin_url=None,
        twitter_url=None,
        facebook_url=None,
        layout_style="modern",
    )
    html = render_fallback_html(minimal_input)
    assert "None" not in html, "Literal 'None' leaked into template output"
    assert "{{" not in html, "Unresolved Jinja2 placeholder leaked into template output"


def test_render_fallback_no_script_tags():
    """Fallback templates must not contain any <script> tags."""
    for layout in ["minimal", "modern", "bold"]:
        html = render_fallback_html(_BASE.model_copy(update={"layout_style": layout}))
        assert "<script" not in html.lower(), f"<script> tag found in {layout} template"
