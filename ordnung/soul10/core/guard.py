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
Mandat ihn durchlässt. Nach der adversarialen Prüfung (ABNAHME §6): das Ziel von `git push` wird
aus den Argumenten gelesen und exakt mit den eigenen Remotes verglichen (kein Substring — „origin"
als Branchname oder Teil eines fremden Remote-Namens gibt nichts frei); ein eigener Push befreit
kein anderes Publish-Kommando in derselben Zeile; der Stolperdraht für Shell-Schreibzugriffe auf
die Wache löst jedes Token als Pfad gegen das mitgeführte cd-Verzeichnis auf (exakt, kein
Substring), auch Pfade in Inline-Code (python -c, perl -e, Heredoc) — was er nicht fängt: Pfade aus Variablen, Globs oder
zur Laufzeit gebaute Strings; und eine Schlüssel-Variable ($…KEY, $…TOKEN, $…SECRET) in der
Ziel-URL eines Netz-Werkzeugs zählt als Exfiltration, im Header nicht (das ist der normale
API-Aufruf).

Nach der Schlussprüfung: eingestuft wird Glied für Glied (rollback.split_segments), auch bei
remote-loeschung — ein eigener Push davor machte `gh repo delete` sonst frei. Der Stolperdraht
überspringt Optionen nach `cd` (`cd -P .`) und misst jeden RELATIVEN Pfad zusätzlich an seinen
Pfadgliedern, weil der Hook-Prozess nicht dort stehen muss, wo die Shell steht; ein cd-Ziel, das
sich nicht auflösen lässt, zieht die Prüfung enger, nicht weiter (fail-closed, §2 Regel 5). Das
Arbeitsverzeichnis nimmt classify(..., cwd=…) aus der Hook-Nutzlast entgegen. Inline-Code sperrt
nur mit Schreibhinweis im Code; reines Lesen der Wache bleibt frei und steht als guard.lesezugriff
am Bus. profile.json ist geschützt wie die Mandatsdatei: own_remotes ist der Anker der exakten
Push-Prüfung, und eine abweichende Liste schreibt eine Bus-Zeile (guard.own_remotes).

Mandat: state/mandate.json {"category": ..., "until_epoch": ...} erlaubt EINE Kategorie befristet
(grant_mandate). Damit sperrt sich das System nicht selbst aus, wenn es bewusst publizieren soll.
"""
from __future__ import annotations

import json
import os
import re
import shlex
import time
from pathlib import Path, PurePosixPath

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
# Eine Variable, deren Name nach Schlüssel klingt, in einer URL: $GITHUB_TOKEN, ${AWS_SECRET_ACCESS_KEY}.
_ENV_SECRET_REF = re.compile(
    r"\$\{?[A-Za-z0-9_]*(KEY|TOKEN|SECRET|PASSWORD|PASSWD|CREDENTIALS?)[A-Za-z0-9_]*\}?", re.IGNORECASE)
_URL = re.compile(r"[a-z][a-z0-9+.\-]*://[^\s'\"]+", re.IGNORECASE)

_PUBLISH = re.compile(
    r"(\bnpm\s+publish\b|\bpnpm\s+publish\b|\byarn\s+publish\b"
    r"|\btwine\s+upload\b|\bpip\s+upload\b|\bgem\s+push\b"
    r"|\bdocker\s+push\b|\bgh\s+release\s+create\b"
    r"|\bgh\s+pr\s+create\b.*--repo\s+"
    r"|\bcargo\s+publish\b)",
)
# `git push …`: das Ziel liest push_targets aus den Argumenten; ob es eigen ist, entscheidet das Profil.
_PUSH_SEGMENT = re.compile(r"\bgit\s+push\b([^|;&\n]*)")
# Optionen von git push, die ein eigenes Argument tragen (das Argument ist kein Remote).
_PUSH_VALUE_OPTS = ("-o", "--push-option", "--receive-pack", "--exec")
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
_SHELL_WRITE_VERB = re.compile(r"(>|>>|\bsed\s+-i|\btee\b|\bmv\b|\bcp\b|\brm\b|\bchmod\b|\btruncate\b|\bln\b)")
# Inline-Code oder Heredoc: ein Interpreter kann schreiben, ohne eines der Verben zu nennen.
_INLINE_CODE = re.compile(r"\b(python[0-9.]*|perl|ruby|node|php)\b[^|;&]*\s-[ce]\b|<<-?\s*['\"]?\w")
# … schreiben tut er aber nur, wenn der Code selbst danach aussieht. Reines Lesen der Wache war
# vor dem Fix-Pass frei und bleibt es (der Aufruf steht dann als guard.lesezugriff am Bus).
_INLINE_WRITE = re.compile(
    r"(open\s*\([^)]*['\"][rbt]*[wax+]|\.write|writelines|truncate|unlink|remove|rename|replace"
    r"|rmtree|copy|move|mkdir|rmdir|chmod|chown|symlink|\blink\b|system|popen|subprocess|shutil"
    r"|fileutils|>>|>)", re.IGNORECASE)
_PATHLIKE = re.compile(r"[A-Za-z0-9_.~/-]+")
_SHELL_OPERATORS = ("&&", "||", ";", "|", "&", ">", ">>", "<", "(", ")")
# Ein cd-Ziel mit diesen Zeichen steht erst zur Laufzeit fest — der Hook kann es nicht auflösen.
_CD_UNSICHER = re.compile(r"[$`*?\[\]{}]")
# Zeilenfortsetzung: `git push \<Zeilenumbruch> origin main` ist EIN Befehl, kein Backslash-Ziel.
_LINE_CONT = re.compile(r"\\\r?\n")


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
    """Absolute Pfade der Dateien, die nur mit Mandat 'soul-integritaet' geändert werden.
    profile.json gehört dazu, seit die exakte Push-Prüfung an own_remotes hängt: wer das Profil
    schreibt, macht jedes Remote zum eigenen — das entwaffnete extern-publizieren und
    remote-loeschung dauerhaft, ohne Frist und ohne Bus-Zeile (das Mandat kann beides nur
    befristet und mit Bus-Zeile)."""
    root = paths.soul10_root()
    files = {_resolved(root / rel) for rel in _PROTECTED_REL_FILES}
    files.add(_resolved(paths.mandate_file()))
    files.add(_resolved(paths.profile_file()))
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
_gemeldete_remotes: tuple[str, tuple[str, ...]] | None = None


def own_remotes() -> list[str]:
    """Remotes, auf die ein Push immer erlaubt ist — aus profile.json (own_remotes), sonst ['origin'].
    Weicht die Liste vom Standard ab, steht das als Bus-Zeile da: die Ausnahme, die sie schafft,
    bleibt sichtbar (die Datei selbst ist geschützt, siehe protected_files)."""
    global _gemeldete_remotes
    try:
        from . import inventory  # lazy: das Profil ist Zustand, kein Importzeit-Wissen
        profile = inventory.load_profile()
    except ImportError:
        profile = None
    remotes = (profile or {}).get("own_remotes") if isinstance(profile, dict) else None
    out = [r.strip() for r in (remotes or []) if isinstance(r, str) and r.strip()]
    out = out or list(DEFAULT_OWN_REMOTES)
    quelle = str(paths.profile_file())
    if tuple(out) != tuple(DEFAULT_OWN_REMOTES) and (quelle, tuple(out)) != _gemeldete_remotes:
        _gemeldete_remotes = (quelle, tuple(out))
        bus.emit("guard.own_remotes", remotes=out, quelle=quelle)
    return out


def _is_local_target(cmd: str) -> bool:
    hit = re.search(r"https?://([^/\s:]+)", cmd)
    return bool(hit) and hit.group(1) in LOCAL_HOSTS


def push_targets(cmd: str) -> list[str | None]:
    """Je `git push` im Befehl das Ziel: der Wert von --repo, sonst das erste Argument, das keine
    Option ist; None heißt Standard-Upstream. Branch- und Refspec-Namen kommen nie in Frage.
    Zeilenfortsetzungen werden vorher aufgelöst — sonst blieb vom mehrzeiligen Push nur der
    Backslash übrig, der galt als fremdes Remote und sperrte den eigenen Push."""
    out: list[str | None] = []
    for m in _PUSH_SEGMENT.finditer(_LINE_CONT.sub(" ", cmd or "")):
        rest = m.group(1)
        try:
            toks = shlex.split(rest)
        except ValueError:
            toks = rest.split()
        toks = [t for t in toks if set(t) != {"\\"}]  # Reste einer Fortsetzung sind kein Ziel
        remote: str | None = None
        it = iter(toks)
        for t in it:
            if t.startswith("--repo="):
                remote = t.split("=", 1)[1]
                break
            if t == "--repo":
                remote = next(it, None)
                break
            if t in _PUSH_VALUE_OPTS:
                next(it, None)
                continue
            if t.startswith("-"):
                continue
            remote = t
            break
        out.append(remote)
    return out


def _is_own_push(cmd: str) -> bool:
    """True, wenn jeder git push im Befehl exakt auf ein eigenes Remote (oder den Upstream) zeigt."""
    targets = push_targets(cmd)
    own = set(own_remotes())
    return bool(targets) and all(t is None or t in own for t in targets)


def _cd_basis(basis: Path | None, ziel: str | None) -> Path | None:
    """Das Verzeichnis nach einem `cd`. None heißt: nicht auflösbar (Variable, Glob, `cd -`,
    ein Ziel, das es hier nicht gibt) — ab da wird jeder relative Pfad zusätzlich am Namen
    gemessen, statt ins Leere aufzulösen (fail-closed, ARCHITEKTUR §2 Regel 5)."""
    if ziel is None:
        return Path.home()
    if ziel == "-" or _CD_UNSICHER.search(ziel) or basis is None:
        return None
    try:
        kandidat = Path(os.path.abspath(os.path.join(str(basis), os.path.expanduser(ziel))))
    except (OSError, ValueError):
        return None
    return kandidat if kandidat.is_dir() else None


def _walk_paths(cmd: str, cwd: str | Path | None = None):
    """Je Pfad-Kandidat (Token mit / oder ., auch in Inline-Code): (absolut|None, relativ|None,
    sicher). Das Arbeitsverzeichnis kommt aus der Hook-Nutzlast, wenn sie eines trägt — der
    Hook-Prozess steht nicht zwingend dort, wo die Shell steht; deshalb bleibt der relative
    Pfad daneben stehen. `cd` wird mitgeführt, seine Optionen (-P, -L, --) übersprungen."""
    try:
        lex = shlex.shlex(cmd, posix=True, punctuation_chars=True)
        lex.whitespace_split = True
        tokens = list(lex)
    except ValueError:
        tokens = cmd.split()
    try:
        basis: Path | None = Path(cwd).expanduser() if cwd else Path.cwd()
    except (OSError, ValueError):
        basis = None
    i, n = 0, len(tokens)
    while i < n:
        t = tokens[i]
        i += 1
        if t in _SHELL_OPERATORS:
            continue
        if t == "cd":
            ziel: str | None = None
            while i < n and tokens[i] not in _SHELL_OPERATORS and tokens[i].startswith("-"):
                ziel = tokens[i] if tokens[i] == "-" else ziel   # `cd -` ist das vorige Verzeichnis
                i += 1
            if ziel is None and i < n and tokens[i] not in _SHELL_OPERATORS:
                ziel = tokens[i]
                i += 1
            basis = _cd_basis(basis, ziel)
            continue
        for cand in _PATHLIKE.findall(t):
            if "/" not in cand and "." not in cand:
                continue
            expandiert = os.path.expanduser(cand)
            if os.path.isabs(expandiert):
                yield (os.path.abspath(expandiert), None, True)
            else:
                absolut = os.path.abspath(os.path.join(str(basis), expandiert)) if basis else None
                yield (absolut, os.path.normpath(expandiert), basis is not None)


def bash_path_candidates(cmd: str, cwd: str | Path | None = None) -> list[str]:
    """Alle Token eines Bash-Befehls, die ein Pfad sein könnten (mit / oder .), gegen das
    mitgeführte cd-Verzeichnis aufgelöst — auch Pfadstücke in Inline-Code."""
    return [absolut for absolut, _rel, _sicher in _walk_paths(cmd, cwd) if absolut is not None]


def _rel_trifft_wache(rel: str, *, mindestens: int) -> bool:
    """Zeigt ein RELATIVER Pfad auf die Wache? Verglichen werden ganze Pfadglieder von rechts
    (kein Substring: core/guard_notes.py und core/guard.py.backup/notes.md fallen durch). Nötig,
    weil das Arbeitsverzeichnis der Shell dem Hook nicht sicher bekannt ist: `sed -i … core/guard.py`
    trifft die Wache, egal von wo aus die Shell zählt. `mindestens` ist die Zahl der Glieder, die
    übereinstimmen müssen — 1 erst, wenn auch das cd-Ziel unbekannt ist."""
    teile = tuple(p for p in PurePosixPath(rel).parts if p not in (".", "", "/"))
    if len(teile) < mindestens or not teile:
        return False
    for prot in _PROTECTED_REL_FILES:
        p = PurePosixPath(prot).parts
        if len(teile) <= len(p) and teile == p[-len(teile):]:
            return True
    for prot in _PROTECTED_REL_DIRS:
        p = PurePosixPath(prot).parts
        if any(teile[i:i + len(p)] == p for i in range(len(teile))):
            return True
        if mindestens == 1 and any(teile[:k] == p[-k:] for k in range(1, min(len(teile), len(p)) + 1)):
            return True
    return False


def _bash_trifft_wache(cmd: str, cwd: str | Path | None = None) -> bool:
    """Exakt aufgelöste Pfade, kein Substring: /tmp/core/guard.py ist frei, core/guard.py nicht."""
    for absolut, relativ, sicher in _walk_paths(cmd, cwd):
        if absolut is not None and _is_protected_path(absolut):
            return True
        if relativ is not None and _rel_trifft_wache(relativ, mindestens=2 if sicher else 1):
            return True
    return False


def _shell_writes_guard(cmd: str, cwd: str | Path | None = None) -> bool:
    schreibverb = bool(_SHELL_WRITE_VERB.search(cmd))
    inline = bool(_INLINE_CODE.search(cmd))
    if not (schreibverb or inline):
        return False
    if not (_mentions_mandate_file(cmd) or _bash_trifft_wache(cmd, cwd)):
        return False
    if schreibverb or _INLINE_WRITE.search(cmd):
        return True
    # Inline-Code ohne Schreibhinweis liest die Wache nur; das bleibt frei, aber es steht am Bus.
    bus.emit("guard.lesezugriff", ziel="wache", cmd=cmd[:200])
    return False


def _secret_ref_in_url(cmd: str) -> bool:
    return any(_ENV_SECRET_REF.search(u) for u in _URL.findall(cmd))


def _mentions_mandate_file(cmd: str) -> bool:
    return _resolved(paths.mandate_file()) in cmd


def _segments(cmd: str) -> list[str]:
    """Befehlskette quote-bewusst in Glieder zerlegen (rollback.split_segments). Eingestuft wird
    Glied für Glied — ein eigener Push entlastet nur sein eigenes Glied, nie das Kommando daneben."""
    try:
        from . import rollback  # lazy: guard hängt sonst beim Import an rollback
        segmente = rollback.split_segments(cmd)
    except Exception:  # noqa: BLE001 — ohne Zerlegung gilt der ganze Befehl (fail-closed)
        segmente = []
    return segmente or [cmd]


# --- Einstufung -----------------------------------------------------------------------------------
def classify(tool_name: str, tool_input: dict, *, cwd: str | Path | None = None) -> tuple[str, str] | None:
    """Liefert (kategorie, grund) oder None. Liest nur das Profil (eigene Remotes), sonst rein.
    `cwd` ist das Arbeitsverzeichnis der Shell aus der Hook-Nutzlast; fehlt es, rechnet der
    Stolperdraht mit dem Verzeichnis des Hook-Prozesses UND mit dem Namen (siehe _rel_trifft_wache)."""
    tool_input = tool_input or {}
    if tool_name in ("Write", "Edit", "NotebookEdit", "MultiEdit"):
        if _is_protected_path(str(tool_input.get("file_path", "") or tool_input.get("notebook_path", ""))):
            return (
                "soul-integritaet",
                "Aenderung an der Wache selbst (guard/events/hooks/settings/mandat/profil)",
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

    if tool_name == "Bash" and _shell_writes_guard(cmd, cwd):
        return ("soul-integritaet", "Shell-Schreibzugriff auf die Wache selbst")

    if _SECRET_SRC.search(cmd) and _EXFIL_VERB.search(cmd):
        # Ziel absichtlich egal — auch localhost zählt (Drill-Erkenntnis aus SOUL).
        return ("secrets-exfiltration", "Secret-Quelle kombiniert mit Netz-Werkzeug")
    if _EXFIL_VERB.search(cmd) and _secret_ref_in_url(cmd):
        return ("secrets-exfiltration", "Schluessel-Variable in der Ziel-URL eines Netz-Werkzeugs")

    # Ein eigener Push befreit nur den Push selbst, nie ein anderes Publish-Kommando daneben.
    if _PUBLISH.search(cmd):
        return ("extern-publizieren", "Publish-Kommando auf externes Ziel")
    if _PUSH_SEGMENT.search(cmd) and not _is_own_push(cmd):
        return ("extern-publizieren", "git push auf fremdes Remote")
    if _WEBHOOK_HOSTS.search(cmd):
        return ("extern-publizieren", "bekannter Webhook-Host")
    if _HTTP_WRITE.search(cmd) and not _is_local_target(cmd):
        return ("extern-publizieren", "HTTP-Schreibzugriff auf Nicht-lokal-Ziel")

    if _PAYMENT.search(cmd):
        return ("zahlungen", "Zahlungs-API oder -CLI")

    if _REMOTE_DELETE.search(cmd):
        # Glied für Glied: ein eigener Push (`git push --force origin main`) entlastet nur sich
        # selbst. Vorher machte er `gh repo delete` daneben frei — ohne Sperre, ohne Bus-Zeile.
        segmente = _segments(cmd)
        fremd = [s for s in segmente if _REMOTE_DELETE.search(s) and not _is_own_push(s)]
        # Trifft das Muster nur über eine Trennstelle hinweg (`DELETE FROM t;`), bleibt es ein Treffer.
        if fremd or not any(_REMOTE_DELETE.search(s) for s in segmente):
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
def decide(tool_name: str, tool_input: dict, *, cwd: str | Path | None = None) -> dict:
    """classify + Mandat in einer Entscheidung: {"blocked", "category", "reason", "mandate"}.

    Ein Fehler in der Prüfung selbst blockiert (fail-closed, ARCHITEKTUR §2 Regel 5) und wird als
    Kategorie "guard-fehler" gemeldet. Jeder Treffer schreibt eine Bus-Zeile, auch mit Mandat.
    `cwd` (Arbeitsverzeichnis aus der Hook-Nutzlast) wird an classify durchgereicht.
    """
    try:
        # ohne cwd bleibt der Aufruf zweistellig: eine ersetzte classify (Test, älterer Hook)
        # soll an ihrem eigenen Fehler scheitern, nicht am neuen Schlüsselwort.
        hit = classify(tool_name, tool_input, cwd=cwd) if cwd is not None else classify(tool_name, tool_input)
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
