"""Adapter auf das Modell: ein Weg für alle Aufrufe, ein Fake für alle Tests.

Befund: Der Prüfer als eigene Instanz gewinnt +20,0 pp gegen Selbstkonsistenz@3 bei
2 statt 3 Aufrufen (01-BEFUNDE C1); die Aufwandsregel wirkt auf beiden Modellen
(+11,6 pp Haiku, +85,3 pp Sonnet), aber nur geschaltet (02-BAUVORGABEN §5).
Erz → Gold: bewusstsein/harness/runner.py (Roh-Artefakt-Zwang, Wiederaufnahme, Token-
Buchführung) war ein Messwerkzeug; hier derselbe Aufrufweg als Produktbaustein, plus die
gemessenen Texte als Konstanten — byte-gleich zur Strecke, damit Evidenz und Produkt
denselben Wortlaut teilen.

Kein anderes Modul ruft `claude` direkt auf.
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import time
from typing import Callable

from . import bus

CLI = os.environ.get("SOUL10_CLAUDE_BIN", "claude")
DEFAULT_MODEL = "claude-haiku-4-5-20251001"

# Tests setzen das (conftest). Signatur: FAKE(system, user, **kw) -> dict
FAKE: Callable | None = None

# --- gemessene Texte: byte-gleich zur Prüfstrecke ---------------------------------
# bewusstsein/harness/arme.py::V5_NUR_ZUTEILUNG (+12,4 pp gegen Placebo auf kette20, sofort)
AUFWANDSREGEL = 'Passe deinen Aufwand der Aufgabe an:\n\n- Einfache, eindeutige Aufgabe: direkt antworten, ohne Umschweife.\n- Aufgabe mit mehreren Groessen, Umrechnungen oder Bedingungen: den entscheidenden Schritt einmal unabhaengig nachrechnen.\n- Aufgabe mit vielen Schritten, moeglicher Falle oder strengem Format: die Aufgabe von den gegebenen Groessen her komplett neu aufbauen, das Ergebnis auf einem zweiten Weg pruefen, das Ausgabeformat woertlich abgleichen.\n\nAntworte am Ende im verlangten Format.'

# bewusstsein/harness/mehrfach.py::arch_pruefer (84,0 % gegen 64,0 % SC@3)
PRUEFER_SYSTEM = "Du bist ein unabhaengiger Pruefer. Du uebernimmst nichts ungeprueft."


def pruefer_prompt(aufgabe: str, vorschlag: str) -> str:
    return (f"AUFGABE:\n{aufgabe}\n\nVORGESCHLAGENE ANTWORT:\n{vorschlag}\n\n"
            f"Pruefe diese Antwort unabhaengig nach, indem du die Aufgabe selbst von den "
            f"gegebenen Groessen her neu aufbaust. Wenn sie richtig ist, wiederhole sie "
            f"unveraendert. Wenn sie falsch ist, gib die korrigierte Antwort. "
            f"Antworte am Ende exakt im verlangten Format.")


# --- Abgriff -------------------------------------------------------------------------
# Zuerst die deutsch gruppierte Form (10.000 / 1.000.000,5), sonst die einfache Form.
# Die gruppierte Form darf nicht von einer weiteren Ziffer gefolgt sein, damit 3.14159
# nicht als 3.141 + 59 gelesen wird.
_NUM = re.compile(r"-?\d{1,3}(?:\.\d{3})+(?:,\d+)?(?!\d)|-?\d+(?:[.,]\d+)?")
_GRUPPIERT = re.compile(r"^-?\d{1,3}(?:\.\d{3})+(?:,\d+)?$")


def extract_last_number(text: str) -> float | None:
    """Letzte Zahl im Text; deutsche (1,5 / 10.000) und englische (1.5) Schreibweise.
    Ein Punkt zwischen Dreiergruppen ohne Dezimalstelle ist ein Tausendertrenner
    (die Pruefstrecke tilgt Punkte vor dem Abgriff; hier dieselbe Lesart)."""
    zs = _NUM.findall(text or "")
    if not zs:
        return None
    z = zs[-1]
    if _GRUPPIERT.match(z):
        z = z.replace(".", "")
    try:
        return float(z.replace(",", "."))
    except ValueError:
        return None


def extract_last_line(text: str) -> str:
    zeilen = [z.strip() for z in (text or "").strip().splitlines() if z.strip()]
    return zeilen[-1] if zeilen else ""


# --- Aufruf ----------------------------------------------------------------------------
def call(system: str | None, user: str, *, model: str | None = None, thinking: int | None = 0,
         timeout: int = 300, max_retries: int = 3) -> dict:
    """Ein kontrollierter Modellaufruf. Rückgabe immer ein dict mit ok/text/output_tokens/model/error."""
    model = model or DEFAULT_MODEL
    if FAKE is not None:
        res = FAKE(system, user, model=model, thinking=thinking)
        res.setdefault("ok", True)
        res.setdefault("text", "")
        res.setdefault("output_tokens", 0)
        res.setdefault("model", model)
        res.setdefault("error", None)
        bus.emit("model.call", model=model, thinking=thinking, output_tokens=res["output_tokens"],
                 system_chars=len(system or ""), user_chars=len(user), fake=True)
        return res

    cmd = [CLI, "-p", "--restricted", "--no-session-persistence",
           "--output-format", "json", "--model", model]
    if system:
        cmd += ["--system-prompt", system]
    cmd += [user]
    env = dict(os.environ)
    if thinking is not None:
        env["MAX_THINKING_TOKENS"] = str(thinking)
    last_err = None
    for attempt in range(max_retries):
        try:
            proc = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout, env=env)
            raw = proc.stdout.strip()
            if not raw:
                raise ValueError(f"leere Ausgabe (rc={proc.returncode}) {proc.stderr[:300]}")
            data = json.loads(raw)
            if data.get("is_error"):
                raise ValueError(f"api_error: {str(data.get('result', ''))[:400]}")
            usage = data.get("usage", {}) or {}
            res = {"ok": True, "text": data.get("result", ""),
                   "output_tokens": usage.get("output_tokens", 0) or 0,
                   "model": model, "error": None, "attempts": attempt + 1}
            bus.emit("model.call", model=model, thinking=thinking, output_tokens=res["output_tokens"],
                     system_chars=len(system or ""), user_chars=len(user))
            return res
        except subprocess.TimeoutExpired:
            last_err = f"timeout nach {timeout}s"
        except Exception as exc:  # noqa: BLE001 — jeder Fehler wird zum Messwert, nicht zur Ausnahme
            last_err = str(exc)[:400]
        time.sleep(min(2 ** attempt * 2, 60))
    bus.emit("model.call_failed", model=model, error=last_err)
    return {"ok": False, "text": "", "output_tokens": 0, "model": model, "error": last_err,
            "attempts": max_retries}
