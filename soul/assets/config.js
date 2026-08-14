/* Soul — öffentliche Laufzeit-Konfiguration.
 *
 * ACHTUNG: In diese Datei gehören ausschliesslich Werte, die öffentlich sein
 * DÜRFEN. Der Supabase anon key ist public by design — er ist durch
 * Row-Level-Security abgesichert, nicht durch Geheimhaltung. Ein
 * service_role key gehört NIEMALS hierher (oder in irgendeine Datei, die an
 * den Browser ausgeliefert wird).
 */
window.SOUL_CONFIG = {
  // Supabase-Projekt (nextool.app)
  SUPABASE_URL: "https://ereqsthigmethlbipcnw.supabase.co",
  SUPABASE_ANON_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyZXFzdGhpZ21ldGhsYmlwY253Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNTE5MTEsImV4cCI6MjA4NjkyNzkxMX0.5Rtz8rAiA_mrf5L8U-JyKaqvDF1SrB4rok4oYgwcJiM",

  // Soul-Proxy (4.1.x). Noch NICHT deployt — das Dashboard zeigt deshalb
  // einen ehrlichen "API nicht erreichbar"-Zustand statt simulierter Keys.
  // TODO(4.1.x): Auf die Live-URL zeigen lassen, sobald der Proxy steht.
  API_BASE: "https://api.nextool.app",

  // Basis-Pfad der Soul-Sektion (für Redirects nach OAuth).
  SITE_BASE: "/soul/",
};
