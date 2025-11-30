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
        detailLevelChip: null,
        detailFactionChip: null,
        detailStatusChip: null,
        detailUpdatedChip: null,
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
        detailHistoryList: null,

        // Action buttons
        btnAttack: null,
        btnProfile: null,
        btnRefreshTarget: null,
        btnRemoveTarget: null,

        // Status bar
        statusConnection: null,
        statusRefresh: null,
        refreshText: null,
        progressFill: null,
        btnCancelRefresh: null,
        attackableText: null,
        targetsText: null,
        rateText: null,

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
        loadingOverlay: null
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
    let attackPreventionTargetId = null;
    const activeCountdownTargets = new Set();
    const reminderWatchers = new Map();
    const recentReadyNotifications = new Map();
    let historyFilters = { range: '24h', query: '', queryLower: '' };
    let appInitialized = false;

    const menubarState = {
        activeMenuId: null,
        activeMenuIndex: -1,
        activeItemIndex: -1,
        openedWithKeyboard: false
    };
    let menubarButtons = [];
    let menubarEntries = [];

    // ========================================================================
    // MENUBAR CONFIGURATION
    // ========================================================================

    const MENUBAR_MENUS = [
        {
            id: 'file',
            label: 'File',
            items: [
                { id: 'new-target', label: 'New Target...', shortcut: 'Ctrl+N', enabled: () => appInitialized, action: () => openModal('modal-add-target') },
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
                { id: 'open-data-folder', label: 'Open Data Folder', enabled: () => appInitialized, action: openDataFolder, icon: 'menu-data-folder.svg' },
                { id: 'about', label: 'About Torn Target Tracker', action: showAboutModal, icon: 'menu-about.svg' }
            ]
        }
    ];

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
        DOM.detailHistoryList = document.getElementById('detail-history-list');

        // Action buttons
        DOM.btnAttack = document.getElementById('btn-attack');
        DOM.btnProfile = document.getElementById('btn-profile');
        DOM.btnRefreshTarget = document.getElementById('btn-refresh-target');
        DOM.btnRemoveTarget = document.getElementById('btn-remove-target');

        // Status bar
        DOM.statusConnection = document.getElementById('status-connection');
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

            const icon = document.createElement('span');
            icon.className = 'menubar-menu-icon';
            if (item.icon) {
                icon.style.backgroundImage = `url("assets/${item.icon}")`;
            } else {
                icon.classList.add('placeholder');
            }

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
            if (info?.path) {
                window.electronAPI.openExternal(toFileUrl(info.path));
            } else {
                showToast('Data folder not available yet', 'error');
            }
        } catch (error) {
            console.error('Failed to open data folder', error);
            showToast('Could not open data folder', 'error');
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
            document.getElementById('bulk-preview').style.display = 'none';
            document.getElementById('btn-confirm-bulk').disabled = true;
        });

        // Add group modal
        document.getElementById('btn-confirm-group')?.addEventListener('click', handleAddGroup);
        document.getElementById('input-group-color')?.addEventListener('input', (e) => {
            document.getElementById('color-preview').style.backgroundColor = e.target.value;
        });

        // Edit group modal
        document.getElementById('btn-confirm-edit-group')?.addEventListener('click', handleEditGroup);
        document.getElementById('input-edit-group-color')?.addEventListener('input', (e) => {
            document.getElementById('edit-color-preview').style.backgroundColor = e.target.value;
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
        DOM.aboutOpenLog?.addEventListener('click', openDataFolder);

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
                promptSetDefeatTime(bossId);
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
            ['setting-start-minimized', 'startMinimized']
        ];

        settingBindings.forEach(([elementId, settingKey]) => {
            document.getElementById(elementId)?.addEventListener('change', (e) => {
                window.appState.updateSettings({ [settingKey]: e.target.checked });
                if (settingKey === 'compactMode') {
                    document.body.classList.toggle('compact-mode', e.target.checked);
                }
            });
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
                };
            }
        });

        state.on('targets-changed', () => {
            renderTargetList();
            updateFilterCounts();
            updateStatusBar();
            renderGroups();
            refreshMenubarMenuState();
            window.electronAPI?.setTrayStatus?.({
                targets: window.appState.getTargets().length,
                attackable: window.appState.getTargets().filter(t => t.isAttackable()).length
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

        state.on('selection-changed', (userId) => {
            if (userId && state.currentView !== 'targets') {
                switchView('targets');
            }
            updateTargetListSelection(userId);
            if (userId) {
                const target = state.getTarget(userId);
                if (target) {
                    renderTargetDetail(target);
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
            window.electronAPI?.setTrayStatus?.({
                targets: window.appState.getTargets().length,
                attackable: window.appState.getTargets().filter(t => t.isAttackable()).length
            });
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
            }

            updateRateText(window.appState.limiter.getStatus());
            window.electronAPI?.setTrayStatus?.({
                targets: progress.total,
                attackable: window.appState.getTargets().filter(t => t.isAttackable()).length,
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
        });

        state.on('error', (message) => {
            showToast(message, 'error');
        });

        state.on('settings-changed', () => {
            loadSettings();
            if (state.currentView === 'statistics') {
                renderStatistics();
            }
            refreshMenubarMenuState();
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
        });

        state.on('selection-changed', () => refreshMenubarMenuState());
        state.on('view-changed', () => refreshMenubarMenuState());

        state.on('attack-history-changed', () => {
            if (state.currentView === 'history') {
                renderHistory();
            }
            if (state.currentView === 'statistics') {
                renderStatistics();
            }
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

    function renderTargetList() {
        const targets = window.appState.getFilteredTargets();
        DOM.targetsCount.textContent = `(${targets.length})`;
        activeCountdownTargets.clear();

        if (targets.length === 0) {
            DOM.targetList.innerHTML = `
                <div class="empty-list">
                    <p>No targets found</p>
                </div>
            `;
            return;
        }

        DOM.targetList.innerHTML = targets.map(target => {
            const timeRemaining = target.getFormattedTimeRemaining();
            updateCountdownTracking(target, timeRemaining);
            return createTargetListItem(target, timeRemaining);
        }).join('');

        // Bind events to new items
        DOM.targetList.querySelectorAll('.target-item').forEach(item => {
            const userId = parseInt(item.dataset.userId);

            item.addEventListener('click', () => {
                if (window.appState.currentView !== 'targets') {
                    switchView('targets');
                }
                window.appState.selectTarget(userId);
            });

            item.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                showContextMenu(e, userId);
            });
        });

        // Update selection
        updateTargetListSelection(window.appState.selectedTargetId);
    }

    function createTargetListItem(target, timeRemaining = null) {
        const statusClass = target.getStatusClass();
        const displayName = target.getDisplayName();
        const timerValue = timeRemaining ?? target.getFormattedTimeRemaining();
        const group = window.appState.getGroup(target.groupId);
        const hasNoAttackFlag = group && group.noAttack;
        const selectedClass = window.appState.selectedTargetId === target.userId ? 'selected' : '';
        const flaggedClass = hasNoAttackFlag ? 'in-flagged-group' : '';

        return `
            <div class="target-item ${selectedClass} ${flaggedClass}"
                 data-user-id="${target.userId}">
                <span class="status-dot ${statusClass}"></span>
                <div class="target-info">
                    <span class="target-name">${escapeHtml(displayName)}</span>
                    <span class="target-meta">
                        ${target.level ? `Lv.${target.level}` : ''}
                        ${timerValue ? `&#9201; ${timerValue}` : ''}
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
            newElement.addEventListener('click', () => {
                window.appState.selectTarget(target.userId);
            });

            newElement.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                showContextMenu(e, target.userId);
            });
        }
    }

    function updateTargetListSelection(userId) {
        DOM.targetList.querySelectorAll('.target-item').forEach(item => {
            item.classList.toggle('selected', parseInt(item.dataset.userId) === userId);
        });
    }

    // ========================================================================
    // TARGET DETAIL RENDERING
    // ========================================================================

    function renderTargetDetail(target) {
        if (!target) return;

        DOM.detailName.textContent = target.getDisplayName();
        DOM.detailName.classList.toggle('favorite', target.isFavorite);
        DOM.detailId.textContent = target.userId;
        renderTargetAvatar(target);

        // Status badge
        DOM.detailStatusBadge.textContent = target.statusState || 'Unknown';
        DOM.detailStatusBadge.className = 'status-badge ' + target.getStatusClass();
        updateStatusChip(target);

        // Timer
        updateDetailTimer(target);

        // Favorite button
        DOM.detailFavoriteBtn.classList.toggle('active', target.isFavorite);

        // Info
        DOM.detailLevel.textContent = target.level || '-';
        if (DOM.detailLevelChip) {
            DOM.detailLevelChip.textContent = target.level ? `Lv. ${target.level}` : 'Lv. ?';
        }

        DOM.detailFaction.textContent = target.faction || 'None';
        if (DOM.detailFactionChip) {
            DOM.detailFactionChip.textContent = target.faction || 'No faction';
        }

        if (DOM.detailUpdatedChip) {
            DOM.detailUpdatedChip.textContent = `Updated ${formatTimestamp(target.lastUpdated)}`;
        }

        DOM.detailStatusDesc.textContent = target.statusDesc || target.statusState || '-';
        DOM.detailLastAction.textContent = target.lastActionRelative || '-';
        DOM.detailUpdated.textContent = formatTimestamp(target.lastUpdated);
        DOM.detailAdded.textContent = formatTimestamp(target.addedAt);
        decorateDetailRows(target);

        // Attack stats
        DOM.detailAttackCount.textContent = target.attackCount || 0;
        DOM.detailLastAttacked.textContent = target.lastAttacked ? formatTimestamp(target.lastAttacked) : 'Never';

        // Editable fields
        DOM.detailCustomName.value = target.customName || '';
        DOM.detailNotes.value = target.notes || '';
        if (DOM.detailMonitorOk) {
            DOM.detailMonitorOk.checked = !!target.monitorOk;
        }
        setWatchButtonState(!!target.monitorOk);

        // Group select
        updateGroupSelects();
        DOM.detailGroup.value = target.groupId || 'default';

        // Attack button state
        DOM.btnAttack.disabled = !target.isAttackable();

        renderTargetHistory(target);
    }

    function decorateDetailRows(target) {
        const status = (target.statusState || '').toLowerCase();
        const infoSection = document.querySelector('.detail-section .detail-grid');
        if (!infoSection) return;

        // Clear previous semantic classes
        infoSection.querySelectorAll('.detail-row').forEach(row => {
            row.classList.remove('status-okay', 'status-warning', 'status-bad');
        });

        const statusRow = document.querySelector('[data-detail-row="status"]');
        const lastActionRow = document.querySelector('[data-detail-row="last-action"]');
        if (statusRow) {
            if (status === 'okay' || status === 'ok') {
                statusRow.classList.add('status-okay');
            } else if (status === 'traveling' || status === 'abroad') {
                statusRow.classList.add('status-warning');
            } else if (status) {
                statusRow.classList.add('status-bad');
            }
        }
        if (lastActionRow) {
            if (target.lastActionRelative && target.lastActionRelative.includes('ago')) {
                lastActionRow.classList.add('status-warning');
            }
        }
    }

    function renderTargetHistory(target) {
        const list = DOM.detailHistoryList;
        if (!list) return;

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

    function updateDetailTimer(target) {
        const timeRemaining = target?.getFormattedTimeRemaining();
        if (timeRemaining) {
            DOM.detailTimer.textContent = timeRemaining;
            DOM.detailTimer.style.display = 'inline';
        } else {
            DOM.detailTimer.style.display = 'none';
        }
    }

    function updateStatusChip(target) {
        if (!DOM.detailStatusChip) return;
        const statusText = target.statusDesc || target.statusState || 'Unknown';
        DOM.detailStatusChip.textContent = statusText;
        DOM.detailStatusChip.className = `chip chip-status-chip ${target.getStatusClass()}`;
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

            if (activeCountdownTargets.size === 0) return;

            for (const userId of Array.from(activeCountdownTargets)) {
                const t = window.appState.getTarget(userId);
                const item = DOM.targetList.querySelector(`[data-user-id="${userId}"] .target-meta`);
                if (!t || !item) {
                    activeCountdownTargets.delete(userId);
                    continue;
                }

                const timeRemaining = t.getFormattedTimeRemaining();
                const level = t.level ? `Lv.${t.level}` : '';
                if (timeRemaining) {
                    item.textContent = [level, timeRemaining].filter(Boolean).join(' • ');
                } else {
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
        document.getElementById('group-all-count').textContent = groupCounts.all;

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
            select.innerHTML = groups.map(g => 
                `<option value="${g.id}">${escapeHtml(g.name)}</option>`
            ).join('');
            if (currentValue) select.value = currentValue;
        });
    }

    // ========================================================================
    // FILTER COUNTS
    // ========================================================================

    function updateFilterCounts() {
        const counts = window.appState.getFilterCounts();

        document.getElementById('filter-all-count').textContent = counts.all;
        document.getElementById('filter-okay-count').textContent = counts.okay;
        document.getElementById('filter-hospital-count').textContent = counts.hospital;
        document.getElementById('filter-jail-count').textContent = counts.jail;
        document.getElementById('filter-traveling-count').textContent = counts.traveling;
        document.getElementById('filter-favorites-count').textContent = counts.favorites;
        document.getElementById('filter-errors-count').textContent = counts.errors;

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

    function updateConnectionStatus(isOnline) {
        DOM.statusConnection.classList.toggle('offline', !isOnline);
        const statusText = DOM.statusConnection.querySelector('span');
        statusText.textContent = isOnline ? 'Connected' : 'Offline';
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
        const validHistory = safeHistoryArray(history).filter(record => {
            const ts = new Date(record.timestamp);
            return !Number.isNaN(ts.getTime()) && (!record.type || record.type === 'attack');
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
        const totalAttacks = validHistory.length;
        const avgAttacks = totalAttacks > 0 ? (totalAttacks / days).toFixed(1) : 0;
        note.textContent = totalAttacks > 0
            ? `${totalAttacks} total attacks / ${avgAttacks} avg/day`
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

        const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        const areaPath = `M 0 100 ${linePath} L 100 100 Z`;

        const barsHtml = buckets.map(b => {
            const height = (b.count / maxCount) * 100;
            const barClass = b.isToday ? 'bar today' : 'bar';
            return `
                <div class="bar-column ${b.count > 0 ? 'has-data' : ''}" title="${b.dateLabel}: ${b.count} attacks">
                    <div class="bar-value">${b.count > 0 ? b.count : ''}</div>
                    <div class="${barClass}" style="height:${Math.max(height, 4)}%;"></div>
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
            <svg class="trend-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                    <linearGradient id="attackTrendArea" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="var(--vscode-accent-blue)" stop-opacity="0.25" />
                        <stop offset="100%" stop-color="var(--vscode-accent-blue)" stop-opacity="0" />
                    </linearGradient>
                </defs>
                <path class="trend-area" d="${areaPath}"></path>
                <path class="trend-line" d="${linePath}"></path>
                ${points.map(p => `<circle class="trend-dot ${p.isToday ? 'today' : ''}" cx="${p.x}" cy="${p.y}" r="${p.count > 0 ? 1.6 : 1.1}"></circle>`).join('')}
            </svg>
        `;
    }

    function renderGroupDistribution(distribution) {
        const container = document.getElementById('group-distribution-chart');
        const note = document.getElementById('group-distribution-note');
        if (!container) return;

        const filtered = distribution.filter(d => d.count > 0).sort((a, b) => b.count - a.count);
        const total = filtered.reduce((sum, g) => sum + g.count, 0);
        const groupCount = filtered.length || distribution.length;
        note.textContent = total
            ? `${total} targets / ${groupCount} ${groupCount === 1 ? 'group' : 'groups'}`
            : 'No grouped targets yet';

        if (!total) {
            container.innerHTML = '<div class="bar-empty">Create groups to organize your targets</div>';
            return;
        }

        container.innerHTML = filtered.map((g, index) => {
            const percentage = ((g.count / total) * 100).toFixed(1);
            const barWidth = (g.count / total) * 100;
            const isLargest = index === 0;
            return `
                <div class="group-bar-row ${isLargest ? 'largest' : ''}" style="--fill:${barWidth}%; --fill-color:${g.color || 'var(--vscode-accent-blue)'};" title="${escapeHtml(g.name)}: ${g.count} targets (${percentage}%)">
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

    function loadSettings() {
        const settings = window.appState.settings;

        document.getElementById('setting-api-key').value = settings.apiKey || '';
        document.getElementById('setting-tornstats-key').value = settings.tornStatsApiKey || '';
        document.getElementById('setting-auto-refresh').checked = settings.autoRefresh;
        document.getElementById('setting-refresh-interval').value = settings.refreshInterval;
        document.getElementById('setting-concurrent').value = settings.maxConcurrentRequests;
        document.getElementById('setting-notifications').checked = settings.notifications;
        document.getElementById('setting-sound').checked = settings.soundEnabled;
        document.getElementById('setting-compact').checked = settings.compactMode;
        document.getElementById('setting-confirm-attack').checked = settings.confirmBeforeAttack;
        document.getElementById('setting-minimize-tray').checked = settings.minimizeToTray;
        document.getElementById('setting-start-minimized').checked = settings.startMinimized;

        document.body.classList.toggle('compact-mode', settings.compactMode);

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
            status.innerHTML = `<span class="status-success">Valid key for ${result.user.name} [${result.user.id}]</span>`;
            await window.appState.updateSettings({ apiKey: key });
            showToast('API key saved successfully', 'success');
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
                    window.electronAPI.openAttack(userId);
                    window.appState.recordAttack(userId, { source });
                }
            );
        } else {
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
        const target = window.appState.getTarget(userId);
        if (!target) return;

        const group = window.appState.getGroup(groupId);
        if (!group) return;

        // Don't update if already in this group
        if (target.groupId === groupId) {
            return;
        }

        const result = await window.appState.moveTargetToGroup(userId, groupId);
        if (result?.success) {
            showToast(`Moved to ${group.name}`, 'success');
        } else {
            showToast(result?.error || 'Could not move target to group', 'error');
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
            case 'remove':
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
            }
            return;
        }

        // Target-specific shortcuts
        const selected = window.appState.getSelectedTarget();

        switch (e.key) {
            case 'Enter':
                if (selected && selected.isAttackable()) {
                    handleAttackById(selected.userId, 'keyboard');
                }
                break;
            case 'Delete':
            case 'Backspace':
                if (selected) {
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

        window.appState.selectTarget(targets[newIndex].userId);

        // Scroll into view
        const item = DOM.targetList.querySelector(`[data-user-id="${targets[newIndex].userId}"]`);
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
    }

    // Wait for DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
