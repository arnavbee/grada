# ADR 0002: Queue and Background Jobs

- Status: Accepted
- Date: 2026-02-07

## Context
The MVP has async workloads (image analysis, OCR, PO parsing, export generation, notifications) that should not block request/response flow.

## Decision
Adopt Redis-backed queue with Celery for durable async processing. Keep the option to start lightweight with FastAPI background tasks in early iterations, but production path is Celery workers.

## Consequences
- Reliable retries and job visibility.
- Requires worker deployment and queue monitoring.
- Job schemas and idempotency keys are required for safety.
