import { describe, it, expect, vi, beforeEach } from "vitest";
import { UPDATE_CHANNELS, type DesktopUpdateStatus } from "../../../shared/desktop-updates.js";
import type { BrowserWindow } from "electron";
const handlers = vi.hoisted(() => new Map<string, (event: unknown) => Promise<unknown>>());
vi.mock("electron", () => ({ ipcMain: { handle: (channel: string, handler: (event: unknown) => Promise<unknown>) => handlers.set(channel, handler) } }));
import { registerUpdateIpc } from "../electron/update-ipc.js";

describe("update IPC boundary", () => {
  const frame = { url: "http://127.0.0.1:8080/" };
  const contents = { mainFrame: frame };
  const window = { isDestroyed: () => false, webContents: contents };
  const state: DesktopUpdateStatus = { supported: true, currentVersion: "2.1.9", checked: false, downloaded: false, updateAvailable: false, checking: false, downloading: false, installing: false, progress: 0, version: null, releaseUrl: null, error: null };
  const check = vi.fn(async () => {});
  const download = vi.fn(async () => {});
  const install = vi.fn(async () => {});
  const event = () => ({ sender: contents, senderFrame: frame });
  beforeEach(() => {
    vi.clearAllMocks(); handlers.clear(); frame.url = "http://127.0.0.1:8080/";
    Object.assign(state, { supported: true, downloaded: false, updateAvailable: false });
    registerUpdateIpc({ getWindow: () => window as unknown as BrowserWindow, getOrigin: () => "http://127.0.0.1:8080", status: () => state, check, download, install });
  });
  it("only accepts the desktop main frame on the exact origin", async () => {
    await handlers.get(UPDATE_CHANNELS.check)!(event());
    expect(check).toHaveBeenCalledTimes(1);
    await expect(handlers.get(UPDATE_CHANNELS.check)!({ sender: {}, senderFrame: frame })).rejects.toThrow("Untrusted");
    await expect(handlers.get(UPDATE_CHANNELS.check)!({ sender: contents, senderFrame: { ...frame } })).rejects.toThrow("Untrusted");
    frame.url = "http://127.0.0.1:9999/";
    await expect(handlers.get(UPDATE_CHANNELS.status)!(event())).rejects.toThrow("Untrusted");
    frame.url = "https://example.com/";
    await expect(handlers.get(UPDATE_CHANNELS.install)!(event())).rejects.toThrow("Untrusted");
    expect(check).toHaveBeenCalledTimes(1);
  });
  it("rejects installing before download and commands in unsupported builds", async () => {
    await expect(handlers.get(UPDATE_CHANNELS.install)!(event())).rejects.toThrow("not finished");
    await expect(handlers.get(UPDATE_CHANNELS.download)!(event())).rejects.toThrow("No update");
    state.supported = false;
    await expect(handlers.get(UPDATE_CHANNELS.check)!(event())).rejects.toThrow("unavailable");
    expect(install).not.toHaveBeenCalled();
  });
  it("routes explicit install of a downloaded update", async () => {
    state.downloaded = true;
    await handlers.get(UPDATE_CHANNELS.install)!(event());
    expect(install).toHaveBeenCalledTimes(1);
  });
});
