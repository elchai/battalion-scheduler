const CACHE_NAME = 'battalion-v2';
const ASSETS = [
    '/battalion-scheduler/',
    '/battalion-scheduler/index.html',
    '/battalion-scheduler/style.css',
    '/battalion-scheduler/app.js',
    '/battalion-scheduler/logo.png',
    '/battalion-scheduler/manifest.json',
    '/battalion-scheduler/weapons-form.pdf'
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
    // Skip non-GET requests and Google Sheets API calls
    if (event.request.method !== 'GET') return;
    if (event.request.url.includes('docs.google.com')) return;

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
