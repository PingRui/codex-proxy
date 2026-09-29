/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/preact";
import { afterEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "../../../shared/i18n/context";
import { SettingsTab } from "./SettingsTab";

vi.mock("../../../shared/theme/context", () => ({ useTheme: () => ({ isDark: true, toggle: vi.fn() }) }));
vi.mock("./GeneralSettings", () => ({ GeneralSettings: () => <div>general-settings</div> }));
vi.mock("./LogsSettings", () => ({ LogsSettings: () => <div>logs-settings</div> }));
vi.mock("./ModelAliasSettings", () => ({ ModelAliasSettings: () => <div>model-settings</div> }));
vi.mock("./OllamaBridgeSettings", () => ({ OllamaBridgeSettings: () => <div>ollama-settings</div> }));
vi.mock("./QuotaSettings", () => ({ QuotaSettings: () => <div>quota-settings</div> }));
vi.mock("./RotationSettings", () => ({ RotationSettings: () => <div>rotation-settings</div> }));
vi.mock("./SettingsPanel", () => ({ SettingsPanel: () => <div>api-key-settings</div> }));

afterEach(() => cleanup());

describe("SettingsTab", () => {
  it("keeps everyday desktop preferences visible and technical controls collapsed", () => {
    render(<I18nProvider><SettingsTab models={["gpt-5.4"]} /></I18nProvider>);

    expect(screen.getByText("Appearance and language")).toBeTruthy();
    expect(screen.getByText("Startup")).toBeTruthy();
    expect(screen.getByText("Codex auth path")).toBeTruthy();
    expect(screen.getByText("Data location")).toBeTruthy();
    const advanced = screen.getByText("Advanced").closest("details");
    expect(advanced?.open).toBe(false);
    expect(screen.getByRole("link", { name: "Provider API keys", hidden: true }).getAttribute("href")).toBe("#/api-keys");
    expect(screen.getByRole("link", { name: "Proxy Pool", hidden: true }).getAttribute("href")).toBe("#/proxies");
    expect(screen.getByRole("link", { name: "Client Keys", hidden: true }).getAttribute("href")).toBe("#/client-keys");
  });
});
