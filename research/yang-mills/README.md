# Yang–Mills Existence and Mass Gap: Formal Acceptance and Research Specification

**[Read the specification (PDF, 24 pages)](spec.pdf)** · Version 1.0 · 2026-09-24 · Draft for author review

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
| Assumption ledger | 33 classified premises (`A-001`…`A-033`); 5 tempting shortcuts recorded as FALSE |
| Transition map | 9 separate theorems from the lattice to the Clay statement, with machine-computed closure |
| Two tracks | Track P (construction) and Track N (the exact logical form of an admissible counterexample) |
| Review of the working draft | 16 findings: 3 corrected, 6 sharpened, 7 confirmed against the primary sources |
| References | 53 entries, checked against Crossref, arXiv, the issuing organisations or the bibliography of S1 |

## Files

| File | Role |
| --- | --- |
| `ledger.mjs` | Single source of truth for requirements, interpretations, assumptions and transitions |
| `build.mjs` | Zero-dependency validator and generator (Node.js ≥ 20) |
| `generated/*.tex` | Tables generated from the ledger; do not edit by hand |
| `ledger.json` | Machine-readable copy of the ledger with computed closure status |
| `spec.tex` | The specification (LaTeX) |
| `spec.pdf` | The typeset specification |

## Build

```bash
node build.mjs            # validate ledger.mjs; write generated/*.tex and ledger.json
node build.mjs --check    # fail if the generated files are stale
latexmk -pdf spec.tex     # typeset (TeX Live: latex-extra, science, fonts-recommended)
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
