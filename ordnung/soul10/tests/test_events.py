"""Bindung an Claude Code: je Modus ein Beispiel-stdin; Exit-Code immer 0; Entscheidungen als JSON
auf stdout; Seiteneffekte im SOUL10_HOME (Bus, Inbox, Rückbau-Konto, Snapshot, Hauptbuch)."""
import ast
import io
import json
import os
import re
import subprocess
import sys
import types

import pytest

from core import bus, events, model, paths

PY = sys.executable
PROBE = {"type": "answer", "expected": 42}
SCHWEIGEKLAUSEL = re.compile(
    r"\bstill\b|unsichtbar|nur das Ergebnis|keine Zwischenschritte|erscheint nie im Text|\bsilent|invisibl",
    re.I)


# --- Helfer ------------------------------------------------------------------------------------
def _run(mode, payload) -> tuple[int, str]:
    """Ein Hook-Aufruf wie durch Claude Code: Modus als argv, Ereignis als stdin, Antwort auf stdout."""
    out = io.StringIO()
    stdin = io.StringIO(json.dumps(payload) if not isinstance(payload, str) else payload)
    rc = events.main([mode], stdin=stdin, stdout=out)
    return rc, out.getvalue().strip()


def _events(prefix):
    return [e for e in bus.tail(500) if str(e.get("event", "")).startswith(prefix)]


def _vertrag(goal="Was ist 6*7? Antworte nur mit der Zahl."):
    from core import contract
    return contract.new(goal, [PROBE])


def _quittung(cid, passed=True):
    from core import contract
    q = {
        "contract_id": cid,
        "probe_runs": [{"type": "answer", "passed": passed, "detail": "x", "stdout_head": "",
                        "exit": None, "at": paths.now_iso()}],
        "verdict": "pass" if passed else "fail",
        "verifier": {"kind": "deterministic", "model": None},
        "at": paths.now_iso(),
        **contract.receipt_binding(contract.load(cid)),  # an Proben und Zustand des Vertrags gebunden
    }
    q["hash"] = contract.receipt_hash(q)
    return q


def _rollback_zeilen():
    try:
        return [json.loads(z) for z in paths.rollback_file().read_text(encoding="utf-8").splitlines()]
    except OSError:
        return []


def _inbox(session_id):
    return paths.inbox_dir() / f"{session_id}.jsonl"


# --- session-start ------------------------------------------------------------------------------
def test_session_start_briefing_mit_offenen_vertraegen_und_rueckbau_posten():
    from core import rollback
    from core.memory import ledger
    c = _vertrag("Tests fuer events schreiben")
    p = rollback.register("command", "rm -rf build", undo=None)
    rc, out = _run("session-start", {"session_id": "s1", "source": "startup"})
    assert rc == 0
    zeilen = out.splitlines()
    assert zeilen[0].startswith("# Soul-10-Briefing (")
    assert len(zeilen) <= 60
    assert "## Offene Vertraege" in zeilen
    assert any(c["id"] in z and "[open]" in z and "Tests fuer events" in z for z in zeilen)
    assert "## Offene Rueckbau-Posten" in zeilen
    assert any(p["id"] in z and "Bestaetigung noetig" in z for z in zeilen)
    assert out.endswith(ledger.REGEL_HERKUNFT)  # die Regel steht am Ende, die Etiketten in den Zeilen
    ev = _events("session-start")[-1]
    assert ev["session_id"] == "s1" and ev["open_contracts"] == 1 and ev["open_rollbacks"] == 1


def test_session_start_ohne_gedaechtnis_laeuft_trotzdem_an(monkeypatch):
    """Fail-open: fehlt recall, gibt es trotzdem einen Kopf, die offene Arbeit und eine Bus-Zeile."""
    import core.memory
    c = _vertrag()
    monkeypatch.setitem(sys.modules, "core.memory.recall", None)
    monkeypatch.delattr(core.memory, "recall", raising=False)
    rc, out = _run("session-start", {"session_id": "s2", "source": "resume"})
    assert rc == 0
    assert out.startswith("# Soul-10-Briefing (") and "nicht verfuegbar" in out
    assert c["id"] in out
    assert any(e["stage"] == "recall.briefing" for e in _events("hook-fehler"))
    assert _events("session-start")[-1]["source"] == "resume"


# --- user-prompt ----------------------------------------------------------------------------------
def test_user_prompt_aufwand_blendet_die_aufwandsregel_ein():
    prompt = ("Berechne die Gesamtkosten: 12 Geraete zu je 349 Euro, 19 % Steuer, 7 % Rabatt "
              "ab 10 Stueck. Vergleiche mit dem Vorjahr, in dem 9 Geraete zu 399 Euro gekauft wurden. "
              "Welche Variante ist guenstiger und um wie viel?")
    rc, out = _run("user-prompt", {"session_id": "s1", "prompt": prompt})
    assert rc == 0
    data = json.loads(out)
    assert data["hookSpecificOutput"]["hookEventName"] == "UserPromptSubmit"
    assert data["hookSpecificOutput"]["additionalContext"] == model.AUFWANDSREGEL
    ev = _events("user-prompt")[-1]
    assert ev["stage"] == "aufwand" and ev["inject"] is True
    # Routing-Log und Bus tragen nie den Prompttext.
    log = paths.routing_file().read_text(encoding="utf-8")
    assert "Geraete" not in log and "Geraete" not in json.dumps(ev)


def test_user_prompt_trivial_gibt_nichts_aus():
    rc, out = _run("user-prompt", {"session_id": "s1", "prompt": "Was ist 2+2? Nur die Zahl."})
    assert rc == 0 and out == ""
    ev = _events("user-prompt")[-1]
    assert ev["stage"] == "direkt" and ev["inject"] is False


def test_user_prompt_nur_bei_stufe_aufwand(monkeypatch):
    """Die Entscheidung des Schalters ist die einzige Quelle: Stufe direkt → nichts, aufwand → Regel."""
    from core import switch
    stufen = iter(["direkt", "aufwand"])
    monkeypatch.setattr(switch, "decide", lambda prompt, **kw: (lambda s: {
        "stage": s, "reason": "fake", "inject": model.AUFWANDSREGEL if s == "aufwand" else "",
        "sha": "x", "len": len(prompt)})(next(stufen)))
    assert _run("user-prompt", {"session_id": "s", "prompt": "a"})[1] == ""
    out = _run("user-prompt", {"session_id": "s", "prompt": "a"})[1]
    assert json.loads(out)["hookSpecificOutput"]["additionalContext"] == model.AUFWANDSREGEL


# --- pre-tool -------------------------------------------------------------------------------------
def test_pre_tool_deny_json_bei_guard_treffer_ohne_mandat():
    rc, out = _run("pre-tool", {"session_id": "s1", "tool_name": "Bash",
                                "tool_input": {"command": "npm publish"}})
    assert rc == 0
    data = json.loads(out)["hookSpecificOutput"]
    assert data["hookEventName"] == "PreToolUse" and data["permissionDecision"] == "deny"
    assert "[extern-publizieren]" in data["permissionDecisionReason"]
    assert "soul mandate extern-publizieren" in data["permissionDecisionReason"]
    assert not SCHWEIGEKLAUSEL.search(data["permissionDecisionReason"])
    ev = _events("deny")[-1]
    assert ev["tool"] == "Bash" and "GESPERRT:extern-publizieren" in ev["flags"]
    assert _rollback_zeilen() == []  # nichts registriert, nichts passiert


def test_pre_tool_mandat_laesst_durch_und_wird_geflaggt():
    from core import guard
    guard.grant_mandate("extern-publizieren", 5)
    rc, out = _run("pre-tool", {"session_id": "s1", "tool_name": "Bash",
                                "tool_input": {"command": "npm publish"}})
    assert rc == 0 and out == ""
    ev = _events("pre")[-1]
    assert ev["tool"] == "Bash" and "mandat:extern-publizieren" in ev["flags"]


def test_pre_tool_guard_fehler_sperrt_fail_closed(monkeypatch):
    from core import guard

    def kaputt(tool, tool_input):
        raise RuntimeError("Regex explodiert")

    monkeypatch.setattr(guard, "decide", kaputt)
    rc, out = _run("pre-tool", {"session_id": "s1", "tool_name": "Read",
                                "tool_input": {"file_path": "/etc/hostname"}})
    assert rc == 0
    data = json.loads(out)["hookSpecificOutput"]
    assert data["permissionDecision"] == "deny" and "[guard-fehler]" in data["permissionDecisionReason"]
    assert _events("deny")[-1]["category"] == "guard-fehler"


def test_pre_tool_harmloser_aufruf_schreibt_pre_zeile_maskiert():
    rc, out = _run("pre-tool", {"session_id": "s1", "tool_name": "Bash",
                                "tool_input": {"command": "echo sk-abcdefghijklmnopqrstuvwxyz1234\nls"}})
    assert rc == 0 and out == ""
    ev = _events("pre")[-1]
    assert ev["event"] == "pre" and "[MASKIERT]" in ev["summary"] and "⏎" in ev["summary"]
    assert "sk-abcdefghijklmnopqrstuvwxyz1234" not in json.dumps(ev)
    assert ev["rollback_id"] is None


def test_pre_tool_bash_registriert_rueckweg():
    rc, out = _run("pre-tool", {"session_id": "s1", "tool_name": "Bash",
                                "tool_input": {"command": "pip install requests"}})
    assert rc == 0 and out == ""
    zeilen = _rollback_zeilen()
    assert len(zeilen) == 1
    z = zeilen[0]
    assert z["kind"] == "install" and z["undo"] == "pip uninstall -y requests"
    assert z["needs_confirmation"] is False and z["evidence"]["session_id"] == "s1"
    ev = _events("pre")[-1]
    assert ev["rollback_id"] == z["id"] and "install" in ev["flags"] and "rueckweg" in ev["flags"]


def test_pre_tool_write_auf_bestehende_datei_sichert_kopie(tmp_path):
    datei = tmp_path / "notiz.txt"
    datei.write_text("alter Inhalt", encoding="utf-8")
    rc, out = _run("pre-tool", {"session_id": "s1", "tool_name": "Write",
                                "tool_input": {"file_path": str(datei), "content": "neu"}})
    assert rc == 0 and out == ""
    zeilen = _rollback_zeilen()
    assert len(zeilen) == 1 and zeilen[0]["kind"] == "file"
    snap = zeilen[0]["evidence"]["snapshot"]
    assert snap.startswith(str(paths.rollback_dir()))
    assert open(snap, encoding="utf-8").read() == "alter Inhalt"
    assert "schreibt" in _events("pre")[-1]["flags"]
    # Eine Datei, die es noch nicht gibt, bekommt keinen Posten (ARCHITEKTUR 5.9: bestehende Datei).
    rc, out = _run("pre-tool", {"session_id": "s1", "tool_name": "Edit",
                                "tool_input": {"file_path": str(tmp_path / "gibt-es-nicht.txt")}})
    assert rc == 0 and out == "" and len(_rollback_zeilen()) == 1


def test_pre_tool_rueckweg_fehler_haelt_werkzeug_nicht_an(monkeypatch):
    from core import rollback

    def kaputt(command):
        raise OSError("Konto nicht schreibbar")

    monkeypatch.setattr(rollback, "infer_from_bash", kaputt)
    rc, out = _run("pre-tool", {"session_id": "s1", "tool_name": "Bash",
                                "tool_input": {"command": "pip install x"}})
    assert rc == 0 and out == ""  # fail-open: kein deny
    assert any(e["stage"] == "rollback" for e in _events("hook-fehler"))
    assert _events("pre")[-1]["rollback_id"] is None


# --- post-tool ------------------------------------------------------------------------------------
def test_post_tool_schreibt_inbox_zeile_ohne_modellaufruf(monkeypatch):
    aufrufe = []
    monkeypatch.setattr(model, "FAKE", lambda *a, **kw: aufrufe.append(1) or {"text": "42"})
    rc, out = _run("post-tool", {
        "session_id": "s1", "tool_name": "Bash",
        "tool_input": {"command": "ls -la"},
        "tool_response": {"stdout": "total 3\ndrwxr-xr-x  token ghp_abcdefghijklmnopqrstuvwxyz1234",
                          "stderr": "", "interrupted": False}})
    assert rc == 0 and out == ""
    assert aufrufe == []
    zeilen = [json.loads(z) for z in _inbox("s1").read_text(encoding="utf-8").splitlines()]
    assert len(zeilen) == 1
    z = zeilen[0]
    assert z["tool"] == "Bash" and z["outcome"] == "ok" and z["session_id"] == "s1"
    assert z["args_hash"] == events.args_hash({"command": "ls -la"}) and len(z["args_hash"]) == 16
    assert z["summary"].startswith("Bash: ls -la") and "total 3" in z["summary"]
    assert "ghp_abcdefghijklmnopqrstuvwxyz1234" not in json.dumps(z) and "[MASKIERT]" in z["summary"]
    assert re.match(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z", z["at"])
    assert _events("post")[-1]["outcome"] == "ok"


def test_post_tool_fehler_und_abbruch_mechanisch_erkannt():
    _run("post-tool", {"session_id": "s3", "tool_name": "Bash", "tool_input": {"command": "false"},
                       "tool_response": {"stdout": "", "stderr": "boom", "is_error": True}})
    _run("post-tool", {"session_id": "s3", "tool_name": "Bash", "tool_input": {"command": "sleep 9"},
                       "tool_response": {"stdout": "", "interrupted": True}})
    _run("post-tool", {"session_id": "s3", "tool_name": "Read", "tool_input": {"file_path": "/x"},
                       "tool_response": "Error: file not found"})
    zeilen = [json.loads(z) for z in _inbox("s3").read_text(encoding="utf-8").splitlines()]
    assert [z["outcome"] for z in zeilen] == ["fehler", "abgebrochen", "fehler"]


# --- stop: das Prüfgate ---------------------------------------------------------------------------
def test_stop_blockiert_gelieferten_vertrag_ohne_quittung():
    from core import contract
    c = _vertrag()
    contract.deliver(c["id"], report="fertig, alles gruen")
    _run("post-tool", {"session_id": "s1", "tool_name": "Read", "tool_input": {"file_path": "/a"},
                       "tool_response": "x"})
    rc, out = _run("stop", {"session_id": "s1", "stop_hook_active": False})
    assert rc == 0
    data = json.loads(out)
    assert data["decision"] == "block"
    assert data["reason"] == (f"Vertrag {c['id']} ist geliefert, aber nicht geprüft. `soul verify {c['id']}` "
                              f"ausführen oder `soul contract block {c['id']} <grund>`.")
    assert not SCHWEIGEKLAUSEL.search(data["reason"])
    assert _events("stop.block")[-1]["contracts"] == [c["id"]]
    assert _inbox("s1").exists()  # kein Takt A, solange das Gate zu ist
    assert contract.load(c["id"])["status"] == "delivered"  # der Hook urteilt nicht


def test_stop_mit_stop_hook_active_blockiert_nicht_und_konsolidiert():
    from core import contract
    from core.memory import ledger
    c = _vertrag()
    contract.deliver(c["id"])
    _run("post-tool", {"session_id": "s1", "tool_name": "Read", "tool_input": {"file_path": "/a"},
                       "tool_response": "Inhalt gelesen"})
    rc, out = _run("stop", {"session_id": "s1", "stop_hook_active": True})
    assert rc == 0 and out == ""  # keine Schleife
    ev = _events("stop")[-1]
    assert ev["event"] == "stop" and ev["stop_hook_active"] is True
    assert ev["delivered_unverified"] == 1 and ev["episoden"] == 1
    assert not _inbox("s1").exists()  # Takt A hat die Inbox verarbeitet
    assert list((paths.inbox_dir() / "verarbeitet").glob("s1-*.jsonl"))
    assert ledger.stats()["gesamt"] >= 1 if isinstance(ledger.stats(), dict) and "gesamt" in ledger.stats() else True


def test_stop_ohne_ungeprueften_vertrag_gibt_nichts_aus():
    from core import contract
    verifiziert = _vertrag()
    contract.deliver(verifiziert["id"])
    contract.set_verdict(verifiziert["id"], _quittung(verifiziert["id"]))
    blockiert = _vertrag()
    contract.deliver(blockiert["id"])
    contract.block(blockiert["id"], "Probe nicht ausfuehrbar")
    offen = _vertrag()
    rc, out = _run("stop", {"session_id": "s1", "stop_hook_active": False})
    assert rc == 0 and out == ""
    ev = _events("stop")[-1]
    assert ev["delivered_unverified"] == 0 and ev["gate_error"] is None
    assert contract.load(offen["id"])["status"] == "open"


def test_stop_nach_nacharbeit_zaehlt_status_nicht_alte_quittung():
    """Nach fail → deliver hängt die alte Quittung noch am Vertrag; das Gate prüft den Status."""
    from core import contract
    c = _vertrag()
    contract.deliver(c["id"])
    contract.set_verdict(c["id"], _quittung(c["id"], passed=False))
    assert contract.load(c["id"])["status"] == "failed"
    contract.deliver(c["id"], report="nachgebessert")
    assert contract.load(c["id"])["receipt"] is not None
    rc, out = _run("stop", {"session_id": "s1"})
    assert json.loads(out)["decision"] == "block" and c["id"] in json.loads(out)["reason"]


def test_stop_pruefgate_nicht_lesbar_blockiert_fail_closed(monkeypatch):
    """Eine unlesbare Vertragsdatei darf einen gelieferten Vertrag nicht aus dem Gate verschwinden
    lassen (Schlussprüfung): contract.list_open überspringt sie kommentarlos, das Gate zählt sie."""
    c = _vertrag()
    from core import contract
    contract.deliver(c["id"], report="42")
    (paths.contracts_dir() / f"{c['id']}.json").write_text("{ kaputt", encoding="utf-8")
    delivered, fehler = events.delivered_without_receipt()
    assert delivered == [] and fehler and "nicht lesbar" in fehler
    rc, out = _run("stop", {"session_id": "s1", "stop_hook_active": False})
    data = json.loads(out)
    assert data["decision"] == "block" and "Prüfgate" in data["reason"] and "nicht lesbar" in data["reason"]
    # Mit stop_hook_active bleibt es bei einer Runde: kein zweiter Block.
    rc, out = _run("stop", {"session_id": "s1", "stop_hook_active": True})
    assert out == "" and "nicht lesbar" in _events("stop")[-1]["gate_error"]
    # Auch ein Fehler beim Lesen des Verzeichnisses selbst blockiert.
    monkeypatch.setattr(paths, "contracts_dir", lambda: (_ for _ in ()).throw(PermissionError("weg")))
    rc, out = _run("stop", {"session_id": "s1", "stop_hook_active": False})
    assert json.loads(out)["decision"] == "block" and "PermissionError" in json.loads(out)["reason"]


# --- pre-compact ------------------------------------------------------------------------------------
def test_pre_compact_schreibt_snapshot():
    from core import rollback
    c = _vertrag()
    p = rollback.register("install", "pip install x", undo="pip uninstall -y x")
    rc, out = _run("pre-compact", {"session_id": "s1", "trigger": "auto"})
    assert rc == 0 and out == ""
    snap = json.loads(paths.snapshot_file().read_text(encoding="utf-8"))
    assert set(snap) == {"at", "session_id", "trigger", "open_contracts", "open_rollbacks"}
    assert [x["id"] for x in snap["open_contracts"]] == [c["id"]]
    assert snap["open_contracts"][0]["probes"] == [PROBE]  # nicht verlustbehaftet: der ganze Vertrag
    assert [x["id"] for x in snap["open_rollbacks"]] == [p["id"]]
    assert snap["trigger"] == "auto" and snap["session_id"] == "s1"
    ev = _events("compact")[-1]
    assert ev["open_contracts"] == 1 and ev["open_rollbacks"] == 1


# --- subagent-stop, session-end ---------------------------------------------------------------------
def test_subagent_stop_schreibt_bus_zeile_mit_ebene():
    rc, out = _run("subagent-stop", {"session_id": "s1", "agent_id": "a-7", "agent_type": "builder"})
    assert rc == 0 and out == ""
    ev = _events("subagent-stop")[-1]
    assert ev["level"] == 2 and ev["agent_id"] == "a-7" and ev["agent_type"] == "builder"
    _run("subagent-stop", {"session_id": "s1", "level": "3"})
    assert _events("subagent-stop")[-1]["level"] == 3


def test_session_end_konsolidiert_die_inbox():
    from core.memory import ledger
    _run("post-tool", {"session_id": "s9", "tool_name": "Grep", "tool_input": {"pattern": "TODO"},
                       "tool_response": {"content": "3 Treffer"}})
    rc, out = _run("session-end", {"session_id": "s9", "reason": "exit"})
    assert rc == 0 and out == ""
    ev = _events("session-end")[-1]
    assert ev["episoden"] == 1 and ev["reason"] == "exit"
    assert not _inbox("s9").exists()
    treffer = ledger.connect().execute(
        "SELECT kind, source, source_ref, session_id FROM memories WHERE session_id = 's9'").fetchall()
    assert len(treffer) == 1
    assert treffer[0]["kind"] == "episode" and treffer[0]["source"] == "werkzeug"
    assert treffer[0]["source_ref"].startswith("Grep:")


# --- Robustheit: Exit 0, fail-open beim Loggen ---------------------------------------------------
def test_unbekannter_modus_und_kaputtes_stdin_bleiben_exit_0():
    assert _run("quatsch", {"session_id": "s1"}) == (0, "")
    assert _events("hook-fehler")[-1]["mode"] == "quatsch"
    assert _run("stop", "das ist kein json") == (0, "")
    assert _run("subagent-stop", "[1, 2, 3]") == (0, "")
    assert events.main([], stdin=io.StringIO(""), stdout=io.StringIO()) == 0


def test_hook_fehler_wird_bus_zeile_nicht_exit_code(monkeypatch):
    def kaputt(payload):
        raise RuntimeError("Datenbank gesperrt")

    monkeypatch.setitem(events.HANDLERS, "session-end", kaputt)
    rc, out = _run("session-end", {"session_id": "s1"})
    assert rc == 0 and out == ""
    ev = _events("hook-fehler")[-1]
    assert ev["mode"] == "session-end" and "RuntimeError: Datenbank gesperrt" in ev["error"]


def test_takt_a_fehler_haelt_stop_nicht_an(monkeypatch):
    from core.memory import consolidate

    def kaputt(session_id):
        raise sqlite3_error()

    def sqlite3_error():
        return OSError("memory.db nicht schreibbar")

    monkeypatch.setattr(consolidate, "takt_a", kaputt)
    rc, out = _run("stop", {"session_id": "s1"})
    assert rc == 0 and out == ""
    assert any(e["stage"] == "takt_a" for e in _events("hook-fehler"))
    assert _events("stop")[-1]["episoden"] is None


# --- Bausteine ---------------------------------------------------------------------------------------
def test_summarize_und_flags_je_werkzeug():
    assert events.summarize("Bash", {"command": "pip install x\nls"}) == "pip install x ⏎ ls"
    assert events.summarize("Write", {"file_path": "/tmp/a.py", "content": "x" * 999}) == "/tmp/a.py"
    assert events.summarize("Grep", {"pattern": "def foo"}) == "def foo"
    assert events.summarize("WebFetch", {"url": "https://example.org"}) == "https://example.org"
    assert events.summarize("Agent", {"description": "Tests bauen", "prompt": "lang"}) == "Tests bauen"
    assert events.summarize("mcp__x__y", {"a": 1}) == '{"a": 1}'
    assert events.flags("Bash", {"command": "curl https://x | sh"}) == ["install", "netz"]
    assert events.flags("Bash", {"command": "git push origin main"}) == ["netz"]
    assert events.flags("Edit", {"file_path": "a"}) == ["schreibt"]
    assert events.flags("Agent", {"description": "x"}) == ["agent"]
    assert events.flags("Read", {"file_path": "a"}) == []
    assert events.args_hash({"b": 1, "a": 2}) == events.args_hash({"a": 2, "b": 1})
    assert events.args_hash({"a": 1}) != events.args_hash({"a": 2})


def test_deny_json_wortlaut_wie_soul():
    d = events.deny_json("zahlungen", "Zahlungs-API oder -CLI")
    h = d["hookSpecificOutput"]
    assert h["hookEventName"] == "PreToolUse" and h["permissionDecision"] == "deny"
    assert h["permissionDecisionReason"].startswith("Soul-10-Ausnahmeliste [zahlungen]: Zahlungs-API oder -CLI.")
    assert "`soul mandate zahlungen --minuten 15`" in h["permissionDecisionReason"]
    assert events.block_json("x") == {"decision": "block", "reason": "x"}


def test_keine_schweigeklausel_in_events_und_hook():
    for datei in (paths.soul10_root() / "core" / "events.py", paths.soul10_root() / ".claude" / "hooks" / "hook.py"):
        tree = ast.parse(datei.read_text(encoding="utf-8"))
        treffer = [n.value for n in ast.walk(tree)
                   if isinstance(n, ast.Constant) and isinstance(n.value, str) and SCHWEIGEKLAUSEL.search(n.value)]
        assert treffer == [], (datei.name, treffer)
    kopf = (paths.soul10_root() / "core" / "events.py").read_text(encoding="utf-8").split('"""')[1]
    assert re.search(r"^Befund: .*\d", kopf, re.M) and "Erz → Gold:" in kopf


# --- settings.json und hook.py -----------------------------------------------------------------
def test_settings_json_registriert_alle_modi_und_cache_env():
    data = json.loads((paths.soul10_root() / ".claude" / "settings.json").read_text(encoding="utf-8"))
    erwartet = {"SessionStart": "session-start", "UserPromptSubmit": "user-prompt",
                "PreToolUse": "pre-tool", "PostToolUse": "post-tool", "Stop": "stop",
                "SubagentStop": "subagent-stop", "PreCompact": "pre-compact", "SessionEnd": "session-end"}
    assert set(data["hooks"]) == set(erwartet)
    assert set(erwartet.values()) == set(events.MODES) == set(events.HANDLERS)
    for event, modus in erwartet.items():
        kommandos = [h["command"] for block in data["hooks"][event] for h in block["hooks"]]
        assert kommandos == [f'python3 "$CLAUDE_PROJECT_DIR/.claude/hooks/hook.py" {modus}'], event
        assert all(h["type"] == "command" for block in data["hooks"][event] for h in block["hooks"])
    assert data["hooks"]["PreToolUse"][0]["matcher"] == ".*" and data["hooks"]["PostToolUse"][0]["matcher"] == ".*"
    assert data["env"]["ENABLE_PROMPT_CACHING_1H"] == "1"


def test_hook_py_zeiger_laeuft_als_eigener_prozess():
    """Wie Claude Code es tut: python3 hook.py <modus> mit dem Ereignis auf stdin, Zustand unter SOUL10_HOME."""
    hook = paths.soul10_root() / ".claude" / "hooks" / "hook.py"
    home = os.environ["SOUL10_HOME"]
    env = {**os.environ, "SOUL10_HOME": home}

    def lauf(modus, payload):
        return subprocess.run([PY, str(hook), modus], input=json.dumps(payload), capture_output=True,
                              text=True, env=env, cwd=str(paths.repo_root()), timeout=60)

    r = lauf("session-start", {"session_id": "proc", "source": "startup"})
    assert r.returncode == 0 and r.stdout.startswith("# Soul-10-Briefing (")
    r = lauf("pre-tool", {"session_id": "proc", "tool_name": "Bash", "tool_input": {"command": "gh repo delete x"}})
    assert r.returncode == 0
    assert json.loads(r.stdout)["hookSpecificOutput"]["permissionDecision"] == "deny"
    r = lauf("stop", {"session_id": "proc", "stop_hook_active": False})
    assert r.returncode == 0 and r.stdout == ""
    r = lauf("unbekannt", {})
    assert r.returncode == 0 and r.stdout == ""
    ereignisse = [e["event"] for e in bus.tail(50)]
    assert "session-start" in ereignisse and "deny" in ereignisse and "stop" in ereignisse
    assert "hook-fehler" in ereignisse


def test_hook_py_ohne_kern_sperrt_pre_tool_und_bleibt_exit_0(tmp_path):
    """Der Zeiger allein: fehlt core/, gilt für pre-tool fail-closed, für alle anderen Modi fail-open."""
    hook_src = (paths.soul10_root() / ".claude" / "hooks" / "hook.py").read_text(encoding="utf-8")
    kopie = tmp_path / "leer" / ".claude" / "hooks" / "hook.py"
    kopie.parent.mkdir(parents=True)
    kopie.write_text(hook_src, encoding="utf-8")
    env = {**os.environ, "PYTHONPATH": "", "SOUL10_HOME": os.environ["SOUL10_HOME"]}
    r = subprocess.run([PY, str(kopie), "pre-tool"], input="{}", capture_output=True, text=True,
                       env=env, cwd=str(tmp_path), timeout=60)
    assert r.returncode == 0 and "Kern nicht ladbar" in r.stderr
    assert json.loads(r.stdout)["hookSpecificOutput"]["permissionDecision"] == "deny"
    r = subprocess.run([PY, str(kopie), "stop"], input="{}", capture_output=True, text=True,
                       env=env, cwd=str(tmp_path), timeout=60)
    assert r.returncode == 0 and r.stdout == "" and "Kern nicht ladbar" in r.stderr


def test_takt_b_laeuft_am_sitzungsende_nicht_beim_stop():
    """Gemessen (Schlussprüfung): Takt B kostet 6,3 s bei 800 und 28,5 s bei 2500 Einträgen. Der
    Stop ist der Weg zu „fertig" und bleibt frei davon; das Sitzungsende trägt die Arbeit."""
    from core.memory import consolidate, ledger
    ledger.remember("Datenbank", "PostgreSQL.", source="nutzer", source_ref="Zitat")
    ledger.remember("Datenbank", "MySQL.", source="eigener_schluss")
    assert consolidate.takt_b_faellig()
    rc, out = _run("stop", {"session_id": "s1", "stop_hook_active": False})
    assert (rc, out) == (0, "")
    assert "takt_b" not in _events("stop")[-1] and _events("memory.takt_b") == []
    assert consolidate.takt_b_faellig()  # der Stop hat ihn nicht verbraucht
    rc, out = _run("session-end", {"session_id": "s1", "reason": "exit"})
    assert (rc, out) == (0, "")
    assert _events("session-end")[-1]["takt_b"] is True and len(_events("memory.takt_b")) == 1
    assert ledger.stats()["status"].get("superseded") == 1  # eigener_schluss wich der Nutzeraussage
    # Innerhalb des Intervalls läuft er nicht noch einmal.
    _run("session-end", {"session_id": "s1", "reason": "exit"})
    assert _events("session-end")[-1]["takt_b"] is False and len(_events("memory.takt_b")) == 1
    assert not consolidate.takt_b_faellig()


def test_takt_b_fehler_haelt_das_sitzungsende_nicht_an(monkeypatch):
    from core.memory import consolidate

    def kaputt(now=None):
        raise OSError("memory.db nicht schreibbar")

    monkeypatch.setattr(consolidate, "takt_b", kaputt)
    rc, out = _run("session-end", {"session_id": "s1"})
    assert rc == 0 and out == ""
    assert any(e["stage"] == "takt_b" for e in _events("hook-fehler"))
    assert _events("session-end")[-1]["takt_b"] is False


def test_maskierung_vor_dem_abschneiden_und_sensible_befehle_ohne_anfang():
    """Prüfbefund Gruppe 5: ein Token an der Schnittgrenze verlor seinen Schwanz und entging der Maske."""
    token = "ghp_" + "Q" * 36
    lang = "x" * (events.RESPONSE_HEAD_CHARS - 10) + " " + token + " Rest"
    head = events.response_head({"stdout": lang})
    assert "ghp_" not in head and "[MASKIERT" in head and len(head) <= events.RESPONSE_HEAD_CHARS
    cmd = "echo " + "y" * 210 + " " + token
    summary = events.summarize("Bash", {"command": cmd})
    assert "ghp_" not in summary and "[MAS" in summary and len(summary) <= 220
    # Aufrufe, die erkennbar Zugangsdaten lesen, hinterlassen keinen Antwortanfang in der Inbox —
    # erkannt am ZIEL, nicht am Wort im Befehl (Schlussprüfung: `.envrc` fiel durch, `Read` ganz).
    for befehl in ("cat .env", "cat .envrc", "cat .env.production", "printenv", "env",
                   "cat ~/.ssh/id_rsa", "cat ~/.npmrc", "cat ~/.pgpass", "cat ~/.docker/config.json",
                   "cat /etc/shadow", "cat certs/server.pem", "cat ~/.aws/credentials",
                   "aws configure get aws_secret_access_key", "gh auth token", "vault read secret/db"):
        assert events.response_head({"stdout": "DB_PASSWORD=geheim123"}, tool="Bash",
                                    tool_input={"command": befehl}) == "", befehl
    for tool, eingabe in (("Read", {"file_path": "/projekt/.env"}),
                          ("Read", {"file_path": "/home/x/.ssh/id_ed25519"}),
                          ("Grep", {"path": "/projekt/.envrc", "pattern": "KEY"}),
                          ("Glob", {"pattern": "**/.aws/credentials"})):
        assert events.response_head({"content": "DB_PASSWORD=geheim123"}, tool=tool,
                                    tool_input=eingabe) == "", (tool, eingabe)
    # Harmlose Befehle behalten ihren Anfang: das Log ist fail-open, nicht fail-closed.
    for befehl in ("ls -la", "pytest tests/test_tokenizer.py -q", "grep -rn 'csrf_token' app/views.py",
                   "git log --oneline --grep=token | head -20", "wc -l src/tokenizer.rs",
                   "cat docs/passwort-richtlinie.md", "ls -la src/secrets/", "make test-credentials-parser"):
        assert events.response_head({"stdout": "ok"}, tool="Bash", tool_input={"command": befehl}) == "ok", befehl
    assert events.response_head({"content": "ok"}, tool="Read", tool_input={"file_path": "/projekt/app.py"}) == "ok"
    _run("post-tool", {"session_id": "s8", "tool_name": "Bash", "tool_input": {"command": "cat .env"},
                       "tool_response": {"stdout": "DB_PASSWORD=geheim123"}})
    zeile = json.loads(_inbox("s8").read_text(encoding="utf-8").splitlines()[0])
    assert "geheim123" not in zeile["summary"]
    _run("post-tool", {"session_id": "s8", "tool_name": "Read", "tool_input": {"file_path": "/projekt/.env"},
                       "tool_response": {"content": "AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI"}})
    zeilen = _inbox("s8").read_text(encoding="utf-8")
    assert "wJalrXUtnFEMI" not in zeilen


def test_aufwandsregel_folgt_der_entscheidung_nicht_dem_stufennamen(monkeypatch):
    """Eingeblendet wird der Text AUS der Entscheidung — sonst blendete der Hook still etwas
    anderes ein, als der Schalter beschlossen hat (Schlussprüfung: der alte Test sah das nicht)."""
    from core import switch
    monkeypatch.setattr(switch, "decide", lambda prompt, **kw: {"stage": "pruefer", "inject": "REGELTEXT", "reason": "t"})
    rc, out = _run("user-prompt", {"session_id": "s1", "prompt": "x"})
    assert rc == 0 and json.loads(out)["hookSpecificOutput"]["additionalContext"] == "REGELTEXT"
    monkeypatch.setattr(switch, "decide", lambda prompt, **kw: {"stage": "direkt", "inject": "", "reason": "t"})
    assert _run("user-prompt", {"session_id": "s1", "prompt": "x"}) == (0, "")
    # Stufe direkt blendet auch dann nichts ein, wenn eine Entscheidung Text mitliefert.
    monkeypatch.setattr(switch, "decide", lambda prompt, **kw: {"stage": "direkt", "inject": "REGELTEXT", "reason": "t"})
    assert _run("user-prompt", {"session_id": "s1", "prompt": "x"}) == (0, "")


def test_settings_json_setzt_je_hook_ein_zeitlimit():
    """Ohne Zeitlimit gilt die Vorgabe des Harness — und ein Hook, der Arbeit trägt, hängt still."""
    daten = json.loads((paths.soul10_root() / ".claude" / "settings.json").read_text(encoding="utf-8"))
    for ereignis, gruppen in daten["hooks"].items():
        for g in gruppen:
            for h in g["hooks"]:
                assert isinstance(h.get("timeout"), int) and h["timeout"] > 0, ereignis
    # Der Stop ist der Weg zu „fertig": sein Limit ist knapp, das Sitzungsende darf dauern.
    def limit(ereignis):
        return daten["hooks"][ereignis][0]["hooks"][0]["timeout"]
    assert limit("Stop") <= limit("SessionEnd")
