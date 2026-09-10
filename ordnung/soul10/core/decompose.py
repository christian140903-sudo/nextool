"""Zerlegung: Nahtprüfung im Code, Nahtprotokoll je Ausschnitt, Zusammenführung mechanisch.

Befund: sauber teilbar gewinnt Zerlegung 100 % gegen 89 % (ein Agent); mit Randabhängigkeit
bricht sie auf 28 % ein, Ursache ist die mehrdeutige Anweisung an der Naht, nicht der fehlende
Randwert (ohne Randwert 20 %); lässt das Modell zusammenfügen, 33 %
(bewusstsein/uebergabe/01-BEFUNDE.md B5). M2 (2026-09-08, ZERLEGT_NAHT in
bewusstsein/harness/zerlegung.py): das Nahtprotokoll hebt die randabhängige Bedingung auf 72 %
gegen 33,3 % ohne Protokoll — ein einzelner Agent liegt aber bei 94 %; sauber teilbar 100 % gegen
83–89 %. Der Verlust einer unsauberen Naht meldet sich nicht: das Ergebnis sieht plausibel aus
und ist falsch. Adversariale Prüfung (2026-09-08, a1/a2/a3): 56 von 58 Alltagsformulierungen
außerhalb der Wortliste gingen als „zerlegen" durch und lieferten mit exakt rechnendem Arbeiter
5 statt 1 bzw. 4 statt 2 — ohne Meldung; ein Arbeiterwert 12 auf einem Ausschnitt von 3 floss
ungeprüft in die Summe. Schlussprüfung (2026-09-10, a1/a5): die Gegenmaßnahme schoss über —
23 von 40 sauber teilbaren Alltagsbedingungen (57 %) wurden als listenweit abgelehnt, darunter
„Zaehle alle Zahlen in der Liste, die durch 3 teilbar sind"; jeder solche Fehlalarm kostet die
Zerlegung (100 %) und gibt die Aufgabe an einen Agenten (94 %, über EINZELN_MAX_ZEICHEN 83–89 %).
Und die Plausibilitätsprüfung winkte „Es sind 2 von 3." als 3 durch (die letzte Zahl ist dort der
Nenner): Liste 1..6, „gerade" → 6 statt 3, missing 0, keine Meldung. Beides ist geschlossen; die
listenweiten Muster stehen jetzt einzeln benannt und an ein Listenwort gebunden (0 von 40
Fehlalarmen, 58 von 58 Alltagsformulierungen weiter erkannt).
Erz → Gold: 06-AUFTRAG §6.4 wollte eine Zerlegungsfunktion, die Nahtstellen eindeutig macht;
zerlegung._teil_frage_naht ist der gemessene Wortlaut. Hier steht derselbe Text als
Produktbaustein — plus die Regel DAVOR, die aus M2 folgt: Kumulations- oder listenweiter Bezug →
Verweigerung, Nachbar-/Positionsbezug → ein Agent (Zerlegung mit Nahtprotokoll nur per
force=True, wenn die Aufgabe in keinen Kontext passt: dann sind 72,2 % besser als 33,3 %), sonst
zerlegen ohne Protokoll. Die Fehlkosten sind asymmetrisch (übersehene Abhängigkeit = leise
falsche Zahl; zu Unrecht erkannte = nur verlorene Parallelität), darum greift die Prüfung im
Zweifel zu und nicht daneben — aber nur dort, wo überhaupt ein Bezug auf ANDERE Listenelemente
steht. Ein Wort ohne solchen Bezug („am Ende", „doppelt", „Anzahl von", „alle Zahlen in der
Liste") ist kein Zweifelsfall, sondern ein Fehlalarm, und er kostet 100 % gegen 94 %. Die
Zusammenführung DANACH geschieht im Code, nie im Modell, und nimmt nur plausible Anzahlen
(ganzzahlig, 0 ≤ Anzahl ≤ Ausschnittlänge; „2 von 3" ist der Bruch 2, nicht die Anzahl 3).
Jede Entscheidung schreibt eine Bus-Zeile.
"""
from __future__ import annotations

import re
from concurrent.futures import ThreadPoolExecutor

from . import bus
from . import model as _model  # Alias: der Parameter `model` (Modellname) überdeckt sonst das Modul


class DecomposeError(ValueError):
    """Die Aufgabe wird so nicht zerlegt: Kumulations-/listenweiter Bezug, Randbezug ohne force, oder unbrauchbarer Plan."""


PROTOCOLS = ("none", "naht")
RECOMMENDATIONS = ("zerlegen", "einzeln", "nicht_zerlegbar")
MERGE_OPS = ("sum", "max", "min")

# Systemprompt der Arbeiter — byte-gleich zu zerlegung._arbeiter_parallel (gemessen in M2).
WORKER_SYSTEM = "Du bearbeitest einen Teilauftrag. Antworte nur mit der Zahl."

# --- Klassen des Randbezugs (de/en) ---------------------------------------------------------
# Die Fehlkosten sind asymmetrisch: eine übersehene Randabhängigkeit liefert leise die falsche
# Zahl (28 %), eine zu Unrecht erkannte kostet nur die Parallelität (ein Agent: 94 %). Die
# Muster greifen deshalb lieber einmal zu viel als einmal zu wenig.
#
# Nachbar: die Bedingung schaut auf die Zahl unmittelbar vor oder nach einer Zahl — genau das,
# was das Nahtprotokoll mit je einem Randwert je Seite trägt.
NEIGHBOR_RE = re.compile(
    r"\b(?:davor|danach|zuvor|vorherig\w*|vorige\w*|vorangehend\w*|vorhergehend\w*|nachfolgend\w*"
    r"|n(?:ä|ae)chste[nrs]?|folgende[nrs]?\s+(?:zahl|element|eintrag|wert)|unmittelbar"
    r"|direkt\s+(?:vor|nach)|vorg(?:ä|ae)nger\w*|nachfolger\w*|nachbar\w*|benachbart\w*"
    r"|previous|preceding|next|following|adjacent|neighbou?r\w*|predecessor|successor"
    r"|immediately\s+(?:before|after))\b",
    re.IGNORECASE,
)
# Position: die Bedingung nennt eine Stelle der Gesamtliste (erste, letzte, gerade Position,
# die dritte Zahl ...) — das Nahtprotokoll nennt die Positionen des Ausschnitts.
POSITION_RE = re.compile(
    r"\b(?:erste[nrs]?|letzte[nrs]?|allererste[nrs]?|allerletzte[nrs]?|position\w*|stelle[n]?"
    r"|index|indizes|indices|first|last|\d+\.\s*(?:zahl|element|eintrag|wert)"
    r"|\d+(?:st|nd|rd|th)\s+(?:number|element|entry|item|value)"
    r"|(?:zweite|dritte|vierte|f(?:ü|ue)nfte|sechste|siebte|achte|neunte|zehnte)[nrs]?"
    r"\s+(?:zahl|element|eintrag|wert)"
    r"|(?:second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)\s+(?:number|element|entry|item|value))\b",
    re.IGNORECASE,
)
# Kumulation: die Bedingung braucht Wissen über andere Teile der Liste (Summe bis hier,
# Median, Sortierung, Häufigkeit, Maximum ...). Kein Nahtprotokoll heilt das; verweigern.
CUMULATIVE_RE = re.compile(
    r"\b(?:bisher\w*|bislang|kumul\w*|laufend\w*|summe\s+(?:aller|bis|der\s+bisherigen|der\s+vorherigen)"
    r"|gesamtsumme|so\s+far|running|cumulative|prefix\s+sum|zwischensumme\w*|median\w*"
    r"|sortier\w*|sorted|sort\s+order|rang|r(?:ä|ae)nge|rang(?:folge|liste|platz|ordnung)\w*"
    r"|rank(?:s|ed|ing)?|durchschnitt\w*|mittelwert\w*|average"
    r"|mean\s+of|h(?:ä|ae)ufigste\w*|most\s+(?:common|frequent)|einzig\w*|unique|nur\s+einmal"
    r"|exactly\s+once|duplikat\w*|duplicate\w*|mehrfach\s+vorkomm\w*"
    r"|appears?\s+(?:more\s+than\s+once|twice|multiple)|maximum|minimum"
    r"|gr(?:ö|oe)(?:ß|ss)te[nrs]?|kleinste[nrs]?|largest|smallest|highest|lowest)\b",
    re.IGNORECASE,
)
# Listenweit (a1, 2026-09-08; nachgeschärft nach der Schlussprüfung 2026-09-10): alles, was die
# Naht nicht trägt, weil es die ganze Liste oder mehr als den einen Randwert braucht — Superlative
# und Ränge („zweitgrößte", „the biggest", „top three"), Anteile („obere Hälfte", „second half of
# the list"), Aggregate ÜBER DIE LISTE („Summe der Liste", „count of even numbers"), Häufigkeit
# („kommt doppelt vor", „occurs twice", „already appeared"), Quantor plus Bezug („alle anderen",
# „every other"), Reichweite über die Naht („hintereinander", „in a row", „übernächste"),
# Musterpositionen („jede zweite", „odd-indexed", „am Ende DER LISTE") und lose Nachbarwörter
# („vorher", „dahinter", „before it", „prior", „folgt").
#
# Was hier NICHT hingehört (Schlussprüfung, Befund 1: 23 von 40 sauber teilbaren Alltagsbedingungen
# wurden abgelehnt, 57 % Fehlalarm): Wörter, die eine Zahl-Eigenschaft benennen und keinen Bezug auf
# andere Listenelemente tragen — „eine gerade Anzahl von Ziffern", „doppelt so groß wie 20", „eine 0
# am Ende", „die Hälfte von 50", „das Produkt von zwei Primzahlen", „mindestens einmal die Ziffer 5",
# „in der Mitte eine 0", „insgesamt drei Ziffern" — und die bloße Anrede der Gesamtliste („alle Zahlen
# in der Liste", „in der gesamten Liste"), die nur sagt, worüber gezählt wird, nicht wovon der
# einzelne Treffer abhängt. Ein Fehlalarm ist nicht gratis: er kostet die Zerlegung (100 %) und
# schickt die Aufgabe an einen Agenten (94 %, über EINZELN_MAX_ZEICHEN 83–89 %). Darum sind diese
# Wörter an ein Listenwort gebunden („am Ende DER LISTE", „Anzahl DER ZAHLEN", „sum of ALL previous")
# statt kontextlos gelistet.
_QUANTOR = r"(?:alle[rnms]?|jede[rsnm]?|s(?:ä|ae)mtliche[rnms]?|all|every|any|each)"
_BEZUG = (r"(?:andere[nrsm]?|other|others|(?:ü|ue)brige[nrsm]?|restliche[nrsm]?|remaining"
          r"|preceding|previous|prior|following|subsequent|earlier|later|before|after"
          r"|davor|danach|zuvor|vorher|nachher|dahinter|vorangehende[nrsm]?|vorherige[nrsm]?"
          r"|vorhergehende[nrsm]?|folgende[nrsm]?|nachfolgende[nrsm]?|elemente|elements)")
# Wörter, die eine Liste benennen — sie binden die Aggregat- und Randmuster an einen echten
# Listenbezug, statt sie auf jede Zahl-Eigenschaft feuern zu lassen.
_LISTE_DE = r"(?:liste|reihe|folge|menge|zahlenreihe|datenreihe|eingabe|gesamtliste)"
_LISTE_EN = r"(?:list|sequence|series|array|row|set|data|input)"
_DINGE_DE = r"(?:zahlen|werte|elemente|eintr(?:ä|ae)ge|posten|daten)"
_DINGE_EN = r"(?:numbers|values|elements|entries|items|records)"

# Jede Alternative steht einzeln, mit Namen: der Test prüft, dass jede von ihnen mindestens ein
# eigenes Beispiel trägt, das keine andere trifft — eine Alternative ohne solches Beispiel ist
# entweder tot oder ein reiner Fehlalarmgeber und gehört gelöscht (Schlussprüfung, Befund 7:
# 90 von 119 Alternativen ließen sich löschen, ohne dass ein Test rot wurde).
_GLOBAL_PARTS = (
    # --- Superlative, Ränge, Extremwerte ---
    ("ordnungssuperlativ",
     r"(?:zweit|dritt|viert|f(?:ü|ue)nft|second|third|fourth|fifth)[- ]?"
     r"(?:gr(?:ö|oe)(?:ß|ss)te|kleinste|h(?:ö|oe)chste|niedrigste|largest|smallest|biggest|greatest"
     r"|highest|lowest)\w*"),
    ("superlativ_en", r"biggest|greatest|highest|lowest|largest|smallest"),
    ("extremwert", r"maximal\w*|minimal\w*|\bmax\b|\bmin\b|h(?:ö|oe)chste[nrs]?|niedrigste[nrs]?"),
    ("top_n", r"top\s+(?:\d+|three|five|ten|drei|f(?:ü|ue)nf|zehn|n)|in\s+the\s+top"
              r"|unter\s+den\s+(?:top|obersten|ersten|besten)"),
    # --- Anteile und Mittel (an die Liste gebunden: „obere Hälfte", nicht „die Hälfte von 50") ---
    ("anteil_de",
     r"(?:obere|untere|erste|zweite|dritte|letzte|besse?re|schlechtere)[nrs]?\s+"
     r"(?:h(?:ä|ae)lfte|drittel|viertel)"
     r"|(?:h(?:ä|ae)lfte|drittel|viertel)\s+(?:der|aller|des|dieser)\s+(?:\w+\s+){0,2}?"
     + _LISTE_DE + r"|(?:h(?:ä|ae)lfte|drittel|viertel)\s+aller\s+" + _DINGE_DE),
    ("anteil_en",
     r"(?:upper|lower|first|second|third|last|top|bottom|better|worse)\s+(?:half|third|quarter)"
     r"|(?:half|third|quarter)\s+of\s+(?:all|the\s+(?:\w+\s+){0,2}?(?:" + _LISTE_EN + r"|" + _DINGE_EN + r"))"),
    ("mittelwert",
     r"(?:ü|ue)ber\s+dem\s+(?:schnitt|mittel)|unter\s+dem\s+(?:schnitt|mittel)|schnitt\b|mittel\b"
     r"|\bmean\b|median\w*|quantil\w*"),
    ("prozent", r"prozent\s+(?:der|aller)|percent(?:ile)?\s+of|\d+\s*%\s+(?:der|aller|of)"),
    # --- Aggregate ÜBER DIE LISTE (nicht über zwei genannte Zahlen) ---
    ("summe_liste",
     r"summe\s+(?:der|aller|des|dieser)|sum\s+of\s+(?:all|every|the\s+(?:\w+\s+){0,2}?"
     r"(?:" + _LISTE_EN + r"|" + _DINGE_EN + r"|previous|preceding|prior|others?|rest))"),
    ("produkt_liste",
     r"produkt\s+(?:der|aller)|product\s+of\s+(?:all|the\s+(?:\w+\s+){0,2}?"
     r"(?:" + _LISTE_EN + r"|" + _DINGE_EN + r"|others?|rest))"),
    ("anzahl_liste",
     r"anzahl\s+(?:der|aller)\s+(?:\w+\s+){0,2}?(?:" + _DINGE_DE + r"|" + _LISTE_DE + r")"
     r"|(?:count|number)\s+of\s+(?:\w+\s+){0,2}?(?:" + _DINGE_EN + r"|" + _LISTE_EN + r")"),
    # --- Häufigkeit und Vorkommen (wie oft etwas in der Liste steht) ---
    # „vorkommen" allein ist elementlokal („in denen die Ziffer 7 vorkommt"); erst mit einer
    # Häufigkeit davor oder dahinter ist es ein Listenbezug („zweimal in der Liste vorkommen").
    ("vorkommen",
     r"occur\w*|appear\w*|erschein\w*|komm\w*\s+(?:\w+\s+){0,2}?vor\b"
     r"|(?:doppelt|zweimal|dreimal|mehrfach|mehrmals|(?:ö|oe)fter|h(?:ä|ae)ufiger)"
     r"\s+(?:\w+\s+){0,3}?vorkomm\w*"
     r"|vorkomm\w*\s+(?:\w+\s+){0,2}?(?:doppelt|zweimal|dreimal|mehrfach|mehrmals)"
     r"|h(?:ä|ae)ufig\w*|frequen\w*|wie\s+oft|how\s+often"),
    ("schon_dagewesen", r"\bschon\b|\bbereits\b|already"),
    ("zeitbezug", r"fr(?:ü|ue)her|sp(?:ä|ae)ter|earlier|\blater\b"),
    ("anderswo", r"(?:ü|ue)berhaupt|elsewhere|anderswo|woanders"),
    # --- Quantor plus Bezug; Rest/Übrige ---
    ("quantor_bezug", _QUANTOR + r"\s+(?:\w+\s+)?" + _BEZUG),
    ("rest", r"the\s+(?:rest|others|remaining)|die\s+(?:anderen|(?:ü|ue)brigen|restlichen)|der\s+rest"
             r"|(?:ü|ue)brigen|other\s+numbers|anderen\s+zahlen"),
    # --- Reichweite über die Naht hinaus ---
    ("reihenfolge_lauf",
     r"hintereinander|nebeneinander|nacheinander|in\s+a\s+row|in\s+folge|consecutive\w*"
     r"|aufeinanderfolgend\w*|successi\w*|run\s+of|streak"),
    ("uebernaechste", r"(?:ü|ue)bern(?:ä|ae)chste[nrs]?|vorvorige\w*|vorletzte\w*"),
    ("n_positionen_weiter",
     r"(?:zwei|drei|two|three)\s+(?:positionen|stellen|pl(?:ä|ae)tze|positions|places|steps)"
     r"\s+(?:davor|danach|vorher|nachher|weiter|vor|nach|zur(?:ü|ue)ck|before|after|back|ahead"
     r"|earlier|later|prior)"),
    ("beide_nachbarn",
     r"beiden\s+(?:vorangehenden|vorherigen|folgenden|nachfolgenden|n(?:ä|ae)chsten)"
     r"|the\s+(?:two|three)\s+(?:preceding|previous|prior|following|next)"),
    # --- Musterpositionen ---
    ("jede_nte",
     r"jede[rsn]?\s+(?:zweite|dritte|vierte|f(?:ü|ue)nfte|n-?te|\d+\.)"
     r"|every\s+(?:second|third|fourth|fifth|nth|\d+(?:st|nd|rd|th))"),
    ("indexparitaet", r"(?:odd|even|ungerade|gerade)[- ]?(?:indexed|indizierte?[nrs]?|numbered|positioned)"),
    # Rand und Mitte DER LISTE — „eine 0 am Ende" ist eine Ziffernstelle, kein Listenbezug.
    ("rand_der_liste",
     r"am\s+(?:ende|anfang|schluss|beginn)\s+(?:der|dieser|von)\s+(?:\w+\s+){0,2}?" + _LISTE_DE +
     r"|at\s+the\s+(?:end|beginning|start)\s+of\s+(?:the\s+)?(?:\w+\s+){0,2}?" + _LISTE_EN),
    ("mitte_der_liste",
     r"in\s+der\s+mitte\s+(?:der|dieser|von)\s+(?:\w+\s+){0,2}?" + _LISTE_DE +
     r"|in\s+the\s+middle\s+of\s+(?:the\s+)?(?:\w+\s+){0,2}?" + _LISTE_EN +
     r"|mittlere[nrs]?\s+(?:zahl|wert|element|eintrag|position)\s+(?:der|in\s+der|dieser)\s+" + _LISTE_DE +
     r"|middle\s+(?:number|value|element|entry)\s+(?:of|in)\s+the\s+" + _LISTE_EN),
    # --- lose Nachbarwörter, die die Wortliste nicht kannte ---
    ("nachbarwort_de", r"\bvorher\b|\bnachher\b|\bdahinter\b|\blinks\b|\brechts\b"
                       r"|vorausgeh\w*|\bvoraus\b|nachsteh\w*|vorsteh\w*|\bfolgt\b"),
    ("nachbarwort_en", r"before\s+(?:it|that|them|this)|after\s+(?:it|that|them|this)"
                       r"|the\s+(?:number|value|element|one)\s+(?:before|after)|\bprior\b|\bsubsequent\b"),
)
GLOBAL_RE = re.compile(r"\b(?:" + r"|".join(muster for _, muster in _GLOBAL_PARTS) + r")\b",
                       re.IGNORECASE)

_CLASSES = (("neighbor", NEIGHBOR_RE), ("position", POSITION_RE), ("cumulative", CUMULATIVE_RE),
            ("global", GLOBAL_RE))
# Diese Klassen heben die Zerlegbarkeit auf — kein Protokoll trägt sie.
_NOT_DECOMPOSABLE = ("cumulative", "global")


# --- Nahtprüfung ----------------------------------------------------------------------------
def seam_check(condition: str) -> dict:
    """Prüft, ob eine Bedingung über die Schnittkante greift, und empfiehlt das Verfahren.

    Rückgabe {"classes", "hits", "decomposable", "protocol", "reason", "empfehlung"}:
    cumulative/global → decomposable False, protocol "none", empfehlung "nicht_zerlegbar"
                        (kein Protokoll heilt eine Kumulation oder einen listenweiten Bezug;
                        ein Agent bearbeitet die Gesamtliste);
    neighbor/position → decomposable True, protocol "naht", empfehlung "einzeln"
                        (M2: ein Agent 94 % gegen 72 % mit Protokoll — zerlegen nur, wenn die
                        Aufgabe in keinen Kontext passt, dann per force=True);
    sonst             → decomposable True, protocol "none", empfehlung "zerlegen"
                        (100 % gegen 83–89 %).
    Die Klassen greifen im Zweifel zu: eine übersehene Abhängigkeit ist eine leise falsche Zahl,
    eine zu Unrecht erkannte kostet nur Parallelität.
    """
    text = (condition or "").strip()
    classes, hits = [], {}
    for name, rx in _CLASSES:
        found = [m.group(0) for m in rx.finditer(text)]
        if found:
            classes.append(name)
            hits[name] = sorted(set(re.sub(r"\s+", " ", f.lower()) for f in found))
    if any(c in classes for c in _NOT_DECOMPOSABLE):
        decomposable, protocol, empfehlung = False, "none", "nicht_zerlegbar"
        teile = []
        if "cumulative" in classes:
            teile.append(f"Kumulationsbezug erkannt ({', '.join(hits['cumulative'])})")
        if "global" in classes:
            teile.append(f"listenweiter Bezug erkannt ({', '.join(hits['global'])})")
        reason = ("; ".join(teile) + ": jeder Teil bräuchte Wissen über andere Teile der Liste, "
                  "das die Naht nicht trägt; nicht zerlegbar, ein Agent bearbeitet die Gesamtliste.")
    elif classes:
        decomposable, protocol, empfehlung = True, "naht", "einzeln"
        woerter = ", ".join(w for k in classes for w in hits[k])
        reason = (f"Nachbar-/Positionsbezug erkannt ({woerter}): ein Agent ist genauer (M2: 94 % "
                  f"gegen 72 % mit Nahtprotokoll); zerlegen nur mit Nahtprotokoll und nur per "
                  f"force=True, wenn die Aufgabe in keinen Kontext passt (72,2 % gegen 33,3 % ohne).")
    else:
        decomposable, protocol, empfehlung = True, "none", "zerlegen"
        reason = "kein Randbezug erkannt: zerlegbar ohne Protokoll (100 % gegen 83–89 %)."
    result = {"classes": classes, "hits": hits, "decomposable": decomposable,
              "protocol": protocol, "reason": reason, "empfehlung": empfehlung}
    bus.emit("decompose.seam_check", classes=classes, decomposable=decomposable,
             protocol=protocol, empfehlung=empfehlung, condition_chars=len(text))
    return result


# --- Anweisungen je Ausschnitt ---------------------------------------------------------------
def chunk_instruction(items: list, condition: str, offset: int, n_total: int, before, after) -> str:
    """Das Nahtprotokoll — Wortlaut byte-gleich zu zerlegung._teil_frage_naht (M2 misst genau ihn).

    Position des Ausschnitts in der Gesamtliste, Randwerte beidseitig (oder ANFANG/ENDE),
    und die Lesart listenbezogener Ausdrücke als Bezug auf die GESAMTLISTE.
    """
    von, bis = offset + 1, offset + len(items)
    zeilen = [
        f"Du bearbeitest einen AUSSCHNITT einer Gesamtliste mit {n_total} Zahlen: "
        f"die Positionen {von} bis {bis}.",
    ]
    if before is None:
        zeilen.append("Dieser Ausschnitt ist der ANFANG der Gesamtliste. Vor seiner "
                      "ersten Zahl steht nichts.")
    else:
        zeilen.append(f"Unmittelbar VOR diesem Ausschnitt (Position {offset}) steht die "
                      f"Zahl {before}.")
    if after is None:
        zeilen.append("Dieser Ausschnitt ist das ENDE der Gesamtliste.")
    else:
        zeilen.append(f"Unmittelbar NACH diesem Ausschnitt (Position {bis + 1}) steht die "
                      f"Zahl {after}.")
    zeilen.append(f"Ausschnitt: {', '.join(map(str, items))}")
    zeilen.append("")
    zeilen.append(f"Bedingung (formuliert fuer die GESAMTLISTE): {condition}")
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
                     if after is None else
                     " -- sie liegt NICHT in diesem Ausschnitt."))
    zeilen.append("")
    zeilen.append("Wie viele Zahlen DIESES Ausschnitts erfuellen die Bedingung? "
                  "Antworte NUR mit der Anzahl als Zahl.")
    return "\n".join(zeilen)


def plain_instruction(items: list, condition: str) -> str:
    """Anweisung ohne Protokoll (sauber teilbare Bedingung) — Wortlaut wie zerlegung._teil_frage."""
    return (f"Liste: {', '.join(map(str, items))}\n\n"
            f"Wie viele Zahlen in dieser Teilliste erfuellen: {condition}?\n"
            f"Antworte NUR mit der Anzahl als Zahl.")


# --- Plan ---------------------------------------------------------------------------------------
def _is_number(value) -> bool:
    """Zahl im Sinn der Liste: int oder float, kein bool, kein None, kein Text."""
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _parts_int(parts) -> int:
    """parts als ganze Zahl ≥ 1; alles andere ist ein Planfehler, kein TypeError aus der Tiefe."""
    try:
        wert = int(parts)
        if isinstance(parts, bool) or wert != parts:
            raise ValueError
    except (TypeError, ValueError):
        raise DecomposeError(f"parts muss eine ganze Zahl >= 1 sein, war {parts!r}") from None
    if wert < 1:
        raise DecomposeError(f"parts muss >= 1 sein, war {parts}")
    return wert


def plan(items: list, condition: str, *, parts: int, force: bool = False) -> dict:
    """Zerlegt mechanisch in höchstens `parts` Ausschnitte oder verweigert per DecomposeError.

    Verweigert immer bei Kumulations- oder listenweitem Bezug. Verweigert bei Nachbar-/Positions-
    bezug (Protokoll "naht"), solange force=False — die Regel aus M2: randabhängig → ein Agent
    (94 %), solange die Aufgabe in einen Kontext passt; force=True nur, wenn sie das nicht tut
    (72,2 % gegen 33,3 %). Verweigert ebenso bei leerer Bedingung, bei Nicht-Zahlen in der Liste (None
    als Element würde im Nahtprotokoll als ANFANG/ENDE gelesen) und bei parts, das keine ganze
    Zahl ≥ 1 ist.
    Rückgabe {"protocol", "empfehlung", "forced", "classes", "n_total", "parts", "merge": "sum",
              "chunks": [{"index", "offset", "items", "before", "after", "instruction"}]}.
    Randwerte werden in jedem Chunk mitgeführt, auch ohne Protokoll (kostet nichts, hilft dem Log).
    """
    items = list(items)
    if not items:
        raise DecomposeError("leere Liste: nichts zu zerlegen")
    parts = _parts_int(parts)
    if not (condition or "").strip():
        raise DecomposeError("leere Bedingung: nichts zu prüfen, keine Zerlegung")
    schlecht = [i for i, v in enumerate(items) if not _is_number(v)]
    if schlecht:
        raise DecomposeError(f"Liste enthält Nicht-Zahlen an Position(en) "
                             f"{', '.join(str(i + 1) for i in schlecht[:5])}: "
                             f"das Nahtprotokoll braucht Zahlen als Randwerte")
    check = seam_check(condition)
    if not check["decomposable"]:
        bus.emit("decompose.refused", classes=check["classes"], empfehlung=check["empfehlung"],
                 forced=False, reason=check["reason"])
        raise DecomposeError(check["reason"])
    if check["protocol"] == "naht" and not force:
        bus.emit("decompose.refused", classes=check["classes"], empfehlung=check["empfehlung"],
                 forced=False, reason=check["reason"])
        raise DecomposeError(check["reason"])
    n = len(items)
    size = (n + parts - 1) // parts
    chunks = []
    for index, offset in enumerate(range(0, n, size)):
        teil = items[offset:offset + size]
        before = items[offset - 1] if offset > 0 else None
        after = items[offset + size] if offset + size < n else None
        if check["protocol"] == "naht":
            instruction = chunk_instruction(teil, condition, offset, n, before, after)
        else:
            instruction = plain_instruction(teil, condition)
        chunks.append({"index": index, "offset": offset, "items": teil, "before": before,
                       "after": after, "instruction": instruction})
    forced = check["protocol"] == "naht"
    result = {"protocol": check["protocol"], "empfehlung": check["empfehlung"], "forced": forced,
              "classes": check["classes"], "n_total": n, "parts": len(chunks), "merge": "sum",
              "chunks": chunks}
    bus.emit("decompose.plan", protocol=check["protocol"], empfehlung=check["empfehlung"],
             forced=forced, parts=len(chunks), n_total=n, chunk_size=size)
    return result


# --- Zusammenführung --------------------------------------------------------------------------
def merge(values: list, op: str = "sum") -> tuple:
    """Mechanische Zusammenführung: (wert, fehlend). None — und jeder Nicht-Zahlwert, auch bool —
    zählt als fehlend.

    sum über die vorhandenen Werte (kein Wert vorhanden → None); max/min analog.
    Ein fehlender Wert wird gezählt, nie geraten — der Aufrufer sieht die Lücke.
    """
    if op not in MERGE_OPS:
        raise DecomposeError(f"unbekannte Zusammenführung: {op!r} (erlaubt: {', '.join(MERGE_OPS)})")
    present = [v for v in values if _is_number(v)]
    missing = len(values) - len(present)
    if not present:
        return None, missing
    if op == "sum":
        return sum(present), missing
    if op == "max":
        return max(present), missing
    return min(present), missing


# „2 von 3", „2 of 3", „2 out of 3", „2 (von 3)", „2/3" — die häufigste ausführliche Arbeiter-
# antwort. Die LETZTE Zahl ist dort der Nenner (die Ausschnittlänge) und liegt deshalb per
# Konstruktion immer innerhalb der Schranke 0 ≤ Anzahl ≤ Ausschnittlänge: die Plausibilitätsprüfung
# winkte sie durch und merge summierte die Ausschnittlängen statt der Treffer (Schlussprüfung,
# Befund 3: Liste 1..6, Bedingung „gerade", wahr 3 → run() lieferte 6, missing 0, keine Meldung).
_ANTEIL_RE = re.compile(
    r"(\d+)\s*(?:\(\s*)?(?:\b(?:von|of|out\s+of|aus)\b\s*|/\s*)"
    r"(?:insgesamt\s+|davon\s+|den\s+|der\s+|die\s+|the\s+|total\s+)?(\d+)",
    re.IGNORECASE,
)
_ZIFFER = re.compile(r"\d")


def _parse_count(text: str, n_items: int | None = None):
    """Letzte Zahl der Arbeiterantwort als Anzahl — oder None.

    Plausibel ist nur eine ganze Zahl mit 0 ≤ Anzahl ≤ n_items (a3, 2026-09-08: „12" auf einem
    Ausschnitt von 3, „-3", „2.5" und „… naemlich 8 und 9" flossen sonst als Anzahl in die
    Summe). Ohne n_items gilt nur: ganzzahlig und ≥ 0.
    Endet die Antwort auf „X von N" (auch „X of N", „X/N"), ist N der Nenner und nicht die
    Anzahl: dann zählt X — aber nur, wenn N die Ausschnittlänge ist. Nennt der Arbeiter einen
    anderen Nenner, hat er über etwas anderes als diesen Ausschnitt gezählt; das ist keine
    Anzahl für diesen Ausschnitt und zählt als fehlend (Schlussprüfung, Befund 3).
    """
    value = _model.extract_last_number(text)
    if value is None:
        return None
    value = float(value)
    treffer = list(_ANTEIL_RE.finditer(text or ""))
    # Nur wenn der Nenner die LETZTE Zahl der Antwort ist, ist die letzte Zahl keine Anzahl —
    # „Ausschnitt 1 von 2: 3" endet auf die Anzahl 3 und bleibt unangetastet.
    if treffer and not _ZIFFER.search(text[treffer[-1].end():]):
        zaehler, nenner = treffer[-1].group(1), treffer[-1].group(2)
        if float(nenner) == value:
            if n_items is not None and int(nenner) != n_items:
                return None
            value = float(zaehler)
    if not value.is_integer() or value < 0:
        return None
    if n_items is not None and value > n_items:
        return None
    return int(value)


# --- Durchlauf ---------------------------------------------------------------------------------
def run(items: list, condition: str, *, parts: int, model: str | None = None, thinking: int = 0,
        workers: int = 5, force: bool = False) -> dict:
    """plan → ein Modellaufruf je Ausschnitt (parallel) → merge im Code.

    Rückgabe {"value", "calls", "missing", "protocol", "empfehlung", "chunks", "values"}.
    DecomposeError propagiert, wenn plan() verweigert (Kumulation/listenweit; Randbezug ohne
    force). Ein Arbeiterwert, der keine plausible Anzahl für seinen Ausschnitt ist, zählt als
    fehlend und schreibt "decompose.implausible" auf den Bus — nie in die Summe.
    """
    p = plan(items, condition, parts=parts, force=force)
    chunks = p["chunks"]

    def _worker(chunk: dict) -> dict:
        return _model.call(WORKER_SYSTEM, chunk["instruction"], model=model, thinking=thinking)

    with ThreadPoolExecutor(max_workers=max(1, min(workers, len(chunks)))) as ex:
        results = list(ex.map(_worker, chunks))
    values = []
    for chunk, r in zip(chunks, results):
        if not r.get("ok"):
            values.append(None)
            continue
        text = r.get("text", "")
        value = _parse_count(text, len(chunk["items"]))
        if value is None and _model.extract_last_number(text) is not None:
            bus.emit("decompose.implausible", index=chunk["index"], items=len(chunk["items"]),
                     value=_model.extract_last_number(text))
        values.append(value)
    value, missing = merge(values, p["merge"])
    bus.emit("decompose.run", protocol=p["protocol"], empfehlung=p["empfehlung"], forced=p["forced"],
             calls=len(results), missing=missing, chunks=len(chunks), value=value)
    return {"value": value, "calls": len(results), "missing": missing,
            "protocol": p["protocol"], "empfehlung": p["empfehlung"], "chunks": len(chunks),
            "values": values}
