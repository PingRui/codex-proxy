import { describe, expect, it } from "vitest";
import type { Account } from "../../../shared/types";
import { deriveGatewayState } from "./gateway-state";

function active(id: string): Account {
  return {
    id,
    email: `${id}@example.com`,
    status: "active",
  };
}

function expired(id: string): Account {
  return {
    ...active(id),
    status: "expired",
  };
}

describe("deriveGatewayState", () => {
  it.each([
    { accounts: [], selected: null, kind: "unconfigured", action: "add" },
    { accounts: [active("a")], selected: null, kind: "attention", action: "select" },
    { accounts: [active("a")], selected: "a", kind: "ready", action: "switch" },
    { accounts: [expired("a")], selected: "a", kind: "blocked", action: "reauthorize" },
  ])("derives $kind gateway state", ({ accounts, selected, kind, action }) => {
    expect(deriveGatewayState(accounts, selected)).toMatchObject({ kind, action });
  });

  it("treats a selected account with exhausted quota as blocked", () => {
    const account = active("a");
    account.quota = { rate_limit: { limit_reached: true } };

    expect(deriveGatewayState([account], "a")).toMatchObject({
      kind: "blocked",
      account,
      action: "reauthorize",
    });
  });

  it("requires a new selection when the persisted account is no longer available", () => {
    expect(deriveGatewayState([active("a")], "missing")).toMatchObject({
      kind: "attention",
      account: null,
      action: "select",
    });
  });
});
