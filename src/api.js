/**
 * Torn Target Tracker - API Module (Enhanced v2.0)
 * Complete Torn API client with comprehensive features
 * 
 * Features:
 * - Rate limiting tuned to 99 requests then a 60s cooldown
 * - Exponential backoff with jitter
 * - Retry-After header support
 * - Request queuing and prioritization
 * - Comprehensive error handling
 * - Connection monitoring
 * - Request cancellation
 * - Detailed logging
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_CONFIG = {
    BASE_URL: 'https://api.torn.com',
    MAX_RETRY_ATTEMPTS: 5,
    DEFAULT_TIMEOUT_MS: 30000,
    BASE_BACKOFF_MS: 1000,
    MAX_BACKOFF_MS: 60000,
    RATE_LIMIT_PER_MINUTE: 80,
    RATE_LIMIT_WINDOW_MS: 60000,
    RATE_LIMIT_COOLDOWN_MS: 65000,
    MAX_RATE_LIMIT_PER_MINUTE: 99,
    USER_AGENT: 'TornTargetTracker/2.0',
    SELECTIONS: {
        USER_BASIC: 'basic,profile',
        USER_FULL: 'basic,profile,personalstats',
        FACTION_BASIC: 'basic'
    }
};

// ============================================================================
// TORN API ERROR CODES - Complete Reference
// ============================================================================

const TORN_ERROR_CODES = {
    0: { message: 'Unknown error', userMessage: 'An unknown error occurred', retryable: true },
    1: { message: 'Key is empty', userMessage: 'API key is missing', retryable: false },
    2: { message: 'Incorrect key', userMessage: 'API key is invalid or incorrect', retryable: false },
    3: { message: 'Wrong type', userMessage: 'Invalid API request type', retryable: false },
    4: { message: 'Wrong fields', userMessage: 'Invalid API fields requested', retryable: false },
    5: { message: 'Too many requests', userMessage: 'Rate limit exceeded - please wait', retryable: true },
    6: { message: 'Incorrect ID', userMessage: 'Invalid user ID', retryable: false },
    7: { message: 'Incorrect ID-entity relation', userMessage: 'Invalid ID for this request type', retryable: false },
    8: { message: 'IP block', userMessage: 'Your IP address has been temporarily blocked', retryable: false },
    9: { message: 'API disabled', userMessage: 'Torn API is temporarily disabled for maintenance', retryable: true },
    10: { message: 'Key owner is in federal jail', userMessage: 'API key owner is currently in federal jail', retryable: false },
    11: { message: 'Key change error', userMessage: 'Unable to read key information', retryable: true },
    12: { message: 'Key read error', userMessage: 'Key could not be read', retryable: true },
    13: { message: 'Key temporarily disabled', userMessage: 'API key is temporarily disabled due to owner inactivity', retryable: false },
    14: { message: 'Daily read limit reached', userMessage: 'Daily API read limit has been reached', retryable: false },
    15: { message: 'Temporary error', userMessage: 'Temporary server error - retrying automatically', retryable: true },
    16: { message: 'Access level too low', userMessage: 'API key does not have sufficient access level for this request', retryable: false },
    17: { message: 'Backend error', userMessage: 'Torn server error - retrying automatically', retryable: true },
    18: { message: 'API key paused', userMessage: 'API key has been paused by the owner', retryable: false }
};

// ============================================================================
// CUSTOM ERROR CLASSES
// ============================================================================

class TornAPIError extends Error {
    constructor(code, message, userMessage = null, retryable = false) {
        super(`Torn API Error ${code}: ${message}`);
        this.name = 'TornAPIError';
        this.code = code;
        this.apiMessage = message;
        this.userMessage = userMessage || message;
        this.retryable = retryable;
    }

    static fromCode(code, customMessage = null) {
        const errorInfo = TORN_ERROR_CODES[code] || TORN_ERROR_CODES[0];
        return new TornAPIError(
            code,
            customMessage || errorInfo.message,
            errorInfo.userMessage,
            errorInfo.retryable
        );
    }
}

class NetworkError extends Error {
    constructor(message, originalError = null) {
        super(message);
        this.name = 'NetworkError';
        this.originalError = originalError;
        this.retryable = true;
    }
}

class TimeoutError extends Error {
    constructor(message = 'Request timed out') {
        super(message);
        this.name = 'TimeoutError';
        this.retryable = true;
    }
}

class RateLimitError extends Error {
    constructor(retryAfter = null) {
        super('Rate limit exceeded');
        this.name = 'RateLimitError';
        this.retryAfter = retryAfter;
        this.retryable = true;
    }
}

// ============================================================================
// RATE LIMITER - Fixed window with enforced cooldown
// ============================================================================

class RateLimiter {
    /**
     * @param {number} maxTokens - Maximum tokens (requests) per window
     * @param {number} windowMs - Time window in milliseconds
     * @param {number} cooldownMs - Cooldown applied after the window is exhausted
     */
    constructor(
        maxTokens = API_CONFIG.RATE_LIMIT_PER_MINUTE,
        windowMs = API_CONFIG.RATE_LIMIT_WINDOW_MS,
        cooldownMs = API_CONFIG.RATE_LIMIT_COOLDOWN_MS
    ) {
        this.maxTokens = this.normalizeLimit(maxTokens);
        this.windowMs = windowMs;
        this.cooldownMs = cooldownMs;

        this.tokens = this.maxTokens;
        this.lastRequestTimestamp = 0;

        // Backoff / cooldown tracking
        this.penaltyUntil = 0;    // server or retry penalties
        this.cooldownUntil = 0;   // enforced cooldown after hitting the window cap
        this.lastCooldownReason = '';

        // Smooth out bursts so we reach the window safely
        this.MIN_REQUEST_DELAY = 800;

        // Statistics
        this.stats = {
            totalRequests: 0,
            throttledRequests: 0,
            failedRequests: 0,
            successfulRequests: 0,
            lastRequestTime: null
        };

        // Request tracking for better accuracy
        this.requestLog = [];
        this.maxLogSize = 200;

        // Change notification callback
        this.onStatusChange = null;

        // Auto-update timer for smoother UI updates
        this.refillTimer = null;
        this.startAutoRefill();
    }

    /**
     * Normalize a provided token limit against caps and sensible defaults
     */
    normalizeLimit(limit) {
        const cap = API_CONFIG.MAX_RATE_LIMIT_PER_MINUTE || 99;
        const parsed = Number.parseInt(limit, 10);
        const base = Number.isFinite(parsed) ? parsed : API_CONFIG.RATE_LIMIT_PER_MINUTE;
        return Math.max(1, Math.min(cap, base));
    }

    /**
     * Update limiter configuration (used when user changes rate limit)
     */
    setLimits(maxTokens, windowMs = this.windowMs, cooldownMs = this.cooldownMs) {
        this.maxTokens = this.normalizeLimit(maxTokens);
        this.windowMs = windowMs || this.windowMs;
        this.cooldownMs = cooldownMs || this.cooldownMs;

        // Recompute tokens based on the new window size
        this.cleanRequestLog();
        if (this.cooldownUntil && Date.now() >= this.cooldownUntil) {
            this.resetAfterCooldown();
        } else {
            this.tokens = Math.max(0, this.maxTokens - this.requestLog.length);
        }

        if (this.onStatusChange) {
            this.onStatusChange(this.getStatus());
        }
    }

    /**
     * Start automatic status updates for UI
     */
    startAutoRefill() {
        if (this.refillTimer) return;

        let lastAvailable = null;
        let lastPenalty = null;

        this.refillTimer = setInterval(() => {
            const status = this.getStatus();
            const { availableTokens, penaltyRemaining } = status;

            if (lastAvailable !== availableTokens || lastPenalty !== penaltyRemaining) {
                lastAvailable = availableTokens;
                lastPenalty = penaltyRemaining;
                if (this.onStatusChange) {
                    this.onStatusChange(status);
                }
            }
        }, 500);
    }

    /**
     * Stop automatic updates
     */
    stopAutoRefill() {
        if (this.refillTimer) {
            clearInterval(this.refillTimer);
            this.refillTimer = null;
        }
    }

    /**
     * Begin a forced cooldown after the window is exhausted
     * @param {string} reason
     */
    startCooldown(reason = 'rate-limit', durationMs = null) {
        const now = Date.now();
        const targetDuration = durationMs && durationMs > 0 ? durationMs : this.cooldownMs;
        this.cooldownUntil = Math.max(this.cooldownUntil, now + targetDuration);
        this.penaltyUntil = Math.max(this.penaltyUntil, this.cooldownUntil);
        this.tokens = 0;
        this.lastCooldownReason = reason;
        this.stats.throttledRequests++;
    }

    /**
     * Remaining wait time for any penalty/cooldown
     * @returns {number} milliseconds
     */
    getPenaltyWait() {
        const now = Date.now();
        return Math.max(0, Math.max(this.penaltyUntil, this.cooldownUntil) - now);
    }

    /**
     * Reset counters after cooldown expires
     */
    resetAfterCooldown() {
        this.cooldownUntil = 0;
        this.tokens = this.maxTokens;
        this.requestLog = [];
        this.lastRequestTimestamp = 0;
    }

    /**
     * Refresh derived counters (cleanup + token estimate)
     */
    refill() {
        const now = Date.now();

        // If cooldown expired, restore full window
        if (this.cooldownUntil && now >= this.cooldownUntil) {
            this.resetAfterCooldown();
        }

        this.cleanRequestLog();

        // Tokens reflect how many safe requests remain in the current window
        const recentCount = this.requestLog.length;
        this.tokens = Math.max(0, this.maxTokens - recentCount);
    }

    /**
     * Clean old entries from request log
     */
    cleanRequestLog() {
        const cutoff = Date.now() - this.windowMs;
        this.requestLog = this.requestLog.filter(timestamp => timestamp > cutoff);

        // Also trim if too large
        if (this.requestLog.length > this.maxLogSize) {
            this.requestLog = this.requestLog.slice(-this.maxLogSize);
        }

        this.tokens = Math.max(0, this.maxTokens - this.requestLog.length);
    }

    /**
     * Apply a penalty delay (from 429 or errors)
     * @param {number} seconds
     */
    penalize(seconds) {
        const penaltyEnd = Date.now() + (seconds * 1000);
        this.penaltyUntil = Math.max(this.penaltyUntil, penaltyEnd, this.cooldownUntil);
        this.stats.throttledRequests++;
    }

    /**
     * Acquire permission to send a request, waiting if necessary
     * @param {AbortSignal} signal - Optional abort signal
     * @returns {Promise<boolean>} - True if acquired, false if cancelled
     */
    async acquire(signal = null) {
        if (signal?.aborted) return false;

        // Keep internal counters current
        this.refill();

        // Honor any active penalty/cooldown
        let penaltyWait = this.getPenaltyWait();
        if (penaltyWait > 0) {
            if (this.onStatusChange) this.onStatusChange(this.getStatus());
            const waited = await this.sleep(penaltyWait, signal);
            if (!waited) return false;
            this.refill();
        }

        // If we already exhausted the window, start cooldown and wait it out
        if (this.requestLog.length >= this.maxTokens) {
            this.startCooldown('rate-limit');
            penaltyWait = this.getPenaltyWait();
            if (this.onStatusChange) this.onStatusChange(this.getStatus());
            const waited = await this.sleep(penaltyWait, signal);
            if (!waited) return false;
            this.refill();
        }

        // Enforce minimum spacing to avoid microbursts
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTimestamp;
        const minimumWait = this.MIN_REQUEST_DELAY - timeSinceLastRequest;

        if (minimumWait > 0) {
            this.stats.throttledRequests++;
            const waited = await this.sleep(minimumWait, signal);
            if (!waited) return false;
            this.refill();
        }

        // Final guard in case another request consumed the last slot while we waited
        if (this.requestLog.length >= this.maxTokens) {
            this.startCooldown('rate-limit');
            penaltyWait = this.getPenaltyWait();
            if (this.onStatusChange) this.onStatusChange(this.getStatus());
            const waited = await this.sleep(penaltyWait, signal);
            if (!waited) return false;
            this.refill();
        }

        if (signal?.aborted) return false;

        // Record the request
        const timestamp = Date.now();
        this.lastRequestTimestamp = timestamp;
        this.stats.totalRequests++;
        this.stats.lastRequestTime = timestamp;

        this.requestLog.push(timestamp);
        this.cleanRequestLog();

        // If we just consumed the last allowed slot, start the cooldown timer immediately
        if (this.requestLog.length >= this.maxTokens) {
            this.startCooldown('rate-limit');
        }

        if (this.onStatusChange) {
            this.onStatusChange(this.getStatus());
        }

        return true;
    }

    /**
     * Sleep with abort support
     * @param {number} ms
     * @param {AbortSignal} signal
     * @returns {Promise<boolean>}
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
     * Get current status with enhanced metrics
     */
    getStatus() {
        this.refill();

        const now = Date.now();
        const recentRequests = this.requestLog.length;
        const available = Math.max(0, this.maxTokens - recentRequests);
        const penaltyRemaining = this.getPenaltyWait();
        const cooldownRemaining = Math.max(0, this.cooldownUntil - now);

        let timeUntilNextToken = 0;
        if (penaltyRemaining > 0) {
            timeUntilNextToken = penaltyRemaining;
        } else if (recentRequests >= this.maxTokens && this.requestLog.length > 0) {
            const oldest = this.requestLog[0];
            timeUntilNextToken = Math.max(0, this.windowMs - (now - oldest));
        }

        return {
            availableTokens: available,
            exactTokens: available,
            maxTokens: this.maxTokens,
            penaltyRemaining,
            cooldownRemaining,
            recentRequests,
            refillRate: this.maxTokens / (this.windowMs / 1000),
            timeUntilNextToken: Math.ceil(timeUntilNextToken),
            utilizationPercent: Math.round((recentRequests / this.maxTokens) * 100),
            stats: { ...this.stats }
        };
    }

    /**
     * Reset the limiter
     */
    reset() {
        this.tokens = this.maxTokens;
        this.lastRequestTimestamp = Date.now();
        this.penaltyUntil = 0;
        this.cooldownUntil = 0;
        this.requestLog = [];

        if (this.onStatusChange) {
            this.onStatusChange(this.getStatus());
        }
    }

    /**
     * Record successful request
     */
    recordSuccess() {
        this.stats.successfulRequests++;
    }

    /**
     * Record failed request
     */
    recordFailure() {
        this.stats.failedRequests++;
    }

    /**
     * Get request rate (requests per minute)
     */
    getRequestRate() {
        this.cleanRequestLog();
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        const recentRequests = this.requestLog.filter(t => t > oneMinuteAgo).length;
        return recentRequests;
    }

    /**
     * Logging helper
     */
    log(level, message, data = null) {
        if (typeof console[level] === 'function') {
            console[level](`[RateLimiter] ${message}`, data || '');
        }
    }

    /**
     * Cleanup when destroyed
     */
    destroy() {
        this.stopAutoRefill();
        this.onStatusChange = null;
    }
}

// ============================================================================
// TARGET INFO MODEL
// ============================================================================

class TargetInfo {
    constructor(data = {}) {
        // Core identifiers
        this.userId = data.userId || 0;
        this.name = data.name || '';
        this.customName = data.customName || '';
        this.notes = data.notes || '';

        // Character info
        this.level = data.level || null;
        this.gender = data.gender || '';
        this.age = data.age || null;

        // Status
        this.statusState = data.statusState || 'Unknown';
        this.statusDesc = data.statusDesc || '';
        this.statusReason = data.statusReason || '';
        this.statusUntil = data.statusUntil || null;

        // Activity
        this.lastActionStatus = data.lastActionStatus || '';
        this.lastActionRelative = data.lastActionRelative || '';
        this.lastActionTimestamp = data.lastActionTimestamp || null;

        // Faction
        this.faction = data.faction || '';
        this.factionId = data.factionId || null;
        this.factionPosition = data.factionPosition || '';

        // Grouping
        this.groupId = data.groupId || 'default';
        this.tags = data.tags || [];
        this.isFavorite = data.isFavorite || false;
        this.priority = data.priority || 0;
        this.avatarUrl = data.avatarUrl || '';
        this.avatarPath = data.avatarPath || '';

        // State
        this.monitorOk = data.monitorOk || false;
        this.ok = data.ok || false;
        this.error = data.error || null;
        this.lastUpdated = data.lastUpdated || Date.now();
        this.addedAt = data.addedAt || Date.now();

        // Statistics
        this.attackCount = data.attackCount || 0;
        this.lastAttacked = data.lastAttacked || null;

        // Intelligence
        this.intel = data.intel ? {
            ...data.intel,
            stats: data.intel.stats ? { ...data.intel.stats } : null,
            compare: data.intel.compare ? { ...data.intel.compare } : null,
            attacks: data.intel.attacks ? { ...data.intel.attacks } : null
        } : null;
        this.difficulty = data.difficulty ? { ...data.difficulty } : null;
    }

    /**
     * Check if target is attackable
     */
    isAttackable() {
        if (this.error) return false;
        const state = (this.statusState || '').toLowerCase();
        return state === 'okay' || state === 'ok';
    }

    /**
     * Check if target is in hospital
     */
    isInHospital() {
        return (this.statusState || '').toLowerCase() === 'hospital';
    }

    /**
     * Check if target is traveling
     */
    isTraveling() {
        const state = (this.statusState || '').toLowerCase();
        return state === 'traveling' || state === 'abroad';
    }

    /**
     * Check if target is in jail
     */
    isInJail() {
        const state = (this.statusState || '').toLowerCase();
        return state === 'jail' || state === 'jailed';
    }

    /**
     * Check if target is in federal jail
     */
    isInFederal() {
        return (this.statusState || '').toLowerCase() === 'federal';
    }

    /**
     * Check if target is fallen
     */
    isFallen() {
        return (this.statusState || '').toLowerCase() === 'fallen';
    }

    /**
     * Get time remaining on status (hospital, jail, etc.)
     * @returns {number|null} seconds remaining
     */
    getTimeRemaining() {
        if (!this.statusUntil || this.statusUntil <= 0) return null;
        const now = Math.floor(Date.now() / 1000);
        const remaining = this.statusUntil - now;
        return remaining > 0 ? remaining : 0;
    }

    /**
     * Format time remaining as human-readable string
     */
    getFormattedTimeRemaining() {
        const seconds = this.getTimeRemaining();
        if (seconds === null || seconds === undefined) return '';
        if (seconds <= 0) return '0s';

        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (days > 0) return `${days}d ${hours}h ${minutes}m`;
        if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
        if (minutes > 0) return `${minutes}m ${secs}s`;
        return `${secs}s`;
    }

    /**
     * Get CSS class for status styling
     */
    getStatusClass() {
        if (this.error) return 'status-error';
        const state = (this.statusState || '').toLowerCase();
        switch (state) {
            case 'okay':
            case 'ok':
                return 'status-okay';
            case 'hospital':
                return 'status-hospital';
            case 'jail':
                return 'status-jail';
            case 'traveling':
            case 'abroad':
                return 'status-traveling';
            case 'fallen':
                return 'status-fallen';
            case 'federal':
                return 'status-federal';
            default:
                return 'status-unknown';
        }
    }

    /**
     * Get display name (custom name or Torn name)
     */
    getDisplayName() {
        return this.customName || this.name || `User ${this.userId}`;
    }

    /**
     * Get attack URL
     */
    getAttackUrl() {
        return `https://www.torn.com/loader.php?sid=attack&user2ID=${this.userId}`;
    }

    /**
     * Get profile URL
     */
    getProfileUrl() {
        return `https://www.torn.com/profiles.php?XID=${this.userId}`;
    }

    /**
     * Serialize to plain object
     */
    toJSON() {
        return {
            userId: this.userId,
            name: this.name,
            customName: this.customName,
            notes: this.notes,
            level: this.level,
            gender: this.gender,
            age: this.age,
            statusState: this.statusState,
            statusDesc: this.statusDesc,
            statusReason: this.statusReason,
            statusUntil: this.statusUntil,
            lastActionStatus: this.lastActionStatus,
            lastActionRelative: this.lastActionRelative,
            lastActionTimestamp: this.lastActionTimestamp,
            faction: this.faction,
            factionId: this.factionId,
            factionPosition: this.factionPosition,
            groupId: this.groupId,
            tags: this.tags,
            isFavorite: this.isFavorite,
            priority: this.priority,
            monitorOk: this.monitorOk,
            ok: this.ok,
            error: this.error,
            lastUpdated: this.lastUpdated,
            addedAt: this.addedAt,
            avatarUrl: this.avatarUrl,
            avatarPath: this.avatarPath,
            attackCount: this.attackCount,
            lastAttacked: this.lastAttacked,
            intel: this.intel ? {
                ...this.intel,
                stats: this.intel.stats ? { ...this.intel.stats } : null,
                compare: this.intel.compare ? { ...this.intel.compare } : null,
                attacks: this.intel.attacks ? { ...this.intel.attacks } : null
            } : null,
            difficulty: this.difficulty ? { ...this.difficulty } : null
        };
    }

    /**
     * Create from plain object
     */
    static fromJSON(data) {
        return new TargetInfo(data);
    }
}

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
        this.maxAttempts = options.maxAttempts || API_CONFIG.MAX_RETRY_ATTEMPTS;
        this.timeoutMs = options.timeoutMs || API_CONFIG.DEFAULT_TIMEOUT_MS;
        this.baseBackoffMs = options.baseBackoffMs || API_CONFIG.BASE_BACKOFF_MS;
        this.maxBackoffMs = options.maxBackoffMs || API_CONFIG.MAX_BACKOFF_MS;

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

        const url = `${API_CONFIG.BASE_URL}/user/?selections=basic&key=${testKey.trim()}`;

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

        const url = `${API_CONFIG.BASE_URL}/user/${uid}?selections=${API_CONFIG.SELECTIONS.USER_BASIC}&key=${this.apiKey}`;

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

                return this.parseUserResponse(uid, response);

            } catch (error) {
                this.consecutiveFailures++;
                this.limiter.recordFailure();

                if (error.name === 'AbortError') {
                    return this.createErrorInfo(uid, 'Request cancelled');
                }

                // Handle specific error types
                if (error instanceof RateLimitError) {
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

                if (error instanceof NetworkError || error instanceof TimeoutError) {
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
                    'User-Agent': API_CONFIG.USER_AGENT
                },
                signal: combinedSignal
            });

            clearTimeout(timeoutId);

            // Calculate latency
            this.lastRequestDuration = Date.now() - startTime;

            // Handle rate limiting
            if (response.status === 429) {
                const retryAfter = this.parseRetryAfter(response.headers);
                throw new RateLimitError(retryAfter);
            }

            // Handle other HTTP errors
            if (!response.ok) {
                const error = new Error(`HTTP ${response.status}`);
                error.status = response.status;
                throw error;
            }

            return await response.json();

        } catch (error) {
            clearTimeout(timeoutId);

            if (error.name === 'AbortError') {
                throw new TimeoutError();
            }

            if (error instanceof RateLimitError) {
                throw error;
            }

            if (error.name === 'TypeError' &&
                (error.message.includes('fetch') || error.message.includes('network'))) {
                throw new NetworkError(error.message, error);
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
        const errorInfo = TORN_ERROR_CODES[code] || TORN_ERROR_CODES[0];

        return new TornAPIError(code, message, errorInfo.userMessage, errorInfo.retryable);
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
     * Parse user API response into TargetInfo
     * @private
     */
    parseUserResponse(userId, data) {
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
            const statusUntil = this.safeInt(status.until);

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

            return new TargetInfo({
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
        const info = new TargetInfo({ userId });
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

// ============================================================================
// INPUT PARSER - Extract User IDs from various formats
// ============================================================================

class InputParser {
    /**
     * Parse input text and extract valid Torn user IDs
     * Supports: raw IDs, profile URLs, attack URLs, mixed content
     * @param {string} input
     * @returns {{ids: number[], invalid: string[]}}
     */
    static parseUserIds(input) {
        if (!input || typeof input !== 'string') {
            return { ids: [], invalid: [] };
        }

        const ids = new Set();
        const invalid = [];

        // Split by common delimiters
        const parts = input.split(/[\n\r,;\s]+/).filter(Boolean);

        for (const part of parts) {
            const trimmed = part.trim();
            if (!trimmed) continue;

            const id = this.extractUserId(trimmed);
            if (id) {
                ids.add(id);
            } else if (trimmed.length > 0 && !/^\s*$/.test(trimmed)) {
                invalid.push(trimmed);
            }
        }

        return { ids: Array.from(ids), invalid };
    }

    /**
     * Extract single user ID from string
     * @param {string} input
     * @returns {number|null}
     */
    static extractUserId(input) {
        if (!input) return null;

        const trimmed = input.trim();

        // Direct numeric ID
        if (/^\d+$/.test(trimmed)) {
            const id = parseInt(trimmed, 10);
            return (id > 0 && id < 10000000) ? id : null; // Reasonable Torn ID range
        }

        // Profile URL: profiles.php?XID=123456
        const profileMatch = trimmed.match(/profiles\.php\?XID=(\d+)/i);
        if (profileMatch) {
            return parseInt(profileMatch[1], 10);
        }

        // Attack URL: loader.php?sid=attack&user2ID=123456
        const attackMatch = trimmed.match(/user2ID=(\d+)/i);
        if (attackMatch) {
            return parseInt(attackMatch[1], 10);
        }

        // Generic URL with XID parameter
        const xidMatch = trimmed.match(/XID=(\d+)/i);
        if (xidMatch) {
            return parseInt(xidMatch[1], 10);
        }

        // Torn profile link format: [Name [123456]]
        const bracketMatch = trimmed.match(/\[(\d+)\]/);
        if (bracketMatch) {
            return parseInt(bracketMatch[1], 10);
        }

        // Extract any number from the string as last resort
        const anyNumMatch = trimmed.match(/(\d{4,8})/);
        if (anyNumMatch) {
            const id = parseInt(anyNumMatch[1], 10);
            return (id > 0 && id < 10000000) ? id : null;
        }

        return null;
    }

    /**
     * Validate a single user ID
     * @param {any} id
     * @returns {boolean}
     */
    static isValidUserId(id) {
        const num = typeof id === 'string' ? parseInt(id, 10) : id;
        return Number.isInteger(num) && num > 0 && num < 10000000;
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

// Browser/Electron renderer
if (typeof window !== 'undefined') {
    window.TornAPI = TornAPI;
    window.RateLimiter = RateLimiter;
    window.TargetInfo = TargetInfo;
    window.InputParser = InputParser;
    window.TornAPIError = TornAPIError;
    window.NetworkError = NetworkError;
    window.TimeoutError = TimeoutError;
    window.RateLimitError = RateLimitError;
    window.API_CONFIG = API_CONFIG;
    window.TORN_ERROR_CODES = TORN_ERROR_CODES;
}

// ============================================================================
// TORNSTATS API CLIENT
// ============================================================================

/**
 * TornStats API client for NPC loot data
 */
class TornStatsAPI {
    constructor() {
        this.baseUrl = 'https://www.tornstats.com/api/v2';
        this.apiKey = null;
        this.cache = new Map();
        this.cacheTimestamps = new Map();
        this.cacheTimeout = 30000; // 30 seconds
        this.spyCacheTimeout = 15 * 60 * 1000; // 15 minutes
        this.lastFetch = null;
        this.rateLimitPerMinute = 100;
        this.requestTimes = [];
    }

    setApiKey(key) {
        this.apiKey = key;
    }

    async checkRateLimit() {
        const now = Date.now();
        // Remove requests older than 1 minute
        this.requestTimes = this.requestTimes.filter(time => now - time < 60000);

        if (this.requestTimes.length >= this.rateLimitPerMinute) {
            throw new Error('TornStats API rate limit reached (100 calls/minute)');
        }

        this.requestTimes.push(now);
    }

    async fetchLootData() {
        if (!this.apiKey || this.apiKey.trim() === '') {
            throw new Error('TornStats API key not set');
        }

        // Validate API key format (TornStats keys start with TS_)
        if (!this.apiKey.startsWith('TS_')) {
            throw new Error('Invalid TornStats API key format. Keys should start with "TS_"');
        }

        // Check cache
        if (this.cache.has('loot') && this.lastFetch) {
            const age = Date.now() - this.lastFetch;
            if (age < this.cacheTimeout) {
                return this.cache.get('loot');
            }
        }

        await this.checkRateLimit();

        try {
            const url = `${this.baseUrl}/${this.apiKey}/loot`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'TornTargetTracker/2.0'
                },
                timeout: 10000
            });

            const rawBody = await response.text();
            const contentType = response.headers.get('content-type') || '';
            let data = null;
            try {
                data = rawBody ? JSON.parse(rawBody) : null;
            } catch (parseError) {
                // Non-JSON response (likely maintenance/HTML). Leave data as null and handle below.
            }

            const maintenanceDetected = rawBody && rawBody.toLowerCase().includes('maintenance');
            const looksHtml = contentType.includes('text/html') || (rawBody && rawBody.trim().startsWith('<'));

            if (!response.ok) {
                // Provide more specific error messages based on status code
                if (response.status === 404) {
                    // TornStats currently returns 404 while the service is down for maintenance
                    if (maintenanceDetected || looksHtml) {
                        throw new Error('TornStats is currently down for maintenance (HTTP 404)');
                    }
                    throw new Error('TornStats API endpoint unavailable (404). The service may be down or the API key is incorrect.');
                } else if (response.status === 401 || response.status === 403) {
                    throw new Error('Invalid or unauthorized TornStats API key');
                } else if (response.status === 429) {
                    throw new Error('TornStats rate limit exceeded. Please wait before trying again');
                } else if (response.status === 502 || response.status === 503 || maintenanceDetected || looksHtml) {
                    throw new Error('TornStats server unavailable. Please try again later');
                } else if (response.status >= 500) {
                    throw new Error('TornStats server error. Please try again later');
                } else {
                    throw new Error(`TornStats API error: ${response.status} ${response.statusText}`);
                }
            }

            // Check for API errors in response
            if (data && data.error) {
                throw new Error(data.error.error || data.error.message || 'TornStats API error');
            }

            // Validate that we got actual data back
            if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
                if (maintenanceDetected || looksHtml) {
                    throw new Error('TornStats returned a maintenance page instead of data');
                }
                throw new Error('TornStats API returned empty or invalid data');
            }

            // Cache the result
            this.cache.set('loot', data);
            this.lastFetch = Date.now();

            return data;
        } catch (error) {
            console.error('TornStats API fetch error:', error);

            // Re-throw with better context if it's a network error
            if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
                throw new Error('Network error: Unable to connect to TornStats. Check your internet connection');
            }

            throw error;
        }
    }

    /**
     * Parse loot data into a usable format
     * TornStats API structure: { "4": { name, status, hosp_out, loot_2-5, updated }, ... }
     */
    parseLootData(data) {
        if (!data || typeof data !== 'object') {
            console.warn('Invalid loot data: expected object, got', typeof data);
            return [];
        }

        const npcs = [];

        try {
            // NPCs are returned as direct keys in the response
            for (const [id, npcData] of Object.entries(data)) {
                try {
                    // Skip non-NPC properties (status, message, etc.)
                    if (id === 'status' || id === 'message' || !npcData || typeof npcData !== 'object') {
                        continue;
                    }

                    // Only process entries that look like NPC data (have a name or torn_id)
                    if (!npcData.name && !npcData.torn_id) {
                        continue;
                    }

                    // Parse NPC data with validation
                    const npcId = parseInt(id, 10);
                    if (isNaN(npcId)) {
                        console.warn(`Invalid NPC ID: ${id}`);
                        continue;
                    }

                    npcs.push({
                        id: npcId,
                        name: npcData.name || `NPC ${id}`,
                        status: npcData.status || 'Unknown',
                        hospitalOut: npcData.hosp_out ? parseInt(npcData.hosp_out, 10) * 1000 : null,
                        loot2: npcData.loot_2 ? parseInt(npcData.loot_2, 10) * 1000 : null,
                        loot3: npcData.loot_3 ? parseInt(npcData.loot_3, 10) * 1000 : null,
                        loot4: npcData.loot_4 ? parseInt(npcData.loot_4, 10) * 1000 : null,
                        loot5: npcData.loot_5 ? parseInt(npcData.loot_5, 10) * 1000 : null,
                        lastUpdate: npcData.updated ? parseInt(npcData.updated, 10) * 1000 : null
                    });
                } catch (npcError) {
                    console.warn(`Error parsing NPC ${id}:`, npcError);
                    // Continue processing other NPCs
                }
            }

            return npcs;
        } catch (error) {
            console.error('Error parsing loot data:', error);
            return [];
        }
    }

    /**
     * Fetch spy/intel data for a specific user
     * @param {number} userId
     * @param {Object} options
     * @param {boolean} options.force - Bypass cache when true
     * @returns {Promise<Object>}
     */
    async fetchSpy(userId, { force = false } = {}) {
        if (!this.apiKey || this.apiKey.trim() === '') {
            throw new Error('TornStats API key not set');
        }

        if (!this.apiKey.startsWith('TS_')) {
            throw new Error('Invalid TornStats API key format. Keys should start with \"TS_\"');
        }

        if (!InputParser.isValidUserId(userId)) {
            throw new Error('Invalid user ID for intelligence lookup');
        }

        const uid = parseInt(userId, 10);
        const cacheKey = `spy-${uid}`;
        const cached = this.cache.get(cacheKey);
        const cachedAt = this.cacheTimestamps.get(cacheKey) || 0;

        if (!force && cached && Date.now() - cachedAt < this.spyCacheTimeout) {
            return cached;
        }

        await this.checkRateLimit();

        const url = `${this.baseUrl}/${this.apiKey}/spy/user/${uid}`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'TornTargetTracker/2.0'
                },
                timeout: 12000
            });

            const rawBody = await response.text();
            const contentType = response.headers.get('content-type') || '';
            let data = null;
            try {
                data = rawBody ? JSON.parse(rawBody) : null;
            } catch (parseError) {
                // Non-JSON response is treated as maintenance/unavailable
            }

            const maintenanceDetected = rawBody && rawBody.toLowerCase().includes('maintenance');
            const looksHtml = contentType.includes('text/html') || (rawBody && rawBody.trim().startsWith('<'));

            if (!response.ok) {
                if (response.status === 404) {
                    if (maintenanceDetected || looksHtml) {
                        throw new Error('TornStats is currently down for maintenance (HTTP 404)');
                    }
                    throw new Error('TornStats spy endpoint unavailable (404)');
                } else if (response.status === 401 || response.status === 403) {
                    throw new Error('Invalid or unauthorized TornStats API key');
                } else if (response.status === 429) {
                    throw new Error('TornStats rate limit exceeded. Please wait before trying again');
                } else if (response.status >= 500 || maintenanceDetected || looksHtml) {
                    throw new Error('TornStats server unavailable. Please try again later');
                } else {
                    throw new Error(`TornStats API error: ${response.status} ${response.statusText}`);
                }
            }

            if (!data || typeof data !== 'object') {
                throw new Error('TornStats API returned empty or invalid intel data');
            }

            if (data.error) {
                throw new Error(data.error.error || data.error.message || 'TornStats API returned an error');
            }

            const parsed = {
                ...this.parseSpyData(data),
                fetchedAt: Date.now()
            };

            this.cache.set(cacheKey, parsed);
            this.cacheTimestamps.set(cacheKey, Date.now());

            return parsed;
        } catch (error) {
            console.error('TornStats spy fetch error:', error);

            if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
                throw new Error('Network error: Unable to connect to TornStats');
            }

            throw error;
        }
    }

    /**
     * Parse TornStats spy payload into a normalized structure
     * @param {Object} data
     * @returns {{status: boolean, message: string, stats?: Object, attacks?: Object, compare?: Object, timestamp?: number, type?: string}}
     */
    parseSpyData(data) {
        const root = data?.compare || data || {};
        const spy = root.spy || data?.spy || null;
        const attacks = root.attacks || data?.attacks || null;
        const compare = root.data || null;

        const normalizeNumber = (value) => {
            const num = parseFloat(value);
            return Number.isFinite(num) ? num : null;
        };

        const stats = spy ? {
            strength: normalizeNumber(spy.strength),
            defense: normalizeNumber(spy.defense),
            speed: normalizeNumber(spy.speed),
            dexterity: normalizeNumber(spy.dexterity),
            total: normalizeNumber(spy.total),
            targetScore: normalizeNumber(spy.target_score),
            yourScore: normalizeNumber(spy.your_score),
            fairFight: normalizeNumber(spy.fair_fight_bonus),
            difference: spy.difference || '',
            type: spy.type || ''
        } : null;

        const ts = normalizeNumber(root.timestamp || spy?.timestamp);
        const timestamp = ts ? ts * 1000 : null;
        const resolvedStatus = spy?.status !== undefined && spy?.status !== null
            ? !!spy.status
            : (root.status !== undefined && root.status !== null ? !!root.status : !!spy);

        return {
            status: resolvedStatus,
            message: spy?.message || root.message || data?.message || (stats ? 'Intel available' : 'No intel available'),
            stats,
            attacks,
            compare,
            timestamp,
            type: spy?.type || ''
        };
    }

    clearCache() {
        this.cache.clear();
        this.lastFetch = null;
        this.cacheTimestamps.clear();
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.tornStatsAPI = new TornStatsAPI();
}

// Node.js/CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TornAPI,
        TornStatsAPI,
        RateLimiter,
        TargetInfo,
        InputParser,
        TornAPIError,
        NetworkError,
        TimeoutError,
        RateLimitError,
        API_CONFIG,
        TORN_ERROR_CODES
    };
}
