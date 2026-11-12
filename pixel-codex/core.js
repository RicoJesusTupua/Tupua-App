export const DIMENSION_LAYERS = [
  { id: 1, name: "Spatial coordinates", key: "spatial" },
  { id: 2, name: "Color and light", key: "light" },
  { id: 3, name: "Depth and geometry", key: "geometry" },
  { id: 4, name: "Time and motion", key: "motion" },
  { id: 5, name: "Energy and intensity", key: "intensity" },
  { id: 6, name: "Information and data", key: "information" },
  { id: 7, name: "Relationships and networks", key: "relationships" },
  { id: 8, name: "Intelligence and interpretation", key: "interpretation" },
  { id: 9, name: "Memory and continuity", key: "memory" },
  { id: 10, name: "Ethics and governance", key: "governance" },
  { id: 11, name: "Integration and orchestration", key: "integration" }
];

const SOURCE_TYPES = new Set(["user-provided", "measured", "estimated", "simulated"]);

function cleanText(value, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}

function cloneList(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 100).map((item) => {
    if (typeof item === "string") return cleanText(item, 300);
    if (item && typeof item === "object") return structuredClone(item);
    return cleanText(item, 300);
  });
}

export function createExample(input = {}) {
  const sourceType = SOURCE_TYPES.has(input.sourceType) ? input.sourceType : "user-provided";
  return {
    id: cleanText(input.id, 100) || "example-" + Date.now().toString(36),
    title: cleanText(input.title, 120) || "Untitled example",
    source: cleanText(input.source, 2000),
    category: cleanText(input.category, 80) || "general",
    representation: cleanText(input.representation, 80) || "concept",
    dimensions: cloneList(input.dimensions).filter((value) => typeof value === "string"),
    components: cloneList(input.components),
    relationships: cloneList(input.relationships),
    sourceType,
    instrument: cleanText(input.instrument, 160),
    notes: cleanText(input.notes, 1000),
    createdAt: cleanText(input.createdAt, 50) || new Date().toISOString()
  };
}

export function validateExample(example) {
  const issues = [];
  if (!example || typeof example !== "object" || Array.isArray(example)) {
    return { valid: false, issues: ["Example must be an object."] };
  }
  if (!cleanText(example.title, 120)) issues.push("A title is required.");
  if (!cleanText(example.category, 80)) issues.push("A category is required.");
  if (!cleanText(example.representation, 80)) issues.push("A representation type is required.");
  if (!Array.isArray(example.components)) issues.push("Components must be an array.");
  if (!Array.isArray(example.relationships)) issues.push("Relationships must be an array.");
  if (!SOURCE_TYPES.has(example.sourceType)) issues.push("Source type must be user-provided, measured, estimated, or simulated.");
  if (example.sourceType === "measured" && !cleanText(example.instrument, 160)) {
    issues.push("Measured data must identify the instrument or measurement method.");
  }
  return { valid: issues.length === 0, issues };
}

export function deconstructExample(example) {
  const validation = validateExample(example);
  if (!validation.valid) throw new TypeError(validation.issues.join(" "));
  return {
    id: example.id,
    title: example.title,
    category: example.category,
    representation: example.representation,
    sourceType: example.sourceType,
    componentCount: example.components.length,
    relationshipCount: example.relationships.length,
    dimensions: [...example.dimensions],
    components: cloneList(example.components),
    relationships: cloneList(example.relationships),
    provenance: {
      source: cleanText(example.source, 2000),
      instrument: cleanText(example.instrument, 160) || null,
      notes: cleanText(example.notes, 1000)
    }
  };
}

export function combineExamples(examples) {
  if (!Array.isArray(examples) || examples.length < 2) {
    throw new TypeError("Provide at least two examples to combine.");
  }
  const parts = examples.map((example) => {
    const validation = validateExample(example);
    if (!validation.valid) throw new TypeError(validation.issues.join(" "));
    return deconstructExample(example);
  });
  const unique = (items) => {
    const seen = new Set();
    return items.filter((item) => {
      const key = typeof item === "string" ? item : JSON.stringify(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };
  return {
    schemaVersion: "1.0.0",
    title: "Combined Codex example",
    sourceType: "derived",
    inputs: parts.map(({ id, title, sourceType }) => ({ id, title, sourceType })),
    categories: unique(parts.map((part) => part.category)),
    dimensions: unique(parts.flatMap((part) => part.dimensions)),
    components: unique(parts.flatMap((part) => part.components)),
    relationships: unique(parts.flatMap((part) => part.relationships)),
    safeguards: [
      "Preserve the provenance of every input.",
      "Do not treat simulated or estimated values as measured facts.",
      "Require human review before exporting executable integrations."
    ]
  };
}

export function createBlueprint(example, target = "generic") {
  const validation = validateExample(example);
  if (!validation.valid) throw new TypeError(validation.issues.join(" "));
  const allowedTargets = new Set(["generic", "web", "base44", "github"]);
  if (!allowedTargets.has(target)) throw new TypeError("Unsupported export target.");
  return {
    schemaVersion: "1.0.0",
    codex: "Tupua Pixel LED Codex",
    principle: "For Example → All Examples",
    target,
    generatedAt: new Date().toISOString(),
    source: {
      id: example.id,
      title: example.title,
      category: example.category,
      sourceType: example.sourceType,
      instrument: example.instrument || null,
      notes: example.notes || ""
    },
    model: {
      representation: example.representation,
      dimensions: [...example.dimensions],
      components: cloneList(example.components),
      relationships: cloneList(example.relationships)
    },
    execution: {
      mode: "descriptive-blueprint-only",
      autoExecute: false,
      requiresHumanReview: true
    },
    limitations: [
      "This export is a portable description, not a deployed integration.",
      "No physical sensor is implied by a visualization.",
      "Conceptual dimension layers are information categories, not claims of literal extra physical dimensions."
    ]
  };
}

export function toTypeScriptContract(blueprint) {
  if (!blueprint || blueprint.codex !== "Tupua Pixel LED Codex") {
    throw new TypeError("A Tupua Pixel LED Codex blueprint is required.");
  }
  return [
    "export interface TupuaCodexBlueprint {",
    '  schemaVersion: "1.0.0";',
    '  codex: "Tupua Pixel LED Codex";',
    "  principle: string;",
    '  target: "generic" | "web" | "base44" | "github";',
    "  source: { id: string; title: string; category: string; sourceType: string; instrument: string | null; notes: string };",
    "  model: { representation: string; dimensions: string[]; components: unknown[]; relationships: unknown[] };",
    "  execution: { mode: \"descriptive-blueprint-only\"; autoExecute: false; requiresHumanReview: true };",
    "  limitations: string[];",
    "}",
    "",
    "// Generated as a reviewable contract. It does not execute or grant permissions."
  ].join("\n");
}

export function exportBundle(examples, target = "generic") {
  if (!Array.isArray(examples)) throw new TypeError("Examples must be an array.");
  const blueprints = examples.map((example) => createBlueprint(example, target));
  return JSON.stringify({
    bundleVersion: "1.0.0",
    exportedAt: new Date().toISOString(),
    codex: "Tupua Pixel LED Codex",
    target,
    blueprints
  }, null, 2);
}
