#!/usr/bin/env python3
"""Rigorose (computerassistierte) Nullstellen-Zertifikate mit Ball-Arithmetik (Arb via python-flint).

Logische Grundlage — alles Weitere ist Buchhaltung:

(A) Argumentprinzip. Ist f auf einem Rechteck R holomorph bis auf Pole, auf dem Rand ∂R
    nullstellen- und polfrei, dann gilt  (1/2π) Δ_{∂R} arg f = #Nullstellen − #Pole in R
    (mit Vielfachheit). Wir zerlegen ∂R in Segmente [z0,z1]. Für jedes Segment wird eine
    Box B ⊇ [z0,z1] gebildet und F = f(B) rigoros eingeschlossen. Enthält die Box F nicht
    die 0, so liegt F (konvex) in einer offenen Halbebene durch 0; die stetige
    Argumentänderung längs des Segments liegt dann in (−π, π) und ist gleich dem
    Hauptwert Arg(f(z1)/f(z0)), den Arb rigoros einschließt. Sonst wird halbiert.
    Die Summe der Einschlüsse, geteilt durch 2π, muss genau eine ganze Zahl enthalten.

(B) Vorzeichenwechsel. Hardys Z(t) = e^{iθ(t)} ζ(1/2+it) ist für reelle t reell und stetig.
    Haben Z(a) und Z(b) rigoros verschiedene Vorzeichen, so besitzt ζ auf {1/2+it : a<t<b}
    eine Nullstelle ungerader Ordnung. Nur exp(iθ) wird gebraucht, daher ist der Zweig
    von log Γ irrelevant.

(C) Schluss. K disjunkte Vorzeichenwechsel-Intervalle in (0,T] und N(T) = K (aus (A))
    ⇒ alle Nullstellen mit 0 < γ ≤ T sind einfach und liegen auf Re s = 1/2.

Näherungswerte (z. B. Nullstellen aus nicht-rigoroser Rechnung) dienen nur als
Platzierungshilfe für Stützstellen; die Korrektheit hängt ausschließlich von den
rigorosen Einschlüssen ab.
"""
from __future__ import annotations

import math
from typing import Callable

from flint import acb, arb, ctx

Func = Callable[[acb], acb]

PI = None  # wird nach Setzen der Präzision gefüllt


def set_prec(bits: int) -> None:
    global PI
    ctx.prec = bits
    PI = arb.pi()


set_prec(96)


def box(z0: complex, z1: complex) -> acb:
    """Achsenparallele Box, die das Segment [z0, z1] enthält."""
    re_mid, im_mid = (z0.real + z1.real) / 2, (z0.imag + z1.imag) / 2
    re_rad, im_rad = abs(z1.real - z0.real) / 2, abs(z1.imag - z0.imag) / 2
    # Radien großzügig aufrunden, damit Rundung der Mittelpunkte abgedeckt ist.
    pad = 1e-15 * (1 + abs(z0) + abs(z1))
    return acb(arb(re_mid, re_rad + pad), arb(im_mid, im_rad + pad))


def excludes_zero(w: acb) -> bool:
    """True, wenn die Box w die 0 sicher nicht enthält."""
    return not (w.real.contains(0) and w.imag.contains(0))


def pt(z: complex) -> acb:
    return acb(z.real, z.imag)


def arg_change_segment(f: Func, z0: complex, z1: complex, max_depth: int = 40,
                       stats: dict | None = None) -> arb:
    """Rigoroser Einschluss der stetigen Argumentänderung von f längs [z0, z1]."""
    stack = [(z0, z1, 0)]
    total = arb(0)
    while stack:
        a, b, d = stack.pop()
        if d > max_depth:
            raise RuntimeError(f"Segment nicht zertifizierbar bei {a}..{b} (Nullstelle nahe Rand?)")
        F = f(box(a, b))
        if excludes_zero(F):
            inc = (f(pt(b)) / f(pt(a))).arg()
            if inc.rad() < 0.5:  # Hauptwert sauber bestimmt (nicht über den Schnitt verschmiert)
                total += inc
                if stats is not None:
                    stats["segments"] = stats.get("segments", 0) + 1
                continue
        m = (a + b) / 2
        stack.append((m, b, d + 1))
        stack.append((a, m, d + 1))
    return total


def edge_points(a: complex, b: complex, n: int) -> list[complex]:
    """n+1 Punkte von a nach b mit EXAKTEN Endpunkten a und b.
    (Failure Log F-2: a + (b−a)·1.0 ist in Gleitkomma nicht immer b; die Kontur wäre dann nicht geschlossen.)"""
    pts = [a + (b - a) * (j / n) for j in range(n + 1)]
    pts[0], pts[-1] = a, b
    return pts


def contour_pieces(sigma0: float, sigma1: float, t0: float, t1: float, pieces) -> list[tuple[complex, complex]]:
    """Segmente des positiv orientierten Rechteckrands; aufeinanderfolgende Segmente teilen exakt ihre Endpunkte.
    pieces: int (je Kante) oder Funktion (a, b) -> int."""
    corners = [complex(sigma1, t0), complex(sigma1, t1), complex(sigma0, t1), complex(sigma0, t0)]
    out = []
    for k in range(4):
        a, b = corners[k], corners[(k + 1) % 4]
        n = pieces(a, b) if callable(pieces) else pieces
        pts = edge_points(a, b, n)
        out.extend(zip(pts[:-1], pts[1:]))
    # Geschlossenheit exakt prüfen
    assert out[-1][1] == out[0][0] and all(out[i][1] == out[i + 1][0] for i in range(len(out) - 1))
    return out


def winding_number(f: Func, sigma0: float, sigma1: float, t0: float, t1: float,
                   pieces: int = 64, stats: dict | None = None) -> int:
    """#Nullstellen − #Pole von f im Rechteck [σ0,σ1]×[t0,t1], rigoros zertifiziert."""
    total = arb(0)
    for za, zb in contour_pieces(sigma0, sigma1, t0, t1, pieces):
        total += arg_change_segment(f, za, zb, stats=stats)
    w = total / (2 * PI)
    lo = math.ceil(float(w.lower()))
    hi = math.floor(float(w.upper()))
    if lo != hi:
        raise RuntimeError(f"Windungszahl nicht eindeutig: {w}")
    n = lo
    if not (w - n).contains(0):
        raise RuntimeError(f"Inkonsistenter Einschluss: {w}")
    return n


# --- Riemann zeta -------------------------------------------------------------------------

def zeta(s: acb) -> acb:
    return s.zeta()


def hardy_z(t: float) -> arb:
    """Rigoroser Einschluss von Z(t) (reell)."""
    tt = arb(t)
    s = acb(arb(0.5), tt)
    theta = acb(arb(0.25), tt / 2).lgamma().imag - tt / 2 * arb.pi().log()
    val = acb(0, theta).exp() * s.zeta()
    if not val.imag.contains(0):
        raise RuntimeError("Z(t) nicht reell eingeschlossen — Implementierungsfehler")
    return val.real


def sign(x: arb) -> int:
    if x > 0:
        return 1
    if x < 0:
        return -1
    return 0


def count_sign_changes(points: list[float]) -> tuple[int, list[tuple[float, float]]]:
    """Rigoros zertifizierte Vorzeichenwechsel von Z an den Stützstellen (streng aufsteigend)."""
    signs = []
    for t in points:
        s = sign(hardy_z(t))
        if s == 0:
            raise RuntimeError(f"Vorzeichen von Z({t}) nicht entscheidbar — Stützstelle verschieben")
        signs.append(s)
    changes = [(points[i], points[i + 1]) for i in range(len(points) - 1) if signs[i] != signs[i + 1]]
    return len(changes), changes
