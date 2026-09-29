/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/preact";
import { useState } from "preact/hooks";
import { I18nProvider } from "../../../shared/i18n/context";
import { AppShell } from "./AppShell";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

vi.mock("../../../shared/theme/context", () => ({
  useTheme: () => ({ isDark: false, toggle: vi.fn() }),
}));

afterEach(() => {
  cleanup();
});

function renderWithI18n(node: preact.ComponentChildren) {
  return render(<I18nProvider>{node}</I18nProvider>);
}

describe("compact workspace accessibility", () => {
  it("removes the mobile drawer from the accessibility tree while closed", () => {
    renderWithI18n(<Sidebar activeHash="" mobileOpen={false} />);

    expect(document.getElementById("mobile-navigation-drawer")).toBeNull();
    expect(screen.queryByRole("dialog", { name: "Primary navigation" })).toBeNull();
    expect(screen.getAllByRole("navigation", { name: "Primary navigation" })).toHaveLength(1);
  });

  it("focuses and traps the open mobile drawer, then closes on Escape", async () => {
    const onClose = vi.fn();
    renderWithI18n(<Sidebar activeHash="" mobileOpen onMobileClose={onClose} />);

    const drawer = screen.getByRole("dialog", { name: "Primary navigation" });
    const controls = Array.from(drawer.querySelectorAll<HTMLElement>("button, a[href]"));

    await waitFor(() => expect(document.activeElement).toBe(controls[0]));

    controls.at(-1)?.focus();
    fireEvent.keyDown(window, { key: "Tab" });
    expect(document.activeElement).toBe(controls[0]);

    controls[0].focus();
    fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(controls.at(-1));

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("returns focus to the mobile navigation trigger after closing", async () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <AppShell
          activeHash=""
          unreadErrors={0}
          onOpenSidebar={() => setOpen(true)}
          mobileSidebarOpen={open}
          onCloseSidebar={() => setOpen(false)}
        >
          <p>Content</p>
        </AppShell>
      );
    }

    renderWithI18n(<Harness />);
    const trigger = screen.getByRole("button", { name: "Open navigation" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(trigger);
    await screen.findByRole("dialog", { name: "Primary navigation" });
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    fireEvent.keyDown(window, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Primary navigation" })).toBeNull();
      expect(trigger.getAttribute("aria-expanded")).toBe("false");
      expect(document.activeElement).toBe(trigger);
    });
  });

  it("keeps Add Account named and exposes low-priority controls through compact actions", () => {
    renderWithI18n(
      <Header
        onAddAccount={vi.fn()}
        onCheckUpdate={vi.fn()}
        checking={false}
        updateStatusMsg={null}
        updateStatusColor=""
        version={null}
        onLogout={vi.fn()}
      />,
    );

    const addAccount = screen.getByRole("button", { name: "Add Account" });
    expect(addAccount.getAttribute("aria-label")).toBe("Add Account");
    expect(addAccount.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");

    const more = screen.getByRole("button", { name: "More actions" });
    expect(more.className).toContain("sm:hidden");
    fireEvent.click(more);

    const compactActions = document.getElementById(more.getAttribute("aria-controls") ?? "");
    expect(compactActions).not.toBeNull();
    expect(compactActions?.className).toContain("sm:flex");
    expect(within(compactActions as HTMLElement).getByRole("button", { name: /check for updates/i })).toBeTruthy();
    expect(within(compactActions as HTMLElement).getByLabelText("Language")).toBeTruthy();
    expect(within(compactActions as HTMLElement).getByRole("button", { name: /logout/i })).toBeTruthy();
  });
});
