"""Zerlegung: Klassifikation de/en, Kumulation verweigert, Chunk-Grenzen, Nahtprotokoll byte-gleich zu M2, merge zählt Fehlende."""
import json
import re
import sys

import pytest

from core import bus, decompose, model, paths


def _bus_events():
    return [r["event"] for r in bus.tail(200)]


# --- Klassifikation --------------------------------------------------------------------------
@pytest.mark.parametrize("bedingung", [
    "groesser als die Zahl davor",
    "gleich der vorherigen Zahl",
    "kleiner als die nachfolgende Zahl",
    "unmittelbar nach einer geraden Zahl",
    "greater than the previous number",
    "two consecutive even numbers",
    "equal to the next value",
    "adjacent to a multiple of 5",
])
def test_nachbarbezug_de_en(bedingung):
    r = decompose.seam_check(bedingung)
    assert r["classes"] == ["neighbor"]
    assert r["decomposable"] is True and r["protocol"] == "naht"


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
    assert r["decomposable"] is True and r["protocol"] == "naht"


@pytest.mark.parametrize("bedingung", [
    "groesser als die Summe aller bisherigen Zahlen",
    "groesser als der bisher groesste Wert",
    "ueber der laufenden Zwischensumme",
    "groesser als der Median der Liste",
    "kommt in der sortierten Liste vor Position 10",
    "greater than the running sum so far",
    "above the cumulative average",
    "appears more than once in the list",
    "equal to the maximum of the list",
])
def test_kumulationsbezug_de_en_verweigert(bedingung):
    r = decompose.seam_check(bedingung)
    assert "cumulative" in r["classes"]
    assert r["decomposable"] is False and r["protocol"] == "none"
    assert "nicht zerlegbar" in r["reason"]
    with pytest.raises(decompose.DecomposeError):
        decompose.plan(list(range(20)), bedingung, parts=4)
    assert "decompose.refused" in _bus_events()


def test_kumulation_schlaegt_nachbar_und_position():
    r = decompose.seam_check("groesser als die Zahl davor und groesser als alle bisherigen")
    assert set(r["classes"]) == {"neighbor", "cumulative"}
    assert r["decomposable"] is False


@pytest.mark.parametrize("bedingung", [
    "gerade", "durch 3 teilbar", "groesser als 50", "even", "divisible by 3",
    "greater than 50 and less than 90", "hat eine gerade Ziffernsumme",
])
def test_sauber_teilbar_ohne_protokoll(bedingung):
    r = decompose.seam_check(bedingung)
    assert r["classes"] == [] and r["decomposable"] is True and r["protocol"] == "none"
    assert "decompose.seam_check" in _bus_events()


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
    p = decompose.plan(list(range(1, 10)), "groesser als die Zahl davor", parts=3)
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
    assert r["protocol"] == "none" and r["chunks"] == 5
    assert len(aufrufe) == 5
    assert all(a["system"] == decompose.WORKER_SYSTEM and a["model"] == "test-modell" for a in aufrufe)
    letzte = [json.loads(z) for z in paths.bus_file().read_text().splitlines()]
    lauf = [z for z in letzte if z["event"] == "decompose.run"]
    assert lauf and lauf[-1]["calls"] == 5 and lauf[-1]["missing"] == 0 and lauf[-1]["protocol"] == "none"


def test_run_mit_naht_zaehlt_fehlende(monkeypatch):
    items = list(range(1, 21))
    fake, aufrufe = _zaehlender_fake(lambda z: z % 3 == 0, ausfall_index=1)
    monkeypatch.setattr(model, "FAKE", fake)
    r = decompose.run(items, "durch 3 teilbar, aber nicht die letzte Zahl", parts=4)
    assert r["protocol"] == "naht" and r["calls"] == 4 and r["missing"] == 1
    # 20 Zahlen, 6 durch 3 teilbar; Chunk 1 (6..10) traegt 6 und 9 → fehlt
    assert r["value"] == 4 and r["values"][1] is None
    assert all("GESAMTLISTE" in a["user"] for a in aufrufe)
