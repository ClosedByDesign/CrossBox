# CrossFit-Box-Plattform — klickbarer Prototyp

Vollständiger, web- und mobiloptimierter Prototyp einer CrossFit-Box-Plattform: öffentliche Website, Kursbuchung, Check-in, WODs, Leaderboard, Shop, Verwaltung für Trainer und Boxleitung sowie eine Plattformebene für mehrere Boxen.

**Kein echtes Backend.** Alle Daten sind erzeugte Beispieldaten, alle Aktionen wirken nur lokal im Browser. Technisch ist der Prototyp aber so gebaut, dass er als Grundlage für die echte Entwicklung dienen kann.

## Starten

```bash
npm install
npm run dev          # http://localhost:5173
```

Weitere Skripte:

```bash
npm run build        # statischer Build nach dist/
npm run build:single # eine eigenständige HTML-Datei nach dist-single/
npm run typecheck
```

Der Prototyp nutzt einen Hash-Router — der gebaute Stand läuft auch ohne Server, direkt per Doppelklick auf die HTML-Datei.

## Demo-Steuerung

Unten rechts sitzt auf jedem Screen die **Demo-Leiste**. Darüber lassen sich Rolle wechseln, die Demo-Zeit verschieben (praktisch, um Check-in-Fenster und Stornofristen vorzuführen), Sprache umschalten und die Demo zurücksetzen.

| Person | Rolle | Ausgangslage |
|---|---|---|
| Anna Berger | Mitglied | Flat-Tarif, mehrere Buchungen, ein Wartelistenplatz, Rekorde und Punkte |
| Lea Hoffmann | Mitglied | 8er-Karte — zeigt Kontingentgrenzen |
| Jana Roth | Trainerin | eigene Kurse, offene Punktevergabe |
| Petra Vogel | Box-Admin | Inhaberin, volle Boxverwaltung (trainiert selbst mit) |
| Sven Krüger | Super-Admin | Plattform mit vier Boxen |

Ohne Anmeldung erreichbar: `#/tv` (Beamer-Anzeige mit Timer) und `#/kiosk` (Check-in-Terminal).

## Was der Prototyp zeigt

**Öffentliche Website** — Startseite mit heutigem Kursplan aus echten Daten, Kursangebot, Preise, Trainerteam, Über uns, Probetraining-Anfrage (landet als Interessent in der Verwaltung), Kontakt mit Anfahrt, FAQ, Impressum, Datenschutz, AGB, Cookie-Hinweis.

**Anmeldung** — Login mit Rollen-Schnellwahl, vierstufige Registrierung inklusive Tarifwahl und SEPA-Mandat, Passwort-Flows, vierstufiges Onboarding.

**Mitglied** — Dashboard, Kursplan (Wochenraster am Desktop, Tagesansicht mobil), Kursdetail mit Buchen, Warteliste und Storno, eigene Buchungen, Check-in per QR-Code, WOD-Bibliothek, Ergebniserfassung mit RX/Scaled, persönliche Rekorde mit Verlauf und Prozenttabelle, Leaderboard, Shop mit Warenkorb und Kasse, Vertrag mit Tarifwechsel/Pause/Kündigung, Rechnungen, News, Benachrichtigungen, Profil, Einstellungen, Hilfe.

**Trainer** — Tagesübersicht, eigener Kursplan, Teilnehmerliste mit Anwesenheit und No-Show, Nachrücken von der Warteliste, WOD zuweisen, Punktevergabe, Athletenübersicht (ohne Vertrags- und Zahlungsdaten).

**Box-Admin** — Kennzahlen-Dashboard mit Aufgabenliste, Kursplanung, Kursarten-Editor (steuert den gesamten erzeugten Kursplan), Feiertage und Absagen, Mitgliederliste und Mitgliederakte, Interessenten-Pipeline, Anwesenheit, Verträge, Tarife, Rechnungen, Leaderboard-Verwaltung, Team, News, Anfragen, Shop und Bestellungen, Statistiken mit Auslastungs-Heatmap, Box-Einstellungen inklusive Buchungsregeln.

**Plattform (Super-Admin)** — Dashboard mit MRR, Mandantenliste und -detail mit Feature-Freischaltung und Ansicht als Box-Admin, Abrechnung, Plattform-Tarife, boxübergreifende Statistiken, Support-Postfach, globale Einstellungen.

**In der Box** — Beamer-Anzeige mit WOD, Teilnehmerliste und Timer (AMRAP, EMOM, For Time, Tabata mit Vorstart und Signaltönen), Live-Leaderboard, Tagesplan fürs Eingangsdisplay, Check-in-Terminal.

## Aufbau

```
src/
├── data/          Domänenmodell, Beispieldaten, Generatoren für Termine und Historie
├── domain/        reine Regeln (Buchungsfenster, Stornofrist, Warteliste) – backend-tauglich
├── store/         zustand-Store, Overlay-Persistenz, Aktionen
├── components/    ui/ · layout/ · schedule/ · charts/ · tv/
├── pages/         public/ · auth/ · member/ · coach/ · admin/ · platform/ · tv/
├── i18n/          Deutsch und Englisch
└── lib/           Uhr, Formatierung, Hilfsfunktionen
```

Zwei Entscheidungen prägen das Ganze:

**Termine werden erzeugt, nicht gepflegt.** Aus rund 20 Kursarten entstehen ~57 Termine pro Woche über zwölf Wochen. Die Termin-ID ist deterministisch (`s-<kursart>-<datum>`), deshalb überleben Buchungen, Ergebnisse und Punkte jede Neuberechnung.

**Nur Nutzeraktionen werden gespeichert.** Der Datenbestand wird bei jedem Laden relativ zum heutigen Datum neu erzeugt; im Browser liegt lediglich ein Overlay mit dem, was in der Demo verändert wurde. Dadurch veraltet die Demo nie, und „Demo zurücksetzen" stellt in einem Klick den Ausgangszustand her.

## Demo-Drehbuch für eine Vorführung

1. **Website** — Startseite zeigt die heutigen Kurse live, Probetraining anfragen.
2. **Mitglied (Anna)** — Kursplan öffnen: echte Wochentage, exakte Uhrzeiten, 10–12 Kurse pro Tag, Überlappungen nebeneinander. Einen freien Kurs buchen, einen vollen Kurs auf die Warteliste setzen.
3. **Demo-Zeit vorstellen** — Check-in wird möglich, Kurs läuft.
4. **Trainerin (Jana)** — Kurs öffnen, Anwesenheit abhaken, WOD zuweisen, Punkte vergeben.
5. **Beamer** — `#/tv`, WOD groß anzeigen, Timer starten.
6. **Mitglied** — Punkte sind im Leaderboard sichtbar, Ergebnis nachtragen.
7. **Box-Admin (Petra)** — Dashboard, Auslastungs-Heatmap, Kurs absagen (Mitglieder werden benachrichtigt), Buchungsregeln ändern und sofortige Wirkung im Kursplan zeigen.
8. **Plattform (Sven)** — vier Boxen, Abrechnung, „Als Box-Admin ansehen".

## Grenzen des Prototyps

Keine echte Anmeldung, keine Zahlungsabwicklung, kein Versand von E-Mails oder Push-Nachrichten. Inhalte wie News-Texte und WOD-Beschreibungen sind deutsch; die Sprachumschaltung deckt die Bedienoberfläche ab, nicht die redaktionellen Inhalte — genau wie später im echten Betrieb, wo diese Inhalte von der Box selbst stammen.
