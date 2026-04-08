# KimuntuX Backend

This folder contains the FastAPI backend for the KimuntuX project.

## Current scope

- FastAPI application scaffold
- PostgreSQL-ready SQLAlchemy setup
- JWT-based auth foundation
- `users`, `contact_submissions`, and `support_messages` database models
- Auth, contact form, public support inquiry, and admin-only list APIs

### Admin access

Users have an `is_admin` flag (defaults to `false`). The API adds this column automatically on startup when using PostgreSQL (and on SQLite when the `users` table exists without it).

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

Support messages to **support@kimux.io** are stored when clients call `POST /api/v1/support/inquiry` (wire a form or email bridge later).

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

4. Update `.env` with your AWS RDS connection details and JWT secret.

## Run locally

From the `backend` folder:

```bash
uvicorn app.main:app --reload
```

## Current endpoints

- `GET /health`
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/contact`
- `POST /api/v1/support/inquiry` (public; saves to support inbox)
- `GET /api/v1/admin/users` (Bearer token, admin only)
- `GET /api/v1/admin/contact-submissions` (admin only)
- `GET /api/v1/admin/support-messages` (admin only)
