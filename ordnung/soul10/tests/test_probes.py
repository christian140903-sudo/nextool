"""Proben: Validierung lehnt Unbrauchbares ab; vier Typen laufen deterministisch; jeder Lauf schreibt auf den Bus;
cwd ist die Schranke für file/forbid; Ausgaben sind maskiert; Zahlen lesen sich wie model.extract_last_number."""
import json
import os
import sys
import time

import pytest

from core import bus, model, paths, probes

PY = sys.executable
AKIA = "AKIAIOSFODNN7EXAMPLE"
POSIX = os.name == "posix"


def test_validate_lehnt_unbrauchbares_ab():
    schlecht = [
        {"type": "magie"},                                                   # unbekannter Typ
        {"type": "shell"},                                                   # cmd fehlt
        {"type": "shell", "cmd": "true", "expect_regex": "("},               # kaputter Regex
        {"type": "shell", "cmd": "true", "expect_regx": "x"},                # Tippfehler im Schlüssel
        {"type": "shell", "cmd": "true", "timeout": 0},                      # Timeout < 1
        {"type": "answer", "expected": 42, "extract": "irgendwas"},          # unbekannter Abgriff
        {"type": "answer", "expected": "Berlin", "extract": "last_number"},  # Zahl verlangt, Text gegeben
        {"type": "answer", "expected": "Berlin", "tolerance": 1},            # Toleranz ohne Zahl
        {"type": "file", "path": "a.txt", "must_exist": False, "contains_regex": "x"},
        {"type": "forbid", "path": "a.py"},                                  # regex fehlt
        "kein dict",
    ]
    for p in schlecht:
        with pytest.raises(probes.ProbeError):
            probes.validate(p)
    # Gültige Formen laufen durch
    probes.validate({"type": "shell", "cmd": "true"})
    probes.validate({"type": "answer", "expected": "12,5", "tolerance": 0.1})
    probes.validate({"type": "answer", "expected": "Berlin"})
    probes.validate({"type": "file", "path": "x", "must_exist": False})
    probes.validate({"type": "forbid", "path": "x", "regex": "TODO"})


def test_validate_lehnt_unendliche_toleranz_leere_erwartung_und_nan_ab():
    """Befund a1/1e, a4/4c: tolerance=Infinity macht jede Antwort bestanden; NaN und '' sind keine Erwartung."""
    for p in [json.loads('{"type":"answer","expected":1,"tolerance":Infinity}'),
              json.loads('{"type":"answer","expected":1,"tolerance":NaN}'),
              json.loads('{"type":"answer","expected":Infinity}'),
              {"type": "answer", "expected": ""}, {"type": "answer", "expected": "   "}]:
        with pytest.raises(probes.ProbeError):
            probes.validate(p)


def test_validate_lehnt_verschachtelte_quantoren_ab():
    """Befund a5: ^(a+)+$ hält die Prüfung bei 28 Zeichen zehn Sekunden — exponentiell wachsend."""
    for rx in ["^(a+)+$", "(a*)*b", "(x+){2,}", "^(\\d+)*$"]:
        with pytest.raises(probes.ProbeError, match="Quantoren"):
            probes.validate({"type": "shell", "cmd": "true", "expect_regex": rx})
        with pytest.raises(probes.ProbeError, match="Quantoren"):
            probes.validate({"type": "file", "path": "x", "contains_regex": rx})
        with pytest.raises(probes.ProbeError, match="Quantoren"):
            probes.validate({"type": "forbid", "path": "x", "regex": rx})
    # Gewöhnliche Muster bleiben erlaubt, auch mit Gruppen und Escapes
    for rx in [r"(\d+\.)+\d+", r"passed|failed", r"^\d+ passed$", r"(a\+)+", r"(ab)+"]:
        probes.validate({"type": "shell", "cmd": "true", "expect_regex": rx})


def test_as_number_liest_wie_extract_last_number():
    """Befund a4: '1.000' war 1.0 (Probe) gegen 1000 (Abgriff); '1.000,5' war None."""
    for text in ["1.000", "10.000", "1.000,5", "12,5", "12.5", "3.14159", "-3", "42", " 7 "]:
        assert probes.as_number(text) == model.extract_last_number(text), text
    assert probes.as_number("1.000") == 1000.0 and probes.as_number("1.000,5") == 1000.5
    assert probes.as_number(42) == 42.0 and probes.as_number(1.5) == 1.5
    for kein in ["1 2", "abc", "", "1e5", "1,000.5", True, False, None, [1], float("inf"), float("nan")]:
        assert probes.as_number(kein) is None, repr(kein)
    for exp in ["1.000", "10.000", "1.000,5"]:
        p = {"type": "answer", "expected": exp}
        assert probes.default_extract(exp) == "last_number"
        assert probes.run(p, answer_text=f"Ergebnis: {exp}")["passed"], exp
    assert "letzte Zahl == 10000" in probes.describe({"type": "answer", "expected": "10.000"})
    assert "letzte Zahl == 12.5" in probes.describe({"type": "answer", "expected": "12,5"})
    assert "gesamte Antwort == 1 2" in probes.describe({"type": "answer", "expected": "1 2"})


def test_shell_probe_exit_und_muster():
    ok = probes.run({"type": "shell", "cmd": PY + ' -c "print(6*7)"', "expect_regex": r"^42$"})
    assert ok["passed"] and ok["exit"] == 0 and ok["stdout_head"].strip() == "42"
    assert ok["type"] == "shell" and ok["at"].endswith("Z")
    falscher_exit = probes.run({"type": "shell", "cmd": PY + ' -c "import sys; sys.exit(3)"'})
    assert not falscher_exit["passed"] and falscher_exit["exit"] == 3 and "Exit 3" in falscher_exit["detail"]
    erwarteter_exit = probes.run({"type": "shell", "cmd": PY + ' -c "import sys; sys.exit(3)"', "expect_exit": 3})
    assert erwarteter_exit["passed"]
    verboten = probes.run({"type": "shell", "cmd": PY + ' -c "print(1); print(2)"', "forbid_regex": r"^2$"})
    assert not verboten["passed"] and "verboten" in verboten["detail"]
    fehlendes_muster = probes.run({"type": "shell", "cmd": PY + ' -c "print(41)"', "expect_regex": r"^42$"})
    assert not fehlendes_muster["passed"]


def test_shell_probe_zeitueberschreitung_ist_nicht_bestanden():
    r = probes.run({"type": "shell", "cmd": PY + ' -c "import time; time.sleep(5)"', "timeout": 1})
    assert not r["passed"] and r["exit"] is None and "Zeitüberschreitung" in r["detail"]


def test_shell_ausgabe_ueber_der_laengenschranke_ist_nicht_pruefbar(monkeypatch):
    """Die Musterprüfung sieht höchstens MAX_TEXT Zeichen; mehr ist nicht geprüft, also nicht bestanden."""
    monkeypatch.setattr(probes, "MAX_TEXT", 1000)
    lang = PY + ' -c "print(\'x\' * 2000); print(42)"'
    r = probes.run({"type": "shell", "cmd": lang, "expect_regex": r"^42$"})
    assert not r["passed"] and "zu groß" in r["detail"]
    r = probes.run({"type": "shell", "cmd": lang, "forbid_regex": r"^42$"})
    assert not r["passed"] and "zu groß" in r["detail"]
    assert probes.run({"type": "shell", "cmd": lang})["passed"]  # ohne Muster zählt nur der Exit


def test_file_probe(tmp_path):
    f = tmp_path / "bericht.md"
    f.write_text("# Bericht\nErgebnis: 42\n", encoding="utf-8")
    cwd = str(tmp_path)
    assert probes.run({"type": "file", "path": "bericht.md", "contains_regex": r"Ergebnis: \d+"}, cwd=cwd)["passed"]
    assert not probes.run({"type": "file", "path": str(f), "forbids_regex": "Ergebnis"}, cwd=cwd)["passed"]
    assert not probes.run({"type": "file", "path": str(f), "contains_regex": "Fazit"}, cwd=cwd)["passed"]
    fehlt = probes.run({"type": "file", "path": "nix.md"}, cwd=cwd)
    assert not fehlt["passed"] and "fehlt" in fehlt["detail"]
    assert probes.run({"type": "file", "path": "nix.md", "must_exist": False}, cwd=cwd)["passed"]
    assert not probes.run({"type": "file", "path": "bericht.md", "must_exist": False}, cwd=cwd)["passed"]
    assert not probes.run({"type": "file", "path": "."}, cwd=cwd)["passed"]  # Verzeichnis ist keine Datei


def test_file_und_forbid_bleiben_in_cwd(tmp_path, monkeypatch):
    """Befund a2/2c, 2e: '..' und '~' führten aus cwd hinaus; Dateiinhalte von außen landeten im stdout_head."""
    work, aussen = tmp_path / "work", tmp_path / "aussen"
    work.mkdir(), aussen.mkdir()
    (aussen / "credentials").write_text(f"aws_access_key_id = {AKIA}\n", encoding="utf-8")
    (work / "ok.txt").write_text("drin\n", encoding="utf-8")
    monkeypatch.setenv("HOME", str(aussen))
    cwd = str(work)
    for pfad in ["../aussen/credentials", str(aussen / "credentials"), "~/credentials", "ok.txt/../../aussen/credentials"]:
        r = probes.run({"type": "file", "path": pfad, "contains_regex": "aws"}, cwd=cwd)
        assert not r["passed"], pfad
        assert AKIA not in json.dumps(r) and r["stdout_head"] == "", pfad
        assert "außerhalb" in r["detail"] or "fehlt" in r["detail"], (pfad, r["detail"])
        r = probes.run({"type": "forbid", "path": pfad, "regex": "aws"}, cwd=cwd)
        assert not r["passed"] and AKIA not in json.dumps(r), pfad
    # must_exist=false außerhalb ist ebenso nicht prüfbar
    assert not probes.run({"type": "file", "path": "../aussen/nix", "must_exist": False}, cwd=cwd)["passed"]
    # Symlink nach außen bleibt ungelesen (Datei- wie Verzeichnisprobe)
    if POSIX:
        (work / "link").symlink_to(aussen / "credentials")
        r = probes.run({"type": "file", "path": "link", "contains_regex": "aws"}, cwd=cwd)
        assert not r["passed"] and AKIA not in json.dumps(r)
        r = probes.run({"type": "forbid", "path": ".", "regex": "aws"}, cwd=cwd)
        assert r["passed"] and "1 Datei" in r["detail"]
    # Innerhalb funktioniert es weiter, auch mit '..' innerhalb
    assert probes.run({"type": "file", "path": "ok.txt", "contains_regex": "drin"}, cwd=cwd)["passed"]
    (work / "sub").mkdir()
    assert probes.run({"type": "file", "path": "sub/../ok.txt", "contains_regex": "drin"}, cwd=cwd)["passed"]
    # Ohne cwd gilt das Arbeitsverzeichnis des Prozesses
    monkeypatch.chdir(work)
    assert probes.run({"type": "file", "path": "ok.txt"})["passed"]
    assert not probes.run({"type": "file", "path": str(aussen / "credentials")})["passed"]


@pytest.mark.skipif(not POSIX, reason="mkfifo nur unter POSIX")
def test_fifo_blockiert_weder_file_noch_forbid_probe(tmp_path):
    """Befund a5: eine FIFO als file-Pfad blockierte read_text ohne Zeitschranke — verify hing endlos."""
    d = tmp_path / "d"  # eigenes Verzeichnis: tmp_path trägt auch SOUL10_HOME
    d.mkdir()
    os.mkfifo(d / "pipe")
    t = time.time()
    r = probes.run({"type": "file", "path": "pipe", "contains_regex": "x"}, cwd=str(d))
    assert time.time() - t < 5
    assert not r["passed"] and "reguläre Datei" in r["detail"]
    r = probes.run({"type": "file", "path": "pipe"}, cwd=str(d))
    assert not r["passed"]
    t = time.time()
    r = probes.run({"type": "forbid", "path": ".", "regex": "TODO"}, cwd=str(d))
    assert time.time() - t < 5 and r["passed"] and "0 Datei" in r["detail"]
    r = probes.run({"type": "forbid", "path": "pipe", "regex": "TODO"}, cwd=str(d))
    assert not r["passed"] and "reguläre Datei" in r["detail"]


def test_dateigroesse_ist_begrenzt(tmp_path, monkeypatch):
    monkeypatch.setattr(probes, "MAX_TEXT", 100)
    d = tmp_path / "d"
    d.mkdir()
    (d / "gross.txt").write_text("x" * 200 + "\nTODO\n", encoding="utf-8")
    (d / "klein.py").write_text("pass  # TODO\n", encoding="utf-8")
    cwd = str(d)
    r = probes.run({"type": "file", "path": "gross.txt", "contains_regex": "TODO"}, cwd=cwd)
    assert not r["passed"] and "zu groß" in r["detail"] and r["stdout_head"] == ""
    assert probes.run({"type": "file", "path": "gross.txt"}, cwd=cwd)["passed"]  # Existenz allein zählt
    r = probes.run({"type": "forbid", "path": ".", "regex": "TODO"}, cwd=cwd)
    assert not r["passed"] and "klein.py:1" in r["detail"] and "nur bis 100 Bytes" in r["detail"]
    (d / "klein.py").unlink()
    r = probes.run({"type": "forbid", "path": ".", "regex": "TODO"}, cwd=cwd)
    assert r["passed"] and "nur bis 100 Bytes geprüft: gross.txt" in r["detail"]


def test_ausgaben_sind_maskiert(tmp_path):
    """Befund a2/2d, a7/7b: stdout_head, Dateiinhalt und Antworttext trugen Schlüssel klar in die Quittung."""
    cred = tmp_path / "cred"
    cred.write_text(f"token ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ123456\nkey {AKIA}\n", encoding="utf-8")
    r = probes.run({"type": "shell", "cmd": PY + f' -c "print(open({str(cred)!r}).read())"'}, cwd=str(tmp_path))
    assert r["passed"] and "[MASKIERT]" in r["stdout_head"]
    assert "ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ123456" not in json.dumps(r) and AKIA not in json.dumps(r)
    r = probes.run({"type": "file", "path": "cred", "contains_regex": "token"}, cwd=str(tmp_path))
    assert r["passed"] and "[MASKIERT]" in r["stdout_head"] and AKIA not in json.dumps(r)
    r = probes.run({"type": "answer", "expected": "x"}, answer_text=f"key {AKIA}")
    assert not r["passed"] and AKIA not in json.dumps(r)
    r = probes.run({"type": "shell", "cmd": PY + f' -c "import sys; sys.exit(2)"', "expect_regex": AKIA})
    assert AKIA not in r["detail"]  # auch das Muster selbst wandert maskiert


def test_answer_probe_abgriffe():
    zahl = {"type": "answer", "expected": 42}
    assert probes.run(zahl, answer_text="Rechnung: 6*7\nErgebnis: 42")["passed"]
    assert not probes.run(zahl, answer_text="Ergebnis: 43")["passed"]
    ohne = probes.run(zahl, answer_text=None)
    assert not ohne["passed"] and "keine Antwort" in ohne["detail"]
    assert not probes.run(zahl, answer_text="keine Zahl hier")["passed"]
    toleranz = {"type": "answer", "expected": "12,5", "tolerance": 0.2}
    assert probes.run(toleranz, answer_text="etwa 12.6")["passed"]
    assert not probes.run(toleranz, answer_text="etwa 12.8")["passed"]
    zeile = {"type": "answer", "expected": "Berlin", "extract": "last_line"}
    assert probes.run(zeile, answer_text="Die Hauptstadt ist ...\nBerlin\n")["passed"]
    assert not probes.run(zeile, answer_text="Berlin ist die Hauptstadt")["passed"]
    exakt = {"type": "answer", "expected": "Berlin"}
    assert probes.run(exakt, answer_text="  Berlin \n")["passed"]
    assert not probes.run(exakt, answer_text="Berlin.")["passed"]


def test_forbid_probe_findet_stubs(tmp_path):
    d = tmp_path / "d"
    d.mkdir()
    (d / "a.py").write_text("def f():\n    pass  # TODO später\n", encoding="utf-8")
    (d / "b.py").write_text("def g():\n    return 1\n", encoding="utf-8")
    (d / "bin.dat").write_bytes(b"\0\0TODO\0")  # binär: wird übersprungen
    cwd = str(d)
    treffer = probes.run({"type": "forbid", "path": "a.py", "regex": r"TODO|NotImplemented"}, cwd=cwd)
    assert not treffer["passed"] and "a.py:2" in treffer["detail"]
    assert probes.run({"type": "forbid", "path": str(d / "b.py"), "regex": "TODO"}, cwd=cwd)["passed"]
    verzeichnis = probes.run({"type": "forbid", "path": ".", "regex": "TODO"}, cwd=cwd)
    assert not verzeichnis["passed"] and "a.py" in verzeichnis["detail"] and "bin.dat" not in verzeichnis["detail"]
    fehlt = probes.run({"type": "forbid", "path": "nix.py", "regex": "TODO"}, cwd=cwd)
    assert not fehlt["passed"]  # nichts Prüfbares ist nicht bestanden


def test_run_schreibt_bus_zeile_und_lehnt_ungueltige_probe_ab():
    probes.run({"type": "answer", "expected": 1}, answer_text="1")
    rec = bus.tail(1)[0]
    assert rec["event"] == "probe.run" and rec["type"] == "answer" and rec["passed"] is True
    with pytest.raises(probes.ProbeError):
        probes.run({"type": "shell"})


def test_describe_nennt_kommando_woertlich():
    cmd = "python3 -m pytest tests -q"
    text = probes.describe({"type": "shell", "cmd": cmd, "expect_regex": "passed"})
    assert cmd in text and "Exit 0" in text and "/passed/" in text
    assert "letzte Zahl == 42" in probes.describe({"type": "answer", "expected": 42})
    assert "±0.5" in probes.describe({"type": "answer", "expected": 42, "tolerance": 0.5})
    assert "darf nicht existieren" in probes.describe({"type": "file", "path": "x", "must_exist": False})
    assert "/TODO/" in probes.describe({"type": "forbid", "path": "src", "regex": "TODO"})


# --- Schlussprüfung: Zeit statt Musterfilter (Befund tests/test_probes.py:52) -----------------------
def test_musterpruefung_bricht_nach_der_frist_ab_statt_die_pruefung_anzuhalten(tmp_path, monkeypatch):
    """Die Heuristik _NESTED_QUANTIFIER lässt '^((a+))+$' und '^(a|a)+$' durch — beide laufen auf
    40 Zeichen exponentiell (gemessen: 0,93 s bei 24 Zeichen, Faktor 4 je zwei Zeichen). Geprüft wird
    hier nicht das Muster, sondern die ZEIT: die Probe muss innerhalb der Frist als nicht bestanden
    zurückkommen. Ohne die Frist läuft dieser Test Stunden."""
    monkeypatch.setattr(probes, "REGEX_TIMEOUT", 0.5)
    (tmp_path / "x.txt").write_text("a" * 40 + "!", encoding="utf-8")
    cwd = str(tmp_path)
    for rx in ["^((a+))+$", "^(a|a)+$"]:
        probes.validate({"type": "file", "path": "x.txt", "contains_regex": rx})   # validate lässt es zu
        for probe in ({"type": "file", "path": "x.txt", "contains_regex": rx},
                      {"type": "forbid", "path": ".", "regex": rx},
                      {"type": "shell", "cmd": "printf '%s' " + "a" * 40 + "!", "expect_regex": rx}):
            start = time.monotonic()
            r = probes.run(probe, cwd=cwd)
            dauer = time.monotonic() - start
            assert dauer < 10, (probe["type"], rx, dauer)      # die Frist greift, nicht das Backtracking
            assert not r["passed"] and "Frist" in r["detail"], (probe["type"], rx, r["detail"])


def test_hardlink_nach_aussen_ist_nicht_pruefbar(tmp_path):
    """Befund a2/2d in seiner Restform: die cwd-Schranke arbeitet über Pfade, ein harter Verweis
    innerhalb von cwd zeigt inhaltlich nach außen. st_nlink > 1 heißt: nicht prüfbar."""
    work, aussen = tmp_path / "work", tmp_path / "aussen"
    work.mkdir(), aussen.mkdir()
    (aussen / "credentials").write_text("PRIVAT-INHALT-XYZ\n", encoding="utf-8")
    os.link(aussen / "credentials", work / "hart")
    cwd = str(work)
    r = probes.run({"type": "file", "path": "hart", "contains_regex": "PRIVAT"}, cwd=cwd)
    assert not r["passed"] and "harte Verweise" in r["detail"]
    assert "PRIVAT-INHALT-XYZ" not in r["stdout_head"] and "PRIVAT-INHALT-XYZ" not in r["detail"]
    r = probes.run({"type": "file", "path": "hart"}, cwd=cwd)          # auch die reine Existenz liest
    assert not r["passed"] and "PRIVAT-INHALT-XYZ" not in r["stdout_head"]
    r = probes.run({"type": "forbid", "path": ".", "regex": "PRIVAT-INHALT-XYZ"}, cwd=cwd)
    assert not r["passed"] and "harten Verweisen" in r["detail"]
    assert "PRIVAT-INHALT-XYZ" not in paths.bus_file().read_text(encoding="utf-8")
    # Eine gewöhnliche Datei in cwd bleibt prüfbar
    (work / "ok.txt").write_text("drin\n", encoding="utf-8")
    assert probes.run({"type": "file", "path": "ok.txt", "contains_regex": "drin"}, cwd=cwd)["passed"]


def test_lauf_traegt_ein_token_das_an_probe_und_vertrag_gebunden_ist():
    """Nur ein gelaufener Lauf trägt ein Token; es gilt für genau diese Probe, diesen Vertrag und
    diesen Lauf. Ohne das Token nimmt contract.set_verdict keinen bestandenen Lauf an."""
    probe = {"type": "answer", "expected": 42}
    r = probes.run(probe, answer_text="42", contract_id="v1")
    assert r["passed"] and probes.check_run_token(r, probe, "v1") is None
    assert probes.check_run_token(r, probe, "v2") == "Lauf-Token passt nicht zu Probe, Vertrag oder Lauf"
    assert probes.check_run_token(r, {"type": "answer", "expected": 43}, "v1").startswith("Lauf-Token passt nicht")
    gedreht = dict(r, detail="bestanden (angeblich)")
    assert probes.check_run_token(gedreht, probe, "v1").startswith("Lauf-Token passt nicht")
    assert probes.check_run_token({k: v for k, v in r.items() if k != "token"}, probe, "v1") \
        == "ohne Lauf-Token (keine Probe gelaufen)"
    # Das Token steht auch auf dem Bus, und der Schlüssel liegt unter SOUL10_HOME, nie im Repo
    rec = bus.tail(1)[0]
    assert rec["event"] == "probe.run" and rec["token"] == r["token"] and rec["contract_id"] == "v1"
    schluessel = paths.home() / "state" / "lauf.key"
    assert schluessel.exists() and (schluessel.stat().st_mode & 0o077) == 0
    # Verbrauch ist einmalig
    assert not probes.run_token_used(r)
    probes.spend_run_tokens([r])
    assert probes.run_token_used(r)
