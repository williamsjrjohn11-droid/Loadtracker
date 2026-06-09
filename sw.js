const CACHE_NAME = 'loadtracker-v1';
const ASSETS = [
  '/Loadtracker/',
  '/Loadtracker/index.html',
  'https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700&display=swap'
];

// Install — cache core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, fall back to cache
self.addEventListener('fetch', e => {
  // Skip non-GET and chrome-extension requests
  if (e.request.method !== 'GET' || e.request.url.startsWith('chrome-extension')) return;
  
  // Skip Google APIs and Apps Script (always need network)
  if (e.request.url.includes('googleapis.com') || 
      e.request.url.includes('script.google.com') ||
      e.request.url.includes('accounts.google.com')) return;

  e.respondWith(
    fetch(e.request)
      .then(resp => {
        // Cache successful responses for the app itself
        if (resp && resp.status === 200 && e.request.url.includes('Loadtracker')) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return resp;
      })
      .catch(() => caches.match(e.request))
  );
});
