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
    session
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
const MAX_BACKUP_FILES = 10;
const BACKUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

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
        theme: 'dark'
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
let backupInterval = null;
let isQuitting = false;
let trayMenuVisibility = 'shown';
let trayTooltipInterval = null;
let trayStatus = {
    targets: 0,
    attackable: 0,
    lastRefresh: null,
    rateLimitStatus: null
};

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
    const readinessIcon = totalTargets === 0 ? '🪐' : attackable > 0 ? '🚀' : '🌙';

    const lastRefreshDate = trayStatus.lastRefresh ? new Date(trayStatus.lastRefresh) : null;
    const refreshAgeMinutes = lastRefreshDate
        ? (Date.now() - lastRefreshDate.getTime()) / 60000
        : null;
    let syncIcon = '🛰️';
    if (refreshAgeMinutes === null) {
        syncIcon = '⌛';
    } else if (refreshAgeMinutes > 45) {
        syncIcon = '⚠️';
    } else if (refreshAgeMinutes > 15) {
        syncIcon = '⏳';
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
        if (ratePercent <= 10) rateIcon = '🔥';
        else if (ratePercent <= 30) rateIcon = '⚠️';
        else if (ratePercent <= 60) rateIcon = '⏳';
        else rateIcon = '🟢';
    }
    const rateLabel = rate
        ? `${rate.availableTokens}/${rate.maxTokens} tokens`
        : 'rate: n/a';

    const settings = store?.get('settings', {}) || {};
    const stats = store?.get('statistics', {}) || {};

    const lastBackup = store?.get('lastBackup') || null;
    const lastBackupDate = lastBackup ? new Date(lastBackup) : null;
    const backupIcon = lastBackupDate ? '🛡️' : '📦';
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

function createBackup() {
    try {
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
        cleanupOldBackups();
        
        logger?.info('Backup created', { file: backupFile });
        return { success: true, file: backupFile };
    } catch (e) {
        logger?.error('Backup failed', { error: e.message });
        return { success: false, error: e.message };
    }
}

function cleanupOldBackups() {
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
        if (files.length > MAX_BACKUP_FILES) {
            files.slice(MAX_BACKUP_FILES).forEach(f => {
                fs.unlinkSync(f.path);
                logger?.debug('Removed old backup', { file: f.name });
            });
        }
    } catch (e) {
        logger?.error('Backup cleanup failed', { error: e.message });
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
        createBackup();

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
        updateTrayTooltip();
        updateTrayContextMenu();

        tray.on('click', () => {
            if (!mainWindow) return;
            if (mainWindow.isVisible()) {
                mainWindow.focus();
            } else {
                focusMainWindow();
            }
            updateTrayContextMenu();
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

function updateTrayContextMenu() {
    if (!tray) return;
    const isVisible = mainWindow && mainWindow.isVisible();
    trayMenuVisibility = isVisible ? 'shown' : 'hidden';
    const intel = buildTrayIntel();
    const needsRefresh = intel.refreshAgeMinutes === null || intel.refreshAgeMinutes > 20;

    const menuTemplate = [
        {
            label: `${intel.readinessIcon} Attackable: ${intel.attackable}/${intel.totalTargets}`,
            enabled: false
        },
        {
            label: `${intel.syncIcon} Sync: ${intel.syncLabel}`,
            enabled: false
        },
        {
            label: `${intel.rateIcon} ${intel.rateLabel}`,
            enabled: false
        },
        {
            label: `${intel.backupIcon} Backup: ${intel.backupLabel}`,
            enabled: false
        },
        {
            label: `📈 Lifetime attacks: ${intel.stats.totalAttacks || 0}`,
            enabled: false
        },
        intel.lastAttackLabel
            ? {
                label: `🎯 Last attack: ${intel.lastAttackLabel}`,
                click: () => {
                    if (intel.lastAttack?.userId) {
                        const url = `https://www.torn.com/profiles.php?XID=${intel.lastAttack.userId}`;
                        shell.openExternal(url);
                    }
                }
            }
            : null,
        { type: 'separator' },
        {
            label: isVisible ? 'Hide Window' : 'Show Window',
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
            label: needsRefresh ? '⚡ Refresh (data stale)' : 'Refresh All Targets',
            click: () => {
                mainWindow?.webContents.send('trigger-refresh');
                updateTrayContextMenu();
            }
        },
        {
            label: 'Quick Add Target (Ctrl+N)',
            click: () => {
                focusMainWindow();
                mainWindow?.webContents.send('open-add-target');
            }
        },
        {
            label: 'Open Settings',
            click: () => {
                focusMainWindow();
                mainWindow?.webContents.send('open-settings');
            }
        },
        { type: 'separator' },
        {
            label: `${intel.notificationsEnabled ? '🔔' : '🔕'} Notifications`,
            type: 'checkbox',
            checked: intel.notificationsEnabled,
            click: (menuItem) => updateTraySetting('notifications', menuItem.checked)
        },
        {
            label: `${intel.soundEnabled ? '🎵' : '🔇'} Notification Sound`,
            type: 'checkbox',
            checked: intel.soundEnabled,
            click: (menuItem) => updateTraySetting('soundEnabled', menuItem.checked)
        },
        {
            label: `${intel.startMinimized ? '🌗' : '🌕'} Launch Minimized`,
            type: 'checkbox',
            checked: intel.startMinimized,
            click: (menuItem) => updateTraySetting('startMinimized', menuItem.checked)
        },
        {
            label: `${intel.minimizeToTray ? '📌' : '📍'} Keep in Tray`,
            type: 'checkbox',
            checked: intel.minimizeToTray,
            click: (menuItem) => updateTraySetting('minimizeToTray', menuItem.checked)
        },
        { type: 'separator' },
        {
            label: 'Create Backup Now',
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
            label: 'Open Backup Folder',
            click: () => {
                const dir = ensureBackupDir();
                shell.openPath(dir);
            }
        },
        {
            label: 'Open Logs',
            click: () => {
                const logDir = path.join(app.getPath('userData'), 'logs');
                shell.openPath(logDir);
            }
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                isQuitting = true;
                app.quit();
            }
        }
    ].filter(Boolean);

    tray.setContextMenu(Menu.buildFromTemplate(menuTemplate));
}

function updateTrayTooltip() {
    if (!tray) return;
    const intel = buildTrayIntel();
    const tooltip = [
        APP_NAME,
        `${intel.readinessIcon} Attackable: ${intel.attackable}/${intel.totalTargets}`,
        `${intel.syncIcon} Sync: ${intel.syncLabel}`,
        `${intel.rateIcon} ${intel.rateLabel}`,
        `${intel.backupIcon} Backup: ${intel.backupLabel}`
    ].join('\n');
    tray.setToolTip(tooltip);
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

    // Start backup interval
    backupInterval = setInterval(createBackup, BACKUP_INTERVAL_MS);
    
    // Initial backup on startup
    setTimeout(createBackup, 10000);

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
    createBackup();
    
    // Clear intervals
    if (backupInterval) {
        clearInterval(backupInterval);
    }

    if (tray) {
        tray.destroy();
        tray = null;
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

ipcMain.handle('create-backup', () => {
    return createBackup();
});

ipcMain.handle('list-backups', () => {
    return listBackups();
});

ipcMain.handle('restore-backup', (event, backupPath) => {
    return restoreBackup(backupPath);
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
        createBackup();

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

// ============================================================================
// IPC HANDLERS - LOGGING
// ============================================================================

ipcMain.on('log', (event, { level, message, data }) => {
    if (logger) {
        logger[level]?.(message, data);
    }
});
