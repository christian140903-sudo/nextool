"""Vorhersagen mit Konfidenz und Fälligkeit, Auflösung gegen den Ausgang, Brier je Domäne und Modell.

Befund: M1 (ENTSCHEIDUNG §4, 2026-09-07, n=75 je Arm) hat Überraschung als Schalter widerlegt —
Überraschungsrate 92,0 %, Spezifität 8 %, +4,0 pp bei p=0,595; deshalb ist die Vorhersage hier
Kalibrierung und kein Schalter. Verbalisierte Konfidenz ist bei RLHF-Modellen besser kalibriert
als Token-Wahrscheinlichkeiten (ECE ≈ −50 %, R08 §1.8), aber je Modell und Domäne zu messen
(D035, R08 §4.5).
Erz → Gold: Soul 5.0 N3 nannte Kalibrierung als Zielbild ohne Tabelle und ohne Takt; R05 §3.3
2(e) sah die Auflösung fälliger Vorhersagen im Takt B vor. Hier: predictions-Tabelle des
Hauptbuchs, Brier = (Konfidenz − Ausgang)², due() über paths.parse_iso, calibration() mit fünf
Eimern und Filter je Domäne und Modell (Messgröße I5). Keine Vorhersage wird gelöscht oder
zweimal aufgelöst.

Bezeichner englisch (wie das Schema), Kommentare deutsch.
"""
from __future__ import annotations

from contextlib import closing

from core import bus, paths
from core.memory import ledger

# Fünf Eimer über [0, 1]: der letzte schließt 1.0 ein.
BUCKETS = ((0.0, 0.2), (0.2, 0.4), (0.4, 0.6), (0.6, 0.8), (0.8, 1.0))


class PredictError(ValueError):
    """Ungültige Vorhersage oder ungültige Auflösung. Fail-closed."""


# --- Hilfen -----------------------------------------------------------------------------------
def _normalize_iso(text: str) -> str:
    """Zeitangabe über paths.parse_iso prüfen und als UTC-Sekunden-ISO ablegen."""
    try:
        return paths.parse_iso(text).strftime("%Y-%m-%dT%H:%M:%SZ")
    except ValueError as exc:
        raise PredictError(f"Ungültige Fälligkeit {text!r}: {exc}") from exc


def _bucket_index(confidence: float) -> int:
    return min(int(confidence * len(BUCKETS)), len(BUCKETS) - 1)


def brier(confidence: float, outcome: bool) -> float:
    """Brier-Wert einer einzelnen Vorhersage: (Konfidenz − Ausgang)². 0 ist perfekt, 1 maximal falsch."""
    return (float(confidence) - int(bool(outcome))) ** 2


# --- Schreiben --------------------------------------------------------------------------------
def predict(claim: str, confidence: float, *, domain: str = "allgemein", model_id: str = "",
            due_at: str | None = None, contract_id: str | None = None) -> str:
    """Legt eine Vorhersage an. Konfidenz muss in [0, 1] liegen, die Behauptung darf nicht leer sein."""
    claim = (claim or "").strip()
    if not claim:
        raise PredictError("Vorhersage ohne Behauptung abgelehnt")
    try:
        confidence = float(confidence)
    except (TypeError, ValueError) as exc:
        raise PredictError(f"Konfidenz {confidence!r} ist keine Zahl") from exc
    if not 0.0 <= confidence <= 1.0:
        raise PredictError(f"Konfidenz {confidence} liegt außerhalb von [0, 1]")
    domain = (domain or "allgemein").strip() or "allgemein"
    due_iso = _normalize_iso(due_at) if due_at else None
    prediction_id = paths.new_id()
    with closing(ledger.connect()) as con, con:
        con.execute(
            "INSERT INTO predictions (id, claim, confidence, domain, model_id, due_at, resolved_at,"
            " outcome, brier, contract_id, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
            (prediction_id, claim, confidence, domain, model_id or "", due_iso, None, None, None,
             contract_id, paths.now_iso()),
        )
    ledger.append_ledger("predict", prediction_id, by="predict", confidence=confidence, domain=domain)
    bus.emit("memory.predict", id=prediction_id, confidence=confidence, domain=domain,
             model_id=model_id or "", due_at=due_iso, contract_id=contract_id)
    return prediction_id


def get(id: str) -> dict | None:
    """Eine Vorhersage als dict; None, wenn unbekannt."""
    with closing(ledger.connect()) as con:
        row = con.execute("SELECT * FROM predictions WHERE id = ?", (id,)).fetchone()
    return dict(row) if row is not None else None


def resolve(id: str, outcome: bool) -> dict:
    """Löst eine Vorhersage gegen den Ausgang auf: brier = (confidence − int(outcome))².

    Eine unbekannte oder bereits aufgelöste Vorhersage wirft PredictError — der erste Ausgang
    bleibt stehen, eine nachträgliche Umdeutung ist kein Ausgang.
    """
    row = get(id)
    if row is None:
        raise PredictError(f"Keine Vorhersage mit id {id!r}")
    if row["resolved_at"] is not None:
        raise PredictError(f"Vorhersage {id!r} ist bereits aufgelöst (Ausgang {row['outcome']})")
    outcome_int = int(bool(outcome))
    score = brier(row["confidence"], outcome_int)
    now = paths.now_iso()
    with closing(ledger.connect()) as con, con:
        con.execute(
            "UPDATE predictions SET resolved_at = ?, outcome = ?, brier = ? WHERE id = ?",
            (now, outcome_int, score, id),
        )
    ledger.append_ledger("resolve", id, by="predict", outcome=bool(outcome))
    bus.emit("memory.resolve", id=id, outcome=outcome_int, brier=score,
             confidence=row["confidence"], domain=row["domain"], model_id=row["model_id"])
    return get(id)


# --- Lesen ------------------------------------------------------------------------------------
def due(now: str | None = None) -> list[dict]:
    """Unaufgelöste Vorhersagen mit due_at ≤ now, früheste zuerst. Ohne due_at ist nichts fällig."""
    now_iso = _normalize_iso(now) if now else paths.now_iso()
    with closing(ledger.connect()) as con:
        rows = con.execute(
            "SELECT * FROM predictions WHERE resolved_at IS NULL AND due_at IS NOT NULL"
            " ORDER BY due_at, id"
        ).fetchall()
    out = [dict(r) for r in rows if paths.days_between(r["due_at"], now_iso) >= 0.0]
    bus.emit("memory.predictions_due", n=len(out), now=now_iso)
    return out


def calibration(*, domain: str | None = None, model_id: str | None = None) -> dict:
    """Kalibrierung über aufgelöste Vorhersagen: {"n", "brier", "buckets", "unresolved"}.

    brier = Mittel der Einzelwerte (None ohne Auflösungen). buckets = fünf Eimer mit
    {"lo", "hi", "n", "mean_conf", "hit_rate"}; leere Eimer tragen None statt einer erfundenen 0.
    domain/model_id filtern, wenn gesetzt.
    """
    where = ["resolved_at IS NOT NULL"]
    args: list = []
    if domain is not None:
        where.append("domain = ?")
        args.append(domain)
    if model_id is not None:
        where.append("model_id = ?")
        args.append(model_id)
    clause = " AND ".join(where)
    with closing(ledger.connect()) as con:
        rows = con.execute(
            f"SELECT confidence, outcome, brier FROM predictions WHERE {clause}", args  # noqa: S608 — feste Spalten
        ).fetchall()
        unresolved = con.execute(
            "SELECT COUNT(*) FROM predictions WHERE " + clause.replace("IS NOT NULL", "IS NULL", 1),
            args,
        ).fetchone()[0]
    sums = [{"n": 0, "conf": 0.0, "hits": 0} for _ in BUCKETS]
    total_brier = 0.0
    for row in rows:
        b = sums[_bucket_index(row["confidence"])]
        b["n"] += 1
        b["conf"] += float(row["confidence"])
        b["hits"] += int(row["outcome"] or 0)
        total_brier += float(row["brier"])
    n = len(rows)
    buckets = []
    for (lo, hi), b in zip(BUCKETS, sums):
        buckets.append({
            "lo": lo, "hi": hi, "n": b["n"],
            "mean_conf": (b["conf"] / b["n"]) if b["n"] else None,
            "hit_rate": (b["hits"] / b["n"]) if b["n"] else None,
        })
    mean_brier = (total_brier / n) if n else None
    bus.emit("memory.calibration", n=n, brier=mean_brier, unresolved=unresolved,
             domain=domain, model_id=model_id)
    return {"n": n, "brier": mean_brier, "buckets": buckets, "unresolved": unresolved}
