from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, Index, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class IntegrationCredential(Base):
    """Encrypted per-tenant integration secrets.

    Platform credentials (KimuX's own API keys) are stored in env vars, NOT here.
    Only tenant-specific credentials (e.g., a tenant's ClickBank clerk key) go here.

    encrypted_secrets is a Fernet-encrypted JSON blob containing the raw API keys.
    Never log or expose this column.
    """
    __tablename__ = "integration_credentials"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
    )
    tenant_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
    )
    integration_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("integrations.id", ondelete="CASCADE"),
        nullable=True,
    )
    platform_name: Mapped[str] = mapped_column(String(100), nullable=False)

    # Fernet-encrypted JSON: {"developer_key": "...", "clerk_key": "...", ...}
    encrypted_secrets: Mapped[str] = mapped_column(Text, nullable=False)

    # Non-sensitive metadata (account nickname, display name, etc.)
    metadata_: Mapped[dict] = mapped_column("metadata", JSON, nullable=False, default=dict)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (
        UniqueConstraint("tenant_id", "platform_name", name="uq_integration_credential_tenant_platform"),
        Index("ix_integration_credentials_tenant_id", "tenant_id"),
        Index("ix_integration_credentials_integration_id", "integration_id"),
    )
