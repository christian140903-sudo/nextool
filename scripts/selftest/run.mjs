#!/usr/bin/env node
// Selbsttest des Site-Linters: Ein Mechanismus gilt erst als gebaut, wenn sein Fehlerfall
// einmal ausgeloest wurde. Jeder Fall kopiert site/ in ein Temp-Verzeichnis, baut genau
// einen Verstoss ein und erwartet die passende Regel. Dazu zwei Kontrollen:
//   - die unveraenderte Kopie muss fehlerfrei sein (sonst prueft der Test nichts),
//   - eine widerrufene Zahl MIT Pflichtkontext darf NICHT anschlagen.
// Alle Testdaten sind erfunden (keine echten Nummern, Namen, Adressen).

import { mkdtempSync, cpSync, readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { lint, ciAnnotation } from "../lint-site.mjs";
import { ORIGIN as O, HOST, STATE_STRICT } from "../lint-config.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

function fixture() {
  const base = mkdtempSync(join(tmpdir(), "lint-selftest-"));
  cpSync(join(ROOT, "site"), join(base, "site"), { recursive: true });
  mkdirSync(join(base, "src"), { recursive: true });
  cpSync(join(ROOT, "src", "legacy-urls.txt"), join(base, "src", "legacy-urls.txt"));
  // Zustand der Kopie = engster Zustand (wie in CI, wo die private src/state.json fehlt); der echte private
  // Zustand spielt fuer den Selbsttest keine Rolle.
  writeFileSync(join(base, "src", "state.json"), JSON.stringify(STATE_STRICT));
  const f = (p) => join(base, "site", p);
  return {
    base,
    // Zustand (src/state.json) gezielt verstellen: patch wird flach eingemischt.
    state(patch) {
      const sf = join(base, "src", "state.json");
      const st = JSON.parse(readFileSync(sf, "utf8"));
      for (const [k, v] of Object.entries(patch)) { const ks = k.split("."); let o = st; while (ks.length > 1) o = o[ks.shift()]; o[ks[0]] = v; }
      writeFileSync(sf, JSON.stringify(st));
    },
    read: (p) => readFileSync(f(p), "utf8"),
    write: (p, s) => { mkdirSync(dirname(f(p)), { recursive: true }); writeFileSync(f(p), s); },
    edit(p, from, to) {
      const s = readFileSync(f(p), "utf8");
      if (!s.includes(from)) throw new Error(`Selbsttest-Fixture: „${from.slice(0, 50)}“ nicht in ${p}`);
      writeFileSync(f(p), s.replace(from, to));
    },
  };
}
const inject = (fx, page, html) => fx.edit(page, "</main>", `${html}</main>`);
// Datei im (oeffentlichen) Linter-Code der Kopie anlegen; der Quellbaum-Scan prueft scripts/ wie das echte Repo.
const script = (fx, name, text) => { mkdirSync(join(fx.base, "scripts"), { recursive: true }); writeFileSync(join(fx.base, "scripts", name), text); };
// Text an die Quelle eines Fakts in der ausgelieferten facts.json haengen.
const factSource = (fx, key, more) => { const j = JSON.parse(fx.read("facts.json")); j.facts[key].source += more; fx.write("facts.json", JSON.stringify(j)); };
// Bindungen von Regeln mit privatem Wortlaut und eines privaten Kontextmusters. Alle Wortlaute sind erfunden:
// Ein echter Begriff hier waere selbst die Veroeffentlichung, die der Test verhindern soll.
const BIND_B = "[B] @B-b1 re:Musterkurs\\p{L}*";
const BIND_A = "[A] @A-vorbereitet re:Beispielprobe";
const BIND_A1 = "[A] @A-e1 re:Musterkalibrierung (?:ist )?bestanden";
const SLOT_A = "[A] @A-kontext re:Beispielprobe|Musterkalibrierung";

const CASES = [
  ["RES-external", (fx) => fx.edit("index.html", "</head>", '<link rel="stylesheet" href="https://fonts.example.org/css2?family=Inter">\n</head>')],
  ["SEC-inline-script", (fx) => inject(fx, "index.html", "<script>void 0</script>")],
  ["SEC-inline-style", (fx) => inject(fx, "index.html", '<p style="color:red">x</p>')],
  ["SEC-event-handler", (fx) => inject(fx, "index.html", '<p onclick="x()">x</p>')],
  ["SEC-embed", (fx) => inject(fx, "index.html", '<iframe title="t" src="/"></iframe>')],
  ["TXT-banned", (fx) => inject(fx, "index.html", "<p>Eine revolutionäre Lösung.</p>")],
  ["TXT-banned", (fx) => inject(fx, "en/hire/index.html", "<p>Open to part-time work.</p>")],
  ["TXT-revoked", (fx) => inject(fx, "index.html", "<p>Gemessen: <code>+17,8</code> Punkte.</p>")],
  ["TXT-revoked", (fx) => inject(fx, "index.html", "<p>Score <code>70,4 %</code>.</p>")],
  ["TXT-privacy", (fx) => inject(fx, "index.html", "<p>Telefon: +43 000 00 00 000</p>")],
  ["TXT-privacy", (fx) => inject(fx, "index.html", '<p><a href="https://wa.me/0000000">Chat</a></p>')],
  ["TXT-privacy", (fx) => inject(fx, "index.html", "<p>Musterstraße 12</p>")],
  ["TXT-privacy", (fx) => inject(fx, "index.html", "<p>muster@gmail.com</p>")],
  ["TXT-privacy", (fx) => inject(fx, "index.html", "<p>Ich bin 99 Jahre alt.</p>")],
  ["TXT-private", (fx) => inject(fx, "index.html", "<p>Früher bei Beispielfirma.</p>"), { privateTerms: ["Beispielfirma"] }],
  ["NUM-unsourced", (fx) => inject(fx, "index.html", "<p>Es gibt 42 Kunden.</p>")],
  ["NUM-fact-mismatch", (fx) => fx.edit("projekte/index.html", 'data-fact="soul_mcp.tests">373 von 373<', 'data-fact="soul_mcp.tests">374 von 374<')],
  ["NUM-fact-unknown", (fx) => inject(fx, "index.html", '<p><data value="1" data-fact="erfunden.zahl">1</data></p>')],
  ["FACTS-schema", (fx) => { const j = JSON.parse(fx.read("facts.json")); delete j.facts["soul_mcp.tests"].source; fx.write("facts.json", JSON.stringify(j)); }],
  ["RES-missing", (fx) => inject(fx, "index.html", '<p><img src="/assets/foto.jpg" alt="x"></p>')],
  ["LINK-broken", (fx) => inject(fx, "index.html", '<p><a href="/gibt-es-nicht/">x</a></p>')],
  ["LINK-broken", (fx) => inject(fx, "index.html", '<p><a href="/about.html">alt</a></p>')],
  ["LINK-anchor", (fx) => inject(fx, "index.html", '<p><a href="/projekte/#fehlt">x</a></p>')],
  ["HEAD-description", (fx) => fx.edit("kontakt/index.html", /<meta name="description" content="[^"]*">/.exec(fx.read("kontakt/index.html"))[0], "")],
  ["HEAD-canonical", (fx) => fx.edit("kontakt/index.html", `rel="canonical" href="${O}/kontakt/"`, `rel="canonical" href="${O}/kontakt"`)],
  ["HEAD-h1", (fx) => inject(fx, "kontakt/index.html", "<h1>Zweite Überschrift</h1>")],
  ["HEAD-lang", (fx) => fx.edit("kontakt/index.html", '<html lang="de"', '<html lang="xx"')],
  ["I18N-pair", (fx) => fx.edit("projekte/index.html", `<link rel="alternate" hreflang="en" href="${O}/en/projects/">`, "")],
  ["DOOR-crossing", (fx) => { fx.write("workshops/index.html", fx.read("kontakt/index.html").replace("</main>", '<p><a href="/en/hire/">x</a></p></main>')); }],
  ["REDIR-shadow", (fx) => fx.write("_redirects", fx.read("_redirects") + "\n/projekte/   /   301\n")],
  ["REDIR-target", (fx) => fx.write("_redirects", fx.read("_redirects").replace("# --- Personen", "/alt-x   /nirgends/   301\n# --- Personen"))],
  ["REDIR-code", (fx) => fx.write("_redirects", fx.read("_redirects").replace("# --- Personen", "/alt-y   /   410\n# --- Personen"))],
  ["LEGACY-uncovered", (fx) => fx.write("_redirects", fx.read("_redirects").replace(/^\/blog.*$/gm, ""))],
  ["LEGACY-404-redirected", (fx) => fx.write("_redirects", fx.read("_redirects") + "\n/showcase/*   /archiv/   301\n")],
  ["HDR-csp-unsafe", (fx) => fx.write("_headers", fx.read("_headers").replace("script-src 'none'", "script-src 'self' 'unsafe-inline'"))],
  ["HDR-frame-ancestors", (fx) => fx.write("_headers", fx.read("_headers").replace("frame-ancestors 'none'; ", ""))],
  ["HDR-hsts-preload", (fx) => fx.write("_headers", fx.read("_headers").replace("max-age=31536000", "max-age=31536000; includeSubDomains; preload"))],
  ["A11Y-contrast", (fx) => fx.write("assets/site.css", fx.read("assets/site.css").replace("--text-subtle: #575b63;", "--text-subtle: #b0b0b0;"))],
  ["SITEMAP-noindex", (fx) => fx.write("sitemap.xml", fx.read("sitemap.xml").replace("</urlset>", `  <url><loc>${O}/archiv/</loc></url>\n</urlset>`))],
  ["STRUCT-forbidden-file", (fx) => fx.write("notizen.md", "intern")],
  ["STRUCT-required", (fx) => rmSync(join(fx.base, "site", "robots.txt"))],
  ["TODO-open", (fx) => {}, { release: true }],
  // Abmelde-Worker (Nachbesserung 1)
  ["SW-killswitch", (fx) => fx.write("sw.js", fx.read("sw.js") + '\nself.addEventListener("fetch", (e) => e.respondWith(fetch(e.request)));\n')],
  ["SW-killswitch", (fx) => { for (const f of ["sw.js", "prep/sw.js"]) fx.write(f, fx.read(f).replace("self.registration.unregister()", "Promise.resolve()")); }, { expect: /unregister\(\) fehlt/ }],
  ["SW-killswitch", (fx) => fx.write("prep/sw.js", fx.read("prep/sw.js") + "\n// geaendert\n"), { expect: /weicht von sw\.js ab/ }],
  ["SW-killswitch", (fx) => fx.write("sw.js", fx.read("sw.js").replace("self.skipWaiting();", "self.skipWaiting(;"))],
  ["SW-headers", (fx) => fx.edit("_headers", "/prep/sw.js\n  Cache-Control: no-cache\n  Content-Type: text/javascript; charset=utf-8", "/prep/sw.js\n  Cache-Control: no-cache")],
  ["SW-headers", (fx) => fx.write("_headers", fx.read("_headers") + "\n/sw.js\n  Content-Security-Policy: sandbox\n")],
  ["STRUCT-required", (fx) => rmSync(join(fx.base, "site", "prep", "sw.js"))],
  ["STRUCT-script-file", (fx) => fx.write("assets/app.js", "void 0;")],
  ["REDIR-shadow", (fx) => fx.write("_redirects", fx.read("_redirects") + "\n/prep/*   /   301\n")],
  ["SEC-sw-register", (fx) => inject(fx, "index.html", "<p>navigator.serviceWorker.register('/sw.js')</p>")],
  // Interne Notizen / Platzhalter (Nachbesserung 11, Audit T14)
  ["NOTE-visible", (fx) => inject(fx, "impressum/index.html", "<p>Chriso bestätigt die Namensform.</p>"), { expect: /„Chriso“/ }],
  ["NOTE-visible", (fx) => inject(fx, "index.html", '<p><mark class="todo" data-todo="">Link fehlt</mark></p>'), { expect: /OFFEN-Marke/ }],
  ["NOTE-visible", (fx) => inject(fx, "index.html", "<p>Stand: {{Datum}}</p>"), { expect: /„\{\{…\}\}“/ }],
  ["NOTE-visible", (fx) => inject(fx, "index.html", '<p title="TODO: Text kürzen">x</p>'), { expect: /TODO/ }],
  ["PLACEHOLDER-open", (fx) => inject(fx, "arbeitgeber/index.html", "<p>Verfügbar ab [Datum].</p>"), { release: true }],
  ["TXT-private", (fx) => inject(fx, "index.html", "<!--OFFEN: früher bei Beispielfirma-->"), { privateTerms: ["Beispielfirma"], expect: /Nr\. 1/ }],
  ["TXT-revoked", (fx) => inject(fx, "index.html", "<!--OFFEN: alter Wert 70,4 %-->")],
  ["HTML-structure", (fx) => inject(fx, "en/privacy/index.html", "<!--OFFEN: x--> Text</p>")],
  // Neutrale Kennungen (R-03): nur <!--OFFEN:F-nn--> und email_off im ausgelieferten HTML; Inhalt nie in der Meldung
  ["NOTE-comment", (fx) => inject(fx, "arbeitgeber/index.html", "<!--OFFEN: Verfügbar ab Beispieldatum-->"), { expect: /^(?!.*Beispiel).*Klartext \(\d+ Zeichen/ }],
  ["NOTE-comment", (fx) => inject(fx, "index.html", "<!-- Notiz für später -->"), { expect: /Inhalt nicht ausgegeben/ }],
  ["NOTE-comment", (fx) => inject(fx, "impressum/index.html", "<!--intern:F-01-->"), { expect: /nur <!--OFFEN:F-nn-->/ }],
  ["NOTE-comment", (fx) => inject(fx, "kontakt/index.html", "<!--OFFEN:F-1-->")],
  // R-04: mailto nur in <!--email_off-->…<!--/email_off-->
  ["SEC-email-off", (fx) => inject(fx, "kontakt/index.html", '<p><a href="mailto:x@example.org">x@example.org</a></p>'), { expect: /ohne <!--email_off-->-Klammer/ }],
  ["SEC-email-off", (fx) => inject(fx, "kontakt/index.html", '<p><!--email_off--><a href="mailto:x@example.org">x</a></p>'), { expect: /doppelt geöffnet/ }],
  ["SEC-email-off", (fx) => fx.edit("kontakt/index.html", "</body>", "<!--email_off--></body>"), { expect: /nicht geschlossen/ }],
  ["SEC-email-off", (fx) => fx.edit("datenschutz/index.html", '<!--email_off--><a href="mailto:dsb@dsb.gv.at">', '<a href="mailto:dsb@dsb.gv.at">'), { expect: /\/email_off--> ohne öffnendes/ }],
  ["NOTE-comment", (fx) => writeFileSync(join(fx.base, "README.md"), "# x\n<!-- OFFEN: nur wahr, wenn Beispiel -->\n"), { where: /^README\.md$/ }],
  ["TODO-open", (fx) => writeFileSync(join(fx.base, "README.md"), "# x\n<!--OFFEN:F-98-->\n"), { release: true, where: /^README\.md$/ }],
  // Audit T1–T18 der Website-Session (Nachbesserung 2): je neue Regel ein Gegenbeispiel
  ["I18N-absolute", (fx) => fx.edit("projekte/index.html", `<link rel="alternate" hreflang="en" href="${O}/en/projects/">`, '<link rel="alternate" hreflang="en" href="/en/projects/">')],
  ["SITEMAP-hreflang", (fx) => fx.edit("sitemap.xml", `<loc>${O}/projekte/</loc>`, `<loc>${O}/projekte/</loc>\n    <xhtml:link rel="alternate" hreflang="fr" href="${O}/fr/"/>`)],
  // R4 a13: Basis-URL steht nur in src/site.json; CNAME muss zum Host passen
  ["SRC-origin", (fx) => { mkdirSync(join(fx.base, "src", "pages"), { recursive: true }); writeFileSync(join(fx.base, "src", "pages", "probe.html"), `<p><a href="${O}/projekte/">x</a></p>`); }, { where: /^src\/pages\/probe\.html$/ }],
  ["SRC-origin", (fx) => { mkdirSync(join(fx.base, "scripts"), { recursive: true }); writeFileSync(join(fx.base, "scripts", "probe.mjs"), `const u = "//${HOST}/x";\n`); }, { where: /^scripts\/probe\.mjs$/ }],
  ["CNAME-host", (fx) => writeFileSync(join(fx.base, "CNAME"), "example.org\n"), { where: /^CNAME$/ }],
  ["I18N-switch", (fx) => fx.edit("kontakt/index.html", '<p class="lang-switch"><a href="/en/contact/"', '<p class="lang-switch"><a href="/en/"')],
  ["HEAD-heading-order", (fx) => inject(fx, "kontakt/index.html", "<h4>Zu tief</h4>")],
  ["STRUCT-unexpected-file", (fx) => fx.write("assets/lebenslauf.pdf", "%PDF-1.4")],
  ["LINK-target", (fx) => inject(fx, "index.html", '<p><a href="/projekte/" target="_blank">x</a></p>')],
  ["REDIR-syntax", (fx) => fx.write("_redirects", fx.read("_redirects").replace("# --- Personen", "/alt-z   /\n# --- Personen")), { expect: /Statuscode fehlt/ }],
  ["REDIR-syntax", (fx) => fx.write("_redirects", fx.read("_redirects") + "\n/a/*/b/*   /   301\n"), { expect: /Splat/ }],
  ["REDIR-code", (fx) => fx.write("_redirects", fx.read("_redirects").replace("# --- Personen", "/alt-q   /   302\n# --- Personen")), { expect: /302/ }],
  ["REDIR-limits", (fx) => fx.write("_redirects", fx.read("_redirects").replace("# --- Personen", `/${"a".repeat(1001)}   /   301\n# --- Personen`)), { expect: /1\.000/ }],
  ["REDIR-unreachable", (fx) => fx.write("_redirects", fx.read("_redirects") + "\n/blog/alt-artikel   /archiv/   301\n")],
  ["SITEMAP-format", (fx) => fx.write("sitemap.xml", fx.read("sitemap.xml").replace("</urlset>", ""))],
  ["STRUCT-font-license", (fx) => rmSync(join(fx.base, "site", "assets", "fonts", "Inter-OFL.txt"))],
  ["HEAD-noindex", (fx) => fx.edit("404.html", '<meta name="robots" content="noindex,follow">', '<meta name="robots" content="index,follow">'), { expect: /Fehlerseite/ }],
  ["HEAD-noindex", (fx) => fx.edit("kontakt/index.html", '<meta name="robots" content="index,follow">', '<meta name="robots" content="noindex,follow">'), { expect: /NOINDEX_ALLOWED/ }],
  ["HEAD-stand", (fx) => { const h = fx.read("kontakt/index.html"); fx.write("kontakt/index.html", h.replace(/<p>Stand: <time datetime="[^"]*">[^<]*<\/time><\/p>/, "")); }, { expect: /fehlt/ }],
  ["HEAD-stand", (fx) => { const h = fx.read("kontakt/index.html"); fx.write("kontakt/index.html", h.replace(/(<p>Stand: <time datetime=")[^"]*/, "$12026-02-30")); }, { expect: /gibt es nicht/ }],
  ["STAGE1-commercial", (fx) => inject(fx, "ueber-mich/index.html", "<p>Workshops ab sofort buchbar.</p>")],
  ["STAGE1-commercial", (fx) => inject(fx, "en/about/index.html", "<p>Day rate on request.</p>")],
  ["STAGE1-commercial", (fx) => fx.write("workshops/index.html", fx.read("kontakt/index.html")), { expect: /Workshop-Seite/ }],
  // Stufe 1 auch dort, wo Suchtreffer und Link-Vorschauen den Text zeigen (Gegenpruefung 2026-10-08)
  ["STAGE1-commercial", (fx) => fx.write("ueber-mich/index.html", fx.read("ueber-mich/index.html").replace(/(<meta name="description" content="[^"]*)"/, "$1 Workshops für Teams buchen.\"")), { where: /\[meta description\]/ }],
  ["STAGE1-commercial", (fx) => fx.write("ueber-mich/index.html", fx.read("ueber-mich/index.html").replace(/(<meta property="og:title" content=")/, "$1Workshops buchen — ")), { where: /\[meta og:title\]/ }],
  ["STAGE1-commercial", (fx) => fx.write("en/about/index.html", fx.read("en/about/index.html").replace(/(<meta property="og:description" content=")/, "$1Book a workshop. ")), { where: /\[meta og:description\]/ }],
  ["STAGE1-commercial", (fx) => inject(fx, "ueber-mich/index.html", '<p><a href="/kontakt/" aria-label="Workshops buchen">Kontakt</a></p>'), { where: /\[aria-label\]/ }],
  // R-06 (Rechtsabnahme Welle E): erweiterter Ausdruck faengt Angebotsverben und "hire me"
  ["STAGE1-commercial", (fx) => inject(fx, "ueber-mich/index.html", "<p>Ich biete Beratung für Teams an.</p>"), { expect: /„biete“/ }],
  ["STAGE1-commercial", (fx) => inject(fx, "en/about/index.html", "<p>Hire me for your next project.</p>"), { expect: /„Hire me“/ }],
  // Barrierefreiheit (Welle F2, BF-03): aktuelle Seite vs. aktueller Bereich
  ["A11Y-current", (fx) => fx.edit("behaviorlock/index.html", 'href="/en/projects/" aria-current="true"', 'href="/en/projects/" aria-current="page"')],
  // Sprache von Teilen (BF-04): Umlaut im englischen Teil, Ersatzschreibung im deutschen Teil = Fehler in jedem Modus
  ["A11Y-lang-parts", (fx) => inject(fx, "en/about/index.html", "<p>Schöne Grüße.</p>"), { expect: /ohne lang="de"/ }],
  ["A11Y-lang-parts", (fx) => inject(fx, "ueber-mich/index.html", "<p>Die Datenschutzerklaerung gilt.</p>"), { expect: /Ersatzschreibung „Datenschutzerklaerung“/ }],
  ["A11Y-lang-parts", (fx) => inject(fx, "en/about/index.html", '<p lang="en-GB">Siehe <span lang="de">Übersicht</span>, then <em>für</em>.</p>'), { expect: /„für“/ }],
  ["SD-forbidden", (fx) => fx.edit("index.html", "</head>", '<script type="application/ld+json">{"@context":"https://schema.org","@type":"Person","name":"x","address":{"@type":"PostalAddress"}}</script>\n</head>')],
  ["SD-forbidden", (fx) => inject(fx, "index.html", '<div itemscope itemtype="https://schema.org/Offer"><span itemprop="price">1</span></div>')],
  ["SD-forbidden", (fx) => fx.edit("index.html", "</head>", '<meta property="business:contact_data:street_address" content="x">\n</head>')],
  // Recht und Fakten (Nachbesserung 7/10/12, Pruefbericht 9)
  ["FACTS-internal", (fx) => { const j = JSON.parse(fx.read("facts.json")); j.facts["soul_mcp.tests"].source = "Positionierung §3.1 Nr. 1"; fx.write("facts.json", JSON.stringify(j)); }, { expect: /Positionierung/ }],
  ["FACTS-internal", (fx) => { const j = JSON.parse(fx.read("facts.json")); j.facts["soul_mcp.tests"].offen = "am Merge-Tag angleichen"; fx.write("facts.json", JSON.stringify(j)); }, { expect: /„offen“/ }],
  ["TXT-privacy", (fx) => inject(fx, "kontakt/index.html", "<p>Barichgasse 40–42, 1030 Wien</p>"), { expect: /strasse/ }],
  ["NUM-unsourced", (fx) => inject(fx, "datenschutz/index.html", "<p>Seite 165(3) im Handbuch.</p>")],
  ["NUM-unsourced", (fx) => inject(fx, "impressum/index.html", "<p>Lizenz in Version 4.0.</p>")],
  // Sperrliste v2 (Positionierung v2 §13 A–F): je Gruppe ein Fall, der rot werden MUSS. Bedingte Regeln
  // werden mit einem absichtlich falschen Zustand ausgeloest (Gegenstueck gruen: Kontrolle 9).
  // Gruppe A: Name und Begriffe des Vorhabens nur ueber private Bindungen (Plan F2 Punkt 7)
  ["SPERR-A", (fx) => inject(fx, "projekte/index.html", "<p>Beispielprobe: der Messplan folgt.</p>"), { privateTerms: [BIND_A], expect: /^(?!.*Beispielprobe).*A-vorbereitet.*maskiert/ }],
  ["SPERR-A", (fx) => { fx.state({ zA: "a1" }); inject(fx, "en/hire/index.html", "<p>Musterkalibrierung bestanden.</p>"); }, { privateTerms: [BIND_A1], expect: /A-e1/ }],
  ["SPERR-A", (fx) => { fx.state({ zA: "a1" }); inject(fx, "projekte/index.html", "<p>Die Beispielprobe ist eine unabhängige Messung.</p>"); }, { privateTerms: [SLOT_A], expect: /A-unabhaengig/ }],
  ["DOOR-crossing", (fx) => { fx.write("workshops/index.html", fx.read("kontakt/index.html")); fx.write("beispielprobe/index.html", fx.read("kontakt/index.html").replace("</main>", '<p><a href="/workshops/">x</a></p></main>')); }, { privateTerms: [BIND_A], expect: /Seite des Vorhabens/ }],
  ["TXT-private", (fx) => script(fx, "regel.mjs", "// Beispielprobe\n"), { privateTerms: [BIND_A], where: /^scripts\/regel\.mjs$/, expect: /Bindung A-vorbereitet/ }],
  ["TXT-private", (fx) => writeFileSync(join(fx.base, "README.md"), "# x\nMusterkalibrierung\n"), { privateTerms: [SLOT_A], where: /^README\.md$/, expect: /Bindung A-kontext/ }],
  ["PRIV-rule-missing", () => {}, { privateTerms: ["Beispielfirma"], release: true, expect: /Regel A-ergebnis/ }],
  ["PRIV-list-invalid", () => {}, { privateTerms: ["[B] @A-kontext re:x"], expect: /Gruppe passt nicht/ }],
  ["SPERR-A", (fx) => inject(fx, "projekte/index.html", "<p>Getestet: <code>2.1.40</code>.</p>"), { expect: /A-version/ }],
  ["SPERR-B", (fx) => inject(fx, "en/about/index.html", "<p>I receive no money, credits or early access from Anthropic.</p>"), { expect: /B-keine-verbindung/ }],
  ["SPERR-B", (fx) => inject(fx, "ueber-mich/index.html", "<p>Davon unabhängig schreibe ich Werkzeuge.</p>"), { expect: /B-davon-unabhaengig/ }],
  ["SPERR-C", (fx) => inject(fx, "en/about/index.html", "<p>I also give talks on agent tooling.</p>"), { expect: /C-vortraege/ }],
  ["SPERR-C", (fx) => inject(fx, "ueber-mich/index.html", "<p>Der Kurs ist update-sicher.</p>"), { expect: /C-haltbarkeit/ }],
  ["SPERR-C", (fx) => inject(fx, "ueber-mich/index.html", "<p>Reviews zwischen den Terminen.</p>"), { expect: /C-kundenrepo/ }],
  ["SPERR-D", (fx) => inject(fx, "en/hire/index.html", "<p>Vienna or EU-remote, full-time.</p>"), { expect: /D-vollzeit/ }],
  ["SPERR-D", (fx) => inject(fx, "en/about/index.html", "<p>Available up to twenty hours a week.</p>"), { expect: /D-wochenstunden/ }],
  ["SPERR-D", (fx) => { fx.state({ zD2: "B" }); inject(fx, "en/hire/index.html", "<p>Looking for a role focused on agent reliability.</p>"); }, { expect: /D-rolle-b/ }],
  ["SPERR-D", (fx) => inject(fx, "arbeitgeber/index.html", "<p>Eintritt: nach Vereinbarung.</p>"), { expect: /D-verfuegbar-ab/ }],
  ["SPERR-E", (fx) => inject(fx, "en/about/index.html", "<p>My setup is private for now.</p>"), { expect: /E-phrasen/ }],
  ["SPERR-E", (fx) => inject(fx, "ueber-mich/index.html", '<h2 id="korrekturen">Korrekturen</h2>'), { expect: /Korrekturliste/ }],
  ["SPERR-F", (fx) => inject(fx, "projekte/index.html", "<p>Vorlage: claude-code-team-kit.</p>"), { expect: /F-kit-name/ }],
  ["SPERR-F", (fx) => inject(fx, "projekte/index.html", '<p><a href="https://github.com/beispiel/nextool/commit/abc1234">Commit</a></p>'), { expect: /privat wird/ }],
  ["SPERR-F", (fx) => inject(fx, "index.html", "<p>Für Teams: team-skills-kit, eine offene Vorlage.</p>"), { expect: /F-kit-start/ }],
  ["SPERR-F", (fx) => writeFileSync(join(fx.base, "src", "og-stamp.json"), JSON.stringify({ de: { kernsatz: "Gebaut in 3 Monaten.", ort: "Wien" } })), { where: /^src\/og-stamp\.json$/ }],
  // Zustand fail-closed (§3.2, §7): vorhandene, aber ungueltige Datei = Fehler (nicht lesbar, unbekannter Wert,
  // Tippfehler, Stufe passt nicht, a4 ohne Fakten). Fehlende Datei = engster Zustand: Kontrolle 14.
  ["STATE-invalid", (fx) => writeFileSync(join(fx.base, "src", "state.json"), "{ kaputt"), { expect: /nicht lesbar/ }],
  ["STATE-invalid", (fx) => fx.state({ zD1: "vielleicht" }), { expect: /zD1 = "vielleicht"/ }],
  ["STATE-invalid", (fx) => fx.state({ zD1x: "a" }), { expect: /Tippfehler/ }],
  ["STATE-invalid", (fx) => fx.state({ zF1: "ja" }), { expect: /zF1/ }],
  ["STATE-invalid", (fx) => fx.state({ zC1: "R1" }), { expect: /STAGE/ }],
  ["STATE-invalid", (fx) => fx.state({ zA: "a4" }), { expect: /zA\.doi/ }],
  ["STATE-invalid", (fx) => { const sf = join(fx.base, "src", "state.json"); const st = JSON.parse(readFileSync(sf, "utf8")); delete st.zB1; writeFileSync(sf, JSON.stringify(st)); }, { expect: /zB1 fehlt/ }],
  ["STATE-leak", (fx) => { const j = JSON.parse(fx.read("facts.json")); j.zD1 = "offen"; fx.write("facts.json", JSON.stringify(j)); }, { where: /^facts\.json$/ }],
  // Private Liste: Ausdruck, Gruppe, ungueltiger Ausdruck, ausgelieferte Textdatei, oeffentlicher Quellbaum
  ["TXT-private", (fx) => inject(fx, "index.html", "<p>Früher im Beispielhandel.</p>"), { privateTerms: ["re:beispiel\\p{L}*"], expect: /Nr\. 1 \(Gruppe G\)/ }],
  ["TXT-private", (fx) => inject(fx, "index.html", "<p>Ein Musterwort.</p>"), { privateTerms: ["# Kopf", "[D] Musterwort"], expect: /Gruppe D/ }],
  ["PRIV-list-invalid", (fx) => {}, { privateTerms: ["re:(offen"], expect: /^Eintrag Nr\. 1 ist kein gültiger Ausdruck$/ }],
  ["TXT-private", (fx) => fx.write("robots.txt", fx.read("robots.txt") + "# Beispielfirma\n"), { privateTerms: ["Beispielfirma"], where: /^robots\.txt$/ }],
  ["TXT-private", (fx) => writeFileSync(join(fx.base, "src", "notiz.md"), "früher bei Beispielfirma\n"), { privateTerms: ["Beispielfirma"], where: /^src\/notiz\.md$/ }],
  // Wortlaut nur privat (Befunde T-02/P-01): Preise, Foerderung u. a. kennt nur die private Liste. Testwerte erfunden —
  // ein echter Preis hier waere selbst die Veroeffentlichung, die der Test verhindern soll.
  ["TXT-private", (fx) => inject(fx, "ueber-mich/index.html", "<p>Pilotpreis 999 EUR.</p>"), { privateTerms: ["[C] re:(?<![\\p{N}])999(?![\\p{N}])"], expect: /Nr\. 1 \(Gruppe C\)/ }],
  ["TXT-private", (fx) => script(fx, "regel.mjs", "export const R = /\\b999\\b/;\n"), { privateTerms: ["[C] re:(?<![\\p{N}#.,])(?<!(?<!\\\\)\\p{L})999(?![\\p{N}])"], where: /^scripts\/regel\.mjs$/ }],
  ["SPERR-B", (fx) => inject(fx, "ueber-mich/index.html", "<p>Ich gebe Musterkurse.</p>"), { privateTerms: [BIND_B], expect: /^(?!.*Musterkurs).*B-b1.*maskiert/ }],
  ["TXT-private", (fx) => script(fx, "regel.mjs", "// Musterkurse\n"), { privateTerms: [BIND_B], where: /^scripts\/regel\.mjs$/, expect: /Bindung B-b1/ }],
  ["PRIV-rule-missing", () => {}, { privateTerms: ["Beispielfirma"], release: true, expect: /B-b1/ }],
  ["PRIV-list-invalid", () => {}, { privateTerms: ["[B] @B-gibtsnicht re:x"], expect: /^Eintrag Nr\. 1 bindet keine Regel/ }],
  ["PRIV-list-invalid", () => {}, { privateTerms: ["[C] @B-b1 re:x"], expect: /Gruppe passt nicht/ }],
  // Sperrliste v2 in ausgelieferten Textdateien (Befund P-04): facts.json je Textwert (Fundort mit Pfad), robots.txt, _redirects
  ["SPERR-F", (fx) => factSource(fx, "corrections.claimed", " Der Rückbau ist in git sichtbar; präregistriert."), { expect: /F-git-sichtbar/, where: /^facts\.json \[facts\.corrections\.claimed\.source\]$/ }],
  ["SPERR-A", (fx) => factSource(fx, "corrections.claimed", " Der Rückbau ist in git sichtbar; präregistriert."), { expect: /A-prereg-status/, where: /^facts\.json/ }],
  ["SPERR-F", (fx) => factSource(fx, "corrections.claimed", " Der Rückbau steht in der git-Historie."), { expect: /F-git-sichtbar/, where: /^facts\.json/ }],
  ["SPERR-F", (fx) => fx.write("robots.txt", fx.read("robots.txt") + "# the rollback is visible in git\n"), { expect: /F-git-sichtbar/, where: /^robots\.txt$/ }],
  ["SPERR-C", (fx) => fx.write("_redirects", fx.read("_redirects") + "# /services -> /workshops/\n"), { expect: /C-workshop/, where: /^_redirects$/ }],
];

let failed = 0;
const errorsOf = (findings) => findings.filter((f) => f.level === "error");

// Kontrolle 1: unveraenderte Kopie
{
  const fx = fixture();
  const e = errorsOf(lint({ siteDir: join(fx.base, "site"), rootDir: fx.base, gitCheck: false, privateTerms: [] }));
  if (e.length) { failed++; console.log(`  FEHLER Kontrolle: saubere Kopie hat ${e.length} Fehler (${e[0].rule}: ${e[0].msg})`); }
  else console.log("  ok    Kontrolle: saubere Kopie ohne Fehler");
  rmSync(fx.base, { recursive: true, force: true });
}
// Kontrolle 3: "your team" ist kein "our team" (Wortgrenze), "our team" schlaegt an
{
  const fx = fixture();
  inject(fx, "en/contact/index.html", "<p>Your team decides.</p>");
  const ok = errorsOf(lint({ siteDir: join(fx.base, "site"), rootDir: fx.base, gitCheck: false, privateTerms: [] }));
  inject(fx, "en/contact/index.html", "<p>Our team decides.</p>");
  const bad = errorsOf(lint({ siteDir: join(fx.base, "site"), rootDir: fx.base, gitCheck: false, privateTerms: [] }));
  if (ok.length) { failed++; console.log(`  FEHLER Kontrolle: „Your team“ wurde abgelehnt (${ok[0].rule}: ${ok[0].msg})`); }
  else if (!bad.some((e) => e.rule === "TXT-banned")) { failed++; console.log("  FEHLER Kontrolle: „Our team“ wurde NICHT abgelehnt"); }
  else console.log("  ok    Kontrolle: „Your team“ erlaubt, „Our team“ abgelehnt");
  rmSync(fx.base, { recursive: true, force: true });
}
// Kontrolle 2: widerrufene Zahl mit Pflichtkontext ist erlaubt
{
  const fx = fixture();
  inject(fx, "fallstudie/index.html", '<p>Zurückgenommen: <data value="+17.8" data-fact="case.registered">+17,8 Prozentpunkte</data>.</p>');
  const e = errorsOf(lint({ siteDir: join(fx.base, "site"), rootDir: fx.base, gitCheck: false, privateTerms: [] }));
  if (e.length) { failed++; console.log(`  FEHLER Kontrolle: Zahl mit Kontext wurde abgelehnt (${e[0].rule}: ${e[0].msg})`); }
  else console.log("  ok    Kontrolle: +17,8 mit „zurückgenommen“ wird durchgelassen");
  rmSync(fx.base, { recursive: true, force: true });
}

// Kontrolle 4: erlaubte Klammern — Auslassung „[…]“ im Zitat, <url> und {{ }} in Code — auch im Release-Modus
{
  const fx = fixture();
  inject(fx, "en/case-study/index.html", "<p>He wrote: “[…] it held”.</p><p><code>git clone &lt;url&gt;</code> <code>${{ secrets.X }}</code></p>");
  const f = lint({ siteDir: join(fx.base, "site"), rootDir: fx.base, gitCheck: false, privateTerms: [], release: true }).filter((x) => x.rule === "PLACEHOLDER-open" || x.rule === "NOTE-visible");
  if (f.length) { failed++; console.log(`  FEHLER Kontrolle: erlaubte Klammern abgelehnt (${f[0].rule}: ${f[0].msg})`); }
  else console.log("  ok    Kontrolle: „[…]“, <url> und {{ }} in Code bleiben erlaubt");
  rmSync(fx.base, { recursive: true, force: true });
}

// Kontrolle 5: freigegebene Anschriften und Rechtsverweise gehen auf den Rechtsseiten durch (und stehen dort wirklich)
{
  const fx = fixture();
  const need = [["datenschutz/index.html", "Barichgasse 40–42, 1030 Wien"], ["en/privacy/index.html", "Barichgasse 40–42, 1030 Vienna"], ["datenschutz/index.html", "101 Townsend St, San Francisco, CA 94107"], ["en/privacy/index.html", "Section 165(3)"]];
  const missing = need.filter(([p, s]) => !fx.read(p).includes(s));
  const e = errorsOf(lint({ siteDir: join(fx.base, "site"), rootDir: fx.base, gitCheck: false, privateTerms: [] })).filter((x) => /privacy|NUM-unsourced/.test(x.rule));
  if (missing.length) { failed++; console.log(`  FEHLER Kontrolle: „${missing[0][1]}“ fehlt auf ${missing[0][0]} — Test prüft nichts`); }
  else if (e.length) { failed++; console.log(`  FEHLER Kontrolle: freigegebene Anschrift abgelehnt (${e[0].rule}: ${e[0].msg})`); }
  else console.log("  ok    Kontrolle: DSB- und Cloudflare-Anschrift, Section 165(3) auf den Rechtsseiten erlaubt");
  rmSync(fx.base, { recursive: true, force: true });
}

// Kontrolle 7 (R-06): Distanzierung ist kein Angebot — "not sponsored by Anthropic" bleibt erlaubt
{
  const fx = fixture();
  inject(fx, "en/about/index.html", "<p>This site is not sponsored by Anthropic.</p>");
  const e = errorsOf(lint({ siteDir: join(fx.base, "site"), rootDir: fx.base, gitCheck: false, privateTerms: [] }));
  if (e.length) { failed++; console.log(`  FEHLER Kontrolle: „not sponsored by Anthropic“ abgelehnt (${e[0].rule}: ${e[0].msg})`); }
  else console.log("  ok    Kontrolle: „not sponsored by Anthropic“ wird durchgelassen (R-06)");
  rmSync(fx.base, { recursive: true, force: true });
}

// Kontrolle 8 (Sperrliste v2): erlaubte Gegenstuecke je Gruppe A–F bleiben gruen (heutiger Zustand)
{
  const fx = fixture();
  inject(fx, "fallstudie/index.html", "<p>Der Versuch war als Ganzes nicht präregistriert.</p>"); // A: verneint
  inject(fx, "ueber-mich/index.html", "<p>Getrennt davon schreibe ich Werkzeuge.</p>"); // B
  inject(fx, "ueber-mich/index.html", "<p>Rückmeldung zu Übungen gebe ich als schriftlichen Kommentar; umsetzen und freigeben tut das Team.</p>"); // C (§5.5)
  inject(fx, "en/hire/index.html", "<p>I work full-time outside IT.</p>"); // D: heutige Stelle, keine Verfuegbarkeit
  inject(fx, "archiv/index.html", "<p>Kaufstrecken ohne Produkt sind archiviert.</p>"); // E: erlaubte Nachbarform von „Shops ohne Ware“
  inject(fx, "projekte/index.html", "<p>team-skills-kit ist in Vorbereitung.</p>"); // F: nicht auf der Startseite
  const e = errorsOf(lint({ siteDir: join(fx.base, "site"), rootDir: fx.base, gitCheck: false, privateTerms: [] }));
  if (e.length) { failed++; console.log(`  FEHLER Kontrolle: erlaubte Gegenstücke A–F abgelehnt (${e[0].rule}: ${e[0].msg})`); }
  else console.log("  ok    Kontrolle: erlaubte Gegenstücke A–F (verneint, „getrennt davon“, §5.5, heutige Stelle, Archiv, Projekte) bleiben grün");
  rmSync(fx.base, { recursive: true, force: true });
}

// Kontrolle 9 (Sperrliste v2): bedingte Regeln — derselbe Text ist im passenden Zustand erlaubt.
// Gegenstueck zu den roten SPERR-Faellen oben (dort derselbe Text mit dem heutigen bzw. falschen Zustand).
{
  const pairs = [
    ["A-e1", { zA: "a2" }, "en/hire/index.html", "<p>Musterkalibrierung bestanden.</p>", [BIND_A1]],
    ["B-keine-verbindung", { zB2: "nein" }, "en/about/index.html", "<p>I receive no money, credits or early access from Anthropic.</p>"],
    ["C-vortraege", { zC4: [{ ort: "Beispielort", datum: "2026-11-01" }] }, "en/about/index.html", "<p>I also give talks on agent tooling.</p>"],
    ["D-vollzeit", { zD1: "a" }, "en/hire/index.html", "<p>Vienna or EU-remote, full-time.</p>"],
    ["D-teilzeit", { zD1: "b" }, "en/hire/index.html", "<p>Open to part-time work.</p>"],
    ["F-kit-start", { zF1: true }, "index.html", "<p>Für Teams: team-skills-kit, eine offene Vorlage.</p>"],
  ];
  const bad = [];
  for (const [id, patch, page, html, privateTerms = []] of pairs) {
    const fx = fixture();
    fx.state(patch);
    inject(fx, page, html);
    const e = errorsOf(lint({ siteDir: join(fx.base, "site"), rootDir: fx.base, gitCheck: false, privateTerms }));
    if (e.length) bad.push(`${id}: ${e[0].rule} ${e[0].msg}`);
    rmSync(fx.base, { recursive: true, force: true });
  }
  if (bad.length) { failed++; console.log(`  FEHLER Kontrolle: bedingte Regel trotz passendem Zustand rot (${bad[0]})`); }
  else console.log(`  ok    Kontrolle: ${pairs.length} bedingte Regeln im passenden Zustand grün (Gegenstück zu den roten Fällen)`);
}

// Kontrolle 10 (Sperrliste v2, Dokument-Scan): scripts/sperrliste-scan.mjs zaehlt je Gruppe, gibt keinen
// Fundstellen-Text aus, Exit 1 bei Treffer, Exit 0 bei sauberem Text. Private Liste per Umgebung (Testbegriff).
{
  const dir = mkdtempSync(join(tmpdir(), "scan-selftest-"));
  writeFileSync(join(dir, "rot.md"), "# Profil\nCoaching für Teams.\nFrüher bei Beispielfirma.\nMy setup is private for now.\n");
  writeFileSync(join(dir, "gruen.md"), "# Profil\nIch baue mit Agenten und prüfe, was sie liefern.\n");
  const run = (f) => { try { return { code: 0, out: execFileSync(process.execPath, [join(ROOT, "scripts", "sperrliste-scan.mjs"), "--ids", join(dir, f)], { encoding: "utf8", env: { ...process.env, SITE_PRIVATE_DENYLIST: "Beispielfirma" } }) }; } catch (e) { return { code: e.status, out: String(e.stdout) }; } };
  const rot = run("rot.md"), gruen = run("gruen.md");
  const row = /rot\.md\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/.exec(rot.out);
  const [a, b, c, d, e, f, g] = row ? row.slice(1).map(Number) : [];
  if (rot.code !== 1 || !row || c !== 1 || e !== 1 || g !== 1 || a + b + d + f !== 0) { failed++; console.log(`  FEHLER Kontrolle: Dokument-Scan zählt falsch (Exit ${rot.code}, Zeile ${row ? row.slice(1).join("/") : "fehlt"})`); }
  else if (/Beispielfirma/.test(rot.out)) { failed++; console.log("  FEHLER Kontrolle: Dokument-Scan gibt privaten Begriff im Klartext aus"); }
  else if (gruen.code !== 0) { failed++; console.log(`  FEHLER Kontrolle: Dokument-Scan rot bei sauberem Text (Exit ${gruen.code})`); }
  else console.log("  ok    Kontrolle: Dokument-Scan rot (C 1, E 1, G 1, Exit 1, ohne Klartext) / grün (Exit 0)");
  rmSync(dir, { recursive: true, force: true });
}

// Kontrolle 11 (T-02/P-01): Eine gebundene Regel behaelt Verneinung und Zustandsbedingung der oeffentlichen
// Regel; ohne private Liste kennt der oeffentliche Linter den Wortlaut nicht (kein SPERR-/TXT-Fehler).
{
  const runs = [
    ["verneint", {}, "<p>Ich gebe keine Musterkurse.</p>", [BIND_B]],
    ["zB1 = true", { zB1: true }, "<p>Ich gebe Musterkurse.</p>", [BIND_B]],
    ["ohne private Liste", {}, "<p>Ich gebe Musterkurse.</p>", []], // Preise mit Währung sperrt schon STAGE1-commercial
  ];
  const bad = [];
  for (const [name, patch, html, privateTerms] of runs) {
    const fx = fixture();
    fx.state(patch);
    inject(fx, "ueber-mich/index.html", html);
    const e = errorsOf(lint({ siteDir: join(fx.base, "site"), rootDir: fx.base, gitCheck: false, privateTerms }));
    if (e.length) bad.push(`${name}: ${e[0].rule} ${e[0].msg}`);
    rmSync(fx.base, { recursive: true, force: true });
  }
  if (bad.length) { failed++; console.log(`  FEHLER Kontrolle: gebundene Regel falsch (${bad[0]})`); }
  else console.log("  ok    Kontrolle: Bindung B-b1 verneint/mit zB1 = true grün; ohne private Liste kein öffentlicher Wortlaut");
}

// Kontrolle 12 (T-01/P-02): Commit-Nachrichten laufen durch die Sperrliste v2 (ohne Seitenbindung). In der
// Kopie entsteht ein eigenes git-Repo: Basis-Commit, dann eine Probe-Nachricht. Rot muss sie werden; als
// bekannter Alt-Treffer nur Warnung (Release: Fehler); eine saubere Nachricht bleibt gruen.
{
  const fx = fixture();
  const git = (...a) => execFileSync("git", ["-C", fx.base, "-c", "user.name=Selbsttest", "-c", "user.email=selbsttest@example.org", "-c", "commit.gpgsign=false", ...a], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  let res = "";
  try {
    git("init", "-q");
    git("commit", "-q", "--allow-empty", "-m", "Basis");
    const base = git("rev-parse", "HEAD");
    git("commit", "-q", "--allow-empty", "-m", "Probe: Beispielprobe startet, Workshops ab Montag");
    const probe = git("rev-parse", "HEAD");
    const run = (o) => lint({ siteDir: join(fx.base, "site"), rootDir: fx.base, gitCheck: true, gitBase: base, privateTerms: [BIND_A], ...o }).filter((x) => x.where === `commit ${probe.slice(0, 7)}`);
    const rot = run({ knownCommits: {} }).filter((x) => x.level === "error").map((x) => x.rule).sort().join(",");
    const bekannt = run({ knownCommits: { [probe]: ["A-vorbereitet", "C-workshop"] } }).map((x) => `${x.level}:${x.rule}`).sort().join(",");
    const bekanntRel = run({ knownCommits: { [probe]: ["A-vorbereitet", "C-workshop"] }, release: true }).filter((x) => x.level === "error").length;
    const teil = run({ knownCommits: { [probe]: ["A-vorbereitet"] } }).filter((x) => x.level === "error").map((x) => x.rule).join(",");
    git("commit", "-q", "--allow-empty", "-m", "Startseite: Zeilenabstand angeglichen");
    const sauber = lint({ siteDir: join(fx.base, "site"), rootDir: fx.base, gitCheck: true, gitBase: probe, privateTerms: [], knownCommits: {} }).filter((x) => x.level === "error" && /^commit /.test(x.where)).length;
    if (rot !== "SPERR-A,SPERR-C") res = `rote Nachricht ergibt „${rot}“ statt SPERR-A,SPERR-C`;
    else if (bekannt !== "warn:GIT-commit-known,warn:GIT-commit-known") res = `bekannte Treffer ergeben „${bekannt}“`;
    else if (bekanntRel !== 2) res = `bekannte Treffer im Release ${bekanntRel} Fehler statt 2`;
    else if (teil !== "SPERR-C") res = `nur A bekannt ergibt „${teil}“ statt SPERR-C`;
    else if (sauber) res = `saubere Nachricht ergibt ${sauber} Fehler`;
  } catch (e) { res = `Testaufbau gescheitert: ${e.message}`; }
  if (res) { failed++; console.log(`  FEHLER Kontrolle: Commit-Prüfung ${res}`); }
  else console.log("  ok    Kontrolle: Commit-Nachricht rot (SPERR-A, SPERR-C), bekannt = Warnung, Release = Fehler, sauber = grün");
  rmSync(fx.base, { recursive: true, force: true });
}

// Kontrolle 13 (BF-04): richtig ausgezeichnete Teile bleiben gruen; die Englisch-Heuristik ist nur ein Hinweis
// (Warnung) und laeuft im Release nicht (Fehlalarme wuerden sonst Releases sperren). Zwei Laeufe hintereinander
// liefern dieselbe Zahl: EN_WORDS hat /g und wird nur mit .match() benutzt (zustandslos).
{
  const fx = fixture();
  inject(fx, "en/about/index.html", '<p>The authority is the <span lang="de">Österreichische Datenschutzbehörde</span>.</p>');
  inject(fx, "ueber-mich/index.html", '<p>Ein Zitat: „<span lang="en">All of this is fine.</span>“</p><p>Mit Claude Code und Pull Requests.</p>');
  const ok = lint({ siteDir: join(fx.base, "site"), rootDir: fx.base, gitCheck: false, privateTerms: [] }).filter((x) => /^A11Y-lang/.test(x.rule));
  inject(fx, "ueber-mich/index.html", "<p>All of this is fine.</p>");
  const runs = [1, 2].map(() => lint({ siteDir: join(fx.base, "site"), rootDir: fx.base, gitCheck: false, privateTerms: [] }).filter((x) => x.rule === "A11Y-lang-hint" && /All of this/.test(x.msg)));
  const rel = lint({ siteDir: join(fx.base, "site"), rootDir: fx.base, gitCheck: false, privateTerms: [], release: true }).filter((x) => /^A11Y-lang/.test(x.rule) && /All of this/.test(x.msg));
  if (ok.length) { failed++; console.log(`  FEHLER Kontrolle: ausgezeichnete Sprachteile abgelehnt (${ok[0].rule}: ${ok[0].msg})`); }
  else if (runs[0].length !== 1 || runs[1].length !== 1 || runs[0][0].level !== "warn") { failed++; console.log(`  FEHLER Kontrolle: Englisch-Hinweis ${runs.map((r) => r.length).join("/")} statt 1/1 Warnung`); }
  else if (rel.length) { failed++; console.log(`  FEHLER Kontrolle: Englisch-Heuristik läuft im Release (${rel[0].level})`); }
  else console.log("  ok    Kontrolle: lang-Teile ausgezeichnet = grün; englischer Satz auf DE = 1 Hinweis (2 Läufe gleich), im Release still");
  rmSync(fx.base, { recursive: true, force: true });
}

// Kontrolle 14 (Plan F2 Punkte 3, 8, 9): Ohne private src/state.json prueft der Linter mit dem engsten Zustand
// (Info, kein Fehler) — sichtbar an einer Regel, die nur dort greift (Rollenname bei zD2 = B); eine vorhandene
// Datei mit zD2 = A wird benutzt. STATE-leak trifft nur Zustandsschluessel, nicht "Rolle"/"Kontrolle" im Text.
{
  const fx = fixture();
  const sf = join(fx.base, "src", "state.json");
  rmSync(sf);
  inject(fx, "en/hire/index.html", "<p>Looking for a role focused on agent reliability.</p>");
  const factsJ = JSON.parse(fx.read("facts.json")); factsJ.facts["soul_mcp.tests"].source += " Rolle und Kontrolle."; fx.write("facts.json", JSON.stringify(factsJ));
  const run = () => lint({ siteDir: join(fx.base, "site"), rootDir: fx.base, gitCheck: false, privateTerms: [] });
  const ohne = run();
  writeFileSync(sf, JSON.stringify({ ...STATE_STRICT, zD2: "A" }));
  const mitA = run();
  const has = (f, rule, re = /./) => f.some((x) => x.rule === rule && re.test(x.msg));
  let res = "";
  if (has(ohne, "STATE-invalid")) res = "fehlende Datei ergibt STATE-invalid";
  else if (!has(ohne, "STATE-strict")) res = "fehlende Datei ohne Info STATE-strict";
  else if (!has(ohne, "SPERR-D", /D-rolle-b/)) res = "engster Zustand nicht wirksam (D-rolle-b fehlt)";
  else if (has(mitA, "SPERR-D", /D-rolle-b/) || has(mitA, "STATE-strict")) res = "vorhandene Datei mit zD2 = A wird nicht benutzt";
  else if (has(ohne, "STATE-leak") || has(mitA, "STATE-leak")) res = "STATE-leak trifft Fließtext (Rolle/Kontrolle)";
  if (res) { failed++; console.log(`  FEHLER Kontrolle: Zustand ${res}`); }
  else console.log("  ok    Kontrolle: ohne src/state.json engster Zustand (Info, Rolle B wirksam); Datei mit zD2 = A benutzt; „Rolle/Kontrolle“ kein STATE-leak");
  rmSync(fx.base, { recursive: true, force: true });
}

// Kontrolle 6 (R-03): Das Release-Tor erkennt die neutralen Kennungen. Ohne jede Kennung kein TODO-open;
// genau eine eingefuegte <!--OFFEN:F-nn--> macht genau diese Seite rot; email_off und Kennungen sind im
// Normalmodus kein Fehler.
{
  const fx = fixture();
  const htmls = [];
  const walk = (d) => { for (const n of readdirSync(d)) { const p = join(d, n); if (statSync(p).isDirectory()) walk(p); else if (p.endsWith(".html")) htmls.push(p); } };
  walk(join(fx.base, "site"));
  let removed = 0;
  for (const p of htmls) { const h = readFileSync(p, "utf8"); const c = h.replace(/<!--OFFEN:F-\d{2,3}-->/g, () => { removed++; return ""; }); writeFileSync(p, c); }
  const rel = (o) => lint({ siteDir: join(fx.base, "site"), rootDir: fx.base, gitCheck: false, privateTerms: [], ...o }).filter((x) => x.level === "error" && /TODO-open|NOTE-comment/.test(x.rule));
  const before = rel({ release: true });
  inject(fx, "kontakt/index.html", '<p><!--email_off--><a href="mailto:x@example.org">x@example.org</a><!--/email_off--><!--OFFEN:F-99--></p>');
  const normal = rel({});
  const after = rel({ release: true });
  if (!removed) { failed++; console.log("  FEHLER Kontrolle: keine <!--OFFEN:F-nn--> in site/ gefunden — Test prüft nichts"); }
  else if (before.length) { failed++; console.log(`  FEHLER Kontrolle: ohne Kennungen trotzdem ${before[0].rule} (${before[0].where})`); }
  else if (normal.length) { failed++; console.log(`  FEHLER Kontrolle: Kennung/email_off im Normalmodus abgelehnt (${normal[0].rule}: ${normal[0].msg})`); }
  else if (after.length !== 1 || after[0].rule !== "TODO-open" || after[0].where !== "kontakt/index.html") { failed++; console.log(`  FEHLER Kontrolle: Release-Tor erkennt <!--OFFEN:F-99--> nicht genau einmal (${after.map((x) => x.rule + "@" + x.where).join(", ") || "nichts"})`); }
  else console.log(`  ok    Kontrolle: Release-Tor rot genau an <!--OFFEN:F-99--> (${removed} Kennungen entfernt → 0); email_off erlaubt`);
  rmSync(fx.base, { recursive: true, force: true });
}

// Kontrolle 15 (P-01, Welle F2): Fehlt die private Liste oder bindet sie Regeln nicht, gibt es fuer GitHub Actions
// genau EINE Annotation (Normalmodus warning, Release error, Zeilenumbrueche und % maskiert); ohne PRIV-Meldung keine.
{
  const fx = fixture();
  const run = (o) => ciAnnotation(lint({ siteDir: join(fx.base, "site"), rootDir: fx.base, gitCheck: false, privateTerms: [], ...o }));
  const head = (n, lvl) => !!n && n.line.startsWith(`::${lvl} title=Sperrliste NICHT GEPRÜFT::`) && !/[\r\n]/.test(n.line) && n.summary.startsWith("### Private Sperrliste NICHT GEPRÜFT");
  const ohne = run({}), rel = run({ release: true }), teil = run({ privateTerms: ["Beispielfirma"] });
  const esc = ciAnnotation([{ rule: "PRIV-rule-missing", level: "warn", where: "-", msg: "a%b\nc" }]);
  const still = ciAnnotation([{ rule: "PAGES", level: "info", where: "-", msg: "x" }]);
  let res = "";
  if (!head(ohne, "warning") || !/B-b1/.test(ohne.line)) res = "fehlende Liste ohne Warn-Annotation (mit B-b1)";
  else if (!head(rel, "error")) res = "Release ohne Fehler-Annotation";
  else if (!head(teil, "warning") || !/A-ergebnis/.test(teil.line)) res = "ungebundene Regel ohne Annotation";
  else if (!esc.line.endsWith("a%25b%0Ac")) res = "Zeilenumbruch/% nicht maskiert";
  else if (still !== null) res = "Annotation ohne PRIV-Meldung";
  if (res) { failed++; console.log(`  FEHLER Kontrolle: CI-Annotation: ${res}`); }
  else console.log("  ok    Kontrolle: CI-Annotation „Sperrliste NICHT GEPRÜFT“ bei fehlender Liste (warning), im Release (error), bei ungebundener Regel; maskiert; sonst keine");
  rmSync(fx.base, { recursive: true, force: true });
}

for (const [rule, mutate, opts = {}] of CASES) {
  const fx = fixture();
  try {
    mutate(fx);
    const { expect, where, ...lintOpts } = opts;
    const e = errorsOf(lint({ siteDir: join(fx.base, "site"), rootDir: fx.base, gitCheck: false, privateTerms: [], ...lintOpts }));
    const hit = e.find((x) => x.rule === rule && (!expect || expect.test(x.msg)) && (!where || where.test(x.where)));
    if (hit) console.log(`  ok    ${rule.padEnd(22)} ausgelöst: ${hit.msg.slice(0, 80)}`);
    else { failed++; console.log(`  FEHLER ${rule.padEnd(21)} NICHT ausgelöst (gefunden: ${[...new Set(e.map((x) => x.rule))].join(", ") || "nichts"})`); }
  } catch (err) {
    failed++; console.log(`  FEHLER ${rule}: Testaufbau gescheitert: ${err.message}`);
  } finally {
    rmSync(fx.base, { recursive: true, force: true });
  }
}

console.log(`\nselftest: ${CASES.length + 15 - failed} von ${CASES.length + 15} Fällen wie erwartet.`);
process.exit(failed ? 1 : 0);
