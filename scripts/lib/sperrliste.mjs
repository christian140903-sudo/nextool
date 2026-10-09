// Sperrliste v2 (Positionierung v2 §13): Zustand lesen, private Liste parsen, Regeln anwenden.
// Gemeinsam genutzt von scripts/lint-site.mjs (Website) und scripts/sperrliste-scan.mjs (beliebige
// Textdateien, z. B. Lebenslaeufe ausserhalb des Repos). Treffer der privaten Liste werden nie im
// Klartext zurueckgegeben, nur mit Nummer und Gruppe (CI-Logs sind oeffentlich).
//
// Was die Schicht darunter im Fehlerfall schon selbst tut: nichts — ein fehlender oder falsch
// geschriebener Zustand waere fuer JavaScript einfach `undefined`, und jede bedingte Regel waere still
// aus. Deshalb ist der Zustand fail-closed: Fehlt die Datei (sie ist nicht im oeffentlichen Repository),
// gilt der engste Zustand STATE_STRICT. Ist sie da, aber fehlt ein Schluessel oder hat er einen
// unbekannten Wert, meldet validateState einen Fehler und der Linter scheitert.

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { SPERRLISTE, STATE_SCHEMA, STATE_STRICT, STATE_OPTIONAL, PRIVATE_SLOTS, IF_ZWILLINGE } from "../lint-config.mjs";

// Verneinung (Rechtsabnahme Welle E, E-03): ein verneinter Satz ist keine Behauptung.
export const NEGATION = /(?<![\p{L}\p{N}])(?:nicht|nichts|kein|keine|keinen|keinem|keiner|keines|nie|niemals|ohne|weder|not|no|never|nothing|none|neither|nor|without)(?![\p{L}\p{N}])|n['’]t(?!\p{L})/iu;
// Satzgrenze nur vor Grossbuchstaben/Anfuehrung, damit "Art. 4" und "z. B." nicht zerfallen.
export const sentencesOf = (text) => text.split(/(?<=[.!?…])\s+(?=[\p{Lu}„“"(])/u);

const get = (obj, path) => path.split(".").reduce((o, k) => (o && typeof o === "object" ? o[k] : undefined), obj);

// strict = true: Datei fehlt, es gilt STATE_STRICT (kein Fehler). errors nicht leer: Datei da, aber ungueltig.
export function loadState(rootDir) {
  const file = join(rootDir, "src", "state.json");
  if (!existsSync(file)) return { state: STATE_STRICT, errors: [], strict: true };
  let state;
  try { state = JSON.parse(readFileSync(file, "utf8")); } catch (e) { return { state: null, errors: [`src/state.json nicht lesbar: ${e.message}`], strict: false }; }
  if (state && typeof state === "object") for (const k of STATE_OPTIONAL) if (state[k] === undefined) state[k] = STATE_STRICT[k];
  return { state, errors: validateState(state), strict: false };
}

// Gibt Fehlertexte zurueck (leer = gueltig). Unbekannte Schluessel sind ebenfalls ein Fehler: Ein
// Tippfehler ("endzustant") darf nicht still neben dem echten Schluessel stehen.
export function validateState(state) {
  const errors = [];
  if (!state || typeof state !== "object") return ["Zustand ist kein Objekt"];
  for (const [path, rule] of Object.entries(STATE_SCHEMA)) {
    const v = get(state, path);
    if (v === undefined) { if (!STATE_OPTIONAL.has(path)) errors.push(`${path} fehlt`); }
    else if (rule === "ids" ? !Array.isArray(v) || !v.every((x) => typeof x === "string" && /^F-\d{2,3}$/.test(x))
      : Array.isArray(rule) ? !rule.includes(v) : rule === "array" ? !Array.isArray(v) : typeof v !== rule || (rule === "string" && !v.trim()))
      errors.push(`${path} = ${JSON.stringify(v)} ist nicht erlaubt (${Array.isArray(rule) ? rule.join("|") : rule === "ids" ? "Liste von Kennungen F-nn" : rule})`);
  }
  const known = new Set(Object.keys(STATE_SCHEMA).flatMap((p) => p.split(".").map((_, i, a) => a.slice(0, i + 1).join("."))));
  const walk = (o, pre) => {
    for (const [k, v] of Object.entries(o)) {
      if (k.startsWith("_")) continue; // _about
      const p = pre ? `${pre}.${k}` : k;
      if (!known.has(p)) errors.push(`${p} ist kein bekannter Schlüssel (Tippfehler?)`);
      else if (v && typeof v === "object" && !Array.isArray(v)) walk(v, p);
    }
  };
  walk(state, "");
  if (Array.isArray(state.zC4)) state.zC4.forEach((v, i) => { if (!v || !v.ort || !/^\d{4}-\d{2}-\d{2}$/.test(v.datum || "")) errors.push(`zC4[${i}] braucht ort und datum (JJJJ-MM-TT)`); });
  // DE/EN-Zwillinge (P3-03): nur beide oder keine freigeben, sonst steht eine Stelle nur in einer Sprache.
  if (Array.isArray(state.zE1)) for (const [de, en] of IF_ZWILLINGE) {
    if (state.zE1.includes(de) !== state.zE1.includes(en)) { const [a, b] = state.zE1.includes(de) ? [de, en] : [en, de]; errors.push(`zE1 gibt ${a} frei, aber nicht seinen Zwilling ${b} (IF_ZWILLINGE) — DE und EN nur gemeinsam`); }
  }
  return errors;
}

// Private Liste: eine Zeile je Eintrag. "# …" = Kommentar. Optional "[G] " (A–G) als Gruppe, sonst G.
// "re:<Ausdruck>" = regulaerer Ausdruck (Flags i, u), sonst ein Wort/Begriff mit Wortgrenzen.
// "@<Regel-Id> re:<Ausdruck>" (nach der Gruppe) = Bindung: liefert den Ausdruck einer oeffentlichen Regel
// mit privatem Wortlaut (lint-config: re: null, private: true). Die Regel behaelt ihre oeffentliche
// Bedingung (when), Verneinung und Seitenbindung; nur der Wortlaut bleibt privat.
// "@<Name> re:<Ausdruck>" mit einem Namen aus PRIVATE_SLOTS = privates Kontextmuster (ctx/unless "@<Name>").
export function parsePrivateList(lines) {
  const entries = [], bound = [], errors = [];
  let n = 0;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    n++;
    const m = /^\[([A-G])\]\s+(.+)$/.exec(line);
    const group = m ? m[1] : "G";
    const rest = m ? m[2].trim() : line;
    const b = /^@([A-Za-z0-9-]+)\s+(.+)$/.exec(rest);
    const body = b ? b[2].trim() : rest;
    try {
      const re = body.startsWith("re:")
        ? new RegExp(body.slice(3), "iu")
        : new RegExp(`(?<![\\p{L}\\p{N}])${body.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}])`, "iu");
      if (b) bound.push({ n, id: b[1], group: m ? m[1] : null, re });
      else entries.push({ n, group, re });
    } catch {
      errors.push(`Eintrag Nr. ${n} ist kein gültiger Ausdruck`); // Inhalt nie ausgeben
    }
  }
  return { entries, bound, errors };
}

// Setzt die gebundenen privaten Ausdruecke in die oeffentlichen Regeln ein: Wortlaut (private: true) und
// Kontextmuster (ctx/unless "@<Name>", Namen aus PRIVATE_SLOTS).
// rules = alle pruefbaren Regeln (Regeln, denen ein privater Teil fehlt, fallen heraus), missing = deren Ids
// (NICHT geprueft), errors = Bindung an eine unbekannte/nicht private Regel oder ein unbekanntes Muster, falsche
// Gruppe, doppelte Bindung (nie mit Inhalt).
export function bindPrivateRules(bound, rules = SPERRLISTE, slots = PRIVATE_SLOTS) {
  const errors = [], byId = new Map();
  for (const b of bound) {
    const r = rules.find((x) => x.id === b.id);
    const group = r ? r.group : slots[b.id];
    if (!group || (r && !r.private)) errors.push(`Eintrag Nr. ${b.n} bindet keine Regel mit privatem Wortlaut`);
    else if (b.group && b.group !== group) errors.push(`Eintrag Nr. ${b.n}: Gruppe passt nicht zu ${b.id} (${group})`);
    else if (byId.has(b.id)) errors.push(`Eintrag Nr. ${b.n}: ${b.id} ist schon gebunden`);
    else byId.set(b.id, b.re);
  }
  const ref = (v) => (typeof v === "string" ? byId.get(v.replace(/^@/, "")) : v);
  const needs = (r) => [...(r.private ? [r.id] : []), ...[r.ctx, r.unless].filter((v) => typeof v === "string").map((v) => v.replace(/^@/, ""))];
  const complete = (r) => needs(r).every((id) => byId.has(id));
  return {
    rules: rules.filter(complete).map((r) => (needs(r).length ? { ...r, re: r.private ? byId.get(r.id) : r.re, ctx: ref(r.ctx), unless: ref(r.unless) } : r)),
    missing: rules.filter((r) => !complete(r)).map((r) => r.id),
    errors,
  };
}

// Wendet die oeffentlichen Regeln an. page = URL-Pfad der Seite oder null (Dokument-Scan: alle Flaechen).
// skipPageRules: seitengebundene Regeln (pages, siteOnly) auslassen, z. B. fuer Commit-Nachrichten.
// Regeln mit privatem Wortlaut liefern den Treffer nie im Klartext (match = null, nur len).
const PUBLIC_RULES = bindPrivateRules([]).rules; // ohne private Liste pruefbar
export function checkSperrliste(text, { state, page = null, rules = PUBLIC_RULES, skipPageRules = false } = {}) {
  const hits = [];
  if (!text || !state) return hits;
  const sentences = sentencesOf(text);
  for (const r of rules) {
    if (!r.re) continue; // privater Wortlaut ohne Bindung: meldet der Aufrufer (bindPrivateRules.missing)
    if (r.when && !r.when(state)) continue;
    if (skipPageRules && (r.pages || r.siteOnly)) continue;
    if (page !== null && r.pages && !r.pages.includes(page)) continue;
    if (page === null && r.siteOnly) continue;
    let found = null;
    for (const s of sentences) {
      const m = r.re.exec(s);
      if (!m) continue;
      if (r.negatable && NEGATION.test(s)) continue;
      if (r.sentence && r.ctx && !r.ctx.test(s)) continue;
      if (r.sentence && r.unless && r.unless.test(s)) continue;
      found = m;
      break;
    }
    if (!found) continue;
    if (!r.sentence && r.ctx && !r.ctx.test(text)) continue;
    if (!r.sentence && r.unless && r.unless.test(text)) continue;
    hits.push({ id: r.id, group: r.group, match: r.private ? null : found[0], len: [...found[0]].length, private: !!r.private, why: r.why });
  }
  return hits;
}

export function checkPrivate(text, entries) {
  return entries.filter((e) => e.re.test(text)).map((e) => ({ n: e.n, group: e.group }));
}
