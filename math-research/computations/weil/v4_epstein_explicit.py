#!/usr/bin/env python3
"""V4: Validierung der Epstein-Weil-Form (explizite Formel) an Gauß-Testfunktionen.
Nullstellen bis Höhe T: auf der Geraden über Vorzeichenwechsel von Λ_E(½+it) (reell), neben der Geraden aus
den zertifizierten Boxen (results/epstein_x2_5y2.json) + Spiegelung; Vollständigkeit per Argumentprinzip (Arb)."""
import json, sys
import mpmath as mp
sys.path.insert(0, "..")
import certify as C
from epstein import epstein
from models import EpsteinModel

mp.mp.dps = 40
T = 36.0
A = mp.sqrt(20) / (2 * mp.pi)

def Lq(s, q, vals):
    return mp.fsum(v * mp.zeta(s, mp.mpf(a) / q) for a, v in vals.items()) * mp.power(q, -s)
def Zmp(s):
    return (mp.zeta(s) * Lq(s, 20, {1:1,3:1,7:1,9:1,11:-1,13:-1,17:-1,19:-1})
            + Lq(s, 4, {1:1,3:-1}) * Lq(s, 5, {1:1,2:-1,3:-1,4:1}))
def LamE(s):
    return mp.power(A, s) * mp.gamma(s) * Zmp(s)

# 1) Nullstellen auf der Geraden
f = lambda t: mp.re(LamE(mp.mpf(0.5) + 1j * t))
ts = [mp.mpf(1) + k * mp.mpf("0.02") for k in range(int((T - 1) / 0.02) + 1)]
vals = [f(t) for t in ts]
online = []
for i in range(len(ts) - 1):
    if vals[i] * vals[i + 1] < 0:
        online.append(mp.findroot(f, (ts[i], ts[i + 1]), solver="anderson"))
# 2) Nullstellen neben der Geraden (zertifizierte Boxen) + Newton
boxes = json.load(open("../results/epstein_x2_5y2.json"))["boxes"]
offline = []
for b in boxes:
    z0 = mp.mpc((b["sigma"][0] + b["sigma"][1]) / 2, (b["t"][0] + b["t"][1]) / 2)
    if z0.imag < T:
        offline.append(mp.findroot(Zmp, z0))
# 3) Vollständigkeit: Windung von Z auf [−2,3]×[1,T] (rigoros, Arb) = #online + 2·#offline?
C.set_prec(96)
w = C.winding_number(epstein, -0.5, 3.0, 1.0, T, pieces=lambda a, b: max(8, int(abs(b - a) * 3)))
wB = C.winding_number(epstein, -1.5, 3.0, -0.9, 0.9, pieces=24)   # enthält Pol s=1 und triviale Nullstelle −1
print("online:", len(online), " offline(rechts):", len(offline), " Windung [−0.5,3]×[1,T]:", w, " erwartet:", len(online) + 2 * len(offline))
print("Windung um reelle Achse [−1.5,3]×[−0.9,0.9]:", wB, "(= reelle Nullstellen inkl. −1  − 1 Pol)")
# 4) Gauß-Test
M = EpsteinModel()
X = 20000
c = M.coeffs(X)
gam = []
for t in online:
    gam += [t, -t]
for rho in offline:
    for r in (rho, mp.conj(rho), 1 - mp.conj(rho), 1 - rho):
        gam.append((r - mp.mpf(0.5)) / 1j)
def test(s, x0):
    F = lambda x: mp.exp(-(x - x0) ** 2 / (2 * s ** 2))
    Fh = lambda z: s * mp.sqrt(2 * mp.pi) * mp.exp(-s ** 2 * z ** 2 / 2 + 1j * z * x0)
    zero_side = mp.fsum(Fh(g) for g in gam)
    poles = Fh(0.5j) + Fh(-0.5j)
    primes = mp.fsum(cn / mp.sqrt(n) * (F(mp.log(n)) + F(-mp.log(n))) for n, cn in c.items())
    Ax = M.const() * F(0) - mp.quad(lambda t: M.kern(t) * (F(t) + F(-t) - 2 * F(0)), [0, 1, 4, 10, mp.inf])
    mu = lambda tau: (mp.log(A) + mp.re(mp.digamma(mp.mpf(0.5) + 1j * tau))) / mp.pi
    At = mp.quad(lambda tau: Fh(tau) * mu(tau), [-mp.inf, -20, -5, 0, 5, 20, mp.inf])
    return zero_side, poles + Ax - primes, At, Ax
for s, x0 in [(0.6, 0.0), (0.6, 0.9)]:
    zs, rhs, At, Ax = test(mp.mpf(s), mp.mpf(x0))
    print(f"s={s} x0={x0}: |Nullstellenseite − RHS| = {mp.nstr(abs(zs - rhs), 4)}  |A_tau − A_x| = {mp.nstr(abs(At - Ax), 4)}  |RHS| = {mp.nstr(abs(rhs), 4)}")
