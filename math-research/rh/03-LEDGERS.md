# 03 · Quantifier-, Barrier- und False-Shortcut-Ledger

## Quantifier Ledger

| ID | Aussage in vollständig quantifizierter Form | Anmerkung |
|---|---|---|
| Q-MAIN | ∀ρ∈ℂ: [ζ(ρ)=0 ∧ 0<Re ρ<1] ⇒ Re ρ=½ | eingefroren (00) |
| Q-NEG | ∃ρ∈ℂ: ζ(ρ)=0 ∧ ½<Re ρ<1 ∧ Im ρ > 3 000 175 332 800 | Die Höhenschranke ist ein Satz (Platt–Trudgian), keine Annahme |
| Q-E2 | ∃C>0 ∃x₀ ∀x≥x₀: \|π(x)−li(x)\| ≤ C√x log x | *nicht* ausreichend: O(x^{½+ε}) für *ein* festes ε>0; Mittelwertschranken; endliche x-Bereiche |
| Q-E4a | ∀L>0 ∀f∈C_c^∞([−L,L]): Q(f) ≥ 0 | für festes L ist das eine Aussage über endlich viele Primpotenzen ≤ e^{2L}; ∀L ist das Problem |
| Q-E5 | ∀n∈ℕ_{≥1}: λ_n ≥ 0 | λ_1..λ_N > 0 für endliches N ist Evidenz |
| **Q-HP** | ∃ Hilbertraum ℋ ∃A: dom(A)⊂ℋ→ℋ, A=A* (nicht nur symmetrisch) ∧ ∀γ∈ℂ: [Ξ(γ)=0 ⇒ γ∈σ(A)] | **korrigiert (A11):** Inklusion Nullstellen ⊆ Spektrum genügt. Gleichheit oder Multiplizitäten sind nicht nötig. σ(A) ⊆ Nullstellen ist wertlos. |
| Q-dBN | Λ ≤ 0, wo Λ = inf{t : ∀z∈ℂ [H_t(z)=0 ⇒ z∈ℝ]} | Λ ≥ 0 ist bewiesen, also Ziel Λ = 0 |
| Q-M1 | ∀λ>1: Der kleinste Eigenwert von QW_λ ist einfach, und sein Eigenvektor ξ_λ ist gerade (invariant unter u↦u⁻¹) | CCM §8, Schritt 1 |
| Q-M2 | ∃(c_λ)_{λ>1} ⊂ ℂ^× ∀K⊂{\|Im z\|<½} kompakt: sup_{z∈K} \|c_λ ξ̂_λ(z) − Ξ(z)\| → 0 für λ→∞ | CCM §7–8. Achtung: gleichmäßig auf *kompakten Teilmengen des offenen Streifens* genügt für Hurwitz, weil alle Nullstellen von Ξ in \|Im z\|<½ liegen (Lemma 0) |
| Q-HUR | (Hurwitz) D ⊂ ℂ Gebiet, f_n → f lokal gleichmäßig auf D, f ≢ 0, alle Nullstellen aller f_n in D reell ⇒ alle Nullstellen von f in D reell | Standardsatz der Funktionentheorie. Zu prüfen: dass ξ̂_λ *nur* reelle Nullstellen in D hat (CCM Thm. 5.10 unter M1) |

## Barrier Ledger

| ID | Route | Exakt fehlender Schritt | Bewiesene/belegte Barriere | Status |
|---|---|---|---|---|
| B-QUANT | alle numerischen Routen | ∀ statt endlich | logisch: endlich ≠ ∀ | bewiesen (trivial) |
| B-DENS | Dichte-/Mollifier-/Rang–Spur-Verfahren | „Anteil 1“ → „alle“ | Alpöge–Furman §7.2: „Nothing in the method distinguishes between ‘two thirds’ and ‘all’“, „RH itself is out of reach“; selbst voller Formfaktor gäbe nur 100 %. **Gegenmodell:** Für Linearkombinationen von Eulerprodukten (Davenport–Heilbronn, Epstein) liegen unter GRH + Abstandshypothese fast alle Nullstellen auf der Geraden (Bombieri–Hejhal, Duke Math. J. 80 (1995) 821–862†), obwohl unendlich viele außerhalb liegen. Außerhalb liegende Nullstellen sind in dieser Sitzung zertifiziert (B-EP). Also: 100 % auf der Geraden ⇏ alle auf der Geraden, auch für Funktionen mit FE. | belegt ✓ (Bombieri–Hejhal †) |
| **B-EP** | jede Route ohne Eulerprodukt | arithmetischer Input | **Davenport–Heilbronn** (Dirichletreihe, FE vom Riemann-Typ, Ordnung 1) hat Nullstellen mit Re s ≠ ½. In dieser Sitzung **rigoros zertifiziert**: 4 Nullstellen, z. B. in [0,8075; 0,8095]×[85,6983; 85,7003]. **Epstein** x²+5y² (sogar *nichtnegative* Koeffizienten + FE) hat ≥ 13 Nullstellen in [0,51; 3]×[1; 100] (Windungszahl zertifiziert). | Off-Line-Nullstellen: **bewiesen** (computerassistiert). FE: importiert (Davenport–Heilbronn: Titchmarsh §10.25†; Epstein: Epstein 1903†), in dieser Sitzung numerisch kontrolliert (Residuum ~10⁻⁴⁰) |
| **B-LI** | Li-Koeffizienten | ∀n | (i) Bombieri–Lagarias: Kriterium ist nicht zeta-spezifisch (fällt unter B-EP). (ii) *Detektionsschwelle*: Für eine Nullstelle ρ=β+iγ mit β>½ gilt exakt \|1−1/(1−ρ̄)\|² = 1 + (2β−1)/((1−β)²+γ²). Der Term wächst also wie exp(n(β−½)/γ²(1+o(1))). Er dominiert den Hauptterm (n/2)log n erst ab n ≈ (γ²/δ)·log(n log n) (δ=β−½). Mit γ > 3,0·10¹² folgt **n ≳ 1,2·10²⁷** (δ ↑ ½), 6,5·10²⁹ (δ=10⁻³); Skript `computations/li_detection_threshold.py`. | Modulidentität bewiesen (elementar); Schwelle `HEURISTIC-QUANTITATIVE` (Wechselwirkung der Terme nicht abgeschätzt) |
| **B-W** | Weil-Fenster E-4a | uniform in L | Zhu 2026 (Abstract ✓, Preprint): unter RH λ_min(L) ≤ exp(−L e^L); Einzelfenster-Zertifikate müssen Frequenzen bis 2π e^{A_L}, A_L ~ 4e^L, auflösen | belegt (Preprint, nicht begutachtet) |
| **B-CCM** | E-8a | (M1) ∀λ und (M2) | CCM §8 nennt beide als offen; „It remains possible that our strategy … will face significant obstacles“ | belegt ✓ |
| **B-CCM2** | E-8a (CCM-Route inkl. H-Ξ/M2′) | Positivität unter dem Radikal | Epstein-Kalibrierung (rh/07 §5): Radikalstruktur generisch (auch Epstein), H-Ξ bricht exakt bei Verlust der Fensterpositivität (L ≈ 1,5) | belegt (NUMERICAL, validiertes Labor V1–V4) |
| B-dBN | E-9 | Λ ≤ 0 | Verfahren liefert Λ ≤ t nur für t > 0; t ↓ 0 erfordert RH-Verifikation bis zu Höhen, die für t→0 unbeschränkt wachsen† | teilweise belegt |
| B-HP | E-8 | RH-freie Spektralrealisierung | tautologische Äquivalenz: *jede* Konstruktion, die RH benutzt, ist wertlos (L-08) | bewiesen (logisch) |
| B-GEO | P-1 | Indexsatz über Spec ℤ | kein Kandidatenobjekt mit bewiesenem Indexsatz bekannt | offen |

## False-Shortcut Ledger

| ID | Scheinbarer Schluss | Warum falsch | Beleg |
|---|---|---|---|
| X-01 | Funktionalgleichung + Symmetrie ⇒ Re ρ = ½ | Symmetrie erlaubt Quartette ρ, ρ̄, 1−ρ, 1−ρ̄ | Davenport–Heilbronn: gleiche FE-Struktur, zertifizierte Off-Line-Nullstellen (B-EP) |
| X-02 | Positive Koeffizienten + FE ⇒ RH-Analogon | falsch | Epstein x²+5y² (B-EP) |
| X-03 | Viele verifizierte Nullstellen ⇒ RH | ∀ | B-QUANT |
| X-04 | Anteil 1 der Nullstellen auf der Geraden ⇒ RH | o(N) Ausnahmen zulässig | B-DENS |
| X-05 | \|M(x)\| < √x (Mertens) als „Weg“ zu RH | Aussage ist **falsch** | Odlyzko–te Riele 1985† |
| X-06 | de-Branges-Positivitätsbedingungen ⇒ RH | Bedingungen gelten für ζ **nicht** | Conrey–Li, IMRN 2000 (arXiv:math/9812166; nur Suchzusammenfassung gesehen†) |
| X-07 | σ(A) ⊆ {γ} für A=A* ⇒ RH | falsche Inklusionsrichtung | Q-HP |
| X-08 | Numerisch passende Operatorspektren ⇒ RH | keine exakte Identifikation | CCM selbst: „A rigorous proof of this convergence would establish RH“ (d. h. fehlt) |
| X-09 | Weil-Positivität für ein festes L ⇒ RH (bis zu einer Höhe) | für festes L gehen nur endlich viele Primpotenzen ein; keine Höhenaussage ableitbar ohne weiteres Argument | Struktur von E-4a |
| X-10 | λ_1..λ_N > 0 ⇒ keine Gegen-Nullstelle bis Höhe ~N | Detektion erst ab n ≳ γ²/δ | B-LI |
| X-11 | Hurwitz auf ℝ oder auf zu kleinem Gebiet | Nullstellen außerhalb des Konvergenzgebiets unkontrolliert | Q-HUR, Q-M2 |
| X-12 | GRH angenommen, „RH folgt“ | Zirkulär bzw. stärkere Annahme | RH-05 |
| **X-13** | *(eigener Fehler F-2)* Kontur mit Gleitkomma-Endpunkten gilt als geschlossen | a+(b−a)·1.0 ≠ b möglich; Argumentsumme dann nicht 2π·ℤ | Failure Log F-2; entdeckt durch Ganzzahligkeitsprüfung |
| **X-14** | *(eigener Fehler F-1)* FE-Kontrolle mit sin(πs/2) für Davenport–Heilbronn | Charakter mod 5 ist ungerade → cos(πs/2) | Failure Log F-1 |

## Proof-Lint-Katalog

Maschinenlesbar in [`proof_lint.toml`](proof_lint.toml). Jede Lint-Regel ist eine Prüffrage und muss für
jeden Knoten auf dem MAIN-Pfad quittiert werden (`tools/depcheck.py` erzwingt das).
