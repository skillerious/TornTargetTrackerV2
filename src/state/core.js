/**
 * Torn Target Tracker - Application State Manager (Enhanced v2.0)
 * Centralized state management with event-based updates
 * 
 * Features:
 * - Target management with groups and favorites
 * - Attack history and statistics
 * - On-demand refresh tied to target navigation
 * - Connection monitoring
 * - Comprehensive event system
 */

const DEFAULT_API_RATE_LIMIT = 80;
const MAX_API_RATE_LIMIT = 99;

class AppState {
    constructor() {
        // ====================================================================
        // STATE
        // ====================================================================
        
        // Targets
        this.targets = new Map();
        this.groups = [];
        this.maxTargets = 500;
        
        // Settings
        this.settings = {
            apiKey: '',
            refreshInterval: 30,
            notifications: true,
            soundEnabled: false,
            soundVolume: 50,
            compactMode: true,
            autoRefresh: false,
            showOfflineTargets: true,
            confirmBeforeAttack: false,
            minimizeToTray: false,
            startMinimized: false,
            maxConcurrentRequests: 1,
            apiRateLimitPerMinute: DEFAULT_API_RATE_LIMIT,
            theme: 'dark',
            // New settings
            showAvatars: true,
            notifyOnlyMonitored: false,
            notifyOnHospitalRelease: false,
            notifyOnJailRelease: false,
            notifyOnTargetAdded: true,
            notifyOnTargetRemoved: false,
            notifyOnStatusChange: false,
            autoBackupEnabled: false,
            autoBackupInterval: 7, // days
            backupRetention: 10,
            backupBeforeBulk: true,
            cloudBackupEnabled: false,
            cloudBackupProvider: 'google-drive',
            cloudBackupPath: '',
            maxHistoryEntries: 1000,
            confirmBeforeDelete: true,
            showStatusCountBadges: true,
            playAttackSound: false,
            doNotAttackRecentActivityDays: 5, // 0 = disabled, otherwise warn if last activity within X days
            timestampFormat: '12h', // '12h' or '24h'
            listDensity: 'comfortable', // 'compact', 'comfortable', 'spacious'
            sortRememberLast: true,
            showOnboarding: true,
            tornStatsApiKey: '',
            playerLevel: null,
            playerName: '',
            playerId: null,
            attackTrackerEnabled: false,
            attackTrackerCompleted: [],
            attackTrackerStartedAt: null
        };

        // Statistics
        this.statistics = {
            totalAttacks: 0,
            targetsAdded: 0,
            targetsRemoved: 0,
            apiCallsMade: 0
        };

        // Attack history
        this.attackHistory = [];

        // Bounties
        this.bounties = {
            stats: null,
            watchlist: [],
            lastAlertedReceived: null,
            alert: { active: false, delta: 0 }
        };
        this.bountyExpiryMs = 7 * 24 * 60 * 60 * 1000;

        // Target cache
        this.targetCache = new Map();
        this.cachePersistQueue = new Map();
        this.cachePersistTimer = null;
        this.intelCacheMs = 15 * 60 * 1000; // 15 minutes

        // API
        this.limiter = new RateLimiter(this.settings.apiRateLimitPerMinute);
        this.api = null;

        // UI State
        this.currentView = 'targets';
        this.selectedTargetId = null;
        this.selectedTargetIds = new Set();
        this.selectionAnchorId = null;
        this.activeGroupId = 'all';
        this.activeFilter = 'all';
        this.searchQuery = '';
        this.sortBy = 'name';
        this.sortDirection = 'asc';
        
        // Attack tracker
        this.attackTracker = {
            enabled: false,
            completed: new Set(),
            startedAt: null
        };
        this.attackTrackerPersistTimer = null;

        // Refresh state
        this.isRefreshing = false;
        this.refreshProgress = { current: 0, total: 0, percent: 0 };
        this.refreshController = null;
        this.refreshTimer = null;
        this.lastRefresh = null;

        // Connection state
        this.isOnline = true;
        this.lastConnectionCheck = null;
        this.connectionCheckTimer = null;

        // Event system
        this.listeners = new Map();

        // Debounce timers
        this.saveDebounce = null;

        // Timer monitoring state (for hospital/jail expiry tracking)
        this.timerMonitoringInterval = null;
        this.timerMonitoringTargets = new Map();

        // Notification suppression flag (used during initial scan to prevent spam)
        this.suppressNotifications = false;
    }

    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    async initialize() {
        try {
            this.emit('loading', true);

            // Check internet connection first
            this.checkInternetConnection();
            this.startConnectionMonitoring();

            // Load settings
            const settings = await window.electronAPI.getSettings();
            this.settings = { ...this.settings, ...settings };
            if (window.tornStatsAPI && this.settings.tornStatsApiKey) {
                window.tornStatsAPI.setApiKey(this.settings.tornStatsApiKey);
            }
            this.limiter.setLimits(this.settings.apiRateLimitPerMinute);
            this.initializeAttackTrackerFromSettings();

            // Restore last sort settings if enabled
            if (this.settings.sortRememberLast !== false && this.settings.lastSortBy) {
                this.sortBy = this.settings.lastSortBy;
                this.sortDirection = this.settings.lastSortDirection || 'asc';
            }

            // Initialize API
            this.api = new TornAPI(this.settings.apiKey, this.limiter, {
                maxAttempts: 5,
                timeoutMs: 30000
            });

            // Set up API callbacks
            this.api.onConnectionChange = (isOnline) => {
                this.isOnline = isOnline;
                this.emit('connection-change', isOnline);
                if (!isOnline) {
                    this.emit('error', 'Lost connection to Torn API');
                }
            };

            this.api.onRateLimitWarning = (delay) => {
                this.emit('rate-limit-warning', delay);
            };

            // Load groups
            const savedGroups = await window.electronAPI.getGroups();
            this.groups = savedGroups.length > 0 ? savedGroups : [
                { id: 'default', name: 'All Targets', color: '#007acc', isDefault: true, noAttack: false },
                { id: 'mug', name: 'Mug', color: '#4ec9b0', isDefault: false, noAttack: false },
                { id: 'chain', name: 'Chain', color: '#ce9178', isDefault: false, noAttack: false }
            ];

            // Migrate groups to add noAttack flag if missing
            let needsSave = false;
            this.groups = this.groups.map(group => {
                if (group.noAttack === undefined) {
                    needsSave = true;
                    return { ...group, noAttack: false };
                }
                return group;
            });

            // Save migrated groups
            if (needsSave) {
                await this.saveGroups();
            }

            // Load targets
            const savedTargets = await window.electronAPI.getTargets();
            savedTargets.forEach(t => {
                this.targets.set(t.userId, TargetInfo.fromJSON(t));
            });

            await this.loadTargetCache();
            this.hydrateTargetsFromCache();

            // Load statistics
            const stats = await window.electronAPI.getStatistics();
            this.statistics = { ...this.statistics, ...stats };

            // Load attack history
            this.attackHistory = await window.electronAPI.getAttackHistory();
            const refreshedStats = await window.electronAPI.getStatistics();
            this.statistics = { ...this.statistics, ...refreshedStats };
            this.emit('attack-history-changed', this.attackHistory);

            // Load bounties
            if (window.electronAPI.getBounties) {
                const storedBounties = await window.electronAPI.getBounties();
                this.bounties = this.normalizeBountyState(storedBounties);
                if (this.bounties.alert?.active) {
                    this.emit('bounty-alert', this.bounties.alert);
                }
                this.emit('bounties-changed', this.getBountyState());
            }

            // Emit ready events
            this.emit('initialized');
            this.emit('targets-changed');
            this.emit('groups-changed');
            this.emit('settings-changed');
            this.emit('statistics-changed');
            this.emit('loading', false);

            // Listen for external refresh triggers
            if (window.electronAPI.onTriggerRefresh) {
                window.electronAPI.onTriggerRefresh(() => {
                    this.refreshAllTargets();
                });
            }

            this.log('info', 'Application state initialized', {
                targets: this.targets.size,
                groups: this.groups.length
            });

            // Perform smart initial scan on launch (non-blocking)
            if (this.api.hasApiKey() && this.targets.size > 0) {
                this.performInitialScan();
            }

            // Start background timer monitoring for hospital releases
            this.startTimerMonitoring();

            // Start auto-refresh if enabled
            if (this.settings.autoRefresh) {
                this.startAutoRefresh();
            }

        } catch (error) {
            this.log('error', 'Failed to initialize state', { error: error.message });
            this.emit('error', 'Failed to initialize application');
            this.emit('loading', false);
        }
    }

    // ========================================================================
    // EVENT SYSTEM
    // ========================================================================

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
        return () => this.off(event, callback);
    }

    off(event, callback) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.delete(callback);
        }
    }

    emit(event, data = null) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach(cb => {
                try {
                    cb(data);
                } catch (e) {
                    this.log('error', `Error in event listener for ${event}`, { error: e.message });
                }
            });
        }
    }

    // ========================================================================
    // SETTINGS
    // ========================================================================

    async updateSettings(newSettings) {
        const oldApiKey = this.settings.apiKey;
        const oldTornStatsKey = this.settings.tornStatsApiKey;
        const oldPlayerLevel = this.settings.playerLevel;
        const oldRateLimit = this.settings.apiRateLimitPerMinute;

        const normalizedSettings = { ...newSettings };
        if (normalizedSettings.playerLevel !== undefined) {
            const lvl = Number(normalizedSettings.playerLevel);
            normalizedSettings.playerLevel = Number.isFinite(lvl) && lvl > 0 ? lvl : null;
        }
        if (normalizedSettings.apiRateLimitPerMinute !== undefined) {
            const limit = Number.parseInt(normalizedSettings.apiRateLimitPerMinute, 10);
            const clamped = Number.isFinite(limit) ? limit : oldRateLimit || DEFAULT_API_RATE_LIMIT;
            normalizedSettings.apiRateLimitPerMinute = Math.max(1, Math.min(MAX_API_RATE_LIMIT, clamped));
        }
        if (normalizedSettings.autoBackupInterval !== undefined) {
            const interval = Number.parseInt(normalizedSettings.autoBackupInterval, 10);
            normalizedSettings.autoBackupInterval = Number.isFinite(interval)
                ? Math.min(Math.max(interval, 1), 30)
                : this.settings.autoBackupInterval;
        }
        if (normalizedSettings.backupRetention !== undefined) {
            const retention = Number.parseInt(normalizedSettings.backupRetention, 10);
            normalizedSettings.backupRetention = Number.isFinite(retention)
                ? Math.min(Math.max(retention, 3), 50)
                : this.settings.backupRetention || 10;
        }
        this.settings = { ...this.settings, ...normalizedSettings };
        await window.electronAPI.saveSettings(this.settings);

        // Handle auto-refresh toggle
        if (normalizedSettings.autoRefresh !== undefined) {
            if (normalizedSettings.autoRefresh) {
                this.startAutoRefresh();
            } else {
                this.stopAutoRefresh();
            }
        }

        // Update API key
        if (normalizedSettings.apiKey !== undefined && normalizedSettings.apiKey !== oldApiKey) {
            this.api.setApiKey(normalizedSettings.apiKey);
        }

        // Sync TornStats API key
        if (normalizedSettings.tornStatsApiKey !== undefined && normalizedSettings.tornStatsApiKey !== oldTornStatsKey) {
            if (window.tornStatsAPI) {
                window.tornStatsAPI.setApiKey(normalizedSettings.tornStatsApiKey || '');
                window.tornStatsAPI.clearCache();
            }
        }

        // Recompute difficulty scores when player level changes
        if (normalizedSettings.playerLevel !== undefined && normalizedSettings.playerLevel !== oldPlayerLevel) {
            this.targets.forEach((t, id) => {
                t.difficulty = this.getTargetDifficulty(t);
                this.targets.set(id, t);
            });
            this.saveTargets();
            this.emit('targets-changed');
        }

        if (normalizedSettings.apiRateLimitPerMinute !== undefined && normalizedSettings.apiRateLimitPerMinute !== oldRateLimit) {
            this.limiter.setLimits(normalizedSettings.apiRateLimitPerMinute);
        }

        this.emit('settings-changed');
    }

    async validateApiKey(key) {
        return await this.api.validateApiKey(key);
    }

    // ========================================================================
    // STATISTICS
    // ========================================================================

    getStatistics() {
        const targets = this.getTargets();
        const now = Date.now();
        const rateStatus = this.limiter.getStatus();
        const attacksLast24h = this.attackHistory.filter(
            r => now - new Date(r.timestamp).getTime() <= 86400000
        ).length;
        const lastAttackAt = this.attackHistory.length > 0
            ? new Date(this.attackHistory[this.attackHistory.length - 1].timestamp).getTime()
            : null;
        const levelValues = targets
            .map(t => t.level)
            .filter(v => Number.isFinite(v));
        const avgLevel = levelValues.length > 0
            ? Math.round((levelValues.reduce((a, b) => a + b, 0) / levelValues.length) * 10) / 10
            : null;
        const maxLevel = levelValues.length > 0 ? Math.max(...levelValues) : null;

        const groupCountsAll = this.groups.reduce((acc, g) => {
            acc[g.id] = 0;
            return acc;
        }, {});
        targets.forEach(t => {
            if (groupCountsAll[t.groupId] !== undefined) {
                groupCountsAll[t.groupId]++;
            }
        });

        const groupDistribution = Object.entries(groupCountsAll).map(([id, count]) => {
            const g = this.getGroup(id);
            return {
                id,
                name: g?.name || 'Group',
                count,
                isDefault: !!g?.isDefault,
                color: g?.color || '#007acc'
            };
        }).sort((a, b) => b.count - a.count);

        const largestGroup = groupDistribution.filter(g => !g.isDefault)[0] || null;
        
        return {
            ...this.statistics,
            totalTargets: targets.length,
            attackableTargets: targets.filter(t => t.isAttackable()).length,
            hospitalTargets: targets.filter(t => t.isInHospital()).length,
            jailTargets: targets.filter(t => t.isInJail()).length,
            travelingTargets: targets.filter(t => t.isTraveling()).length,
            favoriteTargets: targets.filter(t => t.isFavorite).length,
            errorTargets: targets.filter(t => t.error).length,
            groupsCount: this.groups.length,
            customGroupsCount: this.groups.filter(g => !g.isDefault).length,
            largestGroup,
            avgLevel,
            maxLevel,
            lastAttackAt,
            attacksLast24h,
            lastRefresh: this.lastRefresh,
            autoRefresh: false,
            refreshInterval: this.settings.refreshInterval,
            rateLimitStatus: rateStatus,
            groupDistribution
        };
    }

    getFilterCounts() {
        const targets = this.getTargets();
        
        // Filter by group first if active
        const groupFiltered = this.activeGroupId === 'all' 
            ? targets 
            : targets.filter(t => t.groupId === this.activeGroupId);

        return {
            all: groupFiltered.length,
            okay: groupFiltered.filter(t => t.isAttackable()).length,
            hospital: groupFiltered.filter(t => t.isInHospital()).length,
            jail: groupFiltered.filter(t => t.isInJail()).length,
            traveling: groupFiltered.filter(t => t.isTraveling()).length,
            favorites: groupFiltered.filter(t => t.isFavorite).length,
            errors: groupFiltered.filter(t => t.error).length
        };
    }

    // ========================================================================
    // VIEW MANAGEMENT
    // ========================================================================

    setView(view) {
        if (this.currentView !== view) {
            this.currentView = view;
            this.emit('view-changed', view);
        }
    }

    // ========================================================================
    // IMPORT/EXPORT
    // ========================================================================

    async exportTargets() {
        return await window.electronAPI.exportTargets();
    }

    async importTargets() {
        const result = await window.electronAPI.importTargets();
        
        if (result.success) {
            // Reload targets
            const savedTargets = await window.electronAPI.getTargets();
            this.targets.clear();
            savedTargets.forEach(t => {
                this.targets.set(t.userId, TargetInfo.fromJSON(t));
            });

            // Reload groups
            const savedGroups = await window.electronAPI.getGroups();
            this.groups = savedGroups;

            this.emit('targets-changed');
            this.emit('groups-changed');
        }

        return result;
    }

    // ========================================================================
    // BACKUP
    // ========================================================================

    async createBackup() {
        return await window.electronAPI.createBackup();
    }

    async listBackups() {
        return await window.electronAPI.listBackups();
    }

    async restoreBackup(path) {
        const result = await window.electronAPI.restoreBackup(path);
        
        if (result.success) {
            // Reload everything
            await this.initialize();
        }

        return result;
    }

    // ========================================================================
    // CONNECTION MONITORING
    // ========================================================================

    checkInternetConnection() {
        // Check browser online status
        const browserOnline = navigator.onLine;

        if (!browserOnline) {
            this.isOnline = false;
            this.emit('connection-change', false);
            this.emit('error', 'No internet connection detected. Please check your network.');
            return false;
        }

        this.isOnline = true;
        this.emit('connection-change', true);
        return true;
    }

    startConnectionMonitoring() {
        // Listen for browser online/offline events
        window.addEventListener('online', () => {
            this.log('info', 'Internet connection restored');
            this.isOnline = true;
            this.emit('connection-change', true);

            // Show success message
            if (window.showToast) {
                window.showToast('Internet connection restored', 'success');
            }
        });

        window.addEventListener('offline', () => {
            this.log('warn', 'Internet connection lost');
            this.isOnline = false;
            this.emit('connection-change', false);
            this.emit('error', 'No internet connection. Please check your network.');
        });

        // Periodic connection check (every 30 seconds)
        this.connectionCheckTimer = setInterval(() => {
            const wasOnline = this.isOnline;
            const isOnline = navigator.onLine;

            if (wasOnline && !isOnline) {
                this.isOnline = false;
                this.emit('connection-change', false);
                this.emit('error', 'Internet connection lost');
            } else if (!wasOnline && isOnline) {
                this.isOnline = true;
                this.emit('connection-change', true);
            }
        }, 30000);
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    getRateLimitStatus() {
        return this.limiter.getStatus();
    }

    log(level, message, data = null) {
        // Always log to console for visibility
        const logData = data ? ` | ${JSON.stringify(data)}` : '';
        const fullMessage = `[State] ${message}${logData}`;

        switch (level) {
            case 'error':
                console.error(fullMessage);
                break;
            case 'warn':
                console.warn(fullMessage);
                break;
            case 'info':
                console.info(fullMessage);
                break;
            default:
                console.log(fullMessage);
        }

        // Also log to electron if available
        if (window.electronAPI?.log) {
            window.electronAPI.log(level, `[State] ${message}`, data);
        }
    }

    /**
     * Persist statistic increments to the main process
     */
    async incrementStatistic(statName, amount = 1) {
        if (!window.electronAPI?.incrementStat || amount <= 0) return;
        try {
            for (let i = 0; i < amount; i++) {
                await window.electronAPI.incrementStat(statName);
            }
        } catch (error) {
            this.log('warn', 'Failed to persist statistic increment', { statName, amount, error: error.message });
        }
    }
}

// Export for browser/Electron renderer
if (typeof window !== "undefined") {
    window.AppState = AppState;
    window.DEFAULT_API_RATE_LIMIT = DEFAULT_API_RATE_LIMIT;
    window.MAX_API_RATE_LIMIT = MAX_API_RATE_LIMIT;
}
