# 00 · Target Freeze — Riemannsche Hypothese

**Stand:** 2026-09-25 · **Status MAIN:** `OPEN` · **Status Lemma 0:** `FORMALLY VERIFIED`

## 1. Die eingefrorene Zielaussage MAIN

MAIN ist Bombieris offizielle Clay-Formulierung. Sie wird hier in drei Formen geführt. Lemma 0 zeigt,
dass die drei Formen äquivalent sind; ab dann ist gleichgültig, welche man beweist.

| Form | Wortlaut | Quelle |
|---|---|---|
| **B** (offiziell) | „The nontrivial zeros of ζ(s) have real part equal to 1/2.“ Dabei heißen −2, −4, … die *trivialen* Nullstellen, „the other zeros“ die nichttrivialen. | Bombieri, *Problems of the Millennium: the Riemann Hypothesis*, Clay Math. Inst., §I, S. 1 |
| **S** (Projekt, T-0) | ∀ρ ∈ ℂ: ζ(ρ) = 0 ∧ 0 < Re ρ < 1 ⇒ Re ρ = 1/2 | Nutzerspezifikation vom 2026-09-25 |
| **M** (formal) | `RiemannHypothesis := ∀ s, riemannZeta s = 0 → (¬∃ n : ℕ, s = -2 * (n + 1)) → s ≠ 1 → s.re = 1 / 2` | Mathlib, `Mathlib/NumberTheory/LSeries/RiemannZeta.lean` (Commit `5e0c4e5`, 2026-09-25) |

Zu Form M: In Mathlib ist `riemannZeta 1` ein wohldefinierter Ersatzwert (Pol), und dieser Wert ist ≠ 0.
Deshalb ist die Klausel `s ≠ 1` inhaltlich leer, schadet aber nicht.

Negation (Gegenbeispiel-Ausgang): ∃ρ: ζ(ρ) = 0 ∧ 0 < Re ρ < 1 ∧ Re ρ ≠ 1/2. Wegen der Symmetrie
ρ ↦ 1 − ρ̄ ist das äquivalent zu ∃ρ: ζ(ρ) = 0 ∧ 1/2 < Re ρ < 1.

### Lemma 0 (Äquivalenz B ⇔ S ⇔ M) — `FORMALLY VERIFIED`

**Aussage.** (a) Ist ζ(s) = 0 und s keine triviale Nullstelle, so gilt 0 < Re s < 1.
(b) Die Aussagen S und M sind äquivalent.

**Beweis.** Zu (a):
- *Fall Re s ≥ 1:* Das ist unmöglich, denn ζ(s) ≠ 0 für Re s ≥ 1 (Hadamard / de la Vallée Poussin 1896;
  in Mathlib: `riemannZeta_ne_zero_of_one_le_re`).
- *Fall Re s ≤ 0:* Setze w = 1 − s, also Re w ≥ 1. Weil Re w > 0, ist w ∉ −ℕ. Außerdem gilt s ≠ 0, da
  ζ(0) = −1/2, und daher w ≠ 1. Die Funktionalgleichung (Mathlib `riemannZeta_one_sub`) liefert
  ζ(s) = ζ(1 − w) = 2(2π)^{−w} Γ(w) cos(πw/2) ζ(w). Die Faktoren (2π)^{−w}, Γ(w) (da w ∉ −ℕ) und
  ζ(w) (da Re w ≥ 1) sind alle ≠ 0. Also folgt aus ζ(s) = 0, dass cos(πw/2) = 0. Dann ist w = 2k + 1 mit
  k ∈ ℤ, k ≥ 0, also s = −2k. Für k = 0 widerspricht das ζ(0) ≠ 0. Für k ≥ 1 ist s trivial.
  Das ist ein Widerspruch.

Zu (b): Mit (a) ist jede nichttriviale Nullstelle im Streifen, also folgt M aus S. Umgekehrt ist ein ρ
im Streifen nicht trivial (triviale Nullstellen haben Re < 0) und ≠ 1. ∎

**Formale Verifikation:** [`../formal/RHTarget.lean`](../formal/RHTarget.lean), Satz
`RHDossier.rhStrip_iff_riemannHypothesis`. Kompiliert mit Lean `v4.35.0-rc3` gegen Mathlib `5e0c4e5`.
`#print axioms` liefert nur `[propext, Classical.choice, Quot.sound]`, kein `sorryAx`.
Importiert sind ausschließlich Mathlib-Sätze, darunter Nichtverschwinden auf Re s ≥ 1,
Funktionalgleichung und ζ(0) = −1/2.

Lemma 0 ist die einzige Stelle, an der die „Definition der nichttrivialen Nullstellen“ in die
Beweiskette eingeht. Damit ist RH-01 und RH-02 des Acceptance Contract erfüllt.

## 2. Archivierte Primärquellen (abgerufen 2026-09-25)

Die Dateien selbst werden aus urheberrechtlichen Gründen nicht eingecheckt. Mit dem SHA-256 lässt
sich jede spätere Abweichung feststellen.

| Dokument | URL | SHA-256 |
|---|---|---|
| Bombieri, offizielle Problembeschreibung (11 S.) | `https://www.claymath.org/wp-content/uploads/2022/05/riemann.pdf` | `1454b2909f99271726ffb68b056aef45b7d3e6893a66282cad596339d69bafa9` |
| CMI Rules for the Millennium Prize Problems (Fassung vom 26.09.2018, 4 S.) | `https://www.claymath.org/wp-content/uploads/2022/03/millennium_prize_rules_0.pdf` | `9b5003745c0ae7268dc7769f83e1c61eaca674f28631f1df2cd8400976640b2a` |
| CMI-Seite „Riemann Hypothesis“ (HTML) | `https://www.claymath.org/millennium/riemann-hypothesis/` | `fbefff83737a12f6b36de74c251ee10127507b76b322807433fea8e5e5c985ff` (dynamisch, nur Indiz) |
| Platt–Trudgian, arXiv:2004.09765 | `https://arxiv.org/pdf/2004.09765` | (Text ausgewertet, s. §3) |
| Alpöge–Furman, arXiv:2608.13637v2 | `https://arxiv.org/pdf/2608.13637v2` | `6de3b156342e7b4a802c34f8ef40432567e9dabe006938da04233f19fc4ef444` |
| Lamzouri, arXiv:2609.02882v2 | `https://arxiv.org/pdf/2609.02882v2` | `305df7fcbbf96e61ccca2cbae13dcb2b7f9251b054d02dd0c78551982621046b` |

## 3. Audit der Eingangsangaben (Foundational-Audit-Track)

Jede Aussage der Projektbeschreibung wurde gegen die Primärquelle geprüft.
Legende: ✅ bestätigt · ⚠️ bestätigt mit Präzisierung · ❌ korrigiert. † = Standardzitat; Original in dieser Sitzung **nicht** eingesehen. Muss vor Verwendung auf dem MAIN-Pfad am Original geprüft werden (RH-12).

| # | Eingangsaussage | Befund | Beleg |
|---|---|---|---|
| A1 | ζ meromorph auf ℂ, einfacher Pol bei 1, Funktionalgleichung wie angegeben | ✅ (Residuum 1) | Bombieri §I, Gl. (1) |
| A2 | Offizielle Formulierung wie in S | ⚠️ Bombieri definiert „nichttrivial“ als *alle anderen* Nullstellen, nicht über den Streifen. Die Äquivalenz ist nicht trivial (braucht ζ ≠ 0 auf Re s = 1), sie ist aber jetzt formal bewiesen. | Lemma 0 |
| A3 | „Clay gibt an, dass die ersten 10¹³ Nullstellen überprüft sind“ | ⚠️ Die Clay-Seite sagt wörtlich „checked for the first 10,000,000,000,000 solutions“. Die Zahl geht auf Gourdon (2004, H = 2,44·10¹²) zurück, eine **nicht begutachtete** Rechnung ohne dokumentierte Fehlerkontrolle. Der **rigorose, begutachtete** Rekord ist Platt–Trudgian: RH gilt bis Höhe 3 000 175 332 800, d. h. für die ersten **12 363 153 437 138** Nullstellen (Intervallarithmetik). Bombieris Text von 2000 nennt noch 1,5·10⁹. | Clay-Seite; Platt–Trudgian, Bull. LMS 53 (2021) 792–797, Thm. 1 und S. 1 |
| A4 | „Clay sieht bei RH ausdrücklich auch einen Counterexample als Lösungsweg vor; gleiches Verfahren“ | ⚠️ Regel 5(c): Ein Gegenbeispiel wird nach demselben Verfahren *evaluiert*. Eine Prämie „may“ empfohlen werden, wenn es nach CMI-Urteil „effectively resolves the Problem“. Die ausdrückliche Gleichstellung beider Richtungen („resolution in either direction“, 5(b)) gilt nur für P vs NP und Navier–Stokes. Mathematisch widerlegt eine zertifizierte Off-Line-Nullstelle RH trotzdem vollständig. | CMI Rules §5(b), §5(c)(i)–(ii) |
| A5 | Qualifying Outlet, 2 Jahre, allgemeine Akzeptanz, keine Direkteinreichung, keine Supplementary Materials | ✅ | CMI Rules §4(a)–(c), §5(e), §6(a)–(f), §7(a) |
| A6 | RH ⇔ π(x) = Li(x) + O(√x log x) | ✅ Nennung bei Bombieri. Ursprung: von Koch, Math. Ann. 55 (1901)†. Explizit unter RH (Schoenfeld, Math. Comp. 30 (1976))†: \|π(x) − li(x)\| < √x log x / (8π) für x ≥ 2657. | Bombieri §II |
| A7 | Li-Kriterium: RH ⇔ λ_n ≥ 0 ∀n | ✅ (Li 1997, J. Number Theory 65, 325–333). Unter RH gilt sogar λ_n > 0. Bombieri–Lagarias 1999 (JNT 77, 274–287): Das Kriterium gilt für beliebige Multimengen von Punkten und ist **nicht zeta-spezifisch**. Das ist eine wichtige Barriere-Information. | Li; Bombieri–Lagarias |
| A8 | RH ⇔ Λ ≤ 0, Rodgers–Tao Λ ≥ 0, also RH ⇔ Λ = 0 | ✅ Rodgers–Tao, Forum Math. Pi 8 (2020) e6. Beste obere Schranke: **Λ ≤ 0,2** (Platt–Trudgian 2021, über die Maschinerie von Polymath 15, die Λ ≤ 0,22 lieferte). Eine im Netz behauptete Schranke 0,1787854 ist **nicht belegt** (kein arXiv-Eintrag gefunden). | Rodgers–Tao; Polymath, Res. Math. Sci. 6 (2019) |
| A9 | Weil (Kurven), Deligne (Varietäten über 𝔽_q) | ✅ Weil 1948; Deligne, Publ. IHES 43 (1974), 52 (1980) | Bombieri §IV |
| A10 | Symmetrie ρ, 1−ρ, ρ̄, 1−ρ̄ | ✅ aus ξ(s) = ξ(1−s) und ξ(s̄) = ξ(s)‾; Nullstellen von ξ = nichttriviale Nullstellen von ζ | Bombieri §I |
| A11 | Hilbert–Pólya: „braucht Spec(A) = {γ_n}, nicht bloß Spec(A) ⊆ {γ_n}“ | ❌ **Quantorenkorrektur.** Für RH genügt die *umgekehrte* Inklusion {γ : ξ(½+iγ) = 0} ⊆ σ(A) für ein selbstadjungiertes A: Jedes γ liegt dann in σ(A) ⊂ ℝ. Multiplizitäten und Vollständigkeit sind für RH **nicht** nötig. Die Inklusion σ(A) ⊆ {γ} ist wertlos, Gleichheit ist mehr als nötig. Das eigentliche Hindernis ist also, **jedes** γ als Spektralpunkt nachzuweisen. | elementar; s. Quantifier Ledger Q-HP |
| A12 | Weil-Kriterium | ✅ Präzise nach Bombieri: RH ⇔ die rechte Seite der expliziten Formel ist **negativ** für alle f(x) = ∫₀^∞ g(xy) ḡ(y) dy mit g ∈ 𝒲 und ∫₀^∞ g(x) dx/x = ∫₀^∞ g(x) dx = 0. | Bombieri §V |
| A13 | „10¹⁰⁰ Nullstellen / positive Dichte / 99,99999 % lösen RH nicht“ | ✅ und aktuell. Neu (Aug./Sept. 2026, **Preprints, nicht begutachtet**): ≥ 2/3 der Nullstellen sind einfach und auf der Geraden, und zwar unbedingt (Alpöge–Furman, arXiv:2608.13637; Lamzouri, arXiv:2609.02882; Lean-formalisiert). Die Autoren schreiben selbst: „Nothing in the method distinguishes between ‘two thirds’ and ‘all’“, „RH itself is out of reach of the mechanism“. | §7.2 dort |

## 4. Konsequenzen für die Spezifikation

- Das Gegenbeispiel-Ziel ist quantitativ präzisiert: Jede Gegen-Nullstelle hat |γ| > 3 000 175 332 800
  (Platt–Trudgian) und nach Symmetrie o. B. d. A. 1/2 < β < 1.
- Die Hilbert–Pólya-Zeile im Quantifier Ledger wird auf die korrekte, schwächere Inklusion umgestellt (A11).
- Die Li-Route bekommt die Bombieri–Lagarias-Warnung: Positivitätsargumente, die nur allgemeine
  Eigenschaften einer Punktmenge benutzen, können nicht zeta-spezifisch sein (A7).
