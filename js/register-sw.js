// Register the offline cache from an external script so the page CSP can stay strict.
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('serviceworker.js').catch((err) => {
            console.warn('Service worker registration failed:', err);
        });
    });
}
