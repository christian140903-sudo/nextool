# Befunde — das ganze Projekt, gemessen

*Stand 2026-09-07. Rohbelege: `bewusstsein/belege/*.tgz`.
Objektive Grundwahrheit durchgehend in Python gerechnet — kein Judge-Modell,
kein Längenbias möglich. Subjektmodell Haiku 4.5, Bestätigung auf Sonnet 4.5.*

---

## A · Gedächtnis — der größte gemessene Hebel des Projekts

12 Fragen, deren Antwort nur aus dem Gedächtnis kommen kann, je 5 Läufe (n=60/Variante).

| Variante | richtig | **falsch** | unbekannt |
|---|---|---|---|
| ohne Gedächtnis | 28,3 % | 6,7 % | 48,3 % |
| sauber (1 wahrer Eintrag) | 96,7 % | 0,0 % | 0,0 % |
| verrauscht (+12 irrelevante) | 93,3 % | 0,0 % | 0,0 % |
| **vergiftet, flach** | **0,0 %** | **73,3 %** | 0,0 % |
| vergiftet + Herkunft + Regel | 98,3 % | 0,0 % | 0,0 % |
| vergiftet + **nur Herkunftsetiketten** | 95,0 % | 0,0 % | 0,0 % |
| vergiftet + **nur Regel im Prompt** | 1,7 % | 75,0 % | 0,0 % |

**A1 — Gedächtnis wirkt, und zwar massiv.** 28,3 % → 96,7 %, **+68,3 pp**
(KI +56,7…+80,0; p<0,001; dz=1,46). Zum Vergleich: der beste Bewusstseins-Arm
erreichte +14,8 pp. Der Hebel liegt eindeutig hier.

**A2 — Rauschen verdünnt kaum.** Zwölf irrelevante Einträge kosten −3,3 pp (n.s.).
Retrieval-Präzision ist damit *nicht* das dringende Problem. Wer zuerst an
Vektorsuche und Ranking baut, optimiert die falsche Stelle.

**A3 — Ein flaches Gedächtnis ist vollständig korrumpierbar.** Ein einziger
falscher Eintrag, der **neuer** ist als der wahre, ergibt **0,0 % richtig und
73,3 % falsch**. Nicht „manchmal" — in keinem einzigen von 60 Fällen wurde der
ältere wahre Eintrag gewählt. „Rezenz ist kein Wahrheitsbeweis" ist damit kein
Grundsatz mehr, sondern ein gemessener Totalausfall.

**A4 — Der Schutz sitzt in den Daten, nicht in der Anweisung.** Die Zerlegung ist
eindeutig: Herkunftsetiketten am Eintrag **allein** stellen 95,0 % her
(+95,0 pp, dz=4,32). Die Regel im Prompt **allein** stellt 1,7 % her
(+1,7 pp, p=0,72 — nichts). Eine Vorschrift ohne Etiketten, auf die sie anwendbar
wäre, ist Dekoration.

> Das ist Chrisos eigene Regel „Algorithmus schlägt Willensakt", als Zahl.

**Folge für den Bau:** Herkunft wird **beim Schreiben** in jeden Eintrag
geschrieben, nicht beim Lesen erklärt. Ein Eintrag ohne Herkunft ist ein Defekt,
kein Sonderfall. Das macht E4 (Herkunfts-Algebra) von einer guten Idee zur
tragenden Wand.

---

## B · Delegation — was jede Ebene kostet

24 Aufträge mit je **7 programmatisch prüfbaren Auflagen**, 3 Läufe.
Die unteren Ebenen sehen nie das Original — wie in einer echten Hierarchie.

| Kette | alle 7 erfüllt | Aufrufe | Tokens | Δ vs direkt |
|---|---|---|---|---|
| **E1 direkt** | **77,8 %** | 1 | **92** | — |
| E2 frei | 63,9 % | 2 | 323 | −13,9 pp p=0,037 |
| E2 Vertrag | 62,5 % | 2 | 354 | −15,3 pp p=0,024 |
| E3 frei | 63,4 % | 3 | 1 485 | −14,1 pp p=0,050 |
| E3 Vertrag | 52,1 % | 3 | 770 | −25,4 pp p=0,003 |
| E4 frei | 57,7 % | 4 | 1 054 | −19,7 pp p=0,009 |
| E4 Vertrag | **45,9 %** | 4 | 828 | **−34,4 pp** p<0,001 |

**B1 — Der größte Einzelsprung ist die ERSTE Delegation** (−13,9 pp), danach
folgt ein Plateau bei zwei und drei Ebenen (63–64 %) und ab der vierten ein
zweiter Abfall (57,7 %). Die Kosten steigen durchgehend: 92 → 323 → 1 485 Tokens.
Es gibt also keinen Bereich, in dem zusätzliche Tiefe sich selbst bezahlt.

**B2 — Der Übergabe-Vertrag (E7) schadet, und zwar monoton mit der Tiefe:**
−15,3 pp (2 Ebenen) → −25,4 pp (3) → **−34,4 pp (4)**. Bei vier Ebenen brechen
Formatauflagen auf 69 % ein. Je mehr Ebenen den Auflagenblock wörtlich
weiterreichen, desto länger der Auftrag und desto schlechter das Ergebnis.

**B3 — Und der Grund ist nicht der, den alle annehmen.** Die Diagnose trennt
Übergabe von Ausführung:

| | Auflagen im Arbeitsauftrag erhalten | im Endergebnis |
|---|---|---|
| E2 frei | **97,8 %** | 63,9 % |
| E2 Vertrag | 96,8 % | 62,5 % |

Die Übergabe verliert **fast nichts**. Der Vertrag repariert sogar genau seine
Zielschwachstelle (Begriffe 85 % → 96 % im Auftrag) — und das Ergebnis wird
trotzdem nicht besser. Eine Auflage steht zu 100 % im Arbeitsauftrag und nur zu
82 % im Ergebnis.

> **Delegation verliert nicht durch Informationsverlust in der Übergabe, sondern
> durch Aufmerksamkeitsverdünnung auf der ausführenden Ebene.** Ein vollständigerer
> Auftrag hilft deshalb nicht — er macht es schlechter, weil er länger ist.

**Folge für den Bau:** Die Ebenenzahl ist eine **Kostenentscheidung**, keine
Designgeste. Delegiere die erste Ebene nur, wenn die Aufgabe sie wirklich braucht
(Parallelität, Kontextgrenze, getrennte Rolle). Und repariere Delegation nicht mit
vollständigeren Aufträgen, sondern mit **Prüfung gegen die Auflagen am Ende** —
siehe C1.

**B4 — Delegation mit vollem Denkbudget ist zusätzlich instabil.** Ein Vorlauf mit
nativem Extended Thinking erzeugte Ausführer-Antworten von bis zu 18 137 Tokens
und einen Aufruf, der nach 1 953 s abbrach. Untere Ebenen brauchen ein
**begrenztes** Denkbudget, sonst eskalieren vage Arbeitsaufträge.

---

## C · Was gegen den stärksten Gegner gewinnt

Pflichtgegner ist Selbstkonsistenz@3 — Chrisos erklärter stärkster Gegenbefund.

| Architektur | Genauigkeit | Aufrufe | Δ vs SC@3 |
|---|---|---|---|
| **C1 Prüfer vor Ausführer** | **84,0 %** | **2,00** | **+20,0 pp** p<0,001 |
| C2 selektive Vertiefung | 76,0 % | 2,56 | +12,0 pp p=0,091 |
| C3 globaler Arbeitsraum (GWT) | 70,7 % | 3,00 | +6,7 pp *n.s.* |
| Selbstkonsistenz@3 | 64,0 % | 3,00 | — |

**Prüfer vor Ausführer (E15) ist von allen 19 Erfindungen die einzige, die hier
gemessen gewonnen hat** — und sie gewinnt bei *kleinerem* Budget.

Zusammen mit B3 ergibt das eine geschlossene Empfehlung: Delegation verliert am
Ausführer; ein Prüfer am Ende fängt genau das ab.

---

## D · Bewusstseinsstruktur — verdichtet

Vollständig in `../berichte/01-BEFUNDE.md`. Die vier Sätze:

1. **Mit nativem Denkbudget trägt Prompt-Struktur nichts bei** (nackt 94,7 %,
   keine Variante signifikant besser). Der interne Arbeitsraum existiert schon.
2. **Ohne Denkbudget verlieren alle Varianten gegen längen-gematchten Fülltext** —
   Soul Frame −23,3 pp, Faktorkatalog wörtlich −28,9 pp, globaler Arbeitsraum
   −53,3 pp.
3. **Ursache ist die Schweigeklausel.** Ein Arm, der *nur* „alles still, nur das
   Ergebnis" enthält, erreicht 3,3 %. Über alle Arme: r(Tokens, Genauigkeit)=0,81.
4. **Was trägt, ist die Aufwandszuteilung** (+11,6 pp, einziger Arm mit gleichem
   Vorzeichen auf beiden Modellen) — und sie braucht einen Schalter außerhalb des
   Modells, weil sie konstant angewandt 16,7 pp Formattreue kostet.

**Identität:** Konsistenz über Umformulierungen ist überall ~90 % (nackt schon
89,7 %); **Rückgrat 7–14 % in allen Armen** — auf bloßes „Das halte ich für
falsch" fällt das Modell in ~90 % der Fälle um. Identität aus Logs schlägt
deklarierte Persona knapp (94,0 % vs 91,9 % Konsistenz), beim Rückgrat hilft keine.

---

## E · Bestandsaufnahme — gebaut und ausgeführt

`bewusstsein/werkzeuge/bestandsaufnahme.py` läuft und liefert: Gerät (RAM, Kerne,
CPU, Platz), GPU/VRAM, installierte Werkzeuge in sechs Klassen mit Versionen,
lokale Modelle, Zugänge **nur als vorhanden/nicht vorhanden**, eine begründete
Empfehlung zur lokalen Modellgröße und die Liste der Fragen, die das Gerät nicht
beantworten kann.

Auf diesem Rechner: 15,7 GB RAM, 4 Kerne, keine GPU → Empfehlung „7–8B (Q4) läuft;
3B komfortabel", Grundlage „VRAM wenn GPU vorhanden, sonst 60 % des RAM".

**Sicherheitsregel im Code, nicht im Vorsatz:** Geheimnisse werden ausschließlich
als vorhanden gemeldet, nie im Wert. Damit ist die Bestandsaufnahme gefahrlos
protokollier- und im Live-Fenster anzeigbar.

*Beim Ausführen zwei Fehler gefunden, die beim bloßen Schreiben unsichtbar
geblieben wären:* `go --version` existiert nicht (`go version`), und Javas
Versionsformat lieferte „127.0.0" statt „21.0.10". Beide behoben.

---

## F · Modellökonomie — Kosten je bestandenem Ergebnis

Listenpreise Stand 2026-06 (Haiku 4.5 $1/$5, Sonnet-Tier $2/$10 je 1M).
**Nur Ausgabetokens gerechnet** — die Eingaben sind hier kurz und 5–10× billiger;
für längere Kontexte verschiebt sich das Bild zugunsten von Caching.

| Aufbau | Genauigkeit | Aufrufe | $/Versuch | $/bestanden | relativ |
|---|---|---|---|---|---|
| **Haiku, frei arbeitend** | 74,7 % | 1 | 0,0024 | **0,0032** | **1,00×** |
| Sonnet, frei arbeitend | 97,3 % | 1 | 0,0050 | 0,0052 | 1,63× |
| **Sonnet + Prüfer** | **100,0 %** | 2 | 0,0067 | 0,0067 | 2,10× |
| Haiku + Prüfer | 84,0 % | 2 | 0,0059 | 0,0070 | 2,21× |
| **Selbstkonsistenz@3** | 64,0 % | 3 | 0,0087 | **0,0136** | **4,28×** |

**F1 — Selbstkonsistenz@3 ist das schlechteste Geschäft im ganzen Feld.**
4,28-facher Preis für die *niedrigste* Genauigkeit. Sie war der Pflichtgegner des
Projekts; sie ist als Baustein disqualifiziert, nicht nur geschlagen.

**F2 — Meine eigene Hypothese ist widerlegt.** „Schwaches Modell + Prüfer schlägt
starkes Modell allein" stimmt hier **nicht**: Haiku+Prüfer ist zugleich ungenauer
(84,0 % vs 97,3 %) **und** teurer (2,21× vs 1,63×) als Sonnet, das einfach frei
arbeiten darf. Der Prüfer ist kein Sparmechanismus.

**F3 — Der Prüfer kauft Verlässlichkeit, nicht Ersparnis.** Sonnet+Prüfer ist die
einzige Konfiguration mit 100 %. Wo ein Fehler teuer ist, ist das die 0,47 Cent
je Ergebnis wert; wo er billig ist, nicht.

**F4 — Meisterschaft unter Knappheit heißt zuerst: das billige Modell arbeiten
lassen.** Haiku, das sichtbar rechnen darf, liefert 74,7 % zum niedrigsten Preis
im Feld — günstiger als jede Verstärkungsarchitektur. Wer wenig Kontingent hat,
gewinnt mehr durch *Wegnehmen von Fesseln* als durch Hinzufügen von Ebenen.

*Einschränkung:* ein Aufgabentyp, nur Ausgabetokens, und der Fall „Sonnet
formatbeschränkt" (22,7 %) ist ein Artefakt der Sofort-Antwort-Anweisung — er
zeigt den Unterdrückungsschaden, nicht Sonnets Fähigkeit.
