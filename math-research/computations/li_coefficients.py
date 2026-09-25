#!/usr/bin/env python3
"""Rigorose Einschlüsse der Keiper–Li-Koeffizienten λ_n, n = 1..N (Aufruf: li_coefficients.py N [bits]).

Definition (Li 1997; Bombieri–Lagarias 1999):  λ_n = Σ_ρ [1 − (1 − 1/ρ)^n]  (Summe über
nichttriviale Nullstellen, symmetrisch paarweise summiert). Li:  RH ⇔ λ_n > 0 für alle n ≥ 1.

Berechnung (Keiper 1992): log ξ(1/(1−z)) = log ξ(1) + Σ_{n≥1} (λ_n / n) z^n, mit
ξ(s) = ½ s(s−1) π^{−s/2} Γ(s/2) ζ(s). Mit u = s − 1 = z/(1−z):
  log ξ = log[(s−1)ζ(s)] + log(s/2) − (s/2) log π + log Γ(s/2),
  (s−1)ζ(s) = 1 + Σ_{k≥0} (−1)^k γ_k/k! · u^{k+1}   (γ_k Stieltjes-Konstanten, rigoros von Arb).
Alle Operationen in Ball-Arithmetik; ausgegeben werden Einschlüsse.

Evidenzstatus: NUMERICAL (endlich viele n). Für ∀n ohne Belang — siehe Barrier B-LI im Atlas.
"""
from __future__ import annotations

import json
import sys
import time

from flint import acb, arb, arb_series, ctx


def li_coefficients(N: int, bits: int) -> list[arb]:
    ctx.prec = bits
    ctx.cap = N + 1
    # u(z) = z/(1−z) = z + z^2 + ...
    u = arb_series([0] + [1] * N, prec=N + 1)
    s = u + 1
    # (s−1)ζ(s) als Reihe in u, per Horner in u ausgewertet
    coeffs = [arb(1)]
    fact = arb(1)
    for k in range(N):
        if k > 0:
            fact *= k
        g = acb.stieltjes(k).real
        coeffs.append((-1) ** k * g / fact)          # Koeffizient von u^{k+1}
    P = arb_series([coeffs[-1]], prec=N + 1)
    for c in reversed(coeffs[:-1]):
        P = P * u + c
    logxi = P.log() + (s / 2).log() - (s / 2) * arb.pi().log() + (s / 2).lgamma()
    c = logxi.coeffs()
    return [n * c[n] for n in range(1, N + 1)]


if __name__ == "__main__":
    N = int(sys.argv[1]) if len(sys.argv) > 1 else 100
    bits = int(sys.argv[2]) if len(sys.argv) > 2 else max(256, 3 * N)
    t = time.time()
    lam = li_coefficients(N, bits)
    # Unabhängige Kontrolle: λ_1 = 1 + γ/2 − ½ log(4π)  (Bombieri–Lagarias 1999)
    lam1_closed = 1 + arb.const_euler() / 2 - (4 * arb.pi()).log() / 2
    assert (lam[0] - lam1_closed).contains(0), "Kontrolle λ_1 fehlgeschlagen"
    positive = all(x > 0 for x in lam)
    undecided = [n + 1 for n, x in enumerate(lam) if not (x > 0 or x < 0)]
    out = {
        "N": N, "prec_bits": bits, "seconds": round(time.time() - t, 1),
        "all_certified_positive": positive,
        "undecided_indices": undecided[:20],
        "lambda_1": lam[0].str(20), "lambda_2": lam[1].str(20),
        "lambda_N": lam[-1].str(20),
        "min_over_n_of_lambda_n": min((float(x.mid()), i + 1) for i, x in enumerate(lam)),
        "sample": {str(n): lam[n - 1].str(12) for n in (1, 2, 3, 10, 100, N) if n <= N},
    }
    print(json.dumps(out, indent=2))
