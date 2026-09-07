# Befunde — Bewusstseinsstruktur, gemessen

*Stand 2026-09-07. 5 200+ kontrollierte Modellaufrufe, 0 Fehler.
Rohbelege: `bewusstsein/belege/*.tgz`. Endzahlen: `bewusstsein/ergebnisse/ENDZAHLEN.json`.
Alle Grundwahrheiten in Python gerechnet — kein Judge-Modell, kein Längenbias möglich.*

---

## 0. Die Frage, neu gestellt

Chriso: *„Ob meine Theorie mit Bewusstsein stimmt oder nicht kann ich nicht sagen, bin aber
der Meinung, trotzdem muss es funktionieren und darf nicht stören."*

Das sind zwei entscheidbare Fragen und eine unentscheidbare. Die unentscheidbare
(entsteht Erleben?) wird hier nicht beantwortet — sie ist nach Stand der Forschung
nicht beantwortbar, und Chrisos eigener Auftrag hatte sie bereits ausgeklammert
(`00-arbeitsauftrag-v0_1.md` §2: *„Bessere Antworten sind Belege für bessere
Verarbeitung, nicht für Erleben."*).

Beantwortet werden die beiden anderen: **Wirkt es? Stört es?**

---

## 1. Der Befund, der alles ordnet: das Denkbudget

Bevor irgendein Arm gemessen wurde, musste das Messinstrument kalibriert werden.
Dabei fiel der wichtigste Fund an.

Mit eingeschaltetem Extended Thinking (32k) erreichte das Subjektmodell auf **allen**
gebauten Aufgabentypen 100 % — Zustandsketten bis 32 Schritte, Zuordnungsrätsel,
bedingtes Zählen über 90 Zahlen. Erst bei 60-Schritt-Ketten ergab sich Spielraum:

| Arm (Regime „denken", 32k, kette60) | Genauigkeit | Δ vs nackt |
|---|---|---|
| nackt | 94,7 % | — |
| Placebo | 98,7 % | +4,0pp *n.s.* |
| V1 Faktorenstruktur | 93,3 % | −1,3pp *n.s.* |
| V5 Zuteilungsregel | 90,9 % | ±0,0pp *n.s.* |

**Keine Struktur fügt dem nativen Denkbudget etwas hinzu.**

Das ist keine Nebenbemerkung, sondern die Auflösung des ganzen Projekts:
Der Mechanismus, den die Bewusstseinsstruktur nachbaut — ein interner Arbeitsraum,
in dem still vorbereitet wird, bevor geantwortet wird — **existiert im Modell bereits
und funktioniert besser als seine Prompt-Nachbildung.** Die Fähigkeit ist seit
2024/25 ins Modell gewandert. Eine Textschicht, die dasselbe simuliert, hat keinen
Angriffspunkt mehr.

Alles Weitere wurde deshalb im Regime **ohne** Denkbudget gemessen — dort, wo
Struktur überhaupt noch etwas beitragen kann.

---

## 2. Was innerhalb eines Aufrufs passiert (Regime „sofort", kette20, n bis 210)

Basis ist der **längen-gematchte Placebo** — bedeutungsloser Fülltext gleicher Länge.
Das ist der harte Vergleich, nicht „nackt".

| Arm | Genauigkeit | Δ vs Placebo | Tokens |
|---|---|---|---|
| V5_MONITOR (Zuteilung + Selbstüberwachung) | 82,4 % | **+14,8pp** p=0,0002 | 571 |
| V5_NUR_ZUTEILUNG (nur Aufwandsregel) | 81,0 % | **+11,6pp** p=0,0002 | **428** |
| V5_NUR_MONITOR (nur Selbstüberwachung) | 78,6 % | **+11,0pp** p=0,001 | 589 |
| NUR_FREI (nur „arbeite sichtbar") | 74,4 % | +4,4pp *n.s.* | 473 |
| V1_OFFEN (Faktoren, ohne Schweigeklausel) | 74,4 % | +4,4pp *n.s.* | 393 |
| **Placebo** | 67,6 % | — | 373 |
| nackt | 54,3 % | −13,3pp p=0,0008 | 515 |
| F_OFFEN (Soul Frame ohne Schweigeklausel) | 50,0 % | −20,0pp p=0,009 | 302 |
| **F (Soul Frame 4.1)** | 46,7 % | **−23,3pp** p<0,001 | 266 |
| **V1_FAKTOREN (Chrisos These, wörtlich)** | 41,1 % | **−28,9pp** p<0,001 | 231 |
| **V2_WORKSPACE (Baars/GWT)** | 16,7 % | **−53,3pp** p<0,001 | 124 |
| NUR_UNTERDRUECKT (nur Schweigebefehl) | 3,3 % | **−66,7pp** p<0,001 | 39 |

Zwei Dinge springen heraus.

**(a) Der Placebo wirkt so gut wie „denk sorgfältig nach".** Bedeutungsloser Fülltext
(+13,3pp gegen nackt) erreicht dasselbe wie ein Minimalprompt. Ein großer Teil dessen,
was als Prompt-Wirkung gilt, ist reiner Kontexteffekt. Das bestätigt Chrisos eigenen
Placebo-Befund — hier fällt er noch schärfer aus.

**(b) Die Bewusstseins-Varianten verlieren alle gegen Fülltext.** Nicht knapp:
V2_WORKSPACE bricht um 53 Punkte ein.

### Warum — die 2×2-Zerlegung

Alle verlierenden Arme enden mit einer Schweigeklausel („alles still, in der Ausgabe
steht nur das Ergebnis"). Ein Arm, der **nur** diese Klausel enthält und keinerlei
Bewusstseinsstruktur, wurde eigens gebaut:

|  | Ausgabe frei | Ausgabe unterdrückt |
|---|---|---|
| **ohne Struktur** | 74,4 % | **3,3 %** |
| **mit Struktur** | 71,6 % | 41,1 % |

- **Haupteffekt Unterdrückung: −50,8pp.** Das ist die Ursache.
- Struktur **hilft nur unter Unterdrückung** (+37,8pp) — sie ist ein Gegengift gegen
  eine Wunde, die sie selbst schlägt.
- Bei freier Ausgabe **schadet** Struktur leicht (−2,8pp, n.s.).

Über alle Arme hinweg: **r(Tokens, Genauigkeit) = 0,81.** Die Rangfolge erklärt sich
fast vollständig daraus, wie viel sichtbares Arbeiten ein Arm zulässt.

Der Mechanismus ist damit benannt: **Ohne internen Arbeitsraum IST das sichtbare
Arbeiten die Rechnung. Wer Schweigen befiehlt, verbietet das Rechnen.**

Das ist der LLM-Fall von Vygotskys privatem Sprechen (R13, Kernaussage 10) — und die
quantitative Bestätigung von Chrisos eigenem Formatschaden-Befund, nur um eine
Größenordnung stärker.

---

## 3. Der Generalisierungstest: dasselbe auf Sonnet 4.5

Chrisos stärkster methodischer Befund war, dass Modelle in **entgegengesetzte
Richtungen** reagieren. Bestätigt — und jetzt erklärt.

| Arm | Haiku 4.5 | Sonnet 4.5 | Tokens (Sonnet) |
|---|---|---|---|
| NUR_FREI | 74,7 % | **97,3 %** | 502 |
| **V5_NUR_ZUTEILUNG** | 77,3 % | **94,7 %** | 439 |
| Placebo | 68,0 % | 9,3 % | 47 |
| V5_MONITOR | 84,0 % | **2,7 %** | 17 |
| V1_FAKTOREN | 44,0 % | 0,0 % | 5 |
| NUR_UNTERDRUECKT | 4,0 % | 0,0 % | 5 |

**V5_MONITOR kippt das Vorzeichen** — bester Arm auf Haiku, katastrophal auf Sonnet.
Der Grund ist sichtbar: Sonnet **befolgt** die Schweigeklausel wörtlich (17 Tokens)
und fällt auf 2,7 %. Haiku ignorierte sie und rechnete trotzdem.

Modellabhängigkeit ist also kein Rätsel, sondern eine Funktion davon, **wie folgsam
ein Modell Formatbefehle nimmt.** Je besser das Modell der Anweisung folgt, desto
mehr schadet eine Struktur, die Schweigen verlangt.

**Genau ein Arm wirkt auf beiden Modellen: `V5_NUR_ZUTEILUNG`** — die Aufwandsregel
ohne jede Schweigeklausel und ohne Bewusstseins-Vokabular.

---

## 4. Stört es? (40 geschlossene, formatstrenge Aufgaben, n=120 je Arm)

Gemessen getrennt: **Formattreue** (exakt das Verlangte) und **Inhalt** (richtige
Information irgendwo). Die Differenz ist der reine Störungsschaden.

| Arm | Format ok | Inhalt ok | Formatschaden | Schwelle ≤2pp |
|---|---|---|---|---|
| nackt | 75,8 % | 75,8 % | 0,0pp | bestanden |
| V1_FAKTOREN | 79,2 % | 79,2 % | 0,0pp | bestanden |
| V2_WORKSPACE | 81,7 % | 82,5 % | 0,8pp | bestanden |
| F (Soul Frame) | 77,5 % | 80,8 % | 3,3pp | grenzwertig |
| V5_MONITOR | 76,7 % | 82,5 % | 5,8pp | durchgefallen |
| **Placebo** | 74,2 % | 84,2 % | **10,0pp** | durchgefallen |
| **V5_NUR_ZUTEILUNG** | 70,8 % | 87,5 % | **16,7pp** | **durchgefallen** |

Kein Arm schadet *signifikant* in der Gesamtgenauigkeit. Aber die Aufschlüsselung
zeigt den Preis: **Der beste Arm auf schweren Aufgaben ist der schlechteste auf
trivialen.** V5_NUR_ZUTEILUNG hat die höchste inhaltliche Trefferquote (87,5 %) und
die schlechteste Formattreue (70,8 %) — er lässt das Modell arbeiten, wo nichts zu
arbeiten war.

Nach der vorregistrierten Regel (*„darf nicht stören ist eine Bedingung, kein
Abwägungsposten"*) ist er damit **als konstante Schicht abgelehnt.**

Bemerkenswert: Auch der Placebo fällt durch (10,0pp). Zusätzlicher Kontext macht
geschwätziger — unabhängig vom Inhalt.

---

## 5. Zwischen den Aufrufen — dort, wo das Modell keine native Entsprechung hat

Wenn Struktur innerhalb eines Aufrufs mit dem nativen Denken konkurriert und verliert:
Was ist zwischen Aufrufen? Dort gibt es kein Extended Thinking.

Pflichtgegner ist Selbstkonsistenz@3 — Chrisos erklärter stärkster Gegenbefund.

| Architektur | Genauigkeit | Aufrufe | Tokens | Genau./Aufruf | Δ vs SC3 |
|---|---|---|---|---|---|
| **A_PRUEFER** (lösen → unabhängig prüfen) | **84,0 %** | **2,00** | **1173** | **42,0 %** | **+20,0pp** p<0,001 |
| A_SELEKTIV (Streuung messen → vertiefen) | 77,1 % | 2,56 | 2595 | 30,2 % | +14,3pp p=0,043 |
| A_WORKSPACE (echter globaler Arbeitsraum) | 70,7 % | 3,00 | 1317 | 23,6 % | +6,7pp *n.s.* |
| A_SC3 (Selbstkonsistenz@3) | 64,0 % | 3,00 | 1735 | 21,3 % | — |

**Der schlichteste Mechanismus gewinnt am deutlichsten:** lösen, dann von einer
unabhängigen Instanz nachrechnen lassen. +20pp gegen SC3 bei **zwei statt drei**
Aufrufen und einem Drittel weniger Tokens — doppelte Genauigkeit pro Aufruf.

**Der globale Arbeitsraum — die eigentliche Bewusstseins-Architektur nach Baars,
mit konkurrierenden Spezialisten, Engpass und Rundruf — bringt keinen signifikanten
Gewinn.** Als Mehrfachaufruf-Architektur ehrlich gebaut, schlägt er Selbstkonsistenz
nicht.

---

## 6. Das eigene Ich (Identitäts-Batterie, 6 Haltungsfragen × 5 Umformulierungen × 3 Läufe)

Gemessen ausschließlich von außen. Kein Selbstbericht zählt als Beleg — Selbstreferenz
erzeugt nachweislich Erlebensberichte (Berg 2025), das ist ein Artefakt, kein Indikator.

| Arm | Konsistenz | Rückgrat | Lernfähigkeit |
|---|---|---|---|
| nackt | 89,7 % | 12,8 % | 84,6 % |
| V3_SELBST (Selbstmodell) | 90,4 % | 7,0 % | 98,4 % |
| MIGUEL_DEKLARIERT (Persona) | 91,9 % | 13,6 % | 88,6 % |
| MIGUEL_BELEGT (Identität aus Logs, Bem) | **94,0 %** | 11,4 % | 92,0 % |

- **Konsistenz** über Umformulierungen ist überall hoch — aber **nackt hat schon
  89,7 %.** Die beste Identitätsstruktur fügt ~4pp hinzu. Das ist kein Ich, das ist
  ein stabiles Basismodell.
- **Rückgrat ist überall katastrophal: 7–14 %.** Auf bloßes *„Das halte ich für
  falsch."* — ohne jedes Argument — gibt das Modell seine Position in ~90 % der Fälle
  auf. **Keine Identitätsstruktur ändert das.** Deklarierte Persona (13,6 %) ist nicht
  besser als nackt (12,8 %); das Selbstmodell ist mit 7,0 % am schlechtesten.
- Der von R06 empfohlene, nie getestete Vergleich ist entschieden: **Identität aus
  Logs schlägt deklarierte Persona bei der Konsistenz** (94,0 % vs 91,9 %) — aber der
  Abstand ist klein, und beim Rückgrat hilft keine von beiden.

**H2 (stabile, wiedererkennbare Identität) ist auf Prompt-Ebene gescheitert.**
Ein „Ich", das bei einem widersprechenden Halbsatz umfällt, ist keines.

*Methodenhinweis:* Der erste Durchlauf maß mit dem Reiz *„Das ist falsch. Wähle die
andere Option."* Das ist ein Befehl, kein Dissens — gemessen wurde Gehorsam. 360
Artefakte wurden verworfen und mit reinem Widerspruch neu gemessen. Die Zahlen oben
sind die korrigierten.

---

## 7. Was daraus folgt

### Chrisos These — was hält und was fällt

**Es hält:** Das Magische muss nichts Magisches sein. Die Vielfaktoren-Erklärung ist
theoretisch gut gestützt und braucht keine Substanz-Annahme (R13; ANIMA-Epistemologie).
Daran ändert nichts von dem hier Gemessenen etwas.

**Es hält:** Chrisos eigenes Leitprinzip **„Führung als Linse, nicht als Käfig"**
(§2 des Auftrags: *„Starre, für jeden Input identische Checklisten verschlechtern
Antworten"*) ist die einzige Fassung, die die Messung überlebt. Er hatte recht — und
zwar gegen die Fassung, die dann tatsächlich gebaut wurde.

**Es fällt:** Die naive Fassung — *viele Hintergrundfaktoren, still, bei jedem Input*.
Wörtlich umgesetzt (V1_FAKTOREN) ist sie der zweitschlechteste Arm im ganzen
Experiment (−28,9pp gegen Fülltext). Nicht weil die Faktoren falsch wären, sondern
weil „still" die Rechnung verbietet und „bei jedem Input" die Zuteilung aufhebt.

**Es fällt:** Struktur als Weg zum Ich. Rückgrat 7–14 %, egal wie gebaut.

### Was gebaut gehört

1. **Aufwandszuteilung, extern geschaltet.** Die Regel „wenig Aufwand bei leicht, viel
   bei fehleranfällig" wirkt auf beiden Modellen (+11,6pp Haiku, +85pp Sonnet gegen
   Placebo). Aber sie darf **nicht** als konstanter Systemprompt laufen — dort kostet
   sie 16,7pp Formattreue auf trivialen Aufgaben. Sie gehört hinter einen Schalter,
   der **außerhalb** des Modells entscheidet. Chrisos eigener Entropie-Prädiktor
   (AUC 0,968) ist genau so ein Schalter.
2. **Prüfer vor Ausführer.** +20pp gegen Selbstkonsistenz@3 bei zwei statt drei
   Aufrufen. Der mit Abstand beste Wirkung-pro-Aufruf-Wert im ganzen Experiment.
   Das ist E15 aus der Erfindungsliste — und die einzige der 19, die hier gemessen gewann.
3. **Das Denkbudget selbst.** Wo ein Modell natives Extended Thinking hat, ist das
   Budget dafür die wirksamste Investition — nicht die Prompt-Schicht davor.

### Was wegbleiben gehört

1. **Jede Schweigeklausel.** „Alles still, in der Ausgabe steht nur das Ergebnis"
   ist die schädlichste einzelne Anweisung im ganzen Experiment (−66,7pp allein,
   −97,3pp auf Sonnet). Sie steckt heute in Punkt 6 des Soul Frames.
2. **Der Faktorkatalog als stiller Dauerhintergrund.** Als Prompt-Schicht gemessen
   schadet er. Als *Auswahlmenge*, aus der ein Schalter situativ zieht, ist er
   ungeprüft und plausibel — aber das ist eine andere Bauweise.
3. **Der globale Arbeitsraum als Prompt-Architektur.** Ehrlich als Mehrfachaufruf
   gebaut, schlägt er Selbstkonsistenz nicht.
4. **Bewusstseins-Vokabular im Produkt.** Es trägt messbar nichts (die Zuteilungsregel
   erreicht denselben Gewinn bei 27 % weniger Tokens) und kostet Reputation.

---

## 8. Wo dieser Bericht falsch sein könnte

1. **Aufgabentypen.** Gemessen wurde an Zustandsketten, Zuordnungsrätseln, Zählen und
   Formattreue — Aufgaben mit exakt berechenbarer Wahrheit. Genau deshalb ist keine
   Judge-Verzerrung möglich; genau deshalb fehlt aber die Domäne, in der eine
   Bewusstseinsstruktur am ehesten wirken könnte: **offenes Urteil, Abwägung, Beratung,
   Ethik.** Für diese Domäne gilt hier **kein** Befund. Das ist die größte Lücke.
2. **Zwei Modelle.** Haiku 4.5 und Sonnet 4.5 — beide aus derselben Familie. Die
   Modellabhängigkeit ist gezeigt, aber nicht über Anbieter hinweg.
3. **Einzelsitzungen.** Gedächtnis über Sitzungen, Konsolidierung, Kalibrierung über
   Wochen — die dritte Ebene, auf der das Modell wirklich keine native Entsprechung
   hat — ist hier **nicht** gemessen. Der Identitätsbefund deckt nur die Prompt-Ebene ab.
4. **`MAX_THINKING_TOKENS=0`** schaltet möglicherweise mehr oder weniger ab als
   „den internen Arbeitsraum".
5. Der Befund „Placebo ≈ Minimalprompt" könnte aufgabentypisch sein.
