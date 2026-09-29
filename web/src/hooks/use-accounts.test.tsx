/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/preact";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAccounts } from "../../../shared/hooks/use-accounts";
import type { AccountSelectionResult } from "../../../shared/types";

function AccountFingerprintHarness() {
  const accounts = useAccounts();
  return (
    <button
      type="button"
      onClick={() => void accounts.updateCodexFingerprintMode("account/1", "session")}
    >
      enable
    </button>
  );
}

function AccountSelectionHarness() {
  const accounts = useAccounts();
  return (
    <>
      <output aria-label="selected account">{accounts.selectedAccountId ?? "none"}</output>
      <button
        type="button"
        onClick={() => void accounts.selectAccount("account/2")}
      >
        select
      </button>
    </>
  );
}

function PartialSelectionHarness({
  onSelected,
}: {
  onSelected: (result: AccountSelectionResult) => void;
}) {
  const accounts = useAccounts();
  return (
    <div>
      <span data-testid="selected-account">{accounts.selectedAccountId ?? "none"}</span>
      <button
        type="button"
        onClick={() => void accounts.selectAccount("account-b").then(onSelected)}
      >
        select partial
      </button>
    </div>
  );
}

describe("useAccounts Codex fingerprint mode", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("sends the account-scoped session opt-in request", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = String(input);
      if (url === "/auth/accounts?quota=true") {
        return new Response(JSON.stringify({ accounts: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (url === "/auth/accounts/account%2F1/codex-fingerprint" && init?.method === "PATCH") {
        return new Response(JSON.stringify({ success: true, mode: "session" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "unexpected request" }), { status: 500 });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<AccountFingerprintHarness />);
    fireEvent.click(screen.getByRole("button", { name: "enable" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/auth/accounts/account%2F1/codex-fingerprint",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "session" }),
        },
      );
    });
  });
});

describe("useAccounts manual selection", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("posts the selected account and reloads account state", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = String(input);
      if (url === "/auth/accounts/account%2F2/select" && init?.method === "POST") {
        return new Response(JSON.stringify({
          selected_account_id: "account/2",
          proxy_selected: true,
          codex_synced: true,
          restart_codex_required: true,
          codex_auth_path: "C:\\Users\\test\\.codex\\auth.json",
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (url === "/auth/accounts?quota=true") {
        return new Response(JSON.stringify({
          accounts: [],
          selected_account_id: "account/2",
          manual_mode: true,
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (url === "/auth/fallback-upstream/status") {
        return new Response(JSON.stringify({ active: false }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "unexpected request" }), { status: 500 });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<AccountSelectionHarness />);
    fireEvent.click(screen.getByRole("button", { name: "select" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/auth/accounts/account%2F2/select",
        { method: "POST" },
      );
      expect(screen.getByLabelText("selected account").textContent).toBe("account/2");
    });
  });

  it("keeps the proxy account selected when Codex auth synchronization fails", async () => {
    let selected = false;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = String(input);
      if (url === "/auth/accounts/account-b/select" && init?.method === "POST") {
        selected = true;
        return new Response(JSON.stringify({
          selected_account_id: "account-b",
          proxy_selected: true,
          codex_synced: false,
          restart_codex_required: false,
          codex_auth_path: "C:\\Users\\test\\.codex\\auth.json",
          warning: "Could not write auth.json",
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (url === "/auth/accounts?quota=true") {
        return new Response(JSON.stringify({
          accounts: [],
          selected_account_id: selected ? "account-b" : null,
          manual_mode: true,
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (url === "/auth/fallback-upstream/status") {
        return new Response(JSON.stringify({ active: false }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "unexpected request" }), { status: 500 });
    });
    vi.stubGlobal("fetch", fetchMock);

    let resolveResult!: (result: AccountSelectionResult) => void;
    const resultPromise = new Promise<AccountSelectionResult>((resolve) => {
      resolveResult = resolve;
    });
    render(<PartialSelectionHarness onSelected={resolveResult} />);
    fireEvent.click(screen.getByRole("button", { name: "select partial" }));

    const result = await resultPromise;
    expect(result.proxySelected).toBe(true);
    expect(result.codexSynced).toBe(false);
    expect(result.warning).toMatch(/auth\.json/i);
    await waitFor(() => {
      expect(screen.getByTestId("selected-account").textContent).toBe("account-b");
    });
  });
});
