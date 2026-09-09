"""Hook-Handler: die Bindung an Claude Code — acht Modi, Exit-Code immer 0, Entscheidungen als JSON.

Befund: Gedächtnis +68,3 pp (28,3 % → 96,7 %), aber nur, wenn es gelesen und gefüttert wird —
93 Einträge in 47 Tagen, 5 vom Nutzer (01-BEFUNDE A1, D031); Herkunftsetikett in der Zeile 95,0 %
gegen Regel im Prompt 1,7 % (01-BEFUNDE A4) — darum trägt das Briefing beim Start Etiketten;
Aufwandsregel als Dauerschicht −16,7 pp Formattreue (01-BEFUNDE §4) — darum wird sie nur bei
Stufe „aufwand" eingeblendet; „der Prüfer fällt zuerst weg" (R14 §2.4, Ausfallverhalten) — darum
blockiert der Stop-Hook einen gelieferten Vertrag ohne Quittung; null Hook-Zeilen nach einer
Sitzung sind ein Defekt (ENTSCHEIDUNG §5 Nr. 3, G2) — darum schreibt jeder Modus eine Bus-Zeile.
Erz → Gold: /home/user/soul/core/events.py kannte fünf Modi, schrieb ein eigenes Log unter watch/
im Repo, holte das Briefing nach Rezenz (der gemessene Totalausfall A3) und kannte weder Schalter,
Rückweg, Inbox noch Prüfgate. Hier: acht Modi auf dem gemeinsamen Bus (core.bus), Briefing aus
recall mit Herkunft in der Zeile plus offene Verträge und offene Rückbau-Posten, Schalter je
Prompt, Guard-Entscheidung fail-closed und Rückweg-Registrierung vor jedem Werkzeugaufruf,
Inbox-Zeile ohne Modellurteil danach, Prüfgate beim Stop, Snapshot vor der Kompaktierung.
Fail-open beim Loggen: jeder Fehler wird zur Bus-Zeile „hook-fehler", nie zu einem Exit-Code ≠ 0.

Bezeichner englisch (main, handle, eine Funktion je Modus nach ARCHITEKTUR 5.9), Kommentare
deutsch. Nachbarmodule werden lazy im Funktionskörper importiert: der Hook läuft als eigener
Prozess je Ereignis, und ein fehlendes Modul darf nur den Mechanismus kosten, der es braucht —
mit einer Ausnahme: ein nicht prüfbarer Guard sperrt (Regel 5).
"""
from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

from . import bus, paths

MODES = ("session-start", "user-prompt", "pre-tool", "post-tool", "stop", "pre-compact",
         "subagent-stop", "session-end")
WRITE_TOOLS = ("Write", "Edit", "MultiEdit", "NotebookEdit")
AGENT_TOOLS = ("Agent", "Task")
MANDATE_MINUTES = 15
# Mehr offene Posten je Abschnitt verdrängen Gedächtniszeilen aus dem Briefing (≤ 60 Zeilen).
BRIEFING_SECTION_MAX = 8
RESPONSE_HEAD_CHARS = 200

# Flaggen für den Monitor (aus SOUL übernommen): Installation, Netz, Schreibzugriff, Unteragent.
_INSTALL = re.compile(
    r"\b(npm|pnpm|yarn|pip3?|pipx|brew|gem|cargo|uv)\s+(install|add|upgrade)\b"
    r"|\bcurl\b.*\|\s*(ba)?sh\b"
)
_NET = re.compile(r"\b(curl|wget|git\s+(clone|fetch|pull|push)|ssh|scp|rsync)\b")


# --- Bausteine: Kurzform, Flaggen, Hash, Ausgang --------------------------------------------------
def summarize(tool: str, tool_input: dict) -> str:
    """Kurzform eines Werkzeugaufrufs für Bus und Inbox: maskiert, höchstens 220 Zeichen."""
    tool_input = tool_input or {}
    if tool == "Bash":
        text = str(tool_input.get("command", "")).strip().replace("\n", " ⏎ ")[:220]
    elif tool in WRITE_TOOLS:
        text = str(tool_input.get("file_path") or tool_input.get("notebook_path") or "")[:220]
    elif tool in ("Read", "Glob", "Grep"):
        text = str(tool_input.get("file_path") or tool_input.get("pattern")
                   or tool_input.get("query") or "")[:160]
    elif tool in ("WebFetch", "WebSearch"):
        text = str(tool_input.get("url") or tool_input.get("query") or "")[:200]
    elif tool in AGENT_TOOLS:
        text = str(tool_input.get("description", ""))[:160]
    else:
        text = json.dumps(tool_input, ensure_ascii=False, default=str)[:160]
    return bus.mask(text)


def flags(tool: str, tool_input: dict) -> list[str]:
    """Flaggen für den Monitor: install, netz, schreibt, agent."""
    tool_input = tool_input or {}
    text = (str(tool_input.get("command", "")) if tool == "Bash"
            else json.dumps(tool_input, ensure_ascii=False, default=str))
    out: list[str] = []
    if _INSTALL.search(text):
        out.append("install")
    if _NET.search(text):
        out.append("netz")
    if tool in WRITE_TOOLS:
        out.append("schreibt")
    if tool in AGENT_TOOLS:
        out.append("agent")
    return out


def args_hash(tool_input: dict) -> str:
    """Kurzer, stabiler Hash der Argumente (kanonisches JSON) — die Werkzeugreferenz der Episode."""
    canon = json.dumps(tool_input or {}, sort_keys=True, ensure_ascii=False,
                       separators=(",", ":"), default=str)
    return paths.sha256_text(canon)[:16]


def outcome(tool_response) -> str:
    """'ok', 'fehler' oder 'abgebrochen' — mechanisch aus der Werkzeugantwort, kein Modellurteil."""
    if isinstance(tool_response, dict):
        if tool_response.get("interrupted"):
            return "abgebrochen"
        if tool_response.get("is_error") or tool_response.get("error"):
            return "fehler"
        return "ok"
    if isinstance(tool_response, str) and tool_response.lstrip().lower().startswith("error"):
        return "fehler"
    return "ok"


def response_head(tool_response, limit: int = RESPONSE_HEAD_CHARS) -> str:
    """Der Anfang der Werkzeugantwort, auf eine Zeile gezogen und maskiert."""
    if isinstance(tool_response, dict):
        text = (tool_response.get("stdout") or tool_response.get("content")
                or tool_response.get("result") or tool_response.get("error") or "")
        if not isinstance(text, str):
            text = json.dumps(text, ensure_ascii=False, default=str)
    else:
        text = str(tool_response or "")
    return bus.mask(" ".join(text.split())[:limit])


def _session_id(payload: dict) -> str:
    return str(payload.get("session_id") or "unbekannt")


def _tool_input(payload: dict) -> dict:
    raw = payload.get("tool_input")
    return raw if isinstance(raw, dict) else ({"value": raw} if raw is not None else {})


# --- JSON-Antworten an Claude Code -------------------------------------------------------------
def deny_json(category: str, reason: str) -> dict:
    """Die Sperre wie in SOUL: PreToolUse permissionDecision deny mit Grund und Ausweg (Mandat)."""
    return {"hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "deny",
        "permissionDecisionReason": (
            f"Soul-10-Ausnahmeliste [{category}]: {reason}. Bewusst gewollt? Mandat fuer diese "
            f"Kategorie einholen (`soul mandate {category} --minuten {MANDATE_MINUTES}`) und erneut."),
    }}


def context_json(text: str) -> dict:
    return {"hookSpecificOutput": {"hookEventName": "UserPromptSubmit", "additionalContext": text}}


def block_json(reason: str) -> dict:
    return {"decision": "block", "reason": reason}


# --- offene Arbeit: Verträge und Rückbau-Posten --------------------------------------------------
def open_contracts(mode: str) -> list[dict]:
    """Alle nicht-finalen Verträge; fail-open (Fehler → leere Liste + Bus-Zeile)."""
    try:
        from . import contract
        return list(contract.list_open())
    except Exception as exc:  # noqa: BLE001 — Lesen ist fail-open
        bus.emit("hook-fehler", mode=mode, stage="contract.list_open", error=str(exc)[:200])
        return []


def open_rollbacks(mode: str) -> list[dict]:
    """Alle offenen Rückbau-Posten; fail-open."""
    try:
        from . import rollback
        return list(rollback.list_open())
    except Exception as exc:  # noqa: BLE001
        bus.emit("hook-fehler", mode=mode, stage="rollback.list_open", error=str(exc)[:200])
        return []


def contract_lines(contracts: list[dict]) -> list[str]:
    lines = [f"{c.get('id')} [{c.get('status')}] {str(c.get('goal', ''))[:80]}" for c in contracts]
    return _cap(lines)


def rollback_lines(posten: list[dict]) -> list[str]:
    lines = []
    for p in posten:
        line = f"{p.get('id')} [{p.get('kind')}] {str(p.get('description', ''))[:80]}"
        if p.get("needs_confirmation"):
            line += " (ohne Rueckweg: Bestaetigung noetig)"
        lines.append(line)
    return _cap(lines)


def _cap(lines: list[str]) -> list[str]:
    if len(lines) <= BRIEFING_SECTION_MAX:
        return lines
    rest = len(lines) - BRIEFING_SECTION_MAX
    return lines[:BRIEFING_SECTION_MAX] + [f"... und {rest} weitere (`soul status`)"]


# --- Modus 1: session-start ------------------------------------------------------------------------
def session_start(payload: dict) -> str:
    """Briefing mit Herkunftsetiketten, offenen Verträgen und offenen Rückbau-Posten auf stdout."""
    session_id = _session_id(payload)
    contracts = open_contracts("session-start")
    posten = open_rollbacks("session-start")
    sections: list[tuple[str, list[str]]] = []
    if contracts:
        sections.append(("Offene Vertraege", contract_lines(contracts)))
    if posten:
        sections.append(("Offene Rueckbau-Posten", rollback_lines(posten)))
    try:
        from .memory import recall
        text = recall.briefing(extra_sections=sections)
    except Exception as exc:  # noqa: BLE001 — ohne Gedächtnis läuft die Sitzung trotzdem an
        bus.emit("hook-fehler", mode="session-start", stage="recall.briefing", error=str(exc)[:200])
        lines = [f"# Soul-10-Briefing ({paths.today()})",
                 f"(Gedaechtnis nicht verfuegbar: {str(exc)[:120]})"]
        for title, section in sections:
            lines += ["", f"## {title}"] + section
        text = "\n".join(lines)
    bus.emit("session-start", mode="session-start", session_id=session_id,
             source=payload.get("source"), lines=text.count("\n") + 1,
             open_contracts=len(contracts), open_rollbacks=len(posten))
    return text


# --- Modus 2: user-prompt ---------------------------------------------------------------------------
def user_prompt(payload: dict) -> str:
    """Schalter je Prompt; die Aufwandsregel wird NUR bei Stufe „aufwand" eingeblendet."""
    session_id = _session_id(payload)
    prompt = str(payload.get("prompt") or "")
    from . import switch
    from . import model as _model
    decision = switch.decide(prompt)
    inject = decision.get("stage") == "aufwand"
    bus.emit("user-prompt", mode="user-prompt", session_id=session_id, stage=decision.get("stage"),
             reason=decision.get("reason"), sha=decision.get("sha"), len=decision.get("len"),
             inject=inject)
    if inject:
        return json.dumps(context_json(_model.AUFWANDSREGEL), ensure_ascii=True)
    return ""


# --- Modus 3: pre-tool ------------------------------------------------------------------------------
def guard_decision(tool: str, tool_input: dict) -> dict:
    """Die Entscheidung der Ausnahmeliste; fail-closed: nicht prüfbar heißt gesperrt."""
    try:
        from . import guard
        decide = getattr(guard, "decide", None)
        if decide is not None:
            verdict = decide(tool, tool_input)
            if not isinstance(verdict, dict) or "blocked" not in verdict:
                raise ValueError("Guard ohne Entscheidung")
            return verdict
        hit = guard.classify(tool, tool_input)
        if hit is None:
            return {"blocked": False, "category": None, "reason": "", "mandate": None}
        category, reason = hit
        mandate = guard.active_mandate()
        return {"blocked": mandate != category, "category": category, "reason": reason,
                "mandate": mandate}
    except Exception as exc:  # noqa: BLE001 — jeder Fehler wird zur Sperre, nie zum Durchlass
        bus.emit("guard.error", tool=tool, error=str(exc)[:200], where="events")
        return {"blocked": True, "category": "guard-fehler",
                "reason": f"Wache nicht pruefbar: {str(exc)[:160]}", "mandate": None}


def register_undo(tool: str, tool_input: dict, session_id: str) -> dict | None:
    """Rückweg vor der Handlung: Bash → aus dem Befehl abgeleitet; Write/Edit auf eine bestehende
    Datei → Sicherungskopie. Fail-open: ein Fehler kostet den Posten, nie den Werkzeugaufruf."""
    try:
        from . import rollback
        if tool == "Bash":
            # register_from_bash sichert ein bestehendes Ziel (cp/mv) als Sicherungskopie, statt
            # einen Rückweg zu erfinden, der den Vorzustand löschte.
            return rollback.register_from_bash(str(tool_input.get("command") or ""),
                                               evidence={"tool": "Bash", "session_id": session_id})
        if tool in WRITE_TOOLS:
            path = str(tool_input.get("file_path") or tool_input.get("notebook_path") or "")
            if path and Path(path).expanduser().is_file():
                return rollback.snapshot_file(path)
        return None
    except Exception as exc:  # noqa: BLE001
        bus.emit("hook-fehler", mode="pre-tool", stage="rollback", tool=tool, error=str(exc)[:200])
        return None


def pre_tool(payload: dict) -> str:
    """Guard (fail-closed) → deny-JSON; sonst Rückweg registrieren und „pre" auf den Bus."""
    session_id = _session_id(payload)
    tool = str(payload.get("tool_name") or "")
    tool_input = _tool_input(payload)
    verdict = guard_decision(tool, tool_input)
    summary = summarize(tool, tool_input)
    marks = flags(tool, tool_input)
    if verdict["blocked"]:
        marks.append(f"GESPERRT:{verdict['category']}")
        bus.emit("deny", mode="pre-tool", session_id=session_id, tool=tool, summary=summary,
                 flags=marks, category=verdict["category"], reason=verdict["reason"])
        return json.dumps(deny_json(str(verdict["category"]), str(verdict["reason"])), ensure_ascii=True)
    if verdict.get("category"):
        marks.append(f"mandat:{verdict['category']}")
    posten = register_undo(tool, tool_input, session_id)
    if posten:
        marks.append("rueckweg" if posten.get("undo") else "ohne-rueckweg")
    bus.emit("pre", mode="pre-tool", session_id=session_id, tool=tool, summary=summary, flags=marks,
             rollback_id=posten.get("id") if posten else None)
    return ""


# --- Modus 4: post-tool -----------------------------------------------------------------------------
def post_tool(payload: dict) -> str:
    """Eine Inbox-Zeile je Werkzeugaufruf — Buchführung, kein Modellurteil. Takt A macht Episoden daraus."""
    session_id = _session_id(payload)
    tool = str(payload.get("tool_name") or "")
    tool_input = _tool_input(payload)
    response = payload.get("tool_response")
    summary = summarize(tool, tool_input)
    result = outcome(response)
    head = response_head(response)
    record = {
        "at": paths.now_iso(),
        "tool": tool,
        "args_hash": args_hash(tool_input),
        "outcome": result,
        "summary": f"{tool}: {summary}" + (f" → {head}" if head else ""),
    }
    from .memory import consolidate
    consolidate.inbox_write(session_id, record)
    bus.emit("post", mode="post-tool", session_id=session_id, tool=tool, outcome=result,
             summary=summary, flags=flags(tool, tool_input))
    return ""


# --- Modus 5: stop ----------------------------------------------------------------------------------
def delivered_without_receipt() -> tuple[list[dict], str | None]:
    """Verträge im Status „delivered": geliefert, aber ohne geprüfte Quittung. Der Status zählt,
    nicht `receipt is None` — nach Nacharbeit bleibt die alte Quittung am Vertrag.
    Rückgabe (verträge, fehler): ein Fehler beim Lesen wird gemeldet, nicht verschluckt."""
    try:
        from . import contract
        return [c for c in contract.list_open() if c.get("status") == "delivered"], None
    except Exception as exc:  # noqa: BLE001
        return [], f"{type(exc).__name__}: {str(exc)[:160]}"


def block_reason(delivered: list[dict], error: str | None) -> str:
    parts = [
        f"Vertrag {c.get('id')} ist geliefert, aber nicht geprüft. `soul verify {c.get('id')}` "
        f"ausführen oder `soul contract block {c.get('id')} <grund>`."
        for c in delivered
    ]
    if error:
        parts.append(f"Das Prüfgate konnte die Verträge nicht lesen ({error}); "
                     f"`soul status` ausführen und den Zustand unter SOUL10_HOME prüfen.")
    return " ".join(parts)


def run_takt_a(session_id: str, mode: str) -> dict:
    """Takt A der Konsolidierung (Inbox → Episoden); fail-open."""
    try:
        from .memory import consolidate
        return consolidate.takt_a(session_id)
    except Exception as exc:  # noqa: BLE001
        bus.emit("hook-fehler", mode=mode, stage="takt_a", error=str(exc)[:200])
        return {"episoden": None, "error": str(exc)[:200]}


def run_takt_b(mode: str) -> dict | None:
    """Takt B der Konsolidierung (Dubletten, Widerspruch, Ablauf, Retention, Aktivierung, Selbst),
    höchstens einmal je consolidate.TAKT_B_INTERVALL_STUNDEN; fail-open. None heißt: nicht fällig.
    Ohne diesen Aufrufer liefe Takt B nur aus der CLI (Prüfbefund: toter Mechanismus)."""
    try:
        from .memory import consolidate
        if not consolidate.takt_b_faellig():
            return None
        return consolidate.takt_b()
    except Exception as exc:  # noqa: BLE001
        bus.emit("hook-fehler", mode=mode, stage="takt_b", error=str(exc)[:200])
        return {"error": str(exc)[:200]}


def stop(payload: dict) -> str:
    """Prüfgate: ein gelieferter Vertrag ohne Quittung blockiert „fertig" — außer stop_hook_active
    ist gesetzt (keine Schleife). Sonst Takt A, dann Takt B, wenn fällig. Ein nicht lesbares
    Prüfgate blockiert ebenfalls (fail-closed wie der Guard: ein Gate, das man nicht prüfen kann,
    ist kein Gate)."""
    session_id = _session_id(payload)
    active = bool(payload.get("stop_hook_active"))
    delivered, error = delivered_without_receipt()
    if not active and (delivered or error):
        reason = block_reason(delivered, error)
        bus.emit("stop.block", mode="stop", session_id=session_id,
                 contracts=[c.get("id") for c in delivered], error=error)
        return json.dumps(block_json(reason), ensure_ascii=True)
    result = run_takt_a(session_id, "stop")
    takt_b = run_takt_b("stop")
    bus.emit("stop", mode="stop", session_id=session_id, stop_hook_active=active,
             delivered_unverified=len(delivered), gate_error=error,
             episoden=result.get("episoden"), takt_b=takt_b is not None and "error" not in takt_b)
    return ""


# --- Modus 6: pre-compact ---------------------------------------------------------------------------
def pre_compact(payload: dict) -> str:
    """Zustands-Snapshot vor der Kompaktierung: offene Verträge, offene Rückbau-Posten, Zeit."""
    session_id = _session_id(payload)
    contracts = open_contracts("pre-compact")
    posten = open_rollbacks("pre-compact")
    snapshot = {
        "at": paths.now_iso(),
        "session_id": session_id,
        "trigger": payload.get("trigger"),
        "open_contracts": contracts,
        "open_rollbacks": posten,
    }
    target = paths.snapshot_file()
    tmp = target.with_name(target.name + ".tmp")
    tmp.write_text(json.dumps(snapshot, indent=2, ensure_ascii=False, default=str), encoding="utf-8")
    os.replace(tmp, target)
    bus.emit("compact", mode="pre-compact", session_id=session_id, trigger=payload.get("trigger"),
             open_contracts=len(contracts), open_rollbacks=len(posten), file=str(target))
    return ""


# --- Modus 7: subagent-stop -------------------------------------------------------------------------
def subagent_stop(payload: dict) -> str:
    """Ein Unteragent hat geendet: Bus-Zeile mit Ebene (Dirigent = 1, Unteragent = 2, wenn nichts anderes gesagt)."""
    session_id = _session_id(payload)
    try:
        level = int(payload.get("level") or 2)
    except (TypeError, ValueError):
        level = 2
    bus.emit("subagent-stop", mode="subagent-stop", session_id=session_id,
             agent_id=payload.get("agent_id"), agent_type=payload.get("agent_type"), level=level,
             stop_hook_active=bool(payload.get("stop_hook_active")))
    return ""


# --- Modus 8: session-end ---------------------------------------------------------------------------
def session_end(payload: dict) -> str:
    """Sitzungsende: Takt A, damit keine Inbox-Zeile liegen bleibt; Takt B, wenn fällig."""
    session_id = _session_id(payload)
    result = run_takt_a(session_id, "session-end")
    takt_b = run_takt_b("session-end")
    bus.emit("session-end", mode="session-end", session_id=session_id, reason=payload.get("reason"),
             episoden=result.get("episoden"), takt_b=takt_b is not None and "error" not in takt_b)
    return ""


# --- Verteiler und Einstieg -------------------------------------------------------------------------
HANDLERS = {
    "session-start": session_start,
    "user-prompt": user_prompt,
    "pre-tool": pre_tool,
    "post-tool": post_tool,
    "stop": stop,
    "pre-compact": pre_compact,
    "subagent-stop": subagent_stop,
    "session-end": session_end,
}


def handle(mode: str, payload: dict) -> str:
    """Ein Ereignis → Text für stdout ("" heißt: nichts ausgeben). Nie eine Ausnahme nach außen."""
    fn = HANDLERS.get(mode)
    if fn is None:
        bus.emit("hook-fehler", mode=mode, error="unbekannter Modus")
        return ""
    try:
        return fn(payload if isinstance(payload, dict) else {}) or ""
    except Exception as exc:  # noqa: BLE001 — fail-open, aber sichtbar auf dem Bus
        bus.emit("hook-fehler", mode=mode, error=f"{type(exc).__name__}: {str(exc)[:200]}")
        return ""


def read_payload(stream) -> dict:
    """stdin von Claude Code als dict; kaputtes oder fehlendes JSON → {}."""
    try:
        data = json.load(stream)
    except (ValueError, OSError, AttributeError, TypeError):
        return {}
    return data if isinstance(data, dict) else {}


def _write(out: str, stream) -> None:
    try:
        stream.write(out + "\n")
    except UnicodeEncodeError:
        stream.write(out.encode("ascii", "replace").decode("ascii") + "\n")
    try:
        stream.flush()
    except Exception:  # noqa: BLE001
        pass


def main(argv: list[str] | None = None, stdin=None, stdout=None) -> int:
    """Einstieg für .claude/hooks/hook.py: Modus aus argv[1], Ereignis aus stdin, Antwort auf stdout.
    Exit-Code immer 0 — Entscheidungen gehen als JSON, nie als Exit-Code."""
    argv = list(sys.argv[1:] if argv is None else argv)
    mode = argv[0] if argv else ""
    stream_out = stdout if stdout is not None else sys.stdout
    if stdout is None:
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError):
            pass
    out = handle(mode, read_payload(stdin if stdin is not None else sys.stdin))
    if out:
        _write(out, stream_out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
