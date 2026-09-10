# B4 — Gedächtnisstruktur (Säule 1): epistemisches Hauptbuch in Code

Lies Kontextpaket §3, §5, §12; Baukontext; Register Gruppe C und D; Architektur §5; R05 vollständig Teil A + Ergebnis (a)–(c); R06 (Selbstmodell aus Logs, Kalibrierung C2); R11 (Vertrauensmodell); SOULs `core/memory.py` als Erz (gezielt lesen: `/home/user/soul/core/memory.py`).

Baue in `ordnung/soul10/core/memory/` (Python 3.11, nur Standardbibliothek + sqlite3, plattformneutral, keine Mac-Annahmen):
- `ledger.py`: SQLite+FTS5-Schema mit Tabellen für Einträge (id, created, updated, type ∈ {fakt, entscheidung, fehler, muster, vorhaben, praeferenz, selbst, rejected, vorhersage, rueckbau, beziehung, projekt}, status ∈ {candidate, active, disputed, superseded, archived, retracted}, source_type ∈ {user, self, mining, import, tool, web}, source_ref, trust (0–1, Startwerte user 0,8 / document 0,7 / self 0,4 / web 0,3), volatility ∈ {ziel, randbedingung, methode, ergebnis}, valid_from/valid_until, expiry_condition, supersedes, mission, level (Ebene), scope ∈ {public, private}, tags, body ≤ 16 KB), Ereigniskette append-only (hash-verkettet), Supersession statt Mutation, Widerspruch → beide disputed, Secret-Guard vor Insert, Injection-Quarantäne (Inhalt aus tool/web nur candidate).
- `recall.py`: FTS + Typ/Zeit/Tag-Filter, Briefing-Generator (≤ 60 Zeilen: Vorhaben, aktive Kernfakten, offene Vorhersagen, letzte Fehler, Selbstmodell-Kurzform), Ebenen-Sicht (was ein Subagent bekommt).
- `predict.py`: Vorhersagen mit Konfidenz + Auflösungsdatum, Auflösung, Brier/ECE pro Domäne/Modell, Rückfluss als Routing-Signal.
- `retract.py`: Rückbau-Konto (was getan, was ersetzt, wie zurück; RETRACTED sperrt Weitertragen).
- `consolidate.py`: „Schlaf": Episoden → Muster → Regeln (Kandidaten), Verfall/Archiv, Nutzungsstatistik (gelesen/gefüttert), Veraltungsrate; als Schedule-Job aufrufbar.
- `selfmodel.py`: rendert IDENTITY/VALUES aus Einträgen vom Typ selbst (nur mit ≥ 2 Episoden-Belegen aus ≥ 2 Sitzungen), Hypothesen-über-mich, öffentliche vs. private Sicht.
- `cli.py`: `soul memory remember|recall|predict|resolve|retract|consolidate|self|stats|export-public`.
- Tests `ordnung/soul10/tests/test_memory_*.py` (≥ 25 Tests: Guards, Supersession, disputed, Verfall, Briefing-Länge, Rückbau-Kontamination, Kalibrierung, public/private).
- Doku `docs/07-gedaechtnis.md` (deutsch): Schema, Lebenszyklus, Protokolle je Hook, Vergleichstabelle gegen Letta/Mem0/Zep/Auto-Memory („was Soul 10 besser macht"), Messplan, Erz→Gold je Mechanismus.
Abnahme: `cd /home/user/nextool/ordnung/soul10 && python3 -m pytest tests -q` grün (Ausgabe zeigen); Briefing ≤ 60 Zeilen mit Beispieldaten; Import eines SOUL-Stores (`core/memory.py`-Format) als candidate funktioniert.
