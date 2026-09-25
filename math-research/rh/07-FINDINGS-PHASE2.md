# 07 · Befunde Phase 2 — Weil-Labor, Radikalstruktur, Epstein-Kalibrierung

**Stand:** 2026-09-25 · **MAIN:** `OPEN` · Alle Zahlen: `NUMERICAL`, sofern nicht anders markiert.
Code: `computations/weil/`, Daten: `computations/results/weil_*`.

## 1. Instrument: das Weil-Labor (validiert)

Matrix der Weil-Form Q auf dem Fenster [−L, L] (L = log λ, Primzahlpotenzen ≤ e^{2L}) in der
CCM-Basis e^{iπkx/L}, |k| ≤ N, aufgespalten in gerade/ungerade Blöcke. Pol- und Primterme sind
geschlossen, der archimedische Term steht in einer eigenen x-Raum-Form (Herleitung in `models.py`).

| Test | Inhalt | Ergebnis |
|---|---|---|
| V1 | explizite Formel für ζ, Gauß-Testfunktionen (auch nicht-gerade), Nullstellen- vs. Primseite; τ- vs. x-Form des archimedischen Terms | Übereinstimmung 9·10⁻⁵¹ bzw. 5·10⁻⁵¹ (50 Stellen) |
| V2 | Zhu: 8,9·10⁻¹⁸ ≤ λ_min(0,8) ≤ 2,27·10⁻¹⁷ | Galerkin von oben: 2,65 → 1,98 → 1,93 → 1,91·10⁻¹⁷ (N = 20…50) ✓ |
| V3 | CCM: Nullstellen von ξ̂_λ, nur Primzahlen ≤ 13 | 1. Zetanullstelle auf 7,1·10⁻⁵⁵, 2. auf 1,3·10⁻⁵¹ … (CCM: 2,5·10⁻⁵⁵) ✓ |
| V4 | explizite Formel für die Epstein-ζ zu x²+5y² (kein Eulerprodukt, Γ(s)-Faktor); vollständige Nullstellenliste bis 36 (22 auf, 2+2 neben der Geraden = zertifizierte Windung 26) | Übereinstimmung 3,5·10⁻³⁴ / 1,2·10⁻⁴¹ ✓ |

## 2. Struktur des Spektrums (ζ)

- **Paritätsleiter:** Die tiefen Eigenwerte wechseln streng die Parität, jede Stufe mit Faktor ~10³–10⁷.
  L = 0,8: 1,9·10⁻¹⁷ (g) < 2·10⁻¹⁴ (u) < 10⁻¹¹ (g) < 3·10⁻⁹ (u) < 9·10⁻⁷ (g).
  L = ½ log 13: 1·10⁻⁵⁸ (g) < 8,5·10⁻⁵⁵ (u) < 3,7·10⁻⁵¹ (g) < 1,1·10⁻⁴⁷ (u) < 2,5·10⁻⁴⁴ (g).
  **M1 („even-simple“) gilt bei allen getesteten L (0,5 … 1,28).**
- **Kein kommutierender Sturm–Liouville-Operator mit glatten Koeffizienten (WP-2D).** Die Methode ist
  kalibriert: Die Prolate-Kontrolle ergibt Residuum ~10⁻⁵, die Weil-Form 0,2–3,3. Ursache sind innere
  Knickstellen der Eigenfunktionen bei ±(L − log n), erzeugt durch die Primverschiebungen. Ein
  kommutierender Operator müsste Arithmetik enthalten (Failure Log F-6).
- **Winkelgesetz:** Der Winkel² zwischen dem Grundzustand ξ_λ und Riemanns abgeschnittenem Φ fällt wie
  ≈ e^{−4,4L}: 1,1·10⁻² (L = 0,6) … 5,0·10⁻⁴ (L = 1,28). Der Wert ist in N konvergiert (L = 0,8:
  4,258 / 4,238 / 4,239 / 4,236·10⁻³ für N = 20/30/40/50).
- **Radikalstruktur H-Ξ:** Der Grundzustand (und ebenso der 2. Eigenvektor) liegt bis auf einen
  doppelt-exponentiell kleinen Rest im Raum der Ξ-teilbaren Funktionen span{(−∂²)ʲΦ|_{[−L,L]}}.
  Restwinkel² (j ≤ 10): 4,7·10⁻⁴ (L = 0,6), 2,7·10⁻⁶ (0,7), 3,9·10⁻⁹ (0,9), 6,4·10⁻¹² (1,0),
  7,9·10⁻¹⁵ (1,1), 2,8·10⁻²² (½ log 13, j ≤ 12), empirisch ≈ Φ(L)^{1,5…1,7}. Jeder Radikalvektor fängt genau eine der winzigen Moden.
  **Erklärung (unbedingt):** Φ liegt im Radikal der vollen Weil-Form, denn Q(Φ, g) = Σ_ρ Ξ(γ_ρ)·(…) = 0
  für alle g. Auf dem Fenster stört nur der Schwanz.

## 3. Formale Ergebnisse (Lean 4 + Mathlib, nur Standardaxiome)

- `riemannHypothesis_of_approximation_divisible` (**M2′**): Konvergieren Funktionen mit nur reellen
  Nullstellen im Streifen |Im z| < ½ lokal gleichmäßig gegen *irgendein* holomorphes G ≢ 0, das an allen
  Nullstellen von Ξ verschwindet (z. B. G = H·Ξ), dann gilt RH. Damit ist M2 formal auf „Grenzwert
  durch Ξ teilbar“ abgeschwächt.
- **Präzisierung des Imports IMP-CCM510:** CCM Thm. 5.10 bezieht sich auf die *abgeschnittene* Form
  QW_λ^N, also genau die Galerkin-Matrix. „Even-simple“ ist damit eine endliche, pro (λ, N)
  zertifizierbare Matrixeigenschaft. M1 für den vollen Operator wird für die Kette nicht benötigt.

## 4. Widerlegte Kandidaten (Falsifikations-Track)

- **K-Ξ naiv (F-7):** „Q ist auf dem Komplement von D_m = span{(−∂²)ʲΦ} gleichmäßig koerzitiv, und D_m
  ist fast-null.“ Das ist falsch: τ_m = max Q auf D_m wird O(1), weil höhere Ableitungen den Schwanz
  verstärken. Das Verhältnis β_m/τ_m bleibt ≪ 1 (10⁻³ bei L = 0,8; 10⁻¹³ bei L = 1,1). Der
  Koerzitivitätsbeweis für H-Ξ trägt nicht.
- **Glatter kommutierender Operator (F-6):** siehe §2.

## 5. Epstein-Kalibrierung (Filter F-EP) — der entscheidende Befund

Dieselbe Maschinerie wurde auf die Epstein-ζ angewandt, deren Nullstellen nachweislich neben der
Geraden liegen (z. B. 0,9325 + 15,669i).

| L | kleinster Eigenwert | # negative | R(Φ_E) | H-Ξ-Rest Grundzustand |
|---|---|---|---|---|
| 0,7 … 0,9 | ≈ +1,4…+1,7 (Grundzustand **ungerade**) | 0 | 2,2…3,4 | 0,09…0,55 |
| 1,0 | +1,05 | 0 | 1,38 | 7·10⁻³ |
| 1,25 | +0,19 | 0 | 0,39 | 4·10⁻² |
| **1,5** | **−2,3·10⁻⁴** | **1** | 0,11 | 1,3·10⁻² |
| 2,0 | −1,64 | 4 | 2,8·10⁻⁴ | **1,0** |
| 2,5 | −4,43 | ≥ 5 | 3,9·10⁻⁹ | **1,0** |

**Schlussfolgerungen:**
1. **Die Radikalstruktur ist generisch.** Auch für Epstein wird das Radikalelement Φ_E doppelt-exponentiell
   fast-null. Sie hat daher keinen arithmetischen Inhalt.
2. **ζ und Epstein unterscheiden sich allein in der Positivität.** Sobald das Fenster die Off-Line-Nullstellen
   auflöst (L ≈ 1,5), entstehen negative Moden *unter* dem Radikal. Der Grundzustand wird dann radikalfremd,
   und H-Ξ bricht vollständig (Rest 1,0).
3. **Barriere B-CCM2 (neu, belegt):** Die CCM-Route, auch in der Präzisierung H-Ξ + M2′, umgeht die
   Weil-Positivität *nicht*. Inhaltlich gilt: H-Ξ bei Fenster L ⇔ Fensterpositivität (keine auflösbaren
   Off-Line-Nullstellen) + generische Radikalstruktur. Der harte Kern bleibt **K-W: Weil-Positivität für
   alle L**, mit Zhus doppelt-exponentieller Zertifikatsbarriere.
4. Nebenbefund: „even-simple“ kann auch *ohne* Negativität verletzt sein (Epstein, L = 0,7–0,9,
   vorasymptotischer Bereich mit O(1)-Eigenwerten). M1 folgt also nicht allein aus Positivität.

## 6. Konsequenz für das Programm

Phase 2 hat keinen Weg um die Weil-Positivität herum gefunden. Sie hat aber dreierlei präzise
nachgewiesen: warum die CCM-Approximationen so gut sind (Radikal), warum das allein nichts beweist
(Epstein), und wo die Schwierigkeit tatsächlich sitzt (Positivität unter dem Radikal).
Jeder künftige Ansatz muss eine *positivitätserzeugende* Struktur liefern, die für Epstein
nachweislich versagt (F-EP) und uniform in L ist (F-UNI). Das ist exakt Bombieris Frage nach einem
Indexsatz, jetzt mit einem validierten numerischen Prüfstand, an dem jede Kandidatenstruktur sofort
gegen ζ **und** Epstein getestet werden kann.
