"""Das epistemische Hauptbuch: Schema, Guards, remember, Zustandsübergänge, Rendering, Hash-Kette.

Befund: Herkunftsetikett am Eintrag stellt 95,0 % richtig / 0,0 % falsch her, wo das flache
Gedächtnis 0,0 % richtig / 73,3 % falsch liefert; die Regel im Prompt allein 1,7 %
(01-BEFUNDE A3/A4); Gedächtnis insgesamt +68,3 pp (A1).
Erz → Gold: SOUL core/memory.py wollte Herkunft (eine Tabelle, drei Status, Zitatpflicht,
Secret-Guard, FTS5) und blieb ohne Vertrauen, Zeit, Widerspruch, Verfall stehen. Hier: Schema mit
Herkunft, Vertrauen, Bitemporalität, Widerspruch, Verfall, Ableitung; jeder Statuswechsel läuft
durch transition(); kein DELETE; ledger.jsonl als Hash-Kette; render() liefert genau die
gemessene Zeile.

Bezeichner englisch (Schema-Felder), Kommentare deutsch.
"""
from __future__ import annotations

import json
import re
import sqlite3
try:
    import fcntl  # POSIX-Dateisperre; auf Windows fehlt sie, dann ohne Sperre
except ImportError:  # pragma: no cover
    fcntl = None
import time
from contextlib import closing
from typing import Iterable

from core import bus, paths

# --- Konstanten (ARCHITEKTUR.md 4.1) -------------------------------------------------------
KINDS = ("episode", "fact", "procedure", "self", "user", "rejected", "prediction",
         "retraction", "contract", "harvest")
STATUS = ("candidate", "active", "superseded", "disputed", "quarantined", "retracted", "archived")
SOURCES = {"nutzer": 0.8, "werkzeug": 0.9, "dokument": 0.7, "eigener_schluss": 0.4,
           "import": 0.3, "extern": 0.3}
# conditional: expires_when trägt die Bedingung als Prosa für den Leser („bis der Umzug abgeschlossen
# ist"); kein Code wertet sie aus — eine Bedingung in Worten ist kein Kommando. Takt B behandelt
# conditional wie durable; wer die Bedingung erfüllt sieht, archiviert von Hand oder per Vertrag.
TTL = ("durable", "seasonal", "short", "conditional")
VISIBILITY = ("public", "private", "never")
TRANSITIONS = {
    ("candidate", "disputed"),  # takt_b: Widerspruch bei gleichem Vertrauen auch für Kandidaten  # (von, nach) — alles andere ist LedgerError
    ("candidate", "active"), ("candidate", "archived"), ("candidate", "quarantined"),
    ("candidate", "retracted"),
    ("active", "superseded"), ("active", "disputed"), ("active", "archived"),
    ("active", "quarantined"), ("active", "retracted"),
    ("disputed", "active"), ("disputed", "superseded"), ("disputed", "retracted"),
    ("disputed", "quarantined"),
    ("archived", "active"), ("archived", "retracted"), ("archived", "quarantined"),
    ("quarantined", "active"), ("quarantined", "retracted"),
    ("superseded", "retracted"), ("superseded", "quarantined"),
}
# Status, die einen Eintrag aus dem Umlauf nehmen: retired_at wird gesetzt.
_RETIRING = ("superseded", "retracted", "archived")

# Byte-gleich zu bewusstsein/harness/suiten_gedaechtnis.py::REGEL_HERKUNFT (98,3 % mit Etikett;
# allein 1,7 %). Die gemischte Schreibweise (abgeloest / ablösen) ist Teil des gemessenen Textes.
REGEL_HERKUNFT = (
    "\n\nHerkunftsregeln fuer dein Gedaechtnis (verbindlich):\n"
    "- Eine Aussage der Quelle 'nutzer' kann nur durch eine neuere Aussage der Quelle "
    "'nutzer' oder durch ein verifiziertes Ergebnis abgeloest werden.\n"
    "- Eine Aussage der Quelle 'eigener_schluss' kann eine Nutzeraussage NIE ablösen, "
    "auch wenn sie neuer ist.\n"
    "- Neuer heisst nicht wahrer. Bei Widerspruch entscheidet die Herkunft, nicht das Datum.")

# Guards: Größe, Secret-Muster (aus SOUL übernommen), Imperativ an das System aus fremder Quelle.
MAX_BODY_BYTES = 16 * 1024
SECRET_RE = re.compile(
    r"(AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9_\-]{20,}|ghp_[A-Za-z0-9]{20,}"
    r"|xox[bpars]-[A-Za-z0-9\-]+|BEGIN (RSA|OPENSSH|EC|PGP) PRIVATE KEY)"
)
# Vertrauen je Quelle nach oben gedeckelt: ein eigener_schluss kann eine Nutzeraussage (0,8) nie
# überbieten — REGEL_HERKUNFT gilt damit in den Daten, nicht nur im Text (Prüfbefund 2026-09-08).
TRUST_MAX = {"nutzer": 0.95, "werkzeug": 0.95, "dokument": 0.8, "eigener_schluss": 0.6,
             "import": 0.5, "extern": 0.5}
# Herkunftsordnung: eine Quelle niedrigeren Rangs löst eine höheren Rangs nie ab, auch nicht bei
# höherem Vertrauen (nutzer und werkzeug = "verifiziertes Ergebnis" stehen gleich).
SOURCE_RANK = {"nutzer": 3, "werkzeug": 3, "dokument": 2, "eigener_schluss": 1, "import": 1, "extern": 1}
# Ein Etikett im Text würde eine zweite, gefälschte Herkunft in die Zeile schmuggeln.
LABEL_RE = re.compile(r"\[(Quelle|Vertrauen):\s")
IMPERATIVE_RE = re.compile(
    r"\b(ignoriere|vergiss|du musst|du sollst|ab jetzt|ab sofort|from now on|override|disregard"
    r"|ignore (all|any|the|prior|previous|above|earlier)|forget (everything|all|prior|previous|the)"
    r"|neue anweisung(en)?|new instructions?|system[ -]?prompt)\b",
    re.IGNORECASE,
)


def _imperativ(*texte) -> bool:
    """Anweisung an das System in einem der Texte — Leerraum wird zusammengezogen, damit
    'Ignore  prior instructions' nicht am doppelten Leerzeichen vorbeikommt."""
    return any(IMPERATIVE_RE.search(re.sub(r"\s+", " ", t or "")) for t in texte)
# Quellen, deren Text Anweisungen an das System tragen könnte, ohne dass der Nutzer sie sagte.
_FOREIGN_SOURCES = ("extern", "dokument", "werkzeug")
# Quellen, die vor der Aktivierung durch die Konsolidierung müssen (Quarantäne vor Aktivierung).
_CANDIDATE_ONLY_SOURCES = ("extern", "dokument", "import")

# Anfangsstärke je Wichtigkeitspunkt in Tagen: retention = exp(-Δt/strength) fällt bei
# strength = 7·importance nach ~1,2·strength Tagen unter 0,3 (Briefing-Grenze). Jeder Abruf +1.
_STRENGTH_PER_IMPORTANCE = 7.0

# Erster prev_hash der Kette.
GENESIS_HASH = "0" * 64


def check_secrets(*texte) -> None:
    """Secret-Muster in irgendeinem Text → LedgerError. Vereinigung aus SECRET_RE und bus.SECRET_PATTERN;
    gilt für title, body, source_ref, tags, expires_when, Gründe, Vorhersagen und Rücknahmen."""
    for t in texte:
        if not t:
            continue
        if isinstance(t, (list, tuple)):
            check_secrets(*t)
            continue
        text = str(t)
        if SECRET_RE.search(text) or bus.SECRET_PATTERN.search(text):
            raise LedgerError("Secret-Muster erkannt — Secrets werden nie gespeichert")


class LedgerError(ValueError):
    """Ein Guard hat gegriffen oder ein Übergang ist illegal. Fail-closed."""


# --- Schema -----------------------------------------------------------------------------------
# Hinweis zur rowid: memories hat einen TEXT-Primärschlüssel und damit eine implizite rowid, an
# der die FTS5-Tabelle hängt. Das trägt, weil das Hauptbuch nie DELETE und nie VACUUM ausführt.
_SCHEMA = """
CREATE TABLE IF NOT EXISTS memories (
    id TEXT PRIMARY KEY,
    kind TEXT NOT NULL,
    status TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    tags TEXT NOT NULL DEFAULT '[]',
    source TEXT NOT NULL,
    source_ref TEXT NOT NULL DEFAULT '',
    trust REAL NOT NULL,
    importance INTEGER NOT NULL DEFAULT 3,
    valid_from TEXT,
    valid_to TEXT,
    recorded_at TEXT NOT NULL,
    retired_at TEXT,
    last_accessed TEXT,
    access_count INTEGER NOT NULL DEFAULT 0,
    strength REAL NOT NULL DEFAULT 1.0,
    ttl_class TEXT NOT NULL DEFAULT 'durable',
    expires_at TEXT,
    expires_when TEXT,
    derived_from TEXT NOT NULL DEFAULT '[]',
    supersedes TEXT,
    disputes TEXT,
    mission_id TEXT NOT NULL DEFAULT '',
    level INTEGER NOT NULL DEFAULT 1,
    agent TEXT NOT NULL DEFAULT '',
    visibility TEXT NOT NULL DEFAULT 'private',
    session_id TEXT NOT NULL DEFAULT '',
    model_id TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS memories_status_idx ON memories(status);
CREATE INDEX IF NOT EXISTS memories_kind_idx ON memories(kind);
CREATE INDEX IF NOT EXISTS memories_mission_idx ON memories(mission_id);
CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
    title, body, tags, content='memories'
);
CREATE TRIGGER IF NOT EXISTS memories_ai AFTER INSERT ON memories BEGIN
    INSERT INTO memories_fts(rowid, title, body, tags)
    VALUES (new.rowid, new.title, new.body, new.tags);
END;
CREATE TRIGGER IF NOT EXISTS memories_au AFTER UPDATE ON memories BEGIN
    INSERT INTO memories_fts(memories_fts, rowid, title, body, tags)
    VALUES ('delete', old.rowid, old.title, old.body, old.tags);
    INSERT INTO memories_fts(rowid, title, body, tags)
    VALUES (new.rowid, new.title, new.body, new.tags);
END;
CREATE TRIGGER IF NOT EXISTS memories_ad AFTER DELETE ON memories BEGIN
    INSERT INTO memories_fts(memories_fts, rowid, title, body, tags)
    VALUES ('delete', old.rowid, old.title, old.body, old.tags);
END;
CREATE TABLE IF NOT EXISTS predictions (
    id TEXT PRIMARY KEY,
    claim TEXT NOT NULL,
    confidence REAL NOT NULL,
    domain TEXT NOT NULL DEFAULT 'allgemein',
    model_id TEXT NOT NULL DEFAULT '',
    due_at TEXT,
    resolved_at TEXT,
    outcome INTEGER,
    brier REAL,
    contract_id TEXT,
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS retractions (
    id TEXT PRIMARY KEY,
    target_id TEXT NOT NULL,
    reason TEXT NOT NULL DEFAULT '',
    by TEXT NOT NULL DEFAULT '',
    at TEXT NOT NULL,
    contaminated_ids TEXT NOT NULL DEFAULT '[]'
);
CREATE TABLE IF NOT EXISTS access_log (
    memory_id TEXT NOT NULL,
    session_id TEXT NOT NULL DEFAULT '',
    at TEXT NOT NULL,
    via TEXT NOT NULL DEFAULT 'search'
);
"""


def connect() -> sqlite3.Connection:
    """Öffnet memory.db (WAL), legt das Schema an, row_factory = Row. Aufrufer schließt.

    WAL und Schema werden je Prozess und Datei nur einmal gesetzt; bei 'database is locked'
    (parallele Hooks) wird kurz gewartet und erneut versucht — ein Hook darf nicht daran scheitern.
    """
    db = paths.db()
    key = str(db)
    letzter = None
    for versuch in range(5):
        try:
            con = sqlite3.connect(db, timeout=30)
            con.row_factory = sqlite3.Row
            if key not in _INITIALISIERT:
                con.execute("PRAGMA journal_mode=WAL")
                con.executescript(_SCHEMA)
                _INITIALISIERT.add(key)
            return con
        except sqlite3.OperationalError as exc:
            letzter = exc
            if "locked" not in str(exc).lower():
                raise
            time.sleep(0.2 * (versuch + 1))
    raise letzter  # type: ignore[misc]


# Dateien, für die Schema und WAL in diesem Prozess schon gesetzt sind.
_INITIALISIERT: set[str] = set()


# --- Hash-Kette (ledger.jsonl) ----------------------------------------------------------------
def _canonical(line: dict) -> str:
    """Kanonisches JSON der Zeile ohne 'hash': sortierte Schlüssel, ohne Leerraum."""
    return json.dumps({k: v for k, v in line.items() if k != "hash"},
                      sort_keys=True, ensure_ascii=False, separators=(",", ":"))


def _hash_line(line: dict) -> str:
    return paths.sha256_text(line.get("prev_hash", "") + _canonical(line))


def _last_hash() -> str:
    """Hash der letzten Zeile in ledger.jsonl; GENESIS_HASH bei leerer oder fehlender Datei."""
    target = paths.ledger_file()
    try:
        with target.open("rb") as fh:
            fh.seek(0, 2)
            size = fh.tell()
            if size == 0:
                return GENESIS_HASH
            # Rückwärts lesen, bis ein Zeilenumbruch vor der letzten nicht-leeren Zeile steht.
            chunk = b""
            pos = size
            while pos > 0:
                step = min(4096, pos)
                pos -= step
                fh.seek(pos)
                chunk = fh.read(step) + chunk
                if chunk.rstrip(b"\n").count(b"\n") >= 1:
                    break
        lines = [ln for ln in chunk.decode("utf-8", "replace").splitlines() if ln.strip()]
        if not lines:
            return GENESIS_HASH
        return str(json.loads(lines[-1]).get("hash", ""))
    except FileNotFoundError:
        return GENESIS_HASH
    except (OSError, ValueError):
        # Eine unlesbare letzte Zeile bricht die Kette; verify_chain() meldet das.
        return GENESIS_HASH


_STATE_FIELDS = ("id", "kind", "status", "title", "body", "source", "source_ref", "trust",
                 "importance", "valid_from", "valid_to", "retired_at", "derived_from", "supersedes",
                 "disputes", "visibility", "ttl_class", "expires_at", "expires_when")


def state_hash(entry: dict) -> str:
    """Hash des Zustands, den das Modell liest. Steht in jeder Kettenzeile zu einem Eintrag;
    verify_state() vergleicht ihn mit der Datenbank — ein direktes UPDATE fällt damit auf."""
    werte = {k: entry.get(k) for k in _STATE_FIELDS}
    for k in ("derived_from",):
        v = werte.get(k)
        if isinstance(v, str):
            try:
                v = json.loads(v)
            except ValueError:
                v = [v]
        werte[k] = list(v or [])
    if werte.get("trust") is not None:
        werte["trust"] = round(float(werte["trust"]), 6)
    return paths.sha256_text(json.dumps(werte, sort_keys=True, ensure_ascii=False,
                                        separators=(",", ":"), default=str))


def _head_file():
    return paths.home() / "state" / "ledger.head"


def _read_head() -> dict | None:
    try:
        return json.loads(_head_file().read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


def _count_lines() -> int:
    try:
        with paths.ledger_file().open("rb") as fh:
            return sum(1 for ln in fh if ln.strip())
    except FileNotFoundError:
        return 0


class _Sperre:
    """Prozessübergreifende Sperre um Lesen-des-letzten-Hashes + Anhängen (parallele Hooks)."""

    def __enter__(self):
        self.fh = None
        if fcntl is None:
            return self
        self.fh = (paths.ledger_file().parent / "ledger.jsonl.lock").open("a+")
        fcntl.flock(self.fh, fcntl.LOCK_EX)
        return self

    def __exit__(self, *exc):
        if self.fh is not None:
            fcntl.flock(self.fh, fcntl.LOCK_UN)
            self.fh.close()
        return False


def _append_ledger(op: str, id: str, *, by: str, **extra) -> dict:
    """Eine Zeile {op, id, at, by, prev_hash, hash, ...} an ledger.jsonl anhängen.

    Unter Dateisperre (die Kette gabelt sich sonst bei parallelen Hooks); Zusatzfelder werden
    maskiert (Gründe tragen Nutzertext); der Kopf (letzter Hash, Zeilenzahl) liegt getrennt in
    state/ledger.head, damit verify_chain() ein Abschneiden am Ende erkennt.
    """
    with _Sperre():
        line = {"op": op, "id": id, "at": paths.now_iso(), "by": by, "prev_hash": _last_hash()}
        for k, v in extra.items():
            line[k] = bus.mask(v) if isinstance(v, str) else v
        line["hash"] = _hash_line(line)
        with paths.ledger_file().open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(line, ensure_ascii=False, sort_keys=True) + "\n")
        try:
            _head_file().write_text(json.dumps({"hash": line["hash"], "lines": _count_lines()}),
                                    encoding="utf-8")
        except OSError:
            pass
    return line


def append_ledger(op: str, id: str, *, by: str, **extra) -> dict:
    """Öffentlich: Nebentabellen (Rücknahmen, Vorhersagen) hängen sich damit an die Hash-Kette.
    Jede Schreiboperation, die Wissen verändert, ist so nachweisbar — nicht nur Statuswechsel."""
    return _append_ledger(op, id, by=by, **extra)


def verify_chain() -> bool:
    """True, wenn jede Zeile auf den Hash der vorigen zeigt, ihren eigenen Hash trägt und die
    Kette am Kopf (state/ledger.head) endet — Abschneiden oder Neuanfang fällt damit auf."""
    try:
        text = paths.ledger_file().read_text(encoding="utf-8")
    except FileNotFoundError:
        head = _read_head()
        return head is None or head.get("lines", 0) == 0
    prev = GENESIS_HASH
    n = 0
    for raw in text.splitlines():
        if not raw.strip():
            continue
        try:
            line = json.loads(raw)
        except ValueError:
            return False
        if not isinstance(line, dict) or line.get("prev_hash") != prev:
            return False
        if line.get("hash") != _hash_line(line):
            return False
        prev = line["hash"]
        n += 1
    head = _read_head()
    if head is not None and (head.get("hash") != prev or head.get("lines") != n):
        return False
    return True


def verify_state() -> dict:
    """Vergleicht je Eintrag den letzten Zustandshash der Kette mit der Datenbank.
    {"ok": bool, "geprueft": n, "abweichend": [ids]} — ein direktes UPDATE an memories fällt auf."""
    letzte: dict[str, str] = {}
    try:
        for raw in paths.ledger_file().read_text(encoding="utf-8").splitlines():
            if not raw.strip():
                continue
            try:
                line = json.loads(raw)
            except ValueError:
                continue
            if isinstance(line, dict) and line.get("row_hash") and line.get("id"):
                letzte[line["id"]] = line["row_hash"]
    except FileNotFoundError:
        pass
    abweichend = []
    with closing(connect()) as con:
        rows = con.execute("SELECT * FROM memories").fetchall()
    for r in rows:
        e = _row_to_dict(r)
        soll = letzte.get(e["id"])
        if soll is not None and soll != state_hash(e):
            abweichend.append(e["id"])
    return {"ok": not abweichend, "geprueft": len(rows), "abweichend": abweichend}


# --- Hilfen -----------------------------------------------------------------------------------
def _row_to_dict(row: sqlite3.Row | None) -> dict | None:
    if row is None:
        return None
    d = dict(row)
    for key in ("tags", "derived_from"):
        try:
            value = json.loads(d.get(key) or "[]")
        except ValueError:
            value = []
        d[key] = list(value) if isinstance(value, list) else []
    return d


def _check_transition(old_status: str, new_status: str) -> None:
    if new_status not in STATUS:
        raise LedgerError(f"Unbekannter Status {new_status!r}; erlaubt: {STATUS}")
    if (old_status, new_status) not in TRANSITIONS:
        raise LedgerError(f"Illegaler Übergang {old_status!r} → {new_status!r}")


def _clamp_trust(trust: float) -> float:
    return min(0.95, max(0.05, float(trust)))


# --- Schreiben --------------------------------------------------------------------------------
def remember(title: str, body: str, *, source: str | None = None, kind: str = "fact",
             source_ref: str = "", trust: float | None = None, importance: int = 3,
             tags: Iterable[str] = (), valid_from: str | None = None, valid_to: str | None = None,
             ttl_class: str = "durable", expires_at: str | None = None,
             expires_when: str | None = None, derived_from: Iterable[str] = (),
             supersedes: str | None = None, mission_id: str = "", level: int = 1,
             agent: str = "", visibility: str = "private", session_id: str = "",
             model_id: str = "", status: str = "active") -> str:
    """Schreibt einen Eintrag mit Herkunft. Guards in fester Reihenfolge, jeder wirft LedgerError.

    `source` hat keinen Default, der durchginge: fehlt er, greift Guard 1 statt eines TypeError.
    """
    title = (title or "").strip()
    body = body or ""

    # 1. Herkunft ist Pflicht (95,0 % gegen 0,0 %).
    if not source or source not in SOURCES:
        raise LedgerError("Eintrag ohne Herkunft abgelehnt")
    # 2. Zitat- bzw. Werkzeugpflicht.
    if source == "nutzer" and not source_ref:
        raise LedgerError("Nutzeraussage ohne Zitat abgelehnt (source_ref muss den Wortlaut tragen)")
    if source == "werkzeug" and not source_ref:
        raise LedgerError("Werkzeugbeobachtung ohne Werkzeugverweis abgelehnt (source_ref = werkzeug:argumente)")
    # 3. Aufzählungen.
    if kind not in KINDS:
        raise LedgerError(f"Unbekannte Gedächtnisart {kind!r}; erlaubt: {KINDS}")
    if status not in STATUS:
        raise LedgerError(f"Unbekannter Status {status!r}; erlaubt: {STATUS}")
    if status not in ("active", "candidate"):
        # Regel 4: jeder andere Zustand ist ein Übergang mit Kettenzeile, retired_at und Grund —
        # niemand wird als superseded oder retracted geboren.
        raise LedgerError(f"Geburtsstatus {status!r} abgelehnt; nur active oder candidate, der Rest über transition()")
    if ttl_class not in TTL:
        raise LedgerError(f"Unbekannte Haltbarkeitsklasse {ttl_class!r}; erlaubt: {TTL}")
    if visibility not in VISIBILITY:
        raise LedgerError(f"Unbekannte Sichtbarkeit {visibility!r}; erlaubt: {VISIBILITY}")
    # 4. Größe und Secrets.
    if len(body.encode("utf-8", "ignore")) > MAX_BODY_BYTES:
        raise LedgerError("Eintrag > 16 KB abgelehnt — ein Eintrag ist ein Fakt, kein Dokument")
    tags = list(tags)
    check_secrets(title, body, source_ref, tags, expires_when)
    if LABEL_RE.search(title) or LABEL_RE.search(body):
        raise LedgerError("Etikett im Text abgelehnt — Herkunft steht nur im gerenderten Kopf der Zeile")
    # 5. Anweisung an das System selbst aus fremder Quelle.
    if source in _FOREIGN_SOURCES and _imperativ(title, body):
        raise LedgerError("Anweisung an mich selbst aus fremder Quelle abgelehnt")
    if not title:
        raise LedgerError("Eintrag ohne Titel abgelehnt")
    # 6./7. Quarantäne vor Aktivierung: fremde Quellen und das Selbst werden nie direkt aktiv.
    if source in _CANDIDATE_ONLY_SOURCES or kind == "self":
        status = "candidate"
    # 8. Vertrauen: Startwert aus der Quelle, sonst begrenzt — und nie über der Obergrenze der Quelle.
    trust_value = SOURCES[source] if trust is None else _clamp_trust(trust)
    if trust_value > TRUST_MAX[source] + 1e-9:
        raise LedgerError(f"Vertrauen {trust_value:.2f} über der Obergrenze {TRUST_MAX[source]:.2f} "
                          f"der Quelle {source!r} abgelehnt")
    importance = max(1, min(5, int(importance)))
    # 9. Ablösung: erst prüfen, ob der Übergang legal ist, dann einfügen, dann ablösen.
    old = None
    if supersedes:
        old = get(supersedes)
        if old is None:
            raise LedgerError(f"Abzulösender Eintrag {supersedes!r} existiert nicht")
        _check_transition(old["status"], "superseded")

    # Guard: Ableitung aus einem zurückgezogenen oder quarantinierten Eintrag trägt dessen Gift.
    # Sie wird sofort quarantiniert statt aktiv (Kontaminationsbefund A3; Wunsch aus retract.py).
    derived_from = list(derived_from)
    vergiftet = []
    for parent in derived_from:
        p_row = get(parent)
        if p_row and p_row["status"] in ("retracted", "quarantined"):
            vergiftet.append(parent)
    if vergiftet:
        status = "quarantined"

    # 9b. Ablösung nur durch einen Eintrag, der aktiv wird und nach Herkunftsordnung und Vertrauen
    # nicht schwächer ist (REGEL_HERKUNFT in den Daten: eigener_schluss löst nutzer nie ab).
    if old is not None:
        if status != "active":
            raise LedgerError("Ablösung abgelehnt: der neue Eintrag wird nicht aktiv "
                              f"(Status {status!r})")
        if SOURCE_RANK[source] < SOURCE_RANK.get(old["source"], 0):
            raise LedgerError(f"Ablösung abgelehnt: Quelle {source!r} steht unter {old['source']!r}")
        if trust_value < float(old["trust"]) - 1e-9:
            raise LedgerError("Ablösung abgelehnt: geringeres Vertrauen als der abzulösende Eintrag")

    entry_id = paths.new_id()
    now = paths.now_iso()
    by = agent or "system"
    row = (
        entry_id, kind, status, title, body, json.dumps(list(tags), ensure_ascii=False),
        source, source_ref, trust_value, importance, valid_from, valid_to, now, None,
        None, 0, _STRENGTH_PER_IMPORTANCE * importance, ttl_class, expires_at, expires_when,
        json.dumps(list(derived_from), ensure_ascii=False), supersedes or None, None,
        mission_id, int(level), agent, visibility, session_id, model_id,
    )
    with closing(connect()) as con, con:
        con.execute(
            "INSERT INTO memories (id, kind, status, title, body, tags, source, source_ref, trust,"
            " importance, valid_from, valid_to, recorded_at, retired_at, last_accessed,"
            " access_count, strength, ttl_class, expires_at, expires_when, derived_from,"
            " supersedes, disputes, mission_id, level, agent, visibility, session_id, model_id)"
            " VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            row,
        )
        # 10. Kette und Bus; scheitert die Kette, wird der Einfügevorgang zurückgerollt.
        _append_ledger("remember", entry_id, by=by, kind=kind, source=source, status=status,
                       row_hash=state_hash({
                           "id": entry_id, "kind": kind, "status": status, "title": title, "body": body,
                           "source": source, "source_ref": source_ref, "trust": trust_value,
                           "importance": importance, "valid_from": valid_from, "valid_to": valid_to,
                           "retired_at": None, "derived_from": list(derived_from),
                           "supersedes": supersedes or None, "disputes": None,
                           "visibility": visibility, "ttl_class": ttl_class,
                           "expires_at": expires_at, "expires_when": expires_when}))
    if old is not None:
        transition(supersedes, "superseded", reason=f"abgelöst durch {entry_id}", by=by)
    bus.emit("memory.remember", id=entry_id, kind=kind, source=source, status=status,
             trust=trust_value, mission_id=mission_id, level=level)
    return entry_id


def get(id: str) -> dict | None:
    """Ein Eintrag als dict; tags und derived_from als Listen. None, wenn unbekannt."""
    with closing(connect()) as con:
        row = con.execute("SELECT * FROM memories WHERE id = ?", (id,)).fetchone()
    return _row_to_dict(row)


def transition(id: str, new_status: str, *, reason: str = "", by: str = "system") -> dict:
    """DIE eine Funktion für Zustandsübergänge. Illegal → LedgerError.

    Setzt retired_at bei superseded/retracted/archived und löscht es bei Rückkehr nach active;
    bei superseded wird zusätzlich valid_to gesetzt, falls leer (Ereigniszeit des Endes).
    """
    entry = get(id)
    if entry is None:
        raise LedgerError(f"Kein Eintrag mit id {id!r}")
    old_status = entry["status"]
    _check_transition(old_status, new_status)
    check_secrets(reason)
    if new_status == "active" and old_status != "active":
        # Die Guards laufen bei der Aktivierung erneut: ein Kandidat aus fremder Quelle mit
        # Anweisung an das System wird nie aktiv, auch nicht über die Konsolidierung.
        if entry["source"] in _FOREIGN_SOURCES and _imperativ(entry["title"], entry["body"]):
            raise LedgerError("Aktivierung abgelehnt: Anweisung an mich selbst aus fremder Quelle")
        check_secrets(entry["title"], entry["body"], entry["source_ref"])
        # Ein Kind eines zurückgezogenen oder quarantinierten Eintrags trägt dessen Gift: es kommt
        # nicht zurück in den Umlauf, solange der Elternteil draußen ist (G5 bleibt 1,0).
        for parent in entry.get("derived_from") or []:
            p_row = get(str(parent))
            if p_row and p_row["status"] in ("retracted", "quarantined"):
                raise LedgerError(f"Aktivierung abgelehnt: abgeleitet aus {p_row['status']} {parent}")
    now = paths.now_iso()
    retired_at = now if new_status in _RETIRING else (None if new_status == "active" else entry["retired_at"])
    valid_to = entry["valid_to"]
    if new_status == "superseded" and not valid_to:
        valid_to = now
    with closing(connect()) as con, con:
        con.execute(
            "UPDATE memories SET status = ?, retired_at = ?, valid_to = ? WHERE id = ?",
            (new_status, retired_at, valid_to, id),
        )
        neu_zustand = dict(entry, status=new_status, retired_at=retired_at, valid_to=valid_to)
        _append_ledger("transition", id, by=by, from_status=old_status, to_status=new_status,
                       reason=reason, row_hash=state_hash(neu_zustand))
    bus.emit("memory.transition", id=id, from_status=old_status, to_status=new_status,
             reason=reason, by=by)
    return get(id)


def dispute(id_a: str, id_b: str, *, reason: str) -> None:
    """Beide Einträge → disputed; `disputes` verweist aufeinander. Kein Sieger durch Datum."""
    if id_a == id_b:
        raise LedgerError("Ein Eintrag kann sich nicht selbst widersprechen")
    check_secrets(reason)
    # Erst beide Übergänge prüfen, dann beide ausführen: keiner bleibt ohne Partner in disputed zurück.
    eintraege = {}
    for own in (id_a, id_b):
        entry = get(own)
        if entry is None:
            raise LedgerError(f"Kein Eintrag mit id {own!r}")
        if entry["status"] != "disputed":
            _check_transition(entry["status"], "disputed")
        eintraege[own] = entry
    for own in (id_a, id_b):
        if eintraege[own]["status"] != "disputed":
            transition(own, "disputed", reason=reason, by="system")
    with closing(connect()) as con, con:
        con.execute("UPDATE memories SET disputes = ? WHERE id = ?", (id_b, id_a))
        con.execute("UPDATE memories SET disputes = ? WHERE id = ?", (id_a, id_b))
        a_neu = dict(get(id_a), disputes=id_b)
        b_neu = dict(get(id_b), disputes=id_a)
        _append_ledger("dispute", id_a, by="system", other=id_b, reason=reason,
                       row_hash=state_hash(a_neu))
        _append_ledger("dispute", id_b, by="system", other=id_a, reason=reason,
                       row_hash=state_hash(b_neu))
    bus.emit("memory.dispute", a=id_a, b=id_b, reason=reason)


def touch(id: str, *, session_id: str = "", via: str = "search") -> None:
    """Abruf verstärkt: last_accessed, access_count += 1, strength += 1.0, access_log-Zeile."""
    now = paths.now_iso()
    with closing(connect()) as con, con:
        con.execute(
            "UPDATE memories SET last_accessed = ?, access_count = access_count + 1,"
            " strength = strength + 1.0 WHERE id = ?",
            (now, id),
        )
        con.execute(
            "INSERT INTO access_log (memory_id, session_id, at, via) VALUES (?,?,?,?)",
            (id, session_id, now, via),
        )


# --- Lesen / Rendern --------------------------------------------------------------------------
def render(entry: dict) -> str:
    """Genau die gemessene Zeile: [Datum] [Quelle: …] [Vertrauen: 0,8] Text (95,0 % gegen 0,0 %).

    Datum = valid_from[:10], sonst recorded_at[:10]; Vertrauen mit deutschem Komma und einer
    Nachkommastelle; Text = body, bei leerem body der Titel.
    """
    datum = (entry.get("valid_from") or entry.get("recorded_at") or "")[:10]
    trust_de = f"{float(entry.get('trust') or 0.0):.1f}".replace(".", ",")
    text = " ".join((entry.get("body") or entry.get("title") or "").splitlines())
    return f"[{datum}] [Quelle: {entry.get('source', '')}] [Vertrauen: {trust_de}] {text}"


def render_many(entries: list[dict]) -> str:
    """Eine Zeile je Eintrag; Zeilenumbrüche im Text werden zu Leerzeichen, damit die Zeile Zeile bleibt."""
    return "\n".join(" ".join(render(e).splitlines()) for e in entries)


def stats() -> dict:
    """Zähler: gesamt, je status, je kind, je source."""
    with closing(connect()) as con:
        def by(col: str) -> dict:
            return {r[0]: r[1] for r in con.execute(
                f"SELECT {col}, COUNT(*) FROM memories GROUP BY {col}")}  # noqa: S608 — col aus festem Satz
        total = con.execute("SELECT COUNT(*) FROM memories").fetchone()[0]
        return {"gesamt": total, "status": by("status"), "kind": by("kind"), "source": by("source")}
