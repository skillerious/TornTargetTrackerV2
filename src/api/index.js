/**
 * Torn Target Tracker - API Module Index
 * Entry point that loads all API modules in correct order
 *
 * This file ensures all API components are loaded and available on the window object.
 * Scripts should be loaded in index.html in this order:
 *   1. src/api/config.js
 *   2. src/api/errors.js
 *   3. src/api/rateLimiter.js
 *   4. src/api/targetInfo.js
 *   5. src/api/inputParser.js
 *   6. src/api/tornApi.js
 *   7. src/api/tornStatsApi.js
 *   8. src/api/index.js (this file - optional, for verification)
 */

// Verify all required components are loaded
(function() {
    'use strict';

    const requiredComponents = [
        'API_CONFIG',
        'TORN_ERROR_CODES',
        'TornAPIError',
        'NetworkError',
        'TimeoutError',
        'RateLimitError',
        'RateLimiter',
        'TargetInfo',
        'InputParser',
        'TornAPI',
        'TornStatsAPI'
    ];

    const missing = requiredComponents.filter(name => typeof window[name] === 'undefined');

    if (missing.length > 0) {
        console.error('[API] Missing required components:', missing.join(', '));
        console.error('[API] Ensure all API module scripts are loaded in the correct order.');
    } else {
        console.log('[API] All API modules loaded successfully');
    }
})();
