# Tupua OpenAI server adapter

This is a host-neutral, server-side adapter for the OpenAI Responses API. It is deliberately not connected to the static browser app until a hosting platform supplies real authentication.

## Requirements

- Node.js 20 or later
- A server-side OpenAI API key supplied through a secret manager as `OPENAI_API_KEY`
- A host authentication adapter that verifies the actual session/token and returns `{ userId }`
- The prompt file at `prompts/tupua-assistant.md` included in the deployment artifact

Do not put the API key in browser code, HTML, public environment variables, GitHub commits, or browser storage. Never accept a browser-supplied user ID as authentication.

## Use

`createResponsesHandler({ authenticate })` returns a Fetch API request handler. Mount it at `POST /api/assistant/v1/respond` in the chosen backend. The host must provide an authentication function that verifies its server-side session and returns an authenticated identity. Requests must contain JSON `{ "input": "..." }`.

The handler calls `POST https://api.openai.com/v1/responses` with:
- model `gpt-6-astra`
- `reasoning.effort: "medium"`
- `text.verbosity: "medium"`
- `store: false`
- no tools in the initial release

It extracts text only from typed `message` / `output_text` items and returns the app-owned envelope `{ data, error, request_id }`. It does not expose raw upstream payloads or upstream error details.

Example host wiring (pseudocode; replace with the chosen host's real auth API):

```js
import { createResponsesHandler } from "./openai/responses-handler.mjs";

const handleAssistant = createResponsesHandler({
  authenticate: async (request) => {
    const session = await yourHostAuth.verifyRequest(request);
    return session ? { userId: session.user.id } : null;
  },
});

// Register handleAssistant for POST /api/assistant/v1/respond.
```

The example is intentionally incomplete: `yourHostAuth.verifyRequest` is a placeholder, not an implemented dependency. Do not deploy until it is replaced with the host's verified authentication mechanism and tested.

## Local checks

From this directory:

```sh
npm test
```

Tests use Node's built-in test runner and mocked fetch; they do not contact OpenAI and need no API key.

## Not yet enabled

- No backend host selected or provisioned
- No authentication adapter implemented
- No API key provisioned
- No browser UI wired to this route
- No user data is sent to OpenAI by this repository change
- No deployment or production traffic

A person legally eligible to administer the OpenAI API account and the chosen hosting account must provision the required credentials and approve any use of the service. Follow current provider age and account requirements; do not bypass them.
