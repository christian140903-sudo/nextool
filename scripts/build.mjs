#!/usr/bin/env node
// Build fuer nextool.app: src/ -> site/ (nur site/ wird ausgeliefert).
// Ohne Abhaengigkeiten, deterministisch (kein Datum aus der Uhr; zweimal bauen = gleiche Bytes).
//
//   node scripts/build.mjs           schreibt site/ (synchronisiert: entfernt verwaiste Dateien)
//   node scripts/build.mjs --check   baut im Speicher und vergleicht mit site/; Exit 1, wenn etwas anders ist
//
// Was die Schicht darunter im Fehlerfall schon selbst tut: nichts — Cloudflare Pages
// liefert aus, was in site/ liegt. Deshalb bricht dieser Build bei jedem unbekannten
// Platzhalter, fehlenden Fakt oder kaputten Seitenkopf ab (fail-closed).

import { readFileSync, readdirSync, statSync, mkdirSync, writeFileSync, rmSync, existsSync, appendFileSync } from "node:fs";
import { join, dirname, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { FACTS_INTERNAL_KEYS, IF_ZWILLINGE } from "./lint-config.mjs";
import { loadState } from "./lib/sperrliste.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");
const OUT = join(ROOT, "site");

// Foto (Positionierung §7.7): src/static/assets/foto.jpg (Pflicht, wenn ein Foto erscheinen soll)
// und optional foto.webp. Fehlt foto.jpg, rendert {{photo:large}} Initialen statt eines <img>,
// {{photo:medium}}/{{photo:small}} rendern nichts (R4 a3: ein kleines Monogramm wirkt wie ein
// Platzhalter und steht mobil verwaist) — so verweist keine Seite auf eine fehlende Datei. Ist es da, bricht der Build ab, wenn
// Metadaten (EXIF/XMP/IPTC: koennen Aufnahmeort und Geraet verraten) oder > 150 KB.
// Dateien in src/static, in die der Build die Basis-URL aus src/site.json einsetzt ({{origin}}).
const STATIC_TEMPLATES = new Set(["robots.txt"]);
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
  return { meta, body: stripIntern(raw.slice(m[0].length), relative(ROOT, file)), file };
}

// Neutrale Kennungen (Welle F, R-03): Das Repository ist oeffentlich, also auch src/. Interne Notizen
// (offene Fragen, Begruendungen, vorbereitete Absaetze) stehen deshalb NUR als Kennung F-nn im Quelltext;
// der Klartext liegt in einer privaten Zuordnung ausserhalb des Repositorys.
//   {{todo:F-nn}}          Go-live-Tor -> <!--OFFEN:F-nn--> im HTML (test:release zaehlt es als Fehler)
//   <!--intern:F-nn-->     reine Quellnotiz -> wird beim Build entfernt
//   facts.json "offen": "F-nn"                  Tor am Fakt -> <!--OFFEN:F-nn--> an jedem gerenderten Wert
//   facts.json "source_internal": "intern:F-nn" interne Fundstelle -> nicht ausgeliefert
// Alles andere bricht den Build ab. Die Meldungen nennen den Klartext nie (CI-Logs sind oeffentlich).
export const MARKER_ID = /^F-\d{2,3}$/;
const clearLen = (t) => `Klartext statt Kennung F-nn (${t.length} Zeichen, Inhalt nicht ausgegeben) — Text in die private Zuordnung, hier nur die Kennung`;

export function stripIntern(body, where = "") {
  const out = body.replace(/[ \t]*<!--intern:F-\d{2,3}-->[ \t]*\r?\n?/g, "");
  const m = /<!--intern([\s\S]*?)(?:-->|$)/.exec(out);
  if (m) throw new Error(`${where}: <!--intern nur als <!--intern:F-nn--> erlaubt; ${clearLen(m[1].trim())}`);
  return out;
}

// Ausgelieferte facts.json (Pruefbericht 9, Nachbesserung 10): interne Felder bleiben in src/facts.json.
//   source_internal = "intern:F-nn", Kennung einer Fundstelle in nicht oeffentlichen Dokumenten
//   offen           = "F-nn", Go-live-Tor am Fakt; erzeugt auf jeder Seite, die den Fakt zeigt,
//                     <!--OFFEN:F-nn--> -> test:release bricht ab, bis das Feld weg ist.
// Die Liste der Felder steht in scripts/lint-config.mjs (FACTS_INTERNAL_KEYS); der Linter prueft dieselbe.
export function publicFacts(raw) {
  const j = JSON.parse(raw);
  const facts = {};
  for (const [k, f] of Object.entries(j.facts)) {
    facts[k] = Object.fromEntries(Object.entries(f).filter(([fk]) => !FACTS_INTERNAL_KEYS.includes(fk)));
  }
  return JSON.stringify({ ...j, facts }, null, 2) + "\n";
}

// Liest Breite/Hoehe aus dem SOF-Segment und meldet Metadaten (APP1 = EXIF/XMP, APP13 = IPTC, COM = Kommentar,
// APP2 MPF = Zusatzbilder; R-07: auch ein zweites JPEG oder EXIF irgendwo hinter dem Dateianfang).
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
    if (marker === 0xfe) meta.push("COM/Kommentar");
    if (marker === 0xe2 && buf.subarray(i + 4, i + 7).toString("latin1") === "MPF") meta.push("MPF/Zusatzbilder");
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      height = buf.readUInt16BE(i + 5);
      width = buf.readUInt16BE(i + 7);
    }
    i += 2 + len;
  }
  if (!width || !height) throw new Error(`${name}: Bildgröße nicht lesbar`);
  // Zweites Bild oder Metadaten hinter den Bilddaten (Handy-Zusatzbilder, Motion Photo, Hersteller-Anhaenge)
  if (buf.indexOf(Buffer.from([0xff, 0xd8, 0xff]), 2) !== -1) meta.push("weiteres JPEG in der Datei");
  if (!meta.includes("EXIF") && buf.indexOf(Buffer.from("Exif\0\0", "latin1"), 2) !== -1) meta.push("EXIF (hinter den Bilddaten)");
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
    if (size !== "large") return "";
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
  const gate = f.offen ? offenComment(f.offen, `facts.json ${key}.offen`) : "";
  return `<data value="${esc(f.value)}" data-fact="${esc(key)}">${esc(display)}</data>${gate}`;
}

// Offener Punkt (OFFEN-Mechanik): {{todo:F-nn}} wird der HTML-Kommentar <!--OFFEN:F-nn-->, nie sichtbarer
// Text (Nachbesserung 11). Der Linter zaehlt diese Kommentare; im Release-Modus ist jeder ein Fehler
// (Go-live-Tor). Nur die Kennung ist erlaubt (R-03): Klartext im Kommentar waere im Seitenquelltext lesbar.
export function offenComment(id, where = "") {
  const t = String(id).trim();
  if (!t) throw new Error(`${where}: leerer {{todo:}}`);
  if (!MARKER_ID.test(t)) throw new Error(`${where}: {{todo:…}} — ${clearLen(t)}`);
  return `<!--OFFEN:${t}-->`;
}
// Absaetze, die nach dem Umwandeln nur noch aus OFFEN-Kommentaren bestehen, faellt der leere Rahmen weg.
const EMPTY_P = /<p(?:\s[^>]*)?>((?:\s*<!--OFFEN:F-\d{2,3}-->)+)\s*<\/p>/g;

// E-Mail-Links (R-04): Cloudflare ersetzt mailto-Links bei eingeschalteter E-Mail-Verschleierung durch
// /cdn-cgi/l/email-protection und bindet email-decode.min.js ein — ein Skript, das die Seite nicht haben
// soll. <!--email_off--> nimmt den Link davon aus; der Zonenschalter gehoert trotzdem aus (Klickliste).
// Der Linter (SEC-email-off) lehnt jeden mailto-Link ausserhalb dieser Klammer ab.
export const mailto = (addr) => `<!--email_off--><a href="mailto:${esc(addr)}">${esc(addr)}</a><!--/email_off-->`;

// Bausteine (R4b b1): ein Abschnitt, der auf mehreren Seiten gleich steht (z. B. die Pruef-Karte auf
// Start- und Hire-Seite), liegt EINMAL je Sprache in src/bausteine/<name>.<lang>.html und wird mit
// {{baustein:<name>}} eingesetzt — vor allen anderen Platzhaltern, damit {{fact:…}} und {{date:…}} darin
// genauso aus facts.json kommen wie auf der Seite. Fail-closed: unbekannter Name, fehlende Sprachfassung
// oder ein Baustein im Baustein brechen den Build ab.
export const BAUSTEIN = /\{\{baustein:([^}]*)\}\}/g;
export function insertBausteine(body, lang, src, where = "") {
  return body.replace(BAUSTEIN, (m, raw) => {
    const name = raw.trim();
    if (!/^[a-z][a-z0-9-]*$/.test(name)) throw new Error(`${where}: {{baustein:…}} braucht einen Namen aus a–z, 0–9 und -`);
    const rel = `src/bausteine/${name}.${lang}.html`;
    const file = join(src, "bausteine", `${name}.${lang}.html`);
    if (!existsSync(file)) throw new Error(`${where}: Baustein ${name} fehlt (${rel})`);
    const text = stripIntern(readFileSync(file, "utf8"), rel).trim();
    if (text.includes("{{baustein:")) throw new Error(`${rel}: Baustein im Baustein ist nicht erlaubt`);
    return text;
  });
}

// team-skills-kit (R4b b4): Der Satz ueber das Kit steht EINMAL je Sprache in src/site.json ("kit"), in zwei
// Zustaenden: "vorbereitung" (ohne Link) und "oeffentlich" (Name verlinkt auf das Repository unter site.github).
// Welcher gilt, entscheidet der private Zustand zF1 (src/state.json; fehlt die Datei: engster Zustand, also
// vorbereitung). Seiten setzen {{kit}} (Satz) und {{kit:titel}} (Ueberschrift des Abschnitts) ein, so wechseln
// alle Stellen in derselben Minute. Fail-closed: beide Zustaende muessen in beiden Sprachen vollstaendig sein
// (auch der gerade nicht benutzte), und der Name darf in keiner Seite woertlich stehen (sonst driftet eine Stelle).
// Weicht zF1 vom engsten Zustand ab, braucht `build --check` ohne src/state.json (CI, Cloudflare) den Zustand
// ebenfalls — sonst ist er dort rot; das gilt genauso fuer die Link-Regel des Linters.
export const KIT_STATES = ["vorbereitung", "oeffentlich"];
export function checkKit(site) {
  const kit = site.kit;
  if (!kit || typeof kit.name !== "string" || !/^[a-z0-9][a-z0-9-]*$/.test(kit.name)) throw new Error("site.json: kit.name fehlt oder ist kein Repository-Name");
  for (const lang of ["de", "en"]) for (const z of KIT_STATES) {
    const t = kit[lang] && kit[lang][z];
    if (!t || typeof t.titel !== "string" || !t.titel.trim()) throw new Error(`site.json: kit.${lang}.${z}.titel fehlt`);
    if (typeof t.satz !== "string" || t.satz.split("{name}").length !== 2) throw new Error(`site.json: kit.${lang}.${z}.satz braucht genau einmal {name}`);
    if (/[{}<>]/.test(t.satz.replace("{name}", "")) || /[{}<>]/.test(t.titel)) throw new Error(`site.json: kit.${lang}.${z} enthält Klammern oder HTML`);
  }
}
export function renderKit(part, lang, site, state) {
  const zustand = state.zF1 === true ? "oeffentlich" : "vorbereitung";
  const t = site.kit[lang][zustand];
  if (part === "titel") return esc(t.titel);
  if (part !== "") throw new Error(`{{kit:${part}}} — erlaubt sind {{kit}} und {{kit:titel}}`);
  const name = zustand === "oeffentlich" ? `<a href="${esc(`${site.github}/${site.kit.name}`)}">${esc(site.kit.name)}</a>` : esc(site.kit.name);
  return esc(t.satz).replace("{name}", name);
}

// Adressen in Befehlen (R4b b2, P3-05): {{url:https://…}} setzt die Adresse mit Umbruchstellen nur nach jedem "/" (<wbr>)
// ein, nie im Schema "https://"; ein Pfadteil mit Bindestrich (Benutzername, Repository) ist nicht trennbar
// (<span class="nobr">), sonst bricht der Browser dort am Bindestrich oder — bei overflow-wrap: anywhere in Zellen und
// <pre> — mitten im Wort. Text und Kopie bleiben genau die Adresse. Eine Funktion fuer Pruef-Karte, Tabellenzellen und
// Projektbloecke; `git clone https://…` von Hand bricht den Build ab (expand), damit keine Stelle ohne sie bleibt.
export function breakUrl(url) {
  const m = /^(https?:\/\/)([^\s<>"'&{}|]+)$/.exec(url.trim());
  if (!m) throw new Error(`{{url:…}} braucht eine http(s)-Adresse ohne Leerzeichen und HTML (${url.length} Zeichen)`);
  const parts = m[2].split("/");
  return esc(m[1]) + "<wbr>" + parts.map((p, i) => {
    const t = esc(p) + (i < parts.length - 1 ? "/" : "");
    return p.includes("-") ? `<span class="nobr">${t}</span>` : t;
  }).join("<wbr>");
}

// Verweis auf eine Karte derselben Seite (P3-06): {{karte:<id>}} wird <a href="#id">id</a>, aber nur, solange weiter unten
// auf dieser Seite eine Karte <section id="id" class="card …"> steht. Ein Satz wie „Einzelheiten stehen in seiner Karte
// weiter unten“ faellt so mit der Karte: Wird sie entfernt oder zu einer Zeile, bricht der Build ab, statt den Satz
// stehen zu lassen (LINK-anchor faengt nur ein fehlendes id, nicht den Text). body = Seite nach den Bausteinen.
export function renderKarte(id, body, where = "") {
  if (!/^[a-z][a-z0-9-]*$/.test(id)) throw new Error(`${where}: {{karte:…}} braucht eine id aus a–z, 0–9 und -`);
  const ref = body.indexOf(`{{karte:${id}}}`);
  const card = new RegExp(`<section id="${id}" class="(?:[^"]* )?card(?: [^"]*)?"`).exec(body);
  if (!card || card.index < ref) throw new Error(`${where}: {{karte:${id}}} verweist auf eine Karte weiter unten, aber dort steht keine <section id="${id}" class="card …"> mehr — den Satz mit der Karte umstellen`);
  return `<a href="#${id}">${esc(id)}</a>`;
}

// Bedingter Text (R4b b5): {{if:F-nn}}…{{/if}} wird nur ausgeliefert, wenn der private Zustand die Kennung
// freigibt (zE1 enthaelt "F-nn"). Fehlt der Schalter oder die Datei, faellt der Text weg — fuer Saetze, die erst
// nach einer Antwort ausgeliefert werden duerfen. Die Kennung bleibt daneben als {{todo:F-nn}} stehen, damit das
// Go-live-Tor die Frage weiter haelt. Nicht fuer vorbereiteten Wortlaut, der noch gar nicht gilt: src/ ist
// oeffentlich (R-03). Fail-closed: Kennung nicht F-nn, verschachtelt, ohne {{/if}} oder {{/if}} ohne Anfang = Abbruch.
// Zurueckgehaltener Text braucht sein {{todo:F-nn}} ausserhalb der Klammer auf derselben Seite, sonst Abbruch
// (P3-01): Wer die Frage schliesst, ohne zE1 zu setzen, liesse den Text sonst still und endgueltig wegfallen.
const IF_BLOCK = /\{\{if:([^}]*)\}\}([\s\S]*?)\{\{\/if\}\}/g;
export function applyIf(body, released, where = "") {
  const outside = body.replace(IF_BLOCK, "");
  const out = body.replace(IF_BLOCK, (m, raw, inner) => {
    const id = raw.trim();
    if (!MARKER_ID.test(id)) throw new Error(`${where}: {{if:…}} — ${clearLen(id)}`);
    if (inner.includes("{{if:")) throw new Error(`${where}: {{if:${id}}} verschachtelt oder ohne {{/if}}`);
    if (released.includes(id)) return inner;
    if (!new RegExp(`\\{\\{todo:\\s*${id}\\s*\\}\\}`).test(outside)) throw new Error(`${where}: {{if:${id}}} ist in zE1 nicht freigegeben und hat kein {{todo:${id}}} außerhalb der Klammer — der Text fiele still weg; zE1 setzen, Klammer entfernen oder Text löschen`);
    return "";
  });
  if (/\{\{\/?if\b/.test(out)) throw new Error(`${where}: {{if:…}} ohne {{/if}} oder {{/if}} ohne Anfang`);
  return out;
}
// DE/EN-Zwillinge (P3-03): Steht eine Kennung eines Paars aus IF_ZWILLINGE (lint-config) als {{if}} auf einer Seite,
// braucht die andere ihre Klammer auf einer Seite der anderen Sprache — sonst gaebe es die Stelle nur einsprachig.
// Dass zE1 ein Paar nur ganz freigibt, prueft validateState (lib/sperrliste.mjs); dann bricht der Build schon beim Zustand ab.
// used: Map Kennung -> Set der Sprachen, in denen sie als {{if:…}} steht.
export function checkIfZwillinge(used, pairs = IF_ZWILLINGE) {
  for (const [de, en] of pairs) {
    if (!used.has(de) && !used.has(en)) continue;
    if (!used.get(de)?.has("de") || !used.get(en)?.has("en")) throw new Error(`{{if:${de}}} (DE) und {{if:${en}}} (EN) sind Zwillinge (IF_ZWILLINGE in scripts/lint-config.mjs) — jede Sprache braucht ihre Klammer`);
  }
}

function expand(body, page, ctx) {
  const lang = page.meta.lang;
  const where = relative(ROOT, page.file);
  const withBausteine = insertBausteine(body, lang, ctx.src, where);
  for (const m of withBausteine.matchAll(/\{\{if:([^}]*)\}\}/g)) {
    const id = m[1].trim();
    if (!ctx.ifUsed.has(id)) ctx.ifUsed.set(id, new Set());
    ctx.ifUsed.get(id).add(lang);
  }
  const withBlocks = applyIf(withBausteine, ctx.state.zE1, where);
  if (/git clone +https?:\/\//.test(withBlocks)) throw new Error(`${where}: Adresse nach „git clone“ von Hand — nur über {{url:…}} (P3-05), sonst bricht sie am Handy mitten im Namen um`);
  if (withBlocks.includes(ctx.site.kit.name)) throw new Error(`${where}: „${ctx.site.kit.name}“ steht wörtlich in der Seite — nur über {{kit}} oder {{kit:titel}} (R4b b4), sonst wechselt diese Stelle am Tag der Veröffentlichung nicht mit`);
  return withBlocks.replace(/\{\{([a-z]+)(?::([^}]*))?\}\}/g, (m, kind, arg = "") => {
    switch (kind) {
      case "fact": return renderFact(arg.trim(), lang, ctx.facts);
      case "date": return `<time datetime="${esc(arg)}">${esc(formatDate(arg.trim(), lang))}</time>`;
      case "time": {
        const [iso, label] = arg.split("|");
        if (!iso || !label) throw new Error(`{{time:ISO|Text}} erwartet, gefunden ${m}`);
        return `<time datetime="${esc(iso)}">${esc(label)}</time>`;
      }
      case "todo": return offenComment(arg, where);
      case "email": return mailto(ctx.site.email);
      case "kernsatz": return esc(ctx.site.strings[lang].kernsatz);
      case "kit": return renderKit(arg.trim(), lang, ctx.site, ctx.state);
      case "url": return breakUrl(arg);
      case "karte": return renderKarte(arg.trim(), withBlocks, where);
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
  if (!meta.pair && !s.langLinkHome) throw new Error(`${meta.path}: strings.${meta.lang}.langLinkHome fehlt in site.json (Sprachlink ohne Sprachpaar, BF-07)`);
  // Zwei Tueren verlinken sich nicht (Positionierung §1.5): Auf einer Tuer-Seite (meta.door)
  // fehlen Navigationspunkte, die zur jeweils anderen Tuer gehoeren (item.door).
  const nav = site.nav[meta.lang].filter((item) => !(meta.door && item.door && item.door !== meta.door)).map((item) => {
    // aria-current="page" nur, wenn der Link genau diese Seite ist; sonst markiert er den Bereich (z. B. Projekte
    // auf einer Projektseite) mit aria-current="true" (WCAG 1.3.1/4.1.2, Barrierefreiheit BF-03).
    const cur = item.id === meta.nav ? (item.href === meta.path ? ' aria-current="page"' : ' aria-current="true"') : "";
    return `<li><a href="${item.href}"${cur}>${esc(item.label)}</a></li>`;
  });
  const footerLinks = s.footerNav.map((l) => `<li><a href="${l.href}">${esc(l.label)}</a></li>`).join("");
  const robots = meta.robots || "index,follow";
  const ogImage = abs(meta.ogImage || `/assets/og-${meta.lang}.png`);
  // Kernsatz (Positionierung v2 §1.1) steht einmal je Sprache in src/site.json; Seiten holen ihn mit
  // {{kernsatz}}, die Beschreibung darf ihn ebenso enthalten, das OG-Bild zeigt ihn (Stempel: src/og-stamp.json).
  const description = meta.description.replaceAll("{{kernsatz}}", s.kernsatz);
  if (description.includes("{{")) throw new Error(`${meta.path}: unbekannter Platzhalter in description`);
  const ogAlt = `Christian Bucher · ${s.ort}: ${s.kernsatz} ${new URL(site.origin).host}`;
  const head = [
    `<!doctype html>`,
    `<html lang="${meta.lang}" dir="ltr">`,
    `<head>`,
    `<meta charset="utf-8">`,
    `<meta name="viewport" content="width=device-width, initial-scale=1">`,
    `<title>${esc(meta.title)}</title>`,
    `<meta name="description" content="${esc(description)}">`,
    `<meta name="robots" content="${esc(robots)}">`,
    canonical ? `<link rel="canonical" href="${canonical}">` : "",
    ...alt,
    `<meta name="color-scheme" content="dark light">`,
    `<meta name="theme-color" content="#0b0c0e" media="(prefers-color-scheme: dark)">`,
    `<meta name="theme-color" content="#fbf8f3" media="(prefers-color-scheme: light)">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${esc(site.name)}">`,
    `<meta property="og:title" content="${esc(meta.title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
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
    `<p class="lang-switch"><a href="${langTarget}" hreflang="${other}" lang="${other}">${esc(meta.pair ? s.langLink : s.langLinkHome)}</a></p>`, // ohne Sprachpaar: Ziel ist die Startseite (WCAG 2.4.4, BF-07)
    `</div></header>`,
    `<main id="inhalt"><div class="wrap">`,
    html.trim(),
    `</div></main>`,
    `<footer class="site-footer"><div class="wrap">`,
    `<p>${mailto(site.email)}</p>`,
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

// OG-Bilder (src/static/assets/og-de.png, og-en.png) zeigen Kernsatz, Ort und Host als Pixel. Erzeugt
// werden sie mit `npm run og` (scripts/og-image.mjs, braucht Playwright); das Skript schreibt dazu
// src/og-stamp.json (Text + SHA-256 je Bild). Der Build bricht ab, wenn Text oder Bild nicht mehr zum
// Stempel passen — sonst zeigte die Link-Vorschau nach einer Aenderung still den alten Satz (fail-closed).
export function ogStampWant(site, lang) {
  const s = site.strings[lang] || {};
  if (!s.kernsatz || !s.ort) throw new Error(`site.json: strings.${lang} braucht kernsatz und ort`);
  return { kernsatz: s.kernsatz, ort: s.ort, host: new URL(site.origin).host };
}
function checkOgStamp(src, site) {
  const file = join(src, "og-stamp.json");
  if (!existsSync(file)) throw new Error("src/og-stamp.json fehlt — npm run og");
  const stamp = JSON.parse(readFileSync(file, "utf8"));
  for (const lang of ["de", "en"]) {
    const want = ogStampWant(site, lang);
    const got = stamp[lang] || {};
    for (const k of Object.keys(want)) {
      if (got[k] !== want[k]) throw new Error(`og-${lang}.png zeigt ${k} „${got[k]}“, src/site.json sagt „${want[k]}“ — npm run og`);
    }
    const png = join(src, "static", "assets", `og-${lang}.png`);
    const sha = createHash("sha256").update(readFileSync(png)).digest("hex");
    if (got.sha256 !== sha) throw new Error(`og-${lang}.png passt nicht zum Stempel in src/og-stamp.json — npm run og`);
  }
}

export function build({ src = SRC, env = process.env } = {}) {
  const site = JSON.parse(readFileSync(join(src, "site.json"), "utf8"));
  checkOgStamp(src, site);
  const factsRaw = readFileSync(join(src, "facts.json"), "utf8");
  const facts = JSON.parse(factsRaw).facts;
  for (const [k, f] of Object.entries(facts)) {
    if (!f.value || !f.source || !/^\d{4}-\d{2}-\d{2}$/.test(f.verified || "")) throw new Error(`facts.json: ${k} braucht value, source, verified (JJJJ-MM-TT)`);
    if ("offen" in f && !MARKER_ID.test(String(f.offen))) throw new Error(`facts.json: ${k}.offen — ${clearLen(String(f.offen))}`);
    if ("source_internal" in f && !/^intern:F-\d{2,3}$/.test(String(f.source_internal))) throw new Error(`facts.json: ${k}.source_internal nur als "intern:F-nn" — ${clearLen(String(f.source_internal))}`);
  }
  checkKit(site);
  // Privater Zustand wie beim Linter (lib/sperrliste.mjs): src/state.json, sonst SITE_PRIVATE_STATE (CI, Cloudflare),
  // sonst der engste Zustand; ist die Quelle da, aber ungueltig, bricht der Build ab, statt still mit einem Teilzustand
  // zu bauen.
  const { state, errors: stateErrors, source: stateSource } = loadState(join(src, ".."), env);
  if (stateErrors.length) throw new Error(`${stateSource} ungültig: ${stateErrors.join("; ")}`);
  const ctx = { site, facts, photo: loadPhoto(src), src, state, ifUsed: new Map() };
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
  checkIfZwillinge(ctx.ifUsed);
  for (const f of listFiles(join(src, "static"))) {
    const rel = relative(join(src, "static"), f).split(sep).join("/");
    if (out.has(rel)) throw new Error(`Datei doppelt: ${rel}`);
    // Basis-URL (R4 a13) steht nur in src/site.json; Textvorlagen in src/static tragen {{origin}}.
    if (STATIC_TEMPLATES.has(rel)) {
      const t = readFileSync(f, "utf8").replaceAll("{{origin}}", site.origin);
      if (t.includes("{{")) throw new Error(`${rel}: unbekannter Platzhalter in Vorlage`);
      out.set(rel, Buffer.from(t, "utf8"));
    } else out.set(rel, readFileSync(f));
  }
  out.set("facts.json", Buffer.from(publicFacts(factsRaw).replaceAll("{{origin}}", site.origin), "utf8"));
  out.set("sitemap.xml", Buffer.from(sitemap(pages, site), "utf8"));
  return out;
}

// CI-Hinweis (P3-04, gleiches Muster wie „Sperrliste NICHT GEPRÜFT“ im Linter): Ohne src/state.json und ohne
// SITE_PRIVATE_STATE baut der Build mit dem engsten Zustand. Das ist sicher (fail-closed); weicht der private Zustand aber
// davon ab, ist `build --check` dort rot, und gruen heisst nur „mit dem engsten Zustand gebaut“. Deshalb eine Annotation
// am Lauf, solange das Secret fehlt. Steht hier und nicht im Linter, weil der Build zuerst laeuft (auch im roten Fall).
// null = nichts zu melden.
export const STATE_NOTE = "src/state.json fehlt und SITE_PRIVATE_STATE ist nicht gesetzt: gebaut und geprüft mit dem engsten Zustand (STATE_STRICT). Weicht der private Zustand davon ab, ist build --check hier rot — Secret SITE_PRIVATE_STATE setzen.";
export function ciStateNote(source) {
  if (source !== "strict") return null;
  return { line: `::warning title=Zustand NICHT GESETZT::${STATE_NOTE}`, summary: `### Zustand NICHT GESETZT\n\n${STATE_NOTE}\n` };
}

function main() {
  const check = process.argv.includes("--check");
  const { source: stateSource } = loadState(ROOT);
  const note = process.env.GITHUB_ACTIONS === "true" ? ciStateNote(stateSource) : null;
  if (note) {
    console.log(note.line);
    if (process.env.GITHUB_STEP_SUMMARY) try { appendFileSync(process.env.GITHUB_STEP_SUMMARY, note.summary); } catch { /* Zusatz; die Annotation steht schon im Log */ }
  }
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
      console.error(`site/ passt nicht zum Quellstand (${diffs.length} Dateien anders) — bitte "npm run build" ausführen und committen:`);
      for (const d of diffs.slice(0, 40)) console.error("  " + d);
      if (stateSource === "strict") console.error(`Hinweis: ${STATE_NOTE}`);
      process.exit(1);
    }
    console.log(`build --check: site/ entspricht dem Quellstand (${out.size} Dateien).`);
  } else {
    console.log(`build: ${out.size} Dateien, ${diffs.length} geschrieben/entfernt.`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
