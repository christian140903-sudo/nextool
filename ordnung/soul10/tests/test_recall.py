"""Abruf: Briefing hält die Zeilengrenze, trägt Etikett und Regel, Rang folgt Vertrauen, Ebenen sehen weniger."""
import math
import re

from core import bus
from core.memory import ledger, recall

ETIKETT = re.compile(r"^\[\d{4}-\d{2}-\d{2}\] \[Quelle: [a-z_]+\] \[Vertrauen: \d,\d\] \S")


def _nutzer(body, **kw):
    kw.setdefault("source", "nutzer")
    kw.setdefault("source_ref", "Zitat")
    return ledger.remember(kw.pop("title", body[:40]), body, **kw)


def _eintragszeilen(text):
    """Alle Zeilen zwischen Kopf und Regel, die ein Eintrag sein müssen (kein Kopf, kein Abschnitt)."""
    ohne_regel = text.split(ledger.REGEL_HERKUNFT)[0] if ledger.REGEL_HERKUNFT in text else text
    return [z for z in ohne_regel.splitlines()[1:] if z and not z.startswith("#")]


# --- Retention und Rang ----------------------------------------------------------------------------
def test_retention_formel():
    e = {"recorded_at": "2026-09-01T00:00:00Z", "last_accessed": None, "strength": 1.0}
    assert recall.retention(e, now="2026-09-01T00:00:00Z") == 1.0
    assert math.isclose(recall.retention(e, now="2026-09-02T00:00:00Z"), math.exp(-1))
    e["strength"] = 4.0
    assert math.isclose(recall.retention(e, now="2026-09-05T00:00:00Z"), math.exp(-1))
    e["last_accessed"] = "2026-09-05T00:00:00Z"  # Abruf verschiebt den Bezugspunkt
    assert recall.retention(e, now="2026-09-05T00:00:00Z") == 1.0
    # strength unter 1 wird auf 1 angehoben; ohne Zeitangabe zählt der Eintrag als frisch.
    assert math.isclose(recall.retention({"recorded_at": "2026-09-01T00:00:00Z", "strength": 0.0},
                                         now="2026-09-02T00:00:00Z"), math.exp(-1))
    assert recall.retention({"strength": 3.0}) == 1.0


def test_rang_bevorzugt_hoeheres_vertrauen_bei_gleichem_text():
    text = "Ausgeliefert wird ausschliesslich vom Branch release-stabil."
    schwach = ledger.remember("Branch", text, source="eigener_schluss")          # 0,4
    stark = _nutzer(text, title="Branch")                                          # 0,8
    treffer = recall.search("Branch release-stabil")
    assert [t["id"] for t in treffer] == [stark, schwach]
    assert treffer[0]["rank"] > treffer[1]["rank"]
    # Jeder Treffer wurde berührt, der Bus weiß davon.
    assert ledger.get(stark)["access_count"] == 1 and ledger.get(schwach)["access_count"] == 1
    assert [e for e in bus.tail(10) if e["event"] == "memory.search"][-1]["n"] == 2


def test_search_filter_und_leere_anfrage():
    a = _nutzer("Das Backup laeuft alle sechs Stunden.", kind="fact", mission_id="m1")
    b = ledger.remember("Backup", "Das Backup laeuft einmal taeglich.", source="eigener_schluss", kind="episode")
    _nutzer("Das Backup ist geheim.", visibility="never")
    assert recall.search("") == []
    assert {t["id"] for t in recall.search("Backup")} == {a, b}
    assert [t["id"] for t in recall.search("Backup", min_trust=0.5)] == [a]
    assert [t["id"] for t in recall.search("Backup", kinds=("episode",))] == [b]
    assert [t["id"] for t in recall.search("Backup", mission_id="m1")] == [a]
    ledger.transition(b, "archived")
    assert [t["id"] for t in recall.search("Backup")] == [a]
    assert {t["id"] for t in recall.search("Backup", status=("active", "archived"))} == {a, b}
    assert recall.search("Wort, das (nirgends) steht!") == []


# --- Briefing --------------------------------------------------------------------------------------
def test_briefing_haelt_60_zeilen_bei_200_eintraegen_mit_regel_und_etikett():
    for i in range(200):
        _nutzer(f"Lieferung Nummer {i} ist vollstaendig eingetroffen.", importance=1 + i % 5)
    text = recall.briefing()
    zeilen = text.split("\n")
    assert len(zeilen) <= 60
    assert zeilen[0].startswith("# Soul-10-Briefing (")
    assert text.endswith(ledger.REGEL_HERKUNFT)
    eintraege = _eintragszeilen(text)
    assert len(eintraege) >= 40
    assert all(ETIKETT.match(z) for z in eintraege), [z for z in eintraege if not ETIKETT.match(z)][:3]
    # Die gezeigten Einträge wurden berührt (Abruf verstärkt), der Bus meldet Zeilen und Einträge.
    rec = [e for e in bus.tail(5) if e["event"] == "memory.briefing"][-1]
    assert rec["entries"] == len(eintraege) and rec["lines"] == len(zeilen)


def test_briefing_kuerzt_eintraege_nie_die_regel():
    for i in range(30):
        _nutzer(f"Zugangskarte {i} wurde neu ausgestellt.")
    text = recall.briefing(max_lines=8, extra_sections=[("Offene Vertraege", ["c-1: Ziel A", "c-2: Ziel B"])])
    zeilen = text.split("\n")
    assert len(zeilen) <= 8
    assert text.endswith(ledger.REGEL_HERKUNFT)
    assert "## Offene Vertraege" in zeilen and "c-1: Ziel A" in zeilen
    # Noch enger: Regel bleibt ganz, der Kopf bleibt, alles andere weicht. Boden: Kopf + Regel = 6.
    eng = recall.briefing(max_lines=5)
    assert eng.split("\n")[0].startswith("# Soul-10-Briefing") and eng.endswith(ledger.REGEL_HERKUNFT)
    assert len(eng.split("\n")) == 6 and "Zugangskarte" not in eng
    genau = recall.briefing(max_lines=6)
    assert len(genau.split("\n")) == 6
    ohne = recall.briefing(with_rule=False, max_lines=10)
    assert "Herkunftsregeln" not in ohne and len(ohne.split("\n")) <= 10


def test_briefing_laesst_never_und_inaktive_und_verblasste_weg(monkeypatch):
    sichtbar = _nutzer("Die Poststelle schliesst um sechzehn Uhr.")
    geheim = _nutzer("Der Tresorcode steht im Safe.", visibility="never")
    archiv = _nutzer("Der Aufzug wird im November geprueft.")
    ledger.transition(archiv, "archived")
    kandidat = ledger.remember("Fund", "Der Newsletter erscheint alle zwei Wochen.", source="import")
    verblasst = _nutzer("Die Kantine bietet dienstags ein vegetarisches Gericht an.")
    monkeypatch.setattr(recall, "retention", lambda e, now=None: 0.0 if e["id"] == verblasst else 1.0)
    text = recall.briefing()
    assert "Poststelle" in text
    for wort in ("Tresorcode", "Aufzug", "Newsletter", "Kantine"):
        assert wort not in text
    assert ledger.get(sichtbar)["access_count"] == 1 and ledger.get(geheim)["access_count"] == 0


def test_briefing_ohne_selfmodel_modul_laeuft(monkeypatch):
    import builtins
    echt = builtins.__import__

    def kein_selfmodel(name, *a, **kw):
        if name.endswith("selfmodel") or (a and a[2] and "selfmodel" in a[2]):
            raise ImportError("selfmodel fehlt")
        return echt(name, *a, **kw)

    monkeypatch.setattr(builtins, "__import__", kein_selfmodel)
    _nutzer("Protokolle werden im Format Markdown gefuehrt.")
    text = recall.briefing()
    assert "Markdown" in text and "Selbstmodell" not in text


def test_briefing_nutzt_selfmodel_wenn_vorhanden(monkeypatch):
    import sys
    import types
    fake = types.ModuleType("core.memory.selfmodel")
    fake.render = lambda name=None, max_lines=15: "# Selbstmodell: namensoffen\n" + "\n".join(f"Zug {i}" for i in range(20))
    monkeypatch.setitem(sys.modules, "core.memory.selfmodel", fake)
    _nutzer("Zur Zeiterfassung wird Zeitwerk genutzt.")
    zeilen = recall.briefing().split("\n")
    assert zeilen[1] == "# Selbstmodell: namensoffen"
    assert sum(1 for z in zeilen if z.startswith("Zug ")) == 9  # ≤ 10 Zeilen Selbstmodell
    assert any("Zeitwerk" in z for z in zeilen)


# --- Ebenen-Sicht ------------------------------------------------------------------------------------
def test_ebene_3_sieht_kein_self_und_keinen_nutzer_und_keine_regel():
    selbst = _nutzer("Ich pruefe Ergebnisse zweimal.", kind="self", mission_id="m1")
    ledger.transition(selbst, "active")
    _nutzer("Chriso bevorzugt kurze Antworten.", kind="user", mission_id="m1")
    _nutzer("Das Projekt Ordnung nutzt PostgreSQL als Datenbank.", kind="fact", mission_id="m1")
    _nutzer("Vor dem Commit laufen die Tests.", kind="procedure", mission_id="m1")
    _nutzer("Die Jahresklausur findet in Graz statt.", kind="fact", mission_id="m2")
    _nutzer("Der Drucker wurde kalibriert.", kind="episode", mission_id="m1")
    text = recall.level_view(3, mission_id="m1")
    assert text.startswith("# Soul-10-Sicht Ebene 3")
    assert "PostgreSQL" in text and "Commit" in text
    for wort in ("zweimal", "Chriso", "Graz", "Drucker", "Herkunftsregeln"):
        assert wort not in text
    assert all(ETIKETT.match(z) for z in _eintragszeilen(text))
    assert len(text.split("\n")) <= 15


def test_ebene_2_sieht_mission_und_regel_ebene_1_das_briefing():
    _nutzer("Das Projekt Ordnung nutzt PostgreSQL als Datenbank.", kind="fact", mission_id="m1")
    _nutzer("Die Jahresklausur findet in Graz statt.", kind="fact", mission_id="m2")
    zwei = recall.level_view(2, mission_id="m1", max_lines=12)
    assert "PostgreSQL" in zwei and "Graz" not in zwei and zwei.endswith(ledger.REGEL_HERKUNFT)
    assert len(zwei.split("\n")) <= 12
    eins = recall.level_view(1)
    assert eins.startswith("# Soul-10-Briefing (") and "Graz" in eins and "PostgreSQL" in eins
    sichten = [e for e in bus.tail(20) if e["event"] == "memory.level_view"]
    assert sichten and sichten[-1]["level"] == 2 and sichten[-1]["mission_id"] == "m1"
