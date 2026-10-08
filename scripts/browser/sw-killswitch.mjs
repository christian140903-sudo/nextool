#!/usr/bin/env node
// Browser-Test des Abmelde-Workers (site/sw.js, site/prep/sw.js) — NICHT Teil von npm test,
// weil die CI (.github/workflows/site-check.yml) keinen Browser hat. Lokal:
//   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers npm run test:sw
// Braucht Playwright (lokal oder global installiert) und Chromium.
//
// Was die Schicht darunter im Fehlerfall schon selbst tut: Scheitert das Update eines Service
// Workers (404, Weiterleitung, falscher MIME-Typ, CSP), laeuft der alte Worker einfach weiter —
// still, ohne Meldung an uns. Deshalb prueft dieser Test den ENDZUSTAND im Browser (keine
// Registrierung, keine Caches) und loest den Fehlerfall (kein Abmelde-Worker) einmal bewusst aus.
//
// Ablauf je Szenario (eigener Browser-Kontext, ein Server, gleiche Adresse):
//   1. Stand "alt": Seiten registrieren die alten Worker aus fixtures/ (byte-gleich mit dem
//      Live-Stand 4505f3c: /sw.js "anima-v1", /prep/sw.js "amr-training-v2"); Caches gefuellt.
//   2. Umschalten auf den neuen Stand: site/ mit _redirects und _headers (createSiteHandler aus
//      scripts/serve.mjs, also mit der echten CSP fuer /*).
//   3. Update ausloesen (Navigation bzw. registration.update()) und den Endzustand pruefen.
// Szenarien: A Navigation (Normalfall) · B registration.update() aus einer Seite mit der neuen CSP
// · C/E/F Gegenproben, die scheitern MUESSEN (kein Abmelde-Worker; /prep/sw.js hinter Splat-
// Weiterleitung; CSP mit sandbox) · D Erstbesuch ohne alten Worker.
// Ergebnis 2026-10-08 (Chromium 141): 13 von 13 — die CSP fuer /* (script-src 'none',
// worker-src 'none') blockiert weder den Abmelde-Worker noch das Update.

import { createServer } from "node:http";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createSiteHandler } from "../serve.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = join(HERE, "..", "..", "site");

function loadPlaywright() {
  const req = createRequire(import.meta.url);
  try { return req("playwright"); } catch { /* global versuchen */ }
  try { return req(join(execFileSync("npm", ["root", "-g"], { encoding: "utf8" }).trim(), "playwright")); }
  catch { console.error("Playwright nicht gefunden (npm i -g playwright oder lokal installieren)."); process.exit(2); }
}

// --- Server: ein Port, umschaltbarer Stand ---------------------------------------------
const OLD_SW = readFileSync(join(HERE, "fixtures", "alt-sw.js"));
const OLD_PREP_SW = readFileSync(join(HERE, "fixtures", "alt-prep-sw.js"));
const oldPage = (title, swUrl) => `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>${title}</title></head>
<body><h1>${title}</h1><script>if ('serviceWorker' in navigator) navigator.serviceWorker.register('${swUrl}').catch(() => {});</script></body></html>`;
// Alter Stand wie bis Juli 2026: keine CSP, Seiten registrieren die Worker (index.html: '/sw.js', prep/index.html: 'sw.js').
const OLD = {
  "/": [200, "text/html; charset=utf-8", oldPage("Alter Stand", "/sw.js")],
  "/index.html": [200, "text/html; charset=utf-8", oldPage("Alter Stand", "/sw.js")],
  "/sw.js": [200, "application/javascript; charset=utf-8", OLD_SW],
  "/img/favicon.svg": [200, "image/svg+xml", '<svg xmlns="http://www.w3.org/2000/svg"/>'],
  "/img/og-image.png": [200, "image/png", "png"],
  "/manifest.json": [200, "application/json", "{}"],
  "/prep/": [200, "text/html; charset=utf-8", oldPage("Alte Prep-Seite", "sw.js")],
  "/prep/index.html": [200, "text/html; charset=utf-8", oldPage("Alte Prep-Seite", "sw.js")],
  "/prep/sw.js": [200, "application/javascript; charset=utf-8", OLD_PREP_SW],
  "/prep/manifest.json": [200, "application/json", "{}"],
};
const newHandler = createSiteHandler(SITE);
let state = "alt";
const log = [];
const server = createServer((req, res) => {
  const path = new URL(req.url, "http://x").pathname;
  const done = () => log.push({ state, path, status: res.statusCode, type: res.getHeader("content-type") || "" });
  res.on("finish", done);
  if (state === "alt") {
    const r = OLD[path];
    if (!r) { res.writeHead(404, { "Content-Type": "text/plain" }); return res.end("404"); }
    res.writeHead(r[0], { "Content-Type": r[1], "Cache-Control": "max-age=600" }); // wie GitHub Pages
    return res.end(r[2]);
  }
  if (state === "neu-ohne-abmelder" && /^\/(prep\/)?sw\.js$/.test(path)) { res.writeHead(404); return res.end(); }
  // wie vor diesem Umbau: _redirects "/prep/*  /  301" verdeckte /prep/sw.js
  if (state === "neu-prep-splat" && path === "/prep/sw.js") { res.writeHead(301, { Location: "/" }); return res.end(); }
  // Probe, ob der Test eine blockierende CSP erkennt: sandbox ist laut CSP3 die Direktive, deren
  // Initialisierung einen Worker-Global blockiert (zusaetzliche Policy, wie eine zweite _headers-Regel).
  if (state === "neu-csp-sandbox" && /^\/(prep\/)?sw\.js$/.test(path)) {
    const orig = res.writeHead.bind(res);
    res.writeHead = (st, h = {}) => orig(st, { ...h, "Content-Security-Policy": `${h["Content-Security-Policy"] || ""}, sandbox` });
  }
  return newHandler(req, res);
});

// --- Helfer ------------------------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Zustand aus Sicht der Seite. Die Seite kann waehrenddessen vom Worker neu geladen werden -> Wiederholung.
async function snapshot(page) {
  for (let i = 0; i < 20; i++) {
    try {
      return await page.evaluate(async () => {
        const regs = await navigator.serviceWorker.getRegistrations();
        const names = await caches.keys();
        const caches_ = {};
        for (const n of names) caches_[n] = (await (await caches.open(n)).keys()).length;
        return { url: location.pathname, controller: !!navigator.serviceWorker.controller, scopes: regs.map((r) => new URL(r.scope).pathname).sort(), caches: caches_ };
      });
    } catch { await sleep(250); }
  }
  throw new Error("Zustand nicht lesbar (Seite laedt dauernd neu?)");
}
async function waitFor(page, pred, ms = 15000) {
  const end = Date.now() + ms;
  let s;
  while (Date.now() < end) { s = await snapshot(page); if (pred(s)) return { ok: true, s }; await sleep(300); }
  return { ok: false, s };
}

async function setupOld(page, base) {
  state = "alt";
  await page.goto(base + "/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); // jetzt kontrolliert
  await page.goto(base + "/prep/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  // Der alte /prep/-Worker loescht beim Aktivieren alle fremden Caches (auch anima-v1);
  // ein weiterer Besuch von / fuellt anima-v1 wieder (network-first legt HTML ab).
  await page.goto(base + "/");
  await page.goto(base + "/prep/");
  const r = await waitFor(page, (s) => s.scopes.join() === "/,/prep/" && s.caches["anima-v1"] > 0 && s.caches["amr-training-v2"] > 0);
  if (!r.ok) throw new Error(`alter Stand nicht hergestellt: ${JSON.stringify(r.s)}`);
  // Chromium startet das Soft Update erst kurz NACH einer Navigation. Ohne diese Pause liefe das
  // Update des letzten Aufbau-Besuchs schon gegen den neuen Stand (Ursache/Wirkung verwischt).
  await sleep(3000);
  return r.s;
}

// --- Szenarien ---------------------------------------------------------------------------
const results = [];
const check = (name, ok, detail) => { results.push({ name, ok, detail }); console.log(`  ${ok ? "ok   " : "FEHLER"} ${name}: ${detail}`); };

async function main() {
  const { chromium } = loadPlaywright();
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  console.log(`Browser: Chromium ${browser.version()} · Server ${base} · site/ = ${SITE}`);

  // 0. Header der neuen Worker-Datei (vom selben Nachbau, den die Szenarien nutzen)
  state = "neu";
  for (const p of ["/sw.js", "/prep/sw.js"]) {
    const res = await fetch(base + p);
    const h = Object.fromEntries(res.headers);
    const ok = res.status === 200 && /^text\/javascript/.test(h["content-type"] || "") && h["cache-control"] === "no-cache" && /script-src 'none'/.test(h["content-security-policy"] || "");
    check(`Header ${p}`, ok, `${res.status} · ${h["content-type"]} · Cache-Control ${h["cache-control"]} · CSP ${h["content-security-policy"] ? "aus /* (script-src 'none', worker-src 'none')" : "FEHLT"}`);
  }

  // A. Update durch Navigation (der normale Weg fuer Besucher: Seiten haben keine Skripte)
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const before = await setupOld(page, base);
    let navs = 0;
    page.on("framenavigated", (f) => { if (f === page.mainFrame()) navs++; });
    state = "neu";
    await page.goto(base + "/");
    const navsAfterGoto = navs;
    const root = await waitFor(page, (s) => !s.scopes.includes("/"));
    await sleep(1500); // Zeit fuer das Neuladen durch client.navigate()
    const reloaded = navs > navsAfterGoto;
    await page.goto(base + "/prep/"); // alter /prep/-Worker faengt ab, Server leitet auf / weiter, Soft Update holt /prep/sw.js
    const all = await waitFor(page, (s) => s.scopes.length === 0 && Object.keys(s.caches).length === 0);
    await page.goto(base + "/kontakt/");
    const fresh = await snapshot(page);
    const title = await page.title();
    check("A Navigation: alter Stand hergestellt", true, `Registrierungen ${before.scopes.join(" ")} · Caches ${JSON.stringify(before.caches)}`);
    check("A Navigation: /-Worker abgemeldet", root.ok, JSON.stringify(root.s));
    check("A Navigation: Fenster neu geladen (client.navigate)", reloaded, `${navs - navsAfterGoto} zusätzliche Navigation(en) nach goto("/")`);
    check("A Navigation: keine Registrierung, keine Caches", all.ok, JSON.stringify(all.s));
    check("A Navigation: neue Seite ohne Worker", !fresh.controller && /Christian Bucher/.test(title), `controller=${fresh.controller} · title="${title}"`);
    await ctx.close();
  }

  // B. registration.update() aus einer Seite des NEUEN Stands (Seiten-CSP worker-src 'none')
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await setupOld(page, base);
    state = "neu";
    await page.goto(base + "/kontakt/"); // meldet den /-Worker per Soft Update ab (wie A)
    await waitFor(page, (s) => !s.scopes.includes("/"));
    const before = await snapshot(page);
    const upd = await page.evaluate(async () => {
      const r = await navigator.serviceWorker.getRegistration("/prep/");
      if (!r) return "keine /prep/-Registrierung";
      try { await r.update(); return "update() erfüllt"; } catch (e) { return `update() abgelehnt: ${e.name}: ${e.message}`; }
    });
    const after = await waitFor(page, (s) => s.scopes.length === 0, 10000);
    check("B update() unter Seiten-CSP: Ausgangslage", before.scopes.join() === "/prep/", `nur /prep/ registriert: ${JSON.stringify(before.scopes)}`);
    check("B update() unter Seiten-CSP: /prep/-Worker abgemeldet", after.ok, `${upd} · danach ${JSON.stringify(after.s)}`);
    await ctx.close();
  }

  // C. Gegenprobe (Fehlerfall bewusst ausgeloest): neuer Stand OHNE Abmelde-Worker
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await setupOld(page, base);
    state = "neu-ohne-abmelder";
    await page.goto(base + "/");
    await page.goto(base + "/prep/");
    await sleep(4000);
    const s = await snapshot(page);
    const stuck = s.scopes.length > 0;
    check("C Gegenprobe ohne Abmelde-Worker: alte Worker bleiben", stuck, `${JSON.stringify(s)} (erwartet: Registrierungen bleiben — der Test erkennt den Fehlerfall)`);
    await ctx.close();
  }

  // E/F. Weitere Gegenproben: dieselbe Abfolge wie A, aber mit einem bekannten Fehler im neuen Stand
  for (const [st, name, expect] of [
    ["neu-prep-splat", "E Gegenprobe /prep/sw.js hinter Splat-Weiterleitung", "/prep/-Worker bleibt (Update-Abruf darf nicht umgeleitet werden)"],
    ["neu-csp-sandbox", "F Gegenprobe CSP mit sandbox auf dem Worker", "Endzustand NICHT sauber — eine blockierende CSP würde erkannt"],
  ]) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await setupOld(page, base);
    state = st;
    await page.goto(base + "/");
    await sleep(3500);
    await page.goto(base + "/prep/");
    await sleep(3500);
    const s = await snapshot(page);
    // F: Chromium startet den Worker mit sandbox als undurchsichtigen Ursprung; CacheStorage ist dann
    // gesperrt, die Abmeldung laeuft trotzdem (try/catch im Worker). Das Hauptkriterium aus A
    // (keine Registrierung UND keine Caches) muss hier also verfehlt werden.
    const clean = s.scopes.length === 0 && Object.keys(s.caches).length === 0;
    const ok = st === "neu-prep-splat" ? s.scopes.includes("/prep/") && !s.scopes.includes("/") : !clean;
    check(name, ok, `${JSON.stringify(s)} (erwartet: ${expect})`);
    await ctx.close();
  }

  // D. Erstbesuch: die neue Website registriert keinen Worker und laedt sw.js nie
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const errors = [];
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    state = "neu";
    const from = log.length;
    for (const p of ["/", "/en/", "/kontakt/", "/archiv/"]) await page.goto(base + p);
    await sleep(1000);
    const s = await snapshot(page);
    const swHits = log.slice(from).filter((l) => /sw\.js$/.test(l.path)).length;
    check("D Erstbesuch: kein Worker, kein Cache, sw.js nicht geladen", s.scopes.length === 0 && Object.keys(s.caches).length === 0 && swHits === 0 && errors.length === 0, `${JSON.stringify(s)} · Abrufe sw.js: ${swHits} · Konsolenfehler: ${errors.length}`);
    await ctx.close();
  }

  // Abrufe der Worker-Dateien im neuen Stand (Beleg, dass das Update wirklich die neue Datei holte)
  const swLog = log.filter((l) => l.state !== "alt" && /sw\.js$/.test(l.path)).map((l) => `${l.state} ${l.path} ${l.status} ${l.type}`);
  console.log(`  info  Worker-Abrufe im neuen Stand: ${swLog.length ? [...new Set(swLog)].join(" | ") : "keine"}`);

  await browser.close();
  server.close();
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\nsw-killswitch: ${results.length - failed} von ${results.length} Prüfungen wie erwartet.`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(`Testaufbau gescheitert: ${e.stack || e.message}`); server.close(); process.exit(2); });
