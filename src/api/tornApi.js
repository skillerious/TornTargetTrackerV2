/**
 * Torn Target Tracker - Torn API Client
 * Main API client for Torn.com API requests
 */

// ============================================================================
// TORN API CLIENT
// ============================================================================

class TornAPI {
    /**
     * @param {string} apiKey - Torn API key
     * @param {RateLimiter} limiter - Rate limiter instance
     * @param {Object} options - Configuration options
     */
    constructor(apiKey, limiter, options = {}) {
        this.apiKey = (apiKey || '').trim();
        this.limiter = limiter;
        this.maxAttempts = options.maxAttempts || window.API_CONFIG.MAX_RETRY_ATTEMPTS;
        this.timeoutMs = options.timeoutMs || window.API_CONFIG.DEFAULT_TIMEOUT_MS;
        this.baseBackoffMs = options.baseBackoffMs || window.API_CONFIG.BASE_BACKOFF_MS;
        this.maxBackoffMs = options.maxBackoffMs || window.API_CONFIG.MAX_BACKOFF_MS;

        // Connection state
        this.isOnline = true;
        this.lastSuccessfulRequest = null;
        this.consecutiveFailures = 0;
        this.lastRequestDuration = 0;

        // Callbacks
        this.onConnectionChange = null;
        this.onRateLimitWarning = null;

        // Request deduplication - track in-flight requests
        this.pendingRequests = new Map();

        // Request cache with TTL
        this.requestCache = new Map();
        this.cacheTTL = 2000; // 2 seconds cache to prevent rapid duplicate requests

        // Server time tracking (used to correct hospital/jail timers when local clock drifts)
        this.serverTimeOffsetMs = 0;
        this.serverTimeSamples = [];
        this.lastServerTimeSample = null;
    }

    /**
     * Update API key
     */
    setApiKey(newKey) {
        this.apiKey = (newKey || '').trim();
    }

    /**
     * Check if API key is configured
     */
    hasApiKey() {
        return this.apiKey.length > 0;
    }

    /**
     * Validate API key by making a test request
     * @param {string} key - Key to validate (optional, uses stored key)
     * @param {AbortSignal} signal
     * @returns {Promise<{valid: boolean, error?: string, user?: Object}>}
     */
    async validateApiKey(key = null, signal = null) {
        const testKey = key || this.apiKey;

        if (!testKey || !testKey.trim()) {
            return { valid: false, error: 'API key is empty' };
        }

        const url = `${window.API_CONFIG.BASE_URL}/user/?selections=basic&key=${testKey.trim()}`;

        try {
            const response = await this.makeRequest(url, signal);
            const tornError = this.extractTornError(response);

            if (tornError) {
                return { valid: false, error: tornError.userMessage };
            }

            return {
                valid: true,
                user: {
                    id: response.player_id,
                    name: response.name,
                    level: response.level
                }
            };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }

    /**
     * Fetch user information with retry logic and deduplication
     * @param {number} userId
     * @param {AbortSignal} signal
     * @returns {Promise<TargetInfo>}
     */
    async fetchUser(userId, signal = null) {
        const uid = parseInt(userId, 10);

        // Input validation
        if (isNaN(uid) || uid <= 0) {
            return this.createErrorInfo(uid || 0, 'Invalid user ID');
        }

        if (!this.hasApiKey()) {
            return this.createErrorInfo(uid, 'API key not configured');
        }

        // Check cache first
        const cached = this.getFromCache(uid);
        if (cached) {
            this.log('debug', `Using cached data for user ${uid}`);
            return cached;
        }

        // Check if request is already in flight (deduplication)
        if (this.pendingRequests.has(uid)) {
            this.log('debug', `Waiting for existing request for user ${uid}`);
            try {
                return await this.pendingRequests.get(uid);
            } catch (error) {
                // If the pending request failed, continue to make a new one
                this.log('warn', `Pending request failed for user ${uid}, retrying`);
            }
        }

        // Create new request promise
        const requestPromise = this.doFetchUser(uid, signal);
        this.pendingRequests.set(uid, requestPromise);

        try {
            const result = await requestPromise;
            // Cache successful results
            if (!result.error) {
                this.addToCache(uid, result);
            }
            return result;
        } finally {
            // Clean up pending request
            this.pendingRequests.delete(uid);
        }
    }

    /**
     * Internal fetch user implementation
     * @private
     */
    async doFetchUser(userId, signal = null) {
        const uid = userId;

        const url = `${window.API_CONFIG.BASE_URL}/user/${uid}?selections=${window.API_CONFIG.SELECTIONS.USER_BASIC}&key=${this.apiKey}`;

        for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
            // Check cancellation
            if (signal?.aborted) {
                this.limiter.recordFailure();
                return this.createErrorInfo(uid, 'Request cancelled');
            }

            // Acquire rate limit token
            const acquired = await this.limiter.acquire(signal);
            if (!acquired) {
                this.limiter.recordFailure();
                return this.createErrorInfo(uid, 'Request cancelled');
            }

            try {
                const response = await this.makeRequest(url, signal);

                // Check for Torn API error
                const tornError = this.extractTornError(response);
                if (tornError) {
                    this.limiter.recordFailure();

                    if (tornError.retryable && attempt < this.maxAttempts) {
                        const delay = this.calculateBackoff(attempt);
                        this.limiter.penalize(delay / 1000);
                        this.log('warn', `Torn error ${tornError.code}, retrying in ${delay}ms`);

                        const waited = await this.sleep(delay, signal);
                        if (!waited) return this.createErrorInfo(uid, 'Request cancelled');
                        continue;
                    }
                    return this.createErrorInfo(uid, tornError.userMessage);
                }

                // Success
                this.limiter.recordSuccess();
                this.consecutiveFailures = 0;
                this.lastSuccessfulRequest = Date.now();
                this.updateConnectionState(true);

                const serverTimeMs = this.extractServerTimeMs(response);
                this.updateServerTimeOffset(serverTimeMs);

                return this.parseUserResponse(uid, response, serverTimeMs);

            } catch (error) {
                this.consecutiveFailures++;
                this.limiter.recordFailure();

                if (error.name === 'AbortError') {
                    return this.createErrorInfo(uid, 'Request cancelled');
                }

                // Handle specific error types
                if (error instanceof window.RateLimitError) {
                    const delay = error.retryAfter
                        ? error.retryAfter * 1000
                        : this.calculateBackoff(attempt);
                    const cooldownMs = Math.max(delay, this.limiter.windowMs + this.limiter.cooldownMs);
                    this.limiter.startCooldown('server-429', cooldownMs);
                    this.limiter.penalize(cooldownMs / 1000);

                    if (this.onRateLimitWarning) {
                        this.onRateLimitWarning(delay);
                    }

                    this.log('warn', `Rate limit hit for user ${uid}, attempt ${attempt}/${this.maxAttempts}`);
                    const waited = await this.sleep(delay, signal);
                    if (!waited) return this.createErrorInfo(uid, 'Request cancelled');
                    continue;
                }

                if (error instanceof window.NetworkError || error instanceof window.TimeoutError) {
                    this.updateConnectionState(false);

                    if (attempt < this.maxAttempts) {
                        const delay = this.calculateBackoff(attempt);
                        this.log('warn', `Network error for user ${uid}, attempt ${attempt}/${this.maxAttempts}, retrying in ${delay}ms: ${error.message}`);

                        const waited = await this.sleep(delay, signal);
                        if (!waited) return this.createErrorInfo(uid, 'Request cancelled');
                        continue;
                    }
                    this.log('error', `Network error for user ${uid} after ${this.maxAttempts} attempts`);
                    return this.createErrorInfo(uid, 'Network error - please check your connection');
                }

                // HTTP errors
                if (error.status) {
                    if (error.status === 401 || error.status === 403) {
                        this.log('error', `Auth error for user ${uid}: ${error.status}`);
                        return this.createErrorInfo(uid, 'Unauthorized - please check your API key');
                    }
                    if (error.status === 404) {
                        this.log('warn', `User ${uid} not found (404)`);
                        return this.createErrorInfo(uid, 'User not found');
                    }
                    if (error.status === 429 || (error.status >= 500 && error.status < 600)) {
                        const delay = this.calculateBackoff(attempt);
                        this.limiter.penalize(delay / 1000);
                        this.log('warn', `Server error ${error.status} for user ${uid}, attempt ${attempt}/${this.maxAttempts}`);

                        if (attempt < this.maxAttempts) {
                            const waited = await this.sleep(delay, signal);
                            if (!waited) return this.createErrorInfo(uid, 'Request cancelled');
                            continue;
                        }
                    }
                    this.log('error', `HTTP error ${error.status} for user ${uid}`);
                    return this.createErrorInfo(uid, `Server error (${error.status})`);
                }

                // Unexpected error
                this.log('error', `Unexpected error fetching user ${uid} (attempt ${attempt}/${this.maxAttempts}): ${error.message}`, { stack: error.stack });

                if (attempt < this.maxAttempts) {
                    const delay = this.calculateBackoff(attempt);
                    const waited = await this.sleep(delay, signal);
                    if (!waited) return this.createErrorInfo(uid, 'Request cancelled');
                    continue;
                }

                return this.createErrorInfo(uid, 'An unexpected error occurred');
            }
        }

        // Exhausted retries
        this.limiter.recordFailure();
        return this.createErrorInfo(uid, 'Request failed after multiple retries');
    }

    /**
     * Add response to cache
     * @private
     */
    addToCache(userId, data) {
        this.requestCache.set(userId, {
            data,
            timestamp: Date.now()
        });

        // Clean old cache entries
        this.cleanCache();
    }

    /**
     * Get response from cache
     * @private
     */
    getFromCache(userId) {
        const cached = this.requestCache.get(userId);
        if (!cached) return null;

        const age = Date.now() - cached.timestamp;
        if (age > this.cacheTTL) {
            this.requestCache.delete(userId);
            return null;
        }

        return cached.data;
    }

    /**
     * Clean expired cache entries
     * @private
     */
    cleanCache() {
        const now = Date.now();
        for (const [userId, entry] of this.requestCache.entries()) {
            if (now - entry.timestamp > this.cacheTTL) {
                this.requestCache.delete(userId);
            }
        }

        // Also limit cache size
        if (this.requestCache.size > 500) {
            const entries = Array.from(this.requestCache.entries());
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
            const toRemove = entries.slice(0, entries.length - 500);
            toRemove.forEach(([userId]) => this.requestCache.delete(userId));
        }
    }

    /**
     * Clear the request cache
     */
    clearCache() {
        this.requestCache.clear();
        this.pendingRequests.clear();
    }

    /**
     * Fetch multiple users with controlled concurrency
     * Respects rate limiter and avoids unnecessary long pauses
     *
     * @param {number[]} userIds
     * @param {AbortSignal} signal
     * @param {number} concurrency - Parallel requests (defaults to 3)
     * @param {Function} onProgress
     * @returns {Promise<Map<number, TargetInfo>>}
     */
    async fetchUsers(userIds, signal = null, concurrency = null, onProgress = null) {
        // Normalize and de-duplicate IDs while preserving order
        const ids = [];
        const seen = new Set();
        for (const rawId of userIds || []) {
            const uid = parseInt(rawId, 10);
            if (!uid || uid <= 0 || seen.has(uid)) continue;
            seen.add(uid);
            ids.push(uid);
        }

        const results = new Map();
        const total = ids.length;
        if (total === 0) return results;

        const workerCount = Math.max(1, Math.min(concurrency || 3, 8));
        let completed = 0;
        let index = 0;
        let cancelled = false;

        const reportProgress = (target) => {
            if (!onProgress || cancelled) return;
            const percent = total ? Math.min(100, Math.round((completed / total) * 100)) : 0;
            onProgress({
                current: completed,
                total,
                target,
                percent,
                paused: false
            });
        };

        const worker = async () => {
            while (true) {
                if (signal?.aborted) {
                    cancelled = true;
                    return;
                }

                const nextIndex = index++;
                if (nextIndex >= ids.length) return;

                const userId = ids[nextIndex];
                let targetInfo;

                try {
                    targetInfo = await this.fetchUser(userId, signal);
                } catch (error) {
                    this.log('error', `Unexpected error fetching ${userId}: ${error.message}`);
                    targetInfo = this.createErrorInfo(userId, 'Unexpected error fetching user');
                }

                // Drop progress events if cancelled during the request
                if (signal?.aborted) {
                    cancelled = true;
                    return;
                }

                const safeTarget = targetInfo || this.createErrorInfo(userId, 'No data returned');
                results.set(userId, safeTarget);
                completed++;
                reportProgress(safeTarget);
            }
        };

        const workers = Array.from({ length: workerCount }, () => worker());
        await Promise.all(workers);

        if (cancelled) {
            this.log('info', `Fetch cancelled after ${completed}/${total} targets`);
        } else {
            const status = this.limiter?.getStatus ? this.limiter.getStatus() : null;
            const tokens = status ? ` (tokens remaining: ${status.availableTokens}/${status.maxTokens})` : '';
            this.log('info', `Fetch complete. Retrieved ${completed}/${total} targets using ${workerCount} workers${tokens}`);
        }

        return results;
    }

    // ========================================================================
    // PERSONAL STATS
    // ========================================================================

    /**
     * Fetch personalstats for the API key owner (used for bounty tracking)
     * @param {AbortSignal|null} signal
     * @returns {Promise<{personalstats?: Object, playerId?: number, name?: string, raw?: Object, error?: string, code?: number}>}
     */
    async fetchPersonalStats(signal = null) {
        if (!this.hasApiKey()) {
            return { error: 'API key not configured' };
        }

        const url = `${window.API_CONFIG.BASE_URL}/user/?selections=${window.API_CONFIG.SELECTIONS.USER_FULL}&key=${this.apiKey}`;

        for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
            if (signal?.aborted) {
                this.limiter.recordFailure();
                return { error: 'Request cancelled' };
            }

            const acquired = await this.limiter.acquire(signal);
            if (!acquired) {
                this.limiter.recordFailure();
                return { error: 'Request cancelled' };
            }

            try {
                const response = await this.makeRequest(url, signal);
                const tornError = this.extractTornError(response);

                if (tornError) {
                    this.limiter.recordFailure();

                    if (tornError.retryable && attempt < this.maxAttempts) {
                        const delay = this.calculateBackoff(attempt);
                        this.limiter.penalize(delay / 1000);
                        const waited = await this.sleep(delay, signal);
                        if (!waited) return { error: 'Request cancelled' };
                        continue;
                    }
                    return { error: tornError.userMessage, code: tornError.code };
                }

                this.limiter.recordSuccess();
                this.consecutiveFailures = 0;
                this.lastSuccessfulRequest = Date.now();
                this.updateConnectionState(true);

                return {
                    personalstats: response.personalstats || response.personalStats || {},
                    playerId: this.safeInt(response.player_id || response.playerId),
                    name: this.safeString(response.name),
                    raw: response
                };
            } catch (error) {
                this.consecutiveFailures++;
                this.limiter.recordFailure();

                if (error.name === 'AbortError') {
                    return { error: 'Request cancelled' };
                }

                if (error instanceof window.RateLimitError) {
                    const delay = error.retryAfter
                        ? error.retryAfter * 1000
                        : this.calculateBackoff(attempt);
                    this.limiter.startCooldown('server-429', delay);
                    this.limiter.penalize(delay / 1000);
                    if (this.onRateLimitWarning) {
                        this.onRateLimitWarning(delay);
                    }
                    const waited = await this.sleep(delay, signal);
                    if (!waited) return { error: 'Request cancelled' };
                    continue;
                }

                if (error instanceof window.NetworkError || error instanceof window.TimeoutError) {
                    this.updateConnectionState(false);
                    if (attempt < this.maxAttempts) {
                        const delay = this.calculateBackoff(attempt);
                        const waited = await this.sleep(delay, signal);
                        if (!waited) return { error: 'Request cancelled' };
                        continue;
                    }
                    return { error: error.message };
                }

                this.log('error', `Unexpected error fetching personal stats: ${error.message}`, { stack: error.stack });
                if (attempt >= this.maxAttempts) {
                    return { error: 'Failed to fetch personal stats' };
                }
                const delay = this.calculateBackoff(attempt);
                const waited = await this.sleep(delay, signal);
                if (!waited) return { error: 'Request cancelled' };
            }
        }

        return { error: 'Failed to fetch personal stats' };
    }

    // ========================================================================
    // PRIVATE METHODS
    // ========================================================================

    /**
     * Make HTTP request with timeout
     * @private
     */
    async makeRequest(url, signal = null) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

        // Combine signals
        const combinedSignal = signal
            ? this.combineAbortSignals(signal, controller.signal)
            : controller.signal;

        // Track request timing
        const startTime = Date.now();

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': window.API_CONFIG.USER_AGENT
                },
                signal: combinedSignal
            });

            clearTimeout(timeoutId);

            // Calculate latency
            this.lastRequestDuration = Date.now() - startTime;

            // Handle rate limiting
            if (response.status === 429) {
                const retryAfter = this.parseRetryAfter(response.headers);
                throw new window.RateLimitError(retryAfter);
            }

            // Handle other HTTP errors
            if (!response.ok) {
                const error = new Error(`HTTP ${response.status}`);
                error.status = response.status;
                throw error;
            }

            const serverDateHeader = response.headers.get('Date');
            const serverDateMs = serverDateHeader ? new Date(serverDateHeader).getTime() : null;
            const payload = await response.json();

            // Preserve server clock info on the payload so downstream logic can correct timers
            if (serverDateMs && Number.isFinite(serverDateMs)) {
                payload._responseServerDate = serverDateMs;
            }

            return payload;

        } catch (error) {
            clearTimeout(timeoutId);

            if (error.name === 'AbortError') {
                throw new window.TimeoutError();
            }

            if (error instanceof window.RateLimitError) {
                throw error;
            }

            if (error.name === 'TypeError' &&
                (error.message.includes('fetch') || error.message.includes('network'))) {
                throw new window.NetworkError(error.message, error);
            }

            throw error;
        }
    }

    /**
     * Combine multiple abort signals
     * @private
     */
    combineAbortSignals(...signals) {
        const controller = new AbortController();

        for (const signal of signals) {
            if (signal) {
                if (signal.aborted) {
                    controller.abort();
                    break;
                }
                signal.addEventListener('abort', () => controller.abort(), { once: true });
            }
        }

        return controller.signal;
    }

    /**
     * Extract Torn API error from response
     * @private
     */
    extractTornError(data) {
        if (!data || typeof data !== 'object') return null;

        const err = data.error;
        if (!err || typeof err !== 'object') return null;

        const code = err.code ?? 0;
        const message = err.error || 'Unknown error';
        const errorInfo = window.TORN_ERROR_CODES[code] || window.TORN_ERROR_CODES[0];

        return new window.TornAPIError(code, message, errorInfo.userMessage, errorInfo.retryable);
    }

    /**
     * Parse Retry-After header
     * @private
     */
    parseRetryAfter(headers) {
        const value = headers.get('Retry-After');
        if (!value) return null;

        const seconds = parseFloat(value);
        return isNaN(seconds) ? null : seconds;
    }

    /**
     * Calculate backoff delay with jitter
     * @private
     */
    calculateBackoff(attempt) {
        const baseDelay = this.baseBackoffMs * Math.pow(2, attempt - 1);
        const cappedDelay = Math.min(baseDelay, this.maxBackoffMs);
        const jitter = cappedDelay * (0.5 + Math.random() * 0.5);
        return Math.floor(jitter);
    }

    /**
     * Sleep with abort support
     * @private
     */
    sleep(ms, signal = null) {
        return new Promise(resolve => {
            if (signal?.aborted) {
                resolve(false);
                return;
            }

            const timeout = setTimeout(() => {
                if (signal) signal.removeEventListener('abort', onAbort);
                resolve(true);
            }, ms);

            const onAbort = () => {
                clearTimeout(timeout);
                resolve(false);
            };

            if (signal) {
                signal.addEventListener('abort', onAbort, { once: true });
            }
        });
    }

    /**
     * Extract server timestamp (ms) from Torn payload or HTTP headers
     * @private
     */
    extractServerTimeMs(data) {
        if (!data || typeof data !== 'object') return null;

        const rawTimestamp = this.safeInt(
            data.timestamp ?? data._timestamp ?? data.server_time ?? data.serverTime
        );
        let fromPayload = null;

        if (Number.isFinite(rawTimestamp)) {
            // Torn timestamp is normally in seconds; guard against ms values
            fromPayload = rawTimestamp > 1e12 ? rawTimestamp : rawTimestamp * 1000;
        }

        const fromHeader = typeof data._responseServerDate === 'number'
            ? data._responseServerDate
            : null;

        return fromPayload || fromHeader || null;
    }

    /**
     * Track server/client clock skew to improve timer accuracy
     * @private
     */
    updateServerTimeOffset(serverTimeMs) {
        if (!Number.isFinite(serverTimeMs)) return;

        const localMs = Date.now();
        const offset = serverTimeMs - localMs;
        const MAX_REASONABLE_DRIFT = 12 * 60 * 60 * 1000; // 12 hours

        // Ignore clearly invalid offsets (likely parsing issues)
        if (Math.abs(offset) > MAX_REASONABLE_DRIFT) {
            this.log('warn', 'Ignoring server time offset outside expected range', { offset });
            return;
        }

        this.serverTimeSamples.push(offset);
        if (this.serverTimeSamples.length > 5) {
            this.serverTimeSamples.shift();
        }

        const sum = this.serverTimeSamples.reduce((acc, val) => acc + val, 0);
        this.serverTimeOffsetMs = sum / this.serverTimeSamples.length;
        this.lastServerTimeSample = localMs;
    }

    /**
     * Normalize status.until to a sane seconds-based timestamp
     * @private
     */
    normalizeStatusUntil(rawUntil) {
        if (rawUntil === null || rawUntil === undefined) return null;
        let until = Number(rawUntil);
        if (!Number.isFinite(until) || until <= 0) return null;

        // Convert millisecond values (13 digits) down to seconds
        if (until > 1e12) {
            until = Math.floor(until / 1000);
        } else if (until > 1e10) {
            // Guard for 11-12 digit values (still likely ms)
            until = Math.floor(until / 1000);
        }

        return until;
    }

    /**
     * Determine if a status supports a countdown timer
     * @private
     */
    isCountdownState(state) {
        const normalized = (state || '').toLowerCase();
        return normalized === 'hospital' ||
               normalized === 'jail' ||
               normalized === 'jailed' ||
               normalized === 'federal' ||
               normalized === 'traveling' ||
               normalized === 'abroad';
    }

    /**
     * Parse a human-readable duration from a status description (fallback when until is missing)
     * @private
     */
    parseDurationFromDescription(desc) {
        if (!desc || typeof desc !== 'string') return null;
        const lower = desc.toLowerCase();

        // Patterns like 01:23:45 or 12:34
        const clockMatch = lower.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
        if (clockMatch) {
            const hours = parseInt(clockMatch[1], 10) || 0;
            const minutes = parseInt(clockMatch[2], 10) || 0;
            const seconds = parseInt(clockMatch[3], 10) || 0;
            return (hours * 3600) + (minutes * 60) + seconds;
        }

        // Textual patterns: "2h 15m", "1 hour 30 minutes", "45 mins"
        const regex = /(\d+)\s*(days?|d|hours?|hrs?|hr|h|minutes?|mins?|m|seconds?|secs?|s)/gi;
        let totalSeconds = 0;
        let matched = false;
        let match;

        while ((match = regex.exec(lower)) !== null) {
            const value = parseInt(match[1], 10);
            if (Number.isNaN(value)) continue;
            matched = true;

            const unit = match[2];
            if (/^d/.test(unit)) {
                totalSeconds += value * 86400;
            } else if (/^h/.test(unit)) {
                totalSeconds += value * 3600;
            } else if (/^m/.test(unit)) {
                totalSeconds += value * 60;
            } else if (/^s/.test(unit)) {
                totalSeconds += value;
            }
        }

        return matched ? totalSeconds : null;
    }

    /**
     * Parse user API response into TargetInfo
     * @private
     */
    parseUserResponse(userId, data, serverTimeMs = null) {
        try {
            if (!data || typeof data !== 'object') {
                return this.createErrorInfo(userId, 'Invalid API response');
            }

            // Extract basic info with validation
            const name = this.safeString(data.name);
            const level = this.safeInt(data.level, 1, 10000);
            const gender = this.safeString(data.gender);
            const age = this.safeInt(data.age);

            // Extract status
            const status = data.status || {};
            const statusState = this.safeString(status.state) || 'Unknown';
            const statusDesc = this.safeString(status.description);
            const statusReason = this.extractStatusReason(status);
            const statusUntilRaw = status.until;
            const normalizedUntil = this.normalizeStatusUntil(statusUntilRaw);
            let statusUntil = normalizedUntil;

            // Fallback: if Torn does not include an "until" value, try to parse it from the description text
            if (!statusUntil && this.isCountdownState(statusState)) {
                const derivedSeconds = this.parseDurationFromDescription(statusDesc);
                if (derivedSeconds) {
                    const baseSeconds = Math.floor((serverTimeMs || Date.now()) / 1000);
                    statusUntil = baseSeconds + derivedSeconds;
                }
            }

            // Extract last action
            const lastAction = data.last_action || {};
            const lastActionStatus = this.safeString(lastAction.status);
            const lastActionRelative = this.safeString(lastAction.relative);
            const lastActionTimestamp = this.safeInt(lastAction.timestamp);

            // Avatar / profile image
            const avatarUrl = this.extractAvatarUrl(data);

            // Extract faction
            let faction = '';
            let factionId = null;
            let factionPosition = '';

            const fac = data.faction;
            if (fac && typeof fac === 'object') {
                const facName = this.safeString(fac.faction_name || fac.name);
                factionId = this.safeInt(fac.faction_id || fac.ID || fac.id);
                factionPosition = this.safeString(fac.position);

                if (facName) {
                    faction = factionId ? `${facName} [${factionId}]` : facName;
                }
            }

            // Determine attackable status
            const state = statusState.toLowerCase();
            const ok = state === 'okay' || state === 'ok';

            return new window.TargetInfo({
                userId,
                name,
                level,
                gender,
                age,
                statusState,
                statusDesc,
                statusReason,
                statusUntil,
                lastActionStatus,
                lastActionRelative,
                lastActionTimestamp,
                faction,
                factionId,
                factionPosition,
                ok,
                error: null,
                lastUpdated: Date.now(),
                avatarUrl
            });

        } catch (error) {
            this.log('error', `Failed to parse response for user ${userId}: ${error.message}`);
            return this.createErrorInfo(userId, 'Failed to parse response');
        }
    }

    /**
     * Create TargetInfo with error
     * @private
     */
    createErrorInfo(userId, errorMessage) {
        const info = new window.TargetInfo({ userId });
        info.error = errorMessage;
        info.lastUpdated = Date.now();
        return info;
    }

    /**
     * Extract avatar URL from API response
     * @private
     */
    extractAvatarUrl(data) {
        if (!data || typeof data !== 'object') return '';

        const candidates = [
            data.profile_image,
            data.profileImage,
            data.avatar,
            data.avatar_url,
            data.avatarUrl,
            data.profile?.image,
            data.profile?.profile_image,
            data.profile?.avatar
        ];

        for (const value of candidates) {
            const url = this.safeString(value);
            if (url && /^https?:\/\//i.test(url)) {
                return url;
            }
        }

        return '';
    }

    /**
     * Extract a human-friendly status reason from Torn status details/description
     */
    extractStatusReason(status) {
        if (!status || typeof status !== 'object') return '';

        const pick = (...vals) => {
            for (const v of vals) {
                if (typeof v === 'string' && v.trim()) return v.trim();
            }
            return '';
        };

        // Details can be string or object
        let reason = '';
        const details = status.details;
        if (typeof details === 'string') {
            reason = details.trim();
        } else if (details && typeof details === 'object') {
            reason = pick(
                details.reason,
                details.hospital_reason,
                details.hospitalized_reason,
                details.hospitalised_reason,
                details.jail_reason,
                details.jailed_reason,
                details.description
            );
        }

        // Fallback to description if it's not just the timer line
        const desc = this.safeString(status.description);
        const looksLikeTimer = /^in (hospital|jail|federal)/i.test(desc || '');
        if (!reason && desc && !looksLikeTimer) {
            reason = desc.trim();
        }

        return reason;
    }

    /**
     * Safe string extraction
     * @private
     */
    safeString(value) {
        if (value === null || value === undefined) return '';
        return String(value);
    }

    /**
     * Safe integer extraction
     * @private
     */
    safeInt(value, min = null, max = null) {
        if (value === null || value === undefined) return null;
        const num = parseInt(value, 10);
        if (isNaN(num)) return null;
        if (min !== null && num < min) return null;
        if (max !== null && num > max) return null;
        return num;
    }

    /**
     * Update connection state
     * @private
     */
    updateConnectionState(isOnline) {
        if (this.isOnline !== isOnline) {
            this.isOnline = isOnline;
            if (this.onConnectionChange) {
                this.onConnectionChange(isOnline);
            }
        }
    }

    /**
     * Log helper
     * @private
     */
    log(level, message, data = null) {
        // Always log to console for visibility
        const logData = data ? ` | ${JSON.stringify(data)}` : '';
        const fullMessage = `[API] ${message}${logData}`;

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
            window.electronAPI.log(level, `[API] ${message}`, data);
        }
    }
}

// Export for browser/Electron renderer
if (typeof window !== 'undefined') {
    window.TornAPI = TornAPI;
}
