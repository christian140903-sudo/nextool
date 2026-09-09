"""Schalter: deterministischer Vorfilter, Entropie-Sonde, binäre Stufe, Routing-Log ohne Prompttext.

Befund: die Aufwandsregel gewinnt +12,4 pp auf schweren Aufgaben, kostet aber als Dauerschicht
−16,7 pp Formattreue auf trivialen (bewusstsein/berichte/01-BEFUNDE.md §4); der Prüfer ist auf
trivialen Aufgaben 100 % richtig und 0 % formattreu (§5); A_SELEKTIV hält sich mit 2,08 Aufrufen
zurück, wo nichts zu tun ist (§5). Beide Mechanismen sind als Dauerschicht abgelehnt und als
geschaltete Stufe angenommen (02-UEBERGABE-BAU §5). M1 (2026-09-07) hat die Überraschung als
zweiten Schaltereingang widerlegt (Spezifität 8 %); geschaltet wird über Vorfilter und Uneinigkeit.
Adversariale Prüfung (2026-09-08, a4–a7): 30 von 34 trivialen Wissensfragen wurden „aufwand"
(Allerweltswörter team/public/ship/launch/api …, Datum 1.1.2000 als drei Zahlen, „18. Jahrhundert"
als zwei Sätze); 10 von 10 schweren Prompts mit dem Wort JSON oder „Gib … aus" wurden „direkt";
25 von 26 gängigen Formatzwängen („Antworte mit ja oder nein", „number only") blieben unerkannt;
Kleinschreibung und Semikolons umgingen die Satzzählung.
Erz → Gold: soul-proxy-45/src/amplify/signals.ts war ein Proto-Router ohne Test, mit
Falsch-Positiven auf Allerweltswörtern (`oder`, `besser`, `live`, `user\\w*`; R10 §2.2.4).
Hier derselbe Katalog ohne diese Wörter — und seit der adversarialen Prüfung ohne die zweite
Schicht Allerweltswörter: jedes Signal braucht Kontext (team → „mein Team informieren", ship →
„ship it to production", api → „public API"). Deterministisch, stdlib, mit Datensatz-Test und einem
Log, das nie den Prompt enthält. Die Stufe ist binär (direkt/aufwand), weil nur zwei Stufen
gemessen sind; „pruefer" kommt nur aus der Uneinigkeit zweier billiger Stichproben und ist Opt-in
(`soul switch --probe`, `soul run --probe-switch`; der Hook ruft decide() ohne Sonde). Der Formatzwang
führt nur ohne Einsatzhöhe zu „direkt": trägt der Prompt irreversible/dauerhafte/architektonische
Folgen, andere Betroffene, eine Festlegung oder eine Empfehlungsfrage, bleibt es „aufwand" — die
Aufwandsregel endet selbst mit „Antworte am Ende im verlangten Format".
"""
from __future__ import annotations

import json
import re
import time

from . import bus, paths
from . import model as _model  # Alias: der Parameter `model` (Modellname) überdeckt sonst das Modul

STAGES = ("direkt", "aufwand", "pruefer")
TRIVIAL_MAX_CHARS = 200
# D017: der Vorfilter bleibt unter 50 ms. Signale und Sätze werden nur im Kopf und am Schluss des
# Prompts gesucht — ein Prompt jenseits der Trivialgrenze ist ohnehin „aufwand", die Signale
# begründen nur, und Formatvorgaben stehen am Anfang oder am Ende, nicht in der eingefügten Datei
# dazwischen (a6/a7: 122 000 Zeichen brauchten 129 ms, 18 Regexe über den ganzen Text; mit einem
# 12 000-Zeichen-Fenster noch 48 ms, mit 4 500 Zeichen rund 20 ms — die Regexe kosten je
# Zeichen, nicht je Prompt).
SIGNAL_SCAN_HEAD = 3_000
SIGNAL_SCAN_TAIL = 1_500
# Rotation wie der Bus (bus._ROTATE_BYTES): das Routing-Log wächst sonst mit jedem Prompt.
_ROTATE_BYTES = getattr(bus, "_ROTATE_BYTES", 5 * 1024 * 1024)

# --- Bausteine der Signale --------------------------------------------------------------------
# Technische Objekte, die eine vorweggenommene Lösung anzeigen („add a cache", „use Redis").
_TECH = (r"(?:cache|caching|library|framework|table|column|index|service|microservice|queue"
         r"|feature\s+flag|flag|endpoint|middleware|plugin|layer|abstraction|dependency|package"
         r"|module|class|hook|retry|lock|orm|cdn|cluster|container|database|wrapper|proxy|monorepo"
         r"|singleton|factory|decorator|mutex|thread|worker|cron(?:job)?|webhook|websocket|sdk"
         r"|datenbank|bibliothek|tabelle|spalte|dienst|schicht|abh(?:ä|ae)ngigkeit|paket|modul"
         r"|klasse|zwischenspeicher|warteschlange|hilfsklasse|schnittstelle"
         r"|redis|kafka|docker|kubernetes|k8s|postgres\w*|mysql|sqlite|mongo\w*|react|vue|angular"
         r"|svelte|django|flask|fastapi|spring|graphql|grpc|rabbitmq|nginx|terraform|ansible|celery"
         r"|numpy|pandas|typescript|rust|golang|java|kotlin|swift|python|elasticsearch|redux|tailwind"
         r"|bootstrap|jquery|webpack|vite|prisma|sqlalchemy|pytest|jest)")
_ART = (r"(?:(?:a|an|the|some|einen|eine|ein|das|die|den|dem|der|auf|zu)\s+)?"
        r"(?:(?:brand\s+)?new\s+|neue[nsmr]?\s+|zweite[ns]?\s+|weitere[ns]?\s+|extra\s+"
        r"|additional\s+|separate\s+|eigene[ns]?\s+)?")
_EIGENNAME = r"(?-i:[A-Z][A-Za-z0-9.+-]+)"  # Redis, PostgreSQL, Vue.js — nur mit Großbuchstaben
_VERB_EN = r"(?:add|introduce|implement|integrate|use|adopt|switch\s+to|migrate\s+to|move\s+to)"
_VERB_DE = (r"(?:nutze|verwende|implementiere|baue|integriere|steige?\s+(?:um\s+)?auf"
            r"|wechsle?\s+(?:zu|auf)|setze?\s+auf|stelle?\s+(?:um\s+)?auf|migriere?\s+(?:zu|auf|nach))")
# „release" als Handlung (nicht „release date", „release notes").
_RELEASE = (r"releas(?:e|ing|ed)\s+(?:to|into|it|this|that|the|our|a|v\d|\d)"
            r"|(?:a|the|this|next|new|major|minor|hotfix|final|erste?n?|n(?:ä|ae)chste[nrs]?|neue[nrs]?"
            r"|das|den|der|ein|einen)\s+release\b(?!\s*(?:date|datum|notes))|releasen\b")
# Formatwörter für die Formatzwang-Erkennung.
_FMT_DE = (r"(?:Zahl|Zahlen|Anzahl|Ziffer|Ziffern|Wort|Zeile|Buchstaben?|Antwort|Ergebnis|Liste"
           r"|Tabelle|Code|JSON|CSV|YAML|XML|Markdown)")
_FMT_EN = (r"(?:number|numbers|digit|digits|word|words|line|letter|answer|result|value|list|table"
           r"|code|JSON|CSV|YAML|XML|markdown)")
_FMT_TYP = r"(?:JSON|CSV|YAML|XML|TSV|Markdown\S*|Tabelle|Liste|Stichpunkte\w*|Aufz(?:ä|ae)hlung)"
# Eine Größe: Zahl samt Punkt-/Komma-/Doppelpunkt-Gruppen, optional als arithmetische Kette
# fortgesetzt; possessiv (`*+`), damit „1.1.2000" oder „1 + 2 + 3" nicht in drei Größen zerfallen.
_ZAHL = r"\d+(?:[.,:]\d+)*+"
_GROESSE = (r"(?<![\d.,:])" + _ZAHL + r"(?:\s*[-+*/×·^]\s*" + _ZAHL + r")*+(?![.,:]?\d)")

# --- Signale: Port von signals.ts ohne die Falsch-Positiv-Wörter ------------------------------
# Entfernt gegenüber der Vorlage (R10 §2.2.4): `oder` und `entweder` allein (tradeoff), `besser`
# und `rat\w*` (recommendation), `live` und `kunde`/`customer`-Dublette (production), `user\w*`
# (affects_others), `text\w*`/`copy` (craft), `pick`/`einstell\w*` (commitment: Einstellungen),
# `drop` allein (irreversible: Drop-down), `underspecified` (Negativmuster, feuert auf „Wie spät
# ist es?"). Dubletten `vertrag`/`architect` stehen nur noch in je einer Klasse. Neu:
# `format_locked` (Formatzwang), `text` (aus signals.ts TEXT_SIGNAL_PATTERN), `reasoning`
# (Beweis/Herleitung/Erklärung) und `mehrere_groessen` (≥ 3 Zahlen im Prompt — „mehrere Größen"
# im Sinn der Aufwandsregel); die letzten beiden sind Erweiterungen.
# Adversariale Prüfung a5 (2026-09-08): zweite Schicht Allerweltswörter entfernt — team, public,
# patient, kauf/buy, wähl, ship, launch, E-Mail, standard, api, interface, balance, layout,
# migrat(ion), release, invest(igate), delete, nutze, add, foundation feuern nur noch mit Kontext.
SIGNALS: dict[str, re.Pattern] = {
    "presupposed_solution": re.compile(
        r"\b" + _VERB_EN + r"\s+" + _ART + r"(?:" + _TECH + r"|" + _EIGENNAME + r")\b"
        r"|\b" + _VERB_DE + r"\s+" + _ART + r"(?:" + _TECH + r"|(?-i:[A-Z][a-z]*[A-Z]\w*))\b"
        r"|\bf(?:ü|ue)ge?\s+" + _ART + r"(?:" + _TECH + r"|" + _EIGENNAME + r")\s+hinzu\b",
        re.IGNORECASE),
    "open_ended": re.compile(
        r"\b(?:how\s+(?:should|would)\s+(?:i|we|you|one)|how\s+(?:do|can|could)\s+we"
        r"|what.s\s+the\s+best|which\s+(?:approach|way|option|strategy)"
        r"|strategi\w*|konzept\w*|entwirf|entwerfe?n?|design\s+(?:a|an|the|our|my|new|ein|eine|einen|das|die)\b"
        r"|wie\s+(?:sollte?n?|w(?:ü|ue)rde?n?|k(?:ö|oe)nnten?)\s+(?:ich|wir|man|du)"
        r"|welche[rs]?\s+(?:ansatz|weg|option|variante|strategie)|am\s+besten)\b", re.IGNORECASE),
    "durable": re.compile(
        r"\b(?:schema\w*|(?:api|interface|schnittstellen?)[- ](?:design|contract|vertrag|version\w*"
        r"|surface|stabilit\w*|change\w*|(?:ä|ae)nderung\w*|bruch|break\w*|entwurf)"
        r"|(?:public|external|stable|versioned|(?:ö|oe)ffentliche?n?|externe?n?|stabile?n?)\s+"
        r"(?:api|apis|interface|schnittstelle\w*)"
        r"|(?:api|data|service|interface)\s+contracts?|contract[- ](?:first|tests?)"
        r"|(?:coding|code|naming|team|project|company|api|commit)\s+(?:standards?|conventions?)"
        r"|namenskonvention\w*|codekonvention\w*"
        r"|(?:wire|network|netzwerk|transfer|(?:ü|ue)bertragungs|kommunikations|communication)[- ]?"
        r"proto(?:col|koll)\w*|proto(?:col|koll)[- ](?:design|entwurf|version\w*|(?:ä|ae)nderung\w*|change\w*)"
        r"|datenmodell\w*|data\s+model\w*|datenbankschema|langfristig\w*|long-?term|wartbar\w*"
        r"|maintainab\w*|zukunftssicher\w*|future-?proof)\b", re.IGNORECASE),
    "architecture": re.compile(
        r"\b(?:architektur\w*|architectur\w*|architectural"
        r"|(?:software|system|cloud|solution|l(?:ö|oe)sungs|enterprise|technical|technische?r?"
        r"|micro-?service)[- ]?architect\w*"
        r"|refactor\w*|umbau\w*|redesign\w*|restructur\w*|umstrukturier\w*|neubau|system\s+design"
        r"|neu\s+aufbauen"
        r"|(?:code|system|projekt|project|software|daten|data|module?|modul|ordner|folder|verzeichnis"
        r"|directory|datenbank|database|service|repo\w*|paket|package)[- ]?(?:struktur|structure)\w*)\b",
        re.IGNORECASE),
    "irreversible": re.compile(
        r"\b(?:deploy\w*|prod(?:uction)?|ver(?:ö|oe)ffentlich\w*"
        r"|publish(?:ing|ed)?\s+(?:the|this|it|to|a|an|our|my)\b"
        r"|" + _RELEASE +
        r"|migrat(?:e|ed|ing)\s+(?:to|the|our|this|it|from|a|an|all|everything|users?|data"
        r"|databases?|schemas?|services?)\b"
        r"|(?:daten|data|datenbank|database|db|schema|cloud|system|server|user|nutzer|kunden"
        r"|customer|service|version)s?[- ]?migration\w*"
        r"|migration\w*\s+(?:von|der|des|auf|zu|nach|to|of|from|in)\s+(?:\w+\s+){0,2}?"
        r"(?:datenbank\w*|database\w*|db|daten|data|schema\w*|system\w*|server\w*|cloud|nutzer\w*"
        r"|user\w*|kunden\w*|customer\w*|dienst\w*|service\w*|version\w*|api\w*|prod\w*|tabelle\w*|tables?)\b"
        r"|migrier\w*"
        r"|delete\s+(?:the|this|that|all|every|our|my|their|his|her|its|users?|customers?|prod\w*"
        r"|data|tables?|databases?|db|records?|files?|branch\w*|repo\w*|accounts?|backups?|\w+['’]s)\b"
        r"|drop\s+(?:the\s+)?(?:table|database|column|schema|index)s?\b"
        r"|l(?:ö|oe)sch(?:e|en|t|te|ung)\s+(?:die|das|den|alle|s(?:ä|ae)mtliche|jede[ns]?|meine?n?"
        r"|unsere?n?|all)\b"
        r"|irreversib\w*|unwiderruflich\w*|unumkehrbar\w*|k(?:ü|ue)ndig\w*|vertrag|vertr(?:ä|ae)ge"
        r"|(?:sign|unterschreib\w*)\s+(?:the|a|den|einen)\s+(?:contract|vertrag|deal))\b",
        re.IGNORECASE),
    "commitment": re.compile(
        r"\b(?:choose\s+(?:between|among|which|whether|the\s+(?:best|right)"
        r"|a\s+(?:vendor|provider|framework|database|library|strategy|approach|tool))"
        r"|decid(?:e|ing)\s+(?:whether|between|on|if|which|how|what|to)\b"
        r"|(?:make|take|made)\s+(?:a|the)\s+(?:final\s+)?decision"
        r"|commit(?:ting)?\s+to\b"
        r"|entscheid(?:e|en|et|est)\s+(?:dich|uns|mich|euch|sich|f(?:ü|ue)r|zwischen|ob|welche[rsnm]?"
        r"|wir|ich)\b|entscheidung(?:en)?\b"
        r"|(?:ich|wir)\s+(?:kaufen?|investieren?|einstellen?|unterschreiben?|w(?:ä|ae)hlen?|nehmen)\b"
        r"|(?:should|shall)\s+(?:i|we)\s+(?:\w+\s+){0,3}?(?:buy|purchase|invest|hire|sign|commit"
        r"|choose|pick|go\s+with|accept|take)\b"
        r"|soll(?:en|te|ten)?\s+(?:ich|wir)\s+(?:\w+\s+){0,5}?(?:kaufen|investieren|einstellen"
        r"|w(?:ä|ae)hlen|nehmen|unterschreiben|zusagen|annehmen)\b"
        r"|ob\s+(?:ich|wir)\s+(?:\w+\s+){0,5}?(?:kaufen|investieren|einstellen|w(?:ä|ae)hlen|nehmen"
        r"|unterschreiben)\b"
        r"|w(?:ä|ae)hl(?:e|en|t)\s+(?:zwischen|einen?\s+(?:anbieter|ansatz|variante|option|weg"
        r"|strategie|lieferanten|dienstleister|framework|datenbank)|die\s+(?:option|variante|strategie))"
        r"|festleg\w*|(?:uns|sich)\s+einigen|einigung\b"
        r"|hire\s+(?:a|an|the|someone|more|another|two|three)\b|hiring\b"
        r"|(?:buy|purchase)\s+(?:a|an|the|this|that|new|more)\s"
        r"|invest(?:ing|ment|ments|ieren|ition)\b|invest\s+(?:in|into)\b)", re.IGNORECASE),
    "recommendation": re.compile(
        r"\b(?:should (?:i|we)|(?:whether|if)\s+(?:i|we)\s+should|soll(?:en|te|ten)? (?:ich|wir)"
        r"|recommend\w*|empfehl\w*|w(?:ü|ue)rdest du|what would you|advice|advise|rat (?:mir|uns)"
        r"|(?:einen|ein)\s+rat\b|ratschlag\w*)\b", re.IGNORECASE),
    "affects_others": re.compile(
        r"\b(?:nutzer\w*|kunde\w*|kunden\w*|customer\w*|kolleg\w*|mitarbeiter\w*|leser\w*"
        r"|besucher\w*|community|zielgruppe\w*|audience|stakeholder\w*|endanwender\w*|end[- ]?users?"
        r"|anwender\w*|patient(?:en|s|in|innen)"
        r"|(?:mein|meine|unser|unsere|dein|deine|das|dem|des|im|ans|the|our|my|your|whole|entire"
        r"|dev|engineering|backend|frontend|product|sales|support|ganze|gesamte)\s+teams?"
        r"|teams?\s+(?:informieren|mitteilen|announc\w*|inform\w*|notify\w*|tell\w*|update\w*"
        r"|meeting|lead|erkl(?:ä|ae)ren)|teammitglied\w*|teamkolleg\w*|team-?mates?"
        r"|(?:public|(?:ö|oe)ffentlich\w*)\s+(?:api|apis|interface|schnittstelle\w*|release|announc\w*"
        r"|statement|post\w*|repo\w*|ank(?:ü|ue)ndigung\w*|stellungnahme\w*|facing)"
        r"|(?:go|going|make\s+(?:it|this|them))\s+public|(?:die|der)\s+(?:ö|oe)ffentlichkeit"
        r"|user-?facing|kundenseitig\w*)\b", re.IGNORECASE),
    "tradeoff": re.compile(
        r"\b(?:vs\.?|versus|trade-?offs?|abw(?:ä|ae)g\w*|compromise|kompromiss\w*"
        r"|balance\s+(?:between|zwischen|of\s+\w+\s+(?:and|und))|(?:ab|aus)balancier\w*"
        r"|pros\s+and\s+cons|vor-?\s*und\s+nachteile"
        r"|entweder\b.{1,80}\boder|either\b.{1,80}\bor)\b", re.IGNORECASE),
    "craft": re.compile(
        r"\b(?:(?:visual|ui|ux|graphic|web|product|sound|brand|screen|interaction)[- ]?design\w*"
        r"|design\s+(?:quality|language|system|review|polish|sprache|qualit(?:ä|ae)t)"
        r"|ux|ui|wording"
        r"|(?:seiten|page|print|grid|responsive|flex|screen|bildschirm)[- ]?layout\w*"
        r"|layout\s+(?:der|des|for|of)\s+(?:seite|page|website|app|form\w*|dashboard)"
        r"|typograf\w*|typograph\w*|(?:ä|ae)sthetik|aesthetic\w*|politur|polish\w*"
        r"|(?:code|text|schreib|design|sprach|ton)[- ]?qualit(?:ä|ae)t|(?:code|text|writing|design"
        r"|visual)\s+quality|feinschliff|craft\w*|handwerk\w*)\b", re.IGNORECASE),
    "production": re.compile(
        r"\b(?:prod(?:uction)?"
        r"|ship\s+(?:it|this|that|the|to|a\s+(?:fix|feature|release|version|hotfix|patch)|today"
        r"|tomorrow|by|before|on|next)\b|shipping\s+(?:the|this|it|a|an|our)\b"
        r"|shipped\s+(?:the|this|it|to)\b|to\s+ship\b"
        r"|launch\s+(?:the|this|it|a|an|our|new|on|to|today|tomorrow|by|before|next)\b"
        r"|(?:product|feature|app|website|site|soft)\s+launch\w*|launching\s+(?:the|this|it|a|an|our)"
        r"|markteinf(?:ü|ue)hrung\w*|produktstart"
        r"|" + _RELEASE +
        r"|ausliefer\w*|go-?live|rollout\w*|roll\s+out\b|live\s+(?:schalten|gehen|stellen)"
        r"|freischalt\w*)\b", re.IGNORECASE),
    "text": re.compile(
        r"\b(?:e-?mail\s+(?:an|to|f(?:ü|ue)r|for)\s|mail\s+an\s|brief\s+(?:an|f(?:ü|ue)r)\s"
        r"|letter\s+to\s|absage|zusage|einladung|invitation|ank(?:ü|ue)ndigung|announcement"
        r"|announcing|entschuldigung|apology|kondolenz|beileid|condolence|newsletter|blog[- ]?post"
        r"|tweet|anschreiben|leserbrief|dankesschreiben|ansprache|trauerrede"
        r"|(?:schreib|verfass|formulier|write|draft|compose|send|schick|sende)\w*\s+(?:\w+\s+){0,3}?"
        r"(?:e-?mails?|mail|text|nachricht|brief|antwort|message|reply|note|posting|memo))\b",
        re.IGNORECASE),
    "reasoning": re.compile(
        r"\b(?:beweis\w*|prove|proof|herleit\w*|derive|zeige,?\s+dass|show\s+that|begr(?:ü|ue)nde\w*"
        r"|justify|warum|wieso|weshalb|why|analysier\w*|analy[sz]e\w*|vergleich\w*|compare"
        r"|diskutier\w*|discuss|bewert\w*|evaluate|assess"
        # Negierte Erklärung („Keine Erklärung", „Do not explain") ist ein Formatzwang, kein Denkauftrag.
        r"|(?<!keine )(?<!nicht )(?<!ohne )erkl(?:ä|ae)r\w*\b(?!\s+nichts)"
        r"|(?<!not )(?<!no )(?<!don't )(?<!don’t )(?<!dont )(?<!without )explain\w*\b(?!\s+nothing))\b",
        re.IGNORECASE),
    # mindestens drei Größen: „mehrere Größen" im Sinn der Aufwandsregel. Jede Größe wird als
    # ganzes Token gelesen — Datum (1.1.2000, 2026-09-08), Version (3.11.2), IP (192.168.0.1),
    # Uhrzeit (12:30:15), Tausendergruppen (1.000.000) und eine arithmetische Kette („1 + 2 + 3",
    # „17*23") sind EINE Größe. Possessive Quantoren (Python 3.11) verbieten das Backtracking,
    # das eine Zahl sonst in drei zerlegt.
    "mehrere_groessen": re.compile(_GROESSE + r"(?:\D+?" + _GROESSE + r"){2}"),
    # Formatzwang (ARCHITEKTUR 5.5, nach a4/a7 eng gefasst): nur noch Ausgabe-Direktiven —
    # „nur/only" unmittelbar vor einem Formatwort, „Antworte mit …/Reply with …", „ja oder nein",
    # „single number", „number only", „in einem Wort", „genau ein Wort", JSON/CSV/YAML nur als
    # Ausgabeformat („als JSON", „as JSON", „JSON-Objekt", „Format: CSV"), „Gib … aus" nur mit
    # nur/NUR oder einem Objekt (Zahl, Wort, Zeile, Liste …), „kein weiterer Text", „nichts sonst",
    # „keine Erklärung", „do not explain". Bloßes „JSON" als Thema und „Gib mir einen Rat … aus dem
    # Mietvertrag" zählen nicht.
    "format_locked": re.compile(
        r"\b(?:nur|ausschlie(?:ß|ss)lich)\s+(?:die\s+|das\s+|den\s+|eine\s+|einen\s+|ein\s+"
        r"|mit\s+der\s+|mit\s+dem\s+|mit\s+einer\s+|mit\s+einem\s+)?"
        r"(?:sortierte\s+|fertige\s+|reine\s+|nackte\s+|einzelne\s+|finale\s+|endg(?:ü|ue)ltige\s+)?"
        + _FMT_DE + r"\b"
        r"|\b(?:only|just)\s+(?:the\s+|a\s+|an\s+|one\s+|with\s+the\s+|with\s+a\s+|give\s+me\s+the\s+"
        r"|give\s+the\s+|output\s+the\s+|return\s+the\s+|print\s+the\s+)?"
        r"(?:final\s+|single\s+|plain\s+|raw\s+|bare\s+|sorted\s+|resulting\s+|correct\s+)?"
        + _FMT_EN + r"\b"
        r"|\b" + _FMT_EN + r"\s+only\b"
        r"|\b(?:einzige[nrs]?|single|one)\s+(?:Zahl|Wort|Zeile|Ziffer|Buchstabe\w*|number|word|line"
        r"|digit|letter|sentence)\b"
        r"|\bin\s+(?:einem|one)\s+(?:Wort|word|Satz|sentence)\b"
        r"|\b(?:genau|exakt|exactly)\s+(?:eine[rnms]?|ein|one|a)\s+(?:Zahl|Wort|Zeile|Ziffer"
        r"|Buchstabe\w*|Satz|number|word|line|digit|letter|sentence)\b"
        r"|\b(?:ja|yes)\s*(?:oder|or|/)\s*(?:nein|no)\b|\b(?:nein|no)\s*(?:oder|or|/)\s*(?:ja|yes)\b"
        r"|\b(?:antworte|antwortet|antworten\s+sie|reply|answer|respond)\s+(?:bitte\s+)?(?:nur\s+|only\s+)?"
        r"(?:mit|with|in|using)\s+(?:\w+\s+){0,2}?(?:Zahl|Zahlen|Wort|Ziffer|Ziffern|Buchstaben?|Zeile"
        r"|Satz|ja|JSON|number|numbers|word|digit|digits|letter|line|sentence|yes|true|false|wahr|falsch)\b"
        r"|\b(?:als|as)\s+(?:reine[sn]?\s+|valid\s+|pure\s+|strict\s+|g(?:ü|ue)ltiges\s+)?JSON\b"
        r"|\b(?:nur|only|in|im|valid|strict|g(?:ü|ue)ltiges|reines|pure|raw)\s+JSON\b"
        r"|\bJSON[- ]?(?:only|objekt|object|format|array|ausgabe|output)\b"
        r"|\b(?:output|return|reply|respond|answer|print|give|format)\w*\s+(?:\w+\s+){0,3}?(?:as|in)\s+"
        r"(?:valid\s+|pure\s+|strict\s+|plain\s+|raw\s+)?(?:JSON|CSV|YAML|XML|markdown|a\s+table|a\s+list"
        r"|bullet\s+points|one\s+line)\b"
        r"|\b(?:antworte|antwortet|gib|liefere?|ausgabe|formatiere?)\s+(?:\w+\s+){0,3}?(?:als|im|in)\s+"
        r"(?:reine[sn]?\s+|einer\s+|eine\s+)?" + _FMT_TYP + r"\b"
        r"|\b(?:output\s+|ausgabe|antwort)?format\s*:\s*(?:csv|yaml|json|markdown|md|xml|tsv|text"
        r"|plain\s+text|table|tabelle|liste|list)\b"
        r"|\bim\s+(?:CSV|YAML|JSON|XML|Markdown)[- ]?Format\b|\b(?:CSV|YAML|XML|TSV)\s+only\b"
        r"|\bkein\s+weiterer\s+Text\b|\bnichts\s+sonst\b|\bnothing\s+else\b"
        r"|\bno\s+(?:other|further|additional|extra)\s+(?:text|words|output|commentary)\b"
        r"|\bno\s+explanation\w*\b|\bohne\s+Erkl(?:ä|ae)rung\b"
        r"|\bkeine\s+(?:Erkl(?:ä|ae)rung|Begr(?:ü|ue)ndung|Erl(?:ä|ae)uterung)\w*\b"
        r"|\b(?:do\s+not|don['’]t|dont)\s+explain\b|\bno\s+commentary\b|\berkl(?:ä|ae)r\w*\s+nichts\b"
        r"|\bwithout\s+(?:any\s+)?(?:explanation|commentary)\b"
        r"|\bantworte\s+nur\s+mit\b|\brespond\s+only\s+with\b|\b(?:return|output|print|reply|answer"
        r"|respond)\s+only\b"
        r"|\bgib\s+(?:\w+\s+){0,3}?(?:nur|ausschlie(?:ß|ss)lich)\b|\bnenne?\s+nur\b"
        r"|\bgib\s+(?:\w+\s+){0,3}?(?:die\s+|das\s+|den\s+|eine\s+|einen\s+|ein\s+)?"
        r"(?:Zahl|Zahlen|Anzahl|Wort|Zeile|Liste|Ergebnis|Antwort|Ziffer|JSON|Tabelle)\b[^\n.!?;,]{0,40}?\baus\b",
        re.IGNORECASE),
}

# Der Formatzwang hebt eine Aufgabe nicht aus der Trivialität: er führt selbst zu „direkt" —
# aber nur ohne Einsatzhöhe.
FORMAT_SIGNAL = "format_locked"
# Einsatzhöhe: mit einem dieser Signale bleibt ein formatgebundener Prompt „aufwand" (die
# Aufwandsregel endet selbst mit „Antworte am Ende im verlangten Format").
STAKES_SIGNALS = ("irreversible", "durable", "architecture", "affects_others", "commitment",
                  "recommendation")

# --- Satzzählung ------------------------------------------------------------------------------
# Ein Satz endet an . ! ? ; gefolgt von Leerraum und irgendeinem Zeichen — auch einem
# Kleinbuchstaben (Chat-Alltag: „lisa hat 3 aepfel. tom gibt ihr 6.") — oder an einem
# Zeilenumbruch. Ordinal-Daten („1. Januar"), Ordinale vor Substantiven („18. Jahrhundert",
# „3. Bundeskanzler"), gängige Abkürzungen („z. B.", „Nr.", „Hr.") und Auslassungspunkte
# („Hmm... Was") werden vorher entschärft, damit sie nicht als Satzende zählen.
_MONTHS = (r"(?:Jan(?:uar)?|Feb(?:ruar)?|M(?:ä|ae)rz|Apr(?:il)?|Mai|Juni?|Juli?|Aug(?:ust)?"
           r"|Sep(?:t|tember)?|Okt(?:ober)?|Nov(?:ember)?|Dez(?:ember)?)")
_ORDINAL_DATE = re.compile(r"\b(\d{1,2})\.\s+(?=" + _MONTHS + r"\b)")
# Ordinal vor großgeschriebenem Substantiv nach Artikel, Präposition oder Kopula („im 18.
# Jahrhundert", „wurde 3. Bundeskanzler", „am 2. Platz") — nicht nach einem Substantiv („Radius 3.
# Runde auf zwei Stellen." sind zwei Sätze).
_ORDINAL_NOUN = re.compile(
    r"\b(im|am|der|die|das|den|dem|des|zum|zur|vom|beim|als|vor|nach|seit|bis|um|ab|ins|ans|wurde"
    r"|war|ist|wird|jeden|jede|jedes|jedem|jeder|ein|eine|einen|einem|einer|sein|seine|seinem|seinen"
    r"|seiner|ihr|ihre|ihrem|ihren|ihrer|mein|meine|meinem|meinen|meiner|dein|deine|unser|unsere"
    r"|zwischen|etwa|rund|circa|ca|the|on|of|in|at|his|her|its|their|my|our)\s+(\d{1,2})\.\s+"
    r"(?=[A-ZÄÖÜ][a-zäöüß])", re.IGNORECASE)
# abgekürzter Monat oder Wochentag vor einer Zahl („Okt. 1990", „Mo. 12 Uhr") ist kein Satzende
_MONTH_ABBREV = re.compile(
    r"\b(Jan|Feb|M(?:ä|ae)r|Apr|Jun|Jul|Aug|Sept?|Okt|Nov|Dez|Mo|Di|Mi|Do|Fr|Sa|So)\.\s+(?=\d)")
_ABBREVIATION = re.compile(
    r"\b(?:z\.\s?B|u\.\s?a|d\.\s?h|o\.\s?(?:ä|ae)|bzw|etc|ca|vgl|inkl|Nr|Dr|Prof|St|Mr|Mrs|Ms"
    r"|Hr|Hrn|Fr|Frl|Tel|Str|Mio|Mrd|Tsd|Jh|Chr|Inc|Ltd|Corp|Jr|Sr|Abb|Univ"
    r"|e\.\s?g|i\.\s?e|approx)\.\s+", re.IGNORECASE)
_ELLIPSIS = re.compile(r"(?:\.\s*){3,}|…")
_SENTENCE_SPLIT = re.compile(r"(?<=[.!?;])\s+(?=\S)|\n+")


def _scan_window(text: str) -> str:
    """Kopf und Schluss eines sehr langen Prompts — dort stehen Auftrag und Formatvorgabe."""
    if len(text) <= SIGNAL_SCAN_HEAD + SIGNAL_SCAN_TAIL:
        return text
    return text[:SIGNAL_SCAN_HEAD] + "\n" + text[-SIGNAL_SCAN_TAIL:]


def detect_signals(prompt: str) -> list[str]:
    """Alle zutreffenden Signale in Katalogreihenfolge (Mehrfachzugehörigkeit ist der Normalfall)."""
    text = _scan_window((prompt or "").strip())
    return [name for name, rx in SIGNALS.items() if rx.search(text)]


def sentence_count(prompt: str) -> int:
    """Anzahl Sätze/Fragen; ein Prompt ohne Satzzeichen zählt als ein Satz."""
    text = _scan_window((prompt or "").strip())
    text = _ELLIPSIS.sub(", ", text)
    text = _ORDINAL_DATE.sub(r"\1 ", text)
    text = _MONTH_ABBREV.sub(r"\1 ", text)
    text = _ORDINAL_NOUN.sub(r"\1 \2 ", text)
    text = _ABBREVIATION.sub(lambda m: m.group(0).replace(".", "") + " ", text)
    pieces = [p for p in _SENTENCE_SPLIT.split(text) if p and p.strip()]
    return max(1, len(pieces))


def prefilter(prompt: str) -> dict:
    """Deterministischer Vorfilter: {"len", "signals", "trivial", "format_locked", "sentences"}.

    trivial: ≤ 200 Zeichen UND kein Signal (der Formatzwang zählt nicht, er führt selbst zu
    „direkt") UND höchstens ein Satz/eine Frage.
    format_locked: der Prompt schreibt das Ausgabeformat fest (nur die Zahl, als JSON, ja oder nein).
    """
    text = (prompt or "").strip()
    signals = detect_signals(text)
    stakes = [s for s in signals if s != FORMAT_SIGNAL]
    sentences = sentence_count(text)
    trivial = len(text) <= TRIVIAL_MAX_CHARS and not stakes and sentences <= 1
    return {"len": len(text), "signals": signals, "trivial": trivial,
            "format_locked": FORMAT_SIGNAL in signals, "sentences": sentences}


# --- Entropie-Sonde -------------------------------------------------------------------------------
_TRIM_EDGE = re.compile(r"^[\s*_`\"'«»„“”‘’(\[]+|[\s*_`\"'«»„“”‘’.!?:;,)\]]+$")
# Antwortpräfixe („Die Antwort ist Paris", „Ergebnis: Paris", „The answer is Paris") tragen
# nichts zum Vergleich bei — zwei Stichproben, die dieselbe Antwort verschieden einleiten, sind
# einig (a6: „Die Antwort ist Paris" gegen „Paris" hieß sonst Prüfer).
_ANSWER_PREFIX = re.compile(
    r"^(?:(?:die|das|the|my|meine?)\s+)?(?:antwort|ergebnis|l(?:ö|oe)sung|answer|result|solution)"
    r"\s*(?:ist|lautet|w(?:ä|ae)re|is|would\s+be|:|=|-|–)\s*", re.IGNORECASE)


def _comparable(result: dict):
    """Vergleichswert einer Stichprobe: letzte Zahl, sonst letzte Zeile normalisiert (Satzzeichen
    und Markdown am Rand entfernt, Antwortpräfix abgestreift, Leerraum kollabiert,
    Kleinschreibung — „Paris." == „Paris" == „Die Antwort ist Paris"); None bei Fehler."""
    if not result.get("ok"):
        return None
    text = result.get("text", "")
    number = _model.extract_last_number(text)
    if number is not None:
        return round(number, 9)
    line = _TRIM_EDGE.sub("", _model.extract_last_line(text))
    line = _TRIM_EDGE.sub("", _ANSWER_PREFIX.sub("", line))
    line = re.sub(r"\s+", " ", line).strip().lower()
    return line or None


def entropy_probe(task: str, *, model: str | None = None, thinking: int = 0, n: int = 2) -> dict:
    """n ≥ 2 billige Aufrufe ohne Systemprompt; einig, wenn alle Endwerte gleich sind.

    Ein fehlgeschlagener Aufruf zählt als uneinig (lieber ein Prüfer zu viel als ein Fehler
    unbemerkt). Eine Sonde mit einem Aufruf wäre immer einig — n wird auf 2 angehoben.
    Rückgabe {"agree", "values", "calls"}. Der Bus erhält nur Einigkeit und die Zahl der
    verschiedenen Werte, nie Text.
    """
    n = max(2, int(n))
    results = [_model.call(None, task, model=model, thinking=thinking) for _ in range(n)]
    values = [_comparable(r) for r in results]
    agree = all(v is not None for v in values) and len(set(values)) == 1
    bus.emit("switch.entropy_probe", agree=agree, calls=n, distinct=len(set(values)),
             failed=sum(1 for v in values if v is None))
    return {"agree": agree, "values": values, "calls": n}


# --- Entscheidung ---------------------------------------------------------------------------------
def _log_routing(record: dict) -> None:
    """Eine Zeile routing.jsonl — fail-open, nie eine Exception nach außen; rotiert wie der Bus.

    Der Name der rotierten Datei ist eindeutig (Sekundenstempel plus Zähler): zwei Rotationen in
    derselben Sekunde überschrieben sich sonst per rename und verloren Zeilen.
    """
    try:
        target = paths.routing_file()
        try:
            if target.stat().st_size > _ROTATE_BYTES:
                stamp = time.strftime("%Y%m%d-%H%M%S", time.gmtime())
                neu, k = target.with_name(f"routing-{stamp}.jsonl"), 1
                while neu.exists():
                    neu, k = target.with_name(f"routing-{stamp}-{k}.jsonl"), k + 1
                target.rename(neu)
        except FileNotFoundError:
            pass
        with target.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(record, ensure_ascii=False, default=str) + "\n")
    except Exception:  # noqa: BLE001 — ein kaputtes Log hält nichts an
        pass


def decide(prompt: str, *, probe: bool = False, model: str | None = None) -> dict:
    """Stufe für einen Prompt; loggt Hash, Länge, Signale, Stufe — NIE den Prompttext.

    direkt   : trivial, oder format_locked ohne Einsatzhöhe (STAKES_SIGNALS) → nichts einblenden,
               kein Prüfer.
    aufwand  : sonst → model.AUFWANDSREGEL einblenden (auch bei Formatzwang mit Einsatzhöhe: die
               Regel endet mit „Antworte am Ende im verlangten Format").
    pruefer  : nur wenn probe=True (Opt-in: `soul switch --probe`, `soul run --probe-switch`; der
               Hook ruft ohne Sonde), die Stufe sonst aufwand wäre und die Entropie-Sonde uneinig
               ist → Aufwandsregel einblenden UND Prüfer rufen.
    Rückgabe {"stage", "reason", "inject", "signals", "len", "trivial", "format_locked",
              "sentences", "sha", "probe"}.
    """
    text = (prompt or "").strip()
    pf = prefilter(text)
    probe_result = None
    stakes = [s for s in pf["signals"] if s in STAKES_SIGNALS]
    other = [s for s in pf["signals"] if s != FORMAT_SIGNAL]
    if pf["trivial"]:
        stage, reason = "direkt", "trivial: kurz, ein Satz, kein Signal"
    elif pf["format_locked"] and not stakes:
        stage, reason = "direkt", "format_locked: Ausgabeformat festgeschrieben"
    else:
        stage = "aufwand"
        if other:
            reason = "Signale: " + ", ".join(other)
            if pf["format_locked"]:
                reason += "; format_locked, aber Einsatzhöhe: die Aufwandsregel endet im verlangten Format"
        elif pf["len"] > TRIVIAL_MAX_CHARS:
            reason = f"Länge {pf['len']} > {TRIVIAL_MAX_CHARS}"
        else:
            reason = f"{pf['sentences']} Sätze"
        if probe:
            probe_result = entropy_probe(text, model=model)
            if not probe_result["agree"]:
                stage = "pruefer"
                reason += "; Entropie-Sonde uneinig"
            else:
                reason += "; Entropie-Sonde einig"
    inject = _model.AUFWANDSREGEL if stage in ("aufwand", "pruefer") else ""
    sha = paths.sha256_text(text)
    record = {"ts": paths.now_iso(), "sha": sha, "len": pf["len"], "signals": pf["signals"],
              "trivial": pf["trivial"], "format_locked": pf["format_locked"], "stage": stage,
              "reason": reason}
    _log_routing(record)
    bus.emit("switch.decide", sha=sha, len=pf["len"], signals=pf["signals"], stage=stage,
             reason=reason, probe=probe_result["agree"] if probe_result else None)
    return {"stage": stage, "reason": reason, "inject": inject, "signals": pf["signals"],
            "len": pf["len"], "trivial": pf["trivial"], "format_locked": pf["format_locked"],
            "sentences": pf["sentences"], "sha": sha, "probe": probe_result}
