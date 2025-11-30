# Torn Target Tracker

<p align="center">
  <img src="https://raw.githubusercontent.com/skillerious/TornTargetTrackerV2/main/assets/logomain.png" alt="Torn Target Tracker Logo" width="360">
</p>

<p align="center">
  <strong>VS Code-inspired Electron desktop app for Torn.com chain targets.</strong><br/>
  Live status, smart rate limiting, encrypted API key storage, and a keyboard-first workflow.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Electron-28.0.0-2b9af3" alt="Electron 28.0.0"/>
  <img src="https://img.shields.io/badge/Node-18%2B-43853d" alt="Node 18+"/>
  <img src="https://img.shields.io/badge/OS-Windows%20%7C%20macOS%20%7C%20Linux-444" alt="Platforms"/>
  <img src="https://img.shields.io/badge/Version-2.0.0-7a5af8" alt="Version"/>
  <img src="https://img.shields.io/badge/License-MIT-3fb950" alt="License"/>
</p>

- [Highlights](#highlights)
- [Feature Snapshot](#feature-snapshot)
- [Quick Start](#quick-start)
- [System Requirements](#system-requirements)
- [Configuration](#configuration)
- [Usage](#usage)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Technical Notes](#technical-notes)
- [Project Structure](#project-structure)
- [Development](#development)
- [Verification](#verification)
- [Build and Packaging](#build-and-packaging)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)
- [Contributing](#contributing)
- [Support](#support)
- [License](#license)

## Highlights

- VS Code-style chrome with dark theme, activity bar, and sidebar navigation.
- Add, edit, and remove targets with nicknames and notes.
- Live status refresh with configurable intervals and attackable filters.
- Built-in rate limiter with exponential backoff, jitter, and `Retry-After` support.
- One-click attack/profile actions plus keyboard-first navigation.
- API key stored encrypted (AES-256-GCM) in your OS app data directory.

## Feature Snapshot

| Area | Highlights |
|------|------------|
| Target list | Nicknames, notes, quick filters (all/attackable/hospital/travel) |
| Status updates | Auto-refresh with configurable interval, one-click manual refresh |
| Actions | Attack, open profile, delete, select-to-focus |
| Reliability | Rate limiter with exponential backoff, jitter, and `Retry-After` support |
| Security | Encrypted API key storage per OS, sandboxed renderer with preload bridge |
| UX | VS Code-inspired layout, keyboard-first navigation, compact mode option |

## Quick Start

```bash
# Install dependencies
npm install

# Run the app
npm start
```

Prerequisites: Node.js 18+ (npm included). No global installs needed.

## System Requirements

- OS: Windows, macOS, or Linux (64-bit).
- Runtime: Node.js 18+ for development; packaged apps bundle Electron.
- Disk: ~300 MB free for Electron runtime and cache.
- Network: Outbound HTTPS to Torn.com API.

## Configuration

### API Key
1. Create a Torn API key with at least **Public** access: https://www.torn.com/preferences.php#tab=api
2. In the app, open **Settings** (gear in the activity bar).
3. Paste your key and click **Validate**. The key is encrypted before saving.

### Settings Reference

| Setting | Description | Default |
|---------|-------------|---------|
| Auto Refresh | Automatically refresh target statuses | Enabled |
| Refresh Interval | Seconds between auto-refreshes | 30 |
| Notifications | Alert when a target becomes attackable | Enabled |
| Compact Mode | Smaller, denser list items | Disabled |

## Usage

### Add Targets
1. Click **+** in the sidebar header or press `Ctrl+N`.
2. Enter the target User ID (from their profile URL).
3. Optionally add a nickname and notes.
4. Click **Add Target**.

### Manage Targets
- **Select**: Click a target to view details.
- **Attack**: Use the attack action or press `Enter` to open the attack page.
- **Profile**: Open the Torn profile for the selected target.
- **Refresh**: Update a single target's status.
- **Remove**: Delete the target via `Delete` or the remove action.

### Quick Filters
- **All Targets**: Full list.
- **Attackable**: Targets with "Okay" status.
- **In Hospital**: Hospitalized targets.
- **Traveling**: Currently abroad.

### Workflow Recipes
- **Chain prep**: Filter to **Attackable**, sort by last seen, open attack pages in sequence.
- **Recon**: Add notes per target (weapons, armor, boosts), keep **Compact Mode** on for density.
- **Travel watch**: Filter **Traveling**, keep auto-refresh enabled for return alerts.
- **Cooldown-aware pushes**: When a cooldown is applied, leave auto-refresh on; the limiter will resume requests automatically.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+N` | Add new target |
| `Ctrl+R` | Refresh all targets |
| `Enter` | Attack selected target |
| `Delete` | Remove selected target |
| `Arrow Up` / `Arrow Down` | Navigate target list |
| `Escape` | Deselect or close modal |

## Technical Notes

### Rate Limiting
- Tuned to Torn limits: **99 requests per 60 seconds**, then a 60s cooldown.
- Retries respect `Retry-After`, use exponential backoff, and add jitter.
- Automatic handling of HTTP 429 and transient failures.

### Data and Security
- Storage locations (local-only, no cloud storage):
  - Windows: `%APPDATA%\\torn-target-tracker`
  - macOS: `~/Library/Application Support/torn-target-tracker`
  - Linux: `~/.config/torn-target-tracker`
- API key is encrypted with AES-256-GCM before writing to disk.
- User-friendly error handling for invalid keys, rate limiting, and network issues.

### Stack
- Electron 28 (desktop shell)
- Node.js 18+ (runtime)
- Electron Store (persisted settings)
- UUID (target identifiers)

### Architecture at a Glance

```
[Renderer (UI)]
  -> requests via preload bridge
  <- status updates, notifications

[Preload]
  -> validates/whitelists IPC channels
  -> shields renderer from Node APIs

[Main Process]
  -> rate limiter
  -> API client (Torn)
  -> secure storage (Electron Store + AES-256-GCM)
```

## Project Structure

```
torn-tracker/
|- main.js            # Electron main process
|- preload.js         # Secure IPC bridge
|- index.html         # Main application window
|- package.json       # Project metadata and scripts
|- assets/
|  |- icon.svg        # Application icon
|- src/
   |- api.js          # Torn API client (rebuilt from api.py)
   |- state.js        # Application state manager
   |- app.js          # UI controller
   |- styles/
      |- app.css      # VS Code theme styles
```

## Development

```bash
# Install dependencies
npm install

# Run in development
npm run dev

# Run in production mode locally
npm start
```

Tips:
- Keep Torn API usage within limits during development; the rate limiter is enabled but respect Torn's terms.
- If you add new IPC channels, mirror them in `preload.js` to keep the renderer sandboxed.

## Verification

Fast sanity check before opening a PR:

1. `npm install`
2. `npm run dev` and add two test targets (OK + hospitalized) to confirm filters.
3. Toggle **Compact Mode** and **Auto Refresh** in Settings to verify persistence after reload.
4. Kill network temporarily; confirm the app shows a friendly error and recovers when back online.

## Build and Packaging

Install builder (dev dependency) and package for your platform:

```bash
npm install --save-dev electron-builder
npm run build          # Build for current platform
# npm run build:win    # Windows installer (nsis)
# npm run build:mac    # macOS dmg
# npm run build:linux  # Linux AppImage
```

`package.json` builder config (summary):
- `appId`: `com.torn.target-tracker`
- `productName`: `Torn Target Tracker`
- `directories.output`: `dist`
- Targets: `nsis` (Windows), `dmg` (macOS), `AppImage` (Linux)
- Icons: `assets/logo.ico`, `assets/icon.icns`, `assets/icon.png`

Release checklist:
- Bump version in `package.json`.
- Run `npm run build`.
- Smoke-test the generated artifact (attackable filter, notifications, settings persistence).
- Draft release notes with Torn API changes, if any.

## Troubleshooting

- **"API key not configured"**: Open Settings and add your Torn API key.
- **"Rate limit exceeded"**: Wait; the app auto-retries after cooldown/backoff.
- **"User not found"**: Verify the User ID in the target URL.
- **App will not start**: Confirm Node.js is installed and rerun `npm install`.
- **Blank window**: Delete the app data folder to reset config, then relaunch.

## FAQ

- **Does the app store my API key?** Yes, encrypted locally using AES-256-GCM in your OS app data folder.
- **Does it work while minimized?** Yes, background refresh continues if auto-refresh is enabled.
- **Can I change refresh speed?** Yes, adjust **Refresh Interval** in Settings.
- **Why am I seeing cooldowns?** The app enforces Torn's 99 requests/60s limit with cooldowns and retries.
- **How do I request a feature?** Open an issue with details on the workflow you need.

## Contributing

Pull requests and issue reports are welcome. Please:
- Keep changes small and focused.
- Include repro steps and expected/actual behavior for bugs.
- Follow the existing code style; prefer small, pure functions in renderer logic.

## Support

- Open a GitHub issue for bugs or feature requests.
- Include logs, OS, app version, and steps to reproduce when reporting problems.

## License

MIT License. See `LICENSE` for details.

---

Not affiliated with Torn.com. Use responsibly and follow Torn's terms of service.
