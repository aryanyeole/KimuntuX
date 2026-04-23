"""test_leads.py — integration tests for the CRM leads API.

All tests run against an in-memory SQLite database (see conftest.py).
Tests are ordered so that later tests can rely on state created by earlier
ones within the same class (pytest runs class methods top-to-bottom).
"""

from __future__ import annotations

import pytest

BASE = "/api/v1/crm/leads"

# ---------------------------------------------------------------------------
# Payload used across multiple tests
# ---------------------------------------------------------------------------

LEAD_PAYLOAD = {
    "first_name": "Alice",
    "last_name": "Nguyen",
    "email": "alice.nguyen@example.com",
    "phone": "+1-555-0100",
    "company": "Acme Corp",
    "industry": "SaaS",
    "source": "landing_page",
    "stage": "new",
}


# ---------------------------------------------------------------------------
# 401 — unauthenticated access
# ---------------------------------------------------------------------------

class TestUnauthenticated:
    """Every CRM endpoint must reject requests without a valid token."""

    def test_list_leads_requires_auth(self, client):
        resp = client.get(BASE)
        assert resp.status_code == 401

    def test_create_lead_requires_auth(self, client):
        resp = client.post(BASE, json=LEAD_PAYLOAD)
        assert resp.status_code == 401

    def test_get_lead_requires_auth(self, client):
        resp = client.get(f"{BASE}/some-id")
        assert resp.status_code == 401

    def test_patch_lead_requires_auth(self, client):
        resp = client.patch(f"{BASE}/some-id", json={"company": "X"})
        assert resp.status_code == 401

    def test_delete_lead_requires_auth(self, client):
        resp = client.delete(f"{BASE}/some-id")
        assert resp.status_code == 401

    def test_score_lead_requires_auth(self, client):
        resp = client.post(f"{BASE}/some-id/ai/score")
        assert resp.status_code == 401

    def test_outreach_requires_auth(self, client):
        resp = client.post(f"{BASE}/some-id/ai/outreach", json={"tone": "friendly"})
        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# CRUD — stateful tests run in order
# ---------------------------------------------------------------------------

class TestLeadCRUD:
    """
    Stateful test class. Each method builds on the previous one.
    pytest guarantees top-to-bottom execution order within a class.
    """

    lead_id: str = ""  # populated by test_create_lead

    # ── Create ────────────────────────────────────────────────────────────────

    def test_create_lead(self, client, auth_headers):
        resp = client.post(BASE, json=LEAD_PAYLOAD, headers=auth_headers)
        assert resp.status_code in (200, 201), resp.text
        body = resp.json()
        assert body["first_name"] == "Alice"
        assert body["email"] == "alice.nguyen@example.com"
        assert body["source"] == "landing_page"
        assert body["stage"] == "new"
        assert "id" in body
        TestLeadCRUD.lead_id = body["id"]

    # ── List ─────────────────────────────────────────────────────────────────

    def test_list_leads_returns_paginated(self, client, auth_headers):
        resp = client.get(BASE, headers=auth_headers)
        assert resp.status_code == 200
        body = resp.json()
        assert "data" in body
        assert "total" in body
        assert "page" in body
        assert "total_pages" in body
        assert isinstance(body["data"], list)
        assert body["total"] >= 1

    def test_list_leads_search_filter(self, client, auth_headers):
        # Search by first name
        resp = client.get(BASE, params={"search": "Alice"}, headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert any(lead["first_name"] == "Alice" for lead in data)

    def test_list_leads_search_no_match(self, client, auth_headers):
        resp = client.get(BASE, params={"search": "zzznomatch"}, headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["total"] == 0

    def test_list_leads_source_filter(self, client, auth_headers):
        resp = client.get(BASE, params={"source": "landing_page"}, headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert all(lead["source"] == "landing_page" for lead in data)

    # ── Get by ID ────────────────────────────────────────────────────────────

    def test_get_lead_by_id(self, client, auth_headers):
        resp = client.get(f"{BASE}/{self.lead_id}", headers=auth_headers)
        assert resp.status_code == 200
        body = resp.json()
        assert body["id"] == self.lead_id
        assert body["email"] == "alice.nguyen@example.com"

    def test_get_nonexistent_lead_returns_404(self, client, auth_headers):
        resp = client.get(f"{BASE}/00000000-0000-0000-0000-000000000000", headers=auth_headers)
        assert resp.status_code == 404

    # ── Update ───────────────────────────────────────────────────────────────

    def test_patch_lead_updates_fields(self, client, auth_headers):
        resp = client.patch(
            f"{BASE}/{self.lead_id}",
            json={"company": "Globex Inc", "job_title": "CTO"},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["company"] == "Globex Inc"
        assert body["job_title"] == "CTO"
        # Other fields should be unchanged
        assert body["first_name"] == "Alice"

    # ── Stage transition ──────────────────────────────────────────────────────

    def test_patch_stage(self, client, auth_headers):
        resp = client.patch(
            f"{BASE}/{self.lead_id}/stage",
            json={"stage": "contacted"},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["stage"] == "contacted"

    # ── Activities ────────────────────────────────────────────────────────────

    def test_get_activities_includes_stage_changed(self, client, auth_headers):
        """After the stage PATCH above, a stage_changed activity must appear."""
        resp = client.get(f"{BASE}/{self.lead_id}/activities", headers=auth_headers)
        assert resp.status_code == 200
        activities = resp.json()
        assert isinstance(activities, list)
        types = [a["activity_type"] for a in activities]
        assert "stage_changed" in types

    def test_post_activity(self, client, auth_headers):
        resp = client.post(
            f"{BASE}/{self.lead_id}/activities",
            json={
                "activity_type": "note_added",
                "description": "Called and left voicemail",
                "channel": "phone",
            },
            headers=auth_headers,
        )
        assert resp.status_code in (200, 201)
        body = resp.json()
        assert body["activity_type"] == "note_added"
        assert body["lead_id"] == self.lead_id

    # ── AI — score ────────────────────────────────────────────────────────────

    def test_ai_score_returns_score_and_classification(self, client, auth_headers):
        resp = client.post(
            f"{BASE}/{self.lead_id}/ai/score",
            headers=auth_headers,
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["lead_id"] == self.lead_id
        assert isinstance(body["ai_score"], int)
        assert 0 <= body["ai_score"] <= 100
        assert body["classification"] in ("hot", "warm", "cold")
        assert "message" in body

    # ── AI — outreach ─────────────────────────────────────────────────────────

    @pytest.mark.parametrize("tone", ["professional", "friendly", "urgent"])
    def test_ai_outreach_returns_subject_and_body(self, tone, client, auth_headers):
        resp = client.post(
            f"{BASE}/{self.lead_id}/ai/outreach",
            json={"tone": tone},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["lead_id"] == self.lead_id
        assert isinstance(body["subject"], str) and len(body["subject"]) > 0
        assert isinstance(body["body"], str) and len(body["body"]) > 0
        assert body["tone"] == tone

    def test_ai_outreach_invalid_tone_rejected(self, client, auth_headers):
        resp = client.post(
            f"{BASE}/{self.lead_id}/ai/outreach",
            json={"tone": "aggressive"},
            headers=auth_headers,
        )
        assert resp.status_code == 422

    # ── Delete ────────────────────────────────────────────────────────────────

    def test_delete_lead(self, client, auth_headers):
        resp = client.delete(f"{BASE}/{self.lead_id}", headers=auth_headers)
        assert resp.status_code == 204

    def test_deleted_lead_returns_404(self, client, auth_headers):
        resp = client.get(f"{BASE}/{self.lead_id}", headers=auth_headers)
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Bulk / utility endpoints
# ---------------------------------------------------------------------------

class TestBulkEndpoints:

    def test_import_from_contacts_returns_summary(self, client, auth_headers):
        """With no contact submissions, import should return zeros."""
        resp = client.post(f"{BASE}/import-from-contacts", headers=auth_headers)
        assert resp.status_code == 200
        body = resp.json()
        assert "created" in body
        assert "skipped" in body
        assert "total_contacts" in body

    def test_score_all_returns_summary(self, client, auth_headers):
        resp = client.post(f"{BASE}/ai/score-all", headers=auth_headers)
        assert resp.status_code == 200
        body = resp.json()
        assert "scored" in body
        assert "errors" in body

    def test_score_all_force_param_accepted(self, client, auth_headers):
        resp = client.post(f"{BASE}/ai/score-all?force=true", headers=auth_headers)
        assert resp.status_code == 200