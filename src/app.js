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
        ratePopoverPenaltyRow: null,
        ratePopoverSuccess: null,
        ratePopoverFailed: null,

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
        aboutLastRefresh: null,
        aboutOpenLog: null,
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

        // Loading
        loadingOverlay: null,

        // Settings
        settingPlayerLevel: null,
        settingBackupRetention: null,
        settingBackupPreop: null,
        settingCloudBackup: null,
        settingCloudProvider: null,
        btnCloudPath: null,
        cloudBackupPath: null
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
    let contextTargetId = null;
    let contextGroupId = null;
    let contextSubmenuTimer = null;
    let pendingConfirmAction = null;
    let bulkPreviewIds = [];
    let avatarLoadToken = 0;
    let appInfoCache = null;
    let connectionCheckInProgress = false;
    let attackPreventionTargetId = null;
    const activeCountdownTargets = new Set();
    const reminderWatchers = new Map();
    const recentReadyNotifications = new Map();
    let historyFilters = { range: '24h', query: '', queryLower: '' };
    let appInitialized = false;
    let onboardingStepIndex = 0;
    let onboardingResumeStep = null;
    let onboardingWaitCondition = null;

    const smartStatusState = {
        nextRefreshAt: null,
        refreshIntervalMs: null,
        autoRefreshEnabled: false,
        lastRefreshAt: null
    };

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
                { id: 'import-targets', label: 'Import Targets...', shortcut: 'Ctrl+Shift+O', enabled: () => appInitialized, action: handleImportTargets, icon: 'menu-import.svg' },
                { id: 'export-targets', label: 'Export Targets...', shortcut: 'Ctrl+Shift+E', enabled: () => appInitialized, action: handleExportTargets, icon: 'menu-export.svg' },
                { id: 'backup-now', label: 'Backup Now', shortcut: 'Ctrl+Shift+K', enabled: () => appInitialized, action: handleCreateBackup, icon: 'menu-backup.svg' },
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
        'menu-view-settings.svg': '<path fill="currentColor" d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a6.97 6.97 0 0 0-1.63-.94L14.5 2h-5l-.25 2.24a6.97 6.97 0 0 0-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.21 8.16a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.13.22.4.3.64.22l2.39-.96c.5.38 1.05.7 1.63.94L9.5 22h5l.25-2.24c.58-.24 1.13-.56 1.63-.94l2.39.96c.24.08.51 0 .64-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>',
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
        DOM.ratePopoverPenaltyRow = document.getElementById('rate-popover-penalty-row');
        DOM.ratePopoverSuccess = document.getElementById('rate-popover-success');
        DOM.ratePopoverFailed = document.getElementById('rate-popover-failed');

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
        DOM.aboutLastRefresh = document.getElementById('about-last-refresh');
        DOM.aboutOpenLog = document.getElementById('about-open-log');
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

        // Loading
        DOM.loadingOverlay = document.getElementById('loading-overlay');

        // Settings
        DOM.settingPlayerLevel = document.getElementById('setting-player-level');
        DOM.settingBackupRetention = document.getElementById('setting-backup-retention');
        DOM.settingBackupPreop = document.getElementById('setting-backup-preop');
        DOM.settingCloudBackup = document.getElementById('setting-cloud-backup');
        DOM.settingCloudProvider = document.getElementById('setting-cloud-provider');
        DOM.btnCloudPath = document.getElementById('btn-cloud-path');
        DOM.cloudBackupPath = document.getElementById('cloud-backup-path');
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
        window.addEventListener('blur', closeMenubar);
        window.addEventListener('resize', closeMenubar);

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
        window.electronAPI.onOpenAddTarget?.(() => openModal('modal-add-target'));
        window.electronAPI.onOpenSettings?.(() => switchView('settings'));

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
            window.appState.setSearchQuery(e.target.value);
            DOM.searchClear.style.display = e.target.value ? 'flex' : 'none';
        });

        DOM.searchClear?.addEventListener('click', () => {
            DOM.searchInput.value = '';
            window.appState.setSearchQuery('');
            DOM.searchClear.style.display = 'none';
        });

        // Filters
        DOM.filterItems.forEach(item => {
            item.addEventListener('click', () => {
                const filter = item.dataset.filter;
                DOM.filterItems.forEach(f => f.classList.remove('active'));
                item.classList.add('active');
                window.appState.setActiveFilter(filter);
            });
        });

        // Target list interactions
        DOM.targetList?.addEventListener('dblclick', handleTargetListDoubleClick);

        // Sort buttons
        DOM.sortBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const sortBy = btn.dataset.sort;
                window.appState.setSort(sortBy);
                DOM.sortBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Add buttons
        DOM.addTargetBtn?.addEventListener('click', () => openModal('modal-add-target'));
        DOM.bulkAddBtn?.addEventListener('click', () => openModal('modal-bulk-add'));
        DOM.addGroupBtn?.addEventListener('click', () => openModal('modal-add-group'));

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
        window.addEventListener('keydown', handleGlobalCommandPaletteShortcut);

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
        document.getElementById('input-target-id')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleAddTarget();
        });

        // Bulk add modal
        document.getElementById('btn-preview-bulk')?.addEventListener('click', handleBulkPreview);
        document.getElementById('btn-confirm-bulk')?.addEventListener('click', handleBulkAdd);
        document.getElementById('input-bulk-ids')?.addEventListener('input', () => {
            const bulkPreview = document.getElementById('bulk-preview');
            const btnConfirmBulk = document.getElementById('btn-confirm-bulk');
            if (bulkPreview) bulkPreview.style.display = 'none';
            if (btnConfirmBulk) btnConfirmBulk.disabled = true;
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

        // Settings
        bindSettingsEvents();

        // Section collapse toggles
        document.querySelectorAll('.section-header').forEach(header => {
            header.addEventListener('click', (e) => {
                if (e.target.closest('.section-action-btn')) return;
                const section = header.closest('.sidebar-section');
                section.classList.toggle('collapsed');
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
            ['setting-auto-refresh', 'autoRefresh'],
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

        document.getElementById('setting-cloud-provider')?.addEventListener('change', (e) => {
            window.appState.updateSettings({ cloudBackupProvider: e.target.value });
        });

        DOM.btnCloudPath?.addEventListener('click', handleChooseCloudPath);

        // Export/Import
        document.getElementById('btn-export')?.addEventListener('click', handleExportTargets);
        document.getElementById('btn-import')?.addEventListener('click', handleImportTargets);
        document.getElementById('btn-backup')?.addEventListener('click', handleCreateBackup);
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
            loadSettings();
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
            if (state.limiter && state.limiter.onStatusChange) {
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
        });

        state.on('targets-changed', () => {
            renderTargetList();
            updateFilterCounts();
            updateStatusBar();
            renderGroups();
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

            if (primaryId && state.currentView !== 'targets') {
                switchView('targets');
            }
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
        });

        state.on('groups-changed', () => {
            renderGroups();
            updateGroupSelects();
            if (state.currentView === 'statistics') {
                renderStatistics();
            }
        });

        state.on('refresh-started', () => {
            DOM.statusRefresh.style.display = 'flex';
            DOM.refreshAllBtn?.classList.add('spinning');
            DOM.refreshText.textContent = 'Refreshing...';
            DOM.progressFill.style.width = '0%';
            updateRateText(window.appState.limiter.getStatus());
            updateNextRefreshStatus(window.appState.getStatistics());
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
            // Handle pause state with countdown
            if (progress.paused) {
                const pauseSeconds = Math.ceil(progress.pauseDuration / 1000);
                DOM.refreshText.textContent = `⏸ ${progress.pauseReason} (${pauseSeconds}s)`;
                DOM.refreshAllBtn?.classList.remove('spinning');

                // Countdown timer during pause
                let remainingSeconds = pauseSeconds;
                const countdownInterval = setInterval(() => {
                    remainingSeconds--;
                    if (remainingSeconds > 0) {
                        DOM.refreshText.textContent = `⏸ ${progress.pauseReason} (${remainingSeconds}s)`;
                    } else {
                        clearInterval(countdownInterval);
                        DOM.refreshText.textContent = 'Resuming refresh...';
                        DOM.refreshAllBtn?.classList.add('spinning');
                    }
                }, 1000);

                // Store interval for cleanup
                if (!window._pauseCountdowns) window._pauseCountdowns = [];
                window._pauseCountdowns.push(countdownInterval);
            } else {
                // Clear any pause countdown intervals
                if (window._pauseCountdowns) {
                    window._pauseCountdowns.forEach(interval => clearInterval(interval));
                    window._pauseCountdowns = [];
                }

                // Normal refresh progress
                DOM.refreshAllBtn?.classList.add('spinning');
                DOM.refreshText.textContent = `Refreshing ${progress.current}/${progress.total}...`;
                DOM.progressFill.style.width = `${progress.percent}%`;
                if (DOM.statusNextRefreshText) {
                    DOM.statusNextRefreshText.textContent = `Refreshing ${progress.current}/${progress.total}...`;
                }
            }

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
            if (window._pauseCountdowns) {
                window._pauseCountdowns.forEach(interval => clearInterval(interval));
                window._pauseCountdowns = [];
            }

            DOM.statusRefresh.style.display = 'none';
            DOM.refreshAllBtn?.classList.remove('spinning');
            DOM.progressFill.style.width = '0%';
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
            if (window._pauseCountdowns) {
                window._pauseCountdowns.forEach(interval => clearInterval(interval));
                window._pauseCountdowns = [];
            }

            DOM.statusRefresh.style.display = 'none';
            DOM.refreshAllBtn?.classList.remove('spinning');
            DOM.progressFill.style.width = '0%';
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

        state.on('settings-changed', () => {
            loadSettings();
            syncOnboardingToggle();
            updateOnboardingStats();
            if (state.currentView === 'statistics') {
                renderStatistics();
            }
            refreshMenubarMenuState();
            updateStatusBar();
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
        });

        state.on('selection-changed', () => refreshMenubarMenuState());
        state.on('view-changed', () => {
            refreshMenubarMenuState();
            if (onboardingWaitCondition?.type === 'view') {
                if (window.appState.currentView === onboardingWaitCondition.targetView) {
                    handleOnboardingResume('view');
                }
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

        state.on('play-notification-sound', () => {
            playSound('notification');
        });
    }

    // ========================================================================
    // VIEW MANAGEMENT
    // ========================================================================

    function switchView(view) {
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
        }
    }

    // Expose switchView to global scope for inline event handlers
    window.switchView = switchView;

    // ========================================================================
    // TARGET LIST RENDERING
    // ========================================================================

    function handleTargetListDoubleClick(event) {
        const item = event.target.closest('.target-item');
        if (!item) return;

        const userId = parseInt(item.dataset.userId, 10);
        if (Number.isNaN(userId)) return;

        window.appState.selectTarget(userId);

        // Check if target's group has noAttack flag
        const target = window.appState.getTarget(userId);
        const group = target ? window.appState.getGroup(target.groupId) : null;

        if (group && group.noAttack) {
            showPremiumAlert({
                title: 'Attack Prevention Warning',
                message: `This target is in "${group.name}" which is flagged as "Do Not Attack". Are you sure you want to proceed?`,
                icon: '🚫',
                iconType: 'warning',
                buttons: [
                    {
                        text: 'Continue Attack',
                        type: 'danger',
                        action: () => {
                            handleAttackById(userId, 'list');
                        }
                    },
                    { text: 'Cancel', type: 'secondary', action: null }
                ]
            });
        } else {
            handleAttackById(userId, 'list');
        }
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

    function renderTargetList() {
        const targets = window.appState.getFilteredTargets();
        const selectedIds = window.appState.getSelectedIds ? window.appState.getSelectedIds() : [];
        DOM.targetsCount.textContent = `(${targets.length})`;
        activeCountdownTargets.clear();

        // Update welcome view with current stats
        updateWelcomeView();
        updateSelectionToolbar(selectedIds);

        if (targets.length === 0) {
            DOM.targetList.innerHTML = `
                <div class="empty-list">
                    <p>No targets found</p>
                </div>
            `;
            updateSelectionToolbar([]);
            return;
        }

        DOM.targetList.innerHTML = targets.map(target => {
            const timeRemaining = target.getFormattedTimeRemaining();
            updateCountdownTracking(target, timeRemaining);
            return createTargetListItem(target, timeRemaining);
        }).join('');

        // Bind events to new items
        DOM.targetList.querySelectorAll('.target-item').forEach(item => {
            const userId = parseInt(item.dataset.userId, 10);

            item.addEventListener('click', (e) => {
                if (window.appState.currentView !== 'targets') {
                    switchView('targets');
                }
                handleTargetItemClick(e, userId);
            });

            item.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                showContextMenu(e, userId);
            });
        });

        // Update selection
        updateTargetListSelection(selectedIds);
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
        const selectedIds = window.appState.getSelectedIds ? window.appState.getSelectedIds() : [];
        const selectedClass = selectedIds.includes(target.userId) ? 'selected' : '';
        const flaggedClass = hasNoAttackFlag ? 'in-flagged-group' : '';
        const showAvatars = window.appState.settings.showAvatars !== false;
        const difficulty = window.appState.getTargetDifficulty
            ? window.appState.getTargetDifficulty(target)
            : null;
        const difficultyBadge = difficulty
            ? `<span class="difficulty-pill ${difficulty.className || ''}" title="${escapeHtml(difficulty.advice || '')}">${escapeHtml(difficulty.label || 'Difficulty')}</span>`
            : '';

        // Avatar HTML
        const avatarHtml = showAvatars ? `
            <div class="target-avatar ${target.avatarPath || target.avatarUrl ? '' : 'placeholder'}">
                ${target.avatarPath || target.avatarUrl ? `<img src="${target.avatarPath || target.avatarUrl}" alt="${escapeHtml(displayName)}">` : ''}
            </div>
        ` : '';

        return `
            <div class="target-item ${selectedClass} ${flaggedClass}"
                 data-user-id="${target.userId}">
                <span class="status-dot ${statusClass}"></span>
                ${avatarHtml}
                <div class="target-info">
                    <span class="target-name">${escapeHtml(displayName)}</span>
                    <span class="target-meta">
                        ${target.level ? `Lv.${target.level}` : ''}
                        ${timerValue ? `&#9201; ${timerValue}` : ''}
                        ${difficultyBadge}
                    </span>
                </div>
                ${target.monitorOk ? '<img src="assets/alert.png" class="target-alert-icon" title="Status monitor enabled" alt="Alert" />' : ''}
                ${hasNoAttackFlag ? '<img src="assets/prevent.png" class="target-prevent-icon" title="⚠ Do Not Attack - Protected by ' + escapeHtml(group.name) + '" alt="Prevent" />' : ''}
                ${target.isFavorite ? '<span class="target-favorite-badge" title="Favorite">&#9733;</span>' : ''}
                ${target.error ? '<span class="target-error">!</span>' : ''}
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
        const now = Date.now();
        const last = recentReadyNotifications.get(target.userId) || 0;
        if (now - last < 5000) return; // throttle per target

        recentReadyNotifications.set(target.userId, now);

        const detail = reason ? ` (${reason})` : '';
        showToast(`${target.getDisplayName()} is OK${detail}`, 'success');
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

        const now = Date.now();
        reminderWatchers.forEach((watch, userId) => {
            const target = window.appState.getTarget(userId);
            if (!target) {
                reminderWatchers.delete(userId);
                return;
            }

            if (watch.until && now >= watch.until && !watch.notifiedZero) {
                watch.notifiedZero = true;
                reminderWatchers.set(userId, watch);

                // Use existing fetch flow to confirm current status (revives, busts, natural expiry)
                if (window.appState?.refreshTargets) {
                    window.appState.refreshTargets([userId]);
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
            
            // Copy event listeners by replacing
            item.replaceWith(newElement);
            
            // Re-bind events
            newElement.addEventListener('click', (e) => {
                handleTargetItemClick(e, target.userId);
            });

            newElement.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                showContextMenu(e, target.userId);
            });
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
        // Toolbar removed per user preference; keep hook for future UI.
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

    function renderTargetIntel(target, { loading = false, error = null } = {}) {
        if (!DOM.detailIntelSection) return;

        const statusEl = DOM.detailIntelStatus;
        const messageEl = DOM.detailIntelMessage;
        const updatedEl = DOM.detailIntelUpdated;
        const sourceEl = DOM.detailIntelSource;
        const freshnessEl = DOM.detailIntelFreshness;

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

        const setMessage = (value, allowHtml = false) => {
            if (!messageEl) return;
            if (allowHtml) {
                messageEl.innerHTML = value;
            } else {
                messageEl.textContent = value;
            }
        };

        if (loading) {
            setStateClass('intel-loading');
            clearStats();
            setStatus('Fetching intelligence...');
            setMessage('Requesting latest spy data from TornStats.');
            if (freshnessEl) freshnessEl.textContent = '';
            return;
        }

        if (error) {
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

        if (!window.tornStatsAPI || !window.tornStatsAPI.apiKey) {
            setStateClass('intel-missing');
            clearStats();
            setStatus('TornStats key required');
            setMessage('Add your TornStats API key in Settings to enable battle stat estimation.', true);
            if (updatedEl) updatedEl.textContent = '-';
            if (sourceEl) sourceEl.textContent = '';
            if (freshnessEl) freshnessEl.textContent = '';
            return;
        }

        const intel = target.intel;
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

        setStateClass('intel-ready');
        setStat(DOM.detailIntelStr, intel.stats?.strength);
        setStat(DOM.detailIntelDef, intel.stats?.defense);
        setStat(DOM.detailIntelSpd, intel.stats?.speed);
        setStat(DOM.detailIntelDex, intel.stats?.dexterity);
        setStat(DOM.detailIntelTotal, intel.stats?.total);

        const sourceText = intel.type
            ? `Source: TornStats - ${intel.type}`
            : 'Source: TornStats';
        if (sourceEl) sourceEl.textContent = sourceText;
        setStatus('Intel ready');
        setMessage(intel.message || 'Latest battle stats from TornStats');

        const lastSeen = intel.lastSeen || intel.fetchedAt || null;
        if (updatedEl) updatedEl.textContent = lastSeen ? formatTimestamp(lastSeen) : '-';
        if (freshnessEl) freshnessEl.textContent = intel.fetchedAt ? `Cached ${formatIntelAge(intel.fetchedAt)}` : '';
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

    function maybeRefreshIntel(target, { force = false } = {}) {
        if (!target || !window.appState?.fetchTargetIntel) return;
        if (!window.tornStatsAPI || !window.tornStatsAPI.apiKey) {
            renderTargetIntel(target);
            return;
        }
        const intel = target.intel;
        const isFresh = intel?.fetchedAt && Date.now() - intel.fetchedAt < INTEL_STALE_MS;
        if (isFresh && !force) return;

        renderTargetIntel(target, { loading: true });
        window.appState.fetchTargetIntel(target.userId, { force })
            .then(() => {
                const updated = window.appState.getTarget(target.userId);
                renderTargetIntel(updated);
                renderDifficulty(updated);
            })
            .catch(err => {
                renderTargetIntel(target, { error: err.message });
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

    function updateDetailTimer(target) {
        if (!target) return;

        // Get NUMERIC time remaining to properly detect when timer expires
        const timeRemainingSeconds = target.getTimeRemaining();
        const formattedTime = target.getFormattedTimeRemaining();

        // Always update status chip to show live countdown
        updateStatusChip(target);

        // Check if timer has expired (0 or less)
        if (timeRemainingSeconds !== null && timeRemainingSeconds <= 0) {
            DOM.detailTimer.style.display = 'none';

            // Timer reached zero - mark target as okay locally if they were in hospital/jail
            if (target.isInHospital() || target.isInJail() || target.isInFederal()) {
                const wasMonitored = target.monitorOk; // Store before updating

                target.statusState = 'Okay';
                target.statusDesc = 'Okay';
                target.statusUntil = null;
                target.ok = true;

                // Update the target in state and save
                window.appState.targets.set(target.userId, target);
                window.appState.saveTargets();

                // Trigger notification if "Notify when OK" was enabled
                if (wasMonitored) {
                    showToast(`${target.getDisplayName()} is now OK and attackable!`, 'success');
                }

                // Update the UI to reflect the change
                window.appState.emit('target-updated', target);

                // Force full re-render of detail view
                renderTargetDetail(target);
            }
        } else if (formattedTime) {
            // Timer still running - show countdown
            DOM.detailTimer.textContent = formattedTime;
            DOM.detailTimer.style.display = 'inline';
        } else {
            // No timer (target doesn't have a countdown)
            DOM.detailTimer.style.display = 'none';
        }
    }

    function updateStatusChip(target) {
        if (!DOM.detailStatusChip) return;

        // Get time remaining for countdown statuses
        const timeRemainingSeconds = target.getTimeRemaining();
        const formattedTime = target.getFormattedTimeRemaining();

        let statusText = target.statusDesc || target.statusState || 'Unknown';

        // If target has a countdown timer, update the status text with live countdown
        if (timeRemainingSeconds !== null && timeRemainingSeconds > 0 && formattedTime) {
            const status = target.statusState || '';
            const statusLower = status.toLowerCase();

            if (statusLower === 'hospital') {
                statusText = `In hospital for ${formattedTime}`;
            } else if (statusLower === 'jail' || statusLower === 'jailed') {
                statusText = `In jail for ${formattedTime}`;
            } else if (statusLower === 'federal') {
                statusText = `In federal for ${formattedTime}`;
            }
        }

        DOM.detailStatusChip.textContent = statusText;
        DOM.detailStatusChip.className = `chip chip-status-chip ${target.getStatusClass()}`;

        // Also update the STATUS row in the detail grid with live countdown
        if (DOM.detailStatusDesc) {
            DOM.detailStatusDesc.textContent = statusText;
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

            if (activeCountdownTargets.size === 0) return;

            for (const userId of Array.from(activeCountdownTargets)) {
                const t = window.appState.getTarget(userId);
                const item = DOM.targetList.querySelector(`[data-user-id="${userId}"] .target-meta`);
                if (!t || !item) {
                    activeCountdownTargets.delete(userId);
                    continue;
                }

                // Get NUMERIC time to properly detect when timer expires
                const timeRemainingSeconds = t.getTimeRemaining();
                const formattedTime = t.getFormattedTimeRemaining();
                const level = t.level ? `Lv.${t.level}` : '';

                // Check if timer has expired (0 or less)
                if (timeRemainingSeconds !== null && timeRemainingSeconds <= 0) {
                    // Timer reached zero - mark target as okay locally
                    // This will be corrected on next refresh if status has changed
                    if (t.isInHospital() || t.isInJail() || t.isInFederal()) {
                        const wasMonitored = t.monitorOk; // Store before updating

                        t.statusState = 'Okay';
                        t.statusDesc = 'Okay';
                        t.statusUntil = null;
                        t.ok = true;

                        // Update the target in state and save
                        window.appState.targets.set(userId, t);
                        window.appState.saveTargets();

                        // Trigger notification if "Notify when OK" was enabled
                        if (wasMonitored) {
                            showToast(`${t.getDisplayName()} is now OK and attackable!`, 'success');
                        }

                        // Update the UI to reflect the change
                        window.appState.emit('target-updated', t);
                        updateTargetInList(t);
                    }

                    item.textContent = level;
                    activeCountdownTargets.delete(userId);
                } else if (formattedTime) {
                    // Timer still running - display countdown
                    item.textContent = [level, formattedTime].filter(Boolean).join(' • ');
                } else {
                    // No countdown
                    item.textContent = level;
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
        const existingAll = DOM.groupsList.querySelector('[data-group="all"]');
        
        DOM.groupsList.innerHTML = '';
        DOM.groupsList.appendChild(existingAll || createGroupElement({ id: 'all', name: 'All Targets', color: '#007acc' }, groupCounts.all));

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
        div.className = `group-item ${activeClass} ${flaggedClass}`;
        div.dataset.group = group.id;
        div.innerHTML = `
            <span class="group-color" style="background: ${group.color};"></span>
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

    function updateStatusBar() {
        const stats = window.appState.getStatistics();
        
        DOM.attackableText.textContent = `${stats.attackableTargets} attackable`;
        DOM.targetsText.textContent = `${stats.totalTargets} targets`;
        updateRateText(stats.rateLimitStatus);
        updateNextRefreshStatus(stats);
        updateConnectionStatus(window.appState.isOnline);
        updateSmartStatusCountdowns(true);
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
        if (!DOM.statusNextRefreshText) return;

        const settings = window.appState.settings || {};
        const autoEnabled = !!(settings.autoRefresh && settings.apiKey);
        const intervalMs = Math.max(10, settings.refreshInterval || stats.refreshInterval || 30) * 1000;
        const lastRefresh = window.appState.lastRefresh || stats.lastRefresh || null;
        let tone = autoEnabled ? 'good' : 'warn';
        let nextAt = null;
        let text = 'Auto off';

        if (window.appState.isRefreshing) {
            text = 'Refreshing now...';
            tone = 'good';
            nextAt = Date.now() + intervalMs;
        } else if (!autoEnabled) {
            text = 'Auto off';
        } else if (!lastRefresh) {
            text = 'Waiting for first run';
            nextAt = Date.now() + intervalMs;
            tone = 'warn';
        } else {
            nextAt = lastRefresh + intervalMs;
            const remaining = Math.max(0, nextAt - Date.now());
            text = `Next in ${formatSmartCountdown(remaining)}`;
            tone = remaining < 15000 ? 'warn' : 'good';
        }

        smartStatusState.nextRefreshAt = nextAt;
        smartStatusState.refreshIntervalMs = intervalMs;
        smartStatusState.autoRefreshEnabled = autoEnabled;
        smartStatusState.lastRefreshAt = lastRefresh;

        DOM.statusNextRefreshText.textContent = text;
        if (DOM.statusRefreshMode) {
            DOM.statusRefreshMode.textContent = autoEnabled ? 'Auto' : 'Manual';
            DOM.statusRefreshMode.classList.remove('good', 'warn', 'bad');
            DOM.statusRefreshMode.classList.add(autoEnabled ? 'good' : 'warn');
        }
        setStatusTone(DOM.statusNextRefresh, tone);
    }

    function updateSmartStatusCountdowns(force = false) {
        if (DOM.statusNextRefreshText && smartStatusState.nextRefreshAt && smartStatusState.autoRefreshEnabled && !window.appState.isRefreshing) {
            const remaining = smartStatusState.nextRefreshAt - Date.now();
            DOM.statusNextRefreshText.textContent = `Next in ${formatSmartCountdown(remaining)}`;
            if (remaining <= 10000) {
                setStatusTone(DOM.statusNextRefresh, 'bad');
            } else if (remaining <= 30000) {
                setStatusTone(DOM.statusNextRefresh, 'warn');
            } else if (force) {
                setStatusTone(DOM.statusNextRefresh, 'good');
            }
        }
    }

    // ========================================================================
    // COMMAND PALETTE (QUICK ACTIONS)
    // ========================================================================

    function buildCommandList() {
        const state = window.appState || {};
        const settings = state.settings || {};
        const autoOn = !!settings.autoRefresh;
        const refreshInterval = settings.refreshInterval || 30;
        const selected = state.getSelectedTarget ? state.getSelectedTarget() : null;
        const hasTargets = (state.getTargets?.() || []).length > 0;

        const items = [
            { id: 'add-target', label: 'Add Target', detail: 'Open add target dialog', shortcut: 'Ctrl+N', action: () => openModal('modal-add-target') },
            { id: 'bulk-add', label: 'Bulk Import Targets', detail: 'Paste IDs or URLs', shortcut: 'Ctrl+Shift+B', action: () => openModal('modal-bulk-add') },
            { id: 'refresh-all', label: 'Refresh All Targets', detail: 'Force live status update', shortcut: 'Ctrl+R', enabled: () => hasTargets, action: () => window.appState.refreshAllTargets() },
            { id: 'toggle-auto-refresh', label: autoOn ? 'Disable Auto Refresh' : 'Enable Auto Refresh', detail: `${autoOn ? 'Running' : 'Currently off'} • ${refreshInterval}s interval`, action: () => window.appState.updateSettings({ autoRefresh: !autoOn }) },
            { id: 'open-settings', label: 'Open Settings', detail: 'Tune preferences', shortcut: 'Ctrl+,', action: () => switchView('settings') },
            { id: 'view-targets', label: 'View Targets', detail: 'Main list', shortcut: 'Ctrl+1', action: () => switchView('targets') },
            { id: 'view-history', label: 'View History', detail: 'Recent attacks', shortcut: 'Ctrl+2', action: () => switchView('history') },
            { id: 'view-statistics', label: 'View Statistics', detail: 'Aggregated metrics', shortcut: 'Ctrl+3', action: () => switchView('statistics') },
            { id: 'view-loot', label: 'View Loot Timer', detail: 'Loot availability', shortcut: 'Ctrl+4', action: () => switchView('loot-timer') },
            { id: 'open-connection', label: 'Check Connections', detail: 'Open connection health dialog', action: () => openConnectionDialog() },
            { id: 'open-about', label: 'About', detail: 'Version, data path', action: () => showAboutModal() },
            { id: 'open-data-folder', label: 'Open Data Folder', detail: 'Jump to storage location', action: () => window.electronAPI?.openAppPath?.('data') },
            { id: 'toggle-compact', label: settings.compactMode ? 'Disable Compact Mode' : 'Enable Compact Mode', detail: 'Adjust density', action: () => window.appState.updateSettings({ compactMode: !settings.compactMode }) },
            selected ? { id: 'attack-selected', label: 'Attack Selected Target', detail: 'Open attack link', shortcut: 'Enter', action: () => handleAttack() } : null,
            selected ? { id: 'open-profile', label: 'Open Selected Profile', detail: 'View target profile', action: () => handleProfile() } : null,
            selected ? { id: 'toggle-favorite', label: 'Toggle Favorite', detail: 'Mark selected target', shortcut: 'F', action: () => window.appState.toggleFavorite(selected.userId) } : null,
            selected ? { id: 'remove-selected', label: 'Remove Selected Target', detail: 'Delete from list', shortcut: 'Del', action: () => handleRemoveTarget() } : null,
            { id: 'backup-now', label: 'Create Backup', detail: 'Manual backup', action: () => handleCreateBackup() },
            { id: 'export-targets', label: 'Export Targets', detail: 'Save to file', action: () => handleExportTargets() },
            { id: 'import-targets', label: 'Import Targets', detail: 'Load from file', action: () => handleImportTargets() },
            { id: 'launch-onboarding', label: 'Launch Onboarding', detail: 'Guided setup', shortcut: 'F1', action: () => showOnboarding(true) },
            { id: 'show-command-palette', label: 'Show Command Palette', detail: 'Search quick actions', shortcut: 'Ctrl+Shift+P', action: () => openCommandPalette() }
        ];

        return items
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
        try {
            cmd.action?.();
        } catch (error) {
            console.error('Command execution failed', error);
            showToast?.('Command failed: ' + error.message, 'error');
        }
    }

    function handleGlobalCommandPaletteShortcut(event) {
        const overlayOpen = DOM.commandPaletteOverlay?.classList.contains('visible');
        const isInput = ['input', 'textarea'].includes((event.target?.tagName || '').toLowerCase()) || event.target?.isContentEditable;

        const openShortcut = (event.key === 'P' && event.shiftKey && (event.ctrlKey || event.metaKey)) || event.key === 'F1';
        if (openShortcut && !overlayOpen) {
            event.preventDefault();
            if (!isInput || event.key === 'F1') {
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
        const recentRequests = status.recentRequests || 0;
        const utilization = status.utilizationPercent || 0;
        const availableTokens = status.availableTokens || 0;

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
            text += ` (⏸ ${waitSeconds}s)`;
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
        if (DOM.ratePopoverPenaltyRow && DOM.ratePopoverPenalty) {
            if (penalty > 0) {
                DOM.ratePopoverPenaltyRow.style.display = '';
                DOM.ratePopoverPenalty.textContent = `${Math.ceil(penalty / 1000)}s`;
            } else {
                DOM.ratePopoverPenaltyRow.style.display = 'none';
            }
        }
        if (DOM.ratePopoverSuccess && status.stats) {
            DOM.ratePopoverSuccess.textContent = (status.stats.successfulRequests || 0).toString();
        }
        if (DOM.ratePopoverFailed && status.stats) {
            DOM.ratePopoverFailed.textContent = (status.stats.failedRequests || 0).toString();
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
                    <div class="history-timeline-dot ${statusClass}"></div>
                    <div class="history-info">
                        <div class="history-row">
                            <div class="history-title">
                                <span class="history-name">${name}</span>
                                <span class="history-id">#${record.userId}</span>
                                ${groupLabel}
                            </div>
                            <div class="history-meta">
                                <span class="history-status ${statusClass}">${escapeHtml(statusLabel)}</span>
                                <span class="history-time" title="${absoluteTime}">${formatTimestamp(record.timestamp)}</span>
                            </div>
                        </div>
                        <div class="history-row secondary">
                            <span class="history-meta-item">${escapeHtml(levelLabel)}</span>
                            <span class="history-meta-item">Status: ${escapeHtml(statusDesc)}</span>
                            <span class="history-meta-item">${escapeHtml(sourceLabel)}</span>
                        </div>
                    </div>
                    <button class="history-action" data-user-id="${record.userId}" title="Attack again">
                        <svg viewBox="0 0 24 24"><path fill="currentColor" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
                    </button>
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
        const uniqueTargets = new Set(filtered.map(r => r.userId)).size;
        const streak = calculateAttackStreak(fullHistory);
        const top = getTopTarget(filtered);

        if (DOM.historyStatTotal) {
            DOM.historyStatTotal.innerHTML = `
                <div class="history-stat-label">Attacks</div>
                <div class="history-stat-value">${formatNumber(filtered.length)}</div>
                <div class="history-stat-meta">${rangeLabel}</div>
            `;
        }

        if (DOM.historyStatUnique) {
            DOM.historyStatUnique.innerHTML = `
                <div class="history-stat-label">Unique Targets</div>
                <div class="history-stat-value">${formatNumber(uniqueTargets)}</div>
                <div class="history-stat-meta">in ${rangeLabel.toLowerCase()}</div>
            `;
        }

        if (DOM.historyStatStreak) {
            DOM.historyStatStreak.innerHTML = `
                <div class="history-stat-label">Day Streak</div>
                <div class="history-stat-value">${formatNumber(streak)}d</div>
                <div class="history-stat-meta">consecutive days with attacks</div>
            `;
        }

        if (DOM.historyStatTop) {
            DOM.historyStatTop.innerHTML = top ? `
                <div class="history-stat-label">Top Target</div>
                <div class="history-stat-value">${escapeHtml(top.name)}</div>
                <div class="history-stat-meta">${formatNumber(top.count)} attack${top.count === 1 ? '' : 's'}${top.group ? ` • ${escapeHtml(top.group)}` : ''}</div>
            ` : `
                <div class="history-stat-label">Top Target</div>
                <div class="history-stat-value">None</div>
                <div class="history-stat-meta">No data yet</div>
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
                        window.appState.setFilter(filter);
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
                meta: stats.autoRefresh ? `Auto every ${formatNumber(stats.refreshInterval)}s` : 'Manual refresh only',
                variant: stats.autoRefresh ? 'refresh-auto' : 'refresh'
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
            color: d.color || 'var(--vscode-accent-blue)'
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

    async function renderLootTimer() {
        const container = document.getElementById('loot-bosses-grid');
        if (!container) return;

        // Clear any existing interval
        if (lootTimerInterval) {
            clearInterval(lootTimerInterval);
            lootTimerInterval = null;
        }

        // Show loading state
        container.innerHTML = '<div class="loot-loading"><div class="spinner large"></div><span>Loading NPC loot data...</span></div>';

        // Fetch real data from TornStats API if key is set
        try {
            await fetchLootApiData();
            // Render boss cards with real data
            container.innerHTML = LOOT_NPCS.map(npc => createBossCard(npc)).join('');
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
                        <button class="action-btn" onclick="window.renderLootTimer()" style="margin-top:16px;">Retry</button>
                    </div>
                `;
                return;
            }

            container.innerHTML = `
                <div class="loot-error">
                    <svg viewBox="0 0 24 24" style="width:48px;height:48px;fill:var(--status-error);margin-bottom:16px;">
                        <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                    <h3>Unable to load loot data</h3>
                    <p>${errorMessage}</p>
                    ${!window.tornStatsAPI.apiKey ?
                        '<p style="margin-top:12px;">Configure your TornStats API key in <a href="#" onclick="window.switchView(\'settings\');return false;" style="color:var(--vscode-accent-blue);">Settings</a> to use this feature.</p>' :
                        '<button class="action-btn primary" onclick="window.renderLootTimer()" style="margin-top:16px;">Retry</button>'}
                </div>
            `;
        }
    }

    // Expose renderLootTimer to global scope for inline event handlers
    window.renderLootTimer = renderLootTimer;

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

                console.log(`Retrying TornStats API fetch (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
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
                            <img src="assets/bosses/${npc.image}" alt="${npc.name}" onerror="this.style.display='none'">
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
                        <div class="loot-level-fill" style="width: 0%"></div>
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

        const html = `
            <div class="loot-time-dialog" data-boss-id="${npc.id}">
                <div class="loot-time-hero">
                    <div class="loot-time-npc">
                        <div class="loot-time-avatar">
                            <img src="assets/bosses/${npc.image}" alt="${npc.name}" />
                        </div>
                        <div class="loot-time-heading">
                            <div class="loot-time-label">Set defeat time</div>
                            <div class="loot-time-title">${npc.name} <span class="loot-time-id">[${npc.id}]</span></div>
                            <div class="loot-time-subtitle">Manual override for loot timers. Choose a preset or dial in an exact timestamp.</div>
                        </div>
                    </div>
                    <div class="loot-time-clock">
                        <div class="clock-label">Local clock</div>
                        <div class="clock-value">${formatClock(now)}</div>
                        <div class="clock-sub">${formatDateLabel(now)}</div>
                    </div>
                </div>

                <div class="loot-time-body">
                    <div class="loot-time-card">
                        <div class="card-header">
                            <span class="card-title">Quick picks</span>
                            <span class="card-subtitle">Fast presets for common kill windows.</span>
                        </div>
                        <div class="loot-time-pills">
                            ${presetOptions.map(opt => `
                                <button class="loot-time-pill" data-minutes="${opt.value}">
                                    <span class="pill-label">${opt.label}</span>
                                    <span class="pill-sub">${opt.note}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <div class="loot-time-card">
                        <div class="card-header">
                            <span class="card-title">Custom timing</span>
                            <span class="card-subtitle">Match the exact defeat moment.</span>
                        </div>
                        <div class="input-stack">
                            <label class="input-label" for="custom-minutes">Minutes ago</label>
                            <div class="input-affix">
                                <input type="number" id="custom-minutes" min="0" max="10000" inputmode="numeric" placeholder="Type minutes...">
                                <span class="input-add-on">min</span>
                            </div>
                        </div>
                        <div class="input-divider"><span>or</span></div>
                        <div class="input-stack">
                            <label class="input-label" for="custom-datetime">Exact defeat time</label>
                            <input type="datetime-local" id="custom-datetime">
                            <small class="input-hint">Uses your local timezone.</small>
                        </div>
                        <div class="loot-time-slider">
                            <div class="slider-header">
                                <span>Scrub timeline</span>
                                <span id="loot-time-range-value">${formatMinutesLabel(activeMinutes)}</span>
                            </div>
                            <input type="range" id="loot-time-range" min="0" max="${sliderMaxMinutes}" step="5" value="${activeMinutes}">
                            <div class="slider-scale">
                                <span>Now</span>
                                <span>${sliderMaxMinutes / 60}h back</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="loot-time-preview">
                    <div class="preview-summary">
                        <div class="preview-label">Will set defeat to</div>
                        <div class="preview-time" id="loot-time-preview-time">${formatDateTime(now)}</div>
                        <div class="preview-sub" id="loot-time-preview-sub"></div>
                    </div>
                    <div class="preview-progress">
                        <div class="preview-progress-bar">
                            <div class="preview-progress-fill" id="loot-time-progress-fill" style="width:0%;"></div>
                        </div>
                        <div class="preview-levels">
                            ${LOOT_LEVELS.map(level => `
                                <div class="preview-level" data-level="${level.level}" data-minutes="${level.minutes}">
                                    <span class="level-badge">${level.label.replace('Level ', '')}</span>
                                    <span class="level-time">${level.minutes}m</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

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
            message: html,
            icon: '⏱️',
            iconType: 'info',
            allowHtml: true,
            dialogClass: 'premium-alert-wide loot-time-modal',
            buttons: [
                { text: 'Cancel', type: 'secondary', action: null },
                { text: 'Set Time', type: 'primary', action: applySelection }
            ]
        });

        const presetButtons = Array.from(document.querySelectorAll('.loot-time-pill'));
        const minutesInput = document.getElementById('custom-minutes');
        const datetimeInput = document.getElementById('custom-datetime');
        const rangeInput = document.getElementById('loot-time-range');
        const rangeValue = document.getElementById('loot-time-range-value');
        const previewTimeEl = document.getElementById('loot-time-preview-time');
        const previewSubEl = document.getElementById('loot-time-preview-sub');
        const progressFill = document.getElementById('loot-time-progress-fill');
        const levelEls = Array.from(document.querySelectorAll('.preview-level'));

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

    function syncCloudBackupControls() {
        const enabled = DOM.settingCloudBackup?.checked;
        if (DOM.settingCloudProvider) {
            DOM.settingCloudProvider.disabled = !enabled;
        }
        if (DOM.btnCloudPath) {
            DOM.btnCloudPath.disabled = !enabled;
        }
        if (DOM.cloudBackupPath) {
            DOM.cloudBackupPath.classList.toggle('muted', !enabled);
        }
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
        document.getElementById('setting-auto-refresh').checked = settings.autoRefresh;
        document.getElementById('setting-refresh-interval').value = settings.refreshInterval;
        document.getElementById('setting-concurrent').value = settings.maxConcurrentRequests;
        document.getElementById('setting-api-rate-limit').value = settings.apiRateLimitPerMinute || window.appState.limiter?.maxTokens || 80;

        // Notifications
        document.getElementById('setting-notifications').checked = settings.notifications;
        document.getElementById('setting-sound').checked = settings.soundEnabled;
        document.getElementById('setting-notify-monitored').checked = settings.notifyOnlyMonitored || false;
        document.getElementById('setting-notify-hospital').checked = settings.notifyOnHospitalRelease || false;
        document.getElementById('setting-notify-jail').checked = settings.notifyOnJailRelease || false;

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
        document.getElementById('cloud-backup-path').textContent = settings.cloudBackupPath || 'No folder selected';
        document.getElementById('setting-max-history').value = settings.maxHistoryEntries || 1000;
        syncCloudBackupControls();

        document.body.classList.toggle('compact-mode', settings.compactMode);

        // Apply theme and list density
        applyTheme(settings.theme || 'dark');
        applyListDensity(settings.listDensity || 'comfortable');

        // Set TornStats API key
        if (window.tornStatsAPI && settings.tornStatsApiKey) {
            window.tornStatsAPI.setApiKey(settings.tornStatsApiKey);
        }

        // App info
        window.electronAPI.getAppInfo().then(info => {
            appInfoCache = info;
            document.getElementById('app-version').textContent = info.version || '2.0.0';
            document.getElementById('data-path').textContent = info.path;
            if (DOM.aboutVersion) {
                DOM.aboutVersion.textContent = info.version || '2.0.0';
            }
            if (DOM.aboutDataPath) {
                DOM.aboutDataPath.textContent = info.path || '-';
            }
        });

        if (DOM.onboardingHideToggle) {
            DOM.onboardingHideToggle.checked = settings.showOnboarding === false;
        }
    }

    async function handleValidateKey() {
        const input = document.getElementById('setting-api-key');
        const status = document.getElementById('api-key-status');
        const key = input.value.trim();

        if (!key) {
            status.innerHTML = '<span class="status-error">Please enter an API key</span>';
            return;
        }

        status.innerHTML = '<span class="status-loading">Validating...</span>';

        const result = await window.appState.validateApiKey(key);

        if (result.valid) {
            status.innerHTML = `<span class="status-success">Valid key for ${result.user.name} [${result.user.id}] (Lv.${result.user.level})</span>`;
            await window.appState.updateSettings({
                apiKey: key,
                playerLevel: result.user.level,
                playerName: result.user.name,
                playerId: result.user.id
            });
            if (DOM.settingPlayerLevel) {
                DOM.settingPlayerLevel.value = result.user.level || '';
            }
            showToast('API key saved successfully', 'success');
            handleOnboardingResume('api');
        } else {
            status.innerHTML = `<span class="status-error">${result.error}</span>`;
        }
    }

    async function handleValidateTornStatsKey() {
        const input = document.getElementById('setting-tornstats-key');
        const status = document.getElementById('tornstats-key-status');
        const key = input.value.trim();

        if (!key) {
            status.innerHTML = '<span class="status-error">Please enter a TornStats API key</span>';
            return;
        }

        // Validate key format before making API call
        if (!key.startsWith('TS_')) {
            status.innerHTML = '<span class="status-error">Invalid key format. TornStats keys start with "TS_"</span>';
            return;
        }

        status.innerHTML = '<span class="status-loading">Validating...</span>';

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

            console.log('TornStats API response:', data);
            console.log('Response keys:', Object.keys(data || {}));

            // Check if we got valid data - TornStats returns an object with NPC data
            if (data && typeof data === 'object' && !data.error) {
                // Parse the data to verify it's valid
                const parsedNpcs = window.tornStatsAPI.parseLootData(data);

                console.log('Parsed NPCs:', parsedNpcs);
                console.log('Parsed NPCs count:', parsedNpcs ? parsedNpcs.length : 0);

                if (parsedNpcs && Array.isArray(parsedNpcs) && parsedNpcs.length > 0) {
                    status.innerHTML = `<span class="status-success">Valid TornStats API key (${parsedNpcs.length} NPCs found)</span>`;
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

            status.innerHTML = `<span class="status-error">${errorMessage}</span>`;
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

    function handleAttackById(userId, source = 'targets') {
        if (window.appState.currentView !== 'targets') {
            switchView('targets');
        }
        window.appState.selectTarget(userId);
        const target = window.appState.getTarget(userId);

        // Check if target is attackable
        if (target && !target.isAttackable()) {
            showAttackPrevention(target);
            return;
        }

        if (window.appState.settings.confirmBeforeAttack) {
            showConfirm(
                'Confirm Attack',
                `Attack ${target?.getDisplayName() || `User ${userId}`}?`,
                () => {
                    if (window.appState.settings.playAttackSound) {
                        playSound('attack');
                    }
                    window.electronAPI.openAttack(userId);
                    window.appState.recordAttack(userId, { source });
                }
            );
        } else {
            if (window.appState.settings.playAttackSound) {
                playSound('attack');
            }
            window.electronAPI.openAttack(userId);
            window.appState.recordAttack(userId, { source });
        }
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
        if (target) {
            showConfirm(
                'Remove Target',
                `Remove ${target.getDisplayName()} from your list?`,
                async () => {
                    await window.appState.removeTarget(target.userId);
                    showToast('Target removed', 'success');
                }
            );
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

    function handleBulkPreview() {
        const input = document.getElementById('input-bulk-ids');
        const preview = document.getElementById('bulk-preview');
        const validCount = document.getElementById('bulk-valid-count');
        const invalidCount = document.getElementById('bulk-invalid-count');
        const previewList = document.getElementById('bulk-preview-list');
        const confirmBtn = document.getElementById('btn-confirm-bulk');

        const { ids, invalid } = InputParser.parseUserIds(input.value);
        bulkPreviewIds = ids;

        validCount.textContent = `${ids.length} valid IDs found`;
        invalidCount.textContent = `${invalid.length} invalid`;
        invalidCount.style.display = invalid.length > 0 ? 'inline' : 'none';

        if (ids.length > 0) {
            previewList.innerHTML = ids.slice(0, 20).map(id => 
                `<span class="preview-id">${id}</span>`
            ).join('') + (ids.length > 20 ? `<span class="preview-more">+${ids.length - 20} more</span>` : '');
            confirmBtn.disabled = false;
        } else {
            previewList.innerHTML = '<span class="preview-error">No valid IDs found</span>';
            confirmBtn.disabled = true;
        }

        preview.style.display = 'block';
    }

    async function handleBulkAdd() {
        if (bulkPreviewIds.length === 0) return;

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
        if (selectedIds.length > 1) {
            if (selectedIds.includes(cid)) {
                return selectedIds;
            }
            return [cid];
        }
        if (selectedIds.length === 1) {
            return selectedIds;
        }
        return Number.isFinite(cid) ? [cid] : [];
    }

    function hideContextMenu() {
        DOM.contextMenu.classList.remove('visible');
        resetContextSubmenuState();
        contextTargetId = null;
    }

    function updateContextMenuFavorite(userId) {
        if (!DOM.contextMenuFavorite) return;
        const target = window.appState.getTarget(userId);
        const label = DOM.contextMenuFavorite.querySelector('span');
        const isFav = target?.isFavorite;
        DOM.contextMenuFavorite.classList.toggle('active', !!isFav);
        if (label) {
            label.textContent = isFav ? 'Remove Favorite' : 'Mark Favorite';
        }
    }

    function updateContextMenuWatch(userId) {
        if (!DOM.contextMenuWatch) return;
        const target = window.appState.getTarget(userId);
        const label = DOM.contextMenuWatch.querySelector('span');
        const isWatching = !!target?.monitorOk;
        DOM.contextMenuWatch.classList.toggle('active', isWatching);
        if (label) {
            label.textContent = isWatching ? 'Ignore Status' : 'Watch Status';
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
            const checkmark = isCurrentGroup
                ? '<svg class="checkmark" viewBox="0 0 24 24"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>'
                : '';

            return `
                <div class="context-submenu-item" data-group-id="${group.id}">
                    <span class="group-color" style="background: ${group.color};"></span>
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
            case 'favorite':
                await window.appState.toggleFavorite(userId);
                updateContextMenuFavorite(userId);
                break;
            case 'toggle-watch': {
                const target = window.appState.getTarget(userId);
                if (target) {
                    const monitorOk = !target.monitorOk;
                    await window.appState.updateTarget(userId, { monitorOk });
                    const updated = window.appState.getTarget(userId);
                    syncReminderWatcher(updated);
                    updateContextMenuWatch(userId);
                    showToast(monitorOk ? 'Status watch enabled' : 'Status watch disabled', monitorOk ? 'success' : 'info');
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
                console.log('Flag-no-attack clicked for group:', contextGroupId, group);
                const currentFlag = await window.appState.toggleGroupNoAttack(contextGroupId);
                console.log('Toggle result:', currentFlag);

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
                case 'o':
                    e.preventDefault();
                    handleImportTargets();
                    break;
                case 'e':
                    e.preventDefault();
                    handleExportTargets();
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
                case 'a':
                    if (window.appState.currentView === 'targets') {
                        e.preventDefault();
                        handleSelectAllTargets();
                    }
                    break;
            }
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
            case 'f':
                if (selected) {
                    window.appState.toggleFavorite(selected.userId);
                }
                break;
        }
    }

    function navigateTargetList(direction) {
        const targets = window.appState.getFilteredTargets();
        if (targets.length === 0) return;

        const currentId = window.appState.selectedTargetId;
        const currentIndex = targets.findIndex(t => t.userId === currentId);
        
        let newIndex;
        if (currentIndex === -1) {
            newIndex = direction === 1 ? 0 : targets.length - 1;
        } else {
            newIndex = currentIndex + direction;
            if (newIndex < 0) newIndex = targets.length - 1;
            if (newIndex >= targets.length) newIndex = 0;
        }

        const nextId = targets[newIndex].userId;
        window.appState.selectTarget(nextId, { anchorId: nextId });

        // Scroll into view
        const item = DOM.targetList.querySelector(`[data-user-id="${nextId}"]`);
        item?.scrollIntoView({ block: 'nearest' });
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
        if (DOM.aboutRefreshInterval) DOM.aboutRefreshInterval.textContent = window.appState.settings.refreshInterval || '-';

        // Color-coded API status
        if (DOM.aboutApiStatus) {
            const hasApiKey = window.appState.api && window.appState.api.hasApiKey();
            const isOnline = window.appState.isOnline;
            const hasErrors = window.appState.api && window.appState.api.consecutiveFailures > 0;

            // Remove all status classes
            DOM.aboutApiStatus.classList.remove('api-status-online', 'api-status-error', 'api-status-missing');

            // Determine status and apply appropriate class
            if (!hasApiKey) {
                // Red - API key is missing
                DOM.aboutApiStatus.textContent = 'Missing API Key';
                DOM.aboutApiStatus.classList.add('api-status-missing');
            } else if (!isOnline || hasErrors) {
                // Burnt orange - there are errors or offline
                DOM.aboutApiStatus.textContent = hasErrors ? 'Error' : 'Offline';
                DOM.aboutApiStatus.classList.add('api-status-error');
            } else {
                // Green - connected and working
                DOM.aboutApiStatus.textContent = 'Online';
                DOM.aboutApiStatus.classList.add('api-status-online');
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
        console.log('[WiFi Icon] Updated', {
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

                    // Timer reached zero - mark target as okay locally
                    if (target.isInHospital?.() || target.isInJail?.() || target.isInFederal?.()) {
                        target.statusState = 'Okay';
                        target.statusDesc = 'Okay';
                        target.statusUntil = null;
                        target.ok = true;

                        // Update the target in state and save
                        window.appState.targets.set(target.userId, target);
                        window.appState.saveTargets();

                        // Update the UI to reflect the change
                        window.appState.emit('target-updated', target);

                        // Update the modal display
                        document.getElementById('attack-prevention-status-text').textContent = 'Okay';
                        document.querySelector('#modal-attack-prevention .status-badge')?.classList.remove('status-hospital', 'status-jail', 'status-federal');
                        document.querySelector('#modal-attack-prevention .status-badge')?.classList.add('status-okay');
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

        // Use a detached DOM to safely parse any anchor tags
        const parserContainer = document.createElement('div');
        parserContainer.innerHTML = rawReason;

        const anchor = parserContainer.querySelector('a');
        const anchorHref = anchor?.getAttribute('href') || '';
        const anchorText = anchor?.textContent?.trim() || '';
        let prefixText = parserContainer.textContent?.trim() || '';

        // If we have an anchor, remove it from the prefix so we don't double-print
        if (anchor && anchor.parentElement) {
            anchor.parentElement.removeChild(anchor);
            prefixText = (parserContainer.textContent || '').trim();
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
    // AUDIO PLAYBACK
    // ========================================================================

    function playSound(soundName) {
        try {
            const audio = new Audio(`assets/${soundName}.wav`);
            audio.volume = 0.5; // 50% volume
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
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span class="toast-message">${escapeHtml(message)}</span>
            <button class="toast-close">&times;</button>
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
                buttons: legacyButtons,
                allowHtml: true
            };
        } else if (!options || typeof options !== 'object') {
            normalizedOptions = {};
        }

        const {
            title = '',
            message = '',
            icon = '⚠️',
            iconType = 'warning',
            buttons = [
                { text: 'OK', type: 'primary', action: null },
                { text: 'Close', type: 'secondary', action: null }
            ],
            allowHtml = false,
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
        if (allowHtml) {
            messageElement.innerHTML = message || '';
        } else {
            messageElement.textContent = message || '';
        }

        // Render buttons
        actionsElement.innerHTML = buttons.map(btn =>
            `<button class="premium-alert-btn ${btn.type || 'secondary'}" data-action="${btn.text.toLowerCase()}">${btn.text}</button>`
        ).join('');

        // Add button listeners
        actionsElement.querySelectorAll('.premium-alert-btn').forEach((btn, index) => {
            btn.addEventListener('click', () => {
                if (buttons[index].action) {
                    buttons[index].action();
                }
                hidePremiumAlert();
            });
        });

        // Show overlay
        overlay.classList.add('visible');

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                hidePremiumAlert();
            }
        });
    }

    function hidePremiumAlert() {
        const overlay = document.getElementById('premium-alert-overlay');
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

    function toFileUrl(filePath) {
        if (!filePath) return '';
        if (filePath.startsWith('file://')) return filePath;
        const normalized = filePath.replace(/\\/g, '/');
        return encodeURI(`file:///${normalized}`);
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
        
        // Otherwise show date
        return date.toLocaleDateString();
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

    function safeHistoryArray(history) {
        return Array.isArray(history) ? history : [];
    }

    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    async function init() {
        console.log('Initializing Torn Target Tracker...');

        // Cache DOM elements
        cacheDOMElements();

        // Bind UI events
        bindEvents();

        // Bind state events
        bindStateEvents();

        // Start timer interval
        startTimerInterval();

        // Initialize application state
        await window.appState.initialize();

        console.log('Application initialized');

        // Update WiFi icon on initialization
        updateWifiIcon();
        refreshConnectionIndicators();

        // Listen for internet connectivity changes
        window.addEventListener('online', updateWifiIcon);
        window.addEventListener('offline', updateWifiIcon);

        // Listen for connection state changes from connection dialog
        window.addEventListener('storage', (e) => {
            if (e.key && e.key.startsWith('connection_')) {
                console.log('[WiFi Icon] Connection state changed:', e.key, e.newValue);
                updateWifiIcon();
            }
        });

        // Listen for connection check completion
        if (window.electronAPI && window.electronAPI.onConnectionCheckCompleted) {
            window.electronAPI.onConnectionCheckCompleted(() => {
                console.log('[WiFi Icon] Connection check completed, updating icon');
                updateWifiIcon();
            });
        }

        // Update WiFi icon periodically (every 5 seconds)
        setInterval(updateWifiIcon, 5000);
    }

    // Wait for DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
