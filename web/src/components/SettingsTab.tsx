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

export function SettingsTab(props: SettingsTabProps) {
  return (
    <div class="flex flex-col gap-6">
      <SettingsPanel />
      <GeneralSettings />
      <ModelAliasSettings models={props.models} />
      <QuotaSettings />
      <RotationSettings />
      <LogsSettings />
      <OllamaBridgeSettings />
    </div>
  );
}
