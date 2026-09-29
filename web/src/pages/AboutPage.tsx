import { APP_DESCRIPTOR, APP_DISPLAY_NAME, APP_REPOSITORY_URL } from "../../../shared/brand";
import { useT } from "../../../shared/i18n/context";

interface AboutPageProps {
  version: string | null;
  commit: string | null;
}

export function AboutPage({ version, commit }: AboutPageProps) {
  const t = useT();
  const noticeUrl = `${APP_REPOSITORY_URL}/blob/main/NOTICE.md`;
  const thirdPartyUrl = `${APP_REPOSITORY_URL}/blob/main/THIRD_PARTY_NOTICES.md`;

  return (
    <section class="max-w-3xl border border-nx-border bg-surface">
      <div class="border-b border-nx-border px-6 py-6">
        <h2 class="text-2xl font-semibold tracking-[-0.03em] text-ink">{APP_DISPLAY_NAME}</h2>
        <p class="mt-2 text-sm text-muted">{APP_DESCRIPTOR}</p>
      </div>

      <dl class="grid gap-px bg-nx-border sm:grid-cols-2">
        <div class="bg-surface px-6 py-4"><dt class="text-xs text-muted">{t("version")}</dt><dd class="mt-1 font-mono text-sm text-ink">{version ?? "—"}</dd></div>
        <div class="bg-surface px-6 py-4"><dt class="text-xs text-muted">{t("commit")}</dt><dd class="mt-1 font-mono text-sm text-ink">{commit ?? "—"}</dd></div>
      </dl>

      <div class="border-t border-nx-border px-6 py-6 text-sm leading-6 text-muted">
        <p>{t("independentDistributionNotice")}</p>
        <p class="mt-3">{t("nonCommercialLicenceNotice")}</p>
        <div class="mt-5 flex flex-wrap gap-x-5 gap-y-2">
          <a class="font-medium text-accent hover:text-accent-strong" href={APP_REPOSITORY_URL} target="_blank" rel="noreferrer">{t("sourceRepository")}</a>
          <a class="font-medium text-accent hover:text-accent-strong" href={noticeUrl} target="_blank" rel="noreferrer">NOTICE</a>
          <a class="font-medium text-accent hover:text-accent-strong" href={thirdPartyUrl} target="_blank" rel="noreferrer">{t("thirdPartyNotices")}</a>
        </div>
      </div>
    </section>
  );
}
