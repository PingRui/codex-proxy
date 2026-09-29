import type { TranslationKey } from "../../../shared/i18n/translations";
import type { Account } from "../../../shared/types";
import { derivedStatus } from "./accountStatus";

export type GatewayStateKind = "unconfigured" | "ready" | "attention" | "blocked";
export type GatewayAction = "add" | "select" | "reauthorize" | "switch" | null;

export interface GatewayState {
  kind: GatewayStateKind;
  account: Account | null;
  titleKey: TranslationKey;
  action: GatewayAction;
}

const gatewayTitleKeys = {
  noAccounts: "gatewayNoAccounts" as TranslationKey,
  selectAccount: "gatewaySelectAccount" as TranslationKey,
  accountBlocked: "gatewayAccountBlocked" as TranslationKey,
  ready: "gatewayReady" as TranslationKey,
};

/**
 * Derive the desktop gateway's user-facing readiness from persisted accounts
 * and the one explicitly selected source account.
 */
export function deriveGatewayState(
  accounts: Account[],
  selectedAccountId: string | null,
): GatewayState {
  if (accounts.length === 0) {
    return {
      kind: "unconfigured",
      account: null,
      titleKey: gatewayTitleKeys.noAccounts,
      action: "add",
    };
  }

  const account = accounts.find((entry) => entry.id === selectedAccountId) ?? null;
  if (!account) {
    return {
      kind: "attention",
      account: null,
      titleKey: gatewayTitleKeys.selectAccount,
      action: "select",
    };
  }

  if (derivedStatus(account) !== "active") {
    return {
      kind: "blocked",
      account,
      titleKey: gatewayTitleKeys.accountBlocked,
      action: "reauthorize",
    };
  }

  return {
    kind: "ready",
    account,
    titleKey: gatewayTitleKeys.ready,
    action: "switch",
  };
}
