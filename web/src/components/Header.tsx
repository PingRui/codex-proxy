import { useEffect, useRef, useState } from "preact/hooks";
import { useI18n } from "../../../shared/i18n/context";
import { type LangCode } from "../../../shared/i18n/translations";
import { useTheme } from "../../../shared/theme/context";

const LANG_OPTIONS: { id: LangCode; label: string; short: string }[] = [
  { id: "en", label: "English", short: "EN" },
  { id: "zh", label: "简体中文", short: "简" },
  { id: "zh-TW", label: "繁體中文（台灣）", short: "繁" },
  { id: "zh-HK", label: "繁體中文（香港）", short: "繁" },
  { id: "ja", label: "日本語", short: "日" },
];

const controlClass = "relative inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-transparent text-muted transition-colors hover:border-nx-border hover:bg-surface-raised hover:text-ink disabled:cursor-not-allowed disabled:opacity-45";

export interface HeaderProps {
  onAddAccount: () => void;
  onCheckUpdate: () => void;
  onOpenUpdateModal?: () => void;
  checking: boolean;
  updateStatusMsg: string | null;
  updateStatusColor: string;
  version: string | null;
  commit?: string | null;
  hasUpdate?: boolean;
  onLogout?: () => void;
  unreadErrors?: number;
}

export function Header({
  onAddAccount,
  onCheckUpdate,
  onOpenUpdateModal,
  checking,
  updateStatusMsg,
  hasUpdate,
  onLogout,
  unreadErrors = 0,
}: HeaderProps) {
  const { lang, setLang, t } = useI18n();
  const { isDark, toggle: toggleTheme } = useTheme();
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!langMenuOpen) return;
    const handler = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [langMenuOpen]);

  return (
    <div class="flex min-w-0 items-center justify-end gap-1">
      {unreadErrors > 0 && (
        <a href="#/errors" class={controlClass} title={t("errorsBadgeTooltip")} aria-label={`${unreadErrors} ${t("errorsBadge")}`}>
          <svg class="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 9v3.75m0 3h.008v.008H12V15.75ZM10.29 3.86 2.82 17.11a1.875 1.875 0 0 0 1.63 2.81h15.1a1.875 1.875 0 0 0 1.63-2.81L13.71 3.86a1.95 1.95 0 0 0-3.42 0Z" />
          </svg>
          <span class="absolute -right-1 -top-1 min-w-4 rounded-full bg-danger px-1 text-center text-[9px] font-bold leading-4 text-white">
            {unreadErrors > 99 ? "99+" : unreadErrors}
          </span>
        </a>
      )}

      <button
        type="button"
        onClick={hasUpdate && onOpenUpdateModal ? onOpenUpdateModal : onCheckUpdate}
        disabled={checking}
        class={controlClass}
        title={updateStatusMsg ?? (checking ? t("checkingUpdates") : t("checkForUpdates"))}
        aria-label={checking ? t("checkingUpdates") : t("checkForUpdates")}
      >
        <svg class={`size-[18px] ${checking ? "animate-spin" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 5v4h4M4 13a8.1 8.1 0 0 0 15.5 2M20 19v-4h-4" />
        </svg>
        {hasUpdate && <span class="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-accent" />}
      </button>

      <div ref={langMenuRef} class="relative">
        <button
          type="button"
          onClick={() => setLangMenuOpen((open) => !open)}
          class={`${controlClass} text-[11px] font-semibold`}
          aria-label={t("language")}
          aria-expanded={langMenuOpen}
        >
          {LANG_OPTIONS.find((option) => option.id === lang)?.short ?? "EN"}
        </button>
        {langMenuOpen && (
          <div class="absolute right-0 top-11 z-50 w-44 overflow-hidden rounded-lg border border-nx-border bg-surface-raised py-1 shadow-xl">
            {LANG_OPTIONS.map((option) => (
              <button
                type="button"
                key={option.id}
                onClick={() => {
                  setLang(option.id);
                  setLangMenuOpen(false);
                }}
                class={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors ${lang === option.id ? "bg-accent/10 text-accent" : "text-ink hover:bg-canvas"}`}
              >
                {option.label}
                {lang === option.id && <span aria-hidden="true">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <button type="button" onClick={toggleTheme} class={controlClass} title={t("toggleTheme")} aria-label={t("toggleTheme")}>
        {isDark ? (
          <svg class="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">
            <path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.64 5.64l1.42 1.42m9.88 9.88 1.42 1.42M18.36 5.64l-1.42 1.42M7.06 16.94l-1.42 1.42" />
            <circle cx="12" cy="12" r="3.5" />
          </svg>
        ) : (
          <svg class="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.4 14.2A8.5 8.5 0 0 1 9.8 3.6 8.5 8.5 0 1 0 20.4 14.2Z" />
          </svg>
        )}
      </button>

      {onLogout && (
        <button type="button" onClick={onLogout} class={controlClass} title={t("dashboardLogout")} aria-label={t("dashboardLogout")}>
          <svg class="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 8V5H5v14h9v-3M10 12h11m-3-3 3 3-3 3" />
          </svg>
        </button>
      )}

      <button
        type="button"
        onClick={onAddAccount}
        class="ml-1 inline-flex h-9 shrink-0 items-center gap-2 rounded-lg bg-accent-strong px-3 text-xs font-semibold text-white transition-colors hover:bg-accent sm:px-3.5"
      >
        <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span class="hidden sm:inline">{t("addAccount")}</span>
      </button>
    </div>
  );
}
