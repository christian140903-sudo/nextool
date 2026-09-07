"""Vertrag: ohne Probe kein Auftrag; Lebenszyklus in einer Funktion; Urteil nur per gültiger Quittung."""
import json
import re

import pytest

from core import bus, contract, paths

PROBE = {"type": "answer", "expected": 42}
SCHWEIGEKLAUSEL = re.compile(r"\bstill\b|unsichtbar|nur das Ergebnis|keine Zwischenschritte|erscheint nie im Text|\bsilent|invisibl", re.I)


def _vertrag(**kw):
    return contract.new("Was ist 6*7? Antworte nur mit der Zahl.", [PROBE], **kw)


def _quittung(cid, *, passed=True, verdict=None, runs=None):
    q = {
        "contract_id": cid,
        "probe_runs": runs if runs is not None else [
            {"type": "answer", "passed": passed, "detail": "x", "stdout_head": "", "exit": None, "at": paths.now_iso()}],
        "verdict": verdict or ("pass" if passed else "fail"),
        "verifier": {"kind": "deterministic", "model": None},
        "at": paths.now_iso(),
    }
    q["hash"] = contract.receipt_hash(q)
    return q


def test_ohne_probe_kein_auftrag():
    with pytest.raises(contract.ContractError, match="Auftrag ohne Abnahmeprobe abgelehnt"):
        contract.new("Ziel", [])
    with pytest.raises(contract.ContractError, match="Auftrag ohne Abnahmeprobe abgelehnt"):
        contract.new("Ziel", None)
    assert list(paths.contracts_dir().glob("*.json")) == []


def test_ungueltige_probe_wird_abgelehnt():
    with pytest.raises(contract.ContractError, match="Probe 1 ungültig"):
        contract.new("Ziel", [{"type": "shell"}])
    with pytest.raises(contract.ContractError, match="Probe 2 ungültig"):
        contract.new("Ziel", [PROBE, {"type": "answer", "expected": "x", "extract": "last_number"}])
    with pytest.raises(contract.ContractError, match="ohne Ziel"):
        contract.new("   ", [PROBE])
    assert list(paths.contracts_dir().glob("*.json")) == []


def test_new_schreibt_datei_mit_defaults_und_bus():
    c = _vertrag(non_goals=["kein Code"], inputs=["Zahl 6", "Zahl 7"], budget={"turns": 5})
    datei = paths.contracts_dir() / f"{c['id']}.json"
    assert datei.exists()
    assert c["status"] == "open" and c["verdict"] == "not-evaluated" and c["receipt"] is None
    assert c["budget"] == {"turns": 5, "tokens": 20000, "minutes": 30, "thinking": 4000}
    assert c["level"] == 1 and c["probes"] == [PROBE]
    assert contract.load(c["id"]) == c
    assert bus.tail(1)[0]["event"] == "contract.new"
    with pytest.raises(contract.ContractError):
        _vertrag(budget={"unsinn": 1})
    with pytest.raises(contract.ContractError):
        _vertrag(parent="gibt-es-nicht")


def test_load_unbekannt():
    with pytest.raises(contract.ContractError, match="nicht gefunden"):
        contract.load("nix")


def test_lebenszyklus_und_illegale_uebergaenge():
    c = _vertrag()
    cid = c["id"]
    assert contract.start(cid)["status"] == "running"
    with pytest.raises(contract.ContractError):
        contract.start(cid)  # running → running gibt es nicht
    b = contract.block(cid, "Eingabe fehlt")
    assert b["status"] == "blocked" and b["log"][-1]["reason"] == "Eingabe fehlt"
    with pytest.raises(contract.ContractError, match="ohne Grund"):
        contract.block(cid, "")
    assert contract.start(cid)["status"] == "running"
    d = contract.deliver(cid, artefacts=["out.txt"], report="fertig, alles gut")
    assert d["status"] == "delivered" and d["artefacts"] == ["out.txt"] and d["report"] == "fertig, alles gut"
    assert "Behauptung" in d["log"][-1]["note"]
    assert d["verdict"] == "not-evaluated"  # eine Lieferung ist kein Urteil
    with pytest.raises(contract.ContractError):
        contract.deliver(cid)  # delivered → delivered nicht erlaubt
    with pytest.raises(contract.ContractError):
        contract.start(cid)  # delivered → running nicht erlaubt
    assert bus.tail(1)[0]["event"] == "contract.transition"


def test_verdict_ohne_quittung_unmoeglich():
    c = _vertrag()
    cid = c["id"]
    # Weg 1: verdict direkt setzen und speichern
    c["verdict"], c["status"] = "pass", "verified"
    with pytest.raises(contract.ContractError, match="Urteil ohne Quittung"):
        contract.save(c)
    # Weg 2: Status verified ohne Urteil
    c = contract.load(cid)
    c["status"] = "verified"
    with pytest.raises(contract.ContractError):
        contract.save(c)
    # Weg 3: Verweis auf eine Quittungsdatei, die es nicht gibt
    c = contract.load(cid)
    c["verdict"], c["status"] = "pass", "verified"
    c["receipt"] = {"file": "erfunden.json", "hash": "0" * 64}
    with pytest.raises(contract.ContractError):
        contract.save(c)
    # Weg 4: gültige fail-Quittung liegt da, Vertrag behauptet pass
    q = _quittung(cid, passed=False)
    pfad = contract.write_receipt(q)
    c = contract.load(cid)
    c["verdict"], c["status"] = "pass", "verified"
    c["receipt"] = {"file": pfad.name, "hash": q["hash"]}
    with pytest.raises(contract.ContractError, match="widerspricht"):
        contract.save(c)
    auf_platte = contract.load(cid)
    assert auf_platte["verdict"] == "not-evaluated" and auf_platte["status"] == "open"


def test_gefaelschter_hash_wird_abgelehnt():
    cid = _vertrag()["id"]
    q = _quittung(cid)
    q["hash"] = "0" * 64
    with pytest.raises(contract.ContractError, match="Hash"):
        contract.set_verdict(cid, q)
    assert contract.load(cid)["verdict"] == "not-evaluated"
    assert list(paths.receipts_dir().glob("*.json")) == []


def test_nach_dem_hash_manipulierte_quittung_wird_abgelehnt():
    cid = _vertrag()["id"]
    q = _quittung(cid, passed=False)          # ehrlich: fail
    q["verdict"] = "pass"                     # gefälscht, Hash passt nicht mehr
    with pytest.raises(contract.ContractError, match="Hash"):
        contract.set_verdict(cid, q)
    q2 = _quittung(cid, passed=False)
    q2["probe_runs"][0]["passed"] = True     # Probenlauf nachträglich gedreht
    with pytest.raises(contract.ContractError, match="Hash"):
        contract.set_verdict(cid, q2)
    assert contract.load(cid)["verdict"] == "not-evaluated"


def test_quittung_ohne_probenlaeufe_wird_abgelehnt():
    cid = _vertrag()["id"]
    q = _quittung(cid, runs=[])               # Hash gültig, aber nichts ist gelaufen
    with pytest.raises(contract.ContractError, match="ohne Probenläufe"):
        contract.set_verdict(cid, q)
    q = _quittung(cid, runs=[{"type": "answer", "detail": "ohne passed"}])
    with pytest.raises(contract.ContractError, match="passed"):
        contract.set_verdict(cid, q)
    q = _quittung(cid)
    del q["verifier"]
    q["hash"] = contract.receipt_hash(q)
    with pytest.raises(contract.ContractError, match="unvollständig"):
        contract.set_verdict(cid, q)
    fremd = _quittung("anderer-vertrag")
    with pytest.raises(contract.ContractError, match="anderen Vertrag"):
        contract.set_verdict(cid, fremd)
    assert contract.load(cid)["verdict"] == "not-evaluated"


def test_pass_trotz_gescheiterter_probe_widerspricht_sich():
    cid = _vertrag()["id"]
    q = _quittung(cid, passed=False, verdict="pass")   # Hash korrekt, Inhalt widersprüchlich
    with pytest.raises(contract.ContractError, match="widerspricht"):
        contract.set_verdict(cid, q)
    assert contract.load(cid)["verdict"] == "not-evaluated"


def test_gueltige_quittung_setzt_urteil():
    cid = _vertrag()["id"]
    contract.deliver(cid, report="42")
    q = _quittung(cid, passed=True)
    c = contract.set_verdict(cid, q)
    assert c["status"] == "verified" and c["verdict"] == "pass"
    datei = paths.receipts_dir() / c["receipt"]["file"]
    assert datei.exists() and json.loads(datei.read_text())["hash"] == q["hash"]
    assert c["receipt"]["file"].startswith(cid + "-")
    assert bus.tail(1)[0]["event"] == "contract.verdict"
    assert contract.load(cid) == c
    # Zweite Prüfung darf das Urteil ehrlich kippen
    c2 = contract.set_verdict(cid, _quittung(cid, passed=False))
    assert c2["status"] == "failed" and c2["verdict"] == "fail"
    assert len(list(paths.receipts_dir().glob(f"{cid}-*.json"))) == 2


def test_list_open_laesst_abgeschlossene_weg():
    a, b, c = _vertrag()["id"], _vertrag()["id"], _vertrag()["id"]
    contract.set_verdict(a, _quittung(a, passed=True))
    contract.set_verdict(b, _quittung(b, passed=False))
    contract.block(c, "wartet")
    offen = [x["id"] for x in contract.list_open()]
    assert offen == [c]
    contract.start(b)  # nach fail darf nachgearbeitet werden
    assert sorted(x["id"] for x in contract.list_open()) == sorted([b, c])


def test_handover_enthaelt_probenkommando_und_bleibt_kurz():
    cmd = "python3 -m pytest tests/test_x.py -q"
    c = contract.new("Baue Modul x", [
        {"type": "shell", "cmd": cmd, "expect_regex": r"passed"},
        {"type": "forbid", "path": "core/x.py", "regex": "TODO|NotImplemented"},
        {"type": "answer", "expected": 42},
    ], non_goals=["kein CLI"], inputs=["ARCHITEKTUR.md §5"], level=2, budget={"turns": 12})
    text = contract.render_handover(c["id"])
    zeilen = text.splitlines()
    assert cmd in text and "/TODO|NotImplemented/" in text and "letzte Zahl == 42" in text
    assert "Ziel: Baue Modul x" in text and "Nicht-Ziele: kein CLI" in text and "Eingaben: ARCHITEKTUR.md §5" in text
    assert "Du siehst nicht:" in text and "Ebene 2" in text
    assert "12 Züge" in text and "20000 Tokens" in text and "Denkbudget 4000" in text
    assert zeilen[-2] == "Bei Blockade: melden, nicht improvisieren."
    assert zeilen[-1] == "Ohne gelaufene Probe lautet dein Ergebnis 'nicht geprüft', nie 'fertig'."
    assert len(zeilen) <= 14, "Auflagen als Text schaden — der Übergabetext bleibt kurz"
    assert not SCHWEIGEKLAUSEL.search(text)
    assert bus.tail(1)[0]["event"] == "contract.handover"
