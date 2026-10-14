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
  it("selects the proxy account without writing Codex login", () => {
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
      codexSynced: false,
      restartCodexRequired: false,
    });
    expect(writer).not.toHaveBeenCalled();
  });

  it("writes Codex independently and preserves proxy selection on write failure", () => {
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

    const result = new AccountSelectionService(pool, writer).selectCodex(id);

    expect(pool.getSelectedAccountId()).toBeNull();
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Access denied");
  });

  it("preserves a different proxy account when writing the Codex login", () => {
    const pool = makePool();
    const a = pool.addOAuthAccount({ accessToken: createValidJwt({ accountId: "a" }), refreshToken: "ra", idToken: "ia" });
    const b = pool.addOAuthAccount({ accessToken: createValidJwt({ accountId: "b" }), refreshToken: "rb", idToken: "ib" });
    pool.selectAccount(a);
    const writer = vi.fn(() => ({ ok: true, path: "fixture" }));
    expect(new AccountSelectionService(pool, writer).selectCodex(b).ok).toBe(true);
    expect(pool.getSelectedAccountId()).toBe(a);
    expect(writer).toHaveBeenCalledWith(pool.getEntry(b));
  });

  it("rejects an unknown account", () => {
    const pool = makePool();
    const service = new AccountSelectionService(pool, vi.fn());

    expect(() => service.select("missing")).toThrowError(AccountSelectionError);
    expect(pool.getSelectedAccountId()).toBeNull();
  });
});
