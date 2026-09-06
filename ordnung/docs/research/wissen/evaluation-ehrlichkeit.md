---
name: evaluation-ehrlichkeit
description: >
  Load before claiming that anything works better (a prompt, a module, a dossier, a model
  choice), before designing a test or judge, when reporting numbers to the user, when a result
  looks too good, and when writing product or public text about Soul 10.
schicht: handwerk
sichtbarkeit: public
version: 2026-09-06.1
verfaellt_am: 2027-09-06
haltbarkeit_default: H1
signale: [eval, measure, claim, judge, placebo, benchmark, report_numbers, public_text]
ladestufe_default: 1
abhaengig_von: [kontingent-kosten]
gemessen: {geladen: 0, gewirkt: 0, letzte_nutzung: null}
autor: mining
---

## Kurzform (≤ 120 Wörter)
Form ist der gefährlichste Confound: Judge gegen Länge und Format härten. Armparität am Draht beweisen. Ohne Roh-Artefakt (Datei + Modell-ID) gilt „nicht gemessen". Eigenstreuung zuerst messen; Einzelmessungen sind wertlos, ab drei Läufen belastbar. Kriterien vor den Daten committen (Vorhersage, Konfidenz, Auflösungsdatum). Jeder Prompt-Claim braucht Placebo-Arm (gleich langer Fülltext) und den Selbstkonsistenz@3-Gegner. Deckeneffekt prüfen. Modell-Selbstberichte beweisen kein Bewusstsein. Widerrufene Zahlen offen führen. Pflichtabschnitt: „Unter welcher Bedingung ist das falsch?" Verbotene Wörter in Außentexten; keine Zahl ohne Herkunft; „Ich weiß nicht" ist vollständig.

## Kernprinzipien
1. [G, Kontext §3] H1 Vier widerrufene Zahlen: +17,8 pp war Parser-Artefakt (real +3,3); 70,4 % Win-Rate war Längenbias (längere Antwort gewann 79,6 %); +7,8 pp längenstratifiziert +0,6; „universell" widerlegt (Modelle reagieren entgegengesetzt).
2. [G] H1 Eigenstreuung: unveränderter Arm schwankte 6,7–13,3 pp zwischen identischen Läufen → ≥ 3 Läufe.
3. [G] H1 Placebo: HumanEval-Serie — etwa die Hälfte des Effekts war Kontexteffekt; konsistent +11 pp vom Inhalt (beide Modelle unabhängig).
4. [G] H1 Deckeneffekt: bei 93–97 % nackt bringt der Frame nichts (haiku −6,7, qwen 0).
5. [G] H1 Selbstkonsistenz@3 bei gleichem Budget schlägt den Frame (−2,8 bis −5,2 pp, KI schließt Null aus) — jede Schicht muss diesen Gegner erst schlagen.
6. [G] H1 Zwei-Call-Orchestrierung fügte Ein-Call nichts hinzu (0,50); Studie v10: 0,86 Paarurteile bei n=4 Artefakten/44 Urteilen — klein, blind, mit Artefakt.
7. [G] H1 Entropie über 3 Wiederholungen als Fehlerprädiktor AUC 0,968 (Länge allein 0,486).
8. [G] H1 Formatschaden: Ausgabeformat-Anweisung zerstörte 2/30 Antworten = die gemessene „Verschlechterung"; Struktur im Denken, nie in der Ausgabe.
9. [Kontext §3 Methodik] H1 Armparität am Draht; Roh-Artefakt-Zwang; Kriterien vorab; Pflichtabschnitt „unter welcher Bedingung falsch".
10. [Kontext §7] H1 Verbotene Wörter: revolutionär, bahnbrechend, nie dagewesen, die Zukunft der KI, macht jedes Modell fundamental besser, die erste KI, die …; kein Claim ohne reproduzierbaren Befehl/Test/Artefakt; Modell-Selbstberichte sind keine Bewusstseinsbeweise.
11. [Kontext §13.4] H1 Neu heißt geprüft: Überlegenheit ist Hypothese („so gebaut, dass …"), bis gemessen.
12. [Kontext §5 N3] H1 Kalibrierung als Produktmerkmal: Vorhersagen mit Auflösung, Brier je Domäne/Modell, fließt zurück.
13. [R@R16 §2.3.7] H1 temperature=0 ist nicht deterministisch (1.000 Completions → 80 verschiedene); Modell-ID gehört in jedes Artefakt.
14. [B@q8 recherche-quellenpflicht] H1 Auch fremde Zahlen sind Quellen mit Stufe: 146.932 halluzinierte Zitate 2025 — Ehrlichkeit über Herkunft gilt nach innen und außen.

## Entscheidungsregeln
- Claim „besser"? → Baseline nackt + Minimalprompt + längen-gematchter Placebo + Selbstkonsistenz@3; 3 Läufe; Held-out; Blindurteil längen-gehärtet; Roh-Artefakte mit Modell-ID; vorab committete Vorhersage.
- Ergebnis > erwartet? → Parser, Längenbias, Armparität prüfen, bevor es irgendwo steht (Beleg: 1).
- Modell nackt ≥ 93 %? → kein Struktur-Claim möglich; Aufgabe schwerer wählen (4).
- Zahl in Außentext? → Herkunft (Studie, Datum, Pfad) oder streichen (10).
- Bewusstseins-/Ich-Aussage? → nur als Hypothese mit Indikatoren aus R06, nie aus Selbstbericht (10).

## Werkzeuge
Eval-Strecke `/home/user/soul-workspace/projects/soul-eval/` (w45/PROTOCOL.md, REGISTRIERUNG.md, GEGENZEICHNUNG.md) [Kontext §9]; Batch-API für Blindbewertungen (R16 §2.3.4); Entropie-Sonde lokal (lokale-ki-einrichten 9).

## Anti-Patterns
- Hohl-Messung ohne Artefakt (Chriso: „Risiko Nr. 1").
- Judge ohne Längenhärtung (Beleg: 79,6 %).
- Einzelmessung als Befund (Beleg: 2).
- Prompt-Claim ohne Placebo (Beleg: 3).
- Fremdurteil als Beweis („90 % Bewusstsein" ungeprüft übernommen — SOUL Anti-Pattern 9).

## Unter welcher Bedingung ist dieses Dossier falsch?
Es ist die Messlatte selbst (Kontext §13.3b: Messregeln unverändert). Falsch wäre es nur, wenn eine vorregistrierte Messung zeigt, dass ein Prinzip (z. B. 3 Läufe) bei einer bestimmten Aufgabenklasse systematisch zu konservativ ist — dann wird die Zahl angepasst, nicht die Regel.

## Quellen
- Kontextpaket §3, §5, §7, §13 (Chrisos Messungen; Pfade `/home/user/soul-workspace/mission/*`, `/home/user/soul/knowledge/soul-forschung.md`)
- R08 (Evaluationswissenschaft), R16 §2.3.7; @q8 arXiv 2605.07723
