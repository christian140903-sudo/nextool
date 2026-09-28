#!/usr/bin/env python3
"""Dünner Zeiger auf core/events.py — die Logik lebt dort (ARCHITEKTUR 5.9).

Befund: null Hook-Zeilen nach einer Sitzung sind ein Defekt (ENTSCHEIDUNG §5 Nr. 3, G2) —
der Zeiger muss laufen, sonst ist das Gedächtnis tot.
Erz → Gold: /home/user/soul/.claude/hooks/hook.py rechnete den Pfad beim Import und ließ jeden
Importfehler zum Exit-Code werden. Hier: alles in main(); Exit-Code immer 0; ist der Kern nicht
ladbar, gilt für pre-tool die Regel der Wache (fail-closed: deny mit Grund), für alle anderen
Modi fail-open (Fehler auf stderr, nichts auf stdout).
"""
import json
import sys
from pathlib import Path


def main() -> int:
    root = Path(__file__).resolve().parent.parent.parent  # .claude/hooks/hook.py → ordnung/soul10
    if str(root) not in sys.path:
        sys.path.insert(0, str(root))
    mode = sys.argv[1] if len(sys.argv) > 1 else ""
    try:
        from core import events
    except Exception as exc:  # noqa: BLE001 — der Kern fehlt oder ist kaputt
        print(f"soul10 hook ({mode}): Kern nicht ladbar: {exc}", file=sys.stderr)
        if mode == "pre-tool":
            print(json.dumps({"hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": f"Soul-10-Wache nicht ladbar ({exc}); core/ pruefen.",
            }}))
        return 0
    return events.main()


if __name__ == "__main__":
    raise SystemExit(main())
