> Hinweis: KI-unterstützter Entwurf aus einer geprüften Recherche (Stand 2026-10-06). Zitate, Fristen und Förderregeln vor jeder Verwendung an der Originalquelle bestätigen.

# Vollständigkeitskritik — letzter Prüfschritt vor Übergabe

**Gesamturteil vorweg, in drei Sätzen.** Die acht Recherchestränge haben die Frage „Ist ECSA neu?" erschöpfend beantwortet (nein), die Frage „Kann man CS vorhersagen?" gut beantwortet (teilweise, schlecht kalibriert), und die Frage „Was ändert eine CS-Vorhersage für irgendjemanden?" **überhaupt nicht gestellt**. Alle acht Stränge sind methodenzentriert; keiner hat den Wirkungspfad vom Modell zum Patienten und zur Resistenzlast durchgerechnet. Genau dort liegt der fundamentale Einwand, und er ist schwerer als jedes Neuheitsproblem.

---

## 1. Die entscheidende Frage, die niemand gestellt hat

Es sind drei, in dieser Reihenfolge.

**(a) Welche Entscheidung trifft wer anders, wenn ECSA funktioniert?**

Kein Strang hat einen einzigen konkreten Entscheidungspunkt benannt. Keine Nutzerrolle, kein Zeitpunkt im Behandlungspfad, keine Alternative, gegen die verglichen wird. Das Dokument und alle acht Analysen bewegen sich ausschließlich auf der Ebene „Modellgüte". Ein Vorhersagemodell ohne definierten Entscheidungspunkt ist keine Forschungsinfrastruktur, es ist eine Tabelle.

Der Test dafür ist trivial und wurde nie durchgeführt: Schreiben Sie **einen Satz** in der Form *„Facharzt X entscheidet an Tag Y für Patient mit Zustand Z zwischen Option A und B; ohne ECSA wählt er A, mit ECSA B."* Wenn dieser Satz nicht ohne Konjunktiv schreibbar ist, gibt es kein Produkt — und dann ist auch der Regulatorik-Teil (MDR/SaMD) nicht nur verfrüht, sondern gegenstandslos.

**(b) Welche Qualifikation hat der Antragsteller tatsächlich?**

Das ist die praktisch wichtigste unbeantwortete Frage, weil sie über Lebenszeit entscheidet, und keiner der acht Stränge hat sie berührt. Der von mehreren Strängen empfohlene Plan — Datenkuration aus Supplementary Tables über sechs Studien mit unvereinbaren Endpunkten, hierarchisches Bayes-Modell mit korrekter Intervallzensierung, geclusterte Leave-one-study-out-Validierung, Kalibrierungsanalyse mit simulierter Nullverteilung — ist Arbeit auf Postdoc-Niveau in Biostatistik **und** mikrobieller Evolutionsbiologie gleichzeitig. Die Zeitschätzungen („4–10 Wochen", „5 Sekunden Rechenzeit") gelten für jemanden, der das schon einmal gemacht hat. Für jemanden, der es lernt, sind es 9–18 Monate, und der häufigste Ausgang ist ein Modell, das stillschweigend falsch konvergiert (Strang „rechenmachbarkeit" hat genau diesen Fehlermodus demonstriert: identische Laufzeit, plausible Mittelwerte, ESS=2).

**(c) Woran erkennen Sie, dass Sie aufhören sollten?**

Kein Strang hat ein Abbruchkriterium formuliert. Bei einem selbstfinanzierten Einzelvorhaben ohne Institution ist das die gefährlichste Lücke überhaupt, weil die Abwesenheit eines Abbruchkriteriums bedeutet, dass es keinen Zustand der Welt gibt, in dem Sie das Projekt beenden — und das ist der Mechanismus, über den Jahre verschwinden. Formulieren Sie es, bevor Sie eine Zeile Code schreiben. Mein Vorschlag steht in Abschnitt 4.

---

## 2. Stillschweigende Annahmen, die das ganze Vorhaben tragen und ungeprüft geblieben sind

**A1 — Das AMR-Problem ist ein Vorhersageproblem.** Das ist die Masterannahme, und sie ist nirgends belegt. Antibiotikaresistenz ist überwiegend ein Zugangs-, Verschreibungs-, Hygiene-, Diagnostik- und Agrarproblem. Der limitierende Faktor in der Praxis ist nicht, dass niemand wüsste, welches Antibiotikum als nächstes käme — es ist, dass die Erregeridentifikation 24–72 Stunden dauert, dass empirisch behandelt wird, bevor irgendein Antibiogramm vorliegt, und dass ein erheblicher Teil der globalen Last auf fehlenden Zugang zu wirksamen Antibiotika entfällt, nicht auf falsche Wirkstoffwahl. ECSA optimiert eine Variable, die nicht die bindende ist.

**A2 — Resistenz entsteht im Patienten überwiegend de novo.** Das ist die biologische Voraussetzung dafür, dass Sequenztherapie überhaupt greifen kann, und sie ist in der klinischen Literatur weitgehend widerlegt. Stracy et al. fanden an 1.113 sequenzierten Vor-/Nach-Therapie-Isolaten plus 140.349 Harnwegsinfektionen, dass Resistenzentstehung unter Therapie *„driven not by de novo resistance evolution but by rapid reinfection with a different strain"* ist [1]. Díaz Caballero et al. zeigten, dass Resistenz in gemischten Stammpopulationen durch Selektion bereits vorhandener resistenter Stämme entsteht, nicht durch neue Mutationen [3]. Shepherd et al. listen in ihrem Nature-Reviews-Microbiology-Überblick **vier** Mechanismen der Within-Patient-Resistenzentstehung, von denen spontane Mutation nur einer ist [5]. Phylogenetische Partitionierung zeigt, dass der Anteil je Wirkstoff stark schwankt — für Ciprofloxacin, Ceftazidim und Amoxicillin/Clavulansäure dominiert Transmission, für Cefuroxim und Gentamicin eher De-novo-Evolution [2, 4].

Das ist kein Detail. **CS-Sequenztherapie wirkt per Konstruktion ausschließlich auf den De-novo-Pfad.** Wenn dieser Pfad einen Minderheitsanteil der Resistenzlast trägt, ist die maximal erreichbare Wirkung bereits an der Quelle um den entsprechenden Faktor gedeckelt — und zwar unabhängig davon, wie gut das Modell wird. Bemerkenswert: Das ECSA-Dokument zitiert Stracy selbst, offenbar als Stütze. Es zitiert die Arbeit, die seine zentrale Prämisse untergräbt.

**A3 — Die Bakterienpopulation im Patienten ist klonal und ihr Phänotyp ist ein Punktwert.** Siehe Abschnitt 3.3 — das ist falsch und messbar falsch.

**A4 — Die Antibiotikasequenz ist frei wählbar.** Sie ist es nicht. Fokus, Gewebegängigkeit, Nierenfunktion, Allergien, Schwangerschaft, Interaktionen, Leitlinien, Hausliste, Verfügbarkeit, Kosten und die empirische Erstgabe vor jeder Erregerdiagnostik schränken den Entscheidungsraum auf typischerweise zwei bis vier realistische Optionen ein. Ein Graph mit 16 Knoten modelliert einen Entscheidungsraum, den es klinisch nicht gibt. Keiner der acht Stränge hat den tatsächlichen klinischen Entscheidungsraum quantifiziert.

**A5 — Fördermittel sind der Engpass.** Sind sie nicht. Der Engpass ist eine Institution und eine Person mit Namen, die für Sie bürgt. Strang „förderung" kommt dem am nächsten, zieht die Konsequenz aber nicht: Fast jede ernsthafte Linie wird dadurch erreichbar, dass Sie einen Gastwissenschaftler-/Affiliate-Status bekommen — und das kostet die aufnehmende Einrichtung nichts.

**A6 — Vorarbeit ist das, was fehlt.** Siehe A5. Eine Mini-Simulation ist kein Selbstzweck; sie ist das Eintrittsticket für ein Gespräch. Das sollte die Zielfunktion der nächsten Monate sein, nicht „Antragsreife".

---

## 3. Die fundamentalen Einwände

### 3.1 Die Wirkungskette bricht an fünf Stellen — und die klinische Evidenz ist nicht „offen", sondern zweimal negativ

Die implizite Kette lautet: CS-Kante vorhersagbar → im Patienten anwendbar → Sequenz klinisch wählbar → Resistenz bei diesem Patienten verhindert → Resistenzlast in der Population sinkt → globale AMR-Last sinkt drastisch.

| Glied | Was die Evidenz sagt |
|---|---|
| 1. CS existiert klinisch | 3,0 % der Spezies-Antibiotikum-Paare (364/12.024) gegenüber 42,0 % Kollateralresistenz (Tandar et al. 2026) |
| 2. De-novo-Pfad | Minderheitsanteil, wirkstoffabhängig; dominant sind Reinfektion und Selektion präexistenter Subpopulationen [1,2,3,5,6] |
| 3. Sequenz wählbar | stark eingeschränkt (A4); setzt zweite Therapierunde beim selben Patienten mit demselben Stamm voraus |
| 4. Klinischer Effekt | **zwei Studien, zwei Nullresultate** |
| 5. Globale Last | europäische Intensivstationen tragen einen kleinen Teil davon |

Zu Glied 4, und das ist der Punkt, den die Analyse unterbelichtet lässt: Es ist **nicht** so, dass Antibiotika-Zyklierung klinisch ungetestet wäre. Sie ist getestet und hat nicht funktioniert.

- van Duijn et al. 2018, Lancet Infect Dis: 8 Intensivstationen, 5 Länder, cluster-randomisiertes Crossover, 4.069 vs. 4.707 Aufnahmen. Resistente gramnegative Bakterien 23 % vs. 22 %, p = 0,64; adjustiertes Incidence-Rate-Ratio 1,039 (95 % KI 0,837–1,291). Keine Mortalitätsdifferenz.
- Jayashree et al. 2020, J Crit Care: pädiatrische Intensivstation, 778 Kinder, Latin-Square-Design mit Washout, Cycling vs. Mixing. Adjustierte Hazard Ratio für Resistenzerwerb 0,82 (95 % KI 0,53–1,25; p = 0,352), Mortalität RR 1,07 (0,71–1,60). Laut PubMed: [DOI](https://doi.org/10.1016/j.jcrc.2020.01.013)

Das faire Gegenargument lautet: Beides war **nicht** CS-informiertes Cycling. Das stimmt — aber es rettet die These nicht, es verschiebt nur die Beweislast. Die ehrliche Formulierung ist: *Antibiotika-Rotation als Prinzip wurde zweimal randomisiert getestet und war zweimal null; CS-informierte Rotation wurde nie klinisch getestet; es gibt also für die spezifische Behauptung null klinische Evidenz und für das übergeordnete Prinzip negative Evidenz.* Jeder Gutachter aus der Infektiologie kennt van Duijn. Ein Antrag, der ihn nicht selbst nennt und nicht erklärt, warum CS-Informierung den Unterschied machen soll, ist nach dem ersten Absatz erledigt.

**Fermi-Abschätzung der Obergrenze:** Selbst bei großzügigen Annahmen — 3 % nutzbare CS-Paare, davon vielleicht ein Drittel in klinisch wählbaren Sequenzen, davon der De-novo-Anteil der Resistenzentstehung, davon der Anteil der globalen Last, der in Settings mit CS-fähiger Diagnostik entsteht — landet man bei einem Effekt auf die globale Resistenzlast im Bereich von Zehntelprozent, mit einem Konfidenzintervall, das null einschließt. Das ist kein Argument gegen die Wissenschaft. Es ist ein Argument dagegen, 24–25 Mio. EUR mit „drastische Reduktion der weltweiten Resistenz" zu begründen.

### 3.2 Wäre eine kalibrierte Wahrscheinlichkeit klinisch handlungsleitend? Nein — unter den aktuellen Bedingungen nicht

Sechs der acht Stränge empfehlen Kalibrierung als zentralen Beitrag. Keiner hat geprüft, ob eine kalibrierte Wahrscheinlichkeit eine Entscheidung ändern würde.

Entscheidungstheoretisch ändert eine Wahrscheinlichkeit nur dann eine Handlung, wenn sie eine Schwelle überschreitet, und die Schwelle ergibt sich aus dem Verhältnis von Schaden zu Nutzen. Hier ist dieses Verhältnis maximal ungünstig:

- **Schaden:** individuell, sofort, messbar. Eine CS-optimierte statt wirksamkeitsoptimierte Erstlinie bedeutet für *diesen* Patienten potenziell verzögerte adäquate Therapie — der am besten belegte Mortalitätstreiber bei schweren Infektionen überhaupt.
- **Nutzen:** kollektiv, verzögert, hypothetisch, dem einzelnen Patienten nicht zurechenbar, und klinisch bislang unbelegt (3.1).

Daraus folgt eine sehr hohe Entscheidungsschwelle. Bei einer CS-Basisrate von 3 % und einer realistisch erreichbaren Diskrimination um AUC 0,75 ist der positive prädiktive Wert so niedrig, dass der Net Benefit über fast den gesamten plausiblen Schwellenbereich **negativ** bleibt. Dazu kommt, dass bei Kantenwahrscheinlichkeiten im Bereich 0,5–0,7 — also dem, was die Replikatdaten tatsächlich hergeben — die Information faktisch ein Münzwurf mit Nachkommastellen ist.

Es gibt genau **eine** Nische, in der es anders aussieht: bekannter Erreger, dokumentiertes Therapieversagen unter Wirkstoff A, zwei etwa gleichwertige Zweitlinienoptionen, Entscheidung wird ohnehin getroffen. Dort ist der Schaden symmetrisch und die Zusatzinformation umsonst. Das ist eine kleine, aber reale und ehrliche Zielsetzung — und sie ist das Gegenteil von „europäischer Atlas".

### 3.3 Ist MIC der richtige Endpunkt? Nein — und das ist der am besten belegte und am gründlichsten übersehene Einwand

Dies ist der größte blinde Fleck aller acht Stränge: **Heteroresistenz und Heterotoleranz kommen in keinem einzigen der acht Berichte vor.**

- Nicoloff et al. untersuchten 41 klinische Isolate von *E. coli*, *S. enterica*, *K. pneumoniae* und *A. baumannii* gegen 28 Antibiotika. Von 766 Bakterien-Antibiotikum-Kombinationen waren **27,4 % heteroresistent** — die Mehrzahl instabil, getrieben durch spontane Tandem-Genamplifikationen. Mathematische Modellierung zeigt, dass Heteroresistenz in diesem Bereich zum Therapieversagen bei Bakterien führt, die als sensibel klassifiziert sind. Wörtlich: *„highlights the limitations of MIC as the sole criterion for susceptibility determinations"* [7].
- Van den Bergh et al. testeten über 1.000 klinische Stämme und fanden weit verbreitete Heterotoleranz, die von MIC-basierter Diagnostik übersehen wird. Fazit: *„AMR alone does not predict treatment success"* [8].
- Pereira et al. zeigen, dass resistente Subpopulationen unter subinhibitorischer Exposition rasch angereichert werden und ohne Selektion wieder verschwinden — Standard-AST unterschätzt Heteroresistenz erheblich [10].
- Ozturk et al. (Lancet Microbe) identifizieren Heteroresistenz als Ursache diskrepanter AST-Ergebnisse [9]; Roch et al. ordnen das Phänomen für die ESKAPE-Erreger klinisch ein [11].
- **Der schärfste Einzelbefund:** Kittleson et al. beschreiben einen *K.-pneumoniae*-Fall, der wie klassische De-novo-Resistenzentwicklung unter Therapie aussah (sensibel → resistent). Tatsächlich war beides heteroresistent; der Wechsel entstand durch eine Frequenzverschiebung der vorhandenen resistenten Subpopulation via Kopienzahlerhöhung von *bla*SHV-1 [6].

Die Konsequenz für ECSA ist zweifach und beide Male tödlich:

1. **MIC ist ein Populationsmittelwert, der genau die Subpopulation verfehlt, die klinisch entscheidet.** Eine CS-Kante, definiert als log2-Verhältnis zweier Populationsmittelwerte, kann systematisch das Falsche messen.
2. **ECSAs σ_ij misst die falsche Verteilung.** Das Dokument misst Streuung *zwischen Replikaten* (Messrauschen) und nennt es Unsicherheit. Die biologisch und klinisch entscheidende Verteilung ist die *innerhalb eines Isolats* — und die ist mit MIC per Definition nicht sichtbar, sondern nur per Population Analysis Profiling. Das ist nicht nur ein Etikettenschwindel („Bayes'sche Inferenz"), sondern ein Kategorienfehler in der Zielgröße.

Dazu kommt, dass Kittleson zeigt: Der Mechanismus, den ECSA modelliert (Mutation → stabiler neuer Phänotyp → stabile CS-Kante), ist in einem relevanten Anteil der Fälle gar nicht der wirksame Mechanismus. Wenn der Phänotypwechsel eine reversible Frequenzverschiebung ist, hat die „CS-Kante zwischen Antibiotikum A und B" keine stabile Existenz, die man kartieren könnte.

**Ein praktischer Nebenbefund zum Nasslabor-Design:** Feng et al. zeigten in Chemostaten unter simulierten Patientenplasma-Konzentrationen, dass *P. aeruginosa* in Klumpen filamentöser Zellen überlebt und MIC-Anstiege um Faktor 10 bis 10.000 binnen sieben Tagen erreicht [12]. Chemostat-Evolution über 250–500 Generationen misst also teilweise Wandwachstums- und Aggregationsphänomene, nicht nur planktonische Resistenzevolution.

---

## 4. Die übersehene Chance: zwei Wochen statt zehn Monate

Alle acht Stränge empfehlen Varianten derselben Analyse (Modell bauen, validieren, kalibrieren). Alle setzen voraus, dass ein gutes Modell wertvoll wäre. Niemand hat die billigere, logisch vorgelagerte Frage gestellt:

> **Welche Vorhersagegüte müsste ein CS-Modell mindestens erreichen, damit CS-informierte Therapie bei gegebenem Schaden-Nutzen-Verhältnis einen positiven Net Benefit hat?**

Das ist eine **rein analytische Rechnung**. Sie braucht keine Daten außer der klinischen Basisrate (Tandar: 3,0 % CS, 42,0 % CR), plausible Nutzen- und Schadensannahmen und eine Decision-Curve-Formel. Sie läuft in wenigen hundert Zeilen Code auf einem Laptop in Minuten. Sie ist in **zwei Wochen** fertig. Sie ist praktisch unangreifbar, weil sie keine neue Empirie behauptet. Und sie ist, soweit ich sehen kann, nicht publiziert.

Ihr Ergebnis ist eine einzige Zahl mit Sensitivitätsanalyse: *die erforderliche Mindestgüte Y*. Und sie hat eine Eigenschaft, die alle anderen Vorschläge nicht haben: **sie kann das Projekt beenden.** Wenn Y jenseits dessen liegt, was die Biologie prinzipiell zulässt (und die 0,513-Zahl von Nichol legt genau das nahe), haben Sie in zwei Wochen und für null Euro ein publizierbares, zitierfähiges, feldrelevantes Ergebnis — und wissen, dass Sie aufhören können.

**Als empirischer Unterbau in Phase zwei**, falls Y erreichbar aussieht, die zweitkleinste Frage — ebenfalls bisher nirgends gestellt:

> **Wie oft stimmt das CS-Vorzeichen für dasselbe geordnete Antibiotikumpaar zwischen unabhängigen Publikationen überein?**

Eine Zahl mit Konfidenzintervall, aus den offenen Supplementary Tables (Maltas & Wood 2019, Maltas et al. 2025, Barbosa 2017, Podnecky 2018, Sakenova 2024, Liu 2023, Maeda 2020). Kein hierarchisches Modell, keine Zensierungsbehandlung, keine Fallzahlplanung, keine LOSO-Fold-Probleme. Nur Harmonisierung und Auszählung. Das ist das Ja/Nein-Gatter für das gesamte Feld: Liegt die Konkordanz bei ~50 %, ist jeder CS-Atlas tot, egal wie er modelliert wird. Liegt sie bei 80 %, hat ECSA einen Punkt, den es dann sauber vortragen kann.

Zusammen ergibt das genau einen Satz, der einen Antrag trägt: *„Die zwischen unabhängigen Studien erreichbare CS-Vorzeichenkonkordanz liegt bei X; die für klinischen Netto-Nutzen erforderliche Güte bei Y."* Wenn X < Y, ist das ein Negativbefund, der dem Feld mehr nützt als ein weiterer Atlas — und der Sie bei exakt den Gruppen bekannt macht (Wood, Scott, Schulenburg, van Hasselt, Typas/Bork, Andersson), bei denen Sie andocken müssen.

Die Nebenchance, die ebenfalls unterging: **Heteroresistenz als Zielgröße statt MIC.** Soweit erkennbar hat niemand Kollateraleffekte auf Populationsanalyse-Profilen statt auf MIC-Mittelwerten untersucht. Das ist eine echte, offene, mechanistisch begründete Frage — braucht aber ein Labor und ist daher kein Vorarbeitsprojekt, sondern das richtige Thema für ein Gespräch mit einer Gruppe.

---

## 5. Widersprüche zwischen den acht Strängen, aufgelöst

**W1 — Vorzeichenkonvention.** „repeatability", „vorarbeiten_ml" und „alphafold_analogie" behaupten, Abschnitt 2.4 sei invertiert und literaturinkompatibel; „alphafold_analogie" stuft es als „internen Defekt mit höchstem Risiko" ein. „dokument_audit" rechnet es korrekt durch: Weil die Quotienten umgedreht sind, ist auch das umgedrehte Vorzeichen korrekt; CSI₂.₄ = −CS₁₁.₁, beide Formeln sind intern konsistent. **Auflösung:** Es ist kein Rechenfehler, sondern ein Notationsdefekt. Die Empfehlung (eine Konvention, die feldübliche: negativ = CS) bleibt richtig, die Begründung muss ersetzt werden. Wer im Antrag schreibt „wir hatten einen Vorzeichenfehler", wird von einem prüfenden Gutachter widerlegt.

**W2 — n = 3.** „repeatability": 95-%-KI umfasst [0,1]. „dokument_audit" und „rechenmachbarkeit": Clopper-Pearson-Breite 0,71–0,90; für ±0,10 sind n ≈ 97 nötig. Die Zahl „10²–10³ Replikate" ist frei erfunden. **Auflösung:** Nur die nachgerechneten Werte verwenden. Sie sind genauso vernichtend und halten stand.

**W3 — Ist Kalibrierung die freie Nische?** „dokument_audit" und „rechenmachbarkeit" sagen ja; die Prüfung von „dokument_audit" findet Goto et al. 2026 (*Robust Calibration*, Clin Infect Dis) und Almalki 2026 (Brier, GroupKFold, PR-AUC, Decision Curve) — das Methodenpaket ist in der AMR-Vorhersage bereits Standard. „vorarbeiten_ml" behauptet, es gebe keine Held-out-AUC für CS; Sakenova 2024 berichtet ROC AUC 0,76/0,73. **Auflösung:** Methodisch neu ist nichts. Frei ist nur die *Anwendung* auf CS-Kanten. Das trägt ein Paper, kein Projekt — und erst recht keinen Paradigmenwechsel.

**W4 — Labor-vs-Klinik-Lücke (39–73 % vs. 3,0 %).** „repeatability" nennt sie als Hauptchance; die eigene Prüfung zerlegt sie (unvergleichbare Nenner), „surveillance_daten" erklärt sie für prinzipiell unzulässig (verschiedene Estimands), und Maltas/Huynh/Wood 2025 erklären die Richtung bereits (CR dominiert früh, CS nach langer Selektion). **Auflösung:** In der vorgelegten Form unbrauchbar. Neu zu stellen in gleichen Einheiten, mit Selektionsdauer als freiem Parameter — oder fallenlassen.

**W5/W6 — Surveillance-Daten und ATLAS.** „datensaetze" baut einen 4-Wochen-Plan auf dem offenen ATLAS-S3-Download; die eigene Prüfung findet: Synapse ist kein Alternativzugang, Lizenz ungeklärt, Catalan nennt Zugang „following website registration", die Datei enthält 8,65 statt 6,5 Mio. MICs. „surveillance_daten" lehnt Surveillance kategorisch ab und wird dafür zu Recht als zu absolut markiert (Lancet Microbe hat es publiziert). **Auflösung:** Für eine private Rechnung vertretbar, für Publikation oder Antrag nicht ohne schriftliche Freigabe. Inhaltlich gilt: Surveillance misst Assoziation *zwischen* Isolaten, CS misst Änderung *innerhalb* einer Linie — zwei verschiedene Größen. Für die in Abschnitt 4 empfohlene Analyse sind Laborevolutionsdaten die richtige Quelle.

**W7 — Wie viele Datenpunkte gibt es wirklich?** „datensaetze": 15.000–25.000, davon 8.000–12.000 an einem Nachmittag. Die eigene Prüfung: Einheiten vermischt (Mutante×Chemikalie vs. Wirkstoff→Wirkstoff); ehrlich sind 1.500–4.000 Kanten, davon nur „einige Hundert" mit ≥3 unabhängigen Beobachtungen. Die Prüfung von „surveillance_daten" misst BV-BRC nach: 92 % der 17,6 Mio. Datensätze sind **maschinell vorhergesagte** Phänotypen, nur 338.929 sind echte MIC-Messungen, davon ~72 % zensiert, Median 8 Wirkstoffe pro Isolat. **Auflösung:** Die belastbare Zahl sind **einige Hundert Kanten**. Diese Zahl definiert das Projekt — und sie definiert es als Konkordanzanalyse, nicht als Atlas. Wer BV-BRC ohne `evidence='Laboratory Method'`-Filter zieht, rechnet Kollateralsensitivität auf AdaBoost-Ausgaben.

**W8 — In welchem Land lebt der Nutzer?** „förderung" baut alles auf aws Preseed (Österreich); die eigene Prüfung findet im Arbeitsverzeichnis FFG/aws/Matura, also Österreich. „surveillance_daten" und „rechenmachbarkeit" bauen alles auf RKI ARS, also Deutschland. **Auflösung:** Ungelöst und nicht kosmetisch — es entscheidet über jede Förderlinie und jede Surveillance-Quelle (österreichisches Gegenstück ist AURES/AGES, nicht ARS). **Diese Frage gehört vor jede weitere Arbeit.**

**W9 — Antragsberechtigung natürlicher Personen in Horizon Europe.** „dokument_audit" erklärt es zum K.o.; die eigene Prüfung widerlegt es aus dem Primärdokument: *„A 'legal entity' means any natural or legal person…"*, und die Budgetregeln führen „natural persons not receiving a salary" als Kostenart. **Auflösung:** Der Blocker ist die Konsortialregel (3 unabhängige Rechtspersonen aus 3 Ländern), nicht die Rechtsform — und Coordination-and-Support-Actions brauchen nur „one or more". Sie brauchen zwei Partner, keine Rechtsformänderung. Das ist eine völlig andere und lösbare Aufgabe.

**W10 — Förderempfehlungen.** „vorarbeiten_ml" empfiehlt VolkswagenStiftung *Experiment!* (seit 2021 eingestellt), DFG (20 % Anstellung erforderlich), EIC (juristische Personen), Prototype Fund (max. ~47.500 EUR, Wohnsitz Deutschland). **Auflösung:** Mehrheitlich tot oder nicht anwendbar. Nur „förderung" ist hier belastbar — mit den von der Prüfung korrigierten Zahlen (aws: 20 % Eigenleistung, davon 10 % bar; Nebenbeschäftigung untersagt; Firmenbucheintrag ≤ 6 Monate).

**W11 — GNN.** „rechenmachbarkeit" misst AUC 0,31–0,49, also unter Zufall; die eigene Prüfung nennt die Beweisführung zirkulär (Grundwahrheit = Modellklasse der Gewinner) und die Erklärung inkonsistent mit den Zahlen. **Auflösung:** Streichen ist richtig, Begründung ändern auf „zu wenige Kanten, keine Knotenattribute, einfacheres Modell genügt". Sakenovas 40-Wirkstoff-Datensatz mit Mechanismusattributen zeigt, dass das Regime existiert, in dem ein GNN sinnvoll wäre — nur eben nicht bei 16 Knoten.

**W12 — Negativbefunde, die keine sind.** „repeatability" führt Chowdhury & Findlay, Tandar, Podnecky und Chauhan als Negativbefunde; alle vier schließen in ihren eigenen Abstracts **pro** Kollateralsensitivität. **Auflösung:** Nicht gegen ihre Autoren zitieren — das sind Ihre wahrscheinlichen Gutachter. Die Neuheitsbehauptung schlicht fallenlassen ist billiger und sicherer.

**W13 — Ist die Integrationslücke (P, σ, S in einem Graphen) ein Schutzgraben?** „repeatability" sagt: dünn, aber nicht ausgeschlossen. Die Prüfung sagt: Maltas & Wood 2019 führen P und σ bereits in einer Arbeit an einem Graphen, 2025 kam die Zeitdimension dazu — die Lücke ist „eine Veröffentlichung der Wood-Gruppe weit entfernt". **Auflösung:** Real, aber kein Schutzgraben. Es ist ein Wettrennen gegen eine Gruppe mit Labor, Daten und Vorlauf. Das gewinnt ein Einzelner ohne Labor nicht.

**Der Meta-Widerspruch über allen anderen:** Sechs von acht Strängen empfehlen eine Vorhersage- oder Kalibrierungsstudie. Keiner hat geprüft, ob eine gelungene Vorhersage irgendetwas ändern würde. Die acht Stränge haben einander bei den Zitaten scharf kontrolliert und bei der Zielfrage nicht ein einziges Mal.

---

## Was ich Ihnen schulde, in Klartext

1. **ECSA in der vorliegenden Form ist nicht reparierbar.** Nicht wegen der Formeln — die sind reparierbar. Sondern weil die Neuheitsbehauptung widerlegt ist, die Wirkungskette an fünf Stellen bricht, das klinische Prinzip zweimal randomisiert getestet und zweimal null war, und der gewählte Phänotyp (MIC) nachweislich die klinisch entscheidende Heterogenität verfehlt.
2. **Die AlphaFold-Analogie trägt nicht.** CASP hatte eine eindeutige Zielgröße, einen kuratierten Goldstandard und einen unabhängigen Ausrichter, der die Wahrheit unter Verschluss hielt. CS hat keines davon. „Die Vorhersage reproduziert das Bekannte" ist nicht der Beweis — es ist das, was ein überangepasstes Modell am leichtesten liefert.
3. **Klären Sie drei Dinge, bevor Sie irgendetwas rechnen:** in welchem Land Sie steuerlich sitzen (W8), welche Entscheidung ECSA ändern soll (1a), und ob Sie die Methodik tatsächlich beherrschen oder sie erst lernen (1b).
4. **Rechnen Sie dann die Nutzenschwellen-Analyse.** Zwei Wochen, null Euro, ein publizierbares Ergebnis, und — das ist ihr eigentlicher Wert — ein definiertes Abbruchkriterium: *Wenn die erforderliche Mindestgüte Y jenseits des biologisch Möglichen liegt, höre ich auf.*
5. **Suchen Sie parallel eine aufnehmende Institution.** Das ist der eigentliche Engpass, nicht das Geld und nicht die Simulation. Ein fertiger Zweiwochen-Negativbefund ist das beste Argument in genau diesem Gespräch.
6. **Streichen Sie vor jedem Kontakt:** die Selbstbewertung „9,4/10", „75–85 % Förderwahrscheinlichkeit", „≥40 % Unsicherheitsreduktion", „erstmals", „Paradigmenwechsel", den Human-Genome-Project-Vergleich, das 24-Mio-Budget und den gesamten MDR/IEC-62304/AI-Act-Teil. Jeder dieser Punkte kostet Sie Glaubwürdigkeit, die Sie als Einzelperson ohne Track Record nicht nachproduzieren können.

---

### Quellen

Laut PubMed: Jayashree M, Singhi S, Ray P, Gautam V, Ratol S, Bharti S (2020). *Longitudinal comparative trial of antibiotic cycling and mixing on emergence of gram negative bacterial resistance in a pediatric medical intensive care unit.* J Crit Care 56:243–248. [DOI](https://doi.org/10.1016/j.jcrc.2020.01.013) (PMID 31982698)

[1] [Minimizing treatment-induced emergence of antibiotic resistance in bacterial infections](https://consensus.app/papers/details/b3bc83b09d985d6892a2699bffe97921/?utm_source=claude_desktop) (Stracy et al., 2022, 256 citations, Science)
[2] [A phylogenetic approach to studying the roles of within-host evolution and between-host transmission of resistance for clinical Escherichia coli infections](https://consensus.app/papers/details/12818323c5cb5210b5a96b74120f3ee3/?utm_source=claude_desktop) (Antony et al., 2022, bioRxiv)
[3] [Mixed strain pathogen populations accelerate the evolution of antibiotic resistance in patients](https://consensus.app/papers/details/fd59016334c8577099face15565b2172/?utm_source=claude_desktop) (Díaz Caballero et al., 2023, 58 citations, Nature Communications)
[4] [Phylogenetic Context of Antibiotic Resistance Provides Insights into the Dynamics of Resistance Emergence and Spread](https://consensus.app/papers/details/665b35a2fe885a0186e11eb2104487f2/?utm_source=claude_desktop) (Gontjes et al., 2025, The Journal of Infectious Diseases)
[5] [Ecological and evolutionary mechanisms driving within-patient emergence of antimicrobial resistance](https://consensus.app/papers/details/9af91a257fd9570f8f1303961bed8b27/?utm_source=claude_desktop) (Shepherd et al., 2024, 53 citations, Nature Reviews Microbiology)
[6] [Shift in pre-existing antibiotic heteroresistance explains AST change from susceptible to resistant during patient treatment](https://consensus.app/papers/details/8b720ec0930059b1b91cfb27cd07ec10/?utm_source=claude_desktop) (Kittleson et al., 2025, bioRxiv)
[7] [The high prevalence of antibiotic heteroresistance in pathogenic bacteria is mainly caused by gene amplification](https://consensus.app/papers/details/b2640dd734495e6aac2c1effc8442aa1/?utm_source=claude_desktop) (Nicoloff et al., 2019, 372 citations, Nature Microbiology)
[8] [Widespread antibiotic heterotolerance in bacteria remains undetected by resistance assays](https://consensus.app/papers/details/64b67048228d540989793b0f16519ecc/?utm_source=claude_desktop) (Van den Bergh et al., 2025, Drug Resistance Updates)
[9] [Heteroresistance is a cause of discrepant antibiotic susceptibility testing results](https://consensus.app/papers/details/13b485a63fb458828bf4bdc2fa50f09d/?utm_source=claude_desktop) (Ozturk et al., 2024, 23 citations, The Lancet Microbe)
[10] [The highly dynamic nature of bacterial heteroresistance impairs its clinical detection](https://consensus.app/papers/details/7cde71f8a493575ca37b9cffa7f87cb9/?utm_source=claude_desktop) (Pereira et al., 2021, 74 citations, Communications Biology)
[11] [Antibiotic heteroresistance in ESKAPE pathogens, from bench to bedside](https://consensus.app/papers/details/d671148394b75dbdab75dc30d0a48a83/?utm_source=claude_desktop) (Roch et al., 2022, 72 citations, Clinical Microbiology and Infection)
[12] [Development of Antibiotic Resistance during Simulated Treatment of Pseudomonas aeruginosa in Chemostats](https://consensus.app/papers/details/fe0863658ba559de874ee25967be8c86/?utm_source=claude_desktop) (Feng et al., 2016, 33 citations, PLoS ONE)

Upgrade to Consensus Pro to return 20 results per search instead of 10, and include more data like study design and key takeaways for every result.: https://consensus.app/pricing/?utm_source=claude_desktop