from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.lead import Lead, LeadClassification, LeadStage, LeadSource
from app.schemas.dashboard import (
    DashboardSummaryResponse,
    PipelineStageEntry,
    RecentLeadEntry,
    SourceBreakdownEntry,
)


def get_summary(db: Session, tenant_id: str) -> DashboardSummaryResponse:
    classification_rows = db.execute(
        select(Lead.classification, func.count(Lead.id))
        .where(Lead.tenant_id == tenant_id)
        .group_by(Lead.classification)
    ).all()
    classification_map: dict[str, int] = {
        (c.value if hasattr(c, "value") else str(c)): n for c, n in classification_rows
    }

    total_leads = sum(classification_map.values())
    hot_leads = classification_map.get(LeadClassification.hot.value, 0)
    warm_leads = classification_map.get(LeadClassification.warm.value, 0)
    cold_leads = classification_map.get(LeadClassification.cold.value, 0)

    total_revenue = db.scalar(
        select(func.coalesce(func.sum(Lead.predicted_value), 0.0))
        .where(Lead.tenant_id == tenant_id, Lead.stage == LeadStage.won)
    ) or 0.0

    won_count = db.scalar(
        select(func.count(Lead.id))
        .where(Lead.tenant_id == tenant_id, Lead.stage == LeadStage.won)
    ) or 0
    conversion_rate = round((won_count / total_leads * 100), 2) if total_leads else 0.0

    avg_ai_score = db.scalar(
        select(func.coalesce(func.avg(Lead.ai_score), 0.0))
        .where(Lead.tenant_id == tenant_id)
    ) or 0.0
    avg_ai_score = round(float(avg_ai_score), 1)

    pipeline_rows = db.execute(
        select(
            Lead.stage,
            func.count(Lead.id),
            func.coalesce(func.sum(Lead.predicted_value), 0.0),
        )
        .where(Lead.tenant_id == tenant_id)
        .group_by(Lead.stage)
    ).all()

    stage_order = [s.value for s in LeadStage]
    pipeline_summary = sorted(
        [PipelineStageEntry(
            stage=stage.value if hasattr(stage, "value") else str(stage),
            count=cnt,
            total_value=round(float(val), 2),
        ) for stage, cnt, val in pipeline_rows],
        key=lambda e: stage_order.index(e.stage) if e.stage in stage_order else 999,
    )

    source_rows = db.execute(
        select(
            Lead.source,
            func.count(Lead.id),
            func.coalesce(func.avg(Lead.ai_score), 0.0),
        )
        .where(Lead.tenant_id == tenant_id)
        .group_by(Lead.source)
    ).all()
    source_breakdown = [
        SourceBreakdownEntry(
            source=src.value if hasattr(src, "value") else str(src),
            count=cnt,
            avg_score=round(float(avg), 1),
        )
        for src, cnt, avg in source_rows
    ]

    recent_orm = db.scalars(
        select(Lead)
        .where(Lead.tenant_id == tenant_id)
        .order_by(Lead.created_at.desc())
        .limit(5)
    ).all()
    recent_leads = [
        RecentLeadEntry(
            id=l.id,
            first_name=l.first_name,
            last_name=l.last_name,
            email=l.email,
            company=l.company,
            source=l.source.value if hasattr(l.source, "value") else str(l.source),
            stage=l.stage.value if hasattr(l.stage, "value") else str(l.stage),
            classification=l.classification.value if hasattr(l.classification, "value") else str(l.classification),
            ai_score=l.ai_score,
            created_at=l.created_at.isoformat(),
        )
        for l in recent_orm
    ]

    return DashboardSummaryResponse(
        total_leads=total_leads,
        hot_leads=hot_leads,
        warm_leads=warm_leads,
        cold_leads=cold_leads,
        total_revenue=round(float(total_revenue), 2),
        conversion_rate=conversion_rate,
        avg_ai_score=avg_ai_score,
        pipeline_summary=pipeline_summary,
        source_breakdown=source_breakdown,
        recent_leads=recent_leads,
    )
