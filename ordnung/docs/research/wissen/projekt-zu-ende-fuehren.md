---
name: projekt-zu-ende-fuehren
description: >
  Load when a task spans more than one session, when a project must be driven to completion
  by an agent (long-running harness), when handing work to another session or agent, or when
  an agent reports "done". Also load at the start of any durable or multi-feature build.
schicht: handwerk
sichtbarkeit: public
version: 2026-09-06.1
verfaellt_am: 2027-09-06
haltbarkeit_default: H1
signale: [durable, harness, long_running, handoff, verify, done_claim]
ladestufe_default: 1
abhaengig_von: [evaluation-ehrlichkeit, kontingent-kosten]
gemessen: {geladen: 0, gewirkt: 0, letzte_nutzung: null}
autor: mining
---

## Kurzform (≤ 120 Wörter)
Zu Ende führen ist ein Artefakt-Problem, kein Motivationsproblem. Der Kern ist eine Feature-Liste als JSON mit `passes`-Feld je prüfbarer Anforderung; Agenten dürfen nur dieses Feld ändern, nie Tests entfernen. Jede Session startet gleich: Zustand lesen (Git-Log, Fortschrittsdatei), höchste offene Feature wählen, `init.sh` + Smoke-Test, erst dann bauen; ein Feature pro Session, sauber committen. „Fertig" heißt: getrennte Prüfung hat end-to-end bestanden — Exit 0 ist not-evaluated. Zieldatei zuerst anlegen, nach jedem Abschnitt schreiben. Unteragenten lohnen nur mit Orakel (Tests, Ausführung, Daten). Übergabe = Vertrag: was verstanden, angenommen, anders gemacht, was offen.

## Kernprinzipien
1. [B@q4 2026-09-06] H1 Zwei Rollen: Initializer (erste Session: `init.sh`, `claude-progress.txt`, erster Commit, Feature-Liste) und Coding Agent (jede weitere Session: inkrementell, mergefähig).
2. [B@q4] H1 Feature-Liste JSON mit `passes`-Boolean: „We prompt coding agents to edit this file only by changing the status of a passes field … ‚It is unacceptable to remove or edit tests because this could lead to missing or buggy functionality.'"
3. [B@q4] H1 Session-Start: `pwd` → Git-Log + Fortschrittsdatei → höchste offene Feature → `init.sh` + Basistests → erst dann neue Arbeit. „The key insight … finding a way for agents to quickly understand the state of work when starting with a fresh context window."
4. [B@q4] H1 Fehlbilder: „Premature completion"; „Context loss" („Each new session begins with no memory of what came before"); „Undocumented progress"; „Testing gaps" — Code geändert, aber „would fail recognize that the feature didn't work end-to-end".
5. [B@q4] H1 Test-Werkzeuge (Browser, visuelle Verifikation) „dramatically improved performance".
6. [SOUL Organ 7] H1 „Exit 0 ist not-evaluated" bis eine getrennte Prüfung urteilt; Beleg ≠ Urteil (Invariante 2).
7. [Kontext §3] H1 Schreib-Auflage: Zieldatei zuerst, nach jedem Abschnitt schreiben; gerettet wird nur, was auf Platte steht.
8. [R@R10 §2.3.2] H1 Meta-Prompting-Gewinn hing am Interpreter: Delegation lohnt, wo der Unteragent an ein Orakel angeschlossen ist, nicht wo er „noch einmal nachdenkt".
9. [R@R16 §2.3.6] H1 „deterministic stack allocation": jede Iteration erhält identische Spezifikations- und Plan-Dateien; Wiederverwendung als Tokens-Ersparnis.
10. [Kontext §5 N6] H1 Vertrag als Artefakt: was verstanden/angenommen/anders gemacht, mit Hash-Kette; Rückbau-Konto für proaktive Abweichungen (N2).
11. [SOUL playbooks/uebergabe, preflight] H1 Abnahmekriterien vor dem Bau: 3–5 prüfbare Kriterien, die ein Verifizierer mechanisch abarbeiten kann; Ring-2-Fragen gebündelt, nie tröpfchenweise.
12. [SOUL denk-architekturen Anti-Pattern 10] H1 Zeitschätzungen liegen Faktor 3–20× daneben; selbstberichtete Autonomie hielt nicht — Fortschritt nur über `passes`-Zähler berichten, nie über Prozent-Gefühl.
13. [R@R15 §2.2.1] H2 Native Ausdauer: `/goal` (Idle-Check-ins ≤ 3, jeder sendet vollen Kontext), Workflows (Zwischenergebnisse außerhalb des Dirigenten-Kontexts), Worktrees für parallele Ausführende, Cross-Session-Messaging (≥ 2.1.224).

## Entscheidungsregeln
- Mehr als eine Session absehbar? → Initializer-Ritual zuerst (Feature-Liste, `init.sh`, Fortschrittsdatei, Commit).
- Agent meldet „fertig"? → Verifizierer (getrennte Session/Agent) läuft die Feature-Liste durch; nur `passes: true` mit Roh-Artefakt zählt.
- Unteragent ohne Tests/Ausführung/Daten? → nicht spawnen; Selbstkonsistenz oder Weiterarbeiten ist billiger.
- Feature halb fertig am Session-Ende? → Zustand in Fortschrittsdatei + Commit auf Branch, nie im Kopf.
- Abweichung vom Auftrag? → eine Zeile Offenlegung + Rückbau-Eintrag.

## Werkzeuge
`feature_list.json` (Schema: id, beschreibung, schritte[], passes, artefakt_pfad, modell_id, geprueft_von, geprueft_am), `claude-progress.txt`, `init.sh`, Git-Branches/Worktrees, `core/mission.py` (SOUL: Vorhaben mit Abnahmekriterien), Verifizierer-Agent (`.claude/agents/verifizierer.md`).

## Anti-Patterns
- „Done" ohne E2E-Probe (Beleg: 4).
- Fortschrittslog als Wahrheit statt Feature-Liste mit pass/fail (Beleg: SOUL forschung-2026-09: „DAS ist der Kern, nicht das Progress-Log").
- Tests anpassen, damit sie grün werden (Beleg: 2).
- Ebenen um der Ebenen willen: Zwei-Call fügte Ein-Call nichts hinzu (0,50) [G].

## Unter welcher Bedingung ist dieses Dossier falsch?
Wenn eine Messung zeigt, dass ein Modell mit 1M-Kontext ohne Session-Ritual gleich gut zu Ende führt (dann sind 3 und 4 Verwaltung). Wenn `passes`-Felder systematisch ohne Artefakt auf true gesetzt werden (dann fehlt der Guard, nicht das Prinzip).

## Quellen
- @q4 https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents (Abruf 2026-09-06)
- SOUL: `/home/user/soul/knowledge/forschung-2026-09.md`, `playbooks/{preflight,uebergabe}.md`, `knowledge/denk-architekturen.md` (Anti-Patterns)
- Kontextpaket §3, §5; R10 §2.3.2; R15 §2.2.1; R16 §2.3.6
