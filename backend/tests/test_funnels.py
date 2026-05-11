"""test_funnels.py — integration tests for the Funnel Builder backend.

All tests run against an in-memory SQLite database (see conftest.py).
BackgroundTasks are monkeypatched to use the test DB session directly,
avoiding the production SessionLocal() which targets PostgreSQL.

Live Anthropic tests (TestFunnelGeneratorIntegration) are skipped by default.
Set RUN_LIVE_ANTHROPIC_TESTS=1 in env to enable them.
"""

from __future__ import annotations

import os
from datetime import datetime, timezone

import pytest

_LIVE = bool(os.environ.get("RUN_LIVE_ANTHROPIC_TESTS"))

BASE = "/api/v1/crm/funnels"

WIZARD_INPUT = {
    "company_name": "Acme Corp",
    "tagline": "Building the future",
    "brand_voice": "professional",
    "logo_url": None,
    "short_description": "We build great software",
    "about_us": "Acme was founded in 2020",
    "industry": "Technology",
    "key_services": ["Software Development", "Consulting"],
    "hero_headline": "Transform Your Business Today",
    "hero_subheadline": "With cutting-edge software",
    "primary_cta_text": "Get Started",
    "main_goal": "signup",
    "include_features": True,
    "include_services": True,
    "include_about": True,
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
# Helpers
# ---------------------------------------------------------------------------

def _valid_wizard_payload(title="Test Funnel"):
    """Return a minimal valid POST body for /api/v1/crm/funnels."""
    return {"title": title, "wizard_input": {**WIZARD_INPUT}}


def _make_fake_generator(db_session):
    """Return an async function that acts as generate_funnel_async but uses
    the test db_session directly (bypasses production SessionLocal).

    The fake HTML includes the KIMUX_LEAD_FORM marker so it passes the same
    validation that the real generator applies.
    """
    import app.services.funnel_service as fs

    async def fake_generate(funnel_id: str, tenant_id: str) -> None:
        funnel = fs.mark_generating(db_session, tenant_id, funnel_id)
        if funnel is None:
            return
        wi = funnel.wizard_input or {}
        company = wi.get("company_name", "Company")
        html = (
            "<!DOCTYPE html><html lang='en'><head><title>"
            + company
            + "</title></head><body>"
            + "<h1>" + company + "</h1>"
            + "<!-- KIMUX_LEAD_FORM: action will be replaced by FB5 -->"
            + "<form action='#' method='post'>"
            + "<input type='text' name='name' required>"
            + "<input type='email' name='email' required>"
            + "<button type='submit'>Get Started</button>"
            + "</form>"
            + "</body></html>"
        )
        metadata = {
            "model_used":         "mock-stub",
            "input_tokens":       0,
            "output_tokens":      0,
            "generation_seconds": 0.001,
            "generated_at":       datetime.now(timezone.utc).isoformat(),
            "source":             "mock",
        }
        fs.mark_ready(db_session, tenant_id, funnel_id, html, metadata)

    return fake_generate


class _NoCloseProxy:
    """Wraps a SQLAlchemy Session, no-ops close() to protect the shared test session."""
    def __init__(self, session):
        self._s = session

    def close(self):
        pass  # preserve the shared test session

    def __getattr__(self, name):
        return getattr(self._s, name)


def _make_session_factory(db_session):
    """Return a callable that yields a no-close proxy around the test session.

    Used by fallback tests that let the real generate_funnel_async run but
    redirect its SessionLocal() calls to the in-memory test DB.
    """
    return lambda: _NoCloseProxy(db_session)


def _make_failing_generator(db_session, error_msg="Simulated generation failure"):
    """Return an async function that simulates the full error path."""
    import app.services.funnel_service as fs

    async def failing_generate(funnel_id: str, tenant_id: str) -> None:
        fs.mark_generating(db_session, tenant_id, funnel_id)
        try:
            raise RuntimeError(error_msg)
        except Exception as exc:
            fs.mark_failed(db_session, tenant_id, funnel_id, str(exc))

    return failing_generate


# ---------------------------------------------------------------------------
# 1. Create funnel — success
# ---------------------------------------------------------------------------

class TestCreateFunnel:
    def test_create_funnel_success(self, client, auth_headers):
        payload = {"title": "My First Funnel", "wizard_input": WIZARD_INPUT}
        resp = client.post(BASE, json=payload, headers=auth_headers)
        assert resp.status_code == 201, resp.text
        body = resp.json()
        assert body["title"] == "My First Funnel"
        assert body["status"] == "draft"
        assert body["wizard_input"]["company_name"] == "Acme Corp"
        assert body["wizard_input"]["hero_headline"] == "Transform Your Business Today"
        assert body["wizard_input"]["key_services"] == ["Software Development", "Consulting"]
        assert body["generated_html"] is None
        assert body["error_message"] is None
        assert body["edit_history"] == []
        assert "id" in body
        assert "tenant_id" in body

    def test_create_funnel_validation_error(self, client, auth_headers):
        # Missing company_name in wizard_input (required field)
        bad_input = {**WIZARD_INPUT}
        del bad_input["company_name"]
        resp = client.post(
            BASE,
            json={"title": "Bad Funnel", "wizard_input": bad_input},
            headers=auth_headers,
        )
        assert resp.status_code == 422

    def test_create_funnel_validation_empty_key_services(self, client, auth_headers):
        # key_services min_length=1 — empty list should fail
        bad_input = {**WIZARD_INPUT, "key_services": []}
        resp = client.post(
            BASE,
            json={"title": "Bad Funnel", "wizard_input": bad_input},
            headers=auth_headers,
        )
        assert resp.status_code == 422

    def test_create_funnel_accepts_reserved_test_domain(self, client, auth_headers):
        """contact_email with .test TLD must be accepted (display-only field)."""
        payload = _valid_wizard_payload()
        payload["wizard_input"]["contact_email"] = "hello@peakfuel.test"
        resp = client.post(BASE, json=payload, headers=auth_headers)
        assert resp.status_code == 201, resp.text
        assert resp.json()["wizard_input"]["contact_email"] == "hello@peakfuel.test"

    def test_create_funnel_rejects_malformed_email(self, client, auth_headers):
        """Even with permissive validation, contact_email without @ is rejected."""
        payload = _valid_wizard_payload()
        payload["wizard_input"]["contact_email"] = "not-an-email"
        resp = client.post(BASE, json=payload, headers=auth_headers)
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# 2. Tenant isolation
# ---------------------------------------------------------------------------

class TestTenantIsolation:
    _tenant_b_headers: dict | None = None

    @classmethod
    def _get_tenant_b_headers(cls, client, db_session):
        """Create tenant B + user B once (idempotent within session)."""
        if cls._tenant_b_headers is not None:
            return cls._tenant_b_headers

        from app.core.security import hash_password
        from app.models.tenant import Tenant, TenantPlan
        from app.models.tenant_membership import MemberRole, TenantMembership
        from app.models.user import User

        tenant_b = Tenant(name="Tenant B", slug="tenant-b-funnels", plan=TenantPlan.free)
        db_session.add(tenant_b)
        db_session.flush()

        user_b = User(
            full_name="User B",
            email="userb_funnels@kimux.io",
            hashed_password=hash_password("password123"),
            is_active=True,
            default_tenant_id=tenant_b.id,
        )
        db_session.add(user_b)
        db_session.flush()

        db_session.add(TenantMembership(tenant_id=tenant_b.id, user_id=user_b.id, role=MemberRole.owner))
        db_session.commit()

        resp = client.post(
            "/api/v1/auth/token",
            data={"username": "userb_funnels@kimux.io", "password": "password123"},
        )
        assert resp.status_code == 200, resp.text
        token = resp.json()["access_token"]
        cls._tenant_b_headers = {"Authorization": f"Bearer {token}", "X-Tenant-ID": tenant_b.id}
        return cls._tenant_b_headers

    def test_list_funnels_tenant_isolation(self, client, auth_headers, db_session):
        headers_b = self._get_tenant_b_headers(client, db_session)

        # Create funnel A
        resp_a = client.post(
            BASE,
            json={"title": "Funnel A (tenant isolation)", "wizard_input": WIZARD_INPUT},
            headers=auth_headers,
        )
        assert resp_a.status_code == 201
        funnel_a_id = resp_a.json()["id"]

        # Create funnel B
        resp_b = client.post(
            BASE,
            json={"title": "Funnel B (tenant isolation)", "wizard_input": WIZARD_INPUT},
            headers=headers_b,
        )
        assert resp_b.status_code == 201
        funnel_b_id = resp_b.json()["id"]

        # Tenant A lists funnels — must NOT see funnel B
        resp = client.get(BASE, headers=auth_headers)
        assert resp.status_code == 200
        ids = [f["id"] for f in resp.json()["items"]]
        assert funnel_a_id in ids
        assert funnel_b_id not in ids

        # Tenant B lists funnels — must NOT see funnel A
        resp = client.get(BASE, headers=headers_b)
        assert resp.status_code == 200
        ids = [f["id"] for f in resp.json()["items"]]
        assert funnel_b_id in ids
        assert funnel_a_id not in ids

    def test_get_funnel_wrong_tenant_returns_404(self, client, auth_headers, db_session):
        headers_b = self._get_tenant_b_headers(client, db_session)

        # Create funnel owned by tenant A
        resp = client.post(
            BASE,
            json={"title": "Tenant A secret funnel", "wizard_input": WIZARD_INPUT},
            headers=auth_headers,
        )
        assert resp.status_code == 201
        funnel_a_id = resp.json()["id"]

        # Tenant B tries to GET it — must be 404 (not 403)
        resp = client.get(f"{BASE}/{funnel_a_id}", headers=headers_b)
        assert resp.status_code == 404

    def test_delete_funnel_wrong_tenant(self, client, auth_headers, db_session):
        headers_b = self._get_tenant_b_headers(client, db_session)

        # Create funnel owned by tenant A
        resp = client.post(
            BASE,
            json={"title": "Funnel for wrong-tenant delete test", "wizard_input": WIZARD_INPUT},
            headers=auth_headers,
        )
        funnel_id = resp.json()["id"]

        # Tenant B tries to DELETE — must be 404
        resp = client.delete(f"{BASE}/{funnel_id}", headers=headers_b)
        assert resp.status_code == 404

        # Funnel must still exist for tenant A
        resp = client.get(f"{BASE}/{funnel_id}", headers=auth_headers)
        assert resp.status_code == 200


# ---------------------------------------------------------------------------
# 3. Mock generation
# ---------------------------------------------------------------------------

class TestMockGeneration:
    def test_generate_funnel_mock(self, client, auth_headers, db_session, monkeypatch):
        import app.services.funnel_generator as fg

        monkeypatch.setattr(fg, "generate_funnel_async", _make_fake_generator(db_session))

        # Create funnel
        resp = client.post(
            BASE,
            json={"title": "Generate Me", "wizard_input": WIZARD_INPUT},
            headers=auth_headers,
        )
        assert resp.status_code == 201
        funnel_id = resp.json()["id"]

        # Trigger generation — response must be status=generating
        resp = client.post(f"{BASE}/{funnel_id}/generate", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["status"] == "generating"

        # After TestClient returns, BackgroundTasks have completed
        resp = client.get(f"{BASE}/{funnel_id}", headers=auth_headers)
        body = resp.json()
        assert body["status"] == "ready"
        assert body["generated_html"] is not None
        assert "Acme Corp" in body["generated_html"]
        assert body["generation_metadata"]["model_used"] == "mock-stub"

    def test_regenerate_funnel(self, client, auth_headers, db_session, monkeypatch):
        import app.services.funnel_generator as fg

        monkeypatch.setattr(fg, "generate_funnel_async", _make_fake_generator(db_session))

        # Create and generate
        resp = client.post(
            BASE,
            json={"title": "Regen Test", "wizard_input": WIZARD_INPUT},
            headers=auth_headers,
        )
        funnel_id = resp.json()["id"]
        client.post(f"{BASE}/{funnel_id}/generate", headers=auth_headers)

        # Confirm ready
        body = client.get(f"{BASE}/{funnel_id}", headers=auth_headers).json()
        assert body["status"] == "ready"
        meta_before = body["generation_metadata"]

        # Trigger regenerate — response must be generating
        resp = client.post(f"{BASE}/{funnel_id}/regenerate", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["status"] == "generating"

        # After BG tasks finish, should be ready again with new metadata
        body = client.get(f"{BASE}/{funnel_id}", headers=auth_headers).json()
        assert body["status"] == "ready"
        assert body["generated_html"] is not None
        assert body["generation_metadata"] is not None
        assert body["generation_metadata"]["model_used"] == "mock-stub"

    def test_mark_failed_on_generator_exception(self, client, auth_headers, db_session, monkeypatch):
        import app.services.funnel_generator as fg

        monkeypatch.setattr(
            fg, "generate_funnel_async", _make_failing_generator(db_session)
        )

        resp = client.post(
            BASE,
            json={"title": "Fail Test", "wizard_input": WIZARD_INPUT},
            headers=auth_headers,
        )
        funnel_id = resp.json()["id"]

        client.post(f"{BASE}/{funnel_id}/generate", headers=auth_headers)

        resp = client.get(f"{BASE}/{funnel_id}", headers=auth_headers)
        body = resp.json()
        assert body["status"] == "failed"
        assert body["error_message"] == "Simulated generation failure"


# ---------------------------------------------------------------------------
# 4. CRUD — rename and delete
# ---------------------------------------------------------------------------

class TestCRUD:
    def test_delete_funnel(self, client, auth_headers):
        resp = client.post(
            BASE,
            json={"title": "Delete Me", "wizard_input": WIZARD_INPUT},
            headers=auth_headers,
        )
        funnel_id = resp.json()["id"]

        resp = client.delete(f"{BASE}/{funnel_id}", headers=auth_headers)
        assert resp.status_code == 204

        resp = client.get(f"{BASE}/{funnel_id}", headers=auth_headers)
        assert resp.status_code == 404

    def test_rename_funnel(self, client, auth_headers):
        resp = client.post(
            BASE,
            json={"title": "Original Title", "wizard_input": WIZARD_INPUT},
            headers=auth_headers,
        )
        funnel_id = resp.json()["id"]

        resp = client.patch(f"{BASE}/{funnel_id}", json={"title": "Renamed Title"}, headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["title"] == "Renamed Title"

        # Confirm persisted
        resp = client.get(f"{BASE}/{funnel_id}", headers=auth_headers)
        assert resp.json()["title"] == "Renamed Title"

    def test_unauthenticated_access_rejected(self, client):
        resp = client.get(BASE)
        assert resp.status_code == 401

        resp = client.post(BASE, json={"title": "X", "wizard_input": WIZARD_INPUT})
        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# 5. Fallback path (no API needed — uses static templates)
# ---------------------------------------------------------------------------

class TestFunnelFallback:
    """Tests that the real generate_funnel_async takes the fallback path under
    configured conditions.  These tests let the real generator run but
    redirect its SessionLocal() to the in-memory test DB via a proxy.
    """

    def test_generation_with_no_api_key_uses_fallback(self, client, auth_headers, db_session, monkeypatch):
        """When ANTHROPIC_API_KEY is absent the generator must use static template."""
        import app.services.funnel_generator as fg
        from app.core.config import settings

        monkeypatch.setattr(settings, "anthropic_api_key", None)
        monkeypatch.setattr(settings, "funnel_fallback_only", False)
        monkeypatch.setattr(fg, "SessionLocal", _make_session_factory(db_session))

        resp = client.post(
            BASE,
            json={"title": "No Key Fallback", "wizard_input": WIZARD_INPUT},
            headers=auth_headers,
        )
        assert resp.status_code == 201
        funnel_id = resp.json()["id"]

        client.post(f"{BASE}/{funnel_id}/generate", headers=auth_headers)

        resp = client.get(f"{BASE}/{funnel_id}", headers=auth_headers)
        body = resp.json()
        assert body["status"] == "ready", f"Expected ready, got {body['status']}: {body.get('error_message')}"
        meta = body["generation_metadata"]
        assert meta["source"] == "fallback"
        assert meta["fallback_reason"] == "missing_key"
        assert "KIMUX_LEAD_FORM" in (body["generated_html"] or "")

    def test_generation_with_fallback_only_flag(self, client, auth_headers, db_session, monkeypatch):
        """When FUNNEL_FALLBACK_ONLY=true the generator skips Anthropic entirely."""
        import app.services.funnel_generator as fg
        from app.core.config import settings

        monkeypatch.setattr(settings, "funnel_fallback_only", True)
        monkeypatch.setattr(fg, "SessionLocal", _make_session_factory(db_session))

        resp = client.post(
            BASE,
            json={"title": "Forced Fallback", "wizard_input": WIZARD_INPUT},
            headers=auth_headers,
        )
        funnel_id = resp.json()["id"]

        client.post(f"{BASE}/{funnel_id}/generate", headers=auth_headers)

        resp = client.get(f"{BASE}/{funnel_id}", headers=auth_headers)
        body = resp.json()
        assert body["status"] == "ready"
        meta = body["generation_metadata"]
        assert meta["source"] == "fallback"
        assert meta["fallback_reason"] == "forced"
        assert "KIMUX_LEAD_FORM" in (body["generated_html"] or "")

    def test_insufficient_credits_triggers_fallback(self, client, auth_headers, db_session, monkeypatch):
        """Anthropic 400 'credit balance too low' must fall back to static template."""
        import app.services.funnel_generator as fg
        from app.core.config import settings
        from app.integrations.anthropic_client import AnthropicInsufficientCredits

        def _mock_run_credits(wi):
            raise AnthropicInsufficientCredits(
                "Your credit balance is too low to access the Anthropic API."
            )

        monkeypatch.setattr(settings, "anthropic_api_key", "sk-fake-for-test")
        monkeypatch.setattr(settings, "funnel_fallback_only", False)
        monkeypatch.setattr(fg, "SessionLocal", _make_session_factory(db_session))
        monkeypatch.setattr(fg, "_run_anthropic", _mock_run_credits)

        resp = client.post(
            BASE,
            json={"title": "Credits Exhausted Funnel", "wizard_input": WIZARD_INPUT},
            headers=auth_headers,
        )
        funnel_id = resp.json()["id"]
        client.post(f"{BASE}/{funnel_id}/generate", headers=auth_headers)

        resp = client.get(f"{BASE}/{funnel_id}", headers=auth_headers)
        body = resp.json()
        assert body["status"] == "ready", f"Expected ready, got {body['status']}: {body.get('error_message')}"
        meta = body["generation_metadata"]
        assert meta["source"] == "fallback"
        assert meta["fallback_reason"] == "insufficient_credits"
        assert "KIMUX_LEAD_FORM" in (body["generated_html"] or "")

    def test_generic_bad_request_still_fails(self, client, auth_headers, db_session, monkeypatch):
        """Non-credits 400 (e.g. malformed prompt) must mark funnel as failed, not fall back.

        Regression guard: the insufficient-credits branch must not accidentally
        swallow real request bugs.
        """
        import app.services.funnel_generator as fg
        from app.core.config import settings
        from app.integrations.anthropic_client import AnthropicError

        def _mock_run_bad_request(wi):
            raise AnthropicError("max_tokens must be a positive integer")

        monkeypatch.setattr(settings, "anthropic_api_key", "sk-fake-for-test")
        monkeypatch.setattr(settings, "funnel_fallback_only", False)
        monkeypatch.setattr(fg, "SessionLocal", _make_session_factory(db_session))
        monkeypatch.setattr(fg, "_run_anthropic", _mock_run_bad_request)

        resp = client.post(
            BASE,
            json={"title": "Generic Bad Request Funnel", "wizard_input": WIZARD_INPUT},
            headers=auth_headers,
        )
        funnel_id = resp.json()["id"]
        client.post(f"{BASE}/{funnel_id}/generate", headers=auth_headers)

        resp = client.get(f"{BASE}/{funnel_id}", headers=auth_headers)
        body = resp.json()
        assert body["status"] == "failed", f"Expected failed, got {body['status']}"
        assert body["error_message"], "error_message must be set on failure"


# ---------------------------------------------------------------------------
# 6. Live Anthropic tests (skipped unless RUN_LIVE_ANTHROPIC_TESTS=1)
# ---------------------------------------------------------------------------

@pytest.mark.skipif(not _LIVE, reason="Set RUN_LIVE_ANTHROPIC_TESTS=1 to run live Anthropic tests")
class TestFunnelGeneratorIntegration:
    """End-to-end tests that call the real Anthropic API.

    These are intentionally skipped in normal CI runs to avoid latency and
    token cost.  Run manually before a sponsor demo or a significant prompt change.

    Expected: ~15–45 seconds per test, ~5000–10000 input tokens,
              ~3000–8000 output tokens.
    """

    def test_live_generation_returns_valid_html(self, client, auth_headers, db_session, monkeypatch):
        """Full end-to-end: wizard → Anthropic API → ready HTML with marker."""
        import app.services.funnel_generator as fg

        # Still need the test DB for session isolation
        monkeypatch.setattr(fg, "SessionLocal", _make_session_factory(db_session))

        resp = client.post(
            BASE,
            json={"title": "Live Test Funnel", "wizard_input": WIZARD_INPUT},
            headers=auth_headers,
        )
        assert resp.status_code == 201
        funnel_id = resp.json()["id"]

        # This will block for real API latency (~15–45 s in TestClient)
        gen_resp = client.post(f"{BASE}/{funnel_id}/generate", headers=auth_headers)
        assert gen_resp.status_code == 200

        resp = client.get(f"{BASE}/{funnel_id}", headers=auth_headers)
        body = resp.json()
        assert body["status"] == "ready", f"status={body['status']} error={body.get('error_message')}"

        html = body["generated_html"] or ""
        assert "Acme Corp" in html, "Company name not in generated HTML"
        assert "KIMUX_LEAD_FORM" in html, "KIMUX_LEAD_FORM marker missing from generated HTML"
        assert "<script" not in html.lower(), "Generated HTML contains <script> tags (forbidden)"

        meta = body["generation_metadata"]
        assert meta["source"] == "anthropic"
        assert meta["input_tokens"] > 0
        assert meta["output_tokens"] > 0
        assert meta["model_used"] == "claude-sonnet-4-5"
