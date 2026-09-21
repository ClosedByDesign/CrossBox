# CrossFit Box — Klick-Prototyp (Mockup)

Ein rein statischer, klickbarer Mockup-Prototyp mit Fake-Daten — **keine echte Funktionalität, kein Backend, kein Speichern**. Ziel ist es, Screens, Flows und das Rollenmodell für eine CrossFit-App gemeinsam zu validieren, bevor das eigentliche Projekt aufgesetzt wird.

## Öffnen

Keine Installation, kein Build, kein Server nötig — einfach `index.html` direkt im Browser öffnen (Doppelklick oder per `file://`).

## Struktur

- `index.html` — Rollenauswahl / Login-Dummy, Einstiegspunkt
- `shared/` — gemeinsames CSS, Fake-Daten (`mock-data.js`) und JS-Helfer (`render-helpers.js`)
- `super-admin/` — Mandantenverwaltung (Boxen anlegen/bearbeiten)
- `box-admin/` — Userverwaltung, Kursverwaltung, Übungen, Punktevergabe
- `member/` — Kursplan, Kursbuchung, Profil, Shop, Leaderboard
- `tv/` — Beamer-Ansicht zur Projektion der Kursübungen (kein Login)

## Funktionsweise

Es gibt keine echte Logik: Formulare navigieren beim Absenden einfach zu einer Erfolgsseite mit einer Bestätigungsmeldung, ohne etwas zu speichern. Zustände wie "Kurs ausgebucht" oder "Punkte bereits vergeben" sind feste Beispieldaten in `shared/js/mock-data.js`, nicht berechnete Logik.
