/**
 * Torn Target Tracker - Custom Error Classes
 * Specialized error types for API error handling
 */

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
        const errorInfo = window.TORN_ERROR_CODES[code] || window.TORN_ERROR_CODES[0];
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

// Export for browser/Electron renderer
if (typeof window !== 'undefined') {
    window.TornAPIError = TornAPIError;
    window.NetworkError = NetworkError;
    window.TimeoutError = TimeoutError;
    window.RateLimitError = RateLimitError;
}
