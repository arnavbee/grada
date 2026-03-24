# Full Stack MVP TODO Plan

Last updated: 2026-03-24

## 1) Current Project Snapshot

- Monorepo structure is in place and active:
  - `apps/web`: Next.js 14 App Router frontend
  - `apps/api`: FastAPI backend
  - `apps/jobs`: worker scaffold only
  - `packages/shared`: small shared TypeScript package
- Product direction is still consistent with the PRD:
  - Smart Catalog
  - PO Automation
  - Invoice and Packing
  - Unified Dashboard
- Current implementation is strongest in:
  - Auth and tenancy
  - Catalog workflows
  - Received PO workflows
  - PO format builder v2 workflow
  - Super-admin analytics
- Current implementation is weakest in:
  - Invoice and packing
  - Unified dashboard data layer
  - Durable background jobs
  - Settings and integrations

## 2) Architecture Status: Built vs Target

### Built Today

- Frontend: Next.js 14 + Tailwind
- API: FastAPI + SQLAlchemy
- Auth: JWT access + refresh tokens
- Database default: SQLite in local app config
- Background work: FastAPI `BackgroundTasks`
- File storage: local `static/` with optional R2-compatible object storage
- Multi-tenancy: shared schema with `company_id` scoping in API layer

### Target Before Production

- Database: PostgreSQL
- Jobs: Redis + Celery or equivalent durable worker setup
- Storage: Cloudflare R2 or S3-compatible object storage
- Observability: Sentry + structured logs + job metrics
- Deployment: separate web, API, worker, and managed data services

## 3) What Is Already Done

### Foundation

- [x] `pnpm` workspace and monorepo layout
- [x] Web, API, and shared package structure
- [x] Docker Compose for Postgres, Redis, API, and Web
- [x] ADRs for auth, queue/jobs, storage, and multi-tenancy
- [x] Env templates for web, API, and jobs
- [x] Basic test coverage for web and API

### Auth, Tenancy, and Admin

- [x] Companies, users, and company settings models
- [x] Register, login, refresh token, logout, forgot/reset password APIs
- [x] Password policy and hashing
- [x] Route protection in web middleware
- [x] Role-aware API dependencies
- [x] Super-admin detection and admin insights API
- [x] Audit logging for auth and catalog/admin actions

### Smart Catalog

- [x] Product CRUD
- [x] Product image and measurement records
- [x] Bulk upload UI with client-side validation
- [x] Image analysis endpoint using AI service
- [x] Catalog templates CRUD
- [x] SKU auto-generation
- [x] AI correction logging and learning stats
- [x] Marketplace export generation with CSV/XLSX output
- [x] Export history API
- [x] Processing jobs API for image analysis and tech-pack OCR

### PO Format Builder

- [x] `po_requests` and `po_request_items` models
- [x] `po_request_colorways` and derived `po_request_rows` models
- [x] Create PO request from selected catalog products
- [x] Update per-item pricing, fabric, size ratios, and colorways
- [x] Trigger AI attribute extraction job with Styli enum normalization
- [x] Flag low-confidence dress attributes for manual review
- [x] Generate row-level preview from `style x colorway x size`
- [x] Generate Styli-style product titles for export rows
- [x] Export generated PO workbook as exact XLSX
- [x] Upgraded multi-step PO builder UI for style setup, AI review, and export

### UX and Navigation

- [x] Public landing page
- [x] Login, signup, forgot-password, and reset-password pages
- [x] Dashboard shell and module navigation
- [x] Catalog page
- [x] PO builder page
- [x] Admin console page
- [x] Placeholder routes for inventory, orders, and settings

## 4) Known Gaps and Drift To Fix First

### P0: Correctness and Consistency

- [x] Fix failing API tests in catalog flows:
  - [x] Restore settings-driven SKU generation behavior
  - [x] Restore pattern-first style-code generation behavior
- [ ] Reconcile repo naming drift:
  - [ ] Decide whether product naming is `grada`, `kira`, or split brand/internal naming
  - [ ] Update package/docs/UI strings consistently
- [ ] Remove outdated notes in docs that no longer match implementation
- [ ] Confirm whether SQLite remains acceptable for local dev only, not staging/prod

### P0: Security and Reliability Basics

- [x] Replace permissive debug CORS in API with environment-based allowed origins
- [ ] Review cookie strategy for auth tokens and decide whether to move to `HttpOnly` cookie flow
  - [x] Add `Secure` flag automatically for HTTPS cookie contexts
- [x] Add stronger request logging strategy without noisy raw prints in production
- [x] Add explicit error handling and status tracking around background jobs

## 5) Recently Completed: Received PO Processing

This is the next major feature to build now.

Business flow:

- Brand uploads the official marketplace PO received back from Styli.
- System parses and normalizes the PO into confirmed line items.
- From that single confirmed PO, the brand generates:
  - barcode sticker sheet
  - invoice
  - packing list

Important architecture decisions for this phase:

- Keep the existing backend boundary: business APIs live in FastAPI, not Next.js route handlers.
- Keep the existing auth and tenancy model: JWT + `company_id` scoping in FastAPI.
- Keep the existing frontend pattern: Next.js dashboard pages calling FastAPI through the current `/api/v1/...` proxy.
- Reuse the existing object storage abstraction in the API for uploads and generated files.
- Reuse the current background-task pattern first; design job payloads so they can later move to Celery/Redis with minimal churn.
- Extend the current AI service layer instead of introducing a second AI integration pattern unless parsing quality truly requires it.

### Phase 3A: Foundations Needed Before Received PO

- [x] Finish the minimum settings foundation required for downstream document generation:
  - [x] brand profile data for invoice header
  - [x] invoice prefix and default IGST rate
  - [x] carton capacity rules by category
- [x] Keep these settings in the current backend shape:
  - [x] structured brand-profile data inside `company_settings.settings_json`
  - [x] dedicated `carton_capacity_rules` table for editable capacity rules
- [ ] Keep settings UI inside the existing dashboard route structure:
  - [ ] extend `/dashboard/settings`
  - [ ] avoid introducing a separate non-dashboard settings surface unless necessary

### Phase 3B: Data Model for Received POs

- [x] Add FastAPI/SQLAlchemy models and schemas for:
  - [x] `received_pos`
  - [x] `received_po_line_items`
  - [x] `barcode_jobs`
  - [x] `invoices`
  - [x] `packing_lists`
  - [x] `packing_list_cartons`
  - [x] `packing_list_carton_items`
  - [x] `carton_capacity_rules`
- [x] Add `init_db()` compatibility for new tables.
- [ ] If Alembic setup begins in the same pass, create the first migration for this phase.
- [ ] Keep status enums aligned with current API conventions and future job-state transitions.

### Phase 3C: Settings and Brand Profile

- [x] Add brand profile API support in FastAPI for:
  - [x] supplier legal name
  - [x] address
  - [x] GST number
  - [x] PAN number
  - [x] default Bill To address
  - [x] default Ship To address
  - [x] invoice prefix
  - [x] default IGST rate
- [x] Add carton capacity rules CRUD in FastAPI.
- [x] Build settings UI in the existing settings module for:
  - [x] brand profile form
  - [x] carton capacity rules table/editor
- [ ] Use form validation patterns that fit the current app:
  - [ ] introduce React Hook Form + Zod here if it materially improves settings UX
  - [ ] otherwise prefer consistency with current lightweight client-state approach

### Phase 3D: Received PO Upload and Parse Pipeline

- [x] Add FastAPI endpoints under a new route group such as `/api/v1/received-pos`.
- [x] Implement upload flow:
  - [x] accept PDF/XLSX/XLS upload
  - [x] store source file in object storage when configured, else local fallback
  - [x] create `received_pos` record with `uploaded` status
- [x] Implement parse job kickoff using the current background-task model.
- [x] Add parser service in the API:
  - [ ] PDF extraction via `pdfplumber`
  - [x] Excel extraction via `openpyxl` or fallback parser
  - [x] normalize extracted table/text before AI parsing
  - [ ] pass normalized content through the existing AI service layer for structured extraction
- [x] Save:
  - [x] raw extraction payload
  - [x] normalized PO header
  - [x] received PO line items
  - [x] parse status and error state
- [x] Support polling from the frontend rather than adding realtime infrastructure in this phase.

### Phase 3E: Review and Confirm Workflow

- [x] Add API support to:
  - [x] list received POs for the current company
  - [x] fetch one received PO with grouped or frontend-groupable line items
  - [x] update parsed header fields before confirm
  - [x] update parsed line items before confirm
  - [x] confirm and lock a received PO
- [x] Enforce lock semantics after confirmation:
  - [x] no further line-item edits
  - [x] no cross-company access
- [ ] Keep an audit trail for:
  - [x] upload
  - [ ] parse
  - [x] edit before confirm
  - [x] confirmation

### Phase 3F: Barcode, Invoice, and Packing List Generation

#### Barcode

- [x] Generate one barcode label record per received PO line item.
- [ ] Upgrade local fallback PDF output to full Code128 sticker layout once `python-barcode` and `reportlab` are installed in runtime.
- [x] Track barcode generation in `barcode_jobs`.
- [x] Store generated barcode PDFs through the existing storage abstraction with local fallback.

#### Invoice

- [x] Create invoice records from confirmed received PO data.
- [x] Implement per-company invoice number sequencing.
- [x] Calculate:
  - [x] subtotal
  - [x] IGST amount
  - [x] total amount
- [x] Support manual gross-weight update after draft creation.
- [x] Generate invoice PDF with brand profile header data and line-item table.

#### Packing List

- [x] Create packing list draft from confirmed PO data.
- [x] Implement carton assignment algorithm using company carton-capacity rules.
- [x] Store cartons and carton items transactionally.
- [x] Support manual carton-level weight and dimensions entry before PDF generation.
- [x] Generate packing list PDF from saved carton structure.

### Phase 3G: Carton Assignment Algorithm

- [x] Implement carton assignment in the API service layer, not directly inside the page component.
- [x] Use confirmed received PO line items ordered consistently by:
  - [x] option/colorway
  - [x] size order
- [x] Resolve carton capacity from company rules, with a documented fallback default.
- [x] Split quantities across cartons sequentially.
- [x] Save cartons and carton allocations in one transaction.
- [x] Return a summary payload usable immediately by the frontend documents page.

### Phase 3H: Frontend Routes and Components

- [x] Add a new dashboard route group for Received POs:
  - [x] `/dashboard/received-pos`
  - [x] `/dashboard/received-pos/upload`
  - [x] `/dashboard/received-pos/[id]`
  - [x] `/dashboard/received-pos/[id]/documents`
- [x] Keep these pages inside the existing dashboard navigation and shell unless a full-width review experience proves necessary.
- [x] Build pages/components for:
  - [x] PO upload zone
  - [x] received PO list page
  - [x] review and confirm page
  - [x] documents page with barcode/invoice/packing-list cards
  - [x] grouped editable line-items table
  - [x] carton breakdown editor
- [x] Reuse existing UI primitives and dashboard-shell patterns where possible.
- [x] Add “Received POs” to sidebar navigation after PO Builder.

### Phase 3I: API Surface for This Phase

- [x] Add FastAPI endpoints for:
  - [x] upload received PO
  - [x] list received POs
  - [x] get one received PO
  - [x] edit received PO header before confirm
  - [x] edit received PO line items before confirm
  - [x] confirm received PO
  - [x] create barcode job
  - [x] get barcode job status
  - [x] create invoice draft
  - [x] update invoice gross weight
  - [x] generate invoice PDF
  - [x] create packing list draft
  - [x] update carton weights/dimensions
  - [x] generate packing list PDF
  - [x] brand profile settings CRUD
  - [x] carton rule CRUD

### Phase 3J: Dependencies for This Phase

- [x] Add Python dependencies to the API package manifest:
  - [x] `pdfplumber`
  - [x] `openpyxl`
  - [x] `python-barcode`
  - [x] `reportlab`
- [ ] Keep AI/document parsing dependencies aligned with the current API service approach.
- [ ] Avoid adding stack concepts that do not already exist in this repo unless they unlock a clear blocker.

### Phase 4: Follow-On Work After Received POs

- [ ] Replace placeholder orders page with a real operational orders/PO view.
- [ ] Replace placeholder inventory page with real stock overview.
- [ ] Add unified dashboard KPIs from live catalog + received PO + document data.
- [ ] Continue platform hardening:
  - [ ] PostgreSQL-first setup
  - [ ] Alembic migrations
  - [ ] durable worker queue
  - [ ] rate limiting
  - [ ] file validation and scanning
  - [ ] observability and runbooks

## 6) Testing Status and Next Test Work

### Current Status

- [x] Web tests pass
- [x] API tests pass
- [x] Catalog API test suite is fully green

### Required Next Coverage

- [ ] Add frontend tests for:
  - [ ] auth cookie/session behavior
  - [ ] dashboard-shell auth profile loading
  - [ ] catalog interactions
  - [ ] PO builder step transitions
- [ ] Add frontend tests for received PO flows:
  - [x] helper coverage for formatting, totals, draft shaping, and file URL resolution
  - [x] upload and parse polling state
  - [x] editable review table before confirm
  - [x] read-only state after confirm
  - [x] document card generation/download states
- [ ] Add API tests for:
  - [ ] PO request happy path and edge cases
  - [ ] permission boundaries across roles
  - [ ] multi-tenant isolation on every new endpoint group
  - [ ] object storage and local storage parity
- [ ] Add API tests for received PO flows:
  - [x] upload -> parse -> confirm
  - [x] edit lock after confirmation
  - [x] tenant isolation on received PO detail
  - [ ] invoice calculation correctness
  - [ ] carton assignment correctness
  - [ ] barcode/invoice/packing-list job state handling
- [ ] Add end-to-end tests for:
  - [ ] sign up -> sign in -> dashboard access
  - [ ] upload -> analyze -> create product -> export
  - [ ] select products -> configure PO -> extract -> export
  - [ ] upload received PO -> review -> confirm -> generate documents

### Acceptance Criteria For Next Phase

- [ ] Uploading a PDF or Excel received PO creates a record and parses line items within an acceptable async window.
- [ ] User can review and edit extracted PO fields before confirmation.
- [ ] Confirming a received PO makes it read-only.
- [ ] Barcode PDF generates from confirmed PO line items with correct per-SKU labels.
- [ ] Invoice calculations are correct and use brand profile defaults.
- [ ] Packing list carton assignment respects company carton-capacity rules.
- [ ] Barcode, invoice, and packing-list PDFs are all downloadable from the documents page.
- [ ] All received PO endpoints are auth-protected and tenant-scoped.

## 7) Scope Guardrails

- [x] No native mobile app in MVP
- [x] No advanced forecasting/reorder engine in MVP
- [x] No deep ERP/accounting integrations in MVP
- [x] No multi-location inventory in MVP
- [x] No SSO/2FA/custom permission builder in MVP

## 8) Immediate Next Actions

- [ ] Lock the data model for received POs, downstream documents, and carton rules.
- [ ] Build brand profile + carton rules in `/dashboard/settings`.
- [x] Implement FastAPI received PO upload/list/get/confirm APIs.
- [x] Implement parse pipeline and polling-based review flow.
- [x] Build barcode, invoice, and packing-list generation on top of confirmed received POs.

## 9) Implementation Checklist By File Path

Use this as the build sequence for the next phase.

### A. Data Model and API Contracts

- [x] Create [received_po.py](/Users/arnavbsingh/Downloads/kira-web/apps/api/app/models/received_po.py)
  - Add `ReceivedPO`
  - Add `ReceivedPOLineItem`
- [x] Create [invoice.py](/Users/arnavbsingh/Downloads/kira-web/apps/api/app/models/invoice.py)
  - Add `Invoice`
- [x] Create [packing_list.py](/Users/arnavbsingh/Downloads/kira-web/apps/api/app/models/packing_list.py)
  - Add `PackingList`
  - Add `PackingListCarton`
  - Add `PackingListCartonItem`
- [x] Create [barcode_job.py](/Users/arnavbsingh/Downloads/kira-web/apps/api/app/models/barcode_job.py)
  - Add `BarcodeJob`
- [x] Create [carton_capacity_rule.py](/Users/arnavbsingh/Downloads/kira-web/apps/api/app/models/carton_capacity_rule.py)
  - Add `CartonCapacityRule`
- [x] Update [**init**.py](/Users/arnavbsingh/Downloads/kira-web/apps/api/app/models/__init__.py)
  - Export all new models
- [ ] Update [base.py](/Users/arnavbsingh/Downloads/kira-web/apps/api/app/db/base.py) only if shared helpers are needed
- [x] Create [received_po.py](/Users/arnavbsingh/Downloads/kira-web/apps/api/app/schemas/received_po.py)
  - Request/response schemas for upload, list, detail, confirm, line-item edit, barcode status
- [x] Create [invoice.py](/Users/arnavbsingh/Downloads/kira-web/apps/api/app/schemas/invoice.py)
  - Draft/create/update/PDF response schemas
- [x] Create [packing_list.py](/Users/arnavbsingh/Downloads/kira-web/apps/api/app/schemas/packing_list.py)
  - Carton, carton-item, draft, update, PDF response schemas
- [x] Create [settings.py](/Users/arnavbsingh/Downloads/kira-web/apps/api/app/schemas/settings.py)
  - Brand profile and carton-rule schemas

### B. API Routing

- [x] Create [received_pos.py](/Users/arnavbsingh/Downloads/kira-web/apps/api/app/api/v1/endpoints/received_pos.py)
  - Upload endpoint
  - List endpoint
  - Detail endpoint
  - Header/line-item edit endpoints
  - Confirm endpoint
  - Barcode create/status endpoints
  - Invoice create/update/generate endpoints
  - Packing-list create/update/generate endpoints
- [x] Create [settings.py](/Users/arnavbsingh/Downloads/kira-web/apps/api/app/api/v1/endpoints/settings.py)
  - Brand profile get/patch
  - Carton rule CRUD
- [x] Update [router.py](/Users/arnavbsingh/Downloads/kira-web/apps/api/app/api/v1/router.py)
  - Register `received_pos` routes
  - Register `settings` routes

### C. Storage, Parsing, and Document Services

- [x] Create [received_po_parser.py](/Users/arnavbsingh/Downloads/kira-web/apps/api/app/services/received_po_parser.py)
  - File-type detection
  - PDF extraction with `pdfplumber`
  - Excel extraction with `openpyxl`
  - Normalized intermediate payload
- [x] Create [received_po_documents.py](/Users/arnavbsingh/Downloads/kira-web/apps/api/app/services/received_po_documents.py)
  - Barcode PDF rendering with local fallback output
  - Invoice PDF rendering with company brand-profile data
  - Packing-list PDF rendering from saved carton structure
- [ ] Create [received_po_ai.py](/Users/arnavbsingh/Downloads/kira-web/apps/api/app/services/received_po_ai.py)
  - Prompt builder for structured PO extraction
  - AI call wrapper using current AI service conventions
- [ ] Create [received_po_workflows.py](/Users/arnavbsingh/Downloads/kira-web/apps/api/app/services/received_po_workflows.py)
  - Upload record creation
  - Parse result persistence
  - Confirm locking logic
- [x] Create [packing_list_service.py](/Users/arnavbsingh/Downloads/kira-web/apps/api/app/services/packing_list_service.py)
  - Carton assignment algorithm
  - Packing-list persistence
  - Packing-list PDF rendering helper handoff through the shared document service
- [ ] Update [object_storage.py](/Users/arnavbsingh/Downloads/kira-web/apps/api/app/services/object_storage.py) only if download helpers or namespaced path helpers are needed
- [ ] Update [ai.py](/Users/arnavbsingh/Downloads/kira-web/apps/api/app/services/ai.py) only if shared model/client utilities should be reused
- [x] Create [po_builder.py](/Users/arnavbsingh/Downloads/kira-web/apps/api/app/services/po_builder.py)
  - Colorway normalization
  - Derived PO row generation
  - Styli product-name generation
  - XLSX workbook generation without requiring runtime `openpyxl`

### D. Background Job Wiring

- [x] Extend [ai.py](/Users/arnavbsingh/Downloads/kira-web/apps/api/app/services/ai.py) or create focused job functions for:
  - Received PO parse job
  - Barcode PDF generation job
  - Invoice PDF generation job
  - Packing-list PDF generation job
- [x] Reuse current background-task/job-state pattern first
  - Keep job payloads serializable so migration to Celery later is easy
- [ ] If a generic job table extension is needed, update [processing_job.py](/Users/arnavbsingh/Downloads/kira-web/apps/api/app/models/processing_job.py)
  - Only if we choose not to use dedicated `barcode_jobs` plus direct invoice/packing statuses

### E. Settings and Dashboard Navigation

- [x] Update [settings/page.tsx](/Users/arnavbsingh/Downloads/kira-web/apps/web/app/dashboard/settings/page.tsx)
  - Replace placeholder with real settings screen
- [x] Create [settings-view.tsx](/Users/arnavbsingh/Downloads/kira-web/apps/web/src/components/dashboard/settings-view.tsx)
  - Brand profile section
  - Carton capacity rules section
- [x] Update [dashboard-shell.tsx](/Users/arnavbsingh/Downloads/kira-web/apps/web/src/components/dashboard/dashboard-shell.tsx)
  - Add `Received POs` nav item after `PO Format Builder`

### F. Received PO Dashboard Pages

- [x] Create [page.tsx](/Users/arnavbsingh/Downloads/kira-web/apps/web/app/dashboard/received-pos/page.tsx)
  - List page entry point
- [x] Create [page.tsx](/Users/arnavbsingh/Downloads/kira-web/apps/web/app/dashboard/received-pos/upload/page.tsx)
  - Upload page entry point
- [x] Create [page.tsx](/Users/arnavbsingh/Downloads/kira-web/apps/web/app/dashboard/received-pos/[id]/page.tsx)
  - Review/confirm page entry point
- [x] Create [page.tsx](/Users/arnavbsingh/Downloads/kira-web/apps/web/app/dashboard/received-pos/[id]/documents/page.tsx)
  - Documents page entry point

### G. Received PO Frontend Components

- [x] Create [received-po-list-view.tsx](/Users/arnavbsingh/Downloads/kira-web/apps/web/src/components/dashboard/received-po-list-view.tsx)
  - Table of received POs
- [x] Create [received-po-upload-view.tsx](/Users/arnavbsingh/Downloads/kira-web/apps/web/src/components/dashboard/received-po-upload-view.tsx)
  - Upload flow + parsing poll state
- [x] Create [received-po-review-view.tsx](/Users/arnavbsingh/Downloads/kira-web/apps/web/src/components/dashboard/received-po-review-view.tsx)
  - Editable header and line-item review UI
- [x] Create [received-po-documents-view.tsx](/Users/arnavbsingh/Downloads/kira-web/apps/web/src/components/dashboard/received-po-documents-view.tsx)
  - Barcode/invoice/packing-list cards
- [x] Create [POUploadZone.tsx](/Users/arnavbsingh/Downloads/kira-web/apps/web/src/components/received-po/POUploadZone.tsx)
- [x] Create [LineItemsTable.tsx](/Users/arnavbsingh/Downloads/kira-web/apps/web/src/components/received-po/LineItemsTable.tsx)
- [x] Create [DocumentCard.tsx](/Users/arnavbsingh/Downloads/kira-web/apps/web/src/components/received-po/DocumentCard.tsx)
- [x] Create [CartonBreakdown.tsx](/Users/arnavbsingh/Downloads/kira-web/apps/web/src/components/received-po/CartonBreakdown.tsx)

### H. Frontend Data Utilities

- [x] Create [received-po.ts](/Users/arnavbsingh/Downloads/kira-web/apps/web/src/lib/received-po.ts)
  - Typed API client helpers for received PO endpoints
- [x] Create [settings.ts](/Users/arnavbsingh/Downloads/kira-web/apps/web/src/lib/settings.ts)
  - Brand profile and carton-rule client helpers
- [x] Create [po-builder.ts](/Users/arnavbsingh/Downloads/kira-web/apps/web/src/lib/po-builder.ts)
  - Typed PO builder entities
  - Dress attribute enums and labels
  - Colorway and row-preview helpers
- [ ] Update [api-client.ts](/Users/arnavbsingh/Downloads/kira-web/apps/web/src/lib/api-client.ts) only if file-upload or polling ergonomics need improvement

### I. Tests

- [x] Create [test_received_pos.py](/Users/arnavbsingh/Downloads/kira-web/apps/api/tests/test_received_pos.py)
  - Upload/list/get/confirm/tenant isolation
- [x] Create [test_settings.py](/Users/arnavbsingh/Downloads/kira-web/apps/api/tests/test_settings.py)
  - Brand profile + carton-rule CRUD
- [x] Create [test_documents.py](/Users/arnavbsingh/Downloads/kira-web/apps/api/tests/test_documents.py)
  - Invoice totals, carton assignment, barcode/invoice/packing-list generation flows
- [x] Create [received-po.test.ts](/Users/arnavbsingh/Downloads/kira-web/apps/web/src/lib/received-po.test.ts)
  - Received PO helper coverage for status display, totals, drafts, and file URL handling
- [x] Create [received-po.test.tsx](/Users/arnavbsingh/Downloads/kira-web/apps/web/src/components/dashboard/received-po.test.tsx)
  - Upload polling, confirm lock state, document card behavior
- [x] Create [test_po_requests.py](/Users/arnavbsingh/Downloads/kira-web/apps/api/tests/test_po_requests.py)
  - Colorway row explosion
  - Styli XLSX export
  - Enum-normalized AI attribute review
- [x] Create [po-builder.test.ts](/Users/arnavbsingh/Downloads/kira-web/apps/web/src/lib/po-builder.test.ts)
  - Colorway next-letter logic
  - Row-count and piece-count helpers
  - Low-confidence field detection

### J. Dependency and Environment Follow-Up

- [x] Update [pyproject.toml](/Users/arnavbsingh/Downloads/kira-web/apps/api/pyproject.toml)
  - add `pdfplumber`
  - add `openpyxl`
  - add `python-barcode`
  - add `reportlab`
- [ ] Update [README.md](/Users/arnavbsingh/Downloads/kira-web/README.md)
  - document received PO flow once the feature lands
- [ ] Update [apps/api/README.md](/Users/arnavbsingh/Downloads/kira-web/apps/api/README.md)
  - document new endpoints and dependency/runtime requirements
