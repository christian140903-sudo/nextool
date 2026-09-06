# B11 — Overlay für das SOUL-Repo und Branch `soul-10`

Voraussetzung: Push-Erlaubnis liegt vor (Chriso, 2026-09-05); der Orchestrator holt Push-Zugang per add_repo (access: push) und klont nach `/home/user/soul-push`. Dieser Schritt wird vom Orchestrator koordiniert; der Agent bereitet das Overlay vor:
1. `ordnung/integration/soul/overlay/`: der vollständige Dateibaum, der ins SOUL-Repo kommt (aus `ordnung/soul10/` + `structure/` + `plugin/` als Verweis oder Kopie, entschieden in Architektur §8), plus `MIGRATION.md` (deutsch: was ersetzt wird, was bleibt, Datenmigration `memory/soul.sqlite3` → neues Schema als candidate, Mandate, Events).
2. `ordnung/integration/soul/install.sh` (POSIX): kopiert Overlay in ein SOUL-Checkout (Parameter Pfad), führt Doctor aus, zeigt Diff-Liste; `--dry-run`.
3. Prüfung: Overlay in eine Kopie von `/home/user/soul` anwenden, `python3 core/doctor.py` und Tests dort laufen lassen, Ergebnis zeigen.
Danach Orchestrator: Branch `soul-10` im SOUL-Repo anlegen, Overlay committen, pushen; Chriso den Branch nennen (kein Merge in main).
