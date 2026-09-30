/** @vitest-environment jsdom */
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen, within } from "@testing-library/preact";
import { I18nProvider } from "../../shared/i18n/context";
import { Sidebar } from "./components/Sidebar";
import { LEGACY_HASH_REDIRECTS, resolveAppRouteHash } from "./navigation";

afterEach(() => {
  cleanup();
});

describe("NEXORA workspace shell", () => {
  it("separates the four workflow destinations from utilities without promotion", () => {
    render(
      <I18nProvider>
        <Sidebar activeHash="" />
      </I18nProvider>,
    );

    expect(screen.getAllByText("NEXORA").length).toBeGreaterThan(0);
    const navigation = screen.getAllByRole("navigation", { name: "Primary navigation" })[0];
    const links = within(navigation).getAllByRole("link");

    expect(links.map((link) => link.textContent?.trim())).toEqual([
      "Overview",
      "Accounts",
      "API Access",
      "Activity",
    ]);
    const utilities = screen.getAllByRole("navigation", { name: "Utility navigation" })[0];
    expect(within(utilities).getAllByRole("link").map((link) => link.textContent?.trim())).toEqual(["Settings", "About"]);
    expect(screen.queryByText(/Star on GitHub/i)).toBeNull();
  });

  it("keeps legacy links pointed at the simplified destinations", () => {
    expect(LEGACY_HASH_REDIRECTS).toMatchObject({
      "#/info": "#/api",
      "#/logs": "#/activity",
      "#/account-management": "#/accounts",
    });
  });

  it("normalizes unknown hashes to Overview", () => {
    expect(resolveAppRouteHash("#/unknown-page")).toBe("");
    expect(resolveAppRouteHash("#/accounts")).toBe("#/accounts");
  });
});
