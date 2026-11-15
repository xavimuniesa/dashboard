// Taulell de Control · service worker
// L'app (index.html) es demana primer a la xarxa, perquè les actualitzacions arribin de seguida;
// si la xarxa no respon en 4 segons (o no n'hi ha), es fa servir la còpia desada.
// Les lletres es desen la primera vegada. Les dades (el temps, partits, divises, notícies…) sempre van a la xarxa.
const VERSIO = 'taulell-v6';
const APP = ['./', 'index.html', 'manifest.webmanifest', 'icones/icon-192.png', 'icones/icon-512.png', 'icones/apple-touch-icon.png', 'icones/favicon-32.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSIO).then(c => c.addAll(APP)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSIO).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

function desa(req, res){
  if (res && (res.ok || res.type === 'opaque')){ const cp = res.clone(); caches.open(VERSIO).then(c => c.put(req, cp)).catch(() => {}); }
  return res;
}
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin){
    const copia = () => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html'));
    e.respondWith(new Promise(resol => {
      let fet = false;
      const acaba = r => { if (!fet && r){ fet = true; resol(r); } };
      const t = setTimeout(() => copia().then(acaba), 4000);      // xarxa lenta: la còpia desada
      fetch(req).then(r => { clearTimeout(t); desa(req, r); if (r.ok) acaba(r); else copia().then(c => acaba(c || r)); })
        .catch(() => { clearTimeout(t); copia().then(c => acaba(c || Response.error())); });
    }));
    return;
  }
  if (url.host === 'fonts.googleapis.com' || url.host === 'fonts.gstatic.com'){
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => desa(req, res))));
  }
});
