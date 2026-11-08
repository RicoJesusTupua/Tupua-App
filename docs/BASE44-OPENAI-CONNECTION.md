# Base44 + OpenAI controlled connection

## Architecture

- Base44 is the authenticated app backend and function host.
- GitHub Actions runs offline tests.
- The browser calls the Base44 function only after a user submits the assistant form.
- The Base44 function verifies the signed-in user and requires the Base44 admin role.
- The OpenAI API key is read only from the server secret OPENAI_API_KEY.
- The function uses the Responses API with gpt-6-astra, medium reasoning, medium verbosity, and store:false.
- No model tools are enabled. The app does not persist chat history. The message is transmitted to Base44 and OpenAI for processing; store:false disables Responses API object storage but is not a promise of zero provider-side retention. Review current provider data controls and terms before sending sensitive content.

## Files

- functions/tupuaAssistant.js: deployable Base44 Deno function.
- base44-client/tupuaAssistantClient.js: explicit SDK invocation adapter.
- base44-client/TupuaAssistantPanel.jsx: opt-in UI panel. It requires the Base44 app's authenticated SDK client as a prop.
- server/test/base44-function.test.mjs: offline tests with mocked Base44 auth and mocked OpenAI fetch.

## Deployment by the Base44 app administrator

1. In the actual Base44 app project, add functions/tupuaAssistant.js under its project-level functions/ directory.
2. Add the client adapter and panel to the app source.
3. In Base44's server-side Secrets settings, add OPENAI_API_KEY. Never put its value in GitHub files, browser code, chat, or a client-side environment variable. An eligible adult account administrator must provision and approve this credential.
4. Deploy the function from the authenticated Base44 project with: npx base44 functions deploy
5. Import the panel into the chosen page and pass the app's authenticated Base44 client, for example: <TupuaAssistantPanel base44={base44} />
6. Verify with an administrator account. A non-admin account must receive HTTP 403. Without the secret, the function must return HTTP 503. Only after both checks should a real request be tested.

Base44 backend functions use Deno.serve, createClientFromRequest(req), base44.auth.me(), and Deno.env.get(). The function uses the authenticated session; it never accepts a browser-supplied user ID as proof of identity.

## Important deployment boundary

The GitHub repository's current index.html is a separate static, local-first Codex Studio page. It has no Base44 SDK session or authentication. Do not wire this endpoint into that public static page or expose an unauthenticated proxy. The Base44 dashboard app source is not currently present in this repository, so the panel is prepared but cannot be mounted into the live dashboard from this repository alone.

## Remaining production controls

Before opening access beyond the app administrator, add durable per-user rate limits and usage budgets, monitoring and alerting, a user-facing data-processing notice, and an explicit access policy. Keep the function admin-only until those controls are reviewed. Confirm the Base44 app's actual project, deployment environment, and secret configuration before enabling production traffic.
