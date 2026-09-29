/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/preact";
import { useState } from "preact/hooks";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { useAccounts } from "../../../../shared/hooks/use-accounts";
import { I18nProvider } from "../../../../shared/i18n/context";
import type { Account } from "../../../../shared/types";
import { AccountManagement } from "../AccountManagement";

type AccountsHook = ReturnType<typeof useAccounts>;

function account(id: string): Account {
  return {
    id,
    email: `${id}@example.com`,
    status: "active",
    planType: "Plus",
    quota: { rate_limit: { used_percent: 10, remaining_percent: 90 } },
  };
}

function accountsHook(selectionNotice: AccountsHook["selectionNotice"] = null) {
  const selectAccount = vi.fn(async (id: string) => ({
    selectedAccountId: id,
    proxySelected: true,
    codexSynced: true,
    restartCodexRequired: true,
    codexAuthPath: "C:\\Users\\test\\.codex\\auth.json",
  }));
  const accounts = {
    list: [account("account-a"), account("account-b")],
    loading: false,
    refreshing: false,
    lastUpdated: null,
    selectedAccountId: "account-a",
    selectingAccountId: null,
    selectionNotice,
    persistenceHealth: { ok: true },
    refresh: vi.fn(),
    deleteAccount: vi.fn(async () => null),
    exportAccounts: vi.fn(async () => undefined),
    importAccounts: vi.fn(),
    batchDelete: vi.fn(async () => null),
    batchSetStatus: vi.fn(async () => null),
    toggleStatus: vi.fn(async () => null),
    updateLabel: vi.fn(async () => null),
    updateCodexFingerprintMode: vi.fn(async () => null),
    selectAccount,
    dismissSelectionNotice: vi.fn(),
  } as unknown as AccountsHook;
  return { accounts, selectAccount };
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ warnings: [] }) })));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Accounts gateway source workflow", () => {
  it("selects a non-current account directly from its dominant action", async () => {
    const { accounts, selectAccount } = accountsHook();
    render(
      <I18nProvider>
        <AccountManagement accounts={accounts} onAddAccount={vi.fn()} />
      </I18nProvider>,
    );

    expect(screen.getByText("Current gateway account")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Use as gateway account" }));
    await waitFor(() => expect(selectAccount).toHaveBeenCalledWith("account-b"));
    expect(screen.queryByLabelText("Use this account")).toBeNull();
  });

  it("keeps a Codex sync failure explicit after the gateway switch succeeds", () => {
    const { accounts } = accountsHook({
      selectedAccountId: "account-b",
      proxySelected: true,
      codexSynced: false,
      restartCodexRequired: false,
      codexAuthPath: "C:\\Users\\test\\.codex\\auth.json",
      warning: "Permission denied",
    });
    render(
      <I18nProvider>
        <AccountManagement accounts={accounts} onAddAccount={vi.fn()} />
      </I18nProvider>,
    );

    expect(screen.getByText("Gateway account switched. Codex Desktop sync failed: Permission denied")).toBeTruthy();
  });

  it("updates every consumer immediately through the shared accounts state", async () => {
    function SharedAccountsHarness() {
      const [selectedAccountId, setSelectedAccountId] = useState("account-a");
      const { accounts } = accountsHook();
      accounts.selectedAccountId = selectedAccountId;
      accounts.selectAccount = async (id: string) => {
        setSelectedAccountId(id);
        return {
          selectedAccountId: id,
          proxySelected: true,
          codexSynced: true,
          restartCodexRequired: true,
          codexAuthPath: "C:\\Users\\test\\.codex\\auth.json",
        };
      };

      return (
        <>
          <output aria-label="shared selected account">{selectedAccountId}</output>
          <AccountManagement accounts={accounts} onAddAccount={vi.fn()} />
        </>
      );
    }

    render(
      <I18nProvider>
        <SharedAccountsHarness />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Use as gateway account" }));
    await waitFor(() => expect(screen.getByLabelText("shared selected account").textContent).toBe("account-b"));
    expect(within(document.querySelector('[data-account-id="account-b"]') as HTMLElement).getByText("Current gateway account")).toBeTruthy();
  });
});
