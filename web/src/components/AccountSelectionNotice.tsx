import { useT } from "../../../shared/i18n/context";
import type { AccountSelectionResult } from "../../../shared/types";

interface AccountSelectionNoticeProps {
  result: AccountSelectionResult;
  onDismiss: () => void;
}

export function AccountSelectionNotice({ result, onDismiss }: AccountSelectionNoticeProps) {
  const t = useT();
  const success = result.codexSynced;

  return (
    <div
      role="status"
      class={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
        success
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-900/20 dark:text-emerald-300"
          : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-300"
      }`}
    >
      <div>
        <div class="font-semibold">
          {success ? t("restartCodexToApply") : t("proxySwitchedCodexSyncFailed")}
        </div>
        {!success && result.warning && <div class="mt-1 text-xs">{result.warning}</div>}
      </div>
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
