"""Sammelt alle Endzahlen in eine maschinenlesbare Datei (Grundlage des Berichts)."""
import sys, os, json
sys.path.insert(0,'/home/user/nextool/bewusstsein/harness')
import analyse, experiment, statistik

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
            e["inhalt_ok"]=round(sum(x["inhalt_ok"] for x in det)/len(det),4)
            e["formatschaden_pp"]=round((e["inhalt_ok"]-e["format_ok"])*100,1)
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
json.dump(R, open("bewusstsein/ergebnisse/ENDZAHLEN.json","w"), ensure_ascii=False, indent=1)
print("Bloecke:", list(R.keys()))
for k,v in R.items():
    print(f"\n== {k} (Basis {v['basis']}) ==")
    for a,e in sorted(v["arme"].items(), key=lambda x:-x[1]["genauigkeit"]):
        d = f" {e.get('delta_pp',0):+6.1f}pp p={e.get('p','—')}" if "delta_pp" in e else ""
        fs = f" fmtschaden={e['formatschaden_pp']}pp" if "formatschaden_pp" in e else ""
        print(f"  {a:18s} {e['genauigkeit']*100:5.1f}% n={e['n']:3d} tok={e['tokens']:6.0f}{d}{fs}")
