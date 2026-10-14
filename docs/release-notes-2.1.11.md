# NEXORA 2.1.11 — Respect manually selected proxy accounts

Windows x64 only.

## Changes

- Manual routing now uses the selected proxy account without rejecting it based on cached model-to-plan mappings. The upstream service decides whether that account can use the requested model.
- Manual routing still does not automatically switch accounts. Expiration, disabled accounts, quota exhaustion, cooldown and concurrency protections remain in place. Automatic routing is unchanged.

## Updating

In NEXORA, use Check for Updates → Download → Restart to update. Restart when gateway requests are idle. Account data and settings remain in the existing compatible user-data directory.

This change does not grant additional upstream model permissions or bypass upstream errors. Local Codex login remains independent from proxy selection.

## Known verification limits

The preceding release had full CI failures in the self-update, client-keys page, layout preferences and theme test files; those unrelated files are unchanged by this focused fix. This release does not claim to repair those checks. Targeted routing regression tests are used in addition to isolated build and package checks.

The installer is unsigned and may trigger Windows security warnings. A real end-user download/install/relaunch upgrade is not automatically exercised.
