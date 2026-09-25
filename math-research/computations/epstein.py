"""Epstein-Zetafunktion zu Q = x² + 5y² (Diskriminante −20, Klassenzahl 2) in Ball-Arithmetik.

Z_Q(s) = Σ'_{(m,n)≠0} (m² + 5n²)^{−s} = ζ(s) L(s, χ₋₂₀) + L(s, χ₋₄) L(s, χ₅)
(Summe über die beiden Formklassen: ζ_{Q1}+ζ_{Q2} = 2 ζ_K; Differenz über den Geschlechtscharakter.)
Kontrollen in epstein_probe.py: direkte Gittersumme bei s = 3, Funktionalgleichung
(√20/2π)^s Γ(s) Z(s) = (√20/2π)^{1−s} Γ(1−s) Z(1−s).
"""
import certify as C
from flint import acb, arb
C.set_prec(128)
def L(s, q, vals):  # vals: dict a->chi(a)
    tot=acb(0)
    for a,v in vals.items():
        if v: tot += v * s.zeta(acb(arb(a)/q))
    return tot * acb(q)**(-s)
chi_m4={1:1,3:-1}
chi_5={1:1,2:-1,3:-1,4:1}
chi_m20={1:1,3:1,7:1,9:1,11:-1,13:-1,17:-1,19:-1}
def epstein(s):
    return s.zeta()*L(s,20,chi_m20) + L(s,4,chi_m4)*L(s,5,chi_5)
