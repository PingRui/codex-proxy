# NEXORA

**Multi-Account AI Gateway**

NEXORA authorizes and manages multiple subscription accounts, lets you explicitly choose one as the active gateway source, and exposes that account through a local OpenAI-compatible API.

> NEXORA is an independently maintained modified distribution. It is not an official OpenAI or Codex product and is not endorsed or sponsored by OpenAI.

[简体中文](./README.md) · [繁體中文（台灣）](./README_TW.md) · [繁體中文（香港）](./README_HK.md) · [日本語](./README_JA.md)

![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Windows](https://img.shields.io/badge/Windows-x64-0078D4?style=flat-square&logo=windows&logoColor=white)
![Licence](https://img.shields.io/badge/Licence-Non--Commercial-red?style=flat-square)

## Primary workflow

1. Add an account in NEXORA and create an authorization URL.
2. Copy the URL into the browser profile for that account and complete authorization. NEXORA never opens the browser automatically.
3. Select **Use as gateway account** on the saved account.
4. Copy the Base URL and API key from Overview into an OpenAI-compatible client.
5. New requests immediately use the selected account; NEXORA does not need to restart.

Desktop mode uses exactly one explicitly selected account. It does not automatically rotate, fail over, or silently switch accounts. Reauthorize an expired account or manually select another one when action is required.

## Windows installation

Download `NEXORA-x.x.x-win-x64.exe` from [Releases](https://github.com/PingRui/codex-proxy/releases). NEXORA stores account data per Windows user and listens on `127.0.0.1` by default. See the [Windows desktop guide](./docs/windows-desktop-manual-accounts.md) for the complete flow.

## API access

The default Base URL is `http://127.0.0.1:8080/v1`. Use the actual port and API key shown in NEXORA. If the default port is occupied, the desktop app selects an available local port.

| Capability | Endpoint |
| --- | --- |
| OpenAI Chat Completions | `POST /v1/chat/completions` |
| OpenAI Responses | `POST /v1/responses` |
| Image generation | `POST /v1/images/generations` |
| Anthropic Messages | `POST /v1/messages` |
| Gemini compatibility | `/v1beta/models/*` |
| Model list | `GET /v1/models` |

```bash
curl http://127.0.0.1:8080/v1/chat/completions \
  -H "Authorization: Bearer YOUR_LOCAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-5.6-sol","messages":[{"role":"user","content":"Hello"}]}'
```

Image generation:

```bash
curl http://127.0.0.1:8080/v1/images/generations \
  -H "Authorization: Bearer YOUR_LOCAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-image-2","prompt":"A quiet futuristic library at sunrise","size":"1024x1024"}'
```

Image generation uses the selected subscription account, which must have access to that capability. See [API.md](./API.md) for protocol and client details.

## Codex Desktop synchronization

Selecting a gateway account also asks NEXORA to write that account to Codex Desktop's `auth.json`; the previous file is backed up as `auth.json.bak`. The local gateway switch is immediate. Exit and restart Codex Desktop manually when you want it to load the new login state. NEXORA never controls the Codex Desktop process.

## Run from source and package

```powershell
git clone https://github.com/PingRui/codex-proxy.git
cd codex-proxy
npm ci
npm run build
npm start
```

```powershell
npm --prefix packages/electron run build
npm --prefix packages/electron run pack:win
```

Artifacts are written to `packages/electron/release/`. Without a production signing certificate, Windows SmartScreen may show an unknown-publisher warning.

## Docker (build from source)

The documentation does not assume that a container image exists under the new repository owner.

```bash
git clone https://github.com/PingRui/codex-proxy.git
cd codex-proxy
cp .env.example .env
docker compose up -d --build
```

The Compose file binds the main service and OAuth callback to host loopback by default.

## Security and licence

- Never upload or commit account tokens, `auth.json`, `auth.json.bak`, `data/`, or runtime logs.
- Do not expose the local API to the public Internet without adding your own authentication and TLS boundary.
- You are responsible for complying with applicable law and the terms of every account, API, model, and service you use.

Source, issues, and releases are available from the [GitHub repository](https://github.com/PingRui/codex-proxy), [Issues](https://github.com/PingRui/codex-proxy/issues), and [Releases](https://github.com/PingRui/codex-proxy/releases). Also see the [modified-distribution notice](./NOTICE.md) and [third-party notices](./THIRD_PARTY_NOTICES.md).

This project is distributed under the [Codex Proxy Non-Commercial Licence](./LICENCE), which grants only the non-commercial rights stated in that licence. Distributed modified copies must include the full licence, retain existing copyright, licence, and disclaimer notices, and be clearly identified as modified.
