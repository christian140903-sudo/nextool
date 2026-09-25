#!/usr/bin/env python3
"""Gegenmodell-Harness: rigorose Zertifizierung von Nullstellen AUSSERHALB der kritischen Geraden
für Funktionen, die dieselbe Art Funktionalgleichung wie ζ besitzen, aber kein Eulerprodukt.

Zweck (zweifach):
 1. Beweisbarriere, rigoros belegt: Jedes Argument, das nur "Dirichletreihe + Funktionalgleichung
    vom Riemann-Typ + Ordnung 1" benutzt, beweist RH NICHT — denn für die Davenport–Heilbronn-
    Funktion gelten diese Eigenschaften (Titchmarsh, Theory of the Riemann Zeta-Function,
    2. Aufl., §10.25), und sie hat nachweislich Nullstellen mit Re s ≠ 1/2.
 2. Test der Pipeline für den negativen Lösungsausgang: dieselbe Routine würde eine
    Gegen-Nullstelle von ζ zertifizieren (Windungszahl ≥ 1 auf einem Rechteck mit Re s > 1/2).

Davenport–Heilbronn:  f(s) = Σ a(n) n^{-s},  a periodisch mod 5 mit (a(1),…,a(5)) = (1, κ, −κ, −1, 0),
κ = (√(10−2√5) − 2)/(√5 − 1).  Damit f(s) = 5^{-s} Σ_{r=1}^{4} a(r) ζ(s, r/5)  (Hurwitz-ζ).
"""
from __future__ import annotations

import json
import sys

import certify as C
from flint import acb, arb


def kappa() -> arb:
    five = arb(5)
    return ((arb(10) - 2 * five.sqrt()).sqrt() - 2) / (five.sqrt() - 1)


def davenport_heilbronn(s: acb) -> acb:
    k = kappa()
    coeff = [arb(1), k, -k, arb(-1)]
    total = acb(0)
    for r, a in zip(range(1, 5), coeff):
        total += a * s.zeta(acb(arb(r) / 5))
    return total * (acb(5) ** (-s))


def newton(f, z: complex, steps: int = 60) -> complex:
    h = 1e-7
    for _ in range(steps):
        fz = complex(f(C.pt(z)).mid())
        d = (complex(f(C.pt(z + h)).mid()) - complex(f(C.pt(z - h)).mid())) / (2 * h)
        z_new = z - fz / d
        if abs(z_new - z) < 1e-13:
            return z_new
        z = z_new
    return z


def certify_offline_zero(f, guess: complex, half_width: float = 1e-3) -> dict:
    z = newton(f, guess)
    s0, s1 = z.real - half_width, z.real + half_width
    t0, t1 = z.imag - half_width, z.imag + half_width
    st: dict = {}
    w = C.winding_number(f, s0, s1, t0, t1, pieces=8, stats=st)
    return {
        "approx_zero": [z.real, z.imag],
        "box_sigma": [s0, s1],
        "box_t": [t0, t1],
        "winding_number": w,
        "box_strictly_right_of_critical_line": s0 > 0.5,
        "certified_offline_zero": (w >= 1 and s0 > 0.5),
        "segments": st.get("segments"),
    }


def functional_equation_residual(s: complex) -> dict:
    """Kontrollrechnung (keine Beweislast; der Satz selbst ist Titchmarsh §10.25):
    Λ(s) := (5/π)^{(s+1)/2} Γ((s+1)/2) f(s) erfüllt Λ(s) = Λ(1−s)  (χ mod 5 ist ungerade).
    Äquivalent: f(s) = 5^{1/2−s} · 2Γ(1−s) cos(πs/2) (2π)^{s−1} f(1−s).
    (Erste Fassung benutzte fälschlich sin(πs/2) — die Form für ζ/gerade Charaktere; siehe Failure Log F-1.)"""
    sb = C.pt(s)
    one = acb(1)
    fs, f1s = davenport_heilbronn(sb), davenport_heilbronn(one - sb)
    lam = lambda z, v: (acb(5) / acb.pi()) ** ((z + 1) / 2) * ((z + 1) / 2).gamma() * v
    return {"s": [s.real, s.imag],
            "abs(Lambda(s)-Lambda(1-s))_upper": (lam(sb, fs) - lam(one - sb, f1s)).abs_upper().str(5),
            "abs(f(s))_upper": fs.abs_upper().str(5)}


if __name__ == "__main__":
    C.set_prec(128)
    # Startwerte aus der Literatur (Spira 1994; Balanzario–Sánchez-Ortiz, Math. Comp. 76 (2007)).
    guesses = [complex(0.808517, 85.699348), complex(0.650830, 114.163343),
               complex(0.574356, 166.479306), complex(0.724258, 176.702461)]
    out = {"functional_equation_check": [functional_equation_residual(complex(0.3, 20.0)),
                                         functional_equation_residual(complex(0.7, 85.0))],
           "zeros": [certify_offline_zero(davenport_heilbronn, g) for g in guesses]}
    # Kontrast: ζ hat im gleichen Typ Rechteck rechts der Geraden keine Nullstelle (Windung 0).
    out["zeta_control_box_[0.6,1.2]x[80,120]"] = C.winding_number(C.zeta, 0.6, 1.2, 80.0, 120.0, pieces=16)
    json.dump(out, sys.stdout, indent=2)
    print()
