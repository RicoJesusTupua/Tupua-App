# Tupua Agent Control Plane — Base44 Implementation Specification

**Status:** Proposed build specification; not deployed.
**Date:** 2026-11-08
**Runtime direction:** Base44 control plane, with GitHub as source control and approved external services behind scoped integrations.

## 1. Objective

Provide a governed control plane for Tupua's own development and operations. This specification does not authorize control of third-party AI systems or external infrastructure. It defines how Tupua may coordinate agents that operate only within explicitly granted permissions.

## 2. Deployment sequence

1. Inspect and export the current Base44 project before making changes.
2. Preserve all existing pages, data, workflows, and published behavior.
3. Create the data model and access rules in a development environment.
4. Implement read-only status and audit views first.
5. Add task orchestration with human approval gates.
6. Add narrowly scoped GitHub operations on feature branches.
7. Add model/API integrations only after server-side secret storage and authorization are verified.
8. Run tests and security review; promote to production only with explicit approval.

Never place API keys or service tokens in browser code, page properties, public repository files, or user-visible logs.

## 3. Core entities

### AgentRegistry
- `agent_id` (stable identifier)
- `name`
- `role` (Research, Development, Independent Verification, Analytics, Documentation, Coordinator)
- `status` (disabled, ready, running, paused, error)
- `permission_profile_id`
- `model_provider` and `model_name` (non-secret configuration)
- `created_at`, `updated_at`

### AgentTasks
- `task_id`
- `title`, `objective`, `scope`
- `requested_by`, `assigned_agent_id`
- `status` (queued, awaiting_approval, running, review, completed, failed, cancelled)
- `risk_level` (low, medium, high)
- `allowed_resources`
- `acceptance_criteria`
- `approval_id`
- `created_at`, `started_at`, `completed_at`

### AgentSessions
- `session_id`, `agent_id`, `task_id`
- `started_at`, `ended_at`
- `status`
- `resource_summary`
- `result_reference`
- Never store raw credentials or unnecessary private prompt/content history.

### AgentEvents
- `event_id`, `task_id`, `agent_id`
- `event_type`, `timestamp`
- `summary`, `result`
- `correlation_id`
- Store only the minimum content needed for traceability.

### AgentApprovals
- `approval_id`, `task_id`
- `action_type`, `target_resource`
- `risk_summary`
- `requested_by`, `approved_by`
- `status` (pending, approved, rejected, expired)
- `decision_at`, `expires_at`

### IntegrationRegistry
- `integration_id`, `provider`, `purpose`
- `status` (disabled, pending, enabled, revoked)
- `permission_scope`
- `secret_reference` (reference to server-side secret storage only; never the secret value)
- `owner`, `last_reviewed_at`

### SystemMetrics
- `metric_id`, `timestamp`
- `component`, `metric_name`, `metric_value`, `unit`
- `source_type` (measured, estimated, simulated)
- Dashboard must label measured, estimated, and simulated values distinctly. Never present synthetic values as live telemetry.

### AuditLogs
- `audit_id`, `actor_type`, `actor_id`
- `action`, `target_type`, `target_id`
- `timestamp`, `approval_id`, `outcome`
- `correlation_id`
- Exclude credentials, tokens, and unnecessary personal content.

### ProjectKnowledge
- `knowledge_id`, `title`, `content_reference`
- `classification` (public, internal, confidential, restricted)
- `source`, `created_by`, `created_at`, `updated_at`
- `access_policy`
- Keep restricted documents outside the public GitHub repository.

## 4. Roles and access

Use server-enforced role checks; hiding a button is not authorization.

- **Public:** view explicitly public pages and public status only.
- **Operator:** run approved low-risk workflows and view operational summaries.
- **Authorized:** manage approved integrations and review sensitive operational records within assigned scope.
- **Architect:** administer configuration and approve high-impact changes.

Grant no role by default beyond the minimum required. Require stronger authentication for privileged roles. Log all role and permission changes. No user or agent may elevate its own role.

## 5. Initial agents and concurrency

Start with three agents, maximum concurrency 3:

1. **Research:** read approved sources, summarize findings, cite evidence, label uncertainty.
2. **Development:** create changes only on isolated feature branches; cannot merge or deploy.
3. **Independent Verification:** inspect diffs, run permitted tests, review security and acceptance criteria; cannot approve its own work.

Coordinator, Analytics, and Documentation roles may be added later after the initial controls are tested.

## 6. Approval matrix

Require explicit human approval for:
- Production deployments or changes to published behavior.
- Creating, changing, or revoking privileged credentials and permissions.
- External communications or actions on third-party services.
- Financial transactions, purchases, or paid resource commitments.
- Bulk export, disclosure, or deletion of user data.
- Destructive database, repository, or infrastructure operations.
- Changes to governance rules or approval requirements.

Read-only research and isolated development-branch changes may proceed within pre-approved scope. Agents cannot waive these gates.

## 7. Workflow

REQUESTED → POLICY_CHECK → APPROVAL (when required) → EXECUTION → INDEPENDENT_REVIEW → HUMAN_ACCEPTANCE → COMPLETE

Failure path: EXECUTION → FAILED → REVIEW → RETRY (if authorized) or CANCELLED.

Each task must record its scope, data classification, tools, allowed targets, acceptance criteria, and rollback plan. Use idempotency keys for retryable actions. Apply rate limits, timeouts, and bounded retries.

## 8. Integration boundaries

- **GitHub:** use least-privilege access; feature branches and pull requests; protect the default branch; no direct production deployment.
- **OpenAI API / model providers:** server-side calls only; explicit data minimization; document retention and provider settings before transmitting confidential content.
- **Base44:** enforce access controls and validation in backend functions, not solely in client UI.
- **Other providers:** disabled until purpose, data flows, scopes, costs, and revocation steps are reviewed.

No integration may be used to mimic, impersonate, scrape private data from, or override another organization's systems.

## 9. Required tests

- Public users cannot read internal, confidential, or restricted records.
- Operators cannot grant roles or alter integration secrets.
- Agents cannot approve their own high-impact tasks.
- Development agents cannot merge or deploy.
- Revoked integrations fail closed.
- Invalid inputs, excessive requests, and unauthorized actions are rejected and audited.
- Simulated metrics are visibly labeled.
- Backup and restore are tested before any hosted production release.

## 10. Acceptance criteria

The control plane is not production-ready until:
- Base44 project export and existing schema have been reviewed.
- Server-side authorization tests pass.
- Secret storage and rotation are verified.
- Audit and privacy controls are tested.
- Approval gates cannot be bypassed by UI manipulation or agent prompts.
- Recovery and rollback procedures are documented and exercised.
- An independent reviewer and the project owner approve release.

**Important:** This is a specification, not a deployed implementation. Current GitHub repository code remains a static local-first application. Base44 changes require access to the actual Base44 project and must be made in a development-first, reversible manner.
