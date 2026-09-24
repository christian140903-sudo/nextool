"""Numerical check of the curvature no-go (Research Report 1, Proposition 3.2).

For S(Q) = N beta Re sum_p Tr Q_p on SU(2) (N = 2), the uniform Bakry–Emery
condition Ric - Hess S >= K > 0 needs Hess S(X, X) < Ric(X, X) = (N/2)|X|^2
everywhere, in the metric |X|^2 = -Tr X^2. At the pi-flux configuration
U_{x,mu} = eta_mu(x) = (-1)^(x_0 + ... + x_{mu-1}) (every plaquette -1) and
X_{x,mu} = c_mu (-1)^(x_0+x_1+x_2+x_3) T with sum_mu c_mu = 0, the proof gives
Hess S(X, X) = N beta 4d |X|^2 exactly. Here we check this by finite
differences along the geodesic Q_e(t) = exp(t X_e) Q_e.

The check is numerical (E4); the statement is proved in the report (E1).
"""

import numpy as np

from su2_lattice import qmul, qdag, shift

N, d, L = 2, 4, 4


def action_per_beta(U):
    """N * Re sum_p Tr Q_p = N * 2 * sum_p (Q_p)_0 for SU(2) quaternions."""
    total = 0.0
    for mu in range(d):
        for nu in range(mu + 1, d):
            P = qmul(qmul(U[mu], shift(U[nu], mu, 1)), qmul(qdag(shift(U[mu], nu, 1)), qdag(U[nu])))
            total += P[..., 0].sum()
    return N * 2 * total


def qexp(a):
    """exp(i a.sigma) for a vector field a of shape [..., 3]."""
    r = np.linalg.norm(a, axis=-1, keepdims=True)
    safe = np.where(r > 0, r, 1)
    return np.concatenate([np.cos(r), np.sin(r) * a / safe], axis=-1)


def main():
    x = np.indices((L,) * d)
    U = np.zeros((d,) + (L,) * d + (4,))
    for mu in range(d):
        eta = (-1.0) ** x[:mu].sum(axis=0) if mu > 0 else np.ones((L,) * d)
        U[mu, ..., 0] = eta
    # Every plaquette equals -1.
    for mu in range(d):
        for nu in range(mu + 1, d):
            P = qmul(qmul(U[mu], shift(U[nu], mu, 1)), qmul(qdag(shift(U[mu], nu, 1)), qdag(U[nu])))
            assert np.allclose(P[..., 0], -1) and np.allclose(P[..., 1:], 0)

    c = np.array([1.0, -1.0, 1.0, -1.0])          # sum c = 0: transverse to k = (pi, ..., pi)
    stagger = (-1.0) ** x.sum(axis=0)
    T = np.array([0.0, 0.0, 1.0])                   # X = i T.sigma, |X|^2 = -Tr X^2 = 2|T|^2
    a = np.stack([c[mu] * stagger[..., None] * T for mu in range(d)])
    norm2 = 2 * (a ** 2).sum()

    def S_t(t):
        return action_per_beta(np.stack([qmul(qexp(t * a[mu]), U[mu]) for mu in range(d)]))

    for h in (1e-2, 1e-3):
        second = (S_t(h) - 2 * S_t(0) + S_t(-h)) / h ** 2
        print(f"h={h:g}: Hess S(X,X)/(beta |X|^2) = {second / norm2:.6f}   predicted N*4d = {N * 4 * d}")
    ric = N / 2
    print(f"Ric/|X|^2 = N/2 = {ric}; Bakry-Emery fails for beta_SZZ >= {ric / (N * 4 * d):.6f} = 1/(8d) = {1 / (8 * d):.6f}")
    print(f"SZZ sufficient condition beta_SZZ < 1/(16(d-1)) = {1 / (16 * (d - 1)):.6f}")
    print(f"Wilson normalisation for SU(2) (beta_W = 4 beta_SZZ): method limited to [{4 / (16 * (d - 1)):.4f}, {4 / (8 * d):.4f}]")


if __name__ == '__main__':
    main()
