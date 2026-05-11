"""
One-time setup: grant a user admin access + KimuX Demo membership.
Update TARGET_EMAIL to whichever account you want to set up.
"""
from app.core.database import SessionLocal
from app.models.user import User
from app.models.tenant import Tenant
from app.models.tenant_membership import TenantMembership
from app.models.lead import Lead
from uuid import uuid4
from datetime import datetime, timezone

TARGET_EMAIL = "contact@kimux.co"  # ← change this to your new account's email

db = SessionLocal()

user = db.query(User).filter(User.email == TARGET_EMAIL).first()
if not user:
    print(f"User {TARGET_EMAIL} not found. Did you sign up yet?")
    db.close()
    exit(1)

print(f"Found user: {user.email} (id={user.id})")

user.is_admin = True
user.is_platform_admin = True
print("  Set is_admin=True, is_platform_admin=True")

demo_tenant = db.query(Tenant).filter(Tenant.name == "KimuX Demo").first()
if not demo_tenant:
    print("KimuX Demo tenant not found! Run: python -m app.scripts.seed")
    db.close()
    exit(1)

print(f"  Found KimuX Demo tenant (id={demo_tenant.id})")

existing = db.query(TenantMembership).filter(
    TenantMembership.user_id == user.id,
    TenantMembership.tenant_id == demo_tenant.id
).first()

if not existing:
    membership = TenantMembership(
        id=str(uuid4()),
        user_id=user.id,
        tenant_id=demo_tenant.id,
        role="admin",
        created_at=datetime.now(timezone.utc),
    )
    db.add(membership)
    print("  Granted membership to KimuX Demo tenant")
else:
    print("  Already member of KimuX Demo tenant")

user.default_tenant_id = demo_tenant.id
print("  Set default_tenant_id to KimuX Demo")

db.commit()

lead_count = db.query(Lead).filter(Lead.tenant_id == demo_tenant.id).count()
print(f"\nKimuX Demo has {lead_count} leads")

db.close()
print("\nDone. Log out and log back in to refresh your session.")