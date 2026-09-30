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
const responsiveControlClass = "relative inline-flex h-10 w-full shrink-0 items-center gap-3 rounded-lg border border-transparent px-3 text-xs font-medium text-muted transition-colors hover:border-nx-border hover:bg-canvas hover:text-ink disabled:cursor-not-allowed disabled:opacity-45 sm:size-9 sm:justify-center sm:p-0";

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
  simplified?: boolean;
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
  simplified = false,
}: HeaderProps) {
  const { lang, setLang, t } = useI18n();
  const { isDark, toggle: toggleTheme } = useTheme();
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const langButtonRef = useRef<HTMLButtonElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!langMenuOpen && !moreMenuOpen) return;
    const handleMouseDown = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false);
        setMoreMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (langMenuOpen) {
        setLangMenuOpen(false);
        langButtonRef.current?.focus();
      } else if (moreMenuOpen) {
        setMoreMenuOpen(false);
        moreButtonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [langMenuOpen, moreMenuOpen]);

  const runUpdateAction = () => {
    setMoreMenuOpen(false);
    if (hasUpdate && onOpenUpdateModal) onOpenUpdateModal();
    else onCheckUpdate();
  };

  if (simplified) return (
    <div class="flex items-center gap-2">
      {unreadErrors > 0 && <a href="#/errors" class="nx-button text-danger" aria-label={`${unreadErrors} ${t("errorsBadge")}`}>{t("errorsBadge")} {unreadErrors}</a>}
      <button type="button" class="nx-button" disabled={checking} onClick={runUpdateAction} title={updateStatusMsg ?? undefined}>{checking ? t("checkingUpdates") : hasUpdate ? t("updateAvailable") : t("checkForUpdates")}</button>
      {onLogout && <button type="button" class="nx-button" onClick={onLogout}>{t("dashboardLogout")}</button>}
    </div>
  );

  return (
    <div class="flex min-w-0 items-center justify-end gap-1">
      {unreadErrors > 0 && (
        <a href="#/errors" class={controlClass} title={t("errorsBadgeTooltip")} aria-label={`${unreadErrors} ${t("errorsBadge")}`}>
          <svg aria-hidden="true" class="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 9v3.75m0 3h.008v.008H12V15.75ZM10.29 3.86 2.82 17.11a1.875 1.875 0 0 0 1.63 2.81h15.1a1.875 1.875 0 0 0 1.63-2.81L13.71 3.86a1.95 1.95 0 0 0-3.42 0Z" />
          </svg>
          <span class="absolute -right-1 -top-1 min-w-4 rounded-full bg-danger px-1 text-center text-[9px] font-bold leading-4 text-white">
            {unreadErrors > 99 ? "99+" : unreadErrors}
          </span>
        </a>
      )}

      <div ref={actionMenuRef} class="relative">
        <button
          ref={moreButtonRef}
          type="button"
          onClick={() => setMoreMenuOpen((open) => !open)}
          class={`${controlClass} sm:hidden`}
          aria-label={t("moreActions")}
          aria-expanded={moreMenuOpen}
          aria-controls="compact-header-actions"
        >
          <svg aria-hidden="true" class="size-[18px]" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="19" cy="12" r="1.5" />
          </svg>
        </button>

        <div
          id="compact-header-actions"
          class={`${moreMenuOpen ? "absolute right-0 top-11 z-50 flex" : "hidden"} w-56 flex-col gap-1 rounded-xl border border-nx-border bg-surface-raised p-2 shadow-xl sm:static sm:flex sm:w-auto sm:flex-row sm:items-center sm:gap-1 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none`}
        >
          <button
            type="button"
            onClick={runUpdateAction}
            disabled={checking}
            class={responsiveControlClass}
            title={updateStatusMsg ?? (checking ? t("checkingUpdates") : t("checkForUpdates"))}
            aria-label={checking ? t("checkingUpdates") : t("checkForUpdates")}
          >
            <svg aria-hidden="true" class={`size-[18px] ${checking ? "animate-spin" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 5v4h4M4 13a8.1 8.1 0 0 0 15.5 2M20 19v-4h-4" />
            </svg>
            <span class="sm:hidden">{checking ? t("checkingUpdates") : t("checkForUpdates")}</span>
            {hasUpdate && <span class="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-accent" />}
          </button>

          <div class="relative w-full sm:w-auto">
            <button
              ref={langButtonRef}
              type="button"
              onClick={() => setLangMenuOpen((open) => !open)}
              class={`${responsiveControlClass} text-[11px] font-semibold`}
              aria-label={t("language")}
              aria-expanded={langMenuOpen}
            >
              <span class="text-xs font-medium sm:hidden">{t("language")}</span>
              <span class="ml-auto sm:ml-0">{LANG_OPTIONS.find((option) => option.id === lang)?.short ?? "EN"}</span>
            </button>
            {langMenuOpen && (
              <div class="absolute right-0 top-11 z-[60] w-full overflow-hidden rounded-lg border border-nx-border bg-surface-raised py-1 shadow-xl sm:w-44">
                {LANG_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option.id}
                    onClick={() => {
                      setLang(option.id);
                      setLangMenuOpen(false);
                      setMoreMenuOpen(false);
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

          <button
            type="button"
            onClick={() => {
              setMoreMenuOpen(false);
              toggleTheme();
            }}
            class={responsiveControlClass}
            title={t("toggleTheme")}
            aria-label={t("toggleTheme")}
          >
            {isDark ? (
              <svg aria-hidden="true" class="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">
                <path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.64 5.64l1.42 1.42m9.88 9.88 1.42 1.42M18.36 5.64l-1.42 1.42M7.06 16.94l-1.42 1.42" />
                <circle cx="12" cy="12" r="3.5" />
              </svg>
            ) : (
              <svg aria-hidden="true" class="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.4 14.2A8.5 8.5 0 0 1 9.8 3.6 8.5 8.5 0 1 0 20.4 14.2Z" />
              </svg>
            )}
            <span class="sm:hidden">{t("toggleTheme")}</span>
          </button>

          {onLogout && (
            <button
              type="button"
              onClick={() => {
                setMoreMenuOpen(false);
                onLogout();
              }}
              class={responsiveControlClass}
              title={t("dashboardLogout")}
              aria-label={t("dashboardLogout")}
            >
              <svg aria-hidden="true" class="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 8V5H5v14h9v-3M10 12h11m-3-3 3 3-3 3" />
              </svg>
              <span class="sm:hidden">{t("dashboardLogout")}</span>
            </button>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onAddAccount}
        class="ml-1 inline-flex h-9 shrink-0 items-center gap-2 rounded-lg bg-accent-strong px-3 text-xs font-semibold text-white transition-colors hover:bg-accent sm:px-3.5"
        aria-label={t("addAccount")}
      >
        <svg aria-hidden="true" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span class="hidden sm:inline">{t("addAccount")}</span>
      </button>
    </div>
  );
}
