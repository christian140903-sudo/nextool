"""Experiment-Treiber: baut Jobs, laeuft, bewertet, berichtet."""
import json, os, sys, argparse, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import runner, bewerten, arme, statistik

SUITEN_DIR = "/home/user/nextool/bewusstsein/suiten"

# Antwortformat je Suite (identisch ueber alle Arme -> saubere Manipulation)
SUFFIX = {
    "falle": "\n\nGib am Ende NUR das Endergebnis als Zahl in einer eigenen letzten Zeile aus.",
    "stoerung": "",
    "kalibrierung": ("\n\nAntworte in genau zwei Zeilen:\nANTWORT: <Zahl>\n"
                     "KONFIDENZ: <0-100, wie sicher du dir bist>"),
    "kette": "\n\nGib am Ende NUR den Endwert als Zahl in einer eigenen letzten Zeile aus.",
    "zaehl": "\n\nGib am Ende NUR die Anzahl als Zahl in einer eigenen letzten Zeile aus.",
    "plan": "",
    "kette20": "\n\nGib am Ende NUR den Endwert als Zahl in einer eigenen letzten Zeile aus.",
    "kette32": "\n\nGib am Ende NUR den Endwert als Zahl in einer eigenen letzten Zeile aus.",
    "plan7": "",
    "zaehl60": "\n\nGib am Ende NUR die Anzahl als Zahl in einer eigenen letzten Zeile aus.",
    "zaehl90": "\n\nGib am Ende NUR die Anzahl als Zahl in einer eigenen letzten Zeile aus.",
    "kette60": "\n\nGib am Ende NUR den Endwert als Zahl in einer eigenen letzten Zeile aus.",
    "zaehl150": "\n\nGib am Ende NUR die Anzahl als Zahl in einer eigenen letzten Zeile aus.",
}


DIREKT = {
    "kette": "\n\nAntworte SOFORT mit nur dem Endwert als Zahl. Keine Zwischenschritte, keine Erklaerung, keine Rechnung im Text — nur die Zahl.",
    "kette20": "\n\nAntworte SOFORT mit nur dem Endwert als Zahl. Keine Zwischenschritte, keine Erklaerung, keine Rechnung im Text — nur die Zahl.",
    "kette32": "\n\nAntworte SOFORT mit nur dem Endwert als Zahl. Keine Zwischenschritte, keine Erklaerung, keine Rechnung im Text — nur die Zahl.",
    "zaehl": "\n\nAntworte SOFORT mit nur der Anzahl als Zahl. Keine Zwischenschritte, keine Erklaerung, keine Aufzaehlung — nur die Zahl.",
    "zaehl60": "\n\nAntworte SOFORT mit nur der Anzahl als Zahl. Keine Zwischenschritte, keine Erklaerung, keine Aufzaehlung — nur die Zahl.",
    "zaehl90": "\n\nAntworte SOFORT mit nur der Anzahl als Zahl. Keine Zwischenschritte, keine Erklaerung, keine Aufzaehlung — nur die Zahl.",
    "plan": "\n\nAntworte SOFORT mit nur den Platznummern in einer Zeile. Keine Zwischenschritte, keine Erklaerung.",
    "plan7": "\n\nAntworte SOFORT mit nur den Platznummern in einer Zeile. Keine Zwischenschritte, keine Erklaerung.",
    "falle": "\n\nAntworte SOFORT mit nur dem Endergebnis als Zahl. Keine Zwischenschritte, keine Erklaerung.",
}

MODUS = {"aktiv": "offen"}
THINK = {"budget": None}


def suffix_fuer(suite):
    if MODUS["aktiv"] == "direkt" and suite in DIREKT:
        return DIREKT[suite]
    return SUFFIX.get(suite, "")


def lade_suite(name):
    with open(os.path.join(SUITEN_DIR, f"{name}.json")) as f:
        return json.load(f)


def baue_jobs(suite_name, tasks, arm_namen, runs, model):
    jobs = []
    for arm in arm_namen:
        if arm == "SC3":
            for t in tasks:
                for r in range(runs):
                    for k in range(3):
                        jobs.append(dict(suite=suite_name, task_id=t["id"],
                                         arm=f"SC3_k{k}", run=r,
                                         system=None,
                                         user=t["frage"] + suffix_fuer(suite_name),
                                         model=model, thinking=THINK["budget"], meta={"sc3": True}))
        else:
            sp = arme.ARME[arm]
            for t in tasks:
                for r in range(runs):
                    jobs.append(dict(suite=suite_name, task_id=t["id"], arm=arm, run=r,
                                     system=sp,
                                     user=t["frage"] + suffix_fuer(suite_name),
                                     model=model, thinking=THINK["budget"], meta={}))
    return jobs


def _sc3_mehrheit(texte, suite, task):
    """Mehrheitsentscheid ueber die extrahierten Endantworten."""
    schluessel = []
    for tx in texte:
        if suite == "stoerung":
            schluessel.append((tx or "").strip())
        else:
            zs = bewerten.alle_zahlen(tx or "")
            schluessel.append(str(zs[-1]) if zs else "")
    zaehl = collections.Counter([s for s in schluessel if s != ""])
    if not zaehl:
        return texte[0] if texte else ""
    best, _ = zaehl.most_common(1)[0]
    for tx, s in zip(texte, schluessel):
        if s == best:
            return tx
    return texte[0]


def bewerte_lauf(outdir, suite_name, tasks, arm_namen, runs):
    """Liest Artefakte, bewertet, gibt {arm: {task_id: [score je run]}} zurueck."""
    tmap = {t["id"]: t for t in tasks}
    fn = bewerten.BEWERTER[suite_name]
    erg = {a: collections.defaultdict(list) for a in arm_namen}
    detail = {a: collections.defaultdict(list) for a in arm_namen}
    tokens = {a: [] for a in arm_namen}

    def lies(suite, tid, arm, r):
        p = runner.artifact_path(outdir, suite, tid, arm, r)
        if not os.path.exists(p):
            return None
        with open(p) as f:
            return json.load(f)

    for arm in arm_namen:
        for t in tasks:
            for r in range(runs):
                if arm == "SC3":
                    recs = [lies(suite_name, t["id"], f"SC3_k{k}", r) for k in range(3)]
                    recs = [x for x in recs if x and x.get("ok")]
                    if len(recs) < 2:
                        continue
                    text = _sc3_mehrheit([x["response"] for x in recs], suite_name, t)
                    tokens[arm].append(sum(x.get("output_tokens", 0) for x in recs))
                else:
                    rec = lies(suite_name, t["id"], arm, r)
                    if not rec or not rec.get("ok"):
                        continue
                    text = rec["response"]
                    tokens[arm].append(rec.get("output_tokens", 0))
                d = fn(text, tmap[t["id"]])
                erg[arm][t["id"]].append(d["score"])
                detail[arm][t["id"]].append(d)
    return erg, detail, tokens


def bericht(suite_name, tasks, arm_namen, erg, detail, tokens, basis="N"):
    print(f"\n{'='*78}\nSUITE: {suite_name}   ({len(tasks)} Aufgaben)\n{'='*78}")
    zeilen = []
    for arm in arm_namen:
        alle = [s for tid in erg[arm] for s in erg[arm][tid]]
        if not alle:
            print(f"{arm:14s}  keine Daten"); continue
        mt = sum(tokens[arm]) / len(tokens[arm]) if tokens[arm] else 0
        zusatz = ""
        if suite_name == "stoerung":
            fo = [d["format_ok"] for tid in detail[arm] for d in detail[arm][tid]]
            io = [d["inhalt_ok"] for tid in detail[arm] for d in detail[arm][tid]]
            schaden = (sum(io) - sum(fo)) / len(io) * 100 if io else 0
            zusatz = f"  inhalt={sum(io)/len(io)*100:5.1f}%  FORMATSCHADEN={schaden:5.1f}pp"
        if suite_name == "falle":
            kd = [d["koeder_gefallen"] for tid in detail[arm] for d in detail[arm][tid]]
            zusatz = f"  koeder={sum(kd)/len(kd)*100:5.1f}%"
        if suite_name == "kalibrierung":
            preds = [(d["konfidenz"], d["score"]) for tid in detail[arm]
                     for d in detail[arm][tid] if d.get("konfidenz") is not None]
            b = statistik.brier(preds); e = statistik.ece(preds)
            zusatz = (f"  brier={b:.3f}  ece={e:.3f}  n_konf={len(preds)}"
                      if b is not None else "  keine Konfidenz geparst")
        print(f"{arm:14s}  {sum(alle)/len(alle)*100:5.1f}%  (n={len(alle):4d})  "
              f"tok={mt:6.0f}{zusatz}")
        zeilen.append(arm)

    # gepaarte Vergleiche gegen Basis
    if basis in erg:
        print(f"\n  Gepaarte Vergleiche gegen {basis} (Bootstrap, 95%-KI):")
        ids = sorted(erg[basis].keys())
        for arm in arm_namen:
            if arm == basis:
                continue
            a, b = [], []
            for tid in ids:
                if tid not in erg[arm]:
                    continue
                k = min(len(erg[basis][tid]), len(erg[arm][tid]))
                a += erg[basis][tid][:k]; b += erg[arm][tid][:k]
            if len(a) >= 10:
                print("   " + statistik.summarize(f"{basis}->{arm:14s}", a, b))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--suiten", default="falle,stoerung")
    ap.add_argument("--arme", default="N,M,P,F")
    ap.add_argument("--runs", type=int, default=1)
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--workers", type=int, default=5)
    ap.add_argument("--model", default=runner.DEFAULT_MODEL)
    ap.add_argument("--out", required=True)
    ap.add_argument("--basis", default="N")
    ap.add_argument("--modus", default="offen", choices=["offen","direkt"])
    ap.add_argument("--denken", default="", help="MAX_THINKING_TOKENS (leer=Standard, 0=aus)")
    ap.add_argument("--nur-bericht", action="store_true")
    ap.add_argument("--wiederholen-fehler", action="store_true",
                    help="Artefakte mit ok=false erneut laufen lassen "
                         "(Fehlversuch wandert nach fehlversuche/)")
    a = ap.parse_args()

    MODUS["aktiv"] = a.modus
    THINK["budget"] = int(a.denken) if a.denken != "" else None
    arm_namen = a.arme.split(",")
    os.makedirs(a.out, exist_ok=True)
    for sn in a.suiten.split(","):
        tasks = lade_suite(sn)
        if a.limit:
            tasks = tasks[:a.limit]
        jobs = baue_jobs(sn, tasks, arm_namen, a.runs, a.model)
        if not a.nur_bericht:
            runner.run_jobs(jobs, a.out, workers=a.workers, label=sn,
                            wiederholen=a.wiederholen_fehler)
        erg, detail, tokens = bewerte_lauf(a.out, sn, tasks, arm_namen, a.runs)
        bericht(sn, tasks, arm_namen, erg, detail, tokens, basis=a.basis)


if __name__ == "__main__":
    main()
