#!/usr/bin/env python3
"""Prüft die Rechenumgebung und führt je Werkzeug einen minimalen Funktionstest aus.

Ergebnis wird ausgegeben, nicht behauptet: Ein Werkzeug gilt nur dann als
verfügbar, wenn sein Smoke-Test hier tatsächlich durchläuft.
"""
import importlib
import shutil
import subprocess


def smoke_sympy():
    import sympy as sp
    x = sp.symbols("x")
    assert sp.factor(x**4 - 1) == (x - 1) * (x + 1) * (x**2 + 1)


def smoke_mpmath():
    import mpmath as mp
    mp.mp.dps = 50
    assert abs(mp.zeta(2) - mp.pi**2 / 6) < mp.mpf(10) ** -45


def smoke_numpy():
    import numpy as np
    assert np.allclose(np.linalg.eigvalsh([[2, 1], [1, 2]]), [1, 3])


def smoke_scipy():
    from scipy.integrate import quad
    val, err = quad(lambda t: t**2, 0, 1)
    assert abs(val - 1 / 3) < 1e-12


def smoke_networkx():
    import networkx as nx
    assert nx.is_planar(nx.complete_graph(4)) and not nx.is_planar(nx.complete_graph(5))


def smoke_z3():
    import z3
    a, b = z3.Ints("a b")
    s = z3.Solver()
    s.add(a * a + b * b == 25, a > b, b > 0)
    assert s.check() == z3.sat


def smoke_pysat():
    from pysat.solvers import Cadical153
    with Cadical153(bootstrap_with=[[1, 2], [-1], [-2]]) as s:
        assert s.solve() is False


def smoke_flint():
    from flint import acb, arb, ctx
    ctx.prec = 64
    assert arb("100").zeta_nzeros() == 29
    assert acb(2).zeta().overlaps(acb(arb.pi() ** 2 / 6))


PYTHON = {
    "sympy": smoke_sympy,
    "mpmath": smoke_mpmath,
    "numpy": smoke_numpy,
    "scipy": smoke_scipy,
    "networkx": smoke_networkx,
    "z3": smoke_z3,
    "pysat": smoke_pysat,
    "flint": smoke_flint,
}

BINARIES = ["gcc", "g++", "node", "lean", "lake", "coqc", "isabelle", "sage", "gp", "gap", "julia"]


def main():
    for name, test in PYTHON.items():
        try:
            mod = importlib.import_module(name)
            test()
            version = getattr(mod, "__version__", "") or (mod.get_version_string() if name == "z3" else "")
            print(f"OK       {name:10s} {version}")
        except Exception as exc:  # noqa: BLE001 — Diagnoseausgabe
            print(f"FEHLT    {name:10s} {type(exc).__name__}: {exc}")
    for binary in BINARIES:
        path = shutil.which(binary)
        if not path:
            print(f"FEHLT    {binary}")
            continue
        out = subprocess.run([binary, "--version"], capture_output=True, text=True)
        first = (out.stdout or out.stderr).strip().splitlines()[:1]
        print(f"OK       {binary:10s} {first[0] if first else path}")


if __name__ == "__main__":
    main()
