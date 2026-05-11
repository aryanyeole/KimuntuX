"""phase_25_offer_catalog_pivot

Revision ID: 92f43f38020f
Revises: d4e5f6a7b8c9
Create Date: 2026-04-21 21:56:52.633015

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '92f43f38020f'
down_revision: Union[str, Sequence[str], None] = 'd4e5f6a7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add notes and ai_tags columns to offers
    with op.batch_alter_table('offers', schema=None) as batch_op:
        batch_op.add_column(sa.Column('notes', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('ai_tags', sa.JSON(), nullable=True))

    # Add is_platform_admin to users (server_default ensures existing rows get FALSE)
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('is_platform_admin', sa.Boolean(), nullable=False, server_default=sa.false())
        )

    # Migrate existing clickbank_marketplace rows to curated
    op.execute("UPDATE offers SET source = 'curated' WHERE source = 'clickbank_marketplace'")


def downgrade() -> None:
    op.execute("UPDATE offers SET source = 'clickbank_marketplace' WHERE source = 'curated'")

    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('is_platform_admin')

    with op.batch_alter_table('offers', schema=None) as batch_op:
        batch_op.drop_column('ai_tags')
        batch_op.drop_column('notes')
