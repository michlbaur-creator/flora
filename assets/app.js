/* Gemeinsamer App-Baustein für alle Seiten von Flora Mibaso.
   Bündelt, was früher in jede Seite einzeln kopiert war:
     1. Styling des „Neue Version verfügbar"-Banners
     2. GoatCounter (anonyme, cookiefreie Reichweiten-Statistik)
     3. Service-Worker-Registrierung + Update-Banner
   Einbinden mit:  <script src="…/assets/app.js" defer></script>
*/
(function () {
  // 1) Banner-CSS injizieren – so sieht das Update-Banner auf JEDER Seite gleich aus,
  //    auch auf Seiten ohne das große style.css.
  var css =
    '.fl-update-banner{position:fixed;top:0;left:0;right:0;background:#5d6f7b;color:#fff;' +
    'padding:max(8px,env(safe-area-inset-top)) 14px 8px;display:none;align-items:center;' +
    'justify-content:center;gap:12px;font-size:.92rem;font-family:Georgia,serif;z-index:9999;' +
    'box-shadow:0 2px 8px rgba(0,0,0,.18)}' +
    '.fl-update-banner.aktiv{display:flex;flex-wrap:wrap}' +
    '.fl-update-banner .fl-update-text{flex:1 1 auto;text-align:center;min-width:0}' +
    '.fl-update-banner button{background:#fff;color:#3f4d57;border:none;padding:6px 14px;' +
    'border-radius:7px;font-family:inherit;font-size:inherit;font-weight:600;cursor:pointer;' +
    'white-space:nowrap;box-shadow:0 2px 4px rgba(0,0,0,.15)}' +
    '.fl-update-banner button:hover{background:#f0f4f7}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  // 2) GoatCounter dynamisch laden
  var gc = document.createElement('script');
  gc.async = true;
  gc.src = '//gc.zgo.at/count.js';
  gc.setAttribute('data-goatcounter', 'https://mibaso.goatcounter.com/count');
  document.head.appendChild(gc);

  // 3) Service-Worker registrieren + Update-Banner
  if (!('serviceWorker' in navigator)) return;
  var refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
  function zeigeBanner(reg) {
    var b = document.getElementById('fl-update-banner');
    if (!b) {
      b = document.createElement('div');
      b.id = 'fl-update-banner';
      b.className = 'fl-update-banner';
      b.innerHTML = '<span class="fl-update-text">🌿 Neue Version verfügbar.</span>' +
                    '<button type="button">Jetzt aktualisieren</button>';
      document.body.appendChild(b);
      b.querySelector('button').addEventListener('click', function () {
        if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      });
    }
    b.classList.add('aktiv');
  }
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').then(function (reg) {
      if (reg.waiting && navigator.serviceWorker.controller) zeigeBanner(reg);
      reg.addEventListener('updatefound', function () {
        var neu = reg.installing;
        if (!neu) return;
        neu.addEventListener('statechange', function () {
          if (neu.state === 'installed' && navigator.serviceWorker.controller) zeigeBanner(reg);
        });
      });
      reg.update();
      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') reg.update();
      });
      setInterval(function () { reg.update(); }, 60 * 60 * 1000);
    }).catch(function () {});
  });
})();
