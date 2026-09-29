# NEXORA Windows 桌面端：授权、切换和本地网关

NEXORA 的 Windows 桌面版面向本机单用户使用。网关和 OAuth 回调只绑定到回环地址。一个已授权账号就是一个可选的网关来源，无需再配置额外的上游服务。

## 1. 安装并启动

1. 从 [NEXORA Releases](https://github.com/PingRui/codex-proxy/releases) 下载 Windows x64 安装程序：`NEXORA-x.x.x-win-x64.exe`。
2. 运行安装程序，然后启动 **NEXORA**。
3. 应用会自动启动本地网关。默认 Base URL 是 `http://127.0.0.1:8080/v1`。如果端口被占用，应用会选择可用端口，请以 Overview 页显示的地址为准。

NEXORA 按 Windows 用户保存数据，不会将账号登录状态共享给其他系统用户。

## 2. 添加并授权账号

1. 打开 **Accounts**，选择添加账号。
2. 点击生成授权链接，然后复制完整 URL。
3. 手动打开要授权账号对应的浏览器配置文件，粘贴 URL 并完成登录。NEXORA 不会自动跳转或打开浏览器。
4. 授权成功后，浏览器会返回 `http://localhost:1455/auth/callback`，NEXORA 会接收并保存登录状态。
5. 如页面提示手动中继，请按页面说明将回调 URL 粘贴回 NEXORA。
6. 添加其他账号时重复上述步骤。请等待一个账号完成后再开始下一个，避免混用浏览器会话。

如果 1455 端口已被其他程序占用，请关闭占用端口的程序后重试。

## 3. 选择网关账号

1. 在账号卡片上点击 **Use as gateway account**（用作网关账号）。
2. 成功后，卡片会标记为当前网关账号，Overview 页也会显示它的状态。
3. 后续新请求立即使用新选中的账号，不需要重启 NEXORA。已在处理中的请求会继续使用它开始时取得的账号。

桌面模式不会自动轮换或故障转移。如果当前账号过期、限额或缺少所需凭据，网关会保持该选择并显示可执行的错误。请重新授权该账号，或手动选择另一个账号。

## 4. 连接 OpenAI 兼容客户端

从 Overview 或 API Access 页复制：

- **Base URL**：例如 `http://127.0.0.1:8080/v1`
- **API Key**：NEXORA 显示的本地密钥
- **Model**：客户端支持的模型名称

主要接口：

- Chat Completions：`POST /v1/chat/completions`
- Responses：`POST /v1/responses`
- Images：`POST /v1/images/generations`

图片生成示例：

```json
{
  "model": "gpt-image-2",
  "prompt": "A quiet futuristic library at sunrise",
  "size": "1024x1024"
}
```

图片请求也使用当前网关账号。该账号需要具备相应能力。

## 5. 同步到 Codex Desktop

选择网关账号时，NEXORA 会分别执行两件事：

1. 将它设为本地网关来源。
2. 尝试将该账号写入 Codex Desktop 的标准 `auth.json`。

默认目标是 `%USERPROFILE%\.codex\auth.json`；如果设置了 `CODEX_HOME`，则使用 `%CODEX_HOME%\auth.json`。原文件会备份为 `auth.json.bak`。

如 Codex 同步失败，本地网关选择仍然保持成功，界面会单独显示同步错误和目标路径。修复问题后可以重试同步。

Codex Desktop 需由用户手动退出并重启才会读取新登录状态。NEXORA 不会启动、停止或重启 Codex Desktop。

## 6. 凭据安全

- 账号 token、`auth.json`、`auth.json.bak` 和 NEXORA 数据目录都包含敏感凭据。
- 不要共享、上传或提交这些文件到 Git。
- 不要将本地网关端口直接暴露到公网。
- 使用者需自行遵守适用法律和第三方服务条款。

NEXORA 是独立维护的修改发行版，不是 OpenAI 或 Codex 官方产品。详细许可和声明见项目根目录的 `LICENCE`、`NOTICE.md` 和 `THIRD_PARTY_NOTICES.md`。
