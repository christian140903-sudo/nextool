#!/usr/bin/env python3
"""C-11: (a) Präzisionsunabhängigkeit der kleinsten Eigenwerte von W_{N,L} (L=0.8, N=30; 30/50/80 Stellen);
(b) Gårding-Test: kleinster Eigenwert der auf Frequenzen |k| > K komprimierten Form wächst mit K (B2/Korollar AS(c))."""
import json, pickle
import mpmath as mp
from weil_lab import WeilWindow

out = {"precision": {}, "garding_even_L0.8_N50": {}}
for dps in (30, 50, 80):
    W = WeilWindow(mp.mpf("0.8"), 30, dps)
    Be, Bo, _, _ = W.blocks()
    ee = sorted(mp.eigsy(Be)[0]); eo = sorted(mp.eigsy(Bo)[0])
    out["precision"][f"dps={dps}"] = {"even": [mp.nstr(x, 12) for x in ee[:3]], "odd": [mp.nstr(x, 12) for x in eo[:2]]}
mp.mp.dps = 50
Be, Bo, om = pickle.load(open("cache_L0.8_N50_d50.pkl", "rb"))
Be = mp.matrix(Be)
n = Be.rows
for K in (0, 2, 5, 10, 20, 30, 40):
    idx = list(range(K + 1, n))
    sub = mp.matrix(len(idx), len(idx))
    for a, i in enumerate(idx):
        for b, j in enumerate(idx):
            sub[a, b] = Be[i, j]
    ev = min(mp.eigsy(sub)[0])
    out["garding_even_L0.8_N50"][f"K={K}"] = {"min_eig": mp.nstr(ev, 6),
                                             "(1/2pi)log(omega_K/2pi)": mp.nstr(mp.log(max(om[K + 1], 1) / (2 * mp.pi)) / (2 * mp.pi), 4)}
print(json.dumps(out, indent=1))
