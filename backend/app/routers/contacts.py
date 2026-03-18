from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.contact_submission import ContactSubmission
from app.schemas.contact import ContactSubmissionCreate, ContactSubmissionResponse


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
    db.commit()
    db.refresh(submission)
    return submission
