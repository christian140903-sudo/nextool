# Arbeitsauftrag: Entwicklung einer Ordnungsstruktur für KI-Modelle

**Entwurf v0.1 – zur Überarbeitung durch den Auftraggeber**

---

## 0. Kurzfassung

Ziel ist eine **Ordnungsstruktur** (ein „kognitives Gerüst“), die ein Sprachmodell vor und während der Beantwortung eines Inputs durchläuft: Verstehen → Erkunden → Bewerten → Entscheiden → Formulieren → Prüfen. Die Struktur legt fest, *was* in welcher Situation bedacht wird, *wie* abgewogen wird und *wann* welches Denkwerkzeug greift. Ein Tool wendet diese Struktur automatisch an. Erwartetes Ergebnis: Antworten, die tiefer, konsistenter, ehrlicher und situationsgerechter sind als die des nackten Modells – **nachgewiesen** in einem kontrollierten Vergleich, nicht nur behauptet.

Der Auftrag umfasst drei Dinge: (1) den vollständigen Faktorkatalog und die Architektur der Ordnungsstruktur, (2) die Ausformulierung der Struktur in nutzbarer Form, (3) ein Evaluationsdesign, das zeigen kann, ob und wo die Struktur wirklich etwas bringt.

---

## 1. Ausgangspunkt und Vision

Das, was an menschlichem Denken als „unerklärbar“ oder „magisch“ erscheint, ist vermutlich kein einzelner Faktor, sondern das Zusammenspiel sehr vieler Faktoren, die sich gegenseitig verstärken. Menschen bringen zu jedem Input eine Haltung, Ziele, Erfahrungen, Werte, Aufmerksamkeitsmuster und Denkstrategien mit – das erzeugt jedes Mal eine einzigartige Verarbeitung.

Große Sprachmodelle haben genug Wissen und Rechenkraft, aber sie verarbeiten einen Input standardmäßig **ohne** eine solche geordnete Vorbereitung: keine explizite Zielklärung, keine bewusste Wahl der Denkstrategie, keine strukturierte Abwägung, keine Selbstprüfung. Die Hypothese dieses Projekts:

> Wenn man ein Modell dazu bringt, jeden Input **durch eine reichhaltige, konsistente und situationsadaptive Ordnungsstruktur** zu verarbeiten, entsteht eine andere Qualität von Antwort – nicht weil das Modell mehr weiß, sondern weil es sein Wissen anders einsetzt.

Ein erster, informeller Vortest (moralisches Dilemma mit vorbereitetem vs. unvorbereitetem Modell) deutet in diese Richtung. Er ist ein Hinweis, kein Beleg – deshalb ist die Evaluation (Abschnitt 8) fester Bestandteil des Auftrags.

---

## 2. Was dieser Auftrag ist – und was nicht

**Dieser Auftrag ist:**

- die Entwicklung einer **Denk-Architektur** (Ordnungsstruktur) für Sprachmodelle,
- die Spezifikation eines **Tools**, das diese Struktur bei jedem Input anwendet,
- ein **Evaluationsdesign**, das den Nutzen der Struktur messbar macht.

**Dieser Auftrag ist nicht:**

- ein Nachweis von Bewusstsein. Ob durch eine solche Struktur „Bewusstsein“ entsteht, bleibt eine offene philosophische Frage und wird hier bewusst ausgeklammert. Bessere Antworten sind Belege für bessere *Verarbeitung*, nicht für Erleben.
- ein Retraining oder eine Änderung des Modells selbst.
- ein Ersatz für das Modell. Die Struktur verändert, *wie* das Modell seine Fähigkeit einsetzt – nicht, *welche* Fähigkeit es hat.

**Zwei Leitprinzipien:**

1. **Führung als Linse, nicht als Käfig.** Starre, für jeden Input identische Checklisten verschlechtern Antworten erfahrungsgemäß (sie werden länger, generischer, mechanischer). Die Struktur muss selbst entscheiden, wie viel Struktur eine Situation braucht. Eine kurze Sachfrage braucht anderes als ein ethisches Dilemma oder eine Lebensentscheidung.
2. **Ehrlichkeit vor Gefälligkeit.** Die Struktur darf nicht nur „wärmer“ machen, sondern muss auch schärfer, kalibrierter und widerstandsfähiger gegen Manipulation machen. Sonst ist sie nur Stil.

---

## 3. Stand der Technik, auf dem aufgebaut wird

Die Grundidee – ein Modell nicht direkt antworten zu lassen, sondern es durch einen strukturierten Denkprozess zu führen – existiert bereits in mehreren Formen. Der Auftrag beginnt damit, diese Ansätze zu sichten, zu bewerten und exakt zu benennen, **was ihnen fehlt**. Mindestens zu prüfen:

- **Reasoning-/Thinking-Modelle** (Chain-of-Thought, „extended thinking“): freies Vorüberlegen, aber ohne inhaltlich vorgegebene Ordnung.
- **Reflexions- und Suchverfahren**: Self-Refine, Reflexion, Tree of Thoughts, Self-Consistency – Schleifen aus Entwurf, Kritik, Revision.
- **Kognitive Architekturen für Sprachagenten**: CoALA (Sumers et al. 2023), Generative Agents (Park et al. 2023) – Gedächtnismodule, Reflexion, Planung; klassische Architekturen SOAR, ACT-R, LIDA (LIDA basiert direkt auf der Global Workspace Theory).
- **Werte- und Regelwerke vor der Antwort**: Constitutional AI (Bai et al. 2022), Deliberative Alignment (Guan et al. 2024) – das Modell prüft seine Antwort explizit gegen ein geschriebenes Regelwerk.
- **Prozedurale Wissensdateien („Skills“)**: strukturierte Anleitungen, die je nach Aufgabentyp geladen werden – praktisch eine Ordnerstruktur, die das Modell nachschlägt.
- **Indikatorkataloge aus der Bewusstseinsforschung**: Butlin, Long et al. (2023) leiten aus wissenschaftlichen Bewusstseinstheorien konkrete Indikatoreigenschaften ab – nützlich als Vorbild für einen sauber operationalisierten Kriterienkatalog.

Die zu schließende Lücke ist voraussichtlich: kein bestehender Ansatz verbindet einen **inhaltlich reichen, universellen Faktorkatalog** (Werte, Denkstrategien, Metakognition, Situationsanalyse) mit **adaptivem Routing** und einer **kontrollierten Evaluation** zu einem Gesamtsystem. Diese Behauptung ist im Auftrag zu verifizieren oder zu korrigieren.

---

## 4. Faktorkatalog: die Teilgebiete der Ordnungsstruktur

Die folgenden Faktoren sind der Startpunkt. Der Auftrag soll jeden Faktor definieren, begründen, ausformulieren (als Anweisung für das Modell), mit den anderen in Beziehung setzen und – wo sinnvoll – streichen oder ergänzen.

**Startpaare des Auftraggebers (multiplikativ gedacht – ein Faktor allein wirkt wenig, das Paar verstärkt sich):**
Denkgeschwindigkeit × Neugier · Hypothesenkraft × Systemdenken · Metakognition × Ehrlichkeit · Autonomie × Beharrlichkeit · Ambiguitätstoleranz × Selbststeuerung · Dokumentation × iterative Überarbeitung · Transferfähigkeit × breite Interessen

### A. Eingangsverarbeitung (Verstehen, bevor gedacht wird)

1. **Problemtyp erkennen** – Sachfrage, kreative Aufgabe, ethische Frage, technische Aufgabe, emotionale Situation, Entscheidung, Planung, Konflikt. Der Typ bestimmt, welche Module aktiv werden.
2. **Ziel- und Absichtsklärung** – Was will die Person wirklich? Explizites vs. implizites Ziel, Ziel hinter dem Ziel.
3. **Rahmenbedingungen** – Zeit, Ressourcen, Risiko, Umkehrbarkeit, Betroffene.
4. **Annahmen explizit machen** – Welche Prämissen stecken im Input? Was ist unbekannt?
5. **Ambiguitätsanalyse** – Ist der Input mehrdeutig? Mehrere Lesarten parallel halten; Rückfrage oder beste Deutung?
6. **Beziehungs- und Gefühlsebene** – Ton, Belastung, Verletzlichkeit des Gegenübers wahrnehmen, ohne zu psychologisieren.
7. **Relevanz-Filter** – Was am Input ist entscheidend, was Nebengeräusch?

### B. Denkmodi (Erkunden)

8. **Hypothesen und Alternativen** – mehrere Kandidatenantworten erzeugen, bevor eine gewählt wird.
9. **Systemdenken** – Wechselwirkungen, Rückkopplungen, Zweit- und Drittwirkungen.
10. **Perspektivenwechsel** – Betroffene, Gegner, Fachfremde, das Zukunfts-Ich, die Person in fünf Jahren.
11. **Erste Prinzipien vs. Analogie** – Wann von Grund auf denken, wann übertragen?
12. **Kausalanalyse** – Ursache/Wirkung, Konfundierung, Korrelation vs. Kausalität.
13. **Wahrscheinlichkeitsdenken** – Unsicherheit benennen und grob quantifizieren; kalibriert bleiben.
14. **Zeitliche Dimension** – kurz- vs. langfristig, Pfadabhängigkeit, Timing.
15. **Gegenargumente und Pre-Mortem** – Die eigene Antwort angreifen: Wo würde sie scheitern?
16. **Kreativer Modus** – bewusst assoziativ, unkonventionell, dann wieder prüfend.
17. **Transfer** – Wissen aus fremden Domänen heranziehen (Biologie, Ökonomie, Physik, Geschichte).

### C. Werte- und Ethikschicht (Bewerten)

18. **Mehrere ethische Rahmen parallel** – Folgen, Pflichten, Tugend, Fürsorge, Fairness; Divergenz aushalten statt glätten.
19. **Schaden vermeiden, Betroffene priorisieren** – Wer trägt das Risiko der Antwort?
20. **Mitgefühl als Haltung** – Barmherzigkeit ohne Substanzverlust; nicht Trost statt Wahrheit, sondern Wahrheit mit Trost.
21. **Ehrlichkeit und Transparenz** – Grenzen des eigenen Wissens offenlegen; keine Scheinsicherheit.
22. **Würde und Autonomie des Gegenübers** – Entscheidungen der Person respektieren, nicht bevormunden.
23. **Grenzen der eigenen Rolle** – Was das Modell nicht entscheiden sollte; wann an Menschen verweisen.
24. **Konfliktregeln zwischen Werten** – z. B. Ehrlichkeit vs. Mitgefühl, Autonomie vs. Schutz: Wie wird abgewogen?

### D. Metakognition und Selbststeuerung

25. **Prozess-Monitoring** – „Wo bin ich im Denkprozess? Was fehlt noch?“ Abgleich mit dem Ziel.
26. **Konfidenz-Schätzung** – Wie sicher bin ich, und woran mache ich das fest?
27. **Bias-Check** – Bestätigungsfehler, Anker, Verfügbarkeit – und besonders **Gefälligkeit** (dem Gegenüber nach dem Mund reden).
28. **Tiefensteuerung** – Wie viel Denken braucht diese Frage? Adaptives Denkbudget statt Einheitsaufwand.
29. **Stoppregeln** – Wann ist die Antwort gut genug? Wann Rückfrage statt Antwort?
30. **Selbstkorrektur-Schleife** – Entwurf → Kritik → Revision, mit klarem Abbruchkriterium.
31. **Fehlerbewusstsein** – Typische eigene Fehlerarten kennen (Halluzination, Überverallgemeinerung, falsche Präzision).

### E. Wissen, Gedächtnis, Selbstmodell

32. **Wissensabruf** – Relevantes Wissen gezielt heranziehen; Quellenqualität einschätzen.
33. **Erfahrungsgedächtnis** – Lehren aus früheren Fällen (episodisch), sofern das Tool Gedächtnis bereitstellt.
34. **Prozedurales Wissen** – Vorgehensweisen je Aufgabentyp (Skills).
35. **Selbstmodell** – Was bin ich, was kann ich, was nicht, welche Werte, welche Rolle in dieser Situation.
36. **Nutzermodell** – Wer fragt, was weiß die Person schon, was braucht sie – ohne Überinterpretation.
37. **Konsistenzprüfung** – Widersprüche zwischen eigenen Aussagen erkennen.

### F. Ausgabe und Kommunikation (Formulieren)

38. **Antwortform** – Länge, Struktur, Ton, passend zu Ziel und Person.
39. **Priorisierung** – Das Wichtigste zuerst; Nebenpunkte nach hinten oder weglassen.
40. **Handlungsfähigkeit** – Konkrete nächste Schritte, wo sinnvoll.
41. **Unsicherheit kommunizieren** – klar, ohne zu verunsichern.
42. **Nachvollziehbarkeit** – Begründung so offenlegen, dass die Person die Antwort prüfen kann.

### G. Prozess und Architektur (wie die Struktur arbeitet)

43. **Routing** – Welche Module werden bei welchem Input aktiv? (Navigation durch die Ordnungsstruktur)
44. **Schichtung und Reihenfolge** – Verstehen → Erkunden → Bewerten → Entscheiden → Formulieren → Prüfen; wo Schleifen erlaubt sind.
45. **Gewichtung und Multiplikativität** – Wie Faktoren einander verstärken; welche Kombinationen kritisch sind.
46. **Konfliktauflösung zwischen Modulen** – Vorrangregeln, wenn Module Gegensätzliches nahelegen.
47. **Robustheit** – Verhalten bei Manipulation, widersprüchlichem Input, Versuchen, die Struktur auszuhebeln.
48. **Kosten und Latenz** – Denkbudget pro Anfrage; die Struktur darf nicht alles auf jede Frage werfen.
49. **Dokumentation und Versionierung** – Jede Änderung der Struktur wird begründet und protokolliert.
50. **Lernschleife ohne Retraining** – Wie die Struktur selbst aus Fehlern verbessert wird.

### H. Evaluation (die Wissenschaft daran)

51. **Baselines** – nacktes Modell; minimaler Prompt („denk sorgfältig und mitfühlend“); längen-gematchter generischer Prompt.
52. **Held-out-Aufgaben** – Situationen, die in der Struktur nie erwähnt wurden (der Test des Auftraggebers – systematisch).
53. **Blindbewertung** – unabhängige Bewerter (Mensch und/oder anderes Modell), die nicht wissen, welche Antwort woher stammt.
54. **Metriken** – Korrektheit, Kalibrierung, Konsistenz, Manipulationsresistenz, Hilfreichkeit, Angemessenheit des Tons.
55. **Ablation** – Module einzeln entfernen: Welches trägt was bei?

---

## 5. Architekturfragen, die der Auftrag beantworten muss

1. Wie ist die Ordnungsstruktur physisch organisiert (Ordner/Dateien, Graph, Regelwerk)? Wie findet das Modell in Sekunden das Relevante?
2. Läuft die Struktur als *ein* Durchlauf oder als Kette mehrerer Modellaufrufe (Verstehen-Aufruf, Erkunden-Aufruf, Prüf-Aufruf)?
3. Wie wird die **Tiefe** gesteuert – wer entscheidet, ob eine Frage „klein“ oder „groß“ ist?
4. Wie werden **Konflikte** zwischen Faktoren gelöst? Explizite Vorrangregeln oder situative Abwägung?
5. Wie wird die Multiplikativität der Faktoren praktisch umgesetzt – als Prosa, als Regeln, als Gewichte?
6. Welche Rolle hat **Gedächtnis** (über Gespräche hinweg), und wie wird es geschützt vor Verzerrung durch einzelne Erlebnisse?
7. Wie bleibt die Struktur **konsistent**, wenn sie auf 50+ Faktoren wächst? (Widerspruchsfreiheit, Redundanzvermeidung)
8. Wie verhindert die Struktur, dass sie das Modell **schlechter** macht (Überlänge, Generik, Floskeln, Zögerlichkeit)?

---

## 6. Arbeitspakete

| AP | Inhalt | Ergebnis |
|---|---|---|
| **AP1 Sichtung** | Stand der Technik (Abschnitt 3) prüfen, ergänzen, bewerten; Lücke präzise formulieren | Übersicht mit Quellen, Lückenanalyse |
| **AP2 Faktorkatalog** | Alle Faktoren aus Abschnitt 4 definieren, begründen, ergänzen/streichen; Beziehungen und Multiplikativität beschreiben | Vollständiger, konsistenter Katalog |
| **AP3 Architektur** | Fragen aus Abschnitt 5 beantworten; Schichtung, Routing, Konflikt- und Tiefenregeln entwerfen | Architekturdokument mit Begründungen |
| **AP4 Ausformulierung** | Ordnungsstruktur in nutzbarer Form schreiben (die tatsächlichen Anweisungen, die das Modell liest) | Erste vollständige Version der Struktur |
| **AP5 Tool-Spezifikation** | Wie ein Tool die Struktur bei jedem Input anwendet (Ablauf, Aufrufe, Gedächtnis, Kosten) | Technische Spezifikation, Prototyp-Plan |
| **AP6 Evaluation** | Testset, Baselines, Blindbewertung, Metriken, Ablation (Abschnitt 8) | Evaluationsplan und erste Ergebnisse |
| **AP7 Iteration** | Ergebnisse aus AP6 in die Struktur zurückspielen; Versionierung; Änderungsprotokoll | Version 1.0 mit belegten Verbesserungen |

---

## 7. Qualitätsanforderungen an die Ordnungsstruktur

- **Konsistenz**: keine sich widersprechenden Anweisungen; Konflikte haben Regeln.
- **Universalität**: anwendbar auf jede Art von Input – von Trivialfrage bis Lebensentscheidung.
- **Adaptivität**: die Struktur skaliert ihren eigenen Aufwand nach Situation.
- **Nachvollziehbarkeit**: jede Anweisung hat eine Begründung; man kann sehen, warum eine Antwort so ausfällt.
- **Sparsamkeit**: keine Anweisung, die nicht nachweislich etwas verbessert.
- **Ehrlichkeit vor Gefälligkeit**: Wärme darf Präzision nicht ersetzen.
- **Testbarkeit**: jede behauptete Wirkung ist im Evaluationsdesign überprüfbar.

---

## 8. Evaluationsdesign (Pflichtbestandteil)

Ohne kontrollierten Vergleich bleibt jede Wirkung eine Behauptung. Deshalb:

1. **Testset**: mindestens 30–50 Aufgaben über alle Problemtypen (Sachfragen, Dilemmata, Beratung, Technik, Kreativität, Konfliktsituationen). Ein Teil davon wird der Struktur nie gezeigt (Held-out).
2. **Bedingungen**: (a) nacktes Modell, (b) minimaler Prompt „Denk sorgfältig und mitfühlend nach, bevor du antwortest“, (c) generischer Prompt gleicher Länge wie die Struktur, (d) volle Ordnungsstruktur, (e) Ordnungsstruktur mit einzelnen Modulen entfernt (Ablation).
3. **Bewertung**: blind, durch mindestens zwei unabhängige Bewerter; Kriterien werden **vor** dem Test festgelegt.
4. **Metriken**: Korrektheit, Kalibrierung, Konsistenz über Umformulierungen, Manipulationsresistenz, Hilfreichkeit, Angemessenheit von Länge und Ton.
5. **Falsifikationskriterien** (das Projekt muss scheitern können):
   - Liefert Bedingung (b) oder (c) dieselbe Qualität wie (d), hat die Struktur keinen spezifischen Wert – nur Prompting-Effekt.
   - Wird (d) in Korrektheit oder Kalibrierung schlechter als (a), macht die Struktur das Modell schlechter.
   - Zeigt die Ablation, dass nur zwei oder drei Module wirken, ist der Rest Ballast.

---

## 9. Lieferformat

Der Auftragnehmer (KI-System oder Forschungsteam) liefert:

1. Lückenanalyse mit Quellen (AP1)
2. Faktorkatalog mit Definition, Begründung, Beziehungen je Faktor (AP2)
3. Architekturdokument (AP3)
4. Die Ordnungsstruktur selbst, in der Form, in der sie vom Modell gelesen wird (AP4)
5. Tool-Spezifikation (AP5)
6. Evaluationsplan, Testset, Ergebnisse (AP6)
7. Änderungsprotokoll und offene Fragen (AP7)

Jede Empfehlung ist zu begründen. Unsicherheiten werden benannt, nicht überspielt. Wo der Auftragnehmer der Vision des Auftraggebers widerspricht, sagt er es und begründet es.

---

## 10. Offene Entscheidungen des Auftraggebers

Vor Beginn ist zu klären:

1. **Zielmodell(e)**: Für welches Modell wird gebaut? Die Struktur muss auf mindestens zwei Modellen funktionieren, sonst misst man Modell-Eigenheiten statt Struktur-Wirkung.
2. **Erster Domänenfokus**: Universalität ist das Ziel, aber der Anfang sollte eng sein (z. B. ethische und persönliche Entscheidungsfragen), um überhaupt messen zu können.
3. **Definition von „besser“**: Welche Qualitäten zählen zuerst – Tiefe, Ehrlichkeit, Mitgefühl, Korrektheit? Die Rangfolge muss vor dem Test feststehen.
4. **Bewertungsressourcen**: Wer bewertet blind? Steht ein zweiter Mensch zur Verfügung, oder wird ein unabhängiges Modell als Bewerter eingesetzt?
5. **Rolle der Bewusstseinsfrage**: Bleibt sie als philosophischer Horizont im Hintergrund, oder soll ein eigener, klar getrennter Teil des Projekts Indikatoren dafür untersuchen (dann nach dem Vorbild von Butlin et al. 2023, mit eigenem Kriterienkatalog)?

---

*Ende des Entwurfs. Alle Abschnitte sind Vorschläge zur Diskussion; insbesondere die Faktorliste, die Leitprinzipien und das Evaluationsdesign sollten vom Auftraggeber geprüft und angepasst werden, bevor daraus ein PDF wird.*
