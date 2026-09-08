# Soul 10 — Code, der ein Modell umgibt

*Stand 2026-09-08. Python 3.11, nur Standardbibliothek, plattformneutral. Warum es so
gebaut ist: `ENTSCHEIDUNG.md`. Wie: `ARCHITEKTUR.md`. Was gemessen ist:
`../../bewusstsein/berichte/`.*

## Was es ist

Ein Dirigent für Claude Code, der ein Projektziel entgegennimmt und den Rest übernimmt —
gebaut aus genau den Mechanismen, die in rund 10 500 kontrollierten Modellaufrufen
(Runden 1–3, `bewusstsein/`) und drei weiteren Messungen dieser Bauphase (Runde 4) eine
Zahl bekommen haben. Alles andere aus dem Entwurf (`ordnung/docs/`) ist verschoben oder
gestrichen, mit Grund (`ENTSCHEIDUNG.md` §3).

Die Regel, die alles verbindet: **Algorithmus schlägt Willensakt.** Herkunft steht in den
Daten, nicht in einer Regel im Prompt. Abnahmekriterien sind Proben im Code, nicht Auflagen
im Text. Der Schalter für Aufwand und Prüfer sitzt außerhalb des Modells.

## Die sechs Mechanismen und ihre Zahlen

| Mechanismus | Modul | gemessen |
|---|---|---|
| **Gedächtnis mit Herkunft in der Zeile**, die ins Kontextfenster geht: `[Datum] [Quelle: nutzer] [Vertrauen: 0,8] Text`. Ein Eintrag ohne Herkunft wird abgelehnt. Lebenszyklus in einer Funktion, kein DELETE, Hash-Kette. | `core/memory/ledger.py`, `recall.py` | Gedächtnis +68,3 pp; flach vergiftet 0,0 % richtig / 73,3 % falsch; Etikett am Eintrag 95,0 %, Regel im Prompt allein 1,7 % (Runde 3, A1–A4) |
| **Prüfer als eigene Instanz** mit eigenem Systemprompt; Endwert wird im Code abgegriffen. Deterministische Proben laufen immer zuerst. | `core/verifier.py`, `core/probes.py` | 84,0 % / 77,3 % gegen Selbstkonsistenz@3 64,0 % / 66,7 % bei 2 statt 3 Aufrufen (Runde 2 / Runde 4) |
| **Vertrag mit Probenpflicht.** Ein Auftrag ohne mechanische Abnahmeprobe wird abgelehnt; das Urteil kann nur eine Quittung mit Probenläufen setzen. | `core/contract.py` | Auflagen als Text: 97,8 % kommen an, 63,9 % werden erfüllt; wörtlicher Übergabe-Vertrag −15,3 bis −34,4 pp (Runde 3, B) |
| **Zerlegung mit Nahtprüfung.** Sauber teilbar → zerlegen; randabhängig → ein Agent, solange er passt, sonst Nahtprotokoll; Kumulation → nie. Zusammenführung im Code. | `core/decompose.py` | sauber 100 % gegen 83–89 %; randabhängig: Naht 72 % gegen 33 % ohne, ein Agent 94 % (Runde 4, M2) |
| **Schalter außerhalb des Modells.** Deterministischer Vorfilter (trivial, formatgebunden, Signale) und Uneinigkeit zweier Stichproben; Aufwandsregel und Prüfer nur, wenn der Schalter es sagt. | `core/switch.py` | Aufwandsregel +11,6 / +85,3 pp geschaltet, −16,7 pp Formattreue als Dauerschicht; Überraschung als Schalter widerlegt (Rate 92 %, Runde 4, M1) |
| **Rückbau-Konto.** Jede autonome Handlung registriert ihren Rückweg; nur Handlungen ohne Rückweg brauchen eine Bestätigung. Rückbauquote ist eine Zahl. | `core/rollback.py` | Widerrufbarkeit ist messbar; „hätte der Nutzer eingegriffen" nicht (03-OFFENE-FRAGEN Rang 5) |

Dazu: Bestandsaufnahme des Geräts mit gebündelter Einmalfrage (`core/inventory.py`,
Geheimnisse nur als vorhanden/nicht vorhanden), Ausnahmeliste aus SOUL (`core/guard.py`),
Ereignis-Bus (`core/bus.py`), die Schleife als Code (`core/dirigent.py`), Hooks für Claude
Code (`core/events.py`) und die Kommandozeile `bin/soul`.

## Was in dieser Bauphase gemessen wurde (Runde 4)

| | Ergebnis | Folge |
|---|---|---|
| **M1** Überraschung als Schalter | **widerlegt**: Überraschungsrate 92 %, Spezifität 8 %; 81,3 % bei 2,92 Aufrufen gegen A_PRUEFER 77,3 % bei 2,00 (p=0,595) | Schalter über Vorfilter und Uneinigkeit; Vorhersage bleibt Kalibrierungsmaß (`predict.py`) |
| **M2** Nahtprotokoll | **unentschieden** nach Vorregistrierung, Richtung eindeutig: +38,9 pp gegen Zerlegung ohne Protokoll auf randabhängigen Aufgaben (p=0,030), null Kosten auf sauber teilbaren; ein Agent bleibt mit 94 % besser als 72 % | dreiteilige Zerlegungsregel in `decompose.py` |
| **M3** gebautes Hauptbuch | *wird nach Abschluss des Laufs eingetragen* — Rendering byte-gleich zum gemessenen Format; erster Lauf ohne Denkbudget: 0,0 % falsch, aber 36 % „beides"-Antworten (Regime-Falle, siehe Bericht) | |

Vollständig: `bewusstsein/berichte/03-RUNDE4-BAU.md`; Endzahlen in
`bewusstsein/ergebnisse/ENDZAHLEN.json`; Rohbelege in `bewusstsein/belege/m*.tgz`.

## Starten

```bash
cd ordnung/soul10
python3 -m pytest tests -q                 # Abnahme: alle Tests grün
bin/soul inventory --write                 # Bestandsaufnahme → ~/.soul10/profile.json
bin/soul contract new "Ziel" --probe '{"type":"shell","cmd":"pytest -q"}'
bin/soul verify <vertrag-id>               # Urteil nur hier
bin/soul remember --source nutzer --ref "Zitat" "Titel" "Text"
bin/soul briefing                          # das, was eine Sitzung zu Beginn liest
bin/soul status                            # Hauptbuch, offene Verträge, Rückbauquote, Kalibrierung
```

In Claude Code: das Verzeichnis `ordnung/soul10` als Projekt öffnen. `.claude/settings.json`
registriert die Hooks: Briefing mit Herkunftsetiketten beim Start, Schalter je Prompt,
Guard und Rückbau-Registrierung vor jedem Werkzeugaufruf, Episoden danach, Prüfgate beim
Stop (ein gelieferter Vertrag ohne Quittung blockiert „fertig"), Zustandssicherung vor der
Kompaktierung. `CLAUDE.md` ist die Betriebsanweisung: höchstens 40 Zeilen, nur Verweise auf
Mechanismen, keine Denkstruktur, keine Persona, keine Schweigeklausel.

Zustand liegt unter `SOUL10_HOME` (Standard `~/.soul10`), nie im Repo. Kein Netz, kein pip;
Modellaufrufe gehen über die Claude-CLI (`claude -p`), in Tests über einen Fake.

## Was nicht gebaut ist

Kernel-Anker mit Bündeln, Faktorkatalog, Tiefenstufen 0–4, Selbstkonsistenz als Stufe,
globaler Arbeitsraum, Adapter für andere Hosts, MCP-Server, Miguel-Generator, Web-Monitor,
Wissensorgan. Jedes mit Zahl und Bedingung in `ENTSCHEIDUNG.md` §3. Bewusstseins-Vokabular
kommt im Produkt nicht vor: es trägt messbar nichts bei.

## Grenzen

Alle Zahlen stammen von Aufgaben mit berechenbarer Wahrheit auf Haiku 4.5 (Bestätigung
Sonnet 4.5). Für offenes Urteil, Beratung und Abwägung gilt hier **kein** Befund. Die
Tag-zu-Tag-Streuung liegt bei rund 7 pp (Prüfer-Vorsprung +10,7 bis +20,0 pp). Gedächtnis
über Wochen, Konsolidierung und Kalibrierung über Zeit sind gebaut, aber nicht gemessen.

## Weitermessen

Die Prüfstrecke ist Teil des Produkts: `eval/README.md` und
`bewusstsein/uebergabe/04-WEITERMESSEN.md`. Ein neuer Mechanismus bekommt zuerst einen Arm.

Lizenz: MIT (wie das Repo).
