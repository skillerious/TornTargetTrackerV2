/**
 * Torn Target Tracker - Main Process (Enhanced v2.0)
 * Premium VS Code-styled Electron Application
 * 
 * Features:
 * - Encrypted API key storage (AES-256-GCM)
 * - Auto-backup system
 * - Comprehensive logging
 * - System tray support
 * - Native notifications
 * - Safe shutdown handling
 */

const { 
    app, 
    BrowserWindow, 
    ipcMain, 
    shell, 
    Notification,
    Menu,
    Tray,
    dialog,
    nativeTheme,
    session,
    screen
} = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const crypto = require('crypto');
const Store = require('electron-store');

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const APP_NAME = 'Torn Target Tracker';
const MAX_TARGETS = 500;
const DEFAULT_MAX_BACKUP_FILES = 10;
const MIN_BACKUP_FILES = 3;
const MAX_BACKUP_FILES_LIMIT = 50;
const DEFAULT_AUTO_BACKUP_INTERVAL_DAYS = 7;

// Encryption configuration
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
let ENCRYPTION_KEY = null;
const MAX_TARGET_CACHE_ENTRIES = 2000;
const CACHE_DIR_NAME = 'Cache';
const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
    app.quit();
}

// ============================================================================
// LOGGING SYSTEM
// ============================================================================

class Logger {
    constructor(logDir) {
        this.logDir = logDir;
        this.ensureLogDir();
        this.currentLogFile = this.getLogFileName();
    }

    ensureLogDir() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    getLogFileName() {
        const date = new Date().toISOString().split('T')[0];
        return path.join(this.logDir, `app-${date}.log`);
    }

    formatMessage(level, message, data = null) {
        const timestamp = new Date().toISOString();
        let logLine = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        if (data) {
            logLine += ` | ${JSON.stringify(data)}`;
        }
        return logLine;
    }

    write(level, message, data = null) {
        const logLine = this.formatMessage(level, message, data) + '\n';
        
        // Update log file name if date changed
        const newLogFile = this.getLogFileName();
        if (newLogFile !== this.currentLogFile) {
            this.currentLogFile = newLogFile;
        }

        try {
            fs.appendFileSync(this.currentLogFile, logLine);
        } catch (e) {
            console.error('Failed to write log:', e);
        }

        // Also log to console in dev
        if (process.argv.includes('--dev')) {
            console.log(logLine.trim());
        }
    }

    info(message, data = null) { this.write('info', message, data); }
    warn(message, data = null) { this.write('warn', message, data); }
    error(message, data = null) { this.write('error', message, data); }
    debug(message, data = null) { this.write('debug', message, data); }
}

// ============================================================================
// STORE INITIALIZATION
// ============================================================================

const STORE_DEFAULTS = {
    targets: [],
    groups: [
        { id: 'default', name: 'All Targets', color: '#007acc', isDefault: true }
    ],
    attackHistory: [],
    settings: {
        apiKey: '',
        refreshInterval: 30,
        notifications: true,
        soundEnabled: false,
        compactMode: false,
        autoRefresh: true,
        showOfflineTargets: true,
        confirmBeforeAttack: false,
        minimizeToTray: false,
        startMinimized: false,
        maxConcurrentRequests: 3,
        theme: 'dark',
        listDensity: 'comfortable',
        timestampFormat: '12h',
        showAvatars: true,
        showStatusCountBadges: true,
        confirmBeforeDelete: true,
        tornStatsApiKey: '',
        playerLevel: null,
        playerName: '',
        playerId: null,
        autoBackupEnabled: false,
        autoBackupInterval: DEFAULT_AUTO_BACKUP_INTERVAL_DAYS,
        backupRetention: DEFAULT_MAX_BACKUP_FILES,
        backupBeforeBulk: true,
        cloudBackupEnabled: false,
        cloudBackupProvider: 'google-drive',
        cloudBackupPath: ''
    },
    windowBounds: {
        width: 1280,
        height: 800
    },
    sidebarWidth: 280,
    lastBackup: null,
    statistics: {
        totalAttacks: 0,
        targetsAdded: 0,
        targetsRemoved: 0,
        apiCallsMade: 0
    }
};

let store;

function initializeStore() {
    try {
        store = new Store({
            name: 'torn-tracker-data-v2',
            defaults: STORE_DEFAULTS
        });
        // Test that we can read from the store
        store.get('targets');
        return true;
    } catch (error) {
        console.error('Store initialization failed, attempting recovery:', error.message);
        
        // Try to delete the corrupted config file
        try {
            const storePath = path.join(app.getPath('userData'), 'torn-tracker-data-v2.json');
            if (fs.existsSync(storePath)) {
                fs.unlinkSync(storePath);
                console.log('Deleted corrupted config file');
            }
            
            // Try again
            store = new Store({
                name: 'torn-tracker-data-v2',
                defaults: STORE_DEFAULTS
            });
            return true;
        } catch (retryError) {
            console.error('Store recovery failed:', retryError.message);
            return false;
        }
    }
}

// Store will be initialized in app.whenReady()

// ============================================================================
// GLOBAL VARIABLES
// ============================================================================

let mainWindow = null;
let tray = null;
let logger = null;
let autoBackupTimer = null;
let autoBackupTimeout = null;
let isQuitting = false;
let trayMenu = null;
let trayTooltipInterval = null;
let trayStatus = {
    targets: 0,
    attackable: 0,
    lastRefresh: null,
    rateLimitStatus: null
};
let trayPopoverWindow = null;
let trayPopoverHideTimer = null;
let trayMenuWindow = null;
let trayMenuHideTimer = null;
let lastTrayBounds = null;
let lastTrayWorkArea = null;
const TRAY_MENU_MARGIN = 8;
let trayMenuOpen = false;

// ============================================================================
// ENCRYPTION HELPERS
// ============================================================================

function initializeEncryption() {
    const userDataPath = app.getPath('userData');
    ENCRYPTION_KEY = crypto.scryptSync(
        userDataPath + '-torn-tracker-secure-key-v2',
        'torn-tracker-salt-v2',
        32
    );
}

function configureCachePath() {
    try {
        const userDataPath = app.getPath('userData');
        const cachePath = path.join(userDataPath, CACHE_DIR_NAME);
        if (!fs.existsSync(cachePath)) {
            fs.mkdirSync(cachePath, { recursive: true });
        }
        app.setPath('cache', cachePath);
        try {
            session.defaultSession?.setCachePath?.(cachePath);
        } catch (err) {
            logger?.warn?.('Could not set session cache path', { error: err.message });
        }
    } catch (error) {
        logger?.warn?.('Failed to configure cache path', { error: error.message });
    }
}

function focusMainWindow() {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) {
        mainWindow.restore();
    }
    mainWindow.show();
    mainWindow.focus();
}

function setTrayStatus(status) {
    trayStatus = { ...trayStatus, ...status };
    updateTrayTooltip();
    updateTrayContextMenu();
}

function formatRelativeTime(value) {
    if (!value) return 'never';
    const date = value instanceof Date ? value : new Date(value);
    const diff = Date.now() - date.getTime();
    if (Number.isNaN(diff)) return 'never';
    
    if (diff < 45 * 1000) return 'just now';
    const minutes = Math.round(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 48) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    return `${days}d ago`;
}

function buildTrayIntel() {
    const attackable = trayStatus.attackable || 0;
    const totalTargets = trayStatus.targets || 0;
    const readinessIcon = totalTargets === 0 ? '📂' : attackable > 0 ? '⚔️' : '🕒';

    const lastRefreshDate = trayStatus.lastRefresh ? new Date(trayStatus.lastRefresh) : null;
    const refreshAgeMinutes = lastRefreshDate
        ? (Date.now() - lastRefreshDate.getTime()) / 60000
        : null;
    let syncIcon = '🔄';
    if (refreshAgeMinutes === null) {
        syncIcon = '🟣';
    } else if (refreshAgeMinutes > 45) {
        syncIcon = '🔴';
    } else if (refreshAgeMinutes > 15) {
        syncIcon = '🟠';
    } else {
        syncIcon = '🟢';
    }
    const syncLabel = lastRefreshDate
        ? `${lastRefreshDate.toLocaleTimeString()} (${formatRelativeTime(lastRefreshDate)})`
        : 'never';

    const rate = trayStatus.rateLimitStatus;
    const ratePercent = rate?.maxTokens
        ? Math.round((rate.availableTokens / rate.maxTokens) * 100)
        : null;
    let rateIcon = '🪙';
    if (ratePercent !== null) {
        if (ratePercent <= 10) rateIcon = '🟥';
        else if (ratePercent <= 30) rateIcon = '🟧';
        else if (ratePercent <= 60) rateIcon = '🟡';
        else rateIcon = '🟢';
    }
    const rateLabel = rate
        ? `${rate.availableTokens}/${rate.maxTokens} tokens${ratePercent !== null ? ` (${ratePercent}%)` : ''}`
        : 'n/a';

    const settings = store?.get('settings', {}) || {};
    const stats = store?.get('statistics', {}) || {};

    const lastBackup = store?.get('lastBackup') || null;
    const lastBackupDate = lastBackup ? new Date(lastBackup) : null;
    const backupIcon = lastBackupDate ? '💾' : '⚠️';
    const backupLabel = lastBackupDate ? formatRelativeTime(lastBackupDate) : 'never';

    const history = store?.get('attackHistory', []) || [];
    const lastAttack = history.length ? history[history.length - 1] : null;
    const lastAttackLabel = lastAttack
        ? `${lastAttack.targetName || 'Target'} (${lastAttack.userId || '?'}) • ${formatRelativeTime(lastAttack.timestamp)}`
        : null;

    return {
        attackable,
        totalTargets,
        readinessIcon,
        syncIcon,
        syncLabel,
        rateIcon,
        rateLabel,
        ratePercent,
        backupIcon,
        backupLabel,
        lastAttack,
        lastAttackLabel,
        refreshAgeMinutes,
        notificationsEnabled: settings.notifications !== false,
        soundEnabled: !!settings.soundEnabled,
        startMinimized: !!settings.startMinimized,
        minimizeToTray: !!settings.minimizeToTray,
        stats
    };
}

const TRAY_ICONS = {
    attackable: '⚔️',
    sync: '🔄',
    rate: '🪙',
    backup: '💾',
    total: '📈',
    lastAttack: '🎯',
    window: '🪟',
    refresh: '🔁',
    quickAdd: '➕',
    settings: '⚙️',
    notifications: '🔔',
    sound: '🔊',
    startMin: '📥',
    keepTray: '📌',
    backupNow: '🧰',
    folder: '📂',
    logs: '🧾',
    quit: '⏻'
};

function trayLabel(icon, text) {
    return `${icon} ${text}`;
}

function trayLine(iconKey, primary, detail) {
    const suffix = detail ? ` • ${detail}` : '';
    return trayLabel(TRAY_ICONS[iconKey], `${primary}${suffix}`);
}

function trayToggleItem(id, iconKey, text, enabled, onClick) {
    return {
        id,
        label: trayLabel(TRAY_ICONS[iconKey], text),
        accelerator: enabled ? '✓' : '',
        click: onClick
    };
}

function traySection(title) {
    return { label: title.toUpperCase(), enabled: false };
}

function trayStatusRow(iconKey, primary, detail) {
    const safePrimary = primary === undefined || primary === null ? 'n/a' : primary;
    return { label: trayLine(iconKey, safePrimary, detail || null), enabled: false };
}

function cleanMenu(items) {
    const menu = [];
    let lastWasSeparator = true;

    for (const item of items) {
        if (!item) continue;
        if (item.type === 'separator') {
            if (lastWasSeparator) continue;
            lastWasSeparator = true;
        } else {
            lastWasSeparator = false;
        }
        menu.push(item);
    }

    if (menu.length && menu[menu.length - 1].type === 'separator') {
        menu.pop();
    }

    return menu;
}

function encrypt(text) {
    if (!text || !ENCRYPTION_KEY) return '';
    try {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag();
        return `v2:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (e) {
        logger?.error('Encryption failed', { error: e.message });
        return '';
    }
}

function decrypt(encryptedText) {
    if (!encryptedText || !ENCRYPTION_KEY) return '';
    try {
        // Handle versioned encryption
        const parts = encryptedText.split(':');
        let iv, authTag, encrypted;
        
        if (parts[0] === 'v2' && parts.length === 4) {
            iv = Buffer.from(parts[1], 'hex');
            authTag = Buffer.from(parts[2], 'hex');
            encrypted = parts[3];
        } else if (parts.length === 3) {
            // Legacy format
            iv = Buffer.from(parts[0], 'hex');
            authTag = Buffer.from(parts[1], 'hex');
            encrypted = parts[2];
        } else {
            return '';
        }

        const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) {
        logger?.error('Decryption failed', { error: e.message });
        return '';
    }
}

// ============================================================================
// ATTACK HISTORY HELPERS
// ============================================================================

function generateAttackRecordId() {
    return `atk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeTimestamp(value) {
    const date = value ? new Date(value) : new Date();
    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function buildAttackRecord(record = {}) {
    const timestamp = normalizeTimestamp(record.timestamp);
    return {
        id: record.id || generateAttackRecordId(),
        userId: Number(record.userId) || 0,
        targetName: record.targetName || `User ${record.userId || '?'}`,
        type: record.type || 'attack',
        timestamp,
        source: record.source || 'manual',
        status: record.status || record.targetStatus || 'unknown',
        statusDesc: record.statusDesc || '',
        statusUntil: record.statusUntil || null,
        level: Number.isFinite(record.level) ? record.level : null,
        groupId: record.groupId || 'default',
        groupName: record.groupName || '',
        notes: record.notes || ''
    };
}

function sanitizeAttackHistory(history = []) {
    const cleaned = [];
    const seenIds = new Set();
    const seenBuckets = new Set();
    let removedDuplicates = 0;

    history.forEach(item => {
        if (!item || !item.userId) return;

        // Use a coarse bucket for legacy duplicate entries without ids
        const bucketDate = new Date(item.timestamp || Date.now());
        const bucketKey = `${item.userId}-${Math.floor(bucketDate.getTime() / 1000)}`;
        const recordHasId = !!item.id;

        if ((recordHasId && seenIds.has(item.id)) || (!recordHasId && seenBuckets.has(bucketKey))) {
            removedDuplicates++;
            return;
        }

        const record = buildAttackRecord(item);
        cleaned.push(record);

        if (recordHasId) {
            seenIds.add(record.id);
        } else {
            seenBuckets.add(bucketKey);
            seenIds.add(record.id);
        }
    });

    cleaned.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    let trimmed = 0;
    if (cleaned.length > 1000) {
        trimmed = cleaned.length - 1000;
        cleaned.splice(0, trimmed);
    }

    return { history: cleaned, removedDuplicates, trimmed };
}

// ============================================================================
// BACKUP SYSTEM
// ============================================================================

const CLOUD_BACKUP_SUBDIR = 'TornTargetTracker';
const CLOUD_PROVIDER_PRESETS = {
    'google-drive': {
        label: 'Google Drive',
        win: ['Google Drive', 'My Drive', path.join('Google Drive', 'My Drive')],
        mac: ['Google Drive', path.join('Google Drive', 'My Drive'), path.join('Library', 'CloudStorage', 'GoogleDrive-MyDrive')],
        linux: ['Google Drive', 'My Drive']
    },
    dropbox: {
        label: 'Dropbox',
        win: ['Dropbox', 'Dropbox (Personal)', path.join('Dropbox (Personal)', 'Dropbox'), path.join('Dropbox', 'My PC')],
        mac: ['Dropbox', 'Dropbox (Personal)'],
        linux: ['Dropbox']
    },
    onedrive: {
        label: 'OneDrive',
        win: ['OneDrive', 'OneDrive - Personal', 'OneDrive - Microsoft', path.join('OneDrive', 'Documents')],
        mac: ['OneDrive', path.join('Library', 'CloudStorage', 'OneDrive')],
        linux: ['OneDrive']
    },
    'icloud-drive': {
        label: 'iCloud Drive',
        win: ['iCloudDrive'],
        mac: [path.join('Library', 'Mobile Documents', 'com~apple~CloudDocs'), path.join('Library', 'CloudStorage', 'iCloud Drive')],
        linux: []
    },
    box: {
        label: 'Box',
        win: ['Box', path.join('Box', 'Box Sync')],
        mac: ['Box', 'Box Sync'],
        linux: ['Box']
    },
    mega: {
        label: 'MEGA',
        win: ['MEGA', 'MEGA Sync', path.join('MEGA', 'My Backups')],
        mac: ['MEGA', 'MEGAsync'],
        linux: ['MEGA', 'MEGAsync']
    },
    'custom-folder': {
        label: 'Custom Folder',
        win: [],
        mac: [],
        linux: []
    }
};

function getCloudPlatformKey() {
    if (process.platform === 'win32') return 'win';
    if (process.platform === 'darwin') return 'mac';
    return 'linux';
}

function getCloudProviderLabel(provider) {
    return CLOUD_PROVIDER_PRESETS[provider]?.label || 'Cloud Folder';
}

function getCloudCandidates(provider) {
    const preset = CLOUD_PROVIDER_PRESETS[provider];
    if (!preset) return [];

    const platformKey = getCloudPlatformKey();
    const home = app.getPath('home');
    const candidates = preset[platformKey] || [];

    return candidates
        .filter(Boolean)
        .map(candidate => path.isAbsolute(candidate) ? candidate : path.join(home, candidate));
}

function resolveCloudBasePath(provider, customPath = '') {
    const trimmed = (customPath || '').trim();
    if (trimmed) {
        if (fs.existsSync(trimmed)) {
            return trimmed;
        }
    }

    const candidates = getCloudCandidates(provider);
    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }
    return null;
}

function ensureCloudBackupPath(provider, customPath = '') {
    const basePath = resolveCloudBasePath(provider, customPath);
    if (!basePath) {
        return { ok: false, reason: 'not-found', usedDefault: !customPath, basePath: null, path: null };
    }

    const customProvided = !!customPath;
    const customExists = customProvided && fs.existsSync(customPath);
    const isCandidateMatch = customProvided
        ? getCloudCandidates(provider).some(candidate => {
            try {
                return path.resolve(candidate) === path.resolve(customPath);
            } catch (error) {
                return false;
            }
        })
        : false;

    const shouldScope = !customProvided || isCandidateMatch || !customExists;
    const scopedPath = shouldScope ? path.join(basePath, CLOUD_BACKUP_SUBDIR) : basePath;

    try {
        fs.mkdirSync(scopedPath, { recursive: true });
        fs.accessSync(scopedPath, fs.constants.W_OK);
        return { ok: true, reason: null, usedDefault: shouldScope, basePath, path: scopedPath };
    } catch (error) {
        return { ok: false, reason: error.message, usedDefault: shouldScope, basePath, path: scopedPath };
    }
}

function validateCloudPath(provider, customPath = '') {
    const result = ensureCloudBackupPath(provider, customPath);
    if (!result.ok) {
        return { ok: false, provider, error: result.reason, usedDefault: result.usedDefault, basePath: result.basePath, path: result.path };
    }

    return { ok: true, provider, path: result.path, usedDefault: result.usedDefault, basePath: result.basePath };
}

function getBackupSettings() {
    const settings = store?.get('settings', {}) || {};
    const autoInterval = Number.parseInt(settings.autoBackupInterval, 10);
    return {
        autoEnabled: settings.autoBackupEnabled === true,
        intervalDays: Number.isFinite(autoInterval) ? Math.min(Math.max(autoInterval, 1), 30) : DEFAULT_AUTO_BACKUP_INTERVAL_DAYS,
        retention: getBackupRetention(settings),
        preflight: settings.backupBeforeBulk !== false,
        cloud: {
            enabled: settings.cloudBackupEnabled === true,
            provider: settings.cloudBackupProvider || 'google-drive',
            path: settings.cloudBackupPath || ''
        }
    };
}

function getBackupRetention(settings = null) {
    const source = settings || (store?.get('settings', {}) || {});
    const raw = source.backupRetention;
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed)) return DEFAULT_MAX_BACKUP_FILES;
    return Math.max(MIN_BACKUP_FILES, Math.min(MAX_BACKUP_FILES_LIMIT, parsed));
}

function getAutoBackupIntervalMs(settings = null) {
    const backupSettings = settings || getBackupSettings();
    const days = Number.isFinite(backupSettings.intervalDays) ? backupSettings.intervalDays : DEFAULT_AUTO_BACKUP_INTERVAL_DAYS;
    return days * 24 * 60 * 60 * 1000;
}

function getBackupDir() {
    return path.join(app.getPath('userData'), 'backups');
}

function ensureBackupDir() {
    const backupDir = getBackupDir();
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }
    return backupDir;
}

function createBackup(options = {}) {
    try {
        const backupSettings = getBackupSettings();
        const backupDir = ensureBackupDir();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(backupDir, `backup-${timestamp}.json`);

        const backupData = {
            version: '2.0',
            timestamp: new Date().toISOString(),
            targets: store.get('targets', []),
            groups: store.get('groups', []),
            attackHistory: store.get('attackHistory', []).slice(-1000), // Keep last 1000
            statistics: store.get('statistics', {})
        };

        fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
        store.set('lastBackup', new Date().toISOString());
        
        // Cleanup old backups
        cleanupOldBackups(backupSettings.retention);

        let cloudCopied = null;
        if (backupSettings.cloud.enabled) {
            const cloudInfo = ensureCloudBackupPath(backupSettings.cloud.provider, backupSettings.cloud.path);
            if (cloudInfo.ok && cloudInfo.path) {
                try {
                    const cloudFile = path.join(cloudInfo.path, path.basename(backupFile));
                    fs.copyFileSync(backupFile, cloudFile);
                    cloudCopied = cloudFile;
                } catch (error) {
                    cloudCopied = null;
                    logger?.warn?.('Cloud backup failed', {
                        error: error.message,
                        provider: getCloudProviderLabel(backupSettings.cloud.provider),
                        requestedProvider: backupSettings.cloud.provider,
                        path: cloudInfo.path
                    });
                }
            } else {
                logger?.warn?.('Cloud backup skipped (path unavailable)', {
                    provider: getCloudProviderLabel(backupSettings.cloud.provider),
                    requestedProvider: backupSettings.cloud.provider,
                    configuredPath: backupSettings.cloud.path || null,
                    resolutionError: cloudInfo.reason || 'not-found'
                });
            }
        }
        
        logger?.info('Backup created', { file: backupFile, reason: options.reason || 'manual', cloudCopied });
        return { success: true, file: backupFile, cloudCopied };
    } catch (e) {
        logger?.error('Backup failed', { error: e.message });
        return { success: false, error: e.message };
    }
}

function cleanupOldBackups(retention = DEFAULT_MAX_BACKUP_FILES) {
    try {
        const backupDir = getBackupDir();
        const files = fs.readdirSync(backupDir)
            .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
            .map(f => ({
                name: f,
                path: path.join(backupDir, f),
                time: fs.statSync(path.join(backupDir, f)).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time);

        // Remove backups beyond the limit
        if (files.length > retention) {
            files.slice(retention).forEach(f => {
                fs.unlinkSync(f.path);
                logger?.debug('Removed old backup', { file: f.name });
            });
        }
    } catch (e) {
        logger?.error('Backup cleanup failed', { error: e.message });
    }
}

function startAutoBackupTimer() {
    stopAutoBackupTimer();
    const backupSettings = getBackupSettings();
    if (!backupSettings.autoEnabled) return;
    const intervalMs = getAutoBackupIntervalMs(backupSettings);
    autoBackupTimer = setInterval(() => createBackup({ reason: 'auto-interval' }), intervalMs);
}

function scheduleInitialBackup() {
    if (autoBackupTimeout) {
        clearTimeout(autoBackupTimeout);
        autoBackupTimeout = null;
    }
    const backupSettings = getBackupSettings();
    if (!backupSettings.autoEnabled) return;

    const lastBackup = store?.get('lastBackup') || null;
    const intervalMs = getAutoBackupIntervalMs(backupSettings);
    const lastTime = lastBackup ? new Date(lastBackup).getTime() : 0;
    const age = lastTime ? Date.now() - lastTime : Number.POSITIVE_INFINITY;
    const overdue = age >= intervalMs;

    // If overdue, run soon; otherwise schedule close to the interval
    const delay = overdue ? 10_000 : Math.min(Math.max(intervalMs - age, 60_000), 5 * 60 * 1000);
    autoBackupTimeout = setTimeout(() => createBackup({ reason: overdue ? 'auto-startup-overdue' : 'auto-startup' }), delay);
}

function stopAutoBackupTimer() {
    if (autoBackupTimer) {
        clearInterval(autoBackupTimer);
        autoBackupTimer = null;
    }
    if (autoBackupTimeout) {
        clearTimeout(autoBackupTimeout);
        autoBackupTimeout = null;
    }
}

function listBackups() {
    try {
        const backupDir = getBackupDir();
        if (!fs.existsSync(backupDir)) return [];

        return fs.readdirSync(backupDir)
            .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
            .map(f => {
                const filePath = path.join(backupDir, f);
                const stats = fs.statSync(filePath);
                return {
                    name: f,
                    path: filePath,
                    size: stats.size,
                    created: stats.mtime.toISOString()
                };
            })
            .sort((a, b) => new Date(b.created) - new Date(a.created));
    } catch (e) {
        logger?.error('Failed to list backups', { error: e.message });
        return [];
    }
}

function restoreBackup(backupPath) {
    try {
        const data = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
        
        // Validate backup data
        if (!data.version || !data.targets) {
            throw new Error('Invalid backup file format');
        }

        // Create a backup before restoring
        createBackup({ reason: 'pre-restore' });

        // Restore data
        store.set('targets', data.targets || []);
        store.set('groups', data.groups || [{ id: 'default', name: 'All Targets', color: '#007acc', isDefault: true }]);
        const restoredHistory = sanitizeAttackHistory(data.attackHistory || []);
        store.set('attackHistory', restoredHistory.history);
        if (data.statistics) {
            store.set('statistics', data.statistics);
            if (restoredHistory.removedDuplicates > 0) {
                const stats = store.get('statistics', {});
                stats.totalAttacks = Math.max(
                    (stats.totalAttacks || 0) - restoredHistory.removedDuplicates,
                    restoredHistory.history.length
                );
                store.set('statistics', stats);
            }
        }

        logger?.info('Backup restored', { file: backupPath, targetCount: data.targets.length });
        return { success: true, targetCount: data.targets.length };
    } catch (e) {
        logger?.error('Restore failed', { error: e.message });
        return { success: false, error: e.message };
    }
}

// ============================================================================
// AVATAR CACHE
// ============================================================================

function getAvatarDir() {
    return path.join(app.getPath('userData'), 'avatars');
}

function ensureAvatarDir() {
    const dir = getAvatarDir();
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
}

async function fetchAvatarToDisk(userId, avatarUrl) {
    ensureAvatarDir();

    let parsedUrl;
    try {
        parsedUrl = new URL(avatarUrl);
    } catch (e) {
        throw new Error('Invalid avatar URL');
    }

    const allowedExt = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
    const ext = (path.extname(parsedUrl.pathname) || '').toLowerCase();
    const safeExt = allowedExt.includes(ext) ? ext : '.jpg';
    const filePath = path.join(getAvatarDir(), `${userId}${safeExt}`);

    if (fs.existsSync(filePath)) {
        return filePath;
    }

    const response = await fetch(avatarUrl, { redirect: 'follow' });
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(filePath, buffer);
    return filePath;
}

// ============================================================================
// TARGET CACHE (PERSISTED FALLBACK)
// ============================================================================

function getTargetCachePath() {
    return path.join(app.getPath('userData'), 'target-cache.json');
}

function readTargetCache() {
    try {
        const filePath = getTargetCachePath();
        if (!fs.existsSync(filePath)) {
            return { version: 1, updated: null, targets: {} };
        }

        const raw = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(raw);
        const targets = parsed && typeof parsed.targets === 'object' ? parsed.targets : {};
        return {
            version: parsed.version || 1,
            updated: parsed.updated || null,
            targets
        };
    } catch (error) {
        logger?.warn?.('Failed to read target cache', { error: error.message });
        return { version: 1, updated: null, targets: {} };
    }
}

function sanitizeCachedTarget(entry) {
    if (!entry || typeof entry !== 'object') return null;
    const sanitized = {};
    const allowed = [
        'userId', 'name', 'customName', 'notes', 'level', 'gender', 'age',
        'statusState', 'statusDesc', 'statusReason', 'statusUntil',
        'lastActionStatus', 'lastActionRelative', 'lastActionTimestamp',
        'faction', 'factionId', 'factionPosition', 'groupId', 'tags',
        'isFavorite', 'priority', 'monitorOk', 'ok', 'error', 'lastUpdated',
        'addedAt', 'avatarUrl', 'avatarPath', 'attackCount', 'lastAttacked'
    ];

    allowed.forEach(key => {
        if (entry[key] !== undefined) {
            sanitized[key] = entry[key];
        }
    });

    // Normalize types
    sanitized.userId = parseInt(sanitized.userId, 10) || 0;
    sanitized.level = sanitized.level !== undefined ? parseInt(sanitized.level, 10) || null : null;
    sanitized.age = sanitized.age !== undefined ? parseInt(sanitized.age, 10) || null : null;
    sanitized.statusUntil = sanitized.statusUntil !== undefined ? parseInt(sanitized.statusUntil, 10) || null : null;
    sanitized.lastActionTimestamp = sanitized.lastActionTimestamp !== undefined ? parseInt(sanitized.lastActionTimestamp, 10) || null : null;
    sanitized.factionId = sanitized.factionId !== undefined ? parseInt(sanitized.factionId, 10) || null : null;
    sanitized.lastUpdated = sanitized.lastUpdated || Date.now();
    sanitized.addedAt = sanitized.addedAt || Date.now();
    sanitized.ok = !!sanitized.ok;
    sanitized.isFavorite = !!sanitized.isFavorite;
    sanitized.monitorOk = !!sanitized.monitorOk;

    if (!sanitized.userId) return null;
    return sanitized;
}

function trimTargetCache(targets) {
    const entries = Object.entries(targets || {});
    if (entries.length <= MAX_TARGET_CACHE_ENTRIES) return targets || {};

    entries.sort((a, b) => {
        const aTime = a[1]?.lastUpdated || 0;
        const bTime = b[1]?.lastUpdated || 0;
        return bTime - aTime;
    });

    const trimmed = entries.slice(0, MAX_TARGET_CACHE_ENTRIES);
    const result = {};
    trimmed.forEach(([id, data]) => {
        result[id] = data;
    });
    return result;
}

function writeTargetCache(targets) {
    const filePath = getTargetCachePath();
    const payload = {
        version: 1,
        updated: new Date().toISOString(),
        targets: trimTargetCache(targets)
    };
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
    return payload;
}

function upsertTargetCache(entries = []) {
    const cache = readTargetCache();
    const targets = { ...(cache.targets || {}) };
    let updated = 0;

    (entries || []).forEach(entry => {
        const sanitized = sanitizeCachedTarget(entry);
        if (!sanitized) return;
        const key = String(sanitized.userId);
        targets[key] = { ...sanitized, cachedAt: sanitized.cachedAt || new Date().toISOString() };
        updated++;
    });

    const payload = writeTargetCache(targets);
    return {
        success: true,
        updated,
        size: Object.keys(payload.targets || {}).length,
        path: getTargetCachePath()
    };
}

function getCachedTarget(userId) {
    const uid = parseInt(userId, 10);
    if (!uid) return null;
    const cache = readTargetCache();
    return cache.targets?.[String(uid)] || null;
}

// ============================================================================
// WINDOW CREATION
// ============================================================================

function createWindow() {
    const bounds = store.get('windowBounds');
    
    mainWindow = new BrowserWindow({
        width: bounds.width,
        height: bounds.height,
        minWidth: 960,
        minHeight: 640,
        frame: false,
        titleBarStyle: 'hidden',
        backgroundColor: '#1e1e1e',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            spellcheck: false
        },
        icon: path.join(__dirname, 'assets', 'icon.png'),
        show: false
    });

    mainWindow.loadFile('index.html');

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        if (!store.get('settings.startMinimized')) {
            mainWindow.show();
            mainWindow.maximize();
        }
        logger?.info('Application window ready');
    });

    // Save window bounds on resize
    mainWindow.on('resize', () => {
        if (!mainWindow.isMaximized()) {
            const bounds = mainWindow.getBounds();
            store.set('windowBounds', { width: bounds.width, height: bounds.height });
        }
    });

    // Handle close button
    mainWindow.on('close', (event) => {
        if (!isQuitting && store.get('settings.minimizeToTray')) {
            event.preventDefault();
            mainWindow.hide();
            return false;
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Dev tools in development
    if (process.argv.includes('--dev')) {
        mainWindow.webContents.openDevTools();
    }
}

// ============================================================================
// SYSTEM TRAY
// ============================================================================

function updateTraySetting(key, value) {
    if (!store) return;
    const settings = store.get('settings', {});
    const nextSettings = { ...settings, [key]: value };
    store.set('settings', nextSettings);

    if (key === 'minimizeToTray') {
        if (!value && tray) {
            tray.destroy();
            tray = null;
        } else if (value && !tray) {
            createTray();
        }
    }

    updateTrayContextMenu();
    updateTrayTooltip();
}

function createTray() {
    // Note: In production, use a proper .ico/.png file
    try {
        const iconPath = resolveTrayIconPath();
        tray = new Tray(iconPath);
        trayMenu = null;
        updateTrayTooltip();
        updateTrayContextMenu();
        wireTrayPopover();

        tray.on('click', () => {
            if (!mainWindow) return;
            if (mainWindow.isVisible()) {
                mainWindow.focus();
            } else {
                focusMainWindow();
            }
            updateTrayContextMenu();
        });

        tray.on('right-click', (_event, bounds) => {
            if (!tray) return;
            const intel = buildTrayIntel();
            showTrayMenu(intel, bounds || tray.getBounds());
        });

        // Tooltip updater
        if (trayTooltipInterval) {
            clearInterval(trayTooltipInterval);
            trayTooltipInterval = null;
        }
        trayTooltipInterval = setInterval(updateTrayTooltip, 5000);
    } catch (e) {
        logger?.warn('Failed to create tray', { error: e.message });
    }
}

function buildTrayMenu(intel) {
    const isVisible = mainWindow && mainWindow.isVisible();
    const needsRefresh = intel.refreshAgeMinutes === null || intel.refreshAgeMinutes > 20;
    const staleMinutes = intel.refreshAgeMinutes !== null ? Math.max(0, Math.round(intel.refreshAgeMinutes)) : null;

    const readySummary = intel.totalTargets
        ? `Ready ${intel.attackable}/${intel.totalTargets}`
        : 'No targets';
    const lifetimeDetail = intel.stats.totalAttacks ? `Lifetime ${intel.stats.totalAttacks}` : null;
    const syncPrimary = intel.syncLabel === 'never' ? 'Sync pending' : `Sync ${intel.syncLabel}`;
    const syncDetail = needsRefresh
        ? (intel.refreshAgeMinutes === null ? 'Stale' : `Stale ${staleMinutes}m`)
        : 'Fresh';
    const rateDetail = intel.ratePercent === null
        ? null
        : intel.ratePercent <= 10
            ? 'Critically low'
            : intel.ratePercent <= 30
                ? 'Low'
                : intel.ratePercent <= 60
                    ? 'Okay'
                    : 'Healthy';
    const backupPrimary = intel.backupLabel === 'never'
        ? 'Backup missing'
        : `Backup ${intel.backupLabel}`;

    const statusItems = [
        traySection('Status'),
        trayStatusRow('attackable', readySummary, lifetimeDetail),
        trayStatusRow('sync', syncPrimary, syncDetail),
        trayStatusRow('rate', `API ${intel.rateLabel}`, rateDetail),
        trayStatusRow(
            'backup',
            backupPrimary,
            intel.backupLabel === 'never' ? 'Run a backup soon' : null
        ),
        intel.lastAttackLabel
            ? {
                id: 'tray-last-attack',
                label: trayLine('lastAttack', `Last ${intel.lastAttackLabel}`),
                enabled: !!intel.lastAttack?.userId,
                click: () => {
                    if (intel.lastAttack?.userId) {
                        const url = `https://www.torn.com/profiles.php?XID=${intel.lastAttack.userId}`;
                        shell.openExternal(url);
                    }
                }
            }
            : null,
        { type: 'separator' }
    ];

    const actionItems = [
        traySection('Actions'),
        {
            id: 'tray-window',
            label: trayLabel(TRAY_ICONS.window, isVisible ? 'Hide window' : 'Show window'),
            click: () => {
                if (!mainWindow) return;
                if (mainWindow.isVisible()) {
                    mainWindow.hide();
                } else {
                    focusMainWindow();
                }
                updateTrayContextMenu();
            }
        },
        {
            id: 'tray-refresh',
            label: trayLabel(
                TRAY_ICONS.refresh,
                needsRefresh
                    ? (intel.refreshAgeMinutes === null
                        ? 'Refresh now (never synced)'
                        : `Refresh now (stale ${staleMinutes}m)`)
                    : 'Refresh now'
            ),
            click: () => {
                mainWindow?.webContents.send('trigger-refresh');
            }
        },
        {
            id: 'tray-quick-add',
            label: trayLabel(TRAY_ICONS.quickAdd, 'Quick add target (Ctrl+N)'),
            click: () => {
                focusMainWindow();
                mainWindow?.webContents.send('open-add-target');
            }
        },
        {
            id: 'tray-settings',
            label: trayLabel(TRAY_ICONS.settings, 'Settings'),
            click: () => {
                focusMainWindow();
                mainWindow?.webContents.send('open-settings');
            }
        },
        { type: 'separator' }
    ];

    const preferenceItems = [
        traySection('Toggles'),
        trayToggleItem(
            'tray-notifications',
            'notifications',
            'Notifications',
            intel.notificationsEnabled,
            () => updateTraySetting('notifications', !store.get('settings.notifications'))
        ),
        trayToggleItem(
            'tray-sound',
            'sound',
            'Sound alerts',
            intel.soundEnabled,
            () => updateTraySetting('soundEnabled', !store.get('settings.soundEnabled'))
        ),
        trayToggleItem(
            'tray-start-minimized',
            'startMin',
            'Start minimized',
            intel.startMinimized,
            () => updateTraySetting('startMinimized', !store.get('settings.startMinimized'))
        ),
        trayToggleItem(
            'tray-keep-tray',
            'keepTray',
            'Keep in tray',
            intel.minimizeToTray,
            () => updateTraySetting('minimizeToTray', !store.get('settings.minimizeToTray'))
        ),
        { type: 'separator' }
    ];

    const maintenanceItems = [
        traySection('Maintenance'),
        {
            id: 'tray-backup-now',
            label: trayLabel(TRAY_ICONS.backupNow, 'Backup now'),
            click: () => {
                const result = createBackup();
                if (!result.success) {
                    dialog.showErrorBox('Backup Failed', result.error || 'Unknown error');
                } else {
                    showNotification('Backup created', path.basename(result.file));
                }
                updateTrayContextMenu();
            }
        },
        {
            id: 'tray-open-backups',
            label: trayLabel(TRAY_ICONS.folder, 'Backup folder'),
            click: () => {
                const dir = ensureBackupDir();
                shell.openPath(dir);
            }
        },
        {
            id: 'tray-open-logs',
            label: trayLabel(TRAY_ICONS.logs, 'Logs folder'),
            click: () => {
                const logDir = path.join(app.getPath('userData'), 'logs');
                shell.openPath(logDir);
            }
        },
        { type: 'separator' }
    ];

    const footerItems = [
        traySection('App'),
        {
            id: 'tray-quit',
            label: trayLabel(TRAY_ICONS.quit, 'Quit'),
            click: () => {
                isQuitting = true;
                app.quit();
            }
        }
    ];

    const menuTemplate = cleanMenu([
        ...statusItems,
        ...actionItems,
        ...preferenceItems,
        ...maintenanceItems,
        ...footerItems
    ]);

    return Menu.buildFromTemplate(menuTemplate);
}

function updateTrayContextMenu() {
    if (!tray) return;
    const intel = buildTrayIntel();

    // Always rebuild the menu with fresh data to ensure it's up-to-date
    // The menu is shown via popUpContextMenu to control placement
    trayMenu = buildTrayMenu(intel);
}

function updateTrayTooltip() {
    if (!tray) return;

    // Build simple tooltip with minimal information
    const attackable = trayStatus.attackable || 0;
    const totalTargets = trayStatus.targets || 0;

    const lastRefreshDate = trayStatus.lastRefresh ? new Date(trayStatus.lastRefresh) : null;
    const refreshText = lastRefreshDate ? formatRelativeTime(lastRefreshDate) : 'never';

    const tooltipText = `Torn Target Tracker\nAttackable: ${attackable}/${totalTargets}\nLast refresh: ${refreshText}`;
    tray.setToolTip(tooltipText);
}

function closeTrayMenu() {
    clearTimeout(trayMenuHideTimer);
    trayMenuHideTimer = null;
    trayMenuOpen = false;
    if (trayMenuWindow) {
        trayMenuWindow.destroy();
        trayMenuWindow = null;
    }
    scheduleHideTrayPopover(0, true);
}

function handleTrayMenuAction(id) {
    switch (id) {
        case 'tray-window':
            if (!mainWindow) break;
            if (mainWindow.isVisible()) {
                mainWindow.hide();
            } else {
                focusMainWindow();
            }
            break;
        case 'tray-refresh':
            mainWindow?.webContents.send('trigger-refresh');
            break;
        case 'tray-quick-add':
            focusMainWindow();
            mainWindow?.webContents.send('open-add-target');
            break;
        case 'tray-settings':
            focusMainWindow();
            mainWindow?.webContents.send('open-settings');
            break;
        case 'tray-notifications':
            updateTraySetting('notifications', !store.get('settings.notifications'));
            break;
        case 'tray-sound':
            updateTraySetting('soundEnabled', !store.get('settings.soundEnabled'));
            break;
        case 'tray-start-minimized':
            updateTraySetting('startMinimized', !store.get('settings.startMinimized'));
            break;
        case 'tray-keep-tray':
            updateTraySetting('minimizeToTray', !store.get('settings.minimizeToTray'));
            break;
        case 'tray-backup-now': {
            const result = createBackup();
            if (!result.success) {
                dialog.showErrorBox('Backup Failed', result.error || 'Unknown error');
            } else {
                showNotification('Backup created', path.basename(result.file));
            }
            break;
        }
        case 'tray-open-backups': {
            const dir = ensureBackupDir();
            shell.openPath(dir);
            break;
        }
        case 'tray-open-logs': {
            const logDir = path.join(app.getPath('userData'), 'logs');
            shell.openPath(logDir);
            break;
        }
        case 'tray-quit':
            isQuitting = true;
            app.quit();
            break;
        case 'tray-last-attack':
            try {
                const history = store?.get('attackHistory', []) || [];
                const last = history.length ? history[history.length - 1] : null;
                if (last?.userId) {
                    const url = `https://www.torn.com/profiles.php?XID=${last.userId}`;
                    shell.openExternal(url);
                }
            } catch {
                // no-op
            }
            break;
        case 'status-backup':
            // informational only
            break;
        case 'status-ready':
        case 'status-sync':
        case 'status-api':
            // informational rows; no action
            break;
        default:
            break;
    }
    closeTrayMenu();
}

function computeMenuPosition(bounds, workArea, width, height) {
    // Position above the icon, left-aligned to icon's left, clamped to work area
    let x = Math.round(bounds.x - width + bounds.width);
    let y = Math.round(bounds.y - height - TRAY_MENU_MARGIN);

    if (y < workArea.y + 4) {
        y = Math.min(bounds.y + bounds.height + TRAY_MENU_MARGIN, workArea.y + workArea.height - height - 4);
    }
    x = Math.min(Math.max(workArea.x + 4, x), workArea.x + workArea.width - width - 4);

    return { x, y };
}

function showTrayMenu(intel, bounds) {
    closeTrayMenu();

    const tickPath = path.join(__dirname, 'assets', 'tick.png');
    let tickDataUrl = '';
    try {
        const tickBuffer = fs.readFileSync(tickPath);
        tickDataUrl = `data:image/png;base64,${tickBuffer.toString('base64')}`;
    } catch {
        tickDataUrl = '';
    }

    const width = 290;
    const display = screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y });
    const workArea = display.workArea;

    lastTrayBounds = bounds;
    lastTrayWorkArea = workArea;

    const rows =
        5 + // status
        (intel.lastAttackLabel ? 1 : 0) +
        4 + // actions
        4 + // toggles
        3 + // maintenance
        1;  // app
    const headers = 5;
    const separators = 4;
    const estimateHeight = rows * 24 + headers * 12 + separators * 6 + 28;
    const maxHeight = Math.max(360, workArea.height - 12);
    const height = Math.min(Math.max(estimateHeight, 360), maxHeight);

    const { x, y } = computeMenuPosition(bounds, workArea, width, height);

    const sections = [
        {
            title: 'STATUS',
            items: [
                { id: 'status-ready', icon: TRAY_ICONS.attackable, label: intel.totalTargets ? `Ready ${intel.attackable}/${intel.totalTargets}` : 'No targets', detail: intel.stats.totalAttacks ? `Lifetime ${intel.stats.totalAttacks}` : null },
                { id: 'status-sync', icon: intel.syncIcon, label: intel.syncLabel === 'never' ? 'Sync pending' : `Sync ${intel.syncLabel}`, detail: intel.refreshAgeMinutes === null || intel.refreshAgeMinutes > 20 ? (intel.refreshAgeMinutes === null ? 'Stale' : `Stale ${Math.max(0, Math.round(intel.refreshAgeMinutes))}m`) : 'Fresh' },
                { id: 'status-api', icon: TRAY_ICONS.rate, label: `API ${intel.rateLabel}`, detail: intel.ratePercent === null ? null : intel.ratePercent <= 10 ? 'Critically low' : intel.ratePercent <= 30 ? 'Low' : intel.ratePercent <= 60 ? 'Okay' : 'Healthy' },
                { id: 'status-backup', icon: intel.backupIcon, label: intel.backupLabel === 'never' ? 'Backup missing' : `Backup ${intel.backupLabel}`, detail: intel.backupLabel === 'never' ? 'Run a backup soon' : null },
                intel.lastAttackLabel
                    ? { id: 'tray-last-attack', icon: TRAY_ICONS.lastAttack, label: `Last ${intel.lastAttackLabel}`, detail: 'Open profile' }
                    : null
            ].filter(Boolean)
        },
        {
            title: 'ACTIONS',
            items: [
                { id: 'tray-window', icon: TRAY_ICONS.window, label: mainWindow && mainWindow.isVisible() ? 'Hide window' : 'Show window' },
                { id: 'tray-refresh', icon: TRAY_ICONS.refresh, label: intel.refreshAgeMinutes === null ? 'Refresh now (never synced)' : intel.refreshAgeMinutes > 20 ? `Refresh now (stale ${Math.max(0, Math.round(intel.refreshAgeMinutes))}m)` : 'Refresh now' },
                { id: 'tray-quick-add', icon: TRAY_ICONS.quickAdd, label: 'Quick add target (Ctrl+N)' },
                { id: 'tray-settings', icon: TRAY_ICONS.settings, label: 'Settings' }
            ]
        },
        {
            title: 'TOGGLES',
            items: [
                { id: 'tray-notifications', icon: TRAY_ICONS.notifications, label: 'Notifications', checked: intel.notificationsEnabled },
                { id: 'tray-sound', icon: TRAY_ICONS.sound, label: 'Sound alerts', checked: intel.soundEnabled },
                { id: 'tray-start-minimized', icon: TRAY_ICONS.startMin, label: 'Start minimized', checked: intel.startMinimized },
                { id: 'tray-keep-tray', icon: TRAY_ICONS.keepTray, label: 'Keep in tray', checked: intel.minimizeToTray }
            ]
        },
        {
            title: 'MAINTENANCE',
            items: [
                { id: 'tray-backup-now', icon: TRAY_ICONS.backupNow, label: 'Backup now' },
                { id: 'tray-open-backups', icon: TRAY_ICONS.folder, label: 'Backup folder' },
                { id: 'tray-open-logs', icon: TRAY_ICONS.logs, label: 'Logs folder' }
            ]
        },
        {
            title: 'APP',
            items: [
                { id: 'tray-quit', icon: TRAY_ICONS.quit, label: 'Quit' }
            ]
        }
    ];

    const rowsMarkup = sections
        .map(section => `
            <div class="section">
                <div class="section-title">${section.title}</div>
                ${section.items.map(item => `
                    <button class="item ${item.checked ? 'checked' : ''}" data-id="${item.id}">
                        <span class="left">
                            <span class="icon">${item.icon}</span>
                            <span class="text">
                                <span class="primary">${item.label}</span>
                                ${item.detail ? `<span class="detail">${item.detail}</span>` : ''}
                            </span>
                        </span>
                        ${item.checked
                            ? `<span class="tick"><img src="${tickDataUrl || `file://${tickPath.replace(/\\\\/g, '/')}`}" alt="checked"></span>`
                            : '<span class="tick spacer"></span>'}
                    </button>
                `).join('')}
            </div>
        `).join('');

    const html = `
    <!doctype html>
    <html>
    <head>
      <style>
        html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
        :root {
          --bg: #111418f2;
          --card: #181b21;
          --text: #e9ebf0;
          --muted: #9aa2b1;
          --border: #2c3240;
          --accent: #6db1ff;
        }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          padding: 8px 6px;
          background: transparent;
          font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif;
          color: var(--text);
          user-select: none;
          overflow: hidden;
        }
        .panel {
          width: 100%;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 10px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.45);
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          overflow: hidden;
        }
        .section {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 6px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.02);
        }
        .section + .section { margin-top: 2px; }
        .section-title {
          font-size: 11px;
          letter-spacing: 0.08em;
          color: var(--muted);
          margin: 2px 4px 6px;
        }
        .item {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 8px;
          border: 0;
          background: transparent;
          color: var(--text);
          border-radius: 6px;
          cursor: pointer;
          transition: background 120ms ease, transform 120ms ease;
        }
        .item:hover { background: rgba(255,255,255,0.06); transform: translateY(-1px); }
        .item:active { background: rgba(255,255,255,0.08); transform: translateY(0); }
        .item .left { display: inline-flex; gap: 10px; align-items: center; }
        .icon { width: 18px; text-align: center; }
        .text { display: flex; flex-direction: column; align-items: flex-start; }
        .primary { font-size: 13px; }
        .detail { font-size: 11px; color: var(--muted); }
        .tick { width: 18px; height: 18px; display: flex; align-items: center; justify-content: flex-end; }
        .tick img { width: 14px; height: 14px; display: block; }
        .tick.spacer { visibility: hidden; }
      </style>
    </head>
    <body>
      <div class="panel">
        ${rowsMarkup}
      </div>
      <script>
        const { ipcRenderer } = require('electron');
        window.addEventListener('mousedown', (e) => {
          if (!document.querySelector('.panel').contains(e.target)) {
            ipcRenderer.send('tray-menu-close');
          }
        });
        document.querySelectorAll('.item').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            ipcRenderer.send('tray-menu-action', id);
          });
        });
        const panel = document.querySelector('.panel');
        let hoverTimer = null;
        panel.addEventListener('mouseenter', () => {
          if (hoverTimer) clearTimeout(hoverTimer);
        });
        panel.addEventListener('mouseleave', () => {
          hoverTimer = setTimeout(() => {
            ipcRenderer.send('tray-menu-close');
          }, 150);
        });
        window.addEventListener('blur', () => ipcRenderer.send('tray-menu-close'));
        requestAnimationFrame(() => {
          const desired = Math.ceil(panel.getBoundingClientRect().height + 12);
          ipcRenderer.send('tray-menu-resize', { height: desired });
        });
      </script>
    </body>
    </html>
    `;

    trayMenuWindow = new BrowserWindow({
        width,
        height,
        x,
        y,
        frame: false,
        transparent: true,
        resizable: false,
        movable: false,
        show: false,
        skipTaskbar: true,
        alwaysOnTop: true,
        focusable: true,
        backgroundColor: '#00000000',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            sandbox: false
        }
    });

    trayMenuWindow.once('ready-to-show', () => {
        if (!trayMenuWindow || trayMenuWindow.isDestroyed()) return;
        trayMenuWindow.setAlwaysOnTop(true, 'pop-up-menu');
        trayMenuWindow.show();
        trayMenuWindow.focus();
        trayMenuOpen = true;
        // Keep popover alive while menu is open
        if (trayPopoverWindow && !trayPopoverWindow.isDestroyed()) {
            trayPopoverWindow.showInactive();
            clearTimeout(trayPopoverHideTimer);
        }
    });

    trayMenuWindow.on('blur', () => closeTrayMenu());
    trayMenuWindow.on('closed', () => {
        trayMenuWindow = null;
    });

    trayMenuWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
}

function wireTrayPopover() {
    // Disabled - using native tooltip instead of custom popover
    // if (!tray) return;
    //
    // const show = () => {
    //     const intel = buildTrayIntel();
    //     showTrayPopover(intel);
    // };
    // const hide = () => scheduleHideTrayPopover(800);
    //
    // // Only use mouse-enter to prevent flickering from mouse-move
    // tray.on('mouse-enter', show);
    // tray.on('mouse-leave', hide);
}

function showTrayPopover(intel) {
    clearTimeout(trayPopoverHideTimer);
    if (trayMenuOpen && trayPopoverWindow && !trayPopoverWindow.isDestroyed()) {
        trayPopoverWindow.showInactive();
    }

    const content = buildTrayPopoverContent(intel);
    // Ultra-compact dimensions - no cards, minimal design
    const hasLastAttack = intel.lastAttackLabel ? true : false;
    const baseHeight = 200;  // Minimal height without card backgrounds
    const lastAttackHeight = hasLastAttack ? 28 : 0;
    const { width: popWidth, height: popHeight } = { width: 260, height: baseHeight + lastAttackHeight };
    const trayBounds = tray.getBounds();
    const display = screen.getDisplayNearestPoint({ x: trayBounds.x, y: trayBounds.y });
    const workArea = display.workArea;

    let x = trayBounds.x + trayBounds.width - popWidth;
    let y = trayBounds.y - popHeight - 10; // prefer above the icon

    // Clamp to visible work area
    x = Math.min(Math.max(workArea.x + 6, x), workArea.x + workArea.width - popWidth - 6);
    if (y < workArea.y + 6) {
        y = trayBounds.y + trayBounds.height + 10; // fall below only if needed
    }
    y = Math.min(Math.max(workArea.y + 6, y), workArea.y + workArea.height - popHeight - 6);

    if (trayPopoverWindow && !trayPopoverWindow.isDestroyed()) {
        trayPopoverWindow.setBounds({ x, y, width: popWidth, height: popHeight });
        trayPopoverWindow.webContents.loadURL(content);
        trayPopoverWindow.showInactive();
        return;
    }

    trayPopoverWindow = new BrowserWindow({
        width: popWidth,
        height: popHeight,
        x,
        y,
        frame: false,
        transparent: true,
        resizable: false,
        movable: false,
        alwaysOnTop: true,
        focusable: false,
        skipTaskbar: true,
        show: false,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
        }
    });

    trayPopoverWindow.once('ready-to-show', () => {
        trayPopoverWindow.showInactive();
    });

    // Keep popover visible when mouse is over it
    trayPopoverWindow.on('mouse-enter', () => {
        clearTimeout(trayPopoverHideTimer);
    });
    trayPopoverWindow.on('mouse-leave', () => scheduleHideTrayPopover(400));

    trayPopoverWindow.loadURL(content);
}

function buildTrayPopoverContent(intel) {
    const ratePercent = intel.rateLabel.includes('%')
        ? parseInt(intel.rateLabel.match(/(\\d+)%/)?.[1] || '0', 10)
        : null;
    const rateWidth = ratePercent !== null ? Math.min(100, Math.max(0, ratePercent)) : 0;
    const rateColor = ratePercent === null
        ? '#858585'
        : ratePercent <= 15 ? '#f14c4c'
        : ratePercent <= 35 ? '#f5a623'
        : ratePercent <= 65 ? '#dcdcaa'
        : '#4ec9b0';

    // Compute glow color for rate bar
    const rateGlow = ratePercent === null
        ? 'rgba(133,133,133,0.15)'
        : ratePercent <= 15 ? 'rgba(241,76,76,0.25)'
        : ratePercent <= 35 ? 'rgba(245,166,35,0.25)'
        : ratePercent <= 65 ? 'rgba(220,220,170,0.25)'
        : 'rgba(78,201,176,0.25)';

    const attackIcon = TRAY_ICONS.attackable;
    const syncIcon = intel.syncIcon;
    const rateIcon = TRAY_ICONS.rate;
    const backupIcon = intel.backupIcon;
    const lastIcon = TRAY_ICONS.lastAttack;

    const markup = `
    <!doctype html>
    <html>
    <head>
    <style>
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-8px) scale(0.96);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      @keyframes shimmer {
        0%, 100% { opacity: 0.4; }
        50% { opacity: 0.7; }
      }
      @keyframes pulseGlow {
        0%, 100% { filter: drop-shadow(0 0 3px currentColor); }
        50% { filter: drop-shadow(0 0 6px currentColor); }
      }
      @keyframes fillBar {
        from { transform: scaleX(0); }
        to { transform: scaleX(1); }
      }

      :root {
        --bg-primary: rgba(22, 22, 24, 0.98);
        --bg-card: rgba(38, 38, 42, 0.95);
        --border-subtle: rgba(255, 255, 255, 0.12);
        --border-accent: rgba(64, 156, 255, 0.4);
        --text-primary: #f5f5f7;
        --text-secondary: #c7c7cc;
        --text-muted: #8e8e93;
        --accent-blue: #409cff;
        --accent-gradient: linear-gradient(135deg, #409cff 0%, #3bdbf3 100%);
        --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.4);
        --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.6);
        --shadow-lg: 0 20px 60px rgba(0, 0, 0, 0.85);
      }

      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      body {
        margin: 0;
        padding: 5px;
        background: transparent;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
        color: var(--text-primary);
        overflow: hidden;
        -webkit-font-smoothing: antialiased;
        text-rendering: optimizeLegibility;
        height: 100vh;
        width: 100vw;
      }

      .popover-card {
        position: relative;
        width: 100%;
        height: 100%;
        background: var(--bg-primary);
        backdrop-filter: blur(24px) saturate(200%);
        -webkit-backdrop-filter: blur(24px) saturate(200%);
        border: 1.5px solid var(--border-subtle);
        border-radius: 12px;
        box-shadow: var(--shadow-lg),
                    0 0 0 1px rgba(255, 255, 255, 0.08) inset,
                    0 2px 4px rgba(255, 255, 255, 0.1) inset;
        padding: 8px;
        animation: slideIn 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .popover-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: var(--accent-gradient);
        opacity: 0.85;
        box-shadow: 0 0 12px rgba(64, 156, 255, 0.3);
      }

      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 5px;
        padding-bottom: 3px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.12);
        flex-shrink: 0;
      }

      .app-title {
        font-size: 9px;
        font-weight: 600;
        letter-spacing: 0.8px;
        text-transform: uppercase;
        color: var(--text-muted);
        background: linear-gradient(90deg, var(--text-secondary), var(--text-muted));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        font-size: 8px;
        font-weight: 500;
        color: var(--accent-blue);
        background: rgba(10, 132, 255, 0.12);
        padding: 2px 6px;
        border-radius: 6px;
        border: 1px solid rgba(10, 132, 255, 0.2);
      }

      .status-dot {
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: var(--accent-blue);
        box-shadow: 0 0 6px var(--accent-blue);
        animation: pulseGlow 2s ease-in-out infinite;
      }

      .stats-grid {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex: 1;
        min-height: 0;
      }

      .stat-item {
        display: grid;
        grid-template-columns: 16px 1fr;
        gap: 6px;
        align-items: center;
        padding: 3px 4px;
        border-radius: 0;
        background: transparent;
        border: none;
        transition: all 0.12s ease;
      }

      .stat-item:hover {
        background: rgba(255, 255, 255, 0.03);
        transform: translateX(1px);
      }

      .stat-icon {
        font-size: 11px;
        line-height: 1;
        opacity: 0.9;
        transition: opacity 0.12s ease;
      }

      .stat-item:hover .stat-icon {
        opacity: 1;
      }

      .stat-content {
        display: flex;
        flex-direction: column;
        gap: 1px;
        min-width: 0;
      }

      .stat-label {
        font-size: 10px;
        font-weight: 600;
        color: var(--text-primary);
        line-height: 1.2;
        letter-spacing: 0.1px;
      }

      .stat-value {
        font-size: 9px;
        font-weight: 500;
        color: var(--text-secondary);
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .progress-container {
        margin-top: 1px;
      }

      .progress-bar {
        position: relative;
        width: 100%;
        height: 5px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 3px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.12);
      }

      .progress-fill {
        height: 100%;
        width: ${rateWidth}%;
        background: linear-gradient(90deg, ${rateColor}, ${rateColor}dd);
        box-shadow: 0 0 12px ${rateGlow},
                    0 0 4px ${rateGlow} inset;
        border-radius: 3px;
        transform-origin: left;
        animation: fillBar 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.15s both;
        position: relative;
      }

      .progress-fill::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(90deg,
          transparent 0%,
          rgba(255, 255, 255, 0.2) 50%,
          transparent 100%);
        animation: shimmer 2s ease-in-out infinite;
      }

      .divider {
        height: 1px;
        background: linear-gradient(90deg,
          transparent,
          rgba(255, 255, 255, 0.1) 50%,
          transparent);
        margin: 2px 0;
        flex-shrink: 0;
      }
    </style>
    </head>
    <body>
      <div class="popover-card">
        <div class="header">
          <div class="app-title">Torn Tracker</div>
          <div class="status-badge">
            <div class="status-dot"></div>
            LIVE
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-icon">${attackIcon}</div>
            <div class="stat-content">
              <div class="stat-label">Attackable</div>
              <div class="stat-value">${intel.attackable} of ${intel.totalTargets} targets ${intel.readinessIcon}</div>
            </div>
          </div>

          <div class="stat-item">
            <div class="stat-icon">${syncIcon}</div>
            <div class="stat-content">
              <div class="stat-label">Last Sync</div>
              <div class="stat-value">${intel.syncLabel}</div>
            </div>
          </div>

          <div class="stat-item">
            <div class="stat-icon">${rateIcon}</div>
            <div class="stat-content">
              <div class="stat-label">API Tokens</div>
              <div class="stat-value">${intel.rateLabel}</div>
              <div class="progress-container">
                <div class="progress-bar">
                  <div class="progress-fill"></div>
                </div>
              </div>
            </div>
          </div>

          ${intel.lastAttackLabel ? `
          <div class="divider"></div>
          <div class="stat-item">
            <div class="stat-icon">${lastIcon}</div>
            <div class="stat-content">
              <div class="stat-label">Last Attack</div>
              <div class="stat-value">${intel.lastAttackLabel}</div>
            </div>
          </div>` : ''}

          <div class="divider"></div>
          <div class="stat-item">
            <div class="stat-icon">${backupIcon}</div>
            <div class="stat-content">
              <div class="stat-label">Last Backup</div>
              <div class="stat-value">${intel.backupLabel}</div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;

    return `data:text/html;charset=UTF-8,${encodeURIComponent(markup)}`;
}

function scheduleHideTrayPopover(delayMs = 300, force = false) {
    clearTimeout(trayPopoverHideTimer);
    if (trayMenuOpen && !force) return;
    trayPopoverHideTimer = setTimeout(() => {
        if (trayPopoverWindow && !trayPopoverWindow.isDestroyed()) {
            trayPopoverWindow.hide();
        }
    }, delayMs);
}

function resolveTrayIconPath() {
    const candidates = [
        path.join(__dirname, 'assets', process.platform === 'win32' ? 'logo.ico' : 'icon.png'),
        path.join(__dirname, 'assets', 'icon.png'),
        path.join(__dirname, 'assets', 'logo.png')
    ];
    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) return candidate;
    }
    return path.join(__dirname, 'assets', 'icon.png');
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

function showNotification(title, body, onClick = null) {
    if (!store.get('settings.notifications')) return;
    
    if (Notification.isSupported()) {
        const notification = new Notification({
            title,
            body,
            icon: path.join(__dirname, 'assets', 'icon.png'),
            silent: !store.get('settings.soundEnabled')
        });

        if (onClick) {
            notification.on('click', onClick);
        }

        notification.show();
    }
}

// ============================================================================
// APP LIFECYCLE
// ============================================================================

app.whenReady().then(() => {
    if (!gotSingleInstanceLock) {
        app.quit();
        return;
    }

    // Ensure store is initialized
    if (!store) {
        const storeReady = initializeStore();
        if (!storeReady) {
            dialog.showErrorBox('Initialization Error', 
                'Failed to initialize data storage. Please try deleting the app data folder and restarting.');
            app.quit();
            return;
        }
    }

    // Initialize encryption
    initializeEncryption();
    configureCachePath();
    
    // Initialize logger
    const logDir = path.join(app.getPath('userData'), 'logs');
    logger = new Logger(logDir);
    logger.info('Application starting', { version: app.getVersion() });

    // Create window
    createWindow();
    
    // Create tray if enabled
    if (store.get('settings.minimizeToTray')) {
        createTray();
    }

    // Configure backups
    startAutoBackupTimer();
    scheduleInitialBackup();

    logger.info('Application initialized');
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    } else {
        mainWindow?.show();
    }
});

app.on('second-instance', () => {
    focusMainWindow();
});

app.on('before-quit', () => {
    isQuitting = true;
    
    // Final backup
    createBackup({ reason: 'shutdown' });
    
    // Clear intervals
    stopAutoBackupTimer();
    if (trayTooltipInterval) {
        clearInterval(trayTooltipInterval);
        trayTooltipInterval = null;
    }

    if (tray) {
        tray.destroy();
        tray = null;
    }

    if (trayPopoverWindow) {
        trayPopoverWindow.destroy();
        trayPopoverWindow = null;
    }

    logger?.info('Application shutting down');
});

// ============================================================================
// IPC HANDLERS - WINDOW CONTROLS
// ============================================================================

ipcMain.on('window-minimize', () => {
    mainWindow?.minimize();
});

ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
        mainWindow.unmaximize();
    } else {
        mainWindow?.maximize();
    }
});

ipcMain.on('window-close', () => {
    mainWindow?.close();
});

ipcMain.handle('window-is-maximized', () => {
    return mainWindow?.isMaximized() || false;
});

// ============================================================================
// IPC HANDLERS - TARGETS
// ============================================================================

ipcMain.handle('get-targets', () => {
    return store.get('targets', []);
});

ipcMain.handle('save-targets', (event, targets) => {
    // Validate targets array
    if (!Array.isArray(targets)) {
        logger?.error('Invalid targets data', { type: typeof targets });
        return { success: false, error: 'Invalid data format' };
    }

    // Enforce maximum targets limit
    if (targets.length > MAX_TARGETS) {
        logger?.warn('Target limit exceeded', { count: targets.length, max: MAX_TARGETS });
        return { success: false, error: `Maximum ${MAX_TARGETS} targets allowed` };
    }

    store.set('targets', targets);
    return { success: true };
});

ipcMain.handle('add-target', (event, target) => {
    const targets = store.get('targets', []);
    
    // Check for duplicates
    if (targets.some(t => t.userId === target.userId)) {
        return { success: false, error: 'Target already exists' };
    }

    // Check limit
    if (targets.length >= MAX_TARGETS) {
        return { success: false, error: `Maximum ${MAX_TARGETS} targets allowed` };
    }

    targets.push(target);
    store.set('targets', targets);
    
    // Update statistics
    const stats = store.get('statistics', {});
    stats.targetsAdded = (stats.targetsAdded || 0) + 1;
    store.set('statistics', stats);

    logger?.info('Target added', { userId: target.userId });
    return { success: true };
});

ipcMain.handle('remove-target', (event, userId) => {
    const targets = store.get('targets', []);
    const newTargets = targets.filter(t => t.userId !== userId);
    
    if (newTargets.length === targets.length) {
        return { success: false, error: 'Target not found' };
    }

    store.set('targets', newTargets);
    
    // Update statistics
    const stats = store.get('statistics', {});
    stats.targetsRemoved = (stats.targetsRemoved || 0) + 1;
    store.set('statistics', stats);

    logger?.info('Target removed', { userId });
    return { success: true };
});

ipcMain.handle('fetch-avatar', async (event, { userId, url }) => {
    const uid = parseInt(userId, 10);
    if (!uid || !url) {
        return { success: false, error: 'Missing user ID or URL' };
    }

    try {
        const filePath = await fetchAvatarToDisk(uid, url);
        const fileUrl = pathToFileURL(filePath).toString();
        return { success: true, path: filePath, fileUrl };
    } catch (error) {
        logger?.warn('Avatar fetch failed', { userId: uid, error: error.message });
        return { success: false, error: error.message };
    }
});

ipcMain.handle('bulk-add-targets', (event, newTargets) => {
    if (!Array.isArray(newTargets) || newTargets.length === 0) {
        return { success: false, error: 'Invalid targets array', added: 0, skipped: 0 };
    }

    const targets = store.get('targets', []);
    const existingIds = new Set(targets.map(t => t.userId));
    
    let added = 0;
    let skipped = 0;

    for (const target of newTargets) {
        if (targets.length >= MAX_TARGETS) {
            skipped += newTargets.length - added - skipped;
            break;
        }

        if (existingIds.has(target.userId)) {
            skipped++;
            continue;
        }

        targets.push(target);
        existingIds.add(target.userId);
        added++;
    }

    store.set('targets', targets);
    
    // Update statistics
    const stats = store.get('statistics', {});
    stats.targetsAdded = (stats.targetsAdded || 0) + added;
    store.set('statistics', stats);

    logger?.info('Bulk targets added', { added, skipped, total: targets.length });
    return { success: true, added, skipped };
});

// ============================================================================
// IPC HANDLERS - TARGET CACHE
// ============================================================================

ipcMain.handle('cache-get-target', (event, userId) => {
    return getCachedTarget(userId);
});

ipcMain.handle('cache-get-all-targets', () => {
    const cache = readTargetCache();
    return cache.targets || {};
});

ipcMain.handle('cache-upsert-targets', (event, entries) => {
    try {
        return upsertTargetCache(Array.isArray(entries) ? entries : [entries]);
    } catch (error) {
        logger?.warn?.('Failed to update target cache', { error: error.message });
        return { success: false, error: error.message };
    }
});

// ============================================================================
// IPC HANDLERS - GROUPS
// ============================================================================

ipcMain.handle('get-groups', () => {
    return store.get('groups', []);
});

ipcMain.handle('save-groups', (event, groups) => {
    store.set('groups', groups);
    return { success: true };
});

// ============================================================================
// IPC HANDLERS - SETTINGS
// ============================================================================

ipcMain.handle('get-settings', () => {
    const settings = { ...store.get('settings', {}) };
    // Decrypt API key before sending
    if (settings.apiKey) {
        settings.apiKey = decrypt(settings.apiKey);
    }
    return settings;
});

ipcMain.handle('save-settings', (event, settings) => {
    // Encrypt API key before storing
    if (settings.apiKey !== undefined) {
        settings.apiKey = encrypt(settings.apiKey);
    }
    
    const currentSettings = store.get('settings', {});
    store.set('settings', { ...currentSettings, ...settings });

    // Reconfigure backup scheduler if relevant settings changed
    if (
        settings.autoBackupEnabled !== undefined ||
        settings.autoBackupInterval !== undefined ||
        settings.backupRetention !== undefined ||
        settings.cloudBackupEnabled !== undefined ||
        settings.cloudBackupPath !== undefined ||
        settings.cloudBackupProvider !== undefined
    ) {
        startAutoBackupTimer();
        scheduleInitialBackup();
    }
    
    // Handle tray setting change
    if (settings.minimizeToTray !== undefined) {
        if (settings.minimizeToTray && !tray) {
            createTray();
        } else if (!settings.minimizeToTray && tray) {
            tray.destroy();
            tray = null;
        }
    }

    return { success: true };
});

ipcMain.handle('get-api-key', () => {
    const encrypted = store.get('settings.apiKey', '');
    return decrypt(encrypted);
});

// ============================================================================
// IPC HANDLERS - ATTACK HISTORY
// ============================================================================

ipcMain.handle('get-attack-history', () => {
    const storedHistory = store.get('attackHistory', []);
    const { history, removedDuplicates, trimmed } = sanitizeAttackHistory(storedHistory);

    if (removedDuplicates > 0 || trimmed > 0 || history.length !== storedHistory.length) {
        store.set('attackHistory', history);

        const stats = store.get('statistics', {});
        if (removedDuplicates > 0 && stats.totalAttacks) {
            stats.totalAttacks = Math.max((stats.totalAttacks || 0) - removedDuplicates, history.length);
            store.set('statistics', stats);
        }

        logger?.info('Normalized attack history', {
            removedDuplicates,
            trimmed,
            newLength: history.length
        });
    }

    return history;
});

ipcMain.handle('add-attack-record', (event, record) => {
    const history = store.get('attackHistory', []);
    const newRecord = buildAttackRecord(record);
    history.push(newRecord);

    const { history: cleaned, removedDuplicates, trimmed } = sanitizeAttackHistory(history);
    const added = cleaned.some(r => r.id === newRecord.id);

    store.set('attackHistory', cleaned);
    
    // Update statistics only when a new record remains after cleanup
    const stats = store.get('statistics', {});
    if (added) {
        stats.totalAttacks = (stats.totalAttacks || 0) + 1;
    } else if (removedDuplicates > 0 && stats.totalAttacks) {
        stats.totalAttacks = Math.max((stats.totalAttacks || 0) - removedDuplicates, cleaned.length);
    }
    store.set('statistics', stats);

    const persistedRecord = cleaned.find(r => r.id === newRecord.id) || null;

    return { success: true, stats, added, trimmed, removedDuplicates, record: persistedRecord };
});

// ============================================================================
// IPC HANDLERS - STATISTICS
// ============================================================================

ipcMain.handle('get-statistics', () => {
    return store.get('statistics', {});
});

ipcMain.handle('increment-stat', (event, statName) => {
    const stats = store.get('statistics', {});
    stats[statName] = (stats[statName] || 0) + 1;
    store.set('statistics', stats);
    return stats[statName];
});

// ============================================================================
// IPC HANDLERS - BACKUP & RESTORE
// ============================================================================

ipcMain.handle('create-backup', (event, options = {}) => {
    return createBackup(options || {});
});

ipcMain.handle('list-backups', () => {
    return listBackups();
});

ipcMain.handle('restore-backup', (event, backupPath) => {
    return restoreBackup(backupPath);
});

ipcMain.handle('resolve-cloud-path', (_event, payload) => {
    const provider = (payload && payload.provider) || payload || 'google-drive';
    const customPath = (payload && payload.path) || '';
    const resolution = ensureCloudBackupPath(provider, customPath);
    return {
        provider,
        label: getCloudProviderLabel(provider),
        ok: resolution.ok,
        reason: resolution.reason,
        path: resolution.path,
        basePath: resolution.basePath,
        usedDefault: resolution.usedDefault,
        candidatesTried: getCloudCandidates(provider)
    };
});

ipcMain.handle('validate-cloud-path', (_event, payload) => {
    const provider = (payload && payload.provider) || payload || 'google-drive';
    const customPath = (payload && payload.path) || '';
    const result = validateCloudPath(provider, customPath);
    return {
        ...result,
        label: getCloudProviderLabel(provider)
    };
});

ipcMain.handle('export-targets', async () => {
    const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Export Targets',
        defaultPath: `torn-targets-${new Date().toISOString().split('T')[0]}.json`,
        filters: [
            { name: 'JSON Files', extensions: ['json'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });

    if (result.canceled) {
        return { success: false, canceled: true };
    }

    try {
        const exportData = {
            version: '2.0',
            exported: new Date().toISOString(),
            targets: store.get('targets', []),
            groups: store.get('groups', [])
        };
        
        fs.writeFileSync(result.filePath, JSON.stringify(exportData, null, 2));
        logger?.info('Targets exported', { file: result.filePath });
        return { success: true, file: result.filePath };
    } catch (e) {
        logger?.error('Export failed', { error: e.message });
        return { success: false, error: e.message };
    }
});

ipcMain.handle('import-targets', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Import Targets',
        filters: [
            { name: 'JSON Files', extensions: ['json'] },
            { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
    });

    if (result.canceled) {
        return { success: false, canceled: true };
    }

    try {
        const data = JSON.parse(fs.readFileSync(result.filePaths[0], 'utf8'));
        
        if (!data.targets || !Array.isArray(data.targets)) {
            throw new Error('Invalid import file format');
        }

        // Create backup before import
        createBackup({ reason: 'pre-import' });

        const currentTargets = store.get('targets', []);
        const existingIds = new Set(currentTargets.map(t => t.userId));
        
        let imported = 0;
        let skipped = 0;

        for (const target of data.targets) {
            if (currentTargets.length >= MAX_TARGETS) break;
            
            if (existingIds.has(target.userId)) {
                skipped++;
                continue;
            }

            currentTargets.push(target);
            existingIds.add(target.userId);
            imported++;
        }

        store.set('targets', currentTargets);
        
        // Import groups if present
        if (data.groups && Array.isArray(data.groups)) {
            const currentGroups = store.get('groups', []);
            const existingGroupIds = new Set(currentGroups.map(g => g.id));
            
            for (const group of data.groups) {
                if (!existingGroupIds.has(group.id)) {
                    currentGroups.push(group);
                }
            }
            store.set('groups', currentGroups);
        }

        logger?.info('Targets imported', { imported, skipped });
        return { success: true, imported, skipped };
    } catch (e) {
        logger?.error('Import failed', { error: e.message });
        return { success: false, error: e.message };
    }
});

// ============================================================================
// IPC HANDLERS - EXTERNAL LINKS
// ============================================================================

ipcMain.on('open-external', (event, url) => {
    // Validate URL - only allow Torn.com URLs
    const allowedPatterns = [
        /^https?:\/\/(www\.)?torn\.com\//,
    ];

    if (url && allowedPatterns.some(pattern => pattern.test(url))) {
        shell.openExternal(url);
        logger?.debug('Opened external URL', { url });
    } else {
        logger?.warn('Blocked external URL', { url });
    }
});

ipcMain.on('open-attack', (event, userId) => {
    const url = `https://www.torn.com/loader.php?sid=attack&user2ID=${userId}`;
    shell.openExternal(url);
    logger?.info('Opened attack page', { userId });
});

ipcMain.on('open-profile', (event, userId) => {
    const url = `https://www.torn.com/profiles.php?XID=${userId}`;
    shell.openExternal(url);
});

// ============================================================================
// IPC HANDLERS - NOTIFICATIONS
// ============================================================================

ipcMain.on('show-notification', (event, { title, body }) => {
    showNotification(title, body);
});

// ============================================================================
// IPC HANDLERS - APP INFO
// ============================================================================

ipcMain.handle('get-app-info', () => {
    return {
        version: app.getVersion(),
        name: app.getName(),
        path: app.getPath('userData'),
        platform: process.platform,
        arch: process.arch,
        electron: process.versions.electron,
        node: process.versions.node
    };
});

ipcMain.handle('open-app-path', async (event, target) => {
    try {
        let targetPath = null;
        switch (target) {
            case 'data':
                targetPath = app.getPath('userData');
                break;
            case 'logs':
                targetPath = path.join(app.getPath('userData'), 'logs');
                if (!fs.existsSync(targetPath)) {
                    fs.mkdirSync(targetPath, { recursive: true });
                }
                break;
            default:
                logger?.warn?.('Blocked open-app-path request', { target });
                return { success: false, error: 'Invalid path request' };
        }

        const result = await shell.openPath(targetPath);
        if (result) {
            throw new Error(result);
        }
        return { success: true, path: targetPath };
    } catch (error) {
        logger?.warn?.('Failed to open app path', { target, error: error.message });
        return { success: false, error: error.message };
    }
});

ipcMain.handle('choose-directory', async () => {
    try {
        const result = await dialog.showOpenDialog(mainWindow, {
            title: 'Select folder for backups',
            properties: ['openDirectory', 'createDirectory']
        });
        if (result.canceled || !result.filePaths?.length) {
            return { success: false, canceled: true };
        }
        return { success: true, path: result.filePaths[0] };
    } catch (error) {
        logger?.warn?.('Folder selection failed', { error: error.message });
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-sidebar-width', () => {
    return store.get('sidebarWidth', 280);
});

ipcMain.handle('set-sidebar-width', (event, width) => {
    store.set('sidebarWidth', width);
    return { success: true };
});

// Tray/status updates from renderer
ipcMain.on('set-tray-status', (event, status) => {
    setTrayStatus(status || {});
});

ipcMain.on('tray-menu-action', (_event, id) => {
    handleTrayMenuAction(id);
});

ipcMain.on('tray-menu-close', () => {
    closeTrayMenu();
});

ipcMain.on('tray-menu-resize', (_event, { height }) => {
    if (!trayMenuWindow || trayMenuWindow.isDestroyed()) return;
    const safeHeight = Math.max(320, Math.round(height || 0));
    const width = trayMenuWindow.getBounds().width;
    const bounds = lastTrayBounds || tray.getBounds();
    const workArea = lastTrayWorkArea || screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y }).workArea;
    const { x, y } = computeMenuPosition(bounds, workArea, width, Math.min(safeHeight, workArea.height - 8));
    trayMenuWindow.setBounds({ x, y, width, height: Math.min(safeHeight, workArea.height - 8) });
});

// ============================================================================
// IPC HANDLERS - CONNECTION DIALOG
// ============================================================================

let connectionWindow = null;

ipcMain.handle('open-connection-dialog', () => {
    if (connectionWindow && !connectionWindow.isDestroyed()) {
        connectionWindow.focus();
        return { success: true, alreadyOpen: true };
    }

    connectionWindow = new BrowserWindow({
        width: 500,
        height: 410,
        frame: false,
        transparent: true,
        backgroundColor: '#00000000',
        resizable: false,
        minimizable: false,
        maximizable: false,
        parent: mainWindow,
        modal: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload-connection.js')
        },
        show: false
    });

    connectionWindow.loadFile('connection.html');

    connectionWindow.once('ready-to-show', () => {
        connectionWindow.show();
    });

    connectionWindow.on('closed', () => {
        connectionWindow = null;
    });

    return { success: true, alreadyOpen: false };
});

ipcMain.handle('check-internet-connection', async () => {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const response = await fetch('https://www.google.com', {
            method: 'HEAD',
            signal: controller.signal
        });

        clearTimeout(timeout);

        return {
            connected: response.ok,
            latency: Date.now() - Date.now(), // Simple placeholder
            error: null
        };
    } catch (error) {
        return {
            connected: false,
            latency: null,
            error: error.message
        };
    }
});

ipcMain.handle('check-torn-api', async () => {
    try {
        const apiKey = decrypt(store.get('settings.apiKey', ''));

        if (!apiKey || apiKey.trim() === '') {
            return {
                connected: false,
                error: 'API key not configured',
                rate: null,
                latency: null
            };
        }

        const startTime = Date.now();
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(
            `https://api.torn.com/user/?selections=basic&key=${apiKey.trim()}`,
            {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                signal: controller.signal
            }
        );

        clearTimeout(timeout);
        const latency = Date.now() - startTime;

        if (!response.ok) {
            return {
                connected: false,
                error: `HTTP ${response.status}`,
                rate: null,
                latency
            };
        }

        const data = await response.json();

        // Check for Torn API errors
        if (data.error) {
            return {
                connected: false,
                error: data.error.error || 'API Error',
                rate: null,
                latency
            };
        }

        // Success - return rate limit and latency
        return {
            connected: true,
            error: null,
            rate: '60/min', // Torn API default
            latency: `${latency} ms`
        };

    } catch (error) {
        return {
            connected: false,
            error: error.name === 'AbortError' ? 'Request timeout' : error.message,
            rate: null,
            latency: null
        };
    }
});

ipcMain.handle('check-tornstats-api', async () => {
    try {
        const startTime = Date.now();
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        // Test TornStats API availability
        const response = await fetch('https://www.tornstats.com/api/v2', {
            method: 'HEAD',
            signal: controller.signal
        });

        clearTimeout(timeout);
        const latency = Date.now() - startTime;
        const fetchedAt = Date.now();

        if (response.ok) {
            return {
                connected: true,
                error: null,
                lastFetch: fetchedAt,
                latency
            };
        } else {
            return {
                connected: false,
                error: `HTTP ${response.status}`,
                lastFetch: 'Service unavailable'
            };
        }
    } catch (error) {
        return {
            connected: false,
            error: error.name === 'AbortError' ? 'Request timeout' : error.message,
            lastFetch: 'Unreachable'
        };
    }
});

ipcMain.on('close-connection-dialog', () => {
    if (connectionWindow && !connectionWindow.isDestroyed()) {
        // Hide first to prevent flicker, then close after a short delay
        connectionWindow.hide();
        setTimeout(() => {
            if (connectionWindow && !connectionWindow.isDestroyed()) {
                connectionWindow.close();
            }
            // Trigger WiFi icon update in main window
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('connection-check-completed');
            }
        }, 100);
    }
});

// ============================================================================
// IPC HANDLERS - LOGGING
// ============================================================================

ipcMain.on('log', (event, { level, message, data }) => {
    if (logger) {
        logger[level]?.(message, data);
    }
});
