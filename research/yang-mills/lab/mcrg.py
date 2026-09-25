"""Monte Carlo renormalization group for SU(2): how long is the bridge?

Evidence class E4. Blocks the lattice by a factor 2 (Swendsen-type: double
link plus c times the six bent paths, projected to SU(2)) and measures the
plaquette and the 1x2 rectangle on the blocked lattices. Matching the n-times
blocked lattice of size L at coupling beta with the (n-1)-times blocked
lattice of size L/2 at beta' gives the RG step beta -> beta' of the Wilson
coupling that best reproduces the blocked observables.

    python mcrg.py --selftest
    python mcrg.py --beta 2.2 --L 16 --levels 2 --out runs/mcrg_L16_b2.2.json
"""

import argparse
import json
import time

import numpy as np

from su2_lattice import Lattice, jackknife, qdag, qmul, qnormalize, shift


def block(U, c):
    """One factor-2 blocking step. U has shape (4, L, L, L, L, 4)."""
    out = []
    for mu in range(4):
        V = qmul(U[mu], shift(U[mu], mu, 1))
        for nu in range(4):
            if nu == mu:
                continue
            up = qmul(qmul(U[nu], shift(U[mu], nu, 1)),
                      qmul(shift(shift(U[mu], nu, 1), mu, 1), qdag(shift(U[nu], mu, 2))))
            Unu_m = shift(U[nu], nu, -1)
            down = qmul(qmul(qdag(Unu_m), shift(U[mu], nu, -1)),
                        qmul(shift(shift(U[mu], nu, -1), mu, 1), shift(Unu_m, mu, 2)))
            V = V + c * (up + down)
        out.append(qnormalize(V)[::2, ::2, ::2, ::2])
    return np.stack(out)


def plaquette_and_rectangle(U):
    """Average 1/2 Tr of 1x1 and 1x2 loops (both orientations)."""
    P = R = 0.0
    for mu in range(4):
        for nu in range(4):
            if nu == mu:
                continue
            Umu, Unu = U[mu], U[nu]
            if mu < nu:
                p = qmul(qmul(Umu, shift(Unu, mu, 1)), qmul(qdag(shift(Umu, nu, 1)), qdag(Unu)))
                P += p[..., 0].mean()
            two = qmul(Umu, shift(Umu, mu, 1))
            r = qmul(qmul(two, shift(Unu, mu, 2)), qmul(qdag(shift(two, nu, 1)), qdag(Unu)))
            R += r[..., 0].mean()
    return P / 6, R / 12


def run(beta, L, levels, c, therm, meas, every, seed):
    lat = Lattice(L, beta, seed=seed)
    t0 = time.time()
    for _ in range(therm):
        lat.sweep()
    samples = []
    for n in range(meas):
        lat.sweep()
        if n % every:
            continue
        U, row = lat.U, []
        for level in range(levels + 1):
            row.extend(plaquette_and_rectangle(U))
            if level < levels:
                U = block(U, c)
        samples.append(row)
    mean, err = jackknife(np.array(samples), lambda m: m)
    return {'beta': beta, 'L': L, 'levels': levels, 'c': c, 'seed': seed, 'n_measurements': len(samples),
            'seconds': round(time.time() - t0, 1),
            # per blocking level n = 0..levels: [P_n, R_n]
            'observables': np.array(mean).reshape(levels + 1, 2).tolist(),
            'errors': np.array(err).reshape(levels + 1, 2).tolist()}


def selftest():
    # A cold (trivial) configuration stays trivial under blocking.
    lat = Lattice(8, 2.0, seed=0, hot=False)
    B = block(lat.U, 0.5)
    assert B.shape == (4, 4, 4, 4, 4, 4) and np.allclose(B[..., 0], 1)
    # Blocking is gauge covariant: blocked plaquettes are gauge invariant.
    lat = Lattice(8, 2.0, seed=1)
    for _ in range(3):
        lat.sweep()
    p0 = plaquette_and_rectangle(block(lat.U, 0.5))
    rng = np.random.default_rng(3)
    g = qnormalize(rng.normal(size=(8, 8, 8, 8, 4)))
    for mu in range(4):
        lat.U[mu] = qmul(qmul(g, lat.U[mu]), qdag(shift(g, mu, 1)))
    p1 = plaquette_and_rectangle(block(lat.U, 0.5))
    assert np.allclose(p0, p1), (p0, p1)
    print('selftest passed: trivial configuration, gauge covariance of blocking')


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--selftest', action='store_true')
    ap.add_argument('--beta', type=float, default=2.2)
    ap.add_argument('--L', type=int, default=16)
    ap.add_argument('--levels', type=int, default=2)
    ap.add_argument('--c', type=float, default=0.5)
    ap.add_argument('--therm', type=int, default=150)
    ap.add_argument('--meas', type=int, default=450)
    ap.add_argument('--every', type=int, default=3)
    ap.add_argument('--seed', type=int, default=7)
    ap.add_argument('--out')
    a = ap.parse_args()
    if a.selftest:
        selftest()
    else:
        res = run(a.beta, a.L, a.levels, a.c, a.therm, a.meas, a.every, a.seed)
        if a.out:
            with open(a.out, 'w') as f:
                f.write(json.dumps(res, indent=1) + '\n')
        print(json.dumps(res)[:400])
