"""add user phone address signup_plan

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-04-23

"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "d4e5f6a7b8c9"
down_revision = "c3d4e5f6a7b8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("phone", sa.String(length=64), nullable=True))
    op.add_column("users", sa.Column("address", sa.String(length=512), nullable=True))
    op.add_column("users", sa.Column("signup_plan", sa.String(length=32), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "signup_plan")
    op.drop_column("users", "address")
    op.drop_column("users", "phone")
