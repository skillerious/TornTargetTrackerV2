/**
 * Torn Target Tracker - Application UI Controller (Enhanced v2.0)
 * Complete UI management, event handling, and user interactions
 */

(function() {
    'use strict';

    // ========================================================================
    // DOM ELEMENTS CACHE
    // ========================================================================
    
    const DOM = {
        // Titlebar
        titlebarVersion: null,
        menubar: null,
        menubarFlyout: null,
        btnMinimize: null,
        btnMaximize: null,
        btnClose: null,

        // Activity bar
        activityItems: null,
        activityAbout: null,
        connectionStatus: null,
        refreshAllBtn: null,
        attackableCount: null,

        // Sidebar
        sidebar: null,
        searchInput: null,
        searchClear: null,
        groupsList: null,
        filterItems: null,
        targetList: null,
        targetsCount: null,
        sortBtns: null,
        attackTrackerToggle: null,
        attackTrackerReset: null,

        // Header buttons
        addTargetBtn: null,
        bulkAddBtn: null,
        addGroupBtn: null,

        // Content panels
        contentPanels: null,
        targetDetail: null,
        noSelection: null,

        // Target detail
        detailName: null,
        detailId: null,
        detailStatusBadge: null,
        detailAvatar: null,
        detailAvatarInitials: null,
        detailTimer: null,
        detailFavoriteBtn: null,
        detailLevel: null,
        detailFaction: null,
        detailTags: null,
        detailLevelChip: null,
        detailFactionChip: null,
        detailStatusChip: null,
        detailUpdatedChip: null,
        detailDifficultyChip: null,
        detailMonitorOk: null,
        detailWatchBtn: null,
        detailWatchIcon: null,
        detailStatusDesc: null,
        detailLastAction: null,
        detailUpdated: null,
        detailAdded: null,
        detailAttackCount: null,
        detailLastAttacked: null,
        detailGroup: null,
        detailCustomName: null,
        detailNotes: null,
        detailNotesTemplates: null,
        btnRefreshIntel: null,
        detailIntelSection: null,
        detailIntelStatus: null,
        detailIntelMessage: null,
        detailIntelUpdated: null,
        detailIntelSource: null,
        detailIntelStr: null,
        detailIntelDef: null,
        detailIntelSpd: null,
        detailIntelDex: null,
        detailIntelTotal: null,
        detailIntelFreshness: null,
        detailHistoryList: null,

        // Action buttons
        btnAttack: null,
        btnProfile: null,
        btnRefreshTarget: null,
        btnRemoveTarget: null,

        // Status bar
        statusConnection: null,
        statusConnectionText: null,
        statusConnectionDetail: null,
        statusSignalBadges: null,
        statusNextRefresh: null,
        statusNextRefreshText: null,
        statusRefreshMode: null,
        statusRefresh: null,
        refreshText: null,
        progressFill: null,
        btnCancelRefresh: null,
        attackableText: null,
        targetsText: null,
        rateText: null,
        ratePopoverAvailable: null,
        ratePopoverRecent: null,
        ratePopoverUtilization: null,
        ratePopoverPenalty: null,
        ratePopoverPenaltyCard: null,
        ratePopoverSuccess: null,
        ratePopoverFailed: null,
        ratePopoverWindow: null,
        ratePopoverNextToken: null,
        rateChipState: null,
        rateMeterFill: null,
        rateMeterAvailable: null,
        rateMeterMax: null,

        // Command palette
        commandPaletteOverlay: null,
        commandPaletteInput: null,
        commandPaletteList: null,
        commandPaletteEmpty: null,

        // Onboarding
        onboardingOverlay: null,
        onboardingTabs: null,
        onboardingSteps: null,
        onboardingProgressBar: null,
        onboardingPrev: null,
        onboardingNext: null,
        onboardingSkip: null,
        onboardingClose: null,
        onboardingHideToggle: null,
        onboardingConnectionStatus: null,
        onboardingLatency: null,
        onboardingRate: null,
        onboardingTargetCount: null,
        onboardingAttackableCount: null,
        onboardingGroupCount: null,
        onboardingNotifyStatus: null,
        onboardingSmartTitle: null,
        onboardingSmartCopy: null,
        onboardingStatusKey: null,
        onboardingStatusTargets: null,
        onboardingStatusAlerts: null,

        // Modals
        modalAddTarget: null,
        modalBulkAdd: null,
        modalAddGroup: null,
        modalEditGroup: null,
        modalConfirm: null,
        modalAbout: null,
        aboutVersion: null,
        aboutDataPath: null,
        aboutTargetsCount: null,
        aboutAttackableCount: null,
        aboutRefreshInterval: null,
        aboutApiStatus: null,
        aboutApiIcon: null,
        aboutLastRefresh: null,
        aboutOpenLog: null,
        aboutProfileLink: null,
        attackPreventionNotifyBtn: null,

        // Connection Dialog
        connectionDialog: null,
        closeConnectionDialog: null,
        connTornApi: null,
        connInternet: null,
        connTornStats: null,
        apiRate: null,
        apiLatency: null,
        netStatus: null,
        statsLastFetch: null,

        // Context menu
        contextMenu: null,
        contextMenuFavorite: null,
        contextMenuWatch: null,
        groupContextMenu: null,
        groupSubmenu: null,

        // Toast
        toastContainer: null,

        // History
        historyList: null,
        historySearch: null,
        historyRangeButtons: null,
        historyStatTotal: null,
        historyStatUnique: null,
        historyStatStreak: null,
        historyStatTop: null,

        // Bounties
        bountyAlertBadge: null,
        bountyAlertBanner: null,
        bountyAlertDismiss: null,
        bountyStats: null,
        bountyStatsUpdated: null,
        bountyTargetInput: null,
        bountyRewardInput: null,
        bountyAddButton: null,
        bountyEmptyAddButton: null,
        bountyEmptyRewardButton: null,
        bountyList: null,
        bountyEmptyState: null,
        bountyWatchlist: null,
        btnRefreshBountyStats: null,

        // Loading
        loadingOverlay: null,

        // Settings
        settingPlayerLevel: null,
        settingBackupRetention: null,
        settingBackupPreop: null,
        settingCloudBackup: null,
        settingCloudProvider: null,
        cloudProviderDropdown: null,
        cloudProviderToggle: null,
        cloudProviderLabel: null,
        cloudProviderList: null,
        cloudProviderIcon: null,
        btnCloudPath: null,
        btnCloudDetect: null,
        cloudBackupPath: null,
        cloudProviderHint: null
    };

    const INTEL_STALE_MS = 15 * 60 * 1000;
    const NOTES_TEMPLATES = {
        stealth: 'Stealth opener: Smoke -> Flash -> melee finisher. Avoid high dex opponents and strike right after travel.',
        breaker: 'Armor breaker: Lead with incendiary/penetrating rounds, then swap to melee once armor is stripped. Carry FAKs.',
        chain: 'Chain closer: Boost to full energy, target high-respect hits, keep revives ready and exit quickly after attack.'
    };

    // ========================================================================
    // STATE
    // ========================================================================

    let timerInterval = null;
    let pauseCountdownIntervals = [];
    let wifiIconInterval = null;
    let contextTargetId = null;
    let contextGroupId = null;
    let contextSubmenuTimer = null;
    let pendingConfirmAction = null;
    let pendingRecentActivityAction = null;
    let bulkPreviewIds = [];
    let bulkPreviewTimer = null;
    let avatarLoadToken = 0;
    let appInfoCache = null;
    let connectionCheckInProgress = false;
    let attackPreventionTargetId = null;
    const activeCountdownTargets = new Set();
    const targetMetaCache = new Map();
    const reminderWatchers = new Map();
    const recentReadyNotifications = new Map();
    let historyFilters = { range: '24h', query: '', queryLower: '' };
    let appInitialized = false;
    let onboardingStepIndex = 0;
    let onboardingResumeStep = null;
    let onboardingWaitCondition = null;
    const rendererCleanupCallbacks = new Set();

    const smartStatusState = {
        nextRefreshAt: null,
        refreshIntervalMs: null,
        autoRefreshEnabled: false,
        lastRefreshAt: null
    };
    let navigationRefreshQueue = Promise.resolve();
    let lastSelectedTargetId = null;
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const zeroRefreshTracker = new Map();
    const statusRenderCache = new Map();

    const menubarState = {
        activeMenuId: null,
        activeMenuIndex: -1,
        activeItemIndex: -1,
        openedWithKeyboard: false
    };
    let menubarButtons = [];
    let menubarEntries = [];

    const commandPaletteState = {
        commands: [],
        filtered: [],
        highlightIndex: 0
    };
    let bountyRenderTick = 0;
    const DEBUG_RENDERER_LOGS = false;
    const SIDEBAR_COLLAPSE_STORAGE_KEY = 'ttt.sidebar.collapsedSections.v1';
    const MAX_VISIBLE_TOASTS = 5;
    const TOAST_DEDUPE_MS = 1200;
    let lastToastSignature = { key: '', time: 0 };

    function debugLog(...args) {
        if (DEBUG_RENDERER_LOGS) {
            console.debug(...args);
        }
    }

    function normalizeTargetUserId(userId) {
        if (window.InputParser?.normalizeUserId) {
            return window.InputParser.normalizeUserId(userId);
        }

        const parsed = typeof userId === 'number'
            ? userId
            : /^\d+$/.test(String(userId ?? '').trim())
                ? Number.parseInt(String(userId).trim(), 10)
                : null;
        return Number.isInteger(parsed) && parsed > 0 && parsed < 10000000
            ? parsed
            : null;
    }

    function getTornAttackUrl(userId) {
        if (window.TORN_URLS?.getAttackUrl) {
            return window.TORN_URLS.getAttackUrl(userId);
        }

        const id = normalizeTargetUserId(userId);
        return id ? `https://www.torn.com/page.php?sid=attack&user2ID=${id}` : '';
    }

    function openAttackWindow(userId) {
        const id = normalizeTargetUserId(userId);
        if (!id) return false;

        if (window.electronAPI?.openAttack) {
            window.electronAPI.openAttack(id);
            return true;
        }

        const url = getTornAttackUrl(id);
        if (!url) return false;

        window.open(url, '_blank', 'noreferrer');
        return true;
    }

    // ========================================================================
    // MENUBAR CONFIGURATION
    // ========================================================================

    const MENUBAR_MENUS = [
        {
            id: 'file',
            label: 'File',
            items: [
                { id: 'new-target', label: 'New Target...', shortcut: 'Ctrl+N', enabled: () => appInitialized, action: () => openModal('modal-add-target'), icon: 'menu-new-target.svg' },
                { id: 'bulk-add', label: 'Bulk Add Targets...', shortcut: 'Ctrl+Shift+B', enabled: () => appInitialized, action: () => openModal('modal-bulk-add'), icon: 'menu-bulk-add.svg' },
                { type: 'separator' },
                { id: 'backup-restore', label: 'Backup & Restore', enabled: () => appInitialized, action: () => switchView('backup'), icon: 'menu-backup.svg' },
                { id: 'backup-now', label: 'Quick Backup', shortcut: 'Ctrl+Shift+K', enabled: () => appInitialized, action: handleCreateBackup, icon: 'menu-export.svg' },
                { type: 'separator' },
                { id: 'settings', label: 'Settings', shortcut: 'Ctrl+,', action: () => switchView('settings'), icon: 'menu-settings.svg' },
                { type: 'separator' },
                { id: 'quit', label: 'Quit', action: () => window.electronAPI.closeWindow(), icon: 'menu-quit.svg' }
            ]
        },
        {
            id: 'targets',
            label: 'Targets',
            items: [
                { id: 'refresh-all', label: 'Refresh All', shortcut: 'Ctrl+R', enabled: () => appInitialized, action: () => window.appState.refreshAllTargets(), icon: 'menu-refresh.svg' },
                { id: 'attack-selected', label: 'Attack Selected', shortcut: 'Enter', enabled: hasSelectedTarget, action: () => {
                    const target = getSelectedTargetSafe();
                    if (target) {
                        handleAttackById(target.userId, 'menubar');
                    } else {
                        showToast('Select a target first', 'info');
                    }
                }, icon: 'menu-attack.svg' },
                { id: 'open-profile', label: 'Open Profile', enabled: hasSelectedTarget, action: () => {
                    const target = getSelectedTargetSafe();
                    if (target) {
                        window.electronAPI.openProfile(target.userId);
                    }
                }, icon: 'menu-profile.svg' },
                { id: 'copy-selected-ids', label: 'Copy Selected IDs', shortcut: 'Ctrl+Shift+C', enabled: () => getSelectedTargetIds().length > 0, action: () => copyTargetsToClipboard(getTargetsForIds(getSelectedTargetIds()), 'ids'), icon: 'menu-export.svg' },
                { id: 'refresh-selected', label: 'Refresh Selected', shortcut: 'Ctrl+Shift+R', enabled: hasSelectedTarget, action: () => {
                    const target = getSelectedTargetSafe();
                    if (target) {
                        window.appState.refreshTarget(target.userId);
                    }
                }, icon: 'menu-refresh-one.svg' },
                { id: 'toggle-favorite', label: 'Toggle Favorite', shortcut: 'F', enabled: hasSelectedTarget, action: () => {
                    const target = getSelectedTargetSafe();
                    if (target) {
                        window.appState.toggleFavorite(target.userId);
                    }
                }, icon: 'menu-favorite.svg' },
                { id: 'remove-selected', label: 'Remove Selected', shortcut: 'Del', enabled: hasSelectedTarget, action: () => {
                    const target = getSelectedTargetSafe();
                    if (target) {
                        handleRemoveTarget();
                    } else {
                        showToast('Select a target first', 'info');
                    }
                }, icon: 'menu-remove.svg' }
            ]
        },
        {
            id: 'view',
            label: 'View',
            items: [
                { id: 'view-targets', label: 'Targets', shortcut: 'Ctrl+1', checked: () => window.appState.currentView === 'targets', action: () => switchView('targets'), icon: 'menu-view-targets.svg' },
                { id: 'view-history', label: 'History', shortcut: 'Ctrl+2', checked: () => window.appState.currentView === 'history', action: () => switchView('history'), icon: 'menu-view-history.svg' },
                { id: 'view-statistics', label: 'Statistics', shortcut: 'Ctrl+3', checked: () => window.appState.currentView === 'statistics', action: () => switchView('statistics'), icon: 'menu-view-statistics.svg' },
                { id: 'view-loot', label: 'Loot Timer', shortcut: 'Ctrl+4', checked: () => window.appState.currentView === 'loot-timer', action: () => switchView('loot-timer'), icon: 'menu-view-loot.svg' },
                { id: 'view-bounties', label: 'Bounties', shortcut: 'Ctrl+5', checked: () => window.appState.currentView === 'bounties', action: () => switchView('bounties'), icon: 'menu-view-bounties.svg' },
                { id: 'view-help', label: 'Help Center', shortcut: 'Ctrl+6', checked: () => window.appState.currentView === 'help', action: () => switchView('help'), icon: 'menu-view-help.svg' },
                { id: 'view-settings', label: 'Settings', shortcut: 'Ctrl+,', checked: () => window.appState.currentView === 'settings', action: () => switchView('settings'), icon: 'menu-view-settings.svg' },
                { type: 'separator' },
                { id: 'toggle-compact', label: 'Compact Mode', type: 'checkbox', checked: () => !!window.appState.settings.compactMode, action: toggleCompactModeSetting, icon: 'menu-compact.svg' },
                { id: 'toggle-tray', label: 'Minimize to Tray', type: 'checkbox', checked: () => !!window.appState.settings.minimizeToTray, enabled: () => appInitialized, action: toggleTraySetting, icon: 'menu-tray.svg' },
                { id: 'collapse-all', label: 'Collapse All Side Panels', action: collapseAllSections, icon: 'menu-collapse.svg' }
            ]
        },
        {
            id: 'help',
            label: 'Help',
            items: [
                { id: 'help-center', label: 'Help Center', shortcut: 'Ctrl+6', action: () => switchView('help'), icon: 'menu-help-center.svg' },
                { id: 'launch-onboarding', label: 'Launch Onboarding', shortcut: 'F1', action: () => showOnboarding(true), icon: 'menu-onboarding.svg' },
                { id: 'open-data-folder', label: 'Open Data Folder', enabled: () => appInitialized, action: openDataFolder, icon: 'menu-data-folder.svg' },
                { id: 'about', label: 'About Torn Target Tracker', action: showAboutModal, icon: 'menu-about.svg' }
            ]
        }
    ];

    // Inline monochrome icons to mirror the contextual menu styling; falls back to asset SVGs when not provided.
    const INLINE_MENU_ICONS = {
        'menu-new-target.svg': '<path fill="currentColor" d="M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm0 0"/><path fill="currentColor" d="M11 7h2v4h4v2h-4v4h-2v-4H7v-2h4z"/>',
        'menu-bulk-add.svg': '<path fill="currentColor" d="M7 6a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm10 0a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"/><path fill="currentColor" d="M10 14c-2.8 0-5 1.57-5 3.5V19h7.5a5.5 5.5 0 0 1 2.54-4.64C13.96 14.12 12.1 14 10 14zm7 1a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm0 1.5h1.5v1.5H17V20h-1.5v-2H14v-1.5h1.5V15H17v1.5z"/>',
        'menu-attack.svg': '<path fill="currentColor" d="M7 2v11h3v9l7-12h-4l4-8z"/>',
        'menu-profile.svg': '<path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>',
        'menu-favorite.svg': '<path fill="currentColor" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>',
        'menu-refresh.svg': '<path fill="currentColor" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>',
        'menu-refresh-one.svg': '<path fill="currentColor" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>',
        'menu-remove.svg': '<path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>',
        'menu-import.svg': '<path fill="currentColor" d="M5 20h14v-2H5v2zm7-16l5 5h-3v6h-4v-6H7l5-5z"/>',
        'menu-export.svg': '<path fill="currentColor" d="M19 9l-5-5v3H9v4h5v3l5-5zM5 11h2v8h10v-8h2v10H5z"/>',
        'menu-backup.svg': '<path fill="currentColor" d="M5 6h14v4h2V5a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v5h2V6zm14 6H5v6a1 1 0 0 0 1 1h5v-3H9l3-4 3 4h-2v3h5a1 1 0 0 0 1-1v-6z"/>',
        'menu-settings.svg': '<path fill="currentColor" d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a6.97 6.97 0 0 0-1.63-.94L14.5 2h-5l-.25 2.24a6.97 6.97 0 0 0-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.21 8.16a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.13.22.4.3.64.22l2.39-.96c.5.38 1.05.7 1.63.94L9.5 22h5l.25-2.24c.58-.24 1.13-.56 1.63-.94l2.39.96c.24.08.51 0 .64-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>',
        'menu-quit.svg': '<path fill="currentColor" d="M13 3h-2v10h2V3zm4.24 2.76l-1.41 1.41A6 6 0 0 1 18 12a6 6 0 0 1-10.83 3.24l-1.41 1.41A8 8 0 0 0 20 12a8 8 0 0 0-2.76-6.24z"/>',
        'menu-view-targets.svg': '<path fill="currentColor" d="M4 5h16v2H4V5zm0 6h10v2H4v-2zm0 6h16v2H4v-2z"/>',
        'menu-view-history.svg': '<path fill="currentColor" d="M13 3a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7V3zm-1 5v5l4 2 .75-1.23L13 11V8h-1z"/>',
        'menu-view-statistics.svg': '<path fill="currentColor" d="M5 19h2V9H5v10zm6 0h-2v-6h2v6zm2 0h2V5h-2v14zm6 0h-2V11h2v8z"/>',
        'menu-view-loot.svg': '<path fill="currentColor" d="M12 2 2 7l10 5 8-4.02V17h2V7L12 2zm0 11.45L4 9.24V17c0 1.1.9 2 2 2h6v-5.55z"/>',
        'menu-view-bounties.svg': '<path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 5v2h2v2h-2v2h-2v-2H9V9h2V7h2zm-1 12a8 8 0 1 1 0-16 8 8 0 0 1 0 16z"/>',
        'menu-view-settings.svg': '<path fill="currentColor" d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a6.97 6.97 0 0 0-1.63-.94L14.5 2h-5l-.25 2.24a6.97 6.97 0 0 0-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.21 8.16a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.13.22.4.3.64.22l2.39-.96c.5.38 1.05.7 1.63.94L9.5 22h5l.25-2.24c.58-.24 1.13-.56 1.63-.94l2.39.96c.24.08.51 0 .64-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>',
        'menu-view-help.svg': '<path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 14h-2v-2h2v2zm1.15-5.35-.24.2c-.64.51-.91.9-.91 1.81v.34h-2V12c0-1.22.43-1.98 1.27-2.69l.44-.38c.52-.45.79-.86.79-1.45 0-.81-.65-1.36-1.53-1.36-.93 0-1.51.55-1.6 1.45l-.03.33H8.14l.02-.35c.12-1.94 1.5-3.28 3.75-3.28 2.18 0 3.69 1.26 3.69 3.12 0 1.03-.36 1.79-1.45 2.72z"/>',
        'menu-help-center.svg': '<path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 14h-2v-2h2v2zm1.15-5.35-.24.2c-.64.51-.91.9-.91 1.81v.34h-2V12c0-1.22.43-1.98 1.27-2.69l.44-.38c.52-.45.79-.86.79-1.45 0-.81-.65-1.36-1.53-1.36-.93 0-1.51.55-1.6 1.45l-.03.33H8.14l.02-.35c.12-1.94 1.5-3.28 3.75-3.28 2.18 0 3.69 1.26 3.69 3.12 0 1.03-.36 1.79-1.45 2.72z"/>',
        'menu-compact.svg': '<path fill="currentColor" d="M4 5h8v6H4V5zm0 8h8v6H4v-6zm10-8h6v4h-6V5zm0 6h6v8h-6v-8z"/>',
        'menu-tray.svg': '<path fill="currentColor" d="M20 13h-5v2h-6v-2H4v6h16v-6zm0-8H4a2 2 0 0 0-2 2v8h4v-2h10v2h4V7a2 2 0 0 0-2-2z"/>',
        'menu-collapse.svg': '<path fill="currentColor" d="M7 10h2V6h4v4h2l-4 4-4-4zm10 4h-2v4H9v-4H7l4-4 4 4z"/>',
        'menu-data-folder.svg': '<path fill="currentColor" d="M4 6h5.2c.3 0 .58.14.76.37L11.6 8H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/><path fill="currentColor" d="M14.5 11h5.5L17 8.5l1.4-1.4L23.3 12l-4.9 4.9L17 15.6 20 12.5h-5.5V11z"/>',
        'menu-about.svg': '<path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 4.8a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 0 1 0-2.8zM13.4 17H10.6v-2h.9v-4.2h-.9v-2h2.8V15h.9V17z"/>',
        'menu-onboarding.svg': '<path fill="currentColor" d="M12 2c-.55 0-1 .45-1 1v2.18a6.01 6.01 0 0 0-4.74 4.97l-.46 3.2a1 1 0 0 0 1.43 1.03l1.92-.86L9 18.68a1 1 0 0 0 1.62.77l1.88-1.52 1.88 1.52A1 1 0 0 0 16 18.7l-.15-4.16 1.92.86a1 1 0 0 0 1.43-1.03l-.46-3.2A6.01 6.01 0 0 0 13 5.18V3c0-.55-.45-1-1-1zm0 6a4 4 0 0 1 3.92 3.3l.07.47-1.1-.5a1 1 0 0 0-1.38.97l.12 3.2-.9-.73a1 1 0 0 0-1.26 0l-.9.73.12-3.2a1 1 0 0 0-1.38-.97l-1.1.5.07-.47A4 4 0 0 1 12 8z"/>',
        'menu-settings.svg#tray': '<path fill="currentColor" d="M20 13h-5v2h-6v-2H4v6h16v-6zm0-8H4a2 2 0 0 0-2 2v8h4v-2h10v2h4V7a2 2 0 0 0-2-2z"/>',
        'menu-view-settings.svg#toggle': '<path fill="currentColor" d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a6.97 6.97 0 0 0-1.63-.94L14.5 2h-5l-.25 2.24a6.97 6.97 0 0 0-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.21 8.16a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.13.22.4.3.64.22l2.39-.96c.5.38 1.05.7 1.63.94L9.5 22h5l.25-2.24c.58-.24 1.13-.56 1.63-.94l2.39.96c.24.08.51 0 .64-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>'
    };

    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    function cacheDOMElements() {
        // Titlebar
        DOM.titlebarVersion = document.getElementById('titlebar-version');
        DOM.menubar = document.getElementById('titlebar-menubar');
        DOM.menubarFlyout = document.getElementById('titlebar-menubar-flyout');
        DOM.btnMinimize = document.getElementById('btn-minimize');
        DOM.btnMaximize = document.getElementById('btn-maximize');
        DOM.btnClose = document.getElementById('btn-close');

        // Activity bar
        DOM.activityItems = document.querySelectorAll('.activity-item[data-view]');
        DOM.activityAbout = document.getElementById('activity-about');
        DOM.connectionStatus = document.getElementById('connection-status');
        DOM.refreshAllBtn = document.getElementById('refresh-all-btn');
        DOM.attackableCount = document.getElementById('attackable-count');

        // Sidebar
        DOM.sidebar = document.getElementById('sidebar');
        DOM.searchInput = document.getElementById('search-input');
        DOM.searchClear = document.getElementById('search-clear');
        DOM.groupsList = document.getElementById('groups-list');
        DOM.filterItems = document.querySelectorAll('.filter-item');
        DOM.targetList = document.getElementById('target-list');
        DOM.targetsCount = document.getElementById('targets-count');
        DOM.sortBtns = document.querySelectorAll('.sort-btn');
        DOM.attackTrackerToggle = document.getElementById('attack-tracker-toggle');
        DOM.attackTrackerReset = document.getElementById('attack-tracker-reset');

        // Header buttons
        DOM.addTargetBtn = document.getElementById('add-target-btn');
        DOM.bulkAddBtn = document.getElementById('bulk-add-btn');
        DOM.addGroupBtn = document.getElementById('add-group-btn');

        // Content panels
        DOM.contentPanels = document.querySelectorAll('.content-panel');
        DOM.targetDetail = document.getElementById('target-detail');
        DOM.noSelection = document.getElementById('no-selection');

        // Target detail elements
        DOM.detailName = document.getElementById('detail-name');
        DOM.detailId = document.getElementById('detail-id');
        DOM.detailStatusBadge = document.getElementById('detail-status-badge');
        DOM.detailAvatar = document.getElementById('detail-avatar');
        DOM.detailAvatarInitials = document.getElementById('detail-avatar-initials');
        DOM.detailTimer = document.getElementById('detail-timer');
        DOM.detailFavoriteBtn = document.getElementById('detail-favorite-btn');
        DOM.detailLevel = document.getElementById('detail-level');
        DOM.detailFaction = document.getElementById('detail-faction');
        DOM.detailTags = document.getElementById('detail-tags');
        DOM.detailLevelChip = document.getElementById('detail-level-chip');
        DOM.detailFactionChip = document.getElementById('detail-faction-chip');
        DOM.detailStatusChip = document.getElementById('detail-status-chip');
        DOM.detailUpdatedChip = document.getElementById('detail-updated-chip');
        DOM.detailMonitorOk = document.getElementById('detail-monitor-ok');
        DOM.detailWatchBtn = document.getElementById('detail-watch-btn');
        DOM.detailWatchIcon = DOM.detailWatchBtn?.querySelector('img');
        DOM.detailStatusDesc = document.getElementById('detail-status-desc');
        DOM.detailLastAction = document.getElementById('detail-last-action');
        DOM.detailUpdated = document.getElementById('detail-updated');
        DOM.detailAdded = document.getElementById('detail-added');
        DOM.detailAttackCount = document.getElementById('detail-attack-count');
        DOM.detailLastAttacked = document.getElementById('detail-last-attacked');
        DOM.detailGroup = document.getElementById('detail-group');
        DOM.detailCustomName = document.getElementById('detail-custom-name');
        DOM.detailNotes = document.getElementById('detail-notes');
        DOM.detailNotesTemplates = document.querySelectorAll('[data-notes-template]');
        DOM.detailDifficultyChip = document.getElementById('detail-difficulty-chip');
        DOM.btnRefreshIntel = document.getElementById('btn-refresh-intel');
        DOM.detailIntelSection = document.getElementById('detail-intel-section');
        DOM.detailIntelStatus = document.getElementById('detail-intel-status');
        DOM.detailIntelMessage = document.getElementById('detail-intel-message');
        DOM.detailIntelUpdated = document.getElementById('detail-intel-updated');
        DOM.detailIntelSource = document.getElementById('detail-intel-source');
        DOM.detailIntelStr = document.getElementById('detail-intel-str');
        DOM.detailIntelDef = document.getElementById('detail-intel-def');
        DOM.detailIntelSpd = document.getElementById('detail-intel-spd');
        DOM.detailIntelDex = document.getElementById('detail-intel-dex');
        DOM.detailIntelTotal = document.getElementById('detail-intel-total');
        DOM.detailIntelFreshness = document.getElementById('detail-intel-freshness');
        DOM.btnEditIntel = document.getElementById('btn-edit-intel');
        DOM.btnSaveIntel = document.getElementById('btn-save-intel');
        DOM.btnCancelIntel = document.getElementById('btn-cancel-intel');
        DOM.intelActionsView = document.getElementById('intel-actions-view');
        DOM.intelActionsEdit = document.getElementById('intel-actions-edit');
        DOM.inputIntelStr = document.getElementById('input-intel-str');
        DOM.inputIntelDef = document.getElementById('input-intel-def');
        DOM.inputIntelSpd = document.getElementById('input-intel-spd');
        DOM.inputIntelDex = document.getElementById('input-intel-dex');
        DOM.intelTotalAuto = document.getElementById('intel-total-auto');
        DOM.detailHistoryList = document.getElementById('detail-history-list');

        // Action buttons
        DOM.btnAttack = document.getElementById('btn-attack');
        DOM.btnProfile = document.getElementById('btn-profile');
        DOM.btnRefreshTarget = document.getElementById('btn-refresh-target');
        DOM.btnRemoveTarget = document.getElementById('btn-remove-target');

        // Status bar
        DOM.statusConnection = document.getElementById('status-connection');
        DOM.statusConnectionText = document.getElementById('status-connection-text');
        DOM.statusConnectionDetail = document.getElementById('status-connection-detail');
        DOM.statusSignalBadges = document.getElementById('status-signal-badges');
        DOM.statusNextRefresh = document.getElementById('status-next-refresh');
        DOM.statusNextRefreshText = document.getElementById('status-next-refresh-text');
        DOM.statusRefreshMode = document.getElementById('status-refresh-mode-chip');
        DOM.statusRefresh = document.getElementById('status-refresh');
        DOM.refreshText = document.getElementById('refresh-text');
        DOM.progressFill = document.getElementById('progress-fill');
        DOM.btnCancelRefresh = document.getElementById('btn-cancel-refresh');
        DOM.attackableText = document.getElementById('attackable-text');
        DOM.targetsText = document.getElementById('targets-text');
        DOM.rateText = document.getElementById('rate-text');
        DOM.ratePopoverAvailable = document.getElementById('rate-popover-available');
        DOM.ratePopoverRecent = document.getElementById('rate-popover-recent');
        DOM.ratePopoverUtilization = document.getElementById('rate-popover-utilization');
        DOM.ratePopoverPenalty = document.getElementById('rate-popover-penalty');
        DOM.ratePopoverSuccess = document.getElementById('rate-popover-success');
        DOM.ratePopoverSuccessPercent = document.getElementById('rate-popover-success-percent');
        DOM.ratePopoverSuccessBar = document.getElementById('rate-popover-success-bar');
        DOM.ratePopoverFailed = document.getElementById('rate-popover-failed');
        DOM.ratePopoverFailedPercent = document.getElementById('rate-popover-failed-percent');
        DOM.ratePopoverFailedBar = document.getElementById('rate-popover-failed-bar');
        DOM.ratePopoverWindow = document.getElementById('rate-popover-window');
        DOM.ratePopoverNextToken = document.getElementById('rate-popover-next-token');
        DOM.rateChipState = document.getElementById('rate-chip-state');
        DOM.ratePopoverPenaltyCard = document.getElementById('rate-popover-penalty-card');
        DOM.rateMeterFill = document.getElementById('rate-meter-fill');
        DOM.rateMeterAvailable = document.getElementById('rate-meter-available');
        DOM.rateMeterMax = document.getElementById('rate-meter-max');

        // Command palette
        DOM.commandPaletteOverlay = document.getElementById('command-palette-overlay');
        DOM.commandPaletteInput = document.getElementById('command-palette-input');
        DOM.commandPaletteList = document.getElementById('command-palette-list');
        DOM.commandPaletteEmpty = document.getElementById('command-palette-empty');

        // Onboarding
        DOM.onboardingOverlay = document.getElementById('onboarding-overlay');
        DOM.onboardingTabs = document.querySelectorAll('[data-onboarding-step].onboarding-tab');
        DOM.onboardingSteps = document.querySelectorAll('.onboarding-step');
        DOM.onboardingProgressBar = document.getElementById('onboarding-progress-bar');
        DOM.onboardingPrev = document.getElementById('onboarding-prev');
        DOM.onboardingNext = document.getElementById('onboarding-next');
        DOM.onboardingSkip = document.getElementById('onboarding-skip');
        DOM.onboardingClose = document.getElementById('onboarding-close');
        DOM.onboardingHideToggle = document.getElementById('onboarding-hide-toggle');
        DOM.onboardingConnectionStatus = document.getElementById('onboarding-connection-status');
        DOM.onboardingLatency = document.getElementById('onboarding-latency');
        DOM.onboardingRate = document.getElementById('onboarding-rate');
        DOM.onboardingTargetCount = document.getElementById('onboarding-target-count');
        DOM.onboardingAttackableCount = document.getElementById('onboarding-attackable-count');
        DOM.onboardingGroupCount = document.getElementById('onboarding-group-count');
        DOM.onboardingNotifyStatus = document.getElementById('onboarding-notify-status');
        DOM.onboardingSmartTitle = document.getElementById('onboarding-smart-title');
        DOM.onboardingSmartCopy = document.getElementById('onboarding-smart-copy');
        DOM.onboardingStatusKey = document.getElementById('onboarding-status-key');
        DOM.onboardingStatusTargets = document.getElementById('onboarding-status-targets');
        DOM.onboardingStatusAlerts = document.getElementById('onboarding-status-alerts');

        // Modals
        DOM.modalAddTarget = document.getElementById('modal-add-target');
        DOM.modalBulkAdd = document.getElementById('modal-bulk-add');
        DOM.modalAddGroup = document.getElementById('modal-add-group');
        DOM.modalEditGroup = document.getElementById('modal-edit-group');
        DOM.modalConfirm = document.getElementById('modal-confirm');
        DOM.modalAbout = document.getElementById('modal-about');
        DOM.aboutVersion = document.getElementById('about-version');
        DOM.aboutDataPath = document.getElementById('about-data-path');
        DOM.aboutTargetsCount = document.getElementById('about-targets-count');
        DOM.aboutAttackableCount = document.getElementById('about-attackable-count');
        DOM.aboutRefreshInterval = document.getElementById('about-refresh-interval');
        DOM.aboutApiStatus = document.getElementById('about-api-status');
        DOM.aboutApiIcon = document.getElementById('about-api-icon');
        DOM.aboutLastRefresh = document.getElementById('about-last-refresh');
        DOM.aboutOpenLog = document.getElementById('about-open-log');
        DOM.aboutProfileLink = document.getElementById('about-profile-link');
        DOM.attackPreventionNotifyBtn = document.getElementById('attack-prevention-notify');

        // Connection Dialog
        DOM.connectionDialog = document.getElementById('connection-dialog');
        DOM.closeConnectionDialog = document.getElementById('close-connection-dialog');
        DOM.connTornApi = document.getElementById('conn-torn-api');
        DOM.connInternet = document.getElementById('conn-internet');
        DOM.connTornStats = document.getElementById('conn-tornstats');
        DOM.apiRate = document.getElementById('api-rate');
        DOM.apiLatency = document.getElementById('api-latency');
        DOM.netStatus = document.getElementById('net-status');
        DOM.statsLastFetch = document.getElementById('stats-last-fetch');

        // Context menu
        DOM.contextMenu = document.getElementById('context-menu');
        DOM.contextMenuFavorite = DOM.contextMenu?.querySelector('[data-action="favorite"]');
        DOM.contextMenuWatch = DOM.contextMenu?.querySelector('[data-action="toggle-watch"]');
        DOM.groupContextMenu = document.getElementById('group-context-menu');
        DOM.groupSubmenu = document.getElementById('group-submenu');

        // Toast
        DOM.toastContainer = document.getElementById('toast-container');

        // History
        DOM.historyList = document.getElementById('history-list');
        DOM.historySearch = document.getElementById('history-search');
        DOM.historyRangeButtons = document.querySelectorAll('[data-history-range]');
        DOM.historyStatTotal = document.getElementById('history-stat-total');
        DOM.historyStatUnique = document.getElementById('history-stat-unique');
        DOM.historyStatStreak = document.getElementById('history-stat-streak');
        DOM.historyStatTop = document.getElementById('history-stat-top');

        // Bounties
        DOM.bountyAlertBadge = document.getElementById('bounty-alert-badge');
        DOM.bountyAlertBanner = document.getElementById('bounty-alert-banner');
        DOM.bountyAlertDismiss = document.getElementById('bounty-alert-dismiss');
        DOM.bountyStats = {
            collected: document.getElementById('stat-bounties-collected'),
            placed: document.getElementById('stat-bounties-placed'),
            received: document.getElementById('stat-bounties-received'),
            reward: document.getElementById('stat-bounty-reward'),
            spent: document.getElementById('stat-bounty-spent'),
            valueOnYou: document.getElementById('stat-bounty-value-received')
        };
        DOM.bountyStatsUpdated = document.getElementById('bounty-stats-updated');
        DOM.bountyTargetInput = document.getElementById('bounty-target-id');
        DOM.bountyRewardInput = document.getElementById('bounty-reward');
        DOM.bountyAddButton = document.getElementById('btn-add-bounty');
        DOM.bountyEmptyAddButton = document.getElementById('btn-empty-add-bounty');
        DOM.bountyEmptyRewardButton = document.getElementById('btn-empty-focus-reward');
        DOM.bountyList = document.getElementById('bounty-list');
        DOM.bountyEmptyState = document.getElementById('bounty-empty-state');
        DOM.bountyWatchlist = document.getElementById('bounty-watchlist');
        DOM.btnRefreshBountyStats = document.getElementById('btn-refresh-bounty-stats');

        // Loading
        DOM.loadingOverlay = document.getElementById('loading-overlay');

        // Settings
        DOM.settingPlayerLevel = document.getElementById('setting-player-level');
        DOM.settingBackupRetention = document.getElementById('setting-backup-retention');
        DOM.settingBackupPreop = document.getElementById('setting-backup-preop');
        DOM.settingCloudBackup = document.getElementById('setting-cloud-backup');
        DOM.settingCloudProvider = document.getElementById('setting-cloud-provider');
        DOM.cloudProviderDropdown = document.getElementById('cloud-provider-dropdown');
        DOM.cloudProviderToggle = document.getElementById('cloud-provider-toggle');
        DOM.cloudProviderLabel = document.getElementById('cloud-provider-label');
        DOM.cloudProviderList = document.getElementById('cloud-provider-list');
        DOM.cloudProviderIcon = document.getElementById('cloud-provider-icon');
        DOM.btnCloudPath = document.getElementById('btn-cloud-path');
        DOM.btnCloudDetect = document.getElementById('btn-cloud-detect');
        DOM.cloudBackupPath = document.getElementById('cloud-backup-path');
        DOM.cloudProviderHint = document.getElementById('cloud-provider-hint');
    }

    // ========================================================================
    // MENUBAR UI
    // ========================================================================

    function buildMenubar() {
        if (!DOM.menubar) return;

        DOM.menubar.innerHTML = '';
        menubarButtons = [];

        MENUBAR_MENUS.forEach((menu, index) => {
            const btn = document.createElement('button');
            btn.className = 'menubar-item';
            btn.type = 'button';
            btn.dataset.menuId = menu.id;
            btn.textContent = menu.label;
            btn.setAttribute('aria-haspopup', 'true');
            btn.setAttribute('aria-expanded', 'false');

            btn.addEventListener('click', (event) => {
                event.stopPropagation();
                if (menubarState.activeMenuId === menu.id) {
                    closeMenubar();
                } else {
                    openMenubar(menu.id, index, false);
                }
            });

            btn.addEventListener('mouseenter', () => {
                if (menubarState.activeMenuId && menubarState.activeMenuId !== menu.id) {
                    openMenubar(menu.id, index, menubarState.openedWithKeyboard);
                }
            });

            menubarButtons.push(btn);
            DOM.menubar.appendChild(btn);
        });
    }

    function openMenubar(menuId, menuIndex = 0, openedWithKeyboard = false) {
        const menu = MENUBAR_MENUS.find(m => m.id === menuId);
        if (!menu || !DOM.menubarFlyout) return;

        menubarState.activeMenuId = menu.id;
        menubarState.activeMenuIndex = menuIndex;
        menubarState.openedWithKeyboard = openedWithKeyboard;

        renderMenubarMenu(menu);
        setMenubarButtonState();
    }

    function renderMenubarMenu(menu) {
        if (!DOM.menubarFlyout) return;

        DOM.menubarFlyout.innerHTML = '';
        menubarEntries = [];

        const list = document.createElement('div');
        list.className = 'menubar-menu';

        menu.items.forEach((item, index) => {
            if (item.type === 'separator') {
                const sep = document.createElement('div');
                sep.className = 'menubar-separator';
                menubarEntries.push({ item, element: null, enabled: false });
                list.appendChild(sep);
                return;
            }

            const enabled = typeof item.enabled === 'function' ? !!item.enabled() : true;
            const checked = item.type === 'checkbox' && typeof item.checked === 'function' ? !!item.checked() : false;

            const row = document.createElement('button');
            row.type = 'button';
            row.className = `menubar-menu-item${enabled ? '' : ' disabled'}`;
            row.dataset.index = index;
            row.tabIndex = -1;
            row.setAttribute('role', item.type === 'checkbox' ? 'menuitemcheckbox' : 'menuitem');
            row.setAttribute('aria-disabled', enabled ? 'false' : 'true');
            if (item.type === 'checkbox') {
                row.setAttribute('aria-checked', checked ? 'true' : 'false');
            }

            const check = document.createElement('span');
            check.className = 'menubar-menu-check';
            check.textContent = checked ? '✓' : '';

            const icon = createMenubarIcon(item.icon);

            const label = document.createElement('span');
            label.className = 'menubar-menu-label';
            label.textContent = item.label;

            const shortcut = document.createElement('span');
            shortcut.className = 'menubar-menu-shortcut';
            shortcut.textContent = item.shortcut || '';

            if (item.type !== 'checkbox') {
                row.classList.add('no-checkbox');
            }

            row.append(check, icon, label, shortcut);

            if (enabled) {
                row.addEventListener('click', () => handleMenubarItemSelect(index));
                row.addEventListener('mouseenter', () => setActiveMenubarItem(index, false));
            }

            menubarEntries.push({ item, element: row, enabled });
            list.appendChild(row);
        });

        DOM.menubarFlyout.appendChild(list);
        DOM.menubarFlyout.style.visibility = 'hidden';
        DOM.menubarFlyout.classList.add('visible');

        const firstEnabled = getFirstEnabledMenubarIndex();
        setActiveMenubarItem(firstEnabled, menubarState.openedWithKeyboard);

        positionMenubar();
        DOM.menubarFlyout.style.visibility = 'visible';
        DOM.menubarFlyout.setAttribute('aria-hidden', 'false');
    }

    function getFirstEnabledMenubarIndex(startIndex = 0) {
        if (!menubarEntries.length) return -1;
        const total = menubarEntries.length;
        for (let i = 0; i < total; i++) {
            const idx = (startIndex + i) % total;
            if (menubarEntries[idx]?.enabled) {
                return idx;
            }
        }
        return -1;
    }

    function getLastEnabledMenubarIndex() {
        for (let i = menubarEntries.length - 1; i >= 0; i--) {
            if (menubarEntries[i]?.enabled) {
                return i;
            }
        }
        return -1;
    }

    function setActiveMenubarItem(index, focusItem = false) {
        if (index === null || index === undefined || index < 0) {
            menubarState.activeItemIndex = -1;
            return;
        }

        menubarEntries.forEach((entry, idx) => {
            if (entry.element) {
                entry.element.classList.toggle('active', idx === index);
            }
        });

        menubarState.activeItemIndex = index;
        const entry = menubarEntries[index];
        if (focusItem && entry?.element) {
            entry.element.focus({ preventScroll: true });
        }
    }

    async function handleMenubarItemSelect(index) {
        const entry = menubarEntries[index];
        if (!entry || !entry.enabled || !entry.item || entry.item.type === 'separator') return;

        try {
            await Promise.resolve(entry.item.action?.());
        } catch (error) {
            console.error('Menu action failed', error);
            showToast('Action failed: ' + (error.message || 'Unknown error'), 'error');
        }

        if (!entry.item.keepOpen) {
            closeMenubar();
        } else {
            const currentMenu = getCurrentMenu();
            if (currentMenu) {
                renderMenubarMenu(currentMenu);
            }
        }
    }

    function positionMenubar() {
        if (!DOM.menubarFlyout || !menubarButtons.length) return;

        const trigger = menubarButtons[menubarState.activeMenuIndex] || menubarButtons[0];
        if (!trigger) return;

        const rect = trigger.getBoundingClientRect();
        const flyoutRect = DOM.menubarFlyout.getBoundingClientRect();
        const top = rect.bottom + 2;
        let left = rect.left;

        const maxLeft = Math.max(6, window.innerWidth - flyoutRect.width - 6);
        left = Math.min(left, maxLeft);
        if (left < 6) {
            left = 6;
        }

        DOM.menubarFlyout.style.top = `${top}px`;
        DOM.menubarFlyout.style.left = `${left}px`;
    }

    function setMenubarButtonState() {
        menubarButtons.forEach(btn => {
            const active = menubarState.activeMenuId && btn.dataset.menuId === menubarState.activeMenuId;
            btn.classList.toggle('active', !!active);
            btn.setAttribute('aria-expanded', active ? 'true' : 'false');
            if (active && menubarState.openedWithKeyboard) {
                btn.focus({ preventScroll: true });
            }
        });
    }

    function moveMenubarFocus(delta) {
        if (!menubarButtons.length) return;
        let nextIndex = menubarState.activeMenuIndex;
        if (nextIndex === -1) {
            nextIndex = 0;
        } else {
            nextIndex = (nextIndex + delta + menubarButtons.length) % menubarButtons.length;
        }
        const nextId = menubarButtons[nextIndex]?.dataset.menuId;
        if (nextId) {
            openMenubar(nextId, nextIndex, true);
        }
    }

    function moveMenubarItemFocus(delta) {
        if (!menubarEntries.length) return;
        const total = menubarEntries.length;
        let idx = menubarState.activeItemIndex;
        for (let i = 0; i < total; i++) {
            idx = (idx + delta + total) % total;
            if (menubarEntries[idx]?.enabled) {
                setActiveMenubarItem(idx, true);
                break;
            }
        }
    }

    function closeMenubar() {
        menubarState.activeMenuId = null;
        menubarState.activeMenuIndex = -1;
        menubarState.activeItemIndex = -1;
        menubarState.openedWithKeyboard = false;
        menubarEntries = [];

        if (DOM.menubarFlyout) {
            DOM.menubarFlyout.classList.remove('visible');
            DOM.menubarFlyout.innerHTML = '';
            DOM.menubarFlyout.setAttribute('aria-hidden', 'true');
        }

        menubarButtons.forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-expanded', 'false');
        });
    }

    function handleMenubarOutsideClick(event) {
        if (!menubarState.activeMenuId) return;
        if (event.target.closest('#titlebar') || event.target.closest('#titlebar-menubar-flyout')) return;
        closeMenubar();
    }

    function refreshMenubarMenuState() {
        if (!menubarState.activeMenuId) return;
        const currentMenu = getCurrentMenu();
        if (currentMenu) {
            renderMenubarMenu(currentMenu);
        }
    }

    function getCurrentMenu() {
        return MENUBAR_MENUS.find(m => m.id === menubarState.activeMenuId) || null;
    }

    function createMenubarIcon(iconName) {
        const icon = document.createElement('span');
        icon.className = 'menubar-menu-icon';
        const inlineIcon = INLINE_MENU_ICONS[iconName];

        if (inlineIcon) {
            icon.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${inlineIcon}</svg>`;
        } else if (iconName) {
            icon.classList.add('uses-asset');
            icon.style.backgroundImage = `url("assets/${iconName}")`;
        } else {
            icon.classList.add('placeholder');
        }

        return icon;
    }

    function handleMenubarKey(e) {
        if (document.querySelector('.modal-overlay.visible')) {
            return false;
        }

        if (e.key === 'Alt' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            if (menubarState.activeMenuId) {
                closeMenubar();
            } else if (MENUBAR_MENUS.length > 0) {
                openMenubar(MENUBAR_MENUS[0].id, 0, true);
            }
            return true;
        }

        if (!menubarState.activeMenuId) {
            return false;
        }

        if (e.ctrlKey || e.metaKey) {
            closeMenubar();
            return false;
        }

        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                moveMenubarFocus(-1);
                return true;
            case 'ArrowRight':
                e.preventDefault();
                moveMenubarFocus(1);
                return true;
            case 'ArrowDown':
                e.preventDefault();
                if (menubarEntries.length === 0) {
                    const currentMenu = getCurrentMenu();
                    if (currentMenu) {
                        renderMenubarMenu(currentMenu);
                    }
                } else {
                    moveMenubarItemFocus(1);
                }
                return true;
            case 'ArrowUp':
                e.preventDefault();
                moveMenubarItemFocus(-1);
                return true;
            case 'Home':
                e.preventDefault();
                setActiveMenubarItem(getFirstEnabledMenubarIndex(0), true);
                return true;
            case 'End':
                e.preventDefault();
                setActiveMenubarItem(getLastEnabledMenubarIndex(), true);
                return true;
            case 'Enter':
            case ' ':
                e.preventDefault();
                handleMenubarItemSelect(menubarState.activeItemIndex);
                return true;
            case 'Escape':
                e.preventDefault();
                closeMenubar();
                return true;
            default:
                return false;
        }
    }

    // ========================================================================
    // SHARED ACTION HELPERS
    // ========================================================================

    function hasSelectedTarget() {
        return appInitialized && !!getSelectedTargetSafe();
    }

    function getSelectedTargetSafe() {
        if (!appInitialized || !window.appState?.getSelectedTarget) return null;
        return window.appState.getSelectedTarget();
    }

    function collapseAllSections() {
        document.querySelectorAll('.sidebar-section').forEach(section => {
            section.classList.add('collapsed');
        });
        saveSidebarCollapsedSections();
    }

    function getTornProfileUrl(userId) {
        const id = normalizeTargetUserId(userId);
        return id ? `https://www.torn.com/profiles.php?XID=${id}` : '';
    }

    async function writeClipboard(text, successMessage = 'Copied to clipboard') {
        if (!text) {
            showToast('Nothing to copy', 'info');
            return false;
        }

        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.setAttribute('readonly', '');
                textarea.style.position = 'fixed';
                textarea.style.left = '-9999px';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                textarea.remove();
            }
            showToast(successMessage, 'success');
            return true;
        } catch (error) {
            console.error('Clipboard write failed', error);
            showToast('Could not copy to clipboard', 'error');
            return false;
        }
    }

    function getTargetsForIds(ids = []) {
        return Array.from(new Set(ids.map(id => parseInt(id, 10)).filter(Number.isFinite)))
            .map(id => window.appState?.getTarget?.(id))
            .filter(Boolean);
    }

    function getSelectedTargetIds() {
        return window.appState?.getSelectedIds ? window.appState.getSelectedIds() : [];
    }

    function getVisibleTargetIds() {
        return window.appState?.getFilteredTargets
            ? window.appState.getFilteredTargets().map(t => t.userId)
            : [];
    }

    function getCopyTargets(contextId = null) {
        const ids = contextId === null || contextId === undefined
            ? getSelectedTargetIds()
            : getActionTargetIds(contextId);
        return getTargetsForIds(ids);
    }

    async function copyTargetsToClipboard(targets, mode = 'ids') {
        const selectedTargets = Array.isArray(targets) ? targets.filter(Boolean) : [];
        if (!selectedTargets.length) {
            showToast('Select targets first', 'info');
            return false;
        }

        const lines = selectedTargets.map(target => {
            if (mode === 'profiles') return getTornProfileUrl(target.userId);
            if (mode === 'attacks') return getTornAttackUrl(target.userId);
            return String(target.userId);
        }).filter(Boolean);

        const label = mode === 'profiles'
            ? 'profile link'
            : mode === 'attacks'
                ? 'attack link'
                : 'target ID';
        const plural = lines.length === 1 ? label : `${label}s`;
        return writeClipboard(lines.join('\n'), `Copied ${lines.length} ${plural}`);
    }

    function updateTargetsCountDisplay(visibleCount = null, selectedIds = null) {
        if (!DOM.targetsCount || !window.appState?.getFilteredTargets) return;
        const count = Number.isFinite(visibleCount)
            ? visibleCount
            : window.appState.getFilteredTargets().length;
        const selectedCount = (selectedIds || getSelectedTargetIds()).length;

        DOM.targetsCount.textContent = selectedCount > 0
            ? `(${count}, ${selectedCount} sel)`
            : `(${count})`;
        DOM.targetsCount.title = selectedCount > 0
            ? `${count} visible, ${selectedCount} selected`
            : `${count} visible targets`;
    }

    function syncFilterControls() {
        if (!window.appState) return;
        const activeFilter = window.appState.activeFilter || 'all';
        DOM.filterItems?.forEach(item => {
            item.classList.toggle('active', item.dataset.filter === activeFilter);
        });
        if (DOM.searchInput) {
            DOM.searchInput.value = window.appState.searchQuery || '';
        }
        if (DOM.searchClear) {
            DOM.searchClear.style.display = window.appState.searchQuery ? 'flex' : 'none';
        }
        renderGroups();
    }

    function syncSortButtons() {
        if (!DOM.sortBtns || !window.appState) return;
        const activeSort = window.appState.sortBy || 'name';
        const direction = window.appState.sortDirection || 'asc';
        DOM.sortBtns.forEach(btn => {
            const isActive = btn.dataset.sort === activeSort;
            btn.classList.toggle('active', isActive);
            if (isActive) {
                btn.dataset.direction = direction;
                const label = btn.getAttribute('data-sort-label') || btn.title.replace(/\s*\((asc|desc)\)$/i, '');
                btn.setAttribute('data-sort-label', label);
                btn.title = `${label} (${direction})`;
            } else {
                btn.removeAttribute('data-direction');
                const label = btn.getAttribute('data-sort-label');
                if (label) btn.title = label;
            }
        });
    }

    function setTargetSearchQuery(query, options = {}) {
        const value = String(query || '');
        const syncInput = options.syncInput !== false;
        if (syncInput && DOM.searchInput) {
            DOM.searchInput.value = value;
        }
        if (DOM.searchClear) {
            DOM.searchClear.style.display = value ? 'flex' : 'none';
        }
        window.appState?.setSearchQuery?.(value);
    }

    function focusTargetSearch(selectText = true) {
        if (window.appState?.currentView !== 'targets') {
            switchView('targets');
        }
        DOM.searchInput?.focus();
        if (selectText) {
            DOM.searchInput?.select();
        }
    }

    function clearTargetSearch() {
        setTargetSearchQuery('');
        DOM.searchInput?.focus();
    }

    function clearTargetFilters(options = {}) {
        const keepSearch = !!options.keepSearch;
        window.appState?.setActiveGroup?.('all');
        window.appState?.setActiveFilter?.('all');
        if (!keepSearch) {
            setTargetSearchQuery('');
        }
        syncFilterControls();
        renderTargetList(true);
        showToast(keepSearch ? 'Filters reset' : 'Search and filters reset', 'info');
    }

    function getSidebarSectionKey(section) {
        const header = section?.querySelector('.section-header');
        return header?.id || header?.textContent?.trim() || '';
    }

    function getStoredSidebarCollapsedSections() {
        try {
            return JSON.parse(localStorage.getItem(SIDEBAR_COLLAPSE_STORAGE_KEY) || '[]');
        } catch {
            return [];
        }
    }

    function saveSidebarCollapsedSections() {
        const collapsed = Array.from(document.querySelectorAll('.sidebar-section.collapsed'))
            .map(getSidebarSectionKey)
            .filter(Boolean);
        localStorage.setItem(SIDEBAR_COLLAPSE_STORAGE_KEY, JSON.stringify(collapsed));
    }

    function restoreSidebarSectionState(section) {
        const key = getSidebarSectionKey(section);
        if (!key) return;
        const collapsed = new Set(getStoredSidebarCollapsedSections());
        section.classList.toggle('collapsed', collapsed.has(key));
    }

    async function handleExportTargets() {
        if (!appInitialized) {
            showToast('Please wait for the app to finish loading', 'info');
            return;
        }
        try {
            const result = await window.appState.exportTargets();
            if (result.success) {
                showToast('Targets exported successfully', 'success');
            } else if (!result.canceled) {
                showToast('Export failed: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Export failed', error);
            showToast('Export failed: ' + (error.message || 'Unknown error'), 'error');
        }
    }

    async function handleImportTargets() {
        if (!appInitialized) {
            showToast('Please wait for the app to finish loading', 'info');
            return;
        }
        try {
            const result = await window.appState.importTargets();
            if (result.success) {
                showToast(`Imported ${result.imported} targets (${result.skipped} skipped)`, 'success');
            } else if (!result.canceled) {
                showToast('Import failed: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Import failed', error);
            showToast('Import failed: ' + (error.message || 'Unknown error'), 'error');
        }
    }

    async function handleCreateBackup() {
        if (!appInitialized) {
            showToast('Please wait for the app to finish loading', 'info');
            return;
        }
        try {
            const result = await window.appState.createBackup();
            if (result.success) {
                showToast('Backup created successfully', 'success');
            } else {
                showToast('Backup failed: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Backup failed', error);
            showToast('Backup failed: ' + (error.message || 'Unknown error'), 'error');
        }
    }

    async function handleChooseCloudPath() {
        if (!window.electronAPI?.chooseDirectory) {
            showToast('Folder picker unavailable', 'error');
            return;
        }
        const result = await window.electronAPI.chooseDirectory();
        if (!result || result.canceled || !result.path) {
            return;
        }
        if (DOM.cloudBackupPath) {
            DOM.cloudBackupPath.textContent = result.path;
        }
        if (DOM.settingCloudBackup) {
            DOM.settingCloudBackup.checked = true;
        }
        syncCloudBackupControls();
        await window.appState.updateSettings({
            cloudBackupPath: result.path,
            cloudBackupEnabled: true
        });
        updateCloudProviderHint(DOM.settingCloudProvider?.value || 'custom-folder', 'Using your folder');
        showToast('Cloud backup folder set', 'success');
    }

    async function toggleCompactModeSetting() {
        try {
            const nextValue = !window.appState.settings.compactMode;
            await window.appState.updateSettings({ compactMode: nextValue });
        } catch (error) {
            console.error('Failed to toggle compact mode', error);
            showToast('Unable to update compact mode', 'error');
        }
    }

    async function toggleTraySetting() {
        try {
            const nextValue = !window.appState.settings.minimizeToTray;
            await window.appState.updateSettings({ minimizeToTray: nextValue });
        } catch (error) {
            console.error('Failed to toggle tray setting', error);
            showToast('Unable to update tray setting', 'error');
        }
    }

    async function openDataFolder() {
        try {
            const info = await ensureAppInfo();
            if (!info?.path) {
                showToast('Data folder not available yet', 'error');
                return;
            }

            if (!window.electronAPI.openAppPath) {
                throw new Error('Missing openAppPath bridge');
            }

            const result = await window.electronAPI.openAppPath('data');
            if (result?.success === false) {
                throw new Error(result.error || 'Failed to open data folder');
            }
        } catch (error) {
            console.error('Failed to open data folder', error);
            showToast('Could not open data folder', 'error');
        }
    }

    async function openLogsFolder() {
        try {
            if (!window.electronAPI.openAppPath) {
                throw new Error('Missing openAppPath bridge');
            }

            const result = await window.electronAPI.openAppPath('logs');
            if (result?.success === false) {
                throw new Error(result.error || 'Failed to open logs folder');
            }
        } catch (error) {
            console.error('Failed to open logs folder', error);
            showToast('Could not open logs folder', 'error');
        }
    }

    function bindEvents() {
        buildMenubar();
        document.addEventListener('mousedown', handleMenubarOutsideClick);
        addWindowCleanupListener('blur', closeMenubar);
        addWindowCleanupListener('resize', closeMenubar);

        // Window controls
        DOM.btnMinimize?.addEventListener('click', () => window.electronAPI.minimizeWindow());
        DOM.btnMaximize?.addEventListener('click', () => window.electronAPI.maximizeWindow());
        DOM.btnClose?.addEventListener('click', () => window.electronAPI.closeWindow());

        // Activity bar navigation
        DOM.activityItems.forEach(item => {
            item.addEventListener('click', () => {
                const view = item.dataset.view;
                switchView(view);
            });
        });

        // Connection status dialog
        DOM.connectionStatus?.addEventListener('click', () => {
            refreshConnectionIndicators();
            openConnectionDialog();
        });

        DOM.closeConnectionDialog?.addEventListener('click', () => {
            closeConnectionDialog();
        });

        DOM.connectionDialog?.addEventListener('click', (e) => {
            if (e.target === DOM.connectionDialog) {
                closeConnectionDialog();
            }
        });

        // Tray-driven openings
        registerCleanup(window.electronAPI.onTriggerRefresh?.(() => {
            if (!window.appState.isRefreshing) {
                window.appState.refreshAllTargets();
            }
        }));
        registerCleanup(window.electronAPI.onOpenAddTarget?.(() => openModal('modal-add-target')));
        registerCleanup(window.electronAPI.onOpenSettings?.(() => switchView('settings')));
        registerCleanup(window.electronAPI.onMaximizeChange?.((isMaximized) => updateMaximizeButtonState(isMaximized)));
        if (window.electronAPI.isMaximized) {
            window.electronAPI.isMaximized()
                .then((isMaximized) => updateMaximizeButtonState(isMaximized))
                .catch(() => {});
        }

        // Refresh all
        DOM.refreshAllBtn?.addEventListener('click', () => {
            if (!window.appState.isRefreshing) {
                window.appState.refreshAllTargets();
            }
        });
        DOM.btnCancelRefresh?.addEventListener('click', () => {
            window.appState.cancelRefresh();
        });

        // Search
        DOM.searchInput?.addEventListener('input', (e) => {
            setTargetSearchQuery(e.target.value, { syncInput: false });
        });

        DOM.searchInput?.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape') return;
            if (DOM.searchInput.value) {
                e.preventDefault();
                clearTargetSearch();
            } else {
                DOM.searchInput.blur();
            }
        });

        DOM.searchClear?.addEventListener('click', () => {
            clearTargetSearch();
        });

        // Filters
        DOM.filterItems.forEach(item => {
            item.addEventListener('click', () => {
                const filter = item.dataset.filter;
                window.appState.setActiveFilter(filter);
                syncFilterControls();
            });
        });

        // Target list interactions
        DOM.targetList?.addEventListener('pointerup', handleTargetListPointerUp);
        DOM.targetList?.addEventListener('dblclick', handleTargetListDoubleClick);
        if (DOM.targetList) {
            DOM.targetList.addEventListener('click', handleTargetListClickDelegated);
            DOM.targetList.addEventListener('contextmenu', handleTargetListContextMenuDelegated);
        }

        // Sort buttons
        DOM.sortBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const sortBy = btn.dataset.sort;
                window.appState.setSort(sortBy);
                syncSortButtons();
            });
        });

        // Attack tracker controls
        DOM.attackTrackerToggle?.addEventListener('click', () => {
            const tracker = window.appState.attackTracker || {};
            const nextState = !tracker.enabled;
            const snapshot = window.appState.setAttackTrackerEnabled(nextState);
            showToast(snapshot.enabled ? 'Attack tracker enabled' : 'Attack tracker disabled', snapshot.enabled ? 'success' : 'info');
        });

        DOM.attackTrackerReset?.addEventListener('click', () => {
            window.appState.resetAttackTracker();
            showToast('Attack tracker cleared', 'success');
        });

        // Add buttons
        DOM.addTargetBtn?.addEventListener('click', () => openModal('modal-add-target'));
        DOM.bulkAddBtn?.addEventListener('click', () => openModal('modal-bulk-add'));
        DOM.addGroupBtn?.addEventListener('click', () => openModal('modal-add-group'));

        // Help center quick actions
        document.getElementById('help-cta-onboarding')?.addEventListener('click', () => showOnboarding(true));
        document.getElementById('help-cta-settings')?.addEventListener('click', () => switchView('settings'));
        document.getElementById('help-cta-connection')?.addEventListener('click', () => {
            refreshConnectionIndicators();
            openConnectionDialog();
        });
        document.getElementById('help-cta-backup')?.addEventListener('click', handleCreateBackup);
        document.getElementById('help-cta-logs')?.addEventListener('click', openLogsFolder);
        document.getElementById('help-cta-data')?.addEventListener('click', openDataFolder);

        document.getElementById('btn-add-first')?.addEventListener('click', () => openModal('modal-add-target'));
        document.getElementById('btn-bulk-first')?.addEventListener('click', () => openModal('modal-bulk-add'));

        // Collapse all button
        document.getElementById('collapse-all-btn')?.addEventListener('click', collapseAllSections);

        // Target detail actions
        DOM.btnAttack?.addEventListener('click', handleAttack);
        DOM.btnProfile?.addEventListener('click', handleProfile);
        DOM.btnRefreshTarget?.addEventListener('click', handleRefreshTarget);
        DOM.btnRemoveTarget?.addEventListener('click', handleRemoveTarget);
        DOM.detailFavoriteBtn?.addEventListener('click', handleToggleFavorite);

        // Detail inputs
        DOM.detailCustomName?.addEventListener('change', handleCustomNameChange);
        DOM.detailNotes?.addEventListener('change', handleNotesChange);
        DOM.detailGroup?.addEventListener('change', handleGroupChange);
        DOM.detailMonitorOk?.addEventListener('change', handleMonitorToggle);
        DOM.detailWatchBtn?.addEventListener('click', handleWatchButtonToggle);
        DOM.btnRefreshIntel?.addEventListener('click', () => refreshSelectedIntel(true));
        DOM.btnEditIntel?.addEventListener('click', enterIntelEditMode);
        DOM.btnSaveIntel?.addEventListener('click', saveIntelEdits);
        DOM.btnCancelIntel?.addEventListener('click', cancelIntelEdits);
        // Real-time total calculation during editing
        [DOM.inputIntelStr, DOM.inputIntelDef, DOM.inputIntelSpd, DOM.inputIntelDex].forEach(input => {
            input?.addEventListener('input', updateIntelTotalPreview);
            // Keyboard shortcuts in edit mode
            input?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    saveIntelEdits();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    cancelIntelEdits();
                }
            });
        });
        DOM.detailNotesTemplates?.forEach(btn => {
            btn.addEventListener('click', () => insertNotesTemplate(btn.dataset.notesTemplate || ''));
        });

        // Cancel refresh
        DOM.btnCancelRefresh?.addEventListener('click', () => {
            window.appState.cancelRefresh();
        });

        // Status bar attackable click
        document.getElementById('status-attackable')?.addEventListener('click', () => {
            window.appState.setActiveFilter('okay');
            DOM.filterItems.forEach(f => {
                f.classList.toggle('active', f.dataset.filter === 'okay');
            });
        });

        // Modal close buttons
        document.querySelectorAll('[data-close-modal]').forEach(btn => {
            btn.addEventListener('click', () => {
                closeAllModals();
            });
        });

        // Command palette
        DOM.commandPaletteOverlay?.addEventListener('click', (e) => {
            if (e.target === DOM.commandPaletteOverlay) {
                closeCommandPalette();
            }
        });
        DOM.commandPaletteList?.addEventListener('click', (e) => {
            const item = e.target.closest('.command-item');
            if (!item) return;
            commandPaletteState.highlightIndex = parseInt(item.dataset.index, 10) || 0;
            executeHighlightedCommand();
        });
        DOM.commandPaletteInput?.addEventListener('input', (e) => {
            commandPaletteState.highlightIndex = 0;
            renderCommandPalette(e.target.value);
        });
        DOM.commandPaletteInput?.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                moveCommandHighlight(1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                moveCommandHighlight(-1);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                executeHighlightedCommand();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                closeCommandPalette();
            }
        });
        addWindowCleanupListener('keydown', handleGlobalCommandPaletteShortcut);

        // Modal overlays (click outside to close)
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    closeAllModals();
                }
            });
        });

        // Open attack-prevention links in external browser
        const attackPreventionModal = document.getElementById('modal-attack-prevention');
        attackPreventionModal?.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.href) {
                e.preventDefault();
                if (window.electronAPI?.openExternal) {
                    window.electronAPI.openExternal(link.href);
                } else {
                    window.open(link.href, '_blank', 'noreferrer');
                }
            }
        });

        // Add target modal
        document.getElementById('btn-confirm-add')?.addEventListener('click', handleAddTarget);
        document.getElementById('input-target-id')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleAddTarget();
        });

        // Bulk add modal
        document.getElementById('btn-preview-bulk')?.addEventListener('click', handleBulkPreview);
        document.getElementById('btn-confirm-bulk')?.addEventListener('click', handleBulkAdd);
        document.getElementById('input-bulk-ids')?.addEventListener('input', () => {
            scheduleBulkPreview();
        });

        // Add group modal
        document.getElementById('btn-confirm-group')?.addEventListener('click', handleAddGroup);
        document.getElementById('input-group-color')?.addEventListener('input', (e) => {
            const colorPreview = document.getElementById('color-preview');
            if (colorPreview) colorPreview.style.backgroundColor = e.target.value;
        });

        // Edit group modal
        document.getElementById('btn-confirm-edit-group')?.addEventListener('click', handleEditGroup);
        document.getElementById('input-edit-group-color')?.addEventListener('input', (e) => {
            const editColorPreview = document.getElementById('edit-color-preview');
            if (editColorPreview) editColorPreview.style.backgroundColor = e.target.value;
        });

        // Context menu items
        DOM.contextMenu?.querySelectorAll('.context-menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                const targetId = contextTargetId; // capture before hide resets it
                handleContextAction(action, targetId);
                hideContextMenu();
            });
        });
        DOM.contextMenuFavorite = DOM.contextMenu?.querySelector('[data-action="favorite"]');
        DOM.contextMenuWatch = DOM.contextMenu?.querySelector('[data-action="toggle-watch"]');
        bindContextMenuHoverPersistence();

        // Group context menu items
        DOM.groupContextMenu?.querySelectorAll('.context-menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                handleGroupContextAction(action);
                hideGroupContextMenu();
            });
        });

        // About
        DOM.activityAbout?.addEventListener('click', () => {
            showAboutModal();
        });
        DOM.aboutOpenLog?.addEventListener('click', openLogsFolder);
        DOM.aboutProfileLink?.addEventListener('click', (e) => {
            e.preventDefault();
            const url = DOM.aboutProfileLink.href;
            if (window.electronAPI?.openExternal) {
                window.electronAPI.openExternal(url);
            } else {
                window.open(url, '_blank', 'noreferrer');
            }
        });

        // Onboarding interactions
        DOM.onboardingTabs?.forEach(tab => {
            tab.addEventListener('click', () => {
                const step = parseInt(tab.dataset.onboardingStep || '0', 10);
                setOnboardingStep(step);
                updateOnboardingStats();
            });
        });

        DOM.onboardingPrev?.addEventListener('click', () => changeOnboardingStep(-1));
        DOM.onboardingNext?.addEventListener('click', () => {
            const lastIndex = (DOM.onboardingSteps?.length || 1) - 1;
            if (onboardingStepIndex >= lastIndex) {
                if (DOM.onboardingHideToggle?.checked) {
                    window.appState.updateSettings({ showOnboarding: false });
                }
                hideOnboarding();
            } else {
                changeOnboardingStep(1);
            }
        });
        DOM.onboardingSkip?.addEventListener('click', hideOnboarding);
        DOM.onboardingClose?.addEventListener('click', hideOnboarding);
        DOM.onboardingHideToggle?.addEventListener('change', (e) => {
            const hide = e.target.checked;
            window.appState.updateSettings({ showOnboarding: !hide });
        });

        DOM.onboardingOverlay?.addEventListener('click', (e) => {
            if (e.target === DOM.onboardingOverlay) {
                hideOnboarding();
            }
        });

        document.querySelectorAll('[data-onboarding-action]')?.forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.onboardingAction;
                handleOnboardingAction(action);
            });
        });

        // Hide context menus on click elsewhere
        document.addEventListener('click', (event) => {
            if (event.target.closest('.context-menu')) return;
            hideContextMenu();
            hideGroupContextMenu();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', handleKeyDown);

        // Loot timer buttons (event delegation)
        document.addEventListener('click', (e) => {
            const setTimeBtn = e.target.closest('.boss-set-time-btn');
            if (setTimeBtn) {
                const bossId = parseInt(setTimeBtn.dataset.bossId, 10);
                if (!isNaN(bossId)) {
                    promptSetDefeatTime(bossId);
                }
            }
        });

        // Bounties
        DOM.btnRefreshBountyStats?.addEventListener('click', handleRefreshBountyStats);
        DOM.bountyAlertDismiss?.addEventListener('click', handleDismissBountyAlert);
        DOM.bountyAddButton?.addEventListener('click', handleAddBounty);
        DOM.bountyEmptyAddButton?.addEventListener('click', () => {
            DOM.bountyTargetInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            DOM.bountyTargetInput?.focus({ preventScroll: true });
        });
        DOM.bountyEmptyRewardButton?.addEventListener('click', () => {
            DOM.bountyRewardInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            DOM.bountyRewardInput?.focus({ preventScroll: true });
        });
        DOM.bountyList?.addEventListener('click', handleBountyListClick);
        [DOM.bountyTargetInput, DOM.bountyRewardInput].forEach(input => {
            input?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddBounty();
                }
            });
        });

        // Settings
        bindSettingsEvents();

        // Section collapse toggles
        document.querySelectorAll('.section-header').forEach(header => {
            const section = header.closest('.sidebar-section');
            if (!section) return;
            restoreSidebarSectionState(section);
            header.addEventListener('click', (e) => {
                if (e.target.closest('.section-action-btn')) return;
                section.classList.toggle('collapsed');
                saveSidebarCollapsedSections();
            });
        });

        // History filters
        DOM.historyRangeButtons?.forEach(btn => {
            btn.addEventListener('click', () => {
                historyFilters.range = btn.dataset.historyRange || 'all';
                DOM.historyRangeButtons.forEach(b => b.classList.toggle('active', b === btn));
                if (window.appState.currentView === 'history') {
                    renderHistory();
                }
            });
        });

        DOM.historySearch?.addEventListener('input', (e) => {
            historyFilters.query = e.target.value || '';
            historyFilters.queryLower = historyFilters.query.toLowerCase();
            if (window.appState.currentView === 'history') {
                renderHistory();
            }
        });

        DOM.attackPreventionNotifyBtn?.addEventListener('click', handleAttackPreventionNotify);
    }

    function bindSettingsEvents() {
        // API key
        document.getElementById('btn-validate-key')?.addEventListener('click', handleValidateKey);
        document.getElementById('btn-toggle-key-visibility')?.addEventListener('click', () => {
            const input = document.getElementById('setting-api-key');
            const btn = document.getElementById('btn-toggle-key-visibility');
            const showIcon = btn?.querySelector('.eye-show');
            const hideIcon = btn?.querySelector('.eye-hide');

            if (input.type === 'password') {
                input.type = 'text';
                if (showIcon) showIcon.style.display = 'none';
                if (hideIcon) hideIcon.style.display = 'block';
            } else {
                input.type = 'password';
                if (showIcon) showIcon.style.display = 'block';
                if (hideIcon) hideIcon.style.display = 'none';
            }
        });

        // TornStats API key visibility toggle
        document.getElementById('btn-toggle-tornstats-visibility')?.addEventListener('click', () => {
            const input = document.getElementById('setting-tornstats-key');
            const btn = document.getElementById('btn-toggle-tornstats-visibility');
            const showIcon = btn?.querySelector('.eye-show');
            const hideIcon = btn?.querySelector('.eye-hide');

            if (input.type === 'password') {
                input.type = 'text';
                if (showIcon) showIcon.style.display = 'none';
                if (hideIcon) hideIcon.style.display = 'block';
            } else {
                input.type = 'password';
                if (showIcon) showIcon.style.display = 'block';
                if (hideIcon) hideIcon.style.display = 'none';
            }
        });

        // TornStats API key change
        document.getElementById('setting-tornstats-key')?.addEventListener('change', (e) => {
            const key = e.target.value.trim();
            window.appState.updateSettings({ tornStatsApiKey: key });
            if (window.tornStatsAPI) {
                window.tornStatsAPI.setApiKey(key);
                window.tornStatsAPI.clearCache();
            }
            showToast('TornStats API key updated', 'success');
        });

        // TornStats API key validation
        document.getElementById('btn-validate-tornstats-key')?.addEventListener('click', handleValidateTornStatsKey);

        // Settings toggles
        const settingBindings = [
            ['setting-notifications', 'notifications'],
            ['setting-sound', 'soundEnabled'],
            ['setting-compact', 'compactMode'],
            ['setting-confirm-attack', 'confirmBeforeAttack'],
            ['setting-minimize-tray', 'minimizeToTray'],
            ['setting-start-minimized', 'startMinimized'],
            ['setting-show-avatars', 'showAvatars'],
            ['setting-show-offline', 'showOfflineTargets'],
            ['setting-show-badges', 'showStatusCountBadges'],
            ['setting-sort-remember', 'sortRememberLast'],
            ['setting-confirm-delete', 'confirmBeforeDelete'],
            ['setting-attack-sound', 'playAttackSound'],
            ['setting-notify-monitored', 'notifyOnlyMonitored'],
            ['setting-notify-hospital', 'notifyOnHospitalRelease'],
            ['setting-notify-jail', 'notifyOnJailRelease'],
            ['setting-notify-added', 'notifyOnTargetAdded'],
            ['setting-notify-removed', 'notifyOnTargetRemoved'],
            ['setting-notify-status', 'notifyOnStatusChange'],
            ['setting-auto-refresh', 'autoRefresh'],
            ['setting-auto-backup', 'autoBackupEnabled'],
            ['setting-backup-preop', 'backupBeforeBulk'],
            ['setting-cloud-backup', 'cloudBackupEnabled'],
            ['setting-show-onboarding', 'showOnboarding']
        ];

        settingBindings.forEach(([elementId, settingKey]) => {
            document.getElementById(elementId)?.addEventListener('change', (e) => {
                window.appState.updateSettings({ [settingKey]: e.target.checked });
                if (settingKey === 'compactMode') {
                    document.body.classList.toggle('compact-mode', e.target.checked);
                } else if (settingKey === 'showAvatars' || settingKey === 'showOfflineTargets' || settingKey === 'showStatusCountBadges') {
                    // Refresh display for visual changes
                    renderTargetList();
                    if (settingKey === 'showStatusCountBadges') {
                        updateFilterCounts();
                    }
                } else if (settingKey === 'cloudBackupEnabled') {
                    syncCloudBackupControls();
                    if (e.target.checked) {
                        autoDetectCloudPath({ provider: DOM.settingCloudProvider?.value, silent: true });
                    } else {
                        updateCloudProviderHint(DOM.settingCloudProvider?.value || 'google-drive', 'Disabled');
                    }
                } else if (settingKey === 'showOnboarding') {
                    syncOnboardingToggle();
                }
            });
        });

        // Select settings
        document.getElementById('setting-theme')?.addEventListener('change', (e) => {
            window.appState.updateSettings({ theme: e.target.value });
            applyTheme(e.target.value);
        });

        document.getElementById('setting-list-density')?.addEventListener('change', (e) => {
            window.appState.updateSettings({ listDensity: e.target.value });
            applyListDensity(e.target.value);
        });

        document.getElementById('setting-timestamp-format')?.addEventListener('change', (e) => {
            window.appState.updateSettings({ timestampFormat: e.target.value });
            renderTargetList(); // Refresh display
        });

        // Numeric settings
        document.getElementById('setting-refresh-interval')?.addEventListener('change', (e) => {
            if (e.target.disabled) return;
            const value = Math.max(10, Math.min(300, parseInt(e.target.value) || 30));
            e.target.value = value;
            window.appState.updateSettings({ refreshInterval: value });
        });

        document.getElementById('setting-concurrent')?.addEventListener('change', (e) => {
            const value = Math.max(1, Math.min(5, parseInt(e.target.value) || 3));
            e.target.value = value;
            window.appState.updateSettings({ maxConcurrentRequests: value });
        });

        document.getElementById('setting-api-rate-limit')?.addEventListener('change', (e) => {
            const fallback = window.appState.settings?.apiRateLimitPerMinute || 80;
            const value = Math.max(1, Math.min(99, parseInt(e.target.value, 10) || fallback));
            e.target.value = value;
            window.appState.limiter?.setLimits?.(value);
            window.appState.updateSettings({ apiRateLimitPerMinute: value });
            updateRateText(window.appState.limiter?.getStatus?.());
        });

        DOM.settingPlayerLevel?.addEventListener('change', (e) => {
            const value = parseInt(e.target.value, 10);
            const normalized = Number.isFinite(value) && value > 0 ? value : null;
            e.target.value = normalized || '';
            window.appState.updateSettings({ playerLevel: normalized });
            renderTargetList();
            const target = window.appState.getSelectedTarget();
            if (target) {
                renderTargetDetail(target);
            }
        });

        document.getElementById('setting-backup-interval')?.addEventListener('change', (e) => {
            const value = Math.max(1, Math.min(30, parseInt(e.target.value) || 7));
            e.target.value = value;
            window.appState.updateSettings({ autoBackupInterval: value });
        });
        document.getElementById('setting-backup-retention')?.addEventListener('change', (e) => {
            const value = Math.max(3, Math.min(50, parseInt(e.target.value) || 10));
            e.target.value = value;
            window.appState.updateSettings({ backupRetention: value });
        });

        document.getElementById('setting-max-history')?.addEventListener('change', (e) => {
            const value = Math.max(100, Math.min(10000, parseInt(e.target.value) || 1000));
            e.target.value = value;
            window.appState.updateSettings({ maxHistoryEntries: value });
        });

        document.getElementById('setting-recent-activity-days')?.addEventListener('change', (e) => {
            const value = Math.max(0, Math.min(365, parseInt(e.target.value) || 0));
            e.target.value = value;
            window.appState.updateSettings({ doNotAttackRecentActivityDays: value });
        });

        // Sound volume slider
        const volumeSliderEl = document.getElementById('setting-sound-volume');
        const volumeDisplayEl = document.getElementById('volume-value-display');
        const volumeContainerEl = document.getElementById('setting-volume-container');
        const testSoundBtn = document.getElementById('btn-test-sound');

        volumeSliderEl?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value, 10);
            if (volumeDisplayEl) volumeDisplayEl.textContent = `${value}%`;
        });

        volumeSliderEl?.addEventListener('change', (e) => {
            const value = Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 50));
            e.target.value = value;
            if (volumeDisplayEl) volumeDisplayEl.textContent = `${value}%`;
            window.appState.updateSettings({ soundVolume: value });
        });

        testSoundBtn?.addEventListener('click', () => {
            const currentVolume = parseInt(volumeSliderEl?.value || '50', 10);
            playSound('notification', currentVolume);
        });

        // Link soundEnabled toggle to volume slider disabled state
        document.getElementById('setting-sound')?.addEventListener('change', (e) => {
            if (volumeContainerEl) {
                volumeContainerEl.classList.toggle('disabled', !e.target.checked);
            }
        });

        document.getElementById('setting-cloud-provider')?.addEventListener('change', (e) => {
            handleCloudProviderChange(e.target.value);
        });

        DOM.cloudProviderToggle?.addEventListener('click', (e) => {
            e.preventDefault();
            toggleCloudProviderList();
        });

        DOM.cloudProviderToggle?.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openCloudProviderList();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                openCloudProviderList();
                const last = DOM.cloudProviderList?.lastElementChild;
                last?.focus();
            }
        });

        document.addEventListener('click', (e) => {
            if (!DOM.cloudProviderDropdown) return;
            if (DOM.cloudProviderDropdown.contains(e.target)) return;
            closeCloudProviderList();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeCloudProviderList();
            }
        });

        DOM.btnCloudPath?.addEventListener('click', handleChooseCloudPath);
        DOM.btnCloudDetect?.addEventListener('click', () => autoDetectCloudPath({ provider: DOM.settingCloudProvider?.value, force: true }));

        // Export/Import
        document.getElementById('btn-export')?.addEventListener('click', handleExportTargets);
        document.getElementById('btn-import')?.addEventListener('click', handleImportTargets);
        document.getElementById('btn-backup')?.addEventListener('click', handleCreateBackup);
    }

    async function refreshTargetSafe(id) {
        if (!Number.isFinite(id)) return;
        if (!window.appState.getTarget(id)) return;
        try {
            await window.appState.refreshTarget(id);
        } catch (error) {
            console.warn(`[Navigation Refresh] Failed to refresh target ${id}:`, error);
        }
    }

    async function refreshTargetWithRetry(id) {
        await refreshTargetSafe(id);
        const updated = window.appState.getTarget(id);
        // If target still looks attackable, retry once shortly after navigation to capture hospital/jail transitions
        if (updated && updated.isAttackable()) {
            await wait(800);
            await refreshTargetSafe(id);
        }
    }

    function requestStatusRecheck(userId) {
        const now = Date.now();
        const last = zeroRefreshTracker.get(userId) || 0;
        if (now - last < 5000) return;
        zeroRefreshTracker.set(userId, now);
        refreshTargetSafe(userId);
    }

    /**
     * Trigger refresh for the selected target.
     * Only refreshes the newly clicked target if its data is stale (>30s old).
     * Previous target is NOT refreshed to avoid cascading API calls.
     *
     * Rate limit strategy:
     * - Uses staleness check to avoid redundant calls
     * - Time-sensitive targets (hospital/jail) use 15s staleness threshold
     * - Normal targets use 30s staleness threshold
     */
    function triggerSelectionRefresh(previousId, nextId) {
        const apiReady = window.appState?.api && window.appState.api.hasApiKey();
        if (!apiReady) return;

        const normalizedNext = Number.parseInt(nextId, 10);
        if (!Number.isFinite(normalizedNext)) return;
        if (!window.appState.getTarget(normalizedNext)) return;

        // Only refresh the clicked target - NOT the previous one
        // This fixes the cascading refresh issue
        navigationRefreshQueue = navigationRefreshQueue.catch(() => {}).then(async () => {
            // Use staleness-based refresh to avoid wasting API calls
            // Will skip if data is fresh (<30s old, or <15s for hospital/jail)
            if (window.appState.refreshTargetIfStale) {
                await window.appState.refreshTargetIfStale(normalizedNext);
            } else {
                // Fallback if method doesn't exist
                await refreshTargetWithRetry(normalizedNext);
            }
        });
    }

    function bindStateEvents() {
        const state = window.appState;

        state.on('initialized', () => {
            appInitialized = true;
            hideLoading();
            renderTargetList();
            renderGroups();
            updateFilterCounts();
            updateStatusBar();
            renderHelpCenter();
            renderBountyPanel();
            loadSettings();
            syncSortButtons();
            syncFilterControls();
            window.appState.getTargets().forEach(syncReminderWatcher);
            refreshMenubarMenuState();
            updateOnboardingStats();
            maybeShowOnboarding();
            window.electronAPI?.setTrayStatus?.({
                targets: window.appState.getTargets().length,
                attackable: window.appState.getTargets().filter(t => t.isAttackable()).length,
                lastRefresh: window.appState.lastRefresh,
                rateLimitStatus: window.appState.limiter?.getStatus?.()
            });

        // Hook into rate limiter for real-time updates
        if (state.limiter) {
            state.limiter.onStatusChange = (status) => {
                updateRateText(status);

                // Update connection dialog if it's open
                if (DOM.connectionDialog?.classList.contains('active')) {
                    updateConnectionDialogState();
                }

                if (DOM.onboardingOverlay?.classList.contains('visible')) {
                    updateOnboardingStats();
                }
            };
        }

            updateBountyAlertUI();
        });

        state.on('targets-changed', () => {
            renderTargetList();
            updateFilterCounts();
            updateStatusBar();
            renderGroups();
            renderHelpCenter();
            refreshMenubarMenuState();
            if (onboardingWaitCondition?.type === 'targets') {
                const baseline = onboardingWaitCondition.baseline || 0;
                const count = window.appState.getTargets().length;
                if (count > baseline) {
                    handleOnboardingResume('targets');
                }
            }
            updateOnboardingStats();
            window.electronAPI?.setTrayStatus?.({
                targets: window.appState.getTargets().length,
                attackable: window.appState.getTargets().filter(t => t.isAttackable()).length,
                lastRefresh: window.appState.lastRefresh,
                rateLimitStatus: window.appState.limiter?.getStatus?.()
            });
        });

        state.on('target-updated', (target) => {
            syncReminderWatcher(target);
            updateTargetInList(target);
            if (state.selectedTargetId === target.userId) {
                renderTargetDetail(target);
            }
            updateFilterCounts();
            updateStatusBar();
            if (state.currentView === 'statistics') {
                renderStatistics();
            }
            if (state.currentView === 'bounties') {
                updateBountyItemsForTarget(target.userId);
            }
            // Update tray with current counts
            window.electronAPI?.setTrayStatus?.({
                targets: window.appState.getTargets().length,
                attackable: window.appState.getTargets().filter(t => t.isAttackable()).length,
                lastRefresh: window.appState.lastRefresh,
                rateLimitStatus: window.appState.limiter?.getStatus?.()
            });
        });

        state.on('target-added', () => {
            renderTargetList();
            updateFilterCounts();
            renderGroups();
            if (state.currentView === 'statistics') {
                renderStatistics();
            }
        });

        // Track when refreshTarget() sends notifications to avoid duplicates in notifyTargetOkay()
        state.on('target-notified', ({ userId, timestamp }) => {
            recentReadyNotifications.set(userId, timestamp);
        });

        state.on('target-removed', () => {
            renderTargetList();
            updateFilterCounts();
            renderGroups();
            if (state.currentView === 'statistics') {
                renderStatistics();
            }
        });

        state.on('selection-changed', (selection) => {
            const primaryId = typeof selection === 'object' ? selection.primaryId : selection;
            const selectedIds = typeof selection === 'object'
                ? (selection.selectedIds || [])
                : (selection ? [selection] : []);

            // Exit intel edit mode when selection changes
            if (intelEditMode) {
                exitIntelEditMode();
            }

            if (primaryId && state.currentView !== 'targets') {
                switchView('targets');
            }
            const previousPrimaryId = lastSelectedTargetId;
            lastSelectedTargetId = primaryId ?? null;
            triggerSelectionRefresh(previousPrimaryId, primaryId);
            updateTargetListSelection(selectedIds);
            updateSelectionToolbar(selectedIds);
            if (primaryId) {
                const target = state.getTarget(primaryId);
                if (target) {
                    renderTargetDetail(target);
                    maybeRefreshIntel(target);
                    DOM.targetDetail.style.display = 'flex';
                    DOM.noSelection.style.display = 'none';
                }
            } else {
                DOM.targetDetail.style.display = 'none';
                DOM.noSelection.style.display = 'flex';
            }
        });

        state.on('filter-changed', () => {
            renderTargetList();
        });

        state.on('sort-changed', () => {
            renderTargetList();
            syncSortButtons();
        });

        state.on('groups-changed', () => {
            renderGroups();
            updateGroupSelects();
            if (state.currentView === 'statistics') {
                renderStatistics();
            }
        });

        state.on('refresh-started', () => {
            hideRefreshStatusUI();
            DOM.refreshAllBtn?.classList.add('spinning');
            updateRateText(window.appState.limiter.getStatus());
            window.electronAPI?.setTrayStatus?.({
                targets: window.appState.getTargets().length,
                attackable: window.appState.getTargets().filter(t => t.isAttackable()).length,
                lastRefresh: window.appState.lastRefresh,
                rateLimitStatus: window.appState.limiter?.getStatus?.()
            });

            // Update connection dialog if it's open
            if (DOM.connectionDialog?.classList.contains('active')) {
                updateConnectionDialogState();
            }
        });

        state.on('refresh-progress', (progress) => {
            pauseCountdownIntervals.forEach(interval => clearInterval(interval));
            pauseCountdownIntervals = [];
            hideRefreshStatusUI();
            DOM.refreshAllBtn?.classList.add('spinning');
            updateRateText(window.appState.limiter.getStatus());
            window.electronAPI?.setTrayStatus?.({
                targets: progress.total,
                attackable: window.appState.getTargets().filter(t => t.isAttackable()).length,
                lastRefresh: window.appState.lastRefresh,
                rateLimitStatus: window.appState.limiter?.getStatus?.()
            });
        });

        state.on('refresh-blocked', (data) => {
            if (data.reason === 'already_in_progress') {
                const percent = data.progress?.percent || 0;
                showToast(`Refresh already in progress (${Math.round(percent)}% complete)`, 'info');
            }
        });

        state.on('refresh-completed', () => {
            // Clear any pause countdown intervals
            pauseCountdownIntervals.forEach(interval => clearInterval(interval));
            pauseCountdownIntervals = [];

            hideRefreshStatusUI();
            DOM.refreshAllBtn?.classList.remove('spinning');
            updateStatusBar();
            if (state.currentView === 'statistics') {
                renderStatistics();
            }

            // Update connection dialog if it's open
            if (DOM.connectionDialog?.classList.contains('active')) {
                updateConnectionDialogState();
            }
            window.electronAPI?.setTrayStatus?.({
                targets: window.appState.getTargets().length,
                attackable: window.appState.getTargets().filter(t => t.isAttackable()).length,
                lastRefresh: window.appState.lastRefresh,
                rateLimitStatus: window.appState.limiter?.getStatus?.()
            });
        });

        state.on('refresh-cancelled', () => {
            // Clear any pause countdown intervals
            pauseCountdownIntervals.forEach(interval => clearInterval(interval));
            pauseCountdownIntervals = [];

            hideRefreshStatusUI();
            DOM.refreshAllBtn?.classList.remove('spinning');
            updateStatusBar();
        });

        state.on('connection-change', (isOnline) => {
            updateConnectionStatus(isOnline);
            if (DOM.onboardingOverlay?.classList.contains('visible')) {
                updateOnboardingStats();
            }
        });

        state.on('error', (message) => {
            showToast(message, 'error');
        });

        state.on('attack-tracker-changed', () => {
            updateAttackTrackerUI();
            renderTargetList();
        });

        state.on('settings-changed', () => {
            loadSettings();
            syncOnboardingToggle();
            updateOnboardingStats();
            if (state.currentView === 'statistics') {
                renderStatistics();
            }
            refreshMenubarMenuState();
            updateStatusBar();
            renderHelpCenter();
        });

        state.on('loading', (isLoading) => {
            if (isLoading) {
                showLoading();
            } else {
                hideLoading();
            }
        });

        state.on('statistics-changed', () => {
            if (state.currentView === 'statistics') {
                renderStatistics();
            }
            // Update tray to reflect new statistics
            window.electronAPI?.setTrayStatus?.({
                targets: window.appState.getTargets().length,
                attackable: window.appState.getTargets().filter(t => t.isAttackable()).length,
                lastRefresh: window.appState.lastRefresh,
                rateLimitStatus: window.appState.limiter?.getStatus?.()
            });
            renderHelpCenter();
        });

        state.on('selection-changed', () => refreshMenubarMenuState());
        state.on('view-changed', () => {
            refreshMenubarMenuState();
            if (onboardingWaitCondition?.type === 'view') {
                if (window.appState.currentView === onboardingWaitCondition.targetView) {
                    handleOnboardingResume('view');
                }
            }
            if (state.currentView === 'bounties') {
                renderBountyPanel();
            }
        });

        state.on('attack-history-changed', () => {
            if (state.currentView === 'history') {
                renderHistory();
            }
            if (state.currentView === 'statistics') {
                renderStatistics();
            }
            // Update tray to reflect new attack history
            window.electronAPI?.setTrayStatus?.({
                targets: window.appState.getTargets().length,
                attackable: window.appState.getTargets().filter(t => t.isAttackable()).length,
                lastRefresh: window.appState.lastRefresh,
                rateLimitStatus: window.appState.limiter?.getStatus?.()
            });
        });

        state.on('bounties-changed', () => {
            updateBountyAlertUI();
            if (state.currentView === 'bounties') {
                renderBountyPanel(true);
            }
            renderTargetList();
            const selected = state.getSelectedTarget ? state.getSelectedTarget() : null;
            if (selected) {
                renderTargetDetail(selected);
            }
        });

        state.on('bounty-alert', () => {
            updateBountyAlertUI();
        });

        state.on('play-notification-sound', () => {
            playSound('notification');
        });
    }

    // ========================================================================
    // VIEW MANAGEMENT
    // ========================================================================

    function switchView(view) {
        // Cleanup from previous view
        const previousView = window.appState.currentView;
        if (previousView === 'loot-timer' && view !== 'loot-timer') {
            cleanupLootTimer();
        }

        // Update activity bar
        DOM.activityItems.forEach(item => {
            item.classList.toggle('active', item.dataset.view === view);
        });

        // Update panels
        DOM.contentPanels.forEach(panel => {
            panel.classList.toggle('active', panel.id === `panel-${view}`);
        });

        window.appState.setView(view);

        // Load view-specific content
        if (view === 'history') {
            renderHistory();
        } else if (view === 'statistics') {
            renderStatistics();
        } else if (view === 'loot-timer') {
            renderLootTimer();
        } else if (view === 'bounties') {
            renderBountyPanel();
        } else if (view === 'help') {
            renderHelpCenter();
        } else if (view === 'backup') {
            initializeBackupView();
        }
    }

    // Expose switchView to global scope for inline event handlers
    window.switchView = switchView;

    // ========================================================================
    // TARGET LIST RENDERING
    // ========================================================================

    function handleTargetListDoubleClick(event) {
        const userId = resolveTargetIdFromEvent(event);
        if (!userId) return;
        if (!isPrimaryTargetListGesture(event)) return;

        triggerTargetListAttack(userId);
        resetTargetListDoubleClickTracker();
        event.preventDefault();
    }

    // Update welcome view with dynamic content
    function updateWelcomeView() {
        const allTargets = window.appState.getTargets();
        const totalTargets = allTargets.length;

        // Calculate attackable targets and other stats
        const attackableTargets = allTargets.filter(t => t.isAttackable()).length;
        const hospitalTargets = allTargets.filter(t => t.status === 'Hospital').length;
        const jailTargets = allTargets.filter(t => t.status === 'Jail').length;
        const travelTargets = allTargets.filter(t => t.status === 'Traveling').length;

        // Calculate targets coming available soon (within next hour)
        const oneHour = 60 * 60 * 1000;
        const comingSoonTargets = allTargets.filter(t => {
            if (t.isAttackable()) return false;
            const timeRemaining = t.getTimeRemaining();
            return timeRemaining > 0 && timeRemaining <= oneHour;
        }).length;

        // Get time-based greeting
        const hour = new Date().getHours();
        let timeGreeting = 'evening';
        if (hour < 12) timeGreeting = 'morning';
        else if (hour < 18) timeGreeting = 'afternoon';

        // Update stats
        const targetsStat = document.getElementById('welcome-stat-targets');
        const attackableStat = document.getElementById('welcome-stat-attackable');
        const statusStat = document.getElementById('welcome-stat-status');

        if (targetsStat) targetsStat.textContent = totalTargets;
        if (attackableStat) attackableStat.textContent = attackableTargets;
        if (statusStat) {
            if (totalTargets === 0) {
                statusStat.textContent = 'Ready';
            } else if (attackableTargets > 0) {
                statusStat.textContent = 'Active';
            } else if (comingSoonTargets > 0) {
                statusStat.textContent = 'Pending';
            } else {
                statusStat.textContent = 'Tracking';
            }
        }

        // Update main header title and description
        const mainTitle = document.getElementById('welcome-main-title');
        const mainDescription = document.getElementById('welcome-main-description');

        if (totalTargets === 0) {
            // No targets - show onboarding message
            if (mainTitle) mainTitle.textContent = `Good ${timeGreeting}! Ready to Track Your Targets?`;
            if (mainDescription) mainDescription.textContent = 'Build your intelligence network by adding targets. Get instant notifications when they become vulnerable, track their movements in real-time, and never miss an opportunity.';
        } else if (attackableTargets > 0) {
            // Has attackable targets
            const titles = [
                'Targets Ready for Action',
                'Attack Window Open',
                'Opportunities Available',
                'Targets Vulnerable Now'
            ];
            const title = titles[attackableTargets % titles.length];

            if (mainTitle) mainTitle.textContent = title;

            let description = `${attackableTargets} target${attackableTargets !== 1 ? 's are' : ' is'} currently attackable and ready for engagement.`;

            if (comingSoonTargets > 0) {
                description += ` ${comingSoonTargets} more will become available within the hour.`;
            }
            if (hospitalTargets + jailTargets + travelTargets > 0) {
                const statusParts = [];
                if (hospitalTargets > 0) statusParts.push(`${hospitalTargets} hospitalized`);
                if (jailTargets > 0) statusParts.push(`${jailTargets} jailed`);
                if (travelTargets > 0) statusParts.push(`${travelTargets} traveling`);
                description += ` Tracking ${statusParts.join(', ')}.`;
            }

            if (mainDescription) mainDescription.textContent = description;
        } else if (totalTargets > 0) {
            // Has targets but none attackable
            if (comingSoonTargets > 0) {
                if (mainTitle) mainTitle.textContent = 'Targets Incoming';
                if (mainDescription) mainDescription.textContent = `${comingSoonTargets} target${comingSoonTargets !== 1 ? 's' : ''} will become attackable within the next hour. ${totalTargets - comingSoonTargets > 0 ? `Monitoring ${totalTargets - comingSoonTargets} other${totalTargets - comingSoonTargets !== 1 ? 's' : ''} for status changes.` : ''} You'll receive instant alerts when attack windows open.`;
            } else {
                if (mainTitle) mainTitle.textContent = 'Intelligence Network Active';
                if (mainDescription) mainDescription.textContent = `Actively monitoring ${totalTargets} target${totalTargets !== 1 ? 's' : ''} across Torn City. ${hospitalTargets + jailTargets > 0 ? `Tracking ${hospitalTargets + jailTargets} target${hospitalTargets + jailTargets !== 1 ? 's' : ''} in custody/medical facilities. ` : ''}Real-time alerts will notify you the moment any target becomes vulnerable.`;
            }
        }

        // Update main CTA card based on target count
        const ctaTitle = document.getElementById('welcome-cta-title');
        const ctaDescription = document.getElementById('welcome-cta-description');

        if (totalTargets === 0) {
            // No targets - show onboarding message
            if (ctaTitle) ctaTitle.textContent = 'Initialize Tracking System';
            if (ctaDescription) ctaDescription.textContent = 'Deploy your first surveillance target and unlock real-time intelligence monitoring, instant vulnerability alerts, and comprehensive tracking analytics.';
        } else if (attackableTargets > 0) {
            // Has attackable targets
            if (ctaTitle) ctaTitle.textContent = `${attackableTargets} Target${attackableTargets !== 1 ? 's' : ''} Ready`;
            const percentage = Math.round((attackableTargets / totalTargets) * 100);
            if (ctaDescription) ctaDescription.textContent = `${percentage}% of your surveillance network (${attackableTargets}/${totalTargets} targets) is currently vulnerable. Select targets from the list to view detailed intelligence and execute attacks.`;
        } else if (totalTargets > 0) {
            // Has targets but none attackable
            if (comingSoonTargets > 0) {
                if (ctaTitle) ctaTitle.textContent = `${comingSoonTargets} Target${comingSoonTargets !== 1 ? 's' : ''} Incoming`;
                if (ctaDescription) ctaDescription.textContent = `Attack windows opening soon for ${comingSoonTargets} target${comingSoonTargets !== 1 ? 's' : ''}. Stand by for real-time notifications as they become vulnerable.`;
            } else {
                if (ctaTitle) ctaTitle.textContent = `${totalTargets} Target${totalTargets !== 1 ? 's' : ''} Under Surveillance`;
                if (ctaDescription) ctaDescription.textContent = `Your intelligence network is actively monitoring all targets. Automated alerts will notify you instantly when attack opportunities arise.`;
            }
        }
    }

    function renderHelpCenter() {
        // Help view is static; no dynamic stats required.
    }

    // Track which items are currently rendered to enable smart updates
    let renderedTargetIds = [];
    let isFullRenderNeeded = true;
    const TARGET_LIST_DOUBLE_CLICK_MS = 700;
    const TARGET_LIST_DOUBLE_CLICK_MAX_DISTANCE_PX = 32;
    const TARGET_LIST_ATTACK_DEBOUNCE_MS = 250;
    let lastTargetListClick = { id: null, time: 0, x: 0, y: 0 };
    let lastTargetListAttackTs = 0;

    function updateAttackTrackerUI(targetsInView = null) {
        if (!DOM.attackTrackerToggle) return;

        const tracker = window.appState.getAttackTrackerSnapshot
            ? window.appState.getAttackTrackerSnapshot()
            : { enabled: false, startedAt: null, completedIds: [] };
        const targets = Array.isArray(targetsInView)
            ? targetsInView
            : (window.appState.getFilteredTargets ? window.appState.getFilteredTargets() : []);
        const targetIds = targets.map(t => t.userId);
        const counts = window.appState.getAttackTrackerCounts
            ? window.appState.getAttackTrackerCounts(targetIds)
            : { done: 0, total: targetIds.length };

        DOM.attackTrackerToggle.classList.toggle('active', tracker.enabled);
        DOM.attackTrackerToggle.classList.toggle('complete', tracker.enabled && counts.total > 0 && counts.done >= counts.total);
        DOM.attackTrackerToggle.title = tracker.enabled
            ? `Tracker on · ${counts.done}/${counts.total} done`
            : 'Enable attack tracker';
        DOM.attackTrackerToggle.setAttribute('aria-pressed', tracker.enabled ? 'true' : 'false');

        if (DOM.attackTrackerReset) {
            DOM.attackTrackerReset.disabled = !tracker.enabled;
            DOM.attackTrackerReset.title = tracker.enabled ? 'Reset tracker progress' : 'Enable tracker to reset';
            DOM.attackTrackerReset.setAttribute('aria-disabled', tracker.enabled ? 'false' : 'true');
        }
        if (tracker.enabled && tracker.completedIds) {
            DOM.attackTrackerToggle.setAttribute('data-progress', `${counts.done}/${counts.total}`);
        } else {
            DOM.attackTrackerToggle.removeAttribute('data-progress');
        }
    }

    function resetTargetMetaCache() {
        targetMetaCache.clear();
    }

    function updateTargetMetaCache(userId, element) {
        if (!userId) return;
        if (element && element.isConnected) {
            targetMetaCache.set(userId, element);
        } else {
            targetMetaCache.delete(userId);
        }
    }

    function getTargetMetaElement(userId) {
        const cached = targetMetaCache.get(userId);
        if (cached && cached.isConnected) return cached;

        const el = DOM.targetList?.querySelector(`[data-user-id="${userId}"] .target-meta`) || null;
        if (el) {
            targetMetaCache.set(userId, el);
        } else {
            targetMetaCache.delete(userId);
        }
        return el;
    }

    function resolveTargetIdFromEvent(event) {
        const targetNode = event.target instanceof Element
            ? event.target
            : event.target?.parentElement || null;
        const item = targetNode?.closest?.('.target-item');
        if (!item || !DOM.targetList?.contains(item)) return null;
        const id = parseInt(item.dataset.userId, 10);
        return Number.isFinite(id) ? id : null;
    }

    function isPrimaryTargetListGesture(event) {
        const isPrimaryButton = event.button === 0 || event.button === undefined;
        const isPrimaryPointer = event.isPrimary === undefined || event.isPrimary;
        const hasModifier = event.shiftKey || event.ctrlKey || event.metaKey || event.altKey;
        return isPrimaryButton && isPrimaryPointer && !hasModifier;
    }

    function resetTargetListDoubleClickTracker() {
        lastTargetListClick = { id: null, time: 0, x: 0, y: 0 };
    }

    function handleTargetListPointerUp(event) {
        const userId = resolveTargetIdFromEvent(event);
        if (!userId) return;

        if (!isPrimaryTargetListGesture(event)) {
            resetTargetListDoubleClickTracker();
            return;
        }

        const now = Date.now();
        const dx = (event.clientX || 0) - (lastTargetListClick.x || 0);
        const dy = (event.clientY || 0) - (lastTargetListClick.y || 0);
        const distance = Math.hypot(dx, dy);
        const isDoubleClick =
            lastTargetListClick.id === userId &&
            (now - lastTargetListClick.time) <= TARGET_LIST_DOUBLE_CLICK_MS &&
            distance <= TARGET_LIST_DOUBLE_CLICK_MAX_DISTANCE_PX;

        lastTargetListClick = {
            id: userId,
            time: now,
            x: event.clientX || 0,
            y: event.clientY || 0
        };

        if (!isDoubleClick) return;

        triggerTargetListAttack(userId);
        resetTargetListDoubleClickTracker();
        event.preventDefault();
    }

    function triggerTargetListAttack(userId) {
        if (!userId) return;

        const now = Date.now();
        if (now - lastTargetListAttackTs < TARGET_LIST_ATTACK_DEBOUNCE_MS) return;
        lastTargetListAttackTs = now;
        resetTargetListDoubleClickTracker();

        window.appState.selectTarget(userId);
        handleAttackById(userId, 'list');
    }

    function handleTargetListClickDelegated(event) {
        const emptyAction = event.target.closest?.('[data-empty-action]');
        if (emptyAction) {
            handleEmptyListAction(emptyAction.dataset.emptyAction);
            return;
        }

        const userId = resolveTargetIdFromEvent(event);
        if (!userId) return;

        if (window.appState.currentView !== 'targets') {
            switchView('targets');
        }
        handleTargetItemClick(event, userId);
    }

    function handleTargetListContextMenuDelegated(event) {
        const userId = resolveTargetIdFromEvent(event);
        if (!userId) return;

        event.preventDefault();
        showContextMenu(event, userId);
    }

    function renderTargetList(forceFullRender = false) {
        const targets = window.appState.getFilteredTargets();
        const selectedIds = window.appState.getSelectedIds ? window.appState.getSelectedIds() : [];
        updateTargetsCountDisplay(targets.length, selectedIds);
        activeCountdownTargets.clear();

        // Update welcome view with current stats
        updateWelcomeView();
        updateSelectionToolbar(selectedIds);
        updateAttackTrackerUI(targets);

        if (targets.length === 0) {
            resetTargetMetaCache();
            DOM.targetList.innerHTML = createTargetEmptyState();
            updateSelectionToolbar([]);
            renderedTargetIds = [];
            isFullRenderNeeded = true;
            return;
        }

        const newTargetIds = targets.map(t => t.userId);
        const needsFullRender = forceFullRender || isFullRenderNeeded ||
            renderedTargetIds.length !== newTargetIds.length ||
            !renderedTargetIds.every((id, i) => id === newTargetIds[i]);

        if (needsFullRender) {
            resetTargetMetaCache();
            const listEl = DOM.targetList;
            const prevScrollTop = listEl ? listEl.scrollTop : 0;

            // Full render - replace everything
            DOM.targetList.innerHTML = targets.map(target => {
                const timeRemaining = target.getFormattedTimeRemaining();
                updateCountdownTracking(target, timeRemaining);
                return createTargetListItem(target, timeRemaining);
            }).join('');

            renderedTargetIds = newTargetIds;
            isFullRenderNeeded = false;

            if (listEl) {
                const maxScroll = Math.max(0, listEl.scrollHeight - listEl.clientHeight);
                listEl.scrollTop = Math.min(prevScrollTop, maxScroll);
            }
        } else {
            // Smart update - only update individual items that changed
            targets.forEach((target, index) => {
                const timeRemaining = target.getFormattedTimeRemaining();
                updateCountdownTracking(target, timeRemaining);
                updateTargetListItemInPlace(target, timeRemaining);
            });
        }

        // Update selection
        updateTargetListSelection(selectedIds);
    }

    function createTargetEmptyState() {
        const hasTargets = (window.appState.getTargets?.() || []).length > 0;
        const hasSearch = !!(window.appState.searchQuery || '').trim();
        const hasFilter = (window.appState.activeFilter || 'all') !== 'all' || (window.appState.activeGroupId || 'all') !== 'all';
        const title = hasTargets ? 'No targets match this view' : 'No targets yet';
        const detail = hasTargets
            ? 'Adjust the search, filter, or group to bring targets back into view.'
            : 'Add a target or paste a batch of Torn IDs to start tracking.';
        const actions = [];

        if (hasSearch) actions.push('<button class="empty-action-btn" data-empty-action="clear-search">Clear search</button>');
        if (hasFilter) actions.push('<button class="empty-action-btn" data-empty-action="clear-filters">Reset filters</button>');
        actions.push('<button class="empty-action-btn primary" data-empty-action="add-target">Add target</button>');
        actions.push('<button class="empty-action-btn" data-empty-action="bulk-add">Bulk import</button>');

        return `
            <div class="empty-list target-empty-state">
                <div class="target-empty-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 0 10 10h-2a8 8 0 1 1-8-8V2zm1 5h-2v6h5v-2h-3V7z"/></svg>
                </div>
                <p class="target-empty-title">${escapeHtml(title)}</p>
                <p class="target-empty-detail">${escapeHtml(detail)}</p>
                <div class="target-empty-actions">${actions.join('')}</div>
            </div>
        `;
    }

    function handleEmptyListAction(action) {
        switch (action) {
            case 'clear-search':
                clearTargetSearch();
                break;
            case 'clear-filters':
                clearTargetFilters();
                break;
            case 'bulk-add':
                openModal('modal-bulk-add');
                break;
            case 'add-target':
            default:
                openModal('modal-add-target');
                break;
        }
    }

    // Update a single target item in place without replacing the element
    function updateTargetListItemInPlace(target, timeRemaining = null) {
        const item = DOM.targetList.querySelector(`.target-item[data-user-id="${target.userId}"]`);
        if (!item) return;

        const trackerEnabled = !!window.appState.attackTracker?.enabled;
        const isTracked = trackerEnabled && window.appState.isTargetTracked
            ? window.appState.isTargetTracked(target.userId)
            : false;
        item.classList.toggle('tracked', trackerEnabled && isTracked);

        // Update status dot
        const statusDot = item.querySelector('.status-dot');
        if (statusDot) {
            const nextClass = `status-dot ${target.getStatusClass()}`;
            if (statusDot.className !== nextClass) {
                statusDot.className = nextClass;
            }
        }

        // Update timer
        const timerValue = timeRemaining ?? target.getFormattedTimeRemaining();
        const metaEl = item.querySelector('.target-meta');
        updateTargetMetaCache(target.userId, metaEl);
        if (metaEl) {
            const level = target.level ? `Lv.${target.level}` : '';
            const timer = timerValue ? `&#9201; ${timerValue}` : '';
            const difficulty = window.appState.getTargetDifficulty ? window.appState.getTargetDifficulty(target) : null;
            const difficultyBadge = difficulty
                ? `<span class="difficulty-pill ${difficulty.className || ''}" title="${escapeHtml(difficulty.advice || '')}">${escapeHtml(difficulty.label || 'Difficulty')}</span>`
                : '';
            const hasBounty = window.appState.hasActiveBounty ? window.appState.hasActiveBounty(target.userId) : false;
            const bountyBadge = hasBounty ? '<span class="target-bounty-pill" title="Tracked bounty on this target">Bounty</span>' : '';
            const metaHtml = `${level} ${timer} ${difficultyBadge} ${bountyBadge}`;
            if (metaEl.dataset.meta !== metaHtml) {
                metaEl.dataset.meta = metaHtml;
                metaEl.innerHTML = metaHtml;
            }
        }

        // Update flagged class
        const group = window.appState.getGroup(target.groupId);
        const hasNoAttackFlag = group && group.noAttack;
        item.classList.toggle('in-flagged-group', hasNoAttackFlag);
    }

    // Force full render on next call (e.g., after adding/removing targets)
    function invalidateTargetListRender() {
        isFullRenderNeeded = true;
    }

    function handleTargetItemClick(event, userId) {
        const state = window.appState;
        const idsInView = state.getFilteredTargets().map(t => t.userId);

        if (event.shiftKey) {
            const anchor = state.selectionAnchorId || state.selectedTargetId || idsInView[0] || userId;
            state.selectRangeBetween(anchor, userId, idsInView);
            return;
        }

        if (event.metaKey || event.ctrlKey) {
            state.selectTarget(userId, { toggle: true, anchorId: state.selectionAnchorId || userId });
            return;
        }

        state.selectTarget(userId, { anchorId: userId });
    }

    function createTargetListItem(target, timeRemaining = null) {
        const statusClass = target.getStatusClass();
        const displayName = target.getDisplayName();
        const timerValue = timeRemaining ?? target.getFormattedTimeRemaining();
        const group = window.appState.getGroup(target.groupId);
        const hasNoAttackFlag = group && group.noAttack;
        const groupName = group ? group.name.toLowerCase() : '';
        const isMugGroup = groupName === 'mug';
        const isChainGroup = groupName === 'chain';
        const selectedIds = window.appState.getSelectedIds ? window.appState.getSelectedIds() : [];
        const selectedClass = selectedIds.includes(target.userId) ? 'selected' : '';
        const flaggedClass = hasNoAttackFlag ? 'in-flagged-group' : '';
        const showAvatars = window.appState.settings.showAvatars !== false;
        const trackerEnabled = window.appState.attackTracker?.enabled;
        const isTracked = trackerEnabled && window.appState.isTargetTracked
            ? window.appState.isTargetTracked(target.userId)
            : false;
        const trackedClass = isTracked ? 'tracked' : '';
        const difficulty = window.appState.getTargetDifficulty
            ? window.appState.getTargetDifficulty(target)
            : null;
        const difficultyBadge = difficulty
            ? `<span class="difficulty-pill ${difficulty.className || ''}" title="${escapeHtml(difficulty.advice || '')}">${escapeHtml(difficulty.label || 'Difficulty')}</span>`
            : '';
        const hasBounty = window.appState.hasActiveBounty
            ? window.appState.hasActiveBounty(target.userId)
            : false;
        const bountyBadge = hasBounty
            ? '<span class="target-bounty-pill" title="Tracked bounty on this target">Bounty</span>'
            : '';

        // Status detection with null-safe method calls
        const isAttackable = target.isAttackable && target.isAttackable();
        const isInHospital = target.isInHospital && target.isInHospital();
        const isInJail = target.isInJail && target.isInJail();
        const isInFederal = target.isInFederal && target.isInFederal();
        const isTraveling = target.isTraveling && target.isTraveling();
        const isFallen = target.isFallen && target.isFallen();

        // Build status icon HTML with enhanced tooltips including status description
        const statusDesc = target.statusDesc ? ` (${escapeHtml(target.statusDesc)})` : '';
        let statusIconHtml = '';

        if (isInFederal) {
            const timeInfo = timerValue ? ` - ${timerValue} remaining` : '';
            statusIconHtml = `<img src="assets/federal.png" class="target-status-icon" title="Federal Jail${statusDesc}${timeInfo}" alt="Federal" />`;
        } else if (isInJail) {
            const timeInfo = timerValue ? ` - ${timerValue} remaining` : '';
            statusIconHtml = `<img src="assets/jail.png" class="target-status-icon" title="Jail${statusDesc}${timeInfo}" alt="Jail" />`;
        } else if (isInHospital) {
            const timeInfo = timerValue ? ` - ${timerValue} remaining` : '';
            statusIconHtml = `<img src="assets/hospital.png" class="target-status-icon" title="Hospital${statusDesc}${timeInfo}" alt="Hospital" />`;
        } else if (isTraveling) {
            const travelRaw = (target.statusDesc || '').trim();
            const normalized = travelRaw.toLowerCase();
            let travelLabel = travelRaw || 'Abroad';
            if (normalized.startsWith('traveling to ')) {
                travelLabel = travelRaw.slice('traveling to '.length);
            } else if (normalized.startsWith('returning to ')) {
                travelLabel = travelRaw.slice('returning to '.length);
            }
            const travelPrefix = normalized.startsWith('returning to') ? 'Returning to' : 'Traveling to';
            const timeInfo = timerValue ? ` - ${timerValue} remaining` : '';
            statusIconHtml = `<img src="assets/travel.png" class="target-status-icon" title="${travelPrefix} ${escapeHtml(travelLabel)}${timeInfo}" alt="Traveling" />`;
        } else if (isFallen) {
            statusIconHtml = `<span class="target-status-icon target-fallen-icon" title="Fallen - Account inactive">💀</span>`;
        } else if (isAttackable) {
            statusIconHtml = `<img src="assets/attack.png" class="target-status-icon target-okay-icon" title="Ready to attack!" alt="OK" />`;
        }

        // Avatar HTML
        const avatarSrc = getSafeImageSource(target.avatarPath || target.avatarUrl);
        const avatarHtml = showAvatars ? `
            <div class="target-avatar ${avatarSrc ? '' : 'placeholder'}">
                ${avatarSrc ? `<img src="${escapeHtml(avatarSrc)}" alt="${escapeHtml(displayName)}">` : ''}
            </div>
        ` : '';

        // Build icons in a container with proper ordering:
        // 1. Status icon (hospital/jail/federal/travel/fallen/okay) - current state
        // 2. Group icons (mug/chain) - target classification
        // 3. Monitor alert icon - active monitoring indicator
        // 4. Prevent icon - warning/protection flag
        // 5. Favorite star - user preference
        // 6. Error indicator - issues
        // Tracker state is reflected by row styling (no pill)
        const icons = [];

        if (statusIconHtml) icons.push(statusIconHtml);
        if (isMugGroup) icons.push('<img src="assets/mug.png" class="target-group-icon" title="Mug target" alt="Mug" />');
        if (isChainGroup) icons.push('<img src="assets/chain.png" class="target-group-icon" title="Chain target" alt="Chain" />');
        if (target.monitorOk) icons.push('<img src="assets/alert.png" class="target-alert-icon" title="Status monitor enabled - will notify when OK" alt="Alert" />');
        if (hasNoAttackFlag) icons.push('<img src="assets/prevent.png" class="target-prevent-icon" title="⚠ Do Not Attack - Protected by ' + escapeHtml(group.name) + '" alt="Prevent" />');
        if (target.isFavorite) icons.push('<img src="assets/star.png" class="target-favorite-icon" title="Favorite target" alt="Favorite" />');
        if (target.error) icons.push('<span class="target-error" title="Error: ' + escapeHtml(target.error) + '">!</span>');

        const iconsHtml = icons.length > 0
            ? `<div class="target-icons">${icons.join('')}</div>`
            : '';

        return `
            <div class="target-item ${selectedClass} ${flaggedClass} ${trackedClass}"
                 data-user-id="${target.userId}">
                <span class="status-dot ${statusClass}"></span>
                ${avatarHtml}
                <div class="target-info">
                    <span class="target-name">${escapeHtml(displayName)}</span>
                    <span class="target-meta">
                        ${target.level ? `Lv.${target.level}` : ''}
                        ${timerValue ? `&#9201; ${timerValue}` : ''}
                        ${difficultyBadge}
                        ${bountyBadge}
                    </span>
                </div>
                ${iconsHtml}
            </div>
        `;
    }

    function updateCountdownTracking(target, timeRemaining = null) {
        const hasCountdown = !!(timeRemaining ?? target.getFormattedTimeRemaining());
        if (hasCountdown) {
            activeCountdownTargets.add(target.userId);
        } else {
            activeCountdownTargets.delete(target.userId);
        }
    }

    // ------------------------------------------------------------------------
    // Countdown reminders (hospital/jail -> OK)
    // ------------------------------------------------------------------------

    function notifyTargetOkay(target, reason = '') {
        // Skip during initial scan to prevent notification spam on app launch
        if (window.appState?.suppressNotifications) return;

        const now = Date.now();
        const last = recentReadyNotifications.get(target.userId) || 0;
        if (now - last < 5000) return; // throttle per target

        recentReadyNotifications.set(target.userId, now);

        const detail = reason ? ` (${reason})` : '';
        const displayName = target.getDisplayName();

        // Show system notification for watched targets
        // Watched targets (monitorOk) ALWAYS get notifications regardless of global setting
        if (target.monitorOk) {
            window.electronAPI?.showNotification?.(
                'Target Available!',
                `${displayName} is now attackable${detail}`,
                true // force - bypass global notification setting for watched targets
            );

            // Play notification sound if enabled
            if (window.appState?.settings?.soundEnabled) {
                window.appState.emit('play-notification-sound');
            }
        }

        // Also show toast for visual feedback in the app
        showToast(`${displayName} is OK${detail}`, 'success');
    }

    function shouldTrackStatusReminder(state) {
        const normalized = (state || '').toLowerCase();
        return normalized === 'hospital' || normalized === 'jail' || normalized === 'jailed' || normalized === 'federal';
    }

    function syncReminderWatcher(target) {
        if (!target) return;

        const state = (target.statusState || '').toLowerCase();
        const wantsMonitor = !!target.monitorOk;
        const isOk = state === 'okay' || state === 'ok';
        const trackedStatus = shouldTrackStatusReminder(state);
        const key = target.userId;
        const existing = reminderWatchers.get(key);
        const untilMs = target.statusUntil ? target.statusUntil * 1000 : null;

        if (!wantsMonitor) {
            if (existing) reminderWatchers.delete(key);
            return;
        }

        // If they are OK and we were watching, fire ready reminder and clear
        if (isOk) {
            if (existing) {
                const reason = existing.notifiedZero ? 'Countdown finished' : 'Status updated';
                notifyTargetOkay(target, reason);
            }
            reminderWatchers.delete(key);
            return;
        }

        // If not a tracked state, clear any watcher
        if (!trackedStatus) {
            if (existing) reminderWatchers.delete(key);
            return;
        }

        const needsReset = !existing || existing.state !== state || existing.until !== untilMs;
        reminderWatchers.set(key, {
            state,
            until: untilMs,
            notifiedZero: needsReset ? false : existing.notifiedZero
        });
    }

    function reminderTick() {
        if (reminderWatchers.size === 0) return;

        const offsetMs = window.appState?.api?.serverTimeOffsetMs || 0;
        const now = Date.now() + offsetMs;
        reminderWatchers.forEach((watch, userId) => {
            const target = window.appState.getTarget(userId);
            if (!target) {
                reminderWatchers.delete(userId);
                return;
            }

            if (watch.until && now >= watch.until && !watch.notifiedZero) {
                watch.notifiedZero = true;
                reminderWatchers.set(userId, watch);

                // Use refreshTarget (NOT refreshTargets) to trigger notification logic
                // refreshTarget has the notification checks; refreshTargets/doRefresh does not
                if (window.appState?.refreshTarget) {
                    window.appState.refreshTarget(userId);
                }
            }
        });
    }

    function updateTargetInList(target) {
        const item = DOM.targetList.querySelector(`[data-user-id="${target.userId}"]`);
        if (item) {
            const newItem = document.createElement('div');
            const timeRemaining = target.getFormattedTimeRemaining();
            updateCountdownTracking(target, timeRemaining);
            newItem.innerHTML = createTargetListItem(target, timeRemaining);
            const newElement = newItem.firstElementChild;
            
            item.replaceWith(newElement);
            updateTargetMetaCache(target.userId, newElement?.querySelector('.target-meta') || null);
        }
    }

    function updateTargetListSelection(selectedIds = null) {
        const ids = selectedIds ?? (window.appState.getSelectedIds ? window.appState.getSelectedIds() : []);
        const selectedSet = new Set(ids.map(id => parseInt(id, 10)));
        DOM.targetList.querySelectorAll('.target-item').forEach(item => {
            const uid = parseInt(item.dataset.userId, 10);
            item.classList.toggle('selected', selectedSet.has(uid));
        });
    }

    function updateSelectionToolbar(selectedIds = null) {
        updateTargetsCountDisplay(null, selectedIds);
        return;
    }

    // ========================================================================
    // TARGET DETAIL RENDERING
    // ========================================================================

    function renderTargetDetail(target) {
        if (!target) return;

        // Verify we have all required DOM elements
        if (!DOM.detailName || !DOM.detailId) {
            console.error('Detail view DOM elements not found');
            return;
        }

        // Basic info with null checks
        if (DOM.detailName) {
            DOM.detailName.textContent = target.getDisplayName();
            DOM.detailName.classList.toggle('favorite', target.isFavorite);
        }
        if (DOM.detailId) DOM.detailId.textContent = target.userId;

        // Avatar - always re-render to update status-based styling
        renderTargetAvatar(target);

        // Status badge - critical for status updates
        if (DOM.detailStatusBadge) {
            DOM.detailStatusBadge.textContent = target.statusState || 'Unknown';
            DOM.detailStatusBadge.className = 'status-badge ' + target.getStatusClass();
        }

        // Status chip - update to reflect current status
        updateStatusChip(target);

        // Timer - update countdown or hide if expired
        updateDetailTimer(target);
        renderDifficulty(target);
        renderTargetBountyChip(target);

        // Favorite button
        if (DOM.detailFavoriteBtn) {
            DOM.detailFavoriteBtn.classList.toggle('active', target.isFavorite);
        }

        // Info section
        if (DOM.detailLevel) DOM.detailLevel.textContent = target.level || '-';
        if (DOM.detailLevelChip) {
            DOM.detailLevelChip.textContent = target.level ? `Lv. ${target.level}` : 'Lv. ?';
        }

        if (DOM.detailFaction) DOM.detailFaction.textContent = target.faction || 'None';
        if (DOM.detailFactionChip) {
            DOM.detailFactionChip.textContent = target.faction || 'No faction';
        }
        if (DOM.detailTags) {
            const tags = Array.isArray(target.tags)
                ? target.tags.map(t => (t || '').trim()).filter(t => t.length)
                : [];
            DOM.detailTags.innerHTML = tags.length
                ? tags.map(tag => `<span class="tag-pill">${escapeHtml(tag)}</span>`).join('')
                : '<span class="tag-pill">None</span>';
        }

        if (DOM.detailUpdatedChip) {
            DOM.detailUpdatedChip.textContent = `Updated ${formatTimestamp(target.lastUpdated)}`;
        }

        if (DOM.detailStatusDesc) DOM.detailStatusDesc.textContent = target.statusDesc || target.statusState || '-';
        if (DOM.detailLastAction) DOM.detailLastAction.textContent = target.lastActionRelative || '-';
        if (DOM.detailUpdated) DOM.detailUpdated.textContent = formatTimestamp(target.lastUpdated);
        if (DOM.detailAdded) DOM.detailAdded.textContent = formatTimestamp(target.addedAt);

        // Update visual decorations based on status
        decorateDetailRows(target);

        // Attack stats
        if (DOM.detailAttackCount) DOM.detailAttackCount.textContent = target.attackCount || 0;
        if (DOM.detailLastAttacked) {
            DOM.detailLastAttacked.textContent = target.lastAttacked ? formatTimestamp(target.lastAttacked) : 'Never';
        }

        // Editable fields
        if (DOM.detailCustomName) DOM.detailCustomName.value = target.customName || '';
        if (DOM.detailNotes) DOM.detailNotes.value = target.notes || '';
        if (DOM.detailMonitorOk) {
            DOM.detailMonitorOk.checked = !!target.monitorOk;
        }
        setWatchButtonState(!!target.monitorOk);

        // Group select
        updateGroupSelects();
        if (DOM.detailGroup) DOM.detailGroup.value = target.groupId || 'default';

        // Attack button state - critical for showing if target is attackable
        if (DOM.btnAttack) {
            DOM.btnAttack.disabled = !target.isAttackable();
        }

        // History
        renderTargetHistory(target);
        renderTargetIntel(target);
    }

    function decorateDetailRows(target) {
        if (!target) return;

        const status = (target.statusState || '').toLowerCase();
        const infoSection = document.querySelector('.detail-section .detail-grid');
        if (!infoSection) return;

        // Clear previous semantic classes
        infoSection.querySelectorAll('.detail-row').forEach(row => {
            row.classList.remove('status-okay', 'status-warning', 'status-bad');
        });

        const statusRow = document.querySelector('[data-detail-row="status"]');
        const lastActionRow = document.querySelector('[data-detail-row="last-action"]');

        // Update status row styling based on current status
        if (statusRow) {
            if (status === 'okay' || status === 'ok') {
                statusRow.classList.add('status-okay');
            } else if (status === 'traveling' || status === 'abroad') {
                statusRow.classList.add('status-warning');
            } else if (status === 'hospital' || status === 'jail' || status === 'jailed' || status === 'federal' || status === 'fallen') {
                statusRow.classList.add('status-bad');
            }
        }

        // Update last action row styling
        if (lastActionRow) {
            if (target.lastActionRelative && target.lastActionRelative.includes('ago')) {
                lastActionRow.classList.add('status-warning');
            }
        }
    }

    function renderTargetHistory(target) {
        const list = DOM.detailHistoryList;
        if (!list || !target) return;

        const history = window.appState.getTargetHistory
            ? window.appState.getTargetHistory(target.userId, 6)
            : [];

        if (!history || history.length === 0) {
            list.innerHTML = '<div class="history-empty">No interactions yet</div>';
            return;
        }

        list.innerHTML = history.map(record => {
            const statusClass = getHistoryStatusClass(record.status);
            const type = (record.type || 'manual').toLowerCase();
            const timeLabel = formatTimestamp(record.timestamp);
            const statusLabel = record.status || 'Unknown';
            const source = formatHistorySource(record.source);
            return `
                <div class="history-item">
                    <div class="history-left">
                        <span class="history-type ${type}">${escapeHtml(type)}</span>
                        <div class="history-content">
                            <span class="history-status ${statusClass}">${escapeHtml(statusLabel)}</span>
                            <span class="history-source">${escapeHtml(source)}</span>
                        </div>
                    </div>
                    <span class="history-time">${escapeHtml(timeLabel)}</span>
                </div>
            `;
        }).join('');
    }

    function renderTargetIntel(target, { loading = false, error = null, refreshing = false } = {}) {
        if (!DOM.detailIntelSection) return;

        const statusEl = DOM.detailIntelStatus;
        const messageEl = DOM.detailIntelMessage;
        const updatedEl = DOM.detailIntelUpdated;
        const sourceEl = DOM.detailIntelSource;
        const freshnessEl = DOM.detailIntelFreshness;
        const hasCachedIntel = !!target?.intel;

        const setStat = (el, value) => {
            if (el) el.textContent = formatIntelValue(value);
        };

        const clearStats = () => {
            setStat(DOM.detailIntelStr, '-');
            setStat(DOM.detailIntelDef, '-');
            setStat(DOM.detailIntelSpd, '-');
            setStat(DOM.detailIntelDex, '-');
            setStat(DOM.detailIntelTotal, '-');
        };

        const setStateClass = (cls) => {
            DOM.detailIntelSection.classList.remove('intel-loading', 'intel-error', 'intel-missing', 'intel-ready');
            if (cls) DOM.detailIntelSection.classList.add(cls);
        };

        const setStatus = (value) => {
            if (statusEl) statusEl.textContent = value;
        };

        const setMessage = (value) => {
            setElementContent(messageEl, value);
        };

        if (loading && !hasCachedIntel) {
            setStateClass('intel-loading');
            clearStats();
            setStatus('Fetching intelligence...');
            setMessage('Requesting latest spy data from TornStats.');
            if (freshnessEl) freshnessEl.textContent = '';
            return;
        }

        if (error && !hasCachedIntel) {
            setStateClass('intel-error');
            clearStats();
            setStatus('Intel error');
            setMessage(error);
            return;
        }

        if (!target) {
            setStateClass('intel-missing');
            clearStats();
            setStatus('No target selected');
            setMessage('Select a target to view intelligence.');
            return;
        }

        const intel = target.intel;
        const hasIntel = !!intel;

        if (!window.tornStatsAPI || !window.tornStatsAPI.apiKey) {
            if (!hasIntel) {
                setStateClass('intel-missing');
                clearStats();
                setStatus('TornStats key required');
                setMessage('Add your TornStats API key in Settings to enable battle stat estimation.');
                if (updatedEl) updatedEl.textContent = '-';
                if (sourceEl) sourceEl.textContent = '';
                if (freshnessEl) freshnessEl.textContent = '';
                return;
            }
            // If we have cached intel, continue to render it even without an API key
        }

        if (!intel) {
            setStateClass('intel-missing');
            clearStats();
            setStatus('No intelligence yet');
            setMessage('Click Refresh Intelligence to pull the latest spy data.');
            if (updatedEl) updatedEl.textContent = '-';
            if (sourceEl) sourceEl.textContent = '';
            if (freshnessEl) freshnessEl.textContent = '';
            return;
        }

        if (intel.status === false) {
            setStateClass('intel-missing');
            clearStats();
            setStatus('Intel unavailable');
            setMessage(intel.message || 'No shared stats found for this target.');
            if (updatedEl) updatedEl.textContent = intel.fetchedAt ? formatTimestamp(intel.fetchedAt) : '-';
            if (sourceEl) sourceEl.textContent = 'Source: TornStats';
            if (freshnessEl) freshnessEl.textContent = intel.fetchedAt ? `Checked ${formatIntelAge(intel.fetchedAt)}` : '';
            return;
        }

        const isRefreshing = refreshing && hasIntel;
        const isManual = intel.source === 'manual';
        setStateClass('intel-ready');
        setStat(DOM.detailIntelStr, intel.stats?.strength);
        setStat(DOM.detailIntelDef, intel.stats?.defense);
        setStat(DOM.detailIntelSpd, intel.stats?.speed);
        setStat(DOM.detailIntelDex, intel.stats?.dexterity);
        setStat(DOM.detailIntelTotal, intel.stats?.total);

        // Handle source display for manual vs TornStats
        let sourceText;
        if (isManual) {
            sourceText = 'Source: Manual Entry';
        } else if (intel.type) {
            sourceText = `Source: TornStats - ${intel.type}`;
        } else {
            sourceText = 'Source: TornStats';
        }
        if (sourceEl) {
            sourceEl.textContent = sourceText;
            sourceEl.classList.toggle('manual', isManual);
        }
        setStatus(isRefreshing ? 'Refreshing intel...' : 'Intel ready');
        const message = intel.message || (isManual ? 'Manually entered battle stats' : 'Latest battle stats from TornStats');
        setMessage(isRefreshing ? `${message} (refreshing...)` : message);

        const lastSeen = intel.lastSeen || intel.fetchedAt || null;
        if (updatedEl) updatedEl.textContent = lastSeen ? formatTimestamp(lastSeen) : '-';
        if (freshnessEl) {
            const prefix = isManual ? 'Saved' : 'Cached';
            const ageText = intel.fetchedAt ? `${prefix} ${formatIntelAge(intel.fetchedAt)}` : '';
            freshnessEl.textContent = isRefreshing && ageText ? `${ageText} (refreshing...)` : ageText;
        }
    }

    function renderDifficulty(target) {
        if (!DOM.detailDifficultyChip || !window.appState?.getTargetDifficulty) return;
        const difficulty = window.appState.getTargetDifficulty(target);
        const label = difficulty?.label || 'Unknown';
        const className = difficulty?.className || 'difficulty-unknown';
        DOM.detailDifficultyChip.textContent = label;
        DOM.detailDifficultyChip.className = `chip chip-difficulty ${className}`;
        DOM.detailDifficultyChip.title = difficulty?.ratio
            ? `Level ratio ${difficulty.ratio}x (You ${difficulty.playerLevel || '?'} vs ${difficulty.targetLevel || '?'})`
            : (difficulty?.advice || 'Difficulty unavailable');
    }

    function renderTargetBountyChip(target) {
        const chipRow = document.querySelector('.target-chip-row');
        if (!chipRow) return;

        const bountyEntry = window.appState.getActiveBountyForTarget
            ? window.appState.getActiveBountyForTarget(target.userId)
            : null;

        let chip = document.getElementById('detail-bounty-chip');

        if (!bountyEntry) {
            if (chip) {
                chip.remove();
            }
            return;
        }

        if (!chip) {
            chip = document.createElement('span');
            chip.id = 'detail-bounty-chip';
            chip.className = 'chip chip-bounty';
            chipRow.appendChild(chip);
        }

        chip.textContent = bountyEntry.reward !== null ? formatCurrency(bountyEntry.reward) : 'Bounty';
        chip.title = bountyEntry.expiresAt ? formatExpiry(bountyEntry.expiresAt) : 'Tracked bounty';
    }

    function maybeRefreshIntel(target, { force = false } = {}) {
        if (!target || !window.appState?.fetchTargetIntel) return;
        if (!window.tornStatsAPI || !window.tornStatsAPI.apiKey) {
            renderTargetIntel(target);
            return;
        }
        const intel = target.intel;
        const isFresh = intel?.fetchedAt && Date.now() - intel.fetchedAt < INTEL_STALE_MS;
        if (isFresh && !force) {
            renderTargetIntel(target);
            return;
        }

        if (intel) {
            renderTargetIntel(target, { refreshing: true });
        } else {
            renderTargetIntel(target, { loading: true });
        }
        window.appState.fetchTargetIntel(target.userId, { force })
            .then(() => {
                const updated = window.appState.getTarget(target.userId);
                renderTargetIntel(updated);
                renderDifficulty(updated);
            })
            .catch(err => {
                const fallback = window.appState.getTarget(target.userId) || target;
                if (fallback?.intel) {
                    renderTargetIntel(fallback, { refreshing: true });
                } else {
                    renderTargetIntel(target, { error: err.message });
                }
            });
    }

    function refreshSelectedIntel(force = false) {
        const target = window.appState.getSelectedTarget();
        if (!target) return;
        maybeRefreshIntel(target, { force: force || false });
    }

    function formatIntelValue(value) {
        if (value === null || value === undefined) return '-';
        const num = Number(value);
        if (!Number.isFinite(num)) return '-';
        return formatNumber(num);
    }

    function formatIntelAge(timestamp) {
        if (!timestamp) return '';
        const diff = Date.now() - timestamp;
        const seconds = Math.max(0, Math.floor(diff / 1000));
        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 48) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }

    // ========================================================================
    // INTEL EDITING
    // ========================================================================

    let intelEditMode = false;
    let intelEditOriginalValues = null;

    /**
     * Parse stat value from user input - supports formats like:
     * 1500000, 1.5m, 1,500,000, 1.5M, 800k, etc.
     */
    function parseStatValue(input) {
        if (!input || typeof input !== 'string') return null;
        const cleaned = input.trim().toLowerCase().replace(/,/g, '');
        if (!cleaned || cleaned === '-') return null;

        // Handle suffixes: k (thousands), m (millions), b (billions)
        const suffixMatch = cleaned.match(/^([\d.]+)\s*([kmb])?$/);
        if (!suffixMatch) return null;

        let value = parseFloat(suffixMatch[1]);
        if (!Number.isFinite(value)) return null;

        const suffix = suffixMatch[2];
        if (suffix === 'k') value *= 1000;
        else if (suffix === 'm') value *= 1000000;
        else if (suffix === 'b') value *= 1000000000;

        return Math.round(value);
    }

    /**
     * Format stat value for input field display
     */
    function formatStatForInput(value) {
        if (value === null || value === undefined) return '';
        const num = Number(value);
        if (!Number.isFinite(num)) return '';
        return num.toLocaleString();
    }

    /**
     * Enter intel edit mode
     */
    function enterIntelEditMode() {
        const target = window.appState.getSelectedTarget();
        if (!target) return;

        intelEditMode = true;
        const intel = target.intel;

        // Store original values for cancel
        intelEditOriginalValues = {
            strength: intel?.stats?.strength ?? null,
            defense: intel?.stats?.defense ?? null,
            speed: intel?.stats?.speed ?? null,
            dexterity: intel?.stats?.dexterity ?? null
        };

        // Populate inputs with current values
        if (DOM.inputIntelStr) DOM.inputIntelStr.value = formatStatForInput(intelEditOriginalValues.strength);
        if (DOM.inputIntelDef) DOM.inputIntelDef.value = formatStatForInput(intelEditOriginalValues.defense);
        if (DOM.inputIntelSpd) DOM.inputIntelSpd.value = formatStatForInput(intelEditOriginalValues.speed);
        if (DOM.inputIntelDex) DOM.inputIntelDex.value = formatStatForInput(intelEditOriginalValues.dexterity);

        // Toggle UI
        DOM.detailIntelSection?.classList.add('intel-editing');
        if (DOM.intelActionsView) DOM.intelActionsView.style.display = 'none';
        if (DOM.intelActionsEdit) DOM.intelActionsEdit.style.display = 'flex';

        // Show inputs, hide values
        [DOM.detailIntelStr, DOM.detailIntelDef, DOM.detailIntelSpd, DOM.detailIntelDex].forEach(el => {
            if (el) el.style.display = 'none';
        });
        [DOM.inputIntelStr, DOM.inputIntelDef, DOM.inputIntelSpd, DOM.inputIntelDex].forEach(el => {
            if (el) el.style.display = 'block';
        });

        // Show auto-calculated total indicator, hide static value
        if (DOM.detailIntelTotal) DOM.detailIntelTotal.style.display = 'none';
        if (DOM.intelTotalAuto) DOM.intelTotalAuto.style.display = 'block';

        // Update status
        if (DOM.detailIntelStatus) DOM.detailIntelStatus.textContent = 'Editing...';
        if (DOM.detailIntelMessage) DOM.detailIntelMessage.textContent = 'Enter stat values manually. Use formats like 1.5m, 800k, or raw numbers.';

        // Update total preview
        updateIntelTotalPreview();

        // Focus first input
        DOM.inputIntelStr?.focus();
    }

    /**
     * Update total preview while editing
     */
    function updateIntelTotalPreview() {
        const str = parseStatValue(DOM.inputIntelStr?.value) || 0;
        const def = parseStatValue(DOM.inputIntelDef?.value) || 0;
        const spd = parseStatValue(DOM.inputIntelSpd?.value) || 0;
        const dex = parseStatValue(DOM.inputIntelDex?.value) || 0;
        const total = str + def + spd + dex;

        if (DOM.intelTotalAuto) {
            DOM.intelTotalAuto.textContent = total > 0 ? `Total: ${formatNumber(total)}` : 'Auto-calculated';
        }
    }

    /**
     * Save intel edits
     */
    async function saveIntelEdits() {
        const target = window.appState.getSelectedTarget();
        if (!target) {
            cancelIntelEdits();
            return;
        }

        const strength = parseStatValue(DOM.inputIntelStr?.value);
        const defense = parseStatValue(DOM.inputIntelDef?.value);
        const speed = parseStatValue(DOM.inputIntelSpd?.value);
        const dexterity = parseStatValue(DOM.inputIntelDex?.value);

        // Calculate total
        const total = (strength || 0) + (defense || 0) + (speed || 0) + (dexterity || 0);

        // Create or update intel payload
        const now = Date.now();
        const newIntel = {
            source: 'manual',
            status: true,
            message: 'Manually entered battle stats',
            stats: {
                strength: strength,
                defense: defense,
                speed: speed,
                dexterity: dexterity,
                total: total > 0 ? total : null
            },
            fetchedAt: now,
            lastSeen: now,
            type: 'Manual Entry'
        };

        // Update target
        target.intel = newIntel;
        target.difficulty = window.appState.getTargetDifficulty(target);

        try {
            await window.appState.updateTarget(target.userId, { intel: newIntel });
        } catch (error) {
            console.error('Failed to save intel:', error);
        }

        // Exit edit mode and re-render
        exitIntelEditMode();
        renderTargetIntel(target);

        // Show success feedback
        if (DOM.detailIntelStatus) {
            DOM.detailIntelStatus.textContent = 'Saved!';
            setTimeout(() => {
                const currentTarget = window.appState.getSelectedTarget();
                if (currentTarget && DOM.detailIntelStatus) {
                    DOM.detailIntelStatus.textContent = currentTarget.intel?.status ? 'Intel ready' : 'No intel';
                }
            }, 1500);
        }
    }

    /**
     * Cancel intel edits
     */
    function cancelIntelEdits() {
        exitIntelEditMode();

        // Re-render with original data
        const target = window.appState.getSelectedTarget();
        if (target) {
            renderTargetIntel(target);
        }
    }

    /**
     * Exit intel edit mode (shared by save and cancel)
     */
    function exitIntelEditMode() {
        intelEditMode = false;
        intelEditOriginalValues = null;

        // Toggle UI
        DOM.detailIntelSection?.classList.remove('intel-editing');
        if (DOM.intelActionsView) DOM.intelActionsView.style.display = 'flex';
        if (DOM.intelActionsEdit) DOM.intelActionsEdit.style.display = 'none';

        // Show values, hide inputs
        [DOM.detailIntelStr, DOM.detailIntelDef, DOM.detailIntelSpd, DOM.detailIntelDex, DOM.detailIntelTotal].forEach(el => {
            if (el) el.style.display = 'block';
        });
        [DOM.inputIntelStr, DOM.inputIntelDef, DOM.inputIntelSpd, DOM.inputIntelDex].forEach(el => {
            if (el) el.style.display = 'none';
        });

        // Hide auto-calculated indicator
        if (DOM.intelTotalAuto) DOM.intelTotalAuto.style.display = 'none';
    }

    function updateDetailTimer(target) {
        if (!target) return;

        // Get NUMERIC time remaining to properly detect when timer expires
        const timeRemainingSeconds = target.getTimeRemaining();
        const formattedTime = target.getFormattedTimeRemaining();
        const statusInfo = computeStatusText(target, formattedTime, timeRemainingSeconds);

        // Always update status chip to show live countdown
        updateStatusChip(target, statusInfo);

        // Check if timer has expired (0 or less)
        if (timeRemainingSeconds !== null && timeRemainingSeconds <= 0) {
            DOM.detailTimer.textContent = '0s';
            DOM.detailTimer.style.display = 'inline';
            // Ask for a live recheck so hospital/jail transitions update promptly
            requestStatusRecheck(target.userId);
        } else if (formattedTime) {
            // Timer still running - show countdown
            DOM.detailTimer.textContent = formattedTime;
            DOM.detailTimer.style.display = 'inline';
        } else {
            // No timer (target doesn't have a countdown)
            DOM.detailTimer.style.display = 'none';
        }
    }

    function computeStatusText(target, formattedTime = null, timeRemainingSeconds = null) {
        const timeRemaining = timeRemainingSeconds ?? target.getTimeRemaining();
        const formatted = formattedTime ?? target.getFormattedTimeRemaining();
        let statusText = target.statusDesc || target.statusState || 'Unknown';

        if (timeRemaining !== null && timeRemaining > 0 && formatted) {
            const status = target.statusState || '';
            const statusLower = status.toLowerCase();

            if (statusLower === 'hospital') {
                statusText = `In hospital for ${formatted}`;
            } else if (statusLower === 'jail' || statusLower === 'jailed') {
                statusText = `In jail for ${formatted}`;
            } else if (statusLower === 'federal') {
                statusText = `In federal for ${formatted}`;
            }
        }

        return {
            text: statusText,
            className: `chip chip-status-chip ${target.getStatusClass()}`
        };
    }

    function updateStatusChip(target, statusInfo = null) {
        if (!DOM.detailStatusChip) return;
        const info = statusInfo || computeStatusText(target);

        // Avoid redundant DOM churn that can cause flicker
        const last = statusRenderCache.get(target.userId);
        const nextKey = `${info.text}::${info.className}`;
        if (last === nextKey) return;
        statusRenderCache.set(target.userId, nextKey);

        DOM.detailStatusChip.textContent = info.text;
        DOM.detailStatusChip.className = info.className;

        // Also update the STATUS row in the detail grid with live countdown
        if (DOM.detailStatusDesc) {
            DOM.detailStatusDesc.textContent = info.text;
        }
    }

    function renderTargetAvatar(target) {
        if (!DOM.detailAvatar) return;

        const initials = getInitials(target.getDisplayName());
        if (DOM.detailAvatarInitials) {
            DOM.detailAvatarInitials.textContent = initials;
        } else {
            DOM.detailAvatar.textContent = initials;
        }

        DOM.detailAvatar.classList.remove('has-image', 'loading', 'placeholder');
        DOM.detailAvatar.style.backgroundImage = '';

        // Add favorite effect to avatar
        DOM.detailAvatar.classList.toggle('favorite', target.isFavorite);

        // Add error effect to avatar if target has error or is in unavailable state
        const hasError = target.error ||
                         target.statusState === 'Unknown' ||
                         target.isInHospital?.() ||
                         target.isInJail?.() ||
                         target.isInFederal?.() ||
                         target.isFallen?.();
        DOM.detailAvatar.classList.toggle('error', hasError);

        const token = ++avatarLoadToken;

        if (target.avatarPath) {
            applyAvatarImage(token, target.avatarPath);
            return;
        }

        if (!target.avatarUrl) {
            DOM.detailAvatar.classList.add('placeholder');
            return;
        }

        DOM.detailAvatar.classList.add('loading');

        window.appState.fetchAvatar(target).then((localPath) => {
            if (token !== avatarLoadToken) return;
            if (localPath) {
                applyAvatarImage(token, localPath);
            } else {
                DOM.detailAvatar.classList.remove('loading');
            }
        }).catch(() => {
            if (token !== avatarLoadToken) return;
            DOM.detailAvatar.classList.remove('loading');
        });
    }

    function applyAvatarImage(token, path) {
        if (token !== avatarLoadToken) return;
        const fileUrl = toFileUrl(path);
        if (!fileUrl) return;

        DOM.detailAvatar.style.backgroundImage = `url("${fileUrl}")`;
        DOM.detailAvatar.classList.add('has-image');
        DOM.detailAvatar.classList.remove('loading');
        DOM.detailAvatar.classList.remove('placeholder');
        if (DOM.detailAvatarInitials) {
            DOM.detailAvatarInitials.textContent = '';
        }
    }

    // Start timer interval
    function startTimerInterval() {
        if (timerInterval) clearInterval(timerInterval);
        
        timerInterval = setInterval(() => {
            const target = window.appState.getSelectedTarget();
            if (target) {
                updateDetailTimer(target);
            }

            reminderTick();

            updateSmartStatusCountdowns();

            if (window.appState.currentView === 'bounties') {
                const nowTick = Date.now();
                if (!bountyRenderTick || nowTick - bountyRenderTick > 60000) {
                    renderBountyWatchlist();
                    bountyRenderTick = nowTick;
                }
            }

            if (activeCountdownTargets.size === 0) return;

            for (const userId of Array.from(activeCountdownTargets)) {
                const t = window.appState.getTarget(userId);
                const metaEl = getTargetMetaElement(userId);
                if (!t || !metaEl) {
                    activeCountdownTargets.delete(userId);
                    continue;
                }

                // Get NUMERIC time to properly detect when timer expires
                const timeRemainingSeconds = t.getTimeRemaining();
                const formattedTime = t.getFormattedTimeRemaining();
                const level = t.level ? `Lv.${t.level}` : '';

                // Check if timer has expired (0 or less)
                if (timeRemainingSeconds !== null && timeRemainingSeconds <= 0) {
                    metaEl.textContent = [level, '0s'].filter(Boolean).join(' • ');
                    requestStatusRecheck(userId);
                } else if (formattedTime) {
                    // Timer still running - display countdown
                    metaEl.textContent = [level, formattedTime].filter(Boolean).join(' • ');
                } else {
                    // No countdown
                    metaEl.textContent = level;
                    activeCountdownTargets.delete(userId);
                }
            }
        }, 1000);
    }

    // ========================================================================
    // GROUPS
    // ========================================================================

    function renderGroups() {
        const groups = window.appState.groups;
        const targets = window.appState.getTargets();

        // Count targets per group
        const groupCounts = { all: targets.length };
        groups.forEach(g => {
            groupCounts[g.id] = targets.filter(t => t.groupId === g.id).length;
        });

        // Update "All" count
        const groupAllCount = document.getElementById('group-all-count');
        if (groupAllCount) groupAllCount.textContent = groupCounts.all;

        // Render custom groups
        const customGroups = groups.filter(g => !g.isDefault);
        
        DOM.groupsList.innerHTML = '';
        DOM.groupsList.appendChild(createGroupElement({ id: 'all', name: 'All Targets', color: '#007acc' }, groupCounts.all));

        customGroups.forEach(group => {
            DOM.groupsList.appendChild(createGroupElement(group, groupCounts[group.id] || 0));
        });

        // Bind click events
        DOM.groupsList.querySelectorAll('.group-item').forEach(item => {
            item.addEventListener('click', () => {
                const groupId = item.dataset.group;
                DOM.groupsList.querySelectorAll('.group-item').forEach(g => g.classList.remove('active'));
                item.classList.add('active');
                window.appState.setActiveGroup(groupId);
            });

            // Add right-click context menu
            item.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                const groupId = item.dataset.group;
                showGroupContextMenu(e, groupId);
            });
        });
    }

    function createGroupElement(group, count) {
        const div = document.createElement('div');
        const activeClass = window.appState.activeGroupId === group.id ? 'active' : '';
        const flaggedClass = group.noAttack ? 'flagged-no-attack' : '';
        const safeColor = sanitizeHexColor(group.color);
        div.className = `group-item ${activeClass} ${flaggedClass}`;
        div.dataset.group = group.id;
        div.innerHTML = `
            <span class="group-color" style="background: ${safeColor};"></span>
            <span class="group-name">${escapeHtml(group.name)}</span>
            ${group.noAttack ? '<img src="assets/prevent.png" class="group-prevent-icon" title="Do Not Attack - Double-click protection enabled" alt="Prevent" />' : ''}
            <span class="group-count">${count}</span>
        `;
        return div;
    }

    function updateGroupSelects() {
        const groups = window.appState.groups;
        const selects = [
            DOM.detailGroup,
            document.getElementById('input-target-group'),
            document.getElementById('input-bulk-group')
        ];

        selects.forEach(select => {
            if (!select) return;
            const currentValue = select.value;
            const options = groups.map(g =>
                `<option value="${g.id}">${escapeHtml(g.name)}</option>`
            ).join('');
            if (select === DOM.selectionGroup) {
                select.innerHTML = `<option value="">Move to group...</option>${options}`;
            } else {
                select.innerHTML = options;
            }
            if (currentValue) select.value = currentValue;
        });
    }

    // ========================================================================
    // FILTER COUNTS
    // ========================================================================

    function updateFilterCounts() {
        const counts = window.appState.getFilterCounts();

        const filterAllCount = document.getElementById('filter-all-count');
        const filterOkayCount = document.getElementById('filter-okay-count');
        const filterHospitalCount = document.getElementById('filter-hospital-count');
        const filterJailCount = document.getElementById('filter-jail-count');
        const filterTravelingCount = document.getElementById('filter-traveling-count');
        const filterFavoritesCount = document.getElementById('filter-favorites-count');
        const filterErrorsCount = document.getElementById('filter-errors-count');

        if (filterAllCount) filterAllCount.textContent = counts.all;
        if (filterOkayCount) filterOkayCount.textContent = counts.okay;
        if (filterHospitalCount) filterHospitalCount.textContent = counts.hospital;
        if (filterJailCount) filterJailCount.textContent = counts.jail;
        if (filterTravelingCount) filterTravelingCount.textContent = counts.traveling;
        if (filterFavoritesCount) filterFavoritesCount.textContent = counts.favorites;
        if (filterErrorsCount) filterErrorsCount.textContent = counts.errors;

        // Activity bar badge
        if (counts.okay > 0) {
            DOM.attackableCount.textContent = counts.okay;
            DOM.attackableCount.style.display = 'flex';
        } else {
            DOM.attackableCount.style.display = 'none';
        }
    }

    // ========================================================================
    // STATUS BAR
    // ========================================================================

    function hideRefreshStatusUI() {
        if (DOM.statusNextRefresh) {
            DOM.statusNextRefresh.style.display = 'none';
        }
        if (DOM.statusRefresh) {
            DOM.statusRefresh.style.display = 'none';
        }
    }

    function updateStatusBar() {
        const stats = window.appState.getStatistics();
        
        hideRefreshStatusUI();
        DOM.attackableText.textContent = `${stats.attackableTargets} attackable`;
        DOM.targetsText.textContent = `${stats.totalTargets} targets`;
        updateRateText(stats.rateLimitStatus);
        updateConnectionStatus(window.appState.isOnline);
        renderHelpCenter();
    }

    function setStatusTone(element, tone) {
        if (!element) return;
        element.classList.remove('status-tone-good', 'status-tone-warn', 'status-tone-bad');
        const toneColors = {
            good: '#dff8f0',
            warn: '#f5f0c2',
            bad: '#ffd2d2'
        };
        if (!tone) {
            element.style.color = '';
            return;
        }
        element.classList.add(`status-tone-${tone}`);
        element.style.color = toneColors[tone] || '';
    }

    function formatSmartCountdown(ms) {
        if (ms === null || ms === undefined) return '--';
        if (ms <= 0) return 'now';
        if (ms < 1000) return '<1s';
        return formatDuration(ms);
    }

    function updateNextRefreshStatus(stats) {
        smartStatusState.nextRefreshAt = null;
        smartStatusState.refreshIntervalMs = null;
        smartStatusState.autoRefreshEnabled = false;
        smartStatusState.lastRefreshAt = window.appState.lastRefresh || stats?.lastRefresh || null;

        hideRefreshStatusUI();
        if (!DOM.statusNextRefreshText || !DOM.statusNextRefresh) return;

        DOM.statusNextRefreshText.textContent = 'On-demand when switching targets';
        if (DOM.statusRefreshMode) {
            DOM.statusRefreshMode.textContent = 'Manual';
            DOM.statusRefreshMode.classList.remove('good', 'warn', 'bad');
        }
        DOM.statusNextRefresh.style.display = 'none';
    }

    function updateSmartStatusCountdowns() {
        // Auto-refresh countdown removed; no periodic status updates required.
    }

    // ========================================================================
    // COMMAND PALETTE (QUICK ACTIONS)
    // ========================================================================

    function buildCommandList() {
        const state = window.appState || {};
        const settings = state.settings || {};
        const selected = state.getSelectedTarget ? state.getSelectedTarget() : null;
        const selectedIds = getSelectedTargetIds();
        const selectedTargets = getTargetsForIds(selectedIds);
        const hasTargets = (state.getTargets?.() || []).length > 0;
        const hasSelection = selectedTargets.length > 0;

        const items = [
            { id: 'add-target', label: 'Add Target', detail: 'Open add target dialog', shortcut: 'Ctrl+N', action: () => openModal('modal-add-target') },
            { id: 'bulk-add', label: 'Bulk Import Targets', detail: 'Paste IDs or URLs', shortcut: 'Ctrl+Shift+B', action: () => openModal('modal-bulk-add') },
            { id: 'bulk-add-clipboard', label: 'Bulk Import from Clipboard', detail: 'Paste clipboard into bulk import', keywords: 'paste ids', action: () => openBulkImportFromClipboard() },
            { id: 'refresh-all', label: 'Refresh All Targets', detail: 'Force live status update', shortcut: 'Ctrl+R', enabled: () => hasTargets, action: () => window.appState.refreshAllTargets() },
            { id: 'focus-search', label: 'Focus Target Search', detail: 'Search visible targets', shortcut: 'Ctrl+F', action: () => focusTargetSearch() },
            { id: 'clear-search-filters', label: 'Clear Search and Filters', detail: 'Return to all targets', shortcut: 'Ctrl+Shift+F', action: () => clearTargetFilters() },
            { id: 'select-all-visible', label: 'Select All Visible Targets', detail: 'Select the current filtered list', shortcut: 'Ctrl+A', enabled: () => hasTargets, action: () => handleSelectAllTargets() },
            { id: 'open-settings', label: 'Open Settings', detail: 'Tune preferences', shortcut: 'Ctrl+,', action: () => switchView('settings') },
            { id: 'view-targets', label: 'View Targets', detail: 'Main list', shortcut: 'Ctrl+1', action: () => switchView('targets') },
            { id: 'view-history', label: 'View History', detail: 'Recent attacks', shortcut: 'Ctrl+2', action: () => switchView('history') },
            { id: 'view-statistics', label: 'View Statistics', detail: 'Aggregated metrics', shortcut: 'Ctrl+3', action: () => switchView('statistics') },
            { id: 'view-loot', label: 'View Loot Timer', detail: 'Loot availability', shortcut: 'Ctrl+4', action: () => switchView('loot-timer') },
            { id: 'view-bounties', label: 'View Bounties', detail: 'Bounty stats & watchlist', shortcut: 'Ctrl+5', action: () => switchView('bounties') },
            { id: 'view-help', label: 'Open Help Center', detail: 'Guides and troubleshooting', shortcut: 'Ctrl+6', action: () => switchView('help') },
            { id: 'open-connection', label: 'Check Connections', detail: 'Open connection health dialog', action: () => openConnectionDialog() },
            { id: 'open-backup', label: 'Backup & Restore', detail: 'Export or import your data', action: () => switchView('backup') },
            { id: 'open-about', label: 'About', detail: 'Version, data path', action: () => showAboutModal() },
            { id: 'open-data-folder', label: 'Open Data Folder', detail: 'Jump to storage location', action: () => window.electronAPI?.openAppPath?.('data') },
            { id: 'open-logs-folder', label: 'Open Logs Folder', detail: 'Jump to diagnostic logs', action: () => openLogsFolder() },
            { id: 'toggle-compact', label: settings.compactMode ? 'Disable Compact Mode' : 'Enable Compact Mode', detail: 'Adjust density', action: () => window.appState.updateSettings({ compactMode: !settings.compactMode }) },
            selected ? { id: 'attack-selected', label: 'Attack Selected Target', detail: 'Open attack link', shortcut: 'Enter', action: () => handleAttack() } : null,
            selected ? { id: 'open-profile', label: 'Open Selected Profile', detail: 'View target profile', action: () => handleProfile() } : null,
            hasSelection ? { id: 'refresh-selection', label: `Refresh Selected (${selectedTargets.length})`, detail: 'Update selected targets', shortcut: 'Ctrl+Shift+R', action: () => refreshSelectedTargets() } : null,
            selected ? { id: 'toggle-favorite', label: 'Toggle Favorite', detail: 'Mark selected target', shortcut: 'F', action: () => window.appState.toggleFavorite(selected.userId) } : null,
            hasSelection ? { id: 'watch-selection', label: 'Toggle Watch for Selection', detail: 'Enable or disable release alerts', shortcut: 'W', action: () => toggleWatchForTargets(selectedTargets) } : null,
            hasSelection ? { id: 'copy-selected-ids', label: `Copy Selected IDs (${selectedTargets.length})`, detail: 'Copy one ID per line', shortcut: 'Ctrl+Shift+C', action: () => copyTargetsToClipboard(selectedTargets, 'ids') } : null,
            hasSelection ? { id: 'copy-selected-profiles', label: 'Copy Selected Profile Links', detail: 'Copy Torn profile URLs', action: () => copyTargetsToClipboard(selectedTargets, 'profiles') } : null,
            hasSelection ? { id: 'copy-selected-attacks', label: 'Copy Selected Attack Links', detail: 'Copy Torn attack URLs', action: () => copyTargetsToClipboard(selectedTargets, 'attacks') } : null,
            selected ? { id: 'remove-selected', label: 'Remove Selected Target', detail: 'Delete from list', shortcut: 'Del', action: () => handleRemoveTarget() } : null,
            { id: 'backup-now', label: 'Create Backup', detail: 'Manual backup', action: () => handleCreateBackup() },
            { id: 'export-targets', label: 'Export Targets', detail: 'Save to file', action: () => handleExportTargets() },
            { id: 'import-targets', label: 'Import Targets', detail: 'Load from file', action: () => handleImportTargets() },
            { id: 'launch-onboarding', label: 'Launch Onboarding', detail: 'Guided setup', shortcut: 'F1', action: () => showOnboarding(true) },
            { id: 'show-command-palette', label: 'Show Command Palette', detail: 'Search quick actions', shortcut: 'Ctrl+Shift+P', action: () => openCommandPalette() }
        ];

        const targetCommands = (state.getFilteredTargets?.() || [])
            .slice(0, 30)
            .map(target => ({
                id: `target-${target.userId}`,
                label: `Select ${target.getDisplayName?.() || `User ${target.userId}`}`,
                detail: `Target #${target.userId}${target.statusState ? ` | ${target.statusState}` : ''}`,
                keywords: `target user profile ${target.userId} ${target.faction || ''} ${target.notes || ''}`,
                action: () => {
                    switchView('targets');
                    window.appState.selectTarget(target.userId, { anchorId: target.userId });
                }
            }));

        return [...items, ...targetCommands]
            .filter(item => item && (!item.enabled || item.enabled()))
            .map(item => ({
                ...item,
                search: `${item.label} ${item.detail || ''} ${item.keywords || ''}`.toLowerCase()
            }));
    }

    function scoreCommand(cmd, words) {
        if (words.length === 0) return 0;
        let score = 0;
        const label = cmd.label.toLowerCase();
        words.forEach(word => {
            if (label.startsWith(word)) score += 3;
            else if (label.includes(word)) score += 2;
            else if (cmd.search.includes(word)) score += 1;
        });
        return score;
    }

    function renderCommandPalette(query = '') {
        if (!DOM.commandPaletteList || !DOM.commandPaletteEmpty) return;
        const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
        commandPaletteState.commands = buildCommandList();
        const currentIndex = commandPaletteState.highlightIndex || 0;
        const filtered = commandPaletteState.commands
            .map(cmd => {
                const matches = words.every(w => cmd.search.includes(w));
                if (!matches) return null;
                return { cmd, score: scoreCommand(cmd, words) };
            })
            .filter(Boolean)
            .sort((a, b) => b.score - a.score || a.cmd.label.localeCompare(b.cmd.label))
            .map(item => item.cmd);

        commandPaletteState.filtered = filtered;
        commandPaletteState.highlightIndex = Math.min(currentIndex, Math.max(0, filtered.length - 1));

        if (filtered.length === 0) {
            DOM.commandPaletteList.innerHTML = '';
            DOM.commandPaletteEmpty.style.display = 'block';
            return;
        }

        DOM.commandPaletteEmpty.style.display = 'none';
        const html = filtered.map((cmd, idx) => `
            <div class="command-item ${idx === commandPaletteState.highlightIndex ? 'active' : ''}" data-index="${idx}">
                <div class="command-meta">
                    <div class="command-title">${escapeHtml(cmd.label)}</div>
                    ${cmd.detail ? `<div class="command-detail">${escapeHtml(cmd.detail)}</div>` : ''}
                </div>
                ${cmd.shortcut ? `<div class="command-shortcut">${escapeHtml(cmd.shortcut)}</div>` : ''}
            </div>
        `).join('');
        DOM.commandPaletteList.innerHTML = html;
    }

    function openCommandPalette(initialQuery = '') {
        if (!DOM.commandPaletteOverlay || !DOM.commandPaletteInput) return;
        DOM.commandPaletteOverlay.classList.add('visible');
        commandPaletteState.highlightIndex = 0;
        renderCommandPalette(initialQuery);
        DOM.commandPaletteInput.value = initialQuery;
        DOM.commandPaletteInput.focus();
        if (initialQuery) {
            DOM.commandPaletteInput.setSelectionRange(initialQuery.length, initialQuery.length);
        }
    }

    function closeCommandPalette() {
        if (!DOM.commandPaletteOverlay || !DOM.commandPaletteInput) return;
        DOM.commandPaletteOverlay.classList.remove('visible');
        DOM.commandPaletteInput.value = '';
    }

    function moveCommandHighlight(delta) {
        const total = commandPaletteState.filtered.length;
        if (total === 0) return;
        commandPaletteState.highlightIndex = (commandPaletteState.highlightIndex + delta + total) % total;
        renderCommandPalette(DOM.commandPaletteInput?.value || '');
    }

    function executeHighlightedCommand() {
        const cmd = commandPaletteState.filtered[commandPaletteState.highlightIndex];
        if (!cmd) return;
        closeCommandPalette();
        Promise.resolve()
            .then(() => cmd.action?.())
            .catch(error => {
                console.error('Command execution failed', error);
                showToast?.('Command failed: ' + error.message, 'error');
            });
    }

    function handleGlobalCommandPaletteShortcut(event) {
        const overlayOpen = DOM.commandPaletteOverlay?.classList.contains('visible');
        const isInput = ['input', 'textarea'].includes((event.target?.tagName || '').toLowerCase()) || event.target?.isContentEditable;

        const openShortcut = event.key === 'P' && event.shiftKey && (event.ctrlKey || event.metaKey);
        if (openShortcut && !overlayOpen) {
            event.preventDefault();
            if (!isInput) {
                openCommandPalette('');
            }
            return;
        }

        if (overlayOpen) {
            if (event.key === 'Escape') {
                event.preventDefault();
                closeCommandPalette();
            } else if (event.key === 'ArrowDown') {
                event.preventDefault();
                moveCommandHighlight(1);
            } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                moveCommandHighlight(-1);
            } else if (event.key === 'Enter') {
                event.preventDefault();
                executeHighlightedCommand();
            }
        }
    }

    function updateRateText(rateStatus) {
        if (!DOM.rateText) return;
        const status = rateStatus || window.appState.limiter.getStatus();
        if (!status) {
            DOM.rateText.textContent = 'Rate: --';
            return;
        }

        const max = status.maxTokens || 100;
        const penalty = status.penaltyRemaining || 0;
        const cooldownRemaining = status.cooldownRemaining || 0;
        const recentRequests = status.recentRequests || 0;
        const utilization = status.utilizationPercent || 0;
        const availableTokens = status.availableTokens || 0;
        const timeUntilNextToken = status.timeUntilNextToken || 0;
        const windowMs = status.windowMs || (status.maxTokens && status.refillRate ? Math.round((status.maxTokens / status.refillRate) * 1000) : 60000);

        // Calculate remaining in 60-second window
        const remainingInWindow = Math.max(0, max - recentRequests);

        // Show the MINIMUM of:
        // 1. Remaining in window (based on 60s rolling window)
        // 2. Available tokens (what's actually available RIGHT NOW)
        // This accounts for burst requests that empty the token bucket
        const actuallyAvailable = Math.min(remainingInWindow, availableTokens);

        // Build status text that makes logical sense
        let text = `Rate: ${actuallyAvailable}/${max}`;

        // Add penalty warning if active
        if (penalty > 0) {
            const waitSeconds = Math.ceil(penalty / 1000);
            text += ` (|| ${waitSeconds}s)`;
        }
        // Add utilization indicator when high
        else if (utilization > 80) {
            text += ` (${utilization}%)`;
        }
        // Show recent request count when active
        else if (recentRequests > 0) {
            text += ` (${recentRequests} used)`;
        }

        DOM.rateText.textContent = text;

        // Add visual indicator classes based on remaining capacity
        const statusRate = DOM.rateText.parentElement;
        statusRate?.classList.remove('rate-low', 'rate-medium', 'rate-high', 'rate-penalty');

        if (penalty > 0) {
            statusRate?.classList.add('rate-penalty');
        } else if (remainingInWindow < max * 0.2) {
            statusRate?.classList.add('rate-low');
        } else if (remainingInWindow < max * 0.5) {
            statusRate?.classList.add('rate-medium');
        } else {
            statusRate?.classList.add('rate-high');
        }

        // Update popover values to show remaining in window
        if (DOM.ratePopoverAvailable) {
            DOM.ratePopoverAvailable.textContent = `${remainingInWindow}/${max}`;
        }
        if (DOM.ratePopoverRecent) {
            DOM.ratePopoverRecent.textContent = recentRequests.toString();
        }
        if (DOM.ratePopoverUtilization) {
            DOM.ratePopoverUtilization.textContent = `${utilization}%`;
        }
        const longestPenalty = Math.max(penalty, cooldownRemaining);
        if (DOM.ratePopoverPenaltyCard && DOM.ratePopoverPenalty) {
            if (longestPenalty > 0) {
                DOM.ratePopoverPenaltyCard.style.opacity = '';
                DOM.ratePopoverPenalty.textContent = formatDuration(longestPenalty);
            } else {
                DOM.ratePopoverPenaltyCard.style.opacity = 0.7;
                DOM.ratePopoverPenalty.textContent = 'None';
            }
        }
        const stats = status.stats || {};
        const successCount = stats.successfulRequests || 0;
        const failedCount = stats.failedRequests || 0;
        const totalTracked = successCount + failedCount;
        const successPct = totalTracked > 0 ? Math.round((successCount / totalTracked) * 100) : 0;
        const failedPct = totalTracked > 0 ? Math.max(0, 100 - successPct) : 0;

        if (DOM.ratePopoverSuccess) {
            DOM.ratePopoverSuccess.textContent = successCount.toString();
        }
        if (DOM.ratePopoverFailed) {
            DOM.ratePopoverFailed.textContent = failedCount.toString();
        }
        if (DOM.ratePopoverSuccessPercent) {
            DOM.ratePopoverSuccessPercent.textContent = `${successPct}%`;
        }
        if (DOM.ratePopoverFailedPercent) {
            DOM.ratePopoverFailedPercent.textContent = `${failedPct}%`;
        }
        if (DOM.ratePopoverSuccessBar) {
            DOM.ratePopoverSuccessBar.style.width = `${successPct}%`;
        }
        if (DOM.ratePopoverFailedBar) {
            DOM.ratePopoverFailedBar.style.width = `${failedPct}%`;
        }
        if (DOM.ratePopoverNextToken) {
            DOM.ratePopoverNextToken.textContent = timeUntilNextToken > 0 ? formatDuration(timeUntilNextToken) : 'Ready';
        }
        if (DOM.ratePopoverWindow) {
            const secs = Math.round(windowMs / 1000);
            DOM.ratePopoverWindow.textContent = `Rolling ${secs}s window · burst protected`;
        }
        if (DOM.rateMeterFill) {
            const percent = Math.max(0, Math.min(100, (actuallyAvailable / max) * 100));
            DOM.rateMeterFill.style.width = `${percent}%`;
        }
        if (DOM.rateMeterAvailable) {
            DOM.rateMeterAvailable.textContent = `${actuallyAvailable}`;
        }
        if (DOM.rateMeterMax) {
            DOM.rateMeterMax.textContent = `${max}`;
        }
        if (DOM.rateChipState) {
            const chipEl = DOM.rateChipState;
            chipEl.className = 'rate-chip';
            if (longestPenalty > 0) {
                chipEl.textContent = 'Cooldown';
                chipEl.classList.add('cooldown');
            } else if (utilization > 80 || remainingInWindow < max * 0.2) {
                chipEl.textContent = 'High Load';
                chipEl.classList.add('warn');
            } else {
                chipEl.textContent = 'Stable';
                chipEl.classList.add('ok');
            }
        }
    }

    function getConnectionSignals(overrideInternet = null) {
        const parseOptionalFlag = (key) => {
            const value = localStorage.getItem(key);
            if (value === null) return null;
            return value === 'true';
        };

        const storedInternet = localStorage.getItem('connection_internet');
        const internet = overrideInternet !== null && overrideInternet !== undefined
            ? overrideInternet
            : (storedInternet === null ? navigator.onLine : storedInternet === 'true');

        return {
            internet,
            api: parseOptionalFlag('connection_tornapi'),
            stats: parseOptionalFlag('connection_tornstats')
        };
    }

    function updateSignalBadges(signals) {
        if (!DOM.statusSignalBadges) return;
        DOM.statusSignalBadges.querySelectorAll('span').forEach(span => {
            const key = span.dataset.signal;
            span.classList.remove('active', 'warn', 'off');
            const isUp = signals[key];
            if (isUp === true) {
                span.classList.add('active');
            } else if (isUp === null) {
                span.classList.add('warn');
            } else if (signals.internet && key !== 'internet') {
                span.classList.add('warn');
            } else {
                span.classList.add('off');
            }
        });
    }

    function updateConnectionStatus(isOnline) {
        if (!DOM.statusConnection) return;

        DOM.statusConnection.classList.toggle('offline', !isOnline);
        const statusText = DOM.statusConnectionText
            || DOM.statusConnection.querySelector('.status-value')
            || DOM.statusConnection.querySelector('span');
        if (statusText) {
            statusText.textContent = isOnline ? 'Connected' : 'Offline';
        }

        const signals = getConnectionSignals(isOnline);
        if (DOM.statusConnectionDetail) {
            const labelMap = { internet: 'Net', api: 'API', stats: 'Stats' };
            const down = Object.entries(signals)
                .filter(([, up]) => up === false)
                .map(([key]) => labelMap[key] || key);
            const unknown = Object.entries(signals)
                .filter(([, up]) => up === null)
                .map(([key]) => labelMap[key] || key);

            if (unknown.length === Object.keys(signals).length) {
                DOM.statusConnectionDetail.textContent = 'Checking...';
            } else if (down.length === 0 && unknown.length === 0) {
                DOM.statusConnectionDetail.textContent = 'Net • API • Stats locked';
            } else {
                const segments = [];
                if (down.length) segments.push(`${down.join(' / ')} down`);
                if (unknown.length) segments.push(`${unknown.join(' / ')} pending`);
                DOM.statusConnectionDetail.textContent = segments.join(' • ');
            }
        }
        updateSignalBadges(signals);

        // Update connection dialog if it's open
        if (DOM.connectionDialog?.classList.contains('active')) {
            updateConnectionDialogState();
        }
    }

    // ========================================================================
    // HISTORY
    // ========================================================================

    function renderHistory() {
        const historyList = DOM.historyList || document.getElementById('history-list');
        if (!historyList) return;

        // Sync controls with filter state
        DOM.historyRangeButtons?.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.historyRange === historyFilters.range);
        });
        if (DOM.historySearch && DOM.historySearch.value !== (historyFilters.query || '')) {
            DOM.historySearch.value = historyFilters.query || '';
        }

        const sourceHistory = safeHistoryArray(window.appState.attackHistory);
        const filtered = applyHistoryFilters(sourceHistory);
        updateHistoryStats(filtered, sourceHistory);

        if (filtered.length === 0) {
            const reason = sourceHistory.length === 0 ? 'No attack history yet' : 'No attacks match this filter';
            historyList.innerHTML = `<div class="empty-list"><p>${reason}</p></div>`;
            return;
        }

        const sorted = filtered.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        let currentDay = '';

        const itemsHtml = sorted.map(record => {
            const dayLabel = formatHistoryDayLabel(record.timestamp);
            const statusClass = getHistoryStatusClass(record.status);
            const statusLabel = (record.status || 'Unknown').toUpperCase();
            const absoluteTime = formatDateTime(record.timestamp);
            const name = escapeHtml(record.targetName || `User ${record.userId}`);
            const groupLabel = record.groupName ? `<span class="history-chip" title="Group">${escapeHtml(record.groupName)}</span>` : '';
            const levelLabel = record.level ? `Lv. ${record.level}` : 'Level ?';
            const sourceLabel = formatHistorySource(record.source);
            const statusDesc = record.statusDesc || statusLabel;

            const dayHeader = dayLabel !== currentDay
                ? `<div class="history-day">${dayLabel}</div>`
                : '';
            currentDay = dayLabel;

            return `
                ${dayHeader}
                <div class="history-item premium" data-user-id="${record.userId}">
                    <div class="history-timeline">
                        <span class="history-timeline-dot ${statusClass}"></span>
                        <span class="history-time" title="${absoluteTime}">${formatTimestamp(record.timestamp)}</span>
                    </div>
                    <div class="history-info">
                        <div class="history-row">
                            <div class="history-title">
                                <span class="history-name">${name}</span>
                                <span class="history-id">#${record.userId}</span>
                                ${groupLabel}
                            </div>
                            <div class="history-meta">
                                <span class="history-status ${statusClass}">${escapeHtml(statusLabel)}</span>
                                <span class="history-chip subtle">${escapeHtml(sourceLabel)}</span>
                            </div>
                        </div>
                        <div class="history-row secondary">
                            <span class="history-meta-item">${escapeHtml(levelLabel)}</span>
                            <span class="history-meta-item">Status: ${escapeHtml(statusDesc)}</span>
                            <span class="history-meta-item">Day: ${escapeHtml(dayLabel)}</span>
                        </div>
                    </div>
                    <div class="history-actions">
                        <button class="history-action" data-user-id="${record.userId}" title="Attack again">
                            <svg viewBox="0 0 24 24"><path fill="currentColor" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        historyList.innerHTML = itemsHtml;

        // Bind select on item click
        historyList.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                const uid = parseInt(item.dataset.userId, 10);
                if (!Number.isNaN(uid)) {
                    switchView('targets');
                    window.appState.selectTarget(uid);
                }
            });
        });

        // Bind attack buttons
        historyList.querySelectorAll('.history-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                handleAttackById(parseInt(btn.dataset.userId, 10), 'history');
            });
        });
    }

    function applyHistoryFilters(history) {
        const now = Date.now();
        const rangeMs = {
            '24h': 86400000,
            '7d': 7 * 86400000,
            '30d': 30 * 86400000
        };
        const activeRange = historyFilters.range === 'all' ? null : (rangeMs[historyFilters.range] || rangeMs['7d']);
        const query = (historyFilters.queryLower || historyFilters.query || '').trim();

        return safeHistoryArray(history).filter(record => {
            const ts = new Date(record.timestamp).getTime();
            if (Number.isNaN(ts)) return false;
            if (activeRange !== null && now - ts > activeRange) return false;
            if (!query) return true;

            const haystack = `${record.targetName || ''} ${record.userId} ${record.groupName || ''}`.toLowerCase();
            return haystack.includes(query);
        });
    }

    function updateHistoryStats(filtered, fullHistory) {
        const rangeLabelMap = {
            '24h': 'Last 24h',
            '7d': 'Last 7 days',
            '30d': 'Last 30 days',
            'all': 'All visible'
        };
        const rangeLabel = rangeLabelMap[historyFilters.range] || 'Filtered';
        const chipLabel = rangeLabel.toLowerCase();
        const uniqueTargets = new Set(filtered.map(r => r.userId)).size;
        const streak = calculateAttackStreak(fullHistory);
        const top = getTopTarget(filtered);
        const iconAttack = '<div class="history-stat-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3l7 7m0 0-7 7m7-7 4 4 4-4-4-4-4 4z"/></svg></div>';
        const iconUnique = '<div class="history-stat-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg></div>';
        const iconStreak = '<div class="history-stat-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h4l3-8 4 16 3-8h4"/></svg></div>';
        const iconTop = '<div class="history-stat-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l2.09 6.26L20 9l-4.91 3.58L16.18 19 12 15.9 7.82 19l1.09-6.42L4 9l5.91-.74L12 2z"/></svg></div>';

        if (DOM.historyStatTotal) {
            DOM.historyStatTotal.innerHTML = `
                <div class="history-stat-head">
                    <span class="history-stat-kicker">Volume</span>
                    <span class="history-stat-chip">${escapeHtml(rangeLabel)}</span>
                </div>
                <div class="history-stat-body">
                    ${iconAttack}
                    <div>
                        <div class="history-stat-value">${formatNumber(filtered.length)}</div>
                        <div class="history-stat-label">Attacks</div>
                        <div class="history-stat-meta">in ${escapeHtml(chipLabel)}</div>
                    </div>
                </div>
            `;
        }

        if (DOM.historyStatUnique) {
            DOM.historyStatUnique.innerHTML = `
                <div class="history-stat-head">
                    <span class="history-stat-kicker">Coverage</span>
                    <span class="history-stat-chip">Unique</span>
                </div>
                <div class="history-stat-body">
                    ${iconUnique}
                    <div>
                        <div class="history-stat-value">${formatNumber(uniqueTargets)}</div>
                        <div class="history-stat-label">Unique Targets</div>
                        <div class="history-stat-meta">in ${escapeHtml(chipLabel)}</div>
                    </div>
                </div>
            `;
        }

        if (DOM.historyStatStreak) {
            DOM.historyStatStreak.innerHTML = `
                <div class="history-stat-head">
                    <span class="history-stat-kicker">Consistency</span>
                    <span class="history-stat-chip">Daily</span>
                </div>
                <div class="history-stat-body">
                    ${iconStreak}
                    <div>
                        <div class="history-stat-value">${formatNumber(streak)}d</div>
                        <div class="history-stat-label">Day Streak</div>
                        <div class="history-stat-meta">consecutive days with attacks</div>
                    </div>
                </div>
            `;
        }

        if (DOM.historyStatTop) {
            DOM.historyStatTop.innerHTML = top ? `
                <div class="history-stat-head">
                    <span class="history-stat-kicker">Standout</span>
                    <span class="history-stat-chip">Most hit</span>
                </div>
                <div class="history-stat-body">
                    ${iconTop}
                    <div>
                        <div class="history-stat-value">${escapeHtml(top.name)}</div>
                        <div class="history-stat-label">Top Target</div>
                        <div class="history-stat-meta">${formatNumber(top.count)} attack${top.count === 1 ? '' : 's'}${top.group ? ` &bull; ${escapeHtml(top.group)}` : ''}</div>
                    </div>
                </div>
            ` : `
                <div class="history-stat-head">
                    <span class="history-stat-kicker">Standout</span>
                    <span class="history-stat-chip">Most hit</span>
                </div>
                <div class="history-stat-body">
                    ${iconTop}
                    <div>
                        <div class="history-stat-value">None</div>
                        <div class="history-stat-label">Top Target</div>
                        <div class="history-stat-meta">No data yet</div>
                    </div>
                </div>
            `;
        }
    }

    function formatHistoryDayLabel(timestamp) {
        const date = new Date(timestamp);
        if (Number.isNaN(date.getTime())) return 'Unknown date';

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dateOnly = new Date(date);
        dateOnly.setHours(0, 0, 0, 0);

        const diffDays = Math.floor((today - dateOnly) / 86400000);
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    }

    function getHistoryStatusClass(status) {
        const normalized = (status || '').toLowerCase();
        switch (normalized) {
            case 'okay':
            case 'ok':
                return 'status-okay';
            case 'hospital':
                return 'status-hospital';
            case 'jail':
            case 'jailed':
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

    function formatHistorySource(source) {
        switch (source) {
            case 'history':
                return 'History panel';
            case 'list':
                return 'Target list';
            case 'detail':
                return 'Target detail';
            case 'context-menu':
                return 'Context menu';
            case 'keyboard':
                return 'Keyboard shortcut';
            case 'targets':
            case 'manual':
            default:
                return source ? source.charAt(0).toUpperCase() + source.slice(1) : 'Manual';
        }
    }

    function calculateAttackStreak(history) {
        const dateSet = new Set();
        safeHistoryArray(history).forEach(record => {
            const ts = new Date(record.timestamp);
            if (!Number.isNaN(ts.getTime())) {
                dateSet.add(ts.toISOString().slice(0, 10));
            }
        });

        let streak = 0;
        const cursor = new Date();
        cursor.setHours(0, 0, 0, 0);

        while (dateSet.has(cursor.toISOString().slice(0, 10))) {
            streak++;
            cursor.setDate(cursor.getDate() - 1);
        }

        return streak;
    }

    function getTopTarget(history) {
        if (!history || history.length === 0) return null;
        const counts = history.reduce((acc, record) => {
            const key = record.userId;
            if (!acc[key]) {
                acc[key] = { count: 0, name: record.targetName || `User ${record.userId}`, group: record.groupName || '' };
            }
            acc[key].count += 1;
            return acc;
        }, {});

        return Object.values(counts).sort((a, b) => b.count - a.count)[0] || null;
    }

    // ========================================================================
    // BOUNTIES
    // ========================================================================

    function renderBountyPanel(force = false) {
        renderBountyStats();
        renderBountyWatchlist(force);
        updateBountyAlertUI();
    }

    function renderBountyStats() {
        if (!DOM.bountyStats) return;
        const stats = window.appState.getBountyStats ? window.appState.getBountyStats() : {};
        const setValue = (el, value, formatter = formatNumber) => {
            if (!el) return;
            el.textContent = value === null || value === undefined ? '--' : formatter(value);
        };

        setValue(DOM.bountyStats.collected, stats.collected);
        setValue(DOM.bountyStats.placed, stats.placed);
        setValue(DOM.bountyStats.received, stats.received);
        setValue(DOM.bountyStats.reward, stats.reward, formatCurrency);
        setValue(DOM.bountyStats.spent, stats.spent, formatCurrency);
        setValue(DOM.bountyStats.valueOnYou, stats.valueOnYou, formatCurrency);

        if (DOM.bountyStatsUpdated) {
            DOM.bountyStatsUpdated.textContent = stats.lastUpdated
                ? `Last updated: ${formatDateTime(stats.lastUpdated)}`
                : 'Last updated: Never';
        }
    }

    function renderBountyWatchlist() {
        const listEl = DOM.bountyList;
        if (!listEl) return;

        if (window.appState?.tidyBounties) {
            window.appState.tidyBounties({ persist: false }).catch(() => {});
        }

        const watchlist = window.appState.getBountyWatchlist
            ? window.appState.getBountyWatchlist({ includeExpired: true, includeClaimed: true })
            : [];

        if (DOM.bountyEmptyState) {
            DOM.bountyEmptyState.style.display = watchlist.length === 0 ? '' : 'none';
        }

        if (watchlist.length === 0) {
            listEl.innerHTML = '';
            return;
        }

        listEl.innerHTML = watchlist.map(renderBountyItem).join('');
        bountyRenderTick = Date.now();
    }

    /**
     * Update only the bounty items associated with a specific target.
     * This prevents full re-renders that cause hover flickering.
     */
    function updateBountyItemsForTarget(targetId) {
        const listEl = DOM.bountyList;
        if (!listEl) return;

        const watchlist = window.appState.getBountyWatchlist
            ? window.appState.getBountyWatchlist({ includeExpired: true, includeClaimed: true })
            : [];

        // Find bounty entries that reference this target
        const relevantEntries = watchlist.filter(entry => entry.targetId === targetId);
        if (relevantEntries.length === 0) return;

        for (const entry of relevantEntries) {
            const existingItem = listEl.querySelector(`[data-bounty-id="${entry.id}"]`);
            if (existingItem) {
                const newHtml = renderBountyItem(entry);
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = newHtml;
                const newElement = tempDiv.firstElementChild;
                if (newElement) {
                    existingItem.replaceWith(newElement);
                }
            }
        }
    }

    function renderBountyItem(entry) {
        const now = Date.now();
        const target = entry.targetId ? window.appState.getTarget(entry.targetId) : null;
        const statusClass = target ? target.getStatusClass() : 'status-unknown';
        const statusLabel = target
            ? (target.statusState || 'Unknown')
            : (entry.isExpired ? 'Expired' : 'Untracked');
        const isOkay = target && target.statusState === 'Okay';
        const difficulty = target && window.appState.getTargetDifficulty
            ? window.appState.getTargetDifficulty(target)
            : null;
        const rewardLabel = entry.reward !== null ? formatCurrency(entry.reward) : '???';
        const expiryLabel = entry.expiresAt ? formatExpiry(entry.expiresAt) : 'No expiry';
        const addedLabel = formatTimestamp(entry.addedAt);
        const claimedLabel = entry.claimedAt ? formatTimestamp(entry.claimedAt) : '';
        const classes = ['bounty-item'];
        if (entry.isExpired) classes.push('expired');
        if (entry.claimedAt) classes.push('claimed');
        if (isOkay && !entry.claimedAt && !entry.isExpired) classes.push('attackable');
        const isExpiringSoon = !entry.isExpired && !entry.claimedAt && entry.expiresAt && (entry.expiresAt - now) < 24 * 60 * 60 * 1000;
        if (isExpiringSoon) classes.push('soon');

        const targetIdLabel = entry.targetId ? `<span class="bounty-target-id">#${entry.targetId}</span>` : '';
        const difficultyChip = difficulty ? `<span class="bounty-chip difficulty ${difficulty.className || ''}">${escapeHtml(difficulty.label || '')}</span>` : '';
        const targetChip = target
            ? `<span class="bounty-chip status ${statusClass}">${escapeHtml(statusLabel)}</span>`
            : `<span class="bounty-chip muted">${escapeHtml(statusLabel)}</span>`;
        const expiryChip = isExpiringSoon
            ? `<span class="bounty-chip warning">Expiring soon</span>`
            : '';

        // API data chips (from persisted bounty data)
        const levelChip = entry.level ? `<span class="bounty-chip level">Lv.${entry.level}</span>` : '';
        const factionChip = entry.faction ? `<span class="bounty-chip faction" title="${escapeHtml(entry.faction)}">${escapeHtml(entry.faction.length > 20 ? entry.faction.slice(0, 18) + '...' : entry.faction)}</span>` : '';

        // Show attack button prominently if target is Okay
        const attackBtn = entry.targetId && !entry.claimedAt && !entry.isExpired
            ? `<button class="bounty-action-btn ${isOkay ? 'attack' : ''}" data-bounty-action="attack" data-target-id="${entry.targetId}" ${!isOkay ? 'disabled title="Target not available"' : ''}>
                <svg class="bounty-action-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M19.78 2.2l2.02 2.02-2.2 7.36-4.78-1.58-6.58 6.58 1.58 4.78-7.36 2.2-2.02-2.02 2.2-7.36 4.78 1.58L14 9.18l-1.58-4.78 7.36-2.2z"/></svg>
                Attack
            </button>`
            : '';

        return `
            <div class="${classes.join(' ')}" data-bounty-id="${entry.id}">
                <div class="bounty-item-header">
                    <div class="bounty-title">
                        <span class="bounty-target-name">${escapeHtml(entry.targetName || 'Unknown target')}</span>
                        ${targetIdLabel}
                        ${levelChip}
                        ${targetChip}
                        ${difficultyChip}
                        ${expiryChip}
                    </div>
                    <div class="bounty-reward">${escapeHtml(rewardLabel)}</div>
                </div>
                <div class="bounty-item-body">
                    ${factionChip ? `<div class="bounty-faction-row">${factionChip}</div>` : ''}
                    <div class="bounty-meta">
                        <span class="bounty-meta-item">
                            <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z"/></svg>
                            ${escapeHtml(expiryLabel)}
                        </span>
                        <span class="bounty-meta-item">
                            <svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/></svg>
                            Added ${escapeHtml(addedLabel)}
                        </span>
                        ${entry.lastActionRelative ? `<span class="bounty-meta-item" title="Last seen activity">
                            <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                            ${escapeHtml(entry.lastActionRelative)}
                        </span>` : ''}
                        ${claimedLabel ? `<span class="bounty-meta-item bounty-claimed-badge">
                            <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                            Claimed ${escapeHtml(claimedLabel)}
                        </span>` : ''}
                    </div>
                    <div class="bounty-actions">
                        ${attackBtn}
                        ${entry.targetId ? `<button class="bounty-action-btn" data-bounty-action="view" data-target-id="${entry.targetId}">
                            <svg class="bounty-action-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                            Profile
                        </button>` : ''}
                        ${!entry.targetId ? `<button class="bounty-action-btn" data-bounty-action="track">
                            <svg class="bounty-action-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                            Add to Targets
                        </button>` : ''}
                        <button class="bounty-action-btn ${entry.claimedAt ? '' : 'success'}" data-bounty-action="${entry.claimedAt ? 'unclaim' : 'claim'}">
                            <svg class="bounty-action-icon" viewBox="0 0 24 24"><path fill="currentColor" d="${entry.claimedAt ? 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z' : 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'}"/></svg>
                            ${entry.claimedAt ? 'Unclaim' : 'Claimed'}
                        </button>
                        <button class="bounty-action-btn danger" data-bounty-action="remove" title="Remove from watchlist">
                            <svg class="bounty-action-icon bounty-action-icon--solo" viewBox="0 0 24 24"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async function handleAddBounty() {
        if (!window.appState?.addBountyEntry) return;
        const targetInput = (DOM.bountyTargetInput?.value || '').trim();
        const rewardInput = DOM.bountyRewardInput?.value || '';

        if (!targetInput) {
            showToast('Enter a target ID or name to track a bounty', 'info');
            DOM.bountyTargetInput?.focus();
            return;
        }

        // Show loading state
        const addBtn = document.getElementById('btn-add-bounty');
        const originalText = addBtn?.innerHTML;
        if (addBtn) {
            addBtn.disabled = true;
            addBtn.innerHTML = `<svg class="spin bounty-spinner-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8z"/></svg> Adding...`;
        }

        try {
            const result = await window.appState.addBountyEntry(targetInput, rewardInput);
            if (DOM.bountyTargetInput) DOM.bountyTargetInput.value = '';
            if (DOM.bountyRewardInput) DOM.bountyRewardInput.value = '';
            renderBountyWatchlist();
            const msg = result.updated
                ? `Updated bounty for ${result.entry.targetName}`
                : `Added ${result.entry.targetName} to watchlist`;
            showToast(msg, 'success');
        } catch (error) {
            console.error('Failed to add bounty', error);
            showToast(error.message || 'Could not add bounty', 'error');
        } finally {
            // Restore button state
            if (addBtn) {
                addBtn.disabled = false;
                addBtn.innerHTML = originalText;
            }
        }
    }

    async function handleRefreshBountyStats() {
        if (!window.appState?.refreshBountyStats) return;
        if (!window.appState.settings?.apiKey) {
            showToast('Add your API key in Settings to load bounty statistics', 'info');
            return;
        }

        DOM.btnRefreshBountyStats?.classList.add('spinning');
        try {
            await window.appState.refreshBountyStats();
            renderBountyStats();
            showToast('Bounty statistics refreshed', 'success');
        } catch (error) {
            console.error('Failed to refresh bounty stats', error);
            showToast(error.message || 'Unable to refresh bounty stats', 'error');
        } finally {
            DOM.btnRefreshBountyStats?.classList.remove('spinning');
        }
    }

    async function handleBountyListClick(e) {
        const actionBtn = e.target.closest('[data-bounty-action]');
        if (!actionBtn) return;
        if (actionBtn.disabled) return;

        const item = actionBtn.closest('.bounty-item');
        const entryId = item?.dataset.bountyId;
        if (!entryId) return;

        const action = actionBtn.dataset.bountyAction;
        const targetId = actionBtn.dataset.targetId ? parseInt(actionBtn.dataset.targetId, 10) : null;

        try {
            switch (action) {
                case 'attack': {
                    if (targetId && !Number.isNaN(targetId)) {
                        handleAttackById(targetId, 'bounty-watchlist', { selectTarget: false });
                    }
                    break;
                }
                case 'view': {
                    if (targetId && !Number.isNaN(targetId)) {
                        const url = `https://www.torn.com/profiles.php?XID=${targetId}`;
                        if (window.electronAPI?.openExternal) {
                            window.electronAPI.openExternal(url);
                        } else {
                            window.open(url, '_blank', 'noreferrer');
                        }
                    }
                    break;
                }
                case 'track': {
                    // Get bounty entry to find target info
                    const watchlist = window.appState.getBountyWatchlist ? window.appState.getBountyWatchlist() : [];
                    const entry = watchlist.find(b => b.id === entryId);
                    if (entry && entry.targetName) {
                        const targetLabel = entry.targetId ? String(entry.targetId) : entry.targetName;
                        const addedTarget = await window.appState.addTargetByName(targetLabel, {
                            customName: entry.targetName || undefined
                        });
                        if (addedTarget?.userId && window.appState.attachTargetToBounty) {
                            await window.appState.attachTargetToBounty(entry.id, addedTarget.userId, addedTarget.getDisplayName?.() || entry.targetName);
                        }
                        showToast(`Added ${entry.targetName || targetLabel} to target list`, 'success');
                        renderBountyWatchlist();
                    }
                    break;
                }
                case 'claim':
                    await window.appState.markBountyClaimed(entryId, true);
                    showToast('Bounty marked as claimed!', 'success');
                    break;
                case 'unclaim':
                    await window.appState.markBountyClaimed(entryId, false);
                    showToast('Bounty marked as active', 'info');
                    break;
                case 'remove': {
                    // Get entry name for confirmation
                    const watchlist = window.appState.getBountyWatchlist ? window.appState.getBountyWatchlist() : [];
                    const entry = watchlist.find(b => b.id === entryId);
                    const targetName = entry?.targetName || 'this bounty';

                    // Simple confirmation via item flash effect
                    if (item.classList.contains('confirm-remove')) {
                        await window.appState.removeBountyEntry(entryId);
                        showToast(`Removed ${targetName} from watchlist`, 'info');
                    } else {
                        item.classList.add('confirm-remove');
                        showToast('Click again to confirm removal', 'warning');
                        setTimeout(() => item?.classList.remove('confirm-remove'), 3000);
                        return; // Don't re-render yet
                    }
                    break;
                }
            }
            renderBountyWatchlist();
        } catch (error) {
            console.error('Failed to update bounty entry', error);
            showToast(error.message || 'Could not update bounty entry', 'error');
        }
    }

    async function handleDismissBountyAlert() {
        try {
            await window.appState.dismissBountyAlert();
        } catch (error) {
            console.error('Failed to dismiss bounty alert', error);
        } finally {
            updateBountyAlertUI();
        }
    }

    function updateBountyAlertUI() {
        const alert = window.appState.getBountyAlert ? window.appState.getBountyAlert() : { active: false, delta: 0 };
        const active = !!alert?.active;

        if (DOM.bountyAlertBadge) {
            DOM.bountyAlertBadge.style.display = active ? 'inline-flex' : 'none';
        }

        if (DOM.bountyAlertBanner) {
            DOM.bountyAlertBanner.style.display = active ? 'flex' : 'none';
            const textEl = DOM.bountyAlertBanner.querySelector('.bounty-alert-text');
            if (textEl) {
                const delta = alert?.delta || 0;
                textEl.textContent = delta > 1
                    ? `${delta} new bounties may be on you`
                    : 'A bounty may have been placed on you!';
            }
        }
    }

    // ========================================================================
    // STATISTICS
    // ========================================================================

    function renderStatistics() {
        const stats = window.appState.getStatistics();
        const statsHero = document.getElementById('stats-hero');
        const statsMetricsGrid = document.getElementById('stats-metrics-grid');
        if (!statsHero || !statsMetricsGrid) return;

        const totalTargets = stats.totalTargets || 0;
        const rateStatus = stats.rateLimitStatus || {};
        const rateCooldownMs = Math.max(rateStatus.penaltyRemaining || 0, rateStatus.cooldownRemaining || 0);
        const nextTokenMs = rateStatus.timeUntilNextToken || 0;

        const ensureHeroHydrated = () => {
            if (statsHero.dataset.hydrated === 'true') return;

            statsHero.innerHTML = `
                <div class="stats-hero-main">
                    <div class="stats-hero-primary">
                        <div class="stats-hero-value" data-stat="totalTargets">${formatNumber(totalTargets)}</div>
                        <div class="stats-hero-label">Total Targets</div>
                        <div class="stats-hero-meta">
                            <span class="hero-meta-item" data-stat="favoritesMeta">
                                <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                                ${formatNumber(stats.favoriteTargets || 0)} favorites
                            </span>
                            <span class="hero-meta-divider">|</span>
                            <span class="hero-meta-item ${stats.errorTargets ? 'error-highlight' : ''}" data-stat="errorsMeta">
                                ${formatNumber(stats.errorTargets || 0)} errors
                            </span>
                        </div>
                    </div>
                    <div class="stats-hero-quick">
                        <div class="stats-hero-quick-card success clickable" data-filter="okay" title="Click to view attackable targets">
                            <svg viewBox="0 0 24 24" class="hero-quick-icon"><path fill="currentColor" d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>
                            <div class="hero-quick-content">
                                <div class="hero-quick-value" data-stat="attackableTargets">${formatNumber(stats.attackableTargets)}</div>
                                <div class="hero-quick-label">Attackable</div>
                                <div class="hero-quick-meta" data-stat="attackablePercent">${formatPercent(stats.attackableTargets, totalTargets)} of list</div>
                            </div>
                        </div>
                        <div class="stats-hero-quick-card warning clickable" data-filter="hospital" title="Click to view hospitalized targets">
                            <svg viewBox="0 0 24 24" class="hero-quick-icon"><path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/></svg>
                            <div class="hero-quick-content">
                                <div class="hero-quick-value" data-stat="hospitalTargets">${formatNumber(stats.hospitalTargets)}</div>
                                <div class="hero-quick-label">In Hospital</div>
                                <div class="hero-quick-meta" data-stat="hospitalPercent">${formatPercent(stats.hospitalTargets, totalTargets)} of list</div>
                            </div>
                        </div>
                        <div class="stats-hero-quick-card info clickable" data-filter="traveling" title="Click to view traveling targets">
                            <svg viewBox="0 0 24 24" class="hero-quick-icon"><path fill="currentColor" d="M2.5 19h19v2h-19zm19.57-9.36c-.21-.8-1.04-1.28-1.84-1.06L14.92 10l-6.9-6.43-1.93.51 4.14 7.17-4.97 1.33-1.97-1.54-1.45.39 2.59 4.49s7.12-1.9 16.57-4.43c.81-.23 1.28-1.05 1.07-1.85z"/></svg>
                            <div class="hero-quick-content">
                                <div class="hero-quick-value" data-stat="travelingTargets">${formatNumber(stats.travelingTargets)}</div>
                                <div class="hero-quick-label">Traveling</div>
                                <div class="hero-quick-meta" data-stat="travelingPercent">${formatPercent(stats.travelingTargets, totalTargets)} of list</div>
                            </div>
                        </div>
                        <div class="stats-hero-quick-card accent">
                            <svg viewBox="0 0 24 24" class="hero-quick-icon"><path fill="currentColor" d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>
                            <div class="hero-quick-content">
                                <div class="hero-quick-value" data-stat="attacksLast24h">${formatNumber(stats.attacksLast24h || 0)}</div>
                                <div class="hero-quick-label">Attacks (24h)</div>
                                <div class="hero-quick-meta" data-stat="attacksTotalMeta">Total ${formatNumber(stats.totalAttacks || 0)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            statsHero.dataset.hydrated = 'true';

            statsHero.querySelectorAll('.stats-hero-quick-card.clickable').forEach(card => {
                card.addEventListener('click', () => {
                    const filter = card.dataset.filter;
                    if (filter) {
                        window.appState.setActiveGroup?.('all');
                        window.appState.setActiveFilter?.(filter);
                        window.appState.setSearchQuery?.('');
                        switchView('targets');
                        showToast(`Filtered to ${filter === 'okay' ? 'attackable' : filter} targets`, 'info');
                    }
                });
            });
        };

        ensureHeroHydrated();

        const updateHeroStat = (key, value) => {
            const el = statsHero.querySelector(`[data-stat="${key}"]`);
            if (el) el.textContent = value;
        };

        updateHeroStat('totalTargets', formatNumber(totalTargets));
        updateHeroStat('favoritesMeta', `${formatNumber(stats.favoriteTargets || 0)} favorites`);
        const errorsMeta = statsHero.querySelector('[data-stat="errorsMeta"]');
        if (errorsMeta) {
            errorsMeta.textContent = `${formatNumber(stats.errorTargets || 0)} errors`;
            errorsMeta.classList.toggle('error-highlight', (stats.errorTargets || 0) > 0);
        }
        updateHeroStat('attackableTargets', formatNumber(stats.attackableTargets));
        updateHeroStat('attackablePercent', `${formatPercent(stats.attackableTargets, totalTargets)} of list`);
        updateHeroStat('hospitalTargets', formatNumber(stats.hospitalTargets));
        updateHeroStat('hospitalPercent', `${formatPercent(stats.hospitalTargets, totalTargets)} of list`);
        updateHeroStat('travelingTargets', formatNumber(stats.travelingTargets));
        updateHeroStat('travelingPercent', `${formatPercent(stats.travelingTargets, totalTargets)} of list`);
        updateHeroStat('attacksLast24h', formatNumber(stats.attacksLast24h || 0));
        updateHeroStat('attacksTotalMeta', `Total ${formatNumber(stats.totalAttacks || 0)}`);

        // Metrics Grid - Secondary Stats
        const metricsCards = [
            {
                id: 'avg-level',
                icon: '<path fill="currentColor" d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16h2v2h-2zm0-6h2v4h-2z"/>',
                label: 'Avg Level',
                value: stats.avgLevel ? stats.avgLevel.toFixed(1) : 'n/a',
                meta: stats.maxLevel ? `Max ${formatNumber(stats.maxLevel)}` : 'No data',
                variant: 'level'
            },
            {
                id: 'top-group',
                icon: '<path fill="currentColor" d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/>',
                label: 'Top Group',
                value: stats.largestGroup ? escapeHtml(stats.largestGroup.name) : 'None',
                meta: stats.largestGroup ? `${formatNumber(stats.largestGroup.count)} targets / ${formatNumber(stats.customGroupsCount || 0)} groups` : `${formatNumber(stats.customGroupsCount || 0)} custom groups`,
                variant: 'group'
            },
            {
                id: 'last-attack',
                icon: '<path fill="currentColor" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>',
                label: 'Last Attack',
                value: stats.lastAttackAt ? formatTimestamp(stats.lastAttackAt) : 'Never',
                meta: totalTargets ? 'Keep the chain alive' : 'Add targets to begin',
                variant: 'time'
            },
            {
                id: 'last-refresh',
                icon: '<path fill="currentColor" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>',
                label: 'Last Refresh',
                value: stats.lastRefresh ? formatTimestamp(stats.lastRefresh) : 'Never',
                meta: 'Updates when you switch targets',
                variant: 'refresh'
            },
            {
                id: 'targets-added',
                icon: '<path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/><path fill="currentColor" d="M12.5 6.5v3h3v1h-3v3h-1v-3h-3v-1h3v-3z"/>',
                label: 'Targets Added',
                value: formatNumber(stats.targetsAdded || 0),
                meta: `Removed ${formatNumber(stats.targetsRemoved || 0)}`,
                variant: 'targets'
            },
            {
                id: 'rate-tokens',
                icon: '<path fill="currentColor" d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z"/>',
                label: 'Rate Tokens',
                value: formatNumber(rateStatus.availableTokens ?? 0),
                meta: rateCooldownMs > 0 ? `Cooldown ${formatDuration(rateCooldownMs)}` : `Next token ${formatDuration(nextTokenMs)}`,
                variant: rateCooldownMs > 0 ? 'rate-warning' : 'rate'
            },
            {
                id: 'errors',
                icon: '<path fill="currentColor" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>',
                label: 'Errors',
                value: formatNumber(stats.errorTargets),
                meta: stats.errorTargets > 0 ? 'API or parsing issues' : 'All targets healthy',
                variant: stats.errorTargets > 0 ? 'error' : 'success-alt'
            },
            {
                id: 'cooldown',
                icon: '<path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>',
                label: 'Cooldown',
                value: rateCooldownMs > 0 ? formatDuration(rateCooldownMs) : 'None',
                meta: `${formatNumber(rateStatus.recentRequests || 0)} recent requests`,
                variant: rateCooldownMs > 0 ? 'cooldown-active' : 'cooldown'
            }
        ];

        const existingMetricKeys = Array.from(statsMetricsGrid.querySelectorAll('[data-metric-key]')).map(el => el.dataset.metricKey);
        const needsMetricsHydrate = existingMetricKeys.length !== metricsCards.length ||
            metricsCards.some(card => !existingMetricKeys.includes(card.id));

        if (needsMetricsHydrate) {
            statsMetricsGrid.innerHTML = metricsCards.map(card => `
                <div class="stats-metric-card ${card.variant || ''}" data-metric-key="${card.id}">
                    <div class="metric-card-icon">
                        <svg viewBox="0 0 24 24">${card.icon}</svg>
                    </div>
                    <div class="metric-card-content">
                        <div class="metric-card-value" data-metric-value>${card.value}</div>
                        <div class="metric-card-label">${card.label}</div>
                        <div class="metric-card-meta" data-metric-meta>${card.meta}</div>
                    </div>
                </div>
            `).join('');
        } else {
            metricsCards.forEach(card => {
                const cardEl = statsMetricsGrid.querySelector(`[data-metric-key="${card.id}"]`);
                if (!cardEl) return;
                cardEl.className = `stats-metric-card ${card.variant || ''}`;
                const valueEl = cardEl.querySelector('[data-metric-value]');
                const metaEl = cardEl.querySelector('[data-metric-meta]');
                if (valueEl) valueEl.textContent = card.value;
                if (metaEl) metaEl.textContent = card.meta;
            });
        }

        renderAttackTrend(safeHistoryArray(stats.attackHistory || window.appState.attackHistory));
        renderGroupDistribution(stats.groupDistribution || []);
    }

    function renderAttackTrend(history) {
        const container = document.getElementById('attack-trend-chart');
        const note = document.getElementById('attack-trend-note');
        if (!container) return;

        const days = 14;
        const now = new Date();
        const startOfRange = new Date(now);
        startOfRange.setDate(now.getDate() - (days - 1));
        startOfRange.setHours(0, 0, 0, 0);
        const startTs = startOfRange.getTime();
        const endTs = now.getTime();

        const validHistory = safeHistoryArray(history).filter(record => {
            const ts = new Date(record.timestamp).getTime();
            if (Number.isNaN(ts)) return false;
            return ts >= startTs && ts <= endTs && (!record.type || record.type === 'attack');
        });
        const buckets = Array.from({ length: days }, (_, i) => {
            const day = new Date(now);
            day.setDate(now.getDate() - (days - 1 - i));
            const key = day.toISOString().slice(0, 10);
            const dayOfWeek = day.toLocaleDateString('en-US', { weekday: 'short' });
            const dateLabel = day.toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' });
            const monthShort = day.toLocaleDateString(undefined, { month: 'short' });
            return {
                key,
                dayOfWeek,
                dateLabel,
                monthShort,
                dayNumber: day.getDate(),
                count: 0,
                isToday: i === days - 1
            };
        });

        validHistory.forEach(record => {
            const ts = new Date(record.timestamp);
            const key = ts.toISOString().slice(0, 10);
            const bucket = buckets.find(b => b.key === key);
            if (bucket) bucket.count += 1;
        });

        const maxCount = Math.max(...buckets.map(b => b.count), 1);
        const totalAttacks = buckets.reduce((sum, b) => sum + b.count, 0);
        const avgAttacks = totalAttacks > 0 ? (totalAttacks / days).toFixed(1) : 0;
        const peakBucket = buckets.reduce((peak, b) => (b.count > peak.count ? b : peak), { count: -1 });
        const peakLabel = peakBucket.count > 0 ? `${peakBucket.count} on ${peakBucket.dayOfWeek}` : null;
        note.textContent = totalAttacks > 0
            ? `${totalAttacks} attacks past ${days}d - ${avgAttacks}/day avg${peakLabel ? ` - peak ${peakLabel}` : ''}`
            : 'No attacks recorded yet';

        if (totalAttacks === 0) {
            container.innerHTML = '<div class="bar-empty small">No attack activity in the last 14 days</div>';
            return;
        }

        const points = buckets.map((b, index) => {
            const ratio = b.count / maxCount;
            const x = days === 1 ? 0 : (index / (days - 1)) * 100;
            const y = 100 - (ratio * 70 + 10);
            return { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)), count: b.count, isToday: b.isToday };
        });

        const barsHtml = buckets.map(b => {
            const ratio = maxCount === 0 ? 0 : (b.count / maxCount);
            const maxBarHeight = 135; // px
            const minBarHeight = b.count > 0 ? 12 : 3; // px
            const heightPx = minBarHeight + ratio * (maxBarHeight - minBarHeight);
            const barClass = [
                'bar',
                b.count > 0 ? 'has-count' : 'zero',
                b.isToday ? 'today' : '',
                b.count === peakBucket.count && b.count > 0 ? 'peak' : ''
            ].filter(Boolean).join(' ');
            return `
                <div class="bar-column ${b.count > 0 ? 'has-data' : ''}" title="${b.dateLabel}: ${b.count} attacks">
                    <div class="bar-value">${b.count > 0 ? b.count : ''}</div>
                    <div class="${barClass}" style="height:${heightPx.toFixed(1)}px;"></div>
                    <span class="bar-day">${b.dayOfWeek}</span>
                    <span class="bar-date">
                        <span class="bar-date-day">${b.dayNumber}</span>
                        <span class="bar-date-month">${b.monthShort}</span>
                    </span>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="bar-chart-grid">
                ${barsHtml}
            </div>
        `;
    }

    function renderGroupDistribution(distribution) {
        const container = document.getElementById('group-distribution-chart');
        const note = document.getElementById('group-distribution-note');
        if (!container) return;

        const sanitized = (distribution || []).map(d => ({
            ...d,
            count: Math.max(Number(d.count) || 0, 0),
            name: d.name || 'Group',
            color: sanitizeHexColor(d.color)
        }));
        const sorted = sanitized.slice().sort((a, b) => b.count - a.count);
        const total = sanitized.reduce((sum, g) => sum + g.count, 0);
        const groupCount = sanitized.length;

        note.textContent = total
            ? `${total} targets / ${groupCount} ${groupCount === 1 ? 'group' : 'groups'}`
            : (groupCount ? `${groupCount} ${groupCount === 1 ? 'group' : 'groups'} - no targets yet` : 'No groups yet');

        if (!total) {
            container.innerHTML = '<div class="bar-empty">Create groups to organize your targets</div>';
            return;
        }

        const largestCount = sorted.length > 0 ? sorted[0].count : 0;

        container.innerHTML = sorted.map((g, index) => {
            const percentage = total > 0 ? ((g.count / total) * 100).toFixed(1) : '0.0';
            const barWidth = total > 0 ? (g.count / total) * 100 : 0;
            const isLargest = g.count === largestCount && g.count > 0 && index === 0;
            const isEmpty = g.count === 0;
            return `
                <div class="group-bar-row ${isLargest ? 'largest' : ''} ${isEmpty ? 'empty' : ''}"
                    style="--fill:${barWidth}%; --fill-color:${g.color};"
                    title="${escapeHtml(g.name)}: ${g.count} targets (${percentage}%)">
                    <div class="group-bar-label-container">
                        <span class="group-color-indicator"></span>
                        <span class="group-bar-label">${escapeHtml(g.name)}</span>
                    </div>
                    <div class="group-bar-stats">
                        <span class="group-bar-count">${g.count}</span>
                        <span class="group-bar-percentage">${percentage}%</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ========================================================================
    // LOOT TIMER
    // ========================================================================

    const LOOT_NPCS = [
        { id: 4, name: 'Duke', image: 'duke.png', seasonal: false },
        { id: 15, name: 'Leslie', image: 'leslie.png', seasonal: false },
        { id: 19, name: 'Jimmy', image: 'jimmy.png', seasonal: false },
        { id: 20, name: 'Fernando', image: 'fernando.png', seasonal: false },
        { id: 21, name: 'Tiny', image: 'tiny.png', seasonal: false },
        { id: 10, name: 'Scrooge', image: 'scrooge.png', seasonal: true, season: 'Holiday' },
        { id: 17, name: 'Easter Bunny', image: 'easter_bunny.png', seasonal: true, season: 'April' }
    ];

    // Loot level times in minutes
    const LOOT_LEVELS = [
        { level: 1, minutes: 0, label: 'Level I' },
        { level: 2, minutes: 30, label: 'Level II' },
        { level: 3, minutes: 90, label: 'Level III' },
        { level: 4, minutes: 210, label: 'Level IV' },
        { level: 5, minutes: 450, label: 'Level V' }
    ];

    let lootTimerInterval = null;
    let lootApiData = null;
    let lootLastFetch = null;

    function cleanupLootTimer() {
        if (lootTimerInterval) {
            clearInterval(lootTimerInterval);
            lootTimerInterval = null;
        }
    }

    function bindLootErrorActions(container) {
        if (!container) return;
        const retryButtons = container.querySelectorAll('[data-loot-action="retry"]');
        retryButtons.forEach(btn => {
            btn.addEventListener('click', () => renderLootTimer());
        });

        const settingsLink = container.querySelector('[data-loot-action="settings"]');
        if (settingsLink) {
            settingsLink.addEventListener('click', (event) => {
                event.preventDefault();
                if (typeof switchView === 'function') {
                    switchView('settings');
                }
            });
        }
    }

    function bindLootImageFallback(container) {
        if (!container) return;
        container.querySelectorAll('.boss-avatar-img').forEach(img => {
            img.addEventListener('error', () => {
                img.classList.add('is-hidden');
            }, { once: true });
        });
    }

    async function renderLootTimer() {
        const container = document.getElementById('loot-bosses-grid');
        if (!container) return;

        // Clear any existing interval
        cleanupLootTimer();

        // Show loading state
        container.innerHTML = '<div class="loot-loading"><div class="spinner large"></div><span>Loading NPC loot data...</span></div>';

        // Fetch real data from TornStats API if key is set
        try {
            await fetchLootApiData();
            // Render boss cards with real data
            container.innerHTML = LOOT_NPCS.map(npc => createBossCard(npc)).join('');
            bindLootImageFallback(container);
            // Start updating timers every second
            updateLootTimers();
            lootTimerInterval = setInterval(updateLootTimers, 1000);
        } catch (error) {
            console.error('Failed to load loot data:', error);
            const errorMessage = (error && error.message) ? error.message : 'Unknown error';
            const maintenanceMode = errorMessage.toLowerCase().includes('maintenance') ||
                errorMessage.toLowerCase().includes('unavailable');

            if (maintenanceMode) {
                container.innerHTML = `
                    <div class="loot-error">
                        <div class="loot-maintenance">
                            <div class="loot-maintenance-glow"></div>
                            <div class="loot-maintenance-ring ring-1"></div>
                            <div class="loot-maintenance-ring ring-2"></div>
                            <div class="loot-maintenance-shadow"></div>
                            <img src="assets/sitedown.png" alt="TornStats maintenance" class="loot-maintenance-img">
                            <div class="loot-maintenance-orbs">
                                <span class="orb orb-1"></span>
                                <span class="orb orb-2"></span>
                                <span class="orb orb-3"></span>
                                <span class="orb orb-4"></span>
                                <span class="orb orb-5"></span>
                            </div>
                            <div class="loot-maintenance-stars">
                                <span class="star star-1"></span>
                                <span class="star star-2"></span>
                                <span class="star star-3"></span>
                                <span class="star star-4"></span>
                            </div>
                        </div>
                        <h3>TornStats is down for maintenance</h3>
                        <p>Loot timers will resume once TornStats is back online.</p>
                        <button class="action-btn loot-error-action" data-loot-action="retry">Retry</button>
                    </div>
                `;
                bindLootErrorActions(container);
                return;
            }

            container.innerHTML = `
                <div class="loot-error">
                    <svg class="loot-error-icon" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                    <h3>Unable to load loot data</h3>
                    <p>${errorMessage}</p>
                    ${!window.tornStatsAPI.apiKey ?
                        '<p class="loot-error-hint">Configure your TornStats API key in <a href="#" class="loot-error-link" data-loot-action="settings">Settings</a> to use this feature.</p>' :
                        '<button class="action-btn primary loot-error-action" data-loot-action="retry">Retry</button>'}
                </div>
            `;
            bindLootErrorActions(container);
        }
    }

    async function fetchLootApiData(retryCount = 0) {
        const MAX_RETRIES = 2;
        const RETRY_DELAY = 1000; // 1 second

        // Check if we need to refetch (every 30 seconds)
        const now = Date.now();
        if (lootApiData && lootLastFetch && (now - lootLastFetch < 30000)) {
            return; // Use cached data
        }

        if (!window.tornStatsAPI || !window.tornStatsAPI.apiKey) {
            throw new Error('TornStats API key not configured');
        }

        try {
            const data = await window.tornStatsAPI.fetchLootData();

            // Validate the data before parsing
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid data received from TornStats API');
            }

            const parsedData = window.tornStatsAPI.parseLootData(data);

            // Validate parsed data
            if (!Array.isArray(parsedData)) {
                throw new Error('Failed to parse TornStats loot data');
            }

            lootApiData = parsedData;
            lootLastFetch = now;

        } catch (error) {
            // Retry logic for network errors
            if (retryCount < MAX_RETRIES &&
                (error.message.includes('Network error') ||
                 error.message.includes('Failed to fetch') ||
                 error.message.includes('TornStats server error'))) {

                debugLog(`Retrying TornStats API fetch (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
                return fetchLootApiData(retryCount + 1);
            }

            // Re-throw the error if we've exhausted retries or it's not a retriable error
            throw error;
        }
    }

    function createBossCard(npc) {
        const seasonalBadge = npc.seasonal ? `<span class="seasonal-badge">${npc.season}</span>` : '';

        return `
            <div class="boss-card boss-card-compact" data-boss-id="${npc.id}">
                <div class="boss-hero">
                    <div class="boss-identity">
                        <div class="boss-avatar small">
                            <img src="assets/bosses/${npc.image}" alt="${npc.name}" class="boss-avatar-img">
                            ${seasonalBadge}
                        </div>
                        <div class="boss-name-block">
                            <div class="boss-name-row">
                                <h3 class="boss-name">${npc.name}</h3>
                                <span class="boss-id">[${npc.id}]</span>
                            </div>
                            <div class="boss-status-chip status-unknown" id="boss-status-chip-${npc.id}">
                                Awaiting data
                            </div>
                        </div>
                    </div>
                    <button class="boss-set-time-btn" data-boss-id="${npc.id}" title="Set last defeat time">
                        <svg viewBox="0 0 24 24"><path fill="currentColor" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                        <span>Set time</span>
                    </button>
                </div>
                <div class="boss-status-inline" id="boss-status-${npc.id}">
                    <div class="status-left">
                        <span class="status-dot status-unknown"></span>
                        <div class="status-copy">
                            <div class="status-main">Set defeat time</div>
                            <div class="status-sub">Live timers start after setting</div>
                        </div>
                    </div>
                    <div class="status-metrics">
                        <div class="metric">
                            <span class="label">Next</span>
                            <span class="value">--:--</span>
                        </div>
                        <div class="metric">
                            <span class="label">Max</span>
                            <span class="value">--:--</span>
                        </div>
                    </div>
                </div>
                <div class="boss-loot-levels compact" id="loot-levels-${npc.id}">
                    ${LOOT_LEVELS.map((level, index) => createLootLevel(level, index)).join('')}
                </div>
            </div>
        `;
    }

    function createLootLevel(level, index) {
        const isFirst = index === 0;

        return `
            <div class="loot-level ${isFirst ? 'active' : ''}" data-level="${level.level}">
                <div class="loot-level-top">
                    <span class="loot-level-badge level-${level.level}">${level.label}</span>
                    <span class="loot-level-time">${level.minutes}m</span>
                </div>
                <div class="loot-level-progress">
                    <div class="loot-level-bar">
                        <div class="loot-level-fill"></div>
                    </div>
                </div>
                <div class="loot-level-timer" data-minutes="${level.minutes}">
                    <span class="timer-value">--:--:--</span>
                </div>
            </div>
        `;
    }

    function updateLootTimers() {
        if (!lootApiData || lootApiData.length === 0) {
            return;
        }

        const now = Date.now();

        lootApiData.forEach(npcData => {
            // Find matching NPC config
            const npcConfig = LOOT_NPCS.find(n => n.id === npcData.id);
            if (!npcConfig) return;

            // Determine current loot level and next level timestamp
            let currentLevel = 1;
            let nextLevelTimestamp = null;
            let nextLevelNum = null;

            // Check each loot level in reverse to find current level
            if (npcData.loot5 && now >= npcData.loot5) {
                currentLevel = 5;
            } else if (npcData.loot4 && now >= npcData.loot4) {
                currentLevel = 4;
                nextLevelTimestamp = npcData.loot5;
                nextLevelNum = 5;
            } else if (npcData.loot3 && now >= npcData.loot3) {
                currentLevel = 3;
                nextLevelTimestamp = npcData.loot4;
                nextLevelNum = 4;
            } else if (npcData.loot2 && now >= npcData.loot2) {
                currentLevel = 2;
                nextLevelTimestamp = npcData.loot3;
                nextLevelNum = 3;
            } else if (npcData.hospitalOut && now < npcData.hospitalOut) {
                currentLevel = 0; // Still in hospital
                nextLevelTimestamp = npcData.hospitalOut;
            } else {
                currentLevel = 1;
                nextLevelTimestamp = npcData.loot2;
                nextLevelNum = 2;
            }

            // Update status
            updateBossStatusFromAPI(npcData, currentLevel, nextLevelTimestamp, nextLevelNum, now);

            // Update each loot level display
            updateLootLevelsFromAPI(npcData, currentLevel, now);
        });
    }

    function updateBossStatusFromAPI(npcData, currentLevel, nextLevelTimestamp, nextLevelNum, now = Date.now()) {
        const statusEl = document.getElementById(`boss-status-${npcData.id}`);
        const chipEl = document.getElementById(`boss-status-chip-${npcData.id}`);
        if (!statusEl) return;

        let statusClass = 'status-okay';
        let statusMain = '';
        let statusSub = '';

        if (npcData.status === 'Hospital') {
            statusClass = 'status-hospital';
            if (npcData.hospitalOut && npcData.hospitalOut > now) {
                const timeUntilOut = Math.floor((npcData.hospitalOut - now) / 1000);
                statusMain = 'In Hospital';
                statusSub = `Out in ${formatTime(timeUntilOut)}`;
            } else {
                statusMain = 'In Hospital';
                statusSub = 'Awaiting respawn';
            }
        } else if (currentLevel === 0) {
            statusClass = 'status-unknown';
            statusMain = 'Waiting for data';
            statusSub = 'Set last defeat time to start tracking';
        } else {
            statusMain = `At ${LOOT_LEVELS[currentLevel - 1].label}`;

            if (currentLevel === 5) {
                statusSub = 'Max loot reached';
            } else if (nextLevelTimestamp && nextLevelNum) {
                const timeUntilNext = Math.floor((nextLevelTimestamp - now) / 1000);
                statusSub = timeUntilNext > 0
                    ? `${formatTime(timeUntilNext)} to ${LOOT_LEVELS[nextLevelNum - 1].label}`
                    : `Advancing to ${LOOT_LEVELS[nextLevelNum - 1].label}`;
            } else {
                statusSub = 'Waiting on timer data';
            }
        }

        const nextValue = (nextLevelTimestamp && nextLevelNum && currentLevel < 5)
            ? formatTime(Math.max(0, Math.floor((nextLevelTimestamp - now) / 1000)))
            : (currentLevel === 5 ? 'Maxed' : '--:--:--');

        let maxValue = '--:--:--';
        if (npcData.loot5) {
            const remainingToMax = Math.floor((npcData.loot5 - now) / 1000);
            maxValue = remainingToMax > 0 ? formatTime(remainingToMax) : 'Maxed';
        }

        statusEl.innerHTML = `
            <div class="status-left">
                <span class="status-dot ${statusClass}"></span>
                <div class="status-copy">
                    <div class="status-main">${statusMain}</div>
                    <div class="status-sub">${statusSub}</div>
                </div>
            </div>
            <div class="status-metrics">
                <div class="metric">
                    <span class="label">Next</span>
                    <span class="value">${nextValue}</span>
                </div>
                <div class="metric">
                    <span class="label">Max</span>
                    <span class="value">${maxValue}</span>
                </div>
            </div>
        `;

        if (chipEl) {
            chipEl.textContent = statusMain;
            chipEl.className = `boss-status-chip ${statusClass}`;
        }
    }

    function updateLootLevelsFromAPI(npcData, currentLevel, now) {
        const lootTimestamps = {
            1: null, // Level 1 has no timestamp (always available after hospital)
            2: npcData.loot2,
            3: npcData.loot3,
            4: npcData.loot4,
            5: npcData.loot5
        };

        LOOT_LEVELS.forEach((level) => {
            const levelEl = document.querySelector(`[data-boss-id="${npcData.id}"] .loot-level[data-level="${level.level}"]`);
            if (!levelEl) return;

            const timerEl = levelEl.querySelector('.timer-value');
            const fillEl = levelEl.querySelector('.loot-level-fill');
            const timestamp = lootTimestamps[level.level];

            // Determine state
            const isReached = currentLevel >= level.level;
            const isCurrent = currentLevel === level.level && currentLevel < 5;
            const isNext = currentLevel + 1 === level.level;

            // Update classes
            levelEl.classList.toggle('completed', isReached && !isCurrent);
            levelEl.classList.toggle('active', isCurrent || isNext);

            // Update timer and progress
            if (isReached) {
                timerEl.textContent = 'Ready';
                fillEl.style.width = '100%';
            } else if (timestamp) {
                const remaining = Math.floor((timestamp - now) / 1000);
                if (remaining > 0) {
                    timerEl.textContent = formatTime(remaining);

                    // Calculate progress from previous level
                    const prevLevel = level.level - 1;
                    const prevTimestamp = lootTimestamps[prevLevel] || (npcData.hospitalOut || now);
                    const totalDuration = timestamp - prevTimestamp;
                    const elapsed = now - prevTimestamp;
                    const progress = (elapsed / totalDuration) * 100;
                    fillEl.style.width = Math.max(0, Math.min(progress, 100)) + '%';
                } else {
                    timerEl.textContent = '00:00:00';
                    fillEl.style.width = '100%';
                }
            } else {
                timerEl.textContent = '--:--:--';
                fillEl.style.width = '0%';
            }
        });
    }

    function formatTime(seconds) {
        if (seconds <= 0) return '00:00:00';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    function getLootDefeatTime(bossId) {
        // Get from localStorage or state
        const key = `loot_defeat_${bossId}`;
        const stored = localStorage.getItem(key);
        return stored ? parseInt(stored, 10) : null;
    }

    function setLootDefeatTime(bossId, timestamp) {
        const key = `loot_defeat_${bossId}`;
        localStorage.setItem(key, timestamp.toString());
    }

    function promptSetDefeatTime(bossId) {
        const npc = LOOT_NPCS.find(n => n.id === bossId);
        if (!npc) return;

        const presetOptions = [
            { label: 'Just now', value: 0, note: 'Fresh defeat' },
            { label: '5m ago', value: 5, note: 'Recent scout' },
            { label: '15m ago', value: 15, note: 'Standard window' },
            { label: '30m ago', value: 30, note: 'Level II ready' },
            { label: '1h ago', value: 60, note: 'Mid-progress' },
            { label: '2h ago', value: 120, note: 'Level III climb' },
            { label: '4h ago', value: 240, note: 'Late cycle' }
        ];
        const sliderMaxMinutes = 720; // 12 hours lookback
        let activeMinutes = presetOptions[0].value;
        const now = Date.now();

        const formatClock = (timestamp) => {
            const date = new Date(timestamp);
            return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        };

        const formatDateLabel = (timestamp) => {
            const date = new Date(timestamp);
            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        };

        const formatDateTime = (timestamp) => `${formatClock(timestamp)} • ${formatDateLabel(timestamp)}`;

        const formatMinutesLabel = (minutes) => {
            if (minutes <= 0) return 'Now';
            if (minutes < 60) return `${minutes}m`;
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return mins ? `${hours}h ${mins}m` : `${hours}h`;
        };

        const getLevelInfo = (minutesAgo) => {
            let currentLevel = LOOT_LEVELS[0];
            let nextLevel = null;

            for (let i = 0; i < LOOT_LEVELS.length; i++) {
                const level = LOOT_LEVELS[i];
                if (minutesAgo >= level.minutes) {
                    currentLevel = level;
                    nextLevel = LOOT_LEVELS[i + 1] || null;
                } else {
                    nextLevel = level;
                    break;
                }
            }

            const minutesToNext = nextLevel ? Math.max(0, nextLevel.minutes - minutesAgo) : 0;
            return { currentLevel, nextLevel, minutesToNext };
        };

        const createNode = (tag, className, text) => {
            const element = document.createElement(tag);
            if (className) element.className = className;
            if (text !== undefined) element.textContent = text;
            return element;
        };

        const dialogContent = createNode('div', 'loot-time-dialog');
        dialogContent.dataset.bossId = String(npc.id);

        const hero = createNode('div', 'loot-time-hero');
        const npcSection = createNode('div', 'loot-time-npc');
        const avatar = createNode('div', 'loot-time-avatar');
        const avatarImg = document.createElement('img');
        avatarImg.src = `assets/bosses/${npc.image}`;
        avatarImg.alt = npc.name;
        avatar.appendChild(avatarImg);

        const heading = createNode('div', 'loot-time-heading');
        heading.append(createNode('div', 'loot-time-label', 'Set defeat time'));
        const title = createNode('div', 'loot-time-title');
        title.append(document.createTextNode(`${npc.name} `));
        title.append(createNode('span', 'loot-time-id', `[${npc.id}]`));
        heading.append(
            title,
            createNode('div', 'loot-time-subtitle', 'Manual override for loot timers. Choose a preset or dial in an exact timestamp.')
        );
        npcSection.append(avatar, heading);

        const clock = createNode('div', 'loot-time-clock');
        clock.append(
            createNode('div', 'clock-label', 'Local clock'),
            createNode('div', 'clock-value', formatClock(now)),
            createNode('div', 'clock-sub', formatDateLabel(now))
        );
        hero.append(npcSection, clock);

        const body = createNode('div', 'loot-time-body');
        const quickCard = createNode('div', 'loot-time-card');
        const quickHeader = createNode('div', 'card-header');
        quickHeader.append(
            createNode('span', 'card-title', 'Quick picks'),
            createNode('span', 'card-subtitle', 'Fast presets for common kill windows.')
        );
        const pills = createNode('div', 'loot-time-pills');
        presetOptions.forEach((opt) => {
            const button = createNode('button', 'loot-time-pill');
            button.type = 'button';
            button.dataset.minutes = String(opt.value);
            button.append(
                createNode('span', 'pill-label', opt.label),
                createNode('span', 'pill-sub', opt.note)
            );
            pills.appendChild(button);
        });
        quickCard.append(quickHeader, pills);

        const customCard = createNode('div', 'loot-time-card');
        const customHeader = createNode('div', 'card-header');
        customHeader.append(
            createNode('span', 'card-title', 'Custom timing'),
            createNode('span', 'card-subtitle', 'Match the exact defeat moment.')
        );

        const minutesStack = createNode('div', 'input-stack');
        const minutesLabel = createNode('label', 'input-label', 'Minutes ago');
        minutesLabel.htmlFor = 'custom-minutes';
        const minutesAffix = createNode('div', 'input-affix');
        const minutesInput = document.createElement('input');
        minutesInput.type = 'number';
        minutesInput.id = 'custom-minutes';
        minutesInput.min = '0';
        minutesInput.max = '10000';
        minutesInput.inputMode = 'numeric';
        minutesInput.placeholder = 'Type minutes...';
        minutesAffix.append(minutesInput, createNode('span', 'input-add-on', 'min'));
        minutesStack.append(minutesLabel, minutesAffix);

        const divider = createNode('div', 'input-divider');
        divider.append(createNode('span', '', 'or'));

        const datetimeStack = createNode('div', 'input-stack');
        const datetimeLabel = createNode('label', 'input-label', 'Exact defeat time');
        datetimeLabel.htmlFor = 'custom-datetime';
        const datetimeInput = document.createElement('input');
        datetimeInput.type = 'datetime-local';
        datetimeInput.id = 'custom-datetime';
        datetimeStack.append(
            datetimeLabel,
            datetimeInput,
            createNode('small', 'input-hint', 'Uses your local timezone.')
        );

        const slider = createNode('div', 'loot-time-slider');
        const sliderHeader = createNode('div', 'slider-header');
        const rangeValue = createNode('span', '', formatMinutesLabel(activeMinutes));
        rangeValue.id = 'loot-time-range-value';
        sliderHeader.append(createNode('span', '', 'Scrub timeline'), rangeValue);
        const rangeInput = document.createElement('input');
        rangeInput.type = 'range';
        rangeInput.id = 'loot-time-range';
        rangeInput.min = '0';
        rangeInput.max = String(sliderMaxMinutes);
        rangeInput.step = '5';
        rangeInput.value = String(activeMinutes);
        const sliderScale = createNode('div', 'slider-scale');
        sliderScale.append(
            createNode('span', '', 'Now'),
            createNode('span', '', `${sliderMaxMinutes / 60}h back`)
        );
        slider.append(sliderHeader, rangeInput, sliderScale);
        customCard.append(customHeader, minutesStack, divider, datetimeStack, slider);
        body.append(quickCard, customCard);

        const preview = createNode('div', 'loot-time-preview');
        const previewSummary = createNode('div', 'preview-summary');
        const previewTimeEl = createNode('div', 'preview-time', formatDateTime(now));
        previewTimeEl.id = 'loot-time-preview-time';
        const previewSubEl = createNode('div', 'preview-sub', '');
        previewSubEl.id = 'loot-time-preview-sub';
        previewSummary.append(
            createNode('div', 'preview-label', 'Will set defeat to'),
            previewTimeEl,
            previewSubEl
        );

        const previewProgress = createNode('div', 'preview-progress');
        const progressBar = createNode('div', 'preview-progress-bar');
        const progressFill = createNode('div', 'preview-progress-fill');
        progressFill.id = 'loot-time-progress-fill';
        progressBar.appendChild(progressFill);
        const previewLevels = createNode('div', 'preview-levels');
        LOOT_LEVELS.forEach((level) => {
            const levelEl = createNode('div', 'preview-level');
            levelEl.dataset.level = String(level.level);
            levelEl.dataset.minutes = String(level.minutes);
            levelEl.append(
                createNode('span', 'level-badge', level.label.replace('Level ', '')),
                createNode('span', 'level-time', `${level.minutes}m`)
            );
            previewLevels.appendChild(levelEl);
        });
        previewProgress.append(progressBar, previewLevels);
        preview.append(previewSummary, previewProgress);

        dialogContent.append(hero, body, preview);

        const getActiveMinutes = () => Math.max(0, Math.round(activeMinutes || 0));

        const applySelection = () => {
            const minutesAgo = getActiveMinutes();
            const timestamp = Date.now() - (minutesAgo * 60 * 1000);
            setLootDefeatTime(bossId, timestamp);
            updateLootTimers();
            showToast(`Set ${npc.name}'s defeat time to ${minutesAgo} minute${minutesAgo === 1 ? '' : 's'} ago`, 'success');
        };

        showPremiumAlert({
            title: 'Set Loot Timer',
            messageContent: dialogContent,
            icon: '⏱️',
            iconType: 'info',
            dialogClass: 'premium-alert-wide loot-time-modal',
            buttons: [
                { text: 'Cancel', type: 'secondary', action: null },
                { text: 'Set Time', type: 'primary', action: applySelection }
            ]
        });

        const presetButtons = Array.from(dialogContent.querySelectorAll('.loot-time-pill'));
        const levelEls = Array.from(dialogContent.querySelectorAll('.preview-level'));

        const updatePresetSelection = (minutes) => {
            presetButtons.forEach(btn => {
                const value = parseInt(btn.dataset.minutes, 10);
                btn.classList.toggle('selected', !Number.isNaN(value) && value === minutes);
            });
        };

        const updatePreview = () => {
            const minutesAgo = getActiveMinutes();
            const timestamp = Date.now() - (minutesAgo * 60 * 1000);
            const { currentLevel, nextLevel, minutesToNext } = getLevelInfo(minutesAgo);

            if (previewTimeEl) {
                previewTimeEl.textContent = formatDateTime(timestamp);
            }

            if (previewSubEl) {
                const summaryParts = [
                    minutesAgo === 0 ? 'Just now' : `${minutesAgo} minute${minutesAgo === 1 ? '' : 's'} ago`,
                    `Est. ${currentLevel.label}`,
                    nextLevel ? `Next ${nextLevel.label} in ${formatMinutesLabel(minutesToNext)}` : 'Max loot reached'
                ];
                previewSubEl.textContent = summaryParts.join(' • ');
            }

            if (progressFill) {
                const maxMinutes = LOOT_LEVELS[LOOT_LEVELS.length - 1].minutes;
                const progress = Math.min(100, (minutesAgo / maxMinutes) * 100);
                progressFill.style.width = `${progress}%`;
            }

            if (rangeValue) {
                rangeValue.textContent = formatMinutesLabel(minutesAgo);
            }

            levelEls.forEach(el => {
                const levelMinutes = parseInt(el.dataset.minutes, 10) || 0;
                const levelValue = parseInt(el.dataset.level, 10) || 0;
                el.classList.toggle('reached', minutesAgo >= levelMinutes);
                el.classList.toggle('active', currentLevel.level === levelValue);
            });
        };

        const setActiveMinutes = (minutes, source = 'preset') => {
            const sanitized = Math.max(0, Math.round(Number.isFinite(minutes) ? minutes : 0));
            activeMinutes = sanitized;

            if (rangeInput && source !== 'slider') {
                rangeInput.value = Math.min(sanitized, sliderMaxMinutes);
            }
            if (minutesInput && source !== 'custom') {
                minutesInput.value = sanitized;
            }
            if (datetimeInput && source !== 'datetime') {
                datetimeInput.value = '';
            }

            updatePresetSelection(sanitized);
            updatePreview();
        };

        presetButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const value = parseInt(btn.dataset.minutes, 10);
                setActiveMinutes(Number.isNaN(value) ? 0 : value, 'preset');
            });
        });

        if (rangeInput) {
            rangeInput.addEventListener('input', () => {
                const value = parseInt(rangeInput.value, 10);
                setActiveMinutes(Number.isNaN(value) ? 0 : value, 'slider');
            });
        }

        if (minutesInput) {
            minutesInput.addEventListener('input', () => {
                const value = parseInt(minutesInput.value, 10);
                if (Number.isNaN(value)) {
                    updatePresetSelection(getActiveMinutes());
                    updatePreview();
                    return;
                }
                setActiveMinutes(value, 'custom');
            });
        }

        if (datetimeInput) {
            datetimeInput.addEventListener('change', () => {
                if (!datetimeInput.value) return;
                const parsed = Date.parse(datetimeInput.value);
                if (Number.isNaN(parsed)) return;
                const diffMinutes = Math.max(0, Math.round((Date.now() - parsed) / 60000));
                setActiveMinutes(diffMinutes, 'datetime');
            });
        }

        setActiveMinutes(activeMinutes, 'preset');
    }

    // ========================================================================
    // SETTINGS
    // ========================================================================

    function applyTheme(theme) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        // Remove existing theme classes
        document.body.classList.remove('light-theme', 'dark-theme');

        if (theme === 'light') {
            document.body.classList.add('light-theme');
        } else if (theme === 'dark') {
            // Dark is the default (no class needed)
            document.body.classList.add('dark-theme');
        } else if (theme === 'auto') {
            // Apply based on system preference
            if (!prefersDark) {
                document.body.classList.add('light-theme');
            }
        }
    }

    function applyListDensity(density) {
        // Remove existing density classes
        document.body.classList.remove('density-compact', 'density-comfortable', 'density-spacious');

        // Apply new density class
        if (density && density !== 'comfortable') {
            document.body.classList.add(`density-${density}`);
        }

        // Refresh target list to apply new density
        renderTargetList();
    }

    const CLOUD_PROVIDER_META = {
        'google-drive': {
            label: 'Google Drive',
            hint: 'Auto-detects your Drive for Desktop folder and nests backups to avoid clutter.',
            icon: 'cloud-google-drive.png'
        },
        dropbox: {
            label: 'Dropbox',
            hint: 'Looks for your Dropbox sync folder; ideal for quick multi-device restores.',
            icon: 'cloud-dropbox.png'
        },
        onedrive: {
            label: 'OneDrive',
            hint: 'Targets OneDrive/OneDrive Personal folders and keeps backups grouped together.',
            icon: 'cloud-onedrive.png'
        },
        'icloud-drive': {
            label: 'iCloud Drive',
            hint: 'Uses iCloud Drive sync locations (Library/CloudStorage) when available.',
            icon: 'cloud-icloud-drive.png'
        },
        box: {
            label: 'Box',
            hint: 'Prefers Box/Box Sync folders; choose a custom path if you renamed it.',
            icon: 'cloud-box.png'
        },
        mega: {
            label: 'MEGA',
            hint: 'Searches for MEGA or MEGAsync folders and writes into a dedicated subfolder.',
            icon: 'cloud-mega.png'
        },
        'custom-folder': {
            label: 'Custom Folder',
            hint: 'Use any folder (local or network). Point it at a synced location if you want cloud copies.',
            icon: 'cloud-custom-folder.png'
        }
    };

    function getCloudProviderMeta(provider) {
        return CLOUD_PROVIDER_META[provider] || {
            label: 'Cloud Folder',
            hint: 'Pick a provider and folder where backups should be copied.'
        };
    }

    function getCloudProviderLabel(provider) {
        return getCloudProviderMeta(provider).label;
    }

    function resolveAssetPath(relativePath) {
        try {
            return new URL(relativePath, window.location.href).toString();
        } catch (error) {
            console.warn('Failed to resolve asset path', relativePath, error);
            return relativePath;
        }
    }

    function getCloudProviderIcon(provider) {
        const iconName = getCloudProviderMeta(provider).icon;
        return iconName ? resolveAssetPath(`assets/${iconName}`) : null;
    }

    function updateCloudProviderLabel(provider) {
        if (DOM.cloudProviderLabel) {
            DOM.cloudProviderLabel.textContent = getCloudProviderLabel(provider);
        }
    }

    function applyCloudProviderIcon(provider) {
        if (!DOM.settingCloudProvider) return;
        const iconPath = getCloudProviderIcon(provider);

        const setIconStyles = (url) => {
            DOM.settingCloudProvider.classList.remove('no-icon');
            DOM.cloudProviderDropdown?.classList.remove('no-icon');
            DOM.cloudProviderToggle?.classList.remove('no-icon');
            if (DOM.cloudProviderIcon) {
                DOM.cloudProviderIcon.style.backgroundImage = `url('${url}')`;
            }
            DOM.settingCloudProvider.style.setProperty('--cloud-provider-icon', `url('${url}')`);
        };

        const clearIconStyles = () => {
            DOM.settingCloudProvider.classList.add('no-icon');
            DOM.cloudProviderDropdown?.classList.add('no-icon');
            DOM.cloudProviderToggle?.classList.add('no-icon');
            if (DOM.cloudProviderIcon) {
                DOM.cloudProviderIcon.style.backgroundImage = '';
            }
            DOM.settingCloudProvider.style.removeProperty('--cloud-provider-icon');
        };

        if (!iconPath) {
            clearIconStyles();
            return;
        }

        const img = new Image();
        img.onload = () => setIconStyles(iconPath);
        img.onerror = clearIconStyles;
        img.src = iconPath;
    }

    function highlightCloudProviderOption(provider) {
        if (!DOM.cloudProviderList) return;
        Array.from(DOM.cloudProviderList.children || []).forEach((item) => {
            const isMatch = item.dataset.value === provider;
            item.classList.toggle('selected', isMatch);
            item.setAttribute('aria-selected', isMatch ? 'true' : 'false');
        });
    }

    function closeCloudProviderList() {
        if (DOM.cloudProviderDropdown) {
            DOM.cloudProviderDropdown.classList.remove('open');
            DOM.cloudProviderDropdown.classList.remove('open-up');
        }
        if (DOM.cloudProviderToggle) {
            DOM.cloudProviderToggle.setAttribute('aria-expanded', 'false');
        }
    }

    function openCloudProviderList() {
        if (!DOM.cloudProviderDropdown || !DOM.cloudProviderList || !DOM.cloudProviderToggle) return;

        DOM.cloudProviderDropdown.classList.add('open');
        DOM.cloudProviderToggle.setAttribute('aria-expanded', 'true');

        // Decide direction based on viewport space
        const rect = DOM.cloudProviderDropdown.getBoundingClientRect();
        const belowSpace = window.innerHeight - rect.bottom;
        const aboveSpace = rect.top;
        const listHeight = DOM.cloudProviderList.scrollHeight || (DOM.cloudProviderList.children.length * 36);
        const shouldOpenUp = belowSpace < listHeight && aboveSpace > belowSpace;

        DOM.cloudProviderDropdown.classList.toggle('open-up', shouldOpenUp);

        const selected = DOM.cloudProviderList.querySelector('.selected') || DOM.cloudProviderList.firstElementChild;
        selected?.focus();
    }

    function toggleCloudProviderList() {
        if (DOM.cloudProviderDropdown?.classList.contains('open')) {
            closeCloudProviderList();
        } else {
            openCloudProviderList();
        }
    }

    function buildCloudProviderList() {
        if (!DOM.settingCloudProvider || !DOM.cloudProviderList) return;
        DOM.cloudProviderList.innerHTML = '';
        Array.from(DOM.settingCloudProvider.options || []).forEach((option) => {
            const li = document.createElement('li');
            li.className = 'cloud-provider-item';
            li.role = 'option';
            li.tabIndex = -1;
            li.dataset.value = option.value;

            const iconPath = getCloudProviderIcon(option.value);
            const iconSpan = document.createElement('span');
            iconSpan.className = 'item-icon';
            if (iconPath) {
                iconSpan.style.backgroundImage = `url('${iconPath}')`;
            } else {
                li.classList.add('no-icon');
            }

            const labelSpan = document.createElement('span');
            labelSpan.textContent = option.textContent;

            li.appendChild(iconSpan);
            li.appendChild(labelSpan);

            li.addEventListener('click', () => {
                selectCloudProvider(option.value, { emitChange: true, focusToggle: true });
            });

            li.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectCloudProvider(option.value, { emitChange: true, focusToggle: true });
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    li.nextElementSibling?.focus();
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    (li.previousElementSibling || DOM.cloudProviderList.lastElementChild)?.focus();
                } else if (e.key === 'Escape') {
                    closeCloudProviderList();
                    DOM.cloudProviderToggle?.focus();
                }
            });

            DOM.cloudProviderList.appendChild(li);
        });
        highlightCloudProviderOption(DOM.settingCloudProvider.value);
    }

    function selectCloudProvider(provider, options = {}) {
        const { emitChange = false, focusToggle = false } = options;
        if (DOM.settingCloudProvider) {
            DOM.settingCloudProvider.value = provider;
        }
        applyCloudProviderIcon(provider);
        updateCloudProviderLabel(provider);
        highlightCloudProviderOption(provider);

        if (emitChange && DOM.settingCloudProvider) {
            const evt = new Event('change', { bubbles: true });
            DOM.settingCloudProvider.dispatchEvent(evt);
        }

        closeCloudProviderList();
        if (focusToggle) {
            DOM.cloudProviderToggle?.focus();
        }
    }

    function updateCloudProviderHint(provider, statusText = '') {
        if (!DOM.cloudProviderHint) return;
        const meta = getCloudProviderMeta(provider);
        const status = statusText ? ` • ${statusText}` : '';
        DOM.cloudProviderHint.textContent = `${meta.hint}${status}`;
    }

    function setCloudPathText(pathText) {
        if (DOM.cloudBackupPath) {
            DOM.cloudBackupPath.textContent = pathText || 'No folder selected';
        }
    }

    function syncCloudBackupControls() {
        const enabled = DOM.settingCloudBackup?.checked;
        if (DOM.settingCloudProvider) {
            DOM.settingCloudProvider.disabled = !enabled;
        }
        if (DOM.btnCloudPath) {
            DOM.btnCloudPath.disabled = !enabled;
        }
        if (DOM.btnCloudDetect) {
            DOM.btnCloudDetect.disabled = !enabled;
        }
        if (DOM.cloudBackupPath) {
            DOM.cloudBackupPath.classList.toggle('muted', !enabled);
        }

        const provider = DOM.settingCloudProvider?.value || 'google-drive';
        updateCloudProviderHint(provider, enabled ? '' : 'Disabled');
    }

    async function autoDetectCloudPath(options = {}) {
        const provider = options.provider || DOM.settingCloudProvider?.value || 'google-drive';
        const silent = options.silent === true;
        const force = options.force === true;

        if (provider === 'custom-folder') {
            updateCloudProviderHint(provider, 'Choose a folder to enable backups');
            if (!silent) {
                showToast('Select a folder for custom cloud backups.', 'info');
            }
            return { success: false, reason: 'custom-provider' };
        }

        if (!window.electronAPI?.resolveCloudPath) {
            if (!silent) {
                showToast('Auto-detect is unavailable on this platform.', 'error');
            }
            return { success: false, reason: 'bridge-missing' };
        }

        try {
            const currentPath = force ? '' : (window.appState?.settings?.cloudBackupPath || '');
            const result = await window.electronAPI.resolveCloudPath(provider, currentPath);
            if (result?.ok && result.path) {
                setCloudPathText(result.path);
                await window.appState.updateSettings({
                    cloudBackupPath: result.path,
                    cloudBackupProvider: provider,
                    cloudBackupEnabled: true
                });
                syncCloudBackupControls();
                updateCloudProviderHint(provider, result.usedDefault ? 'Auto-detected' : 'Using your folder');
                if (!silent) {
                    showToast(`${getCloudProviderLabel(provider)} ready at ${result.path}`, 'success');
                }
                return { success: true, path: result.path, usedDefault: result.usedDefault };
            }

            updateCloudProviderHint(provider, 'Choose a folder to continue');
            if (!silent) {
                showToast(`Could not find a ${getCloudProviderLabel(provider)} folder. Choose one manually.`, 'warning');
            }
            return { success: false, reason: result?.reason || 'not-found' };
        } catch (error) {
            if (!silent) {
                showToast('Auto-detect failed: ' + (error.message || 'Unknown error'), 'error');
            }
            return { success: false, reason: error.message };
        }
    }

    async function handleCloudProviderChange(provider) {
        applyCloudProviderIcon(provider);
        updateCloudProviderLabel(provider);
        highlightCloudProviderOption(provider);
        await window.appState.updateSettings({ cloudBackupProvider: provider });
        const enabled = DOM.settingCloudBackup?.checked;
        updateCloudProviderHint(provider, enabled ? '' : 'Disabled');

        if (!enabled) return;

        if (provider === 'custom-folder') {
            if (!window.appState.settings?.cloudBackupPath) {
                setCloudPathText('No folder selected');
                updateCloudProviderHint(provider, 'Choose a folder to enable backups');
            } else {
                updateCloudProviderHint(provider, 'Using your folder');
            }
            return;
        }

        try {
            if (window.electronAPI?.validateCloudPath) {
                const validation = await window.electronAPI.validateCloudPath(provider, window.appState.settings?.cloudBackupPath || '');
                if (validation?.ok && validation.path) {
                    setCloudPathText(validation.path);
                    updateCloudProviderHint(provider, validation.usedDefault ? 'Auto-detected' : 'Using your folder');
                    return;
                }
            }
        } catch (error) {
            console.warn('Cloud path validation failed', error);
        }

        await autoDetectCloudPath({ provider, silent: true, force: true });
    }

    function loadSettings() {
        const settings = window.appState.settings;

        // API Configuration
        document.getElementById('setting-api-key').value = settings.apiKey || '';
        document.getElementById('setting-tornstats-key').value = settings.tornStatsApiKey || '';
        const playerLevelInput = document.getElementById('setting-player-level');
        if (playerLevelInput) {
            playerLevelInput.value = settings.playerLevel || '';
        }

        // Refresh Settings
        const autoRefreshToggle = document.getElementById('setting-auto-refresh');
        if (autoRefreshToggle) {
            autoRefreshToggle.checked = !!settings.autoRefresh;
            autoRefreshToggle.disabled = false;
            autoRefreshToggle.title = 'Automatically refresh stale targets in the background';
        }
        const refreshIntervalInput = document.getElementById('setting-refresh-interval');
        if (refreshIntervalInput) {
            refreshIntervalInput.value = settings.refreshInterval;
            refreshIntervalInput.disabled = false;
            refreshIntervalInput.title = 'Targets older than this will be refreshed';
        }
        document.getElementById('setting-concurrent').value = settings.maxConcurrentRequests;
        document.getElementById('setting-api-rate-limit').value = settings.apiRateLimitPerMinute || window.appState.limiter?.maxTokens || 80;

        // Notifications
        document.getElementById('setting-notifications').checked = settings.notifications;
        document.getElementById('setting-sound').checked = settings.soundEnabled;
        const volumeSlider = document.getElementById('setting-sound-volume');
        const volumeDisplay = document.getElementById('volume-value-display');
        const volumeContainer = document.getElementById('setting-volume-container');
        const soundVolume = settings.soundVolume ?? 50;
        if (volumeSlider) volumeSlider.value = soundVolume;
        if (volumeDisplay) volumeDisplay.textContent = `${soundVolume}%`;
        if (volumeContainer) {
            volumeContainer.classList.toggle('disabled', !settings.soundEnabled);
        }
        document.getElementById('setting-notify-monitored').checked = settings.notifyOnlyMonitored || false;
        document.getElementById('setting-notify-hospital').checked = settings.notifyOnHospitalRelease || false;
        document.getElementById('setting-notify-jail').checked = settings.notifyOnJailRelease || false;
        document.getElementById('setting-notify-added').checked = settings.notifyOnTargetAdded !== false;
        document.getElementById('setting-notify-removed').checked = settings.notifyOnTargetRemoved || false;
        document.getElementById('setting-notify-status').checked = settings.notifyOnStatusChange || false;

        // Display
        document.getElementById('setting-theme').value = settings.theme || 'dark';
        document.getElementById('setting-list-density').value = settings.listDensity || 'comfortable';
        document.getElementById('setting-show-avatars').checked = settings.showAvatars !== false;
        document.getElementById('setting-show-offline').checked = settings.showOfflineTargets !== false;
        document.getElementById('setting-show-badges').checked = settings.showStatusCountBadges !== false;
        document.getElementById('setting-timestamp-format').value = settings.timestampFormat || '12h';
        document.getElementById('setting-sort-remember').checked = settings.sortRememberLast !== false;
        document.getElementById('setting-compact').checked = settings.compactMode;

        // Behavior
        document.getElementById('setting-confirm-attack').checked = settings.confirmBeforeAttack;
        document.getElementById('setting-confirm-delete').checked = settings.confirmBeforeDelete !== false;
        document.getElementById('setting-attack-sound').checked = settings.playAttackSound || false;
        document.getElementById('setting-recent-activity-days').value = settings.doNotAttackRecentActivityDays || 0;
        document.getElementById('setting-show-onboarding').checked = settings.showOnboarding !== false;

        // Window & Tray
        document.getElementById('setting-minimize-tray').checked = settings.minimizeToTray;
        document.getElementById('setting-start-minimized').checked = settings.startMinimized;

        // Data Management
        document.getElementById('setting-auto-backup').checked = settings.autoBackupEnabled || false;
        document.getElementById('setting-backup-interval').value = settings.autoBackupInterval || 7;
        document.getElementById('setting-backup-retention').value = settings.backupRetention || 10;
        document.getElementById('setting-backup-preop').checked = settings.backupBeforeBulk !== false;
        document.getElementById('setting-cloud-backup').checked = settings.cloudBackupEnabled || false;
        document.getElementById('setting-cloud-provider').value = settings.cloudBackupProvider || 'google-drive';
        selectCloudProvider(settings.cloudBackupProvider || 'google-drive');
        setCloudPathText(settings.cloudBackupPath || '');
        document.getElementById('setting-max-history').value = settings.maxHistoryEntries || 1000;
        syncCloudBackupControls();
        updateCloudProviderHint(settings.cloudBackupProvider || 'google-drive', settings.cloudBackupEnabled ? '' : 'Disabled');

        if (settings.cloudBackupEnabled && window.electronAPI?.validateCloudPath && settings.cloudBackupProvider !== 'custom-folder') {
            window.electronAPI.validateCloudPath(settings.cloudBackupProvider, settings.cloudBackupPath || '').then((validation) => {
                if (validation?.ok && validation.path) {
                    setCloudPathText(validation.path);
                    updateCloudProviderHint(settings.cloudBackupProvider, validation.usedDefault ? 'Auto-detected' : 'Using your folder');
                }
            }).catch(() => {
                // Silent failure, user will see hint to choose folder if needed
            });
        }

        document.body.classList.toggle('compact-mode', settings.compactMode);

        // Apply theme and list density
        applyTheme(settings.theme || 'dark');
        applyListDensity(settings.listDensity || 'comfortable');
        syncSortButtons();
        syncFilterControls();
        updateAttackTrackerUI();

        // Set TornStats API key
        if (window.tornStatsAPI && settings.tornStatsApiKey) {
            window.tornStatsAPI.setApiKey(settings.tornStatsApiKey);
        }

        // App info
        window.electronAPI.getAppInfo().then(info => {
            appInfoCache = info;
            const resolvedVersion = info?.version || 'N/A';
            const titleVersion = info?.version ? `v${info.version}` : 'v-';
            document.getElementById('app-version').textContent = resolvedVersion;
            document.getElementById('data-path').textContent = info.path;
            if (DOM.titlebarVersion) {
                DOM.titlebarVersion.textContent = titleVersion;
            }
            if (DOM.aboutVersion) {
                DOM.aboutVersion.textContent = resolvedVersion;
            }
            if (DOM.aboutDataPath) {
                DOM.aboutDataPath.textContent = info.path || '-';
            }
        });

        if (DOM.onboardingHideToggle) {
            DOM.onboardingHideToggle.checked = settings.showOnboarding === false;
        }
    }

    function setStatusMessage(statusEl, className, message) {
        if (!statusEl) return;
        statusEl.textContent = '';
        if (!message) return;
        const span = document.createElement('span');
        span.className = className;
        span.textContent = message;
        statusEl.appendChild(span);
    }

    async function handleValidateKey() {
        const input = document.getElementById('setting-api-key');
        const status = document.getElementById('api-key-status');
        const key = input.value.trim();

        if (!key) {
            setStatusMessage(status, 'status-error', 'Please enter an API key');
            return;
        }

        setStatusMessage(status, 'status-loading', 'Validating...');

        const result = await window.appState.validateApiKey(key);

        if (result.valid && result.user) {
            const user = result.user;
            const userName = user.name || 'Unknown';
            const userId = user.id ?? '?';
            const userLevel = Number.isFinite(user.level) ? user.level : '?';
            setStatusMessage(status, 'status-success', `Valid key for ${userName} [${userId}] (Lv.${userLevel})`);
            await window.appState.updateSettings({
                apiKey: key,
                playerLevel: user.level,
                playerName: user.name,
                playerId: user.id
            });
            if (DOM.settingPlayerLevel) {
                DOM.settingPlayerLevel.value = user.level || '';
            }
            showToast('API key saved successfully', 'success');
            handleOnboardingResume('api');
        } else {
            setStatusMessage(status, 'status-error', result?.error || 'Invalid API key');
        }
    }

    async function handleValidateTornStatsKey() {
        const input = document.getElementById('setting-tornstats-key');
        const status = document.getElementById('tornstats-key-status');
        const key = input.value.trim();

        if (!key) {
            setStatusMessage(status, 'status-error', 'Please enter a TornStats API key');
            return;
        }

        // Validate key format before making API call
        if (!key.startsWith('TS_')) {
            setStatusMessage(status, 'status-error', 'Invalid key format. TornStats keys start with "TS_"');
            return;
        }

        setStatusMessage(status, 'status-loading', 'Validating...');

        // Store original key to restore if validation fails
        const originalKey = window.tornStatsAPI?.apiKey;

        try {
            // Set the key temporarily
            if (window.tornStatsAPI) {
                window.tornStatsAPI.setApiKey(key);
            } else {
                throw new Error('TornStats API not initialized');
            }

            // Try to fetch loot data
            const data = await window.tornStatsAPI.fetchLootData();

            debugLog('TornStats API response:', data);
            debugLog('Response keys:', Object.keys(data || {}));

            // Check if we got valid data - TornStats returns an object with NPC data
            if (data && typeof data === 'object' && !data.error) {
                // Parse the data to verify it's valid
                const parsedNpcs = window.tornStatsAPI.parseLootData(data);

                debugLog('Parsed NPCs:', parsedNpcs);
                debugLog('Parsed NPCs count:', parsedNpcs ? parsedNpcs.length : 0);

                if (parsedNpcs && Array.isArray(parsedNpcs) && parsedNpcs.length > 0) {
                    setStatusMessage(status, 'status-success', `Valid TornStats API key (${parsedNpcs.length} NPCs found)`);
                    await window.appState.updateSettings({ tornStatsApiKey: key });
                    showToast('TornStats API key saved successfully', 'success');
                } else {
                    throw new Error('No NPC data found in response');
                }
            } else if (data && data.error) {
                throw new Error(data.error.error || data.error.message || 'API returned an error');
            } else {
                throw new Error('Invalid response from TornStats API');
            }
        } catch (error) {
            // Restore original key on validation failure
            if (window.tornStatsAPI && originalKey) {
                window.tornStatsAPI.setApiKey(originalKey);
            }

            const errorText = (error && error.message) ? error.message : '';
            const lowerMessage = errorText.toLowerCase();
            let errorMessage = 'Invalid API key or connection error';

            // Provide specific error messages based on error type
            if (lowerMessage.includes('maintenance') || lowerMessage.includes('unavailable')) {
                errorMessage = 'TornStats is currently unavailable (maintenance). Please try again later';
            } else if (lowerMessage.includes('endpoint')) {
                errorMessage = 'TornStats API endpoint could not be reached. Confirm the service is up and your key is correct';
            } else if (errorText.includes('Invalid TornStats API key format')) {
                errorMessage = 'Invalid key format. Keys should start with "TS_"';
            } else if (errorText.includes('unauthorized')) {
                errorMessage = 'Invalid or expired TornStats API key';
            } else if (errorText.includes('rate limit') || errorText.includes('429')) {
                errorMessage = 'Rate limit exceeded. Please wait before trying again';
            } else if (errorText.includes('Network error') || errorText.includes('Failed to fetch')) {
                errorMessage = 'Connection error. Check your internet connection';
            } else if (errorText.includes('TornStats server error')) {
                errorMessage = 'TornStats server error. Please try again later';
            } else if (errorText.includes('No NPC data')) {
                errorMessage = 'API key valid but no loot data available. Try again later';
            } else if (errorText) {
                errorMessage = errorText;
            }

            setStatusMessage(status, 'status-error', errorMessage);
            console.error('TornStats validation error:', error);
        }
    }

    // ========================================================================
    // ACTION HANDLERS
    // ========================================================================

    function handleAttack() {
        const target = window.appState.getSelectedTarget();
        if (target) {
            handleAttackById(target.userId, 'detail');
        }
    }

    function handleAttackById(userId, source = 'targets', options = {}) {
        const normalizedUserId = normalizeTargetUserId(userId);
        if (!normalizedUserId) {
            showToast('Invalid target ID', 'error');
            return;
        }

        const target = window.appState.getTarget(normalizedUserId);
        const shouldSelectTarget = options.selectTarget !== false && target;

        if (shouldSelectTarget && window.appState.currentView !== 'targets') {
            switchView('targets');
        }
        if (shouldSelectTarget) {
            window.appState.selectTarget(normalizedUserId);
        }

        if (target && options.warnNoAttackGroup !== false) {
            const group = window.appState.getGroup(target.groupId);
            if (group && group.noAttack) {
                showPremiumAlert({
                    title: 'Attack Prevention Warning',
                    message: `This target is in "${group.name}" which is flagged as "Do Not Attack". Are you sure you want to proceed?`,
                    icon: '?',
                    iconType: 'warning',
                    buttons: [
                        {
                            text: 'Continue Attack',
                            type: 'danger',
                            action: () => {
                                handleAttackById(normalizedUserId, source, {
                                    ...options,
                                    warnNoAttackGroup: false
                                });
                            }
                        },
                        { text: 'Cancel', type: 'secondary', action: null }
                    ]
                });
                return;
            }
        }

        // Check if target is attackable
        if (target && !target.isAttackable()) {
            showAttackPrevention(target);
            return;
        }

        const performAttack = () => {
            if (window.appState.settings.playAttackSound) {
                playSound('attack');
            }
            if (!openAttackWindow(normalizedUserId)) {
                showToast('Could not open attack page', 'error');
                return;
            }
            window.appState.recordAttack(normalizedUserId, { source });
        };

        const confirmAttack = () => {
            if (window.appState.settings.confirmBeforeAttack) {
                showConfirm(
                    'Confirm Attack',
                    `Attack ${target?.getDisplayName() || `User ${normalizedUserId}`}?`,
                    performAttack
                );
            } else {
                performAttack();
            }
        };

        const recentActivityDays = Math.max(
            0,
            Number.parseInt(window.appState.settings.doNotAttackRecentActivityDays, 10) || 0
        );

        if (target && recentActivityDays > 0 && isTargetRecentlyActive(target, recentActivityDays)) {
            showRecentActivityWarning(target, confirmAttack, recentActivityDays);
            return;
        }

        confirmAttack();
    }

    function handleProfile() {
        const target = window.appState.getSelectedTarget();
        if (target) {
            window.electronAPI.openProfile(target.userId);
        }
    }

    function handleRefreshTarget() {
        const target = window.appState.getSelectedTarget();
        if (target) {
            window.appState.refreshTarget(target.userId);
        }
    }

    function handleRemoveTarget() {
        const target = window.appState.getSelectedTarget();
        if (!target) return;

        const doRemove = async () => {
            await window.appState.removeTarget(target.userId);
            showToast('Target removed', 'success');
        };

        // Check if confirmation is required
        if (window.appState.settings.confirmBeforeDelete !== false) {
            showConfirm(
                'Remove Target',
                `Remove ${target.getDisplayName()} from your list?`,
                doRemove
            );
        } else {
            doRemove();
        }
    }

    function handleBulkRemoveTargets() {
        const ids = window.appState.getSelectedIds ? window.appState.getSelectedIds() : [];
        if (!ids.length) {
            showToast('Select targets to remove', 'info');
            return;
        }

        const message = ids.length === 1
            ? 'Remove the selected target?'
            : `Remove ${ids.length} targets? A backup will be created before deleting.`;

        showConfirm(
            ids.length === 1 ? 'Remove Target' : 'Remove Targets',
            message,
            async () => {
                await window.appState.removeTargets(ids);
                window.appState.clearSelection();
                updateSelectionToolbar([]);
                showToast('Targets removed', 'success');
                renderTargetList();
            }
        );
    }

    async function handleBulkAddTags(targetIds = null) {
        const ids = targetIds && targetIds.length
            ? targetIds
            : (window.appState.getSelectedIds ? window.appState.getSelectedIds() : []);
        if (!ids.length) {
            showToast('Select targets first', 'info');
            return;
        }

        // Pre-fill prompt with existing tags when a single target is selected
        let defaultTags = '';
        if (ids.length === 1) {
            const t = window.appState.getTarget(ids[0]);
            if (t && Array.isArray(t.tags) && t.tags.length) {
                defaultTags = t.tags.join(', ');
            }
        }

        const input = window.prompt('Add tags (comma separated):', defaultTags);
        if (input === null) return;
        const tags = input.split(',').map(t => t.trim()).filter(Boolean);
        if (!tags.length) {
            showToast('No tags entered', 'info');
            return;
        }

        const result = await window.appState.addTagsToTargets(ids, tags);
        if (!result?.success) {
            showToast(result?.error || 'Unable to add tags', 'error');
            return;
        }

        const tagList = result.tags.join(', ');
        showToast(`Added ${tagList} to ${result.count} target${result.count === 1 ? '' : 's'}`, 'success');
        const selected = window.appState.getSelectedTarget();
        if (selected) {
            renderTargetDetail(selected);
            if (DOM.detailTags) {
                DOM.detailTags.classList.add('tag-highlight');
                setTimeout(() => DOM.detailTags && DOM.detailTags.classList.remove('tag-highlight'), 900);
            }
        }
        renderTargetList();
        updateTargetListSelection(ids);
    }

    function handleSelectAllTargets() {
        const targets = window.appState.getFilteredTargets();
        if (!targets.length) {
            showToast('No targets to select', 'info');
            return;
        }
        window.appState.selectAll(targets.map(t => t.userId));
        updateSelectionToolbar(targets.map(t => t.userId));
    }

    async function refreshSelectedTargets() {
        const ids = getSelectedTargetIds();
        if (!ids.length) {
            showToast('Select targets first', 'info');
            return;
        }
        await window.appState.refreshTargets(ids);
        showToast(`Refreshing ${ids.length} selected target${ids.length === 1 ? '' : 's'}`, 'info');
    }

    async function toggleWatchForTargets(targets) {
        const selectedTargets = Array.isArray(targets) ? targets.filter(Boolean) : getTargetsForIds(getSelectedTargetIds());
        if (!selectedTargets.length) {
            showToast('Select targets first', 'info');
            return;
        }

        const shouldWatch = selectedTargets.some(target => !target.monitorOk);
        const result = await window.appState.setMonitorForTargets(selectedTargets.map(t => t.userId), shouldWatch);
        if (result?.success) {
            selectedTargets.forEach(target => {
                const updated = window.appState.getTarget(target.userId);
                syncReminderWatcher(updated);
            });
            showToast(
                shouldWatch
                    ? `Watching ${result.count} target${result.count === 1 ? '' : 's'}`
                    : `Stopped watching ${result.count} target${result.count === 1 ? '' : 's'}`,
                shouldWatch ? 'success' : 'info'
            );
        } else {
            showToast(result?.error || 'Unable to update watches', 'error');
        }
    }

    async function openBulkImportFromClipboard() {
        try {
            const text = await navigator.clipboard?.readText?.();
            if (!text) {
                showToast('Clipboard is empty', 'info');
                return;
            }
            openModal('modal-bulk-add');
            const input = document.getElementById('input-bulk-ids');
            if (input) {
                input.value = text;
                handleBulkPreview();
            }
        } catch (error) {
            console.error('Clipboard read failed', error);
            showToast('Could not read clipboard', 'error');
        }
    }

    function handleToggleFavorite() {
        const target = window.appState.getSelectedTarget();
        if (target) {
            window.appState.toggleFavorite(target.userId);
        }
    }

    function handleCustomNameChange(e) {
        const target = window.appState.getSelectedTarget();
        if (target) {
            window.appState.updateTarget(target.userId, { customName: e.target.value });
        }
    }

    function handleNotesChange(e) {
        const target = window.appState.getSelectedTarget();
        if (target) {
            window.appState.updateTarget(target.userId, { notes: e.target.value });
        }
    }

    function insertNotesTemplate(templateKey) {
        const template = NOTES_TEMPLATES[templateKey] || NOTES_TEMPLATES.stealth;
        const target = window.appState.getSelectedTarget();
        if (!target || !DOM.detailNotes) return;

        const existing = DOM.detailNotes.value.trim();
        const combined = existing ? `${existing}\n\n${template}` : template;
        DOM.detailNotes.value = combined;
        handleNotesChange({ target: { value: combined } });
        showToast('Template added to notes', 'success');
    }

    async function handleGroupChange(e) {
        const target = window.appState.getSelectedTarget();
        if (!target) return;

        const previousGroupId = target.groupId;
        const newGroupId = e.target.value;

        const result = await window.appState.moveTargetToGroup(target.userId, newGroupId);
        if (!result?.success) {
            // Revert UI selection on failure
            e.target.value = previousGroupId;
            showToast(result?.error || 'Could not move target to group', 'error');
        }
    }

    async function handleMonitorToggle(e) {
        const target = window.appState.getSelectedTarget();
        if (!target) return;

        const monitorOk = !!e.target.checked;
        const success = await window.appState.updateTarget(target.userId, { monitorOk });
        if (!success) {
            e.target.checked = !monitorOk;
            showToast('Unable to update alert preference', 'error');
            return;
        }

        const updated = window.appState.getTarget(target.userId);
        syncReminderWatcher(updated);
        setWatchButtonState(!!updated.monitorOk);
    }

    async function handleWatchButtonToggle() {
        const target = window.appState.getSelectedTarget();
        if (!target) return;

        const nextState = !target.monitorOk;
        const success = await window.appState.updateTarget(target.userId, { monitorOk: nextState });
        if (!success) {
            showToast('Unable to update alert preference', 'error');
            return;
        }

        const updated = window.appState.getTarget(target.userId);
        if (DOM.detailMonitorOk) {
            DOM.detailMonitorOk.checked = !!updated.monitorOk;
        }
        setWatchButtonState(!!updated.monitorOk);
        syncReminderWatcher(updated);
        showToast(updated.monitorOk ? 'Status watch enabled' : 'Status watch disabled', updated.monitorOk ? 'success' : 'info');
    }

    async function handleAttackPreventionNotify() {
        const targetFromModal = attackPreventionTargetId ? window.appState.getTarget(attackPreventionTargetId) : null;
        const selected = window.appState.getSelectedTarget();
        const target = targetFromModal || selected;

        if (!target) {
            showToast('Unable to enable alerts for this target', 'error');
            return;
        }

        const success = await window.appState.updateTarget(target.userId, { monitorOk: true });
        if (!success) {
            showToast('Could not enable release notification', 'error');
            return;
        }

        const updated = window.appState.getTarget(target.userId);
        const isActiveTarget = selected && updated && selected.userId === updated.userId;

        if (DOM.detailMonitorOk && isActiveTarget) {
            DOM.detailMonitorOk.checked = true;
        }
        if (isActiveTarget) {
            setWatchButtonState(true);
        }
        if (updated) {
            syncReminderWatcher(updated);
        }

        if (DOM.attackPreventionNotifyBtn) {
            DOM.attackPreventionNotifyBtn.disabled = true;
            DOM.attackPreventionNotifyBtn.classList.add('is-active');
            DOM.attackPreventionNotifyBtn.textContent = 'Release alert active';
        }

        attackPreventionTargetId = null;
        showToast('We will notify you when this target is released.', 'success');
        closeAllModals();
    }

    function setWatchButtonState(isOn) {
        if (!DOM.detailWatchBtn) return;
        DOM.detailWatchBtn.classList.toggle('active', isOn);
        if (DOM.detailWatchIcon) {
            DOM.detailWatchIcon.src = isOn ? 'assets/alert.png' : 'assets/alertoff.png';
            DOM.detailWatchIcon.alt = isOn ? 'Watch status on' : 'Watch status off';
        }
    }

    async function handleAddTarget() {
        const input = document.getElementById('input-target-id');
        const errorEl = document.getElementById('error-target-id');
        const customName = document.getElementById('input-target-name').value.trim();
        const groupId = document.getElementById('input-target-group').value;
        const notes = document.getElementById('input-target-notes').value.trim();

        const inputValue = input.value.trim();
        if (!inputValue) {
            errorEl.textContent = 'Please enter a user ID or URL';
            return;
        }

        const userId = InputParser.extractUserId(inputValue);
        if (!userId) {
            errorEl.textContent = 'Invalid user ID or URL format';
            return;
        }

        try {
            await window.appState.addTarget(userId, { customName, groupId, notes });
            closeAllModals();
            showToast('Target added successfully', 'success');
            
            // Clear form
            input.value = '';
            document.getElementById('input-target-name').value = '';
            document.getElementById('input-target-notes').value = '';
            errorEl.textContent = '';
        } catch (error) {
            errorEl.textContent = error.message;
        }
    }

    function scheduleBulkPreview() {
        const input = document.getElementById('input-bulk-ids');
        const preview = document.getElementById('bulk-preview');
        const confirmBtn = document.getElementById('btn-confirm-bulk');
        if (bulkPreviewTimer) {
            clearTimeout(bulkPreviewTimer);
            bulkPreviewTimer = null;
        }

        if (!input?.value?.trim()) {
            bulkPreviewIds = [];
            if (preview) preview.style.display = 'none';
            if (confirmBtn) confirmBtn.disabled = true;
            return;
        }

        if (preview) preview.style.display = 'none';
        if (confirmBtn) confirmBtn.disabled = true;
        bulkPreviewTimer = setTimeout(() => {
            bulkPreviewTimer = null;
            handleBulkPreview();
        }, 350);
    }

    function analyzeBulkInput(inputValue, ids) {
        const parts = String(inputValue || '').split(/[\n\r,;\s]+/).filter(Boolean);
        const seen = new Set();
        let duplicateCount = 0;

        parts.forEach(part => {
            const id = InputParser.extractUserId(part.trim());
            if (!id) return;
            if (seen.has(id)) {
                duplicateCount++;
            } else {
                seen.add(id);
            }
        });

        const existingCount = ids.filter(id => window.appState.getTarget(id)).length;
        return { duplicateCount, existingCount };
    }

    function handleBulkPreview() {
        const input = document.getElementById('input-bulk-ids');
        const preview = document.getElementById('bulk-preview');
        const validCount = document.getElementById('bulk-valid-count');
        const invalidCount = document.getElementById('bulk-invalid-count');
        const previewList = document.getElementById('bulk-preview-list');
        const confirmBtn = document.getElementById('btn-confirm-bulk');

        const { ids, invalid } = InputParser.parseUserIds(input.value);
        const { duplicateCount, existingCount } = analyzeBulkInput(input.value, ids);
        bulkPreviewIds = ids;

        const summary = [`${ids.length} valid ID${ids.length === 1 ? '' : 's'} found`];
        if (existingCount > 0) summary.push(`${existingCount} already tracked`);
        if (duplicateCount > 0) summary.push(`${duplicateCount} duplicate${duplicateCount === 1 ? '' : 's'} removed`);
        validCount.textContent = summary.join(' | ');
        invalidCount.textContent = `${invalid.length} invalid`;
        invalidCount.style.display = invalid.length > 0 ? 'inline' : 'none';

        const importableCount = ids.length - existingCount;

        if (ids.length > 0) {
            previewList.innerHTML = ids.slice(0, 20).map(id => 
                `<span class="preview-id">${id}</span>`
            ).join('') + (ids.length > 20 ? `<span class="preview-more">+${ids.length - 20} more</span>` : '')
                + (importableCount <= 0 ? '<span class="preview-error">All valid IDs are already tracked</span>' : '');
            confirmBtn.disabled = importableCount <= 0;
        } else {
            previewList.innerHTML = '<span class="preview-error">No valid IDs found</span>';
            confirmBtn.disabled = true;
        }

        preview.style.display = 'block';
    }

    async function handleBulkAdd() {
        if (bulkPreviewIds.length === 0) return;
        if (bulkPreviewTimer) {
            clearTimeout(bulkPreviewTimer);
            bulkPreviewTimer = null;
        }

        const groupId = document.getElementById('input-bulk-group').value;
        
        const result = await window.appState.addTargets(
            bulkPreviewIds.join('\n'),
            { groupId }
        );

        closeAllModals();
        
        if (result.added > 0) {
            showToast(`Added ${result.added} targets (${result.skipped} skipped)`, 'success');
        }

        if (result.limitReached) {
            showToast(`Target limit of ${window.appState.maxTargets} reached`, 'error');
        } else if (result.added === 0 && result.errors?.length) {
            showToast(result.errors[0], 'error');
        } else if (result.added === 0) {
            showToast('No new targets added', 'info');
        }

        // Clear form
        document.getElementById('input-bulk-ids').value = '';
        document.getElementById('bulk-preview').style.display = 'none';
        bulkPreviewIds = [];
    }

    async function handleAddGroup() {
        const nameInput = document.getElementById('input-group-name');
        const colorInput = document.getElementById('input-group-color');

        const name = nameInput.value.trim();
        if (!name) {
            showToast('Please enter a group name', 'error');
            return;
        }

        const created = await window.appState.addGroup(name, colorInput.value);
        if (created) {
            closeAllModals();
            showToast('Group created', 'success');
        } else {
            showToast('Could not create group', 'error');
            return;
        }

        // Clear form
        nameInput.value = '';
        colorInput.value = '#007acc';
    }

    async function handleEditGroup() {
        if (!contextGroupId) return;

        const nameInput = document.getElementById('input-edit-group-name');
        const colorInput = document.getElementById('input-edit-group-color');

        const name = nameInput.value.trim();
        if (!name) {
            showToast('Please enter a group name', 'error');
            return;
        }

        const success = await window.appState.updateGroup(contextGroupId, {
            name,
            color: colorInput.value
        });

        if (success) {
            closeAllModals();
            showToast('Group updated', 'success');
            contextGroupId = null;
        } else {
            showToast('Could not update group', 'error');
        }
    }

    // ========================================================================
    // TARGET CONTEXT MENU
    // ========================================================================

    function clearContextSubmenuTimer() {
        if (contextSubmenuTimer) {
            clearTimeout(contextSubmenuTimer);
            contextSubmenuTimer = null;
        }
    }

    function resetContextSubmenuState() {
        clearContextSubmenuTimer();
        DOM.contextMenu?.querySelector('.context-menu-item.has-submenu')?.classList.remove('submenu-open');
    }

    function bindContextMenuHoverPersistence() {
        const submenuItem = DOM.contextMenu?.querySelector('.context-menu-item.has-submenu');
        const submenu = DOM.groupSubmenu;
        if (!submenuItem || !submenu) return;

        const openSubmenu = () => {
            clearContextSubmenuTimer();
            submenuItem.classList.add('submenu-open');
        };

        const scheduleClose = () => {
            clearContextSubmenuTimer();
            contextSubmenuTimer = setTimeout(() => {
                submenuItem.classList.remove('submenu-open');
            }, 150);
        };

        submenuItem.addEventListener('mouseenter', openSubmenu);
        submenuItem.addEventListener('mouseleave', (e) => {
            if (submenu.contains(e.relatedTarget)) {
                openSubmenu();
                return;
            }
            scheduleClose();
        });

        submenu.addEventListener('mouseenter', openSubmenu);
        submenu.addEventListener('mouseleave', scheduleClose);
    }

    function showContextMenu(event, userId) {
        hideGroupContextMenu();
        contextTargetId = userId;
        updateContextMenuFavorite(userId);
        updateContextMenuWatch(userId);
        populateGroupSubmenu(userId);
        resetContextSubmenuState();

        DOM.contextMenu.style.left = `${event.clientX}px`;
        DOM.contextMenu.style.top = `${event.clientY}px`;
        DOM.contextMenu.classList.add('visible');

        // Adjust position if menu goes off screen
        const rect = DOM.contextMenu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            DOM.contextMenu.style.left = `${event.clientX - rect.width}px`;
        }
        if (rect.bottom > window.innerHeight) {
            DOM.contextMenu.style.top = `${event.clientY - rect.height}px`;
        }
    }

    function getActionTargetIds(contextId) {
        const selectedIds = window.appState.getSelectedIds ? window.appState.getSelectedIds() : [];
        const cid = parseInt(contextId, 10);
        const hasContext = Number.isFinite(cid);
        const selectionHasContext = hasContext && selectedIds.includes(cid);

        if (selectionHasContext) {
            return selectedIds.length ? selectedIds : [cid];
        }

        if (hasContext) {
            return [cid];
        }

        return selectedIds;
    }

    function getContextTargets(contextId) {
        const ids = getActionTargetIds(contextId);
        const targets = ids.map(id => window.appState.getTarget(id)).filter(Boolean);
        return { ids, targets };
    }

    function hideContextMenu() {
        DOM.contextMenu.classList.remove('visible');
        resetContextSubmenuState();
        contextTargetId = null;
    }

    function updateContextMenuFavorite(userId) {
        if (!DOM.contextMenuFavorite) return;
        const { targets } = getContextTargets(userId);
        const label = DOM.contextMenuFavorite.querySelector('span');
        const favoriteCount = targets.filter(t => t.isFavorite).length;
        const hasTargets = targets.length > 0;
        const allFavorite = hasTargets && favoriteCount === targets.length;
        const shouldAdd = hasTargets && favoriteCount < targets.length;
        const multi = targets.length > 1;

        DOM.contextMenuFavorite.classList.toggle('active', allFavorite);

        if (label) {
            if (!hasTargets) {
                label.textContent = 'Toggle Favorite';
            } else if (multi) {
                label.textContent = shouldAdd
                    ? `Add ${targets.length} to Favorites`
                    : `Remove ${targets.length} from Favorites`;
            } else {
                label.textContent = allFavorite ? 'Remove Favorite' : 'Mark Favorite';
            }
        }
    }

    function updateContextMenuWatch(userId) {
        if (!DOM.contextMenuWatch) return;
        const { targets } = getContextTargets(userId);
        const label = DOM.contextMenuWatch.querySelector('span');
        const watchCount = targets.filter(t => t.monitorOk).length;
        const hasTargets = targets.length > 0;
        const allWatching = hasTargets && watchCount === targets.length;
        const shouldWatch = hasTargets && watchCount < targets.length;
        const multi = targets.length > 1;

        DOM.contextMenuWatch.classList.toggle('active', allWatching);

        if (label) {
            if (!hasTargets) {
                label.textContent = 'Watch Status';
            } else if (multi) {
                label.textContent = shouldWatch
                    ? `Watch Status (${targets.length})`
                    : `Ignore Status (${targets.length})`;
            } else {
                label.textContent = shouldWatch ? 'Watch Status' : 'Ignore Status';
            }
        }
    }

    function populateGroupSubmenu(userId) {
        const groupSubmenu = DOM.groupSubmenu;
        if (!groupSubmenu) return;

        const target = window.appState.getTarget(userId);
        const currentGroupId = target?.groupId || 'default';
        const groups = window.appState.groups;

        // Build submenu HTML with all groups
        groupSubmenu.innerHTML = groups.map(group => {
            const isCurrentGroup = group.id === currentGroupId;
            const safeColor = sanitizeHexColor(group.color);
            const checkmark = isCurrentGroup
                ? '<svg class="checkmark" viewBox="0 0 24 24"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>'
                : '';

            return `
                <div class="context-submenu-item" data-group-id="${group.id}">
                    <span class="group-color" style="background: ${safeColor};"></span>
                    <span>${escapeHtml(group.name)}</span>
                    ${checkmark}
                </div>
            `;
        }).join('');

        // Bind click events to submenu items
        groupSubmenu.querySelectorAll('.context-submenu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const groupId = item.dataset.groupId;
                handleMoveToGroup(userId, groupId);
                hideContextMenu();
            });
        });
    }

    async function handleMoveToGroup(userId, groupId) {
        const ids = getActionTargetIds(userId);
        if (!ids.length) return;

        const group = window.appState.getGroup(groupId);
        if (!group) {
            showToast('Group not found', 'error');
            return;
        }

        const result = await window.appState.bulkMoveTargets(ids, groupId);
        if (result?.success) {
            showToast(`Moved ${result.moved || ids.length} target${ids.length === 1 ? '' : 's'} to ${group.name}`, 'success');
            renderTargetList();
        } else {
            showToast(result?.error || 'Could not move targets', 'error');
        }
    }

    async function handleContextAction(action, targetId = null) {
        const userId = targetId ?? contextTargetId;
        if (!userId) return;

        switch (action) {
            case 'attack':
                handleAttackById(userId, 'context-menu');
                break;
            case 'profile':
                window.electronAPI.openProfile(userId);
                break;
            case 'copy-id':
                await copyTargetsToClipboard(getCopyTargets(userId), 'ids');
                break;
            case 'copy-profile':
                await copyTargetsToClipboard(getCopyTargets(userId), 'profiles');
                break;
            case 'copy-attack':
                await copyTargetsToClipboard(getCopyTargets(userId), 'attacks');
                break;
            case 'favorite': {
                const { ids, targets } = getContextTargets(userId);
                if (!targets.length) {
                    showToast('No targets selected', 'info');
                    break;
                }

                if (ids.length === 1) {
                    await window.appState.toggleFavorite(ids[0]);
                    updateContextMenuFavorite(ids[0]);
                    break;
                }

                const favoriteCount = targets.filter(t => t.isFavorite).length;
                const makeFavorite = favoriteCount < targets.length;
                const result = await window.appState.setFavoritesForTargets(ids, makeFavorite);

                if (!result?.success) {
                    showToast(result?.error || 'Unable to update favorites', 'error');
                    break;
                }

                updateContextMenuFavorite(userId);

                if (result.updated > 0) {
                    const message = makeFavorite
                        ? `Added ${result.updated} target${result.updated === 1 ? '' : 's'} to favorites`
                        : `Removed favorites from ${result.updated} target${result.updated === 1 ? '' : 's'}`;
                    showToast(message, 'success');
                } else {
                    const infoMessage = makeFavorite
                        ? 'All selected targets are already favorites'
                        : 'No favorites to remove in selection';
                    showToast(infoMessage, 'info');
                }
                break;
            }
            case 'toggle-watch': {
                const { ids, targets } = getContextTargets(userId);
                if (!targets.length) {
                    showToast('No targets selected', 'info');
                    break;
                }

                if (ids.length === 1) {
                    const target = targets[0];
                    const monitorOk = !target.monitorOk;
                    await window.appState.updateTarget(target.userId, { monitorOk });
                    const updated = window.appState.getTarget(target.userId);
                    syncReminderWatcher(updated);
                    updateContextMenuWatch(target.userId);
                    showToast(monitorOk ? 'Status watch enabled' : 'Status watch disabled', monitorOk ? 'success' : 'info');
                    break;
                }

                const watchCount = targets.filter(t => t.monitorOk).length;
                const enableWatch = watchCount < targets.length;
                const result = await window.appState.setMonitorForTargets(ids, enableWatch);

                if (result?.success) {
                    updateContextMenuWatch(userId);
                    const message = enableWatch
                        ? `Watching status for ${result.count} target${result.count === 1 ? '' : 's'}`
                        : `Ignored status for ${result.count} target${result.count === 1 ? '' : 's'}`;
                    showToast(message, enableWatch ? 'success' : 'info');
                } else {
                    showToast(result?.error || 'Unable to update watches', 'error');
                }
                break;
            }
            case 'refresh':
                window.appState.refreshTarget(userId);
                break;
            case 'select-all': {
                handleSelectAllTargets();
                break;
            }
            case 'clear-selection': {
                window.appState.clearSelection();
                updateTargetListSelection([]);
                break;
            }
            case 'add-tags': {
                const ids = getActionTargetIds(userId);
                handleBulkAddTags(ids);
                break;
            }
            case 'remove-from-group':
                const targetForGroup = window.appState.getTarget(userId);
                if (targetForGroup && targetForGroup.groupId !== 'default') {
                    const currentGroup = window.appState.getGroup(targetForGroup.groupId);
                    showConfirm(
                        'Remove from Group',
                        `Remove ${targetForGroup.getDisplayName()} from ${currentGroup?.name || 'group'}?`,
                        async () => {
                            const result = await window.appState.moveTargetToGroup(userId, 'default');
                            if (result?.success) {
                                showToast('Removed from group', 'success');
                            } else {
                                showToast(result?.error || 'Could not remove from group', 'error');
                            }
                        }
                    );
                } else {
                    showToast('Target is already in the default group', 'info');
                }
                break;
            case 'remove': {
                const selectedIds = window.appState.getSelectedIds ? window.appState.getSelectedIds() : [];
                const isMulti = selectedIds.length > 1 && selectedIds.includes(userId);
                if (isMulti) {
                    showConfirm(
                        'Remove Targets',
                        `Remove ${selectedIds.length} selected targets? A backup will be created first.`,
                        async () => {
                            await window.appState.removeTargets(selectedIds);
                            window.appState.clearSelection();
                            renderTargetList();
                            showToast('Targets removed', 'success');
                        }
                    );
                    break;
                }
                const target = window.appState.getTarget(userId);
                showConfirm(
                    'Remove Target',
                    `Remove ${target?.getDisplayName() || userId}?`,
                    async () => {
                        await window.appState.removeTarget(userId);
                        showToast('Target removed', 'success');
                    }
                );
                break;
            }
        }
    }

    // ========================================================================
    // GROUP CONTEXT MENU
    // ========================================================================

    function showGroupContextMenu(event, groupId) {
        // Don't show context menu for default "All Targets" group
        if (groupId === 'all') {
            event.preventDefault();
            return;
        }

        hideContextMenu();
        contextGroupId = groupId;

        // Update flag menu item text based on current state
        const group = window.appState.getGroup(groupId);
        const flagMenuItem = DOM.groupContextMenu.querySelector('[data-action="flag-no-attack"]');
        if (flagMenuItem && group) {
            const span = flagMenuItem.querySelector('span');
            if (group.noAttack) {
                span.textContent = '✓ Flag: Do Not Attack';
                flagMenuItem.style.fontWeight = 'bold';
            } else {
                span.textContent = 'Flag: Do Not Attack';
                flagMenuItem.style.fontWeight = 'normal';
            }
        }

        DOM.groupContextMenu.style.left = `${event.clientX}px`;
        DOM.groupContextMenu.style.top = `${event.clientY}px`;
        DOM.groupContextMenu.classList.add('visible');

        // Adjust position if menu goes off screen
        const rect = DOM.groupContextMenu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            DOM.groupContextMenu.style.left = `${event.clientX - rect.width}px`;
        }
        if (rect.bottom > window.innerHeight) {
            DOM.groupContextMenu.style.top = `${event.clientY - rect.height}px`;
        }
    }

    function hideGroupContextMenu() {
        DOM.groupContextMenu.classList.remove('visible');
        contextGroupId = null;
    }

    async function handleGroupContextAction(action) {
        if (!contextGroupId) return;

        const group = window.appState.getGroup(contextGroupId);
        if (!group) return;

        const groupTargets = Array.from(window.appState.targets.values())
            .filter(t => t.groupId === contextGroupId);

        switch (action) {
            case 'flag-no-attack':
                debugLog('Flag-no-attack clicked for group:', contextGroupId, group);
                const currentFlag = await window.appState.toggleGroupNoAttack(contextGroupId);
                debugLog('Toggle result:', currentFlag);

                if (currentFlag) {
                    showPremiumAlert({
                        title: 'Attack Prevention Enabled',
                        message: `The group "${group.name}" has been flagged as "Do Not Attack". You will be prompted before attacking targets in this group.`,
                        icon: '🚫',
                        iconType: 'warning',
                        buttons: [
                            { text: 'OK', type: 'primary', action: null },
                            { text: 'Close', type: 'secondary', action: null }
                        ]
                    });
                    showToast(`✓ Flagged "${group.name}" - attacks will require confirmation`, 'warning');
                } else {
                    showToast(`Removed attack prevention flag from "${group.name}"`, 'info');
                }

                // Force UI update
                renderGroups();
                renderTargetList();
                break;

            case 'refresh-group':
                if (groupTargets.length === 0) {
                    showToast('No targets in this group', 'info');
                    break;
                }
                showPremiumAlert({
                    title: 'Refresh Group',
                    message: `Refresh all ${groupTargets.length} target(s) in "${group.name}"?`,
                    icon: '🔄',
                    iconType: 'info',
                    buttons: [
                        {
                            text: 'Refresh',
                            type: 'primary',
                            action: async () => {
                                const targetIds = groupTargets.map(t => t.userId);
                                await window.appState.refreshTargets(targetIds);
                                showToast(`Refreshing ${groupTargets.length} targets...`, 'info');
                            }
                        },
                        { text: 'Cancel', type: 'secondary', action: null }
                    ]
                });
                break;

            case 'attack-all':
                const attackableTargets = groupTargets.filter(t => t.isAttackable());
                if (attackableTargets.length === 0) {
                    showToast('No attackable targets in this group', 'info');
                    break;
                }
                showPremiumAlert({
                    title: 'Attack All Attackable',
                    message: `Attack all ${attackableTargets.length} attackable target(s) in "${group.name}"? This will open ${attackableTargets.length} browser tab(s).`,
                    icon: '⚡',
                    iconType: 'warning',
                    buttons: [
                        {
                            text: 'Attack All',
                            type: 'danger',
                            action: () => {
                                attackableTargets.forEach(target => {
                                    handleAttackById(target.userId, 'group-context');
                                });
                                showToast(`Attacking ${attackableTargets.length} targets...`, 'success');
                            }
                        },
                        { text: 'Cancel', type: 'secondary', action: null }
                    ]
                });
                break;

            case 'mark-favorites':
                if (groupTargets.length === 0) {
                    showToast('No targets in this group', 'info');
                    break;
                }
                showPremiumAlert({
                    title: 'Mark as Favorites',
                    message: `Mark all ${groupTargets.length} target(s) in "${group.name}" as favorites?`,
                    icon: '⭐',
                    iconType: 'success',
                    buttons: [
                        {
                            text: 'Mark All',
                            type: 'primary',
                            action: async () => {
                                for (const target of groupTargets) {
                                    if (!target.isFavorite) {
                                        await window.appState.toggleFavorite(target.userId);
                                    }
                                }
                                showToast(`Marked ${groupTargets.length} targets as favorites`, 'success');
                            }
                        },
                        { text: 'Cancel', type: 'secondary', action: null }
                    ]
                });
                break;

            case 'watch-all':
            case 'unwatch-all':
                if (groupTargets.length === 0) {
                    showToast('No targets in this group', 'info');
                    break;
                }
                const monitorOk = action === 'watch-all';
                const verb = monitorOk ? 'Enable' : 'Disable';
                showPremiumAlert({
                    title: `${verb} Status Watch`,
                    message: `${verb} status watch for all ${groupTargets.length} target(s) in "${group.name}"?`,
                    icon: '⏱️',
                    iconType: 'info',
                    buttons: [
                        {
                            text: verb,
                            type: 'primary',
                            action: async () => {
                                const ids = groupTargets.map(t => t.userId);
                                const result = await window.appState.setMonitorForTargets(ids, monitorOk);
                                if (result?.success) {
                                    ids.forEach(id => {
                                        const t = window.appState.getTarget(id);
                                        if (t) syncReminderWatcher(t);
                                    });
                                    renderTargetList();
                                    showToast(`${verb}d watch for ${result.count} target(s)`, monitorOk ? 'success' : 'info');
                                } else {
                                    showToast(result?.error || 'Unable to update watches', 'error');
                                }
                            }
                        },
                        { text: 'Cancel', type: 'secondary', action: null }
                    ]
                });
                break;

            case 'export-group':
                if (groupTargets.length === 0) {
                    showToast('No targets to export', 'info');
                    break;
                }
                const targetIds = groupTargets.map(t => t.userId).join(', ');
                navigator.clipboard.writeText(targetIds);
                showToast(`Copied ${groupTargets.length} target IDs to clipboard`, 'success');
                break;

            case 'duplicate':
                const newGroupName = `${group.name} (Copy)`;
                const newGroup = await window.appState.addGroup(newGroupName, group.color);
                if (newGroup) {
                    showToast(`Created "${newGroupName}"`, 'success');
                } else {
                    showToast('Could not duplicate group', 'error');
                }
                break;

            case 'edit':
                const nameInput = document.getElementById('input-edit-group-name');
                const colorInput = document.getElementById('input-edit-group-color');
                const colorPreview = document.getElementById('edit-color-preview');

                nameInput.value = group.name;
                colorInput.value = group.color;
                colorPreview.style.backgroundColor = group.color;

                openModal('modal-edit-group');
                break;

            case 'delete':
                const targetCount = groupTargets.length;
                const message = targetCount > 0
                    ? `Delete "${group.name}"? ${targetCount} target(s) will be moved to the default group.`
                    : `Delete "${group.name}"?`;

                showConfirm(
                    'Delete Group',
                    message,
                    async () => {
                        const success = await window.appState.removeGroup(contextGroupId);
                        if (success) {
                            showToast('Group deleted', 'success');
                        } else {
                            showToast('Could not delete group', 'error');
                        }
                    }
                );
                break;
        }
    }

    // ========================================================================
    // KEYBOARD SHORTCUTS
    // ========================================================================

    function handleKeyDown(e) {
        if (handleMenubarKey(e)) {
            return;
        }

        const ctrlOrMeta = e.ctrlKey || e.metaKey;
        const key = (e.key || '').toLowerCase();

        if (ctrlOrMeta && key === 'f' && !e.shiftKey && !document.querySelector('.modal-overlay.visible')) {
            e.preventDefault();
            focusTargetSearch();
            return;
        }

        if (key === 'f1') {
            e.preventDefault();
            showOnboarding(true);
            return;
        }

        if (DOM.onboardingOverlay?.classList.contains('visible')) {
            if (key === 'escape') {
                hideOnboarding();
                return;
            }
            if (key === 'arrowright') {
                changeOnboardingStep(1);
                return;
            }
            if (key === 'arrowleft') {
                changeOnboardingStep(-1);
                return;
            }
        }

        // Ignore if typing in input
        if (e.target.matches('input, textarea, select')) {
            if (e.key === 'Escape') {
                e.target.blur();
            }
            return;
        }

        // Modal is open
        if (document.querySelector('.modal-overlay.visible')) {
            if (e.key === 'Escape') {
                closeAllModals();
            }
            return;
        }

        // Global shortcuts
        if (ctrlOrMeta && e.shiftKey) {
            switch (key) {
                case 'b':
                    e.preventDefault();
                    openModal('modal-bulk-add');
                    break;
                case 'c':
                    e.preventDefault();
                    copyTargetsToClipboard(getTargetsForIds(getSelectedTargetIds()), 'ids');
                    break;
                case 'f':
                    e.preventDefault();
                    clearTargetFilters();
                    break;
                case 'o':
                    e.preventDefault();
                    handleImportTargets();
                    break;
                case 'k':
                    e.preventDefault();
                    handleCreateBackup();
                    break;
                case 'r':
                    if (hasSelectedTarget()) {
                        e.preventDefault();
                        const target = getSelectedTargetSafe();
                        if (target) {
                            window.appState.refreshTarget(target.userId);
                        }
                    }
                    break;
            }
            return;
        }

        if (ctrlOrMeta) {
            switch (key) {
                case 'n':
                    e.preventDefault();
                    openModal('modal-add-target');
                    break;
                case 'r':
                    e.preventDefault();
                    window.appState.refreshAllTargets();
                    break;
                case ',':
                    e.preventDefault();
                    switchView('settings');
                    break;
                case '1':
                    e.preventDefault();
                    switchView('targets');
                    break;
                case '2':
                    e.preventDefault();
                    switchView('history');
                    break;
                case '3':
                    e.preventDefault();
                    switchView('statistics');
                    break;
                case '4':
                    e.preventDefault();
                    switchView('loot-timer');
                    break;
                case '5':
                    e.preventDefault();
                    switchView('bounties');
                    break;
                case '6':
                    e.preventDefault();
                    switchView('help');
                    break;
                case 'a':
                    if (window.appState.currentView === 'targets') {
                        e.preventDefault();
                        handleSelectAllTargets();
                    }
                    break;
            }
            return;
        }

        if (key === '/' && window.appState.currentView === 'targets') {
            e.preventDefault();
            focusTargetSearch(false);
            return;
        }

        // Target-specific shortcuts
        const selected = window.appState.getSelectedTarget();
        const selectedIds = window.appState.getSelectedIds ? window.appState.getSelectedIds() : [];

        switch (e.key) {
            case 'Enter':
                if (selected && selected.isAttackable()) {
                    handleAttackById(selected.userId, 'keyboard');
                }
                break;
            case 'Delete':
            case 'Backspace':
                if (selectedIds.length > 1) {
                    handleBulkRemoveTargets();
                } else if (selected) {
                    handleRemoveTarget();
                }
                break;
            case 'Escape':
                window.appState.selectTarget(null);
                break;
            case 'ArrowUp':
            case 'ArrowDown':
                e.preventDefault();
                navigateTargetList(e.key === 'ArrowUp' ? -1 : 1);
                break;
            case 'PageUp':
            case 'PageDown':
                e.preventDefault();
                navigateTargetList(e.key === 'PageUp' ? -1 : 1, { page: true, clamp: true });
                break;
            case 'Home':
                if (window.appState.currentView === 'targets') {
                    e.preventDefault();
                    selectTargetAtIndex(0);
                }
                break;
            case 'End':
                if (window.appState.currentView === 'targets') {
                    e.preventDefault();
                    selectTargetAtIndex((window.appState.getFilteredTargets?.() || []).length - 1);
                }
                break;
            case 'f':
                if (selected) {
                    window.appState.toggleFavorite(selected.userId);
                }
                break;
            case 'w':
                if (selectedIds.length) {
                    toggleWatchForTargets(getTargetsForIds(selectedIds));
                }
                break;
        }
    }

    function selectTargetAtIndex(index) {
        const targets = window.appState.getFilteredTargets();
        if (targets.length === 0) return;
        const safeIndex = Math.max(0, Math.min(targets.length - 1, index));
        const nextId = targets[safeIndex].userId;
        window.appState.selectTarget(nextId, { anchorId: nextId });
        const item = DOM.targetList.querySelector(`[data-user-id="${nextId}"]`);
        item?.scrollIntoView({ block: 'nearest' });
    }

    function navigateTargetList(direction, options = {}) {
        const targets = window.appState.getFilteredTargets();
        if (targets.length === 0) return;

        const currentId = window.appState.selectedTargetId;
        const currentIndex = targets.findIndex(t => t.userId === currentId);
        const itemHeight = DOM.targetList?.querySelector('.target-item')?.getBoundingClientRect?.().height || 48;
        const pageStep = Math.max(1, Math.floor((DOM.targetList?.clientHeight || itemHeight) / itemHeight) - 1);
        const step = options.page ? pageStep : 1;
        
        let newIndex;
        if (currentIndex === -1) {
            newIndex = direction === 1 ? 0 : targets.length - 1;
        } else {
            newIndex = currentIndex + (direction * step);
            if (options.clamp) {
                newIndex = Math.max(0, Math.min(targets.length - 1, newIndex));
            } else {
                if (newIndex < 0) newIndex = targets.length - 1;
                if (newIndex >= targets.length) newIndex = 0;
            }
        }

        selectTargetAtIndex(newIndex);
    }

    // ========================================================================
    // ABOUT
    // ========================================================================

    async function ensureAppInfo() {
        if (appInfoCache) return appInfoCache;
        try {
            appInfoCache = await window.electronAPI.getAppInfo();
            return appInfoCache;
        } catch (error) {
            console.error('Failed to load app info', error);
            return null;
        }
    }

    async function showAboutModal() {
        const info = await ensureAppInfo();
        if (info) {
            DOM.aboutVersion && (DOM.aboutVersion.textContent = info.version || '-');
            DOM.aboutDataPath && (DOM.aboutDataPath.textContent = info.path || '-');
        }

        const targets = window.appState.getTargets();
        const attackable = targets.filter(t => t.isAttackable()).length;

        if (DOM.aboutTargetsCount) DOM.aboutTargetsCount.textContent = formatNumber(targets.length);
        if (DOM.aboutAttackableCount) DOM.aboutAttackableCount.textContent = formatNumber(attackable);
        if (DOM.aboutRefreshInterval) DOM.aboutRefreshInterval.textContent = 'On selection change';

        // Color-coded API status
        if (DOM.aboutApiStatus) {
            const hasApiKey = window.appState.api && window.appState.api.hasApiKey();
            const isOnline = window.appState.isOnline;
            const hasErrors = window.appState.api && window.appState.api.consecutiveFailures > 0;

            // Remove all status classes from both value and icon
            DOM.aboutApiStatus.classList.remove('api-status-online', 'api-status-error', 'api-status-missing');
            DOM.aboutApiIcon?.classList.remove('api-status-online', 'api-status-error', 'api-status-missing');

            // Determine status and apply appropriate class
            if (!hasApiKey) {
                // Red - API key is missing
                DOM.aboutApiStatus.textContent = 'Missing';
                DOM.aboutApiStatus.classList.add('api-status-missing');
                DOM.aboutApiIcon?.classList.add('api-status-missing');
            } else if (!isOnline || hasErrors) {
                // Burnt orange - there are errors or offline
                DOM.aboutApiStatus.textContent = hasErrors ? 'Error' : 'Offline';
                DOM.aboutApiStatus.classList.add('api-status-error');
                DOM.aboutApiIcon?.classList.add('api-status-error');
            } else {
                // Green - connected and working
                DOM.aboutApiStatus.textContent = 'Online';
                DOM.aboutApiStatus.classList.add('api-status-online');
                DOM.aboutApiIcon?.classList.add('api-status-online');
            }
        }

        if (DOM.aboutLastRefresh) {
            DOM.aboutLastRefresh.textContent = window.appState.lastRefresh ? formatTimestamp(window.appState.lastRefresh) : 'Never';
        }

        openModal('modal-about');
    }

    // ========================================================================
    // MODALS
    // ========================================================================

    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('visible');
            
            // Focus first input
            const firstInput = modal.querySelector('input, textarea');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }

            // Update group selects
            if (modalId === 'modal-add-target' || modalId === 'modal-bulk-add') {
                updateGroupSelects();
            }
        }
    }

    function closeAllModals() {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.classList.remove('visible');
        });
    }

    // ========================================================================
    // CONNECTION DIALOG
    // ========================================================================

    async function refreshConnectionIndicators() {
        if (connectionCheckInProgress) {
            return;
        }

        if (!window.electronAPI?.checkInternetConnection) {
            return;
        }

        connectionCheckInProgress = true;

        const setConnectionFlag = (key, value) => {
            localStorage.setItem(key, value ? 'true' : 'false');
        };

        try {
            const [internetResult, tornApiResult, tornStatsResult] = await Promise.allSettled([
                window.electronAPI.checkInternetConnection(),
                window.electronAPI.checkTornApiConnection?.(),
                window.electronAPI.checkTornStatsConnection?.()
            ]);

            setConnectionFlag('connection_internet',
                internetResult.status === 'fulfilled' && !!internetResult.value?.connected);
            setConnectionFlag('connection_tornapi',
                tornApiResult.status === 'fulfilled' && !!tornApiResult.value?.connected);
            setConnectionFlag('connection_tornstats',
                tornStatsResult.status === 'fulfilled' && !!tornStatsResult.value?.connected);
        } catch (error) {
            console.error('Failed to refresh connection indicators', error);
            setConnectionFlag('connection_internet', false);
            setConnectionFlag('connection_tornapi', false);
            setConnectionFlag('connection_tornstats', false);
        } finally {
            connectionCheckInProgress = false;
            updateWifiIcon();
        }
    }

    async function openConnectionDialog() {
        // Open the new Electron connection window
        if (window.electronAPI && window.electronAPI.openConnectionDialog) {
            try {
                await window.electronAPI.openConnectionDialog();
            } catch (error) {
                console.error('Failed to open connection dialog:', error);
                // Fallback to built-in dialog if Electron API fails
                if (DOM.connectionDialog) {
                    DOM.connectionDialog.classList.add('active');
                    updateConnectionDialogState();
                }
            }
        } else {
            // Fallback for browser testing
            if (DOM.connectionDialog) {
                DOM.connectionDialog.classList.add('active');
                updateConnectionDialogState();
            }
        }
    }

    async function openBackupDialog() {
        // Open the backup/restore dialog
        if (window.electronAPI && window.electronAPI.openBackupDialog) {
            try {
                await window.electronAPI.openBackupDialog();
            } catch (error) {
                console.error('Failed to open backup dialog:', error);
                showNotification('Failed to open backup dialog', 'error');
            }
        } else {
            showNotification('Backup dialog not available', 'warning');
        }
    }

    function closeConnectionDialog() {
        if (DOM.connectionDialog) {
            DOM.connectionDialog.classList.remove('active');
        }
    }

    /**
     * Update WiFi icon curves based on connection status
     * Curve 1 (bottom) = Internet
     * Curve 2 (middle) = Torn API
     * Curve 3 (top) = TornStats
     */
    function updateWifiIcon() {
        const wifiIcons = document.querySelectorAll('.wifi-icon');

        if (wifiIcons.length === 0) {
            console.warn('[WiFi Icon] No WiFi icons found');
            return;
        }

        // Helper function to update gradient colors
        function setGradientColors(icon, gradientNum, isActive) {
            const gradStartClass = `.grad-start-${gradientNum}`;
            const gradEndClass = `.grad-end-${gradientNum}`;

            const startStop = icon.querySelector(gradStartClass);
            const endStop = icon.querySelector(gradEndClass);

            if (startStop && endStop) {
                if (isActive) {
                    // Active: bright green gradient
                    startStop.setAttribute('stop-color', '#5ee6c4');
                    endStop.setAttribute('stop-color', '#4ecbb0');
                } else {
                    // Inactive: dim gray
                    startStop.setAttribute('stop-color', '#2a2e35');
                    endStop.setAttribute('stop-color', '#1f2228');
                }
            }
        }

        // Read connection states from localStorage (set by connection dialog)
        const internetConnected = localStorage.getItem('connection_internet') === 'true';
        const tornApiConnected = localStorage.getItem('connection_tornapi') === 'true';
        const tornStatsConnected = localStorage.getItem('connection_tornstats') === 'true';

        wifiIcons.forEach((icon, index) => {
            const curve1 = icon.querySelector('.wifi-curve-1'); // Internet
            const curve2 = icon.querySelector('.wifi-curve-2'); // Torn API
            const curve3 = icon.querySelector('.wifi-curve-3'); // TornStats

            // Update Internet connection (curve 1 - bottom)
            if (curve1) {
                if (internetConnected) {
                    curve1.classList.add('active');
                    curve1.classList.remove('error');
                    setGradientColors(icon, 1, true);
                } else {
                    curve1.classList.remove('active');
                    curve1.classList.add('error');
                    setGradientColors(icon, 1, false);
                }
            }

            // Update Torn API connection (curve 2 - middle)
            if (curve2) {
                if (tornApiConnected) {
                    curve2.classList.add('active');
                    curve2.classList.remove('error');
                    setGradientColors(icon, 2, true);
                } else {
                    curve2.classList.remove('active');
                    curve2.classList.add('error');
                    setGradientColors(icon, 2, false);
                }
            }

            // Update TornStats connection (curve 3 - top)
            if (curve3) {
                if (tornStatsConnected) {
                    curve3.classList.add('active');
                    curve3.classList.remove('error');
                    setGradientColors(icon, 3, true);
                } else {
                    curve3.classList.remove('active');
                    curve3.classList.remove('error');
                    setGradientColors(icon, 3, false);
                }
            }
        });

        // Log update for debugging
        debugLog('[WiFi Icon] Updated', {
            internet: internetConnected,
            tornAPI: tornApiConnected,
            tornStats: tornStatsConnected
        });
    }

    function updateConnectionDialogState() {
        // Update WiFi icon
        updateWifiIcon();

        // Update Torn API connection
        const tornApi = window.tornAPI;
        const appState = window.appState;

        if (tornApi) {
            const hasApiKey = tornApi.hasApiKey();
            const hasSuccessfulRequest = tornApi.lastSuccessfulRequest !== null;
            const hasTargets = appState?.getTargets?.()?.length > 0;

            // Consider API connected if it has a key and either:
            // 1. Has made successful requests, OR
            // 2. Is marked as online, OR
            // 3. Has loaded targets (which requires API access)
            const apiConnected = hasApiKey && (hasSuccessfulRequest || tornApi.isOnline || hasTargets);
            const isRefreshing = appState?.isRefreshing || false;
            const apiItem = DOM.connTornApi;

            if (apiItem) {
                apiItem.classList.remove('connected', 'disconnected', 'checking');

                if (!hasApiKey) {
                    apiItem.classList.add('disconnected');
                    const statusText = apiItem.querySelector('.connection-status');
                    if (statusText) {
                        statusText.textContent = 'No API Key';
                    }
                } else if (isRefreshing) {
                    apiItem.classList.add('checking');
                    const statusText = apiItem.querySelector('.connection-status');
                    if (statusText) {
                        statusText.textContent = 'Refreshing...';
                    }
                } else {
                    apiItem.classList.add(apiConnected ? 'connected' : 'disconnected');
                    const statusText = apiItem.querySelector('.connection-status');
                    if (statusText) {
                        if (apiConnected) {
                            const lastRequest = tornApi.lastSuccessfulRequest;
                            if (lastRequest) {
                                statusText.textContent = `Connected (${formatTimestamp(lastRequest)})`;
                            } else {
                                statusText.textContent = 'Connected';
                            }
                        } else {
                            statusText.textContent = 'Ready';
                        }
                    }
                }
            }

            // Update API rate
            if (DOM.apiRate) {
                const rateValue = DOM.apiRate.querySelector('.detail-value');
                if (rateValue && tornApi.limiter) {
                    const status = tornApi.limiter.getStatus();
                    if (status) {
                        const available = status.availableTokens || 0;
                        const max = status.maxTokens || 100;
                        rateValue.textContent = `${available}/${max}`;
                    } else {
                        rateValue.textContent = '--/min';
                    }
                } else {
                    rateValue.textContent = '--/min';
                }
            }

            // Update API latency
            if (DOM.apiLatency) {
                const latencyValue = DOM.apiLatency.querySelector('.detail-value');
                if (latencyValue) {
                    const lastDuration = tornApi.lastRequestDuration || 0;
                    if (lastDuration > 0) {
                        latencyValue.textContent = `${lastDuration} ms`;
                    } else if (!hasApiKey) {
                        latencyValue.textContent = 'No API Key';
                    } else {
                        latencyValue.textContent = '-- ms';
                    }
                }
            }
        }

        // Update Internet connection
        const internetConnected = window.appState?.isOnline ?? navigator.onLine;
        const internetItem = DOM.connInternet;

        if (internetItem) {
            internetItem.classList.remove('connected', 'disconnected', 'checking');
            internetItem.classList.add(internetConnected ? 'connected' : 'disconnected');

            const statusText = internetItem.querySelector('.connection-status');
            if (statusText) {
                statusText.textContent = internetConnected ? 'Connected' : 'Disconnected';
            }
        }

        // Update network status detail
        if (DOM.netStatus) {
            const netValue = DOM.netStatus.querySelector('.detail-value');
            if (netValue) {
                netValue.textContent = internetConnected ? 'Online' : 'Offline';
            }
        }

        // Update TornStats API connection
        const statsItem = DOM.connTornStats;
        if (statsItem) {
            // Check if we have recent TornStats data
            const hasStatsData = window.appState?.lootData?.size > 0;

            statsItem.classList.remove('connected', 'disconnected', 'checking');
            statsItem.classList.add(hasStatsData ? 'connected' : 'disconnected');

            const statusText = statsItem.querySelector('.connection-status');
            if (statusText) {
                statusText.textContent = hasStatsData ? 'Connected' : 'Not Active';
            }
        }

        // Update TornStats last fetch
        if (DOM.statsLastFetch) {
            const fetchValue = DOM.statsLastFetch.querySelector('.detail-value');
            if (fetchValue) {
                const lastFetch = window.appState?.lastLootFetch;
                if (lastFetch) {
                    fetchValue.textContent = formatTimestamp(lastFetch);
                } else {
                    fetchValue.textContent = 'Never';
                }
            }
        }
    }

    function showAttackPrevention(target) {
        if (!target) return;

        attackPreventionTargetId = target.userId || null;

        // Determine status and icon
        let statusText = 'Unavailable';
        let iconSrc = 'assets/hospital.png';
        let message = 'This user is currently unavailable. You cannot attack them at this time.';
        let statusClass = 'status-error';
        const rawReason = (target.statusReason || target.statusDesc || '').trim();
        const reason = rawReason && !/^in (hospital|jail|federal)/i.test(rawReason) ? rawReason : '';
        const { html: reasonHtml } = formatStatusReason(reason);
        const withReason = (base) => base;

        if (target.isInHospital?.()) {
            statusText = 'Hospital';
            iconSrc = 'assets/hospital.png';
            message = withReason('This user is currently in the hospital and is recovering from injuries.');
            statusClass = 'status-hospital';
        } else if (target.isInJail?.()) {
            statusText = 'Jail';
            iconSrc = 'assets/jail.png';
            message = withReason('This user is currently in jail and cannot be attacked.');
            statusClass = 'status-jail';
        } else if (target.isInFederal?.()) {
            statusText = 'Federal Jail';
            iconSrc = 'assets/jail.png';
            message = withReason('This user is currently in federal jail and cannot be attacked.');
            statusClass = 'status-federal';
        } else if (target.isFallen?.()) {
            statusText = 'Fallen';
            iconSrc = 'assets/hospital.png';
            message = 'This user has fallen and cannot be attacked.';
            statusClass = 'status-fallen';
        } else if (target.isTraveling?.()) {
            statusText = 'Traveling';
            iconSrc = 'assets/travel.png';
            message = 'This user is currently traveling and cannot be attacked.';
            statusClass = 'status-traveling';
        } else if (target.error) {
            statusText = 'Error';
            iconSrc = 'assets/hospital.png';
            message = 'Unable to verify this user\'s status due to an error. Cannot confirm if they are attackable.';
            statusClass = 'status-error';
        }

        // Update dialog elements
        document.getElementById('attack-prevention-icon').innerHTML = `<img src="${iconSrc}" alt="${statusText}">`;
        document.getElementById('attack-prevention-title').textContent = 'Cannot Attack';
        document.getElementById('attack-prevention-badge').textContent = statusText.toUpperCase();
        document.getElementById('attack-prevention-badge').className = `status-badge ${statusClass}`;
        const messageEl = document.getElementById('attack-prevention-message');
        const reasonLine = reasonHtml
            ? `<div class="attack-prevention-reason">Reason: ${reasonHtml}</div>`
            : '';
        messageEl.innerHTML = `${escapeHtml(message)}${reasonLine}`;
        document.getElementById('attack-prevention-target-name').textContent = target.getDisplayName();
        document.getElementById('attack-prevention-status-text').textContent = statusText;
        const reasonDetailEl = document.getElementById('attack-prevention-reason');
        if (reasonDetailEl) {
            if (reasonHtml) {
                reasonDetailEl.innerHTML = reasonHtml;
            } else {
                reasonDetailEl.textContent = 'No reason provided';
            }
        }

        const notifyBtn = DOM.attackPreventionNotifyBtn || document.getElementById('attack-prevention-notify');
        if (notifyBtn) {
            const watching = !!target.monitorOk;
            notifyBtn.disabled = watching;
            notifyBtn.classList.toggle('is-active', watching);
            notifyBtn.textContent = watching ? 'Release alert active' : 'Notify when released';
        }

        // Handle timer display
        const timerElement = document.getElementById('attack-prevention-timer');
        const timeRemaining = target.getTimeRemaining?.();

        if (timeRemaining && !target.isFallen?.()) {
            const formattedTime = target.getFormattedTimeRemaining?.();
            const availableTimestamp = Date.now() + (timeRemaining * 1000);
            const availableDate = new Date(availableTimestamp);
            const timeString = availableDate.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });

            document.getElementById('attack-prevention-timer-value').textContent = formattedTime;
            document.getElementById('attack-prevention-available').textContent = `Available at ${timeString}`;
            timerElement.style.display = 'flex';

            // Update timer every second
            const timerInterval = setInterval(() => {
                const currentRemaining = target.getTimeRemaining?.();
                if (currentRemaining && currentRemaining > 0) {
                    document.getElementById('attack-prevention-timer-value').textContent =
                        target.getFormattedTimeRemaining?.();
                } else {
                    clearInterval(timerInterval);
                    timerElement.style.display = 'none';

                    // Timer reached zero - request a live refresh instead of forcing local state
                    if (typeof requestStatusRecheck === 'function') {
                        requestStatusRecheck(target.userId);
                    } else if (window.appState?.refreshTarget) {
                        window.appState.refreshTarget(target.userId);
                    }
                }
            }, 1000);

            // Clear interval when modal closes
            const modal = document.getElementById('modal-attack-prevention');
            const closeHandler = () => {
                clearInterval(timerInterval);
                modal.removeEventListener('click', closeHandler);
            };
            modal.addEventListener('click', closeHandler, { once: true });
        } else {
            timerElement.style.display = 'none';
        }

        openModal('modal-attack-prevention');
    }

    function formatStatusReason(rawReason) {
        if (!rawReason) return { html: '', plain: '' };

        // Parse in an inert document so hostile HTML never becomes live page DOM.
        const parsed = new DOMParser().parseFromString(String(rawReason), 'text/html');
        const parserBody = parsed.body || parsed;
        const anchor = parserBody.querySelector('a');
        const anchorHref = anchor?.getAttribute('href') || '';
        const anchorText = anchor?.textContent?.trim() || '';
        let prefixText = parserBody.textContent?.trim() || '';

        // If we have an anchor, remove it from the prefix so we don't double-print
        if (anchor) {
            anchor.remove();
            prefixText = (parserBody.textContent || '').trim();
        }

        // Clean and validate Torn profile URL
        let profileUrl = '';
        if (anchorHref) {
            // Accept http/https with or without www
            const match = anchorHref.match(/https?:\/\/(?:www\.)?torn\.com\/profiles\.php\?XID=\d+/i);
            if (match) {
                profileUrl = match[0];
            }
        }

        // Build HTML/plain output
        if (profileUrl && anchorText) {
            const safeLinkText = escapeHtml(anchorText);
            const linkHtml = `<a href="${escapeHtml(profileUrl)}" target="_blank" rel="noopener noreferrer">${safeLinkText}</a>`;
            const html = prefixText ? `${escapeHtml(prefixText)} ${linkHtml}` : linkHtml;
            const plain = prefixText ? `${prefixText} ${anchorText}` : anchorText;
            return { html, plain };
        }

        // No valid link; return escaped raw text
        return {
            html: escapeHtml(prefixText || rawReason),
            plain: prefixText || rawReason
        };
    }

    function showConfirm(title, message, onConfirm) {
        document.getElementById('confirm-title').textContent = title;
        document.getElementById('confirm-message').textContent = message;

        pendingConfirmAction = onConfirm;
        openModal('modal-confirm');
    }

    // Set up confirm modal
    document.getElementById('confirm-ok')?.addEventListener('click', () => {
        if (pendingConfirmAction) {
            pendingConfirmAction();
            pendingConfirmAction = null;
        }
        closeAllModals();
    });

    // ========================================================================
    // RECENT ACTIVITY WARNING
    // ========================================================================

    /**
     * Checks if a target was active within the specified number of days.
     * @param {Object} target - The target object
     * @param {number} days - Number of days to check
     * @returns {boolean} True if target was active within the specified days
     */
    function isTargetRecentlyActive(target, days) {
        if (!target || !target.lastActionTimestamp || days <= 0) {
            return false;
        }
        const thresholdMs = days * 24 * 60 * 60 * 1000;
        const now = Date.now();
        const lastActionMs = target.lastActionTimestamp * 1000; // Convert from Unix timestamp
        return (now - lastActionMs) < thresholdMs;
    }

    /**
     * Shows the recent activity warning dialog.
     * @param {Object} target - The target object
     * @param {Function} onProceed - Callback to execute if user clicks "Attack Anyway"
     * @param {number|null} days - Recent activity window in days
     */
    function showRecentActivityWarning(target, onProceed, days = null) {
        if (!target) return;

        const normalizedDays = Number.isFinite(days) ? days : Number.parseInt(days, 10);
        const daysWindow = Number.isFinite(normalizedDays) && normalizedDays > 0 ? normalizedDays : null;
        const daysBadge = daysWindow ? `<=${daysWindow}D` : '';
        const messageEl = document.getElementById('recent-activity-message');

        if (messageEl) {
            if (daysWindow) {
                const label = daysWindow === 1 ? 'day' : 'days';
                messageEl.textContent = `This target has been active within the last ${daysWindow} ${label}. They may be online and could retaliate.`;
            } else {
                messageEl.textContent = 'This target has been active recently. They may be online and could retaliate.';
            }
        }

        const badgeEl = document.getElementById('recent-activity-badge');
        if (badgeEl) {
            badgeEl.textContent = daysWindow ? `ACTIVE (${daysBadge})` : 'ACTIVE';
            badgeEl.className = 'status-badge status-warning';
            badgeEl.dataset.daysWindow = daysBadge;
        }

        const lastActionText = target.lastActionRelative
            || (target.lastActionTimestamp
                ? formatTimestamp(target.lastActionTimestamp * 1000)
                : 'Unknown');

        const titleEl = document.getElementById('recent-activity-title');
        if (titleEl) {
            titleEl.textContent = daysWindow
                ? `Target Recently Active (${daysBadge})`
                : 'Target Recently Active';
        }

        // Populate dialog
        document.getElementById('recent-activity-target-name').textContent = target.getDisplayName?.() || `User ${target.userId}`;
        document.getElementById('recent-activity-last-action').textContent = lastActionText;

        pendingRecentActivityAction = onProceed;
        openModal('modal-recent-activity-warning');
    }

    // Set up recent activity warning modal
    document.getElementById('recent-activity-proceed')?.addEventListener('click', () => {
        if (pendingRecentActivityAction) {
            pendingRecentActivityAction();
            pendingRecentActivityAction = null;
        }
        closeAllModals();
    });

    // ========================================================================
    // AUDIO PLAYBACK
    // ========================================================================

    function playSound(soundName, customVolume = null) {
        try {
            const audio = new Audio(`assets/${soundName}.wav`);
            // Use custom volume if provided, otherwise use settings, fallback to 50%
            const volume = customVolume !== null
                ? customVolume / 100
                : (window.appState?.settings?.soundVolume ?? 50) / 100;
            audio.volume = Math.max(0, Math.min(1, volume));
            audio.play().catch(err => {
                console.warn(`Failed to play sound ${soundName}:`, err);
            });
        } catch (error) {
            console.warn(`Error loading sound ${soundName}:`, error);
        }
    }

    // ========================================================================
    // TOAST NOTIFICATIONS
    // ========================================================================

    function showToast(message, type = 'info') {
        if (!DOM.toastContainer) return;

        const now = Date.now();
        const signature = `${type}:${message}`;
        if (lastToastSignature.key === signature && now - lastToastSignature.time < TOAST_DEDUPE_MS) {
            return;
        }
        lastToastSignature = { key: signature, time: now };

        const existingToasts = Array.from(DOM.toastContainer.querySelectorAll('.toast'));
        while (existingToasts.length >= MAX_VISIBLE_TOASTS) {
            existingToasts.shift()?.remove();
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span class="toast-message">${escapeHtml(message)}</span>
            <button class="toast-close" aria-label="Dismiss">&times;</button>
        `;

        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });

        DOM.toastContainer.appendChild(toast);

        // Auto remove after 4 seconds
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    // ========================================================================
    // ONBOARDING EXPERIENCE
    // ========================================================================

    function syncOnboardingToggle() {
        if (DOM.onboardingHideToggle) {
            DOM.onboardingHideToggle.checked = window.appState?.settings?.showOnboarding === false;
        }
    }

    function pauseOnboarding(resumeStep, waitCondition = null) {
        if (window.appState?.settings?.showOnboarding === false) return;
        onboardingResumeStep = resumeStep;
        onboardingWaitCondition = waitCondition;
        hideOnboarding(true);
    }

    function handleOnboardingResume(triggerType) {
        if (window.appState?.settings?.showOnboarding === false) {
            onboardingResumeStep = null;
            onboardingWaitCondition = null;
            return;
        }

        if (onboardingResumeStep === null) return;
        if (onboardingWaitCondition && onboardingWaitCondition.type && onboardingWaitCondition.type !== triggerType) {
            return;
        }

        const resumeStep = onboardingResumeStep;
        onboardingResumeStep = null;
        onboardingWaitCondition = null;
        showOnboarding(true, resumeStep);
    }

    function updateOnboardingStats() {
        if (!window.appState) return;
        const targets = window.appState.getTargets ? window.appState.getTargets() : [];
        const attackable = targets.filter(t => t.isAttackable()).length;
        const groupsCount = Array.isArray(window.appState.groups) ? window.appState.groups.length : 0;
        const hasApiKey = !!window.appState.settings?.apiKey;
        const notificationsEnabled = !!window.appState.settings?.notifications;

        if (DOM.onboardingTargetCount) DOM.onboardingTargetCount.textContent = formatNumber(targets.length);
        if (DOM.onboardingAttackableCount) DOM.onboardingAttackableCount.textContent = formatNumber(attackable);
        if (DOM.onboardingGroupCount) DOM.onboardingGroupCount.textContent = formatNumber(groupsCount || 0);

        if (DOM.onboardingNotifyStatus) {
            const notifyEnabled = !!window.appState.settings?.notifications;
            DOM.onboardingNotifyStatus.textContent = notifyEnabled ? 'enabled' : 'disabled';
            DOM.onboardingNotifyStatus.style.color = notifyEnabled ? 'var(--status-okay)' : 'var(--status-error)';
        }

        if (DOM.onboardingConnectionStatus) {
            const online = window.appState.isOnline ?? navigator.onLine;
            DOM.onboardingConnectionStatus.textContent = online ? 'Online' : 'Offline';
            DOM.onboardingConnectionStatus.style.color = online ? 'var(--status-okay)' : 'var(--status-error)';
        }

        if (DOM.onboardingLatency) {
            const lastDuration = window.appState.api?.lastRequestDuration;
            if (lastDuration) {
                DOM.onboardingLatency.textContent = `${lastDuration} ms`;
            } else {
                DOM.onboardingLatency.textContent = window.appState.isOnline ? 'Live' : '-- ms';
            }
        }

        if (DOM.onboardingRate) {
            const status = window.appState.limiter?.getStatus?.();
            if (status) {
                const max = status.maxTokens || status.availableTokens || 0;
                const available = status.availableTokens ?? max;
                DOM.onboardingRate.textContent = `${available}/${max}`;
            } else {
                DOM.onboardingRate.textContent = '--/min';
            }
        }

        // Smart guidance
        const guidance = getOnboardingState();
        if (DOM.onboardingSmartTitle) {
            DOM.onboardingSmartTitle.textContent = guidance.title;
        }
        if (DOM.onboardingSmartCopy) {
            DOM.onboardingSmartCopy.textContent = guidance.subtitle;
        }

        const setStatus = (el, text, state) => {
            if (!el) return;
            el.classList.remove('ready', 'warning');
            if (state === 'ready') el.classList.add('ready');
            if (state === 'warning') el.classList.add('warning');
            const val = el.querySelector('.status-value');
            if (val) val.textContent = text;
        };

        setStatus(DOM.onboardingStatusKey, hasApiKey ? 'Connected' : 'Missing', hasApiKey ? 'ready' : 'warning');
        setStatus(DOM.onboardingStatusTargets, targets.length ? `${targets.length} added` : 'None added', targets.length ? 'ready' : 'warning');
        setStatus(DOM.onboardingStatusAlerts, notificationsEnabled ? 'Enabled' : 'Disabled', notificationsEnabled ? 'ready' : 'warning');
    }

    function setOnboardingStep(stepIndex) {
        if (!DOM.onboardingSteps || DOM.onboardingSteps.length === 0) return;
        onboardingStepIndex = Math.max(0, Math.min(stepIndex, DOM.onboardingSteps.length - 1));

        DOM.onboardingSteps.forEach(step => {
            const isActive = Number(step.dataset.onboardingStep) === onboardingStepIndex;
            step.classList.toggle('active', isActive);
        });

        DOM.onboardingTabs?.forEach(tab => {
            const isActive = Number(tab.dataset.onboardingStep) === onboardingStepIndex;
            tab.classList.toggle('active', isActive);
            tab.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });

        if (DOM.onboardingProgressBar) {
            const pct = ((onboardingStepIndex + 1) / DOM.onboardingSteps.length) * 100;
            DOM.onboardingProgressBar.style.width = `${pct}%`;
        }

        if (DOM.onboardingPrev) {
            DOM.onboardingPrev.disabled = onboardingStepIndex === 0;
        }
        if (DOM.onboardingNext) {
            const state = getOnboardingState();
            if (onboardingStepIndex === DOM.onboardingSteps.length - 1) {
                DOM.onboardingNext.textContent = state.hasTargets && state.notificationsEnabled ? 'Finish' : 'Next';
            } else if (!state.hasApiKey && onboardingStepIndex === 0) {
                DOM.onboardingNext.textContent = 'Add API Key';
            } else if (!state.hasTargets && onboardingStepIndex === 1) {
                DOM.onboardingNext.textContent = 'Add Targets';
            } else if (!state.notificationsEnabled && onboardingStepIndex === 2) {
                DOM.onboardingNext.textContent = 'Enable Alerts';
            } else {
                DOM.onboardingNext.textContent = 'Next';
            }
        }
    }

    function changeOnboardingStep(delta) {
        setOnboardingStep(onboardingStepIndex + delta);
        updateOnboardingStats();
    }

    function getOnboardingState() {
        const hasApiKey = !!window.appState?.settings?.apiKey;
        const targets = window.appState?.getTargets?.() || [];
        const hasTargets = targets.length > 0;
        const notificationsEnabled = !!window.appState?.settings?.notifications;

        let recommendedStep = 0;
        let title = 'Next best step ready';
        let subtitle = 'We’ll route you to the highest-impact action so you can finish setup without thinking.';

        if (!hasApiKey) {
            recommendedStep = 0;
            title = 'Connect your API key';
            subtitle = 'Add your Torn API key to unlock live statuses, rate-aware refresh, and attack-ready intel.';
        } else if (!hasTargets) {
            recommendedStep = 1;
            title = 'Add your first targets';
            subtitle = 'Populate the grid with a single ID or bulk import so we can track attack windows for you.';
        } else if (!notificationsEnabled) {
            recommendedStep = 2;
            title = 'Turn on alerts';
            subtitle = 'Enable notifications so every status change, attack window, and loot timer reaches you instantly.';
        } else {
            recommendedStep = onboardingStepIndex;
            title = 'You’re all set';
            subtitle = 'Everything is wired. Explore loot timers, stats, or keep refining your groups and alerts.';
        }

        return { hasApiKey, hasTargets, notificationsEnabled, recommendedStep, title, subtitle };
    }

    function showOnboarding(force = false, stepOverride = null) {
        const shouldShow = force || window.appState?.settings?.showOnboarding !== false;
        if (!shouldShow || !DOM.onboardingOverlay) return;
        const state = getOnboardingState();
        const initialStep = stepOverride !== null ? stepOverride : state.recommendedStep;
        DOM.onboardingOverlay.classList.add('visible');
        DOM.onboardingOverlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('onboarding-open');
        setOnboardingStep(initialStep);
        syncOnboardingToggle();
        updateOnboardingStats();
    }

    function hideOnboarding(temporary = false) {
        if (!DOM.onboardingOverlay) return;
        DOM.onboardingOverlay.classList.remove('visible');
        DOM.onboardingOverlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('onboarding-open');
        if (!temporary) {
            onboardingResumeStep = null;
            onboardingWaitCondition = null;
        }
    }

    function handleOnboardingAction(action) {
        switch (action) {
            case 'open-settings':
                pauseOnboarding(1, { type: 'api' });
                switchView('settings');
                break;
            case 'validate-api':
                pauseOnboarding(1, { type: 'api' });
                switchView('settings');
                handleValidateKey();
                break;
            case 'add-target': {
                const baseline = window.appState?.getTargets?.().length || 0;
                pauseOnboarding(2, { type: 'targets', baseline });
                openModal('modal-add-target');
                break;
            }
            case 'bulk-add': {
                const baseline = window.appState?.getTargets?.().length || 0;
                pauseOnboarding(2, { type: 'targets', baseline });
                openModal('modal-bulk-add');
                break;
            }
            case 'enable-notifications':
                window.appState.updateSettings({ notifications: true, soundEnabled: true });
                showToast('Notifications enabled', 'success');
                updateOnboardingStats();
                handleOnboardingResume('notifications');
                break;
            case 'open-loot':
                pauseOnboarding(onboardingStepIndex, { type: 'view', targetView: 'loot-timer' });
                switchView('loot-timer');
                break;
            default:
                break;
        }
    }

    function maybeShowOnboarding(force = false) {
        const shouldShow = force || window.appState?.settings?.showOnboarding !== false;
        if (!shouldShow) return;
        setTimeout(() => showOnboarding(force), 140);
    }

    // ========================================================================
    // PREMIUM ALERT DIALOG
    // ========================================================================

    function showPremiumAlert(options, legacyMessage, legacyButtons) {
        // Normalize options to support both object and legacy positional signature
        let normalizedOptions = options;
        if (typeof options === 'string') {
            normalizedOptions = {
                title: options,
                message: legacyMessage,
                buttons: legacyButtons
            };
        } else if (!options || typeof options !== 'object') {
            normalizedOptions = {};
        }

        const {
            title = '',
            message = '',
            messageContent = null,
            icon = '⚠️',
            iconType = 'warning',
            buttons = [
                { text: 'OK', type: 'primary', action: null },
                { text: 'Close', type: 'secondary', action: null }
            ],
            dialogClass = ''
        } = normalizedOptions;

        const overlay = document.getElementById('premium-alert-overlay');
        const dialogElement = overlay?.querySelector('.premium-alert-dialog');
        const iconElement = document.getElementById('premium-alert-icon');
        const titleElement = document.getElementById('premium-alert-title');
        const messageElement = document.getElementById('premium-alert-message');
        const actionsElement = document.getElementById('premium-alert-actions');

        if (!overlay || !iconElement || !titleElement || !messageElement || !actionsElement) {
            console.warn('Premium alert container missing required elements');
            return;
        }

        if (dialogElement) {
            dialogElement.className = `premium-alert-dialog ${dialogClass}`.trim();
        }

        // Set icon
        iconElement.textContent = icon;
        iconElement.className = `premium-alert-icon ${iconType}`;

        // Set title and message
        titleElement.textContent = title || 'Notice';
        setElementContent(messageElement, messageContent || message || '');

        // Render buttons
        actionsElement.replaceChildren();
        buttons.forEach((btn, index) => {
            const button = document.createElement('button');
            button.className = `premium-alert-btn ${btn.type || 'secondary'}`;
            button.dataset.action = String(btn.text || index).toLowerCase();
            button.textContent = btn.text || 'OK';
            button.addEventListener('click', () => {
                if (buttons[index].action) {
                    buttons[index].action();
                }
                hidePremiumAlert();
            });
            actionsElement.appendChild(button);
        });

        // Show overlay
        overlay.classList.add('visible');

        // Close on overlay click
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                hidePremiumAlert();
            }
        };
    }

    function hidePremiumAlert() {
        const overlay = document.getElementById('premium-alert-overlay');
        overlay.onclick = null;
        overlay.classList.remove('visible');
    }

    // ========================================================================
    // LOADING
    // ========================================================================

    function showLoading() {
        DOM.loadingOverlay.classList.add('visible');
    }

    function hideLoading() {
        DOM.loadingOverlay.classList.remove('visible');
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function registerCleanup(cleanup) {
        if (typeof cleanup !== 'function') return cleanup;
        rendererCleanupCallbacks.add(cleanup);
        return cleanup;
    }

    function cleanupRendererSubscriptions() {
        const callbacks = Array.from(rendererCleanupCallbacks);
        rendererCleanupCallbacks.clear();
        callbacks.forEach((cleanup) => {
            try {
                cleanup();
            } catch (error) {
                console.warn('[Cleanup] Failed to dispose renderer subscription:', error);
            }
        });
    }

    function addWindowCleanupListener(type, handler, options) {
        window.addEventListener(type, handler, options);
        return registerCleanup(() => window.removeEventListener(type, handler, options));
    }

    function setElementContent(element, content) {
        if (!element) return;
        if (content instanceof window.Node) {
            element.replaceChildren(content);
            return;
        }
        element.textContent = content == null ? '' : String(content);
    }

    function toFileUrl(filePath) {
        if (!filePath) return '';
        if (filePath.startsWith('file://')) return filePath;
        const normalized = filePath.replace(/\\/g, '/');
        return encodeURI(`file:///${normalized}`);
    }

    function sanitizeHexColor(value, fallback = '#007acc') {
        const color = typeof value === 'string' ? value.trim() : '';
        return /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(color)
            ? color
            : fallback;
    }

    function getSafeImageSource(value) {
        if (typeof value !== 'string') return '';
        const source = value.trim();
        if (!source) return '';
        if (source.startsWith('file://')) return source;
        if (/^[a-z]:[\\/]/i.test(source) || source.startsWith('\\\\')) {
            return toFileUrl(source);
        }

        try {
            const parsed = new URL(source, window.location.href);
            const protocol = parsed.protocol.toLowerCase();
            if (protocol === 'http:' || protocol === 'https:' || protocol === 'file:') {
                return parsed.href;
            }
        } catch (_) {
            return '';
        }

        return '';
    }

    function updateMaximizeButtonState(isMaximized) {
        if (!DOM.btnMaximize) return;
        const title = isMaximized ? 'Restore' : 'Maximize';
        DOM.btnMaximize.title = title;
        DOM.btnMaximize.setAttribute('aria-label', title);
        DOM.btnMaximize.classList.toggle('maximized', !!isMaximized);
    }

    function getInitials(name) {
        if (!name) return '??';
        const parts = name.trim().split(/\s+/).filter(Boolean);
        if (parts.length === 1) {
            return parts[0].slice(0, 2).toUpperCase();
        }
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    function formatTimestamp(timestamp) {
        if (!timestamp) return '-';
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        // Less than a minute
        if (diff < 60000) return 'Just now';
        // Less than an hour
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        // Less than a day
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        // Less than a week
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

        // Otherwise show date with time using the timestampFormat setting
        const use24h = window.appState?.settings?.timestampFormat === '24h';
        const timeOptions = {
            hour: 'numeric',
            minute: '2-digit',
            hour12: !use24h
        };
        const dateStr = date.toLocaleDateString();
        const timeStr = date.toLocaleTimeString(undefined, timeOptions);
        return `${dateStr} ${timeStr}`;
    }

    function formatNumber(value) {
        if (value === null || value === undefined) return '0';
        const num = Number(value);
        if (Number.isNaN(num)) return '0';
        return num.toLocaleString();
    }

    function formatPercent(value, total) {
        if (!total || total <= 0) return '0%';
        const percent = Math.round((Number(value || 0) / total) * 100);
        return `${percent}%`;
    }

    function formatDuration(ms) {
        if (!ms || ms <= 0) return 'Ready';
        const secondsTotal = Math.round(ms / 1000);
        const minutes = Math.floor(secondsTotal / 60);
        const seconds = secondsTotal % 60;
        if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        }
        return `${seconds}s`;
    }

    function formatDateTime(timestamp) {
        const date = new Date(timestamp);
        if (Number.isNaN(date.getTime())) return '-';
        return date.toLocaleString();
    }

    function formatCurrency(value) {
        if (value === null || value === undefined) return '--';
        const num = Number(value);
        if (!Number.isFinite(num)) return '--';
        return `$${num.toLocaleString()}`;
    }

    function formatExpiry(timestamp) {
        if (!timestamp) return 'No expiry';
        const diff = timestamp - Date.now();
        const abs = Math.abs(diff);
        const days = Math.floor(abs / 86400000);
        const hours = Math.floor((abs % 86400000) / 3600000);
        const minutes = Math.floor((abs % 3600000) / 60000);
        const parts = [];
        if (days) parts.push(`${days}d`);
        if (hours || parts.length === 0) parts.push(`${hours}h`);
        if (parts.length < 2 && minutes) parts.push(`${minutes}m`);
        const label = parts.join(' ');
        return diff >= 0 ? `Expires in ${label}` : `Expired ${label} ago`;
    }

    function safeHistoryArray(history) {
        return Array.isArray(history) ? history : [];
    }

    // ========================================================================
    // BACKUP & RESTORE VIEW
    // ========================================================================

    let backupState = {
        mode: 'export',
        selectedData: {
            targets: true,
            groups: true,
            attackHistory: true,
            statistics: true,
            settings: false
        },
        importFile: null,
        importData: null,
        conflictStrategy: 'merge',
        destinationPreset: 'appdata',
        customPath: '',
        filename: '',
        openAfterExport: true,
        eventsBound: false
    };

    function initializeBackupView() {
        debugLog('[Backup] Initializing backup view');

        // Initialize UI state
        updateBackupHeader();
        updateBackupTabs();
        updateBackupViews();
        loadBackupCounts();
        loadDefaultPaths();
        loadRecentBackups();
        bindBackupEvents();
        syncBackupSelectionsFromUI();
    }

    function bindBackupEvents() {
        // Prevent duplicate event bindings
        if (backupState.eventsBound) return;
        backupState.eventsBound = true;

        // Tab switching
        document.querySelectorAll('.backup-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const mode = tab.dataset.mode;
                if (mode) {
                    backupState.mode = mode;
                    updateBackupHeader();
                    updateBackupTabs();
                    updateBackupViews();
                }
            });
        });

        // Export checkbox options (using data-key)
        document.querySelectorAll('.backup-option').forEach(item => {
            item.addEventListener('click', () => {
                const dataKey = item.dataset.key;
                if (dataKey && backupState.selectedData.hasOwnProperty(dataKey)) {
                    const isChecked = item.classList.contains('checked');
                    const nextState = !isChecked;
                    backupState.selectedData[dataKey] = nextState;
                    item.classList.toggle('checked', nextState);
                }
            });
        });

        // Select All button
        const selectAllBtn = document.getElementById('backup-select-all');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => {
                const allSelected = Array.from(document.querySelectorAll('.backup-option'))
                    .every(option => option.classList.contains('checked'));
                Object.keys(backupState.selectedData).forEach(key => {
                    backupState.selectedData[key] = !allSelected;
                });
                document.querySelectorAll('.backup-option').forEach(item => {
                    const key = item.dataset.key;
                    if (key) item.classList.toggle('checked', backupState.selectedData[key]);
                });
                selectAllBtn.textContent = allSelected ? 'Select All' : 'Deselect All';
            });
        }

        // Preset buttons (using data-preset with "default" for appdata)
        document.querySelectorAll('.backup-preset').forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = btn.dataset.preset;
                if (preset) {
                    // Map "default" to "appdata" internally
                    backupState.destinationPreset = preset === 'default' ? 'appdata' : preset;
                    updatePresetButtons();
                    updatePathInputState();
                    updateFullPathPreview();
                }
            });
        });

        // Browse button
        const browseBtn = document.getElementById('backup-browse-btn');
        if (browseBtn) {
            browseBtn.addEventListener('click', handleBrowseClick);
        }

        // Path input
        const pathInput = document.getElementById('backup-path-input');
        if (pathInput) {
            pathInput.addEventListener('input', () => {
                backupState.customPath = pathInput.value;
                updateFullPathPreview();
            });
        }

        // Filename input
        const filenameInput = document.getElementById('backup-filename-input');
        if (filenameInput) {
            filenameInput.addEventListener('input', () => {
                backupState.filename = filenameInput.value;
                updateFullPathPreview();
            });
        }

        // Export button
        const exportBtn = document.getElementById('backup-export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', handleExportBackup);
        }

        // Open after export checkbox
        const openCheckbox = document.getElementById('backup-open-folder');
        if (openCheckbox) {
            openCheckbox.addEventListener('change', () => {
                backupState.openAfterExport = openCheckbox.checked;
            });
        }

        // Refresh recent backups
        const refreshBtn = document.getElementById('backup-refresh-list');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', loadRecentBackups);
        }

        // Drop zone
        const dropZone = document.getElementById('backup-drop-zone');
        if (dropZone) {
            dropZone.addEventListener('click', () => {
                document.getElementById('backup-file-input')?.click();
            });
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('dragover');
            });
            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('dragover');
            });
            dropZone.addEventListener('drop', handleFileDrop);
        }

        // File input
        const fileInput = document.getElementById('backup-file-input');
        if (fileInput) {
            fileInput.addEventListener('change', handleFileSelect);
        }

        // Remove file button
        const removeFileBtn = document.getElementById('backup-file-remove');
        if (removeFileBtn) {
            removeFileBtn.addEventListener('click', clearImportFile);
        }

        // Conflict resolution options (using data-value)
        document.querySelectorAll('.backup-conflict-radio').forEach(option => {
            option.addEventListener('click', () => {
                const strategy = option.dataset.value;
                if (strategy) {
                    backupState.conflictStrategy = strategy;
                    updateConflictRadios();
                }
            });
        });

        // Import/Restore button
        const importBtn = document.getElementById('backup-import-btn');
        if (importBtn) {
            importBtn.addEventListener('click', handleRestoreBackup);
        }

        // Overlay dismiss button
        const dismissBtn = document.getElementById('backup-overlay-dismiss');
        if (dismissBtn) {
            dismissBtn.addEventListener('click', hideBackupOverlay);
        }
    }

    function syncBackupSelectionsFromUI() {
        document.querySelectorAll('.backup-option').forEach(item => {
            const key = item.dataset.key;
            if (!key) return;
            const isChecked = item.classList.contains('checked');
            backupState.selectedData[key] = isChecked;
        });
    }

    function updateBackupHeader() {
        const icon = document.querySelector('.backup-header-icon');
        const title = document.querySelector('.backup-header-text h1');
        const desc = document.querySelector('.backup-header-text p');

        if (icon) {
            icon.classList.toggle('export-mode', backupState.mode === 'export');
            icon.classList.toggle('import-mode', backupState.mode === 'import');
        }

        if (title) {
            title.textContent = backupState.mode === 'export' ? 'Export Backup' : 'Restore Backup';
        }

        if (desc) {
            desc.textContent = backupState.mode === 'export'
                ? 'Create a backup of your data to a file'
                : 'Restore your data from a backup file';
        }
    }

    function updateBackupTabs() {
        document.querySelectorAll('.backup-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.mode === backupState.mode);
        });
    }

    function updateBackupViews() {
        document.querySelectorAll('.backup-view').forEach(view => {
            view.classList.toggle('active', view.id === `backup-view-${backupState.mode}`);
        });
    }

    async function loadBackupCounts() {
        try {
            const [targets, groups, history, statistics, settings] = await Promise.all([
                window.electronAPI.getTargets(),
                window.electronAPI.getGroups(),
                window.electronAPI.getAttackHistory(),
                window.electronAPI.getStatistics(),
                window.electronAPI.getSettings()
            ]);

            // Update export counts using the actual HTML IDs
            const countTargets = document.getElementById('backup-count-targets');
            const countGroups = document.getElementById('backup-count-groups');
            const countHistory = document.getElementById('backup-count-history');
            const countStats = document.getElementById('backup-count-stats');

            if (countTargets) countTargets.textContent = Array.isArray(targets) ? targets.length : 0;
            if (countGroups) countGroups.textContent = Array.isArray(groups) ? groups.length : 0;
            if (countHistory) countHistory.textContent = Array.isArray(history) ? history.length : 0;
            if (countStats) countStats.textContent = statistics ? 'Yes' : 'No';
        } catch (error) {
            console.error('[Backup] Failed to load counts:', error);
        }
    }

    async function loadDefaultPaths() {
        try {
            if (window.electronAPI?.backupGetPaths) {
                const paths = await window.electronAPI.backupGetPaths();
                if (paths) {
                    // Map the returned paths to our state
                    if (paths.default) {
                        backupState.appDataPath = paths.default;
                    }
                    if (paths.desktop) {
                        backupState.desktopPath = paths.desktop;
                    }
                    // Set default filename
                    const date = new Date();
                    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
                    backupState.filename = `TTT_Backup_${dateStr}`;

                    const filenameInput = document.getElementById('backup-filename-input');
                    if (filenameInput) {
                        filenameInput.value = backupState.filename;
                    }

                    updatePresetButtons();
                    updatePathInputState();
                    updateFullPathPreview();
                }
            }
        } catch (error) {
            console.error('[Backup] Failed to load paths:', error);
        }
    }

    function updatePresetButtons() {
        document.querySelectorAll('.backup-preset').forEach(btn => {
            // Map internal "appdata" to HTML "default"
            const htmlPreset = backupState.destinationPreset === 'appdata' ? 'default' : backupState.destinationPreset;
            btn.classList.toggle('active', btn.dataset.preset === htmlPreset);
        });
    }

    function updatePathInputState() {
        const pathInput = document.getElementById('backup-path-input');
        const browseBtn = document.querySelector('.backup-browse-btn');

        if (pathInput) {
            if (backupState.destinationPreset === 'custom') {
                pathInput.disabled = false;
                pathInput.value = backupState.customPath;
            } else if (backupState.destinationPreset === 'appdata') {
                pathInput.disabled = true;
                pathInput.value = backupState.appDataPath || '';
            } else if (backupState.destinationPreset === 'desktop') {
                pathInput.disabled = true;
                pathInput.value = backupState.desktopPath || '';
            }
        }
    }

    function updateFullPathPreview() {
        const preview = document.getElementById('backup-full-path');
        if (!preview) return;

        let basePath = '';
        if (backupState.destinationPreset === 'appdata') {
            basePath = backupState.appDataPath || '';
        } else if (backupState.destinationPreset === 'desktop') {
            basePath = backupState.desktopPath || '';
        } else {
            basePath = backupState.customPath || '';
        }

        const filename = (backupState.filename || 'TTT_Backup') + '.json';
        const separator = basePath.includes('/') ? '/' : '\\';

        preview.textContent = basePath ? `${basePath}${separator}${filename}` : 'Select a destination folder';
    }

    async function handleBrowseClick() {
        try {
            if (window.electronAPI?.backupChooseDirectory) {
                const result = await window.electronAPI.backupChooseDirectory();
                if (result && result.path) {
                    backupState.destinationPreset = 'custom';
                    backupState.customPath = result.path;
                    updatePresetButtons();
                    updatePathInputState();
                    updateFullPathPreview();
                }
            }
        } catch (error) {
            console.error('[Backup] Failed to choose directory:', error);
        }
    }

    async function loadRecentBackups() {
        try {
            if (window.electronAPI?.listBackups) {
                const backups = await window.electronAPI.listBackups();
                renderRecentBackups(backups || []);
            }
        } catch (error) {
            console.error('[Backup] Failed to load recent backups:', error);
            renderRecentBackups([]);
        }
    }

    function renderRecentBackups(backups) {
        const container = document.getElementById('backup-recent-list');
        if (!container) return;

        if (!backups || backups.length === 0) {
            container.innerHTML = '<div class="backup-empty-recent">No recent backups found</div>';
            return;
        }

        container.innerHTML = backups.slice(0, 5).map(backup => `
            <div class="backup-recent-item" data-path="${escapeHtml(backup.path)}">
                <div class="backup-recent-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                    </svg>
                </div>
                <div class="backup-recent-info">
                    <div class="backup-recent-name">${escapeHtml(backup.name)}</div>
                    <div class="backup-recent-date">${formatBackupDate(backup.created)}</div>
                </div>
                <button class="backup-recent-action" title="Open in folder">
                    <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/>
                        <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                </button>
            </div>
        `).join('');

        // Bind click events for recent backups
        container.querySelectorAll('.backup-recent-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.backup-recent-action')) {
                    const path = item.dataset.path;
                    if (path) {
                        loadBackupFile(path);
                    }
                }
            });

            const actionBtn = item.querySelector('.backup-recent-action');
            if (actionBtn) {
                actionBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const path = item.dataset.path;
                    if (path && window.electronAPI?.backupRevealInFolder) {
                        await window.electronAPI.backupRevealInFolder(path);
                    }
                });
            }
        });
    }

    function formatBackupDate(timestamp) {
        if (!timestamp) return 'Unknown';
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffDays === 0) {
            return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } else if (diffDays === 1) {
            return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    async function handleExportBackup() {
        // Show progress overlay
        showBackupOverlay('export', 'Exporting backup...', 'Gathering your data');

        try {
            // Keep state in sync with what the user sees
            syncBackupSelectionsFromUI();

            // Gather data to export
            const [targets, groups, history, statistics, settings] = await Promise.all([
                backupState.selectedData.targets ? window.electronAPI.getTargets() : null,
                backupState.selectedData.groups ? window.electronAPI.getGroups() : null,
                backupState.selectedData.attackHistory ? window.electronAPI.getAttackHistory() : null,
                backupState.selectedData.statistics ? window.electronAPI.getStatistics() : null,
                backupState.selectedData.settings ? window.electronAPI.getSettings() : null
            ]);

            const backupData = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                appVersion: await window.electronAPI.getAppVersion(),
                data: {}
            };

            if (targets) backupData.data.targets = targets;
            if (groups) backupData.data.groups = groups;
            if (history) backupData.data.attackHistory = history;
            if (statistics) backupData.data.statistics = statistics;
            if (settings) {
                // Remove sensitive data from settings backup
                const safeSettings = { ...settings };
                delete safeSettings.apiKey;
                delete safeSettings.tornStatsApiKey;
                backupData.data.settings = safeSettings;
            }

            // Determine export path
            let basePath = '';
            if (backupState.destinationPreset === 'appdata') {
                basePath = backupState.appDataPath;
            } else if (backupState.destinationPreset === 'desktop') {
                basePath = backupState.desktopPath;
            } else {
                basePath = backupState.customPath;
            }

            const filename = (backupState.filename || 'TTT_Backup') + '.json';

            // Export to path
            const result = await window.electronAPI.backupExportToPath({
                directory: basePath,
                filename: filename,
                data: backupData,
                openFolder: false // We handle this separately
            });

            if (result && result.success) {
                // Show success
                showBackupResult('success', 'Backup Created!', result.path ? `Saved to: ${result.path}` : 'Your data has been exported successfully');

                // Open folder if toggle is on
                if (backupState.openAfterExport && result.path) {
                    await window.electronAPI.backupRevealInFolder(result.path);
                }

                // Reload recent backups
                loadRecentBackups();
            } else {
                showBackupResult('error', 'Export Failed', result?.error || 'An unknown error occurred');
            }
        } catch (error) {
            console.error('[Backup] Export error:', error);
            showBackupResult('error', 'Export Failed', error.message || 'An unknown error occurred');
        }
    }

    function handleFileDrop(e) {
        e.preventDefault();
        const dropZone = e.currentTarget;
        dropZone.classList.remove('dragover');

        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
            processImportFile(files[0]);
        }
    }

    function handleFileSelect(e) {
        const files = e.target?.files;
        if (files && files.length > 0) {
            processImportFile(files[0]);
        }
    }

    async function processImportFile(file) {
        if (!file) return;

        // Validate file type
        if (!file.name.endsWith('.json')) {
            showNotification('Please select a valid JSON backup file', 'error');
            return;
        }

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            // Validate backup structure
            if (!data.version || !data.data) {
                showNotification('Invalid backup file format', 'error');
                return;
            }

            backupState.importFile = file;
            backupState.importData = data;

            updateDropZoneState(true);
            updateFileInfo(file, data);
            updateImportPreview(data);
            updateImportCheckboxes(data);

        } catch (error) {
            console.error('[Backup] Failed to parse file:', error);
            showNotification('Failed to read backup file', 'error');
        }
    }

    async function loadBackupFile(filePath) {
        try {
            if (window.electronAPI?.backupImport) {
                const result = await window.electronAPI.backupImport({ path: filePath, preview: true });
                if (result && result.success && result.data) {
                    backupState.importFile = { name: filePath.split(/[\\/]/).pop(), path: filePath };
                    backupState.importData = result.data;

                    // Switch to import tab
                    backupState.mode = 'import';
                    updateBackupHeader();
                    updateBackupTabs();
                    updateBackupViews();

                    updateDropZoneState(true);
                    updateFileInfo(backupState.importFile, result.data);
                    updateImportPreview(result.data);
                    updateImportCheckboxes(result.data);
                }
            }
        } catch (error) {
            console.error('[Backup] Failed to load backup file:', error);
            showNotification('Failed to load backup file', 'error');
        }
    }

    function updateDropZoneState(hasFile) {
        const dropZone = document.getElementById('backup-drop-zone');
        const dropText = dropZone?.querySelector('.backup-drop-text');
        const dropHint = dropZone?.querySelector('.backup-drop-hint');

        if (dropZone) {
            dropZone.classList.toggle('has-file', hasFile);
        }

        if (dropText) {
            dropText.textContent = hasFile ? 'File loaded successfully' : 'Drop backup file here or click to browse';
        }

        if (dropHint) {
            dropHint.textContent = hasFile ? 'Click below to change file' : 'Supports .json backup files';
        }
    }

    function updateFileInfo(file, data) {
        const fileInfo = document.getElementById('backup-file-info');
        const fileName = document.getElementById('backup-import-filename');
        const fileMeta = document.getElementById('backup-import-meta');
        const importOptions = document.getElementById('backup-import-options');
        const importBtn = document.getElementById('backup-import-btn');

        if (fileInfo) {
            fileInfo.style.display = 'block';
        }

        if (fileName) {
            fileName.textContent = file.name;
        }

        if (fileMeta) {
            const dateStr = data.exportDate ? new Date(data.exportDate).toLocaleDateString() : 'Unknown';
            fileMeta.textContent = `v${data.version || '1.0'} • ${dateStr} • App v${data.appVersion || 'Unknown'}`;
        }

        // Show import options section
        if (importOptions) {
            importOptions.style.display = 'block';
        }

        // Enable import button
        if (importBtn) {
            importBtn.disabled = false;
        }
    }

    function updateImportPreview(data) {
        // Update file contents preview using the actual HTML IDs
        const targetCount = document.getElementById('backup-import-targets');
        const groupCount = document.getElementById('backup-import-groups');
        const historyCount = document.getElementById('backup-import-history');
        const statsCount = document.getElementById('backup-import-stats');

        if (targetCount) targetCount.textContent = data.data?.targets?.length || 0;
        if (groupCount) groupCount.textContent = data.data?.groups?.length || 0;
        if (historyCount) historyCount.textContent = data.data?.attackHistory?.length || 0;
        if (statsCount) statsCount.textContent = data.data?.statistics ? 'Yes' : 'No';
    }

    function updateImportCheckboxes(data) {
        // Update checkbox availability based on what's in the backup
        const dataTypes = ['targets', 'groups', 'attackHistory', 'statistics', 'settings'];

        dataTypes.forEach(type => {
            const hasData = !!(data.data && data.data[type] !== undefined);
            backupState.selectedData[type] = hasData;

            const item = document.querySelector(`.backup-view-import .backup-checkbox-item[data-type="${type}"]`);
            if (item) {
                item.style.opacity = hasData ? '1' : '0.5';
                item.style.pointerEvents = hasData ? 'auto' : 'none';

                item.classList.toggle('checked', hasData);
            }
        });
    }

    function clearImportFile() {
        backupState.importFile = null;
        backupState.importData = null;

        updateDropZoneState(false);

        const fileInfo = document.getElementById('backup-file-info');
        if (fileInfo) {
            fileInfo.style.display = 'none';
        }

        const importOptions = document.getElementById('backup-import-options');
        if (importOptions) {
            importOptions.style.display = 'none';
        }

        const importBtn = document.getElementById('backup-import-btn');
        if (importBtn) {
            importBtn.disabled = true;
        }

        // Reset file input
        const fileInput = document.getElementById('backup-file-input');
        if (fileInput) {
            fileInput.value = '';
        }
    }

    function updateConflictRadios() {
        document.querySelectorAll('.backup-conflict-radio').forEach(option => {
            option.classList.toggle('selected', option.dataset.value === backupState.conflictStrategy);
        });
    }

    async function handleRestoreBackup() {
        if (!backupState.importData) {
            showNotification('No backup file loaded', 'error');
            return;
        }

        showBackupOverlay('import', 'Restoring backup...', 'Importing your data');

        try {
            const dataToImport = {};

            // Collect selected data types
            if (backupState.selectedData.targets && backupState.importData.data.targets) {
                dataToImport.targets = backupState.importData.data.targets;
            }
            if (backupState.selectedData.groups && backupState.importData.data.groups) {
                dataToImport.groups = backupState.importData.data.groups;
            }
            if (backupState.selectedData.attackHistory && backupState.importData.data.attackHistory) {
                dataToImport.attackHistory = backupState.importData.data.attackHistory;
            }
            if (backupState.selectedData.statistics && backupState.importData.data.statistics) {
                dataToImport.statistics = backupState.importData.data.statistics;
            }
            if (backupState.selectedData.settings && backupState.importData.data.settings) {
                dataToImport.settings = backupState.importData.data.settings;
            }

            // Perform import based on conflict strategy
            let result;
            if (backupState.conflictStrategy === 'replace') {
                // Full replace - clear existing and import
                result = await performFullReplace(dataToImport);
            } else if (backupState.conflictStrategy === 'skip') {
                // Skip conflicts - only add new items
                result = await performSkipImport(dataToImport);
            } else {
                // Merge - add new and update existing
                result = await performMergeImport(dataToImport);
            }

            if (result.success) {
                showBackupResult('success', 'Restore Complete!', `Successfully imported ${result.count || 0} items`);

                // Refresh app state
                await window.appState.initialize();
                renderAll();
            } else {
                showBackupResult('error', 'Restore Failed', result.error || 'An unknown error occurred');
            }

        } catch (error) {
            console.error('[Backup] Restore error:', error);
            showBackupResult('error', 'Restore Failed', error.message || 'An unknown error occurred');
        }
    }

    async function performFullReplace(data) {
        try {
            let count = 0;

            if (data.targets) {
                await window.electronAPI.saveTargets(data.targets);
                count += data.targets.length;
            }
            if (data.groups) {
                await window.electronAPI.saveGroups(data.groups);
                count += data.groups.length;
            }
            if (data.attackHistory) {
                await window.electronAPI.saveAttackHistory(data.attackHistory);
                count += data.attackHistory.length;
            }
            if (data.statistics) {
                await window.electronAPI.saveStatistics(data.statistics);
                count += 1;
            }
            if (data.settings) {
                const currentSettings = await window.electronAPI.getSettings();
                // Preserve API keys
                const newSettings = {
                    ...data.settings,
                    apiKey: currentSettings?.apiKey,
                    tornStatsApiKey: currentSettings?.tornStatsApiKey
                };
                await window.electronAPI.saveSettings(newSettings);
                count += 1;
            }

            return { success: true, count };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async function performSkipImport(data) {
        try {
            let count = 0;

            if (data.targets) {
                const existing = await window.electronAPI.getTargets() || [];
                const existingIds = new Set(existing.map(t => t.id));
                const newTargets = data.targets.filter(t => !existingIds.has(t.id));
                if (newTargets.length > 0) {
                    await window.electronAPI.saveTargets([...existing, ...newTargets]);
                    count += newTargets.length;
                }
            }
            if (data.groups) {
                const existing = await window.electronAPI.getGroups() || [];
                const existingIds = new Set(existing.map(g => g.id));
                const newGroups = data.groups.filter(g => !existingIds.has(g.id));
                if (newGroups.length > 0) {
                    await window.electronAPI.saveGroups([...existing, ...newGroups]);
                    count += newGroups.length;
                }
            }
            if (data.attackHistory) {
                const existing = await window.electronAPI.getAttackHistory() || [];
                const existingIds = new Set(existing.map(h => h.id || `${h.timestamp}_${h.targetId}`));
                const newHistory = data.attackHistory.filter(h => !existingIds.has(h.id || `${h.timestamp}_${h.targetId}`));
                if (newHistory.length > 0) {
                    await window.electronAPI.saveAttackHistory([...existing, ...newHistory]);
                    count += newHistory.length;
                }
            }

            return { success: true, count };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async function performMergeImport(data) {
        try {
            let count = 0;

            if (data.targets) {
                const existing = await window.electronAPI.getTargets() || [];
                const existingMap = new Map(existing.map(t => [t.id, t]));

                data.targets.forEach(t => {
                    if (existingMap.has(t.id)) {
                        // Update existing - merge properties
                        const existingTarget = existingMap.get(t.id);
                        existingMap.set(t.id, { ...existingTarget, ...t });
                    } else {
                        existingMap.set(t.id, t);
                    }
                    count++;
                });

                await window.electronAPI.saveTargets(Array.from(existingMap.values()));
            }
            if (data.groups) {
                const existing = await window.electronAPI.getGroups() || [];
                const existingMap = new Map(existing.map(g => [g.id, g]));

                data.groups.forEach(g => {
                    if (existingMap.has(g.id)) {
                        const existingGroup = existingMap.get(g.id);
                        existingMap.set(g.id, { ...existingGroup, ...g });
                    } else {
                        existingMap.set(g.id, g);
                    }
                    count++;
                });

                await window.electronAPI.saveGroups(Array.from(existingMap.values()));
            }
            if (data.attackHistory) {
                const existing = await window.electronAPI.getAttackHistory() || [];
                const existingIds = new Set(existing.map(h => h.id || `${h.timestamp}_${h.targetId}`));
                const newHistory = data.attackHistory.filter(h => !existingIds.has(h.id || `${h.timestamp}_${h.targetId}`));
                await window.electronAPI.saveAttackHistory([...existing, ...newHistory]);
                count += newHistory.length;
            }
            if (data.statistics) {
                const existing = await window.electronAPI.getStatistics() || {};
                const merged = { ...existing, ...data.statistics };
                await window.electronAPI.saveStatistics(merged);
                count++;
            }
            if (data.settings) {
                const currentSettings = await window.electronAPI.getSettings() || {};
                // Preserve API key and merge other settings
                const newSettings = {
                    ...currentSettings,
                    ...data.settings,
                    apiKey: currentSettings.apiKey,
                    tornStatsApiKey: currentSettings.tornStatsApiKey
                };
                await window.electronAPI.saveSettings(newSettings);
                count++;
            }

            return { success: true, count };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    function showBackupOverlay(type, text, subtext) {
        const overlay = document.getElementById('backup-overlay');
        const spinner = document.getElementById('backup-spinner');
        const resultIcon = document.getElementById('backup-result-icon');
        const overlayText = document.getElementById('backup-overlay-text');
        const overlaySubtext = document.getElementById('backup-overlay-subtext');
        const dismissBtn = document.getElementById('backup-overlay-dismiss');

        if (overlay) {
            overlay.classList.add('visible');
            overlay.style.display = 'flex';
        }
        if (spinner) spinner.style.display = 'block';
        if (resultIcon) resultIcon.style.display = 'none';
        if (overlayText) overlayText.textContent = text;
        if (overlaySubtext) overlaySubtext.textContent = subtext;
        if (dismissBtn) dismissBtn.style.display = 'none';
    }

    function showBackupResult(type, text, subtext) {
        const overlay = document.getElementById('backup-overlay');
        const spinner = document.getElementById('backup-spinner');
        const resultIcon = document.getElementById('backup-result-icon');
        const overlayText = document.getElementById('backup-overlay-text');
        const overlaySubtext = document.getElementById('backup-overlay-subtext');
        const dismissBtn = document.getElementById('backup-overlay-dismiss');

        if (spinner) spinner.style.display = 'none';
        if (resultIcon) {
            resultIcon.style.display = 'block';
            resultIcon.className = `backup-result-icon ${type}`;
        }
        if (overlayText) overlayText.textContent = text;
        if (overlaySubtext) overlaySubtext.textContent = subtext;
        if (dismissBtn) dismissBtn.style.display = 'block';

        if (overlay) {
            overlay.classList.add('visible');
            overlay.style.display = 'flex';
        }
    }

    function hideBackupOverlay() {
        const overlay = document.getElementById('backup-overlay');
        if (overlay) {
            overlay.classList.remove('visible');
            overlay.style.display = 'none';
        }

        // Clear import state on success
        if (backupState.importData) {
            clearImportFile();
        }
    }

    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    async function init() {
        debugLog('Initializing Torn Target Tracker...');
        cleanupRendererSubscriptions();

        // Cache DOM elements
        cacheDOMElements();
        hideRefreshStatusUI();

        // Build cloud provider dropdown with icons
        buildCloudProviderList();
        selectCloudProvider(DOM.settingCloudProvider?.value || 'google-drive');

        // Bind UI events
        bindEvents();

        // Bind state events
        bindStateEvents();

        // Start timer interval
        startTimerInterval();

        // Initialize application state
        await window.appState.initialize();

        debugLog('Application initialized');

        // Update WiFi icon on initialization
        updateWifiIcon();
        refreshConnectionIndicators();

        // Listen for internet connectivity changes
        addWindowCleanupListener('online', updateWifiIcon);
        addWindowCleanupListener('offline', updateWifiIcon);

        // Listen for connection state changes from connection dialog
        addWindowCleanupListener('storage', (e) => {
            if (e.key && e.key.startsWith('connection_')) {
                debugLog('[WiFi Icon] Connection state changed:', e.key, e.newValue);
                updateWifiIcon();
            }
        });

        // Listen for connection check completion
        if (window.electronAPI && window.electronAPI.onConnectionCheckCompleted) {
            registerCleanup(window.electronAPI.onConnectionCheckCompleted(() => {
                debugLog('[WiFi Icon] Connection check completed, updating icon');
                updateWifiIcon();
            }));
        }

        // Listen for backup import completion
        if (window.electronAPI && window.electronAPI.onBackupImported) {
            registerCleanup(window.electronAPI.onBackupImported(async () => {
                debugLog('[Backup] Import completed, refreshing data');
                showNotification('Backup imported successfully! Refreshing data...', 'success');
                // Reload all data from store
                try {
                    const [targets, groups, settings, attackHistory, statistics] = await Promise.all([
                        window.electronAPI.getTargets(),
                        window.electronAPI.getGroups(),
                        window.electronAPI.getSettings(),
                        window.electronAPI.getAttackHistory(),
                        window.electronAPI.getStatistics()
                    ]);
                    window.appState.targets = targets || [];
                    window.appState.groups = groups || [];
                    window.appState.settings = settings || {};
                    window.appState.attackHistory = attackHistory || [];
                    window.appState.statistics = statistics || {};
                    renderAll();
                } catch (error) {
                    console.error('[Backup] Failed to refresh after import:', error);
                }
            }));
        }

        // Update WiFi icon periodically (every 5 seconds)
        wifiIconInterval = setInterval(updateWifiIcon, 5000);
    }

    // Wait for DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    window.addEventListener('beforeunload', cleanupRendererSubscriptions, { once: true });
})();
