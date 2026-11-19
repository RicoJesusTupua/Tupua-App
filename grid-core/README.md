# Tupua Eternal Grid — Security Foundation

**Status:** Development prototype. Not deployed; not a security certification.

This module is the first isolated implementation slice for the Eternal Grid. It provides small, dependency-free policy helpers for permission checks, high-impact approval validation, audit-data minimization, and telemetry provenance labels.

## Scope

- Deny access by default for unknown roles, permissions, and actions.
- Separate ordinary read operations from privileged configuration and integration operations.
- Require an independent human approver for high-impact actions.
- Redact likely credentials and sensitive fields before producing audit summaries.
- Require telemetry values to declare whether they are measured, estimated, or simulated.

## Explicit limitations

These helpers are not an authentication system, identity provider, database policy, encryption layer, secrets manager, network firewall, or complete audit service. A caller must obtain identity from a trusted server-side authentication mechanism and enforce authorization on the server for every request. Client-side checks are not a security boundary.

No API integrations, external network requests, production deployment, or autonomous execution are included. All integration providers remain disabled by default.

## Run tests

From the repository root:

```sh
node --test grid-core/*.test.mjs
```

## Next required work

1. Select and review the actual Base44 development project and its access model.
2. Implement server-side authentication and row/entity access policies.
3. Store credentials only in the platform's server-side secret store.
4. Persist audit events with access restrictions, retention, and integrity controls.
5. Add rate limiting, input validation, backup/restore, and incident response.
6. Independently review the implementation before any hosted release.
