from __future__ import annotations

from collections.abc import Generator
import json
import sqlite3
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings


def _sqlite_connect_args(database_url: str) -> dict[str, bool]:
    if database_url.startswith("sqlite"):
        return {"check_same_thread": False}
    return {}


engine = create_engine(
    settings.database_url,
    connect_args=_sqlite_connect_args(settings.database_url),
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def ensure_sqlite_campaign_columns() -> None:
    if not settings.database_url.startswith("sqlite"):
        return

    database_path = engine.url.database
    if not database_path:
        return

    path = Path(database_path)
    if not path.is_absolute():
        path = Path.cwd() / path

    with sqlite3.connect(path) as connection:
        cursor = connection.cursor()
        cursor.execute("PRAGMA table_info(campaigns)")
        existing_columns = {row[1] for row in cursor.fetchall()}

        if "theme_color" not in existing_columns:
            cursor.execute("ALTER TABLE campaigns ADD COLUMN theme_color VARCHAR(20)")

        if "budget" not in existing_columns:
            cursor.execute("ALTER TABLE campaigns ADD COLUMN budget JSON")

        if "generation_config" not in existing_columns:
            cursor.execute("ALTER TABLE campaigns ADD COLUMN generation_config JSON")

        default_budget = {
            "daily_limit": None,
            "total_limit": None,
            "per_variant_limit": 10,
            "spent_to_date": 0,
            "currency": "USD",
        }
        default_generation_config = {
            "topic": None,
            "keywords": [],
            "tone": None,
            "language": "en",
            "num_variants": 15,
            "gemini_model": None,
        }

        cursor.execute(
            "UPDATE campaigns SET budget = ? WHERE budget IS NULL",
            (json.dumps(default_budget),),
        )
        cursor.execute(
            "UPDATE campaigns SET generation_config = ? WHERE generation_config IS NULL",
            (json.dumps(default_generation_config),),
        )
        cursor.execute(
            """
            UPDATE campaigns
            SET status = CASE status
                WHEN 'active' THEN 'testing'
                WHEN 'completed' THEN 'archived'
                ELSE status
            END
            """
        )

        connection.commit()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
