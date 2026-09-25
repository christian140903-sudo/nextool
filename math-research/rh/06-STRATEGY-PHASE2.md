# 06 · Strategie Phase 2 — „Ein Satz statt vier Knoten“

**Stand:** 2026-09-25 · **MAIN:** `OPEN`

## 0. Leitidee

Phase 1 hat die Lücke auf M1 („Grundzustand von QW_λ einfach und gerade“) und M2 („ξ̂_λ → Ξ auf
|Im z| < ½“) reduziert. Phase 2 versucht, **beide in eine einzige quantitative Spektralaussage** zu
überführen, die man rechnerisch schnell falsifizieren kann und die, falls sie hält, ein klares
analytisches Ziel ist.

**Beobachtung (Riemann/CCM, hier als Arbeitsgrundlage):** Riemanns Funktion k mit k̂ = Ξ liegt im
„Kern“ der vollen Weil-Form, denn formal gilt Q(k) = Σ_ρ k̂(γ_ρ)·(…) = 0, weil Ξ(γ_ρ) = 0. Die
Abschneidung k_λ = k·𝟙_{[−L,L]} (L = log λ) hat daher einen sehr kleinen Rayleigh-Quotienten. Dieser
wird allein durch die Schwänze von k bestimmt, und die fallen doppelt-exponentiell (k(u) ~ e^{−πu²}).

**Reduktionskette (zu prüfen):**

```
(G)  Gap:        ε₂(λ) − ε₁(λ) ≥ g(λ)          (ε₁ einfach, Eigenvektor gerade  ⇒ M1)
(R)  Rayleigh:   Q_λ(k_λ)/‖k_λ‖² − ε₁ ≤ r(λ)   (unbedingt, über Schwanzabschätzungen)
(DK) Davis–Kahan: sin²∠(k_λ, ξ_λ) ≤ r(λ)/g(λ)
(NC) Normwechsel: sup_{|Im z|≤½−δ} |ξ̂_λ − c_λ k̂_λ| ≤ C·e^{(½−δ)L}·√L·sin∠(…)·‖k_λ‖
(KV) k̂_λ → Ξ lokal gleichmäßig auf dem Streifen (Abschneidefehler, unbedingt)
⇒ M2, und mit RED-HUR (formal verifiziert) ⇒ RH,
   sofern  r(λ)/g(λ) · e^{(1−2δ)L} · L → 0  für jedes δ > 0.
```

Damit hängt alles an **einer** Zahl pro λ: dem Quotienten r(λ)/g(λ) gegen e^{−L}. Das ist in Wochen, nicht in
Jahren falsifizierbar.

## 1. Arbeitspakete (Reihenfolge = Abhängigkeit)

| WP | Inhalt | Ergebnis | Abbruch-/Erfolgskriterium |
|---|---|---|---|
| 2A | **Weil-Labor:** QW_λ in der Fourierbasis e^{iπkx/L} auf [−L, L] (CCM-Basis), geschlossene Formeln für Pol- und Primterme, archimedischer Term über 2(N+1) hochpräzise Quadraturen. Paritätsblöcke gerade/ungerade. | `computations/weil_lab.py` | Validierung V1–V3 muss bestehen, sonst wird nichts darauf gebaut |
| V1 | Explizite Formel mit Gauß-Testfunktionen (auch nicht-gerade): Nullstellenseite vs. Prim-/Pol-/archimedische Seite | Übereinstimmung auf ≥ 30 Stellen | sonst Vorzeichen/Konstanten falsch |
| V2 | Zhu: 8,9·10⁻¹⁸ ≤ λ_min(0,8) ≤ 2,27·10⁻¹⁷ | Reproduktion (bis auf Normierung) | Normierungsabgleich dokumentieren |
| V3 | CCM: Nullstellen von ξ̂_λ bei λ² = 13 ≈ Zetanullstellen mit extremer Genauigkeit | Reproduktion | sonst Basis/Form falsch |
| 2B | **M1-Scan:** ε_even,1, ε_even,2, ε_odd,1 für λ² ∈ [2, 40] | Tabelle + Skalierungsgesetze | Gegenbeispiel zu M1 ⇒ sofort Befund |
| 2C | **(R) und (G) messen:** r(λ), g(λ), Winkel ∠(k_λ, ξ_λ) | Entscheidung, ob die Kette numerisch trägt | trägt nicht (r/g·e^{L} ↛ 0) ⇒ dokumentierter Fehlschlag, Kette verworfen |
| 2D | **Strukturjagd:** Gibt es einen Differentialoperator, der mit QW_λ (fast) kommutiert, analog zu Slepians „glücklichem Zufall“ beim Prolate-Operator? Kleinste-Quadrate-Suche über Sturm–Liouville-Familien. | Kommutatornorm als Funktion der Ansatzfamilie | Existenz ⇒ M1 für alle λ aus Sturm–Liouville-Theorie; Nichtexistenz ⇒ dokumentiert |
| 2E | Kalibrierung Epstein (Fensterform muss dort brechen) | kleinstes L mit Negativität | sichert, dass der Mechanismus das Eulerprodukt „sieht“ |
| 2F | Rigorose Zertifikate (Arb) für alles, was trägt; Lean für die Kette (DK)+(NC)+(KV)+RED-HUR | `CERT-*`, `formal/*` | — |

## 2. Was „Erfolg“ auf welcher Stufe heißt

1. **Stufe 1 (erwartbar):** Validiertes Weil-Labor; M1 für einen λ-Bereich zertifiziert oder ein
   Gegenbeispiel gefunden. Beides ist ein eigenständiger, publizierbarer Befund.
2. **Stufe 2 (offen):** Die Kette trägt numerisch, d. h. r/g·e^{L} → 0 mit klarem Gesetz. Dann ist RH
   auf eine **explizite Spektrallücken-Ungleichung für endliche Primoperatoren** reduziert, und die
   Reduktion wäre formal verifiziert. Das wäre ein ernsthafter Fortschritt, aber noch kein Beweis.
3. **Stufe 3 (Beweis):** analytischer Beweis von (G) für alle λ. Hier liegt mit hoher
   Wahrscheinlichkeit die volle Schwierigkeit von RH. Nach dem Filter F-EP muss dieser Schritt das
   Eulerprodukt benutzen.

## 3. Internationale Verteidigbarkeit (von Anfang an eingebaut)

- Jede Zahl hat Skript + JSON + Präzision; jede Beweislast-Rechnung wird mit Ball-Arithmetik zertifiziert.
- Jede logische Reduktion kommt nach Lean (Muster: RED-HUR).
- Externe Prüfung: Die natürlichen Gutachter sind die Autoren der Programme, an denen wir arbeiten
  (Connes–Consani–Moscovici; Zhu; Platt–Trudgian für Numerik). Kontakt und Einreichung übernimmt der
  Mensch, der das Projekt verantwortet. Ich reiche nichts selbst ein.
- Veröffentlichung von Zwischenbefunden (Stufe 1/2) *vor* einer Beweisbehauptung. Das baut Vertrauen
  in die Werkzeuge auf, bevor sie Beweislast tragen.
