# KimuX Backend

This folder contains the FastAPI backend for the KimuX CRM and blockchain workflows.

## Current scope

- FastAPI application scaffold
- PostgreSQL-ready SQLAlchemy setup with Alembic migrations
- JWT-based auth and tenant-aware CRM APIs
- Optional blockchain integration for wallets, commissions, escrow, and transaction status

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

4. Update `.env` with database, JWT, encryption, and any optional blockchain settings.

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
- `GET /api/v1/crm/...`
- `GET /api/v1/commissions/...`
- `GET /api/v1/wallets/...`
- `GET /api/v1/escrows/...`
- `GET /api/v1/network/transactions/{tx_hash}`
