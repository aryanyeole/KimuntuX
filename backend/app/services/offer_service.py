from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.offer import Offer
from app.schemas.offer import OfferCreate, OfferListResponse, OfferResponse

_SORTABLE = {"gravity", "aov", "commission_rate", "conversion_rate", "created_at"}


def get_offers(
    db: Session,
    *,
    niche: str | None = None,
    network: str | None = None,
    sort_by: str = "gravity",
    sort_dir: str = "desc",
) -> OfferListResponse:
    query = select(Offer)
    if niche:
        query = query.where(Offer.niche.ilike(f"%{niche}%"))
    if network:
        query = query.where(Offer.network.ilike(f"%{network}%"))

    sort_field = sort_by if sort_by in _SORTABLE else "gravity"
    col = getattr(Offer, sort_field)
    query = query.order_by(col.desc() if sort_dir == "desc" else col.asc())

    offers = list(db.scalars(query))
    return OfferListResponse(
        data=[OfferResponse.model_validate(o) for o in offers],
        total=len(offers),
    )


def create_offer(db: Session, data: OfferCreate) -> Offer:
    offer = Offer(**data.model_dump())
    db.add(offer)
    db.commit()
    db.refresh(offer)
    return offer
