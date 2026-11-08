# Tupua Finance Core — secure backend implementation plan

Status: development design and database migration draft only. No database, identity provider, payment provider, or production environment has been connected or provisioned.

## Objective

Replace the Finance Desk browser-only ledger with a server-authoritative financial record service. Preserve the existing prototype as a demo until the backend passes review. Never silently upload its localStorage records.

## Security model

- Authentication proves who signed in; authorization decides which records they may access.
- Deny by default. Every API request authenticates the session and authorizes the requested object.
- Derive owner identity from a verified server-side session/JWT. Ignore any client-supplied owner ID.
- Use PostgreSQL row-level security as a second enforcement layer. The backend sets transaction-local `app.user_id` only after validating the identity. The DB runtime role must not own protected tables and must not have BYPASSRLS.
- Keep payment credentials, signing secrets, database credentials, and provider tokens server-side only. Never place them in static HTML, browser storage, Git, or logs.
- Use append-only audit events for material changes. Void a ledger record rather than silently deleting history.
- Store money as integer minor units (for example, cents) plus ISO currency code; do not use floating-point arithmetic for persisted amounts.
- Require idempotency keys for writes to prevent duplicate records after retries.
- Log actor, action, object ID, timestamp, outcome, and correlation ID. Do not log credentials, full payment details, or unnecessary personal data.

## Data model

The initial SQL draft is `database/finance-core-schema.sql`. It contains:
- `ledger_entries`: manually recorded revenue, refunds, fees, and operating expenses.
- `audit_events`: append-only record of create/update/void actions.
- `idempotency_receipts`: request fingerprint and prior result for safe retry handling.

The schema is a starting point, not a certified accounting system. It deliberately excludes bank credentials, card numbers, customer profiles, tax calculations, payment settlement, and investment data.

## API contract (version 1)

All routes require an authenticated session. JSON responses use a stable envelope: `{ "data": ..., "error": null, "request_id": "..." }`. Errors must not disclose SQL, tokens, secrets, or stack traces.

| Method | Route | Purpose | Rules |
|---|---|---|---|
| GET | `/api/finance/v1/summary?from=YYYY-MM-DD&to=YYYY-MM-DD&currency=USD` | Aggregated totals | Owner scope derived server-side; date range bounded |
| GET | `/api/finance/v1/entries?from=...&to=...&type=...` | Paginated ledger | Owner scope; bounded page size; validated filters |
| POST | `/api/finance/v1/entries` | Create entry | Validate type/date/currency/amount; require Idempotency-Key |
| PATCH | `/api/finance/v1/entries/:id` | Correct entry metadata | Re-authorize object; audit before/after safe fields |
| POST | `/api/finance/v1/entries/:id/void` | Void entry | No hard delete; reason required; audit |
| GET | `/api/finance/v1/audit?cursor=...` | Read audit history | Owner scope; read-only; bounded pagination |

### Validation rules

- Amount must be a positive integer in minor currency units and within configured limits.
- Currency must be an enabled ISO 4217 code.
- Entry type must be one of revenue, refund, fee, or expense.
- Dates must be valid and within the allowed reporting window.
- Category, source label, and memo are length-limited plain text; render escaped.
- Unknown fields are rejected. Client totals are never trusted; summary totals are recomputed server-side.
- An idempotency key reused with a different request fingerprint returns a conflict rather than replaying a different operation.

## Reporting definitions

- Gross revenue = sum of posted revenue entries.
- Recorded outflows = posted refunds + fees + expenses.
- Net operating result = gross revenue - recorded outflows.
- Planning reserve = configurable percentage of positive net result, clearly labelled as an estimate.
- Retained planning balance = net operating result - planning reserve.
- These are management estimates, not cash balances, tax calculations, audited accounts, or promises of profit. Reconcile with official processor/bank statements and a qualified accounting professional.

## Delivery sequence

1. Choose the actual backend host/database that matches the deployed Base44 or cloud environment.
2. Provision a development-only database and authentication provider. Do not use production financial data.
3. Review and adapt the SQL migration to the provider's roles, identity claims, and connection-pooling behavior.
4. Implement server routes with centralized authentication, authorization, validation, rate limits, and audit writes.
5. Test isolation with two distinct test users: user A must never read, edit, void, or export user B's records.
6. Add backup/restore tests and secret scanning.
7. Replace browser-only Finance Desk reads/writes with the authenticated API only after the backend tests pass.
8. Only later, after adult/legal/accounting review where required, assess a payment processor integration. Payment events must be verified server-side and deduplicated; do not store card data.

## Go-live blockers

- Backend host and database are not selected/connected.
- Authentication provider and exact verified identity claims are not configured.
- SQL has not been applied or tested.
- No API server exists yet.
- No security review or backup restore drill has passed.
- No payment provider or live monetization flow is configured.
- The public repository must contain no secrets or private financial records.

## Security references

- PostgreSQL row security: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- OWASP authorization guidance: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
- OWASP logging guidance: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
