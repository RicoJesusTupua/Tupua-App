import test from "node:test";
import assert from "node:assert/strict";
import { createResponsesHandler } from "../openai/responses-handler.mjs";

const authorized = async () => ({ userId: "verified-user" });
const request = (body, options = {}) => new Request("https://app.example.test/api/assistant/v1/respond", {
  method: options.method || "POST",
  headers: options.headers || { "content-type": "application/json" },
  body: body === undefined ? undefined : JSON.stringify(body),
});

test("requires a trusted authentication adapter", () => {
  assert.throws(() => createResponsesHandler(), /authenticate/);
});

test("rejects unauthenticated requests without calling OpenAI", async () => {
  let called = false;
  const handler = createResponsesHandler({
    apiKey: "test-key",
    authenticate: async () => null,
    fetchImpl: async () => { called = true; },
  });
  const response = await handler(request({ input: "Hello" }));
  assert.equal(response.status, 401);
  assert.equal(called, false);
});

test("calls Responses API with GPT-6 Astra and extracts typed output text", async () => {
  let sent;
  const handler = createResponsesHandler({
    apiKey: "test-key",
    authenticate: authorized,
    loadInstructions: async () => "Test instructions",
    fetchImpl: async (url, options) => {
      sent = { url, options, body: JSON.parse(options.body) };
      return new Response(JSON.stringify({
        id: "resp_test_123",
        output: [{
          type: "message",
          content: [{ type: "output_text", text: "A grounded answer." }],
        }],
      }), { status: 200, headers: { "x-request-id": "req_test_123" } });
    },
  });

  const response = await handler(request({ input: "Help me organize this." }));
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.data.text, "A grounded answer.");
  assert.equal(result.request_id, "req_test_123");
  assert.equal(sent.url, "https://api.openai.com/v1/responses");
  assert.equal(sent.options.headers.authorization, "Bearer test-key");
  assert.equal(sent.body.model, "gpt-6-astra");
  assert.deepEqual(sent.body.reasoning, { effort: "medium" });
  assert.deepEqual(sent.body.text, { verbosity: "medium" });
  assert.equal(sent.body.store, false);
  assert.equal(sent.body.instructions, "Test instructions");
});

test("rejects empty and oversized inputs", async () => {
  const handler = createResponsesHandler({
    apiKey: "test-key",
    authenticate: authorized,
    fetchImpl: async () => { throw new Error("must not call upstream"); },
  });

  const empty = await handler(request({ input: "  " }));
  assert.equal(empty.status, 400);

  const oversized = await handler(request({ input: "x".repeat(12_001) }));
  assert.equal(oversized.status, 413);
});

test("returns a safe service-not-configured response when no server key exists", async () => {
  const handler = createResponsesHandler({
    apiKey: "",
    authenticate: authorized,
  });
  const response = await handler(request({ input: "Hello" }));
  assert.equal(response.status, 503);
});

test("does not expose upstream error details", async () => {
  const handler = createResponsesHandler({
    apiKey: "test-key",
    authenticate: authorized,
    loadInstructions: async () => "Test instructions",
    fetchImpl: async () => new Response(JSON.stringify({
      error: { message: "private upstream detail" },
    }), { status: 429 }),
  });
  const response = await handler(request({ input: "Hello" }));
  const body = await response.json();
  assert.equal(response.status, 502);
  assert.equal(JSON.stringify(body).includes("private upstream detail"), false);
});
