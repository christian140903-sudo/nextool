# Mathematisches Forschungsprojekt — Arbeitsprotokoll

Dieses Verzeichnis ist die Forschungsakte für das mathematische Lösungsprojekt nach der
Grunddirektive vom 2026-09-25. Die konkrete Problemstellung ist **noch nicht eingegangen**;
[`DOSSIER.md`](DOSSIER.md) ist vorbereitet und wird ab dem nächsten Input befüllt.

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
| `DOSSIER.md` | Forschungsakte: Target, alle Ledger, Dependency-Graph, Failure Log, Versionen |
| `requirements.txt` | gepinnte Python-Umgebung |
| `tools/check_env.py` | Smoke-Tests aller Werkzeuge — Verfügbarkeit wird geprüft, nicht behauptet |
| `computations/` | (ab Problemeingang) je Experiment ein Skript + Ausgabe + Protokolleintrag |
| `formal/` | (bei Bedarf) Lean-Projekt für formalisierte Teilaussagen |
| `literature/` | (ab Problemeingang) Quellenkarte mit Primärquellen und geprüfter Reichweite |

Jedes Rechenskript muss deterministisch reproduzierbar sein (Seeds, Präzision, Versionen im Kopf
des Skripts) und im Evidence Ledger mit seiner exakten logischen Rolle eingetragen werden.

## Rechenumgebung (verifiziert 2026-09-25 per `tools/check_env.py`)

Verfügbar und getestet: Python 3.11 mit sympy 1.14, mpmath 1.3 (beliebige Präzision), numpy 2.4,
scipy 1.17, networkx 3.6, z3 5.1 (SMT), python-sat mit CaDiCaL (SAT); gcc/g++ 13.3; Node 22;
4 CPU-Kerne, 15 GB RAM.

Nicht installiert: Lean, Coq, Isabelle, Sage, PARI/GP, GAP, Julia. Der Lean-Installer (elan) ist
über das Netz erreichbar; Lean 4 + Mathlib wird installiert, sobald eine konkrete Teilaussage die
Formalisierung rechtfertigt.

```sh
pip install -r math-research/requirements.txt
python3 math-research/tools/check_env.py
```
