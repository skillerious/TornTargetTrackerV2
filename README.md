# Torn Target Tracker

<p align="center">
  <img src="https://raw.githubusercontent.com/skillerious/TornTargetTrackerV2/main/assets/logomain.png" alt="Torn Target Tracker Logo" width="360">
</p>

<p align="center">
  <strong>Premium VS Code-inspired Electron desktop app for Torn.com chain targets.</strong><br/>
  Live status tracking, smart rate limiting, encrypted API key storage, bounty monitoring, and a keyboard-first workflow.
</p>

<p align="center">
  <a href="https://github.com/skillerious/TornTargetTrackerV2/releases"><img src="https://img.shields.io/badge/Version-2.7.9-7a5af8?style=for-the-badge" alt="Version 2.7.9"/></a>
  <a href="#license"><img src="https://img.shields.io/badge/License-MIT-3fb950?style=for-the-badge" alt="License MIT"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Electron-39.2.5-2b9af3?style=for-the-badge&logo=electron&logoColor=white" alt="Electron 39.2.5"/></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-22%2B-43853d?style=flat-square&logo=node.js&logoColor=white" alt="Node 22+"/>
  <img src="https://img.shields.io/badge/Windows-0078D6?style=flat-square&logo=windows&logoColor=white" alt="Windows"/>
  <img src="https://img.shields.io/badge/macOS-000000?style=flat-square&logo=apple&logoColor=white" alt="macOS"/>
  <img src="https://img.shields.io/badge/Linux-FCC624?style=flat-square&logo=linux&logoColor=black" alt="Linux"/>
  <img src="https://img.shields.io/badge/Chromium-142-4285F4?style=flat-square&logo=googlechrome&logoColor=white" alt="Chromium 142"/>
</p>

---

<p align="center">
  <a href="https://youtu.be/EorhpZXEM9o?si=S_ACXfCi1m5n_KGs">
    <img
      src="https://raw.githubusercontent.com/Skillerious87/SwiftImageHost/main/images/TargetTrackerV2/Screenshot-2025-12-07-140203-copy.png"
      alt="Torn Target Tracker — Demo video"
      width="820"
    />
  </a>
  <br/>
  <em>Click to watch the demo video</em>
</p>

---

## Table of Contents

- [Highlights](#highlights)
- [Screenshots](#screenshots)
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

---

## Highlights

<table>
<tr>
<td width="50%">

### Core Features
- VS Code-style chrome with dark theme
- Activity bar and sidebar navigation
- Command palette for quick actions (`Ctrl+P`)
- One-click attack/profile actions
- Keyboard-first navigation

</td>
<td width="50%">

### Target Management
- Up to **500 targets** with nicknames & notes
- Groups, tags, favorites, difficulty ratings
- Bulk import via comma/newline separated IDs
- Live status refresh with smart filters

</td>
</tr>
<tr>
<td width="50%">

### Tracking & Monitoring
- Bounty monitoring with alert thresholds
- Attack history tracking & statistics
- Chain progress monitoring
- TornStats API integration

</td>
<td width="50%">

### Security & Backup
- API key encrypted (AES-256-GCM)
- Sandboxed renderer with IPC bridge
- Auto/manual backups
- Cloud storage support (Google Drive, Dropbox, OneDrive)

</td>
</tr>
</table>

---

## Screenshots

<table>
<tr>
<td align="center" width="50%">
<strong>Home Screen</strong><br/>
<img src="https://raw.githubusercontent.com/Skillerious87/SwiftImageHost/main/images/TargetTrackerV2/Screenshot-2025-12-07-140203.png" alt="Home Screen" width="420"/>
</td>
<td align="center" width="50%">
<strong>Target Data Screen</strong><br/>
<img src="https://raw.githubusercontent.com/Skillerious87/SwiftImageHost/main/images/TargetTrackerV2/Screenshot-2025-12-07-140216.png" alt="Target Data Screen" width="420"/>
</td>
</tr>
<tr>
<td align="center" width="50%">
<strong>NPC Loot Timers</strong><br/>
<img src="https://raw.githubusercontent.com/Skillerious87/SwiftImageHost/main/images/TargetTrackerV2/Screenshot-2025-12-07-140235.png" alt="NPC Loot Timers" width="420"/>
</td>
<td align="center" width="50%">
<strong>Bounty Tracker</strong><br/>
<img src="https://raw.githubusercontent.com/Skillerious87/SwiftImageHost/main/images/TargetTrackerV2/Screenshot-2025-12-07-140244.png" alt="Bounty Tracker" width="420"/>
</td>
</tr>
<tr>
<td align="center" width="50%">
<strong>Settings (Cloud Backup)</strong><br/>
<img src="https://raw.githubusercontent.com/Skillerious87/SwiftImageHost/main/images/TargetTrackerV2/Screenshot-2025-12-07-140253.png" alt="Settings Cloud Backup" width="420"/>
</td>
<td align="center" width="50%">
<strong>Help Section</strong><br/>
<img src="https://raw.githubusercontent.com/Skillerious87/SwiftImageHost/main/images/TargetTrackerV2/Screenshot-2025-12-07-140300.png" alt="Help Section" width="420"/>
</td>
</tr>
<tr>
<td align="center" width="50%">
<strong>About Dialog</strong><br/>
<img src="https://raw.githubusercontent.com/Skillerious87/SwiftImageHost/main/images/TargetTrackerV2/Screenshot-2025-12-07-140307.png" alt="About Dialog" width="420"/>
</td>
<td align="center" width="50%">
<strong>Connection Dialog</strong><br/>
<img src="https://raw.githubusercontent.com/Skillerious87/SwiftImageHost/main/images/TargetTrackerV2/Screenshot-2025-12-07-140319.png" alt="Connection Dialog" width="420"/>
</td>
</tr>
<tr>
<td align="center" width="50%">
<strong>Onboarding Dialog</strong><br/>
<img src="https://raw.githubusercontent.com/Skillerious87/SwiftImageHost/main/images/TargetTrackerV2/Screenshot-2025-12-07-140331.png" alt="Onboarding Dialog" width="420"/>
</td>
<td align="center" width="50%">
<strong>Attack Prevention Dialog</strong><br/>
<img src="https://raw.githubusercontent.com/Skillerious87/SwiftImageHost/main/images/TargetTrackerV2/Screenshot-2025-12-07-140348.png" alt="Attack Prevention Dialog" width="420"/>
</td>
</tr>
</table>

---

## Feature Snapshot

| Area | Highlights |
|:-----|:-----------|
| **Target Management** | Nicknames, notes, groups, tags, favorites, difficulty ratings (up to 500 targets) |
| **Status Updates** | Auto-refresh with configurable interval, one-click manual refresh, connection monitoring |
| **Quick Filters** | All targets, attackable, in hospital, traveling |
| **Actions** | Attack, open profile, refresh, delete, bulk operations |
| **Bounty Tracking** | Monitor bounties, set alert thresholds, receive notifications |
| **Attack Tracker** | Track chain progress, completion monitoring |
| **Statistics** | Total attacks, targets added/removed, API calls tracking |
| **Reliability** | Rate limiter (99 req/60s), exponential backoff, jitter, `Retry-After` support |
| **Security** | Encrypted API key storage, sandboxed renderer with IPC bridge |
| **Backup** | Automatic daily/weekly backups, cloud storage support (Google Drive, Dropbox, OneDrive) |
| **UX** | VS Code-inspired layout, keyboard-first navigation, compact mode, system tray, command palette |

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/skillerious/TornTargetTrackerV2.git
cd TornTargetTrackerV2

# Install dependencies
npm install

# Run the app
npm start
```

> **Prerequisites:** Node.js 22+ (npm included). No global installs needed.

---

## System Requirements

| Requirement | Details |
|:------------|:--------|
| **OS** | Windows, macOS, or Linux (64-bit) |
| **Runtime** | Node.js 22+ for development; packaged apps bundle Electron |
| **Disk** | ~350 MB free for Electron runtime and cache |
| **Network** | Outbound HTTPS to Torn.com API |

---

## Configuration

### API Key

1. Create a Torn API key with at least **Public** access: [https://www.torn.com/preferences.php#tab=api](https://www.torn.com/preferences.php#tab=api)
2. In the app, open **Settings** (gear in the activity bar)
3. Paste your key and click **Validate** — the key is encrypted before saving

### TornStats API Key (Optional)

For enhanced target intelligence data, you can optionally configure a TornStats API key in Settings.

### Settings Reference

<details>
<summary><strong>Click to expand settings table</strong></summary>

| Setting | Description | Default |
|:--------|:------------|:--------|
| **Refresh** | | |
| Auto Refresh | Automatically refresh target statuses | Enabled |
| Refresh Interval | Seconds between auto-refreshes | 30 |
| API Rate Limit | Requests per minute (1-99) | 80 |
| **Notifications** | | |
| Notifications | System popup alerts when targets become attackable | Enabled |
| Sound | Play audio notifications | Disabled |
| **Display** | | |
| Compact Mode | Smaller, denser list items | Enabled |
| Show Avatars | Display player avatars in target list | Enabled |
| Timestamp Format | 12-hour or 24-hour time display | 12h |
| **Safety** | | |
| Confirm Before Attack | Show confirmation dialog before attacking | Disabled |
| Confirm Before Delete | Show confirmation dialog before removing targets | Enabled |
| **Backup** | | |
| Auto Backup | Enable automatic scheduled backups | Disabled |
| Backup Interval | Days between automatic backups | 7 |
| Backup Retention | Number of backup files to keep | 10 |
| **System** | | |
| Minimize to Tray | Hide to system tray when minimized | Disabled |

</details>

---

## Usage

### Add Targets

1. Click **+** in the sidebar header or press `Ctrl+N`
2. Enter the target User ID (from their profile URL)
3. Optionally add a nickname, notes, and assign to a group
4. Click **Add Target**

> **Tip:** You can bulk import multiple targets by entering multiple IDs separated by commas or newlines.

### Manage Targets

| Action | Description |
|:-------|:------------|
| **Select** | Click a target to view details |
| **Attack** | Use the attack action or press `Enter` to open the attack page |
| **Profile** | Open the Torn profile for the selected target |
| **Refresh** | Update a single target's status |
| **Remove** | Delete the target via `Delete` or the remove action |
| **Favorite** | Mark targets as favorites for quick access |
| **Groups** | Organize targets into custom groups |
| **Tags** | Add custom tags for categorization |

### Quick Filters

- **All Targets** — Full list
- **Attackable** — Targets with "Okay" status
- **In Hospital** — Hospitalized targets
- **Traveling** — Currently abroad

### Views

Access different views via the activity bar:

| View | Purpose |
|:-----|:--------|
| **Targets** | Main target list and management |
| **History** | View attack history and activity log |
| **Statistics** | Track total attacks, targets added/removed, API calls |
| **Bounties** | Monitor bounties with alert thresholds |
| **Loot Timer** | Timer functionality for loot-related activities |
| **Settings** | Configure app settings and API keys |
| **Help** | Access help documentation |

### Attack Tracker

During chain attacks, use the Attack Tracker to monitor your progress:

- Start tracking before a chain session
- Track target completion as you work through your list
- Reset when starting a new chain

### Bounty Monitoring

- Add targets to your bounty watchlist
- Set custom alert thresholds for bounty values
- Receive notifications when bounties meet your criteria

### Workflow Recipes

| Workflow | Strategy |
|:---------|:---------|
| **Chain prep** | Filter to **Attackable**, sort by last seen, open attack pages in sequence |
| **Recon** | Add notes per target (weapons, armor, boosts), keep **Compact Mode** on for density |
| **Travel watch** | Filter **Traveling**, keep auto-refresh enabled for return alerts |
| **Cooldown-aware pushes** | When a cooldown is applied, leave auto-refresh on; the limiter will resume automatically |
| **Bounty hunting** | Monitor the Bounties view, set alert thresholds, get notified when high-value bounties appear |

---

## Keyboard Shortcuts

| Key | Action |
|:----|:-------|
| `Ctrl+N` | Add new target |
| `Ctrl+R` | Refresh all targets |
| `Ctrl+P` | Open command palette |
| `Enter` | Attack selected target |
| `Delete` | Remove selected target |
| `↑` / `↓` | Navigate target list |
| `Escape` | Deselect or close modal |

---

## Technical Notes

### Rate Limiting

| Parameter | Value |
|:----------|:------|
| **Default rate** | 80 requests per minute (configurable 1-99) |
| **Hard limit** | 99 requests per 60 seconds |
| **Cooldown** | 65-second cooldown after limit hit |
| **Min delay** | 800ms between requests |
| **Backoff** | Exponential (1-60s) with jitter |
| **Retry-After** | Automatically respected |
| **Deduplication** | Prevents duplicate in-flight requests |

### Data and Security

**Storage Locations:**
| OS | Path |
|:---|:-----|
| Windows | `%APPDATA%\torn-target-tracker` |
| macOS | `~/Library/Application Support/torn-target-tracker` |
| Linux | `~/.config/torn-target-tracker` |

**Security Features:**
- API key encrypted with **AES-256-GCM** before writing to disk
- Daily log files stored in the `logs` subdirectory
- Sandboxed renderer with IPC bridge
- User-friendly error handling for invalid keys, rate limiting, and network issues

**Backup Options:**
- Manual export/import in JSON format
- Automatic backups with configurable interval and retention
- Cloud storage support (Google Drive, Dropbox, OneDrive)

### Tech Stack

| Component | Version | Description |
|:----------|:--------|:------------|
| Electron | 39.2.5 | Desktop shell with Chromium 142 & Node.js 22.21.1 |
| Node.js | 22+ | JavaScript runtime |
| electron-store | 8.2.0 | Encrypted persistent storage |
| uuid | 11.0.3 | Unique target identifiers |
| electron-builder | 25.1.8 | Packaging and distribution |

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Renderer (src/app.js)                                      │
│  └─ UI Controller • Event handling • State subscriptions    │
└─────────────────────┬───────────────────────────────────────┘
                      │ IPC (whitelisted channels)
┌─────────────────────▼───────────────────────────────────────┐
│  Preload Bridge (preload.js)                                │
│  └─ Validates/whitelists IPC • Shields renderer from Node   │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│  Main Process (main.js)                                     │
│  ├─ Window management        ├─ Encryption (AES-256-GCM)    │
│  ├─ File system (backups)    └─ System tray & notifications │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│  State Management (src/state/)                              │
│  ├─ core.js      → Central data store & events              │
│  ├─ targets.js   → Target CRUD operations                   │
│  ├─ refresh.js   → Auto-refresh scheduling                  │
│  ├─ bounties.js  → Bounty tracking                          │
│  └─ cache.js     → Target caching (15-min TTL)              │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│  API Layer (src/api/)                                       │
│  ├─ tornApi.js      → Torn API client with retry logic      │
│  ├─ tornStatsApi.js → TornStats integration                 │
│  ├─ rateLimiter.js  → Fixed window (99 req/60s)             │
│  └─ config.js       → API configuration                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Project Structure

<details>
<summary><strong>Click to expand project tree</strong></summary>

```
torn-tracker/
├── main.js                   # Electron main process
├── preload.js                # Secure IPC bridge
├── preload-connection.js     # Connection window bridge
├── preload-backup.js         # Backup window bridge
├── index.html                # Main application window
├── connection.html           # Connection test window
├── splash.html               # Splash screen
├── package.json              # Project metadata & dependencies
├── version.json              # App version tracking
│
├── src/
│   ├── app.js                # UI controller
│   │
│   ├── api/                  # Torn API integration
│   │   ├── config.js         # API configuration & constants
│   │   ├── errors.js         # Custom error classes
│   │   ├── rateLimiter.js    # Rate limiting logic
│   │   ├── inputParser.js    # User input validation
│   │   ├── targetInfo.js     # Target data model
│   │   ├── tornApi.js        # Main API client
│   │   ├── tornStatsApi.js   # TornStats API client
│   │   └── index.js          # Module exports
│   │
│   └── state/                # Application state management
│       ├── core.js           # Core AppState class
│       ├── targets.js        # Target CRUD operations
│       ├── refresh.js        # Auto-refresh logic
│       ├── bounties.js       # Bounty tracking
│       ├── attackTracker.js  # Attack chain tracking
│       ├── cache.js          # Target caching
│       └── index.js          # State initialization
│
├── styles/
│   └── app.css               # VS Code theme styles
│
└── assets/                   # Media files
    ├── logo.ico              # Windows icon
    ├── icon.icns             # macOS icon
    ├── icon.png              # Linux icon
    ├── logomain.png          # Main logo
    ├── *.wav                 # Audio notifications
    └── menu-*.svg            # Menu icons
```

</details>

---

## Development

```bash
# Install dependencies
npm install

# Run in development
npm run dev

# Run in production mode locally
npm start
```

**Tips:**
- Keep Torn API usage within limits during development; the rate limiter is enabled but respect Torn's terms
- If you add new IPC channels, mirror them in `preload.js` to keep the renderer sandboxed

---

## Verification

Fast sanity check before opening a PR:

1. `npm install`
2. `npm run dev` and add two test targets (OK + hospitalized) to confirm filters
3. Toggle **Compact Mode** and **Auto Refresh** in Settings to verify persistence after reload
4. Kill network temporarily; confirm the app shows a friendly error and recovers when back online

---

## Build and Packaging

```bash
# Install builder (dev dependency)
npm install --save-dev electron-builder

# Build for current platform
npm run build

# Platform-specific builds
npm run build:win    # Windows installer (nsis)
npm run build:mac    # macOS dmg
npm run build:linux  # Linux AppImage
```

**Builder Configuration:**

| Property | Value |
|:---------|:------|
| `appId` | `com.torn.target-tracker` |
| `productName` | `Torn Target Tracker` |
| `output` | `dist` |
| **Windows** | `nsis` installer |
| **macOS** | `dmg` package |
| **Linux** | `AppImage` |

**Release Checklist:**
- [ ] Bump version in `package.json`
- [ ] Run `npm run build`
- [ ] Smoke-test the generated artifact
- [ ] Draft release notes with Torn API changes, if any

---

## Troubleshooting

| Issue | Solution |
|:------|:---------|
| **"API key not configured"** | Open Settings and add your Torn API key |
| **"Rate limit exceeded"** | Wait; the app auto-retries after cooldown/backoff. Lower the rate limit in Settings if frequent |
| **"User not found"** | Verify the User ID in the target URL |
| **App will not start** | Confirm Node.js is installed and rerun `npm install` |
| **Blank window** | Delete the app data folder to reset config, then relaunch |
| **Notifications not working** | Check Settings and OS notification permissions |
| **Connection issues** | Use the connection test feature; check the status bar |
| **Targets not refreshing** | Verify auto-refresh is enabled; check rate limiter status |

---

## FAQ

<details>
<summary><strong>Does the app store my API key?</strong></summary>

Yes, encrypted locally using AES-256-GCM in your OS app data folder.
</details>

<details>
<summary><strong>Does it work while minimized?</strong></summary>

Yes, background refresh continues if auto-refresh is enabled. Enable "Minimize to Tray" to hide to the system tray.
</details>

<details>
<summary><strong>Can I change refresh speed?</strong></summary>

Yes, adjust **Refresh Interval** in Settings (default 30 seconds).
</details>

<details>
<summary><strong>Why am I seeing cooldowns?</strong></summary>

The app enforces Torn's 99 requests/60s limit with cooldowns and retries. You can adjust the rate limit in Settings.
</details>

<details>
<summary><strong>How many targets can I track?</strong></summary>

Up to 500 targets.
</details>

<details>
<summary><strong>Can I organize targets into groups?</strong></summary>

Yes, create custom groups and assign targets to them.
</details>

<details>
<summary><strong>Does it support TornStats?</strong></summary>

Yes, you can add a TornStats API key for enhanced target intelligence.
</details>

<details>
<summary><strong>Can I backup my data?</strong></summary>

Yes, the app supports automatic and manual backups with cloud storage options (Google Drive, Dropbox, OneDrive).
</details>

<details>
<summary><strong>What's the Attack Tracker for?</strong></summary>

It helps you track progress during chain attacks so you know which targets you've already hit.
</details>

<details>
<summary><strong>How do I request a feature?</strong></summary>

Open an issue with details on the workflow you need.
</details>

---

## Contributing

Pull requests and issue reports are welcome!

- Keep changes small and focused
- Include repro steps and expected/actual behavior for bugs
- Follow the existing code style; prefer small, pure functions in renderer logic

---

## Support

- Open a [GitHub issue](https://github.com/skillerious/TornTargetTrackerV2/issues) for bugs or feature requests
- Include logs, OS, app version, and steps to reproduce when reporting problems

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

<p align="center">
  <em>Not affiliated with Torn.com. Use responsibly and follow Torn's terms of service.</em>
</p>

<p align="center">
  <a href="#torn-target-tracker">Back to top ↑</a>
</p>
