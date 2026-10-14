import { beforeEach, describe, expect, it, vi } from "vitest";
import "@helpers/account-pool-setup.js";
import { createMemoryPersistence } from "@helpers/account-pool-factory.js";
import { createValidJwt } from "@helpers/jwt.js";
import { AccountPool } from "@src/auth/account-pool.js";
import { createAccountRoutes } from "@src/routes/accounts.js";
import { writeCodexAuth } from "@src/auth/codex-auth-writer.js";

vi.mock("@src/auth/codex-auth-writer.js", () => ({ writeCodexAuth: vi.fn(() => ({ ok: true, path: "fixture" })) }));
vi.mock("@src/auth/codex-auth-reader.js", () => ({ readLocalCodexStatus: vi.fn(() => ({ status: "chatgpt", email: "local@example.com", accountId: "local", userId: "user" })) }));

beforeEach(() => vi.clearAllMocks());
describe("separate account selection endpoints", () => {
  function setup() {
    const pool = new AccountPool({ persistence: createMemoryPersistence(), routingMode: "manual", initialToken: null, rotationStrategy: "least_used", rateLimitBackoffSeconds: 60 });
    const a = pool.addOAuthAccount({ accessToken: createValidJwt({ accountId: "a" }), refreshToken: "ra", idToken: "ia" });
    const b = pool.addOAuthAccount({ accessToken: createValidJwt({ accountId: "b" }), refreshToken: "rb", idToken: "ib" });
    const app = createAccountRoutes(pool, { clearOne: vi.fn(), scheduleOne: vi.fn() } as never);
    return { pool, a, b, app };
  }
  it("selects a proxy without writing the local login and reads local identity independently", async () => {
    const { app, a, pool } = setup();
    const res = await app.request(`/auth/accounts/${a}/select`, { method: "POST" });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ proxy_selected: true, codex_synced: false, restart_codex_required: false });
    expect(pool.getSelectedAccountId()).toBe(a);
    expect(writeCodexAuth).not.toHaveBeenCalled();
    expect(await (await app.request("/auth/codex/status")).json()).toMatchObject({ email: "local@example.com" });
  });
  it("writes a different Codex login without changing the proxy and rejects write errors", async () => {
    const { app, a, b, pool } = setup();
    pool.selectAccount(a);
    const res = await app.request(`/auth/accounts/${b}/select-codex`, { method: "POST" });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ restartCodexRequired: true });
    expect(pool.getSelectedAccountId()).toBe(a);
    vi.mocked(writeCodexAuth).mockReturnValueOnce({ ok: false, path: "fixture", error: "Access denied" });
    expect((await app.request(`/auth/accounts/${b}/select-codex`, { method: "POST" })).status).toBe(409);
    expect(pool.getSelectedAccountId()).toBe(a);
  });
  it("rejects an unknown local selection", async () => {
    const { app } = setup();
    expect((await app.request("/auth/accounts/missing/select-codex", { method: "POST" })).status).toBe(404);
    expect(writeCodexAuth).not.toHaveBeenCalled();
  });
});
