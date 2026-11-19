/**
 * Tupua Eternal Grid access policy helpers.
 *
 * These are server-side policy primitives, not authentication.
 * Always derive actor identity and role from a trusted server session.
 */

const ROLE_PERMISSIONS = Object.freeze({
  public: Object.freeze(["grid:status:read"]),
  operator: Object.freeze([
    "grid:status:read",
    "grid:tasks:read",
    "grid:tasks:create"
  ]),
  authorized: Object.freeze([
    "grid:status:read",
    "grid:tasks:read",
    "grid:tasks:create",
    "grid:integrations:read",
    "grid:audit:read"
  ]),
  architect: Object.freeze([
    "grid:status:read",
    "grid:tasks:read",
    "grid:tasks:create",
    "grid:integrations:read",
    "grid:audit:read",
    "grid:config:write",
    "grid:integrations:request",
    "grid:approvals:review"
  ])
});

const HIGH_IMPACT_ACTIONS = new Set([
  "production.deploy",
  "integration.enable",
  "integration.permission_change",
  "credential.rotate",
  "data.export",
  "data.delete",
  "governance.change"
]);

export function permissionsForRole(role) {
  return ROLE_PERMISSIONS[role] ? [...ROLE_PERMISSIONS[role]] : [];
}

export function authorize(actor, permission) {
  if (!actor || typeof actor !== "object") return false;
  if (typeof actor.id !== "string" || actor.id.trim() === "") return false;
  if (typeof permission !== "string" || permission.trim() === "") return false;

  const allowed = ROLE_PERMISSIONS[actor.role];
  return Array.isArray(allowed) && allowed.includes(permission);
}

export function requiresHumanApproval(action) {
  return HIGH_IMPACT_ACTIONS.has(action);
}

/**
 * Approval must be explicit, approved, scoped to the exact action and target,
 * unexpired, and made by a different human than the requester.
 */
export function validateHumanApproval({ requester, approval, action, target, now = Date.now() }) {
  if (!requiresHumanApproval(action)) return { allowed: true, reason: "approval_not_required" };
  if (!requester || typeof requester.id !== "string" || requester.id.trim() === "") {
    return { allowed: false, reason: "invalid_requester" };
  }
  if (!approval || approval.status !== "approved") {
    return { allowed: false, reason: "approval_missing_or_not_approved" };
  }
  if (approval.action !== action || approval.target !== target) {
    return { allowed: false, reason: "approval_scope_mismatch" };
  }
  if (typeof approval.approver_id !== "string" || approval.approver_id === requester.id) {
    return { allowed: false, reason: "independent_human_approval_required" };
  }
  if (!Number.isFinite(approval.expires_at) || approval.expires_at <= now) {
    return { allowed: false, reason: "approval_expired_or_invalid" };
  }
  return { allowed: true, reason: "approved" };
}

export function integrationDefaultState() {
  return Object.freeze({ status: "disabled", permissions: [] });
}
