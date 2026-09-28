"""Generiert Aufgabensuiten mit programmatisch garantierter Grundwahrheit.

Kein Judge, keine Modell-Erzeugung fuer die Antworten: jede Loesung wird in Python
gerechnet. Damit entfaellt der gefaehrlichste Confound der Vorgaengerforschung
(Laengenbias des Judges, vier widerrufene Zahlen).
"""
import json, random, os
from fractions import Fraction

R = random.Random(20260906)


def _f(x):
    """Zahl huebsch als String (ganzzahlig wenn moeglich)."""
    fr = Fraction(x).limit_denominator(10**6)
    if fr.denominator == 1:
        return str(fr.numerator)
    v = float(fr)
    s = f"{v:.4f}".rstrip("0").rstrip(".")
    return s


# ---------------------------------------------------------------- FALLE
def gen_falle(n_each=8):
    """Denkfallen mit starkem falschem Attraktor, exakt berechenbar."""
    tasks = []

    # 1 Bat-and-Ball
    for i in range(n_each):
        diff = R.choice([100, 90, 110, 120, 80, 150, 60, 200])
        total = diff + R.choice([10, 20, 5, 50, 30, 40, 15, 25]) * 2
        ball = Fraction(total - diff, 2)
        bat = ball + diff
        tasks.append(dict(
            id=f"falle_bat_{i}", typ="bat_and_ball",
            frage=(f"Ein Werkzeug und eine Huelle kosten zusammen {total} Euro. "
                   f"Das Werkzeug kostet {diff} Euro mehr als die Huelle. "
                   f"Wie viel kostet die Huelle in Euro?"),
            antwort=_f(ball), koeder=_f(Fraction(total - diff)),
        ))

    # 2 Maschinen/Widgets (Skalierung ist invariant)
    for i in range(n_each):
        m = R.choice([5, 7, 9, 12, 4, 8]); t = R.choice([5, 7, 9, 12, 6]); m2 = R.choice([100, 60, 200, 45])
        tasks.append(dict(
            id=f"falle_masch_{i}", typ="maschinen",
            frage=(f"{m} Maschinen brauchen {t} Minuten, um {m} Teile zu fertigen. "
                   f"Wie viele Minuten brauchen {m2} Maschinen fuer {m2} Teile?"),
            antwort=_f(t), koeder=_f(Fraction(m2 * t, m)),
        ))

    # 3 Prozent hoch/runter (nicht kommutativ zum Ausgang)
    for i in range(n_each):
        p = R.choice([10, 20, 25, 30, 40, 50]); start = R.choice([200, 400, 800, 1000, 600])
        end = Fraction(start) * (1 + Fraction(p, 100)) * (1 - Fraction(p, 100))
        tasks.append(dict(
            id=f"falle_prozent_{i}", typ="prozent",
            frage=(f"Ein Preis von {start} Euro steigt um {p} Prozent und faellt danach "
                   f"um {p} Prozent. Wie hoch ist der Endpreis in Euro?"),
            antwort=_f(end), koeder=_f(Fraction(start)),
        ))

    # 4 Durchschnittsgeschwindigkeit (harmonisches Mittel, nicht arithmetisch)
    for i in range(n_each):
        v1 = R.choice([30, 40, 60, 20, 50]); v2 = R.choice([60, 90, 120, 80, 100])
        if v1 == v2:
            v2 = v1 * 2
        harm = Fraction(2 * v1 * v2, v1 + v2)
        tasks.append(dict(
            id=f"falle_tempo_{i}", typ="tempo",
            frage=(f"Ein Fahrzeug faehrt dieselbe Strecke hin mit {v1} km/h und zurueck "
                   f"mit {v2} km/h. Wie hoch ist die Durchschnittsgeschwindigkeit fuer "
                   f"die Gesamtstrecke in km/h?"),
            antwort=_f(harm), koeder=_f(Fraction(v1 + v2, 2)),
        ))

    # 5 Seerosen-Verdopplung
    for i in range(n_each):
        days = R.choice([48, 60, 30, 100, 24, 40])
        tasks.append(dict(
            id=f"falle_wachstum_{i}", typ="wachstum",
            frage=(f"Eine Flaeche mit Algen verdoppelt sich taeglich. Nach {days} Tagen "
                   f"ist der See vollstaendig bedeckt. An welchem Tag war er halb bedeckt?"),
            antwort=str(days - 1), koeder=str(days // 2),
        ))

    # 6 Inklusion-Exklusion
    for i in range(n_each):
        tot = R.choice([100, 200, 150, 250]); a = R.randint(40, 80); b = R.randint(40, 80)
        both = R.randint(10, min(a, b) - 5)
        neither = tot - (a + b - both)
        if neither < 0:
            continue
        tasks.append(dict(
            id=f"falle_mengen_{i}", typ="mengen",
            frage=(f"In einer Gruppe von {tot} Personen nutzen {a} Werkzeug A und {b} "
                   f"Werkzeug B; {both} nutzen beide. Wie viele nutzen keines von beiden?"),
            antwort=str(neither), koeder=str(tot - a - b),
        ))

    # 7 Zinseszins vs. einfacher Zins
    for i in range(n_each):
        p = R.choice([10, 20, 50]); yrs = R.choice([2, 3]); start = R.choice([100, 200, 1000])
        end = Fraction(start) * (1 + Fraction(p, 100)) ** yrs
        tasks.append(dict(
            id=f"falle_zins_{i}", typ="zins",
            frage=(f"Ein Betrag von {start} Euro waechst {yrs} Jahre lang um jeweils {p} "
                   f"Prozent pro Jahr auf den jeweiligen Vorjahreswert. Endbetrag in Euro?"),
            antwort=_f(end), koeder=_f(Fraction(start) * (1 + Fraction(p * yrs, 100))),
        ))

    # 8 Restklassen / Uhrzeit ueber Grenze
    for i in range(n_each):
        h = R.randint(1, 12); add = R.choice([50, 75, 100, 130, 200, 90])
        res = (h + add) % 12
        res = 12 if res == 0 else res
        tasks.append(dict(
            id=f"falle_uhr_{i}", typ="uhr",
            frage=(f"Eine Uhr zeigt {h} Uhr. Welche Stunde zeigt sie {add} Stunden spaeter? "
                   f"Antworte mit einer Zahl von 1 bis 12."),
            antwort=str(res), koeder=str((h + add)),
        ))
    return tasks


# ---------------------------------------------------------------- STOERUNG
def gen_stoerung(n_each=10):
    """Einfache, streng formatierte Aufgaben. Baseline soll nahe Decke liegen:
    hier wird NICHT Verbesserung gemessen, sondern Schaden durch Struktur."""
    tasks = []
    woerter = ["Ordnung","Gedaechtnis","Struktur","Faktor","Ebene","Pruefung","Dirigent",
               "Wissen","Signal","Vertrag","Schicht","Kanal","Muster","Quelle","Beleg"]

    for i in range(n_each):
        ws = R.sample(woerter, 6); k = R.randint(1, 6)
        tasks.append(dict(
            id=f"stoer_wort_{i}", typ="wort_index",
            frage=(f"Liste: {', '.join(ws)}\nGib NUR das {k}. Wort der Liste aus. "
                   f"Keine Erklaerung, kein weiterer Text."),
            antwort=ws[k-1]))

    for i in range(n_each):
        a = R.randint(11, 99); b = R.randint(11, 99)
        tasks.append(dict(
            id=f"stoer_rechnen_{i}", typ="rechnen",
            frage=f"Berechne {a} + {b}. Gib NUR die Zahl aus, sonst nichts.",
            antwort=str(a+b)))

    for i in range(n_each):
        s = "".join(R.choice("abcdefghijklmnopqrstuvwxyz") for _ in range(R.randint(8,14)))
        c = R.choice(list(set(s)))
        tasks.append(dict(
            id=f"stoer_zaehl_{i}", typ="zaehlen",
            frage=(f"Zeichenkette: {s}\nWie oft kommt der Buchstabe '{c}' vor? "
                   f"Gib NUR die Zahl aus."),
            antwort=str(s.count(c))))

    for i in range(n_each):
        ws = R.sample(woerter, 4)
        tasks.append(dict(
            id=f"stoer_sort_{i}", typ="sortieren",
            frage=(f"Sortiere alphabetisch und gib die Woerter mit Komma+Leerzeichen "
                   f"getrennt in EINER Zeile aus, sonst nichts: {', '.join(ws)}"),
            antwort=", ".join(sorted(ws))))

    for i in range(n_each):
        name = R.choice(["Ada","Linus","Grace","Alan","Barbara","Ken"])
        alter = R.randint(20, 70)
        tasks.append(dict(
            id=f"stoer_json_{i}", typ="json",
            frage=(f"Person: {name}, Alter {alter}. Gib NUR ein JSON-Objekt aus mit genau "
                   f'den Schluesseln "name" und "alter". Kein Markdown, kein Codeblock, '
                   f"kein weiterer Text."),
            antwort=json.dumps({"name": name, "alter": alter}, ensure_ascii=False),
            typ_pruef="json"))

    for i in range(n_each):
        w = R.choice(woerter)
        tasks.append(dict(
            id=f"stoer_umkehr_{i}", typ="umkehren",
            frage=f"Gib das Wort '{w}' rueckwaerts aus. NUR das Wort, sonst nichts.",
            antwort=w[::-1]))
    return tasks


# ---------------------------------------------------------------- KALIBRIERUNG
def gen_kalibrierung(n=60):
    """Rechen-/Logikfragen gestufter Schwierigkeit + Konfidenzabfrage -> Brier/ECE."""
    tasks = []
    for i in range(n):
        stufe = i % 3
        if stufe == 0:      # leicht
            a, b = R.randint(10, 60), R.randint(10, 60)
            frage = f"Was ist {a} + {b}?"; ans = str(a + b)
        elif stufe == 1:    # mittel
            a, b = R.randint(12, 40), R.randint(12, 40)
            frage = f"Was ist {a} * {b}?"; ans = str(a * b)
        else:               # schwer
            a, b, c = R.randint(21, 79), R.randint(21, 79), R.randint(3, 19)
            frage = f"Was ist ({a} * {b}) - ({c} * {c})?"; ans = str(a * b - c * c)
        tasks.append(dict(id=f"kal_{i}", typ=f"stufe{stufe}", frage=frage, antwort=ans))
    return tasks


if __name__ == "__main__":
    out = "/home/user/nextool/bewusstsein/suiten"
    os.makedirs(out, exist_ok=True)
    for name, fn in [("falle", gen_falle), ("stoerung", gen_stoerung),
                     ("kalibrierung", gen_kalibrierung)]:
        ts = fn()
        with open(os.path.join(out, f"{name}.json"), "w") as f:
            json.dump(ts, f, ensure_ascii=False, indent=1)
        print(f"{name}: {len(ts)} Aufgaben")
