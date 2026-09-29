# NEXORA

**Multi-Account AI Gateway · 多账号 AI 网关**

NEXORA（星枢）用于授权和管理多个订阅账号，手动选择其中一个作为当前网关来源，并通过本机 OpenAI 兼容 API 对外提供能力。

> NEXORA 是独立维护的修改发行版，不是 OpenAI 或 Codex 官方产品，也未获得 OpenAI 赞助或背书。

[English](./README_EN.md) · [繁體中文（台灣）](./README_TW.md) · [繁體中文（香港）](./README_HK.md) · [日本語](./README_JA.md)

![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Windows](https://img.shields.io/badge/Windows-x64-0078D4?style=flat-square&logo=windows&logoColor=white)
![Licence](https://img.shields.io/badge/Licence-Non--Commercial-red?style=flat-square)

## 核心流程

1. 在 NEXORA 中添加账号，生成授权链接。
2. 复制链接，在该账号对应的浏览器配置文件中完成授权。NEXORA 不会自动打开浏览器。
3. 在账号列表中点击“用作网关账号”。
4. 复制首页上的 Base URL 和 API Key，配置到 OpenAI 兼容客户端。
5. 后续请求立即使用新选中的账号，无需重启 NEXORA。

桌面模式只使用用户明确选中的一个账号，不会自动轮换、故障转移或静默切换。如果账号过期、限额或不可用，请重新授权或手动选择其他账号。

## Windows 安装

从 [Releases](https://github.com/PingRui/codex-proxy/releases) 下载 `NEXORA-x.x.x-win-x64.exe`。运行安装程序后启动 NEXORA。应用会在当前 Windows 用户下保存账号数据，并且默认只监听 `127.0.0.1`。

详细操作见 [Windows 桌面端手册](./docs/windows-desktop-manual-accounts.md)。

## API 接入

默认 Base URL 是 `http://127.0.0.1:8080/v1`。实际端口和 API Key 以 NEXORA 首页显示为准；默认端口被占用时，桌面应用会选择可用的本地端口。

| 能力 | 接口 |
| --- | --- |
| OpenAI Chat Completions | `POST /v1/chat/completions` |
| OpenAI Responses | `POST /v1/responses` |
| 图片生成 | `POST /v1/images/generations` |
| Anthropic Messages | `POST /v1/messages` |
| Gemini 兼容 | `/v1beta/models/*` |
| 模型列表 | `GET /v1/models` |

```bash
curl http://127.0.0.1:8080/v1/chat/completions \
  -H "Authorization: Bearer YOUR_LOCAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-5.6-sol","messages":[{"role":"user","content":"Hello"}]}'
```

图片生成：

```bash
curl http://127.0.0.1:8080/v1/images/generations \
  -H "Authorization: Bearer YOUR_LOCAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-image-2","prompt":"A quiet futuristic library at sunrise","size":"1024x1024"}'
```

图片生成会使用当前选中的订阅账号；该账号必须具有相应能力。完整协议和客户端接入细节见 [API 文档](./API.md)。

## 同步到 Codex Desktop

选择网关账号时，NEXORA 会同时尝试将该账号写入 Codex Desktop 的 `auth.json`，原文件会备份为 `auth.json.bak`。网关切换立即生效；Codex Desktop 需由用户手动退出并重启才会读取新登录状态。NEXORA 不会控制 Codex Desktop 进程。

## 从源码运行和打包

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

安装包输出到 `packages/electron/release/`。未配置代码签名证书时，Windows SmartScreen 可能显示未知发布者提示。

## Docker（从源码构建）

当前文档不假设新所有者名下的 GHCR 镜像已发布。

```bash
git clone https://github.com/PingRui/codex-proxy.git
cd codex-proxy
cp .env.example .env
docker compose up -d --build
```

Compose 默认只将主服务和 OAuth 回调端口绑定到本机回环地址。

## 安全和许可

- 不要上传或提交账号 token、`auth.json`、`auth.json.bak`、`data/` 和运行日志。
- 不要将本地 API 暴露到公网；远程访问需要自行增加身份验证和 TLS。
- 使用者需自行遵守适用法律和第三方服务条款。

源码、问题和发行版分别位于 [GitHub 仓库](https://github.com/PingRui/codex-proxy)、[Issues](https://github.com/PingRui/codex-proxy/issues) 和 [Releases](https://github.com/PingRui/codex-proxy/releases)。另见 [修改发行版说明](./NOTICE.md) 与 [第三方声明](./THIRD_PARTY_NOTICES.md)。

本项目使用 [Codex Proxy Non-Commercial Licence](./LICENCE)，仅授予其中明确规定的非商业权利。分发修改版时必须保留许可全文、原有著作权、许可和免责声明，并明确标记已作修改。
