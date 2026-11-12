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

const $ = (selector) => document.querySelector(selector);
const canvas = $("#holoCanvas");
const ctx = canvas.getContext("2d");
const state = {
  rotationX: -0.35,
  rotationY: 0.55,
  dragging: false,
  lastX: 0,
  lastY: 0,
  motion: true,
  brightness: 0.82,
  pixelSize: 5,
  hue: "cyan",
  dimension: 3,
  examples: [
    createExample({
      id: "starter-cube",
      title: "Spatial pixel cube",
      source: "A sample geometric form rendered as a simulated luminous pixel structure.",
      category: "visualization",
      representation: "3D wireframe and pixel field",
      dimensions: ["spatial", "geometry", "light"],
      components: ["vertices", "edges", "pixel nodes"],
      relationships: ["vertices connect through edges"],
      sourceType: "simulated",
      notes: "Starter example; not physical holographic output."
    }),
    createExample({
      id: "starter-led",
      title: "LED matrix",
      source: "A sample addressable light grid with adjustable brightness and color.",
      category: "display",
      representation: "2D LED matrix",
      dimensions: ["spatial", "light", "intensity"],
      components: ["LED cells", "brightness value", "color channel"],
      relationships: ["each LED cell has a position and intensity"],
      sourceType: "simulated",
      notes: "Starter example; no physical LED hardware is connected."
    })
  ]
};

const palettes = {
  cyan: { main: "#72f3ff", secondary: "#a9a0ff", glow: "rgba(64,224,255,.24)" },
  violet: { main: "#c5a3ff", secondary: "#72e5ff", glow: "rgba(166,115,255,.24)" },
  amber: { main: "#ffd28a", secondary: "#ff9d83", glow: "rgba(255,178,83,.22)" }
};

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(rect.width * ratio));
  canvas.height = Math.max(1, Math.round(rect.height * ratio));
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function rotatePoint(point, ax, ay) {
  const cosY = Math.cos(ay), sinY = Math.sin(ay);
  const cosX = Math.cos(ax), sinX = Math.sin(ax);
  const x1 = point.x * cosY - point.z * sinY;
  const z1 = point.x * sinY + point.z * cosY;
  return { x: x1, y: point.y * cosX - z1 * sinX, z: point.y * sinX + z1 * cosX };
}

function drawFrame(time) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!width || !height) return;
  if (state.motion && !state.dragging) state.rotationY += 0.0025;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#061321";
  ctx.fillRect(0, 0, width, height);
  const palette = palettes[state.hue];
  const cx = width / 2;
  const cy = height / 2 - 3;
  const scale = Math.min(width, height) * 0.34;
  const step = Math.max(3, state.pixelSize);
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.strokeStyle = "#21415b";
  ctx.lineWidth = 0.6;
  for (let x = 0; x < width; x += step * 2) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
  }
  for (let y = 0; y < height; y += step * 2) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }
  ctx.restore();

  for (let i = 0; i < 54; i++) {
    const x = (i * 79 + 17) % width;
    const y = (i * 43 + 11) % height;
    ctx.fillStyle = "rgba(180,225,255,.55)";
    ctx.fillRect(x, y, 1.3, 1.3);
  }

  const vertices = [];
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
    const p = rotatePoint({ x, y, z }, state.rotationX, state.rotationY);
    const perspective = 3.8 / (3.8 + p.z);
    vertices.push({ x: cx + p.x * scale * perspective, y: cy + p.y * scale * perspective, z: p.z });
  }
  const edges = [];
  for (let i = 0; i < vertices.length; i++) {
    for (let j = i + 1; j < vertices.length; j++) {
      const a = vertices[i], b = vertices[j];
      if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) > 1 && Math.abs(a.z - b.z) > 0.1) {
        const bitDiff = Math.abs((i ^ j));
        if ([1, 2, 4].includes(bitDiff)) edges.push([a, b]);
      }
    }
  }
  ctx.shadowBlur = 15;
  ctx.shadowColor = palette.glow;
  ctx.strokeStyle = palette.main;
  ctx.lineWidth = 1.4;
  for (const [a, b] of edges) {
    ctx.globalAlpha = 0.72 + ((a.z + b.z + 2) / 4) * 0.25;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;

  const count = Math.max(5, Math.round(18 - state.pixelSize / 2));
  for (let face = 0; face < 3; face++) {
    for (let u = 0; u <= count; u++) {
      for (let v = 0; v <= count; v++) {
        const p = face === 0
          ? { x: -1 + 2*u/count, y: -1 + 2*v/count, z: 1 }
          : face === 1
            ? { x: 1, y: -1 + 2*u/count, z: -1 + 2*v/count }
            : { x: -1 + 2*u/count, y: 1, z: -1 + 2*v/count };
        const q = rotatePoint(p, state.rotationX, state.rotationY);
        const perspective = 3.8 / (3.8 + q.z);
        const px = cx + q.x * scale * perspective;
        const py = cy + q.y * scale * perspective;
        const dot = Math.max(1, step * 0.22);
        ctx.globalAlpha = state.brightness * (0.38 + ((q.z + 1) / 2) * 0.55);
        ctx.fillStyle = face === 1 ? palette.secondary : palette.main;
        ctx.fillRect(px - dot/2, py - dot/2, dot, dot);
      }
    }
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 20;
  ctx.shadowColor = palette.glow;
  ctx.fillStyle = "#e9fdff";
  ctx.beginPath(); ctx.arc(cx, cy, 2.8, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;

  const rings = Math.min(11, state.dimension);
  ctx.strokeStyle = palette.secondary;
  ctx.globalAlpha = 0.15;
  for (let i = 0; i < rings; i++) {
    const rx = scale * (0.9 + i * 0.025);
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, Math.max(7, rx * 0.22), (i * Math.PI) / 11, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#9ccbd7";
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillText("CONCEPTUAL LAYERS: " + state.dimension + " / 11", 12, height - 13);
  requestAnimationFrame(drawFrame);
}
requestAnimationFrame(drawFrame);

canvas.addEventListener("pointerdown", (event) => {
  state.dragging = true;
  state.lastX = event.clientX;
  state.lastY = event.clientY;
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener("pointermove", (event) => {
  if (!state.dragging) return;
  state.rotationY += (event.clientX - state.lastX) * 0.009;
  state.rotationX += (event.clientY - state.lastY) * 0.009;
  state.lastX = event.clientX;
  state.lastY = event.clientY;
});
function endDrag() { state.dragging = false; }
canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointercancel", endDrag);
canvas.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") state.rotationY -= 0.12;
  if (event.key === "ArrowRight") state.rotationY += 0.12;
  if (event.key === "ArrowUp") state.rotationX -= 0.12;
  if (event.key === "ArrowDown") state.rotationX += 0.12;
});

$("#dimension").addEventListener("input", (event) => {
  state.dimension = Number(event.target.value);
  $("#dimensionValue").textContent = state.dimension + "D";
  const layer = DIMENSION_LAYERS[state.dimension - 1];
  $("#dimensionName").textContent = layer.name;
});
$("#brightness").addEventListener("input", (event) => {
  state.brightness = Number(event.target.value) / 100;
  $("#brightnessValue").textContent = event.target.value + "%";
});
$("#pixelSize").addEventListener("input", (event) => {
  state.pixelSize = Number(event.target.value);
  $("#pixelValue").textContent = state.pixelSize;
});
$("#palette").addEventListener("change", (event) => { state.hue = event.target.value; });
$("#motionToggle").addEventListener("click", () => {
  state.motion = !state.motion;
  $("#motionToggle").textContent = state.motion ? "Pause rotation" : "Resume rotation";
});

function showOutput(title, payload) {
  $("#outputTitle").textContent = title;
  $("#output").textContent = typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
  $("#outputPanel").hidden = false;
}
function downloadText(filename, content, type = "application/json") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function renderExamples() {
  const list = $("#exampleList");
  list.replaceChildren();
  state.examples.forEach((example, index) => {
    const item = document.createElement("label");
    item.className = "example-item";
    const check = document.createElement("input");
    check.type = "checkbox";
    check.checked = index < 2;
    check.dataset.exampleIndex = String(index);
    check.setAttribute("aria-label", "Select " + example.title);
    const text = document.createElement("span");
    const strong = document.createElement("strong");
    strong.textContent = example.title;
    const meta = document.createElement("small");
    meta.textContent = example.category + " · " + example.sourceType;
    text.append(strong, meta);
    item.append(check, text);
    list.append(item);
  });
  $("#exampleCount").textContent = state.examples.length + " examples";
  $("#combineButton").disabled = state.examples.length < 2;
}

$("#exampleForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const example = createExample({
    title: form.get("title"),
    source: form.get("source"),
    category: form.get("category"),
    representation: form.get("representation"),
    dimensions: ["spatial", "information"],
    components: ["description", "visual representation"],
    relationships: ["source informs representation"],
    sourceType: "user-provided",
    notes: "Entered by the user through the local prototype."
  });
  const validation = validateExample(example);
  if (!validation.valid) {
    showOutput("Needs attention", validation.issues.join("\n"));
    return;
  }
  state.examples.push(example);
  renderExamples();
  event.currentTarget.reset();
  showOutput("Example interpreted", deconstructExample(example));
});

$("#deconstructButton").addEventListener("click", () => {
  const selected = state.examples.find((example) => example.id === "starter-cube") || state.examples[0];
  showOutput("Deconstructed example", deconstructExample(selected));
});
$("#combineButton").addEventListener("click", () => {
  const selectedIndexes = [...document.querySelectorAll("[data-example-index]:checked")]
    .map((input) => Number(input.dataset.exampleIndex));
  const selected = selectedIndexes.map((index) => state.examples[index]).filter(Boolean);
  try {
    showOutput("Combined example blueprint", combineExamples(selected));
  } catch (error) {
    showOutput("Combination needs two examples", error.message);
  }
});
$("#blueprintButton").addEventListener("click", () => {
  const example = state.examples[state.examples.length - 1];
  const blueprint = createBlueprint(example, "generic");
  const json = JSON.stringify(blueprint, null, 2);
  showOutput("Portable Codex blueprint", json);
  downloadText("tupua-codex-blueprint.json", json);
});
$("#typescriptButton").addEventListener("click", () => {
  const blueprint = createBlueprint(state.examples[0], "generic");
  showOutput("TypeScript contract (review only)", toTypeScriptContract(blueprint));
});
$("#exportButton").addEventListener("click", () => {
  downloadText("tupua-pixel-led-codex-bundle.json", exportBundle(state.examples, "generic"));
});

renderExamples();
$("#year").textContent = String(new Date().getFullYear());
