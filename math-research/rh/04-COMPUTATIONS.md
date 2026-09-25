# 04 · Rechnungen (Computational Track) — Evidence Ledger

Alle Rechnungen verwenden Ball-Arithmetik (Arb/FLINT über `python-flint 0.9.0`) mit 96–128 Bit, außer wo
anders angegeben. „Computerbewiesen“ heißt: Die Aussage folgt logisch aus rigorosen Einschlüssen. Die
Logik steht im Kopf von [`computations/certify.py`](../computations/certify.py).
Näherungswerte, etwa Startpunkte aus der Literatur oder nicht-rigorose Nullstellen, dienen nur zur
Platzierung und tragen keine Beweislast.

| ID | Aussage | Status | Rolle für MAIN | Artefakt |
|---|---|---|---|---|
| C-1 | Alle ρ mit 0 < γ ≤ 1000,5705… sind einfach und liegen auf Re s = ½; N = 649 | computerbewiesen | keine (Reproduktion) | `results/rh_range_1e3.json` |
| C-2 | dito bis T = 9999,4578…; N = 10142 | computerbewiesen | keine (Reproduktion) | `results/rh_range_1e4.json` |
| C-2x | Kreuzvalidierung: N(T) aus unserem Argumentprinzip = N(T) aus Arbs Turing-Methode (`zeta_nzeros`) für beide T | bestätigt | RH-13 auf Rechenebene | Protokoll unten |
| C-3 | dito bis T ≈ 10⁵ | läuft / siehe `results/rh_range_1e5.json` | keine | — |
| C-4 | Davenport–Heilbronn-Funktion: je genau eine Nullstelle in 4 Boxen der Kantenlänge 2·10⁻³ um 0,808517+85,699348i, 0,650830+114,163343i, 0,574356+166,479306i, 0,724258+176,702461i; alle Boxen ⊂ {Re s > ½} | computerbewiesen | **Barriere B-EP** (RH-18) | `results/davenport_heilbronn.json` |
| C-5 | Epstein-ζ zu x²+5y²: genau 13 Nullstellen (mit Vielfachheit) in [0,51; 3]×[1; 100], jede einfach in einer Box ≈ 1,2·10⁻³ × 1,5·10⁻³ lokalisiert (erste bei ≈ 0,9325 + 15,6689i) | computerbewiesen | **Barriere B-EP**, **False Shortcut X-02** (positive Koeffizienten + FE ⇏ RH) | `results/epstein_x2_5y2.json` |
| C-6 | λ_n > 0 für 1 ≤ n ≤ 500 (Einschlüsse, z. B. λ_500 = 991,900092992… ± 2,5·10⁻¹⁰); Kontrolle λ_1 = 1 + γ/2 − ½ log 4π bestanden | computerbewiesen (endlich) | Evidenz; B-LI zeigt Detektionsschwelle n ≳ 10²⁷ | `results/li_coefficients_500.json` |
| C-7 | λ_n > 0 für 1 ≤ n ≤ 1000 (4200 Bit, 2111 s); λ_1000 = 2326,0531616864664574 ± 6,5·10⁻¹⁸ (RH-Asymptotik (n/2)(log n − 1 − log 2π + γ) ≈ 2323,6) | computerbewiesen (endlich) | Evidenz | `results/li_coefficients_1000.json` |
| C-9 | **RH-19 Doppelzertifizierung** mit zweiter ζ-Implementierung `zeta_em.py` (Euler–Maclaurin, selbst hergeleitete Restgliedschranke \|R\| ≤ \|(s)_{2ν+1}\|·2ζ(3)/(2π)^{2ν+1}·(N+a)^{−σ−2ν}/(σ+2ν), **ohne** `acb.zeta`): Vorab-Kreuztest an 60 Zufallspunkten (σ∈[−0,5; 2,5], \|t\|≤200, 6 Parameter a) — alle Bälle überlappen mit Arb, Radien ≤ 1,5·10⁻³²; dann C-1, C-4, C-5 neu zertifiziert: DH 4/4, Epstein 13/13 Boxen + Gesamtwindung 13, RH bis T=1000,57: N = K = 649 — **vollständig konsistent** (362 s) | computerbewiesen (2. Implementierung) | RH-19 | `recertify.py`, `results/recertify_rh19.json` |
| C-10 | Weil-Labor + Phase-2-Messungen (V1–V4, Paritätsleiter, Winkelgesetz, H-Ξ, K-Ξ-Widerlegung, Epstein-Kalibrierung) | NUMERICAL (mpmath 40–120 Stellen) | Befunde rh/07 | `weil/`, `results/weil_*` |
| C-11 | Härtetests Weil-Matrix: (a) Eigenwerte bei 30/50/80 Stellen auf 12 Ziffern identisch (L=0,8, N=30: 1,98411331695·10⁻¹⁷); (b) Gårding: kleinster Eigenwert der auf |k|>K komprimierten Form wächst monoton und logarithmisch (K=0,2,5,10,20,40: 6·10⁻¹², 1,5·10⁻³, 0,60, 1,07, 1,56, 2,24) | NUMERICAL | bestätigt rh/08 Punkte 5–7, Korollar AS(c) | `weil/c11_robustness.py`, `results/weil_c11_robustness.json` |
| C-12 | **PROVED-FINITE:** W_{N,L} ≻ 0, even-simple (M1_N) und rigoroser λ_min-Einschluss per Arb (rigorose Integrale, Intervall-LDLᵀ, Sylvester): L=4/5, N=20/30/50: λ_min/(2L) ∈ [2,39;2,92], [1,79;2,18], [1,72;2,10]·10⁻¹⁷ (monoton fallend, über Zhus Untergrenze 8,9·10⁻¹⁸); L=1, N=40: [7,42;9,07]·10⁻³⁰; L=11/10, N=46: [2,84;3,47]·10⁻³⁸; L=5/4, N=56: [1,13;1,38]·10⁻⁵⁴ (Integrationstoleranz an Präzision gekoppelt, Radien ≤ 10⁻¹¹⁷) | PROVED-FINITE | nach BT-L NUR Positivität auf E_N(L) (L-20) | `weil/c12_certify_finite.py`, `results/weil_c12_*.json` |
| C-8 | FE-Kontrollen: Davenport–Heilbronn Λ(s)=Λ(1−s) mit Λ(s) = (5/π)^{(s+1)/2}Γ((s+1)/2) f(s), Residuum ≤ 10⁻⁴¹; Epstein (√20/2π)^sΓ(s)Z(s) symmetrisch, Residuum ≤ 10⁻⁴⁰; Epstein-Formel gegen direkte Gittersumme bei s = 3 geprüft (Abweichung 1,5·10⁻¹¹ ≈ Abbruchfehler) | Kontrolle | stützt die Identifikation der Gegenmodelle | `counter_models.py`, `epstein_probe.py` |

## Methodik C-1/C-2 (Beweislogik)

1. **Lemma 0** (formal): Nichttriviale Nullstellen liegen in 0 < Re s < 1 ⊂ [−1, 2].
2. **Windungszahl auf B = [−1,2]×[−1,1] ist −1.** Einziger Pol ist s = 1, also liegt keine Nullstelle in B.
   Das deckt 0 < γ ≤ 1 ab.
3. **Windungszahl auf A = [−1,2]×[1,T] ist N.** Der Rand ist in Segmente zerlegt; für jedes Segment
   gilt: f(Box) ∌ 0 (rigoros), und die Argumentänderung ist der Hauptwert Arg(f(b)/f(a)) mit Radius < 0,5.
   Aufeinanderfolgende Segmente teilen **exakt** ihre Endpunkte (siehe F-2). Die Summe muss genau eine
   ganze Zahl einschließen.
4. **K rigorose Vorzeichenwechsel** von Z(t) = e^{iθ(t)}ζ(½+it). Dabei ist θ = Im log Γ(¼+it/2) − (t/2) log π;
   der Zweig von log Γ ist egal, weil nur e^{iθ} eingeht. Z ist rigoros reell eingeschlossen (Imaginärteil ∋ 0).
5. **K = N ⇒** jede Nullstelle mit 0 < γ ≤ T ist einfach und liegt auf der Geraden.

Laufzeiten (4 Kerne): T = 10³: 10 s; T = 10⁴: 180 s.

## Methodik C-4/C-5 (Pipeline für den negativen Lösungsausgang)

Box R ⊂ {Re s > ½}, Windungszahl ≥ 1 ⇒ mindestens eine Nullstelle mit Re s > ½. Genau diese Pipeline
würde nach RH-19 eine Gegen-Nullstelle von ζ zertifizieren, dann bei Höhe > 3·10¹² und mit einer
**zweiten, unabhängigen Implementierung** (noch offen: eigene Euler–Maclaurin-Auswertung mit expliziter
Restgliedschranke, ohne `acb.zeta`). Kontrollbox für ζ: [0,6; 1,2]×[80; 120] hat Windungszahl 0.

## Failure Log der Rechnungen

| ID | Datum | Fehler | Entdeckt durch | Behebung | Auswirkung |
|---|---|---|---|---|---|
| F-1 | 2026-09-25 | Die FE-Kontrolle für Davenport–Heilbronn benutzte sin(πs/2), die Form für ζ und gerade Charaktere. Der Charakter mod 5 mit χ(2)=i ist **ungerade**, richtig ist cos(πs/2). | Die Kontrolle schlug fehl (Residuum ≈ \|f\|) | korrigiert; Residuum jetzt ≤ 10⁻⁴¹ | keine auf die Nullstellenzertifikate (FE geht dort nicht ein) |
| F-2 | 2026-09-25 | Konturpunkte wurden als a + (b−a)·(j/n) berechnet. Für j = n ist das in Gleitkomma nicht immer exakt b, die Kontur war also nicht exakt geschlossen. | Die Ganzzahligkeitsprüfung der Windungszahl schlug beim Epstein-Lauf fehl (13 + 2·10⁻¹⁷ ± 10⁻³¹) | `edge_points`/`contour_pieces` mit exakten Endpunkten und Assertion der Geschlossenheit; **alle** Läufe (C-1, C-2, C-4, C-5) wiederholt | Ergebnisse unverändert, jetzt aber logisch sauber |

| F-5 | 2026-09-25 | Zweite Implementierung: EM-Summe im linken Halbraum schlecht konditioniert (Terme ~ n¹ bei Re s = −1), Laufzeitexplosion | Laufzeit > 30 min, Profil (py-spy) zeigte `hurwitz_em` in der ζ-Kontur | für Re s < ½ Funktionalgleichung ζ(s) = 2^s π^{s−1} sin(πs/2) Γ(1−s) ζ(1−s) | keine auf Korrektheit, nur Laufzeit |

## Offene Rechenaufgaben

- RH-19: umgesetzt (C-9). Gemeinsamer Kern beider Implementierungen bleibt Arbs Ball-Grundarithmetik und log Γ (nur für θ in Z(t)).
- C-3 abschließen, danach optional T = 10⁶. Das hat nur Infrastrukturwert.
- Epstein-Scan bis T = 1000 für Statistik: Anteil der Off-Line-Nullstellen gegenüber der
  Bombieri–Hejhal-Vorhersage (Dichte 0).
