"""Erzeugt den Gesamtbericht aus allen vorhandenen Artefakten."""
import sys, os, json, glob
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import analyse, experiment, statistik

def tab(outdir, suite, arme, runs, basis, limit=None, titel=None):
    try:
        tasks = experiment.lade_suite(suite)
    except Exception:
        return None
    if limit: tasks = tasks[:limit]
    d = analyse.sammle(outdir, suite, tasks, arme, runs)
    vorhanden = [a for a in arme if d.get(a, {}).get("score")]
    if not vorhanden: return None
    analyse.tabelle(titel or suite, d, vorhanden, basis=basis)
    return d

def zeile(d, a):
    s = d.get(a, {}).get("score", [])
    if not s: return None
    return (sum(s)/len(s), len(s), sum(d[a]["tok"])/len(d[a]["tok"]))

def vergleich(d, a, b):
    """gepaarter Vergleich a->b"""
    pa, pb = d.get(a, {}).get("paar", {}), d.get(b, {}).get("paar", {})
    A, B = [], []
    for tid in pa:
        if tid in pb:
            k = min(len(pa[tid]), len(pb[tid]))
            A += pa[tid][:k]; B += pb[tid][:k]
    if len(A) < 10: return None
    return statistik.paired_bootstrap(A, B)

if __name__ == "__main__":
    OUT = "bewusstsein/ergebnisse/runde1_sofort"
    ALLE = ["N","M","P","NUR_FREI","NUR_UNTERDRUECKT","F","F_OFFEN",
            "V1_FAKTOREN","V1_OFFEN","V2_WORKSPACE","V2_OFFEN","V3_SELBST","V3_OFFEN",
            "V4_VORHERSAGE","V4_OFFEN","V5_MONITOR","V5_OFFEN",
            "V5_NUR_ZUTEILUNG","V5_NUR_MONITOR","V5_MINIMAL","SC3"]
    for suite, lim in [("kette20", 70), ("plan", 30), ("stoerung", 30)]:
        tab(OUT, suite, ALLE, 3, "P", limit=lim,
            titel=f"{suite} — Regime sofort — Basis: laengen-gematchter Placebo")
