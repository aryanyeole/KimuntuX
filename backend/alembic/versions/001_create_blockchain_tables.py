"""create blockchain tables

Revision ID: 001
Revises: (none — this is the first migration)
Create Date: 2026-03-20

Creates the four blockchain-specific tables:
  - blockchain_wallets
  - blockchain_commissions
  - blockchain_withdrawals
  - blockchain_sync_status

Foreign keys to the team's users/affiliates tables are NOT added here because
we don't yet know their exact schema. They will be added in migration 002 once
confirmed with Revanth (backend lead).

To run:
    cd backend/
    alembic upgrade head

To roll back:
    alembic downgrade base
"""

import uuid
from datetime import datetime, timezone

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# Alembic identifiers
revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── blockchain_wallets ────────────────────────────────────────────────────
    op.create_table(
        "blockchain_wallets",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            default=uuid.uuid4,
            nullable=False,
        ),
        sa.Column(
            "user_id",
            sa.Text(),
            nullable=False,
            comment="ID of the user in the team's users table (soft FK — see migration 002)",
        ),
        sa.Column(
            "wallet_address",
            sa.String(42),
            nullable=False,
            comment="Ethereum address (checksummed 0x…)",
        ),
        sa.Column(
            "blockchain_tx_hash",
            sa.String(66),
            nullable=True,
            comment="Wallet-creation tx hash (null while pending)",
        ),
        sa.Column(
            "status",
            sa.String(20),
            nullable=False,
            server_default="pending",
            comment="pending | confirmed | failed",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_unique_constraint("uq_blockchain_wallets_user_id", "blockchain_wallets", ["user_id"])
    op.create_unique_constraint("uq_blockchain_wallets_address", "blockchain_wallets", ["wallet_address"])
    op.create_index("ix_blockchain_wallets_status", "blockchain_wallets", ["status"])
    op.create_index("ix_blockchain_wallets_tx_hash", "blockchain_wallets", ["blockchain_tx_hash"])

    # ── blockchain_commissions ────────────────────────────────────────────────
    op.create_table(
        "blockchain_commissions",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            default=uuid.uuid4,
            nullable=False,
        ),
        sa.Column(
            "affiliate_id",
            sa.Text(),
            nullable=False,
            comment="Affiliate user ID (soft FK — see migration 002)",
        ),
        sa.Column(
            "affiliate_address",
            sa.String(42),
            nullable=False,
            comment="Affiliate's Ethereum address",
        ),
        sa.Column(
            "sale_amount_usd",
            sa.Numeric(20, 8),
            nullable=True,
            comment="Original sale amount in USD",
        ),
        sa.Column(
            "commission_amount_eth",
            sa.Numeric(30, 18),
            nullable=False,
            comment="Commission amount in ETH",
        ),
        sa.Column(
            "eth_usd_rate",
            sa.Numeric(20, 8),
            nullable=True,
            comment="ETH/USD rate at time of recording",
        ),
        sa.Column(
            "transaction_id",
            sa.String(255),
            nullable=False,
            comment="External sale/transaction ID (idempotency key)",
        ),
        sa.Column(
            "blockchain_tx_hash",
            sa.String(66),
            nullable=True,
            comment="Ethereum transaction hash",
        ),
        sa.Column(
            "commission_index",
            sa.Integer(),
            nullable=True,
            comment="Index in the on-chain commissions[] array (set after confirmation)",
        ),
        sa.Column(
            "status",
            sa.String(20),
            nullable=False,
            server_default="pending",
            comment="pending | confirmed | failed",
        ),
        sa.Column(
            "recorded_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "confirmed_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_unique_constraint("uq_blockchain_commissions_tx_id", "blockchain_commissions", ["transaction_id"])
    op.create_unique_constraint("uq_blockchain_commissions_tx_hash", "blockchain_commissions", ["blockchain_tx_hash"])
    op.create_index("ix_blockchain_commissions_affiliate_id", "blockchain_commissions", ["affiliate_id"])
    op.create_index("ix_blockchain_commissions_status", "blockchain_commissions", ["status"])
    op.create_index("ix_blockchain_commissions_recorded_at", "blockchain_commissions", ["recorded_at"])

    # ── blockchain_withdrawals ────────────────────────────────────────────────
    op.create_table(
        "blockchain_withdrawals",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            default=uuid.uuid4,
            nullable=False,
        ),
        sa.Column(
            "affiliate_id",
            sa.Text(),
            nullable=False,
            comment="Affiliate user ID (soft FK — see migration 002)",
        ),
        sa.Column(
            "affiliate_address",
            sa.String(42),
            nullable=False,
            comment="Affiliate's Ethereum address",
        ),
        sa.Column(
            "amount_eth",
            sa.Numeric(30, 18),
            nullable=True,
            comment="ETH amount (null = withdraw-all)",
        ),
        sa.Column(
            "blockchain_tx_hash",
            sa.String(66),
            nullable=True,
            comment="Ethereum transaction hash",
        ),
        sa.Column(
            "status",
            sa.String(20),
            nullable=False,
            server_default="pending",
            comment="pending | confirmed | failed",
        ),
        sa.Column(
            "requested_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "confirmed_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_unique_constraint("uq_blockchain_withdrawals_tx_hash", "blockchain_withdrawals", ["blockchain_tx_hash"])
    op.create_index("ix_blockchain_withdrawals_affiliate_id", "blockchain_withdrawals", ["affiliate_id"])
    op.create_index("ix_blockchain_withdrawals_status", "blockchain_withdrawals", ["status"])

    # ── blockchain_sync_status ────────────────────────────────────────────────
    op.create_table(
        "blockchain_sync_status",
        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            nullable=False,
            comment="Always 1 — single-row table",
        ),
        sa.Column(
            "last_synced_block",
            sa.BigInteger(),
            nullable=True,
        ),
        sa.Column(
            "last_sync_timestamp",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "sync_status",
            sa.String(20),
            nullable=False,
            server_default="healthy",
            comment="healthy | degraded | failed",
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )

    # Seed the single sync-status row
    op.execute(
        "INSERT INTO blockchain_sync_status (id, sync_status, updated_at) "
        "VALUES (1, 'healthy', NOW())"
    )


def downgrade() -> None:
    op.drop_table("blockchain_sync_status")
    op.drop_table("blockchain_withdrawals")
    op.drop_table("blockchain_commissions")
    op.drop_table("blockchain_wallets")
