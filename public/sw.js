// Minimal Service Worker to satisfy PWA installation requirements
self.addEventListener('install', (event) => {
    // console.log('Service Worker installing...');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // console.log('Service Worker activating...');
});

self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) return;

    // Just pass through
    event.respondWith(fetch(event.request));
});
