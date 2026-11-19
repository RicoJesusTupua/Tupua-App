import test from "node:test";
import assert from "node:assert/strict";
import {
  authorize,
  permissionsForRole,
  requiresHumanApproval,
  validateHumanApproval,
  integrationDefaultState
} from "./access-control.mjs";
import { createAuditEvent, labelMetric } from "./audit.mjs";

test("unknown roles and malformed actors fail closed", () => {
  assert.equal(authorize({ id: "u1", role: "unknown" }, "grid:status:read"), false);
  assert.equal(authorize(null, "grid:status:read"), false);
  assert.equal(authorize({ id: "", role: "architect" }, "grid:config:write"), false);
  assert.deepEqual(permissionsForRole("unknown"), []);
});

test("roles receive only their declared permissions", () => {
  assert.equal(authorize({ id: "u1", role: "public" }, "grid:status:read"), true);
  assert.equal(authorize({ id: "u1", role: "public" }, "grid:audit:read"), false);
  assert.equal(authorize({ id: "u2", role: "operator" }, "grid:tasks:create"), true);
  assert.equal(authorize({ id: "u2", role: "operator" }, "grid:config:write"), false);
});

test("high-impact actions require independent approval", () => {
  assert.equal(requiresHumanApproval("production.deploy"), true);
  assert.equal(requiresHumanApproval("grid.status.refresh"), false);
  const requester = { id: "person-a" };
  const base = {
    status: "approved",
    action: "production.deploy",
    target: "service-x",
    approver_id: "person-b",
    expires_at: 2000
  };
  assert.equal(validateHumanApproval({ requester, approval: base, action: "production.deploy", target: "service-x", now: 1000 }).allowed, true);
  assert.equal(validateHumanApproval({ requester, approval: { ...base, approver_id: "person-a" }, action: "production.deploy", target: "service-x", now: 1000 }).reason, "independent_human_approval_required");
  assert.equal(validateHumanApproval({ requester, approval: base, action: "production.deploy", target: "other-service", now: 1000 }).reason, "approval_scope_mismatch");
  assert.equal(validateHumanApproval({ requester, approval: { ...base, expires_at: 1000 }, action: "production.deploy", target: "service-x", now: 1000 }).reason, "approval_expired_or_invalid");
  assert.equal(validateHumanApproval({ requester, approval: null, action: "data.delete", target: "records" }).allowed, false);
});

test("integrations are disabled by default", () => {
  assert.deepEqual(integrationDefaultState(), { status: "disabled", permissions: [] });
});

test("audit event redacts credentials and omits common personal fields", () => {
  const event = createAuditEvent({
    actorType: "human",
    actorId: "user-1",
    action: "integration.request",
    targetType: "integration",
    targetId: "provider-x",
    outcome: "denied",
    details: {
      api_key: "do-not-log",
      email: "person@example.test",
      safe_reason: "approval required"
    },
    timestamp: "2026-11-19T11:00:00.000Z"
  });
  assert.equal(event.details.api_key, "[REDACTED]");
  assert.equal(event.details.email, "[OMITTED]");
  assert.equal(event.details.safe_reason, "approval required");
  assert.throws(() => createAuditEvent({}), TypeError);
});

test("metrics require explicit provenance labels", () => {
  assert.equal(labelMetric({ name: "cpu", value: 12, unit: "%", sourceType: "measured" }).source_type, "measured");
  assert.equal(labelMetric({ name: "demo", value: 100, unit: "units", sourceType: "simulated" }).source_type, "simulated");
  assert.throws(() => labelMetric({ name: "unknown", value: 1, unit: "x", sourceType: "live" }), TypeError);
  assert.throws(() => labelMetric({ name: "bad", value: Infinity, unit: "x", sourceType: "measured" }), TypeError);
});
