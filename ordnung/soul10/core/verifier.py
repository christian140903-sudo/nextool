"""Prüfer: Sprosse 1 lässt die Proben laufen, Sprosse 2 ist eine eigene Modellinstanz; Urteil als Quittung.

Befund: A_PRUEFER 84,0 % bei 2,00 Aufrufen gegen SC@3 64,0 % (+20,0 pp, p<0,001, 01-BEFUNDE C1);
auf trivialen Aufgaben 100 % abgreifbar, 0 % formattreu — der Prüfer redet, der Code greift ab.
Erz → Gold: SOUL trennte Vorhaben und Urteil nur als Regel (Invariante 2, `not-evaluated`);
einen Prüfer gab es nicht. Hier läuft der gemessene Mechanismus aus mehrfach.arch_pruefer
wörtlich (model.PRUEFER_SYSTEM, model.pruefer_prompt), aber erst nach den Proben (billigste
Prüfung zuerst, R16 S4); der Endwert wird per model.extract_last_number abgegriffen, nie der
Rohtext durchgereicht; jede Prüfung hinterlässt eine Quittung mit Hash, aus der
contract.set_verdict das Urteil zieht. Ein Fremdkommando kann als Gegenstimme mitlaufen.
"""
from __future__ import annotations

import shlex
import subprocess

from . import bus, contract, paths, probes
from . import model as _model  # Alias: die Parameter `model` (Modellname) überdecken sonst das Modul

COUNTER_VOICE_TIMEOUT = 300
_EPS = 1e-9


def _fmt(value: float | None) -> str | None:
    if value is None:
        return None
    return str(int(value)) if float(value).is_integer() else f"{value:g}"


def _norm_line(text: str) -> str:
    return _model.extract_last_line(text).strip().lower()


def proposal_value(text: str | None) -> float | None:
    """Abgriff des Endwerts aus einem Vorschlagstext; None ohne Text oder ohne Zahl."""
    return _model.extract_last_number(text) if text else None


# --- Sprosse 2: der gemessene Mechanismus ---------------------------------------------
def check_answer(task: str, proposal: str, *, model: str | None = None, thinking: int = 0) -> dict:
    """Genau der gemessene Prüferaufruf: PRUEFER_SYSTEM + pruefer_prompt(task, proposal), ein Aufruf.

    Rückgabe {"final_text","final_value","proposal_value","changed","calls","ok","model","error",…}.
    `changed` heißt: der abgegriffene Endwert des Prüfers weicht vom Vorschlag ab.
    """
    res = _model.call(_model.PRUEFER_SYSTEM, _model.pruefer_prompt(task, proposal),
                      model=model, thinking=thinking)
    final_text = res.get("text", "") or ""
    final_value = _model.extract_last_number(final_text)
    vorschlag = _model.extract_last_number(proposal or "")
    if not res.get("ok"):
        changed, missing = False, True
    elif vorschlag is not None and final_value is not None:
        changed, missing = abs(final_value - vorschlag) > _EPS, False
    elif vorschlag is None:
        changed, missing = _norm_line(final_text) != _norm_line(proposal or ""), False
    else:  # Vorschlag nennt eine Zahl, der Prüfer keine: keine belegte Korrektur
        changed, missing = False, True
    out = {"final_text": final_text, "final_value": final_value, "proposal_value": vorschlag,
           "changed": changed, "calls": 1, "ok": bool(res.get("ok")), "model": res.get("model"),
           "error": res.get("error"), "value_missing": missing,
           "output_tokens": res.get("output_tokens", 0)}
    bus.emit("verifier.check_answer", changed=changed, ok=out["ok"], model=out["model"],
             proposal_value=vorschlag, final_value=final_value, value_missing=missing)
    return out


# --- Gegenstimme -----------------------------------------------------------------------
def _counter_voice(cmd_template: str, prompt: str, *, cwd: str | None, vorschlag: float | None) -> dict:
    """Fremdkommando mit {prompt}; die letzte Zeile ist die Zweitmeinung. Protokolliert, entscheidet nicht."""
    cmd = cmd_template.replace("{prompt}", shlex.quote(prompt))
    out = {"cmd": cmd_template, "exit": None, "last_line": "", "value": None, "agrees": None, "error": None}
    try:
        proc = subprocess.run(cmd, shell=True, cwd=cwd or None, capture_output=True, text=True,
                              errors="replace", timeout=COUNTER_VOICE_TIMEOUT)
        out["exit"] = proc.returncode
        out["last_line"] = _model.extract_last_line(proc.stdout)[:200]
        out["value"] = _model.extract_last_number(out["last_line"])
        if out["value"] is not None and vorschlag is not None:
            out["agrees"] = abs(out["value"] - vorschlag) <= _EPS
    except subprocess.TimeoutExpired:
        out["error"] = f"Zeitüberschreitung nach {COUNTER_VOICE_TIMEOUT}s"
    except Exception as exc:  # noqa: BLE001 — die Gegenstimme darf die Prüfung nicht anhalten
        out["error"] = str(exc)[:200]
    bus.emit("verifier.counter_voice", exit=out["exit"], value=out["value"], agrees=out["agrees"],
             error=out["error"])
    return out


# --- Die Prüfung -----------------------------------------------------------------------
def verify(contract_id: str, *, use_model: bool = False, model: str | None = None, thinking: int = 0,
           proposal_text: str | None = None, cwd: str | None = None,
           counter_voice_cmd: str | None = None) -> dict:
    """Sprosse 1 immer (alle Proben); Sprosse 2 nur mit use_model und proposal_text und nur,
    wenn Sprosse 1 bestanden ist. Schreibt die Quittung und setzt das Urteil über contract.set_verdict.
    """
    c = contract.load(contract_id)

    # Sprosse 1: deterministisch, immer zuerst, immer vollständig.
    probe_runs = [probes.run(p, cwd=cwd, answer_text=proposal_text) for p in c["probes"]]
    failed = [r for r in probe_runs if not r["passed"]]
    verdict = "fail" if failed else "pass"
    kind, used_model, korrektur, pruefer, calls = "deterministic", None, None, None, 0
    final_value = proposal_value(proposal_text)

    # Sprosse 2: eigene Instanz — nur wenn verlangt, nur mit Vorschlag, nur nach bestandener Sprosse 1.
    if not failed and use_model and proposal_text:
        check = check_answer(c["goal"], proposal_text, model=model, thinking=thinking)
        calls += check["calls"]
        if check["ok"]:
            kind, used_model = "deterministic+model", check["model"]
            if check["changed"]:
                verdict = "fail"
                korrektur = _fmt(check["final_value"]) if check["final_value"] is not None \
                    else _model.extract_last_line(check["final_text"])[:200]
                final_value = check["final_value"]
        # Rohtext bleibt draußen: nur Hash und abgegriffene Werte wandern in die Quittung.
        pruefer = {k: check[k] for k in ("proposal_value", "final_value", "changed", "value_missing",
                                         "ok", "error", "model", "calls", "output_tokens")}
        pruefer["final_text_sha256"] = paths.sha256_text(check["final_text"])

    counter = None
    if not failed and counter_voice_cmd and proposal_text:
        counter = _counter_voice(counter_voice_cmd, _model.pruefer_prompt(c["goal"], proposal_text),
                                 cwd=cwd, vorschlag=proposal_value(proposal_text))

    receipt = {
        "contract_id": contract_id,
        "probe_runs": probe_runs,
        "verdict": verdict,
        "verifier": {"kind": kind, "model": used_model},
        "korrektur": korrektur,
        "pruefer": pruefer,
        "counter_voice": counter,
        "at": paths.now_iso(),
    }
    receipt["hash"] = contract.receipt_hash(receipt)
    receipt_path = contract.write_receipt(receipt)
    contract.set_verdict(contract_id, receipt)
    bus.emit("verifier.verify", contract_id=contract_id, verdict=verdict, kind=kind,
             probes=len(probe_runs), probes_failed=len(failed), calls=calls,
             korrektur=korrektur, receipt=receipt_path.name)
    return {"contract_id": contract_id, "verdict": verdict, "verifier": kind, "korrektur": korrektur,
            "final_value": final_value, "calls": calls, "probes": len(probe_runs),
            "probes_failed": len(failed), "receipt": receipt, "receipt_file": str(receipt_path)}
