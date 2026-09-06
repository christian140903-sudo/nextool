# Bauplan Soul 10.0.0 — Reihenfolge, Regeln, Abnahme

*Stand 2026-09-06. Jeder Schritt ist EIN Agent (strikt nacheinander). Jeder Agent liest zuerst `../research/00-KONTEXT-FUER-AGENTEN.md` (Abschnitte 1–13), dann `../02-design-entscheidungsregister.md` (ab B2), dann seinen Auftrag hier. Schreib-Auflage gilt: Zieldateien zuerst anlegen, nach jedem Teil speichern.*

## Reihenfolge

| Schritt | Auftrag | Ergebnis | Abnahme (mechanisch) |
|---|---|---|---|
| B1 | Synthese | `docs/01-lueckenanalyse.md`, `docs/02-design-entscheidungsregister.md`, `docs/03-baukontext.md` | 3 Dateien; Register ≥ 60 Entscheidungen mit Quelle; Baukontext ≤ 3.500 Wörter |
| B2 | Architektur | `docs/04-architektur.md` (Entwurf) | Dateibaum, 3 Säulen, Datenflüsse, Hook-Plan, SOUL keep/change/drop/new-Tabelle |
| B2k | Kritik der Architektur | `docs/04-architektur-kritik.md` | beginnt mit „3 Gründe warum das scheitern könnte", ≥ 10 Befunde mit Pfad |
| B2r | Architektur-Revision | `docs/04-architektur.md` (final) + Dispositionsliste | jeder Befund accepted/rejected/deferred mit Begründung |
| B3a | Kernel + Bündel (Säule 2, modellgerichtet) | `structure/kernel/*.md`, `structure/bundles/*/SKILL.md`, `structure/self/*.md`, `structure/values/*.md`, `structure/robustness/*.md` | Kernel-Anker ≤ 800 Tokens (gemessen), 6–8 Bündel ≤ 5.000 Tokens, jede Datei mit „Gold-aus-Erz"-Zeile |
| B3b | Faktorkatalog + Ordnung-Doku (AP2/AP4) | `docs/05-faktorkatalog.md`, `structure/factors/*.md`, `docs/06-ausformulierung.md` | ≥ 120 Faktoren mit ID/Definition/Auslöser/Evidenzgrad/Bündelzuordnung |
| B4 | Gedächtnisstruktur (Säule 1, Code) | `soul10/core/memory/*.py`, Schema-Doku `docs/07-gedaechtnis.md`, Tests | `python3 -m pytest soul10/tests -q` grün; Schema-Felder wie Register |
| B5a | Hooks, Routing, Verdrahtung (Code) | `soul10/core/events.py`, `soul10/core/router.py`, `soul10/.claude/settings.json`, Tests | Router-Unit-Test ≥ 60 Prompts, Stufe exakt ≥ 85 %; Hook-Skripte laufen mit Beispiel-stdin |
| B5b | Dirigent, Onboarding, Atlas, Knappheit, Wissensorgan (Inhalt) | `structure/bundles/dirigent/`, `soul10/onboarding/`, `soul10/knowledge/`, `soul10/atlas/` | Dirigenten-Schleife ≤ 900 Tokens; profile.json-Schema; ≥ 8 Dossier-Skelette; Atlas-Tabellen mit Datum |
| B5c | Starter, Doctor, Monitor plattformneutral (Code) | `soul10/core/starter.py`, `doctor.py`, `monitor.py`, `bin/soul` | `python3 soul10/core/doctor.py` läuft auf Linux ohne Mac-Annahmen; Tests grün |
| B6 | Plugin + Adapter + Build | `plugin/` (Claude Code), `adapters/`, `build/build.mjs` | `claude plugin validate --strict plugin/` ok; Build erzeugt alle Zielartefakte; Token-Zählung im Log |
| B7a | Evaluation bauen | `eval/PRAEREGISTRIERUNG.md`, `eval/items/*.jsonl`, `eval/rubrics/`, `eval/judge/`, `eval/run.mjs`, `eval/lint-constitution.mjs` | ≥ 50 Items (≥ 15 held-out), Runner `--plan` läuft, Linting läuft über structure/ |
| B7b | Pilot-Lauf in dieser Umgebung | `eval/results/pilot-1/` | Roh-Artefakte + Modell-ID je Antwort; Bericht mit Einschränkungen |
| B8 | Adversariale Gesamtprüfung | `docs/08-pruefung.md` | Primitivitäts-Check, Widersprüche, Linting-Ergebnis, „Gold-aus-Erz"-Zeilen vollständig |
| B9 | Fix-Pass | geänderte Dateien + Dispositionsliste | jeder B8-Befund disponiert |
| B10 | Doku, README, Publikation, Changelog, Site | `ordnung/README.md`, `docs/09-publikation.md`, `docs/10-changelog-offene-fragen.md`, ggf. `soul10/` Landing | `npm test` im Repo grün; Anleitungen vollständig |
| B11 | SOUL-Branch | Overlay auf SOUL-Checkout, Branch `soul-10` | Diff-Liste; Doctor grün im Overlay |

## Regeln für jeden Bau-Agenten

1. **Gold aus Erz** (Kontextpaket §13): jede Datei, die eine geerbte Idee umsetzt, trägt am Ende eine Zeile `Erz → Gold: <was das Original wollte> → <wie hier besser/anders>`.
2. **Kein toter Mechanismus:** jeder Mechanismus hat einen Aufruf-Pfad (Hook, Skill-Trigger, Skript, Schedule) und einen Log-Eintrag; steht beides nicht, wird er als „nicht gebaut" markiert, nicht als fertig.
3. **Beleg ≠ Urteil:** „läuft durch" ist not-evaluated; die Abnahme in der Tabelle ist mechanisch auszuführen und mit Befehl + Ausgabe im Ergebnis zu zeigen.
4. **Struktur im Denken, nie in der Ausgabe.** Formatzwang gewinnt. Unbekanntes Modell = strong.
5. **Anti-Performance:** keine Namen, die mehr versprechen als der Mechanismus hält; keine Bewusstseinsbehauptungen im Produkttext; Zahlen nur mit Herkunft.
6. **Sprache:** modellgerichtete Dateien (structure/, Skills, Charta, Kernel) auf Englisch; Dokumentation, Onboarding-Texte und Nutzerkommunikation auf Deutsch (Miguel spricht Deutsch mit Chriso, Nutzersprache sonst erkennbar aus dem Profil).
7. **Sparsamkeit:** ≤ ~60 Werkzeugaufrufe; Berichte gezielt lesen (Baukontext zuerst, dann nur die im Auftrag genannten Abschnitte).
8. **Rückgabe:** kompaktes JSON `{"deliverables":[pfade],"acceptance":[{"check":...,"command":...,"result":...}],"open":[...],"erz_zu_gold_lines":N}`.
