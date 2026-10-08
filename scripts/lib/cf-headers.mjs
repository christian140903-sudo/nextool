// _headers von Cloudflare Pages lesen und fuer einen Pfad auswerten (geteilt von serve.mjs und
// lint-site.mjs, damit Vorschau und Linter dieselbe Semantik haben).
// Quelle: developers.cloudflare.com/pages/configuration/headers/ (gelesen 2026-10-08):
//   "An incoming request which matches multiple rules' URL patterns will inherit all rules' headers."
//   "If a header is applied twice in the _headers file, the values are joined with a comma separator."
//   Entfernen eines geerbten Headers: "! Name". Splat "*" (gierig), Platzhalter ":name".

export const patternRegex = (src) => new RegExp("^" + src.split(/(\*|:[A-Za-z]\w*)/).map((p) => (p === "*" ? "(.*)" : /^:[A-Za-z]/.test(p) ? "([^/]+)" : p.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))).join("") + "$");

export function parseHeaders(text) {
  const rules = [];
  let cur = null;
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    if (!/^\s/.test(line)) { cur = { src: line.trim(), re: patternRegex(line.trim()), headers: [], detach: [] }; rules.push(cur); continue; }
    if (!cur) continue;
    const d = /^\s+!\s*([^:\s]+)\s*$/.exec(line);
    if (d) { cur.detach.push(d[1].toLowerCase()); continue; }
    const m = /^\s+([^:]+):\s*(.*)$/.exec(line);
    if (m) cur.headers.push([m[1].trim(), m[2].trim()]);
  }
  return rules;
}

// Wirksame Header fuer einen Pfad: Map kleingeschriebener Name -> [Name, Wert].
export function headersFor(rules, path) {
  const out = new Map();
  const detach = new Set();
  for (const r of rules) {
    if (!r.re.test(path)) continue;
    for (const [k, v] of r.headers) {
      const key = k.toLowerCase();
      out.set(key, out.has(key) ? [out.get(key)[0], `${out.get(key)[1]}, ${v}`] : [k, v]);
    }
    for (const d of r.detach) detach.add(d);
  }
  for (const d of detach) out.delete(d);
  return out;
}
