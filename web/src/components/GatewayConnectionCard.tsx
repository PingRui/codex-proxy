import { useT } from "../../../shared/i18n/context";
import type { TranslationKey } from "../../../shared/i18n/translations";
import { CopyButton } from "./CopyButton";

interface GatewayConnectionCardProps {
  baseUrl: string;
  apiKey: string;
  selectedModel: string;
  ready: boolean;
}

function maskSecret(secret: string): string {
  if (secret.length <= 8) return "••••••••";
  return `${secret.slice(0, 3)}••••••••${secret.slice(-4)}`;
}

function hasLoadedValue(value: string): boolean {
  const normalized = value.trim();
  return normalized.length > 0 && normalized !== "Loading...";
}

function isValidBaseUrl(value: string): boolean {
  if (!hasLoadedValue(value)) return false;
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && url.hostname.length > 0;
  } catch {
    return false;
  }
}

interface ConnectionValueProps {
  label: string;
  value: string;
  copyValue: string;
  copyTitle: TranslationKey;
  available: boolean;
}

function ConnectionValue({ label, value, copyValue, copyTitle, available }: ConnectionValueProps) {
  const t = useT();
  return (
    <div class="min-w-0 border-b border-nx-border py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:px-5 sm:first:pl-0 sm:last:border-r-0 sm:last:pr-0">
      <div class="text-xs text-muted">{label}</div>
      <div class="mt-2 flex min-w-0 items-center gap-2">
        <code class="selectable min-w-0 flex-1 truncate text-[13px] font-medium text-ink">
          {available ? value : t("connectionUnavailable")}
        </code>
        <CopyButton
          getText={() => copyValue}
          titleKey={copyTitle}
          disabled={!available}
          class="shrink-0 text-muted hover:bg-canvas hover:text-accent"
        />
      </div>
    </div>
  );
}

export function GatewayConnectionCard({ baseUrl, apiKey, selectedModel, ready }: GatewayConnectionCardProps) {
  const t = useT();
  const baseUrlAvailable = isValidBaseUrl(baseUrl);
  const apiKeyAvailable = hasLoadedValue(apiKey);
  const connectionReady = ready && baseUrlAvailable && apiKeyAvailable;
  const capabilities = [
    { label: t("chatCompletions"), path: "/chat/completions" },
    { label: t("responsesApi"), path: "/responses" },
    { label: t("imageGeneration"), path: "/images/generations" },
  ];

  return (
    <section class="rounded-xl border border-nx-border bg-surface">
      <div class="flex flex-col gap-3 border-b border-nx-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-sm font-semibold text-ink">{t("gatewayConnection")}</h2>
          <p class="mt-1 flex items-center gap-2 text-xs text-muted">
            <span aria-hidden="true" class={`size-1.5 rounded-full ${connectionReady ? "bg-success" : "bg-muted"}`} />
            {connectionReady ? t("gatewayEndpointReady") : t("gatewayEndpointUnavailable")}
          </p>
        </div>
        <div class="text-left sm:text-right">
          <div class="text-xs text-muted">{t("defaultModel")}</div>
          <code class="mt-1 block text-xs font-medium text-ink">{selectedModel || "—"}</code>
        </div>
      </div>

      <div class="px-5 sm:grid sm:grid-cols-2 sm:py-1">
        <ConnectionValue label={t("baseProxyUrl")} value={baseUrl} copyValue={baseUrl} copyTitle="copyBaseUrl" available={baseUrlAvailable} />
        <ConnectionValue label={t("apiKeyLabel")} value={apiKeyAvailable ? maskSecret(apiKey) : ""} copyValue={apiKey} copyTitle="copyApiKey" available={apiKeyAvailable} />
      </div>

      <div class="border-t border-nx-border px-5 py-4">
        <div class="mb-3 text-xs text-muted">{t("gatewayCapabilities")}</div>
        <div class="grid gap-px overflow-hidden rounded-lg border border-nx-border bg-nx-border sm:grid-cols-3">
          {capabilities.map((capability) => (
            <div key={capability.path} class="bg-surface-raised px-3 py-3">
              <div class="flex items-center gap-2 text-xs font-medium text-ink">
                <span aria-hidden="true" class={`size-1.5 rounded-full ${connectionReady ? "bg-success" : "bg-muted"}`} />
                {capability.label}
              </div>
              <code class="mt-1.5 block truncate text-[10px] text-muted">{capability.path}</code>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
