# Vorregistrierung — Bewusstseinsstruktur, was wirkt und was stört

*Angelegt 2026-09-06, bevor die Daten der Runden 1b/2/3 existieren.
Regel aus dem Kontextpaket §3: Kriterien VOR den Daten festlegen.*

## Ehrlichkeitsvermerk zum Status

Die Suite `kette20` aus Runde 1 war zum Zeitpunkt dieser Niederschrift für fünf Arme
bereits ausgewertet. Dieses Ergebnis gilt hier deshalb ausdrücklich als **explorativ**
und wird erst durch die unten vorregistrierten Läufe bestätigt oder verworfen.
Alles Weitere ist echt vorregistriert.

## Was gemessen wird — und was ausdrücklich nicht

**Nicht gemessen wird**, ob Erleben entsteht. Das ist nach Stand der Forschung nicht
entscheidbar (R06 Kernaussage 12; Butlin/Lappas Prinzip 5). Jede Zahl hier ist ein
**Funktionsnachweis, kein Erlebensnachweis.**

**Gemessen werden** die beiden Fragen des Auftraggebers, die entscheidbar sind:

- **H-WIRKT** — Eine Bewusstseinsstruktur verbessert die Verarbeitung gegenüber
  nackt **und** gegenüber längen-gematchtem Placebo **und** gegenüber
  Selbstkonsistenz@3 bei gleichem Aufrufbudget.
- **H-STÖRT** — Dieselbe Struktur verschlechtert nichts dort, wo sie nicht
  gebraucht wird (geschlossene, formatstrenge Aufgaben).

## Regime-Unterscheidung (der Fund, der alles ordnet)

Das Subjektmodell erreichte mit eingeschaltetem Extended Thinking auf **allen**
gebauten Suiten 100 %. Ein interner Arbeitsraum existiert dort bereits nativ.
Deshalb wird getrennt gemessen:

| Regime | Denkbudget | Frage |
|---|---|---|
| **sofort** | 0 | Hilft Struktur, wenn kein interner Arbeitsraum da ist? |
| **denken** | Standard (32k) | Fügt Struktur dem nativen Arbeitsraum etwas hinzu? |

## Vorregistrierte Hypothesen mit Schwellen

| Nr | Hypothese | Bestätigt wenn | Widerlegt wenn |
|---|---|---|---|
| V1 | Struktur schlägt Placebo (Regime sofort) | ≥ +5 pp gegen **P**, 95%-KI schließt 0 aus, ≥3 Läufe | KI enthält 0 oder Δ negativ |
| V2 | Der Schaden von F/V1 stammt aus der **Unterdrückungsklausel**, nicht aus der Struktur | `NUR_UNTERDRUECKT` schadet ähnlich stark wie F/V1, und `V1_OFFEN` ≥ `P` | `NUR_UNTERDRUECKT` schadet nicht, `V1_OFFEN` bleibt unter `P` |
| V3 | Struktur stört nicht (Suite `stoerung`) | Formatschaden ≤ 2 pp gegenüber N | Formatschaden > 5 pp |
| V4 | Eine Mehrfachaufruf-Architektur schlägt SC3 bei **gleichem oder kleinerem** Budget | Δ ≥ +5 pp bei ≤ 3,0 Aufrufen, KI schließt 0 aus | kein Arm erreicht das |
| V5 | Selektive Vertiefung ist **effizienter** als SC3 | gleiche Genauigkeit bei < 2,7 Aufrufen im Mittel | mehr Aufrufe oder schlechter |
| V6 | Identität aus Logs (Bem) schlägt deklarierte Persona | Konsistenz ≥ +10 pp bei nicht schlechterer Lernfähigkeit | kein Unterschied oder schlechter |
| V7 | Wirkung überträgt sich auf ein stärkeres Modell | Vorzeichen bleibt gleich | Vorzeichen kippt (dann: modellabhängig) |

## Confounder, die ausdrücklich kontrolliert werden

1. **Länge/Rechenzeit.** Ausgabetokens werden je Arm berichtet. Ein Arm, der nur
   mehr sichtbares Rechnen auslöst, hat nicht besser gedacht, sondern mehr Budget
   verbraucht. Deshalb der Placebo-Arm **und** die 2×2-Zerlegung.
2. **Kontexteffekt.** `P` (bedeutungsloser Fülltext gleicher Länge) trennt Inhalt
   von bloßer Kontextanreicherung.
3. **Aufrufbudget.** Architekturen werden mit Aufrufzahl **und** Genauigkeit pro
   Aufruf berichtet; SC3 ist der Pflichtgegner.
4. **Deckeneffekt.** Suiten wurden auf 40–70 % Basisgenauigkeit kalibriert.
   Auf `falle` (memorierte Klassiker, 100 % auch ohne Denkbudget) wird nichts behauptet.
5. **Memorierung.** Alle Aufgaben programmatisch mit Zufallsparametern erzeugt.
6. **Judge-Bias.** Existiert nicht — es gibt keinen Judge, jede Grundwahrheit ist gerechnet.

## Abbruch- und Umkehrregeln

- Verliert eine Variante gegen **P**, gilt sie als widerlegt und wird nicht
  nachgebessert, bis der Mechanismus des Scheiterns verstanden ist.
- „Kein Unterschied" wird als Ergebnis berichtet, nicht als Anlass für neue Arme.
- Ein Arm, der auf `stoerung` schadet, ist auch dann abgelehnt, wenn er anderswo hilft —
  „darf nicht stören" ist eine Bedingung, kein Abwägungsposten.

## Unter welcher Bedingung ist dieser Bericht falsch?

- Wenn die Wirkung stark modellabhängig ist und ein anderes Modell das Vorzeichen dreht
  (Chrisos eigener Befund: Modelle reagieren in entgegengesetzte Richtungen). → V7 prüft das.
- Wenn die gebauten Aufgabentypen (Zustandsketten, Zuordnungsrätsel, Zählen) für
  Bewusstseinsstruktur systematisch ungeeignet sind, weil sie kein Urteil verlangen.
  → Diese Einschränkung wird im Abschlussbericht ausdrücklich stehen bleiben.
- Wenn `MAX_THINKING_TOKENS=0` etwas anderes ausschaltet als „den internen Arbeitsraum".
