/-
  RH-Forschungsakte · formal/HurwitzReduction.lean

  Formal verifizierte Reduktion (Knoten RED-HUR im Dependency-Graphen):
  Gibt es Funktionen f_n, holomorph auf dem Streifen S = {z : |Im z| < 1/2}, deren Nullstellen in S
  alle reell sind, und konvergieren sie lokal gleichmäßig auf S gegen Ξ(z) = ξ(1/2 + i z),
  dann gilt Mathlibs `RiemannHypothesis`.

  Das ist die präzise Form des letzten Schritts der Connes–Consani–Moscovici-Route (M2 + Hurwitz)
  und legt fest, was (M2) liefern MUSS (Lint L-17). Es ist KEIN Fortschritt zur Lage der Nullstellen.
  Mathlib enthält (Commit 5e0c4e5) keinen Satz von Hurwitz; der Kern wird hier über das
  Maximumprinzip (für 1/f_n) bewiesen.
-/
import Mathlib
import RHTarget

open Complex Set Filter Topology Metric

namespace RHDossier

/-- Kern des Satzes von Hurwitz: f_n → g gleichmäßig auf der abgeschlossenen Kreisscheibe,
    f_n dort nullstellenfrei und holomorph, g stetig, g(z₀) = 0, g ≠ 0 auf dem Rand ⇒ Widerspruch. -/
theorem hurwitz_core {f : ℕ → ℂ → ℂ} {g : ℂ → ℂ} {z₀ : ℂ} {r : ℝ} (hr : 0 < r)
    (hf : ∀ n, DifferentiableOn ℂ (f n) (closedBall z₀ r))
    (hfz : ∀ n, ∀ z ∈ closedBall z₀ r, f n z ≠ 0)
    (hconv : TendstoUniformlyOn f g atTop (closedBall z₀ r))
    (hgc : ContinuousOn g (closedBall z₀ r))
    (hg0 : g z₀ = 0) (hgs : ∀ z ∈ sphere z₀ r, g z ≠ 0) : False := by
  -- m := min_{|z-z₀|=r} ‖g z‖ > 0
  have hsph : IsCompact (sphere z₀ r) := isCompact_sphere z₀ r
  have hne : (sphere z₀ r).Nonempty := NormedSpace.sphere_nonempty.mpr hr.le
  have hgc' : ContinuousOn (fun z => ‖g z‖) (sphere z₀ r) :=
    (hgc.mono sphere_subset_closedBall).norm
  obtain ⟨w, hw, hmin⟩ := hsph.exists_isMinOn hne hgc'
  set m := ‖g w‖ with hm
  have hmpos : 0 < m := norm_pos_iff.mpr (hgs w hw)
  -- für großes n: ‖f n z - g z‖ < m/2 auf der Kreisscheibe
  have hev := (Metric.tendstoUniformlyOn_iff.mp hconv) (m / 2) (by linarith)
  obtain ⟨n, hn⟩ := (hev.and (Filter.eventually_ge_atTop 0)).exists
  have hclose : ∀ z ∈ closedBall z₀ r, dist (g z) (f n z) < m / 2 := fun z hz => hn.1 z hz
  -- 1/f n ist auf der Kreisscheibe holomorph; Maximumprinzip
  have hinv : DiffContOnCl ℂ (fun z => (f n z)⁻¹) (ball z₀ r) := by
    have hd : DifferentiableOn ℂ (fun z => (f n z)⁻¹) (closedBall z₀ r) :=
      (hf n).inv (fun z hz => hfz n z hz)
    refine ⟨hd.mono ball_subset_closedBall, ?_⟩
    rw [closure_ball z₀ hr.ne']
    exact hd.continuousOn
  have hbound : ∀ z ∈ frontier (ball z₀ r), ‖(f n z)⁻¹‖ ≤ 2 / m := by
    intro z hz
    rw [frontier_ball z₀ hr.ne'] at hz
    have hzc : z ∈ closedBall z₀ r := sphere_subset_closedBall hz
    have h1 : m ≤ ‖g z‖ := hmin hz
    have h2 : ‖g z - f n z‖ < m / 2 := by rw [← dist_eq_norm]; exact hclose z hzc
    have h3 : m / 2 < ‖f n z‖ := by
      have := norm_sub_norm_le (g z) (f n z)
      linarith
    rw [norm_inv]
    rw [inv_le_comm₀ (by linarith) (by positivity)]
    rw [inv_div]
    linarith
  have hz₀ : z₀ ∈ closure (ball z₀ r) := subset_closure (mem_ball_self hr)
  have hmax := Complex.norm_le_of_forall_mem_frontier_norm_le isBounded_ball hinv hbound hz₀
  -- aber ‖f n z₀‖ < m/2, also ‖(f n z₀)⁻¹‖ > 2/m
  have hc : ‖f n z₀‖ < m / 2 := by
    have := hclose z₀ (mem_closedBall_self hr.le)
    rw [dist_eq_norm, hg0, zero_sub, norm_neg] at this
    exact this
  have hpos : 0 < ‖f n z₀‖ := norm_pos_iff.mpr (hfz n z₀ (mem_closedBall_self hr.le))
  rw [norm_inv] at hmax
  have : 2 / m < ‖f n z₀‖⁻¹ := by
    rw [lt_inv_comm₀ (by positivity) hpos, inv_div]
    exact hc
  linarith

/-- Allgemeine Hurwitz-Reduktion: Limiten von Funktionen mit nur reellen Nullstellen haben
    (bei isolierten Nullstellen) nur reelle Nullstellen. -/
theorem real_zeros_of_tendstoLocallyUniformlyOn {f : ℕ → ℂ → ℂ} {g : ℂ → ℂ} {S : Set ℂ}
    (hS : IsOpen S) (hf : ∀ n, DifferentiableOn ℂ (f n) S)
    (hreal : ∀ n, ∀ z ∈ S, f n z = 0 → z.im = 0)
    (hconv : TendstoLocallyUniformlyOn f g atTop S)
    (hgc : ContinuousOn g S)
    (hiso : ∀ z ∈ S, g z = 0 → ∀ᶠ w in 𝓝[≠] z, g w ≠ 0) :
    ∀ z ∈ S, g z = 0 → z.im = 0 := by
  intro z₀ hz₀ hg0
  by_contra him
  -- Radius: Kugel in S, weg von der reellen Achse, g ≠ 0 auf punktierter Kugel
  obtain ⟨ε, hε, hεS⟩ := Metric.isOpen_iff.mp hS z₀ hz₀
  have hiso' := hiso z₀ hz₀ hg0
  rw [eventually_nhdsWithin_iff, Metric.eventually_nhds_iff] at hiso'
  obtain ⟨δ, hδ, hδiso⟩ := hiso'
  set r := min (min (ε / 2) (δ / 2)) (|z₀.im| / 2) with hr
  have hrpos : 0 < r := by
    have : 0 < |z₀.im| := abs_pos.mpr him
    positivity
  have hrε : r < ε := by
    have : r ≤ ε / 2 := le_trans (min_le_left _ _) (min_le_left _ _)
    linarith
  have hrδ : r < δ := by
    have : r ≤ δ / 2 := le_trans (min_le_left _ _) (min_le_right _ _)
    linarith
  have hrim : r < |z₀.im| := by
    have : r ≤ |z₀.im| / 2 := min_le_right _ _
    have : 0 < |z₀.im| := abs_pos.mpr him
    linarith
  have hball : closedBall z₀ r ⊆ S := fun z hz => hεS (lt_of_le_of_lt (mem_closedBall.mp hz) hrε)
  -- f n hat keine Nullstellen in der Kugel (Nullstellen wären reell, Kugel meidet ℝ)
  have hfz : ∀ n, ∀ z ∈ closedBall z₀ r, f n z ≠ 0 := by
    intro n z hz hfz0
    have hzim : z.im = 0 := hreal n z (hball hz) hfz0
    have hd : |z₀.im - z.im| ≤ dist z₀ z := by
      rw [dist_eq_norm]
      have := abs_im_le_norm (z₀ - z)
      simpa using this
    rw [hzim, sub_zero] at hd
    have : dist z₀ z ≤ r := by rw [dist_comm]; exact mem_closedBall.mp hz
    linarith
  have hgs : ∀ z ∈ sphere z₀ r, g z ≠ 0 := by
    intro z hz
    have hzne : z ≠ z₀ := by
      intro h; rw [h, mem_sphere, dist_self] at hz; linarith
    exact hδiso (by rw [mem_sphere] at hz; rw [hz]; exact hrδ) hzne
  have hunif : TendstoUniformlyOn f g atTop (closedBall z₀ r) :=
    (tendstoLocallyUniformlyOn_iff_forall_isCompact hS).mp hconv _ hball (isCompact_closedBall z₀ r)
  exact hurwitz_core hrpos (fun n => (hf n).mono hball) hfz hunif (hgc.mono hball) hg0 hgs

/-- ξ(s) = ½ (s(s−1) Λ₀(s) + 1); stimmt mit ½ s(s−1) π^{−s/2} Γ(s/2) ζ(s) überein und ist ganz. -/
noncomputable def riemannXi (s : ℂ) : ℂ := (s * (s - 1) * completedRiemannZeta₀ s + 1) / 2

/-- Ξ(z) = ξ(1/2 + i z). -/
noncomputable def RiemannXiUpper (z : ℂ) : ℂ := riemannXi (1 / 2 + I * z)

lemma differentiable_riemannXi : Differentiable ℂ riemannXi := by
  have h := differentiable_completedZeta₀
  unfold riemannXi
  exact (((differentiable_id.mul (differentiable_id.sub_const 1)).mul h).add_const 1).div_const 2

lemma differentiable_Xi : Differentiable ℂ RiemannXiUpper := by
  unfold RiemannXiUpper
  exact differentiable_riemannXi.comp (by fun_prop)

/-- Eine Nullstelle von ζ im kritischen Streifen ist eine Nullstelle von ξ. -/
lemma riemannXi_eq_zero_of_zeta {s : ℂ} (hs0 : 0 < s.re) (hs1 : s.re < 1) (hz : riemannZeta s = 0) :
    riemannXi s = 0 := by
  have hne0 : s ≠ 0 := by rintro rfl; simp at hs0
  have hne1 : (1 : ℂ) - s ≠ 0 := by
    intro h
    have : s = 1 := by linear_combination -h
    rw [this] at hs1; simp at hs1
  have hΛ : completedRiemannZeta s = 0 := by
    have := riemannZeta_def_of_ne_zero hne0
    rw [hz] at this
    have hG : Gammaℝ s ≠ 0 := Gammaℝ_ne_zero_of_re_pos hs0
    exact (div_eq_zero_iff.mp this.symm).resolve_right hG
  have h0 : completedRiemannZeta₀ s = 1 / s + 1 / (1 - s) := by
    have := completedRiemannZeta_eq s
    rw [hΛ] at this
    linear_combination -this
  unfold riemannXi
  rw [h0]
  field_simp
  ring

/-- ξ(2) ≠ 0, also ist Ξ nicht identisch null. -/
lemma riemannXi_two_ne_zero : riemannXi 2 ≠ 0 := by
  have h2 : (2 : ℂ) ≠ 0 := two_ne_zero
  have hz : riemannZeta 2 ≠ 0 := riemannZeta_ne_zero_of_one_lt_re (by norm_num)
  have hG : Gammaℝ 2 ≠ 0 := Gammaℝ_ne_zero_of_re_pos (by norm_num)
  have hΛ : completedRiemannZeta 2 ≠ 0 := by
    have := riemannZeta_def_of_ne_zero h2
    intro h; rw [h, zero_div] at this; exact hz this
  have h0 : completedRiemannZeta₀ 2 = completedRiemannZeta 2 + 1 / 2 + 1 / (1 - 2) := by
    have := completedRiemannZeta_eq 2
    linear_combination -this
  unfold riemannXi
  rw [h0]
  intro h
  apply hΛ
  have : (2 : ℂ) * (2 - 1) * (completedRiemannZeta 2 + 1 / 2 + 1 / (1 - 2)) + 1 = 0 := by
    have := h; field_simp at this ⊢; linear_combination this
  linear_combination this / 2

/-- Isolierte Nullstellen von Ξ. -/
lemma Xi_isolated (z : ℂ) : ∀ᶠ w in 𝓝[≠] z, RiemannXiUpper w ≠ 0 ∨ RiemannXiUpper z ≠ 0 := by
  have han : AnalyticOnNhd ℂ RiemannXiUpper univ :=
    fun w _ => differentiable_Xi.analyticAt w
  rcases (han z (mem_univ z)).eventually_eq_zero_or_eventually_ne_zero with h | h
  · exfalso
    have heq := han.eqOn_zero_of_preconnected_of_eventuallyEq_zero isPreconnected_univ (mem_univ z) h
    -- Ξ(-(3/2) i) = ξ(2) ≠ 0
    have hpt : RiemannXiUpper (-(3 / 2) * I) = riemannXi 2 := by
      unfold RiemannXiUpper; congr 1; ring_nf; rw [I_sq]; ring
    exact riemannXi_two_ne_zero (hpt ▸ heq (mem_univ _))
  · exact h.mono fun w hw => Or.inl hw

/-- **Reduktionssatz.** Konvergieren auf S = {|Im z| < 1/2} holomorphe Funktionen mit nur reellen
    Nullstellen in S lokal gleichmäßig gegen Ξ, so gilt die Riemannsche Vermutung. -/
theorem riemannHypothesis_of_approximation (f : ℕ → ℂ → ℂ)
    (hf : ∀ n, DifferentiableOn ℂ (f n) {z : ℂ | |z.im| < 1 / 2})
    (hreal : ∀ n, ∀ z, |z.im| < 1 / 2 → f n z = 0 → z.im = 0)
    (hconv : TendstoLocallyUniformlyOn f RiemannXiUpper atTop {z : ℂ | |z.im| < 1 / 2}) :
    RiemannHypothesis := by
  have hS : IsOpen {z : ℂ | |z.im| < 1 / 2} :=
    isOpen_lt (continuous_abs.comp continuous_im) continuous_const
  have key := real_zeros_of_tendstoLocallyUniformlyOn hS hf (fun n z hz => hreal n z hz) hconv
    differentiable_Xi.continuous.continuousOn
    (fun z _ hz0 => (Xi_isolated z).mono fun w hw => hw.resolve_right (by simp [hz0]))
  -- von Form S (Lemma 0) nach Mathlib-RH
  intro s hz hnt _hs1
  -- Lemma 0a wird hier nur für den Streifen gebraucht; Beweis wie in RHTarget.lean
  have hstrip : 0 < s.re ∧ s.re < 1 := by
    exact mem_strip_of_zero hz hnt
  set z : ℂ := (s - 1 / 2) / I with hzdef
  have hsz : s = 1 / 2 + I * z := by rw [hzdef]; field_simp; ring
  have hzim : z.im = -(s.re - 1 / 2) := by
    rw [hzdef]; simp [div_I]
  have hzS : |z.im| < 1 / 2 := by
    rw [hzim, abs_lt]; constructor <;> linarith [hstrip.1, hstrip.2]
  have hXi : RiemannXiUpper z = 0 := by
    unfold RiemannXiUpper; rw [← hsz]; exact riemannXi_eq_zero_of_zeta hstrip.1 hstrip.2 hz
  have := key z hzS hXi
  rw [hzim] at this
  linarith

end RHDossier

#print axioms RHDossier.riemannHypothesis_of_approximation
