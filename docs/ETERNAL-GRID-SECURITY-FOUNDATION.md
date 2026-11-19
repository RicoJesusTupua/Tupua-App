# Tupua Eternal Grid — Security Foundation

**Status:** Implemented as an isolated development prototype on `feat/tupua-eternal-grid-security-dev`. Not merged, deployed, or security-certified.

## Build configuration

- First target: Eternal Grid.
- Scope: development only.
- First priority: security.
- Existing production behavior: unchanged.
- External integrations: disabled by default.

## Implemented in this branch

- `grid-core/access-control.mjs`: fail-closed role/permission helper and explicit independent-approval checks for high-impact action categories.
- `grid-core/audit.mjs`: privacy-minimized audit event construction and mandatory telemetry provenance labels.
- `grid-core/security.test.mjs`: offline unit tests for access decisions, approval scope/expiry, default integration state, audit redaction, and metric provenance.
- `.github/workflows/eternal-grid-security-tests.yml`: read-only GitHub Actions permissions and Node.js unit tests; no deployment steps.
- `grid-core/README.md`: scope, limitations, and next requirements.

## Security boundary

The code does not authenticate users, persist audit records, encrypt data, manage credentials, configure Base44, protect GitHub branches, or enforce authorization at an application/API boundary by itself. These helpers must be called by trusted server-side code after authentication. Client-supplied role claims must never be trusted.

The existing application remains local-first and browser-storage-based. Do not store sensitive data in its localStorage.

## Verification

Run:

```sh
node --test grid-core/*.test.mjs
```

GitHub Actions is configured to run the same tests on relevant pushes and pull requests. A workflow definition is not evidence that a workflow run has passed; check the actual run result before accepting the change.

## Next gated steps

1. Review and export the live Base44 development project before any change there.
2. Select the authentication provider and implement server-side session validation.
3. Enforce role checks at every server-side data and action boundary.
4. Configure secrets in the server-side secret manager; keep all integration credentials out of Git.
5. Add a durable, access-controlled audit store and retention policy.
6. Add request validation, rate limits, CSRF protections where applicable, backup/restore, and incident response.
7. Run independent review and security tests before considering any merge.
8. Production deployment requires a separate explicit approval.
