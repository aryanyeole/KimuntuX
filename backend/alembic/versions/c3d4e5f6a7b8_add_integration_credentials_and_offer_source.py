"""Add integration_credentials table and offer source columns

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-04-16 12:00:00.000000

Changes:
  1. Create integration_credentials table (encrypted tenant secrets)
  2. Add source column to offers (default 'seed')
  3. Add external_id column to offers (nullable, indexed)
  4. Add last_synced_at column to offers (nullable)
  5. Backfill source='seed' for all existing offer rows
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = 'c3d4e5f6a7b8'
down_revision = 'b2c3d4e5f6a7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── 1. Create integration_credentials table ───────────────────────────────
    op.create_table(
        'integration_credentials',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('tenant_id', sa.String(36), nullable=False),
        sa.Column('integration_id', sa.String(36), nullable=True),
        sa.Column('platform_name', sa.String(100), nullable=False),
        sa.Column('encrypted_secrets', sa.Text(), nullable=False),
        sa.Column('metadata', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['integration_id'], ['integrations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint(
            'tenant_id', 'platform_name',
            name='uq_integration_credential_tenant_platform'
        ),
    )
    op.create_index(
        'ix_integration_credentials_tenant_id',
        'integration_credentials', ['tenant_id']
    )
    op.create_index(
        'ix_integration_credentials_integration_id',
        'integration_credentials', ['integration_id']
    )

    # ── 2. Add source column to offers (with default 'seed') ──────────────────
    with op.batch_alter_table('offers') as batch_op:
        batch_op.add_column(
            sa.Column('source', sa.String(50), nullable=True)
        )
        batch_op.add_column(
            sa.Column('external_id', sa.String(255), nullable=True)
        )
        batch_op.add_column(
            sa.Column('last_synced_at', sa.DateTime(timezone=True), nullable=True)
        )

    # ── 3. Backfill source='seed' for all existing rows ───────────────────────
    op.execute("UPDATE offers SET source = 'seed' WHERE source IS NULL")

    # ── 4. Enforce NOT NULL on source (batch recreate) ────────────────────────
    with op.batch_alter_table('offers') as batch_op:
        batch_op.alter_column('source', existing_type=sa.String(50), nullable=False)

    # ── 5. Add indexes ────────────────────────────────────────────────────────
    op.create_index('ix_offers_source', 'offers', ['source'])
    op.create_index('ix_offers_external_id', 'offers', ['external_id'])


def downgrade() -> None:
    op.drop_index('ix_offers_external_id', table_name='offers')
    op.drop_index('ix_offers_source', table_name='offers')

    with op.batch_alter_table('offers') as batch_op:
        batch_op.drop_column('last_synced_at')
        batch_op.drop_column('external_id')
        batch_op.drop_column('source')

    op.drop_index('ix_integration_credentials_integration_id', table_name='integration_credentials')
    op.drop_index('ix_integration_credentials_tenant_id', table_name='integration_credentials')
    op.drop_table('integration_credentials')
