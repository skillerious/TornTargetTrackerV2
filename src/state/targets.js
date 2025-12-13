/**
 * Torn Target Tracker - State Targets Module
 * Target management, grouping, filtering, and difficulty
 */

(function() {
    if (typeof AppState === "undefined") return;

    class AppStateTargets extends AppState {
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
     * Add a target using a name or ID-like string (best-effort)
     * Names without an ID are rejected to avoid adding the wrong player
     */
    async addTargetByName(nameOrId, options = {}) {
        const raw = (nameOrId || '').toString().trim();
        const extractedId = InputParser.extractUserId(raw);

        if (!extractedId) {
            throw new Error('Add a valid Torn ID or profile link to track this bounty');
        }

        const addOptions = { ...options };

        // Preserve the provided label as a custom name when it isn't just the ID
        if (raw && raw !== String(extractedId)) {
            addOptions.customName = addOptions.customName || raw;
            addOptions.name = addOptions.name || raw;
        }

        return this.addTarget(extractedId, addOptions);
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

        this.untrackTarget(uid);
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
                this.untrackTarget(uid);

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

        // Filter offline targets if setting is disabled
        if (this.settings.showOfflineTargets === false) {
            targets = targets.filter(t => {
                const status = (t.lastActionStatus || '').toLowerCase();
                return status !== 'offline';
            });
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
        const isManualIntel = existing?.source === 'manual';

        if (!force && existing?.fetchedAt && now - existing.fetchedAt < this.intelCacheMs) {
            return existing;
        }

        try {
            const intel = await window.tornStatsAPI.fetchSpy(uid, { force });
            const hasValidApiStats = intel?.status !== false && intel?.stats;

            // If API returns nothing but we have manual intel, preserve it
            if (!hasValidApiStats && isManualIntel) {
                // Update the lastChecked timestamp but keep manual stats
                const preservedIntel = {
                    ...existing,
                    lastApiCheck: now,
                    apiMessage: intel?.message || 'No API data found - using manual entry'
                };
                target.intel = preservedIntel;
                this.emit('target-updated', target);
                return preservedIntel;
            }

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
            // On error, always preserve existing intel (especially manual entries)
            const cachedIntel = existing ? {
                ...existing,
                stats: existing.stats ? { ...existing.stats } : null,
                compare: existing.compare ? { ...existing.compare } : null,
                attacks: existing.attacks ? { ...existing.attacks } : null,
                message: isManualIntel ? 'Manual entry (API check failed)' : (existing.message || 'Using cached intelligence'),
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

        // Persist sort settings if enabled
        if (this.settings.sortRememberLast !== false) {
            this.updateSettings({
                lastSortBy: this.sortBy,
                lastSortDirection: this.sortDirection
            });
        }
    }

    }

    const proto = AppStateTargets.prototype;
    Object.getOwnPropertyNames(proto)
        .filter(name => name !== 'constructor')
        .forEach(name => {
            AppState.prototype[name] = proto[name];
        });
})();
