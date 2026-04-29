from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user
from app.core.tenancy import get_current_tenant
from app.models.campaign import CampaignStatus
from app.models.lead import LeadClassification, LeadSource, LeadStage
from app.models.tenant import Tenant
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
from app.schemas.offer import (
    AccountStatusResponse,
    ClickBankConnectRequest,
    MarketplaceStatusResponse,
    MarketplaceSyncResponse,
    OfferCreate,
    OfferListResponse,
    OfferResponse,
)
from app.schemas.strategy import StrategyListResponse, StrategyResponse, StrategyWizardInput
from app.services import (
    ai_service,
    campaign_service,
    communication_service,
    dashboard_service,
    integration_service,
    lead_service,
    offer_service,
    strategy_service,
)
from app.services.campaign_analysis_service import CampaignAnalysisService
from app.services.test_metrics_service import TestMetricsService

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
    tenant: Tenant = Depends(get_current_tenant),
) -> LeadListResponse:
    return lead_service.get_leads(
        db,
        tenant_id=tenant.id,
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
    tenant: Tenant = Depends(get_current_tenant),
) -> LeadResponse:
    lead = lead_service.create_lead(db, payload, tenant.id)
    return LeadResponse.model_validate(lead)


@router.get("/leads/{lead_id}", response_model=LeadResponse)
def get_lead(
    lead_id: str,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
) -> LeadResponse:
    lead = lead_service.get_lead_by_id(db, lead_id, tenant.id)
    return LeadResponse.model_validate(lead)


@router.patch("/leads/{lead_id}", response_model=LeadResponse)
def update_lead(
    lead_id: str,
    payload: LeadUpdate,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
) -> LeadResponse:
    lead = lead_service.update_lead(db, lead_id, payload, tenant.id)
    return LeadResponse.model_validate(lead)


@router.delete("/leads/{lead_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
def delete_lead(
    lead_id: str,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
) -> Response:
    lead_service.delete_lead(db, lead_id, tenant.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Stage transition
# ---------------------------------------------------------------------------

@router.patch("/leads/{lead_id}/stage", response_model=LeadResponse)
def update_stage(
    lead_id: str,
    payload: LeadStageUpdate,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
) -> LeadResponse:
    lead = lead_service.update_lead_stage(db, lead_id, payload.stage, tenant.id)
    return LeadResponse.model_validate(lead)


# ---------------------------------------------------------------------------
# Activities
# ---------------------------------------------------------------------------

@router.get("/leads/{lead_id}/activities", response_model=list[ActivityResponse])
def list_activities(
    lead_id: str,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
) -> list[ActivityResponse]:
    activities = lead_service.get_lead_activities(db, lead_id, tenant.id)
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
    tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
) -> ActivityResponse:
    activity = lead_service.add_lead_activity(
        db, lead_id, payload, tenant.id, performed_by=current_user.id
    )
    return ActivityResponse.model_validate(activity)


# ---------------------------------------------------------------------------
# AI endpoints
# ---------------------------------------------------------------------------

@router.post("/leads/import-from-contacts")
def import_contacts(
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
) -> dict:
    """Convert all ContactSubmission records that have no matching Lead by email."""
    return lead_service.import_contacts_as_leads(db, tenant.id)


@router.post("/leads/ai/score-all")
def score_all_leads(
    force: bool = Query(default=False, description="When true, re-score all leads regardless of current score"),
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
) -> dict:
    """Bulk-score leads. force=false skips already-scored leads; force=true re-scores everything."""
    return ai_service.score_all_unscored(db, tenant.id, force=force)


@router.post("/leads/{lead_id}/ai/score", response_model=AiScoreResponse)
def score_lead(
    lead_id: str,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
) -> AiScoreResponse:
    return ai_service.score_lead(db, lead_id, tenant.id)


@router.post("/leads/{lead_id}/ai/outreach", response_model=AiOutreachResponse)
def generate_outreach(
    lead_id: str,
    payload: AiOutreachRequest,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
) -> AiOutreachResponse:
    return ai_service.generate_outreach(db, lead_id, tenant.id, payload)


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

@router.get("/dashboard/summary", response_model=DashboardSummaryResponse)
def dashboard_summary(
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
) -> DashboardSummaryResponse:
    return dashboard_service.get_summary(db, tenant.id)


# ---------------------------------------------------------------------------
# Campaigns
# ---------------------------------------------------------------------------

@router.get("/campaigns", response_model=CampaignListResponse)
def list_campaigns(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=200),
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
) -> CampaignListResponse:
    return campaign_service.get_campaigns(
        db,
        tenant_id=tenant.id,
        page=page,
        limit=limit,
        test_mode=settings.campaign_test_mode,
    )


@router.post("/campaigns", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
def create_campaign(
    payload: CampaignCreate,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
) -> CampaignResponse:
    campaign = campaign_service.create_campaign(db, payload, tenant_id=tenant.id)
    return CampaignResponse.model_validate(campaign)


@router.get("/campaigns/{campaign_id}", response_model=CampaignResponse)
def get_campaign(
    campaign_id: str,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
) -> CampaignResponse:
    campaign = campaign_service.get_campaign_by_id(db, campaign_id, tenant_id=tenant.id)
    return CampaignResponse.model_validate(campaign)


@router.patch("/campaigns/{campaign_id}", response_model=CampaignResponse)
def update_campaign(
    campaign_id: str,
    payload: CampaignUpdate,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
) -> CampaignResponse:
    campaign = campaign_service.update_campaign(db, campaign_id, payload, tenant_id=tenant.id)
    return CampaignResponse.model_validate(campaign)


@router.post("/campaigns/{campaign_id}/analyze")
async def analyze_campaign(
    campaign_id: str,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
) -> dict:
    campaign = campaign_service.get_campaign_by_id(db, campaign_id, tenant_id=tenant.id)
    campaign_payload = TestMetricsService.inject_metrics([campaign], settings.campaign_test_mode)[0]
    return await CampaignAnalysisService().analyze(campaign_payload)


# ---------------------------------------------------------------------------
# Offers
# ---------------------------------------------------------------------------

@router.get("/offers", response_model=OfferListResponse)
def list_offers(
    niche: str | None = Query(default=None),
    network: str | None = Query(default=None),
    source: str | None = Query(default=None),
    sort_by: str = Query(default="gravity"),
    sort_dir: str = Query(default="desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
) -> OfferListResponse:
    return offer_service.get_offers(
        db, tenant.id, niche=niche, network=network, source=source,
        sort_by=sort_by, sort_dir=sort_dir,
    )


@router.post("/offers", response_model=OfferResponse, status_code=status.HTTP_201_CREATED)
def create_offer(
    payload: OfferCreate,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
) -> OfferResponse:
    offer = offer_service.create_offer(db, payload, tenant.id)
    return OfferResponse.model_validate(offer)


@router.post("/offers/marketplace/sync", response_model=MarketplaceSyncResponse)
def sync_marketplace(
    db: Session = Depends(get_db),
    _tenant: Tenant = Depends(get_current_tenant),
) -> MarketplaceSyncResponse:
    """Sync public ClickBank marketplace offers into the system tenant (platform creds)."""
    return offer_service.sync_marketplace_offers(db)


@router.get("/offers/marketplace/status", response_model=MarketplaceStatusResponse)
def marketplace_status(
    db: Session = Depends(get_db),
    _tenant: Tenant = Depends(get_current_tenant),
) -> MarketplaceStatusResponse:
    """Return marketplace offer count and last sync timestamp."""
    return offer_service.get_marketplace_status(db)


# ---------------------------------------------------------------------------
# Communications
# ---------------------------------------------------------------------------

@router.get("/communications", response_model=CommunicationListResponse)
def list_communications(
    lead_id: str | None = Query(default=None),
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
) -> CommunicationListResponse:
    return communication_service.get_communications(db, tenant.id, lead_id=lead_id)


@router.post("/communications", response_model=CommunicationResponse, status_code=status.HTTP_201_CREATED)
def create_communication(
    payload: CommunicationCreate,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
) -> CommunicationResponse:
    comm = communication_service.create_communication(db, payload, tenant.id)
    return CommunicationResponse.model_validate(comm)


# ---------------------------------------------------------------------------
# Integrations
# ---------------------------------------------------------------------------

@router.get("/integrations", response_model=IntegrationListResponse)
def list_integrations(
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
) -> IntegrationListResponse:
    return integration_service.get_integrations(db, tenant.id)


@router.post("/integrations/{platform_name}/connect", response_model=IntegrationResponse)
def connect_integration(
    platform_name: str,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
) -> IntegrationResponse:
    return integration_service.connect_platform(db, platform_name, tenant.id)


@router.delete("/integrations/{platform_name}/disconnect", response_model=IntegrationResponse)
def disconnect_integration(
    platform_name: str,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
) -> IntegrationResponse:
    return integration_service.disconnect_platform(db, platform_name, tenant.id)


# ── ClickBank account-level endpoints ─────────────────────────────────────────

@router.post("/integrations/clickbank/account/connect", response_model=AccountStatusResponse)
def connect_clickbank(
    payload: ClickBankConnectRequest,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
) -> AccountStatusResponse:
    """Validate and encrypt tenant ClickBank API credentials."""
    return integration_service.connect_clickbank_account(db, tenant.id, payload)


@router.delete("/integrations/clickbank/account/disconnect")
def disconnect_clickbank(
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
) -> dict:
    """Remove tenant ClickBank credentials (synced offers are kept)."""
    return integration_service.disconnect_clickbank_account(db, tenant.id)


@router.get("/integrations/clickbank/account/status", response_model=AccountStatusResponse)
def clickbank_account_status(
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
) -> AccountStatusResponse:
    """Return connection status, offer count, and last sync time for tenant's ClickBank account."""
    return integration_service.get_clickbank_account_status(db, tenant.id)


@router.post("/integrations/clickbank/account/sync", response_model=MarketplaceSyncResponse)
def sync_clickbank_account(
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
) -> MarketplaceSyncResponse:
    """Sync tenant's ClickBank account products using their stored credentials."""
    return offer_service.sync_tenant_clickbank_offers(db, tenant.id)


# ---------------------------------------------------------------------------
# Strategy Marketing Engine
# ---------------------------------------------------------------------------

@router.post("/strategy", response_model=StrategyResponse, status_code=status.HTTP_201_CREATED)
def create_strategy(
    payload: StrategyWizardInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StrategyResponse:
    """Submit wizard answers, generate AI marketing strategy, return completed strategy."""
    strategy = strategy_service.create_strategy(db, str(current_user.id), payload)
    return StrategyResponse.model_validate(strategy)


@router.get("/strategy", response_model=StrategyListResponse)
def list_strategies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StrategyListResponse:
    """Return all strategies for the authenticated user, newest first."""
    strategies = strategy_service.get_user_strategies(db, str(current_user.id))
    return StrategyListResponse(
        data=[StrategyResponse.model_validate(s) for s in strategies],
        total=len(strategies),
    )


@router.get("/strategy/{strategy_id}", response_model=StrategyResponse)
def get_strategy(
    strategy_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StrategyResponse:
    """Return a single strategy. Returns 404 if it doesn't belong to the current user."""
    strategy = strategy_service.get_strategy_by_id(db, strategy_id, str(current_user.id))
    return StrategyResponse.model_validate(strategy)
