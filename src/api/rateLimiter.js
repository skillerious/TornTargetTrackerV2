/**
 * Torn Target Tracker - Rate Limiter
 * Fixed window rate limiting with enforced cooldown
 */

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
        maxTokens = window.API_CONFIG.RATE_LIMIT_PER_MINUTE,
        windowMs = window.API_CONFIG.RATE_LIMIT_WINDOW_MS,
        cooldownMs = window.API_CONFIG.RATE_LIMIT_COOLDOWN_MS
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
        const cap = window.API_CONFIG.MAX_RATE_LIMIT_PER_MINUTE || 99;
        const parsed = Number.parseInt(limit, 10);
        const base = Number.isFinite(parsed) ? parsed : window.API_CONFIG.RATE_LIMIT_PER_MINUTE;
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

// Export for browser/Electron renderer
if (typeof window !== 'undefined') {
    window.RateLimiter = RateLimiter;
}
