#!/usr/bin/env node
// Sperrliste v2 auf beliebige Textdateien anwenden (Positionierung v2 §13 A–G), z. B. auf Lebenslaeufe,
// Profiltexte oder Plaene ausserhalb dieses Repositories. Dieselben Regeln wie der Site-Linter:
// A–F aus scripts/lint-config.mjs (bedingte Regeln mit dem privaten Zustand src/state.json, ohne Datei der
// engste Zustand), G und
// vertrauliche Eintraege aus der privaten Liste (.site-private-denylist.txt oder SITE_PRIVATE_DENYLIST).
// Dokumente gelten als "alle Flaechen": seitengebundene Regeln greifen ueberall (ausser siteOnly).
//
//   node scripts/sperrliste-scan.mjs <datei|ordner> …           Zaehlung je Datei und Gruppe
//   node scripts/sperrliste-scan.mjs --ids <…>                  zusaetzlich je Regel-Id
//   node scripts/sperrliste-scan.mjs --lines <…>                zusaetzlich Zeilennummer + Regel-Id
//
// Ausgegeben werden nie Fundstellen-Texte, nur Zahlen, Regel-Ids und Zeilennummern — die Ausgabe darf
// in Protokolle und Logs. Exit 1, sobald es einen Treffer gibt; Exit 2 bei ungueltiger Liste/Zustand.
//
// Was die Schicht darunter im Fehlerfall schon selbst tut: nichts — ein nicht lesbarer Ordner waere
// still leer. Deshalb zaehlt die Ausgabe die gelesenen Dateien, und ein Pfad ohne Textdatei ist ein Fehler.
//
// Gitignorierte Dateien (z. B. die private src/state.json mit ihrer Legende) sind keine oeffentliche Flaeche:
// In einem Ordner innerhalb eines git-Arbeitsbaums liest der Scan nur, was `git ls-files --cached --others
// --exclude-standard` nennt (verfolgt oder neu, aber nicht ignoriert). Ausdruecklich genannte Dateien und
// ausdruecklich genannte ignorierte Ordner (z. B. private Entwuerfe) liest er immer; ausserhalb von git alles.
// Ausgelassene Dateien werden gezaehlt, nicht benannt (ihre Namen koennen selbst privat sein).

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { loadState, checkSperrliste, parsePrivateList, bindPrivateRules, checkPrivate } from "./lib/sperrliste.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TEXT = /\.(?:md|txt|html?|json|ya?ml|csv|tex)$/i;
const GROUPS = ["A", "B", "C", "D", "E", "F", "G"];

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const paths = args.filter((a) => !a.startsWith("--"));
if (!paths.length) { console.error("Aufruf: node scripts/sperrliste-scan.mjs [--ids] [--lines] <datei|ordner> …"); process.exit(2); }

const { state, errors: stateErrors, strict } = loadState(ROOT);
if (stateErrors.length) { for (const e of stateErrors) console.error(`  FEHLER STATE-invalid src/state.json: ${e}`); process.exit(2); }

const envList = process.env.SITE_PRIVATE_DENYLIST;
const listFile = process.env.SITE_PRIVATE_DENYLIST_FILE || join(ROOT, ".site-private-denylist.txt");
const rawList = envList && envList.trim() ? envList.split(/\r?\n/) : existsSync(listFile) ? readFileSync(listFile, "utf8").split(/\r?\n/) : [];
const { entries, bound, errors: listErrors } = parsePrivateList(rawList);
const { rules, missing, errors: bindErrors } = bindPrivateRules(bound);
if (listErrors.length || bindErrors.length) { for (const e of [...listErrors, ...bindErrors]) console.error(`  FEHLER PRIV-list-invalid: ${e}`); process.exit(2); }
if (!entries.length && !bound.length) console.log("  HINWEIS private Liste fehlt — Gruppe G und vertrauliche Einträge NICHT GEPRÜFT");
for (const id of missing) console.log(`  HINWEIS Regel ${id} hat privaten Wortlaut, die private Liste bindet ihn nicht — NICHT GEPRÜFT`);

// Sichtbare Dateien eines Ordners laut git (absolute Pfade) oder null = kein Filter (ausserhalb von git, git
// fehlt, oder der Ordner ist selbst ignoriert und wurde ausdruecklich genannt).
function gitVisible(dir) {
  const git = (...a) => execFileSync("git", ["-C", dir, ...a], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  try { git("rev-parse", "--is-inside-work-tree"); } catch { return null; }
  try { git("check-ignore", "-q", "."); return null; } catch { /* Exit 1 = nicht ignoriert: filtern */ }
  return new Set(git("ls-files", "-z", "--cached", "--others", "--exclude-standard").split("\0").filter(Boolean).map((f) => resolve(dir, f)));
}

const files = [];
let ignored = 0;
const collect = (p, visible) => {
  if (!existsSync(p)) { console.error(`  FEHLER Pfad fehlt: ${p}`); process.exit(2); }
  if (statSync(p).isDirectory()) { for (const n of readdirSync(p).sort()) if (!n.startsWith(".") && n !== "node_modules" && n !== "__pycache__") collect(join(p, n), visible); }
  else if (TEXT.test(p)) { if (visible && !visible.has(resolve(p))) ignored++; else files.push(p); }
};
for (const p of paths) {
  const before = files.length;
  collect(p, existsSync(p) && statSync(p).isDirectory() ? gitVisible(p) : null);
  if (files.length === before) { console.error(`  FEHLER keine Textdatei unter ${p}`); process.exit(2); }
}

let total = 0;
const sum = Object.fromEntries(GROUPS.map((g) => [g, 0]));
console.log(`Datei${" ".repeat(52)}${GROUPS.join("    ")}`);
for (const f of files) {
  const count = Object.fromEntries(GROUPS.map((g) => [g, 0]));
  const ids = {}, lines = [];
  readFileSync(f, "utf8").split(/\r?\n/).forEach((line, i) => {
    const hits = [
      ...checkSperrliste(line, { state, page: null, rules }).map((h) => ({ group: h.group, id: h.id })),
      ...checkPrivate(line, entries).map((h) => ({ group: h.group, id: `privat-${h.n}` })),
    ];
    for (const h of hits) { count[h.group]++; ids[h.id] = (ids[h.id] || 0) + 1; lines.push(`${i + 1}:${h.id}`); }
  });
  const n = GROUPS.reduce((a, g) => a + count[g], 0);
  total += n;
  for (const g of GROUPS) sum[g] += count[g];
  const name = relative(process.cwd(), f) || f;
  console.log(`${name.length > 55 ? "…" + name.slice(-54) : name.padEnd(55)}  ${GROUPS.map((g) => String(count[g]).padStart(3)).join("  ")}`);
  if (flags.has("--ids") && n) console.log(`      ${Object.entries(ids).map(([k, v]) => `${k}×${v}`).join(" ")}`);
  if (flags.has("--lines") && n) console.log(`      Zeilen ${lines.join(" ")}`);
}
console.log(`${"Summe".padEnd(55)}  ${GROUPS.map((g) => String(sum[g]).padStart(3)).join("  ")}`);
console.log(`\nsperrliste-scan: ${files.length} Dateien, ${total} Treffer (Zustand: ${strict ? "engster (src/state.json fehlt)" : Object.entries(state).filter(([k]) => !k.startsWith("_")).map(([k, v]) => `${k} ${Array.isArray(v) ? v.length : v}`).join(", ")}; private Liste ${entries.length} Einträge, ${bound.length} Bindungen; ${ignored} gitignorierte Datei${ignored === 1 ? "" : "en"} ausgelassen).`);
process.exit(total ? 1 : 0);
