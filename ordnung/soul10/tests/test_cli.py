"""Kommandozeile: Verweigerung der Module als Exit ≠ 0 mit ihrer Meldung; status läuft; switch sagt direkt;
ein Lauf mit Fake-Modell; bin/soul ist POSIX sh und zeigt auf core/cli.py; jede Ausführung schreibt eine Bus-Zeile."""
import io
import json
import os
import subprocess
import sys

import pytest

from core import bus, cli, inventory, paths

ROOT = paths.soul10_root()
CLI = ROOT / "core" / "cli.py"
PROBE_42 = '{"type":"answer","expected":42}'
ZIEL = "Was ist 6*7? Antworte nur mit der Zahl."


# --- Helfer --------------------------------------------------------------------------------------
def _env():
    env = dict(os.environ)
    env["PYTHONDONTWRITEBYTECODE"] = "1"
    env["PATH"] = os.path.dirname(sys.executable) + os.pathsep + env.get("PATH", "")
    return env


def _sub(*args, timeout=90):
    """Ein Aufruf wie durch bin/soul: eigener Prozess, SOUL10_HOME aus conftest."""
    return subprocess.run([sys.executable, str(CLI), *args], capture_output=True, text=True,
                          env=_env(), timeout=timeout)


def _run(*args):
    out, err = io.StringIO(), io.StringIO()
    rc = cli.main(list(args), stdout=out, stderr=err)
    return rc, out.getvalue(), err.getvalue()


def _json(*args):
    rc, out, err = _run(*args)
    assert rc == 0, err
    return json.loads(out)


@pytest.fixture
def schnelles_profil(monkeypatch):
    monkeypatch.setattr(inventory, "aufnehmen", lambda: {
        "geraet": {"system": "Test", "maschine": "x86_64", "ram_gb": 8.0, "cpu_kerne": 2},
        "grafik": {"nvidia": None, "vram_gb": None, "apple_gpu": None}, "werkzeuge": {},
        "lokale_modelle": {"ollama": False},
        "zugaenge": {"umgebungsvariablen": {}, "konfigurationen": {}, "hinweis": ""},
        "empfehlung": {"lokale_stufe": "kein lokales Modell sinnvoll"},
        "offene_fragen": ["Gibt es Kontingent-Grenzen?"]})


# --- die drei Pflichtfälle aus ARCHITEKTUR 5.11, je in einem eigenen Prozess -------------------
def test_subprozess_contract_new_ohne_probe_exit_ungleich_null_mit_meldung():
    p = _sub("contract", "new", "Ziel ohne Probe")
    assert p.returncode == cli.EXIT_REFUSED
    assert "Auftrag ohne Abnahmeprobe abgelehnt" in p.stderr and p.stdout == ""
    assert list(paths.contracts_dir().glob("*.json")) == []


def test_subprozess_status_laeuft():
    p = _sub("status")
    assert p.returncode == 0, p.stderr
    data = json.loads(p.stdout)
    assert data["home"] == str(paths.home()) and data["chain_ok"] is True
    assert data["memory"]["gesamt"] == 0 and data["contracts"]["open"] == 0
    assert data["rollback"]["registered"] == 0 and data["calibration"]["n"] == 0
    assert data["mandate"] is None and isinstance(data["last_events"], list)
    # Messgrößen, die sonst keinen Aufrufer im Produkt hätten: G5 und fällige Vorhersagen.
    assert data["state_ok"] is True and data["contamination_share"] == 1.0 and data["predictions_due"] == 0


def test_subprozess_switch_trivial_direkt_und_ohne_regeltext():
    p = _sub("switch", "Berechne 2+2, nur die Zahl")
    assert p.returncode == 0, p.stderr
    data = json.loads(p.stdout)
    assert data["stage"] == "direkt" and data["inject"] is False
    assert "Passe deinen Aufwand" not in p.stdout
    log = paths.routing_file().read_text(encoding="utf-8")
    assert "Berechne" not in log and "Berechne" not in paths.bus_file().read_text(encoding="utf-8")


# --- bin/soul und bin/soul.cmd ------------------------------------------------------------------
def test_bin_soul_ist_posix_sh_und_ruft_cli():
    script = ROOT / "bin" / "soul"
    text = script.read_text(encoding="utf-8")
    assert text.startswith("#!/bin/sh\n") and "core/cli.py" in text and "python3" in text
    assert "zsh" not in text and "pbcopy" not in text and "open " not in text
    assert os.access(script, os.X_OK)
    p = subprocess.run(["sh", str(script), "decompose", "--check", "groesser als die Zahl davor"],
                       capture_output=True, text=True, env=_env(), timeout=90)
    assert p.returncode == 0, p.stderr
    assert json.loads(p.stdout)["empfehlung"] == "einzeln"
    cmd = (ROOT / "bin" / "soul.cmd").read_text(encoding="utf-8")
    assert cmd.startswith("@echo off") and "core\\cli.py" in cmd and "%*" in cmd


def test_ohne_befehl_hilfe_und_unbekannter_befehl_usage():
    rc, out, err = _run()
    assert rc == cli.EXIT_NO_COMMAND and "contract" in out and "verify" in out
    rc, out, err = _run("quatsch")
    assert rc == cli.EXIT_USAGE and out == ""
    rc, out, err = _run("contract", "new", "Ziel", "--probe", "kein json")
    assert rc == cli.EXIT_USAGE and "Probe 1 ist kein JSON" in err


# --- Vertrag, Prüfer, Übergabe --------------------------------------------------------------------
def test_vertrag_lebenszyklus_ueber_die_kommandozeile():
    c = _json("contract", "new", ZIEL, "--probe", PROBE_42, "--non-goal", "kein Code",
              "--budget", '{"turns":5}')
    cid = c["id"]
    assert c["status"] == "open" and c["budget"]["turns"] == 5 and c["non_goals"] == ["kein Code"]
    assert [x["id"] for x in _json("contract", "list")] == [cid]
    rc, out, err = _run("contract", "handover", cid)
    assert rc == 0 and "Abnahmeproben" in out and "letzte Zahl == 42" in out
    assert _json("contract", "deliver", cid, "--report", "42")["status"] == "delivered"
    rc, out, err = _run("verify", cid, "--proposal", "42")
    assert rc == 0, err
    v = json.loads(out)
    assert v["verdict"] == "pass" and v["verifier"] == "deterministic" and v["calls"] == 0
    assert _json("contract", "show", cid)["status"] == "verified"
    assert _json("contract", "list") == []


def test_verify_fail_exit_3_und_block_mit_grund():
    cid = _json("contract", "new", ZIEL, "--probe", PROBE_42)["id"]
    rc, out, err = _run("verify", cid, "--proposal", "41")
    assert rc == cli.EXIT_NOT_PASSED and json.loads(out)["verdict"] == "fail"
    rc, out, err = _run("contract", "block", cid, "nochmal")  # failed → blocked kennt der Vertrag nicht
    assert rc == cli.EXIT_REFUSED and "ContractError" in err and "nicht erlaubt" in err
    offen = _json("contract", "new", ZIEL, "--probe", PROBE_42)["id"]
    b = _json("contract", "block", offen, "Probe", "nicht", "ausfuehrbar")
    assert b["status"] == "blocked" and b["log"][-1]["reason"] == "Probe nicht ausfuehrbar"
    rc, out, err = _run("contract", "block", offen)
    assert rc == cli.EXIT_USAGE  # argparse: der Grund ist Pflicht


def test_verify_mit_modell_ruft_pruefer(fake_model):
    from core import model
    aufrufe = fake_model(["42"])
    cid = _json("contract", "new", ZIEL, "--probe", PROBE_42)["id"]
    rc, out, err = _run("verify", cid, "--model", "--proposal", "42")
    assert rc == 0 and json.loads(out)["verifier"] == "deterministic+model"
    assert len(aufrufe) == 1 and aufrufe[0]["system"] == model.PRUEFER_SYSTEM
    aufrufe = fake_model(["42"])
    cid = _json("contract", "new", ZIEL, "--probe", PROBE_42)["id"]
    rc, out, err = _run("verify", cid, "--model", "test-modell", "--proposal", "42")
    assert rc == 0 and aufrufe[0]["model"] == "test-modell"


# --- Hauptbuch ------------------------------------------------------------------------------------
def test_remember_ohne_herkunft_abgelehnt_mit_herkunft_gerendert():
    rc, out, err = _run("remember", "Titel", "Text")
    assert rc == cli.EXIT_REFUSED and "Eintrag ohne Herkunft abgelehnt" in err and out == ""
    rc, out, err = _run("remember", "--source", "nutzer", "Titel", "Text")
    assert rc == cli.EXIT_REFUSED and "ohne Zitat" in err
    e = _json("remember", "--source", "nutzer", "--ref", "wörtliches Zitat", "--tag", "test",
              "Zielbranch", "Ausgeliefert wird vom Branch release-stabil.")
    assert e["status"] == "active"
    assert e["rendered"] == (f"[{paths.today()}] [Quelle: nutzer] [Vertrauen: 0,8] "
                             "Ausgeliefert wird vom Branch release-stabil.")
    rc, out, err = _run("recall", "release-stabil")
    assert rc == 0 and out.splitlines()[0].startswith(f"{e['id']} [fact] [{paths.today()}] [Quelle: nutzer]")
    assert out.rstrip().endswith("1 Treffer")
    hits = _json("recall", "release-stabil", "--json")
    assert hits[0]["id"] == e["id"]
    rc, out, err = _run("recall", "nichts-davon")
    assert rc == 0 and out.strip() == "0 Treffer"


def test_retract_predict_resolve_calibration():
    a = _json("remember", "--source", "dokument", "Quelle", "Aus dem Handbuch")["id"]
    b = _json("remember", "--source", "eigener_schluss", "--derived-from", a, "Folgerung", "Also")["id"]
    r = _json("retract", a, "--reason", "Handbuch veraltet")
    assert r["target"] == a and r["contaminated"] == [b]
    p = _json("predict", "Die Tests bleiben grün", "--confidence", "0.9", "--domain", "bau")
    assert p["confidence"] == 0.9 and p["resolved_at"] is None
    rc, out, err = _run("resolve", p["id"], "--outcome", "vielleicht")
    assert rc == cli.EXIT_USAGE and "true oder false" in err
    res = _json("resolve", p["id"], "--outcome", "true")
    assert res["outcome"] == 1 and res["brier"] == pytest.approx(0.01)
    cal = _json("calibration", "--domain", "bau")
    assert cal["n"] == 1 and cal["brier"] == pytest.approx(0.01)


def test_briefing_mit_offenem_vertrag_und_regel_am_ende():
    from core.memory import ledger
    cid = _json("contract", "new", "Tests fuer die CLI schreiben", "--probe", PROBE_42)["id"]
    _json("rollback", "register", "command", "rm -rf build")
    rc, out, err = _run("briefing")
    assert rc == 0
    zeilen = out.rstrip("\n").splitlines()
    assert zeilen[0].startswith("# Soul-10-Briefing (") and len(zeilen) <= 60
    assert "## Offene Vertraege" in zeilen and any(cid in z for z in zeilen)
    assert "## Offene Rueckbau-Posten" in zeilen and any("Bestaetigung noetig" in z for z in zeilen)
    assert out.rstrip("\n").endswith(ledger.REGEL_HERKUNFT.rstrip("\n"))
    rc, out, err = _run("briefing", "--level", "3", "--mission-id", cid)
    assert rc == 0 and out.startswith("# Soul-10-Sicht Ebene 3") and "Herkunftsregeln" not in out


# --- Rückbau, Mandat, Bestandsaufnahme, Ring 2 ----------------------------------------------------
def test_rollback_register_list_quota_undo_dry_run():
    p = _json("rollback", "register", "install", "pip install requests", "--undo", "pip uninstall -y requests")
    assert p["needs_confirmation"] is False
    q = _json("rollback", "register", "command", "rm -rf build")
    assert q["needs_confirmation"] is True
    assert [x["id"] for x in _json("rollback", "list")] == [p["id"], q["id"]]
    quota = _json("rollback", "quota")
    assert quota["registered"] == 2 and quota["with_undo"] == 1 and quota["quote"] == 0.5
    d = _json("rollback", "undo", p["id"], "--dry-run")
    assert d["dry_run"] is True and d["would_run"] == "pip uninstall -y requests"
    rc, out, err = _run("rollback", "undo", q["id"])
    assert rc == cli.EXIT_REFUSED and "keinen Rückweg" in err
    rc, out, err = _run("rollback", "register", "zauber", "x")
    assert rc == cli.EXIT_REFUSED and "unbekannte Art" in err


def test_mandate_erteilen_und_widerrufen():
    rc, out, err = _run("mandate", "unsinn")
    assert rc == cli.EXIT_REFUSED and "unbekannte Kategorie" in err
    m = _json("mandate", "extern-publizieren", "--minuten", "5")
    assert m["category"] == "extern-publizieren"
    assert _json("status")["mandate"] == "extern-publizieren"
    r = _json("mandate", "--revoke")
    assert r["revoked"] is True and r["active"] is None


def test_inventory_write_dann_lesen_und_ring2(schnelles_profil):
    rc, out, err = _run("inventory")
    assert rc == cli.EXIT_REFUSED and "soul inventory --write" in err
    p = _json("inventory", "--write", "--name", "Test", "--identity-name", "Nameless")
    assert p["user"]["name"] == "Test" and p["identity_name"] == "Nameless" and p["own_remotes"] == ["origin"]
    assert _json("inventory")["written_at"] == p["written_at"]
    rc, out, err = _run("ring2")
    assert rc == 0 and out.startswith("# Einrichtung") and "Gibt es Kontingent-Grenzen?" in out
    assert out.rstrip().endswith("Antworten sind optional; die Arbeit läuft weiter.")


# --- consolidate, self, monitor ---------------------------------------------------------------------
def test_consolidate_self_monitor():
    from core.memory import consolidate
    consolidate.inbox_write("cli", {"tool": "Bash", "args_hash": "abc", "outcome": "ok", "summary": "ls"})
    r = _json("consolidate")
    assert r["a"]["episoden"] == 1 and "dubletten" in r["b"] and r["b"]["protokoll_id"]
    assert _json("consolidate", "b")["dubletten"] == 0
    rc, out, err = _run("self")
    assert rc == 0 and out.startswith("# Selbstmodell: namensoffen")
    rc, out, err = _run("monitor", "-n", "3", "--event", "cli")
    assert rc == 0
    zeilen = out.rstrip("\n").splitlines()
    assert len(zeilen) == 3 and all(" cli " in z for z in zeilen)


# --- run: die Schleife in einem Befehl ----------------------------------------------------------
def test_run_mit_fake_modell_verified(fake_model, schnelles_profil):
    fake_model(["42"])
    rc, out, err = _run("run", ZIEL, "--probe", PROBE_42, "--session-id", "s-cli")
    assert rc == 0, err
    r = json.loads(out)
    assert r["verdict"] == "pass" and r["status"] == "verified" and r["stage"] == "direkt"
    assert r["final_text"] == "42" and r["calls"] == 2 and r["memory_id"]
    from core.memory import ledger
    e = ledger.get(r["memory_id"])
    assert e["source"] == "werkzeug" and e["source_ref"] == f"dirigent:{r['contract_id']}"
    fake_model(["41"])
    rc, out, err = _run("run", ZIEL, "--probe", PROBE_42, "--no-model-verifier")
    assert rc == cli.EXIT_NOT_PASSED and json.loads(out)["verdict"] == "fail"
    rc, out, err = _run("run", ZIEL)
    assert rc == cli.EXIT_REFUSED and "Auftrag ohne Abnahmeprobe abgelehnt" in err
    rc, out, err = _run("run", ZIEL, "--probe", PROBE_42, "--items", '{"a":1}', "--condition", "gerade")
    assert rc == cli.EXIT_USAGE and "JSON-Liste" in err


def test_run_zerlegt_ueber_die_kommandozeile(fake_model, schnelles_profil):
    fake_model(["3", "3", "3", "3", "12"])
    rc, out, err = _run("run", "Wie viele Zahlen sind gerade?", "--probe", '{"type":"answer","expected":12}',
                        "--items", json.dumps(list(range(1, 21))), "--condition", "gerade", "--parts", "4")
    assert rc == 0, err
    r = json.loads(out)
    assert r["form"] == "zerlegt" and r["final_text"] == "12" and r["verdict"] == "pass"


# --- Bus-Zeile je Aufruf, ohne Argumenttexte -----------------------------------------------------
def test_jeder_aufruf_schreibt_eine_bus_zeile_ohne_argumenttexte():
    _run("switch", "Zebrastreifen-Strategie: sollen wir migrieren?")
    _run("contract", "new", "Geheimziel")
    zeilen = bus.tail(10, event="cli")
    assert [z["command"] for z in zeilen[-2:]] == ["switch", "contract"]
    assert zeilen[-1]["sub"] == "new" and zeilen[-1]["rc"] == cli.EXIT_REFUSED and zeilen[-1]["argc"] == 3
    assert zeilen[-2]["sub"] is None and zeilen[-2]["rc"] == 0 and "ms" in zeilen[-2]
    text = paths.bus_file().read_text(encoding="utf-8")
    assert "Zebrastreifen" not in text and "Geheimziel" not in text


def test_innerer_fehler_wird_verweigerung_mit_meldung_nicht_traceback(monkeypatch):
    """Prüfbefund Gruppe 5: ein sqlite3-Fehler propagierte als Traceback ohne JSON und ohne Bus-Zeile."""
    import io
    import sqlite3
    from core import bus
    from core.memory import ledger

    def gesperrt():
        raise sqlite3.OperationalError("database is locked")

    monkeypatch.setattr(ledger, "connect", gesperrt)
    out, err = io.StringIO(), io.StringIO()
    rc = cli.main(["status"], stdout=out, stderr=err)
    assert rc == cli.EXIT_ERROR and out.getvalue() == ""
    assert "innerer Fehler OperationalError: database is locked" in err.getvalue()
    assert bus.tail(1, "cli")[0]["rc"] == cli.EXIT_ERROR
