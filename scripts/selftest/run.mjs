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
  ["TXT-privacy", (fx) => inject(fx, "index.html", "<p>Telefon: +43 699 1234 5678</p>")],
  ["TXT-privacy", (fx) => inject(fx, "index.html", '<p><a href="https://wa.me/0000000">Chat</a></p>')],
  ["TXT-privacy", (fx) => inject(fx, "index.html", "<p>Musterstraße 12</p>")],
  ["TXT-privacy", (fx) => inject(fx, "index.html", "<p>muster@gmail.com</p>")],
  ["TXT-privacy", (fx) => inject(fx, "index.html", "<p>Ich bin 99 Jahre alt.</p>")],
  ["TXT-private", (fx) => inject(fx, "index.html", "<p>Früher bei Beispielfirma.</p>"), { privateTerms: ["Beispielfirma"] }],
  ["NUM-unsourced", (fx) => inject(fx, "index.html", "<p>Es gibt 42 Kunden.</p>")],
  ["NUM-fact-mismatch", (fx) => fx.edit("projekte/index.html", 'data-fact="soul_mcp.tests">373 von 373<', 'data-fact="soul_mcp.tests">374 von 374<')],
  ["NUM-fact-unknown", (fx) => inject(fx, "index.html", '<p><data value="1" data-fact="erfunden.zahl">1</data></p>')],
  ["FACTS-schema", (fx) => { const j = JSON.parse(fx.read("facts.json")); delete j.facts["soul_mcp.tests"].source; fx.write("facts.json", JSON.stringify(j)); }],
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
// Kontrolle 2: widerrufene Zahl mit Pflichtkontext ist erlaubt
{
  const fx = fixture();
  inject(fx, "fallstudie/index.html", '<p>Zurückgenommen: <data value="+17.8" data-fact="case.registered">+17,8 Prozentpunkte</data>.</p>');
  const e = errorsOf(lint({ siteDir: join(fx.base, "site"), rootDir: fx.base, gitCheck: false, privateTerms: [] }));
  if (e.length) { failed++; console.log(`  FEHLER Kontrolle: Zahl mit Kontext wurde abgelehnt (${e[0].rule}: ${e[0].msg})`); }
  else console.log("  ok    Kontrolle: +17,8 mit „zurückgenommen“ wird durchgelassen");
  rmSync(fx.base, { recursive: true, force: true });
}

for (const [rule, mutate, opts = {}] of CASES) {
  const fx = fixture();
  try {
    mutate(fx);
    const e = errorsOf(lint({ siteDir: join(fx.base, "site"), rootDir: fx.base, gitCheck: false, privateTerms: [], ...opts }));
    const hit = e.find((x) => x.rule === rule);
    if (hit) console.log(`  ok    ${rule.padEnd(22)} ausgelöst: ${hit.msg.slice(0, 80)}`);
    else { failed++; console.log(`  FEHLER ${rule.padEnd(21)} NICHT ausgelöst (gefunden: ${[...new Set(e.map((x) => x.rule))].join(", ") || "nichts"})`); }
  } catch (err) {
    failed++; console.log(`  FEHLER ${rule}: Testaufbau gescheitert: ${err.message}`);
  } finally {
    rmSync(fx.base, { recursive: true, force: true });
  }
}

console.log(`\nselftest: ${CASES.length + 2 - failed} von ${CASES.length + 2} Fällen wie erwartet.`);
process.exit(failed ? 1 : 0);
