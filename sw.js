const CACHE_NAME = 'battalion-v309';
const ASSETS = [
    './',
    './index.html',
    './config-demo.js',
    './style.css',
    './app.js',
    './personal-dashboard.js',
    './attendance.js',
    './reports-enhanced.js',
    './constraints.js',
    './firebase-config.js',
    './training-icon.png',
    './m4.png',
    './manifest.json',
    './weapons-form.pdf',
    './demo/',
    './demo/index.html',
    './demo/logo.png',
    './demo/doc-logo.png',
    './demo/stamp.png'
];

// Install: cache core assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

// Activate: clean old caches + notify clients (no forced reload)
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.matchAll({ type: 'window' }))
        .then(clients => {
            clients.forEach(client => client.postMessage({ type: 'SW_READY', cache: CACHE_NAME }));
        })
    );
    self.clients.claim();
});

// Fetch: network first, fallback to cache
self.addEventListener('fetch', event => {
    // Skip non-GET requests, Google Sheets API, and Firebase calls
    if (event.request.method !== 'GET') return;
    if (event.request.url.includes('docs.google.com')) return;
    if (event.request.url.includes('firestore.googleapis.com')) return;
    if (event.request.url.includes('firebase')) return;

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Cache successful responses
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
