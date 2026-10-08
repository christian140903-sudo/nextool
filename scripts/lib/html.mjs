// Kleiner HTML-Tokenizer ohne Abhaengigkeiten — reicht fuer die eigenen,
// statischen Seiten (Build + Linter). Kein vollstaendiger HTML5-Parser:
// Rohtext-Elemente (script, style, textarea, title) werden korrekt bis zum
// schliessenden Tag gelesen, alles andere als Start-/End-Tag, Text, Kommentar.

export const VOID = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta",
  "param", "source", "track", "wbr",
]);
const RAWTEXT = new Set(["script", "style", "textarea", "title"]);

const NAMED = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  hellip: "…", ndash: "–", mdash: "—", bdquo: "„", ldquo: "“", rdquo: "”",
  lsquo: "‘", rsquo: "’", sbquo: "‚", middot: "·", times: "×", euro: "€",
  rarr: "→", larr: "←", copy: "©", shy: "­", thinsp: " ",
};

export function decodeEntities(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === "#") {
      const code = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return NAMED[e.toLowerCase()] ?? m;
  });
}

function parseAttrs(src) {
  const attrs = {};
  const re = /([^\s"'>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m;
  while ((m = re.exec(src))) {
    const name = m[1].toLowerCase();
    const val = m[2] ?? m[3] ?? m[4] ?? "";
    if (!(name in attrs)) attrs[name] = decodeEntities(val);
  }
  return attrs;
}

/** Zerlegt HTML in Tokens. Wirft bei grob kaputtem Markup (fail-closed). */
export function tokenize(html) {
  const out = [];
  let i = 0;
  const n = html.length;
  while (i < n) {
    const lt = html.indexOf("<", i);
    if (lt === -1) { out.push({ type: "text", text: html.slice(i), pos: i }); break; }
    if (lt > i) out.push({ type: "text", text: html.slice(i, lt), pos: i });
    if (html.startsWith("<!--", lt)) {
      const end = html.indexOf("-->", lt + 4);
      if (end === -1) throw new Error(`unterminated comment at ${lt}`);
      out.push({ type: "comment", text: html.slice(lt + 4, end), pos: lt });
      i = end + 3; continue;
    }
    if (html[lt + 1] === "!" || html[lt + 1] === "?") {
      const end = html.indexOf(">", lt);
      if (end === -1) throw new Error(`unterminated declaration at ${lt}`);
      out.push({ type: "doctype", text: html.slice(lt, end + 1), pos: lt });
      i = end + 1; continue;
    }
    const m = /^<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/.exec(html.slice(lt, lt + 4000));
    if (!m) { out.push({ type: "text", text: "<", pos: lt }); i = lt + 1; continue; }
    const name = m[2].toLowerCase();
    if (m[1]) {
      out.push({ type: "end", name, pos: lt, raw: m[0] });
      i = lt + m[0].length; continue;
    }
    const attrSrc = m[3];
    const selfClosing = /\/\s*$/.test(attrSrc);
    const tok = { type: "start", name, attrs: parseAttrs(attrSrc.replace(/\/\s*$/, "")), selfClosing, pos: lt, raw: m[0] };
    out.push(tok);
    i = lt + m[0].length;
    if (RAWTEXT.has(name)) {
      const close = html.toLowerCase().indexOf(`</${name}`, i);
      if (close === -1) throw new Error(`unterminated <${name}> at ${lt}`);
      tok.content = html.slice(i, close);
      out.push({ type: "text", text: tok.content, pos: i, raw: true });
      const gt = html.indexOf(">", close);
      out.push({ type: "end", name, pos: close, raw: html.slice(close, gt + 1) });
      i = gt + 1;
    }
  }
  return out;
}

/**
 * Laeuft ueber alle Tokens und liefert fuer jeden Text den Stapel offener
 * Elemente (Name + Attribute). cb(text, stack, token)
 */
export function walk(tokens, { onText, onStart, onEnd } = {}) {
  const stack = [];
  for (const t of tokens) {
    if (t.type === "start") {
      onStart?.(t, stack);
      if (!VOID.has(t.name) && !t.selfClosing) stack.push(t);
    } else if (t.type === "end") {
      onEnd?.(t, stack);
      for (let k = stack.length - 1; k >= 0; k--) {
        if (stack[k].name === t.name) { stack.length = k; break; }
      }
    } else if (t.type === "text") {
      onText?.(t.raw ? t.text : decodeEntities(t.text), stack, t);
    }
  }
  return stack;
}

const BLOCK = new Set([
  "p", "li", "td", "th", "dd", "dt", "h1", "h2", "h3", "h4", "h5", "h6",
  "figcaption", "blockquote", "caption", "pre", "summary", "title", "option", "label",
]);

/**
 * Zerlegt eine Seite in Textbloecke (Absatz, Listenpunkt, Zelle, Ueberschrift).
 * Kontextregeln der Sperrliste ("nur zusammen mit 'zurueckgenommen'") gelten je Block.
 * Gibt [{text, exempt:boolean}] — exempt = innerhalb code/pre/kbd/samp/script/style.
 */
export function textBlocks(tokens) {
  const blocks = [];
  let cur = null;
  const flush = () => { if (cur && cur.text.trim()) blocks.push(cur); cur = null; };
  walk(tokens, {
    onStart: (t) => { if (BLOCK.has(t.name)) flush(); },
    onEnd: (t) => { if (BLOCK.has(t.name)) flush(); },
    onText: (text, stack) => {
      if (stack.some((s) => s.name === "script" || s.name === "style")) return;
      if (!cur) cur = { text: "", parts: [] };
      const exempt = stack.some((s) => ["code", "pre", "kbd", "samp"].includes(s.name));
      cur.text += text;
      cur.parts.push({ text, stack: stack.slice(), exempt });
    },
  });
  flush();
  return blocks;
}

export function collapse(s) {
  return s.replace(/\s+/g, " ").trim();
}
