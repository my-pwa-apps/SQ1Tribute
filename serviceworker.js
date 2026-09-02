// Star Sweeper: A Space Adventure - Service Worker
// BUMP VERSION on every code change to invalidate the cache.
const VERSION = 'v1.0.91';
const CACHE_NAME = `starsweeper-${VERSION}`;

const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './js/palette.js',
    './js/engine.js',
    './js/registry.js',
    './js/art.js',
    './js/rooms/ship.js',
    './js/rooms/engine-room.js',
    './js/rooms/kerona.js',
    './js/rooms/endgame.js',
    './js/game.js',
    './js/sound.js',
    './js/vr.js',
    './js/content.js',
    './js/register-sw.js',
    './icons/star-192.svg',
    './icons/star-512.svg',
    './icons/star-maskable-512.svg',
    './fonts/vt323-latin-400-normal.woff2'
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
    const url = new URL(req.url);
    const isAppShell = url.origin === self.location.origin &&
        (url.pathname.endsWith('/') || url.pathname.endsWith('/index.html'));

    event.respondWith(
        (isAppShell ? networkFirst(req) : cacheFirst(req))
    );
});

function cacheResponse(req, res) {
    if (!res || res.status !== 200 || res.type !== 'basic') return;
    const clone = res.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(req, clone)).catch(() => {});
}

function networkFirst(req) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    return fetch(req, { signal: controller.signal }).then((res) => {
        cacheResponse(req, res);
        return res;
    }).catch(async () => {
        const cached = await caches.match(req) || await caches.match('./index.html');
        return cached || new Response('Star Sweeper is unavailable offline until it has been opened once.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }).finally(() => clearTimeout(timeout));
}

function cacheFirst(req) {
    return caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
            cacheResponse(req, res);
            return res;
        }).catch(() => cached);
    });
}
