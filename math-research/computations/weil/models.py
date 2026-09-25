#!/usr/bin/env python3
"""Modelle für das verallgemeinerte Weil-Labor: ζ und Epstein-ζ zu x²+5y².

Allgemeine explizite Formel (Λ_L(s) = γ_∞(s) L(s), Λ_L(s) = Λ_L(1−s), Pole bei 0 und 1):
  Σ_ρ F̂(γ_ρ) = F̂(i/2) + F̂(−i/2) + ∫ F̂(τ) μ(τ) dτ − Σ_n c(n) n^{−1/2} (F(log n) + F(−log n)),
  μ(τ) = (1/π) Re (γ_∞′/γ_∞)(½ + iτ),   −L′/L(s) = Σ c(n) n^{−s}.

ζ:        γ_∞ = π^{−s/2} Γ(s/2),  c = Λ (von Mangoldt).
          A(F) = (ψ(¼) − log π) F(0) − ∫_0^∞ K(x)(F(x)+F(−x)−2F(0)) dx,  K(x) = e^{−x/2}/(1−e^{−2x})   [V1]
Epstein:  γ_∞ = A^s Γ(s), A = √20/(2π);  Z(s) = Σ' (m²+5n²)^{−s} = 2·(1 + Σ_{k≥2} a(k) k^{−s}), a(k) = r(k)/2;
          c aus a(n) log n = Σ_{d e = n} c(d) a(e)  (kein Eulerprodukt ⇒ c(n) ≠ 0 auch für Nicht-Primpotenzen).
          Herleitung mit ψ(z) = −γ + ∫_0^∞ (e^{−t} − e^{−zt})/(1−e^{−t}) dt, z = ½+iτ, ∫F̂(τ)cos(τt)dτ = π(F(t)+F(−t)):
          A(F) = 2(log A + ψ(½)) F(0) − ∫_0^∞ K_E(t)(F(t)+F(−t)−2F(0)) dt,  K_E(t) = e^{−t/2}/(1−e^{−t}).
Grenzwerte t→0:  K·sin(ωt) → ω/2 (ζ) bzw. ω (Epstein);  K·(2(2L−t)cos ωt − 4L) → −1 (ζ) bzw. −2 (Epstein).
"""
import mpmath as mp


class Model:
    name: str

    def coeffs(self, X: int) -> dict:
        raise NotImplementedError

    def const(self):
        raise NotImplementedError

    def kern(self, x):
        raise NotImplementedError

    def tail(self, L2):
        """∫_{L2}^∞ K(x) dx."""
        raise NotImplementedError

    lim_S = 0.5    # Faktor für Grenzwert K·sin(ωx) → lim_S·ω
    lim_D = -1     # Grenzwert K·(2(2L−x)cos ωx − 4L) bei x→0


class ZetaModel(Model):
    name = "zeta"
    lim_S, lim_D = mp.mpf(1) / 2, -1

    def coeffs(self, X):
        out = {}
        for p in range(2, X + 1):
            if all(p % q for q in range(2, int(p ** 0.5) + 1)):
                pk = p
                while pk <= X:
                    out[pk] = mp.log(p)
                    pk *= p
        return out

    def const(self):
        return mp.digamma(mp.mpf(1) / 4) - mp.log(mp.pi)

    def kern(self, x):
        return mp.exp(-x / 2) / (-mp.expm1(-2 * x))

    def tail(self, L2):
        q = mp.exp(-2 * L2)
        return mp.nsum(lambda m: q ** (m + mp.mpf(1) / 4) / (m + mp.mpf(1) / 4), [0, mp.inf]) / 2


def epstein_r(K: int) -> list:
    r = [0] * (K + 1)
    m = 0
    while m * m <= K:
        n = 0
        while m * m + 5 * n * n <= K:
            mult = (2 if m else 1) * (2 if n else 1)
            if m or n:
                r[m * m + 5 * n * n] += mult
            n += 1
        m += 1
    return r


class EpsteinModel(Model):
    name = "epstein_x2+5y2"
    lim_S, lim_D = mp.mpf(1), -2

    def coeffs(self, X):
        r = epstein_r(X)
        a = [mp.mpf(0)] + [mp.mpf(r[k]) / 2 for k in range(1, X + 1)]
        assert a[1] == 1
        c = [mp.mpf(0)] * (X + 1)
        acc = [mp.mpf(0)] * (X + 1)          # acc[n] = Σ_{d|n, 1<d<n} c(d) a(n/d)
        for n in range(2, X + 1):
            c[n] = a[n] * mp.log(n) - acc[n]
            if c[n] != 0:
                for e in range(2, X // n + 1):
                    if a[e] != 0:
                        acc[n * e] += c[n] * a[e]
        return {n: c[n] for n in range(2, X + 1) if c[n] != 0}

    def const(self):
        A = mp.sqrt(20) / (2 * mp.pi)
        return 2 * (mp.log(A) + mp.digamma(mp.mpf(1) / 2))

    def kern(self, t):
        return mp.exp(-t / 2) / (-mp.expm1(-t))

    def tail(self, L2):
        q = mp.exp(-L2)
        return mp.nsum(lambda m: q ** (m + mp.mpf(1) / 2) / (m + mp.mpf(1) / 2), [0, mp.inf])
