from __future__ import annotations

import enum
from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Index, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class CommunicationChannel(str, enum.Enum):
    email = "email"
    sms = "sms"
    whatsapp = "whatsapp"
    chatbot = "chatbot"
    social_dm = "social_dm"


class CommunicationDirection(str, enum.Enum):
    inbound = "inbound"
    outbound = "outbound"


class Communication(Base):
    __tablename__ = "communications"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
    )
    tenant_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("tenants.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    lead_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("leads.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    channel: Mapped[CommunicationChannel] = mapped_column(
        Enum(CommunicationChannel, name="communicationchannel"),
        nullable=False,
    )
    direction: Mapped[CommunicationDirection] = mapped_column(
        Enum(CommunicationDirection, name="communicationdirection"),
        nullable=False,
    )
    subject: Mapped[str | None] = mapped_column(String(512), nullable=True)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    preview: Mapped[str | None] = mapped_column(String(100), nullable=True)
    read: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    # "metadata" is reserved by DeclarativeBase; map Python attr "meta" → DB col "metadata"
    meta: Mapped[dict | None] = mapped_column("metadata", JSON, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    lead = relationship("Lead", back_populates="communications")

    __table_args__ = (
        Index("ix_communications_lead_id_timestamp", "lead_id", "timestamp"),
    )
