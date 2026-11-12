# Tupua Pixel LED Codex

**Version:** 0.1.0  
**Status:** Development prototype; not deployed  
**Runtime:** Dependency-free browser HTML, CSS, and JavaScript

## Purpose

The Pixel LED Codex is an isolated visual and data-modeling module for Tupua Codex Studio. It explores pixel grids, simulated LED behavior, 3D-style geometry, eleven conceptual information layers, and the **For Example → All Examples** workflow.

It is a prototype, not a physical holographic projector, sensor suite, AI agent with external authority, or production service.

## Run locally

From the repository root:

\`\`\`sh
cd pixel-codex
python3 -m http.server 8000
\`\`\`

Open \`http://localhost:8000\` in a modern browser. ES modules are used, so serve the folder over localhost rather than opening the HTML file directly with \`file://\`.

No package installation or external runtime dependency is required. Node.js is only needed for the optional test suite.

## Interactions

- Drag the canvas or use arrow keys to rotate the simulated cube.
- Adjust conceptual layer depth from 1D through 11D.
- Adjust simulated LED brightness, pixel spacing, palette, and rotation.
- Enter an example and interpret it into a structured record.
- Deconstruct an example into components, relationships, and provenance.
- Combine selected examples into a deduplicated descriptive blueprint.
- Export a JSON blueprint, a JSON bundle, or a review-only TypeScript contract.

## Eleven conceptual information layers

1. Spatial coordinates
2. Color and light
3. Depth and geometry
4. Time and motion
5. Energy and intensity
6. Information and data
7. Relationships and networks
8. Intelligence and interpretation
9. Memory and continuity
10. Ethics and governance
11. Integration and orchestration

These are software modeling categories. They are not a claim that the application creates, detects, or measures eleven literal physical dimensions.

## Architecture

- \`index.html\`: accessible standalone user interface and visual styling.
- \`app.js\`: canvas renderer, UI state, interaction handlers, and export flows.
- \`core.js\`: pure data-modeling, validation, deconstruction, combination, and export functions.
- \`core.test.js\`: Node built-in test suite.
- \`BASE44-INTEGRATION.md\`: proposed integration boundary and server-side acceptance criteria.

The browser interface does not call a remote API. User-entered examples remain in page memory unless the user manually exports them.

## Provenance and measurement rules

Every example identifies its source type as one of:

- \`user-provided\`
- \`measured\`
- \`estimated\`
- \`simulated\`

Measured examples must identify the instrument or measurement method. Generated visual values remain simulated. A visualization must never be represented as a live measurement.

Oxygen, smoke, scent, temperature, and other physical properties require suitable sensors and a separate, authorized hardware integration. This prototype has no sensor connection.

## Export behavior

Exports use schema version \`1.0.0\`. The \`base44\` and \`github\` target labels only describe intended destinations. They do not connect, authenticate, create resources, commit code, or deploy changes.

Generated TypeScript is a descriptive interface contract for human review. It is not dynamically executed. The blueprint explicitly sets \`autoExecute: false\` and \`requiresHumanReview: true\`.

## Tests

With Node.js 18 or later:

\`\`\`sh
npm test
\`\`\`

The tests cover schema validation, measurement provenance, deconstruction, example combination, export targets, and non-executable blueprint safeguards.

## Security and privacy

- No API keys, passwords, service tokens, or credentials are used.
- No external scripts, analytics, telemetry, or network requests are included.
- No backend, account system, cloud synchronization, or remote storage is included.
- Do not enter confidential or highly sensitive information into this public-repository prototype.
- Treat exported JSON as user data and store it in a protected location.
- Do not use this prototype for medical, environmental, industrial, or safety decisions.

## Base44 integration status

No Base44 project API or editing connection was available during this development task. The integration design is documented separately. A future adapter must be implemented in a Base44 development environment, with server-side authorization, scoped secrets, audit events, and tests. Do not add API credentials to this static client.

## Release boundary

This module is being developed on a dedicated GitHub feature branch. It must not be merged, published, or deployed without separate human review and explicit approval.
