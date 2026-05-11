"""phase_31_sendgrid_schema

Revision ID: 66ade3eee00f
Revises: 92f43f38020f
Create Date: 2026-04-22 13:23:36.398397

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '66ade3eee00f'
down_revision: Union[str, Sequence[str], None] = '92f43f38020f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── 1. New webhook_events table ───────────────────────────────────────────
    op.create_table(
        'webhook_events',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('provider', sa.String(length=50), nullable=False),
        sa.Column('event_type', sa.String(length=100), nullable=False),
        sa.Column('provider_event_id', sa.String(length=255), nullable=True),
        sa.Column('tenant_id', sa.String(length=36), nullable=True),
        sa.Column('lead_id', sa.String(length=36), nullable=True),
        sa.Column('communication_id', sa.String(length=36), nullable=True),
        sa.Column('payload', sa.JSON(), nullable=True),
        sa.Column('signature_valid', sa.Boolean(), nullable=False),
        sa.Column('processed', sa.Boolean(), nullable=False),
        sa.Column('error', sa.Text(), nullable=True),
        sa.Column('received_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint(
            'provider', 'provider_event_id',
            name='uq_webhook_event_provider_event_id',
        ),
    )
    with op.batch_alter_table('webhook_events', schema=None) as batch_op:
        batch_op.create_index('ix_webhook_events_provider', ['provider'], unique=False)
        batch_op.create_index('ix_webhook_events_provider_event_id', ['provider_event_id'], unique=False)
        batch_op.create_index('ix_webhook_events_communication_id', ['communication_id'], unique=False)

    # ── 2. New columns on communications ─────────────────────────────────────
    with op.batch_alter_table('communications', schema=None) as batch_op:
        batch_op.add_column(sa.Column('provider_message_id', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('status', sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column('from_email', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('to_email', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('in_reply_to_message_id', sa.String(length=512), nullable=True))
        batch_op.create_index('ix_communications_provider_message_id', ['provider_message_id'], unique=False)

    # ── 3. Extend ActivityType enum (SQLite stores as VARCHAR — just alter the type) ──
    with op.batch_alter_table('activities', schema=None) as batch_op:
        batch_op.alter_column(
            'type',
            existing_type=sa.VARCHAR(length=13),
            type_=sa.Enum(
                'email_sent', 'email_opened', 'email_clicked', 'call', 'meeting',
                'form_submit', 'page_visit', 'ad_click', 'chatbot', 'note_added',
                'stage_changed', 'score_updated', 'email_delivered', 'email_bounced',
                name='activitytype',
            ),
            existing_nullable=False,
        )


def downgrade() -> None:
    with op.batch_alter_table('activities', schema=None) as batch_op:
        batch_op.alter_column(
            'type',
            existing_type=sa.Enum(
                'email_sent', 'email_opened', 'email_clicked', 'call', 'meeting',
                'form_submit', 'page_visit', 'ad_click', 'chatbot', 'note_added',
                'stage_changed', 'score_updated', 'email_delivered', 'email_bounced',
                name='activitytype',
            ),
            type_=sa.VARCHAR(length=13),
            existing_nullable=False,
        )

    with op.batch_alter_table('communications', schema=None) as batch_op:
        batch_op.drop_index('ix_communications_provider_message_id')
        batch_op.drop_column('in_reply_to_message_id')
        batch_op.drop_column('to_email')
        batch_op.drop_column('from_email')
        batch_op.drop_column('status')
        batch_op.drop_column('provider_message_id')

    with op.batch_alter_table('webhook_events', schema=None) as batch_op:
        batch_op.drop_index('ix_webhook_events_communication_id')
        batch_op.drop_index('ix_webhook_events_provider_event_id')
        batch_op.drop_index('ix_webhook_events_provider')

    op.drop_table('webhook_events')
