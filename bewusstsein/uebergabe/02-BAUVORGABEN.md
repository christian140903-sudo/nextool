# Bauvorgaben — was bauen, was weglassen

*Jede Zeile trägt einen Messwert oder ist als ungeprüft gekennzeichnet.
Belege in `01-BEFUNDE.md`.*

---

## 1. Reihenfolge des Bauens (geändert gegenüber B1–B11)

Der Bauplan in `ordnung/` behandelt die drei Säulen als gleichrangig. Die Messung
sagt etwas anderes:

| Priorität | Säule | gemessener Hebel |
|---|---|---|
| **1** | Gedächtnis mit Herkunft | **+68,3 pp** (Wirkung), +95,0 pp (Kontaminationsschutz) |
| **2** | Prüfer vor Ausführer | **+20,0 pp** gegen SC@3 bei kleinerem Budget |
| **3** | Aufwandszuteilung, geschaltet | +11,6 pp, modellübergreifend |
| 4 | Ebenen/Delegation | **−13,9 pp** je erster Ebene — Kostenposten, kein Gewinn |
| 5 | Bewusstseinsstruktur als Prompt | −23 bis −53 pp — abgelehnt |

**Wenn nur eine Sache gebaut wird, dann das Gedächtnis mit Herkunft.**

---

## 2. Gedächtnis — verbindliche Vorgaben

### 2.1 Herkunft ist Pflichtfeld, nicht Metadatum

Jeder Eintrag trägt beim **Schreiben**:

```
quelle      : nutzer | werkzeug | dokument | eigener_schluss | import
vertrauen   : 0.0–1.0   (Start: nutzer 0.8, werkzeug 0.9, dokument 0.7,
                          eigener_schluss 0.4, import 0.3)
erfasst_am  : Zeitpunkt der Aufzeichnung
gilt_ab / gilt_bis : fachliche Gültigkeit (bitemporal, Zep-Muster)
```

Und — das ist der gemessene Teil — **die Herkunft steht im Text, der ins
Kontextfenster geht**, nicht nur in der Datenbank:

```
[2026-08-14] [Quelle: nutzer] [Vertrauen: 0,8] Das Projekt nutzt PostgreSQL.
```

Ein Eintrag ohne diese Auszeichnung ist ein **Defekt**. Gemessen: mit
Auszeichnung 95,0 % richtig, ohne 0,0 %.

### 2.2 Die Regel allein reicht nicht

Eine Herkunftsregel im Systemprompt **ohne** ausgezeichnete Einträge bringt
1,7 % — statistisch nichts. Die Regel darf mitlaufen (mit Etiketten zusammen:
98,3 % gegen 95,0 %), aber sie ist die Zugabe, nicht der Schutz.

### 2.3 Was NICHT dringend ist

Retrieval-Präzision. Zwölf irrelevante Einträge kosten 3,3 pp (n.s.). Vektorsuche,
Reranking und Kompression sind **nachrangig** gegenüber Herkunft. Wer damit
anfängt, optimiert die falsche Stelle.

### 2.4 Ungeprüft geblieben

Konsolidierung („Schlaf"), Verfall, Haltbarkeitsvorhersage (E3), Miete (E6),
Abhängigkeitsgraph (E5), Gegenerinnerung (E2). Alle plausibel, keiner gemessen.
Vor dem Bau je einen Arm durch die Strecke schicken.

---

## 3. Ebenen — die Kostenentscheidung

### 3.0 Zuerst: zerlegen oder durchreichen?

Das ist die Unterscheidung, an der alles hängt.

| | gemessen | Urteil |
|---|---|---|
| **Zerlegen** (Teilaufgaben, Arbeiter sieht nur seinen Teil) | 100 % gegen 89 % — **wenn sauber teilbar** | **bauen** |
| **Zerlegen mit Abhängigkeit über die Naht** | 28 % gegen 89 % | Naht zuerst eindeutig machen, sonst nicht zerlegen |
| **Durchreichen** (dieselbe Aufgabe, neu formuliert) | −13,9 pp je Ebene | vermeiden |

**Die Prüffrage vor jeder Zerlegung lautet: Gibt es eine Abhängigkeit, die über
eine Schnittkante läuft?** Wenn ja, muss die Teilanweisung an der Naht eindeutig
sein — der Randwert allein genügt nicht (gemessen: 28 % trotz übergebenem
Randwert). Wenn die Naht nicht eindeutig gemacht werden kann, nicht zerlegen.

Diese Prüfung gehört in den Code der Zerlegungsfunktion, nicht in die Absicht.

### 3.1 Regel für Durchreichen

> **Eine Ebene wird nur eröffnet, wenn sie einen Grund hat, den ein einzelner
> Aufruf nicht erfüllen kann.** Gültige Gründe: echte Parallelität, Kontextgrenze,
> getrennte Rolle mit getrenntem Wissen (Prüfer!), unterschiedliche Modelle.
> Kein gültiger Grund: „so ist die Architektur".

Gemessen: die erste Delegation kostet 13,9 pp. Die zweite und dritte kosten kaum
noch Genauigkeit, aber bis zum 16-fachen an Tokens.

### 3.2 Drei bis sechs Ebenen — was die Zahlen sagen

Die Zielvorstellung „3–6 Ebenen" ist als *Möglichkeit* richtig und als *Normalfall*
teuer. Tiefe 2, 3 und 4 liegen alle bei 63–64 % — das Plateau wird sofort erreicht.
Empfehlung: **zwei Ebenen als Normalfall** (Dirigent + Ausführer), tiefer nur bei
belegtem Grund, und die Tiefe pro Vorhaben protokollieren.

### 3.3 Übergabe-Verträge (E7): so nicht

Wörtliche Weitergabe aller Auflagen über die Ebenen **schadet** (−15,3 pp bei zwei,
−25,4 pp bei drei Ebenen). Grund: die Übergabe war nie das Problem (97,8 % der
Auflagen kommen an); der Verlust entsteht beim Ausführer, und ein längerer Auftrag
verschlimmert ihn.

**Stattdessen:** Auflagen **maschinenlesbar** neben dem Auftrag führen (nicht im
Prompttext dupliziert) und am Ende **mechanisch prüfen** — siehe 4.

### 3.4 Denkbudget der unteren Ebenen begrenzen

Mit vollem nativen Denkbudget erzeugten Ausführer bis zu 18 137 Tokens und einen
Abbruch nach 1 953 s. Untere Ebenen bekommen ein Budget, das zur Aufgabe passt.

---

## 4. Prüfer vor Ausführer — die stärkste einzelne Maßnahme

+20,0 pp gegen Selbstkonsistenz@3 bei **zwei statt drei** Aufrufen.

**Bauweise:** Aufruf 1 löst. Aufruf 2 ist eine **andere Instanz** mit eigenem
Systemprompt („Du übernimmst nichts ungeprüft"), bekommt Aufgabe + Vorschlag und
baut die Aufgabe von den gegebenen Größen neu auf. Stimmt der Vorschlag, wird er
unverändert wiederholt; sonst korrigiert.

**Auflage:** Der Prüfer schreibt seine Nachrechnung immer hin — Formattreue 0 %
bei **100 % abgreifbarer Richtigkeit**. Er ist nicht falsch, er ist geschwätzig.
Also: Ausgabe nachverarbeiten (letzte Zeile/Wert abgreifen) **oder** auf trivialen
Aufgaben gar nicht erst aufrufen.

**Verbindung zu 3.3:** Weil der Verlust beim Ausführer entsteht, ist der Prüfer
genau das richtige Gegenmittel für Delegation — nicht der bessere Auftrag.

---

## 5. Aufwandszuteilung — mit externem Schalter

Wortlaut, der auf beiden Modellen wirkt (+11,6 pp Haiku, +85,3 pp Sonnet):

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

**Nicht als Dauerschicht** — kostet konstant angewandt 16,7 pp Formattreue auf
trivialen Aufgaben. Der Schalter gehört **außerhalb** des Modells: deterministischer
Vorfilter (`signals.ts`) plus Chrisos Verhaltensentropie (AUC 0,968).

---

## 5b. Modellwahl — die Ökonomie

| Regel | Messwert |
|---|---|
| **Zuerst dem billigen Modell die Fesseln nehmen.** Haiku, das sichtbar arbeiten darf: 74,7 % zum niedrigsten Preis im Feld. | 1,00× |
| Wo Genauigkeit zählt, das starke Modell **frei arbeiten lassen** — nicht das billige mit Architektur aufrüsten. | 97,3 % bei 1,63× |
| Prüfer dort, wo ein Fehler teuer ist. Er kauft Verlässlichkeit (100 %), keine Ersparnis. | 2,10× |
| **Selbstkonsistenz@3 nicht bauen.** 4,28× Preis für die niedrigste Genauigkeit. | disqualifiziert |

„Schwaches Modell + Prüfer schlägt starkes Modell allein" wurde geprüft und ist
**falsch** (84,0 % bei 2,21× gegen 97,3 % bei 1,63×). Der Prüfer ist kein
Sparmechanismus.

---

## 6. Weglassen — mit Zahlen

| Was | Messwert |
|---|---|
| Jede Schweigeklausel („alles still, nur das Ergebnis") | −66,7 pp allein; −97,3 pp auf Sonnet |
| Soul Frame 4.1 unverändert (enthält sie in Punkt 6) | −23,3 pp |
| Faktorkatalog als stiller Dauerhintergrund | −28,9 pp; ohne Schweigeklausel exakt Placebo-Niveau |
| Globaler Arbeitsraum als Prompt-Architektur | −53,3 pp; auch als Mehrfachaufruf kein signifikanter Gewinn |
| Übergabe-Vertrag mit wörtlicher Weitergabe (E7) | −15,3 bis −25,4 pp |
| Identität als Persona-Deklaration | Rückgrat 13,6 % vs 12,8 % nackt |
| Bewusstseins-Vokabular im Produkt | trägt 0 messbar bei |
| Retrieval-Optimierung als erste Baumaßnahme | Rauschen kostet 3,3 pp bei 12, 3,3 pp bei 60, 0 pp bei 200 Einträgen — alle n.s. |
| Selbstkonsistenz@3 als Verstärkungsschicht | 4,28× Kosten je bestandenem Ergebnis, niedrigste Genauigkeit |

---

## 7. Das Ich — was erlaubt ist

Miguel darf als **Stil und Gedächtnis** gebaut werden. Nicht als „stabiles Ich":
Rückgrat 7–14 % in allen Armen, deklarierte Persona nicht besser als nackt.

Wer Standfestigkeit will, muss sie **mechanisch** erzwingen — eine Position ändert
sich nur bei neuem Beleg, geprüft im Code — nicht per Persona-Text erbitten.
Dasselbe Muster wie beim Gedächtnis: der Schutz gehört in die Daten und den Code,
nicht in die Anweisung.

---

## 8. Konkrete Änderungen an vorhandenen Artefakten

1. **Soul Frame Punkt 6** — als schädlich gemessen. Der Wortlaut bleibt als
   versionierter Vergleichsarm byte-gleich (Evidenz hängt daran), aber der
   Frontmatter muss den Befund tragen. Konflikt K11 ist entschieden.
2. **E7 (Ebenen-Vertrag)** — in der Form „wörtlich weiterreichen" widerlegt.
   Neu fassen als „Auflagen maschinenlesbar führen und am Ende prüfen".
3. **E15 (Prüfer vor Ausführer)** — gewinnt. Zuerst bauen.
4. **E4 (Herkunfts-Algebra)** — von „Erfindung" zu **tragender Wand** hochstufen.
   Ohne sie ist das Gedächtnis zu 100 % korrumpierbar.
5. **B3b (Faktorkatalog ≥120 Faktoren)** — als stiller Dauertext widerlegt.
   Überlebt als Auswahlmenge für den Schalter.
6. **B7 (Evaluation)** — die Strecke existiert bereits, siehe `04-WEITERMESSEN.md`.
   Nicht neu bauen.
7. **Branch-/Produktnamen** — „consciousness" heraus. Trägt nichts bei und
   verletzt die eigene Anti-Performance-Regel.
