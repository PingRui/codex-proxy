import { useT } from "../../../shared/i18n/context";
import type { TranslationKey } from "../../../shared/i18n/translations";
import type { Account } from "../../../shared/types";
import type { GatewayState } from "../lib/gateway-state";

interface CurrentGatewayAccountProps {
  state: GatewayState;
  loading?: boolean;
}

function remainingQuota(account: Account): number | null {
  const limit = account.quota?.rate_limit;
  if (!limit) return null;
  if (limit.limit_reached) return 0;
  if (limit.remaining_percent != null) return Math.max(0, Math.min(100, Math.round(limit.remaining_percent)));
  if (limit.used_percent != null) return Math.max(0, Math.min(100, 100 - Math.round(limit.used_percent)));
  return null;
}

const stateTone: Record<GatewayState["kind"], string> = {
  unconfigured: "bg-muted",
  ready: "bg-success",
  attention: "bg-warning",
  blocked: "bg-danger",
};

const actionLabel: Partial<Record<NonNullable<GatewayState["action"]>, TranslationKey>> = {
  select: "selectCurrentAccount",
  reauthorize: "reauthorizeAccount",
  switch: "switchAccount",
};

export function CurrentGatewayAccount({ state, loading = false }: CurrentGatewayAccountProps) {
  const t = useT();
  const account = state.account;
  const remaining = account && state.kind !== "blocked" ? remainingQuota(account) : null;
  const title = loading ? t("gatewayLoading") : t(state.titleKey);
  const initial = (account?.label || account?.email || "N").charAt(0).toUpperCase();
  const quotaLabel = state.kind === "blocked"
    ? t("connectionUnavailable")
    : remaining == null
      ? t("quotaUnknown")
      : t("quotaAvailable", { value: remaining });
  const actionKey = state.action ? actionLabel[state.action] : undefined;

  return (
    <section class="relative min-h-[224px] overflow-hidden rounded-xl border border-nx-border bg-surface" aria-live="polite">
      <div class={`absolute inset-y-0 left-0 w-1 ${loading ? "bg-muted" : stateTone[state.kind]}`} />
      <div class="flex h-full flex-col px-6 py-6 sm:px-8 sm:py-7">
        <div class="flex items-center gap-2 text-xs font-medium text-muted">
          <span aria-hidden="true" class={`size-2 rounded-full ${loading ? "bg-muted" : stateTone[state.kind]}`} />
          {t("gatewaySource")}
        </div>

        <div class="mt-7 flex flex-1 flex-col justify-between gap-7 md:flex-row md:items-end">
          <div class="min-w-0">
            <h2 class="text-xl font-semibold tracking-[-0.025em] text-ink sm:text-2xl">{title}</h2>
            {account ? (
              <div class="mt-5 flex min-w-0 items-center gap-4">
                <div class="flex size-14 shrink-0 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 text-xl font-semibold text-accent">
                  {initial}
                </div>
                <div class="min-w-0">
                  {account.label && <p class="truncate text-xs font-medium text-muted">{account.label}</p>}
                  <p class="truncate text-base font-semibold text-ink sm:text-lg">{account.email || account.id}</p>
                  <div class="mt-1 flex items-center gap-2 text-xs text-muted">
                    <span>{account.planType || account.quota?.plan_type || t("planNotReported")}</span>
                    <span aria-hidden="true">/</span>
                    <span>{quotaLabel}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p class="mt-3 max-w-xl text-sm leading-6 text-muted">{t("gatewayOverviewDescription")}</p>
            )}
          </div>

          <div class="flex shrink-0 flex-col items-start gap-3 md:items-end">
            {account && remaining != null && (
              <div
                class="w-44"
                role="progressbar"
                aria-label={t("quotaAvailable", { value: remaining })}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={remaining}
              >
                <div class="h-1.5 overflow-hidden rounded-full bg-canvas">
                  <div class={`h-full rounded-full ${remaining === 0 ? "bg-danger" : remaining <= 20 ? "bg-warning" : "bg-accent"}`} style={{ width: `${remaining}%` }} />
                </div>
              </div>
            )}
            {!loading && actionKey && (
              <a href="#/accounts" class="inline-flex h-9 items-center rounded-lg border border-nx-border bg-surface-raised px-3.5 text-xs font-semibold text-ink hover:border-accent/50 hover:text-accent">
                {t(actionKey)}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
