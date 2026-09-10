"""Auswertung M1: Ist Ueberraschung ein Fehlersignal?

Liest die Artefakte von A_UEBERRASCHUNG und zerlegt die Genauigkeit nach dem
Schaltentscheid (ueberrascht=0/1). Vorregistrierte Schwellen stehen in
ordnung/soul10/ENTSCHEIDUNG.md §4 (M1):
  bestaetigt: Genauigkeit >= A_SC3 + 10 pp bei <= 2,6 Aufrufen UND Genauigkeit
              im Zweig "nicht ueberrascht" >= 70 %
  widerlegt : Genauigkeit "nicht ueberrascht" <= 60 % ODER Ueberraschungsrate > 85 %
"""
import glob, json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bewerten, experiment, statistik

OUT = sys.argv[1] if len(sys.argv) > 1 else "/home/user/nextool/bewusstsein/ergebnisse/m1_ueberraschung"
SUITE = "kette20"


def lade(arch):
    recs = []
    for p in sorted(glob.glob(os.path.join(OUT, "raw", f"{SUITE}__*__{arch}__r*.json"))):
        d = json.load(open(p))
        if d.get("ok"):
            recs.append(d)
    return recs


def main():
    tasks = {t["id"]: t for t in experiment.lade_suite(SUITE)}
    fn = bewerten.BEWERTER[SUITE]
    ue = lade("A_UEBERRASCHUNG")
    zweige = {0: [], 1: []}
    aufrufe = []
    keine_vorhersage = 0
    for d in ue:
        sch = next((s for s in d["spur"] if s["rolle"] == "schalter"), None)
        m = re.search(r"ueberrascht=(\d)", sch["text"] if sch else "")
        flag = int(m.group(1)) if m else 1
        if sch and "bereich=None" in sch["text"]:
            keine_vorhersage += 1
        score = fn(d["antwort"], tasks[d["task_id"]])["score"]
        zweige[flag].append(score)
        aufrufe.append(d["aufrufe"])
    n = len(ue)
    if not n:
        print("keine Daten"); return
    rate = len(zweige[1]) / n
    acc = (sum(zweige[0]) + sum(zweige[1])) / n
    print(f"A_UEBERRASCHUNG  n={n}  Genauigkeit={acc*100:.1f}%  Aufrufe={sum(aufrufe)/n:.2f}")
    print(f"  Ueberraschungsrate = {rate*100:.1f}%   (ohne auswertbare Vorhersage: {keine_vorhersage})")
    for flag, name in ((0, "nicht ueberrascht -> Loesung uebernommen"), (1, "ueberrascht -> Pruefer gerufen")):
        z = zweige[flag]
        if z:
            print(f"  {name:42s} n={len(z):3d}  richtig={sum(z)/len(z)*100:5.1f}%")
    # Vergleich mit den frisch gemessenen Gegnern
    for arch in ("A_PRUEFER", "A_SC3"):
        r = lade(arch)
        if r:
            s = [fn(d["antwort"], tasks[d["task_id"]])["score"] for d in r]
            print(f"{arch:16s} n={len(r)}  Genauigkeit={sum(s)/len(s)*100:.1f}%  Aufrufe={sum(d['aufrufe'] for d in r)/len(r):.2f}")
    # Urteil nach Vorregistrierung
    sc3 = lade("A_SC3")
    if sc3 and zweige[0]:
        acc_sc3 = sum(fn(d["antwort"], tasks[d["task_id"]])["score"] for d in sc3) / len(sc3)
        acc_nu = sum(zweige[0]) / len(zweige[0])
        mittel_aufrufe = sum(aufrufe) / n
        best = acc >= acc_sc3 + 0.10 and mittel_aufrufe <= 2.6 and acc_nu >= 0.70
        wid = acc_nu <= 0.60 or rate > 0.85
        print(f"\nVorregistrierung M1: bestaetigt={best}  widerlegt={wid}  "
              f"(Δ vs SC3 {(acc-acc_sc3)*100:+.1f} pp, Aufrufe {mittel_aufrufe:.2f}, nicht-ueberrascht {acc_nu*100:.1f} %, Rate {rate*100:.1f} %)")
    # Signalguete: trennt Ueberraschung richtige von falschen Loesungen? (Loesung vor Pruefung bewerten)
    tp = fp = tn = fn_ = 0
    for d in ue:
        loes = next((s for s in d["spur"] if s["rolle"] == "loesung"), None)
        sch = next((s for s in d["spur"] if s["rolle"] == "schalter"), None)
        if not loes or not sch:
            continue
        richtig = fn(loes["text"], tasks[d["task_id"]])["score"] == 1
        ueber = "ueberrascht=1" in sch["text"]
        if ueber and not richtig: tp += 1
        elif ueber and richtig: fp += 1
        elif not ueber and richtig: tn += 1
        else: fn_ += 1
    if tp + fp + tn + fn_:
        sens = tp / (tp + fn_) if tp + fn_ else float("nan")
        spez = tn / (tn + fp) if tn + fp else float("nan")
        print(f"Signalguete der Ueberraschung gegen die Loesung vor Pruefung: "
              f"Fehler erkannt {sens*100:.0f}% (Sensitivitaet), richtige durchgelassen {spez*100:.0f}% (Spezifitaet); "
              f"tp={tp} fp={fp} tn={tn} fn={fn_}")


if __name__ == "__main__":
    main()
