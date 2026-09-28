# Offene Fragen — was nicht gemessen ist

*Nach erwartetem Wert sortiert. Jede Frage ist mit der vorhandenen Strecke
messbar; die Befehle stehen in `04-WEITERMESSEN.md`.*

---

## Rang 1 — Offenes Urteil, Abwägung, Beratung

**Die größte Lücke.** Alle Messungen hier hatten exakt berechenbare Wahrheit —
genau deshalb war keine Judge-Verzerrung möglich, und genau deshalb fehlt die
Domäne, in der eine reiche Denkstruktur am ehesten wirken könnte.

**Für diese Domäne gilt kein Befund von hier.** Wer den Faktorkatalog dort
verteidigen will, hat gute Gründe — nur keine Zahlen.

*Warum schwierig:* Ohne objektive Grundwahrheit braucht es einen Judge, und der
Längenbias des Judges hat die Vorgängerforschung vier Zahlen gekostet. Ein
belastbarer Aufbau müsste: paarweise blind urteilen, längenstratifiziert,
mit vorregistrierten Kriterien und einem Placebo-Arm.

*Nächster Schritt:* Aufgaben mit **prüfbaren Teilzielen** statt freiem Urteil —
z. B. „nenne die drei Bedingungen, unter denen dieser Plan scheitert" mit einer
vorab festgelegten Menge echter Bedingungen. Damit wird ein Teil des Urteils
objektiv messbar, ohne Judge.

---

## Rang 2 — Gedächtnis über Zeit

Gemessen wurde Gedächtnis **in einer Sitzung** mit injizierten Einträgen. Nicht
gemessen:

- **Konsolidierung** („Schlaf"): Was überlebt die Verdichtung? Ein Test wäre:
  100 Episoden → Konsolidierung → dieselben Fragen. Verlustrate messbar.
- **Verfall und Haltbarkeitsvorhersage** (E3): Brier-Score der Halbwertszeit
  über Wochen. Braucht Laufzeit, nicht Aufwand.
- **Miete** (E6): Führt Nutzungs-/Beitragsgewichtung zu besseren Briefings als
  Aktualität? Direkt messbar mit zwei Briefing-Varianten.
- **Skalierung:** Rauschen kostete bei 12 Einträgen 3,3 pp. Bei 500? Bei 5 000?
  Die Kurve ist unbekannt und entscheidet über den Retrieval-Aufwand.

---

## Rang 3 — Modellwahl und Kosten

Nicht gemessen: welches Modell für welchen Aufgabentyp bei welchen Kosten pro
**bestandenem** Ergebnis. Die Strecke kann das (`--model`), es fehlt nur der Lauf.

Besonders offen: Ab welcher Aufgabenschwere lohnt das teurere Modell, und wann
schlägt „schwaches Modell + Prüfer" das starke Modell allein? Der Prüferbefund
(+20 pp bei 2 Aufrufen) legt nahe, dass das oft der Fall ist — ungeprüft.

---

## Rang 4 — Die Ebenen unter realen Bedingungen

Gemessen wurde Delegation an einer Aufgabe mit 7 prüfbaren Auflagen. Nicht
gemessen:

- Delegation mit **echter Arbeitsteilung** (verschiedene Teilaufgaben statt
  derselben Aufgabe durchgereicht). Der gemessene Verlust gilt für Durchreichen;
  bei echter Zerlegung könnte die Rechnung anders ausgehen.
- **Parallelität**: Der gemessene Nachteil ist rein sequentiell gedacht. Wenn
  fünf Ebenen-3-Agenten gleichzeitig arbeiten, ist der Vergleichsmaßstab Wanduhr,
  nicht Genauigkeit.
- **Rückkanal** (E18: Überraschungen nach oben) — ungeprüft.

---

## Rang 5 — Autonomie in der Praxis

Der Entwurf sieht vollen Gerätezugriff mit Live-Fenster und ohne Rückfragen vor.
Nicht gemessen und schwer messbar: Wie oft würde ein Nutzer eingreifen wollen,
und merkt er es rechtzeitig? Das ist eine Beobachtungsfrage, keine Laborfrage.

*Was stattdessen geht:* Die **Widerrufbarkeit** messen. Für jede autonome Aktion
protokollieren, ob ein Rückbau existiert und ob er funktioniert. Rückbauquote ist
eine Zahl; „hätte der Nutzer eingegriffen" ist keine.

---

## Rang 6 — Übertragbarkeit

Zwei Modelle, eine Familie (Haiku 4.5, Sonnet 4.5). Die Modellabhängigkeit ist
gezeigt und erklärt (Folgsamkeit gegenüber Formatbefehlen), aber nicht über
Anbieter hinweg geprüft. Besonders relevant für lokale Modelle, die im Zielbild
eine Rolle spielen — dort ist die Folgsamkeit typischerweise geringer, was den
Schweigeklausel-Befund abschwächen könnte.

---

## Was ich prüfen würde, wenn ich eine Nacht hätte

1. Die Rauschkurve des Gedächtnisses (12 → 100 → 1 000 Einträge). Entscheidet über
   den gesamten Retrieval-Aufwand und ist in zwei Stunden messbar.
2. „Schwaches Modell + Prüfer" gegen „starkes Modell allein", bei gleichen Kosten.
   Wenn das hält, ist es die zentrale Ökonomie des ganzen Tools.
3. Delegation mit echter Zerlegung statt Durchreichen.
