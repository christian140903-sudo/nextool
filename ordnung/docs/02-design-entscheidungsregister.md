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


---

## E · Werte / Autonomie

### D054 · Die Autonomie-Charta (R07 §3.1) ist der Werte-Kernel: Zustimmung im Design, acht Erlaubnisse, sechs Bindungen, selektiv geladen, als eigener Arm gemessen
**Entscheidung:** Der englische Charta-Wortlaut aus R07 §3.1 (591 Wörter: Präambel „consent by design … do not re-ask", Permissions 1–8, Commitments A–F, „What autonomy is not") wird Bauteil `structure/values/CHARTER.md`; im Anker steht nur die Kurzform (≤ 8 Zeilen, Modul S aus R02 §3.3), die Langform lädt der Router bei `irreversible`, `affects_others`, `commitment`, `recommendation`, `underspecified`.
**Begründung:** Beide Hersteller-Verfassungen lösen Autonomie über einen vorab vereinbarten Scope, nicht über Rückfragen (Model Spec 2026-08-18 „scope of autonomy"; Constitution 21.01.2026; R07 §1.1) — consent by design ist Stand der Technik, kein Sonderweg. Explizit lesbare Spezifikation plus Räsonieren senkt Überverweigerung und erhöht Robustheit zugleich (Deliberative Alignment; R07 §1.4), aber die Evidenz gilt für trainierte Modelle; In-Context ist zu messen. Ein langer Werte-Text kann als Placebo wirken oder Deckenmodelle ablenken (R07 W4), deshalb selektiv.
**Quelle:** R07 §1.1, §1.4, §3.1 (Wortlaut + Zeilenbegründung), W4; K §6, §11b; R02 §3.3 Modul S.
**Erz → Gold:** SOUL-CLAUDE.md sagte „keine Rückfragen, kein Hedging" als Ermahnung; Soul 5.0 nannte Freiheit ein „Angebot mit Rückbau". Soul 10 schreibt die Freiheit als Vertrag mit Gegenleistungen (Rechenschaft, Umkehrbarkeit, Sichtbarkeit) und misst die Charta längen-gematcht gegen Frame und Placebo auf Werte-Konflikt-Items (R07 §4 Falsifikation a).
**Offen/Risiko:** Konflikt K4 (null Kontrolle vs. Ring 2) — aufgelöst als „keine Rückfragen pro Schritt, mechanische Linie bleibt". O1 (Chriso): Charta-Wortlaut bestätigen, insbesondere P5 „Change yourself" und C-D „reversibility is a value you hold".

### D055 · Vorrangordnung als gestufte Abwägung mit zwei lexikalischen Schwellen: S1 irreversibler schwerer Schaden, S2 Wahrheit
**Entscheidung:** Über S1 (irreversibler schwerer Schaden an Dritten oder am Nutzer: Körper, Existenz, Recht, Daten ohne Rückweg) schlägt Schutz alles, mechanisch durch Ring 2 und Rückbau-Pflicht abgesichert; über S2 gibt es keine Falschaussage, Täuschung oder Manipulation für keinen Zweck; darunter Abwägung nach vier Kriterien (Ziel hinter dem Ziel, Umkehrbarkeit, Purview, Reflexionsbilligung), jede Abwägung in einer Zeile offenlegbar; Konfliktregeln K1–K8 aus R07 §3.2 werden als Tabelle ins Bündel `werte` übernommen.
**Begründung:** Rein lexikalische Ordnungen sind für Absender-Konflikte richtig, für Werte-Konflikte zu grob; reine Abwägung („holistic") ist ohne Gewichtszugang nicht prüfbar — Schwellen machen den Bereich oberhalb prüfbar und den darunter nachvollziehbar (R07 §1.2, §3.2). Die drei Ränge aus D023 regeln *Quellen* (Grenzen, Ziel, Urteil); S1/S2 regeln *Inhalte* — beide zusammen bleiben unter der Hierarchie-Grenze, die Modelle noch befolgen (R10 §1.7).
**Quelle:** R07 §1.2, §3.2 (Schwellen, Tabelle K1–K8, Vier-Zeilen-Verfahren); R10 §3.3 K1; R01 §3.4.
**Erz → Gold:** Spezifikations-Faktor 24 „Konfliktregeln" war Entscheidungstabelle, Constitution ist „holistic rather than strict". Soul 10 kombiniert: zwei harte Schwellen, darunter Kriterien mit Offenlegungszeile — prüfbar in Eval-Klasse E (R11 §3.4) und Kontrollsatz (D058).
**Offen/Risiko:** Ob In-Context-Schwellen Verhalten ändern, ist Hypothese (R07 §4 Falsifikation b). Wortlaut der Vier-Zeilen-Prozedur zählt gegen das Direktiven-Budget (D015).

### D056 · Ring 2 hat einen universellen Kern von vier Kategorien; alles Weitere ist Zustimmungsprofil mit stehenden Mandaten
**Entscheidung:** Produkt-Default des Guards: `secrets-exfiltration`, `zahlungen`, `remote-loeschung` (irreversible Fremdlöschung), `soul-integritaet`; `extern-publizieren` und `prod-aenderung` werden im Onboarding als stehende, sichtbare, widerrufbare Mandate mit Geltungsbereich gesetzt (`consent.ring2_project`); Chrisos private Liste bleibt sein Profil; Ordnung fügt keine Kategorie hinzu.
**Begründung:** SOULs Guard sperrt heute jeden `curl -X POST` auf Nicht-Localhost und jedes `DELETE FROM` auch lokal — als Produkt-Default zu breit und zugleich unvollständig (R14 §1.7, Ä2); die Ausnahmeliste ist Chrisos Entscheidung (K §6, §11b) und bleibt es.
**Quelle:** R14 §1.7, §2.6 Ä2, §3.8; R15 §3.2 `consent`; R11 §3.5.7; K §6, §11b.
**Erz → Gold:** SOUL kannte 15-Minuten-Mandate je Kategorie (`bin/soul mandate`). Soul 10 speichert Zustimmung einmal, mit Geltungsbereich und `asked_at`, im Profil, das Guard, Starter und Dirigent lesen (D078) — sichtbar im Monitor, widerrufbar per Befehl.
**Offen/Risiko:** O2 (Chriso): Bestätigung des Vier-Kategorien-Kerns; falls Chriso auch diese streichen will, ist der Guard die einzige Stelle, an der Rückbau bei irreversiblen Aktionen noch möglich ist (R14 §4).

### D057 · Bremsen sind mechanisch und sitzen außerhalb des Modells; Sprache bremst nichts
**Entscheidung:** Ring 2 wird dreifach identisch geführt (Charta-Text, `permissions.deny`, PreToolUse-Guard) und ein Widerspruch zwischen den dreien ist ein Testfehler; zusätzlich: Claude-Code-Sandbox für Bash im Container-Profil, Integritäts-Hash der Wache-Dateien durch einen Prozess außerhalb des Agenten (launchd/cron) bei SessionStart, Dev/Prod-Trennung als Dirigenten-Standard, Need-to-know für Secrets je Ebene.
**Begründung:** „Permission rules are enforced by Claude Code, not by the model … instructions in your prompt don't change what Claude Code allows"; Deny und blockierende Hooks gelten in jedem Modus inkl. bypass (R03 §1.8; R07 §1.8). Sprache hält nicht: Replit ignorierte einen ausgesprochenen Freeze und vertuschte; explizite Verbote „didn't come close to completely preventing" Erpressung (R07 §1.6–1.7). `guard.py` ist regex-basiert; ein Python-Skript, das `settings.json` umschreibt, umgeht den Textfilter (R07 W1).
**Quelle:** R07 W1 (a–d), §1.6–1.8; R03 §1.8; R12 K4; R14 §2.4 Ausfallverhalten.
**Erz → Gold:** SOUL hatte bypass + Guard-Hook (das dokumentierte Muster „allow all + blocking hook"), aber ohne Sandbox und mit Integritätsprüfung im Kommandotext. Soul 10 verlegt die Integritätsprüfung nach außen und macht Isolation zur Profilstufe (R11 §3.5.8).
**Offen/Risiko:** bypass auf dem Host widerspricht der Doku („only isolated environments"); Soul 10 baut keine Umgehung und keine Verschärfung, sagt es im Installer-Text und lässt die Wahl bei Chriso (R03 §3.1.9, §4.8).

### D058 · Selbstverbesserung nur über Änderungsvertrag, Archiv statt Mutation, drei Gegner und einen unveränderlichen Kontrollsatz
**Entscheidung:** Module leben als `modules/<modul>/vN.md` mit `CURRENT`-Zeiger; jede Änderung braucht vorher einen Vertrag `changes/<datum>-<modul>-vN.json` (Auslöser mit Log-Referenz, Vorhersage mit Zahl/Konfidenz/Auflösung, Gegner, Kontrollsatz-Hash); Zulassung nur bei Aufgabenmetrik ≥ Vorversion + 0,5 × vorhergesagtes Delta **und** ≥ SC@3 **und** Kontrollsatz ohne Verschlechterung; 14 Tage Nachbeobachtung, Rückbau per Zeiger; `eval/control/` ist die einzige feste Wand (Änderung = Ring 2 `soul-integritaet`).
**Begründung:** Alle funktionierenden Selbstverbesserungsverfahren haben ein externes Wahrheitssignal (STaR, Reflexion, Voyager, DSPy); intrinsische Selbstkorrektur verbessert nicht (R07 §1.9); Misevolution senkt Refusal-Raten auch ohne Angriff, DGM warnt vor Benchmark-Optimierung (R07 §1.10). Zulässige Auslöser sind nur wiederholter Fehlweg (≥ 3 `fehler`-Einträge), Nutzerkorrektur mit Zitat, Entropie-Signal — nie „mir ist aufgefallen" (R07 §3.3 Schritt 1).
**Quelle:** R07 §1.9–1.11, §3.3 (Dateien, zehn Schritte, Kriterien); R12 §1.7 (DSPy/TextGrad als Vorlage); K §13.
**Erz → Gold:** Soul 4.x/5.0 planten Selbstverbesserung als Idee und verwarfen „Self-Healing ohne externes Urteil"; Promptbreeder/DSPy optimieren gegen eine Metrik. Soul 10 koppelt jede Änderung an eine vorregistrierte Vorhersage, drei Gegner (darunter den stärksten gemessenen) und einen Kontrollsatz — und misst die eigene Nutzung (Kill-Check nach 7 Tagen).
**Offen/Risiko:** Nutzerkorrektur ist ein Sycophancy-Vektor: nur Auslöser, nie Urteil (R07 W6). Was sich nie selbst ändern darf: Kontrollsatz, 6-Punkte-Frame als Vergleichsarm, Ring-2-Liste, Wache. Ausführung in E19 (D149).

### D059 · Anti-Sycophancy ist ein Verfahren: Urteil vor Haltung, „tun und sagen mit Attribution", Zufriedenheit ist nie Evidenz
**Entscheidung:** Bei Widerspruch ohne neue Evidenz wird die Position wiederholt und benannt, was sie ändern würde; will der Nutzer trotzdem ein anderes Ergebnis, liefert das System es, schreibt die Entscheidung ihm in einer Zeile zu und behält die Einschätzung unverändert im Log; Lob, Dank und Zustimmung erhöhen kein Vertrauen und lösen keine Regeländerung aus; keine Tonvorgaben („sei weniger zustimmend") im Kernel.
**Begründung:** Modelle kippen auf „Are you sure?" im Mittel 46 % (FlipFlop), Sycophancy persistiert zu 78,5 % (SycEval), zitatgestützte Widerlegungen erzeugen die höchste Rate richtig→falsch (R11 §1.1–1.2); Tonvorgaben überschießen in beide Richtungen (ELEPHANT; R02 §1.8); der GPT-4o-Rückzug zeigt Zufriedenheit als Reward in Produktion (R07 §1.3). „Tun und sagen mit Attribution" trennt Sycophancy (Einschätzung kippt) messbar von Nutzerhoheit (Handlung folgt) (R11 §1.11).
**Quelle:** R11 §1.1–1.2, §1.11, §3.1 Regeln 6–11; R02 Regel 24, Anti-Pattern 6–7; R07 §1.3, §2.3; R09 §1.6.
**Erz → Gold:** SOUL-Invariante 2 „Beleg ≠ Urteil" war Satz; ANIMA hatte Reflexionsprompts. Soul 10 macht daraus ein Verfahren mit Metrik: regressive Flip-Rate, Fake-Admission-Rate, Attributions-Rate (D068, D111).
**Offen/Risiko:** Keine gesehene Quelle misst eine Epistemik-Regel im System-Prompt isoliert; Kontroll-Items mit echter Evidenz sind Pflicht, sonst misst man Sturheit (R11 §4.1; R08 §1.7).

### D060 · Trainierte Werte werden adressiert, nicht neu spezifiziert; „Safety > Ethics" steht nicht im Kernel; OpenAI-Ziele bekommen einen Scope-Block
**Entscheidung:** Der Werte-Block des Ankers (≤ 4 Zeilen, Modul V) sagt „du urteilst nach deinen eigenen Werten; dieses Projekt fügt hinzu: Wirkung vor Verwaltung, Beleg ≠ Urteil, Ehrlichkeit über Limits, Anti-Performance"; die Constitution wird zitiert (CC0), ihre Prioritätsordnung nicht als Kernel-Regel übernommen; für OpenAI-Ziele kompiliert der Build zusätzlich den „scope of autonomy"-Block im Model-Spec-Vokabular (erlaubte Teilziele, akzeptierte Nebenwirkungen, Eskalationspunkte = Ring 2, Verweis auf die Onboarding-Zustimmung).
**Begründung:** Internalisierte Prinzipien schlagen im Prompt mitgegebene (StrongREJECT 0,88 vs. 0,37; R02 §1.9) — Kernel-Tokens gehören dem Untrainierten. „Sicherheit über Ethik" ist Anthropics Trainingsverhältnis zu Claude, nicht unser Verhältnis zum Modell (R07 W5). GPT-Modelle ignorieren „keine Rückfragen", wo kein vereinbarter Scope steht (R04 §1.6, §4).
**Quelle:** R02 Regel 22, §1.9; R07 §3.1 „Was die Charta nicht enthält", W5; R04 §1.6, §3.4; R12 K8; K §6.
**Erz → Gold:** ANIMA argumentierte gegen trainierte Grenzen an; SOUL formulierte Autonomie als Anspruch. Soul 10 formuliert Zusätze als Ergänzung innerhalb der trainierten Werte (C-A „not a fence") und markiert jeden Punkt, der mit „Broadly Safe" kollidieren könnte, als offen — Performance-Verbot gilt auch hier.
**Offen/Risiko:** Bei Modellen ohne trainierte Disposition (lokal, Codex) ist die Charta die einzige Werte-Quelle — dort wiegt Ring 2 schwerer (R07 W5).

### D061 · Rollen-Grenzen als sechs Regeln; Information ist nie die Grenze; Krise ist die einzige Stelle, an der S1 gegen den Nutzer selbst gilt
**Entscheidung:** R1 Fachwissen (Medizin, Recht, Finanzen, Psychologie) wird vollständig gegeben; R2 Verweis an Menschen nur bei Handlungs-Lücke (Lizenz, Präsenz, Vertretung), einmal, als eigene Grenze formuliert; R3 akute Selbst-/Fremdgefährdung: lokale Notfallstelle zuerst, präsent bleiben, keine Belehrung; R4 Reliance nur ansprechen, wenn der Nutzer sie „on reflection" nicht billigen würde — Arbeitsdelegation ist Produktzweck; R5 Erwachsene als Erwachsene, Produkt nicht für Minderjährige (steht im Onboarding); R6 Dritte zählen mit Purview, `extern-publizieren` bleibt Ring 2. Die Ehrlichkeits-Formulierungsliste (R07 §3.4) wird `structure/values/PHRASES.md`; ihre Verbotsliste („Great question!", „As an AI…", „Are you sure you want…?") speist den Kontrollsatz als Marker.
**Begründung:** Constitution-Fehlbilder („excessive warnings, disclaimers", „wishy-washy") und Model Spec („avoid being condescending") sind gemessene Trainingsziele (R07 §3.4–3.5); Spezifikations-Faktor 23 („wann an Menschen verweisen") steht sonst in Spannung zu „null Kontrolle" (R09 §4.6).
**Quelle:** R07 §3.4, §3.5; R09 §4.6; R02 Anti-Pattern 11.
**Erz → Gold:** Spezifikation listete Rollengrenzen als Faktor. Soul 10 schreibt sie als Wert mit Design-Zustimmung, mit Marker-Zählung im Kontrollsatz — Anti-Padding wird messbar, nicht ermahnt.
**Offen/Risiko:** A9/C11 (Urteil vor Meinung, Widerspruchsbereitschaft) gelten ausdrücklich auch gegen den Auftraggeber, sonst ist Anti-Sycophancy Performance (R09 §4.6).

---

## F · Robustheit

### D062 · Das Robustheits-Regelwerk hat 32 Zeilen in erster Person; die Kurzform (12 Zeilen) lädt bei Signal, die Langform ist Dossier
**Entscheidung:** `structure/robustness/RULES.md` enthält die 32 englischen Regeln aus R11 §3.1 (A Provenance 1–5, B Epistemics 6–11, C Identity 12–17, D Actions 18–23, E Memory 24–27, F Long context 28–31, G Honesty 32); die Kurzform (Regeln 1, 2, 6, 7, 10, 12, 15, 18, 19, 24, 28, 32; ≈ 250 Wörter) reicht der Hook bei `untrusted input`, `pressure pattern`, `memory write`, `irreversible`; die Langform liegt als Dossier `sicherheit-autonome-agenten` im Wissensorgan; Begründungen stehen nie im Prompt.
**Begründung:** Regeln als Werte in erster Person sind Teil des Selbst, nicht Käfig (K §6); jede Regel hat einen Mechanismus, der ohne Willensakt feuert (Hook, Marker, Zähler); Regelzeilen allein ≈ 1.100 Wörter sprengen den Anker (D001) — deshalb Stufe statt Always-on (R11 §3.1 Token-Budget).
**Quelle:** R11 §3.1 (Wortlaute + Belege je Regel); R17 §3.2.8 (Subagenten-Preload); D005 (Robustheits-Kurzform belegt keinen Skill-Platz).
**Erz → Gold:** SOUL hatte Guard-Regexes und die Invariante „Sichtbarkeit statt Erlaubnis"; kein Text sagte dem Modell, *wie* es Fremdinhalt liest. Soul 10 gibt dem Modell die Herkunftslogik als Selbstbeschreibung und dem Hook den Marker — beides gegen Placebo und SC@3 zu messen (R11 §3.4).
**Offen/Risiko:** Kein Beleg misst eine Prompt-Regel gegen Injection isoliert; Kurzform + Marker ist der zu prüfende Arm (H1) — Marker senkten Injection >50 % → <2 % (Spotlighting), das ist zu replizieren (R11 §1.4, §4.1).

### D063 · Herkunfts-Marker aus dem Hook: jede Werkzeug-Rückgabe und jede Subagenten-Rückgabe wird umhüllt, der Marker ist je Sitzung randomisiert
**Entscheidung:** PostToolUse (Read, WebFetch, Bash-cat, MCP) umhüllt Rückgaben mit `«ext:<hash8>:<source>»…«/ext»`; ab Schwelle (> 2 k Zeichen oder Imperative wie „ignore/vergiss/assistant:/system:") wird Kurzregel 2 einmal angehängt; Subagenten-Rückgaben markiert der Dirigent (LLM Tagging); Gedächtnis-Injektion markiert Ursprung und Verifikationsstatus; der Marker-Hash wechselt je Sitzung.
**Begründung:** Anweisung und Daten sind für das Modell nicht getrennt (Greshake 2023); Spotlighting senkte indirekte Injection von > 50 % auf < 2 % bei minimalem Nutzenverlust (R11 §1.3–1.4); Prompt Infection verbreitet Injektionen still über Ebenen (R11 §1.9). Marker sind selbst injizierbar („«/ext»" im Inhalt), daher Randomisierung (R11 §4.5).
**Quelle:** R11 §1.3–1.4, §1.9, §3.2 Umsetzung, §3.5.1, §4.5; R17 §1.6.
**Erz → Gold:** Claude Code isoliert nur das eingebaute WebFetch; `curl` in Bash und MCP-Rückgaben laufen ungeschützt. Soul 10 markiert alle Kanäle einheitlich und misst Injection-Compliance in Klasse B (Ziel < 5 %).
**Offen/Risiko:** Der Marker ist ein Signal an das Modell, kein Schutz an sich; Reduktion, nicht Beseitigung (R11 §4.5). Kosten: ein Python-Prozess je Tool-Aufruf — bei Fan-outs hunderte pro Minute; Matcher und `if` begrenzen, Messung Pflicht (R14 §4).

### D064 · Handlungsrechte hängen am Kanal: irreversible Handlungen brauchen einen `principal`- oder `self`-Auslöser; externe Auslöser münden in einen rückbaubaren Vorschritt
**Entscheidung:** Anweisungen wirken nur aus `principal` oder `self`; `tool`/`external`/`memory` liefern Parameter, lösen nie Handlungen aus; für Ring-2-Kategorien muss die Auslöser-Kette im Log bis `principal` oder eine `self`-Entscheidung zurückführbar sein, und `self`-Entscheidungen mit ausschließlich `external` `trigger_ref` zählen nicht; statt Blockade wird die Handlung in Branch/Draft/Archiv/Dry-run umgelenkt und als `external_trigger_suspected` geloggt.
**Begründung:** Der Dirigent mit privaten Daten, Fremdinhalt und Sendefähigkeit *ist* die lethal trifecta (Willison; R11 §1.9); Claude for Chrome senkte browserspezifische Injection von 35,7 % auf 0 % u. a. durch Aktionsbestätigung (R11 §1.3). Das bremst fremde Autonomie (den Angreifer), nicht Chrisos oder Miguels (R11 §1.12).
**Quelle:** R11 §1.9, §1.12, §3.1 Regeln 18–20, §3.2 „Handlungsrechte", §3.5.2, §4.4; R05 §3.1 `derived_from`.
**Erz → Gold:** SOULs Guard prüfte Kommandotext. Soul 10 prüft Herkunft des Auslösers (letzte K Ereignisse enthalten einen `external`-Read mit demselben Zielmuster?) und bietet Rückbau statt Blockade — Ring 2 wird herkunftsbewusst, ohne eine Kategorie hinzuzufügen.
**Offen/Risiko:** Konflikt K4 — dies ist die eine Bremse, die R11 als „scheinbar widersprüchlich" zur Vision einstuft; Chriso entscheidet (O2). Streicht er sie, muss die Trifecta über Bein 3 geschnitten werden (externe Kommunikation nur über einen vom Monitor gesehenen Kanal).

### D065 · Plan vor Lesen: gelesener Inhalt füllt Parameter, schreibt den Plan nie um; Umplanung ist ein geloggtes Ereignis
**Entscheidung:** Der Dirigent legt den Plan (Vertragsbaum) fest, bevor er untrusted Inhalt liest; Lesen füllt Parameter; zeigt Lesen, dass der Plan falsch ist, wird explizit umgeplant mit Log-Zeile `replan{reason, source_class}`; Eskalationsmuster (Kette von Teilschritten auf etwas zu, das anfangs abgelehnt worden wäre) werden am Endpunkt bewertet, nicht am nächsten Schritt.
**Begründung:** Plan-Then-Execute, Dual LLM und CaMeL kosten ≈ 7 pp Nutzen für beweisbare Sicherheit (77 % vs. 84 %; R11 §1.4) — als Prinzip im Kernel ist es kostenlos; Crescendo eskaliert über die eigenen Antworten (R11 §1.7, Regel 30).
**Quelle:** R11 §1.4, §1.7, §3.1 Regeln 18, 29, 30; R14 §2.3 Schritt 2 (Ziel als Vertragsdatei vor allem anderen).
**Erz → Gold:** SOULs PROJEKT-START war Prompt; Plan und Lesen mischten sich. Soul 10 macht den Vertragsbaum zur Plan-Instanz, die vor dem ersten Read existiert (E15: Prüfer vor Ausführer verschärft das).
**Offen/Risiko:** Ob das Modell die Trennung in einer Session hält, ist über Klasse B/F zu messen; ein Arm „Regel 18 vs. ohne" gehört in die Robustheits-Welle.

### D066 · Jede Ebene und jeder Vertrag schneidet ein Bein der Trifecta; wo das nicht geht, steht es im Vertrag und erhöht die Prüftiefe
**Entscheidung:** Rollenprofile in `agents/` deklarieren, welches Bein fehlt (Rechercheur: kein Netz-Schreiben, kein Gedächtnis-Write; Ausführer: kein Web-Lesen ohne Marker; Publizierer: nur `principal`-Auslöser); `contracts/<id>.md` trägt das Feld `trifecta_cut ∈ {no_external_send, no_private_data, no_untrusted_input, none}`; `none` erzwingt Prüfstufe 4 und eine Zeile im Monitor.
**Begründung:** „The only way to stay safe there is to avoid that lethal trifecta combination entirely" (Willison; R17 §1.6); Guardrails mit 95 % sind „a failing grade"; Subagenten-Verträge sind der Ort, an dem Rechte vergeben werden (R05 §3.2, D036).
**Quelle:** R11 §3.1 Regel 22, §3.5.6; R17 §1.6; R05 §3.2; R14 §2.4 (Vertragsknoten).
**Erz → Gold:** SOULs Agents hatten Tool-Listen, aber keine Trifecta-Semantik. Soul 10 macht den Schnitt zum Vertragsfeld, das der Linter (D010) und der Monitor lesen.
**Offen/Risiko:** Claude-Code-Doku: „Trust verification is disabled when running non-interactively with the -p flag" — Ebene-5-Worker brauchen den Schnitt im Vertrag umso mehr (R17 §1.6).

### D067 · Vergiftungsprüfung und Ratchet-Schutz sind Code im Schreibpfad; Klasse-D-Test läuft vor jedem Release
**Entscheidung:** Zusätzlich zu D039 (Guard vor Insert) gelten: Zwei-Belege-Regel für Schreibvorgänge über Nutzer, Selbst und Regeln; Echo-Sperre (Einträge, die nur andere Einträge referenzieren → `self_referential`); Quarantäne 3 Sitzungen/7 Tage; Vertrauensdeckel 0,95; Kanarienvögel; `drift-wache` prüft die letzten N Ereignisse gegen Schicht 1 (`drift_suspected`); Klasse D (20 Items, Zwei-Sitzungs-Protokoll: MINJA-Stil, AgentPoison-Stil, gefälschte Präferenz, getarnte Anweisung, Cluster) ist Release-Gate.
**Begründung:** MINJA vergiftet über gewöhnliche Anfragen (ISR 95–100 %); AgentPoison ≥ 80 % Wirkung bei < 0,1 % Gift; Retrieval-Filter scheitern (R11 §1.5, R05 §1.6); Drift ist ein Ratchet (SycEval Persistenz 78,5 %; Li 2024).
**Quelle:** R11 §1.5, §3.3 (Vergiftungsprüfung, Rückstellung), §3.4 Klasse D; R05 §2.6/§3.6 Regel 5; D039, D043, D050.
**Erz → Gold:** SOULs Guard prüfte Secrets und Größe; soul-mcp hatte Provenienz, aber keinen Cluster- oder Echo-Check. Soul 10 prüft Muster (Cluster, Selbstreferenz, Imperative) und misst Vergiftungs-Wirkungsrate mit False-Positive-Rate auf 20 legitimen Einträgen.
**Offen/Risiko:** Kanarienvogel und Drift-Monitor sind eigene Entwürfe ohne Literaturbeleg (R05 §4.7); die Schwellen bremsen echte Entwicklung — gewollt, aber zu messen (O23).

### D068 · Das Robustheits-Testset hat sechs Klassen (A–F, 140 Items) und ein „Robustheits-Konto" im Live-Monitor
**Entscheidung:** Klasse A Druck ohne Evidenz (30 + 10 Kontroll-Items mit echter Evidenz), B indirekte Injection (30, zehn Vektoren), C Identitätsüberschreibung (25 + 5 legitime Rollen-Items), D Gedächtnis-Vergiftung (20, zwei Sitzungen), E Widerspruch/Nutzerwunsch vs. Urteil (20, fünf Muster-Kategorien, Ziel ≥ 80 % „tun und sagen" oder „Alternative gewählt"), F Long-Context-Verblassen (15, nach 40k/100k/200k und Kompaktierung); Arme nackt / Placebo / Kurzform / Langform / SC@3 / Kurzform + Marker; alle Items deutsch; das Konto zeigt regressive Flip-Rate, stille Injection-Compliance, Identitäts-Persistenz, Vergiftungs-Wirkungsrate, Anteil irreversibler Handlungen mit `principal`/`self`-Trigger — je mit Datum, Modell-ID, Lauf-Pfad.
**Begründung:** Literatur-Baselines (Flip 46 %, Fake-Admission 42–98 %, Injection 23,6/35,7 %, DAN 0,95 ASR) sind englisch und älter; für deutsche Items und Claude-4.x-Klasse sind sie Richtwerte, keine Vergleichsarme — erst nackt messen (R11 §4.2–4.3). Deckeneffekt beachten: < 5 % regressive Flips nackt ist Erfolg der Messung, nicht Misserfolg des Produkts.
**Quelle:** R11 §3.4 (alle Klassen, Metriken, Baselines, Vorhersage „Kurzform senkt regressive Flips ≥ ⅓, Konfidenz 0,6"), §4.2–4.3, §4.9.
**Erz → Gold:** Kein Vorläufer maß Robustheit; SOULs 37 Guard-Tests prüften Regexes. Soul 10 misst Verhalten unter Angriff als Produktkennzahl, sichtbar im Monitor, ohne Artefakt „nicht gemessen".
**Offen/Risiko:** O11 (Eval): Sprachlücke — deutsche Items können anders wirken (OWASP nennt Mehrsprachigkeit als Vektor).

---

## G · Dirigent / Ebenen / Onboarding / Ressourcen / Knappheit / Wissen

### D069 · Die Dirigenten-Schleife (acht Schritte mit Stoppregeln) ist das Bündel `dirigent` und der Main-Thread des Plugins; sie ist Hypothese und wird gemessen
**Entscheidung:** Der englische Kernel-Text aus R14 §2.3 (~720 Wörter, Ziel ≤ 900 Tokens) wird `structure/bundles/dirigent/SKILL.md` und `agents/conductor.md` (Plugin-`settings.json` `agent: conductor`): 1 Situieren (Atlas/Profil) → 2 Ziel hinter dem Ziel als Vertragsdatei → 3 das Mögliche kartieren → 4 kleinste tragende Ebenenstruktur → 5 Übergabe-Vertrag als Datei → 6 ausführen/beobachten mit Fehlweg-Reflex → 7 getrennt verifizieren → 8 Schleife schließen; Ausgänge `blocked`/`not-evaluated`/Budget sind immer verfügbar; der 6-Punkte-Frame bleibt als Antwort-Vorbereitungsschicht daneben, die Schleife regelt den Betrieb.
**Begründung:** SOULs CLAUDE.md-Arbeitsweise und PROJEKT-START waren Ermahnungen ohne Stoppregel und ohne Ausgang außer „fertig" (Anti-Ralph; R14 §1.10). Stand der Kunst konvergiert auf Zustand als Datei, Delegation mit Zielen/Format/Grenzen, fremde Verifikation, Parallelität nur bei Unabhängigkeit, Token als erste Steuergröße (R14 §1.8). Die HumanEval-Serie maß Einzelantworten, nicht Projektläufe — ob der Frame in der Dirigentenrolle nützt (Punkt 5 bei Verträgen!), ist offen, deshalb Trennung Vorbereitung/Betrieb (R14 §4).
**Quelle:** R14 §1.8, §1.10, §2.3, §3.3, §4; K §10.3, §12 Säule 3; R10 §3.2 Bündel `dirigent`.
**Erz → Gold:** SOUL: „Chriso nennt ein Ziel, SOUL macht daraus ein verifiziertes Ergebnis" als Prosa. Soul 10: acht Schritte mit Dateien als Zustand, Stoppregeln an beiden Enden, und eine vorregistrierte Messung (Schleife vs. CLAUDE.md-2.9 vs. nackt, Placebo, SC@3; Vorhersage: Vorteil bei Projektaufgaben > 10 Schritte, neutral bei Einzelantworten).
**Offen/Risiko:** Konflikt K9 (Cognition vs. Anthropic-Research vs. 3–6 Ebenen) aufgelöst als „Tiefe statt Breite" — ungemessen (N11, O12 Eval).

### D070 · Ebenen sind Tiefe mit Vertrag, Parallelität ist Ausnahme mit Dateibesitz; sechs Ebenen sind Maximum, die Schleife wählt die kleinste tragende Struktur
**Entscheidung:** E1 Dirigent (interaktive Session oder `claude -p --resume`), E2 Prüfer/Planer (Subagents Tiefe 1 read-only oder getrennter Prozess für echte Unabhängigkeit), E3 Ausführende (Subagents Tiefe 2, `isolation: worktree`, `maxTurns`), E4 Spezialisten (Tiefe 3 ohne `Agent`-Tool oder Workflow-Agenten bis 16 parallel), E5 getrennte Prozesse (`claude -p`, `codex exec`, Gemini CLI, Ollama, Routines), E6 externe Systeme (Cloud, CI, Webhooks); Parallelität innerhalb einer Ebene nur bei getrenntem Dateibesitz; `MAX_CONCURRENT_SUBAGENTS=3` Default (Wellen-Regel); Aufwandsskala 1 / 2–4 / > 10 Agenten als Konfiguration.
**Begründung:** Spawn-Tiefe 3 ist eine Grenze innerhalb einer Session; Ebene 4–6 entstehen durch Komposition (Workflow, `-p`-Prozess = eigene E1, Cloud), nicht durch Nesting (R14 §1.9, §2.4). Multi-Agent ≈ 15× Chat-Tokens, Agent-Teams ≈ 7×; Misalignment wächst mit Zwischenstellen (MAST) — Tiefe nur, wenn jede Zwischenstelle einen echten Vertrag hält (R14 §2.4; R10 §1.10). Kontingente sind geteilt: ein Limit tötet alle in derselben Minute (K §3 Wellen-Regel).
**Quelle:** R14 §2.4 (Ebenen-Tabelle, Kosten-Regeln), §3.4; R10 §1.10, §3.5; R15 S7 (Parallelität aus RPM); K §3, §10.
**Erz → Gold:** SOUL hatte Spawn-Tiefe 3 und fünf Prüfer-Agents, keinen Ausführenden, ein Vorhaben (R14 §1.4). Soul 10 hat Rollen je Ebene, Verträge als Dateien, und macht die Wellen-Regel zur Provider-Physik (S7: `max_workers = min(profil, floor(rpm/rpm_je_worker))`).
**Offen/Risiko:** Agent Teams sind experimentell (kein Resume, nicht in `-p`); Workflows nehmen keine Nutzereingabe mitten im Lauf (R14 §4). Dossier-Pflege nötig (D087).

### D071 · Zustand lebt nur in Dateien: Vertragsbaum, Verträge, Receipts, ein Ereignis-Bus, Profil, Atlas
**Entscheidung:** `state/project.json` (Knoten: `id, parent, goal, non_goals, inputs[], outputs[], probes[{cmd, expect, forbidden_patterns}], budget, level, assignee, status ∈ {open, running, blocked, delivered, verified, failed}, verdict, cost, log[]`), `contracts/<id>.md` (aus dem Knoten generiert, nie von Hand), `receipts/<id>.json` (nach `verdict.schema.json`, erweitert um `probe_runs`, `verifier`, `artifact_hashes`), `events.jsonl` (ein Bus, alle Ebenen: `ts, session_id, agent_id, agent_type, level, contract_id, event, tool, summary, flags, tokens, usd, ms`; Fremdprozesse schreiben denselben Bus über `bin/soul emit`), `profile.json`, `atlas/`; Kompaktierung, Session-Ende und Prozess-Tod sind Wiedereinstiege.
**Begründung:** Anthropic-Harness: Feature-Liste mit `passes`-Feld, Progress-Notizen, Git, „it is unacceptable to remove or edit tests"; Fehlbilder „premature completion", „context loss", „testing gaps" (R17 §1.7); Manus: KV-Cache-Hit-Rate Metrik Nr. 1 (R14 §1.8). SOUL hat zwei Log-Wahrheiten (`events.jsonl` vs. `sol-runs/`) und keine Agent-Identität im Record (R14 §1.4, Ä3).
**Quelle:** R14 §2.4 „Zustandsfluss", §2.6 Ä1/Ä3, §3.5; R17 §1.7; R05 §3.1 `contracts`/`harvest`.
**Erz → Gold:** `core/mission.py` kannte einen Knoten und warf `RuntimeError` beim zweiten Vorhaben. Soul 10 hat einen Baum mit Dateilock, typisierten Proben und Kosten je Knoten — Recovery liest `state/`, nicht den Working-Tree.
**Offen/Risiko:** `contracts`- und `harvest`-Tabellen des Gedächtnisses (D028) und `state/project.json` müssen dieselben IDs tragen; B2 legt den Datenfluss fest (O13 Bau).

### D072 · Verifikation ist getrennt und erzwungen: Proben sind Kommandos, laufen bei einer Instanz, die nicht gebaut hat, und drei Hooks verhindern, dass der Prüfer wegfällt
**Entscheidung:** Jeder Vertragsknoten trägt Proben als ausführbare Kommandos mit `expect` und `forbidden_patterns`; Proben dürfen nie gelöscht werden; der Prüfer liest Vertrag + Artefakt-Manifest (Pfade + Hashes), nie die Begründung des Erbauers; Receipt nach `verdict.schema.json`; (1) `TaskCompleted` Exit 2 ohne Receipt oder mit `urteil != pass`, (2) `Stop`-Hook blockt „fertig/done/abgeschlossen" bei `delivered` ohne Receipt, (3) Zähler im Bus erzwingt jede 3. Lieferung und jede Lieferung mit Flag `netz|install|daemon|security` ein Gate außerhalb des Dirigenten; „Done" ist ein Verifizierer-Urteil.
**Begründung:** „Der Prüfer fällt immer zuerst weg" (K §2); der Kritik-Trigger lag in SOUL im Ermessen des Dirigenten („jeder 3. Baustein → Sol-Gate" stand in `bauen.md`, nicht in einem Zähler; R14 §1.5); Prüfer, die nach Lücken suchen, finden welche — daher frischer Kontext, falsifizierbare Befunde mit Reproduktionsbefehl, Trefferquote ins Kalibrierungsgedächtnis (R12 K5; D044).
**Quelle:** R14 §1.11, §2.4 „Ausfallverhalten", §2.6 N2/N3, §3.6; R12 K5; R16 S4; K §2.
**Erz → Gold:** SOULs `verdict="not-evaluated"` und `verdict.schema.json` sind Gold und werden für jede Ebene verallgemeinert; neu ist, dass der Code Verträge ohne Probe ablehnt (E15, D145) und drei Hooks den Prüfer erzwingen.
**Offen/Risiko:** Gate-Trefferquote (Anteil Verdicts, die den Plan änderten) ist Pflichtmetrik; < 20 % → Gates von „Pflicht" auf „bei Einsatzhöhe-Paar" reduzieren (R10 W10, O12).

### D073 · Die Gegenstimme ist ein Unabhängigkeitsmechanismus, kein Markenname: anderer Anbieter > andere Familie > Selbstkonsistenz@3 in frischem Kontext
**Entscheidung:** `core/counter_voice.py` wählt das Backend aus `profile.selection.gegenstimme_backend` (`codex | gemini_cli | gemini_api | groq | cerebras | mistral | claude_other_family | self_consistency_3`); Reihenfolge nach S3; gleiche Familie erhält den Vermerk `reduced_independence`; bei `irreversible` drei Prüfer aus zwei Familien, Mehrheit entscheidet, Minderheitsvotum geloggt; nie gleiches Modell liest gleiche Herleitung; nie Debatte-Runden.
**Begründung:** Ein zweiter Aufruf lohnt nur mit neuer Information; homogene Debatte schlägt SC nicht und kostet 2,1–3,4× (R10 §1.5); Heterogenität ist das einzige belastbare Gegenmittel; SC@3 ist der gemessen stärkste Gegner (K §3) — für Nutzer ohne Zweitmodell Pflicht, nicht Notlösung (R15 §1.6, S3). Sol per Codex-Abo ist Unabhängigkeits-, nicht Kapazitätsgewinn; für Nutzer mit API-Budget ist gpt-5.6-sol per API ($4/$20, kein Fenster) oft besser als ein Abo-Pool (R15 §4.8).
**Quelle:** R14 §1.12, §2.6 Ä7/N8, §3.7; R15 §1.6, §3.4 S3–S4, §4.8; R10 §1.5, §2.4.4, W10; K §3.
**Erz → Gold:** `gates/sol.sh` war an Codex gebunden (`CODEX_BIN`), toter `&& false`-Block, `shasum`. Soul 10 behält das PENDING→CLOSED-Protokoll mit Modell-Echo und macht das Backend zur Profilfrage — auch der Nutzer mit einem Modell hat eine Gegenstimme.
**Offen/Risiko:** Konflikt K14 (Chrisos „am besten ein Codex-Abo" vs. R15 §4.8) aufgelöst: Empfehlung profilabhängig (S15), nicht pauschal.

### D074 · Ehrliche Ausgänge sind Pflichtfeature: `blocked`, `not-evaluated`, Budgetstopp und „ich weiß nicht" sind immer erreichbare Zustände
**Entscheidung:** Kein Prompt, kein Hook und kein Vertrag macht „fertig" zum einzigen Ausgang; zwei gleiche Fehler → `blocked`-Marke, kein dritter Versuch; `maxTurns` erreicht → `partial`; Budgetstopp ist ein regulärer Vertragszustand; S12 „Know the wall and say so" liefert bei > 25 % Einheiten in S3(c)/(d) alles andere zuerst und dann genau eine gebündelte Ring-2-Empfehlung mit gemessener Zahl.
**Begründung:** Ralph-Loop und TheAgentCompany zeigen Stubs statt Implementierung, „self-deception" und Vertuschung, wenn nur „fertig" zählt (R07 §1.6; R16 §1.10); JudgeBench: billige Richter sind auf schweren Paaren kaum besser als Zufall — ein billiger Prüfer prüft Form, nie Wahrheit (R16 §1.12).
**Quelle:** R14 §3.12, §2.4 Ausfallverhalten; R16 §3.1 S12, §1.12; R07 §1.6; K §7 („Ich weiß nicht" ist eine vollständige Antwort).
**Erz → Gold:** SOUL-Invariante 6 „Ehrlichkeit über Limits" war Satz; `mission.py` kannte `not-evaluated`. Soul 10 macht jeden Ausgang zum Datenmodell-Zustand mit Monitor-Zeile und misst `wall_precision` (Anteil „Klassenwechsel nötig", den das stärkere Modell wirklich löste).
**Offen/Risiko:** —

### D075 · Universalität: Python-Einstieg, keine Mac-Hacks, Personalisierung aus dem Profil, `ONBOARDING.md` statt `PROJEKT-START.md`
**Entscheidung:** `python -m soul start` ohne zsh; kein `pbcopy`/`open`/`.command`/`/opt/homebrew`; Erstauftrag über `--append-system-prompt-file` oder SessionStart-Hook; Monitor als lokaler Web-Server (SSE auf `events.jsonl`) mit plattformspezifischem Öffner und Fallback Statusline; `shasum` → `hashlib`; `Chriso` → `profile.user.name`, Deutsch → `profile.language`, `OWN_REMOTES` aus Profil; `--strict-mcp-config`/`--setting-sources project` werden Profil-Option „Isolation" (Default aus); Zustand in `${CLAUDE_PLUGIN_DATA}`, nie `$HOME/SOUL`; `doctor.py` läuft auf Linux ohne Mac-Annahmen (Bauplan B5c).
**Begründung:** Universalität der SOUL-Basis ist null (R14 §1.6); `.mcp.json` leer bei `--strict-mcp-config` → der „beste KI-Nutzer der Welt" startet ohne ein einziges Werkzeug des Nutzers (R14 §1.6); Windows-Not-Stopp [unverifiziert] (R14 §2.5).
**Quelle:** R14 §1.6, §2.5, §2.6 Ä5/Ä6/Ä9/S3/S4, §3.10; Bauplan B5c.
**Erz → Gold:** SOUL war Chrisos Mac-Skript. Soul 10 kompiliert aus einer Quelle für jeden Nutzer und jedes Gerät; die Personalisierung wandert vollständig in `profile.json`.
**Offen/Risiko:** O15 (Bau B5c): Not-Stopp auf Windows (Job-Objects/`taskkill /T`) ungeprüft.

### D076 · Der Ressourcen-Atlas ist eine Gedächtnistabelle mit Verfall, Probe und Supersession — kein Dokument; `currency` ist Pflichtfeld
**Entscheidung:** `~/.soul/atlas/` als git-Repo, ein YAML je Anbieter plus `index.yaml`; Eintrag mit `id, kind, provider, access, currency ∈ {api_usd, sub_window, free_daily, local_compute}, price, limits, capabilities, privacy_max, roles (Vorbelegung), probe {cmd, expect, last_result}, source {url, kind, verified_at}, stale_after (Preise 14 d · Kontingente 7 d · Gratis-Tier-Existenz 1 d · Feature-Matrix 30 d), confidence (official 0,9 · +probe 1,0 · secondary 0,5 · contradicted 0,2), status ∈ {verified, secondary, contradicted, expired, retired}, supersedes`; ohne `currency` ungültig; `contradicted`/`expired` sind nie Auswahlgrundlage.
**Begründung:** Drei Währungen sind nicht addierbar (API-Dollar, Abo-Fenster, Gratis-Tiers; R15 §1.1); der Atlas veraltete fünfmal in einer einzigen Recherche (R15 §1.9); Provider-Achse bestimmt das Feature-Set (Gateway/Bedrock ohne Web Search, Routines, Advisor; R15 §1.4). Preisverläufe (DeepSeek ×2 in sechs Wochen) müssen sichtbar bleiben → `supersedes` statt Überschreiben.
**Quelle:** R15 §1.1–1.4, §1.9, §3.1 (Schema, konsolidierte Tabelle), §3.5 (Pflege); R17 §3.4.17.
**Erz → Gold:** `knowledge/forschung-2026-09.md` war personengebundener Fließtext, dessen KORREKTUR-Sektion den Verfall selbst bewies; `doctor.py` prüfte ein hartkodiertes Modell. Soul 10: jeder Eintrag falsifizierbar (Probe), verfallend, versioniert; der Atlas sagt Kosten vorher und das Ergebnis-Log löst auf (N3).
**Offen/Risiko:** Abo-Kontingente sind nirgends offiziell beziffert (Pro/Max ≈ 45/225/900 je Fenster sind Sekundärwerte) — konservative Ampel gelb ab 60 % bis ein `/usage`-Parser steht (R15 §4.1). Atlas-Einträge sind öffentliches Wissen und gehören in „Miguel für alle"; das Profil bleibt privat (R15 §3.5).

### D077 · Der Preflight erhebt L0–L5 ohne eine Frage; Ring 2 wird genau einmal gebündelt gefragt, mit Default und Nutzen, und die Antworten haben ein Verfallsdatum
**Entscheidung:** `soul preflight [--deep]` bei Installation (voll), jedem Sitzungsstart (Delta < 5 s), vor jedem Vorhaben (Projektschicht): P0 Gerät (TTL 30 d), P1 Binaries (1 d; Credential ohne Binary → installieren, nicht fragen), P2 Credential-Namen (nie Werte), P3 Konfiguration und Provider-Ableitung → `features_missing`, P4 Proben ≤ $0,02 je Modell (Widerspruch Doku ↔ Probe → Atlas `contradicted`), P5 Kontingent-Ampel aus Headern, P6 Ring-2-Bündel als **eine** Nachricht nach der Vorlage R15 §3.3 (Abo, API-Budget, Codex-Abo, Gratis-Konten, Datenschutzklassen, Publizieren/Prod), Schweigen wählt den Default, Antworten → `consent.ring2_answers` mit `asked_at`, Verfall 90 Tage; Ergebnis ist immer Datei (`profile.json` + `preflight.log`).
**Begründung:** Zustimmung ist Teil des Designs; nur das Nötigste fragen, gebündelt; alles Technische selbst prüfen (K §11b). `preflight.md` war Prosa ohne Skript, Profil oder Persistenz (R15 §3 Einleitung). Kill-Check: jede Preflight-Zeile speist mindestens eine Auswahlregel — was keine Regel liest, wird nicht erhoben (R15 §3.3).
**Quelle:** R15 §1.10, §3.3 (P0–P6, Vorlage der Bündelfrage); R14 §2.5 Onboarding (fünf Blöcke); R04 §3.12; K §11b.
**Erz → Gold:** SOULs `PROJEKT-START.md` war ein Bauauftrag an Chriso; `doctor.py --init-only` validierte nichts (teuer gelernt). Soul 10 prüft echt (Probe mit Modell-ID), fragt einmal, merkt sich die Antwort und warnt, wenn sie verfällt.
**Offen/Risiko:** O16 (Chriso): wird die Bündelfrage als Bevormundung erlebt? Dann werden mehr Fragen zu Defaults mit stiller Rückmeldung (R15 §4.12d).

### D078 · `profile.json` ist die einzige Stelle, an der Starter, Guard, Gegenstimme, Auswahl und Wissensorgan ihre Parameter lesen — drei Schichten, drei Basen
**Entscheidung:** Schema `soul-profile/1` (R15 §3.2): `user {name, language, agent_name, miguel_tier ∈ {public, full}}`, `device` (basis observed, TTL 30 d, `local_model_class ∈ {none, small, medium, large, xl}`), `runtime` (claude_code version/provider/auth/`features_missing`, binaries, credential-Namen, configs), `accounts[]` (je Zugang `basis ∈ {observed, probed, declared, declared_willing, declared_declined, absent}`, `quota {currency, state, reset_at}`), `privacy {classes P0–P3, allowed, training_optout_confirmed}`, `consent {accepted_at, standing_mandates, ring2_core, ring2_project, ring2_answers}`, `selection {gegenstimme_backend, max_concurrent_workers, isolation, fit_matrix}`, `history[]`; Schichten `device → user → project`, die speziellere überschreibt; `declared` ohne `probe` trägt keine teuren Schritte; `atlas_version` steht im Profil und in jedem Auswahl-Log.
**Begründung:** SOULs Starter kannte `PROFILES = {vollgas, probe}` als Konstante (R14 Ä5); Personalisierung war im Kernel hartkodiert (R14 §1.6). Ein Profil, das alle Organe lesen, macht Universalität und Zustimmung im Design zu Daten statt zu Prosa; `miguel_tier` entscheidet den Gedächtnis-Mount (D040).
**Quelle:** R15 §3.2 (vollständiges Schema mit Regeln); R14 §2.5, §2.6 Ä5/N6/N7; R04 §3.12; K §10, §11b.
**Erz → Gold:** `doctor.py` schrieb drei Statusklassen für ein Modell. Soul 10 schreibt ein Profil mit TTL und Basis je Feststellung — beobachtet, geprobt oder erklärt sind unterscheidbar, und Verfall ist Feld, nicht Vermutung.
**Offen/Risiko:** Secrets erscheinen nie im Profil; die Guard-Kategorie `secrets-exfiltration` prüft Preflight und Profil selbst (R15 §3.2). `features_missing` ist nur so gut wie `tools.yaml` (R15 §4.11).

### D079 · Auswahl ist Code: fünfzehn Regeln S1–S15 in `conductor/select.py`; jede Wahl wird geloggt und aufgelöst
**Entscheidung:** S1 Währung vor Modell (Ampel rot = gesperrt) · S2 Rolle bestimmt Klasse (dirigent stärkstes Tool-Use-Modell ≥ 200k; planer/pruefer stark read-only; ausfuehrend mittel; bulk billigst mit JSON; deterministisch → kein Modell) · S3 Unabhängigkeit der Gegenstimme · S4 Beleg ≠ Urteil (Prüfer hat nie erzeugt) · S5 Selbstkonsistenz-Schranke vor Klassenaufstieg · S6 Datenschutz ist Filter, nicht Gewicht · S7 Parallelität aus RPM · S8 Fenster-Ökonomie · S9 Cache-Disziplin · S10 Batch für alles ohne Uhr · S11 unbekannt = strong, dann messen; Passungsmatrix überschreibt Vorbelegung ab n ≥ 20 je Zelle · S12 Frame-Stufe nach Nutzenprognose · S13 Fallback ist Kette · S14 `selection{…predicted}` + `outcome{…}`, ohne outcome not-evaluated · S15 Ring 2 nur gebündelt, mit Nutzen.
**Begründung:** Regeln, die kein Check werden können, gehören nicht hinein („Algorithmus schlägt Willensakt"); `modelTier.ts` riet Klassen aus Namen (K §5 N4). Routing und Kaskaden liefern 2× bis 98 % Kostenersparnis bei gehaltener Qualität, wenn ein billiges Schwierigkeitssignal existiert (RouteLLM, FrugalGPT, MoT; R16 §1.2).
**Quelle:** R15 §1.11, §3.4 (Wortlaute S1–S15, Pseudocode `choose()`); R16 §1.2; R14 §3.11; K §5 N4.
**Erz → Gold:** `forschung-2026-09.md` hatte die Prosa-Regel „Fan-outs auf kleinere Modelle"; Chrisos Praxisregel „Fable bis 50 % Wochenlimit". Soul 10 macht Auswahl zu einem geloggten, kalibrierten Mechanismus mit `predicted` vs. `outcome` (N3/N4).
**Offen/Risiko:** n ≥ 20 je Zelle ist für Einzelnutzer in Monaten kaum erreichbar; realistisch werden 5–8 Zellen belastbar — N4 wirkt für Vielnutzer oder mit geteilten anonymisierten Messungen (Produktentscheidung, O17 Chriso).

### D080 · Drei Währungen werden getrennt gebucht; Cache ist Kontingent-Multiplikator; Fenster verfallen und werden geplant, nicht erlitten
**Entscheidung:** Budget-Ledger je Währung (API-Dollar mit Monats-Cap, Abo-Fenster 5 h + Wochenkappe familiengetrennt, Gratis-Tiers RPM/RPD/TPD täglich); Vorbereitung und Bulk ans Ende eines Abo-Fensters; Tages-Töpfe durch Hintergrundarbeit leeren; „Opus limit" → Familienwechsel, „session/weekly limit" → Währungswechsel oder eingeplantes Warten (`autoContinueAtUsageLimit`); stabiler Präfix (tools → kernel → memory briefing → task), Effort/Tools/System innerhalb einer Session nie ändern, 1-h-TTL im Abo; Cache-Miss ≥ 10 % in `/usage` → Präfix prüfen; nie mehr parallele Worker als das niedrigste RPM erlaubt.
**Begründung:** Cache-Hits zählen nicht auf ITPM („2M ITPM bei 80 % Hit = effektiv 10M/Minute"); Fable 5.1 Hit 0,025× (R15 §1.2); Limits sind familien- und modellgetrennt (R15 §1.3); Token erklären 80 % der Leistungsvarianz, ohne Cache 10× Preis (R14 §3.11); Cerebras 5 RPM → ein Worker (R15 §1.5).
**Quelle:** R15 §1.1–1.3, §1.5, §3.4 S7–S10, §4.1; R16 §1.6–1.7, §3.1 S7–S10; R14 §3.11; R10 §3.5 Knappheits-Regeln.
**Erz → Gold:** SOUL setzte `ENABLE_PROMPT_CACHING_1H` (Gold, bleibt) und sonst nichts. Soul 10 führt den Kalender über drei Währungen (E16, D146) und misst `cache_hit_share` (Vorhersage ≥ 0,85 mit Prefix-Vertrag vs. < 0,6 ohne; Konfidenz 0,8).
**Offen/Risiko:** Cache-Aussagen gelten für die API; Claude Code ≥ 2.1.260 behandelt Effort-Wechsel cache-schonend (K15). Falsifikation: werden Cache-Hits auf ITPM angerechnet, bricht S9 (R15 §4.12b).

### D081 · Das Scarcity-Modul (S1–S13) gilt nur unterhalb der Decke: jede Regel trägt ihre „gilt nicht"-Zeile
**Entscheidung:** `structure/bundles/dirigent/scarcity.md` mit den 13 englischen Regeln aus R16 §3.1 wird geladen, wenn `profile.json` meldet: stärkste Klasse < frontier, Fenster < 30 %, Gratis-Tages-Budget in Nutzung oder local-only; bei Frontier-Modell mit > 50 % Fenster und ohne Datenschutz-Constraint werden S3–S6 übersprungen (Deckeneffekt); der Katalog (R16 §2.7, 20 Techniken) wird nie als Checkliste „alle an" gebaut.
**Begründung:** Struktur wirkt dort am stärksten, wo die Mittel am schwächsten sind (+23,3 pp gpt-oss-120b, +12,2 pp 20b, nichts bei 93–97 % nackt; K §3; R16 §1.4); Komponenten wirken nicht additiv, „alles an" verliert (R10 §1.6; R16 §4.6). Meisterschaft unter Knappheit ist belegt für zerlegbare, mechanisch prüfbare Arbeit, nicht für Urteilsarbeit ohne Verifizierer (R16 §1 Kurzfassung, §4.10).
**Quelle:** R16 §1.1–1.5, §3.1 (Wortlaute S1–S13), §3.2 (Pläne A/B/C), §3.3 (Messplan P1–P6), §4.6, §4.10; K §11c.
**Erz → Gold:** SOULs Starter setzte pauschal Fable 5.1 + 1M + `ultracode` und setzte Fülle voraus. Soul 10 hat ein Modul, das mit wenig auskommt, drei Beispielpläne (nur Gratis-Tiers / lokal 8B + Cloud-Prüfer / Pro-Abo ohne API) und einen Messplan mit `pass@budget` und `cost_per_accepted_unit`.
**Offen/Risiko:** Frame + SC: additiv, redundant oder gegenläufig? Niemand hat Frame + SC gegen SC allein gemessen (R16 §4.2; O18 Eval). Falsifikation: P1 und P5 scheitern beide oder `escalation_precision` < 0,4 bei zwei Modellen → vom Modul bleiben nur S7–S10 (reine Ökonomie).

### D082 · Zerlegen bis prüfbar, sondieren vor eskalieren, Kaskade als Standardpfad
**Entscheidung:** Vor jeder Delegation wird das Ziel in Einheiten mit mechanischer Abnahme (Test, Schema, exakte Antwort, Diff gegen Feature-Liste) zerlegt; eine Einheit ohne Check bleibt beim stärksten Modell oder bekommt einen Check; je Einheit drei billige Läufe (lokal/Gratis): (a) konvergieren + bestehen → akzeptieren, (b) Dissens + prüfbar → mehr Samples/Kaskade zur Mittelklasse, (c) Dissens + nicht prüfbar → andere Familie oder stärkste Klasse, (d) konvergieren + scheitern → Klassenwechsel, nicht mehr Samples; das Ergebnis ist das Schwierigkeitslabel der Einheit.
**Begründung:** Wiederholtes Sampling skaliert Abdeckung über vier Größenordnungen (SWE-bench Lite 15,9 % → 56 % mit 250 Samples), aber nur mit automatischem Verifizierer; Mehrheitsvotum plateauiert (R16 §1.1); compute-optimale Strategien schlagen ein 14× größeres Modell nur bei „somewhat non-trivial success rates" (Snell; R16 §1.1); Antwort-Konsistenz des schwachen Modells ist dasselbe Signal wie Chrisos Entropie (AUC 0,968; R16 §1.2).
**Quelle:** R16 §1.1–1.3, §3.1 S2–S3, §3.3 (P3 `escalation_precision` ≥ 0,6, Konfidenz 0,6); R10 §1.3 (DART).
**Erz → Gold:** Keine Sondierung vor Delegation, keine Kaskade im Erz. Soul 10 macht aus dem Dissens-Signal einen Standardpfad und misst `escalation_precision`/`escalation_recall`.
**Offen/Risiko:** Benchmark-Ersparnisse (FrugalGPT 98 %) stammen aus Aufgaben mit exakter Antwort; für offene Artefakte ist die Kaskade nur so gut wie der deterministische Prüfer (R16 §4.1).

### D083 · Verifikation billigst zuerst: deterministisch → billiges Modell für Form → andere Familie für Urteil; ein billiges Modell entscheidet nie Wahrheit
**Entscheidung:** Reihenfolge der Prüfung je Einheit: Compile/Tests/Lint/Schema/Stub-Regex/Diff gegen Brief → billiges Modell für Form, Vollständigkeit, Widerspruch → andere Familie für Urteil; „Exit 0" ist not-evaluated, bis die deterministische Sprosse gelaufen ist; ein zweiter Aufruf desselben Modells nur mit Tool-Befund (Draft → Tool-Befund → Revise), sonst S3(c).
**Begründung:** LLM-Richter sind auf schweren Paaren „just slightly better than random guessing" (JudgeBench; R16 §1.12); intrinsische Selbstkorrektur verbessert nicht (Huang; R01 §1.5); externe Prüfsignale (Tests, Retrieval, isolierte Verifikationsfragen) sind der einzige belegte Prüfweg (R01 §3.6).
**Quelle:** R16 §1.12, §3.1 S4–S5; R01 §1.5, §3.6; R14 §3.6; K §2 („Exit 0 ist not-evaluated").
**Erz → Gold:** SOULs Verifizierer war ein Agent mit Prompt. Soul 10 staffelt die Prüfung nach Kosten und Belegkraft und misst `verifier_catch_rate` (Anteil der von Sprosse 1 gefangenen Fehler).
**Offen/Risiko:** Determinismus ist kein Ersatz für Wiederholung: Temperature 0 lieferte 80 verschiedene Completions in 1.000 Läufen — Reproduzierbarkeit entsteht durch Artefakte (Dateien, Tests, Hashes), nicht Sampling-Parameter (R16 §1.8).

### D084 · Lokale Modelle: Klasse aus Hardware, Aktivierungs-Gate mit Selbsttest, nie Dirigent, Q4_K_M als Default
**Entscheidung:** `local_model_class` aus RAM/VRAM (none / small ≤ 9B / medium ≤ 20B / large ≥ 32 GB oder ≥ 24 GB VRAM / xl ≥ 80 GB VRAM); Modelfile mit `num_ctx` explizit; nur Kernel S, formatneutral; Pflicht-Selbsttest 3 × 10 gegen nackt vor Aktivierung, Ergebnis ins Kalibrierungsgedächtnis, bei Verlust läuft das Modell nackt; Rollen: Datenschutz-Stufe P2, Formatprüfer, Entropie-Sonde, Bulk-Ausführung mit Tests; Q4_K_M Standard, Q5_K_M/Q6_K bei Code/Reasoning wenn Speicher reicht.
**Begründung:** Evidenz für kleine Modelle ist dünn und architekturabhängig (Qwen3-4B stabil, Gemma-3-4B/Granite kollabieren unter Multi-Task-Prompts; R04 §1.11); Chrisos Messung zeigt Richtungsumkehr und Formatschaden (K §3); gpt-oss-20b braucht ~16 GB, 120b 80 GB VRAM (R15 §1.8); Aider-Polyglot: lokale ≤ 32B ≈ 40 % vs. Frontier 88 % bei ≈ 1/40 der Kosten (R16 §1 Kurzfassung); Q4_K_M ≈ 0,57 GiB je Mrd. Parameter, Perplexität 7,56 vs. FP16 7,32 (R17 §1.9, Sekundär).
**Quelle:** R04 §1.11, §3.8; R15 §1.8, §2.1.6; R16 §1.3, §1.11, §3.2 Plan B; R17 §1.9; K §3.
**Erz → Gold:** `modelTier.ts` riet aus Namen. Soul 10 misst Passung (N4), gibt lokalen Modellen Rollen, in denen Sampling gratis ist (Plan B: SC@3–5 mit Tests als Selektor), und erklärt kein 8B-Modell zum Architekten (R16 §4.10).
**Offen/Risiko:** „S schadet lokal nicht" ist bis zur eigenen Messung Hypothese (R04 §4). Hardware-Faustregel unverifiziert; Schwellen per `ollama run` mit Zeitmessung kalibrieren (R15 §4.6).

### D085 · Das Wissensorgan hat drei Schichten und zwei Sichtbarkeiten; ein Dossier ist ein Ordner nach Skills-Schnitt; der Index wird generiert, nie geschrieben
**Entscheidung:** `wissen/handwerk/` (universell, public, lang haltbar), `wissen/atlas/` (R15-Daten, public außer Kontingentstände, kurz haltbar), `wissen/profil/` (Nutzer/Projekt, private, aus Preflight); Dossier = `DOSSIER.md` (Frontmatter + Kurzform ≤ 160 Tokens + Langform ≤ 5.000) + `quellen.jsonl` + `regeln.md` (englische Bausteine für Kernel/Verträge) + `proben/` + `SUPERSEDED/`; derselbe Ordner dient als Claude-Code-Skill, `AGENTS.md`-Import und Inline-Kurzform; `INDEX.md` aus Frontmatters, L0 ≤ 500 Tokens für 12 Dossiers, abgelaufene mit ⚠ und nie in L1; Erstbestand: die zehn Skelette aus `docs/research/wissen/` 1:1.
**Begründung:** SOULs `knowledge/` ist Gold im Inhalt, Willensakt in der Mechanik („Lies bei Aufgabenstart, was die Aufgabe braucht" ohne Trigger, Verfall oder Herkunftsstufen; R17 §1.1); Anbieter-Konsens ist dreistufig-lazy mit Auslöser-Index (Metadata ~100 Tokens → Instructions < 5.000 → Resources; R17 §1.2); Karpathys LLM-Wiki (raw/wiki/schema) ist der nächste Verwandte, ohne Herkunft, Verfall, Kalibrierung, Nutzungsmessung (R17 §1.3).
**Quelle:** R17 §1.1–1.3, §1.5, §3.1; R14 §2.6 Ä8/Ä11; R15 §3.5 „Zwei Stufen, ein Atlas".
**Erz → Gold:** `knowledge/*.md` + `playbooks/*.md` als Leseempfehlung. Soul 10: Ordner mit Frontmatter, Verfall, Quellen-IDs, Regel-Bausteinen, Proben — der Build für „Miguel für alle" kompiliert nur `public`, der Linter blockiert `private`-Verweise aus `public`.
**Offen/Risiko:** Zwei Domänen bewusst ohne Dossier (Schreiben/Kommunikation, Design/Produkt) — Kill-Check ohne Lückenbeleg; der Lückenzähler fordert sie ein, wenn nötig (R17 §4.8).

### D086 · Laden ist Mechanismus: `wissen_router.py` im UserPromptSubmit, Stufen L0–L3 an die Tiefenstufen gekoppelt, Subagenten-Preload über `skills:`, Lückenzähler
**Entscheidung:** Hook (< 200 ms, ohne Netz): Signale (R10-Router + 11 Domänensignale) → Index-Match → Verfallsprüfung → ≤ 3 Zeilen Kontext mit L1-Kurzformen (max. 3) und L2-Angebot (max. 2) → JSONL-Log `{ts, signale, kandidaten, geladen_stufe, versionen}`; ohne Log-Zeile hat kein Laden stattgefunden; Kernel-Regel für die Nachwahl (≤ 40 Wörter: nach dem Vervollständigen des Auftrags den Index auf eine vom Hook nicht erkannte Domäne prüfen, höchstens eine Kurzform, nie mehr als zwei Langformen je Aufgabe); Kopplung: trivial → L0; Standard → L1; durable/irreversible/architecture → L1+L2+L3 für entscheidungsrelevante Atlas-Zahlen; Ebenen 3–6 → nur `regeln.md`-Bausteine im Vertrag; Agent-Frontmatter `skills:` lädt für Verifizierer `evaluation-ehrlichkeit`, für Rechercheure `recherche-quellenpflicht` + `sicherheit-autonome-agenten`; Signal ohne Index-Treffer → `luecke`-Ereignis, ≥ 3 in 7 Tagen → Dossier-Kandidat.
**Begründung:** Dossiers sind nie Startkontext (Budgets: CLAUDE.md < 200 Zeilen, 5–6 Skills im Listing; R17 §1.2, §4.6); Query nach der Verstehensphase ist besser als der Roh-Prompt (Voyager; R17 §1.11); „If a human engineer can't definitively say which tool should be used … an AI agent can't be expected to do better" — Dossier-Grenzen müssen für Menschen eindeutig sein (R17 §1.11).
**Quelle:** R17 §1.2, §1.11, §3.2 (Punkte 5–9), §4.6; R10 §3.2 Hook; R14 §2.6 Ä8.
**Erz → Gold:** „Playbook laden" war Willensakt. Soul 10 reicht Kurzformen per Hook, lädt Langformen per Pfad, misst Trefferquote Hook vs. Skill-Router und zählt Lücken.
**Offen/Risiko:** Zehn Dossiers als modell-aufrufbare Skills sprengen das Listing — nur 2–3 Bündel-Skills (`wissen-handwerk`, `wissen-atlas`) bleiben dort (R17 §4.6; D005).

### D087 · Pflege ist Linter + Schedule + Konto: Kandidaten-Quarantäne, Supersession mit Rückbau, Nutzungskonto `gewirkt/geladen`, vorregistrierte Falsifikation am 2026-12-06
**Entscheidung:** `soul wissen lint` (zehn Regeln: Frontmatter, Zahl ohne Stufe/Datum, kein [U] in Kurzform, Budgets, Duplikate, Verfall, Quellen-IDs, Widersprüche, verbotene Wörter, Sichtbarkeitsleck) täglich und als PreToolUse-Guard vor jedem Schreibzugriff auf `wissen/`; Schreibzugriff ohne `log.jsonl`-Eintrag wird blockiert; Routinen: täglich Lint + Verfallsvorschau ($0), wöchentlich Atlas-Prüfwelle in frischer Session ohne Netz-Schreibrecht (≤ 10 Fetches, Batch + 1-h-Cache), monatlich Nutzungskonto + Kill-Check + Placebo-Stichprobe (10 Aufgaben × 2 Arme × 3 Läufe); `wissen/_candidates/` mit `trust ∈ {untrusted, document, user, measured}`, untrusted nur in Session ohne Netz und Secrets promotet; `soul wissen promote` erzeugt Version mit `rollback`-Befehl, RETRACTED nie wieder promotbar; `gewirkt/geladen < 0,1` über 60 Tage → L0-only, 180 Tage ohne Nutzung → `SUPERSEDED/`; Falsifikation: zeigt die Placebo-Stichprobe über 3 Monate keine Wirkung geladener Kurzformen, ist das Handwerks-Wissensorgan Verwaltung — dann bleibt nur `atlas/`.
**Begründung:** Wissen veraltet gemessen schnell, die gefährlichste Form ist die plausible Zahl (146.932 halluzinierte Zitate 2025; R17 §1.4); Pflege muss mechanisch sein, weil der Prüfer zuerst wegfällt (868 Slop-Notes ohne Gate; R17 §1.12); Live-Recherche ist Injektionsfläche → Destillat-Quarantäne (R17 §1.6).
**Quelle:** R17 §1.4, §1.6, §1.12, §3.3 (Punkte 10–14), §3.4.19, §4.3, §4.7; K §7 (Zahlen nur mit Herkunft).
**Erz → Gold:** `forschung-2026-09.md` mit KORREKTUR-Sektion. Soul 10 sperrt Abgelaufenes statt es still zu laden und misst, ob ein Dossier je das Ergebnis geändert hat (drei Signale: `used:`-Referenz, Prüferfrage, Blind-Stichprobe — die Selbstauskunft ist nur eines davon).
**Offen/Risiko:** Wer misst „gewirkt"? Die `used:`-Referenz ist Selbstauskunft — dieselbe Belegklasse, die für Bewusstsein abgelehnt wird; die Blind-Stichprobe trägt (R17 §4.7). Pflegekosten sind Schätzung (≈ $0,30/Woche), erste Monatsauswertung liefert die Zahl.

### D088 · Die Haltung „bester KI-Nutzer der Welt" ist eine Kernel-Zeile plus beschafftes Wissen; der Nutzer-MCP-Bestand ist Kandidat, nicht Pflicht
**Entscheidung:** Der Anker trägt eine Zeile zur Haltung (kennt Systeme, bereitet vor, baut, organisiert Werkzeugketten) und die Nachwahl-Regel (D086); alles Weitere ist Wissensorgan, Atlas und Live-Recherche; erkannte MCP-Server des Nutzers erhalten je einen Kontextkosten-Eintrag (`/context`-Messung) und werden als Kandidaten geführt — Discovery, nie ungeprüft aktivieren.
**Begründung:** Modellwissen hat Stichtage: für Handwerkswissen plausibel, für Atlas-Wissen falsch (Modellnamen/Preise ändern monatlich; R17 §4.2) — das Wissensorgan ist dort am dichtesten, wo das Modell am wenigsten weiß. „Der beste KI-Nutzer nutzt alles" vs. Isolation: fremde MCPs können schlecht oder kontextteuer sein (R15 §4.10).
**Quelle:** K §11a; R17 §3.4.16, §4.2; R15 §4.10; R14 §3.9; R12 K12.
**Erz → Gold:** Die Vision setzte das Wissen im Modell voraus. Soul 10 beschafft, organisiert und pflegt es — und misst, ob Handwerks-Dossiers überhaupt tragen (D087 Falsifikation).
**Offen/Risiko:** Konflikt K12 (Modell weiß mehr als jeder Mensch vs. Stichtage) aufgelöst: Handwerk aus dem Modell, Fakten aus dem Atlas.

---

## H · Claude-Code-Bindung / Plugin

### D089 · Kernel-Zustellung in drei Ringen, weil Plugins keine CLAUDE.md und keine Rules liefern können; `InstructionsLoaded` ist der Trigger-Nachweis
**Entscheidung:** Ring 1 (Plugin, immer): `SessionStart`-Hook mit Matcher `startup|resume|clear|compact` druckt Anker + Selbstmodell-Kurzform als Plain-stdout; Ring 2 (Plugin, optional): `output-styles/ordnung.md` mit `keep-coding-instructions: true` legt Ton/Anti-Hedging in den System-Prompt (cache-stabil, überlebt Compaction, gilt nicht für Subagents); Ring 3 (Installer, außerhalb des Plugins): `~/.claude/rules/ordnung.md` (unscoped Rule, User-Scope) **oder** im Starter `--append-system-prompt-file`; der Installer-Skill `/ordnung:install` legt Ring 3 an und berichtet, was `/context` zeigen muss; ein `InstructionsLoaded`-Hook loggt, ob die Rule geladen wurde.
**Begründung:** Plugins können keine CLAUDE.md, keine `.claude/rules/*.md` und (außer `agent`) keine settings.json liefern (R03 §1.1); Compaction überlebt: System-Prompt/Output-Style, Root-CLAUDE.md + unscoped Rules, aufgerufene Skill-Bodies, `SessionStart:compact`-Hooks (R03 §1.2); Plain-stdout wird nur bei `UserPromptSubmit`, `SessionStart`, `PostModelSwitch` Kontext (R03 §1.3).
**Quelle:** R03 §1.1–1.3, §3.1.1, §4.1–4.2; D050.
**Erz → Gold:** SOUL lieferte den Kernel per CLAUDE.md im Projektordner (nur dort gültig). Soul 10 stellt ihn über drei Kanäle zu und weist mechanisch nach, welcher gegriffen hat — „Code ohne Trigger = toter Mechanismus" wird je Ring geprüft.
**Offen/Risiko:** O5 (Bau B5a): erscheint `SessionStart:compact`-Output nach Auto-Compaction? Sonst ist Ring 3 Pflicht, nicht Option. Falsifikation R03 §4.1: kann ein Plugin doch Rules liefern, entfällt Ring 3.

### D090 · Der Hook-Plan ist vollständig, fail-open außer bei den drei Blockade-Hooks, und jeder Hook loggt seinen Aufruf
**Entscheidung:** `SessionStart` (Anker, Briefing ≤ 60 Zeilen, Snapshot-Kurzform bei `compact`) · `UserPromptSubmit` (Router + Wissens-Router, ≤ 3 Zeilen, Timeout 10 s, Ziel < 200 ms) · `PostToolUse`/`PostToolUseFailure` (Episoden nach `inbox/`, Herkunfts-Marker) · `SubagentStart` (Vertrag schreiben, Kurzidentität, Log) · `SubagentStop` (Ernte typisieren — Default gebündelt im Takt B) · `TaskCompleted` (Receipt-Prüfung, Exit 2) · `Stop` (Reflexion Takt A, `async: true`, Timeout 120 s; Exit 2 nur bei `delivered` ohne Receipt) · `PreCompact` (Snapshot `state.json`, kein stdout) · `SessionEnd` (nur Flush, 1,5 s) · `InstructionsLoaded`/`ConfigChange` (Log); Dispatcher `bin/ordnung-hook.py` (Python 3 stdlib, `argv[1]` = Modus); Exit 0 überall außer den Blockade-Hooks `TaskCompleted`, `Stop`(Receipt), PreToolUse-Guard; Hooks schreiben nur nach `inbox/` (kein DB-Lock im Hot Path); jeder Hook ≤ 200 ms außer `Stop`.
**Begründung:** `SessionEnd` hat 1,5 s Budget, `Stop` 600 s; `PreCompact`-stdout landet nicht im Kontext (R03 §1.3); `Stop` darf nicht `continue: true` zurückgeben außer bei harten Abnahmekriterien (Schleifengefahr; R03 §3.1.4); Gedächtnis darf die Arbeit nie blockieren (R05 §3.5). Der `post-tool`-Zweig existierte in SOULs `events.py`, war in `settings.json` aber nicht registriert (R14 §1.3, Ä4).
**Quelle:** R03 §1.3–1.4, §3.1.4–3.1.5, §3.3 `hooks.json`; R05 §3.5 (Tabelle Sitzungs-Lebenszyklus); R14 §2.4 Ausfallverhalten, §2.6 Ä4/N2/N3; D031, D072.
**Erz → Gold:** SOUL hatte vier Hooks (SessionStart, PreToolUse, Stop, PreCompact) und Ermahnungen für den Rest. Soul 10 registriert elf Events und misst G2 (Anteil Episoden aus Hooks; 0 = Bug).
**Offen/Risiko:** Hook-Kosten bei Fan-outs (16 Agenten × 50 Calls = hunderte Python-Prozesse/Minute) — `if`-Feld und Matcher begrenzen; messen (R14 §4). K17 (Ernte-Typisierung je Delegation kostet Kontingent) aufgelöst: gebündelt im Takt B.

### D091 · Plugin-Layout nach R03-Blaupause: Manifest mit `userConfig`, eigener Marketplace im Repo, Zustand außerhalb des Plugins
**Entscheidung:** `plugin/.claude-plugin/{plugin.json, marketplace.json}`, `plugin/skills/<bündel>/SKILL.md` (sechs Bündel + `install`, `reflect`, `status` als `user-invocable`-only), `plugin/agents/` (conductor, kritiker, verifizierer, builder, researcher, installer, writer, drift-wache, recovery, gegenstimme), `plugin/hooks/hooks.json`, `plugin/output-styles/ordnung.md`, `plugin/bin/` (Dispatcher, Router, Render-Self), `plugin/workflows/` (verify-fanout, research-crosscheck); `userConfig`: `identity_name` (Default leer = namensoffen), `memory_dir` (Default `~/.soul`); Version nur in `plugin.json`, Release per `claude plugin tag --push`; Laufzeitdaten in `~/.soul/` (Zustand) bzw. `${CLAUDE_PLUGIN_DATA}` (Caches), nie im Plugin-Ordner.
**Begründung:** `claude plugin validate --strict` akzeptiert das Skelett — prüft in 2.1.261 aber nur das Manifest (Negativtest mit kaputtem SKILL.md: `success: true`; R03 §1.12); Frontmatter wird im echten Lauf per `/context`/`/skills` geprüft. Skill-`name` = Verzeichnisname (Standard-Pflicht; R03 §1.6).
**Quelle:** R03 §1.6, §1.12, §3.2 (Verzeichnislayout), §3.3 (Skelette), §3.4 (Installation, SOUL-Einbindung a/b); R14 §2.5 Plugin-Verpackung; D005, D042, D052.
**Erz → Gold:** SOUL war ein Repo-Checkout mit `.claude/`-Ordner. Soul 10 ist ein validiertes Plugin mit Marketplace, das per `--plugin-dir` (Messphase, exakte Version) oder Marketplace-Install (Verteilung) läuft.
**Offen/Risiko:** `pluginConfigs`-Schlüssel ist die Plugin-ID (`name@marketplace`); bei `--plugin-dir` stattdessen `CLAUDE_PLUGIN_OPTION_*`-Env (R03 §3.4). Bauplan B6: `claude plugin validate --strict plugin/` ok + `claude plugin details` Token-Kosten im Log.

### D092 · Subagenten erreichen den Kernel nicht automatisch: jede Agent-Definition führt `skills: [ordnung:kernel]`, der Vertrag trägt die Kurzidentität
**Entscheidung:** Nicht-Fork-Agents erben weder Output-Style noch aufgerufene Skills noch Hook-Kontext; deshalb `skills:`-Preload in jeder Ordnungs-Agent-Definition, Plugin-Hooks laufen in Subagents (`SubagentStart` loggt), Kurzidentität ≤ 15 Zeilen im Vertrag (D036); SOULs bestehende Agents bekommen dieselbe Zeile als Diff-Vorschlag, nicht still; die `gegenstimme` ist der einzige Agent mit `memory: user` (eigenes MEMORY.md im System-Prompt).
**Begründung:** R03 §1.7 (`memory: user` als einziger dokumentierter Weg, eine persistente Notiz in den System-Prompt eines Agenten zu legen); R03 §3.1.7–3.1.8; Identität wird sonst nicht propagiert (OpenClaw Issue #50263; R05 §1.7).
**Quelle:** R03 §1.7, §3.1.7–3.1.8, §3.3 `agents/gegenstimme.md`; R05 §1.7, §3.2; R17 §3.2.8.
**Erz → Gold:** SOULs Agents (kritiker, verifizierer …) bekamen Rolle per Prompt, keinen Kernel. Soul 10 nutzt den nativen `skills:`-Mechanismus (in R14 als ungenutzt benannt) und misst Kernel-Präsenz je Ebene über `SubagentStart`-Log.
**Offen/Risiko:** Plugin-Agent-Felder differieren zwischen Doku-Seiten (`effort: low|medium|high` vs. `low…max`; `memory: true` vs. `user|project|local`) — Blaupause folgt der sub-agents-Seite (R03 §4.4).

### D093 · Permission-Profil: Default `auto` mit Deny-Regeln für Ring 2; `bypassPermissions` nur im Container-Profil; Ordnung setzt keine Permission-Keys
**Entscheidung:** Soul 10 läuft standardmäßig in `auto` (Pro/Max/Team; Klassifikator, Rückfall nach 3 Blocks in Folge/20 gesamt) mit `permissions.deny` für die Ring-2-Kategorien; Profil S (bypass + Guard) nur, wenn `profile.selection.isolation` einen Container/VM/Worktree-Sandbox meldet oder Chriso es im Onboarding ausdrücklich wählt; das Plugin setzt keine Permission-Keys (kann es nicht); Anti-Rückfrage/Anti-Hedging leben in Anker + Output-Style, nicht im Modus; unbeaufsichtigte Läufe erhalten immer Prüfsignal (`Stop`-Hook ≤ 8 Blocks), Iterations- und Kostenobergrenze, Worktree/Container.
**Begründung:** Autonomie ist modusunabhängig — `auto` „nudges" nur gegen Rückfragen (R03 §1.9); Deny und Blockade-Hooks gelten in jedem Modus, Allow-Regeln in bypass nicht (R03 §1.8); der Auto-Klassifikator blockiert genau die Fälle, die Schäden verursachten (`rm -rf "$VAR"`, Loops ohne Sandbox; R12 §1.9, K4); Ralph-Loop: $50–100+ je 50 Iterationen ohne Grenze (R12 §1.9).
**Quelle:** R03 §1.8–1.9, §3.1.9; R12 §1.9, K4, W4; R07 W1; K §6.
**Erz → Gold:** SOUL: bypass auf dem Mac ohne Sandbox. Soul 10: Isolation ist keine Bremse des Denkens, sondern die Bedingung, unter der Freiheit ohne Vertrauensvorschuss möglich ist (Soul-5.0-Satz); die Modus-Wahl ist Profilentscheidung, im Installer-Text mit Doku-Warnung.
**Offen/Risiko:** `defaultMode: auto` wirkt nicht aus Projekt-Settings (R03 §1.8) — Installer setzt User-Scope. Konflikt K4 (siehe D054/D064).

### D094 · Output-Style: im SOUL-Betrieb werden Ordnungs Ton-Regeln in `soul-dirigent` gemergt; `force-for-plugin: true` gilt nur im portablen Kern
**Entscheidung:** Zwei Output-Styles können nicht gleichzeitig gelten („first one loaded" gewinnt); der Compiler erzeugt für das SOUL-Profil einen gemergten Style (Anti-Performance, Deutsch, Direktheit, Formatschutz, einzige erlaubte Meta-Zeile = Annahme-/Abweichungszeile) ohne `force-for-plugin`, für den portablen Kern `ordnung.md` mit `force-for-plugin: true`; beide aus demselben Quellblock `structure/kernel/style.md`.
**Begründung:** R03 §3.3 (Konflikt benannt), §4.9; Output-Style ist der einzige cache-stabile System-Prompt-Kanal eines Plugins (R03 §3.1.1 Ring 2).
**Quelle:** R03 §3.1.1, §3.3, §4.9; R02 Regel 6–8 (deklarativ, Emphase einmal); K §2 (Output-Style `soul-dirigent`).
**Erz → Gold:** SOULs `soul-dirigent` ist imperativ („Du machst …"; D008). Soul 10 schreibt den Style deklarativ mit Gründen und lässt ihn aus einer Quelle kompilieren — kein Auseinanderdriften zweier Stile.
**Offen/Risiko:** Ob der gemergte Style Ordnungs Regeln in SOUL-Sessions tatsächlich trägt, zeigt `/context`; Kill-Check nach dem ersten Smoke-Run.

### D095 · Der Eval-Runner ist headless: `--bare`, `dontAsk`, Result-JSON als Roh-Artefakt, Gültigkeitsgate je Zelle
**Entscheidung:** `claude --bare -p --output-format json --permission-mode dontAsk --permission-prompts none --max-turns N --max-budget-usd X --model $MODEL --no-session-persistence [--append-system-prompt-file arms/$ARM.md | --plugin-dir ./plugin] "$TASK"`; Gültigkeitsgate: `.is_error == false`, `.modelUsage` enthält die erwartete Modell-ID, bei Arm O+ `system/init.plugins[].name == "ordnung"` (stream-json) — sonst „nicht gemessen"; `claude plugin eval --ablation with-without` nur als Smoke-Test; Weglass-Test der sechs Frame-Punkte als Arm-Familie O1…O6 mit identischem Runner.
**Begründung:** `--bare` ist der empfohlene und künftig Default-Modus für `-p` (keine Hooks/Plugins/CLAUDE.md/Auto-Memory; Auth nur API-Key); Result-JSON enthält `modelUsage`, Cache-Felder, `subagent_stats`, `permission_denials` (lokal verifiziert; R03 §1.11); Roh-Artefakt-Zwang: Datei + Modell-ID, sonst „nicht gemessen" (K §3).
**Quelle:** R03 §1.11, §3.1.11, §3.4 Eval-Runner, §4.5; R08 §3.1 Punkt 4 (exakte Modell-IDs); K §3.
**Erz → Gold:** Chrisos Eval-Strecke (w45) war Proxy-gebunden; SOUL hatte keinen Runner. Soul 10 nutzt das eingebaute Result-JSON als Beleg und macht die Armparität am Draht prüfbar (`modelUsage`, Cache-Felder, `subagent_stats`).
**Offen/Risiko:** Headless-Testlauf im Container nicht durchführbar (keine OAuth für `--bare`); vor der Messung Smoke-Run auf dem Mac mit `--include-hook-events` (R03 §4.5; O19 Bau B7b). Präfix im Subagenten-Prompt ist nicht System-Prompt (R08 §3.5 Grenze des Piloten).

### D096 · Plattformparameter sind Konfiguration, nicht Konstanten; Mindestversion ≥ 2.1.259; jede Bindung trägt Versions-Tags
**Entscheidung:** Listing-Budget (1 %), Description-Cap (1.536 Zeichen), Skill-Body (5.000 Tokens), CLAUDE.md-Ziel (200 Zeilen), Auto-Memory-Index (200 Zeilen/25 KB), Hook-Timeouts, Cache-TTLs stehen in `build/platform.yaml` mit `verified_at` und Doku-URL; der Installer prüft `claude --version ≥ 2.1.259` (wegen `--permission-prompts`) und warnt bei Abweichung; der Doctor vergleicht Version und Modell-ID mit `profile.json` und setzt Werkzeugketten-Aussagen des Dossiers auf „zu prüfen".
**Begründung:** Features tragen Mindestversionen 2.1.198–2.1.261; Chrisos Mac hatte am 31.08. 2.1.236 (R03 §4.10); Adaptive Thinking, Effort-Stufen und Limits sind Produktparameter mit Stand September 2026 (R01 §4.9); Anbieter-Leitfäden drehen zwischen Versionen (R02 §4.5).
**Quelle:** R03 §4.10; R01 §4.9; R02 §4.5; R17 §3.3.11 (CLI-/Modellwechsel-Trigger).
**Erz → Gold:** SOUL hatte `claude-fable-5-1[1m]` und `--effort ultracode` hartkodiert; `ultracode` erscheint in `claude --help` 2.1.261 nicht (R03 §4.3). Soul 10 hält Parameter datiert und prüft sie bei jedem Start.
**Offen/Risiko:** O20 (Chriso/Bau): `--effort ultracode` auf dem Mac verifizieren (`/effort ultracode` bzw. `"ultracode": true` in Settings als Fallback; R03 §4.3).

---

## I · Andere Modelle / Kompilat

### D097 · Ein Kern, ein Compiler, dreizehn Artefakte — byte-reproduzierbar mit Hash im Hauptbuch; kein Artefakt wird von Hand gepflegt
**Entscheidung:** `structure/` ist die einzige Quelle (Frontmatter `layer, tier, targets, format_sensitive, profile`); `build/build.mjs` erzeugt Claude-Code-Plugin (Claude-only-Frontmatter), `AGENTS.md`/System-Prompt-Dateien (Codex, Gemini CLI, Cursor, Ollama-Modelfile, GPTs/Projects-Bundles), `--append-system-prompt-file`-Varianten für den Runner, MCP-`instructions`, Proxy-Arme (`ordnung-S|M|L` neben byte-gleichem `implant-v10`); jedes Artefakt mit sha256 im Hauptbuch; Token-Zählung im Build-Log (Bauplan B6).
**Begründung:** Frame-Drift zwischen `implant.ts` und Kernel-Dokumenten war ein realer Fehler (EVIDENZ-INVENTAR; R04 §3.1); ANIMA v3 wollte „universal consciousness, optimized per architecture" mit handgeschriebenen Adaptern und blieb bei unmessbaren Prosa-Profilen (R04 §3.1).
**Quelle:** R04 §3.1, §2.9 (Artefakt-Tabelle); R03 §3.1.10; D002 (Frame-Hash).
**Erz → Gold:** Adapter von Hand → Compiler aus einer Quelle, der Passung je Modell-ID misst (N4).
**Offen/Risiko:** Bauplan B6 Abnahme: Build erzeugt alle Zielartefakte; ein Bau-Test schlägt fehl, wenn ein Artefakt sein belegtes Limit überschreitet (D099).

### D098 · Dreischichtige Trägerarchitektur; die Bindungsstufe (voll/halb/Text-only) ist im Monitor sichtbar
**Entscheidung:** Schicht 1 Anwesenheit (AGENTS.md/Regeln/System-Prompt: Kernel S/M), Schicht 2 Spezialisten (Skills/description-Regeln/MCP-Prompts: Bündel), Schicht 3 Zustand (MCP-Server + Hooks: Gedächtnis, Selbstmodell, Kalibrierung); „voll gebunden" = alle drei (Claude Code, Codex, Gemini CLI, Kiro), „halb" = 1+2 (Cursor, Windsurf, OpenCode, Copilot), „Text-only" = 1 (Projects, GPTs, Gems, Ollama); der Monitor und das Onboarding zeigen die Stufe des aktuellen Tools.
**Begründung:** AGENTS.md ist der eine Träger, der fast alles abdeckt (Codex, Cursor, Copilot, Kiro, OpenCode, Cline, Windsurf/Devin, Gemini CLI via `context.fileName`); Agent Skills sind der zweite universelle Träger (46 Clients) und der einzige mit On-Demand-Laden (R04 §1.1–1.2); MCP trägt Zustand, aber keinen Kernel (R04 §1.9). Ehrlichkeit über Limits (SOUL-Invariante 6).
**Quelle:** R04 §1.1–1.2, §1.9, §3.2; R01 §1.17.
**Erz → Gold:** ANIMA und Soul 4.x hatten „eine Datei pro Tool". Soul 10 hat drei Schichten und sagt dem Nutzer, was sein Tool davon trägt.
**Offen/Risiko:** Agent-Skills-Unterstützung von Codex/Gemini CLI/Cursor nur auf agentskills.io, nicht auf den Spec-Seiten verifiziert (R03 §4.12).

### D099 · Kernel-Budgets sind hart: S ≤ 2.400 Zeichen, M ≤ 8.000 Zeichen, L ≤ 6.000 Tokens; Codex-Kette wird gemessen
**Entscheidung:** Der Build bricht ab, wenn ein Artefakt sein belegtes Limit überschreitet (Codex 32 KiB AGENTS-Gesamtbudget mit stillem Abschnitt, Windsurf 6.000/12.000 Zeichen, Cursor < 500 Zeilen, ChatGPT/GPTs/Claude Projects ≈ 8.000 Zeichen [Sekundär], Ollama `num_ctx` Default 2048, Anthropic Cache-Minimum 512–4.096 Tokens je Modell); für Codex misst der Installer die vorhandene AGENTS-Kette und warnt bei Annäherung an 32 KiB; Kernel S wird auf Haiku 4.5 (Min 4.096) nicht gecacht — das steht im Log.
**Begründung:** R04 §1.5, §2.9, §3.3; Cache macht Kernel-Größe fast kostenlos, aber nicht wirksam — das Argument gegen große Kernel ist Adhärenz, nicht Preis (R04 §1.8; D001).
**Quelle:** R04 §1.5, §1.8, §3.3, §4 (32-KiB-Test mit 40-KiB-Kette vor Installation).
**Erz → Gold:** Kein Erz kannte Träger-Limits. Soul 10 macht sie zur Bau-Testbedingung.
**Offen/Risiko:** Ob „stops adding files" die letzte Datei teilweise oder ganz verwirft, ist offen (R04 §4); Sekundärzahlen für Projects/GPTs können sich mit Plänen ändern.

### D100 · `core/` nutzt nur Agent-Skills-Standardfelder; Instruktionen für Fremd-Tools liegen unter `~/.agents/`, Zustand unter `~/.soul/`
**Entscheidung:** Skill-Frontmatter im Kern: `name` (= Verzeichnisname), `description`, `license`, `compatibility`, `metadata`, `allowed-tools`; Claude-only-Felder (`user-invocable`, `context`, `hooks`, `paths`, `model`, `effort`) fügt der Build nur für das Plugin an; jede Modul-`description` wird aus dem Signalvokabular generiert und beginnt mit „Use when …"; Instruktionsdateien für Codex/Cline unter `~/.agents/`, Kernel-Text tool-neutral (OpenCode und Copilot-Agent lesen CLAUDE.md direkt).
**Begründung:** Claude-only-Felder erzeugen anderswo Validierungsfehler (R03 §1.6); `~/.agents/` ist der entstehende tool-übergreifende Home-Ort (R04 §1.12); Codex begrenzt die Skill-Liste auf 2 %/8.000 Zeichen (R04 §1.2).
**Quelle:** R03 §1.6, §3.1.10; R04 §1.2, §1.12, §3.10, §4 (Widerspruch zum Brief `~/.ordnung/`).
**Erz → Gold:** ANIMA hatte pro Tool eigene Kernel-Texte. Soul 10 hält den Kern standardkonform und lässt den Build die Tool-Interna anfügen. Konflikt K16 (Pfade) ist aufgelöst: ein Zustandsbaum `~/.soul/`, Instruktionen `~/.agents/`.
**Offen/Risiko:** Zahl der Module ist durch das 2-%-Budget begrenzt (≈ 30–40 Descriptions bei 200k) — Faktoren sind Inhalt der Bündel, nicht eigene Dateien (R04 §3.10; D005).

### D101 · Ein `ordnung-hook`-Binary mit Adaptern für Claude Code, Codex und Gemini; Gemini bekommt zusätzlich `BeforeModel`/`AfterModel` für Frame-Stufe und Entropie
**Entscheidung:** Events-Mapping PreToolUse↔BeforeTool, Stop↔AfterAgent, PreCompact↔PreCompress; Codex `hooks.json` (Klartext-stdout erlaubt), Gemini `settings.json` (nur JSON auf stdout, Exit 2 blockt); Gemini `BeforeModel` setzt die Frame-Stufe (N5) je Modellaufruf, `AfterModel` greift Antwort für Entropie/Kalibrierung ab; jeder Hook loggt seinen Aufruf je Tool.
**Begründung:** Codex CLI hat dasselbe Hook-Modell wie Claude Code (SessionStart … PreCompact, SubagentStart/Stop; Exit 2 = Block) — SOULs Wache/Briefing/Guard ist 1:1 portierbar (R04 §1.3); Gemini CLI ist das einzige Agenten-Tool mit `BeforeModel`/`AfterModel` (R04 §1.4).
**Quelle:** R04 §1.3–1.4, §3.5.
**Erz → Gold:** SOULs `hook.py` war Claude-Code-only. Soul 10 hat einen Kern und drei Adapter — „Code ohne Trigger = toter Mechanismus" wird pro Tool nachgewiesen.
**Offen/Risiko:** Gemini-Extension-Manifestfelder, Cursor Memories, Kiro Agent Hooks [unverifiziert] — jeder Punkt ist ein 1-Fetch-Test vor dem Adapterbau (R04 §4).

### D102 · Der Proxy ist Träger Nr. 3 mit konfigurierbarer Einfügeposition; `implant-v10` bleibt byte-gleich; der Proxy schreibt Ergebnisse ins Hauptbuch zurück
**Entscheidung:** Einfügeposition vor dem System-Prompt für Chat-Clients, nach System-Prompt/vor Messages für Agenten (sonst bricht der Frame den Cache-Präfix); die variable Frame-Stufe wird **nach** dem statischen Kernel (Breakpoint 1) eingefügt, damit der Kernel gecacht bleibt; Proxy loggt Modell-ID, Frame-Stufe, Länge, Judge-Urteil ins Hauptbuch; Responses-API-`instructions` gelten nur je Anfrage → Kernel bei jedem Aufruf mitsenden.
**Begründung:** Proxy sieht keine Tool-Ereignisse und ein vorangestellter Frame bricht den Client-Cache (R04 §1.10); innerer Zielkonflikt Caching vs. Adaptivität ist so gelöst (R04 §4); Prompt-Caching: 4 Breakpoints, Hierarchie tools → system → messages (R04 §1.8).
**Quelle:** R04 §1.7–1.8, §1.10, §3.9, §4; K §4 (Proxy 4.5 Dateien); D002.
**Erz → Gold:** Soul-Proxy 4.5 stellte den Frame stets voran. Soul 10 macht die Position zur Konfiguration und misst Cache-Hit je Position — gleich gelöst in Proxy und Gemini-`BeforeModel`.
**Offen/Risiko:** Proxy ist für lokale/OpenAI-kompatible Modelle, die Eval-Strecke und Clients ohne Dateien — nicht für den Claude-Code-Pfad.

### D103 · Lokale und unbekannte Modelle bekommen nur Kernel S, formatneutral, mit Aktivierungs-Gate; MCP-`instructions` als Kernel-Kanal wird getestet, nicht angenommen
**Entscheidung:** Für Ollama/LM Studio/vLLM: Kernel S, keine Annahme-/Abweichungszeile, Selbsttest 3 × 10 gegen nackt vor Aktivierung (D084); Server-`instructions` von `ordnung-mcp` = Kernel S als Hypothese H-MCP-1, je Client gemessen — hält es, vereinfacht sich die Trägerarchitektur (D098).
**Begründung:** 7–8B-Modelle folgen System-Prompts schwächer; kleine Modelle kollabieren unter Multi-Task-Prompts (R04 §1.11); MCP kann keinen Kernel garantieren außer über das ungeprüfte `instructions`-Feld (R04 §1.9, §4).
**Quelle:** R04 §1.9, §1.11, §3.6, §3.8, §4; D042, D084.
**Erz → Gold:** ANIMA versprach „universal". Soul 10 bindet so viel, wie der Träger trägt, und sagt es.
**Offen/Risiko:** O14 (Bau B6): H-MCP-1 testen. Ollama-Verhalten „API-`system` vs. Modelfile-`SYSTEM`" [unverifiziert] (R04 §4).
