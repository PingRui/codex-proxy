/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/preact";
import type { Account } from "../../../shared/types";

const mockI18n = vi.hoisted(() => ({
  useT: vi.fn(),
  useI18n: vi.fn(),
}));

vi.mock("../../../shared/i18n/context", () => ({
  useT: () => mockI18n.useT(),
  useI18n: () => mockI18n.useI18n(),
}));

vi.mock("./AccountCard", () => ({
  AccountCard: ({ account }: { account: Account }) => <div>{account.email}</div>,
}));

vi.mock("./AccountImportExport", () => ({
  AccountImportExport: () => <div>import-export</div>,
}));

import { AccountList } from "./AccountList";

const STATUS_FILTER_STORAGE_KEY = "codex-proxy-account-list-status-filter";
const EXPAND_ALL_STORAGE_KEY = "codex-proxy-account-list-expand-all";

function makeAccount(id: string, status: string): Account {
  return {
    id,
    email: `${id}@example.com`,
    status,
  };
}

function makeAccounts(total: number, status: string = "active"): Account[] {
  return Array.from({ length: total }, (_, index) => makeAccount(`acct-${index + 1}`, status));
}

function renderAccountList(accounts: Account[], onRefresh = vi.fn()) {
  return render(
    <AccountList
      accounts={accounts}
      loading={false}
      onDelete={vi.fn(async () => null)}
      onRefresh={onRefresh}
      refreshing={false}
      lastUpdated={null}
    />,
  );
}

function getStorage(): Storage {
  return window.localStorage;
}

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => Array.from(values.keys())[index] ?? null,
    removeItem: (key: string) => values.delete(key),
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

describe("AccountList", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: createMemoryStorage(),
    });
    getStorage().clear();
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ warnings: [] }) })));
    mockI18n.useT.mockImplementation(
      () => (key: string, vars?: Record<string, unknown>) => {
        if (key === "healthCheckResult") return `alive ${vars?.alive} dead ${vars?.dead} skipped ${vars?.skipped}`;
        if (key === "quotaCriticalWarning") return `critical ${vars?.count}`;
        if (key === "quotaWarning") return `warning ${vars?.count}`;
        if (key === "quotaRefreshSummary") return `success ${vars?.success} failed ${vars?.failed} skipped ${vars?.skipped}`;
        return key;
      },
    );
    mockI18n.useI18n.mockReturnValue({ lang: "en" });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("reads persisted status filter and expand-all state on initialization", async () => {
    getStorage().setItem(STATUS_FILTER_STORAGE_KEY, "active");
    getStorage().setItem(EXPAND_ALL_STORAGE_KEY, "true");

    renderAccountList([...makeAccounts(11, "active"), makeAccount("expired-1", "expired")]);

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("active");
    expect(await screen.findByText("11 / 11")).toBeTruthy();
    expect(screen.getByText("collapse")).toBeTruthy();
  });

  it("falls back to all when persisted filter no longer matches any account state", async () => {
    getStorage().setItem(STATUS_FILTER_STORAGE_KEY, "disabled");

    renderAccountList([makeAccount("active-1", "active"), makeAccount("expired-1", "expired")]);

    await waitFor(() => {
      const select = screen.getByRole("combobox") as HTMLSelectElement;
      expect(select.value).toBe("all");
    });
    expect(getStorage().getItem(STATUS_FILTER_STORAGE_KEY)).toBe("all");
  });

  it("round-trips expand-all state through localStorage", async () => {
    renderAccountList(makeAccounts(12, "active"));

    fireEvent.click(screen.getByText("expandAll"));
    await waitFor(() => expect(getStorage().getItem(EXPAND_ALL_STORAGE_KEY)).toBe("true"));
    expect(screen.getByText("12 / 12")).toBeTruthy();

    fireEvent.click(screen.getByText("collapse"));
    await waitFor(() => expect(getStorage().getItem(EXPAND_ALL_STORAGE_KEY)).toBe("false"));
  });

  it("preserves expand-all preference when the filtered list still exceeds one page", async () => {
    getStorage().setItem(EXPAND_ALL_STORAGE_KEY, "true");
    renderAccountList([...makeAccounts(12, "active"), ...makeAccounts(2, "expired")]);

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "active" },
    });

    await screen.findByText("12 / 12");
    expect(getStorage().getItem(EXPAND_ALL_STORAGE_KEY)).toBe("true");
    expect(screen.getByText("collapse")).toBeTruthy();
  });

  it("names compact refresh, health, and status controls", () => {
    renderAccountList([makeAccount("active-1", "active")]);

    const refresh = screen.getByRole("button", { name: "refreshAllQuota" });
    const health = screen.getByRole("button", { name: "healthCheck", hidden: true });
    expect(refresh.getAttribute("aria-label")).toBe("refreshAllQuota");
    expect(health.getAttribute("aria-label")).toBe("healthCheck");
    expect(refresh.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
    expect(health.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
    expect(screen.getByRole("combobox", { name: "statusFilter" })).toBeTruthy();
  });

  it("refreshes active accounts beyond the visible page and filter, including exhausted cached quota", async () => {
    getStorage().setItem(STATUS_FILTER_STORAGE_KEY, "expired");
    const accounts = makeAccounts(12);
    accounts[0].quota = { rate_limit: { limit_reached: true } };
    const onRefresh = vi.fn();
    renderAccountList([...accounts, makeAccount("expired", "expired"), makeAccount("disabled", "disabled")], onRefresh);
    fireEvent.click(screen.getByRole("button", { name: "refreshAllQuota" }));
    await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(1));
    const urls = vi.mocked(fetch).mock.calls.map(([url]) => String(url)).filter(url => url.endsWith("/quota"));
    expect(urls).toHaveLength(12);
    expect(urls).toContain("/auth/accounts/acct-1/quota");
    expect(urls).toContain("/auth/accounts/acct-12/quota");
    expect(screen.getByRole("status").textContent).toContain("success 12 failed 0 skipped 2");
  });

  it("continues after HTTP and network failures and encodes account identifiers", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.includes("http-fail/quota")) return { ok: false, status: 502 };
      if (url.includes("network-fail/quota")) throw new Error("Offline");
      return { ok: true, json: async () => ({ warnings: [] }) };
    }));
    const onRefresh = vi.fn();
    renderAccountList([makeAccount("http-fail", "active"), makeAccount("network-fail", "active"), makeAccount("a/b", "active")], onRefresh);
    fireEvent.click(screen.getByRole("button", { name: "refreshAllQuota" }));
    await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("status").textContent).toContain("success 1 failed 2 skipped 0");
    expect(screen.getByRole("status").textContent).toContain("network-fail@example.com");
    expect(vi.mocked(fetch).mock.calls.some(([url]) => url === "/auth/accounts/a%2Fb/quota")).toBe(true);
    expect(screen.getByRole("button", { name: "refreshAllQuota" })).toHaveProperty("disabled", false);
  });

  it("limits concurrency to two and ignores repeated refresh clicks until completion", async () => {
    const releases: Array<() => void> = [];
    let running = 0;
    let peak = 0;
    vi.stubGlobal("fetch", vi.fn((url: string) => {
      if (!url.endsWith("/quota")) return Promise.resolve({ ok: true, json: async () => ({ warnings: [] }) });
      running++;
      peak = Math.max(peak, running);
      return new Promise(resolve => releases.push(() => { running--; resolve({ ok: true }); }));
    }));
    const onRefresh = vi.fn();
    renderAccountList(makeAccounts(3), onRefresh);
    const button = screen.getByRole("button", { name: "refreshAllQuota" });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(releases).toHaveLength(2);
    expect(button).toHaveProperty("disabled", true);
    releases[0]();
    await waitFor(() => expect(releases).toHaveLength(3));
    releases[1]();
    releases[2]();
    await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(1));
    expect(peak).toBe(2);
    expect(screen.getByRole("status").textContent).toContain("success 3 failed 0 skipped 0");
  });

  it("reloads the list without upstream requests when no accounts are eligible", async () => {
    const onRefresh = vi.fn();
    renderAccountList([makeAccount("expired", "expired")], onRefresh);
    fireEvent.click(screen.getByRole("button", { name: "refreshAllQuota" }));
    await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(1));
    expect(vi.mocked(fetch).mock.calls.some(([url]) => String(url).endsWith("/quota"))).toBe(false);
    expect(screen.getByRole("status").textContent).toContain("success 0 failed 0 skipped 1");
  });
});
