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


def _get_or_404(db: Session, campaign_id: str) -> Campaign:
    campaign = db.scalar(select(Campaign).where(Campaign.id == campaign_id))
    if campaign is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
    return campaign


def get_campaigns(
    db: Session,
    *,
    page: int = 1,
    limit: int = 20,
) -> CampaignListResponse:
    total = db.scalar(select(func.count(Campaign.id))) or 0
    campaigns = list(
        db.scalars(
            select(Campaign)
            .order_by(Campaign.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
        )
    )
    total_pages = max(1, math.ceil(total / limit))
    return CampaignListResponse(
        data=[CampaignResponse.model_validate(c) for c in campaigns],
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
    )


def get_campaign_by_id(db: Session, campaign_id: str) -> Campaign:
    return _get_or_404(db, campaign_id)


def create_campaign(db: Session, data: CampaignCreate) -> Campaign:
    campaign = Campaign(**data.model_dump())
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return campaign


def update_campaign(db: Session, campaign_id: str, data: CampaignUpdate) -> Campaign:
    campaign = _get_or_404(db, campaign_id)
    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(campaign, field, value)
    campaign.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(campaign)
    return campaign
