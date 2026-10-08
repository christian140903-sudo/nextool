#!/usr/bin/env node
// Selbsttest des Site-Linters: Ein Mechanismus gilt erst als gebaut, wenn sein Fehlerfall
// einmal ausgeloest wurde. Jeder Fall kopiert site/ in ein Temp-Verzeichnis, baut genau
// einen Verstoss ein und erwartet die passende Regel. Dazu zwei Kontrollen:
//   - die unveraenderte Kopie muss fehlerfrei sein (sonst prueft der Test nichts),
//   - eine widerrufene Zahl MIT Pflichtkontext darf NICHT anschlagen.
// Alle Testdaten sind erfunden (keine echten Nummern, Namen, Adressen).

import { mkdtempSync, cpSync, readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { lint } from "../lint-site.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

function fixture() {
  const base = mkdtempSync(join(tmpdir(), "lint-selftest-"));
  cpSync(join(ROOT, "site"), join(base, "site"), { recursive: true });
  mkdirSync(join(base, "src"), { recursive: true });
  cpSync(join(ROOT, "src", "legacy-urls.txt"), join(base, "src", "legacy-urls.txt"));
  const f = (p) => join(base, "site", p);
  return {
    base,
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
  ["HEAD-canonical", (fx) => fx.edit("kontakt/index.html", 'rel="canonical" href="https://nextool.app/kontakt/"', 'rel="canonical" href="https://nextool.app/kontakt"')],
  ["HEAD-h1", (fx) => inject(fx, "kontakt/index.html", "<h1>Zweite Überschrift</h1>")],
  ["HEAD-lang", (fx) => fx.edit("kontakt/index.html", '<html lang="de"', '<html lang="xx"')],
  ["I18N-pair", (fx) => fx.edit("projekte/index.html", '<link rel="alternate" hreflang="en" href="https://nextool.app/en/projects/">', "")],
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
  ["SITEMAP-noindex", (fx) => fx.write("sitemap.xml", fx.read("sitemap.xml").replace("</urlset>", "  <url><loc>https://nextool.app/archiv/</loc></url>\n</urlset>"))],
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
  // Audit T1–T18 der Website-Session (Nachbesserung 2): je neue Regel ein Gegenbeispiel
  ["I18N-absolute", (fx) => fx.edit("projekte/index.html", '<link rel="alternate" hreflang="en" href="https://nextool.app/en/projects/">', '<link rel="alternate" hreflang="en" href="/en/projects/">')],
  ["SITEMAP-hreflang", (fx) => fx.edit("sitemap.xml", '<loc>https://nextool.app/projekte/</loc>', '<loc>https://nextool.app/projekte/</loc>\n    <xhtml:link rel="alternate" hreflang="fr" href="https://nextool.app/fr/"/>')],
  ["I18N-switch", (fx) => fx.edit("kontakt/index.html", '<li class="lang-switch"><a href="/en/contact/"', '<li class="lang-switch"><a href="/en/"')],
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
  ["SD-forbidden", (fx) => fx.edit("index.html", "</head>", '<script type="application/ld+json">{"@context":"https://schema.org","@type":"Person","name":"x","address":{"@type":"PostalAddress"}}</script>\n</head>')],
  ["SD-forbidden", (fx) => inject(fx, "index.html", '<div itemscope itemtype="https://schema.org/Offer"><span itemprop="price">1</span></div>')],
  ["SD-forbidden", (fx) => fx.edit("index.html", "</head>", '<meta property="business:contact_data:street_address" content="x">\n</head>')],
  // Recht und Fakten (Nachbesserung 7/10/12, Pruefbericht 9)
  ["FACTS-internal", (fx) => { const j = JSON.parse(fx.read("facts.json")); j.facts["soul_mcp.tests"].source = "Positionierung §3.1 Nr. 1"; fx.write("facts.json", JSON.stringify(j)); }, { expect: /Positionierung/ }],
  ["FACTS-internal", (fx) => { const j = JSON.parse(fx.read("facts.json")); j.facts["soul_mcp.tests"].offen = "am Merge-Tag angleichen"; fx.write("facts.json", JSON.stringify(j)); }, { expect: /„offen“/ }],
  ["TXT-privacy", (fx) => inject(fx, "kontakt/index.html", "<p>Barichgasse 40–42, 1030 Wien</p>"), { expect: /strasse/ }],
  ["NUM-unsourced", (fx) => inject(fx, "datenschutz/index.html", "<p>Seite 165(3) im Handbuch.</p>")],
  ["NUM-unsourced", (fx) => inject(fx, "impressum/index.html", "<p>Lizenz in Version 4.0.</p>")],
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

console.log(`\nselftest: ${CASES.length + 5 - failed} von ${CASES.length + 5} Fällen wie erwartet.`);
process.exit(failed ? 1 : 0);
