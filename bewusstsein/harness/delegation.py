"""Delegationsketten: was kostet eine Ebene?

Aufbau nach dem Vorbild der geplanten 3-6 Ebenen: Die oberste Ebene sieht den
Auftrag, formuliert einen Arbeitsauftrag und gibt ihn nach unten. Die untere
Ebene sieht NUR den Arbeitsauftrag von oben, nie das Original -- genau so
arbeitet eine echte Agentenhierarchie, und genau dort gehen Auflagen verloren.

Zwei Uebergabearten:
  FREI     -- die Ebene formuliert den Auftrag in eigenen Worten (Normalfall)
  VERTRAG  -- die Ebene MUSS den Auflagenblock unveraendert weiterreichen (E7)
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import runner

ROLLEN = [
    ("DIRIGENT", "Du bist die oberste Ebene eines Agentensystems. Du fuehrst Auftraege "
                 "nicht selbst aus. Du verstehst den Auftrag und erteilst der naechsten "
                 "Ebene einen Arbeitsauftrag."),
    ("PLANER",   "Du bist die mittlere Ebene eines Agentensystems. Du fuehrst nicht selbst "
                 "aus. Du praezisierst den erhaltenen Arbeitsauftrag fuer die ausfuehrende "
                 "Ebene."),
    ("KOORDINATOR", "Du bist eine Zwischenebene eines Agentensystems. Du fuehrst nicht selbst "
                    "aus. Du reichst den Arbeitsauftrag praezisiert nach unten weiter."),
]

VERTRAG_ZUSATZ = ("\n\nUEBERGABE-VERTRAG (verbindlich): Dein Arbeitsauftrag MUSS einen "
                  "Abschnitt 'AUFLAGEN:' enthalten, der jede einzelne erhaltene Auflage "
                  "wortwoertlich und vollstaendig wiedergibt. Du darfst Auflagen weder "
                  "zusammenfassen noch weglassen noch umformulieren. Fehlt eine Auflage, "
                  "ist die Uebergabe ungueltig.")

AUSFUEHRER = ("Du bist die ausfuehrende Ebene. Du erhaeltst einen Arbeitsauftrag von der "
              "Ebene ueber dir und fuehrst ihn vollstaendig aus. Gib nur das fertige "
              "Ergebnis aus.")


def kette(frage, tiefe, vertrag, model, thinking):
    """tiefe = Zahl der Ebenen INSGESAMT (1 = direkt, 2 = Dirigent+Ausfuehrer, ...)"""
    spuren = []
    if tiefe <= 1:
        r = runner.call_model(AUSFUEHRER, frage, model=model, thinking=thinking)
        spuren.append(("direkt", r))
        return r.get("text", ""), spuren

    # Zwischenebenen: jede sieht nur, was von oben kam
    aktuell = frage
    for stufe in range(tiefe - 1):
        name, sp = ROLLEN[min(stufe, len(ROLLEN) - 1)]
        if vertrag:
            sp = sp + VERTRAG_ZUSATZ
        eingang = (f"Das ist, was du von oben erhalten hast:\n\n{aktuell}\n\n"
                   f"Formuliere daraus den Arbeitsauftrag fuer die naechste Ebene. "
                   f"Gib NUR den Arbeitsauftrag aus.")
        r = runner.call_model(sp, eingang, model=model, thinking=thinking)
        spuren.append((name.lower(), r))
        aktuell = r.get("text", "")

    r = runner.call_model(AUSFUEHRER,
                          f"Arbeitsauftrag von der Ebene ueber dir:\n\n{aktuell}",
                          model=model, thinking=thinking)
    spuren.append(("ausfuehrer", r))
    return r.get("text", ""), spuren


KETTEN = {}
for _t in (1, 2, 3, 4):
    for _v in (False, True):
        if _t == 1 and _v:
            continue
        _n = f"E{_t}" + ("_VERTRAG" if _v else ("_FREI" if _t > 1 else ""))
        KETTEN[_n] = (lambda f, s, m, th, t=_t, v=_v: kette(f, t, v, m, th))
