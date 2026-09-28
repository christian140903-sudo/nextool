# B5c — Starter, Doctor, Monitor: plattformneutral (Code)

Lies Baukontext; Register Gruppe G, L; Architektur §7–8; R14 (Universalität, Verbesserungsliste); R03 (CLI-Flags, Permission-Modi, --bare, --setting-sources, --append-system-prompt-file); SOULs `core/starter.py`, `doctor.py`, `monitor.py`, `bin/soul`, `core/soul.py` als Erz.

Baue in `ordnung/soul10/`:
- `bin/soul` (POSIX sh) und `bin/soul.cmd`/`bin/soul.ps1` (Windows) als Zeiger auf `core/soul.py`.
- `core/soul.py`: Befehle `start [profil]`, `doctor`, `monitor`, `stop`, `status`, `mission …`, `memory …` (delegiert an B4-CLI), `onboard`, `profile`, `atlas update`, `consolidate`, `backup`, `eval …` (delegiert an eval/), `build` (delegiert an build/build.mjs).
- `core/starter.py`: Profile `vollgas` (Claude Code: Modell aus profile.json oder Default `claude-fable-5-1[1m]`, effort, bypassPermissions als Nutzerentscheidung aus CONSENT, `--setting-sources project`, `--append-system-prompt-file structure/kernel/ANCHOR.md` als Ring-3-Zustellung, Monitor als separater Prozess plattformneutral: neues Terminalfenster wo möglich, sonst Hinweis auf `soul monitor`), `probe` (Haiku, default permissions), `codex`/`gemini` (Start des kompilierten Adapters, falls installiert); Startauftrag in Zwischenablage nur wenn `pbcopy`/`xclip`/`clip` vorhanden, sonst Datei-Hinweis; Prozessgruppen-Registrierung; keine zsh-Abhängigkeit.
- `core/doctor.py`: Checks (Python ≥ 3.11, claude-Version ≥ 2.1.251 mit echter Modellprobe `-p --bare`, Node ≥ 20, Git, Hooks vorhanden und ausführbar, Gedächtnis-DB Integrität, Profil vorhanden, Zustimmung vorhanden, aktive Mandate, Atlas-Alter, Plugin-Validierung falls claude vorhanden); Ausgabe fail-closed (fehlende Quelle = unbekannt, nie 0).
- `core/monitor.py`: Live-Ansicht der `watch/events.jsonl` + `routing.jsonl` (plattformneutral, curses-frei, ANSI; `s`+Enter Not-Stopp attestiert), Rotation.
- `core/mission.py`: aus SOUL übernommen, plus Abnahmeproben als Datei (probe: shell-exit / file-exists+content / regex-absence), `verdict` nur durch Verifizierer-Lauf setzbar.
- Tests `tests/test_starter.py`, `test_doctor.py`, `test_mission.py` (ohne echte Claude-Starts: `SOUL_CLAUDE_BIN` auf ein Dummy-Binary).
Abnahme: `python3 soul10/core/doctor.py` läuft hier (Linux) durch; pytest grün; `soul --help` zeigt alle Befehle; keine `zsh`, `pbcopy`, `open`-Annahmen ohne Fallback.
