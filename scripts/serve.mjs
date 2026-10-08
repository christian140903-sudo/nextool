#!/usr/bin/env node
// Lokale Vorschau von site/ mit Cloudflare-Pages-aehnlichem Verhalten:
// _redirects (zuerst, gewinnt immer), /x -> /x/ (308), _headers, 404.html mit Status 404.
// Nur zum Pruefen (curl -sI, Browser); kein Ersatz fuer die Vorschau-URL von Cloudflare.
//   node scripts/serve.mjs [port]     (Standard 4173, nur 127.0.0.1)
//
// _headers wie bei Pages (developers.cloudflare.com/pages/configuration/headers/, gelesen 2026-10-08):
// eine Anfrage erbt die Header ALLER passenden Regeln; derselbe Header aus zwei Regeln wird mit
// Komma verbunden; "! Name" entfernt einen geerbten Header (scripts/lib/cf-headers.mjs, auch vom
// Linter genutzt). Der Browser-Test des Abmelde-Workers (scripts/browser/sw-killswitch.mjs) nutzt
// createSiteHandler().

import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseRedirects } from "./lint-site.mjs";
import { patternRegex as toRe, parseHeaders, headersFor } from "./lib/cf-headers.mjs";

const SITE = join(dirname(fileURLToPath(import.meta.url)), "..", "site");
const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8", ".txt": "text/plain; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".woff2": "font/woff2", ".js": "text/javascript; charset=utf-8",
};

export function createSiteHandler(siteDir = SITE) {
  const redirects = parseRedirects(readFileSync(join(siteDir, "_redirects"), "utf8")).rules.map((r) => ({ ...r, re: toRe(r.src) }));
  const headerRules = parseHeaders(readFileSync(join(siteDir, "_headers"), "utf8"));
  const fileFor = (p) => {
    const f = join(siteDir, decodeURIComponent(p));
    if (!f.startsWith(siteDir)) return null;
    if (p.endsWith("/")) return existsSync(join(f, "index.html")) ? join(f, "index.html") : null;
    if (existsSync(f) && statSync(f).isFile()) return f;
    if (existsSync(f + ".html")) return f + ".html";
    if (existsSync(join(f, "index.html"))) return { redirect: p + "/" };
    return null;
  };
  return (req, res) => {
    const path = new URL(req.url, "http://localhost").pathname;
    const send = (status, headers, body) => {
      for (const [, [k, v]] of headersFor(headerRules, path)) {
        for (const name of Object.keys(headers)) if (name.toLowerCase() === k.toLowerCase()) delete headers[name];
        headers[k] = v;
      }
      res.writeHead(status, headers); res.end(body);
    };
    for (const r of redirects) {
      const m = r.re.exec(path);
      if (m) return send(Number(r.code), { Location: m[1] !== undefined ? r.dest.replace(":splat", m[1]) : r.dest }, "");
    }
    const f = fileFor(path);
    if (f && f.redirect) return send(308, { Location: f.redirect }, "");
    if (f) return send(200, { "Content-Type": TYPES[extname(f)] || "application/octet-stream" }, readFileSync(f));
    send(404, { "Content-Type": TYPES[".html"] }, readFileSync(join(siteDir, "404.html")));
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const PORT = Number(process.argv[2] || 4173);
  createServer(createSiteHandler()).listen(PORT, "127.0.0.1", () => console.log(`Vorschau: http://127.0.0.1:${PORT}/  (site/, mit _redirects und _headers)`));
}
