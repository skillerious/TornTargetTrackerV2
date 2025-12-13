/**
 * Torn Target Tracker - State Module Index
 * Ensures AppState is constructed after module mixins are loaded
 */

(function() {
    const ctor = (typeof window !== 'undefined' && window.AppState) ? window.AppState : (typeof AppState !== 'undefined' ? AppState : null);
    if (!ctor) {
        console.error('[State] AppState is not defined. Ensure state/core.js is loaded first.');
        return;
    }

    // Create global instance
    window.appState = new ctor();
})();
