/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/preact";
import { I18nProvider } from "../../../shared/i18n/context";
import type { DesktopUpdateStatus } from "../../../shared/desktop-updates";
import { DesktopUpdateControl } from "./DesktopUpdateControl";

const initial: DesktopUpdateStatus = { supported: true, currentVersion: "2.1.9", checked: false, checking: false, updateAvailable: false, downloading: false, downloaded: false, installing: false, progress: 0, version: null, releaseUrl: null, error: null };
beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value() { this.open = true; } });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value() { this.open = false; } });
});
afterEach(cleanup);
function setup(next: Partial<DesktopUpdateStatus> = {}) {
  const state = { ...initial, ...next };
  const bridge = { status: vi.fn(async () => state), check: vi.fn(async () => Object.assign(state, { checked: true })), download: vi.fn(async () => Object.assign(state, { downloading: true, progress: 32, error: null })), install: vi.fn(async () => Object.assign(state, { installing: true })) };
  render(<I18nProvider initialLang="en"><DesktopUpdateControl bridge={bridge} /></I18nProvider>);
  return bridge;
}
describe("desktop update controls", () => {
  it("checks in-app and reports no update only after a successful check", async () => {
    const bridge = setup();
    await waitFor(() => expect(bridge.status).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "Check for Updates" }));
    await waitFor(() => expect(bridge.check).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Up to date"));
    expect(bridge.install).not.toHaveBeenCalled();
  });
  it("downloads with progress and does not offer restart early", async () => {
    const bridge = setup({ updateAvailable: true, version: "2.2.0" });
    await waitFor(() => expect(screen.getByRole("button", { name: "Update Available" })).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Update Available" }));
    fireEvent.click(screen.getByRole("button", { name: "Download update" }));
    await waitFor(() => expect(screen.getByRole("progressbar").getAttribute("value")).toBe("32"));
    expect(screen.queryByRole("button", { name: "Restart to update" })).toBeNull();
    expect(bridge.install).not.toHaveBeenCalled();
  });
  it("only installs a ready update on explicit click", async () => {
    const bridge = setup({ downloaded: true, updateAvailable: true, version: "2.2.0" });
    await waitFor(() => expect(screen.getByRole("button", { name: "Restart to update" })).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Restart to update" }));
    expect(bridge.install).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole("button", { name: "Restart to update" })[1]);
    await waitFor(() => expect(bridge.install).toHaveBeenCalledTimes(1));
  });
  it("shows native download errors and permits a retry", async () => {
    const bridge = setup({ updateAvailable: true, version: "2.2.0", error: "Network timeout" });
    await waitFor(() => expect(screen.getByRole("button", { name: "Update Available" })).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Update Available" }));
    expect(screen.getByRole("alert").textContent).toContain("Network timeout");
    expect(screen.getByRole("button", { name: "Download update" })).toHaveProperty("disabled", false);
    fireEvent.click(screen.getByRole("button", { name: "Download update" }));
    await waitFor(() => expect(bridge.download).toHaveBeenCalledTimes(1));
  });
});
