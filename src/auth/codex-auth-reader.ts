import { readFileSync } from "fs";
import { getCodexAuthPath } from "./codex-auth-writer.js";
import { extractCodexTokenMetadata } from "./token-metadata.js";

export interface LocalCodexStatus {
  status: "chatgpt" | "api_key" | "missing" | "unreadable";
  email: string | null;
  accountId: string | null;
  userId: string | null;
}

/** File identity only: never return credentials or infer a running client's session. */
export function readLocalCodexStatus(codexHome?: string): LocalCodexStatus {
  const empty = { email: null, accountId: null, userId: null };
  try {
    const doc = JSON.parse(readFileSync(getCodexAuthPath(codexHome), "utf8"));
    if (!doc || typeof doc !== "object" || Array.isArray(doc)) return { status: "unreadable", ...empty };
    if (doc.auth_mode === "apikey" || (typeof doc.OPENAI_API_KEY === "string" && doc.OPENAI_API_KEY)) {
      return { status: "api_key", ...empty };
    }
    const tokens = doc.tokens;
    if (!tokens || typeof tokens.access_token !== "string" || !tokens.access_token) {
      return { status: "unreadable", ...empty };
    }
    const metadata = extractCodexTokenMetadata(tokens.access_token, typeof tokens.id_token === "string" ? tokens.id_token : null);
    return {
      status: "chatgpt",
      email: metadata.email,
      accountId: typeof tokens.account_id === "string" ? tokens.account_id : metadata.accountId,
      userId: metadata.userId,
    };
  } catch (error) {
    return { status: (error as NodeJS.ErrnoException).code === "ENOENT" ? "missing" : "unreadable", ...empty };
  }
}
