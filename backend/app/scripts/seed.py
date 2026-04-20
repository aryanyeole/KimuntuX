"""
Seed script — run with:
    cd backend
    python -m app.scripts.seed

Safe to re-run: skips all inserts if data already exists.
"""

from __future__ import annotations

import random
import sys
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.activity import Activity, ActivityType
from app.models.campaign import Campaign, CampaignStatus
from app.models.communication import Communication, CommunicationChannel, CommunicationDirection
from app.models.integration import Integration, IntegrationStatus, PlatformType
from app.models.lead import Lead, LeadClassification, LeadSource, LeadStage
from app.models.offer import Offer, OfferStatus, TrendDirection
from app.models.tenant import Tenant, TenantPlan
from app.models.tenant_membership import MemberRole, TenantMembership
from app.models.user import User

# ── Reproducible randomness ──────────────────────────────────────────────────
rng = random.Random(42)


def _ago(days: int = 0, hours: int = 0) -> datetime:
    return datetime.now(timezone.utc) - timedelta(days=days, hours=hours)


def _rand_ago(min_days: int, max_days: int) -> datetime:
    return _ago(days=rng.randint(min_days, max_days))


# ── Lead fixture data ─────────────────────────────────────────────────────────

_FIRST_NAMES = [
    "James", "Sophia", "Liam", "Olivia", "Noah", "Emma", "Ethan", "Ava",
    "Mason", "Isabella", "Logan", "Mia", "Lucas", "Charlotte", "Jackson",
    "Amelia", "Aiden", "Harper", "Elijah", "Evelyn", "Sebastian", "Abigail",
    "Carter", "Emily", "Owen", "Ella", "Ryan", "Scarlett", "Nathan", "Grace",
    "Aaron", "Chloe", "Isaiah", "Lily", "Caleb", "Layla", "Adam", "Zoey",
    "Julian", "Nora", "Dominic", "Riley", "Eli", "Hannah", "Evan", "Penelope",
    "Carlos", "Stella", "Marcus", "Violet",
]

_LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
    "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez",
    "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
    "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark",
    "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King",
    "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green",
    "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell",
    "Carter", "Roberts",
]

_COMPANIES = [
    "BluePeak Media", "Apex Digital LLC", "SunRise eCommerce", "TrueNorth Agency",
    "VelocityX Partners", "Zenith Growth", "Orbit Marketing Co.", "NovaSpark Inc.",
    "Ridge Capital Group", "ClearPath Solutions", "Summit Affiliates", "Luminos Media",
    "Elevate Ventures", "Crossroads Digital", "Harbor Health Products",
    "Momentum Marketing", "TerraFirm Brands", "Skyline Analytics", "PrimeCraft Agency",
    "DeltaWave Media", "CoreLogic Partners", "Pinnacle Growth Co.", "FusionHub LLC",
    "EcoFlow Digital", "Frontier Media Group", "Catalyst Agency", "Venture Bridge",
    "Nexus Commerce", "Radiant Brands", "StoneGate Digital",
]

_INDUSTRIES = [
    "Health & Wellness", "Finance & Investing", "Digital Marketing", "eCommerce",
    "SaaS", "Affiliate Marketing", "Real Estate", "Education", "Beauty & Skincare",
    "Supplements", "Insurance", "Travel", "Coaching & Consulting",
]

_JOB_TITLES = [
    "Founder", "CEO", "Head of Marketing", "Growth Manager", "Affiliate Manager",
    "VP of Sales", "Digital Strategist", "Media Buyer", "Performance Marketer",
    "CMO", "Director of Partnerships", "Business Development Manager",
]

_SOURCES = list(LeadSource)
_STAGES = list(LeadStage)
_CLASSIFICATIONS = list(LeadClassification)

_STAGE_WEIGHTS = [20, 15, 18, 15, 10, 12, 10]   # new … lost
_CLASS_WEIGHTS = [25, 35, 40]                     # hot, warm, cold


def _build_leads(n: int = 48) -> list[dict]:
    records = []
    used_emails: set[str] = set()
    for i in range(n):
        first = _FIRST_NAMES[i % len(_FIRST_NAMES)]
        last = _LAST_NAMES[i % len(_LAST_NAMES)]
        domain = rng.choice(["gmail.com", "outlook.com", "yahoo.com",
                              "hotmail.com", "protonmail.com", "icloud.com"])
        email = f"{first.lower()}.{last.lower()}{rng.randint(1, 99)}@{domain}"
        while email in used_emails:
            email = f"{first.lower()}.{last.lower()}{rng.randint(100, 999)}@{domain}"
        used_emails.add(email)

        stage = rng.choices(_STAGES, weights=_STAGE_WEIGHTS)[0]
        classification = rng.choices(_CLASSIFICATIONS, weights=_CLASS_WEIGHTS)[0]
        source = rng.choice(_SOURCES)

        base_score = {"hot": 70, "warm": 45, "cold": 20}[classification.value]
        ai_score = min(100, max(0, base_score + rng.randint(-10, 15)))

        created = _rand_ago(1, 120)
        last_contact = (
            created + timedelta(days=rng.randint(0, 14))
            if stage != LeadStage.new
            else None
        )
        converted = (
            last_contact + timedelta(days=rng.randint(1, 7))
            if stage == LeadStage.won and last_contact
            else None
        )

        records.append(dict(
            first_name=first,
            last_name=last,
            email=email,
            phone=f"+1{rng.randint(2000000000, 9999999999)}",
            company=rng.choice(_COMPANIES),
            industry=rng.choice(_INDUSTRIES),
            job_title=rng.choice(_JOB_TITLES),
            source=source,
            source_detail=rng.choice([None, "summer-campaign-v2", "affiliate-link-78", "landing-page-a"]),
            stage=stage,
            classification=classification,
            ai_score=ai_score,
            predicted_value=round(rng.uniform(200, 8000), 2),
            ltv=round(rng.uniform(0, 15000), 2) if stage == LeadStage.won else 0.0,
            tags=rng.sample(["vip", "high-value", "needs-followup", "retargeting", "newsletter"], k=rng.randint(0, 3)),
            notes=rng.choice([None, None, "Showed strong interest during demo.", "Requested pricing sheet.", "Asked about enterprise plan."]),
            custom_fields={},
            created_at=created,
            updated_at=created + timedelta(hours=rng.randint(0, 48)),
            last_contact_at=last_contact,
            converted_at=converted,
        ))
    return records


# ── Activity fixture ──────────────────────────────────────────────────────────

_ACTIVITY_POOL: list[tuple[ActivityType, str]] = [
    (ActivityType.email_sent, "Sent introduction email."),
    (ActivityType.email_opened, "Lead opened the welcome email."),
    (ActivityType.email_clicked, "Lead clicked CTA in email."),
    (ActivityType.call, "Had a 15-minute discovery call."),
    (ActivityType.meeting, "Completed Zoom demo — very engaged."),
    (ActivityType.form_submit, "Submitted contact form on landing page."),
    (ActivityType.page_visit, "Visited pricing page (3 min session)."),
    (ActivityType.ad_click, "Clicked Facebook ad — interest: weight loss."),
    (ActivityType.chatbot, "Chatbot interaction — asked about pricing."),
    (ActivityType.note_added, "Added internal note: strong buying signal."),
    (ActivityType.score_updated, "AI score recalculated to reflect recent activity."),
]


def _build_activities(lead_id: str, lead_created: datetime, count: int) -> list[dict]:
    activities = []
    for j in range(count):
        atype, desc = rng.choice(_ACTIVITY_POOL)
        ts = lead_created + timedelta(hours=rng.randint(1, 30 * 24) * (j + 1) // count)
        activities.append(dict(
            lead_id=lead_id,
            activity_type=atype,
            description=desc,
            meta=None,
            channel=rng.choice([None, "email", "phone", "web"]),
            timestamp=ts,
        ))
    return activities


# ── Campaign fixture ──────────────────────────────────────────────────────────

_CAMPAIGNS = [
    dict(
        name="Mitolyn Weight Loss — FB Cold",
        platform="facebook_ads",
        status=CampaignStatus.active,
        objective="lead_generation",
        budget_daily=150.0,
        budget_total=4500.0,
        offer_name="Mitolyn",
        offer_network="ClickBank",
        targeting={"age": "25-54", "interests": ["weight loss", "healthy living"], "geo": "US"},
        metrics={"impressions": 182000, "clicks": 5460, "leads": 312, "conversions": 28,
                 "spend": 3120.0, "revenue": 8960.0, "ctr": 3.0, "cpl": 10.0, "cpa": 111.4, "roas": 2.87},
        start_date=_ago(days=45),
        end_date=None,
    ),
    dict(
        name="CitrusBurn — Google Search",
        platform="google_ads",
        status=CampaignStatus.active,
        objective="conversions",
        budget_daily=200.0,
        budget_total=6000.0,
        offer_name="CitrusBurn",
        offer_network="BuyGoods",
        targeting={"keywords": ["citrus burn supplement", "weight loss pills"], "geo": "US, CA"},
        metrics={"impressions": 94000, "clicks": 3760, "leads": 198, "conversions": 41,
                 "spend": 4820.0, "revenue": 16400.0, "ctr": 4.0, "cpl": 24.3, "cpa": 117.6, "roas": 3.4},
        start_date=_ago(days=30),
        end_date=None,
    ),
    dict(
        name="LeanBiome — TikTok UGC",
        platform="tiktok_ads",
        status=CampaignStatus.paused,
        objective="traffic",
        budget_daily=80.0,
        budget_total=2400.0,
        offer_name="LeanBiome",
        offer_network="MaxWeb",
        targeting={"age": "18-34", "interests": ["fitness", "gut health"], "geo": "US"},
        metrics={"impressions": 520000, "clicks": 12480, "leads": 430, "conversions": 15,
                 "spend": 2200.0, "revenue": 4500.0, "ctr": 2.4, "cpl": 5.1, "cpa": 146.7, "roas": 2.05},
        start_date=_ago(days=60),
        end_date=_ago(days=10),
    ),
    dict(
        name="Wealth DNA — Email Retargeting",
        platform="email",
        status=CampaignStatus.completed,
        objective="retargeting",
        budget_daily=None,
        budget_total=800.0,
        offer_name="Wealth DNA Code",
        offer_network="ClickBank",
        targeting={"segment": "warm_leads", "list_size": 2400},
        metrics={"impressions": 2400, "clicks": 528, "leads": 89, "conversions": 22,
                 "spend": 750.0, "revenue": 6380.0, "ctr": 22.0, "cpl": 8.4, "cpa": 34.1, "roas": 8.51},
        start_date=_ago(days=90),
        end_date=_ago(days=75),
    ),
    dict(
        name="Exipure — Instagram Stories",
        platform="instagram",
        status=CampaignStatus.active,
        objective="awareness",
        budget_daily=120.0,
        budget_total=3600.0,
        offer_name="Exipure",
        offer_network="Digistore24",
        targeting={"age": "30-55", "gender": "female", "interests": ["weight management", "wellness"]},
        metrics={"impressions": 310000, "clicks": 7440, "leads": 284, "conversions": 19,
                 "spend": 2900.0, "revenue": 7220.0, "ctr": 2.4, "cpl": 10.2, "cpa": 152.6, "roas": 2.49},
        start_date=_ago(days=20),
        end_date=None,
    ),
    dict(
        name="Java Burn — YouTube Pre-roll",
        platform="youtube",
        status=CampaignStatus.draft,
        objective="conversions",
        budget_daily=250.0,
        budget_total=7500.0,
        offer_name="Java Burn",
        offer_network="ClickBank",
        targeting={"age": "35-65", "interests": ["coffee", "weight loss", "metabolism"], "geo": "US, UK, AU"},
        metrics={},
        start_date=None,
        end_date=None,
    ),
]


# ── Offer fixture ─────────────────────────────────────────────────────────────

_OFFERS = [
    # ClickBank — Health & Supplements
    dict(name="Mitolyn", niche="Weight Loss", network="ClickBank", aov=97.0, gravity=312.4,
         commission_rate=0.75, conversion_rate=0.042, trend_direction=TrendDirection.up,
         trend_value=18.3, status=OfferStatus.active),
    dict(name="Exipure", niche="Weight Loss", network="ClickBank", aov=59.0, gravity=285.7,
         commission_rate=0.75, conversion_rate=0.038, trend_direction=TrendDirection.up,
         trend_value=12.1, status=OfferStatus.active),
    dict(name="Java Burn", niche="Weight Loss", network="ClickBank", aov=49.0, gravity=198.2,
         commission_rate=0.60, conversion_rate=0.031, trend_direction=TrendDirection.stable,
         trend_value=2.4, status=OfferStatus.active),
    dict(name="Wealth DNA Code", niche="Finance & Investing", network="ClickBank", aov=37.0,
         gravity=174.5, commission_rate=0.75, conversion_rate=0.051, trend_direction=TrendDirection.up,
         trend_value=24.7, status=OfferStatus.active),
    dict(name="Manifestation Magic", niche="Self-Help", network="ClickBank", aov=27.0,
         gravity=145.8, commission_rate=0.75, conversion_rate=0.044, trend_direction=TrendDirection.stable,
         trend_value=0.8, status=OfferStatus.active),
    dict(name="Quietum Plus", niche="Health & Wellness", network="ClickBank", aov=69.0,
         gravity=132.1, commission_rate=0.75, conversion_rate=0.028, trend_direction=TrendDirection.down,
         trend_value=-5.2, status=OfferStatus.active),
    # BuyGoods — Supplements
    dict(name="CitrusBurn", niche="Weight Loss", network="BuyGoods", aov=79.0, gravity=None,
         commission_rate=0.45, conversion_rate=0.035, trend_direction=TrendDirection.up,
         trend_value=9.6, status=OfferStatus.active),
    dict(name="GlucoTrust", niche="Blood Sugar", network="BuyGoods", aov=69.0, gravity=None,
         commission_rate=0.40, conversion_rate=0.027, trend_direction=TrendDirection.up,
         trend_value=15.0, status=OfferStatus.active),
    dict(name="ProDentim", niche="Oral Health", network="BuyGoods", aov=59.0, gravity=None,
         commission_rate=0.50, conversion_rate=0.032, trend_direction=TrendDirection.stable,
         trend_value=1.2, status=OfferStatus.active),
    # MaxWeb
    dict(name="LeanBiome", niche="Weight Loss", network="MaxWeb", aov=89.0, gravity=None,
         commission_rate=0.55, conversion_rate=0.029, trend_direction=TrendDirection.up,
         trend_value=7.4, status=OfferStatus.active),
    dict(name="Ikaria Lean Belly Juice", niche="Weight Loss", network="MaxWeb", aov=69.0,
         gravity=None, commission_rate=0.50, conversion_rate=0.033, trend_direction=TrendDirection.up,
         trend_value=11.8, status=OfferStatus.active),
    dict(name="Ocuprime", niche="Eye Health", network="MaxWeb", aov=59.0, gravity=None,
         commission_rate=0.45, conversion_rate=0.021, trend_direction=TrendDirection.stable,
         trend_value=-1.0, status=OfferStatus.active),
    # Digistore24
    dict(name="Burn Boost", niche="Weight Loss", network="Digistore24", aov=57.0, gravity=None,
         commission_rate=0.60, conversion_rate=0.026, trend_direction=TrendDirection.stable,
         trend_value=3.1, status=OfferStatus.active),
    dict(name="Gluconite", niche="Blood Sugar", network="Digistore24", aov=69.0, gravity=None,
         commission_rate=0.55, conversion_rate=0.024, trend_direction=TrendDirection.down,
         trend_value=-3.8, status=OfferStatus.active),
    dict(name="Profit Genesis 3.0", niche="Make Money Online", network="Digistore24", aov=47.0,
         gravity=None, commission_rate=0.75, conversion_rate=0.019, trend_direction=TrendDirection.up,
         trend_value=6.2, status=OfferStatus.active),
    dict(name="Diabetes Freedom", niche="Blood Sugar", network="Digistore24", aov=37.0,
         gravity=None, commission_rate=0.75, conversion_rate=0.031, trend_direction=TrendDirection.stable,
         trend_value=0.5, status=OfferStatus.inactive),
]


# ── Integration fixture ───────────────────────────────────────────────────────

_INTEGRATIONS = [
    # Affiliate networks — connected
    dict(platform_name="ClickBank", platform_type=PlatformType.affiliate_network,
         status=IntegrationStatus.connected, config={"account_nickname": "kimux_main"}),
    dict(platform_name="BuyGoods", platform_type=PlatformType.affiliate_network,
         status=IntegrationStatus.connected, config={"account_id": "BG-29471"}),
    dict(platform_name="MaxWeb", platform_type=PlatformType.affiliate_network,
         status=IntegrationStatus.pending, config={}),
    dict(platform_name="Digistore24", platform_type=PlatformType.affiliate_network,
         status=IntegrationStatus.pending, config={}),
    # Ad platforms — connected
    dict(platform_name="Facebook Ads", platform_type=PlatformType.ad_platform,
         status=IntegrationStatus.connected, config={"ad_account_id": "act_1842930471"}),
    dict(platform_name="Google Ads", platform_type=PlatformType.ad_platform,
         status=IntegrationStatus.connected, config={"customer_id": "812-474-9302"}),
    dict(platform_name="TikTok Ads", platform_type=PlatformType.ad_platform,
         status=IntegrationStatus.pending, config={}),
    dict(platform_name="Instagram", platform_type=PlatformType.ad_platform,
         status=IntegrationStatus.connected, config={"via": "Facebook Business Manager"}),
    dict(platform_name="YouTube Ads", platform_type=PlatformType.ad_platform,
         status=IntegrationStatus.disconnected, config={}),
    # Payment
    dict(platform_name="Stripe", platform_type=PlatformType.payment_gateway,
         status=IntegrationStatus.pending, config={}),
    dict(platform_name="PayPal", platform_type=PlatformType.payment_gateway,
         status=IntegrationStatus.pending, config={}),
    # Tools — disconnected
    dict(platform_name="Zapier", platform_type=PlatformType.tool,
         status=IntegrationStatus.disconnected, config={}),
    dict(platform_name="Shopify", platform_type=PlatformType.tool,
         status=IntegrationStatus.disconnected, config={}),
    dict(platform_name="WooCommerce", platform_type=PlatformType.tool,
         status=IntegrationStatus.disconnected, config={}),
    dict(platform_name="Klaviyo", platform_type=PlatformType.tool,
         status=IntegrationStatus.disconnected, config={}),
]


# ── Communication fixture ─────────────────────────────────────────────────────

_COMM_SUBJECTS = [
    "Following up on your interest",
    "Quick question about your goals",
    "Exclusive offer — just for you",
    "Your free consultation is ready",
    "We noticed you visited our pricing page",
    "Ready to get started?",
    "Checking in — any questions?",
]

_COMM_BODIES = [
    "Hi there,\n\nJust wanted to follow up and see if you had any questions about our platform. "
    "We have helped hundreds of affiliates grow their revenue.\n\nLet us know how we can help!\n\nBest,\nKimuX Team",
    "Hey!\n\nWe saw you checked out our pricing page. Would love to connect and walk you through "
    "the best plan for your business.\n\nCheers,\nKimuX Team",
    "Hi,\n\nYou are receiving this because you expressed interest in our services. "
    "We have a limited-time offer just for new partners.\n\nReply to claim yours!\n\nKimuX Team",
    "Hello,\n\nJust checking in to make sure you got everything you needed from our last conversation. "
    "Happy to answer any questions!\n\nKimuX",
    "Hi there,\n\nI wanted to personally reach out and invite you to a free 30-minute strategy session. "
    "No strings attached.\n\nBook here: calendly.com/kimux\n\nKimuX Team",
    "Hey,\n\nThought you might be interested in our latest performance data — "
    "affiliates on our platform averaged 3.2x ROAS last quarter.\n\nWant to see how?\n\nKimuX",
    "Hi,\n\nJust a friendly reminder that your trial access expires soon. "
    "Upgrade now and lock in your founding member rate.\n\nKimuX Team",
]


# ── Main seed function ────────────────────────────────────────────────────────

def _grant_all_users_demo_membership(db, demo_tenant_id: str) -> None:
    """DEV ONLY: grant every existing user membership + default_tenant to demo tenant.

    Remove this before production — in production each user gets their own tenant.
    """
    users = db.scalars(select(User)).all()
    for user in users:
        existing_membership = db.scalar(
            select(TenantMembership).where(
                TenantMembership.tenant_id == demo_tenant_id,
                TenantMembership.user_id == user.id,
            )
        )
        if not existing_membership:
            db.add(TenantMembership(
                tenant_id=demo_tenant_id,
                user_id=user.id,
                role=MemberRole.member,
            ))
        if not user.default_tenant_id:
            user.default_tenant_id = demo_tenant_id
    db.flush()
    if users:
        print(f"  Granted {len(users)} user(s) membership to KimuX Demo tenant.")


def seed() -> None:
    db = SessionLocal()
    try:
        # 0. Ensure KimuX Demo tenant exists (idempotent)
        demo_tenant = db.scalar(select(Tenant).where(Tenant.slug == "kimux-demo"))
        if demo_tenant is None:
            demo_tenant = Tenant(name="KimuX Demo", slug="kimux-demo", plan=TenantPlan.free)
            db.add(demo_tenant)
            db.flush()

        tenant_id = demo_tenant.id

        # DEV ONLY: always grant all users membership to demo tenant
        _grant_all_users_demo_membership(db, tenant_id)

        # Guard: skip data seeding if leads already exist
        existing = db.scalar(select(Lead.id).limit(1))
        if existing:
            db.commit()
            print("Database already has data — skipping data seed. (User memberships updated.)")
            return

        print("Seeding database...")

        # 1. Leads
        lead_data = _build_leads(48)
        lead_objs: list[Lead] = []
        for d in lead_data:
            lead = Lead(**d, tenant_id=tenant_id)
            db.add(lead)
            lead_objs.append(lead)
        db.flush()  # populate lead.id without committing

        # 2. Activities (3–6 per lead)
        for lead in lead_objs:
            count = rng.randint(3, 6)
            for act_data in _build_activities(lead.id, lead.created_at, count):
                db.add(Activity(**act_data, tenant_id=tenant_id))

        # 3. Campaigns
        for c in _CAMPAIGNS:
            db.add(Campaign(**c, tenant_id=tenant_id))

        # 4. Offers
        for o in _OFFERS:
            db.add(Offer(**o, tenant_id=tenant_id))

        # 5. Integrations
        for intg in _INTEGRATIONS:
            connected_at = _rand_ago(10, 60) if intg["status"] == IntegrationStatus.connected else None
            last_sync = _rand_ago(0, 3) if intg["status"] == IntegrationStatus.connected else None
            db.add(Integration(**intg, tenant_id=tenant_id, connected_at=connected_at, last_sync_at=last_sync))

        # 6. Communications (pick 7 random leads, 1 comm each)
        sample_leads = rng.sample(lead_objs, min(7, len(lead_objs)))
        channels = [CommunicationChannel.email, CommunicationChannel.sms,
                    CommunicationChannel.whatsapp, CommunicationChannel.email,
                    CommunicationChannel.email, CommunicationChannel.chatbot,
                    CommunicationChannel.email]
        directions = [CommunicationDirection.outbound] * 5 + [CommunicationDirection.inbound] * 2
        rng.shuffle(directions)

        for idx, lead in enumerate(sample_leads):
            body = _COMM_BODIES[idx % len(_COMM_BODIES)]
            subject = _COMM_SUBJECTS[idx % len(_COMM_SUBJECTS)]
            channel = channels[idx % len(channels)]
            direction = directions[idx % len(directions)]
            db.add(Communication(
                lead_id=lead.id,
                tenant_id=tenant_id,
                channel=channel,
                direction=direction,
                subject=subject if channel == CommunicationChannel.email else None,
                body=body,
                preview=body[:100].replace("\n", " "),
                read=rng.choice([True, False]),
                timestamp=_rand_ago(0, 30),
            ))

        db.commit()
        print(f"  Tenant: KimuX Demo (id={tenant_id})")
        print(f"  {len(lead_objs)} leads created.")
        print(f"  Activities created (3–6 per lead).")
        print(f"  {len(_CAMPAIGNS)} campaigns created.")
        print(f"  {len(_OFFERS)} offers created.")
        print(f"  {len(_INTEGRATIONS)} integrations created.")
        print(f"  {len(sample_leads)} communications created.")
        print("Seed complete.")

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
    sys.exit(0)
