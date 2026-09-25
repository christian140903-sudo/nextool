# 02 · Equivalence Atlas

Jede Route bekommt eine Zeile mit:
- **Aussage:** exakte Aussage und vollständige Quantorenform
- **Richtung:** Beziehung zu MAIN (⇔ Äquivalenz, ⇐ nur hinreichend)
- **Quelle:** ✓ = in dieser Sitzung am Primärtext oder arXiv-Abstract geprüft, † = Standardzitat, noch nicht am Original geprüft
- **Stand:** bekannte Teilresultate
- **Fehlt exakt:** der fehlende Satz
- **Eulerprodukt?:** Benutzt die Route die Arithmetik? Das ist relevant für RH-18. Eine Route, die das
  Eulerprodukt nicht „sieht“, gilt genauso für Davenport–Heilbronn und kann ohne arithmetischen Input
  nicht zum Ziel führen.

## A. Analytische Grundformen

| ID | Aussage (quantifiziert) | Richtung | Quelle | Stand | Fehlt exakt | Eulerprodukt? |
|---|---|---|---|---|---|---|
| E-0 | ∀ρ: ζ(ρ)=0 ∧ 0<Re ρ<1 ⇒ Re ρ=½ | = MAIN | ✓ Bombieri §I; Lemma 0 (formal) | alle ρ mit 0<γ≤3 000 175 332 800 (✓ Platt–Trudgian); Dichte ≥ 2/3 einfach auf der Geraden (✓ Preprints 2026) | das ∀ über alle Höhen | — |
| E-1 | ∀t∈ℂ: Ξ(t)=0 ⇒ t∈ℝ, mit Ξ(t)=ξ(½+it) | ⇔ (Lemma 0) | ✓ Bombieri §I | wie E-0 | wie E-0 | nein (Ξ allein) |
| E-2 | ∃C,x₀ ∀x≥x₀: \|π(x)−li(x)\| ≤ C√x log x | ⇔ | ✓ Bombieri §II (von Koch 1901†) | unbedingt nur de-la-Vallée-Poussin/Vinogradov–Korobov-Fehlerterme† | punktweise √x-Kontrolle ∀x | ja (π(x)) |
| E-2′ | ∀ε>0 ∃C: \|M(x)\| ≤ C x^{½+ε} (M = Mertensfunktion) | ⇔ | † Littlewood 1912 | — | wie E-2 | ja (μ) |
| E-2″ | Mertens-Vermutung \|M(x)\| < √x | ⇒ RH, aber **FALSCH** | † Odlyzko–te Riele 1985 | widerlegt | — | — |
| E-3 | Speiser: ζ′(s) ≠ 0 für 0 < Re s < ½ | ⇔ | † Speiser 1934; Levinson–Montgomery 1974 | — | Nullstellenfreiheit von ζ′ im linken Halbstreifen ∀ Höhen | nein |

## B. Positivität und Quadratische Formen

| ID | Aussage (quantifiziert) | Richtung | Quelle | Stand | Fehlt exakt | Eulerprodukt? |
|---|---|---|---|---|---|---|
| E-4 | **Weil:** ∀g∈𝒲 mit ∫g dx/x = ∫g dx = 0: RHS der expliziten Formel für f=g∗g̃ ist ≤ 0 (Bombieris Vorzeichenkonvention) | ⇔ | ✓ Bombieri §V (Weil 1952) | Positivität für Träger in [−½log 2, ½log 2] (Yoshida 1992†; Connes–Consani 2021†); **zertifiziert** für Träger in [−0,8; 0,8] (Zhu, arXiv:2608.24827, Preprint ✓Abstract) | ∀L>0: W≥0 auf C_c^∞([−L,L]) | **ja** (Λ(n)) |
| E-4a | **Fensterform:** ∀L>0: λ_min(L) := inf_{supp f⊂[−L,L]} Q(f)/‖f‖² ≥ 0 | ⇔ (jedes f mit kompaktem Träger liegt in einem Fenster) | ✓ Zhu (Abstract) | L ≤ 0,8 zertifiziert: 8,9·10⁻¹⁸ ≤ λ_min(0,8) ≤ 2,27·10⁻¹⁷ | uniformes Argument in L | ja; für festes L nur Primpotenzen ≤ e^{2L} |
| E-5 | **Li:** ∀n≥1: λ_n ≥ 0, λ_n = Σ_ρ[1−(1−1/ρ)^n] | ⇔ | ✓ Li 1997 (JNT 65); Bombieri–Lagarias 1999 (JNT 77) | λ_1..λ_1000 rigoros > 0 (**diese Sitzung**, `li_coefficients_1000.json`) | ∀n; Asymptotik λ_n ~ (n/2)log n uniform | **nein** (Bombieri–Lagarias: gilt für beliebige Multimengen) |
| E-6 | **Nyman–Beurling / Báez-Duarte:** 𝟙 ∈ closure_{L²(0,1)} span{φ(kx) : k ∈ ℕ}, φ(x) = {1/x} (gebrochener Anteil); Nyman–Beurling mit allen Dilatationen ρ_θ(x) = {θ/x} − θ{1/x}, 0<θ≤1 | ⇔ | Báez-Duarte, Atti Accad. Naz. Lincei 14 (2003) 5–11 (Formulierung aus Sekundärzusammenfassung, Original†); Beurling 1955† | Distanz d_N → 0 unbekannt; untere Schranken d_N² ≳ C/log N† | d_N → 0 | über 1/ζ (Möbius) implizit |
| E-7 | **Jensen–Pólya:** ∀d≥1 ∀n≥0: J_γ^{d,n}(X) hat nur reelle Nullstellen | ⇔ | ✓ Griffin–Ono–Rolen–Zagier, PNAS 116 (2019) 11103 (Suchtreffer) | für jedes feste d: alle hinreichend großen n (GORZ); weitere Keile 2026 (arXiv:2608.08682†) | Uniformität in (d, n) gleichzeitig | nein (nur Taylorkoeffizienten von Ξ) |

### Festgelegte Konvention für E-4/E-4a (K-W)

Nach Alpöge–Furman, arXiv:2608.13637, Gl. (2.1) (Primärtext geprüft ✓; dort verwiesen auf
Iwaniec–Kowalski §5.5†): Für gerades F ∈ C_c²(ℝ), F̂(τ) = ∫ F(x) e^{iτx} dx, γ_ρ = (ρ−½)/i gilt

  Σ_ρ m_ρ F̂(γ_ρ) = F̂(i/2) + F̂(−i/2) + ∫_ℝ F̂(τ) μ(τ) dτ − 2 Σ_{n≥1} Λ(n) n^{−1/2} F(log n),
  μ(τ) = (1/2π) Re (Γ′/Γ)(¼ + iτ/2) − (log π)/(2π).

Weils Hermitesche Form ist W(f,g) = Σ_ρ m_ρ f̂(γ_ρ) conj(ĝ(γ_ρ)), ausgewertet über die rechte Seite mit
F = f ∗ g̃. **K-W:** W(f,f) ≥ 0 für alle f ∈ C_c²([−L, L]) (Zhus Konvention: L misst den Träger von f; F = f ∗ f̃ hat Träger in [−2L, 2L], also gehen nur Primpotenzen n ≤ e^{2L} ein).
Laut Alpöge–Furman ist Positivität auf ganz C_c²(ℝ) äquivalent zu RH [Weil 1952, Bombieri 2000].
Der Knoten IMP-WEIL bleibt `hypotheses_checked = false`, bis die Äquivalenz in *dieser* Normierung am
Original nachvollzogen ist (WP-D).

## C. Spektral / Deformation

| ID | Aussage (quantifiziert) | Richtung | Quelle | Stand | Fehlt exakt | Eulerprodukt? |
|---|---|---|---|---|---|---|
| E-8 | **Hilbert–Pólya:** ∃A=A* auf Hilbertraum mit {γ: Ξ(γ)=0} ⊆ σ(A) | ⇐ (**Quantorenkorrektur A11**: die Inklusion *Nullstellen ⊆ Spektrum* genügt) | Bombieri §V | tautologisch äquivalent, **falls** RH gilt (dann Diagonaloperator). Inhalt liegt also allein in einer *RH-freien* Konstruktion | eine Konstruktion, bei der „ζ(½+iγ)=0 ⇒ γ∈σ(A)“ **ohne** RH bewiesen wird | je nach Konstruktion |
| E-8a | **Connes–Consani–Moscovici (2025):** Selbstadjungierte D_log^{(λ,N)} aus dem Eulerprodukt über p ≤ λ²; Nullstellen ihrer Determinanten liegen auf der Geraden | ⇐ wenn (M1) + (M2) | ✓ arXiv:2511.22755 §8 („two essential steps still missing“) | numerisch: mit Primzahlen ≤ 13 erste 50 Nullstellen bis 2,5·10⁻⁵⁵ genau | **(M1)** kleinster Eigenwert von QW_λ einfach, Eigenvektor gerade, ∀λ; **(M2)** ξ̂_λ → Ξ (normiert) gleichmäßig auf abgeschlossenen Teilstreifen von \|Im z\|<½, dann Hurwitz | **ja** |
| E-9 | **de Bruijn–Newman:** Λ ≤ 0 | ⇔; mit Rodgers–Tao: RH ⇔ Λ = 0 | ✓ Rodgers–Tao, Forum Math. Pi 8 (2020) e6 | 0 ≤ Λ ≤ 0,2 (Platt–Trudgian 2021; Polymath15: 0,22) | Λ ≤ 0 | nein (Wärmefluss auf Ξ; Newman-Aussage gilt für ganze Klassen†) |

## D. Arithmetisch-elementar

| ID | Aussage (quantifiziert) | Richtung | Quelle | Stand | Fehlt exakt | Eulerprodukt? |
|---|---|---|---|---|---|---|
| E-10 | **Robin:** ∀n>5040: σ(n) < e^γ n log log n | ⇔ | † Robin 1984 | gilt für ungerade/quadratfreie n† und alle n bis zu sehr großen Schranken† | alle kolossal abundanten Zahlen | ja (σ multiplikativ) |
| E-11 | **Lagarias:** ∀n≥1: σ(n) ≤ H_n + e^{H_n} log H_n | ⇔ | ✓ Lagarias, Amer. Math. Monthly 109 (2002) 534–543 (Suchtreffer) | wie E-10 | wie E-10 | ja |
| E-12 | Redheffer-Determinante / Farey (Franel–Landau) | ⇔ | † | — | — | ja (μ) |

## E. Strukturelle Programme (keine bewiesene Äquivalenz)

| ID | Programm | Was es liefern müsste | Stand |
|---|---|---|---|
| P-1 | Weil/Deligne-Analogie (Bombieri §IV–V): Kohomologie + Frobenius + Indexsatz über Spec ℤ | Einen **Hodge-Indexsatz** für eine „Fläche“ Spec ℤ × Spec ℤ, aus dem Weil-Positivität (E-4) folgt, so wie im Kurvenfall aus Castelnuovo–Severi | offen; Kandidatenrahmen: Connes–Consani (arithmetic site†), Deninger (Blätterungen†), Haran† |
| P-2 | Rang–Spur/Trägheit (Alpöge–Furman 2026) | — | liefert höchstens Dichteaussagen: „RH itself is out of reach of the mechanism“ (✓ §7.2) |

---

## Wo steckt der kleinste ungelöste Kern?

Leitfrage der Spezifikation: *Welche Form verschiebt den ungelösten Teil in die kleinste, klarste Behauptung?*

1. **Routen ohne Eulerprodukt (E-1, E-3, E-5, E-7, E-9)** formulieren nur die Nullstellenlage einer ganzen
   Funktion um. Nach RH-18 muss in jeden Beweis an irgendeiner Stelle Arithmetik eingehen. Diese Routen
   verlegen das Problem also nur und sind als *Diagnose- und Falsifikationswerkzeuge* nützlich, nicht als
   Hauptweg. Belegt ist das durch die rigoros zertifizierten Off-Line-Nullstellen von Davenport–Heilbronn
   und Epstein (04-COMPUTATIONS).
2. **Dichteverfahren (P-2, Levinson/Conrey, Zero-Density)** haben eine dokumentierte Decke: Sie
   unterscheiden „Anteil 1“ nicht von „alle“.
3. **Weil-Familie (E-4, E-4a, E-8a)** ist *lokal*: Für jedes Fenster L gehen nur endlich viele
   Primpotenzen ein, und genau hier greift das Eulerprodukt. Der ungelöste Kern ist *eine* Aussage mit
   *einem* Quantor über einen reellen Parameter:

   > **K-W:** ∀L>0: Die Weil-Form ist auf C_c^∞([−L,L]) positiv semidefinit.

   Die CCM-Variante zerlegt K-W sogar in zwei benannte Teilaussagen (M1), (M2), deren Konjunktion über
   Hurwitz RH liefert.
4. **Barriere für K-W** (Zhu 2026, Abstract): λ_min(L) fällt unter RH wie exp(−L e^L). Jedes
   Einzelfenster-Zertifikat braucht eine doppelt-exponentielle Auflösung. Für ∀L kann also nur ein
   **strukturelles, in L uniformes Argument** funktionieren, keine Rechnung.

**Arbeitsentscheidung (Version V-2):** Primärer Forschungskern ist **K-W in der CCM-Zerlegung (M1)+(M2)**.
Sekundär dient der Struktur-Track P-1 (Indexsatz) als Quelle für einen *uniformen*
Positivitätsmechanismus. Li, de Bruijn–Newman und Jensen bleiben Falsifikations- und Kontrollinstrumente.
Die Entscheidung ist revidierbar und steht im Strategy Map-Eintrag S-1 des DOSSIER.
