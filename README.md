# Flora Mibaso

**Die digitale Naturwerkstatt von Michael Baur — heimische Flora zum Entdecken, Bestimmen und Verstehen.**

Eine installierbare Web-App (PWA) zu Pflanzen aus Wald, Wiese und Region: Lehrtafeln, Fotos und Steckbriefe zu 146 Arten, ein Bestimmungstool, interaktive Lernpfade, Quizze und Broschüren.

👉 **Live:** https://flora.mibaso.de

## Aufbau

- `index.html` — Startseite (Themen-Kacheln) mit dem saisonalen Modul „Was blüht gerade?"
- `pflanzen.json` — **zentrale Datendatei** aller Arten (Name dt./lat., Familie, Farben, Lebensraum, Blühmonate, Blühzeit, Blütenaufbau, `wichtig`-Flag). Speist „Was blüht gerade?" und das Bestimmungstool.
- `bestimmen.html` + `assets/filter.js` — Bestimmungstool; die Pflanzenkarten werden zur Laufzeit aus `pflanzen.json` erzeugt und im Browser gefiltert (Farbe, Blühzeit, Lebensraum, Familie, Blütenaufbau, Volltext).
- `bestimmen-gefuehrt.html` — geführte Bestimmung in Frageschritten
- `arten/` — Detailseite je Art (Tafel, Fotos, Steckbrief, Merksätze)
- `interaktiv/` — Lernpfade & Animationen (Kreislauf, Pflanzen & Energie, Naturphänomene)
- `quiz/` — Pflanzen-, Familien-, Naturquiz und der große Flora-Test
- `apps/` — Empfehlungen externer Bestimmungs-Apps
- `broschueren/` — PDF-Broschüren zum Download
- `images/tafeln/` — Lehrtafeln · `images/fotos/` — Fotografien
- `assets/style.css` — Stylesheet (Hauptfarbe: Dunkelgrün `#2F4F3E`, warme Beige-/Brauntöne)
- `sw.js` — Service-Worker (Offline-Fähigkeit; Cache-Version bei jeder Änderung erhöhen)

## Eine neue Art ergänzen

1. Daten in `pflanzen.json` eintragen (ein Objekt pro Art).
2. Tafel als `images/tafeln/<slug>.jpg`, Fotos als `images/fotos/<slug>-1.jpg` usw. ablegen.
3. Detailseite `arten/<slug>.html` anlegen (vorhandene Seite als Vorlage).

Konvention für `slug`: Kleinschreibung mit Bindestrich (`galanthus-nivalis`).

## Mitmachen

Hinweise, Korrekturen oder eigene Beobachtungen sind willkommen: **mibaur@me.com**

## Lizenz

Fotografien und Tafeln: **CC BY-NC** — private Verwendung gerne, gewerbliche Nutzung nur nach Rückfrage.

© 2026 Michael Baur · Flora Mibaso
