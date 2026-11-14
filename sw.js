// Taulell de Control · service worker
// L'app (index.html) es demana primer a la xarxa, perquè les actualitzacions arribin de seguida;
// sense connexió, es fa servir la còpia desada. Les lletres es desen la primera vegada.
// Les dades (el temps, partits, divises, notícies…) sempre van a la xarxa.
const VERSIO = 'taulell-v1';
const APP = ['./', 'index.html', 'manifest.webmanifest', 'icones/icon-192.png', 'icones/icon-512.png', 'icones/apple-touch-icon.png', 'icones/favicon-32.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSIO).then(c => c.addAll(APP)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSIO).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // pàgina i fitxers de l'app: primer la xarxa, després la còpia
  if (url.origin === self.location.origin){
    e.respondWith(fetch(req).then(r => { if (r.ok){ const cp = r.clone(); caches.open(VERSIO).then(c => c.put(req, cp)); } return r; })
      .catch(() => caches.match(req).then(r => r || caches.match('index.html'))));
    return;
  }
  // lletres de Google: primer la còpia
  if (url.host === 'fonts.googleapis.com' || url.host === 'fonts.gstatic.com'){
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { const cp = res.clone(); caches.open(VERSIO).then(c => c.put(req, cp)); return res; })));
  }
});
