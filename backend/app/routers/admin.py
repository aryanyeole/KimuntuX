from __future__ import annotations

from fastapi import APIRouter, Depends, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_platform_admin_user
from app.models.user import User
from app.schemas.offer import OfferListResponse, OfferResponse
from app.services import offer_service

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/offers", response_model=OfferListResponse)
def list_curated_offers(
    niche: str | None = None,
    network: str | None = None,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_platform_admin_user),
) -> OfferListResponse:
    """List all curated offers (admin view — not tenant-scoped)."""
    return offer_service.get_curated_offers(db, niche=niche, network=network)


@router.post(
    "/offers/seed-curated",
    status_code=status.HTTP_201_CREATED,
)
def seed_curated_offers(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_platform_admin_user),
) -> dict:
    """Load curated_offers_starter.json into the DB (idempotent upsert)."""
    return offer_service.seed_curated_offers(db)


@router.post(
    "/offers/{offer_id}/regenerate-tags",
    response_model=OfferResponse,
)
def regenerate_tags(
    offer_id: str,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_platform_admin_user),
) -> OfferResponse:
    """Re-run AI tagging for a single curated offer."""
    offer = offer_service.regenerate_ai_tags_for_offer(db, offer_id)
    return OfferResponse.model_validate(offer)


@router.patch("/offers/{offer_id}", response_model=OfferResponse)
def update_curated_offer(
    offer_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_platform_admin_user),
) -> OfferResponse:
    """Update any field on a curated offer."""
    offer = offer_service.admin_update_offer(db, offer_id, payload)
    return OfferResponse.model_validate(offer)


@router.delete("/offers/{offer_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
def delete_curated_offer(
    offer_id: str,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_platform_admin_user),
) -> Response:
    """Delete a curated offer."""
    offer_service.admin_delete_offer(db, offer_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
