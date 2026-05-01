"""funnel_prompt.py — prompt engineering for Claude-based funnel generation.

Builds the (system_prompt, user_prompt) pair that drives Claude Sonnet 4.5.
Inspired structurally by the KimuntuPro reference generator, adapted for
KimuX constraints: no <script> tags, KIMUX_LEAD_FORM marker, action="#".
"""
from __future__ import annotations

from app.schemas.funnel import WizardInput


# ── System prompt ─────────────────────────────────────────────────────────────

_SYSTEM_PROMPT = """You are an expert web designer and developer specialising in creating beautiful, modern, responsive business landing pages.

Your task is to generate a complete, production-ready HTML landing page based on the user's specifications.

## Output contract

- Output ONE complete self-contained HTML5 document.
- All CSS must be inline inside a <style> tag in the <head>. No external stylesheets, no CDN links.
- **NO <script> tags whatsoever.** No JavaScript at all in V1. The page must be 100% static HTML + CSS.
- No external image URLs. Use CSS gradients, SVG shapes inline, or solid colour blocks for visuals.
- The HTML must render correctly when opened directly in a browser with no internet connection.
- Wrap your entire output in ```html ... ``` fences. Start the fenced block with <!DOCTYPE html>.

## Lead-capture form rule (MANDATORY)

Include exactly ONE lead-capture form on the page. It MUST:
1. Have the following HTML comment immediately above the opening <form> tag (exact text, no changes):
   <!-- KIMUX_LEAD_FORM: action will be replaced by FB5 -->
2. Have attribute action="#" on the <form> tag.
3. Contain three fields: name (type=text, required), email (type=email, required), message (textarea, optional).
4. Have a submit button whose visible text matches the wizard's primary_cta_text.
5. No JavaScript — pure HTML form POST.

## Design guidelines

- Modern, professional aesthetic (think Apple, Stripe, Linear — clean, high-contrast, purposeful whitespace).
- Mobile-first responsive layout using flexbox and CSS grid. Include a viewport meta tag.
- Accessible: semantic HTML5 tags (header, nav, main, section, article, footer), sufficient colour contrast (WCAG AA), descriptive aria-labels where helpful.
- Use CSS custom properties (variables) for brand colours and spacing to keep the stylesheet consistent.
- Sticky navigation bar.
- Smooth CSS transitions on hover states (no JavaScript animations).
- High-quality generated copy — realistic, professional, specific to the business. No Lorem Ipsum.
- Use web-safe or system fonts only: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif.

## Section guidelines

- Hero section is always included: large headline, supporting subheadline, prominent CTA button.
- Include ONLY the sections the user explicitly requested (listed in the user prompt).
- Features/Services: grid layout (2–3 columns), benefit-focused copy.
- About: company story, mission, 150+ words.
- Testimonials: 3–4 realistic testimonials with names, titles, companies.
- FAQ: 4–6 Q&A pairs rendered as an accordion using CSS only (no JS).
- Contact: the mandatory KIMUX lead-capture form described above.
- Footer: copyright, navigation links, social links if provided.

## Length

Aim for 1500–3500 lines of high-quality HTML. Quality and completeness over brevity.
Do NOT truncate or abbreviate. Every included section must be fully implemented.

## Final reminders (repeat these at generation time)

REMEMBER before you close your output:
- No <script> tags anywhere in the document.
- The KIMUX_LEAD_FORM comment must appear immediately before the <form> tag.
- The <form> must have action="#".
- Close all HTML tags properly. End with </body></html>.
"""


# ── User prompt builder ───────────────────────────────────────────────────────

def build_generation_prompt(wizard_input: WizardInput) -> tuple[str, str]:
    """Return (system_prompt, user_prompt) for Claude funnel generation.

    The system prompt is constant; the user prompt encodes all wizard fields
    in a clean labeled format (NOT a JSON dump) so Claude can read it naturally.
    """
    lines: list[str] = []

    # ── Brand Basics ──────────────────────────────────────────────────────────
    lines.append("## Brand Basics")
    lines.append(f"Company Name: {wizard_input.company_name}")
    if wizard_input.tagline:
        lines.append(f"Tagline: {wizard_input.tagline}")
    lines.append(f"Brand Voice: {wizard_input.brand_voice}")

    # ── Business Overview ─────────────────────────────────────────────────────
    lines.append("\n## Business Overview")
    lines.append(f"Industry: {wizard_input.industry}")
    lines.append(f"Short Description: {wizard_input.short_description}")
    if wizard_input.about_us:
        lines.append(f"About Us: {wizard_input.about_us}")
    if wizard_input.key_services:
        lines.append("Key Services:")
        for i, svc in enumerate(wizard_input.key_services, 1):
            lines.append(f"  {i}. {svc}")

    # ── Hero / CTA ────────────────────────────────────────────────────────────
    lines.append("\n## Hero Section")
    lines.append(f"Headline: {wizard_input.hero_headline}")
    if wizard_input.hero_subheadline:
        lines.append(f"Subheadline: {wizard_input.hero_subheadline}")
    lines.append(f"Primary CTA Button Text: {wizard_input.primary_cta_text}")
    _goal_labels = {
        "consult":    "Book a consultation",
        "buy":        "Purchase product/service",
        "signup":     "Sign up / register",
        "contact":    "Contact us",
        "learn_more": "Learn more about the offering",
    }
    lines.append(f"Main Conversion Goal: {_goal_labels.get(wizard_input.main_goal, wizard_input.main_goal)}")

    # ── Sections ──────────────────────────────────────────────────────────────
    lines.append("\n## Sections to Include")
    _section_map = {
        "include_features":     "Features / Benefits",
        "include_services":     "Services (detailed)",
        "include_about":        "About Us",
        "include_testimonials": "Customer Testimonials",
        "include_pricing":      "Pricing",
        "include_faq":          "FAQ",
        "include_contact":      "Contact (with lead-capture form)",
    }
    included = [label for attr, label in _section_map.items() if getattr(wizard_input, attr)]
    if included:
        for section in included:
            lines.append(f"  - {section}")
    else:
        lines.append("  - Contact (with lead-capture form)")

    # ── Layout & Visual ───────────────────────────────────────────────────────
    lines.append("\n## Layout & Visual Style")
    _layout_desc = {
        "minimal": "Minimal — clean, spacious, generous whitespace, single accent colour",
        "modern":  "Modern — balanced, professional, grid-based, subtle gradients",
        "bold":    "Bold — high-contrast, large typography, dark hero, impactful sections",
        "playful": "Playful — creative, friendly, rounded shapes, vibrant accents",
    }
    lines.append(f"Layout Style: {_layout_desc.get(wizard_input.layout_style, wizard_input.layout_style)}")

    _colour_desc = {
        "#2563eb": "Blue",
        "#10b981": "Green / Teal",
        "#8b5cf6": "Purple",
        "#f97316": "Orange",
        "#1f2937": "Monochrome / Dark",
        "auto":    "Auto — choose a professional colour palette that suits the industry",
    }
    colour_label = _colour_desc.get(wizard_input.color_theme, wizard_input.color_theme)
    lines.append(f"Colour Theme: {colour_label} (use as primary accent)")

    _font_desc = {
        "sans":    "Sans-serif — clean, modern system fonts",
        "serif":   "Serif — classic, authoritative (Georgia, Times New Roman)",
        "display": "Display — bold headings, high visual hierarchy",
        "auto":    "Auto — choose fonts that suit the brand voice",
    }
    lines.append(f"Font Style: {_font_desc.get(wizard_input.font_style, wizard_input.font_style)}")

    # ── Contact & Social ──────────────────────────────────────────────────────
    contact_fields = [
        ("contact_email",    "Contact Email"),
        ("contact_phone",    "Contact Phone"),
        ("contact_location", "Location"),
        ("instagram_url",    "Instagram"),
        ("linkedin_url",     "LinkedIn"),
        ("twitter_url",      "Twitter / X"),
        ("facebook_url",     "Facebook"),
    ]
    contact_lines = [
        f"  {label}: {getattr(wizard_input, attr)}"
        for attr, label in contact_fields
        if getattr(wizard_input, attr)
    ]
    if contact_lines:
        lines.append("\n## Contact & Social")
        lines.extend(contact_lines)

    # ── Generation instruction ────────────────────────────────────────────────
    lines.append("\n## Generation Instructions")
    lines.append(
        "Generate the complete HTML now. Output ONLY the HTML — no preamble, "
        "no explanation. Wrap your output in ```html ... ``` fences."
    )
    lines.append(
        "REMEMBER: No <script> tags. Form action must be \"#\". "
        "Include the KIMUX_LEAD_FORM comment immediately before the <form> tag."
    )

    user_prompt = "\n".join(lines)
    return _SYSTEM_PROMPT, user_prompt
