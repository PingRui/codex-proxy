/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/preact";
import { afterEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "../../../shared/i18n/context";
import { AddAccount } from "./AddAccount";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("AddAccount browser authorization flow", () => {
  it("presents copy, browser, and automatic detection as the primary three steps", async () => {
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const open = vi.spyOn(window, "open");

    render(
      <I18nProvider>
        <AddAccount
          visible
          onCancel={vi.fn()}
          onSubmitRelay={vi.fn(async () => undefined)}
          onAddByRefreshToken={vi.fn(async () => null)}
          addInfo=""
          addError=""
          authUrl="https://auth.example.test/authorize"
          fallbackConfigured={false}
          onAddFallbackUpstream={vi.fn(async () => null)}
        />
      </I18nProvider>,
    );

    expect(screen.getByText("Copy the authorization link")).toBeTruthy();
    expect(screen.getByText("Complete sign-in in your browser")).toBeTruthy();
    expect(screen.getByText("Return here; NEXORA detects the account automatically")).toBeTruthy();
    expect(screen.getByText("Recovery").closest("details")?.open).toBe(false);
    expect(screen.getByText("Advanced").closest("details")?.open).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(writeText).toHaveBeenCalledWith("https://auth.example.test/authorize");
    expect(open).not.toHaveBeenCalled();
  });
});
