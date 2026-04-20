from __future__ import annotations

import math
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.activity import Activity, ActivityType
from app.models.contact_submission import ContactSubmission
from app.models.lead import Lead, LeadClassification, LeadSource, LeadStage
from app.schemas.lead import ActivityCreate, LeadCreate, LeadListResponse, LeadResponse, LeadUpdate


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_SORTABLE_FIELDS = {
    "created_at", "updated_at", "last_contact_at", "converted_at",
    "first_name", "last_name", "email", "company",
    "ai_score", "predicted_value", "ltv",
    "stage", "classification", "source",
}


def _get_or_404(db: Session, lead_id: str, tenant_id: str) -> Lead:
    lead = db.scalar(
        select(Lead).where(Lead.id == lead_id, Lead.tenant_id == tenant_id)
    )
    if lead is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
    return lead


# ---------------------------------------------------------------------------
# Lead CRUD
# ---------------------------------------------------------------------------

def get_leads(
    db: Session,
    *,
    tenant_id: str,
    page: int = 1,
    limit: int = 20,
    search: str | None = None,
    source: str | None = None,
    stage: str | None = None,
    classification: str | None = None,
    sort_by: str = "created_at",
    sort_dir: str = "desc",
) -> LeadListResponse:
    query = select(Lead).where(Lead.tenant_id == tenant_id)

    if search:
        pattern = f"%{search}%"
        query = query.where(
            or_(
                Lead.first_name.ilike(pattern),
                Lead.last_name.ilike(pattern),
                Lead.email.ilike(pattern),
                Lead.company.ilike(pattern),
            )
        )

    if source:
        query = query.where(Lead.source == source)
    if stage:
        query = query.where(Lead.stage == stage)
    if classification:
        query = query.where(Lead.classification == classification)

    count_query = select(func.count()).select_from(query.subquery())
    total = db.scalar(count_query) or 0

    sort_field = sort_by if sort_by in _SORTABLE_FIELDS else "created_at"
    col = getattr(Lead, sort_field)
    query = query.order_by(col.desc() if sort_dir == "desc" else col.asc())

    offset = (page - 1) * limit
    leads = list(db.scalars(query.offset(offset).limit(limit)))

    total_pages = max(1, math.ceil(total / limit))
    return LeadListResponse(
        data=[LeadResponse.model_validate(l) for l in leads],
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
    )


def get_lead_by_id(db: Session, lead_id: str, tenant_id: str) -> Lead:
    return _get_or_404(db, lead_id, tenant_id)


def create_lead(db: Session, data: LeadCreate, tenant_id: str) -> Lead:
    lead = Lead(**data.model_dump(), tenant_id=tenant_id)
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


def update_lead(db: Session, lead_id: str, data: LeadUpdate, tenant_id: str) -> Lead:
    lead = _get_or_404(db, lead_id, tenant_id)
    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(lead, field, value)
    lead.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(lead)
    return lead


def delete_lead(db: Session, lead_id: str, tenant_id: str) -> None:
    lead = _get_or_404(db, lead_id, tenant_id)
    db.delete(lead)
    db.commit()


def update_lead_stage(db: Session, lead_id: str, new_stage: LeadStage, tenant_id: str) -> Lead:
    lead = _get_or_404(db, lead_id, tenant_id)
    old_stage = lead.stage
    lead.stage = new_stage
    lead.updated_at = datetime.now(timezone.utc)

    activity = Activity(
        lead_id=lead_id,
        tenant_id=tenant_id,
        activity_type=ActivityType.stage_changed,
        description=f"Stage changed from {old_stage.value if hasattr(old_stage, 'value') else old_stage} to {new_stage.value}",
        meta={"old_stage": str(old_stage), "new_stage": new_stage.value},
    )
    db.add(activity)
    db.commit()
    db.refresh(lead)
    return lead


# ---------------------------------------------------------------------------
# Contact → Lead conversion
# ---------------------------------------------------------------------------

def convert_contact_to_lead(
    db: Session, contact: ContactSubmission, tenant_id: str
) -> Lead:
    parts = contact.full_name.strip().split(" ", 1)
    first_name = parts[0]
    last_name = parts[1] if len(parts) > 1 else ""

    lead = Lead(
        tenant_id=tenant_id,
        first_name=first_name,
        last_name=last_name,
        email=contact.email.lower(),
        company=contact.company,
        source=LeadSource.landing_page,
        source_detail=contact.primary_interest,
        stage=LeadStage.new,
        classification=LeadClassification.cold,
        notes=contact.message,
    )
    db.add(lead)
    db.flush()

    activity = Activity(
        lead_id=lead.id,
        tenant_id=tenant_id,
        activity_type=ActivityType.form_submit,
        description="Submitted landing page contact form",
        meta={
            "primary_interest": contact.primary_interest,
            "company_size": contact.company_size,
            "country": contact.country,
            "source": contact.source,
        },
        channel="landing_page",
    )
    db.add(activity)
    return lead


def import_contacts_as_leads(db: Session, tenant_id: str) -> dict:
    existing_emails = set(
        db.scalars(select(Lead.email).where(Lead.tenant_id == tenant_id)).all()
    )

    contacts = db.scalars(select(ContactSubmission)).all()
    created = 0
    skipped = 0

    for contact in contacts:
        if contact.email.lower() in existing_emails:
            skipped += 1
            continue
        convert_contact_to_lead(db, contact, tenant_id)
        existing_emails.add(contact.email.lower())
        created += 1

    db.commit()
    return {"created": created, "skipped": skipped, "total_contacts": len(contacts)}


# ---------------------------------------------------------------------------
# Activities
# ---------------------------------------------------------------------------

def get_lead_activities(db: Session, lead_id: str, tenant_id: str) -> list[Activity]:
    _get_or_404(db, lead_id, tenant_id)
    return list(
        db.scalars(
            select(Activity)
            .where(Activity.lead_id == lead_id)
            .order_by(Activity.timestamp.desc())
        )
    )


def add_lead_activity(
    db: Session,
    lead_id: str,
    data: ActivityCreate,
    tenant_id: str,
    performed_by: str | None = None,
) -> Activity:
    _get_or_404(db, lead_id, tenant_id)
    activity = Activity(
        lead_id=lead_id,
        tenant_id=tenant_id,
        activity_type=data.activity_type,
        description=data.description,
        meta=data.meta,
        channel=data.channel,
        performed_by=performed_by,
    )
    db.add(activity)
    db.execute(
        Lead.__table__.update()
        .where(Lead.id == lead_id)
        .values(updated_at=datetime.now(timezone.utc))
    )
    db.commit()
    db.refresh(activity)
    return activity
