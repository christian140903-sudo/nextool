import mpmath as mp
mp.mp.dps = 40
_PHI = {}


def Phi(u, terms=30):
    """Riemanns Φ (Titchmarsh 2.16.1), gerade; für u ≥ 0 konvergiert die Reihe doppelt-exponentiell."""
    u = abs(u)
    key = (u, mp.mp.prec)
    if key in _PHI:
        return _PHI[key]
    val = _PHI[key] = 2 * mp.fsum((2 * mp.pi**2 * n**4 * mp.exp(9 * u / 2) - 3 * mp.pi * n**2 * mp.exp(5 * u / 2))
                       * mp.exp(-mp.pi * n**2 * mp.exp(2 * u)) for n in range(1, terms + 1))
    return val
if __name__ == "__main__":
    I = 2 * mp.quad(Phi, [0, 1, 2, 4])
    h = mp.mpf(1) / 2
    xi_half = h * h * (-h) * mp.pi ** (-h / 2) * mp.gamma(h / 2) * mp.zeta(h)
    print("int Phi  =", mp.nstr(I, 25))
    print("xi(1/2)  =", mp.nstr(xi_half, 25))
    print("Phi(0.7)-Phi(-0.7) =", mp.nstr(Phi(mp.mpf(0.7)) - Phi(mp.mpf(-0.7)), 5))
    t = mp.mpf("14.134725141734693790457251983562")
    print("Xi(gamma_1) via Phi =", mp.nstr(2 * mp.quad(lambda u: Phi(u) * mp.cos(t * u), mp.linspace(0, 4, 60)), 5))
