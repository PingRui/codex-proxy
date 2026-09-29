import { useT } from "../../../shared/i18n/context";
import type { AccountSelectionResult } from "../../../shared/types";

interface AccountSelectionNoticeProps {
  result: AccountSelectionResult;
  onDismiss: () => void;
}

export function AccountSelectionNotice({ result, onDismiss }: AccountSelectionNoticeProps) {
  const t = useT();
  const success = result.codexSynced;
  const message = success
    ? t("gatewaySwitchSuccess")
    : t("gatewaySwitchSyncFailed", { warning: result.warning || result.codexAuthPath || "—" });

  return (
    <div
      role="status"
      class={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
        success
          ? "border-success/30 bg-success-container text-success"
          : "border-warning/30 bg-warning-container text-warning"
      }`}
    >
      <div class="font-semibold">{message}</div>
      <button
        type="button"
        onClick={onDismiss}
        class="shrink-0 opacity-70 transition-opacity hover:opacity-100"
        aria-label={t("close")}
      >
        ×
      </button>
    </div>
  );
}
