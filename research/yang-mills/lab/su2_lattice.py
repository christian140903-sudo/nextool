"""SU(2) Wilson lattice gauge theory in four dimensions.

Evidence class E4 (numerical). Nothing computed here is a proof; see
spec.pdf, Section 12. Purpose: locate the strong-coupling regime (where
rigorous expansions work), the crossover, and the scaling regime (where the
continuum limit lives), and watch the lattice mass gap in lattice units and
in physical units.

Action S = beta * sum_p (1 - 1/2 Tr U_p), beta = 4 / g0^2.
Links are unit quaternions U = a0 + i a.sigma (shape [..., 4]).
Update: Kennedy–Pendleton heat bath plus microcanonical over-relaxation,
checkerboard-parallel. Observables: plaquette, planar Wilson loops W(R,T),
Creutz ratios, and a zero-momentum 0++ glueball correlator built from
APE-smeared spatial plaquettes.

    python su2_lattice.py --selftest
    python su2_lattice.py --beta 2.3 --L 12 --therm 200 --meas 600 --out run.json
"""

import argparse
import json
import math
import time

import numpy as np

# ---------------------------------------------------------------- quaternions


def qmul(a, b):
    """Product of SU(2) elements in quaternion form (matches 2x2 matrices)."""
    a0, a1, a2, a3 = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    b0, b1, b2, b3 = b[..., 0], b[..., 1], b[..., 2], b[..., 3]
    return np.stack([
        a0 * b0 - a1 * b1 - a2 * b2 - a3 * b3,
        a0 * b1 + b0 * a1 - (a2 * b3 - a3 * b2),
        a0 * b2 + b0 * a2 - (a3 * b1 - a1 * b3),
        a0 * b3 + b0 * a3 - (a1 * b2 - a2 * b1),
    ], axis=-1)


_CONJ = np.array([1.0, -1.0, -1.0, -1.0])


def qdag(a):
    return a * _CONJ


def qnormalize(a):
    return a / np.linalg.norm(a, axis=-1, keepdims=True)


def to_matrix(a):
    """2x2 complex matrix a0 + i a.sigma (used only by the self-test)."""
    s1 = np.array([[0, 1], [1, 0]], complex)
    s2 = np.array([[0, -1j], [1j, 0]])
    s3 = np.array([[1, 0], [0, -1]], complex)
    return a[0] * np.eye(2) + 1j * (a[1] * s1 + a[2] * s2 + a[3] * s3)


# ---------------------------------------------------------------- lattice


def shift(field, mu, s):
    """field(x + s * mu_hat) for a field of shape (L, L, L, L, 4)."""
    return np.roll(field, -s, axis=mu)


def staple_sum(U, mu, dims=(0, 1, 2, 3)):
    """Sum over the staples of link mu at every site, so that the local action
    of U_mu(x) is -(beta/2) Re Tr(U_mu(x) V(x))."""
    Umu = U[mu]
    V = np.zeros_like(Umu)
    for nu in dims:
        if nu == mu:
            continue
        Unu = U[nu]
        Unu_xpmu = shift(Unu, mu, 1)
        V += qmul(qmul(Unu_xpmu, qdag(shift(Umu, nu, 1))), qdag(Unu))
        Unu_xmnu = shift(Unu, nu, -1)
        V += qmul(qmul(qdag(shift(Unu_xpmu, nu, -1)), qdag(shift(Umu, nu, -1))), Unu_xmnu)
    return V


def kennedy_pendleton(a, rng):
    """Sample x0 in [-1, 1] with density ~ sqrt(1 - x0^2) exp(a x0), a > 0."""
    x0 = np.empty_like(a)
    todo = np.ones(a.shape, bool)
    while todo.any():
        idx = np.flatnonzero(todo)
        aa = a.ravel()[idx]
        r1, r2, r3 = 1.0 - rng.random((3, idx.size))
        lam2 = -(np.log(r1) + np.cos(2 * np.pi * r2) ** 2 * np.log(r3)) / (2 * aa)
        acc = rng.random(idx.size) ** 2 <= 1 - lam2
        x0.ravel()[idx[acc]] = 1 - 2 * lam2[acc]
        todo.ravel()[idx[acc]] = False
    return x0


def random_su2_with_x0(x0, rng):
    v = rng.normal(size=x0.shape + (3,))
    v /= np.linalg.norm(v, axis=-1, keepdims=True)
    v *= np.sqrt(np.clip(1 - x0 ** 2, 0, None))[..., None]
    return np.concatenate([x0[..., None], v], axis=-1)


class Lattice:
    def __init__(self, L, beta, seed=0, hot=True):
        self.L, self.beta = L, beta
        self.rng = np.random.default_rng(seed)
        shape = (4, L, L, L, L, 4)
        if hot:
            self.U = qnormalize(self.rng.normal(size=shape))
        else:
            self.U = np.zeros(shape)
            self.U[..., 0] = 1.0
        grid = np.indices((L, L, L, L)).sum(axis=0)
        self.parity = [grid % 2 == 0, grid % 2 == 1]

    def _update(self, mu, mask, heatbath):
        V = staple_sum(self.U, mu)
        k = np.linalg.norm(V, axis=-1)
        W = V / k[..., None]
        U = self.U[mu]
        if heatbath:
            X = random_su2_with_x0(kennedy_pendleton(self.beta * k[mask], self.rng), self.rng)
            U[mask] = qmul(X, qdag(W[mask]))
        else:  # over-relaxation: U -> W^dag U^dag W^dag keeps Re Tr(U W) fixed
            Wm = W[mask]
            U[mask] = qmul(qmul(qdag(Wm), qdag(U[mask])), qdag(Wm))

    def sweep(self, n_or=2):
        for heatbath in [True] + [False] * n_or:
            for mu in range(4):
                for mask in self.parity:
                    self._update(mu, mask, heatbath)
        self.U = qnormalize(self.U)

    # ------------------------------------------------------------ observables

    def plaquette(self):
        U, total = self.U, 0.0
        for mu in range(4):
            for nu in range(mu + 1, 4):
                P = qmul(qmul(U[mu], shift(U[nu], mu, 1)), qmul(qdag(shift(U[mu], nu, 1)), qdag(U[nu])))
                total += P[..., 0].mean()
        return total / 6

    def wilson_loops(self, rmax):
        """W[R-1, T-1] averaged over all sites and ordered plane pairs."""
        U = self.U
        lines = []
        for mu in range(4):
            seg = [None, U[mu].copy()]
            for r in range(1, rmax):
                seg.append(qmul(seg[r], shift(U[mu], mu, r)))
            lines.append(seg)
        W = np.zeros((rmax, rmax))
        for mu in range(4):
            for nu in range(4):
                if mu == nu:
                    continue
                for R in range(1, rmax + 1):
                    for T in range(1, rmax + 1):
                        loop = qmul(qmul(lines[mu][R], shift(lines[nu][T], mu, R)),
                                    qmul(qdag(shift(lines[mu][R], nu, T)), qdag(lines[nu][T])))
                        W[R - 1, T - 1] += loop[..., 0].mean()
        return W / 12

    def glueball_operator(self, n_smear=12, alpha=0.5):
        """Zero-momentum 0++ operator per time slice from APE-smeared spatial
        plaquettes (time = axis 0)."""
        spatial = (1, 2, 3)
        S = self.U.copy()
        for _ in range(n_smear):
            new = S.copy()
            for i in spatial:
                new[i] = qnormalize(S[i] + alpha * staple_sum_dag(S, i, spatial))
            S = new
        O = np.zeros(self.L)
        for i in spatial:
            for j in spatial:
                if j <= i:
                    continue
                P = qmul(qmul(S[i], shift(S[j], i, 1)), qmul(qdag(shift(S[i], j, 1)), qdag(S[j])))
                O += P[..., 0].sum(axis=(1, 2, 3))
        return O


def staple_sum_dag(U, mu, dims):
    """Staples oriented parallel to U_mu (for smearing): sum of V^dag."""
    return qdag(staple_sum(U, mu, dims))


# ---------------------------------------------------------------- statistics


def jackknife(samples, fn, nbins=20):
    """Jackknife mean and error of fn(mean of samples) with binning."""
    samples = np.asarray(samples)
    n = len(samples) // nbins * nbins
    bins = samples[:n].reshape(nbins, -1, *samples.shape[1:]).mean(axis=1)
    total = bins.sum(axis=0)
    full = fn(total / nbins)
    reps = np.array([fn((total - b) / (nbins - 1)) for b in bins])
    err = np.sqrt((nbins - 1) * np.mean((reps - reps.mean(axis=0)) ** 2, axis=0))
    return full, err


def creutz(W):
    """chi(R) = -ln[W(R,R) W(R-1,R-1) / (W(R,R-1) W(R-1,R))], R = 2..rmax."""
    out = []
    for R in range(2, W.shape[0] + 1):
        num = W[R - 1, R - 1] * W[R - 2, R - 2]
        den = W[R - 1, R - 2] * W[R - 2, R - 1]
        out.append(-math.log(num / den) if num > 0 and den > 0 else float('nan'))
    return np.array(out)


def glueball_corr(Os, L):
    """Connected zero-momentum correlator C(t), averaged over sources."""
    Os = np.asarray(Os)
    def fn(m):
        mean_O, OO = m[:L], m[L:].reshape(L, L)
        c = np.array([np.mean([OO[s, (s + t) % L] for s in range(L)]) for t in range(L // 2 + 1)])
        return c - mean_O.mean() ** 2
    feats = np.concatenate([Os, (Os[:, :, None] * Os[:, None, :]).reshape(len(Os), -1)], axis=1)
    return feats, fn


# ---------------------------------------------------------------- self-test


def selftest():
    rng = np.random.default_rng(1)
    a, b = qnormalize(rng.normal(size=4)), qnormalize(rng.normal(size=4))
    assert np.allclose(to_matrix(qmul(a, b)), to_matrix(a) @ to_matrix(b)), 'qmul != matrix product'
    assert np.allclose(to_matrix(qdag(a)), to_matrix(a).conj().T), 'qdag != adjoint'
    # Heat-bath marginal: E[x0] = I2(a)/I1(a) for density ~ sqrt(1-x^2) e^{a x}.
    for aval in (0.7, 3.0, 12.0):
        xs = kennedy_pendleton(np.full(400_000, aval), rng)
        grid = np.linspace(-1, 1, 200_001)
        w = np.sqrt(1 - grid ** 2) * np.exp(aval * grid)
        exact = np.trapezoid(grid * w, grid) / np.trapezoid(w, grid)
        assert abs(xs.mean() - exact) < 4e-3, (aval, xs.mean(), exact)
    # Cold lattice: plaquette 1, all Wilson loops 1; gauge invariance of the plaquette.
    lat = Lattice(4, 2.0, seed=2, hot=False)
    assert abs(lat.plaquette() - 1) < 1e-12 and np.allclose(lat.wilson_loops(2), 1)
    lat = Lattice(4, 2.0, seed=3, hot=True)
    p0 = lat.plaquette()
    g = qnormalize(rng.normal(size=(4, 4, 4, 4, 4)))
    for mu in range(4):
        lat.U[mu] = qmul(qmul(g, lat.U[mu]), qdag(shift(g, mu, 1)))
    assert abs(lat.plaquette() - p0) < 1e-12, 'plaquette not gauge invariant'
    # Over-relaxation preserves the action exactly.
    s0 = lat.plaquette()
    for mu in range(4):
        for mask in lat.parity:
            lat._update(mu, mask, heatbath=False)
    assert abs(lat.plaquette() - s0) < 1e-10, 'over-relaxation changed the action'
    print('selftest passed: algebra, heat-bath marginal, gauge invariance, over-relaxation')


# ---------------------------------------------------------------- driver


def run(beta, L, therm, meas, every, rmax, seed):
    lat = Lattice(L, beta, seed=seed)
    t0 = time.time()
    for _ in range(therm):
        lat.sweep()
    plaq, loops, glue = [], [], []
    for n in range(meas):
        lat.sweep()
        if n % every == 0:
            plaq.append(lat.plaquette())
            loops.append(lat.wilson_loops(rmax))
            glue.append(lat.glueball_operator())
    p, dp = jackknife(np.array(plaq), lambda m: m)
    Wm, dW = jackknife(np.array(loops), lambda m: m)
    chi, dchi = jackknife(np.array(loops), creutz)
    feats, fn = glueball_corr(glue, L)
    C, dC = jackknife(feats, fn)
    meff, dmeff = jackknife(feats, lambda m: np.log(np.abs(fn(m)[:-1] / fn(m)[1:])))
    return {
        'beta': beta, 'L': L, 'therm': therm, 'meas': meas, 'every': every, 'seed': seed,
        'n_measurements': len(plaq), 'seconds': round(time.time() - t0, 1),
        'plaquette': [float(p), float(dp)],
        'wilson_loops': Wm.tolist(), 'wilson_loops_err': dW.tolist(),
        'creutz': chi.tolist(), 'creutz_err': dchi.tolist(),
        'glueball_C': C.tolist(), 'glueball_C_err': dC.tolist(),
        'glueball_meff': meff.tolist(), 'glueball_meff_err': dmeff.tolist(),
    }


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--selftest', action='store_true')
    ap.add_argument('--beta', type=float, default=2.3)
    ap.add_argument('--L', type=int, default=12)
    ap.add_argument('--therm', type=int, default=200)
    ap.add_argument('--meas', type=int, default=600)
    ap.add_argument('--every', type=int, default=2)
    ap.add_argument('--rmax', type=int, default=4)
    ap.add_argument('--seed', type=int, default=0)
    ap.add_argument('--out')
    args = ap.parse_args()
    if args.selftest:
        selftest()
    else:
        result = run(args.beta, args.L, args.therm, args.meas, args.every, args.rmax, args.seed)
        text = json.dumps(result, indent=1)
        if args.out:
            with open(args.out, 'w') as f:
                f.write(text + '\n')
        print(text[:600])
