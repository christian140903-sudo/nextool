"""Vertrag als Datei: Ziel, Nicht-Ziele, Eingaben, Proben, Budget — Urteil nur per Quittung.

Befund: Prüfer vor Ausführer +20,0 pp (84,0 % gegen 64,0 % SC@3, 01-BEFUNDE C1); Auflagen
als Text −15,3 bis −34,4 pp, obwohl 97,8 % davon im Arbeitsauftrag ankommen (01-BEFUNDE B2/B3).
Erz → Gold: SOUL mission.py — ein Vorhaben gleichzeitig, Prosa-Kriterien, `verdict` per
Default `not-evaluated`, aber jeder Aufrufer konnte close(verdict="pass") schreiben. Hier:
beliebig viele Verträge als Dateien, typisierte Proben als Pflicht (ohne Probe kein Auftrag),
ein kurzer Übergabetext, und `verdict` wandert nur über eine Quittung mit Hash und wirklich
gelaufenen Proben — save() setzt gar kein Urteil mehr, nur set_verdict tut das (R14 Ä1/N2/N5).

Bindung der Quittung an den Vertrag (Angriffe a1 der adversarialen Prüfung und der Schlussprüfung):
- Lauf-Token: jeder probe_run mit passed=True muss ein gültiges Token aus probes.run tragen
  (HMAC über Probe, Vertrag und Lauf; Schlüssel unter SOUL10_HOME). Eine formgerechte, frei
  erfundene Quittung setzt damit KEIN Urteil mehr — die Form allein reicht nicht, die Probe
  muss gelaufen sein. Fail-closed: fehlt das Token, wird die Quittung abgelehnt.
- probes_hash: sha256 des kanonischen JSON der Vertragsproben; dazu müssen Anzahl und Typen
  der probe_runs den Proben in Reihenfolge entsprechen — eine erfundene Quittung mit einem
  Lauf für zwei Proben ist keine.
- contract_sha256: Fingerabdruck (fingerprint) des Vertrags zu Beginn der Prüfung; set_verdict
  nimmt eine Quittung nur an, wenn der Vertrag seither unverändert ist, jede Quittung nur
  einmal (ihr Hash steht danach im Log) und jedes Lauf-Token nur einmal (Replay abgelehnt).
- save() hält die Probenpflicht gegen den ANKER aus new() (probes_sha256, goal_sha256), nicht
  gegen den Plattenstand: wer die Vertragsdatei umschreibt, tauscht die Abnahmeproben nicht
  aus — ein Vertrag, dessen Proben oder Ziel vom Anker abweichen, ist beschädigt und nur noch
  als 'fail' schreibbar, also ohne menschlichen Eingriff nie wieder verifizierbar.
- save() ändert Urteil und Status nicht selbst: ein Urteil wandert nur durch set_verdict, ein
  Statuswechsel nur mit dem deckenden Log-Eintrag aus start/block/deliver/set_verdict. Jeder
  erfolgreiche Schreibvorgang hinterlässt eine Bus-Zeile (contract.save mit from/to).
- Eine Quittung mit unmaskiertem Secret-Muster (bus.SECRET_PATTERN) wird abgelehnt.
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
RECEIPT_KEYS = ("contract_id", "probes_hash", "contract_sha256", "probe_runs", "verdict", "verifier",
                "at", "hash")
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


def _read_json(path: Path) -> dict | None:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None
    return data if isinstance(data, dict) else None


def canonical_json(obj) -> str:
    try:
        return json.dumps(obj, sort_keys=True, ensure_ascii=False, separators=(",", ":"), default=str)
    except (TypeError, ValueError) as exc:
        raise ContractError(f"nicht kanonisierbar (nur JSON mit Textschlüsseln): {exc}") from exc


def receipt_hash(receipt: dict) -> str:
    """sha256 des kanonischen JSON der Quittung ohne den Schlüssel "hash"."""
    if not isinstance(receipt, dict):
        raise ContractError("Quittung muss ein Objekt sein")
    body = {k: v for k, v in receipt.items() if k != "hash"}
    return paths.sha256_text(canonical_json(body))


def probes_hash(probes: list[dict]) -> str:
    """sha256 des kanonischen JSON der Proben — bindet eine Quittung an genau diese Proben."""
    return paths.sha256_text(canonical_json(list(probes or [])))


def fingerprint(c: dict) -> str:
    """sha256 des kanonischen JSON des ganzen Vertrags (so, wie er auf Platte liegt)."""
    return paths.sha256_text(canonical_json(c))


def receipt_binding(c: dict) -> dict:
    """Die Bindungsfelder einer Quittung an diesen Vertrag in diesem Zustand."""
    return {"probes_hash": probes_hash(c.get("probes") or []), "contract_sha256": fingerprint(c)}


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


def _str_list(value, name: str) -> list[str]:
    """Ein einzelner Text wird zur Ein-Element-Liste, nicht zu seinen Zeichen."""
    if value is None:
        return []
    if isinstance(value, str):
        return [value]
    if isinstance(value, (bytes, dict)):
        raise ContractError(f"{name} muss eine Liste von Texten sein")
    return [str(x) for x in value]


def _validate_probes(probes) -> list[dict]:
    if not isinstance(probes, list) or not probes:
        raise ContractError("Auftrag ohne Abnahmeprobe abgelehnt")
    for i, p in enumerate(probes, 1):
        try:
            _probes.validate(p)
        except _probes.ProbeError as exc:
            raise ContractError(f"Probe {i} ungültig: {exc}") from exc
    return probes


# --- Anlegen, Laden, Speichern -----------------------------------------------------------
def new(goal: str, probes: list[dict], *, non_goals: Iterable[str] = (), inputs: Iterable[str] = (),
        budget: dict | None = None, level: int = 1, parent: str | None = None, assignee: str = "",
        mission_id: str | None = None) -> dict:
    """Legt einen Vertrag an. Ohne Abnahmeprobe gibt es keinen Auftrag."""
    goal = (goal or "").strip()
    if not goal:
        raise ContractError("Auftrag ohne Ziel abgelehnt")
    probes = _validate_probes(list(probes or []))
    if isinstance(level, bool) or not isinstance(level, int) or level < 1:
        raise ContractError("level muss eine ganze Zahl ≥ 1 sein")
    if parent is not None and not _contract_file(parent).exists():
        raise ContractError(f"Übergeordneter Vertrag {parent} nicht gefunden")
    budget = _merge_budget(budget)
    now = paths.now_iso()
    c = {
        "id": paths.new_id(),
        "goal": goal,
        "non_goals": _str_list(non_goals, "non_goals"),
        "inputs": _str_list(inputs, "inputs"),
        "probes": probes,
        # Anker: einmal in new() gesetzt, nie danach. _check_before_save vergleicht dagegen,
        # nicht gegen die Platte — eine Shell-Probe schreibt die Platte, den Anker nicht.
        "probes_sha256": probes_hash(probes),
        "goal_sha256": paths.sha256_text(goal),
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
    """Schreibt den Vertrag atomar und hinterlässt eine Bus-Zeile. Ein Urteil wird nur mit
    belegter Quittung und nur durch set_verdict angenommen; ein Statuswechsel nur mit dem
    Log-Eintrag, der ihn deckt; Proben und Ziel sind gegen den Anker aus new() unveränderlich."""
    disk = _read_json(_contract_file(c["id"])) if isinstance(c, dict) and c.get("id") else None
    _check_before_save(c, disk)
    c["updated_at"] = paths.now_iso()
    _write_json(_contract_file(c["id"]), c)
    bus.emit("contract.save", id=c["id"], **{"from": (disk or {}).get("status")}, to=c["status"],
             verdict=c.get("verdict"), aktion=(c.get("log") or [{}])[-1].get("event"))


# Solange set_verdict eine Quittung anwendet, steht hier ihr Hash: nur dieser eine Schreibvorgang
# darf Urteil und Quittungsverweis ändern. Alles andere ist ein Urteil an der Prüfung vorbei.
_VERDICT_GATE: str | None = None


def _receipt_hash_of(c: dict | None) -> str | None:
    ref = (c or {}).get("receipt")
    return ref.get("hash") if isinstance(ref, dict) else None


def _check_before_save(c: dict, disk: dict | None = None) -> None:
    if not isinstance(c, dict) or not c.get("id"):
        raise ContractError("Vertrag ohne id")
    if c.get("status") not in STATUS:
        raise ContractError(f"Unbekannter Status {c.get('status')!r}")
    verdict = c.get("verdict", "not-evaluated")
    if verdict not in VERDICTS:
        raise ContractError(f"Unbekanntes Urteil {verdict!r}")
    # Probenpflicht gilt bei jedem Schreiben, nicht nur beim Anlegen.
    probes = c.get("probes")
    if not isinstance(probes, list) or not probes or not all(isinstance(p, dict) for p in probes):
        raise ContractError("Vertrag ohne Abnahmeprobe wird nicht gespeichert")
    if disk is None:
        disk = _read_json(_contract_file(c["id"]))
    beschaedigt = _anker_pruefen(c, disk)
    # Ein beschädigter Vertrag darf nur noch sein Scheitern festhalten, nie wieder bestehen.
    if beschaedigt and not (verdict == "fail" and c["status"] == "failed"):
        raise ContractError(f"{beschaedigt} — Proben und Ziel sind nach dem Anlegen unveränderlich; "
                            f"dieser Vertrag ist beschädigt und nur noch als 'fail' schreibbar")
    if verdict == "not-evaluated":
        if c["status"] in FINAL_STATUS:
            raise ContractError("Status verified/failed nur mit Urteil aus einer Quittung")
        _statuswechsel_pruefen(c, disk)
        _urteil_gate(c, disk, verdict)
        return
    if c["status"] == "open":
        raise ContractError("Ein Vertrag mit Urteil ist nicht mehr offen")
    ref = c.get("receipt")
    if not isinstance(ref, dict) or not ref.get("file"):
        raise ContractError("Urteil ohne Quittung abgelehnt")
    path = paths.receipts_dir() / Path(str(ref["file"])).name
    try:
        receipt = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        raise ContractError("Urteil ohne lesbare Quittung abgelehnt") from exc
    validate_receipt(receipt, c)
    if receipt["hash"] != ref.get("hash") or receipt["verdict"] != verdict:
        raise ContractError("Urteil widerspricht der abgelegten Quittung")
    # Nacharbeit nach fail (running/delivered) lässt das letzte Urteil stehen; ein Endstatus muss passen.
    if c["status"] in FINAL_STATUS and c["status"] != _status_for(verdict):
        raise ContractError("Status passt nicht zum Urteil der Quittung")
    juengste = _newest_receipt_at(c["id"])
    if juengste is not None and str(receipt["at"]) < juengste:
        raise ContractError("Urteil verweist auf eine ältere Quittung; eine jüngere liegt vor")
    # Gleiche Sekunde entscheidet nichts: die zuletzt angewendete Quittung steht im Log.
    urteile = [e for e in c.get("log") or [] if isinstance(e, dict) and e.get("event") == "verdict"]
    if urteile and urteile[-1].get("receipt_hash") and urteile[-1]["receipt_hash"] != receipt["hash"]:
        raise ContractError("Urteil verweist nicht auf die zuletzt angewendete Quittung")
    _statuswechsel_pruefen(c, disk)
    _urteil_gate(c, disk, verdict)


def _urteil_gate(c: dict, disk: dict | None, verdict: str) -> None:
    """Urteil und Quittungsverweis ändert nur set_verdict — sonst setzt ein save() ein Urteil an
    der Prüfung vorbei, ohne Replay-Sperre und ohne verbrauchte Lauf-Token (Schlussbefund 191)."""
    if _VERDICT_GATE is not None and _receipt_hash_of(c) == _VERDICT_GATE:
        return
    if verdict != (disk or {}).get("verdict", "not-evaluated") or _receipt_hash_of(c) != _receipt_hash_of(disk):
        raise ContractError("Ein Urteil wandert nur über set_verdict in den Vertrag")


def damaged(c: dict) -> str:
    """Leerer Text, wenn Proben und Ziel zum Anker aus new() passen; sonst der Schaden als Text.
    Ein beschädigter Vertrag ist nur noch als 'fail' schreibbar — wer die Vertragsdatei umschreibt,
    tauscht die Abnahmeproben nicht aus, er zerstört den Vertrag (Schlussbefund contract.py:211)."""
    anker_p, anker_z = (c or {}).get("probes_sha256"), (c or {}).get("goal_sha256")
    if anker_p and probes_hash((c or {}).get("probes") or []) != anker_p:
        return "Die Proben weichen vom Anker aus new() ab"
    if anker_z and paths.sha256_text(str((c or {}).get("goal") or "")) != anker_z:
        return "Das Ziel weicht vom Anker aus new() ab"
    return ""


def _anker_pruefen(c: dict, disk: dict | None) -> str:
    """Vergleicht Proben und Ziel gegen den Anker aus new(); gibt den Schaden als Text zurück
    (leer, wenn alles stimmt). Ohne Anker (Verträge von Hand) bleibt der Plattenvergleich."""
    if disk is None:
        _validate_probes(c["probes"])
    else:
        for k in ("probes_sha256", "goal_sha256"):
            if c.get(k) != disk.get(k):
                raise ContractError("Der Anker aus new() (probes_sha256/goal_sha256) ist unveränderlich")
    if not c.get("probes_sha256") and not c.get("goal_sha256"):
        if disk is not None and c["probes"] != disk.get("probes"):
            raise ContractError("Proben sind nach dem Anlegen unveränderlich")
        if disk is not None and c.get("goal") != disk.get("goal"):
            raise ContractError("Ziel ist nach dem Anlegen unveränderlich")
        return ""
    return damaged(c)


def _statuswechsel_pruefen(c: dict, disk: dict | None) -> None:
    """Ein Statuswechsel braucht den Log-Eintrag, der ihn deckt — sonst verschwindet ein Vertrag
    per save() spurlos aus dem Prüfgate (Schlussbefund contract.py:191)."""
    if disk is None or c["status"] == disk.get("status"):
        return
    log = c.get("log") or []
    letzte = log[-1] if log and isinstance(log[-1], dict) else {}
    frisch = len(log) > len(disk.get("log") or [])
    passt = letzte.get("from") == disk.get("status") and letzte.get("to") == c["status"]
    gedeckt = (_TRANSITIONS.get(str(letzte.get("event")), {}).get(disk.get("status")) == c["status"]
               or (letzte.get("event") == "verdict" and _VERDICT_GATE is not None))
    if not (frisch and passt and gedeckt):
        raise ContractError(f"Statuswechsel {disk.get('status')!r} → {c['status']!r} ohne deckenden "
                            f"Log-Eintrag; erlaubt sind start, block, deliver und set_verdict")


def _newest_receipt_at(id: str) -> str | None:
    """Der jüngste Zeitstempel unter den Quittungen dieses Vertrags auf Platte."""
    stamps = []
    for path in paths.receipts_dir().glob(f"{Path(str(id)).name}-*.json"):
        data = _read_json(path)
        if data and data.get("contract_id") == id and isinstance(data.get("at"), str):
            stamps.append(data["at"])
    return max(stamps) if stamps else None


def snapshot() -> dict:
    """Alle Vertragsdateien so, wie sie jetzt auf Platte liegen (id → Rohtext). Grundlage dafür,
    dass eine Shell-Probe keinen Vertrag umschreibt — auch keinen fremden."""
    out = {}
    for pfad in sorted(paths.contracts_dir().glob("*.json")):
        try:
            out[pfad.stem] = pfad.read_text(encoding="utf-8")
        except OSError:
            continue
    return out


def restore(vorher: dict) -> list[str]:
    """Nimmt jede Änderung an den Verträgen aus `vorher` zurück (auch gelöschte); Verträge, die
    seither neu entstanden sind, bleiben stehen. Gibt die betroffenen ids zurück, je eine Bus-Zeile.
    Was eine Probe an Verträgen anrichtet, hält damit nicht — und zählt als contract_changed."""
    geaendert = []
    for id, roh in (vorher or {}).items():
        pfad = _contract_file(id)
        try:
            jetzt = pfad.read_text(encoding="utf-8")
        except OSError:
            jetzt = None
        if jetzt == roh:
            continue
        geaendert.append(id)
        try:
            tmp = pfad.with_name(pfad.name + ".tmp")
            tmp.write_text(roh, encoding="utf-8")
            os.replace(tmp, pfad)
            zurueck = True
        except OSError:
            zurueck = False
        bus.emit("contract.restore", id=id, weg=jetzt is None, wiederhergestellt=zurueck)
    return sorted(geaendert)


def list_open() -> list[dict]:
    """Alle Verträge, deren Status nicht verified/failed ist, zeitlich sortiert."""
    out = []
    for path in sorted(paths.contracts_dir().glob("*.json")):
        c = _read_json(path)
        if c is not None and c.get("status") not in FINAL_STATUS:
            out.append(c)
    return out


# --- Lebenszyklus ------------------------------------------------------------------------
def _transition(id: str, action: str, *, felder: dict | None = None, **extra) -> dict:
    c = load(id)
    ziel = _TRANSITIONS[action].get(c["status"])
    if ziel is None:
        raise ContractError(f"Übergang '{action}' aus Status '{c['status']}' nicht erlaubt")
    vorher = c["status"]
    c["status"] = ziel
    c.update(felder or {})          # Nutzlast des Übergangs (Artefakte, Bericht): EIN Schreibvorgang
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
    return _transition(id, "deliver", felder={"artefacts": artefacts, "report": report or ""},
                       artefacts=len(artefacts), report_chars=len(report or ""),
                       note="Bericht ist Behauptung; Urteil erst durch Quittung")


# --- Quittung und Urteil -----------------------------------------------------------------
def validate_receipt(receipt: dict, contract: dict | str) -> None:
    """Prüft Vollständigkeit, Zugehörigkeit, Probenläufe, Hash, Bindung an die Vertragsproben
    (probes_hash, Anzahl und Typen der Läufe), das Lauf-Token jedes bestandenen Laufs,
    Maskierung und innere Widerspruchsfreiheit.
    `contract` ist der Vertrag oder seine id (dann wird er geladen)."""
    if not isinstance(receipt, dict):
        raise ContractError("Quittung muss ein Objekt sein")
    fehlend = [k for k in RECEIPT_KEYS if k not in receipt]
    if fehlend:
        raise ContractError(f"Quittung unvollständig, es fehlt: {fehlend}")
    contract_id = contract["id"] if isinstance(contract, dict) else contract
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
    if bus.SECRET_PATTERN.search(canonical_json(receipt)):
        raise ContractError("Quittung enthält ein unmaskiertes Secret-Muster")
    c = contract if isinstance(contract, dict) else load(contract)
    probes = c.get("probes") or []
    if receipt["probes_hash"] != probes_hash(probes):
        raise ContractError("Quittung gehört zu anderen Proben als denen des Vertrags (probes_hash)")
    if len(runs) != len(probes):
        raise ContractError(f"Quittung nennt {len(runs)} Probenlauf/-läufe, der Vertrag hat {len(probes)} Proben")
    for i, (r, p) in enumerate(zip(runs, probes), 1):
        if r.get("type") != (p.get("type") if isinstance(p, dict) else None):
            raise ContractError(f"Probenlauf {i} hat Typ {r.get('type')!r}, Probe {i} des Vertrags ist "
                                f"{p.get('type') if isinstance(p, dict) else None!r}")
        # Der Kern: ein bestandener Lauf zählt nur, wenn probes.run ihn wirklich hat laufen lassen.
        # Ein gescheiterter Lauf braucht kein Token — aus ihm wird nie ein „fertig".
        if r.get("passed") is True:
            grund = _probes.check_run_token(r, p, contract_id)
            if grund:
                raise ContractError(f"Probenlauf {i} gilt als bestanden, ist aber {grund}")
    if receipt["verdict"] == "pass" and not all(r["passed"] for r in runs):
        raise ContractError("Quittung widerspricht ihren Probenläufen: pass trotz gescheiterter Probe")


def receipt_file_name(receipt: dict) -> str:
    ts = re.sub(r"[^0-9TZ]", "", str(receipt.get("at", ""))) or "ohne-zeit"
    return f"{Path(str(receipt['contract_id'])).name}-{ts}.json"


def write_receipt(receipt: dict) -> Path:
    """Legt die Quittung unter state/receipts ab (gleicher Hash → gleiche Datei) und gibt den Pfad zurück."""
    validate_receipt(receipt, receipt.get("contract_id") if isinstance(receipt, dict) else None)
    path = paths.receipts_dir() / receipt_file_name(receipt)
    if path.exists():
        alt = _read_json(path) or {}
        if alt.get("hash") != receipt["hash"]:
            path = path.with_name(f"{path.stem}-{receipt['hash'][:8]}.json")
    if not path.exists():
        _write_json(path, receipt)
    return path


def set_verdict(id: str, receipt: dict) -> dict:
    """DER eine Weg, ein Urteil zu setzen: nur mit gültiger Quittung (Hash, Probenläufe, Bindung),
    nur einmal je Quittung und nur, wenn der Vertrag seit Beginn der Prüfung unverändert ist."""
    c = load(id)
    validate_receipt(receipt, c)
    if any(e.get("event") == "verdict" and e.get("receipt_hash") == receipt["hash"] for e in c.get("log", [])):
        raise ContractError("Quittung wurde bereits angewendet (Replay abgelehnt)")
    if receipt["contract_sha256"] != fingerprint(c):
        raise ContractError("Quittung veraltet: der Vertrag hat sich seit Beginn der Prüfung verändert")
    verbraucht = [i for i, r in enumerate(receipt["probe_runs"], 1)
                  if r.get("passed") is True and _probes.run_token_used(r)]
    if verbraucht:
        raise ContractError(f"Lauf-Token der Probenläufe {verbraucht} sind schon verbraucht "
                            f"(dieselben Läufe setzen kein zweites Urteil)")
    path = write_receipt(receipt)
    verdict = receipt["verdict"]
    vorher = c["status"]
    c["verdict"] = verdict
    c["status"] = _status_for(verdict)
    c["receipt"] = {"file": path.name, "hash": receipt["hash"], "at": receipt["at"],
                    "verifier": receipt["verifier"]}
    gescheitert = sum(1 for r in receipt["probe_runs"] if not r["passed"])
    c["log"].append({"at": paths.now_iso(), "event": "verdict", "from": vorher, "to": c["status"],
                     "verdict": verdict, "receipt": path.name, "receipt_hash": receipt["hash"],
                     "probes": len(receipt["probe_runs"]), "probes_failed": gescheitert,
                     "contract_changed": bool(receipt.get("contract_changed", False))})
    global _VERDICT_GATE
    _VERDICT_GATE = receipt["hash"]
    try:
        save(c)
    finally:
        _VERDICT_GATE = None
    _probes.spend_run_tokens(receipt["probe_runs"])
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
