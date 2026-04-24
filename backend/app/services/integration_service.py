from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.integrations import sendgrid_client
from app.models.integration import Integration, IntegrationStatus, PlatformType
from app.models.integration_credential import IntegrationCredential
from app.schemas.integration import (
    IntegrationListResponse,
    IntegrationResponse,
    SendGridConnectRequest,
    SendGridStatusResponse,
)
from app.schemas.offer import AccountStatusResponse, ClickBankConnectRequest


def get_integrations(db: Session, tenant_id: str) -> IntegrationListResponse:
    integrations = list(
        db.scalars(
            select(Integration)
            .where(Integration.tenant_id == tenant_id)
            .order_by(Integration.platform_name)
        )
    )
    return IntegrationListResponse(
        data=[IntegrationResponse.model_validate(i) for i in integrations]
    )


def connect_platform(db: Session, platform_name: str, tenant_id: str) -> IntegrationResponse:
    integration = db.scalar(
        select(Integration).where(
            Integration.platform_name == platform_name,
            Integration.tenant_id == tenant_id,
        )
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


def disconnect_platform(db: Session, platform_name: str, tenant_id: str) -> IntegrationResponse:
    integration = db.scalar(
        select(Integration).where(
            Integration.platform_name == platform_name,
            Integration.tenant_id == tenant_id,
        )
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


# ── SendGrid email-sender config ──────────────────────────────────────────────

def get_sendgrid_config(db: Session, tenant_id: str) -> SendGridStatusResponse:
    integration = db.scalar(
        select(Integration).where(
            Integration.platform_name == "sendgrid",
            Integration.tenant_id == tenant_id,
        )
    )
    if integration is None or integration.status != IntegrationStatus.connected:
        return SendGridStatusResponse(connected=False)
    cfg = integration.config or {}
    return SendGridStatusResponse(
        connected=True,
        sender_email=cfg.get("sender_email"),
        sender_name=cfg.get("sender_name"),
    )


def connect_sendgrid(
    db: Session, tenant_id: str, sender_email: str, sender_name: str
) -> SendGridStatusResponse:
    """Upsert the SendGrid Integration row with sender config (no secrets stored)."""
    integration = db.scalar(
        select(Integration).where(
            Integration.platform_name == "sendgrid",
            Integration.tenant_id == tenant_id,
        )
    )
    now = datetime.now(timezone.utc)
    config = {"sender_email": sender_email, "sender_name": sender_name}
    if integration is None:
        integration = Integration(
            tenant_id=tenant_id,
            platform_name="sendgrid",
            platform_type=PlatformType.tool,
            status=IntegrationStatus.connected,
            config=config,
            connected_at=now,
        )
        db.add(integration)
    else:
        integration.config = config
        integration.status = IntegrationStatus.connected
        integration.connected_at = now
    db.commit()
    db.refresh(integration)
    return SendGridStatusResponse(connected=True, sender_email=sender_email, sender_name=sender_name)


def disconnect_sendgrid(db: Session, tenant_id: str) -> SendGridStatusResponse:
    """Mark SendGrid disconnected and clear sender config."""
    integration = db.scalar(
        select(Integration).where(
            Integration.platform_name == "sendgrid",
            Integration.tenant_id == tenant_id,
        )
    )
    if integration is None or integration.status != IntegrationStatus.connected:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SendGrid is not connected for this tenant.",
        )
    integration.status = IntegrationStatus.disconnected
    integration.config = {}
    db.commit()
    return SendGridStatusResponse(connected=False)


def send_sendgrid_test_email(db: Session, tenant_id: str, to_email: str) -> dict:
    """Send a real test email to verify SendGrid + sender config are live."""
    from app.core.config import settings

    integration = db.scalar(
        select(Integration).where(
            Integration.platform_name == "sendgrid",
            Integration.tenant_id == tenant_id,
            Integration.status == IntegrationStatus.connected,
        )
    )
    if integration is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Configure a sender email in Settings → Email Sender first.",
        )

    cfg = integration.config or {}
    sender_email = cfg.get("sender_email") or settings.default_sender_email
    sender_name = cfg.get("sender_name") or settings.default_sender_name or "KimuX"

    if not sender_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No sender email configured.",
        )

    try:
        result = sendgrid_client.send_email(
            from_email=sender_email,
            from_name=sender_name,
            to_email=to_email,
            subject="KimuX — Test Email",
            body_text=(
                "This is a test email from your KimuX CRM.\n\n"
                "If you received this, your SendGrid sender is configured correctly."
            ),
        )
        return {"success": True, "message_id": result.message_id, "status_code": result.status_code}
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc


# ── ClickBank account credential management ────────────────────────────────────

def connect_clickbank_account(
    db: Session,
    tenant_id: str,
    payload: ClickBankConnectRequest,
) -> AccountStatusResponse:
    """Validate tenant ClickBank credentials, encrypt, and persist."""
    from app.core.encryption import encrypt_secrets
    from app.integrations.clickbank import (
        ClickBankAuthError,
        ClickBankAPIError,
        ClickBankClient,
    )

    client = ClickBankClient(payload.developer_key)
    try:
        client.verify_credentials()
    except ClickBankAuthError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid ClickBank credentials: {exc}",
        ) from exc
    except ClickBankAPIError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Could not reach ClickBank to verify credentials: {exc}",
        ) from exc

    # Fetch account summary for metadata
    try:
        summary = client.fetch_account_summary()
    except Exception:
        summary = {}

    secrets = {"developer_key": payload.developer_key}
    encrypted = encrypt_secrets(secrets)
    metadata = {"account_nickname": payload.account_nickname, "summary": summary}

    # Upsert credential row
    cred = db.scalar(
        select(IntegrationCredential).where(
            IntegrationCredential.tenant_id == tenant_id,
            IntegrationCredential.platform_name == "clickbank",
        )
    )
    now = datetime.now(timezone.utc)
    if cred is None:
        cred = IntegrationCredential(
            tenant_id=tenant_id,
            platform_name="clickbank",
            encrypted_secrets=encrypted,
            metadata_=metadata,
            created_at=now,
            updated_at=now,
        )
        db.add(cred)
    else:
        cred.encrypted_secrets = encrypted
        cred.metadata_ = metadata
        cred.updated_at = now

    # Also mark the Integration row as connected if it exists
    integration = db.scalar(
        select(Integration).where(
            Integration.platform_name == "clickbank",
            Integration.tenant_id == tenant_id,
        )
    )
    if integration:
        integration.status = IntegrationStatus.connected
        integration.connected_at = now

    db.commit()

    # Count tenant account offers already synced
    from sqlalchemy import func
    from app.models.offer import Offer, OFFER_SOURCE_CB_ACCOUNT
    offer_count = db.scalar(
        select(func.count(Offer.id)).where(
            Offer.tenant_id == tenant_id,
            Offer.source == OFFER_SOURCE_CB_ACCOUNT,
        )
    ) or 0

    return AccountStatusResponse(
        connected=True,
        account_nickname=payload.account_nickname,
        last_sync_at=None,
        offer_count=offer_count,
        account_summary=summary,
    )


def disconnect_clickbank_account(db: Session, tenant_id: str) -> dict:
    """Remove tenant ClickBank credentials and mark integration disconnected.

    Does NOT delete synced offer rows — they remain visible until pruned.
    """
    cred = db.scalar(
        select(IntegrationCredential).where(
            IntegrationCredential.tenant_id == tenant_id,
            IntegrationCredential.platform_name == "clickbank",
        )
    )
    if cred is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No ClickBank account is connected for this tenant.",
        )
    db.delete(cred)

    integration = db.scalar(
        select(Integration).where(
            Integration.platform_name == "clickbank",
            Integration.tenant_id == tenant_id,
        )
    )
    if integration:
        integration.status = IntegrationStatus.disconnected

    db.commit()
    return {"detail": "ClickBank account disconnected. Synced offers are retained."}


def get_clickbank_account_status(db: Session, tenant_id: str) -> AccountStatusResponse:
    """Return connection status + offer count for tenant's ClickBank account."""
    cred = db.scalar(
        select(IntegrationCredential).where(
            IntegrationCredential.tenant_id == tenant_id,
            IntegrationCredential.platform_name == "clickbank",
        )
    )
    if cred is None:
        return AccountStatusResponse(connected=False, offer_count=0)

    from sqlalchemy import func
    from app.models.offer import Offer, OFFER_SOURCE_CB_ACCOUNT
    offer_count = db.scalar(
        select(func.count(Offer.id)).where(
            Offer.tenant_id == tenant_id,
            Offer.source == OFFER_SOURCE_CB_ACCOUNT,
        )
    ) or 0

    last_synced = db.scalar(
        select(func.max(Offer.last_synced_at)).where(
            Offer.tenant_id == tenant_id,
            Offer.source == OFFER_SOURCE_CB_ACCOUNT,
        )
    )

    meta = cred.metadata_ or {}
    return AccountStatusResponse(
        connected=True,
        account_nickname=meta.get("account_nickname"),
        last_sync_at=last_synced.isoformat() if last_synced else None,
        offer_count=offer_count,
        account_summary=meta.get("summary"),
    )
