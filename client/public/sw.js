// Service Worker v5 — LuminaSizer
// Detection: self.location.hostname (reliable, no allClients race condition)

const SW_VERSION = 'lumina-v5';

const IS_DEV =
  self.location.hostname === 'localhost' ||
  self.location.hostname === '127.0.0.1';

// ─── DEV: unregister immediately, never intercept anything ───────────────────
if (IS_DEV) {
  self.addEventListener('install', () => {
    self.skipWaiting();
  });

  self.addEventListener('activate', async () => {
    // Wipe all caches that might have been left by a previous bad SW
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
    // Unregister this SW so it never runs again in dev
    await self.registration.unregister();
  });

  // No fetch handler — pass everything through to the network
}

// ─── PRODUCTION: proper offline-ready PWA ────────────────────────────────────
else {
  // Static assets that never change between deploys
  const APP_SHELL = [
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png',
    '/apple-touch-icon.png',
  ];

  // Handle skip-waiting message from page (sent after SW update found)
  self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });

  // ── Install: pre-cache static shell (NOT the HTML — HTML uses network-first)
  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open(SW_VERSION)
        .then(cache => cache.addAll(APP_SHELL))
        .catch(() => {/* non-fatal: icons might not exist yet */})
        .then(() => self.skipWaiting())
    );
  });

  // ── Activate: delete ALL old caches (old SW versions)
  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys()
        .then(keys => Promise.all(
          keys
            .filter(key => key !== SW_VERSION)
            .map(key => caches.delete(key))
        ))
        .then(() => self.clients.claim())
    );
  });

  // ── Fetch strategy
  self.addEventListener('fetch', (event) => {
    const req = event.request;
    const url = new URL(req.url);

    // 1. Skip non-GET, cross-origin, API calls
    if (req.method !== 'GET') return;
    if (url.origin !== self.location.origin) return;
    if (url.pathname.startsWith('/api/')) return;

    // 2. Icons & manifest — cache-first (stable files)
    if (
      url.pathname.startsWith('/icon') ||
      url.pathname === '/manifest.json' ||
      url.pathname === '/apple-touch-icon.png'
    ) {
      event.respondWith(
        caches.match(req).then(cached => {
          if (cached) return cached;
          return fetch(req).then(res => {
            if (res.ok) {
              const clone = res.clone();
              caches.open(SW_VERSION).then(c => c.put(req, clone));
            }
            return res;
          });
        })
      );
      return;
    }

    // 3. Vite JS/CSS bundles — network-first, cache fallback
    //    (fingerprinted filenames change on every deploy, so network is authoritative)
    if (url.pathname.startsWith('/assets/')) {
      event.respondWith(
        fetch(req)
          .then(res => {
            if (res.ok) {
              const clone = res.clone();
              caches.open(SW_VERSION).then(c => c.put(req, clone));
            }
            return res;
          })
          .catch(() => caches.match(req))
      );
      return;
    }

    // 4. Navigation (HTML pages) — network-first with cached shell fallback
    //    Always try to get fresh HTML; only fall back to cache if truly offline
    if (req.mode === 'navigate') {
      event.respondWith(
        fetch(req, { cache: 'no-store' })
          .then(res => {
            // Cache fresh HTML shell for offline use
            if (res.ok) {
              const clone = res.clone();
              caches.open(SW_VERSION).then(c => c.put('/_shell', clone));
            }
            return res;
          })
          .catch(async () => {
            // Offline fallback: serve cached shell
            const shell = await caches.match('/_shell') || await caches.match('/');
            if (shell) return shell;
            // Last resort: minimal offline page
            return new Response(
              `<!DOCTYPE html><html lang="ar" dir="rtl"><head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width,initial-scale=1">
              <title>LuminaSizer — غير متصل</title>
              <style>body{font-family:sans-serif;display:flex;flex-direction:column;align-items:center;
              justify-content:center;min-height:100vh;margin:0;background:#0c1526;color:#e2e8f0;gap:16px;text-align:center;padding:24px}
              .icon{font-size:64px}.btn{background:#10b981;color:#fff;border:none;padding:12px 24px;
              border-radius:12px;font-size:16px;cursor:pointer}</style></head>
              <body><div class="icon">☀️</div>
              <h2>لا يوجد اتصال بالإنترنت</h2>
              <p>تحقق من اتصالك ثم أعد المحاولة</p>
              <button class="btn" onclick="location.reload()">إعادة المحاولة</button>
              </body></html>`,
              { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
            );
          })
      );
      return;
    }

    // 5. Everything else — network only (no caching)
  });
}
