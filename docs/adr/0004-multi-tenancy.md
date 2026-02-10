# ADR 0004: Multi-Tenancy Model

- Status: Accepted
- Date: 2026-02-07

## Context
MVP requires strict data isolation per company and role-based access in a single SaaS deployment.

## Decision
Use shared-database, shared-schema multi-tenancy with mandatory `company_id` scoping on tenant-owned tables. API layer enforces tenant context from auth claims; database policies and tests validate isolation.

## Consequences
- Fast MVP delivery with manageable operational complexity.
- Every query path must apply tenant scope.
- Add row-level security hardening in subsequent phase.
