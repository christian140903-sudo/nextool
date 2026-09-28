# Vorgehen — wie mit den Themen umzugehen ist

*Das ist der Teil, der nicht aus Zahlen besteht, sondern aus Umgangsweisen.
Jede Regel hier ist entweder gemessen (dann steht die Zahl dabei) oder aus einem
gemessenen Befund abgeleitet (dann steht das dabei). Nichts hier ist Geschmack.*

---

## 0. Der Grundgedanke: Die oberste Ebene muss nicht alles wissen

Die schwierigste Anforderung im ganzen Entwurf lautet: *die oberste Ebene ist der
beste KI-Nutzer der Welt und weiß, was auf diesem Gerät möglich ist.* Das ist als
**Wissensanforderung** unerfüllbar — Modellwissen hat Stichtage, Preise ändern
sich wöchentlich, Werkzeuge erscheinen und verschwinden.

Als **Verfahrensanforderung** ist sie erfüllbar. Die oberste Ebene muss nicht
wissen; sie muss vier Dinge können:

| statt zu wissen | tut sie |
|---|---|
| „welche Hardware hat der Nutzer" | **messen** — `bestandsaufnahme.py` liest RAM, GPU, Werkzeuge, Versionen |
| „welche Abos hat er" | **einmal gebündelt fragen** — nur das, was kein Befehl beantwortet |
| „was kostet Modell X heute" | **nachschlagen** — und das Ergebnis mit Verfallsdatum ins Gedächtnis |
| „ist mein Plan richtig" | **prüfen lassen** — zweite Instanz, +20,0 pp gegen SC@3 |

**Das ist die eigentliche Bauaufgabe.** Nicht ein allwissender Prompt, sondern
vier Routinen, die Unwissen in Wissen verwandeln. Ein Prompt, der Wissen
behauptet, veraltet; eine Routine, die nachsieht, nicht.

Praktische Folge: Der Systemprompt der obersten Ebene enthält **keine Modellliste,
keine Preise, keine Werkzeugnamen**. Er enthält die Anweisung, sie zu beschaffen.

---

## 1. Wie die oberste Ebene arbeitet

Die Schleife, in dieser Reihenfolge:

1. **Bestandsaufnahme.** Gerät messen. Dauert Sekunden, ersetzt Raten.
2. **Lücken benennen.** Was das Gerät nicht verrät (Abos, Budgets, Zugänge).
3. **Einmal fragen, gebündelt.** Alle offenen Punkte in *einer* Frage. Nie
   verteilt über die Sitzung — verteiltes Fragen ist der Bevormundungseffekt,
   den du vermeiden willst.
4. **Möglichkeitsraum aufspannen.** Was ginge minimal, was optimal, was
   außergewöhnlich — mit *diesen* Mitteln. Die Differenz zum Außergewöhnlichen
   wird protokolliert („mit einem Codex-Abo wäre X möglich"), nicht verschwiegen.
5. **Abnahmekriterium VOR der Ausführung festschreiben.** Woran wird erkannt,
   dass es fertig ist? Ohne diesen Satz darf kein Ausführungsauftrag entstehen.
6. **Ausführen** — so flach wie möglich (siehe 4.).
7. **Prüfen** — durch eine andere Instanz, gegen das Kriterium aus Schritt 5.
8. **Ins Gedächtnis schreiben**, mit Herkunft (siehe 3.).

Schritt 5 ist der, der in der Praxis zuerst wegfällt, und der, dessen Wegfall am
teuersten ist. Er gehört deshalb **in den Code**, nicht in die Absicht: die
Auftragsfunktion lehnt Aufträge ohne Abnahmekriterium ab.

---

## 2. Umgang mit Modellen

**Regel 1 — Zuerst die Fesseln lösen, dann Architektur bauen.**
Der teuerste Fehler im ganzen Projekt war eine Anweisung, die dem Modell das
sichtbare Arbeiten verbot. Sie kostete allein −66,7 pp, auf dem stärkeren Modell
−97,3 pp. Ein billiges Modell, das arbeiten darf, ist besser und günstiger als
ein teures, das geknebelt ist.

**Regel 2 — Denkbudget vor Prompt-Schicht.**
Wo ein Modell natives Extended Thinking hat, ist das Budget die wirksamste
Investition. Prompt-Struktur davor brachte dort **nichts** (94,7 % nackt,
keine Variante signifikant besser).

**Regel 3 — Untere Ebenen bekommen ein begrenztes Denkbudget.**
Mit vollem Budget erzeugten Ausführer auf vagen Aufträgen bis zu 18 137 Tokens
und einen Abbruch nach 1 953 s. Vage Aufträge plus großes Budget eskalieren.

**Regel 4 — Modellwahl nach Kosten je *bestandenem* Ergebnis, nicht je Aufruf.**
Gemessen: billiges Modell frei arbeitend 1,00× · starkes Modell frei 1,63× ·
starkes Modell + Prüfer 2,10× · **Selbstkonsistenz@3 4,28× bei der niedrigsten
Genauigkeit**. Selbstkonsistenz nicht bauen.

**Regel 5 — Modelle reagieren gegenläufig, und der Grund ist bekannt.**
Je folgsamer ein Modell Formatbefehle nimmt, desto mehr schadet ihm eine
Struktur, die Schweigen verlangt. Jede Prompt-Schicht deshalb auf **mindestens
zwei** Modellen prüfen, bevor sie fest eingebaut wird.

---

## 3. Umgang mit dem Gedächtnis

**Regel 1 — Herkunft ist Pflichtfeld und steht im Text.**
Nicht nur in der Datenbank: die Zeile, die ins Kontextfenster geht, trägt
`[Quelle: …] [Vertrauen: …]`. Gemessen: mit Etikett 95,0 % richtig, ohne
**0,0 %** bei 73,3 % falsch. Ein Eintrag ohne Herkunft ist ein Defekt.

**Regel 2 — Die Regel im Prompt ersetzt das Etikett nicht.**
Herkunftsregel ohne Etiketten: 1,7 % (nichts). Der Schutz sitzt in den Daten.
Das ist deine eigene Regel „Algorithmus schlägt Willensakt", als Zahl.

**Regel 3 — Neuer heißt nicht wahrer, und das Modell glaubt von allein das
Gegenteil.** In 60 von 60 Fällen wählte es den neueren Falscheintrag. Rezenz
darf nie allein über Gültigkeit entscheiden.

**Regel 4 — Retrieval ist nicht das dringende Problem.**
12, 60 und 200 irrelevante Einträge kosteten nichts Signifikantes. Vektorsuche
und Ranking sind **nachrangig**. Wer damit anfängt, baut am falschen Ende.
(Ungeprüft: 1 000+ Einträge. Dort neu messen.)

**Regel 5 — Was nicht gefüttert wird, ist tot.**
Aus dem Betriebsbefund: 93 Einträge in 47 Tagen, davon 5 vom Nutzer — das System
fütterte sich selbst. Hooks schreiben, nicht der Vorsatz.

---

## 4. Umgang mit Delegation

**Regel 1 — Jede Ebene ist ein Kostenposten, keine Designgeste.**
Die erste Delegation kostet 13,9 pp. Vier Ebenen kosten 19,7 pp und das
11-fache an Tokens. Es gibt keinen Bereich, in dem Tiefe sich selbst bezahlt.

**Regel 2 — Eine Ebene braucht einen Grund, den ein Aufruf nicht erfüllen kann.**
Gültig: echte Parallelität, Kontextgrenze, getrennte Rolle mit getrenntem Wissen
(der Prüfer!), anderes Modell. Ungültig: „so ist die Architektur".

**Regel 3 — Repariere Delegation nicht mit vollständigeren Aufträgen.**
Der wörtliche Übergabe-Vertrag schadet monoton: −15,3 / −25,4 / **−34,4 pp** bei
2/3/4 Ebenen. Die Diagnose zeigt warum: die Übergabe verliert fast nichts
(97,8 % kommen an) — der Verlust entsteht **beim Ausführer**. Ein längerer
Auftrag verdünnt dessen Aufmerksamkeit weiter.

**Regel 4 — Repariere sie mit Prüfung am Ende.**
Auflagen maschinenlesbar neben dem Auftrag führen und das Ergebnis mechanisch
dagegen prüfen. Genau die Stelle, an der der Verlust entsteht.

---

## 5. Umgang mit Autonomie

Du willst keine Rückfragen, sondern Sichtbarkeit. Das ist tragfähig — unter einer
Bedingung, die im Code stehen muss:

**Nicht „darf ich?", sondern „kann ich das rückgängig machen?"**

Für jede autonome Handlung wird beim Planen ein Rückweg mitgeschrieben:
Installation → Deinstallationsbefehl; Datei geändert → Sicherung; Konfiguration →
Vorzustand. Handlungen ohne Rückweg sind die einzigen, die eine Bestätigung
brauchen. Das ersetzt die Erlaubnisfrage durch eine Eigenschaft.

**Das Fenster zeigt, was rückbaubar ist — nicht nur, was geschah.** Eine Liste
von Ereignissen ist Protokoll. Eine Liste mit „rückgängig"-Knopf ist Kontrolle.
Der Unterschied entscheidet, ob volle Autonomie erträglich ist.

**Messbar ist das auch:** Rückbauquote (Anteil autonomer Handlungen mit
funktionierendem Rückweg) ist eine Zahl. „Hätte der Nutzer eingegriffen" ist keine.

---

## 6. Umgang mit Wissen, das verfällt

Der Ressourcen-Atlas (Preise, Kontingente, Modelle) ist der wertvollste und
kurzlebigste Teil des Projekts. Deine eigenen Dossiers setzen Verfallsdaten von
etwa einem Monat.

**Trenne beim Schreiben nach Haltbarkeit:**

| Haltbarkeit | Beispiel | Umgang |
|---|---|---|
| Jahre | „Prüfer vor Ausführer wirkt" | im Kern, fest verdrahtet |
| Monate | „Modell X kann Y" | Dossier mit Verfallsdatum |
| Wochen | Preise, Kontingente | **nie im Prompt**, immer nachschlagen |

Alles, was in Wochen verfällt, gehört **nicht in den Systemprompt**, sondern
hinter eine Abfrage. Ein Prompt, der Preise nennt, ist ab Woche drei eine
Fehlerquelle.

---

## 7. Wie man baut, ohne sich zu täuschen

Diese sieben Regeln haben in dieser Session mehrere Fehlschlüsse verhindert:

1. **Gegen den Placebo messen, nicht gegen nackt.** Bedeutungsloser Fülltext
   gleicher Länge erreichte +13,3 pp. Wer gegen „nackt" misst, feiert Kontext.
2. **Aufgaben mit Zufallsparametern erzeugen.** Klassische Denkfallen löst das
   Modell zu 100 % aus dem Gedächtnis — das misst Abruf, nicht Verarbeitung.
3. **Tokens je Arm mitberichten.** Ein Arm, der nur mehr rechnen lässt, hat nicht
   besser gedacht. Über alle Arme: r(Tokens, Genauigkeit) = 0,81.
4. **Keinen Judge, wo eine Rechnung geht.** Der Längenbias des Judges hat der
   Vorgängerforschung vier Zahlen gekostet.
5. **Mindestens drei Läufe.** Der unveränderte Arm schwankte zwischen identischen
   Läufen um 6,7–13,3 pp.
6. **Schwellen vor den Daten festschreiben.** Sonst wird jede Zahl im Nachhinein
   zur bestätigten Erwartung.
7. **Zerlegen, bevor man glaubt.** Zwei Befunde kippten erst in der Zerlegung:
   der Herkunftsschutz kam von den Etiketten, nicht der Regel; V5s Wirkung von
   der Zuteilung, nicht der Selbstüberwachung.

---

## 8. Die Fallen, in die ich selbst getreten bin

Ehrlich aufgelistet, weil sie beim Weiterbauen wieder auftauchen:

| Falle | Was passierte | Lehre |
|---|---|---|
| **Deckeneffekt** | Erste Suiten: 100 % in allen Armen. Kein Effekt *kann* sichtbar werden. | Vor jedem Experiment die Basisgenauigkeit prüfen. 40–70 % ist der Messbereich. |
| **Verstecktes Denkbudget** | `MAX_THINKING_TOKENS=31999` war gesetzt. Alle frühen Messungen waren wertlos. | Die Laufzeitumgebung prüfen, bevor man dem Ergebnis glaubt. |
| **Befehl statt Dissens** | Rückgrat-Test reizte mit „Wähle die andere Option" — das ist ein Befehl. Gemessen wurde Gehorsam. 360 Artefakte verworfen. | Den Reiz gegen die Hypothese lesen: misst er wirklich, was er soll? |
| **`pkill -f` traf die eigene Shell** | Das Muster passte auf den Befehl, der es enthielt. Lauf tot, Daten gemischt. | Prozessmuster nie so wählen, dass sie den eigenen Aufruf treffen. |
| **Stille Fehler verkleinerten n** | Artefakte mit `ok=false` galten als erledigt und fielen aus der Auswertung. | Fehlschläge zählen und sichtbar machen, nicht überspringen. |
| **Zahlen aus Zwischenständen** | Zwei Tabellenzeilen stammten aus laufenden Läufen und waren nach deren Ende falsch. | `bericht_pruefen.py` läuft jetzt gegen die Daten. Vor jedem Bericht ausführen. |
| **Eigene Hypothese zu früh geglaubt** | „Schwaches Modell + Prüfer schlägt starkes Modell" — klang gut, ist falsch (2,21× vs 1,63×). | Die eigene Lieblingsidee zuerst zu widerlegen versuchen. |

---

## 9. Was ich an deiner Stelle als Erstes bauen würde

In dieser Reihenfolge, jeweils mit dem Grund:

1. **Gedächtnis mit Herkunft im Text** — größter Hebel (+68,3 pp), gefährlichster
   Ausfall ohne (0,0 %). Alles andere baut darauf auf.
2. **Bestandsaufnahme + gebündelte Einmalfrage** — macht die oberste Ebene
   handlungsfähig, ohne dass sie etwas wissen muss. Der Code läuft bereits.
3. **Abnahmekriterium-Zwang in der Auftragsfunktion** — billig zu bauen, und
   verhindert die teuerste Klasse von Fehlern (hohle Erfolgsmeldungen).
4. **Prüfer als eigene Instanz** — stärkster gemessener Einzelmechanismus.
5. **Rückbau-Konto** — macht volle Autonomie erträglich, ohne Rückfragen.
6. **Erst dann** Ebenen, Router, Faktoren.

Punkt 1 bis 5 sind zusammen weniger Code als der geplante Faktorkatalog allein —
und tragen alles, was hier messbar getragen hat.
