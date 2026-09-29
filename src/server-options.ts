export interface ListenHostOptions {
  host?: string;
  manualAccountMode?: boolean;
}

/**
 * Resolve the address used by the HTTP server.
 *
 * Desktop manual-account mode is intentionally loopback-only. Other launch
 * modes retain the existing local.yaml precedence rules.
 */
export function resolveListenHost(
  configuredHost: string,
  hasConfiguredOverride: boolean,
  options?: ListenHostOptions,
): string {
  if (options?.manualAccountMode === true) {
    return options.host ?? "127.0.0.1";
  }

  if (hasConfiguredOverride) return configuredHost;
  return options?.host ?? configuredHost;
}
