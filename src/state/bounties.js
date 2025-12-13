/**
 * Torn Target Tracker - Bounties Module
 */

(function() {
    if (typeof AppState === "undefined") return;

    class AppStateBounties extends AppState {
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
            notes: (entry.notes || '').toString().slice(0, 500),
            // API-fetched data (persisted until bounty is deleted)
            level: entry.level ?? null,
            faction: entry.faction || null,
            factionId: entry.factionId ?? null,
            gender: entry.gender || null,
            age: entry.age ?? null,
            lastActionStatus: entry.lastActionStatus || null,
            lastActionRelative: entry.lastActionRelative || null,
            lastActionTimestamp: entry.lastActionTimestamp ?? null,
            apiDataFetchedAt: entry.apiDataFetchedAt ?? null
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

        // Clean and normalize before presenting
        this.tidyBounties({ persist: false }).catch(() => {});

        return this.bounties.watchlist
            .map(item => ({
                ...item,
                isExpired: this.isBountyExpired(item, now),
                isClaimed: !!item.claimedAt
            }))
            .filter(item => (includeExpired || !item.isExpired) && (includeClaimed || !item.isClaimed));
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

        // Decide an immediate name (fallback) so we can add instantly
        let targetName;
        if (providedName && providedName !== String(targetId)) {
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

        await this.tidyBounties({ persist: true });

        // Fire-and-forget API data fetch to avoid blocking UI
        // Fetch full data if: we have a target ID AND (this is a new entry OR existing entry has no API data yet)
        const shouldFetchApiData = targetId && (existingIndex < 0 || !entry.apiDataFetchedAt);
        if (shouldFetchApiData) {
            this.fetchBountyTargetDataAsync(targetId, entry.id).catch(() => {});
        }

        this.emit('bounties-changed', this.getBountyState());
        return { entry, updated: existingIndex >= 0 };
    }

    async removeBountyEntry(entryId) {
        const initialLength = this.bounties.watchlist.length;
        this.bounties.watchlist = this.bounties.watchlist.filter(item => item.id !== entryId);

        if (this.bounties.watchlist.length !== initialLength) {
            await this.tidyBounties({ persist: true });
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

        await this.tidyBounties({ persist: true });
        this.emit('bounties-changed', this.getBountyState());
        return true;
    }

    /**
     * Attach a resolved target ID to an existing bounty entry
     */
    async attachTargetToBounty(entryId, targetId, targetName = null) {
        const idx = this.bounties.watchlist.findIndex(item => item.id === entryId);
        if (idx === -1) return false;

        this.bounties.watchlist[idx] = {
            ...this.bounties.watchlist[idx],
            targetId: InputParser.isValidUserId(targetId) ? parseInt(targetId, 10) : null,
            targetName: targetName || this.bounties.watchlist[idx].targetName
        };

        await this.tidyBounties({ persist: true });
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

    /**
     * Fetch and save full API data for a bounty target.
     * This is called once when a bounty is added and the data persists until deletion.
     */
    async fetchBountyTargetDataAsync(targetId, entryId) {
        if (!this.api?.hasApiKey() || !InputParser.isValidUserId(targetId)) return;

        const entryIdx = this.bounties.watchlist.findIndex(e => e.id === entryId);
        if (entryIdx === -1) return;

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 8000);
            const userData = await this.api.fetchUser(targetId, { signal: controller.signal });
            clearTimeout(timeout);

            if (!userData || userData.error) {
                this.log('warn', 'fetchBountyTargetDataAsync: API returned error', { targetId, error: userData?.error });
                return;
            }

            // Update the bounty entry with all fetched data
            this.bounties.watchlist[entryIdx] = {
                ...this.bounties.watchlist[entryIdx],
                targetName: userData.name || this.bounties.watchlist[entryIdx].targetName,
                level: userData.level ?? null,
                faction: userData.faction || null,
                factionId: userData.factionId ?? null,
                gender: userData.gender || null,
                age: userData.age ?? null,
                lastActionStatus: userData.lastActionStatus || null,
                lastActionRelative: userData.lastActionRelative || null,
                lastActionTimestamp: userData.lastActionTimestamp ?? null,
                apiDataFetchedAt: Date.now()
            };

            await this.tidyBounties({ persist: true });
            this.emit('bounties-changed', this.getBountyState());
            this.log('info', 'Fetched API data for bounty target', { targetId, name: userData.name });
        } catch (err) {
            if (err?.name !== 'AbortError') {
                this.log('warn', 'fetchBountyTargetDataAsync failed', { targetId, entryId, error: err.message });
            }
        }
    }

    /**
     * @deprecated Use fetchBountyTargetDataAsync instead
     */
    async resolveBountyNameAsync(targetId, entryId) {
        return this.fetchBountyTargetDataAsync(targetId, entryId);
    }

    /**
     * Normalize, de-duplicate, and reorder bounties for cleaner UX
     * - Dedupes active entries per target (keeps highest reward / newest)
     * - Drops very stale expired entries (older than expiry window)
     * - Rehydrates names from target cache when possible
     * - Orders: active soonest expiry -> claimed (newest) -> expired (newest)
     */
    async tidyBounties({ persist = false } = {}) {
        const now = Date.now();
        const activeByTarget = new Map();
        const active = [];
        const claimed = [];
        const expired = [];
        const staleCutoff = this.bountyExpiryMs || (7 * 24 * 60 * 60 * 1000);

        const consider = (entry) => {
            const normalized = this.normalizeBountyEntry(entry);
            if (!normalized) return;

            // Refresh name from known targets when missing/generic
            if (normalized.targetId) {
                const t = this.targets?.get(normalized.targetId);
                if (t?.getDisplayName && (!normalized.targetName || /^User\\s+\\d+$/i.test(normalized.targetName))) {
                    normalized.targetName = t.getDisplayName();
                }
            }

            const isExpired = this.isBountyExpired(normalized, now);
            const isClaimed = !!normalized.claimedAt;

            if (isExpired && normalized.expiresAt && now - normalized.expiresAt > staleCutoff) {
                return; // drop stale expired records
            }

            if (!isExpired && !isClaimed && normalized.targetId) {
                const existing = activeByTarget.get(normalized.targetId);
                if (!existing ||
                    (normalized.reward || 0) > (existing.reward || 0) ||
                    (normalized.reward === existing.reward && normalized.addedAt > existing.addedAt)) {
                    activeByTarget.set(normalized.targetId, normalized);
                }
                return;
            }

            if (isExpired) {
                expired.push(normalized);
            } else if (isClaimed) {
                claimed.push(normalized);
            } else {
                active.push(normalized);
            }
        };

        this.bounties.watchlist.forEach(consider);
        active.push(...activeByTarget.values());

        active.sort((a, b) => {
            const aExp = a.expiresAt || Number.MAX_SAFE_INTEGER;
            const bExp = b.expiresAt || Number.MAX_SAFE_INTEGER;
            if (aExp !== bExp) return aExp - bExp;
            return (b.reward || 0) - (a.reward || 0);
        });

        claimed.sort((a, b) => (b.claimedAt || 0) - (a.claimedAt || 0));
        expired.sort((a, b) => (b.expiresAt || 0) - (a.expiresAt || 0));

        this.bounties.watchlist = [...active, ...claimed, ...expired];

        if (persist) {
            await this.saveBounties();
        }

        return this.bounties.watchlist;
    }

    // ========================================================================
    }

    const proto = AppStateBounties.prototype;
    Object.getOwnPropertyNames(proto)
        .filter(name => name !== 'constructor')
        .forEach(name => {
            AppState.prototype[name] = proto[name];
        });
})();
