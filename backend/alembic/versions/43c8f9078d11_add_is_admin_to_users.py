"""add_is_admin_to_users

Revision ID: 43c8f9078d11
Revises: 66ade3eee00f
Create Date: 2026-04-30 10:07:50.630337

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '43c8f9078d11'
down_revision: Union[str, Sequence[str], None] = '66ade3eee00f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column(
        'is_admin', sa.Boolean(), nullable=False, server_default=sa.false()
    ))


def downgrade() -> None:
    op.drop_column('users', 'is_admin')
