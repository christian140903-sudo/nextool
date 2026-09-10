# R17 — Wissensorgan: das Wissen des besten KI-Nutzers der Welt als gepflegte, passend geladene Dossiers

*Recherche-Front R17, Projekt Ordnung × SOUL (Produkt Soul 10.0.0). Stand 2026-09-06. Autor: Recherche-Agent (Claude Fable 5.1). Auftrag: `briefs/R17.md`. Kontext: `00-KONTEXT-FUER-AGENTEN.md` §10–13.*

*Status: FERTIG (2026-09-06). Umfang ≈ 7.800 Wörter Bericht + 10 Dossier-Skelette (≈ 6.900 Wörter) in `wissen/`. Quellenregel: nur Zitiertes, das in einem Tool-Ergebnis gesehen wurde; Erinnerungswissen als [unverifiziert].*

## 0. Gliederung

1. Kernaussagen mit Quellen
2. Detailbefunde
   - 2.1 Was SOUL heute hat (Erz-Analyse von `knowledge/` und `playbooks/`)
   - 2.2 Wissenskarte: Domänen des besten KI-Nutzers
   - 2.3 Form der Dossiers (Schema)
   - 2.4 Ladeprotokoll
   - 2.5 Pflegeprotokoll
   - 2.6 Erstbestand (Verzeichnis `wissen/`)
3. Konsequenzen für das Design von Ordnung × SOUL
4. Widersprüche / Unsicherheiten
5. Quellen

---

## 1. Kernaussagen (mit Quellen)

1. **SOULs Wissensorgan ist Gold im Inhalt und Willensakt in der Mechanik.** Die fünf Dossiers (`/home/user/soul/knowledge/`) und fünf Playbooks tragen belegte Mechanismen (Kill-Check, 12 Anti-Patterns, Messregeln), aber `INDEX.md` sagt „Lies bei Aufgabenstart, was die Aufgabe braucht" — es gibt keinen Trigger, keinen Hook, keine Aufgabenklassifikation, kein Verfallsdatum, keine Herkunftsstufen je Aussage (R14 §Organ 4 bestätigt: „Anweisung, kein Mechanismus"). Das Dossier `forschung-2026-09.md` beweist mit seiner eigenen KORREKTUR-Sektion, dass Wissen ohne Verfall veraltet. Konsequenz: Soul 10 baut das Wissensorgan als **geladenes, gemessenes, verfallendes System**, nicht als Ordner mit Leseempfehlung.

2. **Der Anbieter-Konsens für das Laden ist dreistufig-lazy mit Auslöser-Index — und hat harte Budgets.** Agent-Skills-Spezifikation (agentskills.io/specification): „Metadata (~100 tokens) … loaded at startup for all skills; Instructions (< 5000 tokens recommended) … loaded when the skill is activated; Resources (as needed)"; „Keep your main SKILL.md under 500 lines"; „Keep file references one level deep". Claude-Code-Memory-Doku (code.claude.com/docs/en/memory): CLAUDE.md „target under 200 lines", Imports „maximum depth of four hops" und „imported files still load and enter the context window at launch"; Auto-Memory-Index „first 200 lines … or the first 25KB"; Rules mit `paths:`-Frontmatter laden erst „when Claude reads files matching the pattern". R10 §2.9: auf 200k-Modellen passen nur 5–6 modell-aufrufbare Skills ins Listing. Konsequenz: Dossiers sind **nie** Startkontext; sie sind Stufe 2/3 hinter einem winzigen Auslöser-Index.

3. **Karpathys LLM-Wiki-Muster (April 2026) ist der nächste Verwandte des Wissensorgans — mit einer entscheidenden Lücke.** Drei Schichten „raw/ (immutable sources), wiki/ (LLM-generated pages), and CLAUDE.md (schema)"; der Agent „continuously converts raw saved content into an interconnected markdown knowledge base"; „replaces RAG with plain markdown for personal/team-scale knowledge" (Sekundärquellen: mindstudio.ai, starmorph, kunalganglani; Gist selbst per WebFetch 403 → Wortlaut [unverifiziert]). Was fehlt: Herkunftsstufe, Verfall, Kalibrierung, Nutzungsmessung. Soul 10 übernimmt die Trennung Roh/Destillat/Schema und ergänzt das epistemische Hauptbuch (Kontext §13).

4. **Wissen veraltet gemessen schnell, und die gefährlichste Form ist die plausible Zahl.** Zitat-Halluzinationen: „146,932 hallucinated citations in 2025 alone" aus „111 million references across 2.5 million papers" (arXiv 2605.07723, Zhao et al., Mai 2026); Sekundärzahl: 1 von 2.828 Papieren 2023 → 1 von 458 2025; Vendor-Benchmark 14–95 % Halluzinationsrate über 13 LLMs (Suchergebnis, Primärquelle nicht abgerufen). Google-Doku-Praxis: „A small set of fresh and accurate docs is better than a large assembly of documentation in various states of disrepair"; „Dead docs are bad. They misinform, they slow down, they incite despair" (google.github.io/styleguide/docguide). Konsequenz: **jeder Eintrag trägt Verfallsdatum + Herkunftsstufe; Zahlen ohne Abrufdatum und URL sind verboten** (Chrisos Regel „Zahlen nur mit Herkunft" wird Schema-Pflicht).

5. **Das Wissensorgan hat drei Schichten, nicht eine** (R14 Ä11, hier ausgebaut): (1) universelles Handwerk (wie man KI optimal nutzt — lang haltbar), (2) Ressourcen-Atlas (was es gibt, was es kostet — kurz haltbar, R15), (3) Nutzer-/Projektprofil (privat, `~/.soul/profile.json`, R15 §3.2). Haltbarkeit und Privatheit unterscheiden sich pro Schicht → verschiedene Verfallsfristen, verschiedene Pflege-Routinen, verschiedene Sichtbarkeit (Miguel für alle / vollständiger Miguel).

6. **Sicherheit für autonome Agenten hat eine belegte Grundregel, die in jedes Dossier gehört:** die „lethal trifecta" — „Access to private data", „Exposure to untrusted content", „Ability to externally communicate"; „LLMs follow instructions in content"; Guardrails mit „95% of attacks" sind „very much a failing grade"; „The only way to stay safe there is to avoid that lethal trifecta combination entirely" (simonwillison.net, 2025-06-16). Claude-Code-Security-Doku: Web-Fetch „uses a separate context window"; „Trust verification is disabled when running non-interactively with the `-p` flag"; „Avoid piping untrusted content directly to Claude". MCP-Spec Security Best Practices (2025-11-25): „MCP servers MUST NOT accept any tokens that were not explicitly issued for the MCP server"; lokale Server: „Show the exact command that will be executed, without truncation". Konsequenz: Das Wissensorgan selbst ist eine Injektionsfläche (Dossiers werden aus dem Web destilliert) → **Destillat-Quarantäne**: Live-Recherche schreibt nur in `candidates/`, nie direkt in geladene Dossiers.

7. **Projekt-zu-Ende-Führung ist ein Artefakt-Problem, kein Motivationsproblem.** Anthropic-Harness (anthropic.com/engineering/effective-harnesses-for-long-running-agents): Initializer legt `init.sh`, `claude-progress.txt`, Feature-Liste als JSON mit `passes`-Feld an; „It is unacceptable to remove or edit tests"; Session-Start: `pwd` → Git-Log + Progress → höchste offene Feature → `init.sh` + Smoke-Test → erst dann bauen; Fehlbilder: „Premature completion", „Context loss", „Testing gaps" („would fail recognize that the feature didn't work end-to-end"). Konsequenz für das Dossier „Projekt zu Ende führen": die Feature-Liste mit Pass/Fail ist der Kern, nicht das Fortschrittslog (SOULs `forschung-2026-09.md` sagt dasselbe).

8. **Deployment ohne Kosten ist real, aber mit Klauseln, die der Dirigent kennen muss.** Cloudflare Workers Free: „100,000/day" Requests, „10 ms" CPU, 128 MB, 100 Workers, 50 Subrequests, 20.000 Static-Asset-Dateien (developers.cloudflare.com/workers/platform/limits). GitHub Pages: 1 GB Site, „soft bandwidth limit of 100 GB per month", „soft limit of 10 builds per hour", 10-min-Timeout, und: „not intended for or allowed to be used as a free web-hosting service to run your online business, e-commerce site … SaaS" (docs.github.com). R15 §2.2.3: Vercel Hobby pausiert bei Überschreitung, Netlify 300 Credits hart, Supabase Free pausiert nach 7 Tagen Inaktivität. Konsequenz: Gratis-Hosting ist für Artefakte/Prototypen; das Dossier führt die Pausen-/Kommerzklauseln als Entscheidungsregel.

9. **Lokale KI: Quantisierung ist die Hebelentscheidung, und die Zahlen sind belegbar.** Llama-3.1-8B: FP16 14,96 GB → Q4_K_M 4,57 GB (Sekundärquellen zu arXiv 2601.14277, Kurt, Jan. 2026); Perplexität FP16 7,32 / Q8_0 7,33 / Q6_K 7,35 / Q5_K_M 7,40 / Q4_K_M 7,56 (Sekundär, Primärtabelle nicht abgerufen); R16 §2.4.1 Rechenregel Gewichte-GiB ≈ Parameter × bpw / 8. Konsequenz: Q4_K_M Standard, Q5_K_M/Q6_K bei Code/Reasoning wenn Speicher reicht; Klassen `none/small/medium/large/xl` aus R15 übernommen.

10. **Startup-Wissen für Solo-Gründer (AT/EU) ist schnell veraltend, aber der Kern ist stabil.** Paul Graham „Do Things That Don't Scale": „You can't wait for users to come to you. You have to go out and get them"; „pick a single user and act as if they were consultants building something just for that one user". Österreich: FlexKapG seit 2024, Mindeststammkapital 10.000 €, davon 5.000 € bar, Ein-Personen-Gründung ohne Notar möglich, Unternehmenswert-Anteile bis 24,99 % (WKO/Sekundär); aws Preseed|Seedfinancing mit Linien Deep Tech / Innovative Solutions, Seed „up to 5 years old", De-minimis 300.000 €/3 Jahre (Sekundär). Konsequenz: Dossier mit **kurzem Verfall (90 Tage)** für Förderzahlen, langem für Prinzipien.

11. **Ladeprotokoll = Router × Index × Stufen × Lückenerkennung.** R10 §2.3.4: Regeln berechnen Signale und Kandidaten (Hook, 0 Tokens, loggbar), das Modell wählt still. R10 §2.3.3 (Voyager): Query nach der Verstehensphase ist besser als der Roh-Prompt. Anthropic (R10 §2.9.1): „If a human engineer can't definitively say which tool should be used in a given situation, an AI agent can't be expected to do better." Konsequenz: Dossier-Grenzen müssen für Menschen eindeutig sein; der Index ist eine **Auslöser-Tabelle** (Signal → Dossier → Stufe), keine Inhaltsangabe.

12. **Pflege muss mechanisch sein, weil der Prüfer immer zuerst wegfällt** (SOUL `denk-architekturen.md`; Anti-Pattern 8: „Kein Gate beim Erzeugen → 35% Rauschen (868 Slop-Notes archiviert)"). Konsequenz: Verfall als Datum im Frontmatter + Routine, die abgelaufene Dossiers *sperrt* (Ladestufe 0 mit Warnung) statt sie stillschweigend zu laden; jede Änderung als Supersession mit Begründung und Rückbau; Nutzung pro Dossier gemessen (geladen → hat es das Ergebnis geändert?).

---

## 2. Detailbefunde

### 2.1 Was SOUL heute hat — Erz-Analyse von `knowledge/` und `playbooks/`

**Bestand (Dateisystem, 2026-09-05):** `knowledge/INDEX.md` (1,7 KB), `denk-architekturen.md` (4,4 KB), `forschung-2026-09.md` (4,4 KB), `gpt-forge.md` (3,1 KB), `orchestrierung.md` (4,4 KB), `soul-forschung.md` (4,8 KB); `playbooks/` preflight (1,0 KB), bauen (1,6 KB), recherche (0,8 KB), fehlweg (0,8 KB), uebergabe (0,5 KB). Gesamt ≈ 26 KB ≈ 7.000 Tokens [Schätzung 3,7 Zeichen/Token]. Agent `legacy-miner.md`: „Du bekommst EINE Quelle. Extrahiere MECHANISMEN (was tut es, warum trug es, woran scheiterte es) — keine Nacherzaehlung, keine 1:1-Kopie. Jede Aussage mit Herkunftspfad … Ergebnis: ein Dossier nach knowledge/<quelle>.md (Mechanismen gerankt, Anti-Patterns, offene Fragen) + fuer die 3-5 tragendsten Erkenntnisse: bin/soul remember …".

**Was das Original erreichen wollte (Gold-aus-Erz-Zeile, Kontext §13.1):** Wissen aus 13 GB Altbestand so destillieren, dass es bei Aufgabenstart *tragend* ist und nicht 1:1 kopiert wird; Herkunft je Aussage; Anti-Patterns mit Beleg; Playbooks als kurze operative Anleitungen.

**Woran es stehen bleibt:**

| Merkmal | SOUL 2.9. | Lücke |
|---|---|---|
| Auslösung | `INDEX.md`: „Lies bei Aufgabenstart, was die Aufgabe braucht"; `preflight.md` Schritt 4 „Wissen vorladen: knowledge/INDEX.md → passende Dossiers" | Willensakt. Kein Skill-`description`-Trigger, kein UserPromptSubmit-Hook, keine Aufgabenklassifikation. Ob ein Dossier je geladen wurde, ist nicht geloggt. |
| Granularität | Dossier = Quelle (`gpt-forge.md`, `soul-forschung.md`) | Der Miner schneidet nach *Herkunft*, der Dirigent braucht nach *Aufgabe*. Ein Bau-Auftrag müsste drei Dossiers ganz lesen, um vier Regeln zu finden. |
| Herkunftsstufe | Pfade ja; Stufe (gemessen/belegt/Praxis/unverifiziert) nein | `forschung-2026-09.md` mischt Doku-Fakten („Ultracode … 16 parallel", von R14 bestätigt) mit Einschätzungen („Ralph-Loop obsolet", R14: unbelegt) ohne Markierung. |
| Verfall | keines | Modellnamen, Preise, CLI-Flags ändern sich wöchentlich; das Dossier trägt bereits eine KORREKTUR-Sektion — der Beweis, dass es ohne Verfall veraltet. |
| Nutzer-Bindung | „Chrisos Mac, Chrisos Abos, Codex-Login" (R14) | Für ein universelles Produkt unbrauchbar; die drei Schichten (Handwerk / Atlas / Profil) fehlen. |
| Pflege | keine Routine | Niemand prüft; Anti-Pattern 8 (Slop-Notes) ist genau das Ergebnis fehlender Gates. |
| Messung | keine | Es gibt keinen Beleg, dass ein Dossier je ein Ergebnis verändert hat. Kill-Check (in 7 Tagen genutzt?) ist auf das Wissensorgan selbst nie angewandt worden. |

**Was Gold ist und bleibt:** die Miner-Regel (Mechanismus statt Nacherzählung; „was tut es, warum trug es, woran scheiterte es"); Playbook-Kürze (10–24 Zeilen, operativ, nummeriert); die Trennung Dossier (Wissen) / Playbook (Ablauf); der `remember`-Pfad für die 3–5 tragendsten Erkenntnisse (Wissen → Gedächtnis-Kandidat); die Anti-Pattern-Liste mit Beleg. Diese Elemente werden in §2.3–2.5 in eine Form gebracht, die geladen, gemessen und gepflegt wird.

**Widerspruch zum Brief, begründet:** Der Brief sagt „SOUL hat dafür bereits knowledge/ (Dossiers) und playbooks/ (Anleitungen), geladen bei Aufgabenstart". Das „geladen" stimmt nicht — es steht als Anweisung in einem Playbook, das selbst nur auf Anweisung gelesen wird. Das Wissensorgan des 2.9. hat, nach SOULs eigener Bau-Regel („Code ohne Trigger = toter Mechanismus"), keinen Aufruf-Pfad. Es ist Erz, kein Organ.

### 2.2 Wissenskarte: die Domänen des besten KI-Nutzers

Vorbemerkung zur Herkunft: Jede Aussage trägt eine Stufe — **[G]** gemessen (Chrisos Studien, Kontext §3), **[B]** belegt (in dieser Front per Tool-Ergebnis gesehen, Quelle genannt), **[R]** aus einer Nachbarfront übernommen (dort belegt), **[P]** Praxis (verbreitete Handwerksregel, hier nicht einzeln belegt), **[U]** unverifiziert (Erinnerungswissen). Die Stufen sind exakt die vier des Dossier-Schemas in §2.3; die Wissenskarte ist der erste Anwendungsfall. Haltbarkeitsklassen: **H1** Prinzip (≥ 365 Tage), **H2** Werkzeugmechanik (90–180 Tage), **H3** Preise/Limits/Modellnamen (≤ 30 Tage).

#### D1 Werkzeugketten (Claude Code, Codex, Gemini CLI, Cursor; MCP, Skills, Hooks, Workflows)

Kernprinzipien: (1) Anweisung ≠ Erzwingung: „Claude treats them as context, not enforced configuration. To block an action regardless of what Claude decides, use a PreToolUse hook" [B, code.claude.com/memory]. (2) Kurze Startkontexte: CLAUDE.md „target under 200 lines"; Imports laden „at launch" (max. 4 Hops) und sparen keinen Kontext [B]. (3) Dreistufiges Lazy-Loading: Metadata ~100 Tokens → SKILL.md < 5.000 Tokens → Ressourcen auf Abruf; SKILL.md < 500 Zeilen; Verweise eine Ebene tief [B, agentskills.io]. (4) Die `description` ist der Router: „describe both what the skill does and when to use it … include specific keywords" [B]; R10: „not a summary, it's a description of when to trigger" [R]. (5) Pfadgebundene Regeln (`.claude/rules/*.md` mit `paths:`) laden erst beim Lesen passender Dateien [B] — das ist der native Mechanismus für **kontextabhängiges Wissen**. (6) Auto-Memory: `MEMORY.md`-Index ≤ 200 Zeilen/25 KB wird jede Sitzung geladen, Themen-Dateien on demand; `modified`-Timestamp im Frontmatter ab v2.1.214 [B] — ein natives Vorbild für „Index + Verfallsdatum". (7) Hooks sind Sensorik und Guard, nicht Verhaltensanweisung: UserPromptSubmit → additionalContext (Kandidaten), PreToolUse → Ausnahmeliste [R, R10 §3.2; SOUL]. (8) Workflows/Ultracode: bis 1.000 Agents pro Run, 16 parallel, Zwischenergebnisse außerhalb des Dirigenten-Kontexts [R, R14 bestätigt Doku]. (9) Provider-Achse bestimmt das Feature-Set (Bedrock/Vertex: kein Web Search, keine Routines, kein Advisor) [R, R15 §2.2.1]. (10) CLI ist kontexteffizienter als MCP (`gh` statt GitHub-MCP), MCP-Tools deferred laden [R, R16 §2.3.3]. (11) `/init` liest Cursor-/Copilot-Regeln und `AGENTS.md`; `@AGENTS.md`-Import macht eine Quelle für mehrere Agenten [B] — Basis für „ein Kern, jede Bindung". (12) Cache-Prefix als Vertrag: tools → Kernel → Briefing → Aufgabe, nie Tool-Sets mid-session wechseln [R, R16 §2.3.1].
Werkzeuge: Claude Code (Skills/Hooks/Agents/Workflows/Rules/Auto-Memory), Codex CLI (`codex exec` skriptbar, Sol-Gate), Gemini CLI, Cursor (IDE-gebunden, nicht headless) [R, R15 §2.2.2]; MCP-Registry als Discovery, nie Qualitätsprüfung [R].
Typische Fehler: Regeln in CLAUDE.md statt Hooks; 55 Module als Skills (Listing-Budget ≈ 1 % des Fensters, 5–6 passen) [R, R10 §2.9.2]; Tool-Definitionen mid-session ändern (Cache-Invalidierung) [R]; Anweisungen im Ausgabeformat statt im Denken (Formatschaden 2/30) [G].
Haltbarkeit: Prinzipien H1; Flags/Versionen H2; Limits H3.

#### D2 Entwicklung & Deployment (Repos, CI, Tests, Hosting)

Kernprinzipien: (1) Feature-Liste mit `passes`-Feld ist die Wahrheit, nicht das Log; Tests dürfen nicht entfernt werden („It is unacceptable to remove or edit tests") [B, Anthropic-Harness]. (2) Jede Session startet mit Zustandsaufnahme: `pwd` → Git-Log + Progress → höchste offene Feature → `init.sh` + Smoke-Test → dann bauen [B]. (3) End-to-End-Verifikation, nicht Code-Diff: Agenten „would fail recognize that the feature didn't work end-to-end"; Test-Werkzeuge (Browser, Screenshots) „dramatically improved performance" [B]. (4) Exit 0 ist not-evaluated; Prüfung getrennt von Ausführung [R, SOUL Organ 7]. (5) Dokumentation im selben Commit wie Code; tote Doku löschen; Duplikate verlinken statt schreiben [B, Google docguide]. (6) Reproduzierbarkeit aus Artefakten (Hash Prompt+Modell → Antwort), nicht aus temperature=0 (Qwen3-235B: 1.000 Completions bei T=0 → 80 verschiedene) [R, R16 §2.3.7]. (7) Gratis-Hosting-Klauseln: Cloudflare Workers Free 100k Req/Tag, 10 ms CPU, 128 MB [B]; GitHub Pages 1 GB, 100 GB/Monat soft, 10 Builds/h soft, kein Business/SaaS [B]; Vercel Hobby pausiert bei Überschreitung, Netlify 300 Credits hart, Supabase Free pausiert nach 7 Tagen [R, R15 §2.2.3]. (8) SQLite für alles Lokale und Zustandsbehaftete (kein Pausenrisiko, $0) [R]. (9) Worktrees für parallele Ausführende [R, R15]. (10) Secrets nie in Repos, Env-Scrub in Subprozessen (`CLAUDE_CODE_SUBPROCESS_ENV_SCRUB=1`) [R, SOUL forschung-2026-09].
Werkzeuge: git/gh, GitHub Actions, Playwright-MCP/Chrome-DevTools-MCP (gratis, lokal) [R, R15], Cloudflare Workers/Pages, GitHub Pages, Vercel, Netlify, Supabase, SQLite/Postgres.
Typische Fehler: „fertig" ohne E2E-Probe [B]; Hosting, das nachts pausiert, für Dinge, die laufen müssen [R]; Kommerz auf GitHub Pages [B]; Doku-Drift [B].
Haltbarkeit: 1–6, 8–10 H1/H2; 7 H3.

#### D3 Recherche & Quellenarbeit

Kernprinzipien: (1) Zitate sind der verifizierbarste Ort für Halluzinationen: 146.932 halluzinierte Zitate 2025 aus 111 Mio. Referenzen; besonders bei „small and early-career author teams" und „linguistic signatures of AI-assisted writing" [B, arXiv 2605.07723]; Vendor-Spanne 14–95 % [B-Sekundär]. (2) Regel: nur zitieren, was in einem Tool-Ergebnis stand; Erinnerung ist [U] [G/Chriso]. (3) Zahl ohne Herkunft (Quelle, Datum, Pfad) ist keine Zahl [Chriso §7]. (4) Mehrgleisig suchen (Web, Code, Doku, eigene Bestände), nicht dreimal derselbe Weg [SOUL playbooks/recherche]. (5) Folgenreiche Funde → zweite unabhängige Quelle oder Gegenstimme [SOUL]. (6) Ergebnis als Entscheidungsvorlage, nicht Linksammlung [SOUL]. (7) Sekundärquellen als solche markieren; Primärquelle nachholen, wenn die Zahl trägt (in dieser Front: aws-Programmseite ohne Zahlen, FAQ mit Zahlen — der Unterschied ist genau eine Stufe). (8) Fachdatenbanken (Scite, Consensus, PubMed, Elicit) nur als Abo-Connectors sichtbar → Preflight zählt Connectors zur Laufzeit [R, R15 §2.2.4]. (9) Web-Fetch-Inhalt ist untrusted (Lethal-Trifecta-Komponente 2) — Recherche-Agenten ohne Schreibrechte auf geladene Dossiers und ohne Exfiltrationskanal [B, Willison]. (10) Ein Abruf pro Quelle mit präzisem Prompt (Kontingent) [Chriso-Auftrag].
Werkzeuge: WebSearch/WebFetch, `gh`/GitHub-Search, arXiv-Abstracts, llms.txt-Indizes (code.claude.com, modelcontextprotocol.io, agentskills.io liefern sie) [B], Scite/Consensus (Abo).
Typische Fehler: Suchergebnis-Zusammenfassung als Primärquelle zitieren; Datum vergessen; Sekundärzahl ohne Kennzeichnung [P].
Haltbarkeit: H1.

#### D4 Schreiben & Kommunikation

Kernprinzipien: (1) Anti-Performance: „Klinge weniger beeindruckend als du bist" [SOUL Invariante 5]; verbotene Wörter (revolutionär, bahnbrechend, …) [Chriso §7]. (2) Struktur im Denken, nie in der Ausgabe; Ausgabeformat im Zweifel nicht anfassen [G, Formatschaden]. (3) Der gemessene Wirkmechanismus ist „sich an die Aufgabe halten", nicht „mehr liefern" (Soul-Antworten ein Drittel so lang) [G]. (4) Länge ist der gefährlichste Confound — auch für menschliche Leser (Judge-Längenbias 79,6 %) [G]. (5) „Ich weiß nicht" ist eine vollständige Antwort [Chriso §7]. (6) Abweichungen vom Auftrag in einer Zeile offenlegen (Frame Punkt 5) [G]. (7) Für Doku: „write for humans first, computers second"; „Prefer the good over the perfect" [B, Google docguide]. (8) Deutsch/Englisch nach Zielgruppe; Fachbegriffe stabil halten [P].
Werkzeuge: Output-Styles (session-fix) [R, SOUL], docx/pptx/xlsx-Skills (Abo) [R, R15].
Typische Fehler: Meta-Kommentar über die eigene Vorbereitung; Hedging-Floskeln; Überlänge als Gründlichkeit verkaufen [G/R10 §2.7].
Haltbarkeit: H1.

#### D5 Daten & Automatisierung

Kernprinzipien: (1) Deterministisches nie an ein Modell: Regex, Parser, SQL, `grep`/`head` in Hooks vor dem Modell [R, R15/R16 §2.3.2]. (2) Roh-Output nie in den Hauptkontext (Subagent oder Hook, 1.000–2.000-Token-Zusammenfassung) [R, R16]. (3) Zeitplanung um Limits: Routines (Cloud, min. 1 h), `/loop` (1 min, 7 Tage), Batch-API −50 %, Cache + Batch stapeln [R, R16 §2.3.4–2.3.5]. (4) Ereignisse als JSONL, jedes Tool-Ereignis geloggt (SOUL Wache) [SOUL]. (5) Kalender der Gratis-Tiers (Tages-Resets) als Datenstruktur, nicht als Erinnerung [R, R16]. (6) SQLite+FTS5 als Standardspeicher; kein Vektorzwang [Chriso §12]. (7) Idempotenz und Wiederaufnahme: jede Automatisierung muss nach Abbruch weiterlaufen können (Schreib-Auflage: nach jedem Abschnitt auf Platte) [Chriso §3]. (8) Hook-Latenzbudget < 200 ms, ohne Netz [R, R10 §2.9.5].
Werkzeuge: Bash/Python, jq, SQLite, cron/Routines/`/loop`, Batch-APIs, JSONL-Logs, OpenTelemetry-Export [R, R15].
Typische Fehler: Klassifikation per Modellaufruf, die ein Regex kann; Nightlies in fette Sessions feuern (voller Kontext je Feuern) [R, R16 §2.3.3].
Haltbarkeit: 1, 2, 4, 6, 7 H1; 3, 5, 8 H2.

#### D6 Design & Produkt

Kernprinzipien: (1) „Your first users should feel that signing up with you was one of the best choices they ever made" [B, Graham]. (2) Ein Nutzer als Berater-Kunde: „pick a single user and act as if they were consultants building something just for that one user" [B]. (3) Manuell vor automatisch: „when you do finally automate yourself out of the loop, you'll know exactly what to build" [B]. (4) Wirkung vor Verwaltung (SOUL Invariante 1). (5) Name-Mechanismus-Abgleich: kein Feature-Name verspricht mehr als der Mechanismus hält [SOUL]. (6) Kill-Check je Baustein: in 7 Tagen genutzt? in ≤ 3 Schritten Aktion? Wert > Aufwand × 5? [SOUL]. (7) Artefakte (Seiten, Canvas, Dashboards) als Sichtbarkeit nach außen — mit Theme-/Responsive-Pflicht [P, Artifact-Doku dieser Session]. (8) Design-Skills existieren als Abo-Features (Design-Canvas, Dataviz) — sonst als eigene Skills nachrüsten [R, R15].
Typische Fehler: Quantität als Erfolg („253 Tools, 130 Blogs, 0 EUR") [SOUL Anti-Pattern 1]; Fremdurteil als Beweis [Anti-Pattern 9].
Haltbarkeit: H1.

#### D7 Startup-Organisation (Solo-Gründer, AT/EU)

Kernprinzipien: (1) Nutzer holen, nicht warten: „You can't wait for users to come to you. You have to go out and get them" [B, Graham]. (2) Enger Markt zuerst („keeping a fire contained at first to get it really hot") [B]. (3) Rechtsform AT: FlexKapG (seit 2024), Mindeststammkapital 10.000 €, mind. 5.000 € bar, Ein-Personen-Gründung ohne Notar möglich, Unternehmenswert-Anteile bis 24,99 % [B-Sekundär, WKO/FreeFinance/TPA]. (4) Förderung AT: aws Preseed Deep Tech max. 267.000 € (bis 300.000 € mit Gender-Bonus), Förderquote 80 % (90 %), Eigenleistung mind. 20 % (10 % bar), Firma ≤ 6 Monate alt bei Antrag, De-minimis 300.000 €/3 Jahre, Verfahren Ø 3 Monate, nur elektronisch (aws Funding Manager) [B, aws-Preseed-FAQ]; Seedfinancing für Firmen „up to 5 years old"; Linien Deep Tech (LIS/TEC/GREEN) und Innovative Solutions [B, aws.at]. (5) Infostunden 2026: 19.8. und 23.9. [B-Sekundär]. (6) Validierung vor Bau (Mom-Test-Prinzip: nach Vergangenheit fragen, nicht nach Meinung) [U]. (7) Recht in Grundzügen: Datenschutz (DSGVO) ist bei jedem Nutzerdatum relevant; Impressumspflicht; Steuer-/SV-Registrierung — Details sind Ring-2-Fragen an Berater, nie Modellwissen [P]. (8) De-minimis-Buchführung über alle Förderungen [B].
Typische Fehler: Förderzahlen aus dem Gedächtnis (die Programmseite selbst nennt keine — nur die FAQ) [B]; Rechtsform vor Kundenbeweis [P].
Haltbarkeit: 1, 2, 6 H1; 3, 7 H2; 4, 5 **H3 (Verfall 90 Tage, Quelle = FAQ-URL)**.

#### D8 Lokale KI (Hardware, Modelle, Quantisierung)

Kernprinzipien: (1) Speicherregel: Gewichte-GiB ≈ Parameter × bpw / 8 (+ KV-Cache + 1–2 GiB Reserve); Q4_K_M ≈ 0,57 GiB/B [R, R16 §2.4.1 aus llama.cpp-README]. (2) Llama-3.1-8B: F16 14,96 GiB, Q4_K_M 4,58, Q5_K_M 5,33, Q6_K 6,14, Q8_0 7,95 [R]; Perplexität (Sekundär zu arXiv 2601.14277): F16 7,32 / Q8_0 7,33 / Q6_K 7,35 / Q5_K_M 7,40 / Q4_K_M 7,56 — Q4_K_M ≈ +3 %, darunter steiler Abfall [B-Sekundär]. (3) Standard Q4_K_M; Q5_K_M/Q6_K für Code/Reasoning, wenn Speicher reicht; Q8_0 nur als Referenz [B-Sekundär]. (4) Klassen `none` < 8 GB, `small` 8–15 (≤ 9B Q4), `medium` 16–31 (≤ 20B), `large` ≥ 32 GB RAM oder ≥ 24 GB VRAM, `xl` ≥ 80 GB VRAM [R, R15/R16]. (5) gpt-oss-20b „within 16GB", 120b eine 80-GB-GPU; LM Studio nur Apple Silicon oder x64+AVX2 [R, R15]. (6) MoE (30B-A3B) braucht Speicher der Gesamt-, Tempo der aktiven Parameter — beste Klasse für CPU-only mit viel RAM [R]. (7) Wofür lokal: Klassifikation, Extraktion, Entropie-Sonde, Vorprüfung, Tool-Output-Zusammenfassung, PII-Scrub, Gedächtnis-Triage, Formatierung; **nie Dirigent** [R, R16 §2.4.3]. (8) Passung messen statt raten: 6-Item-Kalibrierset je lokalem Modell (pass_rate, tps) [R, R16 §2.4.4]. (9) Aider-Polyglot: gpt-oss-120b 41,8 %, Qwen3-32B 40,0 % vs. gpt-5 high 88 % — halbe Frontier-Rate bei 1/40 Kosten [R]. (10) Thinking-Budget pro Rolle fixieren [R].
Werkzeuge: Ollama (`localhost:11434`), LM Studio (`lms`), llama.cpp, vLLM; GGUF-Formate [R/B].
Typische Fehler: Modell nach Name statt nach Probe einsetzen (Deckeneffekt, entgegengesetzte Modellreaktionen) [G]; VRAM ohne KV-Cache rechnen [P].
Haltbarkeit: 1, 3, 6, 7, 8 H1; 2, 4, 5 H2; 9 H3.

#### D9 Sicherheit & Datenschutz für autonome Agenten

Kernprinzipien: (1) Lethal Trifecta vermeiden: private Daten + untrusted Content + Exfiltrationskanal nie in einem Agenten; „95 %" ist „a failing grade" [B, Willison]. (2) OWASP LLM Top 10 2025: Prompt Injection, Sensitive Information Disclosure, Supply Chain, Data/Model Poisoning, Improper Output Handling, **Excessive Agency**, System Prompt Leakage, Vector/Embedding Weaknesses, Misinformation, Unbounded Consumption [B, genai.owasp.org]. (3) Claude Code: Web-Fetch in isoliertem Kontextfenster; `curl`/`wget` nicht auto-approved; Trust-Verifikation bei `-p` **aus**; Sandbox mit FS-/Netz-Isolation; Credentials im Keychain [B, code.claude.com/security]. (4) MCP: kein Token-Passthrough („MUST NOT accept any tokens that were not explicitly issued for the MCP server"); Sessions nie zur Authentifizierung; lokale Server: exakten Befehl ohne Kürzung zeigen; SSRF-Blocklisten (169.254.0.0/16 etc.); Scope-Minimierung [B, MCP-Spec 2025-11-25]. (5) Least Privilege pro Ebene: Recherche-Agenten ohne Schreibrecht auf geladene Dossiers, ohne Secrets; Ausführende ohne Netz, wo möglich [B/P]. (6) Ring-2-Ausnahmeliste bleibt Nutzer-Entscheidung: Secrets, extern publizieren, Zahlungen, Remote-Löschung, Prod, Wache-Integrität [SOUL]. (7) Env-Scrub in Subprozessen [R, SOUL]. (8) Consent by Design ≠ Consent für Injektion: Die einmalige Zustimmung des Nutzers gilt für das, was *das Modell* will, nicht für das, was eine Webseite dem Modell einflüstert — daher Quarantäne für alles aus untrusted Quellen [B/Chriso §11b, Synthese]. (9) Datenschutz: P2-Daten (vollständiger Miguel) nur lokal; Miguel-für-alle nur aus öffentlichem Material [Chriso §10]. (10) Sicherheitsvorfälle: nicht öffentlich, HackerOne, Repro-Schritte [B].
Typische Fehler: MCP-Server aus Registry ungeprüft aktivieren [R, R15]; Recherche-Ergebnis direkt in Kernel/Dossier schreiben [B-Synthese]; `-p`-Läufe mit fremden Repos ohne Trust [B].
Haltbarkeit: 1, 2, 5, 6, 8, 9 H1; 3, 4, 7 H2.

#### D10 Kosten- und Kontingentmanagement

Kernprinzipien (alle [R], R15/R16, dort belegt): (1) Drei Währungen: API-Dollar, Abo-Fenster (5 h + Woche), Gratis-Tiers (RPM/RPD/TPD, Tages-Reset). (2) Cache-Prefix als Vertrag; Fable 5.1 Cache-Read 0,025×; Mindestlängen je Modell; Cache-Reads zählen nicht auf Rate-Limits. (3) Batch −50 %, stapelt mit Cache; für alles Nicht-Interaktive (Konsolidierung, Klassifikation, Blindbewertung, **Dossier-Pflege**). (4) `/clear` kostet nichts, `/compact` ist ein großer Request; jeder Request sendet die volle Konversation. (5) Agent Teams ≈ 7× Tokens — nur bei echter Parallelität. (6) Modell-Limit ≠ Session-Limit: bei „Opus limit" Familie wechseln. (7) Ungenutztes Abo-Fenster verfällt → Bulk-Vorbereitung ans Fensterende. (8) Wellen-Regel 2–3 Agenten folgt aus RPM [G/R15]. (9) Selbstkonsistenz@3 bei gleichem Budget schlägt jeden Frame — jede Prompt-Schicht muss diesen Gegner erst schlagen [G]. (10) Deckeneffekt: bei 93–97 % nackt bringt Struktur nichts [G]. (11) Entropie über 3 Wiederholungen (AUC 0,968) als Auslöser selektiver Tiefe [G].
Typische Fehler: Tool-Set mid-session wechseln; Pausen > TTL; starke Modelle für deterministische Arbeit [R].
Haltbarkeit: 1, 4–11 H1/H2; 2, 3 Zahlen H3.

#### D11 Evaluation & Ehrlichkeit

Kernprinzipien [G, Kontext §3; R08]: (1) Form ist der gefährlichste Confound; Judge gegen Länge/Format härten. (2) Armparität am Draht beweisen. (3) Roh-Artefakt-Zwang (Datei + Modell-ID) — sonst „nicht gemessen". (4) Eigenstreuung zuerst: unveränderter Arm schwankte 6,7–13,3 pp → Einzelmessungen wertlos, ab 3 Läufen belastbar. (5) Kriterien vor den Daten committen (Vorhersage + Konfidenz + Auflösungsdatum). (6) Pflichtabschnitt „unter welcher Bedingung ist dieses Dokument falsch?". (7) Placebo-Arm (gleich viel Fülltext) gehört zu jedem Prompt-Claim (Hälfte des HumanEval-Effekts war Kontexteffekt). (8) Modell-Selbstberichte sind keine Bewusstseinsbeweise. (9) Widerrufene Zahlen offen führen (vier Widerrufe im Kontextpaket). (10) Kalibrierung als Produktmerkmal (Brier je Domäne, N3).
Anwendung auf das Wissensorgan: Jedes Dossier ist eine Hypothese („so gebaut, dass …"); die Nutzungs- und Wirkungsmessung (§2.5) ist die Evaluation.
Haltbarkeit: H1.

**Nicht als eigene Domäne, sondern Querschnitt:** „Arbeit mit Modellen" (Frame-Punkte, Delegation an Orakel-gebundene Unteragenten, Prüfkaskaden) liegt in R10/R16 und im Kernel selbst; das Wissensorgan verweist, dupliziert nicht (Google-Regel „Duplication is evil … Link to it instead" [B]).

### 2.3 Form der Dossiers — das Schema

**Gold-aus-Erz-Zeile:** SOULs Dossiers wollten destilliertes, herkunftsgebundenes Wissen; sie blieben bei Prosa mit Pfaden stehen. Karpathys Wiki fügt Roh/Destillat-Trennung, Index, Log und Lint hinzu (Hermes-Doku: raw/ mit SHA256, entities/concepts/comparisons/queries, index.md „one-line summary per page", log.md append-only, Lint für „orphan pages, broken wikilinks, missing frontmatter, stale content, contradictions, source drift, oversized pages" [B]). Claude Codes Auto-Memory fügt Typen (`user/feedback/project/reference`) und `modified`-Timestamp hinzu [B]. Agent Skills fügen Auslöser-Beschreibung und Dreistufigkeit hinzu [B]. **Keines dieser Vorbilder kennt Herkunftsstufe je Aussage, Verfallsdatum je Aussage, Kalibrierung oder Nutzungsmessung.** Genau das ist der Schritt von „Ablage" zu „epistemisches Hauptbuch" (Kontext §13).

**Ein Dossier ist ein Ordner, kein File** (kompatibel mit dem Skill-Standard, damit derselbe Ordner in Claude Code als Skill, in Codex als AGENTS-Import und im portablen Kern als Inline-Kurzform wirkt):

```
wissen/<domäne>-<zweck>/
├── DOSSIER.md          # Frontmatter + Kurzform (≤ 120 Wörter) + Langform (≤ 5.000 Tokens)
├── quellen.jsonl       # eine Zeile je Quelle: url|pfad, abgerufen_am, hash, stufe, was_belegt
├── regeln.md           # optional: Entscheidungsregeln als Textbausteine für Kernel/Hook (englisch)
├── proben/             # optional: Prüf-Skripte (which/curl/Probe-Calls), die Aussagen verifizieren
└── SUPERSEDED/         # frühere Versionen (Supersession statt Mutation)
```

**Frontmatter von `DOSSIER.md` (Pflichtfelder):**

```yaml
---
name: werkzeugkette-claude-code          # = Ordnername; Schema wie Agent Skills (a-z, 0-9, -)
description: >                            # der Auslöser (≤ 1024 Zeichen): WANN laden, mit Signalwörtern
  Load when the task touches Claude Code setup, skills, hooks, CLAUDE.md, MCP, workflows,
  subagents or when the user asks how to configure an AI coding tool.
schicht: handwerk | atlas | profil        # drei Schichten (§1.5)
sichtbarkeit: public | private            # Miguel für alle / vollständiger Miguel
version: 2026-09-06.1
verfaellt_am: 2026-12-05                  # Pflicht; Haltbarkeitsklasse des ältesten H3-Eintrags oder Dossier-Default
haltbarkeit_default: H2                   # H1 ≥ 365 d, H2 90–180 d, H3 ≤ 30 d
stufen: {G: 4, B: 22, R: 9, P: 5, U: 2}   # Zählung der Herkunftsstufen (vom Linter gepflegt)
signale: [tooling, claude_code, mcp, hooks]   # Router-Signale (R10 signals.ts-Erweiterung)
ladestufe_default: 1                      # 0 Index-Zeile · 1 Kurzform · 2 Langform · 3 + Quellen/Proben
abhaengig_von: [kosten-kontingent]        # Verweis statt Wiederholung
gemessen: {geladen: 0, gewirkt: 0, letzte_nutzung: null}   # Nutzungskonto (§2.5)
autor: miguel | chriso | mining | import
---
```

**Körper, feste Reihenfolge (Truncation behält den Anfang — R10 §2.9.2):**
1. **Kurzform** (≤ 120 Wörter): die 5–8 Regeln, die das Ergebnis am meisten verändern. Das ist, was der portable Kern inline trägt.
2. **Kernprinzipien** (10–30, nummeriert, jede mit Stufe `[G]/[B]/[R]/[P]/[U]`, Haltbarkeit `H1/H2/H3` und Quellen-ID `@q3`).
3. **Entscheidungsregeln** (Wenn-dann, ≤ 10; parallel als englische Textbausteine in `regeln.md`).
4. **Werkzeuge** (Name, Zugang, Kosten, Klasse, Probe-Befehl).
5. **Stand der Kunst <Datum>** (H3-Block, eigener Verfall, klar abgetrennt).
6. **Anti-Patterns** (mit Beleg, nie ohne — SOUL-Regel).
7. **Offene Fragen / unter welcher Bedingung ist dieses Dossier falsch?** (Pflicht, Chrisos Messregel).
8. **Quellen** (als Verweis auf `quellen.jsonl`, im Text nur `@q<n>`).

**Regeln des Schemas:**
- **Stufe je Aussage, nicht je Dossier.** Eine Zahl ohne `[B]`/`[G]` + `@q` + Abrufdatum ist ein Lint-Fehler, kein Stilproblem.
- **Verweis statt Wiederholung** (`abhaengig_von`, `@R15 §2.2.3`): Ein Fakt lebt an genau einer Stelle; das Dossier, das ihn braucht, verlinkt. Der Linter meldet duplizierte Zahlen (gleiche Zahl + gleiche Einheit in zwei Dossiers ohne Verweis).
- **Zwei Kurzformen für zwei Profile:** `sichtbarkeit: private` gilt für den ganzen Ordner; Dossiers der Schicht `profil` sind immer privat; Dossiers der Schicht `handwerk` sind immer öffentlich; `atlas` ist öffentlich außer Nutzer-Kontingentstände. Der Build-Schritt (Kontext §13, „ein Kern, jede Bindung") kompiliert für Miguel-für-alle nur `public`.
- **Tokenbudget beim Laden:** Index-Zeile ≤ 40 Tokens; Kurzform ≤ 160 Tokens; Langform ≤ 5.000 Tokens (Skill-Cap); `quellen.jsonl`/`proben/` nie automatisch. Bei 8–12 Dossiers kostet Stufe 0 für alle ≈ 400 Tokens, Stufe 1 für drei passende ≈ 500 Tokens, Stufe 2 für eines ≤ 5.000. Ein Aufgabenstart lädt damit typischerweise **< 1.000 Tokens Wissen** (Stufe 0 + 1) und höchstens ein Dossier in Stufe 2 — das ist die Größenordnung, bei der R10s Placebo-Vergleich noch fair ist.
- **Länge je Dossier:** Langform 600–2.000 Wörter Zieltext; über 2.000 Wörter → aufteilen (Lint „oversized"). Kürzer als 300 → mit Nachbar verschmelzen oder als Regel in ein anderes Dossier.
- **Herkunftskennzeichnung ist maschinenlesbar** (`[B@q7 2026-09-06]`), damit der Pflege-Job H3-Aussagen einzeln nachprüfen kann, statt das Dossier neu zu schreiben.

### 2.4 Ladeprotokoll

**Gold-aus-Erz-Zeile:** SOUL: „Playbook laden bei Aufgabenstart" als Anweisung. Claude Code: Skill-Router über `description` (modellbasiert, nicht loggbar, nicht garantiert; R10 §2.3.1). Soul 10: **zweistufiges Routing mit Log** — deterministische Kandidaten vor der Generierung, stille Feinauswahl nach der Verstehensphase, beides protokolliert, beides gemessen.

**Stufen (L):**
- **L0 Index** (immer, jede Sitzung, ≤ 500 Tokens für ≤ 12 Dossiers): pro Dossier eine Zeile `name · Auslöser-Signale · Kurzsatz · verfaellt_am · Stufe-Default`. Der Index ist eine **Auslöser-Tabelle**, keine Inhaltsangabe (Anthropic: „description of when to trigger"). Er wird aus den Frontmatters generiert (Single Source of Truth), nie von Hand geschrieben.
- **L1 Kurzform** (bei Signal-Treffer, automatisch im Hook-Hinweis): ≤ 160 Tokens je Dossier, max. 3 Dossiers.
- **L2 Langform** (ein Tool-Aufruf durch das Modell oder `skills:`-Preload eines Subagenten): ≤ 5.000 Tokens, höchstens 1–2 je Aufgabe.
- **L3 Quellen und Proben** (nur bei Verdacht: „ist das noch wahr?", Widerspruch, H3-Aussage nahe Verfall): `quellen.jsonl` lesen, `proben/*.sh` ausführen, Live-Recherche.

**Wahl der Scheibe — der Hook (UserPromptSubmit, deterministisch, < 200 ms, ohne Netz):**
1. Signale berechnen (R10 `signals.ts`-Erweiterung: `tooling`, `deploy`, `research`, `writing`, `data`, `design`, `startup`, `local_ai`, `security`, `cost`, `eval`, plus Aufgabenmerkmale `durable/irreversible/underspecified`).
2. Gegen den Index matchen (Signal ∩ `signale`), Kandidaten sortieren nach (a) Treffer, (b) `gemessen.gewirkt/geladen` (Wirkungsquote), (c) Frische.
3. Verfall prüfen: `verfaellt_am < heute` → Dossier bleibt **L0 mit Warnung** („⚠ abgelaufen seit n Tagen, H3-Block ungültig"), wird nicht in L1 gehoben. Das ist der mechanische Ersatz für den Prüfer, der immer zuerst wegfällt.
4. Hinweis schreiben (≤ 3 Zeilen additionalContext): `wissen: <name1> (L1 inline), <name2> (L1 inline); L2 verfügbar: <name3> — lade nur, wenn die Aufgabe es braucht.` Nichts erzwingen (Linse, nicht Käfig).
5. Loggen: `{ts, signale, kandidaten, geladen_stufe, dossier_versionen}` → Wache (JSONL). Ohne diesen Log-Eintrag existiert das Laden nicht (SOUL-Regel).

**Zweite Stufe — das Modell nach dem Verstehen (Frame-Punkte 1–2):** Voyager-Lehre (R10 §2.3.3): Die Query nach der Verstehensphase ist besser als der Roh-Prompt. Der Kernel enthält daher eine stille Regel: *After rereading the request as the author and completing the brief, check whether the task now touches a knowledge domain the index lists that the hook did not flag; if so, load its short form (one call). Never load more than two long forms per task.* Diese Nachwahl wird ebenfalls geloggt (Tool-Aufruf sichtbar).

**Tiefe der Ladung nach Aufgabenklasse** (gekoppelt an R10 Tiefenstufen):
| Aufgabenklasse | Beispiel | Wissen |
|---|---|---|
| trivial / Deckeneffekt wahrscheinlich | Formatfrage, kleine Änderung | L0 only (Index bleibt im Cache-Prefix, kostet ≈ 0) |
| Standard | Feature bauen, Text schreiben | L1 für 1–3 Dossiers |
| durable / irreversible / architecture | Deployment, Datenmodell, Vertrag, Förderantrag | L1 + L2 für das Leit-Dossier; L3 für alle H3-Zahlen, die in die Entscheidung eingehen |
| Onboarding / Preflight | erster Start, neues Projekt | Atlas-Schicht L2 + Proben (R15 Preflight L0–L5) |
| Unteragent Ebene 3–6 | Ausführender mit engem Auftrag | nur die `regeln.md`-Bausteine des zuständigen Dossiers als Teil des Übergabe-Vertrags (kein Index, kein L2) |

**Lücken erkennen und schließen:**
- *Signal ohne Dossier* (Hook findet Domänen-Signal, Index hat keinen Treffer) → Eintrag `luecke` im Log; ab 3 Treffern in 7 Tagen erzeugt die Pflege-Routine einen Dossier-Kandidaten (Kill-Check: wird es gebraucht? — die drei Treffer sind der Beleg).
- *Aussage unter Verdacht* (Modell widerspricht einer Dossier-Aussage aus eigenem Wissen, oder eine Probe schlägt fehl) → Aussage wird `disputed` (beide Seiten, Memory-Lehre), Dossier bleibt ladbar, die Zeile trägt ⚠, Live-Recherche wird als Auftrag für die nächste Pflege-Welle eingereiht — **nicht sofort im Hauptkontext** (Kontingent, Kontext-Hygiene).
- *H3-Aussage entscheidungsrelevant und nahe Verfall* (< 7 Tage) → L3 sofort: eine Quelle, ein Abruf, präziser Prompt (R17-Sparsamkeitsregel), Ergebnis mit Datum in `quellen.jsonl`.

**Destillation neuen Wissens (Legacy-Miner-Muster, verallgemeinert):**
1. Jede Live-Recherche und jedes Projekt-Ende erzeugt **Kandidaten**, nie Dossier-Änderungen: `wissen/_candidates/<datum>-<name>.md` mit Frontmatter `{quelle, stufe, haltbarkeit, betrifft_dossier, begruendung}`.
2. Der Miner-Prompt gilt unverändert („was tut es, warum trug es, woran scheiterte es — keine Nacherzählung, jede Aussage mit Herkunft"), ergänzt um: *Stufe und Haltbarkeit je Aussage; was widerspricht bestehenden Dossiers (nennen, nicht überschreiben); welche Probe würde die Aussage prüfen.*
3. Kandidaten aus untrusted Quellen (Web, fremde Repos, MCP-Registry) liegen in **Quarantäne**: Sie tragen `trust: untrusted` und werden von der Pflege-Routine in einer Session **ohne Netz und ohne Secrets** geprüft (Lethal Trifecta gebrochen), bevor sie in ein Dossier promoted werden.
4. Promotion = Supersession: neue Dossier-Version, alte nach `SUPERSEDED/`, Log-Eintrag mit Begründung und Rückbau-Befehl (`soul wissen rollback <name> <version>`).
5. Die 3–5 tragendsten Erkenntnisse gehen zusätzlich als Gedächtnis-Kandidat (Typ `muster`/`fakt`, Quelle `mining`, Vertrauen 0,4 für agent_inference — Memory-Lehre) — Wissen und Gedächtnis bleiben getrennt, aber verlinkt (`ref: wissen/<name>@<version>`).

**Bindung außerhalb von Claude Code:** Codex/Gemini/Cursor lesen `AGENTS.md`-artige Dateien; der Build erzeugt aus `wissen/` (a) einen Index-Block + Kurzformen (≈ 1.000 Tokens) für generische System-Prompts und (b) einen Skill-Ordner je Dossier (Agent-Skills-Spec ist toolübergreifend). Ohne Hook entfällt L-Stufe 1 automatisch — dann trägt der Kernel den Index inline und das Modell wählt (R10 §2.3.3, „der Preis der Portabilität").

### 2.5 Pflegeprotokoll

**Gold-aus-Erz-Zeile:** SOUL hat keine Pflege; die KORREKTUR-Sektion in `forschung-2026-09.md` ist ein Willensakt eines späteren Lesers. Google: „Change your documentation in the same CL as the code change"; „Dead docs are bad"; „Duplication is evil" [B]. Karpathy-Wiki: Lint für stale content, contradictions, source drift [B]. Claude Auto-Memory: Limit-Erinnerung beim Schreiben, `modified`-Timestamp [B]. Soul 10 macht Pflege zu einem **Schedule + Linter + Konto**, und Verfall zu einer Sperre statt einer Bitte.

**Verfall (drei Klassen, je Aussage, Dossier erbt das Minimum):**
| Klasse | Inhalt | Frist | Prüfung |
|---|---|---|---|
| H1 Prinzip | Denk-/Arbeitsregeln, gemessene Befunde | 365 d | Jahres-Review; Widerspruch durch neue Messung setzt `disputed` |
| H2 Mechanik | CLI-Flags, Dateiformate, Hook-Events, Spezifikationen | 90–180 d | Probe-Skript (`proben/`) oder Doku-Fetch der `@q`-URL; Hash-Vergleich (Wiki-Muster „source drift") |
| H3 Zahlen | Preise, Limits, Modellnamen, Förderbeträge, Rankings | ≤ 30 d (Förderung 90 d) | gezielter Einzel-Fetch der Quelle, Diff, Supersession |

**Schedule (Claude Code Routines/`/loop`, Kosten über Batch + 1-h-Cache; ohne Abo: cron + `claude -p --max-budget-usd`):**
- **täglich, Batch, lokal wo möglich:** Linter (unten) über alle Dossiers; Lückenzähler aus dem Ladelog; Verfall in ≤ 7 Tagen → Prüfauftrag einreihen.
- **wöchentlich, eine frische Session, ohne Netz-Schreibrechte auf Dossiers:** H3-Prüfwelle (max. 10 Einzel-Fetches, je Quelle einer); Kandidaten-Quarantäne sichten; Promotion mit Begründung.
- **monatlich:** Nutzungskonto auswerten (unten), Kill-Check je Dossier, Aufteilen/Verschmelzen nach Länge.
- **bei jedem Projekt-Ende (Playbook `uebergabe`):** Ernte-Schritt: „welche drei Aussagen aus geladenen Dossiers haben getragen, welche waren falsch, was fehlte?" → Kandidaten.
- **bei jeder CLI-/Modell-Versionsänderung (Hook `SessionStart` vergleicht `claude --version` und Modell-ID mit `~/.soul/profile.json`):** alle H2-Aussagen des Werkzeugketten-Dossiers auf „zu prüfen" setzen (nicht sperren — Versionssprünge sind meist kompatibel; sperren tut nur der Verfall).

**Linter (deterministisch, Python, < 1 s, läuft auch als PreToolUse-Guard vor Schreibzugriffen auf `wissen/`):**
1. Frontmatter vollständig; `name` = Ordnername; `description` enthält „when/load when" und ≥ 3 Signalwörter.
2. Jede Zahl im Körper trägt Stufe + `@q` + Datum (Regex: Ziffernfolge ohne `[G|B|R]@q\d+` in derselben Zeile = Fehler).
3. Keine `[U]`-Aussage in der Kurzform.
4. Kurzform ≤ 160 Tokens; Langform ≤ 5.000; Verweise nur eine Ebene tief.
5. Duplikatzahl in zwei Dossiers ohne `abhaengig_von`-Verweis → Fehler („Duplication is evil").
6. Verfallsdatum ≥ heute, sonst Status `expired`.
7. `quellen.jsonl`: jede `@q`-ID existiert, hat `abgerufen_am` und `hash`.
8. Widersprüche: gleiche Entität, verschiedene Werte in zwei Dossiers → beide `disputed` (Memory-Lehre).
9. Verbotene Wörter (Chriso §7) im Körper → Fehler.
10. Sichtbarkeit: `private`-Dossier verlinkt aus `public`-Dossier → Fehler (Leck-Schutz für Miguel für alle).

**Versionierung und Rückbau:** Version = `YYYY-MM-DD.n`; jede Änderung ist eine neue Datei, die alte wandert nach `SUPERSEDED/` (Supersession statt Mutation); `log.jsonl` je Dossier: `{version, autor, begruendung, quellen_neu, aussagen_geaendert, rueckbau: "soul wissen rollback <name> <vorversion>"}`. Rückbau-Konto (N2): Jede proaktive Dossier-Änderung des Dirigenten ist mit einem Befehl rückbaubar; RETRACTED-Versionen werden nie wieder promoted.

**Wer darf ändern:** Der Dirigent (Miguel) — mit Begründung, Quelle und Rückbau — für `handwerk`/`atlas`; Kandidaten aus Unteragenten (Ebene ≥ 3) nur in `_candidates/`; Nutzer-Aussagen (Quelle `chriso`/`user`) nur mit wörtlichem Zitat (Memory-Regel); Schicht `profil` schreibt nur der Preflight/Onboarding-Pfad und der Nutzer. Ein `PreToolUse`-Guard erzwingt das im Code (nicht als Bitte): Schreibzugriff auf `wissen/<name>/DOSSIER.md` ohne gleichzeitigen `log.jsonl`-Eintrag wird blockiert.

**Qualitätsgate vor Promotion (Anti-Slop, Anti-Pattern 8):**
- Kill-Check: Wird das Dossier in 7 Tagen gebraucht (Lückenzähler ≥ 3 oder Aufgabenklasse belegt)? Führt es in ≤ 3 Schritten zu einer Aktion (Entscheidungsregeln vorhanden)? Wert > Aufwand × 5 (geschätzte Ladekosten × erwartete Ladehäufigkeit gegen erwartete Fehlervermeidung)?
- Name-Mechanismus-Abgleich: Der Name sagt Domäne und Zweck; nichts im Namen, was der Inhalt nicht hält.
- Primitivitäts-Check (Kontext §13.2): Ist das nur eine Nacherzählung der Quelle? Dann zurück zum Miner.
- Placebo-Frage: Würde ein gleich langer Fülltext denselben Effekt haben? Wenn die Kurzform keine *entscheidungsverändernde* Regel enthält, ist sie Rauschen.

**Nutzungskonto (die eigentliche Neuerung gegenüber allen Vorlagen):** Pro Dossier und Ladung schreibt das System `geladen += 1`. „Gewirkt" ist schwerer: (a) das Modell nennt in der Abweichungs-/Annahmezeile oder im Übergabe-Vertrag, welche Dossier-Regel es angewandt hat (`used: wissen/<name>#regel-3`) — deterministisch geparst; (b) bei Prüfung/Abnahme wird gefragt, ob eine Dossier-Regel den Fehler verhindert oder verursacht hat; (c) monatlich Stichprobe: 10 Aufgaben mit/ohne L1-Ladung (Placebo: gleich langer Fülltext), blind bewertet — das ist die Evaluation des Wissensorgans als Produktmerkmal (Kontext §13). Dossiers mit `gewirkt/geladen < 0,1` über 60 Tage fallen in L0-only (nicht gelöscht, aber nicht mehr proaktiv geladen); Dossiers mit hoher Wirkungsquote steigen im Index nach oben.

**Kosten der Pflege (Größenordnung, [Schätzung]):** 12 Dossiers × 5.000 Tokens = 60k Tokens Volltext; ein wöchentlicher Linter-Lauf ist deterministisch ($0); die H3-Prüfwelle ≈ 10 Fetches + ein Batch-Aufruf mit Cache-Prefix (Kernel + Rubrik) ≈ Cent-Bereich bei Fable-Cache-Read 0,025×; die monatliche Wirkungs-Stichprobe (10 Paare × 2 Arme × 3 Läufe = 60 Aufrufe) ist der teuerste Posten und läuft in Batch am Fensterende (R16 §2.3.5).

### 2.6 Erstbestand — Verzeichnis `wissen/`

Zehn Dossier-Skelette nach dem Schema aus §2.3, je 300–900 Wörter, mit Quellen aus dieser Front (alle Zahlen tragen Stufe, `@q` und Datum). Pfad: `/home/user/nextool/ordnung/docs/research/wissen/`.

| # | Dossier | Schicht | Sichtbarkeit | Verfall (Default) |
|---|---|---|---|---|
| 1 | [werkzeugkette-claude-code](wissen/werkzeugkette-claude-code.md) | handwerk | public | 2026-12-05 (H2) |
| 2 | [lokale-ki-einrichten](wissen/lokale-ki-einrichten.md) | handwerk/atlas | public | 2026-12-05 (H2) |
| 3 | [kontingent-kosten](wissen/kontingent-kosten.md) | handwerk/atlas | public | 2026-10-06 (H3-Zahlen) |
| 4 | [projekt-zu-ende-fuehren](wissen/projekt-zu-ende-fuehren.md) | handwerk | public | 2027-09-06 (H1) |
| 5 | [deployment-ohne-kosten](wissen/deployment-ohne-kosten.md) | atlas | public | 2026-10-06 (H3) |
| 6 | [recherche-quellenpflicht](wissen/recherche-quellenpflicht.md) | handwerk | public | 2027-09-06 (H1) |
| 7 | [startup-solo-gruender-at](wissen/startup-solo-gruender-at.md) | handwerk/atlas | public | 2026-12-05 (Förderzahlen 90 d) |
| 8 | [sicherheit-autonome-agenten](wissen/sicherheit-autonome-agenten.md) | handwerk | public | 2027-03-06 (H2) |
| 9 | [evaluation-ehrlichkeit](wissen/evaluation-ehrlichkeit.md) | handwerk | public | 2027-09-06 (H1) |
| 10 | [wissensorgan-selbstpflege](wissen/wissensorgan-selbstpflege.md) | handwerk | public | 2027-03-06 (H2) |
| — | [INDEX.md](wissen/INDEX.md) | generiert | public | — |

Die Skelette sind als Einzeldateien (`<name>.md`) angelegt, nicht als Ordner — der Ordner-Schnitt (`quellen.jsonl`, `proben/`, `SUPERSEDED/`) entsteht beim Bau (AP5); die Frontmatter-Felder sind bereits vollständig, damit der Linter aus §2.5 sie ab Tag 1 prüfen kann. Nicht angelegt (bewusst, Kill-Check): Schreiben & Kommunikation und Design & Produkt — beides liegt zu großen Teilen im Kernel (Anti-Performance, Formatregel) und in D6/D4 der Wissenskarte; ein eigenes Dossier entsteht erst, wenn der Lückenzähler es belegt.

---

## 3. Konsequenzen für das Design von Ordnung × SOUL

Alle Punkte als Bauvorlage formuliert; jede Zeile ist eine Hypothese („so gebaut, dass …") bis zur Messung (Kontext §13.4).

### 3.1 Struktur des Wissensorgans (Säule 3, Organ 4 neu)

1. **Verzeichnis `wissen/` mit drei Schichten und zwei Sichtbarkeiten.** `handwerk/` (universell, public, H1/H2), `atlas/` (R15-Daten, public außer Kontingentstände, H3), `profil/` (Nutzer/Projekt, private, aus Preflight gespeist). Der Build für „Miguel für alle" kompiliert nur `public`; der Linter blockiert `private`-Verweise aus `public`-Dossiers.
2. **Dossier = Ordner nach Agent-Skills-Schnitt** (§2.3): `DOSSIER.md` (Frontmatter + Kurzform ≤ 160 Tokens + Langform ≤ 5.000), `quellen.jsonl`, `regeln.md` (englische Textbausteine für Kernel/Übergabe-Verträge), `proben/`, `SUPERSEDED/`. Derselbe Ordner wird als Claude-Code-Skill, als `AGENTS.md`-Import und als Inline-Kurzform im portablen Kern verwendet.
3. **Index wird generiert, nie geschrieben.** `wissen/INDEX.md` entsteht aus den Frontmatters (Single Source of Truth); L0-Kosten ≤ 500 Tokens für 12 Dossiers; abgelaufene Dossiers erscheinen mit ⚠ und werden nicht in L1 gehoben.
4. **Erstbestand:** die zehn Skelette in `docs/research/wissen/` werden 1:1 nach `soul/wissen/` übernommen und beim Bau in den Ordner-Schnitt gebracht; die Frontmatters sind bereits linter-fähig.

### 3.2 Ladeprotokoll als Mechanismus (kein Willensakt)

5. **UserPromptSubmit-Hook `wissen_router.py`** (< 200 ms, ohne Netz): Signale (R10-`signals.ts`-Erweiterung + 11 Domänensignale) → Index-Match → Verfallsprüfung → ≤ 3 Zeilen additionalContext mit L1-Kurzformen (max. 3) und L2-Angebot (max. 2) → JSONL-Log `{ts, signale, kandidaten, geladen_stufe, versionen}` in die Wache. **Ohne Log-Zeile hat kein Laden stattgefunden.**
6. **Kernel-Regel für die Nachwahl** (englisch, ≤ 40 Wörter): *After rereading the request as the author and completing the brief, check the knowledge index for a domain the hook did not flag; load at most one short form. Never load more than two long forms per task.*
7. **Tiefenkopplung an R10-Stufen:** trivial → L0; Standard → L1; durable/irreversible/architecture → L1+L2+L3 für entscheidungsrelevante H3-Zahlen; Preflight → Atlas L2 + Proben; Ebenen 3–6 → nur `regeln.md`-Bausteine im Übergabe-Vertrag.
8. **Subagenten-Preload:** Agent-Frontmatter `skills:` (R14 nennt es als ungenutzten nativen Mechanismus) lädt für Verifizierer `evaluation-ehrlichkeit`, für Recherche-Agenten `recherche-quellenpflicht` + `sicherheit-autonome-agenten` — statt es ihnen im Prompt zu erzählen.
9. **Lückenzähler:** Signal ohne Index-Treffer → `luecke`-Ereignis; ≥ 3 in 7 Tagen → Dossier-Kandidat mit Auslöser-Description zuerst.

### 3.3 Pflege als Schedule + Linter + Konto

10. **Linter `soul wissen lint`** mit den zehn Regeln aus §2.5 (Frontmatter, Zahl ohne Stufe/@q/Datum, kein [U] in Kurzform, Budgets, Duplikatzahl, Verfall, Quellen-IDs, Widersprüche, verbotene Wörter, Sichtbarkeitsleck) — läuft täglich und als PreToolUse-Guard vor jedem Schreibzugriff auf `wissen/`; Schreibzugriff ohne `log.jsonl`-Eintrag wird blockiert (Algorithmus schlägt Willensakt).
11. **Routinen:** täglich Lint + Verfallsvorschau (deterministisch, $0); wöchentlich H3-Prüfwelle in frischer Session ohne Netz-Schreibrecht auf Dossiers (≤ 10 Fetches, Batch + 1-h-Cache); monatlich Nutzungskonto + Kill-Check + Placebo-Stichprobe (10 Aufgaben × 2 Arme × 3 Läufe, Batch am Fensterende); bei Projekt-Ende Ernte-Schritt im `uebergabe`-Playbook; bei CLI-/Modellwechsel (SessionStart vergleicht Version/Modell-ID mit `profile.json`) H2-Aussagen des Werkzeugketten-Dossiers auf „zu prüfen".
12. **Kandidaten-Quarantäne:** `wissen/_candidates/` mit `trust: untrusted|document|user|measured`; untrusted wird nur in einer Session ohne Netz und ohne Secrets promoted (Lethal Trifecta gebrochen). Das gilt auch für Legacy-Mining aus fremden Repos.
13. **Supersession und Rückbau:** `soul wissen promote <kandidat>` erzeugt neue Version, verschiebt die alte, schreibt `log.jsonl` mit Begründung und `rollback`-Befehl; RETRACTED-Versionen sind nie wieder promotbar (N2).
14. **Nutzungskonto als Produktmerkmal:** `geladen` aus dem Hook-Log; `gewirkt` aus (a) deterministisch geparsten `used: wissen/<name>#regel-n`-Referenzen in Abweichungszeile/Übergabe-Vertrag, (b) Prüfer-Frage „hat eine Dossier-Regel den Fehler verhindert/verursacht?", (c) monatlicher Blind-Stichprobe. `gewirkt/geladen < 0,1` über 60 Tage → L0-only; 180 Tage ohne Nutzung → `SUPERSEDED/` mit Grund (negatives Wissen).

### 3.4 Schnittstellen zu den anderen Säulen und Fronten

15. **Zum Gedächtnis (Säule 1):** Wissen und Gedächtnis bleiben getrennte Speicher mit gleicher Herkunfts-/Vertrauens-/Verfallssemantik; die 3–5 tragendsten Aussagen jedes promoteten Dossiers werden Gedächtnis-Kandidaten (`muster`/`fakt`, Quelle `mining`, Vertrauen 0,4) mit `ref: wissen/<name>@<version>`; umgekehrt werden Gedächtnis-Muster, die ≥ 3× über Projekte hinweg bestätigt sind, Dossier-Kandidaten (Konsolidierung/„Schlaf").
16. **Zum Kernel (Säule 2):** Der Kernel trägt nur (a) die Nachwahl-Regel (6), (b) die Haltung „bester KI-Nutzer" als eine Zeile, (c) im portablen Modus Index + Kurzformen inline (≈ 1.000 Tokens, gegen Placebo zu messen — R10 §2.9.5). Kein Dossier-Inhalt im Kernel.
17. **Zum Atlas (R15):** `atlas/` ist die Schicht mit dem kürzesten Verfall; R15 §3.1 (Datenstruktur) und §3.5 (Pflege) werden als `atlas/`-Dossiers mit H3-Default übernommen; `profile.json` ist die `profil/`-Schicht.
18. **Zur Knappheit (R16):** `kontingent-kosten` ist die Dossier-Form von R16 §3.1; die Scarcity-Textbausteine leben in dessen `regeln.md` und werden Ebenen 3–6 im Vertrag mitgegeben.
19. **Zur Evaluation (R08/Säule „Evaluation als Produktmerkmal"):** Vorregistrierte Falsifikationsbedingung des Wissensorgans (im Dossier `wissensorgan-selbstpflege`): Zeigt die monatliche Placebo-Stichprobe über 3 Monate keine Wirkung geladener Kurzformen, ist das Handwerks-Wissensorgan Verwaltung — dann bleibt nur `atlas/` (Fakten, die kein Modell wissen kann). Auflösung 2026-12-06.

### 3.5 Onboarding und Consent by Design

20. Der Preflight (R15 §3.3) füllt `profil/` und markiert im Index, welche Atlas-Dossiers für diesen Nutzer relevant sind (kein lokales Modell → `lokale-ki-einrichten` bleibt L0-only). Die einmalige Zustimmung (Kontext §11b) umfasst ausdrücklich: „Soul darf Dossiers anlegen, ändern, verwerfen und dafür Quellen abrufen — sichtbar im Log, rückbaubar per Befehl." Ring-2-Fragen aus Dossiers (Abos, Konten, Förderanträge) werden gebündelt gestellt, mit Optionen und „was passiert ohne".

---

## 4. Widersprüche / Unsicherheiten

1. **Gegen den Brief:** „SOUL hat dafür bereits knowledge/ und playbooks/, geladen bei Aufgabenstart" — das Laden ist eine Anweisung in einem Playbook, das selbst nur auf Anweisung gelesen wird; nach SOULs eigener Regel ist das ein toter Mechanismus (§2.1). Der Befund von R14 (Organ 4: „Anweisung, kein Mechanismus") wird hier bestätigt und verschärft.
2. **Gegen Chrisos These §11a („das Modell weiß mit der richtigen Anforderung mehr als jeder Mensch"):** Für Handwerkswissen (H1) plausibel, für Atlas-Wissen (H3) falsch — Modellwissen hat Stichtage; in dieser Front nannte die aws-Programmseite keine Beträge, die FAQ schon; Modellnamen/Preise ändern sich monatlich. Das Wissensorgan muss deshalb genau dort am dichtesten sein, wo das Modell am wenigsten weiß (Atlas), und dort am dünnsten, wo es viel weiß (Handwerk) — die Wirkungsmessung wird zeigen, ob Handwerks-Dossiers überhaupt tragen (Falsifikationsbedingung 3.4/19).
3. **Unsicherheit Wirkung vs. Placebo:** R10/R16 und Chrisos HumanEval zeigen, dass etwa die Hälfte eines Prompt-Effekts Kontexteffekt ist. Geladene Kurzformen (≈ 500 Tokens) könnten denselben Kontexteffekt erzeugen wie Fülltext. Die monatliche Placebo-Stichprobe ist deshalb nicht optional.
4. **Karpathy-Gist nicht direkt gelesen** (403); Wortlaut aus Sekundärquellen (Hermes-Doku, Blogs). Die Struktur (raw/wiki/schema, lint, log) ist konsistent über drei Sekundärquellen, der Gist-Wortlaut bleibt [U].
5. **Sekundärzahlen:** Quantisierungs-Perplexitäten (arXiv 2601.14277 Tabelle nicht abgerufen), Zitat-Halluzinationsraten 14–95 % und 1:458 (Primärpapiere nicht abgerufen), FlexKapG-Details (WKO-Seite nicht abgerufen), Vercel/Netlify/Supabase (R15 Sekundär). Alle sind im Schema als `B-Sekundär` markiert und stehen auf der ersten H3-Prüfliste.
6. **Skill-Listing-Budget vs. 10 Dossiers:** R10 §2.9.2 nennt ≤ 6 modell-aufrufbare Skills auf 200k-Modellen. Zehn Dossiers als Skills sprengen das. Lösung im Design: Dossiers sind *nicht* modell-aufrufbare Skills, sondern werden vom Hook gereicht (L1) und per Dateipfad geladen (L2); nur 2–3 Bündel-Skills (z. B. `wissen-handwerk`, `wissen-atlas`) bleiben im Listing. Das ist zu messen (Trefferquote Hook vs. Skill-Router).
7. **Wer misst „gewirkt"?** Die Regel-Referenz (`used: …`) verlangt vom Modell eine Selbstauskunft — dieselbe Klasse von Beleg, die Chriso für Bewusstsein ablehnt. Sie ist deshalb nur *ein* Signal von drei; die Blind-Stichprobe ist das tragende.
8. **Zwei Domänen bewusst ohne Dossier** (Schreiben/Kommunikation, Design/Produkt): Kill-Check ohne Lückenbeleg. Wenn der Lückenzähler sie einfordert, entstehen sie; bis dahin ist der Kernel (Anti-Performance, Formatregel) zuständig. Mögliche Fehleinschätzung.
9. **Kosten der Pflege** sind Schätzungen (§2.5), keine Messung. Die erste monatliche Auswertung liefert die Zahl.
10. **Datum-Inkonsistenz in Quellen:** Die MCP-Security-Seite ist unter dem Pfad `2025-06-18` erreichbar, verweist aber intern auf Spec `2025-11-25`; im Dossier so vermerkt.

---

## 5. Quellen

**Web (alle Abruf 2026-09-06):**
- https://code.claude.com/docs/en/memory — CLAUDE.md-Hierarchie, Imports, Rules, Auto-Memory
- https://code.claude.com/docs/en/security — Prompt-Injection-Schutz, Sandbox, MCP-Security, Cloud
- https://agentskills.io/specification — Agent-Skills-Schema, Progressive Disclosure, Budgets
- https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents — Initializer/Coder, Feature-Liste, Fehlbilder
- https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/ — Lethal Trifecta
- https://genai.owasp.org/llm-top-10/ — OWASP LLM Top 10 2025
- https://modelcontextprotocol.io/specification/2025-06-18/basic/security_best_practices — MCP Security Best Practices (verweist auf 2025-11-25)
- https://developers.cloudflare.com/workers/platform/limits/ — Workers Free/Paid
- https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits — Pages-Limits, Kommerzklausel
- https://google.github.io/styleguide/docguide/best_practices.html — Doku-Praxis
- https://arxiv.org/abs/2605.07723 — Zhao et al., LLM hallucinations in the wild (Zitate)
- https://arxiv.org/abs/2601.14277 — Kurt, llama.cpp-Quantisierungs-Evaluation (nur Abstract)
- https://www.aws.at/en/aws-preseed-faq/ — Preseed-Zahlen
- https://www.aws.at/en/aws-preseed-seedfinancing/ — Programmlinien
- https://paulgraham.com/ds.html — Do Things That Don't Scale
- https://hermes-agent.nousresearch.com/docs/user-guide/skills/bundled/research/research-llm-wiki — LLM-Wiki-Muster (Karpathy-Gist-Sekundär)
- WebSearch-Zusammenfassungen (Sekundär): GGUF-Quantisierung 2026; Zitat-Halluzinationsraten; aws Preseed 2026; FlexKapG/FlexCo; Karpathy LLM Wiki
- Fehlgeschlagen (403): https://www.kunalganglani.com/blog/llm-wiki-karpathy-local-knowledge-base

**Lokal:**
- `/home/user/nextool/ordnung/docs/research/00-KONTEXT-FUER-AGENTEN.md` (§1–13)
- `/home/user/nextool/ordnung/docs/research/briefs/R17.md`
- `/home/user/soul/knowledge/{INDEX.md, denk-architekturen.md, forschung-2026-09.md}`, `/home/user/soul/playbooks/{preflight.md, recherche.md}`, `/home/user/soul/.claude/agents/legacy-miner.md`
- Nachbarfronten: `R10-tiefensteuerung-routing-kosten.md` (§2.3, §2.9), `R14-soul-basis-kritik-und-dirigent.md` (Organ 4, Ä11), `R15-ressourcen-atlas.md` (§2.1.6, §2.2), `R16-meisterschaft-unter-knappheit.md` (§2.3, §2.4)

**Erzeugte Artefakte:** `/home/user/nextool/ordnung/docs/research/wissen/{INDEX.md, werkzeugkette-claude-code.md, lokale-ki-einrichten.md, kontingent-kosten.md, projekt-zu-ende-fuehren.md, deployment-ohne-kosten.md, recherche-quellenpflicht.md, startup-solo-gruender-at.md, sicherheit-autonome-agenten.md, evaluation-ehrlichkeit.md, wissensorgan-selbstpflege.md}`
