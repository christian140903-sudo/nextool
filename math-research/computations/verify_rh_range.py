#!/usr/bin/env python3
"""Computerassistierter Beweis von  RH(T): alle Nullstellen ρ mit 0 < Im ρ ≤ T sind einfach
und liegen auf Re s = 1/2  — für ein explizites T (Aufruf: verify_rh_range.py T).

Status: Reproduktion eines bekannten endlichen Resultats (Platt–Trudgian 2021: bis 3·10^12).
Keinerlei Beitrag zum ∀-Quantor der RH; Zweck ist die geprüfte Infrastruktur für
(i) Kreuzvalidierung, (ii) die Zertifizierung eines hypothetischen Gegenbeispiels.

Logik (siehe certify.py):
  1. Lemma 0 (bewiesen, DOSSIER): jede nichttriviale Nullstelle hat 0 < Re ρ < 1,
     liegt also in [-1,2] × R.
  2. Windung auf B = [-1,2]×[-1,1] ist −1  ⇒  keine Nullstelle in B (einziger Pol: s = 1).
  3. Windung auf A = [-1,2]×[1,T] ist N  ⇒  genau N Nullstellen (mit Vielfachheit) mit 1<γ<T;
     Randfreiheit bei γ = 1 und γ = T ist Teil des Zertifikats.
  4. K rigorose Vorzeichenwechsel von Z(t) in disjunkten Intervallen von (1, T).
  5. K = N  ⇒  Behauptung.
Näherungsnullstellen (acb.zeta_zeros) dienen nur der Platzierung von Stützstellen.
"""
from __future__ import annotations

import json
import sys
import time
from multiprocessing import Pool

import certify as C
from flint import acb

CHUNK = 400


def guidance_zeros(T: float) -> list[float]:
    """Nicht-rigorose Näherungen aller Ordinaten < T + Puffer (nur Platzierung)."""
    zs, n = [], 1
    while True:
        batch = acb.zeta_zeros(n, 2000)
        vals = [float(z.imag.mid()) for z in batch]
        zs.extend(vals)
        n += len(batch)
        if vals[-1] > T + 5:
            return zs


def _signs(points: list[float]) -> list[int]:
    C.set_prec(96)
    out = []
    for t in points:
        s = C.sign(C.hardy_z(t))
        if s == 0:
            # Stützstelle minimal verschieben und rigoros neu auswerten
            for eps in (1e-6, -1e-6, 1e-4, -1e-4):
                s = C.sign(C.hardy_z(t + eps))
                if s:
                    break
        out.append(s)
    return out


def _winding_piece(args):
    f_name, a, b = args
    C.set_prec(96)
    st = {}
    val = C.arg_change_segment(C.zeta, a, b, stats=st)
    return (float(val.mid()), float(val.rad()), st.get("segments", 0))


def winding_parallel(pool, s0, s1, t0, t1, pieces_per_unit=2.0):
    """Wie certify.winding_number, aber Segmente parallel; Summation der Einschlüsse
    erfolgt hier mit Mittelpunkt/Radius (Radien addiert, konservativ)."""
    jobs = [("zeta", a, b) for a, b in
            C.contour_pieces(s0, s1, t0, t1, lambda a, b: max(8, int(abs(b - a) * pieces_per_unit)))]
    res = pool.map(_winding_piece, jobs, chunksize=16)
    from flint import arb
    total = arb(0)
    segs = 0
    for mid, rad, s in res:
        # float-Konversion von Mittelpunkt/Radius konservativ abdecken (|Fehler| ≤ 2^-53 relativ)
        total += arb(mid, rad * (1 + 2.0**-50) + abs(mid) * 2.0**-52 + 1e-300)
        segs += s
    w = total / (2 * arb.pi())
    import math
    lo, hi = math.ceil(float(w.lower())), math.floor(float(w.upper()))
    if lo != hi or not (w - lo).contains(0):
        raise RuntimeError(f"Windungszahl nicht eindeutig: {w}")
    return lo, segs, w


def main(T_target: float) -> dict:
    t_start = time.time()
    zs = guidance_zeros(T_target)
    # T so wählen, dass die Oberkante mittig zwischen zwei Näherungsnullstellen liegt
    idx = max(i for i, z in enumerate(zs) if z <= T_target)
    T = (zs[idx] + zs[idx + 1]) / 2
    below = [z for z in zs if z < T]
    points = [1.0] + [(below[i] + below[i + 1]) / 2 for i in range(len(below) - 1)] + [T - (T - below[-1]) / 2]
    with Pool(4) as pool:
        wB, segB, _ = winding_parallel(pool, -1.0, 2.0, -1.0, 1.0, pieces_per_unit=4)
        wA, segA, wA_ball = winding_parallel(pool, -1.0, 2.0, 1.0, T)
        chunks = [points[i:i + CHUNK] for i in range(0, len(points), CHUNK)]
        signs = [s for part in pool.map(_signs, chunks) for s in part]
    if 0 in signs:
        raise RuntimeError("Unentscheidbares Vorzeichen trotz Verschiebung")
    K = sum(1 for i in range(len(signs) - 1) if signs[i] != signs[i + 1])
    result = {
        "T": T,
        "winding_B(-1,2;-1,1)": wB,
        "winding_A(-1,2;1,T)=N(T)": wA,
        "winding_A_enclosure": str(wA_ball),
        "sign_changes_K": K,
        "sample_points": len(points),
        "boundary_segments": segA + segB,
        "certified_RH_up_to_T": (wB == -1 and wA == K),
        "seconds": round(time.time() - t_start, 1),
        "prec_bits": 96,
    }
    return result


if __name__ == "__main__":
    T = float(sys.argv[1]) if len(sys.argv) > 1 else 1000.0
    print(json.dumps(main(T), indent=2))
