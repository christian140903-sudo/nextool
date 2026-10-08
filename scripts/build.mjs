#!/usr/bin/env node
// Build fuer nextool.app: src/ -> site/ (nur site/ wird ausgeliefert).
// Ohne Abhaengigkeiten, deterministisch (kein Datum aus der Uhr; zweimal bauen = gleiche Bytes).
//
//   node scripts/build.mjs           schreibt site/ (synchronisiert: entfernt verwaiste Dateien)
//   node scripts/build.mjs --check   baut im Speicher und vergleicht mit site/; Exit 1 bei Abweichung
//
// Was die Schicht darunter im Fehlerfall schon selbst tut: nichts — Cloudflare Pages
// liefert aus, was in site/ liegt. Deshalb bricht dieser Build bei jedem unbekannten
// Platzhalter, fehlenden Fakt oder kaputten Seitenkopf ab (fail-closed).

import { readFileSync, readdirSync, statSync, mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join, dirname, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");
const OUT = join(ROOT, "site");

// Foto (Positionierung §7.7): src/static/assets/foto.jpg (Pflicht, wenn ein Foto erscheinen soll)
// und optional foto.webp. Fehlt foto.jpg, rendert {{photo:...}} Initialen statt eines <img> —
// so verweist keine Seite auf eine fehlende Datei. Ist es da, bricht der Build ab, wenn
// Metadaten (EXIF/XMP/IPTC: koennen Aufnahmeort und Geraet verraten) oder > 150 KB.
const PHOTO_SIZES = ["large", "medium", "small"];
const PHOTO_MAX_BYTES = 150 * 1024;

const MONTHS = {
  de: ["Jänner", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};

function listFiles(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...listFiles(p));
    else out.push(p);
  }
  return out;
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function formatDate(iso, lang) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) throw new Error(`Datum nicht im Format JJJJ-MM-TT: ${iso}`);
  const [, y, mo, d] = m;
  const month = MONTHS[lang][Number(mo) - 1];
  return lang === "de" ? `${Number(d)}. ${month} ${y}` : `${Number(d)} ${month} ${y}`;
}

function parsePage(file) {
  const raw = readFileSync(file, "utf8");
  const m = /^<!--page\s*([\s\S]*?)-->\s*/.exec(raw);
  if (!m) throw new Error(`${relative(ROOT, file)}: Seitenkopf <!--page {...} --> fehlt`);
  let meta;
  try { meta = JSON.parse(m[1]); } catch (e) { throw new Error(`${relative(ROOT, file)}: Seitenkopf ist kein JSON: ${e.message}`); }
  for (const k of ["path", "lang", "title", "description", "updated"]) {
    if (!meta[k]) throw new Error(`${relative(ROOT, file)}: Seitenkopf ohne "${k}"`);
  }
  if (!["de", "en"].includes(meta.lang)) throw new Error(`${relative(ROOT, file)}: lang muss de oder en sein`);
  formatDate(meta.updated, meta.lang);
  return { meta, body: raw.slice(m[0].length), file };
}

// Liest Breite/Hoehe aus dem SOF-Segment und meldet Metadaten-Segmente (APP1 = EXIF/XMP, APP13 = IPTC).
export function jpegInfo(buf, name = "foto.jpg") {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) throw new Error(`${name}: keine JPEG-Datei`);
  let i = 2, width = 0, height = 0;
  const meta = [];
  while (i + 4 <= buf.length) {
    if (buf[i] !== 0xff) throw new Error(`${name}: JPEG-Struktur unlesbar bei Byte ${i}`);
    while (buf[i + 1] === 0xff) i++; // Fuellbytes
    const marker = buf[i + 1];
    if (marker === 0xd9 || marker === 0xda) break; // Bildende / Bilddaten
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
    const len = buf.readUInt16BE(i + 2);
    if (marker === 0xe1) meta.push(buf.subarray(i + 4, i + 8).toString("latin1") === "Exif" ? "EXIF" : "XMP/APP1");
    if (marker === 0xed) meta.push("IPTC/APP13");
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      height = buf.readUInt16BE(i + 5);
      width = buf.readUInt16BE(i + 7);
    }
    i += 2 + len;
  }
  if (!width || !height) throw new Error(`${name}: Bildgröße nicht lesbar`);
  return { width, height, meta };
}

function webpMeta(buf) {
  if (buf.subarray(0, 4).toString("latin1") !== "RIFF" || buf.subarray(8, 12).toString("latin1") !== "WEBP") throw new Error("foto.webp: keine WebP-Datei");
  const meta = [];
  for (let i = 12; i + 8 <= buf.length;) {
    const id = buf.subarray(i, i + 4).toString("latin1");
    if (id === "EXIF" || id === "XMP ") meta.push(id.trim());
    i += 8 + buf.readUInt32LE(i + 4) + (buf.readUInt32LE(i + 4) % 2);
  }
  return meta;
}

function loadPhoto(src) {
  const jpg = join(src, "static", "assets", "foto.jpg");
  const webp = join(src, "static", "assets", "foto.webp");
  if (!existsSync(jpg)) {
    if (existsSync(webp)) throw new Error("foto.webp ohne foto.jpg — JPEG ist der Pflicht-Fallback (§7.7)");
    return null;
  }
  const buf = readFileSync(jpg);
  const info = jpegInfo(buf);
  const problems = [];
  if (buf.length > PHOTO_MAX_BYTES) problems.push(`foto.jpg ist ${Math.round(buf.length / 1024)} KB (> 150 KB)`);
  if (info.meta.length) problems.push(`foto.jpg enthält Metadaten (${info.meta.join(", ")}) — vor dem Einchecken entfernen`);
  let hasWebp = false;
  if (existsSync(webp)) {
    const w = readFileSync(webp);
    if (w.length > PHOTO_MAX_BYTES) problems.push(`foto.webp ist ${Math.round(w.length / 1024)} KB (> 150 KB)`);
    const m = webpMeta(w);
    if (m.length) problems.push(`foto.webp enthält Metadaten (${m.join(", ")})`);
    hasWebp = true;
  }
  if (problems.length) throw new Error(problems.join("; "));
  return { width: info.width, height: info.height, webp: hasWebp };
}

function renderPhoto(size, ctx) {
  if (!PHOTO_SIZES.includes(size)) throw new Error(`{{photo:${size}}}: Größe muss ${PHOTO_SIZES.join("|")} sein`);
  const p = ctx.photo;
  if (!p) {
    const initials = ctx.site.name.split(/\s+/).map((w) => w[0]).join("").toUpperCase();
    return `<div class="portrait portrait-${size} portrait-initials" aria-hidden="true">${esc(initials)}</div>`;
  }
  const source = p.webp ? `<source srcset="/assets/foto.webp" type="image/webp">` : "";
  return `<picture class="portrait portrait-${size}">${source}<img src="/assets/foto.jpg" alt="${esc(ctx.site.name)}" width="${p.width}" height="${p.height}" decoding="async"${size === "large" ? "" : ' loading="lazy"'}></picture>`;
}

function renderFact(key, lang, facts) {
  const f = facts[key];
  if (!f) throw new Error(`unbekannter Fakt: ${key}`);
  if (!f.source || !f.verified) throw new Error(`Fakt ${key} ohne source/verified`);
  const display = f[lang] ?? f.display ?? f.value;
  return `<data value="${esc(f.value)}" data-fact="${esc(key)}">${esc(display)}</data>`;
}

// Interne Notiz / offener Punkt (OFFEN-Mechanik): {{todo:Text}} wird ein HTML-Kommentar
// <!--OFFEN: Text-->, nie sichtbarer Text (Nachbesserung 11: interne Hinweise gehoeren nicht auf
// die Seite). Der Linter zaehlt diese Kommentare; im Release-Modus ist jeder ein Fehler (Go-live-Tor).
// Text, der den Kommentar vorzeitig beenden oder verschachteln koennte, bricht den Build ab.
export function offenComment(text, where = "") {
  const t = text.trim();
  if (!t) throw new Error(`${where}: leerer {{todo:}}`);
  if (/--|<!-|-$/.test(t)) throw new Error(`${where}: {{todo:…}} darf weder "--" noch "<!-" enthalten noch auf "-" enden (HTML-Kommentar): ${t.slice(0, 60)}`);
  return `<!--OFFEN: ${t}-->`;
}
// Absaetze, die nach dem Umwandeln nur noch aus OFFEN-Kommentaren bestehen, faellt der leere Rahmen weg.
const EMPTY_P = /<p(?:\s[^>]*)?>((?:\s*<!--OFFEN: [\s\S]*?-->)+)\s*<\/p>/g;

function expand(body, page, ctx) {
  const lang = page.meta.lang;
  const where = relative(ROOT, page.file);
  return body.replace(/\{\{([a-z]+)(?::([^}]*))?\}\}/g, (m, kind, arg = "") => {
    switch (kind) {
      case "fact": return renderFact(arg.trim(), lang, ctx.facts);
      case "date": return `<time datetime="${esc(arg)}">${esc(formatDate(arg.trim(), lang))}</time>`;
      case "time": {
        const [iso, label] = arg.split("|");
        if (!iso || !label) throw new Error(`{{time:ISO|Text}} erwartet, gefunden ${m}`);
        return `<time datetime="${esc(iso)}">${esc(label)}</time>`;
      }
      case "todo": return offenComment(arg, where);
      case "email": return `<a href="mailto:${esc(ctx.site.email)}">${esc(ctx.site.email)}</a>`;
      case "photo": return renderPhoto(arg.trim(), ctx);
      default: throw new Error(`${where}: unbekannter Platzhalter ${m}`);
    }
  }).replace(EMPTY_P, "$1");
}

function outPath(urlPath) {
  if (urlPath.endsWith(".html")) return urlPath.slice(1);
  if (!urlPath.endsWith("/")) throw new Error(`Seitenpfad muss mit / oder .html enden: ${urlPath}`);
  return (urlPath.slice(1) + "index.html");
}

function layout(page, html, ctx) {
  const { meta } = page;
  const { site } = ctx;
  const s = site.strings[meta.lang];
  const other = meta.lang === "de" ? "en" : "de";
  const abs = (p) => site.origin + p;
  const canonical = meta.path.endsWith(".html") ? null : abs(meta.path);
  const alt = [];
  if (meta.pair) {
    const de = meta.lang === "de" ? meta.path : meta.pair;
    const en = meta.lang === "en" ? meta.path : meta.pair;
    alt.push(`<link rel="alternate" hreflang="de" href="${abs(de)}">`);
    alt.push(`<link rel="alternate" hreflang="en" href="${abs(en)}">`);
    alt.push(`<link rel="alternate" hreflang="x-default" href="${abs(site.xDefault)}">`);
  }
  const langTarget = meta.pair || site.strings[other].home;
  // Zwei Tueren verlinken sich nicht (Positionierung §1.5): Auf einer Tuer-Seite (meta.door)
  // fehlen Navigationspunkte, die zur jeweils anderen Tuer gehoeren (item.door).
  const nav = site.nav[meta.lang].filter((item) => !(meta.door && item.door && item.door !== meta.door)).map((item) => {
    const cur = item.id === meta.nav ? ' aria-current="page"' : "";
    return `<li><a href="${item.href}"${cur}>${esc(item.label)}</a></li>`;
  });
  nav.push(`<li class="lang-switch"><a href="${langTarget}" hreflang="${other}" lang="${other}">${esc(s.langLink)}</a></li>`);
  const footerLinks = s.footerNav.map((l) => `<li><a href="${l.href}">${esc(l.label)}</a></li>`).join("");
  const robots = meta.robots || "index,follow";
  const ogImage = abs(meta.ogImage || `/assets/og-${meta.lang}.png`);
  const ogAlt = meta.lang === "de"
    ? "Christian Bucher — Ich führe KI-Coding-Agenten zu getesteter, veröffentlichter Software und messe, ob es wirklich wirkt. nextool.app"
    : "Christian Bucher — I direct AI coding agents to ship tested software and measure whether what I built actually worked. nextool.app";
  const head = [
    `<!doctype html>`,
    `<html lang="${meta.lang}" dir="ltr">`,
    `<head>`,
    `<meta charset="utf-8">`,
    `<meta name="viewport" content="width=device-width, initial-scale=1">`,
    `<title>${esc(meta.title)}</title>`,
    `<meta name="description" content="${esc(meta.description)}">`,
    `<meta name="robots" content="${esc(robots)}">`,
    canonical ? `<link rel="canonical" href="${canonical}">` : "",
    ...alt,
    `<meta name="color-scheme" content="dark light">`,
    `<meta name="theme-color" content="#0b0c0e" media="(prefers-color-scheme: dark)">`,
    `<meta name="theme-color" content="#fbf8f3" media="(prefers-color-scheme: light)">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${esc(site.name)}">`,
    `<meta property="og:title" content="${esc(meta.title)}">`,
    `<meta property="og:description" content="${esc(meta.description)}">`,
    canonical ? `<meta property="og:url" content="${canonical}">` : "",
    `<meta property="og:image" content="${ogImage}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:image:alt" content="${esc(ogAlt)}">`,
    `<meta property="og:locale" content="${meta.lang === "de" ? "de_AT" : "en_GB"}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<link rel="icon" href="/favicon.svg" type="image/svg+xml">`,
    `<link rel="preload" href="/assets/fonts/inter-latin-var.woff2" as="font" type="font/woff2" crossorigin>`,
    `<link rel="stylesheet" href="/assets/site.css">`,
    `</head>`,
  ].filter(Boolean);
  const bodyHtml = [
    `<body>`,
    `<a class="skip-link" href="#inhalt">${esc(s.skip)}</a>`,
    `<header class="site-header"><div class="wrap">`,
    `<a class="brand" href="${s.home}">${esc(site.name)}</a>`,
    `<nav class="site-nav" aria-label="${esc(s.navLabel)}"><ul>${nav.join("")}</ul></nav>`,
    `</div></header>`,
    `<main id="inhalt"><div class="wrap">`,
    html.trim(),
    `</div></main>`,
    `<footer class="site-footer"><div class="wrap">`,
    `<p><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></p>`,
    `<ul>${footerLinks}</ul>`,
    `<p>${esc(s.updated)}: <time datetime="${meta.updated}">${esc(formatDate(meta.updated, meta.lang))}</time></p>`,
    `<p>${esc(s.colophon)}</p>`,
    `</div></footer>`,
    `</body>`,
    `</html>`,
  ];
  return head.join("\n") + "\n" + bodyHtml.join("\n") + "\n";
}

function sitemap(pages, site) {
  const idx = pages.filter((p) => !(p.meta.robots || "").includes("noindex") && !p.meta.path.endsWith(".html"));
  idx.sort((a, b) => a.meta.path.localeCompare(b.meta.path));
  const lines = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">`,
  ];
  for (const p of idx) {
    lines.push(`  <url>`);
    lines.push(`    <loc>${site.origin}${p.meta.path}</loc>`);
    lines.push(`    <lastmod>${p.meta.updated}</lastmod>`);
    if (p.meta.pair) {
      const de = p.meta.lang === "de" ? p.meta.path : p.meta.pair;
      const en = p.meta.lang === "en" ? p.meta.path : p.meta.pair;
      lines.push(`    <xhtml:link rel="alternate" hreflang="de" href="${site.origin}${de}"/>`);
      lines.push(`    <xhtml:link rel="alternate" hreflang="en" href="${site.origin}${en}"/>`);
      lines.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${site.origin}${site.xDefault}"/>`);
    }
    lines.push(`  </url>`);
  }
  lines.push(`</urlset>`);
  return lines.join("\n") + "\n";
}

export function build({ src = SRC } = {}) {
  const site = JSON.parse(readFileSync(join(src, "site.json"), "utf8"));
  const factsRaw = readFileSync(join(src, "facts.json"), "utf8");
  const facts = JSON.parse(factsRaw).facts;
  for (const [k, f] of Object.entries(facts)) {
    if (!f.value || !f.source || !/^\d{4}-\d{2}-\d{2}$/.test(f.verified || "")) throw new Error(`facts.json: ${k} braucht value, source, verified (JJJJ-MM-TT)`);
  }
  const ctx = { site, facts, photo: loadPhoto(src) };
  const out = new Map();
  const pages = listFiles(join(src, "pages")).filter((f) => f.endsWith(".html")).map(parsePage);
  const seen = new Set();
  for (const p of pages) {
    if (seen.has(p.meta.path)) throw new Error(`Pfad doppelt: ${p.meta.path}`);
    seen.add(p.meta.path);
  }
  for (const p of pages) {
    if (p.meta.pair && !seen.has(p.meta.pair)) throw new Error(`${p.meta.path}: Sprachpaar ${p.meta.pair} existiert nicht`);
    out.set(outPath(p.meta.path), Buffer.from(layout(p, expand(p.body, p, ctx), ctx), "utf8"));
  }
  for (const f of listFiles(join(src, "static"))) {
    const rel = relative(join(src, "static"), f).split(sep).join("/");
    if (out.has(rel)) throw new Error(`Datei doppelt: ${rel}`);
    out.set(rel, readFileSync(f));
  }
  out.set("facts.json", Buffer.from(factsRaw, "utf8"));
  out.set("sitemap.xml", Buffer.from(sitemap(pages, site), "utf8"));
  return out;
}

function main() {
  const check = process.argv.includes("--check");
  let out;
  try { out = build(); } catch (e) { console.error(`BUILD FEHLER: ${e.message}`); process.exit(2); }
  const existing = new Set(listFiles(OUT).map((f) => relative(OUT, f).split(sep).join("/")));
  const diffs = [];
  for (const [rel, buf] of out) {
    const p = join(OUT, rel);
    const same = existing.has(rel) && Buffer.compare(readFileSync(p), buf) === 0;
    if (!same) diffs.push((existing.has(rel) ? "geändert: " : "neu:      ") + rel);
    if (!same && !check) { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, buf); }
  }
  for (const rel of [...existing].sort()) {
    if (!out.has(rel)) {
      diffs.push("verwaist: " + rel);
      if (!check) rmSync(join(OUT, rel));
    }
  }
  if (check) {
    if (diffs.length) {
      console.error(`site/ passt nicht zum Quellstand (${diffs.length} Abweichungen) — bitte "npm run build" ausführen und committen:`);
      for (const d of diffs.slice(0, 40)) console.error("  " + d);
      process.exit(1);
    }
    console.log(`build --check: site/ entspricht dem Quellstand (${out.size} Dateien).`);
  } else {
    console.log(`build: ${out.size} Dateien, ${diffs.length} geschrieben/entfernt.`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
