"""Ereignis-Bus: eine Wahrheit für alle Ebenen, als JSONL, maskiert, rotierend.

Befund: „Kontrolle läuft über Sichtbarkeit, nicht über Erlaubnis" (06-AUFTRAG §2);
ein Mechanismus ohne Log gilt als nicht gebaut (Kontextpaket §2).
Erz → Gold: SOUL core/events.py schrieb Ereignisse mit Uhrzeit und Flaggen, aber nur aus
Hooks. Hier schreibt JEDES Modul auf denselben Bus (bus.emit), Fremdprozesse eingeschlossen.
Fail-open: ein kaputtes Log darf die Arbeit nie anhalten.
"""
from __future__ import annotations

import json
import re
import time
from pathlib import Path

from . import paths

_SECRET_MASK = re.compile(
    r"(AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9_\-]{20,}|ghp_[A-Za-z0-9]{20,}"
    r"|xox[bpars]-[A-Za-z0-9\-]+|eyJ[A-Za-z0-9_\-]{20,})"
)
_ROTATE_BYTES = 5 * 1024 * 1024


def mask(text: str) -> str:
    return _SECRET_MASK.sub("[MASKIERT]", text)


def _maskiere(obj):
    if isinstance(obj, str):
        return mask(obj)
    if isinstance(obj, dict):
        return {k: _maskiere(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_maskiere(v) for v in obj]
    return obj


def emit(event: str, **fields) -> None:
    """Eine Zeile auf den Bus. Nie eine Exception nach außen."""
    try:
        target: Path = paths.bus_file()
        try:
            if target.stat().st_size > _ROTATE_BYTES:
                target.rename(target.with_name(
                    f"events-{time.strftime('%Y%m%d-%H%M%S', time.gmtime())}.jsonl"))
        except FileNotFoundError:
            pass
        record = {"ts": paths.now_iso(), "event": event}
        record.update(_maskiere(fields))
        with target.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(record, ensure_ascii=False, default=str) + "\n")
    except Exception:
        pass


def tail(n: int = 50) -> list[dict]:
    try:
        lines = paths.bus_file().read_text(encoding="utf-8").splitlines()
    except OSError:
        return []
    out = []
    for line in lines[-n:]:
        try:
            out.append(json.loads(line))
        except ValueError:
            continue
    return out
