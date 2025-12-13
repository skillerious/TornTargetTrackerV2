/**
 * Torn Target Tracker - State Refresh Module
 * Refresh routines, auto-refresh, and timer monitoring
 */

(function() {
    if (typeof AppState === "undefined") return;

    class AppStateRefresh extends AppState {
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
            this.lastRefresh = Date.now();
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
            this.lastRefresh = Date.now();
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

        this.lastRefresh = Date.now();
        this.emit('target-updated', info);

        // Notification logic with filtering
        // Skip notifications during initial scan to prevent spam on app launch
        // Watched targets (monitorOk) ALWAYS get notifications regardless of global setting
        const monitorEnabled = !!info.monitorOk;
        const globalNotificationsEnabled = this.settings.notifications;
        const notificationsSuppressed = this.suppressNotifications;

        // Allow notifications if: (global enabled OR target is watched) AND not during initial scan
        if ((globalNotificationsEnabled || monitorEnabled) && !notificationsSuppressed) {
            // Check if we should notify for this target
            const shouldNotify = monitorEnabled ? true : (!this.settings.notifyOnlyMonitored || info.monitorOk);
            let notificationShown = false;

            // Check for specific status transitions first
            const wasInHospital = existing?.isInHospital?.() || false;
            const isNowInHospital = info.isInHospital?.() || false;
            const wasInJail = existing?.isInJail?.() || false;
            const isNowInJail = info.isInJail?.() || false;
            const leftHospital = wasInHospital && !isNowInHospital;
            const leftJail = wasInJail && !isNowInJail;

            // Notify on hospital release (if setting enabled)
            if (leftHospital && shouldNotify && (this.settings.notifyOnHospitalRelease || monitorEnabled)) {
                window.electronAPI.showNotification(
                    'Target Left Hospital',
                    `${info.getDisplayName()} is out of hospital`,
                    monitorEnabled // force notification for watched targets
                );
                notificationShown = true;
            }

            // Notify on jail release (if setting enabled)
            if (leftJail && shouldNotify && (this.settings.notifyOnJailRelease || monitorEnabled)) {
                window.electronAPI.showNotification(
                    'Target Left Jail',
                    `${info.getDisplayName()} is out of jail`,
                    monitorEnabled // force notification for watched targets
                );
                notificationShown = true;
            }

            // "Target Available!" notification - ONLY if:
            // 1. Target became attackable (wasn't before, is now)
            // 2. No specific notification (hospital/jail release) was already shown
            // 3. Either notifyOnStatusChange is enabled, OR no specific release settings are enabled
            //    (this ensures users who haven't enabled any settings still get SOME notification)
            if (!wasAttackable && isNowAttackable && shouldNotify && !notificationShown) {
                // Only show if status change notifications are enabled, OR if no specific settings cover this transition
                const hasSpecificSetting = (leftHospital && this.settings.notifyOnHospitalRelease) ||
                                           (leftJail && this.settings.notifyOnJailRelease);
                const shouldShowAvailable = monitorEnabled || this.settings.notifyOnStatusChange || !hasSpecificSetting;

                if (shouldShowAvailable) {
                    window.electronAPI.showNotification(
                        'Target Available!',
                        `${info.getDisplayName()} is now attackable`,
                        monitorEnabled // force notification for watched targets
                    );
                    notificationShown = true;
                }
            }

            // Notify on general status change (if not already notified by specific events above)
            if (existing && (this.settings.notifyOnStatusChange || monitorEnabled) && shouldNotify && !notificationShown) {
                const oldStatus = existing.statusState || existing.status?.state || existing.status?.description || 'Unknown';
                const newStatus = info.statusState || info.status?.state || info.status?.description || 'Unknown';
                const newIsAttackable = isNowAttackable;
                // Do not surface "now OK" status changes unless the per-target status alert is enabled
                if (newIsAttackable && !monitorEnabled) {
                    // skip
                } else if (oldStatus !== newStatus && oldStatus !== 'Unknown' && oldStatus.toLowerCase() !== 'unknown') {
                    window.electronAPI.showNotification(
                        'Target Status Changed',
                        `${info.getDisplayName()}: ${oldStatus} → ${newStatus}`,
                        monitorEnabled // force notification for watched targets
                    );
                    notificationShown = true;
                }
            }

            // Play notification sound if any notification was shown
            if (notificationShown && this.settings.soundEnabled) {
                this.emit('play-notification-sound');
            }

            // Emit event to track that this target was just notified (for deduplication)
            if (notificationShown && monitorEnabled) {
                this.emit('target-notified', { userId: info.userId, timestamp: Date.now() });
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

    /**
     * Start smart auto-refresh.
     * Instead of refreshing ALL targets at once, this:
     * 1. Checks every 30 seconds for stale targets
     * 2. Refreshes only targets older than `refreshInterval` seconds
     * 3. Prioritizes monitored targets and those with hospital/jail timers
     * 4. Limits refreshes per tick to stay within rate limits
     */
    startAutoRefresh() {
        this.stopAutoRefresh();

        if (!this.settings.autoRefresh || !this.settings.apiKey) return;

        // Check for stale targets every 30 seconds
        const CHECK_INTERVAL_MS = 30000;
        // Max targets to refresh per tick (to respect rate limits)
        const MAX_PER_TICK = 5;

        this.refreshTimer = setInterval(() => {
            if (this.isRefreshing || !this.api.hasApiKey()) return;

            const staleness = Math.max(30, this.settings.refreshInterval) * 1000;
            const now = Date.now();

            // Find stale targets
            const staleTargets = this.getTargets().filter(target => {
                const age = now - (target.lastUpdated || 0);
                return age > staleness;
            });

            if (staleTargets.length === 0) return;

            // Score and prioritize stale targets
            const scored = staleTargets.map(target => {
                let score = 0;
                const timeRemaining = target.getTimeRemaining?.() || 0;
                const isInHospitalOrJail = target.isInHospital?.() || target.isInJail?.();

                // Highest priority: monitored targets with expiring timers
                if (target.monitorOk && isInHospitalOrJail && timeRemaining > 0 && timeRemaining < 300) {
                    score = 100;
                } else if (target.monitorOk) {
                    score = 50;
                } else if (isInHospitalOrJail) {
                    score = 30;
                } else if (target.isFavorite) {
                    score = 20;
                } else {
                    score = 10;
                }

                return { target, score };
            });

            // Sort by priority and take top N
            scored.sort((a, b) => b.score - a.score);
            const toRefresh = scored.slice(0, MAX_PER_TICK).map(s => s.target.userId);

            if (toRefresh.length > 0) {
                this.log('info', `Auto-refresh: updating ${toRefresh.length} stale targets`);
                this.doRefresh(toRefresh);
            }
        }, CHECK_INTERVAL_MS);

        this.log('info', 'Smart auto-refresh started', {
            checkInterval: CHECK_INTERVAL_MS / 1000,
            stalenessThreshold: this.settings.refreshInterval,
            maxPerTick: MAX_PER_TICK
        });

        // Initial refresh handled by performInitialScan, skip here
    }

    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
            this.log('info', 'Auto-refresh stopped');
        }
    }

    // ========================================================================
    // SMART INITIAL SCAN & TIMER MONITORING
    // ========================================================================

    /**
     * Perform a smart initial scan on application launch.
     * Prioritizes targets by:
     * 1. Monitored targets with hospital/jail timers expiring soon (< 5 min)
     * 2. All monitored targets
     * 3. Targets in hospital/jail (time-sensitive)
     * 4. Stale data (not updated in last hour)
     * 5. All other targets
     */
    async performInitialScan() {
        if (!this.api.hasApiKey() || this.targets.size === 0) return;
        if (this.isRefreshing) {
            this.log('info', 'Initial scan skipped - refresh already in progress');
            return;
        }

        this.log('info', 'Starting smart initial scan...');

        const targets = this.getTargets();
        const now = Date.now();
        const FIVE_MINUTES = 5 * 60 * 1000;
        const ONE_HOUR = 60 * 60 * 1000;

        // Score and sort targets for optimal refresh order
        const scored = targets.map(target => {
            let score = 0;
            const timeRemaining = target.getTimeRemaining?.() || 0;
            const timeSinceUpdate = now - (target.lastUpdated || 0);
            const isInHospitalOrJail = target.isInHospital?.() || target.isInJail?.();

            // Highest priority: monitored targets with timers expiring soon
            if (target.monitorOk && isInHospitalOrJail && timeRemaining > 0 && timeRemaining < FIVE_MINUTES / 1000) {
                score = 100;
            }
            // High priority: all monitored targets
            else if (target.monitorOk) {
                score = 50;
            }
            // Medium priority: targets in hospital/jail (need timer data)
            else if (isInHospitalOrJail) {
                score = 30;
            }
            // Lower priority: stale data
            else if (timeSinceUpdate > ONE_HOUR) {
                score = 10;
            }
            // Base priority for all others
            else {
                score = 5;
            }

            // Bonus for favorites
            if (target.isFavorite) score += 5;

            return { id: target.userId, score, target };
        });

        // Sort by score descending
        scored.sort((a, b) => b.score - a.score);
        const prioritizedIds = scored.map(s => s.id);

        this.log('info', `Initial scan: ${prioritizedIds.length} targets prioritized`);

        // Suppress notifications during initial scan to prevent spam
        this.suppressNotifications = true;
        try {
            // Perform the refresh with prioritized order
            await this.doRefresh(prioritizedIds);
        } finally {
            this.suppressNotifications = false;
            this.log('info', 'Initial scan complete - notifications re-enabled');
        }
    }

    /**
     * Background timer monitoring for targets with hospital/jail timers.
     * Automatically refreshes targets when their timer is about to expire.
     */
    startTimerMonitoring() {
        if (this.timerMonitoringInterval) return;

        // Check every 5 seconds for targets needing refresh (faster for chaining)
        this.timerMonitoringInterval = setInterval(() => {
            this.checkTimerExpirations();
        }, 5000);

        this.log('info', 'Timer monitoring started');
    }

    stopTimerMonitoring() {
        if (this.timerMonitoringInterval) {
            clearInterval(this.timerMonitoringInterval);
            this.timerMonitoringInterval = null;
        }
        this.timerMonitoringTargets.clear();
    }

    /**
     * Check for targets with timers about to expire and refresh them.
     * Only refreshes monitored targets to avoid API waste.
     */
    async checkTimerExpirations() {
        if (!this.api.hasApiKey() || this.isRefreshing) return;

        const now = Date.now();
        const REFRESH_WINDOW = 30 * 1000; // Refresh when timer has < 30 seconds left
        const MIN_REFRESH_INTERVAL = 15 * 1000; // Don't refresh same target more than once per 15s
        const EXPIRED_GRACE_PERIOD = 60 * 1000; // Also refresh recently expired (within 60s) to catch transitions

        const targetsToRefresh = [];

        for (const target of this.targets.values()) {
            // Only auto-refresh monitored targets
            if (!target.monitorOk) continue;

            const isInHospitalOrJail = target.isInHospital?.() || target.isInJail?.();
            if (!isInHospitalOrJail) continue;

            const timeRemaining = target.getTimeRemaining?.() || 0;
            const timeRemainingMs = timeRemaining * 1000;

            // Refresh if:
            // 1. Timer is about to expire (0 < time <= 30s), OR
            // 2. Timer just expired (within grace period) - catches status transition
            const isAboutToExpire = timeRemaining > 0 && timeRemainingMs <= REFRESH_WINDOW;
            const justExpired = timeRemaining <= 0 && timeRemainingMs >= -EXPIRED_GRACE_PERIOD;

            if (!isAboutToExpire && !justExpired) continue;

            // Check if we recently refreshed this target
            const tracking = this.timerMonitoringTargets.get(target.userId);
            if (tracking && (now - tracking.lastRefresh) < MIN_REFRESH_INTERVAL) {
                continue;
            }

            targetsToRefresh.push(target.userId);
        }

        // Refresh targets one at a time to respect rate limits
        for (const userId of targetsToRefresh) {
            try {
                this.timerMonitoringTargets.set(userId, { lastRefresh: now });
                await this.refreshTarget(userId);
                this.log('info', `Timer monitoring: refreshed target ${userId} (timer expiring/expired)`);
            } catch (error) {
                this.log('warn', `Timer monitoring: failed to refresh ${userId}`, { error: error.message });
            }
        }
    }

    /**
     * Check if a target's data is stale and needs refresh.
     * @param {number} userId - Target ID
     * @param {number} maxAgeMs - Maximum age in milliseconds (default 30s)
     * @returns {boolean} - True if data is stale
     */
    isTargetStale(userId, maxAgeMs = 30000) {
        const target = this.targets.get(userId);
        if (!target) return true;
        if (!target.lastUpdated) return true;

        const age = Date.now() - target.lastUpdated;
        return age > maxAgeMs;
    }

    /**
     * Refresh a target only if its data is stale.
     * Used for click-based refresh to avoid wasting API calls.
     * @param {number} userId - Target ID
     * @param {number} maxAgeMs - Consider stale if older than this (default 30s)
     */
    async refreshTargetIfStale(userId, maxAgeMs = 30000) {
        const uid = parseInt(userId, 10);
        if (!Number.isFinite(uid)) return null;

        // For targets in hospital/jail/federal, be aggressive (5s staleness)
        // This is crucial for chaining - need fast status updates
        const target = this.targets.get(uid);
        if (target) {
            const isTimeSensitive = target.isInHospital?.() || target.isInJail?.() || target.isInFederal?.();
            if (isTimeSensitive) {
                maxAgeMs = Math.min(maxAgeMs, 5000); // 5 seconds for chaining scenarios
            }
        }

        if (!this.isTargetStale(uid, maxAgeMs)) {
            this.log('info', `Skipping refresh for ${uid} - data is fresh`);
            return target;
        }

        return this.refreshTarget(uid);
    }

    // ========================================================================
    }

    const proto = AppStateRefresh.prototype;
    Object.getOwnPropertyNames(proto)
        .filter(name => name !== 'constructor')
        .forEach(name => {
            AppState.prototype[name] = proto[name];
        });
})();
