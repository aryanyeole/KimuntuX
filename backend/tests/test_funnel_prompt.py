"""test_funnel_prompt.py — unit tests for the funnel prompt builder."""

from __future__ import annotations

from app.schemas.funnel import WizardInput
from app.services.funnel_prompt import build_generation_prompt

# ---------------------------------------------------------------------------
# Shared fixture
# ---------------------------------------------------------------------------

_BASE_INPUT = WizardInput(
    company_name="PeakFuel Nutrition",
    tagline="Fuel your peak",
    brand_voice="professional",
    short_description="Premium sports nutrition supplements for serious athletes.",
    industry="Health & Wellness",
    key_services=["Pre-workout supplements", "Protein powders", "Recovery drinks"],
    hero_headline="Unlock Your Athletic Potential",
    hero_subheadline="Science-backed nutrition for peak performance",
    primary_cta_text="Shop Now",
    main_goal="buy",
    include_features=True,
    include_services=True,
    include_about=True,
    include_testimonials=True,
    include_pricing=False,
    include_faq=False,
    include_contact=True,
    layout_style="modern",
    contact_email="hello@peakfuel.test",
    contact_phone="+1 555 000 1234",
    contact_location="Austin, TX",
    instagram_url="https://instagram.com/peakfuel",
    color_theme="#2563eb",
    font_style="sans",
)


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_build_generation_prompt_includes_all_wizard_fields():
    """Every non-empty wizard field must appear at least once in the user_prompt."""
    _, user_prompt = build_generation_prompt(_BASE_INPUT)

    assert "PeakFuel Nutrition" in user_prompt
    assert "Fuel your peak" in user_prompt
    assert "professional" in user_prompt.lower()
    assert "Health & Wellness" in user_prompt
    assert "Premium sports nutrition" in user_prompt
    assert "Pre-workout supplements" in user_prompt
    assert "Protein powders" in user_prompt
    assert "Recovery drinks" in user_prompt
    assert "Unlock Your Athletic Potential" in user_prompt
    assert "Science-backed nutrition" in user_prompt
    assert "Shop Now" in user_prompt
    assert "hello@peakfuel.test" in user_prompt
    assert "+1 555 000 1234" in user_prompt
    assert "Austin, TX" in user_prompt
    assert "instagram.com/peakfuel" in user_prompt


def test_system_prompt_forbids_scripts():
    """System prompt must explicitly forbid <script> tags / JavaScript."""
    system_prompt, _ = build_generation_prompt(_BASE_INPUT)

    lower = system_prompt.lower()
    # At least one clear prohibition on scripts/JS must be present
    assert "no <script>" in lower or "no javascript" in lower or "<script> tags" in lower


def test_system_prompt_includes_form_marker_instruction():
    """System prompt must instruct Claude to include the KIMUX_LEAD_FORM marker."""
    system_prompt, _ = build_generation_prompt(_BASE_INPUT)
    assert "KIMUX_LEAD_FORM" in system_prompt


def test_excluded_sections_not_requested_in_prompt():
    """Sections toggled off must not be requested in the user prompt."""
    # Create input with pricing and FAQ explicitly disabled
    no_pricing_input = WizardInput(
        company_name="Test Co",
        short_description="Test description",
        industry="Tech",
        key_services=["Software"],
        hero_headline="Test Headline",
        primary_cta_text="Start",
        include_features=True,
        include_services=False,
        include_about=False,
        include_testimonials=False,
        include_pricing=False,
        include_faq=False,
        include_contact=True,
        layout_style="modern",
    )

    with_pricing_input = no_pricing_input.model_copy(
        update={"include_pricing": True, "include_faq": True}
    )

    _, prompt_no_pricing = build_generation_prompt(no_pricing_input)
    _, prompt_with_pricing = build_generation_prompt(with_pricing_input)

    # "Pricing" section should appear MORE in the prompt that has it enabled
    count_no_pricing = prompt_no_pricing.lower().count("pricing")
    count_with_pricing = prompt_with_pricing.lower().count("pricing")
    assert count_with_pricing > count_no_pricing, (
        f"Pricing appears {count_with_pricing}x with include_pricing=True "
        f"but {count_no_pricing}x without — expected more mentions when enabled"
    )

    # FAQ similarly
    count_no_faq = prompt_no_pricing.lower().count("faq")
    count_with_faq = prompt_with_pricing.lower().count("faq")
    assert count_with_faq > count_no_faq


def test_generation_instruction_in_user_prompt():
    """User prompt must contain the final generation instruction."""
    _, user_prompt = build_generation_prompt(_BASE_INPUT)
    assert "Generate the complete HTML now" in user_prompt
    assert "KIMUX_LEAD_FORM" in user_prompt
