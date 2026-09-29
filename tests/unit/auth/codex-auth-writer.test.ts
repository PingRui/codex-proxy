import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "fs";
import { tmpdir } from "os";
import { resolve } from "path";
import { writeCodexAuth } from "@src/auth/codex-auth-writer.js";
import type { AccountEntry } from "@src/auth/types.js";

let codexHome: string;

function makeEntry(overrides: Partial<AccountEntry> = {}): AccountEntry {
  return {
    id: "entry-1",
    token: "access-token",
    refreshToken: "refresh-token",
    idToken: "id-token",
    lastRefresh: "2026-09-29T08:00:00.000Z",
    email: "user@example.com",
    accountId: "acct-123",
    userId: "user-123",
    label: null,
    planType: "plus",
    proxyApiKey: "proxy-key",
    status: "active",
    usage: {
      request_count: 0,
      input_tokens: 0,
      output_tokens: 0,
      empty_response_count: 0,
      last_used: null,
    },
    addedAt: "2026-09-29T08:00:00.000Z",
    cachedQuota: null,
    quotaFetchedAt: null,
    ...overrides,
  };
}

describe("writeCodexAuth", () => {
  beforeEach(() => {
    codexHome = mkdtempSync(resolve(tmpdir(), "codex-auth-writer-"));
  });

  afterEach(() => {
    rmSync(codexHome, { recursive: true, force: true });
  });

  it("writes a standard Codex auth snapshot and keeps one backup", () => {
    const authPath = resolve(codexHome, "auth.json");
    writeFileSync(authPath, "{\"previous\":true}\n", "utf8");

    const result = writeCodexAuth(makeEntry(), { codexHome });

    expect(result).toEqual({ ok: true, path: authPath });
    expect(JSON.parse(readFileSync(authPath, "utf8"))).toEqual({
      auth_mode: "chatgpt",
      OPENAI_API_KEY: null,
      tokens: {
        id_token: "id-token",
        access_token: "access-token",
        refresh_token: "refresh-token",
        account_id: "acct-123",
      },
      last_refresh: "2026-09-29T08:00:00.000Z",
    });
    expect(readFileSync(`${authPath}.bak`, "utf8")).toBe("{\"previous\":true}\n");
  });

  it("refuses incomplete credentials without replacing the existing file", () => {
    const authPath = resolve(codexHome, "auth.json");
    writeFileSync(authPath, "keep-me", "utf8");

    const result = writeCodexAuth(makeEntry({ idToken: null }), { codexHome });

    expect(result.ok).toBe(false);
    expect(result.error).toContain("ID token");
    expect(readFileSync(authPath, "utf8")).toBe("keep-me");
    expect(existsSync(`${authPath}.bak`)).toBe(false);
  });
});
