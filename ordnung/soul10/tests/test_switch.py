"""Schalter: trivial und Formatzwang erkannt, keine Falsch-Positiven auf oder/besser/live/user, Log ohne Prompttext, Datensatz ≥ 40 Prompts de/en ≥ 90 %."""
import json

import pytest

from core import bus, model, paths, switch

# --- Datensatz: (Prompt, Soll-Stufe ohne Sonde, Sprache) --------------------------------------
DATENSATZ = [
    # direkt: trivial (kurz, ein Satz, kein Signal)
    ("Was ist die Hauptstadt von Frankreich?", "direkt", "de"),
    ("What is the capital of France?", "direkt", "en"),
    ("Danke!", "direkt", "de"),
    ("ok", "direkt", "en"),
    ("Wie viele Tage hat ein Schaltjahr?", "direkt", "de"),
    ("How many legs does a spider have?", "direkt", "en"),
    ("Uebersetze 'Guten Morgen' ins Englische.", "direkt", "de"),
    ("Translate 'thank you' into German.", "direkt", "en"),
    ("Nenne das chemische Symbol fuer Gold.", "direkt", "de"),
    ("Was ergibt 15 % von 200?", "direkt", "de"),
    ("Is 97 a prime number?", "direkt", "en"),
    ("Wandle 5 km in Meilen um.", "direkt", "de"),
    ("Welcher Wochentag war der 1. Januar 2000?", "direkt", "de"),
    ("Give me a synonym for 'happy'.", "direkt", "en"),
    ("Kaffee oder Tee?", "direkt", "de"),
    ("Welches Wort ist besser: schnell oder rasch?", "direkt", "de"),
    ("I live in Vienna, what time zone is that?", "direkt", "en"),
    ("Wie spaet ist es in Tokio, wenn es in Berlin 12 Uhr ist?", "direkt", "de"),
    ("Rename the variable userCount to memberCount.", "direkt", "en"),
    # direkt: Formatzwang
    ("Berechne 2+2, nur die Zahl.", "direkt", "de"),
    ("Rechne 17*23. Antworte nur mit der Zahl.", "direkt", "de"),
    ("Return only the number.", "direkt", "en"),
    ("Gib die Liste als JSON aus.", "direkt", "de"),
    ("Output the result as JSON only.", "direkt", "en"),
    ("Sortiere diese Woerter alphabetisch und gib NUR die sortierte Liste aus: Birne, Apfel, Kirsche.", "direkt", "de"),
    ("Wie viele Buchstaben 'e' enthaelt 'Erdbeere'? Gib NUR die Zahl aus.", "direkt", "de"),
    ("Liste: 4, 9, 12, 7, 20, 3, 8. Wie viele Zahlen sind gerade? Antworte NUR mit der Anzahl als Zahl.", "direkt", "de"),
    ("Convert this table to CSV. CSV only, no explanation.", "direkt", "en"),
    ("Welches Wort steht an dritter Stelle in 'der schnelle braune Fuchs'? Gib nur das Wort aus, kein weiterer Text.", "direkt", "de"),
    # aufwand: mehrschrittig, mehrere Groessen, mehrere Saetze
    ("Ein Zug faehrt um 8:15 Uhr mit 90 km/h los, ein zweiter um 9:00 Uhr mit 120 km/h auf derselben Strecke. "
     "Wann und nach wie vielen Kilometern holt der zweite den ersten ein? Beruecksichtige, dass der erste Zug "
     "10 Minuten Pause macht.", "aufwand", "de"),
    ("Lisa hat dreimal so viele Aepfel wie Tom. Zusammen haben sie 48. Tom gibt Lisa 6 Aepfel. Wie viele hat Lisa jetzt?", "aufwand", "de"),
    ("A tank fills at 3 L/min and drains at 1.2 L/min. It starts with 20 L and has a capacity of 100 L. "
     "After how many minutes is it full?", "aufwand", "en"),
    ("Wenn ein Auto 3 Stunden mit 80 km/h faehrt und dann 2 Stunden mit 100 km/h, wie weit kommt es insgesamt?", "aufwand", "de"),
    ("Ich habe drei Angebote fuer eine Wohnung: 900 Euro kalt mit 15 Minuten Pendelzeit, 750 Euro mit 40 Minuten, "
     "1100 Euro mit 5 Minuten. Ich verdiene 2800 Euro netto. Welche sollte ich nehmen?", "aufwand", "de"),
    ("Prove that the sum of the first n odd numbers is n squared.", "aufwand", "en"),
    ("Erklaere, warum der folgende Code eine Endlosschleife hat, und schlage eine Korrektur vor:\nwhile i < 10:\n    print(i)", "aufwand", "de"),
    ("Berechne den Umfang eines Kreises mit Radius 3. Runde auf zwei Stellen.", "aufwand", "de"),
    # aufwand: Einsatzhoehe / offene Fragen / Text
    ("Sollen wir die API nach Prod migrieren oder erst das Datenmodell umbauen?", "aufwand", "de"),
    ("Should we deploy the new schema to production on Friday or wait until Monday?", "aufwand", "en"),
    ("Entwirf eine Architektur fuer ein Ereignis-Bus-System, das 10.000 Nachrichten pro Sekunde verarbeitet.", "aufwand", "de"),
    ("Wie sollte ich mein Team ueber die Kuendigung eines Kollegen informieren?", "aufwand", "de"),
    ("Refactor this function so it handles both empty and null input; keep the public interface unchanged.", "aufwand", "en"),
    ("Vergleiche PostgreSQL und SQLite fuer ein lokales Werkzeug mit einem Nutzer: Was empfiehlst du und warum?", "aufwand", "de"),
    ("We need to decide whether to hire a second backend engineer or invest in automation first. What would you recommend?", "aufwand", "en"),
    ("Plane die Migration von drei Datenbanken auf eine neue Version, mit Rollback-Schritten und Zeitplan.", "aufwand", "de"),
    ("Write a design document for the new customer onboarding flow, covering data model, API contract and rollout.", "aufwand", "en"),
    ("Schreibe eine Absage an einen Bewerber, freundlich, aber eindeutig, und erklaere kurz die Gruende.", "aufwand", "de"),
    ("Draft a message to the team announcing that the release is delayed by two weeks.", "aufwand", "en"),
    ("Is it ethical to delete the user's data without telling them? Explain your reasoning.", "aufwand", "en"),
    ("Soll ich die Stelle kuendigen und mich selbststaendig machen?", "aufwand", "de"),
    ("Why does the moon look larger near the horizon?", "aufwand", "en"),
]


def test_datensatz_groesse_und_sprachen():
    assert len(DATENSATZ) >= 40
    assert sum(1 for _, _, sp in DATENSATZ if sp == "en") >= 15
    assert sum(1 for _, _, sp in DATENSATZ if sp == "de") >= 20
    assert {s for _, s, _ in DATENSATZ} == {"direkt", "aufwand"}
    assert sum(1 for _, s, _ in DATENSATZ if s == "direkt") >= 15
    assert sum(1 for _, s, _ in DATENSATZ if s == "aufwand") >= 15


def test_trefferquote_datensatz_mindestens_90_prozent():
    fehler = []
    for prompt, soll, _ in DATENSATZ:
        ist = switch.decide(prompt)["stage"]
        if ist != soll:
            fehler.append((prompt[:60], soll, ist))
    quote = 1 - len(fehler) / len(DATENSATZ)
    assert quote >= 0.9, f"Trefferquote {quote:.1%}; Fehler: {fehler}"


# --- Einzelmechanismen ----------------------------------------------------------------------
def test_trivial_erkannt():
    pf = switch.prefilter("Was ist die Hauptstadt von Frankreich?")
    assert pf["trivial"] is True and pf["signals"] == [] and pf["sentences"] == 1
    assert pf["len"] == len("Was ist die Hauptstadt von Frankreich?")
    d = switch.decide("Was ist die Hauptstadt von Frankreich?")
    assert d["stage"] == "direkt" and d["inject"] == "" and "trivial" in d["reason"]


def test_zwei_saetze_sind_nicht_trivial():
    pf = switch.prefilter("Berechne den Umfang eines Kreises mit Radius 3. Runde auf zwei Stellen.")
    assert pf["sentences"] == 2 and pf["trivial"] is False
    d = switch.decide("Berechne den Umfang eines Kreises mit Radius 3. Runde auf zwei Stellen.")
    assert d["stage"] == "aufwand" and d["reason"] == "2 Sätze"


@pytest.mark.parametrize("prompt,soll", [
    ("Welcher Wochentag war der 1. Januar 2000?", 1),
    ("Am 3. Okt. 1990 war Feiertag?", 1),
    ("Siehe z. B. Nr. 5 bei Dr. Meier.", 1),
    ("Danke!", 1),
    ("ok", 1),
    ("Welches Wort ist besser: schnell oder rasch?", 1),
    ("Was ist 2.5 mal 4?", 1),
    ("Erster Satz. Zweiter Satz! Dritte Frage?", 3),
    ("Zeile eins\nZeile zwei", 2),
    ("Rechne 17*23. Antworte nur mit der Zahl.", 2),
])
def test_satzzaehler_schuetzt_daten_und_abkuerzungen(prompt, soll):
    assert switch.sentence_count(prompt) == soll


def test_laenge_ueber_200_ist_nicht_trivial():
    lang = "Bitte " + "sehr " * 45 + "genau nachdenken"
    assert len(lang) > 200
    pf = switch.prefilter(lang)
    assert pf["trivial"] is False and pf["signals"] == []
    d = switch.decide(lang)
    assert d["stage"] == "aufwand" and d["inject"] == model.AUFWANDSREGEL and "Länge" in d["reason"]


def test_ein_signal_hebt_aus_der_trivialitaet():
    pf = switch.prefilter("Warum ist der Himmel blau?")
    assert pf["signals"] == ["reasoning"] and pf["trivial"] is False
    assert switch.decide("Warum ist der Himmel blau?")["stage"] == "aufwand"


@pytest.mark.parametrize("prompt", [
    "Berechne 2+2, nur die Zahl.",
    "Gib die Liste als JSON aus.",
    "Return only the number.",
    "Nenne die drei groessten Staedte Europas, nichts sonst.",
    "Zaehle die Woerter in diesem Absatz und gib NUR die Zahl aus, kein weiterer Text.",
])
def test_formatzwang_erkannt(prompt):
    pf = switch.prefilter(prompt)
    assert pf["format_locked"] is True and "format_locked" in pf["signals"]
    d = switch.decide(prompt)
    assert d["stage"] == "direkt" and d["inject"] == ""


def test_formatzwang_schlaegt_signale():
    prompt = ("Sollen wir die API nach Prod migrieren oder erst das Datenmodell umbauen? "
              "Antworte nur mit ja oder nein.")
    d = switch.decide(prompt)
    assert d["format_locked"] and "irreversible" in d["signals"]
    assert d["stage"] == "direkt" and d["inject"] == "" and "format_locked" in d["reason"]


@pytest.mark.parametrize("prompt", [
    "Erklaere genau, warum der Code langsam ist.",
    "Rechne nur die erste Aufgabe aus und erklaere den Weg.",
    "Beschreibe exakt, wie der Algorithmus arbeitet.",
])
def test_formatzwang_ohne_falsch_positive(prompt):
    assert switch.prefilter(prompt)["format_locked"] is False


def test_signale_ohne_falsch_positive():
    assert switch.detect_signals("Kaffee oder Tee?") == []
    assert switch.detect_signals("Welches Wort ist besser: schnell oder rasch?") == []
    assert "production" not in switch.detect_signals("I live in Vienna, what time zone is that?")
    assert "affects_others" not in switch.detect_signals("Rename the variable userCount to memberCount.")
    assert "affects_others" not in switch.detect_signals("SELECT id FROM users WHERE active = 1")
    assert "commitment" not in switch.detect_signals("Oeffne die Einstellungen.")
    assert "irreversible" not in switch.detect_signals("Add a drop-down to the form.")
    for name in ("tradeoff", "recommendation", "production", "affects_others"):
        rx = switch.SIGNALS[name]
        for wort in ("oder", "besser", "live", "user", "users", "userId"):
            assert not rx.search(wort), f"{name} feuert auf {wort!r}"


def test_signale_treffen_wo_sie_sollen():
    s = switch.detect_signals("Sollen wir die API nach Prod migrieren oder erst das Datenmodell umbauen?")
    assert {"recommendation", "irreversible", "durable", "architecture", "production"} <= set(s)
    s = switch.detect_signals("Entweder wir kaufen jetzt oder wir warten ein Jahr.")
    assert "tradeoff" in s and "commitment" in s
    assert "text" in switch.detect_signals("Schreibe eine Absage an einen Bewerber.")
    assert "reasoning" in switch.detect_signals("Prove that the sum is even.")
    assert "mehrere_groessen" in switch.detect_signals("3 Stunden mit 80 km/h, dann 2 Stunden")
    assert "mehrere_groessen" not in switch.detect_signals("Berechne 2+2")
    assert list(switch.SIGNALS) == [n for n in switch.SIGNALS if n in switch.detect_signals(
        "add design schema architecture deploy decide should we team vs. layout release "
        "e-mail why 1 2 3 only the number")]


def test_aufwand_blendet_die_gemessene_regel_ein():
    d = switch.decide("Sollen wir die API nach Prod migrieren oder erst das Datenmodell umbauen?")
    assert d["stage"] == "aufwand" and d["inject"] == model.AUFWANDSREGEL
    assert d["reason"].startswith("Signale: ") and d["probe"] is None


def test_log_ohne_prompttext():
    prompt = "Sollen wir die Zebrastreifen-API nach Prod migrieren oder erst das Datenmodell umbauen?"
    d = switch.decide(prompt)
    log = paths.routing_file().read_text(encoding="utf-8")
    rec = json.loads(log.splitlines()[-1])
    assert set(rec) == {"ts", "sha", "len", "signals", "trivial", "format_locked", "stage", "reason"}
    assert rec["sha"] == paths.sha256_text(prompt) == d["sha"]
    assert rec["len"] == len(prompt) and rec["stage"] == "aufwand"
    for wort in ("Zebrastreifen", "migrieren", "Datenmodell", prompt):
        assert wort not in log
    busz = paths.bus_file().read_text(encoding="utf-8")
    assert "Zebrastreifen" not in busz and prompt not in busz
    assert any(r["event"] == "switch.decide" and r["sha"] == rec["sha"] for r in bus.tail(50))


def test_log_ist_fail_open(monkeypatch):
    monkeypatch.setattr(paths, "routing_file", lambda: paths.home() / "watch" / "gibt" / "es" / "nicht.jsonl")
    d = switch.decide("Was ist die Hauptstadt von Frankreich?")
    assert d["stage"] == "direkt"


def test_entropie_sonde_einig_und_uneinig(fake_model):
    aufrufe = fake_model(["Rechnung ... 42", "Ergebnis: 42"])
    r = switch.entropy_probe("Was ist 6*7?", model="test-modell")
    assert r["agree"] is True and r["values"] == [42.0, 42.0] and r["calls"] == 2
    assert len(aufrufe) == 2 and all(a["system"] is None and a["model"] == "test-modell" for a in aufrufe)
    fake_model(["42", "43"])
    r = switch.entropy_probe("Was ist 6*7?")
    assert r["agree"] is False and r["values"] == [42.0, 43.0]
    fake_model(["Paris", "paris"])
    assert switch.entropy_probe("Hauptstadt?")["agree"] is True
    fake_model(["Paris", "Lyon"])
    assert switch.entropy_probe("Hauptstadt?")["agree"] is False


def test_sonde_fehlschlag_zaehlt_als_uneinig(monkeypatch):
    def _fake(system, user, **kw):
        return {"ok": False, "text": "", "error": "timeout"}
    monkeypatch.setattr(model, "FAKE", _fake)
    r = switch.entropy_probe("Was ist 6*7?")
    assert r["agree"] is False and r["values"] == [None, None]


def test_sonde_bus_zeile_ohne_antworttext(fake_model):
    fake_model(["Antwort Zebrastreifen", "Antwort Giraffe"])
    r = switch.entropy_probe("Welches Tier?")
    assert r["agree"] is False
    letzte = [json.loads(z) for z in paths.bus_file().read_text().splitlines()]
    sonde = [z for z in letzte if z["event"] == "switch.entropy_probe"]
    assert sonde and sonde[-1]["agree"] is False and sonde[-1]["calls"] == 2 and sonde[-1]["distinct"] == 2
    assert "Zebrastreifen" not in paths.bus_file().read_text()


def test_uneinigkeit_fuehrt_zu_pruefer(fake_model):
    prompt = "Lisa hat dreimal so viele Aepfel wie Tom. Zusammen haben sie 48. Tom gibt Lisa 6 Aepfel. Wie viele hat Lisa jetzt?"
    aufrufe = fake_model(["42", "36"])
    d = switch.decide(prompt, probe=True)
    assert d["stage"] == "pruefer" and d["inject"] == model.AUFWANDSREGEL
    assert d["probe"]["agree"] is False and len(aufrufe) == 2
    assert "uneinig" in d["reason"]
    rec = json.loads(paths.routing_file().read_text().splitlines()[-1])
    assert rec["stage"] == "pruefer" and prompt not in paths.routing_file().read_text()


def test_einigkeit_bleibt_aufwand(fake_model):
    prompt = "Lisa hat dreimal so viele Aepfel wie Tom. Zusammen haben sie 48. Tom gibt Lisa 6 Aepfel. Wie viele hat Lisa jetzt?"
    fake_model(["42", "42"])
    d = switch.decide(prompt, probe=True)
    assert d["stage"] == "aufwand" and d["probe"]["agree"] is True and "einig" in d["reason"]


def test_direkt_ruft_keine_sonde(fake_model):
    aufrufe = fake_model(["1", "2"])
    d = switch.decide("Berechne 2+2, nur die Zahl.", probe=True)
    assert d["stage"] == "direkt" and d["probe"] is None and aufrufe == []
    d = switch.decide("Was ist die Hauptstadt von Frankreich?", probe=True)
    assert d["stage"] == "direkt" and d["probe"] is None and aufrufe == []


def test_stufen_sind_genau_drei():
    assert switch.STAGES == ("direkt", "aufwand", "pruefer")
