/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/preact";
import { afterEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "../../../../shared/i18n/context";
import type { useAccounts } from "../../../../shared/hooks/use-accounts";
import type { useStatus } from "../../../../shared/hooks/use-status";
import type { Account } from "../../../../shared/types";
import { GatewayOverview } from "../GatewayOverview";

const { clipboardCopyMock } = vi.hoisted(() => ({
  clipboardCopyMock: vi.fn(async () => true),
}));

vi.mock("../../../../shared/utils/clipboard", () => ({
  clipboardCopy: clipboardCopyMock,
}));

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

function renderOverview(accounts: AccountsHook, onAddAccount = vi.fn(), status = statusHook()) {
  render(
    <I18nProvider>
      <GatewayOverview accounts={accounts} status={status} onAddAccount={onAddAccount} />
    </I18nProvider>,
  );
  return onAddAccount;
}

afterEach(() => {
  cleanup();
  clipboardCopyMock.mockClear();
});

describe("GatewayOverview", () => {
  it("makes the selected ready account and live connection details primary", async () => {
    renderOverview(accountsHook([account()], "selected"));

    expect(screen.getByText("Gateway ready")).toBeTruthy();
    expect(screen.getByText("selected@example.com")).toBeTruthy();
    expect(screen.getByText("http://127.0.0.1:8080/v1")).toBeTruthy();
    const quotaProgress = screen.getByRole("progressbar", { name: "77% available" });
    expect(quotaProgress.getAttribute("aria-valuemin")).toBe("0");
    expect(quotaProgress.getAttribute("aria-valuenow")).toBe("77");
    expect(quotaProgress.getAttribute("aria-valuemax")).toBe("100");
    const baseUrlCopy = screen.getByRole("button", { name: /copy base url/i });
    const apiKeyCopy = screen.getByRole("button", { name: /copy api key/i });
    expect(baseUrlCopy).not.toHaveProperty("disabled", true);
    expect(apiKeyCopy).not.toHaveProperty("disabled", true);
    expect(screen.getByRole("link", { name: /switch account/i }).getAttribute("href")).toBe("#/accounts");
    expect(screen.queryByText("sk-nexora-secret-value")).toBeNull();

    fireEvent.click(apiKeyCopy);
    await waitFor(() => expect(clipboardCopyMock).toHaveBeenCalledWith("sk-nexora-secret-value"));
    expect(screen.getByRole("button", { name: "Copied!" })).toBeTruthy();
    expect(screen.getByText("Copied!").getAttribute("aria-live")).toBe("polite");
    expect(screen.queryByLabelText(/sk-nexora-secret-value/i)).toBeNull();
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
    expect(screen.getByText("Connection unavailable")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Reauthorize account" }).getAttribute("href")).toBe("#/accounts");
    expect(screen.queryByText("77% available")).toBeNull();
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(screen.queryByText("Gateway ready")).toBeNull();
  });

  it("uses select-account guidance when no persisted account is selected", () => {
    renderOverview(accountsHook([account()], null));

    expect(screen.getByRole("link", { name: "Select the proxy account" }).getAttribute("href")).toBe("#/accounts");
  });

  it("does not describe an unreported plan as free", () => {
    const selected = account();
    delete selected.planType;
    renderOverview(accountsHook([selected], "selected"));

    expect(screen.getByText("Plan not reported")).toBeTruthy();
    expect(screen.queryByText("Free")).toBeNull();
  });

  it("keeps loading connection values unavailable and never copies the loading sentinel", () => {
    const loadingStatus = {
      ...statusHook(),
      baseUrl: "Loading...",
      apiKey: "Loading...",
    } as StatusHook;
    renderOverview(accountsHook([account()], "selected"), vi.fn(), loadingStatus);

    expect(screen.getByText("Waiting for a ready account")).toBeTruthy();
    expect(screen.getAllByText("Connection unavailable")).toHaveLength(2);
    const copyButtons = screen.getAllByRole("button", { name: /copy (base url|api key)/i });
    expect(copyButtons).toHaveLength(2);
    for (const button of copyButtons) {
      expect(button).toHaveProperty("disabled", true);
      fireEvent.click(button);
    }
    expect(clipboardCopyMock).not.toHaveBeenCalled();
    expect(screen.queryByText("Loading...")).toBeNull();
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
