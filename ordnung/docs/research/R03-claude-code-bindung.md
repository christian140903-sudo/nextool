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

