import { useT } from "../../../shared/i18n/context";
import { CopyButton } from "./CopyButton";

interface GatewayConnectionCardProps {
  baseUrl: string;
  apiKey: string;
  selectedModel: string;
  ready: boolean;
}

function maskSecret(secret: string): string {
  if (!secret || secret === "Loading...") return "••••••••••••";
  if (secret.length <= 8) return "••••••••";
  return `${secret.slice(0, 3)}••••••••${secret.slice(-4)}`;
}

function ConnectionValue({ label, value, copyValue, copyTitle }: { label: string; value: string; copyValue: string; copyTitle: string }) {
  return (
    <div class="min-w-0 border-b border-nx-border py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:px-5 sm:first:pl-0 sm:last:border-r-0 sm:last:pr-0">
      <div class="text-xs text-muted">{label}</div>
      <div class="mt-2 flex min-w-0 items-center gap-2">
        <code class="selectable min-w-0 flex-1 truncate text-[13px] font-medium text-ink">{value}</code>
        <CopyButton getText={() => copyValue} titleKey={copyTitle} class="shrink-0 text-muted hover:bg-canvas hover:text-accent" />
      </div>
    </div>
  );
}

export function GatewayConnectionCard({ baseUrl, apiKey, selectedModel, ready }: GatewayConnectionCardProps) {
  const t = useT();
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
            <span class={`size-1.5 rounded-full ${ready ? "bg-success" : "bg-muted"}`} />
            {ready ? t("gatewayEndpointReady") : t("gatewayEndpointUnavailable")}
          </p>
        </div>
        <div class="text-left sm:text-right">
          <div class="text-xs text-muted">{t("defaultModel")}</div>
          <code class="mt-1 block text-xs font-medium text-ink">{selectedModel || "—"}</code>
        </div>
      </div>

      <div class="px-5 sm:grid sm:grid-cols-2 sm:py-1">
        <ConnectionValue label={t("baseProxyUrl")} value={baseUrl} copyValue={baseUrl} copyTitle="copyBaseUrl" />
        <ConnectionValue label={t("apiKeyLabel")} value={maskSecret(apiKey)} copyValue={apiKey} copyTitle="copyApiKey" />
      </div>

      <div class="border-t border-nx-border px-5 py-4">
        <div class="mb-3 text-xs text-muted">{t("gatewayCapabilities")}</div>
        <div class="grid gap-px overflow-hidden rounded-lg border border-nx-border bg-nx-border sm:grid-cols-3">
          {capabilities.map((capability) => (
            <div key={capability.path} class="bg-surface-raised px-3 py-3">
              <div class="flex items-center gap-2 text-xs font-medium text-ink">
                <span class={`size-1.5 rounded-full ${ready ? "bg-success" : "bg-muted"}`} />
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
