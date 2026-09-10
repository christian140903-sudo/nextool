# B6 — Claude-Code-Plugin, Adapter, Build-Skript

Lies Baukontext; Register Gruppe H, I; Architektur §3, §7; R03 (Blaupause: plugin.json, hooks.json, Skills mit Claude-only-Feldern, Output-Style, Agents, Installer-Skill für ~/.claude/rules, compact-Reinjektion), R04 (Zielformate, Tokenbudgets je Host, Kompilat), B3a/B5a/B5b-Ergebnisse (structure/, soul10/core).

Baue:
1. `ordnung/build/build.mjs` (Node 20, keine Abhängigkeiten): liest `structure/` und erzeugt deterministisch: `plugin/` (Claude Code: `.claude-plugin/plugin.json`, `skills/<bündel>/SKILL.md` mit Claude-Feldern, `hooks/hooks.json` → `soul10/core/events.py` via `${CLAUDE_PLUGIN_ROOT}`, `agents/` (gegenstimme, verifizierer, kritiker, spiegel), `output-styles/soul10.md`, `commands/` (onboard, status, reflect, remember, recall, eval), `README.md`), `adapters/claude/CLAUDE.md` (Import-Variante + rules-Datei), `adapters/codex/AGENTS.md`, `adapters/gemini/GEMINI.md`, `adapters/cursor/.cursor/rules/*.mdc`, `adapters/copilot/.github/copilot-instructions.md`, `adapters/system-prompt/{S,M,L}.md` (Tokenbudgets aus R04), `adapters/ollama/Modelfile`, `adapters/proxy/frame-ordnung.ts` (Frame-Variante für soul-proxy: Anker + Stufe-1-Form, formatneutral), `adapters/mcp/resources.json` (Struktur + Selbstmodell als Ressourcen). Tokenzählung je Artefakt ins Build-Log; Fehler bei Überschreitung.
2. `plugin/` committen (Build-Ergebnis), `claude plugin validate --strict plugin/` ausführen und Ausgabe zeigen; `claude plugin details` falls möglich.
3. `adapters/README.md` (deutsch): Installationsanleitung je Host (5–10 Zeilen), was je Host degradiert, wie Gedächtnis geteilt wird.
4. `ordnung/marketplace/.claude-plugin/marketplace.json` für ein eigenes GitHub-Marketplace (Name, Plugin-Quelle, Version).
Abnahme: `node build/build.mjs` läuft und listet Artefakte mit Tokenzahlen; validate ok; Anker in jedem Kompilat byte-gleich (diff).
