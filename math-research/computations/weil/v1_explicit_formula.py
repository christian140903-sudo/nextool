#!/usr/bin/env python3
"""V1: Prüft die im Weil-Labor benutzte Form der expliziten Formel an Gauß-Testfunktionen.

Form (Alpöge–Furman (2.1), auf nicht-gerade F erweitert):
  Σ_ρ F̂(γ_ρ) = F̂(i/2) + F̂(−i/2) + A(F) − Σ_n Λ(n) n^{−1/2} (F(log n) + F(−log n)),
  F̂(τ) = ∫ F(x) e^{iτx} dx,  γ_ρ = (ρ−½)/i.
Archimedischer Term in zwei unabhängigen Formen:
  (τ)  A(F) = ∫ F̂(τ) μ(τ) dτ,  μ(τ) = (1/2π)(Re ψ(¼+iτ/2) − log π)
  (x)  A(F) = (ψ(¼) − log π) F(0) − ∫_0^∞ e^{−x/2} (F(x)+F(−x)−2F(0)) / (1−e^{−2x}) dx   [eigene Herleitung]
"""
import mpmath as mp
from flint import acb

mp.mp.dps = 50

def von_mangoldt_table(M):
    lam = [mp.mpf(0)] * (M + 1)
    sieve = list(range(M + 1))
    for p in range(2, M + 1):
        if sieve[p] == p:
            for q in range(p, M + 1, p):
                sieve[q] = p if sieve[q] == q else sieve[q]
            pk = p
            while pk <= M:
                lam[pk] = mp.log(p)
                pk *= p
    return lam

def test(s, x0, zeros, M=20000):
    F = lambda x: mp.exp(-(x - x0) ** 2 / (2 * s ** 2))
    Fh = lambda z: s * mp.sqrt(2 * mp.pi) * mp.exp(-s ** 2 * z ** 2 / 2 + 1j * z * x0)
    zero_side = mp.fsum(Fh(g) + Fh(-g) for g in zeros)
    poles = Fh(0.5j) + Fh(-0.5j)
    lam = von_mangoldt_table(M)
    primes = mp.fsum(lam[n] / mp.sqrt(n) * (F(mp.log(n)) + F(-mp.log(n))) for n in range(2, M + 1) if lam[n])
    mu = lambda t: (mp.re(mp.digamma(mp.mpf(1) / 4 + 0.5j * t)) - mp.log(mp.pi)) / (2 * mp.pi)
    A_tau = mp.quad(lambda t: Fh(t) * mu(t), [-mp.inf, -20, -5, 0, 5, 20, mp.inf])
    A_x = (mp.digamma(mp.mpf(1) / 4) - mp.log(mp.pi)) * F(0) - mp.quad(
        lambda x: mp.exp(-x / 2) * (F(x) + F(-x) - 2 * F(0)) / (1 - mp.exp(-2 * x)), [0, 1, 4, 10, mp.inf])
    rhs = poles + A_x - primes
    return zero_side, rhs, A_tau, A_x

if __name__ == "__main__":
    from flint import ctx; ctx.prec = 200
    zeros = [mp.mpf(acb.zeta_zero(k).imag.str(60, radius=False)) for k in range(1, 41)]
    for s, x0 in [(0.5, 0.0), (0.5, 0.7), (0.35, -1.3)]:
        zs, rhs, At, Ax = test(mp.mpf(s), mp.mpf(x0), zeros)
        print(f"s={s} x0={x0}:  |Nullstellenseite − RHS| = {mp.nstr(abs(zs - rhs), 5)}   "
              f"|A_tau − A_x| = {mp.nstr(abs(At - Ax), 5)}   (|RHS|≈{mp.nstr(abs(rhs), 5)})")
