# AGENTS.md — KimuX CRM Development Guide

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

### Backend — what does NOT exist yet
- No CRM models (Lead, Activity, Communication, Campaign, Offer, Integration)
- No CRM API endpoints
- No service layer
- No Alembic migrations
- No AI service
- No background jobs / task queue
- No webhook receivers
- No integration SDK wiring

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
lead_id: UUID, FK to Lead, required, indexed
channel: Enum(email, sms, whatsapp, chatbot, social_dm)
direction: Enum(inbound, outbound)
subject: String, nullable
body: Text, required
preview: String (first ~100 chars of body)
read: Boolean, default=false
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
POST   /api/v1/crm/integrations/{platform}/connect
DELETE /api/v1/crm/integrations/{platform}/disconnect

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

### Phase 1 — Backend Foundation
1. Set up Alembic in the backend directory
2. Create all CRM models (Lead, Activity, Communication, Campaign, Offer, Integration)
3. Generate and run initial migration
4. Create Pydantic schemas for each model (Create, Update, Response, List)
5. Create service layer files (lead_service.py, campaign_service.py, etc.)
6. Implement leads CRUD endpoints first (router + service + schemas)
7. Implement dashboard summary endpoint
8. Seed database with realistic demo data (a seed script in `backend/app/scripts/seed.py`)
9. Test all endpoints manually or with the FastAPI docs UI at /docs

### Phase 2 — Frontend Data Layer
1. Create `src/services/api.js` — centralized fetch wrapper with auth headers
2. Create custom hooks in `src/hooks/`: useLeads, useDashboard, useCampaigns, etc.
3. Set up CRM nested routing in App.js with a CRM layout component
4. Create the CRM sidebar navigation component

### Phase 3 — Frontend CRM Pages (connect to real backend)
1. Dashboard page — wire KPIs and lead list to real API
2. Leads page — wire LeadsTable to real API with search/filter/pagination
3. Lead detail panel — wire to real lead data + activities endpoint
4. Pipeline kanban — wire to leads API, make drag-and-drop persist via PATCH stage
5. Campaigns page — wire to campaigns API
6. Offers page — wire to offers API
7. Communication page — wire to communications API
8. Analytics page — wire to reports endpoints
9. Settings page — wire to integrations API

### Phase 4 — AI Features
1. Create `backend/app/services/ai_service.py`
2. Implement lead scoring (rule-based first, LLM-enhanced later)
3. Implement outreach generation (requires LLM API key)
4. Wire AI endpoints to frontend (score button, outreach draft generator)

### Phase 5 — Campaign Creation Flow
1. Multi-step campaign creation modal (Details → Budget → Review → Launch)
2. Link campaigns to offers
3. AI compliance check (mock initially)
4. Campaign metrics tracking

### Phase 6 — Integrations Framework
1. Build integration connection UI in Settings
2. Create mock integration services that return realistic data
3. Structure code so real API credentials can be swapped in later without frontend changes

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
- src/pages/CRMMain.js (unused but better CRM shell)
- src/components/LeadsTable.js (UI pattern for leads)
- src/components/LeadDrawer.js (UI pattern for detail panel)
- src/components/KpiCard.js (reusable component)
- src/data/leads.json (sample data structure)