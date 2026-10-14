# NEXORA 2.1.10 — Independent proxy and local Codex accounts

This release contains the Windows x64 installer and updater metadata only. No macOS or Linux binaries are included.

## Changes

- Switching the gateway source no longer overwrites the local Codex login. Proxy requests can use a different account from Codex Desktop.
- Accounts now has a separate Local Codex account section. It reads identity from the local login file and offers an explicit Write Codex login action without changing the proxy source.
- Missing, API-key and unreadable local login files are distinguished. Restart guidance appears after a successful explicit Codex write, not after a proxy switch.

## Updating

In NEXORA 2.1.9, use the dashboard update entry: Check for Updates → Download → Restart to update. Accounts and settings remain in the compatible user-data directory. Restart when gateway requests are idle.

The local account display describes the login file, not a running Codex session. After writing a different login, restart Codex Desktop manually to load it. Authorized accounts remain in one account library; their proxy and Codex selections are independent.

This update does not undo a Codex login previously written by an older version. The installer is unsigned and Windows may show security warnings. A real end-user install/relaunch upgrade is not automatically exercised.
