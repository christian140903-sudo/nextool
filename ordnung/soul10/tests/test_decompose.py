"""Zerlegung: Klassifikation de/en, Kumulation und listenweiter Bezug verweigert, Alltagsformulierungen fallen nie auf „zerlegen",
Randbezug nur mit force, Chunk-Grenzen, Nahtprotokoll byte-gleich zu M2, merge zählt Fehlende, unplausible Arbeiterzahlen fehlen."""
import json
import re
import sys

import pytest

from core import bus, decompose, dirigent, model, paths


def _bus_events():
    return [r["event"] for r in bus.tail(200)]


# --- Klassifikation --------------------------------------------------------------------------
@pytest.mark.parametrize("bedingung", [
    "groesser als die Zahl davor",
    "gleich der vorherigen Zahl",
    "kleiner als die nachfolgende Zahl",
    "unmittelbar nach einer geraden Zahl",
    "kleiner als die naechste Zahl",
    "greater than the previous number",
    "immediately after an even number",
    "equal to the next value",
    "adjacent to a multiple of 5",
])
def test_nachbarbezug_de_en(bedingung):
    r = decompose.seam_check(bedingung)
    assert r["classes"] == ["neighbor"]
    assert r["decomposable"] is True and r["protocol"] == "naht" and r["empfehlung"] == "einzeln"


@pytest.mark.parametrize("bedingung", [
    "gerade; die allererste Zahl zaehlt nie mit",
    "ungerade und nicht die letzte Zahl der Liste",
    "steht an gerader Position",
    "steht an dritter Stelle oder ist durch 7 teilbar",
    "even, but the first number never counts",
    "odd and at an even index",
    "the last number is excluded",
])
def test_positionsbezug_de_en(bedingung):
    r = decompose.seam_check(bedingung)
    assert r["classes"] == ["position"]
    assert r["decomposable"] is True and r["protocol"] == "naht" and r["empfehlung"] == "einzeln"


@pytest.mark.parametrize("bedingung", [
    "groesser als die Summe aller bisherigen Zahlen",
    "groesser als der bisher groesste Wert",
    "ueber der laufenden Zwischensumme",
    "groesser als der Median der Liste",
    "kommt in der sortierten Liste vor Position 10",
    "hat den hoechsten Rang",
    "greater than the running sum so far",
    "above the cumulative average",
    "appears more than once in the list",
    "equal to the maximum of the list",
    "ranked in the top three",
])
def test_kumulationsbezug_de_en_verweigert(bedingung):
    r = decompose.seam_check(bedingung)
    assert "cumulative" in r["classes"]
    assert r["decomposable"] is False and r["protocol"] == "none"
    assert r["empfehlung"] == "nicht_zerlegbar" and "nicht zerlegbar" in r["reason"]
    with pytest.raises(decompose.DecomposeError):
        decompose.plan(list(range(20)), bedingung, parts=4)
    # auch force hebt eine Kumulation nicht auf
    with pytest.raises(decompose.DecomposeError):
        decompose.plan(list(range(20)), bedingung, parts=4, force=True)
    assert "decompose.refused" in _bus_events()


def test_kumulation_schlaegt_nachbar_und_position():
    r = decompose.seam_check("groesser als die Zahl davor und groesser als alle bisherigen")
    assert set(r["classes"]) == {"neighbor", "cumulative"}
    assert r["decomposable"] is False and r["empfehlung"] == "nicht_zerlegbar"


@pytest.mark.parametrize("bedingung", [
    "gerade", "durch 3 teilbar", "groesser als 50", "even", "divisible by 3",
    "greater than 50 and less than 90", "hat eine gerade Ziffernsumme",
    "in the range 10 to 20", "liegt zwischen 10 und 20",
])
def test_sauber_teilbar_ohne_protokoll(bedingung):
    r = decompose.seam_check(bedingung)
    assert r["classes"] == [] and r["decomposable"] is True
    assert r["protocol"] == "none" and r["empfehlung"] == "zerlegen"
    letzte = [json.loads(z) for z in paths.bus_file().read_text().splitlines()]
    pruef = [z for z in letzte if z["event"] == "decompose.seam_check"]
    assert pruef and pruef[-1]["empfehlung"] == "zerlegen" and pruef[-1]["protocol"] == "none"


def test_bus_traegt_zahlen_nicht_die_bedingung():
    decompose.seam_check("durch 3 teilbar und Zebrastreifen-frei")
    busz = paths.bus_file().read_text()
    assert "Zebrastreifen" not in busz and '"condition_chars": 38' in busz


def test_empfehlung_hat_genau_drei_werte():
    assert set(decompose.RECOMMENDATIONS) == {"zerlegen", "einzeln", "nicht_zerlegbar"}
    assert decompose.seam_check("gerade")["empfehlung"] == "zerlegen"
    assert decompose.seam_check("groesser als die Zahl davor")["empfehlung"] == "einzeln"
    assert decompose.seam_check("groesser als der Median")["empfehlung"] == "nicht_zerlegbar"


# --- Plan: Verweigerung und force -------------------------------------------------------------
def test_randbezug_ohne_force_verweigert():
    """M2: ein Agent 94 % gegen 72 % mit Naht — ohne force keine Zerlegung bei Randbezug."""
    with pytest.raises(decompose.DecomposeError) as exc:
        decompose.plan(list(range(1, 10)), "groesser als die Zahl davor", parts=3)
    assert "force=True" in str(exc.value) and "94 %" in str(exc.value)
    letzte = [json.loads(z) for z in paths.bus_file().read_text().splitlines()]
    verw = [z for z in letzte if z["event"] == "decompose.refused"]
    assert verw and verw[-1]["empfehlung"] == "einzeln" and verw[-1]["forced"] is False
    assert "decompose.plan" not in _bus_events()


def test_randbezug_mit_force_zerlegt_mit_naht():
    p = decompose.plan(list(range(1, 10)), "groesser als die Zahl davor", parts=3, force=True)
    assert p["protocol"] == "naht" and p["empfehlung"] == "einzeln" and p["forced"] is True
    assert p["parts"] == 3 and p["merge"] == "sum"
    assert all("GESAMTLISTE" in c["instruction"] for c in p["chunks"])
    letzte = [json.loads(z) for z in paths.bus_file().read_text().splitlines()]
    pl = [z for z in letzte if z["event"] == "decompose.plan"]
    assert pl and pl[-1]["forced"] is True and pl[-1]["protocol"] == "naht"


def test_sauber_teilbar_braucht_kein_force():
    p = decompose.plan(list(range(1, 10)), "gerade", parts=3)
    assert p["protocol"] == "none" and p["empfehlung"] == "zerlegen" and p["forced"] is False


# --- Chunk-Grenzen ----------------------------------------------------------------------------
def test_chunk_grenzen_offset_before_after():
    p = decompose.plan(list(range(1, 11)), "gerade", parts=3)
    assert p["protocol"] == "none" and p["merge"] == "sum" and p["parts"] == 3 and p["n_total"] == 10
    c = p["chunks"]
    assert [x["offset"] for x in c] == [0, 4, 8]
    assert [x["items"] for x in c] == [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10]]
    assert [x["before"] for x in c] == [None, 4, 8]
    assert [x["after"] for x in c] == [5, 9, None]
    assert [x["index"] for x in c] == [0, 1, 2]
    # ohne Protokoll: die schlichte Teilfrage, kein Nahttext
    assert c[0]["instruction"].startswith("Liste: 1, 2, 3, 4")
    assert "GESAMTLISTE" not in c[0]["instruction"]
    assert "decompose.plan" in _bus_events()


def test_erster_und_letzter_chunk_markiert_bei_naht():
    p = decompose.plan(list(range(1, 10)), "groesser als die Zahl davor", parts=3, force=True)
    assert p["protocol"] == "naht"
    first, mid, last = p["chunks"]
    assert "ANFANG der Gesamtliste" in first["instruction"]
    assert "ENDE der Gesamtliste" not in first["instruction"]
    assert "(Position 4) steht die Zahl 4" in first["instruction"]
    assert "Unmittelbar VOR diesem Ausschnitt (Position 3) steht die Zahl 3" in mid["instruction"]
    assert "Unmittelbar NACH diesem Ausschnitt (Position 7) steht die Zahl 7" in mid["instruction"]
    assert "ENDE der Gesamtliste" in last["instruction"]
    assert "ANFANG" not in last["instruction"]
    assert "die Positionen 7 bis 9" in last["instruction"]


def test_plan_lehnt_leere_liste_und_parts_null_ab():
    with pytest.raises(decompose.DecomposeError):
        decompose.plan([], "gerade", parts=2)
    with pytest.raises(decompose.DecomposeError):
        decompose.plan([1, 2, 3], "gerade", parts=0)


# --- Nahtprotokoll byte-gleich zur Prüfstrecke (M2) --------------------------------------------
def _lesart_zeilen(text: str) -> list[str]:
    zeilen = [z for z in text.splitlines() if z.startswith("- '")]
    assert len(zeilen) == 3
    return zeilen


@pytest.mark.parametrize("offset,before,after", [(0, None, 4), (3, 3, 7), (6, 6, None)])
def test_nahtprotokoll_byte_gleich_zu_zerlegung(offset, before, after):
    sys.path.insert(0, str(paths.repo_root() / "bewusstsein" / "harness"))
    import zerlegung  # noqa: E402
    items = list(range(offset + 1, offset + 4))
    bedingung = "gerade; die allererste Zahl zaehlt nie mit"
    soll = zerlegung._teil_frage_naht(items, bedingung, offset, 9, before, after)
    ist = decompose.chunk_instruction(items, bedingung, offset, 9, before, after)
    assert _lesart_zeilen(ist) == _lesart_zeilen(soll)
    assert ist == soll


def test_worker_system_byte_gleich_zur_pruefstrecke():
    src = (paths.repo_root() / "bewusstsein" / "harness" / "zerlegung.py").read_text(encoding="utf-8")
    assert f'"{decompose.WORKER_SYSTEM}"' in src


# --- merge -----------------------------------------------------------------------------------
def test_merge_zaehlt_fehlende():
    assert decompose.merge([3, None, 4]) == (7, 1)
    assert decompose.merge([None, None]) == (None, 2)
    assert decompose.merge([2, 5, 1], "max") == (5, 0)
    assert decompose.merge([2, None, 1], "min") == (1, 1)
    with pytest.raises(decompose.DecomposeError):
        decompose.merge([1], "median")


# --- run mit Fake-Modell ----------------------------------------------------------------------
_LISTE = re.compile(r"^(?:Ausschnitt|Liste): (.*)$", re.MULTILINE)


def _zaehlender_fake(pred, ausfall_index=None):
    aufrufe = []

    def _fake(system, user, **kw):
        aufrufe.append({"system": system, "user": user, **kw})
        zahlen = [int(z) for z in _LISTE.search(user).group(1).split(", ")]
        if ausfall_index is not None and len(aufrufe) - 1 == ausfall_index:
            return {"ok": True, "text": "Das kann ich nicht sagen."}
        return {"ok": True, "text": f"Gezaehlt.\n{sum(1 for z in zahlen if pred(z))}"}
    return _fake, aufrufe


def test_run_summiert_mit_fake_modell(monkeypatch):
    items = list(range(1, 31))
    fake, aufrufe = _zaehlender_fake(lambda z: z % 2 == 0)
    monkeypatch.setattr(model, "FAKE", fake)
    r = decompose.run(items, "gerade", parts=5, model="test-modell", thinking=0)
    assert r["value"] == 15 and r["calls"] == 5 and r["missing"] == 0
    assert r["protocol"] == "none" and r["empfehlung"] == "zerlegen" and r["chunks"] == 5
    assert len(aufrufe) == 5
    assert all(a["system"] == decompose.WORKER_SYSTEM and a["model"] == "test-modell" for a in aufrufe)
    letzte = [json.loads(z) for z in paths.bus_file().read_text().splitlines()]
    lauf = [z for z in letzte if z["event"] == "decompose.run"]
    assert lauf and lauf[-1]["calls"] == 5 and lauf[-1]["missing"] == 0 and lauf[-1]["protocol"] == "none"


def test_run_mit_naht_zaehlt_fehlende(monkeypatch):
    items = list(range(1, 21))
    fake, aufrufe = _zaehlender_fake(lambda z: z % 3 == 0, ausfall_index=1)
    monkeypatch.setattr(model, "FAKE", fake)
    r = decompose.run(items, "durch 3 teilbar, aber nicht die letzte Zahl", parts=4, force=True)
    assert r["protocol"] == "naht" and r["calls"] == 4 and r["missing"] == 1
    # 20 Zahlen, 6 durch 3 teilbar; Chunk 1 (6..10) traegt 6 und 9 → fehlt
    assert r["value"] == 4 and r["values"][1] is None
    assert all("GESAMTLISTE" in a["user"] for a in aufrufe)


def test_run_mit_naht_ohne_force_ruft_kein_modell(monkeypatch):
    fake, aufrufe = _zaehlender_fake(lambda z: True)
    monkeypatch.setattr(model, "FAKE", fake)
    with pytest.raises(decompose.DecomposeError):
        decompose.run(list(range(1, 21)), "nicht die letzte Zahl", parts=4)
    assert aufrufe == []
    assert "decompose.run" not in _bus_events()


def test_run_zaehlt_fehlgeschlagene_aufrufe_als_fehlend(monkeypatch):
    def _fake(system, user, **kw):
        return {"ok": False, "text": "", "error": "timeout"}
    monkeypatch.setattr(model, "FAKE", _fake)
    r = decompose.run(list(range(1, 11)), "gerade", parts=2)
    assert r["value"] is None and r["missing"] == 2 and r["calls"] == 2


# --- Gegenprobe: Alltagsformulierungen außerhalb der Wortliste (a1/a2, 2026-09-08) --------------
# (Bedingung, was sie wirklich ist). 56 von 58 gingen früher als „zerlegen" durch; mit exakt
# rechnendem Arbeiter lieferte run() 5 statt 1 — ohne Meldung. Keine davon darf „zerlegen"
# werden: übersehen heißt leise falsche Zahl, zu Unrecht erkannt kostet nur Parallelität.
# Listenweite Bezüge (Superlative, Anteile, Aggregate, Häufigkeit, Quantor + Nachbarwort,
# Reichweite über die Naht, Musterpositionen, lose Nachbarwörter) sind nicht zerlegbar — auch
# nicht per force: die Naht trägt nur einen Randwert je Seite.
ALLTAG = [
    ("groesser als alle anderen Zahlen der Liste", "cumulative"),
    ("greater than all other numbers in the list", "cumulative"),
    ("groesser als jede andere Zahl", "cumulative"),
    ("greater than every other number", "cumulative"),
    ("die zweitgroesste Zahl", "cumulative"),
    ("die drittkleinste Zahl", "cumulative"),
    ("the biggest number", "cumulative"),
    ("the greatest value", "cumulative"),
    ("in the top three", "cumulative"),
    ("in der oberen Haelfte", "cumulative"),
    ("in the upper half of all values", "cumulative"),
    ("above the mean", "cumulative"),
    ("ueber dem Schnitt", "cumulative"),
    ("groesser als die Summe der Liste geteilt durch 100", "cumulative"),
    ("greater than 1% of the total", "cumulative"),
    ("kleiner als das Produkt aller anderen", "cumulative"),
    ("kommt genau zweimal vor", "cumulative"),
    ("kommt doppelt vor", "cumulative"),
    ("kommt mehrfach vor", "cumulative"),
    ("occurs twice", "cumulative"),
    ("occurs only once", "cumulative"),
    ("erscheint genau einmal", "cumulative"),
    ("already appeared earlier in the list", "cumulative"),
    ("kam schon frueher vor", "cumulative"),
    ("gleich der Anzahl der geraden Zahlen", "cumulative"),
    ("equal to the count of even numbers", "cumulative"),
    ("groesser als alle Zahlen davor", "cumulative"),
    ("greater than all preceding numbers", "cumulative"),
    ("greater than the sum of all previous numbers", "cumulative"),
    ("groesser als alle folgenden Zahlen", "cumulative"),
    ("groesser als die Summe der beiden vorangehenden Zahlen", "cumulative"),
    ("greater than the number two positions before", "cumulative"),
    ("zwei gleiche Zahlen hintereinander", "cumulative"),
    ("zwei gleiche Zahlen nebeneinander", "cumulative"),
    ("two equal numbers in a row", "cumulative"),
    ("groesser als die uebernaechste Zahl", "cumulative"),
    ("in der zweiten Haelfte der Liste", "cumulative"),
    ("in the second half of the list", "cumulative"),
    ("jede zweite Zahl", "cumulative"),
    ("every third number", "cumulative"),
    ("every other number", "cumulative"),
    ("am Ende der Liste", "cumulative"),
    ("at the beginning of the list", "cumulative"),
    ("in der Mitte der Liste", "cumulative"),
    ("odd-indexed", "cumulative"),
    ("even-indexed", "cumulative"),
    ("greater than the number before it", "randbezug"),
    ("smaller than the number after it", "randbezug"),
    ("groesser als die Zahl vorher", "randbezug"),
    ("groesser als die Zahl dahinter", "randbezug"),
    ("groesser als die Zahl links davon", "randbezug"),
    ("the same as the prior number", "randbezug"),
    ("the same as the subsequent number", "randbezug"),
    ("differs from the number before by 1", "randbezug"),
    ("gleich der Zahl, die ihr folgt", "randbezug"),
    ("gleich der Zahl, die ihr vorausgeht", "randbezug"),
    ("die dritte Zahl der Liste", "randbezug"),
    ("the third number of the list", "randbezug"),
]


@pytest.mark.parametrize("bedingung,art", ALLTAG, ids=lambda x: x[:40])
def test_alltagsformulierung_faellt_nie_auf_zerlegen(bedingung, art):
    r = decompose.seam_check(bedingung)
    assert r["classes"] and r["empfehlung"] != "zerlegen", (r["classes"], r["empfehlung"])
    assert r["empfehlung"] in ("einzeln", "nicht_zerlegbar")
    with pytest.raises(decompose.DecomposeError):
        decompose.plan(list(range(1, 21)), bedingung, parts=4)
    if art == "cumulative":
        assert r["decomposable"] is False and r["empfehlung"] == "nicht_zerlegbar"
        assert "cumulative" in r["classes"] or "global" in r["classes"]
        with pytest.raises(decompose.DecomposeError):
            decompose.plan(list(range(1, 21)), bedingung, parts=4, force=True)


def test_listenweiter_bezug_traegt_klasse_global_und_grund():
    r = decompose.seam_check("the biggest number")
    assert r["classes"] == ["global"] and r["hits"]["global"] == ["biggest"]
    assert r["decomposable"] is False and r["protocol"] == "none" and r["empfehlung"] == "nicht_zerlegbar"
    assert "listenweiter Bezug" in r["reason"] and "nicht zerlegbar" in r["reason"]
    letzte = [json.loads(z) for z in paths.bus_file().read_text().splitlines()]
    pruef = [z for z in letzte if z["event"] == "decompose.seam_check"]
    assert pruef[-1]["classes"] == ["global"] and pruef[-1]["empfehlung"] == "nicht_zerlegbar"
    # Quantor + Nachbarwort ist Kumulation, nicht bloß Nachbar
    r = decompose.seam_check("groesser als alle Zahlen davor")
    assert "global" in r["classes"] and r["decomposable"] is False


@pytest.mark.parametrize("bedingung", [
    "gerade", "ungerade", "durch 3 teilbar", "groesser als 50", "kleiner als 10", "even", "odd", "divisible by 3",
    "prime", "Primzahl", "eine Quadratzahl", "a perfect square", "hat eine gerade Quersumme",
    "digit sum divisible by 3", "endet auf 7", "ends with 7", "hat drei Ziffern", "has at least 3 digits",
    "liegt zwischen 10 und 20", "in the range 10 to 20", "negativ", "positive", "durch 2 oder 3 teilbar",
    "ungerade und groesser als 10", "ein Vielfaches von 5", "a multiple of 5", "enthaelt die Ziffer 3",
    "contains the digit 3", "is a power of two", "eine Zweierpotenz", "gleich 7", "equals 7", "ungleich 7",
])
def test_elementlokales_praedikat_bleibt_zerlegbar(bedingung):
    """Die konservative Klasse darf die sauber teilbaren Bedingungen (100 % gegen 83–89 %) nicht fressen."""
    r = decompose.seam_check(bedingung)
    assert r["classes"] == [] and r["empfehlung"] == "zerlegen" and r["protocol"] == "none"


# --- Gegenprobe zur Gegenprobe: sauber teilbar in ganzen Sätzen (Schlussprüfung a1, 2026-09-10) --
# Die Stichwortliste oben konnte Überblockung nicht entdecken — sie enthält keinen Satzbau. Diese
# 40 Bedingungen sind ausformuliert und JEDE ist ohne Wissen über andere Listenelemente
# entscheidbar. Vor dem Fix fielen 23 davon (57 %) auf „nicht_zerlegbar", darunter die kanonischste
# Form der gemessenen Aufgabe selbst. Ein Fehlalarm ist keine harmlose Vorsicht: er kostet die
# Zerlegung (100 %) und schickt die Aufgabe an einen Agenten (94 %; über EINZELN_MAX_ZEICHEN
# bekommt der die Gesamtliste, 83–89 %). Die Quote ist auf 0 festgenagelt.
SAUBER_SATZ = [
    "Zaehle alle Zahlen in der Liste, die durch 3 teilbar sind",
    "count all numbers in the list that are odd",
    "alle Zahlen der Liste, die groesser als 100 sind",
    "Zahlen mit einer geraden Anzahl von Ziffern",
    "numbers with an even number of digits",
    "Zahlen, die doppelt so gross wie 20 sind",
    "Zahlen, die dreimal so gross wie 7 sind",
    "Zahlen mit einer 0 am Ende",
    "numbers with a zero at the end",
    "Zahlen, in denen die Ziffer 7 vorkommt",
    "Zahlen, die mindestens einmal die Ziffer 5 enthalten",
    "numbers that contain the digit 3 at least once",
    "Zahlen, die das Produkt von zwei Primzahlen sind",
    "numbers that are the sum of two squares",
    "Zaehle in der gesamten Liste die geraden Zahlen",
    "Zahlen mit insgesamt drei Ziffern",
    "numbers with a total of three digits",
    "Zahlen, deren mittlere Ziffer eine 5 ist",
    "Zahlen, die in der Mitte eine 0 haben",
    "Zahlen, die genau die Haelfte von 50 sind",
    "numbers greater than half of 200",
    "Zahlen, die ein Viertel von 100 sind",
    "Zahlen, deren Ziffern sich mehrfach wiederholen",
    "Zahlen, deren Quersumme kleiner als 10 ist",
    "Zahlen zwischen 10 und 99",
    "Zahlen, die keine Primzahl sind",
    "Zahlen, die durch 3 und durch 5 teilbar sind",
    "Zahlen, die negativ sind",
    "Zahlen, die auf eine 0 enden",
    "numbers ending in zero",
    "numbers that are a multiple of 5",
    "numbers divisible by 3",
    "count every number that is even",
    "numbers between 10 and 20",
    "numbers whose digits are strictly increasing",
    "numbers that are prime",
    "numbers larger than 50",
    "Zahlen mit genau zwei verschiedenen Ziffern",
    "Zahlen, die eine Quadratzahl sind",
    "Zahlen, die als roemische Ziffer schreibbar sind",
]


def test_sauber_teilbare_saetze_werden_nicht_ueberblockt():
    """Fehlalarmquote auf dem 40er-Satz: 0 (vor dem Fix 23 = 57 %)."""
    assert len(SAUBER_SATZ) == 40
    falsch = [(b, decompose.seam_check(b)) for b in SAUBER_SATZ]
    fehlalarm = [(b, r["empfehlung"], r["hits"]) for b, r in falsch if r["empfehlung"] != "zerlegen"]
    assert fehlalarm == [], f"{len(fehlalarm)}/40 Fehlalarm: {fehlalarm}"
    # und die Zerlegung läuft wirklich an (kein DecomposeError vor dem ersten Aufruf)
    p = decompose.plan(list(range(1, 61)), SAUBER_SATZ[0], parts=5)
    assert p["empfehlung"] == "zerlegen" and p["protocol"] == "none" and p["parts"] == 5
    d = dirigent.plan(list(range(1, 61)), SAUBER_SATZ[0], parts=5)
    assert d["form"] == "zerlegt" and d["empfehlung"] == "zerlegen"


# Je Alternative der GLOBAL_RE ein Beispiel, das NUR sie trifft. Löscht jemand eine Alternative,
# fällt ihr Beispiel durch alle Muster und dieser Test wird rot (Schlussprüfung, Befund 7: von den
# 119 Alternativen der alten GLOBAL_RE ließen sich 90 löschen, ohne dass ein Test rot wurde).
GLOBAL_BEISPIEL = {
    "ordnungssuperlativ": "die zweitgroesste Zahl",
    "superlativ_en": "the biggest number",
    "extremwert": "gleich dem maximalen Wert",
    "top_n": "in the top three",
    "anteil_de": "in der oberen Haelfte",
    "anteil_en": "in the upper half of all values",
    "mittelwert": "above the mean",
    "prozent": "greater than 1% of the total",
    "summe_liste": "groesser als die Summe der Liste geteilt durch 100",
    "produkt_liste": "kleiner als das Produkt aller Werte",
    "anzahl_liste": "gleich der Anzahl der geraden Zahlen",
    "vorkommen": "kommt doppelt vor",
    "schon_dagewesen": "steht schon in der Liste",
    "zeitbezug": "gleich dem Wert von frueher",
    "anderswo": "taucht anderswo auf",
    "quantor_bezug": "groesser als jede andere Zahl",
    "rest": "groesser als der Rest",
    "reihenfolge_lauf": "zwei gleiche Zahlen hintereinander",
    "uebernaechste": "groesser als die uebernaechste Zahl",
    "n_positionen_weiter": "greater than the number two positions before",
    "beide_nachbarn": "groesser als die beiden vorangehenden Zahlen",
    "jede_nte": "jede zweite Zahl",
    "indexparitaet": "odd-indexed",
    "rand_der_liste": "am Ende der Liste",
    "mitte_der_liste": "in der Mitte der Liste",
    "nachbarwort_de": "groesser als die Zahl dahinter",
    "nachbarwort_en": "greater than the number before it",
}


def test_jede_globale_alternative_traegt_ein_eigenes_beispiel():
    namen = [n for n, _ in decompose._GLOBAL_PARTS]
    assert sorted(namen) == sorted(GLOBAL_BEISPIEL), "Alternative ohne Beispiel oder Beispiel ohne Alternative"
    einzeln = {n: re.compile(r"\b(?:" + m + r")\b", re.IGNORECASE) for n, m in decompose._GLOBAL_PARTS}
    for name, beispiel in GLOBAL_BEISPIEL.items():
        treffer = [n for n, rx in einzeln.items() if rx.search(beispiel)]
        assert treffer == [name], f"{name}: {beispiel!r} trifft {treffer}"
        assert decompose.GLOBAL_RE.search(beispiel), f"{name}: {beispiel!r} faellt durch GLOBAL_RE"
        assert decompose.seam_check(beispiel)["empfehlung"] == "nicht_zerlegbar"


def test_uebersehene_kumulation_liefert_keine_stille_falsche_zahl(monkeypatch):
    """a2: exakt rechnender Arbeiter je Ausschnitt, Liste 1..50, wahr 1 — run() lieferte 5, missing 0,
    dirigent.plan form=zerlegt. Jetzt: Verweigerung vor dem ersten Aufruf, Dirigent wählt einen Agenten."""
    aufrufe = []

    def fake_max(system, user, **kw):
        aufrufe.append(user)
        zahlen = [int(z) for z in _LISTE.search(user).group(1).split(", ")]
        return {"ok": True, "text": str(sum(1 for z in zahlen if all(z > o for o in zahlen if o is not z)))}
    monkeypatch.setattr(model, "FAKE", fake_max)
    cond = "groesser als alle anderen Zahlen der Liste"
    with pytest.raises(decompose.DecomposeError) as exc:
        decompose.run(list(range(1, 51)), cond, parts=5)
    assert "nicht zerlegbar" in str(exc.value) and aufrufe == []
    assert "decompose.run" not in _bus_events() and "decompose.refused" in _bus_events()
    p = dirigent.plan(list(range(1, 51)), cond, parts=5)
    assert p["form"] == "einzeln" and p["empfehlung"] == "nicht_zerlegbar" and p["forced"] is False
    # Quantor + Nachbarwort auf einer Liste > 4000 Zeichen: früher force=True mit Naht → 4 statt 2
    cond2 = "greater than the sum of all previous numbers"
    items2 = list(range(1, 1500))
    p2 = dirigent.plan(items2, cond2, parts=5)
    assert p2["chars"] > dirigent.EINZELN_MAX_ZEICHEN
    assert p2["form"] == "einzeln" and p2["forced"] is False and "global" in p2["classes"]
    with pytest.raises(decompose.DecomposeError):
        decompose.run(items2, cond2, parts=5, force=True)
    assert aufrufe == []


# --- Plausibilität der Arbeiterzahl (a3) -------------------------------------------------------
@pytest.mark.parametrize("antwort", ["12", "-3", "2.5", "Von den 3 Zahlen sind es 2, naemlich 8 und 9"])
def test_unplausible_arbeiterzahl_zaehlt_als_fehlend(monkeypatch, antwort):
    """a3: 2 Ausschnitte à 3 Zahlen, wahr 3 — „12" ergab 24, „-3" ergab −6, „2.5" ergab 5.0, „… 8 und 9"
    ergab 18, jeweils missing 0 und damit für den Dirigenten ein Erfolg."""
    monkeypatch.setattr(model, "FAKE", lambda s, u, **kw: {"ok": True, "text": antwort})
    r = decompose.run([1, 2, 3, 4, 5, 6], "gerade", parts=2)
    assert r["value"] is None and r["missing"] == 2 and r["values"] == [None, None] and r["calls"] == 2
    letzte = [json.loads(z) for z in paths.bus_file().read_text().splitlines()]
    impl = [z for z in letzte if z["event"] == "decompose.implausible"]
    assert [z["index"] for z in impl] == [0, 1] and all(z["items"] == 3 for z in impl)
    assert impl[-1]["value"] == model.extract_last_number(antwort)
    lauf = [z for z in letzte if z["event"] == "decompose.run"]
    assert lauf[-1]["missing"] == 2 and lauf[-1]["value"] is None


def test_plausible_anzahl_bleibt_anzahl(monkeypatch):
    monkeypatch.setattr(model, "FAKE", lambda s, u, **kw: {"ok": True, "text": "Position 7 bis 9: alle 3"})
    r = decompose.run([1, 2, 3, 4, 5, 6], "gerade", parts=2)
    assert r["value"] == 6 and r["missing"] == 0
    monkeypatch.setattr(model, "FAKE", lambda s, u, **kw: {"ok": True, "text": "0"})
    r = decompose.run([1, 2, 3, 4, 5, 6], "gerade", parts=2)
    assert r["value"] == 0 and r["missing"] == 0
    assert "decompose.implausible" not in _bus_events()


def test_parse_count_grenzen():
    assert decompose._parse_count("3", 3) == 3 and decompose._parse_count("0", 3) == 0
    assert decompose._parse_count("2,0", 3) == 2
    for text in ("4", "-1", "1,5", "2.5", "keine Zahl", ""):
        assert decompose._parse_count(text, 3) is None, text
    assert decompose._parse_count("7") == 7 and decompose._parse_count("-7") is None


def test_x_von_n_ist_der_bruch_nicht_die_anzahl():
    """Schlussprüfung a5: „Es sind 2 von 3." endete auf die Ausschnittlänge und lag damit per
    Konstruktion IMMER in der Schranke — merge summierte die Nenner. Liste 1..6, „gerade", wahr 3:
    run() lieferte 6 mit missing 0 und ohne Meldung."""
    assert decompose._parse_count("Es sind 2 von 3.", 3) == 2
    assert decompose._parse_count("2 von 3 Zahlen erfuellen die Bedingung.", 3) == 2
    assert decompose._parse_count("Antwort: 2 (von 3)", 3) == 2
    assert decompose._parse_count("2/3", 3) == 2
    assert decompose._parse_count("2 out of 3", 3) == 2
    assert decompose._parse_count("0 von 3", 3) == 0
    # Gegenprobe: ist der Nenner nicht die letzte Zahl, bleibt die letzte Zahl die Anzahl
    assert decompose._parse_count("Ausschnitt 1 von 2: 3", 3) == 3
    # fremder Nenner: der Arbeiter hat über etwas anderes gezählt als über diesen Ausschnitt
    assert decompose._parse_count("2 von 10.", 3) is None
    assert decompose._parse_count("Es sind 5 von 3.", 3) is None


def test_run_summiert_nicht_die_ausschnittlaengen(monkeypatch):
    """Derselbe Angriff im vollen Lauf: exakt rechnender Arbeiter, ausführliche Antwort."""
    def fake(system, user, **kw):
        zahlen = [int(z) for z in _LISTE.search(user).group(1).split(", ")]
        return {"ok": True, "text": f"Es sind {sum(1 for z in zahlen if z % 2 == 0)} von {len(zahlen)}."}
    monkeypatch.setattr(model, "FAKE", fake)
    r = decompose.run([1, 2, 3, 4, 5, 6], "gerade", parts=2)
    assert r["value"] == 3 and r["missing"] == 0 and r["values"] == [1, 2]
    assert "decompose.implausible" not in _bus_events()
    lauf = [z for z in bus.tail(50) if z["event"] == "decompose.run"]
    assert lauf[-1]["value"] == 3


def test_merge_bool_und_leer():
    """a3: merge([True, 2]) ergab (3, 0) — bool ist keine Anzahl."""
    assert decompose.merge([True, 2]) == (2, 1)
    assert decompose.merge([]) == (None, 0)
    assert decompose.merge([1.0, 2]) == (3.0, 0)


# --- plan: Eingaben, die früher TypeError oder einen falschen Nahttext gaben (a3) ----------------
def test_plan_lehnt_none_in_liste_leere_bedingung_und_parts_bruch_ab():
    with pytest.raises(decompose.DecomposeError) as exc:
        decompose.plan([None, 4, None, 8, 9, None], "nicht die letzte Zahl", parts=3, force=True)
    assert "Position(en) 1, 3, 6" in str(exc.value)
    with pytest.raises(decompose.DecomposeError):
        decompose.plan([1, "2", 3], "gerade", parts=1)
    for cond in (None, "", "   "):
        with pytest.raises(decompose.DecomposeError):
            decompose.plan([1, 2, 3], cond, parts=1)
    for parts in (1.5, "2", True, None, -1, 0):
        with pytest.raises(decompose.DecomposeError):
            decompose.plan([1, 2, 3, 4], "gerade", parts=parts)
    assert decompose.plan([1, 2, 3, 4], "gerade", parts=2.0)["parts"] == 2
    assert decompose.plan([1.5, 2.5, 3.0], "gerade", parts=1)["parts"] == 1
    assert "decompose.plan" in _bus_events()
