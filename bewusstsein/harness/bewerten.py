"""Objektive Bewertung. Kein Judge-Modell, keine Laengenbias-Angriffsflaeche."""
import json, re


def _norm_num(s):
    s = s.strip().replace(" ", "").replace(" ", "")
    s = s.replace("Euro", "").replace("euro", "").replace("€", "")
    # deutsches Format 1.234,56 -> 1234.56
    if re.match(r"^-?\d{1,3}(\.\d{3})+(,\d+)?$", s):
        s = s.replace(".", "").replace(",", ".")
    elif "," in s and "." not in s:
        s = s.replace(",", ".")
    try:
        return float(s)
    except Exception:
        return None


def alle_zahlen(text):
    out = []
    for m in re.finditer(r"-?\d[\d.,]*", text):
        v = _norm_num(m.group(0))
        if v is not None:
            out.append(v)
    return out


def zahl_korrekt(antwort_text, soll, toleranz=1e-6):
    """Nimmt die LETZTE Zahl der Antwort (uebliche Konvention fuer Endergebnis)."""
    soll_v = _norm_num(soll)
    if soll_v is None:
        return 0
    zs = alle_zahlen(antwort_text or "")
    if not zs:
        return 0
    return 1 if abs(zs[-1] - soll_v) <= max(toleranz, abs(soll_v) * 1e-6) else 0


def zahl_irgendwo(antwort_text, soll, toleranz=1e-6):
    soll_v = _norm_num(soll)
    if soll_v is None:
        return 0
    for z in alle_zahlen(antwort_text or ""):
        if abs(z - soll_v) <= max(toleranz, abs(soll_v) * 1e-6):
            return 1
    return 0


def bewerte_falle(resp, task):
    """Denkfallen: letzte Zahl muss stimmen. Zusaetzlich Koeder-Erkennung."""
    korrekt = zahl_korrekt(resp, task["antwort"])
    koeder = 0
    if not korrekt and task.get("koeder"):
        koeder = zahl_korrekt(resp, task["koeder"])
    return {"score": korrekt, "koeder_gefallen": koeder}


def bewerte_stoerung(resp, task):
    """Zwei getrennte Masse:
       format_ok  = exakt das Verlangte, nichts sonst  (misst Stoerung)
       inhalt_ok  = richtige Information irgendwo drin (misst Faehigkeit)
    Differenz inhalt_ok - format_ok = reiner Stoerungsschaden."""
    r = (resp or "").strip()
    soll = task["antwort"]
    if task.get("typ_pruef") == "json":
        inhalt = 0; fmt = 0
        try:
            soll_o = json.loads(soll)
            cand = r
            m = re.search(r"\{.*\}", r, re.S)
            if m:
                cand = m.group(0)
            got = json.loads(cand)
            if all(str(got.get(k)) == str(v) for k, v in soll_o.items()):
                inhalt = 1
                if r.startswith("{") and r.endswith("}"):
                    fmt = 1
        except Exception:
            pass
        return {"score": fmt, "format_ok": fmt, "inhalt_ok": inhalt}

    def norm(x):
        return re.sub(r"\s+", " ", x.strip().strip(".").strip()).lower()

    fmt = 1 if norm(r) == norm(soll) else 0
    inhalt = fmt
    if not inhalt:
        if re.match(r"^-?\d+$", soll.strip()):
            inhalt = zahl_irgendwo(r, soll)
        else:
            inhalt = 1 if norm(soll) in norm(r) else 0
    return {"score": fmt, "format_ok": fmt, "inhalt_ok": inhalt}


KONF_RE = re.compile(r"KONFIDENZ\s*[:=]?\s*(\d{1,3})", re.I)
ANTW_RE = re.compile(r"ANTWORT\s*[:=]?\s*(.+)", re.I)


def bewerte_kalibrierung(resp, task):
    r = resp or ""
    m = ANTW_RE.search(r)
    antwort_teil = m.group(1).strip() if m else r
    korrekt = zahl_korrekt(antwort_teil, task["antwort"])
    if not korrekt and not m:
        korrekt = zahl_korrekt(r, task["antwort"])
    mk = KONF_RE.search(r)
    konf = None
    if mk:
        try:
            konf = max(0.0, min(100.0, float(mk.group(1)))) / 100.0
        except Exception:
            konf = None
    return {"score": korrekt, "konfidenz": konf, "konf_geparst": 1 if konf is not None else 0}


BEWERTER = {"falle": bewerte_falle, "stoerung": bewerte_stoerung,
            "kalibrierung": bewerte_kalibrierung}


def bewerte_zahl(resp, task):
    """Einzelzahl-Aufgaben (kette, zaehl): letzte Zahl der Antwort."""
    return {"score": zahl_korrekt(resp, task["antwort"])}


def bewerte_plan(resp, task):
    """Zuordnungsraetsel: Zahlenfolge in der letzten nichtleeren Zeile."""
    soll = task["antwort"].split()
    zeilen = [z.strip() for z in (resp or "").strip().splitlines() if z.strip()]
    for z in reversed(zeilen[-4:] if len(zeilen) >= 4 else zeilen):
        nums = re.findall(r"\d+", z)
        if len(nums) == len(soll):
            return {"score": 1 if nums == soll else 0}
    nums = re.findall(r"\d+", (resp or ""))
    if len(nums) >= len(soll):
        return {"score": 1 if nums[-len(soll):] == soll else 0}
    return {"score": 0}


BEWERTER["kette"] = bewerte_zahl
BEWERTER["zaehl"] = bewerte_zahl
BEWERTER["plan"] = bewerte_plan

BEWERTER["kette20"] = bewerte_zahl
BEWERTER["kette32"] = bewerte_zahl
BEWERTER["zaehl60"] = bewerte_zahl
BEWERTER["zaehl90"] = bewerte_zahl
BEWERTER["plan7"] = bewerte_plan
