import { existsSync } from "fs";
import { join } from "path";

export interface DesktopIconPathOptions {
  isPackaged: boolean;
  appPath: string;
  moduleDir: string;
  platform: NodeJS.Platform;
  exists?: (path: string) => boolean;
}

/** Resolve the bundled NEXORA icon used explicitly by BrowserWindow and Tray. */
export function resolveDesktopIconPath({
  isPackaged,
  appPath,
  moduleDir,
  platform,
  exists = existsSync,
}: DesktopIconPathOptions): string {
  const baseDir = isPackaged
    ? join(appPath, "electron", "assets")
    : join(moduleDir, "..", "electron", "assets");

  if (platform === "win32") {
    const icoPath = join(baseDir, "icon.ico");
    if (exists(icoPath)) return icoPath;
  }

  const pngPath = join(baseDir, "icon.png");
  return exists(pngPath) ? pngPath : "";
}
