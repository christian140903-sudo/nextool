"""Proben: Validierung lehnt Unbrauchbares ab; vier Typen laufen deterministisch; jeder Lauf schreibt auf den Bus."""
import sys

import pytest

from core import bus, probes

PY = sys.executable


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


def test_file_probe(tmp_path):
    f = tmp_path / "bericht.md"
    f.write_text("# Bericht\nErgebnis: 42\n", encoding="utf-8")
    assert probes.run({"type": "file", "path": "bericht.md", "contains_regex": r"Ergebnis: \d+"},
                      cwd=str(tmp_path))["passed"]
    assert not probes.run({"type": "file", "path": str(f), "forbids_regex": "Ergebnis"})["passed"]
    assert not probes.run({"type": "file", "path": str(f), "contains_regex": "Fazit"})["passed"]
    fehlt = probes.run({"type": "file", "path": str(tmp_path / "nix.md")})
    assert not fehlt["passed"] and "fehlt" in fehlt["detail"]
    assert probes.run({"type": "file", "path": str(tmp_path / "nix.md"), "must_exist": False})["passed"]
    assert not probes.run({"type": "file", "path": str(f), "must_exist": False})["passed"]
    assert not probes.run({"type": "file", "path": str(tmp_path)})["passed"]  # Verzeichnis ist keine Datei


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
    (tmp_path / "a.py").write_text("def f():\n    pass  # TODO später\n", encoding="utf-8")
    (tmp_path / "b.py").write_text("def g():\n    return 1\n", encoding="utf-8")
    treffer = probes.run({"type": "forbid", "path": "a.py", "regex": r"TODO|NotImplemented"}, cwd=str(tmp_path))
    assert not treffer["passed"] and "a.py:2" in treffer["detail"]
    assert probes.run({"type": "forbid", "path": str(tmp_path / "b.py"), "regex": "TODO"})["passed"]
    verzeichnis = probes.run({"type": "forbid", "path": str(tmp_path), "regex": "TODO"})
    assert not verzeichnis["passed"] and "a.py" in verzeichnis["detail"]
    fehlt = probes.run({"type": "forbid", "path": str(tmp_path / "nix.py"), "regex": "TODO"})
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
