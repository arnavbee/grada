# Grada Web Monorepo

Phase 0 foundation for the WholesaleFlow full stack MVP.

## Workspace layout
- `apps/web`: Next.js 14 frontend
- `apps/api`: FastAPI backend
- `apps/jobs`: background worker env scaffold
- `packages/shared`: shared TypeScript contracts
- `docs/adr`: architecture decisions

## Local development

### Prerequisites
- Node.js 20+
- pnpm 9+
- Python 3.11+

### Start web/shared toolchain
```bash
pnpm install
pnpm --filter @kira/web dev
```

### Start API
```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Run quality checks
```bash
pnpm lint
pnpm test
cd apps/api && ruff check . && pytest
```

### Docker Compose
```bash
docker compose up --build
```

This starts Postgres (`5432`), Redis (`6379`), API (`8000`), and Web (`3000`).
