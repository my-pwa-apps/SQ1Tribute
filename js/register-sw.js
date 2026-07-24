// Register the offline cache from an external script so the page CSP can stay strict.
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('serviceworker.js').then((reg) => {
            if (reg.waiting) {
                showUpdateBanner();
                return;
            }
            reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                if (!newWorker) return;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        showUpdateBanner();
                    }
                });
            });
        }).catch((err) => {
            console.warn('Service worker registration failed:', err);
        });
    });
}

function showUpdateBanner() {
    if (document.getElementById('pwa-update-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'pwa-update-banner';
    banner.setAttribute('role', 'status');
    banner.setAttribute('aria-live', 'polite');
    banner.style.cssText = 'position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:1000;';
    const reloadButton = document.createElement('button');
    reloadButton.type = 'button';
    reloadButton.textContent = 'NEW UPDATE AVAILABLE - RELOAD';
    reloadButton.style.cssText = 'background:#5555FF;color:#FFFFFF;border:2px solid #FFFFFF;padding:8px 16px;font-family:\'Courier New\',monospace;font-size:12px;box-shadow:0 4px 15px rgba(0,0,0,0.5);border-radius:4px;cursor:pointer;text-align:center;text-shadow:1px 1px 0 #000;';
    reloadButton.addEventListener('click', () => {
        window.location.reload();
    });
    banner.appendChild(reloadButton);
    document.body.appendChild(banner);
}
