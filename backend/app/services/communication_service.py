from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.communication import Communication
from app.models.lead import Lead
from app.schemas.communication import (
    CommunicationCreate,
    CommunicationListResponse,
    CommunicationResponse,
)

_PREVIEW_LEN = 100


def get_communications(
    db: Session,
    *,
    lead_id: str | None = None,
) -> CommunicationListResponse:
    query = select(Communication).order_by(Communication.timestamp.desc())
    if lead_id:
        # Verify the lead exists before filtering
        if not db.scalar(select(Lead.id).where(Lead.id == lead_id)):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
        query = query.where(Communication.lead_id == lead_id)

    comms = list(db.scalars(query))
    return CommunicationListResponse(
        data=[CommunicationResponse.model_validate(c) for c in comms],
        total=len(comms),
    )


def create_communication(db: Session, data: CommunicationCreate) -> Communication:
    # Validate the lead exists
    if not db.scalar(select(Lead.id).where(Lead.id == data.lead_id)):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")

    preview = data.body[:_PREVIEW_LEN].replace("\n", " ")
    comm = Communication(
        lead_id=data.lead_id,
        channel=data.channel,
        direction=data.direction,
        subject=data.subject,
        body=data.body,
        preview=preview,
        meta=data.meta,
    )
    db.add(comm)
    db.commit()
    db.refresh(comm)
    return comm
