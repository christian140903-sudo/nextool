"""Selbstmodell: nichts wird deklariert — Züge wachsen aus Episoden mit Belegzähler, der Name kommt von außen."""
from core import bus
from core.memory import ledger, selfmodel


def _episode(session_id, text="Ergebnis zweimal geprüft", **kw):
    return ledger.remember("Bash: ok", text, kind="episode", source="werkzeug",
                           source_ref="Bash:abc", session_id=session_id, **kw)


def _selbst(text="Ich prüfe Ergebnisse zweimal, bevor ich sie melde.", **kw):
    kw.setdefault("source", "eigener_schluss")
    return ledger.remember("Arbeitsweise Prüfen", text, kind="self", **kw)


def _events(prefix):
    return [e for e in bus.tail(200) if e["event"].startswith(prefix)]


def test_evidence_zaehlt_episoden_und_sitzungen_und_ignoriert_zurueckgezogenes():
    e1, e2, e3 = _episode("s1"), _episode("s1"), _episode("s2")
    fakt = ledger.remember("Fakt", "kein Beleg", source="eigener_schluss")
    zurueck = _episode("s3")
    ledger.transition(zurueck, "retracted", reason="falsch")
    archiv = _episode("s4")
    ledger.transition(archiv, "archived", reason="abgelaufen")  # archiviert bleibt Beleg (D032)
    s = _selbst(derived_from=[e1, e2, e3, fakt, zurueck, archiv, "gibt-es-nicht"])
    assert selfmodel.evidence(ledger.get(s)) == {"episodes": 4, "sessions": 3}
    assert selfmodel.evidence({"derived_from": []}) == {"episodes": 0, "sessions": 0}
    # Ohne session_id zählt der Tag als Sitzung (D043: Sitzungen/Tage).
    o1 = _episode("", valid_from="2026-09-01T10:00:00Z")
    o2 = _episode("", valid_from="2026-09-02T10:00:00Z")
    o3 = _episode("", valid_from="2026-09-02T18:00:00Z")
    assert selfmodel.evidence({"derived_from": [o1, o2, o3]}) == {"episodes": 3, "sessions": 2}


def test_promote_erst_ab_zwei_episoden_aus_zwei_sitzungen():
    e1, e2 = _episode("s1"), _episode("s1")
    eine_sitzung = _selbst(derived_from=[e1, e2])
    assert ledger.get(eine_sitzung)["status"] == "candidate"
    assert selfmodel.promote_eligible() == []
    assert ledger.get(eine_sitzung)["status"] == "candidate"

    e3 = _episode("s2")
    zwei_sitzungen = _selbst("Ich melde Blockaden, statt zu improvisieren.", derived_from=[e1, e3])
    assert selfmodel.promote_eligible() == [zwei_sitzungen]
    z = ledger.get(zwei_sitzungen)
    assert z["status"] == "active" and ledger.get(eine_sitzung)["status"] == "candidate"
    ev = [e for e in _events("memory.selfmodel.promote") if e.get("id") == zwei_sitzungen]
    assert ev and ev[0]["episodes"] == 2 and ev[0]["sessions"] == 2
    assert ledger.verify_chain()
    # Eigene Schwellen — aber e1 belegt schon den aktiven Zug, eine Episode trägt nur einen Zug:
    # mit min_sessions=1 bleibt nur e2, das reicht nicht für zwei Episoden; mit min_episodes=1 schon.
    assert selfmodel.promote_eligible(min_sessions=1) == []
    assert selfmodel.promote_eligible(min_episodes=1, min_sessions=1) == [eine_sitzung]


def test_render_ohne_eintraege_und_name_von_aussen():
    assert selfmodel.render() == "# Selbstmodell: namensoffen\nnoch keine belegten Züge"
    assert selfmodel.render(name="Miguel").startswith("# Selbstmodell: Miguel\n")
    assert selfmodel.render(name="  ") .startswith("# Selbstmodell: namensoffen")
    assert _events("memory.selfmodel.render")


def test_render_zeigt_zuege_mit_etikett_und_unbelegtes_als_hypothese():
    e1, e2 = _episode("s1"), _episode("s2")
    zug = _selbst(derived_from=[e1, e2], valid_from="2026-08-20")
    selfmodel.promote_eligible()
    hypothese = _selbst("Ich mag knappe Antworten.", derived_from=[e1])
    text = selfmodel.render(name="Miguel")
    zeilen = text.split("\n")
    assert zeilen[0] == "# Selbstmodell: Miguel"
    assert zeilen[1] == "[2026-08-20] [Quelle: eigener_schluss] [Vertrauen: 0,4] Ich prüfe Ergebnisse zweimal, bevor ich sie melde."
    assert zeilen[2].startswith("Hypothese über mich (Belege 1/1): [")
    assert zeilen[2].endswith("[Quelle: eigener_schluss] [Vertrauen: 0,4] Ich mag knappe Antworten.")
    assert "noch keine belegten Züge" not in text
    assert ledger.get(zug)["status"] == "active" and ledger.get(hypothese)["status"] == "candidate"


def test_render_deklariert_nichts_aktiv_ohne_belege_bleibt_hypothese():
    # Von Hand aktiviert (transition), aber ohne Episoden dahinter: kein Zug, eine Hypothese.
    behauptet = _selbst("Ich bin ein Weltklasse-Entwickler.")
    ledger.transition(behauptet, "active", reason="hand")
    text = selfmodel.render()
    assert text.split("\n")[1].startswith("Hypothese über mich (Belege 0/0): ")
    assert not any(z.startswith("[") for z in text.split("\n"))
    rec = _events("memory.selfmodel.render")[-1]
    assert rec["traits"] == 0 and rec["hypotheses"] == 1 and rec["unbelegt_aktiv"] == 1


def test_render_haelt_max_lines_und_kuerzt_hypothesen_zuerst():
    e1 = _episode("s1")
    for i in range(3):  # je Zug eigene Belege: eine Episode trägt höchstens einen Zug
        _selbst(f"Belegter Zug {i}.", derived_from=[_episode(f"a{i}"), _episode(f"b{i}")])
    selfmodel.promote_eligible()
    for i in range(5):
        _selbst(f"Hypothese {i}.", derived_from=[e1])
    zeilen = selfmodel.render(max_lines=4).split("\n")
    assert len(zeilen) == 4 and zeilen[0].startswith("# Selbstmodell")
    assert all("Belegter Zug" in z for z in zeilen[1:])
    zeilen = selfmodel.render(max_lines=6).split("\n")
    assert len(zeilen) == 6 and sum(1 for z in zeilen if z.startswith("Hypothese")) == 2
    assert len(selfmodel.render(max_lines=1).split("\n")) == 1
    assert len(selfmodel.render(max_lines=50).split("\n")) == 9


def test_eine_episode_belegt_hoechstens_einen_zug():
    """Prüfbefund C2: zwei beliebige Episoden beglaubigten beliebig viele Selbstbehauptungen."""
    e1, e2 = _episode("s1"), _episode("s2")
    ids = [_selbst(f"Ich bin ein Weltklasse-Entwickler Nr. {i}.", derived_from=[e1, e2]) for i in range(5)]
    assert selfmodel.promote_eligible() == [ids[0]]
    assert [ledger.get(i)["status"] for i in ids] == ["active"] + ["candidate"] * 4
    # Ein zweiter Lauf befördert nichts nach: die Belege sind vergeben.
    assert selfmodel.promote_eligible() == []
    # Frische, eigene Belege tragen einen weiteren Zug.
    weiterer = _selbst("Ich melde Blockaden.", derived_from=[_episode("s7"), _episode("s8")])
    assert selfmodel.promote_eligible() == [weiterer]
    text = selfmodel.render()
    assert sum(1 for z in text.split("\n") if z.startswith("[")) == 2
