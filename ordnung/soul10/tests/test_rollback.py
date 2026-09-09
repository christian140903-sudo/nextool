"""Rückbau-Konto: Rückweg je Befehlsklasse, Sicherungskopie + Undo stellt Bytes wieder her,
ohne Rückweg → Bestätigung, Quote als Zahl, das Konto löscht nie."""
import json
import os
import shlex
import sys
from pathlib import Path

import pytest

from core import bus, paths, rollback

PY = sys.executable


def _zeilen():
    return [json.loads(z) for z in paths.rollback_file().read_text(encoding="utf-8").splitlines()]


# --- infer_from_bash: je Befehlsklasse ein Rückweg --------------------------------------------
@pytest.mark.parametrize("befehl, kind, undo", [
    ("pip install requests", "install", "pip uninstall -y requests"),
    ("pip3 install requests==2.31.0 flask", "install", "pip3 uninstall -y requests flask"),
    ("python3 -m pip install numpy", "install", "python3 -m pip uninstall -y numpy"),
    ("sudo pip install foo", "install", "sudo pip uninstall -y foo"),
    ("pipx install ruff", "install", "pipx uninstall ruff"),
    ("uv pip install httpx", "install", "uv pip uninstall httpx"),
    ("uv add httpx", "install", "uv remove httpx"),
    ("uv tool install ruff", "install", "uv tool uninstall ruff"),
    ("npm install express", "install", "npm uninstall express"),
    ("npm i -g typescript", "install", "npm uninstall -g typescript"),
    ("npm add @scope/pkg@1.2.3", "install", "npm uninstall @scope/pkg"),
    ("pnpm add lodash", "install", "pnpm remove lodash"),
    ("yarn add react", "install", "yarn remove react"),
    ("yarn global add typescript", "install", "yarn global remove typescript"),
    ("apt-get install -y jq", "install", "apt-get remove -y jq"),
    ("sudo apt-get install jq=1.6", "install", "sudo apt-get remove -y jq"),
    ("brew install ripgrep", "install", "brew uninstall ripgrep"),
    ("brew install --cask iterm2", "install", "brew uninstall --cask iterm2"),
    ("cargo install ripgrep", "install", "cargo uninstall ripgrep"),
    ("git commit -m 'x'", "git", "git revert --no-edit HEAD"),
])
def test_infer_je_befehlsklasse(befehl, kind, undo):
    r = rollback.infer_from_bash(befehl)
    assert r is not None, befehl
    assert r["kind"] == kind and r["undo"] == undo
    assert r["description"] == befehl
    assert set(r) == {"kind", "description", "undo"}


@pytest.mark.parametrize("befehl", [
    "ls -la", "echo hallo", "git status", "git push origin main",
    "pip install -r requirements.txt", "pip install .", "pip install -e .",
    "npm install", "npm install ./lokal", "uv sync", "yarn", "cp nur_ein_argument", "",
])
def test_infer_ohne_rueckweg_liefert_none(befehl):
    assert rollback.infer_from_bash(befehl) is None


def test_infer_findet_rueckweg_in_befehlskette_und_pipe():
    r = rollback.infer_from_bash("cd /tmp && pip install requests")
    assert r and r["undo"] == "pip uninstall -y requests"
    r = rollback.infer_from_bash("pip install requests | tee install.log")
    assert r and r["undo"] == "pip uninstall -y requests"
    r = rollback.infer_from_bash("git add -A; git commit -m 'fertig'")
    assert r and r["kind"] == "git"
    # das Ergebnis passt unverändert in register()
    p = rollback.register(**rollback.infer_from_bash("npm install express"))
    assert p["kind"] == "install" and p["needs_confirmation"] is False


# --- register: ohne Rückweg braucht es eine Bestätigung ---------------------------------------
def test_register_ohne_rueckweg_braucht_bestaetigung():
    p = rollback.register("other", "Mail an Kunden verschickt", undo=None)
    assert p["needs_confirmation"] is True and p["undo"] is None and p["status"] == "open"
    assert p["kind"] == "other" and p["contract_id"] is None and p["id"] and p["at"]
    q = rollback.register("install", "pip install x", undo="pip uninstall -y x", contract_id="c1",
                          evidence={"exit": 0})
    assert q["needs_confirmation"] is False and q["contract_id"] == "c1" and q["evidence"] == {"exit": 0}
    # ein leerer Rückweg ist keiner
    r = rollback.register("command", "irgendwas", undo="   ")
    assert r["needs_confirmation"] is True and r["undo"] is None
    ops = [z["op"] for z in _zeilen()]
    assert ops == ["register", "register", "register"]
    letzte = bus.tail(3, "rollback.register")
    assert [b["needs_confirmation"] for b in letzte] == [True, False, True]


def test_register_lehnt_unbekannte_art_ab_und_maskiert():
    with pytest.raises(rollback.RollbackError, match="unbekannte Art"):
        rollback.register("magie", "x", undo=None)
    assert not paths.rollback_file().exists() or _zeilen() == []
    p = rollback.register("other", "Token sk-abcdefghijklmnopqrstuvwxyz1234 gesendet", undo=None)
    assert "sk-abcdefghijklmnopqrstuvwxyz1234" not in p["description"] and "[MASKIERT]" in p["description"]


# --- snapshot_file + undo ----------------------------------------------------------------------
def test_snapshot_und_undo_stellt_inhalt_wieder_her(tmp_path):
    datei = tmp_path / "config.toml"
    original = "a = 1\nb = 'zwei'\numlaut = 'äöü'\n"
    datei.write_text(original, encoding="utf-8")
    p = rollback.snapshot_file(str(datei))
    assert p["kind"] == "file" and p["needs_confirmation"] is False
    assert p["undo"].startswith(shlex.quote(rollback.PY) + " -c") and "shutil" in p["undo"]
    snap = Path(p["evidence"]["snapshot"])
    assert snap.exists() and snap.name == "config.toml" and snap.parent.parent == paths.rollback_dir()
    assert p["evidence"]["existed"] is True and p["evidence"]["sha256"] == paths.sha256_text(original)
    assert bus.tail(1, "rollback.snapshot")[0]["existed"] is True

    datei.write_text("kaputt", encoding="utf-8")
    r = rollback.undo(p["id"])
    assert r["status"] == "undone" and r["undo_exit"] == 0 and r["undo_error"] is None
    assert datei.read_text(encoding="utf-8") == original
    assert bus.tail(1, "rollback.undo")[0]["status"] == "undone"


def test_snapshot_neue_datei_undo_loescht_sie(tmp_path):
    datei = tmp_path / "neu.txt"
    p = rollback.snapshot_file(str(datei))
    assert p["evidence"]["existed"] is False and p["evidence"]["snapshot"] is None
    assert "os.remove" in p["undo"] and p["needs_confirmation"] is False
    datei.write_text("frisch geschrieben", encoding="utf-8")
    r = rollback.undo(p["id"])
    assert r["status"] == "undone" and not datei.exists()


def test_snapshot_verweigert_verzeichnis(tmp_path):
    with pytest.raises(rollback.RollbackError, match="Verzeichnis"):
        rollback.snapshot_file(str(tmp_path))


def test_undo_ohne_rueckweg_oder_unbekannt_ist_fehler():
    p = rollback.register("other", "x", undo=None)
    with pytest.raises(rollback.RollbackError, match="keinen Rückweg"):
        rollback.undo(p["id"])
    with pytest.raises(rollback.RollbackError, match="unbekannter Posten"):
        rollback.undo("gibt-es-nicht")
    assert rollback.list_open()[0]["id"] == p["id"]


def test_undo_fehlschlag_wird_verbucht():
    p = rollback.register("command", "x", undo=f'"{PY}" -c "import sys; sys.exit(3)"')
    r = rollback.undo(p["id"])
    assert r["status"] == "undo_failed" and r["undo_exit"] == 3 and r["undo_error"]
    assert rollback.list_open() == []
    q = rollback.quota()
    assert q["undone_failed"] == 1 and q["undone_ok"] == 0


def test_undo_dry_run_fuehrt_nichts_aus(tmp_path):
    marker = tmp_path / "marker"
    p = rollback.register("command", "x", undo=f'"{PY}" -c "open({str(marker)!r}, \'w\').close()"')
    r = rollback.undo(p["id"], dry_run=True)
    assert r["dry_run"] is True and r["would_run"] == p["undo"] and not marker.exists()
    assert rollback.list_open()[0]["id"] == p["id"] and [z["op"] for z in _zeilen()] == ["register"]
    r2 = rollback.undo(p["id"])
    assert r2["status"] == "undone" and marker.exists()


# --- Quote und Konto -------------------------------------------------------------------------------
def test_quote_ist_eine_zahl():
    assert rollback.quota() == {"registered": 0, "with_undo": 0, "without_undo": 0,
                                "undone_ok": 0, "undone_failed": 0, "quote": 0.0}
    rollback.register("install", "a", undo=f'"{PY}" -c "pass"')
    rollback.register("install", "b", undo=f'"{PY}" -c "pass"')
    c = rollback.register("other", "c", undo=None)
    q = rollback.quota()
    assert q["registered"] == 3 and q["with_undo"] == 2 and q["without_undo"] == 1
    assert q["quote"] == pytest.approx(2 / 3)
    assert bus.tail(1, "rollback.quota")[0]["quote"] == pytest.approx(2 / 3)
    assert [p["id"] for p in rollback.list_open()][-1] == c["id"]


def test_konto_loescht_nie_und_zustand_entsteht_beim_lesen():
    p = rollback.register("command", "x", undo=f'"{PY}" -c "pass"')
    rollback.undo(p["id"])
    ops = [z["op"] for z in _zeilen()]
    assert ops == ["register", "undo"]          # die Register-Zeile bleibt, der Status ist eine neue Zeile
    assert rollback.list_open() == []
    q = rollback.quota()
    assert q["registered"] == 1 and q["undone_ok"] == 1 and q["quote"] == 1.0


# --- Dateisystem-Rückwege: Python-Einzeiler, plattformneutral, nie erfunden -------------------------
def _argv(undo):
    return rollback.argv_chain(undo)


def test_infer_dateisystem_rueckwege_sind_python_und_treffen_nur_neues(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    r = rollback.infer_from_bash("cp a.txt b.txt")
    assert r["kind"] == "file" and r["description"] == "cp a.txt b.txt" and set(r) == {"kind", "description", "undo"}
    assert _argv(r["undo"])[0][:2] == [rollback.PY, "-c"] and "b.txt" in r["undo"] and "os.remove" in r["undo"]
    r = rollback.infer_from_bash("cp -r src dst_copy")
    assert "rmtree" in r["undo"] and "dst_copy" in r["undo"]
    r = rollback.infer_from_bash("mv alt.txt neu.txt")
    assert "shutil.move" in r["undo"] and r["undo"].index("neu.txt") < r["undo"].index("alt.txt")
    # mkdir -p: genau die neuen Ebenen, tiefste zuerst; ein vorhandenes Verzeichnis ergibt nichts.
    r = rollback.infer_from_bash("mkdir -p build/out")
    assert "os.rmdir" in r["undo"] and r["undo"].index("build/out") < r["undo"].index("'build'")
    (tmp_path / "da").mkdir()
    assert rollback.infer_from_bash("mkdir da") is None and rollback.infer_from_bash("mkdir -p da") is None
    r = rollback.infer_from_bash("mkdir -p da/neu")
    assert r["undo"].count("os.rmdir") == 1 and "da/neu" in r["undo"]
    # Der Rückweg läuft und räumt genau das weg, was der Befehl anlegte.
    (tmp_path / "build" / "out").mkdir(parents=True)
    p = rollback.register("file", "mkdir -p build/out", undo=rollback.infer_from_bash("mkdir -p build/out") and "x" or None)
    assert p["needs_confirmation"] is True  # der Baum existiert jetzt: kein neuer Rückweg mehr ableitbar
    undo = rollback._rmdir_command([str(tmp_path / "build" / "out"), str(tmp_path / "build")])
    q = rollback.register("file", "mkdir -p build/out", undo=undo)
    assert rollback.undo(q["id"])["status"] == "undone" and not (tmp_path / "build").exists()


def test_cp_und_mv_ueber_bestehendes_ziel_erfinden_keinen_rueckweg(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    (tmp_path / "a.txt").write_text("neu", encoding="utf-8")
    (tmp_path / "b.txt").write_text("alter Inhalt von b", encoding="utf-8")
    r = rollback.infer_from_bash("cp a.txt b.txt")
    assert r["undo"] is None and r["overwrites"] == ["b.txt"]
    # register_from_bash sichert b.txt byte-genau; nach dem cp stellt undo den Vorzustand her.
    p = rollback.register_from_bash("cp a.txt b.txt", evidence={"tool": "Bash"})
    assert p["kind"] == "file" and p["needs_confirmation"] is False and p["evidence"]["existed"] is True
    (tmp_path / "b.txt").write_text("neu", encoding="utf-8")  # das tut cp
    assert rollback.undo(p["id"])["status"] == "undone"
    assert (tmp_path / "b.txt").read_text(encoding="utf-8") == "alter Inhalt von b"
    # mv über ein bestehendes Ziel: ebenso Sicherung statt „mv zurück" (das verlöre das alte Ziel).
    (tmp_path / "c.txt").write_text("c alt", encoding="utf-8")
    p = rollback.register_from_bash("mv a.txt c.txt")
    assert p["evidence"]["existed"] is True and "c.txt" in p["evidence"]["path"]
    # In ein Verzeichnis, in dem der Name schon liegt: Ziel ist dir/a.txt.
    (tmp_path / "dir").mkdir()
    (tmp_path / "dir" / "a.txt").write_text("im dir", encoding="utf-8")
    r = rollback.infer_from_bash("cp a.txt dir/")
    assert r["overwrites"] == ["dir/a.txt"]
    # cp -r in ein bestehendes Verzeichnis legt ziel/src an: echter Rückweg (ziel/src entfernen).
    (tmp_path / "src").mkdir()
    (tmp_path / "ziel").mkdir()
    r = rollback.infer_from_bash("cp -r src ziel")
    assert r["undo"] and "ziel/src" in r["undo"] and "rmtree" in r["undo"]
    # Liegt dort schon ein Verzeichnis dieses Namens, gibt es keine Sicherung → Bestätigungspflicht.
    (tmp_path / "ziel" / "src").mkdir()
    r = rollback.infer_from_bash("cp -r src ziel")
    assert r["undo"] is None and r["overwrites"] == ["ziel/src"]
    ohne = rollback.register_from_bash("cp -r src ziel")
    assert ohne["needs_confirmation"] is True and "überschreibt" in ohne["description"]


def test_rueckweg_ist_argumentliste_keine_shell(tmp_path, monkeypatch):
    """Prüfbefund hoch: Metazeichen in Paketnamen und Pfaden wanderten in einen Shell-String."""
    monkeypatch.chdir(tmp_path)
    marker = tmp_path / "pwned"
    # Ein Paketname mit Kommando-Substitution bekommt gar keinen Rückweg.
    for befehl in ("npm install 'lodash$(touch pwned)'", "pip install 'requests$(touch pwned)'",
                   "brew install 'rg`touch pwned`'", "apt-get install -y 'jq$(touch pwned)'"):
        assert rollback.infer_from_bash(befehl) is None, befehl
    # pip-Marker (`;`) werden abgeschnitten wie eine Versionsangabe; der Rest ist ein sauberer Name.
    assert rollback.infer_from_bash("pip install 'requests;touch pwned'")["undo"] == "pip uninstall -y requests"
    # Ein Pfad mit Semikolon ist ein Pfad: der Rückweg nimmt ihn wörtlich, die Shell sieht ihn nie.
    r = rollback.infer_from_bash("cp a.txt 'b;touch pwned'")
    assert r["undo"] and "touch pwned" in r["undo"]
    p = rollback.register("file", "cp", undo=r["undo"])
    res = rollback.undo(p["id"])
    assert res["status"] == "undone" and not marker.exists()
    # Auch ein von Hand registrierter Rückweg läuft ohne Shell: $(…), > und | sind Literale.
    q = rollback.register("command", "x", undo=f"{shlex.quote(PY)} -c 'print(1)' '$(touch pwned)' '>' out.txt '|' cat")
    res = rollback.undo(q["id"])
    assert res["status"] == "undone" and not marker.exists() and not (tmp_path / "out.txt").exists()
    assert rollback.undo(q["id"], dry_run=True)["argv"][0][:2] == [PY, "-c"]
    # Glieder mit && laufen nacheinander, das erste Scheitern beendet die Kette.
    k = rollback.register("command", "x", undo=f"{shlex.quote(PY)} -c 'raise SystemExit(2)' && {shlex.quote(PY)} -c \"open('danach','w').close()\"")
    res = rollback.undo(k["id"])
    assert res["status"] == "undo_failed" and res["undo_exit"] == 2 and not (tmp_path / "danach").exists()
    # Ein unlesbarer Rückweg (offene Quotes) wird gar nicht erst eingetragen.
    with pytest.raises(rollback.RollbackError, match="nicht lesbar"):
        rollback.register("command", "x", undo="echo 'offen")


def test_segmente_werden_quote_bewusst_getrennt():
    assert rollback.split_segments("echo 'a;b' && pip install x | tee log") == ["echo 'a;b'", "pip install x", "tee log"]
    assert rollback.split_segments('cp "x|y" z; ls') == ['cp "x|y" z', "ls"]
    r = rollback.infer_from_bash("echo 'hallo; welt' && pip install requests")
    assert r and r["undo"] == "pip uninstall -y requests"
    assert rollback.infer_from_bash("echo 'offen && pip install x") is None
