"""add tenant tables and tenant_id columns

Revision ID: a1b2c3d4e5f6
Revises: 76e4a04d344d
Create Date: 2026-04-16 00:00:00.000000

"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = 'a1b2c3d4e5f6'
down_revision = '76e4a04d344d'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create tenants table
    op.create_table(
        'tenants',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('slug', sa.String(100), nullable=False),
        sa.Column('plan', sa.String(20), nullable=False, server_default='free'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('slug', name='uq_tenants_slug'),
    )
    op.create_index('ix_tenants_slug', 'tenants', ['slug'], unique=True)

    # Create tenant_memberships table
    op.create_table(
        'tenant_memberships',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('tenant_id', sa.String(36), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=False),
        sa.Column('role', sa.String(20), nullable=False, server_default='member'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('tenant_id', 'user_id', name='uq_tenant_membership'),
    )
    op.create_index('ix_tenant_memberships_tenant_id', 'tenant_memberships', ['tenant_id'])
    op.create_index('ix_tenant_memberships_user_id', 'tenant_memberships', ['user_id'])

    # Add default_tenant_id to users
    with op.batch_alter_table('users') as batch_op:
        batch_op.add_column(sa.Column('default_tenant_id', sa.String(36), nullable=True))

    # Add tenant_id to activities
    with op.batch_alter_table('activities') as batch_op:
        batch_op.add_column(sa.Column('tenant_id', sa.String(36), nullable=True))
    op.create_index('ix_activities_tenant_id', 'activities', ['tenant_id'])

    # Add tenant_id to communications
    with op.batch_alter_table('communications') as batch_op:
        batch_op.add_column(sa.Column('tenant_id', sa.String(36), nullable=True))
    op.create_index('ix_communications_tenant_id', 'communications', ['tenant_id'])

    # Add tenant_id to campaigns
    with op.batch_alter_table('campaigns') as batch_op:
        batch_op.add_column(sa.Column('tenant_id', sa.String(36), nullable=True))
    op.create_index('ix_campaigns_tenant_id', 'campaigns', ['tenant_id'])

    # Add tenant_id to offers
    with op.batch_alter_table('offers') as batch_op:
        batch_op.add_column(sa.Column('tenant_id', sa.String(36), nullable=True))
    op.create_index('ix_offers_tenant_id', 'offers', ['tenant_id'])


def downgrade() -> None:
    op.drop_index('ix_offers_tenant_id', 'offers')
    with op.batch_alter_table('offers') as batch_op:
        batch_op.drop_column('tenant_id')

    op.drop_index('ix_campaigns_tenant_id', 'campaigns')
    with op.batch_alter_table('campaigns') as batch_op:
        batch_op.drop_column('tenant_id')

    op.drop_index('ix_communications_tenant_id', 'communications')
    with op.batch_alter_table('communications') as batch_op:
        batch_op.drop_column('tenant_id')

    op.drop_index('ix_activities_tenant_id', 'activities')
    with op.batch_alter_table('activities') as batch_op:
        batch_op.drop_column('tenant_id')

    with op.batch_alter_table('users') as batch_op:
        batch_op.drop_column('default_tenant_id')

    op.drop_index('ix_tenant_memberships_user_id', 'tenant_memberships')
    op.drop_index('ix_tenant_memberships_tenant_id', 'tenant_memberships')
    op.drop_table('tenant_memberships')

    op.drop_index('ix_tenants_slug', 'tenants')
    op.drop_table('tenants')
