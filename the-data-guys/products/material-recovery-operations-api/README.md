# Material Recovery Operations API

**Client / organization:** The Data Guys (product)  
**Built by:** Dei'Marlon Scisney · The Data Guys

## Overview

The backend for a construction material-recovery product: it tracks material received from job sites, recovery events and disposal records so contractors can report diversion and reuse. Async FastAPI with SQLAlchemy models, nine Alembic migrations and a Lambda deployment handler.

## Tech stack

`Python` · `FastAPI` · `SQLAlchemy 2.0 (async)` · `Alembic` · `Pydantic v2` · `PostgreSQL / SQLite` · `AWS Lambda (Mangum)` · `OpenAI` · `Stripe`

## Engineering highlights

- **Domain models** for material records (type, category, tons, source project, condition), recovery events and disposal records, plus activity logs and notifications.
- **Layered architecture**: `routers/` (17) → `services/` (18) → `models/` (13), with Pydantic schemas and dependency-injected auth and DB sessions.
- **Nine Alembic migrations** tracking schema evolution.
- **Serverless deploy** through `lambda_handler.py` (Mangum) or Uvicorn locally; async PostgreSQL (asyncpg) or SQLite (aiosqlite).
- **AI hub and storage services** for document upload and LLM-assisted entry.

## Run locally

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

## Confidentiality

Started from a generated FastAPI project template and built out for this domain. The template plumbing (auth, database bootstrap, Lambda handler) is left as is and excluded from the portfolio's authored-code totals. A hard-coded template key was moved to an environment variable.
