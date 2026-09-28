# B8 — Adversariale Gesamtprüfung · B9 — Fix-Pass

## B8 (Prüfer; sieht nur Artefakte)
Lies Kontextpaket §13 (Gold aus Erz), Baukontext, Register; dann ALLE Dateien unter `ordnung/structure/`, `ordnung/plugin/`, `ordnung/soul10/` (Code gezielt), `ordnung/eval/PRAEREGISTRIERUNG.md`, `docs/04-architektur.md`. Beginne mit „3 Gründe warum das scheitern könnte:". Prüfe und schreibe `docs/08-pruefung.md` (deutsch):
1. Primitivitäts-Check je Bauteil (Erz→Gold-Zeile vorhanden? Würde ein Kenner der Vorlagen Neues erkennen?).
2. Tote Mechanismen (Mechanismus ohne Trigger/Log).
3. Widersprüche zwischen Kernel, Bündeln, Charta, Robustheit, Dirigent (Linting-Ergebnis ausführen: `node eval/lint-constitution.mjs`).
4. Überlänge/Generik/Floskeln/Zögerlichkeit in modellgerichteten Texten (R02-Anti-Patterns).
5. Namen vs. Mechanismus (Anti-Performance), Bewusstseinsbehauptungen, Zahlen ohne Herkunft.
6. Universalität (Mac-Annahmen, harte Pfade), Sicherheit (Secrets, Injection-Pfade im Gedächtnis), Ring-2-Liste intakt.
7. Mechanische Abnahmen wiederholen (pytest, validate, build, run --plan) und Ausgaben zeigen.
Jeder Befund: Pfad, Problem, Beleg, Vorschlag, Schwere (blockierend/hoch/mittel/niedrig). Urteil: tragfähig / mit Auflagen / nicht tragfähig.

## B9 (Fixer; eigener Agent)
Disponiert jeden Befund (accepted/rejected/deferred mit Begründung) in einer Tabelle am Ende von `docs/08-pruefung.md`, arbeitet accepted ein, wiederholt die mechanischen Abnahmen, aktualisiert Register/Architektur, wo sich Entscheidungen geändert haben.
