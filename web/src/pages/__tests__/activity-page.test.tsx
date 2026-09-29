/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/preact";
import { afterEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "../../../../shared/i18n/context";
import { ActivityPage } from "../ActivityPage";

vi.mock("../LogsPage", () => ({ LogsPage: () => <div>requests-view</div> }));
vi.mock("../ErrorsPage", () => ({ ErrorsPage: () => <div>errors-view</div> }));
vi.mock("../UsageStats", () => ({ UsageStats: () => <div>usage-view</div> }));

afterEach(() => cleanup());

describe("ActivityPage", () => {
  it("switches between existing operational views and keeps unread errors visible", () => {
    render(<I18nProvider><ActivityPage initialTab="requests" unreadErrors={4} /></I18nProvider>);

    expect(screen.getByText("requests-view")).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Errors 4/ })).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: /Errors 4/ }));
    expect(screen.getByText("errors-view")).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "Usage" }));
    expect(screen.getByText("usage-view")).toBeTruthy();
  });
});
