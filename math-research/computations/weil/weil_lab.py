#!/usr/bin/env python3
"""Weil-Labor: Matrix der Weil-Form auf dem Fenster [−L, L] (L = log λ) in der Basis e_k(x) = e^{iω_k x},
ω_k = πk/L, |k| ≤ N (Basis von Connes–Consani–Moscovici), aufgespalten in Paritätsblöcke.

Form (validiert in v1_explicit_formula.py, Übereinstimmung 1e−51):
  Q(f,g) = F̂(i/2) + F̂(−i/2) + A(F) − Σ_{n ≤ e^{2L}} Λ(n) n^{−1/2} (F(log n) + F(−log n)),
  F(a) = C_{fg}(a) = ∫ f(y) conj(g(y−a)) dy,  F̂(z) = ∫ F(x) e^{izx} dx,
  A(F) = (ψ(¼) − log π) F(0) − ∫_0^{2L} e^{−x/2}(F(x)+F(−x)−2F(0))/(1−e^{−2x}) dx + 2F(0)·T(2L),
  T(2L) = ∫_{2L}^∞ e^{−x/2}/(1−e^{−2x}) dx = ½ Σ_{m≥0} q^{m+¼}/(m+¼),  q = e^{−4L}.
RH ⇔ Q(f,f) ≥ 0 für alle f mit kompaktem Träger (alle L).

Geschlossene Formen für e_j, e_k (x ∈ [0, 2L], m = j−k):
  C_{jk}(x) + C_{jk}(−x) = 2(−1)^m (sin ω_k x − sin ω_j x)/(ω_j − ω_k)   (j ≠ k),   2(2L−x) cos ω_k x   (j = k)
  C_{jk}(0) = 2L δ_{jk}
  F̂(±i/2) = P^±_j P^±_k,   P^±_j = 2 sin((ω_j ± i/2)L)/(ω_j ± i/2)
  A(j≠k) = −2(−1)^m (S(ω_k) − S(ω_j))/(ω_j − ω_k),   S(ω) = ∫_0^{2L} e^{−x/2} sin(ωx)/(1−e^{−2x}) dx
  A(k,k) = (ψ(¼) − log π)·2L − D(ω_k) + 4L·T(2L),   D(ω) = ∫_0^{2L} e^{−x/2}(2(2L−x)cos ωx − 4L)/(1−e^{−2x}) dx
Quadratische Form in Koeffizienten c (f = Σ c_j e_j):  Q(f,f) = Σ_{j,k} c_j conj(c_k) A_{jk};  Gram = 2L·I.

Evidenzstatus: NUMERICAL (mpmath, nicht rigoros). Rigorose Version folgt, falls Befunde Beweislast tragen sollen.
"""
from __future__ import annotations

import mpmath as mp

from models import ZetaModel


def von_mangoldt(M: int) -> dict[int, mp.mpf]:
    out = {}
    for p in range(2, M + 1):
        if all(p % q for q in range(2, int(p ** 0.5) + 1)):
            pk = p
            while pk <= M:
                out[pk] = mp.log(p)
                pk *= p
    return out


class WeilWindow:
    def __init__(self, L, N: int, dps: int = 60, model=None):
        mp.mp.dps = dps
        self.model = model or ZetaModel()
        self.L = mp.mpf(L)
        self.N = N
        self.idx = list(range(-N, N + 1))
        self.om = {k: mp.pi * k / self.L for k in self.idx}
        self.X = int(mp.floor(mp.exp(2 * self.L)))
        self.lam = self.model.coeffs(self.X)
        self._kcache = {}
        self._build()

    # --- archimedische Hilfsintegrale -------------------------------------------------------
    def _quad(self, f):
        L2 = 2 * self.L
        pieces = max(4, int(max(abs(w) for w in self.om.values()) * float(L2) / 3) + 4)
        pts = [L2 * i / pieces for i in range(pieces + 1)]
        return mp.quad(f, pts)

    def _kern(self, x):
        """Archimedischer Kern des Modells, memoisiert (Quadraturknoten sind für alle ω dieselben)."""
        c = self._kcache.get(x)
        if c is None:
            c = self._kcache[x] = self.model.kern(x)
        return c

    def _S(self, w):
        if w == 0:
            return mp.mpf(0)
        return self._quad(lambda x: self._kern(x) * mp.sin(w * x) if x != 0 else self.model.lim_S * w)

    def _D(self, w):
        L = self.L
        return self._quad(lambda x: self._kern(x) * (2 * (2 * L - x) * mp.cos(w * x) - 4 * L)
                          if x != 0 else mp.mpf(self.model.lim_D))

    def _build(self):
        L, N = self.L, self.N
        T2L = self.model.tail(2 * L)
        c0 = self.model.const()
        S = {k: self._S(self.om[k]) for k in range(0, N + 1)}
        for k in range(1, N + 1):
            S[-k] = -S[k]
        D = {k: self._D(self.om[k]) for k in range(0, N + 1)}
        for k in range(1, N + 1):
            D[-k] = D[k]
        Pp = {k: 2 * mp.sin((self.om[k] + 0.5j) * L) / (self.om[k] + 0.5j) for k in self.idx}
        Pm = {k: 2 * mp.sin((self.om[k] - 0.5j) * L) / (self.om[k] - 0.5j) for k in self.idx}
        logs = [(mp.log(n), lam / mp.sqrt(n)) for n, lam in sorted(self.lam.items())]
        n = 2 * N + 1
        A = mp.matrix(n, n)
        for a, j in enumerate(self.idx):
            for b, k in enumerate(self.idx):
                if b < a:
                    continue
                pole = Pp[j] * Pp[k] + Pm[j] * Pm[k]
                if j == k:
                    arch = c0 * 2 * L - D[k] + 4 * L * T2L
                    prim = -mp.fsum(w * 2 * (2 * L - lg) * mp.cos(self.om[k] * lg) for lg, w in logs)
                else:
                    m = j - k
                    sgn = -1 if m % 2 else 1
                    dw = self.om[j] - self.om[k]
                    arch = -2 * sgn * (S[k] - S[j]) / dw
                    prim = -mp.fsum(w * 2 * sgn * (mp.sin(self.om[k] * lg) - mp.sin(self.om[j] * lg)) / dw
                                    for lg, w in logs)
                A[a, b] = pole + arch + prim
                A[b, a] = mp.conj(A[a, b])
        self.A = A          # A[a,b] = Q(e_j, e_k)
        self.pole_vectors = (Pp, Pm)

    # --- Paritätsblöcke --------------------------------------------------------------------
    def blocks(self):
        """Reell-symmetrische Matrizen der Form (Rayleigh-Quotient bzgl. L²-Norm) auf
        gerade: {1, cos ω_k x} und ungerade: {sin ω_k x}, orthonormiert."""
        N, L = self.N, self.L
        pos = {k: i for i, k in enumerate(self.idx)}
        # Koeffizientenvektoren c (f = Σ c_j e_j) der orthonormierten reellen Basis
        even, odd = [], []
        even.append({pos[0]: 1 / mp.sqrt(2 * L)})
        for k in range(1, N + 1):
            even.append({pos[k]: 1 / (2 * mp.sqrt(L)), pos[-k]: 1 / (2 * mp.sqrt(L))})
            odd.append({pos[k]: 1 / (2j * mp.sqrt(L)), pos[-k]: -1 / (2j * mp.sqrt(L))})

        def form(basis):
            m = len(basis)
            B = mp.matrix(m, m)
            for r in range(m):
                for s in range(r, m):
                    val = mp.fsum(cr * mp.conj(cs) * self.A[a, b]
                                  for a, cr in basis[r].items() for b, cs in basis[s].items())
                    B[r, s] = B[s, r] = mp.re(val)
            return B
        return form(even), form(odd), even, odd


def smallest(B, count=3):
    E, Q = mp.eigsy(B)
    order = sorted(range(len(E)), key=lambda i: E[i])
    return [E[i] for i in order[:count]], [Q[:, i] for i in order[:count]]


if __name__ == "__main__":
    import sys, time
    L = mp.mpf(sys.argv[1]) if len(sys.argv) > 1 else mp.mpf("0.8")
    N = int(sys.argv[2]) if len(sys.argv) > 2 else 20
    dps = int(sys.argv[3]) if len(sys.argv) > 3 else 60
    t = time.time()
    W = WeilWindow(L, N, dps)
    Be, Bo, _, _ = W.blocks()
    ee, _ = smallest(Be)
    eo, _ = smallest(Bo)
    print(f"L={mp.nstr(L,6)} N={N} dps={dps} ({time.time()-t:.1f}s)")
    print("  gerade  :", [mp.nstr(x, 8) for x in ee])
    print("  ungerade:", [mp.nstr(x, 8) for x in eo])
