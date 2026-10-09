#!/usr/bin/env node
// Selbsttest des Builds (scripts/build.mjs): Jeder Mechanismus loest seinen Fehlerfall einmal aus.
//   Foto  — ohne foto.jpg Initialen statt <img>; mit sauberem JPEG <img> mit Breite/Hoehe;
//           EXIF, Kommentar, MPF, Anhang (zweites JPEG/EXIF), > 150 KB oder WebP ohne JPEG brechen ab.
//   Tueren — auf einer Seite mit "door" fehlt der Navigationspunkt der anderen Tuer (§1.5).
//   Kennungen — interne Notizen nur als F-nn (R-03); Klartext bricht ab, ohne in der Meldung zu stehen.
// Arbeitet auf einer Temp-Kopie von src/; die echten Quellen bleiben unberuehrt.

import { mkdtempSync, cpSync, writeFileSync, readFileSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { build, jpegInfo } from "../build.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

function seg(marker, body) {
  const head = Buffer.alloc(4);
  head[0] = 0xff; head[1] = marker; head.writeUInt16BE(body.length + 2, 2);
  return Buffer.concat([head, body]);
}
// Minimales JPEG-Geruest: SOI, optional APP1/Exif, weitere Segmente, SOF0 mit Groesse, optional Fuellkommentare, EOI.
function jpeg({ width = 4, height = 3, exif = false, padKB = 0, segs = [] } = {}) {
  const parts = [Buffer.from([0xff, 0xd8])];
  if (exif) parts.push(seg(0xe1, Buffer.concat([Buffer.from("Exif\0\0", "latin1"), Buffer.alloc(16)])));
  for (const [marker, body] of segs) parts.push(seg(marker, body));
  const sof = Buffer.from([8, 0, 0, 0, 0, 1, 1, 0x11, 0]);
  sof.writeUInt16BE(height, 1); sof.writeUInt16BE(width, 3);
  parts.push(seg(0xc0, sof));
  for (let left = padKB * 1024; left > 0; left -= 60000) parts.push(seg(0xfe, Buffer.alloc(Math.min(60000, left))));
  parts.push(Buffer.from([0xff, 0xd9]));
  return Buffer.concat(parts);
}

const TEST_PAGE = `<!--page
{ "path": "/phototest.html", "lang": "de", "title": "Selbsttest Foto", "description": "nur Selbsttest", "robots": "noindex", "updated": "2026-10-08" }
-->
<div class="prose"><h1>Test</h1>{{photo:large}}{{photo:small}}</div>
`;

function fixture() {
  const base = mkdtempSync(join(tmpdir(), "build-selftest-"));
  const src = join(base, "src");
  cpSync(join(ROOT, "src"), src, { recursive: true });
  rmSync(join(src, "static", "assets", "foto.jpg"), { force: true });
  rmSync(join(src, "static", "assets", "foto.webp"), { force: true });
  mkdirSync(join(src, "pages", "x"), { recursive: true });
  writeFileSync(join(src, "pages", "x", "phototest.html"), TEST_PAGE);
  return { base, src, asset: (n, buf) => writeFileSync(join(src, "static", "assets", n), buf) };
}

let failed = 0, total = 0;
function check(name, fn) {
  total++;
  const fx = fixture();
  try { fn(fx); console.log(`  ok    ${name}`); }
  catch (e) { failed++; console.log(`  FEHLER ${name}: ${e.message}`); }
  finally { rmSync(fx.base, { recursive: true, force: true }); }
}
const page = (out, rel) => {
  const b = out.get(rel);
  if (!b) throw new Error(`${rel} nicht gebaut`);
  return b.toString("utf8");
};
function expectThrow(fx, re) {
  try { build({ src: fx.src }); } catch (e) {
    if (re.test(e.message)) return;
    throw new Error(`falsche Meldung: ${e.message}`);
  }
  throw new Error("Build lief durch, sollte abbrechen");
}

check("ohne foto.jpg: Initialen, kein <img>", (fx) => {
  const html = page(build({ src: fx.src }), "phototest.html");
  if (!html.includes('class="portrait portrait-large portrait-initials" aria-hidden="true">CB<')) throw new Error("Initialen fehlen");
  if (/foto\.(jpg|webp)/.test(html)) throw new Error("verweist trotzdem auf foto.*");
  if (/portrait-small/.test(html)) throw new Error("{{photo:small}} ohne Foto rendert trotzdem etwas (R4 a3: nur large zeigt Initialen)");
});
check("sauberes JPEG: <img> mit Breite/Höhe, Datei ausgeliefert", (fx) => {
  fx.asset("foto.jpg", jpeg({ width: 640, height: 800 }));
  const out = build({ src: fx.src });
  const html = page(out, "phototest.html");
  if (!html.includes('<img src="/assets/foto.jpg" alt="Christian Bucher" width="640" height="800"')) throw new Error("img fehlt oder ohne Maße");
  if (html.includes("foto.webp")) throw new Error("webp-Quelle ohne Datei");
  if (!out.has("assets/foto.jpg")) throw new Error("foto.jpg nicht im Ergebnis");
  if (!html.includes('<picture class="portrait portrait-small">')) throw new Error("{{photo:small}} mit Foto fehlt");
});
check("JPEG + WebP: <source> für WebP", (fx) => {
  fx.asset("foto.jpg", jpeg());
  fx.asset("foto.webp", Buffer.concat([Buffer.from("RIFF\x0c\0\0\0WEBPVP8 \0\0\0\0", "latin1")]));
  if (!page(build({ src: fx.src }), "phototest.html").includes('<source srcset="/assets/foto.webp" type="image/webp">')) throw new Error("source fehlt");
});
check("EXIF im JPEG bricht ab", (fx) => { fx.asset("foto.jpg", jpeg({ exif: true })); expectThrow(fx, /Metadaten \(EXIF\)/); });
check("JPEG > 150 KB bricht ab", (fx) => { fx.asset("foto.jpg", jpeg({ padKB: 160 })); expectThrow(fx, /> 150 KB/); });
check("EXIF im WebP bricht ab", (fx) => {
  fx.asset("foto.jpg", jpeg());
  fx.asset("foto.webp", Buffer.from("RIFF\x14\0\0\0WEBPEXIF\x04\0\0\0abcdVP8 \0\0\0\0", "latin1"));
  expectThrow(fx, /foto\.webp enthält Metadaten/);
});
check("WebP ohne JPEG bricht ab", (fx) => { fx.asset("foto.webp", Buffer.from("RIFF\x04\0\0\0WEBP", "latin1")); expectThrow(fx, /ohne foto\.jpg/); });
check("kaputtes JPEG bricht ab", (fx) => { fx.asset("foto.jpg", Buffer.from("kein bild")); expectThrow(fx, /keine JPEG-Datei/); });
// R-07 (Abnahme Welle E): Faelle des Rohberichts, je erwartete Meldungsliste exakt.
const R07 = [
  ["sauber", () => jpeg(), []],
  ["EXIF im Kopf (z. B. GPS)", () => jpeg({ exif: true }), ["EXIF"]],
  ["JPEG-Kommentar (COM)", () => jpeg({ segs: [[0xfe, Buffer.from("Beispielkamera Seriennummer 0000", "latin1")]] }), ["COM/Kommentar"]],
  ["Anhang: zweites JPEG mit EXIF hinter den Bilddaten", () => Buffer.concat([jpeg(), jpeg({ exif: true })]), ["weiteres JPEG in der Datei", "EXIF (hinter den Bilddaten)"]],
  ["MPO: MPF-Segment und Zusatzbild", () => Buffer.concat([jpeg({ segs: [[0xe2, Buffer.concat([Buffer.from("MPF\0", "latin1"), Buffer.alloc(12)])]] }), jpeg()]), ["MPF/Zusatzbilder", "weiteres JPEG in der Datei"]],
  ["ICC-Profil (APP2) ohne Fehltreffer", () => jpeg({ segs: [[0xe2, Buffer.concat([Buffer.from("ICC_PROFILE\0\x01\x01", "latin1"), Buffer.alloc(64, 0x41)])]] }), []],
];
for (const [name, make, want] of R07) {
  check(`R-07 jpegInfo: ${name} → [${want.join(", ")}]`, () => {
    const got = jpegInfo(make()).meta;
    if (JSON.stringify(got) !== JSON.stringify(want)) throw new Error(`gemeldet [${got.join(", ")}]`);
  });
}
check("R-07: Foto mit Anhang bricht den Build ab", (fx) => { fx.asset("foto.jpg", Buffer.concat([jpeg(), jpeg({ exif: true })])); expectThrow(fx, /Metadaten \(weiteres JPEG in der Datei, EXIF \(hinter den Bilddaten\)\)/); });
check("unbekannte Fotogröße bricht ab", (fx) => {
  writeFileSync(join(fx.src, "pages", "x", "phototest.html"), TEST_PAGE.replace("{{photo:small}}", "{{photo:riesig}}"));
  expectThrow(fx, /Größe muss/);
});
// Neutrale Kennungen (R-03): Klartext-Notizen im oeffentlichen Repo/HTML brechen den Build ab,
// ohne den Klartext in die (oeffentliche) Meldung zu schreiben.
const CLEAR = "Verfügbar ab Beispieldatum, Notiz für Beispielperson";
const noLeak = (fx, re) => {
  try { build({ src: fx.src }); } catch (e) {
    if (!re.test(e.message)) throw new Error(`falsche Meldung: ${e.message}`);
    if (/Beispiel/.test(e.message)) throw new Error("Meldung enthält den Klartext");
    return;
  }
  throw new Error("Build lief durch, sollte abbrechen");
};
const setPage = (fx, html) => writeFileSync(join(fx.src, "pages", "x", "phototest.html"), TEST_PAGE.replace("{{photo:small}}", html));
check("{{todo:F-nn}} wird <!--OFFEN:F-nn-->, Absatz nur mit Kennung entfällt", (fx) => {
  setPage(fx, "<p>{{todo:F-91}}</p><p>Text {{todo:F-92}}</p>");
  const html = page(build({ src: fx.src }), "phototest.html");
  if (/<mark|data-todo/.test(html)) throw new Error("sichtbare Marke im Ergebnis");
  if (!html.includes("CB</div><!--OFFEN:F-91-->")) throw new Error("F-91 nicht als freier Kommentar (leerer <p> geblieben?)");
  if (!html.includes("<p>Text <!--OFFEN:F-92--></p>")) throw new Error("F-92 nicht als Kommentar im Absatz");
});
check("Absatz mit Text zwischen zwei Kennungen bleibt erhalten", (fx) => {
  setPage(fx, "<p>{{todo:F-91}} sichtbarer Text {{todo:F-92}}</p>");
  if (!page(build({ src: fx.src }), "phototest.html").includes("<p><!--OFFEN:F-91--> sichtbarer Text <!--OFFEN:F-92--></p>")) throw new Error("Absatz-Rahmen um sichtbaren Text entfernt");
});
check("{{todo:Klartext}} bricht ab, Meldung ohne Klartext", (fx) => { setPage(fx, `<p>{{todo:${CLEAR}}}</p>`); noLeak(fx, /\{\{todo:…\}\} — Klartext statt Kennung/); });
check("{{todo:F-01 --> b}} (Kennung mit Anhang) bricht ab", (fx) => { setPage(fx, "{{todo:F-01 --> b}}"); noLeak(fx, /Klartext statt Kennung/); });
check("<!--intern:F-nn--> steht nur in src/, nicht in der Ausgabe", (fx) => {
  setPage(fx, "<p>a</p>\n<!--intern:F-93-->\n<p>b</p>");
  const html = page(build({ src: fx.src }), "phototest.html");
  if (/intern|F-93/.test(html)) throw new Error("Kennung ausgeliefert");
  if (!html.includes("<p>a</p>\n<p>b</p>")) throw new Error("umgebender Text beschädigt");
});
check("<!--intern Klartext --> bricht ab, Meldung ohne Klartext", (fx) => { setPage(fx, `<!--intern ${CLEAR}\n<h2>Beispielabsatz</h2> -->`); noLeak(fx, /<!--intern nur als/); });
check("<!--internal …--> (ohne Doppelpunkt) bricht ab", (fx) => { setPage(fx, `<!--internal ${CLEAR}-->`); noLeak(fx, /<!--intern nur als/); });
check("<!--intern ohne Ende bricht ab", (fx) => { setPage(fx, `<!--intern ${CLEAR}`); noLeak(fx, /<!--intern nur als/); });
const setFact = (fx, fn) => {
  const p = join(fx.src, "facts.json");
  const j = JSON.parse(readFileSync(p, "utf8"));
  fn(j.facts["soul_mcp.tests"]);
  writeFileSync(p, JSON.stringify(j, null, 2));
  return j.facts["soul_mcp.tests"];
};
check("Fakt mit offen F-nn: <!--OFFEN:F-nn--> am Wert; ausgelieferte facts.json ohne interne Felder", (fx) => {
  const f = setFact(fx, (f) => { f.offen = "F-94"; f.source_internal = "intern:F-95"; });
  const out = build({ src: fx.src });
  if (!/data-fact="soul_mcp\.tests">[^<]*<\/data><!--OFFEN:F-94-->/.test(page(out, "projekte/index.html"))) throw new Error("OFFEN-Kennung fehlt am Fakt");
  const pub = JSON.parse(out.get("facts.json").toString("utf8")).facts["soul_mcp.tests"];
  if ("offen" in pub || "source_internal" in pub) throw new Error("internes Feld ausgeliefert");
  if (pub.value !== f.value || pub.source !== f.source) throw new Error("öffentliche Felder verändert");
});
check("facts.json offen mit Klartext bricht ab, Meldung ohne Klartext", (fx) => { setFact(fx, (f) => { f.offen = CLEAR; }); noLeak(fx, /soul_mcp\.tests\.offen — Klartext/); });
check("facts.json source_internal mit Klartext bricht ab, Meldung ohne Klartext", (fx) => { setFact(fx, (f) => { f.source_internal = CLEAR; }); noLeak(fx, /source_internal nur als "intern:F-nn"/); });
// Kernsatz aus einer Quelle (Positionierung v2 §1.1) und OG-Stempel (fail-closed)
const editSite = (fx, fn) => { const p = join(fx.src, "site.json"); const j = JSON.parse(readFileSync(p, "utf8")); fn(j); writeFileSync(p, JSON.stringify(j, null, 2)); };
check("{{kernsatz}} rendert den Satz aus site.json in Seite, description und og:image:alt", (fx) => {
  const want = JSON.parse(readFileSync(join(fx.src, "site.json"), "utf8")).strings.en.kernsatz;
  const html = page(build({ src: fx.src }), "en/index.html");
  const e = want.replace(/&/g, "&amp;");
  if (!html.includes(`<h1 id="core">${e}</h1>`)) throw new Error("H1 ohne Kernsatz");
  if (!html.includes(`<meta name="description" content="${e} `)) throw new Error("description ohne Kernsatz");
  const alt = (/<meta property="og:image:alt" content="([^"]*)">/.exec(html) || [])[1] || "";
  if (!alt.includes(e)) throw new Error("og:image:alt ohne Kernsatz");
  if (html.includes("{{")) throw new Error("Platzhalter übrig");
});
check("Kernsatz geändert ohne npm run og bricht ab", (fx) => { editSite(fx, (j) => { j.strings.en.kernsatz += " Neu."; }); expectThrow(fx, /og-en\.png zeigt kernsatz/); });
check("Domainwechsel ohne npm run og bricht ab (Host im Bild)", (fx) => { editSite(fx, (j) => { j.origin = "https://example.org"; }); expectThrow(fx, /og-de\.png zeigt host/); });
check("OG-Bild verändert ohne neuen Stempel bricht ab", (fx) => { fx.asset("og-en.png", Buffer.concat([readFileSync(join(fx.src, "static", "assets", "og-en.png")), Buffer.from([0])])); expectThrow(fx, /og-en\.png passt nicht zum Stempel/); });
check("fehlender OG-Stempel bricht ab", (fx) => { rmSync(join(fx.src, "og-stamp.json")); expectThrow(fx, /og-stamp\.json fehlt/); });
check("unbekannter Platzhalter in description bricht ab", (fx) => { setPage(fx, "<p>x</p>"); const p = join(fx.src, "pages", "x", "phototest.html"); writeFileSync(p, readFileSync(p, "utf8").replace('"description": "nur Selbsttest"', '"description": "{{kernsatz}} {{todo:F-01}}"')); expectThrow(fx, /unbekannter Platzhalter in description/); });
check("R-04: {{email}} und Fußzeile nur mit <!--email_off-->-Klammer", (fx) => {
  setPage(fx, "<p>{{email}}</p>");
  const html = page(build({ src: fx.src }), "phototest.html");
  const wrapped = html.match(/<!--email_off--><a href="mailto:[^"]+">[^<]+<\/a><!--\/email_off-->/g) || [];
  const all = html.match(/href="mailto:/g) || [];
  if (wrapped.length !== 2 || all.length !== 2) throw new Error(`erwartet 2 geklammerte mailto (Seite + Fußzeile), gefunden ${wrapped.length} von ${all.length}`);
});
check("Tür-Seite ohne Navigationspunkt der anderen Tür", (fx) => {
  const p = join(fx.src, "site.json");
  const site = JSON.parse(readFileSync(p, "utf8"));
  site.nav.de.unshift({ id: "workshops", label: "Workshops", href: "/workshops/", door: "workshops" });
  if (!site.nav.de.some((i) => i.door === "hire")) throw new Error("Navigationspunkt Anstellung ohne door: hire in site.json");
  writeFileSync(p, JSON.stringify(site));
  const out = build({ src: fx.src });
  const hire = page(out, "arbeitgeber/index.html");
  const navOf = (h) => /<nav class="site-nav"[\s\S]*?<\/nav>/.exec(h)[0];
  if (!/"door":\s*"hire"/.test(readFileSync(join(fx.src, "pages", "de", "arbeitgeber.html"), "utf8"))) throw new Error("/arbeitgeber/ trägt kein door: hire");
  if (navOf(hire).includes('href="/workshops/"')) throw new Error("/arbeitgeber/ verlinkt die Workshops-Tür in der Navigation");
  if (!navOf(page(out, "kontakt/index.html")).includes('href="/workshops/"')) throw new Error("Kontrollseite ohne Workshops-Punkt — Test prüft nichts");
});

// Barrierefreiheit (Welle F2, BF-07): Ohne Sprachpaar fuehrt der Sprachlink auf die Startseite und sagt das.
check("Sprachlink ohne Sprachpaar nennt die Startseite (BF-07)", (fx) => {
  const site = JSON.parse(readFileSync(join(fx.src, "site.json"), "utf8"));
  const out = build({ src: fx.src });
  const sw = (rel) => /<p class="lang-switch"><a href="([^"]*)"[^>]*>([^<]*)<\/a>/.exec(page(out, rel)).slice(1).join(" ");
  if (sw("behaviorlock/index.html") !== `/ ${site.strings.en.langLinkHome}`) throw new Error(`/behaviorlock/: ${sw("behaviorlock/index.html")}`);
  if (sw("en/projects/index.html") !== `/projekte/ ${site.strings.en.langLink}`) throw new Error(`/en/projects/: ${sw("en/projects/index.html")}`);
});
check("fehlendes langLinkHome bricht ab (BF-07)", (fx) => {
  const p = join(fx.src, "site.json");
  const site = JSON.parse(readFileSync(p, "utf8"));
  delete site.strings.en.langLinkHome;
  writeFileSync(p, JSON.stringify(site));
  expectThrow(fx, /langLinkHome fehlt/);
});

console.log(`\nselftest build: ${total - failed} von ${total} Fällen wie erwartet.`);
process.exit(failed ? 1 : 0);
