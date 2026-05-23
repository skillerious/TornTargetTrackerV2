# Torn Target Tracker

<p align="center">
  <img src="https://raw.githubusercontent.com/skillerious/TornTargetTrackerV2/main/assets/logomain.png" alt="Torn Target Tracker Logo" width="380">
</p>

<p align="center">
  <strong>Premium Electron desktop target tracker for Torn.com chaining, scouting, bounty monitoring, and day-to-day target management.</strong>
</p>

<p align="center">
  <a href="https://github.com/skillerious/TornTargetTrackerV2/releases/tag/v2.8.0"><img src="https://img.shields.io/badge/latest%20release-v2.8.0-0f6bff?style=for-the-badge" alt="Latest release v2.8.0"></a>
  <a href="https://github.com/skillerious/TornTargetTrackerV2/releases"><img src="https://img.shields.io/badge/downloads-releases-1f883d?style=for-the-badge" alt="GitHub releases"></a>
  <a href="#license"><img src="https://img.shields.io/badge/license-MIT-3fb950?style=for-the-badge" alt="MIT license"></a>
  <img src="https://img.shields.io/badge/electron-39.2.5-47848f?style=for-the-badge&logo=electron&logoColor=white" alt="Electron 39.2.5">
</p>

<p align="center">
  <a href="https://github.com/skillerious/TornTargetTrackerV2/releases/tag/v2.8.0"><strong>Download v2.8.0</strong></a>
  &nbsp;|&nbsp;
  <a href="#quick-start">Quick Start</a>
  &nbsp;|&nbsp;
  <a href="#build-and-packaging">Build</a>
  &nbsp;|&nbsp;
  <a href="#keyboard-shortcuts">Shortcuts</a>
</p>

---

## Latest Release

**Current version:** `2.8.0`

The latest release is available here:

[https://github.com/skillerious/TornTargetTrackerV2/releases/tag/v2.8.0](https://github.com/skillerious/TornTargetTrackerV2/releases/tag/v2.8.0)

v2.8.0 is a quality-of-life release focused on faster target management, richer keyboard controls, cleaner target-list states, better bulk import feedback, copy actions, and updated packaging metadata.

---

## Highlights

| Area | What it does |
| --- | --- |
| Target management | Track targets with status, groups, tags, favourites, notes, difficulty, and quick actions. |
| Chain workflow | Filter and sort targets, open attack/profile pages quickly, and refresh target state during active sessions. |
| Keyboard-first UI | Use shortcuts for search, navigation, refresh, bulk import, copy actions, watch toggles, and command palette workflows. |
| Bulk import | Paste multiple IDs or Torn profile URLs, preview valid entries, detect duplicates, and avoid re-adding tracked users. |
| TornStats integration | Optional TornStats API support for spy intelligence and NPC loot timer data. |
| Bounty tools | Track bounty statistics and maintain a local bounty watchlist while the feature continues to evolve. |
| Backups | Export, import, auto-backup, restore, and optionally copy backups to a cloud storage folder. |
| Security | Stores the Torn API key locally using AES-256-GCM encryption and keeps the renderer sandboxed behind a preload bridge. |
| Desktop polish | System tray controls, native notifications, sound toggles, compact display modes, onboarding, and connection diagnostics. |

---

## Screenshots

<p align="center">
  <a href="https://youtu.be/EorhpZXEM9o?si=S_ACXfCi1m5n_KGs">
    <img src="https://raw.githubusercontent.com/Skillerious87/SwiftImageHost/main/images/TargetTrackerV2/Screenshot-2025-12-07-140203-copy.png" alt="Torn Target Tracker demo video" width="820">
  </a>
  <br>
  <em>Click the preview to watch the demo video.</em>
</p>

<table>
<tr>
<td align="center" width="50%"><strong>Home Screen</strong><br><img src="https://raw.githubusercontent.com/Skillerious87/SwiftImageHost/main/images/TargetTrackerV2/Screenshot-2025-12-07-140203.png" alt="Home screen" width="420"></td>
<td align="center" width="50%"><strong>Target Data</strong><br><img src="https://raw.githubusercontent.com/Skillerious87/SwiftImageHost/main/images/TargetTrackerV2/Screenshot-2025-12-07-140216.png" alt="Target data screen" width="420"></td>
</tr>
<tr>
<td align="center" width="50%"><strong>NPC Loot Timers</strong><br><img src="https://raw.githubusercontent.com/Skillerious87/SwiftImageHost/main/images/TargetTrackerV2/Screenshot-2025-12-07-140235.png" alt="NPC loot timers" width="420"></td>
<td align="center" width="50%"><strong>Bounty Tracker</strong><br><img src="https://raw.githubusercontent.com/Skillerious87/SwiftImageHost/main/images/TargetTrackerV2/Screenshot-2025-12-07-140244.png" alt="Bounty tracker" width="420"></td>
</tr>
<tr>
<td align="center" width="50%"><strong>Settings</strong><br><img src="https://raw.githubusercontent.com/Skillerious87/SwiftImageHost/main/images/TargetTrackerV2/Screenshot-2025-12-07-140253.png" alt="Settings" width="420"></td>
<td align="center" width="50%"><strong>Connection Dialog</strong><br><img src="https://raw.githubusercontent.com/Skillerious87/SwiftImageHost/main/images/TargetTrackerV2/Screenshot-2025-12-07-140319.png" alt="Connection dialog" width="420"></td>
</tr>
</table>

---

## What Is New In v2.8.0

- Updated the application version to `2.8.0`.
- Added faster target search controls with `Ctrl+F`, `/`, and improved `Escape` handling.
- Added richer keyboard navigation with `Home`, `End`, `PageUp`, and `PageDown`.
- Added `W` to toggle watch state on the selected target.
- Added `Ctrl+Shift+C` to copy selected target IDs.
- Added context-menu actions for copying target IDs, Torn profile links, and Torn attack links.
- Added command-palette actions for bulk import, target search, clearing filters, copy actions, visible selection, logs, and quick target commands.
- Improved bulk import preview with duplicate and already-tracked detection.
- Added better target-list empty states with direct actions.
- Added saved sidebar collapsed-section state.
- Added active sort-direction indicators.
- Reduced notification noise with toast deduplication and a visible toast cap.
- Added safer async command handling.
- Added Inno Setup metadata for producing `TornTargetTrackerSetup-2.8.0.exe`.

---

## Quick Start

```bash
git clone https://github.com/skillerious/TornTargetTrackerV2.git
cd TornTargetTrackerV2
npm install
npm start
```

For development mode:

```bash
npm run dev
```

---

## Download And Install

1. Open the [v2.8.0 release page](https://github.com/skillerious/TornTargetTrackerV2/releases/tag/v2.8.0).
2. Download the Windows installer asset.
3. Run the installer.
4. Launch Torn Target Tracker.
5. Add your Torn API key in Settings.

If the app is already running, close it before installing the new version.

---

## Configuration

### Torn API Key

1. Create a Torn API key with the permissions needed for your workflow.
2. Open Settings in Torn Target Tracker.
3. Paste the key and validate it.
4. The key is encrypted before being saved locally.

Torn API keys can be managed from:

[https://www.torn.com/preferences.php#tab=api](https://www.torn.com/preferences.php#tab=api)

### TornStats API Key

TornStats support is optional. Add a `TS_` TornStats API key in Settings if you want NPC loot data and spy intelligence features.

---

## Main Features

### Targets

- Add targets manually or through bulk import.
- Track target status, level, faction, notes, groups, tags, favourites, and watch state.
- Open Torn profile and attack pages quickly.
- Search, filter, sort, and navigate target lists efficiently.
- Use compact display options for dense chain workflows.

### Refresh And Rate Limiting

- Manual and automatic refresh.
- Configurable refresh interval.
- Torn API rate limiting with retry and cooldown handling.
- Network and API status feedback.
- Queueing and duplicate request protection.

### Bulk Import

- Paste Torn IDs or profile URLs.
- Preview valid entries before adding.
- Detect duplicate IDs in the import text.
- Detect targets already tracked in the app.
- Avoid accidental no-op imports.

### Bounties

- View personal bounty statistics.
- Maintain a local bounty watchlist.
- Store target bounty data until entries are removed.
- Receive alert state inside the app.

The bounty area is still marked in-app as under active development, so some fields may evolve in later versions.

### Loot Timers

- Use TornStats NPC loot data.
- View boss loot levels and countdowns.
- Persist manual defeat-time adjustments.
- Track common NPC bosses from one dedicated panel.

### Backups

- Create manual backups.
- Enable scheduled automatic backups.
- Restore backup files.
- Export selected data.
- Import targets, groups, history, statistics, and safe settings.
- Copy backups to cloud-synced folders such as OneDrive, Dropbox, Google Drive, iCloud, Box, Mega, or a custom folder.

---

## Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl+N` | Add a new target |
| `Ctrl+R` | Refresh all targets |
| `Ctrl+P` | Open command palette |
| `Ctrl+F` | Focus target search |
| `/` | Focus target search when not typing in another field |
| `Ctrl+Shift+F` | Clear search and reset target filters |
| `Ctrl+Shift+B` | Open bulk import |
| `Ctrl+Shift+C` | Copy selected target IDs |
| `W` | Toggle watch for the selected target |
| `Enter` | Attack selected target |
| `Delete` | Remove selected target |
| `Up` / `Down` | Move through target list |
| `Home` / `End` | Jump to first or last target |
| `PageUp` / `PageDown` | Move by a page through the target list |
| `Escape` | Clear search, close modal, or clear current interaction |
| `F1` | Open onboarding/help |

---

## Build And Packaging

### Electron Builder

```bash
npm install
npm run build:win
```

Electron Builder outputs the Windows build into:

```text
dist
```

### Inno Setup Installer

After creating the Windows build, run:

```powershell
& "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" installer.iss
```

Expected installer output:

```text
dist\installer\TornTargetTrackerSetup-2.8.0.exe
```

### Other Build Targets

```bash
npm run build
npm run build:mac
npm run build:linux
```

Configured packaging targets:

| Platform | Target |
| --- | --- |
| Windows | NSIS via Electron Builder, plus optional Inno Setup script |
| macOS | DMG |
| Linux | AppImage |

---

## Verification

Recommended checks before publishing a build:

```powershell
node --check src\app.js
node --check main.js
node --check src\api\inputParser.js
node -e "const p=require('./package.json'); const l=require('./package-lock.json'); const v=require('./version.json'); if(p.version!==v.version||l.version!==v.version||l.packages[''].version!==v.version){throw new Error('version mismatch')} console.log(v.version)"
```

Expected version output:

```text
2.8.0
```

---

## System Requirements

| Requirement | Details |
| --- | --- |
| OS | Windows, macOS, or Linux, 64-bit |
| Development runtime | Node.js 22+ with npm |
| Packaged runtime | Electron bundles the required runtime |
| Network | HTTPS access to Torn API and, optionally, TornStats |
| Disk space | Allow several hundred MB for Electron, cache, backups, and build output |

---

## Data And Security

| Area | Details |
| --- | --- |
| API key storage | Encrypted locally using AES-256-GCM |
| Renderer security | Sandboxed renderer with a preload bridge |
| App data | Stored under the OS app-data directory |
| Backups | Stored locally with optional cloud-synced copies |
| Logs | Written to the app data logs folder |

Typical app-data locations:

| OS | Path |
| --- | --- |
| Windows | `%APPDATA%\torn-target-tracker` |
| macOS | `~/Library/Application Support/torn-target-tracker` |
| Linux | `~/.config/torn-target-tracker` |

---

## Project Structure

```text
TornTargetTrackerV2/
  assets/                  Icons, images, sounds, and boss artwork
  src/
    api/                   Torn and TornStats API clients, parsing, rate limits
    state/                 App state modules for targets, refresh, bounties, cache
    app.js                 Main renderer controller
    backup-dialog.js       Backup and restore dialog logic
    connection-dialog.js   Connection diagnostics dialog
    splash.js              Splash screen logic
    tray-menu.js           Tray menu helpers
  styles/                  Application, backup, connection, and splash styles
  index.html               Main app shell
  main.js                  Electron main process
  preload.js               Secure IPC bridge
  package.json             App metadata, scripts, and build configuration
  version.json             Current app version
  installer.iss            Inno Setup installer script
```

---

## Troubleshooting

| Problem | What to check |
| --- | --- |
| API key is rejected | Confirm the key is valid and has the permissions required by the features you use. |
| Targets do not refresh | Check internet access, Torn API availability, and the app rate-limit status. |
| TornStats data is missing | Confirm your TornStats key starts with `TS_` and TornStats is reachable. |
| Notifications do not show | Check app settings and operating system notification permissions. |
| Build fails | Run `npm install`, confirm Node.js 22+, and retry from a clean terminal. |
| Installer script fails | Confirm Inno Setup 6 is installed and `dist\win-unpacked` exists. |

---

## Support

Use GitHub Issues for bugs, feature requests, and release feedback:

[https://github.com/skillerious/TornTargetTrackerV2/issues](https://github.com/skillerious/TornTargetTrackerV2/issues)

When reporting a bug, include:

- App version
- Operating system
- Steps to reproduce
- Expected result
- Actual result
- Relevant log details if available

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

<p align="center">
  <em>Not affiliated with Torn.com. Use responsibly and follow Torn's rules and API terms.</em>
</p>

<p align="center">
  <a href="#torn-target-tracker">Back to top</a>
</p>
