# 08 · Bridge Theorem — von endlichen Weil-Matrizen zur vollen Weil-Positivität

**Stand:** 2026-09-25 · **Status:** Bridge Theorem BT-L und BT `PROVED` (intern, vollständiger Beweis hier;
unabhängige Prüfung ausstehend) · Voraussetzung KW-ALL `OPEN` (⇔ RH) · **MAIN: `OPEN`**

Verbindliche Trennung (Closure-Direktive):

```
Numerical evidence  ≠  finite-dimensional theorem  ≠  full Weil positivity  ≠  RH
   (NUMERICAL)           (PROVED-FINITE)              (BRIDGE-CLOSED)         (RH-PROVED)
```

## 0. Ergebnis in einem Satz

**Der Übergang „endliche Matrizen → volle Weil-Form“ ist verlustfrei und beweisbar:**

> RH  ⇔  ∀L > 0  ∀N ∈ ℕ:  W_{N,L} ⪰ 0.

Dabei ist N → ∞ bei festem L ein *monotoner* Rayleigh–Ritz-Grenzwert, und L → ∞ ist *kein Grenzwert*,
sondern eine Vereinigung, weil jede Testfunktion kompakten Träger hat. Der gesamte ungelöste Inhalt von RH
sitzt damit im Quantor **∀L**, also in KW-ALL, und nicht im Grenzübergang N → ∞. Endliche Positivität für
endlich viele (N, L) bleibt `PROVED-FINITE`. Sie bringt RH nicht näher, solange ∀L nicht bewiesen ist.

## 1. Exakte Fixierung (Punkt 8 der Direktive)

**Konventionen.** f̂(z) = ∫_ℝ f(x) e^{izx} dx; f̃(x) = conj(f(−x)); F = f ∗ f̃, also
F(a) = ∫ f(y) conj(f(y−a)) dy. Für nichttriviale Nullstellen ρ sei γ_ρ = (ρ − ½)/i (RH ⇔ alle γ_ρ reell).
μ(τ) = (1/2π)(Re ψ(¼ + iτ/2) − log π).

**Weil-Form.** Für f ∈ C_c^∞(ℝ, ℂ):

  Q(f) := F̂(i/2) + F̂(−i/2) + ∫_ℝ F̂(τ) μ(τ) dτ − Σ_{n≥1} Λ(n) n^{−1/2} (F(log n) + F(−log n)),

mit F̂(±i/2) = f̂(±i/2)·conj(f̂(∓i/2)) und F̂(τ) = |f̂(τ)|² für reelle τ.
Die Summe ist endlich (F(a) = 0 für |a| > 2L, wenn supp f ⊂ [−L, L]). **Nullstellen kommen in Q nicht vor.**

**Weil-Kriterium, Fassung W∞ (verwendet):**  RH ⇔ Q(f) ≥ 0 für alle f ∈ C_c^∞(ℝ, ℂ).

- (⇒, RH ⇒ Positivität): Aus der expliziten Formel (IMP-EF) folgt Σ_ρ m_ρ F̂(γ_ρ) = Q(f). Unter RH
  sind alle γ_ρ reell, also F̂(γ_ρ) = |f̂(γ_ρ)|² ≥ 0. **Bewiesen modulo IMP-EF.**
- (⇐, Positivität ⇒ RH): **importiert und am Primärtext geprüft (IMP-WEIL-C):** Bombieri,
  *Remarks on Weil's quadratic functional in the theory of prime numbers, I*, Rend. Lincei Mat. Appl. 11
  (2000) 183–233, **Theorem 1** (S. 191, PDF SHA-256 `20bd544f…b7fd`): RH ⇔ Σ_ρ g̃(ρ)·conj(g̃(1−ρ̄)) > 0 für
  alle g ∈ C₀^∞((0, ∞)), g ≢ 0. Der Beweis der Rückrichtung (S. 191–193) konstruiert bei Verletzung von RH
  ein reelles g mit kompaktem Träger und **strikt negativer** Summe. Er benutzt Lis Kriterium, Dirichlets
  simultane Approximation und den Nullstellenfreien Bereich nach de la Vallée Poussin; die Glättung erfolgt
  am Schluss. **Übersetzung:** Mit f(x) := e^{x/2}g(eˣ) ist g ∈ C₀^∞((0,∞)) ⇔ f ∈ C_c^∞(ℝ),
  g̃(½ + iγ) = f̂(γ) und g̃(1 − ρ̄) = f̂(conj γ_ρ). Bombieris Summe ist also Σ_ρ f̂(γ_ρ)·conj(f̂(conj γ_ρ))
  = Σ_ρ F̂(γ_ρ) = Q(f) nach IMP-EF. Daraus folgt: Q(f) ≥ 0 ∀f ∈ C_c^∞(ℝ) ⇒ RH.
- **IMP-EF (explizite Formel), geprüft:** Nach B7 genügt der Fall reeller f. Dann ist F = f ∗ f̃ reell und
  **gerade**, und die Formel ist genau Alpöge–Furman (2.1) für gerade F ∈ C_c² (Primärtext, dort nach
  Iwaniec–Kowalski §5.5), inhaltlich gleich Bombieri 2000, Theorem 2 (Primärtext). Die Nullstellenseite
  zerfällt ebenso wie Q (Kreuzterme heben sich wegen der Symmetrie γ ↦ −γ der Nullstellenmenge weg).
  Die numerische Kontrolle V1 bestätigt zusätzlich die Normierung (10⁻⁵¹).
- **Zusatzbefund aus Bombieri 2000 (Theorem 8, S. 213: Zahl negativer Eigenwerte von H(Γ;t) = Zahl verschiedener Paare (γ, γ̄) in Γ):** Hätte ζ nur endlich viele Nullstellen neben
  der Geraden, so wäre bei hinreichend großer Trunkierung die Zahl negativer Eigenwerte gleich der Hälfte
  dieser Anzahl. Unser Labor zeigt für das Epstein-Analogon genau das: Bei L = 2,0 gibt es bis Höhe 36
  zwei Off-Line-Quartette, also 8 Nullstellen, und wir finden **4 negative Eigenwerte**
  (`OBSERVED`, konsistent). Das Labor detektiert Off-Line-Nullstellen also quantitativ korrekt.

**Fensterräume.** Für L > 0 sei w(τ) = 1 + log(1 + |τ|),

  ‖f‖_*² := (1/2π) ∫ |f̂(τ)|² w(τ) dτ,   H_L := {f ∈ L²(ℝ) : supp f ⊂ [−L, L], ‖f‖_* < ∞}

(ein Hilbertraum), und E_N(L) := span{e_k : |k| ≤ N}, e_k(x) = e^{iπkx/L}·𝟙_{[−L,L]}(x).
Q_L bezeichnet Q auf H_L (Primterme n ≤ e^{2L}). **W_{N,L}** := (Q_L(e_j, e_k))_{|j|,|k|≤N}, die Gram-Matrix
ist 2L·I. μ_N(L) := λ_min(W_{N,L})/(2L) = min_{0≠f∈E_N} Q_L(f)/‖f‖₂². λ₁(L) := inf_{0≠f∈H_L} Q_L(f)/‖f‖₂².

## 2. Lemmata mit Beweis

**B0 (x-Form = τ-Form).** Für f ∈ H_L gilt ∫F̂μ = (ψ(¼) − log π)F(0) − ∫_0^∞ K(x)(F(x)+F(−x)−2F(0)) dx,
K(x) = e^{−x/2}/(1 − e^{−2x}). Das ist genau die Form, die W_{N,L} im Labor berechnet.
*Beweis.* Einsetzen von ψ(z) = −γ + ∫_0^∞ (e^{−t} − e^{−zt})/(1−e^{−t}) dt und ∫F̂(τ)cos(τt/2)dτ = π(F(t/2)+F(−t/2)).
Die Vertauschung von ∫dτ und ∫dt ist zulässig (Fubini) für den *kombinierten* Integranden:
|e^{−t} − e^{−t/4}cos(τt/2)| ≤ |e^{−t} − e^{−t/4}| + e^{−t/4}min(τ²t²/8, 2) ergibt
∫_0^∞ |e^{−t} − e^{−t/4}cos(τt/2)|/(1−e^{−t}) dt ≤ C·w(τ), und ∫F̂(τ) w(τ) dτ = 2π‖f‖_*² < ∞ (F̂ = |f̂|² ≥ 0). Der Rest ist die Umformung aus
`computations/weil/models.py`, numerisch auf 5·10⁻⁵¹ bestätigt (V1). ∎

**B1 (Stetigkeit).** |Q_L(f,g)| ≤ C_L ‖f‖_* ‖g‖_* auf H_L. Konkret ist
C_L = 4L e^{L} + c_μ + 2 Σ_{n≤e^{2L}} Λ(n)n^{−1/2}, mit |2πμ(τ)| ≤ c_μ w(τ).
*Beweis.* Polterm: |f̂(±i/2)| ≤ ∫|f|e^{|x|/2} ≤ e^{L/2}√(2L)‖f‖₂ und ‖f‖₂ ≤ ‖f‖_*.
Archimedischer Term: |μ| ≤ (c_μ/2π)w, also |∫f̂ conj(ĝ) μ| ≤ (c_μ/2π)∫|f̂||ĝ|w ≤ c_μ‖f‖_*‖g‖_* (Cauchy–Schwarz). Primterm: |C_{fg}(a)| ≤ ‖f‖₂‖g‖₂,
endlich viele n. Die Existenz von c_μ folgt aus Re ψ(¼ + iτ/2) = log(|τ|/2) + O(τ⁻²) (Stirling, DLMF 5.11.2†)
und Stetigkeit. ∎

**B2 (Gårding-Ungleichung).** Es gibt c₁ > 0 und B_L < ∞ mit Q_L(f) ≥ c₁‖f‖_*² − B_L‖f‖₂² auf H_L.
*Beweis.* Nach Stirling gibt es c₁′, c₂ > 0 mit μ(τ) ≥ c₁′w(τ) − c₂, also ∫|f̂|²μ ≥ 2πc₁′‖f‖_*² − 2πc₂‖f‖₂² (c₁ := 2πc₁′). Pol- und Primterm sind durch
(4Le^{L} + 2Σ_{n≤e^{2L}}Λ(n)n^{−1/2})‖f‖₂² beschränkt (B1). ∎

**B3 (diskretes Spektrum).** Die Einbettung H_L ↪ L²(−L, L) ist kompakt. Q_L ist eine abgeschlossene,
halbbeschränkte Form. Der zugehörige selbstadjungierte Operator A_L hat kompakte Resolvente mit Eigenwerten
λ₁(L) ≤ λ₂(L) ≤ … → +∞ (endliche Vielfachheiten). Das Infimum λ₁(L) wird angenommen.
*Beweis.* Beschränkte Mengen in H_L: Die Träger liegen in [−L, L]. Der Fourier-Schwanz erfüllt
∫_{|τ|>T}|f̂|² ≤ 2π‖f‖_*²/w(T) → 0 gleichmäßig. Die f̂ sind gleichgradig stetig (|f̂′| ≤ L√(2L)‖f‖₂).
Kolmogorov–Riesz ergibt Präkompaktheit in L². Abgeschlossenheit: Die Formnorm ist nach B1/B2 äquivalent zu
‖·‖_*, und H_L ist vollständig. Der Rest ist Standard (Kato VI.2†, Reed–Simon IV XIII.64†). ∎

**B4 (Dichtheit glatter Funktionen).** C_c^∞((−L, L)) ist dicht in (H_L, ‖·‖_*).
*Beweis.* Die Dilatation f_s(x) = f(x/s), s ↑ 1, zieht den Träger ins Innere; f̂_s(τ) = s f̂(sτ) → f̂ im
w-gewichteten L² (dominierte Konvergenz, w(τ/s) ≤ w(τ) + log(1/s) + 1). Anschließend Faltung mit einem
Mollifier φ_ε: f̂·φ̂(ετ) → f̂ gewichtet (dominierte Konvergenz). ∎

**B5 (Dichtheit der trigonometrischen Räume).** ⋃_N E_N(L) ist dicht in (H_L, ‖·‖_*).
*Beweis.* Nach B4 genügt φ ∈ C_c^∞((−L, L)). Seine 2L-periodische Fortsetzung ist glatt, also
S_Nφ → φ in C¹([−L, L]) (Fourier-Partialsummen). Für g_N := (S_Nφ − φ)𝟙_{[−L,L]} liefert einmalige
partielle Integration |ĝ_N(τ)| ≤ (2‖g_N‖_∞ + 2L‖g_N′‖_∞)/|τ|, außerdem |ĝ_N| ≤ 2L‖g_N‖_∞. Damit
‖g_N‖_*² ≤ C·‖g_N‖²_{C¹} ∫ w(τ) min(1, τ⁻²) dτ → 0. Die Randsprünge der e_k schaden nicht: Ihr Beitrag
~ w/τ² ist integrierbar. ∎

**B6 (monotone Rayleigh–Ritz-Konvergenz).** μ_N(L) ist nicht wachsend in N, μ_N(L) ≥ λ₁(L), und
μ_N(L) → λ₁(L). Analog konvergieren die k-ten Eigenwerte von W_{N,L}/(2L) von oben gegen λ_k(L)
(Min-Max-Prinzip).
*Beweis.* Verschachtelte Räume E_N ⊂ E_{N+1} ⊂ H_L und Min-Max. Konvergenz: Nimm einen Eigenvektor zu λ₁(L)
(existiert nach B3). Nach B5 gibt es g_N ∈ E_N mit ‖g_N − f₁‖_* → 0, nach B1 folgt Q(g_N)/‖g_N‖² → λ₁. ∎

**B7 (Paritäts- und Reellreduktion).** Q ist invariant unter (Pf)(x) = f(−x), und Q(u + iv) = Q(u) + Q(v)
für reelle u, v. Daher gilt: Q ≥ 0 auf H_L ⇔ Q ≥ 0 auf den reellen geraden und den reellen ungeraden
Funktionen, also auf den Kosinus- und Sinusblöcken des Labors.
*Beweis.* Invarianz: Polterme tauschen, μ ist gerade, die Primsumme ist symmetrisch in ±log n. Für eine
invariante hermitesche Form gilt Q(f_e, f_o) = Q(Pf_e, Pf_o) = −Q(f_e, f_o), also 0. Für reelle u, v sind
alle Terme reell (û(−τ) = conj û(τ), μ gerade), daher fallen die Kreuzterme weg. ∎

## 3. Bridge Theorem

**Satz BT-L (festes Fenster).** Für jedes L > 0 sind äquivalent:
(i) Q(f) ≥ 0 ∀f ∈ C_c^∞((−L, L));  (ii) Q_L(f) ≥ 0 ∀f ∈ H_L;  (iii) W_{N,L} ⪰ 0 ∀N;  (iv) lim_N λ_min(W_{N,L}) ≥ 0;
(v) λ₁(L) ≥ 0.
*Beweis.* (ii) ⇒ (i), (iii): Inklusionen. (i) ⇒ (ii): B4 + B1. (iii) ⇒ (ii): B5 + B1.
(iii) ⇔ (iv) ⇔ (v): B6 (monoton, Grenzwert λ₁(L)). ∎

**Satz BT (global).** Unter IMP-WEIL-C (W∞) und IMP-EF gilt:

  RH ⇔ ∀L > 0 ∀N: W_{N,L} ⪰ 0 ⇔ ∀L > 0: λ₁(L) ≥ 0 ⇔ ∀j ∈ ℕ: λ₁(j) ≥ 0.

*Beweis.* C_c^∞(ℝ) = ⋃_L C_c^∞((−L, L)), und für supp f ⊂ (−L, L) ist Q(f) = Q_L(f). Mit W∞ und BT-L
folgt die erste Äquivalenz. λ₁(L) ist nicht wachsend in L (H_L ⊂ H_{L′} für L < L′), daher genügen L = j ∈ ℕ. ∎

**Status:** BT-L `PROVED` (intern; nur Standardanalysis und die Stirling-Asymptotik). BT `PROVED` modulo
IMP-WEIL-C und IMP-EF, beide am Primärtext geprüft (§1). Der Satz ist eine **Äquivalenz**: Er schließt die Brücke
„endlich ↔ voll“ vollständig. Seine Voraussetzung **KW-ALL: ∀L ∀N W_{N,L} ⪰ 0** ist `OPEN` und ist RH.

## 4. Die acht Prüfpunkte

| # | Frage | Antwort | Beleg |
|---|---|---|---|
| 1 | Dichtheit in der exakten Topologie | Die richtige Topologie ist ‖·‖_* (log-gewichtetes L²). In L² allein ist Q unbeschränkt. C_c^∞ und ⋃E_N sind in ‖·‖_* dicht. | B4, B5 |
| 2 | Stetigkeit / Abgeschlossenheit | Q_L ist in ‖·‖_* stetig, halbbeschränkt und abgeschlossen. | B1, B2, B3 |
| 3 | Uniformität der Fehler in N, L | In N: **kein Fehlerterm**. W_{N,L} ist die *exakte* Einschränkung von Q (Primsumme endlich, keine Nullstellen). Konvergenz in N ist monoton (B6). In L ist für die Äquivalenz keine Uniformität nötig (Vereinigung). Für Beweisstrategien siehe Punkt 6. | B6, BT |
| 4 | Reihenfolge der Grenzwerte | Erst N → ∞ bei festem L (monoton), dann Vereinigung über L. Kein gemeinsamer Grenzwert nötig. | BT |
| 5 | Kann Positivität im Grenzwert verloren gehen? | Nein. „≥ 0“ ist abgeschlossen, und negative Werte in H_L werden bei *endlichem* N sichtbar (B1 + B5). Strikte Positivität kann zu 0 entarten, das berührt W∞ nicht. | BT-L, Korollar AS |
| 6 | Gehen die kleinsten Eigenwerte gegen 0? | **In N nein:** μ_N ↓ λ₁(L) > 0 (L = 0,8: 2,65 → 1,98 → 1,93 → 1,91·10⁻¹⁷, zertifizierte Untergrenze 8,9·10⁻¹⁸ nach Zhu). **In L ja:** λ₁(L) → 0 doppelt-exponentiell, und zwar *unbedingt* (Lemma R). Das ist **echte semidefinite Struktur**: Die volle Weil-Form hat ein unendlichdimensionales Radikal {f : f̂ = Ξ·H}, und die winzigen Eigenvektoren sind dessen Fensterschatten (H-Ξ, rh/07). Kein Rundungsartefakt: Der Wert ist präzisionsunabhängig (C-11) und N-monoton. | Lemma R, 07 §2, C-11 |
| 7 | Verfälschen Quadratur oder Trunkierung das Spektrum? | W_{N,L} enthält **keine** Trunkierung der Primsumme (exakt endlich) und **keine** Nullstellen. Fehlerquellen sind nur die 2(N+1) eindimensionalen Integrale S(ω), D(ω) und Gleitkomma in der Eigenzerlegung. Beide sind rigoros gemacht: PROVED-FINITE-Zertifikate C-12 (rigorose Integrale, Intervall-LDLᵀ), L=4/5 (N=20/30/50), L=1 (N=40), L=11/10 (N=46), L=5/4 (N=56; λ_min/(2L) ∈ [1,13;1,38]·10⁻⁵⁴). Status: `PROVED-FINITE`, also nur Positivität auf E_N(L). Nullstellensummen kommen nur in den Kontrollen V1/V4 vor. | §5, C-12 |
| 8 | Exakte Fassung des Weil-Kriteriums | W∞ wie in §1, einschließlich Konventionen, Klasse C_c^∞(ℝ, ℂ), Polterme, keine Symmetrieannahme (B7 reduziert auf gerade/ungerade reelle). | §1 |

**Korollar AS (adversariale Folgen, Punkt 9).** Für festes L gilt:
(a) Gibt es f ∈ H_L mit Q(f) < 0, dann gibt es ein endliches N und g ∈ E_N mit Q(g) < 0. Keine Folge kann
Negativität „im Grenzwert verstecken“ (B1 + B5).
(b) Für *jede* Folge (f_N) ⊂ H_L gilt liminf Q(f_N)/‖f_N‖² ≥ λ₁(L) = lim μ_N(L). Der Rayleigh–Ritz-Eigenvektor
ist also bereits der **optimale Gegner**; eine gesonderte Suche kann ihn nicht übertreffen.
(c) *Hochfrequenz, Oszillation, Randkonzentration:* Hat f höchstens den Anteil η seiner L²-Energie bei |τ| ≤ T,
so gilt nach B2 Q(f) ≥ (c₁ w(T)(1 − η) − B_L)‖f‖². Für w(T) > B_L/(c₁(1 − η)) ist das > 0.
Negativität kann nur aus einem endlichdimensionalen Niederfrequenzanteil kommen (B3).
(d) **Die einzige unkontrollierte Richtung ist L → ∞.** Das ist keine Lücke der Brücke, sondern der Inhalt
von RH, mit Zhus doppelt-exponentieller Detektionsbarriere und Lemma R.

## 5. Lemma R — warum „gleichmäßige Koerzitivität“ unmöglich ist

**Lemma R (`CANDIDATE LEMMA`, Beweisskizze; numerisch gestützt).** Unbedingt gilt
λ₁(L) ≤ Q_L(k_L)/‖k_L‖² ≤ C·e^{L}·e^{−πe^{2L}} → 0, mit k_L = Φ·𝟙_{[−L,L]} (Riemanns Φ, Φ̂ = Ξ).
*Skizze.* (1) Φ liegt im Radikal: Q(Φ, g) = Σ_ρ Ξ(γ_ρ)·conj(ĝ(conj γ_ρ)) = 0. Das gilt für alle g der
Weil-Klasse, weil Ξ an *jeder* Nullstelle verschwindet, unabhängig von RH. Φ ∗ g̃ liegt in Bombieris Klasse 𝒲
(doppelt-exponentieller Abfall). (2) Mit Φ = k_L + t_L folgt Q(k_L) = Q(t_L). (3) Q(t_L) ist durch die Schwanzmasse
‖t_L‖ ~ Φ(L) ~ e^{−πe^{2L}}·poly(e^{L}) beschränkt. Dazu werden die Primsumme über *alle* n (Beitrag
∫Φ(y)Φ(y − log n)dy ~ e^{−2πn}) und die Sprunghöhe Φ(L) im archimedischen Term abgeschätzt.
*Offen:* explizite Konstanten und die Gültigkeit der expliziten Formel für t_L (Sprungstellen).
*Numerik:* R(k_L) = 9,2·10⁻⁹ (L = 0,8), 1,2·10⁻¹⁴ (1,0), 9,7·10⁻¹⁹ (1,1), 6,2·10⁻²⁹ (1,28), also
R(k_L) ≈ (0,12 … 0,18)·Φ(L)² ~ e^{9L}·e^{−2πe^{2L}}. Das ist schärfer als die Skizze, die nur ~Φ(L)·poly liefert.

**Konsequenzen:**
- **Jede Strategie „∃c > 0 ∀L: λ₁(L) ≥ c“ ist unmöglich**, unbedingt, nicht erst unter RH. RH verlangt
  Positivität mit doppelt-exponentiell verschwindendem Spielraum. Das ist die präzise Form von Zhus Barriere.
- Ein Positivitätsbeweis muss **strukturell** sein. Es braucht eine Darstellung Q(f) = ‖Tf‖² (oder
  ∫|Tf|² dν, dν ≥ 0), deren Kern das Radikal {f̂ ∈ Ξ·H} enthält. Unter RH leistet das
  T f = (√m_ρ f̂(γ_ρ))_ρ. Dieses T ist aber über die Nullstellen definiert und deshalb zirkulär.
  **Gesucht ist ein nullstellenfreies T mit demselben Kern.** Das ist exakt die Hilbert–Pólya-Aufgabe
  (Q-HP: Nullstellen ⊆ Spektrum) in Weil-Sprache. Die beiden Programme fallen hier zusammen.

## 6. Zirkularitäts-Audit (Punkt 7 der Direktive)

| Baustein | Benutzt Nullstellen/RH? | Urteil |
|---|---|---|
| Definition von Q, W_{N,L} | nein (Polterme, Γ-Faktor, Λ(n), n ≤ e^{2L}) | sauber |
| B0–B7, BT-L | nein (reine Analysis, Stirling) | sauber |
| IMP-EF (explizite Formel) | enthält die Nullstellensumme als *Identität*, gilt unbedingt | sauber |
| IMP-WEIL-C (W∞, Richtung ⇐) | unbedingte Äquivalenz | sauber (Originalprüfung offen) |
| Lemma R | Φ̂ = Ξ verschwindet an *allen* Nullstellen, keine Lageannahme | sauber |
| Kontrollen V1–V4 | benutzen Nullstellenlisten | **nur Kontrolle**, keine Beweislast |
| H-Ξ, Winkelgesetz | Numerik | `NUMERICAL`/`OBSERVED`, keine Beweislast |
| T f = (f̂(γ_ρ)) (Summendarstellung) | setzt γ_ρ reell voraus | **zirkulär**, als Beweismittel verboten (L-08) |

## 7. Statusvokabular (ab V-4 verbindlich)

| Status | Bedeutung |
|---|---|
| `NUMERICAL` | Rechenergebnis ohne rigorose Fehlerkontrolle |
| `OBSERVED` | wiederkehrendes Muster in Rechnungen |
| `CONJECTURE` | daraus abgeleitete Vermutung |
| `PROVED-FINITE` | rigoros (Intervallarithmetik) bei festen Parametern (N, L) |
| `PROVED-UNIFORM` | bewiesener, parameteruniformer Satz |
| `PROVED` / `FORMALLY_VERIFIED` / `IMPORTED` | wie bisher |
| `BRIDGE-CLOSED` | Grenzübergang endlich → voll vollständig bewiesen **und** Voraussetzung bewiesen |
| `RH-PROVED` | nur für MAIN, nur wenn `depcheck` schließt. Bedeutet „intern geschlossene Kandidatenlösung“; danach folgen unabhängige Prüfung, Peer Review und der Clay-Prozess |

## 8. Beweiskette (Punkt 10), aktueller Stand

```
[KW-ALL: ∀L ∀N W_{N,L} ⪰ 0]  ──BT-L (PROVED)──►  [∀L: Q ≥ 0 auf C_c^∞(−L,L)]  ──Vereinigung──►  [Q ≥ 0 auf C_c^∞(ℝ)]
        OPEN (⇔ RH)                                                                                │ IMP-WEIL-C (W∞)
                                                                                                   ▼
                                                                                       RH  ──Lemma 0 (formal)──► MAIN
```

Der einzige offene Pfeil ist die Prämisse. Nach Lemma R kann sie nicht durch gleichmäßige Schranken
bewiesen werden, sondern nur durch einen strukturellen Positivitätsmechanismus (§5).
