"""Konsolidierung: Takt A (Inbox → Episoden), Takt B (Dubletten, Widerspruch, Ablauf, Retention, Selbst).

Befund: 93 Einträge in 47 Tagen, 5 vom Nutzer (D031, K §3) — ein Gedächtnis lebt nur, wenn der
Arbeitsfluss es mechanisch füttert; flaches Gedächtnis mit Rezenz als Sieger 0,0 % richtig /
73,3 % falsch (01-BEFUNDE A3) — deshalb entscheidet bei Widerspruch das Vertrauen, nie das Datum;
Vergessen als Retention exp(−Δt/strength), Archiv unter 0,1 (D032, R05 §3.3 Nr. 4).
Erz → Gold: SOUL-CLAUDE.md sagte „Stop konsolidiert", ohne Mechanismus (R14 S2); R05 §3.3 sah
Takt A mit einem Modellaufruf vor. Hier: Takt A ist reine Buchführung ohne Modell (Hooks schreiben
die Inbox, takt_a macht Episoden daraus), Takt B ordnet den Bestand mit den Regeln des Hauptbuchs
und darf nichts löschen — jede Änderung ist ein transition() und damit in der Hash-Kette.
Die adversariale Prüfung (ABNAHME §6) hat drei Löcher gezeigt, die hier geschlossen sind: der
Sieger eines Widerspruchs ist der stärkste AKTIVE Eintrag in Herkunftsordnung (SOURCE_RANK vor
Vertrauen) — ein Kandidat gewinnt nie, eigener_schluss löst nutzer nie ab; Selbst-Züge werden nicht
durch bloßen Widerspruch gestürzt (kein `self` in AUSSAGE_KINDS); und Takt B hat einen Aufrufer
außerhalb der CLI (Stop-Hook, gedrosselt über takt_b_faellig).
Die Schlussprüfung (2026-09-10) hat drei Löcher im neuen Code gezeigt, die hier geschlossen sind:
Widerspruch und Belegtheit rechnen über die Aussage-Arten hinweg (eine andere `kind` stellte eine
Dokumentregel neben die widersprechende Nutzeraussage); Takt A schreibt nie in den Namensraum der
Steuerung (eine Inbox-Zeile setzte sonst die Marke der Drossel und sperrte Takt B aus); und die
Idempotenz von Takt A hängt an der Zeilen-ID der Inbox, nicht am Inhalt (zwei echte Aufrufe
derselben Sekunde ergaben nur eine Episode).

Bezeichner deutsch (takt_a, takt_b, inbox_write nach ARCHITEKTUR 4.5), Kommentare deutsch.
"""
from __future__ import annotations

import json
import re
from contextlib import closing
from datetime import timedelta
from pathlib import Path
from typing import Iterable

from core import bus, paths
from core.memory import ledger
from core.memory.recall import retention  # EINE Retention-Formel (recall), keine zweite Fassung hier

__all__ = ["retention", "inbox_write", "takt_a", "takt_b", "takt_b_faellig", "letzter_takt_b"]

# Episoden aus Werkzeugaufrufen sind Arbeitsstände: Haltbarkeit „short", 14 Tage (R05 §3.3 Nr. 5).
EPISODE_TTL_TAGE = 14
# Rohe Werkzeugausgaben über 2 KB werden nicht gespeichert, nur ihr Anfang plus Hash (R05 §3.3 Nr. 6).
MAX_BODY_ZEICHEN = 2000
# Unter dieser Retention wandert ein Eintrag ohne aktive Ableitungen ins Archiv (D032).
ARCHIV_RETENTION = 0.1
# Unterverzeichnis, in das verarbeitete Inbox-Dateien wandern.
VERARBEITET = "verarbeitet"
# Gedächtnisarten, deren Titel eine Aussage benennt — nur dort ist ein anderer Body ein Widerspruch.
# Episoden haben Werkzeugtitel („Bash: ok"), die sich tausendfach wiederholen; sie widersprechen sich nicht.
# `self` fehlt absichtlich: ein Selbst-Zug wird nur durch höheres Vertrauen abgelöst, nie durch bloßen
# Widerspruch (ENTSCHEIDUNG §1); Belegschwelle und Beförderung gehören selfmodel.
AUSSAGE_KINDS = ("fact", "procedure", "user", "rejected")
# Kandidaten fremder Quellen (Quarantäne vor Aktivierung, ARCHITEKTUR 4.1 Nr. 6) werden nach dieser
# Frist aktiv, wenn kein aktiver Eintrag gleichen Titels etwas anderes sagt (die Art zählt nicht).
KANDIDAT_FRIST_TAGE = 1.0
# Aus dem Stop-Hook läuft Takt B höchstens einmal je Intervall; die Drossel liest das letzte Protokoll.
TAKT_B_INTERVALL_STUNDEN = 6.0
PROTOKOLL_REF = "consolidate:takt_b:"
# Marke der Inbox-Zeile am Episoden-Eintrag: daran hängt die Idempotenz von Takt A.
INBOX_TAG = "inbox:"
# Wer die Übergänge der Konsolidierung verantwortet (Feld `by` in ledger.jsonl).
BY = "consolidate"


# --- Zeit ------------------------------------------------------------------------------------
def _iso(dt) -> str:
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def _plus_tage(iso: str, tage: float) -> str:
    return _iso(paths.parse_iso(iso) + timedelta(days=tage))


def _normalisiere_zeit(text: str | None, fallback: str) -> str:
    """Eine Ereigniszeit in die Schreibweise des Hauptbuchs bringen; Unlesbares → fallback."""
    try:
        return _iso(paths.parse_iso(text or ""))
    except ValueError:
        return fallback


# --- Inbox -----------------------------------------------------------------------------------
def _sicherer_name(session_id: str) -> str:
    return re.sub(r"[^A-Za-z0-9_.-]", "_", session_id or "") or "unbekannt"


def _inbox_datei(session_id: str) -> Path:
    return paths.inbox_dir() / f"{_sicherer_name(session_id)}.jsonl"


def inbox_write(session_id: str, record: dict) -> None:
    """Eine Zeile nach inbox/<session_id>.jsonl (Hooks schreiben hier; ARCHITEKTUR 5.9 post-tool).

    Fail-open: eine kaputte Inbox hält keinen Hook an; der Fehler steht auf dem Bus.
    Fehlt `at`, gilt die Schreibzeit als Ereigniszeit.
    """
    try:
        zeile = dict(record or {})
        zeile.setdefault("at", paths.now_iso())
        # Zeilen-ID: die Idempotenz von Takt A hängt an der Zeile, nicht an ihrem Inhalt — zwei
        # echte Aufrufe derselben Sekunde bleiben zwei Episoden (Schlussprüfung 2026-09-10).
        zeile.setdefault("line_id", paths.new_id())
        zeile["session_id"] = session_id
        with _inbox_datei(session_id).open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(zeile, ensure_ascii=False, default=str) + "\n")
        bus.emit("memory.inbox.write", session_id=session_id, tool=zeile.get("tool"))
    except Exception as exc:  # noqa: BLE001 — Loggen ist fail-open
        bus.emit("memory.inbox.fehler", session_id=session_id, error=str(exc)[:200])


def _ganzzahl(wert, fallback: int) -> int:
    try:
        return int(wert)
    except (TypeError, ValueError):
        return fallback


def _zeilen_id(record: dict) -> str:
    """Die Zeilen-ID der Inbox, auf harmlose Zeichen gestutzt (sie kommt aus einer Datei, in die
    jeder Prozess schreiben darf) — leer, wenn die Zeile keine trägt (Datei vor dieser Fassung)."""
    return re.sub(r"[^A-Za-z0-9-]", "", str(record.get("line_id") or ""))[:64]


def _episode_felder(record: dict, session_id: str, now: str) -> dict:
    """Ein Inbox-Record → die Felder eines Episoden-Eintrags (noch nichts geschrieben).

    Der gebaute source_ref darf nie in den Namensraum der Steuerung fallen: PROTOKOLL_REF gehört
    Takt B allein. Sonst setzt eine einzige Inbox-Zeile die Marke der Drossel und sperrt Takt B
    dauerhaft aus (Schlussprüfung 2026-09-10); die Zeile wird abgelehnt, nicht stillschweigend
    umbenannt."""
    tool = str(record.get("tool") or "unbekannt").strip() or "unbekannt"
    outcome = str(record.get("outcome") or "").strip()
    summary = str(record.get("summary") or "")
    args_hash = str(record.get("args_hash") or "").strip()
    at = _normalisiere_zeit(record.get("at"), now)
    try:
        expires = _plus_tage(at, EPISODE_TTL_TAGE)
    except (OverflowError, ValueError):  # Ereigniszeit am Rand des Kalenders: die Schreibzeit zählt
        at = now
        expires = _plus_tage(now, EPISODE_TTL_TAGE)
    body = summary
    if len(body) > MAX_BODY_ZEICHEN:
        body = (body[:MAX_BODY_ZEICHEN]
                + f" … [gekürzt, sha256 {paths.sha256_text(summary)[:12]}]")
    tags = [t for t in (tool, outcome) if t]
    zeilen_id = _zeilen_id(record)
    if zeilen_id:
        tags.append(INBOX_TAG + zeilen_id)
    source_ref = f"{tool}:{args_hash}"
    if source_ref.startswith(PROTOKOLL_REF):
        raise ledger.LedgerError(
            f"Werkzeugverweis im Namensraum der Konsolidierung ({PROTOKOLL_REF}) abgelehnt")
    return dict(
        title=f"{tool}: {outcome}" if outcome else tool, body=body,
        kind="episode", source="werkzeug", source_ref=source_ref,
        importance=2, tags=tags, valid_from=at, ttl_class="short",
        expires_at=expires, status="active",
        mission_id=str(record.get("mission_id") or ""),
        level=_ganzzahl(record.get("level"), 1), agent=str(record.get("agent") or ""),
        session_id=session_id, model_id=str(record.get("model_id") or ""),
    )


def _schon_verbucht(session_id: str, felder: dict) -> bool:
    """Idempotenz von Takt A: die ZEILE der Inbox, nicht ihr Inhalt.

    Jede Zeile trägt seit inbox_write eine Zeilen-ID; sie steht als Tag `inbox:<id>` am Eintrag.
    Ein wiederholter Lauf derselben Datei (abgebrochener Lauf) bleibt dublettenfrei, zwei echte
    Werkzeugaufrufe derselben Sekunde bleiben zwei Episoden — der frühere Schlüssel aus Sitzung,
    Verweis, Ereigniszeit und Inhalt hat den zweiten verschluckt (Schlussprüfung 2026-09-10).
    Zeilen ohne ID (Datei aus einer älteren Fassung) fallen auf den früheren Schlüssel zurück.
    """
    marke = next((t for t in felder.get("tags") or [] if t.startswith(INBOX_TAG)), "")
    with closing(ledger.connect()) as con:
        if marke:
            row = con.execute(
                "SELECT 1 FROM memories WHERE kind = 'episode' AND session_id = ? AND tags LIKE ?"
                " LIMIT 1", (session_id, f'%"{marke}"%')).fetchone()
        else:
            row = con.execute(
                "SELECT 1 FROM memories WHERE kind = 'episode' AND session_id = ? AND source_ref = ?"
                " AND valid_from = ? AND body = ? LIMIT 1",
                (session_id, felder["source_ref"], felder["valid_from"], felder["body"])).fetchone()
    return row is not None


def _episode_aus_record(record: dict, session_id: str, now: str) -> str:
    """Ein Inbox-Record → ein Episoden-Eintrag. Wirft LedgerError, wenn ein Guard greift."""
    felder = _episode_felder(record, session_id, now)
    return ledger.remember(felder.pop("title"), felder.pop("body"), **felder)


def takt_a(session_id: str) -> dict:
    """Inbox → Episoden, ohne Modellaufruf. Danach wandert die Inbox-Datei nach inbox/verarbeitet/.

    Jede Zeile wird einzeln durch remember() geführt; greift dort ein Guard (Imperativ aus
    Werkzeugtext, Secret, Größe), zählt die Zeile als abgelehnt — fail-closed bleibt richtig,
    und der Rest der Inbox geht trotzdem durch. Jeder andere Fehler einer Zeile (Kalenderrand,
    gesperrte Datenbank) zählt als `fehler` mit Bus-Zeile; die Datei wandert in jedem Fall nach
    verarbeitet/, und _schon_verbucht hält eine Wiederholung frei von Dubletten.
    """
    datei = _inbox_datei(session_id)
    ergebnis = {"session_id": session_id, "episoden": 0, "abgelehnt": 0, "unlesbar": 0,
                "uebersprungen": 0, "fehler": 0, "ids": []}
    if not datei.exists():
        bus.emit("memory.takt_a", **{k: v for k, v in ergebnis.items() if k != "ids"}, inbox=False)
        return ergebnis
    now = paths.now_iso()
    for roh in datei.read_text(encoding="utf-8").splitlines():
        if not roh.strip():
            continue
        try:
            record = json.loads(roh)
            if not isinstance(record, dict):
                raise ValueError("Zeile ist kein Objekt")
        except ValueError as exc:
            ergebnis["unlesbar"] += 1
            bus.emit("memory.takt_a.unlesbar", session_id=session_id, error=str(exc)[:120])
            continue
        try:
            felder = _episode_felder(record, session_id, now)
            if _schon_verbucht(session_id, felder):
                ergebnis["uebersprungen"] += 1
                bus.emit("memory.takt_a.uebersprungen", session_id=session_id, tool=record.get("tool"))
                continue
            ergebnis["ids"].append(ledger.remember(felder.pop("title"), felder.pop("body"), **felder))
            ergebnis["episoden"] += 1
        except ledger.LedgerError as exc:
            ergebnis["abgelehnt"] += 1
            bus.emit("memory.takt_a.abgelehnt", session_id=session_id,
                     tool=record.get("tool"), grund=str(exc)[:160])
        except Exception as exc:  # noqa: BLE001 — eine kaputte Zeile hält die Inbox nicht auf; sie steht auf dem Bus
            ergebnis["fehler"] += 1
            bus.emit("memory.takt_a.fehler", session_id=session_id, tool=record.get("tool"),
                     error=f"{type(exc).__name__}: {str(exc)[:160]}")
    ziel_dir = paths.inbox_dir() / VERARBEITET
    ziel_dir.mkdir(parents=True, exist_ok=True)
    # Ein Suffix je Lauf: der Stop-Hook läuft je Zug derselben Sitzung, die Datei darf nichts überschreiben.
    datei.replace(ziel_dir / f"{_sicherer_name(session_id)}-{paths.new_id()}.jsonl")
    bus.emit("memory.takt_a", **{k: v for k, v in ergebnis.items() if k != "ids"}, inbox=True)
    return ergebnis


# --- Takt B ----------------------------------------------------------------------------------
def _normalisiert(text: str) -> str:
    """Vergleichsform: Kleinschreibung, nur Wortzeichen, ein Leerzeichen dazwischen."""
    return " ".join(re.findall(r"[^\W_]+", (text or "").lower()))


def _eintraege(statuses: Iterable[str], kinds: Iterable[str] | None = None) -> list[dict]:
    stati = tuple(statuses)
    sql = f"SELECT * FROM memories WHERE status IN ({','.join('?' * len(stati))})"
    params: list = list(stati)
    if kinds:
        arten = tuple(kinds)
        sql += f" AND kind IN ({','.join('?' * len(arten))})"
        params += list(arten)
    sql += " ORDER BY recorded_at, id"
    with closing(ledger.connect()) as con:
        rows = con.execute(sql, params).fetchall()
    return [ledger._row_to_dict(r) for r in rows]


def _dubletten() -> int:
    """(1) Kandidat mit gleichem normalisiertem Titel+Body wie ein aktiver Eintrag → archived."""
    aktiv = {(_normalisiert(e["title"]), _normalisiert(e["body"])) for e in _eintraege(("active",))}
    n = 0
    for k in _eintraege(("candidate",)):
        if (_normalisiert(k["title"]), _normalisiert(k["body"])) in aktiv:
            ledger.transition(k["id"], "archived", reason="dublette", by=BY)
            n += 1
    return n


def _staerke(e: dict) -> tuple[int, float]:
    """Standfestigkeit in Herkunftsordnung: erst SOURCE_RANK (nutzer/werkzeug > dokument >
    eigener_schluss/import/extern), dann Vertrauen. Das Datum kommt nicht vor."""
    return (ledger.SOURCE_RANK.get(e["source"], 0), float(e["trust"]))


def _weicht(verlierer: dict, sieger: dict) -> None:
    """Der schwächere Eintrag verlässt den Umlauf. Aktiv → superseded; ein Kandidat kennt diesen
    Übergang nicht (TRANSITIONS) und wird archiviert — gleicher Grund, gleiche Kette."""
    grund = (f"schwächere Herkunft ({verlierer['source']} {verlierer['trust']:.2f} unter "
             f"{sieger['source']} {sieger['trust']:.2f}) gegen {sieger['id']}")
    ziel = "superseded" if verlierer["status"] == "active" else "archived"
    ledger.transition(verlierer["id"], ziel, reason=grund, by=BY)


def _widersprueche() -> dict:
    """(2) Gleicher normalisierter Titel, anderer Body, active/candidate — über die Aussage-Arten
    hinweg (ARCHITEKTUR 4.5 Nr. 2). Die Art entscheidet nicht, ob zwei Sätze dieselbe Sache sagen:
    `kind` ist ein freies Feld des Aufrufers, und mit einer anderen Art stand eine Dokumentregel
    ungestört neben der widersprechenden Nutzeraussage im Briefing (Schlussprüfung 2026-09-10).
    Episoden und Selbst-Züge geraten nie in die Gruppierung (AUSSAGE_KINDS).

    Standfestigkeitsregel in Herkunftsordnung: der Sieger ist der stärkste AKTIVE Eintrag
    (_staerke: SOURCE_RANK, dann Vertrauen). Ein schwächerer aktiver Eintrag → superseded, ein
    gleich starker → beide disputed. Ein Kandidat gewinnt nie: schwächer → archived; gleich stark
    oder stärker → bleibt Kandidat und wird gemeldet (Bus memory.takt_b.kandidat_widerspricht) —
    sichtbar für den Nutzer, der entscheidet. Nur Kandidaten untereinander: nichts geschieht,
    keiner ist Wissen. Das Datum spielt keine Rolle — neuer heißt nicht wahrer (A3).
    """
    gruppen: dict[str, list[dict]] = {}
    for e in _eintraege(("active", "candidate"), kinds=AUSSAGE_KINDS):
        gruppen.setdefault(_normalisiert(e["title"]), []).append(e)
    abgeloest = umstritten = kandidaten = 0
    for mitglieder in gruppen.values():
        if len({_normalisiert(e["body"]) for e in mitglieder}) < 2:
            continue
        aktive = [e for e in mitglieder if e["status"] == "active"]
        if not aktive:
            continue
        # Stärkster zuerst; bei Gleichstand der ältere — nur für die Reihenfolge, nicht für den Sieg.
        aktive.sort(key=lambda e: (-_staerke(e)[0], -_staerke(e)[1], e["recorded_at"], e["id"]))
        sieger = aktive[0]
        for anderer in mitglieder:
            if anderer["id"] == sieger["id"] or _normalisiert(anderer["body"]) == _normalisiert(sieger["body"]):
                continue
            schwaecher = _staerke(anderer) < _staerke(sieger)
            if anderer["status"] == "candidate":
                if schwaecher:
                    _weicht(anderer, sieger)
                    abgeloest += 1
                else:
                    kandidaten += 1
                    bus.emit("memory.takt_b.kandidat_widerspricht", kandidat=anderer["id"],
                             aktiv=sieger["id"], quelle=anderer["source"], titel=anderer["title"][:80])
                continue
            if schwaecher:
                _weicht(anderer, sieger)
                abgeloest += 1
            else:
                ledger.dispute(sieger["id"], anderer["id"],
                               reason="gleiche Herkunft, gleiches Vertrauen, anderer Inhalt — kein Sieger durch Datum")
                umstritten += 1
    return {"abgeloest": abgeloest, "umstritten": umstritten, "kandidat_widerspricht": kandidaten}


def _aktivieren(now: str) -> dict:
    """(4b) Kandidaten der Aussage-Arten werden nach KANDIDAT_FRIST_TAGE aktiv, wenn zum Titel kein
    aktiver Eintrag existiert und die Kandidaten untereinander einig sind. Quarantäne vor
    Aktivierung heißt: Zeit und Widerspruchsfreiheit — nicht Vertrauen, das ein Dokument nicht hat.

    Belegt ist ein Titel, nicht ein Paar aus Art und Titel: die Art entscheidet nicht, ob eine
    Aussage schon besetzt ist, und sie steht dem Aufrufer frei (`soul remember --kind`). Mit dem
    Paar genügte eine andere Art, um eine Dokumentregel neben die widersprechende Nutzeraussage ins
    Briefing zu stellen (Schlussprüfung 2026-09-10). Episoden und Selbst-Züge sind hier nie dabei
    (AUSSAGE_KINDS). Die Guards laufen in ledger.transition erneut; ein Verstoß zählt als abgelehnt.
    """
    belegt = {_normalisiert(e["title"]) for e in _eintraege(("active",), kinds=AUSSAGE_KINDS)}
    gruppen: dict[str, list[dict]] = {}
    for k in _eintraege(("candidate",), kinds=AUSSAGE_KINDS):
        gruppen.setdefault(_normalisiert(k["title"]), []).append(k)
    aktiviert = abgelehnt = 0
    for schluessel, kandidaten in gruppen.items():
        if schluessel in belegt:
            continue
        if len({_normalisiert(k["body"]) for k in kandidaten}) > 1:
            bus.emit("memory.takt_b.kandidaten_uneins", kind=kandidaten[0]["kind"],
                     titel=kandidaten[0]["title"][:80], n=len(kandidaten))
            continue
        for k in kandidaten:
            try:
                tage = paths.days_between(k["recorded_at"], now)
            except ValueError:
                continue
            if tage < KANDIDAT_FRIST_TAGE:
                continue
            try:
                ledger.transition(k["id"], "active", by=BY,
                                  reason=f"Kandidat {tage:.1f} Tage ohne Widerspruch")
            except ledger.LedgerError as exc:
                abgelehnt += 1
                bus.emit("memory.takt_b.aktivierung_abgelehnt", id=k["id"], grund=str(exc)[:160])
                continue
            aktiviert += 1
            belegt.add(schluessel)
            break  # einer je Titel; die anderen sind Dubletten und gehen im nächsten Lauf ins Archiv
    return {"aktiviert": aktiviert, "aktivierung_abgelehnt": abgelehnt}


def _abgelaufen(now: str) -> int:
    """(3) expires_at überschritten → archived."""
    n = 0
    for e in _eintraege(("active", "candidate")):
        if not e.get("expires_at"):
            continue
        try:
            ueberschritten = paths.days_between(e["expires_at"], now) > 0
        except ValueError:
            bus.emit("memory.takt_b.unlesbare_zeit", id=e["id"], expires_at=e["expires_at"])
            continue
        if ueberschritten:
            ledger.transition(e["id"], "archived", reason="abgelaufen", by=BY)
            n += 1
    return n


def _verblasst(now: str) -> int:
    """(4) Retention < 0,1 und keine aktiven derived_from-Kinder → archived. Sichtbarkeit, nicht Löschung."""
    eltern_mit_aktivem_kind: set[str] = set()
    for kind_eintrag in _eintraege(("active",)):
        eltern_mit_aktivem_kind.update(kind_eintrag.get("derived_from") or [])
    n = 0
    for e in _eintraege(("active", "candidate")):
        if e["id"] in eltern_mit_aktivem_kind:
            continue
        r = retention(e, now)
        if r < ARCHIV_RETENTION:
            ledger.transition(e["id"], "archived", reason=f"verblasst (Retention {r:.3f})", by=BY)
            n += 1
    return n


def _selbst_befoerdern() -> int:
    """(5) Selbst-Kandidaten mit Belegschwelle → active (selfmodel.promote_eligible, lazy)."""
    try:
        from core.memory import selfmodel  # lazy: eigenes Nachbarmodul, Schnittstelle ARCHITEKTUR 4.6
    except ImportError:
        return 0
    return len(selfmodel.promote_eligible())


def letzter_takt_b() -> str | None:
    """Schreibzeit des letzten Takt-B-Protokolls aus dem Hauptbuch; None, wenn nie gelaufen.

    Drei Merkmale müssen zusammenkommen — Verweis im Namensraum PROTOKOLL_REF, Titel
    „Konsolidierung", agent BY. Takt A kommt in diesen Namensraum nicht hinein (_episode_felder
    lehnt solche Verweise ab), also kann keine Inbox-Zeile die Marke setzen und Takt B aussperren
    (Schlussprüfung 2026-09-10: eine gefälschte Zeile sperrte Widerspruchsauflösung, Ablauf,
    Dublettenräumung und Selbst-Beförderung dauerhaft aus).
    """
    with closing(ledger.connect()) as con:
        row = con.execute(
            "SELECT recorded_at FROM memories WHERE kind = 'episode' AND source_ref LIKE ?"
            " AND title = ? AND agent = ? ORDER BY recorded_at DESC, id DESC LIMIT 1",
            (PROTOKOLL_REF + "%", "Konsolidierung", BY)).fetchone()
    return row["recorded_at"] if row else None


def takt_b_faellig(now: str | None = None, *, intervall_stunden: float = TAKT_B_INTERVALL_STUNDEN) -> bool:
    """Die Drossel des Stop-Hooks: fällig, wenn nie gelaufen oder das letzte Protokoll älter als
    intervall_stunden ist. Der Zustand liegt in der Kette, nicht in einer Marke."""
    letzter = letzter_takt_b()
    if not letzter:
        return True
    try:
        return paths.days_between(letzter, now or paths.now_iso()) * 24.0 >= float(intervall_stunden)
    except ValueError:
        return True


def takt_b(now: str | None = None) -> dict:
    """Bestand ordnen, ohne Modellaufruf und ohne DELETE. Rückgabe: Zähler je Schritt.

    Reihenfolge wie ARCHITEKTUR 4.5, um die Aktivierung ergänzt: Dubletten, Widerspruch, Ablauf,
    Retention, Kandidaten-Aktivierung, Selbst. Zum Schluss ein Episoden-Eintrag „Konsolidierung"
    mit den Zahlen — visibility never: die Kette trägt ihn und `soul status` zählt ihn, aber er
    verdrängt keine Nutzerzeile aus dem Briefing (Prüfbefund C1: 14 Protokollzeilen je 14 Tage).
    """
    now = _normalisiere_zeit(now, paths.now_iso())
    zaehler = {"dubletten": _dubletten()}
    zaehler.update(_widersprueche())
    zaehler["abgelaufen"] = _abgelaufen(now)
    zaehler["verblasst"] = _verblasst(now)
    zaehler.update(_aktivieren(now))
    zaehler["selbst_aktiviert"] = _selbst_befoerdern()
    zeilen = ", ".join(f"{k} {v}" for k, v in zaehler.items())
    protokoll_id = ledger.remember(
        "Konsolidierung", f"Takt B am {now}: {zeilen}.",
        kind="episode", source="werkzeug", source_ref=f"{PROTOKOLL_REF}{now}",
        importance=1, tags=["konsolidierung"], valid_from=now, ttl_class="short",
        expires_at=_plus_tage(now, EPISODE_TTL_TAGE), agent=BY, visibility="never",
    )
    zaehler["protokoll_id"] = protokoll_id
    zaehler["now"] = now
    bus.emit("memory.takt_b", **{k: v for k, v in zaehler.items() if k != "now"})
    return zaehler
