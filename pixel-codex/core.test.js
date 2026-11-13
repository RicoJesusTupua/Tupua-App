import test from "node:test";
import assert from "node:assert/strict";
import {
  DIMENSION_LAYERS,
  createExample,
  validateExample,
  deconstructExample,
  combineExamples,
  createBlueprint,
  toTypeScriptContract,
  exportBundle
} from "./core.js";

const first = createExample({
  id: "test-pixel",
  title: "Pixel cube",
  category: "visualization",
  representation: "3D grid",
  source: "A simulated cube of luminous pixels.",
  dimensions: ["spatial", "light"],
  components: ["pixels", "vertices"],
  relationships: ["pixels form vertices"],
  sourceType: "simulated"
});
const second = createExample({
  id: "test-led",
  title: "LED matrix",
  category: "display",
  representation: "2D matrix",
  dimensions: ["spatial", "intensity"],
  components: ["pixels", "LED cells"],
  relationships: ["cells have brightness"],
  sourceType: "user-provided"
});

test("defines eleven conceptual information layers", () => {
  assert.equal(DIMENSION_LAYERS.length, 11);
  assert.equal(DIMENSION_LAYERS[10].key, "integration");
});

test("creates and validates a well-formed example", () => {
  assert.equal(validateExample(first).valid, true);
  assert.equal(first.sourceType, "simulated");
});

test("requires an instrument for measured data", () => {
  const measured = createExample({ ...first, id: "measured", sourceType: "measured", instrument: "" });
  const result = validateExample(measured);
  assert.equal(result.valid, false);
  assert.match(result.issues.join(" "), /instrument or measurement method/);
});

test("deconstructs an example without losing provenance", () => {
  const result = deconstructExample(first);
  assert.equal(result.componentCount, 2);
  assert.equal(result.provenance.source, first.source);
  assert.equal(result.sourceType, "simulated");
});

test("combines two examples and deduplicates components", () => {
  const result = combineExamples([first, second]);
  assert.equal(result.inputs.length, 2);
  assert.equal(result.components.filter((item) => item === "pixels").length, 1);
  assert.ok(result.safeguards.some((item) => item.includes("simulated")));
});

test("rejects a combination with fewer than two examples", () => {
  assert.throws(() => combineExamples([first]), /at least two examples/);
});

test("blueprints are descriptive and cannot auto-execute", () => {
  const blueprint = createBlueprint(first, "base44");
  assert.equal(blueprint.target, "base44");
  assert.equal(blueprint.execution.autoExecute, false);
  assert.equal(blueprint.execution.mode, "descriptive-blueprint-only");
  assert.ok(blueprint.limitations.length >= 3);
});

test("rejects unknown export targets", () => {
  assert.throws(() => createBlueprint(first, "production"), /Unsupported export target/);
});

test("creates a reviewable TypeScript contract, not an executable action", () => {
  const contract = toTypeScriptContract(createBlueprint(first));
  assert.match(contract, /requiresHumanReview: true/);
  assert.match(contract, /does not execute or grant permissions/);
});

test("exports a parseable bundle with provenance and target", () => {
  const bundle = JSON.parse(exportBundle([first, second], "github"));
  assert.equal(bundle.target, "github");
  assert.equal(bundle.blueprints.length, 2);
  assert.equal(bundle.blueprints[0].source.sourceType, "simulated");
});
