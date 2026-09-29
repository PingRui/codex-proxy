/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/preact";
import { afterEach, describe, expect, it } from "vitest";
import { I18nProvider } from "../../../../shared/i18n/context";
import { AboutPage } from "../AboutPage";

afterEach(() => cleanup());

describe("AboutPage", () => {
  it("shows NEXORA identity, source, version, and retained legal terms", () => {
    render(<I18nProvider><AboutPage version="2.1.8" commit="abc123" /></I18nProvider>);

    expect(screen.getByText("NEXORA · 星枢")).toBeTruthy();
    expect(screen.getByText(/independent modified distribution/i)).toBeTruthy();
    expect(screen.getByText(/non-commercial licence/i)).toBeTruthy();
    expect(screen.getByText("2.1.8")).toBeTruthy();
    expect(screen.getByText("abc123")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Source repository" }).getAttribute("href")).toBe("https://github.com/PingRui/codex-proxy");
    expect(screen.getByRole("link", { name: "NOTICE" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Third-party notices" })).toBeTruthy();
  });
});
