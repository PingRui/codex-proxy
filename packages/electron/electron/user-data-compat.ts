import { readdirSync, statSync } from "fs";
import { join } from "path";

const LEGACY_USER_DATA_RELATIVE_PATHS: readonly (readonly string[])[] = [
  // Historical package name `@codex-proxy/electron` becomes nested folders.
  ["@codex-proxy", "electron"],
  // Older packaged builds may have used their visible product name.
  ["Codex Proxy"],
  ["codex-proxy"],
];

/** Return true only when the gateway's application data directory is populated. */
export function hasGatewayData(userDataPath: string): boolean {
  const dataDir = join(userDataPath, "data");
  try {
    return statSync(dataDir).isDirectory() && readdirSync(dataDir).length > 0;
  } catch {
    return false;
  }
}

export interface CompatibleUserDataOptions {
  appDataPath: string;
  currentUserDataPath: string;
  hasData?: (userDataPath: string) => boolean;
}

/**
 * Choose a user-data directory without copying, deleting, or overwriting data.
 *
 * A populated current/NEXORA directory always wins. On the first NEXORA run,
 * an empty new directory falls back to a populated legacy directory so saved
 * accounts, selection state, API keys, and history remain available.
 */
export function resolveCompatibleUserDataPath({
  appDataPath,
  currentUserDataPath,
  hasData = hasGatewayData,
}: CompatibleUserDataOptions): string {
  if (hasData(currentUserDataPath)) return currentUserDataPath;

  const nexoraPath = join(appDataPath, "NEXORA");
  if (nexoraPath !== currentUserDataPath && hasData(nexoraPath)) {
    return nexoraPath;
  }

  for (const relativeParts of LEGACY_USER_DATA_RELATIVE_PATHS) {
    const legacyPath = join(appDataPath, ...relativeParts);
    if (legacyPath !== currentUserDataPath && hasData(legacyPath)) {
      return legacyPath;
    }
  }

  return currentUserDataPath;
}
