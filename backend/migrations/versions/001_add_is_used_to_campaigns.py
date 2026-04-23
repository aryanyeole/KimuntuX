"""Add is_used to campaigns table.

Revision ID: 001_add_is_used_to_campaigns
Revises: 
Create Date: 2026-04-03 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001_add_is_used_to_campaigns'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'campaigns',
        sa.Column('is_used', sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        'campaigns',
        sa.Column('theme_color', sa.String(length=20), nullable=True),
    )
    op.alter_column('campaigns', 'is_used', server_default=None)


def downgrade() -> None:
    op.drop_column('campaigns', 'theme_color')
    op.drop_column('campaigns', 'is_used')
