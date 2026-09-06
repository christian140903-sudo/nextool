---
name: startup-solo-gruender-at
description: >
  Load when the user is founding, validating or funding a company or product as a solo founder
  (especially in Austria/EU), asks about legal form, grants, first users, MVP scope, pricing or
  what to do before building. Not for legal or tax advice — those are Ring-2 questions.
schicht: handwerk
sichtbarkeit: public
version: 2026-09-06.1
verfaellt_am: 2026-12-05
haltbarkeit_default: H2
signale: [startup, founding, funding, grant, legal_basics, austria, validation, mvp]
ladestufe_default: 1
abhaengig_von: [projekt-zu-ende-fuehren, deployment-ohne-kosten]
gemessen: {geladen: 0, gewirkt: 0, letzte_nutzung: null}
autor: mining
---

## Kurzform (≤ 120 Wörter)
Nutzer holen, nicht warten; einen Nutzer wie einen Beratungskunden behandeln; manuell vor automatisch; enger Markt zuerst. Bauen erst nach Belegen aus Gesprächen über Vergangenheit, nicht über Meinung. Rechtsform in Österreich: FlexKapG (seit 2024) ist für Ein-Personen-Gründungen ohne Notar möglich, Mindeststammkapital 10.000 €, davon 5.000 € bar. Förderung: aws Preseed Deep Tech bis 267.000 € (300.000 € mit Gender-Bonus), Quote 80 % (90 %), Firma ≤ 6 Monate alt, Ø 3 Monate Verfahren, De-minimis 300.000 €/3 Jahre. Förderzahlen verfallen in 90 Tagen — vor jedem Antrag die FAQ neu lesen. Recht/Steuer/SV: Grundzüge kennen, Entscheidung an Berater (Ring 2).

## Kernprinzipien
1. [B@q11 2026-09-06] H1 „You can't wait for users to come to you. You have to go out and get them." (Graham, Do Things That Don't Scale)
2. [B@q11] H1 „Your first users should feel that signing up with you was one of the best choices they ever made."
3. [B@q11] H1 „pick a single user and act as if they were consultants building something just for that one user."
4. [B@q11] H1 Enger Markt: „keeping a fire contained at first to get it really hot before adding more logs."
5. [B@q11] H1 Manuell vor automatisch: „when you do finally automate yourself out of the loop, you'll know exactly what to build."
6. [U] H1 Mom-Test-Prinzip: nach konkreter Vergangenheit fragen („wann zuletzt, was getan, was gezahlt"), nie nach Meinung zur Idee. [Buchwissen, hier nicht abgerufen]
7. [B-Sekundär@q12 2026-09-06] H2 FlexKapG/FlexCo: Mindeststammkapital 10.000 €, mind. 5.000 € bar; Unternehmenswert-Anteile ohne Stimmrecht bis 24,99 % des Stammkapitals; Ein-Personen-Gründung möglich, ohne Notar; seit 2024. (WKO/FreeFinance/TPA — Primär-WKO-Seite nicht abgerufen)
8. [B@q13 2026-09-06] H3 aws Preseed Deep Tech: „maximum funding amount was increased to EUR 267,000, and up to EUR 300,000 if the gender bonus is applied"; Förderquote „80% in general", „up to 90%"; Eigenleistung ≥ 20 % (≥ 10 % bar) bzw. ≥ 10 % (≥ 5 % bar) mit Bonus; „company may have been founded up to 6 months previously"; unabhängig nach EU-KMU-Definition; De-minimis 300.000 €/3 Jahre; Verfahren Ø 3 Monate; nur elektronisch (aws Funding Manager).
9. [B@q14 2026-09-06] H3 Programmlinien: Deep Tech (LIS/TEC/GREEN; „Significant technology advance", „Product development > 3 years" oder „> EUR 1 million") und Innovative Solutions („Low competitive risk", „New, high customer demand", Nachhaltigkeit/soziale Innovation); Seedfinancing für Firmen „up to 5 years old". Beträge für Innovative Solutions und Seed auf der Programmseite nicht genannt → Prüfauftrag.
10. [B-Sekundär@q15] H3 Infostunden 2026: 19.8. und 23.9., 10:30–12:00, deutsch.
11. [SOUL Anti-Patterns 1, 9, 10] H1 Output ≠ Outcome („253 Tools, 130 Blogs, 0 EUR"); Fremdurteil ist kein Beweis; Zeitschätzungen 3–20× daneben.
12. [P] H2 Grundzüge Recht AT/EU: DSGVO ab dem ersten Nutzerdatum (Verzeichnis, Rechtsgrundlage, Auftragsverarbeiter); Impressum/Offenlegung; Gewerbe-/Steuer-/SV-Anmeldung; Förderungen brauchen De-minimis-Buchführung. Entscheidungen: Ring 2 (Berater, Nutzer).

## Entscheidungsregeln
- Idee ohne fünf Gespräche über Vergangenheit → kein Bau, erst Gespräche (6, 1).
- Erster Nutzer gefunden → Beratungsmodus für genau diesen (3), manuelle Erfüllung (5).
- Förderung erwägen → FAQ-URL frisch abrufen (H3), Fristen/Alter prüfen (8), De-minimis-Stand des Nutzers erfragen (Ring 2, gebündelt).
- Rechtsform → erst nach Kundenbeweis; Ein-Personen-FlexKapG als Default-Kandidat (7), Beraterfrage bündeln.
- Alles, was Konto/Abo/Vertrag/Zahlung ist → Ring 2, eine gebündelte Frage mit Optionen.

## Werkzeuge
aws Funding Manager (elektronische Einreichung) [B@q13]; WKO-Gründerservice [U]; Förderkompass/Grantlift als Discovery [B-Sekundär, keine Qualitätsprüfung]; GitHub Pages/Cloudflare für Landingpages (siehe deployment-ohne-kosten, Kommerzklausel beachten).

## Anti-Patterns
- Förderzahlen aus dem Gedächtnis (die Programmseite selbst nennt keine — nur die FAQ; Beleg: 9 vs. 8).
- Rechtsform/Logo/Website vor dem ersten zahlenden Nutzer (Beleg: 1–5, 11).
- Rechts- oder Steuerrat als Modellwissen ausgeben (Beleg: Ring 2, Kontext §11b).

## Unter welcher Bedingung ist dieses Dossier falsch?
Förderbeträge, Quoten und Fristen ändern sich jährlich (H3, 90 Tage); Rechtsformdetails bei Gesetzesänderung. Wenn der Nutzer nicht in AT/EU gründet, sind 7–10 irrelevant und ein Länder-Dossier fehlt (Lückenzähler).

## Quellen
- @q11 https://paulgraham.com/ds.html (Abruf 2026-09-06)
- @q12 WebSearch „FlexKapG FlexCo" (Abruf 2026-09-06; Treffer wko.at/gruendung/flexible-kapitalgesellschaft-flexkapg-, freefinance.at, tpa-group.at)
- @q13 https://www.aws.at/en/aws-preseed-faq/ (Abruf 2026-09-06)
- @q14 https://www.aws.at/en/aws-preseed-seedfinancing/ (Abruf 2026-09-06)
- @q15 WebSearch „aws Preseed 2026" (Abruf 2026-09-06)
- SOUL `knowledge/denk-architekturen.md` Anti-Patterns
