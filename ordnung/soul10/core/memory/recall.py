"""Abruf aus dem Hauptbuch: Suche, Rang, Briefing, Ebenen-Sicht.

Befund: Rauschen verdünnt kaum — 12/60/200 Störeinträge kosten −3,3 pp, n.s. (01-BEFUNDE A2);
das Etikett in der Zeile trägt 95,0 % (A4). Deshalb FTS5 mit einfachem Rang statt Vektoren, und
jede Zeile, die ins Kontextfenster geht, kommt aus ledger.render.
Erz → Gold: SOUL core/memory.py::briefing kannte weder Herkunft in der Zeile noch Rang; es nahm
die acht jüngsten Einträge (Rezenz — der gemessene Totalausfall A3). Hier: Rang aus Vertrauen,
Retention und Wichtigkeit, Herkunftsetikett je Zeile, Regel am Ende, harte Zeilengrenze, und eine
Sicht je Ebene, die unten weniger zeigt als oben.

Bezeichner englisch, Kommentare deutsch.
"""
from __future__ import annotations

import math
import re
import sqlite3
from contextlib import closing
from datetime import datetime, timezone
from typing import Iterable

from core import bus, paths
from core.memory import ledger

# Unter dieser Retention fällt ein Eintrag aus dem Briefing (R05 §3.3 Nr. 4).
BRIEFING_MIN_RETENTION = 0.3
# Kinds, die eine Ebene ≥ 3 sieht: nur Arbeitswissen der Mission.
LEVEL3_KINDS = ("fact", "procedure", "contract")


# --- Zeit und Retention -----------------------------------------------------------------------
def _parse_time(value: str) -> datetime:
    """ISO-Zeit (…Z) oder reines Datum → tz-bewusstes UTC-datetime."""
    text = (value or "").strip()
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    parsed = datetime.fromisoformat(text)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def retention(entry: dict, now: str | None = None) -> float:
    """exp(-Δtage / max(strength, 1.0)); Δ ab last_accessed, sonst ab recorded_at."""
    reference = entry.get("last_accessed") or entry.get("recorded_at")
    if not reference:
        return 1.0
    try:
        delta = _parse_time(now or paths.now_iso()) - _parse_time(reference)
    except ValueError:
        return 1.0
    days = max(0.0, delta.total_seconds() / 86400.0)
    strength = float(entry.get("strength") or 1.0)
    return math.exp(-days / max(strength, 1.0))


def _rank(entry: dict, *, relevance: float = 1.0, now: str | None = None) -> float:
    """Rang = Relevanz × Vertrauen × (0,5 + 0,5·Retention) × (1 + 0,1·Wichtigkeit)."""
    trust = float(entry.get("trust") or 0.0)
    importance = int(entry.get("importance") or 0)
    return relevance * trust * (0.5 + 0.5 * retention(entry, now)) * (1.0 + 0.1 * importance)


# --- Suche ------------------------------------------------------------------------------------
def _tokens(query: str) -> list[str]:
    """SOUL-Muster, eine Stelle schärfer: Tokens sind Läufe aus Wortzeichen, getrennt an allem
    anderen (auch Bindestrich und Unterstrich — dort trennt FTS5 ebenfalls); jedes Token wird
    gequotet, FTS5-Syntax bricht nie."""
    return re.findall(r"[^\W_]+", query or "")


def search(query: str, *, limit: int = 8, status: Iterable[str] = ("active",),
           kinds: Iterable[str] | None = None, min_trust: float = 0.0,
           mission_id: str | None = None, session_id: str = "") -> list[dict]:
    """FTS5-Treffer, nach Rang sortiert; jeder Treffer wird berührt (touch). Sichtbarkeit never fehlt.

    Relevanz = 1/(1+d) mit d = bm25 − bester bm25 der Anfrage (FTS5 liefert bm25 negativ, negativer
    ist besser; der Abstand zum besten Treffer hält die Formel positiv und die Ordnung richtig).
    """
    tokens = _tokens(query)
    statuses = tuple(status) or ("active",)
    if not tokens:
        bus.emit("memory.search", n=0, tokens=0)
        return []
    match = " ".join(f'"{t}"' for t in tokens)
    sql = ("SELECT m.*, f.rank AS bm25 FROM memories_fts f JOIN memories m ON m.rowid = f.rowid"
           " WHERE memories_fts MATCH ?"
           f" AND m.status IN ({','.join('?' * len(statuses))})"
           " AND m.trust >= ? AND m.visibility != 'never'")
    params: list = [match, *statuses, float(min_trust)]
    if kinds:
        kind_tuple = tuple(kinds)
        sql += f" AND m.kind IN ({','.join('?' * len(kind_tuple))})"
        params += list(kind_tuple)
    if mission_id is not None:
        sql += " AND m.mission_id = ?"
        params.append(mission_id)
    sql += " ORDER BY f.rank LIMIT ?"
    params.append(max(int(limit) * 5, 50))
    with closing(ledger.connect()) as con:
        try:
            rows = con.execute(sql, params).fetchall()
        except sqlite3.OperationalError:
            rows = []
    now = paths.now_iso()
    entries = []
    if rows:
        best = min(float(r["bm25"]) for r in rows)
        for r in rows:
            entry = ledger._row_to_dict(r)
            distance = max(0.0, float(entry.pop("bm25")) - best)
            entry["rank"] = _rank(entry, relevance=1.0 / (1.0 + distance), now=now)
            entries.append(entry)
    entries.sort(key=lambda e: e["rank"], reverse=True)
    hits = entries[:max(0, int(limit))]
    for hit in hits:
        ledger.touch(hit["id"], session_id=session_id, via="search")
    bus.emit("memory.search", n=len(hits), tokens=len(tokens), statuses=list(statuses),
             mission_id=mission_id)
    return hits


# --- Briefing ---------------------------------------------------------------------------------
def _rule_line_count() -> int:
    """Wie viele Zeilen REGEL_HERKUNFT anhängt, wenn sie an einen Text angefügt wird."""
    return ledger.REGEL_HERKUNFT.count("\n")


def _selfmodel_lines(*, name: str | None, max_lines: int) -> list[str]:
    """Selbstmodell-Kurzform aus selfmodel.render — fehlt das Modul, fehlt der Abschnitt."""
    try:
        from core.memory import selfmodel  # lazy: entsteht parallel, Schnittstelle ARCHITEKTUR 4.6
    except ImportError:
        return []
    try:
        text = selfmodel.render(name=name, max_lines=max_lines)
    except Exception as exc:  # noqa: BLE001 — ein kaputtes Selbstmodell darf das Briefing nicht anhalten
        bus.emit("memory.briefing.selfmodel_fehler", error=str(exc)[:200])
        return []
    lines = [ln for ln in (text or "").splitlines()]
    # Ein Selbstmodell ohne belegte Züge und ohne Hypothesen ist eine leere Zeile im Budget:
    # Kopf + "noch keine belegten Züge". Es bleibt aus dem Briefing, bis es etwas zu sagen hat.
    rest = [ln for ln in lines[1:] if ln.strip()]
    if not rest or all("noch keine belegten" in ln for ln in rest):
        return []
    return lines[:max_lines]


def _active_entries(*, mission_id: str | None = None, kinds: Iterable[str] | None = None,
                    exclude_kinds: Iterable[str] = ()) -> list[dict]:
    sql = "SELECT * FROM memories WHERE status = 'active' AND visibility != 'never'"
    params: list = []
    if mission_id is not None:
        sql += " AND mission_id = ?"
        params.append(mission_id)
    if kinds:
        kind_tuple = tuple(kinds)
        sql += f" AND kind IN ({','.join('?' * len(kind_tuple))})"
        params += list(kind_tuple)
    excluded = tuple(exclude_kinds)
    if excluded:
        sql += f" AND kind NOT IN ({','.join('?' * len(excluded))})"
        params += list(excluded)
    with closing(ledger.connect()) as con:
        rows = con.execute(sql, params).fetchall()
    return [ledger._row_to_dict(r) for r in rows]


def _ranked_lines(entries: list[dict], *, min_retention: float, now: str) -> list[tuple[dict, str]]:
    """Einträge nach Rang, als (Eintrag, gerenderte Zeile) — eine Zeile je Eintrag, Etikett vorn."""
    kept = []
    for e in entries:
        if retention(e, now) < min_retention:
            continue
        e["rank"] = _rank(e, now=now)
        kept.append(e)
    kept.sort(key=lambda e: e["rank"], reverse=True)
    return [(e, " ".join(ledger.render(e).split("\n"))) for e in kept]


def _assemble(header: str, blocks: list[list[str]], entry_lines: list[tuple[dict, str]], *,
              max_lines: int, with_rule: bool, entries_title: str) -> tuple[str, list[dict]]:
    """Baut den Text: Kopf, feste Blöcke (in Prioritätsfolge), Einträge, Regel.

    Kürzt zuerst die Einträge, dann die festen Blöcke von hinten, nie die Regel, nie den Kopf.
    Das Ergebnis hat höchstens max_lines Zeilen; Boden ist Kopf + Regel (mit Regel 6 Zeilen,
    ohne 1), weil weniger nur durch Kürzen der Regel ginge.
    """
    rule_lines = _rule_line_count() if with_rule else 0
    budget = max(int(max_lines), 1 + rule_lines) - rule_lines
    lines: list[str] = [header]
    fixed: list[str] = []
    for block in blocks:
        fixed += block
    # Feste Blöcke von hinten kürzen, wenn sie allein schon nicht passen.
    room_for_fixed = budget - len(lines)
    if len(fixed) > room_for_fixed:
        fixed = fixed[:max(0, room_for_fixed)]
    lines += fixed
    shown: list[dict] = []
    room = budget - len(lines) - (1 if entry_lines else 0)  # 1 Zeile Abschnittstitel
    if entry_lines and room > 0:
        lines.append(entries_title)
        for entry, line in entry_lines[:room]:
            lines.append(line)
            shown.append(entry)
    text = "\n".join(lines[:budget])
    if with_rule:
        text += ledger.REGEL_HERKUNFT
    return text, shown


def briefing(*, max_lines: int = 60, level: int = 1,
             extra_sections: Iterable[tuple[str, list[str]]] = (), with_rule: bool = True,
             name: str | None = None) -> str:
    """Das Briefing für den Sitzungsstart. Nie mehr als max_lines Zeilen.

    Reihenfolge: Kopfzeile; Selbstmodell-Kurzform (≤ 10 Zeilen, wenn selfmodel vorliegt);
    extra_sections des Aufrufers; Top-Einträge nach Rang (active, Retention ≥ 0,3, nicht never,
    kein self — das Selbst rendert der eigene Abschnitt) je als ledger.render-Zeile; zuletzt
    REGEL_HERKUNFT. Gekürzt werden zuerst die Einträge, nie die Regel.
    """
    now = paths.now_iso()
    header = f"# Soul-10-Briefing ({paths.today()})"
    blocks: list[list[str]] = []
    self_lines = _selfmodel_lines(name=name, max_lines=10)
    if self_lines:
        blocks.append(self_lines)
    for title, section_lines in extra_sections:
        block = [f"## {title}"] + [str(ln) for ln in section_lines]
        blocks.append(block)
    ranked = _ranked_lines(_active_entries(exclude_kinds=("self",)),
                           min_retention=BRIEFING_MIN_RETENTION, now=now)
    text, shown = _assemble(header, blocks, ranked, max_lines=max_lines, with_rule=with_rule,
                            entries_title="## Gedaechtnis aus frueheren Sitzungen")
    for entry in shown:
        ledger.touch(entry["id"], via="briefing")
    bus.emit("memory.briefing", level=level, lines=text.count("\n") + 1, entries=len(shown),
             candidates=len(ranked), with_rule=with_rule)
    return text


def level_view(level: int, *, mission_id: str | None = None, max_lines: int = 15) -> str:
    """Was eine Ebene sieht. 1: das Briefing. 2: Kurzidentität + Einträge der Mission (+ Regel).
    ≥ 3: nur fact/procedure/contract der Mission — kein self, kein user, keine Regel."""
    if level <= 1:
        return briefing(level=1)
    now = paths.now_iso()
    header = f"# Soul-10-Sicht Ebene {level}" + (f" (Mission {mission_id})" if mission_id else "")
    if level == 2:
        blocks = []
        self_lines = _selfmodel_lines(name=None, max_lines=5)
        if self_lines:
            blocks.append(self_lines)
        entries = _active_entries(mission_id=mission_id, exclude_kinds=("self",))
        with_rule = True
    else:
        blocks = []
        entries = _active_entries(mission_id=mission_id, kinds=LEVEL3_KINDS)
        with_rule = False
    ranked = _ranked_lines(entries, min_retention=0.0, now=now)
    text, shown = _assemble(header, blocks, ranked, max_lines=max_lines, with_rule=with_rule,
                            entries_title="## Wissen der Mission")
    for entry in shown:
        ledger.touch(entry["id"], via="level_view")
    bus.emit("memory.level_view", level=level, mission_id=mission_id,
             lines=text.count("\n") + 1, entries=len(shown))
    return text
