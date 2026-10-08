# Desktop updates

Windows desktop builds use electron-updater with the stable GitHub Releases feed for `PingRui/codex-proxy`. The dashboard's update entry uses a sandboxed preload and four fixed IPC commands. Every command validates the requesting window, main frame and exact local server origin. A browser dashboard has no desktop bridge and cannot install or restart the desktop app.

The user downloads an update, then explicitly chooses **Restart to update**. Normal window close hides to the tray; normal quit does not auto-install. The local server shuts down before silent NSIS installation and relaunch. Account data and settings remain in the existing compatible user-data directory. Active gateway requests can be interrupted during restart.

## Publishing a Windows update

1. Increment root and Electron package versions together, including package-lock.json. A rebuild at the same version is not an update.
2. Commit and test only the intended source changes. Build and package the Windows x64 installer with `--publish never` before uploading.
3. Publish a stable, non-draft GitHub Release with a matching `vX.Y.Z` tag and attach all three generated files without renaming: `NEXORA-X.Y.Z-win-x64.exe`, its `.exe.blockmap`, and `latest.yml`.
4. Check that `latest.yml` names that installer and that its base64 SHA-512 and size match the uploaded file. Retain `app-update.yml` in the packaged resources; it selects the GitHub provider.
5. Upload to a draft first and mark it published/latest only after all assets are present. For a Windows-only release, say so in release notes; it is not a macOS/Linux release.

Existing 2.1.8 desktop builds already have the updater in the tray. They can use **Check for Updates**, then **Download Update**, then **Install Update** to bootstrap the first version with the dashboard update controls. If that legacy updater cannot reach GitHub, one final manual install is necessary. Network failure leaves the installed version and account store intact. Unsigned builds may still encounter Windows security warnings.

Do not put account files, tokens, private configuration or user-data directories in release assets. Do not use a local installer build as proof that a download-and-install upgrade has been tested on an end-user machine.
