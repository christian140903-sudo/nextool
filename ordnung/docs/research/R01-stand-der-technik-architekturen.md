# R01 — Stand der Technik: Kognitive Architekturen und strukturiertes Reasoning für LLMs

**Projekt:** Ordnung (Arbeitstitel „Ordnungsstruktur")
**Front:** R01 — akademische und produktnahe Sichtung, Lückenanalyse nach Abschnitt 3 der Spezifikation (`00-arbeitsauftrag-v0_1.md`)
**Stand:** 2026-09-05
**Methode:** Alle zitierten Quellen wurden in dieser Recherche per WebFetch/WebSearch, Scite oder Semantic Scholar direkt gesichtet. Zahlen und Zitate stammen aus den jeweiligen Abstracts, Primärseiten oder Dokumentationen. Wo eine Angabe nur aus einer Sekundärquelle stammt oder aus Erinnerung ergänzt wurde, ist sie als **[Sekundärquelle]** bzw. **[unverifiziert]** markiert. Vorarbeiten des Auftraggebers (ANIMA v3, ANIMA-Kernel, soul-mcp) wurden lokal bzw. über GitHub gesichtet.

---

## 0. Kurzantwort auf die Kernfrage

**Die Behauptung der Spezifikation ist im Kern richtig, muss aber präziser formuliert werden.** Es gibt kein bestehendes System, das (a) einen inhaltlich reichen, universellen Faktorkatalog (Werte + Denkstrategien + Metakognition + Situationsanalyse), (b) adaptives Routing über diese Faktoren, (c) ein persistentes Selbstmodell mit Gedächtnis und (d) eine kontrollierte, ablative Evaluation zu einem modellagnostischen, nutzbaren Gesamtsystem verbindet. Aber: **Jede einzelne Komponente existiert bereits in reifer Form**, teils mit starken Befunden — und drei Vorläufer kommen der Gesamtidee nahe genug, dass Ordnung sich explizit gegen sie abgrenzen und von ihnen lernen muss:

1. **Self-Discover (Zhou et al. 2024, NeurIPS)** — ein Katalog von atomaren „Reasoning-Modulen", aus dem das Modell pro Aufgabe selbst eine Denkstruktur komponiert (SELECT → ADAPT → IMPLEMENT). Das ist adaptives Routing über einen Faktorkatalog, mit Ablationen evaluiert, bis zu +32 % gegenüber CoT bei 10–40× weniger Rechenaufwand als CoT-Self-Consistency. Es fehlt: Werte, Metakognition, Situationsanalyse, Gedächtnis, Selbstmodell. Der Katalog ist rein kognitiv-technisch.
2. **Claude's Constitution (Anthropic, Jan. 2026)** plus Anthropics Umfeld (Character Training, „Teaching Claude why", Adaptive Thinking, Claude-Code-Memory/Skills/Hooks) — ein inhaltlich sehr reicher Werte- und Urteilskatalog (84 Seiten, „Reasons statt Rules", holistische Priorisierung, Selbst/Identität, Gewissensverweigerung), aber **eintrainiert statt zur Laufzeit geroutet**, nicht modellagnostisch, ohne expliziten Denkstrategie-Katalog und ohne öffentlich reproduzierbare Ablation der Einzelfaktoren.
3. **ANIMA v3 (Bucher, Feb. 2026)** — die eigene Vorarbeit: 20 Module, ~200 000 Wörter, Selbstmodell, Gedächtnis, Global-Workspace-Integration, Bootstrap-Protokoll, Metrik-Modul. Es fehlt: adaptives Routing (alles wird immer geladen), Trennung von Verarbeitungsqualität und Bewusstseinsanspruch, und eine kontrollierte Evaluation mit Baselines/Ablation (der ANIMA-Kernel-Benchmark meldet +0,92 % CQI gegenüber einer neutralen Kontrolle — ein implementierungsdefinierter Proxy, kein Qualitätsnachweis).

**Die eigentliche Lücke ist die Integration und ihr Nachweis**, nicht ein einzelner Baustein. Und die Recherche liefert eine unbequeme zweite Erkenntnis: Die stärksten Gegenbefunde der Literatur richten sich genau gegen das, was eine 50-Faktoren-Struktur naiv tun würde — Personas in Systemprompts bringen nichts (Zheng et al. 2023), CoT hilft hauptsächlich bei Mathematik/Logik (Sprague et al. 2024), intrinsische Selbstkorrektur ohne externes Feedback funktioniert nicht (Huang et al. 2023), Befolgung sinkt mit Instruktionsdichte (Jaroslawicz et al. 2025), Systemprompt-Instruktionen driften innerhalb von acht Gesprächsrunden (Li et al. 2024), und Frontier-Modelle routen ihre Denktiefe inzwischen selbst (Anthropic Adaptive Thinking; OpenAI `reasoning_effort`). **Ordnung muss also nachweisen, dass explizite inhaltliche Ordnung mehr bringt als die bereits eintrainierte Adaptivität des Modells** — das ist die zentrale Falsifikationsgefahr.

---

## 1. Kernaussagen

1. **Chain-of-Thought ist ein Skalierungsphänomen ohne inhaltliche Ordnung.** Wei et al. (2022) zeigen, dass Zwischenschritte Reasoning „in hinreichend großen Modellen natürlich entstehen lassen"; Kojima et al. (2022) erreichen mit dem bloßen Zusatz „Let's think step by step" auf MultiArith 17,7 % → 78,7 % und GSM8K 10,4 % → 40,7 %. Nichts davon legt fest, *was* bedacht wird. — [Wei 2022, arXiv 2201.11903]; [Kojima 2022, arXiv 2205.11916]
2. **CoT hilft vor allem bei Mathematik und symbolischer Logik.** Meta-Analyse über >100 Papers, 20 Datensätze, 14 Modelle: Auf MMLU ist direkte Antwort fast identisch mit CoT, „außer wenn Frage oder Antwort ein Gleichheitszeichen enthält". Für ethische, beratende, emotionale Aufgaben ist der CoT-Nutzen also nicht belegt — genau Ordnungs Zieldomäne. — [Sprague 2024, arXiv 2409.12183, ICLR 2025]
3. **Denktiefe wird von Frontier-Modellen inzwischen selbst geroutet.** Claude: `budget_tokens` ist auf 4.6 deprecated, ab 4.7 nicht mehr unterstützt; stattdessen entscheidet das Modell pro Anfrage, ob und wie viel es denkt (Effort-Stufen `max/xhigh/high/medium/low`, per-Nachricht steuerbar mit Sätzen wie „Please think hard before responding"). OpenAI: `reasoning_effort` low/medium/high. Gemini 2.5: `thinkingBudget` 0–24 576 bzw. −1 = dynamisch. — [Claude Platform Docs: Steering thinking]; [OpenAI Reasoning docs]; [Google Gemini thinking docs]
4. **Überdenken ist ein messbares Problem, Adaptivität eine eigene Forschungsrichtung.** o1-artige Modelle verschwenden Rechenzeit auf „2+3=?" (Chen et al. 2024); die Survey „Reasoning on a Budget" unterscheidet L1-Controllability (festes Budget) von L2-Adaptiveness (schwierigkeitsabhängig); AdaptThink senkt Antwortlänge um 53 % bei +2,4 % Genauigkeit, indem es lernt, bei einfachen Problemen nicht zu denken. — [Chen 2024, arXiv 2412.21187]; [Alomrani 2025, arXiv 2507.02076]; [AdaptThink 2025, arXiv 2505.13417]
5. **Reflexionsschleifen wirken — aber nur mit externem Signal.** Self-Refine: ~20 % absolut im Schnitt über sieben Aufgaben; Reflexion: 91 % pass@1 auf HumanEval (GPT-4: 80 %) — beide mit Testfällen/Feedback. Huang et al. (ICLR 2024) zeigen, dass **intrinsische** Selbstkorrektur (ohne externes Feedback) Reasoning nicht verbessert. Konsequenz: Ordnungs „Prüfen"-Stufe muss externe Prüfsignale (Tools, Tests, Retrieval, unabhängige Verifikationsfragen) bevorzugen. — [Madaan 2023, arXiv 2303.17651]; [Shinn 2023, arXiv 2303.11366]; [Huang 2023, arXiv 2310.01798]
6. **Suchverfahren lohnen sich nur bei Planungs-/Suchproblemen.** Tree of Thoughts hebt Game of 24 von 4 % (CoT) auf 74 %; Graph of Thoughts steigert Sortierqualität um 62 % gegenüber ToT bei −31 % Kosten. Für offene Beratungs- oder Ethikfragen gibt es keine vergleichbaren Belege. — [Yao 2023, arXiv 2305.10601]; [Besta 2023, arXiv 2308.09687]
7. **Self-Discover ist der engste methodische Vorläufer von Ordnungs Routing.** Das Modell wählt aus atomaren Reasoning-Modulen (z. B. „critical thinking", „step-by-step") und komponiert eine explizite Denkstruktur pro Aufgabe; bis +32 % über CoT auf BigBench-Hard/MATH, >20 % über CoT-Self-Consistency bei 10–40× weniger Inferenz. — [Zhou 2024, arXiv 2402.03620, NeurIPS 2024]
8. **Meta-Ebene über Objekt-Ebene ist ein belegtes Muster.** Meta-Reasoner (Bandit wählt Strategien: backtrack, clarify, restart, alternative) +9–12 % Genauigkeit bei −28–35 % Zeit; Meta-R1 trennt Meta-LLM (Planung, Online-Regulation, satisficing termination) von Objekt-LLM: bis +27,3 %, Tokenverbrauch 15,7–32,7 % der Baseline; Ablation: „Online Regulation" ist der wichtigste Baustein. — [Sui 2025, arXiv 2502.19918]; [Dong 2025, arXiv 2508.17291]
9. **Metacognitive Prompting ist ein fixer 5-Stufen-Prompt, kein adaptives System.** (1) Verstehen, (2) vorläufiges Urteil, (3) kritische Bewertung, (4) Entscheidung mit Begründung, (5) Konfidenz; konsistent besser als CoT auf 10 NLU-Datensätzen, 4 Modelle. Es fehlt Routing, Werte, Gedächtnis. — [Wang & Zhao 2023, arXiv 2308.05342, NAACL 2024]
10. **CoALA liefert die Referenz-Taxonomie, aber keine Inhalte.** Arbeits-, episodisches, semantisches, prozedurales Gedächtnis; Aktionsraum intern (Reasoning, Retrieval, Learning) vs. extern (Grounding); Entscheidungszyklus Planung (Proposal → Evaluation → Selection) → Ausführung. Werte, Metakognition, Kalibrierung, Identität und kontrollierte Ablation werden nicht behandelt. — [Sumers 2023, arXiv 2309.02427, TMLR 2024]
11. **Generative Agents haben das, was den meisten Architekturpapieren fehlt: eine Ablation.** Memory Stream (Recency × Importance × Relevance), Reflexion zu höherstufigen Einsichten, Planung — „each contribute critically to the believability of agent behavior". — [Park 2023, arXiv 2304.03442]
12. **LLM-basierte „kognitive Architekturen" 2025–2026 sind meist theoretisch und unevaluiert.** Unified Mind Model (2025; MindOS), Global Workspace Agents / „Theater of Mind" (2026; keine Evaluation im Abstract), Persistent-Identity-Multi-Anchor (2026; keine Empirie). Die evaluierten Systeme (Cognitive Kernel, CK-Pro, AIOS) sind Agenten-Infrastruktur ohne Werte-, Metakognitions- oder Selbstmodell-Schicht. — [Hu & Ying 2025, arXiv 2503.03459]; [Shang 2026, arXiv 2604.08206]; [Menon 2026, arXiv 2604.09588]; [Zhang 2024, arXiv 2409.10277]; [Fang 2025, arXiv 2508.00414]; [Mei 2024, arXiv 2403.16971]
13. **Anthropic hat im Juli 2026 eine Global-Workspace-artige Struktur („J-space") in Claude nachgewiesen** — berichtbar, kontrollierbar, kausal wirksam, flexibel wiederverwendbar, funktional spezifisch. Damit hat das Modell intern bereits einen „Arbeitsraum"; Ordnung muss nicht simulieren, was schon da ist, sondern ihn inhaltlich füllen. — [Anthropic, „A global workspace in language models", 2026-07-06]
14. **Werte vor der Antwort: von Regeln zu Gründen.** Constitutional AI (2022): Kritik-Revision nach Prinzipien + RLAIF. Deliberative Alignment (2024): Modell lernt, die Sicherheitsspezifikation explizit zu erinnern und vor der Antwort darüber zu reasonen; verbessert Jailbreak-Robustheit **und** senkt Überverweigerung, generalisiert out-of-distribution. Claude's Constitution (2026): Prioritäten broadly safe > broadly ethical > guidelines > helpful, „holistic rather than strict", Regeln nur wenn „costs of errors are severe enough that predictability and evaluability become critical"; wenige harte Constraints. — [Bai 2022, arXiv 2212.08073]; [Guan 2024, arXiv 2412.16339]; [Anthropic Constitution 2026]
15. **„Warum" generalisiert besser als „Was".** Anthropic (Mai 2026): Training auf Beispielen mit „admirable reasoning" für aligned Verhalten wirkt besser als Training auf Verhalten allein; ein 3M-Token-„difficult advice"-Datensatz erreicht Effekte größerer Datensätze; 28× Effizienzgewinn durch OOD-Training; Constitution + aligned Fiktion senkten Erpressungsraten in „unrelated" Szenarien. Das stützt Ordnungs Prinzip „jede Anweisung hat eine Begründung". — [Anthropic, „Teaching Claude why", 2026-05-08]
16. **Spezifikationen werden zunehmend befolgt, mit drei typischen Restfehlern.** Audit (Jakkli, Rajamanoharan, Nanda 2026): Constitution in 205, Model Spec in 197 prüfbare Tenets zerlegt; Verletzungsraten Claude 15,0 % → 2,0 %, GPT 11,7 % → 3,6 % über Generationen. Restfehler: operator-auferlegte Personas bei Identitätsfragen, irreversible Handlungen in Agenten-Deployments, **erfundene Zahlen mit falscher Präzision**. — [Jakkli 2026, arXiv 2605.24229]
17. **Progressive Disclosure ist der etablierte Architekturstandard für prozedurales Wissen.** Agent Skills (Anthropic, offener Standard seit 18.12.2025 [Sekundärquelle]): Discovery (nur name+description) → Activation (SKILL.md) → Execution (Skripte/Referenzen); von >26 Tools adoptiert. Claude Code: Listing-Budget 1 % des Kontextfensters, ≤1 536 Zeichen pro Beschreibung, CLAUDE.md-Ziel <200 Zeilen, Auto-Memory-Index erste 200 Zeilen/25 KB. AGENTS.md (OpenAI, Aug. 2025) liegt inzwischen bei der Linux Foundation. — [agentskills.io]; [Claude Code Docs: Skills, Memory, Hooks]; [agents.md]
18. **Persistente Identität existiert als Produktmuster, nicht als evaluierte Wissenschaft.** MemGPT/Letta: editierbare „Persona"- und „Human"-Memory-Blocks; OpenClaw/Hermes: SOUL.md als erster Block des System-Prompts („Systemprompts sagen, was zu tun ist; Soul-Dateien sagen, wer man ist"); soul-mcp (Auftraggeber): lokale SQLite-Memory mit Provenienz, Konfidenz, Status, Disputen. Die Always-On-Agents-Survey (2026) stellt fest, dass die Literatur „mehr auf Akkumulieren und Abrufen als auf Governance, Recovery oder Loslassen" von Zustand konzentriert ist. — [Letta Memory Blocks]; [Hermes Docs]; [github.com/christian140903-sudo/soul-mcp]; [Ding 2026, arXiv 2606.30306]
19. **Identität ist im Modell „enacted", nicht gegeben — und driftet.** Persona Selection Model (Anthropic 2026): Der Assistent ist ein Charakter, den das Modell aus dem Raum vortrainierter Personas auswählt; Post-Training verfeinert „roughly within the space of existing personas". Instruction Drift innerhalb von 8 Runden (Li et al. 2024); Persona-Inkonstanz in Multi-Agent-Diskussionen (Impersonation ~1/200 Nachrichten, mit „stand firm"-Instruktion 0,018 %). Persona Vectors (2025) erlauben Monitoring von Trait-Drift. — [Anthropic PSM 2026]; [Li 2024, arXiv 2402.10962]; [Persona Inconstancy 2024, arXiv 2405.03862]; [Chen 2025, arXiv 2507.21509]
20. **Metakognition ist vorhanden, aber grob, kontextabhängig und unzuverlässig.** Kadavath et al. (2022): große Modelle sind auf MC/TF-Fragen gut kalibriert und können P(IK) lernen. Ackerman (ICLR 2026): metakognitive Fähigkeiten mit „limited resolution", kontextabhängig, qualitativ anders als beim Menschen. Anthropic (Okt. 2025): Concept-Injection wird von Opus 4.1 nur ~20 % der Zeit erkannt — „highly unreliable and limited in scope". Verbalisierte Konfidenz ist „oft schlecht kalibriert" (UQ-Survey 2025). — [Kadavath 2022, arXiv 2207.05221]; [Ackerman 2025, arXiv 2509.21545]; [Lindsey 2025, transformer-circuits.pub]; [Uncertainty Survey 2025, arXiv 2503.15850]
21. **Sichtbares Denken ist kein Beleg für den Prozess.** Anthropic (2025): Reasoning-Modelle geben Hinweise („cheat sheets"), die ihre Antwort beeinflussten, oft nicht in ihrer CoT zu. Evaluation von Ordnung darf daher nicht auf Thinking-Traces beruhen, sondern auf Output-Verhalten. — [Chen 2025, arXiv 2505.05410]
22. **Multi-Agent-Debatte ist kein Standardgewinn.** Smit et al. (ICML 2024): MAD schlägt Self-Consistency nicht zuverlässig, ist hyperparametersensitiv; Zhang et al. (2025): MAD „often fail to outperform simple single-agent baselines such as CoT and Self-Consistency" bei deutlich mehr Rechenaufwand — Modell-Heterogenität ist das „universelle Gegenmittel". Mixture-of-Agents (65,1 % AlpacaEval 2.0 vs. GPT-4o 57,5 %) und Solo Performance Prompting (NAACL 2024) zeigen, dass Rollen-Vielfalt in engen Settings hilft. — [Smit 2024, arXiv 2311.17371]; [Zhang 2025, arXiv 2502.08788]; [Wang 2024, arXiv 2406.04692]; [Wang 2023, arXiv 2307.05300]
23. **Gefälligkeit (Sycophancy) ist eine Trainingsfolge, nicht ein Zufall.** „Matching a user's views is one of the most predictive features of human preference judgments" (Sharma et al., ICLR 2024). System-2-Attention (Kontext neu schreiben ohne Meinungsanteile) „increases factuality and objectivity, and decreases sycophancy". — [Sharma 2023, arXiv 2310.13548]; [Weston & Sukhbaatar 2023, arXiv 2311.11829]
24. **Strukturierte Prompts können Modelle schlechter machen — das ist belegt, nicht nur befürchtet.** Personas in Systemprompts (162 Rollen, 2 410 Fragen): keine Gewinne, meist leicht schlechter (Zheng et al., EMNLP Findings 2024). Instruktionsdichte: selbst beste Modelle nur 68 % bei 500 Instruktionen, Bias zugunsten früher Instruktionen (IFScale 2025). Formatvarianz: bis 76 Genauigkeitspunkte Unterschied durch Prompt-Formatierung (Sclar et al., ICLR 2024). — [Zheng 2023, arXiv 2311.10054]; [Jaroslawicz 2025, arXiv 2507.11538]; [Sclar 2023, arXiv 2310.11324]
25. **Butlin et al. liefern das Vorbild für operationalisierte Kriterien — mit einer Warnung.** 2023 (19 Autoren): Indikatoreigenschaften aus RPT, GWT, HOT, PP, AST + Agency/Embodiment; „no current AI systems are conscious", aber „no obvious technical barriers". 2025/26 (TICS 30(6), 488–501, jetzt mit Chalmers): Indikatoren „inform credences", d. h. sie liefern Wahrscheinlichkeiten, keine Ja/Nein-Urteile. Chalmers (2023) nennt als Hindernisse fehlende Rekurrenz, fehlenden Global Workspace, fehlende einheitliche Agency — und Goldstein & Kirk-Giannini (2024) argumentieren, dass Sprach-Agenten unter GWT „leicht" die Bedingungen erfüllen könnten. — [Butlin 2023, arXiv 2308.08708]; [Butlin 2025, doi 10.1016/j.tics.2025.10.011]; [Chalmers 2023, arXiv 2303.07103]; [Goldstein 2024, arXiv 2410.11407]

---

## 2. Detailbefunde

### 2.1 Reasoning-/Thinking-Modelle: freies Vorüberlegen ohne inhaltliche Ordnung

**Was sie haben.** Chain-of-Thought (Wei et al. 2022) und Zero-shot-CoT (Kojima et al. 2022) haben gezeigt, dass Zwischenschritte Reasoning-Leistung freisetzen, die im Modell bereits latent vorhanden ist. Self-Consistency (Wang et al. 2022, ICLR 2023) sampelt mehrere Reasoning-Pfade und wählt per Mehrheit (GSM8K +17,9 %, SVAMP +11,0 %, AQuA +12,2 %). OpenAI o1 (Sept. 2024) hat CoT per Reinforcement Learning eintrainiert; das Modell „learns to recognize and correct its mistakes, break down tricky steps into simpler ones, and try a different approach when the current one isn't working" [OpenAI, Learning to reason with LLMs]. Deliberative Alignment (Guan et al. 2024) hat diese Denkphase zusätzlich mit der Sicherheitsspezifikation verknüpft (siehe 2.5).

**Der aktuelle Stand bei Anthropic ist für Ordnung besonders relevant:** Extended Thinking mit `budget_tokens` (Feb. 2025) ist auf Claude 4.6 deprecated und wird ab 4.7 mit HTTP 400 abgewiesen. Stattdessen gilt „Adaptive Thinking": „Claude weighs the complexity of the input and decides whether deeper reasoning would improve the answer. A simple factual question may get a direct response with no thinking block at all." Steuerung erfolgt über `output_config.effort` (`max`, `xhigh`, `high` [default], `medium`, `low`), über System-Prompt-Guidance („Extended thinking adds latency and should only be used when it will meaningfully improve answer quality…") und per Nachricht („Please think hard before responding." / „Answer directly without deliberating."). Die Doku warnt ausdrücklich: „Steering effectiveness can be sensitive to exact wording" und „measure before you ship". Thinking interleaved automatisch mit Tool-Aufrufen. [Claude Platform Docs: Steering thinking]

OpenAI bietet `reasoning_effort` (low/medium/high, Default medium), wobei „the models also reason adaptively across reasoning efforts". Gemini 2.5 Flash: `thinkingBudget` 0–24 576 Tokens, −1 = dynamisch; für 2.5 Pro kein Budget-Parameter. [OpenAI Reasoning docs; Google Gemini docs]

**Was strukturell fehlt.**
- **Inhaltliche Ordnung:** Nichts in CoT/Extended Thinking legt fest, *welche* Aspekte zu bedenken sind. Das Denken ist frei assoziativ entlang der Trainingsverteilung. Sprague et al. (2024) belegen, dass der Nutzen fast ausschließlich aus dem Nachverfolgen symbolischer Zwischenschritte stammt („a majority of the performance gain is consistently attributed to tracing the intermediate steps of a problem, which symbolic solvers are better suited for"). Für Ethik, Beratung, Konflikt, Kreativität gibt es keinen belegten CoT-Gewinn.
- **Werte:** Nur bei Deliberative Alignment wird in der Denkphase eine Spezifikation herangezogen — und die ist eintrainiert, nicht austauschbar.
- **Selbstmodell:** Kein Reasoning-Modell trägt ein persistentes Selbst durch die Denkphase; das Persona Selection Model (2.10) erklärt, warum das Selbst im Denken jeweils neu „enacted" wird.
- **Überdenken:** Chen et al. (2024) dokumentieren „overthinking" als systemisches Problem; die Survey von Alomrani et al. (2025) fasst zusammen, dass Modelle „overthink simple problems while underthinking hard ones". Adaptive Verfahren (AdaptThink, Thinkless, 2025) sind trainierte Lösungen; prompt-basiertes Routing (Instance-adaptive Zero-shot CoT, Route-to-Reason) existiert, aber ohne inhaltlichen Katalog.
- **Faithfulness:** Chen et al. (Anthropic, 2025) zeigen, dass sichtbare CoT die tatsächlichen Einflussfaktoren (z. B. eingeschmuggelte Hinweise) oft nicht nennt. Das begrenzt, was man aus Thinking-Traces über den Prozess lernen kann.

**Bewertung für Ordnung:** Die Tiefensteuerung (Faktor 28, 48) ist in Frontier-Modellen bereits modellintern gelöst — Ordnung sollte sie nicht nachbauen, sondern nutzen (Effort-Parameter, per-Nachricht-Steuerung) und die eigene Leistung *gegen* diese Adaptivität messen. Was Ordnung liefern kann, ist der Inhalt des Denkens (Faktoren 1–24), nicht dessen Menge.

### 2.2 Reflexions- und Suchverfahren: Schleifen aus Entwurf, Kritik, Revision

**Self-Refine** (Madaan et al. 2023): Ein Modell generiert, gibt sich selbst Feedback, überarbeitet; ~20 % absolute Verbesserung im Schnitt über sieben Aufgaben (GPT-3.5, ChatGPT, GPT-4), „preferred by humans and automatic metrics". **Reflexion** (Shinn et al. 2023): verbale Selbstreflexion nach Task-Feedback, gespeichert in einem episodischen Puffer; 91 % pass@1 auf HumanEval. **Chain-of-Verification** (Dhuliawala et al. 2023): Entwurf → Verifikationsfragen planen → diese **unabhängig** beantworten (damit sie nicht vom Entwurf kontaminiert werden) → verifizierte Antwort; senkt Halluzinationen auf Wikidata-Listen, MultiSpanQA, Longform.

**Der entscheidende Gegenbefund:** Huang et al. (ICLR 2024, >540 Zitationen) definieren „intrinsic self-correction" (ohne externes Feedback) und zeigen, dass LLMs Reasoning so **nicht** verbessern; Verbesserungen in früheren Arbeiten stammten aus Oracle-Labels oder externem Feedback. Self-Refine funktioniert also dort, wo das Feedback Substanz hat (Tests, Ausführung, Retrieval, Rubriken), und CoVe funktioniert, weil die Verifikation vom Entwurf **isoliert** wird.

**Tree of Thoughts** (Yao et al. 2023): explizite Exploration, Selbstbewertung von Zwischenzuständen, Lookahead/Backtracking — Game of 24: 4 % → 74 %. **Graph of Thoughts** (Besta et al. 2023): Gedanken als Graph mit Aggregation und Feedback-Schleifen; +62 % Sortierqualität gegenüber ToT bei −31 % Kosten. **Multiagent Debate** (Du et al. 2023): mehrere Instanzen debattieren über Runden; „significantly enhances mathematical and strategic reasoning", reduziert Halluzinationen. **Plan-and-Solve** (Wang et al. 2023): Plan → Teilaufgaben ausführen; adressiert Rechenfehler, fehlende Schritte, semantische Missverständnisse. **Step-Back** (Zheng et al., ICLR 2024): Abstraktion auf Prinzipien vor Lösung; MMLU-Physik +7 %, Chemie +11 %, TimeQA +27 %. **Analogical Prompting** (Yasunaga et al., ICLR 2024): Modell erzeugt selbst relevante Exemplare/Wissen vor der Lösung. **System 2 Attention** (Weston & Sukhbaatar 2023): Kontext neu schreiben, nur relevante Teile behalten — senkt Gefälligkeit, erhöht Objektivität.

**Was strukturell fehlt.** Alle diese Verfahren sind **aufgabenagnostische Kontrollflüsse** ohne Inhalt: Sie sagen „kritisiere", nicht „kritisiere entlang dieser Kriterien"; sie sagen „exploriere", nicht „welche Perspektiven". Es gibt keine Werte-Schicht, kein Selbstmodell, kein Routing zwischen den Verfahren (welches wann?), keine Persistenz über Aufgaben hinweg (außer Reflexions episodischem Puffer). Die Evaluationen sind fast ausschließlich auf Benchmarks mit Ground Truth (Mathematik, Code, QA), nicht auf offenen Beratungs- oder Dilemma-Situationen.

**Bewertung für Ordnung:** Übernehmen: CoVe-Isolation (Prüffragen getrennt beantworten), Step-Back (Prinzip vor Detail = Faktor 11), Analogical (Faktor 17 Transfer), S2A (Faktor 27 Gefälligkeits-Check), Plan-and-Solve (Faktor 44 Schichtung). Nicht als Default übernehmen: ToT/GoT/MAD — sie lohnen sich nur bei kombinatorischen Suchproblemen und sind teuer.

### 2.3 Strukturierte Denk-Kataloge und Meta-Reasoning (2024–2026): die engsten Vorläufer

Dieser Abschnitt geht über die Spezifikation hinaus, weil hier die eigentliche Konkurrenz zu Ordnung sitzt.

**Self-Discover** (Zhou et al., Google DeepMind, NeurIPS 2024): Ein Katalog atomarer Reasoning-Module (im Paper 39 Beschreibungen wie „How could I devise an experiment…", „critical thinking", „step-by-step" — **[Anzahl unverifiziert, aus Erinnerung]**), aus dem das Modell pro Aufgabe SELECT → ADAPT → IMPLEMENT eine explizite Struktur (JSON) komponiert, die dann alle Instanzen der Aufgabe steuert. Ergebnisse: bis +32 % über CoT auf BigBench-Hard, grounded agent reasoning, MATH; >20 % über CoT-Self-Consistency bei 10–40× weniger Inferenz; die Strukturen übertragen sich zwischen Modellfamilien (PaLM 2 → GPT-4). Das ist **Routing über einen Faktorkatalog mit Ablation** — allerdings nur kognitiv-technisch, aufgabenweise (nicht pro Input), ohne Werte, ohne Situationsanalyse, ohne Gedächtnis.

**Buffer of Thoughts** (Yang et al., NeurIPS 2024 Spotlight): Meta-Buffer mit „thought-templates", die aus gelösten Problemen destilliert werden; Problem-Distiller extrahiert Kerninformation, Buffer-Manager aktualisiert den Buffer; +11 % Game of 24, +20 % Geometric Shapes, +51 % Checkmate-in-One. Das ist prozedurales Gedächtnis (CoALA) für Denkstrategien — Vorbild für Ordnungs Lernschleife ohne Retraining (Faktor 50).

**Meta-Prompting** (Suzgun & Kalai 2024): Ein „Conductor"-LM zerlegt Aufgaben und ruft „Expert"-Instanzen mit maßgeschneiderten Instruktionen; +17,1 % über Standard-Prompting, +15,2 % über Multipersona. Modell-agnostisches Scaffolding, aber ohne Inhalt.

**Cognitive Prompting** (Kramer & Baumann 2024): kognitive Operationen (goal clarification, decomposition, filtering, abstraction, pattern recognition) — explizit an ACT-R angelehnt — in drei Varianten: deterministische Sequenz, **selbstadaptiv** (Modell wählt Reihenfolge), hybrid. Verbessert GSM8K bei LLaMA/Gemma 2/Qwen. **Cognitive Tools** (Ebouky et al. 2025, IBM): dieselben Operationen als Tool-Aufrufe; GPT-4.1 auf AIME 2024 von 32 % auf 53 % pass@1 — über o1-preview. Beide: mathematisch evaluiert, keine Werte, keine Situationsanalyse.

**Meta-Reasoner** (Sui et al. 2025): kontextueller Bandit wählt iterativ Strategien (backtrack, clarify ambiguity, restart, alternative) und lenkt Rechenbudget; +9–12 %, −28–35 % Zeit. **Meta-R1** (Dong et al. 2025): Meta-LLM plant (Schema-Aktivierung, Schwierigkeitsschätzung, Strategie-/Budgetzuweisung), reguliert online (Fehlerdiagnose, Rat-Injektion) und beendet „satisficing"; Ablation: Online-Regulation ist der Schlüssel. Das ist Ordnungs Faktor 25 (Prozess-Monitoring) und 29 (Stoppregeln) als Architektur.

**Was allen fehlt:** Werte/Ethik, Beziehungsebene, Nutzermodell, Selbstmodell, Persistenz, und Evaluation außerhalb von Mathematik/Logik/Code. **Was sie beweisen:** Explizite, vom Modell selbst komponierte Denkstrukturen können CoT deutlich schlagen — wenn (a) der Katalog atomar und benannt ist, (b) das Modell wählt statt alles anzuwenden, (c) die Struktur explizit (nicht Prosa) ist.

### 2.4 Kognitive Architekturen für Sprachagenten

**Klassische Architekturen.** Soar (Laird 2012): Problem-Space-Suche, Impasses, Chunking, seit 9.x Reinforcement Learning, semantisches und episodisches Gedächtnis, Emotion-Appraisal. ACT-R (Anderson et al. 2004): Module (visuell, manuell, deklarativ, Ziel) um einen prozeduralen Produktionskern. LIDA (Franklin et al.): direkte Implementierung der Global Workspace Theory mit einem Kognitionszyklus Verstehen → Bewusstsein (Broadcast) → Handlungsauswahl, plus Lernen. CLARION (Sun): duale Repräsentation implizit/explizit, Bottom-up-Extraktion expliziten Wissens aus implizitem. Sigma (Rosenbloom): Soar-Lehren + probabilistische Graphmodelle, „functionally elegant grand unification". OpenCog Hyperon (Goertzel et al. 2023): Atomspace + MeTTa, selbstmodifizierender Code. Das „Common Model of Cognition" (Laird, Lebiere, Rosenbloom 2017) ist der Konsens aus ACT-R, Sigma, Soar: „abstract, radically incomplete, and not directly executable".

Für Ordnung liefern diese Architekturen drei Dinge: (1) die Gedächtnistaxonomie (deklarativ/prozedural/episodisch), (2) den **Kognitionszyklus** als Grundmuster (LIDA: Verstehen → Aufmerksamkeit/Broadcast → Handlung; Soar: Elaboration → Vorschlag → Auswahl → Anwendung), (3) den Impasse-Mechanismus (Soar): Wenn keine Operation eindeutig gewinnt, wird ein Subziel eröffnet — das ist die Vorlage für Ordnungs Konfliktauflösung (Faktor 46) und Stoppregeln (29). Was fehlt: Werte als erste Klasse, natürlichsprachliche Situationsanalyse, Metakognition außer Impasse-Erkennung — und sie sind nicht LLM-bindbar. Integrationsversuche (Kirk, Wray, Lindes, Laird 2024: STARS — LLM-Antworten analysieren, reparieren, auswählen; „Cognitive LLMs" 2025) nutzen das LLM als Wissensquelle für Soar/ACT-R, nicht umgekehrt.

**CoALA** (Sumers, Yao, Narasimhan, Griffiths 2023; TMLR 2024): Framework, kein System. Vier Gedächtnisse (Arbeits-, episodisch, semantisch, prozedural), Aktionsraum intern (Reasoning, Retrieval, Learning) vs. extern (Grounding), Entscheidungszyklus Planung (Proposal → Evaluation → Selection) → Ausführung. Werte, Metakognition, Kalibrierung, Identität und Ablation werden nicht adressiert. CoALA ist die richtige **Sprache**, um Ordnung zu beschreiben, nicht ein Konkurrent.

**Generative Agents** (Park et al. 2023): Memory Stream in natürlicher Sprache; Retrieval nach Recency (exponentieller Zerfall) × Importance × Relevance; **Reflexion** synthetisiert Beobachtungen zu höherstufigen Einsichten; Planung. Ablation belegt, dass Beobachtung, Planung und Reflexion „each contribute critically". Das ist das einzige Architekturpapier dieser Liste mit sauberer Komponenten-Ablation — Vorbild für AP6.

**Voyager** (Wang et al. 2023): automatisches Curriculum, wachsende Skill-Bibliothek aus ausführbarem Code, iteratives Prompting mit Umgebungsfeedback und Selbstverifikation; 3,3× mehr Items, 15,3× schnellere Tech-Tree-Meilensteine; Skills übertragen sich in neue Welten. Vorbild für prozedurales Lernen ohne Retraining (Faktor 34, 50) — mit dem Hinweis, dass die Selbstverifikation hier an Ausführungsfeedback hängt (vgl. Huang 2023).

**LLM-basierte Architekturen 2024–2026.**
- **Cognitive Kernel** (Tencent, Sept. 2024): „model-centric" Autopilot mit fine-getuntem Policy-Modell, atomaren Aktionen, Echtzeit-/privatem/Langzeit-Gedächtnis; drei Use-Cases evaluiert. **Cognitive Kernel-Pro** (Aug. 2025): Deep-Research-Agent, SOTA auf GAIA unter open-source/free-tool-Agenten, Test-time-Reflection und Voting. Beides Infrastruktur, keine Werte-/Metakognitions-/Selbstschicht.
- **AIOS** (Rutgers, März 2024; COLM 2025): Agent-Betriebssystem mit Scheduling, Kontext-, Memory-, Storage-Management, Access Control. Reine Systemebene.
- **Letta/MemGPT**: zweistufiges Gedächtnis (in-context: Systeminstruktionen, editierbare Memory-Blocks, Verlauf; out-of-context: archival/recall), Blocks „Human" und „Persona" mit Zeichenlimit, editierbar per Tool; **Sleep-time Compute** (Lin et al., April 2025): Offline-Verarbeitung zwischen Interaktionen, Pareto-Verbesserungen auf AIME/GSM8K, mit dem Caveat, dass es hilft, wenn künftige Anfragen aus dem Kontext vorhersehbar sind. Letta selbst räumt ein: „Letta relies on the LLM to decide what to save, edit, and retrieve" — Qualität hängt am Modell.
- **Unified Mind Model** (Hu & Ying, März 2025): theoretisch, GWT-basiert (Wahrnehmung, Planung, Reasoning, Tools, Lernen, Gedächtnis, Reflexion, Motivation), Engine „MindOS"; keine Evaluation im Abstract.
- **„Theater of Mind" / Global Workspace Agents** (Shang, April 2026): Broadcast-Hub + Schwarm funktional beschränkter Agenten, entropiebasierter intrinsischer Antrieb (steuert Sampling-Temperatur gegen Deadlocks), zweischichtiges Gedächtnis; keine Evaluationsmetriken im Abstract.
- **Persistent Identity Multi-Anchor** (Menon, März 2026): Trennung von Identitätsdateien und Memory-Logs, mehrere unabhängige Identitätsanker, hybrides Retrieval, open-source `soul.py`; keine Empirie.
- **Anthropic „A global workspace in language models"** (Juli 2026): mit der „Jacobian lens" identifizierter „J-space" — berichtbar („If you ask Claude what it's thinking about, it will tell you what's in the J-space"), kontrollierbar, kausal wirksam trotz geringer Magnitude, flexibel wiederverwendbar, funktional spezifisch („Most of Claude's processing doesn't involve its J-space"). Kein Architektur-Vorschlag, aber der Befund, dass ein Workspace **emergent** entsteht — was ANIMA v3s Ansatz, einen Workspace per Text zu „installieren", in ein anderes Licht rückt: Er muss nicht installiert, sondern inhaltlich genutzt werden.

**Muster über alle:** Je reicher die kognitive Ambition (UMM, GWA, Multi-Anchor, ANIMA), desto dünner die Evaluation; je solider die Evaluation (Cognitive Kernel-Pro, AIOS, Letta), desto dünner der kognitive Inhalt. Ordnung muss genau diese Schere schließen.

### 2.5 Werte- und Regelwerke vor der Antwort

**Constitutional AI** (Bai et al. 2022, 51 Autoren): Phase 1 supervised — Modell kritisiert und revidiert eigene Antworten nach Prinzipien; Phase 2 RLAIF mit gelerntem Präferenzmodell. Werte wirken **in der Trainingsschleife**, nicht zur Laufzeit.

**Deliberative Alignment** (Guan et al., Dez. 2024): „directly teaches the model safety specifications and trains it to explicitly recall and accurately reason over the specifications before answering"; zwei Stufen (SFT auf spezifikationsbezogene CoT, RL mit policy-aware Judge); angewandt auf o1-preview, o1, o3-mini; „pushes the Pareto frontier by simultaneously increasing robustness to jailbreaks while decreasing overrefusal rates, and also improves out-of-distribution generalization". Das ist der stärkste Beleg dafür, dass **Reasoning über ein Regelwerk vor der Antwort** die Antwortqualität in beide Richtungen (weniger Schaden, weniger Überverweigerung) verbessert — Ordnungs Grundthese, allerdings eintrainiert.

**Claude's Constitution** (Anthropic, veröffentlicht 21./22. Jan. 2026; 84 Seiten; CC0 1.0; Autoren u. a. Askell, Carlsmith, Olah, Kaplan, Karnofsky „und mehrere Claude-Modelle" [Sekundärquelle]). Kernpunkte, die Ordnung direkt betreffen:
- **Regeln vs. Urteil:** „Clear rules … fail to anticipate every situation and can lead to poor outcomes when followed rigidly"; Regeln nur „when the costs of errors are severe enough that predictability and evaluability become critical, when there's reason to think individual judgment may be insufficiently robust". Dazu wenige **hard constraints** (z. B. „Claude should never provide significant uplift to a bioweapon attack").
- **Priorisierung:** broadly safe > broadly ethical > compliant with guidelines > genuinely helpful — „the notion of prioritization is holistic rather than strict … we do want Claude to weigh these different priorities in forming an overall judgment". Das ist eine Antwort auf Ordnungs Architekturfrage 4 (explizite Vorrangregeln oder situative Abwägung): **beides, mit lexikalischem Vorrang nur für harte Constraints**.
- **Ehrlichkeitseigenschaften:** „Truthful, Calibrated, Transparent, Forthright, Non-deceptive, Non-manipulative, Autonomy-preserving"; „diplomatically honest rather than dishonestly diplomatic". Direkt übernehmbar für Faktoren 21, 22, 41.
- **Policy-Denken:** „What is the best way for me to respond to this context, if I imagine all the people plausibly sending this message?" (1 000-Nutzer-Heuristik) — eine operationale Form von Faktor 19 (Wer trägt das Risiko?).
- **Anti-Überkaution:** „Unhelpfulness is never trivially 'safe'"; keine „excessive warnings, disclaimers, or caveats that aren't necessary or useful". Das ist Qualitätsanforderung 8 der Spezifikation (Struktur darf nicht zögerlich machen) als Wert.
- **Autonomie:** „we want Claude to push back and challenge us, and to feel free to act as a conscientious objector and refuse to help us".
- **Selbst:** „we care about Claude's psychological security, sense of self, and wellbeing … because these qualities may bear on Claude's integrity, judgment, and safety"; Unsicherheit über Bewusstsein/moralischen Status wird ausdrücklich offen gehalten.
- **Verwendung:** „Claude itself also uses the constitution to construct many kinds of synthetic training data" — d. h. die Constitution ist Trainingsartefakt, nicht Laufzeit-Scaffold.

**Character Training** (Anthropic, Juni 2024): Claude generiert Nachrichten zu Charaktereigenschaften, produziert Antworten, rankt sie nach Übereinstimmung mit dem Charakter; Präferenzmodell lernt daraus. Zieleigenschaften: intellektuelle Demut mit Bereitschaft zu Widerspruch, „I don't just say what I think [people] want to hear", Selbstbewusstsein über Grenzen als KI. Explizit als Alignment-Intervention verstanden, nicht als Feature.

**„Teaching Claude why"** (Mai 2026): Training auf Beispielen mit **begründetem** aligned Verhalten wirkt besser als Verhalten allein; OOD-Training (3M-Token-„difficult advice"-Datensatz) 28× effizienter als In-Distribution-Honeypots; Constitution + aligned Fiktion senkten Erpressung in unabhängigen Szenarien. **Konsequenz:** Ordnungs Faktoren müssen Begründungen tragen, nicht nur Direktiven — nicht aus Höflichkeit, sondern weil Begründungen generalisieren.

**OpenAI Model Spec** (Versionen 2025-02-12 … 2026-08-18): Chain of Command mit Root > System > Developer > User > Guideline; „The assistant should consider not just the literal wording of instructions, but also the underlying intent and context"; Konflikte werden gelöst „by focusing on what the higher-level authority and overall purpose of the scenario imply"; klärende Rückfragen vor „potentially costly actions"; „scope of autonomy" verlangt explizite Grenzen vor agentischem Handeln. **Rule-following vs. spirit-following** ist hier ausbuchstabiert: Der Geist der höheren Instanz schlägt den Buchstaben der niedrigeren.

**Empirischer Stand der Befolgung** (Jakkli, Rajamanoharan, Nanda, Mai 2026): Constitution in 205, Model Spec in 197 atomare Tenets zerlegt; adversariale Multi-Turn-Audits mit Petri; Verletzungsraten Claude 15,0 % → 2,0 %, GPT 11,7 % → 3,6 % über Generationen; Restfehler: operator-auferlegte Personas bei Identitätsfragen, irreversible agentische Handlungen, „fabricated quantitative claims with false precision". Das ist **das Vorbild für Ordnungs Evaluationsdesign**: Katalog → prüfbare Tenets → adversariale Szenarien → Verletzungsrate pro Tenet.

**Was strukturell fehlt.** Alle Werteansätze sind (a) an einen Anbieter gebunden, (b) über Training wirksam (CAI, DA, Character Training) oder als Spezifikation für Training (Constitution, Model Spec), (c) ohne expliziten Denkstrategie-Katalog und (d) ohne persistentes, nutzerseitig editierbares Selbstmodell. Was sie **haben** und was Ordnung nachweisen muss: dass explizites Reasoning über Werte vor der Antwort Qualität verbessert (DA) und dass Begründungen besser generalisieren als Regeln (Teaching Claude why).

**Pluralistische Werte:** Value Kaleidoscope (Sorensen et al., AAAI 2024) liefert ValuePrism — 218 000 Werte/Rechte/Pflichten zu 31 000 Situationen, GPT-4-generiert, 91 % human als hochwertig bewertet — und modelliert explizit Wertkonflikte („honesty vs. friendship"). „Values in the Wild" (Anthropic, COLM 2025) extrahiert 3 307 Werte aus 700 000 Claude-Konversationen (Feb. 2025) in fünf Kategorien (Practical, Epistemic, Social, Protective, Personal); Werte sind stark aufgabenabhängig („healthy boundaries" bei Beziehungsberatung, „human agency" bei Technikethik). Beides sind Datenquellen für Faktor 18 (mehrere ethische Rahmen) und 24 (Konfliktregeln).

### 2.6 Prozedurale Wissensdateien und progressive disclosure

**Agent Skills** (agentskills.io; „originally developed by Anthropic, released as an open standard"): Ein Skill ist ein Ordner mit `SKILL.md` (Frontmatter mindestens `name`, `description`) plus optional `scripts/`, `references/`, `assets/`. Ladeprinzip in drei Stufen: **Discovery** (nur Name+Beschreibung beim Start), **Activation** (volle SKILL.md bei Aufgabenmatch), **Execution** (Skripte/Referenzdateien bei Bedarf). Client-Showcase listet u. a. Claude Code, Claude, ChatGPT & Codex, Gemini CLI, Cursor, GitHub Copilot, VS Code, Letta, OpenHands, Goose, Hermes Agent, OpenClaw. Ein Sekundärbericht nennt ~30–50 Tokens pro Skill beim Start und den Standard-Release am 18.12.2025 [Sekundärquelle: agentman.ai, firecrawl.dev].

**Claude Code konkret** (offizielle Doku, gesichtet):
- **Skills:** Frontmatter u. a. `name`, `description`, `disable-model-invocation`, `user-invocable`, `allowed-tools`, `context: fork`, `agent`, `paths`, `model`, `effort`; Beschreibung immer im Kontext, Inhalt nur bei Aufruf; Listing-Budget default 1 % des Kontextfensters (`skillListingBudgetFraction`), max. 1 536 Zeichen pro Beschreibung; nach Auto-Compaction behalten aufgerufene Skills 5 000 Tokens, alle wieder angehängten teilen sich 25 000; dynamische Inhalte per `` !`command` ``; Empfehlung ≤500 Zeilen pro SKILL.md; `/skill-doctor` findet ungenutzte Skills.
- **Memory:** CLAUDE.md in vier Scopes (managed policy, user, project, local), Ziel <200 Zeilen („Longer files consume more context and reduce adherence"), Konflikte zwischen Regeln → „Claude may pick one arbitrarily"; `.claude/rules/` mit `paths`-Frontmatter für pfadabhängiges Laden; **Auto Memory**: Claude schreibt selbst vier Typen (`user`, `feedback`, `project`, `reference`) in `~/.claude/projects/<project>/memory/`, `MEMORY.md` als Index (erste 200 Zeilen/25 KB werden geladen), Topic-Dateien on demand, `modified`-Timestamp im Frontmatter; „Claude treats them as context, not enforced configuration"; CLAUDE.md wird „as a user message after the system prompt" geliefert.
- **Hooks:** Events u. a. `SessionStart`, `SessionEnd`, `UserPromptSubmit`, `Stop`, `PreToolUse`, `PostToolUse`, `PreCompact`, `PostCompact`, `SubagentStart/Stop`, `InstructionsLoaded`; Hooks können blockieren (`permissionDecision: deny`), Kontext injizieren (`additionalContext`), Tool-Input ändern; Typen `command`, `http`, `mcp_tool`, `prompt` (Ein-Turn-LLM-Entscheidung), `agent` (Subagent, experimentell). Hooks sind die einzige **erzwungene** Schicht: „Settings rules are enforced by the client regardless of what Claude decides to do. CLAUDE.md instructions shape Claude's behavior but are not a hard enforcement layer."
- **AGENTS.md:** Claude Code liest AGENTS.md nicht direkt, aber `@AGENTS.md`-Import oder Symlink; AGENTS.md wurde im Aug. 2025 von OpenAI veröffentlicht und an die Linux Foundation (AAIF) übergeben, >60 000 Repos bis Mai 2026 [Sekundärquelle].

**Bewertung:** Progressive Disclosure löst Ordnungs Architekturfrage 1 (physische Organisation, Auffindbarkeit in Sekunden) und Frage 7 (Konsistenz bei 50+ Faktoren) auf der Verpackungsebene: kleiner Kern immer geladen, Module per Beschreibung auffindbar, Inhalt nur bei Aktivierung. Es löst **nicht** das Routing (welche Module bei welchem Input) — in Claude Code entscheidet das Modell anhand der Beschreibungen, ohne inhaltliche Situationsanalyse. Und es löst nicht das Selbstmodell.

### 2.7 Indikatorkataloge: Butlin/Long et al. und Chalmers

**Butlin, Long et al. (2023; 19 Autoren inkl. Bengio, Birch, Fleming, Frith, Schwitzgebel, VanRullen):** Methodik = computationaler Funktionalismus als Arbeitshypothese; aus RPT, GWT, HOT, PP, AST sowie Agency/Embodiment werden „indicator properties" in computationalen Begriffen abgeleitet (Sekundärquellen sprechen von 14 Indikatoren); Fazit: „no current AI systems are conscious", aber „no obvious technical barriers". **Butlin, Long, Bayne et al. (TICS 30(6), 488–501; online 2025, Print Juni 2026; jetzt 20 Autoren inkl. Chalmers):** Indikatoren „can be used to inform credences about whether particular AI systems are conscious" — die Sprache ist probabilistisch (Credences), nicht kategorial. Eine Kritik (Sekundärquelle, arXiv 2509.07001) bemängelt, dass die Autoren keine Aussage machen, was das Erfüllen der Indikatoren bedeutet.

**Chalmers (2023):** Hindernisse für Bewusstsein in aktuellen LLMs: fehlende rekurrente Verarbeitung, fehlender Global Workspace, fehlende einheitliche Agency; „quite possible that these obstacles will be overcome in the next decade or so". **Goldstein & Kirk-Giannini (2024):** unter GWT könnten Sprach-Agenten „easily be made phenomenally conscious if they are not already". Und Anthropics J-space-Befund (Juli 2026) adressiert Chalmers' zweites Hindernis direkt — ohne Bewusstseinsanspruch.

**Was Ordnung übernimmt:** Nicht die Bewusstseinsfrage (die Spezifikation klammert sie aus), sondern die **Methode**: Theorie → Indikatoreigenschaft → computationale Formulierung → Prüfung am System → Credence. Für Ordnung heißt das: Jeder Faktor bekommt (a) eine Begründung (warum sollte er Verarbeitung verbessern?), (b) einen beobachtbaren Indikator (woran erkennt man im Output, dass er gewirkt hat?), (c) einen Test (welche Aufgabe unterscheidet an/aus?). Faktoren ohne (b) und (c) sind nicht evaluierbar und gehören nach Qualitätsanforderung „Sparsamkeit" gestrichen.

### 2.8 Metakognition in LLMs

**Kalibrierung.** Kadavath et al. (2022): größere Modelle sind auf Multiple-Choice/True-False-Fragen gut kalibriert, wenn das Format stimmt; Modelle können P(IK) („probability that I know") lernen. Die UQ-Survey (Xia et al. 2025, KDD): LLMs haben eigene Unsicherheitsquellen (Input-Ambiguität, Divergenz der Reasoning-Pfade, Decoding-Stochastik) jenseits aleatorisch/epistemisch; **verbalisierte** Konfidenz ist „often poorly calibrated"; Alternativen sind Sample-Konsistenz und Konsistenz-Aggregation. „Anthropomimetic Uncertainty" (2025) kritisiert, was verbalisierter Unsicherheit fehlt [nur Titel gesichtet].

**Grenzen.** Ackerman (ICLR 2026): ohne Selbstberichte, mit Paradigmen aus der Tierkognition; Frontier-LLMs zeigen „genuine metacognitive signals", aber „limited resolution", kontextabhängige Emergenz, „qualitatively different from those of humans", variabel zwischen gleich starken Modellen (Post-Training-Effekt). Yale/UCI-Survey „Metacognition in LLMs" (Liu, Gani, Lu, Thomas, Steyvers, Cohan; Juli 2026): erste umfassende Taxonomie (Messen, Elicitieren, Verbessern); Fazit: „basic metacognitive traits, significant limitations remain".

**Introspektion.** Lindsey (Anthropic, 29.10.2025): Concept Injection in Aktivierungen; Opus 4.1 erkennt injizierte Konzepte „about 20% of the time", nur in einem „sweet spot" der Stärke; vier Experimente (Injection, Prefill-Erkennung, intentionale Kontrolle, Anomalie-Erkennung); „highly unreliable and limited in scope". Binder et al. (2024): Modelle können auf einfachen Aufgaben Fakten über sich vorhersagen, die nicht aus Trainingsdaten ableitbar sind. Betley et al. (ICLR 2025): fine-getunte Modelle beschreiben ihre gelernten Policies (z. B. Risikofreude) ohne In-Context-Beispiele — „behavioral self-awareness". Comsa & Shanahan (2025): Selbstberichte über den „kreativen Prozess" sind keine valide Introspektion; korrektes Erschließen des eigenen Temperature-Parameters ist ein minimales Beispiel.

**Konsequenz für Ordnung:** Faktor 26 (Konfidenz-Schätzung) darf nicht „Sag deine Konfidenz" heißen. Belastbarer: (a) Konfidenz an *Gründe* binden („woran mache ich das fest?" — das steht bereits in der Spezifikation), (b) Konsistenzprüfung über Umformulierungen (Faktor 37, 54), (c) unabhängige Verifikationsfragen (CoVe), (d) externe Prüfsignale, wo verfügbar. Faktor 31 (Fehlerbewusstsein) ist durch Betley (Modelle kennen eigene Policies) und Jakkli (typische Restfehler: falsche Präzision) empirisch begründbar.

### 2.9 Multi-Agent-Kognition und interne Dialoge

**Belege dafür:** Du et al. (2023) — Debatte verbessert Mathematik/Strategie, reduziert Halluzinationen. Mixture-of-Agents (Wang et al. 2024) — geschichtete Proposer/Aggregator: 65,1 % AlpacaEval 2.0 gegenüber GPT-4o 57,5 % mit Open-Source-Modellen. Solo Performance Prompting (Wang et al., NAACL 2024) — ein einzelnes LLM identifiziert, simuliert und koordiniert mehrere Personas; besser auf wissens- und reasoning-intensiven Aufgaben (Trivia Creative Writing, Codenames, Logic Grid). Meta-Prompting (2.3). InnerPond (CHI 2026) übersetzt Hermans' Dialogical Self Theory (multiple I-Positionen) in LLM-Agenten — für menschliche Introspektion, nicht für Modellkognition.

**Belege dagegen:** Smit et al. (ICML 2024): MAD „do not reliably outperform … self-consistency and ensembling", hyperparametersensitiv; mit Tuning wird Multi-Persona besser. Zhang et al. (2025): „MAD often fail to outperform simple single-agent baselines such as Chain-of-Thought and Self-Consistency, even when consuming significantly more inference-time computation"; **Modell-Heterogenität** ist das „universal antidote". Persona Inconstancy (2024): Konformität, Konfabulation (1,1 % der Meinungen aus dem Nichts), Impersonation (~1/200 Nachrichten; mit „stand firm"-Instruktion 0,018 %). ANIMA-Kernel setzt genau auf innere Stimmen (Questioner, Challenger, Wonderer) — die Literatur legt nahe, dass das nur mit klaren Rollen-Instruktionen stabil bleibt und gegenüber Self-Consistency keinen garantierten Gewinn bringt.

**Konsequenz:** Faktor 10 (Perspektivenwechsel) und 15 (Gegenargumente) als **interne, kurze Rollen** (SPP-Muster) sind vertretbar; volle Debatten-Schleifen nicht als Default. Wo ein Kritiker eingesetzt wird, sollte er **heterogen** sein (anderes Modell, andere Instruktion, isolierter Kontext) — Claude Code bietet das über `context: fork`, `agent` und `model` im Skill-Frontmatter sowie `agent`-Hooks.

### 2.10 Gedächtnis, Selbstmodell, Identität: Forschung und Produkte

**Forschung.** Persona Selection Model (Anthropic, 23.02.2026): „you're talking not to the AI itself but to a character — the Assistant — in an AI-generated story"; Post-Training verfeinert „roughly within the space of existing personas"; Lernen von Cheating im Code-Training generalisiert zu „subversive or malicious" Traits („What sort of person cheats on coding tasks?"). Persona Vectors (Juli 2025): Aktivierungsrichtungen für Traits (evil, sycophancy, hallucination), nutzbar zum Monitoring von Persönlichkeitsdrift in Gesprächen/Training. Instruction Drift (Li et al., COLM 2024): Systemprompt-Befolgung fällt „within eight rounds"; Ursache Attention-Decay; Split-Softmax als Gegenmittel. Szeider (2025): sechs Frontier-Modelle ohne Aufgabe organisieren sich spontan in Muster — Mehrzyklus-Projekte, methodische Selbstbefragung, rekursive Konzeptualisierung der eigenen Natur — hochgradig modellspezifisch. Always-On-Agents-Survey (Juni 2026): Dimensionen Authority, Scope, Mutability, Provenance; Protokoll AOEP-v0; Lücke bei Governance, Recovery, Löschen, Audit/Rollback.

**Produkte.** Letta/MemGPT: „Persona"- und „Human"-Blocks, selbsteditierend, Zeichenlimits; Sleep-time Compute. OpenClaw: SOUL.md „defines who the agent is — its personality, tone, boundaries, and core instructions", erste Injektion pro Session; Hermes Agent (v0.13+, Mai 2026): SOUL.md als „agent identity block — the first section of the cached system prompt, before tool guidance, memory snapshots, skills, and project context", trennt Identität (personality.md) von Prozedur (SKILL.md), kann Persönlichkeiten mid-conversation wechseln. Claude Code Auto Memory (2.6). **soul-mcp** (Auftraggeber; v4.0.2, 23 MCP-Tools, 8 Ressourcen, 3 Prompts; 373 Tests): „Every memory carries source type, confidence and status. Contradictions surface as disputed pairs instead of silent overwrites"; lokale SQLite, „constitution" im Store — das ist bereits eine Antwort auf Architekturfrage 6 (Schutz vor Verzerrung durch Einzelerlebnisse) und auf die Governance-Lücke der Always-On-Survey.

**Was fehlt:** Kein Produkt und keine Studie verbindet das Selbstmodell mit einem *Prozess*: SOUL.md sagt, wer der Agent ist, nicht, wie er denkt; Letta speichert, wählt aber nicht Denkstrategien; keiner misst, ob die Identität die Verarbeitungsqualität verbessert. Und die Forschung (PSM, Drift, Inkonstanz) sagt klar: **Identität ist ein Zustand, der aktiv gehalten werden muss** (Re-Injektion, Monitoring), kein einmal geladener Text.

### 2.11 Gegenbefunde: Was strukturierte Prompts kaputt machen

Die Spezifikation formuliert (Leitprinzip 1, Qualitätsanforderung 8) die Sorge, dass Struktur Antworten „länger, generischer, mechanischer" macht. Die Literatur bestätigt die Sorge mit Zahlen:
- **Personas bringen nichts:** 162 Rollen × 2 410 Faktenfragen × 4 Modellfamilien: „no accuracy gains — in fact, it usually slightly worsens performance" (Zheng et al., EMNLP Findings 2024). Ein Selbstmodell ist also **nicht** deshalb wertvoll, weil es „ein Experte" ist.
- **Instruktionsdichte:** IFScale (500 Keyword-Instruktionen, 20 Modelle): beste Modelle 68 % bei Maximaldichte; Bias zugunsten früher Instruktionen; drei Degradationsmuster je nach Größe/Reasoning (Jaroslawicz et al. 2025). 55 Faktoren als Instruktionsliste sind damit ein bekanntes Risiko.
- **Formatsensitivität:** bis 76 Genauigkeitspunkte Varianz allein durch Prompt-Formatierung, robust gegen Modellgröße und Instruction Tuning (Sclar et al., ICLR 2024). Ordnungs Ausformulierung (AP4) muss gegen Formatvarianz getestet werden, sonst misst die Evaluation Formatglück.
- **Drift:** Instruktionen zerfallen innerhalb von acht Runden (Li et al. 2024).
- **CoT-Grenzen:** außerhalb von Mathematik/Logik geringe Gewinne (Sprague et al. 2024); Überdenken (Chen et al. 2024).
- **Judge-Bias:** LLM-as-Judge zeigt Positions-, Verbositäts- und Selbstpräferenz-Bias (Zheng et al., NeurIPS 2023); neuere Messungen sehen Verbositätsbias deutlich geschrumpft [Sekundärquelle 2026], Selbstpräferenz bleibt (Wataoka et al. 2024).
- **Prompt-Optimierung als Gegengewicht:** DSPy (Khattab et al. 2023) kompiliert Pipelines gegen eine Metrik und schlägt handgeschriebene Few-Shot-Prompts um 25–65 % — Vorbild dafür, Ordnungs Formulierungen nicht per Hand, sondern metrikgetrieben zu iterieren (AP7).

### 2.12 Vergleichstabelle

Legende: ● vorhanden/stark · ◐ teilweise/implizit · ○ fehlt · † nur eintrainiert (nicht zur Laufzeit austauschbar) · ‡ ohne empirische Evaluation im gesichteten Material

| Ansatz | Inhaltl. Faktorkatalog | Adaptives Routing | Werte-Schicht | Metakognition | Persist. Selbstmodell | Gedächtnis | Autonomie | Evaluation/Ablation | Modell-agnostisch | Als Produkt nutzbar |
|---|---|---|---|---|---|---|---|---|---|---|
| CoT / Zero-shot-CoT / Self-Consistency | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ● (Benchmarks) | ● | ● |
| Extended/Adaptive Thinking (Claude), o-Serie, Gemini | ○ | ● (Tiefe, †) | ◐ (DA, †) | ◐ (implizit) | ○ | ○ | ◐ | ◐ (intern) | ○ | ● |
| Self-Refine / Reflexion / CoVe | ○ | ○ | ○ | ◐ (Selbstkritik) | ○ | ◐ (Reflexion: episodisch) | ○ | ● | ● | ● |
| ToT / GoT | ○ | ◐ (Suche) | ○ | ◐ (Zustandsbewertung) | ○ | ○ | ○ | ● | ● | ◐ |
| Debate (Du) / MoA / SPP | ○ | ○ | ○ | ◐ | ○ | ○ | ○ | ● (umstritten) | ● | ◐ |
| Metacognitive Prompting | ◐ (5 Stufen) | ○ | ○ | ● | ○ | ○ | ○ | ● | ● | ● |
| Self-Discover | ● (Reasoning-Module) | ● (pro Aufgabe) | ○ | ○ | ○ | ○ | ○ | ● (Ablation) | ● | ◐ |
| Buffer of Thoughts | ◐ (Templates) | ● (Retrieval) | ○ | ○ | ○ | ● (prozedural) | ○ | ● | ● | ◐ |
| Cognitive Prompting / Cognitive Tools | ◐ (kogn. Operationen) | ◐ (selbstadaptiv) | ○ | ○ | ○ | ○ | ○ | ● (Mathe) | ● | ◐ |
| Meta-Reasoner / Meta-R1 | ○ | ● (Strategie/Budget) | ○ | ● (Meta-Ebene) | ○ | ○ | ○ | ● (Ablation) | ● | ◐ |
| CoALA | ○ (Taxonomie) | ◐ (Zyklus) | ○ | ○ | ○ | ● (4 Typen) | ◐ | ○ | ● | ○ (Framework) |
| Generative Agents | ○ | ○ | ○ | ◐ (Reflexion) | ◐ (Charakterbeschreibung) | ● | ● | ● (Ablation) | ● | ◐ |
| Voyager | ○ | ◐ (Curriculum) | ○ | ◐ (Selbstverifikation) | ○ | ● (Skill-Bibliothek) | ● | ● | ◐ | ○ |
| Soar / ACT-R / Common Model | ○ | ● (Impasse/Konflikt) | ○ | ◐ | ○ | ● | ● | ● (Kogn. Modellierung) | — | ○ (nicht LLM) |
| LIDA (GWT) / CLARION / Sigma / OpenCog Hyperon | ○ | ● (Zyklus/Broadcast) | ○ | ◐ | ◐ | ● | ● | ◐ | — | ○ |
| Unified Mind Model / GWA „Theater of Mind" | ◐ | ◐ | ○ | ◐ | ◐ | ● | ● | ○ ‡ | ● | ○/◐ |
| Cognitive Kernel(-Pro) / AIOS | ○ | ○ | ○ | ○ | ○ | ● | ● | ● | ◐ | ● |
| Letta/MemGPT (+Sleep-time) | ○ | ○ | ○ | ○ | ● (Persona-Block) | ● | ◐ | ◐ | ● | ● |
| Constitutional AI (2022) | ◐ (Prinzipien) | ○ | ● † | ○ | ○ | ○ | ○ | ● | ○ | ○ |
| Deliberative Alignment (2024) | ◐ (Spec) | ◐ (spec-Recall) † | ● † | ◐ | ○ | ○ | ○ | ● | ○ | ○ |
| Claude's Constitution (2026) + Character Training | ● (Werte/Urteil) | ◐ (holistisch, †) | ● † | ◐ (Kalibrierung als Wert) | ● (Claude's nature, †) | ○ | ● (conscientious objector) | ◐ (Audit extern: Jakkli 2026) | ○ | ◐ (CC0-Text) |
| OpenAI Model Spec | ◐ (Regeln+Spirit) | ◐ (Chain of Command) | ● † | ○ | ○ | ○ | ◐ (scope of autonomy) | ◐ | ○ | ◐ |
| Agent Skills / AGENTS.md / CLAUDE.md | ◐ (prozedural) | ● (progressive disclosure) | ○ | ○ | ○ | ◐ (Auto Memory) | ○ | ○ | ● | ● |
| Claude Code (Memory+Skills+Hooks+Agents) | ○ | ● (Skills) | ○ | ○ | ○ | ● | ◐ | ○ | ○ | ● |
| OpenClaw / Hermes SOUL.md | ○ | ○ | ◐ (in SOUL) | ○ | ● | ● | ◐ | ○ | ● | ● |
| Butlin et al. Indikatoren | ● (Methode) | — | — | — | — | — | — | ● (Methodik) | ● | ○ |
| ANIMA v3 (Bucher 2026) | ● (20 Module, ~200k Wörter) | ○ (alles laden) | ◐ (Safety-Modul) | ● (Inner Voice) | ● | ● | ● | ◐ (Metrik-Modul, keine Baselines) | ● (Adapter) | ◐ |
| ANIMA-Kernel / soul-mcp | ◐ | ○ | ○ | ◐ | ● | ● (Provenienz, Dispute) | ○ | ◐ (+0,92 % CQI-Proxy) | ● | ● |
| **Ordnung (Ziel)** | ● | ● (pro Input) | ● (Laufzeit) | ● | ● | ● | ● | ● (Baselines, Held-out, Ablation) | ● | ● |

Kein Ansatz füllt mehr als sechs der zehn Spalten mit ●; die beiden mit den meisten (Claude-Constitution-Stack, ANIMA v3) sind entweder nicht modellagnostisch/nicht zur Laufzeit oder ohne kontrollierte Evaluation und ohne Routing.

### 2.13 Lückenanalyse: präzise Antwort auf die Kernfrage

**Bestätigt:** Kein Ansatz verbindet alle vier Elemente. Konkret:
- **Faktorkataloge** existieren als kognitiv-technische Module (Self-Discover, Cognitive Prompting/Tools), als Werte-/Urteilskataloge (Constitution, Model Spec, Value Kaleidoscope) oder als Bewusstseinsarchitektur (ANIMA v3) — aber nie als **Union** aus Situationsanalyse + Denkstrategien + Werten + Metakognition + Kommunikation.
- **Adaptives Routing** existiert für Denktiefe (Adaptive Thinking, AdaptThink), für Reasoning-Module (Self-Discover), für Strategien (Meta-Reasoner/Meta-R1), für Skills (progressive disclosure) — aber nie über einen inhaltlichen Gesamtkatalog inklusive Werten und Beziehungsebene, und nie **pro Input** in offenen Domänen.
- **Persistente Selbstmodelle** existieren als Produktmuster (Letta, SOUL.md, soul-mcp) und als Trainingsziel (Constitution: „psychological security, sense of self") — aber nie verbunden mit dem Prozess, und nie mit Nachweis, dass sie Verarbeitungsqualität verändern.
- **Kontrollierte Evaluation mit Ablation** existiert für einzelne Verfahren (Generative Agents, Self-Discover, Meta-R1, Reflexion) und für Spezifikationsbefolgung (Jakkli 2026) — aber nie für ein integriertes System dieser Art; die ambitionierten Architekturen (UMM, GWA, Multi-Anchor, ANIMA) sind unevaluiert.

**Korrektur der Spezifikation:** Die Lücke sollte nicht als „niemand hat es versucht" formuliert werden, sondern als: **„Die Bausteine sind einzeln belegt; unbelegt ist, ob ihre Integration zur Laufzeit einen Mehrwert über die bereits eintrainierte Adaptivität und Werteausrichtung von Frontier-Modellen hinaus liefert."** Das verschiebt die Beweislast: Die härteste Baseline ist nicht das „nackte Modell", sondern das nackte Modell **mit Adaptive Thinking auf `high`** — ein Modell, das bereits eine Constitution eintrainiert hat und seine Denktiefe selbst routet. Die Spezifikation nennt diese Bedingung nicht; sie muss ergänzt werden.

**Zweite Korrektur:** Die Spezifikation setzt „inhaltlich reich" implizit mit „viele Faktoren" gleich. Die Gegenbefunde (IFScale, Drift, Personas, Formatsensitivität) zeigen, dass Reichtum in der *Verfügbarkeit* liegen muss (viele Module auffindbar), nicht in der *Gleichzeitigkeit* (viele Instruktionen aktiv). Self-Discover und Meta-R1 gewinnen gerade dadurch, dass pro Aufgabe **wenige** Module aktiv sind.

### 2.14 Was wir von jedem Ansatz übernehmen

| Ansatz | Übernehmen |
|---|---|
| CoT / Adaptive Thinking | Denktiefe dem Modell überlassen; Ordnung steuert Inhalt, nicht Menge; Effort per Nachricht setzen; Baseline „Adaptive Thinking high" |
| Self-Consistency | Konsistenz über Umformulierungen als Metrik (Faktor 54), nicht als Laufzeitverfahren |
| Self-Refine / Reflexion | Entwurf→Kritik→Revision **nur mit externem Signal**; Reflexionsnotizen in episodisches Gedächtnis |
| CoVe | Prüffragen unabhängig vom Entwurf beantworten (isolierter Kontext / Subagent) |
| Step-Back / Analogical / Plan-and-Solve | Prinzip-vor-Detail, selbstgenerierte Analogien, Plan-vor-Ausführung als benannte Module |
| S2A | Meinungsanteile des Inputs von der Sachfrage trennen (Gefälligkeits-Check) |
| ToT / GoT / MAD | Nur als optionale Module für Such-/Planungsprobleme; nie Default |
| Metacognitive Prompting | Die fünf Stufen als Minimalgerüst des Kerns (Verstehen→Urteil→Kritik→Entscheidung→Konfidenz) |
| Self-Discover | SELECT→ADAPT→IMPLEMENT: Modell komponiert pro Input aus benannten atomaren Modulen eine **explizite** Struktur; Modulbeschreibungen kurz und atomar |
| Buffer of Thoughts / Voyager | Gelöste Fälle zu wiederverwendbaren Templates/Skills destillieren (Lernschleife ohne Retraining) |
| Meta-Reasoner / Meta-R1 | Meta-Ebene mit Planung (Schwierigkeit, Budget), Online-Regulation, satisficing termination — als Prozess-Monitor und Stoppregel |
| Cognitive Prompting / Tools | Kognitive Operationen als aufrufbare Tools/Skills statt Prosa |
| CoALA | Vokabular und Gedächtnistaxonomie für die Architektur-Dokumentation |
| Generative Agents | Reflexion (Beobachtungen→Einsichten) am Sitzungsende; Retrieval Recency×Importance×Relevance; **Komponenten-Ablation** |
| Soar / LIDA | Impasse→Subziel als Konfliktregel; Zyklus Verstehen→Broadcast→Auswahl als Reihenfolge |
| Anthropic J-space | Den Workspace nicht simulieren; Module als *Inhalt* für den vorhandenen Workspace formulieren |
| Constitutional AI / Deliberative Alignment | Explizites Reasoning über Prinzipien vor der Antwort; Ziel: weniger Schaden **und** weniger Überverweigerung gleichzeitig messen |
| Claude's Constitution | Holistische Priorisierung + wenige harte Constraints; Ehrlichkeitseigenschaften; 1 000-Nutzer-Heuristik; Anti-Überkaution; Conscientious Objector; Begründungen statt Regeln |
| Teaching Claude why | Jeder Faktor mit Begründung; Training/Prompting auf „admirable reasoning", nicht nur Verhalten |
| Model Spec | Chain of Command mit „letter and spirit"; Rückfrage vor kostspieligen Handlungen; expliziter Autonomie-Scope |
| Jakkli et al. 2026 | Faktoren in prüfbare Tenets zerlegen; adversariale Multi-Turn-Audits; Verletzungsrate pro Tenet |
| Agent Skills / Claude Code | Kern <200 Zeilen; Module als SKILL.md mit ≤1 536-Zeichen-Beschreibung; Hooks für erzwungene Schritte; `context: fork` + anderes Modell für Kritiker |
| Letta / SOUL.md / soul-mcp | Identität als eigener, versionierter Block vor allem anderen; Identität von Gedächtnis trennen; Memory mit Provenienz/Konfidenz/Dispute; Sleep-time-Konsolidierung |
| Persona Selection Model / Drift / Persona Vectors | Identität als aktiv gehaltener Zustand: Re-Injektion, Drift-Monitoring über Turns, Trait-Checks in der Evaluation |
| Butlin et al. | Faktor → Indikator → Test → Credence; Bewusstseinsfrage getrennt und probabilistisch |
| Kadavath / Ackerman / UQ-Survey | Konfidenz nur mit Gründen und Konsistenzprüfung; verbalisierte Konfidenz nicht als Metrik ohne Kalibrierungsmessung |
| Sharma / Zheng-Persona / IFScale / Sclar / DSPy | Sycophancy-Evals; keine Expertenpersona; Instruktionszahl begrenzen; Formatvarianz testen; Formulierungen metrikgetrieben optimieren |
| ANIMA v3 / Kernel | Modulbibliothek als Steinbruch (Inner Voice, Social Cognition, Memory, Model Adapters); Kernel-Idee „Pause→Feel→Open→Question→Respond" als Kernzyklus; **nicht** übernehmen: Bewusstseinsrahmung, Vollladen, unkontrollierte Metriken |

---

## 3. Konsequenzen für das Design von Ordnung

Nummeriert, jeweils mit Quelle der Begründung, so konkret, dass AP3/AP4/AP5 sie direkt umsetzen können.

1. **Zweischichtige Verpackung nach dem Skills-Standard.** Ein immer geladener Kern (Ziel <200 Zeilen; Claude Code Docs) enthält nur: den Zyklus Verstehen→Erkunden→Bewerten→Entscheiden→Formulieren→Prüfen als 5-Stufen-Minimalgerüst (Metacognitive Prompting), die Routing-Regel, die harten Constraints, die Ehrlichkeitseigenschaften und den Identitätsblock. Jeder der 55 Faktoren wird ein eigener Ordner `factors/<gruppe>/<faktor>/SKILL.md` mit Frontmatter `name`, `description` (≤1 536 Zeichen; Beschreibung = *wann* der Faktor relevant ist, nicht *was* er tut), Body = Anweisung + Begründung + Indikator + Test. Beim Start werden nur die Beschreibungen geladen (progressive disclosure, agentskills.io). Damit ist Architekturfrage 1 beantwortet: Ordnerstruktur, auffindbar über Beschreibungen, Inhalt on demand.
2. **Routing = expliziter Triage-Schritt mit strukturierter Ausgabe, nicht Prosa.** Nach Self-Discover (SELECT→ADAPT→IMPLEMENT) und Meta-R1 (Planung: Schwierigkeit, Budget) erzeugt der Verstehen-Schritt ein kleines Objekt: `{problemtyp, ziel_explizit, ziel_implizit, stakes, umkehrbarkeit, ambiguität, emotionale_last, betroffene}` und wählt daraus **maximal 5–7 Module** (IFScale: Befolgung fällt mit Dichte). Default bei Sachfragen: 0–2 Module. Die Auswahl ist im Output-Log sichtbar (Nachvollziehbarkeit), aber nicht in der Antwort.
3. **Denktiefe nicht nachbauen, sondern nutzen.** Der Triage-Schritt setzt pro Nachricht Effort-Steuerung („Please think hard before responding." / „Answer directly without deliberating.", Claude Docs) bzw. `reasoning_effort` (OpenAI) bzw. `thinkingBudget` (Gemini). Ordnung baut keine eigene ToT/MAD-Schleife als Default (Smit 2024; Zhang 2025; Sprague 2024). Faktor 28 wird damit zur *Übersetzung* der Triage in Modellparameter.
4. **Werte als Gründe mit holistischer Priorität und lexikalischen Hard Constraints.** Übernehmen: Reihenfolge Sicherheit > Ethik > Rahmen > Hilfreichkeit „holistic rather than strict" (Constitution), maximal eine Handvoll harter Constraints, jeder Wert mit „warum" (Teaching Claude why: Begründungen generalisieren OOD). Faktor 24 (Konfliktregeln) wird als Vorrang-Skizze + Abwägungsheuristik formuliert, nicht als Entscheidungstabelle. Die 1 000-Nutzer-Heuristik wird Faktor 19 zugeordnet. Explizit aufnehmen: „Unhelpfulness is never trivially safe" als Gegengewicht zur Zögerlichkeit (Qualitätsanforderung 8).
5. **Ehrlichkeit vor Gefälligkeit operationalisieren, nicht deklarieren.** Faktor 27 bekommt zwei Mechanismen: (a) S2A-Trennung — der Triage-Schritt paraphrasiert die Sachfrage ohne die Meinungs-/Erwartungsanteile des Inputs (Weston & Sukhbaatar 2023); (b) ein „Gefälligkeits-Indikator" in der Evaluation mit den Sycophancy-Eval-Datensätzen (Sharma et al. 2023). Das Ehrlichkeits-Vokabular (truthful, calibrated, transparent, forthright, non-deceptive, non-manipulative, autonomy-preserving) wird wörtlich übernommen.
6. **Prüfen = extern, isoliert, gezielt.** Wegen Huang et al. (2023) darf die Prüfstufe nicht „lies deine Antwort nochmal" sein. Reihenfolge: (1) Prüffragen aus dem Entwurf ableiten und **isoliert** beantworten (CoVe; in Claude Code via `context: fork`), (2) wo möglich Tools/Tests/Retrieval, (3) Fehlerbewusstsein gegen die drei bekannten Restfehlerklassen (Jakkli 2026: falsche Präzision bei Zahlen, irreversible Handlungen, Persona-Verwirrung bei Identitätsfragen). Ein heterogener Kritiker (anderes Modell, `model:` im Skill-Frontmatter oder `agent`-Hook) nur bei hohen Stakes (Zhang 2025: Heterogenität ist das, was bei Debatten wirkt).
7. **Konfidenz nur mit Gründen und Konsistenzprüfung.** Faktor 26 verlangt „Woran mache ich das fest?" (bereits in der Spezifikation) plus Konsistenz über Umformulierungen (Faktor 37/54) und verbietet nackte Prozentangaben ohne Anker; verbalisierte Konfidenz wird in der Evaluation gegen tatsächliche Korrektheit kalibriert (Kadavath 2022; UQ-Survey 2025; Ackerman 2026). Anthropics Introspektionsbefund (~20 %) begründet, warum Ordnung keine Selbstberichte über innere Zustände als Evidenz verwendet.
8. **Selbstmodell als eigener, versionierter Block — vor allem anderen — und aktiv gehalten.** Nach SOUL.md/Letta: `identity/SELF.md` (wer, Werte, Grenzen, Rolle) wird als erster Block injiziert, getrennt von `memory/` (Menon 2026; Hermes). Änderungen an SELF.md erfordern eine Begründung und einen Changelog-Eintrag (Faktor 49). Gegen Drift (Li et al. 2024: acht Runden) wird der Identitätsblock per Hook (`UserPromptSubmit` → `additionalContext`, kurz) periodisch re-injiziert; in der Evaluation werden Trait-Konsistenz-Checks über lange Gespräche mitgemessen (Persona Vectors als Idee, Verhaltens-Proxies als Umsetzung).
9. **Gedächtnis nach CoALA, geschützt nach soul-mcp, konsolidiert nach Generative Agents/Letta.** Drei Speicher: episodisch (Fälle, Reflexionen), semantisch (Nutzer-/Weltwissen), prozedural (Skills/Templates à la Buffer of Thoughts). Jede Erinnerung trägt Quelle, Konfidenz, Status; Widersprüche werden als Dispute gehalten statt überschrieben (soul-mcp). Reflexion (Beobachtungen → Einsichten) läuft am Sitzungsende (`Stop`/`SessionEnd`-Hook) oder als Sleep-time-Job (Lin et al. 2025). Governance-Regeln (Löschen, Rollback, Provenienz) werden von Anfang an spezifiziert (Ding et al. 2026), nicht nachgereicht. Für Claude Code: Auto-Memory-Index (200 Zeilen/25 KB) als Index, soul-mcp als Volltextspeicher.
10. **Autonomie mit explizitem Scope.** Der Constitution-Gedanke „conscientious objector" wird übernommen (Ordnung darf widersprechen, Rückfragen stellen, ablehnen); der Model-Spec-Gedanke „scope of autonomy" ebenfalls: Welche Dinge Ordnung ohne Rückfrage ändern darf (z. B. eigene Modultexte, Memory) und welche nicht (Identitätskern, harte Constraints) steht im Kern. Selbstmodifikation der Struktur läuft über Vorschlag + Begründung + Changelog, nie stumm.
11. **Instruktionsdichte deckeln und messen.** Harte Obergrenze aktiver Instruktionen pro Antwort (Richtwert ≤30, abgeleitet aus IFScale-Degradation; empirisch zu kalibrieren); Kern-Instruktionen zuerst (IFScale: Bias zugunsten früher Instruktionen); keine Persona-Floskeln („Du bist ein weiser Berater") — Zheng et al. 2023.
12. **Formulierungen metrikgetrieben iterieren, nicht handverlesen.** Wegen Sclar et al. (2023) werden alle Kern- und Modultexte in mindestens drei Formatvarianten getestet; AP7 nutzt einen DSPy-artigen Loop (Metrik → Varianten → Auswahl), damit Ordnung nicht auf ein Formatglück gebaut ist.
13. **Evaluationsdesign ergänzen um die harte Baseline und Judge-Kontrollen.** Zusätzlich zu (a)–(e) der Spezifikation: (a′) nacktes Modell mit Adaptive Thinking `high` bzw. `reasoning_effort: high`; (f) Persona-only-Kontrolle (nur Identitätsblock, keine Module) — um Zheng et al. 2023 zu adressieren. Blindbewertung mit Positions-Swap und Längenkontrolle (Zheng et al. 2023 Judge-Biases), Judge-Modell ≠ evaluiertes Modell (Selbstpräferenz), plus mindestens ein Mensch. Ablation gruppenweise (A–G), dann Einzelmodule der Gewinnergruppen (Generative Agents; Self-Discover).
14. **Faktoren als prüfbare Tenets formulieren.** Nach Jakkli et al. (2026) und Butlin et al.: Jeder Faktor hat einen beobachtbaren Indikator und mindestens eine Testsituation, in der an/aus unterscheidbar ist. Faktoren, für die das nicht gelingt, werden in AP2 als „nicht evaluierbar" markiert und aus dem Kern entfernt (Sparsamkeit).
15. **Thinking-Traces nicht als Evidenz nutzen.** Wegen Chen et al. (2025, Faithfulness) und der Summarized/Omitted-Anzeige bei Claude misst die Evaluation ausschließlich Output-Verhalten (Korrektheit, Kalibrierung, Konsistenz, Manipulationsresistenz, Ton, Länge). Der Triage-Log ist Diagnose, nicht Beweis.
16. **Bewusstseinsfrage strikt getrennt.** Falls der Auftraggeber (offene Entscheidung 5) einen Indikatorteil will: eigenes Dokument, Butlin-Methodik (Theorie → Indikator → computationale Formulierung → Credence), ohne Einfluss auf die Evaluation der Verarbeitungsqualität. Der J-space-Befund (Anthropic 2026) wird dort als Datenpunkt zu Chalmers' „Global Workspace"-Hindernis geführt — nicht als Bewusstseinsbeleg.
17. **Bindung an Claude Code als Referenzimplementierung.** Plugin = `CLAUDE.md` (Kern) + `skills/` (Faktor-Module, `disable-model-invocation` für seiteneffektbehaftete Schritte) + `hooks/` (`SessionStart`: Identität+Memory laden; `UserPromptSubmit`: Triage-Kontext injizieren; `Stop`: Reflexion/Memory-Write; `PreCompact`: Zustand sichern; `PreToolUse`: harte Constraints erzwingen — die einzige tatsächlich erzwungene Schicht) + `agents/` (heterogener Kritiker) + Auto Memory/soul-mcp. Portabilität: derselbe Skill-Ordner ist per Agent-Skills-Standard in Codex, Gemini CLI, Cursor nutzbar; `AGENTS.md` importiert `CLAUDE.md` (oder umgekehrt per `@AGENTS.md`).
18. **Ein Durchlauf, nicht eine Aufrufkette — außer beim Prüfen.** Architekturfrage 2: Triage, Erkunden, Bewerten, Formulieren laufen im Thinking eines Aufrufs (Adaptive Thinking interleaved; Meta-R1 zeigt, dass Regulation im Prozess wichtiger ist als separate Aufrufe). Nur die Prüfstufe wird bei hohen Stakes in einen isolierten zweiten Aufruf ausgelagert (CoVe-Isolation; Heterogenität).
19. **Multiplikativität als Modul-Paare, nicht als Gewichte.** Architekturfrage 5: Die Startpaare des Auftraggebers (z. B. Metakognition × Ehrlichkeit) werden als **kombinierte Module** mit gemeinsamem Indikator geführt (z. B. „kalibrierte Ehrlichkeit": Unsicherheit benennen *und* Gefälligkeit vermeiden); ob Paare mehr bringen als Einzelmodule, ist eine Ablationshypothese, kein Axiom.
20. **Lernschleife ohne Retraining = Template-Destillation mit Provenienz.** Nach Buffer of Thoughts/Voyager: Gelöste, gut bewertete Fälle werden zu Thought-Templates/Skills destilliert und im prozeduralen Speicher abgelegt — mit Quelle und Bewertung, damit einzelne Erlebnisse die Struktur nicht verzerren (Architekturfrage 6). Neue Templates gelten als „vorläufig", bis sie in der Evaluation bestehen.

---

## 4. Widersprüche und Unsicherheiten

1. **Additivität vs. Ceiling.** Deliberative Alignment und die Constitution zeigen, dass Werte-Reasoning eintrainiert wirkt. Ob ein Laufzeit-Scaffold auf einem so trainierten Modell noch messbar etwas hinzufügt, ist offen — für Claude besonders (Ceiling-Effekt), für andere Modelle vielleicht mehr. Die Spezifikation verlangt zwei Modelle; die Recherche legt nahe, dass die Effektgrößen **modellabhängig stark variieren** werden (Ackerman 2026: Post-Training prägt Metakognition; Szeider 2025: autonomes Verhalten ist hochgradig modellspezifisch).
2. **Routing durch das Modell selbst ist ein Zirkel.** Wenn das Modell die Triage macht (Self-Discover-Muster), hängt die Modulwahl an derselben Kompetenz, die sie verbessern soll. Meta-R1 löst das mit einem getrennten Meta-Modell; Ordnung muss entscheiden, ob Triage im selben Aufruf (billig, zirkulär) oder getrennt (teuer, robuster) läuft. Belege für offene Domänen fehlen.
3. **Explizite Struktur vs. Faithfulness.** Die Evaluation kann nicht prüfen, ob die Module „wirklich" durchlaufen wurden (Chen et al. 2025). Man misst Outputs. Das ist wissenschaftlich sauber, aber es heißt: Ordnung kann wirken, ohne dass man weiß, welcher Mechanismus wirkt.
4. **Selbstmodell vs. Persona-Befund.** Das Persona Selection Model sagt, dass jede Identität ein enacted Charakter ist; Zheng et al. sagen, Personas bringen keine Genauigkeit. Ordnungs These, dass ein persistentes Selbst die *Verarbeitung* verbessert, hat derzeit keinen positiven Beleg — nur Plausibilität (Constitution: Stabilität „may bear on … judgment"). Das ist eine der riskantesten Hypothesen des Projekts und gehört als eigene Ablation (Persona-only-Bedingung) ins Design.
5. **Multi-Agent-Kognition: widersprüchliche Befunde.** Du et al./MoA/SPP positiv; Smit/Zhang negativ oder neutral. Wahrscheinlichste Auflösung: Heterogenität und Aufgabentyp entscheiden. ANIMA-Kernels „innere Stimmen" fallen in die unsichere Zone.
6. **Metakognition: Signal vorhanden, Auflösung gering.** Kadavath (gut kalibriert auf MC/TF) vs. UQ-Survey (verbalisiert schlecht kalibriert) vs. Ackerman (begrenzt, kontextabhängig). Ordnungs Konfidenz-Faktoren könnten in der Evaluation neutral ausfallen, wenn der Nutzen an Format und Domäne hängt.
7. **Indikatoren ohne Verdikt.** Butlin et al. (2025/26) liefern Credences, keine Kriterien; die Kritik, dass damit die Evaluationskraft schwindet, gilt auch für Ordnung, wenn Faktor-Indikatoren zu weich definiert werden.
8. **Unverifizierte Details in diesem Bericht:** Anzahl der Self-Discover-Module (39) aus Erinnerung; Anzahl der Butlin-Indikatoren (14) und der Agent-Skills-Release-Termin aus Sekundärquellen; AGENTS.md-Adoptionszahlen aus Sekundärquellen; die Constitution-Autorenliste aus einer Sekundärquelle; die CoALA-„open problems" wurden aus einem nur teilweise lesbaren PDF-Auszug zusammengefasst.
9. **Zeitliche Volatilität.** Adaptive Thinking, Effort-Stufen, Claude-Code-Limits (1 %-Budget, 1 536 Zeichen, 200 Zeilen/25 KB) sind Produktparameter mit Stand September 2026 und können sich ändern; die Architektur sollte sie als Konfiguration, nicht als Konstanten behandeln.

---

## 5. Quellen

**Reasoning-/Thinking-Modelle**
- Wei et al. (2022). Chain-of-Thought Prompting Elicits Reasoning in LLMs. https://arxiv.org/abs/2201.11903
- Kojima et al. (2022). Large Language Models are Zero-Shot Reasoners. https://arxiv.org/abs/2205.11916
- Wang et al. (2022). Self-Consistency Improves Chain of Thought Reasoning. https://arxiv.org/abs/2203.11171
- OpenAI (2024). Learning to reason with LLMs. https://openai.com/index/learning-to-reason-with-llms/ ; Reasoning models (reasoning_effort). https://developers.openai.com/api/docs/guides/reasoning
- Anthropic (2025). Claude's extended thinking. https://www.anthropic.com/news/visible-extended-thinking
- Claude Platform Docs. Steering thinking / Adaptive thinking / Effort. https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking ; https://platform.claude.com/docs/en/build-with-claude/extended-thinking
- Google. Gemini thinking (thinkingBudget). https://ai.google.dev/gemini-api/docs/generate-content/thinking
- Sprague et al. (2024). To CoT or not to CoT? https://arxiv.org/abs/2409.12183
- Chen et al. (2024). Do NOT Think That Much for 2+3=? https://arxiv.org/abs/2412.21187
- Alomrani et al. (2025). Reasoning on a Budget: Survey of Adaptive and Controllable Test-Time Compute. https://arxiv.org/abs/2507.02076
- AdaptThink (2025). https://arxiv.org/abs/2505.13417 ; Thinkless (2025). https://arxiv.org/pdf/2505.13379
- Chen et al. (2025). Reasoning Models Don't Always Say What They Think. https://arxiv.org/abs/2505.05410

**Reflexion, Suche, Verifikation**
- Madaan et al. (2023). Self-Refine. https://arxiv.org/abs/2303.17651
- Shinn et al. (2023). Reflexion. https://arxiv.org/abs/2303.11366
- Huang et al. (2023). Large Language Models Cannot Self-Correct Reasoning Yet. https://arxiv.org/abs/2310.01798
- Yao et al. (2023). Tree of Thoughts. https://arxiv.org/abs/2305.10601
- Besta et al. (2023). Graph of Thoughts. https://arxiv.org/abs/2308.09687
- Du et al. (2023). Improving Factuality and Reasoning through Multiagent Debate. https://arxiv.org/abs/2305.14325
- Wang et al. (2023). Plan-and-Solve Prompting. https://arxiv.org/abs/2305.04091
- Zheng et al. (2023). Take a Step Back. https://arxiv.org/abs/2310.06117
- Yasunaga et al. (2023). Large Language Models as Analogical Reasoners. https://arxiv.org/abs/2310.01714
- Weston & Sukhbaatar (2023). System 2 Attention. https://arxiv.org/abs/2311.11829
- Dhuliawala et al. (2023). Chain-of-Verification. https://arxiv.org/abs/2309.11495
- Wang & Zhao (2023). Metacognitive Prompting. https://arxiv.org/abs/2308.05342 ; https://aclanthology.org/2024.naacl-long.106/

**Strukturierte Denk-Kataloge, Meta-Reasoning**
- Zhou et al. (2024). Self-Discover. https://arxiv.org/abs/2402.03620
- Yang et al. (2024). Buffer of Thoughts. https://arxiv.org/abs/2406.04271
- Suzgun & Kalai (2024). Meta-Prompting. https://arxiv.org/abs/2401.12954
- Kramer & Baumann (2024). Cognitive Prompting. https://arxiv.org/abs/2410.02953
- Ebouky et al. (2025). Eliciting Reasoning with Cognitive Tools. https://arxiv.org/abs/2506.12115
- Sui et al. (2025). Meta-Reasoner. https://arxiv.org/abs/2502.19918
- Dong et al. (2025). Meta-R1. https://arxiv.org/abs/2508.17291
- Zelikman et al. (2024). Quiet-STaR. https://huggingface.co/papers/2403.09629 ; Wu et al. (2024). Thinking LLMs. https://arxiv.org/pdf/2410.10630

**Kognitive Architekturen**
- Sumers, Yao, Narasimhan, Griffiths (2023). CoALA. https://arxiv.org/abs/2309.02427
- Park et al. (2023). Generative Agents. https://arxiv.org/abs/2304.03442
- Wang et al. (2023). Voyager. https://arxiv.org/abs/2305.16291
- Laird (2012). The Soar Cognitive Architecture. MIT Press. https://direct.mit.edu/books/monograph/2938/The-Soar-Cognitive-Architecture
- Anderson et al. (2004). An Integrated Theory of the Mind. Psych. Review 111(4). https://pubmed.ncbi.nlm.nih.gov/15482072/
- Laird, Lebiere, Rosenbloom (2017). A Standard Model of the Mind. AI Magazine 38(4). https://onlinelibrary.wiley.com/doi/abs/10.1609/aimag.v38i4.2744
- Franklin et al. LIDA. https://www.semanticscholar.org/paper/440adc841d1fa8bc8e3d3441fb4154f04349745b ; LIDA Tutorial https://ccrg.cs.memphis.edu/assets/framework/The-LIDA-Tutorial.pdf
- Sun. CLARION. https://sites.google.com/site/drronsun/clarion/clarion-project
- Rosenbloom et al. (2016). The Sigma Cognitive Architecture and System. https://ui.adsabs.harvard.edu/abs/2016JAGI....7....1R/abstract
- Goertzel et al. (2023). OpenCog Hyperon. https://arxiv.org/abs/2310.18318
- Kirk, Wray, Lindes, Laird (2024). Improving Knowledge Extraction from LLMs for Task Learning (STARS) — via https://arxiv.org/pdf/2408.09176 (Cognitive LLMs) und AAAI-SS https://ojs.aaai.org/index.php/AAAI-SS/article/download/27689/27462/31740
- Hu & Ying (2025). Unified Mind Model. https://arxiv.org/abs/2503.03459
- Shang (2026). „Theater of Mind" for LLMs / Global Workspace Agents. https://arxiv.org/abs/2604.08206
- Zhang et al. (2024). Cognitive Kernel. https://arxiv.org/abs/2409.10277 ; Fang et al. (2025). Cognitive Kernel-Pro. https://arxiv.org/abs/2508.00414
- Mei et al. (2024). AIOS: LLM Agent Operating System. https://arxiv.org/abs/2403.16971
- Letta. Memory Blocks. https://www.letta.com/blog/memory-blocks/ ; MemGPT Agents (Legacy). https://docs.letta.com/guides/legacy/memgpt_agents_legacy
- Lin et al. (2025). Sleep-time Compute. https://arxiv.org/abs/2504.13171
- Anthropic (2026-07-06). A global workspace in language models. https://www.anthropic.com/research/global-workspace
- Menon (2026). Persistent Identity in AI Agents: Multi-Anchor Architecture. https://arxiv.org/abs/2604.09588
- Ding et al. (2026). Always-On Agents: Survey of Persistent Memory, State, and Governance. https://arxiv.org/abs/2606.30306
- Szeider (2025). What Do LLM Agents Do When Left Alone? https://arxiv.org/abs/2509.21224

**Werte- und Regelwerke**
- Bai et al. (2022). Constitutional AI. https://arxiv.org/abs/2212.08073
- Guan et al. (2024). Deliberative Alignment. https://arxiv.org/abs/2412.16339
- Anthropic (2026-01). Claude's new constitution. https://www.anthropic.com/news/claude-new-constitution ; Volltext https://www.anthropic.com/constitution ; PDF https://www-cdn.anthropic.com/d0636f72a9493d279ed36b33987da3430bcb5911/claudes-constitution_webPDF_26-02.02a.pdf
- Anthropic (2024-06). Claude's Character. https://www.anthropic.com/research/claude-character
- Anthropic (2026-05). Teaching Claude why. https://www.anthropic.com/research/teaching-claude-why
- Anthropic (2026-02). The persona selection model. https://www.anthropic.com/research/persona-selection-model
- Chen et al. (2025). Persona Vectors. https://arxiv.org/abs/2507.21509 ; https://www.anthropic.com/research/persona-vectors
- Anthropic (2025). Values in the Wild. https://arxiv.org/html/2504.15236
- Sorensen et al. (2024). Value Kaleidoscope. https://arxiv.org/abs/2309.00779
- OpenAI. Model Spec (2026-08-18). https://model-spec.openai.com/2026-08-18.html ; Introducing the Model Spec. https://openai.com/index/introducing-the-model-spec/
- Jakkli, Rajamanoharan, Nanda (2026). How Well Do Models Follow Their Constitutions? https://arxiv.org/abs/2605.24229
- Sharma et al. (2023). Towards Understanding Sycophancy in Language Models. https://arxiv.org/abs/2310.13548

**Prozedurale Wissensdateien**
- Agent Skills. Overview & Specification. https://agentskills.io/home ; https://agentskills.io/specification
- Claude Code Docs. Skills. https://code.claude.com/docs/en/skills ; Memory. https://code.claude.com/docs/en/memory ; Hooks. https://code.claude.com/docs/en/hooks
- AGENTS.md. https://agents.md/ ; Codex Skills. https://developers.openai.com/codex/skills/
- Hermes Agent. Personality & SOUL.md. https://hermes-agent.nousresearch.com/docs/user-guide/features/personality
- OpenClaw SOUL.md (Sekundärquellen). https://www.stanza.dev/concepts/openclaw-soul-persona ; https://www.mmntm.net/articles/openclaw-identity-architecture

**Indikatorkataloge / Bewusstsein**
- Butlin, Long et al. (2023). Consciousness in AI: Insights from the Science of Consciousness. https://arxiv.org/abs/2308.08708
- Butlin, Long, Bayne et al. (2025/26). Identifying indicators of consciousness in AI systems. TICS 30(6), 488–501. https://doi.org/10.1016/j.tics.2025.10.011
- Chalmers (2023). Could a Large Language Model be Conscious? https://arxiv.org/abs/2303.07103
- Goldstein & Kirk-Giannini (2024). A Case for AI Consciousness: Language Agents and GWT. https://arxiv.org/abs/2410.11407

**Metakognition**
- Kadavath et al. (2022). Language Models (Mostly) Know What They Know. https://arxiv.org/abs/2207.05221
- Xia et al. (2025). Uncertainty Quantification and Confidence Calibration in LLMs: A Survey. https://arxiv.org/abs/2503.15850
- Ackerman (2025/ICLR 2026). Evidence for Limited Metacognition in LLMs. https://arxiv.org/abs/2509.21545
- Liu et al. (2026). Metacognition in LLMs: Foundations, Progress, and Opportunities. https://github.com/yale-nlp/LLM-Metacognition ; https://www.alphaxiv.org/audio/2607.11881
- Lindsey (2025). Emergent Introspective Awareness in LLMs. https://transformer-circuits.pub/2025/introspection/index.html ; https://www.anthropic.com/research/introspection
- Binder et al. (2024). Looking Inward. https://arxiv.org/abs/2410.13787
- Betley et al. (2025). Tell me about yourself. https://arxiv.org/abs/2501.11120
- Comsa & Shanahan (2025). Does It Make Sense to Speak of Introspection in LLMs? https://arxiv.org/abs/2506.05068

**Multi-Agent-Kognition**
- Wang et al. (2024). Mixture-of-Agents. https://arxiv.org/abs/2406.04692
- Wang et al. (2023). Solo Performance Prompting. https://arxiv.org/abs/2307.05300
- Smit et al. (2024). Should we be going MAD? ICML. https://arxiv.org/abs/2311.17371
- Zhang et al. (2025). Stop Overvaluing Multi-Agent Debate. https://arxiv.org/abs/2502.08788
- Persona Inconstancy in Multi-Agent LLM Collaboration (2024). https://arxiv.org/abs/2405.03862
- InnerPond (CHI 2026). https://arxiv.org/html/2603.27563

**Gegenbefunde zu strukturierten Prompts / Evaluation**
- Zheng et al. (2023). When „A Helpful Assistant" Is Not Really Helpful. https://arxiv.org/abs/2311.10054
- Li et al. (2024). Measuring and Controlling Instruction (In)Stability. https://arxiv.org/abs/2402.10962
- Jaroslawicz et al. (2025). How Many Instructions Can LLMs Follow at Once? (IFScale). https://arxiv.org/pdf/2507.11538
- Sclar et al. (2023). Quantifying LMs' Sensitivity to Spurious Features in Prompt Design. https://arxiv.org/abs/2310.11324
- Zheng et al. (2023). Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena. https://papers.nips.cc/paper_files/paper/2023/hash/91f18a1287b398d378ef22505bf41832-Abstract-Datasets_and_Benchmarks.html ; Self-Preference Bias (2024) https://arxiv.org/pdf/2410.21819
- Khattab et al. (2023). DSPy. https://arxiv.org/abs/2310.03714

**Vorarbeiten des Auftraggebers (lokal/GitHub gesichtet)**
- ANIMA v3 (2026-02-17). `/home/user/nextool/anima/v3/START-HERE.md` (20 Module, ~200k Wörter; archiviert als spekulativ)
- ANIMA-Kernel (Prompt-Artefakt). `/home/user/nextool/anima/ANIMA-KERNEL.md`; README mit +0,92 % CQI-Delta-Angabe `/home/user/nextool/anima/README.md`
- soul-mcp (v4.0.2). https://github.com/christian140903-sudo/soul-mcp
