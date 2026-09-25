/-
  RH-Forschungsakte · formal/RHTarget.lean
  Lemma 0 (Target-Freeze): Die Streifen-Formulierung der Zielaussage (Clay/Bombieri, T-0)
  ist äquivalent zu Mathlibs `RiemannHypothesis`.

  Geprüft gegen Mathlib (Commit im DOSSIER, Version Record V-2). Keine `sorry`, keine eigenen Axiome.
-/
import Mathlib

open Complex
open scoped Real

namespace RHDossier

/-- T-0 in der Form der Projekt-Spezifikation:
    ∀ ρ, ζ(ρ) = 0 ∧ 0 < Re ρ < 1 → Re ρ = 1/2. -/
def RHStrip : Prop :=
  ∀ ρ : ℂ, riemannZeta ρ = 0 → 0 < ρ.re → ρ.re < 1 → ρ.re = 1 / 2

/-- Lemma 0a. Jede Nullstelle von ζ, die keine triviale Nullstelle −2(n+1) ist,
    liegt im offenen kritischen Streifen 0 < Re s < 1.
    (Benutzt: Nichtverschwinden auf Re s ≥ 1 [Hadamard–de la Vallée Poussin, in Mathlib],
    Funktionalgleichung, Γ ≠ 0, Nullstellen des Kosinus, ζ(0) = −1/2.) -/
theorem mem_strip_of_zero {s : ℂ} (hz : riemannZeta s = 0)
    (hnt : ¬∃ n : ℕ, s = -2 * (n + 1)) : 0 < s.re ∧ s.re < 1 := by
  refine ⟨?_, ?_⟩
  · by_contra h
    rw [not_lt] at h
    -- s = 1 - w mit Re w ≥ 1
    set w : ℂ := 1 - s with hw
    have hwre : 1 ≤ w.re := by
      simp only [hw, sub_re, one_re]; linarith
    have hw_nat : ∀ n : ℕ, w ≠ -n := by
      intro n hn
      have : w.re = -(n : ℝ) := by rw [hn]; simp
      have : (0 : ℝ) ≤ n := Nat.cast_nonneg n
      linarith
    have hs0 : s ≠ 0 := by
      rintro rfl
      rw [riemannZeta_zero] at hz
      norm_num at hz
    have hw1 : w ≠ 1 := by
      intro h1
      apply hs0
      have : s = 1 - w := by rw [hw]; ring
      rw [this, h1]; ring
    have hfe := riemannZeta_one_sub hw_nat hw1
    have hsw : 1 - w = s := by rw [hw]; ring
    rw [hsw, hz] at hfe
    -- 0 = 2 * (2π)^(-w) * Γ(w) * cos(π w / 2) * ζ(w); jeder Faktor ≠ 0
    have h2pi : (2 * (π : ℂ)) ^ (-w) ≠ 0 := by
      rw [Ne, cpow_eq_zero_iff]
      push Not
      intro h
      exfalso
      have : (2 : ℂ) * π ≠ 0 := by
        exact mul_ne_zero two_ne_zero (ofReal_ne_zero.mpr Real.pi_ne_zero)
      exact this h
    have hgam : Gamma w ≠ 0 := Gamma_ne_zero hw_nat
    have hzw : riemannZeta w ≠ 0 := riemannZeta_ne_zero_of_one_le_re hwre
    have hcos : cos (π * w / 2) ≠ 0 := by
      intro hc
      rw [Complex.cos_eq_zero_iff] at hc
      obtain ⟨k, hk⟩ := hc
      have hpi : (π : ℂ) ≠ 0 := ofReal_ne_zero.mpr Real.pi_ne_zero
      have hwk : w = 2 * k + 1 := by
        have h' : (π : ℂ) * w = π * (2 * k + 1) := by linear_combination 2 * hk
        exact mul_left_cancel₀ hpi h'
      have hsk : s = -2 * k := by
        have : s = 1 - w := by rw [hw]; ring
        rw [this, hwk]; ring
      have hkre : (1 : ℝ) ≤ 2 * k + 1 := by
        have := hwre
        rw [hwk] at this
        simpa using this
      have hk0 : 0 ≤ k := by
        have : (0 : ℝ) ≤ k := by linarith
        exact_mod_cast this
      rcases (show k = 0 ∨ 1 ≤ k by omega) with hk0' | hk1
      · apply hs0; rw [hsk, hk0']; simp
      · apply hnt
        refine ⟨(k - 1).toNat, ?_⟩
        rw [hsk]
        have : ((k - 1).toNat : ℤ) = k - 1 := Int.toNat_of_nonneg (by omega)
        have hc : (((k - 1).toNat : ℕ) : ℂ) = ((k : ℂ) - 1) := by
          have := congrArg (fun z : ℤ => (z : ℂ)) this
          simpa using this
        rw [hc]; ring
    have hprod : (2 : ℂ) * (2 * π) ^ (-w) * Gamma w * cos (π * w / 2) * riemannZeta w ≠ 0 := by
      apply mul_ne_zero (mul_ne_zero (mul_ne_zero (mul_ne_zero two_ne_zero h2pi) hgam) hcos) hzw
    exact hprod hfe.symm
  · by_contra h
    rw [not_lt] at h
    exact riemannZeta_ne_zero_of_one_le_re h hz

/-- Lemma 0. Die Projekt-Zielaussage ist äquivalent zu Mathlibs `RiemannHypothesis`. -/
theorem rhStrip_iff_riemannHypothesis : RHStrip ↔ RiemannHypothesis := by
  constructor
  · intro h s hz hnt _hs1
    obtain ⟨h0, h1⟩ := mem_strip_of_zero hz hnt
    exact h s hz h0 h1
  · intro h ρ hz h0 h1
    refine h ρ hz ?_ ?_
    · rintro ⟨n, rfl⟩
      have : (-2 * ((n : ℂ) + 1)).re = -2 * ((n : ℝ) + 1) := by simp
      rw [this] at h0
      have : (0 : ℝ) ≤ n := Nat.cast_nonneg n
      linarith
    · rintro rfl
      simp at h1

end RHDossier

#print axioms RHDossier.rhStrip_iff_riemannHypothesis
