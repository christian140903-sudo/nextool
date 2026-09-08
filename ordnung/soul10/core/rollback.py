"""Rückbau-Konto: jede Handlung mit Außenwirkung trägt ihren Rückweg; die Quote ist eine Zahl.

Befund: Widerrufbarkeit ist messbar, „hätte der Nutzer eingegriffen" nicht — Rückbauquote
als Zahl statt Rückfrage (bewusstsein/uebergabe/03-OFFENE-FRAGEN.md Rang 5; 06-AUFTRAG §6.6:
Handlungen ohne Rückweg sind die einzigen, die eine Bestätigung brauchen).
Erz → Gold: Soul 5.0 N2 („Zurückgezogenes wird nie weitergetragen") war ein Prinzip in Prosa,
SOUL protokollierte Werkzeugaufrufe, aber keinen Rückweg. Hier: ein append-only Konto
(state/rollback.jsonl) mit Rückbaubefehl je Posten, Sicherungskopie vor Dateiänderungen,
Ableitung des Rückwegs aus Shell-Befehlen, Ausführung des Rückbaus mit Status und die Quote
with_undo/registered.

Kein Posten wird gelöscht: Statuswechsel sind eigene Zeilen; der Zustand entsteht beim Lesen.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import shlex
import shutil
import subprocess
from pathlib import Path

from . import bus, paths


class RollbackError(ValueError):
    """Ungültige Art, unbekannter Posten oder Posten ohne Rückweg — nichts wird ausgeführt."""


KINDS = ("install", "file", "config", "git", "command", "other")
STATUS = ("open", "undone", "undo_failed")
UNDO_TIMEOUT = 120

# Befehlsketten: jedes Glied wird einzeln auf einen Rückweg geprüft (`cd x && pip install y`).
_SEGMENT_SPLIT = re.compile(r"\s*(?:&&|\|\||;)\s*")
_ENV_ASSIGN = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*=")
_PIP_SPEC_END = re.compile(r"[=<>!~\[;@]")
_APT_SPEC_END = re.compile(r"[=/]")
_NPM_NAME = re.compile(r"^(@[^/@]+/[^@]+|[^@]+)")
_RECURSIVE_FLAGS = ("-r", "-R", "-a", "--recursive", "-rf", "-fr", "-Rf", "-fR")


# --- Konto lesen und schreiben -------------------------------------------------------------
def _append(record: dict) -> None:
    with paths.rollback_file().open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(record, ensure_ascii=False, default=str) + "\n")


def _load() -> dict[str, dict]:
    """Baut den Zustand aller Posten aus den Zeilen auf: register legt an, undo ändert Status."""
    out: dict[str, dict] = {}
    try:
        lines = paths.rollback_file().read_text(encoding="utf-8").splitlines()
    except OSError:
        return out
    for line in lines:
        try:
            rec = json.loads(line)
        except ValueError:
            continue
        op = rec.get("op")
        if op == "register" and rec.get("id"):
            out[rec["id"]] = {k: v for k, v in rec.items() if k != "op"}
        elif op == "undo" and rec.get("id") in out:
            posten = out[rec["id"]]
            posten["status"] = rec.get("status", posten.get("status", "open"))
            posten["undone_at"] = rec.get("at")
            posten["undo_exit"] = rec.get("exit")
            posten["undo_error"] = rec.get("error")
    return out


def _register(rid: str, kind: str, description: str, *, undo: str | None, evidence: dict | None,
              contract_id: str | None) -> dict:
    if kind not in KINDS:
        raise RollbackError(f"unbekannte Art des Postens: {kind!r} (erlaubt: {', '.join(KINDS)})")
    if undo is not None and not str(undo).strip():
        undo = None
    record = {
        "id": rid,
        "at": paths.now_iso(),
        "kind": kind,
        "description": bus.mask(str(description))[:400],
        "undo": undo,
        "needs_confirmation": undo is None,
        "status": "open",
        "contract_id": contract_id,
        "evidence": dict(evidence or {}),
    }
    _append({"op": "register", **record})
    bus.emit("rollback.register", id=rid, kind=kind, needs_confirmation=record["needs_confirmation"],
             contract_id=contract_id, undo=undo)
    return record


def register(kind: str, description: str, *, undo: str | None, evidence: dict | None = None,
             contract_id: str | None = None) -> dict:
    """Ein Posten im Konto. Ohne Rückweg (undo=None) trägt er needs_confirmation=True —
    das ist die einzige Klasse von Handlungen, die eine Bestätigung braucht."""
    return _register(paths.new_id(), kind, description, undo=undo, evidence=evidence,
                     contract_id=contract_id)


# --- Rückweg als Python-Befehl (läuft auf jeder Plattform, auf der python3 läuft) -----------
def _python_command(code: str) -> str:
    """`python3 -c <code>` so gequotet, wie die Shell dieser Plattform es liest."""
    if os.name == "nt":
        return 'python3 -c "' + code.replace('"', '\\"') + '"'
    return "python3 -c " + shlex.quote(code)


def snapshot_file(path: str, *, contract_id: str | None = None) -> dict:
    """Sicherungskopie nach rollback/<id>/<basename>; Rückweg = Kopie zurück.
    Datei nicht vorhanden → Rückweg = Löschen der später erzeugten Datei."""
    src = Path(path).expanduser().resolve()
    if src.is_dir():
        raise RollbackError(f"Sicherungskopie nur für Dateien, {src} ist ein Verzeichnis")
    rid = paths.new_id()
    if src.is_file():
        target_dir = paths.rollback_dir() / rid
        target_dir.mkdir(parents=True, exist_ok=True)
        snap = target_dir / src.name
        shutil.copy2(src, snap)
        digest = hashlib.sha256(snap.read_bytes()).hexdigest()
        undo = _python_command(f"import shutil; shutil.copy2({str(snap)!r}, {str(src)!r})")
        description = f"Sicherungskopie von {src} nach {snap}"
        evidence = {"path": str(src), "snapshot": str(snap), "existed": True,
                    "bytes": snap.stat().st_size, "sha256": digest}
    else:
        undo = _python_command(f"import os; os.remove({str(src)!r})")
        description = f"Neue Datei {src} (vorher nicht vorhanden)"
        evidence = {"path": str(src), "snapshot": None, "existed": False}
    record = _register(rid, "file", description, undo=undo, evidence=evidence, contract_id=contract_id)
    bus.emit("rollback.snapshot", id=rid, path=str(src), existed=evidence["existed"])
    return record


# --- Rückweg aus einem Shell-Befehl ableiten -------------------------------------------------
def _strip_prefixes(tokens: list[str]) -> tuple[list[str], bool]:
    """Entfernt sudo (mit Flags), env und VAR=wert vor dem eigentlichen Programm."""
    sudo = False
    while tokens:
        t = tokens[0]
        if t == "sudo":
            sudo = True
            tokens = tokens[1:]
            while tokens and tokens[0].startswith("-"):
                flag = tokens[0]
                tokens = tokens[1:]
                if flag in ("-u", "-g", "-C", "-h", "-p", "-U") and tokens:
                    tokens = tokens[1:]
        elif t == "env" or (_ENV_ASSIGN.match(t) and not t.startswith("-")):
            tokens = tokens[1:]
        else:
            break
    return tokens, sudo


def _positional(args: list[str]) -> list[str]:
    return [a for a in args if not a.startswith("-")]


def _pip_packages(args: list[str]) -> list[str] | None:
    """Paketnamen ohne Versionsangabe; Requirements-Dateien, Pfade, Editable → kein Rückweg."""
    if any(a in ("-r", "--requirement", "-e", "--editable", "-c", "--constraint") for a in args):
        return None
    pkgs = []
    for a in _positional(args):
        if a in (".", "..") or a.startswith(("/", "./", "../", "~", "http://", "https://", "git+", "file:")) \
                or a.endswith((".whl", ".tar.gz", ".zip", ".txt")):
            return None
        name = _PIP_SPEC_END.split(a, 1)[0].strip()
        if name:
            pkgs.append(name)
    return pkgs or None


def _npm_packages(args: list[str]) -> list[str] | None:
    pkgs = []
    for a in _positional(args):
        if a.startswith((".", "/", "~", "http://", "https://", "file:", "git+", "github:")):
            return None
        m = _NPM_NAME.match(a)
        if m and m.group(1):
            pkgs.append(m.group(1))
    return pkgs or None


def _install_result(description: str, undo: str) -> dict:
    return {"kind": "install", "description": description, "undo": undo}


def _infer_segment(segment: str) -> dict | None:
    if not segment:
        return None
    try:
        tokens = shlex.split(segment, posix=True)
    except ValueError:
        tokens = segment.split()
    tokens, sudo = _strip_prefixes(tokens)
    if not tokens:
        return None
    prog, args = tokens[0], tokens[1:]
    prefix = "sudo " if sudo else ""

    # python3 -m pip install X  →  wie pip
    if prog in ("python", "python3", "py") and args[:2] == ["-m", "pip"]:
        prog, args = f"{prog} -m pip", args[2:]

    # --- Installationen ---
    if (prog in ("pip", "pip3") or prog.endswith(" -m pip")) and args[:1] == ["install"]:
        pkgs = _pip_packages(args[1:])
        return _install_result(segment, f"{prefix}{prog} uninstall -y {' '.join(pkgs)}") if pkgs else None
    if prog == "pipx" and args[:1] == ["install"]:
        pkgs = _pip_packages(args[1:])
        return _install_result(segment, " && ".join(f"pipx uninstall {p}" for p in pkgs)) if pkgs else None
    if prog == "uv":
        if args[:2] == ["pip", "install"]:
            pkgs = _pip_packages(args[2:])
            return _install_result(segment, f"uv pip uninstall {' '.join(pkgs)}") if pkgs else None
        if args[:2] == ["tool", "install"]:
            pkgs = _pip_packages(args[2:])
            return _install_result(segment, " && ".join(f"uv tool uninstall {p}" for p in pkgs)) if pkgs else None
        if args[:1] == ["add"]:
            pkgs = _pip_packages(args[1:])
            return _install_result(segment, f"uv remove {' '.join(pkgs)}") if pkgs else None
        return None
    if prog == "npm" and args[:1] and args[0] in ("install", "i", "add"):
        pkgs = _npm_packages(args[1:])
        if not pkgs:
            return None
        scope = "-g " if any(a in ("-g", "--global") for a in args) else ""
        return _install_result(segment, f"{prefix}npm uninstall {scope}{' '.join(pkgs)}")
    if prog == "pnpm" and args[:1] and args[0] in ("add", "install", "i"):
        pkgs = _npm_packages(args[1:])
        if not pkgs:
            return None
        scope = "-g " if any(a in ("-g", "--global") for a in args) else ""
        return _install_result(segment, f"{prefix}pnpm remove {scope}{' '.join(pkgs)}")
    if prog == "yarn":
        if args[:1] == ["add"]:
            pkgs = _npm_packages(args[1:])
            return _install_result(segment, f"yarn remove {' '.join(pkgs)}") if pkgs else None
        if args[:2] == ["global", "add"]:
            pkgs = _npm_packages(args[2:])
            return _install_result(segment, f"yarn global remove {' '.join(pkgs)}") if pkgs else None
        return None
    if prog in ("apt-get", "apt") and args[:1] == ["install"]:
        pkgs = [_APT_SPEC_END.split(a, 1)[0] for a in _positional(args[1:])]
        pkgs = [p for p in pkgs if p]
        return _install_result(segment, f"{prefix}{prog} remove -y {' '.join(pkgs)}") if pkgs else None
    if prog == "brew" and args[:1] == ["install"]:
        pkgs = _positional(args[1:])
        if not pkgs:
            return None
        cask = "--cask " if "--cask" in args else ""
        return _install_result(segment, f"brew uninstall {cask}{' '.join(pkgs)}")
    if prog == "cargo" and args[:1] == ["install"]:
        pkgs = _positional(args[1:])
        return _install_result(segment, f"cargo uninstall {' '.join(pkgs)}") if pkgs else None

    # --- Git ---
    if prog == "git" and args[:1] == ["commit"]:
        return {"kind": "git", "description": segment, "undo": "git revert --no-edit HEAD"}

    # --- Dateisystem ---
    if prog == "mkdir":
        dirs = _positional(args)
        return {"kind": "file", "description": segment, "undo": f"rmdir {' '.join(dirs)}"} if dirs else None
    if prog in ("cp", "mv"):
        pos = _positional(args)
        if len(pos) < 2:
            return None
        sources, dest = pos[:-1], pos[-1]
        into_dir = os.path.isdir(os.path.expanduser(dest)) or len(sources) > 1 or dest.endswith("/")
        targets = [os.path.join(dest, os.path.basename(s.rstrip("/"))) if into_dir else dest for s in sources]
        if prog == "cp":
            rec = "-r " if any(a in _RECURSIVE_FLAGS for a in args) else ""
            undo = f"rm {rec}{' '.join(targets)}"
        else:
            undo = " && ".join(f"mv {t} {s}" for s, t in zip(sources, targets))
        return {"kind": "file", "description": segment, "undo": undo}
    return None


def infer_from_bash(command: str) -> dict | None:
    """Leitet aus einem Shell-Befehl den Rückweg ab: {"kind","description","undo"} oder None."""
    for segment in _SEGMENT_SPLIT.split(command or ""):
        hit = _infer_segment(segment.strip())
        if hit:
            return hit
    return None


# --- Rückbau ausführen ------------------------------------------------------------------------
def undo(id: str, *, dry_run: bool = False) -> dict:
    """Führt den Rückweg eines Postens aus (Shell, Timeout 120 s). Status undone|undo_failed."""
    posten = _load().get(id)
    if posten is None:
        raise RollbackError(f"unbekannter Posten: {id}")
    if not posten.get("undo"):
        raise RollbackError(f"Posten {id} hat keinen Rückweg (needs_confirmation)")
    cmd = posten["undo"]
    if dry_run:
        bus.emit("rollback.undo", id=id, dry_run=True, undo=cmd)
        return {**posten, "dry_run": True, "would_run": cmd}
    exit_code: int | None
    error: str | None = None
    stderr_head = ""
    try:
        proc = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=UNDO_TIMEOUT)
        exit_code = proc.returncode
        stderr_head = (proc.stderr or "")[:300]
    except subprocess.TimeoutExpired:
        exit_code, error = None, f"timeout nach {UNDO_TIMEOUT}s"
    except OSError as exc:
        exit_code, error = None, str(exc)[:300]
    status = "undone" if exit_code == 0 else "undo_failed"
    if status == "undo_failed" and error is None:
        error = stderr_head or f"exit {exit_code}"
    at = paths.now_iso()
    _append({"op": "undo", "id": id, "at": at, "status": status, "exit": exit_code,
             "error": bus.mask(error) if error else None, "dry_run": False})
    bus.emit("rollback.undo", id=id, status=status, exit=exit_code, error=error, undo=cmd)
    return {**posten, "status": status, "undone_at": at, "undo_exit": exit_code, "undo_error": error,
            "dry_run": False}


def list_open() -> list[dict]:
    """Alle Posten mit Status open (auch die ohne Rückweg), zeitlich sortiert."""
    return sorted((p for p in _load().values() if p.get("status") == "open"),
                  key=lambda p: (p.get("at", ""), p.get("id", "")))


def quota() -> dict:
    """Die Rückbauquote: Anteil der registrierten Handlungen mit Rückweg."""
    posten = list(_load().values())
    registered = len(posten)
    with_undo = sum(1 for p in posten if p.get("undo"))
    q = {
        "registered": registered,
        "with_undo": with_undo,
        "without_undo": registered - with_undo,
        "undone_ok": sum(1 for p in posten if p.get("status") == "undone"),
        "undone_failed": sum(1 for p in posten if p.get("status") == "undo_failed"),
        "quote": (with_undo / registered) if registered else 0.0,
    }
    bus.emit("rollback.quota", **q)
    return q
