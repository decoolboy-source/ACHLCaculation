// sw.js — Service Worker cho MultiHVAC Calculator
//
// Mục đích: sau khi mở app LẦN ĐẦU khi có mạng (vd: từ link GitHub Pages), mọi lần
// mở sau đó — kể cả KHÔNG có mạng — app vẫn chạy được đầy đủ, vì mọi file cần thiết
// đã được lưu sẵn trong bộ nhớ đệm (cache) của trình duyệt.
//
// QUAN TRỌNG khi cập nhật app: đổi số ở CACHE_VERSION bên dưới mỗi khi bạn sửa code
// và muốn người dùng nhận bản mới. Nếu không đổi, trình duyệt sẽ tiếp tục dùng bản
// cache cũ vô thời hạn (vì đây chính là mục đích của cache — chạy offline được).
const CACHE_VERSION = 'v12';
const CACHE_NAME = `multihvac-${CACHE_VERSION}`;

// "App shell" — các file gốc của app, PHẢI có để app chạy được ít nhất là giao diện
// (dù các thư viện ngoài như PDF/Excel export có tải được hay không).
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './src/app-data.js',
  './src/app-calc.js',
  './src/app-ui.js',
];

// Thư viện ngoài (CDN) — cần cho xuất PDF/Excel/icon. Vì đây là các URL đã ghim
// đúng phiên bản (vd jspdf@2.5.1), nội dung sẽ không đổi — cache-first an toàn.
const CDN_LIBS = [
  'https://unpkg.com/lucide@latest/dist/umd/lucide.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // App shell: bắt buộc phải cache được, nếu lỗi thì dừng cài đặt (app cốt lõi
    // không hoạt động được nếu thiếu các file này).
    await cache.addAll(APP_SHELL);
    // Thư viện CDN: cố gắng cache nhưng KHÔNG chặn cài đặt nếu 1 thư viện tải lỗi
    // (vd mất mạng ngay lúc cài) — app vẫn dùng được phần lõi, chỉ thiếu PDF/Excel
    // export cho tới lần sau có mạng.
    await Promise.all(CDN_LIBS.map(async (url) => {
      try {
        const res = await fetch(url, { mode: 'no-cors' });
        await cache.put(url, res);
      } catch (e) { /* bỏ qua, không chặn cài đặt */ }
    }));
    // Kích hoạt Service Worker mới ngay, không cần đợi tab cũ đóng hết
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Xóa cache của phiên bản cũ (khi CACHE_VERSION đã đổi)
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return; // không can thiệp request POST/PUT...

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);

    const isSameOrigin = req.url.startsWith(self.location.origin);

    if (isSameOrigin) {
      // App shell (file cục bộ): "stale-while-revalidate" — trả về bản cache ngay
      // (nhanh, chạy offline được), đồng thời âm thầm tải bản mới từ mạng (nếu có)
      // để cập nhật cache cho lần mở sau — cân bằng giữa tốc độ và luôn có bản mới.
      const networkFetch = fetch(req).then((res) => {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      }).catch(() => null);
      return cached || (await networkFetch) || new Response('Offline — file chưa có trong bộ nhớ đệm', { status: 503 });
    } else {
      // Thư viện CDN (URL đã ghim phiên bản): cache-first — nội dung không đổi
      // theo phiên bản đã ghim, ưu tiên tốc độ và hoạt động offline.
      if (cached) return cached;
      try {
        const res = await fetch(req, { mode: 'no-cors' });
        cache.put(req, res.clone());
        return res;
      } catch (e) {
        return new Response('Offline — thư viện ngoài chưa được tải về trước đó', { status: 503 });
      }
    }
  })());
});
