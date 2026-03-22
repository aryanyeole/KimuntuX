"""
database/models.py
──────────────────
SQLAlchemy 2.0 ORM models for blockchain-related data.

These tables sit alongside the team's existing schema in the same PostgreSQL
database. All table names are prefixed with `blockchain_` to avoid collisions.

Foreign-key strategy
────────────────────
We reference the team's `users` table via a soft FK column (`user_id TEXT`)
rather than a hard FOREIGN KEY constraint. This lets us run our migration
independently before we know the exact primary-key type and column name in the
team's schema. Once confirmed with Revanth, we can add the constraint in a
follow-up migration (002_add_fk_constraints.py).

Update USER_ID_COLUMN and USER_TABLE_NAME when you have that information.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum

from sqlalchemy import (
    BigInteger,
    DateTime,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


# ─── Placeholder — update after meeting with Revanth ─────────────────────────
# USER_TABLE_NAME = "users"        # Actual table name in team's schema
# USER_ID_COLUMN  = "id"           # Column we should FK to
# ─────────────────────────────────────────────────────────────────────────────


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ─────────────────────────────────────────────────────────────────────────────
# Status enums
# ─────────────────────────────────────────────────────────────────────────────

class TxStatus(str, Enum):
    PENDING   = "pending"    # Submitted to blockchain, awaiting confirmation
    CONFIRMED = "confirmed"  # Receipt received, successful
    FAILED    = "failed"     # Receipt received, reverted / timed out


class SyncHealth(str, Enum):
    HEALTHY   = "healthy"
    DEGRADED  = "degraded"
    FAILED    = "failed"


# ─────────────────────────────────────────────────────────────────────────────
# Declarative base
# ─────────────────────────────────────────────────────────────────────────────

class Base(DeclarativeBase):
    pass


# ─────────────────────────────────────────────────────────────────────────────
# blockchain_wallets
# ─────────────────────────────────────────────────────────────────────────────

class BlockchainWallet(Base):
    """
    One row per user who has a KimuntuX smart-contract wallet.

    wallet_address is the Ethereum address of the deployed wallet contract (or
    the user's EOA address if using the platform wallet model).
    """

    __tablename__ = "blockchain_wallets"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # Soft FK to team's users table (tighten to hard FK once schema is confirmed)
    user_id: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="ID of the user in the team's users table (soft FK, will be hardened in migration 002)",
    )

    wallet_address: Mapped[str] = mapped_column(
        String(42),
        nullable=False,
        comment="Ethereum address (checksummed 0x…)",
    )

    blockchain_tx_hash: Mapped[str | None] = mapped_column(
        String(66),
        nullable=True,
        comment="Transaction hash of the wallet-creation tx (null while pending)",
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=TxStatus.PENDING.value,
        comment="pending | confirmed | failed",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=_utcnow,
    )

    __table_args__ = (
        UniqueConstraint("user_id", name="uq_blockchain_wallets_user_id"),
        UniqueConstraint("wallet_address", name="uq_blockchain_wallets_address"),
        Index("ix_blockchain_wallets_status", "status"),
        Index("ix_blockchain_wallets_tx_hash", "blockchain_tx_hash"),
    )

    def __repr__(self) -> str:
        return f"<BlockchainWallet user={self.user_id} addr={self.wallet_address} status={self.status}>"


# ─────────────────────────────────────────────────────────────────────────────
# blockchain_commissions
# ─────────────────────────────────────────────────────────────────────────────

class BlockchainCommission(Base):
    """
    One row per commission recording attempt.

    transaction_id is the external idempotency key (caller-supplied). The
    smart contract also enforces uniqueness on this field, so a duplicate
    transaction_id will revert on-chain — but we catch duplicates in the DB
    first to avoid wasting gas.
    """

    __tablename__ = "blockchain_commissions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # Soft FK to team's affiliates / users table
    affiliate_id: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Affiliate user ID (soft FK to team's users/affiliates table)",
    )

    # The Ethereum address of the affiliate — needed for on-chain calls
    affiliate_address: Mapped[str] = mapped_column(
        String(42),
        nullable=False,
        comment="Affiliate's Ethereum address",
    )

    sale_amount_usd: Mapped[float | None] = mapped_column(
        Numeric(20, 8),
        nullable=True,
        comment="Original sale amount in USD at time of recording",
    )

    commission_amount_eth: Mapped[float] = mapped_column(
        Numeric(30, 18),
        nullable=False,
        comment="Commission amount in ETH sent to the smart contract",
    )

    eth_usd_rate: Mapped[float | None] = mapped_column(
        Numeric(20, 8),
        nullable=True,
        comment="ETH/USD exchange rate at time of recording",
    )

    # Caller-supplied unique key — prevents double-recording the same sale
    transaction_id: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="External transaction/sale ID used for idempotency",
    )

    blockchain_tx_hash: Mapped[str | None] = mapped_column(
        String(66),
        nullable=True,
        comment="Ethereum transaction hash (null until submitted)",
    )

    # Index in the smart contract's commissions array for this affiliate
    commission_index: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        comment="Index in the on-chain commissions[] array (set after confirmation)",
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=TxStatus.PENDING.value,
        comment="pending | confirmed | failed",
    )

    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    confirmed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=_utcnow,
    )

    __table_args__ = (
        UniqueConstraint("transaction_id", name="uq_blockchain_commissions_tx_id"),
        UniqueConstraint("blockchain_tx_hash", name="uq_blockchain_commissions_tx_hash"),
        Index("ix_blockchain_commissions_affiliate_id", "affiliate_id"),
        Index("ix_blockchain_commissions_status", "status"),
        Index("ix_blockchain_commissions_recorded_at", "recorded_at"),
    )

    def __repr__(self) -> str:
        return (
            f"<BlockchainCommission affiliate={self.affiliate_id} "
            f"tx_id={self.transaction_id} status={self.status}>"
        )


# ─────────────────────────────────────────────────────────────────────────────
# blockchain_withdrawals
# ─────────────────────────────────────────────────────────────────────────────

class BlockchainWithdrawal(Base):
    """One row per withdrawal request from an affiliate's commission balance."""

    __tablename__ = "blockchain_withdrawals"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    affiliate_id: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Affiliate user ID (soft FK)",
    )

    affiliate_address: Mapped[str] = mapped_column(
        String(42),
        nullable=False,
        comment="Affiliate's Ethereum address",
    )

    amount_eth: Mapped[float | None] = mapped_column(
        Numeric(30, 18),
        nullable=True,
        comment="ETH amount requested. NULL means withdraw-all.",
    )

    blockchain_tx_hash: Mapped[str | None] = mapped_column(
        String(66),
        nullable=True,
        comment="Ethereum transaction hash",
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=TxStatus.PENDING.value,
        comment="pending | confirmed | failed",
    )

    requested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    confirmed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=_utcnow,
    )

    __table_args__ = (
        UniqueConstraint("blockchain_tx_hash", name="uq_blockchain_withdrawals_tx_hash"),
        Index("ix_blockchain_withdrawals_affiliate_id", "affiliate_id"),
        Index("ix_blockchain_withdrawals_status", "status"),
    )

    def __repr__(self) -> str:
        return (
            f"<BlockchainWithdrawal affiliate={self.affiliate_id} "
            f"amount={self.amount_eth} status={self.status}>"
        )


# ─────────────────────────────────────────────────────────────────────────────
# blockchain_sync_status
# ─────────────────────────────────────────────────────────────────────────────

class BlockchainSyncStatus(Base):
    """
    Single-row table tracking the health of our blockchain sync.

    Row with id=1 is inserted by the first migration and upserted by the
    sync background task. Never insert a second row.
    """

    __tablename__ = "blockchain_sync_status"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        default=1,
        comment="Always 1 — this is a single-row config/status table",
    )

    last_synced_block: Mapped[int | None] = mapped_column(
        BigInteger,
        nullable=True,
        comment="Last Ethereum block number successfully processed",
    )

    last_sync_timestamp: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    sync_status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=SyncHealth.HEALTHY.value,
        comment="healthy | degraded | failed",
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=_utcnow,
    )

    def __repr__(self) -> str:
        return (
            f"<BlockchainSyncStatus block={self.last_synced_block} "
            f"status={self.sync_status}>"
        )
