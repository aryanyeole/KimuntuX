"""enforce tenant_id NOT NULL — backfill existing rows to system tenant

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-04-16 00:01:00.000000

Run Migration A first, then this migration:
  cd backend && alembic upgrade head
"""
from __future__ import annotations

from datetime import datetime, timezone

from alembic import op
import sqlalchemy as sa

revision = 'b2c3d4e5f6a7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None

SYSTEM_TENANT_ID = '00000000-0000-0000-0000-000000000001'
NOW = datetime.now(timezone.utc).isoformat()


def upgrade() -> None:
    # Insert system tenant (ignore if already exists)
    op.execute(
        f"INSERT OR IGNORE INTO tenants (id, name, slug, plan, created_at, updated_at) "
        f"VALUES ('{SYSTEM_TENANT_ID}', 'System', 'system', 'free', '{NOW}', '{NOW}')"
    )

    # Backfill all NULL tenant_ids to system tenant
    for table in ('leads', 'integrations', 'activities', 'communications', 'campaigns', 'offers'):
        op.execute(
            f"UPDATE {table} SET tenant_id = '{SYSTEM_TENANT_ID}' WHERE tenant_id IS NULL"
        )

    # Enforce NOT NULL on all tenant_id columns via batch (recreates table in SQLite)
    with op.batch_alter_table('leads') as batch_op:
        batch_op.alter_column('tenant_id', existing_type=sa.String(36), nullable=False)

    with op.batch_alter_table('integrations') as batch_op:
        batch_op.alter_column('tenant_id', existing_type=sa.String(36), nullable=False)

    with op.batch_alter_table('activities') as batch_op:
        batch_op.alter_column('tenant_id', existing_type=sa.String(36), nullable=False)

    with op.batch_alter_table('communications') as batch_op:
        batch_op.alter_column('tenant_id', existing_type=sa.String(36), nullable=False)

    with op.batch_alter_table('campaigns') as batch_op:
        batch_op.alter_column('tenant_id', existing_type=sa.String(36), nullable=False)

    with op.batch_alter_table('offers') as batch_op:
        batch_op.alter_column('tenant_id', existing_type=sa.String(36), nullable=False)


def downgrade() -> None:
    for table in ('leads', 'integrations', 'activities', 'communications', 'campaigns', 'offers'):
        with op.batch_alter_table(table) as batch_op:
            batch_op.alter_column('tenant_id', existing_type=sa.String(36), nullable=True)
