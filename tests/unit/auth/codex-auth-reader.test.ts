import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { resolve } from "path";
import { readLocalCodexStatus } from "@src/auth/codex-auth-reader.js";

let home: string;
beforeEach(() => { home = mkdtempSync(resolve(tmpdir(), "nexora-reader-")); });
afterEach(() => { rmSync(home, { recursive: true, force: true }); });
const jwt = (claims: object) => `header.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.sig`;
describe("local Codex file identity", () => {
  it("distinguishes missing and malformed files", () => {
    expect(readLocalCodexStatus(home).status).toBe("missing");
    writeFileSync(resolve(home, "auth.json"), "broken");
    expect(readLocalCodexStatus(home).status).toBe("unreadable");
  });
  it("returns identity without returning any tokens", () => {
    writeFileSync(resolve(home, "auth.json"), JSON.stringify({ tokens: {
      access_token: jwt({ "https://api.openai.com/auth": { chatgpt_user_id: "user" } }),
      id_token: jwt({ email: "local@example.com" }), account_id: "workspace", refresh_token: "secret",
    } }));
    expect(readLocalCodexStatus(home)).toEqual({ status: "chatgpt", email: "local@example.com", accountId: "workspace", userId: "user" });
    expect(JSON.stringify(readLocalCodexStatus(home))).not.toContain("secret");
  });
  it("does not expose API keys", () => {
    writeFileSync(resolve(home, "auth.json"), JSON.stringify({ OPENAI_API_KEY: "secret" }));
    expect(readLocalCodexStatus(home)).toEqual({ status: "api_key", email: null, accountId: null, userId: null });
  });
});
