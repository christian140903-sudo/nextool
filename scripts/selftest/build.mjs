#!/usr/bin/env node
// Selbsttest des Builds (scripts/build.mjs): Jeder Mechanismus loest seinen Fehlerfall einmal aus.
//   Foto  — ohne foto.jpg Initialen statt <img>; mit sauberem JPEG <img> mit Breite/Hoehe;
//           EXIF, > 150 KB oder WebP ohne JPEG brechen den Build ab (fail-closed).
//   Tueren — auf einer Seite mit "door" fehlt der Navigationspunkt der anderen Tuer (§1.5).
// Arbeitet auf einer Temp-Kopie von src/; die echten Quellen bleiben unberuehrt.

import { mkdtempSync, cpSync, writeFileSync, readFileSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "../build.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

function seg(marker, body) {
  const head = Buffer.alloc(4);
  head[0] = 0xff; head[1] = marker; head.writeUInt16BE(body.length + 2, 2);
  return Buffer.concat([head, body]);
}
// Minimales JPEG-Geruest: SOI, optional APP1/Exif, SOF0 mit Groesse, optional Fuellkommentare, EOI.
function jpeg({ width = 4, height = 3, exif = false, padKB = 0 } = {}) {
  const parts = [Buffer.from([0xff, 0xd8])];
  if (exif) parts.push(seg(0xe1, Buffer.concat([Buffer.from("Exif\0\0", "latin1"), Buffer.alloc(16)])));
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
});
check("sauberes JPEG: <img> mit Breite/Höhe, Datei ausgeliefert", (fx) => {
  fx.asset("foto.jpg", jpeg({ width: 640, height: 800 }));
  const out = build({ src: fx.src });
  const html = page(out, "phototest.html");
  if (!html.includes('<img src="/assets/foto.jpg" alt="Christian Bucher" width="640" height="800"')) throw new Error("img fehlt oder ohne Maße");
  if (html.includes("foto.webp")) throw new Error("webp-Quelle ohne Datei");
  if (!out.has("assets/foto.jpg")) throw new Error("foto.jpg nicht im Ergebnis");
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
check("unbekannte Fotogröße bricht ab", (fx) => {
  writeFileSync(join(fx.src, "pages", "x", "phototest.html"), TEST_PAGE.replace("{{photo:small}}", "{{photo:riesig}}"));
  expectThrow(fx, /Größe muss/);
});
check("{{todo}} wird HTML-Kommentar, Absatz nur mit Notiz entfällt", (fx) => {
  writeFileSync(join(fx.src, "pages", "x", "phototest.html"), TEST_PAGE.replace("{{photo:small}}", "<p>{{todo:Notiz eins}}</p><p>Text {{todo:Notiz zwei}}</p>"));
  const html = page(build({ src: fx.src }), "phototest.html");
  if (/<mark|data-todo/.test(html)) throw new Error("sichtbare Marke im Ergebnis");
  if (!html.includes("</picture><!--OFFEN: Notiz eins-->") && !html.includes("CB</div><!--OFFEN: Notiz eins-->")) throw new Error("Notiz eins nicht als freier Kommentar (leerer <p> geblieben?)");
  if (!html.includes("<p>Text <!--OFFEN: Notiz zwei--></p>")) throw new Error("Notiz zwei nicht als Kommentar im Absatz");
});
check("Absatz mit Text zwischen zwei Notizen bleibt erhalten", (fx) => {
  writeFileSync(join(fx.src, "pages", "x", "phototest.html"), TEST_PAGE.replace("{{photo:small}}", "<p>{{todo:a}} sichtbarer Text {{todo:b}}</p>"));
  const html = page(build({ src: fx.src }), "phototest.html");
  if (!html.includes("<p><!--OFFEN: a--> sichtbarer Text <!--OFFEN: b--></p>")) throw new Error("Absatz-Rahmen um sichtbaren Text entfernt");
});
check("{{todo}} mit -- bricht ab (Kommentar darf nicht vorzeitig enden)", (fx) => {
  writeFileSync(join(fx.src, "pages", "x", "phototest.html"), TEST_PAGE.replace("{{photo:small}}", "{{todo:a --> b}}"));
  expectThrow(fx, /darf weder "--"/);
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

console.log(`\nselftest build: ${total - failed} von ${total} Fällen wie erwartet.`);
process.exit(failed ? 1 : 0);
