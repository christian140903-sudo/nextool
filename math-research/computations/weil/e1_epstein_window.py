#!/usr/bin/env python3
"""WP-2E: Epstein-Weil-Form auf [−L,L]: Eigenwerte (Vorzeichen!), Parität, Einfachheit und H-Ξ-Rest
(Abstand des geraden Grundzustands zu span{Ω^j b_E}, b_E = Koeffizienten von Φ_E)."""
import sys, json, time
import mpmath as mp
from weil_lab import WeilWindow
from models import EpsteinModel
from epstein_phi import PhiE

L = mp.mpf(sys.argv[1]); N = int(sys.argv[2]); dps = int(sys.argv[3]); M = 8
t = time.time()
W = WeilWindow(L, N, dps, EpsteinModel())
Be, Bo, _, _ = W.blocks()
Ee, Ve = mp.eigsy(Be); Eo, _ = mp.eigsy(Bo)
oe = sorted(range(len(Ee)), key=lambda i: Ee[i])
Eo = sorted(Eo)
om = [W.om[k] for k in range(0, N + 1)]
nodes = mp.linspace(0, L, 40)
b = [2 * mp.quad(PhiE, nodes) / mp.sqrt(2 * L)] + [2 * mp.quad(lambda x: PhiE(x) * mp.cos(om[k] * x), nodes) / mp.sqrt(L)
                                                    for k in range(1, N + 1)]
w2 = [mp.mpf(0)] + [om[k] ** 2 for k in range(1, N + 1)]
wref = om[N] ** 2 / 4
vecs = [b]
for m in range(1, M + 1):
    vecs.append([vecs[-1][r] * w2[r] / wref for r in range(N + 1)])
def resid(v, basis):
    Q = []
    for u in basis:
        u = list(u)
        for _ in range(2):
            for q in Q:
                c = mp.fsum(u[r] * q[r] for r in range(len(u))); u = [u[r] - c * q[r] for r in range(len(u))]
        n = mp.sqrt(mp.fsum(x * x for x in u)); Q.append([x / n for x in u])
    nv = mp.fsum(x * x for x in v)
    return (nv - mp.fsum(mp.fsum(v[r] * q[r] for r in range(len(v))) ** 2 for q in Q)) / nv
v0 = [Ve[r, oe[0]] for r in range(N + 1)]
nb = mp.fsum(x * x for x in b)
out = {"model": "epstein", "L": mp.nstr(L, 8), "N": N, "dps": dps,
       "even_eigs": [mp.nstr(Ee[i], 5) for i in oe[:5]], "odd_eigs": [mp.nstr(x, 5) for x in Eo[:4]],
       "ground_state_parity": "even" if Ee[oe[0]] < Eo[0] else "odd",
       "min_eig_negative": bool(min(Ee[oe[0]], Eo[0]) < 0),
       "R(PhiE_window)": mp.nstr((mp.matrix(b).T * Be * mp.matrix(b))[0] / nb, 5),
       "H-Xi_residual_ground_state": {f"m={m}": mp.nstr(resid(v0, vecs[:m + 1]), 4) for m in (0, 1, 2, 4, 8)},
       "seconds": round(time.time() - t, 1)}
print(json.dumps(out, indent=1))
