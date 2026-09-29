/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from "vitest";
import { getLayoutMode, migrateLegacyLayoutMode, saveLayoutMode } from "./layout-preferences";

describe("workspace layout preference migration", () => {
  beforeEach(() => localStorage.clear());

  it.each(["top", "tabs"])("migrates the legacy %s layout to sidebar", (legacyMode) => {
    localStorage.setItem("codex-proxy-layout-mode", legacyMode);
    migrateLegacyLayoutMode();
    expect(localStorage.getItem("codex-proxy-layout-mode")).toBe("sidebar");
    expect(getLayoutMode()).toBe("sidebar");
  });

  it("keeps the normal workspace in sidebar mode", () => {
    saveLayoutMode("top");
    expect(getLayoutMode()).toBe("sidebar");
  });
});
