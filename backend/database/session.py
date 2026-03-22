"""
database/session.py
───────────────────
Async SQLAlchemy session factory.

Usage
-----
    from database.session import get_db

    # In a FastAPI endpoint:
    async def my_endpoint(db: AsyncSession = Depends(get_db)):
        result = await db.execute(select(BlockchainWallet))
        ...
"""

from __future__ import annotations

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from config.settings import settings


def _make_engine():
    """Build the async engine from DATABASE_URL in settings."""
    url = settings.app.database_url
    if not url:
        raise RuntimeError(
            "DATABASE_URL is not set. "
            "Add it to your .env file: "
            "postgresql+asyncpg://user:password@host:5432/dbname"
        )
    return create_async_engine(
        url,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,   # Reconnect silently if the connection dropped
        echo=settings.app.debug,
    )


# Lazily created so tests can patch DATABASE_URL before importing
_engine = None
_session_factory = None


def get_engine():
    global _engine
    if _engine is None:
        _engine = _make_engine()
    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    global _session_factory
    if _session_factory is None:
        _session_factory = async_sessionmaker(
            bind=get_engine(),
            class_=AsyncSession,
            expire_on_commit=False,
        )
    return _session_factory


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields a database session per request."""
    async with get_session_factory()() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
