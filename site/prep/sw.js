// Abmelde-Worker fuer nextool.app (Stand 2026-10-08).
// Bis Juli 2026 haben Seiten dieser Adresse Service Worker registriert (/sw.js und
// /prep/sw.js), die Dateien im Browser zwischenspeicherten. Die heutige Website
// registriert keinen Worker. Dieser Worker ersetzt die alten beim naechsten Update
// und raeumt auf: alle Caches loeschen, sich selbst abmelden, offene Fenster neu laden.
// Er hat absichtlich keinen fetch-Handler und faengt nie eine Anfrage ab.
// Die gleiche Datei liegt unter /sw.js und /prep/sw.js (der Linter prueft, dass beide gleich sind).

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    } catch (e) { /* weiter: abmelden geht auch ohne Cache-Zugriff */ }
    try {
      await self.registration.unregister();
    } catch (e) { /* weiter: Fenster trotzdem neu laden */ }
    const windows = await self.clients.matchAll({ type: "window" });
    await Promise.all(windows.map((client) => client.navigate(client.url).catch(() => null)));
  })());
});
