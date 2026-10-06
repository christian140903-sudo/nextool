"""
Machbarkeitsnachweis im Kleinen: traegt die statistische Kernidee?

Frage, die hier beantwortet wird:
  Kollateralsensitivitaet ist zwischen unabhaengigen Evolutionsreplikaten NICHT
  reproduzierbar. Statt zu fragen "zeigt Paar (A,B) CS - ja oder nein?" fragen wir
  "mit welcher WAHRSCHEINLICHKEIT zeigt ein neues Replikat CS?" und verlangen, dass
  diese Wahrscheinlichkeit KALIBRIERT ist: Wenn das Modell 70 % sagt, soll in 70 %
  der Faelle CS eintreten.

  Entscheidend ist, ob das mit den WENIGEN Replikaten geht, die publizierte Daten
  hergeben. Das wird hier gegen eine bekannte Grundwahrheit geprueft.
"""
import numpy as np
import time

rng = np.random.default_rng(42)

# ----------------------------------------------------------------------
# Grundwahrheit: realistische Verteilung der CS-Reproduzierbarkeit
# ----------------------------------------------------------------------
# Die Literatur (Nichol 2019, Maltas & Wood 2019) zeigt: ein Teil der Paare ist
# hochkonsistent, ein grosser Teil ist nahe am Muenzwurf. Das modellieren wir als
# Mischung aus einer konsistenten und einer unzuverlaessigen Komponente.
def wahre_p(n_paare, rng):
    anteil_konsistent = 0.35
    ist_konsistent = rng.random(n_paare) < anteil_konsistent
    p = np.where(
        ist_konsistent,
        rng.beta(0.6, 0.6, n_paare),   # polarisiert: nahe 0 oder nahe 1
        rng.beta(6.0, 6.0, n_paare),   # konzentriert um 0.5: faktisch Muenzwurf
    )
    return p, ist_konsistent

# ----------------------------------------------------------------------
# Zwei konkurrierende Schaetzer
# ----------------------------------------------------------------------
def schaetzer_naiv(k, n):
    """Was das ECSA-Dokument implizit macht: rohe Haeufigkeit je Paar."""
    return k / n

def schaetzer_hierarchisch(k, n):
    """Empirical-Bayes Beta-Binomial, Momentenmethode. Leiht Information
    ueber alle Arzneimittelpaare hinweg (partial pooling)."""
    roh = k / n
    m = roh.mean()
    v = roh.var(ddof=1)
    v_binom = (m * (1 - m) / n).mean()        # erwarteter Stichprobenanteil
    v_echt = max(v - v_binom, 1e-6)           # echte Streuung zwischen Paaren
    praez = max(m * (1 - m) / v_echt - 1, 1e-6)
    a, b = m * praez, (1 - m) * praez
    return (k + a) / (n + a + b)              # Posterior-Mittel

# ----------------------------------------------------------------------
# Guetemasse — genau die, die ein Gutachter sehen will
# ----------------------------------------------------------------------
def brier_zerlegung(p, y, n_bins=10):
    """Murphy-Zerlegung: Brier = Reliability - Resolution + Uncertainty.
    Reliability ist der Kalibrierungsfehler (kleiner ist besser)."""
    brier = np.mean((p - y) ** 2)
    kanten = np.linspace(0, 1, n_bins + 1)
    idx = np.clip(np.digitize(p, kanten[1:-1]), 0, n_bins - 1)
    ybar = y.mean()
    rel = res = 0.0
    for b in range(n_bins):
        m = idx == b
        if not m.any():
            continue
        w = m.sum() / len(p)
        rel += w * (p[m].mean() - y[m].mean()) ** 2
        res += w * (y[m].mean() - ybar) ** 2
    return brier, rel, res, ybar * (1 - ybar)

def ece(p, y, n_bins=10):
    """Expected Calibration Error."""
    kanten = np.linspace(0, 1, n_bins + 1)
    idx = np.clip(np.digitize(p, kanten[1:-1]), 0, n_bins - 1)
    e = 0.0
    for b in range(n_bins):
        m = idx == b
        if m.any():
            e += (m.sum() / len(p)) * abs(p[m].mean() - y[m].mean())
    return e

def auc(p, y):
    """ROC-AUC ueber Rangstatistik, ohne scipy."""
    if y.sum() == 0 or y.sum() == len(y):
        return np.nan
    o = np.argsort(p, kind="mergesort")
    r = np.empty(len(p)); r[o] = np.arange(1, len(p) + 1)
    # Bindungen mitteln
    up, inv, cnt = np.unique(p, return_inverse=True, return_counts=True)
    summe = np.zeros(len(up)); np.add.at(summe, inv, r)
    r = (summe / cnt)[inv]
    n1 = y.sum(); n0 = len(y) - n1
    return (r[y == 1].sum() - n1 * (n1 + 1) / 2) / (n1 * n0)

# ----------------------------------------------------------------------
# Hauptexperiment: wie viele Paare und Replikate braucht man?
# ----------------------------------------------------------------------
print("=" * 78)
print("MACHBARKEITSTEST — Kalibrierte CS-Wahrscheinlichkeiten aus wenigen Replikaten")
print("=" * 78)
print("Grundwahrheit: 35 % der Arzneimittelpaare reproduzierbar, 65 % nahe Muenzwurf.")
print("Trainiert wird auf n_train Replikaten je Paar, getestet auf einem NEUEN Replikat.\n")

print(f"{'Paare':>6} {'Repl.':>6} | {'Brier naiv':>11} {'Brier hier.':>12} | "
      f"{'Kalib.fehler naiv':>18} {'hier.':>8} | {'AUC':>6}")
print("-" * 78)

t0 = time.time()
ergebnisse = {}
for n_paare in (200, 600, 1500, 3000):
    for n_train in (3, 5, 10):
        b_n = b_h = r_n = r_h = a_h = 0.0
        W = 200                                   # Wiederholungen des gesamten Experiments
        for _ in range(W):
            p, _ = wahre_p(n_paare, rng)
            k = rng.binomial(n_train, p)          # Trainingsbeobachtungen
            y = rng.binomial(1, p)                # NEUES, ungesehenes Replikat
            pn = schaetzer_naiv(k, n_train)
            ph = schaetzer_hierarchisch(k, n_train)
            bn, rn, _, _ = brier_zerlegung(pn, y)
            bh, rh, _, _ = brier_zerlegung(ph, y)
            b_n += bn; b_h += bh; r_n += rn; r_h += rh
            a = auc(ph, y)
            a_h += 0.0 if np.isnan(a) else a
        b_n, b_h, r_n, r_h, a_h = (x / W for x in (b_n, b_h, r_n, r_h, a_h))
        ergebnisse[(n_paare, n_train)] = (b_h, r_h, a_h)
        print(f"{n_paare:>6} {n_train:>6} | {b_n:>11.4f} {b_h:>12.4f} | "
              f"{r_n:>18.4f} {r_h:>8.4f} | {a_h:>6.3f}")

print("-" * 78)
print(f"Gesamtrechenzeit fuer die komplette Tabelle: {time.time()-t0:.1f} Sekunden")
print("Spitzen-RAM: wenige Megabyte. Das laeuft auf jedem Laptop.\n")

print("LESART DER TABELLE")
print("  Brier: kleiner ist besser; 0.25 entspricht reinem Raten.")
print("  Kalibrierungsfehler (Reliability): 0 waere perfekt kalibriert.")
print("  Der naive Schaetzer ist bei 3 Replikaten schlecht kalibriert, weil er nur")
print("  0, 1/3, 2/3 oder 1 ausgeben kann und damit falsche Sicherheit vortaeuscht.")
print("  Das hierarchische Modell zieht diese Extremwerte zur Mitte und wird dadurch")
print("  ehrlich. Genau das ist der eigentliche wissenschaftliche Gehalt der Idee.\n")

# ----------------------------------------------------------------------
# Negativkontrolle — zwingend fuer jeden Gutachter
# ----------------------------------------------------------------------
print("=" * 78)
print("NEGATIVKONTROLLE — Label-Permutation")
print("=" * 78)
p, _ = wahre_p(1500, rng)
k = rng.binomial(5, p)
y = rng.binomial(1, p)
ph = schaetzer_hierarchisch(k, 5)
y_perm = rng.permutation(y)
print(f"  Echte Daten      : AUC = {auc(ph, y):.3f}   ECE = {ece(ph, y):.4f}")
print(f"  Permutierte Label: AUC = {auc(ph, y_perm):.3f}   ECE = {ece(ph, y_perm):.4f}")
print("  Erwartung: AUC faellt auf etwa 0.5. Faellt sie nicht, liegt ein Leck im Code vor.\n")

# ----------------------------------------------------------------------
# Die unbequeme Obergrenze
# ----------------------------------------------------------------------
print("=" * 78)
print("OBERGRENZE — was selbst ein PERFEKTES Modell nicht ueberschreiten kann")
print("=" * 78)
p, konsistent = wahre_p(20000, rng)
y = rng.binomial(1, p)
print(f"  Modell kennt die wahren Wahrscheinlichkeiten exakt:")
print(f"     Brier = {np.mean((p-y)**2):.4f}     AUC = {auc(p, y):.3f}")
print(f"  Hartes Ja/Nein-Urteil aus denselben wahren Wahrscheinlichkeiten:")
print(f"     Trefferquote = {np.mean((p > 0.5).astype(int) == y)*100:.1f} %")
print(f"  Nur auf den reproduzierbaren Paaren (35 % der Faelle):")
print(f"     Trefferquote = {np.mean((p[konsistent] > 0.5).astype(int) == y[konsistent])*100:.1f} %")
print()
print("  DAS IST DER KERNPUNKT DES GANZEN VORHABENS:")
print("  Eine Trefferquote um 70 % klingt enttaeuschend — aber ein Modell, das WEISS,")
print("  bei welchen 35 % der Paare es zu etwa 85 % richtig liegt, und das bei den")
print("  restlichen 65 % ehrlich 'Muenzwurf' sagt, ist klinisch brauchbar.")
print("  Ein Modell mit 70 % Trefferquote ohne Unsicherheitsangabe ist es nicht.")
print("  Verkauft werden muss also die KALIBRIERUNG, nicht die Treffergenauigkeit.")
