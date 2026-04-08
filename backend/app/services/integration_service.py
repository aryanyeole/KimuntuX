from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.integration import Integration, IntegrationStatus
from app.schemas.integration import IntegrationListResponse, IntegrationResponse


def get_integrations(db: Session) -> IntegrationListResponse:
    integrations = list(db.scalars(select(Integration).order_by(Integration.platform_name)))
    return IntegrationListResponse(
        data=[IntegrationResponse.model_validate(i) for i in integrations]
    )


def connect_platform(db: Session, platform_name: str) -> IntegrationResponse:
    integration = db.scalar(
        select(Integration).where(Integration.platform_name == platform_name)
    )
    if integration is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Integration '{platform_name}' not found. Add it via seed or admin first.",
        )
    integration.status = IntegrationStatus.connected
    integration.connected_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(integration)
    return IntegrationResponse.model_validate(integration)


def disconnect_platform(db: Session, platform_name: str) -> IntegrationResponse:
    integration = db.scalar(
        select(Integration).where(Integration.platform_name == platform_name)
    )
    if integration is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Integration '{platform_name}' not found.",
        )
    integration.status = IntegrationStatus.disconnected
    db.commit()
    db.refresh(integration)
    return IntegrationResponse.model_validate(integration)
