---
name: werkzeugkette-claude-code
description: >
  Load when the task touches Claude Code setup or extension (CLAUDE.md, rules, skills, hooks,
  subagents, workflows, MCP, auto memory, permissions), or when the user asks how to configure
  an AI coding tool (Codex, Gemini CLI, Cursor) or how to make one instruction set work in several tools.
schicht: handwerk
sichtbarkeit: public
version: 2026-09-06.1
verfaellt_am: 2026-12-05
haltbarkeit_default: H2
signale: [tooling, claude_code, mcp, hooks, skills, agents_md]
ladestufe_default: 1
abhaengig_von: [kontingent-kosten, sicherheit-autonome-agenten]
gemessen: {geladen: 0, gewirkt: 0, letzte_nutzung: null}
autor: mining
---

## Kurzform (≤ 120 Wörter)
Instruktionsdateien sind Kontext, keine Erzwingung — was garantiert passieren muss, ist ein Hook. Startkontext klein halten (CLAUDE.md < 200 Zeilen; Imports laden trotzdem beim Start). Wissen dreistufig: Auslöser-Beschreibung immer, Körper bei Bedarf, Ressourcen auf Abruf; `description` sagt *wann*, nicht *was*. Pfadgebundene Regeln (`.claude/rules/*.md` mit `paths:`) sind der native Weg für kontextabhängiges Wissen. Tool-Sets, Effort und Thinking nie mid-session wechseln (Cache). CLI (`gh`) vor MCP. Provider bestimmt Features (Bedrock/Vertex ohne Web Search/Routines). `AGENTS.md` per `@AGENTS.md` importieren, damit eine Quelle mehrere Agenten bedient. Unbekannte Modelle als „strong" behandeln; Struktur im Denken, nie im Ausgabeformat.

## Kernprinzipien
1. [B@q1 2026-09-06] H1 „Claude treats them as context, not enforced configuration. To block an action regardless of what Claude decides, use a PreToolUse hook instead."
2. [B@q1] H2 CLAUDE.md: „target under 200 lines"; Datei > 4 MiB wird übersprungen; „Shorter files produce better adherence." HTML-Kommentare werden vor Injektion entfernt (Notizen für Menschen kosten keine Tokens).
3. [B@q1] H2 Imports `@path`: bis 4 Hops; „imported files still load and enter the context window at launch" — Imports organisieren, sparen aber nichts.
4. [B@q1] H2 Ladeordnung: managed → `~/.claude/CLAUDE.md` → Projekt (`./CLAUDE.md` oder `./.claude/CLAUDE.md`) → `CLAUDE.local.md`; alle konkateniert; Unterordner-CLAUDE.md laden erst beim Lesen dort. Projekt-Root-CLAUDE.md überlebt `/compact`.
5. [B@q1] H2 `.claude/rules/*.md`: ohne `paths:` wie CLAUDE.md geladen; mit `paths:` erst, wenn Claude passende Dateien liest. Budget 1.000 expandierte Muster / 4 MiB je Regel.
6. [B@q1] H2 Auto-Memory: `~/.claude/projects/<project>/memory/MEMORY.md` — erste 200 Zeilen/25 KB jede Sitzung; Themen-Dateien on demand; Typen `user/feedback/project/reference`; `modified`-Timestamp (≥ v2.1.214); nicht in Subagenten (außer Fork).
7. [B@q2 2026-09-06] H2 Agent Skills (Spec): `name` ≤ 64 Zeichen, `description` ≤ 1024; Metadata ~100 Tokens beim Start, Body < 5.000 Tokens bei Aktivierung, Ressourcen on demand; SKILL.md < 500 Zeilen; Verweise eine Ebene tief; `allowed-tools` experimentell.
8. [R@R10 §2.9.2] H2 Skill-Listing ≈ 1 % des Fensters, Descriptions ≤ 1.536 Zeichen, bei Überlauf fallen die am wenigsten genutzten weg → ≤ 6 modell-aufrufbare Bündel-Skills.
9. [R@R10 §2.3.4] H1 Regeln (Hook) berechnen Signale und Kandidaten, das Modell wählt still; kein Signal erzwingt einen Modus; jedes Signal wird geloggt.
10. [R@R15 §2.2.1] H2 Provider-Achse: Bedrock/Vertex/Foundry ohne Web Search, Routines, Advisor, Channels; Gateway-Base-URL schaltet Remote Control ab. `provider` ist Profilfeld.
11. [R@R16 §2.3.1] H1 Cache-Prefix als Vertrag: tools → Kernel → Briefing → Aufgabe; Tool-Definitionsänderung invalidiert alles.
12. [R@R16 §2.3.3] H2 `/clear` kostet nichts, `/compact` ist ein großer Request; Agent Teams ≈ 7× Tokens; MCP-Tools deferred; CLI kontexteffizienter als MCP.
13. [B@q1] H2 `/init` liest Cursor-/Copilot-Regeln, mit `CLAUDE_CODE_NEW_INIT=1` auch `AGENTS.md`, `.windsurfrules`, `.clinerules`; `/import` (≥ v2.1.213) übernimmt MCP-Server, Commands, Subagents, Skills anderer Agenten.
14. [R@R14/R15] H2 Workflows: bis 1.000 Agents/Run, 16 parallel, Zwischenergebnisse außerhalb des Dirigenten-Kontexts; Agent Teams experimentell (kein Resume, nicht in `-p`).
15. [G] H1 Formatschaden: sichtbare Plan-Anweisung zerstörte 2/30 Antworten eines 120B-Modells → Ausgabeformat nicht anfassen, unbekannte Modelle als strong.

## Entscheidungsregeln
- Soll etwas *immer* passieren (Log, Guard, Test vor Commit)? → Hook, nie CLAUDE.md.
- Gilt eine Regel nur für einen Dateibereich? → `.claude/rules/<thema>.md` mit `paths:`.
- Ist es ein mehrschrittiger Ablauf, der nicht immer nötig ist? → Skill mit Auslöser-Description.
- Mehr als 6 Skills modell-aufrufbar? → bündeln oder `disable-model-invocation: true`.
- Fremdes Repo, `-p`-Lauf? → Trust-Verifikation ist aus; Sandbox an (siehe sicherheit-autonome-agenten).
- Codex/Gemini/Cursor im Spiel? → eine Quelle (`AGENTS.md`), Claude importiert sie.

## Werkzeuge
Claude Code CLI (lokal 2.1.261 [Kontext §9]); `/context` (zeigt geladene Memory-Dateien), `/memory`, `/doctor` (schlägt Trims vor, ≥ v2.1.206), `InstructionsLoaded`-Hook (loggt, welche Instruktionsdateien wann laden) [B@q1]; Codex CLI (`codex exec`), Gemini CLI, Cursor [R@R15 §2.2.2].

## Anti-Patterns
- Regeln in CLAUDE.md, die erzwungen sein müssten (Beleg: Doku-Satz in 1).
- 55 Faktoren als 55 Skills (Beleg: Listing-Budget, 8).
- Tool-Set mid-session wechseln (Beleg: Cache-Invalidierung, 11).
- Widersprüchliche Anweisungen in mehreren CLAUDE.md: „Claude may pick one arbitrarily" [B@q1].

## Unter welcher Bedingung ist dieses Dossier falsch?
Wenn eine CLI-Version die Ladeordnung, die 200-Zeilen-Empfehlung oder die Skill-Budgets ändert (H2-Verfall, Probe: `claude --version` + Doku-Fetch `@q1`, `@q2`). Wenn eine Messung zeigt, dass Hook-Kandidaten das Ergebnis nicht verändern (dann ist 9 Verwaltung, nicht Wirkung).

## Quellen
- @q1 https://code.claude.com/docs/en/memory (Abruf 2026-09-06)
- @q2 https://agentskills.io/specification (Abruf 2026-09-06)
- R10 §2.3, §2.9; R14 Organ 4; R15 §2.2; R16 §2.3 (Pfade: ../R10-…, ../R14-…, ../R15-…, ../R16-…)
