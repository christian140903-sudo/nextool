"""Rückbau: Zurückziehen quarantiniert die ganze Ableitungskette, Unbeteiligte bleiben, G5 = 1.0."""
import pytest

from core import bus
from core.memory import ledger, retract
from core.memory.ledger import LedgerError


def _eintrag(title, body, derived_from=(), **kw):
    kw.setdefault("source", "nutzer")
    kw.setdefault("source_ref", f"Chriso, 2026-08-14: „{body}“")
    return ledger.remember(title, body, derived_from=derived_from, **kw)


def _kette():
    """A → B → C (jeder aus dem vorigen abgeleitet) und ein unbeteiligter D mit Kind E."""
    a = _eintrag("A", "Die Datenbank heißt PostgreSQL.")
    b = _eintrag("B", "Wir brauchen einen PostgreSQL-Treiber.", derived_from=[a])
    c = _eintrag("C", "psycopg wird installiert.", derived_from=[b])
    d = _eintrag("D", "Der Newsletter erscheint zweiwöchentlich.")
    e = _eintrag("E", "Der nächste Newsletter kommt am Freitag.", derived_from=[d])
    return a, b, c, d, e


def test_kette_wird_quarantiniert_und_anteil_ist_eins():
    a, b, c, d, e = _kette()
    result = retract.retract(a, reason="Chriso: „wir nehmen doch SQLite“")
    assert result["target"] == a
    assert result["contaminated"] == [b, c]
    assert result["skipped"] == []
    assert ledger.get(a)["status"] == "retracted" and ledger.get(a)["retired_at"]
    assert ledger.get(b)["status"] == "quarantined"
    assert ledger.get(c)["status"] == "quarantined"
    assert retract.contamination_share() == 1.0


def test_unbeteiligte_bleiben_aktiv():
    a, b, c, d, e = _kette()
    retract.retract(a, reason="falsch")
    assert ledger.get(d)["status"] == "active"
    assert ledger.get(e)["status"] == "active"
    assert ledger.stats()["status"] == {"retracted": 1, "quarantined": 2, "active": 2}


def test_retractions_zeile_und_bus():
    a, b, c, d, e = _kette()
    result = retract.retract(a, reason="widerlegt", by="pruefer")
    zeilen = retract.list_retractions()
    assert len(zeilen) == 1
    zeile = zeilen[0]
    assert zeile["id"] == result["retraction_id"]
    assert zeile["target_id"] == a and zeile["reason"] == "widerlegt" and zeile["by"] == "pruefer"
    assert zeile["contaminated_ids"] == [b, c]
    ereignisse = bus.tail(5, event="memory.retract")
    assert ereignisse and ereignisse[-1]["id"] == a and ereignisse[-1]["contaminated"] == 2
    # Alle Statuswechsel liefen durch transition(): die Kette bleibt intakt.
    assert ledger.verify_chain()


def test_fail_closed_bei_unbekannter_id_grund_oder_doppelter_ruecknahme():
    a, b, c, d, e = _kette()
    with pytest.raises(LedgerError):
        retract.retract("gibt-es-nicht", reason="egal")
    with pytest.raises(LedgerError, match="ohne Grund"):
        retract.retract(a, reason="   ")
    # Nichts wurde verändert: B bleibt aktiv, keine retractions-Zeile.
    assert ledger.get(b)["status"] == "active"
    assert retract.list_retractions() == []
    retract.retract(a, reason="falsch")
    with pytest.raises(LedgerError, match="Illegaler Übergang"):
        retract.retract(a, reason="nochmal")
    assert len(retract.list_retractions()) == 1


def test_mehrere_eltern_und_bereits_quarantiniertes_glied():
    """B hängt an A und am unbeteiligten X; C hängt an B. Ein schon quarantiniertes Glied wird
    nicht doppelt verändert, seine Kinder werden trotzdem erreicht."""
    a = _eintrag("A", "Ausgangsannahme.")
    x = _eintrag("X", "Unabhängige Beobachtung.")
    b = _eintrag("B", "Folgerung aus A und X.", derived_from=[a, x])
    c = _eintrag("C", "Folgerung aus B.", derived_from=[b])
    ledger.transition(b, "quarantined", reason="vorab")
    result = retract.retract(a, reason="A war falsch")
    assert result["contaminated"] == [c]
    assert result["skipped"] == [{"id": b, "status": "quarantined"}]
    assert ledger.get(x)["status"] == "active"
    assert retract.contamination_share() == 1.0
    assert retract.descendants(a) == [b, c]


def test_anteil_ist_ehrlich_bei_archiviertem_kind():
    """Ein archiviertes Kind kennt keinen Übergang nach quarantined und kann nach active zurück:
    es zählt nicht als sauber, der Anteil sinkt unter 1.0 statt das Loch zu verdecken."""
    a = _eintrag("A", "Annahme.")
    b = _eintrag("B", "Folgerung, inzwischen archiviert.", derived_from=[a])
    c = _eintrag("C", "Folgerung aus B.", derived_from=[b])
    ledger.transition(b, "archived", reason="abgelaufen")
    result = retract.retract(a, reason="Annahme widerlegt")
    assert result["contaminated"] == [c]
    assert result["skipped"] == [{"id": b, "status": "archived"}]
    assert retract.contamination_share() == pytest.approx(0.5)
    letzte = bus.tail(1, event="memory.contamination_share")[0]
    assert letzte["children"] == 2 and letzte["clean"] == 1


def test_anteil_ohne_ruecknahme_ist_eins():
    _kette()
    assert retract.contamination_share() == 1.0
    a = _eintrag("Solo", "Ohne Kinder.")
    retract.retract(a, reason="falsch")
    assert retract.contamination_share() == 1.0
