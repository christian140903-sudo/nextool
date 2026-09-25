#!/usr/bin/env python3
"""Vermutung K-Ξ (Koerzitivität modulo Riemanns Radikal): Ist die Weil-Form auf dem orthogonalen
Komplement von D_m = span{(−∂²)^j Φ|_[−L,L] : j ≤ m} (gerader Sektor, Galerkin-Raum E_N) gleichmäßig
positiv, β_m(L) := min_{v ⊥ D_m} Q(v)/‖v‖² ≥ β > 0 — oder kollabiert β_m(L) wie die Eigenwerte?

Ausgabe je (L, m): β_m(L), dazu die geraden Eigenwerte (Anzahl unter 1e−2) als Vergleich.
Evidenzstatus: NUMERICAL.
"""
import sys, json, pickle
import mpmath as mp
from phi_check import Phi

L = mp.mpf(sys.argv[1]); N = int(sys.argv[2]); dps = int(sys.argv[3]); M = int(sys.argv[4]) if len(sys.argv) > 4 else 12
mp.mp.dps = dps
Be, Bo, om = pickle.load(open(f"cache_L{mp.nstr(L,6)}_N{N}_d{dps}.pkl", "rb"))
Be = mp.matrix(Be); n = N + 1
nodes = mp.linspace(0, L, 40)
b = [2 * mp.quad(Phi, nodes) / mp.sqrt(2 * L)] + [2 * mp.quad(lambda x: Phi(x) * mp.cos(om[k] * x), nodes) / mp.sqrt(L)
                                                   for k in range(1, N + 1)]
w2 = [mp.mpf(0)] + [om[k] ** 2 for k in range(1, N + 1)]
wref = om[N] ** 2 / 4
D = [b]
for m in range(1, M + 1):
    D.append([D[-1][r] * w2[r] / wref for r in range(n)])

def orthonormal_complement(vectors):
    """Orthonormalbasis von span(vectors) (Q) und Komplement (C) in R^n, per zweifachem Gram–Schmidt."""
    Q = []
    for u in vectors:
        u = list(u)
        for _ in range(2):
            for q in Q:
                c = mp.fsum(u[r] * q[r] for r in range(n)); u = [u[r] - c * q[r] for r in range(n)]
        nu = mp.sqrt(mp.fsum(x * x for x in u))
        if nu > mp.mpf(10) ** (-dps // 2):
            Q.append([x / nu for x in u])
    C = []
    for i in range(n):
        u = [mp.mpf(1) if r == i else mp.mpf(0) for r in range(n)]
        for _ in range(2):
            for q in Q + C:
                c = mp.fsum(u[r] * q[r] for r in range(n)); u = [u[r] - c * q[r] for r in range(n)]
        nu = mp.sqrt(mp.fsum(x * x for x in u))
        if nu > mp.mpf("1e-8"):
            C.append([x / nu for x in u])
        if len(Q) + len(C) == n:
            break
    return Q, C

E = sorted(mp.eigsy(Be)[0])
out = {"L": mp.nstr(L, 8), "N": N, "Phi(L)": mp.nstr(Phi(L), 4),
       "even_eigs_first8": [mp.nstr(x, 3) for x in E[:8]],
       "count_even_eigs_below_1e-2": sum(1 for x in E if x < mp.mpf("0.01")), "beta_m": {}}
for m in range(0, M + 1):
    Q, C = orthonormal_complement(D[:m + 1])
    Cm = mp.matrix(C).T            # n × k
    Bc = Cm.T * Be * Cm
    ev = sorted(mp.eigsy(Bc)[0])
    out["beta_m"][f"m={m}"] = mp.nstr(ev[0], 4)
    Qm = mp.matrix(Q).T
    tau = sorted(mp.eigsy(Qm.T * Be * Qm)[0])
    out.setdefault("tau_m_max_on_Dm", {})[f"m={m}"] = mp.nstr(tau[-1], 4)
print(json.dumps(out, indent=1))
