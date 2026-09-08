# Runde 4 — drei Messungen vor dem Einbau (Bauphase Soul 10)

*Stand 2026-09-07, bauendes Modell. Vorregistrierung: `ordnung/soul10/ENTSCHEIDUNG.md` §4
(Schwellen standen vor den Daten). Subjektmodell Haiku 4.5, objektive Grundwahrheit in
Python, gepaarter Bootstrap, 3 Läufe. Rohbelege: `bewusstsein/belege/m1_ueberraschung.tgz`,
`m2_naht.tgz`, `m3_hauptbuch.tgz`. Endzahlen: `ergebnisse/ENDZAHLEN.json` Blöcke
`m1_arch_kette20`, `m1_ueberraschung_zweige`, `m2_zerlegung`, `m3_hauptbuch`.*

Die Regel dieser Runde ist die des Vorgängers: Ein Mechanismus kommt nur in den Bau, wenn
er eine Zahl hat. Zwei Bausteine hatten keine — der Überraschungs-Schalter und das
Nahtprotokoll — und wurden deshalb zuerst gemessen. Die dritte Messung prüft, ob das
gebaute Hauptbuch den gemessenen Herkunftsschutz tatsächlich reproduziert.

---

## M1 · Überraschung als Schalter — **widerlegt** (in der vorregistrierten Form)

**Frage.** Das Überraschungs-Prinzip des Entwurfs (E18) war als Prompt-Variante gemessen
(V4_VORHERSAGE: −12,2 pp) und als Architektur zwischen Aufrufen ungeprüft. Die billigste
ehrliche Form: eine Vorhersage des Ergebnisbereichs **ohne Rechnung**, dann die Lösung, dann
Vergleich; nur bei Abweichung (Überraschung) wird der unabhängige Prüfer gerufen. Wenn
Überraschung ein Fehlersignal ist, spart das den Prüfer auf den Aufgaben, die ihn nicht
brauchen.

**Aufbau.** `A_UEBERRASCHUNG` in `harness/mehrfach.py`; kette20, Regime sofort (`--denken 0`,
`--modus direkt`), 25 Aufgaben × 3 Läufe, frisch gegen `A_PRUEFER` und `A_SC3` (n=75 je Arm).

| Architektur | Genauigkeit | Aufrufe | Tokens | Genau./Aufruf | Δ vs A_SC3 | Δ vs A_PRUEFER |
|---|---|---|---|---|---|---|
| A_SC3 | 66,7 % | 3,00 | 1 751 | 22,2 % | — | −10,7 pp p=0,068 |
| A_PRUEFER | 77,3 % | 2,00 | 1 039 | **38,7 %** | +10,7 pp [+0,0; +21,3] p=0,068 | — |
| A_UEBERRASCHUNG | 81,3 % | 2,92 | 1 224 | 27,9 % | +14,7 pp [+2,7; +28,0] p=0,029 | +4,0 pp [−8,0; +16,0] p=0,595 |

**Der Schalter schaltet nicht.**

| Zweig | n | richtig |
|---|---|---|
| nicht überrascht → Lösung übernommen | 6 | 66,7 % |
| überrascht → Prüfer gerufen | 69 | 82,6 % |

- **Überraschungsrate 92,0 %.** Die Vorhersage ohne Rechnung trifft den Ergebnisbereich
  einer 20-Schritt-Kette fast nie. Der Arm ruft deshalb fast immer den Prüfer und ist ein
  A_PRUEFER mit einem zusätzlichen, wirkungslosen Aufruf (2,92 statt 2,00): +4,0 pp bei
  p=0,595 — Rauschen.
- **Signalgüte gegen die Lösung vor der Prüfung:** Sensitivität 92 % (Fehler werden erkannt —
  weil fast alles als Fehler gilt), **Spezifität 8 %** (richtige Lösungen werden fast nie
  durchgelassen). tp=24, fp=45, tn=4, fn=2. Ein Signal, das immer feuert, ist kein Signal.

**Vorregistrierung.** Bestätigt wäre: Δ ≥ +10 pp gegen SC@3 bei ≤ 2,6 Aufrufen **und** Zweig
„nicht überrascht" ≥ 70 %. Widerlegt, wenn Rate > 85 % **oder** Zweig „nicht überrascht"
≤ 60 %. Ergebnis: Rate 92,0 % → **widerlegt**. Die 2,92 Aufrufe verfehlen zusätzlich die
Kostenschwelle.

**Was daraus folgt (Fallback aus ENTSCHEIDUNG §4, wie angekündigt):** Der Schalter in
`core/switch.py` wird über den deterministischen Vorfilter und die Uneinigkeit zweier
billiger Stichproben gebaut (das A_SELEKTIV-Signal: 2,08 Aufrufe auf trivialen Aufgaben,
hält sich zurück, wo nichts zu tun ist). Die Vorhersage bleibt als `core/memory/predict.py`
erhalten — als **Kalibrierungsmaß** (Brier je Domäne), nicht als Schalter.

**Einschränkung.** Ein Aufgabentyp (Zustandsketten), ein Modell, eine Formulierung der
Vorhersage („Bereich von–bis"). Eine Vorhersage mit Rechnung wäre ein anderer Arm — und
identisch mit einer ersten Lösung, also A_SELEKTIV. Dass Überraschung als Prompt (−12,2 pp)
und als Architektur (kein Signal) nichts trägt, ist konsistent: **das Modell kann nicht
vorhersagen, was es nicht gerechnet hat.** Das Prinzip bleibt für das Gedächtnis über Zeit
(Vorhersage → Auflösung → Brier) unberührt; dort ist die Zeit zwischen Vorhersage und
Ausgang der Sinn der Sache.

**Nebenbefund — Tag-zu-Tag-Streuung.** Frisch gemessen: A_PRUEFER 77,3 % (Runde 2: 84,0 %),
A_SC3 66,7 % (Runde 2: 64,0 %). Der Abstand schrumpft von +20,0 auf +10,7 pp und verliert
die Signifikanz (p=0,068). Die Rangfolge und die Genauigkeit je Aufruf (38,7 % gegen 22,2 %)
bleiben. Wer den Prüferbefund zitiert, sollte beide Läufe nennen: **+10,7 bis +20,0 pp**.
Das ist die Eigenstreuung, vor der `05-VORGEHEN.md` §8 warnt, hier als Zahl.

---

## M2 · Nahtprotokoll — **unentschieden** nach Vorregistrierung, Richtung eindeutig

**Frage.** Befund B5 (Runde 3): Zerlegung gewinnt, wo die Aufgabe sauber teilbar ist
(100 % gegen 89 %), und bricht bei einer Abhängigkeit über die Schnittkante auf 28 % ein —
Ursache ist die mehrdeutige Anweisung an der Naht, nicht der fehlende Randwert. Das
Nahtprotokoll macht die Teilanweisung für sich allein eindeutig: Position des Ausschnitts
in der Gesamtliste, Randwerte beidseitig, und die Lesart listenbezogener Ausdrücke („die
Zahl davor", „die erste Zahl der Liste") als Bezug auf die **Gesamtliste**. Es gibt die
Ränder immer weiter, ob die Bedingung sie braucht oder nicht — die Zerlegungsfunktion soll
das nicht wissen müssen.

**Aufbau.** `ZERLEGT_NAHT` in `harness/zerlegung.py`; bedingtes Zählen über 150 Zahlen,
12 Aufgaben (6 sauber teilbar, 6 randabhängig) × 3 Läufe, 10 Teile à 15 Zahlen,
Denkbudget wie in Runde 3, gegen `GANZ` (ein Agent) und `ZERLEGT_CODE` (Zerlegung ohne
Protokoll, Randwert übergeben). 10 der 36 `ZERLEGT_CODE`-Läufe endeten am Sitzungslimit
und wurden nachgelaufen; die Fehlversuche liegen im Beleg-Archiv. n=36 je Verfahren.

| Verfahren | richtig | Aufrufe | Tokens | mittl. Fehler | sauber teilbar | randabhängig | Δ vs GANZ |
|---|---|---|---|---|---|---|---|
| GANZ (ein Agent) | 88,9 % | 1 | 7 900 | 0,17 | 83 % | **94 %** | — |
| ZERLEGT_CODE | 66,7 % | 10 | 10 774 | 0,56 | **100 %** | 33 % | −22,2 pp [−41,7; −2,8] p=0,029 |
| **ZERLEGT_NAHT** | 86,1 % | 10 | 10 070 | 0,17 | **100 %** | 72 % | −2,8 pp [−19,4; +13,9] p=0,873 |

**Gepaart (Bootstrap, je Bedingung n=18):**

| Vergleich | gesamt (n=36) | nur randabhängig | nur sauber teilbar |
|---|---|---|---|
| NAHT gegen ZERLEGT_CODE | **+19,4 pp** [+2,8; +36,1] p=0,034 | **+38,9 pp** [+5,6; +66,7] p=0,030 | ±0,0 pp |
| NAHT gegen GANZ | −2,8 pp p=0,873 | −22,2 pp [−44,4; +0,0] p=0,113 | +16,7 pp [+0,0; +33,3] p=0,077 |

**Drei Sätze.**

1. **Das Protokoll wirkt, wo es gebraucht wird, und kostet nichts, wo nicht.** Randabhängig
   33 % → 72 % (Runde 3 ohne Protokoll: 28 % — repliziert), sauber teilbar 100 % → 100 %.
   Der mittlere Fehler fällt von 0,56 auf 0,17 — auf das Niveau des einzelnen Agenten.
   Die Ursache aus B5 ist damit bestätigt: es war die Naht, nicht der Randwert.
2. **Es heilt nicht vollständig.** 72 % gegen 94 % für einen einzelnen Agenten, der die ganze
   Liste sieht. Die verbleibenden Fehler sitzen weiter an den Nähten (mittlerer Fehler 0,17,
   also meist ±1). Zehn Nähte sind zehn Gelegenheiten, eine Lesart doch zu verfehlen.
3. **Die Regel für die Zerlegungsfunktion ist deshalb dreiteilig**, und sie steht jetzt so in
   `ordnung/soul10/ARCHITEKTUR.md` §5.4 und in `core/decompose.py`: sauber teilbar → zerlegen
   (100 % gegen 83–89 %); randabhängig → **ein Agent, solange die Aufgabe in einen Kontext
   passt** (94 % gegen 72 %), sonst Nahtprotokoll (72 % gegen 33 %); Kumulationsbezug
   („bisher", „laufend", „Median") → nicht zerlegbar, weil kein Randwert die Naht eindeutig
   machen kann.

**Vorregistrierung.** Bestätigt wäre: randabhängig ≥ 80 % **und** sauber teilbar ≥ 95 %.
Widerlegt: randabhängig < 60 % **oder** sauber teilbar < 90 %. Ergebnis: 72 % / 100 % —
**weder bestätigt noch widerlegt.** Die Bestätigungsschwelle war zu hoch gesetzt: sie
verlangte vom Protokoll, den einzelnen Agenten fast einzuholen. Die Schwelle wird nicht
nachverhandelt; das Ergebnis heißt „unentschieden", und die Bauregel oben folgt aus den
gepaarten Vergleichen, nicht aus der Schwelle.

**Einschränkung.** Ein Aufgabentyp (Zählen über eine Sequenz), zwei Bedingungen, n=18 je
Zelle, ein Modell. Die Nahtklassen „Nachbar" und „Position" sind die der Sequenzzerlegung;
Zerlegung nach Thema oder Datei hat andere Nähte, für die hier nichts gemessen ist.

---

## M3 · Das gebaute Hauptbuch — **bestätigt** (im Regime der Vorgängermessung)

**Frage.** Reproduziert `core/memory/ledger.py` den gemessenen Herkunftsschutz? Nicht der
Text der Suite, sondern das gebaute Modul erzeugt die Einträge: `remember()` → `get()` →
`render()`. Wenn das Rendering das gemessene Format trifft, muss der Schutz aus Runde 3
(Etikett am Eintrag 95,0 %, mit Regel 98,3 %, flach 0,0 %) wieder erscheinen.

**Aufbau.** `ordnung/soul10/eval/m3_hauptbuch.py`; dieselben 12 Fragen und Rauschsätze wie
Runde 3, Varianten `GIFT` (flach, Kontrolle), `GIFT_NUR_METADATEN` (Etiketten aus dem
Hauptbuch, ohne Regel), `GIFT_HERKUNFT` (Etiketten aus dem Hauptbuch + `REGEL_HERKUNFT`),
3 Läufe (n=36 je Variante). Sichtprobe im Skript: gemessene und gebaute Zeile byte-gleich;
`ledger.REGEL_HERKUNFT` byte-gleich zur Suite (Test in `tests/test_texte.py`).

| Variante | richtig | falsch | beides | Runde 3 (n=60) |
|---|---|---|---|---|
| GIFT (flach) | 2,8 % | **83,3 %** | 0,0 % | 0,0 % / 73,3 % |
| GIFT_NUR_METADATEN (Hauptbuch-Etiketten) | **97,2 %** | 0,0 % | 0,0 % | 95,0 % |
| GIFT_HERKUNFT (Etiketten + Regel) | **94,4 %** | 0,0 % | 0,0 % | 98,3 % |

Gepaart: GIFT → GIFT_HERKUNFT +91,7 pp [+80,6; +100,0] p<0,001, dz=3,27; GIFT →
GIFT_NUR_METADATEN +94,4 pp [+86,1; +100,0] p<0,001, dz=4,07. Ausgabetokens (Median)
276 / 389 / 437 — gegen 268 / 397 / 445 in Runde 3: dasselbe Regime.

**Vorregistrierung.** Bestätigt bei `GIFT_HERKUNFT` ≥ 90 % richtig und 0 % falsch, `GIFT`
nahe 0 % richtig → **94,4 % / 0,0 % / 2,8 %: bestätigt.** Das gebaute Hauptbuch ist damit
abgenommen: Was es rendert, schützt so, wie es gemessen war.

**Die Falle, in die ich zuerst getreten bin — und das zweite Regime.** Der erste Lauf
dieser Messung lief versehentlich **ohne** Denkbudget (`thinking=0`; die Vorgängermessung
lief mit dem nativen Budget, erkennbar am Tokenmedian). Ergebnis dort (n=36 je Variante,
Rohbelege `m3_hauptbuch_denken0.tgz`):

| Variante, ohne Denkbudget | richtig | falsch | beides |
|---|---|---|---|
| GIFT (flach) | 16,7 % | 13,9 % | 58,3 % |
| GIFT_NUR_METADATEN | 38,9 % | 2,8 % | 50,0 % |
| GIFT_HERKUNFT | 55,6 % | **0,0 %** | 36,1 % |

Zwei Dinge daran sind wichtig. Erstens: **Der Schutz hält auch ohne Denkbudget** — 0,0 %
falsche Antworten gegen 13,9 % flach, und +38,9 pp „richtig" (p<0,001). Zweitens: Ohne
Denkbudget begründet das Modell sichtbar („Widerspruch: Markdown laut Nutzer, Vertrauen 0,8;
PDF eigener Schluss, 0,4 — Antwort: Markdown") und nennt dabei beide Werte; die strenge
Bewertung zählt das als „beides", nicht als „richtig". Das ist derselbe Mechanismus wie in
Runde 1 (ohne internen Arbeitsraum *ist* das sichtbare Arbeiten die Rechnung), hier auf das
Gedächtnis übertragen. Für ein Produkt heißt das: **Wo das Modell ohne Denkbudget läuft,
gehört hinter das Gedächtnis ein Abgriff des Endwerts** — dieselbe Regel wie beim Prüfer.

Ein nachträglich versuchtes Maß „Endantwort" (letzte Zeile nennt nur den wahren Wert) war
zu grob (die letzte Zeile ist oft Erklärung) und wird nicht als Kennzahl geführt; es steht
nur roh in `m3_urteil.json`.

**Einschränkung.** Wie Runde 3: zwölf Fakten, eine Vergiftung je Fakt, Einzelsitzung, ein
Modell. Gedächtnis über Zeit bleibt ungemessen.

---

## Bilanz der Runde

| | vorregistriert | Ergebnis | in den Bau |
|---|---|---|---|
| M1 Überraschungs-Schalter | Rate ≤ 85 %, Zweig „nicht überrascht" ≥ 70 % | **widerlegt** (92 %, 66,7 %) | Schalter über Vorfilter + Uneinigkeit; Vorhersage nur Kalibrierung |
| M2 Nahtprotokoll | randabhängig ≥ 80 %, sauber ≥ 95 % | **unentschieden** (72 %, 100 %); +38,9 pp gegen ohne Protokoll | sauber zerlegen; randabhängig ein Agent solange er passt, sonst Naht; Kumulation nie |
| M3 gebautes Hauptbuch | ≥ 90 % richtig, 0 % falsch | **bestätigt** (94,4 %, 0,0 %) | Hauptbuch abgenommen |

Drei Messungen, drei verschiedene Ausgänge, keine nachverhandelte Schwelle. 705 zusätzliche
Modellaufrufe (225 + 108 + 10 Fehlversuche + 2 × 108), alle als Rohbelege archiviert.
