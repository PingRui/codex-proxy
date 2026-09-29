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
  const root = apiRoot(baseUrl);
  const selectedModel = useMemo(() => displayModel(model, reasoningEffort, serviceTier), [model, reasoningEffort, serviceTier]);
  const visibleKey = apiKeyRevealed ? apiKey : "<LOCAL_API_KEY>";
  const visibleCurl = useMemo(() => buildCurl(protocol, root, visibleKey, selectedModel), [protocol, root, selectedModel, visibleKey]);
  const copyCurl = useMemo(() => buildCurl(protocol, root, apiKey, selectedModel), [apiKey, protocol, root, selectedModel]);

  const handleCopy = useCallback(async () => {
    await clipboardCopy(copyCurl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [copyCurl]);

  const protocols: Array<{ id: Protocol; label: string; path: string }> = [
    { id: "chat", label: t("chatCompletions"), path: "/v1/chat/completions" },
    { id: "responses", label: t("responsesApi"), path: "/v1/responses" },
    { id: "images", label: t("imageGeneration"), path: "/v1/images/generations" },
  ];

  return (
    <section class="border border-nx-border bg-surface">
      <div class="grid gap-px bg-nx-border sm:grid-cols-3">
        {protocols.map((item) => (
          <button type="button" key={item.id} onClick={() => setProtocol(item.id)} class={`border-b-2 bg-surface px-4 py-3 text-left ${protocol === item.id ? "border-accent text-accent-strong" : "border-transparent text-muted hover:text-ink"}`}>
            <span class="block text-xs font-semibold">{item.label}</span>
            <code class="mt-1 block text-[11px]">{item.path}</code>
          </button>
        ))}
      </div>

      <div class="px-5 py-5">
        <div class="flex items-center justify-between gap-4">
          <h2 class="text-sm font-semibold text-ink">{t("protocolExample")}</h2>
          <button type="button" onClick={handleCopy} aria-label={t("copyCurl")} class="border border-nx-border bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-canvas">
            {copied ? t("copied") : t("copyCurl")}
          </button>
        </div>

        {protocol === "images" && (
          <div class="mt-4 grid gap-px border border-nx-border bg-nx-border md:grid-cols-[0.7fr_2fr_0.7fr]">
            <label class="bg-canvas px-3 py-2.5 text-xs text-muted">{t("requestModel")}<input readOnly value={IMAGE_MODEL} class="mt-1 block w-full border-0 bg-transparent p-0 font-mono text-xs text-ink outline-none" /></label>
            <label class="bg-canvas px-3 py-2.5 text-xs text-muted">{t("requestPrompt")}<input readOnly value={IMAGE_PROMPT} class="mt-1 block w-full border-0 bg-transparent p-0 text-xs text-ink outline-none" /></label>
            <label class="bg-canvas px-3 py-2.5 text-xs text-muted">{t("requestSize")}<input readOnly value={IMAGE_SIZE} class="mt-1 block w-full border-0 bg-transparent p-0 font-mono text-xs text-ink outline-none" /></label>
          </div>
        )}

        <pre class="mt-4 overflow-x-auto border border-nx-border bg-canvas p-4 text-xs leading-5 text-ink"><code>{visibleCurl}</code></pre>
      </div>
    </section>
  );
}
