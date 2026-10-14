import type { AccountPool } from "../auth/account-pool.js";
import {
  writeCodexAuth,
  type CodexAuthWriteResult,
} from "../auth/codex-auth-writer.js";
import { hasReachedCachedQuota } from "../auth/quota-skip.js";

export interface AccountSelectionResult {
  selectedAccountId: string;
  proxySelected: true;
  codexSynced: boolean;
  restartCodexRequired: boolean;
  codexAuthPath: string;
  warning?: string;
}

export type AccountSelectionFailure =
  | "not_found"
  | "unavailable"
  | "persistence_unavailable";

export class AccountSelectionError extends Error {
  constructor(
    public readonly reason: AccountSelectionFailure,
    message: string,
  ) {
    super(message);
    this.name = "AccountSelectionError";
  }
}

export class AccountSelectionService {
  constructor(
    private readonly pool: AccountPool,
    private readonly writer: (entry: NonNullable<ReturnType<AccountPool["getEntry"]>>) => CodexAuthWriteResult = writeCodexAuth,
  ) {}

  select(entryId: string): AccountSelectionResult {
    if (this.pool.isPersistDisabled()) {
      throw new AccountSelectionError(
        "persistence_unavailable",
        "Account persistence is unavailable; restore it and restart the app before switching accounts.",
      );
    }

    const entry = this.pool.getEntry(entryId);
    if (!entry) {
      throw new AccountSelectionError("not_found", "Account not found.");
    }
    if (entry.status !== "active" || hasReachedCachedQuota(entry)) {
      throw new AccountSelectionError(
        "unavailable",
        `Account is ${entry.status === "active" ? "quota exhausted" : entry.status} and cannot be selected.`,
      );
    }
    if (!this.pool.selectAccount(entryId)) {
      throw new AccountSelectionError("unavailable", "Account cannot be selected in its current state.");
    }

    return {
      selectedAccountId: entryId,
      proxySelected: true,
      codexSynced: false,
      restartCodexRequired: false,
      codexAuthPath: "",
    };
  }

  selectCodex(entryId: string): CodexAuthWriteResult {
    const entry = this.pool.getEntry(entryId);
    if (!entry) throw new AccountSelectionError("not_found", "Account not found.");
    if (entry.status !== "active") {
      throw new AccountSelectionError("unavailable", "Reauthorize this account before using it in Codex.");
    }
    return this.writer(entry);
  }

}
