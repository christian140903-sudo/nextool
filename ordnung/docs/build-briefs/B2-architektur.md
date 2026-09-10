# B2 — Architektur Soul 10.0.0 (Entwurf), B2k Kritik, B2r Revision

## B2 (Architekt)
Lies Kontextpaket, `docs/03-baukontext.md`, `docs/02-design-entscheidungsregister.md` und `docs/build-briefs/00b-ERFINDUNGEN.md` (verbindlich: E1–E19 und das Überraschungs-Prinzip integrieren oder begründet verschieben) vollständig; gezielt R14 (Kritik der SOUL-Basis, Dirigent, Ebenen), R03 (Plugin-Blaupause, Hooks), R10 (Tiefenstufen, Routing-Tabelle, Kostenmodell), R05 (Gedächtnisschema), R04 (Kompilat). Schreibe `docs/04-architektur.md` (deutsch, 5.000–8.000 Wörter) mit:
1. Zielbild und Nicht-Ziele (inkl. Verbotsliste).
2. Die drei Säulen und ihre Schnittstellen (Diagramm als ASCII/Mermaid): Gedächtnis ↔ Denken ↔ Durchführung; „Freiheit ist eine Funktion von Gedächtnis" als Datenfluss.
3. **Dateibaum des Produkts** (vollständig, jede Datei mit Zweck, Sprache, Größe, Trigger): `ordnung/structure/` (Kernel, Bündel, Selbst, Werte, Robustheit, Implant), `ordnung/plugin/` (Claude-Code-Plugin), `ordnung/adapters/` + `build/`, `ordnung/eval/`, `ordnung/soul10/` (die neue SOUL-Fassung: core/, .claude/, bin/, knowledge/, atlas/, onboarding/, playbooks/, tests/), `ordnung/docs/`.
4. Laufzeit-Datenflüsse: Session-Start (Briefing ≤ 60 Zeilen: Anker, Identität, Vorhaben, Gedächtnis), pro Prompt (Router → Stufe → Bündel), Stop (Reflexion → Kandidaten, Rückbau, Vorhersagen), PreCompact/compact-Reinjektion, Ebenen (Übergabe-Verträge, Rückkanal, Workspace-Datei C1), Schedules (Schlaf-Konsolidierung, Atlas-Pflege).
5. Gedächtnisschema (Tabellen/Felder/Zustände/Herkunft/Verfall) und Selbstmodell-Dateien; öffentliche vs. private Stufe.
6. Dirigent: Schleife, Ebenenmodell 1–6, Onboarding (Zustimmung, Bestandsaufnahme, Ring 2), Profil, Atlas, Knappheit, Wissensorgan-Laden.
7. Universalität: Plattformneutralität (macOS/Linux/Windows), Kompilat für andere Hosts, was je Host degradiert.
8. SOUL-Basis: Tabelle keep/change/drop/new je Datei des SOUL-Repos (aus R14), mit Begründung.
9. Kosten- und Tokenmodell (aus R10) und Betriebsprofile leicht/normal/tief.
10. Evaluations-Einbettung (Arme, Linting, Router-Test, Identitäts-Battery) und wie das Produkt sich selbst misst.
11. Risiken und Falsifikation (was das Design widerlegen würde).
Jede Sektion mit D-Nummern-Verweisen. „Erz → Gold"-Zeilen je Komponente.

## B2k (Kritiker) — eigener Agent
Sieht NUR `docs/04-architektur.md`, das Register und den Baukontext. Beginnt mit „3 Gründe warum das scheitern könnte:". Liefert ≥ 10 konkrete Befunde (Datei/Abschnitt, Problem, Beleg aus Register/Bericht/Code, Vorschlag), inkl. Primitivitäts-Check (§13), toter-Mechanismus-Check, Kostencheck, Universalitätscheck, Widerspruchscheck gegen SOULs Invarianten. Schreibt `docs/04-architektur-kritik.md`.

## B2r (Revision) — eigener Agent
Liest Entwurf + Kritik, disponiert jeden Befund (accepted/rejected/deferred + Begründung) in einer Tabelle am Ende von `docs/04-architektur.md`, arbeitet accepted ein, markiert Version „final v1".
