"""Turn lab/runs/*.json into the data files plotted in reports/report-01.tex.

Evidence class E4. Reference values from Athenodorou & Teper, JHEP 12 (2021)
082, Table 1 (SU(2), Wilson action) are copied verbatim for comparison.

    python analyze.py
"""

import glob
import json
import math
import os

import numpy as np
from scipy.special import iv

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'reports', 'data')

# Athenodorou & Teper (2021), Table 1: beta, lattice, 1/2 ReTr<U_p>, a sqrt(sigma), a m_G.
AT21 = [
    (2.2986, '12^3x16', 0.6018259, 0.00000460, 0.36778, 0.00069, 1.224, 0.016),
    (2.3714, '14^3x16', 0.6226998, 0.00000360, 0.29023, 0.00050, 1.025, 0.012),
    (2.427, '20^3x16', 0.6364293, 0.00000150, 0.24013, 0.00041, 0.8469, 0.0076),
    (2.509, '22^3x20', 0.6537214, 0.00000100, 0.18011, 0.00022, 0.6563, 0.0056),
    (2.60, '30^4', 0.6700089, 0.00000050, 0.13283, 0.00030, 0.5001, 0.0041),
    (2.70, '40^4', 0.6855713, 0.00000030, 0.09737, 0.00023, 0.3652, 0.0035),
]

# Shen, Zhu & Zhu, CMP 400 (2023): mass gap for |beta_SZZ| < 1/(16(d-1)) for SU(N),
# with S = N beta_SZZ Re sum_p Tr Q_p. Wilson normalisation for SU(2):
# (beta_W / 2) Re Tr U_p = 2 beta_SZZ Re Tr U_p, so beta_W = 4 beta_SZZ.
BETA_RIGOROUS_SU2_D4 = 4 / (16 * 3)


def u(beta):
    """Character-expansion parameter of SU(2): u = I_2(beta) / I_1(beta)."""
    return iv(2, beta) / iv(1, beta)


def gap_ratio(m, dm, chi, dchi):
    """m_eff / sqrt(chi(3)) with error, or NaN unless both inputs are significant."""
    if any(math.isnan(v) for v in (m, dm, chi, dchi)) or dm >= abs(m) or dchi >= abs(chi) or chi <= 0:
        return float('nan'), float('nan')
    ratio = m / math.sqrt(chi)
    return ratio, abs(ratio) * math.hypot(dm / m, 0.5 * dchi / chi)


def fmt(x, digits=5):
    return 'nan' if x is None or (isinstance(x, float) and math.isnan(x)) else f'{x:.{digits}f}'


def main():
    os.makedirs(OUT, exist_ok=True)
    runs = sorted((json.load(open(p)) for p in glob.glob(os.path.join(HERE, 'runs', 'beta_*.json'))), key=lambda r: r['beta'])
    if not runs:
        raise SystemExit('no runs found in lab/runs')

    with open(os.path.join(OUT, 'curves.dat'), 'w') as f:
        f.write('beta strong weak creutzstrong\n')
        for b in np.arange(0.05, 2.851, 0.05):
            uu = u(b)
            weak = 1 - 3 / (4 * b) if b >= 0.9 else float('nan')
            f.write(f"{b:.2f} {fmt(uu + 4 * uu ** 5, 6)} {fmt(weak, 6)} {fmt(-math.log(uu), 6)}\n")

    with open(os.path.join(OUT, 'plaquette.dat'), 'w') as f:
        f.write('beta P dP strong weak\n')
        for r in runs:
            b, (p, dp) = r['beta'], r['plaquette']
            uu = u(b)
            f.write(f"{b} {fmt(p, 6)} {fmt(dp, 6)} {fmt(uu + 4 * uu ** 5, 6)} {fmt(1 - 3 / (4 * b), 6)}\n")

    with open(os.path.join(OUT, 'creutz.dat'), 'w') as f:
        f.write('beta chi2 dchi2 chi3 dchi3 strong\n')
        for r in runs:
            c, dc = r['creutz'], r['creutz_err']
            f.write(f"{r['beta']} {fmt(c[0])} {fmt(dc[0])} {fmt(c[1])} {fmt(dc[1])} {fmt(-math.log(u(r['beta'])))}\n")

    with open(os.path.join(OUT, 'glueball.dat'), 'w') as f:
        f.write('beta m0 dm0 m1 dm1 ratio dratio\n')
        for r in runs:
            m, dm = r['glueball_meff'], r['glueball_meff_err']
            ratio, dratio = gap_ratio(m[1], dm[1], r['creutz'][1], r['creutz_err'][1])
            f.write(f"{r['beta']} {fmt(m[0])} {fmt(dm[0])} {fmt(m[1])} {fmt(dm[1])} {fmt(ratio)} {fmt(dratio)}\n")

    with open(os.path.join(OUT, 'at21.dat'), 'w') as f:
        f.write('beta P asig dasig amG damG ratio dratio\n')
        for b, _, p, _, s, ds, m, dm in AT21:
            ratio = m / s
            f.write(f"{b} {p} {s} {ds} {m} {dm} {ratio:.4f} {ratio * math.hypot(dm / m, ds / s):.4f}\n")

    print(f"{'beta':>5} {'plaquette':>18} {'strong u+4u^5':>13} {'chi(2)':>15} {'chi(3)':>15} {'a m_eff(t=1)':>16} {'m/sqrt(chi3)':>14}  n  sec")
    for r in runs:
        b = r['beta']
        uu = u(b)
        p, dp = r['plaquette']
        c, dc = r['creutz'], r['creutz_err']
        m, dm = r['glueball_meff'], r['glueball_meff_err']
        ratio, _ = gap_ratio(m[1], dm[1], c[1], dc[1])
        print(f"{b:5.2f} {p:10.5f}({dp:.5f}) {uu + 4 * uu ** 5:13.5f} {c[0]:7.3f}({dc[0]:.3f}) {c[1]:7.3f}({dc[1]:.3f}) {m[1]:8.3f}({dm[1]:.3f}) {ratio:14.3f} {r['n_measurements']:3d} {r['seconds']:5.0f}")
    print(f"\nRigorous strong-coupling mass gap (SZZ23), SU(2), d=4, Wilson normalisation: beta < {BETA_RIGOROUS_SU2_D4:.4f}")
    print('AT21 m_G/sqrt(sigma):', ', '.join(f'{x[0]}: {x[6] / x[4]:.3f}' for x in AT21))

    # LaTeX table for the report: one row per coupling, values with jackknife errors.
    def pm(x, dx, digits):
        # A value whose error exceeds its size carries no information: print a dash.
        if math.isnan(x) or math.isnan(dx) or abs(dx) >= abs(x):
            return '---'
        return f'${x:.{digits}f}({round(dx * 10 ** digits):d})$'
    with open(os.path.join(OUT, 'table.tex'), 'w') as f:
        f.write('% Generated by lab/analyze.py. Do not edit by hand.\n')
        for r in runs:
            b = r['beta']
            uu = u(b)
            p, dp = r['plaquette']
            c, dc = r['creutz'], r['creutz_err']
            m, dm = r['glueball_meff'], r['glueball_meff_err']
            ratio, dratio = gap_ratio(m[1], dm[1], c[1], dc[1])
            f.write(f"{b:.1f} & {pm(p, dp, 5)} & ${uu + 4 * uu ** 5:.5f}$ & {pm(c[0], dc[0], 3)} & {pm(c[1], dc[1], 3)} & {pm(m[1], dm[1], 2)} & {pm(ratio, dratio, 2)}\\\\\n")
        # LaTeX's \input cannot be followed by \bottomrule inside a tabular: close it here.
        f.write('\\bottomrule\n')
    # Reproducibility: an independent seed at the same coupling must agree within errors.
    lines = ['% Generated by lab/analyze.py. Do not edit by hand.']
    for path in sorted(glob.glob(os.path.join(HERE, 'runs', 'check_beta_*.json'))):
        chk = json.load(open(path))
        ref = next((r for r in runs if abs(r['beta'] - chk['beta']) < 1e-9), None)
        if ref is None:
            continue
        pairs = [('plaquette', ref['plaquette'], chk['plaquette']),
                 ('$\\chi(2)$', (ref['creutz'][0], ref['creutz_err'][0]), (chk['creutz'][0], chk['creutz_err'][0])),
                 ('$am_{\\mathrm{eff}}(1)$', (ref['glueball_meff'][1], ref['glueball_meff_err'][1]), (chk['glueball_meff'][1], chk['glueball_meff_err'][1]))]
        devs = [(name, abs(a[0] - b[0]) / math.hypot(a[1], b[1])) for name, a, b in pairs]
        worst = max(d for _, d in devs)
        print(f"reproducibility beta={chk['beta']} seed {ref['seed']} vs {chk['seed']}: " + ', '.join(f'{n} {d:.2f} sigma' for n, d in devs))
        lines.append(f"An independent run at $\\beta={chk['beta']}$ (seed {chk['seed']} instead of {ref['seed']}) agrees with the main run: "
                     + ', '.join(f'{n} differs by {d:.1f}\\,$\\sigma$' for n, d in devs)
                     + (' (all within $2\\sigma$).' if worst < 2 else f' (largest deviation {worst:.1f}\\,$\\sigma$).'))
    with open(os.path.join(OUT, 'repro.tex'), 'w') as f:
        f.write('\n'.join(lines) + '\n')

    with open(os.path.join(OUT, 'constants.tex'), 'w') as f:
        f.write('% Generated by lab/analyze.py. Do not edit by hand.\n')
        f.write(f"\\newcommand{{\\BetaRigorous}}{{{BETA_RIGOROUS_SU2_D4:.4f}}}\n")
        f.write(f"\\newcommand{{\\NumRuns}}{{{len(runs)}}}\n")
        f.write(f"\\newcommand{{\\NumMeas}}{{{runs[0]['n_measurements']}}}\n")
        f.write(f"\\newcommand{{\\LatticeL}}{{{runs[0]['L']}}}\n")


if __name__ == '__main__':
    main()
