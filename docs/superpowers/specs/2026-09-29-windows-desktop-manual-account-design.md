# Windows Desktop Manual Account Design

## Summary

Use the existing `codex-proxy` Electron application as the final Windows desktop product. Keep its tested OpenAI-compatible text and image proxy, OAuth, account persistence, client-key, dashboard, tray, and installer implementations. Add a strict manual-account mode in which exactly one user-selected account handles all new proxy requests and switching also writes that account's complete Codex credentials to the user's active `auth.json`.

The earlier proposal to rebuild the proxy in Zig is superseded. `codex-auth` remains a behavior reference for safe Codex credential snapshots; it is not bundled as a second process.

## Goals

- Deliver the product from `D:\10_项目\AI项目\codex-proxy` as its existing Electron Windows application.
- Let users add accounts by copying an authorization URL into their own browser.
- Persist the OAuth access token, refresh token, ID token, and account identity for each account.
- Let the user explicitly select one current account.
- Route every new text or image request through only that account.
- Never rotate or fail over to another account after `401`, `429`, quota exhaustion, or an upstream error.
- Synchronize the selected account to the standard Codex `auth.json` using an atomic write.
- Tell the user to restart Codex manually; never close or launch Codex.
- Preserve `/v1/responses`, `/v1/chat/completions`, `/v1/images/generations`, `/v1/models`, client keys, and the existing dashboard.

## Non-goals

- Rewriting the proxy, image adapter, or desktop shell in Zig.
- Bundling New API; it remains an optional downstream client.
- Automatic account rotation, quota-based routing, or fallback to another subscription account.
- LAN or public exposure as part of the desktop workflow.
- Automating browser sign-in, passwords, MFA, or CAPTCHA.
- Restarting Codex Desktop automatically.
- Commercial distribution under the repository's current non-commercial licence.

## Existing Foundation

The repository already provides:

- an Electron window, tray lifecycle, single-instance lock, updater, and NSIS packaging;
- a Hono HTTP server with local client-key authentication;
- OpenAI-compatible Responses, Chat Completions, and Images generation routes;
- Codex OAuth PKCE, callback handling, token refresh, and account persistence;
- account health, quota, usage, and dashboard UI;
- unit, integration, end-to-end, real-upstream, and packaging tests.

The implementation changes these existing boundaries instead of creating a parallel application.

## Manual Account Semantics

The account registry stores `selectedAccountId: string | null` alongside accounts. Selection is not inferred from recent use and is independent of account labels.

`AccountPool.selectAccount(id)` validates that the account exists, is not banned or expired, persists the selection, evicts pooled upstream connections for the previously selected account when necessary, and publishes the new selected ID synchronously.

`AccountLifecycle.acquire()` behaves as follows:

1. Read the selected account ID at request acquisition time.
2. Resolve that exact account only.
3. Apply concurrency and status checks to that account.
4. Return it or return no account.
5. Ignore rotation strategy, plan-tier routing, affinity fallback, and candidate accounts while manual mode is enabled.

An in-flight request retains its acquired account until release. A later selection affects only later acquisitions. If the selected account is unavailable, the request receives the existing compatible no-account, rate-limit, or authorization error; another account is never chosen.

Existing automatic strategies remain readable for migration and tests, but the Windows desktop profile enables manual mode by default and hides rotation controls. Headless deployments may explicitly retain automatic mode for backward compatibility.

## OAuth and Credential Persistence

The existing PKCE flow already creates a copyable authorization URL and a localhost callback. Desktop behavior changes so the application never opens the URL automatically. The user copies the full link and opens it in any browser.

OAuth completion passes the full token response into the account registry. Each private account entry stores:

- access token;
- refresh token;
- ID token;
- account ID and identity metadata;
- last refresh timestamp.

Refresh processing updates every token returned by the issuer and preserves an existing ID or refresh token when the response omits it. Public account DTOs, logs, exports that omit secrets, and dashboard responses never expose the ID token.

## Codex Desktop Synchronization

Selecting an account invokes a dedicated `CodexAuthWriter` after the registry selection succeeds. The writer resolves the active Codex home from `CODEX_HOME` or the standard per-user location and writes a Codex-compatible `auth.json` containing `auth_mode`, `tokens`, and `last_refresh`.

Writes use a sibling temporary file followed by atomic replacement. Before replacing a readable existing file, save a single recovery backup. Harden the resulting file for the current Windows user. A failed write does not change the proxy's selected account back automatically; the API returns `proxy_selected: true`, `codex_synced: false`, and an actionable warning so the state is explicit.

The application does not inspect, close, start, or restart Codex processes. The dashboard shows `Restart Codex to apply` after a successful synchronization.

## API Changes

Extend `GET /auth/accounts` with:

- `selected_account_id`;
- `codex_auth_path` without sensitive contents;
- `manual_mode`.

Add `POST /auth/accounts/:id/select`. Its successful response contains:

```json
{
  "success": true,
  "selected_account_id": "account-id",
  "proxy_selected": true,
  "codex_synced": true,
  "restart_codex_required": true
}
```

Invalid, expired, or banned accounts return a stable `400` or `409` error without changing selection. Persistence and Codex file errors return a redacted error and never include tokens.

## Desktop UI

The account page clearly marks the selected account and provides `Use this account` on every selectable row or card. Selecting it:

1. asks the backend to select and synchronize the account;
2. refreshes the account list;
3. marks the selected row immediately;
4. displays `Restart Codex to apply` when synchronization succeeds;
5. displays separate proxy and Codex synchronization states on partial failure.

The add-account panel displays the authorization URL and `Copy` button. Remove the primary `Open URL` action from desktop presentation so no browser opens automatically. Callback polling continues to detect successful authorization.

Rotation controls are hidden when manual mode is active. The proxy base URL, client key setup, image capability, server status, and existing tray lifecycle remain unchanged.

## Windows Packaging

Use the existing Electron main process and `electron-builder` NSIS target. The installer remains per-user and does not require administrator privileges. The proxy server starts inside the Electron process, the window hides to the tray on close, and the application remains single-instance.

The release must include the current licence and preserve its non-commercial restriction. A commercial release requires separate permission or a licence change by the rights holders.

## Security and Error Handling

- Keep the server bound to loopback for the desktop profile.
- Require the configured local client key for proxy routes.
- Never log OAuth codes, access tokens, refresh tokens, ID tokens, complete auth files, or image bodies.
- Validate OAuth `state` and callback path using the existing session lifecycle.
- Serialize selection and token refresh persistence.
- Reject selection while account persistence is quarantined rather than reporting a durable success.
- Keep remote image URL and other existing proxy security policy unchanged.

## Testing

- Persistence migration accepts existing account JSON/SQLite rows without ID tokens or selection.
- Full OAuth results store ID tokens; refresh preserves or rotates them correctly.
- Manual acquisition always returns the selected account and never falls back.
- Concurrent requests acquired before and after a switch remain isolated.
- Selection API returns complete and partial-success states without secrets.
- Codex auth writer produces the expected schema, backup, permissions, and atomic replacement behavior in a temporary home.
- Add-account UI copies the link without calling `window.open`.
- Account UI selects an account and displays the restart message.
- Existing Responses, Chat Completions, Images, OAuth, account, Electron, and packaging tests remain green.
- A packaged Windows smoke test starts the proxy, serves the dashboard, performs a mocked selection, and exits cleanly.

## Delivery Order

1. Persist complete OAuth credentials and selected-account state.
2. Enforce selected-account-only acquisition.
3. Add the selection API and Codex auth writer.
4. Add dashboard selection controls and copy-link-only login.
5. Update tray/desktop presentation where useful and package the NSIS installer.
6. Run focused tests, full tests, and the packaged Windows smoke test.
