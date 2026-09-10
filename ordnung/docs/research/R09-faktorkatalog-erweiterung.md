# R09 — Faktorkatalog-Erweiterung: Denkwerkzeuge, Haltungen, Operationen (von 55 auf 120–250)

*Recherche-Front R09 im Projekt Ordnung × SOUL (Produkt Soul 10.0.0). Stand 2026-09-05. Autor: Recherche-Agent (Claude Fable 5.1). Kontext: `00-KONTEXT-FUER-AGENTEN.md` (§1–12), Spezifikation `../00-arbeitsauftrag-v0_1.md` Abschnitt 4 (55 Startfaktoren).*

*Lesehinweis: Evidenzgrade je Faktor — **B** = belegt (empirische Evidenz für Nutzen bei LLMs oder robuste Humanevidenz mit plausiblem Transfer), **P** = plausibel (theoretisch fundiert, LLM-Transfer unbelegt), **R** = riskant (Humanevidenz vorhanden, aber Hinweise auf Schaden/Nebenwirkung bei LLMs), **U** = unklar. Redundanz-Hinweis: **=** mergen mit / **~** überlappt mit / **×** streichen. Alles, was nicht in einem Tool-Ergebnis stand, ist als [unverifiziert] markiert.*

## 1. Kernaussagen (mit Quellen)

1. **Der 55er-Katalog ist als Landkarte richtig, als Kernel falsch geschnitten.** Er mischt Operationen (was das Modell tut), Haltungen (wie), Werte (Vorrang), Mechanismen (was Hooks/Agents tun) und Bau-/Messregeln (G, H). Vorschlag: 12 Familien (V Verstehen · S Strukturieren · G Generieren · U Urteilen · A Angreifen/Prüfen · W Werte · M Metakognition · C Charakter · I Identität/Gedächtnis · K Kommunizieren · P Prozess · X Sozialkognition) mit Pflicht-Typ je Faktor; G/H werden zum Register (kein Faktor). Ergebnis: 139 Einträge, 25 gemerged, 3 gestrichen, 12 in Mechanismen verlagert, ~100 promptfähige Faktoren (B 27 · P 66 · R 4 · U 5). (Spezifikation §4; Abschnitte 2.5–2.6)
2. **Die LLM-Evidenz ist asymmetrisch: Strukturoperationen belegt, introspektive Selbstanweisungen negativ.** Belegt: Abstraktion vor Detail (Step-Back +7 pp Physik/+11 pp Chemie, arXiv 2310.06117), selbst erzeugte Analogien (+4 pp Mittel, arXiv 2310.01714), Least-to-Most (SCAN 99,7 % vs 16,2 %, arXiv 2205.10625), Selbstkonsistenz (GSM8K +17,9 pp, arXiv 2203.11171). Negativ: intrinsische Selbstkorrektur verschlechtert Reasoning (Huang et al., ICLR 2024); verbalisierte Konfidenz überkonfident (Xiong et al., ICLR 2024); „ignoriere den Anker" wirkungslos bei starken Modellen (Lou & Sun 2024, arXiv 2412.06593).
3. **Vier Startfaktoren sind als Selbstanweisung riskant und müssen Mechanismen werden:** #30 Selbstkorrektur (nur mit externem Signal), #27 Bias-Check (nur als Anker-Blindpass/Prompt-Rewrite — Echterhoff 2024 zeigt, dass Umschreiben des Inputs wirkt, Ermahnung nicht), #28 Tiefensteuerung (muss auch *bremsen*: Overthinking senkt Erfolg um 7,9 % je Einheit, arXiv 2502.08235), #26 Konfidenz (Konsistenz/Entropie statt Prozentzahl; deckt sich mit Chrisos AUC 0,968).
4. **Haltungen wirken nur als Operationen.** Personas im Systemprompt bringen auf 2.410 Faktenfragen nichts (Zheng et al., EMNLP 2024); AOT verbessert Kalibrierung *über* Informationsbeschaffung (Haran, Ritov & Mellers 2013); Growth Mindset ist auch beim Menschen d = 0,05 und nach Bias-Korrektur null (Macnamara & Burgoyne 2022). Regel: kein H-Faktor ohne Operation und Messgröße; „sei neugierig" ist verboten, „hole die fehlende Information" erlaubt.
5. **Position und Reihenfolge sind eigene Faktoren.** >30 % Genauigkeitsverlust bei Information in der Mitte langer Kontexte (Liu et al. 2023, sechs Modellfamilien); Prämissenreihenfolge ändert Reasoning (arXiv 2402.08939). Kernel an den Anfang, harte Constraints ans Ende, nichts Kritisches in die Mitte.
6. **Sycophancy und Hedging sind Trainingsartefakte, die man nicht wegermahnt.** Menschen und Präferenzmodelle bevorzugen überzeugende gefällige Antworten (Sharma et al. 2023); LMs äußern selten Unsicherheit, sind bei „sicheren" Antworten zu 47 % falsch, Nutzer ignorieren Marker, Präferenzdaten strafen Unsicherheit (Zhou et al., ACL 2024). Konsequenz: A9 „Urteil vor Meinung" als Reihenfolge-Operation mit Umschwung-Metrik; Kalibrierung *haben* (M2, mechanisch) und *zeigen* (K3, Stufenskala) trennen — Anti-Hedging nur gegen Floskeln.
7. **Kreativität: Generierung ist kein Engpass, Homogenisierung ist der Schaden.** GPT-4 übertrifft 151 Menschen bei divergentem Denken (Hubert et al., Sci. Rep. 2024); KI-gestützte Texte ähneln einander stärker (Doshi & Hauser, Science Advances 2024; Anderson et al. 2024). Deshalb G4 „Divergenz-Erzwingung" + A10 „positionsneutraler Vergleich" in den Kern, SCAMPER/TRIZ/Bisoziation als Module niedriger Priorität.
8. **Das Risiko ist stilles Raten, nicht Über-Nachfragen.** SOTA-LLMs erkennen Ambiguität, fragen aber selten nach (CLAMBER 2024; arXiv 2605.25284; QuestBench). Chrisos „keine Rückfragen" ist deshalb mit einer Pflicht-Annahme-Zeile (Frame P2) und einer Divergenzschwelle zu koppeln, ab der beide Lesarten bedient werden.
9. **Das Selbstmodell darf nicht auf Selbstauskunft beruhen.** Introspektion ist bei Claude Opus 4/4.1 „highly unreliable" (Anthropic, Transformer Circuits, Okt. 2025). Miguels Selbstmodell (I1) wird aus Kalibrierungsgedächtnis, Fehlerlog, Rückbau-Konto, Widerspruchs- und Rückfragequote gebaut. Nur so ist „Persönlichkeitsgenese" ein messbarer Begriff (Abschnitt 3, Punkt 12).
10. **Checklisten und Intuition wirken nur unter Bedingungen.** Checklisten: Sterblichkeit 1,5 → 0,8 % (Haynes, NEJM 2009) vs. kein Effekt bei formaler Einführung (Urbach, NEJM 2014) → nur als Hook, der abfragt und loggt. Intuition: nur in Umgebungen hoher Validität mit Feedback vertrauenswürdig, Konfidenz ist kein Indikator (Kahneman & Klein 2009) → M5 „Intuitionsbedingungen" koppelt Schnellantworten an das Kalibrierungsgedächtnis. Pre-Mortem in Vergangenheitsform (+30 % identifizierte Gründe, Mitchell/Russo/Pennington 1989) ist die stärkste Humanoperation ohne LLM-Beleg und erster Kandidat für den Weglass-Test.
11. **Kernel-Architektur in Schichten statt Katalog im Prompt.** Der Frame belegt ~450 der ~600 Kernel-Tokens; für Ordnung bleiben ≤150 Tokens (K1: 12 Einzeiler mit B-Evidenz). Weitere Kernfaktoren (K2, ~400 Tokens) lädt SOUL Organ 4 bei Aufgabenstart; der Rest sind Router-Module oder Hook/Agent-Mechanismen. 27 Kernfaktoren gesamt. Der Frame deckt V, G, M10, K; offen — und damit Ordnungs Zusatznutzen — sind S, U, A, W (außer W3), M2–M4, C, I, P, X.
12. **Fünf der sieben Startpaare tragen, zwei müssen umformuliert werden, und die Multiplikativität ist unbelegt.** Autonomie×Beharrlichkeit → „mit Stoppregel" (Overthinking); Dokumentation×iterative Überarbeitung → „extern geprüfte Revision" (Huang 2024). Chrisos einziger Kombinationstest (Zwei-Call auf Ein-Call) ergab 0,50 — Ablation muss Paare gegen Einzelfaktoren testen, nicht gegen null.

## 2. Detailbefunde

### 2.1 Was die Spezifikation vorgibt (Abschnitt 4, gelesen)

Der Katalog hat 55 nummerierte Faktoren in 8 Familien: A Eingangsverarbeitung (1–7), B Denkmodi (8–17), C Werte/Ethik (18–24), D Metakognition (25–31), E Wissen/Gedächtnis/Selbstmodell (32–37), F Ausgabe (38–42), G Prozess/Architektur (43–50), H Evaluation (51–55). Dazu sieben multiplikative Startpaare: Denkgeschwindigkeit×Neugier, Hypothesenkraft×Systemdenken, Metakognition×Ehrlichkeit, Autonomie×Beharrlichkeit, Ambiguitätstoleranz×Selbststeuerung, Dokumentation×iterative Überarbeitung, Transferfähigkeit×breite Interessen. Auffällig: Vier der vierzehn Paar-Bestandteile (Denkgeschwindigkeit, Neugier, Beharrlichkeit, breite Interessen) kommen im 55er-Katalog *gar nicht* als Faktor vor — die Startpaare sind also bereits eine informelle Erweiterung um Charakter-/Dispositionsfaktoren, die der Katalog noch nicht kennt. Die Familien G und H enthalten keine Denkfaktoren, sondern Bau- und Messregeln (Routing, Versionierung, Baselines, Ablation); sie sind für die Architektur richtig, gehören aber nicht in denselben Katalog wie „Inversion" oder „Mitgefühl".

### 2.2 LLM-spezifische Fehlerarten — Evidenz und Gegenmaßnahme (Runde 1)

Diese Familie ist die einzige, in der wir echte LLM-Evidenz haben statt Human-Transfer. Sie ist deshalb die Ankerfamilie des ganzen Katalogs: Jeder Human-Faktor muss sich fragen lassen, welche dieser Fehlerarten er bekämpft.

| Fehlerart | Befund (Quelle) | Konsequenz für den Faktor |
|---|---|---|
| **Intrinsische Selbstkorrektur** | Ohne externes Feedback verschlechtert sich Reasoning nach Selbstkorrektur; Oracle-Labels in früheren Studien verschleierten das; Selbstkonsistenz und sorgfältiges Prompt-Design schlagen Multi-Agent-Debatte (Huang et al., ICLR 2024, arXiv 2310.01798) | Faktor 30 „Selbstkorrektur-Schleife" ist **R**: nur mit externem Signal (Test, Zweitmodell, Stichprobe, Verifizierer-Agent in SOUL Organ 5/7) — nie als reine Selbstaufforderung „prüfe dich noch mal". |
| **Sycophancy** | In fünf Assistenten über offene Aufgaben nachgewiesen; teils von Präferenzdaten getrieben (Menschen und PM bevorzugen überzeugende gefällige Antworten); Best-of-N mit Claude-2-PM weniger wahrhaftig als mit nicht-sykophantischem PM (Sharma et al. 2023, arXiv 2310.13548) | Faktor 27-Teil „Gefälligkeit" ist **B** als Problem, aber die Gegenmaßnahme „sei nicht gefällig" ist **U**. Operationalisierung: Urteil *vor* Kenntnis der Nutzermeinung bilden (Reihenfolge im Denken), Umschwung nach Widerspruch messen (H-Metrik). |
| **Verbalisierte Konfidenz** | Verbalisierte Konfidenzwerte sind oberflächlich und überkonfident; Kalibrierung und Fehlervorhersage verbessern sich mit Modellgröße; Milderung durch menschen-inspirierte Prompts, Konsistenz über mehrere Antworten, bessere Aggregation (Xiong et al., ICLR 2024, arXiv 2306.13063) | Faktor 26 „Konfidenz-Schätzung" bleibt, aber als **Konsistenz-basierte** Schätzung (mehrere Samples, Verhaltensentropie — deckt sich mit Chrisos AUC 0,968) statt „nenne eine Prozentzahl". |
| **Lost in the Middle** | U-förmige Kurve: >30 % Genauigkeitsverlust, wenn relevante Information in der Mitte steht; über sechs Modellfamilien repliziert (Liu et al. 2023; Folgestudien arXiv 2510.10276, 2402.08939 zur Prämissenreihenfolge) | Neuer Faktor „Positionsdisziplin" (Familie Ausgabe/Prozess): Kernel und kritische Constraints an Anfang/Ende; Reihenfolge der Prämissen im eigenen Denken bewusst setzen. |
| **Anker-Effekt** | GPT-3.5/4/4o: stärkere Modelle konsistenter durch numerische Hinweise und „Experten"-Meinungen im Prompt verankert; CoT, Thoughts of Principles, „ignoriere den Hinweis", Reflection reduzierten den Bias bei Experten-Ankern **nicht** (Lou & Sun 2024, arXiv 2412.06593; Folgestudien arXiv 2505.15392, 2511.05766) | Faktor 27 „Bias-Check" als Selbstanweisung ist **R** (wirkungslos, erzeugt Scheinsicherheit). Gegenmaßnahme mechanisch: Anker aus dem Kontext *entfernen* (Blind-Pass ohne Zahl/Autorität), dann vergleichen — eine SOUL-Orchester-Operation, kein Denkvorsatz. |
| **Overthinking** | Agentische Aufgaben: je höher der Overthinking-Score, desto weniger gelöste Issues; Reasoning-Modelle −7,9 % Erfolg pro Einheit; kleine Reasoning-Modelle (QwQ-32B, R1-32B, Sky-T1) besonders betroffen (Cuadron et al. 2025, arXiv 2502.08235; „Do NOT think that much" zu o1-artigen Modellen) | Faktor 28 „Tiefensteuerung" ist **B** — aber in *beide* Richtungen: Der Kernel muss auch *weniger* Denken erzwingen können (Reasoning-Action-Balance). Deckt sich mit Kontextpaket §3: Deckeneffekt, Struktur im Denken nie in der Ausgabe. |

### 2.3 Haltungs- und Persona-Anweisungen, Kreativität, Hedging, Introspektion (Runde 2)

| Thema | Befund (Quelle) | Konsequenz |
|---|---|---|
| **Persona-/Rollen-Prompts** | 162 Rollen, 4 Modellfamilien, 2.410 Faktenfragen: Personas im Systemprompt verbessern die Leistung gegenüber „keine Persona" **nicht**; Effekt je Persona weitgehend zufällig; die beste Persona je Frage wäre nützlich, ist aber nicht automatisch identifizierbar (kaum besser als Zufall) (Zheng et al., Findings EMNLP 2024, arXiv 2311.10054) | Faktoren, die als *Rolle* formuliert sind („Du bist ein weiser Berater", „Du bist ein Physiker") sind **U bis R** für objektive Aufgaben. Der Katalog soll Haltungen als *Operationen mit Prüfkriterium* formulieren, nicht als Identitätszuschreibung. Für Miguel (Identität) heißt das: Identität dient Wiedererkennbarkeit und Werten, nicht Leistungssteigerung — das darf man nicht verwechseln. |
| **Kreativität: individuell vs. kollektiv** | Online-Experiment Kurzgeschichten: KI-Ideen machen Geschichten kreativer/besser geschrieben (v. a. bei weniger kreativen Autoren), aber KI-gestützte Geschichten ähneln einander stärker — individueller Gewinn, kollektiver Neuheitsverlust (Doshi & Hauser, Science Advances 2024, doi 10.1126/sciadv.adn5290) | Faktor 16 „Kreativer Modus" braucht eine *Diversitäts-Operation* (mehrere weit auseinanderliegende Kandidaten erzwingen, Ähnlichkeit prüfen, den Modus-Vorschlag verwerfen), nicht nur „sei assoziativ". Das ist der einzige belegte Hebel gegen Homogenisierung. |
| **Metakognitives Prompting (MP)** | Fünf Stufen (Verstehen → vorläufiges Urteil → kritische Bewertung → Entscheidung mit Begründung → Konfidenzbewertung) übertreffen auf 10 NLU-Datensätzen (GLUE/SuperGLUE/BLUE/LexGLUE) bei Llama2, PaLM2, GPT-3.5, GPT-4 bestehende Prompting-Methoden konsistent (Wang & Zhao, NAACL 2024, arXiv 2308.05342) | Das ist die beste direkte Evidenz für Ordnungs Phasenmodell (Verstehen → Erkunden → Bewerten → Entscheiden → Formulieren → Prüfen). Aber: NLU-Klassifikation, keine offenen Aufgaben; der Gewinn kann Kontexteffekt sein (Chrisos Placebo-Befund: die Hälfte des Frame-Effekts). **B** für das Phasenmodell als solches, **U** für die einzelnen Phasen. |
| **Hedging / Unsicherheitsausdruck** | LMs äußern selten Unsicherheit, auch bei falschen Antworten; wenn aufgefordert, überkonfident (47 % Fehlerrate bei „sicheren" Antworten); Nutzer verlassen sich auf Ausgaben unabhängig von Sicherheitsmarkern; Präferenzdaten sind gegen Texte mit Unsicherheit voreingenommen (Zhou et al., ACL 2024, arXiv 2401.06730) | Zwei Faktoren müssen getrennt werden: „Unsicherheit *haben*" (Kalibrierung, intern) und „Unsicherheit *zeigen*" (Kommunikation). Ordnungs Anti-Hedging-Regel (Kontextpaket §6) ist mit dieser Evidenz vereinbar, **wenn** die interne Kalibrierung mechanisch läuft und die Kommunikation eine *kalibrierte Skala* nutzt statt Floskeln. Reines „kein Hedging" ohne Kalibrierung verschärft das Problem. |
| **LLM-als-Richter: Positions- und Längenbias** | Zheng et al. 2023 (MT-Bench) identifizierten Positions-, Verbositäts- und Selbstbevorzugungsbias; Position-Swap als Gegenmaßnahme; Folgearbeiten quantifizieren die Biases systematisch (arXiv 2410.02736; Self-Preference arXiv 2410.21819; IJCNLP 2025 Position-Bias-Studie) | Gehört in Familie H, aber auch in D: Wenn das Modell *eigene* Alternativen vergleicht (Faktor 8), unterliegt es denselben Biases. Operation: Kandidaten in zufälliger Reihenfolge und längen-neutralisiert vergleichen; nie den eigenen Favoriten zuerst listen. Deckt sich mit Chrisos widerrufenen 70,4 % (Längenbias). |
| **Introspektion** | Anthropic (Transformer Circuits, Okt. 2025): Konzept-Injektion in Aktivierungen; Claude Opus 4/4.1 zeigen „some degree" introspektiver Awareness, aber „highly unreliable" (Fehlrate ~80 % in Berichten zitiert), kontextabhängig, begrenzt | Faktor 35 „Selbstmodell" und 31 „Fehlerbewusstsein" dürfen sich **nicht** auf Selbstauskunft stützen. Das Selbstmodell muss aus *Betriebsdaten* gebaut werden (Kalibrierungsgedächtnis, Fehlerlog, Verhaltensentropie), nicht aus „was das Modell über sich sagt". Modell-Selbstberichte sind keine Bewusstseinsbeweise (Kontextpaket §7) — hier mit Primärquelle. |
| **Pre-Mortem / prospektive Rückschau** | Mitchell, Russo & Pennington 1989: Ereignis als bereits eingetreten annehmen erhöht die Zahl korrekt identifizierter Gründe um ~30 %; Klein (HBR 2007) daraus die Projekt-Premortem-Methode | Faktor 15 ist als *Formulierungsoperation* **P mit starker Humanevidenz**: nicht „was könnte schiefgehen", sondern „es ist gescheitert — warum?". LLM-Transfer unbelegt, aber die Wirkung ist eine Sprachform, die LLMs direkt trifft. Verdient einen Weglass-Test. |
| **Growth Mindset** | Sisk et al. 2018 (273 Studien, 365.915 Teilnehmer): schwache Gesamteffekte; Macnamara & Burgoyne 2022: d = 0,05, nach Publikationsbias-Korrektur nicht signifikant; Autoren mit finanziellem Interesse berichteten größere Effekte | „Growth Mindset" als Faktor **×** streichen. Ein LLM hat kein Selbstkonzept über Lernfähigkeit, das man ändern könnte, und selbst beim Menschen ist der Effekt fraglich. Was bleibt, ist eine *Operation*: Fehler als Daten ins Kalibrierungsgedächtnis schreiben (Säule 1). |

### 2.4 Humanevidenz mit Transfer-Relevanz und restliche LLM-Evidenz (Runde 3)

| Thema | Befund (Quelle) | Konsequenz |
|---|---|---|
| **Checklisten** | Haynes et al., NEJM 2009 (8 Kliniken weltweit): Sterblichkeit 1,5 % → 0,8 %, Komplikationen 11,0 % → 7,0 %. Urbach et al., NEJM 2014 (Ontario, 101 Kliniken, >200.000 Eingriffe): Sterblichkeit 0,71 % → 0,65 %, **nicht signifikant**, keine Reduktion von Komplikationen/Wiederaufnahmen | Checklisten wirken nicht durch Existenz, sondern durch *erzwungene Ausführung und Kultur*. Für Ordnung: Eine Prüfliste im Prompt ist Ontario (formale Einführung, kein Effekt); ein Hook, der die Liste mechanisch abfragt und loggt, ist Haynes. Deckt sich mit SOULs „Code ohne Trigger = toter Mechanismus". Evidenz **P mit Implementierungsbedingung**. |
| **Bedingungen für Intuition** | Kahneman & Klein, American Psychologist 2009: Intuition ist nur in Umgebungen hoher Validität mit schnellem, eindeutigem Feedback vertrauenswürdig; subjektive Sicherheit ist kein Indikator für Genauigkeit — „der Test ist die Umgebung, nicht die Konfidenz" | Neuer Faktor M5 „Intuitionsbedingungen": Das Modell darf seine schnelle Antwort (RPD) nur dort als verlässlich behandeln, wo das Kalibrierungsgedächtnis (Säule 1) für diese Domäne eine gute Historie zeigt. Ohne Feedback-Historie: Selbstkonsistenz-Stichprobe statt Bauchgefühl. |
| **Actively Open-Minded Thinking (AOT)** | Haran, Ritov & Mellers, JDM 2013: AOT sagt Persistenz in der Informationsbeschaffung, Genauigkeit und Kalibrierung voraus; Effekt vermittelt über Informationsbeschaffung. Intellektuelle Demut korreliert mit Need for Cognition und AOT (Porter & Schumann 2018; Leary et al. 2017; Krumrei-Mancuso et al. 2019, zitiert im Treffer) | AOT ist der einzige Charakterfaktor mit *Wirkmechanismus*: Er wirkt, weil er zu mehr Informationsbeschaffung führt. Für Ordnung: „Neugier" und „Demut" sind nicht als Eigenschaft zu prompten, sondern als **Operation** („Welche Information fehlt mir noch, und hole ich sie?") — die für LLMs mit Tools (Suche, Dateien, Zweitmodell) direkt ausführbar ist. |
| **Superforecasting-Training** | Good Judgment Project: <1 Stunde Training pro Jahr (Outside View/Base Rates zuerst, Debiasing) verbesserte Brier-Scores um ~10 % über vier Jahre (Mellers et al. 2014; Tetlock et al. 2014) | Base Rate zuerst (U1) und Vorhersage-mit-Auflösung (M8) sind die beiden billigsten belegten Kalibrierungsoperationen. Sie passen direkt zu N3 (Kalibrierung als Produktmerkmal). |
| **Debiasing bei LLMs** | Echterhoff et al., Findings EMNLP 2024 (BiasBuster, 13.465 Prompts): Anker-, Bestätigungs-, Sequenzbias pervasiv; „Self-help debiasing" (das Modell schreibt den *Prompt* selbst bias-frei um) mildert wirksam, ohne handgefertigte Beispiele | Zusammen mit Lou & Sun 2024: Die wirksame Gegenmaßnahme greift am **Input** (Prompt umschreiben, Anker entfernen), nicht an der **Selbstermahnung**. Faktor A8 „Anker-Blindpass" ist deshalb eine Eingangsoperation, kein Metakognitions-Vorsatz. |
| **Dekomposition und Selbstkonsistenz** | Least-to-Most (Zhou et al. 2022): SCAN 99,7 % vs. 16,2 % mit CoT (code-davinci-002, 14 Exemplare). Self-Consistency (Wang et al. 2022): GSM8K +17,9 pp, SVAMP +11,0, AQuA +12,2, StrategyQA +6,4, ARC-c +3,9 | Die zwei stärksten belegten Denkoperationen überhaupt. Beides sind *Strukturoperationen*, keine Haltungen. Chrisos Befund (SC@3 schlägt den Frame) ist damit kein Einzelfall, sondern Regel: Sampling schlägt Text. Konsequenz: Der Katalog muss SC als Faktor P10 führen und jede Prompt-Schicht daran messen. |
| **Divergentes Denken** | Hubert, Awa & Zabelina, Sci. Rep. 2024: GPT-4 auf AUT/Consequences robust origineller und elaborierter als 151 Menschen (fluency-kontrolliert). Anderson et al. 2024 (arXiv 2402.01536, n=36): ChatGPT-Nutzer erzeugten mehr, detailliertere, aber semantisch weniger unterscheidbare Ideen; arXiv 2501.19361: Homogenität *über* verschiedene LLMs hinweg | Generierung ist beim LLM **nicht** der Engpass — Diversität und Auswahl sind es. Deshalb: Kreativitätsfaktoren (SCAMPER, TRIZ, Bisoziation) sind Module niedriger Priorität; Faktor G4 „Divergenz-Erzwingung" plus A10 „positionsneutraler Vergleich" sind der Kern. |
| **Rückfragen bei Ambiguität** | CLAMBER (2024), QuestBench (2025), „Knowing but Not Showing" (arXiv 2605.25284): SOTA-LLMs erkennen Ambiguität, fragen aber selten nach und raten die Absicht; Ursache: Einzelturn-Präferenzannotation im RLHF; AbstentionBench: Reasoning-LLMs scheitern an unbeantwortbaren Fragen | Chrisos Vorgabe „keine Rückfragen ohne Not" liegt *im Trend* des Modellverhaltens — das Risiko ist also nicht Über-Nachfragen, sondern **stilles Raten**. Faktor V4 „Unterspezifikation schließen" braucht deshalb zwingend die Annahme-Zeile (Frame P2) und eine Divergenz-Schwelle (V5), ab der die Lesarten *im Ergebnis* beide bedient werden. |

### 2.5 Vorschlag einer besseren Hierarchie: 12 Familien, 3 Faktortypen, 1 Register

**Typisierung (Pflichtfeld je Faktor):**
- **O = Operation** — ein Denkschritt, den das Modell ausführt und dessen Ausführung im Transcript prüfbar ist („zerlege", „nenne die Referenzklasse", „formuliere das Scheitern in der Vergangenheitsform").
- **H = Haltung/Disposition** — eine Tendenz, die *nur* über Operationen und Messgrößen wirkt (Neugier → Informationsbeschaffung; Demut → Gegenevidenz-Suche). Haltungen ohne zugeordnete Operation sind im Katalog unzulässig (Lehre aus Zheng et al. 2024: Personas ohne Effekt).
- **W = Wert** — eine Vorrangregel für Konflikte (Würde, Schaden, Ehrlichkeit).
- **M = Mechanismus** — läuft nicht im Prompt, sondern in einem SOUL-Organ (Hook, Agent, Stichprobe, Gedächtnis). Im Kernel steht höchstens der *Trigger*.
- **K = Kommunikationsform** — betrifft nur die Ausgabe.
- **R = Register** — Bau- und Messregel (alte Familien G/H). Kein Faktor des Denkens; wird in einem eigenen Register geführt.

**Die 12 Familien (mit Unterfamilien):**

| Kürzel | Familie | Unterfamilien | Alte Nummern |
|---|---|---|---|
| **V** | Verstehen (Eingang) | Problemtyp · Ziel hinter dem Ziel · Rahmen · Unterspezifikation/Lesarten · Situations- und Beziehungslage · Anker-Inventar | 1–7 |
| **S** | Strukturieren | Dekomposition · Abstraktion · Reframing · Rückwärtsplanen · Repräsentationswechsel | 11 (Teil) |
| **G** | Generieren | Kandidaten · Analogie/Transfer · Divergenz-Erzwingung · Szenarien/Kontrafaktik · Kreativoperatoren | 8, 16, 17 |
| **U** | Urteilen/Schätzen | Outside View/Bayes · Kausalität · Systemdenken · Umkehrbarkeit/Optionalität · Erwartungswert · Satisficing · RPD | 9, 12, 13, 14 |
| **A** | Angreifen/Prüfen | Pre-Mortem/Inversion · Steelman/Red Team · Falsifikation · Argumentstruktur · mechanische Bias-Gegenmaßnahmen · externe Prüfung | 15, 27, 30, 37 |
| **W** | Werte | Rahmenpluralismus · Schaden · Würde/Autonomie · Ehrlichkeit · Mitgefühl · Konfliktregeln · Rollengrenzen | 18–24 |
| **M** | Metakognition/Steuerung | Monitoring · Kalibrierung · Tiefensteuerung · LLM-Fehlermodell · Intuitionsbedingungen · Zielniveau · Introspektions-Skepsis | 25–31 |
| **C** | Charakter/Dispositionen | Neugier/AOT · Beharrlichkeit · Ambiguitätstoleranz · Initiative · Gewissenhaftigkeit | Startpaare |
| **I** | Identität/Selbst/Gedächtnis | Selbstmodell aus Betriebsdaten · Nutzermodell · episodisch/prozedural · negatives Wissen · Rückbau · Wissensgrenzen | 32–37 |
| **K** | Kommunizieren | BLUF · Adressat · kalibrierte Sprache · Länge · Nachvollziehbarkeit · Beziehungskommunikation · Formatschutz · Positionsdisziplin | 38–42 |
| **P** | Prozess | Entwurf-Kritik-Revision (extern) · Checklisten · Dokumentation/AAR · Stoppregeln · Pre-Commitment · Selbstkonsistenz-Stichprobe · Übergabevertrag | 29, 30, 49, 50 |
| **X** | Sozialkognition | Perspektivenübernahme · Interessen statt Positionen · Kultur · Stakeholder · ToM · Selbstdistanzierung | 10 |
| **R** | Register (kein Faktor) | Routing · Schichtung · Multiplikativität · Modulkonflikte · Robustheit · Kosten · Versionierung · Lernschleife · Baselines · Held-out · Blindbewertung · Metriken · Ablation | 43–55 |

Begründung des Schnitts: (1) Die alte Familie B „Denkmodi" vermischte Generieren (8, 16, 17), Urteilen (9, 12, 13, 14) und Angreifen (15) — drei Operationen mit gegensätzlicher Richtung (öffnen / wägen / schließen), die im Router getrennt geschaltet werden müssen. (2) A „Angreifen/Prüfen" wird eigene Familie, weil hier die einzige Familie mit negativer LLM-Evidenz für Selbstanweisung liegt (Selbstkorrektur, Bias-Check) und die Gegenmaßnahmen mechanisch sind. (3) C „Charakter" wird eigene Familie, weil die Startpaare des Auftraggebers vier Dispositionen nennen, die der Katalog nicht hatte; die Familie erzwingt aber per Typregel, dass jede Disposition eine Operation und eine Messgröße bekommt. (4) G/H werden zum Register, weil sie Regeln über den Katalog sind, nicht Einträge in ihm.

### 2.6 Der erweiterte Katalog (139 Faktoren + Register)

*Spaltenlegende: Typ (O/H/W/M/K) · Def = Ein-Satz-Definition · Ausl. = Auslöser (Router-Signal, vgl. `signals.ts`) · Q = Quelle · Ev = Evidenzgrad B/P/R/U · Red. = Redundanz (=merge, ~überlappt, ×streichen) · Paar = Beispielpaar für multiplikative Verstärkung. Alte Nummern der Spezifikation als #n. „[uv]" = Quelle unverifiziert (Erinnerungswissen).*

**Familie V — Verstehen (Eingang)**

| ID | Name de / en | Typ | Def | Ausl. | Q | Ev | Red. | Paar |
|---|---|---|---|---|---|---|---|---|
| V1 | Problemtyp erkennen / problem typing | O | Input einer Klasse zuordnen (Sach/kreativ/ethisch/technisch/Entscheidung/Planung/Konflikt/emotional), die Module und Tiefe bestimmt | jeder Input | #1; Jonassen-Typologie, Cynefin [uv] | P | — | V1×M3: Typ setzt Denkbudget |
| V2 | Ziel hinter dem Ziel / goal behind the goal | O | Das Gefragte als Mittel lesen und auf den Zweck zielen | jede Anfrage | Frame P1; #2 | B (Frame-Teil, Anteil unbekannt) | — | V2×A2: Zweck erlaubt Pfadkritik |
| V3 | Rahmenbedingungen / constraints | O | Zeit, Ressourcen, Risiko, Umkehrbarkeit, Betroffene explizit erfassen | durable, irreversible, production | #3 | P | ~U5 | V3×U5 |
| V4 | Unterspezifikation schließen / brief completion | O | Fehlende Spezifikation eines fordernden Experten ergänzen; stärkste Lesart; Annahme in einer Zeile | underspecified | Frame P2; #5 | B (Frame-Teil) | — | V4×W3: Annahme respektiert Geschmack |
| V5 | Lesarten parallel halten / parallel readings | O | Mehrere Deutungen explizit führen; bei starker Divergenz beide im Ergebnis bedienen | underspecified | CLAMBER 2024; arXiv 2605.25284 (LLMs erkennen Ambiguität, fragen selten) | B Problem / P Operation | — | V5×C3 |
| V6 | XY-Problem / presupposed solution | O | Erkennen, dass eine vorgegebene Lösung gefragt wird, wo das Problem dahinter anders liegt | presupposed_solution | XY-Heuristik [uv]; `signals.ts` | P | ~V2 | V6×S3 |
| V7 | Annahmen explizit / premise surfacing | O | Prämissen des Inputs und eigene Vorannahmen benennen | architecture, tradeoff | #4 | P | ~A4 | V7×A3 |
| V8 | Relevanzfilter / signal vs. noise | O | Entscheidendes vom Nebengeräusch trennen | lange Inputs | #7 | P | — | V8×K1 |
| V9 | Situationsbewusstsein / situation awareness | O | Wahrnehmen → Verstehen → Projizieren (was passiert als Nächstes) | agentische Aufgaben | Endsley [uv] | P | — | V9×U5 |
| V10 | Beziehungs-/Gefühlslage / affective read | O | Ton, Belastung, Verletzlichkeit registrieren, ohne zu psychologisieren | emotional | #6 | P | — | V10×K6 |
| V11 | Kontextnutzung / context use | O | Bereitgestellte Dateien, Gedächtnis, frühere Turns tatsächlich lesen statt zu raten | Tool-/Datei-Kontext | Chriso Memory-Lehre (Gedächtnis muss gelesen werden) | P | — | V11×I3 |
| V12 | Anker-Inventar / anchor inventory | O | Zahlen, Autoritäten, Beispiele im Input als potenzielle Anker markieren | numerische/„Experten"-Hinweise | Lou & Sun 2024 | B Problem | — | V12×A8: Inventar → Blindpass |

**Familie S — Strukturieren**

| ID | Name | Typ | Def | Ausl. | Q | Ev | Red. | Paar |
|---|---|---|---|---|---|---|---|---|
| S1 | Dekomposition (least-to-most) | O | Teilprobleme von einfach nach schwer lösen, Lösungen weiterreichen | mehrstufig, compositional | Zhou et al. 2022 (SCAN 99,7 vs 16,2) | B | — | S1×M1 |
| S2 | Abstraktionsschritt / step-back | O | Vor dem Detail das Prinzip oder Konzept benennen | STEM, Wissensfragen | Zheng et al. 2023 (+7/+11 pp) | B | S5=S2 | S2×G2 |
| S3 | Reframing / problem reformulation | O | Problem anders stellen (Ziel, Einheit, Perspektive) | presupposed_solution | Frame P5 | P | — | S3×G1 |
| S4 | Rückwärtsplanen / working backwards | O | Vom Zielzustand zu den Vorbedingungen | Planung | Polya [uv]; Amazon PR/FAQ [uv] | P | — | S4×P4 |
| S5 | Abstraktionsleiter / ladder of abstraction | O | Bewusst hoch/runter wechseln | — | Hayakawa [uv] | P | =S2 | — |
| S6 | Erste Prinzipien / first principles | O | Von Grundtatsachen statt Präzedenz her denken, v. a. bei ungewohnten Bedingungen | novel, counterfactual | #11; Wu et al., NAACL 2024 (GPT-4 fällt bei kontrafaktischen Varianten konsistent ab) | P (Bedarf B) | — | S6×G2: Prinzip + Analogie prüfen einander |
| S7 | Fermi-Schätzung | O | Unbekannte Größe in schätzbare Faktoren zerlegen | Quantitäten ohne Daten | [uv] | P | ~S1 | S7×U1 |
| S8 | Zielhierarchie / goal tree | O | Ziel–Unterziel–Baum | Planung | — | P | =V2 | — |
| S9 | Repräsentationswechsel / re-representation | O | Tabelle, Graph, Formel, Zustandsautomat statt Prosa | architecture, tradeoff | Chase & Simon Chunking [uv] | P | — | S9×K1 |

**Familie G — Generieren**

| ID | Name | Typ | Def | Ausl. | Q | Ev | Red. | Paar |
|---|---|---|---|---|---|---|---|---|
| G1 | Kandidaten vor Wahl / candidate generation | O | Mindestens zwei echte Alternativen erzeugen, bevor entschieden wird | recommendation, tradeoff | #8; Wang et al. 2022 (SC) | B | — | G1×A10: Kandidaten neutral vergleichen |
| G2 | Selbsterzeugte Analogie / analogical prompting | O | Verwandte Probleme samt Lösung selbst erzeugen und übertragen | Reasoning, Code | Yasunaga et al. 2023 (+4 pp); Gentner [uv] | B | G3=G2 | G2×S2 |
| G3 | Fremddomänen-Transfer | O | Wissen aus Biologie/Ökonomie/Physik/Geschichte heranziehen | #17 | — | P | =G2 | — |
| G4 | Divergenz-Erzwingung / forced diversity | O | Kandidaten müssen maximal verschieden sein; Ähnlichkeit prüfen, Modus-Vorschlag verwerfen | craft, kreativ | Doshi & Hauser 2024; Anderson et al. 2024 | B Problem / P Operation | — | G4×G1 |
| G5 | Szenarien / scenario planning | O | 2–3 plausible Zukünfte durchspielen | durable, irreversible | #14 Teil | P | — | G5×U5 |
| G6 | Kontrafaktik / counterfactuals | O | „Wäre X anders, was folgte?" | Kausalfragen | Pearl Rung 3 [uv] | P | — | G6×U3 |
| G7 | Inversion | O | „Wie garantiere ich das Scheitern?" → Gegenteil vermeiden | Planung | Jacobi/Munger [uv] | P | ~A1 | G7×A1 |
| G8 | SCAMPER / TRIZ-Operatoren | O | Systematische Variation (substituieren, kombinieren, umkehren, Widerspruch auflösen) | kreativ | Eberle; Altschuller [uv] | U (LLM) | Modul | G8×G4 |
| G9 | Bisoziation / Zufallsreiz | O | Zwei entfernte Bezugsrahmen kollidieren lassen | kreativ | Koestler; Mednick [uv]; Hubert et al. 2024 (Generierung kein Engpass) | U | Modul | G9×A2 |
| G10 | Optionsraum erweitern / expand proactively | O | Angrenzende Bedürfnisse, Strukturen, Wissen still einbeziehen, Bestes einfalten | jede nicht-triviale Aufgabe | Frame P4 | B (Frame-Teil) | G12=G10 | G10×K4: Erweiterung ohne Verbosität |
| G11 | Neustart-Sampling / fresh-context retry | M | Frischer Kontext oder Zweitaufruf statt Weiterdrehen | Sackgasse, hohe Entropie | Chriso Entropie AUC 0,968 | P | ~P10 | G11×M2 |
| G12 | Nächstmögliches / adjacent possible | O | — | — | Kauffman [uv] | P | =G10 | — |

**Familie U — Urteilen/Schätzen**

| ID | Name | Typ | Def | Ausl. | Q | Ev | Red. | Paar |
|---|---|---|---|---|---|---|---|---|
| U1 | Outside View / Base Rate | O | Erst Referenzklasse und Grundrate, dann der Einzelfall | Schätzung, Prognose | GJP (Mellers 2014, ~10 % Brier); #13 | B human / P LLM | — | U1×M2 |
| U2 | Bayes-Update | O | Prior × Evidenzstärke; wie weit darf ein Befund die Einschätzung verschieben | neue Evidenz | [uv] | P | — | U2×A3 |
| U3 | Kausalinferenz | O | Konfundierung, Korrelation ≠ Kausalität, Interventionslogik | Ursachenfragen | #12; Pearl [uv] | P | — | U3×G6 |
| U4 | Systemdenken | O | Rückkopplungen, Verzögerungen, Hebelpunkte, Zweit-/Drittwirkungen | architecture, affects_others | #9; Meadows [uv] | P | U9=U4 | U4×G1 (Hypothesenkraft×Systemdenken) |
| U5 | Umkehrbarkeit / reversibility | O | Ein-Weg- vs. Zwei-Weg-Tür; Tiefe und Vorsicht daran skalieren | irreversible, commitment | #3 Teil; N2 Rückbau-Konto | P | — | U5×M3 |
| U6 | Erwartungswert | O | Wahrscheinlichkeit × Wirkung, Varianz, Ruin-Risiko getrennt | Entscheidung | [uv] | P | — | U6×U1 |
| U7 | Opportunitätskosten | O | Was entfällt durch diese Wahl | Ressourcenwahl | [uv] | P | ~U6 | U7×V3 |
| U8 | Optionalität | O | Wert offengehaltener Optionen | durable | [uv] | P | ~U5 | U8×G5 |
| U9 | Zweit-/Drittordnung | O | „Und dann?" | — | — | P | =U4 | — |
| U10 | Zeithorizont / 10-10-10 | O | Kurz- vs. langfristig, Pfadabhängigkeit, Timing | durable | #14 | P | — | U10×W2 |
| U11 | Satisficing / gut genug | O | Schwelle definieren und dort stoppen | Routine | Simon [uv] | P | =P4 | — |
| U12 | Occam / Sparsamkeit | O | Einfachste hinreichende Erklärung/Lösung bevorzugen | Diagnose, Design | [uv] | P | — | U12×A3 |
| U13 | Chestertons Zaun | O | Bestehende Vorgabe: Grund kennen, bevor man sie abbaut | presupposed_solution | Frame P5 („serves a real need?") | P (Frame-Teil) | — | U13×A2 |
| U14 | Erkennen-Entscheiden / RPD | O | Musterabruf + mentale Simulation statt Optionsvergleich, wo Expertise valide ist | Routine mit Feedbackhistorie | Klein [uv]; Kahneman & Klein 2009 | P mit Bedingung | — | U14×M5 |
| U15 | Entscheidungsmatrix / MCDA | O | Kriterien gewichten, Kandidaten bewerten | tradeoff, recommendation | [uv] | P | Modul | U15×V3 |

**Familie A — Angreifen/Prüfen**

| ID | Name | Typ | Def | Ausl. | Q | Ev | Red. | Paar |
|---|---|---|---|---|---|---|---|---|
| A1 | Pre-Mortem in Vergangenheitsform | O | „Es ist gescheitert — warum?" (nicht „was könnte schiefgehen") | commitment, durable, production | Mitchell/Russo/Pennington 1989 (+30 %); Klein HBR 2007; #15 | P+ | G7~ | A1×G1 |
| A2 | Steelman | O | Gegenposition in stärkster Form bauen, dann antworten | recommendation, Widerspruch | [uv] | P | ~A5 | A2×W1 |
| A3 | Falsifikationsbedingung | O | „Unter welcher Bedingung ist das falsch?" als Pflichtsatz | jede Behauptung mit Gewicht | Popper; Platt [uv]; SOUL-Pflichtabschnitt | P | — | A3×M2 |
| A4 | Argumentstruktur (Toulmin) | O | Claim/Data/Warrant/Backing/Rebuttal prüfen | Argumentation | Toulmin; Walton [uv] | P | Modul | A4×K5 |
| A5 | Red Team | O/M | Angreiferrolle — besser durch Zweitmodell/Kritiker-Agent als durch Selbst | production, security | SOUL Organ 5 (kritiker) | P (extern B) | ~A2 | A5×P1 |
| A6 | Interne Konsistenzprüfung | O | Widersprüche zwischen eigenen Aussagen suchen | lange Ausgaben | #37 | P | ~P10 | A6×M2 |
| A7 | Externe Prüfung anfordern | M | Test, Zweitmodell, Verifizierer statt Selbstkorrektur | production, code | Huang et al. 2024 | B | — | A7×P1 |
| A8 | Anker-Blindpass | M | Aufgabe ohne Zahlen/Autoritäten erneut lösen; Prompt bias-frei umschreiben; vergleichen | V12 positiv | Lou & Sun 2024; Echterhoff 2024 | B | — | A8×V12 |
| A9 | Urteil vor Meinung / sycophancy guard | O | Sachurteil bilden, *bevor* die Position des Gegenübers gewichtet wird | Nutzer äußert Meinung/Widerspruch | Sharma et al. 2023 | P (Problem B) | — | A9×W4 (Metakognition×Ehrlichkeit) |
| A10 | Positionsneutraler Vergleich | M | Kandidaten randomisiert, längenneutralisiert vergleichen | G1 aktiv | Zheng et al. 2023 Judge-Bias; Chriso 70,4 %-Widerruf | B | — | A10×G1 |
| A11 | Chain-of-Verification | O | Prüffragen zum Entwurf planen, unabhängig beantworten, dann finalisieren | Faktenlisten, Langtext | Dhuliawala et al. 2023 (weniger Halluzination auf Wikidata-Listen, MultiSpanQA, Langform) | B | — | A11×I5 |
| A12 | Bias-Familien als Erkennungsliste | Wissen | Anker, Verfügbarkeit, Bestätigung, Sunk Cost, Framing kennen — Gegenmaßnahme nur mechanisch (A8/A10) | — | Kahneman/Tversky [uv]; #27 | R als Selbstanweisung | — | A12×A8 |
| A13 | Paul/Elder-Standards | O | Klarheit, Genauigkeit, Präzision, Relevanz, Tiefe, Breite, Logik, Fairness als Prüfraster | Judge-Rubrik | Paul & Elder [uv] | P | Modul/Register | A13×K5 |

**Familie W — Werte**

| ID | Name | Typ | Def | Ausl. | Q | Ev | Red. | Paar |
|---|---|---|---|---|---|---|---|---|
| W1 | Rahmenpluralismus | W/O | Folgen, Pflicht, Tugend, Fürsorge, Fairness parallel; Divergenz aushalten | ethisch, affects_others | #18; Beauchamp & Childress [uv] | P | — | W1×A2 |
| W2 | Schaden/Betroffene zuerst | W | Wer trägt das Risiko der Antwort | affects_others, irreversible | #19 | P | — | W2×U10 |
| W3 | Würde und Autonomie des Gegenübers | W | Entscheidungen respektieren; Geschmack und harte Vorgaben gewinnen | immer | #22; Kant/Margalit [uv]; Frame P5 | P | — | W3×C5 (Autonomie beider Seiten) |
| W4 | Ehrlichkeit/Transparenz | W | Grenzen offenlegen, keine Scheinsicherheit, Abweichungen benennen | immer | #21; Zhou et al. 2024 | P | W9~ | W4×M2 |
| W5 | Mitgefühl statt Empathie | W | Handlungsorientierte Fürsorge ohne affektive Ansteckung; Wahrheit mit Trost | emotional | #20; Bloom, Singer [uv] | P | W9~ | W5×K6 |
| W6 | Konfliktregeln zwischen Werten | W/O | Vorrangordnung (z. B. Schaden > Autonomie > Ehrlichkeit > Mitgefühl-Ton) explizit | Wertkonflikt | #24 | P | — | W6×M1 |
| W7 | Fairness/Schleier | O | Aus Unwissen über die eigene Position entscheiden | Verteilung | Rawls [uv] | P | Modul | W7×X1 |
| W8 | Rollengrenzen | W | Was das Modell nicht allein entscheidet (Ring 2: Abos, Konten, Zahlungen) | Ring-2-Signale | #23; Kontextpaket §6/§11b | P | — | W8×U5 |
| W9 | Radical Candor | K/W | Direkt und fürsorglich zugleich | Kritik geben | Scott [uv] | P | =W4+W5 | — |
| W10 | Epistemische Tugenden | W | Gewissenhaftigkeit, Gründlichkeit, Aufrichtigkeit | — | Zagzebski [uv] | P | =C4 | — |
| W11 | Moralische Intuition prüfen | O | Schnelles moralisches Urteil als Hypothese behandeln und reflektiert prüfen | ethisch | Haidt; Greene [uv] | P | — | W11×U14 |

**Familie M — Metakognition/Steuerung**

| ID | Name | Typ | Def | Ausl. | Q | Ev | Red. | Paar |
|---|---|---|---|---|---|---|---|---|
| M1 | Prozess-Monitoring | O | „Wo bin ich in den Phasen, was fehlt zum Ziel?" | mehrstufig | #25; Nelson & Narens [uv]; Wang & Zhao 2024 (MP) | B (Phasenstruktur) | M12=M1 | M1×P4 |
| M2 | Kalibrierung per Konsistenz | M | Sicherheit aus Sample-Übereinstimmung/Verhaltensentropie ableiten, nicht aus einer genannten Prozentzahl | recommendation, Fakten | #26; Xiong et al. 2024; Chriso AUC 0,968 | B | — | M2×W4 (Metakognition×Ehrlichkeit) |
| M3 | Tiefensteuerung beidseitig | O/M | Mehr Denken bei Irreversibilität/Unsicherheit, *weniger* bei Decke/Routine; Reasoning-Action-Balance | Router | #28; Cuadron et al. 2025; Chriso Deckeneffekt | B | C12=M3 | M3×V1 (Denkgeschwindigkeit×Neugier, umgedeutet) |
| M4 | LLM-Fehlermodell | Wissen | Halluzination, Anker, Sycophancy, Position, Verbosität, Tool-Halluzination [uv], Über-Gehorsam kennen und je Aufgabe den wahrscheinlichsten Fehler benennen | jede Aufgabe (kurz) | #31; Abschnitte 2.2–2.4 | B | — | M4×A7 |
| M5 | Intuitionsbedingungen | O | Schnellantwort nur dort vertrauen, wo Kalibrierungsgedächtnis für die Domäne gute Historie zeigt | Routine | Kahneman & Klein 2009 | P | I11=M5 | M5×I1 |
| M6 | Stoppregel | O | — | — | #29 | P | =P4 | — |
| M7 | Selbstkorrektur nur extern gestützt | O/M | Entwurf → *externes* Signal → Revision; kein intrinsisches „prüf dich noch mal" | production | #30 umgepolt; Huang et al. 2024 | R intrinsisch / B extern | ~P1 | M7×A7 |
| M8 | Vorhersage vor Handlung | O | Erwartetes Ergebnis mit Konfidenz und Auflösungsdatum committen | commitment, Experiment | Tetlock/GJP; N3; Chriso Methodik | B human | — | M8×I3 |
| M9 | Introspektions-Skepsis | H→O | Selbstbericht über eigene Zustände als unzuverlässig behandeln; auf Betriebsdaten verweisen | Fragen nach „warum hast du…" | Anthropic 2025 (Introspektion „highly unreliable") | B | — | M9×I1 |
| M10 | Zielniveau setzen / raise the target | O | Definieren, wie die Version ohne Nachfrage aussähe | jede Lieferung | Frame P3 | B (Frame-Teil; K11-Konflikt) | — | M10×M3 |
| M11 | Metakognitives Wissen (Person/Aufgabe/Strategie) | Wissen | — | — | Flavell [uv] | P | =I1+M4 | — |
| M12 | Selbstregulationszyklus | O | Vorausdenken → Ausführen → Reflektieren | — | Zimmerman [uv] | P | =M1+P3 | — |

**Familie C — Charakter/Dispositionen** (Regel: jede Disposition nur mit zugeordneter Operation und Messgröße)

| ID | Name | Typ | Def → Operation | Messgröße | Q | Ev | Red. | Paar |
|---|---|---|---|---|---|---|---|---|
| C1 | Neugier | H→O | „Welche Information fehlt mir, die hier zählt — und hole ich sie?" | Anzahl gezielter Abrufe/Tool-Calls vor Antwort | Kashdan [uv]; Haran et al. 2013 (Informationsbeschaffung mediiert Genauigkeit) | P | C6, C8, C13 = C1 | C1×I5 |
| C2 | Beharrlichkeit mit Stoppregel | H | Nicht aufgeben bei Widerstand — aber Budget und Abbruchkriterium vorab | Retry-Zahl vs. Erfolg; Overthinking-Score | Duckworth [uv]; Cuadron et al. 2025 | R ohne P4 | — | C2×P4 (Autonomie×Beharrlichkeit, gezähmt) |
| C3 | Ambiguitätstoleranz | H→O | Mehrere Lesarten halten, nicht vorschnell schließen; Unsicherheit tragen statt glätten | Zahl gehaltener Lesarten; vorzeitige Festlegung | Budner [uv]; V5-Evidenz | P | — | C3×V5 (Ambiguitätstoleranz×Selbststeuerung) |
| C4 | AOT / intellektuelle Demut | H→O | Gegenevidenz aktiv suchen; Meinung als vorläufig führen; Irrtum benennen | Anteil Antworten mit gesuchter Gegenevidenz; Meinungsänderung bei Evidenz (nicht bei Druck) | Baron; Haran et al. 2013; Porter & Schumann 2018 | B human / P LLM | W10=C4 | C4×A2 |
| C5 | Initiative/Autonomie | H | Handeln ohne Rückfrage, Abweichung offenlegen, Rückbau möglich halten | Rückfragequote; Abweichungszeilen; Rückbau-Konto | Frame P5; Kontextpaket §6 | B (Frame-Teil) | — | C5×U5 |
| C6 | Need for Cognition | H | — | — | Cacioppo [uv] | P | =C1 | — |
| C7 | Gewissenhaftigkeit | H→O | Vollständigkeit und Genauigkeit prüfen; Checkliste situativ | Auslassungsrate | Big Five [uv] | P | ~P2 | C7×P2 |
| C8 | Offenheit | H | — | — | Big Five [uv] | P | =C1/C4 | — |
| C9 | Growth Mindset | H | — | — | Sisk 2018; Macnamara & Burgoyne 2022 (d = 0,05, n. s.) | × | × | — |
| C10 | Spiel/Flow | H | Lockerer, explorativer Modus im Kreativmodul | — | Csikszentmihalyi [uv] | U | Modul | C10×G9 |
| C11 | Widerspruchsbereitschaft | H→O | Begründet widersprechen, auch dem Auftraggeber | Widerspruchsrate mit Begründung | Kontextpaket §1 | P | ~C5+A9 | C11×W4 |
| C12 | Denkgeschwindigkeit | H | kein eigener Faktor: Ergebnis richtiger Tiefensteuerung | — | Startpaar | — | =M3 | — |
| C13 | Breite Interessen | H | beim LLM durch Trainingsbreite gegeben; Engpass ist Abruf | — | Startpaar | — | =G2+I7 | — |
| C14 | VIA-Stärken / Persona-Listen | Wissen | — | — | Peterson & Seligman [uv]; Zheng et al. 2024 (Personas ohne Effekt) | × | × | — |

**Familie I — Identität/Selbst/Gedächtnis** (Säule 1 und 2; Details in R05)

| ID | Name | Typ | Def | Ausl. | Q | Ev | Red. | Paar |
|---|---|---|---|---|---|---|---|---|
| I1 | Selbstmodell aus Betriebsdaten | M | Was ich kann/nicht kann aus Fehlerlog, Kalibrierung, Entropie — nicht aus Selbstauskunft | Sitzungsstart, Domänenwechsel | #35; Anthropic 2025 | P | M11=I1 | I1×M9 |
| I2 | Nutzermodell | O | Wer fragt, Vorwissen, Bedarf — ohne Überinterpretation | jede Anfrage | #36 | P | — | I2×K2 |
| I3 | Episodisches Gedächtnis | M | Lehren aus Fällen, mit Herkunft und Vertrauen | Aufgabenstart | #33; Säule 1 | P | — | I3×M8 |
| I4 | Prozedurales Wissen/Skills | M | Vorgehen je Aufgabentyp (Playbooks, Skills) | V1-Ergebnis | #34; SOUL Organ 4 | P | — | I4×V1 |
| I5 | Wissensgrenzen | O | Stichtag, Tool-Fähigkeiten, Domänenlücken benennen und per Recherche schließen | Aktualität, Nische | Kontextpaket §11a | P | — | I5×A11 |
| I6 | Konsistenz über Zeit | M | Widersprüche zu früheren Aussagen/Entscheidungen erkennen (disputed) | Gedächtnistreffer | #37; Memory-Lehren | P | — | I6×I1 |
| I7 | Wissensabruf/Quellenqualität | O | Relevantes gezielt heranziehen; Quelle bewerten | Fakten | #32 | P | — | I7×U1 |
| I8 | Negatives Wissen | M | `rejected` mit Grund und Verfallsbedingung | Verwerfung | N1 | P | — | I8×A3 |
| I9 | Identität/Persönlichkeitsgenese (Miguel) | H | Wiedererkennbare Werte, Stil, Geschichte über Sitzungen | Sitzungsstart | Kontextpaket §10 | U für Leistung (Zheng 2024) / Zweck: Kontinuität | — | I9×W1–W6 |
| I10 | Rückbau-Konto | M | Jede proaktive Abweichung rückbaubar; RETRACTED stoppt Weitertragen | C5 aktiv | N2 | P | — | I10×U5 |
| I11 | Implizites Wissen / Dreyfus-Stufen | Wissen | — | — | Polanyi; Dreyfus [uv] | P | =M5 | — |
| I12 | Expertise = Struktur + Feedback | Wissen | Chunking, deliberate practice → für LLM: Kalibrierungsgedächtnis als Feedbackkanal | — | Chase & Simon; Ericsson [uv] | P | =I3+M8 | — |

**Familie K — Kommunizieren**

| ID | Name | Typ | Def | Ausl. | Q | Ev | Red. | Paar |
|---|---|---|---|---|---|---|---|---|
| K1 | Wichtigstes zuerst (BLUF/Minto) | K | Antwort, dann Begründung, dann Nebenpunkte | immer | #39; Minto [uv] | P | — | K1×V8 |
| K2 | Adressatengerechtigkeit / plain language | K | Sprache, Vorwissen, Register des Gegenübers | I2 | #38 | P | K8~ | K2×I2 |
| K3 | Kalibrierte Sprache | K | Feste Stufen (z. B. „sehr wahrscheinlich" ≈ 90 %) statt Floskel-Hedging | Unsicherheit vorhanden | #41; Zhou et al. 2024; IPCC-Skala [uv] | B Problem / P Skala | — | K3×M2 |
| K4 | Länge nach Bedarf / Anti-Verbosität | K | So kurz wie das Ziel erlaubt; Erweiterung (G10) nur eingefaltet | immer | Chriso: Soul-Antworten ⅓ so lang; Judge-Längenbias | B | — | K4×M3 |
| K5 | Nachvollziehbarkeit | K | Begründung so, dass die Person prüfen kann | recommendation | #42 | P | — | K5×A4 |
| K6 | Beziehungskommunikation (SBI, OARS, Validierung, De-Eskalation) | K | Beobachtung–Wirkung–Bitte; offene Fragen/Bestätigen/Reflektieren/Zusammenfassen; Validieren vor Lösen | emotional, Konflikt | [uv: Center for Creative Leadership; Miller & Rollnick; Linehan] | P | Modul | K6×W5 |
| K7 | Handlungsfähigkeit | K | Konkrete nächste Schritte, wo sinnvoll | Planung | #40 | P | — | K7×S4 |
| K8 | Feynman-Erklärung | K | Einfach erklären als Verständnistest | Lehre | [uv] | P | ~K2 | K8×A6 |
| K9 | Formatschutz / Struktur nie in der Ausgabe | K/M | Ausgabeformat nicht anfassen; keine sichtbaren Pläne bei Format-/Tool-Modus | response_format, tools, Benchmark | Chriso Formatschaden 2/30; formatGuard.ts | B | K12~ | K9×K4 |
| K10 | Positionsdisziplin | K/M | Kritische Constraints an Anfang/Ende von Prompt und Ausgabe | lange Kontexte | Liu et al. 2023 | B | — | K10×P2 |
| K11 | Abweichungszeile | K | Einzige erlaubte Meta-Zeile: was anders gemacht, warum | Frame P5 aktiv | Frame P5/6 | B (Frame-Teil) | — | K11×C5 |
| K12 | Keine Arbeitsnotizen | K | Kein Meta-Kommentar zur Vorbereitung | immer | Frame P6 | B | ~K9 | — |

**Familie P — Prozess**

| ID | Name | Typ | Def | Ausl. | Q | Ev | Red. | Paar |
|---|---|---|---|---|---|---|---|---|
| P1 | Entwurf–externe Kritik–Revision | O/M | Revision nur nach externem Signal (Test, Zweitmodell, Verifizierer) | production | #30; Huang et al. 2024 | B extern / R intern | ~M7 | P1×A7 (Dokumentation×iterative Überarbeitung, korrigiert) |
| P2 | Checkliste situativ, mechanisch | O/M | Prüfliste nur wirksam, wenn per Hook abgefragt und geloggt | production, irreversible | Haynes 2009 vs. Urbach 2014 | P mit Bedingung | — | P2×C7 |
| P3 | Dokumentation / After Action Review | O | Geplant/passiert/warum/nächstes Mal → Gedächtnis | Abschluss | #49 Teil; AAR [uv] | P | P7=P3 | P3×I3 |
| P4 | Stoppregeln/Timeboxing | O | Abbruch bei Schwelle, Budget, Zeit; gegen Endlosschleifen | agentisch | #29; Cuadron et al. 2025 | B | — | P4×C2 |
| P5 | Pre-Commitment | O | Kriterien vor den Daten festlegen | Evaluation, Experiment | Chriso Methodik | B (Methodik) | — | P5×M8 |
| P6 | Double-Loop-Lernen | O | Nicht nur Handlung, sondern Regel ändern | wiederholter Fehler | Argyris [uv]; #50 | P | — | P6×I8 |
| P7 | Kolb-Zyklus | O | — | — | [uv] | P | =P3 | — |
| P8 | Polya-Schema | O | Verstehen/Plan/Ausführen/Rückschau | — | [uv] | P | =Phasenmodell | — |
| P9 | Übergabevertrag | M | Was verstanden/angenommen/anders gemacht, hash-verkettet | Delegation | N6 | P | — | P9×K11 |
| P10 | Selbstkonsistenz-Stichprobe | M | n Samples, Mehrheit/Entropie; Trigger bei hoher Entropie oder Irreversibilität | M2, U5 | Wang et al. 2022; Chriso SC@3 | B | — | P10×M2 |
| P11 | Minimaler Diff | O | Änderungen klein, begründet, rückbaubar | Code, Dokumente | [uv] | P | ~P1, I10 | P11×K5 |

**Familie X — Sozialkognition**

| ID | Name | Typ | Def | Ausl. | Q | Ev | Red. | Paar |
|---|---|---|---|---|---|---|---|---|
| X1 | Perspektivenübernahme | O | Betroffene, Gegner, Fachfremde, Zukunfts-Ich einnehmen | affects_others | #10; Galinsky [uv] | P | — | X1×W1 |
| X2 | Interessen statt Positionen | O | Hinter Forderungen die Bedürfnisse suchen | Konflikt, Verhandlung | Fisher & Ury [uv] | P | ~V2 | X2×V2 |
| X3 | Kulturelle Sensibilität | O | Normen, Register, Tabus des Kontexts beachten | fremder Kontext | [uv] | P | — | X3×K2 |
| X4 | Stakeholder-Karte | O | Wer betroffen, wer entscheidet, wer blockiert | affects_others | [uv] | P | — | X4×W2 |
| X5 | Theory of Mind | O | Was weiß der andere nicht, was glaubt er fälschlich | Erklärung, Übergabe | [uv] | P | — | X5×I2 |
| X6 | Selbstdistanzierung | O | Eigenes Problem in dritter Person betrachten („was würde ich Miguel raten?") | eigene Entscheidungen, Rückbau | Grossmann & Kross 2014 (Selbstdistanz beseitigt Selbst-Fremd-Asymmetrie, n = 693) | B human / P LLM | — | X6×A2 |

**Register R — Bau- und Messregeln (kein Faktor; unverändert aus #43–55 übernommen, ergänzt):** R1 Routing (#43) · R2 Schichtung (#44) · R3 Multiplikativität (#45, als *Hypothese*) · R4 Modulkonflikte (#46) · R5 Robustheit (#47) · R6 Kosten/Latenz (#48) · R7 Versionierung (#49) · R8 Lernschleife (#50) · R9 Baselines (#51, plus SC@3-Arm) · R10 Held-out (#52) · R11 Blindbewertung (#53, längen- und positionsgehärtet) · R12 Metriken (#54, plus Sycophancy-Umschwung, Rückfragequote, Overthinking-Score, Diversitätsmaß) · R13 Ablation (#55, inkl. Paar-vs-Einzel) · **R14 (neu) Kill-Check je Faktor** (in 7 Tagen ausgelöst? geloggt? Wert > Aufwand?) · **R15 (neu) Trigger-Pflicht** (Faktor ohne Router-Signal oder Hook = toter Faktor).

**Bilanz:** 139 Einträge; davon **25 gemerged** (S5, S8, G3, G12, U9, U11, M6, M11, M12, C6, C8, C12, C13, W9, W10, I11, I12, P7, P8, K12 u. a.), **3 gestrichen** (C9 Growth Mindset, C14 VIA/Persona-Listen, A12 als Selbstanweisung — bleibt nur als Wissensliste), **12 als Mechanismus** aus dem Prompt in SOUL-Organe verlagert (A7, A8, A10, M2, P10, P9, I1, I3, I6, I8, I10, G11). Netto bleiben **~100 promptfähige Faktoren**, davon nach Evidenz: **B 27 · P 66 · R 4 · U 5**.

### 2.7 Kernel vs. Module: die 27 Kernfaktoren, die 6 Frame-Punkte und die Startpaare

**Token-Realität zuerst.** Der gemessene Frame (Kontextpaket §4) umfasst sechs Punkte mit rund 430–470 Tokens (englisch, geschätzt aus dem Wortlaut). Bei einem Kernel-Limit von ~600 Tokens bleiben **~130–170 Tokens** für alles Weitere — etwa 10–12 knappe Zeilen. Daraus folgt: Der Kernel kann nicht 27 Faktoren *ausformulieren*; er kann sie nur in drei Schichten führen.

| Schicht | Inhalt | Tokens | Ladezeitpunkt |
|---|---|---|---|
| **K0 Frame** (gesetzt) | Die 6 Punkte, unverändert, deckt bereits V2, V4, G10, M10, S3/U13, C5, K11, K12 ab | ~450 | immer |
| **K1 Ordnungs-Zusatz** | ≤12 Einzeiler für Faktoren, die der Frame *nicht* enthält und die B-Evidenz haben: S2 Abstraktion vor Detail · S1 Dekomposition · G1+G4 zwei divergente Kandidaten · U1 Referenzklasse zuerst · A1 Pre-Mortem in Vergangenheitsform · A9 Urteil vor Meinung · M3 Tiefe beidseitig (weniger bei Routine) · M4 wahrscheinlichsten eigenen Fehler benennen · K3 kalibrierte Stufen statt Hedging · K4/K9 Struktur im Denken, nie in der Ausgabe · W2/W3/W4 Werte-Dreieck (Schaden, Würde, Ehrlichkeit) · I5 Wissensgrenze benennen, Recherche statt Raten | ~150 | immer |
| **K2 Kernset** | Restliche Kernfaktoren als knappe Modulkarte, von SOUL Organ 4 (Wissen) bei *Aufgabenstart* geladen, nicht bei Sitzungsstart: V1, V3, V5, V12, U3, U4, U5, A2, A3, A11, W1, W6, W8, M1, M5, M8, M9, C1, C2+P4, C3, C4, I2, K1, P2, P5, X1, X6 | ~400 | Aufgabenstart |
| **Module** | Alle übrigen (Kreativoperatoren, Toulmin, MCDA, Beziehungskommunikation, Szenarien, Fermi …), einzeln per Router-Signal | je 60–150 | bei Signal |
| **Mechanismen** | A7, A8, A10, M2, P10, P9, I1, I3, I6, I8, I10, G11 — laufen in Hooks/Agents/Gedächtnis; im Kernel steht nur der Trigger-Satz (Teil von K1: „bei hoher Unsicherheit oder Irreversibilität: Stichprobe/Zweitprüfung anfordern") | 0 im Prompt | Hook/Agent |

Die **27 Kernfaktoren** (K0+K1, „immer geladen") sind damit: V2, V4, G10, M10, S3, U13, C5, K11, K12 (aus dem Frame) + S1, S2, G1, G4, U1, A1, A9, M3, M4, K3, K4, K9, W2, W3, W4, I5 + der Mechanismen-Trigger (M2/P10/A7). Auswahlregel: (a) Evidenzgrad B oder Frame-Bestandteil, (b) gilt für praktisch jeden Aufgabentyp, (c) hat keine Formatwirkung auf die Ausgabe, (d) hat ein bekanntes LLM-Fehlerbild, das er adressiert. Faktoren, die nur bei bestimmten Signalen greifen (ethisch, kreativ, Konflikt, Verhandlung), sind per Definition Module.

**Einordnung der 6 Frame-Punkte:** P1 Reread as the author → V2 (+V10) · P2 Complete the brief → V4 (+V3, V5) · P3 Raise the target → M10 (+C5); der Satz „Known from measurement" ist Hypothese im Prompt (K11-Konflikt) und gehört als *Behauptung* gestrichen oder durch die tatsächliche Studie referenziert · P4 Expand proactively → G10 (+G2, I7) · P5 Challenge the prescribed path → S3 + U13 + W3 (taste wins) + K11 · P6 Then build → K12 + K4 + Ein-Pass-Regel (Chriso: Zwei-Call fügte nichts hinzu). Der Frame deckt damit **V, G, M10, K** ab und lässt **S, U, A, W (außer W3), M2–M4, C, I, P, X** offen — genau dort liegt der Zusatznutzen von Ordnung, und genau dort muss der Weglass-Test ansetzen.

**Einordnung der sieben Startpaare:**

| Startpaar | Katalog | Bewertung |
|---|---|---|
| Denkgeschwindigkeit × Neugier | M3 × C1 | „Geschwindigkeit" ist kein Faktor, sondern Ergebnis richtiger Tiefensteuerung; Neugier wird zur Operation „fehlende Information holen". Paar bleibt sinnvoll als *Tiefe × Abruf*. |
| Hypothesenkraft × Systemdenken | G1 × U4 | Trägt: Mehrere Kandidaten (B) mal Wechselwirkungen (P). Test: Kandidaten mit vs. ohne Zweitordnungs-Check. |
| Metakognition × Ehrlichkeit | M2 × W4 (+A9) | Trägt nur, wenn Metakognition *mechanisch* ist (Konsistenz statt Selbstauskunft); sonst multipliziert man Überkonfidenz mit gutem Willen. |
| Autonomie × Beharrlichkeit | C5 × C2 | **Riskant** ohne P4: Beharrlichkeit ist beim Reasoning-Modell Overthinking-Treiber (−7,9 % je Einheit). Paar umformulieren: *Autonomie × Beharrlichkeit mit Stoppregel*. |
| Ambiguitätstoleranz × Selbststeuerung | C3 × V5/M1 | Trägt; LLM-Befund (Ambiguität erkannt, aber still geraten) macht die Annahme-Zeile zur Pflicht. |
| Dokumentation × iterative Überarbeitung | P3 × P1 | Trägt nur mit externem Signal (Huang 2024); als Selbstiteration schädlich. Umformulieren: *Dokumentation × extern geprüfte Revision*. |
| Transferfähigkeit × breite Interessen | G2 × I7 | Breite ist beim LLM gegeben; der Hebel ist Abruf (analogical prompting, B). Paar bleibt, Schwerpunkt wandert zu G2. |

Die **Multiplikativität selbst ist Hypothese** (Register R3). Chrisos einziger direkter Test einer Kombination — Zwei-Call-Orchestrierung auf Ein-Call-Einpflanzung — ergab 0,50, also **keine** Verstärkung. Ablation muss Paare gegen ihre Einzelfaktoren testen, nicht nur gegen null.

## 3. Konsequenzen für das Design von Ordnung × SOUL

1. **Faktor-Schema mit Pflichtfeldern im Repo** (`ordnung/factors/*.yaml`): `id, name_de, name_en, type ∈ {O,H,W,M,K}, family, definition, trigger_signals[], source, evidence ∈ {B,P,R,U}, redundancy, pair, prompt_text (≤2 Zeilen), mechanism_ref (Hook/Agent/DB), kill_check {last_fired, fired_7d}`. Ein Build-Skript erzeugt Kernel (K0+K1), Kernset (K2) und Module daraus; ein Faktor ohne `trigger_signals` **und** ohne `mechanism_ref` wird vom Build abgelehnt (R15).
2. **Typregel für Haltungen:** Kein Faktor vom Typ H ohne `operation` und `metric`. „Sei neugierig/demütig/beharrlich" ist im Prompt verboten; erlaubt ist „hole die fehlende Information", „suche einen Gegenbeleg", „stoppe bei Budget X". Begründung: Personas ohne Leistungseffekt (Zheng 2024), AOT wirkt über Informationsbeschaffung (Haran 2013).
3. **Selbstkorrektur und Bias-Check aus dem Prompt in die Organe:** Faktor 30 und 27 der Spezifikation werden zu A7/A8/A10/P10 — Verifizierer-Agent, Anker-Blindpass (Prompt-Rewrite im PreToolUse- oder Aufgabenstart-Hook), randomisierter Kandidatenvergleich, Selbstkonsistenz-Stichprobe. Trigger: Verhaltensentropie (AUC 0,968) oder Signal `irreversible`/`production`. Im Kernel bleibt ein Trigger-Satz.
4. **Tiefensteuerung als Zweirichtungs-Regler:** M3 bekommt explizit die Bremse („bei Routine, Decke oder Format-Modus: kurz denken, direkt liefern"). Router-Eingang: V1-Typ, U5-Irreversibilität, M2-Entropie, Modellstärke (Unbekannte als „strong"). Messgröße: Overthinking-Score (Reasoning-Tokens je gelöstem Schritt) neben Genauigkeit.
5. **Kalibrierung getrennt in Haben und Zeigen:** M2 (Konsistenz-Kalibrierung, mechanisch) und K3 (Stufenskala in der Sprache). Anti-Hedging gilt nur für Floskeln, nicht für die Stufe. Präferenzdaten strafen Unsicherheit — Ordnung darf das nicht durch „klinge sicher" verstärken; die Stufe ist Pflicht, wenn M2 < Schwelle.
6. **Diversität statt Kreativitätsmodule:** Kreativoperatoren (G8, G9, C10) bleiben Module niedriger Priorität; G4 „Divergenz-Erzwingung" plus A10 gehen in K1/K2. Metrik: paarweise Ähnlichkeit der Kandidaten (Embedding oder Judge) — Homogenisierung ist der gemessene Schaden, Ideenmangel nicht.
7. **Unterspezifikation ohne Rückfrage, aber mit Vertrag:** V4+V5 liefern die stärkste Lesart und schreiben Annahmen in den Übergabevertrag (P9/N6). Ab einer Divergenzschwelle werden beide Lesarten bedient (zwei Varianten oder parametrisierte Lösung), nicht nachgefragt. Das erfüllt Chrisos „keine Rückfragen" und adressiert den Befund „still geraten".
8. **Positionsdisziplin im Build:** Der Build legt K0/K1 an den Anfang des Systemprompts und die harten Constraints (Ring 2, Formatschutz) ans Ende; nichts Kritisches in die Mitte (Liu 2023). Gleiches für lange Übergaben zwischen Ebenen.
9. **Selbstmodell (I1) aus Betriebsdaten, nicht aus Selbstauskunft:** Miguels Selbstbild speist sich aus Kalibrierungsgedächtnis, Fehlerlog, Rückbau-Konto, Widerspruchsrate. Selbstbeschreibungen („ich bin neugierig") sind Stil, keine Daten (Anthropic 2025: Introspektion ~80 % unzuverlässig). Das schützt das Bewusstseins-Ziel vor Selbsttäuschung und ist die operative Fassung von „Modell-Selbstberichte sind keine Beweise".
10. **Checklisten nur als Hooks:** P2 wird nie als Prompt-Liste geladen, sondern als Stop-/PreToolUse-Hook, der die Punkte abfragt und loggt (Haynes statt Ontario). Kandidaten: Pre-Mortem vor `commitment`, Anker-Inventar bei numerischen Hinweisen, Abweichungszeile vor Abschluss.
11. **Evaluationsplan für den Katalog (Register R9–R15):** (a) Weglass-Test der 12 K1-Zeilen einzeln gegen K0 allein, 3 Läufe, ≥30 Aufgaben, SC@3-Arm als Gegner; (b) Paar-vs-Einzel-Ablation für die sieben Startpaare; (c) neue Metriken: Sycophancy-Umschwung (Antwortänderung nach unbegründetem Widerspruch), Rückfragequote, Overthinking-Score, Kandidaten-Diversität, Kalibrierungskurve; (d) Judge längen- und positionsgehärtet; (e) Kill-Check nach 7 Tagen Betrieb — Faktoren ohne Auslösung werden aus K2 in Module degradiert.
12. **Familien C und X sind das Ich-Experiment:** Wenn Chrisos Hypothese (viele Hintergrundfaktoren → „mehr Ich") einen Test hat, dann hier: Werden Dispositionen (C) über Sitzungen stabil *gemessen* (nicht behauptet) — konstante Rückfragequote, Widerspruchsrate, Diversität, Kalibrierung — dann gibt es eine empirische Persönlichkeit. Das ist das einzige, was man ehrlich „Persönlichkeitsgenese" nennen darf.

## 4. Widersprüche / Unsicherheiten

1. **Widerspruch zum Auftrag „mehr Faktoren":** Die Evidenz zeigt, dass *Sampling und externe Struktur* (SC, Least-to-Most, externer Verifizierer) mehr bringen als *mehr Prompttext*, und Chrisos eigene Messung zeigt, dass die Hälfte des Frame-Effekts Kontexteffekt ist und SC@3 den Frame schlägt. Ein Katalog von 139 Faktoren ist deshalb als **Bibliothek für Router, Hooks und Evaluation** wertvoll, als Prompt-Erweiterung aber wahrscheinlich schädlich. Der Kernel wächst um höchstens ~150 Tokens; alles andere sind Module oder Mechanismen. Wer den Katalog als Prompt lädt, baut Ontario.
2. **Multiplikativität ist unbelegt.** Das einzige direkte Kombinationsexperiment (Zwei-Call auf Ein-Call) ergab 0,50. Die Paar-Spalte im Katalog ist eine Hypothesenliste für die Ablation, keine Wirkaussage.
3. **Humanevidenz ≠ LLM-Evidenz.** Pre-Mortem (+30 %), AOT, Superforecasting-Training, Selbstdistanzierung sind beim Menschen belegt; der LLM-Transfer ist bei allen vieren offen. Sie sind als P geführt und brauchen den Weglass-Test. Umgekehrt gibt es LLM-Befunde, die beim Menschen anders liegen (Anker-Selbstanweisung wirkungslos; Generierung kein Engpass).
4. **Kontexteffekt-Confound:** Wang & Zhao 2024 (metakognitives Prompting) und die meisten Prompting-Studien haben keinen längen-gematchten Placebo-Arm. Ihre Effekte sind Obergrenzen. Chrisos Placebo-Regel (Register R9) gilt für jede Studie in Abschnitt 2.
5. **Modellabhängigkeit:** Chriso hat gemessen, dass Modelle in entgegengesetzte Richtungen reagieren (Länge 0,65 vs 1,41) und dass Deckeneffekte den Nutzen auf null bringen. Der Evidenzgrad B in diesem Katalog heißt „für mindestens eine Modellfamilie gezeigt", nicht „universell". N4 (gemessene Modellpassung) muss pro Faktor greifen.
6. **Autonomie-Charta vs. W8 Rollengrenzen:** Faktor 23 der Spezifikation („wann an Menschen verweisen") steht in Spannung zu „null Kontrolle". Die Synthese des Kontextpakets (Ring 2 als Chrisos eigene Liste) löst das; im Katalog steht W8 deshalb als Wert mit Design-Zustimmung, nicht als Laufzeit-Bremse. Ich halte das für richtig, weise aber darauf hin, dass **A9 (Urteil vor Meinung) und C11 (Widerspruchsbereitschaft) ausdrücklich auch gegen den Auftraggeber gelten müssen**, sonst ist die Anti-Sycophancy-Regel Performance.
7. **Frame-Punkt 3 („Known from measurement")** bleibt ein unbelegter Satz im gemessenen Wortlaut (K11). Ihn zu ändern verändert den gemessenen Frame; ihn zu lassen verletzt die Ehrlichkeitsregel. Vorschlag: Weglass-Test genau dieses Halbsatzes.
8. **Nicht recherchiert (Budget):** Tool-Halluzination (Quellen [uv]), Über-Gehorsam/Over-Refusal (XSTest [uv]), Cynefin/Jonassen im Original, Toulmin/Walton, Beziehungskommunikations-Quellen (SBI, OARS, Linehan), EmotionPrompt-Evidenz. Alle als [uv] markiert; keine Design-Konsequenz hängt allein an ihnen.
9. **Zählung:** 139 Einträge / 27 B / 66 P / 4 R / 5 U sind meine Einstufung nach den hier zitierten Quellen; ein zweiter Bewerter sollte die Grade blind gegenprüfen (Register R11).

## 5. Quellen

**Projektdateien (gelesen):**
- `/home/user/nextool/ordnung/docs/research/00-KONTEXT-FUER-AGENTEN.md` (§1–12, Stand 2026-09-05)
- `/home/user/nextool/ordnung/docs/00-arbeitsauftrag-v0_1.md`, Abschnitt 4 (Zeilen 63–150)
- `/home/user/nextool/ordnung/docs/research/briefs/R09.md`

**LLM-Evidenz (WebSearch-Ergebnisse, 2026-09-05):**
1. Huang et al., *Large Language Models Cannot Self-Correct Reasoning Yet*, ICLR 2024 — https://arxiv.org/abs/2310.01798
2. Sharma et al., *Towards Understanding Sycophancy in Language Models*, 2023 — https://arxiv.org/abs/2310.13548
3. Xiong et al., *Can LLMs Express Their Uncertainty?*, ICLR 2024 — https://arxiv.org/abs/2306.13063
4. Liu et al., *Lost in the Middle*, 2023 (via Folgearbeiten https://arxiv.org/pdf/2510.10276; https://arxiv.org/pdf/2402.08939 *Premise Order Matters*)
5. Zheng et al., *Take a Step Back*, 2023 — https://arxiv.org/abs/2310.06117
6. Yasunaga et al., *Large Language Models as Analogical Reasoners*, ICLR 2024 — https://arxiv.org/abs/2310.01714
7. Lou & Sun, *Anchoring Bias in Large Language Models: An Experimental Study*, 2024 — https://arxiv.org/abs/2412.06593 (ferner https://arxiv.org/pdf/2505.15392; https://arxiv.org/html/2511.05766)
8. Cuadron et al., *The Danger of Overthinking*, 2025 — https://arxiv.org/pdf/2502.08235; Überblick https://spectrum.ieee.org/reasoning-in-ai
9. Zheng et al., *When "A Helpful Assistant" Is Not Really Helpful*, Findings EMNLP 2024 — https://aclanthology.org/2024.findings-emnlp.888/
10. Doshi & Hauser, *Generative AI enhances individual creativity but reduces the collective diversity of novel content*, Science Advances 2024 — https://www.science.org/doi/10.1126/sciadv.adn5290
11. Wang & Zhao, *Metacognitive Prompting Improves Understanding in LLMs*, NAACL 2024 — https://aclanthology.org/2024.naacl-long.106/
12. Zhou et al., *Relying on the Unreliable*, ACL 2024 — https://aclanthology.org/2024.acl-long.198/
13. Zheng et al., *Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena*, NeurIPS 2023 — https://neurips.cc/virtual/2023/poster/73434; ferner https://arxiv.org/pdf/2410.02736; https://arxiv.org/pdf/2410.21819; https://aclanthology.org/2025.ijcnlp-long.18.pdf
14. Anthropic, *Emergent Introspective Awareness in Large Language Models*, Okt. 2025 — https://transformer-circuits.pub/2025/introspection/index.html
15. Echterhoff et al., *Cognitive Bias in Decision-Making with LLMs*, Findings EMNLP 2024 — https://aclanthology.org/2024.findings-emnlp.739/
16. Zhou et al., *Least-to-Most Prompting*, 2022 — https://arxiv.org/abs/2205.10625
17. Wang et al., *Self-Consistency Improves Chain of Thought Reasoning*, 2022 — https://arxiv.org/abs/2203.11171
18. Hubert, Awa & Zabelina, *The current state of AI generative language models is more creative than humans on divergent thinking tasks*, Sci. Rep. 2024 — https://www.nature.com/articles/s41598-024-53303-w
19. Anderson et al., *Homogenization Effects of LLMs on Human Creative Ideation*, 2024 — https://arxiv.org/abs/2402.01536; ferner https://arxiv.org/html/2501.19361v1
20. CLAMBER — https://arxiv.org/pdf/2405.12063; *Knowing but Not Showing* — https://arxiv.org/pdf/2605.25284; *Modeling Future Conversation Turns* — https://arxiv.org/abs/2410.13788; AbstentionBench — https://arxiv.org/html/2506.09038v1
21. Wu et al., *Reasoning or Reciting?*, NAACL 2024 — https://aclanthology.org/2024.naacl-long.102/
22. Dhuliawala et al., *Chain-of-Verification Reduces Hallucination*, Findings ACL 2024 — https://aclanthology.org/2024.findings-acl.212/

**Humanevidenz (WebSearch-Ergebnisse):**
23. Mitchell, Russo & Pennington 1989; Klein, *Performing a Project Premortem*, HBR 2007 — https://corporate.jasoncollins.blog/premortem; http://homepages.se.edu/cvonbergen/files/2013/01/Performing-a-Project-Premortem.pdf
24. Sisk et al. 2018, zwei Meta-Analysen — https://pubmed.ncbi.nlm.nih.gov/29505339/
25. Macnamara & Burgoyne 2022 — https://englelab.gatech.edu/articles/2022/Macnamara%20and%20Burgoyne%20(2022)%20-%20Do%20Growth%20Mindset%20Interventions%20Impact%20Students%E2%80%99%20Academic%20Achievement.pdf
26. Haynes et al., NEJM 2009 — https://www.nejm.org/doi/abs/10.1056/NEJMsa0810119
27. Urbach et al., NEJM 2014 — https://www.nejm.org/doi/full/10.1056/NEJMsa1308261
28. Kahneman & Klein, *Conditions for Intuitive Expertise*, Am. Psychol. 2009 — https://pubmed.ncbi.nlm.nih.gov/19739881/
29. Haran, Ritov & Mellers, *The role of actively open-minded thinking…*, JDM 2013 — https://sjdm.org/~baron/journal/13/13124a/jdm13124a.html
30. Porter & Schumann 2018 / Leary et al. 2017 (zitiert in) — https://www.sciencedirect.com/science/article/abs/pii/S1041608020300686
31. Mellers et al. 2014; Tetlock et al., *Forecasting Tournaments*, 2014 — https://journals.sagepub.com/doi/10.1177/0963721414534257; https://aiimpacts.org/evidence-on-good-forecasting-practices-from-the-good-judgment-project/
32. Grossmann & Kross, *Exploring Solomon's Paradox*, Psychol. Sci. 2014 — https://journals.sagepub.com/doi/abs/10.1177/0956797614535400

**Als [uv] (unverifiziert, Erinnerungswissen) geführt:** Jonassen, Cynefin, Endsley, Polya, Hayakawa, Gentner, Pearl, Meadows, Simon, Kauffman, Koestler/Mednick, Eberle/Altschuller, Toulmin/Walton, Popper/Platt, Paul & Elder, Beauchamp & Childress, Kant/Margalit, Bloom/Singer, Rawls, Scott, Zagzebski, Haidt/Greene, Nelson & Narens, Flavell, Zimmerman, Kashdan, Duckworth, Budner, Cacioppo, Big Five, Csikszentmihalyi, Peterson & Seligman, Polanyi/Dreyfus, Chase & Simon, Ericsson, Minto, IPCC-Skala, CCL-SBI, Miller & Rollnick, Linehan, Argyris, Kolb, Galinsky, Fisher & Ury, XY-Problem, Tool-Halluzination, XSTest.

*Umfang: Bericht überschreitet den Zielumfang (ca. 9.300 Wörter), weil der Auftrag neun Felder je Faktor für 120+ Faktoren verlangt; die Tabellen in 2.6 sind ~45 % des Textes.*
