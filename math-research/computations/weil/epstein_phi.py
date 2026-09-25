#!/usr/bin/env python3
"""Φ_E: Epstein-Analogon von Riemanns Φ für Q = x²+5y²  (Φ̂_E(τ) = s(s−1)Λ_E(s), s = ½+iτ).
Φ_E(x) = e^{x/2} Σ'_{(m,n)} [(κ q eˣ)² − 2κ q eˣ] e^{−κ q eˣ},  κ = π/√5,  q = m²+5n²  (für x ≥ 0 schnell konvergent;
gerade nach Selbstdualität von x²+5y², Kontrolle unten)."""
import mpmath as mp
from models import epstein_r

_R = epstein_r(4000)
_C = {}


def PhiE(x, qmax=4000):
    x = abs(x)
    key = (x, mp.mp.prec)
    if key in _C:
        return _C[key]
    kap = mp.pi / mp.sqrt(5)
    y = mp.exp(x)
    tot = mp.mpf(0)
    for q in range(1, qmax + 1):
        if _R[q]:
            u = kap * q * y
            term = _R[q] * (u * u - 2 * u) * mp.exp(-u)
            tot += term
            if u > 200 and abs(term) < mp.mpf(10) ** (-mp.mp.dps - 5):
                break
    val = _C[key] = mp.exp(x / 2) * tot
    return val


def PhiE_signed(x, qmax=4000):
    """Ohne Betrag (für die Geradheitsprüfung bei x < 0 mit vielen Termen)."""
    kap = mp.pi / mp.sqrt(5)
    y = mp.exp(x)
    return mp.exp(x / 2) * mp.fsum(_R[q] * ((kap * q * y) ** 2 - 2 * kap * q * y) * mp.exp(-kap * q * y)
                                    for q in range(1, qmax + 1) if _R[q])


if __name__ == "__main__":
    mp.mp.dps = 30
    for x in (0.2, 0.5):
        print("Geradheit x=±%s:" % x, mp.nstr(PhiE_signed(mp.mpf(x)), 15), mp.nstr(PhiE_signed(mp.mpf(-x)), 15))
    import sys
    sys.path.insert(0, "..")
    A = mp.sqrt(20) / (2 * mp.pi)
    def Lq(s, q, vals):
        return mp.fsum(v * mp.zeta(s, mp.mpf(a) / q) for a, v in vals.items()) * mp.power(q, -s)
    def Z(s):
        return (mp.zeta(s) * Lq(s, 20, {1:1,3:1,7:1,9:1,11:-1,13:-1,17:-1,19:-1})
                + Lq(s, 4, {1:1,3:-1}) * Lq(s, 5, {1:1,2:-1,3:-1,4:1}))
    for tau in (0.0, 3.0, 7.5):
        s = mp.mpf(0.5) + 1j * tau
        lhs = 2 * mp.quad(lambda x: PhiE(x) * mp.cos(tau * x), mp.linspace(0, 3, 30))
        rhs = s * (s - 1) * mp.power(A, s) * mp.gamma(s) * Z(s)
        print("tau=%s: Φ̂_E = %s   s(s−1)Λ_E(s) = %s" % (tau, mp.nstr(lhs, 15), mp.nstr(rhs, 15)))
