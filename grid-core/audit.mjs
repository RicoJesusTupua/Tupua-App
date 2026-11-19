const SENSITIVE_KEY = /(password|secret|token|authorization|api.?key|private.?key|credential|recovery.?code)/i;
const PERSONAL_KEY = /(email|phone|address|birth.?date|government.?id|ssn)/i;

function sanitize(value, depth = 0) {
  if (depth > 8) return "[omitted: depth limit]";
  if (Array.isArray(value)) return value.slice(0, 50).map((item) => sanitize(item, depth + 1));
  if (!value || typeof value !== "object") {
    if (typeof value === "string") return value.length > 500 ? value.slice(0, 500) + "…" : value;
    if (typeof value === "number" || typeof value === "boolean" || value === null) return value;
    return String(value);
  }

  const clean = {};
  for (const [key, item] of Object.entries(value).slice(0, 50)) {
    if (SENSITIVE_KEY.test(key)) clean[key] = "[REDACTED]";
    else if (PERSONAL_KEY.test(key)) clean[key] = "[OMITTED]";
    else clean[key] = sanitize(item, depth + 1);
  }
  return clean;
}

/**
 * Produce a minimized audit event. Persistence, immutability, access control,
 * and retention must be supplied by a trusted server-side audit service.
 */
export function createAuditEvent({ actorType, actorId, action, targetType, targetId, outcome, approvalId = null, correlationId = null, details = {}, timestamp = new Date().toISOString() }) {
  const required = [actorType, actorId, action, targetType, targetId, outcome, timestamp];
  if (required.some((value) => typeof value !== "string" || value.trim() === "")) {
    throw new TypeError("Audit event is missing a required string field");
  }

  return Object.freeze({
    actor_type: actorType,
    actor_id: actorId,
    action,
    target_type: targetType,
    target_id: targetId,
    outcome,
    approval_id: approvalId,
    correlation_id: correlationId,
    timestamp,
    details: sanitize(details)
  });
}

export function labelMetric({ name, value, unit, sourceType }) {
  if (typeof name !== "string" || name.trim() === "") throw new TypeError("Metric name is required");
  if (typeof value !== "number" || !Number.isFinite(value)) throw new TypeError("Metric value must be finite");
  if (typeof unit !== "string" || unit.trim() === "") throw new TypeError("Metric unit is required");
  if (!["measured", "estimated", "simulated"].includes(sourceType)) {
    throw new TypeError("Metric sourceType must be measured, estimated, or simulated");
  }
  return Object.freeze({ name, value, unit, source_type: sourceType });
}
