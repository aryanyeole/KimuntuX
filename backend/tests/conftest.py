"""conftest.py — shared fixtures for all tests.

Uses an in-memory SQLite database so tests never touch the dev database.
A single session is shared for the whole test run so that stateful,
ordered test classes (like TestLeadCRUD) can create data in one test
and read it in the next — exactly as they would against a real server.

The database is fresh on every `pytest` invocation because SQLite
:memory: starts empty each time.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Side-effect import: registers all models with Base.metadata
import app.models  # noqa: F401
from app.core.database import get_db
from app.core.security import hash_password
from app.main import app
from app.models.base import Base
from app.models.tenant import Tenant, TenantPlan
from app.models.tenant_membership import MemberRole, TenantMembership
from app.models.user import User

# ---------------------------------------------------------------------------
# In-memory SQLite engine
# ---------------------------------------------------------------------------

TEST_DATABASE_URL = "sqlite:///:memory:"

# One connection held open for the session so the in-memory DB isn't lost
_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
_connection = _engine.connect()
_TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=_connection,
)


# ---------------------------------------------------------------------------
# Session-scoped fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session", autouse=True)
def create_tables():
    """Create schema once; drop it after the entire test run."""
    Base.metadata.create_all(bind=_connection)
    yield
    Base.metadata.drop_all(bind=_connection)


@pytest.fixture(scope="session")
def db_session(create_tables):
    """
    One SQLAlchemy Session for the whole test session.
    Stateful ordered tests share this session intentionally so that data
    created in one test is visible to the next.
    """
    session = _TestingSessionLocal()
    yield session
    session.close()


@pytest.fixture(scope="session")
def client(db_session):
    """
    TestClient with get_db overridden to use the shared test session.
    Session-scoped so the same client (and same DB state) is reused across
    all tests.
    """
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app, raise_server_exceptions=True) as c:
        yield c
    app.dependency_overrides.pop(get_db, None)


@pytest.fixture(scope="session")
def auth_headers(client, db_session):
    """
    Create a test tenant + user once, log in once, return auth + tenant headers
    for the session.
    """
    # Create test tenant
    tenant = Tenant(
        name="Test Workspace",
        slug="test-workspace",
        plan=TenantPlan.free,
    )
    db_session.add(tenant)
    db_session.flush()

    # Create test user
    user = User(
        full_name="Test User",
        email="test@kimux.io",
        hashed_password=hash_password("testpassword123"),
        is_active=True,
        default_tenant_id=tenant.id,
    )
    db_session.add(user)
    db_session.flush()

    # Create membership
    membership = TenantMembership(
        tenant_id=tenant.id,
        user_id=user.id,
        role=MemberRole.owner,
    )
    db_session.add(membership)
    db_session.commit()

    resp = client.post(
        "/api/v1/auth/token",
        data={"username": "test@kimux.io", "password": "testpassword123"},
    )
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    token = resp.json()["access_token"]
    return {
        "Authorization": f"Bearer {token}",
        "X-Tenant-ID": tenant.id,
    }
