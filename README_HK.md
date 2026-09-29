# NEXORA

**Multi-Account AI Gateway · 多帳號 AI 網關**

NEXORA（星樞）用於授權及管理多個訂閱帳號，由用戶明確選擇其中一個作為當前網關來源，再透過本機 OpenAI 相容 API 提供能力。

> NEXORA 是獨立維護的修改發行版，不是 OpenAI 或 Codex 官方產品，亦未獲 OpenAI 贊助或背書。

[簡體中文](./README.md) · [English](./README_EN.md) · [繁體中文（台灣）](./README_TW.md) · [日本語](./README_JA.md)

## 主要流程

1. 在 NEXORA 新增帳號並產生授權連結。
2. 複製連結，在該帳號對應的瀏覽器個人資料完成授權。NEXORA 不會自動打開瀏覽器。
3. 在帳號清單選擇「設為網關帳號」。
4. 複製首頁的 Base URL 及 API Key 到 OpenAI 相容客戶端。
5. 新請求會立即使用選中帳號，無需重啟 NEXORA。

桌面模式只使用一個明確選定的帳號，不會自動輪換、故障轉移或靜默切換。

## Windows 安裝

從 [Releases](https://github.com/PingRui/codex-proxy/releases) 下載 `NEXORA-x.x.x-win-x64.exe`。NEXORA 按 Windows 用戶儲存帳號資料，預設只監聽 `127.0.0.1`。詳情請見 [Windows 桌面版手冊](./docs/windows-desktop-manual-accounts.md)。

## API 連線

預設 Base URL 為 `http://127.0.0.1:8080/v1`。請以 NEXORA 首頁顯示的實際連接埠及 API Key 為準。

| 能力 | 介面 |
| --- | --- |
| OpenAI Chat Completions | `POST /v1/chat/completions` |
| OpenAI Responses | `POST /v1/responses` |
| 圖像生成 | `POST /v1/images/generations` |
| Anthropic Messages | `POST /v1/messages` |
| Gemini 相容 | `/v1beta/models/*` |

```bash
curl http://127.0.0.1:8080/v1/images/generations \
  -H "Authorization: Bearer YOUR_LOCAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-image-2","prompt":"A quiet futuristic library at sunrise","size":"1024x1024"}'
```

圖像生成使用當前選中的訂閱帳號，帳號必須具備相應能力。完整協議請見 [API 文檔](./API.md)。

## Codex Desktop 同步

選擇網關帳號時，NEXORA 亦會嘗試寫入 Codex Desktop 的 `auth.json`，舊檔會備份為 `auth.json.bak`。網關切換立即生效；Codex Desktop 需由用戶手動退出及重啟。

## 原始碼及打包

```powershell
git clone https://github.com/PingRui/codex-proxy.git
cd codex-proxy
npm ci
npm run build
npm --prefix packages/electron run build
npm --prefix packages/electron run pack:win
```

安裝檔位於 `packages/electron/release/`。Docker 請從原始碼執行 `docker compose up -d --build`；本文檔不假設新擁有者名下的 GHCR 映像已發佈。

## 安全及授權

請勿上載帳號 token、`auth.json`、備份、`data/` 或執行日誌，亦不要在沒有額外驗證及 TLS 時將本機 API 暴露於公開網絡。

專案網址：[PingRui/codex-proxy](https://github.com/PingRui/codex-proxy)。另見 [NOTICE.md](./NOTICE.md) 及 [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)。

本專案依 [Codex Proxy Non-Commercial Licence](./LICENCE) 發行，只授予條款明確列出的非商業權利。分發修改版時必須保留授權全文、原有著作權、授權及免責聲明，並清楚標示已作修改。
