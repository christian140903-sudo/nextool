# Entwurf: Workshops für Teams (`/workshops/`, `/en/workshops/`)

**Status:** Entwurf, nicht ausgeliefert. Die Dateien liegen außerhalb von `src/`,
werden vom Build nie gelesen, sind nirgends verlinkt und stehen in keiner Sitemap.
`npm test` (Schritt `check-drafts`) baut sie trotzdem in einer Temp-Site und lässt
denselben Linter darüber laufen — so bleibt der Entwurf bis zum Go-live regelkonform.

Grundlage: Positionierung §5 (Angebot), §1.2/§1.5 (Türen), §3.1b (Belegreihenfolge
Coaching), §4.3 (Kurzgeschichte), §7.2/§7.3 (Seite), §10 (Ton); Curriculum §0–§2.

## Dateien

| Datei | Inhalt |
| --- | --- |
| `workshops.de.html` | vollständige Seite DE (Seitenquelle wie `src/pages/`) |
| `workshops.en.html` | Kurzfassung EN mit „Workshops in German or English“ |
| `facts-angebot.json` | die vier Preise mit Quelle — bewusst nicht in `src/facts.json`, weil `/facts.json` ausgeliefert wird |

## Tore vor der Veröffentlichung (Positionierung §3.4, §11)

1. **T-Recht-1:** ladungsfähige Anschrift nach § 5 ECG (Coworking mit echter Nutzung,
   kein virtuelles Büro, kein Wohnsitz), UID, Preishinweis nach § 5 Abs. 2 ECG,
   Datenschutz mit Mailweg, WKO-Erstberatung zu den Wortlauten von Stufe 1 und 2.
2. **T-Probe:** Probesession einmal mit einer fachfremden Testperson durchgeführt.
3. Alle OFFEN-Marken im Entwurf erledigt (Preis-/Steuersatz bestätigt, Demo-Repo und
   Video verlinkt oder Zeilen gestrichen).
4. Fachteam-Begleitung (1F), Stundensatz und Stufe 3 bleiben bis **T-Recht-2**
   (freies IT-Gewerbe) „auf Anfrage“ und stehen nicht mit Preis auf der Seite.

## Go-live (Website Schritt 2)

1. `workshops.de.html` → `src/pages/de/workshops.html`, `workshops.en.html` →
   `src/pages/en/workshops.html`; erste Zeile (ENTWURF-Marke) entfernen.
2. Die vier Einträge aus `facts-angebot.json` nach `src/facts.json` übernehmen
   (`check-drafts` meldet einen Fehler, solange sie dort schon vor dem Go-live stehen).
3. `src/site.json`: Navigationspunkt je Sprache vorne einfügen —
   `{ "id": "workshops", "label": "Workshops", "href": "/workshops/", "door": "workshops" }`
   bzw. `"/en/workshops/"`. Durch `door` blenden Tür-Seiten den Punkt der jeweils
   anderen Tür aus (`/arbeitgeber/` zeigt „Workshops“ nicht, `/workshops/` zeigt
   „Anstellung“ nicht) — so gilt §1.5 (keine Links zwischen den Türen) und auf allen
   anderen Seiten trotzdem §7.3 (beide Türen in der Navigation).
   **Chriso bestätigt diese Auflösung des Widerspruchs §1.5 ↔ §7.3.**
4. Startseite DE/EN: Tür-Knopf „Workshops für Teams“ / „Workshops for teams“ vor
   „Anstellung: Nachweise“ (§1.5, §7.4).
5. `src/static/_redirects`: `/services` und `/services/*` auf `/workshops/` statt `/`
   (Kommentar Zeile 7).
6. Impressum auf ECG-Fassung umstellen (Muster unten) und in
   `scripts/lint-config.mjs` `STREET_ALLOWED` um `/impressum/` und `/en/legal-notice/`
   ergänzen — vorher schlägt der Linter bei jeder Straßenanschrift an.
7. `npm run build`, `npm test`, `npm run test:release`, Browser-Abnahme, dann Chrisos Go.

## Impressum ab Schritt 2 (Recht-Admin §6.5, Muster A; Platzhalter in eckigen Klammern)

> [Name in der bestätigten Form] · Schulungen und Workshops zu KI-Coding-Werkzeugen ·
> [geografische Anschrift] · E-Mail: hello@nextool.app · Keine Kammermitgliedschaft;
> Unterrichtstätigkeit gemäß § 2 Abs. 1 Z 12 GewO nicht gewerbepflichtig ·
> Umsatzsteuer: Kleinunternehmer gemäß § 6 Abs. 1 Z 27 UStG [ab Erteilung: UID ATU…] ·
> Offenlegung nach § 25 MedienG: Medieninhaber [Name], Wien; Unternehmensgegenstand:
> Schulungen zu Software-Entwicklungswerkzeugen; grundlegende Richtung: Fachinformation
> zu KI-Coding-Agenten und Softwarequalität.

Mit freiem IT-Gewerbe (T-Recht-2) zusätzlich Muster B (Recht-Admin §6.5).

## Abweichungen vom Wortlaut der Positionierung (offen gelegt)

- Vortragstitel Fachteams: „… Skills, die nach dem nächsten Modell-Update noch
  funktionieren“ → „Claude-Code-Skills nach dem nächsten Modell-Update prüfen“.
  Grund: §5.1/H5 — Namen versprechen Prüfung, nicht Wirkung; Testfälle erkennen Drift,
  sie verhindern sie nicht.
- Dauern stehen als `<time datetime="PT…">`, damit der Zahlen-Linter sie als Zeitangabe
  erkennt; Preise kommen ausschließlich aus `facts-angebot.json`.
- EN „Time saved in percent“ statt „time savings“ (die Finanz-Sperrregel greift auf
  „savings“).
