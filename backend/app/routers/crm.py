from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.campaign import CampaignStatus
from app.models.lead import LeadClassification, LeadSource, LeadStage
from app.models.user import User
from app.schemas.campaign import CampaignCreate, CampaignListResponse, CampaignResponse, CampaignUpdate
from app.schemas.communication import CommunicationCreate, CommunicationListResponse, CommunicationResponse
from app.schemas.dashboard import DashboardSummaryResponse
from app.schemas.integration import IntegrationListResponse, IntegrationResponse
from app.schemas.lead import (
    ActivityCreate,
    ActivityResponse,
    AiOutreachRequest,
    AiOutreachResponse,
    AiScoreResponse,
    LeadCreate,
    LeadListResponse,
    LeadResponse,
    LeadStageUpdate,
    LeadUpdate,
)
from app.schemas.offer import OfferCreate, OfferListResponse, OfferResponse
from app.services import (
    ai_service,
    campaign_service,
    communication_service,
    dashboard_service,
    integration_service,
    lead_service,
    offer_service,
)

router = APIRouter(prefix="/crm", tags=["crm"])


# ---------------------------------------------------------------------------
# Leads
# ---------------------------------------------------------------------------

@router.get("/leads", response_model=LeadListResponse)
def list_leads(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=200),
    search: str | None = Query(default=None),
    source: LeadSource | None = Query(default=None),
    stage: LeadStage | None = Query(default=None),
    classification: LeadClassification | None = Query(default=None),
    sort_by: str = Query(default="created_at"),
    sort_dir: str = Query(default="desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> LeadListResponse:
    return lead_service.get_leads(
        db,
        page=page,
        limit=limit,
        search=search,
        source=source.value if source else None,
        stage=stage.value if stage else None,
        classification=classification.value if classification else None,
        sort_by=sort_by,
        sort_dir=sort_dir,
    )


@router.post("/leads", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
def create_lead(
    payload: LeadCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> LeadResponse:
    lead = lead_service.create_lead(db, payload)
    return LeadResponse.model_validate(lead)


@router.get("/leads/{lead_id}", response_model=LeadResponse)
def get_lead(
    lead_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> LeadResponse:
    lead = lead_service.get_lead_by_id(db, lead_id)
    return LeadResponse.model_validate(lead)


@router.patch("/leads/{lead_id}", response_model=LeadResponse)
def update_lead(
    lead_id: str,
    payload: LeadUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> LeadResponse:
    lead = lead_service.update_lead(db, lead_id, payload)
    return LeadResponse.model_validate(lead)


@router.delete("/leads/{lead_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
def delete_lead(
    lead_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> Response:
    lead_service.delete_lead(db, lead_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Stage transition
# ---------------------------------------------------------------------------

@router.patch("/leads/{lead_id}/stage", response_model=LeadResponse)
def update_stage(
    lead_id: str,
    payload: LeadStageUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> LeadResponse:
    lead = lead_service.update_lead_stage(db, lead_id, payload.stage)
    return LeadResponse.model_validate(lead)


# ---------------------------------------------------------------------------
# Activities
# ---------------------------------------------------------------------------

@router.get("/leads/{lead_id}/activities", response_model=list[ActivityResponse])
def list_activities(
    lead_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[ActivityResponse]:
    activities = lead_service.get_lead_activities(db, lead_id)
    return [ActivityResponse.model_validate(a) for a in activities]


@router.post(
    "/leads/{lead_id}/activities",
    response_model=ActivityResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_activity(
    lead_id: str,
    payload: ActivityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ActivityResponse:
    activity = lead_service.add_lead_activity(db, lead_id, payload, performed_by=current_user.id)
    return ActivityResponse.model_validate(activity)


# ---------------------------------------------------------------------------
# AI endpoints
# ---------------------------------------------------------------------------

@router.post("/leads/{lead_id}/ai/score", response_model=AiScoreResponse)
def score_lead(
    lead_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> AiScoreResponse:
    return ai_service.score_lead(db, lead_id)


@router.post("/leads/{lead_id}/ai/outreach", response_model=AiOutreachResponse)
def generate_outreach(
    lead_id: str,
    payload: AiOutreachRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> AiOutreachResponse:
    return ai_service.generate_outreach(db, lead_id, payload)


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

@router.get("/dashboard/summary", response_model=DashboardSummaryResponse)
def dashboard_summary(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> DashboardSummaryResponse:
    return dashboard_service.get_summary(db)


# ---------------------------------------------------------------------------
# Campaigns
# ---------------------------------------------------------------------------

@router.get("/campaigns", response_model=CampaignListResponse)
def list_campaigns(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=200),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> CampaignListResponse:
    return campaign_service.get_campaigns(db, page=page, limit=limit)


@router.post("/campaigns", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
def create_campaign(
    payload: CampaignCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> CampaignResponse:
    campaign = campaign_service.create_campaign(db, payload)
    return CampaignResponse.model_validate(campaign)


@router.get("/campaigns/{campaign_id}", response_model=CampaignResponse)
def get_campaign(
    campaign_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> CampaignResponse:
    campaign = campaign_service.get_campaign_by_id(db, campaign_id)
    return CampaignResponse.model_validate(campaign)


@router.patch("/campaigns/{campaign_id}", response_model=CampaignResponse)
def update_campaign(
    campaign_id: str,
    payload: CampaignUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> CampaignResponse:
    campaign = campaign_service.update_campaign(db, campaign_id, payload)
    return CampaignResponse.model_validate(campaign)


# ---------------------------------------------------------------------------
# Offers
# ---------------------------------------------------------------------------

@router.get("/offers", response_model=OfferListResponse)
def list_offers(
    niche: str | None = Query(default=None),
    network: str | None = Query(default=None),
    sort_by: str = Query(default="gravity"),
    sort_dir: str = Query(default="desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> OfferListResponse:
    return offer_service.get_offers(db, niche=niche, network=network, sort_by=sort_by, sort_dir=sort_dir)


@router.post("/offers", response_model=OfferResponse, status_code=status.HTTP_201_CREATED)
def create_offer(
    payload: OfferCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> OfferResponse:
    offer = offer_service.create_offer(db, payload)
    return OfferResponse.model_validate(offer)


# ---------------------------------------------------------------------------
# Communications
# ---------------------------------------------------------------------------

@router.get("/communications", response_model=CommunicationListResponse)
def list_communications(
    lead_id: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> CommunicationListResponse:
    return communication_service.get_communications(db, lead_id=lead_id)


@router.post("/communications", response_model=CommunicationResponse, status_code=status.HTTP_201_CREATED)
def create_communication(
    payload: CommunicationCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> CommunicationResponse:
    comm = communication_service.create_communication(db, payload)
    return CommunicationResponse.model_validate(comm)


# ---------------------------------------------------------------------------
# Integrations
# ---------------------------------------------------------------------------

@router.get("/integrations", response_model=IntegrationListResponse)
def list_integrations(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> IntegrationListResponse:
    return integration_service.get_integrations(db)


@router.post("/integrations/{platform_name}/connect", response_model=IntegrationResponse)
def connect_integration(
    platform_name: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> IntegrationResponse:
    return integration_service.connect_platform(db, platform_name)


@router.delete("/integrations/{platform_name}/disconnect", response_model=IntegrationResponse)
def disconnect_integration(
    platform_name: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> IntegrationResponse:
    return integration_service.disconnect_platform(db, platform_name)
