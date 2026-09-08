"""Schalter: deterministischer Vorfilter, Entropie-Sonde, binäre Stufe, Routing-Log ohne Prompttext.

Befund: die Aufwandsregel gewinnt +12,4 pp auf schweren Aufgaben, kostet aber als Dauerschicht
−16,7 pp Formattreue auf trivialen (bewusstsein/berichte/01-BEFUNDE.md §4); der Prüfer ist auf
trivialen Aufgaben 100 % richtig und 0 % formattreu (§5); A_SELEKTIV hält sich mit 2,08 Aufrufen
zurück, wo nichts zu tun ist (§5). Beide Mechanismen sind als Dauerschicht abgelehnt und als
geschaltete Stufe angenommen (02-UEBERGABE-BAU §5).
Erz → Gold: soul-proxy-45/src/amplify/signals.ts war ein Proto-Router ohne Test, mit
Falsch-Positiven auf Allerweltswörtern (`oder`, `besser`, `live`, `user\\w*`; R10 §2.2.4).
Hier derselbe Katalog ohne diese Wörter, deterministisch, stdlib, mit Datensatz-Test und einem
Log, das nie den Prompt enthält. Die Stufe ist binär (direkt/aufwand), weil nur zwei Stufen
gemessen sind; „pruefer" kommt nur aus der Uneinigkeit zweier billiger Stichproben.
"""
from __future__ import annotations

import json
import re

from . import bus, paths
from . import model as _model  # Alias: der Parameter `model` (Modellname) überdeckt sonst das Modul

STAGES = ("direkt", "aufwand", "pruefer")
TRIVIAL_MAX_CHARS = 200

# --- Signale: Port von signals.ts ohne die Falsch-Positiv-Wörter ------------------------
# Entfernt gegenüber der Vorlage (R10 §2.2.4): `oder` und `entweder` allein (tradeoff), `besser`
# und `rat\w*` (recommendation), `live` und `kunde`/`customer`-Dublette (production), `user\w*`
# (affects_others), `text\w*`/`copy` (craft), `pick`/`einstell\w*` (commitment: Einstellungen),
# `underspecified` (Negativmuster, feuert auf „Wie spät ist es?"). Dubletten `vertrag`/`architect`
# stehen nur noch in je einer Klasse. Neu: `format_locked` (Formatzwang), `text` (aus
# signals.ts TEXT_SIGNAL_PATTERN), `reasoning` (Beweis/Herleitung/Erklärung) und
# `mehrere_groessen` (≥ 3 Zahlen im Prompt) — die letzten beiden sind Erweiterungen.
SIGNALS: dict[str, re.Pattern] = {
    "presupposed_solution": re.compile(
        r"\b(?:add|introduce|implement|build|use|switch to|migrate to|integrate"
        r"|f(?:ü|ue)ge?\s+\w+\s+hinzu|baue?|implementiere?|nutze?|verwende?|steige?\s+auf"
        r"|wechsle?\s+(?:zu|auf))\b", re.IGNORECASE),
    "open_ended": re.compile(
        r"\b(?:how (?:should|do|would|can)|what.s the best|which (?:approach|way|option)"
        r"|strategie|konzept|entwirf|design|wie (?:sollte?n?|w(?:ü|ue)rde?n?)"
        r"|welcher? (?:ansatz|weg)|am besten)\b", re.IGNORECASE),
    "durable": re.compile(
        r"\b(?:schema|api|interface|contract|foundation|fundament|standard|convention"
        r"|protokoll|protocol|datenmodell|data model|langfristig|long-?term|wartbar"
        r"|maintainab\w*)\b", re.IGNORECASE),
    "architecture": re.compile(
        r"\b(?:architect\w*|architekt\w*|struktur|structure|refactor\w*|umbau|redesign|neubau"
        r"|system design)\b", re.IGNORECASE),
    "irreversible": re.compile(
        r"\b(?:deploy\w*|prod(?:uction)?|release|publish|ver(?:ö|oe)ffentlich\w*|migrat\w*"
        r"|migrier\w*|delete|drop (?:table|database|column)|l(?:ö|oe)sch\w*|irreversib\w*"
        r"|unwiderruflich|k(?:ü|ue)ndig\w*|vertrag)\b", re.IGNORECASE),
    "commitment": re.compile(
        r"\b(?:choose|decide|commit|entscheid\w*|w(?:ä|ae)hl\w*|festleg\w*|einigen|hire"
        r"|kauf\w*|buy|invest\w*)\b", re.IGNORECASE),
    "recommendation": re.compile(
        r"\b(?:should (?:i|we)|soll(?:en|te|ten)? (?:ich|wir)|recommend\w*|empfehl\w*"
        r"|w(?:ü|ue)rdest du|what would you|advice|advise|rat (?:mir|uns)|ratschlag)\b",
        re.IGNORECASE),
    "affects_others": re.compile(
        r"\b(?:nutzer\w*|kunde\w*|kunden|customer\w*|team|kolleg\w*|mitarbeiter\w*|patient\w*"
        r"|public|(?:ö|oe)ffentlich\w*|leser\w*|besucher\w*|community|zielgruppe|audience)\b",
        re.IGNORECASE),
    "tradeoff": re.compile(
        r"\b(?:vs\.?|versus|trade-?offs?|abw(?:ä|ae)g\w*|compromise|kompromiss|balance"
        r"|entweder\b.{1,80}\boder|either\b.{1,80}\bor)\b", re.IGNORECASE),
    "craft": re.compile(
        r"\b(?:design|ux|ui|wording|layout|typograf\w*|typograph\w*|(?:ä|ae)sthetik|aesthetic"
        r"|politur|polish|qualit(?:ä|ae)t|quality|feinschliff|craft)\b", re.IGNORECASE),
    "production": re.compile(
        r"\b(?:prod(?:uction)?|ship(?:ping|ped)?|launch\w*|release|ausliefer\w*|go-?live|rollout)\b",
        re.IGNORECASE),
    "text": re.compile(
        r"\b(?:e-?mails?|mail an|brief (?:an|f(?:ü|ue)r)|letter to|absage|zusage|einladung"
        r"|invitation|ank(?:ü|ue)ndigung|announcement|entschuldigung|apology|kondolenz|beileid"
        r"|condolence|newsletter|blog[- ]?post|tweet|anschreiben|leserbrief|dankesschreiben"
        r"|ansprache|trauerrede"
        r"|(?:schreib|verfass|formulier|write|draft|compose)\w*\s+(?:\w+\s+){0,3}"
        r"(?:text|nachricht|mail|brief|antwort|message|reply|note|posting))\b", re.IGNORECASE),
    "reasoning": re.compile(
        r"\b(?:beweis\w*|prove|proof|herleit\w*|derive|zeige,? dass|show that|begr(?:ü|ue)nde\w*"
        r"|justify|warum|why|analysier\w*|analy[sz]e\w*|vergleich\w*|compare|erkl(?:ä|ae)r\w*"
        r"|explain|diskutier\w*|discuss|bewert\w*|evaluate)\b", re.IGNORECASE),
    # mindestens drei Zahlen: „mehrere Größen" im Sinn der Aufwandsregel
    "mehrere_groessen": re.compile(r"\d+(?:[.,]\d+)*(?:\D+\d+(?:[.,]\d+)*){2}"),
    "format_locked": re.compile(
        r"\b(?:nur|only|exakt|genau|exactly)\b[^\n.!?]{0,60}?"
        r"\b(?:Zahl|Wort|Zeile|Ziffer|JSON|number|word|line|digit|code)\b"
        r"|\bJSON\b"
        r"|\bGib\b[^\n.!?]{0,80}\baus\b"
        r"|\bkein weiterer Text\b|\bnichts sonst\b|\bnothing else\b"
        r"|\bno (?:other|further|additional) text\b|\bno explanation\b|\bohne Erkl(?:ä|ae)rung\b"
        r"|\bantworte nur mit\b|\brespond only with\b|\breturn only\b|\boutput only\b"
        r"|\bals (?:reine[sn]? )?JSON\b|\bas JSON\b|\bvalid JSON\b|\byaml only\b|\bcsv only\b",
        re.IGNORECASE),
}

# Signale, die eine Aufgabe NICHT aus der Trivialität heben: der Formatzwang führt selbst zu
# „direkt", und „add/use/build" stehen auch in Einzeilern („Use two decimals").
WEAK_SIGNALS = frozenset({"format_locked", "presupposed_solution"})

# Satzgrenzen: Satzzeichen nach einem Nicht-Digit plus Leerraum (damit „1. Januar" und „2.5"
# nicht trennen) oder ein Zeilenumbruch.
_SENTENCE_SPLIT = re.compile(r"(?<=[^\d][.!?:])\s+|\n+")


def detect_signals(prompt: str) -> list[str]:
    """Alle zutreffenden Signale in Katalogreihenfolge (Mehrfachzugehörigkeit ist der Normalfall)."""
    text = (prompt or "").strip()
    return [name for name, rx in SIGNALS.items() if rx.search(text)]


def sentence_count(prompt: str) -> int:
    """Anzahl Sätze/Fragen; ein Prompt ohne Satzzeichen zählt als ein Satz."""
    pieces = [p for p in _SENTENCE_SPLIT.split((prompt or "").strip()) if p and p.strip()]
    return max(1, len(pieces))


def prefilter(prompt: str) -> dict:
    """Deterministischer Vorfilter: {"len", "signals", "trivial", "format_locked", "sentences"}.

    trivial: ≤ 200 Zeichen UND kein (starkes) Signal UND höchstens ein Satz/eine Frage.
    format_locked: der Prompt schreibt das Ausgabeformat fest (nur die Zahl, JSON, nichts sonst).
    """
    text = (prompt or "").strip()
    signals = detect_signals(text)
    strong = [s for s in signals if s not in WEAK_SIGNALS]
    sentences = sentence_count(text)
    trivial = len(text) <= TRIVIAL_MAX_CHARS and not strong and sentences <= 1
    return {"len": len(text), "signals": signals, "trivial": trivial,
            "format_locked": "format_locked" in signals, "sentences": sentences}


# --- Entropie-Sonde -------------------------------------------------------------------------
def _comparable(result: dict):
    """Vergleichswert einer Stichprobe: letzte Zahl, sonst letzte Zeile (normalisiert); None bei Fehler."""
    if not result.get("ok"):
        return None
    text = result.get("text", "")
    number = _model.extract_last_number(text)
    if number is not None:
        return round(number, 9)
    line = _model.extract_last_line(text).strip().lower()
    return line or None


def entropy_probe(task: str, *, model: str | None = None, thinking: int = 0, n: int = 2) -> dict:
    """n billige Aufrufe ohne Systemprompt; einig, wenn alle Endwerte gleich sind.

    Ein fehlgeschlagener Aufruf zählt als uneinig (lieber ein Prüfer zu viel als ein Fehler
    unbemerkt). Rückgabe {"agree", "values", "calls"}.
    """
    n = max(1, int(n))
    results = [_model.call(None, task, model=model, thinking=thinking) for _ in range(n)]
    values = [_comparable(r) for r in results]
    agree = all(v is not None for v in values) and len(set(values)) == 1
    bus.emit("switch.entropy_probe", agree=agree, calls=n, values=values)
    return {"agree": agree, "values": values, "calls": n}


# --- Entscheidung ---------------------------------------------------------------------------
def _log_routing(record: dict) -> None:
    """Eine Zeile routing.jsonl — fail-open, nie eine Exception nach außen."""
    try:
        with paths.routing_file().open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(record, ensure_ascii=False, default=str) + "\n")
    except Exception:  # noqa: BLE001 — ein kaputtes Log hält nichts an
        pass


def decide(prompt: str, *, probe: bool = False, model: str | None = None) -> dict:
    """Stufe für einen Prompt; loggt Hash, Länge, Signale, Stufe — NIE den Prompttext.

    direkt   : trivial oder format_locked → nichts einblenden, kein Prüfer.
    aufwand  : sonst → model.AUFWANDSREGEL einblenden.
    pruefer  : nur wenn probe=True, die Stufe sonst aufwand wäre und die Entropie-Sonde
               uneinig ist → Aufwandsregel einblenden UND Prüfer rufen.
    Rückgabe {"stage", "reason", "inject", "signals", "len", "trivial", "format_locked", "sha", "probe"}.
    """
    text = (prompt or "").strip()
    pf = prefilter(text)
    probe_result = None
    if pf["trivial"]:
        stage, reason = "direkt", "trivial: kurz, ein Satz, kein Signal"
    elif pf["format_locked"]:
        stage, reason = "direkt", "format_locked: Ausgabeformat festgeschrieben"
    else:
        stage = "aufwand"
        strong = [s for s in pf["signals"] if s not in WEAK_SIGNALS]
        if strong:
            reason = "Signale: " + ", ".join(strong)
        elif pf["len"] > TRIVIAL_MAX_CHARS:
            reason = f"Länge {pf['len']} > {TRIVIAL_MAX_CHARS}"
        else:
            reason = f"{pf['sentences']} Sätze"
        if probe:
            probe_result = entropy_probe(text, model=model)
            if not probe_result["agree"]:
                stage = "pruefer"
                reason += "; Entropie-Sonde uneinig"
            else:
                reason += "; Entropie-Sonde einig"
    inject = _model.AUFWANDSREGEL if stage in ("aufwand", "pruefer") else ""
    sha = paths.sha256_text(text)
    record = {"ts": paths.now_iso(), "sha": sha, "len": pf["len"], "signals": pf["signals"],
              "trivial": pf["trivial"], "format_locked": pf["format_locked"], "stage": stage,
              "reason": reason}
    _log_routing(record)
    bus.emit("switch.decide", sha=sha, len=pf["len"], signals=pf["signals"], stage=stage,
             reason=reason, probe=probe_result["agree"] if probe_result else None)
    return {"stage": stage, "reason": reason, "inject": inject, "signals": pf["signals"],
            "len": pf["len"], "trivial": pf["trivial"], "format_locked": pf["format_locked"],
            "sentences": pf["sentences"], "sha": sha, "probe": probe_result}
