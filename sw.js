/* Service Worker für Flora Mibaso
   --------------------------------
   Zwei Caches:
   • SHELL_CACHE (versioniert): Seiten, Daten, CSS/JS. Wird bei jeder neuen
     Version neu geladen, damit Änderungen sofort durchschlagen.
   • MEDIA_CACHE (dauerhaft): Tafeln & Fotos. Bleibt über App-Updates erhalten,
     denn Bilder ändern sich praktisch nie — so muss das Offline-Paket nicht
     bei jedem Update neu heruntergeladen werden.

   Offline:
   • Beim ersten Besuch wird die Kern-Hülle gespeichert; besuchte Seiten/Bilder
     kommen automatisch dazu.
   • Über den Knopf „Für unterwegs speichern“ (Startseite) lädt die App auf
     Wunsch ALLE Seiten und Bilder vorab — danach funktioniert alles offline.

   WICHTIG: Bei inhaltlichen Änderungen die SHELL-Version unten erhöhen.
   Nur wenn sich Bilder ändern, zusätzlich die MEDIA-Version erhöhen.
*/

const SHELL_CACHE = 'mibaso-shell-v93';
const MEDIA_CACHE = 'mibaso-media-v1';
const MANIFEST_URL = './offline-manifest.json';

// Kern-Hülle: das Nötigste für den Start (klein, schnell).
const CORE = [
  './',
  './index.html',
  './bestimmen.html',
  './bestimmen-gefuehrt.html',
  './sammelpass.html',
  './anleitung.html',
  './pflanzen.json',
  './offline-manifest.json',
  './manifest.webmanifest',
  './assets/style.css',
  './assets/app.js',
  './assets/filter.js',
  './assets/icon.svg',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/apple-touch-icon.png',
  './assets/favicon-32.png'
];

// Bild-Anfrage? (dauerhafter Cache, „cache-first“)
function istMedia(url) {
  return url.pathname.includes('/images/') ||
         /\.(png|jpg|jpeg|svg|webp)$/i.test(url.pathname);
}

// ---- Installation: Kern-Hülle ablegen (einzeln, damit ein Fehler nicht alles kippt)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      Promise.allSettled(CORE.map((u) => cache.add(u)))
    )
  );
});

// ---- Aktivierung: nur fremde/alte Caches löschen, MEDIA_CACHE behalten
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== SHELL_CACHE && k !== MEDIA_CACHE)
            .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ---- Nachrichten von der Seite
self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'SKIP_WAITING') { self.skipWaiting(); return; }
  if (data.type === 'PRECACHE_ALL') { event.waitUntil(precacheAll(event.source)); return; }
  if (data.type === 'OFFLINE_STATUS') { event.waitUntil(berichteStatus(event.source)); return; }
});

// Alles aus dem Manifest laden und melden, wie weit es ist.
async function precacheAll(client) {
  let manifest;
  try {
    manifest = await fetch(MANIFEST_URL, { cache: 'no-cache' }).then((r) => r.json());
  } catch (e) {
    if (client) client.postMessage({ type: 'PRECACHE_FEHLER' });
    return;
  }
  const pages = manifest.pages || [];
  const media = manifest.media || [];
  const total = pages.length + media.length;
  let done = 0;

  async function ladeIn(cacheName, liste) {
    const cache = await caches.open(cacheName);
    // in kleinen Bündeln, um Speicher/Netz zu schonen
    const BUENDEL = 6;
    for (let i = 0; i < liste.length; i += BUENDEL) {
      const teil = liste.slice(i, i + BUENDEL);
      await Promise.allSettled(teil.map(async (u) => {
        try {
          const res = await fetch(u, { cache: 'no-cache' });
          if (res && res.ok) await cache.put(u, res.clone());
        } catch (e) { /* einzelne Ausfälle ignorieren */ }
      }));
      done += teil.length;
      if (client) client.postMessage({ type: 'PRECACHE_FORTSCHRITT', done, total });
    }
  }

  await ladeIn(SHELL_CACHE, pages);
  await ladeIn(MEDIA_CACHE, media);
  if (client) client.postMessage({ type: 'PRECACHE_FERTIG', total });
}

// Wie viele Medien sind schon offline da?
async function berichteStatus(client) {
  let media = [];
  try {
    const m = await fetch(MANIFEST_URL, { cache: 'no-cache' }).then((r) => r.json());
    media = m.media || [];
  } catch (e) { /* ohne Manifest kein Status */ }
  const cache = await caches.open(MEDIA_CACHE);
  let da = 0;
  await Promise.all(media.map(async (u) => {
    if (await cache.match(u)) da++;
  }));
  if (client) client.postMessage({ type: 'OFFLINE_STATUS_ANTWORT', da, gesamt: media.length });
}

// ---- Abruf-Strategie
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // Bilder: zuerst Cache (dauerhaft), sonst Netz und ablegen.
  if (istMedia(url)) {
    event.respondWith(
      caches.open(MEDIA_CACHE).then((cache) =>
        cache.match(req).then((treffer) =>
          treffer || fetch(req).then((res) => {
            if (res && res.status === 200) cache.put(req, res.clone());
            return res;
          }).catch(() => treffer || caches.match(req))
        )
      )
    );
    return;
  }

  // Seiten/Daten: zuerst Netz (frisch), sonst Cache, sonst Startseite.
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match('./index.html')))
  );
});
