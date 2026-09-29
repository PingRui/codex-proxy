# NEXORA Rebrand and Simplified Account Gateway Design

Date: 2026-09-29
Status: Proposed

## Summary

NEXORA is a Windows-first, multi-account AI gateway that combines subscription
account authorization and account-state management with an OpenAI-compatible
local proxy. An authorized account is itself a gateway source. Users do not
configure a separate upstream for the normal desktop workflow.

The product is distributed as a public source-available project under the
existing non-commercial licence. The user-facing product is independently
branded as NEXORA. Notices required by the upstream licence remain intact and
are consolidated into legal documentation instead of appearing as promotional
content in the primary interface.

## Product identity

- Product name: **NEXORA**
- Chinese display name: **星枢**
- Descriptor: **Multi-Account AI Gateway**
- Repository: `PingRui/codex-proxy` initially; a future repository rename does
  not block this redesign.
- The product must not present itself as an official OpenAI or Codex product.
- The existing non-commercial licence, copyright notices, disclaimer, and
  modification notice must remain available in distributed source and builds.

Old maintainer promotion, sponsor links, social links, star buttons, obsolete
repository links, and old release URLs will be removed or changed to the
NEXORA repository. Dependency metadata inside lockfiles remains untouched.

## Primary user journey

The main workflow is deliberately linear:

1. Start NEXORA.
2. Add an account and copy its authorization URL.
3. Open the URL in the desired browser profile and finish authorization.
4. Return to NEXORA and select **Use as gateway account**.
5. Copy the local Base URL and API key into an OpenAI-compatible client.
6. Send chat, Responses, or image-generation requests through the selected
   subscription account.

Selecting an account immediately changes the source used for subsequent local
gateway requests. It also writes the selected credentials to Codex Desktop's
standard `auth.json`. NEXORA does not start, stop, or restart Codex Desktop;
the user restarts Codex Desktop manually when desired.

## Routing behavior

- Desktop mode uses exactly one explicitly selected subscription account.
- There is no automatic account rotation, fallback, load balancing, or silent
  failover in the primary desktop workflow.
- If no account is selected, the gateway returns a clear actionable error.
- If the selected account is expired, rate-limited, unavailable, or missing
  required credentials, the gateway remains on that account and asks the user
  to select or reauthorize an account.
- Switching the selected account affects new requests immediately. In-flight
  requests continue with the account they acquired when they started.
- The local server and OAuth callback bind only to loopback interfaces.

Existing advanced provider and automatic routing capabilities may remain in
the backend for compatibility, but the NEXORA desktop interface will not place
them in the normal user journey. Any retained advanced controls live under an
explicitly labelled advanced section.

## Information architecture

### Overview

The landing page answers three questions without navigation:

1. Which account is currently powering the gateway?
2. Is the local gateway ready?
3. What connection values should be copied into a client?

It contains:

- Selected account identity, plan, health, quota summary, and a switch action.
- Gateway status, listen address, and supported capabilities.
- Copyable Base URL, API key, and recommended model values.
- Compact copyable examples for Chat Completions and image generation.
- Clear empty, expired, and synchronization-error states.

### Accounts

The accounts page is the operational center for account authorization and
selection. Each account card shows identity, plan, health, quota, last refresh,
and whether it is the gateway source. Its primary action is **Use as gateway
account**. Secondary actions include refresh, reauthorize, label, and remove.

Adding an account is a guided three-step panel: create link, copy and authorize
in the user's browser, then wait for callback confirmation. The app never opens
the browser automatically.

### API access

The API page focuses on consumption rather than routing configuration. It
shows the current endpoint, local key, supported endpoints, compatible request
models, and copyable snippets. Image generation is a first-class capability
using `POST /v1/images/generations` with the client-facing `gpt-image-2` name.

### Activity and diagnostics

Request activity, errors, and usage remain accessible but visually secondary.
They must not compete with the selected-account and connection workflow.

### Settings

Settings contains application preferences, startup behavior, language, theme,
Codex auth path, data location, and update controls. Provider routing, proxy
pools, experimental protocol options, and diagnostic tuning are grouped under
**Advanced** when retained.

### Legal

A small About/Legal entry exposes the full licence, required upstream notices,
third-party notices, source repository, and a statement that this is a modified
independent distribution. Legal attribution does not appear as promotional UI.

## Visual direction

NEXORA uses a focused desktop-control-plane aesthetic rather than a generic
admin dashboard. The visual hierarchy prioritizes the current gateway account
and connection readiness.

- Dark graphite and near-white neutral surfaces with one electric cyan/indigo
  accent family.
- Flat, restrained cards; borders provide structure and shadows are minimal.
- Consistent 8-pixel spacing rhythm and shared control heights.
- Clear typography hierarchy with readable 13–16px operational text.
- Status color is reserved for meaning: green ready, amber attention, red
  blocked, blue informational.
- One dominant action per panel. Secondary actions use quiet buttons or menus.
- Tables collapse into readable cards on narrow windows.
- Empty and failure states include a direct recovery action.
- Light and dark themes share the same information hierarchy and contrast.

The app icon and brand mark will be replaced with an original NEXORA asset.
No upstream logo or maintainer identity will remain in user-facing branding.

## Brand and release configuration

The following identifiers will be updated consistently:

- Electron product name and application identifier.
- Window, tray, installer, executable, shortcut, and artifact names.
- Web title, header, sidebar, footer, metadata, and icons.
- Package descriptions where they describe this distribution.
- GitHub release owner/repository and self-update URLs.
- Documentation clone URLs, release links, Docker examples, badges, and issue
  links that currently point to the old repository.

Internal protocol-compatible names such as `auth_mode: "chatgpt"`, OpenAI API
field names, Codex model identifiers, endpoint paths, persisted database
columns, and compatibility storage keys are not renamed merely for branding.
Renaming those values would create migration risk without user benefit.

## Credential and security behavior

- Tokens remain local and must never be rendered in full after initial capture.
- The generated proxy API key is shown through an explicit reveal/copy action.
- Selected credentials are written atomically to Codex `auth.json`; the prior
  file remains recoverable through `auth.json.bak`.
- A successful proxy-account selection and a failed Codex auth synchronization
  are reported separately so partial success is understandable.
- No credential, local data directory, generated installer, or runtime log is
  committed to Git.
- NEXORA remains per-Windows-user and loopback-only for this release.

## Compatibility and migration

- Existing saved accounts, selected account state, local API keys, and usage
  history remain readable after the rebrand.
- Existing local-storage preferences continue to work. New brand-neutral keys
  may be introduced with one-time migration, but old keys are not removed until
  their values have been copied.
- Existing OpenAI-compatible endpoints and request formats remain stable.
- The current manual account routing contract remains the desktop default.
- Rebranding must not rewrite or discard a user's `auth.json` until the user
  explicitly selects an account.

## Error handling

The interface uses actionable errors rather than raw backend terminology:

- No selected account: link to Accounts and request a selection.
- Expired credentials: offer reauthorization.
- Quota unavailable: show the condition and offer account selection.
- OAuth callback port conflict: explain that port 1455 is occupied and provide
  a retry action.
- Codex auth sync failure: keep the gateway selection, display the exact target
  path, and offer retry.
- Gateway port conflict: transparently use a free local port and update every
  displayed copy value.

## Testing and acceptance criteria

The redesign is complete when:

- No user-facing screen or release/update link promotes the old maintainer or
  points to the old repository.
- Required licence and copyright notices remain distributed and accessible.
- A newly authorized account can be selected as the gateway account directly
  from the account list.
- Switching accounts affects the next proxy request without restarting NEXORA.
- Chat Completions, Responses, and image generation use the selected account.
- The Overview page exposes working copy actions for Base URL and API key.
- The desktop app binds to loopback even when old configuration requests a
  public bind address.
- Existing account data survives upgrade and remains selectable.
- Light, dark, narrow-window, empty, loading, ready, expired, and error states
  are visually verified once using the installed local Chrome executable.
- Unit, web, routing, image-generation, Electron build, and Windows packaging
  checks pass. Platform-specific Bash CI tests are reported separately when
  run on Windows.

## Out of scope

- Automatic account rotation or failover in desktop mode.
- Remote multi-user hosting and team access control.
- Paid billing, subscription management, or commercial relicensing.
- Automatic control of the Codex Desktop process.
- Renaming third-party dependency packages or deleting their licence metadata.
