#!/usr/bin/env python3
"""WP-2D: Sind die Eigenfunktionen der Weil-Form (Fenster [−L,L]) gemeinsame Eigenfunktionen eines
Sturm–Liouville-Operators D y = −(p y′)′ + q y, p = (L²−x²)·(1 + a₁x² + … ), q = b₀ + b₁x² + … ?

Methode: Für die m tiefsten Eigenfunktionen φ_i (beide Paritäten) wird das lineare Ausgleichsproblem
  −p′φ_i′ − pφ_i″ + qφ_i − μ_iφ_i ≈ 0   an inneren Stützstellen |x| ≤ 0.8L
in den Unbekannten (a, b, μ) gelöst. Maß: relatives Residuum je Eigenfunktion.
Kalibrierung: (+) Prolate-Fall (Sinc-Kern, Slepian) muss ~exakt passen; (−) generischer Kern nicht.
Evidenzstatus: NUMERICAL/HEURISTIC (Entdeckungswerkzeug).
"""
import sys, json, pickle
import numpy as np
import mpmath as mp


def eigfuncs_from_blocks(Be, Bo, L, om, m_even, m_odd):
    """Eigenfunktionen (als Callables für f, f′, f″) aus den Weil-Blöcken."""
    Ee, Ve = mp.eigsy(mp.matrix(Be)); Eo, Vo = mp.eigsy(mp.matrix(Bo))
    oe = sorted(range(len(Ee)), key=lambda i: Ee[i])[:m_even]
    oo = sorted(range(len(Eo)), key=lambda i: Eo[i])[:m_odd]
    L = float(L); w = np.array([float(x) for x in om])
    funcs = []
    for i in oe:
        v = np.array([float(Ve[r, i]) for r in range(Ve.rows)])
        c0, ck = v[0] / np.sqrt(2 * L), v[1:] / np.sqrt(L)
        funcs.append((float(Ee[i]), "even",
                      lambda x, c0=c0, ck=ck: c0 + np.cos(np.outer(x, w[1:])) @ ck,
                      lambda x, ck=ck: -np.sin(np.outer(x, w[1:])) @ (ck * w[1:]),
                      lambda x, ck=ck: -np.cos(np.outer(x, w[1:])) @ (ck * w[1:] ** 2)))
    for i in oo:
        v = np.array([float(Vo[r, i]) for r in range(Vo.rows)]) / np.sqrt(L)
        funcs.append((float(Eo[i]), "odd",
                      lambda x, v=v: np.sin(np.outer(x, w[1:])) @ v,
                      lambda x, v=v: np.cos(np.outer(x, w[1:])) @ (v * w[1:]),
                      lambda x, v=v: -np.sin(np.outer(x, w[1:])) @ (v * w[1:] ** 2)))
    funcs.sort(key=lambda t: t[0])
    return funcs


def fit_sturm_liouville(funcs, L, deg_p=2, deg_q=3, frac=0.8, M=400):
    """Least-squares-Fit; gibt relative Residuen je Funktion und Koeffizienten zurück."""
    x = np.linspace(-frac * L, frac * L, M)
    m = len(funcs)
    rows, cols = [], None
    # Unbekannte: a_1..a_deg_p (a_0 = 1 fest), b_0..b_deg_q, μ_1..μ_m
    nA, nB = deg_p, deg_q + 1
    blocks = []
    rhs = []
    for i, (_, _, f, f1, f2) in enumerate(funcs):
        F, F1, F2 = f(x), f1(x), f2(x)
        scale = np.sqrt(np.mean(F ** 2))
        base = L ** 2 - x ** 2          # p = base·(1 + Σ a_j x^{2j})
        # D φ = −p′φ′ − pφ″ + qφ ;  p′ = base′·r + base·r′, base′ = −2x
        def dterm(r, rp):
            p = base * r; pp = -2 * x * r + base * rp
            return -pp * F1 - p * F2
        A = np.zeros((M, nA + nB + m))
        for j in range(1, deg_p + 1):
            A[:, j - 1] = dterm(x ** (2 * j), 2 * j * x ** (2 * j - 1))
        for j in range(nB):
            A[:, nA + j] = x ** (2 * j) * F
        A[:, nA + nB + i] = -F
        blocks.append(A / scale)
        rhs.append(-dterm(np.ones_like(x), np.zeros_like(x)) / scale)
    A = np.vstack(blocks); y = np.concatenate(rhs)
    sol, *_ = np.linalg.lstsq(A, y, rcond=None)
    res = A @ sol - y
    per = [np.linalg.norm(res[i * M:(i + 1) * M]) / np.linalg.norm(y[i * M:(i + 1) * M]) for i in range(m)]
    return per, sol


def sinc_control(L, c, n=400, m=8):
    """(+)-Kontrolle: Eigenfunktionen des Zeit-Band-Begrenzungsoperators (Kern sin(c(x−y))/(π(x−y)))."""
    xg, wg = np.polynomial.legendre.leggauss(n)
    xg, wg = xg * L, wg * L
    K = np.sinc(c * (xg[:, None] - xg[None, :]) / np.pi) * c / np.pi
    S = np.sqrt(wg)[:, None] * K * np.sqrt(wg)[None, :]
    E, V = np.linalg.eigh(S)
    idx = np.argsort(-E)[:m]
    funcs = []
    for i in idx:
        u = V[:, i] / np.sqrt(wg)
        # Nyström-Interpolation φ(x) = (1/E) ∫ K(x,y) φ(y) dy, Ableitungen analytisch
        def f(x, u=u, e=E[i]):
            d = x[:, None] - xg[None, :]
            return (np.sinc(c * d / np.pi) * c / np.pi) @ (wg * u) / e
        def fd(x, u=u, e=E[i], k=1):
            h = 1e-4
            return (f(x + h, u, e) - f(x - h, u, e)) / (2 * h)
        def fdd(x, u=u, e=E[i]):
            h = 1e-3
            return (f(x + h, u, e) - 2 * f(x, u, e) + f(x - h, u, e)) / h ** 2
        funcs.append((E[i], "?", f, fd, fdd))
    return funcs


def gauss_control(L, s, n=400, m=8):
    """(−)-Kontrolle: Gauß-Kern exp(−(x−y)²/(2s²)) — kein bekannter kommutierender Differentialoperator."""
    xg, wg = np.polynomial.legendre.leggauss(n)
    xg, wg = xg * L, wg * L
    kern = lambda d: np.exp(-d ** 2 / (2 * s ** 2))
    S = np.sqrt(wg)[:, None] * kern(xg[:, None] - xg[None, :]) * np.sqrt(wg)[None, :]
    E, V = np.linalg.eigh(S)
    idx = np.argsort(-E)[:m]
    funcs = []
    for i in idx:
        u = V[:, i] / np.sqrt(wg)
        f = lambda x, u=u, e=E[i]: kern(x[:, None] - xg[None, :]) @ (wg * u) / e
        fd = lambda x, f=f: (f(x + 1e-4) - f(x - 1e-4)) / 2e-4
        fdd = lambda x, f=f: (f(x + 1e-3) - 2 * f(x) + f(x - 1e-3)) / 1e-6
        funcs.append((E[i], "?", f, fd, fdd))
    return funcs


if __name__ == "__main__":
    cache = sys.argv[1] if len(sys.argv) > 1 else "cache_L0.8_N30_d50.pkl"
    L = float(sys.argv[2]) if len(sys.argv) > 2 else 0.8
    m_each = int(sys.argv[3]) if len(sys.argv) > 3 else 4
    mp.mp.dps = 50
    Be, Bo, om = pickle.load(open(cache, "rb"))
    out = {}
    wf = eigfuncs_from_blocks(Be, Bo, L, om, m_each, m_each)
    for dp, dq in [(0, 1), (1, 2), (2, 3), (3, 4)]:
        per, sol = fit_sturm_liouville(wf, L, dp, dq)
        out[f"weil_deg_p{dp}_q{dq}"] = [float(f"{r:.3g}") for r in per]
    for dp, dq in [(0, 1), (2, 3)]:
        out[f"control_sinc_c5_deg_p{dp}_q{dq}"] = [float(f"{r:.3g}") for r in fit_sturm_liouville(sinc_control(L, 5.0), L, dp, dq)[0]]
        out[f"control_gauss_s0.3_deg_p{dp}_q{dq}"] = [float(f"{r:.3g}") for r in fit_sturm_liouville(gauss_control(L, 0.3), L, dp, dq)[0]]
    out["weil_eigs_order"] = [(f"{e:.3g}", par) for e, par, *_ in wf]
    print(json.dumps(out, indent=1))
