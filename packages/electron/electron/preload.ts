import { contextBridge, ipcRenderer } from "electron";
import { UPDATE_CHANNELS, type DesktopUpdateBridge } from "../../../shared/desktop-updates.js";

const updates: DesktopUpdateBridge = {
  status: () => ipcRenderer.invoke(UPDATE_CHANNELS.status),
  check: () => ipcRenderer.invoke(UPDATE_CHANNELS.check),
  download: () => ipcRenderer.invoke(UPDATE_CHANNELS.download),
  install: () => ipcRenderer.invoke(UPDATE_CHANNELS.install),
};
contextBridge.exposeInMainWorld("nexoraUpdates", updates);
