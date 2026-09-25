# Forschungsakte

**Problem:** Riemannsche Hypothese (Clay Millennium Problem, Bombieri-Formulierung)
**Projektstatus:** `OPEN` · Phase 1 (Infrastruktur) und Phase 2 (Weil-Labor, CCM-Route, Epstein-Kalibrierung) abgeschlossen — Befunde: [`rh/07-FINDINGS-PHASE2.md`](rh/07-FINDINGS-PHASE2.md)
**Letzte Aktualisierung:** 2026-09-25

**Maschinenprüfbarer Stand:** `python3 tools/depcheck.py` meldet *MAIN geschlossen: NEIN*. Der MAIN-Pfad
ist durch 5 Knoten blockiert: M1N, H-XI, NORMAL, IMP-CCM510, CCM-ROUTE. **Barriere B-CCM2:** H-XI ist inhaltlich
äquivalent zur Weil-Fensterpositivität; der harte Kern bleibt K-W.

Jeder Eintrag trägt eine ID. Einträge werden nicht gelöscht, sondern bekommen einen neuen Status.
Detaildokumente liegen in [`rh/`](rh/).

---

## 1. Target Specification → [`rh/00-TARGET-FREEZE.md`](rh/00-TARGET-FREEZE.md)

| ID | Aussage | Offizielle Quelle | Status |
|---|---|---|---|
| T-0 | ∀ρ∈ℂ: ζ(ρ)=0 ∧ 0<Re ρ<1 ⇒ Re ρ=½ (äquivalent: Bombieris Form B, Mathlibs `RiemannHypothesis`) | Bombieri, Clay-Problembeschreibung §I (SHA-256 archiviert) | `OPEN` |
| T-0¬ | ∃ρ: ζ(ρ)=0 ∧ ½<Re ρ<1 ∧ Im ρ > 3 000 175 332 800 | Negation + Platt–Trudgian | `OPEN` |
| L-0 | T-0 ⇔ Bombieri-Form ⇔ Mathlib-Form | eigener Beweis | `FORMALLY VERIFIED` (`formal/RHTarget.lean`) |

Acceptance Contract RH-01 … RH-22 → [`rh/01-ACCEPTANCE-CONTRACT.md`](rh/01-ACCEPTANCE-CONTRACT.md)

## 2. Assumption Ledger

| ID | Voraussetzung | Typ | Quelle | Im Anwendungsfall geprüft? | Status |
|---|---|---|---|---|---|
| A-1 | ζ meromorph, einfacher Pol bei 1, FE | Satz | Mathlib `riemannZeta_one_sub` (kernel-geprüft) | ja (Lemma 0) | IMPORTED |
| A-2 | ζ(s) ≠ 0 für Re s ≥ 1 | Satz | Mathlib `riemannZeta_ne_zero_of_one_le_re` | ja | IMPORTED |
| A-3 | RH verifiziert bis 3 000 175 332 800 | Satz (computerassistiert, begutachtet) | Platt–Trudgian, Bull. LMS 53 (2021) Thm. 1 | nur für T-0¬-Höhenschranke genutzt | IMPORTED |
| A-4 | Weil-Kriterium | Satz | Weil 1952 / Bombieri §V | Konventionen noch am Original zu prüfen | IMPORTED (hypotheses_checked = false) |
| A-5 | CCM Thm. 5.10 (Selbstadjungiertheit, reelle Nullstellen unter even-simple) | Satz (Preprint) | arXiv:2511.22755 | nein | IMPORTED_PREPRINT |
| A-6 | ≥ 2/3 der Nullstellen einfach auf der Geraden | Satz (Preprint, Lean-formalisiert) | arXiv:2608.13637, 2609.02882 | nicht auf MAIN-Pfad | IMPORTED_PREPRINT |
| A-7 | FE der Gegenmodelle (Davenport–Heilbronn, Epstein) | Satz | Titchmarsh §10.25†, Epstein 1903† | numerisch kontrolliert (C-8) | IMPORTED |

## 3. Quantifier Ledger → [`rh/03-LEDGERS.md`](rh/03-LEDGERS.md#quantifier-ledger)

Wichtigste Korrektur aus dem Audit: **Q-HP** (Hilbert–Pólya). Es genügt, *Nullstellen ⊆ Spektrum* eines
selbstadjungierten Operators zu zeigen. Gleichheit ist nicht nötig; σ(A) ⊆ Nullstellen ist wertlos.

## 4. Equivalence / Strategy Map → [`rh/02-EQUIVALENCE-ATLAS.md`](rh/02-EQUIVALENCE-ATLAS.md)

| ID | Strategie | Beziehung zu T-0 | Fehlender Schritt | Track | Status |
|---|---|---|---|---|---|
| S-1 | CCM-Route (präzisiert: M1N ∧ H-Ξ ∧ NORMAL ∧ Thm. 5.10 ⇒ RH via M2′, formal) | ⇐ | H-Ξ ∀L | Struktur | **Phase 2 abgeschlossen:** umgeht die Positivität nicht (B-CCM2) |
| **S-2** | Weil-Fensterpositivität K-W | ⇔ | uniform in L; Positivität *unter* dem Radikal | Äquivalenz | **harter Kern nach Phase 2** |
| S-3 | Indexsatz über Spec ℤ (P-1) | ⇐ (hypothetisch) | Objekt unbekannt | Struktur | Quelle für F-UNI-taugliche Mechanismen |
| S-4 | Li / de Bruijn–Newman / Jensen | ⇔ | ∀n / Λ≤0 / ∀(d,n) | Falsifikation | nur Diagnose (B-EP, B-LI) |
| S-5 | Dichteverfahren | — | — | — | verworfen als Hauptweg (B-DENS, belegt) |
| S-6 | Gegenbeispielsuche | T-0¬ | Höhe > 3·10¹² | Computational | Pipeline bereit (C-4/C-5), keine Suche gestartet (Kosten ≫ Nutzen, s. B-LI-Analogie) |

## 5. Barrier Ledger → [`rh/03-LEDGERS.md`](rh/03-LEDGERS.md#barrier-ledger)

B-QUANT, B-DENS, **B-EP (computerbewiesen)**, **B-LI (Detektionsschwelle n ≳ 10²⁷)**, B-W, B-CCM, B-dBN, B-HP, B-GEO.

## 6. False-Shortcut Ledger → [`rh/03-LEDGERS.md`](rh/03-LEDGERS.md#false-shortcut-ledger)

X-01 … X-14. Maschinenlesbarer Lint-Katalog: [`rh/proof_lint.toml`](rh/proof_lint.toml) (L-01 … L-19).

## 7. Lemma Dependency Graph → [`rh/dependency_map.toml`](rh/dependency_map.toml)

```
MAIN ── LEM-0 ─────────────────────────────── [FORMALLY_VERIFIED]
   │         └── IMP-FE, IMP-NV1, IMP-Z0 ──── [IMPORTED, Mathlib]
   └── CCM-ROUTE ───────────────────────────── [CONJECTURE]  ✗   (B-CCM2: ≙ K-W)
          ├── M1N  (even-simple, endlich je λ) ── [OPEN]     ✗   numerisch ✓ für L ≤ 1.28
          ├── H-XI (Grundzustand Ξ-teilbar) ───── [CONJECTURE] ✗ numerisch ✓ (Rest ≈ Φ(L)^1.7)
          ├── NORMAL (h_λ normale Familie) ────── [OPEN]     ✗
          ├── IMP-CCM510 ───────────────────────── [PREPRINT] ✗
          └── RED-HUR-DIV (M2′) ────────────────── [FORMALLY_VERIFIED]
                 └── RED-HUR ── LEM-0 ────────────── [FORMALLY_VERIFIED]
Alternativroute / harter Kern: K-W ── IMP-WEIL (Konventionen festgelegt, Original noch zu prüfen)
```

## 8. Evidence Ledger → [`rh/04-COMPUTATIONS.md`](rh/04-COMPUTATIONS.md)

| Evidenzart | Einträge |
|---|---|
| Formal verifiziert (Lean 4 + Mathlib, nur Standardaxiome) | L-0 (`rhStrip_iff_riemannHypothesis`), RED-HUR (`riemannHypothesis_of_approximation`), RED-HUR-DIV (`riemannHypothesis_of_approximation_divisible`) |
| Computerbewiesen (Ball-Arithmetik) | C-1, C-2 (RH bis 10⁴), C-4 (Davenport–Heilbronn), C-5 (Epstein), C-6/C-7 (λ₁…λ₁₀₀₀ > 0), C-9 (RH-19-Doppelzertifizierung) |
| Importiert (begutachtet) | A-1 … A-4, A-7 |
| Importiert (Preprint) | A-5, A-6 |
| Heuristik | B-LI-Schwelle, Einordnung in 05 §1 |

## 9. Failure Log

| ID | Datum | Ansatz | Präziser Grund des Scheiterns | Lokal/strukturell | Konsequenz |
|---|---|---|---|---|---|
| F-1 | 2026-09-25 | FE-Kontrolle Davenport–Heilbronn mit sin(πs/2) | Charakter mod 5 ist ungerade → cos(πs/2) | lokal | korrigiert; X-14 |
| F-2 | 2026-09-25 | Konturen mit Gleitkomma-Endpunkten | Kontur nicht exakt geschlossen | lokal, aber rigorositätsrelevant | exakte Endpunkte + Assertion; alle Läufe wiederholt; X-13; Lint L-19 |
| F-5 | 2026-09-25 | Zweite ζ-Implementierung: direkte Euler–Maclaurin-Summe auch für Re s = −1 | Mit Ball-Eingaben wachsen die Terme wie n^{−σ} = n, der Einschluss explodiert, die Kontur wird endlos unterteilt | lokal (Konditionierung) | für Re s < ½ Funktionalgleichung benutzt, Γ und sin aus Arb-Primitiven; Kreuztest an 30 Punkten ohne Abweichung |
| F-6 | 2026-09-25 | Kommutierender Sturm–Liouville-Operator mit glatten Koeffizienten (WP-2D) | Residuum 0,2–3,3 (Prolate-Kontrolle 10⁻⁵); Eigenfunktionen haben Knicke bei ±(L − log n) | strukturell (Arithmetik muss in den Operator) | verworfen |
| F-7 | 2026-09-25 | K-Ξ naiv: Koerzitivität auf span{(−∂²)ʲΦ}^⊥ bei fast-nullem Radikalraum | τ_m = max Q auf D_m wird O(1) (Schwanzverstärkung durch Ableitungen); β_m/τ_m ≪ 1 | lokal (falsche Raumwahl) | verworfen |
| F-8 | 2026-09-25 | (Strategie) CCM-Route als Umgehung der Positivität | Epstein-Kalibrierung: Radikalstruktur generisch, H-Ξ bricht exakt mit der Positivität | strukturell | B-CCM2; Kern = K-W |
| F-3 | 2026-09-25 | (Strategie) Dichteverfahren als Hauptweg | bewiesene Decke „Anteil ≠ alle“ (B-DENS) | strukturell | S-5 verworfen |
| F-4 | 2026-09-25 | (Strategie) Li-/dBN-/Jensen-Routen als Hauptweg | sehen das Eulerprodukt nicht (B-EP); Li-Detektion erst ab n ≳ 10²⁷ | strukturell | S-4 nur Diagnose |

## 10. Priority / Version Record

| ID | Datum | Ereignis | Betroffene Einträge |
|---|---|---|---|
| V-1 | 2026-09-25 | Grunddirektive aufgenommen; Aktenstruktur angelegt | — |
| V-3 | 2026-09-25 | Phase 2: Weil-Labor (V1–V4 validiert), Paritätsleiter, Winkelgesetz, Radikalstruktur H-Ξ, M2′ formal verifiziert, F-6/F-7 widerlegt, Epstein-Kalibrierung ⇒ B-CCM2 | S-1, S-2, Graph |
| V-2 | 2026-09-25 | RH als Problem eingegangen. Target Freeze mit SHA-256; Audit der Eingangsangaben (A1–A13, u. a. Korrektur Q-HP, Präzisierung 10¹³ vs. Platt–Trudgian, CMI-Regel 5(c)); Atlas; Ledger; Lint-Katalog; Dependency-Graph + Checker; Lemma 0 und Hurwitz-Reduktion formal verifiziert; Zertifikate C-1…C-7; Gegenmodelle Davenport–Heilbronn und Epstein rigoros; Fehler F-1, F-2 gefunden und behoben | alle |
