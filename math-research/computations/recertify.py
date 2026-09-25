#!/usr/bin/env python3
"""RH-19: Doppelzertifizierung mit der zweiten, unabhängigen ζ-Implementierung (zeta_em.py, ohne acb.zeta).

Geprüft werden: (1) die 4 Davenport–Heilbronn-Boxen, (2) die 13 Epstein-Boxen, (3) RH bis T≈1000
(Windung auf B und A, Vorzeichenwechsel von Z). Gemeinsam mit certify.py bleiben nur der
Ball-Arithmetik-Kern (Arb-Grundrechenarten, Γ) und die Konturlogik.
"""
from __future__ import annotations

import json
import sys
import time

import certify as C
from flint import acb, arb
from zeta_em import hurwitz_em

NU = 20


def N_for(s: acb) -> int:
    return max(30, int(abs(float(s.imag.mid())) + float(s.imag.rad())) + 30)


def hz(s: acb, a: arb) -> acb:
    return hurwitz_em(s, a, N_for(s), NU)


def zeta2(s: acb) -> acb:
    """ζ über Euler–Maclaurin; für Re s < 1/2 über die Funktionalgleichung
    ζ(s) = 2^s π^{s−1} sin(πs/2) Γ(1−s) ζ(1−s)  (gut konditioniert, ohne acb.zeta)."""
    if float(s.real.mid()) < 0.5:
        one = acb(1)
        return (acb(2) ** s) * (acb.pi() ** (s - one)) * (acb.pi() * s / 2).sin() * (one - s).gamma() \
            * hz(one - s, arb(1))
    return hz(s, arb(1))


def L2(s: acb, q: int, vals: dict) -> acb:
    tot = acb(0)
    for r, v in vals.items():
        if v:
            tot += v * hz(s, arb(r) / q)
    return tot * acb(q) ** (-s)


def dh2(s: acb) -> acb:
    five = arb(5)
    k = ((arb(10) - 2 * five.sqrt()).sqrt() - 2) / (five.sqrt() - 1)
    return L2(s, 5, {1: arb(1), 2: k, 3: -k, 4: arb(-1)})


CHI_M4 = {1: 1, 3: -1}
CHI_5 = {1: 1, 2: -1, 3: -1, 4: 1}
CHI_M20 = {1: 1, 3: 1, 7: 1, 9: 1, 11: -1, 13: -1, 17: -1, 19: -1}


def epstein2(s: acb) -> acb:
    return zeta2(s) * L2(s, 20, CHI_M20) + L2(s, 4, CHI_M4) * L2(s, 5, CHI_5)


def hardy_z2(t: float) -> arb:
    tt = arb(t)
    s = acb(arb(0.5), tt)
    theta = acb(arb(0.25), tt / 2).lgamma().imag - tt / 2 * arb.pi().log()
    val = acb(0, theta).exp() * zeta2(s)
    assert val.imag.contains(0)
    return val.real


def main():
    C.set_prec(128)
    t0 = time.time()
    out = {}
    dh = json.load(open("results/davenport_heilbronn.json"))
    out["davenport_heilbronn"] = [
        C.winding_number(dh2, z["box_sigma"][0], z["box_sigma"][1], z["box_t"][0], z["box_t"][1], pieces=8)
        for z in dh["zeros"]]
    ep = json.load(open("results/epstein_x2_5y2.json"))
    out["epstein"] = [C.winding_number(epstein2, b["sigma"][0], b["sigma"][1], b["t"][0], b["t"][1], pieces=8)
                      for b in ep["boxes"]]
    out["epstein_total_region_[0.51,3]x[1,100]"] = C.winding_number(epstein2, 0.51, 3.0, 1.0, 100.0, pieces=64)
    print(json.dumps({"partial": out, "seconds": round(time.time() - t0, 1)}), file=sys.stderr, flush=True)
    # RH bis T ≈ 1000 (T und Stützstellen wie in rh_range_1e3.json)
    rh = json.load(open("results/rh_range_1e3.json"))
    T = rh["T"]
    C.set_prec(96)
    wB = C.winding_number(zeta2, -1.0, 2.0, -1.0, 1.0, pieces=16)
    wA = C.winding_number(zeta2, -1.0, 2.0, 1.0, T, pieces=lambda a, b: max(8, int(abs(b - a) * 2)))
    zs = [float(z.imag.mid()) for z in acb.zeta_zeros(1, wA + 5)]  # nur Platzierung
    below = [z for z in zs if z < T]
    pts = [1.0] + [(below[i] + below[i + 1]) / 2 for i in range(len(below) - 1)] + [(below[-1] + T) / 2]
    signs = [C.sign(hardy_z2(t)) for t in pts]
    assert 0 not in signs
    K = sum(1 for i in range(len(signs) - 1) if signs[i] != signs[i + 1])
    out["rh_up_to_T"] = {"T": T, "winding_B": wB, "N": wA, "K": K, "certified": wB == -1 and wA == K}
    out["all_consistent_with_first_implementation"] = (
        all(w == 1 for w in out["davenport_heilbronn"]) and all(w == 1 for w in out["epstein"])
        and out["epstein_total_region_[0.51,3]x[1,100]"] == ep["total_winding"]
        and wA == rh["winding_A(-1,2;1,T)=N(T)"] and K == rh["sign_changes_K"])
    out["seconds"] = round(time.time() - t0, 1)
    json.dump(out, sys.stdout, indent=1)
    print()


if __name__ == "__main__":
    main()
