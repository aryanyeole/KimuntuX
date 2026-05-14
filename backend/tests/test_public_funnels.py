"""test_public_funnels.py — integration tests for the public funnel submit endpoint (FB5).

All tests run against the shared in-memory SQLite database (conftest.py).
The public submit endpoint requires NO authentication — tests deliberately
omit Authorization headers to verify that constraint.
"""
from __future__ import annotations

import pytest
from sqlalchemy import select

from app.models.funnel import Funnel, FunnelStatus
from app.models.lead import Lead, LeadSource
from app.models.user import User

BASE = "/api/v1/public/funnels"
CRM_LEADS = "/api/v1/crm/leads"

_WIZARD_INPUT = {
    "company_name": "FB5 Test Co",
    "tagline": "Built for testing",
    "brand_voice": "professional",
    "logo_url": None,
    "short_description": "A test company for FB5 integration tests",
    "about_us": None,
    "industry": "Technology",
    "key_services": ["Testing"],
    "hero_headline": "Welcome to FB5 Tests",
    "hero_subheadline": None,
    "primary_cta_text": "Submit",
    "main_goal": "contact",
    "include_features": False,
    "include_services": False,
    "include_about": False,
    "include_testimonials": False,
    "include_pricing": False,
    "include_faq": False,
    "include_contact": True,
    "layout_style": "modern",
    "contact_email": None,
    "contact_phone": None,
    "contact_location": None,
    "instagram_url": None,
    "linkedin_url": None,
    "twitter_url": None,
    "facebook_url": None,
    "color_theme": "auto",
    "font_style": "auto",
}

# ---------------------------------------------------------------------------
# Module-level setup: create funnels once for all tests
# ---------------------------------------------------------------------------

FB5 = {}  # populated by _fb5_setup; shared across all tests in this module


@pytest.fixture(scope="module", autouse=True)
def _fb5_setup(db_session, auth_headers):
    """Create a ready funnel, a draft funnel, and a failed funnel once."""
    tenant_id = auth_headers["X-Tenant-ID"]
    user = db_session.scalar(select(User).where(User.email == "test@kimux.io"))

    ready = Funnel(
        tenant_id=tenant_id,
        created_by_user_id=user.id,
        title="FB5 Ready Funnel",
        wizard_input=_WIZARD_INPUT,
        status=FunnelStatus.ready,
        generated_html="<html><body>ready</body></html>",
    )
    draft = Funnel(
        tenant_id=tenant_id,
        created_by_user_id=user.id,
        title="FB5 Draft Funnel",
        wizard_input=_WIZARD_INPUT,
        status=FunnelStatus.draft,
        generated_html=None,
    )
    failed = Funnel(
        tenant_id=tenant_id,
        created_by_user_id=user.id,
        title="FB5 Failed Funnel",
        wizard_input=_WIZARD_INPUT,
        status=FunnelStatus.failed,
        generated_html=None,
        error_message="Simulated failure",
    )
    db_session.add_all([ready, draft, failed])
    db_session.commit()
    for obj in (ready, draft, failed):
        db_session.refresh(obj)

    FB5["ready_id"] = ready.id
    FB5["draft_id"] = draft.id
    FB5["failed_id"] = failed.id
    FB5["tenant_id"] = tenant_id


# ---------------------------------------------------------------------------
# Happy path
# ---------------------------------------------------------------------------

def test_submit_creates_lead_in_funnel_tenant(client, db_session, auth_headers):
    """Submitting to a ready funnel creates a Lead in the funnel's tenant."""
    resp = client.post(
        f"{BASE}/{FB5['ready_id']}/submit",
        data={"name": "Alice Tester", "email": "alice.fb5@example.com", "message": "Hello"},
    )
    assert resp.status_code == 200

    lead = db_session.scalar(
        select(Lead).where(
            Lead.email == "alice.fb5@example.com",
            Lead.tenant_id == FB5["tenant_id"],
        )
    )
    assert lead is not None
    assert lead.tenant_id == FB5["tenant_id"]
    assert lead.source == LeadSource.funnel
    assert lead.source_detail == "FB5 Ready Funnel"
    assert lead.notes == "Hello"
    assert lead.first_name == "Alice"
    assert lead.last_name == "Tester"


# ---------------------------------------------------------------------------
# 404 variants
# ---------------------------------------------------------------------------

def test_submit_to_nonexistent_funnel_returns_404(client):
    """Submitting to a non-existent funnel ID returns 404 HTML."""
    resp = client.post(
        f"{BASE}/00000000-0000-0000-0000-000000000000/submit",
        data={"name": "Ghost", "email": "ghost@example.com"},
    )
    assert resp.status_code == 404
    assert "text/html" in resp.headers["content-type"]
    # Should NOT be a JSON 404 — visitors are humans, not API clients
    assert resp.headers["content-type"].startswith("text/html")


def test_submit_to_draft_funnel_returns_404(client):
    """Draft funnels must not accept submissions."""
    resp = client.post(
        f"{BASE}/{FB5['draft_id']}/submit",
        data={"name": "Draft Sub", "email": "draft@example.com"},
    )
    assert resp.status_code == 404
    assert resp.headers["content-type"].startswith("text/html")


def test_submit_to_failed_funnel_returns_404(client):
    """Failed funnels must not accept submissions."""
    resp = client.post(
        f"{BASE}/{FB5['failed_id']}/submit",
        data={"name": "Failed Sub", "email": "failed@example.com"},
    )
    assert resp.status_code == 404
    assert resp.headers["content-type"].startswith("text/html")


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------

def test_submit_with_missing_required_fields_returns_422(client):
    """Missing name and email fields must return 422."""
    # No fields at all
    resp = client.post(f"{BASE}/{FB5['ready_id']}/submit", data={})
    assert resp.status_code == 422


def test_submit_with_missing_email_returns_422(client):
    """Missing email alone must return 422."""
    resp = client.post(
        f"{BASE}/{FB5['ready_id']}/submit",
        data={"name": "No Email"},
    )
    assert resp.status_code == 422


def test_submit_with_invalid_email_returns_422(client):
    """A malformed email must return 422."""
    resp = client.post(
        f"{BASE}/{FB5['ready_id']}/submit",
        data={"name": "Bad Email", "email": "not-an-email"},
    )
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Auth regression guard
# ---------------------------------------------------------------------------

def test_submit_no_auth_required(client):
    """The endpoint must work with no Authorization header."""
    resp = client.post(
        f"{BASE}/{FB5['ready_id']}/submit",
        data={"name": "Anon Visitor", "email": "anon.fb5@example.com"},
        # Deliberately no headers — raw client call, no auth
    )
    assert resp.status_code == 200


# ---------------------------------------------------------------------------
# Response format
# ---------------------------------------------------------------------------

def test_thankyou_response_is_html(client):
    """Successful submission must return Content-Type: text/html."""
    resp = client.post(
        f"{BASE}/{FB5['ready_id']}/submit",
        data={"name": "HTML Check", "email": "htmlcheck.fb5@example.com"},
    )
    assert resp.status_code == 200
    assert "text/html" in resp.headers["content-type"]
    body = resp.text
    assert "Thank you" in body


# ---------------------------------------------------------------------------
# End-to-end CRM wiring
# ---------------------------------------------------------------------------

def test_lead_appears_in_tenant_leads_list(client, auth_headers):
    """After submission, the lead must appear in the tenant's CRM leads list."""
    # Submit fresh lead with unique email
    email = "e2e.fb5@example.com"
    submit_resp = client.post(
        f"{BASE}/{FB5['ready_id']}/submit",
        data={"name": "E2E Lead", "email": email, "message": "End to end test"},
    )
    assert submit_resp.status_code == 200

    # Fetch leads as the tenant user
    leads_resp = client.get(
        CRM_LEADS,
        headers=auth_headers,
        params={"search": email},
    )
    assert leads_resp.status_code == 200
    data = leads_resp.json()["data"]
    assert len(data) >= 1

    lead = next((l for l in data if l["email"] == email), None)
    assert lead is not None, f"Lead with email {email} not found in CRM leads"
    assert lead["source"] == "funnel"
    assert lead["source_detail"] == "FB5 Ready Funnel"
    assert lead["tenant_id"] == FB5["tenant_id"]
