from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.support_message import SupportMessage
from app.schemas.support import SupportInquiryCreate, SupportInquiryResponse

router = APIRouter(prefix="/support", tags=["support"])

SUPPORT_TO = "support@kimux.io"


@router.post("/inquiry", response_model=SupportInquiryResponse, status_code=status.HTTP_201_CREATED)
def submit_support_inquiry(
    payload: SupportInquiryCreate,
    db: Session = Depends(get_db),
) -> SupportInquiryResponse:
    msg = SupportMessage(
        to_address=SUPPORT_TO,
        from_email=payload.from_email.lower(),
        from_name=payload.from_name.strip() if payload.from_name else None,
        subject=payload.subject.strip() or "(no subject)",
        body=payload.message.strip(),
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg
