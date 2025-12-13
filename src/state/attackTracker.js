/**
 * Torn Target Tracker - Attack Tracker Module
 */

(function() {
    if (typeof AppState === "undefined") return;

    class AppStateAttackTracker extends AppState {
    // ATTACK TRACKING
    // ========================================================================

    initializeAttackTrackerFromSettings() {
        const completed = Array.isArray(this.settings.attackTrackerCompleted)
            ? this.settings.attackTrackerCompleted
                .map(id => parseInt(id, 10))
                .filter(id => Number.isFinite(id))
            : [];

        this.attackTracker = {
            enabled: !!this.settings.attackTrackerEnabled,
            completed: new Set(completed),
            startedAt: this.settings.attackTrackerStartedAt || null
        };

        if (this.attackTracker.enabled && !this.attackTracker.startedAt) {
            this.attackTracker.startedAt = Date.now();
            this.queueAttackTrackerPersist();
        }
    }

    queueAttackTrackerPersist() {
        const trackerSettings = {
            attackTrackerEnabled: !!this.attackTracker.enabled,
            attackTrackerStartedAt: this.attackTracker.startedAt || null,
            attackTrackerCompleted: Array.from(this.attackTracker.completed || [])
        };

        this.settings = { ...this.settings, ...trackerSettings };

        if (this.attackTrackerPersistTimer) {
            clearTimeout(this.attackTrackerPersistTimer);
        }

        this.attackTrackerPersistTimer = setTimeout(() => {
            window.electronAPI.saveSettings(this.settings).catch((error) => {
                this.log('warn', 'Failed to persist attack tracker state', { error: error.message });
            });
        }, 250);
    }

    getAttackTrackerSnapshot() {
        return {
            enabled: !!this.attackTracker?.enabled,
            startedAt: this.attackTracker?.startedAt || null,
            completedIds: Array.from(this.attackTracker?.completed || [])
        };
    }

    getAttackTrackerCounts(targetIds = null) {
        const ids = Array.isArray(targetIds) && targetIds.length
            ? targetIds.map(id => parseInt(id, 10)).filter(Number.isFinite)
            : Array.from(this.targets.keys());
        const completed = this.attackTracker?.completed || new Set();
        const done = ids.reduce((count, id) => count + (completed.has(id) ? 1 : 0), 0);
        return { done, total: ids.length };
    }

    isTargetTracked(userId) {
        const uid = parseInt(userId, 10);
        if (!Number.isFinite(uid)) return false;
        return this.attackTracker?.completed?.has(uid) || false;
    }

    setAttackTrackerEnabled(enabled) {
        const normalized = !!enabled;
        if (!this.attackTracker) {
            this.attackTracker = { enabled: false, completed: new Set(), startedAt: null };
        }
        if (this.attackTracker.enabled === normalized) {
            return this.getAttackTrackerSnapshot();
        }

        this.attackTracker.enabled = normalized;
        if (normalized && !this.attackTracker.startedAt) {
            this.attackTracker.startedAt = Date.now();
        }

        this.queueAttackTrackerPersist();
        this.emit('attack-tracker-changed', this.getAttackTrackerSnapshot());
        return this.getAttackTrackerSnapshot();
    }

    resetAttackTracker() {
        if (!this.attackTracker) {
            this.attackTracker = { enabled: false, completed: new Set(), startedAt: null };
        }
        this.attackTracker.completed = new Set();
        this.attackTracker.startedAt = Date.now();
        this.queueAttackTrackerPersist();
        this.emit('attack-tracker-changed', this.getAttackTrackerSnapshot());
    }

    untrackTarget(userId) {
        const uid = parseInt(userId, 10);
        if (!Number.isFinite(uid) || !this.attackTracker?.completed?.has(uid)) return false;
        this.attackTracker.completed.delete(uid);
        this.queueAttackTrackerPersist();
        this.emit('attack-tracker-changed', this.getAttackTrackerSnapshot());
        return true;
    }

    markTargetTracked(userId) {
        if (!this.attackTracker?.enabled) return false;
        const uid = parseInt(userId, 10);
        if (!Number.isFinite(uid)) return false;
        const before = this.attackTracker.completed.size;
        this.attackTracker.completed.add(uid);
        if (this.attackTracker.completed.size !== before) {
            this.queueAttackTrackerPersist();
            this.emit('attack-tracker-changed', this.getAttackTrackerSnapshot());
            return true;
        }
        return false;
    }

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

        this.markTargetTracked(uid);

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
                const maxEntries = this.settings.maxHistoryEntries || 1000;
                if (this.attackHistory.length > maxEntries) {
                    this.attackHistory.splice(0, this.attackHistory.length - maxEntries);
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
    }

    const proto = AppStateAttackTracker.prototype;
    Object.getOwnPropertyNames(proto)
        .filter(name => name !== 'constructor')
        .forEach(name => {
            AppState.prototype[name] = proto[name];
        });
})();
