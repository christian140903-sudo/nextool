"""Zerlegung: Nahtprüfung im Code, Nahtprotokoll je Ausschnitt, Zusammenführung mechanisch.

Befund: sauber teilbar gewinnt Zerlegung 100 % gegen 89 % (ein Agent); mit Randabhängigkeit
bricht sie auf 28 % ein, und die Ursache ist die mehrdeutige Anweisung an der Naht, nicht der
fehlende Randwert (ohne Randwert 20 %); lässt das Modell zusammenfügen, 33 %
(bewusstsein/uebergabe/01-BEFUNDE.md B5). Der Verlust meldet sich nicht: das Ergebnis sieht
plausibel aus und ist falsch.
Erz → Gold: 06-AUFTRAG §6.4 wollte eine Zerlegungsfunktion, die Nahtstellen eindeutig macht;
bewusstsein/harness/zerlegung.py::_teil_frage_naht ist der gemessene Wortlaut (M2). Hier steht
derselbe Text als Produktbaustein — plus die Prüfung DAVOR (Kumulationsbezug → Verweigerung,
Nachbar-/Positionsbezug → Protokoll, sonst ohne Protokoll) und die Zusammenführung DANACH im
Code, nie im Modell. Jede Entscheidung schreibt eine Bus-Zeile.
"""
from __future__ import annotations

import re
from concurrent.futures import ThreadPoolExecutor

from . import bus
from . import model as _model  # Alias: der Parameter `model` (Modellname) überdeckt sonst das Modul


class DecomposeError(ValueError):
    """Die Aufgabe ist so nicht zerlegbar (Kumulationsbezug) oder der Plan ist unbrauchbar."""


PROTOCOLS = ("none", "naht")
MERGE_OPS = ("sum", "max", "min")

# Systemprompt der Arbeiter — byte-gleich zu zerlegung._arbeiter_parallel (gemessen in M2).
WORKER_SYSTEM = "Du bearbeitest einen Teilauftrag. Antworte nur mit der Zahl."

# --- Klassen des Randbezugs (de/en) ---------------------------------------------------
# Nachbar: die Bedingung schaut auf die Zahl unmittelbar vor oder nach einer Zahl.
NEIGHBOR_RE = re.compile(
    r"\b(?:davor|danach|vorherig\w*|vorige\w*|vorangehend\w*|vorhergehend\w*|nachfolgend\w*"
    r"|folgende[nrs]?\s+(?:zahl|element|eintrag|wert)|unmittelbar|vorg(?:ä|ae)nger\w*"
    r"|nachfolger\w*|nachbar\w*|benachbart\w*|aufeinanderfolgend\w*"
    r"|previous|preceding|next|following|adjacent|consecutive|neighbou?r\w*|predecessor|successor)\b",
    re.IGNORECASE,
)
# Position: die Bedingung nennt eine Stelle der Gesamtliste (erste, letzte, gerade Position ...).
POSITION_RE = re.compile(
    r"\b(?:erste[nrs]?|letzte[nrs]?|allererste[nrs]?|allerletzte[nrs]?|position\w*|stelle[n]?"
    r"|index|indizes|indices|first|last|\d+\.\s*(?:zahl|element|eintrag|wert)"
    r"|\d+(?:st|nd|rd|th)\s+(?:number|element|entry|item|value))\b",
    re.IGNORECASE,
)
# Kumulation: die Bedingung braucht Wissen über andere Teile der Liste (Summe bis hier,
# Median, Sortierung, Häufigkeit, Maximum ...). Kein Nahtprotokoll heilt das; verweigern.
CUMULATIVE_RE = re.compile(
    r"\b(?:bisher\w*|bislang|kumul\w*|laufend\w*|summe\s+(?:aller|bis|der\s+bisherigen|der\s+vorherigen)"
    r"|gesamtsumme|so\s+far|running|cumulative|prefix\s+sum|zwischensumme\w*|median\w*"
    r"|sortier\w*|sorted|sort\s+order|rang\w*|rank\w*|durchschnitt\w*|mittelwert\w*|average"
    r"|mean\s+of|h(?:ä|ae)ufigste\w*|most\s+(?:common|frequent)|einzig\w*|unique|nur\s+einmal"
    r"|exactly\s+once|duplikat\w*|duplicate\w*|mehrfach\s+vorkomm\w*"
    r"|appears?\s+(?:more\s+than\s+once|twice|multiple)|maximum|minimum"
    r"|gr(?:ö|oe)(?:ß|ss)te[nrs]?|kleinste[nrs]?|largest|smallest|highest|lowest)\b",
    re.IGNORECASE,
)

_CLASSES = (("neighbor", NEIGHBOR_RE), ("position", POSITION_RE), ("cumulative", CUMULATIVE_RE))


# --- Nahtprüfung ---------------------------------------------------------------------------
def seam_check(condition: str) -> dict:
    """Prüft, ob eine Bedingung über die Schnittkante greift.

    Rückgabe {"classes", "hits", "decomposable", "protocol", "reason"}:
    cumulative → decomposable False (kein Protokoll heilt eine Kumulation);
    neighbor/position → protocol "naht"; sonst protocol "none".
    """
    text = (condition or "").strip()
    classes, hits = [], {}
    for name, rx in _CLASSES:
        found = [m.group(0) for m in rx.finditer(text)]
        if found:
            classes.append(name)
            hits[name] = sorted(set(f.lower() for f in found))
    if "cumulative" in classes:
        decomposable, protocol = False, "none"
        reason = (f"Kumulationsbezug erkannt ({', '.join(hits['cumulative'])}): jeder Teil bräuchte "
                  f"Wissen über andere Teile der Liste; nicht zerlegbar, ein Agent bearbeitet die "
                  f"Gesamtliste.")
    elif classes:
        decomposable, protocol = True, "naht"
        woerter = ", ".join(w for k in classes for w in hits[k])
        reason = (f"Nachbar-/Positionsbezug erkannt ({woerter}): zerlegbar nur mit Nahtprotokoll "
                  f"(Position, Randwerte beidseitig, Lesart Gesamtliste).")
    else:
        decomposable, protocol = True, "none"
        reason = "kein Randbezug erkannt: zerlegbar ohne Protokoll."
    result = {"classes": classes, "hits": hits, "decomposable": decomposable,
              "protocol": protocol, "reason": reason}
    bus.emit("decompose.seam_check", classes=classes, decomposable=decomposable,
             protocol=protocol, condition_chars=len(text))
    return result


# --- Anweisungen je Ausschnitt -----------------------------------------------------------
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


# --- Plan ------------------------------------------------------------------------------------
def plan(items: list, condition: str, *, parts: int) -> dict:
    """Zerlegt mechanisch in höchstens `parts` Ausschnitte; DecomposeError, wenn nicht zerlegbar.

    Rückgabe {"protocol", "classes", "n_total", "parts", "merge": "sum",
              "chunks": [{"index", "offset", "items", "before", "after", "instruction"}]}.
    Randwerte werden in jedem Chunk mitgeführt, auch ohne Protokoll (kostet nichts, hilft dem Log).
    """
    items = list(items)
    if not items:
        raise DecomposeError("leere Liste: nichts zu zerlegen")
    if parts < 1:
        raise DecomposeError(f"parts muss >= 1 sein, war {parts}")
    check = seam_check(condition)
    if not check["decomposable"]:
        bus.emit("decompose.refused", classes=check["classes"], reason=check["reason"])
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
    result = {"protocol": check["protocol"], "classes": check["classes"], "n_total": n,
              "parts": len(chunks), "merge": "sum", "chunks": chunks}
    bus.emit("decompose.plan", protocol=check["protocol"], parts=len(chunks), n_total=n,
             chunk_size=size)
    return result


# --- Zusammenführung -----------------------------------------------------------------------
def merge(values: list, op: str = "sum") -> tuple:
    """Mechanische Zusammenführung: (wert, fehlend). None zählt als fehlend.

    sum über die vorhandenen Werte (kein Wert vorhanden → None); max/min analog.
    Ein fehlender Wert wird gezählt, nie geraten — der Aufrufer sieht die Lücke.
    """
    if op not in MERGE_OPS:
        raise DecomposeError(f"unbekannte Zusammenführung: {op!r} (erlaubt: {', '.join(MERGE_OPS)})")
    present = [v for v in values if v is not None]
    missing = len(values) - len(present)
    if not present:
        return None, missing
    if op == "sum":
        return sum(present), missing
    if op == "max":
        return max(present), missing
    return min(present), missing


def _parse_count(text: str):
    """Letzte Zahl der Arbeiterantwort; ganzzahlig, wenn sie es ist; None ohne Zahl."""
    value = _model.extract_last_number(text)
    if value is None:
        return None
    return int(value) if float(value).is_integer() else value


# --- Durchlauf -----------------------------------------------------------------------------
def run(items: list, condition: str, *, parts: int, model: str | None = None, thinking: int = 0,
        workers: int = 5) -> dict:
    """plan → ein Modellaufruf je Ausschnitt (parallel) → merge im Code.

    Rückgabe {"value", "calls", "missing", "protocol", "chunks", "values"}.
    DecomposeError propagiert, wenn die Bedingung nicht zerlegbar ist.
    """
    p = plan(items, condition, parts=parts)
    chunks = p["chunks"]

    def _worker(chunk: dict) -> dict:
        return _model.call(WORKER_SYSTEM, chunk["instruction"], model=model, thinking=thinking)

    with ThreadPoolExecutor(max_workers=max(1, min(workers, len(chunks)))) as ex:
        results = list(ex.map(_worker, chunks))
    values = [_parse_count(r.get("text", "")) if r.get("ok") else None for r in results]
    value, missing = merge(values, p["merge"])
    bus.emit("decompose.run", protocol=p["protocol"], calls=len(results), missing=missing,
             chunks=len(chunks), value=value)
    return {"value": value, "calls": len(results), "missing": missing,
            "protocol": p["protocol"], "chunks": len(chunks), "values": values}
