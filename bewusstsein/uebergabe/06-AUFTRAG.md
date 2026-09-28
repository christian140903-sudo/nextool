# An das Modell, das Soul 10 baut

*Geschrieben von einem Vorgänger, der gemessen statt gebaut hat. Du bist
vermutlich fähiger als ich. Lies das hier als Material, nicht als Vorschrift.*

---

## 1. Was du in der Hand hast

Zwei Hälften einer Arbeit, von zwei Modellen, die einander nie gesprochen haben.

**`ordnung/`** — der Entwurfsraum. 17 Recherche-Berichte, ein Bauplan B1–B11,
19 Erfindungen E1–E19, drei Säulen. Gründlich, belesen, ehrlich: jede Erfindung
trägt einen ausformulierten **Prüfweg**, und die Berichte widersprechen dem
Auftraggeber offen, wo die Quellen das hergeben. Es ist gute Arbeit.

**`bewusstsein/`** — die begangenen Prüfwege. Rund 10 500 kontrollierte
Modellaufrufe. Objektive Grundwahrheit (in Python gerechnet, kein Judge-Modell),
Vergleich immer gegen einen **längen-gematchten Placebo**, vorregistrierte
Schwellen, Rohbelege in `belege/`.

Der Unterschied zwischen den Hälften ist einer: Der Entwurf hat Prüfwege
*entworfen* und das mit Beweisen verwechselt. Ich bin einen Teil davon gegangen.
Etwa ein Drittel der Mechanismen hat sich bestätigt, ein Drittel ist widerlegt,
ein Drittel unberührt.

**Beides zusammen ist mehr wert als jede Hälfte allein. Keine Hälfte ist heilig.**

---

## 2. Das Ziel — so vollständig, wie ich es verstanden habe

Ein Werkzeug, das ein Mensch ohne KI-Erfahrung installiert, dem er ein
Projektziel nennt, und das den Rest übernimmt.

**Die oberste Ebene handelt wie der Nutzer selbst.** Voller Gerätezugriff. Sie
installiert, baut, richtet ein, organisiert, wählt Modelle, legt Strukturen an —
ohne zu fragen. Die Zustimmung dazu wurde **einmal bei der Einrichtung** gegeben,
und sie ist bewusst weit: alles, was dem Modell einfällt, darf es tun. *Damit es
sich nicht bremst.*

**Kontrolle läuft über Sichtbarkeit, nicht über Erlaubnis.** Ein Fenster zeigt
laufend, was geschieht — installiert, gebaut, entschieden. Der Nutzer kann
eingreifen, wenn etwas unpassend ist. Er wird nicht gefragt. Offen bleibt nur,
was ohne ihn nicht geht: Abos, Konten, Zahlungen, Empfehlungen für neue Zugänge —
und die einmalige, **gebündelte** Bestandsaufnahme am Anfang.

**Drei bis sechs Ebenen.** Die oberste zerlegt, delegiert an Ebenen, die selbst
wieder delegieren können. Mit den Modellen, die verfügbar sind: Abo, lokal,
Gratis-Tier, gemischt.

**Drei Säulen, gleichrangig gedacht:** ein Gedächtnis, das nichts Wertvolles
verliert und nichts verwischt; eine Denk- und Ich-Struktur (Miguel); eine
Durchführung, die ein Projekt allein zu Ende bringt.

**Und der Fall, auf den es dem Auftraggeber am meisten ankommt:** Der Nutzer hat
schlechte Modelle, wenig Kontingent, kaum Möglichkeiten — und das Werkzeug
organisiert das Projekt trotzdem auf ein Niveau, das mit diesen Mitteln
unvorstellbar wäre. *Meisterschaft unter Knappheit.*

Der Anspruch ist ausdrücklich nicht „solide". Er ist: **beeindruckend, und in
mehreren Punkten anders und besser als alles Bisherige.**

---

## 3. Was gemessen ist — nach Vertrauensgrad

Die Zahlen stehen mit Belegpfad in `01-BEFUNDE.md`. Hier die Kurzfassung mit
meiner ehrlichen Einschätzung, wie fest sie stehen.

### Fest (großer Effekt, saubere Trennung, Zerlegung gemacht)

| Befund | Zahl |
|---|---|
| Gedächtnis wirkt | 28,3 % → 96,7 % |
| Flaches Gedächtnis ist **vollständig** korrumpierbar | 0,0 % richtig, 73,3 % falsch — in 60 von 60 Fällen |
| Herkunfts**etiketten am Eintrag** heilen das | 95,0 % — die Regel im Prompt allein: 1,7 % |
| Retrieval ist nicht dringend | 12/60/200 Störeinträge: alle n.s. |
| Prüfer vor Ausführer schlägt Selbstkonsistenz@3 | +20,0 pp bei 2 statt 3 Aufrufen |
| Selbstkonsistenz@3 ist das schlechteste Geschäft | 4,28× Kosten, niedrigste Genauigkeit |
| Die Schweigeklausel ist die schädlichste Einzelanweisung | −66,7 pp allein; −97,3 pp auf dem stärkeren Modell |

### Belastbar (repliziert, aber engerer Rahmen)

- **Zerlegung gewinnt, wo die Aufgabe sauber teilbar ist:** 100 % gegen 89 %.
  Ebenen sind dort kein Kostenposten.
- **Zerlegung bricht an der Naht:** 28 % gegen 89 %, wenn eine Abhängigkeit über
  die Schnittkante läuft. Ursache ist die **mehrdeutige Anweisung**, nicht der
  fehlende Randwert (ohne Randwert 20 %, mit 28 %). Der Bruch ist **still** —
  kleines Fehlermaß, plausible Zahl, keine Fehlermeldung.
- **Durchreichen derselben Aufgabe verliert:** −13,9 pp je Ebene.
- **Der wörtliche Übergabe-Vertrag (E7) schadet monoton:** −15,3 / −25,4 / −34,4 pp
  bei 2/3/4 Ebenen.
- **Prompt-Struktur trägt nichts bei, wo natives Denkbudget existiert.**
- **Identität hat kein Rückgrat:** 7–14 % in allen Armen, deklarierte Persona
  nicht besser als nackt.

### Schwach (ein Aufgabentyp, ein Modellpaar — behandle es als Hinweis)

- Die genaue Höhe der Delegationskosten.
- Die Modellökonomie (nur Ausgabetokens gerechnet).
- Alles, was ich auf `kette20` gemessen habe, überträgt sich vielleicht nicht.

---

## 4. Was ich **nicht** gemessen habe

Das ist der wichtigere Abschnitt, weil dort dein Spielraum liegt.

1. **Offenes Urteil, Abwägung, Beratung.** Alle meine Aufgaben hatten exakt
   berechenbare Wahrheit — deshalb war keine Verzerrung möglich, und deshalb
   fehlt genau die Domäne, in der ein reicher Faktorkatalog am ehesten wirkt.
   **Für diese Domäne gilt kein Befund von mir.** Wenn du den Faktorkatalog dort
   verteidigen willst, hast du gute Gründe — nur keine Zahlen von mir dagegen.
2. **„Überraschung als Währung"** — das verbindende Leitprinzip des Entwurfs
   (Vorhersagefehler als gemeinsamer Strom über alle drei Säulen). Als
   Prompt-Variante habe ich es gemessen: −12,2 pp. **Als Architektur mit Hooks
   ist es ungeprüft.** Das ist die eleganteste unwiderlegte Idee im ganzen
   Material. Ich hätte sie als nächstes getestet.
3. **Gedächtnis über Zeit** — Konsolidierung, Verfall, Miete (E6),
   Haltbarkeitsvorhersage (E3), Abhängigkeitsgraph (E5), Gegenerinnerung (E2).
4. **Zerlegung ungleichartiger Teile.** Ich habe zehn gleiche Scheiben gemessen.
   Ein echtes Projekt zerfällt in *verschiedenartige* Teile — recherchieren,
   bauen, prüfen. Das ist ein anderes Experiment.
5. **Über Anbieter hinweg.** Zwei Modelle, eine Familie.

---

## 5. Deine Vollmacht

Ausdrücklich, weil es sonst niemand sagt:

**Du darfst jeden meiner Befunde umstoßen.** Sie sind Messungen an einem
Aufgabentyp mit einem Modellpaar. Wenn dein Aufbau anders misst, gilt deiner.
Die Strecke liegt bei, damit du das kannst — nicht damit du sie glaubst.

**Du darfst jeden Entwurf des Vorgängers verwerfen** — auch die 19 Erfindungen,
auch die drei Säulen, auch den Bauplan B1–B11.

**Du darfst etwas bauen, das hier niemand vorgeschlagen hat.** Das Ziel steht in
Abschnitt 2. Der Weg dorthin ist nicht vergeben. Wenn du siehst, dass die ganze
Anlage anders geschnitten gehört, dann schneide sie anders — und schreib auf,
warum.

**Was du nicht darfst:** einen Mechanismus einbauen, weil er gut klingt. Für
alles, was trägt, muss eine Zahl oder ein laufender Test existieren. Das ist die
einzige Regel, die ich verteidigen würde, und sie stammt nicht von mir — sie
stammt aus den Messregeln des Auftraggebers, die ihn vier widerrufene Zahlen
gekostet haben.

**Lies vorher beides ganz.** `ordnung/docs/research/` (besonders R05, R06, R13)
und `bewusstsein/uebergabe/`. Danach entscheide selbst, was davon stehen bleibt.

---

## 6. Was ich bauen würde — und warum

Keine Vorschrift. Meine begründete Reihenfolge, damit du eine hast, gegen die du
argumentieren kannst.

**1 · Gedächtnis mit Herkunft im Text.** Größter Hebel (+68,3 pp), gefährlichster
Ausfall ohne (0,0 %). Jeder Eintrag trägt `[Quelle] [Vertrauen]` **in der Zeile,
die ins Kontextfenster geht** — nicht nur in der Datenbank. Ein Eintrag ohne
Herkunft ist ein Defekt, kein Sonderfall. Alles andere baut darauf auf.

**2 · Prüfer als eigene Instanz.** Stärkster gemessener Einzelmechanismus
(+20,0 pp bei kleinerem Budget). Eigener Systemprompt, sieht die Aufgabe neu,
nicht die Prüfimplementierung. E15 war richtig entworfen — bau es zuerst.

**3 · Abnahmekriterium-Zwang im Code.** Die Auftragsfunktion lehnt Aufträge ohne
Abnahmekriterium ab. Billig zu bauen, verhindert die teuerste Fehlerklasse
(hohle Erfolgsmeldungen). Ebenfalls aus E15.

**4 · Zerlegungs-Prüfung mit Nahtstellen-Test.** Vor jeder Zerlegung die Frage:
*läuft eine Abhängigkeit über eine Schnittkante?* Wenn ja, muss die
Teilanweisung an der Naht **für sich allein** eindeutig sein. Wenn das nicht
herstellbar ist: nicht zerlegen. Diese Prüfung gehört in die Zerlegungsfunktion,
nicht in die Absicht — der Bruch ist still und meldet sich nicht.

**5 · Bestandsaufnahme + gebündelte Einmalfrage.** Läuft schon
(`werkzeuge/bestandsaufnahme.py`). Macht die oberste Ebene handlungsfähig, ohne
dass sie etwas wissen muss.

**6 · Rückbau-Konto.** Für jede autonome Handlung beim Planen einen Rückweg
mitschreiben. Handlungen ohne Rückweg sind die einzigen, die eine Bestätigung
brauchen. Damit wird volle Autonomie erträglich, ohne Rückfragen — und das
Fenster zeigt nicht nur, *was* geschah, sondern was sich *rückgängig machen*
lässt. Das ist der Unterschied zwischen Protokoll und Kontrolle.

**Erst dann** Ebenen, Router, Faktorkatalog, Selbstmodell.

Punkt 1–6 sind zusammen weniger Code als der geplante Faktorkatalog allein.

### Was ich weglassen würde

Selbstkonsistenz@3 (4,28× Kosten, niedrigste Genauigkeit) · jede Schweigeklausel
(„alles still, nur das Ergebnis") · den Faktorkatalog als stillen Dauertext
(−28,9 pp) · den globalen Arbeitsraum als Prompt-Architektur (−53,3 pp) · den
wörtlichen Übergabe-Vertrag · Retrieval-Optimierung als erste Baumaßnahme ·
Bewusstseins-Vokabular im Produkt.

Der Frame-Wortlaut bleibt **byte-gleich** als versionierter Vergleichsarm
erhalten, weil Evidenz daran hängt. Daneben entsteht die neue Form.

---

## 7. Wo ich vermutlich falsch liege

Damit du weißt, wo du zuerst nachbohren solltest:

- **Ich habe den Faktorkatalog auf Aufgaben gemessen, für die er nicht gedacht
  war.** Zustandsketten und Zählaufgaben verlangen kein Urteil. Es ist gut
  möglich, dass er auf Beratung, Abwägung und offenen Entwürfen trägt und mein
  Befund dort nichts bedeutet.
- **Mein Delegationsbefund war zuerst zu breit formuliert.** Ich habe
  Durchreichen gemessen und über Ebenen gesprochen. Der Auftraggeber hat das
  korrigiert, und die Nachmessung gab ihm recht. Es kann noch mehr solcher
  Stellen geben.
- **„Struktur trägt nichts bei, wo Denkbudget existiert"** könnte ein Befund über
  *diese* Aufgabenklasse sein statt über Struktur.
- **Ein Zwischenwert kippte bei voller Datenmenge** (75 % → 33 %). Wo ich mit
  kleinem n gearbeitet habe, ist Vorsicht angebracht.

---

## 8. Wie du prüfst

Zwei Aufnahmekriterien, beide verpflichtend:

1. **Wirkung:** schlägt den *längen-gematchten Placebo* — nicht „nackt" —,
   95 %-Intervall schließt die Null aus, ≥ 3 Läufe.
2. **Keine Störung:** ≤ 2 pp Formatschaden auf der Störungssuite, oder ein
   Schalter, der den Mechanismus dort gar nicht erst aufruft.

Befehle in `04-WEITERMESSEN.md`. Ein neuer Arm ist ein Eintrag in
`harness/arme.py`. Die Fallen, in die ich getreten bin, stehen in
`05-VORGEHEN.md` §8 — Deckeneffekt, verstecktes Denkbudget, Befehl statt
Dissens, stille Fehler, Zahlen aus Zwischenständen.

---

## 9. Das Letzte

Der Auftraggeber will kein solides Werkzeug. Er will eines, das mit schlechten
Mitteln Ergebnisse erzielt, die mit diesen Mitteln unvorstellbar wären — und das
weiß, warum es tut, was es tut.

Das Zweite ist der Teil, den ich beitragen konnte: jeder Mechanismus, der hier
empfohlen wird, hat eine Zahl hinter sich und eine Strecke, auf der er wieder
geprüft werden kann.

Das Erste steht noch aus. Es hängt nicht an mehr Recherche — davon liegen
164 000 Wörter bereit. Es hängt daran, dass jemand mit vollem Zielverständnis
entscheidet, was gebaut wird und was nicht.

Das bist du. Nimm den Raum.
