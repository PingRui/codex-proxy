# Windows Desktop: Manual Account Authorization and Switching

The Windows desktop build is designed for local use. The proxy and OAuth
callback listeners bind to `127.0.0.1`. The app does not automatically rotate
accounts and never starts, stops, or restarts Codex Desktop.

## Install and start

1. Run the Windows x64 installer from `packages/electron/release`.
2. Start **Codex Proxy**. The app opens its local control panel. If the
   configured port is occupied, it selects another local port.
3. The OpenAI-compatible base URL is the current control-panel origin with
   `/v1` appended, for example `http://127.0.0.1:8080/v1`.

## Add subscription accounts

1. Open account management and choose to add a ChatGPT account.
2. Copy the authorization URL. The desktop app does not open a browser for you.
3. Paste the URL into the browser or browser profile for the account you want
   to add, then finish the login and authorization flow.
4. When the browser returns to `http://localhost:1455/auth/callback`, the app
   receives and stores the account credentials. If the page offers a manual
   relay flow, paste the callback URL as instructed.
5. Repeat for each additional account. Complete one authorization before
   starting the next so the browser sessions do not get mixed up.

## Select the active account

1. Choose **Use this account** on an account card, or select the account from
   the current-account control.
2. The selection immediately applies to subsequent proxy requests. Desktop
   mode does not rotate to another account or fail over automatically.
3. The app also writes that account to Codex's standard `auth.json`. The
   default path is `%USERPROFILE%\.codex\auth.json`; when `CODEX_HOME` is set,
   the path is `%CODEX_HOME%\auth.json`.
4. The previous file is backed up as `auth.json.bak`. If Codex auth sync fails,
   proxy selection still succeeds and the UI reports the sync error separately.
5. Manually exit and restart Codex Desktop when you want Codex Desktop to use
   the newly selected account.

## OpenAI-compatible endpoints

- Chat Completions: `POST /v1/chat/completions`
- Responses: `POST /v1/responses`
- Image generation: `POST /v1/images/generations`

Use the local proxy key shown in the control panel as the API key. An image
request can use the client-facing compatibility model:

```json
{
  "model": "gpt-image-2",
  "prompt": "A quiet futuristic library at sunrise",
  "size": "1024x1024"
}
```

The proxy converts this into Codex's `image_generation` flow using the selected
subscription account and the configured routable Codex host model. The account
must have access to that capability.

## Credential safety

Account tokens, `auth.json`, its backup, and desktop application data contain
sensitive credentials. Do not share them, upload them, or commit them to Git.
The installer is per-user so credentials are not shared between Windows users.
