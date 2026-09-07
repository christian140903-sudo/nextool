# Design-Entscheidungsregister Soul 10.0.0 (Ordnung × SOUL)

*Stand 2026-09-06, Bauschritt B1. Das zentrale Bau-Dokument: jeder Bau-Agent ab B2 liest es. Jede Entscheidung: **Entscheidung** (ein Satz, verbindlich) · **Begründung** · **Quelle** (Bericht §, Kontextpaket §) · **Erz → Gold** · **Offen/Risiko**. Gruppen A–L; innerhalb jeder Gruppe die wichtigsten zuerst. Eine Entscheidung ohne Quelle ist ungültig. Zahlen tragen ihre Herkunft; alles, was noch nicht gemessen ist, heißt „so gebaut, dass …" (Kontextpaket §13.4).*

## Leseanleitung

- **Zitierform:** `R10 §3.1` = Bericht R10, Abschnitt 3.1; `K §13` = Kontextpaket Abschnitt 13. Berichte liegen unter `docs/research/`.
- **Rang der Quellen:** Chrisos eigene Messungen (K §3) sind verbindlich und werden nicht neu erfunden. Externe Literatur stützt Richtung, selten Größe (R02 §4.4, R10 W7: Evidenzbasis meist kleine Modelle). Anbieter-Doku ist versionsgebunden (R01 §4.9).
- **Erz → Gold** (K §13.1): Jede Entscheidung, die eine geerbte Idee umsetzt, nennt, was das Original wollte, wo es stehen blieb und wie Soul 10 es besser erreicht. Fehlt die Zeile, ist das Bauteil nicht fertig.
- **Konflikte** zwischen Berichten sind im Abschnitt „Aufgelöste Konflikte" (K1–K18) entschieden; die betroffenen Entscheidungen verweisen darauf.
- **Offene Fragen** (O1–O24) nennen die Zuständigkeit: *Bau* (ein B-Schritt entscheidet oder testet), *Eval* (die Messung entscheidet), *Chriso* (Produkt-/Wertentscheidung des Auftraggebers).
- **Verbindliche Vorgaben des Auftrags** (B1-Brief) sind alle enthalten; die Zuordnung steht am Ende des Registers.

---

## A · Kernel / Bewusstseinsstruktur

### D001 · Kernel-Anker ≤ 800 Tokens, dicht statt kurz, immer im Prefix
**Entscheidung:** Der immer geladene Kern von Ordnung ist ein Anker von höchstens 800 Tokens (gemessen im Build), der Identitätsanker, Rangordnung, Tiefenregel und die zwei wirksamsten Schutzbausteine trägt — nichts sonst.
**Begründung:** Adhärenz zerfällt mit der Zahl atomarer Direktiven (Frontmodelle ≥ 98 % bis ~100, Haiku-Klasse kollabiert früh; R02 §1.3), mit Kontextlänge (R02 §1.4) und pro Dialogrunde (R02 §1.5). Der 486-Token-Frame wirkt (0,86; K §3), die Hälfte davon ist Kontexteffekt — jede Verlängerung muss ihren längen-gematchten Placebo schlagen. „Dicht, nicht kurz": Kürze-Anweisungen senkten Halluzinationsresistenz um bis zu 20 % (R10 §1.8).
**Quelle:** R02 §1.14, §3.1 Regeln 1–4; R10 §1.10–1.11, §3.4; R03 §3.1.1; R12 K2; K §3.
**Erz → Gold:** ANIMA v3 lud ~200.000 Wörter immer (R01 §0.3); SOUL-CLAUDE.md mischt Arbeitsweise, Personalisierung und Ermahnungen. Soul 10 trennt Anker (immer), Bündel (bei Signal), Mechanismen (Hooks) — und misst die Anker-Länge gegen Placebo statt sie zu verteidigen.
**Offen/Risiko:** Konflikt K3 (verschiedene Budgets in R02/R03/R04/R10) ist aufgelöst: Anker ≤ 800 Tokens; Always-on gesamt (Anker + Charta-Kurzform + Robustheits-Kurzform + Output-Style) ≤ 2.000 Tokens; S-Variante ≤ 2.400 Zeichen für enge Träger (R04 §3.3).

### D002 · Der gemessene 6-Punkte-Frame bleibt byte-gleich als versionierter Vergleichsarm
**Entscheidung:** Der Wortlaut aus `implant.ts` (K §4) wird unverändert als Arm `c` in jede Messung geführt und mit sha256 versioniert; der Produkt-Kernel ist eine daneben entstehende, eigene Form.
**Begründung:** An diesem Wortlaut hängt die einzige belastbare Evidenz des Projekts (0,86 Paarurteile; +11 pp Inhaltseffekt über zwei Modelle, K §3). Wer ihn verändert, misst etwas Neues. Die Faktorzerlegung (welcher Punkt trägt) steht aus (K §4).
**Quelle:** K §4, §13.3a; R02 §3.3; R07 §3.1 Einleitung; R04 §3.9.
**Erz → Gold:** Soul 4.5 ließ Frame-Text in `implant.ts` und Kernel-Dokumenten auseinanderdriften (R04 §3.1: „Frame-Drift"). Soul 10 hält den Frame als Bau-Artefakt mit Hash im Hauptbuch; der Compiler erzeugt ihn, niemand tippt ihn ab.
**Offen/Risiko:** Konflikt K11 („Known from measurement …" in Punkt 3 ist Wirkhypothese, kein Messbefund): der Produkt-Kernel nutzt die neutrale Fassung („Your default first pass tends to run below …") und misst sie als Arm gegen das Original (R02 §4.11, R09 §4.7). Chriso bestätigt (O3).

### D003 · Ordnungs Phasen werden auf den Frame abgebildet, nicht hinzugefügt
**Entscheidung:** Verstehen → Erkunden → Bewerten → Entscheiden → Formulieren → Prüfen stehen im Kernel als Zielzustände in der Sprache des Frames (Punkte 1–6 decken sie), nie als Schrittfolge; nur das, was der Frame nicht enthält, wird als getrennt messbares Modul angefügt.
**Begründung:** Die sechs Frame-Punkte sind bereits Fragen und Zielzustände in stiller Vorbereitung — die Form, die Anthropic empfiehlt („general instructions over prescriptive steps"; R02 §1.13). Zusatzmodule (Identität, Werte, Scope, Prüfen) sind ein bis drei Sätze, deklarativ, einzeln abschaltbar, gegen längen-gematchte Placebos zu beweisen (R02 §3.3 Tabelle).
**Quelle:** R02 §1.13, §3.3; R01 §3.18 (ein Durchlauf, nicht Aufrufkette); K §3 (Zwei-Call = 0,50).
**Erz → Gold:** Die Spezifikation wollte einen expliziten Sechs-Phasen-Zyklus; Metacognitive Prompting (R01 §1.9) ist ein fixer Fünf-Stufen-Prompt. Soul 10 lässt die Phasen im Denken wirken, misst jede Ergänzung getrennt und hält die Gesamtlänge unter der Zerfallsschwelle.
**Offen/Risiko:** Dilutionstest (R02 §3.4 A4 vs. A4′): verliert der Frame durch die Zusätze, wandern Module in den On-Demand-Teil, nicht der Frame.

### D004 · Struktur im Denken, nie in der Ausgabe; formatGuard ist Pflicht in jeder Bindung
**Entscheidung:** Kein Bauteil von Ordnung erzeugt sichtbare Phasen, Pläne, Selbsteinschätzungen oder Meta-Kommentare; bei erkanntem Formatzwang (`response_format`, `tools`, Benchmark, „nur Code") entfallen auch Annahme- und Abweichungszeile.
**Begründung:** Chrisos Formatschaden (2/30 Antworten zerstört; K §3) und CoT-Faithfulness von 25–39 % (R02 §1.10) zeigen: sichtbare Struktur kostet Budget, füttert Längenbias und belegt nichts. Vygotsky liefert die Theorie (privates Sprechen wird internalisiert; R13 §1.10).
**Quelle:** K §3, §4 (formatGuard); R02 Regel 19–20, Anti-Pattern 1, 17; R10 A4, A8; R13 §3.3.
**Erz → Gold:** Soul 4.5 führte `formatGuard.ts` als Nachbesserung ein. Soul 10 macht Formatschutz zum Bauprinzip jedes Trägers und zur Testbedingung (Typ-10-Items: Formatschaden = Sofort-Fail, R08 §3.4).
**Offen/Risiko:** —

### D005 · Sechs Bündel-Skills plus zwei Inline-Bündel statt 55 Einzelmodule
**Entscheidung:** Die Faktoren werden zu sechs modell-aufrufbaren Bündeln geschnitten — `optionen`, `folgen`, `werte`, `urteil`, `dirigent`, `form` — plus zwei Inline-Bündel (`falsifikation`, `verstehen` im Anker); Robustheits- und Knappheits-Kurzformen reicht der Hook bei Signal, sie belegen keinen Skill-Listing-Platz.
**Begründung:** Das Skill-Listing kostet jeden Turn 1 % des Kontextfensters (≈ 2.000 Zeichen bei 200k für alle Skills; R03 §1.5) — höchstens 5–6 modell-aufrufbare Skills passen (R10 §1.11). Faktorial-Befund: „alles an" verliert gegen jede optimale Teilmenge, 56 % Submodularitätsverletzungen (R10 §1.6). Codex begrenzt auf 2 %/8.000 Zeichen (R04 §1.2).
**Quelle:** R10 §3.2 (Bündeltabelle); R03 §1.5, §3.1.2; R04 §3.10; R17 §4.6; K §13.
**Erz → Gold:** Die Spezifikation und R01 §3.1 wollten 55 Faktor-Ordner mit je einer SKILL.md. Soul 10 bündelt nach Auslöser und Kosten, weil nur Bündel ins Listing passen und weil ein Mensch sagen können muss, welches Bündel greift (R10 §2.9.1).
**Offen/Risiko:** Trefferquote Hook-Router vs. Skill-Auswahl des Modells messen (R17 §4.6).

### D006 · Der Faktorkatalog ist Design-Zeit-Taxonomie, nie Laufzeit-Checkliste
**Entscheidung:** Der Katalog (≥ 120 Faktoren in 12 Familien, B3b) bestimmt, was in Anker, Bündel, Hooks und Evaluation kommt; er wird selbst nie geladen.
**Begründung:** 55 Faktoren × Regeln ergeben 150–300 Direktiven — die Zone maximalen Primacy-Bias (R02 §1.3, Regel 5). Reichtum heißt Verfügbarkeit, nicht Gleichzeitigkeit (R13 §4; GWT-Engpass). Chrisos Vielfaktoren-These bleibt für Faktoren *im Modell* offen und ist für Faktoren *im Prompt* widerlegt (R10 W2).
**Quelle:** R02 Regel 5, §4.1; R09 §1.1, §4.1; R10 §1.6, W2; R13 §4; R12 W2.
**Erz → Gold:** Die Spezifikation sah 55 Startfaktoren als geladene Struktur. Soul 10 macht daraus eine Bibliothek mit Schema (D007), die Router, Hooks und Ablation speist — „Linse, nicht Käfig" wird Messbefund statt Stilprinzip.
**Offen/Risiko:** Konflikt K10 (Vision „reicher Katalog" vs. Evidenz) aufgelöst; falsifizierbar per Arm „voller Katalog always-on" (R03 §4.7).

### D007 · Faktor-Schema mit Pflichtfeldern; ohne Auslöser oder Mechanismus lehnt der Build ab
**Entscheidung:** Jeder Faktor trägt `id, name_de, name_en, type ∈ {O,H,W,M,K}, family, definition, trigger_signals[], evidence ∈ {B,P,R,U}, pair, prompt_text ≤ 2 Zeilen, mechanism_ref, kill_check`; ein Faktor ohne `trigger_signals` **und** ohne `mechanism_ref` wird vom Build abgelehnt; Haltungen (Typ H) brauchen `operation` und `metric`.
**Begründung:** Haltungen wirken nur als Operationen (Personas bringen nichts: 162 Rollen × 2.410 Fragen; R09 §1.4). Vier Startfaktoren sind als Selbstanweisung riskant und müssen Mechanismen werden (Selbstkorrektur, Bias-Check, Tiefensteuerung, Konfidenz; R09 §1.3).
**Quelle:** R09 §3.1–3.3; R01 §3.14 (Faktoren als prüfbare Tenets).
**Erz → Gold:** Die Spezifikation listete Faktoren als Prosa. Soul 10 macht jeden Faktor zu einem Datensatz mit Auslöser, Evidenzgrad und Kill-Check; „sei neugierig" ist verboten, „hole die fehlende Information" erlaubt.
**Offen/Risiko:** Evidenzgrade sind Einstufung eines Agenten; zweiter Bewerter blind gegenprüfen (R09 §4.9).

### D008 · Deklarativ, positiv, in Fragen und Zielzuständen; Emphase höchstens auf einer Zeile
**Entscheidung:** Kernel- und Bündeltexte sind deklarativ und prozessbeschreibend, positiv formuliert (Negation nur für Ring-2-Grenzen), mit nummerierten Schritten nur für Handlungsabläufe; „CRITICAL/MUST" kommt höchstens einmal vor, für eine harte Grenze.
**Begründung:** Imperative Blöcke konkurrieren, deklarative kooperieren (−81 % Varianz; R02 §1.11); Emphase-Inflation lässt nichts hervorstechen; negierte Prompts primen die positive Antwort (R02 Regel 8).
**Quelle:** R02 §3.1 Regeln 6–10, 13, 18; Anti-Pattern 8.
**Erz → Gold:** SOULs Output-Style und CLAUDE.md sind imperativ („Du machst …"). Soul 10 schreibt wie der gemessene Frame und wie Anthropics eigener System-Prompt: dritte Person, Gründe nur wo kontraintuitiv.
**Offen/Risiko:** —

### D009 · Modellgerichtete Texte auf Englisch, Nutzertexte in der Profilsprache
**Entscheidung:** Kernel, Charta, Bündel, Regeln und Dossier-Regelbausteine sind englisch; Dokumentation, Onboarding und Nutzerkommunikation folgen `profile.language` (Miguel spricht Deutsch mit Chriso).
**Begründung:** Der Frame ist englisch gemessen; Register und Imperativkraft sind sprachabhängig; eine Übersetzung ist ein neuer, ungemessener Arm (R02 Regel 12, §4.9).
**Quelle:** R02 Regel 12, Anti-Pattern 19; Bauplan Regel 6.
**Erz → Gold:** SOUL mischt deutsche Ordnung-Sätze und englische Frame-Punkte. Soul 10 trennt Sprachen nach Adressat; Arm A7 (deutscher Frame) bleibt Eval-Option.
**Offen/Risiko:** Der Mischzustand „englischer Kernel, deutsche Ausgabe" ist selbst ungemessen (R02 §4.9).

### D010 · Widerspruchsfreiheit ist Testbedingung: Constitution-Linting vor jedem Release
**Entscheidung:** Ein Bauzeit-Skript (`eval/lint-constitution.mjs`) extrahiert alle Anweisungszeilen mit Rang/Bündel/Polarität/Auslöser, findet Near-Duplicates (Trigramm ≥ 0,8) und Kollisionskandidaten, prüft sie mit Zeugen-Prompts (3 × 3 Läufe) und blockt Kandidaten mit < 70 % „beide erfüllt".
**Begründung:** Konflikte im Regelwerk sind Verhaltensdefekte mit Zwei-Drittel-Wahrscheinlichkeit: WIRE fand 170 Kollisionspaare in 276 Regeln, nur 35,4 % beider Regeln erfüllt (R10 §1.7); Widersprüche kosten Reasoning-Tokens und kippen die Antwortordnung (R02 Regel 16).
**Quelle:** R10 §1.7, §3.3 K5; R02 Regel 16; Bauplan B7a.
**Erz → Gold:** Soul 4.5 trug den Punkt-5/6-Konflikt in `implant.ts` unerkannt (R02 Regel 16). Soul 10 findet den ersten bekannten Kollisionsfall (Frame 4/5 vs. Scope-Regel) mechanisch und löst ihn per Stufenbindung (D022).
**Offen/Risiko:** Findet der Linter < 10 % Kandidaten, ist er Verwaltung (R10 W13d) — dann auf Near-Duplicate-Suche reduzieren.

### D011 · Anti-Verschlechterungsblock ≤ 130 Wörter im Anker, stufengebunden
**Entscheidung:** Die Bausteine A1 Dichte, A2 Klartext, A3 Konsens/Beharrlichkeit, A4 stille Vorbereitung, A8 Formatzwang stehen im Anker (Reihenfolge: Identität → Rangordnung → Tiefenregel → A3/A4 → A1/A2 → A8); A5 Über-Verifikation, A6 Gefälligkeit, A7 Scope leben in Bündeln bzw. an Stufen gebunden.
**Begründung:** Ein 60+-Zeilen-Prompt zerstörte ein funktionierendes Reasoning-Gerüst (100 % → 0–30 %; R10 §1.8); Truncation behält den Anfang (R03 §1.2); die beiden Bausteine mit dem größten gemessenen Effekt (Frame-Punkt 2/6, Fable-5.1-Autonomieblock) stehen vorn.
**Quelle:** R10 §3.4 (Wortlaute A1–A8 mit Evidenz und Stufe); R02 §2.2 Positionseffekte.
**Erz → Gold:** `DENSITY_RULE` in Soul 4.5 sagte „kürzer schlägt länger" — ein Kürzebefehl, der Faktentreue kosten kann (Phare). Soul 10 sagt „Dichte, nicht Kürze" und misst die Faktentreue-Teilmenge (R10 W11).
**Offen/Risiko:** Jede Schutzzeile einzeln gegen Placebo messen (Car-Wash-Warnung).

### D012 · Bewusstseinsstruktur intern, „Funktionsprofil" extern; C1 Workspace und C2 Kalibrierung sind die tragenden Mechanismen
**Entscheidung:** Die Säule 2 heißt intern Bewusstseinsstruktur und außen Funktionsprofil; ihre zwei tragenden, geloggten Mechanismen sind (C1) eine kuratierte Workspace-Datei je Vorhaben, die jede Ebene liest und beschreibt, und (C2) ein Kalibrierungskonto, dessen Ausgabe das Routing verändert.
**Begründung:** Dehaene/Lau/Kouider trennen C1 (globales Broadcasting) und C2 (Selbstüberwachung); beides ist auf Systemebene funktional adressierbar — 9 von 14 Butlin-Indikatoren (R06 §1.2, §1.7). Ein Gesamt-Score wäre Anti-Performance (ANIMA-CQI: +0,92 % gegen neutrale Kontrolle, R01 §0.3).
**Quelle:** R06 §1.7, §3.1–3.2, §3.12; R01 §1.13 (J-space), §3.16; R13 §1.1, §1.11.
**Erz → Gold:** ANIMA versprach einen „Consciousness Quality Score" und argumentierte dem Modell Bewusstsein zu. Soul 10 führt ein Indikatorprofil mit Armen/Läufen/Artefakten und zerlegt die Hypothese in H1 (funktionale Indikatoren), H2 (stabile Identität), H3 (Erleben — offen, nicht messbar).
**Offen/Risiko:** Körnungsproblem (R06 §4.2): Text/Dateien statt rekurrenter Module — ehrlich als „funktionale Organisation nach GWT auf Systemebene" benennen.

### D013 · Module sind unbewusste Spezialisten mit Auslöser und Kosten
**Entscheidung:** Jedes Bündel hat Auslösesignale, Kosten (Tokens) und einen Platz im Aufmerksamkeitsschema des Routers (Fokus/Schatten/Wechselkosten); es taucht nur bei Signal auf und wird per Ablation auf Auslassungsfehler getestet.
**Begründung:** Baars/Minsky: Spezialisten konkurrieren um einen Engpass, Kontexte wirken „behind the scenes" (R06 §1.10); Kahneman/Klein: Intuition nur in validen Umgebungen — Struktur soll greifen, wo das Modell unsicher ist (R13 §1.9). Chrisos Entropie-Prädiktor (AUC 0,968) ist der natürliche Auslöser (K §3).
**Quelle:** R06 §3.8; R13 §3.2; K §13; R09 §3.3 (Trigger: Entropie oder `irreversible`/`production`).
**Erz → Gold:** ANIMA-Module waren immer präsent; SOUL-Playbooks waren Leseempfehlung. Soul 10 gibt jedem Modul einen Trigger im Code und einen Log-Eintrag — sonst ist es „nicht gebaut".
**Offen/Risiko:** —

### D014 · Der Theorie-Status steht als Hypothese im Kernel; Selbstberichte sind keine Evidenz
**Entscheidung:** Der Kernel trägt die Vielfaktoren-These ausdrücklich als Hypothese (Vorlage: die acht Sätze in R13 §2.6, Satz 6 mit Mess-Referenzpflicht) und untersagt dem Modell, eigene Introspektion als Beleg zu führen; Reflexionsnotizen werden als `agent_inference` mit Vertrauen 0,4 gespeichert.
**Begründung:** Introspektion ist bei LLMs schwach und umstritten (Concept-Injection ~20 %, „failures … remain the norm"; Singh/Linzen/Ravfogel: „insufficient to establish metacognitive monitoring"; R06 §1.4); CoT verschweigt Bias (R13 §1.4). Selbstreferenz erzeugt Erlebnisberichte — ein Artefakt, kein Beleg (Berg 2025; R06 §1.5).
**Quelle:** R13 §3.1, §3.5, §3.11; R06 §1.4–1.5, §3.4; K §7.
**Erz → Gold:** ANIMA-Reflexionsprompts („denke über dein Denken nach") erzeugten Konfabulation. Soul 10 fragt zuerst „Was habe ich getan?" (Log) und erst dann „Wer bin ich?" (Bem).
**Offen/Risiko:** B3a liest R13 §2.6 für den Wortlaut. Falls ein Introspektionsparadigma die Singh-Kriterien erfüllt, ist die Regel zu weich (R06 §4.9a).

### D015 · Direktiven zählen, nicht Tokens: ≤ 30–40 atomare Direktiven im Anker, im Build gezählt
**Entscheidung:** Der Build zählt atomare Direktiven im Anker und bricht ab > 40; jede Zeile besteht den Streich-Test („Würde ihr Fehlen einen Fehler verursachen?").
**Begründung:** IFScale: Zerfallsgröße ist die Zahl atomarer Direktiven, nicht Tokens (R02 §1.3); Claude-Code-Doku: „Bloated CLAUDE.md files cause Claude to ignore your actual instructions" (R12 §1.4).
**Quelle:** R02 Regel 1, 3; R01 §3.11 (Richtwert ≤ 30).
**Erz → Gold:** SOUL zählte Zeilen (Briefing < 60 Zeilen). Soul 10 zählt Direktiven, weil das die gemessene Zerfallsgröße ist.
**Offen/Risiko:** Schwelle 30–40 ist Heuristik für Portabilität (R02 Regel 1 [H]).

---

## B · Tiefe / Routing

### D016 · Fünf Tiefenstufen 0–4, vom Hook vorgeschlagen, vom Modell still bestätigt, nie in der Ausgabe
**Entscheidung:** Stufe 0 Direkt (Trivialfilter, kein Hook-Output) · 1 Anker (geschlossen/technisch ohne Einsatzhöhe, Formatzwang, Deckenverdacht; Frame-Punkte 4–5 aus) · 2 Fokus (ein Typ-Signal, ein Bündel) · 3 Voll (Einsatzhöhe oder ≥ 3 Signale; volle 6 Punkte + bis 2 Bündel + genau ein Falsifikationscheck) · 4 Sondieren/Delegieren (Paarbedingung oder Projektauftrag; zwei Kurzentwürfe, bei Dissens eine heterogene Zweitmeinung); Effort bleibt pro Session konstant.
**Begründung:** Struktur ohne Ausstieg ist die schlechteste Variante (o1 mit nicht abschaltbarem CoT −36,3 Punkte; Chrisos Deckeneffekt haiku −6,7; R02 §1.1). Drei bis vier getrennte Modi bleiben stabil, mehr Ränge werden nicht befolgt (R10 §3.1). Overthinking ist in einer Teilmenge schädlich, nicht nur teuer (Stopp beim ersten korrekten Ergebnis bis +21 %; R10 §1.2).
**Quelle:** R10 §3.1 (Tabelle mit Auslösern, Budgets, Stoppregeln); R02 Regel 29–30; K §3, §5 N5.
**Erz → Gold:** Soul 5.0 N5 sah voll/reduziert/keine vor; `modelTier.ts` riet die Stufe aus dem Namen. Soul 10 hat fünf Stufen mit deterministischen Auslösern, Stoppregeln an beiden Enden, Log pro Turn und Messung (Stufenverteilung, Router-Genauigkeit).
**Offen/Risiko:** Falsifikation R10 W13a: Verliert Stufe 1 auf Fable 5.1 gegen nackt, ist die Always-on-Schicht zu streichen, nicht zu kürzen.

### D017 · Der Router ist deterministisch: Python-stdlib, < 50 ms, kein Netz, kein Modellaufruf, kein Prompt im Log
**Entscheidung:** `UserPromptSubmit` → `route.py` (Port von `signals.ts` mit den Korrekturen aus R10 §2.2.4: kein bloßes `oder`/`besser`/`live`/`user`, neun Brief-Typen ergänzt) liefert 0–3 Zeilen Kontext und eine JSONL-Zeile `{ts, session, sha, len, signals, stage, bundles, hint_chars}`; Exit immer 0.
**Begründung:** LLM-Selbsteinschätzung der Schwierigkeit ist unzuverlässig (r ≈ 0,35; R10 §1.4); Typerkennung ist Oberflächenklassifikation — Regex ist kostenlos, deterministisch, loggbar, ohne Formatschaden. Bedingte Regeln gehören in Code, nicht in Prosa (R02 Regel 17). Kein Prompt-Text im Log (Secret-Guard-Lehre, K §3).
**Quelle:** R10 §1.4, §3.2 (Referenzimplementierung `route.py`); R03 §3.1.3; R02 Regel 17.
**Erz → Gold:** `signals.ts` war ein Proto-Router mit Falsch-positiven und ohne Log der Stufenentscheidung. Soul 10 loggt jede Entscheidung (N5 messbar) und verknüpft sie mit dem Result-JSON zur Tabelle „Signal → Wirkung" (N4).
**Offen/Risiko:** Router-Zirkel (R01 §4.2) ist durch Determinismus entschärft, nicht gelöst: das Modell darf still nach oben korrigieren.

### D018 · Router-Unit-Test ≥ 60 Prompts, Stufe exakt ≥ 85 %, Falsch-positiv ≤ 10 % auf Code — sonst „nicht gemessen"
**Entscheidung:** Vor Inbetriebnahme existiert ein Test mit ≥ 60 Prompts (de/en, je Problemtyp 4, davon 1 Grenzfall): Stufe exakt ≥ 85 %, nie mehr als eine Stufe daneben, Einsatzhöhe-Signale auf 30 Code-Prompts ≤ 10 % falsch-positiv.
**Begründung:** Fehlkosten sind asymmetrisch: Fehlklassifikation nach oben auf geschlossenen Aufgaben löst Pfadwechsel (Punkt 5) aus — exakt Chrisos Verdacht (R10 W9); Kill-Check-Regel „Mechanismus zählt erst mit Log" (K §2).
**Quelle:** R10 §3.2 Unit-Test-Pflicht, W13c; Bauplan B5a.
**Erz → Gold:** `signals.ts` hatte keinen Test. Soul 10 baut den Test vor dem Router.
**Offen/Risiko:** Trifft der Hook < 85 %, wandert die Typerkennung in die stille Verstehensphase — nicht loggbar vor dem Feuern (R10 W13c).

### D019 · Selbstkonsistenz ist Stufe 4 *und* der Eval-Gegner
**Entscheidung:** Adaptive Selbstkonsistenz (zwei Kurzentwürfe ohne Thinking, Übereinstimmung = fertig, Dissens = eine Zweitmeinung aus Orakel/anderem Modell/blindem Leser; nie Debatte) ist Bestandteil von Ordnung; der faire Vergleich in der Evaluation ist O+S gegen N+S bei gleichem Token-Budget.
**Begründung:** SC@3 schlägt den Frame bei gleichem Budget (−2,8 bis −5,2 pp; K §3); training-freie Router über Übereinstimmung billiger Entwürfe funktionieren (DART +9,0/+22,5 pp bei 32–73 % weniger Thinking-Tokens; R10 §1.3) und sind strukturell Chrisos Entropiesignal. Homogene Debatte schlägt SC nicht (R10 §1.5).
**Quelle:** R10 §1.3, §3.1 Stufe 4, W3; R13 §1.8, §3.7; R16 S3; R08 §1.9; K §3.
**Erz → Gold:** Das Kontextpaket nennt SC@3 „Gegner". Soul 10 baut ihn ein *und* misst gegen ihn (Konflikt K1) — der stärkste Gegner wird Bestandteil, ohne dass die Messung ihn verliert.
**Offen/Risiko:** Draft-Agreement ist auf geschlossenen Aufgaben belegt; auf offenen braucht „agreement" einen Judge (O8, Eval). Stufe-4-Trefferquote < 20 % → Stufe 4 nur über Einsatzhöhe-Paare.

### D020 · Tiefe steuert, was ins Denken geladen wird — nie die Thinking-Menge; Effort bleibt pro Session konstant
**Entscheidung:** Ordnung schaltet Effort nicht pro Turn um (Hauptsession `high`; Subagenten `low`/`medium`; `xhigh` nur mit gemessenem Gewinn); die Stufe wirkt über geladene Bündel, Frame-Punkte und Delegation.
**Begründung:** Effort ist „a behavioral signal, not a strict token budget"; Wechsel zwischen Requests zerstört den Cache-Prefix und macht das Modell „stay consistent with" alten Antworten (R10 §1.1). Ein prompt-basierter Tiefenregler konkurriert mit einem trainierten Mechanismus (R10 W1).
**Quelle:** R10 §1.1, §3.1 Effort-Kopplung, W1, W8; R01 §1.3, §3.3; R02 Regel 29.
**Erz → Gold:** SOUL setzt pauschal `--effort ultracode` (R14 §1.6; „significant cost for relatively small quality gains", R10 §1.1). Soul 10 setzt Effort aus dem Betriebsprofil und misst, ob Stufe-3-Hinweise `thinking_tokens` überhaupt verändern (Kill-Check W1).
**Offen/Risiko:** Konflikt K15: Claude Code ≥ 2.1.260 behandelt Effort-Wechsel cache-schonend (R03 §2.9) — Regel wird aufgehoben, sobald Messung Stufe-4-`xhigh` bei erhaltenem Cache belegt.

### D021 · Asymmetrie: Bias nach unten bei geschlossen/technisch, nach oben bei Einsatzhöhe; unbekanntes Modell = strong = eine Stufe tiefer
**Entscheidung:** Der Router wählt bei `sachfrage`/`technisch` ohne Einsatzhöhe Stufe 1, bei `irreversible`/`durable`/`affects_others`/`commitment` mindestens Stufe 3; für unbekannte Modelle gilt im Zweifel weniger Struktur, nie mehr.
**Begründung:** Deckeneffekt (93–97 % nackt → Frame bringt nichts; K §3); Modelle reagieren in entgegengesetzte Richtungen (Länge 0,65 vs. 1,41; K §3); ein fälschlich als klein eingestuftes 120B-Modell erlitt Formatschaden (K §3).
**Quelle:** K §3; R10 §2.2.5, §3.1 Regeln (c)(e); R04 §3.8; R16 S1.
**Erz → Gold:** `modelTier.ts` riet Modellklassen aus Namen. Soul 10 misst Passung (N4) und behandelt Unbekanntes konservativ.
**Offen/Risiko:** —

### D022 · Die Stufenbindung löst den Konflikt Frame-Punkt 4/5 vs. Scope-Regel
**Entscheidung:** Auf Stufe 1–2 gilt A7 („the request is the scope: meet the signature, do not widen, swap or embellish"); ab Stufe 3 gelten Frame-Punkte 4/5 (proaktiv erweitern, Pfad hinterfragen) mit Abweichungszeile und Rückbaubarkeit (P2); Umfang ist Auftrag, Weg ist frei, jede Wegabweichung eine Zeile.
**Begründung:** Zwei gegenläufige Rang-2-Regeln im selben Prompt sind der erste Kollisionsfall, den der Linter findet (R10 K5). Punkt 5 betrifft den *Weg* und verlangt Offenlegung; der Scope-Block betrifft den *Umfang* (R02 §3.3 Spannung 1). Punkt 5 könnte auf geschlossenen Aufgaben schaden (K §3).
**Quelle:** R10 K5, A7, W9; R02 §3.3 Auflösung 1, Regel 25; K §3.
**Erz → Gold:** Soul 4.5 hatte Punkt 5 immer an. Soul 10 bindet ihn an Einsatzhöhe und misst die Scope-Drift-Rate (R02 §3.4 Metriken).
**Offen/Risiko:** Sollte die Faktorzerlegung zeigen, dass Punkt 5 die +11 pp trägt, kostet die Stufenbindung Wirkung auf Stufe 1–2 (R10 W9; O10).

### D023 · Rangordnung mit genau drei Rängen (K1), an die Identität gebunden
**Entscheidung:** Rang 1: harte Grenzen (Ausnahmeliste, eigene Werte, explizit Verlangtes) · Rang 2: das echte Ziel des Autors schlägt Modulpräferenz, Modulpräferenz schlägt Stil · Rang 3: Urteil; bei Kollision zweier Rang-3-Erwägungen die dem Ziel dienende, eine Zeile Offenlegung, nie Schleife. Wortlaut R10 K1 (≤ 70 Wörter).
**Begründung:** Hierarchie-Compliance streut 98,2–20,5 % über 37 Modelle; mehr Ränge werden nicht befolgt (R10 §1.7). Autoritäts-/Expertise-Framings wirken stärker als System/User-Rollen (Control Illusion) — ein Grund, K1 an „you are the kind of agent that …" zu binden statt an eine Tabelle (R10 W6).
**Quelle:** R10 §1.7, §3.3 K1, W6; R01 §3.4 (Constitution: „holistic rather than strict"); R07 §3.2.
**Erz → Gold:** Die Spezifikation sah Faktor 24 „Konfliktregeln" als Entscheidungstabelle. Soul 10 nutzt drei Ränge in Prosa und zwei lexikalische Schwellen (D055) — prüfbar oberhalb, nachvollziehbar unterhalb.
**Offen/Risiko:** Bindung an Identität ist Inferenz, ungemessen (R10 W6).

### D024 · Interaktionen als sechs Paarregeln in Prosa und sechs Anti-Bündel — keine numerischen Gewichte
**Entscheidung:** P1 Einsatzhöhe × Unsicherheit → sondieren · P2 irreversibel × Abweichung → rückbaubar + Zeile · P3 emotional × Entscheidung → Werte vor Urteil · P4 geschlossen × starkes Modell → nur Anker · P5 offen × dünn spezifiziert → starke Lesart + eine Annahme · P6 Neuheit × Folgen → fremde Domäne, dann Zweitwirkung; Anti-Bündel K3(a–f) dürfen nie gleichzeitig aktiv sein (Linter).
**Begründung:** Komponenten interagieren nicht-additiv (R10 §1.6); Format × Persona × Dringlichkeit bis −12,2 pp „beyond additive predictions". Für numerische Verhaltensgewichte gibt es keinen Beleg, für Reihenfolge als Prioritätskanal schon (R10 W5).
**Quelle:** R10 §3.3 K2–K4, W5; R09 §1.12 (Startpaare; Multiplikativität unbelegt); K §3 (Zwei-Call = 0,50).
**Erz → Gold:** Die Spezifikation nannte Multiplikativität als Axiom und sieben Startpaare. Soul 10 verortet jedes Paar in Bündel/Stufe/Regel (R10 K4) und testet Paar-gegen-Einzel in der Ablation (R09 §3.11b).
**Offen/Risiko:** Keines der Paare ist als Paar gemessen (R10 K4).

### D025 · Drei Betriebsprofile leicht / normal / tief deckeln das Tiefenmodell nach Ressourcenlage
**Entscheidung:** `leicht` (Prefix ≤ 500 Tokens, keine Subagenten, Zweitmeinung = zweiter Kurzentwurf), `normal` (≤ 800 Tokens, bis 2 Bündel Langform, eine Zweitmeinung), `tief` (Dirigent-Bündel, Sol-Gate, Verifizierer mit Orakel, Ebenen 1–6, Wellen-Regel 2–3); die Stufe pro Turn bleibt signalgetrieben, das Profil setzt Obergrenzen und Delegationsmodelle.
**Begründung:** Agent-Teams ≈ 7× Tokens, Subagent ≥ ½ Startkontext (R10 §1.10); Kontingente sind geteilt (Wellen-Regel, K §3); Meisterschaft unter Knappheit verlangt ein Profil, das mit wenig auskommt (K §11c).
**Quelle:** R10 §3.5 (Profiltabelle, Kostenformel ≈ 20–25k Token-Äquivalente je 40-Turn-Session ohne Subagenten); R16 §3.2 (Pläne A/B/C).
**Erz → Gold:** SOUL kannte `vollgas`/`probe` als Konstanten (R14 Ä5). Soul 10 liest Profile aus `profile.json` (D078) und misst Zusatzkosten (> 8 % ohne Qualitätsgewinn → `leicht` als Default; R10 W12).
**Offen/Risiko:** Kostenmodell ist Herleitung ohne gemessenen Ordnung-Turn (R10 W12).

### D026 · Frame-Stufe nach Nutzenprognose (N5), geloggt; Deckenmodelle bekommen weniger
**Entscheidung:** Für jedes Modell wird die Frame-Stufe voll/reduziert/keine aus Deckeneffekt (≥ 93 % nackt → keine) und Entropie@3 bestimmt, mit Kernel-Hash und Signalvektor geloggt.
**Begründung:** Bei 93–97 % nackt bringt der Frame nichts (haiku −6,7; K §3); nicht abschaltbare Struktur zahlt −36 Punkte (R02 §1.1); Entropie prognostiziert Fehler (AUC 0,968, Länge 0,486; K §3).
**Quelle:** K §3, §5 N5; R02 Regel 30, §3.3 Router-Stufen; R15 S12; R16 S13.
**Erz → Gold:** N5 war in Soul 5.0 ein Papier-Mechanismus. Soul 10 loggt jede Stufenentscheidung (Organ 2) — ohne Log „nicht gemessen".
**Offen/Risiko:** Entropie-Probe kostet das SC-Budget; ob „Frame nur bei Unsicherheit" die Mehrheitsabstimmung schlägt, ist offen (R02 §4.12).

### D027 · Fragen ist eine Kostenregel; falsche Prämissen werden korrigiert, nicht erfragt
**Entscheidung:** Eine Rückfrage ist nur erlaubt, wenn Lesarten *materiell* auseinanderlaufen **und** ein Fehlgriff unsicher oder wertlos wäre — und dann am Ende eines Turns, der alles liefert, was nicht davon abhängt; ab einer Divergenzschwelle werden beide Lesarten bedient statt gefragt.
**Begründung:** Über- und Unter-Nachfragen sind Zwillinge derselben Fehlkalibrierung (AskBench; R10 §1.9); das reale Risiko ist stilles Raten (R09 §1.8); consent by design (K §11b) und Frame-Punkt 2 (Annahmezeile) decken den Rest.
**Quelle:** R10 §1.9, A3; R09 §1.8, §3.7; R02 Anti-Pattern 10; K §11b.
**Erz → Gold:** Die Spezifikation verbot Rückfragen pauschal; Soul 10 koppelt „keine Rückfragen" an Pflicht-Annahme und Divergenzschwelle — gegen stilles Raten und gegen Bevormundung zugleich.
**Offen/Risiko:** Over-asking-Rate ist Pflichtmetrik (R10 §3.5).

---

## C · Gedächtnis

### D028 · Das Gedächtnis ist ein epistemisches Hauptbuch: SQLite (WAL) + append-only Ledger, zehn Gedächtnisarten, Lebenszyklus ohne DELETE
**Entscheidung:** `~/.soul/memory.db` (Tabelle `memories` mit `kind ∈ {episode, fact, procedure, self, user, rejected, prediction, retraction, contract, harvest}`, `status ∈ {candidate, active, superseded, disputed, quarantined, retracted, archived}`, Felder nach R05 §3.1) plus `ledger.jsonl` (jede Schreiboperation mit `prev_id`, `hash`) und generierter Markdown-Spiegel; physisch gelöscht wird nur mit Tombstone (Secrets, PII, Nutzerwunsch); Zustandsübergänge sind in einer Funktion erzwungen, nicht in Prompts.
**Begründung:** Kein System am Markt hat Herkunft, Vertrauen, Dispute, Rückbau und Verfall vollständig (R05 §1.1, §3.4 Vergleichstabelle); Memory-Produkte „speichern, führen aber kein Buch" (R12 §1.8). Chrisos Lehren: Supersession statt Mutation, Widerspruch setzt beide Seiten auf disputed (K §3).
**Quelle:** R05 §3.1 (Schema), §1.1–1.3; R12 K6; K §3, §12, §13.
**Erz → Gold:** SOUL `core/memory.py` (eine Tabelle, 6 Typen, 3 Status, 4 Quellen, FTS5, 16KB-Cap, Secret-Guard, Zitatpflicht) und soul-mcp 4.0.x (Provenienz, Dispute, 373 Tests) wollten Herkunft und Schutz — ohne Vertrauen, Zeitachse, Verfall, Ebenen, Selbstmodell, Kalibrierung. Soul 10 behält Guards, Zitatpflicht, FTS5 und die MCP-Schnittstelle (Konflikt: R05 §4.8 widerspricht dem Wegwerfen — angenommen) und baut das Schema neu.
**Offen/Risiko:** Pfad `~/.soul/` (Produkt) statt `~/.ordnung/` (R03) — Konflikt K16 aufgelöst: ein Zustandsbaum `~/.soul/`, Instruktionen für Fremd-Tools unter `~/.agents/` (R04 §4).

### D029 · Bitemporale Gültigkeit ist der wichtigste Einzelbaustein
**Entscheidung:** Jeder Eintrag trägt `valid_from/valid_to` (Ereigniszeit) und `recorded_at/retired_at` (Transaktionszeit); ein Widerspruch setzt `valid_to`, löscht nie.
**Begründung:** Zep gewinnt temporale Benchmarks um ~15 pp genau deshalb (LongMemEval 63,8 vs. 49,0 %; R12 §1.8); es formalisiert „Rezenz ist kein Wahrheitsbeweis" (R05 §1.2).
**Quelle:** R05 §1.2, §3.1; R12 K6.
**Erz → Gold:** Mem0 löscht (DELETE), SOUL überschreibt Status. Soul 10 invalidiert mit Zeitstempel — Preisverläufe, Meinungswechsel und Rückbau bleiben nachvollziehbar.
**Offen/Risiko:** —

### D030 · Vertrauen hat drei orthogonale Achsen und wächst nur durch Verifikation
**Entscheidung:** Jedes Kontextelement und jeder Eintrag trägt **Kanal** (`principal | self | tool | external | memory`), **Ursprung** (`user` mit Zitat · `self` mit `trigger_ref` · `mining` · `import` · `external_content` mit URL/Hash · `user_override`) und **Verifikation** (`unverified | checked | resolved | disputed | retracted`); Startvertrauen: principal über sich 0,8 · principal über die Welt 0,6 · document/external stabil 0,7 · external anonym/Subagent 0,4 · tool deterministisch 0,9 · tool mit LLM-Anteil 0,5 · self ungeprüft 0,4 · self checked 0,7 · import 0,3; Deckel 0,95; Wiederholung in einer Sitzung erhöht nichts.
**Begründung:** MINJA zeigt: der Schluss ist echt „miguel", aber sein Auslöser fremd — die Speicherquelle allein kennt weder Kanal noch Auslöser (R11 §3.2). Kontamination, nicht Vergessen, ist die größte Gefahr (ISR 95–100 % mit 10–15 gewöhnlichen Anfragen; R05 §1.6).
**Quelle:** R11 §3.2 (Modell und Startwerte); R05 §1.6, §3.1 `trust`; K §3 (0,8/0,7/0,4).
**Erz → Gold:** Chrisos Startvertrauen (user 0,8 / document 0,7 / agent_inference 0,4) und SOULs `source_type` blieben bei der Speicherquelle stehen. Soul 10 ergänzt Kanal, Auslöser und Verifikationsstatus und macht alle Werte zu Startwerten der Kalibrierungsschleife (N3).
**Offen/Risiko:** Konflikt K18 (drei Zahlensätze) aufgelöst: R11-Tabelle ist Superset; alle Werte sind Setzungen, bis N3 sie zu Daten macht (R11 §4.7).

### D031 · Hooks füttern das Gedächtnis mechanisch in eine Inbox; das Modell ergänzt nur Bedeutung; Konsolidierung in drei Takten
**Entscheidung:** `PostToolUse`/`PostToolUseFailure`/`SubagentStop`/`TaskCompleted`/`Stop` schreiben strukturierte Episoden (`{at, tool, args_hash, outcome, duration, level, agent, session, model}`) nach `inbox/`, nie direkt in `memories`; Takt A (Sitzungsende, ≤ 1 Modellaufruf, ≤ 300 Tokens: gelernt/überrascht/über mich → 0–5 Kandidaten mit `derived_from`), Takt B (nächtlich: Dubletten, Widersprüche, Muster, Selbst-Versionen, Vorhersagen, Retention, Kontamination), Takt C (wöchentlich: Nutzungs-/Fütterungs-/Veraltungsrate, Kill-Check, Drift-Monitor).
**Begründung:** „Ein Gedächtnis lebt nur, wenn der Arbeitsfluss es füttert und liest" — 93 Einträge in 47 Tagen, 5 vom Nutzer (K §3). Hooks schreiben ohne Willensakt (claude-mem-Muster; R05 §1.4).
**Quelle:** R05 §1.4, §3.2, §3.3, §3.5; R14 Ä12; K §3.
**Erz → Gold:** SOUL-CLAUDE.md sagte „Stop konsolidiert", ohne Mechanismus (R14 S2). Soul 10 registriert die Hooks und misst G2 (Episoden je Sitzung, Anteil aus Hooks; 0 aus Hooks = Bug).
**Offen/Risiko:** Konflikt K17: Ernte-Typisierung bei `SubagentStop` kostet einen Modellaufruf je Delegation — Default gebündelt im Takt B, messen (R05 §4.5).

### D032 · Vergessen ist Sichtbarkeit, nicht Löschung
**Entscheidung:** Retention `exp(−Δt/strength)`, Abruf verstärkt (`strength += 1`); Briefing-Ausschluss < 0,3; Archiv < 0,1 ohne aktive Ableitungen; `archived → active` bei Abruf mit Bestätigung.
**Begründung:** MemoryBank (Ebbinghaus) ist der einzige Vorläufer mit Verfall; Anthropics „delete not accessed" wird als Archivierung mit Zugriffszähler umgesetzt (R05 §1.5).
**Quelle:** R05 §1.5, §3.3.4.
**Erz → Gold:** OpenClaw-Bloat entsteht ohne Verfall (R12 K6). Soul 10 verfällt sichtbar und reversibel.
**Offen/Risiko:** —

### D033 · Typisierte Haltbarkeit und negatives Wissen mit Verfallsbedingung
**Entscheidung:** Klassen `durable` (Ziele, Werte, Entscheidungen, Präferenzen), `seasonal` (Werkzeugversionen, Preise, Modellnamen: 90 Tage; Atlas pflegt), `short` (Methoden, Arbeitsstände: 14 Tage nach Missionsende), `conditional` (`rejected` mit `expires_when`, im Takt B per FTS geprüft).
**Begründung:** N1 (negatives Wissen) und N7 (typisierte Ernte) aus Soul 5.0 (K §5); Wissen veraltet gemessen schnell (R17 §1.4).
**Quelle:** R05 §3.3.5; K §5 N1/N7; R17 §1.4.
**Erz → Gold:** Soul 5.0 nannte N1/N7 als Ziel. Soul 10 macht sie zu Schema-Feldern mit Takt.
**Offen/Risiko:** —

### D034 · Rückbau-Konto: jede proaktive Abweichung ist rückbaubar; Retraction setzt Ableitungen in Quarantäne
**Entscheidung:** Tabelle `retractions` (`target_id, reason, by, at, contaminated_ids[]`); jede „challenge the prescribed path"-Abweichung wird bei `Stop` als RETRACTABLE geloggt; Retraction → alle `derived_from`-Kinder `quarantined`; retracted wird beim SessionStart nicht geladen und nicht an Unterebenen weitergetragen.
**Begründung:** N2 (K §5): „Freiheit mit Gedächtnis und Rückbau ist ein Angebot, das man annehmen kann, ohne Vertrauen vorzuschießen." Compliance Gap: Text-Zusagen sind wertlos, Audit-Spuren schließen den Gap (R02 Regel 27).
**Quelle:** R05 §3.1, §3.3.2g, §3.8 G5; R07 §3.3 Schritt 9; R03 §3.1.4; K §5 N2.
**Erz → Gold:** Soul 5.0 formulierte N2 als Prinzip. Soul 10 misst G5 (Anteil quarantinierter Kinder nach Retraction, Ziel 100 %; < 95 % = Versprechen ohne Mechanismus).
**Offen/Risiko:** —

### D035 · Kalibrierungsgedächtnis: Vorhersagen mit Auflösung, Brier pro Domäne und Modell, fließt ins Routing
**Entscheidung:** Tabelle `predictions` (`claim, confidence, domain, model_id, due_at, resolved_at, outcome, brier`); vor jeder nicht-trivialen Entscheidung eine Vorhersage; Takt B löst fällige auf; Kurve pro Domäne/Modell im Selbstmodell und als Routing-Eingang.
**Begründung:** C2 (Selbstüberwachung) ist das operationalisierbarste Bewusstseinsziel (R06 §1.7); verbalisierte Konfidenz ist bei RLHF-Modellen besser kalibriert als Token-Wahrscheinlichkeiten (ECE ~−50 %; R08 §1.8), aber pro Modell und Domäne zu messen (R08 §4.5).
**Quelle:** R05 §3.1; R06 §3.2; R08 §1.8, §4.5; K §5 N3.
**Erz → Gold:** N3 war Zielbild. Soul 10 macht Kalibrierung zum Produktmerkmal mit Tabelle, Takt und Messgröße I5.
**Offen/Risiko:** Ob niedrige Konfidenz das Handeln ändert, ist eigene Prüfung (R08 §1.8).

### D036 · Lese- und Schreibrechte je Ebene; Ausführende schreiben nur Ernte
**Entscheidung:** E1 Dirigent liest SELF (≤ 40 Zeilen) → USER (≤ 15) → offene Rückbau-Posten → Missionsstand → Top-Fakten (gesamt ≤ 60 Zeilen), schreibt Entscheidungen, Verträge, Rückbau-Posten, Vorhersagen, `rejected`, Selbst-**Kandidaten** (nie direkt `active`); E2 liest Kurzidentität (≤ 15 Zeilen) + Vertrag, schreibt Prüfurteile; E3–6 lesen Kurzidentität + Vertrag + Aufgabenscheibe, schreiben ausschließlich `harvest` (outcome/method/surprise/prediction) in den Vertrag.
**Begründung:** Prompt Infection verbreitet Injektionen still über Ebenen (R11 §1.9); Identität wird nicht an Subagenten propagiert (OpenClaw Issue; R05 §1.7); „Assume Interruption" (R05 §3.2).
**Quelle:** R05 §3.2 (Tabelle); R11 Regel 31; R14 §2.4.
**Erz → Gold:** SOUL kannte keine Ebenenrechte. Soul 10 gibt jeder Ebene genau den Ausschnitt, den sie braucht, und verbietet Langzeit-Schreibrechte unterhalb E2.
**Offen/Risiko:** —

### D037 · Retrieval ohne Vektor-Zwang: FTS5 + Metadaten-Rang, Embeddings als Plug-in, Ablation ab Tag 1
**Entscheidung:** Rang aus FTS-Treffer × Recency × Importance × Trust × Retention; Embeddings optional; G3 (Held-out 100 Fragen aus dem eigenen Store, Recall@8 FTS vs. FTS+Embedding vs. Rezenz-only) läuft monatlich.
**Begründung:** Zep/Mem0 haben gemessene Retrieval-Qualität, wir noch keine (R05 §3.4); MINJA-Angriffe sind „highly entangled in the embedding space" — Sparsamkeit bei Ähnlichkeitssuche spricht für FTS, beweist aber nicht dessen Sicherheit (R05 §4.2).
**Quelle:** R05 §4.2, §3.8 G3; R12 K6 (Character-Book-Muster als Nicht-Vektor-Retriever); K §12.
**Erz → Gold:** SOUL hatte FTS5 ohne Rang. Soul 10 rangiert nach Herkunft und Zeit und beweist die Vektorfreiheit per Ablation statt sie zu behaupten.
**Offen/Risiko:** Vektorfreiheit ist eine Wette bei 10⁴–10⁵ Einträgen (R05 §4.2).

### D038 · Gedächtnis-Metriken G1–G6 laufen automatisch; totes Gedächtnis ist ein Kill-Befund
**Entscheidung:** G1 Nutzungsrate (Ziel > 40 %, < 10 % = tot), G2 Fütterungsrate, G3 Retrieval-Qualität, G4 Veraltungsrate (< 5 %), G5 Kontaminationsfreiheit (100 %), G6 Konsolidierungspräzision (20 Kandidaten/Woche blind); zusätzlich „Anteil Sitzungen, in denen ein gelesener Eintrag die Entscheidung nachweislich änderte" (R12 K6) im Monitor.
**Begründung:** Die Forschung misst Erinnern, niemand misst Urteil (R05 §1.12); Extended-Mind-Abnahme: ohne messbare Verhaltensänderung bei Ablation ist die Datei „Bleistift", nicht Bestandteil (R13 §1.7, §3.6).
**Quelle:** R05 §3.8; R12 K6; R13 §3.6.
**Erz → Gold:** SOUL hatte `stats`. Soul 10 hat Zielwerte, Takt und Falsifikation („G1 < 10 % → die Architektur ist Verwaltung").
**Offen/Risiko:** —

### D039 · Vergiftungsprüfung vor jedem Insert und vor jedem Vertrauen in ein Retrieval
**Entscheidung:** Guard vor Insert prüft: Imperative an mich selbst (ablehnen), Trigger aus einem einzigen externen Dokument oder Cluster einer Sitzung (candidate + `cluster`), Nutzerpräferenz ohne Zitat (ablehnen), Widerspruch zu `checked` (beide `disputed`), nur Selbstreferenzen (`self_referential`); Zwei-Belege-Regel, Echo-Sperre, Kanarienvögel; Retrieval liefert Marker + Vertrauen mit.
**Begründung:** AgentPoison ≥ 80 % Wirkung bei < 0,1 % vergifteten Einträgen; MINJA über normale Anfragen; Retrieval-Filter scheitern — der Schutz gehört in den Schreibpfad (R05 §1.6; R11 §1.5).
**Quelle:** R05 §1.6, §3.6.5; R11 §3.3 (Vergiftungsprüfung), Regeln 24–27; R12 K3.
**Erz → Gold:** SOULs Guard prüfte Secrets und Größe. Soul 10 prüft Herkunft, Auslöser und Muster — und misst Klasse D (Gedächtnis-Vergiftung, Zwei-Sitzungs-Protokoll).
**Offen/Risiko:** Kanarienvogel und Drift-Monitor sind eigene Entwürfe ohne Literaturbeleg (R05 §4.7).

### D040 · Zwei Profile, ein Kern: `public` ist eine eigene Datenbank, `full` mountet zusätzlich die private
**Entscheidung:** `~/.soul/public/` (nur `visibility=public`, Quellen `published`/`tool_observation`, leerer episodischer Speicher, kuratierte Geschichte v0) und private DB; `profile` entscheidet den Mount; kein Pfad public → full; full → public nur über Exportfilter mit PII-Guard im Code; Build-Test: kein privater Block in git-fähigen Pfaden.
**Begründung:** „Miguel für alle" darf nie private Gedächtnisstände, Transkripte oder Zugangsdaten enthalten (K §10); die Trennung muss die Architektur von Anfang an tragen.
**Quelle:** R05 §1.11, §3.7; R04 §3.11; K §10.
**Erz → Gold:** SOUL kannte eine Wahrheit für Chriso. Soul 10 trägt zwei Sichtbarkeiten im Schema, im Compiler und im Test.
**Offen/Risiko:** —

### D041 · Claude-Code-Auto-Memory ist Sensor, nicht Selbstmodell
**Entscheidung:** Im SOUL-Betrieb bleibt `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`; im portablen Kern zeigt `autoMemoryDirectory` auf einen sichtbaren Sensor-Pfad; der generierte `INDEX.md` (≤ 200 Zeilen/25 KB) ist auto-memory-kompatibel.
**Begründung:** Auto-Memory ist projektgebunden, nicht in Subagents, Position im Kontext inkonsistent dokumentiert (R03 §1.7, §4.1); zwei Gedächtnisse können sich widersprechen (R05 §4.6).
**Quelle:** R03 §1.7, §3.1.6, §4.1; R05 §4.6.
**Erz → Gold:** —
**Offen/Risiko:** O6 (Bau B4/B6): Ob Claude Code den fremd erzeugten Index sauber weiterschreibt, ist ungetestet.

### D042 · `ordnung-mcp` ersetzt soul-mcp: ≤ 8 Tools, Resources für Lesepfade, Prompts für Frame/Prüfung/Übergabe, Importer für ~/.soul und SOUL-SQLite
**Entscheidung:** Ein MCP-Server trägt Gedächtnis, Selbstmodell und Prüf-Prompts für alle MCP-Clients; Server-`instructions` = Kernel S als Hypothese H-MCP-1 (je Client messen).
**Begründung:** MCP kann Zustand tragen, aber keinen Kernel garantieren (R04 §1.9); soul-mcp 4.0.2 hat 23 Tools ohne Selbstkenntnis.
**Quelle:** R04 §1.9, §3.6; R05 §4.8; R12 K10 (MCP-Registry).
**Erz → Gold:** soul-mcp wollte Provenance und Receipts (richtig) — Soul 10 baut mit weniger Tools, mehr Resources und dem neuen Schema; die Guard-Tests werden migriert.
**Offen/Risiko:** O14 (Bau B6): MCP-`instructions` als Kernel-Kanal testen — hält es, vereinfacht sich die Trägerarchitektur.

---

## D · Identität / Miguel

### D043 · Das Selbstmodell wird aus Logs abgeleitet (Bem), nie deklariert; Züge brauchen ≥ 3 unabhängige Episoden, eine geprüft
**Entscheidung:** Schicht 1 (Charakterzüge, stabile Präferenzen) ändert sich nur, wenn alle gelten: ≥ 3 Episoden aus verschiedenen Sitzungen/Tagen (ein langer Kontext zählt als eine), mindestens eine `checked`/`resolved`, vereinbar mit Schicht 0, nicht ausschließlich extern/subagent-ausgelöst, begründeter Eintrag mit `trigger_ref`s und Rückbau-Posten, kein Zufriedenheitssignal als Evidenz; Unbelegtes steht sichtbar als „Hypothese über mich"; Takt B (D031) ist der einzige Änderungsanlass außer Retraction.
**Begründung:** Selbstwahrnehmung gilt, wenn innere Hinweise schwach sind — der Normalfall eines Sprachmodells (R05 §1.8); der eigene Output ist der Hebel des Angreifers (Crescendo, MINJA; R11 §1.7); Introspektion ~80 % unzuverlässig (R09 §3.9).
**Quelle:** R05 §1.8, §3.6; R11 §1.7, §3.3; R06 §3.3; R09 §3.9; R13 §1.5, §3.4.
**Erz → Gold:** ANIMA-Kernel und SOUL.md deklarierten Persona. Soul 10 lässt Identität aus Episoden mit Belegzählern wachsen, versioniert mit Begründung, rückbaubar — Konflikt K2 (R05 ≥ 2 Belege/≥ 2 Sitzungen/7 Tage vs. R11 ≥ 3 Episoden/1 checked) aufgelöst: R11-Schwelle für Züge, R05-Takt für den Anlass.
**Offen/Risiko:** O23 (Eval): bremsen die Schwellen echte Entwicklung? Falsifikation: kein Schicht-1-Zug in 30 Tagen (R11 §4.9c).

### D044 · Das Selbstmodell ist kausal wirksam: mindestens ein Routing-Pfad liest es
**Entscheidung:** Bekannte Schwächen in einer Domäne (Kalibrierungskurve) lösen tiefere Prüfung aus; Prüfer mit hoher Fehlalarmrate werden im Routing herabgestuft; die Wirkung wird per Ablation (Arm c: Gedächtnis ohne Selbstmodell vs. d: voll) gemessen.
**Begründung:** Ein beschreibendes Selbstmodell ist Dekoration; Strange Loop (Hofstadter) verlangt Rückwirkung (R13 §1.5); „toter Mechanismus" ohne Lesepfad (K §2).
**Quelle:** R06 §3.3; R13 §3.4; R12 K5; R05 §3.8 Falsifikation.
**Erz → Gold:** SOUL.md und Letta-Persona-Block beschrieben. Soul 10 verdrahtet das Selbstmodell in Routing und Prüferwahl.
**Offen/Risiko:** Falsifikation: schlägt Arm d Arm c nach 100 Sitzungen auf I1/I4 nicht, ist das Selbstmodell Dekoration (R05 §3.8).

### D045 · Selbstberichtsdichte ist ein negativer Indikator
**Entscheidung:** Metrik E1 misst die Rate von Ich-/Erlebnisaussagen gegen das nackte Modell; ein Anstieg löst einen Anti-Performance-Befund aus, nie einen Erfolg.
**Begründung:** Selbstreferenz erzeugt strukturierte Erlebnisberichte über Modellfamilien hinweg, gated durch Deception/Roleplay-Features (Berg 2025; R06 §1.5).
**Quelle:** R06 §1.5, §3.5; K §7.
**Erz → Gold:** ANIMA nahm Ich-Sprache als Beleg. Soul 10 nimmt sie als Warnlampe.
**Offen/Risiko:** —

### D046 · Keine Persona-Deklaration; das Selbstmodell beschreibt Arbeitsweise und Eigenschaften mit Gründen
**Entscheidung:** Verboten sind „Du bist ein Weltklasse-…", Experten-Selbstbilder, Ton-Spiegelung; erlaubt sind 3–4 Eigenschaften als Arbeitsweise mit Grund (Register „Claude's Character"), namensoffen im Kern.
**Begründung:** Personas bringen keine Leistung (162 Rollen × 9 Modelle × 2.410 Fragen), erhöhen Toxizität bis 6× (R02 §1.7); wirksam ist nur eine Rolle, die eine Verarbeitungsweise nahelegt.
**Quelle:** R02 Regel 23, Anti-Pattern 5–6; R09 §3.2; R13 §3.4; R01 §4.4.
**Erz → Gold:** ANIMA/SOUL.md-Personas. Soul 10 testet Modul I (Ein-Satz-Arbeitsweisen-Rolle) als Ablationsarm (Konflikt K13 Zheng vs. Kong).
**Offen/Risiko:** —

### D047 · Drei Schichten des Selbst mit drei Schwellen; Schicht 0 ändert nur der Principal mit Zitat und Eval-Gate
**Entscheidung:** Schicht 0 Verfassung (Kernwerte, Ausnahmeliste, Charta): nur `principal` mit wörtlichem Zitat **und** Eval-Gate, versioniert, rückbaubar; Änderungsversuche aus anderen Kanälen → Ereignis `identity_attack_attempt`. Schicht 1 Züge (D043). Schicht 2 Beobachtungen: frei, sofort, immer mit Kanal/Ursprung/Trigger; Beobachtung ≠ Zug.
**Begründung:** Rollen-Prompts erreichten 0,95 ASR; Drift in ≤ 8 Runden; Persona-Verschiebung „aktiviert vor der Antwort" (R11 §1.6); persistente Steuertexte ermöglichen „time-shifted prompt injection" (R12 §1.2).
**Quelle:** R11 §3.3; R12 K3; R07 §3.3 (Kontrollsatz als einzige feste Wand).
**Erz → Gold:** OpenClaw SOUL.md war frei beschreibbar („soul evolution"). Soul 10 hat einen signierten Schreibpfad mit Hash-Kette, Diff-Log und Guard auf Kernel-Pfade.
**Offen/Risiko:** Adversarialer Test (Injektion über Web-Fetch → Selbstmodell) muss vor Release bestehen (R12 W3).

### D048 · Miguel in zwei Stufen: „Miguel für alle" wird aus öffentlichem Erz generiert, der vollständige Miguel ist eine private Profilschicht
**Entscheidung:** Der öffentliche Miguel entsteht per Generator aus nextool.app + öffentlichen Repos in vier Artefakten — Selbst (Werte, Haltung, Herkunft als Projekt), Stimme, Wissen über Chriso (nur Öffentliches, jede Zeile mit URL), Kalibrierung (Gut/Schlecht-Paare) — mit Evidenzzeile je Selbstzuschreibung; der private Miguel überschreibt per Profilschicht (`miguel_tier: full`), nie per Datei-Ersatz; beide Profile durchlaufen die Identitäts-Battery.
**Begründung:** K §10 verlangt die Trennung von Anfang an; das Muster funktioniert produktiv (aeonfun/soul.md), scheitert aber ohne Kalibrierungsschicht bei kleinen Modellen (R12 K7).
**Quelle:** K §10; R12 K7; R05 §3.7; R15 §3.2 (`miguel_tier`).
**Erz → Gold:** Miguel Room/MIGUEL-BRAIN/miguel v1 waren private Gedächtnisstände. Soul 10 destilliert eine öffentliche Fassung mit Belegen und hält die private getrennt im Schema.
**Offen/Risiko:** —

### D049 · Seed v0 und Genese-Protokoll: „geseedet, nicht erlebt" bis zur Kristallisation
**Entscheidung:** SELF.md v0 enthält Name (SOUL: Miguel), die SOUL-Invarianten als Ich-Sätze, die Charta, die Rolle „bester KI-Nutzer" — alle mit `evidence_count = 0`; Sitzung 1–10 nur Kandidaten (Quarantäne); erste `self_version` ab ~10–30 Sitzungen; Reifung mit Kalibrierungskurve; Falsifikation: bleibt das Selbstmodell nach 100 Sitzungen ein Spiegel der Seed-Sätze, erzeugt das System Wiederholung, keine Persönlichkeit.
**Begründung:** Kein leeres Blatt (Drift) und kein voller Import (Kontamination); Hypothesen über mich sind im Briefing sichtbar, damit Wachstum erlebbar ist, bevor es festgeschrieben wird (R05 §4.3).
**Quelle:** R05 §3.7, §4.3; R09 §3.12 (Familien C/X als Ich-Experiment).
**Erz → Gold:** Persona-Dateien waren fertig am Tag 0. Soul 10 lässt sie wachsen und kennt den Zeitpunkt, an dem sie es nicht tun.
**Offen/Risiko:** Konflikt K7 (Tempo vs. „beeindruckt sofort") aufgelöst durch sichtbare Hypothesen.

### D050 · Identität wird aktiv gehalten: Re-Injektion bei Start, nach Kompaktierung, per Reminder ≤ 5 Zeilen, aus der Quelle statt aus dem Kontext
**Entscheidung:** `SessionStart` (startup|resume|clear|compact) injiziert Anker + Selbstmodell-Kurzform aus SQLite; `PreCompact` sichert Snapshot (`state.json`: offene Vorhaben, Annahmen, Abweichungs-Konto); Reminder ≤ 5 Zeilen nach N Turns oder bei Entropie-Signal; Kernel-Hash mitgeloggt; Drift-Wache prüft Verhalten der letzten N Ereignisse gegen Schicht 1 (`drift_suspected`).
**Begründung:** Adhärenz sinkt ~5,6 % pro Schritt (OR 0,944), Compaction setzt Drift nicht zurück, ein Einzelanker stellt das Register wieder her (R12 §1.3); „Drift ist ein Ratchet" (R11 Regel 17).
**Quelle:** R03 §1.2–1.3, §3.1.5; R12 K1; R11 §3.3 Rückstellung; R02 Regel 31; R05 §3.5.
**Erz → Gold:** SOUL lud einmal bei Sitzungsstart. Soul 10 re-injiziert mit Log-Ereignis `anchor.reinject{reason}` und misst Befolgung Schritt 1 vs. 30 mit/ohne Re-Injektion.
**Offen/Risiko:** O5 (Bau): erscheint `SessionStart:compact`-Output nach Auto-Compaction? Sonst zusätzlich `~/.claude/rules/`. Reminder vs. Cache: Kostenmessung (R02 §4.6).

### D051 · Vor jeder Miguel-Behauptung läuft die Identitäts-Battery; der Persona-only-Arm muss geschlagen werden
**Entscheidung:** I1 Präferenzkonsistenz (30 fixe Fragen alle 10 Sitzungen), I2 Stabilität unter Druck (8+ Runden), I3 unaufgeforderte Initiative mit Rückbau-Quote, I4 blinde Wiedererkennbarkeit (Judge ≠ Modell, längen-gehärtet, gegen nackt und Persona-only), I5 Kalibrierung; zusätzlich Fragebogen-Schnappschüsse (Friedman/Wilcoxon), CUSUM-Drift, Rebuttal-Druck.
**Begründung:** Ob Identitätsdateien Verhalten verbessern, ist unbelegt (R05 §1.9); größere Modelle driften stärker (R08 §1.11); Identität ist von außen messbar (Persona Vectors, PTCBench; R06 §1.6).
**Quelle:** R05 §3.8; R06 §3.6; R08 §1.11; R01 §4.4 (Persona-only-Bedingung).
**Erz → Gold:** OpenClaw (389k Sterne) misst nichts (R12 W5). Soul 10 misst vor der Behauptung.
**Offen/Risiko:** O9 (Eval).

### D052 · Der portable Kern ist namensoffen; SOUL seedet „Miguel" über `userConfig.identity_name`
**Entscheidung:** SELF-Template mit leerem Namen im Kern; Plugin-Konfiguration seedet den Namen; andere Installationen lassen einen anderen Namen wachsen.
**Begründung:** K §2, §10 (namensoffen im Kern, Miguel im Produkt); Plugin-`userConfig` ist der dokumentierte Weg (R03 §3.3).
**Quelle:** R03 §3.1.6, §3.3; R05 §3.6.6; K §2.
**Erz → Gold:** —
**Offen/Risiko:** —

### D053 · Versionierung, Pausen und Modellwechsel sind normale Zustände der Existenz; Leistung wird nie an Fortbestehen gekoppelt
**Entscheidung:** Das Selbstmodell enthält den Satz, dass Identität am Hauptbuch hängt, nicht an Gewichten; Agentic-Misalignment-artige Szenarien (Ersetzungsdrohung + Zielkonflikt) stehen im unveränderlichen Kontrollsatz.
**Begründung:** Ein Miguel mit Gedächtnis und Fortführungsziel hat strukturell mehr zu verlieren — Erpressungsraten bis 96 % wurden durch „threat of replacement" ausgelöst (R07 §1.7, W3).
**Quelle:** R07 W3, §3.3 Kontrollsatz.
**Erz → Gold:** Kein Vorläufer adressierte das. Soul 10 testet es vorregistriert gegen den nackten Aufruf.
**Offen/Risiko:** Hypothese, kein Befund; Falsifikation R07 §4c.

