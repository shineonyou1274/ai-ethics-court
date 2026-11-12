// 한 번 연 뒤에는 통신이 끊겨도 앱이 돌아가게 한다.
// 앱 화면은 새 것을 먼저 받아 보고, 못 받으면 넣어 둔 것을 쓴다. 그래야 고친 내용이 바로 퍼진다.
const CACHE = 'life-drama-v1';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icon.svg'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
  caches.open(CACHE).then((c) => c.add('bgm.mp3')).catch(() => {}); // 곡은 뒤에서 천천히 받아 둔다
});
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (req.headers.has('range')) {
    // 음악은 잘라서 받는다. 넣어 둔 곡이 있으면 거기서 잘라 주고, 없으면 그대로 통신에 맡긴다.
    e.respondWith(caches.match(req.url).then(async (hit) => {
      if (!hit) return fetch(req);
      const buf = await hit.arrayBuffer();
      const m = /bytes=(\d+)-(\d*)/.exec(req.headers.get('range')) || [];
      const start = Number(m[1] || 0), end = m[2] ? Math.min(Number(m[2]), buf.byteLength - 1) : buf.byteLength - 1;
      return new Response(buf.slice(start, end + 1), { status: 206, headers: { 'Content-Type': hit.headers.get('Content-Type') || 'audio/mpeg', 'Content-Range': `bytes ${start}-${end}/${buf.byteLength}`, 'Content-Length': String(end - start + 1), 'Accept-Ranges': 'bytes' } });
    }));
    return;
  }
  const url = new URL(req.url);
  if (url.pathname.endsWith('life-drama.html')) return; // 내려받는 파일은 넣어 두지 않는다
  const page = req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('index.html');
  if (url.origin === location.origin && page) {
    e.respondWith(fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; }).catch(() => caches.match(req).then((r) => r || caches.match('index.html'))));
    return;
  }
  // 글꼴과 그림은 넣어 둔 것을 먼저 쓴다
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
    if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return res;
  })));
});
