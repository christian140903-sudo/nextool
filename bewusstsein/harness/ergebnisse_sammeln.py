"""Sammelt alle Endzahlen in eine maschinenlesbare Datei (Grundlage des Berichts)."""
import sys, os, json
sys.path.insert(0,'/home/user/nextool/bewusstsein/harness')
import analyse, experiment, statistik, experiment_arch

R = {}
def block(name, outdir, suite, arme, runs, limit, basis):
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
    ges = {"aufrufe": 0, "artefakte": 0, "abgebrochen": 0, "je_lauf": {}}
    for d in sorted(glob.glob(os.path.join(wurzel, "*", "raw"))):
        lauf = d.split(os.sep)[-2]
        a = n = f = 0
        for datei in glob.glob(os.path.join(d, "*.json")):
            try: r = json.load(open(datei))
            except Exception: continue
            n += 1; a += r.get("aufrufe", 1)
            if not r.get("ok"): f += 1
        ges["je_lauf"][lauf] = {"aufrufe": a, "artefakte": n, "abgebrochen": f}
        ges["aufrufe"] += a; ges["artefakte"] += n; ges["abgebrochen"] += f
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

json.dump(R, open("bewusstsein/ergebnisse/ENDZAHLEN.json","w"), ensure_ascii=False, indent=1)
print("Bloecke:", list(R.keys()))
for k,v in R.items():
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
