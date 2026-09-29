/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/preact";
import { afterEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "../../../../shared/i18n/context";
import type { useAccounts } from "../../../../shared/hooks/use-accounts";
import type { useStatus } from "../../../../shared/hooks/use-status";
import type { Account } from "../../../../shared/types";
import { GatewayOverview } from "../GatewayOverview";

type AccountsHook = ReturnType<typeof useAccounts>;
type StatusHook = ReturnType<typeof useStatus>;

function account(status = "active"): Account {
  return {
    id: "selected",
    email: "selected@example.com",
    label: "Primary",
    status,
    planType: "Pro",
    quota: { rate_limit: { used_percent: 23, remaining_percent: 77 } },
  };
}

function accountsHook(accounts: Account[], selectedAccountId: string | null): AccountsHook {
  return {
    list: accounts,
    loading: false,
    selectedAccountId,
    selectionNotice: null,
    dismissSelectionNotice: vi.fn(),
  } as unknown as AccountsHook;
}

function statusHook(): StatusHook {
  return {
    baseUrl: "http://127.0.0.1:8080/v1",
    apiKey: "sk-nexora-secret-value",
    selectedModel: "gpt-5.4",
  } as unknown as StatusHook;
}

function renderOverview(accounts: AccountsHook, onAddAccount = vi.fn()) {
  render(
    <I18nProvider>
      <GatewayOverview accounts={accounts} status={statusHook()} onAddAccount={onAddAccount} />
    </I18nProvider>,
  );
  return onAddAccount;
}

afterEach(cleanup);

describe("GatewayOverview", () => {
  it("makes the selected ready account and live connection details primary", () => {
    renderOverview(accountsHook([account()], "selected"));

    expect(screen.getByText("Gateway ready")).toBeTruthy();
    expect(screen.getByText("selected@example.com")).toBeTruthy();
    expect(screen.getByText("http://127.0.0.1:8080/v1")).toBeTruthy();
    expect(screen.getByRole("button", { name: /copy base url/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /copy api key/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /switch account/i }).getAttribute("href")).toBe("#/accounts");
    expect(screen.queryByText("sk-nexora-secret-value")).toBeNull();
  });

  it("invites authorization when there are no accounts without showing a fake ready state", () => {
    const onAdd = renderOverview(accountsHook([], null));

    expect(screen.getByText("Authorize an account to start the gateway")).toBeTruthy();
    expect(screen.queryByText("Gateway ready")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Add Account" }));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it("keeps an unhealthy selected account visible and marks it blocked", () => {
    renderOverview(accountsHook([account("expired")], "selected"));

    expect(screen.getByText("The selected account needs attention")).toBeTruthy();
    expect(screen.getByText("selected@example.com")).toBeTruthy();
    expect(screen.queryByText("Gateway ready")).toBeNull();
  });

  it("reports proxy selection separately from a failed Codex credential sync", () => {
    const accounts = accountsHook([account()], "selected");
    accounts.selectionNotice = {
      selectedAccountId: "selected",
      proxySelected: true,
      codexSynced: false,
      restartCodexRequired: false,
      codexAuthPath: "C:\\Users\\test\\.codex\\auth.json",
      warning: "Unable to update Codex auth.json",
    };

    renderOverview(accounts);

    expect(screen.getByText("Gateway account switched. Codex Desktop sync failed: Unable to update Codex auth.json")).toBeTruthy();
  });
});
