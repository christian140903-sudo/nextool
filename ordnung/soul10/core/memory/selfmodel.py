"""Selbstmodell: gewachsen aus Episoden mit Belegzähler, nie deklariert.

Befund: Identität aus Logs 94,0 % Konsistenz gegen deklarierte Persona 91,9 % — die Richtung
stimmt, die Größe nicht; Rückgrat 7–14 % in allen Armen, Persona (13,6 %) nicht besser als nackt
(12,8 %) (01-BEFUNDE §6). Selbstwahrnehmung gilt, wenn innere Hinweise schwach sind (Bem, R05 §1.8).
Erz → Gold: SOUL.md und der ANIMA-Kernel deklarierten eine Persona, fertig am Tag 0 (D043, D046,
D049). Hier gibt es keinen Persona-Text: ein `self`-Eintrag entsteht als Kandidat, zählt seine
Belege über derived_from (Episoden, Sitzungen) und wird erst mit ≥ 2 Episoden aus ≥ 2 Sitzungen
aktiv; alles darunter steht sichtbar als „Hypothese über mich". Der Name kommt von außen — der
Kern bleibt namensoffen (R05 §3.6 Nr. 6).

Bezeichner englisch (evidence, promote_eligible, render nach ARCHITEKTUR 4.6), Kommentare deutsch.
"""
from __future__ import annotations

from core import bus
from core.memory import ledger

# Belegschwelle (ARCHITEKTUR 4.6; R05 §3.3 Nr. 2d: ≥ 2 unabhängige Belege aus ≥ 2 Sitzungen).
MIN_EPISODES = 2
MIN_SESSIONS = 2
# Episoden, die zurückgezogen oder kontaminiert sind, belegen nichts mehr. Archivierte zählen
# weiter: Vergessen ist Sichtbarkeit, nicht Löschung (D032), und Episoden verfallen nach 14 Tagen.
_NO_EVIDENCE_STATUS = ("retracted", "quarantined")
# Wer die Beförderung verantwortet: der Konsolidierer im Namen des Modells (R05 §3.6 Nr. 3).
BY = "self"
NAMELESS = "namensoffen"


def _session_key(episode: dict) -> str:
    """Sitzung = session_id; fehlt sie, zählt der Tag (D043: „verschiedene Sitzungen/Tage")."""
    sid = (episode.get("session_id") or "").strip()
    if sid:
        return f"sitzung:{sid}"
    return "tag:" + (episode.get("valid_from") or episode.get("recorded_at") or "")[:10]


def evidence(entry: dict) -> dict:
    """{"episodes": n, "sessions": k} über derived_from: nur Einträge der Art episode zählen,
    zurückgezogene und quarantinierte nicht. Unbekannte IDs belegen nichts."""
    sessions: set[str] = set()
    episodes = 0
    for ref in entry.get("derived_from") or []:
        ep = ledger.get(str(ref))
        if ep is None or ep.get("kind") != "episode" or ep.get("status") in _NO_EVIDENCE_STATUS:
            continue
        episodes += 1
        sessions.add(_session_key(ep))
    return {"episodes": episodes, "sessions": len(sessions)}


def _self_entries(status: str) -> list[dict]:
    from contextlib import closing
    with closing(ledger.connect()) as con:
        rows = con.execute(
            "SELECT * FROM memories WHERE kind = 'self' AND status = ? ORDER BY recorded_at, id",
            (status,),
        ).fetchall()
    return [ledger._row_to_dict(r) for r in rows]


def _belegt(ev: dict, *, min_episodes: int, min_sessions: int) -> bool:
    return ev["episodes"] >= min_episodes and ev["sessions"] >= min_sessions


def promote_eligible(*, min_episodes: int = MIN_EPISODES, min_sessions: int = MIN_SESSIONS) -> list[str]:
    """Selbst-Kandidaten mit Belegschwelle → active. Der einzige Weg, auf dem ein Zug aktiv wird
    (außer Hand-Übergang im Hauptbuch, den render() dann trotzdem nur als Hypothese zeigt)."""
    promoted: list[str] = []
    for cand in _self_entries("candidate"):
        ev = evidence(cand)
        if not _belegt(ev, min_episodes=min_episodes, min_sessions=min_sessions):
            continue
        ledger.transition(cand["id"], "active", by=BY,
                          reason=f"belegt: {ev['episodes']} Episoden aus {ev['sessions']} Sitzungen")
        bus.emit("memory.selfmodel.promote", id=cand["id"], episodes=ev["episodes"],
                 sessions=ev["sessions"])
        promoted.append(cand["id"])
    bus.emit("memory.selfmodel.promote_eligible", promoted=len(promoted),
             min_episodes=min_episodes, min_sessions=min_sessions)
    return promoted


def _hypothesis_line(entry: dict, ev: dict) -> str:
    return f"Hypothese über mich (Belege {ev['episodes']}/{ev['sessions']}): {ledger.render(entry)}"


def render(*, name: str | None = None, max_lines: int = 15) -> str:
    """Kopfzeile, dann belegte Züge (ledger.render, mit Herkunftsetikett), dann Hypothesen.

    Deklariert nichts: ein aktiver self-Eintrag, dessen Belege unter der Schwelle liegen, wird
    als Hypothese gezeigt, nicht als Zug. Ohne Einträge steht eine Zeile „noch keine belegten Züge".
    Nie mehr als max_lines Zeilen; gekürzt werden zuerst die Hypothesen, dann die Züge, nie der Kopf.
    """
    header = f"# Selbstmodell: {(name or '').strip() or NAMELESS}"
    traits: list[tuple[float, int, str]] = []
    hypotheses: list[tuple[int, int, str]] = []
    unbelegt_aktiv = 0
    for entry in _self_entries("active"):
        ev = evidence(entry)
        if _belegt(ev, min_episodes=MIN_EPISODES, min_sessions=MIN_SESSIONS):
            traits.append((-float(entry["trust"]), -ev["episodes"], ledger.render(entry)))
        else:
            unbelegt_aktiv += 1
            hypotheses.append((-ev["episodes"], -ev["sessions"], _hypothesis_line(entry, ev)))
    for entry in _self_entries("candidate"):
        ev = evidence(entry)
        hypotheses.append((-ev["episodes"], -ev["sessions"], _hypothesis_line(entry, ev)))
    traits.sort()
    hypotheses.sort()
    budget = max(1, int(max_lines)) - 1
    body = [" ".join(t[2].split("\n")) for t in traits][:budget]
    body += [" ".join(h[2].split("\n")) for h in hypotheses][:max(0, budget - len(body))]
    if not body:
        body = ["noch keine belegten Züge"][:budget]
    text = "\n".join([header] + body)
    bus.emit("memory.selfmodel.render", traits=len(traits), hypotheses=len(hypotheses),
             unbelegt_aktiv=unbelegt_aktiv, lines=text.count("\n") + 1, named=bool(name))
    return text
