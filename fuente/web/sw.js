/* Service worker del Sistema de Suministros.
   - Archivos de la app: primero la red (siempre la última versión); sin internet, la copia guardada.
   - Librerías externas (SheetJS, fuente): primero la copia guardada.
   - Las llamadas a la API de Apps Script NUNCA se guardan aquí (los datos viven en IndexedDB). */
const VERSION = '__VERSION__';
const CACHE = 'suministros-' + VERSION;
const APP = __ARCHIVOS__;
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(APP)).then(() => { if (!self.registration.active) return self.skipWaiting(); })); });
self.addEventListener('message', e => { if (e.data === 'activar') self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('suministros-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || /script\.google(usercontent)?\.com$/.test(u.hostname)) return;
  if (u.origin === location.origin) {
    e.respondWith(fetch(e.request).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); } return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))));
  } else if (/cdnjs\.cloudflare\.com|fonts\.(googleapis|gstatic)\.com/.test(u.hostname)) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => { const c = res.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return res; })));
  }
});
