import { useCallback, useMemo, useState } from "preact/hooks";
import { useT } from "../../../shared/i18n/context";
import { clipboardCopy } from "../../../shared/utils/clipboard";

type Protocol = "chat" | "responses" | "images";

interface CodeExamplesProps {
  baseUrl: string;
  apiKey: string;
  model: string;
  reasoningEffort: string;
  serviceTier: string | null;
  apiKeyRevealed?: boolean;
}

const IMAGE_MODEL = "gpt-image-2";
const IMAGE_PROMPT = "A cinematic orbital gateway above a blue planet";
const IMAGE_SIZE = "1024x1024";

function apiRoot(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/v1") ? trimmed : `${trimmed}/v1`;
}

function displayModel(model: string, effort: string, speed: string | null): string {
  let value = model;
  if (effort && effort !== "medium") value += `-${effort}`;
  if (speed === "fast") value += "-fast";
  return value;
}

function buildCurl(protocol: Protocol, baseUrl: string, apiKey: string, model: string): string {
  if (protocol === "images") {
    return `curl ${baseUrl}/images/generations \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -d '{
    "model": "${IMAGE_MODEL}",
    "prompt": "${IMAGE_PROMPT}",
    "size": "${IMAGE_SIZE}"
  }'`;
  }
  if (protocol === "responses") {
    return `curl ${baseUrl}/responses \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -d '{
    "model": "${model}",
    "input": "Hello from NEXORA"
  }'`;
  }
  return `curl ${baseUrl}/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -d '{
    "model": "${model}",
    "messages": [{"role": "user", "content": "Hello from NEXORA"}]
  }'`;
}

export function CodeExamples({ baseUrl, apiKey, model, reasoningEffort, serviceTier, apiKeyRevealed = false }: CodeExamplesProps) {
  const t = useT();
  const [protocol, setProtocol] = useState<Protocol>("images");
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const root = apiRoot(baseUrl);
  const selectedModel = useMemo(() => displayModel(model, reasoningEffort, serviceTier), [model, reasoningEffort, serviceTier]);
  const visibleKey = apiKeyRevealed ? apiKey : "<LOCAL_API_KEY>";
  const visibleCurl = useMemo(() => buildCurl(protocol, root, visibleKey, selectedModel), [protocol, root, selectedModel, visibleKey]);
  const copyCurl = useMemo(() => buildCurl(protocol, root, apiKey, selectedModel), [apiKey, protocol, root, selectedModel]);

  const handleCopy = useCallback(async () => {
    const ok = await clipboardCopy(copyCurl);
    setCopied(ok);
    setCopyFailed(!ok);
    setTimeout(() => { setCopied(false); setCopyFailed(false); }, 2000);
  }, [copyCurl]);

  const protocols: Array<{ id: Protocol; label: string; path: string }> = [
    { id: "chat", label: t("chatCompletions"), path: "/v1/chat/completions" },
    { id: "responses", label: t("responsesApi"), path: "/v1/responses" },
    { id: "images", label: t("imageGeneration"), path: "/v1/images/generations" },
  ];

  return (
    <section class="overflow-hidden rounded-xl border border-nx-border bg-surface">
      <div role="tablist" aria-label={t("protocolExample")} class="flex border-b border-nx-border">
        {protocols.map((item) => (
          <button type="button" role="tab" tabIndex={protocol === item.id ? 0 : -1} aria-selected={protocol === item.id} id={`protocol-${item.id}`} aria-controls="protocol-example" key={item.id} onClick={() => setProtocol(item.id)} onKeyDown={(event) => {
            const index = protocols.findIndex((entry) => entry.id === item.id);
            const next = event.key === "ArrowRight" ? (index + 1) % protocols.length : event.key === "ArrowLeft" ? (index + protocols.length - 1) % protocols.length : event.key === "Home" ? 0 : event.key === "End" ? protocols.length - 1 : -1;
            if (next < 0) return;
            event.preventDefault();
            setProtocol(protocols[next].id);
            document.getElementById(`protocol-${protocols[next].id}`)?.focus();
          }} class={`min-w-0 flex-1 border-b-2 px-3 py-3 text-sm font-medium ${protocol === item.id ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink"}`}>
            {item.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id="protocol-example" aria-labelledby={`protocol-${protocol}`} class="px-5 py-5">
        <div class="flex items-center justify-between gap-4">
          <code class="min-w-0 break-all text-xs text-muted">{protocols.find((item) => item.id === protocol)?.path}</code>
          <button type="button" onClick={handleCopy} disabled={!baseUrl || baseUrl === "Loading..." || !apiKey || apiKey === "Loading..."} aria-label={t("copyCurl")} class="nx-button shrink-0">
            {copied ? t("copied") : t("copyCurl")}
          </button>
        </div>

        {copyFailed && <p role="status" class="mt-2 text-xs text-danger">{t("copyFailed")}</p>}
        <pre class="mt-4 overflow-x-auto rounded-lg bg-canvas p-4 text-xs leading-6 text-ink"><code>{visibleCurl}</code></pre>
      </div>
    </section>
  );
}
