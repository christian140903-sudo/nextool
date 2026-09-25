#!/usr/bin/env python3
"""Zweite, unabhängige Auswertung von Hurwitz-ζ(s, a) (und damit ζ, L-Funktionen) für RH-19.

Benutzt aus Arb nur Ball-Grundrechenarten, Potenzen und Bernoulli-Zahlen — NICHT acb.zeta.

Euler–Maclaurin für f(x) = (x+a)^{−s}, N ≥ 1, ν ≥ 1, σ = Re s, σ + 2ν > 0:
  ζ(s,a) = Σ_{n=0}^{N−1} (n+a)^{−s} + (N+a)^{1−s}/(s−1) + ½(N+a)^{−s}
           + Σ_{k=1}^{ν} B_{2k}/(2k)! · (s)_{2k−1} · (N+a)^{−s−2k+1} + R,
  mit (s)_m = s(s+1)…(s+m−1) und
  R = −∫_N^∞ B̃_{2ν+1}(x)/(2ν+1)! · f^{(2ν+1)}(x) dx,   f^{(m)}(x) = (−1)^m (s)_m (x+a)^{−s−m}.

Restgliedschranke (hier hergeleitet): Aus der Fourierreihe B̃_m(x) = −m! Σ_{k≠0} e^{2πikx}/(2πik)^m folgt
  sup|B̃_m| ≤ 2·m!·ζ(m)/(2π)^m ≤ 2·m!·ζ(3)/(2π)^m  (m ≥ 3), also
  |R| ≤ |(s)_{2ν+1}| · 2ζ(3)/(2π)^{2ν+1} · (N+a)^{−σ−2ν}/(σ+2ν).
Für Ball-Eingaben s wird |(s)_{2ν+1}| durch das Produkt der oberen Schranken von |s+j| und σ durch die
untere Schranke von Re s ersetzt. ζ(3) < 1,2021 wird als 1,21 benutzt.
"""
from __future__ import annotations

from flint import acb, arb

ZETA3_UPPER = arb("1.21")


def _bernoulli_ratios(nu: int) -> list[arb]:
    """B_{2k}/(2k)! für k = 1..ν (rigoros aus Arb-Bernoullizahlen)."""
    out = []
    fact = arb(1)
    for k in range(1, nu + 1):
        fact *= (2 * k - 1) * (2 * k)
        out.append(arb.bernoulli(2 * k) / fact)
    return out


_BCACHE: dict[int, list[arb]] = {}


def hurwitz_em(s: acb, a: arb, N: int, nu: int) -> acb:
    if nu not in _BCACHE:
        _BCACHE[nu] = _bernoulli_ratios(nu)
    B = _BCACHE[nu]
    sigma_low = s.real.lower()
    if not (sigma_low + 2 * nu > 0):
        raise ValueError("σ + 2ν > 0 verletzt")
    total = acb(0)
    for n in range(N):
        total += (acb(a) + n) ** (-s)
    x = acb(a) + N
    total += x ** (1 - s) / (s - 1) + x ** (-s) / 2
    poch = s                      # (s)_1
    xpow = x ** (-s - 1)          # (N+a)^{−s−1}
    x2inv = 1 / (x * x)
    for k in range(1, nu + 1):
        total += B[k - 1] * poch * xpow        # (s)_{2k−1} (N+a)^{−s−2k+1}
        poch = poch * (s + 2 * k - 1) * (s + 2 * k)   # → (s)_{2k+1}
        xpow = xpow * x2inv
    # Restglied: |(s)_{2ν+1}| ≤ Π_{j=0}^{2ν} |s+j|_upper
    pabs = arb(1)
    for j in range(2 * nu + 1):
        pabs *= (s + j).abs_upper()
    two_pi = 2 * arb.pi()
    xr = arb(a) + N
    bound = pabs * 2 * ZETA3_UPPER / two_pi ** (2 * nu + 1) * xr ** (-(arb(sigma_low) + 2 * nu)) / (arb(sigma_low) + 2 * nu)
    rad = bound.upper()
    return total + acb(arb(0, rad), arb(0, rad))


def zeta_em(s: acb, N: int | None = None, nu: int = 20) -> acb:
    if N is None:
        N = max(20, int(abs(float(s.imag.mid()))) + 20)
    return hurwitz_em(s, arb(1), N, nu)
