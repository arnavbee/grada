# Kira Web Monorepo

Wholesale operations monorepo for catalog management, PO building, received marketplace PO processing, and downstream document generation.

## Current product areas

- Smart Catalog: product CRUD, AI-assisted image analysis, templates, bulk workflows, marketplace exports, and export history.
- PO Format Builder: create PO requests from catalog products, extract attributes, review rows, and export exact XLSX workbooks.
- Received POs: upload marketplace POs, parse and review line items, confirm records, then generate barcode, invoice, and packing-list PDFs.
- Settings: brand profile, PO-builder defaults, invoice defaults, and carton-capacity rules.
- Admin: super-admin analytics and tenancy-aware operational insights.

## Workspace layout

- `apps/web`: Next.js 14 App Router frontend
- `apps/api`: FastAPI backend with SQLAlchemy models and a built-in durable job worker
- `apps/jobs`: future worker/process scaffold and env template
- `packages/shared`: shared TypeScript package
- `docs/adr`: architecture decision records

## Prerequisites

- Node.js 20+
- pnpm 9+
- Python 3.11+

## Local development

### 1. Install root dependencies

```bash
pnpm install
```

### 2. Configure environment files

Create local env files from the examples:

```bash
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
cp apps/jobs/.env.example apps/jobs/.env
```

Minimum values to review before starting:

- `apps/web/.env`
  - `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000`
- `apps/api/.env`
  - `OPENAI_API_KEY=...`
  - `DATABASE_URL=sqlite:///./kira.db` for a simple local setup, or Postgres if you want parity with Docker
  - `FRONTEND_ORIGINS=http://localhost:3000,http://127.0.0.1:3000`

### 3. Start the API

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Notes:

- The API starts a background worker thread on boot for received-PO parse and document-generation jobs.
- Local uploads and generated PDFs are stored under `apps/api/static/` unless object storage is configured.
- Health endpoints are available at `/health` and `/api/v1/health`.

### 4. Start the web app

In a second terminal from the repo root:

```bash
pnpm --filter @kira/web dev --hostname 0.0.0.0 --port 3000
```

The default app URL is [http://localhost:3000](http://localhost:3000).

## Common commands

From the repo root:

```bash
pnpm dev
pnpm build
pnpm lint
pnpm test
pnpm format:check
```

API-specific checks:

```bash
cd apps/api
.venv/bin/ruff check .
.venv/bin/pytest
```

Web-specific checks:

```bash
cd apps/web
pnpm lint
pnpm test
```

## Docker Compose

```bash
docker compose up --build
```

This starts:

- Postgres on `5432`
- Redis on `6379`
- API on `8000`
- Web on `3000`

The compose stack uses `apps/api/.env.example` and `apps/web/.env.example` as its env sources.

## Storage and jobs

- Default local development database: SQLite when `DATABASE_URL` is not overridden in the API app.
- Compose/database parity option: Postgres via `docker compose`.
- Durable jobs today: in-process worker started by the API for received-PO parsing and PDF generation.
- Future worker shape: `apps/jobs` remains a scaffold for a separate worker process if the queue architecture is split out later.
- Optional object storage: S3-compatible storage such as Cloudflare R2 can replace local file storage for uploads and generated files.

## API surface at a glance

Main route groups live under `/api/v1`:

- `/auth`
- `/catalog`
- `/settings`
- `/users`
- `/uploads`
- `/po-requests`
- `/received-pos`
- `/admin`

## Architecture notes

- ADRs live in [docs/adr](/Users/arnavbsingh/Downloads/kira-web/docs/adr).
- The frontend talks to FastAPI for business operations; Next.js route handlers are not the main business-logic boundary.
- Tenancy is enforced with `company_id` scoping in the API layer.
