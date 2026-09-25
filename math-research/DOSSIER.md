# Forschungsakte

**Projektstatus:** `OPEN` — Grunddirektive aufgenommen, Problemunterlagen ausstehend.
**Letzte Aktualisierung:** 2026-09-25

Jeder Eintrag trägt eine ID (`T-`, `A-`, `Q-`, `S-`, `B-`, `F-`, `L-`, `E-`, `X-`, `V-`), damit
Abhängigkeiten und Revisionen nachvollziehbar bleiben. Einträge werden nicht gelöscht, sondern
mit neuem Status versehen.

---

## 1. Target Specification

Exakt zu beweisende Aussage, vollständig quantifiziert, mit Quelle der offiziellen Formulierung.

| ID | Aussage (formal) | Offizielle Quelle | Status |
|---|---|---|---|
| T-0 | *ausstehend — wird aus den Problemunterlagen bestimmt* | — | `OPEN` |

Zusätzlich festzuhalten: was **nicht** verlangt ist (Abgrenzung), sowie was als Lösung bzw. als
rigoroses Gegenresultat zählt.

## 2. Assumption Ledger

| ID | Voraussetzung | Typ (Definition / Satz / Konvention / Heuristik / Vermutung / Arbeitshypothese) | Quelle (exakte Stelle) | Voraussetzungen im Anwendungsfall geprüft? | Status |
|---|---|---|---|---|---|

## 3. Quantifier Ledger

Alle tragenden Aussagen in vollständig quantifizierter Form; Abhängigkeiten von Konstanten
explizit (z. B. `∀ε>0 ∃C(ε) ∀x ≥ x₀(ε): …`).

| ID | Aussage | Konstanten hängen ab von | Uniform in | Anmerkung |
|---|---|---|---|---|

## 4. Equivalence / Strategy Map

| ID | Formulierung / Strategie | Beziehung zu T-0 (⇔ / ⇒ / ⇐ / Spezialfall) | Beleg für die Beziehung | Fehlender Schritt | Track |
|---|---|---|---|---|---|

## 5. Barrier Ledger

Für jeden Ansatz: der exakt fehlende mathematische Schritt und, falls bekannt, eine bewiesene
Barriere (z. B. Paritätsproblem, Relativierung, natürliche Beweise, Unabhängigkeit).

| ID | Ansatz | Exakt fehlender Schritt | Bewiesene Barriere? (Quelle) | Umgehungsidee |
|---|---|---|---|---|

## 6. False-Shortcut Ledger

Bekannte oder neu entdeckte falsche Abkürzungen — mit Gegenbeispiel oder Fehlerstelle.

| ID | Scheinbarer Schluss | Warum falsch (Gegenbeispiel / Lücke) | Quelle |
|---|---|---|---|

## 7. Lemma Dependency Graph

```
(wird mit den ersten Lemmata angelegt; Format: L-i  ──benötigt──▶  L-j | A-k)
```

| ID | Aussage | Hängt ab von | Status | Beweisort |
|---|---|---|---|---|

## 8. Evidence Ledger

Strikte Trennung der Evidenzarten.

| ID | Aussage | Evidenzart (Beweis / importierter Satz / formal verifiziert / Numerik / Heuristik) | Artefakt (Datei, Commit, Quelle) | Logische Rolle im Hauptsatz |
|---|---|---|---|---|

## 9. Failure Log

Gescheiterte Ansätze bleiben dokumentiert, damit derselbe Fehler nicht erneut eingebaut wird.

| ID | Datum | Ansatz | Präziser Grund des Scheiterns | Lokal oder strukturell? | Konsequenz |
|---|---|---|---|---|---|

## 10. Priority / Version Record

| ID | Datum | Ereignis | Betroffene Einträge | Commit |
|---|---|---|---|---|
| V-1 | 2026-09-25 | Grunddirektive aufgenommen; Aktenstruktur, Statusvokabular und verifizierte Rechenumgebung angelegt | — | (dieser Commit) |

---

## Bestandsaufnahme (ab Problemeingang)

Checkliste gemäß Direktive; jeder Punkt wird mit Primärquellen belegt oder als unbekannt markiert.

- [ ] exakte Problemdefinition und sämtliche Quantoren
- [ ] bekannte äquivalente Formulierungen
- [ ] stärkere und schwächere Varianten
- [ ] bekannte Spezialfälle und Teilresultate (mit exakter Reichweite)
- [ ] Gegenbeispiele verwandter Aussagen
- [ ] bekannte Beweisbarrieren
- [ ] historische Fehlversuche
- [ ] etablierte Hauptmethoden und aktuelle Forschungsrichtungen
- [ ] bekannte numerische Ergebnisse (mit Verifikationsstatus)
- [ ] bestehende Formalisierungen (Mathlib, Archive of Formal Proofs, …)
- [ ] ungelöste Zwischenlemmata
- [ ] Stellen, an denen die Literatur Zusatzannahmen benötigt
- [ ] Stellen, an denen Forschungsrichtungen dieselbe Struktur verschieden darstellen
