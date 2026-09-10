"""Mehrfachaufruf-Architekturen: echte Strukturen statt Prompt-Varianten.

Runde 1 prueft Struktur INNERHALB eines Aufrufs (Systemprompt).
Runde 2 prueft Struktur ZWISCHEN Aufrufen -- dort hat das Modell keine
native Entsprechung (Extended Thinking deckt nur den Einzelaufruf ab).

Jede Architektur wird gegen SC3 bei gleichem oder kleinerem Aufrufbudget gemessen.
Buchfuehrung: Aufrufe UND Tokens, denn eine Architektur, die nur teurer ist,
hat nichts gewonnen.
"""
import json, os, sys, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import runner, bewerten


def _endwert(text, suite):
    if suite in ("plan", "plan7", "stoerung"):
        return (text or "").strip().splitlines()[-1].strip() if (text or "").strip() else ""
    zs = bewerten.alle_zahlen(text or "")
    return str(zs[-1]) if zs else ""


def arch_workspace(frage, suite, model, thinking):
    """Echter globaler Arbeitsraum ueber 3 Aufrufe:
    zwei unabhaengige Spezialisten -> Engpass, der auswaehlt statt durchzureichen."""
    spuren = []
    s1 = runner.call_model(
        "Du bist der Spezialist WOERTLICH. Du loest die Aufgabe NICHT. Du gibst nur "
        "praezise wieder, welche Groessen, Operationen und Bedingungen buchstaeblich "
        "gegeben sind, in der Reihenfolge ihres Auftretens. Maximal 12 Zeilen.",
        frage, model=model, thinking=thinking)
    spuren.append(("woertlich", s1))
    s2 = runner.call_model(
        "Du bist der Spezialist SKEPTIKER. Du loest die Aufgabe NICHT. Du nennst nur "
        "die Stellen, an denen bei genau dieser Aufgabe erfahrungsgemaess Fehler "
        "entstehen: Fehllesungen, uebersehene Bedingungen, Reihenfolgefehler, "
        "Formatfallen. Maximal 8 Zeilen.",
        frage, model=model, thinking=thinking)
    spuren.append(("skeptiker", s2))
    ws = (f"ARBEITSRAUM — Meldungen der Spezialisten:\n\n"
          f"[WOERTLICH]\n{s1.get('text','')}\n\n[SKEPTIKER]\n{s2.get('text','')}\n\n"
          f"AUFGABE:\n{frage}")
    s3 = runner.call_model(
        "Du bist der ARBEITSRAUM. Vor dir liegen Meldungen unbewusster Spezialisten. "
        "Nimm NICHT alles auf: waehle aus, was die Aufgabe wirklich erklaert, verwirf "
        "den Rest. Wenn der Skeptiker einen Einwand hat, raeume ihn zuerst aus. "
        "Antworte danach exakt im verlangten Format.",
        ws, model=model, thinking=thinking)
    spuren.append(("arbeitsraum", s3))
    return s3.get("text", ""), spuren


def arch_pruefer(frage, suite, model, thinking):
    """Pruefer vor Ausfuehrer: loesen, dann unabhaengig verifizieren (2 Aufrufe)."""
    spuren = []
    a = runner.call_model(None, frage, model=model, thinking=thinking)
    spuren.append(("loesung", a))
    p = (f"AUFGABE:\n{frage}\n\nVORGESCHLAGENE ANTWORT:\n{a.get('text','')}\n\n"
         f"Pruefe diese Antwort unabhaengig nach, indem du die Aufgabe selbst von den "
         f"gegebenen Groessen her neu aufbaust. Wenn sie richtig ist, wiederhole sie "
         f"unveraendert. Wenn sie falsch ist, gib die korrigierte Antwort. "
         f"Antworte am Ende exakt im verlangten Format.")
    b = runner.call_model(
        "Du bist ein unabhaengiger Pruefer. Du uebernimmst nichts ungeprueft.",
        p, model=model, thinking=thinking)
    spuren.append(("pruefung", b))
    return b.get("text", ""), spuren


def arch_selektiv(frage, suite, model, thinking):
    """Selektive Vertiefung: zwei billige Versuche. Einigkeit -> fertig (2 Aufrufe).
    Uneinigkeit -> gezielte Vertiefung (3 Aufrufe). Setzt Chrisos Befund um,
    dass Streuung ueber Wiederholungen Fehler vorhersagt (AUC 0,968)."""
    spuren = []
    a = runner.call_model(None, frage, model=model, thinking=thinking)
    b = runner.call_model(None, frage, model=model, thinking=thinking)
    spuren += [("probe1", a), ("probe2", b)]
    ka, kb = _endwert(a.get("text", ""), suite), _endwert(b.get("text", ""), suite)
    if ka and ka == kb:
        return a.get("text", ""), spuren          # einig -> billig fertig
    p = (f"AUFGABE:\n{frage}\n\nZwei unabhaengige Durchgaenge kamen zu VERSCHIEDENEN "
         f"Ergebnissen:\nA: {ka}\nB: {kb}\n\nGenau eine Stelle unterscheidet die beiden "
         f"Wege. Baue die Aufgabe von den gegebenen Groessen her neu auf, finde die "
         f"Abweichungsstelle und entscheide begruendet. Antworte am Ende exakt im "
         f"verlangten Format.")
    c = runner.call_model(
        "Du bist die Vertiefungsstufe. Sie wird nur aufgerufen, wenn Unsicherheit "
        "gemessen wurde. Arbeite hier gruendlich.", p, model=model, thinking=thinking)
    spuren.append(("vertiefung", c))
    return c.get("text", ""), spuren


def arch_sc3(frage, suite, model, thinking):
    """Selbstkonsistenz@3 -- der staerkste Gegner, gleiches Budget wie workspace."""
    spuren = []
    texte = []
    for k in range(3):
        r = runner.call_model(None, frage, model=model, thinking=thinking)
        spuren.append((f"probe{k}", r)); texte.append(r.get("text", ""))
    ks = [_endwert(t, suite) for t in texte]
    z = collections.Counter([k for k in ks if k])
    if not z:
        return texte[0], spuren
    best = z.most_common(1)[0][0]
    for t, k in zip(texte, ks):
        if k == best:
            return t, spuren
    return texte[0], spuren


ARCHITEKTUREN = {
    "A_WORKSPACE": arch_workspace,
    "A_PRUEFER": arch_pruefer,
    "A_SELEKTIV": arch_selektiv,
    "A_SC3": arch_sc3,
}


def arch_direkt(frage, suite, model, thinking):
    """Ein einzelner Aufruf -- Vergleichsmassstab fuer die Modelloekonomie."""
    r = runner.call_model(None, frage, model=model, thinking=thinking)
    return r.get("text", ""), [("direkt", r)]


ARCHITEKTUREN["A_DIREKT"] = arch_direkt


# ============================================================================
# Runde 4 (bauendes Modell, 2026-09-07): Ueberraschung als Schalter.
#
# Das Ueberraschungs-Prinzip des Entwurfs (00b-ERFINDUNGEN, "Ueberraschung als
# Waehrung", E18) war als Prompt-Variante gemessen (V4_VORHERSAGE: -12,2 pp) und
# als Architektur ZWISCHEN Aufrufen ungeprueft (06-AUFTRAG §4.2). Hier die
# billigste ehrliche Form: eine Vorhersage OHNE Rechnung vor der Loesung; weicht
# die Loesung von der Vorhersage ab, ist das eine Ueberraschung und ruft den
# Pruefer (wie A_PRUEFER). Keine Ueberraschung: fertig mit 2 Aufrufen.
#
# Frage: Ist Ueberraschung ein Fehlersignal? Dann ist das der Schalter, den
# 02-UEBERGABE-BAU §5 verlangt -- Pruefer nur dort, wo er gebraucht wird.
# Vorregistriert in ordnung/soul10/ENTSCHEIDUNG.md §4 (M1).
# ============================================================================
import experiment as _experiment


def _bereich(text):
    """Zwei Zahlen aus der Vorhersage -> (lo, hi). Weniger als zwei: (None, None)."""
    zs = bewerten.alle_zahlen(text or "")
    if len(zs) < 2:
        return None, None
    lo, hi = zs[0], zs[1]
    return (lo, hi) if lo <= hi else (hi, lo)


def _ohne_antwortsuffix(frage, suite):
    """Die Vorhersage bekommt die Aufgabe OHNE die Antwortformat-Anweisung der Suite,
    sonst konkurriert 'Antworte SOFORT mit nur dem Endwert' mit dem Bereichsformat."""
    sfx = _experiment.suffix_fuer(suite)
    if sfx and frage.endswith(sfx):
        return frage[: -len(sfx)]
    return frage


def arch_ueberraschung(frage, suite, model, thinking):
    """Ueberraschung als Schalter: Vorhersage ohne Rechnung -> Loesung -> Vergleich.
    Liegt die Loesung im vorhergesagten Bereich: fertig (2 Aufrufe).
    Sonst (Ueberraschung): unabhaengiger Pruefer wie in arch_pruefer (3 Aufrufe).
    Fehlt eine auswertbare Vorhersage, gilt das konservativ als Ueberraschung."""
    spuren = []
    v = runner.call_model(
        "Du schaetzt das Endergebnis einer Aufgabe, OHNE sie zu loesen und ohne zu "
        "rechnen. Antworte in genau einer Zeile im Format 'BEREICH: <von> bis <bis>' "
        "mit zwei Zahlen, zwischen denen das Endergebnis sehr wahrscheinlich liegt. "
        "Waehle den Bereich so eng, wie du es dir zutraust. Sonst nichts.",
        _ohne_antwortsuffix(frage, suite), model=model, thinking=thinking)
    spuren.append(("vorhersage", v))
    a = runner.call_model(None, frage, model=model, thinking=thinking)
    spuren.append(("loesung", a))
    lo, hi = _bereich(v.get("text", ""))
    wert = _endwert(a.get("text", ""), suite)
    ueberrascht = 1
    try:
        w = float(wert)
        if lo is not None and lo <= w <= hi:
            ueberrascht = 0
    except (TypeError, ValueError):
        pass
    spuren.append(("schalter", {"text": f"ueberrascht={ueberrascht} bereich={lo}..{hi} wert={wert}",
                                "ok": True, "output_tokens": 0, "pseudo": True}))
    if not ueberrascht:
        return a.get("text", ""), spuren
    p = (f"AUFGABE:\n{frage}\n\nVORGESCHLAGENE ANTWORT:\n{a.get('text','')}\n\n"
         f"Pruefe diese Antwort unabhaengig nach, indem du die Aufgabe selbst von den "
         f"gegebenen Groessen her neu aufbaust. Wenn sie richtig ist, wiederhole sie "
         f"unveraendert. Wenn sie falsch ist, gib die korrigierte Antwort. "
         f"Antworte am Ende exakt im verlangten Format.")
    b = runner.call_model(
        "Du bist ein unabhaengiger Pruefer. Du uebernimmst nichts ungeprueft.",
        p, model=model, thinking=thinking)
    spuren.append(("pruefung", b))
    return b.get("text", ""), spuren


ARCHITEKTUREN["A_UEBERRASCHUNG"] = arch_ueberraschung
