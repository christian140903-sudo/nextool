"""Konsolidierung: Takt A (Inbox → Episoden), Takt B (Dubletten, Widerspruch, Ablauf, Retention, Selbst).

Befund: 93 Einträge in 47 Tagen, 5 vom Nutzer (D031, K §3) — ein Gedächtnis lebt nur, wenn der
Arbeitsfluss es mechanisch füttert; flaches Gedächtnis mit Rezenz als Sieger 0,0 % richtig /
73,3 % falsch (01-BEFUNDE A3) — deshalb entscheidet bei Widerspruch das Vertrauen, nie das Datum;
Vergessen als Retention exp(−Δt/strength), Archiv unter 0,1 (D032, R05 §3.3 Nr. 4).
Erz → Gold: SOUL-CLAUDE.md sagte „Stop konsolidiert", ohne Mechanismus (R14 S2); R05 §3.3 sah
Takt A mit einem Modellaufruf vor. Hier: Takt A ist reine Buchführung ohne Modell (Hooks schreiben
die Inbox, takt_a macht Episoden daraus), Takt B ordnet den Bestand mit den Regeln des Hauptbuchs
und darf nichts löschen — jede Änderung ist ein transition() und damit in der Hash-Kette.

Bezeichner deutsch (takt_a, takt_b, inbox_write nach ARCHITEKTUR 4.5), Kommentare deutsch.
"""
from __future__ import annotations

import json
import math
import re
from contextlib import closing
from datetime import timedelta
from pathlib import Path
from typing import Iterable

from core import bus, paths
from core.memory import ledger

# Episoden aus Werkzeugaufrufen sind Arbeitsstände: Haltbarkeit „short", 14 Tage (R05 §3.3 Nr. 5).
EPISODE_TTL_TAGE = 14
# Rohe Werkzeugausgaben über 2 KB werden nicht gespeichert, nur ihr Anfang plus Hash (R05 §3.3 Nr. 6).
MAX_BODY_ZEICHEN = 2000
# Unter dieser Retention wandert ein Eintrag ohne aktive Ableitungen ins Archiv (D032).
ARCHIV_RETENTION = 0.1
# Unterverzeichnis, in das verarbeitete Inbox-Dateien wandern.
VERARBEITET = "verarbeitet"
# Gedächtnisarten, deren Titel eine Aussage benennt — nur dort ist ein anderer Body ein Widerspruch.
# Episoden haben Werkzeugtitel („Bash: ok"), die sich tausendfach wiederholen; sie widersprechen sich nicht.
AUSSAGE_KINDS = ("fact", "procedure", "self", "user", "rejected")
# Wer die Übergänge der Konsolidierung verantwortet (Feld `by` in ledger.jsonl).
BY = "consolidate"


# --- Zeit ------------------------------------------------------------------------------------
def _iso(dt) -> str:
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def _plus_tage(iso: str, tage: float) -> str:
    return _iso(paths.parse_iso(iso) + timedelta(days=tage))


def _normalisiere_zeit(text: str | None, fallback: str) -> str:
    """Eine Ereigniszeit in die Schreibweise des Hauptbuchs bringen; Unlesbares → fallback."""
    try:
        return _iso(paths.parse_iso(text or ""))
    except ValueError:
        return fallback


def retention(entry: dict, now: str | None = None) -> float:
    """exp(−Δtage / max(strength, 1)) ab last_accessed, sonst ab recorded_at — dieselbe Formel wie
    recall.retention (ARCHITEKTUR 4.2), hier ohne Import, damit Takt B ohne recall läuft."""
    referenz = entry.get("last_accessed") or entry.get("recorded_at")
    if not referenz:
        return 1.0
    try:
        tage = max(0.0, paths.days_between(referenz, now or paths.now_iso()))
    except ValueError:
        return 1.0
    return math.exp(-tage / max(float(entry.get("strength") or 1.0), 1.0))


# --- Inbox -----------------------------------------------------------------------------------
def _sicherer_name(session_id: str) -> str:
    return re.sub(r"[^A-Za-z0-9_.-]", "_", session_id or "") or "unbekannt"


def _inbox_datei(session_id: str) -> Path:
    return paths.inbox_dir() / f"{_sicherer_name(session_id)}.jsonl"


def inbox_write(session_id: str, record: dict) -> None:
    """Eine Zeile nach inbox/<session_id>.jsonl (Hooks schreiben hier; ARCHITEKTUR 5.9 post-tool).

    Fail-open: eine kaputte Inbox hält keinen Hook an; der Fehler steht auf dem Bus.
    Fehlt `at`, gilt die Schreibzeit als Ereigniszeit.
    """
    try:
        zeile = dict(record or {})
        zeile.setdefault("at", paths.now_iso())
        zeile["session_id"] = session_id
        with _inbox_datei(session_id).open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(zeile, ensure_ascii=False, default=str) + "\n")
        bus.emit("memory.inbox.write", session_id=session_id, tool=zeile.get("tool"))
    except Exception as exc:  # noqa: BLE001 — Loggen ist fail-open
        bus.emit("memory.inbox.fehler", session_id=session_id, error=str(exc)[:200])


def _episode_aus_record(record: dict, session_id: str, now: str) -> str:
    """Ein Inbox-Record → ein Episoden-Eintrag. Wirft LedgerError, wenn ein Guard greift."""
    tool = str(record.get("tool") or "unbekannt").strip() or "unbekannt"
    outcome = str(record.get("outcome") or "").strip()
    summary = str(record.get("summary") or "")
    args_hash = str(record.get("args_hash") or "").strip()
    at = _normalisiere_zeit(record.get("at"), now)
    body = summary
    if len(body) > MAX_BODY_ZEICHEN:
        body = (body[:MAX_BODY_ZEICHEN]
                + f" … [gekürzt, sha256 {paths.sha256_text(summary)[:12]}]")
    tags = [t for t in (tool, outcome) if t]
    return ledger.remember(
        f"{tool}: {outcome}" if outcome else tool, body,
        kind="episode", source="werkzeug", source_ref=f"{tool}:{args_hash}",
        importance=2, tags=tags, valid_from=at, ttl_class="short",
        expires_at=_plus_tage(at, EPISODE_TTL_TAGE), status="active",
        mission_id=str(record.get("mission_id") or ""),
        level=int(record.get("level") or 1), agent=str(record.get("agent") or ""),
        session_id=session_id, model_id=str(record.get("model_id") or ""),
    )


def takt_a(session_id: str) -> dict:
    """Inbox → Episoden, ohne Modellaufruf. Danach wandert die Inbox-Datei nach inbox/verarbeitet/.

    Jede Zeile wird einzeln durch remember() geführt; greift dort ein Guard (Imperativ aus
    Werkzeugtext, Secret, Größe), zählt die Zeile als abgelehnt — fail-closed bleibt richtig,
    und der Rest der Inbox geht trotzdem durch.
    """
    datei = _inbox_datei(session_id)
    ergebnis = {"session_id": session_id, "episoden": 0, "abgelehnt": 0, "unlesbar": 0, "ids": []}
    if not datei.exists():
        bus.emit("memory.takt_a", **{k: v for k, v in ergebnis.items() if k != "ids"}, inbox=False)
        return ergebnis
    now = paths.now_iso()
    for roh in datei.read_text(encoding="utf-8").splitlines():
        if not roh.strip():
            continue
        try:
            record = json.loads(roh)
            if not isinstance(record, dict):
                raise ValueError("Zeile ist kein Objekt")
        except ValueError as exc:
            ergebnis["unlesbar"] += 1
            bus.emit("memory.takt_a.unlesbar", session_id=session_id, error=str(exc)[:120])
            continue
        try:
            ergebnis["ids"].append(_episode_aus_record(record, session_id, now))
            ergebnis["episoden"] += 1
        except ledger.LedgerError as exc:
            ergebnis["abgelehnt"] += 1
            bus.emit("memory.takt_a.abgelehnt", session_id=session_id,
                     tool=record.get("tool"), grund=str(exc)[:160])
    ziel_dir = paths.inbox_dir() / VERARBEITET
    ziel_dir.mkdir(parents=True, exist_ok=True)
    # Ein Suffix je Lauf: der Stop-Hook läuft je Zug derselben Sitzung, die Datei darf nichts überschreiben.
    datei.replace(ziel_dir / f"{_sicherer_name(session_id)}-{paths.new_id()}.jsonl")
    bus.emit("memory.takt_a", **{k: v for k, v in ergebnis.items() if k != "ids"}, inbox=True)
    return ergebnis


# --- Takt B ----------------------------------------------------------------------------------
def _normalisiert(text: str) -> str:
    """Vergleichsform: Kleinschreibung, nur Wortzeichen, ein Leerzeichen dazwischen."""
    return " ".join(re.findall(r"[^\W_]+", (text or "").lower()))


def _eintraege(statuses: Iterable[str], kinds: Iterable[str] | None = None) -> list[dict]:
    stati = tuple(statuses)
    sql = f"SELECT * FROM memories WHERE status IN ({','.join('?' * len(stati))})"
    params: list = list(stati)
    if kinds:
        arten = tuple(kinds)
        sql += f" AND kind IN ({','.join('?' * len(arten))})"
        params += list(arten)
    sql += " ORDER BY recorded_at, id"
    with closing(ledger.connect()) as con:
        rows = con.execute(sql, params).fetchall()
    return [ledger._row_to_dict(r) for r in rows]


def _dubletten() -> int:
    """(1) Kandidat mit gleichem normalisiertem Titel+Body wie ein aktiver Eintrag → archived."""
    aktiv = {(_normalisiert(e["title"]), _normalisiert(e["body"])) for e in _eintraege(("active",))}
    n = 0
    for k in _eintraege(("candidate",)):
        if (_normalisiert(k["title"]), _normalisiert(k["body"])) in aktiv:
            ledger.transition(k["id"], "archived", reason="dublette", by=BY)
            n += 1
    return n


def _weicht(verlierer: dict, sieger: dict) -> None:
    """Der Eintrag mit geringerem Vertrauen verlässt den Umlauf. Aktiv → superseded; ein Kandidat
    kennt diesen Übergang nicht (TRANSITIONS) und wird archiviert — gleicher Grund, gleiche Kette."""
    grund = f"geringeres Vertrauen ({verlierer['trust']:.2f} < {sieger['trust']:.2f}) gegen {sieger['id']}"
    ziel = "superseded" if verlierer["status"] == "active" else "archived"
    ledger.transition(verlierer["id"], ziel, reason=grund, by=BY)


def _widersprueche() -> dict:
    """(2) Gleiche Art, gleicher normalisierter Titel, anderer Body, beide active/candidate.

    Standfestigkeitsregel: der Eintrag mit höherem Vertrauen bleibt, der niedrigere weicht; bei
    gleichem Vertrauen dispute(). Das Datum spielt keine Rolle — neuer heißt nicht wahrer.
    """
    gruppen: dict[tuple[str, str], list[dict]] = {}
    for e in _eintraege(("active", "candidate"), kinds=AUSSAGE_KINDS):
        gruppen.setdefault((e["kind"], _normalisiert(e["title"])), []).append(e)
    abgeloest = umstritten = 0
    for mitglieder in gruppen.values():
        if len({_normalisiert(e["body"]) for e in mitglieder}) < 2:
            continue
        # Höchstes Vertrauen zuerst; bei Gleichstand der ältere — nur für die Reihenfolge, nicht für den Sieg.
        mitglieder.sort(key=lambda e: (-float(e["trust"]), e["recorded_at"], e["id"]))
        sieger = mitglieder[0]
        for anderer in mitglieder[1:]:
            if _normalisiert(anderer["body"]) == _normalisiert(sieger["body"]):
                continue
            if float(anderer["trust"]) < float(sieger["trust"]):
                _weicht(anderer, sieger)
                abgeloest += 1
            else:
                ledger.dispute(sieger["id"], anderer["id"],
                               reason="gleiches Vertrauen, anderer Inhalt — kein Sieger durch Datum")
                umstritten += 1
    return {"abgeloest": abgeloest, "umstritten": umstritten}


def _abgelaufen(now: str) -> int:
    """(3) expires_at überschritten → archived."""
    n = 0
    for e in _eintraege(("active", "candidate")):
        if not e.get("expires_at"):
            continue
        try:
            ueberschritten = paths.days_between(e["expires_at"], now) > 0
        except ValueError:
            bus.emit("memory.takt_b.unlesbare_zeit", id=e["id"], expires_at=e["expires_at"])
            continue
        if ueberschritten:
            ledger.transition(e["id"], "archived", reason="abgelaufen", by=BY)
            n += 1
    return n


def _verblasst(now: str) -> int:
    """(4) Retention < 0,1 und keine aktiven derived_from-Kinder → archived. Sichtbarkeit, nicht Löschung."""
    eltern_mit_aktivem_kind: set[str] = set()
    for kind_eintrag in _eintraege(("active",)):
        eltern_mit_aktivem_kind.update(kind_eintrag.get("derived_from") or [])
    n = 0
    for e in _eintraege(("active", "candidate")):
        if e["id"] in eltern_mit_aktivem_kind:
            continue
        r = retention(e, now)
        if r < ARCHIV_RETENTION:
            ledger.transition(e["id"], "archived", reason=f"verblasst (Retention {r:.3f})", by=BY)
            n += 1
    return n


def _selbst_befoerdern() -> int:
    """(5) Selbst-Kandidaten mit Belegschwelle → active (selfmodel.promote_eligible, lazy)."""
    try:
        from core.memory import selfmodel  # lazy: eigenes Nachbarmodul, Schnittstelle ARCHITEKTUR 4.6
    except ImportError:
        return 0
    return len(selfmodel.promote_eligible())


def takt_b(now: str | None = None) -> dict:
    """Bestand ordnen, ohne Modellaufruf und ohne DELETE. Rückgabe: Zähler je Schritt.

    Reihenfolge wie ARCHITEKTUR 4.5: Dubletten, Widerspruch, Ablauf, Retention, Selbst. Zum
    Schluss ein Episoden-Eintrag „Konsolidierung" mit den Zahlen, damit der Lauf im Briefing
    auftauchen kann und die Kette ihn trägt.
    """
    now = _normalisiere_zeit(now, paths.now_iso())
    zaehler = {"dubletten": _dubletten()}
    zaehler.update(_widersprueche())
    zaehler["abgelaufen"] = _abgelaufen(now)
    zaehler["verblasst"] = _verblasst(now)
    zaehler["selbst_aktiviert"] = _selbst_befoerdern()
    zeilen = ", ".join(f"{k} {v}" for k, v in zaehler.items())
    protokoll_id = ledger.remember(
        "Konsolidierung", f"Takt B am {now}: {zeilen}.",
        kind="episode", source="werkzeug", source_ref=f"consolidate:takt_b:{now}",
        importance=1, tags=["konsolidierung"], valid_from=now, ttl_class="short",
        expires_at=_plus_tage(now, EPISODE_TTL_TAGE), agent=BY,
    )
    zaehler["protokoll_id"] = protokoll_id
    zaehler["now"] = now
    bus.emit("memory.takt_b", **{k: v for k, v in zaehler.items() if k != "now"})
    return zaehler
