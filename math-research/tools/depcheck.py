#!/usr/bin/env python3
"""Prüft den Lemma-Dependency-Graphen gegen den Acceptance Contract.

Regeln (RH-10, RH-11, RH-12, RH-14):
  • Graph ist azyklisch, alle Abhängigkeiten existieren.
  • Auf jedem Pfad zu MAIN sind nur PROVED, PROVED_COMPUTER, FORMALLY_VERIFIED und
    IMPORTED (refereed = true ∧ hypotheses_checked = true) zulässig.
  • Knoten mit assumes_RH = true dürfen nicht auf dem MAIN-Pfad liegen.
  • PROVED/PROVED_COMPUTER/FORMALLY_VERIFIED-Knoten auf dem MAIN-Pfad quittieren alle Lint-Regeln.
Exit-Code 0 genau dann, wenn MAIN geschlossen ist. Sonst: Liste der blockierenden Knoten.
"""
import sys
import tomllib
from pathlib import Path

ROOT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent / "rh"
OK_STATUS = {"PROVED", "PROVED_UNIFORM", "BRIDGE_CLOSED", "PROVED_COMPUTER", "FORMALLY_VERIFIED", "IMPORTED"}
# Nicht zulässig auf dem MAIN-Pfad: NUMERICAL, OBSERVED, CONJECTURE, CANDIDATE, OPEN, HEURISTIC, IMPORTED_PREPRINT,
# PROVED_FINITE (endliche Aussage ersetzt keinen ∀-Quantor), REFUTED.  RH_PROVED nur für MAIN, nur bei geschlossenem Pfad.
NEEDS_LINT = {"PROVED", "PROVED_UNIFORM", "BRIDGE_CLOSED", "PROVED_COMPUTER", "FORMALLY_VERIFIED"}


def main() -> int:
    graph = tomllib.loads((ROOT / "dependency_map.toml").read_text())["node"]
    rules = {r["id"] for r in tomllib.loads((ROOT / "proof_lint.toml").read_text())["rule"]}
    errors, blockers = [], []

    for name, node in graph.items():
        for dep in node.get("depends_on", []):
            if dep not in graph:
                errors.append(f"{name}: unbekannte Abhängigkeit {dep}")

    # Zyklen (DFS)
    state = {}

    def visit(n, stack):
        if state.get(n) == 1:
            errors.append("Zyklus: " + " → ".join(stack + [n]))
            return
        if state.get(n) == 2:
            return
        state[n] = 1
        for d in graph[n].get("depends_on", []):
            if d in graph:
                visit(d, stack + [n])
        state[n] = 2

    for n in graph:
        visit(n, [])

    # MAIN-Pfad
    seen, todo = set(), ["MAIN"]
    while todo:
        n = todo.pop()
        if n in seen or n not in graph:
            continue
        seen.add(n)
        todo.extend(graph[n].get("depends_on", []))

    for n in sorted(seen - {"MAIN"}):
        node = graph[n]
        st = node.get("status")
        why = []
        if st not in OK_STATUS:
            why.append(f"Status {st}")
        if st == "IMPORTED" and not (node.get("refereed") and node.get("hypotheses_checked")):
            why.append("Import ohne refereed/hypotheses_checked")
        if node.get("assumes_RH"):
            why.append("setzt RH voraus (RH-10)")
        if st in NEEDS_LINT:
            missing = rules - set(node.get("lint", []))
            if missing:
                why.append("Lint nicht quittiert: " + ", ".join(sorted(missing)))
        if why:
            blockers.append((n, "; ".join(why)))

    if graph["MAIN"].get("status") == "RH_PROVED" and (errors or blockers):
        errors.append("MAIN trägt RH_PROVED, obwohl der Pfad nicht geschlossen ist")
    if not graph["MAIN"].get("depends_on"):
        blockers.append(("MAIN", "keine Beweiskante (depends_on leer)"))

    print(f"Knoten: {len(graph)} · auf MAIN-Pfad: {len(seen) - 1} · Lint-Regeln: {len(rules)}")
    for e in errors:
        print("FEHLER  ", e)
    if blockers:
        print(f"MAIN: {graph['MAIN']['status']} — blockiert durch {len(blockers)} Knoten:")
        for n, why in blockers:
            print(f"  ✗ {n:14s} {why}")
    closed = not errors and not blockers
    print("MAIN geschlossen:", "JA" if closed else "NEIN")
    return 0 if closed else 1


if __name__ == "__main__":
    sys.exit(main())
