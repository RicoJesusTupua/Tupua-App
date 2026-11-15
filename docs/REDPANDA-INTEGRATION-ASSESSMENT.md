# Tupua–Redpanda Agentic Data Plane Integration Assessment

**Status:** Architecture assessment for development review only; no integration, account connection, purchase, deployment, or production change has been performed.
**Date:** 2026-11-15
**Repository:** `RicoJesusTupua/Tupua-App`
**Target branch:** `security/governance-baseline-2026-11-08`
**Decision:** **Conditional evaluation recommended; adoption not yet approved.**

## 1. Executive assessment

Redpanda's Agentic Data Plane (ADP) is relevant to Tupua because it places an identity, policy, and observability layer between agents, model providers, tools, and data systems. Its documented architecture supports both Redpanda-managed agents and customer-hosted agents, with model and tool traffic routed through its AI Gateway and MCP Gateway.

The strongest architectural fit is not the use of another agent runtime. It is the possibility of enforcing authorization and collecting operational evidence outside the model itself.

This is a product-fit assessment based on Redpanda's public documentation reviewed on 2026-11-15. Vendor documentation describes intended product behavior; it is not an independent security audit, contractual guarantee, or proof that every control meets Tupua's requirements.

## 2. Verified product capabilities described by Redpanda

The following points are documented by Redpanda:

- **Agent identity and runtime choices:** ADP supports managed agents hosted by Redpanda and self-managed agents hosted by the customer. Self-managed agents can be registered so their model and tool traffic is routed through the gateways.
- **MCP Gateway:** MCP servers expose tools and data. The gateway mediates authentication, access policy, and observability for managed and self-managed MCP servers.
- **AI Gateway:** Model traffic can be routed through provider-specific gateway endpoints. Redpanda documents connections to OpenAI, Anthropic, Google Gemini, Amazon Bedrock, and OpenAI-compatible endpoints.
- **Authorization and user context:** Redpanda documents tool-level policy enforcement outside the model and authorization of an agent's tool call as the user behind the agent where delegated user identity is configured. An agent's own identity does not grant the user additional permissions.
- **Data policies:** Redpanda documents policies that can mask, drop, or filter tool data and restrict arguments before data is returned to the model. Some data-policy and guardrail capabilities are marked Preview in the documentation.
- **Budgets and containment:** Documentation describes per-agent/provider spending limits and a kill switch that can cut an agent off from model providers, MCP servers, and other agents.
- **Observability:** Redpanda documents OpenTelemetry traces, configurable transcript recording, and an audit log for authorization decisions and configuration changes. Transcript modes include full content, metadata-only, or no transcript.
- **Deployment environment:** Redpanda documents creating an ADP environment in an AWS account or Google Cloud project.

Sources are listed in Section 10. Confirm product availability, preview status, regional support, limits, and contractual terms directly before relying on any feature.

## 3. Fit against Tupua's current state

The GitHub application previously inspected is a static, browser-based workspace using `localStorage`. The repository's existing governance and agent-control-plane documents describe a future backend and Base44 control plane, but those specifications are not deployed services.

| Tupua need | ADP relevance | Assessment |
|---|---|---|
| AgentRegistry and identity | Managed/self-managed agent identities | Potential fit; define Tupua's canonical identity and lifecycle first |
| IntegrationRegistry | MCP server registration and gateway routing | Strong conceptual fit; only connect approved, low-risk tools |
| AgentTasks and AgentEvents | Traces, events, and agent execution records | Partial fit; Tupua still needs its own task and approval records |
| AgentApprovals | Tool policies and user-context authorization | Complementary, not equivalent; Tupua's human approval workflow remains necessary |
| AuditLogs | Authorization/configuration audit events and traces | Potential fit; verify export, retention, immutability, and access controls |
| Model-provider independence | AI Gateway and provider routing | Potential fit; test portability and provider-specific behavior |
| Live data movement | Redpanda streaming and Connect | Only needed if Tupua has a real event-streaming use case |
| Current Codex Studio | Static localStorage app | Not directly integration-ready; requires a separately designed server-side backend |

**Important:** ADP would not automatically implement Tupua's governance model, replace Base44, or turn the current static application into a secure multi-user system.

## 4. Proposed target architecture

Keep Tupua as the policy owner and system of record for its own governance decisions. Treat Redpanda as an optional infrastructure provider behind a replaceable adapter.

```
Tupua user interface / Base44 development control plane
                         |
              Tupua application API
                         |
          Tupua policy and approval service
          - identity mapping
          - task scope and risk classification
          - human approval state
          - integration allowlist
          - audit correlation IDs
                         |
              Provider adapter boundary
                         |
          Redpanda ADP (optional provider)
          - AI Gateway
          - MCP Gateway
          - agent identity / routing
          - policy enforcement
          - traces and audit events
               /                 \
      approved model APIs     approved MCP tools
               \                 /
                 authorized results
                         |
             Tupua audit and review store
```

The provider adapter must allow a future replacement with another gateway or self-hosted services without rewriting Tupua's task, approval, and audit data models.

## 5. Mandatory security and governance requirements

A proof of concept must not proceed beyond isolated, synthetic-data testing until the following have been answered and tested:

### Identity and authorization
- Map each Tupua user and agent to a stable identity. Do not rely on a shared administrator credential for ordinary agent actions.
- Confirm whether delegated end-user identity is supported for each proposed connector and operation.
- Verify deny-by-default behavior and test cross-user access attempts.
- Ensure tool permissions are enforced server-side, not merely described in prompts.
- Do not let agents create, expand, or approve their own permissions.

### Human control
- Tupua retains its own approval record for production changes, external communications, sensitive exports, deletion, financial commitments, and permission changes.
- A gateway policy is an additional control, not a substitute for Tupua's human approval workflow.
- Test emergency containment, credential revocation, and recovery. Document who can trigger and release a kill switch.
- Require a named human owner and rollback plan for every consequential workflow.

### Privacy and data handling
- Use synthetic or public test data in the initial proof of concept.
- Determine data residency, subprocessors, encryption, key management, retention, deletion, backup, and incident-notification terms.
- Choose transcript mode deliberately. Default to metadata-only or no content transcript unless a documented need justifies storing content.
- Confirm exactly which prompts, tool arguments, tool results, traces, and audit events are retained and where.
- Apply data minimization and redact credentials, personal data, and confidential manuscript content from logs.
- Do not send restricted family, legal, financial, or unpublished creative materials during evaluation.

### Security assurance
- Obtain current independent assurance materials and the applicable security documentation under appropriate access controls.
- Review vulnerability disclosure, incident response, business continuity, access administration, and support procedures.
- Verify secret isolation and rotation. Never place provider keys in browser code, GitHub, Base44 page properties, or client-side storage.
- Review connector scopes individually; a connector catalog entry is not blanket authorization to access a system.
- Test prompt-injection and malicious tool-output scenarios to confirm that tool policy remains effective.

### Audit and portability
- Confirm audit-log export formats, retention windows, queryability, timestamps, actor attribution, and deletion behavior.
- Correlate provider traces with Tupua task IDs and approval IDs without copying unnecessary content.
- Test exporting agent configuration, policy definitions, and audit evidence.
- Document the steps and cost to switch to another gateway or run a self-managed alternative.

## 6. Proof-of-concept plan

**Phase 0 — Vendor and architecture diligence**
- Confirm current product availability, preview labels, pricing, regional support, and contract terms.
- Obtain security, privacy, data-processing, and architecture documentation.
- Identify one non-sensitive use case and one low-risk read-only data source.
- Define measurable acceptance criteria before creating an environment.

**Phase 1 — Isolated sandbox**
- Use synthetic records and a non-production environment.
- Register one self-managed test agent if supported by the selected plan.
- Connect one read-only MCP tool with the narrowest available scope.
- Route one approved model provider through AI Gateway.
- Keep all secrets in the provider's supported server-side secret store.
- Do not connect GitHub write operations, Base44 production, personal accounts, or sensitive project data.

**Phase 2 — Negative and resilience tests**
- Verify unauthorized tool calls are denied.
- Verify one user's agent cannot retrieve another user's data.
- Verify argument restrictions and data masking.
- Verify budgets, provider failure behavior, and emergency containment.
- Verify logs show actor, resource, decision, timestamp, and correlation ID without exposing secrets.
- Verify transcript settings match the approved privacy configuration.
- Verify revoking the integration actually prevents further access.

**Phase 3 — Independent review**
- Have a reviewer other than the implementer inspect configuration, permissions, test evidence, and data flows.
- Record gaps, residual risks, recurring costs, operational ownership, and exit procedure.
- Do not promote to production unless every mandatory control has evidence and an authorized human approves.

## 7. Acceptance criteria

A proof of concept passes only if all are demonstrated:

- [ ] No production systems or sensitive user data were connected.
- [ ] All agents have unique, attributable identities.
- [ ] Tool access is deny-by-default and enforced outside the model.
- [ ] User-level authorization is preserved where delegated identity is required.
- [ ] High-impact operations remain behind Tupua human approval.
- [ ] Emergency containment and credential revocation work as documented.
- [ ] Transcript and trace settings meet the privacy decision.
- [ ] Audit events can be correlated to Tupua tasks and approvals.
- [ ] Costs and budgets are visible and bounded.
- [ ] Data export and provider-exit procedures are tested.
- [ ] Independent review has no unresolved critical findings.
- [ ] A human owner has approved the next stage.

Failure of any critical identity, authorization, privacy, or containment test is a no-go until corrected and retested.

## 8. Risks, limitations, and open questions

1. **Vendor dependency:** ADP may simplify operations but creates a new provider dependency. Portability must be demonstrated, not assumed.
2. **Preview features:** Some documented guardrails and data policies are preview capabilities. Do not make them a production control until availability and support status are confirmed.
3. **Authorization complexity:** Shared service credentials can weaken user-level access boundaries. Prefer delegated user identity where the upstream system and connector support it.
4. **Audit completeness:** Traces, transcripts, and audit events are different records. Confirm coverage and retention for each.
5. **Cost and operational burden:** Streaming infrastructure may be unnecessary for Tupua's current local-first application. Do not add Kafka-compatible streaming solely because it is available.
6. **Product claims:** Redpanda's own documentation is useful for feature discovery but does not replace independent validation, a contract review, or security testing.

Questions for Redpanda:
- Which ADP capabilities are generally available versus Preview as of the evaluation date?
- What are the exact data residency and retention options for prompts, transcripts, traces, audit events, and secrets?
- Can audit events and traces be exported continuously to a Tupua-controlled store?
- Which connectors support delegated per-user OAuth, and which use shared credentials?
- What are the kill-switch scope, propagation time, and recovery behavior?
- What are the pricing units, hard limits, and costs for gateways, agents, traces, and streaming?
- What are the supported environment regions and customer-managed deployment boundaries?
- What configuration and audit data can be exported if Tupua exits the service?

## 9. Decision

**Recommendation: Evaluate, do not adopt yet.**

Redpanda ADP appears architecturally relevant as a possible governed gateway and observability layer for future Tupua agents. The current repository application is not ready for direct integration, and no evidence in this assessment establishes that ADP satisfies Tupua's full security, privacy, cost, or portability requirements.

Proceed only with vendor diligence and, if the requirements can be verified, a narrowly scoped sandbox proof of concept using synthetic data. Keep Tupua's own identity, approval, and audit records authoritative. Do not connect production services or sensitive information without a separate explicit approval.

This assessment does not authorize or perform any access to Redpanda, Base44, external model providers, or third-party systems.

## 10. Public references reviewed

All links below are Redpanda's public product or technical documentation, accessed 2026-11-15:

1. [Agentic Data Plane overview](https://docs.redpanda.com/agentic-data-plane/get-started/adp-overview/) — architecture, ownership model, identity, gateways, traces, transcripts, audit log, budgets, and kill switch.
2. [Agentic Data Plane home](https://docs.redpanda.com/agentic-data-plane/home/) — product overview and stated capabilities.
3. [How MCP servers work](https://docs.redpanda.com/agentic-data-plane/connect/mcp-overview/) — managed and self-managed MCP servers and gateway flow.
4. [Connect tools with MCP servers](https://docs.redpanda.com/agentic-data-plane/connect/mcp-servers/) — connector configuration and data policies.
5. [AI Gateway and LLM providers](https://docs.redpanda.com/agentic-data-plane/gateway/) — supported provider integration guides.
6. [How AI Gateway works](https://docs.redpanda.com/agentic-data-plane/gateway/overview/) — gateway configuration and observability.
7. [How agents work](https://docs.redpanda.com/agentic-data-plane/connect/agents-overview/) — declarative agents, tools, subagents, and context.
8. [Agentic Data Summit](https://www.redpanda.com/agentic-data-summit) — summit agenda and product framing; event listed for December 9, 2026.

## 11. Relationship to existing Tupua governance documents

This assessment supplements, and does not replace:
- `docs/GOVERNANCE-AND-SECURITY-BASELINE.md`
- `docs/AGENT-CONTROL-PLANE-SPEC.md`
- `docs/HUMAN-SOVEREIGNTY-AND-ACCOUNTABILITY.md`

The governing principle remains: technology should expand people's ability to participate in and hold institutions accountable, not displace their rights or agency.
