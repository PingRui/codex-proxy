import { describe, expect, it, vi } from "vitest";
import { join } from "path";
import { resolveDesktopIconPath } from "../electron/icon-path.js";

describe("resolveDesktopIconPath", () => {
  it("uses the packaged NEXORA ICO for Windows runtime surfaces", () => {
    const appPath = join("C:\\apps", "NEXORA", "resources", "app.asar");
    const expected = join(appPath, "electron", "assets", "icon.ico");
    const exists = vi.fn((path: string) => path === expected);

    expect(resolveDesktopIconPath({
      isPackaged: true,
      appPath,
      moduleDir: "unused",
      platform: "win32",
      exists,
    })).toBe(expected);
  });

  it("uses the bundled PNG for non-Windows runtime surfaces", () => {
    const moduleDir = join("repo", "packages", "electron", "dist-electron");
    const expected = join(moduleDir, "..", "electron", "assets", "icon.png");

    expect(resolveDesktopIconPath({
      isPackaged: false,
      appPath: "unused",
      moduleDir,
      platform: "linux",
      exists: (path) => path === expected,
    })).toBe(expected);
  });

  it("falls back to PNG when the Windows ICO is unavailable", () => {
    const appPath = join("C:\\apps", "NEXORA", "resources", "app.asar");
    const expected = join(appPath, "electron", "assets", "icon.png");

    expect(resolveDesktopIconPath({
      isPackaged: true,
      appPath,
      moduleDir: "unused",
      platform: "win32",
      exists: (path) => path === expected,
    })).toBe(expected);
  });
});
