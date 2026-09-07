"""Treiber fuer das Delegations-Experiment."""
import json, os, sys, argparse, collections, time
from concurrent.futures import ThreadPoolExecutor, as_completed
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import runner, delegation, statistik, suiten_auftrag


def pfad(out, kette, tid, run):
    return os.path.join(out, "raw", f"deleg__{tid}__{kette}__r{run}.json")


def lauf(out, ketten, tasks, runs, model, thinking, workers):
    os.makedirs(os.path.join(out, "raw"), exist_ok=True)
    jobs = [(k, t, r, pfad(out, k, t["id"], r))
            for k in ketten for t in tasks for r in range(runs)
            if not os.path.exists(pfad(out, k, t["id"], r))]
    print(f"[deleg] {len(jobs)} offen", flush=True)
    z = [0]

    def work(item):
        k, t, r, p = item
        t0 = time.time()
        text, spuren = delegation.KETTEN[k](t["frage"], None, model, thinking)
        pr = suiten_auftrag.pruefen(text, t)
        rec = {"kette": k, "task_id": t["id"], "run": r, "antwort": text,
               "pruefung": pr, "aufrufe": len(spuren),
               "tokens": sum(s[1].get("output_tokens", 0) for s in spuren),
               "ok": all(s[1].get("ok") for s in spuren),
               "spur": [{"rolle": n, "text": s.get("text", "")[:3000],
                         "tok": s.get("output_tokens", 0)} for n, s in spuren],
               "wall_s": round(time.time() - t0, 1)}
        tmp = p + ".tmp"
        json.dump(rec, open(tmp, "w"), ensure_ascii=False)
        os.replace(tmp, p)
        z[0] += 1
        if z[0] % 10 == 0:
            print(f"[deleg] {z[0]}/{len(jobs)}", flush=True)
        return rec

    with ThreadPoolExecutor(max_workers=workers) as ex:
        futs = [ex.submit(work, it) for it in jobs]
        for fu in as_completed(futs):
            try:
                fu.result()
            except Exception as e:
                print(f"[deleg] FEHLER {e}", flush=True)


def auswerten(out, ketten, tasks, runs, basis="E1"):
    AUFL = ["zeilen", "spiegel", "begriffe", "verbot", "ziffern", "schluss", "kurz"]
    daten = {}
    for k in ketten:
        rec = {"anteil": [], "alle": [], "tok": [], "aufrufe": [],
               "paar": collections.defaultdict(list),
               "je_auflage": collections.defaultdict(list), "n": 0}
        for t in tasks:
            for r in range(runs):
                p = pfad(out, k, t["id"], r)
                if not os.path.exists(p):
                    continue
                d = json.load(open(p))
                if not d.get("ok"):
                    continue
                pr = d["pruefung"]
                rec["anteil"].append(pr["_anteil"]); rec["alle"].append(pr["_alle"])
                rec["tok"].append(d["tokens"]); rec["aufrufe"].append(d["aufrufe"])
                rec["paar"][t["id"]].append(pr["_alle"]); rec["n"] += 1
                for a in AUFL:
                    rec["je_auflage"][a].append(pr.get(a, 0))
        daten[k] = rec

    print(f"\n{'='*96}\nDELEGATION — was kostet eine Ebene?  (7 pruefbare Auflagen je Auftrag)\n{'='*96}")
    print(f"{'Kette':14s} {'Auflagen erf.':>13s} {'alle 7':>8s} {'n':>5s} {'Aufrufe':>8s} "
          f"{'Tok':>7s}   Δ 'alle 7' vs {basis}")
    b = daten.get(basis)
    for k in ketten:
        d = daten[k]
        if not d["anteil"]:
            print(f"{k:14s}  keine Daten"); continue
        ant = sum(d["anteil"]) / len(d["anteil"]) * 100
        alle = sum(d["alle"]) / len(d["alle"]) * 100
        tok = sum(d["tok"]) / len(d["tok"])
        auf = sum(d["aufrufe"]) / len(d["aufrufe"])
        zus = ""
        if b and k != basis and b["alle"]:
            A, B = [], []
            for tid in b["paar"]:
                if tid in d["paar"]:
                    m = min(len(b["paar"][tid]), len(d["paar"][tid]))
                    A += b["paar"][tid][:m]; B += d["paar"][tid][:m]
            if len(A) >= 10:
                st = statistik.paired_bootstrap(A, B)
                sig = "*" if st["p"] < 0.05 else " "
                zus = (f"{st['diff']*100:+6.1f}pp [{st['ci_lo']*100:+5.1f},"
                       f"{st['ci_hi']*100:+5.1f}] p={st['p']:.3f}{sig}")
        print(f"{k:14s} {ant:12.1f}% {alle:7.1f}% {d['n']:5d} {auf:8.2f} {tok:7.0f}   {zus}")

    print(f"\n  Welche Auflage geht zuerst verloren?")
    print(f"  {'Kette':14s} " + " ".join(f"{a:>9s}" for a in AUFL))
    for k in ketten:
        d = daten[k]
        if not d["je_auflage"]:
            continue
        zeile = " ".join(f"{sum(d['je_auflage'][a])/len(d['je_auflage'][a])*100:8.0f}%"
                         for a in AUFL)
        print(f"  {k:14s} {zeile}")
    return daten


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--ketten", default="E1,E2_FREI,E2_VERTRAG,E3_FREI,E3_VERTRAG,E4_FREI,E4_VERTRAG")
    ap.add_argument("--runs", type=int, default=3)
    ap.add_argument("--limit", type=int, default=24)
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--model", default=runner.DEFAULT_MODEL)
    ap.add_argument("--denken", default="")
    ap.add_argument("--out", required=True)
    ap.add_argument("--nur-bericht", action="store_true")
    a = ap.parse_args()
    tasks = suiten_auftrag.bauen()[:a.limit]
    th = int(a.denken) if a.denken != "" else None
    ks = a.ketten.split(",")
    if not a.nur_bericht:
        lauf(a.out, ks, tasks, a.runs, a.model, th, a.workers)
    auswerten(a.out, ks, tasks, a.runs)
