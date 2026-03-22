"""
alembic/env.py
──────────────
Alembic migration environment — async edition.

Run migrations:
    cd backend/
    alembic upgrade head

Generate a new migration after changing models:
    alembic revision --autogenerate -m "describe your change"

The DATABASE_URL is read from the environment (or .env file via pydantic-settings)
so you never hard-code credentials here.
"""

import asyncio
import os
import sys
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

# ── Make sure the backend package root is on sys.path ─────────────────────────
# This lets Alembic import database.models without installing the package.
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from database.models import Base  # noqa: E402  (must come after sys.path patch)

# ── Alembic config object ──────────────────────────────────────────────────────
config = context.config

# Set up logging from alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Tell Alembic which metadata to diff for --autogenerate
target_metadata = Base.metadata

# ── Read DATABASE_URL from environment (never from alembic.ini) ───────────────
def _get_database_url() -> str:
    # Try environment variable first, then fall through to pydantic-settings
    url = os.environ.get("DATABASE_URL")
    if url:
        return url
    try:
        from config.settings import settings
        url = settings.app.database_url
        if url:
            return url
    except Exception:
        pass
    raise RuntimeError(
        "DATABASE_URL environment variable is not set. "
        "Set it before running Alembic:\n"
        "  export DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db"
    )


# ─────────────────────────────────────────────────────────────────────────────
# Offline mode (generates SQL without connecting to DB)
# ─────────────────────────────────────────────────────────────────────────────

def run_migrations_offline() -> None:
    url = _get_database_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


# ─────────────────────────────────────────────────────────────────────────────
# Online mode (connects to DB and applies migrations)
# ─────────────────────────────────────────────────────────────────────────────

def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    url = _get_database_url()
    # Override the URL from alembic.ini (which is intentionally blank)
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = url

    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,  # No pooling during migrations
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
