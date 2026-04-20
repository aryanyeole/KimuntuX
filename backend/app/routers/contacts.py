from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.tenancy import SYSTEM_TENANT_ID
from app.models.contact_submission import ContactSubmission
from app.models.lead import Lead
from app.schemas.contact import ContactSubmissionCreate, ContactSubmissionResponse
from app.services import lead_service

router = APIRouter(prefix="/contact", tags=["contact"])


@router.post("", response_model=ContactSubmissionResponse, status_code=status.HTTP_201_CREATED)
def create_contact_submission(
    payload: ContactSubmissionCreate,
    db: Session = Depends(get_db),
) -> ContactSubmissionResponse:
    submission = ContactSubmission(
        full_name=payload.full_name.strip(),
        email=payload.email.lower(),
        company=payload.company,
        country=payload.country,
        company_size=payload.company_size,
        primary_interest=payload.primary_interest,
        message=payload.message,
        consent=payload.consent,
        source=payload.source,
    )
    db.add(submission)
    db.flush()  # persist submission so lead FK can reference its data

    # Only create a lead if this email isn't already in the CRM
    email_exists = db.scalar(
        select(Lead.id).where(Lead.email == payload.email.lower())
    )
    if not email_exists:
        lead_service.convert_contact_to_lead(db, submission, SYSTEM_TENANT_ID)

    db.commit()
    db.refresh(submission)
    return submission
