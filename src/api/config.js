/**
 * Torn Target Tracker - API Configuration
 * Constants, configuration, and error code definitions
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

// Export for browser/Electron renderer
if (typeof window !== 'undefined') {
    window.API_CONFIG = API_CONFIG;
    window.TORN_ERROR_CODES = TORN_ERROR_CODES;
}
