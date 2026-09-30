import { useState } from "preact/hooks";
import { useT } from "../../../shared/i18n/context";
import type { TranslationKey } from "../../../shared/i18n/translations";
import { AccountCard, type AccountCardProps } from "./AccountCard";
import { derivedStatus } from "../lib/accountStatus";

const statusKeys: Record<string, TranslationKey> = {
  active: "active", expired: "expired", banned: "banned", disabled: "disabled",
  refreshing: "refreshing", rate_limited: "rateLimited", quota_exhausted: "quotaExhausted",
};

export function AccountRow(props: AccountCardProps) {
  const t = useT();
  const { account, currentAccount, selectingAccount, selectionBusy, onSelectAccount } = props;
  const [expanded, setExpanded] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const status = derivedStatus(account);
  const limit = account.quota?.rate_limit;
  const rawRemaining = limit?.remaining_percent ?? (limit?.used_percent != null ? 100 - limit.used_percent : null);
  const remaining = limit?.limit_reached ? 0 : rawRemaining != null && Number.isFinite(rawRemaining) ? Math.round(Math.max(0, Math.min(100, rawRemaining))) : null;
  const tone = status === "active" ? "text-success" : status === "disabled" ? "text-muted" : "text-warning";
  const select = async () => {
    if (!onSelectAccount || currentAccount || pending || selectionBusy || selectingAccount || status !== "active") return;
    setPending(true);
    setError(null);
    try { await onSelectAccount(account.id); }
    catch (cause) { setError(`${t("switchAccount")}: ${cause instanceof Error ? cause.message : String(cause)}`); }
    finally { setPending(false); }
  };

  return (
    <article data-account-id={account.id} class={`account-row ${currentAccount ? "account-row-current" : ""}`}>
      <div class="account-row-main">
        <div class="flex min-w-0 items-center gap-3">
          {props.onToggleSelect && <input type="checkbox" checked={props.selected} onChange={() => props.onToggleSelect?.(account.id)} aria-label={`${t("selectAll")}: ${account.email}`} />}
          <div aria-hidden="true" class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-canvas text-sm font-semibold text-muted">{(account.label || account.email || "N").charAt(0).toUpperCase()}</div>
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold text-ink" title={account.email}>{account.label || account.email || account.id}</p>
            <p class="mt-1 truncate text-xs text-muted">{account.label ? `${account.email} · ` : ""}{account.planType || account.quota?.plan_type || t("planNotReported")}</p>
          </div>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <span aria-hidden="true" class={`size-1.5 rounded-full ${status === "active" ? "bg-success" : status === "disabled" ? "bg-muted" : "bg-warning"}`} />
          <span class={tone}>{t(statusKeys[status] || "disabled")}</span>
        </div>
        <div class="min-w-0">
          <p class="text-xs tabular-nums text-muted">{remaining == null ? t("quotaUnknown") : t("quotaAvailable", { value: remaining })}</p>
          {remaining != null && <div role="progressbar" aria-label={t("quotaAvailable", { value: remaining })} aria-valuemin={0} aria-valuemax={100} aria-valuenow={remaining} class="mt-2 h-1 overflow-hidden rounded-full bg-canvas"><div class={`h-full rounded-full ${remaining <= 20 ? "bg-warning" : "bg-success"}`} style={{ width: `${remaining}%` }} /></div>}
        </div>
        <div class="account-row-actions">
          {currentAccount ? <span class="inline-flex items-center gap-1.5 text-xs font-medium text-success"><svg aria-hidden="true" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m5 12 4 4L19 6" /></svg>{t("currentGatewayAccount")}</span>
            : onSelectAccount && <button type="button" class="nx-button" disabled={status !== "active" || selectionBusy || selectingAccount || pending} onClick={select}>{selectingAccount || pending ? t("switchingAccount") : t("useAsGatewayAccount")}</button>}
          <button type="button" class="nx-icon-button" onClick={() => setExpanded(!expanded)} aria-label={`${t("accountDetails")}: ${account.email}`} aria-expanded={expanded} aria-controls={`account-detail-${account.id}`}><svg aria-hidden="true" class={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m6 9 6 6 6-6" /></svg></button>
        </div>
      </div>
      {error && <p role="alert" class="px-5 pb-4 text-sm text-danger">{error}</p>}
      {expanded && <div id={`account-detail-${account.id}`} class="account-detail"><AccountCard {...props} currentAccount={false} onSelectAccount={undefined} onToggleSelect={undefined} /></div>}
    </article>
  );
}
