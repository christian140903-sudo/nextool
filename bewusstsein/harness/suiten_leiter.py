"""Schwierigkeitsleiter: erzeugt dieselben Aufgabentypen in mehreren Haerten,
damit das Messinstrument auf den 40-70%-Bereich kalibriert werden kann."""
import json, os, sys, random, itertools
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import suiten_hart as SH

OUT = "/home/user/nextool/bewusstsein/suiten"


def kette(n, schritte, seed):
    SH.R = random.Random(seed)
    ts = SH.gen_kette(n=n, schritte=schritte)
    for t in ts:
        t["id"] = f"k{schritte}_" + t["id"].split("_")[1]
    return ts


def plan(n, k, seed):
    SH.R = random.Random(seed)
    ts = SH.gen_plan(n=n, k=k)
    for t in ts:
        t["id"] = f"p{k}_" + t["id"].split("_")[1]
    return ts


def zaehl(n, laenge, seed):
    SH.R = random.Random(seed)
    ts = SH.gen_zaehl(n=n, laenge=laenge)
    for t in ts:
        t["id"] = f"z{laenge}_" + t["id"].split("_")[1]
    return ts


if __name__ == "__main__":
    specs = [
        ("kette20", lambda: kette(12, 20, 91)),
        ("kette32", lambda: kette(12, 32, 92)),
        ("plan7",   lambda: plan(12, 7, 93)),
        ("zaehl60", lambda: zaehl(12, 60, 94)),
        ("zaehl90", lambda: zaehl(12, 90, 95)),
    ]
    for name, fn in specs:
        ts = fn()
        with open(os.path.join(OUT, f"{name}.json"), "w") as f:
            json.dump(ts, f, ensure_ascii=False, indent=1)
        print(f"{name}: {len(ts)}")
