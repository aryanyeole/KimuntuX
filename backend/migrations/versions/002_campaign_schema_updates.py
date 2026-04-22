"""Update campaigns schema for structured content and generation metadata.

Revision ID: 002_campaign_schema_updates
Revises: 001_add_is_used_to_campaigns
Create Date: 2026-04-08 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "002_campaign_schema_updates"
down_revision = "001_add_is_used_to_campaigns"
branch_labels = None
depends_on = None


DEFAULT_BUDGET = {
    "daily_limit": None,
    "total_limit": None,
    "per_variant_limit": 10,
    "spent_to_date": 0,
    "currency": "USD",
}

DEFAULT_GENERATION_CONFIG = {
    "topic": None,
    "keywords": [],
    "tone": None,
    "language": "en",
    "num_variants": 15,
    "gemini_model": None,
}


def upgrade() -> None:
    with op.batch_alter_table("campaigns") as batch_op:
        batch_op.add_column(sa.Column("budget", sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column("generation_config", sa.JSON(), nullable=True))
        batch_op.drop_column("is_used")
        batch_op.alter_column(
            "status",
            existing_type=sa.String(length=20),
            type_=sa.String(length=32),
            existing_nullable=False,
            nullable=False,
        )

    campaigns = sa.table(
        "campaigns",
        sa.column("status", sa.String()),
        sa.column("budget", sa.JSON()),
        sa.column("generation_config", sa.JSON()),
    )

    op.execute(
        campaigns.update()
        .where(campaigns.c.status == "active")
        .values(status="testing")
    )
    op.execute(
        campaigns.update()
        .where(campaigns.c.status == "completed")
        .values(status="archived")
    )
    op.execute(
        campaigns.update()
        .where(campaigns.c.budget.is_(None))
        .values(budget=DEFAULT_BUDGET)
    )
    op.execute(
        campaigns.update()
        .where(campaigns.c.generation_config.is_(None))
        .values(generation_config=DEFAULT_GENERATION_CONFIG)
    )

    with op.batch_alter_table("campaigns") as batch_op:
        batch_op.alter_column(
            "budget",
            existing_type=sa.JSON(),
            nullable=False,
        )
        batch_op.alter_column(
            "generation_config",
            existing_type=sa.JSON(),
            nullable=False,
        )


def downgrade() -> None:
    with op.batch_alter_table("campaigns") as batch_op:
        batch_op.add_column(
            sa.Column("is_used", sa.Boolean(), nullable=False, server_default=sa.false())
        )
        batch_op.drop_column("generation_config")
        batch_op.drop_column("budget")
        batch_op.alter_column(
            "status",
            existing_type=sa.String(length=32),
            type_=sa.String(length=20),
            existing_nullable=False,
            nullable=False,
        )

    campaigns = sa.table(
        "campaigns",
        sa.column("status", sa.String()),
    )

    op.execute(
        campaigns.update()
        .where(campaigns.c.status == "testing")
        .values(status="active")
    )
    op.execute(
        campaigns.update()
        .where(campaigns.c.status == "archived")
        .values(status="completed")
    )
    op.execute(
        campaigns.update()
        .where(campaigns.c.status.in_(["generating", "compliance_check", "ready", "optimizing", "scaling"]))
        .values(status="active")
    )
