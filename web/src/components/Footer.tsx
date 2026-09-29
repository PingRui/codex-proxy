import { APP_BRAND, APP_DESCRIPTOR } from "../../../shared/brand";
import type { UpdateStatus } from "../../../shared/hooks/use-update-status";

interface FooterProps {
  updateStatus: UpdateStatus | null;
}

export function Footer({ updateStatus }: FooterProps) {
  const proxyVersion = updateStatus?.proxy.version ?? "...";
  const proxyCommit = updateStatus?.proxy.commit;
  const codexVersion = updateStatus?.codex.current_version;

  return (
    <footer class="mt-auto shrink-0 border-t border-nx-border bg-surface px-4 py-3 sm:px-7 lg:px-9 xl:px-12">
      <div class="mx-auto flex w-full max-w-[1320px] flex-col gap-1 text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between">
        <span>{APP_BRAND} · {APP_DESCRIPTOR}</span>
        <div class="flex flex-wrap items-center gap-x-2 font-mono">
          <span>v{proxyVersion}{proxyCommit ? ` (${proxyCommit})` : ""}</span>
          <span aria-hidden="true">/</span>
          <span>Codex Desktop {codexVersion ? `v${codexVersion}` : "—"}</span>
        </div>
      </div>
    </footer>
  );
}
