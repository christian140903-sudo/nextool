"""Abnahmeproben: vier Typen, validiert vor Annahme, vom Code ausgeführt.

Befund: Auflagen als Text kommen zu 97,8 % im Arbeitsauftrag an, werden aber nur zu 63,9 %
erfüllt; der wörtliche Übergabe-Vertrag kostet −15,3 bis −34,4 pp (01-BEFUNDE B2/B3).
Erz → Gold: SOUL mission.py führte `acceptance: list[str]` — Prosa, die kein Code prüfen
konnte. Hier ist eine Probe ein Datensatz (shell, file, answer, forbid), wird vor Annahme
validiert und deterministisch ausgeführt; das Ergebnis ist ein Probenlauf mit passed/detail,
nie ein Urteil. Das Urteil zieht contract.set_verdict aus der Quittung des Prüfers.

Grenzen (bewusst gesetzt, tests/test_probes.py prüft sie):
- file/forbid: der Pfad wird gegen cwd aufgelöst (Startverzeichnis der Prüfung, sonst das
  Arbeitsverzeichnis des Prozesses) und muss darin liegen — kein '~', kein Ausbruch per '..',
  absolutem Pfad oder Symlink. Was außerhalb liegt, ist nicht prüfbar, also nicht bestanden.
  Gelesen werden nur reguläre Dateien (kein Verzeichnis, FIFO, Gerät), höchstens MAX_TEXT Bytes.
- shell: läuft mit shell=True und den Rechten des Nutzers; cwd ist nur das Startverzeichnis,
  keine Schranke. Was eine Shell-Probe am Vertragszustand ändert, erkennt verifier.verify am
  Fingerabdruck des Vertrags (contract.fingerprint) und urteilt fail.
- Regex: geprüft werden höchstens MAX_TEXT Zeichen (Ausgabe oder Dateiinhalt); längere Texte
  gelten als nicht prüfbar (forbid-Verzeichnisse: Kopf geprüft, Rest als „teilweise geprüft"
  ausgewiesen). Offensichtlich verschachtelte Quantoren wie (a+)+ oder (a*)* lehnt validate ab;
  eine harte Zeitschranke für re.search selbst gibt es nicht.
- Ausgaben (stdout_head, detail) verlassen das Modul nur durch bus.mask maskiert.
- Zahlen in answer-Proben lesen sich wie model.extract_last_number (1.000 = tausend, 12,5 = 12.5).
"""
from __future__ import annotations

import math
import re
import subprocess
from pathlib import Path

from . import bus, model, paths


class ProbeError(ValueError):
    """Die Probe ist unbrauchbar: falscher Typ, fehlender Schlüssel, kaputter Regex, Pfad außerhalb."""


PROBE_TYPES = ("shell", "file", "answer", "forbid")
EXTRACTS = ("last_number", "last_line", "exact")
DEFAULT_TIMEOUT = 60
STDOUT_HEAD = 400
MAX_TEXT = 200_000          # Zeichen bzw. Bytes, die eine Musterprüfung höchstens ansieht
_BINARY_PROBE = 8192        # so viele Bytes entscheiden, ob eine Datei binär ist (NUL-Byte)
_MAX_HITS = 20

# Erlaubte Schlüssel je Typ — Tippfehler ("expect_regx") werden abgelehnt statt ignoriert.
_KEYS = {
    "shell": {"type", "cmd", "expect_exit", "expect_regex", "forbid_regex", "timeout"},
    "file": {"type", "path", "must_exist", "contains_regex", "forbids_regex"},
    "answer": {"type", "expected", "extract", "tolerance"},
    "forbid": {"type", "path", "regex"},
}
# Quantifizierte Gruppe, deren Rumpf selbst mit einem Quantor endet: (a+)+, (a*)*, (a+){2,}.
# Heuristik für den häufigsten katastrophalen Fall; nicht vollständig (siehe Modul-Docstring).
_NESTED_QUANTIFIER = re.compile(r"(?<!\\)[+*]\)[+*{]")


# --- Hilfen ----------------------------------------------------------------------------
def as_number(value) -> float | None:
    """Zahl aus int/float/str in derselben Lesart wie model.extract_last_number (deutsche
    Tausenderpunkte und Dezimalkomma, englischer Dezimalpunkt). Ein Text muss aus genau einer
    Zahl bestehen. bool, unendlich, NaN und alles andere → None."""
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value) if math.isfinite(value) else None
    if isinstance(value, str):
        text = value.strip()
        # model._NUM ist die eine Lesart des Abgriffs; sie muss den ganzen Text erklären.
        muster = getattr(model, "_NUM", None)
        if muster is None or not muster.fullmatch(text):
            return None
        return model.extract_last_number(text)
    return None


def default_extract(expected) -> str:
    """Zahl als Erwartung → letzte Zahl; Text als Erwartung → exakter Vergleich."""
    return "last_number" if as_number(expected) is not None else "exact"


def _fmt(value: float) -> str:
    return str(int(value)) if float(value).is_integer() else f"{value:.12g}"


def _text(probe: dict, key: str) -> None:
    if not isinstance(probe.get(key), str) or not probe[key].strip():
        raise ProbeError(f"{probe['type']}.{key} fehlt oder ist leer")


def _int(probe: dict, key: str, minimum: int | None = None) -> None:
    if key not in probe:
        return
    v = probe[key]
    if isinstance(v, bool) or not isinstance(v, int):
        raise ProbeError(f"{probe['type']}.{key} muss eine ganze Zahl sein")
    if minimum is not None and v < minimum:
        raise ProbeError(f"{probe['type']}.{key} muss ≥ {minimum} sein")


def _regex(probe: dict, key: str) -> None:
    if key not in probe:
        return
    v = probe[key]
    if not isinstance(v, str) or not v:
        raise ProbeError(f"{probe['type']}.{key} muss ein nicht-leerer Regex sein")
    try:
        re.compile(v)
    except re.error as exc:
        raise ProbeError(f"{probe['type']}.{key} ist kein gültiger Regex: {exc}") from exc
    if _NESTED_QUANTIFIER.search(v):
        raise ProbeError(f"{probe['type']}.{key} verschachtelt Quantoren wie (a+)+ — "
                         f"das kann exponentiell lange laufen; Muster umformulieren")


def _base(cwd: str | None) -> Path:
    return (Path(cwd) if cwd else Path.cwd()).resolve()


def _resolve(path: str, cwd: str | None) -> Path:
    """Pfad gegen cwd aufgelöst (Symlinks, '..') und auf cwd beschränkt; sonst ProbeError.
    Kein expanduser: '~' ist ein Zeichen wie jedes andere."""
    base = _base(cwd)
    raw = Path(path)
    p = (raw if raw.is_absolute() else base / raw).resolve()
    if not p.is_relative_to(base):
        raise ProbeError(f"Pfad liegt außerhalb von {base}: {path}")
    return p


def _too_long(text: str, what: str) -> str | None:
    if len(text) > MAX_TEXT:
        return f"{what} zu groß für die Musterprüfung ({len(text)} > {MAX_TEXT} Zeichen)"
    return None


def _read_capped(path: Path) -> str | None:
    """Text einer regulären Datei bis MAX_TEXT Bytes; None, wenn sie größer ist."""
    with path.open("rb") as fh:
        data = fh.read(MAX_TEXT + 1)
    if len(data) > MAX_TEXT:
        return None
    return data.decode("utf-8", errors="replace")


# --- Validierung -----------------------------------------------------------------------
def validate(probe: dict) -> None:
    """Wirft ProbeError, wenn die Probe nicht ausführbar formuliert ist."""
    if not isinstance(probe, dict):
        raise ProbeError("Probe muss ein Objekt mit 'type' sein")
    typ = probe.get("type")
    if typ not in PROBE_TYPES:
        raise ProbeError(f"Unbekannter Probentyp {typ!r}; erlaubt: {', '.join(PROBE_TYPES)}")
    fremd = sorted(set(probe) - _KEYS[typ])
    if fremd:
        raise ProbeError(f"Unbekannte Schlüssel für Probe '{typ}': {fremd}")
    if typ == "shell":
        _text(probe, "cmd")
        _int(probe, "expect_exit")
        _int(probe, "timeout", minimum=1)
        _regex(probe, "expect_regex")
        _regex(probe, "forbid_regex")
    elif typ == "file":
        _text(probe, "path")
        must_exist = probe.get("must_exist", True)
        if not isinstance(must_exist, bool):
            raise ProbeError("file.must_exist muss true oder false sein")
        _regex(probe, "contains_regex")
        _regex(probe, "forbids_regex")
        if not must_exist and (probe.get("contains_regex") or probe.get("forbids_regex")):
            raise ProbeError("file: must_exist=false verträgt sich nicht mit Inhaltsmustern")
    elif typ == "answer":
        if "expected" not in probe:
            raise ProbeError("answer.expected fehlt")
        expected = probe["expected"]
        if isinstance(expected, bool) or not isinstance(expected, (str, int, float)):
            raise ProbeError("answer.expected muss Text oder Zahl sein")
        if isinstance(expected, str) and not expected.strip():
            raise ProbeError("answer.expected darf nicht leer sein")
        if isinstance(expected, float) and not math.isfinite(expected):
            raise ProbeError("answer.expected muss eine endliche Zahl sein")
        extract = probe.get("extract", default_extract(expected))
        if extract not in EXTRACTS:
            raise ProbeError(f"answer.extract {extract!r} unbekannt; erlaubt: {', '.join(EXTRACTS)}")
        tolerance = probe.get("tolerance", 0)
        if (isinstance(tolerance, bool) or not isinstance(tolerance, (int, float))
                or not math.isfinite(tolerance) or tolerance < 0):
            raise ProbeError("answer.tolerance muss eine endliche Zahl ≥ 0 sein")
        if extract == "last_number" and as_number(expected) is None:
            raise ProbeError("answer.extract=last_number braucht eine Zahl als expected")
        if extract != "last_number" and tolerance:
            raise ProbeError("answer.tolerance gilt nur für extract=last_number")
    else:  # forbid
        _text(probe, "path")
        _text(probe, "regex")
        _regex(probe, "regex")


# --- Ausführung ------------------------------------------------------------------------
def run(probe: dict, *, cwd: str | None = None, answer_text: str | None = None) -> dict:
    """Führt eine Probe aus. Rückgabe {"type","passed","detail","stdout_head","exit","at"}.

    Eine Probe, die nicht laufen kann (fehlende Datei, Pfad außerhalb cwd, Zeitüberschreitung,
    Lesefehler), gilt als nicht bestanden — nie als bestanden. detail und stdout_head sind
    maskiert (bus.mask), bevor sie zurückgehen. Jeder Lauf schreibt eine Bus-Zeile.
    """
    validate(probe)
    typ = probe["type"]
    at = paths.now_iso()
    try:
        if typ == "shell":
            result = _run_shell(probe, cwd)
        elif typ == "file":
            result = _run_file(probe, cwd)
        elif typ == "answer":
            result = _run_answer(probe, answer_text)
        else:
            result = _run_forbid(probe, cwd)
    except Exception as exc:  # noqa: BLE001 — fail-closed: nicht ausführbar heißt nicht bestanden
        result = {"passed": False, "detail": f"Probe nicht ausführbar: {exc}"[:400],
                  "stdout_head": "", "exit": None}
    out = {"type": typ, **result, "at": at}
    out["detail"] = bus.mask(str(out.get("detail") or ""))
    out["stdout_head"] = bus.mask(str(out.get("stdout_head") or ""))
    bus.emit("probe.run", type=typ, passed=out["passed"], detail=out["detail"][:200])
    return out


def _run_shell(probe: dict, cwd: str | None) -> dict:
    timeout = int(probe.get("timeout", DEFAULT_TIMEOUT))
    try:
        proc = subprocess.run(probe["cmd"], shell=True, cwd=cwd or None, capture_output=True,
                              text=True, errors="replace", timeout=timeout)
    except subprocess.TimeoutExpired:
        return {"passed": False, "detail": f"Zeitüberschreitung nach {timeout}s",
                "stdout_head": "", "exit": None}
    stdout = proc.stdout or ""
    # Geprüft wird stdout und stderr zusammen: viele Werkzeuge melden auf stderr.
    output = stdout + ("\n" + proc.stderr if proc.stderr else "")
    expect_exit = int(probe.get("expect_exit", 0))
    gruende = []
    if proc.returncode != expect_exit:
        gruende.append(f"Exit {proc.returncode}, erwartet {expect_exit}")
    rx, fx = probe.get("expect_regex"), probe.get("forbid_regex")
    zu_lang = _too_long(output, "Ausgabe") if (rx or fx) else None
    if zu_lang:
        gruende.append(zu_lang)
    else:
        if rx and not re.search(rx, output, re.M):
            gruende.append(f"Ausgabe passt nicht auf /{rx}/")
        if fx and re.search(fx, output, re.M):
            gruende.append(f"Ausgabe enthält verbotenes Muster /{fx}/")
    return {"passed": not gruende, "detail": "bestanden" if not gruende else "; ".join(gruende),
            "stdout_head": stdout[:STDOUT_HEAD], "exit": proc.returncode}


def _run_file(probe: dict, cwd: str | None) -> dict:
    path = _resolve(probe["path"], cwd)
    exists = path.exists()
    if not probe.get("must_exist", True):
        return {"passed": not exists,
                "detail": "Datei fehlt wie verlangt" if not exists else f"Datei existiert, soll aber fehlen: {path}",
                "stdout_head": "", "exit": None}
    if not exists:
        return {"passed": False, "detail": f"Datei fehlt: {path}", "stdout_head": "", "exit": None}
    if not path.is_file():
        return {"passed": False, "detail": f"Pfad ist keine reguläre Datei (Verzeichnis, FIFO oder Gerät): {path}",
                "stdout_head": "", "exit": None}
    rx, fx = probe.get("contains_regex"), probe.get("forbids_regex")
    text = _read_capped(path)
    if text is None:
        if rx or fx:
            return {"passed": False, "detail": f"Datei zu groß für die Musterprüfung (> {MAX_TEXT} Bytes): {path}",
                    "stdout_head": "", "exit": None}
        return {"passed": True, "detail": f"Datei existiert (Inhalt > {MAX_TEXT} Bytes, nicht gelesen)",
                "stdout_head": "", "exit": None}
    gruende = []
    if rx and not re.search(rx, text, re.M):
        gruende.append(f"Inhalt passt nicht auf /{rx}/")
    if fx and re.search(fx, text, re.M):
        gruende.append(f"Inhalt enthält verbotenes Muster /{fx}/")
    return {"passed": not gruende, "detail": "bestanden" if not gruende else "; ".join(gruende),
            "stdout_head": text[:STDOUT_HEAD], "exit": None}


def _run_answer(probe: dict, answer_text: str | None) -> dict:
    expected = probe["expected"]
    extract = probe.get("extract") or default_extract(expected)
    if answer_text is None:
        return {"passed": False, "detail": "keine Antwort vorhanden (answer_text fehlt)",
                "stdout_head": "", "exit": None}
    head = answer_text[:STDOUT_HEAD]
    if extract == "last_number":
        ist = model.extract_last_number(answer_text)
        soll = as_number(expected)
        tol = float(probe.get("tolerance", 0))
        if ist is None:
            return {"passed": False, "detail": f"keine Zahl in der Antwort, erwartet {_fmt(soll)}",
                    "stdout_head": head, "exit": None}
        passed = abs(ist - soll) <= tol
        detail = f"letzte Zahl {_fmt(ist)}, erwartet {_fmt(soll)}" + (f" (±{tol:g})" if tol else "")
    elif extract == "last_line":
        ist, soll = model.extract_last_line(answer_text), str(expected).strip()
        passed = ist == soll
        detail = f"letzte Zeile {ist!r}, erwartet {soll!r}"
    else:
        ist, soll = answer_text.strip(), str(expected).strip()
        passed = ist == soll
        detail = "Antwort stimmt exakt" if passed else f"Antwort {ist[:80]!r} ≠ erwartet {soll[:80]!r}"
    return {"passed": passed, "detail": detail, "stdout_head": head, "exit": None}


def _is_binary(path: Path) -> bool:
    with path.open("rb") as fh:
        return b"\0" in fh.read(_BINARY_PROBE)


def _run_forbid(probe: dict, cwd: str | None) -> dict:
    base = _base(cwd)
    path = _resolve(probe["path"], cwd)
    if not path.exists():
        return {"passed": False, "detail": f"Datei fehlt: {path}", "stdout_head": "", "exit": None}
    if path.is_file():
        files = [path]
    elif path.is_dir():
        # Nur reguläre Dateien innerhalb von cwd (Symlinks nach außen bleiben ungelesen).
        files = sorted(p for p in path.rglob("*") if p.is_file() and p.resolve().is_relative_to(base))
    else:
        return {"passed": False, "detail": f"Pfad ist keine reguläre Datei (FIFO oder Gerät): {path}",
                "stdout_head": "", "exit": None}
    rx = re.compile(probe["regex"], re.M)
    treffer: list[str] = []
    teilweise: list[str] = []
    geprueft = 0
    for f in files:
        try:
            if _is_binary(f):
                continue
            with f.open("rb") as fh:
                data = fh.read(MAX_TEXT + 1)
        except OSError:
            continue
        if len(data) > MAX_TEXT:
            teilweise.append(f.name)
            data = data[:MAX_TEXT]
        text = data.decode("utf-8", errors="replace")
        geprueft += 1
        for m in rx.finditer(text):
            treffer.append(f"{f.name}:{text.count(chr(10), 0, m.start()) + 1}")
            if len(treffer) >= _MAX_HITS:
                break
        if len(treffer) >= _MAX_HITS:
            break
    hinweis = (f"; {len(teilweise)} Datei(en) nur bis {MAX_TEXT} Bytes geprüft: {', '.join(teilweise[:3])}"
               if teilweise else "")
    if not treffer:
        return {"passed": True, "detail": f"kein Treffer für /{probe['regex']}/ in {geprueft} Datei(en){hinweis}",
                "stdout_head": "", "exit": None}
    rest = f" (+{len(treffer) - 5} weitere)" if len(treffer) > 5 else ""
    return {"passed": False,
            "detail": f"verbotenes Muster /{probe['regex']}/ in {', '.join(treffer[:5])}{rest}{hinweis}",
            "stdout_head": "", "exit": None}


# --- Beschreibung für den Übergabetext -------------------------------------------------
def describe(probe: dict) -> str:
    """Eine Zeile je Probe, mit Kommando bzw. Erwartung wörtlich — das ist, was zählt.
    Zahlen erscheinen so, wie sie verglichen werden (10.000 → 10000, 12,5 → 12.5)."""
    validate(probe)
    typ = probe["type"]
    if typ == "shell":
        teile = [f"Shell: {probe['cmd']} → Exit {probe.get('expect_exit', 0)}"]
        if probe.get("expect_regex"):
            teile.append(f"Ausgabe passt auf /{probe['expect_regex']}/")
        if probe.get("forbid_regex"):
            teile.append(f"Ausgabe ohne /{probe['forbid_regex']}/")
        return ", ".join(teile)
    if typ == "file":
        if not probe.get("must_exist", True):
            return f"Datei: {probe['path']} darf nicht existieren"
        teile = [f"Datei: {probe['path']} muss existieren"]
        if probe.get("contains_regex"):
            teile.append(f"enthält /{probe['contains_regex']}/")
        if probe.get("forbids_regex"):
            teile.append(f"ohne /{probe['forbids_regex']}/")
        return ", ".join(teile)
    if typ == "answer":
        extract = probe.get("extract") or default_extract(probe["expected"])
        was = {"last_number": "letzte Zahl", "last_line": "letzte Zeile", "exact": "gesamte Antwort"}[extract]
        soll = _fmt(as_number(probe["expected"])) if extract == "last_number" else probe["expected"]
        tol = probe.get("tolerance", 0)
        return f"Antwort: {was} == {soll}" + (f" (±{tol:g})" if tol else "")
    return f"Verboten: /{probe['regex']}/ in {probe['path']}"
