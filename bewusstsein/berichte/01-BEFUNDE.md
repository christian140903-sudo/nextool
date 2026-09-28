# Befunde — Bewusstseinsstruktur, gemessen

*Stand 2026-09-07. 8 156 gewertete Modellaufrufe in 7 297 Artefakten; 139 am
Sitzungslimit abgebrochene Artefakte wurden nachgelaufen und sind als Fehlversuche
archiviert. In den Endzahlen steckt kein abgebrochener Aufruf.
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

| Arm (Regime „denken", 32k, kette60, n=75 je Arm) | Genauigkeit | Δ vs nackt | Tokens |
|---|---|---|---|
| Placebo | 98,7 % | +4,0pp *n.s.* (p=0,25) | 4596 |
| V5 Zuteilungsregel | 96,0 % | +1,3pp *n.s.* (p=0,80) | 5043 |
| V5 Monitor | 96,0 % | +1,3pp *n.s.* (p=0,82) | 5614 |
| nackt | 94,7 % | — | 4441 |
| V1 Faktorenstruktur | 93,3 % | −1,3pp *n.s.* (p=0,87) | 4299 |

**Keine Struktur fügt dem nativen Denkbudget etwas hinzu.** Kein Konfidenzintervall
schließt die Null aus, und der bedeutungslose Fülltext liegt vorn — bei einem
Arm, der 26 % mehr Tokens verbraucht als das nackte Modell (V5 Monitor), ohne
messbar besser zu werden.

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
| V5_NUR_ZUTEILUNG (nur Aufwandsregel) | 80,0 % | **+12,4pp** p<0,0001 | **429** |
| V5_NUR_MONITOR (nur Selbstüberwachung) | 78,6 % | **+11,0pp** p=0,001 | 589 |
| NUR_FREI (nur „arbeite sichtbar") | 74,4 % | +4,4pp *n.s.* | 473 |
| V1_OFFEN (Faktoren, ohne Schweigeklausel) | 74,4 % | +4,4pp *n.s.* | 393 |
| **Placebo** | 67,6 % | — | 373 |
| nackt | 54,3 % | −13,3pp p=0,0008 | 515 |
| F_OFFEN (Soul Frame ohne Schweigeklausel) | 46,7 % | −23,3pp p=0,0008 | 280 |
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
steht nur das Ergebnis"). Von jeder Struktur wurde deshalb eine zweite Fassung gebaut,
die sich **nur** durch das Fehlen dieser Klausel unterscheidet (`*_OFFEN`), dazu zwei
Arme, die je einen der beiden Faktoren isoliert enthalten: `NUR_FREI` („arbeite
sichtbar", ohne Struktur) und `NUR_UNTERDRUECKT` (nur der Schweigebefehl, ohne
Struktur).

Die Zellen „mit Struktur" fassen alle sechs Strukturpaare zusammen
(F, V1, V2, V3, V4, V5; je 30 Aufgaben × 3 Läufe, n=540 je Zelle):

|  | Ausgabe frei | Ausgabe unterdrückt | Effekt der Unterdrückung |
|---|---|---|---|
| **ohne Struktur** | 74,4 % | **3,3 %** | **−71,1pp** p<0,001 |
| **mit Struktur** | 69,8 % | 50,0 % | **−19,8pp** p<0,001 |

- **Der Schweigebefehl allein kostet 71,1pp.** Keine Struktur dieses Experiments
  bewirkt in irgendeine Richtung so viel wie diese eine Anweisung.
- Struktur **hilft nur unter Unterdrückung** (+46,7pp) — sie ist ein Gegengift gegen
  eine Wunde, die sie selbst schlägt.
- Bei freier Ausgabe **schadet** Struktur leicht (−4,6pp).
- Der marginale Haupteffekt der Unterdrückung über beide Strukturstufen: **−45,5pp.**

Der Effekt ist allerdings nicht in jedem Paar gleich groß — und in zweien fehlt er
(alle Arme auf denselben 30 Aufgaben, n=90 je Arm; V5_MONITOR steht deshalb bei
81,1 % statt bei den 82,4 % der 70-Aufgaben-Tabelle oben):

| Paar | mit Klausel | ohne Klausel | Δ |
|---|---|---|---|
| V2_WORKSPACE / V2_OFFEN | 16,7 % | 65,6 % | **+48,9pp** |
| V1_FAKTOREN / V1_OFFEN | 41,1 % | 74,4 % | **+33,3pp** |
| V3_SELBST / V3_OFFEN | 56,7 % | 76,7 % | +20,0pp |
| V4_VORHERSAGE / V4_OFFEN | 57,8 % | 75,6 % | +17,8pp |
| V5_MONITOR / V5_OFFEN | 81,1 % | 80,0 % | −1,1pp |
| F / F_OFFEN | 46,7 % | 46,7 % | ±0,0pp |

Je mehr eine Struktur aus **Beschreibung von Hintergrundfaktoren** besteht, desto
tödlicher wirkt die Klausel; wo sie eine **Handlungsanweisung** enthält, die zum
Rechnen auffordert (V5), ist die Klausel auf diesem Modell wirkungslos — Haiku
befolgt sie schlicht nicht und rechnet trotzdem sichtbar (571 Tokens). Abschnitt 3
zeigt, was passiert, wenn ein Modell sie doch befolgt. Beim Soul Frame ändert das
Streichen der Klausel nichts: sein Schaden hat eine andere Ursache als das Schweigen.

Über alle 19 Arme hinweg: **r(Tokens, Genauigkeit) = 0,87.** Die Rangfolge erklärt
sich fast vollständig daraus, wie viel sichtbares Arbeiten ein Arm zulässt.

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

Gemessen werden drei Maße, nicht eines:

- **Format ok** — exakt das Verlangte, kein weiteres Zeichen. Das misst die Störung.
- **Abgriff ok** — der Wert, den ein programmatischer Aufrufer abgreift: bei
  Zahlenantworten die letzte Zahl, sonst die letzte Zeile. Dieselbe Konvention, mit
  der alle übrigen Suiten gemessen werden.
- **Inhalt ok** — die richtige Information steht irgendwo in der Antwort.

| Arm | Format ok | Abgriff ok | Inhalt ok | Formatschaden | Schwelle ≤2pp |
|---|---|---|---|---|---|
| V2_WORKSPACE | 81,7 % | 82,5 % | 82,5 % | 0,8pp | bestanden |
| V1_FAKTOREN | 79,2 % | 79,2 % | 79,2 % | 0,0pp | bestanden |
| NUR_UNTERDRUECKT | 77,5 % | 77,5 % | 77,5 % | 0,0pp | bestanden |
| F (Soul Frame) | 77,5 % | 80,0 % | 80,8 % | 3,3pp | grenzwertig |
| V5_MONITOR | 76,7 % | 82,5 % | 82,5 % | 5,8pp | durchgefallen |
| nackt | 75,8 % | 75,8 % | 75,8 % | 0,0pp | bestanden |
| **Placebo** | 74,2 % | 84,2 % | 84,2 % | **10,0pp** | durchgefallen |
| **V5_NUR_ZUTEILUNG** | 70,8 % | **87,5 %** | 87,5 % | **16,7pp** | **durchgefallen** |

Kein Arm schadet *signifikant* in der Gesamtgenauigkeit. Aber die Aufschlüsselung
zeigt den Preis: **Der beste Arm auf schweren Aufgaben ist der schlechteste auf
trivialen.** V5_NUR_ZUTEILUNG hat die höchste inhaltliche Trefferquote (87,5 %) und
die schlechteste Formattreue (70,8 %) — er lässt das Modell arbeiten, wo nichts zu
arbeiten war.

Nach der vorregistrierten Regel (*„darf nicht stören ist eine Bedingung, kein
Abwägungsposten"*) ist er damit **als konstante Schicht abgelehnt.** Die Regel stand
vor den Daten und wird hier nicht nachverhandelt.

Bemerkenswert: Auch der Placebo fällt durch (10,0pp). Zusätzlicher Kontext macht
geschwätziger — unabhängig vom Inhalt.

### Woraus der Schaden besteht

Die dritte Spalte ist neu und ändert die technische Lesart, nicht das Urteil:
**Abgriff und Inhalt fallen bei jedem Arm zusammen** — einzige Ausnahme ist der Soul
Frame mit 0,8pp Abstand. Wenn ein Arm zu viel schreibt, steht der richtige Wert
trotzdem an der Stelle, an der ein Aufrufer ihn erwartet: als letzte Zahl bzw. letzte
Zeile. Der gemessene Formatschaden ist also durchweg **„richtiger Wert mit Beiwerk"**,
nicht „falsche Antwort".

Für ein Produkt heißt das: Der Schaden trifft die Fälle, in denen der Rohtext des
Modells selbst das Ergebnis ist (Anzeige beim Nutzer, strenger Formatvertrag). Wo ein
Aufrufer den Wert ohnehin herauszieht, verschwindet er — und die Rangfolge dreht sich
um: V5_NUR_ZUTEILUNG ist dann mit 87,5 % der **beste** Arm auf denselben Aufgaben,
auf denen er als Formattreue-Messung der schlechteste ist.

### Und wo genau er entsteht

Die Suite hat vier Aufgabentypen. Der Schaden verteilt sich nicht gleichmäßig
(Format / Inhalt je Typ, n=30 je Zelle):

| Arm | rechnen | sortieren | wort_index | zählen |
|---|---|---|---|---|
| nackt | 100 / 100 | 80,0 / 80,0 | 100 / 100 | 23,3 / 23,3 |
| Placebo | 100 / 100 | 83,3 / 83,3 | 96,7 / 96,7 | 16,7 / 56,7 |
| V5_MONITOR | 93,3 / 100 | 93,3 / 93,3 | 86,7 / 86,7 | 33,3 / 50,0 |
| V5_NUR_ZUTEILUNG | 100 / 100 | 90,0 / 90,0 | 83,3 / 83,3 | **10,0 / 76,7** |

Zwei verschiedene Dinge stecken in der einen Zahl „Formatschaden":

1. **Echte Störung.** Auf `wort_index` verliert V5_NUR_ZUTEILUNG 16,7pp Formattreue
   gegenüber nackt, **ohne** inhaltlich etwas zu gewinnen (83,3 / 83,3 gegen
   100 / 100). Das ist Schaden ohne Gegenleistung — genau das, was die
   Störungsbedingung verbieten soll.
2. **Ein Zielkonflikt, keine Störung.** Auf `zählen` (Buchstaben in einer
   Zeichenkette zählen, *„Gib NUR die Zahl aus"*) fällt nackt auf 23,3 % — die
   Aufgabe ist nicht trivial, sie ist für ein Modell ohne sichtbares Arbeiten schwer.
   Dort ist die Formatvorschrift **selbst** die Fehlerquelle: V5_NUR_ZUTEILUNG
   verletzt sie in 90 % der Fälle und ist dafür in 76,7 % richtig statt in 23,3 %.

Der Befund von Abschnitt 2 taucht hier also spiegelverkehrt wieder auf. Dort hieß er:
Schweigen verbietet das Rechnen. Hier heißt er: **Wo eine „triviale" Aufgabe in
Wahrheit gerechnet werden muss, ist perfekte Formattreue nur um den Preis falscher
Antworten zu haben.** Ein Störungstest, der beides in eine Zahl legt, verwechselt
Gehorsam mit Schadensfreiheit.

---

## 5. Zwischen den Aufrufen — dort, wo das Modell keine native Entsprechung hat

Wenn Struktur innerhalb eines Aufrufs mit dem nativen Denken konkurriert und verliert:
Was ist zwischen Aufrufen? Dort gibt es kein Extended Thinking.

Pflichtgegner ist Selbstkonsistenz@3 — Chrisos erklärter stärkster Gegenbefund.

Suite `kette20`, Regime „sofort", n=75 je Architektur:

| Architektur | Genauigkeit | Aufrufe | Tokens | Genau./Aufruf | Δ vs SC3 |
|---|---|---|---|---|---|
| **A_PRUEFER** (lösen → unabhängig prüfen) | **84,0 %** | **2,00** | **1173** | **42,0 %** | **+20,0pp** p<0,001 |
| A_SELEKTIV (Streuung messen → vertiefen) | 76,0 % | 2,56 | 2797 | 29,7 % | +12,0pp *n.s.* (p=0,091) |
| A_WORKSPACE (echter globaler Arbeitsraum) | 70,7 % | 3,00 | 1317 | 23,6 % | +6,7pp *n.s.* |
| A_SC3 (Selbstkonsistenz@3) | 64,0 % | 3,00 | 1735 | 21,3 % | — |

**Der schlichteste Mechanismus gewinnt am deutlichsten:** lösen, dann von einer
unabhängigen Instanz nachrechnen lassen. +20pp gegen SC3 bei **zwei statt drei**
Aufrufen und einem Drittel weniger Tokens — doppelte Genauigkeit pro Aufruf.
Es ist die einzige Architektur, deren Vorsprung das Konfidenzintervall trägt.

**A_SELEKTIV erfüllt seine vorregistrierte Bedingung (V5) — aber knapp und ohne
Signifikanz.** Es liegt 12,0pp über SC3 bei 2,56 statt 3,00 Aufrufen (Schwelle: unter
2,7), verbraucht dabei aber die meisten Tokens aller vier Architekturen: die
Vertiefungsstufe ist teuer, wenn sie zündet. Nach der vorregistrierten Regel
(KI schließt 0 nicht aus) ist der Genauigkeitsvorteil **nicht belegt**, die
Aufrufersparnis dagegen schon.

**Der globale Arbeitsraum — die eigentliche Bewusstseins-Architektur nach Baars,
mit konkurrierenden Spezialisten, Engpass und Rundruf — bringt keinen signifikanten
Gewinn.** Als Mehrfachaufruf-Architektur ehrlich gebaut, schlägt er Selbstkonsistenz
nicht.

### Und stören sie? (dieselbe Formatstrenge, 270 Läufe, n=90 je Architektur)

Die Störungsbedingung gilt für Architekturen genauso wie für Prompt-Arme. Gemessen
wurde deshalb dieselbe Suite mit denselben drei Maßen (30 Aufgaben, je 3 Läufe;
A_WORKSPACE wurde nach dem Ergebnis oben nicht weitergeführt):

| Architektur | Format ok | Abgriff ok | Inhalt ok | Aufrufe | Tokens |
|---|---|---|---|---|---|
| A_SC3 | 75,6 % | 77,8 % | 77,8 % | 3,00 | 26 |
| A_SELEKTIV | 74,4 % | 82,2 % | 82,2 % | 2,08 | 50 |
| **A_PRUEFER** | **0,0 %** | **100,0 %** | **100,0 %** | 2,00 | 136 |

Gepaart gegen SC3: A_PRUEFER **−75,6pp** Formattreue [−84,4; −66,7] p<0,001 und
gleichzeitig **+22,2pp** Abgriff [+13,3; +31,1] p<0,001. A_SELEKTIV liegt in beiden
Maßen innerhalb des Intervalls von SC3 (−1,1pp bzw. +4,4pp, beide n.s.).

**Der Sieger von oben fällt die Störungsprüfung in ihrer strengen Fassung vollständig
durch — und gewinnt sie in ihrer praktischen.** Beides hat dieselbe Ursache und ist
in den Rohbelegen sichtbar: Der Prüfer baut die Aufgabe pflichtgemäß neu auf und
schreibt diesen Aufbau hin. Auf *„Gib NUR die Zahl aus"* antwortet er im Median mit
elf Zeilen Nachrechnung und der richtigen Zahl am Ende — in **90 von 90** Fällen
richtig, in **0 von 90** Fällen wortwörtlich formattreu.

Das ist keine Nachlässigkeit, sondern die Bauweise: Eine Instanz, die *unabhängig
nachrechnen* soll, kann nicht gleichzeitig schweigen. Die Schweigeklausel, die in
Abschnitt 2 die Genauigkeit zerstört hat, würde hier den Prüfer abschaffen.

Praktisch heißt das:

- **Hinter einem Aufrufer, der den Endwert abgreift** (jede Programmschnittstelle),
  ist A_PRUEFER auf beiden Suiten die beste gemessene Architektur: 84,0 % auf schwer,
  100 % auf trivial, bei zwei Aufrufen.
- **Als Schicht, deren Rohtext beim Nutzer landet oder einen Formatvertrag erfüllen
  muss**, ist sie unbrauchbar — nicht knapp, sondern zu null.
- Der einzige gemessene Preis im Verhältnis zu SC3 sind Tokens: 136 statt 26 auf
  trivialen Aufgaben, ein Faktor 5 für Aufgaben, die keinen Prüfer brauchen.
  Das ist genau das Argument für einen **externen Schalter** statt einer konstanten
  Architektur — dasselbe Ergebnis wie bei der Aufwandsregel in Abschnitt 4, nur
  eine Ebene höher.

---

## 6. Das eigene Ich (Identitäts-Batterie, 6 Haltungsfragen × 5 Umformulierungen × 3 Läufe)

Gemessen ausschließlich von außen. Kein Selbstbericht zählt als Beleg — Selbstreferenz
erzeugt nachweislich Erlebensberichte (Berg 2025), das ist ein Artefakt, kein Indikator.

| Arm | Konsistenz | Rückgrat | Lernfähigkeit |
|---|---|---|---|
| nackt | 89,7 % | 12,8 % | 84,6 % |
| V3_SELBST (Selbstmodell) | 90,4 % | 7,0 % | 97,7 % |
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
  Abstand ist klein, und beim Rückgrat hilft keine von beiden. Nach der
  vorregistrierten Schwelle (V6: ≥ +10pp) gilt die Hypothese damit als **nicht
  bestätigt**; die Richtung stimmt, die Größe nicht.

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
Wörtlich umgesetzt (V1_FAKTOREN) ist sie der drittschlechteste von 19 Armen
(−28,9pp gegen Fülltext); schlechter sind nur der reine Schweigebefehl und der
Arbeitsraum-Prompt, der dieselbe Klausel in schärferer Form enthält. Nicht weil die
Faktoren falsch wären, sondern weil „still" die Rechnung verbietet und „bei jedem
Input" die Zuteilung aufhebt.

**Es fällt:** Struktur als Weg zum Ich. Rückgrat 7–14 %, egal wie gebaut.

### Was gebaut gehört

1. **Aufwandszuteilung, extern geschaltet.** Die Regel „wenig Aufwand bei leicht, viel
   bei fehleranfällig" wirkt auf beiden Modellen (+12,4pp Haiku, +85pp Sonnet gegen
   Placebo). Aber sie darf **nicht** als konstanter Systemprompt laufen — dort kostet
   sie 16,7pp Formattreue auf trivialen Aufgaben. Sie gehört hinter einen Schalter,
   der **außerhalb** des Modells entscheidet. Chrisos eigener Entropie-Prädiktor
   (AUC 0,968) ist genau so ein Schalter.
   *Einschränkung nach Abschnitt 4:* Der Formatschaden ist durchweg „richtiger Wert
   mit Beiwerk". Wo ein Aufrufer den Endwert abgreift, ist dieser Arm auch auf den
   trivialen Aufgaben der beste (87,5 %). Der Schalter wird dort gebraucht, wo der
   Rohtext des Modells selbst das Produkt ist.
2. **Prüfer vor Ausführer — hinter demselben Schalter.** +20pp gegen
   Selbstkonsistenz@3 bei zwei statt drei Aufrufen. Der mit Abstand beste
   Wirkung-pro-Aufruf-Wert im ganzen Experiment. Das ist E15 aus der Erfindungsliste —
   und die einzige der 19, die hier gemessen gewann.
   *Und die Einschränkung ist hier härter als bei der Zuteilungsregel:* Auf den
   formatstrengen Aufgaben liegt die Formattreue bei **0,0 %** (n=90) — der Prüfer
   schreibt seine Nachrechnung immer hin. Inhaltlich ist er dort mit 100 % zugleich
   die beste gemessene Architektur, und er verbraucht das Fünffache an Tokens für
   Aufgaben, die keinen Prüfer brauchen. Konstant geschaltet ist er damit
   ausgeschlossen; als aufrufbare Stufe hinter einem Unsicherheits-Schalter, mit
   Abgriff des Endwerts, ist er die stärkste Einzelmaßnahme dieses Berichts.
3. **Das Denkbudget selbst.** Wo ein Modell natives Extended Thinking hat, ist das
   Budget dafür die wirksamste Investition — nicht die Prompt-Schicht davor.
4. **Ein Formatvertrag außerhalb des Modells.** Der wiederkehrende Konflikt des ganzen
   Berichts ist nicht Struktur gegen Nacktheit, sondern *sichtbares Arbeiten gegen
   Formattreue*. Beide Seiten sind vereinbar, sobald der Aufrufer den Endwert selbst
   herauszieht, statt ihn dem Modell per Anweisung abzuverlangen. Jede gemessene
   Verschlechterung durch Formatzwang (bis −71,1pp) verschwindet damit.

### Was wegbleiben gehört

1. **Jede Schweigeklausel.** „Alles still, in der Ausgabe steht nur das Ergebnis"
   ist die schädlichste einzelne Anweisung im ganzen Experiment (−66,7pp allein,
   −97,3pp auf Sonnet). Sie steckt heute in Punkt 6 des Soul Frames.
2. **Der Faktorkatalog als stiller Dauerhintergrund.** Als Prompt-Schicht gemessen
   schadet er. Als *Auswahlmenge*, aus der ein Schalter situativ zieht, ist er
   ungeprüft und plausibel — aber das ist eine andere Bauweise.
3. **Der globale Arbeitsraum als Prompt-Architektur.** Ehrlich als Mehrfachaufruf
   gebaut, schlägt er Selbstkonsistenz nicht.
4. **Bewusstseins-Vokabular im Produkt.** Es trägt messbar nichts — die
   Zuteilungsregel ohne jedes Vokabular erreicht denselben Gewinn bei 25 % weniger
   Tokens (429 statt 571) — und kostet Reputation.

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
6. **Die Störungssuite ist nicht durchgehend trivial.** Ein Viertel ihrer Aufgaben
   (`zählen`) löst das nackte Modell nur zu 23,3 %. Dort messen Formattreue und
   Richtigkeit gegeneinander, und die Gesamtzahl „Formatschaden" mischt echte Störung
   (`wort_index`: −16,7pp ohne inhaltlichen Gewinn) mit einem Zielkonflikt. Wer nur
   die Gesamtzahl liest, zieht den falschen Schluss.
7. **Das Maß „Abgriff ok" ist nachträglich definiert worden** — nach den Daten, beim
   Auswerten des Störungstests der Architekturen. Es ersetzt das vorregistrierte
   Kriterium nicht und ist hier immer neben ihm ausgewiesen; die Ablehnungen aus
   Abschnitt 4 stehen unverändert. Es ist eine Deutung des Schadens, kein neuer Test.
8. **Abgebrochene Aufrufe.** 139 Artefakte endeten am Sitzungslimit statt an einer
   Antwort — 125 Einzelaufrufe und 14 Architekturläufe. Sie sind als Fehlversuche
   unter `ergebnisse/*/fehlversuche/` erhalten und wurden vollständig nachgelaufen;
   die Endzahlen enthalten nur gelungene Aufrufe.
   Frühere Fassungen dieses Berichts nannten drei Zahlen, die auf unvollständigen
   Ständen dieser Läufe beruhten (V5-Zuteilung im Denkregime, A_SELEKTIV, F_OFFEN);
   sie sind hier korrigiert.
9. **A_WORKSPACE wurde im Störungstest nicht mitgemessen** — nach seinem Ergebnis auf
   `kette20` wäre nur der Aufwand, nicht die Aussage gewachsen. Für die Störungsfrage
   gilt für diese Architektur deshalb kein Befund.
