"""Vertrag als Datei: Ziel, Nicht-Ziele, Eingaben, Proben, Budget — Urteil nur per Quittung.

Befund: Prüfer vor Ausführer +20,0 pp (84,0 % gegen 64,0 % SC@3, 01-BEFUNDE C1); Auflagen
als Text −15,3 bis −34,4 pp, obwohl 97,8 % davon im Arbeitsauftrag ankommen (01-BEFUNDE B2/B3).
Erz → Gold: SOUL mission.py — ein Vorhaben gleichzeitig, Prosa-Kriterien, `verdict` per
Default `not-evaluated`, aber jeder Aufrufer konnte close(verdict="pass") schreiben. Hier:
beliebig viele Verträge als Dateien, typisierte Proben als Pflicht (ohne Probe kein Auftrag),
ein kurzer Übergabetext, und `verdict` wandert nur über eine Quittung mit Hash und gelaufenen
Proben — auch save() nimmt kein Urteil ohne belegte Quittung an (R14 Ä1/N2/N5).
"""
from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Iterable

from . import bus, paths
from . import probes as _probes


class ContractError(ValueError):
    """Vertrag oder Quittung verletzt eine Regel; nichts wird geschrieben."""


STATUS = ("open", "running", "blocked", "delivered", "verified", "failed")
VERDICTS = ("not-evaluated", "pass", "fail")
FINAL_STATUS = ("verified", "failed")
DEFAULT_BUDGET = {"turns": 30, "tokens": 20000, "minutes": 30, "thinking": 4000}
RECEIPT_KEYS = ("contract_id", "probe_runs", "verdict", "verifier", "at", "hash")
VERIFIER_KINDS = ("deterministic", "model", "deterministic+model")

# Erlaubte Übergänge je Aktion: (Status vorher → Status nachher). Alles andere ist ContractError.
# verified/failed erreicht keine Aktion hier — nur set_verdict über eine Quittung.
_TRANSITIONS = {
    "start": {"open": "running", "blocked": "running", "failed": "running"},
    "block": {"open": "blocked", "running": "blocked", "delivered": "blocked"},
    "deliver": {"open": "delivered", "running": "delivered", "blocked": "delivered", "failed": "delivered"},
}


# --- Dateien -----------------------------------------------------------------------------
def _contract_file(id: str) -> Path:
    return paths.contracts_dir() / f"{Path(str(id)).name}.json"


def _write_json(path: Path, data: dict) -> None:
    """Atomar: erst .tmp, dann ersetzen — ein halber Vertrag ist keiner."""
    tmp = path.with_name(path.name + ".tmp")
    tmp.write_text(json.dumps(data, indent=2, ensure_ascii=False, default=str), encoding="utf-8")
    os.replace(tmp, path)


def canonical_json(obj) -> str:
    return json.dumps(obj, sort_keys=True, ensure_ascii=False, separators=(",", ":"), default=str)


def receipt_hash(receipt: dict) -> str:
    """sha256 des kanonischen JSON der Quittung ohne den Schlüssel "hash"."""
    body = {k: v for k, v in receipt.items() if k != "hash"}
    return paths.sha256_text(canonical_json(body))


def _status_for(verdict: str) -> str:
    return "verified" if verdict == "pass" else "failed"


def _merge_budget(budget: dict | None) -> dict:
    out = dict(DEFAULT_BUDGET)
    for k, v in (budget or {}).items():
        if k not in DEFAULT_BUDGET:
            raise ContractError(f"Unbekannter Budgetposten {k!r}; erlaubt: {', '.join(DEFAULT_BUDGET)}")
        if isinstance(v, bool) or not isinstance(v, int) or v < 1:
            raise ContractError(f"Budget {k} muss eine ganze Zahl ≥ 1 sein")
        out[k] = v
    return out


# --- Anlegen, Laden, Speichern -----------------------------------------------------------
def new(goal: str, probes: list[dict], *, non_goals: Iterable[str] = (), inputs: Iterable[str] = (),
        budget: dict | None = None, level: int = 1, parent: str | None = None, assignee: str = "",
        mission_id: str | None = None) -> dict:
    """Legt einen Vertrag an. Ohne Abnahmeprobe gibt es keinen Auftrag."""
    goal = (goal or "").strip()
    if not goal:
        raise ContractError("Auftrag ohne Ziel abgelehnt")
    probes = list(probes or [])
    if not probes:
        raise ContractError("Auftrag ohne Abnahmeprobe abgelehnt")
    for i, p in enumerate(probes, 1):
        try:
            _probes.validate(p)
        except _probes.ProbeError as exc:
            raise ContractError(f"Probe {i} ungültig: {exc}") from exc
    if isinstance(level, bool) or not isinstance(level, int) or level < 1:
        raise ContractError("level muss eine ganze Zahl ≥ 1 sein")
    if parent is not None and not _contract_file(parent).exists():
        raise ContractError(f"Übergeordneter Vertrag {parent} nicht gefunden")
    budget = _merge_budget(budget)
    now = paths.now_iso()
    c = {
        "id": paths.new_id(),
        "goal": goal,
        "non_goals": [str(x) for x in non_goals],
        "inputs": [str(x) for x in inputs],
        "probes": probes,
        "budget": budget,
        "level": level,
        "parent": parent,
        "assignee": assignee,
        "mission_id": mission_id,
        "status": "open",
        "verdict": "not-evaluated",
        "receipt": None,
        "artefacts": [],
        "report": "",
        "created_at": now,
        "updated_at": now,
        "log": [{"at": now, "event": "new", "probes": len(probes)}],
    }
    save(c)
    bus.emit("contract.new", id=c["id"], level=level, probes=len(probes), parent=parent,
             mission_id=mission_id)
    return c


def load(id: str) -> dict:
    path = _contract_file(id)
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        raise ContractError(f"Vertrag {id} nicht gefunden") from exc


def save(c: dict) -> None:
    """Schreibt den Vertrag atomar. Ein Urteil wird nur mit belegter Quittung angenommen."""
    _check_before_save(c)
    c["updated_at"] = paths.now_iso()
    _write_json(_contract_file(c["id"]), c)


def _check_before_save(c: dict) -> None:
    if not isinstance(c, dict) or not c.get("id"):
        raise ContractError("Vertrag ohne id")
    if c.get("status") not in STATUS:
        raise ContractError(f"Unbekannter Status {c.get('status')!r}")
    verdict = c.get("verdict", "not-evaluated")
    if verdict not in VERDICTS:
        raise ContractError(f"Unbekanntes Urteil {verdict!r}")
    if verdict == "not-evaluated":
        if c["status"] in FINAL_STATUS:
            raise ContractError("Status verified/failed nur mit Urteil aus einer Quittung")
        return
    ref = c.get("receipt")
    if not isinstance(ref, dict) or not ref.get("file"):
        raise ContractError("Urteil ohne Quittung abgelehnt")
    path = paths.receipts_dir() / Path(str(ref["file"])).name
    try:
        receipt = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        raise ContractError("Urteil ohne lesbare Quittung abgelehnt") from exc
    validate_receipt(receipt, c["id"])
    if receipt["hash"] != ref.get("hash") or receipt["verdict"] != verdict:
        raise ContractError("Urteil widerspricht der abgelegten Quittung")
    if c["status"] != _status_for(verdict):
        raise ContractError("Status passt nicht zum Urteil der Quittung")


def list_open() -> list[dict]:
    """Alle Verträge, deren Status nicht verified/failed ist, zeitlich sortiert."""
    out = []
    for path in sorted(paths.contracts_dir().glob("*.json")):
        try:
            c = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
        if isinstance(c, dict) and c.get("status") not in FINAL_STATUS:
            out.append(c)
    return out


# --- Lebenszyklus ------------------------------------------------------------------------
def _transition(id: str, action: str, **extra) -> dict:
    c = load(id)
    ziel = _TRANSITIONS[action].get(c["status"])
    if ziel is None:
        raise ContractError(f"Übergang '{action}' aus Status '{c['status']}' nicht erlaubt")
    vorher = c["status"]
    c["status"] = ziel
    c["log"].append({"at": paths.now_iso(), "event": action, "from": vorher, "to": ziel, **extra})
    save(c)
    bus.emit("contract.transition", id=id, action=action, **{"from": vorher, "to": ziel}, **extra)
    return c


def start(id: str) -> dict:
    return _transition(id, "start")


def block(id: str, reason: str) -> dict:
    reason = (reason or "").strip()
    if not reason:
        raise ContractError("Blockade ohne Grund abgelehnt")
    return _transition(id, "block", reason=reason)


def deliver(id: str, *, artefacts: Iterable[str] = (), report: str = "") -> dict:
    """Lieferung: Status delivered. Der Bericht ist eine Behauptung, kein Urteil."""
    artefacts = [str(a) for a in artefacts]
    c = _transition(id, "deliver", artefacts=len(artefacts), report_chars=len(report or ""))
    c["artefacts"] = artefacts
    c["report"] = report or ""
    c["log"][-1]["note"] = "Bericht ist Behauptung; Urteil erst durch Quittung"
    save(c)
    return c


# --- Quittung und Urteil -----------------------------------------------------------------
def validate_receipt(receipt: dict, contract_id: str) -> None:
    """Prüft Vollständigkeit, Zugehörigkeit, Probenläufe, Hash und innere Widerspruchsfreiheit."""
    if not isinstance(receipt, dict):
        raise ContractError("Quittung muss ein Objekt sein")
    fehlend = [k for k in RECEIPT_KEYS if k not in receipt]
    if fehlend:
        raise ContractError(f"Quittung unvollständig, es fehlt: {fehlend}")
    if receipt["contract_id"] != contract_id:
        raise ContractError("Quittung gehört zu einem anderen Vertrag")
    runs = receipt["probe_runs"]
    if not isinstance(runs, list) or not runs:
        raise ContractError("Quittung ohne Probenläufe abgelehnt")
    for r in runs:
        if not isinstance(r, dict) or not isinstance(r.get("passed"), bool):
            raise ContractError("Probenlauf ohne passed-Feld abgelehnt")
    if receipt["verdict"] not in ("pass", "fail"):
        raise ContractError("Quittung: verdict muss pass oder fail sein")
    v = receipt["verifier"]
    if not isinstance(v, dict) or "kind" not in v or "model" not in v:
        raise ContractError("Quittung: verifier braucht kind und model")
    if v["kind"] not in VERIFIER_KINDS:
        raise ContractError(f"Quittung: verifier.kind {v['kind']!r} unbekannt")
    if not isinstance(receipt["at"], str) or not receipt["at"]:
        raise ContractError("Quittung ohne Zeitstempel")
    if receipt["hash"] != receipt_hash(receipt):
        raise ContractError("Quittung: Hash stimmt nicht mit dem Inhalt überein")
    if receipt["verdict"] == "pass" and not all(r["passed"] for r in runs):
        raise ContractError("Quittung widerspricht ihren Probenläufen: pass trotz gescheiterter Probe")


def receipt_file_name(receipt: dict) -> str:
    ts = re.sub(r"[^0-9TZ]", "", str(receipt.get("at", ""))) or "ohne-zeit"
    return f"{Path(str(receipt['contract_id'])).name}-{ts}.json"


def write_receipt(receipt: dict) -> Path:
    """Legt die Quittung unter state/receipts ab (gleicher Hash → gleiche Datei) und gibt den Pfad zurück."""
    validate_receipt(receipt, receipt.get("contract_id"))
    path = paths.receipts_dir() / receipt_file_name(receipt)
    if path.exists():
        try:
            alt = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            alt = {}
        if alt.get("hash") != receipt["hash"]:
            path = path.with_name(f"{path.stem}-{receipt['hash'][:8]}.json")
    if not path.exists():
        _write_json(path, receipt)
    return path


def set_verdict(id: str, receipt: dict) -> dict:
    """DER eine Weg, ein Urteil zu setzen: nur mit gültiger Quittung (Hash, Probenläufe)."""
    c = load(id)
    validate_receipt(receipt, id)
    path = write_receipt(receipt)
    verdict = receipt["verdict"]
    vorher = c["status"]
    c["verdict"] = verdict
    c["status"] = _status_for(verdict)
    c["receipt"] = {"file": path.name, "hash": receipt["hash"], "at": receipt["at"],
                    "verifier": receipt["verifier"]}
    gescheitert = sum(1 for r in receipt["probe_runs"] if not r["passed"])
    c["log"].append({"at": paths.now_iso(), "event": "verdict", "from": vorher, "to": c["status"],
                     "verdict": verdict, "receipt": path.name, "probes": len(receipt["probe_runs"]),
                     "probes_failed": gescheitert})
    save(c)
    bus.emit("contract.verdict", id=id, verdict=verdict, verifier=receipt["verifier"].get("kind"),
             receipt=path.name, probes=len(receipt["probe_runs"]), probes_failed=gescheitert)
    return c


# --- Übergabetext ------------------------------------------------------------------------
def render_handover(id: str) -> str:
    """Kurzer Übergabetext für eine untere Ebene. Die Proben stehen wörtlich; sonst keine Auflagen.

    Gemessen: jeder zusätzliche Auflagentext kostet (−15,3 bis −34,4 pp), die Prüfung am Ende zählt.
    """
    c = load(id)
    b = c["budget"]
    zeilen = [f"Auftrag {c['id']} · Ebene {c['level']}", f"Ziel: {c['goal']}"]
    if c["non_goals"]:
        zeilen.append("Nicht-Ziele: " + "; ".join(c["non_goals"]))
    if c["inputs"]:
        zeilen.append("Eingaben: " + "; ".join(c["inputs"]))
    zeilen.append("Du siehst nicht: den Verlauf und das Gedächtnis des Auftraggebers; "
                  "du hast diesen Text und die Eingaben.")
    zeilen.append("Abnahmeproben (sie entscheiden, nicht dein Bericht):")
    for i, p in enumerate(c["probes"], 1):
        zeilen.append(f"  {i}. {_probes.describe(p)}")
    zeilen.append(f"Budget: {b['turns']} Züge, {b['tokens']} Tokens, {b['minutes']} Minuten, "
                  f"Denkbudget {b['thinking']} Tokens.")
    zeilen.append("Bei Blockade: melden, nicht improvisieren.")
    zeilen.append("Ohne gelaufene Probe lautet dein Ergebnis 'nicht geprüft', nie 'fertig'.")
    bus.emit("contract.handover", id=id, lines=len(zeilen))
    return "\n".join(zeilen)
