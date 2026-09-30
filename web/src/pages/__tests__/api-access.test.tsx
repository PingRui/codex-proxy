/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/preact";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "../../../../shared/i18n/context";
import { ApiAccessPage } from "../ApiAccessPage";

const props = {
  baseUrl: "http://127.0.0.1:10532/v1",
  apiKey: "local-secret-key",
  models: ["gpt-5.4"],
  selectedModel: "gpt-5.4",
  onModelChange: vi.fn(),
  modelFamilies: [],
  selectedEffort: "medium",
  onEffortChange: vi.fn(),
  selectedSpeed: null,
  onSpeedChange: vi.fn(),
};

beforeEach(() => {
  Object.defineProperty(window, "isSecureContext", { configurable: true, value: true });
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: vi.fn(async () => undefined) },
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ApiAccessPage", () => {
  it("keeps the primary workflow focused on the local OpenAI-compatible connection", () => {
    render(<I18nProvider><ApiAccessPage {...props} /></I18nProvider>);

    expect(screen.getByText("OpenAI-compatible connection")).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Chat Completions" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Responses" })).toBeTruthy();
    expect(screen.getByText("/v1/images/generations")).toBeTruthy();
    expect(screen.getByRole("tabpanel").textContent).toContain("gpt-image-2");
    expect(screen.getByRole("tabpanel").textContent).toContain("A cinematic orbital gateway above a blue planet");
    expect(screen.getByRole("tabpanel").textContent).toContain("1024x1024");
    expect(screen.queryByDisplayValue("1024x1024")).toBeNull();
    expect(screen.getByRole("button", { name: /copy curl/i })).toBeTruthy();

    const advanced = screen.getByText("Advanced protocol compatibility").closest("details");
    expect(advanced?.open).toBe(false);
    expect(screen.queryByText("Provider routing")).toBeNull();
  });

  it("masks the local key until reveal while copy actions use the live values", async () => {
    const { container } = render(<I18nProvider><ApiAccessPage {...props} /></I18nProvider>);

    expect(container.textContent).not.toContain("local-secret-key");
    expect((screen.getByLabelText("Local API key") as HTMLInputElement).value).not.toBe("local-secret-key");

    fireEvent.click(screen.getByRole("button", { name: "Copy API key" }));
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith("local-secret-key"));

    fireEvent.click(screen.getByRole("button", { name: "Reveal API key" }));
    expect((screen.getByLabelText("Local API key") as HTMLInputElement).value).toBe("local-secret-key");

    fireEvent.click(screen.getByRole("button", { name: "Copy cURL" }));
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining("http://127.0.0.1:10532/v1/images/generations")));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining("local-secret-key"));
  });
});
