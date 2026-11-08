import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const API_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-6-astra";
const MAX_BODY_BYTES = 16 * 1024;
const MAX_INPUT_CHARS = 12_000;
const MAX_OUTPUT_TOKENS = 1_200;

const promptUrl = new URL("../../prompts/tupua-assistant.md", import.meta.url);

async function readPrompt() {
  return readFile(fileURLToPath(promptUrl), "utf8");
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...extraHeaders },
  });
}

async function readJsonLimited(request) {
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return { error: "Request body is too large.", status: 413 };
  }

  if (!request.body) return { error: "A JSON request body is required.", status: 400 };

  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BODY_BYTES) {
      await reader.cancel();
      return { error: "Request body is too large.", status: 413 };
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return { value: JSON.parse(new TextDecoder().decode(bytes)) };
  } catch {
    return { error: "Request body must be valid JSON.", status: 400 };
  }
}

function extractOutputText(payload) {
  if (!Array.isArray(payload?.output)) return "";
  return payload.output
    .filter((item) => item?.type === "message" && Array.isArray(item.content))
    .flatMap((item) => item.content)
    .filter((part) => part?.type === "output_text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

/**
 * Create a host-neutral Responses API handler.
 *
 * The hosting application MUST supply authenticate(request), which verifies
 * its real server-side session/token and returns { userId } for an authorized
 * user. Never implement this with a browser-provided user ID or shared client
 * secret. The OpenAI key is read only from the server environment.
 */
export function createResponsesHandler({
  apiKey = process.env.OPENAI_API_KEY,
  authenticate,
  fetchImpl = globalThis.fetch,
  loadInstructions = readPrompt,
} = {}) {
  if (typeof authenticate !== "function") {
    throw new TypeError("A trusted server-side authenticate(request) function is required.");
  }
  if (typeof fetchImpl !== "function") {
    throw new TypeError("A fetch implementation is required.");
  }

  return async function handleResponsesRequest(request) {
    if (request.method !== "POST") {
      return json({ data: null, error: { code: "method_not_allowed", message: "Use POST." } }, 405, { allow: "POST" });
    }

    let identity;
    try {
      identity = await authenticate(request);
    } catch {
      return json({ data: null, error: { code: "unauthorized", message: "Authentication is required." } }, 401);
    }
    if (!identity?.userId) {
      return json({ data: null, error: { code: "unauthorized", message: "Authentication is required." } }, 401);
    }

    if (!apiKey) {
      return json({ data: null, error: { code: "service_not_configured", message: "The assistant service is not configured." } }, 503);
    }

    const parsed = await readJsonLimited(request);
    if (parsed.error) {
      return json({ data: null, error: { code: "invalid_request", message: parsed.error } }, parsed.status);
    }

    const input = parsed.value?.input;
    if (typeof input !== "string" || !input.trim()) {
      return json({ data: null, error: { code: "invalid_request", message: "Provide a non-empty input string." } }, 400);
    }
    if (input.length > MAX_INPUT_CHARS) {
      return json({ data: null, error: { code: "input_too_long", message: "Input exceeds the allowed length." } }, 413);
    }

    let instructions;
    try {
      instructions = await loadInstructions();
    } catch {
      return json({ data: null, error: { code: "prompt_unavailable", message: "Assistant instructions could not be loaded." } }, 500);
    }

    let upstream;
    try {
      upstream = await fetchImpl(API_URL, {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          instructions,
          input: input.trim(),
          reasoning: { effort: "medium" },
          text: { verbosity: "medium" },
          store: false,
          max_output_tokens: MAX_OUTPUT_TOKENS,
        }),
      });
    } catch {
      return json({ data: null, error: { code: "upstream_unavailable", message: "The assistant service could not be reached." } }, 502);
    }

    let payload;
    try {
      payload = await upstream.json();
    } catch {
      return json({ data: null, error: { code: "upstream_invalid_response", message: "The assistant service returned an invalid response." } }, 502);
    }

    if (!upstream.ok) {
      return json({
        data: null,
        error: { code: "upstream_error", message: "The assistant request failed." },
        request_id: upstream.headers.get("x-request-id") || undefined,
      }, 502);
    }

    const text = extractOutputText(payload);
    if (!text) {
      return json({
        data: null,
        error: { code: "empty_model_response", message: "The assistant returned no text output." },
        request_id: upstream.headers.get("x-request-id") || payload.id || undefined,
      }, 502);
    }

    return json({
      data: { text },
      error: null,
      request_id: upstream.headers.get("x-request-id") || payload.id || null,
    });
  };
}
