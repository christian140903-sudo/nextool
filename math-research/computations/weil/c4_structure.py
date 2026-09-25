#!/usr/bin/env python3
"""Strukturhypothese H-Ξ: Der gerade Grundzustand ξ_λ der Weil-Form auf [−L,L] ist bis auf winzige Fehler
von der Form h(−∂²)Φ (eingeschränkt auf das Fenster), also ξ̂_λ ≈ h(τ²)·Ξ(τ).

Test: In der orthonormierten Kosinusbasis wirkt −∂² auf k_λ = Φ·1 (bis auf Randterme ~Φ(L), Φ′(L)) als
diag(ω_k²). Wir messen den Restwinkel von ξ_λ zu span{b, Ωb, …, Ω^m b}, Ω = diag(ω_k²).
Zusätzlich für den zweiten geraden Eigenvektor φ₂ (Kontrolle: auch „Ξ-artig“?).
"""
import sys, json, pickle
import mpmath as mp
from phi_check import Phi

L = mp.mpf(sys.argv[1]); N = int(sys.argv[2]); dps = int(sys.argv[3]); M = int(sys.argv[4]) if len(sys.argv) > 4 else 6
mp.mp.dps = dps
Be, Bo, om = pickle.load(open(f"cache_L{mp.nstr(L,6)}_N{N}_d{dps}.pkl", "rb"))
Be = mp.matrix(Be)
E, V = mp.eigsy(Be)
order = sorted(range(len(E)), key=lambda i: E[i])
nodes = mp.linspace(0, L, 40)
b = [2 * mp.quad(Phi, nodes) / mp.sqrt(2 * L)] + [2 * mp.quad(lambda x: Phi(x) * mp.cos(om[k] * x), nodes) / mp.sqrt(L)
                                                   for k in range(1, N + 1)]
w2 = [mp.mpf(0)] + [om[k] ** 2 for k in range(1, N + 1)]
# Skalierung für Kondition: Ω/ω_ref
wref = om[N] ** 2 / 4
vecs = [b]
for m in range(1, M + 1):
    vecs.append([vecs[-1][r] * w2[r] / wref for r in range(N + 1)])

def residual_angle2(v, basis):
    # Gram–Schmidt (modifiziert, zweifach) in hoher Präzision
    Q = []
    for u in basis:
        u = list(u)
        for _ in range(2):
            for q in Q:
                c = mp.fsum(u[r] * q[r] for r in range(len(u)))
                u = [u[r] - c * q[r] for r in range(len(u))]
        n = mp.sqrt(mp.fsum(x * x for x in u))
        Q.append([x / n for x in u])
    nv2 = mp.fsum(x * x for x in v)
    proj2 = mp.fsum(mp.fsum(v[r] * q[r] for r in range(len(v))) ** 2 for q in Q)
    return (nv2 - proj2) / nv2

out = {"L": mp.nstr(L, 8), "N": N, "dps": dps, "Phi(L)": mp.nstr(Phi(L), 4)}
for label, idx in [("ground_state", order[0]), ("second_even", order[1])]:
    v = [V[r, idx] for r in range(N + 1)]
    out[label] = {f"m={m}": mp.nstr(residual_angle2(v, vecs[:m + 1]), 4) for m in range(0, M + 1)}
print(json.dumps(out, indent=1))
