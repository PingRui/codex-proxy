# NEXORA Rebrand and Simplified Gateway Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing desktop application into the independently branded NEXORA multi-account AI gateway, with an account-first workflow and a Codex Desktop-inspired deep workspace UI.

**Architecture:** Keep the proven OAuth, account persistence, manual account routing, Codex `auth.json` sync, and OpenAI-compatible proxy backend intact. Centralize product identity, replace the web shell and primary pages with a NEXORA workspace, and make the selected authorized account the only source concept exposed in the normal desktop flow. Retain advanced backend features behind an explicit advanced surface instead of deleting compatibility code.

**Tech Stack:** TypeScript, Preact, Tailwind CSS, Hono, Vitest, Electron, electron-builder, NSIS.

**Spec:** `docs/superpowers/specs/2026-09-29-nexora-rebrand-simplified-gateway-design.md`

## Global Constraints

- Product name is `NEXORA`; Chinese display name is `星枢`; descriptor is `Multi-Account AI Gateway`.
- The visual reference is Codex Desktop's deep workspace structure, not its logos, artwork, exact layout, or proprietary assets.
- Desktop routing uses one explicitly selected subscription account with no automatic rotation, fallback, or silent failover.
- Selecting an account immediately changes new proxy requests and separately attempts Codex `auth.json` synchronization.
- NEXORA never starts, stops, or restarts Codex Desktop.
- The desktop server and OAuth callback remain loopback-only.
- Existing saved accounts, selected account state, API keys, local preferences, usage data, and endpoint formats remain compatible.
- Preserve `LICENCE`, existing copyright notices, non-commercial restrictions, disclaimers, and a clear modified-version notice.
- Remove old maintainer promotion and stale upstream release links from user-facing product surfaces; do not remove dependency licence metadata from lockfiles.
- Preserve unrelated user work already present in the dirty worktree. Stage only task-owned hunks when a file overlaps.
- Use the installed Chrome at `C:\Program Files\Google\Chrome\Application\chrome.exe`; do not install another browser.
- Do not rewrite Git history. Run a secrets scan before making the repository public.

---

### Task 1: Centralize NEXORA product identity and release ownership

**Files:**
- Create: `shared/brand.ts`
- Create: `shared/brand.test.ts`
- Modify: `package.json`
- Modify: `web/package.json`
- Modify: `web/index.html`
- Modify: `packages/electron/package.json`
- Modify: `packages/electron/electron-builder.yml`
- Modify: `packages/electron/__tests__/builder-config.test.ts`
- Modify: `src/self-update.ts`
- Modify: `tests/unit/self-update.test.ts`
- Modify: `tests/unit/self-update-docker.test.ts`

**Interfaces:**
- Produces: `APP_BRAND`, `APP_DISPLAY_NAME`, `APP_DESCRIPTOR`, `APP_REPOSITORY`, and `APP_REPOSITORY_URL` string constants from `shared/brand.ts`.
- Consumes: no new interfaces.

- [ ] **Step 1: Add failing brand identity tests**

```ts
import { describe, expect, it } from "vitest";
import {
  APP_BRAND,
  APP_DISPLAY_NAME,
  APP_DESCRIPTOR,
  APP_REPOSITORY,
  APP_REPOSITORY_URL,
} from "./brand";

describe("NEXORA brand identity", () => {
  it("exposes one canonical product identity", () => {
    expect(APP_BRAND).toBe("NEXORA");
    expect(APP_DISPLAY_NAME).toBe("NEXORA · 星枢");
    expect(APP_DESCRIPTOR).toBe("Multi-Account AI Gateway");
    expect(APP_REPOSITORY).toBe("PingRui/codex-proxy");
    expect(APP_REPOSITORY_URL).toBe("https://github.com/PingRui/codex-proxy");
  });
});
```

- [ ] **Step 2: Run the focused test and confirm the missing module failure**

Run: `npm exec vitest run -- shared/brand.test.ts`

Expected: FAIL because `shared/brand.ts` does not exist.

- [ ] **Step 3: Implement the canonical identity constants**

```ts
export const APP_BRAND = "NEXORA";
export const APP_DISPLAY_NAME = "NEXORA · 星枢";
export const APP_DESCRIPTOR = "Multi-Account AI Gateway";
export const APP_REPOSITORY = "PingRui/codex-proxy";
export const APP_REPOSITORY_URL = `https://github.com/${APP_REPOSITORY}`;
```

- [ ] **Step 4: Update package, web, Electron, installer, and updater identity**

Apply these exact externally visible values:

```yaml
appId: io.nexora.gateway
productName: NEXORA
artifactName: "NEXORA-${version}-${os}-${arch}.${ext}"
publish:
  provider: github
  owner: PingRui
  repo: codex-proxy
```

Set the Electron package description to `NEXORA multi-account AI gateway` and author to `PingRui`. Change the HTML title to `NEXORA · Multi-Account AI Gateway`. Update both `GITHUB_REPO` and `GHCR_IMAGE` in `src/self-update.ts` to `PingRui/codex-proxy`. Documentation must not advertise the container image until it has been published, but the updater must no longer contact the old owner.

- [ ] **Step 5: Update builder and updater assertions**

```ts
expect(config.appId).toBe("io.nexora.gateway");
expect(config.productName).toBe("NEXORA");
expect(config.publish.owner).toBe("PingRui");
expect(config.publish.repo).toBe("codex-proxy");
```

- [ ] **Step 6: Run focused tests and build metadata checks**

Run: `npm exec vitest run -- shared/brand.test.ts packages/electron/__tests__/builder-config.test.ts tests/unit/self-update.test.ts tests/unit/self-update-docker.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit the identity layer**

```bash
git add shared/brand.ts shared/brand.test.ts package.json web/package.json web/index.html packages/electron/package.json packages/electron/electron-builder.yml packages/electron/__tests__/builder-config.test.ts src/self-update.ts tests/unit/self-update.test.ts tests/unit/self-update-docker.test.ts
git commit -m "feat(brand): establish NEXORA product identity"
```

---

### Task 2: Add the NEXORA design system and Codex-inspired desktop shell

**Files:**
- Modify: `web/tailwind.config.ts`
- Modify: `web/src/index.css`
- Create: `web/src/components/AppShell.tsx`
- Create: `web/src/components/PageHeader.tsx`
- Modify: `web/src/components/Sidebar.tsx`
- Modify: `web/src/components/Header.tsx`
- Modify: `web/src/components/Footer.tsx`
- Modify: `web/src/navigation.ts`
- Modify: `web/src/App.tsx`
- Modify: `web/src/App.test.tsx`
- Modify: `shared/theme/context.tsx`

**Interfaces:**
- Produces: `AppShellProps { activeHash: string; unreadErrors: number; children: ComponentChildren; onOpenSidebar(): void }`.
- Produces: `PageHeaderProps { eyebrow?: string; title: string; description?: string; actions?: ComponentChildren }`.
- Consumes: brand constants from Task 1 and existing theme/i18n contexts.

- [ ] **Step 1: Write a failing shell/navigation test**

Add assertions to `web/src/App.test.tsx` that the primary navigation contains exactly the normal-workflow entries and no old promotional action:

```ts
expect(screen.getByText("NEXORA")).toBeTruthy();
expect(screen.getByText("Overview")).toBeTruthy();
expect(screen.getByText("Accounts")).toBeTruthy();
expect(screen.getByText("API Access")).toBeTruthy();
expect(screen.getByText("Activity")).toBeTruthy();
expect(screen.getByText("Settings")).toBeTruthy();
expect(screen.getByText("About")).toBeTruthy();
expect(screen.queryByText(/Star on GitHub/i)).toBeNull();
```

- [ ] **Step 2: Run the shell test and verify it fails**

Run: `npm --prefix web exec vitest run -- src/App.test.tsx`

Expected: FAIL on the old product name/navigation.

- [ ] **Step 3: Define opaque deep-workspace tokens**

Replace the current green/GitHub-like palette with semantic variables consumed through Tailwind:

```css
:root {
  --nx-canvas: 246 247 249;
  --nx-sidebar: 238 240 244;
  --nx-surface: 255 255 255;
  --nx-surface-raised: 255 255 255;
  --nx-border: 218 222 230;
  --nx-ink: 28 31 38;
  --nx-muted: 101 108 122;
  --nx-accent: 59 130 246;
  --nx-accent-strong: 37 99 235;
}

.dark {
  --nx-canvas: 13 15 19;
  --nx-sidebar: 18 20 25;
  --nx-surface: 23 26 32;
  --nx-surface-raised: 29 32 39;
  --nx-border: 48 52 61;
  --nx-ink: 236 238 242;
  --nx-muted: 151 157 169;
  --nx-accent: 96 165 250;
  --nx-accent-strong: 59 130 246;
}
```

Map `canvas`, `sidebar`, `surface`, `surface-raised`, `nx-border`, `ink`, `muted`, and `accent` in `tailwind.config.ts`. Keep status colors semantic. Use opaque backgrounds; do not add backdrop blur or transparent Windows chrome.

- [ ] **Step 4: Implement the fixed workspace shell**

`AppShell` renders a `240px` desktop sidebar, `56px` contextual toolbar, and scrollable content area. On widths below `1024px`, the sidebar becomes an overlay opened by the toolbar button. Remove the layout-mode switch from the normal UI; migrate an existing stored `tabs` choice to `sidebar` in `shared/theme/context.tsx` or the layout-preference helper without deleting unrelated preferences.

- [ ] **Step 5: Reduce primary navigation to six destinations**

```ts
export const NAV_ITEMS: NavItem[] = [
  { hash: "", label: "overview", icon: "home" },
  { hash: "#/accounts", label: "manageAccounts", icon: "users" },
  { hash: "#/api", label: "apiAccess", icon: "api" },
  { hash: "#/activity", label: "activity", icon: "document" },
  { hash: "#/settings", label: "settings", icon: "settings" },
  { hash: "#/about", label: "about", icon: "info" },
];
```

Keep legacy hashes working through redirects: `#/info` → `#/api`, `#/logs` → `#/activity`, and `#/account-management` → `#/accounts`. Do not delete advanced pages in this task.

- [ ] **Step 6: Remove old product promotion from shell components**

Use `APP_BRAND` and `APP_DESCRIPTOR` in the sidebar/footer. Remove the old GitHub Star button. Keep update, theme, language, error, and logout actions as compact toolbar controls.

- [ ] **Step 7: Run web shell tests and production build**

Run: `npm --prefix web exec vitest run -- src/App.test.tsx`

Run: `npm run build:web`

Expected: both PASS.

- [ ] **Step 8: Commit the shell and tokens**

```bash
git add web/tailwind.config.ts web/src/index.css web/src/components/AppShell.tsx web/src/components/PageHeader.tsx web/src/components/Sidebar.tsx web/src/components/Header.tsx web/src/components/Footer.tsx web/src/navigation.ts web/src/App.tsx web/src/App.test.tsx shared/theme/context.tsx shared/i18n/translations.ts
git commit -m "feat(web): introduce NEXORA deep workspace shell"
```

---

### Task 3: Build a selected-account gateway state model

**Files:**
- Create: `web/src/lib/gateway-state.ts`
- Create: `web/src/lib/gateway-state.test.ts`
- Modify: `shared/types.ts`
- Modify: `shared/hooks/use-accounts.ts`

**Interfaces:**
- Produces: `GatewayState = { kind: "unconfigured" | "ready" | "attention" | "blocked"; account: Account | null; titleKey: TranslationKey; action: "add" | "select" | "reauthorize" | "switch" | null }`.
- Produces: `deriveGatewayState(accounts: Account[], selectedAccountId: string | null): GatewayState`.
- Consumes: existing `Account`, `derivedStatus(Account)`, and `AccountSelectionResult`.

- [ ] **Step 1: Write table-driven failing state tests**

```ts
it.each([
  { accounts: [], selected: null, kind: "unconfigured", action: "add" },
  { accounts: [active("a")], selected: null, kind: "attention", action: "select" },
  { accounts: [active("a")], selected: "a", kind: "ready", action: "switch" },
  { accounts: [expired("a")], selected: "a", kind: "blocked", action: "reauthorize" },
])("derives $kind gateway state", ({ accounts, selected, kind, action }) => {
  expect(deriveGatewayState(accounts, selected)).toMatchObject({ kind, action });
});
```

Define local `active(id)` and `expired(id)` factories returning the minimum valid `Account` shape.

- [ ] **Step 2: Run and confirm the missing-function failure**

Run: `npm --prefix web exec vitest run -- src/lib/gateway-state.test.ts`

Expected: FAIL because `deriveGatewayState` is not defined.

- [ ] **Step 3: Implement deterministic state derivation**

```ts
export function deriveGatewayState(
  accounts: Account[],
  selectedAccountId: string | null,
): GatewayState {
  if (accounts.length === 0) {
    return { kind: "unconfigured", account: null, titleKey: "gatewayNoAccounts", action: "add" };
  }
  const account = accounts.find((entry) => entry.id === selectedAccountId) ?? null;
  if (!account) {
    return { kind: "attention", account: null, titleKey: "gatewaySelectAccount", action: "select" };
  }
  if (derivedStatus(account) !== "active") {
    return { kind: "blocked", account, titleKey: "gatewayAccountBlocked", action: "reauthorize" };
  }
  return { kind: "ready", account, titleKey: "gatewayReady", action: "switch" };
}
```

- [ ] **Step 4: Ensure account selection remains an optimistic-independent result**

Keep `useAccounts.selectAccount(id)` setting `selectedAccountId` from the server result even when `codexSynced` is false. Add or retain this assertion in `web/src/hooks/use-accounts.test.tsx`:

```ts
expect(result.proxySelected).toBe(true);
expect(result.codexSynced).toBe(false);
expect(result.warning).toMatch(/auth\.json/i);
expect(hook.result.current.selectedAccountId).toBe("account-b");
```

- [ ] **Step 5: Run gateway and account hook tests**

Run: `npm --prefix web exec vitest run -- src/lib/gateway-state.test.ts src/hooks/use-accounts.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit the state model**

```bash
git add web/src/lib/gateway-state.ts web/src/lib/gateway-state.test.ts shared/types.ts shared/hooks/use-accounts.ts web/src/hooks/use-accounts.test.tsx
git commit -m "feat(web): model selected-account gateway readiness"
```

---

### Task 4: Replace the dashboard with the simplified Gateway Overview

**Files:**
- Create: `web/src/pages/GatewayOverview.tsx`
- Create: `web/src/pages/__tests__/gateway-overview.test.tsx`
- Create: `web/src/components/CurrentGatewayAccount.tsx`
- Create: `web/src/components/GatewayConnectionCard.tsx`
- Modify: `web/src/App.tsx`
- Modify: `shared/i18n/translations.ts`

**Interfaces:**
- Produces: `GatewayOverviewProps { accounts: ReturnType<typeof useAccounts>; status: ReturnType<typeof useStatus>; onAddAccount(): void }`.
- Consumes: `deriveGatewayState`, `CopyButton`, `AccountSelectionNotice`, and brand constants.

- [ ] **Step 1: Write the overview behavior test**

```tsx
render(<GatewayOverview accounts={readyAccountsHook} status={readyStatus} onAddAccount={onAdd} />);
expect(screen.getByText("Gateway ready")).toBeTruthy();
expect(screen.getByText("selected@example.com")).toBeTruthy();
expect(screen.getByText("http://127.0.0.1:8080/v1")).toBeTruthy();
expect(screen.getByRole("button", { name: /copy base url/i })).toBeTruthy();
expect(screen.getByRole("link", { name: /switch account/i }).getAttribute("href")).toBe("#/accounts");
```

Add a second test with no accounts that asserts the primary action calls `onAddAccount` and no fake ready state is shown.

- [ ] **Step 2: Run the overview test and verify it fails**

Run: `npm --prefix web exec vitest run -- src/pages/__tests__/gateway-overview.test.tsx`

Expected: FAIL because `GatewayOverview` does not exist.

- [ ] **Step 3: Implement the overview hierarchy**

The page renders, in this order:

1. `PageHeader` with NEXORA descriptor and Add Account action.
2. A dominant `CurrentGatewayAccount` panel showing ready/attention/blocked state.
3. `GatewayConnectionCard` with Base URL, masked API key, Copy buttons, selected chat model, and endpoint status.
4. A compact capability row for Chat Completions, Responses, and Image Generation.
5. The latest `AccountSelectionNotice`, including the separate Codex sync warning and restart instruction.

Do not render `PoolOverview`, the full account list, `ProxyPool`, API-key-provider settings, or fallback upstream controls on Overview.

- [ ] **Step 4: Route the root page to `GatewayOverview`**

In `App.tsx`, pass the existing `accounts` and `status` hooks directly. Continue mounting the Add Account modal at the shell level so all pages can trigger it.

- [ ] **Step 5: Add complete translations**

Add matching keys to `en`, `zh`, `zh-TW`, `zh-HK`, and `ja`. English user-facing strings include:

```ts
gatewayReady: "Gateway ready",
gatewayNoAccounts: "Authorize an account to start the gateway",
gatewaySelectAccount: "Select an account as the gateway source",
gatewayAccountBlocked: "The selected account needs attention",
gatewaySource: "Gateway source",
switchAccount: "Switch account",
apiAccess: "API Access",
copyBaseUrl: "Copy Base URL",
copyApiKey: "Copy API key",
```

- [ ] **Step 6: Run overview, app, and translation tests**

Run: `npm --prefix web exec vitest run -- src/pages/__tests__/gateway-overview.test.tsx src/App.test.tsx ../shared/i18n/context.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit the simplified overview**

```bash
git add web/src/pages/GatewayOverview.tsx web/src/pages/__tests__/gateway-overview.test.tsx web/src/components/CurrentGatewayAccount.tsx web/src/components/GatewayConnectionCard.tsx web/src/App.tsx shared/i18n/translations.ts
git commit -m "feat(web): add selected-account gateway overview"
```

---

### Task 5: Make Accounts the direct gateway-source workflow

**Files:**
- Modify: `web/src/pages/AccountManagement.tsx`
- Modify: `web/src/components/AccountList.tsx`
- Modify: `web/src/components/AccountCard.tsx`
- Modify: `web/src/components/AddAccount.tsx`
- Modify: `web/src/components/AccountSelectionNotice.tsx`
- Create: `web/src/pages/__tests__/account-gateway-selection.test.tsx`
- Modify: `web/src/components/AccountCard.test.tsx`
- Modify: `shared/i18n/translations.ts`

**Interfaces:**
- Produces: account-card primary action label `Use as gateway account` and selected badge `Current gateway account`.
- Consumes: `useAccounts.selectAccount(id): Promise<AccountSelectionResult>`.

- [ ] **Step 1: Write failing account-selection UI tests**

```tsx
expect(screen.getByRole("button", { name: "Use as gateway account" })).toBeTruthy();
fireEvent.click(screen.getByRole("button", { name: "Use as gateway account" }));
await waitFor(() => expect(selectAccount).toHaveBeenCalledWith("account-b"));
```

For the current account:

```tsx
expect(screen.getByText("Current gateway account")).toBeTruthy();
expect(screen.queryByRole("button", { name: "Use as gateway account" })).toBeNull();
```

- [ ] **Step 2: Run account UI tests and verify copy/hierarchy failures**

Run: `npm --prefix web exec vitest run -- src/components/AccountCard.test.tsx src/pages/__tests__/account-gateway-selection.test.tsx`

Expected: FAIL on old labels or missing page wiring.

- [ ] **Step 3: Rebuild account management around full account data**

Use the existing `AccountList`/`AccountCard` path so quota and health remain visible. Remove the duplicate selected-account `<select>` from `AccountManagement`. Put Add Account in the page header. Make account selection the visually dominant per-card action and move delete, fingerprint convergence, bulk import/export, and batch maintenance into secondary controls.

- [ ] **Step 4: Simplify the add-account panel**

Show a three-step progression:

```text
1. Copy authorization link
2. Complete sign-in in your browser
3. Return here; NEXORA detects the account automatically
```

Keep manual callback relay as a collapsed recovery option. Keep refresh-token import under Advanced. Do not call `window.open` or Electron `shell.openExternal`.

- [ ] **Step 5: Keep partial success explicit**

When account selection succeeds but Codex auth sync fails, render:

```text
Gateway account switched. Codex Desktop sync failed: {warning}
```

When both succeed, render:

```text
Gateway account switched. Restart Codex Desktop manually to use this account there.
```

- [ ] **Step 6: Run focused account and OAuth tests**

Run: `npm --prefix web exec vitest run -- src/components/AccountCard.test.tsx src/components/AccountList.test.tsx src/pages/__tests__/account-gateway-selection.test.tsx`

Run: `npm exec vitest run -- tests/unit/web/add-account.test.ts tests/unit/services/account-selection.test.ts tests/e2e/oauth.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit the direct account-source workflow**

```bash
git add web/src/pages/AccountManagement.tsx web/src/pages/__tests__/account-gateway-selection.test.tsx web/src/components/AccountList.tsx web/src/components/AccountCard.tsx web/src/components/AccountCard.test.tsx web/src/components/AddAccount.tsx web/src/components/AccountSelectionNotice.tsx shared/i18n/translations.ts
git commit -m "feat(accounts): make account selection the gateway source"
```

---

### Task 6: Replace technical gateway settings with an API Access page

**Files:**
- Create: `web/src/pages/ApiAccessPage.tsx`
- Create: `web/src/pages/__tests__/api-access.test.tsx`
- Modify: `web/src/components/ApiConfig.tsx`
- Modify: `web/src/components/CodeExamples.tsx`
- Modify: `web/src/App.tsx`
- Modify: `shared/i18n/translations.ts`

**Interfaces:**
- Produces: `ApiAccessPageProps` matching the connection/model fields currently accepted by `InfoPage`.
- Consumes: `baseUrl`, `apiKey`, `models`, selected model/effort/speed setters from `useStatus`.

- [ ] **Step 1: Write failing API Access tests**

```tsx
expect(screen.getByText("OpenAI-compatible connection")).toBeTruthy();
expect(screen.getByText("/v1/chat/completions")).toBeTruthy();
expect(screen.getByText("/v1/responses")).toBeTruthy();
expect(screen.getByText("/v1/images/generations")).toBeTruthy();
expect(screen.getByDisplayValue("gpt-image-2")).toBeTruthy();
expect(screen.getByRole("button", { name: /copy curl/i })).toBeTruthy();
```

- [ ] **Step 2: Run and verify failure against the old Info page**

Run: `npm --prefix web exec vitest run -- src/pages/__tests__/api-access.test.tsx`

Expected: FAIL because `ApiAccessPage` does not exist.

- [ ] **Step 3: Implement a consumption-focused page**

Render one connection panel, one model selector, endpoint capability chips, and protocol tabs for Chat Completions, Responses, and Images. Default the Images example to:

```json
{
  "model": "gpt-image-2",
  "prompt": "A cinematic orbital gateway above a blue planet",
  "size": "1024x1024"
}
```

Generate examples from the live `baseUrl` and masked/revealed local key. Do not expose provider routing, proxy pools, fallback upstream configuration, or client-key distribution on this page.

- [ ] **Step 4: Preserve advanced protocol helpers without primary clutter**

Move Anthropic setup and test-connection utilities into a collapsed `Advanced protocol compatibility` section at the bottom of API Access. Keep their existing logic and tests.

- [ ] **Step 5: Wire `#/api` and legacy redirect**

Render `ApiAccessPage` for `#/api`; redirect `#/info` to it. Remove `InfoPage` from normal navigation but do not delete it until all imports/tests have migrated.

- [ ] **Step 6: Run API page, image, and build tests**

Run: `npm --prefix web exec vitest run -- src/pages/__tests__/api-access.test.tsx src/pages/__tests__/info-page.test.tsx`

Run: `npm exec vitest run -- tests/e2e/images.test.ts`

Run: `npm run build:web`

Expected: PASS.

- [ ] **Step 7: Commit API Access**

```bash
git add web/src/pages/ApiAccessPage.tsx web/src/pages/__tests__/api-access.test.tsx web/src/components/ApiConfig.tsx web/src/components/CodeExamples.tsx web/src/App.tsx shared/i18n/translations.ts
git commit -m "feat(web): simplify gateway API access"
```

---

### Task 7: Consolidate activity, advanced settings, and legal information

**Files:**
- Create: `web/src/pages/ActivityPage.tsx`
- Create: `web/src/pages/AboutPage.tsx`
- Create: `web/src/pages/__tests__/about-page.test.tsx`
- Modify: `web/src/components/SettingsTab.tsx`
- Modify: `web/src/App.tsx`
- Modify: `shared/i18n/translations.ts`
- Create: `NOTICE.md`
- Create: `THIRD_PARTY_NOTICES.md`
- Preserve: `LICENCE`

**Interfaces:**
- Produces: `ActivityPage` composing existing request logs, errors, and usage views under local tabs.
- Produces: `AboutPage` with version, source repository, licence, modified-distribution statement, and links to local notice documents.
- Consumes: existing `LogsPage`, `ErrorsPage`, `UsageStats`, `SettingsTab`, update status, and Task 1 brand constants.

- [ ] **Step 1: Write the failing legal visibility test**

```tsx
render(<AboutPage version="2.0.77" commit="abc123" />);
expect(screen.getByText("NEXORA")).toBeTruthy();
expect(screen.getByText(/independent modified distribution/i)).toBeTruthy();
expect(screen.getByRole("link", { name: /source repository/i }).getAttribute("href"))
  .toBe("https://github.com/PingRui/codex-proxy");
expect(screen.getByText(/non-commercial licence/i)).toBeTruthy();
```

- [ ] **Step 2: Run and verify the missing-page failure**

Run: `npm --prefix web exec vitest run -- src/pages/__tests__/about-page.test.tsx`

Expected: FAIL because `AboutPage` does not exist.

- [ ] **Step 3: Implement Activity as a secondary operational page**

Use local page tabs `Requests`, `Errors`, and `Usage`. Preserve unread-error behavior. Do not merge data stores or change backend APIs.

- [ ] **Step 4: Move retained complexity under Settings → Advanced**

Normal Settings contains appearance, language, startup, update, Codex auth path, and data location. Add a collapsed Advanced group linking to or embedding provider API keys, proxy pools, client keys, routing, quota tuning, logs, and Ollama settings. Clearly label these as optional and unnecessary for the authorized-account gateway flow.

- [ ] **Step 5: Add compliant distribution notices**

`NOTICE.md` must state:

```md
# NEXORA Notices

NEXORA is an independently maintained modified distribution combining
multi-account authorization and a local AI gateway. It is not an official
OpenAI or Codex product and is not endorsed or sponsored by OpenAI.

Portions are derived from Codex Proxy. The original and modified source remain
subject to the non-commercial licence in LICENCE. Existing copyright,
licence, and disclaimer notices are retained as required.
```

`THIRD_PARTY_NOTICES.md` explains that dependency licences remain recorded in
the package lockfiles and distributed dependency metadata. Do not manually
copy thousands of lockfile licence lines into this document.

- [ ] **Step 6: Implement About and remove promotional footer copy**

The footer shows only `NEXORA v{version}` and local gateway status. About holds
the source and legal links. Remove old social, sponsor, star, and old-repository
promotional links from user-facing components.

- [ ] **Step 7: Run Activity/About/web tests**

Run: `npm --prefix web exec vitest run -- src/pages/__tests__/about-page.test.tsx src/pages/__tests__/logs.test.tsx src/pages/__tests__/usage-stats.test.tsx`

Run: `npm run test:web`

Expected: PASS.

- [ ] **Step 8: Commit operational and legal consolidation**

```bash
git add web/src/pages/ActivityPage.tsx web/src/pages/AboutPage.tsx web/src/pages/__tests__/about-page.test.tsx web/src/components/SettingsTab.tsx web/src/components/Footer.tsx web/src/App.tsx shared/i18n/translations.ts NOTICE.md THIRD_PARTY_NOTICES.md LICENCE
git commit -m "feat(web): consolidate advanced and legal surfaces"
```

---

### Task 8: Replace documentation, badges, links, and distribution branding

**Files:**
- Modify: `README.md`
- Modify: `README_EN.md`
- Modify: `README_TW.md`
- Modify: `README_HK.md`
- Modify: `README_JA.md`
- Modify: `.env.example`
- Modify: `docker-compose.yml`
- Modify: `.github/workflows/*` only where release names/repositories are hard-coded
- Modify: `docs/windows-desktop-manual-accounts.md`
- Do not modify: dependency lockfile licence/funding URLs solely for branding

**Interfaces:**
- Produces: public documentation for NEXORA's authorized-account gateway flow.
- Consumes: brand/repository constants conceptually; Markdown does not import code.

- [ ] **Step 1: Add a stale-brand audit command and capture the initial matches**

Run:

```powershell
rg -n -i "icebear0828|IceBearMiner|Star on GitHub|github\.com/icebear0828|ghcr\.io/icebear0828" README*.md .env.example docker-compose.yml .github web/src src/self-update.ts packages/electron
```

Expected: matches identify every old promotional or release reference.

- [ ] **Step 2: Rewrite the primary README around the NEXORA flow**

The first screenful must contain:

```md
# NEXORA

Multi-Account AI Gateway

Authorize multiple subscription accounts, choose one as the active gateway
source, and expose it through a local OpenAI-compatible API.
```

Document installation, copy-only OAuth, selecting the gateway account, Base
URL/API key usage, image generation, manual Codex Desktop restart, loopback-only
security, non-commercial licence, and independent modified-distribution notice.

- [ ] **Step 3: Replace repository and release links**

Use `https://github.com/PingRui/codex-proxy` for source, issues, and releases.
Remove the old X/social and sponsor badges. Use neutral build/platform badges
only. Do not advertise a GHCR image until that image exists in the new owner.

- [ ] **Step 4: Bring localized README entry sections into alignment**

Update product name, repository URLs, installation artifact examples, and the
primary authorized-account flow in each localized README. Preserve detailed
protocol documentation that is still correct.

- [ ] **Step 5: Run the stale-brand audit again**

Run the same `rg` command from Step 1.

Expected: no matches outside `LICENCE`, `NOTICE.md`, changelog/history, or an
explicit upstream-attribution section. Matches in lockfiles are ignored.

- [ ] **Step 6: Commit documentation ownership**

```bash
git add README.md README_EN.md README_TW.md README_HK.md README_JA.md .env.example docker-compose.yml .github docs/windows-desktop-manual-accounts.md
git commit -m "docs: publish NEXORA gateway documentation"
```

---

### Task 9: Create original NEXORA visual assets and package the Windows app

**Files:**
- Replace: `web/public/icon.png`
- Replace: `packages/electron/electron/assets/icon.png`
- Replace: `packages/electron/electron/assets/icon.ico`
- Modify: `packages/electron/__tests__/builder-config.test.ts`
- Create: `docs/brand/nexora-asset-notes.md`

**Interfaces:**
- Produces: original square NEXORA icon in PNG and ICO formats suitable for web, tray, executable, and installer.
- Consumes: NEXORA visual direction from the approved spec.

- [ ] **Step 1: Generate an original master icon**

Use the image generation capability with this exact creative brief:

```text
Create an original premium app icon for NEXORA, a multi-account AI gateway.
Abstract orbital gateway formed by three converging paths around a precise
central node, deep graphite background, electric cyan and indigo light,
minimal geometric vector-like construction, strong silhouette at 16px,
no letters, no OpenAI knot, no Codex logo, no copied brand marks, square app
icon, no mockup, no text.
```

Save the approved master asset and record the generation brief and conversion
commands in `docs/brand/nexora-asset-notes.md`.

- [ ] **Step 2: Convert to required sizes without changing artwork**

Produce at least 16, 24, 32, 48, 64, 128, 256, 512, and 1024 pixel PNG
variants with the installed FFmpeg binary. Copy the 1024px PNG to
`web/public/icon.png` and `packages/electron/electron/assets/icon.png`, then
convert the 256px PNG to `packages/electron/electron/assets/icon.ico`:

```powershell
$nexoraMaster = 'docs/brand/nexora-icon-master.png'
$nexoraSizes = 16,24,32,48,64,128,256,512,1024
foreach ($nexoraSize in $nexoraSizes) {
  ffmpeg -y -i $nexoraMaster -vf "scale=$nexoraSize`:$nexoraSize:flags=lanczos" "docs/brand/nexora-icon-$nexoraSize.png"
}
Copy-Item -LiteralPath 'docs/brand/nexora-icon-1024.png' -Destination 'web/public/icon.png' -Force
Copy-Item -LiteralPath 'docs/brand/nexora-icon-1024.png' -Destination 'packages/electron/electron/assets/icon.png' -Force
ffmpeg -y -i 'docs/brand/nexora-icon-256.png' 'packages/electron/electron/assets/icon.ico'
```

- [ ] **Step 3: Verify assets and Electron references**

Extend builder tests to assert the icon files exist and are non-empty. Open the
1024px PNG with the local image viewer and verify small-size silhouette using
the 32px variant once.

- [ ] **Step 4: Build the web and Electron bundles**

Run: `npm run build`

Run: `npm --prefix packages/electron run build`

Expected: PASS.

- [ ] **Step 5: Package Windows x64**

Run: `npm --prefix packages/electron run pack:win`

Expected artifact: `packages/electron/release/NEXORA-2.0.77-win-x64.exe` using
the current Electron package version.

- [ ] **Step 6: Commit visual assets**

```bash
git add web/public packages/electron/electron/assets packages/electron/__tests__/builder-config.test.ts
git add -f docs/brand/nexora-asset-notes.md docs/brand/nexora-icon-master.png docs/brand/nexora-icon-*.png
git commit -m "feat(brand): add original NEXORA visual identity"
```

---

### Task 10: Perform integrated verification and publish the source

**Files:**
- Modify only when a verification failure is caused by this implementation.
- Preserve all unrelated pre-existing dirty files.

**Interfaces:**
- Consumes: all previous tasks.
- Produces: verified local build, Windows installer, clean task-owned commits, and public GitHub source.

- [ ] **Step 1: Run the focused feature suite**

Run:

```powershell
npm exec vitest run -- tests/unit/services/account-selection.test.ts tests/unit/auth/codex-auth-writer.test.ts tests/e2e/oauth.test.ts tests/e2e/images.test.ts tests/unit/server-options.test.ts packages/electron/__tests__/server-options.test.ts packages/electron/__tests__/builder-config.test.ts packages/electron/__tests__/build.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run web tests and production builds**

Run: `npm run test:web`

Run: `npm run build`

Run: `npm --prefix packages/electron run build`

Expected: PASS.

- [ ] **Step 3: Run full tests and classify Windows-only failures**

Run: `npm test`

Expected: product tests pass. Existing Bash CI tests may fail on Windows when
`/bin/sh` is unavailable or when Bash cannot interpret the Chinese workspace
path; report those separately and do not disguise them as product regressions.

- [ ] **Step 4: Verify the UI once in installed Chrome**

Start the local development server, open it using
`C:\Program Files\Google\Chrome\Application\chrome.exe`, and inspect:

- Dark and light Overview.
- Empty, ready, blocked, and Codex-sync-warning states.
- Accounts at desktop and narrow widths.
- API Access copy controls and all three protocol examples.
- Settings Advanced disclosure and About legal links.

Fix only reproducible implementation issues, then rerun affected tests. Do not
perform repeated pixel-by-pixel browser checks after the acceptance pass.

- [ ] **Step 5: Verify packaged metadata and hash**

Run:

```powershell
$nexoraInstaller = Resolve-Path 'packages/electron/release/NEXORA-*-win-x64.exe'
Get-FileHash -Algorithm SHA256 -LiteralPath $nexoraInstaller
Get-AuthenticodeSignature -LiteralPath $nexoraInstaller
```

Expected: a stable SHA-256 value and `NotSigned` until a production certificate
is configured. Document the SmartScreen implication in the release notes.

- [ ] **Step 6: Audit for credentials and stale ownership references**

Run:

```powershell
git status --short
git grep -n -I -E 'gho_[A-Za-z0-9]+|sk-[A-Za-z0-9]{20,}|refresh_token["'"']?\s*[:=]\s*["'"'][^"'"']+' -- ':!package-lock.json' ':!web/package-lock.json'
rg -n -i "icebear0828|IceBearMiner|github\.com/icebear0828|ghcr\.io/icebear0828" --glob '!package-lock.json' --glob '!web/package-lock.json' --glob '!CHANGELOG.md' .
```

Expected: no credentials. Old-owner references appear only where legally or
historically required and are reviewed individually.

- [ ] **Step 7: Push the completed source and make the repository public**

First push task-owned commits:

```powershell
git push origin dev
```

After the secrets audit passes and the remote contains the NEXORA commits:

```powershell
gh repo edit PingRui/codex-proxy --visibility public --accept-visibility-change-consequences
gh repo view PingRui/codex-proxy --json visibility,url,defaultBranchRef
```

Expected: visibility is `PUBLIC`, URL is
`https://github.com/PingRui/codex-proxy`, and the default branch remains `dev`
unless the user explicitly requests a branch change.

- [ ] **Step 8: Record final handoff**

Report the repository URL, installer path, SHA-256 hash, signing status, test
results, any Windows-only CI failures, and the list of untouched user-owned
working-tree changes.
