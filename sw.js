const CACHE_NAME = 'battalion-v9';
const ASSETS = [
    '/battalion-scheduler/',
    '/battalion-scheduler/index.html',
    '/battalion-scheduler/style.css',
    '/battalion-scheduler/app.js',
    '/battalion-scheduler/firebase-config.js',
    '/battalion-scheduler/logo.png',
    '/battalion-scheduler/doc-logo.png',
    '/battalion-scheduler/manifest.json',
    '/battalion-scheduler/weapons-form.pdf',
    '/battalion-scheduler/docsmove/',
    '/battalion-scheduler/docsmove/index.html',
    '/battalion-scheduler/docsmove/style.css',
    '/battalion-scheduler/docsmove/app.js',
    '/battalion-scheduler/docsmove/manifest.json'
];

// Install: cache core assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
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
