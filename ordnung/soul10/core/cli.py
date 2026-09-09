"""Kommandozeile `soul <befehl>`: jeder Unterbefehl ruft genau eine Modulfunktion und druckt JSON oder Text.

Befund: Auflagen als Text kommen zu 97,8 % an und werden zu 63,9 % erfüllt; der wörtliche
Übergabe-Vertrag kostet −15,3 bis −34,4 pp (01-BEFUNDE B2/B3); die Direktivenzahl ist die
Zerfallsgröße einer Betriebsanweisung (R02). Das Modell braucht Befehle, keine Ermahnungen
(ENTSCHEIDUNG §2, Bindung an Claude Code): jeder Befehl hier ist der Mechanismus, den CLAUDE.md
nur noch benennt.
Erz → Gold: /home/user/soul/core/soul.py (Hand-Parser über sys.argv, ANSI-Farben, zsh-Zeiger mit
pbcopy/open, `backup` per git push, `memory promote` ohne Guard, ein Vorhaben gleichzeitig) →
argparse mit Unterbefehlen, ein Modulaufruf je Befehl, Ausgabe als JSON oder Text, Verweigerungen
der Module als Exit 1 mit ihrer eigenen Meldung, Urteil fail als Exit 3, plattformneutral
(bin/soul POSIX sh, bin/soul.cmd Windows), eine Bus-Zeile je Aufruf ohne Argumenttexte. Kein
Befehl setzt ein Urteil selbst; `verify` ruft den Prüfer, `run` die Schleife.

Läuft als Skript (python3 core/cli.py …) und als Modul (core.cli.main([...]) in Tests).
Nachbarmodule werden lazy im Befehl importiert: ein Befehl lädt nur, was er braucht.
Bezeichner englisch (cmd_*), Kommentare deutsch.
"""
from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

EXIT_OK = 0
EXIT_REFUSED = 1        # ein Modul hat abgelehnt (ContractError, LedgerError, …) — Meldung auf stderr
EXIT_USAGE = 2          # argparse: unbekannter Befehl, fehlendes Argument
EXIT_NOT_PASSED = 3     # verify/run: das Urteil ist nicht "pass" (fail, blockiert, nicht geprüft)
EXIT_NO_COMMAND = 64    # `soul` ohne Befehl: Hilfe

SOURCES_HINT = "nutzer|werkzeug|dokument|eigener_schluss|import|extern"
MONITOR_WIDTH = 160


class CliError(Exception):
    """Fehler der Kommandozeile selbst (kein JSON, fehlendes Profil); trägt den Exit-Code."""

    def __init__(self, message: str, code: int = EXIT_USAGE):
        super().__init__(message)
        self.code = code


# --- Hilfen ------------------------------------------------------------------------------------
def _root() -> Path:
    """ordnung/soul10 — der Ort des Codes, nicht des Zustands (der liegt unter SOUL10_HOME)."""
    return Path(__file__).resolve().parent.parent


def _ensure_import_path() -> None:
    root = str(_root())
    if root not in sys.path:
        sys.path.insert(0, root)


def _json_arg(text: str | None, what: str):
    """Ein JSON-Argument (Probe, Budget, Liste); kein JSON → CliError mit dem Namen des Arguments."""
    if text is None:
        return None
    try:
        return json.loads(text)
    except ValueError as exc:
        raise CliError(f"{what} ist kein JSON: {exc} — Beispiel: "
                       f"'{{\"type\":\"shell\",\"cmd\":\"pytest -q\"}}'") from exc


def _bool_arg(text: str) -> bool:
    lowered = (text or "").strip().lower()
    if lowered in ("true", "ja", "yes", "1", "wahr"):
        return True
    if lowered in ("false", "nein", "no", "0", "falsch"):
        return False
    raise CliError(f"erwarte true oder false, nicht {text!r}")


def emit_json(data, out) -> None:
    out.write(json.dumps(data, indent=2, ensure_ascii=False, default=str) + "\n")


def emit_text(text: str, out) -> None:
    text = text or ""
    out.write(text if text.endswith("\n") else text + "\n")


def contract_summary(c: dict) -> dict:
    """Die Kurzform eines Vertrags für Listen: id, Status, Urteil, Ziel, Ebene, Proben, Zeit."""
    return {"id": c.get("id"), "status": c.get("status"), "verdict": c.get("verdict"),
            "goal": str(c.get("goal", ""))[:120], "level": c.get("level"),
            "probes": len(c.get("probes") or []), "updated_at": c.get("updated_at")}


def format_event(rec: dict, width: int = MONITOR_WIDTH) -> str:
    """Eine Bus-Zeile als Monitorzeile: Zeit, Ereignis, restliche Felder kompakt."""
    rest = {k: v for k, v in rec.items() if k not in ("ts", "event")}
    tail = json.dumps(rest, ensure_ascii=False, default=str, separators=(",", ":")) if rest else ""
    return f"{rec.get('ts', '')} {str(rec.get('event', '')):<24} {tail[:width]}"


# --- Befehle: je einer ruft eine Modulfunktion ---------------------------------------------------
def cmd_contract(args, out) -> int:
    from core import contract
    sub = args.contract_cmd
    if sub == "new":
        probes = [_json_arg(p, f"Probe {i}") for i, p in enumerate(args.probe, 1)]
        c = contract.new(args.goal, probes, non_goals=args.non_goal, inputs=args.input,
                         budget=_json_arg(args.budget, "Budget"), level=args.level,
                         parent=args.parent, assignee=args.assignee or "", mission_id=args.mission_id)
        emit_json(c, out)
    elif sub == "show":
        emit_json(contract.load(args.id), out)
    elif sub == "list":
        emit_json([contract_summary(c) for c in contract.list_open()], out)
    elif sub == "deliver":
        emit_json(contract.deliver(args.id, artefacts=args.artefact, report=args.report or ""), out)
    elif sub == "block":
        emit_json(contract.block(args.id, " ".join(args.reason)), out)
    elif sub == "handover":
        emit_text(contract.render_handover(args.id), out)
    else:
        raise CliError("contract new|show|list|deliver|block|handover")
    return EXIT_OK


def cmd_verify(args, out) -> int:
    from core import verifier
    # --model allein: Prüfer mit Standardmodell; --model NAME: Prüfer mit diesem Modell; fehlt: nur Proben.
    use_model = args.model is not None
    model = args.model if isinstance(args.model, str) else None
    r = verifier.verify(args.id, use_model=use_model, model=model, thinking=args.thinking,
                        proposal_text=args.proposal, cwd=args.cwd, counter_voice_cmd=args.counter_voice)
    emit_json(r, out)
    return EXIT_OK if r["verdict"] == "pass" else EXIT_NOT_PASSED


def cmd_remember(args, out) -> int:
    from core.memory import ledger
    entry_id = ledger.remember(
        args.title, args.body, source=args.source, kind=args.kind, source_ref=args.ref or "",
        trust=args.trust, importance=args.importance, tags=args.tag, ttl_class=args.ttl,
        visibility=args.visibility, mission_id=args.mission_id or "", level=args.level,
        agent=args.agent or "", session_id=args.session_id or "", supersedes=args.supersedes,
        derived_from=args.derived_from, valid_from=args.valid_from, expires_at=args.expires_at,
    )
    entry = ledger.get(entry_id)
    emit_json({"id": entry_id, "status": entry["status"], "rendered": ledger.render(entry)}, out)
    return EXIT_OK


def cmd_recall(args, out) -> int:
    from core.memory import ledger, recall
    hits = recall.search(" ".join(args.query), limit=args.limit, status=tuple(args.status or ("active",)),
                         kinds=args.kind or None, min_trust=args.min_trust, mission_id=args.mission_id,
                         session_id=args.session_id or "")
    if args.json:
        emit_json(hits, out)
        return EXIT_OK
    for h in hits:
        out.write(f"{h['id']} [{h['kind']}] {' '.join(ledger.render(h).split(chr(10)))}\n")
    out.write(f"{len(hits)} Treffer\n")
    return EXIT_OK


def cmd_briefing(args, out) -> int:
    from core.memory import recall
    if args.level >= 2:
        emit_text(recall.level_view(args.level, mission_id=args.mission_id, max_lines=args.max_lines), out)
        return EXIT_OK
    from core import contract, events, rollback
    extra = []
    offene = contract.list_open()
    if offene:
        extra.append(("Offene Vertraege", events.contract_lines(offene)))
    posten = rollback.list_open()
    if posten:
        extra.append(("Offene Rueckbau-Posten", events.rollback_lines(posten)))
    emit_text(recall.briefing(max_lines=args.max_lines, level=1, extra_sections=extra, name=args.name), out)
    return EXIT_OK


def cmd_retract(args, out) -> int:
    from core.memory import retract
    emit_json(retract.retract(args.id, reason=args.reason, by=args.by), out)
    return EXIT_OK


def cmd_predict(args, out) -> int:
    from core.memory import predict
    pid = predict.predict(args.claim, args.confidence, domain=args.domain, model_id=args.model_id or "",
                          due_at=args.due, contract_id=args.contract_id)
    emit_json(predict.get(pid), out)
    return EXIT_OK


def cmd_resolve(args, out) -> int:
    from core.memory import predict
    emit_json(predict.resolve(args.id, _bool_arg(args.outcome)), out)
    return EXIT_OK


def cmd_calibration(args, out) -> int:
    from core.memory import predict
    emit_json(predict.calibration(domain=args.domain, model_id=args.model_id), out)
    return EXIT_OK


def cmd_rollback(args, out) -> int:
    from core import rollback
    sub = args.rollback_cmd
    if sub == "list":
        emit_json(rollback.list_open(), out)
    elif sub == "undo":
        emit_json(rollback.undo(args.id, dry_run=args.dry_run), out)
    elif sub == "quota":
        emit_json(rollback.quota(), out)
    elif sub == "register":
        emit_json(rollback.register(args.kind, args.description, undo=args.undo,
                                    contract_id=args.contract_id), out)
    else:
        raise CliError("rollback list|undo|quota|register")
    return EXIT_OK


def cmd_inventory(args, out) -> int:
    from core import inventory
    if args.write:
        emit_json(inventory.write_profile(name=args.name, language=args.language,
                                          identity_name=args.identity_name), out)
        return EXIT_OK
    profile = inventory.load_profile()
    if profile is None:
        raise CliError("kein Profil vorhanden — `soul inventory --write` schreibt es", EXIT_REFUSED)
    emit_json(profile, out)
    return EXIT_OK


def cmd_ring2(args, out) -> int:
    from core import inventory
    profile = inventory.load_profile()
    if profile is None:
        raise CliError("kein Profil vorhanden — `soul inventory --write` schreibt es", EXIT_REFUSED)
    emit_text(inventory.ring2_message(profile), out)
    return EXIT_OK


def cmd_decompose(args, out) -> int:
    from core import decompose
    emit_json(decompose.seam_check(args.check), out)
    return EXIT_OK


def cmd_switch(args, out) -> int:
    from core import switch
    d = switch.decide(" ".join(args.prompt), probe=args.probe, model=args.model)
    # Die Aufwandsregel gehört in den Systemprompt der Stufe, nicht in eine Ausgabe, die als
    # Dauertext im Kontext landen könnte (−16,7 pp Formattreue): hier nur, OB sie eingeblendet wird.
    d["inject"] = bool(d.get("inject"))
    emit_json(d, out)
    return EXIT_OK


def cmd_consolidate(args, out) -> int:
    from core.memory import consolidate
    if args.takt == "a":
        emit_json(consolidate.takt_a(args.session_id), out)
    elif args.takt == "b":
        emit_json(consolidate.takt_b(), out)
    else:
        emit_json({"a": consolidate.takt_a(args.session_id), "b": consolidate.takt_b()}, out)
    return EXIT_OK


def cmd_self(args, out) -> int:
    from core.memory import selfmodel
    emit_text(selfmodel.render(name=args.name, max_lines=args.max_lines), out)
    return EXIT_OK


def cmd_status(args, out) -> int:
    """Die Lage: Hauptbuch, offene Verträge, Rückbauquote, Kalibrierung, Mandat, letzte Ereignisse."""
    from core import bus, contract, guard, paths, rollback
    from core.memory import ledger, predict, retract
    offene = contract.list_open()
    emit_json({
        "home": str(paths.home()),
        "memory": ledger.stats(),
        "chain_ok": ledger.verify_chain(),
        "state_ok": ledger.verify_state()["ok"],
        "contamination_share": retract.contamination_share(),
        "predictions_due": len(predict.due()),
        "contracts": {"open": len(offene), "list": [contract_summary(c) for c in offene]},
        "rollback": rollback.quota(),
        "calibration": predict.calibration(),
        "mandate": guard.active_mandate(),
        "last_events": [format_event(r) for r in bus.tail(args.events)],
    }, out)
    return EXIT_OK


def _follow(path: Path, out, *, event: str | None) -> int:
    """Neue Bus-Zeilen fortlaufend ausgeben (Verfolgung der JSONL), bis Strg-C."""
    position = path.stat().st_size if path.exists() else 0
    try:
        while True:
            if path.exists() and path.stat().st_size > position:
                with path.open("r", encoding="utf-8") as fh:
                    fh.seek(position)
                    chunk = fh.read()
                    position = fh.tell()
                for line in chunk.splitlines():
                    try:
                        rec = json.loads(line)
                    except ValueError:
                        continue
                    if event and not str(rec.get("event", "")).startswith(event):
                        continue
                    out.write(format_event(rec) + "\n")
                out.flush()
            time.sleep(0.5)
    except KeyboardInterrupt:
        return EXIT_OK


def cmd_monitor(args, out) -> int:
    from core import bus, paths
    for rec in bus.tail(args.n, event=args.event):
        out.write(format_event(rec) + "\n")
    if args.follow:
        return _follow(paths.bus_file(), out, event=args.event)
    return EXIT_OK


def cmd_run(args, out) -> int:
    from core import dirigent
    probes = [_json_arg(p, f"Probe {i}") for i, p in enumerate(args.probe, 1)]
    items = _json_arg(args.items, "items")
    if items is not None and not isinstance(items, list):
        raise CliError("items muss eine JSON-Liste sein")
    r = dirigent.run(args.goal, probes, items=items, condition=args.condition, parts=args.parts,
                     model=args.model, thinking=args.thinking,
                     use_model_verifier=not args.no_model_verifier, cwd=args.cwd,
                     session_id=args.session_id, probe_switch=args.probe_switch,
                     counter_voice_cmd=args.counter_voice)
    emit_json(r, out)
    return EXIT_OK if r["verdict"] == "pass" else EXIT_NOT_PASSED


def cmd_mandate(args, out) -> int:
    from core import guard
    if args.revoke:
        emit_json({"revoked": guard.revoke_mandate(), "active": guard.active_mandate()}, out)
        return EXIT_OK
    if not args.category:
        raise CliError(f"mandate <kategorie> [--minuten N] | --revoke; Kategorien: {', '.join(guard.CATEGORIES)}")
    emit_json(guard.grant_mandate(args.category, args.minuten), out)
    return EXIT_OK


# --- Parser --------------------------------------------------------------------------------------
def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="soul", description="Soul 10 — Code, der ein Modell umgibt. "
                                "Jeder Befehl ruft genau einen Mechanismus in core/.")
    sub = p.add_subparsers(dest="command", metavar="<befehl>")

    # contract
    c = sub.add_parser("contract", help="Vertrag: new|show|list|deliver|block|handover")
    cs = c.add_subparsers(dest="contract_cmd", metavar="<aktion>")
    n = cs.add_parser("new", help="Vertrag anlegen — ohne --probe lehnt der Code ab")
    n.add_argument("goal", help="das Ziel")
    n.add_argument("--probe", action="append", default=[], metavar="JSON",
                   help='Abnahmeprobe, z. B. \'{"type":"shell","cmd":"pytest -q"}\' (mehrfach)')
    n.add_argument("--non-goal", action="append", default=[], metavar="TEXT")
    n.add_argument("--input", action="append", default=[], metavar="TEXT")
    n.add_argument("--budget", metavar="JSON", help='z. B. \'{"turns":10,"minutes":15}\'')
    n.add_argument("--level", type=int, default=1)
    n.add_argument("--parent", metavar="ID")
    n.add_argument("--assignee", metavar="NAME")
    n.add_argument("--mission-id", metavar="ID")
    cs.add_parser("show").add_argument("id")
    cs.add_parser("list", help="offene Verträge (nicht verified/failed)")
    d = cs.add_parser("deliver", help="Lieferung melden — Bericht ist Behauptung, kein Urteil")
    d.add_argument("id")
    d.add_argument("--artefact", action="append", default=[], metavar="PFAD")
    d.add_argument("--report", metavar="TEXT")
    b = cs.add_parser("block", help="Blockade melden statt improvisieren")
    b.add_argument("id")
    b.add_argument("reason", nargs="+", help="der Grund")
    cs.add_parser("handover", help="Übergabetext für eine untere Ebene").add_argument("id")

    # verify
    v = sub.add_parser("verify", help="Prüfer: Proben laufen, Quittung wird geschrieben, Urteil gesetzt")
    v.add_argument("id")
    v.add_argument("--model", nargs="?", const=True, default=None, metavar="NAME",
                   help="Sprosse 2: eigene Modellinstanz (optional mit Modellname); id zuerst nennen")
    v.add_argument("--proposal", metavar="TEXT", help="der Vorschlag, den answer-Proben und Prüfer sehen")
    v.add_argument("--thinking", type=int, default=0)
    v.add_argument("--cwd", metavar="DIR")
    v.add_argument("--counter-voice", metavar="CMD", help="Fremdkommando mit {prompt} als Gegenstimme")

    # remember / recall / briefing / retract
    r = sub.add_parser("remember", help="Eintrag mit Herkunft — ohne --source lehnt das Hauptbuch ab")
    r.add_argument("--source", metavar=SOURCES_HINT)
    r.add_argument("--ref", metavar="ZITAT", help="Zitat (nutzer) oder werkzeug:argumente (werkzeug)")
    r.add_argument("--kind", default="fact", metavar="ART")
    r.add_argument("title")
    r.add_argument("body")
    r.add_argument("--trust", type=float)
    r.add_argument("--importance", type=int, default=3)
    r.add_argument("--tag", action="append", default=[])
    r.add_argument("--ttl", default="durable", metavar="durable|seasonal|short|conditional")
    r.add_argument("--visibility", default="private", metavar="public|private|never")
    r.add_argument("--mission-id")
    r.add_argument("--level", type=int, default=1)
    r.add_argument("--agent")
    r.add_argument("--session-id")
    r.add_argument("--supersedes", metavar="ID")
    r.add_argument("--derived-from", action="append", default=[], metavar="ID")
    r.add_argument("--valid-from", metavar="ISO")
    r.add_argument("--expires-at", metavar="ISO")

    q = sub.add_parser("recall", help="Suche im Hauptbuch, Zeilen mit Herkunftsetikett")
    q.add_argument("query", nargs="+")
    q.add_argument("--limit", type=int, default=8)
    q.add_argument("--status", action="append", default=None, help="Standard: active")
    q.add_argument("--kind", action="append", default=[])
    q.add_argument("--min-trust", type=float, default=0.0)
    q.add_argument("--mission-id")
    q.add_argument("--session-id")
    q.add_argument("--json", action="store_true")

    bf = sub.add_parser("briefing", help="was eine Sitzung zu Beginn liest (≤ 60 Zeilen)")
    bf.add_argument("--max-lines", type=int, default=60)
    bf.add_argument("--level", type=int, default=1, help="≥ 2: die Sicht einer unteren Ebene")
    bf.add_argument("--mission-id")
    bf.add_argument("--name")

    rt = sub.add_parser("retract", help="Eintrag zurückziehen; Ableitungen werden quarantiniert")
    rt.add_argument("id")
    rt.add_argument("--reason", required=True)
    rt.add_argument("--by", default="nutzer")

    # predict / resolve / calibration
    pr = sub.add_parser("predict", help="Vorhersage mit Konfidenz")
    pr.add_argument("claim")
    pr.add_argument("--confidence", type=float, required=True)
    pr.add_argument("--domain", default="allgemein")
    pr.add_argument("--model-id")
    pr.add_argument("--due", metavar="ISO")
    pr.add_argument("--contract-id")
    rs = sub.add_parser("resolve", help="Vorhersage auflösen")
    rs.add_argument("id")
    rs.add_argument("--outcome", required=True, metavar="true|false")
    cb = sub.add_parser("calibration", help="Brier und Eimer")
    cb.add_argument("--domain")
    cb.add_argument("--model-id")

    # rollback
    rb = sub.add_parser("rollback", help="Rückbau-Konto: list|undo|quota|register")
    rbs = rb.add_subparsers(dest="rollback_cmd", metavar="<aktion>")
    rbs.add_parser("list")
    u = rbs.add_parser("undo")
    u.add_argument("id")
    u.add_argument("--dry-run", action="store_true")
    rbs.add_parser("quota")
    rg = rbs.add_parser("register", help="Handlung mit Rückweg eintragen; ohne --undo: Bestätigung nötig")
    rg.add_argument("kind", metavar="install|file|config|git|command|other")
    rg.add_argument("description")
    rg.add_argument("--undo", metavar="CMD")
    rg.add_argument("--contract-id")

    # inventory / ring2
    iv = sub.add_parser("inventory", help="Profil lesen; --write: Bestandsaufnahme schreiben")
    iv.add_argument("--write", action="store_true")
    iv.add_argument("--name")
    iv.add_argument("--language", default="de")
    iv.add_argument("--identity-name")
    sub.add_parser("ring2", help="EINE gebündelte Nachricht: offene Fragen und Empfehlungen")

    # decompose / switch / consolidate / self
    dc = sub.add_parser("decompose", help="Nahtprüfung einer Bedingung")
    dc.add_argument("--check", required=True, metavar="BEDINGUNG")
    sw = sub.add_parser("switch", help="Stufe direkt|aufwand|pruefer für einen Prompt")
    sw.add_argument("prompt", nargs="+")
    sw.add_argument("--probe", action="store_true", help="Entropie-Sonde (zwei Modellaufrufe)")
    sw.add_argument("--model")
    co = sub.add_parser("consolidate", help="Takt a (Inbox → Episoden), b (Bestand ordnen); ohne: beide")
    co.add_argument("takt", nargs="?", choices=("a", "b"))
    co.add_argument("--session-id", default="cli")
    sf = sub.add_parser("self", help="Selbstmodell aus belegten Episoden")
    sf.add_argument("--name")
    sf.add_argument("--max-lines", type=int, default=15)

    # status / monitor / run / mandate
    st = sub.add_parser("status", help="Lage: Hauptbuch, offene Verträge, Rückbauquote, Kalibrierung")
    st.add_argument("--events", type=int, default=5)
    mo = sub.add_parser("monitor", help="der Ereignis-Bus; -f verfolgt ihn")
    mo.add_argument("-n", type=int, default=50)
    mo.add_argument("--event", metavar="PRAEFIX", help="z. B. contract. oder dirigent.")
    mo.add_argument("-f", "--follow", action="store_true")
    ru = sub.add_parser("run", help="ein Lauf des Dirigenten: Vertrag → Schalter → Plan → Ausführung → Prüfung → Erinnern")
    ru.add_argument("goal")
    ru.add_argument("--probe", action="append", default=[], metavar="JSON")
    ru.add_argument("--items", metavar="JSON", help="Liste für Zählaufgaben")
    ru.add_argument("--condition", metavar="TEXT")
    ru.add_argument("--parts", type=int, default=1)
    ru.add_argument("--model")
    ru.add_argument("--thinking", type=int, default=0)
    ru.add_argument("--no-model-verifier", action="store_true", help="Prüfer nur deterministisch")
    ru.add_argument("--cwd")
    ru.add_argument("--session-id", default="cli")
    ru.add_argument("--probe-switch", action="store_true", help="Entropie-Sonde vor der Stufe")
    ru.add_argument("--counter-voice", metavar="CMD")
    ma = sub.add_parser("mandate", help="eine Kategorie der Ausnahmeliste befristet erlauben")
    ma.add_argument("category", nargs="?")
    ma.add_argument("--minuten", type=int, default=15)
    ma.add_argument("--revoke", action="store_true")
    return p


HANDLERS = {
    "contract": cmd_contract, "verify": cmd_verify, "remember": cmd_remember, "recall": cmd_recall,
    "briefing": cmd_briefing, "retract": cmd_retract, "predict": cmd_predict, "resolve": cmd_resolve,
    "calibration": cmd_calibration, "rollback": cmd_rollback, "inventory": cmd_inventory,
    "ring2": cmd_ring2, "decompose": cmd_decompose, "switch": cmd_switch,
    "consolidate": cmd_consolidate, "self": cmd_self, "status": cmd_status, "monitor": cmd_monitor,
    "run": cmd_run, "mandate": cmd_mandate,
}


def command_names() -> tuple[str, ...]:
    """Alle Befehle, die `soul` kennt — tests/test_texte.py prüft CLAUDE.md dagegen."""
    return tuple(HANDLERS)


# --- Einstieg ------------------------------------------------------------------------------------
def main(argv: list[str] | None = None, stdout=None, stderr=None) -> int:
    """Befehl aus argv, Ausgabe auf stdout, Verweigerungen auf stderr; Rückgabe ist der Exit-Code."""
    _ensure_import_path()
    out = stdout if stdout is not None else sys.stdout
    err = stderr if stderr is not None else sys.stderr
    if stdout is None:
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError):
            pass
    argv = list(sys.argv[1:] if argv is None else argv)
    parser = build_parser()
    if not argv:
        parser.print_help(out)
        return EXIT_NO_COMMAND
    try:
        args = parser.parse_args(argv)
    except SystemExit as exc:  # argparse hat Hilfe oder Fehler schon ausgegeben
        return int(exc.code or 0)
    handler = HANDLERS.get(args.command)
    if handler is None:
        parser.print_help(out)
        return EXIT_NO_COMMAND

    from core import bus
    started = time.time()
    sub = getattr(args, f"{args.command}_cmd", None)
    try:
        rc = handler(args, out)
    except CliError as exc:
        err.write(f"soul {args.command}: {exc}\n")
        rc = exc.code
    except ValueError as exc:  # ContractError, LedgerError, ProbeError, DecomposeError, … erben davon
        err.write(f"soul {args.command}: {type(exc).__name__}: {exc}\n")
        rc = EXIT_REFUSED
    # Bus-Zeile je Aufruf — nur Befehl, Unterbefehl, Argumentzahl, Exit, Dauer; nie Argumenttexte
    # (der Prompt eines `soul switch` gehört so wenig ins Log wie ein Zitat aus `soul remember`).
    bus.emit("cli", command=args.command, sub=sub, argc=len(argv), rc=rc,
             ms=int((time.time() - started) * 1000))
    return rc


if __name__ == "__main__":
    raise SystemExit(main())
