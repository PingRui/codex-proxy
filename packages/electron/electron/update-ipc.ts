import { ipcMain, type BrowserWindow, type IpcMainInvokeEvent } from "electron";
import { UPDATE_CHANNELS, type DesktopUpdateStatus } from "../../../shared/desktop-updates.js";

interface UpdateIpcOptions {
  getWindow: () => BrowserWindow | null;
  getOrigin: () => string;
  status: () => DesktopUpdateStatus;
  check: () => Promise<void>;
  download: () => Promise<void>;
  install: () => Promise<void>;
}

export function isTrustedUpdateSender(event: IpcMainInvokeEvent, window: BrowserWindow | null, origin: string): boolean {
  if (!window || window.isDestroyed() || !event.senderFrame || event.sender !== window.webContents || event.senderFrame !== window.webContents.mainFrame) return false;
  try { return new URL(event.senderFrame.url).origin === origin; }
  catch { return false; }
}

export function registerUpdateIpc(options: UpdateIpcOptions): void {
  for (const action of ["status", "check", "download", "install"] as const) {
    ipcMain.handle(UPDATE_CHANNELS[action], async (event) => {
      if (!isTrustedUpdateSender(event, options.getWindow(), options.getOrigin())) throw new Error("Untrusted update request");
      const state = options.status();
      if (action !== "status") {
        if (!state.supported) throw new Error("In-app updates are unavailable in this build");
        if (action === "install" && (!state.downloaded || state.downloading || state.checking)) throw new Error("The update has not finished downloading");
        if (action === "download" && !state.updateAvailable) throw new Error("No update is available");
        await options[action]();
      }
      return options.status();
    });
  }
}
