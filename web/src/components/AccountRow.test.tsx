/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/preact";
import { afterEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "../../../shared/i18n/context";
import type { Account } from "../../../shared/types";
import { AccountRow } from "./AccountRow";

vi.mock("./AccountCard", () => ({ AccountCard: () => <div>Detailed maintenance controls</div> }));
afterEach(() => cleanup());
const account: Account = { id: "one", email: "one@example.com", status: "active", planType: "Plus" };
const base = { account, index: 0, onDelete: vi.fn(async () => null) };

describe("AccountRow", () => {
  it("keeps unknown quota honest and mounts maintenance only on demand", () => {
    render(<I18nProvider><AccountRow {...base} /></I18nProvider>);
    expect(screen.getByText("Quota not reported")).toBeTruthy();
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(screen.queryByText("Detailed maintenance controls")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Account details: one@example.com" }));
    expect(screen.getByText("Detailed maintenance controls")).toBeTruthy();
  });
  it("blocks selection when a secondary quota is exhausted", () => {
    const select = vi.fn();
    render(<I18nProvider><AccountRow {...base} account={{ ...account, quota: { secondary_rate_limit: { limit_reached: true } } }} onSelectAccount={select} /></I18nProvider>);
    const button = screen.getByRole("button", { name: "Use as gateway account" });
    expect(button).toHaveProperty("disabled", true);
    fireEvent.click(button);
    expect(select).not.toHaveBeenCalled();
  });
  it("reports selection failure inline and allows retry", async () => {
    const select = vi.fn(async () => { throw new Error("Unavailable"); });
    render(<I18nProvider><AccountRow {...base} onSelectAccount={select} /></I18nProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Use as gateway account" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Unavailable"));
    expect(screen.getByRole("button", { name: "Use as gateway account" })).toHaveProperty("disabled", false);
  });
});
