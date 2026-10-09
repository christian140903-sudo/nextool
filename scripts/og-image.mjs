#!/usr/bin/env node
// Erzeugt die Link-Vorschaubilder src/static/assets/og-de.png und og-en.png (1200 x 630) aus
// src/site.json (Kernsatz, Ort, Host) und schreibt src/og-stamp.json (Text + SHA-256 je Bild).
// Der Build prueft den Stempel und bricht ab, wenn Kernsatz, Ort, Host oder Bild nicht mehr passen.
// Aufruf: npm run og   (braucht Playwright mit Chromium, lokal oder global; nicht in CI)
// Was tut die Schicht darunter im Fehlerfall? Playwright wirft bei fehlendem Browser; dann bleibt der
// alte Stand unveraendert, und der Build meldet weiter den veralteten Stempel.

import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ogStampWant } from "./build.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");
const ASSETS = join(SRC, "static", "assets");

function loadPlaywright() {
  const req = createRequire(import.meta.url);
  try { return req("playwright"); } catch { /* global versuchen */ }
  try { return req(join(execFileSync("npm", ["root", "-g"], { encoding: "utf8" }).trim(), "playwright")); }
  catch { console.error("Playwright nicht gefunden (npm i -g playwright oder lokal installieren)."); process.exit(2); }
}

const font = (f) => `data:font/woff2;base64,${readFileSync(join(ASSETS, "fonts", f)).toString("base64")}`;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Farben = Dark-Tokens aus src/static/assets/site.css (--bg, --accent, --text, --text-muted).
const page = ({ kernsatz, ort, host }, lang) => `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><style>
@font-face { font-family: "Inter"; src: url(${font("inter-latin-var.woff2")}) format("woff2"); font-weight: 100 900; }
@font-face { font-family: "JetBrains Mono"; src: url(${font("jetbrains-mono-latin-var.woff2")}) format("woff2"); font-weight: 100 800; }
html, body { margin: 0; width: 1200px; height: 630px; background: #0b0c0e; overflow: hidden; }
body { border-top: 9px solid #e8a54a; box-sizing: border-box; position: relative; -webkit-font-smoothing: antialiased; }
.eyebrow, .host { position: absolute; left: 80px; margin: 0; font: 500 30px/1 "JetBrains Mono", monospace; }
.eyebrow { top: 74px; color: #b0b4bc; }
.host { top: 536px; color: #e8a54a; }
h1 { position: absolute; left: 80px; top: 140px; width: 1040px; margin: 0; color: #edeef0;
     font: 700 60px/75px "Inter", sans-serif; letter-spacing: -0.012em; }
</style></head><body>
<p class="eyebrow">Christian Bucher · ${esc(ort)}</p>
<h1>${esc(kernsatz)}</h1>
<p class="host">${esc(host)}</p>
</body></html>`;

const site = JSON.parse(readFileSync(join(SRC, "site.json"), "utf8"));
const { chromium } = loadPlaywright();
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
const stamp = {
  _about: "Stempel der OG-Bilder: welcher Text in og-<lang>.png steht und welche Datei dazu gehoert. Geschrieben von scripts/og-image.mjs (npm run og), geprueft vom Build.",
};
for (const lang of ["de", "en"]) {
  const want = ogStampWant(site, lang);
  await p.setContent(page(want, lang), { waitUntil: "load" });
  await p.evaluate(() => document.fonts.ready);
  const lines = await p.evaluate(() => { const h = document.querySelector("h1"); return Math.round(h.getBoundingClientRect().height / 75); });
  if (lines > 4) throw new Error(`og-${lang}: Kernsatz braucht ${lines} Zeilen, Platz ist fuer 4`);
  const file = join(ASSETS, `og-${lang}.png`);
  writeFileSync(file, await p.screenshot({ type: "png" }));
  stamp[lang] = { ...want, sha256: createHash("sha256").update(readFileSync(file)).digest("hex") };
  console.log(`og-${lang}.png: ${lines} Zeilen, ${stamp[lang].sha256.slice(0, 12)}`);
}
await browser.close();
writeFileSync(join(SRC, "og-stamp.json"), JSON.stringify(stamp, null, 2) + "\n");
console.log("src/og-stamp.json geschrieben — danach npm run build");
