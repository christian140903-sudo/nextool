"""Rückbau-Konto: jede Handlung mit Außenwirkung trägt ihren Rückweg; die Quote ist eine Zahl.

Befund: Widerrufbarkeit ist messbar, „hätte der Nutzer eingegriffen" nicht — Rückbauquote
als Zahl statt Rückfrage (bewusstsein/uebergabe/03-OFFENE-FRAGEN.md Rang 5; 06-AUFTRAG §6.6:
Handlungen ohne Rückweg sind die einzigen, die eine Bestätigung brauchen).
Erz → Gold: Soul 5.0 N2 („Zurückgezogenes wird nie weitergetragen") war ein Prinzip in Prosa,
SOUL protokollierte Werkzeugaufrufe, aber keinen Rückweg. Hier: ein append-only Konto
(state/rollback.jsonl) mit Rückbaubefehl je Posten, Sicherungskopie vor Dateiänderungen,
Ableitung des Rückwegs aus Shell-Befehlen, Ausführung des Rückbaus mit Status und die Quote
with_undo/registered.

Der Rückweg ist eine Argumentliste, keine Shell (adversariale Prüfung, ABNAHME §6): `undo` wird
mit shlex.join gebaut und mit shlex.split ohne Shell ausgeführt; `&&` und `;` zwischen Gliedern
sind Folgen, alles andere (Pipes, Umleitungen, $VAR, Backticks) ist ein Literal. Ein Paketname
oder Pfad mit Shell-Metazeichen kann so nichts ausführen. Dateisystem-Rückwege sind Python-
Einzeiler unter dem laufenden Interpreter (plattformneutral). Wer ein bestehendes Ziel
überschreiben würde (cp/mv), bekommt keinen erfundenen Rückweg: register_from_bash sichert das
Ziel als Sicherungskopie oder trägt den Posten mit Bestätigungspflicht ein.

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
import sys
from pathlib import Path

from . import bus, paths


class RollbackError(ValueError):
    """Ungültige Art, unbekannter Posten oder Posten ohne Rückweg — nichts wird ausgeführt."""


KINDS = ("install", "file", "config", "git", "command", "other")
STATUS = ("open", "undone", "undo_failed")
UNDO_TIMEOUT = 120
# Der Interpreter, der Soul 10 ausführt — auf Windows heißt er selten `python3`.
PY = sys.executable or "python3"
# Glieder einer Rückweg-Kette (nur diese zwei Trenner; eine Shell gibt es nicht).
_CHAIN_SEPARATORS = ("&&", ";")

_ENV_ASSIGN = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*=")
_PIP_SPEC_END = re.compile(r"[=<>!~\[;@]")
_APT_SPEC_END = re.compile(r"[=/]")
_NPM_NAME = re.compile(r"^(@[^/@]+/[^@]+|[^@]+)")
_RECURSIVE_FLAGS = ("-r", "-R", "-a", "--recursive", "-rf", "-fr", "-Rf", "-fR")
# Paketnamen, für die ein Rückweg gebaut wird; alles andere bekommt keinen (Bestätigung).
_PKG_NAME = re.compile(r"^[A-Za-z0-9@][A-Za-z0-9._+@/-]*$")
# Pfade mit diesen Zeichen bekommen keinen abgeleiteten Rückweg — sie sind selten und ein
# Rückweg, der einen Glob oder eine Variable wörtlich nimmt, wäre ein anderer Rückweg.
_PATH_FORBIDDEN = re.compile(r"[*?\[\]{}$`\n\r]")


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
    if undo is not None:
        argv_chain(undo)  # ein Rückweg, der sich nicht als Argumentliste lesen lässt, ist keiner
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
    das ist die einzige Klasse von Handlungen, die eine Bestätigung braucht.
    `undo` ist eine Argumentliste in Shell-Schreibweise (shlex), Glieder mit `&&` oder `;`;
    ein unlesbarer Rückweg (offene Anführungszeichen) wird abgelehnt."""
    return _register(paths.new_id(), kind, description, undo=undo, evidence=evidence,
                     contract_id=contract_id)


# --- Rückweg als Argumentliste ----------------------------------------------------------------
def argv_chain(cmd: str) -> list[list[str]]:
    """Ein Rückweg-String → Folge von Argumentlisten. Kein Glied ist leer; nichts wird an eine
    Shell gegeben. Unlesbar (offene Quotes) → RollbackError."""
    try:
        tokens = shlex.split(cmd or "", posix=True)
    except ValueError as exc:
        raise RollbackError(f"Rückweg nicht lesbar: {exc}") from exc
    chain: list[list[str]] = []
    current: list[str] = []
    for t in tokens:
        if t in _CHAIN_SEPARATORS:
            if current:
                chain.append(current)
            current = []
        else:
            current.append(t)
    if current:
        chain.append(current)
    if not chain:
        raise RollbackError("Rückweg ist leer")
    return chain


def _python_command(code: str) -> str:
    """`<Interpreter> -c <code>` als Argumentliste in Shell-Schreibweise — läuft ohne Shell auf
    jeder Plattform, auf der dieser Interpreter läuft."""
    return shlex.join([PY, "-c", code])


def _remove_command(targets: list[str], *, recursive: bool) -> str:
    """Löscht erzeugte Pfade: Dateien und Links per os.remove, Verzeichnisse (nur mit
    recursive) per shutil.rmtree; Fehlendes ist kein Fehler (der Rückweg ist idempotent)."""
    code = ("import os, shutil\n"
            f"for p in {targets!r}:\n"
            "    if os.path.islink(p) or os.path.isfile(p):\n"
            "        os.remove(p)\n"
            + ("    elif os.path.isdir(p):\n        shutil.rmtree(p)\n" if recursive else
               "    elif os.path.isdir(p):\n        raise SystemExit(f'Verzeichnis nicht angelegt von cp ohne -r: {p}')\n"))
    return _python_command(code)


def _move_back_command(pairs: list[tuple[str, str]]) -> str:
    code = "import shutil\n" + "".join(f"shutil.move({t!r}, {s!r})\n" for s, t in pairs)
    return _python_command(code)


def _rmdir_command(dirs: list[str]) -> str:
    """Entfernt genau die angelegten Ebenen, tiefste zuerst; nur leere Verzeichnisse."""
    code = "import os\n" + "".join(f"os.rmdir({d!r})\n" for d in dirs)
    return _python_command(code)


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
def split_segments(command: str) -> list[str]:
    """Befehlsketten quote-bewusst an && || ; | und Zeilenende trennen: ein `;` oder `|` in
    einem gequoteten Argument zerreißt nichts. Die Glieder bleiben Rohtext (für description)."""
    segments: list[str] = []
    current: list[str] = []
    quote: str | None = None
    i, n = 0, len(command or "")
    while i < n:
        ch = command[i]
        if quote:
            current.append(ch)
            if ch == "\\" and quote == '"' and i + 1 < n:
                current.append(command[i + 1])
                i += 1
            elif ch == quote:
                quote = None
        elif ch in ("'", '"'):
            quote = ch
            current.append(ch)
        elif ch == "\\" and i + 1 < n:
            current.append(ch)
            current.append(command[i + 1])
            i += 1
        elif command.startswith(("&&", "||"), i):
            segments.append("".join(current))
            current = []
            i += 1
        elif ch in (";", "|", "\n"):
            segments.append("".join(current))
            current = []
        else:
            current.append(ch)
        i += 1
    segments.append("".join(current))
    return [s.strip() for s in segments if s.strip()]


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


def _clean_names(names: list[str]) -> list[str] | None:
    """Nur wohlgeformte Paketnamen bekommen einen Rückweg; ein Name mit Metazeichen keinen."""
    if not names or not all(_PKG_NAME.match(n) for n in names):
        return None
    return names


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
    return _clean_names(pkgs)


def _npm_packages(args: list[str]) -> list[str] | None:
    pkgs = []
    for a in _positional(args):
        if a.startswith((".", "/", "~", "http://", "https://", "file:", "git+", "github:")):
            return None
        m = _NPM_NAME.match(a)
        if m and m.group(1):
            pkgs.append(m.group(1))
    return _clean_names(pkgs)


def _install_result(description: str, undo_argv: list[str]) -> dict:
    return {"kind": "install", "description": description, "undo": shlex.join(undo_argv)}


def _chain(argvs: list[list[str]]) -> str:
    return " && ".join(shlex.join(a) for a in argvs)


def _clean_paths(items: list[str]) -> list[str] | None:
    if not items or any(_PATH_FORBIDDEN.search(p) for p in items):
        return None
    return items


def _new_levels(directory: str) -> list[str]:
    """Die Ebenen, die `mkdir -p directory` anlegen würde, tiefste zuerst; leer, wenn alles da ist."""
    levels: list[str] = []
    p = Path(os.path.expanduser(directory))
    while not p.exists() and str(p) not in ("", ".", "/") and p != p.parent:
        levels.append(str(p))
        p = p.parent
    return levels


def _infer_segment(segment: str) -> dict | None:
    if not segment:
        return None
    try:
        tokens = shlex.split(segment, posix=True)
    except ValueError:
        return None  # offene Anführungszeichen: die Shell selbst würde nachfragen; kein Rückweg
    tokens, sudo = _strip_prefixes(tokens)
    if not tokens:
        return None
    prog, args = tokens[0], tokens[1:]
    prefix = ["sudo"] if sudo else []

    # python3 -m pip install X  →  wie pip
    prog_argv = [prog]
    if prog in ("python", "python3", "py") and args[:2] == ["-m", "pip"]:
        prog_argv, args = [prog, "-m", "pip"], args[2:]
        prog = "pip"

    # --- Installationen ---
    if prog in ("pip", "pip3") and args[:1] == ["install"]:
        pkgs = _pip_packages(args[1:])
        return _install_result(segment, prefix + prog_argv + ["uninstall", "-y", *pkgs]) if pkgs else None
    if prog == "pipx" and args[:1] == ["install"]:
        pkgs = _pip_packages(args[1:])
        return {"kind": "install", "description": segment,
                "undo": _chain([["pipx", "uninstall", p] for p in pkgs])} if pkgs else None
    if prog == "uv":
        if args[:2] == ["pip", "install"]:
            pkgs = _pip_packages(args[2:])
            return _install_result(segment, ["uv", "pip", "uninstall", *pkgs]) if pkgs else None
        if args[:2] == ["tool", "install"]:
            pkgs = _pip_packages(args[2:])
            return {"kind": "install", "description": segment,
                    "undo": _chain([["uv", "tool", "uninstall", p] for p in pkgs])} if pkgs else None
        if args[:1] == ["add"]:
            pkgs = _pip_packages(args[1:])
            return _install_result(segment, ["uv", "remove", *pkgs]) if pkgs else None
        return None
    if prog == "npm" and args[:1] and args[0] in ("install", "i", "add"):
        pkgs = _npm_packages(args[1:])
        if not pkgs:
            return None
        scope = ["-g"] if any(a in ("-g", "--global") for a in args) else []
        return _install_result(segment, prefix + ["npm", "uninstall", *scope, *pkgs])
    if prog == "pnpm" and args[:1] and args[0] in ("add", "install", "i"):
        pkgs = _npm_packages(args[1:])
        if not pkgs:
            return None
        scope = ["-g"] if any(a in ("-g", "--global") for a in args) else []
        return _install_result(segment, prefix + ["pnpm", "remove", *scope, *pkgs])
    if prog == "yarn":
        if args[:1] == ["add"]:
            pkgs = _npm_packages(args[1:])
            return _install_result(segment, ["yarn", "remove", *pkgs]) if pkgs else None
        if args[:2] == ["global", "add"]:
            pkgs = _npm_packages(args[2:])
            return _install_result(segment, ["yarn", "global", "remove", *pkgs]) if pkgs else None
        return None
    if prog in ("apt-get", "apt") and args[:1] == ["install"]:
        pkgs = _clean_names([p for p in (_APT_SPEC_END.split(a, 1)[0] for a in _positional(args[1:])) if p])
        return _install_result(segment, prefix + [prog, "remove", "-y", *pkgs]) if pkgs else None
    if prog == "brew" and args[:1] == ["install"]:
        pkgs = _clean_names(_positional(args[1:]))
        if not pkgs:
            return None
        cask = ["--cask"] if "--cask" in args else []
        return _install_result(segment, ["brew", "uninstall", *cask, *pkgs])
    if prog == "cargo" and args[:1] == ["install"]:
        pkgs = _clean_names(_positional(args[1:]))
        return _install_result(segment, ["cargo", "uninstall", *pkgs]) if pkgs else None

    # --- Git ---
    if prog == "git" and args[:1] == ["commit"]:
        return {"kind": "git", "description": segment, "undo": "git revert --no-edit HEAD"}

    # --- Dateisystem: Rückwege als Python-Einzeiler, plattformneutral ---
    if prog == "mkdir":
        dirs = _clean_paths(_positional(args))
        if not dirs:
            return None
        if any(a in ("-p", "--parents") for a in args):
            levels = [lvl for d in dirs for lvl in _new_levels(d)]
        else:
            levels = [d for d in dirs if not os.path.exists(os.path.expanduser(d))]
        if not levels:
            return None  # es entsteht nichts, also gibt es nichts zurückzubauen
        return {"kind": "file", "description": segment, "undo": _rmdir_command(levels)}
    if prog in ("cp", "mv"):
        pos = _clean_paths(_positional(args))
        if not pos or len(pos) < 2:
            return None
        sources, dest = pos[:-1], pos[-1]
        into_dir = os.path.isdir(os.path.expanduser(dest)) or len(sources) > 1 or dest.endswith("/")
        targets = [os.path.join(dest, os.path.basename(s.rstrip("/"))) if into_dir else dest for s in sources]
        existing = [t for t in targets if os.path.lexists(os.path.expanduser(t))]
        if existing:
            # Das Ziel gibt es schon: „rm Ziel" oder „mv zurück" wäre kein Rückweg, sondern der
            # Verlust des Vorzustands. register_from_bash sichert es oder verlangt Bestätigung.
            return {"kind": "file", "description": segment, "undo": None, "overwrites": existing}
        if prog == "cp":
            recursive = any(a in _RECURSIVE_FLAGS for a in args)
            return {"kind": "file", "description": segment, "undo": _remove_command(targets, recursive=recursive)}
        return {"kind": "file", "description": segment, "undo": _move_back_command(list(zip(sources, targets)))}
    return None


def infer_from_bash(command: str) -> dict | None:
    """Leitet aus einem Shell-Befehl den Rückweg ab: {"kind","description","undo"} oder None.
    Trägt der Befehl ein bestehendes Ziel ab (cp/mv), kommt "overwrites": [pfade] statt eines
    erfundenen Rückwegs (undo None)."""
    for segment in split_segments(command or ""):
        hit = _infer_segment(segment)
        if hit:
            return hit
    return None


def register_from_bash(command: str, *, evidence: dict | None = None,
                       contract_id: str | None = None) -> dict | None:
    """Der Weg des pre-tool-Hooks: Rückweg ableiten und eintragen. Überschreibt der Befehl eine
    bestehende Datei, wird sie vorher als Sicherungskopie gesichert (echter Rückweg, byte-genau);
    ein bestehendes Verzeichnis bekommt einen Posten mit Bestätigungspflicht. Nichts ableitbar → None."""
    hit = infer_from_bash(command)
    if not hit:
        return None
    ueberschrieben = hit.get("overwrites") or []
    if not ueberschrieben:
        return register(hit["kind"], hit["description"], undo=hit["undo"], evidence=evidence,
                        contract_id=contract_id)
    posten = None
    for ziel in ueberschrieben:
        pfad = Path(os.path.expanduser(ziel))
        if pfad.is_file() and not pfad.is_symlink():
            p = snapshot_file(str(pfad), contract_id=contract_id)
        else:
            p = register("file", f"{hit['description']} — überschreibt {ziel} ohne Sicherung",
                         undo=None, evidence=dict(evidence or {}, overwrites=ziel), contract_id=contract_id)
        posten = posten or p
    return posten


# --- Rückbau ausführen ------------------------------------------------------------------------
def _run_chain(chain: list[list[str]]) -> tuple[int | None, str | None, str]:
    """Führt die Glieder nacheinander ohne Shell aus; das erste Glied ≠ 0 beendet die Kette."""
    exit_code: int | None = 0
    stderr_head = ""
    for argv in chain:
        try:
            proc = subprocess.run(argv, shell=False, capture_output=True, text=True, timeout=UNDO_TIMEOUT)
        except subprocess.TimeoutExpired:
            return None, f"timeout nach {UNDO_TIMEOUT}s", ""
        except OSError as exc:
            return None, str(exc)[:300], ""
        exit_code = proc.returncode
        stderr_head = (proc.stderr or "")[:300]
        if exit_code != 0:
            break
    return exit_code, None, stderr_head


def undo(id: str, *, dry_run: bool = False) -> dict:
    """Führt den Rückweg eines Postens aus — als Argumentliste(n), ohne Shell, Timeout 120 s je
    Glied. Status undone|undo_failed."""
    posten = _load().get(id)
    if posten is None:
        raise RollbackError(f"unbekannter Posten: {id}")
    if not posten.get("undo"):
        raise RollbackError(f"Posten {id} hat keinen Rückweg (needs_confirmation)")
    cmd = posten["undo"]
    chain = argv_chain(cmd)
    if dry_run:
        bus.emit("rollback.undo", id=id, dry_run=True, undo=cmd)
        return {**posten, "dry_run": True, "would_run": cmd, "argv": chain}
    exit_code, error, stderr_head = _run_chain(chain)
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
    """Alle Posten mit Status open (auch die ohne Rückweg), in Reihenfolge der Registrierung
    (die Dateireihenfolge des Kontos ist die Zeitachse — genauer als Sekunden-Zeitstempel)."""
    return [p for p in _load().values() if p.get("status") == "open"]


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
