# KimuX Backend

This folder contains the FastAPI backend for the KimuX CRM and blockchain workflows.

## Current scope

- FastAPI application with Alembic migrations
- PostgreSQL-ready SQLAlchemy setup
- JWT-based auth and tenant-aware CRM APIs
- `users`, `contact_submissions`, and `support_messages` database models
- Auth, contact form, public support inquiry, and admin APIs
- Optional blockchain integration for wallets, commissions, escrow, and transaction status

### Admin access

Users have `is_admin` (tenant/workspace admin) and `is_platform_admin` (curated catalog / platform ops). The API can add `is_admin` automatically on startup for SQLite/legacy DBs when the column is missing.

**Bootstrap admin (default):** On every startup, the backend ensures an admin user exists:

- Email: `yannick@example.com`
- Password: `Capstone@123`
- Display name: `Yannick`

If that row already exists, it is updated to this password and `is_admin = true`. Override via env: `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD`, `BOOTSTRAP_ADMIN_FULL_NAME`.

**Manual promote** (optional, in DBeaver or `psql`):

```sql
UPDATE users SET is_admin = true WHERE email = 'your-admin@example.com';
```

Then sign in again so the UI receives `is_admin: true` from `/auth/me`.

Support messages are stored when clients call `POST /api/v1/support/inquiry`.

## Setup

1. Create and activate a virtual environment.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Copy the environment template:

```bash
copy .env.example .env
```

4. Update `.env` with database, JWT, encryption, SendGrid/reply tokens, and any optional blockchain settings.

## Run locally

From the `backend` folder:

```bash
uvicorn app.main:app --reload
```

## Key endpoints

- `GET /health`
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/token`
- `GET /api/v1/auth/me`
- `POST /api/v1/contact`
- `POST /api/v1/support/inquiry` (public; saves to support inbox)
- `GET /api/v1/admin/users` (Bearer token, tenant admin)
- `GET /api/v1/admin/contact-submissions` (admin only)
- `GET /api/v1/admin/support-messages` (admin only)
- `GET /api/v1/crm/...`
- `GET /api/v1/commissions/...`
- `GET /api/v1/wallets/...`
- `GET /api/v1/escrows/...`
- `GET /api/v1/network/transactions/{tx_hash}`
