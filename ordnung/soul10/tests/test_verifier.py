"""Prüfer: Proben zuerst und ohne Modell; Prüfer nur mit Vorschlag; Korrektur als Wert; Quittung mit Hash."""
import hashlib
import json
import sys

from core import bus, contract, model, paths, verifier

PY = sys.executable
ZIEL = "Was ist 6*7? Antworte nur mit der Zahl."


def _vertrag(probes=None, goal=ZIEL):
    return contract.new(goal, probes or [{"type": "answer", "expected": 42}])


def test_probe_scheitert_fail_ohne_modellaufruf(fake_model):
    aufrufe = fake_model(["42"])
    c = _vertrag([{"type": "shell", "cmd": PY + ' -c "import sys; sys.exit(1)"'},
                  {"type": "answer", "expected": 42}])
    r = verifier.verify(c["id"], use_model=True, proposal_text="42")
    assert r["verdict"] == "fail" and r["calls"] == 0 and aufrufe == []
    assert r["probes"] == 2 and r["probes_failed"] == 1
    assert r["receipt"]["verifier"] == {"kind": "deterministic", "model": None}
    assert r["receipt"]["korrektur"] is None and r["receipt"]["pruefer"] is None
    geladen = contract.load(c["id"])
    assert geladen["status"] == "failed" and geladen["verdict"] == "fail"
    assert (paths.receipts_dir() / geladen["receipt"]["file"]).exists()


def test_alle_proben_bestehen_ohne_modell(fake_model):
    aufrufe = fake_model(["43"])  # würde widersprechen, darf aber nicht gerufen werden
    c = _vertrag()
    r = verifier.verify(c["id"], proposal_text="Ergebnis: 42")
    assert r["verdict"] == "pass" and r["verifier"] == "deterministic" and r["calls"] == 0
    assert r["final_value"] == 42.0 and aufrufe == []
    assert contract.load(c["id"])["status"] == "verified"


def test_pruefer_bestaetigt_mit_gemessenem_wortlaut(fake_model):
    aufrufe = fake_model(["Nachgerechnet: 6*7 = 42.\n42"])
    c = _vertrag()
    r = verifier.verify(c["id"], use_model=True, proposal_text="42", model="test-modell")
    assert r["verdict"] == "pass" and r["verifier"] == "deterministic+model" and r["calls"] == 1
    assert r["korrektur"] is None and r["final_value"] == 42.0
    assert len(aufrufe) == 1
    assert aufrufe[0]["system"] == model.PRUEFER_SYSTEM
    assert aufrufe[0]["user"] == model.pruefer_prompt(ZIEL, "42")
    assert aufrufe[0]["model"] == "test-modell"
    assert r["receipt"]["verifier"] == {"kind": "deterministic+model", "model": "test-modell"}
    assert r["receipt"]["pruefer"]["changed"] is False
    assert contract.load(c["id"])["status"] == "verified"


def test_pruefer_korrigiert_fail_mit_korrektur_als_wert(fake_model):
    roh = "Die vorgeschlagene Antwort ist falsch, weil 6*7 nicht 42 ergibt. Richtig ist 43."
    fake_model([roh])
    c = _vertrag()
    r = verifier.verify(c["id"], use_model=True, proposal_text="42")
    assert r["verdict"] == "fail" and r["korrektur"] == "43" and r["final_value"] == 43.0
    assert r["receipt"]["pruefer"]["changed"] is True
    assert r["receipt"]["pruefer"]["proposal_value"] == 42.0 and r["receipt"]["pruefer"]["final_value"] == 43.0
    assert r["receipt"]["pruefer"]["final_text_sha256"] == paths.sha256_text(roh)
    assert "vorgeschlagene Antwort" not in json.dumps(r["receipt"], ensure_ascii=False)  # Rohtext nicht durchgereicht
    geladen = contract.load(c["id"])
    assert geladen["status"] == "failed" and geladen["verdict"] == "fail"


def test_quittung_gueltig_hash_korrekt_datei_liegt():
    c = _vertrag()
    r = verifier.verify(c["id"], proposal_text="42")
    q = r["receipt"]
    for k in ("contract_id", "probe_runs", "verdict", "verifier", "korrektur", "at", "hash"):
        assert k in q
    assert q["contract_id"] == c["id"] and q["probe_runs"][0]["passed"] is True
    body = {k: v for k, v in q.items() if k != "hash"}
    erwartet = hashlib.sha256(json.dumps(body, sort_keys=True, ensure_ascii=False,
                                         separators=(",", ":")).encode("utf-8")).hexdigest()
    assert q["hash"] == erwartet == contract.receipt_hash(q)
    contract.validate_receipt(q, c["id"])  # wirft nicht
    datei = paths.receipts_dir() / f"{c['id']}-{q['at'].replace('-', '').replace(':', '')}.json"
    assert datei.exists() and str(datei) == r["receipt_file"]
    assert json.loads(datei.read_text(encoding="utf-8")) == q


def test_use_model_ohne_vorschlag_ruft_kein_modell(fake_model, tmp_path):
    aufrufe = fake_model(["43"])
    f = tmp_path / "out.txt"
    f.write_text("fertig\n", encoding="utf-8")
    c = _vertrag([{"type": "file", "path": str(f), "contains_regex": "fertig"}], goal="Schreibe out.txt")
    r = verifier.verify(c["id"], use_model=True)
    assert r["verdict"] == "pass" and r["calls"] == 0 and aufrufe == []
    assert r["verifier"] == "deterministic" and r["final_value"] is None


def test_gegenstimme_wird_protokolliert_entscheidet_aber_nicht():
    c = _vertrag()
    cmd = PY + ' -c "import sys; print(\'Zweitmeinung\'); print(99)" {prompt}'
    r = verifier.verify(c["id"], proposal_text="42", counter_voice_cmd=cmd)
    assert r["verdict"] == "pass"
    gegen = r["receipt"]["counter_voice"]
    assert gegen["exit"] == 0 and gegen["value"] == 99.0 and gegen["agrees"] is False
    assert gegen["cmd"] == cmd and gegen["error"] is None
    events = [e["event"] for e in bus.tail(10)]
    assert "verifier.counter_voice" in events and events[-1] == "verifier.verify"


def test_modellfehler_laesst_urteil_deterministisch(monkeypatch):
    monkeypatch.setattr(model, "FAKE", lambda s, u, **kw: {"ok": False, "text": "", "error": "timeout"})
    c = _vertrag()
    r = verifier.verify(c["id"], use_model=True, proposal_text="42")
    assert r["verdict"] == "pass" and r["verifier"] == "deterministic" and r["calls"] == 1
    assert r["receipt"]["pruefer"]["ok"] is False and r["receipt"]["pruefer"]["error"] == "timeout"
    assert r["receipt"]["verifier"]["model"] is None and r["korrektur"] is None


def test_check_answer_direkt(fake_model):
    aufrufe = fake_model(["Die Antwort lautet 12,5"])
    r = verifier.check_answer("Aufgabe", "12.5")
    assert r["changed"] is False and r["final_value"] == 12.5 and r["proposal_value"] == 12.5
    assert r["calls"] == 1 and r["ok"] and len(aufrufe) == 1
    fake_model(["Nein: 13"])
    assert verifier.check_answer("Aufgabe", "12.5")["changed"] is True
    fake_model(["Die Antwort stimmt."])  # Prüfer nennt keine Zahl: keine belegte Korrektur
    r = verifier.check_answer("Aufgabe", "12.5")
    assert r["changed"] is False and r["value_missing"] is True
    fake_model(["Paris"])  # Textvergleich über die letzte Zeile
    assert verifier.check_answer("Hauptstadt?", "Berlin")["changed"] is True
    assert bus.tail(1)[0]["event"] == "verifier.check_answer"


def test_verify_schreibt_bus_zeile():
    c = _vertrag()
    verifier.verify(c["id"], proposal_text="42")
    rec = bus.tail(1)[0]
    assert rec["event"] == "verifier.verify" and rec["contract_id"] == c["id"]
    assert rec["verdict"] == "pass" and rec["kind"] == "deterministic" and rec["probes"] == 1
