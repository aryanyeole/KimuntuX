from __future__ import annotations

import math
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.campaign import Campaign
from app.schemas.campaign import (
    CampaignCreate,
    CampaignListResponse,
    CampaignResponse,
    CampaignUpdate,
)
from app.services.test_metrics_service import TestMetricsService


def _get_or_404(db: Session, campaign_id: str, tenant_id: str | None = None) -> Campaign:
    query = select(Campaign).where(
        Campaign.id == campaign_id,
        Campaign.deleted_at.is_(None),
    )
    if tenant_id is not None:
        query = query.where(Campaign.tenant_id == tenant_id)

    campaign = db.scalar(query)
    if campaign is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
    return campaign


def get_campaigns(
    db: Session,
    tenant_id: str | None = None,
    *,
    page: int = 1,
    limit: int = 20,
    test_mode: bool = False,
) -> CampaignListResponse:
    base_query = select(Campaign).where(Campaign.deleted_at.is_(None))
    if tenant_id is not None:
        base_query = base_query.where(Campaign.tenant_id == tenant_id)

    total = db.scalar(select(func.count()).select_from(base_query.subquery())) or 0
    campaigns = list(
        db.scalars(
            base_query
            .order_by(Campaign.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
        )
    )

    pages = max(1, math.ceil(total / limit))
    enriched = TestMetricsService.inject_metrics(campaigns, test_mode)
    return CampaignListResponse(
        items=enriched,
        total=total,
        page=page,
        per_page=limit,
        pages=pages,
    )


def get_campaign_by_id(db: Session, campaign_id: str, tenant_id: str | None = None) -> Campaign:
    return _get_or_404(db, campaign_id, tenant_id)


def create_campaign(db: Session, data: CampaignCreate, tenant_id: str | None = None, *, user_id: str | None = None) -> Campaign:
    campaign = Campaign(
        user_id=user_id or "system",
        tenant_id=tenant_id,
        **data.model_dump(mode="json"),
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return campaign


def update_campaign(db: Session, campaign_id: str, data: CampaignUpdate, tenant_id: str | None = None) -> Campaign:
    campaign = _get_or_404(db, campaign_id, tenant_id)
    updates = data.model_dump(exclude_unset=True, mode="json")
    for field, value in updates.items():
        setattr(campaign, field, value)
    campaign.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(campaign)
    return campaign