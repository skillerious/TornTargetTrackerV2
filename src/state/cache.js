/**
 * Torn Target Tracker - State Cache Module
 * Target cache loading and persistence
 */

(function() {
    if (typeof AppState === "undefined") return;

    class AppStateCache extends AppState {
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

        // For volatile status fields, fresh API data ALWAYS wins over cached data
        // This prevents stale hospital/jail timers from persisting after status changes
        const preferFreshStatus = (incomingVal, ...fallbacks) => {
            // If incoming has a defined value (even empty string or 0), use it
            if (incomingVal !== undefined && incomingVal !== null) {
                return incomingVal;
            }
            // Only fall back to cached if incoming is truly undefined/null
            for (const v of fallbacks) {
                if (v !== undefined && v !== null) return v;
            }
            return null;
        };

        // Determine if this is fresh API data (has lastUpdated that's recent)
        const isFreshData = incoming.lastUpdated &&
            (Date.now() - incoming.lastUpdated) < 60000; // Within last minute

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

            // Helper to check if intel has actual stat data
            const hasValidStats = (intel) => {
                return intel?.stats && (
                    intel.stats.strength || intel.stats.defense ||
                    intel.stats.speed || intel.stats.dexterity
                );
            };

            // Find manual entries with valid stats (these should be preserved)
            const manualWithStats = valid.find(intel =>
                intel.source === 'manual' && hasValidStats(intel)
            );

            // Find API entries with valid stats
            const apiWithStats = valid.filter(intel =>
                intel.source !== 'manual' && hasValidStats(intel)
            );

            // Priority:
            // 1. Most recent API data WITH valid stats
            // 2. Manual entry with valid stats (preserved if no valid API data)
            // 3. Most recent of any intel (fallback)
            if (apiWithStats.length > 0) {
                // Pick the most recent API data with stats
                const bestApi = apiWithStats.reduce((acc, curr) => {
                    const accTs = acc.fetchedAt || acc.lastSeen || 0;
                    const currTs = curr.fetchedAt || curr.lastSeen || 0;
                    return currTs > accTs ? curr : acc;
                }, apiWithStats[0]);
                return cloneIntel(bestApi);
            }

            // No valid API stats - preserve manual entry if it has stats
            if (manualWithStats) {
                return cloneIntel(manualWithStats);
            }

            // Fallback: pick the most recent intel of any kind
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
            // Status fields: fresh API data always wins to prevent stale status display
            // When someone leaves hospital, we must not show old timer from cache
            statusState: isFreshData
                ? (incoming.statusState || 'Unknown')
                : preferString(incoming.statusState, cached?.statusState, base.statusState, 'Unknown'),
            statusDesc: isFreshData
                ? (incoming.statusDesc || '')
                : preferString(incoming.statusDesc, cached?.statusDesc, base.statusDesc),
            statusReason: isFreshData
                ? (incoming.statusReason || '')
                : preferString(incoming.statusReason, cached?.statusReason, base.statusReason),
            statusUntil: isFreshData
                ? preferFreshStatus(incoming.statusUntil, 0)
                : preferNumber(incoming.statusUntil, cached?.statusUntil, base.statusUntil),
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
    }

    const proto = AppStateCache.prototype;
    Object.getOwnPropertyNames(proto)
        .filter(name => name !== 'constructor')
        .forEach(name => {
            AppState.prototype[name] = proto[name];
        });
})();
