# KimuntuX Backend

This folder contains the FastAPI backend for the KimuntuX project.

## Current scope

- FastAPI application scaffold
- PostgreSQL-ready SQLAlchemy setup
- JWT-based auth foundation
- `users` and `contact_submissions` database models
- Starter auth and contact-form API routes

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
