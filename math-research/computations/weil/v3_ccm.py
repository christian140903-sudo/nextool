#!/usr/bin/env python3
"""V3: Reproduktion Connes–Consani–Moscovici — Nullstellen von ξ̂_λ (Fouriertransformierte des geraden
Grundzustands der Weil-Form auf [−L,L], L = ½ log 13, d. h. Primzahlen ≤ 13) vs. Zetanullstellen."""
import sys, time, json
import mpmath as mp
from flint import acb, ctx
from weil_lab import WeilWindow, smallest

N = int(sys.argv[1]) if len(sys.argv) > 1 else 60
dps = int(sys.argv[2]) if len(sys.argv) > 2 else 120
t = time.time()
L = mp.log(13) / 2
W = WeilWindow(L, N, dps)
Be, Bo, even, odd = W.blocks()
ee, ve = smallest(Be, 3)
eo, _ = smallest(Bo, 2)
v = ve[0]
# Koeffizienten c_j von ξ_λ in der e_j-Basis
c = [mp.mpc(0)] * (2 * N + 1)
for r, vec in enumerate(even):
    for a, cr in vec.items():
        c[a] += v[r] * cr
def xihat(z):
    return mp.fsum(c[a] * 2 * mp.sin((W.om[k] + z) * W.L) / (W.om[k] + z) if W.om[k] + z != 0 else c[a] * 2 * W.L
                   for a, k in enumerate(W.idx))
ctx.prec = 400
zeros = [mp.mpf(acb.zeta_zero(k).imag.str(130, radius=False)) for k in range(1, 26)]
res = []
for g in zeros:
    try:
        r = mp.findroot(lambda z: mp.re(xihat(z)), g)
        res.append((mp.nstr(g, 20), mp.nstr(abs(r - g), 5)))
    except Exception as e:
        res.append((mp.nstr(g, 20), "kein Konvergieren"))
out = {"L": mp.nstr(L, 20), "N": N, "dps": dps, "seconds": round(time.time() - t, 1),
       "even_eigs": [mp.nstr(x, 10) for x in ee], "odd_eigs": [mp.nstr(x, 10) for x in eo],
       "zero_errors": res}
print(json.dumps(out, indent=1))
