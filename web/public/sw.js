// FitTrack Pro Service Worker — v3 (offline-first)
const CACHE_NAME = 'fittrack-v3';
const API_CACHE  = 'fittrack-api-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/icon-192.png',
  '/icon-512.png',
];

// ── Install: pre-cache shell ──────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

// ── Activate: purge old caches ────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== API_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── IndexedDB queue (offline POST/PUT/DELETE) ─────────────────────────────────
const openQueue = () => new Promise((resolve, reject) => {
  const req = indexedDB.open('fittrack-queue', 2);
  req.onupgradeneeded = (e) => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains('requests')) {
      db.createObjectStore('requests', { keyPath: 'id', autoIncrement: true });
    }
  };
  req.onsuccess = (e) => resolve(wrapDB(e.target.result));
  req.onerror = reject;
});

const wrapDB = (db) => ({
  add: (item) => new Promise((res, rej) => {
    const tx = db.transaction('requests', 'readwrite');
    tx.objectStore('requests').add(item);
    tx.oncomplete = res;
    tx.onerror = rej;
  }),
  getAll: () => new Promise((res) => {
    const tx = db.transaction('requests', 'readonly');
    const req = tx.objectStore('requests').getAll();
    req.onsuccess = () => res(req.result || []);
    req.onerror = () => res([]);
  }),
  delete: (id) => new Promise((res) => {
    const tx = db.transaction('requests', 'readwrite');
    tx.objectStore('requests').delete(id);
    tx.oncomplete = res;
    tx.onerror = res;
  }),
  clear: () => new Promise((res) => {
    const tx = db.transaction('requests', 'readwrite');
    tx.objectStore('requests').clear();
    tx.oncomplete = res;
  }),
});

const enqueueRequest = async (request) => {
  const body = await request.text().catch(() => '');
  const entry = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body,
    timestamp: Date.now(),
  };
  const db = await openQueue();
  await db.add(entry);
};

// Replay queued requests — only delete successfully replayed items
const replayQueue = async () => {
  const db = await openQueue();
  const items = await db.getAll();
  for (const item of items) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.method !== 'GET' ? item.body : undefined,
      });
      if (res.ok || res.status < 500) {
        await db.delete(item.id);
      }
    } catch {
      // Network still down — keep item for next sync
    }
  }
};

self.addEventListener('sync', (event) => {
  if (event.tag === 'fittrack-sync') {
    event.waitUntil(replayQueue());
  }
});

// ── Fetch strategy ────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Non-GET API mutations: network-first, queue offline
  if (url.pathname.startsWith('/api/') && event.request.method !== 'GET') {
    event.respondWith(
      fetch(event.request.clone()).catch(async () => {
        await enqueueRequest(event.request.clone()).catch(() => {});
        self.registration.sync?.register('fittrack-sync').catch(() => {});
        return new Response(JSON.stringify({ success: true, queued: true }), {
          status: 202,
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );
    return;
  }

  // GET API requests: network-first, stale cache fallback
  if (url.pathname.startsWith('/api/') && event.request.method === 'GET') {
    event.respondWith(
      fetch(event.request.clone())
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(API_CACHE).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(event.request, { cacheName: API_CACHE }).then((cached) =>
            cached || new Response(JSON.stringify({ success: false, offline: true, data: [] }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            })
          )
        )
    );
    return;
  }

  // Non-GET non-API: skip
  if (event.request.method !== 'GET') return;

  // Static assets — network-first, cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Offline', { status: 503 });
        })
      )
  );
});

// ── Push notifications ────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'FitTrack Pro', body: "Time to work out! 💪" };
  event.waitUntil(
    self.registration.showNotification(data.title || 'FitTrack Pro', {
      body: data.body || "Time to work out! 💪",
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'workout-reminder',
      renotify: true,
      data: { url: data.url || '/workout' },
    })
  );
});

// ── Notification click ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/workout';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(self.location.origin));
      if (existing) { existing.focus(); existing.navigate(targetUrl); }
      else self.clients.openWindow(targetUrl);
    })
  );
});
