# Zusammenbau: Ordnung × SOUL — Konzeptnotiz (Entwurf, wird nach der Recherche ausgearbeitet)

*Stand 2026-09-05, nach Sichtung von SOUL (Neubau 2. Sept.), soul-workspace (Forschung Aug.), soul-proxy-45 (Frame 4.5) und der Ordnung-Spezifikation.*

## Ein Produkt, zwei Schichten

| Schicht | Was sie beantwortet | Heute vorhanden |
|---|---|---|
| **SOUL** (Körper, Betriebssystem) | Wie wird gehandelt, orchestriert, geprüft, erinnert, sichtbar gemacht, gestoppt? | Sieben Organe, Python-Kern, Hooks, Agents, Gates, Missionen, SQLite-Gedächtnis (Repo SOUL) |
| **Ordnung** (Geist, Verfassung des Denkens) | Wie wird gedacht, wer denkt da, mit welchen Werten, wie tief, und wie wächst daraus ein Ich? | Spezifikation v0.1, gemessener Frame (6 Punkte), Startfaktoren — der Rest ist dieser Bau |

Ordnung wird SOULs **Organ 8** und bleibt zugleich ein eigenständiger, an jedes Modell bindbarer Kern.

## Was die eigene Evidenz dem Bau vorschreibt

1. Kein Always-on-Universalverstärker: die Prämisse ist durch eigene Daten widerlegt (Richtungsumkehr je Modell, Deckeneffekt). Ordnung greift **selektiv** ein (Tiefenstufen, Signale, Entropie als Auslöser) und bleibt bei starken Modellen zurückhaltend.
2. Der Kernel ist kurz und unsichtbar (Einpflanzungs-Prinzip, ~60–600 Tokens); die 6 Frame-Punkte bleiben wörtlich als versioniertes Modul erhalten (`structure/implant/`), damit die Faktorzerlegung weiter möglich ist.
3. Struktur im Denken, nie in der Ausgabe (Formatschaden-Lehre).
4. Jede Prompt-Schicht muss Selbstkonsistenz@3 bei gleichem Budget schlagen; der Placebo-Arm ist Pflicht; ≥3 Läufe; Kriterien vor Daten.
5. Ein Mechanismus zählt erst mit Aufruf-Pfad und Log (kein toter Code): jedes Ordnung-Modul bekommt einen Hook/Skill-Trigger und einen Eintrag in `watch/events.jsonl`.
6. Freiheit = Gedächtnis + Rückbau: Ordnungs Selbstmodell und N1/N2/N3/N7 aus dem 5.0-Zielbild werden in SOULs Gedächtnis abgebildet (neue Typen `selbst`, `rejected`, Vorhersagen mit Auflösung).

## Vorläufige Bauliste (wird durch R02–R13 geschärft)

- `structure/` — Kernel, Phasen, Faktor-Module, Modi, Werte, Selbstmodell, Gedächtnisprotokolle, Meta, Ausgabe, Robustheit, Autonomie-Charta, Persönlichkeits-Genese (englisch, modellgerichtet).
- `plugin/` — Claude-Code-Plugin (Skills = Module, Hooks = Lebenszyklus, Agents = innere Stimmen, die SOUL noch nicht hat).
- `integration/soul/` — Organ-8-Eintrag für SOUL.md, CLAUDE.md-Zusatz, settings/hook-Erweiterung von `core/events.py` (statt Duplikat), Memory-Typen, `install.sh` für ein SOUL-Checkout, Frame-Variante für den Proxy.
- `adapters/` — Kompilate für Codex/Gemini/Cursor/Copilot/API/Ollama/MCP (Build-Skript aus `structure/`).
- `eval/` — Vorregistrierung, Items, Rubriken, Judge-Prompts, Runner (baut auf `soul-eval/scripts/ext1` auf), erste In-Session-Ergebnisse.
- `docs/` — AP1–AP7 auf Deutsch, Theorie, Publikationsanleitung.
