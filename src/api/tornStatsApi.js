/**
 * Torn Target Tracker - TornStats API Client
 * API client for TornStats.com NPC loot and spy data
 */

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

        if (!window.InputParser.isValidUserId(userId)) {
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

// Export for browser/Electron renderer
if (typeof window !== 'undefined') {
    window.TornStatsAPI = TornStatsAPI;
    // Create global instance
    window.tornStatsAPI = new TornStatsAPI();
}
