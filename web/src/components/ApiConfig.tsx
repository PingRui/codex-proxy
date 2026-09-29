import { useCallback, useMemo, useState } from "preact/hooks";
import type { ModelFamily } from "../../../shared/hooks/use-status";
import { useT } from "../../../shared/i18n/context";
import { CopyButton } from "./CopyButton";

export interface ApiConfigProps {
  baseUrl: string;
  apiKey: string;
  models: string[];
  selectedModel: string;
  onModelChange: (model: string) => void;
  modelFamilies: ModelFamily[];
  selectedEffort: string;
  onEffortChange: (effort: string) => void;
  selectedSpeed: string | null;
  onSpeedChange: (speed: string | null) => void;
  apiKeyRevealed?: boolean;
  onApiKeyRevealChange?: (revealed: boolean) => void;
}

const EFFORT_LABELS: Record<string, string> = {
  none: "None",
  minimal: "Minimal",
  low: "Low",
  medium: "Medium",
  high: "High",
  xhigh: "XHigh",
};

export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey === "Loading...") return "••••••••••••";
  return `••••••••${apiKey.slice(-4)}`;
}

export function ApiConfig({
  baseUrl,
  apiKey,
  models,
  selectedModel,
  onModelChange,
  modelFamilies,
  selectedEffort,
  onEffortChange,
  selectedSpeed,
  onSpeedChange,
  apiKeyRevealed,
  onApiKeyRevealChange,
}: ApiConfigProps) {
  const t = useT();
  const [internalKeyRevealed, setInternalKeyRevealed] = useState(false);
  const keyRevealed = apiKeyRevealed ?? internalKeyRevealed;
  const setKeyRevealed = onApiKeyRevealChange ?? setInternalKeyRevealed;
  const getBaseUrl = useCallback(() => baseUrl, [baseUrl]);
  const getApiKey = useCallback(() => apiKey, [apiKey]);

  const modelOptions = useMemo(() => {
    const source = modelFamilies.length > 0
      ? modelFamilies.map((family) => ({ id: family.id, label: family.displayName }))
      : models.map((model) => ({ id: model, label: model }));
    if (selectedModel && !source.some((option) => option.id === selectedModel)) {
      source.unshift({ id: selectedModel, label: selectedModel });
    }
    return source;
  }, [modelFamilies, models, selectedModel]);

  const currentFamily = modelFamilies.find((family) => family.id === selectedModel);
  const efforts = currentFamily?.efforts ?? [];

  const handleModelChange = useCallback((model: string) => {
    onModelChange(model);
    const family = modelFamilies.find((candidate) => candidate.id === model);
    if (family && !family.efforts.some((effort) => effort.reasoningEffort === selectedEffort)) {
      onEffortChange(family.defaultEffort);
    }
  }, [modelFamilies, onEffortChange, onModelChange, selectedEffort]);

  return (
    <section class="border border-nx-border bg-surface">
      <div class="border-b border-nx-border px-5 py-4">
        <h2 class="text-base font-semibold tracking-[-0.02em] text-ink">{t("openAiCompatibleConnection")}</h2>
        <p class="mt-1 text-xs leading-5 text-muted">{t("openAiCompatibleConnectionHint")}</p>
      </div>

      <div class="grid gap-px bg-nx-border md:grid-cols-2">
        <label class="bg-surface px-5 py-4">
          <span class="text-xs font-medium text-muted">{t("baseProxyUrl")}</span>
          <span class="mt-2 flex min-w-0 items-center gap-2">
            <input aria-label={t("baseProxyUrl")} class="min-w-0 flex-1 border-0 bg-transparent p-0 font-mono text-[13px] font-medium text-ink outline-none" type="text" value={baseUrl} readOnly />
            <CopyButton getText={getBaseUrl} titleKey="copyUrl" />
          </span>
        </label>

        <label class="bg-surface px-5 py-4">
          <span class="text-xs font-medium text-muted">{t("defaultModel")}</span>
          <select aria-label={t("defaultModel")} class="mt-2 w-full border border-nx-border bg-canvas px-3 py-2 text-sm font-medium text-ink outline-none focus:border-accent" value={selectedModel} onChange={(event) => handleModelChange(event.currentTarget.value)}>
            {modelOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
          </select>
        </label>
      </div>

      <div class="border-t border-nx-border px-5 py-4">
        <label class="text-xs font-medium text-muted" for="local-api-key">{t("localApiKey")}</label>
        <div class="mt-2 flex min-w-0 items-center gap-2">
          <input id="local-api-key" aria-label={t("localApiKey")} type="text" readOnly value={keyRevealed ? apiKey : maskApiKey(apiKey)} class="min-w-0 flex-1 border border-nx-border bg-canvas px-3 py-2 font-mono text-[13px] text-ink outline-none" />
          <button type="button" onClick={() => setKeyRevealed(!keyRevealed)} class="h-9 border border-nx-border bg-surface px-3 text-xs font-semibold text-ink hover:bg-canvas" aria-label={keyRevealed ? t("hideApiKey") : t("revealApiKey")}>
            {keyRevealed ? t("hideApiKey") : t("revealApiKey")}
          </button>
          <CopyButton getText={getApiKey} titleKey="copyApiKey" />
        </div>
      </div>

      {(efforts.length > 1 || selectedSpeed !== undefined) && (
        <div class="flex flex-wrap items-center gap-2 border-t border-nx-border px-5 py-3">
          {efforts.length > 1 && efforts.map((effort) => (
            <button type="button" key={effort.reasoningEffort} onClick={() => onEffortChange(effort.reasoningEffort)} title={effort.description} class={`border px-2.5 py-1 text-xs font-medium ${selectedEffort === effort.reasoningEffort ? "border-accent bg-accent-soft text-accent-strong" : "border-nx-border text-muted hover:text-ink"}`}>
              {EFFORT_LABELS[effort.reasoningEffort] ?? effort.reasoningEffort}
            </button>
          ))}
          <span class="ml-auto text-xs text-muted">{t("speed")}</span>
          <button type="button" onClick={() => onSpeedChange(null)} class={`border px-2.5 py-1 text-xs font-medium ${selectedSpeed === null ? "border-accent bg-accent-soft text-accent-strong" : "border-nx-border text-muted"}`}>{t("speedStandard")}</button>
          <button type="button" onClick={() => onSpeedChange("fast")} class={`border px-2.5 py-1 text-xs font-medium ${selectedSpeed === "fast" ? "border-accent bg-accent-soft text-accent-strong" : "border-nx-border text-muted"}`}>{t("speedFast")}</button>
        </div>
      )}
    </section>
  );
}
