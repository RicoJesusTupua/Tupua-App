import test from "node:test";
import assert from "node:assert/strict";
import { createTupuaAssistantHandler } from "../../functions/tupuaAssistant.js";

const makeRequest = (body, method = "POST") => new Request("https://base44.example.test/api/functions/tupuaAssistant", {
  method,
  headers: { "content-type": "application/json" },
  body: body === undefined ? undefined : JSON.stringify(body),
});
const adminClient = async () => ({ auth: { me: async () => ({ id: "admin-1", role: "admin" }) } });

test("requires POST", async () => {
  const handler = createTupuaAssistantHandler({ createClient: adminClient, readSecret: () => "test-key" });
  assert.equal((await handler(makeRequest(undefined, "GET"))).status, 405);
});

test("rejects unauthenticated requests", async () => {
  const handler = createTupuaAssistantHandler({
    createClient: async () => ({ auth: { me: async () => null } }),
    readSecret: () => "test-key",
  });
  assert.equal((await handler(makeRequest({ input: "Hello" }))).status, 401);
});

test("rejects non-admin users before reading the secret or calling OpenAI", async () => {
  let secretRead = false;
  let upstreamCalled = false;
  const handler = createTupuaAssistantHandler({
    createClient: async () => ({ auth: { me: async () => ({ id: "user-1", role: "user" }) } }),
    readSecret: () => { secretRead = true; return "test-key"; },
    fetchImpl: async () => { upstreamCalled = true; },
  });
  assert.equal((await handler(makeRequest({ input: "Hello" }))).status, 403);
  assert.equal(secretRead, false);
  assert.equal(upstreamCalled, false);
});

test("returns a safe not-configured response when the server secret is missing", async () => {
  const handler = createTupuaAssistantHandler({ createClient: adminClient, readSecret: () => undefined });
  assert.equal((await handler(makeRequest({ input: "Hello" }))).status, 503);
});

test("validates empty and oversized inputs without calling OpenAI", async () => {
  let called = false;
  const handler = createTupuaAssistantHandler({
    createClient: adminClient,
    readSecret: () => "test-key",
    fetchImpl: async () => { called = true; },
  });
  assert.equal((await handler(makeRequest({ input: " " }))).status, 400);
  assert.equal((await handler(makeRequest({ input: "x".repeat(12001) }))).status, 413);
  assert.equal(called, false);
});

test("calls Responses API with the configured model and no storage", async () => {
  let sent;
  const handler = createTupuaAssistantHandler({
    createClient: adminClient,
    readSecret: () => "server-only-test-key",
    fetchImpl: async (url, options) => {
      sent = { url, options, body: JSON.parse(options.body) };
      return new Response(JSON.stringify({
        id: "resp_base44_test",
        output: [{ type: "message", content: [{ type: "output_text", text: "A concise answer." }] }],
      }), { status: 200, headers: { "x-request-id": "req_base44_test" } });
    },
  });
  const response = await handler(makeRequest({ input: "Help me organize this." }));
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.data.text, "A concise answer.");
  assert.equal(result.request_id, "req_base44_test");
  assert.equal(sent.url, "https://api.openai.com/v1/responses");
  assert.equal(sent.options.headers.authorization, "Bearer server-only-test-key");
  assert.equal(sent.body.model, "gpt-6-astra");
  assert.deepEqual(sent.body.reasoning, { effort: "medium" });
  assert.deepEqual(sent.body.text, { verbosity: "medium" });
  assert.equal(sent.body.store, false);
});

test("does not expose upstream error details", async () => {
  const handler = createTupuaAssistantHandler({
    createClient: adminClient,
    readSecret: () => "test-key",
    fetchImpl: async () => new Response(JSON.stringify({ error: { message: "private upstream detail" } }), { status: 429 }),
  });
  const response = await handler(makeRequest({ input: "Hello" }));
  const body = await response.json();
  assert.equal(response.status, 502);
  assert.equal(JSON.stringify(body).includes("private upstream detail"), false);
});
