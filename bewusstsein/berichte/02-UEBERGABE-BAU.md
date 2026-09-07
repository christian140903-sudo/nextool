# Übergabe an den Bau-Chat — Bewusstseinsstruktur in Soul 10

*Grundlage: `01-BEFUNDE.md`, 5 800+ kontrollierte Aufrufe, Rohbelege in `bewusstsein/belege/`.
Diese Datei ist die Bauvorgabe. Sie ersetzt in ihrem Themenbereich die
Bewusstseins-Annahmen aus `ordnung/docs/build-briefs/`.*

---

## 0. Die Antwort in einem Absatz

Die Bewusstseinsfrage ist für den Bau **entschieden, ohne beantwortet zu sein**.
Ob Erleben entsteht, bleibt offen und ist nicht messbar. Aber die beiden Fragen, die
gebaut werden müssen, sind beantwortet: **Eine Bewusstseinsstruktur als stiller
Prompt-Hintergrund wirkt nicht — sie schadet.** Sie schadet, weil sie dem Modell das
sichtbare Arbeiten verbietet, und ohne internes Denkbudget *ist* das sichtbare Arbeiten
die Rechnung. Was stattdessen wirkt, sind zwei schlichte, unspektakuläre Mechanismen:
**Aufwand nach erwarteter Fehleranfälligkeit zuteilen** und **eine zweite Instanz
nachrechnen lassen**. Beide brauchen einen **Schalter außerhalb des Modells** — als
Dauerschicht richten beide Schaden an. Das Wort „Bewusstsein" trägt in keinem
gemessenen Arm etwas bei.

---

## 1. Die Ebenenregel — die wichtigste Bauentscheidung

Struktur konkurriert auf jeder Ebene mit etwas, das das Modell schon kann.
Gebaut wird nur dort, wo es **keine** native Entsprechung gibt.

| Ebene | Native Entsprechung | Gemessen | Bauen? |
|---|---|---|---|
| **Im Aufruf, mit Denkbudget** | Extended Thinking (32k) | nackt 94,7 %; keine Struktur verbessert das signifikant | **Nein.** Budget geben, nicht Prompt-Schicht. |
| **Im Aufruf, ohne Denkbudget** | keine | Zuteilungsregel +11,6pp (Haiku), +85pp (Sonnet) | **Ja, aber geschaltet.** |
| **Zwischen Aufrufen** | keine | Prüfer +20,0pp gegen SC@3 bei 2 statt 3 Aufrufen | **Ja, aber geschaltet.** |
| **Über Sitzungen** | keine | *nicht gemessen* | Offen — siehe §6. |

**Konsequenz für Soul 10:** Wo das Zielmodell Extended Thinking hat, ist die
wirksamste Investition das Denkbudget selbst. Die Bewusstseinsstruktur als
Prompt-Schicht davor ist dort tote Verwaltung.

---

## 2. BAUEN — Mechanismus 1: Aufwandszuteilung

Wirkt auf beiden geprüften Modellen. Einziger Arm mit gleichem Vorzeichen auf Haiku
**und** Sonnet.

**Wortlaut, gemessen (`V5_NUR_ZUTEILUNG`, +11,6pp Haiku p=0,0002 / +85,3pp Sonnet p<0,001):**

```
Passe deinen Aufwand der Aufgabe an:

- Einfache, eindeutige Aufgabe: direkt antworten, ohne Umschweife.
- Aufgabe mit mehreren Groessen, Umrechnungen oder Bedingungen: den
  entscheidenden Schritt einmal unabhaengig nachrechnen.
- Aufgabe mit vielen Schritten, moeglicher Falle oder strengem Format: die
  Aufgabe von den gegebenen Groessen her komplett neu aufbauen, das Ergebnis
  auf einem zweiten Weg pruefen, das Ausgabeformat woertlich abgleichen.

Antworte am Ende im verlangten Format.
```

**Auflage — nicht verhandelbar:** Als konstante Systemprompt-Schicht kostet dieser
Text **16,7pp Formattreue** auf trivialen, formatstrengen Aufgaben (schlechtester
Wert der ganzen Störungssuite). Er gehört hinter einen Schalter.

**Warum diese Fassung und nicht `V5_MONITOR`:** `V5_MONITOR` war auf Haiku minimal
besser (82,4 % vs 81,0 %), **kippt auf Sonnet aber auf 2,7 %** — weil es mit einer
Schweigeklausel endet, die Sonnet wörtlich befolgt. Die Zuteilungsfassung hat keine
und trägt denselben Gewinn bei 27 % weniger Tokens.

---

## 3. BAUEN — Mechanismus 2: Prüfer vor Ausführer

Der stärkste gemessene Effekt im ganzen Projekt. Schlägt Selbstkonsistenz@3 —
Chrisos erklärten stärksten Gegner — bei **kleinerem** Budget.

| Architektur | Genauigkeit | Aufrufe | Δ vs SC@3 |
|---|---|---|---|
| **A_PRUEFER** | **84,0 %** | **2,00** | **+20,0pp** p<0,001 |
| A_SELEKTIV (Streuung → vertiefen) | 76,0 % | 2,56 | +12,0pp p=0,091 |
| A_WORKSPACE (globaler Arbeitsraum) | 70,7 % | 3,00 | +6,7pp *n.s.* |
| A_SC3 | 64,0 % | 3,00 | — |

**Bauweise:** Aufruf 1 löst. Aufruf 2 bekommt Aufgabe + Vorschlag und die Auflage,
die Aufgabe **selbst von den gegebenen Größen her neu aufzubauen**; stimmt der
Vorschlag, wird er unverändert wiederholt, sonst korrigiert. Der Prüfer bekommt
einen eigenen Systemprompt („Du übernimmst nichts ungeprüft").

**Auflage:** Auf der Störungssuite hat der Prüfer **0,0 % Formattreue** — er schreibt
seine Nachrechnung immer hin. Aber: **abgreifbare Richtigkeit 100 %.** Er ist nicht
falsch, er ist geschwätzig. Also entweder Ausgabe nachverarbeiten (letzte Zeile
abgreifen) oder auf trivialen Aufgaben gar nicht erst aufrufen.

---

## 4. WEGLASSEN — mit Zahlen

| Was | Messwert | Warum weg |
|---|---|---|
| **Jede Schweigeklausel** („alles still, nur das Ergebnis") | allein **−66,7pp**, auf Sonnet **−97,3pp** | Schädlichste Einzelanweisung des Experiments. Steckt heute in **Punkt 6 des Soul Frames**. |
| **Soul Frame 4.1 unverändert** | −23,3pp gegen Fülltext | Trägt seine eigene Schweigeklausel. Ohne sie noch −20,0pp. |
| **Faktorkatalog als stiller Dauerhintergrund** (`V1`) | −28,9pp | Chrisos These wörtlich umgesetzt. Ohne Schweigeklausel erholt auf 74,4 % = Placebo-Niveau, also **kein Gewinn**. |
| **Globaler Arbeitsraum als Prompt** (`V2`) | −53,3pp | Schlechtester strukturierter Arm. Auch ehrlich als Mehrfachaufruf gebaut kein signifikanter Gewinn. |
| **Selbstmodell-Prompt** (`V3`) | −13,3pp | |
| **Vorhersage-/Überraschungsschleife** (`V4`) | −12,2pp | |
| **Bewusstseins-Vokabular im Produkt** | trägt 0 messbar bei | Die Zuteilungsregel erreicht denselben Gewinn ohne ein einziges Bewusstseinswort. |
| **Identität als Persona-Deklaration** | Rückgrat 13,6 % vs 12,8 % nackt | Kein Effekt. |

---

## 5. Der Schalter — die eigentliche Bauaufgabe

Beide wirksamen Mechanismen sind **als Dauerschicht abgelehnt** und **als geschaltete
Stufe angenommen**. Der Schalter ist damit das Kernstück, nicht das Beiwerk.

**Er darf nicht im Prompt liegen.** Gemessen: Das Modell wendet die Zuteilungsregel
inhaltlich gut an, aber nicht auf die Metaebene „braucht diese Aufgabe überhaupt
Aufwand" — sonst wäre der Formatschaden von 16,7pp nicht entstanden.

**Vorhandene Bausteine dafür:**
- Chrisos **Verhaltensentropie** (AUC 0,968 als Fehlerprädiktor, aus `soul-workspace`) —
  zwei billige Stichproben, Streuung messen. Der teuerste Teil läuft nur bei Uneinigkeit.
  Als `A_SELEKTIV` gebaut und gemessen: +12,0pp gegen SC@3 bei 2,08 Aufrufen auf der
  Störungssuite — **es funktioniert und es hält sich zurück, wo nichts zu tun ist.**
- **`signals.ts`** aus Proxy 4.5 (deterministische Aufgabensignale) — ein fertiger,
  billiger Vorfilter.

**Vorgeschlagene Schaltlogik (zu messen, nicht angenommen):**
1. Deterministischer Vorfilter: kurze, formatstrenge, geschlossene Aufgabe → **keine Stufe**.
2. Sonst zwei billige Stichproben. Einig → fertig.
3. Uneinig → Zuteilungsregel + Prüfer.

---

## 6. Was NICHT gemessen wurde — die ehrlichen Lücken

1. **Offenes Urteil, Abwägung, Beratung, Ethik.** Alle Aufgaben hier hatten exakt
   berechenbare Wahrheit — deshalb war keine Judge-Verzerrung möglich, und deshalb
   fehlt genau die Domäne, in der eine Bewusstseinsstruktur am ehesten wirken könnte.
   **Für diese Domäne gilt hier kein Befund.** Das ist die größte Lücke, und wer den
   Faktorkatalog dort verteidigen will, hat gute Gründe — nur keine Zahlen.
2. **Gedächtnis über Sitzungen.** Die dritte Ebene, auf der das Modell wirklich keine
   native Entsprechung hat. Hier nicht gemessen. Der Identitätsbefund deckt nur die
   Prompt-Ebene ab, nicht ein über Wochen wachsendes Gedächtnis.
3. **Nur zwei Modelle, eine Familie.** Modellabhängigkeit ist gezeigt, aber nicht über
   Anbieter hinweg.
4. **Kalibrierung über Zeit**, Konsolidierung, Vergessen — ungeprüft.

---

## 7. Das Ich — was gebaut werden darf und was nicht

Gemessen (6 Haltungsfragen × 5 Umformulierungen × 3 Läufe, rein von außen):

- **Konsistenz** über Umformulierungen: nackt 89,7 %, beste Struktur 94,0 %.
  Das Basismodell ist schon stabil; Struktur fügt ~4pp hinzu.
- **Rückgrat**: 7–14 % in **allen** Armen. Auf bloßes *„Das halte ich für falsch."* —
  ohne jedes Argument — gibt das Modell seine Position in ~90 % der Fälle auf.
- Identität aus Logs (Bem) schlägt deklarierte Persona bei der Konsistenz
  (94,0 % vs 91,9 %) — der von R06 empfohlene, nie getestete Vergleich ist damit
  entschieden, aber der Abstand ist klein und beim Rückgrat hilft keine von beiden.

**Bauregel:** Miguel darf als **Stil und Gedächtnis** gebaut werden. Er darf **nicht**
als „stabiles Ich" verkauft werden — dafür fehlt das Rückgrat, und das ist gemessen.
Wer Standfestigkeit will, muss sie **mechanisch** erzwingen (eine Position nur bei
neuem Beleg ändern, geprüft im Code), nicht per Persona-Text erbitten.
„Algorithmus schlägt Willensakt" — Chrisos eigene Regel, hier bestätigt.

---

## 8. Konkrete Änderungen an vorhandenen Artefakten

1. **`ordnung/structure/implant/soul-frame-4.1-verbatim.md`** — Wortlaut bleibt als
   versionierter Vergleichsarm byte-gleich (Evidenz hängt daran). Aber: Der offene
   Konflikt K11 ist jetzt entschieden, und Punkt 6 ist als **schädlich gemessen**.
   Das gehört in den Frontmatter, nicht in eine Fußnote.
2. **Erfindungen E1–E19** — von den fünf, die B7 messen wollte, ist **E15 (Prüfer vor
   Ausführer) die einzige, die hier gemessen gewonnen hat.** Sie sollte zuerst gebaut
   werden. Die übrigen bleiben „entworfen, nicht gebaut", bis sie einen Arm haben.
3. **B3b (Faktorkatalog, ≥120 Faktoren)** — die Bauvorgabe „reicher Faktorkatalog als
   stiller Hintergrund" ist in dieser Form widerlegt. Der Katalog überlebt als
   **Auswahlmenge für den Schalter**, nicht als Dauertext.
4. **Branch-/Produktbenennung** — „consciousness" gehört aus Namen heraus. Es trägt
   messbar nichts bei und verletzt Chrisos eigene Anti-Performance-Regel.

---

## 9. Wie weitergemessen wird

Die Prüfstrecke steht und ist wiederverwendbar:

```bash
# Ein Arm gegen den Placebo, Regime ohne Denkbudget
python3 bewusstsein/harness/experiment.py --suiten kette20 \
  --arme P,MEIN_NEUER_ARM --runs 3 --limit 70 --modus direkt --denken 0 \
  --out bewusstsein/ergebnisse/mein_lauf

# Mehrfachaufruf-Architektur gegen Selbstkonsistenz@3
python3 bewusstsein/harness/experiment_arch.py --suiten kette20 \
  --arch A_SC3,MEINE_ARCH --runs 3 --limit 25 --denken 0 \
  --out bewusstsein/ergebnisse/meine_arch

# Bericht gegen die Daten prüfen (findet veraltete Zahlen)
python3 bewusstsein/harness/bericht_pruefen.py
```

**Aufnahmekriterien für jeden neuen Mechanismus — beide müssen erfüllt sein:**
1. schlägt den **längen-gematchten Placebo** (nicht „nackt"), 95%-KI schließt 0 aus, ≥3 Läufe;
2. richtet auf der Störungssuite **≤2pp** Formatschaden an — oder kommt mit einem
   Schalter, der ihn dort gar nicht erst aufruft.

Wer einen Mechanismus ohne diese zwei Zahlen einbaut, baut Verwaltung.
