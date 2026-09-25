#!/usr/bin/env python3
"""C-12: PROVED-FINITE-Zertifikat für die Weil-Matrix W_{N,L} (Ball-Arithmetik, Arb).

Aufruf: c12_certify_finite.py P Q N     (L = P/Q exakt, z. B. 4 5 20 für L = 0,8)

Rigoros eingeschlossen werden: Polterme (geschlossen), Primterme (exakt endlich, n ≤ e^{2L}), Konstante
ψ(¼) − log π = −γ − π/2 − 3 log 2 − log π, der Schwanz T(2L) als Reihe mit Restschranke, und die 2(N+1)
archimedischen Integrale S(ω), D(ω) mit Arbs rigoroser Integration. Singularitätsfreie Form:
  K(x) sin(ωx)                      = e^{x/2} · ω·sinc(ωx) / (2·shc(x)),               shc(x) = sinh(x)/x
  K(x)(2(2L−x)cos(ωx) − 4L)         = e^{x/2} · (−4Lω·sin(ωx/2)·sinc(ωx/2) − 2cos(ωx)) / (2·shc(x))
(shc hat Nullstellen nur bei x = iπk, k ≠ 0, also Abstand π zum Integrationsweg.)
Zertifizierung: Intervall-LDLᵀ von B − sI. Sind alle Pivots vorzeichensicher, dann ist nach dem
Trägheitssatz von Sylvester die Zahl negativer Pivots = #{Eigenwerte < s}. Das gilt für jede Matrix in der Box,
also insbesondere für die exakte.

Aussage (PROVED-FINITE): Einschluss von λ_min(W_{N,L})/(2L) und „even-simple“ (M1_N) für dieses (N, L).
Nach BT-L folgt daraus NUR Positivität auf E_N(L), nicht auf H_L und schon gar nicht RH.
"""
import sys, json, time
from flint import acb, arb, arb_mat, ctx

ctx.prec = int(sys.argv[4]) if len(sys.argv) > 4 else 240
P, Qd, N = int(sys.argv[1]), int(sys.argv[2]), int(sys.argv[3])
L = arb(P) / Qd
PI = arb.pi()
t0 = time.time()


def omega(k):
    return PI * k / L


def shc(x):
    return (x * 1j).sinc()


def integ(f):
    return acb.integral(lambda x, _: f(x), 0, 2 * L, rel_tol=arb(2) ** -(ctx.prec - 16))


def S(w):
    if w == 0:
        return acb(0)
    return integ(lambda x: (x / 2).exp() * w * (w * x).sinc() / (2 * shc(x)))


def D(w):
    return integ(lambda x: (x / 2).exp() * (-4 * L * w * (w * x / 2).sin() * (w * x / 2).sinc() - 2 * (w * x).cos())
                 / (2 * shc(x)))


# Konstanten
c0 = -arb.const_euler() - PI / 2 - 3 * arb(2).log() - PI.log()
q = (-4 * L).exp()
M = 60
T2L = sum((q ** (arb(m) + arb(1) / 4) / (arb(m) + arb(1) / 4) for m in range(M)), arb(0)) / 2
T2L += arb(0, (q ** (arb(M) + arb(1) / 4) / ((arb(M) + arb(1) / 4) * (1 - q))).upper())   # Restschranke
# Primpotenzen n ≤ e^{2L} (rigoros entschieden)
X = (2 * L).exp()
primes = []
for n in range(2, int(float(X.upper())) + 2):
    if not (arb(n) < X):
        assert arb(n) > X, "n = e^{2L} nicht entscheidbar"
        continue
    p = next(d for d in range(2, n + 1) if n % d == 0)
    m = n
    while m % p == 0:
        m //= p
    if m == 1:
        primes.append((arb(n).log(), arb(p).log() / arb(n).sqrt()))

idx = list(range(-N, N + 1))
Sv = {k: S(omega(k)) for k in range(0, N + 1)}
for k in range(1, N + 1):
    Sv[-k] = -Sv[k]
Dv = {k: D(omega(k)) for k in range(0, N + 1)}
for k in range(1, N + 1):
    Dv[-k] = Dv[k]
half_i = acb(0, arb(1) / 2)
Pp = {k: 2 * ((acb(omega(k)) + half_i) * L).sin() / (acb(omega(k)) + half_i) for k in idx}
Pm = {k: 2 * ((acb(omega(k)) - half_i) * L).sin() / (acb(omega(k)) - half_i) for k in idx}
A = {}
for j in idx:
    for k in idx:
        pole = Pp[j] * Pp[k] + Pm[j] * Pm[k]
        if j == k:
            arch = c0 * 2 * L - Dv[k] + 4 * L * T2L
            prim = -sum((w * 2 * (2 * L - lg) * (omega(k) * lg).cos() for lg, w in primes), arb(0))
        else:
            sgn = -1 if (j - k) % 2 else 1
            dw = omega(j) - omega(k)
            arch = -2 * sgn * (Sv[k] - Sv[j]) / dw
            prim = -sum((w * 2 * sgn * ((omega(k) * lg).sin() - (omega(j) * lg).sin()) / dw for lg, w in primes), arb(0))
        A[(j, k)] = pole + arch + prim

# Reelle orthonormierte Blöcke: gerade {1/√(2L), cos/√L}, ungerade {sin/√L}
inv2L, invL = 1 / (2 * L).sqrt(), 1 / L.sqrt()
even = [{0: acb(inv2L)}] + [{k: acb(invL / 2), -k: acb(invL / 2)} for k in range(1, N + 1)]
odd = [{k: acb(0, -invL / 2), -k: acb(0, invL / 2)} for k in range(1, N + 1)]   # 1/(2i) = −i/2


def block(basis):
    m = len(basis)
    B = [[None] * m for _ in range(m)]
    for r in range(m):
        for s in range(r, m):
            v = acb(0)
            for a, cr in basis[r].items():
                for b, cs in basis[s].items():
                    v += cr * cs.conjugate() * A[(a, b)]
            assert v.imag.contains(0), "Block nicht reell — Implementierungsfehler"
            B[r][s] = B[s][r] = v.real
    return B


def inertia_below(B, s):
    """Intervall-LDLᵀ von B − sI; gibt (#negative Pivots, alle Pivots vorzeichensicher?) zurück."""
    m = len(B)
    Mx = [[B[i][j] - (s if i == j else 0) for j in range(m)] for i in range(m)]
    neg, ok = 0, True
    for k in range(m):
        d = Mx[k][k]
        if not (d > 0 or d < 0):
            return None, False
        if d < 0:
            neg += 1
        for i in range(k + 1, m):
            f = Mx[i][k] / d
            for j in range(k + 1, m):
                Mx[i][j] = Mx[i][j] - f * Mx[k][j]
    return neg, ok


Be, Bo = block(even), block(odd)
# Näherungswerte (nur Platzierung der Schwellen) aus den Mittelpunkten
import mpmath as mp
mp.mp.dps = 60
def approx_eigs(B):
    Mm = mp.matrix([[mp.mpf(x.mid().str(70, radius=False)) for x in row] for row in B])
    return sorted(mp.eigsy(Mm)[0])
ee, eo = approx_eigs(Be), approx_eigs(Bo)
lo, hi = arb(str(mp.nstr(ee[0] * mp.mpf("0.9"), 30))), arb(str(mp.nstr(ee[0] * mp.mpf("1.1"), 30)))
sstar = arb(str(mp.nstr(mp.sqrt(ee[0] * min(ee[1], eo[0])), 30)))
res = {
    "L": f"{P}/{Qd}", "N": N, "prec_bits": ctx.prec,
    "primes_used": len(primes),
    "even_block_below_lo": inertia_below(Be, lo)[0],
    "even_block_below_hi": inertia_below(Be, hi)[0],
    "even_block_below_sstar": inertia_below(Be, sstar)[0],
    "odd_block_below_sstar": inertia_below(Bo, sstar)[0],
    "even_block_below_0": inertia_below(Be, arb(0))[0],
    "odd_block_below_0": inertia_below(Bo, arb(0))[0],
    "lo": lo.str(12), "hi": hi.str(12), "sstar": sstar.str(12),
    "max_entry_radius": max(float(x.rad()) for row in Be + Bo for x in row),
    "seconds": round(time.time() - t0, 1),
}
res["CERTIFIED_lambda_min_in_[lo,hi]"] = (res["even_block_below_lo"] == 0 and res["even_block_below_hi"] == 1
                                          and res["odd_block_below_sstar"] == 0)
res["CERTIFIED_positive_definite_on_E_N"] = (res["even_block_below_0"] == 0 and res["odd_block_below_0"] == 0)
res["CERTIFIED_even_simple_M1_N"] = (res["even_block_below_sstar"] == 1 and res["odd_block_below_sstar"] == 0)
print(json.dumps(res, indent=1))
