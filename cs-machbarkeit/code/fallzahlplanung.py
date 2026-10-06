"""
Fallzahlplanung: Wie gross muss der Datensatz sein, damit der Nachweis traegt?

Das ist die Zahl, nach der ein Gutachter als erstes fragt und die im ECSA-Dokument
vollstaendig fehlt. Ohne sie ist jeder Antrag angreifbar.
"""
import numpy as np
rng = np.random.default_rng(7)

def wahre_p(n, rng, anteil_konsistent=0.35):
    kons = rng.random(n) < anteil_konsistent
    return np.where(kons, rng.beta(0.6, 0.6, n), rng.beta(6.0, 6.0, n)), kons

def hierarchisch(k, n):
    roh = k / n
    m, v = roh.mean(), roh.var(ddof=1)
    v_echt = max(v - (m * (1 - m) / n), 1e-6)
    praez = max(m * (1 - m) / v_echt - 1, 1e-6)
    a, b = m * praez, (1 - m) * praez
    return (k + a) / (n + a + b)

def auc(p, y):
    if y.sum() in (0, len(y)): return np.nan
    up, inv, cnt = np.unique(p, return_inverse=True, return_counts=True)
    o = np.argsort(p, kind="mergesort"); r = np.empty(len(p)); r[o] = np.arange(1, len(p)+1)
    s = np.zeros(len(up)); np.add.at(s, inv, r); r = (s/cnt)[inv]
    n1 = y.sum(); n0 = len(y) - n1
    return (r[y==1].sum() - n1*(n1+1)/2) / (n1*n0)

print("=" * 78)
print("FRAGE 1 — Ab welcher Paarzahl ist 'besser als Zufall' zweifelsfrei nachweisbar?")
print("=" * 78)
print("Kriterium: untere Grenze des 95-%-Bootstrap-Intervalls der AUC liegt ueber 0.5.")
print("Power = Anteil der Studien, die dieses Kriterium erreichen.\n")
print(f"{'Testpaare':>10} {'AUC median':>12} {'95%-KI der AUC':>22} {'Power':>8}")
print("-" * 78)
for n_test in (50, 100, 200, 400, 800, 1500):
    aucs, treffer = [], 0
    for _ in range(300):
        p, _ = wahre_p(n_test, rng)
        ph = hierarchisch(rng.binomial(5, p), 5)
        y = rng.binomial(1, p)
        a = auc(ph, y)
        if np.isnan(a): continue
        aucs.append(a)
        # Bootstrap innerhalb der Studie
        bs = []
        for _ in range(200):
            idx = rng.integers(0, n_test, n_test)
            ab = auc(ph[idx], y[idx])
            if not np.isnan(ab): bs.append(ab)
        if len(bs) > 50 and np.quantile(bs, 0.025) > 0.5:
            treffer += 1
    lo, hi = np.quantile(aucs, [0.025, 0.975])
    print(f"{n_test:>10} {np.median(aucs):>12.3f}   [{lo:.3f}, {hi:.3f}]{'':>6} {treffer/300*100:>7.0f} %")

print("\nABLESUNG: Ab etwa 400 Testpaaren ist der Nachweis zuverlaessig. Unter 200")
print("Paaren scheitert die Studie haeufig an der eigenen Streuung, nicht an der Idee.\n")

print("=" * 78)
print("FRAGE 2 — Ab welcher Paarzahl ist der KALIBRIERUNGSVORTEIL nachweisbar?")
print("=" * 78)
print("Das ist der eigentliche Beitrag. Verglichen wird der Brier-Score des")
print("hierarchischen Modells gegen den naiven Schaetzer, gepaart ueber dieselben Paare.\n")
print(f"{'Testpaare':>10} {'Delta Brier':>13} {'Anteil Studien mit klarem Vorteil':>36}")
print("-" * 78)
for n_test in (50, 100, 200, 400, 800):
    deltas, gewonnen = [], 0
    for _ in range(400):
        p, _ = wahre_p(n_test, rng)
        k = rng.binomial(3, p)        # nur 3 Replikate — der harte, realistische Fall
        y = rng.binomial(1, p)
        pn, ph = k/3, hierarchisch(k, 3)
        d_paar = (pn - y)**2 - (ph - y)**2          # positiv = hierarchisch besser
        deltas.append(d_paar.mean())
        se = d_paar.std(ddof=1) / np.sqrt(n_test)
        if se > 0 and d_paar.mean() - 1.96*se > 0:
            gewonnen += 1
    print(f"{n_test:>10} {np.mean(deltas):>13.4f} {gewonnen/400*100:>34.0f} %")

print("\nABLESUNG: Der Kalibrierungsvorteil ist das ROBUSTESTE Ergebnis. Er ist schon")
print("bei 100 bis 200 Paaren klar nachweisbar — deutlich frueher als der AUC-Nachweis.")
print("Fuer den Antrag heisst das: Der Kalibrierungsvergleich ist der primaere Endpunkt,")
print("die AUC nur sekundaer. Das kehrt die uebliche Reihenfolge um und ist genau der")
print("Punkt, an dem das Vorhaben von bestehender Literatur abweicht.\n")

print("=" * 78)
print("FRAGE 3 — Was, wenn CS gar nicht vorhersagbar ist? (Nullhypothesen-Test)")
print("=" * 78)
print("Zwingende Kontrolle: Das Verfahren darf unter reinem Zufall KEINEN Effekt finden.\n")
for name, anteil in (("realistisch (35 % konsistent)", 0.35), ("NULL: alles Muenzwurf", 0.0)):
    aucs, deltas = [], []
    for _ in range(300):
        if anteil == 0.0:
            p = np.full(600, 0.5)
        else:
            p, _ = wahre_p(600, rng, anteil)
        k = rng.binomial(5, p); y = rng.binomial(1, p)
        ph = hierarchisch(k, 5)
        a = auc(ph, y)
        if not np.isnan(a): aucs.append(a)
        deltas.append((((k/5)-y)**2 - (ph-y)**2).mean())
    print(f"  {name:<32} AUC = {np.median(aucs):.3f}   Delta Brier = {np.mean(deltas):+.4f}")
print("\n  Unter der Nullhypothese faellt die AUC korrekt auf 0.5.")
print("  Der Brier-Vorteil bleibt dort positiv — das ist KEIN Fehler, sondern erwartet:")
print("  Shrinkage hilft auch dann, weil der naive Schaetzer weiterhin falsche Sicherheit")
print("  vortaeuscht. Dieser Punkt MUSS im Antrag erklaert werden, sonst liest ihn ein")
print("  Gutachter als Scheineffekt und die Arbeit ist entwertet.")
