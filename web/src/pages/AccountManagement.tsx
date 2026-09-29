import type { useAccounts } from "../../../shared/hooks/use-accounts";
import { useT } from "../../../shared/i18n/context";
import { AccountList } from "../components/AccountList";
import { PageHeader } from "../components/PageHeader";

interface AccountManagementProps {
  accounts: ReturnType<typeof useAccounts>;
  onAddAccount: () => void;
}

export function AccountManagement({ accounts, onAddAccount }: AccountManagementProps) {
  const t = useT();

  return (
    <div class="flex flex-col">
      <PageHeader
        title={t("accountsNav")}
        description={t("accountsGatewayDescription")}
        actions={(
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
        )}
      />

      {!accounts.persistenceHealth.ok && (
        <div role="alert" data-testid="persistence-banner" class="mb-5 rounded-lg border border-warning/30 bg-warning-container px-4 py-3 text-warning">
          <div class="text-sm font-semibold">{t("persistDisabledTitle")}</div>
          <div class="mt-1 text-xs">{accounts.persistenceHealth.message || t("persistDisabledBody")}</div>
        </div>
      )}

      <AccountList
        accounts={accounts.list}
        loading={accounts.loading}
        onDelete={accounts.deleteAccount}
        onRefresh={accounts.refresh}
        refreshing={accounts.refreshing}
        lastUpdated={accounts.lastUpdated}
        onExport={accounts.exportAccounts}
        onImport={accounts.importAccounts}
        onBatchDelete={accounts.batchDelete}
        onBatchSetStatus={accounts.batchSetStatus}
        onToggleStatus={accounts.toggleStatus}
        onUpdateLabel={accounts.updateLabel}
        onUpdateCodexFingerprintMode={accounts.updateCodexFingerprintMode}
        manualMode={accounts.manualMode}
        selectedAccountId={accounts.selectedAccountId}
        selectingAccountId={accounts.selectingAccountId}
        selectionNotice={accounts.selectionNotice}
        onSelectAccount={accounts.selectAccount}
        onDismissSelectionNotice={accounts.dismissSelectionNotice}
      />
    </div>
  );
}
