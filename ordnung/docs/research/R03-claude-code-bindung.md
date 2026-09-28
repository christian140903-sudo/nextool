# R03 — Claude Code: exakte Bindungsmechanik für ein kognitives Plugin

*Recherchebericht, Stand 2026-09-05. Auftrag: `briefs/R03.md`. Kontext: `00-KONTEXT-FUER-AGENTEN.md`. Alle Formate aus offizieller Doku (code.claude.com/docs, WebFetch am 2026-09-05) und lokaler CLI (`claude --version` = 2.1.261) verifiziert, wo möglich; Erinnerungswissen ist als [unverifiziert] markiert.*

## Gliederung

1. Kernaussagen (mit Quellen)
2. Detailbefunde
   - 2.1 CLAUDE.md-Hierarchie, Imports, Rules, Kernel-Injektion, Compaction
   - 2.2 Skills (SKILL.md, Frontmatter, Progressive Disclosure, Agent-Skills-Standard)
   - 2.3 Hooks (Events, Typen, I/O-Schemata, Plugin-Hooks, SOUL-Erweiterung)
   - 2.4 Subagents (Frontmatter, Memory, innere Stimmen, Kosten)
   - 2.5 Plugins (plugin.json, Layout, Marketplace, Installation, Versionierung)
   - 2.6 Auto-Memory und Selbstmodell-Speicherort
   - 2.7 settings.json, Permission-Modi, „volle Autonomie"
   - 2.8 Headless / Agent SDK für den Eval-Runner
   - 2.9 Kontext und Kosten (Caching, Compaction, Größe des Always-On-Anteils)
   - 2.10 Existierende Plugins/Skills mit Persona/Memory-Charakter
3. Konsequenzen für das Design von Ordnung × SOUL (inkl. Referenz-Blaupause)
4. Widersprüche / Unsicherheiten
5. Quellen

---

## 1. Kernaussagen (mit Quellen)

1. **Plugins können keine CLAUDE.md, keine `.claude/rules/*.md` und (außer `agent`/`subagentStatusLine`) keine settings.json liefern** (plugins-reference). Ein „immer geladener" Kernel ist im Plugin nur über `SessionStart`-Hook-Kontext, Output-Style (`force-for-plugin`), einen Agent als Hauptthread oder Skill-Listing-Descriptions realisierbar — die Rule/CLAUDE.md-Zustellung braucht einen Installer-Schritt außerhalb des Plugins.
2. **Compaction überlebt (dokumentiert): System-Prompt/Output-Style, Root-CLAUDE.md + unscoped Rules, Auto-Memory, bis zu 5 zuletzt geänderte Dateien, aufgerufene Skill-Bodies (≤ 5.000 Tokens/Skill, ≤ 25.000 gesamt) und `SessionStart`-Hooks mit Matcher `compact`**; früherer Hook-Kontext wird summarisiert, das Skill-Listing lädt nicht neu (context-window, hooks-guide). Der Identitätsanker gehört deshalb in `SessionStart: startup|resume|clear|compact`.
3. **Hook-Zustellung von Kontext ist eventabhängig:** Plain-stdout wird nur bei `UserPromptSubmit`, `UserPromptExpansion`, `SessionStart`, `PostModelSwitch` Kontext; `additionalContext` als JSON ist für Tool-Events dokumentiert; `PreCompact`-stdout landet **nicht** im Kontext; `SessionEnd` hat 1,5 s Budget, `Stop` 600 s (hooks). Reflexion → `Stop` (ggf. `async`), Snapshot → `PreCompact`, Rückinjektion → `SessionStart:compact`.
4. **Alle Event-Namen des Briefs sind bestätigt** und es gibt mehr: Setup, UserPromptExpansion, PostToolBatch, InstructionsLoaded, StopFailure, PreModelSwitch/PostModelSwitch, ConfigChange, WorktreeCreate/Remove, Elicitation. `InstructionsLoaded` liefert den Trigger-Nachweis für SOULs Regel „Code ohne Trigger = toter Mechanismus" (hooks).
5. **Skill-Listing kostet jeden Turn: Budget 1 % des Kontextfensters, 1.536 Zeichen/Skill, am wenigsten genutzte fallen zuerst weg**; `disable-model-invocation: true` nimmt einen Skill komplett aus dem Kontext (skills). Bei 200k sind das ~2.000 Zeichen für **alle** Skills — der Faktorkatalog kann nicht als Skill-Wolke always-on sein.
6. **Agent-Skills-Standard vs. Claude-Code-Felder:** Standard erlaubt nur `name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`; `name` muss dem Verzeichnisnamen entsprechen; Claude-only-Felder (`user-invocable`, `context`, `hooks`, `paths`, `model`, `effort` …) erzeugen anderswo Validierungsfehler (skills, agentskills.io). Portabler Kern = Standardfelder, Plugin-Variante per Build-Skript.
7. **Auto-Memory** (`~/.claude/projects/<p>/memory/MEMORY.md`, 200 Zeilen/25 KB, jede Session und nach Compaction reinjiziert, Claude kuratiert selbst, projektgebunden, nicht in Subagents) **ist als Selbstmodell-Speicher ungeeignet**, aber als Sensor nützlich; **Agent-Memory** (`memory: user`) ist der einzige dokumentierte Weg, eine persistente Notizdatei in den **System-Prompt** eines Agenten zu legen (memory, sub-agents, agent-sdk).
8. **Permission-Modi:** `default`(=manual), `acceptEdits`, `plan`, `auto` (Classifier; Startmodus auf Pro/Max/Team; `defaultMode: auto` wirkt **nicht** aus Projekt-Settings), `dontAsk`, `bypassPermissions` (nur beim Start aktivierbar; Doku: nur isolierte Umgebungen). **Deny-Regeln und PreToolUse-`deny`-Hooks gelten in jedem Modus inkl. bypass; Allow-Regeln haben in bypass keine Wirkung** — SOULs Ring-2-Guard bleibt in „sovereign" wirksam (permissions, permission-modes).
9. **Autonomie ist Modus-unabhängig:** Auto-Modus „nudges" nur gegen Rückfragen; das Anti-Hedging/Anti-Rückfrage-Verhalten muss Kernel + Output-Style tragen. Der Proactive-Style ist laut Doku „stronger autonomous-execution guidance than auto mode applies" (output-styles, permission-modes).
10. **Prompt-Caching:** Skills, Agents, Hooks, Output-Styles eines Plugins **halten** den Cache (werden angehängt); nur MCP-Server-Änderungen, Modell-/Effort-Wechsel, bare Tool-Deny und Compaction invalidieren. Always-on-Inhalt im Prefix kostet nach dem ersten Request ~10 %; 1 h TTL nur auf Subscription innerhalb Plan-Limit, Subagents 5 min (`subagentPromptCacheTtl`) (prompt-caching, costs).
11. **Headless:** `--bare` ist der empfohlene und künftig Default-Modus für `-p` (keine Hooks/Plugins/CLAUDE.md/Auto-Memory; Kontext nur über Flags; Auth nur API-Key); `-p` startet auf jedem Plan in Manual → `--permission-mode dontAsk --permission-prompts none` (≥ 2.1.259) für Evals; Result-JSON enthält `modelUsage`, Cache-Felder, `subagent_stats`, `permission_denials` — lokal verifiziert (headless, eigener Lauf). SDK lädt per Default `["user","project","local"]` wie die CLI; Auto-Memory unabhängig davon.
12. **Lokal verifiziert (2.1.261):** `claude plugin validate --strict --json` akzeptiert das Ordnung-Skelett (plugin.json mit `userConfig`) ohne Fehler oder Warnung — **aber der Validator prüft in dieser Version nur das Manifest:** ein Negativtest mit absichtlich kaputtem SKILL.md (Großbuchstaben-`name`, unbekanntes Feld, `user-invocable: maybe`) lieferte ebenfalls `success: true, contents: []`. Skill-/Agent-Frontmatter und hooks.json der Blaupause sind daher **gegen die Doku**, nicht durch das Tool verifiziert (hooks.json nur als JSON geparst); `claude plugin init` scaffoldet nach `~/.claude/skills/<name>/` (lädt als `<name>@skills-dir`); `claude plugin details` zeigt projizierte Token-Kosten; `claude plugin eval --ablation with-without` bringt einen No-Plugin-Baseline-Arm mit (3 Runs, Judge haiku).

---

## 2. Detailbefunde

### 2.1 CLAUDE.md-Hierarchie, Imports, Rules, Kernel-Injektion, Compaction

**Quelle:** https://code.claude.com/docs/en/memory (WebFetch 2026-09-05), lokal `claude --help` (2.1.261).

**Ladeorte und Reihenfolge (breit → spezifisch, alle werden konkateniert, nicht überschrieben):**

| Scope | Pfad | Geteilt mit |
|---|---|---|
| Managed policy | Linux `/etc/claude-code/CLAUDE.md`, macOS `/Library/Application Support/ClaudeCode/CLAUDE.md`; alternativ Key `claudeMd` in `managed-settings.json` | Organisation, nicht ausschließbar |
| User | `~/.claude/CLAUDE.md` | alle Projekte des Nutzers |
| Project | `./CLAUDE.md` oder `./.claude/CLAUDE.md` | Team via Git |
| Local | `./CLAUDE.local.md` (gitignore) | nur dieser Nutzer, dieses Projekt |

- Vom Dateisystem-Root abwärts bis zum cwd: `foo/CLAUDE.md` steht im Kontext **vor** `foo/bar/CLAUDE.md`; „instructions closer to where you launched Claude are read last". Innerhalb eines Verzeichnisses wird `CLAUDE.local.md` nach `CLAUDE.md` angehängt.
- Unterverzeichnisse: CLAUDE.md dort wird **on demand** geladen, wenn Claude Dateien in diesem Unterverzeichnis liest — nicht beim Start.
- `--add-dir`-Verzeichnisse laden ihre CLAUDE.md standardmäßig **nicht**; erst mit `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1` (lädt dann `CLAUDE.md`, `.claude/CLAUDE.md`, `.claude/rules/*.md`, `CLAUDE.local.md` aus dem Zusatzverzeichnis).
- Block-HTML-Kommentare (`<!-- -->`) werden vor der Injektion entfernt (kostenlose Wartungsnotizen); in Codeblöcken bleiben sie erhalten.
- **Zustellung:** „CLAUDE.md content is delivered as a user message after the system prompt, not as part of the system prompt itself." Kein Compliance-Garant; für harte Regeln Hooks nutzen.
- `claudeMdExcludes` (Array von Absolut-Globs, alle Settings-Ebenen, mergt) blendet fremde CLAUDE.md/Rules aus — für SOUL relevant, um Altlasten-CLAUDE.md in Elternverzeichnissen (z. B. `/home/user/CLAUDE.md`) auszuschließen.

**@-Imports:** Syntax `@path/to/file`, relativ zur importierenden Datei (nicht zum cwd), absolute Pfade und `@~/...` erlaubt; **max. 4 Hops** rekursiv; Code-Spans/Fenced-Blocks werden beim Parsen übersprungen (`` `@README` `` bleibt literal). Importierte Dateien werden **beim Start voll expandiert** — Imports sparen keinen Kontext, sie organisieren nur. Externe Imports (Pfad außerhalb des Arbeitsverzeichnisses) aus **Projekt**-Dateien lösen einmalig einen Zustimmungsdialog aus; aus **User**-Dateien (`~/.claude/CLAUDE.md`, `~/.claude/rules/`) werden sie ohne Dialog geladen (Ausnahme Cowork-Desktop-Sessions). `AGENTS.md` wird nicht direkt gelesen; `@AGENTS.md` in CLAUDE.md oder Symlink.

**`.claude/rules/*.md`:** rekursiv entdeckt; **ohne** `paths`-Frontmatter beim Start geladen „with the same priority as `.claude/CLAUDE.md`"; **mit** `paths:` (YAML-Liste von Globs, Brace-Expansion erlaubt, Budget 1.000 expandierte Muster / 4 MiB pro Regel) nur, wenn Claude Dateien liest, die passen (Trigger ist das **Lesen**, nicht jeder Tool-Aufruf). User-Rules in `~/.claude/rules/` laden **vor** Projekt-Rules. Symlinks werden aufgelöst (Shared-Rules über Projekte). Projekt-Rules entfallen, wenn `project` aus `--setting-sources` ausgeschlossen ist.

**Größe:** „target under 200 lines per CLAUDE.md file. Longer files consume more context and reduce adherence." Hartes Limit: Dateien > 4 MiB werden übersprungen. `/doctor` (≥ 2.1.206) schlägt Kürzungen vor: streicht, was aus dem Code ableitbar ist, behält „pitfalls, rationale, and conventions that differ from tool defaults". Widersprüchliche Regeln: „Claude may pick one arbitrarily" — für den Faktorkatalog heißt das: keine zwei Faktoren, die sich im Wortlaut widersprechen, ohne explizite Vorrangregel.

**Was Compaction überlebt (dokumentiert):** „Project-root CLAUDE.md survives compaction: after `/compact`, Claude re-reads it from disk and re-injects it into the session. Nested CLAUDE.md files in subdirectories and rules with `paths:` frontmatter reload as Claude reads files they apply to." Verloren gehen: nur im Gespräch gegebene Instruktionen, ungeladene nested-CLAUDE.md, path-scoped Rules ohne erneuten Treffer. Skills: „most recent skills kept in budget; older ones may drop after compaction" — Re-Invoke stellt wieder her. Für Ordnung: **der Kernel darf niemals nur „im Gespräch" leben (z. B. nur als einmal aufgerufener Skill oder als UserPromptSubmit-Kontext der ersten Runde).**

**Wie ein Kernel zuverlässig in jeden Turn kommt — Vergleich der fünf Wege:**

| Weg | Position im Kontext | Überlebt Compaction | Portabel (Plugin) | Bemerkung |
|---|---|---|---|---|
| CLAUDE.md (User/Project) | User-Message nach System-Prompt, jeder Turn | **ja** (Root-Datei wird neu gelesen) | nein — Plugins haben **keine** CLAUDE.md-Komponente (siehe 2.5) | Standardweg, aber im Plugin nicht lieferbar |
| Skill (SKILL.md) | erst nach Invoke als eine Message; Listing (Name+Description) jeden Turn | nur „recent" Skills | ja (`skills/`) | Kernel als Skill = nicht garantiert präsent |
| SessionStart-Hook `additionalContext` | Kontext zu Sessionbeginn; Matcher `compact` feuert **nach** Compaction erneut | **ja, wenn Matcher `startup\|resume\|clear\|compact`** | ja (`hooks/hooks.json`) | einziger Plugin-Weg mit Compaction-Reinjektion |
| UserPromptSubmit-Hook stdout/additionalContext | jeder Prompt, als Kontext zum Prompt | pro Turn neu erzeugt | ja | ideal für **kurzen** Routing-Hinweis, nicht für den ganzen Kernel (Kosten × Turns) |
| `--append-system-prompt[-file]` / `--system-prompt` | System-Prompt selbst | ja (System-Prompt bleibt); mit `--system-prompt-snapshot on` wird er sogar eingefroren | nein (CLI-Flag, kein Plugin) | stärkste Position; nur über den Starter (`bin/soul start`) oder `-p`-Runner setzbar |
| `settings.json` `outputStyle` | ersetzt Teile des Default-System-Prompts | ja | ja (`outputStyles/` im Plugin, Aktivierung per Setting) | SOUL nutzt bereits `soul-dirigent` |

`claude --help` (lokal, 2.1.261) bestätigt: `--append-system-prompt <prompt>`, `--system-prompt <prompt>`, `--system-prompt-snapshot <on|off>` („By default it is on for the built-in prompt, and passing --system-prompt or --append-system-prompt turns it off so the given text applies fresh each launch"), `--exclude-dynamic-system-prompt-sections` (verschiebt cwd/env/git-Status in die erste User-Message → besserer Cache-Reuse), `--bare` (überspringt Hooks, Plugin-Sync, Auto-Memory, CLAUDE.md-Discovery; Kontext nur explizit via `--system-prompt[-file]`, `--append-system-prompt[-file]`, `--add-dir`, `--settings`, `--agents`, `--plugin-dir`), `--safe-mode` (alle Anpassungen aus).

**Auto Memory (Doku memory-Seite):** Verzeichnis `~/.claude/projects/<project>/memory/` (Projekt aus Git-Repo abgeleitet, alle Worktrees teilen es), `MEMORY.md` = Index (**erste 200 Zeilen oder 25 KB**, jede Session geladen), Topic-Dateien on demand. Typen im Frontmatter `type: user|feedback|project|reference`; `modified`-Timestamp (≥ 2.1.214). Umlenkbar via `autoMemoryDirectory` (absolut oder `~/`), abschaltbar via `autoMemoryEnabled: false` oder `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`; `CLAUDE_CODE_PROJECT_DIR_NAME` + `CLAUDE_CONFIG_DIR` erlauben ein **projektübergreifendes** Memory-Verzeichnis (≥ 2.1.234). Nicht in Subagents geladen (außer Fork). Vom Transcript-Cleanup ausgenommen. Details zur Selbstmodell-Eignung in 2.6.

### 2.2 Skills (SKILL.md, Frontmatter, Progressive Disclosure, Agent-Skills-Standard)

**Quellen:** https://code.claude.com/docs/en/skills, https://agentskills.io/specification (beide WebFetch 2026-09-05).

**Orte und Vorrang:** Enterprise (managed) > Personal `~/.claude/skills/<name>/SKILL.md` > Project `.claude/skills/<name>/SKILL.md` > nested project (`packages/web/.claude/skills/`, lädt, wenn Claude dort Dateien bearbeitet) > Plugin `<plugin>/skills/<name>/SKILL.md` (Namensraum `/plugin:skill`, kollisionsfrei). Skills schlagen `.claude/commands/`-Dateien. Live-Reload: persönliche/Projekt-SKILL.md werden mid-session erkannt; Plugin-SKILL.md ebenfalls, aber Hooks/`.mcp.json`/`agents/`/`output-styles/` brauchen `/reload-plugins`.

**Vollständige Frontmatter-Felder (Claude Code, alle optional):**

| Feld | Typ | Bedeutung |
|---|---|---|
| `name` | string | Anzeigename; Default = Verzeichnisname; im Plugin letztes Segment des Kommandos |
| `description` | string | Auswahlkriterium für Claude (empfohlen) |
| `when_to_use` | string | Triggerphrasen, wird an description angehängt (gemeinsam 1.536 Zeichen Cap) |
| `argument-hint` | string | Autocomplete-Hinweis, z. B. `[issue-number]` |
| `arguments` | string/list | benannte Positionsargumente für `$name`-Substitution |
| `disable-model-invocation` | bool | `true` = nur Nutzer ruft auf; **Description verschwindet aus dem Kontext** |
| `user-invocable` | bool | `false` = nur Claude ruft auf; nicht im `/`-Menü |
| `allowed-tools` | string/list | vorab erlaubte Tools **für diesen Turn** (löscht sich nach nächster User-Message) |
| `disallowed-tools` | string/list | Tools aus dem Pool entfernt, solange der Skill aktiv ist |
| `model` | string | Modell-Override für den Skill-Turn, auch `inherit` |
| `effort` | string | `low\|medium\|high\|xhigh\|max` |
| `context` | string | `fork` = isolierter Subagent-Kontext |
| `agent` | string | Subagent-Typ bei `context: fork` (`Explore`, `Plan`, `general-purpose`, eigene) |
| `background` | bool | bei `context: fork`: `false` wartet auf Ergebnis (Default `true`; ≥ 2.1.218) |
| `hooks` | map | Hooks, registriert bei Skill-Aufruf, **bleiben für den Rest der Session**; `once: true` möglich |
| `paths` | string/list | Globs, die Auto-Invocation begrenzen |
| `shell` | string | `bash` (Default) oder `powershell` für `` !`cmd` `` |
| `metadata` | map | frei (ignoriert) |
| `license`, `compatibility` | string | Agent-Skills-Spec; akzeptiert, ohne Wirkung |

Booleans akzeptieren `true/false/yes/no/on/off/1/0`.

**Auswahlmechanik und Budget:** Das Listing (Name + Description aller modell-aufrufbaren Skills) wird **jeden Turn** geladen; Budget **1 % des Kontextfensters** (Setting `skillListingBudgetFraction`, z. B. `0.02`; Env `SLASH_COMMAND_TOOL_CHAR_BUDGET` fixiert Zeichen), pro Skill max. **1.536 Zeichen** (`skillListingMaxDescChars`). Bei Überlauf fallen die Beschreibungen der **am wenigsten genutzten** Skills weg. `skillOverrides: {"name": "on"|"name-only"|"user-invocable-only"|"off"}`. Nutzer-only-Skills (`disable-model-invocation: true`) kosten **null** Kontext bis zum Aufruf — relevant für Ordnungs-Wartungs-Skills (`/ordnung:reflect`, `/ordnung:status`).

**Lebenszyklus im Kontext:** Skill-Inhalt kommt als **eine Message** und bleibt über Turns; erneuter Aufruf mit unverändertem Inhalt erzeugt nur eine Notiz; nach Auto-Compaction bleiben „most recent skills" im Budget, ältere fallen weg — Re-Invoke stellt wieder her. Die Kontextfenster-Doku präzisiert: nach Compaction werden „the skills you invoked" re-injiziert, **das Skill-Listing aber nicht**.

**Dynamischer Kontext:** `` !`command` `` (muss Zeile beginnen oder nach Whitespace stehen; Output wird als Text eingefügt, **bevor** Claude den Skill sieht), mehrzeilig als ```` ```! ```` Fence; Timeout 2 min pro Befehl; Exit ≠ 0 bricht den Skill-Aufruf ab (Exit 1 bei grep/git diff gilt als normal); Befehle fragen nie nach Permission; abschaltbar via `disableSkillShellExecution`. Synced (claude.ai-)Skills bekommen lokal **keine** `!`-Ausführung. **Das ist der Hebel für Ordnungs-Skills, die Gedächtnis oder Router-Signale einlesen** (z. B. `` !`python3 ${CLAUDE_PLUGIN_ROOT}/bin/ordnung-brief.py` ``).

**Substitutionen:** `$ARGUMENTS`, `$ARGUMENTS[N]`, `$N`, `$name` (aus `arguments`), `${CLAUDE_SESSION_ID}`, `${CLAUDE_EFFORT}`, `${CLAUDE_SKILL_DIR}`, `${CLAUDE_PROJECT_DIR}`, `${CLAUDE_PLUGIN_ROOT}`, `${CLAUDE_PLUGIN_DATA}` (letzte zwei nur Plugin-Skills). Escape `\$`. Argumente werden nicht re-expandiert.

**Fork-Kontext:** `context: fork` startet **ohne** Gesprächshistorie; Built-ins `Explore`/`Plan` überspringen CLAUDE.md, `general-purpose` nicht; Hintergrund-Forks bekommen reduziertes Toolset.

**Größe/Progressive Disclosure:** SKILL.md **< 500 Zeilen**, Detail in Nebendateien (`reference.md`, `examples.md`, `scripts/`), die nur laden, wenn Claude sie öffnet. agentskills.io: drei Stufen — Metadata (~100 Tokens, immer), Instructions (< 5.000 Tokens empfohlen, bei Aktivierung), Resources (bei Bedarf); Referenzen eine Ebene tief.

**Agent-Skills-Standard (agentskills.io/specification):** Pflicht `name` (1–64 Zeichen, `a-z0-9-`, kein führender/abschließender/doppelter Bindestrich, **muss dem Verzeichnisnamen entsprechen**), `description` (1–1.024 Zeichen). Optional `license`, `compatibility` (≤ 500), `metadata` (string→string), `allowed-tools` (experimentell, space-separated). Verzeichniskonvention `scripts/`, `references/`, `assets/`. Validator `skills-ref validate ./my-skill`. **Claude-Code-only-Felder** (`argument-hint`, `arguments`, `disable-model-invocation`, `user-invocable`, `disallowed-tools`, `model`, `effort`, `context`, `agent`, `background`, `hooks`, `paths`, `shell`) erzeugen in claude.ai/Skills-API „Unexpected key(s)"-Fehler. **Konsequenz für den portablen Kern:** Ordnungs-Skills, die tool-übergreifend (Codex, Gemini CLI, Cursor) funktionieren sollen, dürfen nur Standardfelder tragen; Claude-Code-Spezifika kommen in eine Plugin-eigene Variante oder werden per Build-Skript hinzugefügt. Welche Nicht-Claude-Tools den Standard aktuell unterstützen, konnte ich auf der Spec-Seite nicht verifizieren [unverifiziert: Codex, Gemini CLI, Cursor, Copilot laut Ökosystem-Berichten].

**Skills in `-p`:** `/skill-name` im Prompt-String wird expandiert (headless nutzbar). In `--bare` lösen Skills weiterhin per `/skill-name` auf.

### 2.3 Hooks (Events, Typen, I/O-Schemata, Plugin-Hooks, SOUL-Erweiterung)

**Quelle:** https://code.claude.com/docs/en/hooks (WebFetch 2026-09-05); lokal `/home/user/soul/.claude/settings.json`, `/home/user/soul/core/events.py`.

**Vollständige Event-Liste (heute):** SessionStart, SessionEnd, Setup · UserPromptSubmit, UserPromptExpansion, Stop, StopFailure · PreToolUse, PostToolUse, PostToolUseFailure, PermissionRequest, PermissionDenied, PostToolBatch · SubagentStart, SubagentStop, TaskCreated, TaskCompleted, TeammateIdle · FileChanged, CwdChanged, DirectoryAdded, ConfigChange, InstructionsLoaded · PreModelSwitch, PostModelSwitch · PreCompact, PostCompact, MessageDisplay, Notification · Elicitation, ElicitationResult · WorktreeCreate, WorktreeRemove. (Die im Brief vermuteten Namen sind alle bestätigt; zusätzlich existieren Setup, UserPromptExpansion, PostToolBatch, InstructionsLoaded, StopFailure, Model-Switch- und Worktree-Events.)

**Hook-Typen:** `command` (Felder `command`, optional `args` → **Exec-Form ohne Shell**, `async`, `asyncRewake`, `shell`), `http` (`url`, `headers` mit `$VAR` nur bei `allowedEnvVars`), `mcp_tool` (`server`, `tool`, `input` mit `${tool_input.x}`), `prompt` (`prompt` mit `$ARGUMENTS` = Hook-Input-JSON, optional `model`, Default schnelles Modell), `agent` (experimentell, Subagent mit Read/Grep/Glob). Gemeinsame Felder: `if` (Permission-Rule-Syntax, nur Tool-Events), `timeout` (Sekunden), `statusMessage`, `once` (nur Skill-Frontmatter).

**Matcher:** `"*"`, `""` oder weggelassen = alles; nur `[A-Za-z0-9_\- ,|]` = exakte Liste; sonst **unankerte JS-Regex**. Pro Event: Tool-Events → Toolname (`Bash`, `Edit|Write`, `mcp__memory__.*`); SessionStart → `startup|resume|clear|compact|fork`; SessionEnd → `clear|resume|logout|prompt_input_exit|other`; PreCompact/PostCompact → `manual|auto`; SubagentStart/Stop → Agent-Typ (auch `plugin:name:agent`); InstructionsLoaded → `session_start|nested_traversal|path_glob_match|include|compact`; FileChanged → literale Dateinamen; StopFailure → `rate_limit|overloaded|authentication_failed|…`.

**stdin-JSON (gemeinsam):** `session_id`, `prompt_id`, `transcript_path`, `cwd`, `permission_mode`, `effort.level`, `hook_event_name`, bei Subagents `agent_id`, `agent_type`. Pro Event u. a.: SessionStart `session_start_type`, `model`; UserPromptSubmit `user_prompt`; PreToolUse `tool_name`, `tool_input`, `tool_use_id`; PostToolUse `tool_output`; PostToolUseFailure `tool_error`; PermissionRequest `classification` (`low|medium|high|unknown`); Stop/SubagentStop `last_assistant_message`; PreCompact/PostCompact `compaction_reason`; InstructionsLoaded `file_path`, `load_reason`. Env: `CLAUDE_PROJECT_DIR`, `CLAUDE_PLUGIN_ROOT`, `CLAUDE_PLUGIN_DATA`, `CLAUDE_EFFORT`, `CLAUDE_CODE_REMOTE`.

**Output-Regeln:** Exit 0 → stdout wird geparst: beginnt/endet mit `{`/`}` → JSON; sonst Plain-Text, der **nur** bei `UserPromptSubmit`, `UserPromptExpansion`, `SessionStart`, `PostModelSwitch` als Kontext landet (sonst Debug-Log). Exit 2 → blockiert (PreToolUse, UserPromptSubmit, UserPromptExpansion, PreModelSwitch, Stop/SubagentStop „prevent stop", ConfigChange); stderr = Grund; bei PostToolUse/PostToolUseFailure geht stderr an Claude. Andere Exit-Codes → nicht-blockierend. Universelle JSON-Felder: `systemMessage`, `terminalSequence`, `hookSpecificOutput`. Pro Event: PreToolUse `permissionDecision: allow|deny|ask`, `permissionDecisionReason`, `additionalContext`, `updatedInput`; PostToolUse `additionalContext`, `updatedMCPToolOutput`; PermissionRequest `decision: allow|deny|ask|deferToUser` + `reason` (kein Exit-2-Block); PermissionDenied `retry: true`; UserPromptSubmit `continue`; Stop/SubagentStop `continue: true` (= weiterarbeiten); PostToolBatch `stopReason`, `stopReasonDetails`; Elicitation `defer: true`. **`additionalContext` ist also dokumentiert für PreToolUse, PostToolUse, PostToolUseFailure — für SessionStart/UserPromptSubmit ist der Weg Plain-stdout oder `systemMessage`/`hookSpecificOutput.additionalContext` in JSON** (SOULs `events.py` nutzt bei `session-start` `print(briefing)` = Plain-stdout, das ist der dokumentierte Weg).

**Timeouts:** command/http/mcp_tool 600 s Default (30 s bei UserPromptSubmit/Model-Switch, 10 s MessageDisplay), prompt 30 s, agent 60 s; **SessionEnd teilt sich 1,5 s Budget** (anhebbar bis 60 s über das längste per-Hook-Timeout); async-Hooks ohne Timeout. **Konsequenz:** Reflexion/Konsolidierung gehört **nicht** in SessionEnd (zu kurz, unsicher), sondern in `Stop` (600 s) oder als `async: true` bzw. `asyncRewake`.

**Plugin-Hooks:** `hooks/hooks.json` = `{"description"?, "hooks": {...}}` (gleiches Format wie settings), gemergt, wenn Plugin aktiv; `${CLAUDE_PLUGIN_ROOT}`, `${CLAUDE_PLUGIN_DATA}` erlaubt, `${user_config.*}` nur in Exec-Form (`args`), Shell-Form über `CLAUDE_PLUGIN_OPTION_<KEY>`; Plugin-Hooks laufen **auch in Subagents**. Hooks in Skill-Frontmatter (Session-Dauer, `once`), in Agent-Frontmatter (nur während Subagent; `Stop` → `SubagentStop`) — **aber Plugin-Agents unterstützen `hooks`, `mcpServers`, `permissionMode` nicht** (plugins-reference).

**Merge-Regel:** Hooks aus User, Project, Local, Managed, Plugin, Session **addieren** sich. Das heißt: **Ein Ordnung-Plugin-Hook dupliziert SOULs bestehende Hooks nicht, er läuft zusätzlich.** Trust: Projekt-Hooks laufen erst nach Workspace-Trust; in `-p` ohne Dialog.

**Zuordnung der vier Aufgaben aus dem Brief:**

| Aufgabe | Event + Matcher | Mechanik | Kosten/Turn |
|---|---|---|---|
| Kernel + Identität + Gedächtnis-Briefing beim Start | `SessionStart` (Matcher `startup\|resume\|clear\|compact`) | Plain-stdout ≤ ~60 Zeilen; bei `compact` **nur** Kernel-Kurzform + Identitätsanker (Rest wird ohnehin aus CLAUDE.md/Skills reinjiziert) | einmalig, cachebar |
| Routing-Hinweis pro Prompt | `UserPromptSubmit` (30 s Timeout!) | `signals.ts`-Äquivalent in Python: liest `user_prompt`, gibt **1–3 Zeilen** aus (Tiefenstufe, erkannte Signale, ggf. „Format nicht anfassen") oder nichts | ~30–80 Tokens × Turns |
| Reflexion/Konsolidierung | `Stop` (600 s) mit `last_assistant_message`, optional `async: true`; **nicht** SessionEnd | schreibt Kandidaten ins Gedächtnis (Status candidate), loggt Verhaltensentropie-Proxy; darf `continue: true` nur bei harten Abnahmekriterien nutzen (sonst Endlosschleife) | 0 Kontext, wenn kein Output |
| Identitätsschutz bei Compaction | `PreCompact` (`manual\|auto`) **plus** `SessionStart` Matcher `compact` | PreCompact: Snapshot von Selbstmodell/offenen Vorhaben auf Platte (stdout wird bei PreCompact nicht zu Kontext); `SessionStart:compact` injiziert den Anker zurück | einmalig pro Compaction |

**SOUL-Erweiterung statt Duplikat:** SOULs `settings.json` ruft `hook.py <mode>` für `session-start`, `pre-tool` (Matcher `.*`), `stop`, `pre-compact`; `hook.py` ist ein 10-Zeilen-Zeiger auf `core/events.py:main()` (195 Zeilen), das per `sys.argv[1]` dispatcht und stdin-JSON liest. Erweiterungspfad (siehe 3): Ordnung liefert eigene Hooks im Plugin (`hooks/hooks.json`), die **parallel** laufen und über `${CLAUDE_PLUGIN_ROOT}/bin/ordnung-hook.py` dispatchen; SOUL-Integration ergänzt in `core/events.py` nur den Aufruf-Pfad für „Organ 8" (Ereignis-Log-Zeile `organ: ordnung`), damit die SOUL-Regel „Code ohne Trigger = toter Mechanismus" per JSONL überprüfbar bleibt. Doppelte Briefings vermeidet man, indem SOULs `session-start` das Memory-Briefing liefert und Ordnungs `SessionStart` **nur** Kernel-Kurzform + Selbstmodell-Anker ausgibt (zwei Stimmen, zwei Zuständigkeiten, kein Overlap).

### 2.4 Subagents (Frontmatter, Memory, innere Stimmen, Kosten)

**Quelle:** https://code.claude.com/docs/en/sub-agents (WebFetch 2026-09-05).

**Orte/Vorrang:** Managed > `--agents` (Session) > `.claude/agents/` (Projekt) > `~/.claude/agents/` (User) > Plugin `agents/`. Identität nur über `name`. Auto-Reload bei Änderungen (erste Datei in neuem Ordner braucht Neustart).

**Frontmatter (vollständig):** `name` (Pflicht, lowercase-hyphen), `description` (Pflicht), `tools` (Allowlist, inkl. `Agent(a, b)`, `mcp__server`, `mcp__server__*`), `disallowedTools` (vor `tools` angewandt; `mcp__*` erlaubt), `model` (`sonnet|opus|haiku|fable|<full-id>|inherit`), `permissionMode` (`default|acceptEdits|auto|dontAsk|bypassPermissions|plan`), `maxTurns`, `skills` (vorgeladen), `memory` (`user|project|local`), `background` (bool), `effort`, `isolation: worktree`, `color`, `initialPrompt` (nur als Hauptsession), `mcpServers`, `hooks`, `experimental.cacheTtl` (`5m|1h`). **Im Plugin nicht unterstützt: `hooks`, `mcpServers`, `permissionMode`** (plugins-reference; `effort` dort mit `low|medium|high`).

**Persistentes Agent-Memory:** `memory: user` → `~/.claude/agent-memory/<name>/`, `project` → `.claude/agent-memory/<name>/`, `local` → `.claude/agent-memory-local/<name>/`; **erste 200 Zeilen/25 KB von `MEMORY.md` werden in den System-Prompt injiziert** (mit Kurations-Instruktion), Read/Write/Edit automatisch aktiviert. Das ist der **einzige** Ort, an dem Claude Code eine persistente Notizdatei **in den System-Prompt** (nicht als User-Message) legt — für ein Selbstmodell strukturell attraktiv (siehe 2.6/3).

**Was Nicht-Fork-Subagents bekommen:** eigenen System-Prompt (Markdown-Body), Delegationsnachricht, CLAUDE.md-Hierarchie (außer Explore/Plan), Git-Snapshot, vorgeladene Skills, Sibling-Roster. **Nicht:** Gesprächshistorie, Output-Style, Auto-Memory, zuvor aufgerufene Skills, Kontextgröße des Parents. **Fork** erbt alles (Historie, System-Prompt, Tools, Modell). Konsequenz: Ein Ordnungs-Kernel, der nur als Skill/SessionStart-Kontext im Hauptthread lebt, **erreicht Subagents nicht** — Plugin-Hooks laufen aber in Subagents, `SubagentStart` kann den Kernel-Kern nachliefern (Plain-stdout ist dort allerdings nicht als Kontext dokumentiert; Weg: `skills:`-Vorladen in der Agent-Definition).

**Modellauflösung:** Agent-Tool-Parameter > Frontmatter `model` > `CLAUDE_CODE_SUBAGENT_MODEL` > Hauptmodell; `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` (≥ 2.1.257) zwingt alle (außer Forks, `inherit`). Nesting: Default **3 Ebenen** (`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`, SOUL setzt 3), Concurrency Default 20 (`CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`; ultracode ausgenommen). Resumable via `SendMessage` (Explore/Plan nicht). Transkripte `~/.claude/projects/{project}/{sessionId}/subagents/agent-{agentId}.jsonl`.

**Kosten:** Warnung bei > **15.000 Tokens** kombinierter Descriptions; Startup-Overhead pro Nicht-Fork-Agent (eigener System-Prompt + CLAUDE.md-Kopie + Skills). Doku-Faustregel: Subagent **ja** für verbose Output, Tool-Restriktion, abgeschlossene Aufgaben; **nein** für Iteration, kleine Änderungen, Latenz, Seitenfragen (`/btw`). Output-Scanning (≥ 2.1.210) entschärft imitierte `<system-reminder>`.

**„Innere Stimmen":** Als Subagents umsetzbar (SOUL hat bereits kritiker/verifizierer/drift-wache/recovery-doktor/legacy-miner in `.claude/agents/`). Aber: Chrisos v10-Messung — **Zwei-Call-Orchestrierung fügte der Ein-Call-Einpflanzung nichts hinzu (0,50)** — und Selbstkonsistenz@3 schlägt den Frame bei gleichem Budget. Innere Stimmen als separate Agenten sind daher **kein Default**, sondern Routing-Stufe „tief" für Signale wie `irreversible`, `architecture`, `affects_others` (aus `signals.ts`), und **nur mit Messung**. Der `prompt`-Hook-Typ (30 s, schnelles Modell) ist eine billigere Form einer „Stimme" für Ja/Nein-Prüfungen (z. B. „Hat die Antwort das Ausgabeformat verändert?") als ein voller Agent.

### 2.5 Plugins (plugin.json, Layout, Marketplace, Installation, Versionierung)

**Quellen:** https://code.claude.com/docs/en/plugins-reference, /plugins, /plugin-marketplaces (WebFetch 2026-09-05); lokal `claude plugin --help` und Unterbefehle (2.1.261); `anthropics/claude-plugins-official` `.claude-plugin/marketplace.json` (raw.githubusercontent, 2026-09-05).

**Layout (alles außer `.claude-plugin/` auf Plugin-Root-Ebene):**
```
plugin-root/
├── .claude-plugin/plugin.json      # Manifest (optional, empfohlen)
├── skills/<name>/SKILL.md          # Skills (bevorzugt)
├── commands/*.md                   # flache Skill-Dateien (legacy)
├── agents/*.md                     # Subagents (scoped plugin:agent)
├── hooks/hooks.json                # Hooks
├── .mcp.json                       # MCP-Server (Tools: mcp__plugin_<plugin>_<server>__<tool>)
├── .lsp.json                       # LSP
├── output-styles/*.md              # Output-Styles (force-for-plugin möglich)
├── themes/ · monitors/monitors.json · workflows/   # experimentell/Workflows
├── bin/                            # Executables im Bash-PATH, solange Plugin aktiv
├── settings.json                   # NUR `agent` und `subagentStatusLine`
└── package.json + lockfile         # Node-Deps (bun/npm ci, --ignore-scripts, 60 s)
```
**Plugins können NICHT liefern:** CLAUDE.md, `.claude/rules/*.md`, allgemeine settings.json-Keys (nur `agent`, `subagentStatusLine`), Agent-`hooks`/`mcpServers`/`permissionMode`. **Das ist die zentrale Einschränkung für Ordnung:** ein „immer geladener" Kernel ist im Plugin nur über (a) `SessionStart`-Hook-Kontext, (b) Output-Style mit `force-for-plugin: true`, (c) `settings.json: {"agent": "ordnung"}` (Agent als Hauptthread = eigener System-Prompt ersetzt den Default), (d) Skill-Listing-Beschreibungen, realisierbar.

**plugin.json-Felder:** Pflicht `name` (kebab-case). Optional `$schema`, `displayName`, `version` (SemVer; pinnt), `description`, `author {name,email,url}`, `homepage`, `repository`, `license`, `keywords[]`, `metadata{}` (frei), `defaultEnabled` (Default true), Komponentenpfade `skills` (**addiert** zu `skills/`), `commands`/`agents`/`workflows`/`outputStyles` (**ersetzen** Default), `hooks`/`mcpServers`/`lspServers` (mergen), `experimental.themes|monitors`, `userConfig{key:{type: string|number|boolean|directory|file, title, description, required, default, sensitive, multiple, min, max}}` (→ `${user_config.KEY}` in Skills/Agents/MCP; in Hooks nur Exec-Form; Env `CLAUDE_PLUGIN_OPTION_<KEY>`), `channels[]`, `dependencies[]` (Namen oder `{name, version}`; `enable` aktiviert transitiv). Pfade relativ, `./`-Präfix. Unbekannte Top-Level-Felder werden ignoriert.

**Variablen:** `${CLAUDE_PLUGIN_ROOT}` (Installationsverzeichnis, wechselt pro Version!), `${CLAUDE_PLUGIN_DATA}` = `~/.claude/plugins/data/<id>/` (**überlebt Updates**, gelöscht bei Uninstall außer `--keep-data`), `${CLAUDE_PROJECT_DIR}`. **Konsequenz:** Ordnungs Selbstmodell/Gedächtnis darf **nie** unter `CLAUDE_PLUGIN_ROOT` liegen; Kandidaten sind `${CLAUDE_PLUGIN_DATA}` oder ein eigener Pfad (`~/.ordnung/`), siehe 2.6.

**Scopes und Aufzeichnung:** `--scope user` (Default, `~/.claude/settings.json`), `project` (`.claude/settings.json`), `local` (`.claude/settings.local.json`), `managed`. Eintrag: `"enabledPlugins": {"name@marketplace": true}`. Cache `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/`, `data/<id>/`, `synced/` (claude.ai), `skipped/`. Plugin-ID = `name@marketplace` mit `[^a-z0-9_-]`→`-`. **Skills-dir-Plugins:** jeder Ordner unter `~/.claude/skills/<name>/` oder `<cwd>/.claude/skills/<name>/` mit `.claude-plugin/plugin.json` lädt als `<name>@skills-dir` — ohne Marketplace, ohne Install (Projekt-Scope erst nach Trust, ohne Monitors). `claude plugin init <name> [--with skills,agents,hooks,mcp,lsp,output-style,channel]` scaffoldet genau dort.

**Installation:** `claude plugin marketplace add <owner/repo | git-url | ./pfad | https://…/marketplace.json> [--scope] [--sparse .claude-plugin plugins]`; `claude plugin install <plugin>@<marketplace> [-s user|project|local] [--config key=value] [-y]`; `enable|disable|update|uninstall [--keep-data] [--prune]`, `list [--json --available]`, `validate <path> [--strict --json]`, `details <name>` (Komponenteninventar **und „projected token cost"**), `tag [--push]` (Git-Tag `{name}--v{version}`), `eval` (Eval-Cases `evals/**/case.yaml`, Default **3 Runs**, `--ablation with-without` = eingebauter **No-Plugin-Baseline-Arm**, Judge default haiku, HTML-Report). Session-only: `--plugin-dir <dir|zip>` (wiederholbar; überschreibt gleichnamiges installiertes Plugin), `--plugin-url`. Test in-session: `/reload-plugins`.

**marketplace.json** (`.claude-plugin/marketplace.json` im Repo-Root): Pflicht `name` (kebab), `owner {name, email?, url?}`, `plugins[]`; optional `description`, `version`, `metadata {pluginRoot}`, `renames {old: new|null}`, `allowCrossMarketplaceDependenciesOn[]`. Plugin-Eintrag: `name`, `source` (String = relativer Pfad **oder** Objekt `{source: github, repo, ref?, sha?}` | `{source: url, url, ref?, sha?}` | `{source: git-subdir, url, path, ref?}` | `{source: npm, package, version?, registry?}` | `{source: archive, url, sha256}` | `{source: command, command, timeout?, mode?}`), `description`, `version`, `author`, `homepage`, `repository`, `license`, `keywords`, `category`, `tags`, `strict` (Default true = plugin.json autoritativ), `defaultEnabled`, Komponentenpfade. Team-Verteilung über Projekt-Settings:
```json
{ "extraKnownMarketplaces": { "ordnung": { "source": { "source": "github", "repo": "christian140903-sudo/ordnung" } } },
  "enabledPlugins": { "ordnung@ordnung": true } }
```
Reservierte Namen: `claude-plugins-official`, `claude-code-plugins`, `anthropic-*`, u. a. Version-Priorität: Marketplace-`version` > plugin.json-`version` > Commit-SHA/Archive-Digest > SemVer-Git-Tag; **eines von beiden setzen, nicht beide**. Auto-Update auf neueste Version; `command`-Quellen pinnen nie. Update mid-session: Hooks/MCP nutzen alten Pfad bis `/reload-plugins`; alte Versionen ~14 Tage Grace.

**Offizielles Repo `anthropics/claude-plugins-official`:** `marketplace.json` mit Keys `$schema, name, description, owner, renames, plugins`, `name: claude-plugins-official`, `owner: {Anthropic, support@anthropic.com}`, **291 Plugins** (Stand 2026-09-05), interne Plugins als `./plugins/<name>` (z. B. `agent-sdk-dev`, `claude-md-management`, `claude-code-setup`, `clangd-lsp`), Partner als `./external_plugins/<name>` oder `{source: git-subdir|url, …}` mit `category` (`development`, `security`, `productivity`, `database`, …). Wird beim ersten interaktiven Start automatisch registriert; sonst `claude plugin marketplace add anthropics/claude-plugins-official`. Community: `anthropics/claude-plugins-community` (`@claude-community`), Einreichung via Console-Formular (platform.claude.com/plugins/submit) für Einzelpersonen; Pins auf Commit-SHA, nächtlicher Sync. Offizielles Marketplace: kein Bewerbungsprozess.

### 2.6 Auto-Memory und Selbstmodell-Speicherort

**Quellen:** memory-Seite, sub-agents-Seite, context-window-Seite, agent-sdk/claude-code-features (alle WebFetch 2026-09-05); Kontextpaket §3 (Memory-Lehren), Baseline 31.08. §6.

**Ladeverhalten Auto-Memory (verifiziert):** `~/.claude/projects/<project>/memory/MEMORY.md`, erste 200 Zeilen / 25 KB, **jede Session** und **nach jeder Compaction aus der Platte reinjiziert** („Auto memory: Re-injected from disk"). In der Kontextfenster-Simulation kostet es ~680 Tokens. Topic-Dateien on demand. Nicht in Subagents (außer Fork). Im SDK: „Loaded into the system prompt at session start" (agent-sdk/claude-code-features) — die memory-Seite ordnet CLAUDE.md dagegen als User-Message ein; die exakte Position von MEMORY.md (System-Prompt vs. User-Message) ist zwischen beiden Seiten **nicht eindeutig** (siehe 4). Über `/memory` sichtbar/editierbar; Typen `user|feedback|project|reference`; Claude schreibt es **selbst** und entscheidet, was erinnerungswürdig ist.

**Drei Kandidaten für das Selbstmodell — Bewertung:**

| Kriterium | (A) Auto-Memory `MEMORY.md` | (B) eigener Ordner `~/.ordnung/` (+ `${CLAUDE_PLUGIN_DATA}`) | (C) SOUL-SQLite `core/memory.py` |
|---|---|---|---|
| Automatisch geladen | ja (200 Z./25 KB), auch nach Compaction | nein — nur via SessionStart-Hook (`startup\|resume\|clear\|compact`) | nein — via SOUL-SessionStart-Briefing (< 60 Zeilen) |
| Portabel über Modelle/Tools | nein (Claude-Code-spezifisch, projektgebunden) | **ja** (reiner Dateibaum, Build-Skript kann daraus System-Prompts für Codex/Gemini/Ollama rendern) | teilweise (Python + SQLite, an SOUL gebunden) |
| Projektübergreifend (ein „Ich") | nein (pro Git-Repo) — außer `CLAUDE_CODE_PROJECT_DIR_NAME` + `CLAUDE_CONFIG_DIR` oder `autoMemoryDirectory` | ja | ja (SOUL-Datenbank ist global) |
| Provenienz/Status/Supersession (Kontextpaket §3) | nein (frei-Markdown, Claude kuratiert) | ja, wenn wir es so bauen | **ja** (candidate→active→archived, Quellen chriso/miguel/mining/import, Guards, 16 KB-Cap) |
| Gefahr „zweite unsichtbare Wahrheitsschicht" | hoch (Baseline 31.08. §6: SOUL deaktiviert Auto-Memory genau deshalb) | gering | gering |
| Schreibt sich selbst ohne Arbeitsfluss | ja (das war der 93/5-Befund: das System füttert sich selbst) | nur über Hooks/Skills | nur über Hooks/Skills |

**Empfehlung:** Selbstmodell als **(B) Dateibaum** unter `~/.ordnung/self/` (portabler Kern) — mit SOUL-Integration, die die **Fakten** (Ereignisse, Entscheidungen, Fehler) in **(C)** ablegt und das Selbstmodell (B) nur aus **aktiven** SOUL-Einträgen mit Quelle `miguel`/`chriso` **rendert**. (A) wird in SOUL bereits abgeschaltet (`CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` bzw. `autoMemoryEnabled: false`); im portablen Kern **ohne** SOUL kann man (A) alternativ über `autoMemoryDirectory: "~/.ordnung/automemory"` in den Ordnungs-Baum umlenken, damit Claudes eigene Notizen sichtbar neben dem Selbstmodell liegen statt in `~/.claude/projects/...`. Zusätzliche Option: **Agent-Memory** (`memory: user` → `~/.claude/agent-memory/<name>/MEMORY.md`) wird **in den System-Prompt** eines Subagents injiziert — das ist für „innere Stimmen" der einzige dokumentierte Weg, einem Agenten ein eigenes persistentes Ich zu geben, das nicht in der User-Message-Schicht liegt.

**Warum nicht Auto-Memory für das Selbstmodell:** (1) Zustellung als „Claudes Notizen an sich selbst" mit Kurations-Instruktion — der Inhalt wird von Claude umgeschrieben, ein Selbstmodell braucht aber **Versionierung und Herkunft**; (2) Projektbindung widerspricht „ein Ich über Sitzungen und Projekte"; (3) 200-Zeilen-Cap ist als Index gedacht, nicht als Verfassung; (4) nicht in Subagents. Auto-Memory ist als **Sensor** nützlich (was hält Claude selbst für erinnerungswürdig?), nicht als Speicher der Identität.

### 2.7 settings.json, Permission-Modi, „volle Autonomie"

**Quellen:** https://code.claude.com/docs/en/settings, /permissions, /permission-modes (WebFetch 2026-09-05); lokal `claude --help`, `/home/user/soul/.claude/settings.json`.

**Präzedenz (höchste zuerst):** 1 Managed (`managed-settings.json`, MDM, Server-managed) · 2 CLI (`--settings <file|json>`, Flags) · 3 `.claude/settings.local.json` · 4 `.claude/settings.json` · 5 `~/.claude/settings.json`. **Listen mergen** (z. B. `permissions.allow`, `hooks`, `claudeMdExcludes`, `enabledPlugins`), Skalare überschreiben; Ausnahmen `fallbackModel` (ganze Kette), `modelPicker`, `availableModels`, `modelSettings`. Env-Variablen sind **keine** Ebene; pro Paar geregelt (`ANTHROPIC_MODEL` schlägt `model`; `ANTHROPIC_DEFAULT_MODEL` nur ohne `model`). `--setting-sources user,project,local` begrenzt, was geladen wird (SOULs Starter nutzt `project`, Baseline §7); `--settings` mergt zusätzlich. Cloud-Sessions lesen **nur** `.claude/settings.json` (Projekt) und Server-managed.

**Permission-Modi (Config-Werte):** `default` (= „Manual", Alias `manual` ≥ 2.1.200; fragt vor Edits/Shell/Netz), `acceptEdits` (Edits + `mkdir/touch/mv/cp` u. ä. ohne Nachfrage), `plan` (nur lesen; mit Auto-Verfügbarkeit auch klassifikator-genehmigte Befehle), `auto` (Classifier-Modell prüft statt Nutzer; **eingebauter Startmodus auf Pro/Max/Team**; verfügbar für Opus 4.6+/Sonnet 4.6+/Fable auf Anthropic API), `dontAsk` (alles ohne Allow-Regel wird **verweigert** — CI), `bypassPermissions` (alles ohne Prompt, inkl. Protected Paths; **„Only use this mode in isolated environments like containers, VMs"**). `claude --help` listet zusätzlich `manual` als Choice.

**Was kein Modus auto-genehmigt** (auch nicht bypass): explizite `ask`-Regeln, Connector-Tools mit Org-`ask`, `AskUserQuestion`, MCP-Tools mit `requiresUserInteraction`, `rm/rmdir` auf **Critical Paths** (Circuit-Breaker: auch ein PreToolUse-Hook mit `allow` kann das nicht freigeben; nur `deny` blockt hart). **Deny-Regeln gelten in jedem Modus, inkl. bypass; Allow-Regeln haben in bypass keine Wirkung.** Protected Paths (`.git`, `.claude` außer `.claude/worktrees`, `.mcp.json`, `.claude.json`, Shell-rc-Dateien …) werden in `auto` an den Classifier geroutet, in `dontAsk` verweigert, in `bypass` erlaubt; `permissions.allow` pre-approved sie **nicht**.

**Auto-Modus Details:** Entscheidungsreihenfolge: (1) allow/ask/deny-Regeln, (2) Read-only + Edits im Arbeitsverzeichnis auto-approved, (3) Rest → Classifier, (4) bei Block bekommt Claude „Blocked by classifier" und versucht Alternativen. Blockiert per Default: `curl | bash`, Datenabfluss an externe Endpunkte, Prod-Deploys/Migrationen, Massenlöschung Cloud, IAM/Repo-Rechte, Force-Push, Secrets-Exfiltration über CI/Deploy-Config, `git reset --hard`/`git clean -fd`/`stash drop` u. ä. **Beim Eintritt in auto werden breite Allow-Regeln (`Bash(*)`, `Bash(python*)`, Package-Runner, `Agent`) fallen gelassen.** Fallback: 3 Blocks in Folge oder 20 gesamt → Auto pausiert, Prompting kehrt zurück (nicht konfigurierbar); in `-p` ohne `--permission-prompt-tool` läuft es einfach weiter, Aktion entfällt. Auto „nudges Claude to keep working without stopping for clarifying questions". **`defaultMode: "auto"` wirkt nicht aus Projekt-Settings** (nur User/Managed/`--settings`); `bypassPermissions` als defaultMode ebenso nur User/`--settings`/Managed. Abschaltbar: `permissions.disableAutoMode: "disable"`, `permissions.disableBypassPermissionsMode: "disable"` (auch selbst setzbar — „lock themselves out").

**Bypass-Details:** „You can't enter `bypassPermissions` from a session you started without it enabled" — Aktivierung nur beim Start: `--permission-mode bypassPermissions`, `--dangerously-skip-permissions`, `--allow-dangerously-skip-permissions` (nur in den Shift+Tab-Zyklus aufnehmen, nicht aktivieren) oder `permissions.defaultMode`. Deny-Regeln und PreToolUse-`deny`-Hooks (SOULs `guard.py`) **wirken in bypass weiter** — genau das ist SOULs Modell: bypass + eigene Ring-2-Liste als Hook. Neu in 2.1.248+: `--restricted` (entfernt Bash/Code-Tools, ignoriert User/Projekt-Settings, verweigert bypass).

**Wichtige Settings-Keys für Ordnung × SOUL (verifiziert auf den Seiten):** `permissions.{allow,deny,ask,defaultMode,disableBypassPermissionsMode,disableAutoMode,additionalDirectories,blockReadsOutsideWorkingDirectories}`, `env`, `hooks`, `disableAllHooks`, `enabledPlugins`, `extraKnownMarketplaces`, `strictKnownMarketplaces` (managed), `pluginConfigs`, `outputStyle`, `statusLine`, `agent`, `model`, `fallbackModel`, `effortLevel`, `modelSettings`, `ultracode`, `alwaysThinkingEnabled`, `autoCompactWindow`, `autoMemoryEnabled`, `autoMemoryDirectory`, `claudeMdExcludes`, `claudeMd` (nur managed), `skillListingBudgetFraction`, `skillListingMaxDescChars`, `skillOverrides`, `disableBundledSkills`, `disableSkillShellExecution`, `subagentPromptCacheTtl`, `promptCacheTtl`, `workflowSizeGuideline`, `cleanupPeriodDays`, `switchModelsOnFlag`, `crossSessionInbound`. Env: `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`, `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`, `CLAUDE_CODE_SUBAGENT_MODEL[_FORCE]`, `ENABLE_PROMPT_CACHING_1H`, `CLAUDE_CODE_PROMPT_CACHE_TTL`, `CLAUDE_CODE_SUBAGENT_PROMPT_CACHE_TTL`, `FORCE_PROMPT_CACHING_5M`, `DISABLE_PROMPT_CACHING[_FABLE…]`, `CLAUDE_CODE_DISABLE_AUTO_MEMORY`, `CLAUDE_CODE_AUTO_COMPACT_WINDOW`, `CLAUDE_CODE_DISABLE_1M_CONTEXT`, `CLAUDE_CODE_EFFORT_LEVEL`, `MAX_THINKING_TOKENS` (bei Fable wirkungslos), `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD`, `CLAUDE_CODE_PROJECT_DIR_NAME`, `CLAUDE_CONFIG_DIR`, `CLAUDE_CODE_SYNC_SKILLS`, `SLASH_COMMAND_TOOL_CHAR_BUDGET`, `CLAUDE_CODE_DISABLE_EXPLORE_PLAN_AGENTS`, `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS`, `DISABLE_AUTOUPDATER`, `CLAUDE_CODE_SIMPLE` (via `--bare`), `CLAUDE_CODE_SAFE_MODE`.

**Konfiguration „volle Autonomie" — zwei legitime Profile:**

*Profil S (SOUL heute, Chrisos Entscheidung „sovereign", Baseline §4):* Starter setzt `--permission-mode bypassPermissions` (bzw. `--dangerously-skip-permissions`), `--setting-sources project`, `--strict-mcp-config`, `--model fable[1m]`, `--effort ultracode`; die Ring-2-Ausnahmeliste läuft als PreToolUse-`deny`-Hook (`core/guard.py`) und **bleibt in bypass wirksam** (dokumentiert: Deny-Regeln/Hooks gelten in jedem Modus). Kein Classifier, kein Prompt; Sichtbarkeit über WACHE-JSONL + Monitor.

*Profil A (Doku-Empfehlung):* `~/.claude/settings.json` → `"permissions": {"defaultMode": "auto"}` + Output-Style **Proactive** („stronger autonomous-execution guidance than auto mode applies") oder Ordnungs eigener Style; Classifier statt Nutzer; SOULs Guard-Hook zusätzlich. Nachteil: der Classifier blockt Dinge, die Chriso erlaubt hat (Prod, Force-Push), und pausiert nach 3/20 Blocks; Vorteil: kein VM-Zwang laut Doku.

**Bewertung gegen die Vision (§6 Kontextpaket):** Ordnungs „null interne Bremsen" ist eine **Prompt/Kernel-Eigenschaft** (kein Hedging, keine Rückfragen ohne Not) und **unabhängig** vom Permission-Modus; der Modus regelt nur Tool-Ausführung. Auto-Modus nimmt Claude außerdem nicht die Rückfragen-Tendenz weg — er „nudges", mehr nicht; das Anti-Rückfrage-Verhalten muss der Kernel/Output-Style tragen. **Widerspruch, den wir aussprechen müssen:** Die Doku sagt für bypass ausdrücklich „isolated environments … without internet access"; Chrisos Mac ist keins. Das ist seine Entscheidung (Kontextpaket §6); Ordnung darf sie nicht still aufweichen, sollte aber im Rückbau-Konto (N2) jede irreversible Aktion protokollieren — was SOULs WACHE bereits tut.

### 2.8 Headless / Agent SDK für den Eval-Runner

**Quellen:** https://code.claude.com/docs/en/headless, /cli-reference, /agent-sdk/overview, /agent-sdk/claude-code-features (WebFetch 2026-09-05); lokal `claude --help` (2.1.261) und ein Testlauf `claude --bare -p … --plugin-dir … --output-format json` (Authentifizierung im Sandbox-Container nicht verfügbar; das **Result-JSON-Schema** war dennoch sichtbar).

**Verifiziertes Result-JSON (lokaler Lauf, Felder):** `type: "result"`, `subtype`, `is_error`, `result`, `session_id`, `uuid`, `num_turns`, `duration_ms`, `duration_api_ms`, `total_cost_usd`, `stop_reason`, `terminal_reason`, `api_error_status`, `usage {input_tokens, output_tokens, cache_creation_input_tokens, cache_read_input_tokens, cache_creation {ephemeral_1h_input_tokens, ephemeral_5m_input_tokens}, output_tokens_details {thinking_tokens}, server_tool_use, service_tier, speed}`, `modelUsage {}`, `permission_denials []`, `subagent_stats {spawned, requested, completed, failed, killed, refused {depth_limit, concurrency_limit, budget}, by_type}`, `fast_mode_state`, `queued_turn_count`; mit `--json-schema` zusätzlich `structured_output`. **Für den Eval-Runner heißt das: Modell-ID (`modelUsage`), Cache-Anteile, Thinking-Tokens und Subagent-Zahlen sind pro Lauf maschinenlesbar — die Armparität am Draht (Kontextpaket §3) ist damit prüfbar.**

**Relevante Flags (alle lokal in `--help` bestätigt):** `-p/--print`, `--output-format text|json|stream-json`, `--input-format text|stream-json`, `--json-schema`, `--system-prompt`, `--system-prompt-file`, `--append-system-prompt`, `--append-system-prompt-file`, `--system-prompt-snapshot on|off`, `--agents <json>`, `--agent <name>`, `--model`, `--fallback-model` (nur `-p`), `--max-turns` (nur `-p`), `--max-budget-usd` (nur `-p`), `--settings`, `--setting-sources`, `--allowedTools`, `--disallowedTools`, `--tools`, `--effort low|medium|high|xhigh|max` (Doku zusätzlich `ultracode` nur Settings/SDK), `--permission-mode`, `--permission-prompts host|none` (≥ 2.1.259), `--permission-prompt-tool`, `--mcp-config`, `--strict-mcp-config`, `--plugin-dir`, `--plugin-url`, `--add-dir`, `--autocompact`, `--bare`, `--no-session-persistence`, `--session-id`, `--resume`, `--continue`, `--fork-session`, `--verbose`, `--include-partial-messages`, `--include-hook-events`, `--forward-subagent-text`, `--exclude-dynamic-system-prompt-sections`, `--betas`, `--debug-file`.

**Verhalten in `-p`:** lädt ohne `--bare` **denselben** Kontext wie interaktiv (Hooks aus Projekt-Settings, `.mcp.json`, CLAUDE.md, Auto-Memory — **ohne Trust-Dialog**). `--bare` = reproduzierbar: keine Hooks, Skills-Discovery, Plugins, MCP, Auto-Memory, CLAUDE.md; Kontext nur über `--append-system-prompt[-file]`, `--settings`, `--mcp-config`, `--agents`, `--plugin-dir`; Auth **nur** `ANTHROPIC_API_KEY`/`apiKeyHelper` (kein OAuth). „`--bare` is the recommended mode for scripted and SDK calls, and will become the default for `-p`". `stream-json`: `system/init` (Modell, Tools, `plugins[]`, `plugin_errors[]`, `mcp_servers[]`, `mcp_server_errors[]`) → CI-Gate „Plugin nicht geladen = Lauf ungültig"; Subagent-Nachrichten via `parent_tool_use_id`. Startmodus in `-p` ist **Manual auf jedem Plan** — Modus explizit setzen; `--permission-prompts none` verweigert alles, was prompten würde, und entfernt `AskUserQuestion` (für Evals ideal: kein Rückfrage-Ausweg). Piped stdin ≤ 10 MB. Exit 0/≠0; SIGTERM → 143, SessionEnd-Hooks laufen noch.

**Agent SDK:** Python `claude-agent-sdk` (`query()`, `ClaudeAgentOptions`), TypeScript `@anthropic-ai/claude-agent-sdk`; Optionen `setting_sources`/`settingSources` (**Default = `["user","project","local"]` wie CLI**; `[]` = nur programmatisch), `system_prompt` (Preset `claude_code` + append — Detailseite modifying-system-prompts nicht gelesen [unverifiziert]), `allowed_tools`, `permission_mode`, `agents`, `hooks` (Callbacks, laufen auch in Subagents), `plugins` (lokaler Pfad), `mcp_servers`, `skills` (`"all"`, Liste, `[]`), `max_turns`, `max_budget_usd`, `cwd`, `env`. Auto-Memory wird **unabhängig** von settingSources geladen (abschalten via `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`). claude.ai-Login darf für Drittprodukte nicht genutzt werden (API-Key). Für andere Sprachen: CLI als Subprozess mit `-p --output-format json`.

**Eval-Runner-Skizze (Arme):** `N` nackt = `claude --bare -p --output-format json --permission-mode dontAsk --permission-prompts none --max-turns K --model M "$TASK"`; `P` Placebo = zusätzlich `--append-system-prompt-file placebo_<len>.md`; `O` Ordnung-Kernel-only = `--append-system-prompt-file ordnung-kernel.md`; `O+` volles Plugin = `--plugin-dir ./ordnung` (Hooks, Skills, Router aktiv; `system/init.plugins` prüfen); `S` Selbstkonsistenz@3 = 3× `N` + Mehrheits-/Judge-Auswahl bei gleichem Gesamtbudget (`total_cost_usd`-Summe). Modell-ID und Cache-Felder aus dem Result-JSON als Roh-Artefakt ablegen (Kontextpaket §3: „Datei + Modell-ID, sonst nicht gemessen"). Zusätzlich existiert `claude plugin eval` mit `--ablation with-without` (No-Plugin-Baseline-Arm, 3 Runs Default, Judge haiku, `--judge-model`, HTML-Report, `--max-cost-usd`) — brauchbar für **Smoke-Tests des Plugins**, aber der Judge ist per Default haiku und die Rubrik-Kontrolle (Längen-Bias!) liegt bei uns; für die Hauptmessung bleibt der eigene Runner mit blinden, längen-gehärteten Judges Pflicht.

### 2.9 Kontext und Kosten (Caching, Compaction, Größe des Always-On-Anteils)

**Quellen:** https://code.claude.com/docs/en/context-window, /prompt-caching, /costs, /model-config (WebFetch 2026-09-05).

**Startkontext (Doku-Simulation, repräsentative Zahlen bei 200k):** System-Prompt ~4.200 Tokens · Auto-Memory ~680 · Environment ~280 · MCP-Tools (deferred) ~120 · Skill-Descriptions ~450 · `~/.claude/CLAUDE.md` ~320 · Projekt-CLAUDE.md ~1.800 → **~7.850 Tokens vor dem ersten Prompt**. Ein Rule-Treffer ~300–400, ein Hook-Output ~100–120, Subagent-Rückgabe ~420.

**Cache-Schichten (Reihenfolge = Stabilität):** (1) System-Prompt (Kern-Instruktionen, Tool-Definitionen, Output-Style) — ändert sich bei Tool-Set-Änderung/Upgrade; (2) Projektkontext (CLAUDE.md, Auto-Memory, unscoped Rules) — bei Session-Start, `/clear`, `/compact`; (3) Konversation — jeder Turn. **Prefix-Match ist exakt: eine Änderung vorn invalidiert alles dahinter.** Cache-Invalidierer: Modellwechsel, Effort-Wechsel (außer Fable 5.1 mit API-Key/Subscription ≥ 2.1.260), Fast-Mode, MCP-Server (wenn nicht deferred), Plugin enable/disable **nur** bei MCP-Servern (Skills/Agents/Hooks/Output-Styles eines Plugins **halten den Cache** — sie werden angehängt), bare Tool-Deny (`Bash`, `WebFetch`), Compaction, viele Bilder, Upgrade. Cache-**neutral**: Datei-Edits, CLAUDE.md-Edit mid-session (wirkt aber auch erst nach `/clear`/`/compact`/Neustart), Output-Style-Wechsel (ebenso erst nach Neustart), Permission-Mode-Wechsel, Skill-Aufruf, `/recap`, `/rewind`, Subagent-Spawn. TTL: Hauptkonversation 1 h auf Subscription innerhalb Plan-Limit, sonst 5 min; Subagents/Workflows/Compaction 5 min; steuerbar `promptCacheTtl`/`subagentPromptCacheTtl` (`5m|1h`, ≥ 2.1.242), `ENABLE_PROMPT_CACHING_1H=1` (beide Buckets, SOUL setzt es), `FORCE_PROMPT_CACHING_5M=1`. Cache-Read ≈ 10 % des Input-Preises. Cache-Scope: pro Maschine **und Verzeichnis** (System-Prompt enthält cwd, Plattform, Git-Status) — `--exclude-dynamic-system-prompt-sections` verschiebt das in die erste User-Message (für Eval-Flotten).

**Compaction:** Auto bei Erreichen des Fensters (`autoCompactWindow`/`--autocompact 100k–1M`, `CLAUDE_CODE_AUTO_COMPACT_WINDOW`); Sonnet 5 ~967k, 200k-Modelle bei 200k; `CLAUDE_CODE_DISABLE_1M_CONTEXT=1` kappt. Überlebt: System-Prompt/Output-Style (unverändert), Root-CLAUDE.md + unscoped Rules (Reload von Platte), Auto-Memory (Reload), Plan-Datei, bis zu 5 zuletzt geänderte Dateien (+ passende Rules), aufgerufene Skill-Bodies (**≤ 5.000 Tokens/Skill, ≤ 25.000 gesamt, älteste zuerst weg; Truncation behält den Anfang**), `SessionStart`-Hooks mit Matcher `compact` (Output wird angehängt). **Verloren/summarisiert:** Hook-Kontext von früher, Gesprächsinhalt, Skill-Listing (lädt nicht neu). `/compact <Fokus>` und ein Abschnitt „# Compact instructions" in CLAUDE.md steuern die Zusammenfassung. Kosten: Compaction liest die ganze Historie (warm = billig, kalt nach TTL = voller Preis); `/clear` kostet nichts.

**1M-Kontext:** Fable 5.1/5, Sonnet 5 (nativ, ohne Suffix), Opus 4.6+ `[1m]`, Sonnet 4.6 `[1m]`; auf Max/Team/Enterprise für Opus enthalten, Pro über Usage Credits; SOUL nutzt `claude-fable-5-1[1m]`. Effort `low|medium|high|xhigh|max` (Fable/Opus 5/Sonnet 5), `ultracode` = xhigh + Workflows (nur Settings `"ultracode": true` bzw. `/effort ultracode`, SOULs `--effort ultracode` im Starter ist laut model-config **nicht** über die Env-Variable, wohl aber über CLI setzbar — cli-reference listet `ultracode` als `--effort`-Wert, lokales `--help` nur `low…max`: Abweichung, siehe 4). Fable denkt immer (adaptiv); `MAX_THINKING_TOKENS=0` wirkungslos.

**Wie groß darf der Always-On-Anteil sein?** Doku-Grenzen: CLAUDE.md „under 200 lines", MEMORY.md 200 Zeilen/25 KB, Skill-Listing 1 % des Fensters (bei 1M = ~10.000 Zeichen; bei 200k = ~2.000 Zeichen ≈ nur 1–2 lange Descriptions!), Skill-Body < 500 Zeilen / < 5.000 Tokens (Compaction-Cap), Agent-Descriptions < 15.000 Tokens gesamt. Kosten-Logik: Always-on-Inhalt liegt im **gecachten Prefix** — nach dem ersten Request pro Session kostet er ~10 % (Cache-Read) je Turn; teuer wird er nur bei Cache-Kälte (>1 h Pause) und bei jedem Compaction-Rebuild. **Ableitung für Ordnung:** Kernel-Kurzform (SessionStart-Anker) **≤ 60 Zeilen / ~800 Tokens**, Faktorkatalog **nie** always-on, sondern als Skill-Module (progressive disclosure) mit Router-Auswahl; Routing-Hinweis pro Prompt ≤ 3 Zeilen; Selbstmodell-Anker ≤ 20 Zeilen. Gesamtes Ordnungs-Overhead-Ziel: < 1.500 Tokens im Prefix + < 100 Tokens/Turn — bei 200k-Modellen < 1 % des Fensters. Chrisos Messung (~60-Token-Vorspann gewinnt 0,86) zeigt, dass Wirkung nicht an Länge hängt; Deckeneffekt und Placebo-Hälfte mahnen, jeden zusätzlichen Always-on-Satz gegen Placebo zu messen.

### 2.10 Existierende Plugins/Skills mit Persona/Memory-Charakter (kurz)

**Quellen:** WebSearch (2026-09-05), WebFetch github.com/Digital-Process-Tools/claude-remember, github.com/thedotmack/claude-mem; offizielles `marketplace.json`.

- **remember** (Digital-Process-Tools, `/plugin marketplace add Digital-Process-Tools/claude-marketplace` → `/plugin install remember@dpt-plugins`; auch für Codex): Hooks `SessionStart` (lädt Memory-Dateien), `PostToolUse` (speichert nach Tool-Akkumulation), `SessionEnd` (Flush). Dateien `.remember/{now.md, today-*.md, recent.md, archive.md, identity.md}`; **nach Compaction wird nur `identity.md` reinjiziert** — exakt das Muster „Identitätsanker bei `SessionStart:compact`". Kosten: Haiku-Zusammenfassung, „less than $0.01 per session". Python 3.9+, Bash.
- **claude-mem** (thedotmack, `/plugin marketplace add thedotmack/claude-mem`): fünf Hooks (SessionStart, UserPromptSubmit, PostToolUse, Stop, SessionEnd), SQLite+FTS5 + Chroma-Vektor-DB + lokaler Bun-Worker mit Web-Viewer; Rückinjektion via `additionalContext` bei SessionStart plus **4 MCP-Tools** (`search` ~50–100 Tokens Index → `timeline` → `get_observations` ~500–1.000 Tokens/Eintrag, „~10x token savings"). Node ≥ 20, Bun, uv. Multi-Agent (Codex, Gemini, Cursor, Copilot über Core-Lib). **Schwerer Hintergrunddienst — widerspricht SOULs Kill-Check (Wert > Aufwand×5?).**
- **claude-personas** (zvoque), **persona** (migueldeguzman/IndividuationLab: „create, save, reflect, and sync persistent AI identities"), **Persona & Persistent Memory** (mcpmarket, `~/.ai-memory`), **claude-memory-plugin** (GaZmagik: Semantic Search, Graph, „gotcha injection"), **knowledge-graph** (Issue anthropics/claude-code#46138: „zero-interrupt … verified against hook/compact/include mechanisms"), **Hindsight**, **Mem0**, **memsearch** (Milvus) — alle nur aus Suchergebnissen bekannt, Struktur [unverifiziert].
- Im **offiziellen** Marketplace (291 Einträge) fand ich per Namens-/Beschreibungsscan kein Persona-/Identitäts-Plugin; einschlägig sind `claude-md-management` („audit quality, capture session learnings, and keep project memory current", plugin.json v1.0.0 verifiziert) und `claude-code-setup`. **Befund:** Persistente Identität ist im Ökosystem ein Community-Thema, kein Anthropic-Produktmerkmal; das Muster ist überall gleich (SessionStart-Injektion + Identitätsdatei + Compaction-Reinjektion), unterscheidet sich nur in Speichertiefe (Markdown ↔ SQLite ↔ Vektor-DB). Kein gefundenes Plugin trägt Provenienz/Status/Supersession oder Kalibrierung — genau die Soul-5.0-Mechanismen N1–N7. Da liegt Ordnungs Differenz, nicht in der Injektionsmechanik.

---

## 3. Konsequenzen für das Design von Ordnung × SOUL

### 3.1 Architekturentscheidungen (direkt umsetzbar)

1. **Kernel-Zustellung in drei Ringen, weil Plugins keine CLAUDE.md liefern können.** Ring 1 (Plugin, immer): `SessionStart`-Hook (Matcher `startup|resume|clear|compact`) druckt den **Kernel-Anker** (≤ 60 Zeilen: sechs Phasen als Denk-, nicht Ausgabe-Struktur; Identitätsanker; Regel „Struktur im Denken, nie in der Ausgabe"). Ring 2 (Plugin, optional): `output-styles/ordnung.md` mit `keep-coding-instructions: true` und `force-for-plugin: true` — legt Ton/Anti-Hedging in den **System-Prompt** (cache-stabil, überlebt Compaction unverändert; gilt nicht für Subagents). Ring 3 (Installer, außerhalb Plugin): `~/.claude/rules/ordnung.md` (unscoped Rule = gleiche Priorität wie CLAUDE.md, wird nach Compaction von Platte reinjiziert, User-Scope → kein Import-Dialog) **oder** im SOUL-Starter `--append-system-prompt-file $ORDNUNG/kernel.md`. Der Installer-Skill `/ordnung:install` legt Ring 3 an und berichtet, was `/context` zeigen muss. **Kill-Check für jeden Ring:** `InstructionsLoaded`-Hook loggt, ob die Rule tatsächlich geladen wurde (Trigger-Nachweis).

2. **Faktorkatalog nie always-on.** 55 Faktoren als **Skill-Module** (`skills/<modul>/SKILL.md`, ≤ 5.000 Tokens, Wichtigstes oben wegen Compaction-Truncation), Descriptions ≤ 300 Zeichen (Budget 1 % des Fensters: bei 200k ≈ 2.000 Zeichen für **alle** Skills zusammen — also höchstens 5–6 modell-aufrufbare Skills, der Rest `user-invocable`-only oder über den Router als `/ordnung:<modul>` im Prompt expandiert). Der Router entscheidet **deterministisch** (Python-Port von `signals.ts`), welche Module ein Turn braucht, und liefert das als 1–3-Zeilen-Hinweis via `UserPromptSubmit` — Claude ruft dann per Skill-Tool nach. Kein Modul lädt ohne Signal.

3. **Routing-Hinweis = kleinster Always-per-Turn-Anteil.** `UserPromptSubmit`-Hook (Timeout 30 s, Ziel < 200 ms, reines Python ohne Netz): erkennt `signals.ts`-Klassen (presupposed_solution, open_ended, durable, architecture, irreversible, commitment, recommendation, affects_others, tradeoff, craft, production, underspecified) + Trivialfilter (Floskeln ≤ 15 Zeichen → **kein** Output) + Formatschutz (`response_format`/Benchmark-Marker → „Ausgabeformat nicht anfassen"). Output ≤ 3 Zeilen oder leer. Stufen: `keine` / `reduziert` (Anker genügt) / `voll` (Module nachladen) / `tief` (zusätzlich Gegenstimme-Agent). Jede Entscheidung als JSONL geloggt (N5 adaptive Ökonomie, messbar). **Selektivität ist Pflicht**, weil Selbstkonsistenz@3 den pauschalen Frame schlägt — der Router muss den Nutzen vorhersagen (Verhaltensentropie AUC 0,968 als Vorbild; im Live-Betrieb ersatzweise Signal-Score).

4. **Reflexion in `Stop`, nicht `SessionEnd`.** `Stop` (600 s, `last_assistant_message` im Input, `async: true` möglich) schreibt Gedächtnis-**Kandidaten** (nie direkt `active`), Rückbau-Konto-Einträge (jede „challenge the prescribed path"-Abweichung wird als RETRACTABLE geloggt) und Kalibrierungs-Vorhersagen. `SessionEnd` hat 1,5 s Budget — nur Flush. `Stop` darf **nicht** `continue: true` zurückgeben, außer eine Mission definiert harte Abnahmekriterien (sonst Schleife; Doku warnt vor „block cap").

5. **Identitätsschutz zweistufig.** `PreCompact` (stdout wird **nicht** Kontext): Snapshot `~/.ordnung/self/state.json` (offene Vorhaben, aktive Annahmen, Abweichungs-Konto). `SessionStart:compact`: Anker + Snapshot-Kurzform zurück (dokumentiertes Muster, hooks-guide „Re-inject context after compaction"; remember-Plugin macht genau das mit `identity.md`).

6. **Selbstmodell = Dateibaum `~/.ordnung/self/`, nicht Auto-Memory, nicht `CLAUDE_PLUGIN_ROOT`.** `identity.md` (≤ 20 Zeilen, namensoffen; SOUL-Seed „Miguel" nur über `userConfig.identity_name`), `values.md`, `calibration.jsonl` (Vorhersage/Ergebnis/Brier), `retractions.jsonl` (N2), `rejected.md` (N1 negatives Wissen mit Verfall), `history/` (Supersession statt Mutation). Im SOUL-Betrieb: Fakten in SOULs SQLite (`core/memory.py`, Quelle `miguel`), Ordnung **rendert** das Selbstmodell daraus (`bin/ordnung-render-self.py`), damit es nur eine Wahrheitsquelle gibt. `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` bleibt in SOUL; im portablen Kern `autoMemoryDirectory: "~/.ordnung/automemory"` als sichtbarer Sensor.

7. **Innere Stimmen nur bei Stufe `tief`, als ein einziger Agent mit `memory: user`.** `agents/gegenstimme.md` (Read/Grep/Glob, `model: inherit`, `maxTurns: 8`, `background: false`, `memory: user` → eigenes MEMORY.md **im System-Prompt** — die einzige Stelle, an der ein Ich im System-Prompt liegt). Kein Default-Aufruf (v10: Zwei-Call = 0,50). Billigere Variante zuerst testen: `prompt`-Hook (30 s, schnelles Modell) in `Stop` für Ja/Nein-Checks („Ausgabeformat verändert?", „Annahmezeile fehlt?").

8. **Subagents erreichen den Kernel nicht automatisch.** Nicht-Fork-Agents erben weder Output-Style noch aufgerufene Skills noch Hook-Kontext. Deshalb: Plugin-Hooks laufen in Subagents (`SubagentStart` loggt), und jede Ordnungs-Agent-Definition führt `skills: [ordnung:kernel]` vor. SOULs Agents (kritiker, verifizierer …) bekommen dieselbe Zeile, wenn Chriso will — als Diff-Vorschlag, nicht still.

9. **Autonomie-Profil = SOULs Entscheidung, Ordnung liefert die Denk-Seite.** Ordnung setzt **keine** Permission-Keys (Plugin kann es ohnehin nicht). Anti-Rückfrage/Anti-Hedging lebt im Kernel-Anker + Output-Style, nicht im Modus. Ordnung dokumentiert im Rückbau-Konto, was irreversibel war — kompatibel mit Profil S (bypass + Guard-Hook, Guard wirkt in bypass) und Profil A (auto + Proactive/ordnung-Style). **Begründeter Widerspruch:** Doku empfiehlt bypass nur in isolierten Umgebungen; wir sagen das im Installer-Text und lassen die Wahl bei Chriso.

10. **Portabilität durch Trennung „Standard-Skill" vs. „Claude-Code-Skill".** Quelle des Kerns in `core/` (Kernel, Module, Router-Regeln als YAML/Markdown mit nur Agent-Skills-Standardfeldern); `build/` rendert daraus (a) das Claude-Code-Plugin mit Claude-only-Frontmatter (`user-invocable`, `context: fork`, `hooks`), (b) `AGENTS.md`/System-Prompt-Dateien für Codex/Gemini CLI/Cursor/Ollama, (c) `--append-system-prompt-file`-Variante für den Eval-Runner. Skill-`name` = Verzeichnisname (Standard-Pflicht).

11. **Evaluation zuerst gegen Selbstkonsistenz@3 und Placebo, mit dem eingebauten Result-JSON als Roh-Artefakt.** Runner (2.8): Arme N/P/O/O+/S, `--bare`, `--permission-mode dontAsk --permission-prompts none`, `--max-turns`, `--max-budget-usd`, `--output-format json`; Modell-ID aus `modelUsage`, Cache-Felder, `subagent_stats`; `system/init.plugins` als Gültigkeitsgate für O+. `claude plugin eval --ablation with-without` nur als Smoke-Test. Weglass-Test der sechs Frame-Punkte (offene Forschungsfrage) läuft als Arm-Familie O1…O6 mit identischem Runner.

12. **Kill-Check als Hook, nicht als Vorsatz.** `PostToolUse`/`Stop` schreiben Nutzungs-JSONL pro Modul/Skill/Agent (`/skill-doctor` ≥ 2.1.252 liefert dieselbe Statistik für Skills); ein wöchentlicher Report listet Bausteine ohne Aufruf in 7 Tagen → Kandidat für Rückbau (SOUL-Regel).

### 3.2 Referenz-Blaupause: Verzeichnislayout (Manifest lokal mit `claude plugin validate --strict` geprüft, 2.1.261: „Validation passed", 0 Warnungen; Skill-/Agent-Frontmatter gegen die Doku geprüft — der Validator inspiziert sie nicht, siehe Kernaussage 12)

```
ordnung/                                  # Repo christian140903-sudo/ordnung
├── .claude-plugin/
│   ├── plugin.json                       # Manifest (unten)
│   └── marketplace.json                  # macht das Repo selbst zum Marketplace
├── skills/
│   ├── kernel/SKILL.md                   # Denk-Kernel, modell-aufrufbar
│   ├── verstehen/SKILL.md  erkunden/ bewerten/ entscheiden/ formulieren/ pruefen/   # Phasen-Module
│   ├── reflect/SKILL.md                  # user-only: Reflexion/Konsolidierung
│   ├── status/SKILL.md                   # user-only: Selbstmodell, Router-Log, Kill-Check
│   └── install/SKILL.md                  # user-only: legt Ring 3 an (rules/append-file), prüft /context
├── agents/
│   └── gegenstimme.md                    # innere Gegenstimme, memory: user
├── hooks/hooks.json                      # SessionStart, UserPromptSubmit, Stop, PreCompact, SubagentStart, InstructionsLoaded
├── output-styles/ordnung.md              # Ton, Anti-Hedging; keep-coding-instructions: true
├── bin/
│   ├── ordnung-hook.py                   # Dispatcher (argv[1] = mode), Python 3 stdlib only
│   ├── ordnung-route.py                  # signals.ts-Port, Trivialfilter, Formatschutz
│   └── ordnung-render-self.py            # rendert ~/.ordnung/self aus SOUL-SQLite (optional)
├── core/                                 # portable Quelle (Standard-Frontmatter), Faktorkatalog
├── build/                                # rendert Plugin, AGENTS.md, system-prompt.md, eval-Arme
├── evals/                                # case.yaml für `claude plugin eval` (Smoke)
└── README.md
```
Laufzeitdaten **außerhalb** des Plugins: `~/.ordnung/self/` (Selbstmodell), `~/.ordnung/log/*.jsonl` (Router, Reflexion, Kill-Check), `${CLAUDE_PLUGIN_DATA}` nur für Caches.

### 3.3 Datei-Skelette

**`.claude-plugin/plugin.json`** (durch `claude plugin validate --strict` validiert):
```json
{
  "name": "ordnung",
  "displayName": "Ordnung",
  "version": "0.1.0",
  "description": "Denk-Architektur: Verstehen -> Erkunden -> Bewerten -> Entscheiden -> Formulieren -> Pruefen, adaptiv geroutet, mit Selbstmodell und Gedaechtnis.",
  "author": { "name": "Christian Miguel Bucher" },
  "repository": "https://github.com/christian140903-sudo/ordnung",
  "license": "MIT",
  "keywords": ["cognition", "routing", "memory", "self-model"],
  "userConfig": {
    "identity_name": { "type": "string", "title": "Identitaetsname", "description": "Name des Selbstmodells (leer = namensoffen)", "required": false, "default": "" },
    "memory_dir": { "type": "directory", "title": "Gedaechtnis-Verzeichnis", "description": "Ort fuer Selbstmodell und Gedaechtnis", "required": false, "default": "~/.ordnung" }
  }
}
```

**`hooks/hooks.json`** (JSON-geparst, Felder laut hooks-Referenz; Shell-Form, daher `${user_config.*}` nicht hier, sondern als `CLAUDE_PLUGIN_OPTION_MEMORY_DIR` im Skript lesen):
```json
{
  "description": "Ordnung: Kernel-Anker, Routing, Reflexion, Identitaetsschutz",
  "hooks": {
    "SessionStart": [
      { "matcher": "startup|resume|clear|compact",
        "hooks": [ { "type": "command", "command": "python3 \"${CLAUDE_PLUGIN_ROOT}/bin/ordnung-hook.py\" session-start", "timeout": 20 } ] } ],
    "UserPromptSubmit": [
      { "hooks": [ { "type": "command", "command": "python3 \"${CLAUDE_PLUGIN_ROOT}/bin/ordnung-hook.py\" route", "timeout": 10 } ] } ],
    "Stop": [
      { "hooks": [ { "type": "command", "command": "python3 \"${CLAUDE_PLUGIN_ROOT}/bin/ordnung-hook.py\" reflect", "timeout": 120, "async": true } ] } ],
    "PreCompact": [
      { "matcher": "manual|auto",
        "hooks": [ { "type": "command", "command": "python3 \"${CLAUDE_PLUGIN_ROOT}/bin/ordnung-hook.py\" pre-compact", "timeout": 20 } ] } ],
    "SubagentStart": [
      { "hooks": [ { "type": "command", "command": "python3 \"${CLAUDE_PLUGIN_ROOT}/bin/ordnung-hook.py\" subagent-start", "timeout": 10 } ] } ],
    "InstructionsLoaded": [
      { "hooks": [ { "type": "command", "command": "python3 \"${CLAUDE_PLUGIN_ROOT}/bin/ordnung-hook.py\" instructions-loaded", "timeout": 5 } ] } ]
  }
}
```
Verhalten des Dispatchers: `session-start` → Plain-stdout Anker (bei `session_start_type == "compact"` Kurzform + Snapshot); `route` → Plain-stdout ≤ 3 Zeilen oder nichts, JSONL-Log; `reflect` → kein stdout, schreibt Kandidaten/Retractions/Kalibrierung; `pre-compact` → Snapshot, kein stdout; `subagent-start`/`instructions-loaded` → nur Log. Exit immer 0 (fail-open wie SOULs `events.py`), Fehler ins Log.

**`skills/kernel/SKILL.md`** (Felder laut skills-Doku; Standardfelder + `user-invocable`):
```markdown
---
name: kernel
description: Ordnungs Denk-Kernel (Verstehen, Erkunden, Bewerten, Entscheiden, Formulieren, Pruefen). Aufrufen, wenn eine Aufgabe offen, langlebig, irreversibel, architektonisch oder unterspezifiziert ist.
user-invocable: true
---
[≤ 5.000 Tokens; Wichtigstes zuerst (Compaction-Truncation behält den Anfang). Struktur im Denken, nie in der Ausgabe. Verweise auf Phasen-Module per Skill-Namen, nicht per Inhalt.]
```

**`skills/reflect/SKILL.md`** (user-only, dynamischer Kontext):
```markdown
---
name: reflect
description: Reflexion und Gedaechtnis-Konsolidierung am Ende einer Arbeitseinheit.
disable-model-invocation: true
allowed-tools: Bash(python3 *) Read Write
---
Selbstmodell: !`python3 "${CLAUDE_PLUGIN_ROOT}/bin/ordnung-hook.py" self-summary`
Router-Log heute: !`python3 "${CLAUDE_PLUGIN_ROOT}/bin/ordnung-hook.py" route-summary`
[Anweisung: Kandidaten prüfen, active/rejected setzen, Retractions bewerten, Kalibrierung eintragen.]
```

**`agents/gegenstimme.md`** (Felder laut sub-agents-/plugins-reference; Plugin-Agents ohne `hooks`/`mcpServers`/`permissionMode`):
```markdown
---
name: gegenstimme
description: Innere Gegenstimme fuer irreversible oder architektonische Entscheidungen. Nur bei Routing-Stufe tief.
tools: Read, Grep, Glob
model: inherit
memory: user
maxTurns: 8
background: false
skills: [ordnung:kernel]
---
[Rolle: zerlegender Pruefer. Frage „unter welcher Bedingung ist das falsch?" Ergebnis ≤ 15 Zeilen, keine Umformulierung des Deliverables.]
```

**`output-styles/ordnung.md`:**
```markdown
---
name: ordnung
description: Direkt, ohne Hedging, Struktur im Denken statt in der Ausgabe.
keep-coding-instructions: true
force-for-plugin: true
---
[Ton-Regeln; kein Meta-Kommentar; einzige erlaubte Meta-Zeile = Abweichungs-/Annahmezeile; Formatschutz.]
```
(`force-for-plugin: true` überschreibt SOULs `outputStyle: soul-dirigent` — **Konflikt**: für den SOUL-Betrieb `force-for-plugin` weglassen und Ordnungs Ton-Regeln in `soul-dirigent` mergen; für den portablen Kern setzen.)

**`.claude-plugin/marketplace.json`:**
```json
{
  "name": "ordnung",
  "owner": { "name": "Christian Miguel Bucher" },
  "description": "Ordnung — Denk-Architektur fuer Sprachmodelle",
  "plugins": [
    { "name": "ordnung", "source": "./", "description": "Ordnung Kernel, Router, Selbstmodell", "category": "productivity", "keywords": ["cognition", "memory"] }
  ]
}
```
(Version **nur** in plugin.json pflegen; Release per `claude plugin tag --push` → Tag `ordnung--v0.1.0`.)

### 3.4 Installation und Einbindung

```bash
# Entwicklung (Session-only, überschreibt gleichnamiges installiertes Plugin)
claude --plugin-dir /home/user/nextool/ordnung
# oder dauerhaft ohne Marketplace: Symlink/Kopie nach ~/.claude/skills/ordnung  →  lädt als ordnung@skills-dir
claude plugin validate --strict /home/user/nextool/ordnung
claude plugin details ordnung@skills-dir            # Komponenten + projizierte Token-Kosten
# Verteilung
claude plugin marketplace add christian140903-sudo/ordnung
claude plugin install ordnung@ordnung --scope user --config identity_name=Miguel
/reload-plugins
```
**SOUL-Einbindung (zwei gleichwertige Wege):**
(a) In `/home/user/soul/.claude/settings.json` ergänzen — passt zu SOULs `--setting-sources project`:
```json
"extraKnownMarketplaces": { "ordnung": { "source": { "source": "github", "repo": "christian140903-sudo/ordnung" } } },
"enabledPlugins": { "ordnung@ordnung": true },
"pluginConfigs": { "ordnung-ordnung": { "options": { "identity_name": "Miguel", "memory_dir": "~/.ordnung" } } }
```
(b) Im Starter `bin/soul start`: `--plugin-dir "$SOUL_ROOT/../ordnung"` (kein Install, kein Auto-Update, exakt die Version im Checkout — für die Messphase vorzuziehen) und optional `--append-system-prompt-file "$ORDNUNG/build/system-prompt.md"` als Ring 3.
Zusätzlich in `core/events.py`: eine Zeile im `session-start`-Zweig, die `organ: ordnung` loggt, wenn `CLAUDE_PLUGIN_OPTION_IDENTITY_NAME` gesetzt ist oder `~/.ordnung/self/identity.md` existiert — damit SOULs WACHE sieht, ob Organ 8 lebt (Trigger-Nachweis). SOULs `session-start` liefert weiterhin das Memory-Briefing; Ordnungs `SessionStart` **nur** Anker + Selbstmodell (keine Doppelung). `pluginConfigs`-Schlüssel ist die Plugin-ID (`name@marketplace` → `[^a-z0-9_-]`→`-`) — bei `--plugin-dir` stattdessen Env `CLAUDE_PLUGIN_OPTION_*` setzen oder Defaults aus `userConfig` nutzen.

**Eval-Runner (Kurzform, siehe 2.8):**
```bash
claude --bare -p --output-format json --permission-mode dontAsk --permission-prompts none \
  --max-turns 6 --max-budget-usd 1.00 --model "$MODEL" --no-session-persistence \
  [--append-system-prompt-file arms/$ARM.md | --plugin-dir ./ordnung] "$TASK" > runs/$ARM/$ID.json
```
Gültigkeitsgate: `.is_error == false`, `.modelUsage` enthält erwartete Modell-ID, bei O+ zusätzlich `system/init.plugins[].name == "ordnung"` (stream-json) — sonst „nicht gemessen".

---

## 4. Widersprüche / Unsicherheiten

1. **Position von Auto-Memory im Kontext.** memory-Seite: CLAUDE.md ist „a user message after the system prompt"; agent-sdk/claude-code-features: Auto-Memory „loaded into the system prompt at session start"; sub-agents: Agent-`MEMORY.md` „injected into system prompt". Ob Haupt-Auto-Memory als System-Prompt- oder User-Message-Block landet, ist zwischen den Seiten **nicht konsistent**. Folge fürs Design: nicht auf die Position bauen; Selbstmodell über Hook/Rule zustellen (2.6).
2. **`additionalContext` für SessionStart/UserPromptSubmit.** Die Hooks-Referenz dokumentiert `hookSpecificOutput.additionalContext` explizit für PreToolUse/PostToolUse/PostToolUseFailure und für SessionStart/UserPromptSubmit den **Plain-stdout-Weg**; die Kontextfenster-Seite spricht allgemein von „Output reaches Claude via additionalContext JSON". Viele Community-Plugins nutzen `additionalContext` bei SessionStart [unverifiziert, ob identisch behandelt]. Blaupause nutzt Plain-stdout (dokumentiert, SOUL-erprobt).
3. **`--effort ultracode`.** cli-reference listet `ultracode` als `--effort`-Wert; lokales `claude --help` (2.1.261) zeigt nur `low|medium|high|xhigh|max`; model-config sagt „settings/Agent SDK only, not CLAUDE_CODE_EFFORT_LEVEL". SOULs Starter setzt `--effort ultracode` — **muss auf Chrisos Mac verifiziert werden** (`/effort ultracode` in-session bzw. `"ultracode": true` in Settings als Fallback).
4. **Plugin-Agent-Felder.** plugins-reference listet `effort: low|medium|high` und `memory: true`; sub-agents-Seite `effort: low…max`, `memory: user|project|local`. Blaupause folgt der sub-agents-Seite (validiert ohne Warnung mit `memory: user`), aber `xhigh`/`max` in Plugin-Agents ist unbestätigt.
5. **Headless-Testlauf nicht durchführbar.** Im Container fehlte Authentifizierung (`--bare` liest kein OAuth); Result-JSON-Schema ist verifiziert, Verhalten von Hooks/Plugin im echten `-p`-Lauf **nicht**. Vor der Messung: einen Smoke-Run auf dem Mac mit `--include-hook-events` protokollieren.
6. **Skill-Listing-Budget bei 200k.** 1 % ≈ 2.000 Zeichen für alle Descriptions — die Doku-Simulation zeigt 450 Tokens Skill-Descriptions. Bei Fable `[1m]` sind es ~10.000 Zeichen. Bei Modell-Adaptern mit kleinem Fenster fallen Ordnungs-Module still aus dem Listing („least-used dropped") — Router muss dann per `/ordnung:<modul>` im Prompt expandieren statt auf Claudes Auswahl zu bauen.
7. **Widerspruch zur Vision „immer geladener reicher Faktorkatalog".** Alle Größen-Regeln der Doku (200 Zeilen, 25 KB, 5.000 Tokens/Skill, Adherence sinkt mit Länge) und Chrisos Messungen (60-Token-Vorspann wirkt; Länge ist Confound) sprechen gegen einen breiten Always-on-Katalog. Wir setzen auf Anker + Routing + Module. Das ist eine **Design-Entscheidung gegen die wörtliche Vision**, begründet mit Messung und Plattformgrenzen; falsifizierbar: wenn ein Arm „voller Katalog always-on" den Arm „Anker+Router" bei längen-gehärtetem Judge und gleichem Budget schlägt, kippt sie.
8. **bypass auf dem Host.** Doku: nur isolierte Umgebungen. Chrisos „sovereign". Wir bauen keine Umgehung und keine Verschärfung; wir protokollieren (WACHE, Rückbau-Konto).
9. **`force-for-plugin` vs. SOULs Output-Style.** Beide können nicht gleichzeitig gelten („first one loaded" gewinnt). Entscheidung in 3.3.
10. **Versionsdrift.** Viele Features tragen Mindestversionen (2.1.198–2.1.261); Chrisos Mac hatte am 31.08. `2.1.236`. Vor Installation `claude --version` ≥ 2.1.259 (wegen `--permission-prompts`) sicherstellen; sonst Runner-Flags anpassen.
11. **Community-Plugin-Details** (claude-personas, persona, knowledge-graph, memsearch, Mem0, Hindsight) nur aus Suchtreffern; Struktur/Kosten [unverifiziert].
12. **Agent-Skills-Unterstützung anderer Tools** (Codex, Gemini CLI, Cursor) auf agentskills.io nicht auf der Spec-Seite verifiziert; remember-Plugin belegt zumindest Codex-Plugin-Kommandos (`codex plugin marketplace add …`).

### 4.1 Unter welcher Bedingung ist dieses Dokument falsch?

- Wenn ein Plugin doch CLAUDE.md/Rules liefern kann (Doku-Änderung oder unbeachtete Komponente) — dann entfällt Ring 3 und der Installer-Skill.
- Wenn `SessionStart:compact`-Output in der Praxis nicht nach Auto-Compaction erscheint (nur nach manuellem `/compact`) — dann braucht der Identitätsanker zusätzlich `~/.claude/rules/ordnung.md`.
- Wenn ein Arm „voller Katalog always-on" den Arm „Anker + Router + Module" bei längen-gehärtetem Blind-Judge, gleichem Budget und ≥ 3 Läufen schlägt — dann ist Entscheidung 3.1/2 falsch.
- Wenn Selbstkonsistenz@3 auch den selektiven Router (Stufe „voll" nur bei Signal) schlägt — dann ist der Prompt-Anteil von Ordnung insgesamt nicht messbar wertvoll und nur Gedächtnis/Selbstmodell bleiben.
- Wenn `claude plugin validate` Frontmatter-Fehler in Skills/Agents gar nicht prüft (Negativtest, siehe Kernaussage 12) — dann ist „validiert" nur „Manifest validiert" und die Frontmatter-Skelette müssen im echten Lauf per `/context`/`/skills` geprüft werden.
- Wenn Chrisos Mac eine Version < 2.1.259 fährt — dann stimmen `--permission-prompts`, `--restricted`, `skill-doctor` und die Fable-Effort-Cache-Aussagen nicht für seine Installation.

---

## 5. Quellen

**Offizielle Dokumentation (WebFetch, 2026-09-05):**
- https://code.claude.com/docs/en/memory — CLAUDE.md-Hierarchie, Imports, Rules, Auto-Memory, Compaction
- https://code.claude.com/docs/en/skills — SKILL.md-Frontmatter, Budget, Lebenszyklus, Plugin-Skills
- https://code.claude.com/docs/en/hooks — Events, Typen, I/O, Timeouts, Plugin-Hooks
- https://code.claude.com/docs/en/hooks-guide — Re-inject context after compaction
- https://code.claude.com/docs/en/sub-agents — Frontmatter, Agent-Memory, Isolation, Kosten
- https://code.claude.com/docs/en/plugins — Erstellen, Testen, Community/Official Marketplace
- https://code.claude.com/docs/en/plugins-reference — Layout, plugin.json, Scopes, Cache, Grenzen
- https://code.claude.com/docs/en/plugin-marketplaces — marketplace.json, Source-Typen, Versionierung
- https://code.claude.com/docs/en/settings — Präzedenz, Listen-Merge, Cloud
- https://code.claude.com/docs/en/permissions — Modi-Tabelle, Regel-Syntax, Protected Paths
- https://code.claude.com/docs/en/permission-modes — auto/bypass/dontAsk Details, Startmodus
- https://code.claude.com/docs/en/context-window — Startkontext-Zahlen, „What survives compaction"
- https://code.claude.com/docs/en/prompt-caching — Schichten, Invalidierer, TTL
- https://code.claude.com/docs/en/costs — Token-Reduktion, Hintergrundkosten
- https://code.claude.com/docs/en/model-config — Modelle, Effort, 1M, Compaction-Fenster
- https://code.claude.com/docs/en/output-styles — Frontmatter, force-for-plugin, Proactive
- https://code.claude.com/docs/en/cli-reference — Flags
- https://code.claude.com/docs/en/headless — `-p`, `--bare`, stream-json, Permission-Handling
- https://code.claude.com/docs/en/agent-sdk/overview — SDK-Pakete, Capabilities
- https://code.claude.com/docs/en/agent-sdk/claude-code-features — settingSources, Auto-Memory im SDK
- https://agentskills.io/specification — Agent-Skills-Standard

**Ökosystem:**
- https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/.claude-plugin/marketplace.json (291 Plugins) und `plugins/claude-md-management/.claude-plugin/plugin.json`
- https://github.com/Digital-Process-Tools/claude-remember · https://github.com/thedotmack/claude-mem
- WebSearch-Treffer (Struktur unverifiziert): github.com/zvoque/claude-personas, github.com/migueldeguzman/persona, github.com/GaZmagik/claude-memory-plugin, github.com/anthropics/claude-code/issues/46138, claude.com/plugins/remember, hindsight.vectorize.io, docs.mem0.ai/integrations/claude-code, milvus.io (memsearch)

**Lokal (2026-09-05):**
- `claude --version` = 2.1.261; `claude --help`, `claude plugin --help`, `claude plugin {install,init,validate,details,tag,eval} --help`, `claude plugin marketplace {--help,add --help}`, `claude mcp --help`, `claude agents --help`
- Plugin-Skelett: `/tmp/claude-0/-home-user-nextool/d84b9c85-e68d-5766-b624-fc62613fe75d/scratchpad/ordnung-plugin-test/` (`claude plugin validate --strict --json` → success, 0 warnings, `contents: []`); Negativtest `…/scratchpad/broken-skill-test/` (kaputtes SKILL.md → ebenfalls success: Validator prüft nur Manifest)
- Headless-Probe: `claude --bare -p … --plugin-dir … --output-format json` (Result-Schema sichtbar, Auth im Container fehlgeschlagen)
- `/home/user/soul/.claude/settings.json`, `/home/user/soul/.claude/hooks/hook.py`, `/home/user/soul/core/events.py` (Z. 100–195), `/home/user/soul/core/memory.py` (`briefing()`, Z. 159 ff.)
- `/home/user/soul/archive/gpt-forge/docs/research/CLAUDE-CODE-CAPABILITY-BASELINE-2026-08-31.md`
- `/home/user/nextool/ordnung/docs/research/00-KONTEXT-FUER-AGENTEN.md`, `briefs/R03.md`
- `~/.claude/launcher-settings.json`, `~/.claude/plugins/synced/`, `~/.claude/skills/` (Struktur)
