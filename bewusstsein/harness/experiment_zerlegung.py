"""Treiber: Zerlegung vs. Alleinbearbeitung."""
import json, os, sys, argparse, collections, random, time
from concurrent.futures import ThreadPoolExecutor, as_completed
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import runner, statistik, zerlegung

# (Kennung, Bedingungstext, Zaehlfunktion, haengt von Vorgaenger ab)
BEDINGUNGEN = [
    ("unabhaengig",
     "durch 3 teilbar ist UND groesser als 40",
     lambda xs: sum(1 for x in xs if x % 3 == 0 and x > 40), False),
    ("vorgaenger",
     "gerade ist UND groesser als die unmittelbar davorstehende Zahl "
     "(die allererste Zahl der Gesamtliste zaehlt nie mit)",
     lambda xs: sum(1 for j in range(1, len(xs)) if xs[j] % 2 == 0 and xs[j] > xs[j-1]),
     True),
]


def bauen(n=20, laenge=150, seed=5150):
    R = random.Random(seed)
    tasks = []
    for i in range(n):
        art, text, fn, vorg = BEDINGUNGEN[i % len(BEDINGUNGEN)]
        xs = [R.randint(1, 99) for _ in range(laenge)]
        tasks.append(dict(id=f"zg_{i}", art=art, zahlen=xs, bedingung=text,
                          braucht_vorgaenger=vorg, antwort=fn(xs),
                          frage=(f"Liste: {', '.join(map(str, xs))}\n\n"
                                 f"Wie viele Zahlen in dieser Liste erfuellen: {text}?\n"
                                 f"Gib am Ende NUR die Anzahl als Zahl aus.")))
    return tasks


def pfad(out, verf, tid, run):
    return os.path.join(out, "raw", f"zg__{tid}__{verf}__r{run}.json")


def lauf(out, verfahren, tasks, runs, model, thinking, workers, teile):
    os.makedirs(os.path.join(out, "raw"), exist_ok=True)
    jobs = [(v, t, r, pfad(out, v, t["id"], r))
            for v in verfahren for t in tasks for r in range(runs)
            if not os.path.exists(pfad(out, v, t["id"], r))]
    print(f"[zerlegung] {len(jobs)} offen", flush=True)
    z = [0]

    def work(item):
        v, t, r, p = item
        t0 = time.time()
        fn = zerlegung.VERFAHREN[v]
        kw = {}
        if v != "GANZ":
            kw = dict(teile=teile, braucht_vorgaenger=t["braucht_vorgaenger"])
            # "NAIV" ignoriert bewusst die Randbedingung -> zeigt den stillen Bruch
            if v.endswith("_NAIV"):
                kw["braucht_vorgaenger"] = False
        wert, spuren = fn(t["frage"], t["zahlen"], t["bedingung"], model, thinking, **kw)
        rec = {"verfahren": v, "task_id": t["id"], "art": t["art"], "run": r,
               "ergebnis": wert, "soll": t["antwort"],
               "richtig": 1 if wert == t["antwort"] else 0,
               "abweichung": None if wert is None else abs(wert - t["antwort"]),
               "aufrufe": len(spuren),
               "tokens": sum(s[1].get("output_tokens", 0) for s in spuren),
               "ok": all(s[1].get("ok") for s in spuren),
               "wall_s": round(time.time() - t0, 1)}
        tmp = p + ".tmp"
        json.dump(rec, open(tmp, "w"), ensure_ascii=False)
        os.replace(tmp, p)
        z[0] += 1
        if z[0] % 10 == 0:
            print(f"[zerlegung] {z[0]}/{len(jobs)}", flush=True)
        return rec

    with ThreadPoolExecutor(max_workers=workers) as ex:
        futs = [ex.submit(work, it) for it in jobs]
        for fu in as_completed(futs):
            try:
                fu.result()
            except Exception as e:
                print(f"[zerlegung] FEHLER {e}", flush=True)


def auswerten(out, verfahren, tasks, runs, basis="GANZ"):
    daten = {}
    for v in verfahren:
        rec = {"richtig": [], "tok": [], "aufrufe": [], "abw": [],
               "paar": collections.defaultdict(list),
               "je_art": collections.defaultdict(list)}
        for t in tasks:
            for r in range(runs):
                p = pfad(out, v, t["id"], r)
                if not os.path.exists(p):
                    continue
                d = json.load(open(p))
                if not d.get("ok"):
                    continue
                rec["richtig"].append(d["richtig"]); rec["tok"].append(d["tokens"])
                rec["aufrufe"].append(d["aufrufe"])
                if d["abweichung"] is not None:
                    rec["abw"].append(d["abweichung"])
                rec["paar"][t["id"]].append(d["richtig"])
                rec["je_art"][t["art"]].append(d["richtig"])
        daten[v] = rec

    print(f"\n{'='*98}\nZERLEGUNG — gewinnt Arbeitsteilung, statt nur zu kosten?\n{'='*98}")
    print(f"{'Verfahren':16s} {'richtig':>8s} {'n':>4s} {'Aufr.':>6s} {'Tok':>7s} "
          f"{'mittl.Fehler':>12s}   Δ vs {basis}")
    b = daten.get(basis)
    for v in verfahren:
        d = daten[v]
        if not d["richtig"]:
            print(f"{v:16s}  keine Daten"); continue
        acc = sum(d["richtig"]) / len(d["richtig"]) * 100
        tok = sum(d["tok"]) / len(d["tok"])
        auf = sum(d["aufrufe"]) / len(d["aufrufe"])
        abw = sum(d["abw"]) / len(d["abw"]) if d["abw"] else float("nan")
        zus = ""
        if b and v != basis and b["richtig"]:
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
        print(f"{v:16s} {acc:7.1f}% {len(d['richtig']):4d} {auf:6.2f} {tok:7.0f} "
              f"{abw:11.2f}   {zus}")

    print(f"\n  Nach Bedingungstyp (zerlegbar vs. randabhaengig):")
    arten = sorted({t["art"] for t in tasks})
    print(f"  {'Verfahren':16s} " + " ".join(f"{a:>14s}" for a in arten))
    for v in verfahren:
        d = daten[v]
        if not d["je_art"]:
            continue
        zeile = " ".join(
            f"{sum(d['je_art'][a])/len(d['je_art'][a])*100:13.0f}%" if d["je_art"][a]
            else f"{'—':>14s}" for a in arten)
        print(f"  {v:16s} {zeile}")
    return daten


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--verfahren", default="GANZ,ZERLEGT_CODE,ZERLEGT_MODELL")
    ap.add_argument("--runs", type=int, default=3)
    ap.add_argument("--limit", type=int, default=20)
    ap.add_argument("--laenge", type=int, default=150)
    ap.add_argument("--teile", type=int, default=5)
    ap.add_argument("--workers", type=int, default=5)
    ap.add_argument("--model", default=runner.DEFAULT_MODEL)
    ap.add_argument("--denken", default="0")
    ap.add_argument("--out", required=True)
    ap.add_argument("--nur-bericht", action="store_true")
    a = ap.parse_args()
    tasks = bauen(n=a.limit, laenge=a.laenge)
    th = int(a.denken) if a.denken != "" else None
    vs = a.verfahren.split(",")
    if not a.nur_bericht:
        lauf(a.out, vs, tasks, a.runs, a.model, th, a.workers, a.teile)
    auswerten(a.out, vs, tasks, a.runs)
