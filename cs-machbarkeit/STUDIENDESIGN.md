> Hinweis: KI-unterstützter Entwurf aus einer geprüften Recherche (Stand 2026-10-06). Zitate, Fristen und Förderregeln vor jeder Verwendung an der Originalquelle bestätigen.

# STUDIENDESIGN — Machbarkeitsnachweis "Kalibrierte, labor­übergreifende Vorhersage von Kollateraleffekten"

**Arbeitstitel:** *Cross-Laboratory Transfer and Calibration of Collateral-Effect Predictions (CLT-CS)*
**Format:** Präregistrierte Re-Analyse publizierter Laborevolutions-Daten. Kein Nasslabor, keine Institution, kein Datenantrag. Laptop, ≤10 GB RAM, 8 Wochen.

---

## 0. Was NICHT beansprucht wird (zuerst, weil es den Rest trägt)

Die Präregistrierung enthält einen datierten Abschnitt "Prior art acknowledged". Er nennt explizit:

- **Stochastizität von CS ist Konsens seit 2019.** Nichol D et al., *Nat Commun* 10:334, DOI 10.1038/s41467-018-08098-6 — wörtlich "a rigorous probabilistic understanding of the contingencies". Wird zitiert, nicht beansprucht.
- **Der probabilistische CS-Graph existiert.** Maltas J, Wood KB, *PLoS Biol* 2019;17(10):e3000515 (MDP mit expliziten Kantenwahrscheinlichkeiten 1/4, 1/4, 1/2; Replikatvariabilität als euklidische Distanz zum Zentroid).
- **Der vollständige Verteilungsformalismus existiert.** Ardell SM, Kryazhimskiy S, *eLife* 2021;10:e73250 — joint distribution of fitness effects (JDFE), inkl. robustem Ranking von Wirkstoffpaaren.
- **P(CS) als benannter Kennwert existiert.** Card KJ et al., *PNAS* 2025;122(39):e2507962122 — Collateral Response Score, "probability and magnitude", mit Bootstrap-95-%-KI.
- **Die Zeitdimension existiert.** Maltas J, Huynh A, Wood KB, *PLoS Biol* 2025;23(1):e3002970.
- **Surveillance-CS-Netzwerk existiert.** Tandar ST et al., *Lancet Microbe* 2026;7(4):101274 — 3,0 % CS vs. 42,0 % CR, Web-App collateralviz.lacdr.leidenuniv.nl.
- **Held-out-AUC für CS-Kanten existiert bereits.** Sakenova N et al., *Nat Microbiol* 2025;10(1):202-216 — ROC AUC 0,76 (CS) und 0,73 (XR), Klassifikator mit F1/Recall/Precision/AUC > 0,7, 64/70 experimentell validiert. **Die Behauptung "niemand hat je eine AUC berichtet" ist falsch und darf nirgends auftauchen.**
- **Surveillance-Methodik existiert als R-Paket.** Zwep LB et al., *JAC-AMR* 2021;3(4):dlab175.
- **RL für Therapiesequenzen existiert.** Weaver DT, King ES, Maltas J, Scott JG, *PNAS* 2024;121(16):e2303165121 (**2024**, nicht 2023 — 2023 ist nur der bioRxiv-Preprint).
- **Kalibrierungsmethodik in AMR existiert.** Goto et al. 2026, *Clin Infect Dis* (personalisierte Antibiogramme, "Robust Calibration").

### Die verbleibende echte Lücke, in einem Satz

> Sakenovas AUC von 0,76 wurde **innerhalb einer Spezies, innerhalb einer Modalität und ohne Kalibrierungsnachweis** erzielt. Es existiert keine Arbeit, die (i) quantifiziert, wie weit eine Kollateraleffekt-Vorhersage auf ein **im Training nicht enthaltenes Labor** überträgt, (ii) prüft, ob die dort ausgegebenen **Wahrscheinlichkeiten kalibriert** sind, und (iii) die Gesamtvarianz von Kollateraleffekten in **systematische (mechanismusgetriebene) und stochastische (linien- und laborgetriebene) Komponenten** zerlegt. Punkt (iii) liefert zugleich die von Nichol et al. 2019 ausdrücklich geforderte, bis heute fehlende Präzisionsanalyse: wie viele Replikate eine klinisch handlungsfähige P(CS) braucht.

Das ist eine Messlücke, keine konzeptionelle Entdeckung — und genau deshalb von einer Einzelperson in acht Wochen schließbar.

---

## 1. Primärhypothese

**Vorzeichenkonvention (bindend, einmalig, für das gesamte Projekt):**

$$\Delta_{A\to B} \;=\; \log_2\!\frac{E_B(\text{resistent gegen }A)}{E_B(\text{Vorfahre})}$$

wobei $E$ der **studieneigene** Potenz-Endpunkt ist (MIC, IC50 oder IC90), Zähler und Nenner **innerhalb derselben Studie mit derselben Methode** gemessen. **Negativ = Kollateralsensitivität (CS), positiv = Kreuzresistenz (CR).** Das ist Feldstandard (Sakenova 2024; Maltas & Wood 2019 "values of >0 indicate cross-resistance"; Card 2025; Wang 2025) und identisch mit ECSA-Anhang 11.1.

> **Formulierungshinweis für das Konzeptpapier:** ECSA-Abschnitt 2.4 ist **kein Rechenfehler**. Er invertiert den Quotienten *und* die Vorzeichenregel, ist also exakt die Negation von 11.1 und in sich korrekt ($CSI_{2.4} = -CS_{11.1}$). Wer schreibt "wir hatten in 2.4 einen Vorzeichenfehler", wird von einem prüfenden Gutachter widerlegt. Die korrekte Formulierung lautet: *zwei gleichnamige, gegenläufig definierte Indizes in einem Dokument erzeugen Vorzeichenfehler in Code und Kantengewichten und machen die Zahlen ohne Umrechnung nicht mit der Literatur vergleichbar.*

**Binäres Zielereignis:** $Y = 1$ falls $\Delta \le -1$ (CS), sonst $0$. Schwelle $\pm 1\ \log_2$ = eine Zweifach-Verdünnungsstufe = Sakenovas Schwelle = ISO-20776-Essential-Agreement-Schritt.

### H1 (primär, falsifizierbar)

> Sei $\hat p$ die posterior-prädiktive Wahrscheinlichkeit für $Y=1$ eines geordneten Wirkstoffpaars $(A\to B)$ in Spezies $p$, erzeugt von einem hierarchischen Bayes-Modell mit partial pooling, das auf allen Laborclustern **außer** $\ell$ trainiert wurde. Über alle $K$ zurückgehaltenen Labore gepoolt gilt:
>
> $$\Delta\mathrm{BSS} \;=\; \mathrm{BSS}(\hat p) - \mathrm{BSS}(B^*) \;>\; 0$$
>
> wobei BSS der Brier Skill Score relativ zur Trainings-Klimatologie ist und $B^*$ die **vorab definierte, in genesteter CV ausschließlich innerhalb der Trainingsfolds ausgewählte** stärkste Baseline aus §3. Entscheidungskriterium: die untere Grenze des 95-%-Perzentil-Bootstrap-KI (**Bootstrap auf Laborcluster-Ebene**, 2000 Resamples) liegt über 0.

**Falsifikation:** $\Delta\mathrm{BSS} \le 0$ oder KI-Untergrenze $\le 0$. Dann gilt: Das Vorzeichen eines Kollateraleffekts überträgt sich über Laborgrenzen hinweg **nicht** besser, als eine Mechanismus-Heuristik ohnehin leistet.

**Warum ein Statistiker das akzeptiert:** eine Zielgröße, eine Richtung, proper scoring rule (Brier ist strikt proper), vorab festgelegter Komparator, Komparator-Auswahl leakage-frei genestet, Clusterung der Abhängigkeitsstruktur im Bootstrap berücksichtigt, keine post-hoc-Schwelle. BSS zerlegt sich zudem in Reliability + Resolution und misst damit Diskrimination **und** Kalibrierung in einer Zahl.

**Vorab festgelegte Relevanzschwelle (kein Testkriterium, nur Interpretation):** $\Delta\mathrm{BSS} \ge 0{,}05$ gilt als wissenschaftlich relevant; $0 < \Delta\mathrm{BSS} < 0{,}05$ wird als "statistisch von Null verschieden, praktisch vernachlässigbar" berichtet.

---

## 2. Endpunkte

### Primär
**E0 — $\Delta\mathrm{BSS}$ out-of-lab**, gepoolt über alle LOLO-Folds, Clusterbootstrap-KI.
*Zielwert:* $>0$, KI-Untergrenze $>0$.
*Vergleichsmaßstab:* Sakenovas within-species ROC AUC 0,76 (als Kontext, nicht als Zielwert — out-of-lab wird mit hoher Wahrscheinlichkeit darunter liegen, **und genau das ist die Aussage**).

### Sekundär

| ID | Endpunkt | Zielwert |
|---|---|---|
| **S1** | Kalibrierungs-Slope und -Intercept out-of-lab (logistische Rekalibrierung von $\mathrm{logit}(\hat p)$) | 95-%-KI für Slope enthält 1; für Intercept enthält 0. KI-Breite wird berichtet, **nicht** geschwellt |
| **S2** | **Varianzzerlegung**: Posterior-Anteil der Gesamtvarianz von $\Delta$ auf (a) Mechanismuspaar + Wirkstoffpaar, (b) Spezies, (c) Labor/Studie, (d) Linie/Replikat | Keine Schwelle. Berichtet als Anteile mit 95-%-CrI. **Dies ist der wissenschaftlich wertvollste Einzelwert des Projekts** |
| **S3** | **Präzisionskurve** $n \mapsto$ erwartete Breite des 95-%-CrI für $P(CS)$ pro Kante, mit und ohne partial pooling | Keine Schwelle. Referenzpunkte: Clopper-Pearson bei $n{=}3$ — $1/3 \to [0{,}008;\,0{,}906]$ (Breite 0,897), $0/3 \to [0{,}000;\,0{,}708]$. Für Halbbreite $\pm0{,}10$ ohne pooling: $n \approx 97$ |
| **S4** | Leave-one-DRUG-out (Cold Start): $\Delta\mathrm{BSS}$, wenn alle Paare mit Wirkstoff $X$ zurückgehalten werden | Erwartung: deutlich schlechter als LOLO. Quantifiziert die Extrapolationsgrenze auf neue Wirkstoffe |
| **S5** | AUC und AUPRC out-of-lab, stratifiziert nach "Paar im Training gesehen" (Stratum I) vs. "nie gesehen" (Stratum II) | Deskriptiv, Clusterbootstrap-KI. **Keine Accuracy** — bei ~15-20 % Prävalenz ist sie wertlos |
| **S6** | Decision Curve Analysis: Net Benefit über Schwellenwahrscheinlichkeiten 0,05–0,50 gegen "immer CS-Sequenz" und "nie" | Net Benefit > beide Referenzstrategien in mindestens einem klinisch plausiblen Schwellenbereich |
| **S7** | Stabilitätsindex als Intraklassen-Korrelation: $S_{AB} = \tau^2_{\text{Paar}}/(\tau^2_{\text{Paar}} + \sigma^2_{\text{Linie}})$ | Deskriptiv, pro Mechanismuspaar. **Ersetzt die ECSA-Formel** (siehe §13) |

---

## 3. Baselines

Alle fünf werden in **jedem** LOLO-Fold neu gefittet. $B^*$ ist diejenige mit dem besten mittleren BSS in der **inneren** 5-fachen CV (GroupKFold auf Laborcluster) **innerhalb der Trainingsfolds** — niemals ausgewählt am Testfold.

| ID | Baseline | Spezifikation |
|---|---|---|
| **B0** | Zufall | $\hat p = 0{,}5$ konstant. Reine Sanity-Kontrolle |
| **B1** | Klimatologie / Mehrheitsklasse | $\hat p = $ CS-Prävalenz der Trainingsfolds, konstant. **Dies ist die BSS-Referenz**, hat also per Definition $\mathrm{BSS}=0$ |
| **B2** | Wirkstoffklassen-Heuristik | Falls $A$ und $B$ dieselbe Mechanismusklasse teilen → $\hat p = $ CS-Prävalenz der intraklassigen Paare im Training (empirisch niedrig); sonst → interklassige Prävalenz. Operationalisiert "gleiche Klasse → Kreuzresistenz" |
| **B3** | Literatur-Konsenstabelle | Für Paare, die in Lazar 2013 oder Imamovic & Sommer 2013 vorkommen: deren Vorzeichen, abgebildet auf $\hat p \in \{0{,}15;\,0{,}85\}$; sonst B1. Operationalisiert "was das Feld bereits glaubt" |
| **B4** | **Nicht-hierarchische Regression** | Logistische Regression mit **denselben** Fixed Effects (Wirkstoff $A$, Wirkstoff $B$, Mechanismus $A$, Mechanismus $B$, Mechanismuspaar-Interaktion, Spezies), one-hot kodiert, **ohne** partial pooling, L2-Strafe via innerer CV. **Dies ist der entscheidende Komparator — er isoliert exakt den Beitrag des partial pooling** |
| **B5** | Complete pooling | Nur Intercept pro Mechanismuspaar, keine wirkstoff- oder paarspezifischen Terme |
| **B6** *(optional)* | Gradient Boosting | `sklearn.ensemble.HistGradientBoostingClassifier` auf denselben Features. Zeigt, dass das hierarchische Modell nicht gegen Standard-ML verliert |

**Kein GNN. Kein Reinforcement Learning.** Beides wird in der Präregistrierung als bewusste Designentscheidung mit Begründung festgehalten, damit das Weglassen aktenkundig ist und nicht als Lücke gelesen wird:

- **GNN:** Bei 80–120 Wirkstoffknoten mit bereits als Fixed Effects kodierten Mechanismusattributen ist das hierarchische Modell die explizit aufgeschriebene, identifizierbare Version des induktiven Bias eines GNN. Ein 2-Lagen-GCN mit Hidden-Dim 32 hat ~4.000 Parameter bei ≤3.000 Beobachtungen. (Hinweis: ein kursierender simulierter GNN-vs-Additivmodell-Vergleich mit "GCN unter Zufallsniveau" ist **zirkulär** — die Grundwahrheit war additiv+bilinear erzeugt — und darf **nicht** als Begründung verwendet werden. Die Begründung lautet Stichprobengröße und Parameterzahl, nicht ein selbst gebautes Benchmark.)
- **RL:** Bei ≤40 Wirkstoffen ist die Therapiesequenz ein tabellarischer MDP, exakt per Value Iteration in Millisekunden lösbar (Nichol et al. 2015, *PLoS Comput Biol* 11(9):e1004493; Maltas & Wood 2019). RL verdient seinen Platz erst bei partieller Beobachtbarkeit (Weaver 2024 motiviert es genau damit) — und die lässt sich auf einem Laptop nicht glaubhaft demonstrieren.
- **Matrixfaktorisierung:** nur als vorab festgelegtes **Sekundärmodell**, und es wird **ausschließlich $M = UV^\top$** berichtet, niemals $U$ oder $V$ einzeln. Grund: Rotations- und Vorzeicheninvarianz machen $U,V$ unidentifiziert (R-hat 1,02–1,12, ESS 26–150), während $M$ sauber konvergiert (R-hat 1,003–1,005, ESS 1104–2661).

---

## 4. Datenquellen und Beschaffungsweg

### 4.0 Beschaffungsregeln (sicherheitsrelevant)

Jeder Download landet in **einem eigenen, neuen, leeren Verzeichnis** unter `data/raw/<datensatz-id>/`. Parser-Skripte liegen **ausschließlich** unter `src/` und werden mit `python -I src/parse_<id>.py data/raw/<id>/<datei>` aufgerufen — Pfad als Argument, nie Interpreter aus dem Datenverzeichnis starten. Jede Datei bekommt sofort `sha256sum` in `data/raw/<id>/CHECKSUMS.txt`.

### 4.1 Tier A — Primärkorpus (sofort verfügbar, Laborevolution, replikataufgelöst)

| ID | Quelle | Laborcluster | Beschaffung |
|---|---|---|---|
| **A1** | Maltas J, Wood KB (2019) *PLoS Biol* 17(10):e3000515, DOI 10.1371/journal.pbio.3000515 — 60 Mutanten (15 Selektionswirkstoffe × 4 unabhängige Populationen) × 15 Testwirkstoffe = 900 Kombinationen, IC50 + SEM über 8 technische Replikate, *E. faecalis* | **Wood/Michigan** | S1 Data xlsx (108.977 B): `https://journals.plos.org/plosbiology/article/file?type=supplementary&id=10.1371/journal.pbio.3000515.s017` — 13 Blätter, Matrix muss aus mehreren Blättern zusammengesetzt werden (1–2 h Handarbeit; Labels "Row are testing drug", "Columns are mutants" sind vorhanden) |
| **A2** | Maltas J, Huynh A, Wood KB (2025) *PLoS Biol* 23(1):e3002970 — 400 Stamm-Wirkstoff-Kombinationen × 4 Zeitpunkte | **Wood/Michigan** *(= A1, kein eigener Fold)* | Zenodo 10.5281/zenodo.14064963 (Record 14064964), ZIP 3,88 MB, CC-BY-4.0 |
| **A3** | Nichol D et al. (2019) *Nat Commun* 10:334 — 60 parallele *E.-coli*-Populationen unter Cefotaxim, 9 Wirkstoffe, je 3 MIC-Replikate | **Scott/Cleveland** | Supplementary Dataset 1 (xls, 96.256 B) am Artikel. Spaltengruppen `CFT_1/2/3/mle/pval` etc. Code: github.com/Daniel-Nichol/CollateralSensitivityRepeatability. **Nur 1 Selektionswirkstoff — aber 60 Replikate: der Schlüsseldatensatz für S3** |
| **A4** | Card KJ et al. (2025) *PNAS* 122(39):e2507962122 — 18 MSSA-Populationen unter Vancomycin, Kollateralantworten, CRS mit Bootstrap-KI | **Scott/Cleveland** *(= A3)* | Dryad DOI 10.5061/dryad.qnk98sfw2, **CC0** |
| **A5** | Podnecky NL et al. (2018) *Nat Commun* 9:3673 — 10 klinische *E.-coli*-UTI-Stämme, 4 Selektions- × 16 Testwirkstoffe, 590 Instanzen, ≥3 biologische Replikate, IC90 in **1,5-fach**-Verdünnung | **Johnsen/Tromsø** | Supplementary Data 1–4 (xls) am Artikel |
| **A6** | Liu DY et al. (2023) *Nat Commun* 14:1976 — WT MG1655 + 29 definierte resistente Stämme × 80 Antibiotika × 3 Replikate = 7.200 MICs | **Linington-Wong/SFU-Ottawa** | Zenodo 7746641, CC-BY-4.0, `E_coli_CSP_Antibiotic_MIC_R1/R2/R3.csv` (je ~12,5 kB). **Achtung:** Hintergründe sind **Genotypen** (gyrA S83L, marR, acrR, rpoB, envZ, rfaH, rpsL, Plasmide), nicht Selektionswirkstoffe. Genotyp→Wirkstoff-Mapping ist annahmebehaftet → Sensitivitätsanalyse SA3 |
| **A7** | Maeda T et al. (2020) *Nat Commun* 11:5970 — 192 evolvierte Stämme × 47 Chemikalien = 9.024 IC50 | **Furusawa/RIKEN** | Supplementary Data 2 (xlsx 157,7 kB) + Data 5. **Filter auf klinisch genutzte Antibiotika** — die Mehrheit der 95 Stressoren sind keine Antibiotika → SA4 |
| **A8** | Iwasawa J et al. (2022) *PLoS Biol* 20(12):e3001920 — 8 Wirkstoffe, 44 Trajektorien, IC50-Zeitreihen über 27 Tage | **Furusawa/RIKEN** *(= A7)* | github.com/jiwasawa/resistance-landscape |
| **A9** | Barbosa C et al. (2019) *eLife* 8:e51481 — *P. aeruginosa*, Source Data für **alle** Figuren; ergänzend Barbosa 2017 *Mol Biol Evol* 34(9):2229-2244 (160 Populationen, 8 Antibiotika, Supplementary ZIP 2,3 MB) | **Schulenburg/Kiel** | eLife Source Data direkt am Artikel |
| **A10** | Allen RC, Pfrunder-Cardozo KR, Hall AR (2021) *mSystems* 6(6):e0105521 — *E.-coli*-Mutanten aus 5 Antibiotika, Kollateraleffekte unter variiertem pH, Temperatur, Gallensalzen | **Hall/Zürich** | Dryad DOI 10.5061/dryad.6m905qg16, **CC0**: `05_Phenotypes.csv` (277 kB), `04_Optical_Densities.csv`. **Einziger Datensatz mit Umweltvariation → SA8** |
| **A11** | Sakenova N et al. (2025) *Nat Microbiol* 10(1):202-216 — Chemical Genetics, 3.904 Deletionsmutanten × 40 Antibiotika, 404 XR + 267 CS | **Typas/EMBL** | Supplementary Tables am Artikel: MOESM3 (xlsx 1,63 MB, volle Matrix), MOESM4 (635 Zeilen, Richtung + CS/XR/Neutral), **MOESM6/7 Source Data mit der "x/12"-Spalte = fertige empirische $P(CS)$ aus 12 Evolutionsreplikaten**. Zenodo 10572857, CC-BY-4.0. Shiny: shiny-portal.embl.de/shinyapps/app/21_xrcs |
| **A12** | Liakopoulos A et al. (2022) — *S. pneumoniae*, allelspezifische gyrA/parC-Kollateraleffekte | **Leiden/Rozen** | Zenodo 7379178 / Dryad 10.5061/dryad.c2fqz61b4, **CC0**: `MIC_data.xlsx` |
| **A14** | Wang X, Nong L, Schaar G, Koenders B, Jonker M, de Leeuw W, Ter Kuile BH (2025) *Microbiol Spectr* 13(8):e0098325, PMID 40539805 — 6 Spezies × 6 Klassen, 13 Testantibiotika, 72 Stämme, biologische Duplikate | **Ter Kuile/Amsterdam** | ASM Supplementary; BioProject PRJNA1194003 |
| **A15** | Chauhan V et al. (2025) *Commun Biol*, DOI 10.1038/s42003-025-09303-1 — 6 kritische Pathogene, Cipro→Gentamicin | **Brandis/Uppsala** | Open Access, Supplementary am Artikel |
| **A16** | Lázár V et al. (2013) *Mol Syst Biol* 9:700 — 240 parallel evolvierte *E.-coli*-Linien, 12 Antibiotika, 4 technische Replikate | **Pál/Szeged** | `https://pmc.ncbi.nlm.nih.gov/articles/instance/3817406/bin/msb201357-s2.xls` … `-s6.xlsx`. **PMC blockiert automatisierte Downloads → im Browser holen** |
| **A17** | Rodríguez de Evgrafov MC et al. (2020) *AAC* 65(1), DOI 10.1128/AAC.01273-20 — ESKAPE, 5 Antibiotika; ergänzend Imamovic & Sommer 2013 *Sci Transl Med* 5:204ra132 (23×23) | **Sommer/DTU** | ASM Supplementary; Imamovic nur Table S1 der Verlags-Supplementary (kein Repositorium) |
| **A18** | Chowdhury FR, Banari V, Lesnic V, Zhanel GG, Findlay BL (2025) *Int J Antimicrob Agents* 66(4):107564 — 3 ALE-Plattformen, >130 Mutanten, 540 Messungen | **Findlay/Concordia** | Elsevier Supplementary. **Nur 2 Selektionswirkstoffe, aber 3 Plattformen → Plattform-Sensitivitätsanalyse** |

**Laborcluster für LOLO: 14 Quellen → 11 unabhängige Cluster.** Wood (A1,A2), Scott (A3,A4), Furusawa (A7,A8,A13) sind je **ein** Fold.

### 4.2 Lock-Box (bis zum Code-Freeze unberührt)

**A13** — Shibai A, Kotani H, Furusawa C (2026), Zenodo Record **22074247**, CC-BY-4.0, ZIP 2,76 MB, hinterlegt 2026-08-24: 52 unabhängige *E.-coli*-Linien über 70 Tage, Closed-Loop-Steering gegen Dreifachresistenz (Chloramphenicol, Norfloxacin, Kanamycin).
**Nicht herunterladen vor Woche 7.** Einmal öffnen, einmal auswerten, kein Refit.
*Caveat, der im Paper stehen muss:* gleiches Labor wie A7/A8 → kein echter Out-of-Lab-Test, sondern ein **temporaler** Hold-out unter abweichendem Protokoll.

### 4.3 Explorativer Arm (klar als explorativ etikettiert)

- **Tandar-Netzwerk**, collateralviz.lacdr.leidenuniv.nl — prüfen, ob die Kanten maschinenlesbar exportierbar sind und unter welcher Lizenz. Vergleich Labor-$\Delta$ vs. klinisches CS-Signal.
- **BV-BRC** `genome_amr` API — **zwingend** mit `eq(evidence,Laboratory Method)` filtern: von 17.634.751 Datensätzen sind 16.300.395 maschinelle AdaBoost-**Vorhersagen**; nur 1.285.111 sind Labormessungen, davon 338.929 numerische MIC. ~72 % davon sind am Panelrand zensiert. Median 8 Wirkstoffe pro *E.-coli*-Genom. **Misst Ko-Resistenz, nicht CS** — anderes Estimand, deshalb ausschließlich explorativ.
- *Optional, mit Lizenzvorbehalt:* Open-ATLAS-Reuse-Datei (126.478.125 B, 633.820 Isolate, 8.648.172 MICs). **Nur lokal rechnen, im Antrag nicht als Datengrundlage benennen**, solange die Lizenz nicht schriftlich geklärt ist (Catalan et al. 2022, *Nat Commun* 13:2917: "available following website registration"). Synapse syn17009517 ist **kein** Alternativzugang.

### 4.4 Ausgeschlossen (mit Begründung in der Präregistrierung)

- **RKI ARS / AVS** — MHK ist im Studienprotokoll ausdrücklich **optional**, öffentlich nur kategoriale S/I/R-Aggregate, Breakpoint-Bruch CLSI→EUCAST um 2012. CS braucht gepaarte quantitative MICs desselben Isolats. *(Falls der Nutzer in Österreich sitzt — das Arbeitsverzeichnis deutet darauf hin: AURES/AGES ist das Pendant und hat dasselbe Problem.)*
- **EUCAST MIC-Verteilungen** — pro Spezies × Wirkstoff aggregiert, keine Isolat-ID zur Kopplung zweier Wirkstoffe. Prinzipiell unbrauchbar für CS. Nutzbar nur als **Prior für Wildtyp-MIC-Verteilungen**.
- **WHO GLASS** (länderaggregiert), **ECDC EARS-Net** (nur invasive Isolate, öffentlich aggregiert), **ARESdb** (QIAGEN-lizenziert), **NCBI Pathogen Detection metadata.tsv** (nur S/I/R, extrem dünn besetzt), **Colclough et al. 2019** (Seetang-Extrakte, keine Antibiotikum→Antibiotikum-Kanten).
- **CRyPTIC** (12.289 *M.-tuberculosis*-Isolate, 13 Wirkstoffe, EIN standardisierter Assay UKMYC5/6, Zenodo 15679731) — methodisch der sauberste offene MIC-Datensatz, aber **kein Vorfahre-Nachkomme-Design**. Wird als **Fallback-Primärdatensatz** in AB2 benannt, nicht im Hauptkorpus.

---

## 5. Datenaufbereitung

### 5.1 Langformat (eine Zeile = eine Messung)

```
study_id, lab_cluster, species, strain_background, line_id, replicate_type,
selecting_drug_canon, test_drug_canon, mech_class_sel, mech_class_test,
endpoint_type {MIC|IC50|IC90}, dilution_base {2.0|1.5|continuous},
value_ancestor, sign_ancestor {=|<=|>},
value_line,     sign_line     {=|<=|>},
delta_lower, delta_upper,    # log2, Intervallgrenzen
n_replicates, environment_tag, timepoint_generations
```

### 5.2 Verdünnungsstufen, Zensierung, Intervallkodierung

Jede Potenzmessung wird als **Intervall in $\log_2$-Einheiten** kodiert, niemals als Punktwert:

- Exakter Wert $v$ auf der Verdünnungsleiter mit Basis $b$ → $[\,v - w,\; v + w\,]$ mit $w = \log_2(b)/2$.
  *2-fach-Serie:* $w = 0{,}5$. *1,5-fach-Serie (Podnecky A5):* $w = \log_2(1{,}5)/2 = 0{,}292$.
- `"<= x"` (linkszensiert, Panelboden) → $(-\infty,\; x + w\,]$
- `"> x"` / `">= x"` (rechtszensiert, Panelobergrenze) → $(\,x + w,\; +\infty)$
- Kontinuierliche IC50 aus Hill-Fit (Maltas, Maeda) → $[\,v - \mathrm{SEM},\; v + \mathrm{SEM}\,]$, falls SEM berichtet; sonst $w = 0{,}25$ als konservative Annahme.

$\Delta_{\text{lower}} = v_{\text{line,lower}} - v_{\text{anc,upper}}$, $\Delta_{\text{upper}} = v_{\text{line,upper}} - v_{\text{anc,lower}}$.

**Ausschluss:** Messungen, bei denen Vorfahre und Linie in **derselben** Richtung zensiert sind, haben $\Delta \in (-\infty, +\infty)$ → raus aus der Primäranalyse, in SA5 wieder rein. **Der Anteil wird berichtet** (bei BV-BRC-ähnlichen Daten wären das ~50 %; bei Laborevolutions-Daten erwartungsgemäß <10 %, weil Panels um den Wildtyp zentriert gewählt werden).

**Parsing-Falle:** Kombinationspräparate stehen in manchen Quellen als String `"8/4"` (z. B. Cefoperazon/Sulbactam, Piperacillin/Tazobactam). Naives `float()` wirft oder verliert still Zeilen. → eigener kanonischer Wirkstoff-ID, erste Komponente als Zahl, Flag `is_combination=True`.

### 5.3 Normalisierung über Studien hinweg

**Kein z-Scoring.** Das würde die biologisch bedeutsame $\pm1$-Schwelle zerstören.

Stattdessen zwei Modellparameter pro Studie:
- **Offset** $u_s$ (additiv auf der $\log_2$-Skala) — absorbiert systematische Potenzunterschiede.
- **Skalenfaktor** $\sigma_s$ (multiplikativ) — absorbiert Endpunktunterschiede (IC50 vs. IC90 vs. MIC) und Verdünnungsschema-Effekte. Prior $\mathrm{LogNormal}(0;\,0{,}3)$, also zentriert bei 1 mit ±~35 % Spielraum.

Weil $\Delta$ ein **Verhältnis gleicher Endpunkte innerhalb derselben Studie** ist, kürzt sich der Endpunkttyp teilweise bereits heraus; $\sigma_s$ fängt den Rest.

### 5.4 Wirkstoff-Ontologie

Handkuratierte CSV, ~80–120 distinkte Wirkstoffe, ein Arbeitstag:

```
drug_raw, drug_canon, chembl_id, atc_j01, mech_class, is_combination
```

`mech_class` ∈ {beta_lactam_PBP, fluoroquinolone_gyrase, aminoglycoside_30S, tetracycline_30S, macrolide_50S, oxazolidinone_50S, phenicol_50S, folate_pathway, polymyxin_membrane, glycopeptide_cellwall, rifamycin_RNAP, fosfomycin_MurA, nitrofuran, lipopeptide_membrane, other}.

**Mechanismusklasse ist die zentrale Pooling-Ebene.** Die Ontologie ist externes Fachwissen, kein outcome-abhängiges Feature → sie darf vor der Fold-Trennung erstellt werden, wird aber gehasht und präregistriert.

### 5.5 Fehlende Werte

- Nicht getestete Paare fehlen **by design** (Panels werden vor der Evolution gewählt) → MAR bedingt auf Studie und Wirkstoffklasse. Wird als Annahme explizit genannt.
- Fehlende Replikatzahl → $n=1$ setzen, nicht löschen. Das Modell schrumpft solche Zeilen stärker; Löschen wäre outcome-abhängige Selektion.
- **$\Delta$ wird nie imputiert.** Fehlendes $\Delta$ = fehlende Zeile.

---

## 6. Modellspezifikation

### 6.1 Likelihood

**Ordinal, nicht kontinuierlich, nicht als CDF-Differenz.**

$$y_m \;\sim\; \mathrm{OrderedLogistic}\!\left(\frac{\mu_m}{\sigma_{s(m)}},\; \boldsymbol{\kappa}_{s(m)}\right)$$

mit $y_m \in \{\text{CS}, \text{Neutral}, \text{CR}\}$ (3-stufig primär, 5-stufig in SA2), $\boldsymbol{\kappa}_s$ studienspezifische Schwellen (ordered transform).

> ⚠️ **Harte, verifizierte Randbedingung:** Die naheliegende Implementierung der intervallzensierten Likelihood als **Differenz zweier Normal-CDFs** bricht numerisch zusammen. Die Intervallwahrscheinlichkeit unterläuft auf 0, der übliche `jnp.clip`-Schutz erzeugt einen konstanten Wert mit Gradient null, NUTS friert ein — bei **unauffälliger Laufzeit und plausibel aussehenden Mittelwerten**. Gemessen: ESS = 2 und R-hat bis $1{,}4\times10^{7}$ für **alle** Parameter, während das identische Modell als `OrderedLogistic` R-hat 1,003–1,018 und ESS 340–2661 liefert. Falls doch eine kontinuierliche Formulierung nötig wird: ausschließlich `jax.scipy.special.log_ndtr`-Differenzen im Log-Raum mit `logsumexp`, **niemals clippen**.

### 6.2 Lineare Struktur

$$
\mu_m = \alpha
+ a_{\mathrm{mech}(A)}
+ b_{\mathrm{mech}(B)}
+ c_{\mathrm{mech}(A),\,\mathrm{mech}(B)}
+ d_{A}
+ e_{B}
+ f_{A,B}
+ g_{p}
+ h_{p,\,\mathrm{mech}(A),\mathrm{mech}(B)}
+ u_{s}
+ \varepsilon_{\mathrm{line}}
$$

**Alle varying effects in non-centred Parametrisierung** ($\theta = \mu + \tau \cdot z$, $z \sim \mathcal{N}(0,1)$).

### 6.3 Prioren mit Begründung

| Parameter | Prior | Begründung |
|---|---|---|
| $\alpha$ | $\mathcal{N}(0{,}5;\,1)$ | Leicht positiv zentriert: CR ist in Labor **und** Klinik häufiger als CS (Tandar 42,0 % vs. 3,0 %; Podnecky 141 vs. 92; Maltas DAP 64 % vs. 11 %). Einheit = $\log_2$-Verdünnungsstufen |
| $a, b$ (Mechanismus-Haupteffekte) | $\mathcal{N}(0,\tau_a)$, $\tau_a \sim \mathrm{HalfNormal}(1)$ | $\tau=1$ erlaubt Klasseneffekte von ±2 Verdünnungsstufen bequem |
| $c$ (Mechanismuspaar) | $\mathcal{N}(0,\tau_c)$, $\tau_c \sim \mathrm{HalfNormal}(1)$ | **Die zentrale Struktur.** Sakenova: "a drug pair can exhibit both interactions depending on the resistance mechanism" |
| $d, e$ (Wirkstoff innerhalb Klasse) | $\mathcal{N}(0,\tau_d)$, $\tau_d \sim \mathrm{HalfNormal}(0{,}5)$ | Enger: Wirkstoffe einer Klasse sollen einander ähnlicher sein als Klassen untereinander |
| $f$ (Paarabweichung) | $\mathcal{N}(0,\tau_f)$, $\tau_f \sim \mathrm{HalfNormal}(0{,}5)$ | |
| $g$ (Spezies) | $\mathcal{N}(0,\tau_g)$, $\tau_g \sim \mathrm{HalfNormal}(1)$ | Apjok 2019: CS ist nicht einmal zwischen nahe Verwandten konserviert |
| $h$ (Spezies × Mechanismuspaar) | $\mathcal{N}(0,\tau_h)$, $\tau_h \sim \mathrm{HalfNormal}(0{,}5)$ | |
| $u_s$ (Studienoffset) | $\mathcal{N}(0,\tau_u)$, $\tau_u \sim \mathrm{HalfNormal}(0{,}5)$ | **Bewusst nicht diffus.** Ein weiter Prior auf $\tau_u$ lässt das Modell alles über Studieneffekte erklären und zerstört den Transfer |
| $\varepsilon_{\mathrm{line}}$ | $\mathcal{N}(0,\sigma_{\mathrm{line}})$, $\sigma_{\mathrm{line}} \sim \mathrm{HalfNormal}(1)$ | **Dies ist der Term für evolutionäre Stochastizität. Sein Posterior ist Endpunkt S2** |
| $\sigma_s$ (Studienskala) | $\mathrm{LogNormal}(0;\,0{,}3)$ | Zentriert bei 1 |
| $\boldsymbol{\kappa}_s$ | induced-Dirichlet bzw. `TransformedDistribution(Normal(0,2), OrderedTransform)` | |

**Sekundärmodell** (vorab festgelegt): identisch plus Rang-2-Term $\sum_k U_{A,k} V_{B,k}$. Berichtet wird **ausschließlich $M = UV^\top$**; $U$ und $V$ werden mit ihrem R-hat als Negativbefund dokumentiert.

### 6.4 Sampler

- NumPyro NUTS, **4 Ketten**, 1000 warmup + 1000 draws, `target_accept_prob=0.9`, `max_tree_depth=12`, `chain_method="parallel"` auf 4 Kernen.
- Erwartete Laufzeit: 5–60 s pro Fit. (Gemessen auf synthetischen Daten vergleichbarer Größe: 4,3–5,0 s bei 526–586 MB für 3.000 Paare / 9.000 Beobachtungen / 3.117 latente Parameter. **Reale Daten haben schlechtere Posterior-Geometrie — 60 s als Budget ansetzen, nicht 5 s.**)

### 6.5 Konvergenzkriterien (bindend, präregistriert)

| Kriterium | Schwelle |
|---|---|
| R-hat (rank-normalized split-R̂) | $\le 1{,}01$ für **alle** überwachten Parameter, Hyperparameter und posterior-prädiktiven Größen |
| Bulk-ESS | $\ge 400$ |
| Tail-ESS | $\ge 400$ |
| Divergente Transitionen | **0** für den Primärfit. Eskalation: `target_accept` 0,9 → 0,95 → 0,99; dann Reparametrisierung; wenn weiterhin >0 → Fold wird als **gescheitert** berichtet und ist für diesen Fold nicht interpretierbar |
| E-BFMI | $> 0{,}3$ |

**Prior Predictive Check (vor jedem Blick auf echte Outcomes):** 1000 Datensätze aus dem Prior simulieren; die implizierte CS-Prävalenzverteilung muss 5–40 % abdecken und darf nicht bei 0 oder 1 konzentriert sein.

**Simulation-Based Calibration (SBC):** 200 Datensätze aus dem Prior, Rangstatistiken auf Uniformität prüfen (ECDF-Differenzplot mit simultanem 95-%-Band). SBC-Fits mit reduzierten Einstellungen (2 Ketten × 500+500), um die Laufzeit auf ~3–4 h zu halten. **Besteht SBC nicht, wird nicht weitergerechnet** (siehe AB3).

---

## 7. Validierungsdesign

### 7.1 LOLO — Leave-One-**LABORATORY**-Out

Nicht leave-one-study-out. Begründung: Wood 2019 und Wood 2025 sind dasselbe Labor, dieselbe Spezies (*E. faecalis*), dieselbe Stammsammlung; Furusawa deckt A7/A8/A13 ab; Sommer deckt Imamovic 2013 und Evgrafov 2020 ab. Als separate Folds wären das Leakage.

Der **Laborcluster-Map** (`folds/lab_clusters.csv`, gehasht, präregistriert) wird vor dem ersten Fit festgeschrieben: eine Zeile pro `study_id`, Spalte `lab_cluster`.

### 7.2 Zwei Strata, beide vorab definiert

Überlappende Paare (z. B. Cipro→Gentamicin bei Podnecky **und** Chauhan) werden **nicht** entfernt — sonst kollabiert die Testmenge, und die Überlappung ist genau die wissenschaftliche Frage.

- **Stratum I — "gesehene Paare":** Paar kommt in ≥1 Trainingslabor vor. Misst **laborübergreifende Reproduzierbarkeit**.
- **Stratum II — "ungesehene Paare":** Paar kommt in keinem Trainingslabor vor. Misst **mechanismusbasierte Generalisierung**.

Primärendpunkt auf der **gepoolten** Menge, mit vorab festgelegter stratifizierter Berichterstattung. Der Überlappungsanteil wird berichtet.

### 7.3 Leakage-Kontrollen (vollständige Liste)

1. **Alles Outcome-Abhängige wird in jedem Trainingsfold neu geschätzt.** L2-Strafe von B4, $B^*$-Auswahl, Schwellen, Skalenschätzer, Prävalenz der Klimatologie-Baseline. Genestet: innere 5-fache `GroupKFold` auf Laborcluster **innerhalb** der Trainingsfolds.
2. **Wirkstoff-Ontologie** ist externes Wissen, nicht outcome-abhängig → darf global erstellt werden, wird gehasht.
3. **Kein Fold-übergreifendes Tuning von Priorhyperparametern.** Prioren stehen in der Präregistrierung als Zahlen fest.
4. **LODO (S4)** als separate Analyse: alle Paare mit Wirkstoff $X$ raus, auch aus Trainingsfolds.
5. **Seeds** fix pro Kette und pro Fold, in der Ausgabe protokolliert.
6. **Lock-Box** (A13) wird erst nach Git-Tag + Zenodo-DOI des Codes heruntergeladen.

### 7.4 Ehrlichkeit zur CASP-Analogie

CASP funktionierte, weil ein **unabhängiger Ausrichter** die Wahrheit unter Verschluss hielt. Hier hält der Antragsteller Daten **und** Folds in einer Hand. Die Präregistrierung ist nur ein Teilersatz. **Das Paper formuliert deshalb "präregistrierte retrospektive Validierung mit vorab festgelegten Folds", nicht "CASP für Kollateralsensitivität".** Ein Gutachter, der CASP kennt, bemerkt die fehlende dritte Instanz sofort — die ehrliche Formulierung ist der stärkere Zug.

---

## 8. Kalibrierungsnachweis

### 8.1 Metriken

| Metrik | Implementierung | Zielwert |
|---|---|---|
| **CORP-Zerlegung des Brier Score** (MCB / DSC / UNC) | PAV-Isotonie via `sklearn.isotonic.IsotonicRegression`; Methode nach Dimitriadis T, Gneiting T, Jordan AI (2021) *PNAS* 118(8):e2016191118. Querprüfung in R mit `reliabilitydiag` | MCB klein relativ zu DSC |
| **Kalibrierungs-Slope / -Intercept** | Logistische Rekalibrierung von $\mathrm{logit}(\hat p)$ auf $Y$; Clusterbootstrap-KI | Slope-KI enthält 1; Intercept-KI enthält 0. **KI-Breite wird berichtet, nicht geschwellt** |
| **ECE** (10 äquidistante Masse-Bins) | **Nur gegen eine simulierte Nullverteilung.** 2000 Datensätze gleicher $n$ und Prävalenz aus einem perfekt kalibrierten Modell ziehen, Null-ECE-Verteilung bilden, p-Wert und Null-Median berichten | Nicht signifikant über dem Null-Median bei $\alpha=0{,}05$ |
| **AUC / AUPRC** | Clusterbootstrap-KI, stratifiziert nach Stratum I/II | Deskriptiv |
| **Decision Curve Analysis** | Vickers AJ, Elkin EB (2006) *Med Decis Making* 26(6):565-574; Net Benefit über Schwellen 0,05–0,50 | Net Benefit > "immer" und "nie" in mindestens einem plausiblen Schwellenbereich |

> ⚠️ **Der ECE eines perfekt kalibrierten Modells ist nicht null.** Größenordnung bei 10 Bins und Prävalenz 20 %: $n{=}200 \to \approx 0{,}055$–$0{,}060$; $n{=}1000 \to \approx 0{,}025$–$0{,}027$; $n{=}10000 \to \approx 0{,}008$. Ein ECE von 0,03 bei $n{=}1000$ ist **reines Stichprobenrauschen**. ECE darf nie gegen 0 interpretiert werden.
>
> ⚠️ **Die klassische Murphy-Zerlegung ist bei kleinem $n$ verzerrt** (Ferro CAT, Fricker TE (2012) *QJRMS* 138:1954-1960, DOI 10.1002/qj.1924 — überschätzt Reliability, unterschätzt Uncertainty). Deshalb CORP/PAV, nicht Binning-Murphy.
>
> ⚠️ **Zur realistischen Präzision:** Der Kalibrierungs-Slope ist die bindende Größe (Riley RD et al. (2021) *Stat Med* 40(19):4230-4251). Größenordnung der 95-%-KI-Breite bei Prävalenz ~20 %: $n{=}1000 \to \approx 0{,}3$–$0{,}4$; $n{=}3000 \to \approx 0{,}2$. Bei geclusterten Daten (mehrere Paare pro Stammhintergrund) ist die effektive Stichprobe **kleiner** als $n$ — diese Zahlen sind optimistisch. Die Faustregel "100 Ereignisse und 100 Nicht-Ereignisse" ist hier nachweislich unzureichend (Snell KIE et al. (2021) *J Clin Epidemiol* 135:79-89).
>
> **Deshalb wird das Design auf der Labor-Prävalenz (~15–20 %) geplant, nicht auf der klinischen 3,0 % von Tandar.** Letztere gilt für Surveillance-Daten über 30 Spezies — ein anderes Estimand, eine andere Studie.

### 8.2 Abbildungen (vorab festgelegt)

| | |
|---|---|
| **F1** | CORP-Reliability-Diagramm, out-of-lab gepoolt, mit Konsistenzbändern |
| **F2** | Reliability pro Labor, Small Multiples (11 Panels) — zeigt, **welche** Labore übertragen und welche nicht |
| **F3** | Varianzzerlegung (S2): Forest der Posterior-SD jeder hierarchischen Ebene mit 95-%-CrI |
| **F4** | $\Delta\mathrm{BSS}$ Modell vs. jede Baseline, Clusterbootstrap-KI |
| **F5** | Präzisionskurve (S3): CrI-Breite für $P(CS)$ vs. $n$, mit und ohne partial pooling, mit Clopper-Pearson als Referenzlinie |
| **F6** | Triptychon: Reliability + ROC + Murphy-Diagramm (Dimitriadis et al., *Int J Forecasting* 2024) |

---

## 9. Negativkontrollen

| ID | Kontrolle | Spezifikation | Erwartung / Gate |
|---|---|---|---|
| **N1** | **Label-Permutation** | $Y$ innerhalb jedes Trainingsfolds permutieren, komplette Pipeline neu, 200 Wiederholungen bei reduzierten Sampling-Einstellungen (2 Ketten × 500+500) + 20 Wiederholungen bei vollen Einstellungen | $\Delta\mathrm{BSS}$-Verteilung zentriert bei oder unter 0. **HARTES GATE: N1 läuft VOR dem echten $\Delta\mathrm{BSS}$. Ist das permutierte $\Delta\mathrm{BSS}$ systematisch positiv, liegt ein Pipeline-Leak vor → Stopp** |
| **N2** | **Labor-Label-Permutation** | Studienzuordnung permutieren, 200×. Prüft, ob der geschätzte Laboreffekt real ist | $\tau_u$ fällt deutlich |
| **N3** | **Simulation unter H0** | Synthetische Daten aus dem gefitteten Modell mit $\tau_c = \tau_f = 0$ (keine Mechanismuspaar-, keine Paarstruktur; nur Studien- und Linienrauschen), reales $n$, komplette LOLO-Pipeline | $\Delta\mathrm{BSS} \approx 0$; Kalibrierungsmaschinerie verhält sich korrekt |
| **N4** | **Parameter Recovery** | 200 Datensätze mit bekannten $\tau$-Werten generieren, 95-%-CrI-Abdeckung jedes Hyperparameters prüfen | Abdeckung $\approx 95\,\%$. Zusammen mit SBC ist **dies** die legitime Version der AlphaFold-Analogie: Wiederfinden bekannter Wahrheit, nicht Reproduktion publizierter Zahlen |
| **N5** | **Wright-Fisher-Vorwärtssimulation** | Unabhängiger generativer Mechanismus (nicht aus dem gefitteten Modell): 16 Resistenzloci, 1000–10.000 Linien, $N=10^5$, 500 Generationen, pleiotrope MIC-Effekte aus einer **bekannten** JDFE (Formalismus nach Ardell & Kryazhimskiy 2021). Prüft, ob die Inferenz die wahre $P(CS)$ pro Paar wiederfindet | Posterior-Mittel korreliert mit wahrer $P(CS)$; CrI-Abdeckung ≈ 95 %. Laufzeit: 8 s / 377 MB für 10.000 Linien (vektorisiertes NumPy, kein SLiM) |

### Sensitivitätsanalysen

| ID | |
|---|---|
| **SA1** | Schwelle $\pm0{,}5$ und $\pm1{,}5$ statt $\pm1$ |
| **SA2** | 5-stufiges statt 3-stufiges Ordinalziel |
| **SA3** | Liu 2023 (A6) ausschließen — Genotyp→Selektionswirkstoff-Mapping ist annahmebehaftet |
| **SA4** | Maeda 2020 (A7) ausschließen — überwiegend Nicht-Antibiotika-Stressoren |
| **SA5** | Complete-Case: alle zensierten Messungen raus — zeigt, dass das Zensierungsmodell nötig ist |
| **SA6** | Podnecky mit und ohne studienspezifische Schrittweiten-Korrektur ($w=0{,}292$ vs. $0{,}5$) |
| **SA7** | Prior-Sensitivität: alle $\tau$-Hyperprioren auf $\mathrm{HalfNormal}(0{,}5)$ bzw. $\mathrm{HalfNormal}(2)$ |
| **SA8** | Allen 2021 (A10) Umweltstrata (pH, Temperatur, Gallensalze) als zusätzliche Ebene — quantifiziert Umweltvarianz |
| **SA9** | Mit und ohne Rang-2-Latentterm (Sekundärmodell) |
| **SA10** | Chowdhury 2025 (A18) Plattformeffekt (3 ALE-Plattformen) als zusätzliche Ebene |

---

## 10. Präregistrierung

**Plattform:** OSF, Template *"OSF Preregistration"*, öffentlich, mit DOI. Zeitpunkt: **nach** Datenkuratierung und Dataset-Freeze, **vor** dem ersten Modellfit.

Diese Reihenfolge ist ehrlich und wird explizit so deklariert: Der harmonisierte Datensatz existiert zum Registrierungszeitpunkt, $\Delta$ ist also sichtbar. Kompensiert wird das durch drei Maßnahmen, die ebenfalls registriert werden: (a) der Datensatz wird mit **SHA-256 eingefroren** und auf Zenodo hinterlegt, (b) die **Lock-Box A13 bleibt bis nach dem Code-Freeze unberührt**, (c) **N1 läuft als allererste Analyse**.

### Was wortwörtlich festgeschrieben wird

1. **Vorzeichenkonvention** (negativ = CS) mit der Formel, plus der Satz, dass die beiden ECSA-Varianten exakte Negationen sind und nur eine verwendet wird.
2. **Schwellen** $\pm1\ \log_2$ (3-stufig) und $\pm2 / \pm1$ (5-stufig, SA2).
3. **Vollständige Datensatzliste** mit DOI, Dateiname und **SHA-256 jeder heruntergeladenen Datei**.
4. **Laborcluster-Map** (`lab_clusters.csv`, SHA-256).
5. **Wirkstoff-Ontologie** (`drug_ontology.csv`, SHA-256).
6. **Ausschlussregeln**: beidseitig gleichgerichtet zensiert, fehlender Vorfahre, Nicht-Antibiotika, Naturstoff-Screens.
7. **H1** mit exakter $\Delta\mathrm{BSS}$-Definition, Baseline-Set B0–B6, $B^*$-Auswahlregel (innere GroupKFold ausschließlich in Trainingsfolds), Clusterbootstrap (2000 Resamples, Perzentilmethode).
8. **Modellgleichung, Prioren mit numerischen Hyperparametern, Sampler-Einstellungen, Konvergenz-Gates** (R-hat ≤ 1,01; Bulk-/Tail-ESS ≥ 400; 0 Divergenzen; E-BFMI > 0,3).
9. **Sekundärendpunkte S1–S7** mit Definitionen.
10. **Negativkontrollen N1–N5** und die Regel, dass N1 zuerst läuft und die Analyse bei Scheitern stoppt.
11. **Sensitivitätsanalysen SA1–SA10.**
12. **Abbruchkriterien AB1–AB7** (§12).
13. **Fallback-Plan**, falls <8 Laborcluster oder <1500 verwertbare geordnete Paare überleben.
14. **Lock-Box:** Zenodo 22074247 namentlich, unberührt bis Code-Freeze (Git-Tag + Zenodo-DOI des Codes).
15. **Erklärung, dass kein GNN und kein RL gefittet wird**, mit Begründung — damit das Weglassen eine aktenkundige Designentscheidung ist, keine Auslassung.
16. **"Prior art acknowledged"** — die Liste aus §0, datiert.

**Zweite OSF-Komponente:** der eingefrorene Datensatz als eigenständiges, zitierfähiges Produkt mit Zenodo-DOI, FAIR-Metadaten (DataCite-Schema, Lizenz pro Quelldatensatz dokumentiert). **Dieses Produkt behält seinen Wert auch dann, wenn H1 fällt.**

---

## 11. Wochenplan

### W0 — Vorwoche, 2–3 Tage: Lesegate (**vor allem anderen**)

Pflichtlektüre im Volltext:
- **Hu M, Chua SL (2026)** *Lancet Microbe* 101457, DOI 10.1016/j.lanmic.2026.101457, PMID 42263732 — "Collateral sensitivity identified in surveillance data shows limited reproducibility in clinical isolates"
- **van Hasselt JGC, Tandar ST, Smits WK, Liakopoulos A, Zwep LB, Aulin LBS (2026)** *Lancet Microbe* 101508, PMID 42556375 — **die Autorenerwiderung.** Beide sind Letters ohne PubMed-Abstract hinter Paywall; der Titel allein reicht nicht.
- Tandar et al. 2026 Volltext; Sakenova 2024 Volltext inkl. OCDM-Metrik und der AUC 0,76/0,73; Zwep 2021 + `collatRal`-Paket; Weaver 2024 PNAS; Goto 2026 CID.
- collateralviz.lacdr.leidenuniv.nl öffnen, Exportierbarkeit und Lizenz prüfen.
- Gezielte bioRxiv/medRxiv/arXiv-Suche: "collateral sensitivity transfer", "cross-laboratory reproducibility antibiotic".

**Gate AB1.**

### W1 — Ontologie und erste Parser
Wirkstoff-Ontologie-CSV, Laborcluster-Map. Download A1, A3, A4, A5, A6, A10, A11, A12 in je eigenes Verzeichnis, SHA-256. `uv`-Projekt mit `uv.lock`, Container-Digest gepinnt. Parser für A1, A6, A11.
*Ziel: 3 Datensätze vollständig im Langformat.*

### W2 — Rest der Kuratierung
Download und Parser für A2, A7, A8, A9, A14–A18. A16 (Lázár) über den Browser, weil PMC Skripte blockt. Zensierungs-Encoder. Erste Zählung verwertbarer geordneter Paare **pro Laborcluster**.
**HARTES GATE AB2 am Ende von W2: ≥8 Cluster mit je ≥50 Paaren, gesamt ≥1500 geordnete Paare.**

### W3 — Freeze und Präregistrierung
SHA-256 aller Dateien, Zenodo-Deposit des harmonisierten Datensatzes (**Produkt #1**). OSF-Präregistrierung schreiben und einreichen. Prior Predictive Check. Alle Baselines B0–B6 implementiert und auf synthetischen Daten getestet.

### W4 — Modell und Selbstvalidierung
Hierarchisches Modell in NumPyro. **SBC (200 Prior-Draws, über Nacht).** Parameter Recovery (N4). Wright-Fisher-Harness (N5). Konvergenz-Gates verdrahtet.
**Gate AB3.**

### W5 — Permutation, dann LOLO
**N1 zuerst** (200 reduzierte + 20 volle Permutationen, über zwei Nächte). **Gate AB4.**
Dann: LOLO-Pipeline, 11 Folds × 7 Modelle. Primäres $\Delta\mathrm{BSS}$, Clusterbootstrap. S4 (LODO), S5.
**Gate AB5.**

### W6 — Kalibrierung und Varianzzerlegung
CORP, Slope/Intercept, ECE gegen simulierte Null, DCA. S2 (Varianzzerlegung), S3 (Präzisionskurve), S7. N2, N3. Abbildungen F1–F6.
**Gate AB6.**

### W7 — Lock-Box und Sensitivität
**A13 herunterladen** (erst jetzt), eine Auswertung, ein Bericht, kein Refit. SA1–SA10. Explorativer Labor-vs-Klinik-Arm (Tandar-Netzwerk, BV-BRC `Laboratory Method`-Teilmenge), klar als explorativ etikettiert.
**Gate AB7.**

### W8 — Veröffentlichung
Preprint (10–14 Seiten) schreiben. Code-Freeze: Git-Tag, Zenodo-DOI über die GitHub-Zenodo-Integration (**Produkt #2**). Abbildungen deponieren. bioRxiv-Einreichung. Parallel: der 8-seitige Förderantrag, der auf dem Ergebnis aufbaut.

> **IP-Entscheidung, die VOR W8 bewusst getroffen werden muss:** In Europa gibt es keine Neuheitsschonfrist (Art. 54(2) EPÜ, Stand der Technik ist alles vor dem **Anmeldetag**). Ein Preprint mit DOI **vor** einer Patentanmeldung vernichtet die eigene Patentierbarkeit unwiderruflich. Die Reihenfolge *Anmeldung einreichen → danach Preprint* ist dagegen zulässig und üblich. Angesichts von Art. 52(2) EPÜ und G 1/19 (Output ist Information, technischer Effekt fraglich) ist der realistische Schutz hier ohnehin Erstautorenschaft + Zeitstempel + kuratierter Datensatz, nicht ein Patent — aber die Entscheidung muss ausgesprochen, nicht unbemerkt gefällt werden.

---

## 12. Abbruchkriterien

| ID | Auslöser | Reaktion |
|---|---|---|
| **AB1** | **W0:** Hu & Chua 2026 oder ein ungesehener Preprint schließt die Transfer-/Kalibrierungslücke bereits | Pivot auf **S2 + S3 als Primärstudie**: Varianzzerlegung und Replikatzahl-Präzisionskurve. Diese Lücke ist verifiziert offen — Nichol et al. 2019 fordern "multiple parallel evolutionary replicates" ausdrücklich, ohne jede Power- oder Präzisionsanalyse zu liefern, und keine existiert |
| **AB2** | **Ende W2:** <8 Laborcluster oder <1500 geordnete Paare | LOLO-Primär fallen lassen. Umstellen auf ein **einzeldatensatz-internes Design**: A1 (900 Kombinationen, 4 unabhängige Populationen je Selektionswirkstoff) + A3 (60 Replikate) + A11 ("x/12"-Zählungen), mit **leave-one-SELECTING-DRUG-out** statt leave-one-lab-out. Primär wird dann S3 — ein in sich geschlossenes, laptopgroßes, nachweislich unpubliziertes Ergebnis. Zweite Rückfalloption: CRyPTIC (12.289 Isolate, 13 Wirkstoffe, **ein** standardisierter Assay) für die reine Methoden-Demonstration |
| **AB3** | **W4:** SBC scheitert oder N4-Abdeckung weit von 95 % | Modell ist fehlspezifiziert. Vereinfachen (erst $h$ streichen, dann $f$, dann $d/e$), bis SBC besteht. **Mit einem Modell, das die eigene Wahrheit nicht wiederfindet, wird nicht weitergerechnet** |
| **AB4** | **W5:** N1 liefert systematisch $\Delta\mathrm{BSS} > 0$ auf permutierten Labels | Pipeline-Leak. Stopp, suchen, beheben, alles neu. **Vor einem sauberen N1 wird nichts berichtet** |
| **AB5** | **W5:** $\Delta\mathrm{BSS} \le 0$ oder KI enthält 0 | **H1 falsifiziert.** Siehe unten — das ist das publizierbare Ergebnis, nicht das Scheitern |
| **AB6** | **W6:** Kalibrierungs-Slope-KI-Breite $> 0{,}6$ | Der Datensatz trägt keine Kalibrierungsaussage. Breite ehrlich berichten, S1 auf deskriptiv herabstufen, Primär $\Delta\mathrm{BSS}$ bleibt |
| **AB7** | **W7:** Lock-Box widerspricht dem LOLO-Ergebnis | **Beides berichten. Kein Refit. Lock-Box nicht fallen lassen.** Der Widerspruch ist selbst ein Befund |

### Warum ein Negativbefund hier wertvoller ist als ein schwacher Positivbefund

Der Satz

> *"Ein hierarchisches Modell, das 11 Labore und N geordnete Wirkstoffpaare poolt, sagt das Vorzeichen eines Kollateraleffekts in einem ungesehenen Labor nicht besser vorher als eine Mechanismus-Heuristik — die Labor-Varianzkomponente beträgt X % der Gesamtvarianz, die Linien-Komponente Y %."*

ist für das Feld unmittelbar handlungsrelevant, und zwar aus vier Gründen:

1. **S2 liefert die erste laborübergreifende Varianzzerlegung von Kollateraleffekten.** Niemand hat die bisher geschätzt. Sie beantwortet quantitativ, was die Literatur bisher nur qualitativ streitet — Hernando-Amado 2022 PNAS berichtet robuste, konservierte CS; Nichol 2019 und Barbosa 2017 berichten gegenläufige Replikate. Die Frage ist nicht "ist CS stochastisch", sondern **welcher Anteil** systematisch ist. Das ist eine Zahl, und dieses Design erzeugt sie.
2. **S3 liefert die von Nichol et al. 2019 ausdrücklich geforderte, bis heute fehlende Präzisionsanalyse.** Damit ist belegt, dass CS-Kartierung mit $n{=}3$ keine Kantenwahrscheinlichkeit erzeugen kann (95-%-KI-Breite 0,71–0,90) — und **das ist zugleich die ehrliche Budgetbegründung für ein großes Vorhaben**: nicht "wir erfinden probabilistische CS", sondern "wir sind die erste Studie mit ausreichender Replikattiefe, weil alle Vorarbeiten mit $n{=}3$ bis $n{=}60$ arbeiten mussten und das selbst als Limitation benennen".
3. **Er verlängert den laufenden Schlagabtausch Hu & Chua ↔ van Hasselt** von Surveillance- auf Labordaten. Das ist ein Gespräch, das gerade stattfindet, in *Lancet Microbe*.
4. **Der harmonisierte Multi-Labor-CS-Datensatz ist ein zitierfähiges Produkt mit eigener DOI**, unabhängig vom Ausgang. Er existiert bis heute nicht — Sakenova musste Chemical-Genetics-Daten wiederverwenden, statt bestehende CS-Messungen zu poolen.

**Verwertungswege für den Negativbefund:** *PLoS Biology* / *eLife* / *mBio* / *Microbiology Spectrum* als "Resource + negative result"; mindestens bioRxiv-Preprint + Zenodo-Datensatz. Ein sauber kalibrierter Negativbefund ist gegenüber den naheliegenden Kooperationspartnern (Typas/Bork EMBL Heidelberg, Schulenburg Kiel, van Hasselt Leiden, Wood Michigan, Scott Cleveland Clinic, Johnsen Tromsø) ein **besserer Gesprächseinstieg als ein 46-seitiges Konzept** — und eine aufnehmende Institution ist der eigentliche Engpass des gesamten Vorhabens, nicht die Simulation.

---

## 13. Software, Versionen, Rechenbedarf

### Stack (alles gepinnt, `uv.lock` committed, Container-Digest fixiert)

```
python == 3.13          # via uv, pyproject.toml + uv.lock
numpyro == 0.22.0       # Primärinferenz
jax == 0.11.2 (CPU)     # jaxlib passend
arviz >= 0.22           # R-hat, Bulk-/Tail-ESS, LOO-PSIS, SBC-Plots
pymc == 6.3.2           # UNABHÄNGIGE Re-Implementierung des Primärmodells
                        # als Querprüfung auf EINEM Fold
numpy >= 2.0
pandas >= 2.2
openpyxl >= 3.1         # read_only-Streaming für große xlsx
scipy >= 1.14           # Clopper-Pearson, Isotonie
scikit-learn >= 1.7     # IsotonicRegression (CORP), LogisticRegression (B4),
                        # HistGradientBoosting (B6), GroupKFold (innere CV)
matplotlib >= 3.10
```
Optionale R-Querprüfung (ca. 1 h): **R 4.4** + `reliabilitydiag` (Dimitriadis/Gneiting/Jordan) + `dcurves`.
Optional für den ATLAS-Arm: `polars`.

> **PyMC3 wird nicht verwendet** — seit dem Übergang auf PyMC v4 (2022) nicht mehr gepflegt; aktuell ist PyMC 6.x. Die Angabe "PyMC3" im ECSA-Papier datiert den Methodenteil und signalisiert einem technischen Gutachter sofort, dass er nicht von einem Praktiker geschrieben wurde. Gleiches gilt für "TF Probability".

### Rechenbedarf pro Schritt

| Schritt | Zeit | Peak-RAM | Disk |
|---|---|---|---|
| Download + Parsing aller Tier-A-Datensätze | Minuten CPU | < 500 MB | < 1 GB |
| Open-ATLAS-xlsx → Parquet *(optional)* | ~10 min | < 2 GB (`read_only`-Streaming) | +300 MB |
| Prior Predictive, 1000 Draws | < 10 s | < 200 MB | — |
| **Ein hierarchischer Fit** (≈3.000 Paare, ≈9.000 Intervallbeobachtungen, ≈3.000 latente Parameter), NUTS 4×(1000+1000) | **5–60 s** *(Budget: 60 s)* | **< 700 MB** | — |
| PyMC-Querprüfung, ein Fold | 20–40 s | < 400 MB | — |
| **LOLO** 11 Folds × 7 Modelle × 60 s | **≈ 77 min** | < 700 MB | — |
| **SBC** 200 Draws × Fit (2 Ketten × 500+500) | **3–4 h** (über Nacht) | < 700 MB | — |
| **N1** 200 Permutationen × 11 Folds, reduziert | **10–13 h** (zwei Nächte, Hintergrundjob) | < 700 MB | — |
| N1 voll, 20 Permutationen × 11 Folds × 60 s | ≈ 3,7 h | < 700 MB | — |
| N4 Parameter Recovery, 200 Replikate | 3–4 h | < 700 MB | — |
| **N5 Wright-Fisher**, 10.000 Linien × $10^5$ × 500 Gen. × 16 Loci, vektorisiertes NumPy | **8 s** | **377 MB** (Trajektorien-Array 320 MB) | — |
| ECE-Nullverteilung, 2000 Resamples | < 60 s | < 200 MB | — |
| Clusterbootstrap 2000 Resamples (auf gespeicherten Posterior-Prädiktiven) | < 5 min | < 500 MB | — |

**Gesamt: komfortabel in einer Woche Laptop-Nebenzeit. Spitzen-RAM < 2 GB außer bei der optionalen ATLAS-Konvertierung. Die 10-GB-Grenze ist nie bindend — das Nadelöhr ist die Datenkuratierung in W1–W2, nicht die Rechenleistung.**

---

## Anhang: Was am ECSA-Papier vor jeder Einreichung repariert wird

| Defekt | Status | Korrektur |
|---|---|---|
| **Zwei CSI-Konventionen** (Abschnitt 2.4 vs. Anhang 11.1) | **Kein Rechenfehler** — exakte Negationen, beide in sich konsistent | Eine Konvention (Anhang 11.1, negativ = CS). Begründung: zwei gleichnamige, gegenläufige Indizes erzeugen Vorzeichenfehler in Code und Kantengewichten und machen Zahlen ohne Umrechnung nicht literaturvergleichbar. **Nicht** schreiben "wir hatten einen Vorzeichenfehler" |
| $S = 1 - \mathrm{Var}(CS_t)/\lvert CS_{t_0}\rvert$ | **Nicht skaleninvariant** (log2: 0,7436 vs. ln: 0,8223) und **divergiert für $CS_{t_0}\to 0$** — also im biologisch häufigsten Fall | Ersetzen durch $S = \tau^2_{\text{Paar}}/(\tau^2_{\text{Paar}} + \sigma^2_{\text{Linie}})$: Intraklassen-Korrelation, strikt in $[0,1]$, dimensionslos, skaleninvariant, fällt direkt aus dem hierarchischen Modell (Endpunkt S7). *Hinweis: "dimensional inkohärent" ist angreifbar — Log-Verhältnisse sind dimensionslos. Mit "nicht skaleninvariant + divergent" argumentieren* |
| $\sigma_{ij}$ = Stichproben-SD, deklariert als "Bayes'sche Inferenz" | **Fehlbezeichnung und wertloser Schätzer.** Bei $n{=}3$: CV der Stichproben-SD 52,2 %, 95-%-Bereich $s/\sigma = [0{,}16;\,1{,}92]$ — eine 12-fache Spanne | Ersetzen durch die Posterior-SD aus dem hierarchischen Beta-Binomial-/Logit-Normal-Modell mit partial pooling. **Das ist das stärkste methodische Einzelargument des Projekts**: nur partial pooling erzeugt aus $n{=}3$ brauchbare Intervalle |
| $f = 1 - \mu_R/\mu_{WT}$ | Im Kern korrekt (Andersson & Hughes 2010, *Nat Rev Microbiol* 8(4):260-271), aber unterspezifiziert und als Skalar falsch | Messprotokoll explizit (Selektionskoeffizient aus Head-to-head-Kompetition, Medium, mit/ohne Antibiotikum) und **als Verteilung modellieren, nicht als Punktwert**: Card KJ, Jordan JA, Lenski RE (2021) *Evolution* 75(5):1230-1238, DOI 10.1111/evo.14203 — ~8 % Mittelwert, große Linienvarianz, **unkorreliert** mit Resistenzniveau, signifikant verschieden sogar zwischen Allelen desselben Gens |
| "9,4/10 Förderempfehlung höchste Priorität", "75–85 % Förderwahrscheinlichkeit", "≥40 % Unsicherheitsreduktion", "erstmals", "Paradigmenwechsel", Human-Genome-Project-Vergleich | Disqualifikationsmerkmale | **Ersatzlos streichen, nicht abschwächen** |
| MDR 2017/745 SaMD, ISO 14971, IEC 62304, PCCP, "EU AI Act Annex IV High-Risk" | Bei TRL 2–5 ohne Produkt, Zweckbestimmung und klinischen Bewertungsplan nicht nur verfrüht, sondern ein Glaubwürdigkeitsrisiko. *Nebenbei:* eine Therapieempfehlungs-Software wäre nach **Art. 6 Abs. 1 i. V. m. Annex I** hochrisikobehaftet (weil die MDR dort gelistet ist), **nicht** über Annex III; Annex IV regelt die technische Dokumentation | Für einen 50.000–300.000-EUR-Antrag **komplett heraus** |
| Abgrenzung gegen AI4Life, MELLODDY, FAIR-IMPACT, EXSCALATE4CoV | Thematisch weit entfernt; die realen Konkurrenten sind Leiden/van Hasselt, Kiel/Schulenburg, Uppsala/Andersson+Brandis, Cleveland/Scott, Michigan/Wood, **EMBL Heidelberg/Typas+Bork** (in Deutschland, für INFRADEV der naheliegendste Gutachter überhaupt) und **KU Leuven/Steenackers** (Letztautor sowohl des Nat-Ecol-Evol-Reviews 2025 als auch des Negativbefunds Brepoels 2022) | Gegen die richtigen Arbeiten abgrenzen |
| Horizon Europe INFRADEV / IHI als Zielprogramme | Natürliche Personen **sind** nach Horizon-Europe-Recht Rechtspersonen (General Annexes Part 15: *"A legal entity means any natural or legal person…"*), und die Kostenarten führen *"personnel costs of SME owners/natural persons not receiving a salary"*. Die echte Hürde ist die Konsortialregel (3 unabhängige Rechtspersonen aus 3 Ländern) — als **dritter Partner** eines Konsortiums also durchaus möglich; CSA-Topics brauchen zudem nur *"one or more legal entities"* | Nicht "strukturell unerreichbar", sondern "braucht zwei Partner". Für den Soloantrag: nationale Wirtschaftsförderung (bei AT-Sitz: aws Preseed Deep Tech — natürliche Personen ausdrücklich antragsberechtigt, bis 267.000 €/80 % bzw. 300.000 €/90 %; **Achtung: min. 20 % Eigenleistung, davon min. 10 % bar**, und **Nebenbeschäftigung ist untersagt**). **Die Klärung der aufnehmenden Institution ist Schritt 0, nicht Schritt 4** |