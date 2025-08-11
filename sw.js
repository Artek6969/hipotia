const CACHE = 'kapibara-v1';
const PRECACHE = [
  './',
  './index.html',
  './capybara.png.png',       // grafika z nagłówka (jeśli używasz innej, zmień ścieżkę)
  './manifest.webmanifest'
  // jeśli dodasz więcej plików / dźwięków, dopisz je tutaj
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Offline dla nawigacji + cache-first dla zasobów
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Gdy użytkownik wchodzi na stronę / przeładowuje – zwróć z cache index.html
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then(r => r || fetch(req))
    );
    return;
  }

  // Dla plików statycznych: cache-first, a w tle dociągaj aktualizacje
  event.respondWith(
    caches.match(req).then(cached => {
      const fetchPromise = fetch(req).then(networkRes => {
        const copy = networkRes.clone();
        caches.open(CACHE).then(cache => cache.put(req, copy));
        return networkRes;
      }).catch(() => cached); // jeśli brak sieci – wracamy do cache
      return cached || fetchPromise;
    })
  );
});
