"""Rückbau von Einträgen: Zurückziehen mit rekursiver Quarantäne aller Ableitungen.

Befund: Ein flaches Gedächtnis mit einem einzigen falschen, neueren Eintrag liefert 0,0 % richtig
und 73,3 % falsch in 60/60 Fällen (01-BEFUNDE A3) — was einmal drin ist, wirkt weiter. G5
verlangt nach jeder Rücknahme 100 % quarantinierte derived_from-Kinder; unter 95 % gilt Rückbau
als Versprechen ohne Mechanismus (D034, R05 §3.8).
Erz → Gold: Soul 5.0 N2 („Freiheit mit Gedächtnis und Rückbau") war ein Prinzip in Prosa, und
SOUL core/memory.py kannte weder derived_from noch Quarantäne. Hier ist Rückbau eine Funktion:
retract() zieht den Eintrag über ledger.transition zurück, läuft die Ableitungskette entlang und
setzt jedes erreichbare Kind auf quarantined, schreibt die retractions-Zeile und meldet auf den
Bus; contamination_share() ist die Messgröße G5.

Bezeichner englisch (wie das Schema), Kommentare deutsch.
"""
from __future__ import annotations

import json
from collections import deque
from contextlib import closing

from core import bus, paths
from core.memory import ledger

# Status, die einen Eintrag bereits aus dem Umlauf genommen haben; ein Kind in diesem Zustand
# zählt für G5 als sauber, weil weder Briefing noch Weitergabe es erreichen.
_OUT_OF_CIRCULATION = ("quarantined", "retracted")


# --- Ableitungskette ----------------------------------------------------------------------------
def _children_index() -> dict[str, list[str]]:
    """Umkehrindex Elternteil → Kinder aus derived_from, in einem Lesezugriff aufgebaut."""
    index: dict[str, list[str]] = {}
    with closing(ledger.connect()) as con:
        rows = con.execute(
            "SELECT id, derived_from FROM memories WHERE derived_from != '[]'"
        ).fetchall()
    for row in rows:
        try:
            parents = json.loads(row["derived_from"] or "[]")
        except ValueError:
            parents = []
        for parent in parents if isinstance(parents, list) else []:
            index.setdefault(str(parent), []).append(row["id"])
    return index


def descendants(id: str) -> list[str]:
    """Alle Einträge, die direkt oder über Zwischenstufen aus `id` abgeleitet sind (Breitensuche,
    jeder nur einmal, zyklensicher). Der Ausgangseintrag selbst ist nicht enthalten."""
    index = _children_index()
    seen: set[str] = {id}
    order: list[str] = []
    queue: deque[str] = deque([id])
    while queue:
        parent = queue.popleft()
        for child in index.get(parent, ()):
            if child in seen:
                continue
            seen.add(child)
            order.append(child)
            queue.append(child)
    return order


def quarantine_descendants(root_id: str, *, reason: str, by: str = "system") -> dict:
    """Setzt jedes Kind von `root_id` auf quarantined, soweit TRANSITIONS das erlaubt.

    Kinder, die schon aus dem Umlauf sind (quarantined/retracted) oder deren Status keinen Weg
    nach quarantined kennt (seit dem Fundament-Update keines mehr), werden übersprungen, aber ihre eigenen Kinder
    trotzdem erreicht: die Kette ist auch hinter einem übersprungenen Glied vergiftet.
    Rückgabe {"quarantined": [ids], "skipped": [{"id", "status"}]}.
    """
    quarantined: list[str] = []
    skipped: list[dict] = []
    for child_id in descendants(root_id):
        entry = ledger.get(child_id)
        if entry is None:
            continue
        status = entry["status"]
        if status in _OUT_OF_CIRCULATION or (status, "quarantined") not in ledger.TRANSITIONS:
            skipped.append({"id": child_id, "status": status})
            continue
        ledger.transition(child_id, "quarantined", reason=reason, by=by)
        quarantined.append(child_id)
    return {"quarantined": quarantined, "skipped": skipped}


# --- Rückbau ----------------------------------------------------------------------------------
def retract(id: str, *, reason: str, by: str = "nutzer") -> dict:
    """Zieht einen Eintrag zurück und quarantiniert rekursiv alles, was aus ihm abgeleitet ist.

    Reihenfolge: (1) transition(id, "retracted") — ein illegaler Übergang oder eine unbekannte id
    wirft LedgerError, bevor irgendetwas verändert ist (fail-closed); (2) Ableitungskette
    quarantinieren; (3) retractions-Zeile mit den quarantinierten ids; (4) Bus.
    Rückgabe {"target": id, "contaminated": [ids], "skipped": [...], "retraction_id": str}.
    """
    reason = (reason or "").strip()
    if not reason:
        raise ledger.LedgerError("Rücknahme ohne Grund abgelehnt")
    ledger.transition(id, "retracted", reason=reason, by=by)
    result = quarantine_descendants(
        id, reason=f"abgeleitet aus zurückgezogenem Eintrag {id}: {reason}", by=by)
    contaminated = result["quarantined"]
    retraction_id = paths.new_id()
    with closing(ledger.connect()) as con, con:
        con.execute(
            "INSERT INTO retractions (id, target_id, reason, by, at, contaminated_ids)"
            " VALUES (?,?,?,?,?,?)",
            (retraction_id, id, reason, by, paths.now_iso(),
             json.dumps(contaminated, ensure_ascii=False)),
        )
    bus.emit("memory.retract", id=id, retraction_id=retraction_id, reason=reason, by=by,
             contaminated=len(contaminated), skipped=len(result["skipped"]))
    return {"target": id, "contaminated": contaminated, "skipped": result["skipped"],
            "retraction_id": retraction_id}


def list_retractions() -> list[dict]:
    """Alle retractions-Zeilen, älteste zuerst; contaminated_ids als Liste."""
    with closing(ledger.connect()) as con:
        rows = con.execute("SELECT * FROM retractions ORDER BY at, id").fetchall()
    out = []
    for row in rows:
        d = dict(row)
        try:
            d["contaminated_ids"] = list(json.loads(d.get("contaminated_ids") or "[]"))
        except ValueError:
            d["contaminated_ids"] = []
        out.append(d)
    return out


# --- Messgröße G5 -----------------------------------------------------------------------------
def contamination_share() -> float:
    """G5: Anteil der Kinder aller zurückgezogenen Einträge, die aus dem Umlauf sind (Ziel 1.0).

    Kinder = transitive derived_from-Nachkommen jedes Eintrags mit status retracted. Sauber zählt,
    was quarantined oder selbst retracted ist. Ein archiviertes oder abgelöstes Kind zählt NICHT
    als sauber: archived kann nach active zurück, und dann trüge es das Gift wieder. Ohne
    zurückgezogene Einträge oder ohne Kinder gibt es nichts zu verseuchen → 1.0.
    """
    with closing(ledger.connect()) as con:
        retracted = [r["id"] for r in con.execute(
            "SELECT id FROM memories WHERE status = 'retracted'")]
    children: set[str] = set()
    for rid in retracted:
        children.update(descendants(rid))
    children.difference_update(retracted)
    if not children:
        share = 1.0
        clean = 0
    else:
        clean = 0
        for cid in children:
            entry = ledger.get(cid)
            if entry is not None and entry["status"] in _OUT_OF_CIRCULATION:
                clean += 1
        share = clean / len(children)
    bus.emit("memory.contamination_share", retracted=len(retracted), children=len(children),
             clean=clean, share=share)
    return share
