# B5a — Hooks, Router, Verdrahtung (Code) — „Code ohne Trigger = toter Mechanismus"

Lies Kontextpaket §2, §4; Baukontext; Register Gruppe B, H; Architektur §4; R03 (Hook-Events, stdin/stdout-Formate, Budgets, compact-Reinjektion, Blaupause), R10 (Routing-Tabelle, Signale, Unit-Test-Pflicht); SOULs `core/events.py` und `core/guard.py` als Erz; `soul-proxy-45/src/amplify/signals.ts` (Signale, Trivialfilter) und `formatGuard.ts` gezielt.

Baue in `ordnung/soul10/core/`:
- `router.py`: Python-Port und Erweiterung von signals.ts (Klassen sachfrage, technisch, kreativ, text, emotional, ethisch, entscheidung, planung, konflikt, projekt, format_locked + die alten Signale; Korrekturen der Falsch-positiv-Quellen aus R10), Trivialfilter, Tiefenstufen-Vorschlag 0–4 mit asymmetrischen Fehlkosten, Bündel-Vorschlag, Formatzwang-Erkennung; Ausgabe ≤ 3 Zeilen Kontext oder leer; JSONL-Log ohne Prompttext (`watch/routing.jsonl`).
- `events.py` (Nachfolger von SOULs events.py, Erz→Gold): Handler für SessionStart (startup|resume|clear|compact: Anker + Identität + Briefing; bei compact Snapshot-Reinjektion), UserPromptSubmit (Router), PreToolUse (Ausnahmeliste aus guard.py übernommen, Mandate; Wirkungsvorhersage-Hook für wirksame Tool-Aufrufe optional), PostToolUse (Vorhersage-Abgleich), Stop (Reflexion: Kandidaten, Rückbau, Vorhersagen; async), PreCompact (Snapshot `self/state.json`), SessionEnd (Flush ≤ 1,5 s), SubagentStart/Stop (Ebenen-Log), InstructionsLoaded (Trigger-Nachweis-Log). Fail-open beim Logging, fail-closed beim Guard.
- `guard.py`: aus SOUL übernommen, plattformneutral, Kategorien unverändert (Chrisos Ring-2-Liste), Mandate.
- `.claude/settings.json` für soul10 (Hooks, env: `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`, Caching, `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`, outputStyle, statusLine) und `.claude/hooks/hook.py` (dünner Zeiger).
- Tests: `tests/test_router.py` mit ≥ 60 Beispielprompts (de/en, alle Klassen, Trivial, Format-locked) und Soll-Stufe; Abnahme Stufe exakt ≥ 85 %, Falsch-positiv Einsatzhöhe auf Code ≤ 10 %; `tests/test_events.py` mit Beispiel-stdin je Event (JSON) und erwarteter stdout/Exit.
- `docs/07b-hooks-und-routing.md` (deutsch): Ereignis → Handler → Wirkung → Log-Zeile; Budget je Hook; Erz→Gold.
Abnahme: pytest grün mit Ausgabe; `echo '{...}' | python3 .claude/hooks/hook.py user-prompt` liefert Routing-Kontext; Routing-Log-Zeile entsteht.
