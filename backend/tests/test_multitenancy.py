"""test_multitenancy.py — tenant isolation tests.

Verifies that data created under one tenant is invisible to another tenant.
"""

from __future__ import annotations

import pytest

from app.core.security import hash_password
from app.models.lead import LeadClassification, LeadSource, LeadStage
from app.models.tenant import Tenant, TenantPlan
from app.models.tenant_membership import MemberRole, TenantMembership
from app.models.user import User

BASE = "/api/v1/crm"
LEAD_PAYLOAD = {
    "first_name": "Bob",
    "last_name": "Tenant",
    "email": "bob.tenant@example.com",
    "source": "landing_page",
    "stage": "new",
}


@pytest.fixture(scope="module")
def second_tenant_headers(client, db_session):
    """Create a second tenant + user, return their auth + tenant headers."""
    tenant = Tenant(name="Other Corp", slug="other-corp", plan=TenantPlan.free)
    db_session.add(tenant)
    db_session.flush()

    user = User(
        full_name="Other User",
        email="other@kimux.io",
        hashed_password=hash_password("testpassword123"),
        is_active=True,
        default_tenant_id=tenant.id,
    )
    db_session.add(user)
    db_session.flush()

    db_session.add(TenantMembership(
        tenant_id=tenant.id,
        user_id=user.id,
        role=MemberRole.owner,
    ))
    db_session.commit()

    resp = client.post(
        "/api/v1/auth/token",
        data={"username": "other@kimux.io", "password": "testpassword123"},
    )
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}", "X-Tenant-ID": tenant.id}


class TestTenantIsolation:
    lead_id = None

    def test_create_lead_in_tenant_a(self, client, auth_headers):
        resp = client.post(f"{BASE}/leads", json=LEAD_PAYLOAD, headers=auth_headers)
        assert resp.status_code == 201
        TestTenantIsolation.lead_id = resp.json()["id"]

    def test_tenant_a_can_see_own_lead(self, client, auth_headers):
        assert TestTenantIsolation.lead_id is not None
        resp = client.get(f"{BASE}/leads/{TestTenantIsolation.lead_id}", headers=auth_headers)
        assert resp.status_code == 200

    def test_tenant_b_cannot_see_tenant_a_lead(self, client, second_tenant_headers):
        assert TestTenantIsolation.lead_id is not None
        resp = client.get(f"{BASE}/leads/{TestTenantIsolation.lead_id}", headers=second_tenant_headers)
        assert resp.status_code == 404

    def test_tenant_b_lead_list_excludes_tenant_a_leads(self, client, second_tenant_headers):
        resp = client.get(f"{BASE}/leads", headers=second_tenant_headers)
        assert resp.status_code == 200
        lead_ids = [l["id"] for l in resp.json()["data"]]
        assert TestTenantIsolation.lead_id not in lead_ids

    def test_wrong_tenant_id_returns_403(self, client, auth_headers):
        # Passing a tenant ID the user has no membership in → 403
        wrong_headers = {
            "Authorization": auth_headers["Authorization"],
            "X-Tenant-ID": "00000000-0000-0000-0000-deadbeef0000",
        }
        resp = client.get(f"{BASE}/leads", headers=wrong_headers)
        assert resp.status_code == 403

    def test_cross_tenant_stage_update_is_blocked(self, client, second_tenant_headers):
        assert TestTenantIsolation.lead_id is not None
        resp = client.patch(
            f"{BASE}/leads/{TestTenantIsolation.lead_id}/stage",
            json={"stage": "contacted"},
            headers=second_tenant_headers,
        )
        assert resp.status_code == 404

    def test_existing_user_without_tenant_header_uses_default(self, client, auth_headers):
        # auth_headers user has default_tenant_id set (see conftest).
        # Sending only Authorization (no X-Tenant-ID) should still resolve tenant via fallback.
        headers_no_tenant = {"Authorization": auth_headers["Authorization"]}
        resp = client.get(f"{BASE}/leads", headers=headers_no_tenant)
        assert resp.status_code == 200, (
            "Request without X-Tenant-ID header should succeed when default_tenant_id is set"
        )
