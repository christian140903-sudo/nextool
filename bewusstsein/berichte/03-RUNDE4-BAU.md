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

## M2 · Nahtprotokoll — *läuft*

Aufbau: `ZERLEGT_NAHT` in `harness/zerlegung.py`; 12 Aufgaben × 3 Läufe, 10 Teile, Denkbudget
wie in der Vorgängermessung, gegen `GANZ` und `ZERLEGT_CODE`. Vorregistriert: bestätigt bei
randabhängig ≥ 80 % (Vorgänger 28 %) **und** sauber teilbar ≥ 95 %; widerlegt bei
randabhängig < 60 % **oder** sauber teilbar < 90 %. Ergebnis folgt nach Abschluss des Laufs.

---

## M3 · Das gebaute Hauptbuch — *nach dem Bau*

Aufbau: `ordnung/soul10/eval/m3_hauptbuch.py`; dieselbe Gedächtnissuite wie Runde 3, aber die
Einträge der Herkunftsvarianten werden vom gebauten `core/memory/ledger.py` gerendert.
Vorregistriert: bestätigt bei `GIFT_HERKUNFT` ≥ 90 % richtig und 0 % falsch, `GIFT` flach
nahe 0 % richtig; widerlegt bei `GIFT_HERKUNFT` < 80 %.
