import type { useAccounts } from "../../../shared/hooks/use-accounts";
import type { useStatus } from "../../../shared/hooks/use-status";
import { useT } from "../../../shared/i18n/context";
import { AccountSelectionNotice } from "../components/AccountSelectionNotice";
import { CurrentGatewayAccount } from "../components/CurrentGatewayAccount";
import { GatewayConnectionCard } from "../components/GatewayConnectionCard";
import { PageHeader } from "../components/PageHeader";
import { deriveGatewayState } from "../lib/gateway-state";

export interface GatewayOverviewProps {
  accounts: ReturnType<typeof useAccounts>;
  status: ReturnType<typeof useStatus>;
  onAddAccount: () => void;
}

export function GatewayOverview({ accounts, status, onAddAccount }: GatewayOverviewProps) {
  const t = useT();
  const gatewayState = deriveGatewayState(accounts.list, accounts.selectedAccountId);
  const ready = !accounts.loading && gatewayState.kind === "ready";

  return (
    <div class="flex flex-col gap-6">
      <PageHeader
        title={t("overview")}
        description={t("gatewayOverviewDescription")}
        actions={accounts.list.length === 0 ? (
          <button
            type="button"
            onClick={onAddAccount}
            class="inline-flex h-9 items-center gap-2 rounded-lg bg-accent-strong px-3.5 text-xs font-semibold text-white hover:bg-accent"
          >
            <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            {t("addAccount")}
          </button>
        ) : undefined}
      />

      <CurrentGatewayAccount state={gatewayState} loading={accounts.loading} />

      <GatewayConnectionCard
        baseUrl={status.baseUrl}
        apiKey={status.apiKey}
        selectedModel={status.selectedModel}
        ready={ready}
      />

      {accounts.selectionNotice && (
        <AccountSelectionNotice result={accounts.selectionNotice} onDismiss={accounts.dismissSelectionNotice} />
      )}
    </div>
  );
}
