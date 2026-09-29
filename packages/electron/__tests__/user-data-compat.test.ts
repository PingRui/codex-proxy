import { afterEach, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  hasGatewayData,
  resolveCompatibleUserDataPath,
} from "../electron/user-data-compat.js";

const scratchDirs: string[] = [];

function makeAppDataRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "nexora-user-data-"));
  scratchDirs.push(root);
  return root;
}

function seedGatewayData(userDataPath: string, fileName = "accounts.sqlite"): void {
  const dataDir = join(userDataPath, "data");
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(join(dataDir, fileName), "test-data", "utf8");
}

describe("NEXORA user-data compatibility", () => {
  afterEach(() => {
    for (const root of scratchDirs.splice(0)) {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("keeps a populated current NEXORA directory without copying or overwriting it", () => {
    const appDataPath = makeAppDataRoot();
    const currentUserDataPath = join(appDataPath, "NEXORA");
    const legacyUserDataPath = join(appDataPath, "@codex-proxy", "electron");
    seedGatewayData(currentUserDataPath, "accounts.sqlite");
    seedGatewayData(legacyUserDataPath, "accounts.json");

    expect(resolveCompatibleUserDataPath({ appDataPath, currentUserDataPath }))
      .toBe(currentUserDataPath);
    expect(hasGatewayData(currentUserDataPath)).toBe(true);
    expect(hasGatewayData(legacyUserDataPath)).toBe(true);
  });

  it("reuses the scoped legacy Electron directory when the new directory has no gateway data", () => {
    const appDataPath = makeAppDataRoot();
    const currentUserDataPath = join(appDataPath, "NEXORA");
    const legacyUserDataPath = join(appDataPath, "@codex-proxy", "electron");
    mkdirSync(currentUserDataPath, { recursive: true });
    seedGatewayData(legacyUserDataPath);

    expect(resolveCompatibleUserDataPath({ appDataPath, currentUserDataPath }))
      .toBe(legacyUserDataPath);
  });

  it("recognizes the historical product-name directory", () => {
    const appDataPath = makeAppDataRoot();
    const currentUserDataPath = join(appDataPath, "NEXORA");
    const legacyUserDataPath = join(appDataPath, "Codex Proxy");
    seedGatewayData(legacyUserDataPath, "usage-history.json");

    expect(resolveCompatibleUserDataPath({ appDataPath, currentUserDataPath }))
      .toBe(legacyUserDataPath);
  });

  it("uses the current path for a clean installation", () => {
    const appDataPath = makeAppDataRoot();
    const currentUserDataPath = join(appDataPath, "NEXORA");

    expect(resolveCompatibleUserDataPath({ appDataPath, currentUserDataPath }))
      .toBe(currentUserDataPath);
  });
});
