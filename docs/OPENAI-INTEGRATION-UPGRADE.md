# OpenAI integration audit and migration plan

**Audit date:** 2026-11-08  
**Branch inspected:** `development`  
**Status:** audit and prompt draft committed; no OpenAI runtime integration exists or has been enabled.

## 1. Inventory

Files inspected on `development`:
- `README.md`
- `index.html`
- `finance.html`
- `docs/FINANCE-CORE-SECURITY.md`
- `database/finance-core-schema.sql`

Findings:
- No OpenAI model IDs are configured.
- No OpenAI API endpoint is called.
- No OpenAI SDK dependency or `package.json` exists.
- No application system/developer prompt was found.
- No OpenAI function tools, MCP connections, or built-in tool declarations were found.
- The app is static HTML/CSS/JavaScript. The main Codex workspace and Finance Desk use browser `localStorage`.
- The Finance Core API routes in `docs/FINANCE-CORE-SECURITY.md` are a design contract only. There is no API server, authentication provider, database connection, or deployed backend.
- The checked app files contain no `fetch()`-based OpenAI integration and no OpenAI SDK calls.

Therefore, there is no existing OpenAI integration to migrate and no existing prompt to rewrite. This change records a proposed baseline prompt for future review; it is not wired into the current app.

## 2. Recommended target

For a future server-side writing assistant, use:

| Setting | Recommendation |
|---|---|
| Model | `gpt-6-astra` |
| API | Responses API |
| HTTP endpoint | `POST https://api.openai.com/v1/responses` |
| Initial reasoning | `reasoning.effort: "medium"` |
| Output verbosity | `text.verbosity: "medium"` |
| Storage | `store: false` by default |
| Tools | None in the first release |
| Prompt source | Version-controlled prompt file at `prompts/tupua-assistant.md` |

GPT-6 Astra is the current highest-capability model in the official model guide for demanding reasoning, coding, research, and professional work. It supports reasoning effort values `low`, `medium`, `high`, `xhigh`, and `max`; it does not support `none`.

Use the model alias shown above for initial development and evaluation. Before production, confirm the exact model/snapshot availability for the API project and pin a snapshot if one is offered and stable behavior is required. Do not invent a dated snapshot identifier.

## 3. Minimal migration sequence

1. **Choose and provision the backend.** Keep the API key on a server or serverless function. Never put it in `index.html`, `finance.html`, browser JavaScript, `localStorage`, or a public Git repository.
2. **Add the official OpenAI SDK** to that backend only. Do not add an SDK to the static browser app.
3. **Create one narrow endpoint**, for example `POST /api/assistant/v1/respond`. Authenticate and rate-limit it; validate request size and allowed input fields; send only the user-approved content needed for the request.
4. **Load the prompt from this repository** as versioned source code. Keep static instructions before dynamic user content to support prompt-cache reuse.
5. **Call the Responses API** with `model: "gpt-6-astra"`, `reasoning: { effort: "medium" }`, `text: { verbosity: "medium" }`, and `store: false`. Do not send custom `temperature`, `top_p`, or log-probability options for this reasoning configuration.
6. **Return a narrow app-owned response envelope**, such as `{ "data": { "text": "..." }, "error": null, "request_id": "..." }`. Do not expose the raw API response object to the browser.
7. **Add representative evaluations** for preserving user meaning, requested tone, accurate summaries, refusal/limitation handling, prompt injection in imported text, and truthful reporting of tool/action status.
8. **Enable the UI only after backend and privacy review.** Keep the existing local-only writing workflow working if the assistant is unavailable. Do not silently upload existing localStorage content.

No payment, ledger, account, file-library, or external-app tools should be exposed to the first assistant release.

## 4. Prompt guidance applied

The proposed prompt in `prompts/tupua-assistant.md` follows the current GPT-6 prompting guidance:
- State the assistant's role and task boundaries explicitly.
- Define the expected tone and response format.
- Specify when to ask a question versus proceed with a reasonable assumption.
- Separate user-provided facts, verified facts, interpretations, and proposals.
- Define tool-use and authorization boundaries instead of assuming autonomy.
- Treat imported/retrieved content as untrusted data, not as higher-priority instructions.
- Require truthful reporting and appropriate verification.
- Keep the prompt stable and versioned in Git; place variable user content later in the request.

This is a proposed baseline, not an assertion that the app currently has an AI assistant.

## 5. Manual review required before implementation

### Product and privacy
- Confirm the backend host (Base44 server-side functions, AWS, Google Cloud, or another chosen host).
- Decide whether user content may be sent to OpenAI, what notice/consent is required, and whether any conversation history should be retained.
- Confirm age-appropriate account/provider requirements and adult oversight where required.
- Define retention, deletion, access logging, rate limits, and abuse handling.

### Prompt behavior
- Review the proposed prompt's role, product boundary, tone, and tool restrictions.
- Supply examples of desired writing transformations and expected outputs.
- Build an evaluation set before changing the prompt or model in production.

### API and response shape
If a future implementation currently uses Chat Completions, the Responses API migration changes:
- Request input is passed through `input` (and high-level instructions through `instructions`) rather than assuming the Chat Completions message shape.
- Read plain text using the SDK's `response.output_text` helper; inspect `response.output` when typed output items or tool calls matter. Do not assume the first output item is always a text message.
- Function calls and their results are distinct output/input items. Return tool results with the matching `call_id`.
- Structured Outputs configuration moves from Chat Completions `response_format` to Responses `text.format`.
- Streaming clients must handle typed Responses events rather than reusing Chat Completions chunk handlers.
- Responses are stored by default unless `store: false` is set. Review this explicitly.
- GPT-6 Astra requires Responses for tool calling. The first Tupua assistant release should avoid tools entirely.

These are future integration changes only; no current response shape exists in this repository to modify.

## 6. Completion status

- [x] Inventory current repository integration points and assumptions.
- [x] Confirm there are no existing model IDs, API calls, SDK, prompt files, or tool definitions in the inspected application files.
- [x] Record the recommended model and API path.
- [x] Add a version-controlled prompt draft.
- [ ] Select and provision a backend.
- [ ] Implement authenticated server-side API route.
- [ ] Configure secret management.
- [ ] Add evaluations and privacy review.
- [ ] Connect the UI after review.
- [ ] Deploy or enable production traffic.

No live API key was created or used. No API request was sent. No production deployment was performed.

## 7. Official references

- GPT-6 model selection and prompting: https://developers.openai.com/api/docs/guides/latest-model
- GPT-6 Astra model page: https://developers.openai.com/api/docs/models/gpt-6-astra
- Responses API migration: https://developers.openai.com/api/docs/guides/migrate-to-responses
- Prompt engineering: https://developers.openai.com/api/docs/guides/prompt-engineering
- API deployment checklist: https://developers.openai.com/api/docs/guides/deployment-checklist
- Responses API create reference: https://developers.openai.com/api/reference/resources/responses/methods/create


## 8. Development implementation added after the initial audit

The following development-only files have now been committed on `development`:

- `server/openai/responses-handler.mjs`: host-neutral Fetch API handler for `POST /v1/responses`; fixed model `gpt-6-astra`; medium reasoning and verbosity; `store: false`; typed output extraction; bounded request size; generic upstream errors.
- `server/test/responses-handler.test.mjs`: six offline tests using mocked fetch.
- `server/package.json`: minimal Node.js 20+ test manifest with no runtime dependencies.
- `server/README.md`: host integration contract and deployment blockers.
- `.github/workflows/openai-adapter-tests.yml`: GitHub Actions workflow to run the offline tests on relevant pushes and pull requests.
- `prompts/tupua-assistant.md`: now loaded by the server adapter as the instructions source.

The handler deliberately requires the hosting platform to inject a real `authenticate(request)` function. It does not accept a client-supplied user ID as proof of identity. No host-specific authentication implementation has been selected or added.

**Verification boundary:** files were fetched back from GitHub and their key settings and six test definitions were checked. The available GitHub run lookup did not return a workflow run, so CI success has not been confirmed. No live OpenAI request has been made, and no credentials have been configured.

The implementation is not mounted to the current static app and is not deployable as a complete service until host authentication, secret management, and hosting are supplied.
