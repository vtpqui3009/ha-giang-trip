// ĐỔI SỐ VERSION MỖI LẦN SỬA index.html. Trình duyệt chỉ cài lại service worker
// khi FILE NÀY đổi byte — sửa index.html mà không chạm vào đây thì máy đã cài PWA
// không bao giờ biết có bản mới.
//
// Chuyện đã xảy ra thật: file này đứng ở 'hgloop-v11' từ 05/09/2026 trong khi
// index.html đổi 14 lần (v12 → v25). Vì handler fetch bên dưới hồi đó chỉ đọc
// cache mà KHÔNG BAO GIỜ GHI LẠI, bản offline trên mỗi máy đóng băng ở đúng cái
// index.html lúc máy đó mở trang lần đầu. Có mạng thì network-first vẫn trả bản
// mới nên không ai nhận ra; mất sóng mới rơi về bản cũ hai tháng trước — đúng
// lúc cần nhất (đoạn Mậu Duệ → Lũng Hồ → Du Già sóng rất yếu).
//
// Hai thứ chặn lỗi đó tái diễn, đừng tháo ra:
//   1. fetch ghi lại cache sau mỗi lần tải thành công → bản offline tự mới.
//   2. install cache TỪNG file riêng. Trước đây dùng cache.addAll(), mà addAll là
//      tất-cả-hoặc-không: một file 404 là reject, .catch() nuốt im, không file nào
//      được cache — mất cả index.html mà không báo gì.
const CACHE_NAME = 'hgloop-v26';
const SHELL_FILES = [
  './index.html',
  './manifest.json',
  './ha-giang-26-diem.kml',
  './link-chi-duong.txt',
];

// Tên file được phục vụ lại từ cache khi mất sóng.
const SHELL_NAMES = new Set(SHELL_FILES.map((f) => f.replace('./', '')));

// Một request → khoá cache tương ứng, hoặc null nếu không can thiệp.
// Chỉ nhận cùng origin: tuyệt đối không chặn Firestore, Leaflet CDN, tile bản đồ
// hay Open-Meteo — chặn vào là vỡ chat nhóm và bản đồ.
function shellKey(request) {
  let url;
  try { url = new URL(request.url); } catch (e) { return null; }
  if (url.origin !== self.location.origin) return null;
  if (request.mode === 'navigate') return './index.html';
  const base = url.pathname.split('/').pop();
  if (base === '' || base === 'index.html') return './index.html';
  return SHELL_NAMES.has(base) ? './' + base : null;
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // allSettled chứ không phải addAll: lỗi file nào chỉ mất file đó.
      Promise.allSettled(
        SHELL_FILES.map((f) =>
          // cache:'reload' để bỏ qua HTTP cache, lấy đúng bytes vừa deploy.
          fetch(f, { cache: 'reload' }).then((r) => (r && r.ok ? cache.put(f, r) : null))
        )
      )
    ).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Network-first CÓ GHI LẠI CACHE. Mỗi lần tải thành công là bản offline được
// cập nhật, nên nội dung offline không thể trôi khỏi bản thật nữa.
// Xử cả GET không phải navigate, nếu không thì .kml/.txt dù đã nằm trong cache
// vẫn không tải được khi mất sóng.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const key = shellKey(req);
  if (!key) return;                       // để trình duyệt tự lo
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          event.waitUntil(
            caches.open(CACHE_NAME).then((c) => c.put(key, copy)).catch(() => {})
          );
        }
        return res;
      })
      .catch(() => caches.match(key).then((hit) => hit || Response.error()))
  );
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
