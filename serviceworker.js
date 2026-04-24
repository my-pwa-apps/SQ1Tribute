// Star Sweeper: A Space Adventure - Service Worker
// BUMP VERSION on every code change to invalidate the cache.
const VERSION = 'v1.0.2';
const CACHE_NAME = `starsweeper-${VERSION}`;

const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './js/engine.js',
    './js/game.js',
    './js/sound.js',
    './js/vr.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys.filter((k) => k.startsWith('starsweeper-') && k !== CACHE_NAME)
                .map((k) => caches.delete(k))
        )).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;
    event.respondWith(
        caches.match(req).then((cached) => {
            if (cached) return cached;
            return fetch(req).then((res) => {
                // Only cache same-origin successful responses
                if (!res || res.status !== 200 || res.type !== 'basic') return res;
                const clone = res.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(req, clone)).catch(() => {});
                return res;
            }).catch(() => cached);
        })
    );
});
