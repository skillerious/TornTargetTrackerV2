/**
 * Torn Target Tracker - Input Parser
 * Extract User IDs from various formats
 */

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

// Export for browser/Electron renderer
if (typeof window !== 'undefined') {
    window.InputParser = InputParser;
}
