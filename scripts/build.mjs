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

function renderFact(key, lang, facts) {
  const f = facts[key];
  if (!f) throw new Error(`unbekannter Fakt: ${key}`);
  if (!f.source || !f.verified) throw new Error(`Fakt ${key} ohne source/verified`);
  const display = f[lang] ?? f.display ?? f.value;
  return `<data value="${esc(f.value)}" data-fact="${esc(key)}">${esc(display)}</data>`;
}

function expand(body, page, ctx) {
  const lang = page.meta.lang;
  return body.replace(/\{\{([a-z]+)(?::([^}]*))?\}\}/g, (m, kind, arg = "") => {
    switch (kind) {
      case "fact": return renderFact(arg.trim(), lang, ctx.facts);
      case "date": return `<time datetime="${esc(arg)}">${esc(formatDate(arg.trim(), lang))}</time>`;
      case "time": {
        const [iso, label] = arg.split("|");
        if (!iso || !label) throw new Error(`{{time:ISO|Text}} erwartet, gefunden ${m}`);
        return `<time datetime="${esc(iso)}">${esc(label)}</time>`;
      }
      case "todo": return `<mark class="todo" data-todo="">${arg}</mark>`;
      case "email": return `<a href="mailto:${esc(ctx.site.email)}">${esc(ctx.site.email)}</a>`;
      default: throw new Error(`${relative(ROOT, page.file)}: unbekannter Platzhalter ${m}`);
    }
  });
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
  const nav = site.nav[meta.lang].map((item) => {
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

export function build() {
  const site = JSON.parse(readFileSync(join(SRC, "site.json"), "utf8"));
  const factsRaw = readFileSync(join(SRC, "facts.json"), "utf8");
  const facts = JSON.parse(factsRaw).facts;
  for (const [k, f] of Object.entries(facts)) {
    if (!f.value || !f.source || !/^\d{4}-\d{2}-\d{2}$/.test(f.verified || "")) throw new Error(`facts.json: ${k} braucht value, source, verified (JJJJ-MM-TT)`);
  }
  const ctx = { site, facts };
  const out = new Map();
  const pages = listFiles(join(SRC, "pages")).filter((f) => f.endsWith(".html")).map(parsePage);
  const seen = new Set();
  for (const p of pages) {
    if (seen.has(p.meta.path)) throw new Error(`Pfad doppelt: ${p.meta.path}`);
    seen.add(p.meta.path);
  }
  for (const p of pages) {
    if (p.meta.pair && !seen.has(p.meta.pair)) throw new Error(`${p.meta.path}: Sprachpaar ${p.meta.pair} existiert nicht`);
    out.set(outPath(p.meta.path), Buffer.from(layout(p, expand(p.body, p, ctx), ctx), "utf8"));
  }
  for (const f of listFiles(join(SRC, "static"))) {
    const rel = relative(join(SRC, "static"), f).split(sep).join("/");
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
