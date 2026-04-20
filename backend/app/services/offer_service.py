from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.offer import (
    Offer,
    OFFER_SOURCE_CB_ACCOUNT,
    OFFER_SOURCE_CB_MARKETPLACE,
    OFFER_SOURCE_SEED,
)
from app.core.tenancy import SYSTEM_TENANT_ID
from app.schemas.offer import (
    MarketplaceStatusResponse,
    MarketplaceSyncResponse,
    OfferCreate,
    OfferListResponse,
    OfferResponse,
)

_SORTABLE = {"gravity", "aov", "commission_rate", "conversion_rate", "created_at"}
_COLD_START_THRESHOLD = 10


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
) -> OfferListResponse:
    """Return tenant's own offers plus SYSTEM_TENANT_ID marketplace offers."""
    _maybe_cold_start_sync(db)
    return _list_offers_for_tenant(
        db,
        tenant_id,
        niche=niche,
        network=network,
        source=source,
        sort_by=sort_by,
        sort_dir=sort_dir,
    )


def create_offer(db: Session, data: OfferCreate, tenant_id: str) -> Offer:
    offer = Offer(**data.model_dump(), tenant_id=tenant_id)
    db.add(offer)
    db.commit()
    db.refresh(offer)
    return offer


def sync_marketplace_offers(db: Session) -> MarketplaceSyncResponse:
    """Sync public ClickBank marketplace into SYSTEM_TENANT_ID.

    Uses platform credentials (env vars). Raises 503 if not configured.
    """
    from app.integrations.clickbank import ClickBankAuthError, ClickBankAPIError, get_platform_client

    try:
        client = get_platform_client()
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    try:
        products = client.fetch_marketplace_offers(limit=100)
    except ClickBankAuthError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"ClickBank rejected platform credentials: {exc}",
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
                Offer.tenant_id == SYSTEM_TENANT_ID,
                Offer.source == OFFER_SOURCE_CB_MARKETPLACE,
                Offer.external_id == external_id,
            )
        )
        if existing is None:
            db.add(
                Offer(
                    tenant_id=SYSTEM_TENANT_ID,
                    source=OFFER_SOURCE_CB_MARKETPLACE,
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


def get_marketplace_status(db: Session) -> MarketplaceStatusResponse:
    """Return count + last_synced_at for SYSTEM_TENANT_ID marketplace offers."""
    row = db.execute(
        select(
            func.count(Offer.id),
            func.max(Offer.last_synced_at),
        ).where(
            Offer.tenant_id == SYSTEM_TENANT_ID,
            Offer.source == OFFER_SOURCE_CB_MARKETPLACE,
        )
    ).one()
    count, last_synced = row
    return MarketplaceStatusResponse(
        last_synced_at=last_synced.isoformat() if last_synced else None,
        offer_count=count or 0,
    )


def sync_tenant_clickbank_offers(db: Session, tenant_id: str) -> MarketplaceSyncResponse:
    """Sync a tenant's ClickBank account products into tenant_id rows.

    Uses the tenant's encrypted credentials. Raises 400 if not connected.
    """
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
) -> OfferListResponse:
    """Return tenant's own offers PLUS system marketplace offers.

    Approved bypass: OR-includes SYSTEM_TENANT_ID marketplace rows so all
    tenants can discover ClickBank offers without duplicating the data.
    """
    query = select(Offer).where(
        or_(
            Offer.tenant_id == tenant_id,
            (Offer.tenant_id == SYSTEM_TENANT_ID)
            & (Offer.source == OFFER_SOURCE_CB_MARKETPLACE),
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
    return OfferListResponse(
        data=[OfferResponse.model_validate(o) for o in offers],
        total=len(offers),
    )


def _maybe_cold_start_sync(db: Session) -> None:
    """Trigger a marketplace sync if < threshold offers exist and creds are set."""
    if not settings.clickbank_developer_key or not settings.clickbank_clerk_key:
        return
    count = db.scalar(
        select(func.count(Offer.id)).where(
            Offer.tenant_id == SYSTEM_TENANT_ID,
            Offer.source == OFFER_SOURCE_CB_MARKETPLACE,
        )
    )
    if (count or 0) < _COLD_START_THRESHOLD:
        try:
            sync_marketplace_offers(db)
        except HTTPException:
            pass  # cold-start failure is non-fatal; tenant still sees seed data
