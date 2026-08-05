const CACHE = 'travel-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks =>
      Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // 跨域请求（Supabase API 等）不缓存，直接走网络
  if (url.origin !== location.origin) return;

  // HTML 走 network-first：保证联网时拿到最新版，离线才回退缓存
  if (e.request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    e.respondWith(fetch(e.request).catch(() => caches.match('./index.html')));
    return;
  }

  // 其他静态资源走 cache-first
  e.respondWith(
    caches.match(e.request).then(r =>
      r || fetch(e.request).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return resp;
      }).catch(() => caches.match('./index.html'))
    )
  );
});
