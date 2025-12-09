/**
 * Torn Target Tracker - Application State Manager (Enhanced v2.0)
 * Centralized state management with event-based updates
 * 
 * Features:
 * - Target management with groups and favorites
 * - Attack history and statistics
 * - Auto-refresh with smart scheduling
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
            autoRefresh: true,
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
            playerId: null
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

            // Start auto-refresh if enabled
            if (this.settings.autoRefresh && this.settings.apiKey) {
                this.startAutoRefresh();
            }

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
    // TARGET MANAGEMENT
    // ========================================================================

    /**
     * Add a single target
     */
    async addTarget(userId, options = {}) {
        const uid = parseInt(userId, 10);
        
        // Validation
        if (!InputParser.isValidUserId(uid)) {
            throw new Error('Invalid user ID');
        }

        if (this.targets.has(uid)) {
            throw new Error('Target already exists');
        }

        if (this.targets.size >= this.maxTargets) {
            throw new Error(`Maximum of ${this.maxTargets} targets reached`);
        }

        // Create placeholder target
        const target = new TargetInfo({
            userId: uid,
            name: options.name || `User ${uid}`,
            customName: options.customName || '',
            notes: options.notes || '',
            groupId: options.groupId || 'default',
            tags: options.tags || [],
            isFavorite: options.isFavorite || false,
            addedAt: Date.now()
        });

        target.difficulty = this.getTargetDifficulty(target);
        const hydrated = this.applyCachedData(target, target);
        hydrated.difficulty = this.getTargetDifficulty(hydrated);
        this.targets.set(uid, hydrated);
        await this.saveTargets();
        
        this.emit('target-added', target);
        this.emit('targets-changed');
        this.statistics.targetsAdded = (this.statistics.targetsAdded || 0) + 1;
        this.emit('statistics-changed');
        this.incrementStatistic('targetsAdded', 1);

        // Notify on target added
        if (this.settings.notifications && this.settings.notifyOnTargetAdded) {
            const displayName = hydrated.customName || hydrated.name || `User ${uid}`;
            window.electronAPI.showNotification(
                'Target Added',
                `${displayName} has been added to your target list`
            );
            if (this.settings.soundEnabled) {
                this.emit('play-notification-sound');
            }
        }

        // Fetch real data if API key is set
        if (this.api.hasApiKey()) {
            this.refreshTarget(uid);
        }

        return target;
    }

    /**
     * Add multiple targets at once
     */
    async addTargets(input, options = {}) {
        const { ids, invalid } = InputParser.parseUserIds(input);
        const errors = [...invalid];
        let limitReached = false;
        
        if (ids.length === 0) {
            return { added: 0, skipped: 0, invalid: invalid.length, errors, limitReached };
        }

        if (this.targets.size >= this.maxTargets) {
            errors.push(`Maximum of ${this.maxTargets} targets reached`);
            return { added: 0, skipped: 0, invalid: invalid.length, errors, limitReached: true };
        }

        let added = 0;
        let skipped = 0;

        for (const userId of ids) {
            try {
                if (this.targets.size >= this.maxTargets) {
                    errors.push(`Maximum of ${this.maxTargets} targets reached`);
                    limitReached = true;
                    break;
                }

                if (this.targets.has(userId)) {
                    skipped++;
                    continue;
                }

                const target = new TargetInfo({
                    userId,
                    name: `User ${userId}`,
                    groupId: options.groupId || 'default',
                    addedAt: Date.now()
                });

                target.difficulty = this.getTargetDifficulty(target);
                const hydrated = this.applyCachedData(target, target);
                hydrated.difficulty = this.getTargetDifficulty(hydrated);
                this.targets.set(userId, hydrated);
                added++;

            } catch (e) {
                errors.push(`${userId}: ${e.message}`);
            }
        }

        if (added > 0) {
            await this.saveTargets();
            this.emit('targets-changed');
            this.statistics.targetsAdded = (this.statistics.targetsAdded || 0) + added;
            this.emit('statistics-changed');
            this.incrementStatistic('targetsAdded', added);

            // Refresh all new targets
            if (this.api.hasApiKey()) {
                const newIds = ids.filter(id => this.targets.has(id));
                this.refreshTargets(newIds);
            }
        }

        return { added, skipped, invalid: invalid.length, errors, limitReached };
    }

    /**
     * Remove a target
     */
    async removeTarget(userId) {
        const uid = parseInt(userId, 10);
        if (!this.targets.has(uid)) return false;

        // Store target info for notification before removing
        const target = this.targets.get(uid);
        const displayName = target?.getDisplayName?.() || target?.customName || target?.name || `User ${uid}`;

        this.targets.delete(uid);
        await this.saveTargets();

        if (this.selectedTargetIds.has(uid)) {
            this.selectedTargetIds.delete(uid);
            if (this.selectedTargetId === uid) {
                this.selectedTargetId = this.selectedTargetIds.size ? Array.from(this.selectedTargetIds).pop() : null;
            }
            if (this.selectedTargetIds.size === 0) {
                this.selectionAnchorId = null;
            }
            this.emitSelectionChanged();
        }

        this.emit('target-removed', uid);
        this.emit('targets-changed');
        this.statistics.targetsRemoved = (this.statistics.targetsRemoved || 0) + 1;
        this.emit('statistics-changed');
        this.incrementStatistic('targetsRemoved', 1);

        // Notify on target removed
        if (this.settings.notifications && this.settings.notifyOnTargetRemoved) {
            window.electronAPI.showNotification(
                'Target Removed',
                `${displayName} has been removed from your target list`
            );
            if (this.settings.soundEnabled) {
                this.emit('play-notification-sound');
            }
        }

        return true;
    }

    /**
     * Remove multiple targets
     */
    async removeTargets(userIds) {
        let removed = 0;

        if (Array.isArray(userIds) && userIds.length > 1 && this.settings.backupBeforeBulk !== false) {
            try {
                await window.electronAPI?.createBackup?.({ reason: 'bulk-delete' });
            } catch (error) {
                this.log('warn', 'Pre-delete backup failed', { error: error.message });
            }
        }

        for (const userId of userIds) {
            const uid = parseInt(userId, 10);
            if (this.targets.has(uid)) {
                this.targets.delete(uid);
                removed++;

                if (this.selectedTargetIds.has(uid)) {
                    this.selectedTargetIds.delete(uid);
                }
            }
        }

        if (removed > 0) {
            await this.saveTargets();
            if (!this.selectedTargetIds.size) {
                this.selectedTargetId = null;
                this.selectionAnchorId = null;
            } else if (this.selectedTargetId && !this.selectedTargetIds.has(this.selectedTargetId)) {
                this.selectedTargetId = Array.from(this.selectedTargetIds).pop();
            }
            this.emitSelectionChanged();
            this.emit('targets-changed');
            this.statistics.targetsRemoved = (this.statistics.targetsRemoved || 0) + removed;
            this.emit('statistics-changed');
            this.incrementStatistic('targetsRemoved', removed);
        }

        return removed;
    }

    /**
     * Update target properties
     */
    async updateTarget(userId, updates) {
        const target = this.targets.get(parseInt(userId, 10));
        if (!target) return false;

        const previousGroupId = target.groupId;
        // Apply updates
        Object.assign(target, updates);

        const groupChanged = updates.groupId !== undefined && updates.groupId !== previousGroupId;
        try {
            if (groupChanged) {
                // Persist group moves immediately so they stick between sessions
                await this.saveTargetsImmediate();
            } else {
                await this.saveTargets();
            }
        } catch (error) {
            return false;
        }

        this.emit('target-updated', target);
        if (groupChanged) {
            this.emit('targets-changed');
        }

        return true;
    }

    /**
     * Move a target to a different group with immediate persistence
     * Explicit helper to make group moves reliable from all UI entry points
     */
    async moveTargetToGroup(userId, newGroupId) {
        const uid = parseInt(userId, 10);
        const target = this.targets.get(uid);
        if (!target) return { success: false, error: 'Target not found' };

        // Validate destination group (allow default even if missing from list)
        const destination = newGroupId === 'default'
            ? this.getGroup('default') || { id: 'default', name: 'All Targets' }
            : this.getGroup(newGroupId);

        if (!destination) {
            return { success: false, error: 'Group not found' };
        }

        const previousGroupId = target.groupId;
        if (previousGroupId === newGroupId) {
            return { success: true, target };
        }

        target.groupId = newGroupId;

        try {
            await this.saveTargetsImmediate();
        } catch (error) {
            this.log('error', 'Failed to move target to group', { userId: uid, newGroupId, error: error.message });
            // Revert change in memory on failure
            target.groupId = previousGroupId;
            return { success: false, error: 'Failed to save group change' };
        }

        this.emit('target-updated', target);
        this.emit('targets-changed');

        return { success: true, target, previousGroupId };
    }

    /**
     * Bulk move targets to a group
     */
    async bulkMoveTargets(userIds, newGroupId) {
        const ids = Array.from(new Set((userIds || []).map(id => parseInt(id, 10)).filter(id => Number.isFinite(id))));
        if (!ids.length) return { success: false, error: 'No targets selected' };

        const destination = newGroupId === 'default'
            ? this.getGroup('default') || { id: 'default', name: 'All Targets' }
            : this.getGroup(newGroupId);

        if (!destination) {
            return { success: false, error: 'Group not found' };
        }

        const previousGroups = new Map();
        const updatedTargets = [];
        ids.forEach(uid => {
            const target = this.targets.get(uid);
            if (target && target.groupId !== newGroupId) {
                previousGroups.set(uid, target.groupId);
                target.groupId = newGroupId;
                updatedTargets.push(target);
            }
        });

        if (!updatedTargets.length) {
            return { success: true, moved: 0, destination: destination.id };
        }

        try {
            await this.saveTargetsImmediate();
        } catch (error) {
            previousGroups.forEach((groupId, uid) => {
                const target = this.targets.get(uid);
                if (target) target.groupId = groupId;
            });
            this.log('error', 'Failed to bulk move targets', { error: error.message });
            return { success: false, error: 'Failed to save group changes' };
        }

        updatedTargets.forEach(t => this.emit('target-updated', t));
        this.emit('targets-changed');

        return { success: true, moved: updatedTargets.length, destination: destination.id };
    }

    /**
     * Bulk add tags to targets
     */
    async addTagsToTargets(userIds, tags) {
        const normalizedTags = Array.from(new Set((tags || [])
            .map(t => (t || '').trim())
            .filter(t => t.length > 0)
        ));
        if (!normalizedTags.length) {
            return { success: false, error: 'No tags to add' };
        }

        const ids = Array.from(new Set((userIds || []).map(id => parseInt(id, 10)).filter(id => Number.isFinite(id))));
        if (!ids.length) {
            return { success: false, error: 'No targets selected' };
        }

        const updated = [];
        ids.forEach(uid => {
            const target = this.targets.get(uid);
            if (!target) return;
            const existing = Array.isArray(target.tags) ? target.tags : [];
            const merged = Array.from(new Set([...existing, ...normalizedTags]));
            target.tags = merged;
            updated.push(target);
        });

        if (!updated.length) {
            return { success: false, error: 'No targets updated' };
        }

        try {
            await this.saveTargetsImmediate();
        } catch (error) {
            this.log('error', 'Failed to add tags to targets', { error: error.message });
            return { success: false, error: 'Failed to save tag changes' };
        }

        updated.forEach(t => this.emit('target-updated', t));
        this.emit('targets-changed');

        return { success: true, count: updated.length, tags: normalizedTags };
    }

    /**
     * Bulk toggle monitorOk for a list of targets
     */
    async setMonitorForTargets(userIds, monitorOk) {
        const updated = [];
        userIds.forEach(uid => {
            const target = this.targets.get(parseInt(uid, 10));
            if (target) {
                target.monitorOk = monitorOk;
                updated.push(target);
            }
        });

        if (updated.length === 0) {
            return { success: false, error: 'No targets to update' };
        }

        await this.saveTargetsImmediate();
        updated.forEach(t => this.emit('target-updated', t));
        this.emit('targets-changed');
        return { success: true, count: updated.length };
    }

    /**
     * Toggle target favorite status
     */
    async toggleFavorite(userId) {
        const target = this.targets.get(parseInt(userId, 10));
        if (!target) return false;

        target.isFavorite = !target.isFavorite;
        await this.saveTargets();
        this.emit('target-updated', target);

        return target.isFavorite;
    }

    /**
     * Set favorite status for multiple targets
     */
    async setFavoritesForTargets(userIds, isFavorite) {
        const ids = Array.from(new Set((userIds || [])
            .map(id => parseInt(id, 10))
            .filter(id => Number.isFinite(id))));
        if (!ids.length) {
            return { success: false, error: 'No targets selected' };
        }

        const updated = [];
        ids.forEach(uid => {
            const target = this.targets.get(uid);
            if (target && target.isFavorite !== isFavorite) {
                target.isFavorite = isFavorite;
                updated.push(target);
            }
        });

        if (!updated.length) {
            return { success: true, updated: 0, isFavorite };
        }

        try {
            await this.saveTargetsImmediate();
        } catch (error) {
            this.log('error', 'Failed to update favorites', { error: error.message });
            return { success: false, error: 'Failed to save favorites' };
        }

        updated.forEach(t => this.emit('target-updated', t));
        return { success: true, updated: updated.length, isFavorite };
    }

    /**
     * Ensure an avatar image is cached for a target
     */
    async fetchAvatar(target) {
        if (!target || !target.userId) return null;
        if (target.avatarPath) return target.avatarPath;
        if (!target.avatarUrl || !window.electronAPI.fetchAvatar) return null;

        try {
            const result = await window.electronAPI.fetchAvatar(target.userId, target.avatarUrl);
            if (result?.success && result.path) {
                target.avatarPath = result.path;
                await this.saveTargets();
                this.emit('target-updated', target);
                return result.path;
            }
        } catch (error) {
            this.log('warn', 'Failed to fetch avatar', { userId: target.userId, error: error.message });
        }

        return null;
    }

    /**
     * Get a single target
     */
    getTarget(userId) {
        return this.targets.get(parseInt(userId, 10));
    }

    /**
     * Get all targets
     */
    getTargets() {
        return Array.from(this.targets.values());
    }

    /**
     * Get filtered and sorted targets
     */
    getFilteredTargets() {
        let targets = this.getTargets();

        // Filter by group
        if (this.activeGroupId !== 'all') {
            targets = targets.filter(t => t.groupId === this.activeGroupId);
        }

        // Filter by status
        switch (this.activeFilter) {
            case 'okay':
                targets = targets.filter(t => t.isAttackable());
                break;
            case 'hospital':
                targets = targets.filter(t => t.isInHospital());
                break;
            case 'jail':
                targets = targets.filter(t => t.isInJail());
                break;
            case 'traveling':
                targets = targets.filter(t => t.isTraveling());
                break;
            case 'favorites':
                targets = targets.filter(t => t.isFavorite);
                break;
            case 'errors':
                targets = targets.filter(t => t.error);
                break;
        }

        // Filter by search query
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            targets = targets.filter(t => 
                t.getDisplayName().toLowerCase().includes(query) ||
                String(t.userId).includes(query) ||
                (t.faction || '').toLowerCase().includes(query) ||
                (t.notes || '').toLowerCase().includes(query)
            );
        }

        // Sort
        targets = this.sortTargets(targets);

        return targets;
    }

    /**
     * Sort targets
     */
    sortTargets(targets) {
        const direction = this.sortDirection === 'asc' ? 1 : -1;

        return targets.sort((a, b) => {
            let comparison = 0;

            switch (this.sortBy) {
                case 'name':
                    comparison = a.getDisplayName().localeCompare(b.getDisplayName());
                    break;
                case 'level':
                    comparison = (a.level || 0) - (b.level || 0);
                    break;
                case 'status':
                    comparison = (a.statusState || '').localeCompare(b.statusState || '');
                    break;
                case 'lastAction':
                    comparison = (b.lastActionTimestamp || 0) - (a.lastActionTimestamp || 0);
                    break;
                case 'lastUpdated':
                    comparison = (a.lastUpdated || 0) - (b.lastUpdated || 0);
                    break;
                case 'addedAt':
                    comparison = (a.addedAt || 0) - (b.addedAt || 0);
                    break;
                case 'attackCount':
                    comparison = (a.attackCount || 0) - (b.attackCount || 0);
                    break;
                case 'favorite':
                    comparison = (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0);
                    break;
                default:
                    comparison = a.getDisplayName().localeCompare(b.getDisplayName());
            }

            return comparison * direction;
        });
    }

    /**
     * Save targets to storage (debounced)
     */
    async saveTargets() {
        // Debounce saves
        if (this.saveDebounce) {
            clearTimeout(this.saveDebounce);
        }

        this.saveDebounce = setTimeout(async () => {
            try {
                const data = this.getTargets().map(t => t.toJSON());
                await this.persistTargets(data);
            } catch (error) {
                this.log('error', 'Failed to save targets', { error: error.message });
                // Retry immediately once if save fails
                try {
                    const data = this.getTargets().map(t => t.toJSON());
                    await this.persistTargets(data);
                } catch (retryError) {
                    this.emit('error', 'Failed to save targets: ' + retryError.message);
                }
            }
        }, 100);
    }

    /**
     * Save targets immediately without debouncing (for critical updates)
     */
    async saveTargetsImmediate() {
        // Cancel any pending debounced save
        if (this.saveDebounce) {
            clearTimeout(this.saveDebounce);
            this.saveDebounce = null;
        }

        try {
            const data = this.getTargets().map(t => t.toJSON());
            await this.persistTargets(data);
        } catch (error) {
            this.log('error', 'Failed to save targets immediately', { error: error.message });
            this.emit('error', 'Failed to save targets: ' + error.message);
            throw error; // Re-throw so caller knows save failed
        }
    }

    /**
     * Persist targets and surface IPC errors
     */
    async persistTargets(data) {
        const result = await window.electronAPI.saveTargets(data);
        if (result && result.success === false) {
            throw new Error(result.error || 'Failed to save targets');
        }
        return true;
    }

    /**
     * Select a target
     */
    selectTarget(userId, options = {}) {
        const uid = userId ? parseInt(userId, 10) : null;

        if (options.toggle) {
            this.toggleSelection(uid);
            return;
        }

        if (options.range && Array.isArray(options.rangeIds)) {
            const normalizedRange = options.rangeIds
                .map(id => parseInt(id, 10))
                .filter(id => Number.isFinite(id));
            this.setSelection(normalizedRange, options.anchorId ?? this.selectionAnchorId ?? uid, uid);
            return;
        }

        this.setSelection(uid ? [uid] : [], options.anchorId ?? uid, uid);
    }

    /**
     * Set selection to a list of ids
     */
    setSelection(userIds = [], anchorId = undefined, primaryId = undefined) {
        const normalized = Array.from(new Set(
            (userIds || [])
                .map(id => parseInt(id, 10))
                .filter(id => Number.isFinite(id))
        ));

        if (primaryId !== undefined && primaryId !== null) {
            const pid = parseInt(primaryId, 10);
            if (Number.isFinite(pid) && !normalized.includes(pid)) {
                normalized.push(pid);
            }
        }

        this.selectedTargetIds = new Set(normalized);
        this.selectedTargetId = normalized.length
            ? (primaryId !== undefined && primaryId !== null
                ? parseInt(primaryId, 10)
                : normalized[normalized.length - 1])
            : null;
        if (anchorId !== undefined) {
            this.selectionAnchorId = anchorId;
        } else {
            this.selectionAnchorId = normalized.length ? normalized[0] : null;
        }
        this.emitSelectionChanged();
    }

    /**
     * Toggle selection of a single id
     */
    toggleSelection(userId) {
        const uid = parseInt(userId, 10);
        if (!Number.isFinite(uid)) {
            this.clearSelection();
            return;
        }
        const wasSelected = this.selectedTargetIds.has(uid);
        if (wasSelected) {
            this.selectedTargetIds.delete(uid);
        } else {
            this.selectedTargetIds.add(uid);
        }

        if (this.selectedTargetIds.size === 0) {
            this.selectedTargetId = null;
            this.selectionAnchorId = null;
        } else {
            this.selectedTargetId = wasSelected
                ? Array.from(this.selectedTargetIds).pop()
                : uid;
            if (!this.selectionAnchorId || !this.selectedTargetIds.has(this.selectionAnchorId)) {
                this.selectionAnchorId = Array.from(this.selectedTargetIds)[0];
            }
        }
        this.emitSelectionChanged();
    }

    /**
     * Select a range of ids (orderedIds should reflect current list order)
     */
    selectRangeBetween(anchorId, targetId, orderedIds = []) {
        const anchor = parseInt(anchorId, 10);
        const target = parseInt(targetId, 10);
        if (!Number.isFinite(anchor) || !Number.isFinite(target)) {
            this.selectTarget(targetId);
            return;
        }

        const anchorIndex = orderedIds.indexOf(anchor);
        const targetIndex = orderedIds.indexOf(target);
        if (anchorIndex === -1 || targetIndex === -1) {
            this.selectTarget(targetId);
            return;
        }

        const [start, end] = anchorIndex <= targetIndex
            ? [anchorIndex, targetIndex]
            : [targetIndex, anchorIndex];
        const rangeIds = orderedIds.slice(start, end + 1);
        this.setSelection(rangeIds, anchor, target);
    }

    /**
     * Select all ids in an array
     */
    selectAll(userIds = []) {
        this.setSelection(userIds, userIds.length ? userIds[0] : null, userIds.length ? userIds[userIds.length - 1] : null);
    }

    /**
     * Clear selection
     */
    clearSelection() {
        this.selectedTargetIds.clear();
        this.selectedTargetId = null;
        this.selectionAnchorId = null;
        this.emitSelectionChanged();
    }

    /**
     * Emit selection change payload
     */
    emitSelectionChanged() {
        this.emit('selection-changed', {
            primaryId: this.selectedTargetId,
            selectedIds: Array.from(this.selectedTargetIds)
        });
    }

    /**
     * Get selected target
     */
    getSelectedTarget() {
        if (!this.selectedTargetId) return null;
        return this.targets.get(this.selectedTargetId);
    }

    getSelectedIds() {
        return Array.from(this.selectedTargetIds);
    }

    getSelectedTargets() {
        return Array.from(this.selectedTargetIds).map(id => this.targets.get(id)).filter(Boolean);
    }

    // ========================================================================
    // TARGET CACHE
    // ========================================================================

    async loadTargetCache() {
        if (!window.electronAPI?.getTargetCache) return;
        try {
            const cache = await window.electronAPI.getTargetCache();
            this.targetCache.clear();

            Object.entries(cache || {}).forEach(([key, value]) => {
                const normalized = this.normalizeCachedTarget(value, parseInt(key, 10));
                if (normalized) {
                    this.targetCache.set(normalized.userId, normalized);
                }
            });

            this.log('info', `Loaded ${this.targetCache.size} cached targets`);
        } catch (error) {
            this.log('warn', 'Failed to load target cache', { error: error.message });
        }
    }

    normalizeCachedTarget(data, userId = null) {
        if (!data) return null;
        const uid = parseInt(userId || data.userId, 10);
        if (!uid) return null;

        try {
            const payload = { ...data, userId: uid };
            const info = TargetInfo.fromJSON(payload);
            return info.toJSON();
        } catch (error) {
            this.log('warn', 'Failed to normalize cached target', { userId: uid, error: error.message });
            return null;
        }
    }

    hydrateTargetsFromCache() {
        if (!this.targetCache.size) return;
        this.targets.forEach((target, userId) => {
            const merged = this.applyCachedData(target, target);
            this.targets.set(userId, merged);
        });
    }

    applyCachedData(target, existing = null) {
        if (!target) return target;
        const cached = this.targetCache.get(target.userId);
        if (!cached && !existing) return target;

        const base = existing
            ? (typeof existing.toJSON === 'function' ? existing.toJSON() : { ...existing })
            : {};
        const incoming = typeof target.toJSON === 'function' ? target.toJSON() : { ...target };

        const preferString = (...vals) => {
            for (const v of vals) {
                if (typeof v === 'string' && v.trim()) return v;
            }
            return '';
        };

        const preferNumber = (...vals) => {
            for (const v of vals) {
                const n = Number(v);
                if (!Number.isNaN(n) && n !== 0) return n;
                if (n === 0) return 0;
            }
            return null;
        };

        const cloneIntel = (intel) => {
            if (!intel) return null;
            return {
                ...intel,
                stats: intel.stats ? { ...intel.stats } : null,
                compare: intel.compare ? { ...intel.compare } : null,
                attacks: intel.attacks ? { ...intel.attacks } : null
            };
        };

        const pickIntel = (...candidates) => {
            const valid = candidates.filter(Boolean);
            if (!valid.length) return null;

            const best = valid.reduce((acc, curr) => {
                if (!acc) return curr;
                const accTs = acc.fetchedAt || acc.lastSeen || 0;
                const currTs = curr.fetchedAt || curr.lastSeen || 0;
                return currTs > accTs ? curr : acc;
            }, null);

            return cloneIntel(best);
        };

        const pickDifficulty = (...candidates) => {
            for (const d of candidates) {
                if (d) return { ...d };
            }
            return null;
        };

        const merged = new TargetInfo({
            userId: target.userId,
            name: preferString(incoming.name, cached?.name, base.name, `User ${target.userId}`),
            customName: preferString(incoming.customName, cached?.customName, base.customName),
            notes: preferString(incoming.notes, cached?.notes, base.notes),
            level: preferNumber(incoming.level, cached?.level, base.level),
            gender: preferString(incoming.gender, cached?.gender, base.gender),
            age: preferNumber(incoming.age, cached?.age, base.age),
            statusState: preferString(incoming.statusState, cached?.statusState, base.statusState, 'Unknown'),
            statusDesc: preferString(incoming.statusDesc, cached?.statusDesc, base.statusDesc),
            statusReason: preferString(incoming.statusReason, cached?.statusReason, base.statusReason),
            statusUntil: preferNumber(incoming.statusUntil, cached?.statusUntil, base.statusUntil),
            lastActionStatus: preferString(incoming.lastActionStatus, cached?.lastActionStatus, base.lastActionStatus),
            lastActionRelative: preferString(incoming.lastActionRelative, cached?.lastActionRelative, base.lastActionRelative),
            lastActionTimestamp: preferNumber(incoming.lastActionTimestamp, cached?.lastActionTimestamp, base.lastActionTimestamp),
            faction: preferString(incoming.faction, cached?.faction, base.faction),
            factionId: preferNumber(incoming.factionId, cached?.factionId, base.factionId),
            factionPosition: preferString(incoming.factionPosition, cached?.factionPosition, base.factionPosition),
            groupId: preferString(incoming.groupId, cached?.groupId, base.groupId, 'default'),
            tags: incoming.tags || cached?.tags || base.tags || [],
            isFavorite: incoming.isFavorite ?? cached?.isFavorite ?? base.isFavorite ?? false,
            priority: preferNumber(incoming.priority, cached?.priority, base.priority) || 0,
            monitorOk: incoming.monitorOk ?? cached?.monitorOk ?? base.monitorOk ?? false,
            ok: incoming.ok ?? cached?.ok ?? base.ok ?? false,
            error: incoming.error || null,
            lastUpdated: incoming.lastUpdated || cached?.lastUpdated || base.lastUpdated || Date.now(),
            addedAt: incoming.addedAt || cached?.addedAt || base.addedAt || Date.now(),
            avatarUrl: preferString(incoming.avatarUrl, cached?.avatarUrl, base.avatarUrl),
            avatarPath: preferString(incoming.avatarPath, cached?.avatarPath, base.avatarPath),
            attackCount: preferNumber(incoming.attackCount, cached?.attackCount, base.attackCount) || 0,
            lastAttacked: preferNumber(incoming.lastAttacked, cached?.lastAttacked, base.lastAttacked),
            intel: pickIntel(incoming.intel, cached?.intel, base.intel),
            difficulty: pickDifficulty(incoming.difficulty, cached?.difficulty, base.difficulty)
        });

        // Preserve last known good name if we only have a placeholder
        if (!merged.name || merged.name.startsWith('User ')) {
            merged.name = preferString(cached?.name, base.name, merged.name);
        }

        return merged;
    }

    shouldCacheTarget(target) {
        if (!target || target.error) return false;
        if (!target.userId) return false;
        return !!(target.name || target.customName);
    }

    queueCachePersist(target) {
        if (!this.shouldCacheTarget(target)) return;

        const base = typeof target.toJSON === 'function' ? target.toJSON() : { ...target };
        const payload = {
            ...base,
            lastUpdated: target.lastUpdated || Date.now(),
            cachedAt: Date.now()
        };

        this.targetCache.set(payload.userId, payload);
        this.cachePersistQueue.set(payload.userId, payload);

        if (!this.cachePersistTimer) {
            this.cachePersistTimer = setTimeout(() => {
                this.flushCacheQueue();
            }, 250);
        }
    }

    async flushCacheQueue() {
        if (this.cachePersistTimer) {
            clearTimeout(this.cachePersistTimer);
            this.cachePersistTimer = null;
        }

        if (!this.cachePersistQueue.size || !window.electronAPI?.upsertTargetCache) return;

        const batch = Array.from(this.cachePersistQueue.values());
        this.cachePersistQueue.clear();

        try {
            await window.electronAPI.upsertTargetCache(batch);
        } catch (error) {
            this.log('warn', 'Failed to persist target cache', { error: error.message });
        }
    }

    // ========================================================================
    // TARGET INTELLIGENCE & DIFFICULTY
    // ========================================================================

    getTargetDifficulty(target) {
        if (!target) {
            return {
                label: 'Unknown',
                code: 'unknown',
                className: 'difficulty-unknown',
                ratio: null,
                advice: 'No target selected'
            };
        }

        const playerLevel = Number(this.settings.playerLevel);
        const targetLevel = Number(target.level);

        if (!playerLevel || !targetLevel) {
            return {
                label: 'Unknown',
                code: 'unknown',
                className: 'difficulty-unknown',
                ratio: null,
                advice: playerLevel ? 'Target level missing' : 'Set your level in Settings to score difficulty'
            };
        }

        const ratio = targetLevel / playerLevel;
        let code = 'even';
        let label = 'Even';
        let advice = 'Comparable level opponent.';

        if (ratio <= 0.7) {
            code = 'easy';
            label = 'Easy';
            advice = 'Well below your level; safe opener.';
        } else if (ratio <= 1.05) {
            code = 'even';
            label = 'Even';
            advice = 'Within your level range; fair fight bonus likely.';
        } else if (ratio <= 1.35) {
            code = 'tough';
            label = 'Challenging';
            advice = 'Higher level; bring boosts or support.';
        } else {
            code = 'deadly';
            label = 'Deadly';
            advice = 'Significantly higher level; approach cautiously.';
        }

        // Lightly adjust using intel stats when available
        const totalStats = target.intel?.stats?.total;
        if (totalStats) {
            if (totalStats > 2000000000 && code !== 'deadly') {
                code = 'deadly';
                label = 'Overpowered';
                advice = 'Intel shows extremely high battle stats.';
            } else if (totalStats > 750000000 && code === 'even') {
                code = 'tough';
                label = 'Challenging';
                advice = 'Intel suggests stronger stats than level indicates.';
            }
        }

        return {
            label,
            code,
            className: `difficulty-${code}`,
            ratio: Number(ratio.toFixed(2)),
            advice,
            playerLevel,
            targetLevel
        };
    }

    async fetchTargetIntel(userId, { force = false } = {}) {
        const uid = parseInt(userId, 10);
        const target = this.targets.get(uid);
        if (!target) return { error: 'Target not found' };

        if (!window.tornStatsAPI || !window.tornStatsAPI.apiKey) {
            return { error: 'TornStats API key not configured' };
        }

        const now = Date.now();
        const existing = target.intel;
        if (!force && existing?.fetchedAt && now - existing.fetchedAt < this.intelCacheMs) {
            return existing;
        }

        try {
            const intel = await window.tornStatsAPI.fetchSpy(uid, { force });
            const payload = {
                source: 'tornstats',
                status: intel?.status !== false,
                message: intel?.message || (intel?.stats ? 'Intel available' : 'Intel unavailable'),
                stats: intel?.stats || null,
                compare: intel?.compare || null,
                attacks: intel?.attacks || null,
                fetchedAt: intel?.fetchedAt || now,
                lastSeen: intel?.timestamp || intel?.lastSeen || null,
                type: intel?.type || intel?.stats?.type || ''
            };

            target.intel = payload;
            target.difficulty = this.getTargetDifficulty(target);
            this.targets.set(uid, target);
            await this.saveTargetsImmediate();
            this.queueCachePersist(target);
            this.emit('target-updated', target);
            return payload;
        } catch (error) {
            const cachedIntel = existing ? {
                ...existing,
                stats: existing.stats ? { ...existing.stats } : null,
                compare: existing.compare ? { ...existing.compare } : null,
                attacks: existing.attacks ? { ...existing.attacks } : null,
                message: existing.message || 'Using cached intelligence',
                status: existing.status !== undefined ? existing.status : true,
                error: error.message,
                lastErrorAt: now
            } : null;

            const payload = cachedIntel || {
                source: 'tornstats',
                status: false,
                message: error.message || 'Failed to fetch intelligence',
                fetchedAt: now,
                error: error.message
            };

            target.intel = payload;
            target.difficulty = this.getTargetDifficulty(target);
            this.targets.set(uid, target);
            try {
                await this.saveTargetsImmediate();
            } catch (e) {
                // Error already logged in saveTargetsImmediate
            }
            this.emit('target-updated', target);
            return payload;
        }
    }

    // ========================================================================
    // GROUP MANAGEMENT
    // ========================================================================

    async addGroup(name, color = '#007acc') {
        const id = 'group-' + Date.now();
        const group = { id, name, color, isDefault: false, noAttack: false };

        this.groups.push(group);
        const saved = await this.saveGroups();
        if (!saved) {
            this.groups = this.groups.filter(g => g.id !== id);
            return null;
        }
        this.emit('groups-changed');

        return group;
    }

    async updateGroup(groupId, updates) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group || group.isDefault) return false;

        const original = { ...group };
        Object.assign(group, updates);
        const saved = await this.saveGroups();
        if (!saved) {
            Object.assign(group, original);
            return false;
        }
        this.emit('groups-changed');

        return true;
    }

    async toggleGroupNoAttack(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group || group.isDefault) return false;

        group.noAttack = !group.noAttack;
        const saved = await this.saveGroups();
        if (!saved) {
            group.noAttack = !group.noAttack;
            return false;
        }
        this.emit('groups-changed');

        return group.noAttack;
    }

    async removeGroup(groupId) {
        const index = this.groups.findIndex(g => g.id === groupId);
        if (index === -1 || this.groups[index].isDefault) return false;

        this.groups.splice(index, 1);

        // Move targets to default group
        for (const target of this.targets.values()) {
            if (target.groupId === groupId) {
                target.groupId = 'default';
            }
        }

        if (this.activeGroupId === groupId) {
            this.setActiveGroup('all');
        }

        const groupsSaved = await this.saveGroups();
        let targetsSaved = false;

        try {
            await this.saveTargetsImmediate();
            targetsSaved = true;
        } catch (error) {
            targetsSaved = false;
        }

        if (!groupsSaved || !targetsSaved) {
            this.emit('error', 'Failed to persist changes after removing group');
            return false;
        }
        this.emit('groups-changed');
        this.emit('targets-changed');

        return true;
    }

    async saveGroups() {
        try {
            const result = await window.electronAPI.saveGroups(this.groups);
            if (result && result.success === false) {
                throw new Error(result.error || 'Save groups failed');
            }
            return true;
        } catch (error) {
            this.log('error', 'Failed to save groups', { error: error.message });
            this.emit('error', 'Failed to save groups: ' + error.message);
            return false;
        }
    }

    getGroup(groupId) {
        return this.groups.find(g => g.id === groupId);
    }

    // ========================================================================
    // FILTERING & SEARCH
    // ========================================================================

    setActiveGroup(groupId) {
        this.activeGroupId = groupId;
        this.emit('filter-changed');
    }

    setActiveFilter(filter) {
        this.activeFilter = filter;
        this.emit('filter-changed');
    }

    setSearchQuery(query) {
        this.searchQuery = query;
        this.emit('filter-changed');
    }

    setSort(sortBy, direction = null) {
        if (this.sortBy === sortBy && direction === null) {
            // Toggle direction
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortBy = sortBy;
            this.sortDirection = direction || 'asc';
        }
        this.emit('sort-changed');
    }

    // ========================================================================
    // REFRESH
    // ========================================================================

    async refreshTarget(userId) {
        const uid = parseInt(userId, 10);
        if (!this.api.hasApiKey()) {
            this.emit('error', 'API key not configured');
            return null;
        }

        const existing = this.targets.get(uid);
        if (!existing) return null;

        let info;
        try {
            info = await this.api.fetchUser(uid);
        } catch (error) {
            this.log('error', 'Unexpected refresh failure', { userId: uid, error: error.message });
            const fallback = existing || new TargetInfo({ userId: uid });
            fallback.error = error.message;
            fallback.lastUpdated = Date.now();
            fallback.difficulty = this.getTargetDifficulty(fallback);
            this.targets.set(uid, fallback);
            try {
                await this.saveTargetsImmediate();
            } catch (e) {
                // Error already logged in saveTargetsImmediate
            }
            this.emit('target-updated', fallback);
            return fallback;
        }

        // Preserve custom fields from existing target
        info.customName = existing.customName;
        info.notes = existing.notes;
        info.groupId = existing.groupId;
        info.tags = existing.tags;
        info.isFavorite = existing.isFavorite;
        info.priority = existing.priority;
        info.monitorOk = existing.monitorOk;
        info.addedAt = existing.addedAt;
        info.attackCount = existing.attackCount;
        info.lastAttacked = existing.lastAttacked;
        info.avatarPath = existing.avatarPath;
        info.avatarUrl = info.avatarUrl || existing.avatarUrl;

        // If avatar source changed, drop cached path
        if (existing.avatarUrl && info.avatarUrl && existing.avatarUrl !== info.avatarUrl) {
            info.avatarPath = '';
        }

        // Merge with cache/existing data to prevent regressions on fetch errors
        info = this.applyCachedData(info, existing);
        info.difficulty = this.getTargetDifficulty(info);

        // If fetch failed, keep cache/existing data but mark error for visibility
        if (info.error) {
            info.ok = false;
            this.targets.set(uid, info);
            try {
                await this.saveTargetsImmediate();
            } catch (e) {
                // Error already logged in saveTargetsImmediate
            }
            this.emit('target-updated', info);
            return info;
        }

        // Check for status change (for notifications)
        const wasAttackable = existing.isAttackable();
        const isNowAttackable = info.isAttackable();

        // Update target in memory
        this.targets.set(uid, info);

        // Save immediately to JSON to ensure data is persisted
        await this.saveTargetsImmediate();
        this.queueCachePersist(info);
        await this.flushCacheQueue();

        this.emit('target-updated', info);

        // Notification logic with filtering
        if (this.settings.notifications) {
            // Check if we should notify for this target
            const shouldNotify = !this.settings.notifyOnlyMonitored || info.monitorOk;
            let notificationShown = false;

            // Notify if target became attackable
            if (!wasAttackable && isNowAttackable && shouldNotify) {
                window.electronAPI.showNotification(
                    'Target Available!',
                    `${info.getDisplayName()} is now attackable`
                );
                notificationShown = true;
            }

            // Notify on hospital release
            if (existing && this.settings.notifyOnHospitalRelease && shouldNotify) {
                const wasInHospital = existing.isInHospital();
                const isNowInHospital = info.isInHospital();
                if (wasInHospital && !isNowInHospital) {
                    window.electronAPI.showNotification(
                        'Target Left Hospital',
                        `${info.getDisplayName()} is out of hospital`
                    );
                    notificationShown = true;
                }
            }

            // Notify on jail release
            if (existing && this.settings.notifyOnJailRelease && shouldNotify) {
                const wasInJail = existing.isInJail();
                const isNowInJail = info.isInJail();
                if (wasInJail && !isNowInJail) {
                    window.electronAPI.showNotification(
                        'Target Left Jail',
                        `${info.getDisplayName()} is out of jail`
                    );
                    notificationShown = true;
                }
            }

            // Notify on general status change (if not already notified by specific events above)
            if (existing && this.settings.notifyOnStatusChange && shouldNotify && !notificationShown) {
                const oldStatus = existing.status?.state || existing.status?.description || 'Unknown';
                const newStatus = info.status?.state || info.status?.description || 'Unknown';
                if (oldStatus !== newStatus && oldStatus !== 'Unknown') {
                    window.electronAPI.showNotification(
                        'Target Status Changed',
                        `${info.getDisplayName()}: ${oldStatus} → ${newStatus}`
                    );
                    notificationShown = true;
                }
            }

            // Play notification sound if any notification was shown
            if (notificationShown && this.settings.soundEnabled) {
                this.emit('play-notification-sound');
            }
        }

        return info;
    }

    async refreshTargets(userIds) {
        if (!this.api.hasApiKey()) {
            this.emit('error', 'API key not configured');
            return;
        }

        // Use existing refresh mechanism
        const originalTargets = this.getTargets();
        const targetsToRefresh = userIds 
            ? originalTargets.filter(t => userIds.includes(t.userId))
            : originalTargets;

        if (targetsToRefresh.length === 0) return;

        await this.doRefresh(targetsToRefresh.map(t => t.userId));
    }

    async refreshAllTargets() {
        if (!this.api.hasApiKey()) {
            this.emit('error', 'API key not configured');
            return;
        }

        if (this.isRefreshing) {
            this.log('info', 'Refresh already in progress - ignoring duplicate request');
            this.emit('refresh-blocked', {
                reason: 'already_in_progress',
                progress: this.refreshProgress
            });
            return;
        }

        const targetIds = Array.from(this.targets.keys());
        if (targetIds.length === 0) {
            this.log('info', 'No targets to refresh');
            return;
        }

        await this.doRefresh(targetIds);
    }

    async doRefresh(targetIds) {
        if (this.isRefreshing) {
            this.log('warn', 'Attempted to start refresh while one is already in progress');
            return;
        }

        // Reorder targets to prioritize monitored/critical statuses
        const prioritizedIds = this.prioritizeTargetsForRefresh(targetIds);

        this.isRefreshing = true;
        this.refreshController = new AbortController();
        this.refreshProgress = { current: 0, total: prioritizedIds.length, percent: 0 };

        this.emit('refresh-started', this.refreshProgress);
        this.log('info', `Starting refresh of ${prioritizedIds.length} targets`);

        try {
            await this.api.fetchUsers(
                prioritizedIds,
                this.refreshController.signal,
                this.settings.maxConcurrentRequests,
                (progress) => {
                    if (!progress) {
                        this.log('warn', 'Invalid progress callback - missing data', progress);
                        return;
                    }

                    // Handle pause updates (no target provided)
                    if (progress.paused) {
                        const safeProgress = {
                            ...progress,
                            current: Math.min(progress.current || 0, progress.total || 0),
                            total: progress.total || 0,
                            percent: Math.min(100, Math.max(0, progress.percent || 0))
                        };
                        this.refreshProgress = safeProgress;
                        this.emit('refresh-progress', safeProgress);
                        return;
                    }

                    // Validate progress object and target
                    if (!progress.target) {
                        this.log('warn', 'Progress callback missing target', progress);
                        return;
                    }

                    // Validate target has userId
                    if (!progress.target.userId) {
                        this.log('error', 'Progress target missing userId', { target: progress.target });
                        return;
                    }

                    // Preserve custom fields
                    const existing = this.targets.get(progress.target.userId);
                    if (existing) {
                        progress.target.customName = existing.customName;
                        progress.target.notes = existing.notes;
                        progress.target.groupId = existing.groupId;
                        progress.target.tags = existing.tags;
                        progress.target.isFavorite = existing.isFavorite;
                        progress.target.priority = existing.priority;
                        progress.target.monitorOk = existing.monitorOk;
                        progress.target.addedAt = existing.addedAt;
                        progress.target.attackCount = existing.attackCount;
                        progress.target.lastAttacked = existing.lastAttacked;
                        progress.target.avatarPath = existing.avatarPath;
                        progress.target.avatarUrl = progress.target.avatarUrl || existing.avatarUrl;

                        if (existing.avatarUrl && progress.target.avatarUrl && existing.avatarUrl !== progress.target.avatarUrl) {
                            progress.target.avatarPath = '';
                        }
                    }

                    progress.target = this.applyCachedData(progress.target, existing);

                    // Log errors for debugging
                    if (progress.target.error) {
                        progress.target.ok = false;
                        this.log('warn', `Error fetching user ${progress.target.userId}: ${progress.target.error}`);
                    }

                    const safeProgress = {
                        ...progress,
                        current: Math.min(progress.current || 0, progress.total || 0),
                        percent: Math.min(100, Math.max(0, progress.percent || 0))
                    };

                    this.targets.set(progress.target.userId, progress.target);
                    this.refreshProgress = safeProgress;
                    this.emit('refresh-progress', safeProgress);
                    this.emit('target-updated', progress.target);

                    // Save immediately after each target to ensure data persistence
                    // Use non-blocking save to not slow down the refresh
                    this.saveTargets();
                    this.queueCachePersist(progress.target);
                }
            );

            // Final immediate save to ensure all data is persisted
            try {
                await this.saveTargetsImmediate();
                this.lastRefresh = Date.now();
                await this.flushCacheQueue();
            } catch (saveError) {
                this.log('error', 'Failed to save after refresh', { error: saveError.message });
                this.emit('error', 'Warning: Failed to save some target data');
            }

        } catch (error) {
            if (error.name === 'AbortError') {
                this.log('info', 'Refresh was cancelled by user');
                this.emit('refresh-cancelled');
            } else {
                this.log('error', 'Refresh failed', { error: error.message, stack: error.stack });
                this.emit('error', 'Refresh failed: ' + error.message);
            }
        } finally {
            this.isRefreshing = false;
            this.refreshController = null;
            this.refreshProgress = { current: 0, total: 0, percent: 0 };
            await this.flushCacheQueue();
            this.emit('refresh-completed');
            this.log('info', 'Refresh completed');
        }
    }

    /**
     * Order targets so critical/monitored users refresh first
     */
    prioritizeTargetsForRefresh(targetIds) {
        const ids = Array.from(new Set(targetIds.map(id => parseInt(id, 10)).filter(Boolean)));
        const scored = ids.map(id => {
            const target = this.targets.get(id);
            let score = 0;
            if (target) {
                const state = (target.statusState || '').toLowerCase();
                const isWaiting = state === 'hospital' || state === 'jail' || state === 'jailed' || state === 'federal';
                if (target.monitorOk) score += 5;
                if (isWaiting) score += 3;
                if (!target.ok && target.lastUpdated) score += 1;
            }
            return { id, score };
        });

        scored.sort((a, b) => b.score - a.score);
        return scored.map(s => s.id);
    }

    cancelRefresh() {
        if (this.refreshController) {
            this.refreshController.abort();
            this.emit('refresh-cancelled');
        }
    }

    startAutoRefresh(skipInitialRefresh = false) {
        this.stopAutoRefresh();

        if (!this.settings.autoRefresh || !this.settings.apiKey) return;

        const intervalMs = Math.max(10, this.settings.refreshInterval) * 1000;

        this.refreshTimer = setInterval(() => {
            if (!this.isRefreshing) {
                this.refreshAllTargets();
            }
        }, intervalMs);

        // Initial refresh (skip when restarting due to settings change)
        if (!skipInitialRefresh && this.targets.size > 0 && !this.isRefreshing) {
            this.refreshAllTargets();
        }
    }

    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    // ========================================================================
    // ATTACK TRACKING
    // ========================================================================

    async recordAttack(userId, context = {}) {
        const uid = parseInt(userId, 10);
        const target = this.targets.get(uid);
        const group = target ? this.getGroup(target.groupId) : null;
        const baseRecord = {
            userId: uid,
            targetName: target?.getDisplayName() || `User ${uid}`,
            type: 'attack',
            timestamp: new Date().toISOString(),
            status: target?.statusState || 'Unknown',
            statusDesc: target?.statusDesc || '',
            statusUntil: target?.statusUntil || null,
            level: target?.level ?? null,
            groupId: target?.groupId || 'default',
            groupName: group?.name || '',
            source: context.source || this.currentView || 'manual'
        };

        if (target) {
            target.attackCount = (target.attackCount || 0) + 1;
            target.lastAttacked = Date.now();
            await this.saveTargets();
            this.emit('target-updated', target);
        }

        try {
            const result = await window.electronAPI.addAttackRecord(baseRecord);
            const persistedRecord = result?.record
                ? { ...baseRecord, ...result.record }
                : baseRecord;

            if (result?.added === false) {
                this.attackHistory = await window.electronAPI.getAttackHistory();
            } else {
                this.attackHistory.push(persistedRecord);
                if (this.attackHistory.length > 1000) {
                    this.attackHistory.splice(0, this.attackHistory.length - 1000);
                }
            }

            if (result?.stats) {
                this.statistics = { ...this.statistics, ...result.stats };
            } else {
                this.statistics.totalAttacks = (this.statistics.totalAttacks || 0) + 1;
            }

            this.emit('statistics-changed');
            this.emit('attack-history-changed', this.attackHistory);
        } catch (error) {
            this.log('error', 'Failed to record attack', { error: error.message });
        }
    }

    /**
     * Get recent history entries for a target
     */
    getTargetHistory(userId, limit = 8) {
        if (!Array.isArray(this.attackHistory)) return [];
        const uid = parseInt(userId, 10);
        return this.attackHistory
            .filter(r => r.userId === uid)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }

    // ========================================================================
    // BOUNTIES
    // ========================================================================

    normalizeBountyState(data = {}) {
        const alert = data && typeof data.alert === 'object' ? data.alert : {};
        const stats = data.stats ? this.normalizeBountyStats(data.stats) : null;
        const watchlist = Array.isArray(data.watchlist)
            ? data.watchlist.map(entry => this.normalizeBountyEntry(entry)).filter(Boolean)
            : [];
        const baselineReceived = Number.isFinite(data.lastAlertedReceived)
            ? data.lastAlertedReceived
            : (stats?.received ?? null);
        const inferredDelta = stats && stats.received !== null && baselineReceived !== null
            ? Math.max(0, stats.received - baselineReceived)
            : 0;

        return {
            stats,
            watchlist,
            lastAlertedReceived: baselineReceived,
            alert: {
                active: alert.active || inferredDelta > 0,
                delta: Number.isFinite(alert.delta) ? alert.delta : inferredDelta
            }
        };
    }

    normalizeBountyStats(stats = {}) {
        if (!stats || typeof stats !== 'object') return null;
        return {
            collected: this.toNumberOrNull(stats.collected),
            placed: this.toNumberOrNull(stats.placed),
            received: this.toNumberOrNull(stats.received),
            reward: this.toNumberOrNull(stats.reward),
            spent: this.toNumberOrNull(stats.spent),
            valueOnYou: this.toNumberOrNull(stats.valueOnYou),
            lastUpdated: stats.lastUpdated || Date.now(),
            source: stats.source || 'api'
        };
    }

    normalizeBountyEntry(entry) {
        if (!entry || typeof entry !== 'object') return null;
        const now = Date.now();
        const addedAt = Number(entry.addedAt) || now;
        const expiresAt = Number(entry.expiresAt) || (addedAt + this.bountyExpiryMs);
        const targetId = InputParser.isValidUserId(entry.targetId) ? parseInt(entry.targetId, 10) : null;
        const reward = this.parseMoneyValue(entry.reward);

        return {
            id: entry.id || `bounty-${addedAt}-${Math.floor(Math.random() * 1000)}`,
            targetId,
            targetName: this.safeBountyName(entry.targetName, targetId),
            reward,
            addedAt,
            expiresAt,
            claimedAt: entry.claimedAt ? Number(entry.claimedAt) : null,
            notes: (entry.notes || '').toString().slice(0, 500)
        };
    }

    parseMoneyValue(value) {
        if (value === null || value === undefined || value === '') return null;
        if (typeof value === 'number') {
            return Number.isFinite(value) ? Math.max(0, Math.round(value)) : null;
        }
        if (typeof value === 'string') {
            const cleaned = value.replace(/[^0-9.-]/g, '');
            if (!cleaned) return null;
            const num = Number(cleaned);
            return Number.isFinite(num) ? Math.max(0, Math.round(num)) : null;
        }
        return null;
    }

    isBountyExpired(entry, now = Date.now()) {
        if (!entry) return false;
        if (!entry.expiresAt) return false;
        return entry.expiresAt < now;
    }

    getBountyState() {
        return {
            stats: this.bounties.stats ? { ...this.bounties.stats } : null,
            watchlist: this.bounties.watchlist.map(item => ({ ...item })),
            alert: { ...(this.bounties.alert || { active: false, delta: 0 }) }
        };
    }

    getBountyStats() {
        const defaults = {
            collected: 0,
            placed: 0,
            received: 0,
            reward: null,
            spent: null,
            valueOnYou: null,
            lastUpdated: null,
            source: null
        };
        if (!this.bounties.stats) return defaults;
        return { ...defaults, ...this.bounties.stats };
    }

    getBountyWatchlist(options = {}) {
        const includeExpired = options.includeExpired !== false;
        const includeClaimed = options.includeClaimed !== false;
        const now = Date.now();

        return this.bounties.watchlist
            .map(item => ({
                ...item,
                isExpired: this.isBountyExpired(item, now),
                isClaimed: !!item.claimedAt
            }))
            .filter(item => (includeExpired || !item.isExpired) && (includeClaimed || !item.isClaimed))
            .sort((a, b) => (a.expiresAt || 0) - (b.expiresAt || 0));
    }

    getActiveBountyForTarget(userId) {
        const uid = parseInt(userId, 10);
        if (!Number.isFinite(uid)) return null;
        return this.bounties.watchlist.find(item =>
            item.targetId === uid &&
            !item.claimedAt &&
            !this.isBountyExpired(item)
        ) || null;
    }

    hasActiveBounty(userId) {
        return !!this.getActiveBountyForTarget(userId);
    }

    async addBountyEntry(targetInput, rewardInput = null) {
        const reward = this.parseMoneyValue(rewardInput);
        const targetId = InputParser.extractUserId(targetInput || '');
        const providedName = (targetInput || '').toString().trim();

        // Determine target name - fetch from API if only ID was provided
        let targetName;
        const isOnlyId = targetId && (!providedName || providedName === String(targetId));

        if (isOnlyId && this.api && this.api.hasApiKey()) {
            // Try to fetch name from API
            try {
                const userData = await this.api.fetchUser(targetId);
                targetName = (userData?.name && !userData?.error)
                    ? userData.name
                    : this.safeBountyName(providedName, targetId);
            } catch (err) {
                this.log('warn', 'Failed to fetch bounty target name', { targetId, error: err.message });
                targetName = this.safeBountyName(providedName, targetId);
            }
        } else if (providedName && providedName !== String(targetId)) {
            targetName = providedName;
        } else {
            targetName = this.safeBountyName(providedName, targetId);
        }

        const now = Date.now();
        const expiresAt = now + this.bountyExpiryMs;

        const existingIndex = this.bounties.watchlist.findIndex(item =>
            item.targetId &&
            targetId &&
            item.targetId === targetId &&
            !item.claimedAt &&
            !this.isBountyExpired(item)
        );

        let entry;
        if (existingIndex >= 0) {
            entry = {
                ...this.bounties.watchlist[existingIndex],
                reward: reward ?? this.bounties.watchlist[existingIndex].reward,
                targetName
            };
            this.bounties.watchlist[existingIndex] = entry;
        } else {
            entry = {
                id: `bounty-${now}-${Math.floor(Math.random() * 100000)}`,
                targetId: targetId || null,
                targetName,
                reward,
                addedAt: now,
                expiresAt,
                claimedAt: null,
                notes: ''
            };
            this.bounties.watchlist.unshift(entry);
        }

        await this.saveBounties();
        this.emit('bounties-changed', this.getBountyState());
        return { entry, updated: existingIndex >= 0 };
    }

    async removeBountyEntry(entryId) {
        const initialLength = this.bounties.watchlist.length;
        this.bounties.watchlist = this.bounties.watchlist.filter(item => item.id !== entryId);

        if (this.bounties.watchlist.length !== initialLength) {
            await this.saveBounties();
            this.emit('bounties-changed', this.getBountyState());
            return true;
        }
        return false;
    }

    async markBountyClaimed(entryId, claimed = true) {
        const idx = this.bounties.watchlist.findIndex(item => item.id === entryId);
        if (idx === -1) return false;

        this.bounties.watchlist[idx] = {
            ...this.bounties.watchlist[idx],
            claimedAt: claimed ? Date.now() : null
        };

        await this.saveBounties();
        this.emit('bounties-changed', this.getBountyState());
        return true;
    }

    async refreshBountyStats() {
        if (!this.api || !this.api.hasApiKey()) {
            throw new Error('API key not configured');
        }

        const result = await this.api.fetchPersonalStats();
        if (result.error) {
            throw new Error(result.error);
        }

        const mapped = this.mapPersonalStatsToBountyStats(result.personalstats || {});
        const previousStats = this.bounties.stats || {};
        const stats = {
            collected: mapped.collected ?? previousStats.collected ?? 0,
            placed: mapped.placed ?? previousStats.placed ?? 0,
            received: mapped.received ?? previousStats.received ?? 0,
            reward: mapped.reward ?? previousStats.reward ?? null,
            spent: mapped.spent ?? previousStats.spent ?? null,
            valueOnYou: mapped.valueOnYou ?? previousStats.valueOnYou ?? null,
            lastUpdated: Date.now(),
            source: 'api'
        };

        const alertBaseline = Number.isFinite(this.bounties.lastAlertedReceived)
            ? this.bounties.lastAlertedReceived
            : (previousStats.received ?? stats.received ?? 0);
        const alertDelta = (stats.received !== null && alertBaseline !== null)
            ? stats.received - alertBaseline
            : 0;

        if (!Number.isFinite(this.bounties.lastAlertedReceived) && stats.received !== null) {
            this.bounties.lastAlertedReceived = stats.received;
        }

        this.bounties.stats = stats;
        this.bounties.alert = {
            active: alertDelta > 0,
            delta: alertDelta > 0 ? alertDelta : 0
        };

        await this.saveBounties();
        this.emit('bounties-changed', this.getBountyState());
        if (this.bounties.alert.active) {
            this.emit('bounty-alert', this.bounties.alert);
        }

        return stats;
    }

    async dismissBountyAlert() {
        if (this.bounties.stats && Number.isFinite(this.bounties.stats.received)) {
            this.bounties.lastAlertedReceived = this.bounties.stats.received;
        }
        this.bounties.alert = { active: false, delta: 0 };
        await this.saveBounties();
        this.emit('bounties-changed', this.getBountyState());
    }

    getBountyAlert() {
        return this.bounties.alert || { active: false, delta: 0 };
    }

    async saveBounties() {
        if (!window.electronAPI?.saveBounties) return;
        try {
            await window.electronAPI.saveBounties(this.bounties);
        } catch (error) {
            this.log('error', 'Failed to save bounties', { error: error.message });
        }
    }

    mapPersonalStatsToBountyStats(personalStats = {}) {
        const getNumber = (keys) => this.pickFirstNumber(personalStats, keys);
        return {
            collected: getNumber(['bountiescollected', 'bounties_collected']),
            placed: getNumber(['bountiesplaced', 'bounties_placed']),
            received: getNumber(['bountiesreceived', 'bounties_received']),
            reward: getNumber(['moneyfrombounties', 'money_bounties_collected', 'bountyrewards', 'totalbountyreward']),
            spent: getNumber(['moneyspentbounties', 'money_bounties_placed', 'moneyspentonbounties', 'moneyputonbounties']),
            valueOnYou: getNumber(['highestbounty', 'valueonself', 'bountyvalue', 'value_on_you'])
        };
    }

    pickFirstNumber(source, keys = []) {
        if (!source || typeof source !== 'object') return null;
        for (const key of keys) {
            if (key in source) {
                const num = Number(source[key]);
                if (Number.isFinite(num)) return num;
            }
        }
        return null;
    }

    safeBountyName(name, targetId = null) {
        const trimmed = (name || '').toString().trim();
        if (trimmed) return trimmed;
        if (targetId) {
            const target = this.targets.get(targetId);
            if (target) return target.getDisplayName();
            return `User ${targetId}`;
        }
        return 'Unknown target';
    }

    toNumberOrNull(value) {
        const num = Number(value);
        return Number.isFinite(num) ? num : null;
    }

    // ========================================================================
    // SETTINGS
    // ========================================================================

    async updateSettings(newSettings) {
        const oldApiKey = this.settings.apiKey;
        const oldAutoRefresh = this.settings.autoRefresh;
        const oldInterval = this.settings.refreshInterval;
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

        // Update API key
        if (normalizedSettings.apiKey !== undefined && normalizedSettings.apiKey !== oldApiKey) {
            this.api.setApiKey(normalizedSettings.apiKey);
        }

        // Handle auto-refresh changes (skip initial refresh to avoid conflicts)
        if (normalizedSettings.autoRefresh !== oldAutoRefresh ||
            normalizedSettings.refreshInterval !== oldInterval) {
            if (this.settings.autoRefresh && this.settings.apiKey) {
                this.startAutoRefresh(true); // Skip initial refresh when restarting
            } else {
                this.stopAutoRefresh();
            }
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
            autoRefresh: this.settings.autoRefresh,
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

// Create global instance
window.appState = new AppState();
