from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine
from app.models.base import Base
from app.models import ContactSubmission, SchedulerItem, User  # noqa: F401
from app.routers import auth, contacts, scheduler


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


@app.on_event("startup")
def create_tables() -> None:
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "environment": settings.app_env}


app.include_router(auth.router, prefix=settings.api_v1_prefix)
app.include_router(contacts.router, prefix=settings.api_v1_prefix)
app.include_router(scheduler.router, prefix=settings.api_v1_prefix)
