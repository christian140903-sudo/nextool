#!/usr/bin/env node
// Lokale Vorschau von site/ mit Cloudflare-Pages-aehnlichem Verhalten:
// _redirects (zuerst, gewinnt immer), /x -> /x/ (308), _headers, 404.html mit Status 404.
// Nur zum Pruefen (curl -sI, Browser); kein Ersatz fuer die Vorschau-URL von Cloudflare.
//   node scripts/serve.mjs [port]     (Standard 4173, nur 127.0.0.1)

import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseRedirects } from "./lint-site.mjs";

const SITE = join(dirname(fileURLToPath(import.meta.url)), "..", "site");
const PORT = Number(process.argv[2] || 4173);
const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8", ".txt": "text/plain; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".woff2": "font/woff2",
};

const toRe = (src) => new RegExp("^" + src.split(/(\*|:[A-Za-z]\w*)/).map((p) => (p === "*" ? "(.*)" : /^:[A-Za-z]/.test(p) ? "([^/]+)" : p.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))).join("") + "$");
const redirects = parseRedirects(readFileSync(join(SITE, "_redirects"), "utf8")).rules.map((r) => ({ ...r, re: toRe(r.src) }));

function parseHeaders(text) {
  const rules = [];
  let cur = null;
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    if (!/^\s/.test(line)) { cur = { re: toRe(line.trim()), headers: [] }; rules.push(cur); continue; }
    const m = /^\s+([^:]+):\s*(.*)$/.exec(line);
    if (m && cur) cur.headers.push([m[1].trim(), m[2].trim()]);
  }
  return rules;
}
const headerRules = parseHeaders(readFileSync(join(SITE, "_headers"), "utf8"));

function fileFor(p) {
  const f = join(SITE, decodeURIComponent(p));
  if (!f.startsWith(SITE)) return null;
  if (p.endsWith("/")) return existsSync(join(f, "index.html")) ? join(f, "index.html") : null;
  if (existsSync(f) && statSync(f).isFile()) return f;
  if (existsSync(f + ".html")) return f + ".html";
  if (existsSync(join(f, "index.html"))) return { redirect: p + "/" };
  return null;
}

createServer((req, res) => {
  const path = new URL(req.url, "http://localhost").pathname;
  const send = (status, headers, body) => {
    for (const r of headerRules) if (r.re.test(path)) for (const [k, v] of r.headers) headers[k] = v;
    res.writeHead(status, headers); res.end(body);
  };
  for (const r of redirects) {
    const m = r.re.exec(path);
    if (m) return send(Number(r.code), { Location: m[1] !== undefined ? r.dest.replace(":splat", m[1]) : r.dest }, "");
  }
  const f = fileFor(path);
  if (f && f.redirect) return send(308, { Location: f.redirect }, "");
  if (f) return send(200, { "Content-Type": TYPES[extname(f)] || "application/octet-stream" }, readFileSync(f));
  send(404, { "Content-Type": TYPES[".html"] }, readFileSync(join(SITE, "404.html")));
}).listen(PORT, "127.0.0.1", () => console.log(`Vorschau: http://127.0.0.1:${PORT}/  (site/, mit _redirects und _headers)`));
