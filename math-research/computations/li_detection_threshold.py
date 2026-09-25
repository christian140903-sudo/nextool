#!/usr/bin/env python3
"""Barriere B-LI: Ab welchem n könnte eine hypothetische Gegen-Nullstelle ein negatives λ_n erzwingen?

Exakt (elementar): Für ρ = β+iγ mit β > 1/2 ist ρ' = 1−ρ̄ = (1−β)+iγ ebenfalls Nullstelle und
  |1 − 1/ρ'|² = (β²+γ²)/((1−β)²+γ²) = 1 + (2β−1)/((1−β)²+γ²).
Der Beitrag (1−1/ρ')^n wächst also wie exp(n·r) mit r = ½·log(1 + (2β−1)/((1−β)²+γ²)) ≈ δ/γ², δ = β−½.
Heuristische Schwelle (Wechselwirkung der übrigen Terme NICHT abgeschätzt): exp(n r) ≈ (n/2) log n.
Mit γ > H = 3 000 175 332 800 (Platt–Trudgian).  Status: HEURISTIC-QUANTITATIVE.
"""
import math

H = 3000175332800.0


def threshold(delta: float, gamma: float = H) -> float:
    beta = 0.5 + delta
    r = 0.5 * math.log1p((2 * beta - 1) / ((1 - beta) ** 2 + gamma ** 2))
    n = 10.0
    for _ in range(200):
        n = math.log(max(n / 2 * math.log(n), 2.0)) / r
    return n


if __name__ == "__main__":
    for d in (0.5, 1e-1, 1e-3, 1e-6):
        print(f"delta = {d:g}:  n* ≈ {threshold(d):.3e}")
