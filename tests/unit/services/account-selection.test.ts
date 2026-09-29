import { describe, expect, it, vi } from "vitest";
import "@helpers/account-pool-setup.js";
import { createMemoryPersistence } from "@helpers/account-pool-factory.js";
import { createValidJwt } from "@helpers/jwt.js";
import { AccountPool } from "@src/auth/account-pool.js";
import {
  AccountSelectionError,
  AccountSelectionService,
} from "@src/services/account-selection.js";

function makePool(): AccountPool {
  return new AccountPool({
    persistence: createMemoryPersistence(),
    routingMode: "manual",
    rotationStrategy: "least_used",
    initialToken: null,
    rateLimitBackoffSeconds: 60,
  });
}

describe("AccountSelectionService", () => {
  it("selects the proxy account and reports a successful Codex sync", () => {
    const pool = makePool();
    const id = pool.addOAuthAccount({
      accessToken: createValidJwt({ accountId: "acct-selected" }),
      refreshToken: "refresh-token",
      idToken: "id-token",
      lastRefresh: "2026-09-29T08:00:00.000Z",
    });
    const writer = vi.fn(() => ({ ok: true, path: "C:\\Users\\test\\.codex\\auth.json" }));

    const result = new AccountSelectionService(pool, writer).select(id);

    expect(pool.getSelectedAccountId()).toBe(id);
    expect(result).toMatchObject({
      selectedAccountId: id,
      proxySelected: true,
      codexSynced: true,
      restartCodexRequired: true,
    });
    expect(writer).toHaveBeenCalledOnce();
  });

  it("keeps the proxy selection and reports partial success when Codex sync fails", () => {
    const pool = makePool();
    const id = pool.addOAuthAccount({
      accessToken: createValidJwt({ accountId: "acct-partial" }),
      refreshToken: "refresh-token",
      idToken: "id-token",
    });
    const writer = vi.fn(() => ({
      ok: false,
      path: "C:\\Users\\test\\.codex\\auth.json",
      error: "Access denied",
    }));

    const result = new AccountSelectionService(pool, writer).select(id);

    expect(pool.getSelectedAccountId()).toBe(id);
    expect(result.codexSynced).toBe(false);
    expect(result.restartCodexRequired).toBe(false);
    expect(result.warning).toBe("Access denied");
  });

  it("rejects an unknown account", () => {
    const pool = makePool();
    const service = new AccountSelectionService(pool, vi.fn());

    expect(() => service.select("missing")).toThrowError(AccountSelectionError);
    expect(pool.getSelectedAccountId()).toBeNull();
  });
});
