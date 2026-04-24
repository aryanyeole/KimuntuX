# CLAUDE.md — KimuX CRM Development Guide

## Current Status (as of April 2026)

The CRM module is fully built and wired end-to-end. This is not a prototype — every page talks to the real backend.

**Backend**
- 11 SQLAlchemy models with Alembic migrations: Tenant, TenantMembership, User, Lead, Activity, Communication, Campaign, Offer, Integration, IntegrationCredential, WebhookEvent
- 40+ CRM API endpoints under `/api/v1/crm/` — all require JWT auth + tenant resolution (`X-Tenant-ID` header or `default_tenant_id`)
- Webhook endpoints under `/api/v1/webhooks/` — no auth (SendGrid calls these); `POST /sendgrid/events`, `POST /sendgrid/inbound`
- Service layer: `lead_service`, `campaign_service`, `offer_service`, `communication_service`, `integration_service`, `dashboard_service`, `ai_service`
- Gemini AI integration (gemini-2.5-flash via `google-genai`) for lead scoring and outreach generation; rule-based fallback when key is absent or call fails
- Contact-to-lead pipeline: every landing page form submission automatically creates a CRM lead assigned to the system tenant
- Seed script at `backend/app/scripts/seed.py` — run with `python -m app.scripts.seed` (creates KimuX Demo tenant; **DEV ONLY:** also grants all existing users membership to demo tenant so dev accounts see data — remove before production)
- **123 passing integration tests** including 7 tenant isolation tests + 15 ClickBank/account tests + 11 offer catalog tests + 16 reply-token/signature tests + 16 communication-service tests + 14 webhook-endpoint tests + 11 SendGrid-integration tests: `cd backend && python -m pytest tests/ -v`
- Multi-tenancy: every query in every service is filtered by `tenant_id`; `SYSTEM_TENANT_ID = "00000000-0000-0000-0000-000000000001"` holds contact-form leads + curated offers
- Fernet encryption for tenant credentials (`KIMUX_FERNET_KEY` env var); `backend/app/core/encryption.py`
- ClickBank API client at `backend/app/integrations/clickbank.py` — single developer key, `Authorization: <key>` header (post-Aug 2023 auth model)
- SendGrid client at `backend/app/integrations/sendgrid_client.py` — outbound send + ECDSA-P256 signature verification for event/inbound webhooks
- Reply-to address tokens at `backend/app/core/reply_tokens.py` — HMAC-SHA256, base64url-encoded, encode `tenant_id:lead_id:comm_id` for inbound routing
- Fail-fast: server refuses to start if `KIMUX_FERNET_KEY` or `KIMUX_REPLY_TOKEN_SECRET` is missing; also fails if `SENDGRID_API_KEY` is set without `SENDGRID_EVENT_WEBHOOK_PUBLIC_KEY`

**Required env vars** (see `backend/.env.example` for full documentation):
- `KIMUX_FERNET_KEY` — Fernet key for tenant credential encryption. Generate: `python -m app.scripts.generate_fernet_key`
- `KIMUX_REPLY_TOKEN_SECRET` — HMAC secret for reply-to address tokens. Generate: `python -c "import secrets; print(secrets.token_hex(32))"`
- `SENDGRID_API_KEY` — Platform SendGrid account key. Optional in dev; required for outbound email.
- `SENDGRID_EVENT_WEBHOOK_PUBLIC_KEY` — ECDSA public key from SendGrid Mail Settings → Event Webhook. Required if `SENDGRID_API_KEY` is set.
- `SENDGRID_INBOUND_PUBLIC_KEY` — Same key for Inbound Parse signature (can be the same as event key). Only needed if `SENDGRID_INBOUND_VERIFY=true`.

**Frontend**
- `src/services/api.js` — centralized fetch wrapper with JWT auth headers + `X-Tenant-ID` header (reads from `localStorage.kimuntu_tenant_id`)
- `src/contexts/TenantContext.js` — `currentTenant` state, `setCurrentTenant`, `clearTenant`; persisted to localStorage; listens for `kimuntu-tenant-updated` custom DOM event to re-hydrate when UserContext bootstraps tenant during boot
- `src/contexts/UserContext.js` — async boot: if `kimuntu_token` exists but `kimuntu_tenant_id` is absent, calls `GET /auth/me/tenant` and writes tenant to localStorage before setting `isLoading = false` (fixes pre-Phase-1 users seeing "No tenant selected")
- `src/layouts/CRMLayout.js` — loading gate: returns spinner while `isLoading` is true, preventing CRM API calls before tenant is resolved
- 8 custom hooks in `src/hooks/`: `useApi`, `useDashboard`, `useLeads`, `useLead`, `useCampaigns`, `useOffers`, `useCommunications`, `useIntegrations`
- `useIntegrations` now exposes `isSendGridConnected`, `sendgridIntegration`, `connectSendGrid`, `disconnectSendGrid`, `sendSendGridTestEmail`
- `useCommunications` now exposes `sendEmail(leadId, {subject, body})` — POSTs to the new lead-scoped send endpoint
- CRM nested routing under `/crm` with collapsible sidebar (`src/layouts/CRMLayout.js`); global Header/Footer suppressed inside CRM
- Tenant name shown in CRM TopBar
- 8 CRM pages all wired to real backend data:
  - `/crm/dashboard` — KPIs, AI insights, pipeline summary, source breakdown, recent leads
  - `/crm/leads` — paginated table, search/filter/sort, slide-in detail drawer with AI assist + Comms tab + Send button (disabled until sender configured)
  - `/crm/pipeline` — HTML5 drag-and-drop kanban, stage changes persisted via API
  - `/crm/campaigns` — metrics table with computed KPIs
  - `/crm/offers` — affiliate offer discovery with niche/network filters
  - `/crm/communication` — split-pane inbox, AI reply via Gemini
  - `/crm/analytics` — score distribution, pipeline bars, ROI table
  - `/crm/settings` — integrations grid + Email Sender card (sender config, test-send button), AI config toggles, team list

**Phase 3 — SendGrid integration ✅ COMPLETE**

What's live:
- Outbound email send from the lead drawer AI Assist tab (`POST /api/v1/crm/leads/{id}/communications/send-email`). Reply-to address encodes tenant/lead/comm IDs as an HMAC token.
- SendGrid Event Webhook receiver (`POST /api/v1/webhooks/sendgrid/events`) — maps delivered/open/click/bounce events to Activity rows and upgrades Communication.status via a one-way precedence ladder (never downgrades).
- SendGrid Inbound Parse receiver (`POST /api/v1/webhooks/sendgrid/inbound`) — parses multipart from cached raw bytes (stream consumed before signature check), routes via token path first, fallback by from_email match. Cross-tenant ambiguity is explicitly rejected.
- Email sender config in Settings (`POST /api/v1/crm/integrations/sendgrid/connect`) — stores sender_email + sender_name in Integration.config (no secrets). "Send test email" button hits real SendGrid.
- Status pills on Communication tab in lead drawer: queued (gray) → sent (light blue) → delivered (blue) → opened (amber) → clicked (green) → bounced/failed (red).

**Phase 3 known limitations (to address in Phase 5):**
- `reply.kimux.io` MX record is not configured. Inbound email replies only work via direct `POST /api/v1/webhooks/sendgrid/inbound` calls (e.g., from SendGrid's Inbound Parse webhook). Until Phase 5 (DNS + deployment), real reply routing from email clients is not active.
- Single platform-owned SendGrid account for all tenants. Sender identity is stored per-tenant in Integration.config, but the API key is shared. Phase 5 will add per-tenant SendGrid subuser provisioning and sender verification (domain auth via DNS).

**What is NOT yet built**
- Background jobs / task queue (Celery, ARQ, etc.)
- Webhook receivers for ad platforms
- Real integration SDK wiring for non-ClickBank platforms (connections are mock status toggles)
- Multi-step campaign creation modal
- SQLAlchemy do_orm_execute guard (service-layer filtering is enforced; DB-level guard is a future hardening step)
- Tenant switcher UI (single tenant per user for now)

---

---

## Roadmap to Production (Path A — started April 2026)

The CRM is functionally complete as a standalone tool but has integration
placeholders that need to be made real before public launch. These five phases
take it from "working shell" to "deployable SaaS."

### Phase 1 — Multi-tenancy enforcement ✅ COMPLETE
Tenant + TenantMembership tables. All CRM queries scoped by tenant_id.
X-Tenant-ID header on frontend requests. Async boot sequence resolves
tenant before CRM renders. Seed script grants all existing users demo
tenant membership (DEV ONLY). 7 tenant isolation tests pass.

### Phase 2 — ClickBank integration ✅ COMPLETE (superseded by Phase 2.5 pivot)
Original dual-credential implementation complete. Retained for account-level
sync; marketplace-sync portion deprecated in Phase 2.5.

### Phase 2.5 — Offer catalog pivot ✅ COMPLETE
Strategy pivot after discovering ClickBank REST API does not expose marketplace
discovery (only account-scoped data via `site=` parameter). Scraping rejected
as core data source (fragile, ToS-risky). New approach: curated catalog + AI
intelligence layer + user-added offers + crowdsourcing foundation.

**What changes from Phase 2:**
- Platform ClickBank credentials + marketplace auto-sync → DEPRECATED. Remove
  CLICKBANK_DEVELOPER_KEY env var. Remove `sync_marketplace_offers` and cold-
  start logic from offer_service. Remove platform marketplace endpoints. Keep
  ClickBankClient class but only for tenant account sync.
- `source="clickbank_marketplace"` → rename to `source="curated"`. Data is now
  human-curated, not API-synced. Can come from any network, not just ClickBank.
- `source="clickbank_account"` → unchanged. Still Fernet-encrypted tenant creds.
- New source value: `source="user_added"` — user-entered offers they're tracking.

**What's new in Phase 2.5:**
- Curated catalog seeded with ~50 real offers across ClickBank, BuyGoods,
  MaxWeb, Digistore24 (hybrid: Claude Code generates starter set, human verifies)
- Admin CRUD interface at `/admin/offers` for catalog management without
  redeploys. Protected by a new `is_platform_admin` boolean on User.
- User-added offers: "+ Add Offer" button and form on Offers page. Private to
  the tenant. Foundation for future crowdsourcing features.
- AI intelligence layer: each curated offer tagged by Gemini with traffic fit
  (TikTok-friendly, Email-friendly, Paid Ads, Organic SEO) and audience
  (Beginner-friendly, High-ticket, Recurring, Low-competition). Tags stored
  as JSON array on Offer.ai_tags. New offer_service function
  `regenerate_ai_tags_for_offer(offer)`.
- Offers page: three sections — "My ClickBank Account" (synced), "Curated
  Trending" (platform curated), "My Tracked Offers" (user-added). Tag chips on
  every offer card. New filter: "Show by tag" multi-select.
- Dashboard: replace empty AI Insights panel (or enhance current empty state)
  with "Top 5 offers for your strategy" — simple rule for MVP: match offers
  to tenant's Strategy Engine niche + top channel tags.

**What Phase 2.5 is NOT:**
- No scraping (rejected as core data source)
- No XML feed ingestion (can come later, not MVP)
- No "Trending among users" surface (needs user volume first; capture data now,
  surface later)
- No multi-network OAuth (only ClickBank has usable API anyway)

**Tenant isolation exceptions (updated list):**
1. `offer_service._list_offers_for_tenant`: includes `SYSTEM_TENANT_ID` offers
   with `source="curated"` alongside tenant's own offers. Rationale: curated
   catalog is public reference data, not another tenant's private data.

Phase 3 adds no new exceptions. The inbound fallback routing in
`communication_service.ingest_inbound_parse` explicitly returns unroutable
(tenant_id=null, no Communication created) when a sender's from_email matches
outbound comms across more than one tenant — it never picks one arbitrarily.


### Phase 3 — SendGrid integration ✅ COMPLETE
Outbound email send from lead drawer AI Assist tab. Reply-to address tokens
(HMAC-SHA256) encode tenant/lead/comm IDs for inbound routing. Event webhook
maps delivered/open/click/bounce to Activity rows + Communication status via
one-way precedence ladder. Inbound Parse routes by token first, fallback by
from_email (cross-tenant ambiguity explicitly rejected). Email sender config
card in Settings with real test-send. 123 tests pass.

**Limitations deferred to Phase 5:** `reply.kimux.io` MX record not yet
configured (inbound only works via direct webhook POST); single platform
SendGrid account (per-tenant subuser provisioning + sender verification in
Phase 5).

### Phase 4 — Google OAuth (login only) ⬜ NOT STARTED
"Sign in with Google" on login page. Establishes the OAuth pattern that
Meta/Google Ads/TikTok Ads will reuse. oauth_accounts table.

### Phase 5 — AWS deployment + monitoring + honest UI ⬜ NOT STARTED
RDS Postgres, ECS Fargate, S3+CloudFront, Route 53, ACM SSL, Sentry on
frontend and backend. Integration settings gets honest status labels
(available | coming_soon | in_review | connected) so unconnected
integrations do not lie to users.

### Explicitly deferred until after launch
- Meta/Google/TikTok/Instagram Ads OAuth + data sync (scaffolded with
  "in_review" labels at launch)
- Other affiliate networks (BuyGoods, MaxWeb, Digistore24)
- Background job queue (Celery/ARQ)
- Content Creation Suite, Funnel Builder, KimuX Academy
- Role-based permissions beyond basic tenant membership
- Billing and plan enforcement

---

## Project Identity

**KimuX** is an AI-powered digital brokerage, fintech, and marketing platform. The CRM is one core module inside a larger modular, API-first, multi-tenant SaaS product. The broader platform vision includes affiliate/reseller tools, funnel/page builder, campaign analytics, blockchain-backed transparency, fintech/payment features, eCommerce, and a developer ecosystem. **The immediate goal is building the CRM module properly inside the existing web app.**

## What the CRM Does

- Tracks leads, clients, and affiliates across the full affiliate marketing lifecycle
- Integrates with affiliate networks (ClickBank, BuyGoods, MaxWeb, Digistore24) for product/offer discovery
- Manages ad campaigns across Facebook, Google, TikTok, Instagram, YouTube
- Scores and segments leads using AI (hot/warm/cold classification)
- Automates follow-ups and onboarding sequences
- Generates personalized outreach using AI
- Supports predictive analytics (CLV, churn risk, ROI suggestions)
- Tracks communication history across email, SMS, WhatsApp, chatbot
- Connects campaign data to lead intelligence and conversion tracking
- Provides reporting dashboards with real-time analytics

## CRM Workflow (in order)

1. User connects affiliate networks and ad platforms (Settings/Integrations)
2. User discovers trending offers to promote (Offers page — niche + network selection)
3. User creates campaigns linked to offers, targeting specific platforms (Campaigns)
4. Leads are captured from ads, landing pages, affiliate links, website widgets
5. AI scores and segments leads automatically
6. AI generates engagement content and outreach drafts
7. Workflow automation handles follow-ups based on lead behavior
8. Predictive analytics surface CLV, churn risk, conversion probability
9. Conversions and transactions are tracked
10. Post-sale engagement and upsell sequences run
11. Reporting dashboards summarize everything

## Tech Stack

### Frontend
- **Framework:** React 19 (Create React App)
- **Routing:** react-router-dom 6
- **Styling:** styled-components (NO Tailwind, NO CSS modules, NO TypeScript)
- **Charts:** recharts
- **State:** React context + local state (NO Redux, NO Zustand, NO TanStack Query)
- **Language:** JavaScript (.js files only, no .ts/.tsx)

### Backend
- **Framework:** FastAPI (Python)
- **ORM:** SQLAlchemy
- **Migrations:** Alembic
- **Database:** PostgreSQL (local: `postgresql://kimux:kimux_dev@localhost:5432/kimux_crm`)
- **Auth:** JWT via python-jose, password hashing via passlib
- **Validation:** Pydantic v2 schemas
- **Language:** Python 3.11+

## Current Repo Structure (What Already Exists)

### Frontend — what's real vs mock
- `src/App.js` — app shell with ThemeProvider, UserProvider, BrowserRouter, routes
- `src/contexts/UserContext.js` — auth state, login/logout, localStorage persistence (REAL, do not break)
- `src/contexts/ThemeContext.js` — dark/light mode toggle (REAL)
- `src/components/Header.js` — global nav header (REAL, do not break)
- `src/components/Footer.js` — global footer (REAL, do not break)
- `src/components/LandingPage.js` — marketing page with contact form posting to backend (REAL, the form submission is the only real lead capture surface)
- `src/pages/LoginPage.js` — auth flow calling backend (REAL)
- `src/pages/SignupPage.js` — auth flow calling backend (REAL)
- `src/pages/CRMPage.js` — MOCK dashboard at `/crm` route. Replace this with real CRM.
- `src/pages/CRMMain.js` — UNUSED but better CRM shell with tabs for Leads, Campaigns, Communication, Payouts, Reports, Settings. Wire this to `/crm` route.
- `src/components/KpiCard.js` — reusable KPI card component (mock data, but good UI)
- `src/components/LeadsTable.js` — reads from `src/data/leads.json`, opens drawer (mock, but good UI pattern)
- `src/components/LeadDrawer.js` — lead detail side panel (mock, good pattern)
- `src/components/PipelineKanban.js` — 5-column kanban (mock, hardcoded, non-interactive)
- `src/components/CampaignsSnapshot.js` — recharts campaign charts (mock, good pattern)
- `src/components/CommunicationPlaceholder.js` — split-pane inbox layout (explicit placeholder)
- `src/components/ReportsGrid.js` — chart cards layout (mock)
- `src/components/SettingsIntegrations.js` — integration cards with connect buttons (mock)
- `src/data/leads.json` — sample lead data
- `src/data/campaigns.json` — sample campaign data

### Backend — what's real
- `backend/app/main.py` — FastAPI app entry, CORS config
- `backend/app/core/config.py` — Settings with DATABASE_URL (defaults SQLite, override with env)
- `backend/app/core/database.py` — SQLAlchemy engine, SessionLocal, Base, get_db dependency
- `backend/app/core/security.py` — JWT creation/verification, password hashing
- `backend/app/routers/auth.py` — POST /signup, POST /login, POST /token, GET /me (ALL REAL)
- `backend/app/routers/contacts.py` — POST /contact (REAL, stores ContactSubmission)
- `backend/app/models/user.py` — User model (id, full_name, email, hashed_password, is_active, timestamps)
- `backend/app/models/contact_submission.py` — ContactSubmission model
- `backend/app/schemas/auth.py` — Pydantic schemas for auth
- `backend/app/schemas/contact.py` — Pydantic schemas for contact form

### Backend — CRM (all real, all wired)
- `backend/app/models/` — Lead, Activity, Communication, Campaign, Offer, Integration (+ User, ContactSubmission)
- `backend/app/schemas/` — Pydantic v2 schemas for all models (Create, Update, Response, List variants)
- `backend/app/services/` — lead_service, campaign_service, offer_service, communication_service, integration_service, dashboard_service, ai_service
- `backend/app/routers/crm.py` — 25+ routes, all authenticated
- `backend/app/routers/contacts.py` — now auto-creates a CRM lead on every form submission
- `backend/app/scripts/seed.py` — seeds 48 leads, campaigns, offers, integrations, communications
- `backend/alembic/` — Alembic migration environment configured
- `backend/tests/` — conftest.py + test_leads.py, 28 passing tests

### Backend — what is NOT yet built
- Background jobs / task queue (Celery, ARQ, etc.)
- Webhook receivers for ad platforms
- Real integration SDK wiring (connect/disconnect are mock status toggles)
- Scheduled AI re-scoring jobs

## Coding Conventions

### Frontend
- All components are `.js` files (not TypeScript)
- Use styled-components for all styling. Create styled components at the top of the file or in a separate `.styles.js` file.
- Follow existing component patterns: functional components with hooks
- State management: useState/useEffect/useContext. Create custom hooks in `src/hooks/` for data fetching.
- Create `src/services/api.js` as a centralized fetch wrapper that handles auth headers and base URL
- File naming: PascalCase for components (`LeadsTable.js`), camelCase for services/hooks (`useLeads.js`, `api.js`)
- Keep components focused — one component per file, extract shared components to `src/components/`

### Backend
- Follow the existing pattern in `auth.py` and `contacts.py` for new routers
- Models go in `backend/app/models/` — one file per model, import all models in `backend/app/models/__init__.py`
- Schemas go in `backend/app/schemas/` — Pydantic v2 models for request/response validation
- **Create a service layer:** `backend/app/services/` — one service file per domain (lead_service.py, campaign_service.py, ai_service.py). Routers call services, services call the database. Business logic lives in services, not routers.
- Use SQLAlchemy 2.0 style queries
- Use Alembic for all schema changes — never use `create_all` in production
- All endpoints return consistent response format: `{"data": ..., "message": "..."}` for success, `{"detail": "..."}` for errors
- Use FastAPI's `Depends(get_db)` for database sessions
- Use `Depends(get_current_user)` from security module for authenticated endpoints

## Database Schema

### Lead
```
id: UUID, primary key
tenant_id: UUID, nullable (for future multi-tenancy)
first_name: String, required
last_name: String, required
email: String, required, indexed
phone: String, nullable
company: String, nullable
industry: String, nullable
job_title: String, nullable
source: Enum(facebook_ads, google_ads, tiktok_ads, instagram, landing_page, affiliate_link, website_widget, api)
source_detail: String, nullable (specific campaign name or affiliate ID)
stage: Enum(new, contacted, qualified, proposal, negotiation, won, lost), default=new
classification: Enum(hot, warm, cold), default=cold
ai_score: Integer (0-100), default=0
predicted_value: Float, default=0
ltv: Float, default=0
tags: JSON (array of strings)
notes: Text, nullable
assigned_to: UUID, FK to User, nullable
campaign_id: UUID, FK to Campaign, nullable
affiliate_id: String, nullable
custom_fields: JSON
created_at: DateTime, auto
updated_at: DateTime, auto
last_contact_at: DateTime, nullable
converted_at: DateTime, nullable
```

### Activity
```
id: UUID, primary key
lead_id: UUID, FK to Lead, required, indexed
type: Enum(email_sent, email_opened, email_clicked, call, meeting, form_submit, page_visit, ad_click, chatbot, note_added, stage_changed, score_updated)
description: String, required
metadata: JSON, nullable
channel: String, nullable
performed_by: UUID, FK to User, nullable
timestamp: DateTime, auto
```

### Communication
```
id: UUID, primary key
tenant_id: UUID, FK to Tenant, nullable, indexed
lead_id: UUID, FK to Lead, required, indexed
channel: Enum(email, sms, whatsapp, chatbot, social_dm)
direction: Enum(inbound, outbound)
subject: String, nullable
body: Text, required
preview: String (first ~100 chars of body)
read: Boolean, default=false
provider_message_id: String, nullable, indexed  -- X-Message-ID from SendGrid
status: String, nullable  -- queued|sent|delivered|opened|clicked|bounced|failed (outbound only)
from_email: String, nullable
to_email: String, nullable
in_reply_to_message_id: String, nullable  -- for email threading
metadata: JSON, nullable
timestamp: DateTime, auto
```

### Campaign
```
id: UUID, primary key
name: String, required
platform: String, required
status: Enum(draft, active, paused, completed), default=draft
objective: String, nullable
budget_daily: Float, nullable
budget_total: Float, nullable
currency: String, default=USD
offer_name: String, nullable
offer_network: String, nullable
targeting: JSON, nullable
metrics: JSON (impressions, clicks, leads, conversions, spend, revenue, ctr, cpl, cpa, roas)
start_date: DateTime, nullable
end_date: DateTime, nullable
created_at: DateTime, auto
updated_at: DateTime, auto
```

### Offer
```
id: UUID, primary key
name: String, required
niche: String, required
network: String, required
aov: Float
gravity: Float, nullable
trend_direction: Enum(up, down, stable)
trend_value: Float, nullable
commission_rate: Float
conversion_rate: Float, nullable
status: Enum(active, inactive), default=active
external_url: String, nullable
created_at: DateTime, auto
```

### Integration
```
id: UUID, primary key
tenant_id: UUID, nullable
platform_name: String, required
platform_type: Enum(ad_platform, affiliate_network, payment_gateway, tool)
status: Enum(connected, pending, disconnected), default=disconnected
config: JSON (stores non-sensitive config)
connected_at: DateTime, nullable
last_sync_at: DateTime, nullable
created_at: DateTime, auto
```

## CRM API Endpoints

All CRM endpoints live under `/api/v1/crm/` and require authentication.

```
# Dashboard
GET  /api/v1/crm/dashboard/summary

# Leads
GET    /api/v1/crm/leads                    (query params: page, limit, search, source, stage, classification, sort_by, sort_dir)
POST   /api/v1/crm/leads
GET    /api/v1/crm/leads/{id}
PATCH  /api/v1/crm/leads/{id}
DELETE /api/v1/crm/leads/{id}
PATCH  /api/v1/crm/leads/{id}/stage
GET    /api/v1/crm/leads/{id}/activities
POST   /api/v1/crm/leads/{id}/activities

# AI
POST   /api/v1/crm/leads/{id}/ai/score
POST   /api/v1/crm/leads/{id}/ai/outreach

# Communications
GET    /api/v1/crm/communications            (query param: lead_id)
POST   /api/v1/crm/communications
POST   /api/v1/crm/leads/{id}/communications/send-email   (subject, body → real SendGrid send)

# Campaigns
GET    /api/v1/crm/campaigns
POST   /api/v1/crm/campaigns
GET    /api/v1/crm/campaigns/{id}
PATCH  /api/v1/crm/campaigns/{id}

# Offers
GET    /api/v1/crm/offers                    (query params: niche, network, sort_by)
POST   /api/v1/crm/offers                    (seed/sync offers)

# Integrations
GET    /api/v1/crm/integrations
POST   /api/v1/crm/integrations/{platform}/connect      (generic — mock status toggle)
DELETE /api/v1/crm/integrations/{platform}/disconnect   (generic)
GET    /api/v1/crm/integrations/sendgrid/status         (returns connected + sender config)
POST   /api/v1/crm/integrations/sendgrid/connect        (body: sender_email, sender_name)
DELETE /api/v1/crm/integrations/sendgrid/disconnect
POST   /api/v1/crm/integrations/sendgrid/test-send      (real send to current_user.email)

# Webhooks (no auth — SendGrid calls these)
POST   /api/v1/webhooks/sendgrid/events                 (event webhook batch; ECDSA-P256 verified)
POST   /api/v1/webhooks/sendgrid/inbound                (inbound parse; multipart/form-data)

# Reports
GET    /api/v1/crm/reports/pipeline-summary
GET    /api/v1/crm/reports/source-breakdown
GET    /api/v1/crm/reports/campaign-performance
```

## CRM Frontend Route Structure

Replace `/crm` route target from `CRMPage.js` to a new CRM layout with nested routes:

```
/crm                    → redirect to /crm/dashboard
/crm/dashboard          → Dashboard (KPIs, network sales, AI insights, pipeline summary, recent leads)
/crm/offers             → Offer Discovery (niche selector, network filter, trending tables, offer results)
/crm/campaigns          → Campaign Management (KPIs, campaign table, AI optimization, create modal)
/crm/leads              → Leads Table (search, filter, sort, paginated table)
/crm/pipeline           → Pipeline Kanban (drag-and-drop stage management)
/crm/communication      → Messages (split-pane inbox with AI reply suggestions)
/crm/analytics          → Analytics & Reports (score distribution, pipeline charts, ROI tables)
/crm/settings           → Settings (integrations grid, AI config toggles, team/permissions)
```

The CRM should have its own sidebar navigation (not the global Header). The global Header/Footer should still show on marketing pages but the CRM section should feel like a separate app-within-the-app.

## Implementation Order

### Phase 1 — Backend Foundation ✅ COMPLETE
1. ✅ Set up Alembic in the backend directory
2. ✅ Create all CRM models (Lead, Activity, Communication, Campaign, Offer, Integration)
3. ✅ Generate and run initial migration
4. ✅ Create Pydantic schemas for each model (Create, Update, Response, List)
5. ✅ Create service layer files (lead_service.py, campaign_service.py, etc.)
6. ✅ Implement leads CRUD endpoints (router + service + schemas)
7. ✅ Implement dashboard summary endpoint
8. ✅ Seed database with realistic demo data (`backend/app/scripts/seed.py`)
9. ✅ 28 passing integration tests (`backend/tests/`)

### Phase 2 — Frontend Data Layer ✅ COMPLETE
1. ✅ `src/services/api.js` — centralized fetch wrapper with JWT auth headers
2. ✅ 8 custom hooks in `src/hooks/`
3. ✅ CRM nested routing in App.js with CRMLayout component
4. ✅ Collapsible CRM sidebar navigation

### Phase 3 — Frontend CRM Pages ✅ COMPLETE
1. ✅ Dashboard (`/crm/dashboard`) — KPIs, AI insights, pipeline, source breakdown
2. ✅ Leads (`/crm/leads`) — paginated table, drawer, AI assist tab
3. ✅ Pipeline (`/crm/pipeline`) — drag-and-drop kanban, persists via PATCH /stage
4. ✅ Campaigns (`/crm/campaigns`) — metrics table, computed KPIs
5. ✅ Offers (`/crm/offers`) — niche/network filter, trending tables
6. ✅ Communication (`/crm/communication`) — split-pane inbox, AI reply
7. ✅ Analytics (`/crm/analytics`) — score distribution, pipeline bars, ROI table
8. ✅ Settings (`/crm/settings`) — integrations grid, AI toggles, team list

### Phase 4 — AI Features ✅ COMPLETE
1. ✅ `backend/app/services/ai_service.py` — dual-mode (Gemini + rule-based fallback)
2. ✅ Lead scoring via Gemini 2.5 Flash; returns score, classification, conversion_probability, recommended_action, reasoning
3. ✅ Outreach generation via Gemini; returns subject, body, estimated_open_rate, estimated_reply_rate
4. ✅ `POST /api/v1/crm/leads/ai/score-all?force=true` for bulk re-scoring

### Phase 5 — Campaign Creation Flow ⬜ NOT STARTED
1. Multi-step campaign creation modal (Details → Budget → Review → Launch)
2. Link campaigns to offers
3. AI compliance check
4. Campaign metrics tracking

### Phase 6 — Integrations Framework ⬜ NOT STARTED
1. Real OAuth flows for ad platforms (Facebook, Google, TikTok)
2. Real affiliate network API polling (ClickBank, MaxWeb, etc.)
3. Webhook receivers for conversion tracking
4. Background job queue for scheduled sync

## Things NOT to Do

- Do NOT use TypeScript — the project is JavaScript
- Do NOT install Tailwind or any other CSS framework — use styled-components
- Do NOT add Redux, Zustand, or any state management library — use React context + hooks
- Do NOT break the existing auth flow in UserContext.js
- Do NOT break the existing Header.js / Footer.js global navigation
- Do NOT break the existing landing page contact form submission
- Do NOT trust marketing pages, FAQ content, or developer page as backend truth — they are all mock/aspirational
- Do NOT use `Base.metadata.create_all()` for schema changes — use Alembic migrations
- Do NOT store API keys or secrets in code — use environment variables
- Do NOT build disconnected demo pages — every CRM page should talk to the real backend

## Files to Read Before Making Changes

Before touching anything, read these files to understand the existing patterns:

**Must read:**
- src/App.js (routing, providers, app shell)
- src/contexts/UserContext.js (auth state pattern)
- src/components/Header.js (global nav)
- backend/app/main.py (FastAPI setup)
- backend/app/routers/auth.py (endpoint pattern to follow)
- backend/app/models/user.py (model pattern to follow)
- backend/app/core/database.py (db session pattern)
- backend/app/core/security.py (auth dependency pattern)

**Read for CRM context:**
- src/layouts/CRMLayout.js (sidebar + outlet shell for all CRM pages)
- src/pages/crm/CRMDashboard.js (reference implementation — patterns used across all pages)
- src/pages/crm/CRMLeads.js (most complex page — drawer, tabs, AI assist, debounced search)
- src/hooks/useLeads.js (data fetching pattern to follow for new hooks)
- backend/app/services/lead_service.py (service layer pattern to follow)
- backend/app/routers/crm.py (all CRM routes — check before adding new endpoints)
- backend/tests/conftest.py (test setup — session-scoped fixtures, in-memory SQLite)