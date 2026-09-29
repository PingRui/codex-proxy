# NEXORA

**Multi-Account AI Gateway · 多帳號 AI 網關**

NEXORA（星樞）可授權與管理多個訂閱帳號，由使用者明確選擇其中一個作為目前網關來源，再透過本機 OpenAI 相容 API 提供能力。

> NEXORA 是獨立維護的修改發行版，不是 OpenAI 或 Codex 官方產品，也未獲 OpenAI 贊助或背書。

[簡體中文](./README.md) · [English](./README_EN.md) · [繁體中文（香港）](./README_HK.md) · [日本語](./README_JA.md)

## 主要流程

1. 在 NEXORA 新增帳號並產生授權連結。
2. 複製連結，於該帳號對應的瀏覽器個人檔案完成授權。NEXORA 不會自動開啟瀏覽器。
3. 在帳號清單選擇「設為網關帳號」。
4. 複製首頁的 Base URL 與 API Key 到 OpenAI 相容客戶端。
5. 新請求會立即使用選中帳號，無需重啟 NEXORA。

桌面模式只使用一個明確選定的帳號，不會自動輪替、故障移轉或靜默切換。

## Windows 安裝

從 [Releases](https://github.com/PingRui/codex-proxy/releases) 下載 `NEXORA-x.x.x-win-x64.exe`。NEXORA 以 Windows 使用者為單位儲存帳號資料，預設只偵聽 `127.0.0.1`。詳情請見 [Windows 桌面版手冊](./docs/windows-desktop-manual-accounts.md)。

## API 連線

預設 Base URL 為 `http://127.0.0.1:8080/v1`。請以 NEXORA 首頁顯示的實際連接埠與 API Key 為準。

| 能力 | 端點 |
| --- | --- |
| OpenAI Chat Completions | `POST /v1/chat/completions` |
| OpenAI Responses | `POST /v1/responses` |
| 圖片生成 | `POST /v1/images/generations` |
| Anthropic Messages | `POST /v1/messages` |
| Gemini 相容 | `/v1beta/models/*` |

```bash
curl http://127.0.0.1:8080/v1/images/generations \
  -H "Authorization: Bearer YOUR_LOCAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-image-2","prompt":"A quiet futuristic library at sunrise","size":"1024x1024"}'
```

圖片生成使用目前選中的訂閱帳號，帳號必須具備對應能力。完整協定請見 [API 文件](./API.md)。

## Codex Desktop 同步

選擇網關帳號時，NEXORA 也會嘗試寫入 Codex Desktop 的 `auth.json`，並將舊檔備份為 `auth.json.bak`。網關切換立即生效；Codex Desktop 需由使用者手動退出與重啟。

## 原始碼與打包

```powershell
git clone https://github.com/PingRui/codex-proxy.git
cd codex-proxy
npm ci
npm run build
npm --prefix packages/electron run build
npm --prefix packages/electron run pack:win
```

安裝檔位於 `packages/electron/release/`。Docker 請由原始碼執行 `docker compose up -d --build`；本文件不假設新擁有者名下的 GHCR 映像已發佈。

## 安全與授權

請勿上傳帳號 token、`auth.json`、備份、`data/` 或執行日誌，也不要在沒有額外認證與 TLS 時將本機 API 暴露到公開網路。

專案網址：[PingRui/codex-proxy](https://github.com/PingRui/codex-proxy)。另見 [NOTICE.md](./NOTICE.md) 與 [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)。

本專案依 [Codex Proxy Non-Commercial Licence](./LICENCE) 發行，僅授予條款明確列出的非商業權利。分發修改版時必須保留授權全文、原有著作權、授權與免責聲明，並清楚標示已作修改。
