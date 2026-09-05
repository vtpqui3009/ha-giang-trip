// Đổi số version mỗi lần sửa nội dung index.html, nếu không máy đã cài PWA
// sẽ vẫn hiển thị bản cũ lấy từ cache.
const CACHE_NAME = 'hgloop-v11';
const SHELL_FILES = ['./index.html', './manifest.json'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Network-first for navigation, cache fallback (basic offline resilience)
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('./index.html'))
    );
  }
});

// The page posts messages here to show a reliable local notification,
// even when the PWA tab is backgrounded (not fully closed).
self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'notify') {
    self.registration.showNotification(data.title || 'Hà Giang Loop', {
      body: data.body || '',
      icon: data.icon || undefined,
      tag: data.tag || 'hgloop',
      renotify: true,
      badge: data.icon || undefined,
    });
  }
});

// Real Web Push support is stubbed for a future Tier 2 upgrade (Firebase Cloud
// Messaging + Cloud Function). Left here so upgrading later doesn't require
// re-registering the service worker.
self.addEventListener('push', (event) => {
  let payload = { title: 'Hà Giang Loop', body: 'Có cập nhật mới.' };
  try { payload = event.data ? event.data.json() : payload; } catch (e) {}
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      tag: 'hgloop-push',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientsArr) => {
      const hadWindow = clientsArr.find((c) => 'focus' in c);
      if (hadWindow) return hadWindow.focus();
      return self.clients.openWindow('./index.html');
    })
  );
});
