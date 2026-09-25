# Yang–Mills Existence and Mass Gap: Formal Acceptance and Research Specification

**[Read the specification (PDF)](spec.pdf)** · **[Research Report 1](reports/report-01.pdf)** · **[Research Report 2](reports/report-02.pdf)** · **[Research Report 3](reports/report-03.pdf)** · Version 1.3 · 2026-09-25 · Draft for author review

This package fixes, in a form anyone can check, what a resolution of the Clay
Millennium Problem *Yang–Mills Existence and Mass Gap* must establish. It also
sets up a two-track research programme: construction plus mass gap, and a
foundational audit that allows for a rigorous counterexample.

> **This is not a solution.** The Clay Mathematics Institute lists the problem
> as *Unsolved* (checked 2026-09-24). In the current ledger 1 of 9 transition
> theorems is closed, which matches the published literature.

## What is inside

| Component | Content |
| --- | --- |
| Target freeze | Official problem description (Jaffe–Witten) and 2018 prize rules, quoted verbatim and fingerprinted by SHA-256 |
| Acceptance contract | 25 atomic requirements `YM-01`…`YM-25`, each anchored in the normative text |
| Interpretation register | 6 points where the official text is not formally specific (`I-1`…`I-6`) |
| Quantifier ledger | 8 rules separating insufficient from required quantifier forms (`Q-1`…`Q-8`) |
| Assumption ledger | 47 classified premises (`A-001`…`A-047`); 5 tempting shortcuts recorded as FALSE |
| Transition map | 9 separate theorems from the lattice to the Clay statement, with machine-computed closure |
| Two tracks | Track P (construction) and Track N (the exact logical form of an admissible counterexample) |
| Review of the working draft | 16 findings: 3 corrected, 6 sharpened, 7 confirmed against the primary sources |
| References | 58 entries in the specification, checked against Crossref, arXiv, the issuing organisations or the bibliography of S1 |

## Research Report 1: locating the obstruction

[`reports/report-01.pdf`](reports/report-01.pdf) answers two narrower questions. It
does **not** solve the problem.

1. **Where is the wall?** For SU(2) in d = 4 (Wilson action), mass-gap proofs
   exist only at strong coupling; the most explicit threshold is β < 1/12. The scaling regime of the continuum limit begins
   near β ≈ 2.2. This is based on our own lattice simulation plus reference
   data (Athenodorou–Teper 2021): the gap falls in lattice units and stays
   roughly constant in physical units, which is evidence, not proof.
2. **Could a computer close it?** Only through a finite reduction theorem. The
   only such reduction we can identify needs three new theorems. It faces two
   obstructions, the coupling window and the dimension of the integrals to
   certify, and neither goes away with more computing power.
3. **A proved limit (new, not refereed).** The pointwise curvature
   (Bakry–Émery) method behind the strong-coupling proof cannot reach beyond
   β = 1/8. The proof uses a π-flux configuration and is checked numerically
   (32 exactly vs. 31.99996).

## Research Report 2: a direct attempt at the core

[`reports/report-02.pdf`](reports/report-02.pdf) attacks the open core directly. It
does **not** solve the problem. Nine candidate mechanisms go through the
specification's sanity tests; none survives as a complete route. The strongest
current tool, the multiscale Bakry–Émery criterion (Bauerschmidt–Bodineau–
Dagallier), meets four obstacles for lattice Yang–Mills. The decisive one: it
needs the renormalized potential to become uniformly convex on large scales,
which is mass generation, i.e. the mass-gap problem, restated.

## Research Report 3: how long is the bridge?

[`reports/report-03.pdf`](reports/report-03.pdf) measures, with a Monte Carlo
renormalization group, how many factor-2 blocking steps lead from the scaling
regime (β = 2.2–2.6) into the proved region β < 1/12. The answer is 4–6 steps.
All other steps lie at weak coupling, so the non-perturbative core of the
problem is a bounded number of steps at intermediate coupling, independent of
the lattice spacing. This is numerical evidence (E4), not a proof.

## Files

| File | Role |
| --- | --- |
| `ledger.mjs` | Single source of truth for requirements, interpretations, assumptions and transitions |
| `build.mjs` | Zero-dependency validator and generator (Node.js ≥ 20) |
| `generated/*.tex` | Tables generated from the ledger; do not edit by hand |
| `ledger.json` | Machine-readable copy of the ledger with computed closure status |
| `spec.tex` | The specification (LaTeX) |
| `spec.pdf` | The typeset specification |
| `common.sty` | Shared layout of the specification and the reports |
| `reports/report-01.tex`, `.pdf` | Research Report 1 and its generated data (`reports/data/`) |
| `reports/report-02.tex`, `.pdf` | Research Report 2 (direct attempt, multiscale Bakry–Émery route) |
| `reports/report-03.tex`, `.pdf` | Research Report 3 (Monte Carlo RG: length of the bridge) |
| `lab/mcrg.py`, `lab/mcrg_analyze.py` | Gauge-covariant blocking, matching, iterated RG flow |
| `lab/su2_lattice.py` | SU(2) lattice gauge theory in 4D (heat bath, over-relaxation, observables, self-test) |
| `lab/analyze.py` | Turns `lab/runs/*.json` into the report's tables and plot data |
| `lab/curvature_bound.py` | Numerical check of the curvature no-go (Report 1, Proposition 3.2) |

## Build

```bash
node build.mjs            # validate ledger.mjs; write generated/*.tex and ledger.json
node build.mjs --check    # fail if the generated files are stale
latexmk -pdf spec.tex     # typeset (TeX Live: latex-extra, science, fonts-recommended)

cd lab                    # numerical lab (Python ≥ 3.10, numpy, scipy)
python su2_lattice.py --selftest
python analyze.py         # regenerate reports/data from lab/runs
python curvature_bound.py
cd ../reports && latexmk report-01.tex
```

The validator refuses to build if:

- an identifier is duplicated or a reference dangles;
- a mathematical requirement is not covered by any transition;
- a transition rests on a premise whose status is FALSE, HEURISTIC, NUMERICAL or PREPRINT;
- a string contains control characters (the usual sign of a lost LaTeX backslash).

## Normative sources

| ID | Source | SHA-256 (retrieved 2026-09-24) |
| --- | --- | --- |
| S1 | [Jaffe & Witten, *Quantum Yang–Mills Theory*](https://www.claymath.org/wp-content/uploads/2022/06/yangmills.pdf) | `3558403ca14c11e382f73a09e548222708540bfdf478cf96aa11c52d43e23e09` |
| S2 | [CMI, *Millennium Prize Description and Rules* (2018)](https://www.claymath.org/wp-content/uploads/2022/03/millennium_prize_rules_0.pdf) | `9b5003745c0ae7268dc7769f83e1c61eaca674f28631f1df2cd8400976640b2a` |

If either fingerprint changes at the official URL, the specification must be
re-reviewed in a new revision.

## AI assistance

This package was drafted with Claude Code (Anthropic). Every source statement
was checked against the primary documents. Following the COPE position on
authorship and AI tools, the AI tool is not an author, and every AI-produced
mathematical statement counts as heuristic (evidence class E5) until a human
verifies it.

---

## Deutsche Kurzfassung

Dieses Paket legt überprüfbar fest, was eine Lösung des Millennium-Problems
*Yang–Mills Existence and Mass Gap* leisten muss. Es richtet dafür ein
zweigleisiges Forschungsprogramm ein: Konstruktion mit Mass Gap sowie ein
Grundlagen-Audit mit der exakten logischen Form eines zulässigen Gegenbeispiels.
**Eine Lösung enthält es nicht.** Das Problem ist laut Clay Mathematics
Institute ungelöst.

Die wichtigsten Ergebnisse der Prüfung des Arbeitsentwurfs:

1. **Gleichmäßigkeit in G wird nicht verlangt.** Gefordert ist „für jedes G
   existiert eine Theorie“. Konstanten dürfen von G abhängen.
2. **Clustering gilt nur für Operatoren mit ⟨Ω, OΩ⟩ = 0.** Ohne diese
   Voraussetzung ist die Abschätzung falsch.
3. **„Kompakte einfache Eichgruppe“ ist mehrdeutig.** Als abstrakte Gruppe ist
   SU(N) nicht einfach. Hinzu kommen globale Formen und der θ-Parameter.
4. **Ein Gegenbeispiel muss die Form ∃G ∀T haben.** Eine einzelne Theorie ohne
   Gap widerlegt nichts, solange kein Eindeutigkeitssatz vorliegt.
5. **OS-Axiome nur in der korrigierten Form von OS II.** OS I war ohne die
   lineare Wachstumsbedingung falsch. Das ist ein echter Präzedenzfall für die
   These, dass eine Grundlage fehlerhaft sein kann.

**Forschungsbericht 1** zeigt, wo das Problem festhängt, löst es aber nicht.
Ein Mass Gap ist nur bei starker Kopplung bewiesen (expliziter Schwellenwert
β < 1/12), die Kontinuumsphysik beginnt bei β ≈ 2.2. Neu bewiesen ist, dass die Krümmungsmethode hinter dem bekannten
Beweis grundsätzlich nicht über β = 1/8 hinauskommt.

**Forschungsbericht 2** ist ein direkter Angriff auf den Kern. Eine Lösung hat
er nicht ergeben. Das stärkste heutige Werkzeug führt das Problem auf die
Aussage zurück, dass das renormierte Potential auf großen Skalen konvex wird.
Das ist die Massenerzeugung selbst, nur anders formuliert.

**Forschungsbericht 3** misst, dass nur 4 bis 6 Renormierungsschritte den
Kontinuumsbereich vom bewiesenen Bereich trennen. Der ungelöste Kern ist damit
eine feste, endliche Zahl von Schritten, unabhängig vom Gitterabstand. Er
bleibt offen.
