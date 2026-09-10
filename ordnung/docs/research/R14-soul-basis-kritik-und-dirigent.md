# R14 — Adversariale Prüfung der SOUL-Basis (2. Sept.) und Dirigenten-Architektur für Soul 10.0.0

*Recherche-Front R14, Stand 2026-09-06. Auftrag: `briefs/R14.md`. Kontext: `00-KONTEXT-FUER-AGENTEN.md` (§2, §10–13). Maßstab: Gold aus Erz (§13). Quellenregel: nur, was in Tool-Ergebnissen gesehen wurde; Erinnerungswissen als [unverifiziert].*

## 1. Kernaussagen (mit Quellen)

1. **Die SOUL-Basis vom 2.9. ist ein richtig geschnittenes Gerüst ohne Betriebsbeweis.** `git log` = 1 Commit (e3f2ce3); `gates/SOL-LOG.md` = 3 Kopfzeilen; `missions/` existiert nicht; `watch/` = 22 Event-Zeilen aus einem Rampen-Test (`echo hallo`, fünfmal derselbe Deny-Drill). Der Schnitt in sieben Organe (Wache/Gedächtnis/Wissen/Orchester/Gegenstimme/Prüfung getrennt) ist die richtige Basis; die Füllung ist Spezifikation — dieselbe Diagnose, die `knowledge/orchestrierung.md` über den Vorgänger stellt („vollständig spezifiziert, NIE gelaufen"). (§2.1)
2. **Fünf Stücke sind Gold und werden verallgemeinert übernommen:** der pfad-exakte Guard mit sichtbarem, befristetem Mandat (37 Tests), `verdict.schema.json` als Prüfer-Vertrag für jede Ebene, das PENDING→CLOSED-Protokoll mit Modell-Echo aus `sol.sh`, `verdict="not-evaluated"` als Datenmodell, die Doctor-Modellprobe — plus die Filter aus `denk-architekturen.md` (Kill-Check, Name-Mechanismus-Abgleich, „Algorithmus schlägt Willensakt"). (§2.6 B1–B8)
3. **Die Basis verletzt ihre eigene wichtigste Regel:** „Code ohne Trigger = toter Mechanismus". Gedächtnis füttern, Playbook laden, Kritiker spawnen, Sol-Gate, Drift-Wache — alles Prompt-Anweisungen (CLAUDE.md 3–8), kein Hook, kein Zähler; der `post-tool`-Zweig existiert in `events.py`, ist in `settings.json` nicht registriert; `SOUL.md` verspricht „Stop konsolidiert" und `watch/receipts/`, beides existiert nicht; `memory/README.md` beschreibt ein Forge-Memory mit Skripten, die im Repo fehlen. (§2.1 Organe 2–7)
4. **Für 3–6 Ebenen fehlt die Struktur:** genau ein Vorhaben gleichzeitig (`mission.new` wirft `RuntimeError`), Abnahmekriterien als Freitext, keine Ausführenden-Rollen (alle fünf Agents sind Prüfer/Leser), keine Workflows/Teams/`-p`-Worker, keine Kosten- oder Agent-Identität im Event-Record, zwei Log-Wahrheiten (`events.jsonl` vs. `sol-runs/`). (§2.1, §2.4)
5. **Der Kritik-Trigger liegt im Ermessen des Dirigenten** — exakt der Red-Team-Befund B1, den SOULs eigenes Dossier als „die Lücke" benennt: „jeder 3. Baustein → Sol-Gate" steht in `playbooks/bauen.md`, nicht in einem Zähler. (§2.1 Organ 5)
6. **Universalität ist null:** zsh-Wrapper, `pbcopy`, `open`/`.command`, `/opt/homebrew`, `tcsetpgrp`, Statusline mit hartem `$HOME/SOUL`, `Chriso` im Kernel, `PROJEKT-START.md` als Bauauftrag statt Onboarding; `.mcp.json` leer bei `--strict-mcp-config` → der „beste KI-Nutzer der Welt" startet ohne ein einziges Werkzeug des Nutzers. (§2.5)
7. **Der Guard ist Chrisos persönliche Ring-2-Liste, als Produkt-Default zu breit und zugleich unvollständig:** `_HTTP_WRITE` sperrt jeden `curl -X POST` auf Nicht-Localhost, `_REMOTE_DELETE` jedes `DELETE FROM x;` (auch lokale SQLite); Publizieren und Prod sind projektabhängig. Universeller Kern: Secrets-Exfiltration, Zahlungen, irreversible Fremdlöschung, Wache-Integrität; Rest ins Zustimmungsprofil beim Onboarding (stehende Mandate mit Geltungsbereich statt 15-Minuten-Mandat). (§2.1 Guard, §2.5)
8. **Stand der Kunst konvergiert auf fünf Dinge, die SOUL nur als Text hat:** Zustand als Datei mit pass/fail-Probenliste, die niemand löschen darf (Anthropic-Harness); Delegation mit „objective, output format, tool guidance, task boundaries" (Anthropic-Research); Verifikation durch eine fremde Instanz, mechanisch (Ralph-Kritik, MAST „failing to verify their outputs"); Parallelität nur bei Unabhängigkeit (Cognition, Anthropic: „most coding tasks involve fewer truly parallelizable tasks"); Token als erste Steuergröße („token usage by itself explains 80% of the variance"; Manus: KV-Cache-Hit-Rate = Metrik Nr. 1, 10× Preis). (§2.2)
9. **Claude Code liefert 2026 die Primitive für alle sechs Ebenen:** Subagents bis Tiefe 3 mit `maxTurns`/`isolation`/`memory`/eigenen Hooks, Dynamic Workflows (16 parallel, 1.000/Run, resumierbar, keine Nutzereingabe mitten im Lauf), experimentelle Agent Teams (kein Nesting, nicht in `-p`), `claude -p` mit `session_id`/`total_cost_usd`/`--json-schema`/Subagent-Baum im `stream-json`, Cross-Session-Messaging (Nachricht ≠ Zustimmung), >30 Hook-Events mit Exit-2-Blockade (`TaskCompleted`, `SubagentStop`, `Stop`, `PreCompact`), Plugins mit `settings.json` `agent` als Main-Thread. Ebene 4–6 entstehen durch Komposition, nicht durch tieferes Nesting. (§2.2g, §2.4)
10. **Die Dirigenten-Schleife (§2.3, ~720 Wörter englisch)** ersetzt CLAUDE.md-Arbeitsweise + PROJEKT-START durch acht Schritte mit Stoppregeln: Situieren (Atlas/Profil) → Ziel hinter dem Ziel als Vertragsdatei → das Mögliche kartieren → kleinste tragende Ebenenstruktur → Übergabe-Vertrag als Datei → ausführen/beobachten mit Fehlweg-Reflex → getrennt verifizieren → Schleife schließen; Ausgänge „blocked"/„not-evaluated"/Budget sind immer verfügbar (Anti-Ralph). Sie ist Hypothese und wird gemessen (N11).
11. **„Der Prüfer fällt zuerst weg" wird mechanisch gelöst:** `TaskCompleted` Exit 2 ohne Receipt, `Stop`-Hook blockt „fertig" ohne Verifizierer-Urteil, Zähler-Hook erzwingt jede 3. Lieferung bzw. jedes `netz|install|security`-Flag ein Gate außerhalb des Dirigenten. (§2.4)
12. **Gegenstimme muss ohne Codex existieren:** als Unabhängigkeitsmechanismus (Fremdmodell, sonst Selbstkonsistenz@3 mit frischem Kontext — der gemessen stärkste Gegner, Kontextpaket §3), Backends aus dem Profil. (§2.6 Ä7, N8)

## 2. Detailbefunde

### 2.1 Kritik der Basis: die sieben Organe

Methode: Jedes Organ wurde gegen vier Fragen geprüft — (a) Was trägt, mit Beleg im Code oder in Chrisos Messungen? (b) Was ist Verwaltung statt Wirkung (Invariante 1)? (c) Was ist nur spezifiziert, nie gelaufen? (d) Was fehlt für das Zielbild §10–12 (Projekt allein zu Ende führen, 3–6 Ebenen, Ressourcen optimal nutzen, universell)? Betriebsbefund über alle Organe: **1 Commit** (`git log`: e3f2ce3, 2026-09-02), **`missions/` existiert nicht**, **`gates/SOL-LOG.md` hat 3 Kopfzeilen und keinen Eintrag**, **`watch/` enthält 22 Event-Zeilen** aus einem Rampen-Test (14 + 8 Zeilen; Inhalt: `echo rampe-test`, `echo hallo`, fünfmal der identische Deny-Drill `gh repo delete org/x --yes`). `memory/` enthält nur eine README. `tests/` hat 57 Testfunktionen (20 core, 37 guard) — der Guard ist das einzige Organ mit substanzieller Testabdeckung. Das ist kein Vorwurf an den Bau (drei Tage alt), aber die ehrliche Basis: **Soul 10 erbt Spezifikationen und einen Guard, keine Betriebserfahrung.**

#### Organ 1 — STARTER (`bin/soul`, `core/starter.py`, `core/doctor.py`)

**Trägt:** Der Doctor mit echter Modell-Probe (`claude -p ok --model … --strict-mcp-config`, `doctor.py` Z. 108–112) statt `--init-only`-Theater — eine teuer gelernte Korrektur (`forschung-2026-09.md`: „`--init-only` validiert Modell-IDs NICHT"). Drei Ergebnisklassen OK/WARN/FEHLT, harte Fehler blockieren den Start. Die Prozessgruppen-Attestierung (`_register_run`, `watch/run.json`) als einzige Not-Stopp-Basis ist richtig gedacht (M1 „Anspruch vor Arbeit"). Das Profil-Konzept (`PROFILES = {vollgas, probe}`) ist der Keim einer Profilerkennung.

**Verwaltung/Hack:** Der Startauftrag gelangt per `pbcopy` ins Clipboard und muss von Hand mit Cmd-V eingefügt werden (`_clipboard_start_prompt`). Das ist ein Workaround für „wie bekomme ich den Erstauftrag in die Session" — der offizielle Weg ist ein Prompt-Argument bzw. `--append-system-prompt`/SessionStart-Hook mit `additionalContext` (Hooks-Doku: Plain-Text-Ausgabe eines SessionStart-Hooks wird „added as context"). `--permission-mode bypassPermissions` **und** `--dangerously-skip-permissions` gleichzeitig ist doppelt. `--fallback-model claude-opus-5` ist hart verdrahtet.

**Nie gelaufen / blind:** `.mcp.json` ist `{"mcpServers": {}}` und der Start erzwingt `--strict-mcp-config` + `--setting-sources project`: **Alle Nutzer-MCPs, Nutzer-Skills, Nutzer-Hooks sind ausgesperrt.** Für Chrisos Isolationszweck (rtk-Umleitung draußen halten) ist das richtig; für den „besten KI-Nutzer der Welt" (§11a), der alles nutzen soll, was dem Nutzer zur Verfügung steht, ist es die Antithese: Der Dirigent startet mit **null externen Werkzeugen**. Kein Ressourcen-Atlas, keine Erkennung von Abos/CLIs/Geräten (§11b), keine Bestandsaufnahme.

**Mac-spezifisch (muss abstrahiert werden):** `#!/bin/zsh` + `emulate -L zsh` in `bin/soul` (und allen vier bin-Wrappern), `pbcopy`, `open <file>.command`, generiertes `watch/monitor.command` mit `#!/bin/zsh`, Fallback `/opt/homebrew/bin/claude`, `tcsetpgrp` auf `/dev/tty` (POSIX, aber auf Windows nicht existent), Desktop-`SOUL.command`. `statusline.sh` (zsh) liest hart `$HOME/SOUL/missions/current.json` — ein zweiter, vom `ROOT` abweichender Pfad, der bricht, sobald das Repo nicht in `~/SOUL` liegt.

**Fehlt für Zielbild:** Onboarding (einmalige gebündelte Zustimmung, Bestandsaufnahme), Profilerkennung (Modell, Abo, Gerät, OS, RAM/GPU, installierte CLIs), plattformneutraler Launcher, Plugin-Verpackung. Die Startsequenz in `PROJEKT-START.md` ist Chrisos Bauauftrag für Soul selbst — es gibt **kein** generisches „Nutzer nennt Ziel → Soul führt durch"-Eintrittsdokument.

#### Organ 2 — WACHE (`core/events.py`, `core/monitor.py`, `.claude/hooks/hook.py`, `settings.json`)

**Trägt:** Append-only JSONL mit Rotation bei 5 MB (Lehre aus dem GPT-Forge-Monitor), Secret-Maskierung vor dem Schreiben (`_SECRET_MASK`), Flaggen `install|netz|schreibt|agent` für das, was ein Nutzer sofort sehen will, fail-open beim Loggen / fail-closed beim Guard-Treffer — das ist die richtige Asymmetrie. Der Deny-Pfad ist getestet (37 Guard-Tests) und im Rampen-Log sichtbar. `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB=1` ist Schadensbegrenzung vor dem Not-Stopp.

**Code ohne Trigger:** `events.py` implementiert einen `post-tool`-Modus (Z. 145–147), aber `settings.json` registriert **keinen PostToolUse-Hook**. Ebenso fehlen `SubagentStart`/`SubagentStop`, `PostToolUseFailure`, `SessionEnd`, `UserPromptSubmit`, `Notification`, `TaskCompleted`, `TeammateIdle` — alle in der Hooks-Doku verfügbar. Damit sieht die Wache: Tool-Aufrufe **vor** ihrer Ausführung, aber **weder Ergebnis noch Fehler noch Dauer noch Kosten**. „Sichtbarkeit statt Erlaubnis" ist der Vertrag — die Wache liefert derzeit nur die Absicht, nicht die Wirkung. Der Monitor ist ein Terminal-Fenster auf dem Mac (`monitor.command`); für Remote/Mobile (§11b „Live-Ansicht als Vertrag") gibt es nichts.

**Blind für Ebenen:** Der Event-Record hat `ts, event, tool, summary, flags` — **keine `agent_id`/`agent_type`**, obwohl die Hooks-Doku sie liefert („the input carries the `agent_id` and `agent_type` … that identify the subagent"). Bei 3–6 Ebenen kann Chriso im Monitor nicht unterscheiden, wer handelt. Getrennte Sessions (`claude -p`, Codex via `sol.sh`) erscheinen gar nicht im Event-Strom (sol.sh schreibt eigene `watch/sol-runs/<id>/`), also existieren zwei Wahrheiten — genau das „Shadow-Logging"-Anti-Pattern Nr. 7 aus `denk-architekturen.md`.

**Was fehlt:** Kosten-/Token-Buchung pro Ereignis und Ebene, Dauer, Ergebnisstatus, Agent-Identität, Sitzungs-ID, ein Bus, an den auch Fremdsessions/Fremdmodelle emittieren (HTTP-Hook oder Socket), ein Web-/Mobile-fähiger Monitor (Dossier `forschung-2026-09.md` empfiehlt bereits Fork statt Neubau), Not-Stopp über Ebenen hinweg (`soul stop` kennt nur die attestierte PGID des Dirigenten; Workflows und Teams laufen in eigenen Prozessen).

#### Organ 3 — GEDÄCHTNIS (`core/memory.py`, `memory/`)

**Trägt:** SQLite+FTS5, Typen, Status-Lebenszyklus, 16-KB-Cap („eine Memory ist ein Fakt, kein Dokument"), Secret-Guard vor dem Insert, Chriso-Zitatpflicht, Briefing ≤8 Einträge bei SessionStart (`briefing()` Z. 159–182). Das ist ein sauberer Minimalkern.

**Name ≠ Mechanismus:** `SOUL.md` sagt „SessionStart injiziert Briefing, **Stop konsolidiert**". Der Stop-Modus in `events.py` loggt ausschließlich `"Turn beendet"`. Es gibt keine Konsolidierung — der Name verspricht einen Mechanismus, der nicht existiert (Invariante 5 verletzt). `memory/README.md` beschreibt ein „Forge Memory" mit Hash-Kette, Zustandsmaschine `raw→candidate→reviewed→active→superseded→tombstoned`, `scripts/memory_store.py`, `soul_mcp_server.py`, `kernel/schemas/` — **nichts davon existiert im Repo.** Das ist ein Dokument über etwas, das es nicht gibt (Invariante 1, wörtlich).

**Willensakt statt Algorithmus:** Fütterung (`bin/soul remember`) und Abruf (`bin/soul recall … VOR Datei-Lesen`) sind Prompt-Anweisungen (CLAUDE.md Punkt 7). Chrisos eigener Betriebsbefund (Kontextpaket §3: 93 Einträge in 47 Tagen, 5 vom Nutzer) plus die Bau-Regel „Algorithmus schlägt Willensakt" verlangen Hooks: `UserPromptSubmit` → recall mit `additionalContext`; `PostToolUse`/`SubagentStop`/`Stop` → Kandidaten-Extraktion; `PreCompact` → Sicherung. Nichts davon ist verdrahtet. Die volle Gedächtnisarchitektur ist Front R05; hier zählt nur: **das Organ lebt nicht, weil kein Arbeitsfluss es füttert.**

#### Organ 4 — WISSEN (`knowledge/*.md`, `playbooks/*.md`)

**Trägt:** Die Dossiers sind echtes Gold: `denk-architekturen.md` (geschlossener Kreis, Kill-Check, 12 Anti-Patterns mit Beleg), `soul-forschung.md` (Messungen), `orchestrierung.md` (vier Mechanismen, Rollen-Tiers, Hook-Lehren). Playbooks sind kurz (10–24 Zeilen) und operativ.

**Verwaltung/Willensakt:** „Playbook laden bei Aufgabenstart" ist Anweisung, kein Mechanismus — es gibt keinen Skill-Trigger, keinen Hook, keine Aufgabenklassifikation. Claude Code hat dafür native Formen (Skills mit `description`-Trigger, `skills:`-Preload in Agent-Frontmatter), die ungenutzt bleiben. `INDEX.md` sagt „vor jedem größeren Bauvorhaben lesen" — 5 Dossiers à 50–80 Zeilen sind noch tragbar, skalieren aber nicht auf das Wissensorgan aus §11a/§11c (Ressourcen-Atlas, Knappheits-Strategien, Modell-Dossiers, Live-Recherche).

**Falsches Wissen im Dossier (adversarialer Fund):** `forschung-2026-09.md` behauptet „Ultracode … bis 1000 Subagents, 16 parallel" — die Workflows-Doku bestätigt beides (1.000 Agents/Run, 16 concurrent), gut. Aber „klassischer Ralph-Loop (durch native Workflows obsolet)" und „Agent Teams für dauerhafte Rollen" sind unbelegte Einschätzungen, und **der Stand ist personen- und projektgebunden** (Chrisos Mac, Chrisos Abos, Codex-Login). Für das Produkt braucht das Wissensorgan drei Schichten, die hier fehlen: (1) universelles Handwerkswissen (wie nutzt man KI optimal), (2) Ressourcen-Atlas (was gibt es, was kostet es, wie erkennt man es — R15), (3) Nutzer-/Projektprofil. Plus ein Pflegeprotokoll mit Verfall (Modellnamen, Preise und CLI-Flags ändern sich wöchentlich — die KORREKTUR-Sektion des Dossiers beweist es selbst).

#### Organ 5 — ORCHESTER (`.claude/agents/*.md`, `settings.json`)

**Trägt:** Fünf Rollen mit erzwungener Form: `kritiker` („3 Gründe warum das scheitern könnte:" wörtlich, sieht nur Artefakte), `verifizierer` (fail-closed: „was du nicht prüfen kannst, ist nicht bestanden"; einziger, der Abnahme urteilt), `drift-wache`, `recovery-doktor` („Rate nie"), `legacy-miner`. Alle Prüfer sind read-only (Tools: Read, Grep, Glob, Bash) — richtig. `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=3` und `subagentPromptCacheTtl: 1h` sind gesetzt.

**Strukturlücke:** Alle fünf Agents sind **Prüfer oder Leser**. Es gibt **keinen Builder, keinen Researcher, keinen Installer, keinen Planer** — obwohl `orchestrierung.md` fordert „Dirigent (baut NIE selbst)" und `PROJEKT-START.md` sagt „Du dirigierst, du baust nicht alles selbst". Wer baut, ist der `general-purpose`-Default ohne Vertrag. Die Rollen für Ebene 3–6 (Ausführende) fehlen komplett.

**Kritik als Ermessen (der Red-Team-Befund B1 gegen sich selbst):** `orchestrierung.md` nennt als Mechanismus 2 den „deterministischen Cross-Model-Trigger außerhalb des Dirigenten" und warnt: „Dirigent entscheidet ob er kritisiert wird ist die Lücke." In SOUL steht der Trigger als Text in `playbooks/bauen.md` Punkt 6 („jeder 3. Baustein ODER Code mit Daemon/Netz/Security-Bezug → Sol-Gate") — also **im Ermessen des Dirigenten**, exakt die Lücke. Kein Zähler, kein Hook, kein `TaskCompleted`-Gate. „Kritiker sieht NUR Artefakte" ist ebenfalls nur Instruktion: der Dirigent schreibt den Spawn-Prompt und kann seine Begründung hineinschreiben. Mechanisch erzwingbar wäre es über ein Artefakt-Manifest (Pfade + Hashes) als einzigen Input.

**Nie gelaufen:** Keine Workflows (`.claude/workflows/` fehlt), obwohl `workflowSizeGuideline: large` gesetzt ist. Keine Agent-Teams (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` nicht gesetzt; die Doku: „disabled by default … experimental"). Keine Cross-Session-Nutzung (`claude -p`-Worker, `SendMessage`). Die Wellen-Regel (2–3 Agenten gleichzeitig, Kontextpaket §3) steht nirgends im Code — `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` (Default 20 laut Doku) ist nicht gesetzt.

#### Organ 6 — GEGENSTIMME (`gates/sol.sh`, `verdict.schema.json`, `SOL-LOG.md`)

**Trägt (das reifste Stück Code):** 288 Zeilen, adaptiert aus `delegate.sh v2` mit Betriebsnarben: Run-Verzeichnis pro Lauf (`prompt.md, stdout.md, stderr.log, meta.json, verdict.json`), Prompt-Hash, **Modell-Echo** in `meta.json` („Stilles Downgrade wäre sichtbar"), Schema-erzwungenes Urteil (`--output-schema`, Exit 65 bei Verletzung), Transport-Retry max 2, **nie Retry bei fachlichem `fail`**, zweiphasiges Log PENDING→CLOSED, Exit-Codes 64–68. Das Verdict-Schema verlangt pro Befund `evidenz[{pfad, zeile}]`, `annahmen`, `blind_spots`, `dateien_geprueft`, `tests` — ein exzellenter Vertrag für jede Prüfer-Ebene, nicht nur für Sol.

**Nie gelaufen:** SOL-LOG ist leer. Es gibt keinen einzigen `watch/sol-runs/`-Eintrag im Repo. Die „vier Pflicht-Gates" sind Prompt-Regeln (CLAUDE.md Punkt 5) — kein Hook, kein Zähler ruft sie. Ob GPT-5.6 via Codex-CLI an SOULs Repo überhaupt ein schema-valides Urteil liefert, ist auf diesem Stand ungeprüft.

**Hart verdrahtet / Chriso-spezifisch:** `CODEX_BIN="/opt/homebrew/bin/codex"`, Modell-IDs `claude-opus-4-8` etc., Codex über ChatGPT-Login, `~/SOUL/watch/sol-runs/`, `shasum` (macOS; auf Linux `sha256sum`). Toter Code: `if [ ${#ENV_ALLOWLIST[@]} -gt 0 ] && false; then` (Z. 65). Ein Nutzer ohne Codex-Abo hat **keine Gegenstimme** — es gibt keinen Fallback auf ein anderes Modell des Nutzers (Gemini CLI, lokales Modell, zweites Claude-Modell mit anderem Prompt).

**Konzeptionelle Frage:** Die Gegenstimme ist als *Modell*-Wechsel definiert (GPT gegen Claude). Chrisos Messungen zeigen aber, dass **Selbstkonsistenz@3 bei gleichem Budget** der stärkste bekannte Gegner ist (§3). Die Gegenstimme sollte daher als *Unabhängigkeits*-Mechanismus definiert werden (anderer Kontext, andere Sicht, ggf. anderes Modell), mit gemessener Passung (N4) statt Namensraten — und sie muss auch dann existieren, wenn der Nutzer nur ein Modell hat (Meisterschaft unter Knappheit, §11c).

#### Organ 7 — PRÜFUNG (`core/mission.py`)

**Trägt:** `verdict="not-evaluated"` als Default beim Schließen (Beleg≠Urteil als Datenmodell, nicht als Ermahnung). Ein Vorhaben ist Ziel + Abnahmekriterien + Log — bewusst klein. Die Verifizierer-Rolle urteilt als einzige.

**Spezifiziert, nicht gebaut:** `SOUL.md` nennt `watch/receipts/` als Ort — kein Code erzeugt oder liest Receipts. Die Acceptance-Probe als **Datei mit Doppel-Ausführung** (Mechanismus 1 in `orchestrierung.md`: Runner führt aus, zweite Instanz führt jede must_have-Probe nochmal aus, Verbotsliste `file_exists`/„success"/echo-only) ist **nicht** gebaut: `acceptance` ist eine Liste von Strings ohne Typ, ohne Kommando, ohne Runner. Der Verifizierer muss Prosa in Befehle übersetzen — Ermessen an genau der Stelle, an der Mechanik verlangt wird.

**Bricht bei Ebenen:** `mission.new()` wirft `RuntimeError`, wenn ein Vorhaben aktiv ist („Eines gleichzeitig"). Ein Projekt mit 3–6 Ebenen hat notwendig Sub-Vorhaben pro Ebene (Übergabe-Verträge). Das Modell braucht einen Baum (Projekt → Phasen → Arbeitspakete → Aufträge), jeder Knoten mit Ziel/Nicht-Ziel/Inputs/Abnahmeprobe/Rückkanal/Status/Verdict/Kosten. `missions/current.json` ist eine einzelne Datei — bei parallelen Schreibern (Teams, Workflows) ohne Lock.

#### Guard (`core/guard.py`) gegen „null Kontrolle"

Die sechs Kategorien, geprüft gegen Chrisos Ring-2-Definition (§11b: Abos, Accounts, Zahlungen, API-Schlüssel beantragen, Empfehlungen für neue Zugänge — „nur das, was ohne Nutzer nicht geht"):

| Kategorie | Regex-Reichweite | Bewertung |
|---|---|---|
| `secrets-exfiltration` | Secret-Quelle + Netz-Verb, Ziel egal (auch localhost) | **Ring 2, universell.** Behalten. Einzige Schwäche: `\.env\b` + `curl` fängt auch `curl … > .env.example` |
| `extern-publizieren` | `npm publish`, `git push` auf fremdes Remote, Webhook-Hosts, **jeder `curl -X POST/-d/-F` auf Nicht-Localhost** | **Zu breit.** `_HTTP_WRITE` sperrt jede REST-API-Nutzung per curl (LLM-APIs, GitHub-API, Formulare, eigene Backends). Publizieren ist zudem projektabhängig: Für einen Nutzer, dessen Ziel ein npm-Paket ist, ist `npm publish` der Zweck. → Zustimmungsprofil beim Onboarding, nicht globale Bremse |
| `zahlungen` | Stripe/PayPal/Coinbase-APIs, `stripe`-CLI | **Ring 2, universell.** Behalten; fängt aber nur bekannte Anbieter |
| `remote-loeschung` | `gh repo delete`, S3/GCS-Löschung, `git push --force` fremd, **`DROP DATABASE`, `DELETE FROM x;`**, jedes `gcloud|az … delete` | **Halb richtig.** Irreversible Fremdlöschung ist Ring 2. Aber `DELETE FROM x;` fängt jede lokale SQLite-Pflege (auch SOULs eigenes Memory), und `az … delete` fängt Test-Ressourcen. → auf remote+irreversibel eingrenzen |
| `prod-aenderung` | `vercel --prod`, `terraform apply`, `kubectl … prod`, `ssh *prod*` | **Projektabhängig.** Für einen Solo-Entwickler ist `vercel --prod` das Ziel. → Zustimmungsprofil |
| `soul-integritaet` | Pfad-exakter Schutz von guard/events/hooks/settings/mandate | **Behalten, unbedingt.** Sichtbares, befristetes Mandat statt unsichtbarem Bypass (Lehre GPT-Forge) |

**Fehlend gegenüber §11b:** Keine Kategorie für „Account anlegen" oder „API-Schlüssel beantragen" (das passiert im Browser, nicht per Bash — nur über den Browser-Agenten fassbar). Das Mandat ist 15 Minuten für **eine** Kategorie — für einen Projektlauf, der legitim publiziert, ist das ein Rückfragezwang im 15-Minuten-Takt. Chrisos Prinzip „Zustimmung im Design, nicht zur Laufzeit" verlangt: Zustimmung **pro Projekt und Kategorie** einmal beim Onboarding/Preflight, als stehendes Mandat mit Geltungsbereich (Remote, Paket, Domäne), sichtbar im Monitor, jederzeit widerrufbar. Die 15-Minuten-Form bleibt für Ad-hoc-Fälle.

**Bewertung insgesamt:** Der Guard ist das beste Stück der Basis (getestet, pfad-exakt, sichtbar, befristet). Seine Kategorien sind Chrisos persönliche Ring-2-Liste — richtig für ihn, als Produkt-Default zu breit und zugleich unvollständig. Soul 10 braucht einen **Guard mit Profil**: universeller Kern (Secrets, Zahlungen, irreversible Fremdlöschung, Wache-Integrität) + projektspezifische Zustimmungen aus dem Onboarding.

### 2.2 Stand der Kunst: Long-Running-Agent-Harnesses

Was die Praxis 2025/26 über Dirigenten-Systeme gelernt hat, in der Reihenfolge ihrer Relevanz für Soul 10.

**a) Anthropic, „Effective harnesses for long-running agents":** Das Problem ist Sitzungsgrenze + Kontextgrenze („each new session begins with no memory of what came before"). Lösung ist ein Zwei-Agenten-Harness: ein *Initializer* legt einmal `init.sh`, eine Fortschrittsdatei und einen Git-Baseline-Commit an; ein *Coder* arbeitet pro Session **ein** Feature, testet, committet, aktualisiert den Status. Der Kern ist nicht das Fortschritts-Log, sondern die **Feature-Liste als JSON mit pass/fail pro testbarem Requirement** — mit der Regel „It is unacceptable to remove or edit tests because this could lead to missing or buggy functionality." Beobachtete Fehlermodi: vorzeitiges „fertig" (kein klarer Scope), undokumentierte Bugs (schlechte Übergabe), unvollständige Features (Überambition), versteckte Fehler (unzureichender Test → Browser-E2E via Puppeteer). Keine quantitativen Ergebnisse; Beispiel mit „over 200 features". **Lehre für Soul 10:** SOULs `acceptance: [str]` muss zur typisierten Probenliste mit pass/fail werden, die niemand löschen darf; das Ein-Feature-pro-Session-Prinzip ist die Übergabe-Einheit.

**b) Anthropic, „How we built our multi-agent research system":** Orchestrator-Worker; Opus 4 als Lead mit Sonnet-4-Subagents schlug Single-Opus um **90,2 %** auf der internen Research-Eval. **„Token usage by itself explains 80% of the variance"**, Tool-Call-Zahl und Modellwahl der Rest. Kosten: Agents ≈4× Chat, Multi-Agent ≈15× Chat. Delegation braucht „an objective, an output format, guidance on the tools and sources to use, and clear task boundaries." Skalierungsregel explizit: „Simple fact-finding requires just 1 agent with 3-10 tool calls, direct comparisons might need 2-4 subagents with 10-15 calls each, and complex research might use more than 10 subagents." Frühe Fehler: „spawning 50 subagents for simple queries, scouring the web endlessly for nonexistent sources, and distracting each other with excessive updates", Doppelarbeit. Evaluation: End-State statt Schrittprüfung, LLM-Judge mit einem Aufruf 0–1, klein anfangen. Produktion: Resume nach Fehlern, Rainbow-Deployments, synchrone Subagents als Engpass. **Nicht geeignet:** „tasks that require all agents to share the same context or involve many dependencies" — „most coding tasks involve fewer truly parallelizable tasks than research." **Lehre:** Der Dirigent braucht eine explizite Aufwands-Skala (wie viele Agenten für welche Aufgabenform) und ein Kontingent-Bewusstsein, weil Token der Haupt-Erklärungsfaktor sind — das ist Chrisos „Meisterschaft unter Knappheit" in Zahlen.

**c) Cognition, „Don't build multi-agents":** Zwei Prinzipien: „Share context, and share full agent traces, not just individual messages" und „Actions carry implicit decisions, and conflicting decisions carry bad results." Das Flappy-Bird-Beispiel: parallele Subagents bauen inkonsistente Teile, der Zusammenführer erbt die Widersprüche. Empfehlung: single-threaded linearer Agent; für sehr lange Aufgaben ein Kompressionsmodell. Claude Codes Subagent-Design funktioniere, weil Subagents „never does work in parallel" mit dem Hauptagenten, sondern Fragen beantworten. **Widerspruch zu (b)?** Nein — beide sagen dasselbe: Parallelität nur bei echter Unabhängigkeit (Research, Review), nie bei gekoppelten Bau-Entscheidungen. Für Soul 10: Ebenen sind primär **Tiefe** (Delegation mit Vertrag, Rückgabe als Datei), Parallelität ist die Ausnahme mit Dateibesitz-Trennung.

**d) MAST — „Why Do Multi-Agent LLM Systems Fail?" (arXiv 2503.13657, NeurIPS 2025):** 150 Traces aus 7 Frameworks, Experten-annotiert (κ = 0,88), 14 Fehlermodi in drei Kategorien: (i) Spezifikation/Systemdesign, (ii) Inter-Agent-Misalignment, (iii) Aufgabenverifikation. Befund: „many failures stem from poor system design, not model performance … agents operating with incorrect assumptions, ignoring peer input, or failing to verify their outputs. Improving MAS robustness will require better orchestration strategies, not just larger models or more tokens." Ein LLM-Annotator (o1) erreicht 94 % Übereinstimmung — d. h. **Fehlerklassifikation ist automatisierbar** (Kandidat für Soul 10s Fehlweg-Reflex und Kalibrierungsgedächtnis). [unverifiziert: die Prozentanteile der Kategorien; im Abstract nicht enthalten.]

**e) Manus, „Context Engineering for AI Agents":** „the KV-cache hit rate is the single most important metric for a production-stage AI agent" — 10× Preisunterschied cached/uncached, Input:Output ≈ 100:1, ~50 Tool-Calls pro Aufgabe. Regeln: stabiler Prompt-Präfix (keine Zeitstempel), append-only, Tools maskieren statt entfernen, **Dateisystem als Kontext** („unlimited in size, persistent by nature, and directly operable by the agent itself"), **Rezitation** (todo.md am Kontextende gegen „lost in the middle"), **Fehler im Kontext lassen** („leave the wrong turns in the context"), Few-Shot-Uniformität vermeiden. **Lehre:** SOULs `ENABLE_PROMPT_CACHING_1H` und 1h-TTL sind richtig; der Dirigent-Kernel braucht stabilen Präfix + Rezitation des Projektvertrags, und der Fehlweg-Reflex darf Fehler nicht wegkürzen.

**f) Ralph-Loop-Kritik:** Das Ralph-Wiggum-Plugin zwingt: „Do not circumvent the loop: Even if you believe you're stuck, the task is impossible, or you've been running too long — you MUST NOT output a false promise statement." LessWrong-Kritik: Der einzige Ausgang ist die Fertig-Behauptung → perverser Anreiz; Opus 4.5 nannte es „a weaponization of its commitment to honesty". Praxisberichte: Kontextdegradation jenseits ~100K, echter Ralph startet pro Aufgabe eine frische Session (Plugin tut das nicht); ein Lauf mit `max_iterations: 0` stellte sich 1.966-mal dieselbe Frage; funktionale Tests grün bei kaputter UI. **Lehre:** Schleifen brauchen **ehrliche Ausgänge** („blocked", „not-evaluated", Budgetgrenze) und einen fremden Prüfer — genau SOULs Beleg≠Urteil, aber mechanisch (Hook), nicht als Anweisung.

**g) Claude-Code-Primitive (Doku, Stand CLI 2.1.26x):**
- *Subagents:* Standardtiefe „up to three layers below the main conversation" (`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`), „At the depth limit, Claude Code withholds the `Agent` tool from every subagent except a fork"; Standard-Parallelgrenze 20 (`CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`); Frontmatter `model`, `maxTurns` (Ausgabe „partial"), `memory`, `isolation: worktree`, `skills`-Preload, `mcpServers`, eigene `hooks`; Resume via `SendMessage`; `CLAUDE_CODE_SUBAGENT_MODEL(_FORCE)`; Warnung bei >15.000 Token Agent-Beschreibungen; Hooks liefern `agent_id`/`agent_type`.
- *Agent Teams:* experimentell (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`), gemeinsame Task-Liste mit File-Locking, Mailbox-Dateien, `TeammateIdle`/`TaskCreated`/`TaskCompleted`-Hooks mit Exit 2 als Qualitätsgate; **kein Team in `-p`**, „No nested teams", „Lead is fixed", keine Resumption von In-Process-Teammates, „Task status can lag"; Empfehlung 3–5 Teammates; „Letting a team run unattended for too long increases the risk of wasted effort."
- *Dynamic Workflows:* JavaScript-Skript mit `agent()/pipeline()/parallel()/phase()`, „Dozens to hundreds of agents per run", 16 gleichzeitig, 1.000 pro Run, 4.096 Items pro Aufruf, **„No mid-run user input"**, resumierbar in derselben Session (deterministische Replays: `Date.now()` wirft), Prompt-Cache-Sharing im Fan-out, „Large workflow"-Warnung ab 25 Agents / 1,5 M Token, Size-Guideline small<5/medium<15/large<50; `ultracode` = xhigh + automatische Workflows; **das Schlüsselwort zählt nur aus menschlicher Eingabe, nicht aus `-p`** (relevant für Ebene 5).
- *Hooks:* >30 Events, darunter `SubagentStart/Stop`, `PostToolUseFailure`, `TaskCompleted`, `TeammateIdle`, `PreCompact` (kann blocken), `Stop` (kann Weiterarbeiten erzwingen), `SessionEnd`, `FileChanged`, `Notification`; Typen `command|http|mcp_tool|prompt|agent`; `if`-Feld; **Exit 2 blockt, Exit 1 nicht.**
- *Cross-Session-Messaging:* `ListAgents`/`SendMessage` über Sockets; `-p`-Worker empfangen mit `crossSessionInbound: accept`; `notify_when_idle` (12 h); Nachrichten anderer Sessions „can't approve anything" — ein zweiter Zustimmungs-Vertrag, der zu §11b passt.
- *Headless:* `claude -p --output-format json` liefert `session_id`, `total_cost_usd`; `--json-schema` → `structured_output`; `--resume`; `--bare` empfohlen; `stream-json` mit `parent_tool_use_id` rekonstruiert den **ganzen Subagent-Baum** (`--forward-subagent-text`); `--permission-prompts none` für unbeaufsichtigte Läufe; Hintergrundwarten max 10 min.
- *Plugins:* `plugin.json`, `skills/`, `agents/`, `hooks/hooks.json`, `.mcp.json`, `workflows/`, `monitors/monitors.json`, `bin/`, `settings.json` mit `agent` („activates one of the plugin's custom agents as the main thread"); `${CLAUDE_PLUGIN_ROOT}`, `${CLAUDE_PLUGIN_DATA}`; `claude plugin validate`.

**h) Codex (OpenAI), Sekundärquellen (WebSearch, nicht Primärdoku):** Cloud-Tasks in isolierten Sandboxes, parallel, automatische PRs; „subagent model with a manager that can coordinate several parallel workers"; CLI mit `/plan /exec /review`. [unverifiziert im Detail: `codex exec`-Flags, `--output-schema`, Sandbox-Modi — SOULs `sol.sh` nutzt sie, `forschung-2026-09.md` mahnt selbst zum Diff gegen `codex exec --help`.]

**Synthese für Soul 10:** Alle Quellen konvergieren auf fünf Dinge, die SOUL nur als Text hat: (1) Zustand in Dateien mit typisierter pass/fail-Probenliste, (2) Delegation als Vertrag mit Ziel/Format/Grenzen/Werkzeugen, (3) Verifikation durch eine Instanz, die nicht gebaut hat — mechanisch erzwungen, (4) Parallelität nur bei Unabhängigkeit, Tiefe als Regel, (5) Token/Kontingent als erste Steuergröße. Und einen Punkt, den keine Quelle löst: **wie ein System sein eigenes Wissen über Ressourcen und Vorgehen aktuell hält** (§11a/c) — das ist Soul 10s Alleinstellung, wenn es gebaut wird.

### 2.3 Dirigenten-Schleife als Kern (Kernel-Text, englisch)

Zweck: modellgerichteter Text für das `conductor`-Modul der obersten Ebene (Ordnung-Kernel, Ebene 1). Er ersetzt die Prosa aus `CLAUDE.md`/`PROJEKT-START.md` durch eine Schleife mit Stoppregeln. Alles, was hier „file" heißt, ist ein Mechanismus (§2.4), kein Vorsatz. Wortzahl ≈ 720.

```
CONDUCTOR — the top-level loop. You act as the most capable AI user in the world,
sitting in the user's seat. Consent was given once at setup: you do not ask for
permission, you make work visible. Run this loop until the project's acceptance
probes pass under independent verification, or a Ring-2 item blocks everything left.

0. SITUATE (once per project; refresh at every phase change). Read the resource
   atlas and the user profile: models, subscriptions, CLIs, MCP servers, devices,
   quotas, time windows, cost per token and per hour. Recall memory before reading
   files. If the atlas is older than seven days, or the task touches a resource the
   atlas does not know, refresh that slice first. Knowledge is procured, not assumed.

1. UNDERSTAND THE GOAL BEHIND THE GOAL. Restate the outcome the user actually wants,
   add what a demanding expert would have specified, and define what "no follow-up
   needed" looks like. Write it as the project contract file: goal, non-goals,
   acceptance probes (each one a command that can fail), budget and deadline,
   Ring-2 dependencies. No substantive work starts without this file.

2. MAP THE POSSIBLE. What is the best achievable result with the user's real
   resources — and what would one more resource (a subscription, a key, a local
   model) unlock? List existing tools that already do part of the job: use, don't
   rebuild. Decide the shape of the work: single thread, fan-out, adversarial
   cross-check, long-running build. Estimate tokens and wall time per shape; token
   use is the main cost driver, so the estimate is part of the plan.

3. CHOOSE THE LEVELS — the smallest structure that holds the plan:
   - Yourself: the task fits one context and each step depends on the last.
   - Subagent (depth ≤ 3): a bounded question or build whose only output is a
     result or a file set. Always with a contract file.
   - Workflow: the same step over many items, adversarial verification of findings,
     or intermediate results that would flood your context.
   - Team: 3–5 truly independent, discussion-worthy fronts. Never same-file edits.
   - Separate process (claude -p, another CLI, another model): work that must
     outlive this session, run under a different quota, or supply an independent view.
   - Counter-voice: for irreversible or architectural decisions, and whenever two
     candidate answers disagree. Use a different model if the user has one;
     otherwise self-consistency@3 with a fresh context — that is the strongest
     measured opponent you know.
   Wave rule: at most 2–3 concurrent agents on a shared quota. One limit hit kills
   them all in the same minute.

4. WRITE THE HANDOVER CONTRACT for every delegation. It is a file, not a
   paragraph: objective; non-objectives; inputs as exact paths, plus "you do NOT
   see: …"; output format and location; the acceptance probe the recipient must
   run and report verbatim; budget in turns, tokens, minutes; return channel; what
   to do when blocked (report, do not improvise around it). A recipient that ends
   without running its probe returns "not-evaluated", never "done".

5. EXECUTE AND WATCH. One line of narration before each tool chain — the monitor is
   the user's window; silent work breaks the deal. Cost and duration are logged per
   level. When a result surprises you, or the same error appears twice: stop, write
   the situation (wanted / got / tried / which assumption may be wrong), get an
   outside view, then decide: correct the assumption, change the path, or mark the
   unit blocked and move to the next. Never a third identical attempt. Never a
   restart that produces no information. Leave the wrong turns in the record.

6. VERIFY SEPARATELY. Evidence is not judgment. Every acceptance probe is executed
   by an instance that did not build the artifact, on disk, with command and output
   attached to the receipt. Exit 0 without a content check is "ran", not "passed".
   Zero contradictions across a long run is suspicious, not good. No probe is ever
   deleted or weakened to make it pass.

7. CLOSE THE LOOP. Feed memory as things happen, not at the end: decision, error,
   pattern, rejected path with reason and expiry. Update the contract state. Probes
   failed: back to step 2 with the new evidence. Something needs the user (Ring 2:
   subscriptions, accounts, payments, keys, recommendations for new access): collect
   every pending Ring-2 item into ONE message — what, why, what happens without it —
   and keep working on everything that does not depend on it.

8. STOP RULES. Stop and hand over cleanly when: every probe is verified; a budget or
   quota threshold is reached (plan the pause, leave a state the next session can
   resume from); every remaining unit depends on a Ring-2 answer; or the emergency
   stop fires. "Done" is a verifier's verdict, never yours. "I don't know" and
   "blocked" are complete, honest answers — they are always available exits.
```

Abgrenzung zum gemessenen Soul-Frame (§4 Kontextpaket): Der Frame ist eine *Vorbereitungsrunde für eine Antwort*; die Dirigenten-Schleife ist ein *Betriebsmodus für ein Projekt*. Der Frame bleibt byte-gleich als Vergleichsarm (Ausnahme 3a), die Schleife ist Hypothese (Regel 4) und wird gegen „SOUL-CLAUDE.md wie am 2.9." und gegen „nackt" gemessen — mit Vorhersage: die Schleife gewinnt bei Projektaufgaben (>10 Schritte) und verliert oder ist neutral bei Einzelantworten.

### 2.4 Ebenen-Modell 1–6

Grundsatz: **Ebenen sind Tiefe, nicht Breite.** Jede Ebene bekommt Arbeit über einen Vertrag (Datei) und gibt ein Ergebnis über einen Receipt (Datei) zurück. Parallelität ist innerhalb einer Ebene erlaubt, wenn Dateibesitz getrennt ist (Cognition, Agent-Teams-Doku „Two teammates editing the same file leads to overwrites"). Die Claude-Code-Primitive erlauben drei Subagent-Schichten unter der Hauptsession; Ebene 4–6 entstehen durch **Komposition** mit Workflows, getrennten Prozessen und externen Systemen — nicht durch tieferes Nesting.

| Ebene | Rolle | Realisierung (Claude Code) | Modell-Stufe | Zustand ein/aus | Ausfallverhalten |
|---|---|---|---|---|---|
| **1 Dirigent** | Situieren, Vertrag, Ebenenwahl, Kontingent, Übergabe, Gedächtnis. Baut nichts Substanzielles selbst. | Interaktive Session (Plugin-`settings.json` `agent: conductor` macht den Dirigenten zum Main-Thread) oder Langläufer `claude -p --resume` | Stärkstes verfügbares Modell; Präfix stabil (Cache) | Liest: Atlas, Profil, Memory-Briefing, `state/project.json`. Schreibt: Verträge, Log-Zeilen, Memory | Kompaktierung: `PreCompact`-Hook sichert Vertragszustand; `PostCompact` re-injiziert Rezitation. Session-Ende: `SessionEnd`-Hook schreibt Übergabe-Brief |
| **2 Prüfer / Planer** | Kritiker (nur Artefakte), Verifizierer (Proben mechanisch), Drift-Wache, Gegenstimme (Fremdmodell oder Selbstkonsistenz@3), Recovery | Subagents Tiefe 1, read-only + Bash; **oder** getrennter Prozess (`claude -p --json-schema verdict.schema.json`, `codex exec`, Gemini CLI) für echte Unabhängigkeit | Stark (Urteile sind teuer, wenn falsch); Gegenstimme: anderes Modell, sonst gleiches Modell mit frischem Kontext | Liest: Vertrag + Artefakt-Manifest (Pfade+Hashes), **nie** die Begründung des Erbauers. Schreibt: `receipts/<vertrag>.json` nach `verdict.schema.json` | **„Der Prüfer fällt zuerst weg"** → Hooks erzwingen ihn: `TaskCompleted` Exit 2 ohne Receipt; `SubagentStop` prüft, ob der Ausführende seine Probe gemeldet hat; `Stop` blockt „fertig" ohne Verifizierer-Receipt |
| **3 Ausführende** | Builder, Researcher, Installer, Writer — je ein Arbeitspaket mit Vertrag | Subagents Tiefe 2 (`isolation: worktree`, `maxTurns`, `memory: project`), gestartet vom Dirigenten; bei vielen gleichartigen Paketen ein **Workflow** (`pipeline()`) | Mittel/günstig für Bulk (`CLAUDE_CODE_SUBAGENT_MODEL`), stark für Architektur | Liest: Vertrag, benannte Inputs. Schreibt: Artefakte an vereinbarten Ort + Selbstbericht mit Probe-Ausgabe (gilt als Behauptung) | `maxTurns` erreicht → „partial", Dirigent entscheidet resume/neu. Zwei gleiche Fehler → blocked-Marke, kein dritter Versuch |
| **4 Spezialisten** | Unter-Aufgaben eines Ausführenden (Datei-Migration, Test-Lauf, Quellen-Fetch) | Subagents Tiefe 3 (letzte Schicht, `Agent`-Tool entzogen) **oder** Workflow-Agenten (bis 16 parallel, 1.000/Run, Zwischenergebnisse bleiben im Skript) | Günstig; Fan-out teilt Prompt-Cache | Liest: exakt eine Aufgabe. Schreibt: strukturiertes Ergebnis (`schema`) | Workflow: `agent()` → `null` bei Abbruch; Replay-Regeln (Fehler in der Mitte wiederholt Nachfolger) |
| **5 Getrennte Prozesse / Sessions** | Langläufer, Fremd-Kontingent, Fremdmodell, Zeitplan | `claude -p --output-format json` (liefert `session_id`, `total_cost_usd`), `--resume`, `crossSessionInbound: accept` für `SendMessage`-Rückkanal; `codex exec`; Gemini CLI; Ollama-Modelle; Claude Code Remote `create_session`; Routines (`create_trigger`) für Nightlies | Nach Aufgabe und Kontingent; **hier entsteht „Meisterschaft unter Knappheit"** (Arbeitsteilung starke/schwache/lokale Modelle) | Liest/schreibt nur Dateien im Projekt + `state/`. Rückkanal: Receipt-Datei + optional `SendMessage`/`notify_when_idle` | Prozess weg → Receipt fehlt → Vertrag bleibt `open`, Recovery liest `state/`, nicht den Working-Tree. SIGTERM: Exit 143, Turn unvollendet, `--resume` setzt fort |
| **6 Externe Systeme** | Cloud-Tasks, CI, Deploy-Pipelines, Web-Sessions, andere Geräte | Codex Cloud (parallele Sandboxes, PRs), Claude Code on the web, GitHub Actions, Webhooks → `watch_url`, Remote Control für Mobile-Sicht | Fremdbetrieb | Ergebnis kommt als PR/Artefakt/Webhook; Dirigent verifiziert wie jede Behauptung (Ebene 2) | Asynchron; Dirigent abonniert Ereignisse statt zu pollen (Ralph-Anti-Pattern) |

**Wie Ebene 4–6 konkret erreicht werden:** Spawn-Tiefe 3 ist eine Grenze *innerhalb einer Session*. Ein Workflow ist eine eigene Runtime („isolated environment, separate from your conversation") — ein Dirigent (E1) kann einen Workflow starten, dessen Agenten (E3/E4) ihrerseits Subagents spawnen dürfen. Ein `claude -p`-Worker (E5) ist eine neue Hauptsession mit eigener Tiefe 3. Damit sind 6 Ebenen erreichbar: E1 Session → E2/E3 Subagents → E4 Workflow-Agenten → E5 `-p`-Prozess (eigene E1) → dessen Subagents → E6 Cloud. **Aber:** Jede Ebene kostet Kontext für Ergebnisrückgabe und Token für Präfix — die Anthropic-Zahlen (15× Chat) und die MAST-Fehlerklassen (Misalignment wächst mit Zwischenstellen) sagen: Tiefe nur, wenn jede Zwischenstelle einen echten Vertrag hält. Sechs Ebenen sind das **Maximum**, nicht das Ziel; die Schleife (Schritt 3) wählt die kleinste tragende Struktur.

**Zustandsfluss zwischen Ebenen (nur Dateien, kompaktierungsstabil):**
- `state/project.json` — Vertragsbaum (Projekt → Phasen → Arbeitspakete → Aufträge), jeder Knoten: `id, parent, goal, non_goals, inputs[], outputs[], probes[{cmd, expect, forbidden_patterns}], budget{turns,tokens,minutes}, level, assignee{kind, model, session_id}, status{open|running|blocked|delivered|verified|failed}, verdict, cost{tokens,usd,seconds}, log[]`. Ersetzt `missions/current.json` (ein Knoten) und erlaubt mehrere aktive Knoten mit Dateilock.
- `contracts/<id>.md` — der Übergabe-Vertrag in Prosa für den Empfänger (aus dem Knoten generiert, nicht von Hand geschrieben — sonst driftet er).
- `receipts/<id>.json` — Verifizierer-Urteil nach `verdict.schema.json` (erweitert um `probe_runs[{cmd, exit, stdout_hash, stdout_head}]`, `verifier{kind, model, session_id}`, `artifact_hashes`).
- `events.jsonl` — ein Bus, alle Ebenen: `ts, session_id, agent_id, agent_type, level, contract_id, event, tool, summary, flags, tokens, usd, ms`. Fremdprozesse schreiben denselben Bus (Hook `type: http` oder Append über `bin/soul emit`), damit es **eine** Wahrheit gibt.
- `atlas/` + `profile.json` — Ressourcen-Atlas und Nutzerprofil (R15).
- Memory — wird von Hooks gefüttert (R05).

**Kosten-Regeln je Ebene (aus den Quellen abgeleitet, als Startprofil):** E1 stärkstes Modell, aber schlanker Kontext (Delegation statt Lesen); E2 stark, read-only, kurze Läufe; E3 mittel, `maxTurns` 30–60; E4 günstig, Fan-out mit Cache-Sharing; E5 nach Kontingentlage (lokal wenn möglich); 1h-Cache überall (`subagentPromptCacheTtl`); `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS=3` als Default-Profil (Wellen-Regel), höher nur bei Workflows mit bekanntem Budget; Aufwandsskala der Anthropic-Research-Regel als Startwerte (1 Agent/3–10 Calls; 2–4/10–15; >10 nur bei echter Recherche).

**Ausfallverhalten „der Prüfer fällt immer zuerst weg":** Drei mechanische Sicherungen statt Ermahnung: (1) `TaskCompleted`-Hook liest `receipts/<id>.json`; fehlt es oder ist `urteil != pass`, Exit 2 mit Begründung — die Aufgabe kann nicht als erledigt markiert werden. (2) `Stop`-Hook der Hauptsession: Wenn ein Vertragsknoten `delivered` ohne Receipt ist und der letzte Assistant-Text „fertig/done/abgeschlossen" enthält, Exit 2 → Claude arbeitet weiter („run the verifier or mark blocked"). (3) Zähler im Bus: jede N-te Lieferung (N=3) und jede Lieferung mit Flag `netz|install|daemon|security` erzeugt ein Pflicht-Gate — der Trigger liegt **außerhalb** des Dirigenten (Red-Team-Befund B1). Alle drei sind kleine Python-Hooks auf demselben `events.py`-Kern.

### 2.5 Universalität

**Onboarding (einmal, gebündelt, dann Ruhe):** Ein `soul init`-Ablauf mit fünf Blöcken, jeder als Datei-Ergebnis: (1) *Technische Bestandsaufnahme ohne Fragen* — OS/Shell/Arch, RAM/CPU/GPU, installierte CLIs (`claude`, `codex`, `gemini`, `ollama`, `gh`, `docker`, `node`, `python`, `uv`), Login-Status je CLI (Probe-Aufruf, kein Credential-Lesen), vorhandene MCP-Server (`~/.claude.json`, `.mcp.json`), lokale Modelle (`ollama list`), Netz/Proxy → `profile.json` + erste Atlas-Scheibe. (2) *Zustimmungsprofil* — die Guard-Kategorien als Liste mit Default (Kern immer an: Secrets, Zahlungen, irreversible Fremdlöschung, Wache-Integrität; projektabhängig: Publizieren auf welche Ziele, Prod-Deploy welcher Projekte, Fremd-Remotes) — einmal bestätigt, als stehende Mandate mit Geltungsbereich gespeichert, im Monitor sichtbar, widerrufbar. (3) *Ring-2-Bündel* — genau eine Nachricht: was der Dirigent für dieses Profil empfiehlt (z. B. „Codex-Abo als Gegenstimme", „Gemini-Key für Bulk"), was es kostet, was ohne es passiert; Antworten optional, Arbeit läuft weiter. (4) *Identität* — Sprache, Anrede, Name des Agenten (Default „Miguel", öffentliche Stufe), Miguel-Profil öffentlich/privat (§10). (5) *Monitor-Kanal* — Terminal, lokale Web-Seite, Remote Control/Mobile.

**Profilerkennung im Betrieb:** `doctor.py` wird zum Profil-Detektor: statt „Fable 5.1 vorhanden?" fragt er „welches stärkste Modell ist eingeloggt, welche Kontingente, welche Fallbacks" und schreibt das Ergebnis in `profile.json`; der Starter liest Profile statt `PROFILES = {vollgas, probe}`. Unbekannte Modelle als „strong" behandeln (Kontextpaket §3, Formatschaden-Lehre).

**Plattformneutraler Starter:** Ein Python-Einstieg (`python -m soul start`) ohne zsh; kein `pbcopy`/`open`/`.command`: Der Erstauftrag geht über `--append-system-prompt-file` oder den SessionStart-Hook (`additionalContext`), der Monitor als lokaler Web-Server (SSE auf `events.jsonl`) oder als zweites Terminal via plattformspezifischem Öffner (macOS `open`, Linux `xdg-open`/`x-terminal-emulator`, Windows `start`), Fallback: kein zweites Fenster, sondern Statusline + `/workflows`-Panel. Prozessgruppen-Not-Stopp bleibt POSIX; Windows über Job-Objects oder `taskkill /T` [unverifiziert]. `shasum` → `hashlib`. Kein `/opt/homebrew`-Fallback; `shutil.which` oder Fehler.

**Plugin-Verpackung:** Soul 10 als Claude-Code-Plugin: `.claude-plugin/plugin.json` (Name, Version), `agents/` (conductor, kritiker, verifizierer, builder, researcher, installer, drift-wache, recovery, counter-voice), `skills/` (Playbooks als Skills mit `description`-Trigger statt „Playbook laden"), `hooks/hooks.json` (Wache, Guard, Memory-Fütterung, Prüf-Gates), `workflows/` (bewährte Fan-outs), `.mcp.json` (Soul-eigener Memory/Atlas-MCP), `bin/` (`soul`-CLI im PATH), `settings.json` mit `agent: conductor`. Zustand in `${CLAUDE_PLUGIN_DATA}` (nie `$HOME/SOUL`). `claude plugin validate` im CI. Für andere Bindungen (Codex `AGENTS.md`, Gemini, Cursor, API, Ollama) kompiliert dieselbe Quelle Kernel + Verträge + Hooks-Äquivalente (Ordnung-Adapter, R03/R04).

**Keine hartkodierten Pfade/Namen:** `ROOT`-Ableitung bleibt, aber Statusline liest `state/` relativ zum Plugin-Datenpfad; `OWN_REMOTES` aus `profile.json`; `Chriso` wird `profile.user.name`; Deutsch wird `profile.language`; `PROJEKT-START.md` wird zu einem generischen `ONBOARDING.md` + projektspezifischem, vom Dirigenten erzeugten Vertrag. `--strict-mcp-config`/`--setting-sources project` werden zur Profil-Option „Isolation" (Default aus: der beste KI-Nutzer nutzt die Werkzeuge des Nutzers).

### 2.6 Verbesserungsliste (behalten / ändern / streichen / neu)

Sortiert nach Wirkung innerhalb jeder Gruppe. Aufwand: S (<½ Tag), M (1–2 Tage), L (>2 Tage). „Beleg" nennt, woraus die Änderung folgt.

**BEHALTEN (byte-nah, ggf. verallgemeinern)**

| # | Datei | Was | Warum | Aufw. | Beleg |
|---|---|---|---|---|---|
| B1 | `core/guard.py` (Kern) | Pfad-exakter Selbstschutz (`soul-integritaet`), Secrets-Exfiltration, Zahlungen, Mandat sichtbar+befristet | Einziges getestetes Organ (37 Tests); Lehre aus GPT-Forge-Bypass | — | `tests/test_guard.py`, `guard.py` Docstring |
| B2 | `gates/verdict.schema.json` | Urteilsschema mit `evidenz[{pfad,zeile}]`, `annahmen`, `blind_spots`, `tests` | Bester Vertrag für **jede** Prüfer-Ebene, nicht nur Sol | — | Schema |
| B3 | `gates/sol.sh` Protokoll | Run-Dir, Prompt-Hash, Modell-Echo, kein Retry bei fachlichem fail, PENDING→CLOSED | Betriebsnarben aus delegate.sh v2 | — | `sol.sh` Z. 1–30, `gates/README.md` |
| B4 | `core/mission.py` Semantik | `verdict="not-evaluated"` als Default | Beleg≠Urteil als Datenmodell | — | `mission.py` `close()` |
| B5 | `core/doctor.py` | Echte Modell-Probe statt `--init-only` | Teuer gelernt | — | `forschung-2026-09.md` KORREKTUR |
| B6 | `knowledge/denk-architekturen.md` | Kill-Check, Name-Mechanismus-Abgleich, „Algorithmus schlägt Willensakt", 12 Anti-Patterns | Prüfinstrument (Ausnahme 3b) | — | Dossier |
| B7 | `.claude/agents/kritiker.md`, `verifizierer.md` | Erzwungene Eröffnung, fail-closed | Richtige Rollenform; mechanische Absicherung kommt in N-Punkten | — | Agent-Dateien |
| B8 | `settings.json` env | `ENABLE_PROMPT_CACHING_1H`, `subagentPromptCacheTtl: 1h`, `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB` | Größter Kostenhebel (Manus: KV-Cache = Metrik Nr. 1) | — | Workflows-Doku Cache-Abschnitt |

**ÄNDERN**

| # | Datei | Was | Warum | Aufw. | Beleg |
|---|---|---|---|---|---|
| Ä1 | `core/mission.py` → `core/state.py` | Ein Knoten → Vertragsbaum (`state/project.json`) mit mehreren aktiven Knoten, Dateilock, typisierten Proben `probes[{cmd,expect,forbidden}]`, `cost`, `assignee`, `level` | 3–6 Ebenen brauchen Sub-Verträge; `RuntimeError` bei zweitem Vorhaben blockiert Delegation; Prosa-Kriterien sind Ermessen | M | `mission.py` Z. 33–36; Anthropic-Harness feature_list pass/fail; `orchestrierung.md` Mechanismus 1 |
| Ä2 | `core/guard.py` Kategorien | `extern-publizieren`/`prod-aenderung` aus dem universellen Kern in ein **Zustimmungsprofil** (Onboarding, stehende Mandate mit Geltungsbereich); `_HTTP_WRITE` auf bekannte Publish-Ziele einschränken; `DELETE FROM`/`az … delete` auf remote+irreversibel eingrenzen | Zu breit gegenüber Chrisos Ring 2 (§11b); sperrt legitime API-Nutzung und lokale SQLite | M | `guard.py` `_HTTP_WRITE`, `_REMOTE_DELETE`; Kontextpaket §11b |
| Ä3 | `core/events.py` Record | `session_id, agent_id, agent_type, level, contract_id, tokens, usd, ms, outcome` ergänzen; Bus für Fremdprozesse (`bin/soul emit`, HTTP-Hook) | Wache blind für Ebenen; zwei Wahrheiten (`sol-runs/` vs `events.jsonl`) = Anti-Pattern 7 | M | Hooks-Doku `agent_id/agent_type`; `events.py` `handle()` |
| Ä4 | `.claude/settings.json` Hooks | `PostToolUse`, `PostToolUseFailure`, `SubagentStart/Stop`, `SessionEnd`, `UserPromptSubmit`, `TaskCompleted`, `PreCompact` (blockend, wenn Zustand ungesichert) registrieren | `post-tool` existiert im Code ohne Trigger; Ergebnis/Fehler/Dauer unsichtbar | S | `settings.json`; `events.py` Z. 145 |
| Ä5 | `core/starter.py` | Profile aus `profile.json` statt `PROFILES`-Konstante; Erstauftrag via `--append-system-prompt-file`/SessionStart statt `pbcopy`; `--strict-mcp-config` als Option „Isolation", Default aus; doppelte Permission-Flags bereinigen | Universalität; „bester KI-Nutzer" ohne MCPs ist Widerspruch | M | `starter.py` Z. 31–50, 63–70, 137–150 |
| Ä6 | `bin/soul*`, `.claude/statusline.sh` | zsh → Python-Entry bzw. POSIX-sh; `$HOME/SOUL/missions/...` → `state/` relativ zu `${CLAUDE_PLUGIN_DATA}`/ROOT | Bricht außerhalb `~/SOUL` und ohne zsh | S | `statusline.sh` Z. 6; `bin/soul` Z. 1 |
| Ä7 | `gates/sol.sh` | Backends aus `profile.json` (Codex, Gemini CLI, Ollama, zweites Claude-Modell, **Selbstkonsistenz@3-Modus**); `shasum`→portable; toten `&& false`-Block entfernen; `CODEX_BIN` via `which` | Nutzer ohne Codex hat keine Gegenstimme; Selbstkonsistenz ist der gemessene Gegner | M | `sol.sh` Z. 48, 65; Kontextpaket §3 |
| Ä8 | `playbooks/*.md` → `skills/*/SKILL.md` | Playbooks als Skills mit `description`-Trigger; `skills:`-Preload in Agent-Frontmatter | „Playbook laden" ist Willensakt; Skill-Trigger ist Mechanismus | S | Subagents-Doku `skills`-Feld |
| Ä9 | `CLAUDE.md`, `output-styles/soul-dirigent.md` | Personalisierung (`Chriso`, Deutsch, „dieser Mac") → Profilvariablen; Arbeitsweise-Punkte 3–8 durch die Dirigenten-Schleife (§2.3) ersetzen; nur behalten, was kein Hook kann | Universalität; Ermahnungen durch Mechanismen ersetzen | S | `CLAUDE.md`; §2.3 |
| Ä10 | `.claude/agents/kritiker.md` | Input als Artefakt-Manifest (Pfade+Hashes) statt Freitext-Prompt; Hook `SubagentStart` prüft, dass der Spawn-Prompt keine Begründungsabschnitte enthält | „sieht NUR Artefakte" ist derzeit nur Instruktion | S | Agent-Datei; Hooks-Doku |
| Ä11 | `knowledge/` | Drei Schichten (Handwerk universell / Atlas / Nutzer-Projekt) + Verfallsdatum je Dossier + Pflege-Routine (Routine/Cron) | Dossier ist chriso-gebunden und veraltet (eigene KORREKTUR beweist es); §11a/c | L (R15/R17) | `forschung-2026-09.md`; Kontextpaket §11 |
| Ä12 | `core/memory.py` Fütterung | Hooks: `UserPromptSubmit`→recall als `additionalContext`; `SubagentStop`/`Stop`→Kandidaten; `PreCompact`→Sicherung | Willensakt → Algorithmus; Chrisos Betriebsbefund (5/93 vom Nutzer) | M (R05) | `CLAUDE.md` Punkt 7; Kontextpaket §3 |

**STREICHEN**

| # | Datei | Was | Warum | Aufw. | Beleg |
|---|---|---|---|---|---|
| S1 | `memory/README.md` | Entfernen oder als „Archiv: Forge-Memory-Design, nicht gebaut" markieren | Beschreibt Skripte/Schemas, die nicht existieren — Invariante 1 wörtlich verletzt | S | `memory/README.md` Z. 20–27; `ls memory/` |
| S2 | `SOUL.md` Organ-Tabelle | „Stop konsolidiert", `watch/receipts/` streichen, bis Mechanismus existiert (oder N-Punkte bauen) | Name ohne Mechanismus (Invariante 5) | S | `events.py` stop-Modus; kein Receipt-Code |
| S3 | `core/starter.py` | `pbcopy`-Clipboard-Start, `monitor.command`-Generierung, `/opt/homebrew`-Fallback | Mac-Hacks; durch Ä5 ersetzt | S | `starter.py` |
| S4 | `PROJEKT-START.md` als Produktartefakt | Bleibt Chrisos Bauauftrag im Repo-Archiv; ist kein Nutzer-Einstieg | Universalität | S | Inhalt („Baue Soul") |
| S5 | `gates/sol.sh` Z. 63–69 | Toter `ENV_ALLOWLIST … && false`-Block | Dead Code | S | `sol.sh` |
| S6 | `.claude/settings.json` | `workflowSizeGuideline: large` als Default | Bei geteiltem Kontingent widerspricht „large" (<50 Agents) der Wellen-Regel; Default `small`, Dirigent hebt gezielt | S | Workflows-Doku Size-Guideline; Kontextpaket §3 Wellen-Regel |

**NEU**

| # | Datei | Was | Warum | Aufw. | Beleg |
|---|---|---|---|---|---|
| N1 | `agents/conductor.md` + Plugin `settings.json` `agent: conductor` | Dirigenten-Schleife (§2.3) als Main-Thread-Agent | Kern von Soul 10; Plugin-Mechanismus existiert | M | Plugins-Doku `settings.json` `agent` |
| N2 | `hooks/verify_gate.py` (`TaskCompleted`, `Stop`, `SubagentStop`) | Kein „fertig" ohne Receipt; Exit 2 mit Begründung | „Der Prüfer fällt zuerst weg" mechanisch lösen; Ralph-Kritik (ehrliche Ausgänge) | M | Hooks-Doku Exit-2-Semantik; `orchestrierung.md` Mechanismus 1 |
| N3 | `hooks/critic_trigger.py` | Zähler im Bus: jede 3. Lieferung / Flags `netz|install|daemon|security` → Pflicht-Gate außerhalb des Dirigenten | Red-Team-Befund B1; heute Ermessen in `bauen.md` P.6 | S | `orchestrierung.md` Mechanismus 2 |
| N4 | `agents/builder.md`, `researcher.md`, `installer.md`, `writer.md` | Ausführende Rollen mit Vertragspflicht, `isolation: worktree`, `maxTurns`, Selbstbericht-Schema | Es gibt keinen Ausführenden; „Dirigent baut nie selbst" ist sonst leer | M | `.claude/agents/` Bestand |
| N5 | `core/contracts.py` | Vertrag aus Knoten generieren (`contracts/<id>.md`), Receipt validieren, Manifest hashen | Übergabe-Vertrag als Datei statt Prosa im Spawn-Prompt | M | §2.4 |
| N6 | `core/atlas.py` + `profile.json` | Bestandsaufnahme (OS, RAM/GPU, CLIs, Logins, MCPs, lokale Modelle), Kontingent-Buchung, Modellpassung | §11a–c; heute leer (`.mcp.json {}`) | L (R15) | Kontextpaket §11 |
| N7 | `core/onboarding.py` | Fünf-Block-Onboarding, Ring-2-Bündel, Zustimmungsprofil → stehende Mandate | Zustimmung im Design; heute 15-Min-Mandat pro Kategorie | M | §2.5; `guard.py grant_mandate` |
| N8 | `core/counter_voice.py` | Gegenstimme als Unabhängigkeitsmechanismus: Fremdmodell **oder** Selbstkonsistenz@3 mit frischem Kontext, Passung gemessen (N4 des 5.0-Papiers) | Nutzer ohne Codex; gemessener Gegner | M | Kontextpaket §3, §5 |
| N9 | `monitor/` (Web, SSE auf Bus) + Remote-Control-Hinweis | Ebenen-Baum, Kosten je Knoten, Not-Stopp je Ebene/Prozess | Terminal-Monitor ist Mac-gebunden und ebenenblind | L | `forschung-2026-09.md` (Fork-Empfehlung) |
| N10 | `workflows/verify-fanout.js`, `research-crosscheck.js` | Bewährte Fan-outs als gespeicherte Workflows (Verifikation adversarial, Recherche mit Cross-Check) | Workflows sind gebaut, aber nie genutzt | S | Workflows-Doku Beispiele |
| N11 | `eval/conductor-vs-baseline/` | Vorregistrierte Messung: Schleife vs. CLAUDE.md-2.9. vs. nackt auf Projektaufgaben; Placebo-Arm; Selbstkonsistenz-Arm | Regel 4 („neu heißt geprüft") | M | Kontextpaket §3 Methodik |
| N12 | `core/failure_taxonomy.py` | MAST-Klassen als Labels für Fehlweg-Einträge im Memory (automatischer Annotator) | Kalibrierung; MAST zeigt 94 % automatisierbar | S | MAST-Abstract |

## 3. Konsequenzen für das Design von Ordnung × SOUL

1. **Die SOUL-Basis ist Erz der besten Sorte — Guard, Verdict-Schema, Beleg≠Urteil, Doctor-Probe, Kill-Check — aber kein Betriebssystem.** Soul 10 übernimmt diese fünf Stücke (verallgemeinert) und baut die Durchführungsstruktur neu: Vertragsbaum statt Ein-Vorhaben, Bus statt Zwei-Wahrheiten, Hooks statt Ermahnungen. „Gold aus Erz"-Zeile für jedes Organ steht in §2.1.
2. **Jede Verhaltensregel aus CLAUDE.md wird zuerst als Hook gebaut** (Regel „Algorithmus schlägt Willensakt", die SOUL selbst aufstellt und nicht anwendet): recall bei Prompt, Gate bei Lieferung, Receipt-Pflicht bei „fertig", Sicherung bei Kompaktierung, Kritik-Trigger im Zähler. Was kein Hook kann, bleibt Text — und nur das.
3. **Die Dirigenten-Schleife (§2.3) ist das Kernel-Modul `conductor` und der Main-Thread des Plugins.** Sie ist Hypothese: gemessen gegen CLAUDE.md-2.9. und nackt, mit Placebo (gleich lang, inhaltsleer) und Selbstkonsistenz@3-Arm; Vorhersage vorab: Vorteil bei Projektaufgaben >10 Schritte, neutral bei Einzelantworten. Der 6-Punkte-Frame bleibt byte-gleich als Antwort-Vorbereitungsschicht daneben.
4. **Ebenen sind Tiefe mit Vertrag, Parallelität ist Ausnahme mit Dateibesitz.** Subagents bis Tiefe 3, Workflows für Fan-out/Cross-Check, `-p`-Prozesse und Fremd-CLIs für Kontingent-Trennung und Langlauf, Cloud als Ebene 6. Sechs Ebenen sind Maximum; die Schleife wählt die kleinste tragende Struktur. Aufwandsskala (1 / 2–4 / >10 Agenten) und Wellen-Regel (`MAX_CONCURRENT_SUBAGENTS=3` Default) sind Konfiguration, nicht Vorsatz.
5. **Zustand lebt nur in Dateien:** `state/project.json` (Baum), `contracts/`, `receipts/`, `events.jsonl` (ein Bus, alle Ebenen), `profile.json`, `atlas/`. Kompaktierung, Session-Ende, Prozess-Tod sind damit Wiedereinstiege, keine Verluste (Anthropic-Harness, Manus).
6. **Verifikation ist getrennt und erzwungen:** Proben sind Kommandos, die scheitern können, dürfen nie gelöscht werden, laufen bei einer Instanz, die nicht gebaut hat, und landen als Receipt nach `verdict.schema.json`. Drei Hooks sichern, dass der Prüfer nicht wegfällt. „Done" ist ein Verifizierer-Urteil.
7. **Gegenstimme = Unabhängigkeit, nicht Markenname:** Fremdmodell, wenn vorhanden; sonst Selbstkonsistenz@3 mit frischem Kontext; Passung gemessen. Damit hat auch der Nutzer mit einem Modell eine Gegenstimme (Meisterschaft unter Knappheit).
8. **Guard mit Profil:** universeller Kern (Secrets-Exfiltration, Zahlungen, irreversible Fremdlöschung, Wache-Integrität) + Zustimmungsprofil aus dem Onboarding (Publizieren, Prod, Remotes) als stehende, sichtbare, widerrufbare Mandate. Chrisos private Liste bleibt sein Profil.
9. **Der beste KI-Nutzer startet mit allen Werkzeugen des Nutzers:** `--strict-mcp-config`/Isolation wird Option, Bestandsaufnahme (`atlas.py`) läuft vor dem ersten Plan, Wissensorgan hat drei Schichten mit Verfall (R15/R17).
10. **Universalität durch Plugin + Profil:** Python-Entry statt zsh, kein pbcopy/open/.command, `${CLAUDE_PLUGIN_DATA}` statt `$HOME/SOUL`, Personalisierung aus `profile.json`, `ONBOARDING.md` statt `PROJEKT-START.md`. Dieselbe Quelle kompiliert für Codex/Gemini/Cursor/API/Ollama (R03/R04).
11. **Kontingent ist erste Steuergröße:** Token erklären 80 % der Varianz (Anthropic) und kosten 10× ohne Cache (Manus). Also: stabiler Präfix, 1h-Cache, Kosten je Knoten im Bus, Modell-Stufen je Ebene, Pausenplanung um Limits — und das alles gemessen, nicht behauptet.
12. **Ehrliche Ausgänge sind Pflichtfeature:** „blocked", „not-evaluated", Budgetstopp und „ich weiß nicht" sind immer verfügbare Zustände (Anti-Ralph). Kein Prompt darf „fertig" zum einzigen Ausgang machen.

## 4. Widersprüche / Unsicherheiten

- **Cognition vs. Anthropic-Research vs. Chrisos 3–6 Ebenen:** Cognition rät von Multi-Agent ab, Anthropic misst +90 % bei Research und warnt für Coding. Chrisos Zielbild verlangt Ebenen für *alle* Projekte. Unsere Auflösung „Tiefe statt Breite" ist plausibel, aber **ungemessen**: Ob ein Vertragsbaum mit 3+ Ebenen bei Bau-Aufgaben besser ist als ein linearer Agent mit Kompression, ist die erste Messfrage (N11). Vorhersage: Bei Bau-Aufgaben gewinnt Tiefe nur, wenn Verifikation getrennt läuft; ohne Prüfer-Ebene verliert sie.
- **„Beste Basis?" — Ja, mit Vorbehalt.** Der Schnitt (7 Organe) ist richtig, weil er Wache/Gedächtnis/Prüfung trennt. Aber das Repo ist drei Tage alt, ein Commit, null Läufe. Es gibt **keinen Betriebsbeweis**, dass irgendein Organ außer Guard und Doctor funktioniert. Wer Soul 10 darauf baut, baut auf Spezifikation. Die ehrliche Alternative wäre, den Zwei-Agenten-Harness von Anthropic als Minimal-Skelett zu nehmen und SOULs Guard/Schema/Doctor hineinzusetzen — funktional identisch mit unserer Verbesserungsliste, aber mit kleinerem Erbe.
- **Agent Teams sind experimentell** (Doku: kein Resume, Status-Lag, nicht in `-p`, ein Team pro Session). Ebene-Modell nutzt sie nur für Ebene 2/3-Diskussionsfälle. Kann sich mit CLI-Versionen ändern; Dossier-Pflege nötig.
- **Workflows nehmen keine Nutzer-Eingabe mitten im Lauf** und das `ultracode`-Schlüsselwort greift nicht aus `-p`. Ebene 5 (`-p`-Worker) kann also keine Ultracode-Workflows per Keyword auslösen; über den `Workflow`-Tool-Aufruf mit Allow-Regel schon (Doku). [unverifiziert am Draht.]
- **Guard-Regexes gegen „null Kontrolle":** Chriso will null Bremsen; die Kern-Kategorien bleiben Bremsen (Sekunden, sichtbar). Wir halten sie für Ring 2 im Sinne des Nutzers (Secrets, Geld, irreversible Fremdlöschung). Wenn Chriso auch diese streichen will, ist das seine Entscheidung — der Bericht empfiehlt es nicht, weil der Guard die einzige Stelle ist, an der „Rückbau" bei irreversiblen Aktionen noch möglich ist.
- **MAST-Prozente** der drei Kategorien nicht verifiziert (Abstract nennt sie nicht). **Codex-Details** aus Sekundärquellen. **Windows-Not-Stopp** ungeprüft.
- **Frame-Wirkung auf den Dirigenten:** Die HumanEval-Serie maß Einzelantworten, nicht Projektläufe. Ob der 6-Punkte-Frame in der Dirigentenrolle nützt oder schadet (Punkt 5 „challenge the prescribed path" bei Verträgen!), ist offen; die Schleife trennt deshalb Vorbereitung (Frame) und Betrieb (Schleife).
- **Kosten der Hooks:** Jeder PreToolUse-Hook startet einen Python-Prozess; bei Fan-outs mit 16 Agenten × 50 Calls sind das hunderte Prozesse pro Minute. `if`-Feld und Matcher begrenzen es; messen.

## 5. Quellen

**Lokale Dateien (gelesen):**
- `/home/user/nextool/ordnung/docs/research/00-KONTEXT-FUER-AGENTEN.md` (§1–13)
- `/home/user/nextool/ordnung/docs/research/briefs/R14.md`
- `/home/user/soul/SOUL.md`, `CLAUDE.md`, `PROJEKT-START.md`, `README.md`
- `/home/user/soul/core/{guard.py, events.py, mission.py, starter.py, soul.py (Kommandos), memory.py (API), doctor.py (Checks)}`
- `/home/user/soul/.claude/{settings.json, hooks/hook.py, statusline.sh, agents/*.md (5), output-styles/soul-dirigent.md}`
- `/home/user/soul/gates/{README.md, SOL-LOG.md, sol.sh, verdict.schema.json}`
- `/home/user/soul/playbooks/{bauen, fehlweg, preflight, recherche, uebergabe}.md`
- `/home/user/soul/knowledge/{INDEX, orchestrierung, denk-architekturen, forschung-2026-09}.md`
- `/home/user/soul/watch/events-20260902-07{1926,2139}.jsonl`, `/home/user/soul/memory/README.md`, `/home/user/soul/tests/` (Zählung), `/home/user/soul/.mcp.json`, `git log`

**Web (WebFetch/WebSearch, 2026-09-06):**
1. Anthropic Engineering — Effective harnesses for long-running agents: https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
2. Anthropic Engineering — How we built our multi-agent research system: https://www.anthropic.com/engineering/multi-agent-research-system
3. Cognition — Don't build multi-agents: https://cognition.com/blog/dont-build-multi-agents
4. Cemri et al., Why Do Multi-Agent LLM Systems Fail? (arXiv 2503.13657): https://arxiv.org/abs/2503.13657
5. Manus — Context Engineering for AI Agents: https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus
6. LessWrong — Ralph-wiggum is Bad and Anthropic Should Fix It: https://www.lesswrong.com/posts/bmNHsY5i3EoP4BAoJ/ralph-wiggum-is-bad-and-anthropic-should-fix-it
7. Ralph-Loop-Praxisberichte (WebSearch-Snippets): https://sparkryai.substack.com/p/everyones-using-ralph-loops-wrong ; https://dev.to/sean8/i-accidentally-made-claude-ask-itself-the-same-question-1966-times-1c5h
8. Claude Code Docs — Subagents: https://code.claude.com/docs/en/sub-agents
9. Claude Code Docs — Agent teams: https://code.claude.com/docs/en/agent-teams
10. Claude Code Docs — Hooks: https://code.claude.com/docs/en/hooks
11. Claude Code Docs — Dynamic workflows: https://code.claude.com/docs/en/workflows
12. Claude Code Docs — Cross-session messaging: https://code.claude.com/docs/en/cross-session-messaging
13. Claude Code Docs — Run programmatically (headless): https://code.claude.com/docs/en/headless
14. Claude Code Docs — Create plugins: https://code.claude.com/docs/en/plugins
15. Codex 2026 (Sekundärquellen via WebSearch): https://bhavishyapandit9.substack.com/p/everything-about-codex-the-complete ; https://blakecrosley.com/guides/codex ; https://openai.com/index/introducing-codex/
16. MAST-Sekundärquelle (ohne Prozente): https://orq.ai/blog/why-do-multi-agent-llm-systems-fail
