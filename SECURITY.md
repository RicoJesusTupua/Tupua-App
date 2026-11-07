# Security and sensitive-data handling

## Scope

Tupua Codex Studio is a static, local-first writing prototype. It is not a secure vault or a regulated records system.

## Important limitations

- Entry content is stored in browser `localStorage`; it is not encrypted by this application.
- There is no server-side account, access-control layer, cloud backup, recovery process or team permission model.
- JSON backups are plain text and may contain the full contents of the user's library.
- A public GitHub repository and a GitHub Pages site are publicly readable.

## Do not commit

- Passwords, API keys, access tokens, recovery codes or private keys.
- Private manuscripts, unpublished trade secrets or confidential prompts.
- Family records, customer data, government identifiers or financial account information.
- Private backups exported from the app.

## If a credential is exposed

Revoke or rotate it at the service that issued it immediately. Deleting the value from the latest commit does not remove it from the repository's history or existing clones. Follow GitHub's secret-removal guidance and review access logs where available.

## Reporting

For this prototype, do not post private data or credentials in public issues. Contact the repository owner through a private channel with a clear description and reproduction steps. Do not send actual customer manuscripts or secrets.

## Before a hosted paid edition

Commission a security review and design authentication, server-side authorization, encryption in transit and at rest, tested backup/restore, deletion controls, retention policy, incident response and privacy notices before collecting customer content.
