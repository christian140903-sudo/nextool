# Mathematisches Forschungsprojekt — Arbeitsprotokoll

Dieses Verzeichnis ist die Forschungsakte für das mathematische Lösungsprojekt nach der
Grunddirektive vom 2026-09-25. **Problem: Riemannsche Hypothese.** Status: `OPEN`. Phase 1
(Bestandsaufnahme, Spezifikation, Infrastruktur) ist abgeschlossen, siehe [`DOSSIER.md`](DOSSIER.md)
und [`rh/05-RESEARCH-PROGRAM.md`](rh/05-RESEARCH-PROGRAM.md).

## Zielkette

```
Definitionen → Prämissen → Lemmata → Hauptsatz → vollständiger Beweis → unabhängige Verifikation
```

„Gelöst“ wird nur verwendet, wenn diese Kette geschlossen ist. Alternativ ist ein rigoroses
Gegenresultat zulässig (Gegenbeispiel, Widerspruch, nachgewiesene Lücke in der Problemformulierung
oder im etablierten Rahmen).

## Statusvokabular

Jede neue Aussage startet als `CONJECTURE`. Zulässige Status:

| Status | Bedeutung |
|---|---|
| `OPEN` | nicht bearbeitet oder ohne belastbaren Fortschritt |
| `CONJECTURE` | vermutet; keine Beweisbehauptung |
| `CANDIDATE LEMMA` / `CANDIDATE PROOF` | Beweis liegt vor, adversariale Prüfung nicht abgeschlossen |
| `PARTIAL` | Teilresultat bewiesen, Reichweite exakt angegeben |
| `INTERNALLY VERIFIED` | adversariale Prüfung („Finde die erste falsche Aussage“) ohne Befund |
| `FORMALLY VERIFIED` | in einem Proof Assistant geprüft; formalisierte Aussage ist angegeben |
| `AWAITING INDEPENDENT REVIEW` | bereit für externe Prüfung |
| `PROVED` | vollständige Kette, alle Importe mit geprüften Voraussetzungen |
| `REFUTED` | Gegenbeispiel oder Widerspruch dokumentiert |

Evidenzarten werden nie vermischt: **bekannt ≠ beobachtet ≠ vermutet ≠ bewiesen**.
Endliche Rechnungen sind niemals ein Ersatz für ∀, außer als Teil eines computerassistierten
Beweises mit vollständig dokumentierter Reduktion, Fehlerschranken und Abbruchbedingungen.

## Tracks (parallel geführt)

1. **Direkt** — ursprüngliche Aussage beweisen.
2. **Äquivalenz** — Umformulierung mit besser kontrollierbarem Fehlschritt.
3. **Struktur** — neue Invariante, Positivität, Spektral-/Symmetrie-/Geometriestruktur.
4. **Falsifikation** — jedes Lemma und jeden Mechanismus aktiv angreifen.
5. **Foundational Audit** — tragende etablierte Voraussetzungen in der benötigten Allgemeinheit prüfen.
6. **Computational** — Muster, Gegenbeispiele, neue Vermutungen.
7. **Formal Verification** — kritische Teile formalisieren (Lean 4 / Mathlib bei Bedarf).

## Beweisstandard (Prüfliste je Satz)

Quantorenreihenfolge · Definitionsbereiche · Ausnahmefälle · Regularität · Konvergenz ·
Uniformität · Grenzwert-/Summen-/Integralvertauschungen · Operator-Domänen · Singularitäten ·
analytische Fortsetzung · Vorzeichen · Konstantenabhängigkeiten · Zirkularität ·
exakte Reichweite importierter Sätze.

„Offensichtlich“, „klar“, „folgt unmittelbar“, „numerisch bestätigt“, „allgemein bekannt“
ersetzen an keiner tragenden Stelle einen Beweis.

## Verzeichnisstruktur

| Pfad | Inhalt |
|---|---|
| `DOSSIER.md` | Forschungsakte: Index aller Ledger, Failure Log, Version Record |
| `rh/00-TARGET-FREEZE.md` | Eingefrorene Zielaussage, Quellen mit SHA-256, Audit der Eingangsangaben |
| `rh/01-ACCEPTANCE-CONTRACT.md` | RH-01 … RH-22 |
| `rh/02-EQUIVALENCE-ATLAS.md` | Äquivalente/hinreichende Formulierungen, fehlende Schritte, kleinster Kern |
| `rh/03-LEDGERS.md` | Quantifier-, Barrier-, False-Shortcut-Ledger |
| `rh/04-COMPUTATIONS.md` | Evidence Ledger der Rechnungen, Methodik, Rechen-Failure-Log |
| `rh/05-RESEARCH-PROGRAM.md` | Strukturfilter F-EP/F-UNI/F-ALL/F-INC, Arbeitspakete Phase 2 |
| `rh/06-STRATEGY-PHASE2.md` | Strategie Phase 2 (Reduktionskette, Arbeitspakete, Erfolgsstufen) |
| `rh/07-FINDINGS-PHASE2.md` | Befunde Phase 2: Weil-Labor, Radikalstruktur, Epstein-Kalibrierung, Barriere B-CCM2 |
| `rh/dependency_map.toml` | Lemma-Dependency-Graph bis MAIN (maschinenlesbar) |
| `rh/proof_lint.toml` | Proof-Lint-Katalog L-01 … L-19 |
| `tools/depcheck.py` | Abnahmeprüfung: Ist MAIN geschlossen? |
| `tools/check_env.py` | Smoke-Tests aller Werkzeuge |
| `computations/` | Rigorose Zertifikate (Ball-Arithmetik) + `results/*.json`; `computations/weil/`: Weil-Labor (ζ und Epstein) |
| `formal/` | Lean 4 + Mathlib: `RHTarget.lean` (Lemma 0), `HurwitzReduction.lean`; `check.sh` |

Jedes Rechenskript muss deterministisch reproduzierbar sein (Präzision, Versionen) und im Evidence
Ledger mit seiner exakten logischen Rolle eingetragen werden.

## Reproduktion

```sh
pip install -r math-research/requirements.txt
python3 math-research/tools/check_env.py
python3 math-research/tools/depcheck.py                         # Stand der Beweiskette
cd math-research/computations
python3 verify_rh_range.py 10000                                 # RH bis T≈10^4 zertifizieren
python3 counter_models.py                                        # Davenport–Heilbronn Off-Line-Nullstellen
python3 epstein_certify.py                                       # Epstein x²+5y² Off-Line-Nullstellen
python3 li_coefficients.py 500 2000                              # λ_1..λ_500
MATHLIB_DIR=/pfad/zu/mathlib4 ../formal/check.sh                 # Lean-Beweise (Mathlib-Checkout mit Cache)
```

## Rechenumgebung (verifiziert 2026-09-25 per `tools/check_env.py`)

Python 3.11 mit sympy 1.14, mpmath 1.3, numpy 2.4, scipy 1.17, networkx 3.6, z3 5.1 (SMT), python-sat mit
CaDiCaL (SAT), **python-flint 0.9.0 (Arb/FLINT-Ball-Arithmetik)**; gcc/g++ 13.3; Node 22; 4 CPU-Kerne,
15 GB RAM. **Lean 4** `v4.35.0-rc3` + **Mathlib** Commit `5e0c4e5` (2026-09-25), per `elan` installiert.
Nicht installiert: Coq, Isabelle, Sage, PARI/GP, GAP, Julia.
