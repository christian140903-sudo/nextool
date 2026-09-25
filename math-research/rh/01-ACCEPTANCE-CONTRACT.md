# 01 · Acceptance Contract RH

Ein Kandidat (Beweis oder Gegenbeispiel) gilt erst dann als *Kandidatenlösung*, wenn **jede** Zeile erfüllt
ist. RH-01 bis RH-17 stammen aus der Projektspezifikation, RH-18 bis RH-22 sind Ergänzungen aus dem Audit.
Spalte „Status“: der heutige Zustand der *Projektinfrastruktur*, nicht eines Beweises (einen solchen gibt es nicht).

| ID | Anforderung | Prüfverfahren | Status |
|---|---|---|---|
| RH-01 | ζ, Fortsetzung, kritischer Streifen, triviale/nichttriviale Nullstellen eindeutig definiert | Definitionen in 00 §1; Mathlib-Definitionen als Referenz | ✅ erledigt |
| RH-02 | Offizielle Clay/Bombieri-Aussage als unveränderliches MAIN eingefroren | 00 §1–2 mit SHA-256; Lemma 0 (B ⇔ S ⇔ M) formal | ✅ erledigt |
| RH-03 | MAIN beweisen oder rigoroses Gegenbeispiel liefern | — | ⛔ OPEN |
| RH-04 | Keine Annahme der Einfachheit der Nullstellen | Lint L-04; Dependency-Checker verlangt Lint-Quittung | 🔧 Werkzeug bereit |
| RH-05 | Kein stillschweigender Wechsel RH → GRH (oder andere stärkere Aussage) ohne Implikationsbeweis | Lint L-13; der Dependency-Graph verlangt explizite Kanten | 🔧 Werkzeug bereit |
| RH-06 | Jede Äquivalenz mit exaktem Satz + Voraussetzungen | Atlas (02), jede Zeile mit Quelle und Richtung | 🟡 Atlas angelegt; †-Einträge noch am Original zu prüfen |
| RH-07 | Summen, Produkte, Konturintegrale, Grenzwerte, Vertauschungen legitimiert | Lint L-06 | 🔧 |
| RH-08 | Konturverschiebungen berücksichtigen alle Pole/Nullstellen | Lint L-05; Rechenbeispiel: `certify.py` (Pol bei s = 1 in Rechteck B korrekt als −1 gezählt) | 🔧 |
| RH-09 | Alle Abschätzungen vollständig quantifiziert, Uniformität für t, x → ∞ | Quantifier Ledger (03) | 🟡 |
| RH-10 | Kein zentraler Satz setzt RH implizit voraus | Lint L-08; Checker verbietet Kanten zu Knoten mit `assumes_RH = true` auf dem MAIN-Pfad | 🔧 |
| RH-11 | Numerik entdeckt/falsifiziert, ersetzt kein ∀ | Checker verbietet `NUMERICAL`/`HEURISTIC` auf dem MAIN-Pfad | 🔧 |
| RH-12 | Importierte Resultate mit Theorem/Seite + Hypothesenprüfung | Feld `source` + `hypotheses_checked` im Graphen; †-Markierung für ungeprüfte Zitate | 🟡 |
| RH-13 | Unabhängige Kreuzvalidierung über ein zweites Kriterium | Für endliche Rechnungen umgesetzt: N(T) aus Argumentprinzip = Arb/Turing (T = 1000, 10⁴) | 🟡 nur Rechenebene |
| RH-14 | Kritische Lemmas adversarial und möglichst formal geprüft | Lean-Pipeline steht (Lemma 0 verifiziert) | 🔧 |
| RH-15 | Expliziter Schluss „Theorem X ⇒ offizielle RH“ | Endknoten `MAIN` im Graphen; formal via `RHDossier.rhStrip_iff_riemannHypothesis` | 🔧 |
| RH-16 | Publikation in referiertem Organ (Qualifying Outlet) | CMI Rules §6 | — (nach RH-03) |
| RH-17 | Priorität/Autorschaft versioniert | Git-Historie + Version Record | ✅ laufend |
| **RH-18** | **Gegenmodell-Test:** Ein Beweis muss an einer benannten Stelle eine Eigenschaft benutzen, die der Davenport–Heilbronn-Funktion fehlt. Diese Funktion hat Dirichletreihe, Riemann-Typ-Funktionalgleichung und Ordnung 1, aber **zertifizierte** Nullstellen mit Re s ≠ 1/2. Andernfalls ist der Beweis falsch. | `computations/counter_models.py` (4 Off-Line-Nullstellen rigoros zertifiziert) | ✅ Harness bereit |
| **RH-19** | **Gegenbeispiel-Zertifikat:** Box R ⊂ {1/2 < Re s < 1, Im s > 3 000 175 332 800}, Windungszahl von ζ auf ∂R ≥ 1. Zertifiziert durch **zwei unabhängige** Implementierungen mit Ball-/Intervallarithmetik; Algorithmen, Präzision und Abbruchbedingungen offengelegt. | `certify.py` (Argumentprinzip) + zweite Implementierung (offen) | 🟡 eine Implementierung |
| **RH-20** | **Quantorkorrektheit Hilbert–Pólya:** Gefordert ist {γ} ⊆ σ(A) mit A = A* (nicht σ(A) ⊆ {γ}). | Quantifier Ledger Q-HP | ✅ spezifiziert |
| **RH-21** | **Kein Dichte-Schluss:** Jede Aussage der Form „Anteil ≥ c“ (auch c = 1) gilt als nicht hinreichend. | Lint L-03 | ✅ spezifiziert |
| **RH-22** | **Zertifikats-Reproduzierbarkeit:** Jede Rechnung mit Beweislast ist mit Skript, Version (`requirements.txt`), Präzision und Ausgabe-JSON eingecheckt. | `computations/results/` | ✅ laufend |

## HEUREKA-Schwelle (unverändert aus der Spezifikation)

MAIN exakt getroffen · keine offenen Lemmas · keine versteckte RH-Annahme · keine rein numerische
Brücke · alle Grenzprozesse legitim · Quantoren korrekt · Äquivalenz zu RH geschlossen · keine
Zirkularität · unabhängige Gegenprüfung überlebt · **zusätzlich RH-18 bestanden**.

Maschinell geprüft wird das durch `tools/depcheck.py`: Der Pfad zu MAIN darf nur Knoten mit
Status `PROVED`, `IMPORTED` (mit geprüften Hypothesen) oder `FORMALLY_VERIFIED` enthalten, und alle
Lint-Punkte müssen quittiert sein.
