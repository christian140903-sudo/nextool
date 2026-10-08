// Regeldaten fuer den Site-Linter v2 (scripts/lint-site.mjs).
// Quelle der Sperrliste: Positionierung §3.3 und §10.2 (Stand 2026-10-08).
// Jede Ausnahme steht hier mit Begruendung — eine Stelle zum Gegenlesen.
//
// scope: "site"   = nur sichtbarer Text/Attribute der ausgelieferten Seiten
//        "all"    = zusaetzlich Commit-Nachrichten seit dem Relaunch und Dateinamen in site/
// Namen (z. B. geparkte Projekte) gelten nur fuer "site": In Commit-Nachrichten darf stehen,
// dass etwas entfernt wurde; verboten sind dort Werbebehauptungen, widerrufene Zahlen, Privatdaten.

export const ORIGIN = "https://nextool.app";

// Letzter Commit vor dem Relaunch (= Archiv-Branch archiv/vor-relaunch-2026-10).
export const RELAUNCH_BASE = "4505f3c326251cd55dc631675bb309813f727f88";

export const REQUIRED_FILES = [
  "index.html", "en/index.html", "404.html", "_headers", "_redirects",
  "robots.txt", "sitemap.xml", "facts.json", "assets/site.css", "favicon.svg",
  "assets/og-de.png", "assets/og-en.png", "sw.js", "prep/sw.js",
];

// Abmelde-Worker (Nachbesserung Punkt 1): Unter diesen Adressen haben alte Seiten von 2026-02-23
// bis 2026-07-18 Service Worker registriert (/sw.js Scope /, /prep/sw.js Scope /prep/). Dort muss
// dieselbe Abmelde-Datei liegen, sonst bleiben die alten Worker in Besucher-Browsern aktiv.
// Browser-Nachweis: scripts/browser/sw-killswitch.mjs (npm run test:sw, nicht in CI).
export const SW_KILLSWITCH = ["sw.js", "prep/sw.js"];

export const FORBIDDEN_FILE_PATTERNS = [
  /(^|\/)\.env/, /(^|\/)\.DS_Store$/, /\.sh$/, /\.md$/, /(^|\/)package(-lock)?\.json$/,
  /\.map$/, /\.sql$/, /(^|\/)\.git/, /\.mjs$/, /(^|\/)node_modules\//,
];

// Seiten ohne Sprachpaar — nur mit Grund.
export const PAIR_EXEMPT = {
  "/404.html": "zweisprachige Fehlerseite (DE und EN auf einer Seite)",
  "/postcondition/": "englische Produktseite, aus npm und README verlinkt; deutsche Zusammenfassung auf /projekte/#postcondition-mcp",
  "/behaviorlock/": "englische Produktseite, aus README verlinkt; deutsche Zusammenfassung auf /projekte/#behaviorlock",
  "/proofspec/": "englische Produktseite, aus README verlinkt; deutsche Zusammenfassung auf /projekte/#proofspec (mit OFFEN-Tor bis zum README-Fix, Positionierung §7.3)",
  "/soul/lineage/": "englische Planseite, noindex, solange ein Antragsentwurf darauf verweist (Positionierung §7.5)",
};

// Seiten ohne canonical (Fehlerseite wird unter beliebigen Adressen ausgeliefert).
export const CANONICAL_EXEMPT = new Set(["/404.html"]);

// Zwei Tueren, die sich nicht gegenseitig verlinken (Positionierung §1.5, Einkauf E2).
export const DOORS = {
  workshops: ["/workshops/", "/en/workshops/"],
  hire: ["/arbeitgeber/", "/en/hire/"],
};
// "Teilzeit/part-time" ist nur auf der Workshops-Tuer erlaubt (Positionierung §1.2).
export const PART_TIME_ALLOWED = new Set(DOORS.workshops);

// Strassenanschrift erst ab T-Recht-1 im Impressum (ECG); bis dahin nirgends.
export const STREET_ALLOWED = new Set([]);

// ---------------------------------------------------------------------------
// Sperrliste: Woerter und Rahmungen (Positionierung §3.3, §10.2; Auftrag 2026-10-08)
// ---------------------------------------------------------------------------
export const BANNED = [
  // Auftrag + §10.2 Nr. 1
  { id: "revolutionaer", re: /revolution(?:är|aer|ary)/i, scope: "all" },
  { id: "bahnbrechend", re: /bahnbrechend|ground-?breaking/i, scope: "all" },
  { id: "nie-dagewesen", re: /nie\s+dagewesen|unprecedented/i, scope: "all" },
  { id: "zukunft-der-ki", re: /die\s+Zukunft\s+der\s+KI|the\s+future\s+of\s+AI/i, scope: "all" },
  { id: "jedes-modell-besser", re: /macht\s+jedes\s+Modell\s+besser|makes?\s+(?:every|any)\s+model\s+better/i, scope: "all" },
  { id: "die-erste-ki", re: /\b(?:die|der|das|the)\s+(?:erste[nrs]?|first)\s+(?:KI|AI|tool|Werkzeug|MCP|platform|Plattform|framework|system|agent|Agent|memory|Gedächtnis)\b/i, scope: "all" },
  { id: "nie-wieder-ohne", re: /nie\s+wieder\s+ohne|never\s+again\s+without/i, scope: "all" },
  // §10.2 Nr. 2–4
  { id: "produktivitaetsfaktor", re: /\b\d+\s?[×x]\s?(?:produktiver|schneller|faster|more\s+productive|productivity)|\b(?:3|10)x\b/i, scope: "all" },
  { id: "production-ready", re: /production[- ]ready|produktionsreif/i, scope: "all" },
  { id: "enterprise", re: /\benterprise\b/i, scope: "all" },
  { id: "battle-tested", re: /battle[- ]tested/i, scope: "all" },
  { id: "trusted-by", re: /trusted\s+by|used\s+by\s+developers\s+worldwide|actively\s+used\s+by\s+the\s+community/i, scope: "all" },
  { id: "trust-layer", re: /trust\s+layer|\bone\s+stack\b|work\s+together/i, scope: "site" },
  // §10.2 Nr. 5 (nur Website; Commits duerfen das Entfernen benennen)
  { id: "bewusstsein", re: /bewusstsein|\bconscious|sentien|genuinely\s+suffer|\bPhi\b/i, scope: "site" },
  { id: "projektname-geparkt", re: /\banima\b/i, scope: "site" },
  { id: "miguel", re: /\bMiguel\b/, scope: "site" },
  { id: "proxy-rahmung", re: /Soul[- ]Proxy|Soul[- ]Frame|Intent\s+Analysis|Task\s+Restructuring|\b4\.1\.x\b|Soul\s+4\.1\b|Soul\s+5\.0/i, scope: "site" },
  { id: "marke-nextool", re: /\bNex[Tt]ool\b|\bNEXTOOL\b/, scope: "site" },
  // §10.2 Nr. 6–8
  { id: "wir-fuer-einzelperson", re: /\bWir\b|\b[Uu]nser(?:em|en)?\s+Team|\b[Oo]ur\s+team|\b[Uu]nsere\s+Kunden|\b[Oo]ur\s+(?:clients|customers)/, scope: "site" },
  { id: "aufforderung-statt-beleg", re: /glaub(?:en\s+Sie)?\s+mir\s+kein\s+Wort|don'?t\s+trust\s+me|Prüfen\s+Sie\s+mich\s+nicht|do\s+not\s+trust\s+this\s+page/i, scope: "all" },
  { id: "ki-ton", re: /\bnahtlos|\bseamless|leistungsstark|\bpowerful\b|\brobust\b|\bentscheidend|\bcrucial\b|game[- ]?changer|cutting[- ]edge|state[- ]of[- ]the[- ]art/i, scope: "site" },
  // §10.2 Nr. 9–12, §3.3
  { id: "mengen-als-leistung", re: /\b269\b|\b131\s+(?:Guides|Ratgeber)|\b384\s+Gists|\b232\s+Tests|vier\s+Werkzeuge|four\s+tools|50k\s+LOC/i, scope: "all" },
  { id: "titel", re: /\bSenior\b|\bFounder\b|\bGründer\b|\bCEO\b|Einzelunternehmen|UID\s+in\s+Beantragung|GmbH\s+i\.\s?G\.|International\s+Trade\s+Organization/, scope: "all" },
  { id: "ai-engineer-als-titel", re: /(?<!(?:Stelle als|role as|position as|job as) )\bAI\s+Engineer\b/, scope: "site" },
  { id: "level-label", re: /Junior\s?[–-]\s?Mid|mid-level/i, scope: "all" },
  { id: "ueberzeichnung", re: /zweimal\s+öffentlich|twice\s+publicly|kontrollierte\s+Messung|controlled\s+measurement|täglich\s+seit|daily\s+since|used\s+daily|täglich\s+genutzt|verlässlich\s+mach|Skills,\s+die\s+halten|skills\s+that\s+hold|pre-committed\s+thresholds|vorab\s+festgelegte\s+Schwellen/i, scope: "all" },
  { id: "korrigiert-3-3", re: /korrigiert:?\s*\+?\s?3[,.]3|corrected:?\s*\+?\s?3[,.]3/i, scope: "all" },
  { id: "rueckfall-phrasen", re: /Zero-Cost|I\s+hacked|cognitive\s+compiler|WhatsApp\s+steuert/i, scope: "all" },
  { id: "preise", re: /\bab\s+\d[\d.]*\s?(?:EUR|€)|from\s+(?:EUR|€)\s?\d|\d[\d.]*\s?[–-]\s?\d[\d.]*\s?(?:EUR|€)|Streichpreis|statt\s+\d[\d.]*\s?(?:EUR|€)/i, scope: "site" },
];

// Teilzeit nur auf der Workshops-Tuer.
export const PART_TIME = /\bTeilzeit|part[- ]time/i;

// ---------------------------------------------------------------------------
// Widerrufene / nicht belastbare Zahlen (Positionierung §3.3, Fallstudie-FAKTEN §I)
// ---------------------------------------------------------------------------
// Immer verboten (kein zulaessiger Kontext):
export const REVOKED_HARD = [
  /70[,.]4\s?%/, /75[,.]6\s?%/, /69[,.]7\s?%/, /74[,.]2\s?%/, /95[,.]0\s?%/, /\b78\s?%/,
  /\+\s?68[,.]3/, /\+\s?23[,.]3/, /\+\s?12[,.]2/, /\+\s?30[,.]0/, /\+\s?26[,.]7/, /\+\s?16[,.]7/,
  /\+\s?13[,.]3/, /\+\s?7[,.]8\b/, /\+\s?11\s?pp/i, /\b0[,.]86\b/, /\b253\s?\+/, /\b2[,.]400\s?\+/,
  /\b4[,.]8\s?\/\s?4[,.]9/, /100\s?%\s?Client/i, /5\s?M\s?EUR/, /92\s?%\s?context/i, /45\s?%\s?→\s?92/,
  /\b87\s?%/, />\s?1[.,]100\s+Downloads/i,
  /\b(?:6|sechs|six)\s+(?:von|of)\s+(?:6|sechs|six)\b/i,
];
// Nur im genannten Kontext (gleicher Textblock: Absatz, Listenpunkt, Zelle):
export const REVOKED_CONTEXT = [
  { re: /\+?\s?17[,.]8/, need: [/zurückgenomm|zurückgezogen|withdr[ae]w|withdrawn/i], why: "+17,8 nur als zurückgenommen" },
  { re: /\+?\s?15[,.]6/, need: [/nachrechn|recomput/i], why: "+15,6 nur als nachgerechnete Zahl" },
  { re: /\+\s?3[,.]3\b/, need: [/ungleich\s+instruiert|unequally\s+instructed/i, /verw[oe]rf|discard/i], why: "+3,3 nur mit 'ungleich instruiert' und 'verworfen'" },
  { re: /p\s?=\s?0[,.]375/, need: [/ungleich\s+instruiert|unequally\s+instructed/i, /verw[oe]rf|discard/i], why: "p = 0,375 nur im Kontext der verworfenen Läufe" },
  { re: /57\s?[–-]\s?81/, need: [/zurückgebaut|rolled\s+back/i], why: "57–81 % nur als zurückgebaut" },
  { re: /[−-]\s?23[,.]3/, need: [/noch\s+nicht\s+veröffentlicht|not\s+yet\s+published/i, /ungeklärt|unexplained/i], why: "−23,3 nur mit 'noch nicht veröffentlicht' und 'ungeklärt'" },
  { re: /Eval\s+mit\s+(?:einem\s+)?Placebo-?\s?Arm|evals?\s+with\s+(?:a\s+)?placebo\s+arm|Placebo-?\s?Arm[^.]{0,80}\bgebaut|placebo\s+arm[^.]{0,80}\bbuilt/i, need: [/unvollständig|incomplete/i], why: "Placebo-Arm als Messbeleg nur mit 'Läufe unvollständig' (H9)" },
];

// ---------------------------------------------------------------------------
// Privatdaten-Muster (nie ausgeben — CI-Logs sind oeffentlich)
// ---------------------------------------------------------------------------
export const PRIVACY = [
  { id: "telefon", re: /(?:\+|\b00)\s?\d{1,3}[\s\/-]?\(?\d{1,4}\)?(?:[\s\/-]?\d{2,}){2,}|\b0\s?6\d{2}[\s\/-]?\d{3,}/ },
  { id: "whatsapp", re: /wa\.me|whatsapp/i },
  { id: "tel-link", re: /^tel:/i, attrOnly: true },
  { id: "gmail", re: /@gmail\.com|\bgmail\b|christian140903@/i },
  { id: "alter", re: /\b\d{2}\s?(?:Jahre\s+alt|-?jährig|years?\s+old|-year-old)\b|\bMit\s+\d{2}\s|\bJahrgang\b|\bgeboren\b|\bborn\s+(?:in|on)\b|\bAlter:?\s*\d/i },
  { id: "finanzen", re: /\bGehalt|\bsalary\b|\bSchulden|\bdebts?\b|Kontostand|Ersparnisse|\bsavings\b/i },
  { id: "strasse", re: /\b[A-ZÄÖÜ][a-zäöüß-]+(?:straße|strasse|gasse|weg|platz|allee|ring|zeile|kai|lände|promenade)\s+\d+|\bStr\.\s*\d+|\b1[0-2]\d0\s+Wien\b|\bA-\d{4}\b/, street: true },
];

// Kontexte, in denen Ziffern ohne Fakt erlaubt sind (Rechtsverweise, Jahreszahlen).
export const NUMBER_MASKS = [
  /§\s*\d+[a-z]?(?:\s*(?:Abs\.|Z|lit\.)\s*\d*[a-z]?)*/g,
  /\b(?:Art\.|Abs\.|Nr\.|lit\.)\s*\d+[a-z]?(?:\(\d+\))*(?:\([a-z]\))?(?:\s*(?:bis|to|und|and|–|-)\s*\d+)?/g,
  /\bZ\s\d+\b/g,
  /\b(?:19|20)\d{2}\b/g,
];
export const NUMBER_TOKEN = /(?<![\p{L}\p{N}_.@\/#-])[+−-]?\d+(?:[.,]\d+)*(?![\p{L}\p{N}_])/gu;

// Elemente, deren Inhalt von der Zahlenregel ausgenommen ist.
export const NUMBER_EXEMPT_ELEMENTS = new Set(["code", "pre", "kbd", "samp", "time", "script", "style"]);
