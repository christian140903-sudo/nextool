"""Statistik: gepaarter Bootstrap, Effektgroessen, Brier. Ohne externe Abhaengigkeiten."""
import random, math


def _mean(xs):
    return sum(xs) / len(xs) if xs else 0.0


def paired_bootstrap(a, b, iters=10000, seed=12345):
    """a, b: gleich lange Listen gepaarter Scores (gleiche Aufgabe, zwei Arme).
    Gibt Differenz b-a mit 95%-KI und p (zweiseitig, Nullhypothese diff=0)."""
    assert len(a) == len(b) and len(a) > 0
    rng = random.Random(seed)
    n = len(a)
    diffs = [b[i] - a[i] for i in range(n)]
    obs = _mean(diffs)
    boots = []
    for _ in range(iters):
        s = 0.0
        for _ in range(n):
            s += diffs[rng.randrange(n)]
        boots.append(s / n)
    boots.sort()
    lo = boots[int(0.025 * iters)]
    hi = boots[int(0.975 * iters)]
    # p-Wert: Anteil der Bootstrap-Verteilung auf der anderen Seite von 0
    if obs >= 0:
        p = 2.0 * sum(1 for x in boots if x <= 0) / iters
    else:
        p = 2.0 * sum(1 for x in boots if x >= 0) / iters
    p = min(1.0, p)
    sd = math.sqrt(sum((d - obs) ** 2 for d in diffs) / (n - 1)) if n > 1 else 0.0
    return {"diff": obs, "ci_lo": lo, "ci_hi": hi, "p": p, "n": n,
            "cohen_dz": (obs / sd) if sd > 0 else 0.0}


def brier(preds):
    """preds: Liste (konfidenz 0..1, korrekt 0/1)."""
    if not preds:
        return None
    return sum((c - o) ** 2 for c, o in preds) / len(preds)


def ece(preds, bins=10):
    """Expected Calibration Error."""
    if not preds:
        return None
    buckets = [[] for _ in range(bins)]
    for c, o in preds:
        idx = min(bins - 1, int(c * bins))
        buckets[idx].append((c, o))
    n = len(preds)
    tot = 0.0
    for b in buckets:
        if not b:
            continue
        conf = _mean([c for c, _ in b])
        acc = _mean([o for _, o in b])
        tot += (len(b) / n) * abs(conf - acc)
    return tot


def auc(scores, labels):
    """ROC-AUC (Rangbasiert). labels: 1 = positives Ereignis (z.B. Fehler)."""
    pairs = sorted(zip(scores, labels))
    pos = sum(labels); neg = len(labels) - pos
    if pos == 0 or neg == 0:
        return None
    # Raenge mit Bindungsmittelung
    ranks = {}
    i = 0
    r = 1
    vals = [s for s, _ in pairs]
    while i < len(pairs):
        j = i
        while j + 1 < len(pairs) and vals[j + 1] == vals[i]:
            j += 1
        avg = (r + (r + (j - i))) / 2.0
        for k in range(i, j + 1):
            ranks[k] = avg
        r += (j - i + 1)
        i = j + 1
    s = sum(ranks[k] for k, (_, l) in enumerate(pairs) if l == 1)
    return (s - pos * (pos + 1) / 2.0) / (pos * neg)


def summarize(name, a_scores, b_scores):
    st = paired_bootstrap(a_scores, b_scores)
    return (f"{name}: {_mean(a_scores)*100:.1f}% -> {_mean(b_scores)*100:.1f}%  "
            f"Δ={st['diff']*100:+.1f}pp  KI[{st['ci_lo']*100:+.1f},{st['ci_hi']*100:+.1f}]  "
            f"p={st['p']:.3f}  dz={st['cohen_dz']:.2f}  n={st['n']}")
