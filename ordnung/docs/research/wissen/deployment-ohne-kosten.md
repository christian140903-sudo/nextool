---
name: deployment-ohne-kosten
description: >
  Load when something must be hosted, published or persisted at zero or minimal cost (static
  sites, small APIs, databases, artifacts, prototypes), when choosing between GitHub Pages,
  Cloudflare, Vercel, Netlify, Supabase or local SQLite, or when a free tier pauses or throttles.
schicht: atlas
sichtbarkeit: public
version: 2026-09-06.1
verfaellt_am: 2026-10-06
haltbarkeit_default: H3
signale: [deploy, hosting, pages, workers, database, free_tier, publish]
ladestufe_default: 1
abhaengig_von: [kontingent-kosten, sicherheit-autonome-agenten]
gemessen: {geladen: 0, gewirkt: 0, letzte_nutzung: null}
autor: mining
---

## Kurzform (≤ 120 Wörter)
Gratis-Hosting ist real, aber jede Stufe hat eine Klausel, die entscheidet: GitHub Pages verbietet Business/E-Commerce/SaaS; Vercel Hobby pausiert bei Überschreitung; Netlify hat 300 Credits hart; Supabase Free pausiert nach 7 Tagen ohne Request; Cloudflare Workers Free hat 100k Requests/Tag und 10 ms CPU. Regel: Statisches → GitHub Pages oder Cloudflare; kleine Logik → Workers Free; nichts, das nachts laufen muss, auf einen pausierenden Tier; Zustand lokal in SQLite ($0, kein Pausenrisiko). Extern publizieren ist Ring 2 (Nutzerentscheidung); vorher Secrets-Scan. Limits sind H3-Wissen — vor jeder Entscheidung die Quelle prüfen.

## Kernprinzipien
1. [B@q5 2026-09-06] H3 Cloudflare Workers Free: „100,000/day" Requests; CPU „10 ms" je Request (Paid „5 min", Default 30 s); 128 MB; Script 64 MiB; 100 Workers/Account (Paid 500); 50 Subrequests/Request (Paid 10.000); Static Assets 20.000 Dateien/Version (Paid 100.000), 25 MiB je Datei.
2. [B@q6 2026-09-06] H3 GitHub Pages: Repo-Empfehlung 1 GB, Site ≤ 1 GB, „soft bandwidth limit of 100 GB per month", „soft limit of 10 builds per hour" (entfällt bei eigenem Actions-Workflow), Deploy-Timeout 10 min; verboten als „free web-hosting service to run your online business, e-commerce site … SaaS".
3. [R@R15 §2.2.3, Sekundär] H3 Vercel Hobby: 100 GB Transfer/Monat, 100K Function-Invocations, 10 s Ausführung, 1 gleichzeitiger Build; **Pause bei Überschreitung**, nicht-kommerzielle Klausel.
4. [R@R15 §2.2.3, Sekundär] H3 Netlify Free: 300 Credits/Monat hartes Limit über fünf Meter; Pause bei Erreichen.
5. [R@R15 §2.2.3, Sekundär] H3 Supabase Free: 2 Projekte, 500 MB DB, 1 GB Storage, 5 GB Egress, 50K MAU, **Pause nach 7 Tagen ohne DB-Request** (manuelles Unpause).
6. [R@R15 §2.2.3] H1 SQLite: lokal, $0, kein Pausenrisiko — Speicher für Gedächtnis, Atlas, Zustand (SOUL nutzt SQLite+FTS5).
7. [R@R15 §2.2.3] H2 Git/GitHub: `gh` CLI kontexteffizienter als MCP; gehosteter GitHub-MCP (`https://api.githubcopilot.com/mcp/`, OAuth 2.1 + PKCE) ohne lokale Installation; Preflight bewertet Token und Binary getrennt („Token ohne Werkzeug" → Werkzeug nachinstallieren).
8. [B@q7 2026-09-06] H1 Doku im selben Commit; tote Doku löschen; nicht duplizieren, verlinken.
9. [SOUL guard.py] H1 „extern-publizieren" steht auf der Ring-2-Ausnahmeliste: Veröffentlichung ist Nutzerentscheidung; vorher Secret-Guard.
10. [B@q4 in projekt-zu-ende-fuehren] H1 Vor „deployed": E2E-Probe gegen die Live-URL (Statuscode, Inhalt, ein Klickpfad), nicht nur Build-Erfolg.

## Entscheidungsregeln
- Nur statisch, öffentlich, nicht kommerziell → GitHub Pages (Actions-Workflow, dann kein 10/h-Limit) oder Cloudflare Static Assets.
- Kleine Logik (< 10 ms CPU, < 100k Req/Tag) → Workers Free; darüber Paid oder eigener Host.
- Braucht Datenbank, die nachts leben muss → nicht Supabase Free; lokal SQLite + Sync, oder bezahlter Tier (Ring 2).
- Kommerziell → GitHub Pages ausgeschlossen (Klausel); Vercel Hobby ausgeschlossen (Klausel); Cloudflare/eigener Host.
- Vor jedem Deploy: Secrets-Scan des Repos, Ring-2-Bündelfrage bei Erstveröffentlichung, danach Live-Probe.

## Werkzeuge
`gh`, GitHub Actions, `wrangler` (Cloudflare) [U Befehlsname], Vercel/Netlify CLIs [U], `psql` (lokal vorhanden [R@R15]), SQLite; Playwright-MCP für Live-Proben [R@R15].

## Anti-Patterns
- Prototyp auf einem Tier, der bei Überschreitung pausiert, ohne Monitoring (Beleg: 3, 4, 5).
- Gratis-Klausel überlesen (Beleg: 2, 3).
- Gedächtnis oder Atlas in einer pausierbaren Cloud-DB (Beleg: 5, 6).

## Unter welcher Bedingung ist dieses Dossier falsch?
Alle Zahlen sind H3 (30 Tage). Vercel/Netlify/Supabase sind hier nur Sekundärquellen (R15) — Primär-Abruf ist der erste Pflegeauftrag. Preisänderungen oder neue Free-Tiers (z. B. Fly.io, Render [U]) ändern die Entscheidungsregeln.

## Quellen
- @q5 https://developers.cloudflare.com/workers/platform/limits/ (Abruf 2026-09-06)
- @q6 https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits (Abruf 2026-09-06)
- @q7 https://google.github.io/styleguide/docguide/best_practices.html (Abruf 2026-09-06)
- R15 §2.2.3 (Vercel/Netlify/Supabase Sekundär; registry.modelcontextprotocol.io; GitHub-MCP GA)
