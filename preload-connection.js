/**
 * Torn Target Tracker - Connection Dialog Preload Script
 * Secure bridge for connection checking dialog
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('connectionAPI', {
    // Connection checks
    checkInternet: () => ipcRenderer.invoke('check-internet-connection'),
    checkTornAPI: () => ipcRenderer.invoke('check-torn-api'),
    checkTornStats: () => ipcRenderer.invoke('check-tornstats-api'),

    // Dialog control
    closeDialog: () => ipcRenderer.send('close-connection-dialog')
});
