# ADR 0001: Authentication Strategy

- Status: Accepted
- Date: 2026-02-07

## Context
The MVP requires secure email/password authentication with refresh tokens, 24-hour session timeout, and role-based access control.

## Decision
Use JWT access tokens with short expiry and refresh tokens stored securely. Passwords will be hashed with Argon2id (fallback bcrypt). FastAPI will own auth APIs and token issuance.

## Consequences
- Clear API boundary for identity and roles.
- Stateless access token validation in API services.
- Token rotation and revocation list must be added in Phase 1.
