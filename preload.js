/**
 * Torn Target Tracker - Preload Script (Enhanced v2.0)
 * Secure bridge between main and renderer processes
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // ========================================================================
    // WINDOW CONTROLS
    // ========================================================================
    minimizeWindow: () => ipcRenderer.send('window-minimize'),
    maximizeWindow: () => ipcRenderer.send('window-maximize'),
    closeWindow: () => ipcRenderer.send('window-close'),
    isMaximized: () => ipcRenderer.invoke('window-is-maximized'),

    // ========================================================================
    // TARGETS
    // ========================================================================
    getTargets: () => ipcRenderer.invoke('get-targets'),
    saveTargets: (targets) => ipcRenderer.invoke('save-targets', targets),
    addTarget: (target) => ipcRenderer.invoke('add-target', target),
    removeTarget: (userId) => ipcRenderer.invoke('remove-target', userId),
    bulkAddTargets: (targets) => ipcRenderer.invoke('bulk-add-targets', targets),
    fetchAvatar: (userId, url) => ipcRenderer.invoke('fetch-avatar', { userId, url }),

    // ========================================================================
    // GROUPS
    // ========================================================================
    getGroups: () => ipcRenderer.invoke('get-groups'),
    saveGroups: (groups) => ipcRenderer.invoke('save-groups', groups),

    // ========================================================================
    // SETTINGS
    // ========================================================================
    getSettings: () => ipcRenderer.invoke('get-settings'),
    saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
    getApiKey: () => ipcRenderer.invoke('get-api-key'),

    // ========================================================================
    // ATTACK HISTORY
    // ========================================================================
    getAttackHistory: () => ipcRenderer.invoke('get-attack-history'),
    addAttackRecord: (record) => ipcRenderer.invoke('add-attack-record', record),

    // ========================================================================
    // STATISTICS
    // ========================================================================
    getStatistics: () => ipcRenderer.invoke('get-statistics'),
    incrementStat: (statName) => ipcRenderer.invoke('increment-stat', statName),

    // ========================================================================
    // BACKUP & RESTORE
    // ========================================================================
    createBackup: (options) => ipcRenderer.invoke('create-backup', options || {}),
    listBackups: () => ipcRenderer.invoke('list-backups'),
    restoreBackup: (path) => ipcRenderer.invoke('restore-backup', path),
    exportTargets: () => ipcRenderer.invoke('export-targets'),
    importTargets: () => ipcRenderer.invoke('import-targets'),

    // ========================================================================
    // TARGET CACHE
    // ========================================================================
    getTargetCache: () => ipcRenderer.invoke('cache-get-all-targets'),
    getCachedTarget: (userId) => ipcRenderer.invoke('cache-get-target', userId),
    upsertTargetCache: (entries) => ipcRenderer.invoke('cache-upsert-targets', entries),

    // ========================================================================
    // EXTERNAL LINKS
    // ========================================================================
    openExternal: (url) => ipcRenderer.send('open-external', url),
    openAttack: (userId) => ipcRenderer.send('open-attack', userId),
    openProfile: (userId) => ipcRenderer.send('open-profile', userId),

    // ========================================================================
    // NOTIFICATIONS
    // ========================================================================
    showNotification: (title, body) => ipcRenderer.send('show-notification', { title, body }),

    // ========================================================================
    // APP INFO
    // ========================================================================
    getAppInfo: () => ipcRenderer.invoke('get-app-info'),
    openAppPath: (target) => ipcRenderer.invoke('open-app-path', target),
    getSidebarWidth: () => ipcRenderer.invoke('get-sidebar-width'),
    setSidebarWidth: (width) => ipcRenderer.invoke('set-sidebar-width', width),
    chooseDirectory: () => ipcRenderer.invoke('choose-directory'),

    // Tray/status
    setTrayStatus: (status) => ipcRenderer.send('set-tray-status', status),

    // ========================================================================
    // CONNECTION DIALOG
    // ========================================================================
    checkInternetConnection: () => ipcRenderer.invoke('check-internet-connection'),
    checkTornApiConnection: () => ipcRenderer.invoke('check-torn-api'),
    checkTornStatsConnection: () => ipcRenderer.invoke('check-tornstats-api'),
    openConnectionDialog: () => ipcRenderer.invoke('open-connection-dialog'),

    // ========================================================================
    // LOGGING
    // ========================================================================
    log: (level, message, data = null) => ipcRenderer.send('log', { level, message, data }),

    // ========================================================================
    // EVENTS (from main to renderer)
    // ========================================================================
    onTriggerRefresh: (callback) => {
        ipcRenderer.on('trigger-refresh', () => callback());
        return () => ipcRenderer.removeListener('trigger-refresh', callback);
    },
    onOpenAddTarget: (callback) => {
        ipcRenderer.on('open-add-target', () => callback());
        return () => ipcRenderer.removeListener('open-add-target', callback);
    },
    onOpenSettings: (callback) => {
        ipcRenderer.on('open-settings', () => callback());
        return () => ipcRenderer.removeListener('open-settings', callback);
    },
    
    onMaximizeChange: (callback) => {
        ipcRenderer.on('maximize-change', (event, isMaximized) => callback(isMaximized));
        return () => ipcRenderer.removeListener('maximize-change', callback);
    },

    onConnectionCheckCompleted: (callback) => {
        ipcRenderer.on('connection-check-completed', () => callback());
        return () => ipcRenderer.removeListener('connection-check-completed', callback);
    }
});

// Expose platform info
contextBridge.exposeInMainWorld('platform', {
    isMac: process.platform === 'darwin',
    isWindows: process.platform === 'win32',
    isLinux: process.platform === 'linux'
});
