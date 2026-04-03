# Kira Web

Monorepo for wholesale operations:

- Smart Catalog management
- PO builder workflows
- Received marketplace PO processing
- Barcode, invoice, and packing-list document generation

## What You Get

- `apps/web`: Next.js 14 frontend (`@kira/web`)
- `apps/api`: FastAPI backend with SQLAlchemy + built-in background worker
- `apps/jobs`: worker scaffold (env template only, future split-out)
- `packages/shared`: shared TypeScript package
- `docs/adr`: architecture decision records

Product feature overview: [docs/current-product-features.md](/Users/arnavbsingh/Downloads/kira-web/docs/current-product-features.md)

## Tech Stack

- Frontend: Next.js 14, React 18, Tailwind
- Backend: FastAPI, SQLAlchemy, Alembic
- Data: PostgreSQL (recommended), SQLite (simple local option)
- Queue/infra: Redis (compose), in-process API worker currently handles jobs
- Package manager: pnpm (workspace)

## Prerequisites

- Node.js 20+
- pnpm 9+
- Python 3.11+
- Docker (optional, for full local stack)

## Quick Start (Recommended)

### 1. Install workspace deps

```bash
pnpm install
```

### 2. Create env files

```bash
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
cp apps/jobs/.env.example apps/jobs/.env
```

### 3. Update minimum env values

`apps/web/.env`

```bash
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

`apps/api/.env`

```bash
OPENAI_API_KEY=your_key_here
FRONTEND_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

Choose one database mode:

- Quick local: `DATABASE_URL=sqlite:///./kira.db`
- Parity mode: `DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/kira`

### 4. Start API (Terminal A)

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 5. Start web app (Terminal B, repo root)

```bash
pnpm --filter @kira/web dev --hostname 0.0.0.0 --port 3000
```

Open: [http://localhost:3000](http://localhost:3000)

Health checks:

- [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)
- [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)

## Docker Compose (All Services)

```bash
docker compose up --build
```

Services:

- Postgres: `localhost:5432`
- Redis: `localhost:6379`
- API: `localhost:8000`
- Web: `localhost:3000`

Compose reads:

- `apps/api/.env.example`
- `apps/web/.env.example`

## Commands

From repo root:

```bash
pnpm dev
pnpm build
pnpm lint
pnpm test
pnpm format
pnpm format:check
```

API checks:

```bash
cd apps/api
.venv/bin/ruff check .
.venv/bin/pytest
```

Web checks:

```bash
cd apps/web
pnpm lint
pnpm test
```

## API Routes (At a Glance)

All business endpoints are mounted under `/api/v1`:

- `/auth`
- `/catalog`
- `/settings`
- `/users`
- `/uploads`
- `/po-requests`
- `/received-pos`
- `/admin`

## Storage and Background Jobs

- The API starts an in-process worker on boot.
- Current durable job types:
  - received PO parsing
  - barcode PDF generation
  - invoice PDF generation
  - packing-list PDF generation
- Local fallback file storage: `apps/api/static/`
- Optional object storage: S3-compatible (for example Cloudflare R2)

R2 envs (optional):

```bash
R2_ENDPOINT=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_BASE_URL=
R2_REGION=auto
```

## Repository Notes

- ADRs: [docs/adr](/Users/arnavbsingh/Downloads/kira-web/docs/adr)
- API details: [apps/api/README.md](/Users/arnavbsingh/Downloads/kira-web/apps/api/README.md)
- Tenancy is enforced in API layer using `company_id` scoping.
- `apps/jobs` exists as future worker scaffold.
