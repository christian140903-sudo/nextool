"""Vertrag: ohne Probe kein Auftrag; Lebenszyklus in einer Funktion; Urteil nur per gültiger Quittung,
die an die Proben und den Zustand des Vertrags gebunden ist (kein Erfinden, kein Replay, kein Tausch)."""
import json
import re
import sys

import pytest

from core import bus, contract, paths, probes, verifier

PY = sys.executable
PROBE = {"type": "answer", "expected": 42}
SCHWEIGEKLAUSEL = re.compile(r"\bstill\b|unsichtbar|nur das Ergebnis|keine Zwischenschritte|erscheint nie im Text|\bsilent|invisibl", re.I)
_DUMMY_BINDING = {"probes_hash": "0" * 64, "contract_sha256": "0" * 64}


def _vertrag(**kw):
    return contract.new("Was ist 6*7? Antworte nur mit der Zahl.", [PROBE], **kw)


def _lauf(typ="answer", passed=True):
    """Ein ERFUNDENER Lauf: richtige Form, aber ohne Lauf-Token — keine Probe ist gelaufen."""
    return {"type": typ, "passed": passed, "detail": "x", "stdout_head": "", "exit": None, "at": paths.now_iso()}


def _lauf_echt(cid, probe=None, *, passed=True):
    """Ein Lauf, den probes.run wirklich ausgeführt hat — nur er trägt ein gültiges Lauf-Token."""
    return probes.run(probe or PROBE, answer_text="42" if passed else "43", contract_id=cid)


def _quittung(cid, *, passed=True, verdict=None, runs=None, binding=None):
    """Eine Quittung, wie verify sie schreiben würde: gebunden an die Proben, den Zustand des
    Vertrags und über das Lauf-Token an die tatsächlich gelaufenen Proben."""
    if binding is None:
        try:
            binding = contract.receipt_binding(contract.load(cid))
        except contract.ContractError:
            binding = dict(_DUMMY_BINDING)
    q = {
        "contract_id": cid,
        "probe_runs": runs if runs is not None else [_lauf_echt(cid, passed=passed)],
        "verdict": verdict or ("pass" if passed else "fail"),
        "verifier": {"kind": "deterministic", "model": None},
        "at": paths.now_iso(),
        **binding,
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
    # Befund a1/1e, a7/7a: unendliche Toleranz und leere Erwartung sind keine Prüfschärfe
    with pytest.raises(contract.ContractError, match="endliche Zahl"):
        contract.new("Ziel", [json.loads('{"type":"answer","expected":1,"tolerance":Infinity}')])
    with pytest.raises(contract.ContractError, match="leer"):
        contract.new("Ziel", [{"type": "answer", "expected": ""}])
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


def test_non_goals_als_einzelner_text_wird_nicht_zerlegt():
    """Befund a6/6a: non_goals='kein Code' wurde zu ['k','e','i','n', …]."""
    c = _vertrag(non_goals="kein Code", inputs="ARCHITEKTUR.md")
    assert c["non_goals"] == ["kein Code"] and c["inputs"] == ["ARCHITEKTUR.md"]
    text = contract.render_handover(c["id"])
    assert "Nicht-Ziele: kein Code" in text and "Eingaben: ARCHITEKTUR.md" in text
    with pytest.raises(contract.ContractError):
        _vertrag(non_goals={"a": 1})


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
    # Regel 9: jeder Schreibvorgang hinterlässt zusätzlich eine contract.save-Zeile mit from/to
    speichern = [e for e in bus.tail(20, "contract.save") if e["id"] == cid]
    assert speichern and speichern[-1]["from"] == "running" and speichern[-1]["to"] == "delivered"


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
    assert c["log"][-1]["event"] == "verdict" and c["log"][-1]["receipt_hash"] == q["hash"]
    assert bus.tail(1)[0]["event"] == "contract.verdict"
    assert contract.load(cid) == c
    # Zweite Prüfung darf das Urteil ehrlich kippen
    c2 = contract.set_verdict(cid, _quittung(cid, passed=False))
    assert c2["status"] == "failed" and c2["verdict"] == "fail"
    assert len(list(paths.receipts_dir().glob(f"{cid}-*.json"))) == 2


# --- Bindung der Quittung an die Proben des Vertrags (Befund a1/1a) --------------------------------
def test_erfundene_quittung_ohne_gelaufene_proben_wird_abgelehnt():
    """Angriff 1a: Vertrag mit zwei Proben (eine scheitert zwingend), Quittung mit einem erfundenen
    Lauf und selbst gerechnetem Hash — durfte nie ein Urteil setzen."""
    c = contract.new("Ziel", [{"type": "shell", "cmd": PY + ' -c "import sys; sys.exit(1)"'},
                              {"type": "answer", "expected": 42}])
    cid = c["id"]
    vorher = len(bus.tail(100, "probe."))
    # ein Lauf für zwei Proben
    with pytest.raises(contract.ContractError, match="1 Probenlauf.*2 Proben"):
        contract.set_verdict(cid, _quittung(cid, runs=[_lauf("shell")]))
    # zwei Läufe, aber falsche Typen / Reihenfolge
    with pytest.raises(contract.ContractError, match="Typ"):
        contract.set_verdict(cid, _quittung(cid, runs=[_lauf("answer"), _lauf("shell")]))
    # zwei passende Läufe, aber der Proben-Hash gehört zu anderen Proben
    binding = contract.receipt_binding(contract.load(cid))
    binding["probes_hash"] = contract.probes_hash([{"type": "shell", "cmd": "true"}, {"type": "answer", "expected": 42}])
    with pytest.raises(contract.ContractError, match="probes_hash"):
        contract.set_verdict(cid, _quittung(cid, runs=[_lauf("shell"), _lauf("answer")], binding=binding))
    # Bindungsfelder fehlen ganz
    q = _quittung(cid, runs=[_lauf("shell"), _lauf("answer")])
    del q["probes_hash"]
    q["hash"] = contract.receipt_hash(q)
    with pytest.raises(contract.ContractError, match="unvollständig"):
        contract.set_verdict(cid, q)
    assert contract.load(cid)["verdict"] == "not-evaluated" and contract.load(cid)["status"] == "open"
    assert len(bus.tail(100, "probe.")) == vorher  # keine Probe lief — und keine Quittung zählt
    assert list(paths.receipts_dir().glob("*.json")) == []
    # Nur wer die Proben laufen lässt, bekommt ein Urteil — hier fail, weil exit 1 scheitert.
    v = verifier.verify(cid, proposal_text="42")
    assert v["verdict"] == "fail" and contract.load(cid)["status"] == "failed"
    assert len(bus.tail(100, "probe.")) == vorher + 2


def test_replay_einer_alten_quittung_wird_abgelehnt():
    """Angriff 1b: nach ehrlicher fail-Prüfung die alte pass-Quittung erneut einreichen."""
    cid = _vertrag()["id"]
    alt = _quittung(cid, passed=True)
    assert contract.set_verdict(cid, alt)["status"] == "verified"
    assert verifier.verify(cid, proposal_text="43")["verdict"] == "fail"
    assert contract.load(cid)["status"] == "failed"
    with pytest.raises(contract.ContractError, match="bereits angewendet"):
        contract.set_verdict(cid, alt)
    # Auch mit frischem Hash, aber altem Zustand-Fingerabdruck: veraltet
    alt2 = dict(alt)
    alt2["at"] = paths.now_iso() + "x"
    alt2["hash"] = contract.receipt_hash(alt2)
    with pytest.raises(contract.ContractError, match="veraltet"):
        contract.set_verdict(cid, alt2)
    # Und über save(): Verweis auf die ältere pass-Quittung, obwohl eine jüngere fail-Quittung liegt
    # (hier in derselben Sekunde ausgestellt — dann entscheidet das Log, nicht der Zeitstempel)
    c = contract.load(cid)
    assert c["status"] == "failed" and c["verdict"] == "fail"
    c["verdict"], c["status"] = "pass", "verified"
    c["receipt"] = {"file": contract.receipt_file_name(alt), "hash": alt["hash"], "at": alt["at"]}
    with pytest.raises(contract.ContractError, match="ältere Quittung|zuletzt angewendete Quittung"):
        contract.save(c)
    geladen = contract.load(cid)
    assert geladen["status"] == "failed" and geladen["verdict"] == "fail"


def test_replay_mit_altem_zeitstempel_wird_abgelehnt():
    """Angriff 1b wörtlich: Quittung mit at=2020 war gültig, nach ehrlicher fail-Prüfung erneut eingereicht."""
    cid = _vertrag()["id"]
    alt = _quittung(cid, passed=True)
    alt["at"] = "2020-01-01T00:00:00Z"
    alt["hash"] = contract.receipt_hash(alt)
    assert contract.set_verdict(cid, alt)["receipt"]["at"] == "2020-01-01T00:00:00Z"
    assert verifier.verify(cid, proposal_text="43")["verdict"] == "fail"
    with pytest.raises(contract.ContractError, match="bereits angewendet"):
        contract.set_verdict(cid, alt)
    c = contract.load(cid)
    c["verdict"], c["status"] = "pass", "verified"
    c["receipt"] = {"file": contract.receipt_file_name(alt), "hash": alt["hash"], "at": alt["at"]}
    c["log"] = [e for e in c["log"] if e.get("receipt_hash") != contract.load(cid)["receipt"]["hash"]]  # Log frisiert
    with pytest.raises(contract.ContractError, match="ältere Quittung"):
        contract.save(c)
    assert contract.load(cid)["status"] == "failed"


def test_quittung_gilt_nur_fuer_den_zustand_bei_pruefbeginn():
    """Eine Quittung, die vor einer Zustandsänderung (Lieferung) ausgestellt wurde, ist danach veraltet."""
    cid = _vertrag()["id"]
    q = _quittung(cid)
    contract.deliver(cid, report="42")
    with pytest.raises(contract.ContractError, match="veraltet"):
        contract.set_verdict(cid, q)
    assert contract.load(cid)["verdict"] == "not-evaluated"
    assert contract.set_verdict(cid, _quittung(cid))["status"] == "verified"


# --- save() hält die Probenpflicht (Befund a1/1c, 1d; a6/6g) ---------------------------------------
def test_save_laesst_proben_und_ziel_nicht_aendern():
    """Angriff 1c/1d: Proben per save() auf 'true' tauschen oder leeren."""
    c = contract.new("Baue Modul", [{"type": "shell", "cmd": PY + ' -m pytest tests/test_gibt_es_nicht.py -q'}])
    cid = c["id"]
    c["probes"] = [{"type": "shell", "cmd": "true"}]
    with pytest.raises(contract.ContractError, match="unveränderlich"):
        contract.save(c)
    c = contract.load(cid)
    c["probes"] = []
    with pytest.raises(contract.ContractError, match="ohne Abnahmeprobe"):
        contract.save(c)
    c = contract.load(cid)
    c["goal"] = "MANIPULIERT"
    with pytest.raises(contract.ContractError, match="unveränderlich"):
        contract.save(c)
    auf_platte = contract.load(cid)
    assert auf_platte["goal"] == "Baue Modul" and "test_gibt_es_nicht" in auf_platte["probes"][0]["cmd"]
    assert [x["id"] for x in contract.list_open()] == [cid]
    # Andere Felder bleiben schreibbar (der Dirigent setzt mission_id nach new)
    c = contract.load(cid)
    c["mission_id"] = cid
    contract.save(c)
    assert contract.load(cid)["mission_id"] == cid
    # Ein neuer Vertrag direkt über save(): Proben werden validiert
    with pytest.raises(contract.ContractError, match="Probe 1 ungültig"):
        contract.save({"id": "neu-1", "goal": "x", "probes": [{"type": "shell"}], "status": "open",
                       "verdict": "not-evaluated", "log": []})


def test_vertrag_mit_urteil_kann_nicht_offen_sein():
    """Angriff 6g: verifizierter Vertrag per save() auf status open zurück — mit Urteil pass."""
    cid = _vertrag()["id"]
    contract.set_verdict(cid, _quittung(cid))
    c = contract.load(cid)
    c["status"] = "open"
    with pytest.raises(contract.ContractError, match="nicht mehr offen"):
        contract.save(c)
    assert contract.load(cid)["status"] == "verified"
    # Nacharbeit nach fail bleibt erlaubt: failed → running → delivered → blocked, Urteil bleibt stehen
    cid2 = _vertrag()["id"]
    contract.set_verdict(cid2, _quittung(cid2, passed=False))
    contract.start(cid2)
    contract.deliver(cid2, report="nachgebessert")
    assert contract.block(cid2, "wartet")["verdict"] == "fail"


# --- Randfälle der Quittung (Befund a6/6b, a2) ------------------------------------------------------
def test_nicht_kanonisierbare_quittung_ist_contract_error():
    """Angriff 6b: Nicht-String-Schlüssel lösten TypeError statt ContractError aus."""
    cid = _vertrag()["id"]
    q = {"contract_id": cid, "probe_runs": [{"passed": True, 1: "x"}], "verdict": "pass",
         "verifier": {"kind": "deterministic", "model": None}, "at": paths.now_iso(), "hash": "x",
         **_DUMMY_BINDING}
    with pytest.raises(contract.ContractError, match="kanonisierbar"):
        contract.set_verdict(cid, q)
    with pytest.raises(contract.ContractError, match="kanonisierbar"):
        contract.receipt_hash({1: "x", "a": 1})  # gemischte Schlüsseltypen sind nicht sortierbar
    assert contract.load(cid)["verdict"] == "not-evaluated"


def test_quittung_mit_unmaskiertem_secret_wird_abgelehnt():
    cid = _vertrag()["id"]
    lauf = _lauf_echt(cid)
    lauf["stdout_head"] = "aws_access_key_id = AKIAIOSFODNN7EXAMPLE"
    with pytest.raises(contract.ContractError, match="Secret"):
        contract.set_verdict(cid, _quittung(cid, runs=[lauf]))
    assert contract.set_verdict(cid, _quittung(cid))["status"] == "verified"


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


# --- Schlussprüfung: die Form allein ist keine Quittung (Befund contract.py:320) --------------------
def test_formgerechte_faelschung_ohne_gelaufene_probe_setzt_kein_urteil():
    """Der Angriff, den der Fix-Pass offen ließ: eine Quittung, die ALLES richtig macht — passende
    Anzahl und Typen der Läufe, probes_hash und contract_sha256 aus contract.receipt_binding, Hash
    aus contract.receipt_hash — nur ist keine Probe gelaufen. Beide Proben scheitern in Wahrheit."""
    c = contract.new("Ziel", [{"type": "shell", "cmd": PY + ' -c "import sys; sys.exit(1)"'},
                              {"type": "forbid", "path": ".", "regex": "def "}])
    cid = c["id"]
    contract.deliver(cid, report="fertig")
    vorher = len(bus.tail(200, "probe."))
    faelschung = _quittung(cid, runs=[_lauf("shell"), _lauf("forbid")])
    assert faelschung["probes_hash"] == contract.probes_hash(contract.load(cid)["probes"])
    assert faelschung["hash"] == contract.receipt_hash(faelschung)   # formgerecht bis in den Hash
    with pytest.raises(contract.ContractError, match="bestanden, ist aber ohne Lauf-Token"):
        contract.set_verdict(cid, faelschung)
    with pytest.raises(contract.ContractError, match="Lauf-Token"):
        contract.write_receipt(faelschung)
    geladen = contract.load(cid)
    assert geladen["status"] == "delivered" and geladen["verdict"] == "not-evaluated"
    assert [x["id"] for x in contract.list_open()] == [cid]          # bleibt im Prüfgate
    assert list(paths.receipts_dir().glob("*.json")) == []
    assert len(bus.tail(200, "probe.")) == vorher                    # keine Probe lief
    # Nur die ehrliche Prüfung urteilt — und sie urteilt fail, weil beide Proben scheitern.
    assert verifier.verify(cid, proposal_text="42")["verdict"] == "fail"
    assert contract.load(cid)["status"] == "failed"


def test_lauf_token_gilt_nur_fuer_seine_probe_seinen_vertrag_und_genau_einmal():
    """Ein echtes Token lässt sich nicht ausleihen: nicht für einen anderen Vertrag, nicht für eine
    andere Probe, nicht nach einer Änderung am Lauf und nicht ein zweites Mal."""
    a, b = _vertrag()["id"], _vertrag()["id"]
    fremd = _lauf_echt(b)                                   # echter Lauf, aber für Vertrag b
    with pytest.raises(contract.ContractError, match="Lauf-Token passt nicht"):
        contract.set_verdict(a, _quittung(a, runs=[fremd]))
    gedreht = _lauf_echt(a, passed=False)                   # gescheitert → nachträglich auf pass gedreht
    gedreht["passed"] = True
    with pytest.raises(contract.ContractError, match="Lauf-Token passt nicht"):
        contract.set_verdict(a, _quittung(a, runs=[gedreht]))
    echt = _lauf_echt(a)
    ohne = {k: v for k, v in echt.items() if k != "token"}
    with pytest.raises(contract.ContractError, match="ohne Lauf-Token"):
        contract.set_verdict(a, _quittung(a, runs=[ohne]))
    assert contract.set_verdict(a, _quittung(a, runs=[echt]))["status"] == "verified"
    # Derselbe Lauf ein zweites Mal, in einer frischen Quittung auf den neuen Zustand gebunden:
    # Hash und Fingerabdruck stimmen, aber das Lauf-Token ist verbraucht.
    zweite = _quittung(a, runs=[echt])
    assert zweite["contract_sha256"] == contract.fingerprint(contract.load(a))
    with pytest.raises(contract.ContractError, match="verbraucht"):
        contract.set_verdict(a, zweite)
    assert contract.load(a)["verdict"] == "pass"


# --- Schlussprüfung: Anker statt Plattenstand (Befund contract.py:211) -----------------------------
def test_untergeschobene_proben_machen_den_vertrag_beschaedigt_statt_leicht():
    """Wer die Vertragsdatei umschreibt, tauscht die Abnahmeproben nicht aus: der Anker aus new()
    entscheidet. Ein so umgeschriebener Vertrag scheitert mit Quittung und ist danach eingefroren."""
    c = contract.new("Baue Modul", [{"type": "shell", "cmd": PY + ' -c "import sys; sys.exit(1)"'}])
    cid = c["id"]
    contract.deliver(cid, report="fertig")
    datei = paths.contracts_dir() / f"{cid}.json"
    roh = json.loads(datei.read_text(encoding="utf-8"))
    roh["probes"] = [{"type": "shell", "cmd": "true"}]      # Trivialprobe untergeschoben
    datei.write_text(json.dumps(roh), encoding="utf-8")
    assert contract.damaged(contract.load(cid))
    # Die untergeschobene Probe besteht — das Urteil lautet trotzdem fail, und es gibt eine Quittung.
    r = verifier.verify(cid)
    assert r["verdict"] == "fail" and r["probes_failed"] == 0 and r["contract_damaged"]
    assert contract.load(cid)["status"] == "failed"
    assert (paths.receipts_dir() / contract.load(cid)["receipt"]["file"]).exists()
    # Danach führt kein Weg mehr zu einem Bestehen: der Vertrag ist ohne Menschen nicht reparierbar.
    with pytest.raises(contract.ContractError, match="beschädigt"):
        contract.start(cid)                       # keine Nacharbeit, kein neuer Anlauf
    assert verifier.verify(cid)["verdict"] == "fail"   # und jede weitere Prüfung endet wieder fail
    assert contract.load(cid)["status"] == "failed" and contract.load(cid)["verdict"] == "fail"


# --- Schlussprüfung: save() ist kein Urteilsweg und kein Sprungbrett (Befund contract.py:191) ------
def test_save_setzt_kein_urteil_und_keinen_statussprung():
    """Angriff a2/a9: mit einer gültigen Quittung per save() auf verified springen (ohne Log-Eintrag,
    ohne contract.verdict-Zeile, ohne verbrauchtes Token) und einen Vertrag aus dem Prüfgate heben."""
    cid = _vertrag()["id"]
    contract.deliver(cid, report="42")
    q = _quittung(cid)                                   # echte, belegte Quittung
    pfad = contract.write_receipt(q)
    c = contract.load(cid)
    c["verdict"], c["status"] = "pass", "verified"
    c["receipt"] = {"file": pfad.name, "hash": q["hash"], "at": q["at"], "verifier": q["verifier"]}
    with pytest.raises(contract.ContractError, match="ohne deckenden Log-Eintrag"):
        contract.save(c)
    c["log"].append({"at": paths.now_iso(), "event": "verdict", "from": "delivered", "to": "verified",
                     "verdict": "pass", "receipt_hash": q["hash"]})   # Log selbst gebaut
    with pytest.raises(contract.ContractError, match="ohne deckenden Log-Eintrag"):
        contract.save(c)                          # ein 'verdict'-Eintrag deckt nur set_verdict selbst
    assert contract.load(cid)["status"] == "delivered" and not bus.tail(50, "contract.verdict")
    # Statussprung delivered → blocked ohne Log-Eintrag: der Vertrag verschwände aus dem Prüfgate
    d = contract.load(cid)
    d["status"] = "blocked"
    with pytest.raises(contract.ContractError, match="ohne deckenden Log-Eintrag"):
        contract.save(d)
    assert [x["status"] for x in contract.list_open()] == ["delivered"]
    # Auch ohne Statuswechsel wandert kein Urteil an set_verdict vorbei in den Vertrag
    e = contract.load(cid)
    e["verdict"] = "pass"
    e["receipt"] = {"file": pfad.name, "hash": q["hash"], "at": q["at"], "verifier": q["verifier"]}
    with pytest.raises(contract.ContractError, match="nur über set_verdict"):
        contract.save(e)
    # Der ehrliche Weg bleibt offen und hinterlässt beide Spuren: Log-Eintrag und Bus-Zeile
    contract.block(cid, "wartet")
    zeile = [e for e in bus.tail(20, "contract.save") if e["id"] == cid][-1]
    assert zeile["from"] == "delivered" and zeile["to"] == "blocked"
    assert contract.set_verdict(cid, _quittung(cid))["status"] == "verified"
    assert bus.tail(1)[0]["event"] == "contract.verdict"
