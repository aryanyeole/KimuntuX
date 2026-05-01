"""add funnel table for funnel builder feature

Revision ID: dec3d7fc3f77
Revises: 43c8f9078d11
Create Date: 2026-04-30 19:27:54.678055

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'dec3d7fc3f77'
down_revision: Union[str, Sequence[str], None] = '43c8f9078d11'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'funnels',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('tenant_id', sa.String(36), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('created_by_user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('status', sa.String(20), nullable=False, server_default='draft'),
        sa.Column('wizard_input', sa.JSON(), nullable=False),
        sa.Column('generated_html', sa.Text(), nullable=True),
        sa.Column('generation_metadata', sa.JSON(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('edit_history', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_funnels_tenant_id', 'funnels', ['tenant_id'])
    op.create_index('ix_funnels_status', 'funnels', ['status'])
    op.create_index('ix_funnels_tenant_id_created_at', 'funnels', ['tenant_id', 'created_at'])


def downgrade() -> None:
    op.drop_index('ix_funnels_tenant_id_created_at', table_name='funnels')
    op.drop_index('ix_funnels_status', table_name='funnels')
    op.drop_index('ix_funnels_tenant_id', table_name='funnels')
    op.drop_table('funnels')
