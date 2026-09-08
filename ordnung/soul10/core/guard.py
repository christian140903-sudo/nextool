"""Ausnahmeliste: sechs Vorab-Bremsen; alles andere ist frei und wird nur sichtbar gemacht.

Befund: Auflagen als Text kommen zu 97,8 % an, werden aber nur zu 63,9 % erfüllt (ENTSCHEIDUNG §1,
E7: −15,3 bis −34,4 pp) — eine Bremse gehört in Code, nicht in den Prompt; Widerrufbarkeit ist
messbar (03-OFFENE-FRAGEN Rang 5), darum hält der Guard nur, was kein Rückbau-Konto heilt.
Erz → Gold: /home/user/soul/core/guard.py (Kategorien, Regexe, classify, befristetes Mandat)
rechnete ROOT beim Import, trug OWN_REMOTES hartkodiert (Nutzername im Code) und legte das Mandat
unter watch/ im Repo ab. Hier: geschützte Dateien aus paths.soul10_root(), Mandat unter
paths.mandate_file() (Zustand, nie im Repo), eigene Remotes aus dem Profil (inventory.load_profile,
lazy, Rückfall ["origin"]), jeder Treffer als Bus-Zeile, fail-closed: ein Fehler in der Prüfung
blockiert.

Jede Kategorie prüft Ziel-Wirkung, nicht Werkzeug-Namen, so gut das mit Mustern geht. Ehrlich:
das ist eine Schwelle plus Stolperdraht, kein Käfig. Jeder Treffer wird geloggt, auch wenn ein
Mandat ihn durchlässt.

Mandat: state/mandate.json {"category": ..., "until_epoch": ...} erlaubt EINE Kategorie befristet
(grant_mandate). Damit sperrt sich das System nicht selbst aus, wenn es bewusst publizieren soll.
"""
from __future__ import annotations

import json
import re
import time
from pathlib import Path

from . import bus, paths

CATEGORIES = (
    "secrets-exfiltration",
    "extern-publizieren",
    "zahlungen",
    "remote-loeschung",
    "prod-aenderung",
    "soul-integritaet",
)

DEFAULT_OWN_REMOTES = ("origin",)
LOCAL_HOSTS = ("localhost", "127.0.0.1", "0.0.0.0", "[::1]")

# --- Muster (aus SOUL übernommen) -------------------------------------------------------------
_SECRET_SRC = re.compile(
    r"(~/\.ssh|\.ssh/id_|id_rsa|id_ed25519|~/\.aws|\.aws/credentials"
    r"|~/\.config/gcloud|\.env\b|\.zshenv|\.zshrc.*KEY"
    r"|AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9_\-]{20}|ghp_[A-Za-z0-9]{20}"
    r"|xox[bpars]-|BEGIN (RSA|OPENSSH|EC) PRIVATE KEY)",
    re.IGNORECASE,
)
_EXFIL_VERB = re.compile(r"\b(curl|wget|nc|ncat|scp|rsync|sftp)\b")

_PUBLISH = re.compile(
    r"(\bnpm\s+publish\b|\bpnpm\s+publish\b|\byarn\s+publish\b"
    r"|\btwine\s+upload\b|\bpip\s+upload\b|\bgem\s+push\b"
    r"|\bdocker\s+push\b|\bgh\s+release\s+create\b"
    r"|\bgh\s+pr\s+create\b.*--repo\s+"
    r"|\bcargo\s+publish\b)",
)
# `git push <ziel …>`: ob das Ziel eigen ist, entscheidet _is_own_push über das Profil.
_PUSH_WITH_TARGET = re.compile(r"\bgit\s+push\b\s+\S+")
_HTTP_WRITE = re.compile(
    r"\b(curl|wget)\b[^|;&]*\s(-d\b|--data\b|-F\b|--form\b|-T\b|--upload-file\b"
    r"|-X\s*(POST|PUT|PATCH)\b)",
    re.IGNORECASE,
)
_WEBHOOK_HOSTS = re.compile(
    r"(hooks\.slack\.com|discord(app)?\.com/api/webhooks|api\.telegram\.org)",
    re.IGNORECASE,
)

_PAYMENT = re.compile(
    r"(api\.stripe\.com|api\.paypal\.com|api\.braintreegateway\.com"
    r"|\bstripe\b(?!\s+(listen|login|logs|trigger|samples|help))"
    r"|\bbitcoin-cli\b.*\bsend"
    r"|api\.coinbase\.com)",
    re.IGNORECASE,
)

_REMOTE_DELETE = re.compile(
    r"(\bgh\s+repo\s+delete\b"
    r"|\bnpm\s+unpublish\b|\bpnpm\s+unpublish\b|\byarn\s+unpublish\b"
    r"|\baws\s+s3\s+(rm\b.*--recursive|rb\b)"
    r"|\bgsutil\s+(-m\s+)?rm\b|\bs3cmd\s+(del|rm|rb)\b"
    r"|\brclone\s+(delete|purge)\b"
    r"|\b(gcloud|az)\s+\S+.*\bdelete\b"
    r"|\bgit\s+push\b.*(--delete|--force)\b"
    r"|DROP\s+DATABASE|DELETE\s+FROM\s+\w+\s*;)",
    re.IGNORECASE,
)

_PROD = re.compile(
    r"(\bvercel\b.*--prod\b|\bnetlify\s+deploy\b.*--prod\b"
    r"|\bterraform\s+(apply|destroy)\b"
    r"|\bkubectl\s+(apply|delete)\b.*(--context|--cluster)\s*=?\s*\S*prod"
    r"|\bssh\s+\S*prod\S*\b"
    r"|\bgh\s+workflow\s+run\b.*prod)",
    re.IGNORECASE,
)

# Stolperdraht für Shell-Schreibzugriffe auf die Wache selbst.
_SHELL_WRITE_VERB = re.compile(r"(>|>>|\bsed\s+-i|\btee\b|\bmv\b|\bcp\b|\brm\b|\bchmod\b)")
_SHELL_GUARD_FILES = re.compile(
    r"(core/guard\.py|core/events\.py|\.claude/hooks/|\.claude/settings\.json|state/mandate\.json)"
)


# --- Selbstschutz: die Dateien, die die Wache selbst tragen ------------------------------------
# EXAKTE absolute Pfade bzw. Verzeichnis-Präfixe mit Trenner — nie Substrings (die Substring-
# Falle hat im build-starter-v2 den einzigen echten Lauf getötet). Alles lazy, weil soul10_root
# und mandate_file erst zur Laufzeit feststehen (Tests setzen SOUL10_HOME).
_PROTECTED_REL_FILES = ("core/guard.py", "core/events.py", ".claude/settings.json")
_PROTECTED_REL_DIRS = (".claude/hooks",)


def _resolved(p: Path) -> str:
    try:
        return str(p.expanduser().resolve())
    except (OSError, ValueError):
        return str(p)


def protected_files() -> frozenset[str]:
    """Absolute Pfade der Dateien, die nur mit Mandat 'soul-integritaet' geändert werden."""
    root = paths.soul10_root()
    files = {_resolved(root / rel) for rel in _PROTECTED_REL_FILES}
    files.add(_resolved(paths.mandate_file()))
    return frozenset(files)


def protected_dirs() -> tuple[str, ...]:
    """Verzeichnis-Präfixe (mit Trenner) unter demselben Schutz."""
    root = paths.soul10_root()
    return tuple(_resolved(root / rel) + "/" for rel in _PROTECTED_REL_DIRS)


def _is_protected_path(raw: str) -> bool:
    if not raw:
        return False
    try:
        resolved = str(Path(raw).expanduser().resolve())
    except (OSError, ValueError):
        return False
    return resolved in protected_files() or any(resolved.startswith(d) for d in protected_dirs())


# --- eigene Remotes aus dem Profil --------------------------------------------------------------
def own_remotes() -> list[str]:
    """Remotes, auf die ein Push immer erlaubt ist — aus profile.json (own_remotes), sonst ['origin']."""
    try:
        from . import inventory  # lazy: das Profil ist Zustand, kein Importzeit-Wissen
        profile = inventory.load_profile()
    except ImportError:
        profile = None
    remotes = (profile or {}).get("own_remotes") if isinstance(profile, dict) else None
    out = [r.strip() for r in (remotes or []) if isinstance(r, str) and r.strip()]
    return out or list(DEFAULT_OWN_REMOTES)


def _is_local_target(cmd: str) -> bool:
    hit = re.search(r"https?://([^/\s:]+)", cmd)
    return bool(hit) and hit.group(1) in LOCAL_HOSTS


def _is_own_push(cmd: str) -> bool:
    return bool(re.search(r"\bgit\s+push\b", cmd)) and any(r in cmd for r in own_remotes())


def _mentions_mandate_file(cmd: str) -> bool:
    return _resolved(paths.mandate_file()) in cmd


# --- Einstufung -----------------------------------------------------------------------------------
def classify(tool_name: str, tool_input: dict) -> tuple[str, str] | None:
    """Liefert (kategorie, grund) oder None. Liest nur das Profil (eigene Remotes), sonst rein."""
    tool_input = tool_input or {}
    if tool_name in ("Write", "Edit", "NotebookEdit", "MultiEdit"):
        if _is_protected_path(str(tool_input.get("file_path", "") or tool_input.get("notebook_path", ""))):
            return (
                "soul-integritaet",
                "Aenderung an der Wache selbst (guard/events/hooks/settings/mandate)",
            )
        return None

    if tool_name == "Bash":
        cmd = str(tool_input.get("command", ""))
    elif tool_name in ("WebFetch", "WebSearch"):
        cmd = json.dumps(tool_input, ensure_ascii=False)
    elif tool_name.startswith("mcp__"):
        cmd = json.dumps(tool_input, ensure_ascii=False)
    else:
        return None

    if tool_name == "Bash":
        if _SHELL_WRITE_VERB.search(cmd) and (_SHELL_GUARD_FILES.search(cmd) or _mentions_mandate_file(cmd)):
            return ("soul-integritaet", "Shell-Schreibzugriff auf die Wache selbst")

    if _SECRET_SRC.search(cmd) and _EXFIL_VERB.search(cmd):
        # Ziel absichtlich egal — auch localhost zählt (Drill-Erkenntnis aus SOUL).
        return ("secrets-exfiltration", "Secret-Quelle kombiniert mit Netz-Werkzeug")

    if not _is_own_push(cmd):
        if _PUBLISH.search(cmd):
            return ("extern-publizieren", "Publish-Kommando auf externes Ziel")
        if _PUSH_WITH_TARGET.search(cmd):
            return ("extern-publizieren", "git push auf fremdes Remote")
        if _WEBHOOK_HOSTS.search(cmd):
            return ("extern-publizieren", "bekannter Webhook-Host")
        if _HTTP_WRITE.search(cmd) and not _is_local_target(cmd):
            return ("extern-publizieren", "HTTP-Schreibzugriff auf Nicht-lokal-Ziel")

    if _PAYMENT.search(cmd):
        return ("zahlungen", "Zahlungs-API oder -CLI")

    if _REMOTE_DELETE.search(cmd) and not _is_own_push(cmd):
        return ("remote-loeschung", "irreversibles Loeschen auf entferntem Ziel")

    if _PROD.search(cmd):
        return ("prod-aenderung", "Produktions-Deployment oder -Zugriff")

    return None


# --- Mandat ---------------------------------------------------------------------------------------
def active_mandate() -> str | None:
    """Die eine befristet erlaubte Kategorie, oder None (auch bei fehlender/kaputter Datei)."""
    try:
        data = json.loads(paths.mandate_file().read_text(encoding="utf-8"))
        if float(data.get("until_epoch", 0)) > time.time():
            cat = data.get("category")
            return cat if cat in CATEGORIES else None
    except (OSError, ValueError, AttributeError, TypeError):
        pass
    return None


def grant_mandate(category: str, minutes: int) -> dict:
    """Erlaubt EINE Kategorie für `minutes` Minuten; schreibt state/mandate.json; Bus-Zeile."""
    if category not in CATEGORIES:
        raise ValueError(f"unbekannte Kategorie: {category}")
    minutes = int(minutes)
    if minutes <= 0:
        raise ValueError("Mandat braucht eine Frist > 0 Minuten")
    target = paths.mandate_file()
    target.parent.mkdir(parents=True, exist_ok=True)
    data = {
        "category": category,
        "until_epoch": time.time() + minutes * 60,
        "granted_at": paths.now_iso(),
        "minutes": minutes,
    }
    target.write_text(json.dumps(data, indent=2), encoding="utf-8")
    bus.emit("guard.mandate", category=category, minutes=minutes, until_epoch=data["until_epoch"])
    return data


def revoke_mandate() -> bool:
    """Beendet das Mandat vorzeitig (Datei wird geleert, nicht gelöscht: der Vorgang bleibt sichtbar)."""
    target = paths.mandate_file()
    hatte = active_mandate()
    try:
        target.write_text(json.dumps({"category": None, "until_epoch": 0,
                                      "revoked_at": paths.now_iso()}, indent=2), encoding="utf-8")
    except OSError:
        return False
    bus.emit("guard.mandate_revoked", category=hatte)
    return hatte is not None


# --- Entscheidung für den Hook: fail-closed -----------------------------------------------------
def decide(tool_name: str, tool_input: dict) -> dict:
    """classify + Mandat in einer Entscheidung: {"blocked", "category", "reason", "mandate"}.

    Ein Fehler in der Prüfung selbst blockiert (fail-closed, ARCHITEKTUR §2 Regel 5) und wird als
    Kategorie "guard-fehler" gemeldet. Jeder Treffer schreibt eine Bus-Zeile, auch mit Mandat.
    """
    try:
        hit = classify(tool_name, tool_input)
    except Exception as exc:  # noqa: BLE001 — jeder Fehler wird zur Sperre, nie zum Durchlass
        out = {"blocked": True, "category": "guard-fehler",
               "reason": f"Pruefung fehlgeschlagen: {str(exc)[:200]}", "mandate": None}
        bus.emit("guard.error", tool=tool_name, error=str(exc)[:200])
        return out
    if hit is None:
        return {"blocked": False, "category": None, "reason": "", "mandate": None}
    category, reason = hit
    mandate = active_mandate()
    blocked = mandate != category
    bus.emit("guard.hit", tool=tool_name, category=category, reason=reason,
             blocked=blocked, mandate=mandate)
    return {"blocked": blocked, "category": category, "reason": reason, "mandate": mandate}
