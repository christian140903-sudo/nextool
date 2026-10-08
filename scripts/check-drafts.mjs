#!/usr/bin/env node
// Prueft die Workshop-Entwuerfe (drafts/workshops/) so, als waeren sie live — ohne sie auszuliefern.
//   1. Temp-Kopie von src/ + Entwurfsseiten + Angebotsfakten + Navigationspunkt "Workshops" (Tuer)
//      -> build() -> Temp-site/ -> derselbe Site-Linter wie npm test (Sperrliste, Zahlen, Tueren,
//      Teilzeit nur auf der Workshops-Tuer, Links, hreflang ...). Fehler = Exit 1.
//   2. Die echte site/ darf die Entwuerfe weder enthalten noch verlinken noch in der Sitemap fuehren.
// Was die Schicht darunter im Fehlerfall schon selbst tut: nichts — build.mjs liest drafts/ nie.
// Ohne diesen Check faellt ein kaputter Entwurf erst beim Go-live (Schritt 2, nach T-Recht-1) auf.

import { mkdtempSync, cpSync, readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "./build.mjs";
import { lint } from "./lint-site.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DRAFTS = join(ROOT, "drafts", "workshops");
const PAGES = { "workshops.de.html": join("de", "workshops.html"), "workshops.en.html": join("en", "workshops.html") };
const NAV = {
  de: { id: "workshops", label: "Workshops", href: "/workshops/", door: "workshops" },
  en: { id: "workshops", label: "Workshops", href: "/en/workshops/", door: "workshops" },
};
const DRAFT_URLS = ["/workshops/", "/en/workshops/"];

function listFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...listFiles(p)); else out.push(p);
  }
  return out;
}

let failed = 0;
const fail = (m) => { failed++; console.log(`  FEHLER ${m}`); };

// --- 1. Entwurf in einer Temp-Site bauen und linten ---------------------------
const base = mkdtempSync(join(tmpdir(), "drafts-check-"));
try {
  const src = join(base, "src");
  cpSync(join(ROOT, "src"), src, { recursive: true });
  for (const [from, to] of Object.entries(PAGES)) cpSync(join(DRAFTS, from), join(src, "pages", to));
  const facts = JSON.parse(readFileSync(join(src, "facts.json"), "utf8"));
  const offer = JSON.parse(readFileSync(join(DRAFTS, "facts-angebot.json"), "utf8")).facts;
  for (const [k, v] of Object.entries(offer)) {
    if (facts.facts[k]) fail(`Angebotsfakt ${k} steht schon in src/facts.json (vor T-Recht-1 nicht erlaubt)`);
    facts.facts[k] = v;
  }
  writeFileSync(join(src, "facts.json"), JSON.stringify(facts, null, 2));
  const site = JSON.parse(readFileSync(join(src, "site.json"), "utf8"));
  for (const lang of ["de", "en"]) site.nav[lang].unshift(NAV[lang]);
  writeFileSync(join(src, "site.json"), JSON.stringify(site, null, 2));

  const out = build({ src });
  const siteDir = join(base, "site");
  for (const [rel, buf] of out) { mkdirSync(dirname(join(siteDir, rel)), { recursive: true }); writeFileSync(join(siteDir, rel), buf); }
  const priv = join(ROOT, ".site-private-denylist.txt");
  if (existsSync(priv)) cpSync(priv, join(base, ".site-private-denylist.txt"));

  const findings = lint({ siteDir, rootDir: base, gitCheck: false });
  const errors = findings.filter((f) => f.level === "error");
  const todos = findings.filter((f) => f.rule === "TODO-open" && /workshops/.test(f.where));
  for (const e of errors) fail(`${e.rule} ${e.where}: ${e.msg}`);
  for (const t of todos) console.log(`  offen  ${t.where}: ${t.msg}`);
  for (const u of DRAFT_URLS) if (!out.has(u.slice(1) + "index.html")) fail(`Entwurf ${u} wurde nicht gebaut`);
  console.log(`  ok    Entwurf gebaut und gelintet: ${errors.length} Fehler, ${todos.length} Seiten mit offenen Punkten`);
} catch (e) {
  fail(`Entwurf nicht baubar: ${e.message}`);
} finally {
  rmSync(base, { recursive: true, force: true });
}

// --- 2. Echte site/ enthaelt die Entwuerfe nicht -------------------------------
const real = join(ROOT, "site");
for (const f of listFiles(real)) {
  const rel = relative(real, f).split(sep).join("/");
  if (/^(en\/)?workshops\//.test(rel)) fail(`site/${rel}: Entwurf liegt in der Auslieferung`);
  if (/\.(html|xml|txt)$/.test(rel) || rel === "_redirects") {
    let t = readFileSync(f, "utf8");
    if (rel === "_redirects") t = t.split(/\r?\n/).filter((l) => !l.trim().startsWith("#")).join("\n"); // Kommentare duerfen Schritt 2 beschreiben
    for (const u of DRAFT_URLS) {
      if (t.includes(`"${u}"`) || t.includes(`>${u}<`) || t.includes(`nextool.app${u}`) || new RegExp(`\\s${u.replace(/\//g, "\\/")}\\s`).test(t)) fail(`site/${rel} verweist auf den Entwurf ${u}`);
    }
  }
}
console.log(failed ? `\ncheck-drafts: ${failed} Fehler.` : "  ok    site/ enthält und verlinkt die Entwürfe nicht\n\ncheck-drafts: Entwürfe baubar und regelkonform, nicht ausgeliefert.");
process.exit(failed ? 1 : 0);
