---
name: wissensorgan-selbstpflege
description: >
  Load when creating, changing, distilling or auditing a dossier in wissen/, when a dossier is
  expired or disputed, when a research result should become durable knowledge, at project end
  (harvest step), and when the maintenance routine runs. Also load when a knowledge gap is logged.
schicht: handwerk
sichtbarkeit: public
version: 2026-09-06.1
verfaellt_am: 2027-03-06
haltbarkeit_default: H2
signale: [knowledge_maintenance, distill, expiry, lint, harvest, gap, dossier]
ladestufe_default: 1
abhaengig_von: [recherche-quellenpflicht, sicherheit-autonome-agenten, evaluation-ehrlichkeit]
gemessen: {geladen: 0, gewirkt: 0, letzte_nutzung: null}
autor: mining
---

## Kurzform (≤ 120 Wörter)
Wissen ist ein Hauptbuch, keine Ablage: jede Aussage trägt Stufe (G/B/R/P/U), Haltbarkeit (H1/H2/H3), Quelle mit Datum. Neues Wissen entsteht nur als Kandidat in `_candidates/`, aus untrusted Quellen in Quarantäne, und wird ohne Netz und Secrets geprüft, bevor es promoted wird. Promotion ist Supersession mit Begründung und Rückbau-Befehl. Verfall sperrt (bleibt L0 mit Warnung), statt zu bitten. Der Linter läuft täglich und als Guard vor jedem Schreibzugriff. Nutzung wird gezählt; Wirkung wird über Regel-Referenzen und monatliche Placebo-Stichproben gemessen; was nicht wirkt, fällt in L0-only. Miner-Regel: Mechanismus, Herkunft, Scheitern — keine Nacherzählung. Kill-Check, Name-Mechanismus-Abgleich, Primitivitäts-Check vor jedem neuen Dossier.

## Kernprinzipien
1. [SOUL legacy-miner.md] H1 „Extrahiere MECHANISMEN (was tut es, warum trug es, woran scheiterte es) — keine Nacherzaehlung, keine 1:1-Kopie. Jede Aussage mit Herkunftspfad."
2. [SOUL denk-architekturen Anti-Pattern 8] H1 „Kein Gate beim Erzeugen → 35% Rauschen (868 Slop-Notes archiviert)."
3. [SOUL denk-architekturen] H1 Kill-Check (7 Tage genutzt? ≤ 3 Schritte zur Aktion? Wert > Aufwand × 5?), Name-Mechanismus-Abgleich, „Algorithmus schlägt Willensakt", „der Prüfer fällt immer zuerst weg".
4. [B@q7 Google docguide] H1 „A small set of fresh and accurate docs is better than a large assembly of documentation in various states of disrepair"; „Dead docs are bad"; „Duplication is evil … Link to it instead"; Doku im selben Commit.
5. [B@q19 2026-09-06, Hermes-Doku zu Karpathys Gist] H2 LLM-Wiki: `raw/` immutable mit SHA256 („source drift"), `wiki/`-Seiten editierbar, `SCHEMA.md`, `index.md` („one-line summary per page"), `log.md` append-only; Lint für „orphan pages, broken wikilinks, missing frontmatter, stale content, contradictions, source drift, oversized pages"; „the wiki compiles knowledge once and keeps it current" (Gist: gist.github.com/karpathy/442a6bf555914893e9891c11519de94f, selbst nicht abgerufen).
6. [B@q1 Claude-Code-Memory] H2 Native Vorbilder: `MEMORY.md`-Index ≤ 200 Zeilen/25 KB mit Erinnerung beim Überschreiten; `modified`-Timestamp; Typen `user/feedback/project/reference`; `/doctor` schlägt Trims vor (streicht Ableitbares, behält „pitfalls, rationale, and conventions").
7. [Kontext §3 Memory-Lehren] H1 Guards vor Insert; Supersession statt Mutation; Widerspruch → beide Seiten `disputed`; Nutzer-Autorität nur mit Zitat; Startvertrauen quellenabhängig (user 0,8 / document 0,7 / agent_inference 0,4); ein Gedächtnis lebt nur, wenn der Arbeitsfluss es füttert und liest.
8. [Kontext §5 N1, N2, N7] H1 Negatives Wissen (`rejected` mit Grund + Verfallsbedingung), Rückbau-Konto, typisierte Ernte mit Verfall (Ziel langlebig, Methode kurzlebig).
9. [B@q10 Willison] H1 Destillat aus Web ist untrusted → Quarantäne, Prüfung ohne Netz/Secrets.
10. [R@R10 §2.9.1 Anthropic] H1 „If a human engineer can't definitively say which tool should be used in a given situation, an AI agent can't be expected to do better" → Dossier-Grenzen so schneiden, dass ein Mensch die Zuordnung eindeutig trifft; Lint „straddles several categories".
11. [R@R14 Ä11] H1 Drei Schichten (Handwerk / Atlas / Profil) mit verschiedenen Verfallsfristen und Sichtbarkeiten.
12. [Kontext §13.4] H1 Jedes Dossier ist Hypothese; die Nutzungs-/Wirkungsmessung ist seine Evaluation.

## Entscheidungsregeln
- Neues Wissen aus Recherche/Projekt? → `_candidates/<datum>-<name>.md` mit {quelle, stufe, haltbarkeit, betrifft_dossier, begruendung, trust}; nie direkt ins Dossier.
- Kandidat betrifft bestehende Aussage? → Widerspruch nennen, beide `disputed`, Probe vorschlagen; keine Überschreibung.
- Promotion? → Linter grün, Kill-Check, Name-Mechanismus, Primitivitäts-Check, Placebo-Frage („verändert die Kurzform eine Entscheidung?") → Supersession + `log.jsonl` + Rückbau-Befehl.
- Dossier abgelaufen? → L0 ⚠, H3-Aussagen einzeln prüfen (eine Quelle, ein Abruf), nicht neu schreiben.
- Lücke 3× in 7 Tagen geloggt? → Dossier-Kandidat mit Auslöser-Description zuerst (Router vor Inhalt).
- Wirkungsquote < 0,1 über 60 Tage? → L0-only; nach 180 Tagen ohne Nutzung → `SUPERSEDED/` (nicht löschen: negatives Wissen, warum es nicht trug).

## Werkzeuge
`soul wissen lint | promote | rollback | expire | stats` (zu bauen, AP5); Linter-Regeln R17 §2.5; Routines/`/loop`/cron für täglich/wöchentlich/monatlich; Batch mit 1-h-Cache für Prüfwellen (kontingent-kosten 5); `InstructionsLoaded`-Hook zum Nachweis, was geladen wurde [B@q1].

## Anti-Patterns
- Slop-Notes: Dossier aus einer Quelle nacherzählt, ohne Mechanismus/Stufe (Beleg: 1, 2).
- Verfall als Bitte statt Sperre (Beleg: SOUL `forschung-2026-09.md` KORREKTUR-Sektion).
- Wissen ohne Aufruf-Pfad („Lies bei Aufgabenstart, was die Aufgabe braucht" — Beleg: SOUL `INDEX.md`, R14 Organ 4).
- Zahl an zwei Stellen ohne Verweis (Beleg: 4).

## Unter welcher Bedingung ist dieses Dossier falsch?
Wenn die monatliche Placebo-Stichprobe über 3 Monate keine Wirkung geladener Kurzformen zeigt — dann ist das Wissensorgan Verwaltung, und nur der Atlas (Fakten, die das Modell nicht wissen kann) bleibt. Diese Bedingung ist vorregistriert; Auflösung 2026-12-06.

## Quellen
- SOUL `.claude/agents/legacy-miner.md`, `knowledge/denk-architekturen.md`, `knowledge/INDEX.md`, `knowledge/forschung-2026-09.md`
- @q1 code.claude.com/docs/en/memory · @q7 google.github.io/styleguide/docguide/best_practices.html · @q10 simonwillison.net (Lethal Trifecta) · @q19 hermes-agent.nousresearch.com/docs/user-guide/skills/bundled/research/research-llm-wiki (alle Abruf 2026-09-06)
- Kontextpaket §3, §5, §13; R10 §2.9; R14 Ä11
