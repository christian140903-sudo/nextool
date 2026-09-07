"""Pfade, IDs, Zeit — alles lazy, damit Tests SOUL10_HOME setzen können.

Zustand liegt NIE im Repo, sondern unter SOUL10_HOME (Standard ~/.soul10).
Kein Modul darf Pfade beim Import berechnen; deshalb hier nur Funktionen.
"""
from __future__ import annotations

import hashlib
import os
import secrets
import time
from pathlib import Path

_SUBDIRS = ("state", "state/contracts", "state/receipts", "inbox", "rollback", "watch")


def home() -> Path:
    root = Path(os.environ.get("SOUL10_HOME") or (Path.home() / ".soul10")).expanduser()
    for sub in _SUBDIRS:
        (root / sub).mkdir(parents=True, exist_ok=True)
    return root


def db() -> Path:
    return home() / "memory.db"


def ledger_file() -> Path:
    return home() / "ledger.jsonl"


def bus_file() -> Path:
    return home() / "watch" / "events.jsonl"


def routing_file() -> Path:
    return home() / "watch" / "routing.jsonl"


def rollback_file() -> Path:
    return home() / "state" / "rollback.jsonl"


def profile_file() -> Path:
    return home() / "profile.json"


def snapshot_file() -> Path:
    return home() / "state" / "snapshot.json"


def mandate_file() -> Path:
    return home() / "state" / "mandate.json"


def contracts_dir() -> Path:
    return home() / "state" / "contracts"


def receipts_dir() -> Path:
    return home() / "state" / "receipts"


def inbox_dir() -> Path:
    return home() / "inbox"


def rollback_dir() -> Path:
    return home() / "rollback"


def soul10_root() -> Path:
    """Das Verzeichnis ordnung/soul10 im Repo (Ort des Codes, nicht des Zustands)."""
    return Path(__file__).resolve().parent.parent


def repo_root() -> Path:
    """Das nextool-Repo; Tests lesen von hier die Prüfstrecke unter bewusstsein/."""
    return soul10_root().parent.parent


def now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def today() -> str:
    return time.strftime("%Y-%m-%d", time.gmtime())


def new_id(prefix: str = "") -> str:
    """Zeitlich sortierbar: Millisekunden seit Epoche (13-stellig) + 6 Hex-Zeichen."""
    stamp = f"{int(time.time() * 1000):013d}-{secrets.token_hex(3)}"
    return f"{prefix}{stamp}" if prefix else stamp


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()
