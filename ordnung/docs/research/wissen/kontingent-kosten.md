---
name: kontingent-kosten
description: >
  Load when planning work against token, rate or subscription limits, choosing between API,
  subscription and free tiers, scheduling batch or nightly jobs, deciding cache layout, or when
  a usage-limit error appears. Also load before spawning more than two agents.
schicht: atlas
sichtbarkeit: public
version: 2026-09-06.1
verfaellt_am: 2026-10-06
haltbarkeit_default: H3
signale: [cost, quota, rate_limit, cache, batch, subscription, scheduling]
ladestufe_default: 1
abhaengig_von: [werkzeugkette-claude-code, lokale-ki-einrichten]
gemessen: {geladen: 0, gewirkt: 0, letzte_nutzung: null}
autor: mining
---

## Kurzform (≤ 120 Wörter)
Drei Währungen: API-Dollar, Abo-Fenster (5 h + Woche, verfallen ungenutzt), Gratis-Tiers (RPM/RPD/TPD, Tages-Reset). Cache-Prefix ist ein Vertrag (tools → Kernel → Briefing → Aufgabe); nichts davon mid-session ändern; Cache-Reads zählen nicht auf Rate-Limits. Alles Nicht-Interaktive in Batch (−50 %, stapelt mit Cache) ans Fensterende. Roh-Output nie in den Hauptkontext. Nie mehr als 2–3 Agenten gleichzeitig (RPM). Bei „Opus limit" Familie wechseln, bei „weekly limit" warten/Batch/Zweitanbieter. Vor jeder Prompt-Schicht: schlägt sie Selbstkonsistenz@3 bei gleichem Budget? Bei Deckeneffekt (≥ 93 % nackt) keine Struktur. Entropie über 3 Wiederholungen entscheidet, wo Tiefe lohnt.

## Kernprinzipien
1. [R@R15 Kernaussagen 1,3,5] H3 Drei Währungen und Familien-Trennung der Limits.
2. [R@R16 §2.3.1 aus platform.claude.com] H3 Prompt-Caching: 5-min-Write 1,25×, 1-h-Write 2×, Read 0,1×; Fable 5.1/Mythos 5.1 Read 0,025×; Mindestlängen 512 (Fable/Mythos 5.x, Opus 5), 1.024 (Sonnet 4.x/5, Opus 4.x), 2.048, 4.096 je Modell; max. 4 Breakpoints; Invalidierung tools → system → messages; TTL ab Request-Start.
3. [R@R16 §2.3.1] H2 Claude Code: TTL 1 h im Abo, 5 min bei API-Key; `/usage` zeigt Hit-Rate und Miss-Ursache (≥ 2.1.251); Kompaktion = „expected rebuild".
4. [R@R16 §2.3.3 aus Claude-Code-Kostenseite] H2 Jeder Request sendet die volle Konversation; `/clear` „costs nothing", `/compact` „is itself a large request"; `autoContinueAtUsageLimit` (≥ 2.1.234); Agent Teams ≈ 7×; Goal-Check-ins ≤ 3; Scheduled Tasks senden vollen Kontext je Feuern.
5. [R@R16 §2.3.4] H3 Batch: −50 % Input+Output, ≤ 100.000 Requests/256 MB, meist < 1 h, Verfall 24 h, Ergebnisse 29 Tage; Cache stapelt (1-h-TTL empfohlen); `max_tokens: 0` nicht erlaubt.
6. [R@R16 §2.3.5] H2 Zeitlogik: Abo-Fenster verfallen → Bulk-Vorbereitung ans Fensterende; Gratis-Tiers täglich (Cerebras 1M TPD bei 5 RPM; Groq ≤ 500K TPD bei 10–30 RPM); Routines min. 1 h, `/loop` 1 min, 7 Tage Verfall.
7. [G/R15] H1 Wellen-Regel 2–3 Agenten folgt aus RPM, nicht aus Vorsicht; ein Limit tötet alle in derselben Minute.
8. [G] H1 Selbstkonsistenz@3 bei gleichem Budget schlägt den Frame (−2,8 bis −5,2 pp); Deckeneffekt bei 93–97 % nackt (haiku −6,7, qwen 0); Entropie über 3 Wiederholungen AUC 0,968 als Auslöser.
9. [G] H1 Zwei-Call-Orchestrierung fügte der Ein-Call-Einpflanzung nichts hinzu (0,50) — Ebenen kosten, ohne automatisch zu wirken.
10. [R@R16 §2.3.2] H2 Kompression: deterministisch (grep/head in Hooks, Subagent-Zusammenfassung 1–2k Tokens) vor LLMLingua-2 (2–5×, läuft selbst als Modell); nie den Kernel komprimieren.
11. [R@R16 §2.3.6] H1 Wiederverwendung: abgenommene Artefakte (Vorlagen, Tests, Rubriken, Dossier-Scheiben) typisiert ablegen und beim nächsten gleichartigen Auftrag in den Prefix legen.
12. [R@R16 §2.3.7] H1 Reproduzierbarkeit aus Ergebnis-Cache (Hash Prompt+Modell-ID), nicht aus temperature=0 (1.000 Completions → 80 verschiedene).
13. [R@R15 §2.2.1] H2 `/usage` attribuiert je Skill/Subagent/MCP — Datenquelle für gemessene Modell-Passung (N4).

## Entscheidungsregeln (Textbausteine für das Scarcity-Modul in R16 §3.1; hier nur die Kurzliste)
- Nicht-interaktiv? → Batch mit 1-h-Cache-Prefix.
- Kandidat für Prompt-Schicht? → erst gegen Selbstkonsistenz@3 messen.
- Modell nackt ≥ 93 % auf der Aufgabenklasse? → keine Struktur laden.
- Fehler „Opus limit"? → Familie wechseln. „Weekly limit"? → warten, Batch, Zweitanbieter, lokal.
- Mehr als 3 Agenten geplant? → in Wellen, nie parallel.
- Pause > TTL absehbar? → Session sauber beenden, Zusammenfassung schreiben, später „resume from a summary".

## Werkzeuge
`/usage`, `/cost`, `/context`, `/insights` [R@R15]; Batch-APIs (Anthropic; OpenAI [U −50 %, 24 h]); Routines/`/loop`/cron; `--max-budget-usd` für Ebenen 3–6 [R@R15].

## Anti-Patterns
- Tool-Definitionen mid-session ändern (invalidiert alles) [R@R16].
- Nightlies in eine fette Session feuern statt in frische [R@R16 §2.3.3].
- Starke Modelle für deterministische Arbeit [R@R15].
- Längere Antwort als Qualität verkaufen (Judge-Längenbias 79,6 %) [G].

## Unter welcher Bedingung ist dieses Dossier falsch?
Preise, TTLs, Mindestlängen und Tier-Limits ändern sich monatlich (H3: Prüfung der `@q`-URLs in R15/R16 alle 30 Tage). Wenn eine neue Messung zeigt, dass eine Prompt-Schicht Selbstkonsistenz@3 schlägt, ist 8 zu aktualisieren — mit Roh-Artefakt.

## Quellen
- R15 §2.1 (Anthropic/OpenAI/Google/Groq/Cerebras-Preise und -Limits, platform.claude.com/docs/en/api/rate-limits, Abruf 2026-09-06), R15 §2.2.1
- R16 §2.3 (platform.claude.com prompt-caching, batch-processing; developers.openai.com prompt-caching; code.claude.com costs; thinkingmachines.ai), R16 §3.1
- Kontextpaket §3 (Chrisos Messungen)
