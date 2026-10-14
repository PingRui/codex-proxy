/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/preact";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LocalCodexAccount } from "./LocalCodexAccount";
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
describe("independent local Codex control", () => {
  it("reads the real file status and calls only the separate Codex switch", async () => {
    const fetchMock = vi.fn(async (url: string) => new Response(JSON.stringify({ status: "chatgpt", email: url.includes("select-codex") ? "new@example.com" : "local@example.com", accountId: "workspace" })));
    vi.stubGlobal("fetch", fetchMock);
    render(<LocalCodexAccount accounts={[{ id: "a/b", email: "new@example.com", status: "active" }]} />);
    await screen.findByText("local@example.com");
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "a/b" } });
    fireEvent.click(screen.getByRole("button", { name: "Write Codex login" }));
    await screen.findByText(/Login file updated/);
    expect(fetchMock).toHaveBeenCalledWith("/auth/accounts/a%2Fb/select-codex", { method: "POST" });
    expect(fetchMock.mock.calls.some(([url]) => url.endsWith("/select"))).toBe(false);
  });
  it("shows read failures without substituting a proxy account", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: "Read failed" }), { status: 503 })));
    render(<LocalCodexAccount accounts={[{ id: "proxy", email: "proxy@example.com", status: "active" }]} />);
    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Read failed"));
    expect(screen.queryByText("proxy@example.com", { selector: "p" })).toBeNull();
    expect(screen.queryByText(/Login file updated/)).toBeNull();
  });
  it("preserves the displayed identity on write failure", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => url.endsWith("select-codex")
      ? new Response(JSON.stringify({ error: "Access denied" }), { status: 409 })
      : new Response(JSON.stringify({ status: "chatgpt", email: "local@example.com", accountId: "local" }))));
    render(<LocalCodexAccount accounts={[{ id: "new", email: "new@example.com", status: "active" }]} />);
    await screen.findByText("local@example.com");
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "new" } });
    fireEvent.click(screen.getByRole("button", { name: "Write Codex login" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Access denied"));
    expect(screen.getByText("local@example.com")).toBeTruthy();
    expect(screen.queryByText(/Login file updated/)).toBeNull();
  });
});
