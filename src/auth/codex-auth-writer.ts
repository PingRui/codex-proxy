import {
  chmodSync,
  closeSync,
  copyFileSync,
  existsSync,
  fsyncSync,
  mkdirSync,
  openSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import { homedir } from "os";
import { dirname, resolve } from "path";
import { randomBytes } from "crypto";
import type { AccountEntry } from "./types.js";

export interface CodexAuthWriteResult {
  ok: boolean;
  path: string;
  error?: string;
}

export interface CodexAuthWriterOptions {
  codexHome?: string;
}

export function getCodexAuthPath(codexHome?: string): string {
  const configuredHome = codexHome?.trim() || process.env.CODEX_HOME?.trim();
  return resolve(configuredHome || resolve(homedir(), ".codex"), "auth.json");
}

export function writeCodexAuth(
  entry: AccountEntry,
  options?: CodexAuthWriterOptions,
): CodexAuthWriteResult {
  const authPath = getCodexAuthPath(options?.codexHome);
  const idToken = entry.idToken?.trim();
  const refreshToken = entry.refreshToken?.trim();
  const accountId = entry.accountId?.trim();

  if (!idToken) return { ok: false, path: authPath, error: "Selected account has no ID token; reauthorize it first." };
  if (!refreshToken) return { ok: false, path: authPath, error: "Selected account has no refresh token; reauthorize it first." };
  if (!accountId) return { ok: false, path: authPath, error: "Selected account has no account ID; reauthorize it first." };

  const document = {
    auth_mode: "chatgpt",
    OPENAI_API_KEY: null,
    tokens: {
      id_token: idToken,
      access_token: entry.token,
      refresh_token: refreshToken,
      account_id: accountId,
    },
    last_refresh: entry.lastRefresh?.trim() || new Date().toISOString(),
  };
  const tempPath = `${authPath}.tmp-${process.pid}-${randomBytes(6).toString("hex")}`;
  const backupPath = `${authPath}.bak`;

  try {
    mkdirSync(dirname(authPath), { recursive: true });
    if (existsSync(authPath)) {
      copyFileSync(authPath, backupPath);
      applyUserOnlyPermissions(backupPath);
    }

    const fd = openSync(tempPath, "wx", 0o600);
    try {
      writeFileSync(fd, `${JSON.stringify(document, null, 2)}\n`, "utf8");
      fsyncSync(fd);
    } finally {
      closeSync(fd);
    }
    renameSync(tempPath, authPath);
    applyUserOnlyPermissions(authPath);
    return { ok: true, path: authPath };
  } catch (error) {
    try {
      if (existsSync(tempPath)) unlinkSync(tempPath);
    } catch {
      // Best-effort cleanup; preserve the original write failure.
    }
    return {
      ok: false,
      path: authPath,
      error: error instanceof Error ? error.message : "Failed to update Codex authentication.",
    };
  }
}

function applyUserOnlyPermissions(path: string): void {
  try {
    chmodSync(path, 0o600);
  } catch {
    // Windows ACLs are inherited from the user profile directory. chmod is
    // best-effort here and effective on platforms that support POSIX modes.
  }
}
