import { useEffect } from "preact/hooks";
import { APP_BRAND, APP_DESCRIPTOR } from "../../../shared/brand";
import { useI18n, useT } from "../../../shared/i18n/context";
import { NAV_ITEMS, type IconName } from "../navigation";

const ICONS: Record<IconName, string> = {
  home: "M3 10.5 12 3l9 7.5M5.25 9v10.5h13.5V9M9 19.5v-6h6v6",
  users: "M16.5 19.5v-1.125a3.375 3.375 0 0 0-3.375-3.375h-6.75A3.375 3.375 0 0 0 3 18.375V19.5M9.75 11.25a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5ZM16.5 8.25a3 3 0 0 1 0 5.82M21 19.5v-1.125a3.375 3.375 0 0 0-2.25-3.182",
  key: "M15.75 5.25a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 19.5v-1.125a3.375 3.375 0 0 1 3.375-3.375h6.75A3.375 3.375 0 0 1 18 18.375V19.5M19.5 8.25l1.5 1.5-4.5 4.5-1.5-1.5 4.5-4.5Z",
  api: "M8.25 3.75h7.5M8.25 20.25h7.5M6 6.75h12v10.5H6zM9 9.75h6M9 14.25h3",
  route: "M4.5 6.75h6M13.5 6.75h6M4.5 17.25h6M13.5 17.25h6M10.5 6.75a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0ZM16.5 17.25a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0ZM12 8.25v7.5",
  chart: "M4.5 19.5V9.75M9.75 19.5V4.5M15 19.5v-6.75M20.25 19.5H3.75",
  document: "M6.75 3.75h7.5l3 3v13.5H6.75zM14.25 3.75v3h3M9.75 11.25h4.5M9.75 15h4.5",
  alert: "M12 9v3.75m0 3h.008v.008H12V15.75ZM10.29 3.86 2.82 17.11a1.875 1.875 0 0 0 1.63 2.81h15.1a1.875 1.875 0 0 0 1.63-2.81L13.71 3.86a1.95 1.95 0 0 0-3.42 0Z",
  info: "M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z",
  settings: "M9.594 3.94a1.125 1.125 0 0 1 1.11-.94h2.592a1.125 1.125 0 0 1 1.11.94l.213 1.281c.063.374.313.686.645.87l.22.127c.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992v.255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124l-.22.128c-.331.183-.581.495-.644.869l-.213 1.281a1.125 1.125 0 0 1-1.11.941h-2.594a1.125 1.125 0 0 1-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87l-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991v-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124l.22-.128c.332-.183.582-.495.644-.869l.214-1.28ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
};

function NavIcon({ name }: { name: IconName }) {
  return (
    <svg class="size-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

function BrandMark() {
  return (
    <img src="/icon.png" alt={APP_BRAND} class="size-8 shrink-0 object-contain" />
  );
}

function formatUptime(seconds: number | null): string {
  if (seconds === null) return "...";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function NavigationLinks({ activeHash, onNavigate }: { activeHash: string; onNavigate?: () => void }) {
  const t = useT();
  return (
    <>
      {NAV_ITEMS.map((item) => {
        const isActive = activeHash === item.hash;
        return (
          <a
            key={item.hash}
            href={item.hash || "#/"}
            onClick={onNavigate}
            class={`relative flex w-full items-center gap-3 rounded-md border px-3 py-2 text-[13px] font-medium transition-colors ${
              isActive
                ? "border-nx-border bg-surface text-ink"
                : "border-transparent text-muted hover:bg-surface/70 hover:text-ink"
            }`}
          >
            {isActive && <span class="absolute -left-[1px] top-2 bottom-2 w-0.5 rounded-full bg-accent" />}
            <NavIcon name={item.icon} />
            <span class="truncate">{t(item.label)}</span>
          </a>
        );
      })}
    </>
  );
}

function SidebarPanel({ activeHash, uptimeSeconds, onClose }: { activeHash: string; unreadErrors: number; uptimeSeconds: number | null; onClose?: () => void }) {
  const { t } = useI18n();
  return (
    <>
      <div class="flex h-[72px] shrink-0 items-center gap-3 border-b border-nx-border px-5">
        <BrandMark />
        <div class="min-w-0">
          <div class="text-[15px] font-semibold tracking-[-0.02em] text-ink">{APP_BRAND}</div>
          <div class="mt-0.5 truncate text-[11px] text-muted">{APP_DESCRIPTOR}</div>
        </div>
        {onClose && (
          <button onClick={onClose} class="ml-auto rounded-lg p-2 text-muted hover:bg-surface hover:text-ink" aria-label={t("closeSidebar")}>
            <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        )}
      </div>
      <nav class="flex-1 space-y-1 overflow-y-auto px-3 py-5" aria-label="Primary navigation">
        <NavigationLinks activeHash={activeHash} onNavigate={onClose} />
      </nav>
      <div class="mx-4 mb-4 border-t border-nx-border pt-4">
        <div class="flex items-center gap-2 text-xs font-medium text-ink">
          <span class="size-2 rounded-full bg-success" />
          {t("serverOnline")}
        </div>
        <p class="mt-1 pl-4 text-[11px] text-muted">{t("sidebarUptime")}: {formatUptime(uptimeSeconds)}</p>
      </div>
    </>
  );
}

export function Sidebar({ activeHash, unreadErrors = 0, uptimeSeconds = null, mobileOpen = false, onMobileClose }: { activeHash: string; unreadErrors?: number; uptimeSeconds?: number | null; mobileOpen?: boolean; onMobileClose?: () => void }) {
  const { t } = useI18n();

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onMobileClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, onMobileClose]);

  return (
    <>
      <aside class="fixed inset-y-0 left-0 z-50 hidden w-60 flex-col border-r border-nx-border bg-sidebar lg:flex">
        <SidebarPanel activeHash={activeHash} unreadErrors={unreadErrors} uptimeSeconds={uptimeSeconds} />
      </aside>
      {mobileOpen && <button class="fixed inset-0 z-[55] bg-black/55 lg:hidden" onClick={onMobileClose} aria-label={t("closeSidebar")} />}
      <aside class={`fixed inset-y-0 left-0 z-[60] flex w-60 flex-col border-r border-nx-border bg-sidebar shadow-2xl transition-transform duration-200 lg:hidden ${mobileOpen ? "translate-x-0" : "pointer-events-none -translate-x-full"}`}>
        <SidebarPanel activeHash={activeHash} unreadErrors={unreadErrors} uptimeSeconds={uptimeSeconds} onClose={onMobileClose} />
      </aside>
    </>
  );
}
