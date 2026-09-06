"""Auswertung mit Confound-Kontrolle: Token-Paritaet, Formattreue, Bootstrap."""
import json, os, sys, glob, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bewerten, statistik, runner


def lade(outdir, suite, arm, tid, run):
    p = runner.artifact_path(outdir, suite, tid, arm, run)
    if not os.path.exists(p):
        return None
    try:
        with open(p) as f:
            return json.load(f)
    except Exception:
        return None


def sammle(outdir, suite, tasks, arme, runs):
    """-> arm -> {'score':[], 'tok':[], 'paar':{tid:[scores]}}"""
    fn = bewerten.BEWERTER[suite]
    tmap = {t["id"]: t for t in tasks}
    out = {}
    for arm in arme:
        rec = {"score": [], "tok": [], "paar": collections.defaultdict(list),
               "detail": [], "fehler": 0}
        for t in tasks:
            for r in range(runs):
                if arm == "SC3":
                    rs = [lade(outdir, suite, f"SC3_k{k}", t["id"], r) for k in range(3)]
                    rs = [x for x in rs if x and x.get("ok")]
                    if len(rs) < 2:
                        rec["fehler"] += 1; continue
                    ks = []
                    for x in rs:
                        zs = bewerten.alle_zahlen(x["response"] or "")
                        ks.append(str(zs[-1]) if zs else (x["response"] or "").strip())
                    best = collections.Counter([k for k in ks if k]).most_common(1)
                    text = rs[0]["response"]
                    if best:
                        for x, k in zip(rs, ks):
                            if k == best[0][0]:
                                text = x["response"]; break
                    tok = sum(x.get("output_tokens", 0) for x in rs)
                else:
                    x = lade(outdir, suite, arm, t["id"], r)
                    if not x or not x.get("ok"):
                        rec["fehler"] += 1; continue
                    text = x["response"]; tok = x.get("output_tokens", 0)
                d = fn(text, tmap[t["id"]])
                rec["score"].append(d["score"]); rec["tok"].append(tok)
                rec["paar"][t["id"]].append(d["score"]); rec["detail"].append(d)
        out[arm] = rec
    return out


def tabelle(suite, daten, arme, basis="N"):
    print(f"\n{'='*92}\n{suite}\n{'='*92}")
    print(f"{'Arm':16s} {'Genau.':>7s} {'n':>5s} {'Tok':>7s} {'Δ vs '+basis:>12s} "
          f"{'95%-KI':>18s} {'p':>7s}  Hinweis")
    b = daten.get(basis)
    for arm in arme:
        d = daten.get(arm)
        if not d or not d["score"]:
            print(f"{arm:16s}  keine Daten"); continue
        acc = sum(d["score"]) / len(d["score"]) * 100
        tok = sum(d["tok"]) / len(d["tok"]) if d["tok"] else 0
        extra = ""
        if suite == "stoerung":
            fo = [x["format_ok"] for x in d["detail"]]; io = [x["inhalt_ok"] for x in d["detail"]]
            extra = f"inhalt {sum(io)/len(io)*100:.1f}% / Formatschaden {(sum(io)-sum(fo))/len(io)*100:.1f}pp"
        if arm == basis or not b:
            print(f"{arm:16s} {acc:6.1f}% {len(d['score']):5d} {tok:7.0f} {'—':>12s} "
                  f"{'':>18s} {'':>7s}  {extra}")
            continue
        A, B = [], []
        for tid in b["paar"]:
            if tid in d["paar"]:
                k = min(len(b["paar"][tid]), len(d["paar"][tid]))
                A += b["paar"][tid][:k]; B += d["paar"][tid][:k]
        if len(A) < 10:
            print(f"{arm:16s} {acc:6.1f}% {len(d['score']):5d} {tok:7.0f}  zu wenig Paare"); continue
        st = statistik.paired_bootstrap(A, B)
        sig = "*" if st["p"] < 0.05 else " "
        print(f"{arm:16s} {acc:6.1f}% {len(d['score']):5d} {tok:7.0f} {st['diff']*100:+11.1f}pp "
              f"[{st['ci_lo']*100:+6.1f},{st['ci_hi']*100:+6.1f}] {st['p']:6.3f}{sig} {extra}")
