from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.funnel import Funnel, FunnelStatus
from app.schemas.funnel import FunnelCreate


def get_funnel(db: Session, tenant_id: str, funnel_id: str) -> Funnel | None:
    return db.scalar(
        select(Funnel).where(Funnel.id == funnel_id, Funnel.tenant_id == tenant_id)
    )


def list_funnels(
    db: Session, tenant_id: str, page: int = 1, limit: int = 20
) -> tuple[list[Funnel], int]:
    base = select(Funnel).where(Funnel.tenant_id == tenant_id)
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    offset = (page - 1) * limit
    items = list(
        db.scalars(base.order_by(Funnel.created_at.desc()).offset(offset).limit(limit))
    )
    return items, total


def create_funnel(
    db: Session, tenant_id: str, user_id: str, payload: FunnelCreate
) -> Funnel:
    funnel = Funnel(
        tenant_id=tenant_id,
        created_by_user_id=user_id,
        title=payload.title,
        wizard_input=payload.wizard_input.model_dump(),
        status=FunnelStatus.draft,
        edit_history=[],
    )
    db.add(funnel)
    db.commit()
    db.refresh(funnel)
    return funnel


def delete_funnel(db: Session, tenant_id: str, funnel_id: str) -> bool:
    funnel = get_funnel(db, tenant_id, funnel_id)
    if funnel is None:
        return False
    db.delete(funnel)
    db.commit()
    return True


def update_funnel_title(
    db: Session, tenant_id: str, funnel_id: str, title: str
) -> Funnel | None:
    funnel = get_funnel(db, tenant_id, funnel_id)
    if funnel is None:
        return None
    funnel.title = title
    funnel.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(funnel)
    return funnel


def mark_generating(db: Session, tenant_id: str, funnel_id: str) -> Funnel | None:
    funnel = get_funnel(db, tenant_id, funnel_id)
    if funnel is None:
        return None
    funnel.status = FunnelStatus.generating
    funnel.error_message = None
    funnel.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(funnel)
    return funnel


def mark_ready(
    db: Session, tenant_id: str, funnel_id: str, html: str, metadata: dict
) -> Funnel | None:
    funnel = get_funnel(db, tenant_id, funnel_id)
    if funnel is None:
        return None
    funnel.status = FunnelStatus.ready
    funnel.generated_html = html
    funnel.generation_metadata = metadata
    funnel.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(funnel)
    return funnel


def mark_failed(
    db: Session, tenant_id: str, funnel_id: str, error: str
) -> Funnel | None:
    funnel = get_funnel(db, tenant_id, funnel_id)
    if funnel is None:
        return None
    funnel.status = FunnelStatus.failed
    funnel.error_message = error
    funnel.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(funnel)
    return funnel


def reset_for_regenerate(db: Session, tenant_id: str, funnel_id: str) -> Funnel | None:
    """Clear html/error and move back to generating atomically."""
    funnel = get_funnel(db, tenant_id, funnel_id)
    if funnel is None:
        return None
    funnel.generated_html = None
    funnel.error_message = None
    funnel.status = FunnelStatus.generating
    funnel.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(funnel)
    return funnel
