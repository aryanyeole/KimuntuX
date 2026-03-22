"""
database/repository.py
───────────────────────
Data-access functions for blockchain-related tables.

All functions accept an AsyncSession so callers control the transaction
boundary. This keeps the repository testable without mocking the entire DB.

Pattern
-------
    # In an endpoint — session is injected by FastAPI Depends(get_db)
    wallet = await get_wallet_by_user(db, user_id="abc123")

    # Creating a pending record before submitting to blockchain
    commission = await create_commission(db, affiliate_id=..., ...)
    # ... submit to blockchain ...
    await update_commission_tx_hash(db, commission.id, tx_hash)
    # ... background task confirms ...
    await confirm_commission(db, tx_hash, commission_index=2)
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from database.models import (
    BlockchainCommission,
    BlockchainSyncStatus,
    BlockchainWallet,
    BlockchainWithdrawal,
    SyncHealth,
    TxStatus,
)


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ─────────────────────────────────────────────────────────────────────────────
# Wallet repository
# ─────────────────────────────────────────────────────────────────────────────

async def get_wallet_by_user(db: AsyncSession, user_id: str) -> BlockchainWallet | None:
    result = await db.execute(
        select(BlockchainWallet).where(BlockchainWallet.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def get_wallet_by_address(db: AsyncSession, address: str) -> BlockchainWallet | None:
    result = await db.execute(
        select(BlockchainWallet).where(BlockchainWallet.wallet_address == address)
    )
    return result.scalar_one_or_none()


async def create_wallet_record(
    db: AsyncSession,
    *,
    user_id: str,
    wallet_address: str,
) -> BlockchainWallet:
    """Insert a PENDING wallet record before submitting the create-wallet tx."""
    wallet = BlockchainWallet(
        user_id=user_id,
        wallet_address=wallet_address,
        status=TxStatus.PENDING.value,
    )
    db.add(wallet)
    await db.flush()  # Populate wallet.id without committing
    return wallet


async def update_wallet_tx_hash(
    db: AsyncSession,
    wallet_id: uuid.UUID,
    tx_hash: str,
) -> None:
    await db.execute(
        update(BlockchainWallet)
        .where(BlockchainWallet.id == wallet_id)
        .values(blockchain_tx_hash=tx_hash, updated_at=_now())
    )


async def confirm_wallet(db: AsyncSession, tx_hash: str) -> None:
    await db.execute(
        update(BlockchainWallet)
        .where(BlockchainWallet.blockchain_tx_hash == tx_hash)
        .values(status=TxStatus.CONFIRMED.value, updated_at=_now())
    )


async def fail_wallet(db: AsyncSession, tx_hash: str) -> None:
    await db.execute(
        update(BlockchainWallet)
        .where(BlockchainWallet.blockchain_tx_hash == tx_hash)
        .values(status=TxStatus.FAILED.value, updated_at=_now())
    )


# ─────────────────────────────────────────────────────────────────────────────
# Commission repository
# ─────────────────────────────────────────────────────────────────────────────

async def get_commission_by_transaction_id(
    db: AsyncSession, transaction_id: str
) -> BlockchainCommission | None:
    result = await db.execute(
        select(BlockchainCommission).where(
            BlockchainCommission.transaction_id == transaction_id
        )
    )
    return result.scalar_one_or_none()


async def get_commission_by_tx_hash(
    db: AsyncSession, tx_hash: str
) -> BlockchainCommission | None:
    result = await db.execute(
        select(BlockchainCommission).where(
            BlockchainCommission.blockchain_tx_hash == tx_hash
        )
    )
    return result.scalar_one_or_none()


async def list_commissions_for_affiliate(
    db: AsyncSession, affiliate_id: str
) -> list[BlockchainCommission]:
    result = await db.execute(
        select(BlockchainCommission)
        .where(BlockchainCommission.affiliate_id == affiliate_id)
        .order_by(BlockchainCommission.recorded_at.desc())
    )
    return list(result.scalars().all())


async def create_commission_record(
    db: AsyncSession,
    *,
    affiliate_id: str,
    affiliate_address: str,
    commission_amount_eth: float,
    transaction_id: str,
    sale_amount_usd: float | None = None,
    eth_usd_rate: float | None = None,
) -> BlockchainCommission:
    """
    Insert a PENDING commission record before submitting to blockchain.

    Raises ValueError if transaction_id already exists (idempotency check).
    Callers should catch this before burning gas on a duplicate submission.
    """
    existing = await get_commission_by_transaction_id(db, transaction_id)
    if existing:
        raise ValueError(
            f"Commission with transaction_id={transaction_id!r} already exists "
            f"(status={existing.status}). Use the existing record."
        )

    commission = BlockchainCommission(
        affiliate_id=affiliate_id,
        affiliate_address=affiliate_address,
        commission_amount_eth=commission_amount_eth,
        transaction_id=transaction_id,
        sale_amount_usd=sale_amount_usd,
        eth_usd_rate=eth_usd_rate,
        status=TxStatus.PENDING.value,
    )
    db.add(commission)
    await db.flush()
    return commission


async def update_commission_tx_hash(
    db: AsyncSession,
    commission_id: uuid.UUID,
    tx_hash: str,
) -> None:
    await db.execute(
        update(BlockchainCommission)
        .where(BlockchainCommission.id == commission_id)
        .values(blockchain_tx_hash=tx_hash, updated_at=_now())
    )


async def confirm_commission(
    db: AsyncSession,
    tx_hash: str,
    *,
    commission_index: int | None = None,
) -> None:
    await db.execute(
        update(BlockchainCommission)
        .where(BlockchainCommission.blockchain_tx_hash == tx_hash)
        .values(
            status=TxStatus.CONFIRMED.value,
            commission_index=commission_index,
            confirmed_at=_now(),
            updated_at=_now(),
        )
    )


async def fail_commission(db: AsyncSession, tx_hash: str) -> None:
    await db.execute(
        update(BlockchainCommission)
        .where(BlockchainCommission.blockchain_tx_hash == tx_hash)
        .values(status=TxStatus.FAILED.value, updated_at=_now())
    )


# ─────────────────────────────────────────────────────────────────────────────
# Withdrawal repository
# ─────────────────────────────────────────────────────────────────────────────

async def create_withdrawal_record(
    db: AsyncSession,
    *,
    affiliate_id: str,
    affiliate_address: str,
    amount_eth: float | None,   # None = withdraw-all
) -> BlockchainWithdrawal:
    withdrawal = BlockchainWithdrawal(
        affiliate_id=affiliate_id,
        affiliate_address=affiliate_address,
        amount_eth=amount_eth,
        status=TxStatus.PENDING.value,
    )
    db.add(withdrawal)
    await db.flush()
    return withdrawal


async def update_withdrawal_tx_hash(
    db: AsyncSession,
    withdrawal_id: uuid.UUID,
    tx_hash: str,
) -> None:
    await db.execute(
        update(BlockchainWithdrawal)
        .where(BlockchainWithdrawal.id == withdrawal_id)
        .values(blockchain_tx_hash=tx_hash, updated_at=_now())
    )


async def confirm_withdrawal(db: AsyncSession, tx_hash: str) -> None:
    await db.execute(
        update(BlockchainWithdrawal)
        .where(BlockchainWithdrawal.blockchain_tx_hash == tx_hash)
        .values(
            status=TxStatus.CONFIRMED.value,
            confirmed_at=_now(),
            updated_at=_now(),
        )
    )


async def fail_withdrawal(db: AsyncSession, tx_hash: str) -> None:
    await db.execute(
        update(BlockchainWithdrawal)
        .where(BlockchainWithdrawal.blockchain_tx_hash == tx_hash)
        .values(status=TxStatus.FAILED.value, updated_at=_now())
    )


async def list_withdrawals_for_affiliate(
    db: AsyncSession, affiliate_id: str
) -> list[BlockchainWithdrawal]:
    result = await db.execute(
        select(BlockchainWithdrawal)
        .where(BlockchainWithdrawal.affiliate_id == affiliate_id)
        .order_by(BlockchainWithdrawal.requested_at.desc())
    )
    return list(result.scalars().all())


# ─────────────────────────────────────────────────────────────────────────────
# Sync status repository
# ─────────────────────────────────────────────────────────────────────────────

async def get_sync_status(db: AsyncSession) -> BlockchainSyncStatus | None:
    result = await db.execute(
        select(BlockchainSyncStatus).where(BlockchainSyncStatus.id == 1)
    )
    return result.scalar_one_or_none()


async def upsert_sync_status(
    db: AsyncSession,
    *,
    last_synced_block: int,
    sync_status: SyncHealth = SyncHealth.HEALTHY,
) -> None:
    """Update the single sync-status row, or insert it if missing."""
    existing = await get_sync_status(db)
    if existing:
        await db.execute(
            update(BlockchainSyncStatus)
            .where(BlockchainSyncStatus.id == 1)
            .values(
                last_synced_block=last_synced_block,
                last_sync_timestamp=_now(),
                sync_status=sync_status.value,
                updated_at=_now(),
            )
        )
    else:
        db.add(
            BlockchainSyncStatus(
                id=1,
                last_synced_block=last_synced_block,
                last_sync_timestamp=_now(),
                sync_status=sync_status.value,
            )
        )
