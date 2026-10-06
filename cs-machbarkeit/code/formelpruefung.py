"""Prueft die drei Kernformeln aus dem ECSA-Dokument auf innere Konsistenz."""
import numpy as np

print("=" * 72)
print("TEST 1 — Vorzeichenkonvention der CSI-Formel (Abschnitt 2.4 vs. Anhang 11.1)")
print("=" * 72)
# Fallkonstruktion: ein gegen A resistenter Stamm ist gegenueber B VIERFACH empfindlicher
# als der Wildtyp. Das ist per Definition Kollateralsensitivitaet (CS).
MIC_B_WT      = 8.0   # mg/L, Wildtyp gegen B
MIC_B_ARes    = 2.0   # mg/L, A-resistenter Stamm gegen B  -> empfindlicher -> CS

csi_2_4  = np.log2(MIC_B_WT / MIC_B_ARes)      # Abschnitt 2.4
csi_11_1 = np.log2(MIC_B_ARes / MIC_B_WT)      # Anhang 11.1

print(f"  Szenario: MIC_B(Wildtyp)={MIC_B_WT}, MIC_B(A-resistent)={MIC_B_ARes}")
print(f"  -> Der resistente Stamm ist 4x EMPFINDLICHER. Wahrheit: KOLLATERALSENSITIVITAET.\n")
print(f"  Formel 2.4   log2(MIC_WT / MIC_ARes)  = {csi_2_4:+.2f}  "
      f"-> Doku sagt: positiv = CS   -> Ergebnis: {'CS  [korrekt]' if csi_2_4 > 0 else 'CR  [FALSCH]'}")
print(f"  Formel 11.1  log2(MIC_ARes / MIC_WT)  = {csi_11_1:+.2f}  "
      f"-> Doku sagt: negativ = CS   -> Ergebnis: {'CS  [korrekt]' if csi_11_1 < 0 else 'CR  [FALSCH]'}")
print(f"\n  BEFUND: Beide Formeln sind je fuer sich korrekt, liefern aber ENTGEGENGESETZTE")
print(f"  Vorzeichen fuer denselben biologischen Sachverhalt ({csi_2_4:+.1f} vs. {csi_11_1:+.1f}).")
print(f"  Jede Zahl im Dokument ist ohne Angabe der Formelquelle uninterpretierbar.")

print()
print("=" * 72)
print("TEST 2 — Stabilitaetsindex  S = 1 - Var(CS_t) / |CS_t0|")
print("=" * 72)
print("  (a) Dimensionsanalyse")
print("      CS ist in log2-Einheiten. Var(CS) ist dann in (log2-Einheiten)^2.")
print("      |CS_t0| ist in (log2-Einheiten)^1.")
print("      Der Quotient hat also die Einheit (log2-Einheiten)^1 — und wird von der")
print("      dimensionslosen 1 abgezogen. Das ist dimensional unzulaessig.\n")

print("  (b) Wertebereich — behauptet wird ein Stabilitaetsindex, implizit in [0,1]")
rng = np.random.default_rng(0)
szenarien = [
    ("sehr stabile CS-Beziehung", -3.0, 0.20),
    ("maessig schwankend",        -3.0, 0.80),
    ("stark schwankend",          -3.0, 2.00),
    ("schwache Ausgangs-CS",      -0.3, 0.80),
    ("CS_t0 nahe null",           -0.02, 0.50),
]
print(f"      {'Szenario':<28} {'CS_t0':>7} {'SD':>6} {'Var':>7} {'S':>12}  Bewertung")
for name, cs0, sd in szenarien:
    serie = rng.normal(cs0, sd, 500)
    var = serie.var(ddof=1)
    S = 1 - var / abs(cs0)
    flag = "OK" if 0 <= S <= 1 else "AUSSERHALB [0,1]"
    print(f"      {name:<28} {cs0:>7.2f} {sd:>6.2f} {var:>7.3f} {S:>12.2f}  {flag}")

print("\n  BEFUND: S verlaesst den Bereich [0,1] schon bei moderater Streuung und")
print("  explodiert, sobald die Ausgangs-CS nahe null liegt. Als 'Index' unbrauchbar.")

print()
print("  (c) Was stattdessen funktioniert — zwei dimensionskonsistente Alternativen:")
for name, cs0, sd in szenarien:
    serie = rng.normal(cs0, sd, 500)
    S_cv  = 1 / (1 + serie.std(ddof=1) / abs(np.mean(serie)))     # auf (0,1], CV-basiert
    S_sgn = float(np.mean(np.sign(serie) == np.sign(cs0)))        # Vorzeichenkonsistenz
    print(f"      {name:<28}  S_cv={S_cv:5.3f}   S_vorzeichen={S_sgn:5.3f}")
print("      S_cv  = 1/(1+Variationskoeffizient): dimensionslos, immer in (0,1].")
print("      S_vorzeichen = Anteil der Replikate mit gleicher CS-Richtung wie zu t0.")
print("      Letzteres ist die Groesse, die klinisch zaehlt, und direkt schaetzbar.")

print()
print("=" * 72)
print("TEST 3 — sigma als 'Bayes'sche Inferenz' deklariert")
print("=" * 72)
print("  Die Formel im Anhang ist sigma = sqrt( 1/(n-1) * sum (CS_k - CS_quer)^2 ).")
print("  Das ist die klassische Stichproben-Standardabweichung nach Bessel.")
print("  Sie enthaelt keinen Prior, keine Likelihood und kein Posterior.")
print("  Es ist eine Punktschaetzung der Streuung, keine bayesianische Inferenz.\n")

n_rep = 3  # das Dokument plant n>=3 Replikate
wahre_sd = 1.0
zieh = rng.normal(0, wahre_sd, (20000, n_rep)).std(axis=1, ddof=1)
print(f"  Konsequenz bei den geplanten n={n_rep} Replikaten, wahre SD = {wahre_sd}:")
print(f"    Median der geschaetzten SD : {np.median(zieh):.2f}")
print(f"    90%-Bereich der Schaetzung : {np.quantile(zieh,0.05):.2f} bis {np.quantile(zieh,0.95):.2f}")
print(f"    Anteil Schaetzungen < halbe Wahrheit : {np.mean(zieh < wahre_sd/2)*100:.0f} %")
print("\n  BEFUND: Mit n=3 ist die Streuungsschaetzung selbst extrem unzuverlaessig.")
print("  Ein Projekt, dessen Kernbeitrag die Quantifizierung von Unsicherheit ist,")
print("  darf seine Unsicherheit nicht aus 3 Replikaten per Punktschaetzer ziehen.")
print("  Genau hier waere ein hierarchisches Bayes-Modell sachlich zwingend —")
print("  es leiht Information ueber Arzneimittelpaare hinweg (partial pooling).")
