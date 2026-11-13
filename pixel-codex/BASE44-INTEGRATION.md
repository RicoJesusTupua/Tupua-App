# Base44 Integration Boundary — Pixel LED Codex

**Status:** Proposed design only; no Base44 project changes have been made.

## Intended topology

- GitHub remains the version-controlled source of truth for the prototype.
- Base44 may host a future dashboard module and authenticated backend functions.
- The browser UI must call only narrowly scoped backend functions.
- Credentials and provider secrets must remain in Base44-managed server-side secret storage.
- No client-side code may contain API keys, personal access tokens, service-role secrets, or privileged credentials.

## Proposed data entities

### CodexExamples
- \`example_id\`: stable identifier
- \`title\`, \`category\`, \`representation\`
- \`source_type\`: user-provided, measured, estimated, simulated
- \`source_reference\`: reference to a permitted source, not a secret
- \`dimensions\`, \`components\`, \`relationships\`
- \`created_by\`, \`created_at\`, \`updated_at\`
- \`classification\`: public, internal, confidential, restricted

### CodexBlueprints
- \`blueprint_id\`, \`schema_version\`, \`title\`, \`target\`
- \`source_example_ids\`
- \`blueprint_json\`
- \`review_status\`: draft, awaiting_review, approved, rejected
- \`reviewed_by\`, \`reviewed_at\`

### CodexAuditEvents
- \`event_id\`, \`actor_id\`, \`action\`, \`target_id\`
- \`timestamp\`, \`outcome\`, \`correlation_id\`
- Store minimum necessary metadata; never log credentials or raw secrets.

## Permission model

- Public: no access to private examples or blueprints.
- Operator: create and edit records within assigned workspace scope.
- Reviewer: inspect and approve descriptive blueprints.
- Architect: administer configuration and integration scopes.

Enforce authorization in backend functions and database access rules. Hiding a control in the browser is not authorization. Users and agents must not elevate their own roles.

## Proposed backend functions

1. \`validateCodexExample\`: validate schema, source type, and provenance.
2. \`saveCodexExample\`: store an example only after authenticated authorization.
3. \`createCodexBlueprint\`: create a descriptive, non-executable blueprint.
4. \`combineCodexExamples\`: combine records only within the caller's authorized scope.
5. \`recordCodexAuditEvent\`: append a minimal audit record.
6. \`exportCodexBundle\`: export only records the caller may access.

All functions require input validation, authorization, bounded payload size, rate limiting where appropriate, and safe error handling.

## Integration safeguards

- Start read-only, then add create/update operations in a development workspace.
- Default all integrations to disabled until purpose, data flow, permission scope, retention, and revocation are reviewed.
- Never execute generated code automatically.
- Never permit an agent to approve its own high-impact action.
- Preserve source provenance and distinguish measured, estimated, simulated, and user-provided information.
- Provide a safe pause, audit trail, and rollback plan.
- Do not expose confidential records to a public GitHub repository or public browser bundle.

## Acceptance tests before any integration

- Unauthenticated requests are rejected.
- Users cannot read or modify records outside their permitted scope.
- Public users cannot read internal, confidential, or restricted examples.
- Invalid or oversized input is rejected.
- Simulated data remains visibly labeled as simulated.
- Measured data requires instrument or method provenance.
- Generated blueprints cannot auto-execute.
- Revoked integration credentials fail closed.
- Audit events omit secrets and unnecessary personal data.
- Backup, restore, and rollback are tested.

## Not included in this task

- No Base44 API calls or project edits.
- No schema creation in Base44.
- No live AI provider integration.
- No physical sensor integration.
- No cloud storage or account system.
- No production deployment or modification.

A separate Base44 development connection and explicit implementation review are required before these steps can be carried out.
