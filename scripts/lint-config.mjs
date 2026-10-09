// Regeldaten fuer den Site-Linter v2 (scripts/lint-site.mjs).
// Quelle der Sperrliste: Positionierung §3.3 und §10.2 (Stand 2026-10-08).
// Jede Ausnahme steht hier mit Begruendung — eine Stelle zum Gegenlesen.
//
// scope: "site"   = nur sichtbarer Text/Attribute der ausgelieferten Seiten
//        "all"    = zusaetzlich Commit-Nachrichten seit dem Relaunch und Dateinamen in site/
// Namen (z. B. geparkte Projekte) aus BANNED gelten nur fuer "site": In Commit-Nachrichten darf stehen,
// dass etwas entfernt wurde. Die Sperrliste v2 (§13, unten) gilt dagegen auch fuer Commit-Nachrichten,
// ohne Seitenbindung: dort also keine gesperrte Wendung, auch nicht als Zitat einer Entfernung.

import { readFileSync } from "node:fs";

// Basis-URL (R4 a13): steht genau einmal, in src/site.json ("origin"). Build, Linter und Selbsttests
// lesen sie dort; die Regel SRC-origin lehnt jede hart verdrahtete Kopie in src/ und scripts/ ab.
export const ORIGIN = JSON.parse(readFileSync(new URL("../src/site.json", import.meta.url), "utf8")).origin;
export const HOST = new URL(ORIGIN).host;

// Letzter Commit vor dem Relaunch (= Archiv-Branch archiv/vor-relaunch-2026-10).
export const RELAUNCH_BASE = "4505f3c326251cd55dc631675bb309813f727f88";

// Commit-Nachrichten sind eine Flaeche (§13 Geltung: "auch Commit-Messages"): Der Linter wendet die
// §13-Regeln ohne Seitenbindung auf jede Nachricht seit RELAUNCH_BASE an. Diese Treffer sind bekannt und
// ohne Historien-Umschreibung nicht zu beheben; sie verschwinden mit dem Repo-Tausch (frisches Repo ohne
// diese Historie). Bis dahin Warnung, im Release Fehler: Go-live erst aus dem neuen Repo. Jeder andere
// Treffer (andere Regel oder anderer Commit) ist sofort ein Fehler. Befunde T-01/P-02, 2026-10-09.
export const COMMITS_KNOWN = {
  "3684bf424ce088b80198256d9d0828c1efd11b81": ["D-verfuegbar-ab"],
  "0d8b0132b781e900d81a90fcd18e90291bedef94": ["A-doi"],
  "e0f61cb5e0b0b034d1e4cb949c15442f7fbb09b5": ["E-phrasen"],
  "7732e6f9b0bdf08c2ba3b6595ae4f8d1bac21b96": ["F-git-sichtbar"],
  "685aec1e12ef5ceb6bc922f76cde5bebd9e09c71": ["A-vorbereitet", "E-phrasen"],
  "ad7f3bef9a43ef214c4af3e9261fd1c40e6c4f9e": ["F-git-sichtbar"],
  "33d1de2bc1d04a0b5231e6796ce67722196cc18b": ["A-vorbereitet"],
  "f29f603e4f1a4b61909ac9f991401e746007360f": ["C-workshop"],
  "63c5adf45ed6cc5268ab57776175eba48c79f0b2": ["C-workshop"],
  "35a8b457ebde6c22be5d0327e06f2d694d2297ed": ["C-workshop"],
  "f0a483341edc46e293dd4d838d8847b9ec0e9789": ["F-kit-name"],
  "b099933c447698163a8125ce81ca8f9d4a3ed420": ["F-kit-name"],
  "99c758c8de72ac3d67286cc621dd25f845368600": ["C-workshop"],
};

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

// Seiten mit noindex — nur mit Grund (Audit T12: Inhaltsseiten sind indexierbar). Die 404 MUSS noindex sein (T10).
export const NOINDEX_ALLOWED = {
  "/404.html": "Fehlerseite (wird unter beliebigen Adressen ausgeliefert)",
  "/archiv/": "Erklaerseite zum Altbestand, Ziel der Alt-Weiterleitungen (Positionierung §7.3)",
  "/en/archive/": "englische Fassung von /archiv/",
  "/soul/lineage/": "Planseite, noindex laut Positionierung §7.5",
};

// Positivliste der ausgelieferten Dateitypen (Audit T5/T11; ergaenzt FORBIDDEN_FILE_PATTERNS).
// Ein neuer Typ (z. B. PDF fuer den Lebenslauf) wird hier bewusst ergaenzt — vorher Metadaten pruefen.
export const ALLOWED_FILE = /^(?:_headers|_redirects)$|\.(?:html|css|woff2|txt|png|jpg|webp|svg|json|xml|js)$/;

// Stufe 1 ist NICHT kommerziell: keine Workshop-Seite, keine Preise, keine Angebotssprache
// (§ 5 ECG; Uebergabe 06-rechtstexte README "Stufe 1 nicht kommerziell"; Positionierung §11).
// Fuer Stufe 2 (nach T-Recht-1) STAGE auf 2 setzen; dann greifen nur noch Sperrliste/preise.
// Ausdruck wörtlich aus der Rechtsabnahme Welle E (R-06; dort 15/15 Angebotssätze gefangen, 8/8 legitime
// durchgelassen). Ein Netz, kein Beweis: „Ich unterstütze Teams bei …“ geht weiter durch — Endkontrolle bleibt.
export const STAGE = 1;
export const STAGE1_COMMERCIAL = /\d[\d.,]*\s?(?:€|EUR\b|Euro\b)|(?:€|\bEUR)\s?\d|\bPreis(?:e|en|liste)?\b|\bHonorar|\bTages(?:satz|sätze)|\bStundensatz|\bbuch(?:en|bar|ung)\b|\bAngebot|\bWorkshop|\bProbesession|\bCoaching|\bprice[sd]?\b|\bpricing\b|\bfees?\b|\bday[- ]rate|\bbook(?:ing|\s+a|\s+now)\b|\boffer(?:s|ing)?\b|\b(?:an)?biete[nt]?\b|\bBeratungs?(?:leistung|angebot)|\bberate\s+(?:Sie|Ihr|Teams?|Unternehmen|Firmen)\b|\bSchulung|\btrainings\b|\btraining\s+(?:für|for)\b|\bconsult(?:ing|ancy|ants?)\b|\bfreelanc|\bhire\s+me\b|\bfor\s+hire\b|\bDienstleistung|\bLeistungen\b|\bsponsor(?:s|ing)?\b|\bSpende|\bdonat(?:e|ion|ions)\b|\baffiliates?\b|\bauf\s+Anfrage\b|\bErstgespräch|\bbuy\s+me\s+a\s+coffee|\bko-?fi\b|\bpatreon\b|\bpaypal|\bavailable\s+for\s+(?:projects|freelance|contract)/i;

// Strukturierte Daten (Audit T16): keine Angebote, keine Organisation, keine Anschrift/Telefon/Geburtsdaten.
export const SD_FORBIDDEN_TYPES = /^(?:Offer|AggregateOffer|Demand|Organization|Corporation|LocalBusiness|ProfessionalService|Store|Product|Service|PostalAddress|Place)$/i;
export const SD_FORBIDDEN_PROPS = /^(?:address|streetAddress|postalCode|telephone|faxNumber|birthDate|birthPlace|homeLocation|geo|offers|makesOffer|hasOfferCatalog|priceRange|price|worksFor|employee|seller|vatID|taxID)$/i;
export const OG_FORBIDDEN = /^(?:business:contact_data:|place:location:|product:price|og:(?:street-address|locality|region|postal-code|country-name|phone_number|latitude|longitude))/i;

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

// Oeffentliche Anschriften von Behoerde und Anbieter, die die Datenschutzerklaerung nennt (Art. 13, 77 DSGVO;
// Rechtstexte B6 der Website-Session). Nur exakt diese Zeichenfolge, nur auf diesen Seiten: Der Linter blendet
// sie vor Privatdaten- und Zahlenpruefung aus. Jede andere Strassenanschrift bleibt ein Fehler.
export const PUBLIC_ADDRESSES = [
  { text: "Barichgasse 40–42, 1030 Wien", pages: ["/datenschutz/"], why: "Österreichische Datenschutzbehörde (dsb.gv.at), Stand B6 08.10.2026" },
  { text: "Barichgasse 40–42, 1030 Vienna", pages: ["/en/privacy/"], why: "dieselbe Anschrift, englische Fassung" },
  { text: "101 Townsend St, San Francisco, CA 94107", pages: ["/datenschutz/", "/en/privacy/"], why: "Cloudflare, Inc. laut Cloudflare Privacy Policy (gültig ab 04.11.2025, abgerufen 08.10.2026)" },
];

// Interne Verweise, die in der ausgelieferten facts.json nichts zu suchen haben (Pruefbericht 9, Nachbesserung 10):
// Namen nicht oeffentlicher Dokumente und Zeilenverweise in nicht oeffentliche Repositories. Solche Angaben
// gehoeren in das Feld source_internal (der Build entfernt es, siehe FACTS_INTERNAL_KEYS in scripts/build.mjs).
export const FACTS_INTERNAL = [
  /Positionierung/i, /\bKarte\s*\d/i, /FAKTEN/, /EVIDENZ-INVENTAR|\bNachtrag\s*\d/i, /Faktencheck/i,
  /\bmission\//i, /soul-workspace/i, /\b[\w-]+\.mjs:\d/, /Transkript/i, /\bChriso\b/, /EXT1-ERGEBNIS|KONTROLLARM|DREI-LAEUFE/i,
];
export const FACTS_INTERNAL_KEYS = ["source_internal", "offen"];

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

// ---------------------------------------------------------------------------
// Interne Notizen und Platzhalter (Nachbesserung 11, Audit T14)
// ---------------------------------------------------------------------------
// Offene Punkte stehen als {{todo:}} in den Quellen und landen als <!--OFFEN: …--> im HTML
// (unsichtbar; Release-Modus: jeder ist ein Fehler). Sichtbar darf davon nichts sein:
// NOTE_VISIBLE ist in jedem Modus ein Fehler, "code" = auch in <code>/<pre> verboten.
export const NOTE_VISIBLE = [
  { id: "Chriso", re: /\bChriso\b/, code: true },            // interner Rufname, auf der Website heisst er Christian Bucher
  { id: "OFFEN:", re: /\bOFFEN:/, code: true },
  { id: "TODO/FIXME", re: /\b(?:TODO|FIXME|TBD|XXX)\b/ },
  { id: "{{…}}", re: /\{\{|\}\}/ },                           // vom Build nicht ersetzter Platzhalter
];
// HTML-Kommentare im ausgelieferten Quelltext (Welle F, R-03): Jeder Besucher kann sie per "Seitenquelltext"
// lesen, und das Repository ist oeffentlich. Erlaubt sind nur Kommentare ohne Inhalt: die neutrale Kennung
// eines Go-live-Tors (<!--OFFEN:F-nn-->, Klartext in der privaten Zuordnung) und die Cloudflare-Klammer
// <!--email_off-->…<!--/email_off--> (R-04). Alles andere ist in jedem Modus ein Fehler (NOTE-comment).
export const COMMENT_ALLOWED = /^(?:OFFEN:F-\d{2,3}|\/?email_off)$/;
// Ausfuell-Platzhalter wie [Datum], [n], <Name> — normal Warnung, im Release-Modus Fehler (T14).
// Erlaubt: Auslassung in Zitaten "[…]" / "[...]".
export const PLACEHOLDER = /\[(?!…\]|\.\.\.\])[^\]\n]{1,40}\]|<[^<>\n]{1,40}>/;

// ---------------------------------------------------------------------------
// Sprache von Teilen (WCAG 3.1.2; Audit T17; Barrierefreiheit BF-04, Welle F2)
// ---------------------------------------------------------------------------
// Fehler in jedem Modus (mechanisch pruefbar): Umlaut/ß in einem englischen Teil ohne lang="de" und
// Ersatzschreibung (ae/oe/ue/ss statt Umlaut) in einem deutschen Teil. Die Ersatzliste stammt aus dem
// Audit (B7 audit.mjs); sie nennt nur Woerter, die es mit Umlaut gibt.
export const UMLAUT = /[äöüÄÖÜß]/;
export const ERSATZ = new RegExp("(?<![\\p{L}])(" + ["fuer", "Fuer", "ueber", "Ueber", "koennen", "koennte", "moechte", "moeglich", "Moeglichkeit", "waehrend", "spaeter", "Oesterreich", "oesterreichisch\\p{L}*", "Datenschutzerklaerung", "Aenderung\\p{L}*", "aendern", "geaendert", "Pruefung\\p{L}*", "pruefen", "geprueft", "Schluessel", "zurueck", "natuerlich", "haeufig", "naechste\\p{L}*", "wuerde", "muessen", "duerfen", "hoechstens", "Groesse", "groesser", "Massnahme\\p{L}*", "Strasse", "gemaess", "Gruende", "Gruenden", "Ergaenzung", "erklaert", "Erklaerung", "Bestaetigung", "bestaetigt", "fuehren", "gefuehrt", "Behoerde", "Datenschutzbehoerde", "Jaenner", "Maerz", "Saetze", "Saetzen", "Uebersicht", "uebersetzt", "Uebersetzung"].join("|") + ")(?![\\p{L}])", "u");
// Nur Hinweis ausserhalb des Release (Heuristik, Fehlalarme moeglich): englische Funktionswoerter in einem
// deutschen Teil ohne lang="en" — ab 2 Treffern, in einem Link mit hreflang="en" ab 1. /g: nur mit .match()
// verwenden (zustandslos), nie mit .test()/.exec().
export const EN_WORDS = /\b(?:the|and|of|to|is|it|may|at|all|with|for|me|my|what|this|that|from|by|not|outside|exactly|nothing)\b/gi;
// Wendungen, die auf deutschen Seiten als Name oder Fachwort stehen duerfen (vor dem Zaehlen entfernt).
export const EN_ALLOW = [/\bClaude Code\b/g, /\bPull Requests?\b/gi, /\bModel Context Protocol\b/g, /\bOpen Font License\b/g, /\bData Privacy Framework\b/g, /\bCC BY\b/g];

// Kontexte, in denen Ziffern ohne Fakt erlaubt sind (Rechtsverweise, Jahreszahlen).
// "Article/Section" fuer die englischen Rechtsseiten (Art. 6(1)(f) GDPR, Section 165(3) TKG 2021).
export const NUMBER_MASKS = [
  /§\s*\d+[a-z]?(?:\(\d+\))*(?:\s*(?:Abs\.|Z|lit\.)\s*\d*[a-z]?)*/g,
  /\b(?:Art\.|Article|Section|Abs\.|Nr\.|lit\.)\s*\d+[a-z]?(?:\(\d+\))*(?:\([a-z]\))?(?:\s*(?:bis|to|und|and|–|-)\s*\d+)?/g,
  /\bZ\s\d+\b/g,
  /\b(?:19|20)\d{2}\b/g,
  /\b(?:CC BY(?:-[A-Z]{2})?|Open Font License)\s\d+\.\d+\b/g, // Lizenzversionen (Impressum), keine Messzahl
];
export const NUMBER_TOKEN = /(?<![\p{L}\p{N}_.@\/#-])[+−-]?\d+(?:[.,]\d+)*(?![\p{L}\p{N}_])/gu;

// Elemente, deren Inhalt von der Zahlenregel ausgenommen ist.
export const NUMBER_EXEMPT_ELEMENTS = new Set(["code", "pre", "kbd", "samp", "time", "script", "style"]);

// ---------------------------------------------------------------------------
// Sperrliste v2 (Positionierung v2 §13 A–F, Mechanik §7/§13) — Linter v2, Welle F
// ---------------------------------------------------------------------------
// Bedingte Eintraege lesen den Zustand (STATE_SCHEMA unten). Jede Regel: id, group (A–F), re; optional
//   when(state)  aktiv nur, wenn die Bedingung gilt (sonst erlaubt)
//   ctx          trifft nur, wenn derselbe Textblock (bei sentence: derselbe Satz) auch ctx enthaelt
//   unless       trifft nicht, wenn der Block (bei sentence: der Satz) unless enthaelt
//   negatable    ein verneinter Satz ("nicht", "not", "kein" …) zaehlt nicht als Behauptung
//   sentence     ctx/unless gelten satzweise statt blockweise
//   pages        nur auf diesen Seiten (Website); beim Dokument-Scan gilt die Regel immer, ausser siteOnly
//   private      re: null — der Ausdruck kommt nur aus der privaten Liste ("[B] @<id> re:…"); Id, Gruppe und
//                Bedingung bleiben hier. Ohne Bindung: NICHT GEPRUEFT (Warnung, im Release Fehler).
//   ctx/unless als "@<Name>": privates Kontextmuster aus PRIVATE_SLOTS, ebenfalls nur ueber "[A] @<Name> re:…".
// Gruppe G (Privates: Branchen, Schul-/Wehrdienstjahre, Kundennamen) steht NICHT hier: Eine
// oeffentliche Liste verriete, was sie schuetzen soll. G lebt in der privaten Sperrliste
// (.site-private-denylist.txt bzw. Secret SITE_PRIVATE_DENYLIST), ebenso Eintraege aus A bis D, deren
// Wortlaut selbst etwas Vertrauliches andeuten wuerde. Das Repository ist so oeffentlich wie die Seite:
// Auch ein Beispiel in einer Regel ist eine Veroeffentlichung (§13 Geltung). Fuer Gruppe A heisst das: Name
// und Begriffe des Messvorhabens (§3.2) stehen nur in der privaten Liste, solange zA = a0 gilt — als Bindung
// der Regeln A-vorbereitet und A-e1 und als Kontextmuster A-kontext. Die Seite des Vorhabens erkennt der Linter
// am gebundenen Namen (Pfad), nicht an einer Liste hier.
export const PAGES = {
  start: ["/", "/en/"],
  hire: ["/arbeitgeber/", "/en/hire/"],
  archive: ["/archiv/", "/en/archive/"],
};
// Private Kontextmuster (Name → Gruppe): nur aus der privaten Liste ("[A] @A-kontext re:…"). Regeln, die eines
// brauchen (ctx/unless "@A-kontext"), gelten ohne Bindung als NICHT GEPRUEFT (wie Regeln mit privatem Wortlaut).
export const PRIVATE_SLOTS = { "A-kontext": "A" };

// Zustand (Positionierung v2 §7): src/state.json ist NICHT Teil des oeffentlichen Repositorys (.gitignore),
// denn schon die Schalter verraten Plaene. Schluessel und Werte sind deshalb neutrale Kuerzel; ihre Bedeutung
// steht nur in der privaten Datei (Feld _legende) und in den privaten Planungsunterlagen.
// - Datei fehlt (CI, frischer Klon): Linter und Scan pruefen mit STATE_STRICT, dem engsten Zustand (Info
//   STATE-strict, kein Fehler). Wer lokal einen anderen Zustand braucht, legt die Datei an.
// - Datei vorhanden, aber ungueltig (fehlender Schluessel, unbekannter Wert, Tippfehler): Fehler STATE-invalid;
//   die Regeln laufen dann trotzdem mit STATE_STRICT weiter.
// Was die Schicht darunter im Fehlerfall schon selbst tut: nichts — ein fehlender Schluessel waere fuer
// JavaScript `undefined`, jede bedingte Regel still aus. Deshalb fail-closed (siehe lib/sperrliste.mjs).
export const STATE_SCHEMA = {
  zA: ["a0", "a1", "a2", "a3", "a4"],
  zB1: "boolean",
  zB2: "string", // "offen" | "nein" | freier Text
  zC1: ["R0", "R1"],
  zC2: ["k0", "k1", "k2"],
  zC3: ["p0", "p1"],
  zC4: "array", // je Eintrag {ort, datum}; leer = keiner
  zD1: ["offen", "a", "b", "c"],
  zD2: ["A", "B"],
  zE1: "ids", // Kennungen F-nn, deren bedingter Text ({{if:F-nn}}…{{/if}}) ausgeliefert wird; leer = keiner
  zF1: "boolean",
};
// Schluessel, die in der Datei fehlen duerfen: Es gilt dann ihr Wert aus STATE_STRICT. Nur fuer Schalter, deren
// engster Wert "nichts ausliefern" ist (R4b b5: fehlt der Schalter, wird der Text nicht ausgeliefert).
export const STATE_OPTIONAL = new Set(["zE1"]);
// DE/EN-Zwillinge bedingter Texte (P3-03): [DE-Kennung, EN-Kennung] fuer dieselbe Stelle in beiden Sprachen. Die
// einzige Liste dieser Paare. zE1 gibt ein Paar nur ganz frei (sonst STATE-invalid, Build bricht ab), und steht eine
// Haelfte als {{if:F-nn}} auf einer Seite, braucht die andere ihre Klammer auf einer Seite der anderen Sprache.
// Neue zweisprachige {{if}}-Stelle: Paar hier eintragen.
export const IF_ZWILLINGE = Object.freeze([["F-79", "F-81"], ["F-80", "F-82"]]);
// Zustandsschluessel duerfen nie ausgeliefert werden: als JSON-Schluessel (in Anfuehrungszeichen, also mit
// festen Grenzen — "Kontrolle" oder "Rolle" im Text treffen nicht) in irgendeiner Datei unter site/ = Fehler
// STATE-leak (Plan F2 Punkt 3). Abgeleitet aus dem Schema, damit es keine zweite Liste gibt.
export const STATE_PRIVATE_KEYS = new RegExp(`"(?:${Object.keys(STATE_SCHEMA).join("|")})"\\s*:`);
// Bei zA = a4 muessen diese Fakten in facts.json stehen (§3.2).
export const STATE_A4_FACTS = ["zA.satz1_de", "zA.satz1_en", "zA.doi"];

// Engster Zustand: gilt, wenn src/state.json fehlt oder ungueltig ist.
export const STATE_STRICT = Object.freeze({
  zA: "a0", zB1: false, zB2: "offen", zC1: "R0", zC2: "k0", zC3: "p0", zC4: Object.freeze([]), zD1: "offen", zD2: "B", zE1: Object.freeze([]), zF1: false,
});

const FP = "@A-kontext";
const PREREG = /präregistriert|praeregistriert|pre-?registered|Präregistrierung|pre-?registration/i;
const VERFUEGBAR = /verfügbar|available|EU-remote|start date|Starttermin|Eintritt/i;
const KIT = /team-skills-kit|\bKit\b|Vorlage|template/i;
const vorBericht = (s) => s.zA !== "a4";

export const SPERRLISTE = [
  // A. Messvorhaben (§13 A, Status-Leiter §3.2); Name und Begriffe nur privat
  { id: "A-vorbereitet", group: "A", re: null, private: true, when: (s) => s.zA === "a0", why: "zA = a0: das Vorhaben auf keiner Fläche nennen (§3.2; Wortlaut privat)" },
  { id: "A-ergebnis", group: "A", re: /\bv?\d+\.\d+\.\d+\b|\b\d+\s?(?:Tage|Wochen|Monate|Stunden|Versionen|days|weeks|months|hours|versions)\b|\bFunde?\b|\bfindings?\b|Fehler gefunden|found (?:a |an )?(?:bug|flaw|failure|regression)|failed since|seit Version|since version/i, ctx: FP, when: vorBericht, why: "Ergebnisse (Versionen, Dauern, Funde) vor zA = a4" },
  { id: "A-version", group: "A", re: /\b2\.1\.\d+\b/, when: vorBericht, why: "Versionsmuster vor zA = a4 (§13 Mechanik)" },
  { id: "A-e1", group: "A", re: null, private: true, when: (s) => !["a2", "a4"].includes(s.zA), why: "erst ab zA = a2 (§3.2; Wortlaut privat)" },
  { id: "A-prereg-status", group: "A", re: PREREG, when: (s) => s.zA === "a0", negatable: true, why: "„präregistriert“ erst ab zA = a1 (öffentlicher Tag, §3.2)" },
  { id: "A-rohdaten", group: "A", re: /Rohdaten[^.\n]{0,30}öffentlich|raw data[^.\n]{0,30}public/i, when: vorBericht, negatable: true, why: "„Rohdaten öffentlich“ erst ab zA = a4" },
  { id: "A-doi", group: "A", re: /\bDOI\b|doi\.org\//i, when: vorBericht, why: "eine DOI erst, wenn sie auflöst (ab zA = a4)" },
  { id: "A-unabhaengig", group: "A", re: /unabhängig|independent/i, ctx: FP, negatable: true, why: "„unabhängig/independent“ für das Vorhaben oder die Messung (kein externer Prüfer)" },
  { id: "A-erster", group: "A", re: /\bals Erste[rn]?\b|\bthe first\b|\bfirst (?:to|ever)\b|weltweit erste/i, ctx: FP, negatable: true, why: "„als Erster/first“ im Umfeld des Vorhabens" },
  { id: "A-ki-agenten", group: "A", re: /KI-Agenten|AI agents/i, ctx: FP, why: "im Satz zum Vorhaben „Claude Code“, nicht „KI-Agenten“ allgemein" },
  { id: "A-benchmark", group: "A", re: /Modell-?Benchmark|model[- ]benchmark|benchmarks? (?:the )?models?|evaluates? (?:Claude|the model)|bewertet (?:Claude|das Modell)/i, ctx: FP, negatable: true, why: "kein Modell-Benchmark (§13 A)" },
  { id: "A-python", group: "A", re: /\bPython\b|measurement code|Messcode/i, ctx: FP, negatable: true, why: "keine Python-Kompetenz aus dem Vorhaben ableiten" },
  // B. Offenlegung (§13 B, §3.3)
  { id: "B-b1", group: "B", re: null, private: true, when: (s) => !s.zB1, negatable: true, why: "§13 B1, erst mit zB1 = true (Wortlaut privat)" },
  { id: "B-keine-verbindung", group: "B", re: /(?:keine|kein|weder|no|without)\s+(?:[\p{L}-]+,?\s+){0,4}?(?:Verbindung|Geld|Guthaben|Vorabzugang|money|credits|early access|connection|affiliation)\b[^.\n]{0,60}\bAnthropic|\bAnthropic\b[^.\n]{0,60}\b(?:keine|kein|weder|no)\s+(?:[\p{L}-]+,?\s+){0,4}?(?:Verbindung|Geld|Guthaben|Vorabzugang|money|credits|early access|connection|affiliation)\b|not affiliated with Anthropic|nicht mit Anthropic verbunden/iu, when: (s) => s.zB2 === "offen", why: "„keine Verbindung zu Anthropic“ erst, wenn zB2 nicht mehr offen ist (§13 B2)" },
  { id: "B-unabhaengig-selbst", group: "B", re: /unabhängige[rn]? (?:Trainer|Berater|Entwickler)|independent (?:trainer|consultant|developer)|unabhängig von Anthropic|independent (?:of|from) Anthropic/i, when: (s) => s.zB2 === "offen", why: "„unabhängig“ als Selbstbeschreibung erst, wenn zB2 nicht mehr offen ist" },
  { id: "B-davon-unabhaengig", group: "B", re: /davon unabhängig/i, why: "„getrennt davon“ statt „davon unabhängig“" },
  // C. Angebot, Recht, Foerderung (§13 C, §7 Linter v2)
  { id: "C-workshop", group: "C", re: /\bworkshops?\b/i, when: (s) => s.zC1 === "R0", why: "Workshops erst mit zC1 = R1" },
  { id: "C-vortraege", group: "C", re: /\bgive talks\b|\bgiving talks\b|halte Vorträge|Vorträge halte/i, when: (s) => !s.zC4.length, negatable: true, why: "Vortragssatz erst nach dem ersten gehaltenen Vortrag (zC4 leer)" },
  { id: "C-angebotsverb", group: "C", re: /\boffer(?:s|ing)? (?:training|workshops?|courses?)\b|\bbiete[nt]? (?:[\p{L}-]+ ){0,3}?(?:Schulungen|Workshops|Kurse)\b|Schulungen an\b/iu, when: (s) => s.zC1 === "R0", negatable: true, why: "Angebotsverb vor zC1 = R1" },
  { id: "C-unterricht", group: "C", re: /\bI (?:also )?teach\b|mechanics I teach|\bunterrichte\b/i, when: (s) => !s.zB1, negatable: true, why: "„I teach/ich unterrichte“ erst mit zB1 = true (§13 C)" },
  { id: "C-coaching", group: "C", re: /\bCoach(?:es|ing)?\b|\bBegleitung\b|Festpreis für 50 Stunden|nur geleistete Stunden/i, negatable: true, why: "„Coaching/Begleitung“ ist kein Angebotsname" },
  { id: "C-kundenrepo", group: "C", re: /\bich setze (?:das |es )?um\b|arbeite in Ihrem Repo|richte Claude Code in Ihrem Team ein|Reviews? zwischen den Terminen|Reviews?[^.\n]{0,25}(?:binnen|innerhalb von|within) 48|Review-Rechte|review rights|(?:merge|freigeben|Freigabe)[^.\n]{0,40}(?:Ihrem|Kunden)[- ]?Repo/i, negatable: true, why: "keine Arbeit im Kundenrepository; Ersatz §5.5 „Rückmeldung zu Übungen …“" },
  { id: "C-haltbarkeit", group: "C", re: /Modell-Update überleben|survives? the next model update|update-sicher|update-proof|, die halten\b/i, why: "Titel versprechen keine Haltbarkeit" },
  { id: "C-ai-act", group: "C", re: /AI[- ]Act[^.\n]{0,40}Art(?:ikel|icle|\.)\s*4\b|Art(?:ikel|icle|\.)\s*4\b[^.\n]{0,40}(?:AI[- ]Act|KI-VO|KI-Verordnung)|AI literacy|KI-Kompetenz/i, why: "AI-Act-Art.-4-Argumente erst nach der Prüfung" },
  { id: "C-kaltakquise", group: "C", re: /(?:≥|>=|mindestens|at least)\s?20 (?:Direktnachrichten|DMs|direct messages)|Kaltakquise|cold (?:e-?mails?|outreach|DMs?)/i, negatable: true, why: "keine kalten Werbe-Nachrichten (§ 174 TKG)" },
  // D. Rolle und Verfuegbarkeit (§13 D, §1.2)
  { id: "D-rolle-b", group: "D", re: /(?:role|Stelle|position|Rolle)[^.\n]{0,50}agent reliability|agent reliability (?:role|engineer)/i, when: (s) => s.zD2 === "B", why: "„agent reliability“ als Rollenname nur bei zD2 = A" },
  { id: "D-vollzeit", group: "D", re: /\bVollzeit\b|\bfull[- ]time\b/i, ctx: VERFUEGBAR, sentence: true, negatable: true, pages: PAGES.hire, when: (s) => !["a", "c"].includes(s.zD1), why: "„Vollzeit“ in der Verfügbarkeit nur bei zD1 = a/c" },
  { id: "D-wochenstunden", group: "D", re: /(?:up to|bis (?:zu )?)\s?\S+\s+(?:hours|Stunden) (?:a|per|pro|in der) (?:week|Woche)|\bhours (?:a|per) week\b|Wochenstunden|Stunden pro Woche/i, why: "Wochenstunden nie auf Website oder Profil (F25)" },
  { id: "D-verfuegbar-ab", group: "D", re: /available (?:from|starting|as of)|verfügbar ab|ab sofort verfügbar|full-time from|Vollzeit ab|start date|Startdatum|\bEintritt(?:sdatum|stermin)?\b(?:\*\*)?\s*(?::|ab\b)/i, when: (s) => s.zD1 === "offen", negatable: true, why: "kein Verfügbarkeitsdatum, solange zD1 offen ist" },
  // E. Dramaturgie (§13 E); die datierte Korrekturliste prueft der Linter ueber die Anker (E-korrekturliste)
  { id: "E-phrasen", group: "E", re: /private for now|no degree yet|Shops? ohne Ware|shops? without goods|Quereinsteiger, der misst|career changer who measures|So führe ich Claude Code|My setup, mechanically|zwei Scheineffekte|two phantom effects/i, why: "gesperrte Rahmung (§13 E)" },
  // F. Belege und Links (§13 F); Testzahlen nur aus facts.json prueft NUM-unsourced
  { id: "F-git-sichtbar", group: "F", re: /in git sichtbar|visible in git|\bgit[- ]?(?:Historie|history)\b/i, why: "nach dem Repo-Tausch und T-Reset nicht mehr sichtbar; Ersatz „auf Anfrage“" },
  { id: "F-commit-privat", group: "F", re: /\b4635f92\b/, why: "Commit in einem Repo, das privat wird" },
  { id: "F-prereg", group: "F", re: PREREG, unless: FP, negatable: true, why: "„präregistriert“ nur für das Vorhaben der Gruppe A (§13 F)" },
  { id: "F-kit-name", group: "F", re: /claude-code-team-kit|Demo-Skill-Repo|demo[- ]skill[- ]repo|\b3 (?:von|of|out of) 11\b/i, why: "alter Kit-Name/eigenes Demo-Repo/„3 von 11“ als Schlagzeile" },
  { id: "F-kit-claim", group: "F", re: /misst, wie zuverlässig ein Modell|measures how reliably (?:a|the) model|live getestet|live[- ]tested|im Einsatz|used by teams|in use (?:by|at)|rechtlich geprüft|legally (?:reviewed|checked|vetted)/i, ctx: KIT, negatable: true, why: "team-skills-kit: nur Belegtes (§3.4)" },
  { id: "F-kit-start", group: "F", re: /team-skills-kit/i, pages: PAGES.start, siteOnly: true, when: (s) => !s.zF1, why: "Teamzeile auf der Startseite erst bei zF1 = true (§7)" },
  { id: "F-inspect", group: "F", re: /Inspect eval tasks|Python \(Inspect/i, why: "kein Inspect-Repo öffentlich" },
  { id: "F-npm", group: "F", re: /(?:behaviorlock|agent-invariants)[^.\n]{0,40}\bon npm\b|npm (?:install|i) (?:-g )?(?:behaviorlock|agent-invariants)\b|npx (?:behaviorlock|agent-invariants)\b|npmjs\.com\/package\/(?:behaviorlock|agent-invariants)/i, why: "„on npm“ für behaviorlock/agent-invariants erst nach T-npm" },
];
// Links auf Commits in Repos, die privat werden (§13 F): alte nextool-Historie und das geparkte Projekt.
export const LINK_PRIVATE_COMMIT = /\/4635f92|github\.com\/[^/]+\/(?:nextool|anima[\w.-]*)\/commit\//i;
