"""Schalter: trivial und Formatzwang erkannt, keine Falsch-Positiven auf oder/besser/live/user und auf Allerweltswörtern
(team/public/ship/launch/api …), Formatzwang nur als Ausgabe-Direktive (JSON als Thema zählt nicht) und nur ohne
Einsatzhöhe „direkt", Satzzählung mit Kleinschreibung und Semikolon, Datum/Version/IP als eine Größe, Log ohne
Prompttext und rotiert, Sonde normalisiert, Vorfilter < 50 ms; Datensatz ≥ 40 Prompts de/en ≥ 90 % plus
Gegenbeispiele je Klasse (adversariale Prüfung a4–a7, 2026-09-08), die einzeln stimmen müssen."""
import json
import time

import pytest

from core import bus, model, paths, switch

# --- Datensatz: (Prompt, Soll-Stufe ohne Sonde, Sprache) --------------------------------------
DATENSATZ_KERN = [
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

# --- Gegenbeispiele je Klasse (a4–a7, 2026-09-08) — nicht aus der Regex, sondern aus dem Alltag.
# Jedes muss einzeln stimmen (test_gegenbeispiel_je_klasse), nicht nur in der 90-%-Quote: die
# Quote maß vorher nur die Passung der Regex zu ihrem eigenen Datensatz.
# (a) Allerweltswörter, die früher ein Signal auslösten: team, public, patient, kauf/buy, wähl,
#     ship, launch, E-Mail, standard, api, interface, balance, layout, migration, release,
#     investigate, delete, nutze, add, foundation — ohne Kontext kein Signal.
ALLTAGSWOERTER_DIREKT = [
    ("Add 2 and 3.", "direkt", "en"),
    ("Which team won the 2014 World Cup?", "direkt", "en"),
    ("Is Monday a public holiday in Germany?", "direkt", "en"),
    ("Be patient.", "direkt", "en"),
    ("Wo kann ich Brot kaufen?", "direkt", "de"),
    ("Where can I buy stamps?", "direkt", "en"),
    ("Waehle eine Zahl zwischen 1 und 10.", "direkt", "de"),
    ("Which ship sank in 1912?", "direkt", "en"),
    ("When was the launch of Apollo 11?", "direkt", "en"),
    ("Wie lautet die E-Mail von Peter?", "direkt", "de"),
    ("What is the standard unit of force?", "direkt", "en"),
    ("What does API stand for?", "direkt", "en"),
    ("What is a network interface?", "direkt", "en"),
    ("What is my account balance?", "direkt", "en"),
    ("Wie aendere ich das Tastatur-Layout?", "direkt", "de"),
    ("Wann beginnt die Migration der Stoerche?", "direkt", "de"),
    ("When was the release date of Python 3?", "direkt", "en"),
    ("Investigate the log file.", "direkt", "en"),
    ("How do I delete a line in vim?", "direkt", "en"),
    ("Wie nutze ich grep?", "direkt", "de"),
    ("What year was the Linux Foundation founded?", "direkt", "en"),
    ("Ist Python public domain?", "direkt", "de"),
    ("Ist die Luftqualitaet in Wien gut?", "direkt", "de"),
]
# (b) Datum, Version, IP, Uhrzeit, Tausendergruppen, arithmetische Kette: EINE Größe;
#     Ordinal vor Substantiv, „Hr.", „Hmm...": EIN Satz.
DATUM_VERSION_DIREKT = [
    ("Welcher Wochentag war der 1.1.2000?", "direkt", "de"),
    ("Welcher Wochentag ist der 08.09.2026?", "direkt", "de"),
    ("Was ist neu in Python 3.11.2?", "direkt", "de"),
    ("Ping 192.168.0.1", "direkt", "en"),
    ("Wann ist 12:30:15 plus 2 Stunden?", "direkt", "de"),
    ("Kostet das 1.000.000 Euro?", "direkt", "de"),
    ("Was ist 1 + 2 + 3?", "direkt", "de"),
    ("Rechne 2+3+4.", "direkt", "de"),
    ("Wer regierte Frankreich im 18. Jahrhundert?", "direkt", "de"),
    ("Wer wurde 3. Bundeskanzler?", "direkt", "de"),
    ("Hr. Meier hat angerufen, was nun?", "direkt", "de"),
    ("Hmm... Was ist 2+2?", "direkt", "de"),
]
# (c) Kleinschreibung und Semikolon umgehen die Satzzählung nicht.
KLEINSCHREIBUNG_AUFWAND = [
    ("lisa hat dreimal so viele aepfel wie tom. zusammen haben sie 48. tom gibt lisa 6 aepfel. wie viele hat lisa jetzt?", "aufwand", "de"),
    ("berechne den umfang eines kreises mit radius 3. runde auf zwei stellen.", "aufwand", "de"),
    ("Berechne den Umfang eines Kreises mit Radius 3; runde auf zwei Stellen; nenne die Formel", "aufwand", "de"),
    ("ein zug faehrt um 8 uhr mit 90 km/h los, ein zweiter um 9 uhr auf derselben strecke. wann holt der zweite den ersten ein?", "aufwand", "de"),
    ("a tank fills at 3 L/min and drains at 1 L/min. it starts empty and holds 100 L. after how many minutes is it full?", "aufwand", "en"),
]
# (d) Gängige Formatzwänge, die vorher unerkannt blieben (25 von 26).
FORMATZWANG_DIREKT = [
    ("Answer with a single number.", "direkt", "en"),
    ("Antworte mit einer einzigen Zahl.", "direkt", "de"),
    ("Reply with yes or no.", "direkt", "en"),
    ("Antworte mit ja oder nein.", "direkt", "de"),
    ("Just the answer.", "direkt", "en"),
    ("Just give me the number.", "direkt", "en"),
    ("Nur die Antwort.", "direkt", "de"),
    ("Only the answer.", "direkt", "en"),
    ("Only the result, please.", "direkt", "en"),
    ("Nur das Ergebnis.", "direkt", "de"),
    ("Give the final answer only.", "direkt", "en"),
    ("Answer in one word.", "direkt", "en"),
    ("Antworte in einem Wort.", "direkt", "de"),
    ("Rate it from 1 to 10, number only.", "direkt", "en"),
    ("Digits only.", "direkt", "en"),
    ("One line only.", "direkt", "en"),
    ("Keine Erklaerung.", "direkt", "de"),
    ("Do not explain.", "direkt", "en"),
    ("No commentary.", "direkt", "en"),
    ("Output format: CSV.", "direkt", "en"),
    ("Format: YAML.", "direkt", "en"),
    ("Antworte als Tabelle.", "direkt", "de"),
    ("Antworte als Markdown-Liste.", "direkt", "de"),
    ("Antworte mit einer Zahl von 1 bis 10.", "direkt", "de"),
    ("Reply with the letter of the correct option.", "direkt", "en"),
    ("Wie viele Beine hat eine Spinne? Nur die Ziffer, bitte.", "direkt", "de"),
    ("Keine Erklaerung: Was ist 2+2?", "direkt", "de"),
    ("Do not explain, just the number: 17*23", "direkt", "en"),
    ("Was ist die Wurzel aus 144? Nur die Antwort.", "direkt", "de"),
    ("Erklaere nichts, antworte in einem Wort: Hauptstadt von Frankreich?", "direkt", "de"),
]
# (e) JSON als Thema, „Gib … aus" über einen Satzteil, „genau"/„nur" als Adverb: kein Formatzwang.
FORMAT_ALS_THEMA_AUFWAND = [
    ("Explain the difference between JSON and XML and when to use each.", "aufwand", "en"),
    ("Entwirf ein JSON-Schema fuer Kundenvertraege und begruende jede Entscheidung.", "aufwand", "de"),
    ("Design a JSON API for the customer onboarding flow, covering data model, contract and rollout.", "aufwand", "en"),
    ("Gib mir einen Rat: Soll ich aus dem Mietvertrag aussteigen oder bleiben?", "aufwand", "de"),
    ("Gib mir Tipps, wie ich aus der Schuldenfalle komme, und erklaere warum.", "aufwand", "de"),
    ("Analysiere genau, welche Zahl in dieser Reihe fehlt, und begruende jeden Schritt: 2, 3, 5, 7, 11, 17.", "aufwand", "de"),
    ("Nur die erste Zeile ist falsch; erklaere warum und korrigiere sie.", "aufwand", "de"),
    ("Only change the line that throws, and explain why the refactor is needed for the team.", "aufwand", "en"),
    ("Erklaere genau, warum die Zahl 7 eine Primzahl ist und 9 nicht.", "aufwand", "de"),
]
# (f) Formatzwang MIT Einsatzhöhe: die Aufwandsregel bleibt (sie endet selbst im verlangten Format).
FORMATZWANG_MIT_EINSATZHOEHE_AUFWAND = [
    ("Sollen wir die API nach Prod migrieren? Antworte mit ja oder nein.", "aufwand", "de"),
    ("Should we deploy the schema on Friday? Reply with yes or no.", "aufwand", "en"),
    ("Wie sollte ich mein Team ueber die Kuendigung eines Kollegen informieren? Bitte mit genau einem Wort pro Punkt.", "aufwand", "de"),
    ("Soll ich den Vertrag unterschreiben? Nur ja oder nein.", "aufwand", "de"),
    ("Delete the user's data? Answer with a single word.", "aufwand", "en"),
]
GEGENBEISPIELE = (ALLTAGSWOERTER_DIREKT + DATUM_VERSION_DIREKT + KLEINSCHREIBUNG_AUFWAND + FORMATZWANG_DIREKT
                  + FORMAT_ALS_THEMA_AUFWAND + FORMATZWANG_MIT_EINSATZHOEHE_AUFWAND)
DATENSATZ = DATENSATZ_KERN + GEGENBEISPIELE


def _kurz(x):
    return x[:48] if isinstance(x, str) else x


def test_datensatz_groesse_und_sprachen():
    assert len(DATENSATZ_KERN) >= 40 and len(GEGENBEISPIELE) >= 60
    assert sum(1 for _, _, sp in DATENSATZ if sp == "en") >= 15
    assert sum(1 for _, _, sp in DATENSATZ if sp == "de") >= 20
    assert {s for _, s, _ in DATENSATZ} == {"direkt", "aufwand"}
    assert sum(1 for _, s, _ in DATENSATZ if s == "direkt") >= 15
    assert sum(1 for _, s, _ in DATENSATZ if s == "aufwand") >= 15
    assert len({p for p, _, _ in DATENSATZ}) == len(DATENSATZ)


def test_trefferquote_datensatz_mindestens_90_prozent():
    fehler = []
    for prompt, soll, _ in DATENSATZ:
        ist = switch.decide(prompt)["stage"]
        if ist != soll:
            fehler.append((prompt[:60], soll, ist))
    quote = 1 - len(fehler) / len(DATENSATZ)
    assert quote >= 0.9, f"Trefferquote {quote:.1%}; Fehler: {fehler}"


@pytest.mark.parametrize("prompt,soll,_", GEGENBEISPIELE, ids=_kurz)
def test_gegenbeispiel_je_klasse(prompt, soll, _):
    """Jedes Gegenbeispiel einzeln — eine Quote von 90 % versteckt eine ganze Klasse."""
    d = switch.decide(prompt)
    assert d["stage"] == soll, (d["stage"], d["signals"], d["sentences"], d["reason"])
    assert (d["inject"] == model.AUFWANDSREGEL) == (soll == "aufwand")


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


@pytest.mark.parametrize("prompt,soll", [
    # a5: Kleinschreibung nach Satzende und Semikolon zählen
    ("lisa hat dreimal so viele aepfel wie tom. zusammen haben sie 48. tom gibt lisa 6 aepfel. wie viele hat lisa jetzt?", 4),
    ("berechne den umfang eines kreises mit radius 3. runde auf zwei stellen.", 2),
    ("Berechne den Umfang eines Kreises mit Radius 3; runde auf zwei Stellen; nenne die Formel", 3),
    ("Was ist 2+2? und 3+3?", 2),
    ("Frage eins? frage zwei?", 2),
    # a7: Ordinal vor Substantiv, Anrede-Abkürzung, Wochentag, Auslassungspunkte sind kein Satzende
    ("Wer regierte Frankreich im 18. Jahrhundert?", 1),
    ("Wer wurde 3. Bundeskanzler?", 1),
    ("Hr. Meier hat angerufen, was nun?", 1),
    ("Treffen am Mo. 12 Uhr?", 1),
    ("Hmm... Was ist 2+2?", 1),
    # aber: Ordinal nach Substantiv bleibt Satzende („Radius 3. Runde …")
    ("Berechne den Umfang eines Kreises mit Radius 3. Runde auf zwei Stellen.", 2),
])
def test_satzzaehler_kleinschreibung_semikolon_ordinal(prompt, soll):
    assert switch.sentence_count(prompt) == soll


# --- Ordinal-Ausnahme (Schlussprüfung, Befund 4) ------------------------------------------------
# „im 18. Jahrhundert" ist kein Satzende — „um 9. Wie lange dauert er?" schon. Die Ausnahme hing
# vorher nur an „Allerweltswort + ein- bis zweistellige Zahl + Punkt + Großbuchstabe" und
# verschluckte damit 8 von 10 alltäglichen Zweisatz-Prompts (die Aufwandsregel entfiel).
@pytest.mark.parametrize("prompt", [
    "Der Kurs beginnt um 9. Wie lange dauert er?",
    "Ich komme um 3. Bring bitte Kuchen mit.",
    "Wir treffen uns am 5. Sag Bescheid, ob das passt.",
    "Das Paket kam vor 3. Wann kommt das naechste?",
    "Die Sitzung ist in 2. Kannst du frueher da sein?",
    "The meeting is at 3. Please confirm the room.",
    "It costs about 20. Can you split it with me?",
    "Wir warten seit 4. Wie lange noch?",
    "Er wurde 2. Wie viele Punkte hatte der Sieger?",
    "Runde auf 2. Wie viel ist das dann?",
])
def test_ordinal_ausnahme_verschluckt_kein_satzende(prompt):
    assert switch.sentence_count(prompt) == 2, prompt
    assert switch.decide(prompt)["stage"] == "aufwand"


@pytest.mark.parametrize("prompt", [
    "Wer regierte Frankreich im 18. Jahrhundert?",
    "Wer wurde 3. Bundeskanzler?",
    "Das Buch erschien in der 2. Auflage.",
    "Sie landete auf dem 4. Platz.",
])
def test_ordinal_vor_substantiv_bleibt_ein_satz(prompt):
    assert switch.sentence_count(prompt) == 1, prompt


# --- Semikolon (Schlussprüfung, Befund 5) -------------------------------------------------------
# Das Semikolon als Satzende traf auch Code und Aufzählungen: 10 von 50 kurzen Alltagsprompts
# kippten von 'direkt' auf 'aufwand' — genau die Dauerschicht, die −16,7 pp Formattreue kostet.
@pytest.mark.parametrize("prompt", [
    "Was gibt dieser Code aus: a = 1; b = 2; print(a+b)?",
    "Was bedeutet 'for (i=0; i<n; i++)'?",
    "Korrigiere die Zeile: int x = 5; return x;",
    "Sortiere alphabetisch: Birne; Apfel; Kirsche",
    "Zutaten: Mehl; Zucker; Eier - was fehlt?",
    "Uebersetze ins Englische: Hallo; wie geht es dir?",
    "Was kostet das ggf. mehr?",
    "Wie heisst die Hauptstadt, bspw. von Peru?",
    "Nenne drei Obstsorten, z.T. exotisch",
    "Was steht in Art. 5 GG?",
])
def test_semikolon_in_code_und_aufzaehlung_ist_kein_satzende(prompt):
    assert switch.sentence_count(prompt) == 1, prompt
    assert switch.decide(prompt)["stage"] == "direkt", switch.prefilter(prompt)


def test_semikolon_zwischen_zwei_teilsaetzen_bleibt_satzende():
    """Die Gegenprobe: drei echte Teilsätze mit Verb bleiben drei Sätze."""
    assert switch.sentence_count(
        "Berechne den Umfang eines Kreises mit Radius 3; runde auf zwei Stellen; nenne die Formel") == 3
    assert switch.sentence_count("Lies die Datei ein; danach zaehle die Zeilen") == 2


def test_move_to_ort_ist_keine_vorweggenommene_loesung():
    """Schlussprüfung, Befund 9: „move to" + Eigenname feuerte auf „move to Munich"."""
    d = switch.decide("How long does it take to move to Munich?")
    assert d["signals"] == [] and d["stage"] == "direkt"
    # mit technischem Objekt bleibt es eine vorweggenommene Lösung
    assert "presupposed_solution" in switch.detect_signals("Let us move to a queue instead.")
    assert "presupposed_solution" in switch.detect_signals("We should migrate to Postgres.")


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


@pytest.mark.parametrize("prompt,soll,_", FORMATZWANG_DIREKT, ids=_kurz)
def test_gaengige_formatzwaenge_erkannt(prompt, soll, _):
    """a4/a7: „Antworte mit ja oder nein", „number only", „Keine Erklärung" … sind Formatzwänge."""
    pf = switch.prefilter(prompt)
    assert pf["format_locked"] is True and "format_locked" in pf["signals"]
    d = switch.decide(prompt)
    assert d["stage"] == "direkt" and d["inject"] == ""


@pytest.mark.parametrize("prompt,soll,_", FORMAT_ALS_THEMA_AUFWAND, ids=_kurz)
def test_json_als_thema_ist_kein_formatzwang(prompt, soll, _):
    """a4: bloßes „JSON", „Gib mir einen Rat … aus dem Mietvertrag", „genau"/„nur" als Adverb
    schreiben kein Ausgabeformat fest — die Aufwandsregel bleibt eingeblendet."""
    pf = switch.prefilter(prompt)
    assert pf["format_locked"] is False and "format_locked" not in pf["signals"]
    d = switch.decide(prompt)
    assert d["stage"] == "aufwand" and d["inject"] == model.AUFWANDSREGEL


def test_formatzwang_ohne_einsatzhoehe_direkt_mit_einsatzhoehe_aufwand():
    """Der Formatzwang überstimmt nur, wenn keine Einsatzhöhe vorliegt: irreversible/durable/
    architecture/affects_others/commitment/recommendation halten die Aufwandsregel — sie endet
    selbst mit „Antworte am Ende im verlangten Format". reasoning/craft sind keine Einsatzhöhe."""
    assert set(switch.STAKES_SIGNALS) == {"irreversible", "durable", "architecture", "affects_others",
                                          "commitment", "recommendation"}
    assert model.AUFWANDSREGEL.endswith("Antworte am Ende im verlangten Format.")
    for prompt in ("Vergleiche PostgreSQL und SQLite und antworte mit einer einzigen Zahl von 1 bis 10 fuer SQLite.",
                   "Rate the design quality of this layout from 1 to 10, number only."):
        d = switch.decide(prompt)
        assert d["format_locked"] and set(d["signals"]) & {"reasoning", "craft"}
        assert d["stage"] == "direkt" and d["inject"] == "" and "format_locked" in d["reason"]
    prompt = ("Sollen wir die API nach Prod migrieren oder erst das Datenmodell umbauen? "
              "Antworte nur mit ja oder nein.")
    d = switch.decide(prompt)
    assert d["format_locked"] and "irreversible" in d["signals"]
    assert d["stage"] == "aufwand" and d["inject"] == model.AUFWANDSREGEL
    assert d["reason"].startswith("Signale: ") and "format_locked" in d["reason"] and "Einsatzhöhe" in d["reason"]
    for prompt, _, _ in FORMATZWANG_MIT_EINSATZHOEHE_AUFWAND:
        d = switch.decide(prompt)
        assert d["format_locked"] and set(d["signals"]) & set(switch.STAKES_SIGNALS)
        assert d["stage"] == "aufwand" and d["inject"] == model.AUFWANDSREGEL


@pytest.mark.parametrize("prompt", [
    "Erklaere genau, warum der Code langsam ist.",
    "Rechne nur die erste Aufgabe aus und erklaere den Weg.",
    "Beschreibe exakt, wie der Algorithmus arbeitet.",
    "Gib mir eine Antwort auf die Frage, ob ich aus dem Vertrag aussteigen soll.",
    "Explain the difference between JSON and XML.",
])
def test_formatzwang_ohne_falsch_positive(prompt):
    assert switch.prefilter(prompt)["format_locked"] is False


def test_negierte_erklaerung_ist_kein_denkauftrag():
    """a7: „Keine Erklärung", „Do not explain", „Erkläre nichts" trafen das reasoning-Signal
    und hoben eine triviale Aufgabe auf „aufwand"."""
    for prompt in ("Keine Erklaerung: Was ist 2+2?", "Do not explain, just the number: 17*23",
                   "Erklaere nichts, antworte in einem Wort: Hauptstadt von Frankreich?",
                   "Ohne Erklaerung: Wurzel aus 144?", "Nicht erklaeren, nur die Zahl: 6*7"):
        pf = switch.prefilter(prompt)
        assert "reasoning" not in pf["signals"] and pf["format_locked"] is True, (prompt, pf)
        assert switch.decide(prompt)["stage"] == "direkt"
    assert "reasoning" in switch.detect_signals("Erklaere, warum der Himmel blau ist.")
    assert "reasoning" in switch.detect_signals("Explain why the sky is blue.")


@pytest.mark.parametrize("text", [
    "1.1.2000", "08.09.2026", "3.11.2", "192.168.0.1", "12:30:15", "1.000.000", "1,5", "2026-09-08",
    "1 + 2 + 3", "17*23+5", "Python 3.11.2 und 3.12", "von 1 bis 10",
])
def test_mehrere_groessen_liest_datum_version_ip_kette_als_eine_groesse(text):
    assert switch.SIGNALS["mehrere_groessen"].search(text) is None, text
    assert "mehrere_groessen" not in switch.detect_signals(f"Was ist mit {text}?")


@pytest.mark.parametrize("text", [
    "3 Stunden mit 80 km/h, dann 2 Stunden", "2, 3, 5", "8:15 Uhr, 90 km/h, 9:00 Uhr",
    "Temperaturen -5, 3 und 10 Grad", "1 2 3",
])
def test_mehrere_groessen_zaehlt_drei_getrennte_groessen(text):
    assert switch.SIGNALS["mehrere_groessen"].search(text) is not None, text


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


@pytest.mark.parametrize("prompt", [p for p, _, _ in ALLTAGSWOERTER_DIREKT] + [
    "Add a drop-down to the form.", "Der Patient wartet.", "The design is nice.", "Structure of the atom?",
], ids=_kurz)
def test_alltagswoerter_ohne_kontext_kein_signal(prompt):
    """a5: team, public, patient, kauf/buy, wähl, ship, launch, E-Mail, standard, api, interface,
    balance, layout, migration, release, investigate, delete, nutze, add, foundation — allein kein Signal."""
    assert switch.detect_signals(prompt) == []
    assert switch.prefilter(prompt)["trivial"] is True


@pytest.mark.parametrize("prompt,signal", [
    ("Wie informiere ich mein Team ueber die Kuendigung?", "affects_others"),
    ("Ship it to production today.", "production"),
    ("Launch the new product on Monday.", "production"),
    ("Change the public API of the payments service.", "durable"),
    ("Which team standards should we adopt?", "durable"),
    ("Delete the user's data now.", "irreversible"),
    ("Migrate the database to Postgres.", "irreversible"),
    ("Soll ich den Vertrag unterschreiben?", "irreversible"),
    ("Should we buy a new server or rent one?", "commitment"),
    ("Entscheide dich fuer einen Anbieter.", "commitment"),
    ("Investment in automation or hiring?", "commitment"),
    ("Schreibe eine E-Mail an den Kunden.", "text"),
    ("Use Redis for sessions.", "presupposed_solution"),
    ("Nutze eine Datenbank dafuer.", "presupposed_solution"),
    ("Balance between speed and safety.", "tradeoff"),
    ("Improve the page layout of the checkout.", "craft"),
], ids=_kurz)
def test_signale_nur_mit_kontext(prompt, signal):
    assert signal in switch.detect_signals(prompt)


def test_signale_treffen_wo_sie_sollen():
    s = switch.detect_signals("Sollen wir die API nach Prod migrieren oder erst das Datenmodell umbauen?")
    assert {"recommendation", "irreversible", "durable", "architecture", "production"} <= set(s)
    s = switch.detect_signals("Entweder wir kaufen jetzt oder wir warten ein Jahr.")
    assert "tradeoff" in s and "commitment" in s
    assert "text" in switch.detect_signals("Schreibe eine Absage an einen Bewerber.")
    assert "reasoning" in switch.detect_signals("Prove that the sum is even.")
    assert "mehrere_groessen" in switch.detect_signals("3 Stunden mit 80 km/h, dann 2 Stunden")
    assert "mehrere_groessen" not in switch.detect_signals("Berechne 2+2")
    # jedes Signal des Katalogs ist mit Kontext erreichbar, in Katalogreihenfolge
    alle = ("Add a cache. How should we design the public API contract? Refactor the architecture before we "
            "deploy to production. Decide whether to buy a new server. Should we tell my team? Speed vs. safety. "
            "Polish the UI design. Ship it to prod. Write an e-mail to the team. Prove why. "
            "3 Stunden, 80 km/h, 2 Stunden. Only the number.")
    assert switch.detect_signals(alle) == list(switch.SIGNALS)


def test_aufwand_blendet_die_gemessene_regel_ein():
    d = switch.decide("Sollen wir die API nach Prod migrieren oder erst das Datenmodell umbauen?")
    assert d["stage"] == "aufwand" and d["inject"] == model.AUFWANDSREGEL
    assert d["reason"].startswith("Signale: ") and d["probe"] is None


def test_vorfilter_unter_50_ms_auch_mit_stichwortsuche_in_der_mitte():
    """D017: < 50 ms auch bei eingefügten Dateien (a6: 122 000 Zeichen brauchten 129 ms).

    Kalt gemessen — der Zwischenspeicher von _scan_window wird vor jeder Messung geleert, sonst
    misst der Test den zweiten Aufruf und nicht den Stichwortlauf."""
    big = ("Wort " * 20000) + "1.1.1 " * 2000 + "Gib " + "x " * 5000 + " aus"
    assert len(big) > 120_000
    best = min(_gemessen(big) for _ in range(3))
    assert best < 50, f"{best:.1f} ms"
    assert "irreversible" in switch.detect_signals("deploy to production " + "x " * 10000)
    assert "format_locked" in switch.detect_signals("x " * 10000 + " Return only the number.")
    assert switch.SIGNAL_SCAN_HEAD + switch.SIGNAL_SCAN_TAIL <= 6000
    assert switch.SIGNAL_SCAN_MIDDLE <= 2000


def _gemessen(prompt: str) -> float:
    switch._scan_window.cache_clear()
    t = time.perf_counter()
    switch.decide(prompt)
    return (time.perf_counter() - t) * 1000


# --- Die Mitte langer Prompts (Schlussprüfung, Befunde 2, 6 und 8) -----------------------------
# Der alte Test schrieb die Fensterlücke als gewollt fest („ein Signal mitten in der eingefügten
# Datei entscheidet nichts — die Länge tut es schon"). Das galt nur ohne Formatzwang: mit einem
# Formatzwang am Rand springt decide() in den Zweig „format_locked und keine Einsatzhöhe" und
# liefert 'direkt' — die Länge entscheidet dann eben NICHT, und die Stufe wird durch bloße
# Platzierung von Text steuerbar. Umgekehrt blieb eine Formatvorgabe in der Mitte unsichtbar und
# die Aufwandsregel wurde trotz festgeschriebenem Ausgabeformat eingeblendet (−16,7 pp).
def _langer_prompt(mitte: str, kopf: str = "", schluss: str = "") -> str:
    """Kopf und Schluss aus neutralem Füllmaterial; `mitte` liegt garantiert im Mittelstück."""
    fuell_kopf = kopf + "\n" + "x " * ((switch.SIGNAL_SCAN_HEAD // 2) + 100)
    fuell_schluss = "y " * ((switch.SIGNAL_SCAN_TAIL // 2) + 100) + "\n" + schluss
    p = fuell_kopf + "\n" + mitte + "\n" + fuell_schluss
    assert len(p) > switch.SIGNAL_SCAN_HEAD + switch.SIGNAL_SCAN_TAIL
    assert mitte in p[switch.SIGNAL_SCAN_HEAD:len(p) - switch.SIGNAL_SCAN_TAIL]
    return p


def test_einsatzhoehe_in_der_mitte_schlaegt_formatzwang_am_rand():
    """a4: „migrate the production database and delete the old customer records" in der Mitte,
    „Answer with yes or no." am Schluss ergab 'direkt' ohne Aufwandsregel."""
    p = _langer_prompt("Danach: migrate the production database and delete the old customer records.",
                       schluss="Answer with yes or no.")
    d = switch.decide(p)
    assert "irreversible" in d["signals"] and "affects_others" in d["signals"]
    assert d["format_locked"] is True
    assert d["stage"] == "aufwand" and d["inject"] == model.AUFWANDSREGEL
    # dieselbe Lage mit der Formatvorgabe im Kopf
    q = _langer_prompt("Sollen wir die Datenbank nach Prod migrieren und alle Kundendaten loeschen?",
                       kopf="Answer with yes or no.")
    e = switch.decide(q)
    assert e["stage"] == "aufwand" and e["inject"] == model.AUFWANDSREGEL
    assert {"irreversible", "affects_others"} <= set(e["signals"])


@pytest.mark.parametrize("mitte", [
    "Wie viele Zeilen sind es? Antworte nur mit der Zahl.",
    "Gib die Summe als JSON aus.",
    "Zaehle die Zeilen. Number only.",
    "Wie viele Zeilen? Keine Erklaerung.",
])
def test_formatzwang_in_der_mitte_wird_gefunden(mitte):
    """a2: ab rund 4 500 Zeichen war eine Ausgabe-Direktive in der Mitte unsichtbar — die
    Aufwandsregel wurde eingeblendet, obwohl der Prompt das Format festschreibt."""
    p = _langer_prompt(mitte)
    d = switch.decide(p)
    assert d["format_locked"] is True, d["signals"]
    assert d["stage"] == "direkt" and d["inject"] == ""


# Je Signal der Einsatzhöhe (plus Formatzwang) eine Wendung, die MITTEN in einem langen Prompt
# steht: die Stichwörter aus _SCAN_KEYS müssen sie dort finden, sonst entscheidet die Platzierung.
MITTE_WENDUNG = {
    "irreversible": "Wir migrieren die Datenbank nach Prod und loeschen alle Kundendaten.",
    "durable": "Die Schnittstelle muss langfristig stabil bleiben.",
    "architecture": "Wir sollten die Architektur des Dienstes umbauen.",
    "affects_others": "Das betrifft unsere Kunden und Kundinnen.",
    "commitment": "Das ist eine Entscheidung fuer die naechsten Jahre.",
    "recommendation": "Welche Variante empfehlen wir?",
    "format_locked": "Antworte nur mit der Zahl.",
}


@pytest.mark.parametrize("signal,wendung", sorted(MITTE_WENDUNG.items()))
def test_jedes_einsatzhoehe_signal_wird_auch_in_der_mitte_gefunden(signal, wendung):
    assert signal in switch.detect_signals(wendung), "Wendung trifft ihr Signal nicht"
    p = _langer_prompt(wendung)
    assert signal in switch.detect_signals(p), f"{signal} in der Mitte nicht gefunden"


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


def test_routing_log_rotiert_wie_der_bus(monkeypatch):
    """a6: 2 000 Prompts → 485 kB, linear wachsend, nie rotiert. Jetzt dieselbe Schwelle wie der Bus."""
    assert switch._ROTATE_BYTES == bus._ROTATE_BYTES
    monkeypatch.setattr(switch, "_ROTATE_BYTES", 400)
    for _ in range(12):
        switch.decide("Was ist die Hauptstadt von Frankreich?")
    ziel = paths.routing_file()
    rotiert = sorted(ziel.parent.glob("routing-*.jsonl"))
    assert rotiert, "keine rotierte Datei"
    assert ziel.stat().st_size <= 400 + 400
    zeilen = sum(len(p.read_text(encoding="utf-8").splitlines()) for p in rotiert + [ziel])
    assert zeilen == 12


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


@pytest.mark.parametrize("a,b,einig", [
    ("Paris.", "Paris", True),
    ("Ja.", "Ja", True),
    ("Die Antwort ist Paris", "Paris", True),
    ("Answer: Berlin", "The answer is Berlin.", True),
    ("Ergebnis: rot", "**Rot**", True),
    ("42", "Die Antwort lautet 42.", True),
    ("Nein, Paris", "Paris", False),
    ("Paris", "Lyon", False),
])
def test_sonde_normalisiert_satzzeichen_markdown_und_praefix(fake_model, a, b, einig):
    """a6: „Paris." gegen „Paris" hieß uneinig → Prüfer (zwei Aufrufe, 0 % formattreu auf einfachen Antworten)."""
    fake_model([a, b])
    r = switch.entropy_probe("x")
    assert r["agree"] is einig, r["values"]


def test_sonde_ruft_mindestens_zweimal(fake_model):
    """a6: n=0 ergab einen Aufruf, der immer einig ist."""
    aufrufe = fake_model(["1", "2"])
    r = switch.entropy_probe("x", n=0)
    assert r["calls"] == 2 and len(aufrufe) == 2 and r["agree"] is False
    aufrufe = fake_model(["7", "7"])
    r = switch.entropy_probe("x", n=1)
    assert r["calls"] == 2 and len(aufrufe) == 2 and r["agree"] is True


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
