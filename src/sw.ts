const CACHE = 'v2';
const PRECACHE = ['/'];
const API_PREFIX = '/api/';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('You are offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then(response => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || (await network);
}

self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  // Never intercept same-origin API calls: route them straight to the network
  // so auth/session endpoints always get fresh responses and never hang on a
  // failed cache lookup.
  if (url.origin === self.location.origin && url.pathname.startsWith(API_PREFIX)) {
    e.respondWith(fetch(request));
    return;
  }

  // Navigations (page loads): network-first, cached fallback only when offline.
  if (request.mode === 'navigate') {
    e.respondWith(networkFirst(request));
    return;
  }

  // Everything else (static assets): serve from cache, refresh in the background.
  if (request.method === 'GET') {
    e.respondWith(staleWhileRevalidate(request));
  }
});
