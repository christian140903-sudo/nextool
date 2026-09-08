"""Sammelt alle Endzahlen in eine maschinenlesbare Datei (Grundlage des Berichts)."""
import sys, os, json
sys.path.insert(0,'/home/user/nextool/bewusstsein/harness')
import analyse, experiment, statistik, experiment_arch

# Bestehende Endzahlen bleiben erhalten: ein Block wird nur neu geschrieben, wenn seine
# Rohdaten vorliegen. Sonst wuerde ein Lauf ohne entpackte Belege die alten Zahlen leeren.
_ENDZAHLEN = "bewusstsein/ergebnisse/ENDZAHLEN.json"
try:
    R = json.load(open(_ENDZAHLEN, encoding="utf-8"))
except (OSError, ValueError):
    R = {}


def _hat_rohdaten(outdir):
    return os.path.isdir(os.path.join(outdir, "raw"))


def block(name, outdir, suite, arme, runs, limit, basis):
    if not _hat_rohdaten(outdir): return
    try: tasks = experiment.lade_suite(suite)[:limit]
    except Exception: return
    d = analyse.sammle(outdir, suite, tasks, arme, runs)
    eintrag = {}
    for a in arme:
        s = d.get(a,{}).get("score",[])
        if not s: continue
        e = {"genauigkeit": round(sum(s)/len(s),4), "n": len(s),
             "tokens": round(sum(d[a]["tok"])/len(d[a]["tok"]),1)}
        if d[a]["detail"] and "format_ok" in d[a]["detail"][0]:
            det=d[a]["detail"]
            e["format_ok"]=round(sum(x["format_ok"] for x in det)/len(det),4)
            e["abgriff_ok"]=round(sum(x["abgriff_ok"] for x in det)/len(det),4)
            e["inhalt_ok"]=round(sum(x["inhalt_ok"] for x in det)/len(det),4)
            e["formatschaden_pp"]=round((e["inhalt_ok"]-e["format_ok"])*100,1)
            e["abgriffschaden_pp"]=round((e["inhalt_ok"]-e["abgriff_ok"])*100,1)
        if a != basis and d.get(basis,{}).get("score"):
            pa,pb = d[basis]["paar"], d[a]["paar"]
            A,B=[],[]
            for tid in pa:
                if tid in pb:
                    k=min(len(pa[tid]),len(pb[tid])); A+=pa[tid][:k]; B+=pb[tid][:k]
            if len(A)>=10:
                st=statistik.paired_bootstrap(A,B)
                e["delta_pp"]=round(st["diff"]*100,1); e["ki"]=[round(st["ci_lo"]*100,1),round(st["ci_hi"]*100,1)]
                e["p"]=round(st["p"],4); e["signifikant"]=st["p"]<0.05
        eintrag[a]=e
    R[name]={"suite":suite,"basis":basis,"arme":eintrag}

def arch_block(name, outdir, suite, archs, runs, limit, basis):
    """Mehrfachaufruf-Architekturen: andere Artefaktform als die Einzelarme,
    deshalb ueber experiment_arch.sammle statt analyse.sammle."""
    if not _hat_rohdaten(outdir): return
    try: tasks = experiment.lade_suite(suite)[:limit]
    except Exception: return
    d = experiment_arch.sammle(outdir, suite, tasks, archs, runs)
    eintrag = {}
    for a in archs:
        r = d.get(a, {})
        if not r.get("score"): continue
        n = len(r["score"])
        e = {"genauigkeit": round(sum(r["score"])/n, 4), "n": n,
             "aufrufe": round(sum(r["aufrufe"])/n, 2),
             "tokens": round(sum(r["tok"])/n, 1),
             "abgebrochen": r["fehl"]}
        e["genauigkeit_je_aufruf"] = round(e["genauigkeit"]/e["aufrufe"], 4)
        det = [x for x in r["detail"] if "inhalt_ok" in x]
        if det:
            e["format_ok"] = round(sum(x["format_ok"] for x in det)/len(det), 4)
            e["abgriff_ok"] = round(sum(x["abgriff_ok"] for x in det)/len(det), 4)
            e["inhalt_ok"] = round(sum(x["inhalt_ok"] for x in det)/len(det), 4)
            e["formatschaden_pp"] = round((e["inhalt_ok"]-e["format_ok"])*100, 1)
            e["abgriffschaden_pp"] = round((e["inhalt_ok"]-e["abgriff_ok"])*100, 1)
        if a != basis and d.get(basis, {}).get("score"):
            for feld, schluessel in (("", "paar"), ("inhalt_", "paar_inhalt")):
                st = experiment_arch.paar_delta(d[basis], r, schluessel)
                if not st: continue
                e[feld+"delta_pp"] = round(st["diff"]*100, 1)
                e[feld+"ki"] = [round(st["ci_lo"]*100, 1), round(st["ci_hi"]*100, 1)]
                e[feld+"p"] = round(st["p"], 4)
                e[feld+"signifikant"] = st["p"] < 0.05
        eintrag[a] = e
    R[name] = {"suite": suite, "basis": basis, "arme": eintrag}


O="bewusstsein/ergebnisse"
V=["N","M","P","NUR_FREI","NUR_UNTERDRUECKT","F","F_OFFEN","V1_FAKTOREN","V1_OFFEN",
   "V2_WORKSPACE","V2_OFFEN","V3_SELBST","V3_OFFEN","V4_VORHERSAGE","V4_OFFEN",
   "V5_MONITOR","V5_OFFEN","V5_NUR_ZUTEILUNG","V5_NUR_MONITOR"]
block("sofort_kette20", f"{O}/runde1_sofort","kette20",V,3,70,"P")
block("sofort_plan",    f"{O}/runde1_sofort","plan",V,3,30,"P")
block("stoerung",       f"{O}/runde1_sofort","stoerung",V,3,40,"N")
block("sonnet_kette20", f"{O}/sonnet_sofort","kette20",
      ["P","NUR_FREI","NUR_UNTERDRUECKT","V1_FAKTOREN","V5_MONITOR","V5_NUR_ZUTEILUNG"],3,25,"NUR_FREI")
block("denken_kette60", f"{O}/denken_regime","kette60",
      ["N","P","V1_FAKTOREN","V5_NUR_ZUTEILUNG","V5_MONITOR"],3,25,"N")
def ident_block(name, outdir, arme, runs):
    """Identitaets-Batterie: eigene Artefaktform (drei Phasen je Aufgabe)."""
    if not _hat_rohdaten(outdir): return
    import experiment_ident, suiten_identitaet
    tasks = suiten_identitaet.bauen()
    e = experiment_ident.auswerten(outdir, arme, tasks, runs)
    R[name] = {"suite": "identitaet", "basis": arme[0],
               "arme": {a: {k: (round(v, 4) if isinstance(v, float) else v)
                            for k, v in d.items()} for a, d in e.items()}}


def lauf_bilanz(name, wurzel):
    """Ehrliche Buchfuehrung: Modellaufrufe je Lauf, abgebrochene Aufrufe getrennt.
    Ein Artefakt mit ok=false ist kein Messwert -- es faellt aus der Auswertung und
    muss deshalb sichtbar bleiben, sonst sieht der Lauf sauberer aus als er war."""
    import glob
    alt_bilanz = R.get(name, {})
    ges = {"aufrufe": 0, "artefakte": 0, "abgebrochen": 0,
           "je_lauf": dict(alt_bilanz.get("je_lauf", {}))}
    for d in sorted(glob.glob(os.path.join(wurzel, "*", "raw"))):
        lauf = d.split(os.sep)[-2]
        a = n = f = 0
        for datei in glob.glob(os.path.join(d, "*.json")):
            try: r = json.load(open(datei))
            except Exception: continue
            n += 1; a += r.get("aufrufe", 1)
            if not r.get("ok"): f += 1
        ges["je_lauf"][lauf] = {"aufrufe": a, "artefakte": n, "abgebrochen": f}
    for z in ges["je_lauf"].values():
        ges["aufrufe"] += z["aufrufe"]; ges["artefakte"] += z["artefakte"]; ges["abgebrochen"] += z["abgebrochen"]
    R[name] = ges


# Runde 2: Struktur ZWISCHEN den Aufrufen
A=["A_SC3","A_WORKSPACE","A_PRUEFER","A_SELEKTIV"]
arch_block("arch_kette20", f"{O}/runde2_arch","kette20",A,3,25,"A_SC3")
arch_block("arch_stoerung", f"{O}/runde2_arch","stoerung",
           ["A_SC3","A_PRUEFER","A_SELEKTIV"],3,30,"A_SC3")
# Dieselben 30 Stoerungsaufgaben, mit denen die Architekturen gemessen wurden,
# noch einmal fuer die Einzelarme -- sonst waeren die Tabellen nicht vergleichbar.
block("stoerung30_arme", f"{O}/runde1_sofort","stoerung",
      ["N","P","V5_NUR_ZUTEILUNG","V5_MONITOR"],3,30,"N")

# Dieselben 25 kette20-Aufgaben wie im Sonnet-Lauf -- nur so ist der
# Modellvergleich in Abschnitt 3 des Berichts gepaart.
block("haiku_kette20_25", f"{O}/runde1_sofort","kette20",
      ["P","NUR_FREI","NUR_UNTERDRUECKT","V1_FAKTOREN","V5_MONITOR","V5_NUR_ZUTEILUNG"],
      3,25,"NUR_FREI")
ident_block("identitaet", f"{O}/identitaet",
            ["N","V3_SELBST","MIGUEL_DEKLARIERT","MIGUEL_BELEGT"], 3)
lauf_bilanz("lauf_bilanz", O)


# ---------------------------------------------------------------------------
# Runde 4 (bauendes Modell, 2026-09-07): drei Messungen VOR dem Einbau,
# vorregistriert in ordnung/soul10/ENTSCHEIDUNG.md §4. Jeder Block wird nur
# geschrieben, wenn sein Lauf vorliegt -- ein fehlender Lauf bleibt sichtbar fehlend.
# ---------------------------------------------------------------------------
def zerlegung_block(name, outdir, verfahren, runs, limit, teile, basis="GANZ"):
    """Zerlegungsexperiment: eigene Artefaktform (Verfahren x Aufgabe), je Bedingungstyp."""
    import experiment_zerlegung, io, contextlib
    if not os.path.isdir(os.path.join(outdir, "raw")):
        return
    tasks = experiment_zerlegung.bauen(n=limit, laenge=150)
    with contextlib.redirect_stdout(io.StringIO()):
        d = experiment_zerlegung.auswerten(outdir, verfahren, tasks, runs, basis=basis)
    eintrag = {}
    for v in verfahren:
        r = d.get(v, {})
        if not r.get("richtig"):
            continue
        n = len(r["richtig"])
        e = {"genauigkeit": round(sum(r["richtig"])/n, 4), "n": n,
             "aufrufe": round(sum(r["aufrufe"])/n, 2), "tokens": round(sum(r["tok"])/n, 1),
             "mittlerer_fehler": round(sum(r["abw"])/len(r["abw"]), 3) if r["abw"] else None,
             "je_bedingung": {art: round(sum(x)/len(x), 4) for art, x in r["je_art"].items() if x}}
        if v != basis and d.get(basis, {}).get("richtig"):
            A, B = [], []
            for tid in d[basis]["paar"]:
                if tid in r["paar"]:
                    m = min(len(d[basis]["paar"][tid]), len(r["paar"][tid]))
                    A += d[basis]["paar"][tid][:m]; B += r["paar"][tid][:m]
            if len(A) >= 10:
                st = statistik.paired_bootstrap(A, B)
                e["delta_pp"] = round(st["diff"]*100, 1)
                e["ki"] = [round(st["ci_lo"]*100, 1), round(st["ci_hi"]*100, 1)]
                e["p"] = round(st["p"], 4); e["signifikant"] = st["p"] < 0.05
        eintrag[v] = e
    R[name] = {"suite": f"zerlegung({limit}x150, {teile} Teile)", "basis": basis, "arme": eintrag}


def ged_block(name, outdir, varianten, runs):
    """Gedaechtnis-Experiment: richtig/falsch/unbekannt je Variante."""
    import experiment_ged, suiten_gedaechtnis, io, contextlib
    if not os.path.isdir(os.path.join(outdir, "raw")):
        return
    tasks = suiten_gedaechtnis.bauen()
    with contextlib.redirect_stdout(io.StringIO()):
        d = experiment_ged.auswerten(outdir, varianten, tasks, runs)
    eintrag = {}
    for v in varianten:
        r = d.get(v, {}).get("rec")
        if not r or not r["wahr"]:
            continue
        n = len(r["wahr"])
        eintrag[v] = {"genauigkeit": round(sum(r["wahr"])/n, 4), "falsch": round(sum(r["falsch"])/n, 4),
                      "unbekannt": round(sum(r["unbekannt"])/n, 4), "n": n}
    R[name] = {"suite": "gedaechtnis", "basis": varianten[0], "arme": eintrag}


def ueberraschung_block(name, outdir):
    """M1-Zusatz: Ueberraschungsrate und Genauigkeit je Schaltzweig (aus den Spuren)."""
    import glob, re
    if not os.path.isdir(os.path.join(outdir, "raw")):
        return
    tasks = {t["id"]: t for t in experiment.lade_suite("kette20")}
    import bewerten
    fn = bewerten.BEWERTER["kette20"]
    zweige = {0: [], 1: []}; tp = fp = tn = fn_ = 0
    for p in glob.glob(os.path.join(outdir, "raw", "kette20__*__A_UEBERRASCHUNG__r*.json")):
        d = json.load(open(p))
        if not d.get("ok"): continue
        sch = next((s for s in d["spur"] if s["rolle"] == "schalter"), None)
        loes = next((s for s in d["spur"] if s["rolle"] == "loesung"), None)
        m = re.search(r"ueberrascht=(\d)", sch["text"] if sch else "")
        flag = int(m.group(1)) if m else 1
        zweige[flag].append(fn(d["antwort"], tasks[d["task_id"]])["score"])
        if loes:
            richtig = fn(loes["text"], tasks[d["task_id"]])["score"] == 1
            if flag and not richtig: tp += 1
            elif flag and richtig: fp += 1
            elif not flag and richtig: tn += 1
            else: fn_ += 1
    n = len(zweige[0]) + len(zweige[1])
    if not n: return
    R[name] = {"n": n, "ueberraschungsrate": round(len(zweige[1])/n, 4),
               "genauigkeit_nicht_ueberrascht": round(sum(zweige[0])/len(zweige[0]), 4) if zweige[0] else None,
               "genauigkeit_ueberrascht": round(sum(zweige[1])/len(zweige[1]), 4) if zweige[1] else None,
               "sensitivitaet": round(tp/(tp+fn_), 4) if tp+fn_ else None,
               "spezifitaet": round(tn/(tn+fp), 4) if tn+fp else None,
               "tp": tp, "fp": fp, "tn": tn, "fn": fn_}


arch_block("m1_arch_kette20", f"{O}/m1_ueberraschung", "kette20",
           ["A_SC3", "A_PRUEFER", "A_UEBERRASCHUNG"], 3, 25, "A_SC3")
ueberraschung_block("m1_ueberraschung_zweige", f"{O}/m1_ueberraschung")
zerlegung_block("m2_zerlegung", f"{O}/m2_naht", ["GANZ", "ZERLEGT_CODE", "ZERLEGT_NAHT"], 3, 12, 10, "GANZ")
ged_block("m3_hauptbuch", f"{O}/m3_hauptbuch", ["GIFT", "GIFT_NUR_METADATEN", "GIFT_HERKUNFT"], 3)

json.dump(R, open("bewusstsein/ergebnisse/ENDZAHLEN.json","w"), ensure_ascii=False, indent=1)
print("Bloecke:", list(R.keys()))
for k,v in R.items():
    if "arme" not in v and "aufrufe" not in v:
        print(f"\n== {k} ==\n  " + json.dumps(v, ensure_ascii=False))
        continue
    if "arme" not in v:
        print(f"\n== {k} ==")
        print(f"  {v['aufrufe']} Modellaufrufe in {v['artefakte']} Artefakten, "
              f"{v['abgebrochen']} abgebrochen")
        for lauf,z in v["je_lauf"].items():
            print(f"    {lauf:16s} {z['aufrufe']:5d} Aufrufe, {z['abgebrochen']:3d} abgebrochen")
        continue
    print(f"\n== {k} (Basis {v['basis']}) ==")
    if not all("genauigkeit" in e for e in v["arme"].values()):
        for a,e in v["arme"].items():
            print(f"  {a:18s} " + "  ".join(
                f"{n}={x*100:.1f}%" if isinstance(x,float) else f"{n}={x}"
                for n,x in e.items()))
        continue
    for a,e in sorted(v["arme"].items(), key=lambda x:-x[1]["genauigkeit"]):
        d = f" {e.get('delta_pp',0):+6.1f}pp p={e.get('p','—')}" if "delta_pp" in e else ""
        fs = (f" fmt={e['format_ok']*100:.1f} abgriff={e['abgriff_ok']*100:.1f} "
              f"inhalt={e['inhalt_ok']*100:.1f}") if "formatschaden_pp" in e else ""
        au = f" auf={e['aufrufe']}" if "aufrufe" in e else ""
        print(f"  {a:18s} {e['genauigkeit']*100:5.1f}% n={e['n']:3d} tok={e['tokens']:6.0f}{au}{d}{fs}")
