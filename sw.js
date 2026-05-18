/* Service Worker für Mibaso Natur
   ---------------------------------
   Ermöglicht die Installation als App und einen schlanken Offline-Modus:
   die Startseite und ihre Bausteine werden beim ersten Besuch zwischengespeichert,
   alles andere wird normal aus dem Netz geladen und – wenn möglich – mitgespeichert.

   WICHTIG: Wenn Inhalte geändert werden und die neue Version sofort durchschlagen soll,
   einfach die Cache-Version unten erhöhen (z. B. v1 → v2). Der Browser räumt dann
   die alten Dateien automatisch auf.
*/

const CACHE_NAME = 'mibaso-natur-v2';

// Wichtige Dateien, die für den App-Start gebraucht werden (Hub + Icons + Manifest).
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/icon.svg',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/apple-touch-icon.png',
  './assets/favicon-32.png'
];

// Installation: App-Shell vorab speichern.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Aktivierung: alte Caches aufräumen.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Abruf-Strategie: zuerst Netz, sonst Cache. So sind Änderungen sofort sichtbar,
// und offline funktioniert es trotzdem.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Nur GETs auf die eigene Origin behandeln
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        // Erfolgreiche Antworten in den Cache legen (für Offline-Nutzung).
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match('./index.html')))
  );
});
