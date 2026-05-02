"""add funnel to lead source enum (FB5)

Revision ID: f6a7b8c9d0e1
Revises: dec3d7fc3f77
Create Date: 2026-05-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'f6a7b8c9d0e1'
down_revision: Union[str, Sequence[str], None] = 'dec3d7fc3f77'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == 'postgresql':
        # PostgreSQL native enum — must ALTER TYPE to add values.
        # IF NOT EXISTS prevents failure if migration is applied twice.
        op.execute("ALTER TYPE leadsource ADD VALUE IF NOT EXISTS 'funnel'")
    # SQLite stores enums as VARCHAR — no schema change needed; Python enum
    # picks up the new value automatically.


def downgrade() -> None:
    # PostgreSQL does not support removing enum values without recreating
    # the entire type.  Downgrade is a no-op; remove the value manually
    # if needed (requires a full enum recreation).
    pass
