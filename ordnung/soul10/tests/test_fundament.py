"""Fundament: Pfade lazy, Bus schreibt maskiert, Modell-Adapter mit Fake und gemessenen Texten."""
import json
import os
import sys
from pathlib import Path

from core import bus, model, paths


def test_home_folgt_env_und_legt_verzeichnisse_an(tmp_path):
    h = paths.home()
    assert str(h).startswith(str(tmp_path))
    for sub in ("state/contracts", "state/receipts", "inbox", "rollback", "watch"):
        assert (h / sub).is_dir()


def test_new_id_sortierbar_und_eindeutig():
    a, b = paths.new_id(), paths.new_id()
    assert a != b and len(a) == 20 and a[13] == "-"


def test_bus_schreibt_und_maskiert():
    bus.emit("test", text="Token sk-abcdefghijklmnopqrstuvwxyz1234 im Text", n=3)
    zeilen = paths.bus_file().read_text().splitlines()
    rec = json.loads(zeilen[-1])
    assert rec["event"] == "test" and rec["n"] == 3
    assert "sk-abcdefghijklmnopqrstuvwxyz1234" not in rec["text"] and "[MASKIERT]" in rec["text"]
    assert bus.tail(1)[0]["event"] == "test"


def test_fake_modell_greift():
    r = model.call(None, "Was ist 40+2?")
    assert r["ok"] and r["text"] == "42"


def test_fake_liste(fake_model):
    aufrufe = fake_model(["7", "9"])
    assert model.call(None, "a")["text"] == "7"
    assert model.call("sys", "b")["text"] == "9"
    assert model.call(None, "c")["text"] == "9"
    assert len(aufrufe) == 3 and aufrufe[1]["system"] == "sys"


def test_abgriff():
    assert model.extract_last_number("Rechnung: 3 + 4 = 7\nAntwort: 12,5") == 12.5
    assert model.extract_last_number("keine zahl") is None
    assert model.extract_last_line("a\n\n b \n") == "b"


def test_abgriff_tausendertrennung_und_dezimalen():
    assert model.extract_last_number("Ergebnis: 10.000") == 10000.0
    assert model.extract_last_number("Summe 1.000.000,5") == 1000000.5
    assert model.extract_last_number("pi ist 3.14159") == 3.14159
    assert model.extract_last_number("Wert 12.5") == 12.5
    assert model.extract_last_number("also 10000") == 10000.0
    assert model.extract_last_number("Bus.SECRET_PATTERN") is None


def test_secret_pattern_oeffentlich():
    assert bus.SECRET_PATTERN.search("ghp_abcdefghijklmnopqrstuvwxyz1234")
    assert not bus.SECRET_PATTERN.search("harmloser Text")


def test_aufwandsregel_byte_gleich_zur_pruefstrecke():
    sys.path.insert(0, str(paths.repo_root() / "bewusstsein" / "harness"))
    import arme  # noqa: E402
    assert model.AUFWANDSREGEL == arme.V5_NUR_ZUTEILUNG


def test_pruefer_wortlaut_aus_der_pruefstrecke():
    src = (paths.repo_root() / "bewusstsein" / "harness" / "mehrfach.py").read_text()
    assert model.PRUEFER_SYSTEM in src
    p = model.pruefer_prompt("A", "B")
    assert p.startswith("AUFGABE:\nA\n\nVORGESCHLAGENE ANTWORT:\nB\n\n")
    assert "von den gegebenen Groessen her neu aufbaust" in p and "exakt im verlangten Format" in p


def test_secret_muster_kennt_die_gaengigen_formate():
    for probe in ("AIza" + "a" * 35, "github_pat_" + "A" * 30, "gho_" + "b" * 24, "xapp-1-A1-abc",
                  "-----BEGIN RSA PRIVATE KEY-----", "-----BEGIN PRIVATE KEY-----"):
        assert bus.SECRET_PATTERN.search(probe), probe
        assert "[MASKIERT]" in bus.mask("x " + probe + " y")
    assert not bus.SECRET_PATTERN.search("AIza zu kurz") and not bus.SECRET_PATTERN.search("github_patch")


def test_bus_rotation_ueberschreibt_sich_nicht_in_derselben_sekunde(monkeypatch):
    monkeypatch.setattr(bus, "_ROTATE_BYTES", 50)
    for i in range(12):
        bus.emit("rotation", i=i, fuellung="x" * 40)
    dateien = sorted(paths.bus_file().parent.glob("events-*.jsonl"))
    assert len(dateien) >= 2
    zeilen = sum(len(d.read_text(encoding="utf-8").splitlines()) for d in dateien)
    zeilen += len(paths.bus_file().read_text(encoding="utf-8").splitlines())
    assert zeilen == 12  # keine Zeile verloren
