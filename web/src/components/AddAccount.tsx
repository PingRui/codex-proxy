import { useState, useCallback } from "preact/hooks";
import { useT } from "../../../shared/i18n/context";
import type { TranslationKey } from "../../../shared/i18n/translations";

interface AddAccountProps {
  visible: boolean;
  onCancel: () => void;
  onSubmitRelay: (callbackUrl: string) => Promise<void>;
  onAddByRefreshToken: (refreshToken: string) => Promise<string | null>;
  addInfo: string;
  addError: string;
  authUrl: string;
  fallbackConfigured: boolean;
  onAddFallbackUpstream: (baseUrl: string, apiKey: string) => Promise<string | null>;
}

export function AddAccount({ visible, onCancel, onSubmitRelay, onAddByRefreshToken, addInfo, addError, authUrl, fallbackConfigured, onAddFallbackUpstream }: AddAccountProps) {
  const t = useT();
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [rtInput, setRtInput] = useState("");
  const [rtSubmitting, setRtSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fbBaseUrl, setFbBaseUrl] = useState("");
  const [fbApiKey, setFbApiKey] = useState("");
  const [fbSubmitting, setFbSubmitting] = useState(false);
  const [fbError, setFbError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    await onSubmitRelay(input);
    setSubmitting(false);
    setInput("");
  }, [input, onSubmitRelay]);

  const handleRtSubmit = useCallback(async () => {
    const trimmed = rtInput.trim();
    if (!trimmed) return;
    setRtSubmitting(true);
    await onAddByRefreshToken(trimmed);
    setRtSubmitting(false);
    setRtInput("");
  }, [rtInput, onAddByRefreshToken]);

  const handleRtKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Enter") handleRtSubmit();
  }, [handleRtSubmit]);

  const handleCopyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(authUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — ignore
    }
  }, [authUrl]);

  const handleAddFallback = useCallback(async () => {
    const baseUrl = fbBaseUrl.trim();
    const apiKey = fbApiKey.trim();
    if (!baseUrl || !apiKey) {
      setFbError(t("fallbackRequired"));
      return;
    }
    setFbSubmitting(true);
    setFbError(null);
    try {
      const err = await onAddFallbackUpstream(baseUrl, apiKey);
      if (err) {
        setFbError(err);
        return;
      }
      setFbBaseUrl("");
      setFbApiKey("");
    } finally {
      setFbSubmitting(false);
    }
  }, [fbBaseUrl, fbApiKey, onAddFallbackUpstream, t]);

  if (!visible && !addInfo && !addError) return null;

  return (
    <>
      {addInfo && (
        <p class="mb-3 border border-success/30 bg-success-container px-4 py-3 text-sm text-success">{t(addInfo as TranslationKey)}</p>
      )}
      {addError && (
        <p class="mb-3 border border-danger/30 bg-danger-container px-4 py-3 text-sm text-danger">{t(addError as TranslationKey)}</p>
      )}
      {visible && (
        <section class="mb-6 border border-nx-border bg-surface p-5">
          <div class="flex items-start justify-between gap-6">
            <div>
              <h2 class="text-lg font-semibold tracking-[-0.02em] text-ink">{t("addAccount")}</h2>
              <p class="mt-1 text-sm text-muted">{t("copyAuthorizationLink")}</p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              class="text-sm text-muted transition-colors hover:text-ink"
            >
              {t("cancel")}
            </button>
          </div>

          <ol class="mt-5 grid gap-px border border-nx-border bg-nx-border md:grid-cols-3">
            {["authorizeStepCopy", "authorizeStepBrowser", "authorizeStepReturn"].map((key, index) => (
              <li key={key} class="flex gap-3 bg-surface px-4 py-4 text-sm text-ink">
                <span class="flex size-6 shrink-0 items-center justify-center border border-accent/30 bg-accent-soft text-xs font-semibold text-accent-strong">{index + 1}</span>
                <span class="pt-0.5">{t(key as TranslationKey)}</span>
              </li>
            ))}
          </ol>

          <div class="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              aria-label={t("copyAuthorizationLink")}
              type="text"
              value={authUrl}
              readOnly
              onFocus={(event) => event.currentTarget.select()}
              class="min-w-0 flex-1 border border-nx-border bg-canvas px-3 py-2.5 font-mono text-xs text-ink outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={handleCopyUrl}
              disabled={!authUrl}
              class="bg-accent-strong px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              {copied ? t("copied") : t("copy")}
            </button>
          </div>
          <p class="mt-3 text-xs text-muted">{t("authorizationWaiting")}</p>

          <details class="mt-5 border-t border-nx-border pt-4">
            <summary class="cursor-pointer text-sm font-medium text-ink">{t("recovery")}</summary>
            <p class="mt-2 text-xs text-muted">{t("recoveryDescription")}</p>
            <div class="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={input}
                onInput={(event) => setInput((event.target as HTMLInputElement).value)}
                placeholder={t("pasteCallback")}
                class="min-w-0 flex-1 border border-nx-border bg-canvas px-3 py-2.5 font-mono text-xs text-ink outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !input.trim()}
                class="border border-nx-border bg-surface px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-canvas disabled:opacity-40"
              >
                {submitting ? t("submitting") : t("submit")}
              </button>
            </div>
          </details>

          <details class="mt-4 border-t border-nx-border pt-4">
            <summary class="cursor-pointer text-sm font-medium text-ink">{t("advanced")}</summary>
            <div class="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={rtInput}
                onInput={(event) => setRtInput((event.target as HTMLInputElement).value)}
                onKeyDown={handleRtKeyDown}
                placeholder={t("pasteRefreshToken")}
                class="min-w-0 flex-1 border border-nx-border bg-canvas px-3 py-2.5 font-mono text-xs text-ink outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={handleRtSubmit}
                disabled={rtSubmitting || !rtInput.trim()}
                class="border border-nx-border bg-surface px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-canvas disabled:opacity-40"
              >
                {rtSubmitting ? t("addingByRt") : t("addByRt")}
              </button>
            </div>

            <div class="mt-5 border-t border-nx-border pt-4">
              <div class="text-sm font-medium text-ink">{t("fallbackUpstreamTitle")}</div>
              <div class="mt-1 text-xs text-muted">
              {t("fallbackOnlyWhenExhaustedDesc")}
              </div>
              {fallbackConfigured ? (
                <p class="mt-3 border border-nx-border bg-canvas px-3 py-2.5 text-xs text-muted">{t("fallbackAlreadyConfigured")}</p>
              ) : (
                <>
                  <div class="mt-3 grid gap-2 sm:grid-cols-2">
                  <input
                    type="text"
                    value={fbBaseUrl}
                    onInput={(event) => setFbBaseUrl((event.target as HTMLInputElement).value)}
                    placeholder={t("fallbackBaseUrl")}
                    class="w-full border border-nx-border bg-canvas px-3 py-2.5 font-mono text-xs text-ink outline-none focus:border-accent"
                  />
                  <input
                    type="password"
                    value={fbApiKey}
                    onInput={(event) => setFbApiKey((event.target as HTMLInputElement).value)}
                    placeholder={t("fallbackApiKey")}
                    class="w-full border border-nx-border bg-canvas px-3 py-2.5 font-mono text-xs text-ink outline-none focus:border-accent"
                  />
                  </div>
                  {fbError && <p class="mt-2 text-xs text-danger">{fbError}</p>}
                  <button
                    type="button"
                    onClick={handleAddFallback}
                    disabled={fbSubmitting || !fbBaseUrl.trim() || !fbApiKey.trim()}
                    class="mt-3 border border-nx-border bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-canvas disabled:opacity-40"
                  >
                    {fbSubmitting ? t("fallbackAdding") : t("fallbackAdd")}
                  </button>
                </>
              )}
            </div>
          </details>
        </section>
      )}
    </>
  );
}
