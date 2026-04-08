from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.bootstrap_admin import ensure_bootstrap_admin
from app.core.config import settings
from app.core.database import SessionLocal, engine
from app.models.base import Base
from app.models import ContactSubmission, SupportMessage, User
from app.routers import admin, auth, contacts, support


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Backend API for KimuntuX auth, contact forms, and future CRM features.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _ensure_users_is_admin_column() -> None:
    from sqlalchemy import inspect

    insp = inspect(engine)
    if not insp.has_table("users"):
        return
    col_names = {c["name"] for c in insp.get_columns("users")}
    if "is_admin" in col_names:
        return
    with engine.begin() as conn:
        if engine.dialect.name == "postgresql":
            conn.execute(
                text(
                    "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE"
                )
            )
        else:
            conn.execute(
                text("ALTER TABLE users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT 0")
            )


@app.on_event("startup")
def create_tables() -> None:
    Base.metadata.create_all(bind=engine)
    _ensure_users_is_admin_column()
    with SessionLocal() as db:
        ensure_bootstrap_admin(db)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "environment": settings.app_env}


app.include_router(auth.router, prefix=settings.api_v1_prefix)
app.include_router(contacts.router, prefix=settings.api_v1_prefix)
app.include_router(admin.router, prefix=settings.api_v1_prefix)
app.include_router(support.router, prefix=settings.api_v1_prefix)
