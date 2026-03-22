"""add foreign key constraints to team's users table

Revision ID: 002
Revises: 001
Create Date: TBD — fill in after confirming schema with Revanth

ACTION REQUIRED BEFORE RUNNING THIS MIGRATION
──────────────────────────────────────────────
Fill in the three constants below based on the team's actual schema:
  USER_TABLE       — name of the team's users table   (e.g. "users", "accounts")
  USER_PK_COLUMN   — primary key column name          (e.g. "id", "user_id")
  USER_PK_TYPE     — SQL type of that column          (e.g. "UUID", "INTEGER", "TEXT")

Leave this migration in revision history but DO NOT run it until those values
are confirmed. Attempting to run it with placeholder values will fail.
"""

import sqlalchemy as sa
from alembic import op

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None

# ── Fill these in after meeting with Revanth ─────────────────────────────────
USER_TABLE      = "FILL_IN"   # e.g. "users"
USER_PK_COLUMN  = "FILL_IN"   # e.g. "id"
USER_PK_TYPE    = "FILL_IN"   # e.g. "UUID" or "INTEGER" or "TEXT"
# ─────────────────────────────────────────────────────────────────────────────


def _check_placeholders() -> None:
    if "FILL_IN" in (USER_TABLE, USER_PK_COLUMN, USER_PK_TYPE):
        raise RuntimeError(
            "Migration 002 is not ready to run. "
            "Update USER_TABLE, USER_PK_COLUMN, and USER_PK_TYPE "
            "in alembic/versions/002_add_fk_constraints.py first."
        )


def upgrade() -> None:
    _check_placeholders()

    # Cast user_id columns to match team's PK type if needed.
    # If team uses UUID: ALTER COLUMN user_id TYPE UUID USING user_id::UUID
    # If team uses INTEGER: ALTER COLUMN user_id TYPE INTEGER USING user_id::INTEGER
    # TEXT → TEXT needs no cast.

    if USER_PK_TYPE.upper() != "TEXT":
        for table in ("blockchain_wallets", "blockchain_commissions", "blockchain_withdrawals"):
            op.execute(
                f"ALTER TABLE {table} "
                f"ALTER COLUMN {'user_id' if table == 'blockchain_wallets' else 'affiliate_id'} "
                f"TYPE {USER_PK_TYPE} "
                f"USING {'user_id' if table == 'blockchain_wallets' else 'affiliate_id'}::{USER_PK_TYPE}"
            )

    # Add FK constraints
    op.create_foreign_key(
        "fk_blockchain_wallets_user_id",
        "blockchain_wallets",
        USER_TABLE,
        ["user_id"],
        [USER_PK_COLUMN],
        ondelete="RESTRICT",
    )
    op.create_foreign_key(
        "fk_blockchain_commissions_affiliate_id",
        "blockchain_commissions",
        USER_TABLE,
        ["affiliate_id"],
        [USER_PK_COLUMN],
        ondelete="RESTRICT",
    )
    op.create_foreign_key(
        "fk_blockchain_withdrawals_affiliate_id",
        "blockchain_withdrawals",
        USER_TABLE,
        ["affiliate_id"],
        [USER_PK_COLUMN],
        ondelete="RESTRICT",
    )


def downgrade() -> None:
    _check_placeholders()

    op.drop_constraint("fk_blockchain_wallets_user_id", "blockchain_wallets", type_="foreignkey")
    op.drop_constraint("fk_blockchain_commissions_affiliate_id", "blockchain_commissions", type_="foreignkey")
    op.drop_constraint("fk_blockchain_withdrawals_affiliate_id", "blockchain_withdrawals", type_="foreignkey")
