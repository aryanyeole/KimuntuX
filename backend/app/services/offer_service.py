from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.offer import (
    Offer,
    OFFER_SOURCE_CB_ACCOUNT,
    OFFER_SOURCE_CURATED,
    OFFER_SOURCE_SEED,
    OFFER_SOURCE_USER_ADDED,
)
from app.core.tenancy import SYSTEM_TENANT_ID
from app.schemas.offer import (
    MarketplaceSyncResponse,
    OfferCreate,
    OfferListResponse,
    OfferResponse,
    OfferUpdate,
    UserAddedOfferCreate,
)

_SORTABLE = {"gravity", "aov", "commission_rate", "conversion_rate", "created_at"}

_CURATED_JSON = Path(__file__).parent.parent / "data" / "curated_offers_starter.json"


# ── Public helpers ─────────────────────────────────────────────────────────────

def get_offers(
    db: Session,
    tenant_id: str,
    *,
    niche: str | None = None,
    network: str | None = None,
    source: str | None = None,
    sort_by: str = "gravity",
    sort_dir: str = "desc",
    tag: str | None = None,
) -> OfferListResponse:
    """Return tenant's own offers plus SYSTEM_TENANT_ID curated offers."""
    return _list_offers_for_tenant(
        db,
        tenant_id,
        niche=niche,
        network=network,
        source=source,
        sort_by=sort_by,
        sort_dir=sort_dir,
        tag=tag,
    )


def create_offer(db: Session, data: OfferCreate, tenant_id: str) -> Offer:
    offer = Offer(**data.model_dump(), tenant_id=tenant_id, source=OFFER_SOURCE_SEED)
    db.add(offer)
    db.commit()
    db.refresh(offer)
    return offer


def create_user_added_offer(db: Session, data: UserAddedOfferCreate, tenant_id: str) -> Offer:
    """Create a user-tracked offer scoped to a tenant."""
    offer = Offer(
        **data.model_dump(),
        tenant_id=tenant_id,
        source=OFFER_SOURCE_USER_ADDED,
    )
    db.add(offer)
    db.commit()
    db.refresh(offer)
    return offer


def update_user_added_offer(
    db: Session, offer_id: str, data: OfferUpdate, tenant_id: str
) -> Offer:
    """Update a user-added offer. Raises 404 if not found; 403 if not user_added."""
    offer = db.scalar(
        select(Offer).where(Offer.id == offer_id, Offer.tenant_id == tenant_id)
    )
    if offer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found.")
    if offer.source != OFFER_SOURCE_USER_ADDED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only user-added offers can be edited.",
        )
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(offer, field, value)
    db.commit()
    db.refresh(offer)
    return offer


def delete_user_added_offer(db: Session, offer_id: str, tenant_id: str) -> None:
    """Delete a user-added offer. Raises 404 if not found; 403 if not user_added."""
    offer = db.scalar(
        select(Offer).where(Offer.id == offer_id, Offer.tenant_id == tenant_id)
    )
    if offer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found.")
    if offer.source != OFFER_SOURCE_USER_ADDED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only user-added offers can be deleted.",
        )
    db.delete(offer)
    db.commit()


def sync_tenant_clickbank_offers(db: Session, tenant_id: str) -> MarketplaceSyncResponse:
    """Sync a tenant's ClickBank account products into tenant_id rows."""
    from app.integrations.clickbank import ClickBankAuthError, ClickBankAPIError, get_tenant_client

    client = get_tenant_client(db, tenant_id)  # raises 400 if not connected

    try:
        products = client.fetch_account_products()
    except ClickBankAuthError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"ClickBank rejected stored credentials: {exc}",
        ) from exc
    except ClickBankAPIError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"ClickBank API error: {exc}",
        ) from exc

    now = datetime.now(timezone.utc)
    created = updated = 0

    for p in products:
        external_id = p["external_id"]
        existing = db.scalar(
            select(Offer).where(
                Offer.tenant_id == tenant_id,
                Offer.source == OFFER_SOURCE_CB_ACCOUNT,
                Offer.external_id == external_id,
            )
        )
        if existing is None:
            db.add(
                Offer(
                    tenant_id=tenant_id,
                    source=OFFER_SOURCE_CB_ACCOUNT,
                    last_synced_at=now,
                    **{k: v for k, v in p.items()},
                )
            )
            created += 1
        else:
            for k, v in p.items():
                setattr(existing, k, v)
            existing.last_synced_at = now
            updated += 1

    db.commit()
    return MarketplaceSyncResponse(
        synced=created + updated,
        created=created,
        updated=updated,
        last_synced_at=now.isoformat(),
    )


# ── Curated catalog (admin) ────────────────────────────────────────────────────

def get_curated_offers(
    db: Session,
    *,
    niche: str | None = None,
    network: str | None = None,
) -> OfferListResponse:
    """Return all curated offers (admin view, not tenant-scoped)."""
    query = select(Offer).where(
        Offer.tenant_id == SYSTEM_TENANT_ID,
        Offer.source == OFFER_SOURCE_CURATED,
    )
    if niche:
        query = query.where(Offer.niche.ilike(f"%{niche}%"))
    if network:
        query = query.where(Offer.network.ilike(f"%{network}%"))
    query = query.order_by(Offer.gravity.desc())
    offers = list(db.scalars(query))
    return OfferListResponse(
        data=[OfferResponse.model_validate(o) for o in offers],
        total=len(offers),
    )


def seed_curated_offers(db: Session) -> dict:
    """Upsert curated_offers_starter.json into SYSTEM_TENANT_ID rows."""
    from app.services import ai_service

    with open(_CURATED_JSON) as f:
        items = json.load(f)

    now = datetime.now(timezone.utc)
    created = updated = 0

    for item in items:
        external_id = item["external_id"]
        existing = db.scalar(
            select(Offer).where(
                Offer.tenant_id == SYSTEM_TENANT_ID,
                Offer.source == OFFER_SOURCE_CURATED,
                Offer.external_id == external_id,
            )
        )
        fields = {k: v for k, v in item.items() if k != "external_id"}
        if existing is None:
            offer = Offer(
                tenant_id=SYSTEM_TENANT_ID,
                source=OFFER_SOURCE_CURATED,
                external_id=external_id,
                last_synced_at=now,
                **fields,
            )
            db.add(offer)
            db.flush()
            offer.ai_tags = ai_service.classify_offer(offer)
            created += 1
        else:
            for k, v in fields.items():
                setattr(existing, k, v)
            existing.last_synced_at = now
            if not existing.ai_tags:
                existing.ai_tags = ai_service.classify_offer(existing)
            updated += 1

    db.commit()
    return {"created": created, "updated": updated, "total": created + updated}


def admin_update_offer(db: Session, offer_id: str, payload: dict) -> Offer:
    """Admin: update any field on any offer."""
    offer = db.scalar(select(Offer).where(Offer.id == offer_id))
    if offer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found.")
    _IMMUTABLE = {"id", "tenant_id", "source", "created_at"}
    for k, v in payload.items():
        if k not in _IMMUTABLE:
            setattr(offer, k, v)
    db.commit()
    db.refresh(offer)
    return offer


def admin_delete_offer(db: Session, offer_id: str) -> None:
    """Admin: delete any offer by ID."""
    offer = db.scalar(select(Offer).where(Offer.id == offer_id))
    if offer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found.")
    db.delete(offer)
    db.commit()


def regenerate_ai_tags_for_offer(db: Session, offer_id: str) -> Offer:
    """Re-run AI tagging for a single offer and persist."""
    from app.services import ai_service

    offer = db.scalar(select(Offer).where(Offer.id == offer_id))
    if offer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found.")
    offer.ai_tags = ai_service.classify_offer(offer)
    db.commit()
    db.refresh(offer)
    return offer


# ── Private helpers ────────────────────────────────────────────────────────────

def _list_offers_for_tenant(
    db: Session,
    tenant_id: str,
    *,
    niche: str | None,
    network: str | None,
    source: str | None,
    sort_by: str,
    sort_dir: str,
    tag: str | None = None,
) -> OfferListResponse:
    """Return tenant's own offers PLUS system curated offers.

    Approved bypass: OR-includes SYSTEM_TENANT_ID curated rows so all
    tenants can discover offers without duplicating the data.
    See CLAUDE.md "Tenant isolation exceptions" for rationale.
    """
    query = select(Offer).where(
        or_(
            Offer.tenant_id == tenant_id,
            (Offer.tenant_id == SYSTEM_TENANT_ID)
            & (Offer.source == OFFER_SOURCE_CURATED),
        )
    )

    if source:
        query = query.where(Offer.source == source)
    if niche:
        query = query.where(Offer.niche.ilike(f"%{niche}%"))
    if network:
        query = query.where(Offer.network.ilike(f"%{network}%"))

    sort_field = sort_by if sort_by in _SORTABLE else "gravity"
    col = getattr(Offer, sort_field)
    query = query.order_by(col.desc() if sort_dir == "desc" else col.asc())

    offers = list(db.scalars(query))

    # Filter by AI tag label in Python (JSON column — not efficient for large sets,
    # but curated catalog is small and this avoids DB-specific JSON path queries)
    if tag:
        tag_lower = tag.lower()
        offers = [
            o for o in offers
            if o.ai_tags and any(
                tag_lower in t.get("label", "").lower() for t in o.ai_tags
            )
        ]

    return OfferListResponse(
        data=[OfferResponse.model_validate(o) for o in offers],
        total=len(offers),
    )
