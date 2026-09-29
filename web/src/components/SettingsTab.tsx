import { useI18n, useT } from "../../../shared/i18n/context";
import type { LangCode } from "../../../shared/i18n/translations";
import { useTheme } from "../../../shared/theme/context";
import { GeneralSettings } from "./GeneralSettings";
import { LogsSettings } from "./LogsSettings";
import { ModelAliasSettings } from "./ModelAliasSettings";
import { OllamaBridgeSettings } from "./OllamaBridgeSettings";
import { QuotaSettings } from "./QuotaSettings";
import { RotationSettings } from "./RotationSettings";
import { SettingsPanel } from "./SettingsPanel";

interface SettingsTabProps {
  models: string[];
}

const LANGUAGES: Array<{ id: LangCode; label: string }> = [
  { id: "en", label: "English" },
  { id: "zh", label: "简体中文" },
  { id: "zh-TW", label: "繁體中文（台灣）" },
  { id: "zh-HK", label: "繁體中文（香港）" },
  { id: "ja", label: "日本語" },
];

export function SettingsTab({ models }: SettingsTabProps) {
  const t = useT();
  const { lang, setLang } = useI18n();
  const { isDark, toggle } = useTheme();

  const desktopRows = [
    { label: t("startup"), value: t("startupManual") },
    { label: t("updates"), value: t("updatesToolbarHint") },
    { label: t("codexAuthPath"), value: "~/.codex/auth.json" },
    { label: t("dataLocation"), value: "data/" },
  ];

  return (
    <div class="flex flex-col gap-6">
      <section class="border border-nx-border bg-surface">
        <div class="border-b border-nx-border px-5 py-4">
          <h2 class="text-base font-semibold text-ink">{t("appearanceAndLanguage")}</h2>
          <p class="mt-1 text-xs text-muted">{t("appearanceAndLanguageHint")}</p>
        </div>
        <div class="grid gap-px bg-nx-border sm:grid-cols-2">
          <div class="bg-surface px-5 py-4">
            <div class="text-xs font-medium text-muted">{t("appearance")}</div>
            <button type="button" onClick={toggle} class="mt-2 border border-nx-border bg-canvas px-3 py-2 text-sm font-medium text-ink hover:border-accent">
              {isDark ? t("darkTheme") : t("lightTheme")}
            </button>
          </div>
          <label class="bg-surface px-5 py-4">
            <span class="text-xs font-medium text-muted">{t("language")}</span>
            <select value={lang} onChange={(event) => setLang(event.currentTarget.value as LangCode)} class="mt-2 block w-full border border-nx-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-accent">
              {LANGUAGES.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
            </select>
          </label>
        </div>
      </section>

      <section class="border border-nx-border bg-surface">
        <div class="border-b border-nx-border px-5 py-4">
          <h2 class="text-base font-semibold text-ink">{t("desktopRuntime")}</h2>
          <p class="mt-1 text-xs text-muted">{t("desktopRuntimeHint")}</p>
        </div>
        <dl class="divide-y divide-nx-border px-5">
          {desktopRows.map((row) => (
            <div key={row.label} class="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
              <dt class="text-sm font-medium text-ink">{row.label}</dt>
              <dd class="font-mono text-xs text-muted">{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <details class="border-y border-nx-border py-4">
        <summary class="cursor-pointer list-none text-sm font-semibold text-ink marker:hidden">
          {t("advanced")}
          <span class="ml-3 text-xs font-normal text-muted">{t("advancedSettingsHint")}</span>
        </summary>
        <div class="mt-5 flex flex-col gap-5">
          <nav aria-label={t("advanced")} class="grid gap-px border border-nx-border bg-nx-border sm:grid-cols-3">
            <a href="#/api-keys" class="bg-surface px-4 py-3 text-sm font-medium text-ink hover:text-accent">{t("providerApiKeys")}</a>
            <a href="#/proxies" class="bg-surface px-4 py-3 text-sm font-medium text-ink hover:text-accent">{t("proxyPool")}</a>
            <a href="#/client-keys" class="bg-surface px-4 py-3 text-sm font-medium text-ink hover:text-accent">{t("clientKeys")}</a>
          </nav>
          <SettingsPanel />
          <GeneralSettings />
          <ModelAliasSettings models={models} />
          <QuotaSettings />
          <RotationSettings />
          <LogsSettings />
          <OllamaBridgeSettings />
        </div>
      </details>
    </div>
  );
}
