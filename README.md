# Tupua Codex Studio

**A calm, local-first workspace for writing, organizing and exporting ideas.**

Tupua Codex Studio is a no-build, single-page web app for authors, independent creators, researchers, coaches and people developing personal knowledge systems.

## What works in this MVP

- Create, edit, search and delete entries.
- Organize entries into collections and tag them.
- Track each entry as Draft, In progress or Ready.
- See entry, word and collection counts.
- Export a JSON backup and import it later.
- Export the library as a Markdown manuscript.
- Print an individual entry to PDF from the browser's print dialog.
- Use the app without creating an account or sending content to a server.

## Run it

Open `index.html` in a current browser. There is no package installation, build command, analytics script, font service or external JavaScript dependency.

To publish it with GitHub Pages:

1. Review and merge the pull request that adds this app.
2. In the repository, open **Settings → Pages**.
3. Under the build/deployment source, choose **Deploy from a branch**, then select `main` and `/(root)`.
4. Save and wait for GitHub Pages to publish the site. GitHub will show the resulting site address in the Pages settings.

The published site is public. Anyone with the link can open the application, but each visitor's entries are stored in that visitor's own browser storage.

## Data and privacy

The app stores entries in the browser's `localStorage` under the key `tupua-codex-studio-v1`. It does not currently include a server, user accounts, cloud sync, telemetry, encryption at rest, or a recovery service.

**Important:** local browser storage is not a secure vault. Anyone with access to the same unlocked browser profile may be able to access the entries. Do not store passwords, financial account data, government identifiers, confidential client records or other highly sensitive material here. Use the Export backup button regularly and keep backups in a protected location. Import replaces the current library, so export before importing.

This MVP intentionally contains no private family material, unpublished manuscript text, access tokens, passwords, API keys or other confidential source data.

## Current limitations

- Data remains in one browser profile; it does not automatically sync across devices.
- Clearing site data or browser storage can remove the library.
- Backups are plain JSON and are not encrypted.
- There is no sign-in, team workspace, payment flow, customer support portal or automated cloud backup.
- The current app is a functional prototype, not a security-certified records system.

## Finance Desk (development prototype)

`finance.html` adds a manual, local-only ledger for gross revenue, refunds, platform fees, operating expenses, a configurable planning reserve, and retained operating result. It supports CSV/JSON backup and import. It does not process payments, connect bank accounts, store customer records, calculate taxes, or guarantee profit. The ledger uses browser `localStorage`, which is not encrypted or suitable for sensitive financial data. A production finance service requires authenticated server-side storage, access controls, audit logs, encrypted backups, data-retention policies, and a reviewed payment/accounting provider integration. Do not put API keys or payment secrets in browser code.

## Product direction

The first practical offer is a creator toolkit: the app plus printable/editable planning templates for manuscripts, frameworks, research notes, ethical review and publication preparation. See `CREATOR-PACK.md`, `PRODUCT-LAUNCH.md`, and the `storefront/` folder for ready-to-paste Payhip copy, setup instructions, customer FAQ and original cover artwork.

A paid hosted edition should not be launched until authentication, server-side authorization, encryption, backup/restore, privacy terms, support procedures and payment handling have been designed and tested.

## Ownership and public visibility

This repository is currently **public**. Source files committed here can be read and copied by visitors. Do not place trade secrets, private Codex passages, proprietary prompts, credentials or protected personal information in this repository. Public posting does not make a secret confidential. Keep sensitive source materials in a private, access-controlled location and publish only the product code you intend to make public.

The app's name and product positioning are working choices, not a representation that a trademark search or legal clearance has been completed. Check names, licensing, tax and consumer-law requirements before commercial release.

## Storefront preparation

The `storefront/` folder contains a product-page draft, Payhip setup checklist, customer FAQ and original SVG cover. These are preparation materials only: no Payhip account has been created and no product has been published. The paid workbook files are intentionally not stored in this public repository.

## Development notes

This MVP is deliberately dependency-free and runs as static HTML/CSS/JavaScript. For a future paid version, plan a separate secure architecture rather than bolting cloud storage or payment secrets into this client-side page.
