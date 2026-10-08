export interface DesktopUpdateStatus {
  supported: boolean;
  currentVersion: string;
  checking: boolean;
  checked: boolean;
  updateAvailable: boolean;
  downloading: boolean;
  downloaded: boolean;
  installing: boolean;
  progress: number;
  version: string | null;
  releaseUrl: string | null;
  error: string | null;
}

export interface DesktopUpdateBridge {
  status(): Promise<DesktopUpdateStatus>;
  check(): Promise<DesktopUpdateStatus>;
  download(): Promise<DesktopUpdateStatus>;
  install(): Promise<DesktopUpdateStatus>;
}

export const UPDATE_CHANNELS = {
  status: "nexora:update:status", check: "nexora:update:check",
  download: "nexora:update:download", install: "nexora:update:install",
} as const;

declare global {
  interface Window { nexoraUpdates?: DesktopUpdateBridge; }
}

export function getDesktopUpdateBridge(): DesktopUpdateBridge | undefined {
  return typeof window === "undefined" ? undefined : window.nexoraUpdates;
}
