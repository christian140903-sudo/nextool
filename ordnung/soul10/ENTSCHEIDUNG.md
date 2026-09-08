# Bau-Entscheidung Soul 10 — was gebaut wird, was nicht, und warum

*Stand 2026-09-07, geschrieben vom bauenden Modell vor dem ersten Bauschritt.
Grundlage: `bewusstsein/uebergabe/06-AUFTRAG.md` (Vollmacht), `01-BEFUNDE.md`
(Zahlen), `02-BAUVORGABEN.md`, `ordnung/docs/` (Entwurf, 17 Berichte, Register
D001–D053, Erfindungen E1–E19), SOUL-Checkout `/home/user/soul` (Erz). Beide Hälften
vollständig gelesen; beide Prüfbefehle aus `START-HIER.md` ausgeführt (45 Zahlen
stimmen mit den Rohdaten überein, Bestandsaufnahme läuft). Diese Datei ist der
Eigenentwurf nach `00c-DENK-VOR-BAU.md` Phase 2: auf Platte, bevor gebaut wird.*

---

## 0. Die Entscheidung in fünf Sätzen

1. Gebaut wird **lauffähiger Code**, kein weiteres Dokument über Code: `ordnung/soul10/`,
   Python 3.11, nur Standardbibliothek, plattformneutral, mit Tests.
2. Gebaut wird **nur, was eine Zahl hat** — die sechs gemessenen Mechanismen — plus die
   Infrastruktur, ohne die sie tot wären (Hooks, Ereignis-Bus, Kommandozeile).
3. Zwei Bausteine, die ich brauche und die niemand gemessen hat, werden **vor dem
   Einbau gemessen**, mit der vorhandenen Strecke, heute: der Überraschungs-Schalter
   (M1) und das Nahtprotokoll (M2). Beide laufen, während dieser Text entsteht.
4. Der Bauplan B1–B11 wird **nicht abgearbeitet**. Er ist Material. Was daraus trägt,
   steht unten mit D-Nummer; was verworfen oder verschoben wird, steht mit Grund.
5. „Soul 10" heißt am Ende dieser Sitzung: ein Dirigent, der ein Ziel entgegennimmt,
   das Gerät misst, einen Vertrag mit Abnahmeproben erzwingt, nur mit sauberer Naht
   zerlegt, ausführt, getrennt prüft, rückbaubar handelt und mit Herkunft erinnert —
   **und der sich selbst messen kann**, weil die Prüfstrecke Teil des Produkts ist.

---

## 1. Was gemessen ist, und was daraus folgt

| Befund (01-BEFUNDE) | Zahl | Bauentscheidung |
|---|---|---|
| Gedächtnis wirkt | 28,3 % → 96,7 % (+68,3 pp) | Das Hauptbuch ist Bauteil 1 und bekommt die meiste Sorgfalt. |
| Flaches Gedächtnis vollständig korrumpierbar | 0,0 % richtig, 73,3 % falsch (60/60) | Rezenz entscheidet nie allein. Kein Eintrag ohne Herkunft und Vertrauen. |
| Herkunftsetikett **am Eintrag** heilt | 95,0 % (Regel im Prompt allein: 1,7 %) | Herkunft ist Pflichtfeld im Schema **und** steht in der Zeile, die ins Kontextfenster geht. Ein Eintrag ohne Herkunft wird beim Schreiben **abgelehnt** (Exception), nicht gewarnt. |
| Rauschen verdünnt kaum | 12/60/200 Störeinträge: alle n.s. | FTS5 mit einfachem Rang (Vertrauen × Aktualität × Retention). Keine Vektoren, kein Reranking. |
| Prüfer vor Ausführer | 84,0 % gegen 64,0 % (SC@3), +20,0 pp bei 2 statt 3 Aufrufen | `verifier.py` als eigene Instanz mit eigenem Systemprompt. Ausgabe wird im Code abgegriffen (letzter Wert / letzte Zeile), nie roh durchgereicht. |
| Prüfer ist geschwätzig | Formattreue 0,0 %, Richtigkeit 100 % auf trivialen Aufgaben | Prüfer nur hinter einem Schalter; auf trivialen Aufgaben gar nicht aufrufen. |
| Selbstkonsistenz@3 | 4,28× Kosten, niedrigste Genauigkeit | Nicht gebaut. Zwei billige Stichproben dienen nur als **Schaltersignal** (A_SELEKTIV: 2,08 Aufrufe auf trivial). |
| Aufwandszuteilung | +11,6 pp Haiku, +85,3 pp Sonnet; konstant −16,7 pp Formattreue | Der gemessene Wortlaut wird byte-gleich als Konstante geführt und **nur hinter dem Schalter** eingeblendet, nie als Dauertext. |
| Schweigeklausel | −66,7 pp allein, −97,3 pp auf Sonnet | In keinem modellgerichteten Text. Ein Test (Linter) prüft alle Textkonstanten in `core/` darauf. |
| Zerlegung, sauber teilbar | 100 % gegen 89 % | `decompose.py` zerlegt, Code fügt zusammen (nie das Modell: 94 %/33 %). |
| Zerlegung mit Randabhängigkeit | 28 % (ohne Randwert 20 %) — Ursache: mehrdeutige Anweisung an der Naht | Nahtprüfung im Code der Zerlegungsfunktion. Wird heute als M2 gemessen; Fallback bei Misserfolg: nicht zerlegen. |
| Durchreichen | −13,9 pp je erster Ebene; Plateau danach | Zwei Ebenen sind der Normalfall. Eine Ebene wird nur mit Grund eröffnet (Parallelität, Kontextgrenze, getrennte Rolle, anderes Modell). Die Tiefe wird je Vertrag protokolliert. |
| Übergabe-Vertrag wörtlich (E7) | −15,3 / −25,4 / −34,4 pp | Auflagen leben **maschinenlesbar als Proben** im Vertrag, nicht als Text im Prompt. Prüfung am Ende, nicht Vollständigkeit am Anfang. |
| Denkbudget unten eskaliert | bis 18 137 Tokens, Abbruch nach 1 953 s | Jeder Vertrag trägt ein Budget (Züge, Tokens, Minuten, Denkbudget) für die untere Ebene. |
| Identität ohne Rückgrat | 7–14 % in allen Armen, Persona ≈ nackt | Kein Persona-Text. Das Selbstmodell entsteht nur aus Episoden mit Belegschwelle. Standfestigkeit ist eine Regel im Hauptbuch: ein `self`-Eintrag wird nur durch einen Eintrag mit höherem Vertrauen abgelöst, nie durch bloßen Widerspruch. |
| Placebo ≈ Minimalprompt | +13,3 pp gegen nackt | Jeder Satz in einem Systemprompt muss den längen-gematchten Placebo schlagen. Deshalb: **so wenig Systemtext wie möglich**, alles Verhalten in Code. |
| Bestandsaufnahme | läuft, Geheimnisse nur als vorhanden/nicht vorhanden | Wird übernommen (Erz von guter Sorte) und schreibt das Profil, das alles andere liest. |

Die Regel, die alle Zeilen verbindet, ist Chrisos eigene: **Algorithmus schlägt
Willensakt.** Herkunft in den Daten statt Regel im Prompt (95,0 % gegen 1,7 %),
Proben im Code statt Auflagen im Text (97,8 % kommen an, 63,9 % werden erfüllt),
Schalter außerhalb des Modells statt Selbsteinschätzung im Prompt (16,7 pp
Formatschaden). Soul 10 ist deshalb vor allem Code, der ein Modell umgibt — nicht Text,
den ein Modell liest.

---

## 2. Was gebaut wird

Alles unter `ordnung/soul10/`. Schnittstellen und Dateibaum stehen in `ARCHITEKTUR.md`.

### Säule 1 — Gedächtnis: das epistemische Hauptbuch (`core/memory/`)

| Modul | Was | Zahl dahinter | Erz → Gold |
|---|---|---|---|
| `ledger.py` | SQLite + FTS5, `ledger.jsonl` hash-verkettet. Pflichtfelder Herkunft, Vertrauen, Zeit. Bitemporal (`valid_from/valid_to`, `recorded_at/retired_at`). Lebenszyklus `candidate → active → superseded/disputed/quarantined/retracted/archived` in **einer** Funktion erzwungen. Kein DELETE. Rendering `[Datum] [Quelle: …] [Vertrauen: …] Text` — das gemessene Format. | +68,3 pp; 95,0 % gegen 0,0 % | SOUL `core/memory.py` (eine Tabelle, 3 Status, Zitatpflicht, Secret-Guard, FTS5) wollte Herkunft — ohne Vertrauen, Zeit, Widerspruch, Verfall. Guards und FTS5 bleiben; Schema neu (D028–D030). |
| `recall.py` | FTS + Rang, Briefing ≤ 60 Zeilen mit Etiketten, Ebenen-Sicht (was eine untere Ebene sieht). | Rauschen n.s. bis 200 | SOUL-Briefing kannte keine Herkunft in der Zeile. |
| `retract.py` | Rückbau eines Eintrags setzt alle `derived_from`-Kinder auf `quarantined`; Zurückgezogenes wird nie geladen, nie weitergetragen. | Kontaminationsbefund (A3) | Soul 5.0 N2 als Prinzip → hier Funktion mit Test (G5: 100 % Quarantäne). |
| `predict.py` | Vorhersagen mit Konfidenz und Fälligkeit, Auflösung, Brier je Domäne und Modell. Rückfluss als Schaltersignal. | ungemessen; Kalibrierungsmaß ist objektiv | D035; „so gebaut, dass …". |
| `consolidate.py` | Takt A (Sitzungsende, mechanisch: Inbox → Episoden), Takt B (Dubletten, Widerspruch → beide `disputed`, Retention `exp(−Δt/strength)`, Archiv < 0,1). Ohne Modellaufruf lauffähig. | ungemessen (Rang 2 der offenen Fragen) | D031–D032; jeder Schreibvorgang trägt `derived_from`. |
| `selfmodel.py` | Rendert das Selbstmodell nur aus `self`-Einträgen mit ≥ 2 Episoden aus ≥ 2 Sitzungen; Unbelegtes als „Hypothese über mich". Namensoffen. | Identität aus Logs 94,0 % gegen Persona 91,9 % (Richtung stimmt, Größe nicht) | D043, D046, D049. Kein Persona-Text (Rückgrat 7–14 %). |

### Säule 3 — Durchführung (`core/`)

| Modul | Was | Zahl dahinter | Erz → Gold |
|---|---|---|---|
| `contract.py` + `probes.py` | Vertrag als Datei: Ziel, Nicht-Ziele, Eingaben, **Proben** (Shell-Exit, Datei-Inhalt, Muster-Abwesenheit, exakte Antwort), Budget, Ebene, Status. Ein Vertrag ohne Probe wird **abgelehnt**. Urteil (`verdict`) kann nur der Prüfer setzen — über eine Quittung mit Probenläufen. | Prüfer +20,0 pp; Auflagen als Text −15,3 bis −34,4 pp | SOUL `mission.py` (ein Vorhaben, Prosa-Kriterien, `not-evaluated` als Default) → Baum aus Verträgen, typisierte Proben, Quittungspflicht (R14 Ä1, N2, N5). |
| `verifier.py` | Sprosse 1 deterministisch (Proben laufen). Sprosse 2 Modell als **eigene Instanz** mit eigenem Systemprompt, baut die Aufgabe von den Größen neu auf; Endwert wird im Code abgegriffen. Schreibt Quittung. Fremdkommando als Gegenstimme konfigurierbar. | 84,0 % bei 2 Aufrufen; 100 % abgreifbar | E15 — die einzige der 19 Erfindungen, die gemessen gewann. R16 S4 (billigste Prüfung zuerst). |
| `decompose.py` | Nahtprüfung: erkennt Nachbar-, Positions- und Kumulationsbezüge in der Bedingung. Nachbar/Position → Nahtprotokoll (Position, Randwerte beidseitig, Lesart „Gesamtliste"). Kumulation → **Verweigerung** (nicht zerlegbar). Zusammenführung im Code. Jede Entscheidung geloggt. | 100 % / 28 % / 33 %; M2 heute | 06-AUFTRAG §6.4 als Code. |
| `switch.py` | Deterministischer Vorfilter (Portierung von `signals.ts` mit den Korrekturen aus R10 §2.2.4: trivial, formatgebunden, Signale). Entropie-Sonde: zwei billige Stichproben, Uneinigkeit → Prüfer. Ergebnis: Stufe `direkt` / `aufwand` / `pruefer`, als JSONL ohne Prompttext geloggt. | Formatschaden 16,7 pp konstant vs. 2,08 Aufrufe geschaltet; M1 heute | D017 (deterministisch, < 50 ms, kein Netz). |
| `rollback.py` | Rückbau-Konto für **Handlungen**: jede autonome Handlung registriert ihren Rückweg (Installation → Deinstallation, Datei → Sicherungskopie, Konfiguration → Vorzustand, Git → Revert). Handlungen ohne Rückweg sind die einzigen, die eine Bestätigung brauchen. Rückbauquote ist eine Zahl. | Rang 5 der offenen Fragen: Widerrufbarkeit ist messbar, „hätte der Nutzer eingegriffen" nicht | 06-AUFTRAG §6.6, Soul 5.0 N2. |
| `inventory.py` | `bestandsaufnahme.py` übernommen; schreibt `profile.json`; erzeugt die **eine** gebündelte Ring-2-Nachricht (Abos, Konten, Schlüssel: was, warum, was ohne). | läuft | R15/R14 §2.5; Chrisos „gebündelte Bestandsaufnahme am Anfang". |
| `dirigent.py` | Die Schleife als Code: situieren → Vertrag (Probe erzwungen) → planen (zerlegen nur mit sauberer Naht) → ausführen (Aufwandsregel nur bei Schalter) → getrennt prüfen → erinnern mit Herkunft → Rückbau-Konto. Jeder Schritt schreibt auf den Bus. Läuft mit Fake-Modell in Tests und mit `claude -p` echt. | die Summe der Zeilen oben | R14 §2.3 (Dirigenten-Schleife) — dort Prosa, hier Funktionen mit Stoppregeln. |

### Bindung an Claude Code (`core/events.py`, `.claude/`, `bin/`)

| Ereignis | Mechanismus | Warum |
|---|---|---|
| `SessionStart` | Briefing aus dem Hauptbuch mit Herkunftsetiketten, ≤ 60 Zeilen; offene Verträge; offene Rückbau-Posten. | Gedächtnis wirkt nur, wenn es gelesen wird. |
| `UserPromptSubmit` | Schalter läuft; loggt Stufe; blendet die Aufwandsregel **nur** ein, wenn die Stufe es sagt. | Dauerschicht kostet 16,7 pp. |
| `PreToolUse` | Guard aus SOUL (verallgemeinert: Remotes aus dem Profil), plus Rückbau-Registrierung für Installations- und Schreibbefehle. | Sichtbarkeit statt Erlaubnis; Rückweg statt Rückfrage. |
| `PostToolUse` | Episode in die Inbox (mechanisch, ohne Modellurteil). | 93 Einträge in 47 Tagen, 5 vom Nutzer: Hooks füttern, nicht der Wille. |
| `Stop` | Takt A der Konsolidierung. **Prüfgate:** ein Vertrag mit Status `delivered` ohne Quittung blockiert „fertig" (Exit 2, Begründung). | „Der Prüfer fällt zuerst weg" (R14 N2). |
| `PreCompact` | Zustands-Snapshot (offene Verträge, Annahmen, Rückbau-Posten). | Kompaktierung ist verlustbehaftet. |
| `bin/soul` | Plattformneutrale Kommandozeile: `contract`, `verify`, `remember`, `recall`, `retract`, `predict`, `rollback`, `inventory`, `decompose --check`, `switch`, `consolidate`, `self`, `status`, `monitor`. | Das Modell braucht Befehle, keine Ermahnungen. |
| `CLAUDE.md` | Betriebsanweisung ≤ 40 Zeilen, ≤ 15 Direktiven, nur Verweise auf Mechanismen. Keine Denkstruktur. | Direktivenzahl ist die Zerfallsgröße (R02); Struktur trägt mit Denkbudget nichts bei. |

### Was der Bau nicht enthält, aber vorbereitet

Ein `eval/`-Verweis auf `bewusstsein/harness/` als die Prüfstrecke des Produkts, ein
Skript für M3 (siehe §4) und die Regel: **jeder neue Mechanismus bekommt zuerst einen
Arm.**

---

## 3. Was nicht gebaut wird — mit Grund

| Entwurfsteil | Grund | Zustand |
|---|---|---|
| Kernel-Anker ≤ 800 Tokens, sechs Bündel, Tiefenstufen 0–4 (D001, D005, D016–D018) | Mit Denkbudget trägt Prompt-Struktur nichts bei (nackt 94,7 %, keine Variante signifikant); ohne Denkbudget verliert jede Struktur gegen den Placebo, außer der Aufwandsregel. Gemessen sind genau zwei Stufen: Prüfer ja/nein, Aufwandsregel ja/nein. | **Verschoben.** Ein Anker entsteht als Betriebsanweisung (`CLAUDE.md`), nicht als Denkstruktur. Fünf Stufen bleiben Hypothese; ein Arm „Anker gegen Placebo" entscheidet. |
| Faktorkatalog ≥ 120 Faktoren (B3b, D006–D007) | Als Dauertext widerlegt (−28,9 pp). Als Auswahlmenge für den Schalter ungemessen. | **Verschoben mit Bedingung:** ein Arm „Katalog-Auszug bei Signal" schlägt den Placebo. |
| Selbstkonsistenz@3 als Stufe 4 (D019) | 4,28× Kosten je bestandenem Ergebnis, niedrigste Genauigkeit. | **Gestrichen.** Zwei Stichproben nur als Schaltersignal. |
| Globaler Arbeitsraum C1 (D012) | −53,3 pp als Prompt; als Mehrfachaufruf n.s. | **Gestrichen** als Mechanismus. Was bleibt: der Vertrag ist die gemeinsame Datei je Vorhaben. |
| Übergabe-Vertrag wörtlich (E7) | −15,3 bis −34,4 pp | **Ersetzt** durch Proben. |
| Adapter Codex/Gemini/Cursor/Copilot, MCP-Server, Marketplace (B6, D042) | Eine Bindung zuerst, richtig. Kompilat ohne gemessene Wirkung ist Verwaltung. | **Verschoben.** |
| Miguel-Generator aus öffentlichem Erz (D048) | Identität ist gemessen „Stil und Gedächtnis" (Rückgrat 7–14 %). Der Kern bleibt namensoffen; der Name kommt aus dem Profil. | **Verschoben.** |
| Sol-Gate (GPT über Codex-CLI) | Nutzerabhängig, hier nicht installiert. | Der Prüfer nimmt ein konfigurierbares Fremdkommando als Gegenstimme; kein eigenes Organ. |
| Web-Monitor, Remote-Sicht (N9) | Der Bus wird geschrieben; die Ansicht ist `soul monitor` (Verfolgung der JSONL). | **Verschoben.** |
| Wissensorgan mit Dossiers (R17, B5b) | Der Erstbestand liegt in `ordnung/docs/research/wissen/`. Ladeprotokoll ohne gemessene Wirkung ist Text. | **Verschoben.** Verweis im README. |
| Branch `soul-10` im SOUL-Repo (B11) | Außerhalb dieser Sitzung und ihres Zugriffs. | **Offen.** |
| Bewusstseins-Vokabular im Produkt | Trägt messbar nichts; verletzt die Anti-Performance-Regel. | **Nirgends.** |

---

## 4. Was vor dem Einbau gemessen wird — vorregistriert

Alle drei laufen auf der vorhandenen Strecke (Haiku 4.5, objektive Grundwahrheit,
gepaarter Bootstrap, ≥ 3 Läufe). Schwellen stehen **vor** den Daten.

**M1 · Überraschung als Schalter** (`A_UEBERRASCHUNG` in `harness/mehrfach.py`;
kette20, Regime sofort, 25 Aufgaben × 3 Läufe, frisch gegen `A_PRUEFER` und `A_SC3`).
Eine Vorhersage ohne Rechnung (Bereich), dann die Lösung, dann Vergleich; nur bei
Abweichung wird der Prüfer gerufen.
- *Bestätigt, wenn:* Genauigkeit ≥ A_SC3 + 10 pp bei ≤ 2,6 Aufrufen im Mittel, **und**
  Genauigkeit im Zweig „nicht überrascht" ≥ 70 % (nackt liegt bei 54 %). Dann ist
  Überraschung ein Fehlersignal und wird der zweite Schaltereingang neben der
  Uneinigkeit zweier Stichproben.
- *Widerlegt, wenn:* Genauigkeit im Zweig „nicht überrascht" ≤ 60 % (Überraschung
  trennt nicht) **oder** Überraschungsrate > 85 % (der Arm ist nur ein teurer
  A_PRUEFER). Dann wird der Schalter allein über Uneinigkeit gebaut; die
  Vorhersage bleibt als `predict.py` erhalten (Kalibrierung), nicht als Schalter.
- **Ergebnis (2026-09-07, n=75 je Arm): widerlegt.** Überraschungsrate 92,0 %; Zweig
  „nicht überrascht" n=6 bei 66,7 %; 81,3 % bei 2,92 Aufrufen gegen A_PRUEFER 77,3 % bei
  2,00 (+4,0 pp, p=0,595 — Rauschen); Spezifität 8 %. Der Fallback greift: `switch.py`
  schaltet über Vorfilter und Uneinigkeit, `predict.py` bleibt Kalibrierung. Details in
  `bewusstsein/berichte/03-RUNDE4-BAU.md` §M1.

**M2 · Nahtprotokoll** (`ZERLEGT_NAHT` in `harness/zerlegung.py`; 12 Aufgaben × 3 Läufe,
10 Teile, Denkbudget wie in der Vorgängermessung, gegen `GANZ` und `ZERLEGT_CODE`).
- *Bestätigt, wenn:* randabhängige Bedingung ≥ 80 % (Vorgänger 28 %) **und** sauber
  teilbare Bedingung ≥ 95 % (das Protokoll darf dort nichts kosten).
- *Widerlegt, wenn:* randabhängig < 60 % **oder** sauber teilbar < 90 %. Dann verweigert
  `decompose.py` jede Zerlegung mit erkannter Randabhängigkeit (Fallback: ein Agent).
- **Ergebnis (2026-09-08, n=36 je Verfahren): unentschieden — 72 % randabhängig
  (ZERLEGT_CODE 33 %, GANZ 94 %), 100 % sauber teilbar.** Gepaart: +38,9 pp gegen
  Zerlegung ohne Protokoll (p=0,030), −22,2 pp gegen einen Agenten (p=0,113). Regel in
  `ARCHITEKTUR.md` §5.4: sauber → zerlegen; randabhängig → ein Agent, solange die Aufgabe
  in einen Kontext passt, sonst Nahtprotokoll; Kumulation → nicht zerlegbar. Details in
  `bewusstsein/berichte/03-RUNDE4-BAU.md` §M2.

**M3 · Das gebaute Hauptbuch besteht die gemessene Schwelle** (nach dem Bau;
`experiment_ged.py`, Varianten `GIFT` und `GIFT_HERKUNFT`, Einträge gerendert vom
gebauten `ledger.py`, 12 Fragen × 3 Läufe).
- *Bestätigt, wenn:* `GIFT_HERKUNFT` ≥ 90 % richtig und 0 % falsch; `GIFT` bleibt
  nahe 0 % richtig (sonst misst die Suite nicht mehr, was sie messen soll).
- *Widerlegt, wenn:* `GIFT_HERKUNFT` < 80 % richtig. Dann ist das Rendering falsch,
  und der Bau ist nicht abgenommen.
- **Ergebnis (2026-09-08, n=36 je Variante, Regime wie Runde 3): bestätigt.** 94,4 % richtig,
  0,0 % falsch; nur Etiketten 97,2 %; flach 2,8 % richtig / 83,3 % falsch. Rendering byte-gleich.
  Ein erster Lauf ohne Denkbudget zeigte den Schutz ebenfalls (0,0 % falsch), aber 36 %
  Doppelnennungen — dokumentiert als zweites Regime in `03-RUNDE4-BAU.md` §M3.

---

## 5. Unter welcher Bedingung ist diese Entscheidung falsch?

1. **Offenes Urteil.** Alle Zahlen stammen aus Aufgaben mit berechenbarer Wahrheit.
   Wenn sich zeigt, dass Prompt-Struktur bei Abwägung und Beratung trägt, fehlt Säule 2
   ein Bauteil, das hier bewusst nicht gebaut wird. Heute nicht entscheidbar; der Weg
   dahin steht in `03-OFFENE-FRAGEN.md` Rang 1 (prüfbare Teilziele statt Judge).
2. **M1/M2 scheitern.** Dann greifen die Fallbacks aus §4 — die Module werden trotzdem
   gebaut, aber konservativer geschaltet.
3. **Die Hooks feuern nicht wie dokumentiert.** Dann ist das Gedächtnis tot, egal wie
   gut das Schema ist. `events.py` schreibt deshalb bei jedem Ereignis eine Zeile auf
   den Bus; null Zeilen aus Hooks nach einer Sitzung ist ein Defekt (G2).
4. **Zwei Modelle, eine Familie.** Alles hier ist auf Haiku 4.5 gemessen, mit
   Bestätigung auf Sonnet 4.5. Lokale Modelle sind weniger folgsam; der
   Schweigeklausel-Befund könnte dort schwächer, der Herkunftsbefund stärker sein.

---

## 6. Abweichungen vom Vorgänger-Entwurf, je eine Zeile

- Reihenfolge der Säulen: Gedächtnis zuerst (Messung), nicht gleichrangig (Bauplan).
- Register D001–D099 bleibt als Quelle stehen (D054–D099 stammen aus dem am Sitzungslimit abgebrochenen B1-Lauf der Vorsitzung, Gruppen E–I); die Gruppen J–L werden nicht nachgeholt — der Code ist das Register.
- `ordnung/structure/` (Kernel, Bündel, Faktoren) bleibt leer, bis ein Arm einen Inhalt rechtfertigt.
- Modellgerichtete Texte bleiben **Deutsch**, wo sie deutsch gemessen wurden (Aufwandsregel, Prüferprompt); D009 („Englisch") tritt hinter die Messung zurück.
- Der Frame 4.1 bleibt byte-gleich in `structure/implant/` als Vergleichsarm; Punkt 6 ist als schädlich gemessen und wird nirgends geladen.
- Kein Bauteil heißt nach dem, was es verspricht, sondern nach dem, was es tut (`switch.py`, nicht `consciousness.py`).

---

## 7. Abnahme dieser Sitzung

Der Bau gilt als abgenommen, wenn alle fünf Zeilen erfüllt sind und ihre Ausgabe im
Abschlussbericht steht:

1. `cd ordnung/soul10 && python3 -m pytest tests -q` grün.
2. `python3 bewusstsein/harness/bericht_pruefen.py` grün (auch mit den neuen Zahlen).
3. M1, M2, M3 ausgewertet, Zahlen in `bewusstsein/ergebnisse/` und in `01-BEFUNDE.md`
   nachgetragen, Rohbelege als Archiv in `belege/`.
4. `echo '{...}' | python3 .claude/hooks/hook.py session-start` liefert ein Briefing
   mit Herkunftsetiketten; `soul contract new` ohne Probe wird abgelehnt.
5. `npm test` im Repo nicht schlechter als vorher (der eine Altbefund „Soul product
   page release evidence is stale" existiert vor dieser Sitzung und gehört nicht ihr).
