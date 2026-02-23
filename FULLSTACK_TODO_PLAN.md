# Full Stack MVP TODO Plan

## 1) Source Analysis Snapshot

- Product scope from `/Users/arnavbsingh/Downloads/prd.txt`: 4 MVP modules (Smart Catalog, PO Automation, Invoice/Packing, Multi-Marketplace Dashboard) + cross-cutting auth/RBAC/settings/notifications/help.
- Strategic direction from `/Users/arnavbsingh/Downloads/WholesaleFlow_Design_Document.docx`: fashion wholesale operations platform, phased roadmap, scalability and SaaS best practices.
- Preferred tooling from `/Users/arnavbsingh/Downloads/tech stack.txt`: Next.js + Tailwind/shadcn frontend, PostgreSQL, AI pipelines, background jobs, modern observability.

## 2) Final Architecture Decision (for build execution)

- Frontend + BFF: `Next.js 14` (App Router, TypeScript, Tailwind, shadcn/ui, React Query, Zustand).
- Core API service: `FastAPI` (Python) for business APIs + AI processing endpoints.
- Database: `PostgreSQL` (Supabase or Railway) with SQLAlchemy + Alembic.
- Cache/queue: `Redis` + Celery (or lightweight queue first, Celery by Sprint 3).
- Storage: `Cloudflare R2` (or S3-compatible equivalent).
- Async jobs: image analysis, tech-pack OCR, PO parsing, export generation, notification fan-out.
- Auth: JWT + refresh tokens + RBAC (Admin, Manager, Operator, Viewer).

## 3) Scope Guardrails (Do Not Build in MVP)

- No multi-location inventory.
- No auto-reorder engine or advanced forecasting models.
- No native iOS/Android app.
- No SSO/2FA/custom granular roles.
- No deep ERP/logistics/accounting integrations in MVP.

## 4) Delivery Plan (12-Week Execution)

### Phase 0: Project Foundation (Week 1)

- [x] Initialize monorepo structure:
  - [x] `/apps/web` (Next.js)
  - [x] `/apps/api` (FastAPI)
  - [x] `/packages/shared` (types/schemas/contracts)
- [x] Add standards: TypeScript strict mode, ESLint, Prettier, commit hooks.
- [x] Add environment templates (`.env.example`) for web/api/jobs.
- [x] Create architecture decision records (ADRs) for auth, queue, storage, tenancy.
- [x] Setup Docker Compose for local Postgres + Redis + API + Web.
- [x] Setup CI baseline: lint + unit test on every PR.
- Note: dependency install/runtime validation is pending in this environment due outbound network/Docker command restrictions.

### Phase 1: Identity, Tenancy, RBAC (Week 2)

- [x] Implement DB tables: `companies`, `users`, `company_settings`.
- [x] Implement auth endpoints: register/login/refresh/logout/forgot/reset.
- [x] Add password hashing (Argon2/bcrypt) + token expiry policies.
- [x] Implement RBAC middleware for 4 roles.
- [x] Build web auth pages + guarded routes.
- [x] Add audit events for login/user management/security-sensitive actions.
- Note: API runtime tests are blocked on this machine due Python package install failure (`No space left on device`).

### Phase 2: Module 1 Smart Catalog (Weeks 3-4)

- [x] Implement schema/tables:
  - [x] `products`, `product_images`, `product_measurements`, `marketplace_exports`, `processing_jobs`.
- [x] Build bulk image upload (drag/drop, progress, format/size limits).
- [x] Build AI image analysis pipeline:
  - [x] Vision label/color extraction
  - [x] GPT structured extraction + confidence score
  - [x] Manual edit + save accepted fields
- [x] Build tech-pack PDF flow (upload, OCR, measurement extraction, validation flags).
- [x] Build catalog table UX: search, filter, inline edit, bulk edit, status transitions.
- [x] Implement SKU auto-generation from configured pattern.
- [] Build marketplace export generation (CSV/XLSX) with validation + export history.

### Phase 3: Module 2 PO Automation (Weeks 5-6)

- [ ] Implement schema/tables:
  - [ ] `purchase_orders`, `po_line_items`.
- [ ] Build PO ingestion:
  - [ ] manual upload (PDF/Excel)
  - [ ] Gmail/Outlook connector skeleton (OAuth + polling/webhook)
- [ ] Build PO parsing pipeline:
  - [ ] marketplace detection
  - [ ] structured extraction (PO number/date/items/totals/address)
  - [ ] confidence + review queue
- [ ] Build PO validation rules (SKU match, totals check, inventory availability check).
- [ ] Build PO dashboard with filters/sort/search/status workflow.
- [ ] Build PO confirmation generation + send/download + status tracking.

### Phase 4: Module 3 Invoice & Packing (Week 7)

- [ ] Implement schema/tables:
  - [ ] `invoices`, `packing_lists`.
- [ ] Implement invoice numbering strategy (prefix + sequence per company).
- [ ] Build GST computation logic (CGST/SGST/IGST).
- [ ] Generate branded PDF invoice templates.
- [ ] Build marketplace-specific packing list templates.
- [ ] Build Code128 barcode generation + printable label sheets.

### Phase 5: Module 4 Unified Dashboard (Week 8)

- [ ] Build unified orders view (filters, totals, export).
- [ ] Build KPI cards + trend charts + marketplace/category breakdown.
- [ ] Build top-products table.
- [ ] Build basic inventory overview (stock, low-stock, out-of-stock, manual adjustments, stock log).
- [ ] Add 5-minute auto-refresh + manual refresh controls.

### Phase 6: Cross-Cutting Features (Week 9)

- [ ] Settings UI/API:
  - [ ] company profile
  - [ ] SKU format
  - [ ] invoice prefs
  - [ ] marketplace credentials (encrypted)
  - [ ] email integration settings
- [ ] Notifications system (in-app + email + mark read + 30-day history).
- [ ] Help & support section (FAQ, videos, guide download, support form, WhatsApp link).
- [ ] Add file security controls: content validation + virus scanning pipeline.

### Phase 7: Reliability, Security, Performance (Week 10)

- [ ] Add rate limiting (`100 req/min/user`) and abuse protections.
- [ ] Add input validation everywhere (Pydantic + Zod).
- [ ] Add migration/backfill scripts and rollback playbooks.
- [ ] Add observability: Sentry, structured logs, job metrics, uptime checks.
- [ ] Performance tuning to targets:
  - [ ] API p95 `< 500ms`
  - [ ] page load `< 2s`
  - [ ] export `< 30s` for 100 products.

### Phase 8: QA, UAT, Release Readiness (Week 11)

- [ ] Unit tests for domain services (catalog, PO parser, taxes, exports).
- [ ] Integration tests for API endpoints.
- [ ] E2E flows (Playwright): upload -> analyze -> export, PO ingest -> validate -> invoice.
- [ ] Security test pass: auth, role boundaries, injection, XSS, file upload checks.
- [ ] UAT checklist against each PRD acceptance criterion.

### Phase 9: Deployment & Launch (Week 12)

- [ ] Provision environments: Dev, Staging, Prod.
- [ ] CI/CD pipelines:
  - [ ] auto deploy staging on `staging`
  - [ ] manual approval to prod from `main`
- [ ] Configure backup/restore (daily backups, restore drill `<4h`).
- [ ] Setup domain, SSL, CDN, secret rotation process.
- [ ] Create runbooks: incident response, on-call, rollback.
- [ ] Beta onboarding plan for first pilot customers.

## 5) API & Data Build Checklist

- [ ] Implement all PRD endpoint groups: Auth, Users, Products, AI, Exports, Purchase Orders, Invoices/Packing, Dashboard, Settings, Notifications.
- [ ] Create OpenAPI docs + Postman collection.
- [ ] Add DB indexes for common filters (marketplace, status, date, SKU, company_id).
- [ ] Add multi-tenant isolation tests for every read/write path.

## 6) Acceptance Mapping (MVP Sign-off)

- [ ] Module 1 acceptance criteria fully demoable.
- [ ] Module 2 acceptance criteria fully demoable.
- [ ] Module 3 acceptance criteria fully demoable.
- [ ] Module 4 acceptance criteria fully demoable.
- [ ] Cross-cutting X.1–X.5 criteria demoable.
- [ ] Out-of-scope items verified as excluded.

## 7) Immediate Next Actions (Start Today)

- [ ] Confirm product market focus for MVP: India marketplaces (`Myntra/Ajio/Amazon IN/Flipkart/Nykaa`) vs US channels (`Amazon/eBay/Poshmark/Mercari`).
- [ ] Lock deployment providers (Supabase vs Railway DB, R2 vs S3, Resend vs SendGrid).
- [ ] Approve architecture above and begin Phase 0 implementation.
