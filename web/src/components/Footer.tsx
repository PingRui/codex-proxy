import { APP_BRAND } from "../../../shared/brand";
import type { UpdateStatus } from "../../../shared/hooks/use-update-status";
import { useT } from "../../../shared/i18n/context";

interface FooterProps {
  updateStatus: UpdateStatus | null;
  gatewayReady: boolean;
}

export function Footer({ updateStatus, gatewayReady }: FooterProps) {
  const t = useT();
  const proxyVersion = updateStatus?.proxy.version ?? "...";

  return (
    <footer class="mt-auto shrink-0 border-t border-nx-border bg-surface px-4 py-3 sm:px-7 lg:px-9 xl:px-12">
      <div class="mx-auto flex w-full max-w-[1320px] items-center justify-between gap-4 text-[11px] text-muted">
        <span>{APP_BRAND} v{proxyVersion}</span>
        <span class="flex items-center gap-2">
          <span class={`size-1.5 rounded-full ${gatewayReady ? "bg-success" : "bg-warning"}`} aria-hidden="true" />
          {gatewayReady ? t("localGatewayReady") : t("localGatewayUnavailable")}
        </span>
      </div>
    </footer>
  );
}
