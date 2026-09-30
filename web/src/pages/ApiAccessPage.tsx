import { useState } from "preact/hooks";
import type { ModelFamily } from "../../../shared/hooks/use-status";
import { useT } from "../../../shared/i18n/context";
import { AnthropicSetup } from "../components/AnthropicSetup";
import { ApiConfig } from "../components/ApiConfig";
import { CodeExamples } from "../components/CodeExamples";
import { TestConnection } from "../components/TestConnection";

export interface ApiAccessPageProps {
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
}

export function ApiAccessPage(props: ApiAccessPageProps) {
  const t = useT();
  const [apiKeyRevealed, setApiKeyRevealed] = useState(false);

  return (
    <div class="flex flex-col gap-5">
      <ApiConfig
        {...props}
        apiKeyRevealed={apiKeyRevealed}
        onApiKeyRevealChange={setApiKeyRevealed}
      />

      <CodeExamples
        baseUrl={props.baseUrl}
        apiKey={props.apiKey}
        model={props.selectedModel}
        reasoningEffort={props.selectedEffort}
        serviceTier={props.selectedSpeed}
        apiKeyRevealed={apiKeyRevealed}
      />

      <details class="nx-disclosure">
        <summary class="cursor-pointer list-none text-sm font-semibold text-ink marker:hidden">
          {t("advancedProtocolCompatibility")}
          <span class="ml-3 text-xs font-normal text-muted">{t("advancedProtocolCompatibilityHint")}</span>
        </summary>
        <div class="mt-5 flex flex-col gap-5">
          <AnthropicSetup
            apiKey={props.apiKey}
            selectedModel={props.selectedModel}
            reasoningEffort={props.selectedEffort}
            serviceTier={props.selectedSpeed}
          />
          <TestConnection />
        </div>
      </details>
    </div>
  );
}
