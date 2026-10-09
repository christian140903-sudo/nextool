#!/usr/bin/env node
// Site-Linter v2 fuer nextool.app ("npm test"). Ersetzt den alten Linter, der feste
// Versions-Strings (4.0.1/358) erzwang und damit Korrekturen bestrafte.
//
// Prueft die AUSGELIEFERTE Fassung (site/), nicht die Quellen:
//   Struktur · Kopfangaben (title/description/lang/canonical/og) · DE/EN-Paare · Tuer-Trennung
//   keine fremden Ressourcen, keine Skripte, keine Inline-Styles · interne Links + Anker
//   Zahlen nur aus facts.json (mit Quelle + Datum) · Sperrliste + widerrufene Zahlen
//   Privatdaten-Muster + private Sperrliste (Arbeitgeber, Heimatort; nur per Datei/Secret)
//   _headers (CSP, HSTS ohne preload …) · _redirects (Syntax, Ziele, keine verdeckten Seiten)
//   Abdeckung aller Alt-URLs (src/legacy-urls.txt) · Sitemap/robots · Farbkontraste (WCAG AA)
//   offene Punkte (<!--OFFEN:F-nn--> aus {{todo:F-nn}}), nur inhaltsleere HTML-Kommentare (R-03),
//   sichtbare Notizen/Platzhalter · Commit-Nachrichten
//   Abmelde-Worker sw.js · Audit T1–T18 der Website-Session, soweit sie hier passen (Sprachlink,
//   Ueberschriften, "Stand", noindex-Ausnahmen, target, Positivliste Dateitypen, Schriftlizenzen,
//   Sitemap-Form/hreflang, strukturierte Daten, Stufe 1 ohne Angebotssprache); jede dieser Regeln
//   nennt ihre Nummer ("Audit Tn") in Kommentar oder Meldung
//
//   node scripts/lint-site.mjs            normale Pruefung (offene Punkte = Warnung)
//   node scripts/lint-site.mjs --release  Freigabe: offene Punkte, fehlende private Liste,
//                                         nicht pruefbare Commits = Fehler (fail-closed)
//
// Was die Schicht darunter im Fehlerfall schon selbst tut: Cloudflare Pages liefert jede
// Datei in site/ ungeprueft aus; Browser melden CSP-Verstoesse nur in der Konsole. Daher
// muss dieser Linter VOR dem Deployment rot werden.
//
// Privatdaten-Treffer werden NIE im Klartext ausgegeben (CI-Logs sind oeffentlich).

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, relative, sep, posix } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { Script } from "node:vm";
import { tokenize, walk, textBlocks, collapse } from "./lib/html.mjs";
import { parseHeaders, headersFor } from "./lib/cf-headers.mjs";
import * as C from "./lint-config.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function listFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...listFiles(p));
    else out.push(p);
  }
  return out;
}

// Privatdaten-Treffer nie zeigen, auch nicht teilweise: nur die Laenge (CI-Logs sind oeffentlich).
const mask = (s) => `${[...s].length} Zeichen`;

// ---------------------------------------------------------------------------
// Farbkontrast (WCAG 2.x relative Luminanz)
// ---------------------------------------------------------------------------
function hexToRgb(h) {
  let x = h.replace("#", "");
  if (x.length === 3) x = x.split("").map((c) => c + c).join("");
  return [0, 2, 4].map((i) => parseInt(x.slice(i, i + 2), 16) / 255);
}
function lum(h) {
  const [r, g, b] = hexToRgb(h).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a, b) {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
function tokensOf(block) {
  const t = {};
  for (const m of block.matchAll(/--([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;/g)) t[m[1]] = m[2];
  return t;
}

// ---------------------------------------------------------------------------
// _redirects: Parser + Simulation (Cloudflare-Pages-Semantik, vereinfacht)
// ---------------------------------------------------------------------------
export function parseRedirects(text) {
  const rules = [];
  const errors = [];
  text.split(/\r?\n/).forEach((line, i) => {
    const l = line.trim();
    if (!l || l.startsWith("#")) return; // nur ganze Kommentarzeilen; '#' im Ziel ist ein Anker
    const parts = l.split(/\s+/);
    if (parts.length < 2 || parts.length > 3) { errors.push({ line: i + 1, msg: `Zeile hat ${parts.length} Felder` }); return; }
    const [src, dest, code = "302"] = parts;
    rules.push({ src, dest, code, explicitCode: parts.length === 3, length: line.length, line: i + 1, dynamic: /[*:]/.test(src) });
  });
  return { rules, errors };
}
function ruleRegex(src) {
  let re = "";
  for (const part of src.split(/(\*|:[A-Za-z]\w*)/)) {
    if (part === "*") re += "(.*)";
    else if (/^:[A-Za-z]\w*$/.test(part)) re += "([^/]+)";
    else re += part.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${re}$`);
}

class Site {
  constructor(dir) {
    this.dir = dir;
    this.files = new Set(listFiles(dir).map((f) => relative(dir, f).split(sep).join("/")));
    this.pages = new Map(); // urlPath -> {file, html, tokens, ids, ...}
  }
  fileFor(url) {
    const p = decodeURIComponent(url.split(/[?#]/)[0]);
    if (!p.startsWith("/")) return null;
    const rel = p.slice(1);
    if (p.endsWith("/")) return this.files.has(rel + "index.html") ? rel + "index.html" : null;
    if (this.files.has(rel)) return rel;
    if (this.files.has(rel + ".html")) return rel + ".html";
    if (this.files.has(rel + "/index.html")) return rel + "/index.html"; // Pages leitet /x -> /x/ um
    return null;
  }
}

function urlOfFile(rel) {
  if (rel === "index.html") return "/";
  if (rel.endsWith("/index.html")) return "/" + rel.slice(0, -"index.html".length);
  return "/" + rel;
}

// ---------------------------------------------------------------------------
// Hauptpruefung
// ---------------------------------------------------------------------------
export function lint({ siteDir = join(ROOT, "site"), rootDir = ROOT, release = false, privateTerms = null, gitCheck = true } = {}) {
  const findings = [];
  const add = (level, rule, where, msg) => findings.push({ level, rule, where, msg });
  const err = (r, w, m) => add("error", r, w, m);
  const warn = (r, w, m) => add(release ? "error" : "warn", r, w, m);
  const info = (r, w, m) => add("info", r, w, m);

  if (!existsSync(siteDir)) { err("STRUCT-missing", siteDir, "site/ fehlt"); return findings; }
  const site = new Site(siteDir);

  // --- Struktur -------------------------------------------------------------
  for (const f of C.REQUIRED_FILES) if (!site.files.has(f)) err("STRUCT-required", f, "Pflichtdatei fehlt");
  for (const f of site.files) {
    if (C.FORBIDDEN_FILE_PATTERNS.some((re) => re.test(f))) err("STRUCT-forbidden-file", f, "darf nicht ausgeliefert werden");
    for (const b of C.BANNED) if (b.scope === "all" && b.re.test(f)) err("TXT-banned", f, `Dateiname trifft Sperrliste (${b.id})`);
    if (!C.ALLOWED_FILE.test(f)) err("STRUCT-unexpected-file", f, "Dateityp steht nicht auf der Positivliste (lint-config ALLOWED_FILE; Audit T5/T11)");
  }
  // Schriften nur mit Lizenztext daneben (Audit T10; OFL 1.1 verlangt die Lizenz bei Weitergabe).
  // Zuordnung ueber den Namen: "Inter-OFL.txt" deckt "inter-latin-var.woff2", "JetBrainsMono-OFL.txt" "jetbrains-mono-…".
  const letters = (x) => x.toLowerCase().replace(/[^a-z]/g, "");
  for (const f of site.files) {
    if (!/\.(?:woff2?|ttf|otf)$/.test(f)) continue;
    const dir = posix.dirname(f), font = letters(posix.basename(f).replace(/\.[^.]+$/, ""));
    const lic = [...site.files].filter((g) => posix.dirname(g) === dir && /-OFL\.txt$/i.test(g)).map((g) => letters(posix.basename(g).replace(/-OFL\.txt$/i, "")));
    if (!lic.some((l) => l && font.startsWith(l))) err("STRUCT-font-license", f, "kein passender Lizenztext (<Familie>-OFL.txt) im selben Ordner");
  }

  // --- facts.json -------------------------------------------------------------
  let facts = {};
  let factsText = "";
  try {
    factsText = readFileSync(join(siteDir, "facts.json"), "utf8");
    facts = JSON.parse(factsText).facts || {};
    for (const [k, f] of Object.entries(facts)) {
      if (!f.value || !f.source || !/^\d{4}-\d{2}-\d{2}$/.test(f.verified || "")) err("FACTS-schema", "facts.json", `${k}: value, source und verified (JJJJ-MM-TT) sind Pflicht`);
      // Ausgelieferte facts.json ohne interne Felder (Pruefbericht 9): der Build entfernt sie
      for (const key of C.FACTS_INTERNAL_KEYS) if (key in f) err("FACTS-internal", "facts.json", `${k}: internes Feld „${key}“ wird ausgeliefert`);
    }
  } catch (e) { err("FACTS-schema", "facts.json", `nicht lesbar: ${e.message}`); }
  for (const re of C.FACTS_INTERNAL) {
    const m = re.exec(factsText);
    if (m) err("FACTS-internal", "facts.json", `interner Verweis „${m[0]}“ in der ausgelieferten facts.json — gehört in source_internal`);
  }

  // --- README.md im oeffentlichen Repository (R-03) ----------------------------
  // Auch dort nur inhaltsleere Kommentare; ein <!--OFFEN:F-nn--> ist ein Go-live-Tor wie auf den Seiten.
  const readme = join(rootDir, "README.md");
  if (existsSync(readme)) {
    const comments = [...readFileSync(readme, "utf8").matchAll(/<!--([\s\S]*?)-->/g)].map((m) => m[1].trim());
    for (const c of comments) if (!C.COMMENT_ALLOWED.test(c)) err("NOTE-comment", "README.md", `Kommentar mit Klartext (${c.length} Zeichen, Inhalt nicht ausgegeben) — nur <!--OFFEN:F-nn--> erlaubt`);
    const open = comments.filter((c) => /^OFFEN:/.test(c)).length;
    if (open) warn("TODO-open", "README.md", `${open} offene Punkte (<!--OFFEN:F-nn-->)`);
  }

  // --- Basis-URL nur in src/site.json (R4 a13) ----------------------------------
  // Fuer den Domainwechsel muss die Adresse an genau einer Stelle stehen. Geprueft werden die Quellen
  // (src/, scripts/), nicht site/: dort steht sie zu Recht ueberall (canonical, hreflang, OG, Sitemap).
  {
    const re = new RegExp(`(?:https?:)?//${reEsc(C.HOST)}(?![\\w.-])`, "i");
    const scan = (dir) => {
      if (!existsSync(dir)) return;
      for (const n of readdirSync(dir).sort()) {
        const p = join(dir, n);
        if (statSync(p).isDirectory()) { if (n !== "node_modules") scan(p); continue; }
        if (!/\.(?:html|json|txt|css|js|mjs|svg|xml|toml)$|^_(?:headers|redirects)$/.test(n)) continue;
        const rel = relative(rootDir, p).split(sep).join("/");
        if (rel !== "src/site.json" && re.test(readFileSync(p, "utf8"))) err("SRC-origin", rel, `Basis-URL ${C.ORIGIN} hart verdrahtet — sie steht nur in src/site.json (R4 a13)`);
      }
    };
    scan(join(rootDir, "src"));
    scan(join(rootDir, "scripts"));
    // CNAME (Domain-Bindung beim Hoster) ist Konfiguration, keine Quelle: Sie muss zum Host aus
    // src/site.json passen, sonst laeuft ein Domainwechsel nur halb (Seiten neu, Bindung alt).
    const cname = join(rootDir, "CNAME");
    if (existsSync(cname) && readFileSync(cname, "utf8").trim() !== C.HOST) err("CNAME-host", "CNAME", `CNAME passt nicht zum Host ${C.HOST} aus src/site.json`);
  }

  // --- private Sperrliste -----------------------------------------------------
  let priv = privateTerms;
  if (!priv) {
    const envList = process.env.SITE_PRIVATE_DENYLIST;
    const file = process.env.SITE_PRIVATE_DENYLIST_FILE || join(rootDir, ".site-private-denylist.txt");
    if (envList && envList.trim()) priv = envList.split(/\r?\n/);
    else if (existsSync(file)) priv = readFileSync(file, "utf8").split(/\r?\n/);
  }
  priv = (priv || []).map((t) => t.trim()).filter((t) => t && !t.startsWith("#"));
  const privRes = priv.map((t) => new RegExp(`(?<![\\p{L}\\p{N}])${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}])`, "iu"));
  if (!privRes.length) (release ? err : info)("PRIV-list-missing", "-", "private Sperrliste (Arbeitgeber, Heimatort) nicht vorhanden — NICHT GEPRÜFT (Datei .site-private-denylist.txt oder Secret SITE_PRIVATE_DENYLIST)");
  else info("PRIV-list", "-", `private Sperrliste: ${privRes.length} Begriffe geprüft`);

  // Freigegebene oeffentliche Anschriften (lint-config PUBLIC_ADDRESSES) nur auf ihren Seiten ausblenden.
  const maskPublic = (text, pagePath) => {
    let t = text;
    for (const a of C.PUBLIC_ADDRESSES) if (pagePath && a.pages.includes(pagePath)) t = t.split(a.text).join(" ".repeat(a.text.length));
    return t;
  };

  const checkText = (rawText, where, { scope = "site", pagePath = null, attr = false } = {}) => {
    const text = maskPublic(rawText, pagePath);
    for (const b of C.BANNED) {
      if (scope === "all" && b.scope !== "all") continue;
      const m = b.re.exec(text);
      if (m) err("TXT-banned", where, `Sperrliste „${b.id}“: „${m[0]}“`);
    }
    if (scope === "site" && pagePath && !C.PART_TIME_ALLOWED.has(pagePath)) {
      const m = C.PART_TIME.exec(text);
      if (m) err("TXT-banned", where, `„${m[0]}“ nur auf der Workshops-Tür (Positionierung §1.2)`);
    }
    for (const re of C.REVOKED_HARD) {
      const m = re.exec(text);
      if (m) err("TXT-revoked", where, `widerrufene/unbelegte Zahl „${m[0]}“ (Positionierung §3.3)`);
    }
    for (const r of C.REVOKED_CONTEXT) {
      const m = r.re.exec(text);
      if (m && !r.need.every((n) => n.test(text))) err("TXT-revoked", where, `„${m[0]}“ ohne Pflichtkontext: ${r.why}`);
    }
    for (const p of C.PRIVACY) {
      if (p.attrOnly && !attr) continue;
      if (p.street && pagePath && C.STREET_ALLOWED.has(pagePath)) continue;
      const m = p.re.exec(text);
      if (m) err("TXT-privacy", where, `Privatdaten-Muster „${p.id}“ (Treffer maskiert: ${mask(m[0])})`);
    }
    privRes.forEach((re, i) => { if (re.test(text)) err("TXT-private", where, `Begriff Nr. ${i + 1} der privaten Sperrliste`); });
  };

  // Sichtbare interne Notizen (immer Fehler) und Ausfuell-Platzhalter (Release: Fehler). parts = [{text, exempt}]
  const checkNotes = (parts, where) => {
    const all = parts.map((p) => p.text).join(""), outside = parts.filter((p) => !p.exempt).map((p) => p.text).join("");
    for (const n of C.NOTE_VISIBLE) {
      const m = n.re.exec(n.code ? all : outside);
      if (m) err("NOTE-visible", where, `sichtbare interne Notiz („${n.id}“) — gehört als {{todo:…}} in einen HTML-Kommentar`);
    }
    const m = C.PLACEHOLDER.exec(outside);
    if (m) warn("PLACEHOLDER-open", where, `Platzhalter „${m[0]}“ im sichtbaren Text (Audit T14)`);
  };

  // --- Seiten einlesen --------------------------------------------------------
  const htmlFiles = [...site.files].filter((f) => f.endsWith(".html"));
  for (const rel of htmlFiles) {
    const html = readFileSync(join(siteDir, rel), "utf8");
    let tokens;
    try { tokens = tokenize(html); } catch (e) { err("HTML-parse", rel, e.message); continue; }
    if (/serviceWorker\s*\.\s*register/.test(html)) err("SEC-sw-register", rel, "serviceWorker.register — Seiten registrieren keinen Worker (Audit T7)");
    // Verwaiste End-Tags (z. B. ein </p>, dessen <p> beim Bauen verloren ging): Browser reparieren das
    // still, die Seitenstruktur ist dann trotzdem falsch.
    walk(tokens, { onEnd: (t, stack) => { if (!stack.some((x) => x.name === t.name)) err("HTML-structure", rel, `</${t.name}> ohne öffnendes <${t.name}>`); } });
    const ids = new Set();
    for (const t of tokens) if (t.type === "start" && t.attrs.id) ids.add(t.attrs.id);
    site.pages.set(urlOfFile(rel), { rel, html, tokens, ids });
  }

  // --- _redirects -------------------------------------------------------------
  let rules = [];
  if (site.files.has("_redirects")) {
    const { rules: r, errors } = parseRedirects(readFileSync(join(siteDir, "_redirects"), "utf8"));
    rules = r;
    for (const e of errors) err("REDIR-syntax", `_redirects:${e.line}`, e.msg);
    // Grenzen laut Cloudflare (developers.cloudflare.com/pages/configuration/redirects/, gelesen 2026-10-08):
    // "limited to 2,000 static redirects and 100 dynamic redirects", "Each redirect declaration has a
    // 1,000-character limit", "You may only include a single splat in the URL". Die 100-Zeilen-Grenze
    // aus Audit T9 gilt bei Pages also nur fuer dynamische Regeln (Splat/Platzhalter), nicht fuer alle.
    const stat = rules.filter((x) => !x.dynamic).length, dyn = rules.length - stat;
    if (stat > 2000 || dyn > 100) err("REDIR-limits", "_redirects", `${stat} statisch / ${dyn} dynamisch — Grenze 2000/100`);
    rules.forEach((x, i) => {
      x.re = ruleRegex(x.src);
      const at = `_redirects:${x.line}`;
      if (!x.src.startsWith("/")) err("REDIR-syntax", at, `Quelle muss mit / beginnen: ${x.src}`);
      if (!x.explicitCode) err("REDIR-syntax", at, "Statuscode fehlt (Pages nähme 302; Audit T9: drei Felder)");
      if ((x.src.match(/\*/g) || []).length > 1) err("REDIR-syntax", at, "mehr als ein Splat in der Quelle (Pages erlaubt einen)");
      if (x.length > 1000) err("REDIR-limits", at, `Zeile hat ${x.length} Zeichen — Pages erlaubt 1.000`);
      if (!["301", "302", "303", "307", "308"].includes(x.code)) err("REDIR-code", at, `Status ${x.code} gibt es bei Cloudflare Pages nicht (nur 301/302/303/307/308)`);
      else if (x.code !== "301") err("REDIR-code", at, `Status ${x.code} — Altbestand wird dauerhaft mit 301 umgeleitet (Positionierung §7.5, Audit T9)`);
      // Regel wird nie erreicht, wenn eine fruehere schon passt (Pages: erste passende Regel gewinnt).
      const sample = x.src.replace(/\*/g, "x").replace(/:[A-Za-z]\w*/g, "x");
      const earlier = rules.slice(0, i).find((y) => y.src === x.src || (!x.dynamic && y.re.test(sample)));
      if (earlier) err("REDIR-unreachable", at, `${x.src} wird nie erreicht — Zeile ${earlier.line} (${earlier.src}) passt vorher`);
    });
  }
  // Jede ausgelieferte Datei hat eine Primaer-URL; Seiten zusaetzlich Alias-Formen,
  // die Pages selbst auf die Primaer-URL umleitet (/x -> /x/, /x/index.html -> /x/, /x.html -> /x).
  const served = [];
  for (const rel of site.files) {
    if (rel.startsWith("_")) continue;
    const primary = urlOfFile(rel);
    served.push({ url: primary, primary });
    if (rel.endsWith("/index.html")) served.push({ url: "/" + rel, primary }, { url: primary.slice(0, -1), primary });
    else if (rel.endsWith(".html")) served.push({ url: "/" + rel.slice(0, -5), primary });
  }
  for (const x of rules) {
    for (const s of served) {
      if (!x.re.test(s.url)) continue;
      const destPath = x.dest.split(/[?#]/)[0];
      if (s.url === s.primary) err("REDIR-shadow", `_redirects:${x.line}`, `Quelle ${x.src} verdeckt die vorhandene Seite ${s.url} (Redirects gewinnen immer)`);
      else if (destPath !== s.primary) err("REDIR-shadow", `_redirects:${x.line}`, `Quelle ${x.src} leitet die Adresse ${s.url} von ${s.primary} weg`);
    }
  }
  const resolve = (url, hops = 0) => {
    const path = url.split("#")[0].split("?")[0];
    for (const x of rules) {
      const m = x.re.exec(path);
      if (m) {
        if (hops > 5) return { ok: false, why: "Weiterleitungsschleife" };
        let dest = x.dest;
        if (m[1] !== undefined) dest = dest.replace(":splat", m[1]);
        if (/^https?:\/\//.test(dest)) return { ok: true, external: true, via: x };
        const r = resolve(dest, hops + 1);
        return { ...r, via: x, dest };
      }
    }
    const file = site.fileFor(path);
    return file ? { ok: true, file, frag: url.includes("#") ? url.split("#")[1] : null } : { ok: false, why: "keine Datei, keine Weiterleitung" };
  };
  for (const x of rules) {
    if (/^https?:\/\//.test(x.dest)) continue;
    const [p, frag] = x.dest.split("#");
    const file = site.fileFor(p);
    if (!file) { err("REDIR-target", `_redirects:${x.line}`, `Ziel ${x.dest} existiert nicht`); continue; }
    if (frag) {
      const page = site.pages.get(urlOfFile(file));
      if (page && !page.ids.has(frag)) err("REDIR-target", `_redirects:${x.line}`, `Anker #${frag} fehlt auf ${p}`);
    }
  }

  // --- Alt-URLs ----------------------------------------------------------------
  const legacyFile = join(rootDir, "src", "legacy-urls.txt");
  if (existsSync(legacyFile)) {
    let n = 0;
    for (const line of readFileSync(legacyFile, "utf8").split(/\r?\n/)) {
      const l = line.trim();
      if (!l || l.startsWith("#")) continue;
      const [u, flag] = l.split(/\s+/);
      const r = resolve(u);
      n++;
      if (flag === "404") { if (r.ok) err("LEGACY-404-redirected", u, "muss 404 bleiben (erfundene Referenzkunden), wird aber ausgeliefert/weitergeleitet"); }
      else if (!r.ok) err("LEGACY-uncovered", u, `alte URL läuft ins Leere (${r.why})`);
    }
    info("LEGACY", "src/legacy-urls.txt", `${n} alte URLs geprüft`);
  } else err("LEGACY-list-missing", "src/legacy-urls.txt", "Liste der alten URLs fehlt");

  // --- _headers ---------------------------------------------------------------
  if (site.files.has("_headers")) {
    const h = readFileSync(join(siteDir, "_headers"), "utf8");
    const block = /^\/\*\s*$([\s\S]*?)(?=^\S|$(?![\s\S]))/m.exec(h);
    const body = block ? block[1] : "";
    const get = (name) => { const m = new RegExp(`^\\s+${name}:\\s*(.+)$`, "mi").exec(body); return m ? m[1].trim() : null; };
    const csp = get("Content-Security-Policy");
    if (!csp) err("HDR-csp-missing", "_headers", "keine CSP für /*");
    else {
      if (/unsafe-|\*|data:|https?:|blob:/.test(csp.replace(/upgrade-insecure-requests/, ""))) err("HDR-csp-unsafe", "_headers", "CSP enthält unsafe-*, Platzhalter, data:, blob: oder fremde Hosts");
      if (!/frame-ancestors 'none'/.test(csp)) err("HDR-frame-ancestors", "_headers", "frame-ancestors 'none' fehlt");
      if (!/default-src '(self|none)'/.test(csp)) err("HDR-csp-default", "_headers", "default-src fehlt");
      if (!/object-src 'none'/.test(csp)) err("HDR-csp-default", "_headers", "object-src 'none' fehlt");
      if (!/base-uri '(none|self)'/.test(csp)) err("HDR-csp-default", "_headers", "base-uri fehlt");
    }
    const hsts = get("Strict-Transport-Security");
    if (!hsts) err("HDR-hsts-missing", "_headers", "HSTS fehlt");
    else if (/preload/i.test(hsts)) err("HDR-hsts-preload", "_headers", "HSTS ohne preload (Vorgabe)");
    if (!/nosniff/i.test(get("X-Content-Type-Options") || "")) err("HDR-nosniff", "_headers", "X-Content-Type-Options: nosniff fehlt");
    if (!get("Referrer-Policy")) err("HDR-referrer", "_headers", "Referrer-Policy fehlt");
    if (!/camera=\(\)/.test(get("Permissions-Policy") || "")) err("HDR-permissions", "_headers", "Permissions-Policy (camera/microphone/geolocation aus) fehlt");
    if (new RegExp(`https?://(?!${reEsc(C.HOST)}(?![\\w.-]))`).test(h)) err("HDR-csp-unsafe", "_headers", "fremder Host in _headers");
  }

  // --- Abmelde-Worker (Nachbesserung 1; Audit T7/T10) ---------------------------
  // Der Browser-Nachweis liegt in scripts/browser/sw-killswitch.mjs; hier die statischen Bedingungen,
  // die er voraussetzt: gleiche Datei an allen alten Worker-Adressen, kein fetch-Handler, alle
  // Aufraeumschritte vorhanden, gueltiges JavaScript, passende Header (Typ, no-cache, kein sandbox).
  const hdrRules = site.files.has("_headers") ? parseHeaders(readFileSync(join(siteDir, "_headers"), "utf8")) : [];
  const swFiles = C.SW_KILLSWITCH.filter((f) => site.files.has(f)); // fehlende meldet STRUCT-required
  const swRef = swFiles.length ? readFileSync(join(siteDir, swFiles[0])) : null;
  for (const f of swFiles) {
    const buf = readFileSync(join(siteDir, f));
    const src = buf.toString("utf8");
    if (!buf.equals(swRef)) err("SW-killswitch", f, `weicht von ${swFiles[0]} ab — alle Abmelde-Worker müssen gleich sein`);
    try { new Script(src, { filename: f }); } catch (e) { err("SW-killswitch", f, `kein gültiges JavaScript: ${e.message}`); }
    const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
    if (/addEventListener\s*\(\s*["'`]fetch["'`]|\bonfetch\b/.test(code)) err("SW-killswitch", f, "fetch-Handler verboten — der Worker darf nie eine Anfrage abfangen");
    if (/\bimportScripts\b|(?<![.\w])fetch\s*\(/.test(code)) err("SW-killswitch", f, "lädt etwas nach (importScripts/fetch) — verboten");
    for (const [re, what] of [[/skipWaiting\s*\(/, "skipWaiting()"], [/caches\.delete\s*\(/, "caches.delete()"], [/registration\.unregister\s*\(/, "registration.unregister()"], [/clients\.matchAll\s*\(/, "clients.matchAll()"], [/\.navigate\s*\(/, "client.navigate()"]]) {
      if (!re.test(code)) err("SW-killswitch", f, `${what} fehlt`);
    }
    const h = headersFor(hdrRules, "/" + f);
    const type = h.get("content-type")?.[1] || "";
    if (!/^(?:text|application)\/javascript\b/i.test(type)) err("SW-headers", "_headers", `/${f}: Content-Type muss ein JavaScript-Typ sein (ist „${type || "nicht gesetzt"}“), sonst scheitert das Update`);
    if (!/\bno-cache\b|\bno-store\b|\bmax-age=0\b/.test(h.get("cache-control")?.[1] || "")) err("SW-headers", "_headers", `/${f}: Cache-Control: no-cache fehlt`);
    if (/\bsandbox\b/.test(h.get("content-security-policy")?.[1] || "")) err("SW-headers", "_headers", `/${f}: CSP mit sandbox sperrt CacheStorage im Worker (Browser-Test, Gegenprobe F)`);
  }
  for (const f of site.files) {
    if (/\.m?js$/.test(f) && !C.SW_KILLSWITCH.includes(f)) err("STRUCT-script-file", f, "Skriptdatei — ausgeliefert werden nur die Abmelde-Worker (CSP script-src 'none')");
  }

  // --- Farbkontraste ------------------------------------------------------------
  if (site.files.has("assets/site.css")) {
    const css = readFileSync(join(siteDir, "assets/site.css"), "utf8");
    if (/@import|url\(\s*['"]?(?:https?:)?\/\//i.test(css)) err("RES-external", "assets/site.css", "CSS lädt fremde Ressourcen (@import/url)");
    const dark = tokensOf((/:root\s*\{([^}]*)\}/.exec(css) || [])[1] || "");
    const light = { ...dark, ...tokensOf((/prefers-color-scheme:\s*light\)\s*\{\s*:root\s*\{([^}]*)\}/.exec(css) || [])[1] || "") };
    const pairsSrc = (/\/\*\s*contrast-pairs[^\n]*\n([\s\S]*?)\*\//.exec(css) || [])[1] || "";
    const pairs = [...pairsSrc.matchAll(/([a-z0-9-]+)\/([a-z0-9-]+):([\d.]+)/g)];
    if (!pairs.length) err("A11Y-contrast", "assets/site.css", "keine contrast-pairs gefunden");
    for (const [, fg, bg, min] of pairs) {
      for (const [mode, t] of [["dunkel", dark], ["hell", light]]) {
        if (!t[fg] || !t[bg]) { err("A11Y-contrast", "assets/site.css", `Token --${fg} oder --${bg} fehlt (${mode})`); continue; }
        const c = contrast(t[fg], t[bg]);
        if (c + 1e-9 < Number(min)) err("A11Y-contrast", "assets/site.css", `${mode}: --${fg} auf --${bg} = ${c.toFixed(2)}:1 < ${min}:1`);
      }
    }
    info("A11Y-contrast", "assets/site.css", `${pairs.length} Farbpaare × 2 Modi geprüft`);
  }

  // --- Seitenpruefungen -----------------------------------------------------------
  const pageMeta = new Map();
  // Stufe 1: keine Angebotssprache, keine Preise (Audit T15, § 5 ECG). Gilt fuer alles, was Besucher,
  // Suchtreffer oder Link-Vorschauen zeigen: Fliesstext, <title>, Meta/OG-Texte und Text-Attribute.
  const checkStage1 = (text, where) => {
    if (C.STAGE !== 1 || !text) return;
    const m = C.STAGE1_COMMERCIAL.exec(collapse(text));
    if (m) err("STAGE1-commercial", where, `„${m[0]}“ — Stufe 1 ist nicht kommerziell (keine Angebote, Preise, Workshops; § 5 ECG)`);
  };
  for (const [url, page] of site.pages) {
    const { rel, tokens } = page;
    const meta = { lang: null, title: null, desc: null, canonical: null, robots: "", alts: {}, h1: 0, main: 0, ogImage: null, links: [], headings: [], switches: [] };
    walk(tokens, {
      onStart: (t, stack) => {
        const a = t.attrs;
        if (t.name === "html") meta.lang = a.lang || null;
        if (t.name === "title") meta.title = (t.content || "").trim();
        if (t.name === "meta" && a.name === "description") meta.desc = a.content;
        if (t.name === "meta" && a.name === "robots") meta.robots = a.content || "";
        if (t.name === "meta" && a.property === "og:image") meta.ogImage = a.content;
        if (t.name === "link" && a.rel === "canonical") meta.canonical = a.href;
        if (t.name === "link" && a.rel === "alternate" && a.hreflang) meta.alts[a.hreflang] = a.href;
        if (t.name === "h1") meta.h1++;
        if (/^h[1-6]$/.test(t.name)) meta.headings.push(Number(t.name[1]));
        // Sprachlink im Kopf (Audit T3)
        if (t.name === "a" && stack.some((x) => /(^|\s)lang-switch(\s|$)/.test(x.attrs.class || ""))) meta.switches.push(a);
        // kein target (Audit T8): Links oeffnen im selben Fenster
        if ("target" in a && a.target !== "_self") err("LINK-target", rel, `target="${a.target}" an <${t.name}> (Audit T8)`);
        // Strukturierte Daten (Audit T16): JSON-LD, Microdata, RDFa, Open-Graph-Ortsangaben
        if (t.name === "script" && /ld\+json/i.test(a.type || "")) {
          let data = null;
          try { data = JSON.parse(t.content || ""); } catch { err("SD-forbidden", rel, "JSON-LD nicht lesbar"); }
          const visit = (o) => {
            if (Array.isArray(o)) return o.forEach(visit);
            if (!o || typeof o !== "object") return;
            for (const ty of [].concat(o["@type"] || [])) if (C.SD_FORBIDDEN_TYPES.test(String(ty))) err("SD-forbidden", rel, `JSON-LD @type ${ty} (Audit T16: kein Angebot, keine Organisation, keine Anschrift)`);
            for (const [k, v] of Object.entries(o)) { if (C.SD_FORBIDDEN_PROPS.test(k)) err("SD-forbidden", rel, `JSON-LD-Eigenschaft ${k} (Audit T16)`); visit(v); }
          };
          visit(data);
        }
        for (const k of ["itemtype", "typeof"]) for (const ty of String(a[k] || "").split(/\s+/).filter(Boolean)) {
          if (C.SD_FORBIDDEN_TYPES.test(ty.replace(/^.*[/#:]/, ""))) err("SD-forbidden", rel, `${k}="${ty}" (Audit T16)`);
        }
        for (const k of ["itemprop", "property"]) for (const pr of String(a[k] || "").split(/\s+/).filter(Boolean)) {
          if (t.name === "meta" && k === "property" && C.OG_FORBIDDEN.test(pr)) err("SD-forbidden", rel, `Open-Graph-Ortsangabe ${pr} (Audit T16)`);
          else if (C.SD_FORBIDDEN_PROPS.test(pr.replace(/^.*[/#:]/, ""))) err("SD-forbidden", rel, `${k}="${pr}" (Audit T16)`);
        }
        if (t.name === "main") meta.main++;
        if ("data-todo" in a || /(^|\s)todo(\s|$)/.test(a.class || "")) err("NOTE-visible", rel, `sichtbare OFFEN-Marke <${t.name}> — interne Notizen nur als {{todo:…}} (HTML-Kommentar)`);
        if (t.name === "script") err("SEC-inline-script", rel, "<script> ist verboten (CSP script-src 'none')");
        if (t.name === "style") err("SEC-inline-style", rel, "<style> ist verboten (CSP style-src 'self')");
        if (["iframe", "object", "embed", "form", "frame", "applet"].includes(t.name)) err("SEC-embed", rel, `<${t.name}> ist nicht erlaubt`);
        for (const [k, v] of Object.entries(a)) {
          if (k === "style") err("SEC-inline-style", rel, `style-Attribut an <${t.name}>`);
          if (k.startsWith("on")) err("SEC-event-handler", rel, `${k}-Attribut an <${t.name}>`);
          if (/^\s*javascript:/i.test(v)) err("SEC-js-url", rel, `javascript:-URL in ${k}`);
        }
        // Ressourcen (alles, was der Browser ungefragt laedt)
        const resAttrs = [];
        if (t.name === "link" && a.rel && !/^(canonical|alternate)$/.test(a.rel)) resAttrs.push(a.href);
        if (["img", "source", "video", "audio", "track", "input", "script", "iframe", "embed"].includes(t.name)) resAttrs.push(a.src, a.poster, ...(a.srcset || "").split(",").map((s) => s.trim().split(/\s+/)[0]));
        if (t.name === "object") resAttrs.push(a.data);
        if (t.name === "meta" && /^(og:image|twitter:image)$/.test(a.property || a.name || "")) {
          if (!String(a.content || "").startsWith(C.ORIGIN + "/")) err("RES-external", rel, `OG-Bild nicht auf eigener Domain: ${a.content}`);
        }
        for (const r of resAttrs.filter(Boolean)) {
          if (/^(?:[a-z]+:)?\/\//i.test(r) || /^data:/i.test(r)) { err("RES-external", rel, `fremde/eingebettete Ressource: ${r.slice(0, 80)}`); continue; }
          // Lokale Ressource muss als Datei ausgeliefert werden (z. B. kein <img> auf ein fehlendes Foto).
          const p = (r.startsWith("/") ? r : posix.join(posix.dirname(url.endsWith("/") ? url + "x" : url), r)).split(/[?#]/)[0].replace(/^\//, "");
          if (!site.files.has(decodeURIComponent(p))) err("RES-missing", rel, `lokale Ressource fehlt: ${r}`);
        }
        if (t.name === "a" && a.href) meta.links.push(a.href);
        if (t.name === "img" && !("alt" in a)) err("A11Y-img-alt", rel, "<img> ohne alt");
        // Attribute mit sichtbarem/teilbarem Text
        for (const k of ["alt", "title", "aria-label", "placeholder"]) if (a[k]) { checkText(a[k], `${rel} [${k}]`, { pagePath: url, attr: true }); checkNotes([{ text: a[k] }], `${rel} [${k}]`); checkStage1(a[k], `${rel} [${k}]`); }
        if (t.name === "meta" && a.content && /^(description|og:title|og:description|og:image:alt|og:site_name|twitter:)/.test(a.name || a.property || "")) { const w = `${rel} [meta ${a.name || a.property}]`; checkText(a.content, w, { pagePath: url, attr: true }); checkNotes([{ text: a.content }], w); checkStage1(a.content, w); }
        for (const k of ["href", "src"]) if (a[k]) for (const p of C.PRIVACY) if ((p.id === "whatsapp" || p.id === "tel-link" || p.id === "gmail" || p.id === "telefon") && p.re.test(a[k])) err("TXT-privacy", `${rel} [${k}]`, `Privatdaten-Muster „${p.id}“ in Link (maskiert: ${mask(a[k])})`);
      },
    });
    pageMeta.set(url, meta);

    // Kopfangaben
    if (!meta.lang || !["de", "en"].includes(meta.lang)) err("HEAD-lang", rel, `lang fehlt/ungültig (${meta.lang})`);
    if (!meta.title || meta.title.length < 10) err("HEAD-title", rel, "title fehlt oder zu kurz");
    else if (meta.title.length > 70) warn("HEAD-title", rel, `title ${meta.title.length} Zeichen (> 70)`);
    if (!meta.desc || meta.desc.length < 50) err("HEAD-description", rel, "meta description fehlt oder < 50 Zeichen");
    else if (meta.desc.length > 170) warn("HEAD-description", rel, `description ${meta.desc.length} Zeichen (> 170)`);
    if (!C.CANONICAL_EXEMPT.has(url)) {
      if (meta.canonical !== C.ORIGIN + url) err("HEAD-canonical", rel, `canonical muss ${C.ORIGIN + url} sein (ist ${meta.canonical})`);
    }
    if (!/name="viewport"/.test(page.html)) err("HEAD-viewport", rel, "viewport fehlt");
    if (!/<meta charset="utf-8">/i.test(page.html)) err("HEAD-charset", rel, "charset utf-8 fehlt");
    if (meta.h1 !== 1) err("HEAD-h1", rel, `${meta.h1} × <h1> (genau eine)`);
    if (meta.main !== 1) err("HEAD-main", rel, "genau ein <main> nötig");
    // Ueberschriften ohne Spruenge, erste ist h1 (Audit T4)
    meta.headings.forEach((h, i) => {
      if (i === 0 && h !== 1) err("HEAD-heading-order", rel, `erste Überschrift ist h${h}, nicht h1`);
      if (i > 0 && h > meta.headings[i - 1] + 1) err("HEAD-heading-order", rel, `Sprung von h${meta.headings[i - 1]} auf h${h} (Audit T4)`);
    });
    // "Stand" mit <time datetime> (Audit T12); gueltiges Datum
    const stand = /(?:Stand|Last updated|Updated):?\s*<time datetime="(\d{4})-(\d{2})-(\d{2})">/.exec(page.html);
    if (!stand) err("HEAD-stand", rel, "„Stand: <time datetime=…>“ fehlt (Audit T12)");
    else {
      const d = new Date(Date.UTC(+stand[1], +stand[2] - 1, +stand[3]));
      if (d.getUTCMonth() !== +stand[2] - 1 || d.getUTCDate() !== +stand[3]) err("HEAD-stand", rel, `Stand-Datum ${stand[1]}-${stand[2]}-${stand[3]} gibt es nicht`);
    }
    // noindex nur mit Grund; die 404 muss noindex sein (Audit T10/T12)
    if (/noindex/.test(meta.robots) && !C.NOINDEX_ALLOWED[url]) err("HEAD-noindex", rel, "noindex ohne Eintrag in NOINDEX_ALLOWED (Inhaltsseiten sind indexierbar, Audit T12)");
    if (url === "/404.html" && !/noindex/.test(meta.robots)) err("HEAD-noindex", rel, "Fehlerseite ohne noindex (Audit T10)");
    // Stufe 1 im Fliesstext und <title> (Attribute und Meta oben im walk)
    for (const b of textBlocks(tokens)) checkStage1(b.text, rel);
    if (!meta.ogImage) err("HEAD-og-image", rel, "og:image fehlt");
    else if (!site.files.has(meta.ogImage.replace(C.ORIGIN + "/", ""))) err("HEAD-og-image", rel, `og:image-Datei fehlt: ${meta.ogImage}`);
    // Offene Punkte = OFFEN-Kommentare aus {{todo:}} (Go-live-Tor). Kommentare stehen im ausgelieferten
    // Quelltext, deshalb gelten fuer sie die Regeln wie fuer Commit-Nachrichten (Privatdaten, Zahlen, Sperrliste "all").
    const comments = tokens.filter((t) => t.type === "comment");
    for (const c of comments) checkText(collapse(c.text), `${rel} [Kommentar]`, { scope: "all" });
    // R-04: jeder mailto-Link zwischen <!--email_off--> und <!--/email_off--> (sonst schreibt Cloudflares
    // E-Mail-Verschleierung ihn um und bindet ein Skript ein); Klammern paarweise. Adresse nie ausgeben.
    {
      let off = false;
      for (const t of tokens) {
        if (t.type === "comment" && t.text === "email_off") { if (off) err("SEC-email-off", rel, "<!--email_off--> doppelt geöffnet"); off = true; }
        else if (t.type === "comment" && t.text === "/email_off") { if (!off) err("SEC-email-off", rel, "<!--/email_off--> ohne öffnendes <!--email_off-->"); off = false; }
        else if (t.type === "start" && t.name === "a" && /^\s*mailto:/i.test(t.attrs.href || "") && !off) err("SEC-email-off", rel, "mailto-Link ohne <!--email_off-->-Klammer (R-04, Cloudflare-Verschleierung)");
      }
      if (off) err("SEC-email-off", rel, "<!--email_off--> nicht geschlossen");
    }
    // Nur inhaltsleere Kommentare (R-03, COMMENT_ALLOWED); den Inhalt nie ausgeben (CI-Logs sind oeffentlich).
    for (const c of comments) if (!C.COMMENT_ALLOWED.test(c.text)) err("NOTE-comment", rel, `HTML-Kommentar mit Klartext (${c.text.length} Zeichen, Inhalt nicht ausgegeben) — erlaubt sind nur <!--OFFEN:F-nn--> und email_off; Klartext gehört in die private Zuordnung`);
    // Jeder OFFEN-Kommentar ist ein offenes Tor, auch einer mit Klartext (der zusaetzlich NOTE-comment ausloest).
    const offen = comments.filter((c) => /^\s*OFFEN:/.test(c.text)).length;
    if (offen) warn("TODO-open", rel, `${offen} offene Punkte (<!--OFFEN:F-nn--> aus {{todo:F-nn}} oder facts.json offen)`);

    // Sprachpaare
    if (C.PAIR_EXEMPT[url]) {
      if (meta.alts.de || meta.alts.en) err("I18N-pair", rel, "Seite steht in PAIR_EXEMPT, hat aber hreflang");
    } else {
      const self = C.ORIGIN + url;
      const other = meta.lang === "de" ? "en" : "de";
      if (meta.alts[meta.lang] !== self) err("I18N-pair", rel, `hreflang ${meta.lang} muss auf sich selbst zeigen`);
      if (!meta.alts[other]) err("I18N-pair", rel, `hreflang ${other} fehlt (oder Seite in PAIR_EXEMPT mit Grund eintragen)`);
      if (meta.alts["x-default"] !== C.ORIGIN + "/") err("I18N-xdefault", rel, "x-default muss auf / zeigen");
    }
    // hreflang nur als absolute eigene URL (Audit T2; relative Ziele entgingen sonst der Gegenseitigkeitspruefung)
    for (const [hl, href] of Object.entries(meta.alts)) if (!String(href).startsWith(C.ORIGIN + "/")) err("I18N-absolute", rel, `hreflang ${hl} ist keine absolute URL auf ${C.ORIGIN}: ${href}`);
    // Sprachlink: genau einer, zeigt auf das Sprachpaar (ohne Paar: Startseite der anderen Sprache), mit hreflang und lang (Audit T3)
    {
      const other = meta.lang === "de" ? "en" : "de";
      const want = meta.alts[other] ? String(meta.alts[other]).slice(C.ORIGIN.length) : other === "en" ? "/en/" : "/";
      if (meta.switches.length !== 1) err("I18N-switch", rel, `${meta.switches.length} Sprachlinks im Kopf (genau einer)`);
      else {
        const a = meta.switches[0];
        if (a.href !== want || a.hreflang !== other || a.lang !== other) err("I18N-switch", rel, `Sprachlink ${a.href} (hreflang=${a.hreflang}, lang=${a.lang}) — erwartet ${want} mit hreflang und lang ${other}`);
      }
    }
  }
  for (const p of Object.keys(C.PAIR_EXEMPT)) if (!site.pages.has(p)) err("I18N-pair", p, "PAIR_EXEMPT nennt eine Seite, die es nicht gibt (veraltete Ausnahme)");
  for (const p of Object.keys(C.NOINDEX_ALLOWED)) if (!site.pages.has(p)) err("HEAD-noindex", p, "NOINDEX_ALLOWED nennt eine Seite, die es nicht gibt (veraltete Ausnahme)");
  if (C.STAGE === 1) for (const p of C.DOORS.workshops) if (site.pages.has(p)) err("STAGE1-commercial", site.pages.get(p).rel, "Workshop-Seite in Stufe 1 (nicht kommerziell bis T-Recht-1, § 5 ECG)");
  // Gegenseitigkeit
  for (const [url, meta] of pageMeta) {
    if (C.PAIR_EXEMPT[url]) continue;
    const other = meta.lang === "de" ? "en" : "de";
    const target = meta.alts[other];
    if (!target || !target.startsWith(C.ORIGIN)) continue;
    const tm = pageMeta.get(target.slice(C.ORIGIN.length));
    if (!tm) err("I18N-pair", site.pages.get(url).rel, `Sprachpaar ${target} existiert nicht`);
    else if (tm.alts[meta.lang] !== C.ORIGIN + url) err("I18N-pair", site.pages.get(url).rel, `Sprachpaar ${target} zeigt nicht zurück`);
    else if (tm.lang !== other) err("I18N-pair", site.pages.get(url).rel, `Sprachpaar ${target} hat lang=${tm.lang}`);
  }

  // Links, Anker, Tueren
  const doorOf = (p) => Object.entries(C.DOORS).find(([, list]) => list.includes(p))?.[0];
  for (const [url, meta] of pageMeta) {
    const rel = site.pages.get(url).rel;
    for (const href of meta.links) {
      if (/^(mailto:|https:\/\/)/i.test(href)) continue;
      if (/^http:\/\//i.test(href)) { err("RES-insecure-link", rel, `unverschlüsselter Link ${href}`); continue; }
      if (/^[a-z]+:/i.test(href)) { err("LINK-scheme", rel, `unerwartetes Link-Schema ${href.split(":")[0]}:`); continue; }
      const abs = href.startsWith("#") ? url + href : href.startsWith("/") ? href : posix.join(posix.dirname(url.endsWith("/") ? url + "x" : url), href);
      const [p, frag] = abs.split("#");
      const file = site.fileFor(p || url);
      if (!file) {
        const r = resolve(p);
        err("LINK-broken", rel, r.ok ? `Link ${href} zeigt auf eine Weiterleitung — direkt auf das Ziel verlinken` : `Link ${href} läuft ins Leere`);
        continue;
      }
      if (frag) {
        const tp = site.pages.get(urlOfFile(file));
        if (tp && !tp.ids.has(frag)) err("LINK-anchor", rel, `Anker #${frag} fehlt auf ${p || url}`);
      }
      const from = doorOf(url), to = doorOf(urlOfFile(file));
      if (from && to && from !== to) err("DOOR-crossing", rel, `Tür ${from} verlinkt Tür ${to} (${href}) — Positionierung §1.5`);
    }
  }

  // --- Text: Sperrliste, Privatdaten, Zahlen nur aus facts.json -------------------
  for (const [url, page] of site.pages) {
    const { rel, tokens } = page;
    const lang = pageMeta.get(url)?.lang;
    for (const b of textBlocks(tokens)) { checkText(collapse(b.text), rel, { pagePath: url }); checkNotes(b.parts, rel); }

    // Fakten
    let factCount = 0;
    walk(tokens, {
      onStart: (t) => {
        if (t.name === "data" && "data-fact" in t.attrs) {
          factCount++;
          const key = t.attrs["data-fact"];
          const f = facts[key];
          if (!f) { err("NUM-fact-unknown", rel, `Fakt „${key}“ steht nicht in facts.json`); return; }
          if (String(f.value) !== t.attrs.value) err("NUM-fact-mismatch", rel, `Fakt „${key}“: value=${t.attrs.value}, facts.json=${f.value}`);
          t._expect = String(f[lang] ?? f.display ?? f.value);
        }
      },
    });
    // gerenderten Text der data-Elemente gegen facts.json pruefen
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (t.type === "start" && t.name === "data" && t._expect !== undefined) {
        let txt = "";
        for (let j = i + 1; j < tokens.length && !(tokens[j].type === "end" && tokens[j].name === "data"); j++) if (tokens[j].type === "text") txt += tokens[j].text;
        const shown = txt.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
        if (shown !== t._expect) err("NUM-fact-mismatch", rel, `Fakt „${t.attrs["data-fact"]}“ zeigt „${shown}“, facts.json sagt „${t._expect}“`);
      }
    }
    // freistehende Zahlen
    walk(tokens, {
      onText: (text, stack) => {
        if (stack.some((s) => C.NUMBER_EXEMPT_ELEMENTS.has(s.name) || (s.name === "data" && "data-fact" in s.attrs) || (s.name === "mark" && "data-todo" in s.attrs))) return;
        if (!stack.some((s) => s.name === "body" || s.name === "title")) return;
        let masked = maskPublic(text, url);
        for (const re of C.NUMBER_MASKS) masked = masked.replace(re, (m) => " ".repeat(m.length));
        for (const m of masked.matchAll(C.NUMBER_TOKEN)) {
          const ctx = collapse(text.slice(Math.max(0, m.index - 25), m.index + m[0].length + 15));
          const sensitive = C.PRIVACY.some((p) => p.re.test(ctx)) || privRes.some((re) => re.test(ctx));
          err("NUM-unsourced", rel, sensitive ? `Zahl ohne Fakt (${mask(m[0])}; Kontext verborgen: Privatdaten-Muster)` : `Zahl „${m[0]}“ ohne Fakt aus facts.json (…${ctx}…)`);
        }
      },
    });
    if (factCount) info("NUM-facts", rel, `${factCount} Zahlen aus facts.json`);
  }

  // --- Sitemap / robots -------------------------------------------------------------
  if (site.files.has("sitemap.xml")) {
    const sm = readFileSync(join(siteDir, "sitemap.xml"), "utf8");
    const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    const expected = [...pageMeta].filter(([u, m]) => !/noindex/.test(m.robots) && !C.CANONICAL_EXEMPT.has(u)).map(([u]) => C.ORIGIN + u);
    for (const l of locs) {
      const m = pageMeta.get(l.replace(C.ORIGIN, ""));
      if (!m) err("SITEMAP-dead", "sitemap.xml", `${l} existiert nicht`);
      else if (/noindex/.test(m.robots)) err("SITEMAP-noindex", "sitemap.xml", `${l} ist noindex und gehört nicht in die Sitemap`);
    }
    for (const e of expected) if (!locs.includes(e)) err("SITEMAP-missing", "sitemap.xml", `${e} fehlt`);
    // Form (Audit T10): Kopf, Namensraum, je <url> genau ein <loc>, absolute eigene URLs, keine Dubletten, lastmod-Datum
    const fmt = (m) => err("SITEMAP-format", "sitemap.xml", m);
    if (!/^<\?xml version="1\.0" encoding="UTF-8"\?>\s*<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"[^>]*>/.test(sm)) fmt("Kopf oder urlset-Namensraum fehlt");
    if (!/<\/urlset>\s*$/.test(sm)) fmt("</urlset> fehlt am Ende");
    const blocks = [...sm.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1]);
    if (blocks.length !== (sm.match(/<url>/g) || []).length || blocks.length !== (sm.match(/<\/url>/g) || []).length) fmt("<url>-Elemente nicht paarig");
    if (/&(?!amp;|lt;|gt;|quot;|apos;)/.test(sm)) fmt("unmaskiertes & (XML)");
    if (new Set(locs).size !== locs.length) fmt("doppelte <loc>");
    for (const b of blocks) {
      const ls = [...b.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
      if (ls.length !== 1) { fmt(`<url> mit ${ls.length} <loc>`); continue; }
      if (!ls[0].startsWith(C.ORIGIN + "/")) fmt(`<loc> nicht absolut auf ${C.ORIGIN}: ${ls[0]}`);
      const lm = /<lastmod>([^<]*)<\/lastmod>/.exec(b);
      if (lm && !/^\d{4}-\d{2}-\d{2}$/.test(lm[1])) fmt(`lastmod „${lm[1]}“ ist kein Datum`);
      // hreflang in der Sitemap = hreflang der Seite (Audit T2)
      const sAlts = Object.fromEntries([...b.matchAll(/<xhtml:link rel="alternate" hreflang="([^"]+)" href="([^"]+)"\/>/g)].map((m) => [m[1], m[2]]));
      const pm = pageMeta.get(ls[0].replace(C.ORIGIN, ""));
      if (pm && JSON.stringify(Object.entries(sAlts).sort()) !== JSON.stringify(Object.entries(pm.alts).sort())) err("SITEMAP-hreflang", "sitemap.xml", `${ls[0]}: hreflang in der Sitemap weicht von der Seite ab`);
    }
  }
  if (site.files.has("robots.txt") && !new RegExp(`^Sitemap:\\s*${reEsc(C.ORIGIN)}/sitemap\\.xml$`, "m").test(readFileSync(join(siteDir, "robots.txt"), "utf8"))) err("ROBOTS-sitemap", "robots.txt", "Sitemap-Zeile fehlt");

  // --- Commit-Nachrichten seit dem Relaunch -----------------------------------------
  if (gitCheck) {
    let log = null;
    try {
      log = execFileSync("git", ["log", "--format=%h%x1f%s%n%b%x1e", `${C.RELAUNCH_BASE}..HEAD`], { cwd: rootDir, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    } catch { log = null; }
    if (log === null) (release ? err : info)("GIT-commits", "-", "Commit-Nachrichten NICHT GEPRÜFT (kein git oder Basis-Commit fehlt — in CI fetch-depth: 0)");
    else {
      const commits = log.split("\x1e").map((c) => c.trim()).filter(Boolean);
      for (const c of commits) {
        const [hash, msg] = c.split("\x1f");
        checkText(msg.replace(/^(Co-Authored-By|Claude-Session):.*$/gim, ""), `commit ${hash}`, { scope: "all" });
      }
      info("GIT-commits", "-", `${commits.length} Commit-Nachrichten seit ${C.RELAUNCH_BASE.slice(0, 7)} geprüft`);
    }
  }

  info("PAGES", "-", `${site.pages.size} Seiten, ${site.files.size} Dateien, ${rules.length} Weiterleitungen`);
  return findings;
}

function main() {
  const release = process.argv.includes("--release");
  const findings = lint({ release });
  const errors = findings.filter((f) => f.level === "error");
  const warns = findings.filter((f) => f.level === "warn");
  for (const f of findings.filter((x) => x.level === "info")) console.log(`  info  ${f.rule.padEnd(18)} ${f.where}: ${f.msg}`);
  for (const f of warns) console.log(`  WARN  ${f.rule.padEnd(18)} ${f.where}: ${f.msg}`);
  for (const f of errors) console.log(`  FEHLER ${f.rule.padEnd(17)} ${f.where}: ${f.msg}`);
  console.log(`\nlint-site${release ? " --release" : ""}: ${errors.length} Fehler, ${warns.length} Warnungen.`);
  process.exit(errors.length ? 1 : 0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
