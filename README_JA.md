# NEXORA

**Multi-Account AI Gateway**

NEXORA（星樞）は複数のサブスクリプションアカウントを認証・管理し、そのうち 1 つを現在のゲートウェイソースとして明示的に選択し、ローカルの OpenAI 互換 API として公開します。

> NEXORA は独立してメンテナンスされる改変ディストリビューションです。OpenAI または Codex の公式製品ではなく、OpenAI の支援や承認を受けていません。

[簡体中文](./README.md) · [English](./README_EN.md) · [繁體中文（台湾）](./README_TW.md) · [繁體中文（香港）](./README_HK.md)

## 基本フロー

1. NEXORA でアカウントを追加し、認証 URL を生成します。
2. URL をコピーし、そのアカウン用のブラウザープロファイルで認証を完了します。NEXORA はブラウザーを自動的に開きません。
3. アカウント一覧で **Use as gateway account** を選びます。
4. Overview の Base URL と API Key を OpenAI 互換クライアントに設定します。
5. 新しいリクエストはすぐに選択中のアカウントを使います。NEXORA の再起動は不要です。

デスクトップモードは明示的に選択された 1 アカウントのみを使い、自動ローテーション、フェイルオーバー、無通知の切り替えは行いません。

## Windows へのインストール

[Releases](https://github.com/PingRui/codex-proxy/releases) から `NEXORA-x.x.x-win-x64.exe` をダウンロードします。NEXORA は Windows ユーザーごとにデータを保存し、既定で `127.0.0.1` のみをリッスンします。詳細は [Windows デスクトップガイド](./docs/windows-desktop-manual-accounts.md) を参照してください。

## API 接続

既定の Base URL は `http://127.0.0.1:8080/v1` です。NEXORA の Overview に表示される実際のポートと API Key を使ってください。

| 機能 | エンドポイント |
| --- | --- |
| OpenAI Chat Completions | `POST /v1/chat/completions` |
| OpenAI Responses | `POST /v1/responses` |
| 画像生成 | `POST /v1/images/generations` |
| Anthropic Messages | `POST /v1/messages` |
| Gemini 互換 | `/v1beta/models/*` |

```bash
curl http://127.0.0.1:8080/v1/images/generations \
  -H "Authorization: Bearer YOUR_LOCAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-image-2","prompt":"A quiet futuristic library at sunrise","size":"1024x1024"}'
```

画像生成は選択中のサブスクリプションアカウントを使います。そのアカウントは対応機能を利用できる必要があります。詳細は [API ドキュメント](./API.md) を参照してください。

## Codex Desktop との同期

ゲートウェイアカウントを選択すると、NEXORA は Codex Desktop の `auth.json` への書き込みも試み、以前のファイルを `auth.json.bak` としてバックアップします。ゲートウェイは即時に切り替わりますが、Codex Desktop はユーザーが手動で終了・再起動してください。

## ソースとパッケージ作成

```powershell
git clone https://github.com/PingRui/codex-proxy.git
cd codex-proxy
npm ci
npm --prefix web ci
npm run build
npm --prefix packages/electron run build
npm --prefix packages/electron run pack:win
```

インストーラーは `packages/electron/release/` に `NEXORA-<version>-win-x64.exe` として出力されます（現在のバージョンは `NEXORA-2.1.8-win-x64.exe`）。Docker ではソースから `docker compose up -d --build` を実行してください。新しい所有者名の GHCR イメージが公開済みとは想定していません。

## セキュリティとライセンス

アカウント token、`auth.json`、バックアップ、`data/`、実行ログをアップロードやコミットしないでください。追加の認証と TLS なしにローカル API を公開ネットワークに公開しないでください。

プロジェクト：[PingRui/codex-proxy](https://github.com/PingRui/codex-proxy)。[NOTICE.md](./NOTICE.md) と [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) も参照してください。

本プロジェクトは [Codex Proxy Non-Commercial Licence](./LICENCE) の下で配布され、同ライセンスに明記された非商用の権利のみを付与します。改変版の配布時はライセンス全文、既存の著作権・ライセンス・免責事項を保持し、改変版であることを明記する必要があります。
