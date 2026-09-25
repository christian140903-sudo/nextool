# 05 · Forschungsprogramm nach Phase 1

> **Nachtrag V-3:** Phase 2 ist abgeschlossen, die Befunde stehen in [`07-FINDINGS-PHASE2.md`](07-FINDINGS-PHASE2.md). WP-A/WP-B/WP-C/WP-F sind
> bearbeitet. Kernergebnis: Die CCM-Route umgeht die Weil-Positivität nicht (Barriere B-CCM2).

**Status MAIN: `OPEN`.** Phase 1 hat keinen Beweis und kein Gegenbeispiel erbracht und behauptet
beides nicht. Sie hat Folgendes geliefert: eine eingefrorene, formal verankerte Zielaussage; einen
geprüften Atlas; rigorose Rechen- und Formalisierungsinfrastruktur; und eine auf **vier Knoten**
reduzierte, maschinenprüfbare Lücke (`tools/depcheck.py`).

## 1. Die Strukturfrage: Welches Objekt fehlt?

Die Spezifikation fragt: *Welches zusätzliche Objekt fehlt, das die bekannten analytischen Identitäten
in Positivität verwandelt?* Die Barrieren aus Phase 1 beantworten das nicht, schränken die Antwort aber
**rigoros** ein. Jeder Kandidatenmechanismus muss vier Filter bestehen:

| Filter | Anforderung | Begründung (Phase 1) |
|---|---|---|
| F-EP | Er muss an einer benannten Stelle scheitern, wenn man ζ durch die Epstein-ζ von x²+5y² ersetzt. Diese ist eine Summe von **zwei** Eulerprodukten, ζ(s)L(s,χ₋₂₀) + L(s,χ₋₄)L(s,χ₅). | C-5: 13 zertifizierte Off-Line-Nullstellen bis Höhe 100, bei positiven Koeffizienten und exakter FE. Also muss der Mechanismus *Primitivität* (ein einzelnes Eulerprodukt) benutzen, nicht nur „Arithmetik“. |
| F-UNI | Er muss uniform im Fensterparameter L (bzw. λ) sein. | B-W: Einzelfenster-Zertifikate kosten doppelt-exponentiell viel; λ_min(L) ≤ exp(−L e^L) unter RH. |
| F-ALL | Er darf nicht über Dichte laufen. | B-DENS, Bombieri–Hejhal: 100 % auf der Geraden ist verträglich mit unendlich vielen Ausnahmen. |
| F-INC | Eine Spektralrealisierung muss *Nullstellen ⊆ Spektrum* zeigen, ohne RH zu benutzen. | Q-HP / A11 |

**Einordnung (`HEURISTIC`, keine Beweisbehauptung):** Im Funktionenkörperfall erfüllt Weils Beweis alle vier
Filter. Der Hodge-Indexsatz auf C×C ist global (F-UNI) und kein Dichteargument (F-ALL). Er gilt für die
Zeta-Funktion *einer* Kurve (F-EP): Linearkombinationen von Zeta-Funktionen verschiedener Kurven haben
keine Fläche, deren Indexform sie kontrolliert. Das Frobenius-Spektrum auf H¹ realisiert *alle*
Nullstellen (F-INC). Die Filter sind also nicht künstlich, sondern beschreiben genau die Rolle, die der
Indexsatz dort spielt. Das präzisiert Bombieris Frage aus §V der Problembeschreibung zu einer
Anforderungsliste.

## 2. Arbeitspakete Phase 2 (Priorität absteigend)

### WP-A · Falsifikation/Zertifikation von (M1) — *höchste Priorität*
**Ziel:** Für λ² ∈ {2, 3, …, X} rigoros entscheiden, ob der kleinste Eigenwert von QW_λ einfach ist und der
Eigenvektor gerade.
**Warum zuerst:** (M1) ist eine *endliche* Aussage je λ und blockiert direkt den MAIN-Pfad. Ein
Gegenbeispiel würde das CCM-Programm in seiner jetzigen Form widerlegen und wäre ein echter Befund.
**Präzisionsbudget (Schätzung aus Zhus *empirischem* Gesetz, nicht bewiesen):** Nach Zhu gilt −ln λ_min(L) ≈ 2π² N(T*)/ln N(T*) mit T* = 2π e^{2L}. Für L = log λ
ergibt das grob: L = 1 → λ_min ~ 10⁻³³; L = 1,5 → ~ 10⁻⁹¹. Nötig sind Arb-Matrizen mit ≥ 400 Bit und
rigorose Quadratur des archimedischen Terms.
**Abbruchkriterium:** Ist (M1) bis λ² = 100 zertifiziert, sinkt die Priorität, weil der Befund dann erwartet
ist. Die Energie geht dann in WP-C.

### WP-B · Kalibrierung am Gegenmodell (F-EP konkret)
**Ziel:** Die Weil-Fensterform für die Epstein-Funktion aufstellen. Das kleinste L bestimmen, bei dem die
Positivität **nachweisbar verletzt** ist; dort sitzen Off-Line-Nullstellen, die erste bei 0,9325 + 15,669i
(C-5). Dazu feststellen, an welchem Schritt der CCM-Konstruktion (Eulerprodukt über p ≤ λ², Theorem 5.10)
die Epstein-Funktion ausscheidet.
**Wert:** Das wäre der erste *zertifizierte* Test, ob und wie früh Fensterpositivität eine Off-Line-
Nullstelle sieht. Der Test kalibriert K-W und B-W empirisch. Er zeigt auch konkret, wo das Eulerprodukt in
den Mechanismus eingeht (L-14).

### WP-C · Analyse von (M2)
**Ziel:** Zwischenaussagen zu (M2) als `CONJECTURE` formulieren, etwa Konvergenz von c_λ ξ̂_λ → Ξ
zunächst auf kompakten Teilmengen von ℝ, dann auf Streifen. Jede numerisch prüfen und gegen L-17
abgleichen: Hurwitz braucht **den offenen Streifen**, nicht ℝ. Die formale Zielform steht bereits fest:
Die Hypothesen von `RHDossier.riemannHypothesis_of_approximation` sind *genau* das, was (M2) plus (M1)
plus Thm. 5.10 liefern müssen.

### WP-D · Import-Prüfung
CCM Thm. 5.10 und Connes–van Suijlekom (Carathéodory–Fejér-Verallgemeinerung) am Beweistext
nachvollziehen (IMP-CCM510 → IMPORTED erfordert Begutachtung oder eigene Verifikation). Die Weil-
Konventionen (𝒲, Vorzeichen) am Original prüfen. Alle †-Zitate im Atlas abarbeiten.

### WP-E · Zweite unabhängige Zertifikats-Implementierung (RH-19)
Eigene Euler–Maclaurin-Auswertung von ζ mit expliziter Restgliedschranke in Ball-Arithmetik, ohne
`acb.zeta`. Damit C-1/C-2/C-4/C-5 doppelt zertifizieren.

### WP-F · Formalisierung
Erledigt: Lemma 0 und die Hurwitz-Reduktion. Nächster Kandidat: die Weil-Richtung
„Positivität ⇒ RH“ für die Fensterform, sobald die Konventionen (WP-D) feststehen. Sie würde K-W formal
mit MAIN verbinden, so wie RED-HUR es für die CCM-Route tut.

## 3. Regeln für die Weiterarbeit

- Jede neue Aussage startet als `CONJECTURE` in `dependency_map.toml`. Sie wandert erst nach Beweis +
  Lint-Quittung auf den MAIN-Pfad.
- Jede Rechnung mit Beweislast: Skript + JSON in `computations/results/`, Logik im Skriptkopf, Fehler im
  Failure Log.
- `python3 tools/depcheck.py` ist das Abnahmekriterium. „Gelöst“ darf nur geschrieben werden, wenn es
  `MAIN geschlossen: JA` meldet **und** eine unabhängige menschliche Prüfung erfolgt ist.
