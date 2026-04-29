from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.campaign import Campaign
from app.models.user import User
from app.schemas.campaign import CampaignCreate, CampaignGenerateRequest, CampaignResponse, CampaignUpdate
from app.services.campaign_generator import CampaignGeneratorService


router = APIRouter(prefix="/campaigns", tags=["campaigns"])

# Return current user's campaigns, newest first.
@router.get("", response_model=list[CampaignResponse])
def list_campaigns(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[CampaignResponse]:
    items = db.scalars(
        select(Campaign)
        .where(Campaign.user_id == current_user.id)
        .order_by(Campaign.created_at.desc())
    ).all()
    return list(items)

# Build a campaign contract with mock mode or Gemini.
@router.post("/generate")
async def generate_campaign(
    payload: CampaignGenerateRequest,
    current_user: User = Depends(get_current_user),
) -> dict:
    _ = current_user
    service = CampaignGeneratorService()
    try:
        return await service.generate(payload)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Campaign generation failed: {exc}",
        ) from exc

# Persist a new campaign owned by the authenticated user.
@router.post("", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
def create_campaign(
    payload: CampaignCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CampaignResponse:
    campaign_data = payload.model_dump(mode="json")
    item = Campaign(
        user_id=current_user.id,
        **campaign_data,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

# Update mutable campaign fields and bump version when omitted.
@router.put("/{campaign_id}", response_model=CampaignResponse)
def update_campaign(
    campaign_id: str,
    payload: CampaignUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CampaignResponse:
    item = db.scalar(
        select(Campaign).where(
            Campaign.id == campaign_id,
            Campaign.user_id == current_user.id,
        )
    )
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    updates = payload.model_dump(exclude_unset=True, mode="json")
    if "name" in updates and updates["name"] is not None:
        updates["name"] = updates["name"].strip()

    for key, value in updates.items():
        setattr(item, key, value)

    if "version" not in updates:
        item.version = (item.version or 1) + 1

    db.add(item)
    db.commit()
    db.refresh(item)
    return item

# Hard-delete campaign currently scoped to authenticated user.
@router.delete("/{campaign_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_campaign(
    campaign_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    item = db.scalar(
        select(Campaign).where(
            Campaign.id == campaign_id,
            Campaign.user_id == current_user.id,
        )
    )
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    db.delete(item)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
