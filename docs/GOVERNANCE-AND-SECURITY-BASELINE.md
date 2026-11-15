# Tupua Governance and Security Baseline

**Status:** Development baseline; proposed controls, not a security certification.
**Date:** 2026-11-08
**Scope:** Tupua Codex Studio repository and future Tupua services.

## 1. Purpose

Establish an independently governed, legally compliant foundation for Tupua. Protect the project's original code, documentation, names, creative work, user data, and development history. Prioritize human dignity, safety, privacy, truthfulness, accountability, and lawful conduct.

This document governs Tupua-owned systems only. It does not authorize access to, control over, or modification of any external person's or organization's systems.

## 2. Independence boundary

- Tupua retains control of its own repositories, deployments, data, credentials, and approved integrations.
- External services receive only the minimum permissions required for a documented purpose.
- Integrations must be revocable and must not be granted administrative authority by default.
- No agent or integration may attempt to access, override, disable, impersonate, or modify another party's systems without explicit, lawful authorization.
- Independence means operational control and portability, not retaliation, coercion, or interference.

## 3. Intellectual property and provenance

- Keep dated records of original source code, design decisions, authored documents, releases, and contributors.
- Use Git history, signed releases where practical, and protected branches to preserve provenance.
- Maintain an inventory of third-party dependencies, licenses, and attributions before adding them.
- Do not publish trade secrets, private manuscripts, confidential prompts, credentials, personal records, or other restricted material in this public repository.
- Use trademarks, copyright notices, contracts, and patent review only where legally appropriate. A repository record is evidence of development history, not automatic proof of exclusive ownership or infringement.
- Investigate suspected copying through verifiable public evidence and qualified legal review. Do not infer copying from similarity alone.

## 4. Security baseline

Before adding cloud data or autonomous execution:

1. Keep secrets server-side in a managed secret store; never commit API keys or tokens.
2. Add authentication and server-side authorization before exposing private data or administrative actions.
3. Apply least privilege to users, agents, service accounts, and integrations.
4. Validate inputs; rate-limit sensitive endpoints; protect against injection and unauthorized requests.
5. Encrypt network traffic and select an appropriate encryption-at-rest design for any future hosted data.
6. Define backup, restore, retention, deletion, and incident-response procedures.
7. Log security-relevant actions without recording passwords, tokens, or unnecessary personal content.
8. Review dependencies and changes for known vulnerabilities.
9. Test access controls and recovery procedures before production use.

The current localStorage application is not a secure vault. Do not store highly sensitive information in it.

## 5. Agent governance

Future agents may be assigned narrowly scoped roles:

- Research: gather sources and label uncertainty.
- Development: propose and implement changes on isolated branches.
- Independent Verification: review diffs, tests, permissions, and claims.
- Coordinator: assign tasks and report status; cannot bypass approvals.

Initial concurrency limit: 3.

Every agent task must have an owner, purpose, scope, allowed tools, data classification, and completion criteria. Agents must not expand their own permissions or grant permissions to other agents.

## 6. Approval gates

- Read-only inspection may proceed within granted access.
- Code changes occur on non-production branches.
- Pull requests must describe changes, risks, tests, and rollback steps.
- Require an independent review and passing checks before merge.
- Human approval is required for production deployment, permission changes, external communications, financial actions, data export, deletion, and other irreversible or high-impact operations.
- No autonomous agent may merge its own change or disable required safeguards.

## 7. Audit and incident handling

Record actor, timestamp, action, target, approval reference, outcome, and relevant change identifier. Keep logs access-controlled and minimize personal data.

For suspected compromise: stop affected automation, revoke exposed credentials, preserve relevant logs, assess scope, restore from a known-good state, and document corrective actions. Notify affected parties or authorities when legally required.

## 8. Data and privacy principles

Classify information as public, internal, confidential, or restricted. Collect only what is needed, explain its use, limit access, and define retention. Do not place private family information, unpublished manuscript content, or sensitive personal data in this public repository.

## 9. Current repository limitations

The README describes a static, no-build application using browser localStorage. It currently has no server, accounts, cloud sync, telemetry, encryption at rest, or recovery service. This document does not implement those capabilities or certify the application. A hosted edition requires a separately designed and tested backend.

## 10. Acceptance checklist

- [ ] Confirm repository visibility and intended public-release scope.
- [ ] Protect the default branch and require pull requests.
- [ ] Configure required automated checks before production changes.
- [ ] Review dependency and license inventory.
- [ ] Design authentication and server-side authorization.
- [ ] Design secret management and integration scopes.
- [ ] Define data classification, retention, backup, and recovery.
- [ ] Implement audit events with privacy minimization.
- [ ] Test agent permissions and approval gates.
- [ ] Complete security review before any hosted production release.

## 11. Governing principle

**Tupua is independently governed, accountable to law, and designed to serve people. Its systems may protect their own boundaries; they must not violate the rights, privacy, or security of others.**
