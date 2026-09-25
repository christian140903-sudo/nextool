#!/usr/bin/env python3
"""WP-2C: Misst die Reduktionskette (R)/(G)/Winkel für k_λ = Φ·1_[−L,L] (Riemanns Φ, Φ̂ = Ξ).

Ausgabe je L: Eigenwerte ε_i (gerade), R(k_λ) = Q(k_λ)/‖k_λ‖², Gewichte w_i = |⟨k_λ, φ_i⟩|²/‖k_λ‖²,
Winkel² = 1 − w_1, Anzahl Eigenwerte unter R(k_λ), Davis–Kahan-Schranke (R−ε_1)/(ε_2−ε_1).
Alles in der N-Galerkin-Näherung (NUMERICAL).
"""
import sys, json, time, pickle, os
import mpmath as mp
from weil_lab import WeilWindow
from phi_check import Phi

L = mp.mpf(sys.argv[1]); N = int(sys.argv[2]); dps = int(sys.argv[3])
tag = f"L{mp.nstr(L,6)}_N{N}_d{dps}"
cache = f"cache_{tag}.pkl"
t = time.time()
if os.path.exists(cache):
    mp.mp.dps = dps
    Be, Bo, om = pickle.load(open(cache, "rb")); Be, Bo = mp.matrix(Be), mp.matrix(Bo)
else:
    W = WeilWindow(L, N, dps)
    Be, Bo, _, _ = W.blocks()
    om = [W.om[k] for k in range(0, N + 1)]
    pickle.dump((Be.tolist(), Bo.tolist(), om), open(cache, "wb"))
E, V = mp.eigsy(Be)
order = sorted(range(len(E)), key=lambda i: E[i])
E = [E[i] for i in order]; V = [V[:, i] for i in order]
Eo, _ = mp.eigsy(Bo); Eo = sorted(Eo)
# Koeffizienten von k_λ in der orthonormierten geraden Basis {1/√(2L), cos(ω_k x)/√L}
nodes = mp.linspace(0, L, 40)
b = [2 * mp.quad(Phi, nodes) / mp.sqrt(2 * L)]
for k in range(1, N + 1):
    b.append(2 * mp.quad(lambda x: Phi(x) * mp.cos(om[k] * x), nodes) / mp.sqrt(L))
b = mp.matrix(b)
nb2 = mp.fsum(x * x for x in b)
Rk = (b.T * Be * b)[0] / nb2
w = [ (mp.fsum(V[i][r] * b[r] for r in range(len(b))))**2 / nb2 for i in range(len(E)) ]
out = {"L": mp.nstr(L, 10), "N": N, "dps": dps, "seconds": round(time.time() - t, 1),
       "even_eigs": [mp.nstr(x, 6) for x in E[:6]], "odd_eigs": [mp.nstr(x, 6) for x in Eo[:5]],
       "R_k": mp.nstr(Rk, 6), "angle2_1_minus_w1": mp.nstr(1 - w[0], 6),
       "weights_w2_to_w6": [mp.nstr(x, 4) for x in w[1:6]],
       "num_eigs_below_R": sum(1 for x in E if x < Rk),
       "davis_kahan_bound": mp.nstr((Rk - E[0]) / (E[1] - E[0]), 6),
       "tail_Phi(L)": mp.nstr(Phi(L), 6)}
print(json.dumps(out, indent=1))
