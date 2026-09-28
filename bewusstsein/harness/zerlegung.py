"""Zerlegungs-Delegation: die eigentliche These des Auftraggebers.

Der frueher gemessene Verlust galt fuers DURCHREICHEN derselben Aufgabe.
Hier wird gemessen, was der Entwurf tatsaechlich vorsieht: die oberste Ebene
ZERLEGT eine Aufgabe in Teile, jede untere Ebene bearbeitet nur ihren Teil und
sieht den Rest nie, die oberste fuegt zusammen.

Genau dort sollte Delegation gewinnen: jeder Arbeiter hat eine viel leichtere
Aufgabe und einen viel kleineren Kontext.

Aufgabe: bedingtes Zaehlen ueber eine lange Zahlenliste. Zerlegbar, exakt
nachrechenbar, und mit wachsender Laenge fuer einen einzelnen Aufruf schwer.
"""
import os, re, sys
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import runner


def _arbeiter_parallel(auftraege, model, thinking):
    """Arbeiter laufen gleichzeitig -- so wuerde ein Dirigent sie auch fuehren."""
    with ThreadPoolExecutor(max_workers=min(6, len(auftraege))) as ex:
        return list(ex.map(
            lambda a: runner.call_model(
                "Du bearbeitest einen Teilauftrag. Antworte nur mit der Zahl.",
                a, model=model, thinking=thinking),
            auftraege))


def _zahl(text):
    zs = re.findall(r"-?\d+", (text or "").replace(".", ""))
    return int(zs[-1]) if zs else None


def ganz(frage, zahlen, bedingung, model, thinking):
    """Ein Aufruf macht alles."""
    r = runner.call_model(None, frage, model=model, thinking=thinking)
    return _zahl(r.get("text", "")), [("ganz", r)]


def _teil_frage(teil, bedingung, zusatz_vorgaenger=None):
    kopf = f"Liste: {', '.join(map(str, teil))}\n\n"
    if zusatz_vorgaenger is not None:
        kopf = (f"Die Zahl unmittelbar VOR dieser Teilliste ist {zusatz_vorgaenger}.\n"
                + kopf)
    return (kopf + f"Wie viele Zahlen in dieser Teilliste erfuellen: {bedingung}?\n"
            f"Antworte NUR mit der Anzahl als Zahl.")


def zerlegt_code(frage, zahlen, bedingung, model, thinking, teile=5,
                 braucht_vorgaenger=False):
    """Oberste Ebene zerlegt mechanisch, Arbeiter zaehlen ihren Teil,
    Zusammenfuehrung mechanisch. Das ist die Bauweise, die ein Dirigent
    fuer eine mechanische Zerlegung tatsaechlich waehlen wuerde."""
    n = len(zahlen)
    gr = (n + teile - 1) // teile
    auftraege = [_teil_frage(zahlen[i:i + gr], bedingung,
                             zahlen[i - 1] if (braucht_vorgaenger and i > 0) else None)
                 for i in range(0, n, gr)]
    ergebnisse = _arbeiter_parallel(auftraege, model, thinking)
    spuren = [(f"arbeiter{j}", r) for j, r in enumerate(ergebnisse)]
    summe = sum(v for r in ergebnisse if (v := _zahl(r.get("text", ""))) is not None)
    return summe, spuren


def zerlegt_modell(frage, zahlen, bedingung, model, thinking, teile=5,
                   braucht_vorgaenger=False):
    """Wie oben, aber die oberste Ebene fuehrt die Teilergebnisse selbst
    zusammen -- naeher am Bild 'das Modell dirigiert'."""
    n = len(zahlen)
    gr = (n + teile - 1) // teile
    auftraege = [_teil_frage(zahlen[i:i + gr], bedingung,
                             zahlen[i - 1] if (braucht_vorgaenger and i > 0) else None)
                 for i in range(0, n, gr)]
    ergebnisse = _arbeiter_parallel(auftraege, model, thinking)
    spuren = [(f"arbeiter{j}", r) for j, r in enumerate(ergebnisse)]
    teilergebnisse = [r.get("text", "").strip() for r in ergebnisse]
    zus = ("Du bist die oberste Ebene. Du hast eine Zaehlaufgabe an mehrere "
           "Arbeiter verteilt. Hier sind ihre Teilergebnisse:\n\n"
           + "\n".join(f"Teil {j+1}: {t}" for j, t in enumerate(teilergebnisse))
           + "\n\nWie lautet das Gesamtergebnis? Antworte NUR mit der Zahl.")
    r = runner.call_model("Du fuegst Teilergebnisse zusammen.", zus,
                          model=model, thinking=thinking)
    spuren.append(("zusammenfuehrung", r))
    return _zahl(r.get("text", "")), spuren


VERFAHREN = {
    "GANZ": ganz,
    "ZERLEGT_CODE": zerlegt_code,
    "ZERLEGT_MODELL": zerlegt_modell,
    # Naiv: zerlegt, gibt die Randbedingung aber NICHT weiter.
    # Zeigt, wie eine Zerlegung still falsch wird, ohne dass jemand es merkt.
    "ZERLEGT_NAIV": zerlegt_code,
}


# ============================================================================
# Runde 4 (bauendes Modell, 2026-09-07): Nahtprotokoll.
#
# Befund B5 (01-BEFUNDE): Zerlegung bricht bei Randabhaengigkeit auf 28 % ein,
# und die Ursache ist die mehrdeutige Anweisung an der Naht, nicht der fehlende
# Randwert (ohne Randwert 20 %, mit Randwert 28 %). Das Nahtprotokoll macht die
# Teilanweisung FUER SICH ALLEIN eindeutig: Position des Ausschnitts in der
# Gesamtliste, Randwerte auf beiden Seiten, und die Lesart listenbezogener
# Ausdruecke ("die Zahl davor", "die erste Zahl der Liste") als Bezug auf die
# GESAMTLISTE. Das ist die Zerlegungsfunktion aus 06-AUFTRAG §6.4 als Code --
# gemessen, bevor sie in ordnung/soul10/core/decompose.py eingebaut wird.
#
# Das Protokoll gibt die Raender IMMER weiter: die Zerlegungsfunktion soll nicht
# wissen muessen, ob die Bedingung sie braucht. Auf der sauber zerlegbaren
# Bedingung darf es deshalb nichts kosten (Vorgaenger: 100 %).
# Vorregistriert in ordnung/soul10/ENTSCHEIDUNG.md §4 (M2).
# ============================================================================

def _teil_frage_naht(teil, bedingung, offset, n_gesamt, vorgaenger, nachfolger):
    von, bis = offset + 1, offset + len(teil)
    zeilen = [
        f"Du bearbeitest einen AUSSCHNITT einer Gesamtliste mit {n_gesamt} Zahlen: "
        f"die Positionen {von} bis {bis}.",
    ]
    if vorgaenger is None:
        zeilen.append("Dieser Ausschnitt ist der ANFANG der Gesamtliste. Vor seiner "
                      "ersten Zahl steht nichts.")
    else:
        zeilen.append(f"Unmittelbar VOR diesem Ausschnitt (Position {offset}) steht die "
                      f"Zahl {vorgaenger}.")
    if nachfolger is None:
        zeilen.append("Dieser Ausschnitt ist das ENDE der Gesamtliste.")
    else:
        zeilen.append(f"Unmittelbar NACH diesem Ausschnitt (Position {bis + 1}) steht die "
                      f"Zahl {nachfolger}.")
    zeilen.append(f"Ausschnitt: {', '.join(map(str, teil))}")
    zeilen.append("")
    zeilen.append(f"Bedingung (formuliert fuer die GESAMTLISTE): {bedingung}")
    zeilen.append("Lies die Bedingung so, als stuende die Gesamtliste vor dir:")
    zeilen.append("- 'die Zahl davor' ist die Zahl an der vorigen Position der GESAMTLISTE; "
                  "fuer die erste Zahl dieses Ausschnitts ist das die oben genannte Zahl "
                  "vor dem Ausschnitt.")
    zeilen.append("- 'die erste Zahl der Liste' oder 'die allererste Zahl' meint "
                  "ausschliesslich Position 1 der GESAMTLISTE"
                  + (" -- das ist die erste Zahl dieses Ausschnitts."
                     if offset == 0 else
                     " -- sie liegt NICHT in diesem Ausschnitt; fuer diesen Ausschnitt "
                     "gilt daraus keine Ausnahme."))
    zeilen.append("- 'die letzte Zahl der Liste' meint ausschliesslich die letzte Position "
                  "der GESAMTLISTE"
                  + (" -- das ist die letzte Zahl dieses Ausschnitts."
                     if nachfolger is None else
                     " -- sie liegt NICHT in diesem Ausschnitt."))
    zeilen.append("")
    zeilen.append("Wie viele Zahlen DIESES Ausschnitts erfuellen die Bedingung? "
                  "Antworte NUR mit der Anzahl als Zahl.")
    return "\n".join(zeilen)


def zerlegt_naht(frage, zahlen, bedingung, model, thinking, teile=5,
                 braucht_vorgaenger=False):
    """Zerlegung mit Nahtprotokoll; Zusammenfuehrung mechanisch (wie ZERLEGT_CODE).
    braucht_vorgaenger wird absichtlich ignoriert (siehe Kopfkommentar)."""
    n = len(zahlen)
    gr = (n + teile - 1) // teile
    auftraege = []
    for i in range(0, n, gr):
        teil = zahlen[i:i + gr]
        vorg = zahlen[i - 1] if i > 0 else None
        nach = zahlen[i + gr] if i + gr < n else None
        auftraege.append(_teil_frage_naht(teil, bedingung, i, n, vorg, nach))
    ergebnisse = _arbeiter_parallel(auftraege, model, thinking)
    spuren = [(f"arbeiter{j}", r) for j, r in enumerate(ergebnisse)]
    summe = sum(v for r in ergebnisse if (v := _zahl(r.get("text", ""))) is not None)
    return summe, spuren


VERFAHREN["ZERLEGT_NAHT"] = zerlegt_naht
