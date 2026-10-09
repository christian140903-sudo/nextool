#!/usr/bin/env node
// Selbsttest des Builds (scripts/build.mjs): Jeder Mechanismus loest seinen Fehlerfall einmal aus.
//   Foto  — ohne foto.jpg Initialen statt <img>; mit sauberem JPEG <img> mit Breite/Hoehe;
//           EXIF, Kommentar, MPF, Anhang (zweites JPEG/EXIF), > 150 KB oder WebP ohne JPEG brechen ab.
//   Tueren — auf einer Seite mit "door" fehlt der Navigationspunkt der anderen Tuer (§1.5).
//   Kennungen — interne Notizen nur als F-nn (R-03); Klartext bricht ab, ohne in der Meldung zu stehen.
//   Bausteine — die Pruef-Karte steht einmal je Sprache (src/bausteine/) und erscheint gleich auf Start- und
//           Anstellungsseite; unbekannter Name, fehlende Sprachfassung, Baustein im Baustein brechen ab.
//   Kit   — der team-skills-kit-Satz kommt aus site.json, beide Zustaende (zF1) gebaut; Link nur bei "oeffentlich".
//   Bedingt — {{if:F-nn}}…{{/if}} nur mit Schalter zE1; ohne Schalter fehlt der Satz, die OFFEN-Kennung bleibt;
//           zurueckgehalten ohne {{todo:F-nn}} ausserhalb der Klammer bricht ab (P3-01).
//   Zwillinge — DE/EN-Paare aus IF_ZWILLINGE nur gemeinsam freigeben; eine Klammer braucht ihren Zwilling in der
//           anderen Sprache (P3-03).
// Arbeitet auf einer Temp-Kopie von src/; die echten Quellen bleiben unberuehrt.

import { mkdtempSync, cpSync, writeFileSync, readFileSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { build, jpegInfo, ciStateNote, breakUrl } from "../build.mjs";
import { STATE_STRICT, IF_ZWILLINGE } from "../lint-config.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
// Die Faelle steuern den Zustand selbst (Datei in der Kopie oder env-Parameter). Ein in CI gesetztes Secret
// SITE_PRIVATE_STATE darf sie nicht veraendern (P3-04).
delete process.env.SITE_PRIVATE_STATE;

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
  // Zustand der Kopie = engster Zustand (wie in CI); der private src/state.json spielt fuer den Test keine Rolle.
  writeFileSync(join(src, "state.json"), JSON.stringify(STATE_STRICT));
  return {
    base, src,
    asset: (n, buf) => writeFileSync(join(src, "static", "assets", n), buf),
    state: (patch) => writeFileSync(join(src, "state.json"), JSON.stringify({ ...STATE_STRICT, ...patch })),
  };
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
function expectThrow(fx, re, env) {
  try { build({ src: fx.src, ...(env ? { env } : {}) }); } catch (e) {
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

// Bausteine (R4b b1): Die Pruef-Karte kommt aus EINER Datei je Sprache; Start- und Anstellungsseite zeigen
// denselben Block mit denselben Fakten. Fehlerfaelle brechen ab.
// <section> statt <aside> (P3-02): ein <aside> in <main> meldet axe als landmark-complementary-is-top-level.
const card = (html) => (/<section class="proof-card"[\s\S]*?<\/section>/.exec(html) || [""])[0];
check("Prüf-Karte: Start- und Anstellungsseite zeigen denselben Baustein mit Fakten (DE und EN)", (fx) => {
  setFact(fx, (f) => { f.de = "111 von 111"; f.en = "111 of 111"; });
  const out = build({ src: fx.src });
  for (const [start, hire, lang] of [["index.html", "arbeitgeber/index.html", "de"], ["en/index.html", "en/hire/index.html", "en"]]) {
    const a = card(page(out, start)), b = card(page(out, hire));
    if (!a || !b) throw new Error(`${lang}: Karte fehlt auf ${a ? hire : start}`);
    if (a !== b) throw new Error(`${lang}: Karte auf ${start} und ${hire} verschieden`);
    if (!a.includes(`data-fact="soul_mcp.tests">111 ${lang === "de" ? "von" : "of"} 111</data>`)) throw new Error(`${lang}: geänderter Fakt nicht in der Karte`);
    if (a.includes("{{")) throw new Error(`${lang}: Platzhalter in der Karte übrig`);
    // Zugaenglicher Name (P3-02): aria-labelledby zeigt auf die Ueberschrift IN der Karte.
    const label = (/^<section class="proof-card" aria-labelledby="([^"]+)">/.exec(a) || [])[1];
    if (!label || !new RegExp(`<h2 id="${label}"[^>]*>[^<]+</h2>`).test(a)) throw new Error(`${lang}: Karte ohne aria-labelledby auf ihre Überschrift`);
  }
  for (const rel of ["index.html", "en/index.html", "arbeitgeber/index.html", "en/hire/index.html"]) if (page(out, rel).includes("<aside")) throw new Error(`${rel}: <aside> ausgeliefert`);
});
const setBody = (fx, html) => writeFileSync(join(fx.src, "pages", "x", "phototest.html"), TEST_PAGE.replace("{{photo:small}}", html));
check("unbekannter Baustein bricht ab", (fx) => { setBody(fx, "{{baustein:gibt-es-nicht}}"); expectThrow(fx, /Baustein gibt-es-nicht fehlt/); });
check("Baustein ohne Sprachfassung bricht ab", (fx) => { rmSync(join(fx.src, "bausteine", "pruefkarte.de.html")); expectThrow(fx, /Baustein pruefkarte fehlt \(src\/bausteine\/pruefkarte\.de\.html\)/); });
check("Baustein im Baustein bricht ab", (fx) => {
  writeFileSync(join(fx.src, "bausteine", "schleife.de.html"), "<p>{{baustein:schleife}}</p>");
  setBody(fx, "{{baustein:schleife}}");
  expectThrow(fx, /Baustein im Baustein/);
});
check("<!--intern Klartext --> im Baustein bricht ab, Meldung ohne Klartext", (fx) => {
  writeFileSync(join(fx.src, "bausteine", "notiz.de.html"), `<p>a</p><!--intern ${CLEAR}-->`);
  setBody(fx, "{{baustein:notiz}}");
  noLeak(fx, /<!--intern nur als/);
});

// Adressen in Befehlen (P3-05): {{url:…}} bricht nur nach "/" um, Pfadteile mit Bindestrich bleiben ganz; Pruef-Karte und
// Pruefweg-Zelle zeigen dieselbe Adresse mit denselben Umbruchstellen; `git clone https://…` von Hand bricht ab.
const stripTags = (h) => h.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&");
check("{{url:…}}: <wbr> nach jedem /, Pfadteil mit Bindestrich als nobr, Text = Adresse", () => {
  const u = "https://example.org/beispiel-name/projekt-x/datei";
  const h = breakUrl(u);
  if (h !== 'https://<wbr>example.org/<wbr><span class="nobr">beispiel-name/</span><wbr><span class="nobr">projekt-x/</span><wbr>datei') throw new Error(h);
  if (stripTags(h) !== u) throw new Error("Text weicht von der Adresse ab");
});
check("{{url:…}} ohne http(s)-Adresse bricht ab", (fx) => { setBody(fx, "<pre><code>{{url:javascript:alert(1)}}</code></pre>"); expectThrow(fx, /\{\{url:…\}\} braucht eine http\(s\)-Adresse/); });
check("{{url:…}} mit HTML darin bricht ab", (fx) => { setBody(fx, '<pre><code>{{url:https://example.org/a"b}}</code></pre>'); expectThrow(fx, /\{\{url:…\}\} braucht/); });
check("`git clone https://…` von Hand bricht ab", (fx) => { setBody(fx, "<pre><code>git clone https://example.org/beispiel-name/x</code></pre>"); expectThrow(fx, /Adresse nach „git clone“ von Hand/); });
check("Prüfweg-Zelle (Anstellungsseite) und Prüf-Karte: dieselbe Adresse mit denselben Umbruchstellen (DE und EN)", (fx) => {
  const out = build({ src: fx.src });
  for (const rel of ["arbeitgeber/index.html", "en/hire/index.html"]) {
    const html = page(out, rel);
    const inCard = (/<span class="cont">(.*?)<\/span><span class="cmd">/.exec(card(html)) || [])[1];
    const cell = (/<td data-label="(?:Prüfweg|Verify)"><code>git clone (.*?) &amp;&amp;/.exec(html) || [])[1];
    if (!inCard || !cell) throw new Error(`${rel}: Karte oder Zelle nicht gefunden`);
    if (inCard !== cell) throw new Error(`${rel}: Zelle ${cell} ≠ Karte ${inCard}`);
    if (!cell.includes('<wbr><span class="nobr">christian140903-sudo/</span><wbr>')) throw new Error(`${rel}: Benutzername nicht als ganzer Pfadteil`);
  }
  for (const [rel, html] of out) if (rel.endsWith(".html") && /git clone https?:\/\/[^<]*?-/.test(html.toString("utf8"))) throw new Error(`${rel}: Adresse nach git clone ohne Umbruchstellen`);
});

// team-skills-kit (R4b b4): ein String-Paar in site.json, zwei Zustaende, gesteuert von zF1. Beide Zustaende
// werden gebaut; alle vier Stellen wechseln gemeinsam, der Link steht nur im Zustand "oeffentlich".
const KIT_PAGES = [["arbeitgeber/index.html", "de"], ["projekte/index.html", "de"], ["en/hire/index.html", "en"], ["en/projects/index.html", "en"]];
const kitSite = (fx) => JSON.parse(readFileSync(join(fx.src, "site.json"), "utf8"));
const kitLinks = (out) => [...out].filter(([rel]) => rel.endsWith(".html")).reduce((n, [, b]) => n + (b.toString("utf8").match(/href="[^"]*team-skills-kit[^"]*"/g) || []).length, 0);
function kitCheck(fx, zustand) {
  const site = kitSite(fx);
  const out = build({ src: fx.src });
  const href = `${site.github}/${site.kit.name}`;
  for (const [rel, lang] of KIT_PAGES) {
    const t = site.kit[lang][zustand];
    const name = zustand === "oeffentlich" ? `<a href="${href}">${site.kit.name}</a>` : site.kit.name;
    const html = page(out, rel);
    if (!html.includes(`<p>${t.satz.replace("{name}", name)}</p>`)) throw new Error(`${rel}: Satz „${zustand}“ fehlt`);
    const other = site.kit[lang][zustand === "oeffentlich" ? "vorbereitung" : "oeffentlich"].satz.replace("{name}", "");
    if (html.includes(other)) throw new Error(`${rel}: Satz des anderen Zustands steht noch da`);
    const id = lang === "de" ? "vorbereitung" : "in-preparation";
    if (rel.includes("proje") && !(html.includes(`<h2 id="${id}">${t.titel}</h2>`) && html.includes(`<a href="#${id}">${t.titel}</a>`))) throw new Error(`${rel}: Titel „${t.titel}“ nicht in Überschrift und Inhaltsverzeichnis`);
  }
  return kitLinks(out);
}
check("Kit vorbereitung (zF1 = false): Satz an 4 Stellen, kein Link, Titel „In Vorbereitung“", (fx) => {
  if (kitCheck(fx, "vorbereitung") !== 0) throw new Error("Link auf das Kit trotz zF1 = false");
});
check("Kit öffentlich (zF1 = true): Satz mit Link an 4 Stellen, Titel wechselt mit", (fx) => {
  fx.state({ zF1: true });
  const n = kitCheck(fx, "oeffentlich");
  if (n !== 4) throw new Error(`${n} Links auf das Kit statt 4`);
});
check("ohne src/state.json gilt der engste Zustand (Kit ohne Link)", (fx) => {
  rmSync(join(fx.src, "state.json"));
  if (kitCheck(fx, "vorbereitung") !== 0) throw new Error("Link ohne Zustandsdatei");
});
check("ungültige src/state.json bricht ab", (fx) => { fx.state({ zF1: "ja" }); expectThrow(fx, /src\/state\.json ungültig: zF1/); });
check("Kit-Name wörtlich in einer Seite bricht ab", (fx) => { setBody(fx, "<p>Bald: team-skills-kit.</p>"); expectThrow(fx, /steht wörtlich in der Seite — nur über \{\{kit\}\}/); });
check("unvollständiger Kit-Zustand bricht ab, auch wenn er gerade nicht gilt", (fx) => { editSite(fx, (j) => { delete j.kit.en.oeffentlich.satz; }); expectThrow(fx, /kit\.en\.oeffentlich\.satz braucht genau einmal \{name\}/); });
check("{{kit:unbekannt}} bricht ab", (fx) => { setBody(fx, "<p>{{kit:unbekannt}}</p>"); expectThrow(fx, /erlaubt sind \{\{kit\}\} und \{\{kit:titel\}\}/); });

// Bedingter Text (R4b b5): {{if:F-nn}}…{{/if}} nur mit Schalter zE1 im privaten Zustand; ohne Schalter (oder ohne
// Datei) fehlt der Satz in site/, die OFFEN-Kennung bleibt fuer das Go-live-Tor. Geprueft an einer Testseite.
// Die vier Archivzeilen F-79–F-82 sind die Standardfassung (v2 §7; W4 „in beiden Faellen“ auf dem Archiv): sie stehen
// ohne Schalter, von der Antwort haengt nur ein Zusatz ab, den die OFFEN-Kennung haelt (P3-01, Welle F3).
const ARCHIV = [["archiv/index.html", "F-79", "Oktober 2026:"], ["archiv/index.html", "F-80", "github.io ersetzt"], ["en/archive/index.html", "F-81", "October 2026:"], ["en/archive/index.html", "F-82", "replaced a page on github.io"]];
check("Archivzeilen F-79–F-82 stehen ohne Schalter in site/, Kennungen bleiben (P3-01)", (fx) => {
  const out = build({ src: fx.src });
  for (const [rel, id, satz] of ARCHIV) {
    const html = page(out, rel);
    if (!html.includes(satz)) throw new Error(`${rel}: Zeile ${id} fehlt`);
    if (!html.includes(`<!--OFFEN:${id}-->`)) throw new Error(`${rel}: Kennung ${id} fehlt`);
  }
});
const IF_SAETZE = [["F-91", "Erster bedingter Testsatz."], ["F-92", "Zweiter bedingter Testsatz."]];
const ifBody = (fx) => setBody(fx, IF_SAETZE.map(([id, satz]) => `{{if:${id}}}<p>${satz}</p>{{/if}}{{todo:${id}}}`).join("\n"));
const ifCheck = (fx, released) => {
  const html = page(build({ src: fx.src }), "phototest.html");
  for (const [id, satz] of IF_SAETZE) {
    if (html.includes(satz) !== released.includes(id)) throw new Error(`Satz ${id} ${released.includes(id) ? "fehlt trotz" : "steht ohne"} Schalter`);
    if (!html.includes(`<!--OFFEN:${id}-->`)) throw new Error(`Kennung ${id} fehlt`);
  }
  if (/\{\{\/?if/.test(html)) throw new Error("{{if}} im Ergebnis");
};
check("ohne Schalter fehlen die bedingten Sätze, Kennungen bleiben", (fx) => { ifBody(fx); ifCheck(fx, []); });
check("Schlüssel zE1 fehlt in src/state.json: gültig, nichts ausgeliefert", (fx) => {
  ifBody(fx);
  const { zE1, ...ohne } = STATE_STRICT;
  writeFileSync(join(fx.src, "state.json"), JSON.stringify(ohne));
  ifCheck(fx, []);
});
check("ohne src/state.json fehlen sie ebenfalls (engster Zustand)", (fx) => { ifBody(fx); rmSync(join(fx.src, "state.json")); ifCheck(fx, []); });
check("Schalter zE1 = [F-91] liefert genau diesen Satz aus", (fx) => { ifBody(fx); fx.state({ zE1: ["F-91"] }); ifCheck(fx, ["F-91"]); });
// P3-01: Zurueckgehaltener Text ohne offene Kennung fiele still weg — das bricht ab; freigegebener Text braucht keine.
check("{{if}} ohne Freigabe und ohne {{todo}} bricht ab (P3-01)", (fx) => { setBody(fx, "{{if:F-91}}<p>a</p>{{/if}}"); expectThrow(fx, /\{\{if:F-91\}\} ist in zE1 nicht freigegeben und hat kein \{\{todo:F-91\}\} außerhalb der Klammer/); });
check("{{todo}} nur innerhalb der Klammer zählt nicht (P3-01)", (fx) => { setBody(fx, "{{if:F-91}}<p>a</p>{{todo:F-91}}{{/if}}"); expectThrow(fx, /\{\{if:F-91\}\} ist in zE1 nicht freigegeben/); });
check("{{todo}} einer anderen Kennung zählt nicht (P3-01)", (fx) => { setBody(fx, "{{if:F-91}}<p>a</p>{{/if}}{{todo:F-92}}"); expectThrow(fx, /\{\{if:F-91\}\} ist in zE1 nicht freigegeben/); });
check("freigegeben ohne {{todo}}: Text steht (Frage geschlossen)", (fx) => {
  setBody(fx, `{{if:F-91}}<p>${IF_SAETZE[0][1]}</p>{{/if}}`);
  fx.state({ zE1: ["F-91"] });
  if (!page(build({ src: fx.src }), "phototest.html").includes(IF_SAETZE[0][1])) throw new Error("freigegebener Satz fehlt");
});
check("Schalter zE1 kein Kennungs-Array bricht ab", (fx) => { fx.state({ zE1: "F-80" }); expectThrow(fx, /src\/state\.json ungültig: zE1/); });
check("{{if:Klartext}} bricht ab, Meldung ohne Klartext", (fx) => { setBody(fx, `{{if:${CLEAR}}}<p>x</p>{{/if}}`); noLeak(fx, /\{\{if:…\}\} — Klartext statt Kennung/); });
check("{{if}} verschachtelt bricht ab", (fx) => { setBody(fx, "{{if:F-91}}<p>a</p>{{if:F-92}}<p>b</p>{{/if}}{{/if}}"); expectThrow(fx, /verschachtelt oder ohne \{\{\/if\}\}/); });
check("{{if}} ohne {{/if}} bricht ab", (fx) => { setBody(fx, "{{if:F-91}}<p>a</p>"); expectThrow(fx, /ohne \{\{\/if\}\}/); });
check("{{/if}} ohne Anfang bricht ab", (fx) => { setBody(fx, "<p>a</p>{{/if}}"); expectThrow(fx, /\{\{\/if\}\} ohne Anfang/); });

// DE/EN-Zwillinge (P3-03): Die Paare stehen nur in IF_ZWILLINGE (lint-config). zE1 gibt ein Paar ganz oder gar nicht
// frei; steht eine Haelfte als {{if}} auf einer Seite, braucht die andere ihre Klammer in der anderen Sprache.
const [ZW_DE, ZW_EN] = IF_ZWILLINGE[0];
const EN_TEST = (body) => `<!--page\n{ "path": "/en/phototest.html", "lang": "en", "title": "Selftest twins", "description": "selftest only", "robots": "noindex", "updated": "2026-10-08" }\n-->\n<div class="prose"><h1>Test</h1>${body}</div>\n`;
const setEn = (fx, html) => writeFileSync(join(fx.src, "pages", "x", "phototest-en.html"), EN_TEST(html));
check(`Zwillinge: zE1 = [${ZW_DE}, ${ZW_EN}] (Paar vollständig) → Build läuft`, (fx) => { fx.state({ zE1: [ZW_DE, ZW_EN] }); build({ src: fx.src }); });
check(`Zwillinge: zE1 = [${ZW_DE}] (nur DE-Hälfte) → Abbruch`, (fx) => { fx.state({ zE1: [ZW_DE] }); expectThrow(fx, new RegExp(`src/state\\.json ungültig: zE1 gibt ${ZW_DE} frei, aber nicht seinen Zwilling ${ZW_EN}`)); });
check(`Zwillinge: zE1 = [${ZW_EN}] (nur EN-Hälfte) → Abbruch`, (fx) => { fx.state({ zE1: [ZW_EN] }); expectThrow(fx, new RegExp(`zE1 gibt ${ZW_EN} frei, aber nicht seinen Zwilling ${ZW_DE}`)); });
check("Zwillinge: {{if}} nur auf der DE-Seite, EN-Klammer fehlt → Abbruch", (fx) => {
  setBody(fx, `{{if:${ZW_DE}}}<p>a</p>{{/if}}{{todo:${ZW_DE}}}`);
  expectThrow(fx, new RegExp(`\\{\\{if:${ZW_DE}\\}\\} \\(DE\\) und \\{\\{if:${ZW_EN}\\}\\} \\(EN\\) sind Zwillinge`));
});
check("Zwillinge: Sprachen vertauscht (DE-Kennung auf EN-Seite) → Abbruch", (fx) => {
  setBody(fx, `{{if:${ZW_EN}}}<p>a</p>{{/if}}{{todo:${ZW_EN}}}`);
  setEn(fx, `{{if:${ZW_DE}}}<p>b</p>{{/if}}{{todo:${ZW_DE}}}`);
  expectThrow(fx, /sind Zwillinge/);
});
check("Zwillinge: Klammern in beiden Sprachen → Text nur bei Freigabe des ganzen Paars, dann in beiden", (fx) => {
  setBody(fx, `{{if:${ZW_DE}}}<p>Zwillingstest DE.</p>{{/if}}{{todo:${ZW_DE}}}`);
  setEn(fx, `{{if:${ZW_EN}}}<p>Twin test EN.</p>{{/if}}{{todo:${ZW_EN}}}`);
  let out = build({ src: fx.src });
  if (page(out, "phototest.html").includes("Zwillingstest") || page(out, "en/phototest.html").includes("Twin test")) throw new Error("Text ohne Freigabe ausgeliefert");
  fx.state({ zE1: [ZW_DE, ZW_EN] });
  out = build({ src: fx.src });
  if (!page(out, "phototest.html").includes("<p>Zwillingstest DE.</p>") || !page(out, "en/phototest.html").includes("<p>Twin test EN.</p>")) throw new Error("Paar freigegeben, Text fehlt");
});

// Privater Zustand fuer CI/Cloudflare (P3-04): src/state.json > SITE_PRIVATE_STATE > engster Zustand. Ungueltiges JSON in
// der Variable bricht ab (kein stiller Rueckfall); Meldungen nennen weder Inhalt noch Werte (CI-Logs sind oeffentlich).
const envState = (patch) => ({ SITE_PRIVATE_STATE: JSON.stringify({ ...STATE_STRICT, ...patch }) });
check("ohne Datei: SITE_PRIVATE_STATE wird benutzt (zF1 = true → 4 Kit-Links)", (fx) => {
  rmSync(join(fx.src, "state.json"));
  const n = kitLinks(build({ src: fx.src, env: envState({ zF1: true }) }));
  if (n !== 4) throw new Error(`${n} Kit-Links statt 4`);
});
check("Datei hat Vorrang vor SITE_PRIVATE_STATE", (fx) => {
  if (kitLinks(build({ src: fx.src, env: envState({ zF1: true }) })) !== 0) throw new Error("Variable statt Datei benutzt");
  build({ src: fx.src, env: { SITE_PRIVATE_STATE: "{kein JSON" } }); // Datei da: Variable wird gar nicht gelesen
});
check("SITE_PRIVATE_STATE kein JSON → Abbruch, Meldung ohne Inhalt", (fx) => {
  rmSync(join(fx.src, "state.json"));
  expectThrow(fx, /^SITE_PRIVATE_STATE ungültig: SITE_PRIVATE_STATE ist kein gültiges JSON \(Inhalt nicht ausgegeben\)$/, { SITE_PRIVATE_STATE: '{"zF1": Beispielwert' });
});
check("SITE_PRIVATE_STATE mit falschem Wert oder Schlüssel → Abbruch, weder Wert noch Name in der Meldung", (fx) => {
  rmSync(join(fx.src, "state.json"));
  for (const [env, re] of [[envState({ zB2: { Beispielfeld: "Beispielwert" } }), /zB2 ist nicht erlaubt \(Wert nicht ausgegeben\)/], [envState({ Beispielschluessel: 1 }), /ein Schlüssel \(Name nicht ausgegeben\) ist kein bekannter Schlüssel/], [envState({ zE1: ["F-80"] }), /zE1 gibt F-80 frei, aber nicht seinen Zwilling F-82/]]) {
    try { build({ src: fx.src, env }); } catch (e) {
      if (!re.test(e.message)) throw new Error(`falsche Meldung: ${e.message}`);
      if (/Beispiel/.test(e.message)) throw new Error("Meldung enthält Inhalt der Variable");
      continue;
    }
    throw new Error("Build lief durch, sollte abbrechen");
  }
});
check("SITE_PRIVATE_STATE leer = nicht gesetzt (engster Zustand)", (fx) => {
  rmSync(join(fx.src, "state.json"));
  if (kitLinks(build({ src: fx.src, env: { SITE_PRIVATE_STATE: " \n" } })) !== 0) throw new Error("Kit-Link ohne Zustand");
});
check("CI-Hinweis „Zustand NICHT GESETZT“ nur ohne Datei und ohne Variable", () => {
  const n = ciStateNote("strict");
  if (!n || !n.line.startsWith("::warning title=Zustand NICHT GESETZT::") || /[\r\n]/.test(n.line) || !n.summary.startsWith("### Zustand NICHT GESETZT")) throw new Error("Annotation fehlt oder mehrzeilig");
  if (ciStateNote("src/state.json") || ciStateNote("SITE_PRIVATE_STATE")) throw new Error("Annotation trotz Zustand");
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
