# Windows Desktop Manual Account Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Turn the existing Codex Proxy Electron application into a Windows desktop account manager whose OpenAI-compatible text and image proxy always uses one manually selected subscription account and synchronizes that account to Codex Desktop.

**Architecture:** Extend the existing account registry with complete OAuth credentials and a persisted selected account. Electron starts the existing server in manual mode; request acquisition resolves only the selected account. A selection service atomically updates proxy state and writes a Codex-compatible auth.json, while the existing proxy, image route, dashboard, tray, and packaging remain in place.

**Tech Stack:** TypeScript 5.5, Node.js 22, Hono, Preact, Vitest 3, Electron 35, electron-builder/NSIS, JSON and SQLite account persistence.

**Spec:** docs/superpowers/specs/2026-09-29-windows-desktop-manual-account-design.md

## Global Constraints

- Work in D:\10_项目\AI项目\codex-proxy.
- Preserve all pre-existing uncommitted changes; never stage unrelated files.
- Before every commit, inspect `git status --short` and `git diff`. For any file that was already dirty before this work (currently including `src/index.ts`), use `git add -p -- <file>` and stage only the new implementation hunks.
- Keep the current OpenAI-compatible text and /v1/images/generations implementations.
- Account switching is manual; desktop mode never rotates or fails over to another subscription account.
- Never open the authorization URL automatically; display and copy it only.
- Never close, launch, or restart Codex Desktop.
- Keep the desktop server on loopback and retain client-key authentication.
- Never log OAuth codes, access tokens, refresh tokens, ID tokens, full auth files, or image bodies.
- Keep headless automatic routing backward compatible when desktop manual mode is not enabled.
- The repository remains subject to its non-commercial licence.

---

## File Structure

New files:

- src/auth/codex-auth-writer.ts — serialize and atomically install Codex auth.json.
- src/services/account-selection.ts — coordinate selection and Codex synchronization.
- tests/unit/auth/codex-auth-writer.test.ts — filesystem contract.
- tests/unit/services/account-selection.test.ts — complete and partial selection outcomes.
- web/src/components/AccountSelectionNotice.tsx — current-account and restart status.

Focused modifications:

- src/auth/types.ts, account-persistence.ts, account-registry.ts, account-pool.ts — durable credentials and selection.
- src/auth/oauth-pkce.ts, refresh-scheduler.ts — retain every OAuth token.
- src/auth/account-lifecycle.ts — selected-account-only acquisition.
- src/routes/auth.ts, accounts.ts — full OAuth tokens and selection API.
- src/index.ts, packages/electron/electron/main.ts — desktop manual profile.
- shared/types.ts, shared/hooks/use-accounts.ts — frontend selection contract.
- web account components and shared/i18n/translations.ts — copy-only login and switch UI.

---

### Task 1: Persist complete credentials and selected-account state

**Files:**
- Modify: src/auth/types.ts
- Modify: src/auth/account-persistence.ts
- Modify: src/auth/account-registry.ts
- Modify: src/auth/account-pool.ts
- Test: tests/unit/auth/account-sqlite-persistence.test.ts
- Test: tests/unit/auth/account-registry-persist-disabled.test.ts
- Test: tests/unit/auth/account-pool.test.ts

**Interfaces:**
- Produces: OAuthCredentialSet, AccountStoreSnapshot, AccountPool.addOAuthAccount(credentials, metadata), AccountPool.getSelectedAccountId(), AccountPool.selectAccount(id), AccountPool.updateOAuthCredentials(id, credentials).
- Consumes: existing AccountEntry, AccountPersistence, JSON atomic save, and SQLite transaction behavior.

- [ ] **Step 1: Add failing JSON and SQLite migration tests**

Cover legacy stores and new stores:

~~~ts
expect(loaded.entries[0]).toMatchObject({
  idToken: null,
  lastRefresh: null,
});
expect(loaded.selectedAccountId).toBeNull();

persistence.save({ entries: [entry], selectedAccountId: entry.id });
expect(persistence.load().selectedAccountId).toBe(entry.id);
expect(persistence.load().entries[0]?.idToken).toBe("id.jwt.token");
~~~

- [ ] **Step 2: Run focused tests and confirm failure**

~~~powershell
npx vitest run tests/unit/auth/account-sqlite-persistence.test.ts tests/unit/auth/account-registry-persist-disabled.test.ts tests/unit/auth/account-pool.test.ts
~~~

Expected: FAIL because persistence has no selected account and AccountEntry has no ID-token metadata.

- [ ] **Step 3: Define exact data contracts**

Add to src/auth/types.ts:

~~~ts
export interface OAuthCredentialSet {
  accessToken: string;
  refreshToken?: string | null;
  idToken?: string | null;
  lastRefresh?: string | null;
}

export interface AccountStoreSnapshot {
  accounts: AccountEntry[];
  selectedAccountId: string | null;
}
~~~

Add private persisted fields idToken: string | null and lastRefresh: string | null to AccountEntry. Do not add either field to AccountInfo.

- [ ] **Step 4: Upgrade persistence and migrations**

Change AccountPersistence to:

~~~ts
load(): {
  entries: AccountEntry[];
  selectedAccountId: string | null;
  needsPersist: boolean;
  loadFailed?: boolean;
  health?: PersistenceLoadHealth;
};
save(snapshot: AccountStoreSnapshot): void;
~~~

JSON accepts legacy { accounts } and normalizes absent fields. SQLite adds a one-row account_state table keyed by selected_account_id and writes it in the same BEGIN IMMEDIATE transaction as account rows. A selected ID absent from the loaded entries becomes null and sets needsPersist.

- [ ] **Step 5: Implement registry and pool methods**

Implement addOAuthAccount(credentials, metadata), getSelectedAccountId(), selectAccount(id), and updateOAuthCredentials(id, credentials). Keep the existing addAccount(token, refreshToken, metadata) entry point as a backward-compatible wrapper. Selection rejects unknown, expired, disabled, quota-exhausted, and banned accounts. Credential updates preserve an existing refresh or ID token when the issuer omits that field.

- [ ] **Step 6: Run focused tests**

Run Step 2 again. Expected: PASS.

- [ ] **Step 7: Commit**

~~~powershell
git add src/auth/types.ts src/auth/account-persistence.ts src/auth/account-registry.ts src/auth/account-pool.ts tests/unit/auth/account-sqlite-persistence.test.ts tests/unit/auth/account-registry-persist-disabled.test.ts tests/unit/auth/account-pool.test.ts
git commit -m "feat(auth): persist selected account credentials"
~~~

---

### Task 2: Preserve the complete OAuth token response

**Files:**
- Modify: src/auth/oauth-pkce.ts
- Modify: src/auth/refresh-scheduler.ts
- Modify: src/routes/auth.ts
- Modify: src/routes/accounts.ts
- Test: tests/unit/auth/oauth-session-lifecycle.test.ts
- Test: tests/unit/auth/refresh-token-preservation.test.ts
- Test: tests/e2e/oauth.test.ts

**Interfaces:**
- Consumes: OAuthCredentialSet and updateOAuthCredentials from Task 1.
- Produces: all interactive, device, relay, CLI-import, and refresh paths retain ID token and last-refresh metadata.

- [ ] **Step 1: Write failing token-retention tests**

~~~ts
expect(saved.idToken).toBe("new-id-token");
expect(saved.refreshToken).toBe("rotated-refresh-token");
expect(saved.lastRefresh).toMatch(/^\d{4}-\d{2}-\d{2}T/);

expect(afterPartial.idToken).toBe("previous-id-token");
expect(afterPartial.refreshToken).toBe("previous-refresh-token");
~~~

- [ ] **Step 2: Run tests and confirm failure**

~~~powershell
npx vitest run tests/unit/auth/oauth-session-lifecycle.test.ts tests/unit/auth/refresh-token-preservation.test.ts tests/e2e/oauth.test.ts
~~~

Expected: FAIL because callbacks currently pass only access and refresh tokens.

- [ ] **Step 3: Pass TokenResponse through OAuth callbacks**

Define:

~~~ts
type OAuthAccountCallback = (tokens: TokenResponse) => void | Promise<void>;
~~~

Routes convert it to:

~~~ts
pool.addOAuthAccount({
  accessToken: tokens.access_token,
  refreshToken: tokens.refresh_token,
  idToken: tokens.id_token,
  lastRefresh: new Date().toISOString(),
});
~~~

Legacy manual-token import remains supported with idToken null.

- [ ] **Step 4: Persist tokens returned by refresh**

After refresh, call updateOAuthCredentials with every returned field. Preserve the single-flight lock and one-time refresh-token protections.

- [ ] **Step 5: Run Step 2 again**

Expected: PASS.

- [ ] **Step 6: Commit**

~~~powershell
git add src/auth/oauth-pkce.ts src/auth/refresh-scheduler.ts src/routes/auth.ts src/routes/accounts.ts tests/unit/auth/oauth-session-lifecycle.test.ts tests/unit/auth/refresh-token-preservation.test.ts tests/e2e/oauth.test.ts
git commit -m "feat(auth): retain complete OAuth credentials"
~~~

---

### Task 3: Enforce selected-account-only routing in desktop mode

**Files:**
- Modify: src/auth/account-lifecycle.ts
- Modify: src/auth/account-pool.ts
- Modify: src/index.ts
- Test: tests/unit/auth/account-pool.test.ts
- Test: tests/unit/auth/account-pool-sticky.test.ts
- Test: tests/integration/account-routing.test.ts
- Test: tests/e2e/images.test.ts

**Interfaces:**
- Consumes: persisted selected account from Task 1.
- Produces: RoutingMode = "automatic" | "manual", StartOptions.manualAccountMode?: boolean, and deterministic manual acquisition.

- [ ] **Step 1: Write failing routing tests**

~~~ts
const pool = new AccountPool({ persistence, routingMode: "manual" });
pool.selectAccount(accountB);
expect(pool.acquire()?.entryId).toBe(accountB);

pool.markStatus(accountB, "expired");
expect(pool.acquire()).toBeNull();
expect(pool.getEntry(accountA)?.status).toBe("active");
~~~

Also acquire A, select B, acquire B, release both, and assert both acquisition objects retain their original IDs.

- [ ] **Step 2: Run tests and confirm failure**

~~~powershell
npx vitest run tests/unit/auth/account-pool.test.ts tests/unit/auth/account-pool-sticky.test.ts tests/integration/account-routing.test.ts
~~~

Expected: FAIL because lifecycle still selects from all candidates.

- [ ] **Step 3: Add routing mode**

~~~ts
export type RoutingMode = "automatic" | "manual";
~~~

Manual acquire resolves only registry.getSelectedAccountId(). It never consults rotation, tier priority, affinity fallback, or excludeIds to choose another account. It still applies status, quota, cooldown, and concurrency checks to the selected account.

- [ ] **Step 4: Thread desktop mode through startup**

Extend StartOptions:

~~~ts
export interface StartOptions {
  port?: number;
  host?: string;
  manualAccountMode?: boolean;
}
~~~

Construct AccountPool with manual routing only when manualAccountMode is true. Headless default remains automatic.

- [ ] **Step 5: Run routing and image regressions**

~~~powershell
npx vitest run tests/unit/auth/account-pool.test.ts tests/unit/auth/account-pool-sticky.test.ts tests/integration/account-routing.test.ts tests/e2e/images.test.ts
~~~

Expected: PASS. Images use the selected account through the existing shared proxy handler.

- [ ] **Step 6: Commit**

~~~powershell
git add src/auth/account-lifecycle.ts src/auth/account-pool.ts tests/unit/auth/account-pool.test.ts tests/unit/auth/account-pool-sticky.test.ts tests/integration/account-routing.test.ts
git add -p -- src/index.ts
git commit -m "feat(proxy): route through the selected account"
~~~

---

### Task 4: Synchronize selection to Codex Desktop

**Files:**
- Create: src/auth/codex-auth-writer.ts
- Create: src/services/account-selection.ts
- Modify: src/routes/accounts.ts
- Modify: src/paths.ts
- Create: tests/unit/auth/codex-auth-writer.test.ts
- Create: tests/unit/services/account-selection.test.ts
- Test: tests/e2e/accounts.test.ts

**Interfaces:**
- Consumes: selected account and full credentials from Tasks 1-2.
- Produces: writeCodexAuth(entry, options), AccountSelectionService.select(id), and POST /auth/accounts/:id/select.

- [ ] **Step 1: Write failing writer and service tests**

~~~ts
expect(JSON.parse(readFileSync(authPath, "utf8"))).toEqual({
  auth_mode: "chatgpt",
  tokens: {
    access_token: "access.jwt.token",
    refresh_token: "refresh-token",
    id_token: "id.jwt.token",
    account_id: "acct-123",
  },
  last_refresh: "2026-09-29T08:00:00.000Z",
});
expect(existsSync(authPath + ".bak")).toBe(true);
~~~

Also cover missing ID token, failed replacement, CODEX_HOME, standard home fallback, persistence quarantine, and redacted errors.

- [ ] **Step 2: Run tests and confirm failure**

~~~powershell
npx vitest run tests/unit/auth/codex-auth-writer.test.ts tests/unit/services/account-selection.test.ts
~~~

Expected: FAIL because neither module exists.

- [ ] **Step 3: Implement CodexAuthWriter**

Export:

~~~ts
export interface CodexAuthWriteResult {
  ok: boolean;
  path: string;
  error?: string;
}

export function writeCodexAuth(
  entry: AccountEntry,
  options?: { codexHome?: string },
): CodexAuthWriteResult;
~~~

Write a sibling temporary file, flush and close, maintain one recovery backup, atomically rename, and apply current-user permissions where supported. Never include proxy metadata.

- [ ] **Step 4: Implement serialized selection**

Return:

~~~ts
export interface AccountSelectionResult {
  selectedAccountId: string;
  proxySelected: true;
  codexSynced: boolean;
  restartCodexRequired: boolean;
  codexAuthPath: string;
  warning?: string;
}
~~~

Reject durable selection when persistence is quarantined. After proxy selection succeeds, report writer failure as partial success without silently rolling back.

- [ ] **Step 5: Add API routes**

POST /auth/accounts/:id/select returns selected_account_id, proxy_selected, codex_synced, and restart_codex_required. GET /auth/accounts adds selected_account_id, manual_mode, and the auth path without file contents.

- [ ] **Step 6: Run tests**

~~~powershell
npx vitest run tests/unit/auth/codex-auth-writer.test.ts tests/unit/services/account-selection.test.ts tests/e2e/accounts.test.ts
~~~

Expected: PASS.

- [ ] **Step 7: Commit**

~~~powershell
git add src/auth/codex-auth-writer.ts src/services/account-selection.ts src/routes/accounts.ts src/paths.ts tests/unit/auth/codex-auth-writer.test.ts tests/unit/services/account-selection.test.ts tests/e2e/accounts.test.ts
git commit -m "feat(desktop): sync selected account to Codex"
~~~

---

### Task 5: Add selection and copy-only authorization to the dashboard

**Files:**
- Modify: shared/types.ts
- Modify: shared/hooks/use-accounts.ts
- Modify: web/src/components/AddAccount.tsx
- Modify: web/src/components/AccountCard.tsx
- Modify: web/src/components/AccountList.tsx
- Modify: web/src/pages/AccountManagement.tsx
- Create: web/src/components/AccountSelectionNotice.tsx
- Modify: shared/i18n/translations.ts
- Test: web/src/components/AccountCard.test.tsx
- Test: web/src/components/AccountList.test.tsx
- Test: web/src/App.test.tsx
- Test: tests/unit/web/add-account.test.ts

**Interfaces:**
- Consumes: account list and selection API from Task 4.
- Produces: useAccounts().selectedAccountId, selectAccount(id), selected-row state, and restart notification.

- [ ] **Step 1: Write failing UI tests**

~~~ts
expect(window.open).not.toHaveBeenCalled();
expect(screen.getByDisplayValue(/^https:\/\/auth\.openai\.com\//)).toBeTruthy();
expect(screen.getByRole("button", { name: "Copy" })).toBeTruthy();

await user.click(screen.getByRole("button", { name: "Use this account" }));
expect(fetch).toHaveBeenCalledWith("/auth/accounts/acct-b/select", { method: "POST" });
expect(screen.getByText("Restart Codex to apply")).toBeTruthy();
~~~

- [ ] **Step 2: Run tests and confirm failure**

~~~powershell
npx vitest run web/src/components/AccountCard.test.tsx web/src/components/AccountList.test.tsx web/src/App.test.tsx tests/unit/web/add-account.test.ts
~~~

Expected: FAIL because selection is absent and AddAccount still provides window.open.

- [ ] **Step 3: Extend shared frontend state**

Parse selected_account_id and manual_mode. Add:

~~~ts
selectAccount(id: string): Promise<AccountSelectionResult>;
~~~

After success, reload the account list and retain a notice until dismissed or another selection begins.

- [ ] **Step 4: Build account controls**

Mark the selected row as Current account and disable its switch button. Other usable accounts show Use this account. Expired and banned accounts direct the user to reauthorize. Complete success displays Restart Codex to apply. Partial success displays Proxy switched, but Codex credentials could not be updated with the redacted warning.

- [ ] **Step 5: Make authorization copy-only**

Remove handleOpenUrl, window.open, and the Open URL button from AddAccount.tsx. Keep the full read-only URL, Copy, callback polling, cancellation, and code-relay fallback.

- [ ] **Step 6: Add translations**

Add these keys for every existing locale:

~~~text
currentAccount
useThisAccount
switchingAccount
restartCodexToApply
proxySwitchedCodexSyncFailed
copyAuthorizationLink
~~~

- [ ] **Step 7: Run UI tests and build**

~~~powershell
npx vitest run web/src/components/AccountCard.test.tsx web/src/components/AccountList.test.tsx web/src/App.test.tsx tests/unit/web/add-account.test.ts
npm run build:web
~~~

Expected: PASS.

- [ ] **Step 8: Commit**

~~~powershell
git add shared/types.ts shared/hooks/use-accounts.ts web/src/components/AddAccount.tsx web/src/components/AccountCard.tsx web/src/components/AccountList.tsx web/src/components/AccountSelectionNotice.tsx web/src/pages/AccountManagement.tsx shared/i18n/translations.ts web/src/components/AccountCard.test.tsx web/src/components/AccountList.test.tsx web/src/App.test.tsx tests/unit/web/add-account.test.ts
git commit -m "feat(web): add manual account selection"
~~~

---

### Task 6: Enable and package the Windows desktop profile

**Files:**
- Modify: packages/electron/electron/main.ts
- Modify: packages/electron/src/electron-entry.ts
- Modify: packages/electron/__tests__/build.test.ts
- Modify: packages/electron/__tests__/builder-config.test.ts
- Test: tests/unit/ci/electron-smoke-script.test.ts
- Modify: 本地部署说明.md
- Modify only after a verified packaging failure: packages/electron/electron-builder.yml

**Interfaces:**
- Consumes: StartOptions.manualAccountMode from Task 3 and all UI/backend features.
- Produces: a loopback-only manual-mode Electron application and NSIS installer.

- [ ] **Step 1: Write failing Electron profile tests**

~~~ts
expect(startServer).toHaveBeenCalledWith(expect.objectContaining({
  host: "127.0.0.1",
  manualAccountMode: true,
}));
~~~

Also assert port-collision retry uses { port: 0, host: "127.0.0.1", manualAccountMode: true }.

- [ ] **Step 2: Run tests and confirm failure**

~~~powershell
npx vitest run packages/electron/__tests__/build.test.ts packages/electron/__tests__/builder-config.test.ts tests/unit/ci/electron-smoke-script.test.ts
~~~

- [ ] **Step 3: Enable the desktop profile**

Use one immutable options object for both startup attempts:

~~~ts
const desktopServerOptions = {
  host: "127.0.0.1",
  manualAccountMode: true,
};
serverHandle = await startServer(desktopServerOptions);
~~~

Retry a collision with { ...desktopServerOptions, port: 0 }. Keep existing single-instance, tray, updater, and graceful shutdown behavior.

- [ ] **Step 4: Document the workflow**

Document: add account, copy the link, select account, configure Agent/New API with http://127.0.0.1:<port>/v1, call /v1/images/generations with gpt-image-2, and restart Codex manually. State explicitly that automatic switching is disabled in the desktop app.

- [ ] **Step 5: Run focused feature suites**

~~~powershell
npx vitest run tests/unit/auth tests/unit/services tests/e2e/oauth.test.ts tests/e2e/accounts.test.ts tests/e2e/responses.test.ts tests/e2e/chat.test.ts tests/e2e/images.test.ts tests/integration/account-routing.test.ts
npm run test:web
npx vitest run packages/electron/__tests__ tests/unit/ci/electron-smoke-script.test.ts
~~~

Expected: PASS.

- [ ] **Step 6: Run full checks**

~~~powershell
npm test
npm run build
npm run typecheck:scripts
~~~

Expected: PASS. If a failure belongs to a pre-existing dirty change, record it and do not edit unrelated files to hide it.

- [ ] **Step 7: Build and smoke-test the Windows installer**

~~~powershell
npm --prefix packages/electron run pack:win
~~~

Verify one instance, loopback binding, tray lifetime, copy-only OAuth, manual text and image routing, test-home auth synchronization, restart notice, and clean port shutdown.

- [ ] **Step 8: Commit**

~~~powershell
git add packages/electron/electron/main.ts packages/electron/src/electron-entry.ts packages/electron/__tests__/build.test.ts packages/electron/__tests__/builder-config.test.ts tests/unit/ci/electron-smoke-script.test.ts 本地部署说明.md
git commit -m "feat(electron): ship manual account desktop mode"
~~~

Only add electron-builder.yml if a verified packaging fix changed it.
