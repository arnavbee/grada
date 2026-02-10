# ADR 0003: File Storage Strategy

- Status: Accepted
- Date: 2026-02-07

## Context
The platform stores product images, uploaded PO files, tech packs, exports, invoices, and barcode labels.

## Decision
Use Cloudflare R2 via S3-compatible API as primary object storage. All file access will use signed URLs, with metadata tracked in PostgreSQL.

## Consequences
- Low-cost storage with portable S3 API.
- Vendor abstraction possible through a shared storage adapter.
- Signed URL expiry and lifecycle policies must be defined.
