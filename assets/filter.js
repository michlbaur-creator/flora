/* Filter-Logik für das Pflanzenportal "Was blüht hier?".
   Filter: Farbe, Blühzeit (Monat), Lebensraum,
           Familie (deutsch + lateinisch durchsuchbar),
           Blütenaufbau, Volltext-Schnellsuche.
   Läuft vollständig im Browser.
*/
(function () {
  const state = {
    farben: new Set(),
    bereiche: new Set(),
    monate: new Set(),
    familien: new Set(),
    aufbau: new Set(),
    suche: '',
  };

  function toggleSet(set, value) {
    if (set.has(value)) set.delete(value); else set.add(value);
  }

  function matches(art, kartenText) {
    if (state.farben.size > 0) {
      const hit = (art.farben || []).some(f => state.farben.has(f));
      if (!hit) return false;
    }
    if (state.bereiche.size > 0 && !state.bereiche.has(art.habitat)) return false;
    if (state.monate.size > 0) {
      const hit = (art.monate || []).some(m => state.monate.has(m));
      if (!hit) return false;
    }
    if (state.familien.size > 0 && !state.familien.has(art.familie_de)) return false;
    if (state.aufbau.size > 0) {
      const hit = (art.bluetenaufbau || []).some(a => state.aufbau.has(a));
      if (!hit) return false;
    }
    if (state.suche) {
      const hay = kartenText.toLowerCase();
      if (!hay.includes(state.suche)) return false;
    }
    return true;
  }

  function refresh() {
    const cards = document.querySelectorAll('.card');
    let shown = 0;
    cards.forEach(card => {
      const a = JSON.parse(card.dataset.art);
      const text = (card.querySelector('.deutsch')?.textContent || '') + ' ' +
                   (card.querySelector('.wiss')?.textContent || '') + ' ' +
                   (card.querySelector('.familie')?.textContent || '');
      if (matches(a, text)) {
        card.style.display = '';
        shown++;
      } else {
        card.style.display = 'none';
      }
    });
    const z = document.getElementById('zaehler');
    if (z) {
      z.textContent = shown === cards.length
        ? `Alle ${cards.length} Arten angezeigt`
        : `${shown} von ${cards.length} Arten passen zu deiner Auswahl`;
    }
    const leer = document.getElementById('leer');
    if (leer) leer.style.display = shown === 0 ? '' : 'none';
  }

  function bindChips(selector, set, valueAttr, typeAttr) {
    document.querySelectorAll(selector).forEach(el => {
      el.addEventListener('click', () => {
        let v = el.dataset[valueAttr];
        if (typeAttr === 'number') v = parseInt(v, 10);
        toggleSet(set, v);
        el.classList.toggle('aktiv');
        refresh();
      });
    });
  }

  function reset() {
    state.farben.clear();
    state.bereiche.clear();
    state.monate.clear();
    state.familien.clear();
    state.aufbau.clear();
    state.suche = '';
    document.querySelectorAll('.chip.aktiv').forEach(c => c.classList.remove('aktiv'));
    const sIn = document.getElementById('schnellsuche-input');
    if (sIn) sIn.value = '';
    const fIn = document.getElementById('familie-suche');
    if (fIn) { fIn.value = ''; filterFamilieListe(''); }
    refresh();
  }

  function filterFamilieListe(query) {
    const q = (query || '').toLowerCase().trim();
    document.querySelectorAll('.familie-liste .chip').forEach(el => {
      const de = (el.dataset.familie || '').toLowerCase();
      const lat = (el.dataset.familieLat || '').toLowerCase();
      el.style.display = (!q || de.includes(q) || lat.includes(q)) ? '' : 'none';
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindChips('.chip.farbe',    state.farben,   'farbe',    'string');
    bindChips('.chip.bereich',  state.bereiche, 'bereich',  'string');
    bindChips('.chip.monat',    state.monate,   'monat',    'number');
    bindChips('.chip.familie',  state.familien, 'familie',  'string');
    bindChips('.chip.aufbau',   state.aufbau,   'aufbau',   'string');

    const reset_btn = document.getElementById('reset');
    if (reset_btn) reset_btn.addEventListener('click', reset);

    const schnellsuche = document.getElementById('schnellsuche-input');
    if (schnellsuche) {
      schnellsuche.addEventListener('input', e => {
        state.suche = e.target.value.toLowerCase().trim();
        refresh();
      });
    }

    const famSuche = document.getElementById('familie-suche');
    if (famSuche) {
      famSuche.addEventListener('input', e => filterFamilieListe(e.target.value));
    }

    refresh();
  });
})();
