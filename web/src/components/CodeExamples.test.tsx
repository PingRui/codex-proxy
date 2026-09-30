/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/preact";
import { afterEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "../../../shared/i18n/context";
import { CodeExamples } from "./CodeExamples";

vi.mock("../../../shared/utils/clipboard", () => ({ clipboardCopy: vi.fn(async () => false) }));
afterEach(cleanup);

describe("CodeExamples", () => {
  it("reports failed copying instead of claiming success", async () => {
    render(<I18nProvider><CodeExamples baseUrl="http://127.0.0.1:8080/v1" apiKey="test-key" model="gpt-5" reasoningEffort="medium" serviceTier={null} /></I18nProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Copy cURL" }));
    await waitFor(() => expect(screen.getByRole("status")).toBeTruthy());
    expect(screen.queryByText("Copied!")).toBeNull();
    fireEvent.keyDown(screen.getByRole("tab", { name: "Image Generation" }), { key: "Home" });
    expect(screen.getByRole("tab", { name: "Chat Completions" }).getAttribute("aria-selected")).toBe("true");
  });
});
