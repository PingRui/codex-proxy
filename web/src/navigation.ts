import type { TranslationKey } from "../../shared/i18n/translations";

export type IconName = "home" | "users" | "key" | "api" | "route" | "chart" | "document" | "alert" | "info" | "settings";

export interface NavItem {
  hash: string;
  label: TranslationKey;
  icon: IconName;
}

export const NAV_ITEMS: NavItem[] = [
  { hash: "", label: "overview", icon: "home" },
  { hash: "#/accounts", label: "accountsNav", icon: "users" },
  { hash: "#/api", label: "apiAccess", icon: "api" },
  { hash: "#/activity", label: "activity", icon: "document" },
  { hash: "#/settings", label: "settings", icon: "settings" },
  { hash: "#/about", label: "about", icon: "info" },
];

export const LEGACY_HASH_REDIRECTS: Readonly<Record<string, string>> = {
  "#/account-management": "#/accounts",
  "#/info": "#/api",
  "#/logs": "#/activity",
  "#/proxy-settings": "#/proxies",
};

const APP_ROUTE_HASHES = new Set([
  ...NAV_ITEMS.map((item) => item.hash),
  "#/client-keys",
  "#/api-keys",
  "#/proxies",
  "#/usage-stats",
  "#/errors",
]);

export function resolveAppRouteHash(hash: string): string {
  const normalizedHash = hash === "#/" ? "" : hash;
  const requestedHash = LEGACY_HASH_REDIRECTS[normalizedHash] ?? normalizedHash;
  return APP_ROUTE_HASHES.has(requestedHash) ? requestedHash : "";
}
