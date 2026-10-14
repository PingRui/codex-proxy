import { useEffect, useRef, useState } from "preact/hooks";
import { useT } from "../../../shared/i18n/context";
import type { Account } from "../../../shared/types";

interface LocalStatus {
  status: "chatgpt" | "api_key" | "missing" | "unreadable";
  email: string | null;
  accountId: string | null;
}

export function LocalCodexAccount({ accounts }: { accounts: Account[] }) {
  const t = useT();
  const [status, setStatus] = useState<LocalStatus | null>(null);
  const [chosen, setChosen] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [written, setWritten] = useState(false);
  const locked = useRef(false);
  const mounted = useRef(false);

  const request = async (id?: string) => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    setWritten(false);
    try {
      const response = await fetch(id ? `/auth/accounts/${encodeURIComponent(id)}/select-codex` : "/auth/codex/status", id ? { method: "POST" } : undefined);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("localCodexFailed"));
      if (!["chatgpt", "api_key", "missing", "unreadable"].includes(data.status)) throw new Error(t("localCodexFailed"));
      if (mounted.current) {
        setStatus(data);
        if (id) setWritten(true);
      }
    } catch (cause) {
      if (mounted.current) setError(cause instanceof Error ? cause.message : t("localCodexFailed"));
    } finally {
      locked.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  useEffect(() => {
    mounted.current = true;
    void request();
    const onFocus = () => void request();
    window.addEventListener("focus", onFocus);
    return () => { mounted.current = false; window.removeEventListener("focus", onFocus); };
  }, []);

  const eligible = accounts.filter((account) => account.status === "active");
  const canSwitch = eligible.some((account) => account.id === chosen);
  const identity = status?.status === "chatgpt" ? status.email || status.accountId || t("localCodexUnknown")
    : status?.status === "api_key" ? t("localCodexApiKey")
      : status?.status === "missing" ? t("localCodexMissing")
        : status?.status === "unreadable" ? t("localCodexUnreadable") : t("loading");

  return (
    <section aria-labelledby="local-codex-title" class="mb-7 rounded-xl border border-nx-border bg-surface p-5">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 id="local-codex-title" class="text-base font-semibold text-ink">{t("localCodexTitle")}</h2>
          <p class="mt-2 break-all text-sm text-ink" aria-live="polite">{identity}</p>
        </div>
        <button type="button" class="nx-button" disabled={busy} onClick={() => void request()}>{t("refresh")}</button>
      </div>
      <p class="mt-2 text-xs leading-5 text-muted">{t("localCodexHint")}</p>
      <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label class="min-w-0 flex-1 text-xs font-medium text-muted">
          {t("localCodexChoose")}
          <select class="mt-2 block w-full rounded-lg border border-nx-border bg-canvas px-3 py-2 text-sm text-ink focus:border-accent" disabled={busy} value={chosen} onChange={(event) => setChosen(event.currentTarget.value)}>
            <option value="">{t("localCodexChoose")}</option>
            {eligible.map((account) => <option key={account.id} value={account.id}>{account.label ? `${account.label} — ` : ""}{account.email || account.id}</option>)}
          </select>
        </label>
        <button type="button" class="nx-button shrink-0" disabled={busy || !canSwitch} onClick={() => void request(chosen)}>{busy ? t("loading") : t("localCodexSwitch")}</button>
      </div>
      {error && <p role="alert" class="mt-3 text-sm text-danger">{error}</p>}
      {written && <p role="status" class="mt-3 text-sm text-success">{t("localCodexWritten")}</p>}
    </section>
  );
}
