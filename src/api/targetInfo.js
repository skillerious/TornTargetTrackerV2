/**
 * Torn Target Tracker - Target Info Model
 * Data model for target information
 */

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
     * Only returns a value if the current status actually supports a countdown timer.
     * @returns {number|null} seconds remaining
     */
    getTimeRemaining() {
        if (!this.statusUntil || this.statusUntil <= 0) return null;

        // Only show timer for statuses that actually have countdowns
        // If status is "Okay", there should be no timer even if statusUntil has stale data
        const state = (this.statusState || '').toLowerCase();
        const hasTimer = state === 'hospital' || state === 'jail' || state === 'jailed' ||
                         state === 'federal' || state === 'traveling' || state === 'abroad';
        if (!hasTimer) return null;

        // Align countdowns to Torn server time to reduce drift if the local clock is off
        const offsetMs = window.appState?.api?.serverTimeOffsetMs || 0;
        const now = Math.floor((Date.now() + offsetMs) / 1000);

        // Defensive: normalize millisecond timestamps that may slip in from imports
        const untilSeconds = this.statusUntil && this.statusUntil > 1e10
            ? Math.floor(this.statusUntil / 1000)
            : this.statusUntil;

        const remaining = untilSeconds - now;
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

// Export for browser/Electron renderer
if (typeof window !== 'undefined') {
    window.TargetInfo = TargetInfo;
}
