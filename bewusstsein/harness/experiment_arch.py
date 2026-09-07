"""Treiber fuer Mehrfachaufruf-Architekturen. Speichert die ganze Spur je Aufgabe."""
import json, os, sys, argparse, collections, time
from concurrent.futures import ThreadPoolExecutor, as_completed
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import runner, bewerten, mehrfach, statistik, experiment


def pfad(outdir, suite, tid, arch, run):
    return os.path.join(outdir, "raw", f"{suite}__{tid}__{arch}__r{run}.json")


def _fehlversuch_beiseite(outdir, p):
    """Legt ein fehlgeschlagenes Artefakt weg, statt es zu ueberschreiben.
    Der Roh-Artefakt-Zwang gilt auch fuer Fehlversuche: sie bleiben nachweisbar."""
    ziel = os.path.join(outdir, "fehlversuche")
    os.makedirs(ziel, exist_ok=True)
    basis = os.path.basename(p)[:-5]
    k = 0
    while os.path.exists(os.path.join(ziel, f"{basis}__v{k}.json")):
        k += 1
    os.rename(p, os.path.join(ziel, f"{basis}__v{k}.json"))


def lauf(outdir, suite, tasks, arch_namen, runs, model, thinking, workers, modus,
         wiederholen=False):
    os.makedirs(os.path.join(outdir, "raw"), exist_ok=True)
    experiment.MODUS["aktiv"] = modus
    jobs = []
    for arch in arch_namen:
        for t in tasks:
            for r in range(runs):
                p = pfad(outdir, suite, t["id"], arch, r)
                if os.path.exists(p):
                    # Ein Artefakt mit ok=false ist kein Messwert, sondern ein
                    # abgebrochener Aufruf. Ohne --wiederholen-fehler blieb er
                    # dauerhaft als "erledigt" liegen und fiel still aus der
                    # Auswertung.
                    if not wiederholen:
                        continue
                    try:
                        if json.load(open(p)).get("ok"):
                            continue
                    except Exception:
                        pass
                    _fehlversuch_beiseite(outdir, p)
                jobs.append((arch, t, r, p))
    print(f"[{suite}] {len(jobs)} Architektur-Laeufe offen", flush=True)
    zaehler = [0]

    def work(item):
        arch, t, r, p = item
        frage = t["frage"] + experiment.suffix_fuer(suite)
        t0 = time.time()
        text, spuren = mehrfach.ARCHITEKTUREN[arch](frage, suite, model, thinking)
        rec = {"suite": suite, "task_id": t["id"], "arch": arch, "run": r,
               "antwort": text,
               "aufrufe": len(spuren),
               "tokens": sum(s[1].get("output_tokens", 0) for s in spuren),
               "ok": all(s[1].get("ok") for s in spuren),
               "spur": [{"rolle": n, "text": s.get("text", "")[:4000],
                         "tok": s.get("output_tokens", 0), "ok": s.get("ok"),
                         "fehler": s.get("error")}
                        for n, s in spuren],
               "wall_s": round(time.time() - t0, 1)}
        tmp = p + ".tmp"
        with open(tmp, "w") as f:
            json.dump(rec, f, ensure_ascii=False)
        os.replace(tmp, p)
        zaehler[0] += 1
        if zaehler[0] % 10 == 0:
            print(f"[{suite}] {zaehler[0]}/{len(jobs)}", flush=True)
        return rec

    with ThreadPoolExecutor(max_workers=workers) as ex:
        futs = [ex.submit(work, it) for it in jobs]
        for fu in as_completed(futs):
            try:
                fu.result()
            except Exception as e:
                print(f"[{suite}] FEHLER: {e}", flush=True)


def sammle(outdir, suite, tasks, arch_namen, runs):
    """-> arch -> {'score','aufrufe','tok','paar','paar_inhalt','detail','fehl'}"""
    fn = bewerten.BEWERTER[suite]
    tmap = {t["id"]: t for t in tasks}
    daten = {}
    for arch in arch_namen:
        rec = {"score": [], "aufrufe": [], "tok": [], "paar": collections.defaultdict(list),
               "detail": [], "paar_inhalt": collections.defaultdict(list), "fehl": 0}
        for t in tasks:
            for r in range(runs):
                p = pfad(outdir, suite, t["id"], arch, r)
                if not os.path.exists(p):
                    rec["fehl"] += 1
                    continue
                d = json.load(open(p))
                if not d.get("ok"):
                    rec["fehl"] += 1
                    continue
                b = fn(d["antwort"], tmap[t["id"]])
                rec["score"].append(b["score"]); rec["aufrufe"].append(d["aufrufe"])
                rec["tok"].append(d["tokens"]); rec["paar"][t["id"]].append(b["score"])
                rec["detail"].append(b)
                if "inhalt_ok" in b:
                    rec["paar_inhalt"][t["id"]].append(b["inhalt_ok"])
        daten[arch] = rec
    return daten


def paar_delta(x, y, schluessel, mindest=10):
    """Gepaarter Bootstrap ueber die Aufgaben, die beide Arme gemessen haben."""
    A, B = [], []
    for tid in x[schluessel]:
        if tid in y[schluessel]:
            k = min(len(x[schluessel][tid]), len(y[schluessel][tid]))
            A += x[schluessel][tid][:k]; B += y[schluessel][tid][:k]
    if len(A) < mindest:
        return None
    return statistik.paired_bootstrap(A, B)


def auswerten(outdir, suite, tasks, arch_namen, runs, basis="A_SC3"):
    daten = sammle(outdir, suite, tasks, arch_namen, runs)

    def delta(x, y, schluessel):
        st = paar_delta(x, y, schluessel)
        if not st:
            return ""
        sig = "*" if st["p"] < 0.05 else " "
        return (f"{st['diff']*100:+6.1f}pp [{st['ci_lo']*100:+5.1f},"
                f"{st['ci_hi']*100:+5.1f}] p={st['p']:.3f}{sig}")

    getrennt = any("inhalt_ok" in d for a in arch_namen for d in daten[a]["detail"])
    print(f"\n{'='*96}\n{suite}  — Mehrfachaufruf-Architekturen\n{'='*96}")
    print(f"{'Architektur':16s} {'Genau.':>7s} {'n':>5s} {'Aufrufe':>8s} {'Tok':>7s} "
          f"{'Genau./Aufruf':>14s}  Δ vs {basis}")
    b = daten.get(basis)
    for arch in arch_namen:
        d = daten[arch]
        if not d["score"]:
            print(f"{arch:16s}  keine Daten"); continue
        acc = sum(d["score"]) / len(d["score"])
        ca = sum(d["aufrufe"]) / len(d["aufrufe"])
        tk = sum(d["tok"]) / len(d["tok"])
        eff = acc / ca * 100
        zus = "" if (not b or arch == basis or not b["score"]) else delta(b, d, "paar")
        print(f"{arch:16s} {acc*100:6.1f}% {len(d['score']):5d} {ca:8.2f} {tk:7.0f} "
              f"{eff:13.1f}%  {zus}")

    if getrennt:
        # Bei formatstrengen Suiten ist "score" die Formattreue. Der Inhalt wird
        # getrennt ausgewiesen; die Differenz ist der reine Stoerungsschaden.
        print(f"\n{'Architektur':16s} {'Format':>7s} {'Inhalt':>7s} {'Schaden':>8s}  Δ Inhalt vs {basis}")
        for arch in arch_namen:
            d = daten[arch]
            det = [x for x in d["detail"] if "inhalt_ok" in x]
            if not det:
                continue
            fo = sum(x["format_ok"] for x in det) / len(det)
            io = sum(x["inhalt_ok"] for x in det) / len(det)
            zus = "" if (not b or arch == basis) else delta(b, d, "paar_inhalt")
            print(f"{arch:16s} {fo*100:6.1f}% {io*100:6.1f}% {(io-fo)*100:7.1f}pp  {zus}")

    fehl = {a: daten[a]["fehl"] for a in arch_namen if daten[a]["fehl"]}
    if fehl:
        print(f"\nNicht verwertbar (fehlend oder abgebrochen): {fehl}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--suiten", required=True)
    ap.add_argument("--arch", default="A_SC3,A_WORKSPACE,A_PRUEFER,A_SELEKTIV")
    ap.add_argument("--runs", type=int, default=3)
    ap.add_argument("--limit", type=int, default=20)
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--model", default=runner.DEFAULT_MODEL)
    ap.add_argument("--denken", default="0")
    ap.add_argument("--modus", default="direkt")
    ap.add_argument("--out", required=True)
    ap.add_argument("--basis", default="A_SC3")
    ap.add_argument("--nur-bericht", action="store_true")
    ap.add_argument("--wiederholen-fehler", action="store_true",
                    help="Artefakte mit ok=false erneut laufen lassen "
                         "(Fehlversuch wandert nach fehlversuche/)")
    a = ap.parse_args()
    th = int(a.denken) if a.denken != "" else None
    archs = a.arch.split(",")
    for sn in a.suiten.split(","):
        tasks = experiment.lade_suite(sn)[:a.limit]
        if not a.nur_bericht:
            lauf(a.out, sn, tasks, archs, a.runs, a.model, th, a.workers, a.modus,
                 wiederholen=a.wiederholen_fehler)
        auswerten(a.out, sn, tasks, archs, a.runs, basis=a.basis)
