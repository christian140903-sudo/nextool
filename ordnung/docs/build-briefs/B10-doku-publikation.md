# B10 — Dokumentation, Publikation, Changelog, Site

Lies Baukontext, Register, alle docs/, R12 (Publikationswege, Namensverfügbarkeit, Positionierung), R04 (Installationsanleitungen), Repo-Regeln `/home/user/nextool/CONTRIBUTING.md` und `scripts/audit-site.mjs` (Audit läuft bei `npm test`; neue HTML-Seiten brauchen gültige lokale Links; keine unbelegten Claims; verbotene Wörter aus soul-honesty).
Erzeuge:
1. `ordnung/README.md` (deutsch): Was Soul 10 ist (drei Säulen, Miguel, Erlebnis), Installation in Claude Code (Plugin + Onboarding), andere Hosts (Verweis adapters/README), Stand der Evidenz (nur was gemessen ist: Pilot mit Einschränkungen; Chrisos Vorbefunde mit Herkunft), Grenzen, Lizenz.
2. `docs/09-publikation.md`: Schritt-für-Schritt: GitHub-Repo/Branch, eigenes Plugin-Marketplace-Repo (marketplace.json), `claude plugin marketplace add …` / `install`, npm-Paket `soul10` (optional, `npx soul10 init`), Agent-Skills-Verzeichnisse, MCP-Registry (falls MCP-Adapter), Landingpage; Namensprüfung (R12); Lizenz; Versionierung; Release-Checkliste inkl. Eval-Pflicht vor Wirkungsclaims.
3. `docs/10-changelog-offene-fragen.md` (AP7): Änderungsprotokoll dieser Bauphase (Datum, Schritt, Entscheidung), offene Fragen (aus Register + Prüfung), nächste Schritte (Beweisprogramm Stufen aus R13).
4. Optional, nur wenn Audit sicher grün bleibt: `soul10/index.html` unter dem Site-Root als schlichte Produktseite (Design: Orange #E8590C auf Tinte #1F2430 wie SOUL; Claims nur mit Herkunft; noindex bis Eval) + Eintrag in sitemap nur wenn indexierbar gewünscht — sonst weglassen.
5. Kunden-Deliverable-Index `docs/00-INDEX.md`: AP1–AP7 → Dateien.
Abnahme: `npm test` grün (Ausgabe zeigen); alle Links in README relativ und existent.
