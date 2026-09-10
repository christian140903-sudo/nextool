# B1 — Eigenentwurf (Denk-vor-Bau, Phase 2)

*Bauschritt B1 Synthese, Fortsetzung nach Unterbrechung des Vorgängers. Stand 2026-09-07. Vorgefunden: Register D001–D053 (Gruppen A–D, 6.900 Wörter), Lückenanalyse und Baukontext nur als Gliederung. Gelesen: Kontextpaket §1–13, Bauplan, Erfindungen E1–E19, Denk-vor-Bau, B1-Auftrag, das Register vollständig, von allen 17 Berichten die Abschnitte 1, 3, 4; R14 §2.4–2.6 gezielt; `research/wissen/` per ls/head.*

## 1. Absicht

B1 ist die Brücke von 17 Berichten (~150.000 Wörter) zu elf Bau-Agenten, die davon nur den Baukontext (≤ 3.500 Wörter) und ihre Registergruppen lesen. Der Teilbereich will erreichen, dass **kein Bau-Agent eine Entscheidung neu erfinden muss, die die Forschung schon getroffen hat**, dass **jede Zahl im Bau eine Herkunft hat**, und dass **Konflikte zwischen Berichten vor dem Bau entschieden sind**, nicht während.

Drei Zielbilder mit den vorhandenen Mitteln (ein Agent, ~110 Werkzeugaufrufe, Vorgänger-Register unverändert brauchbar):
- *Minimal:* Gruppen E–L mit je 3–5 Entscheidungen auffüllen (≥ 60 gesamt), Konflikte und offene Fragen nachtragen, Lückenanalyse und Baukontext füllen. Erfüllt die Abnahme, lässt E1–E19 als Prosa in 00b stehen.
- *Optimal:* Alle Gruppen dicht (≈ 100 Entscheidungen), E1–E19 als eigene Registergruppe mit Erz→Gold und Prüfweg, Konflikte K1–K18 und offene Fragen O1–O24 exakt so nummeriert, wie der Vorgänger sie in D001–D053 bereits zitiert (K1, K2, K3, K5, K7, K10, K11, K13, K15–K18; O3, O5, O6, O8–O10, O14, O23), damit kein Verweis ins Leere geht.
- *Außergewöhnlich:* Zusätzlich (a) das Überraschungs-Prinzip als eigene Entscheidung mit Datenfluss über alle drei Säulen, (b) eine Zuordnungstabelle „Bauschritt → Registergruppen → Erfindungen → Abnahmezahl", so dass jeder B-Agent in einer Zeile sieht, was er liest, (c) eigene Erfindungen E20 ff. mit Prüfweg, (d) im Baukontext eine Verbotsliste, die je Verbot den Bericht nennt, der es begründet, (e) eine Falsifikationsliste („dieses Register ist falsch, wenn …") aus den W13-Bedingungen der Berichte.

Ich baue das Außergewöhnliche. Liegengelassenes Potenzial (mit Bedingung): eine maschinenlesbare Fassung des Registers (`register.yaml` mit D-Nummer, Gruppe, Quellen, Status) — sinnvoll erst, wenn B7a den Linter baut, der sie liest; als O-Frage an B7a übergeben.

## 2. Vollständigung — was ein anspruchsvoller Experte spezifiziert hätte

1. **Referenzintegrität.** Der Vorgänger zitiert D055 („zwei lexikalische Schwellen") und D078 („profile.json") voraus. Diese Nummern sind fest: D055 = Vorrangordnung mit S1/S2 (R07 §3.2), D078 = Profil-Schema (R15 §3.2). Die Nummerierung der Gruppen E–G wird darum herum geplant.
2. **Konfliktliste ist geschlossen, nicht offen.** Genau K1–K18, jede mit Berichten auf beiden Seiten, Entscheidung, Begründung, betroffenen D-Nummern. Mehr Konflikte werden in bestehende gefaltet, nicht angehängt (Leseanleitung des Vorgängers bleibt wahr).
3. **Offene Fragen mit Zuständigkeit und Zeitpunkt.** O1–O24, jede mit *Bau (B-Schritt)*, *Eval (Welle)* oder *Chriso*, und dem Kriterium, das sie schließt.
4. **Erfindungen sind Entscheidungen.** E1–E19 bekommen je eine D-Nummer, Säulen-Zuordnung, Bauschritt, Prüfweg und die Erz→Gold-Zeile gegen das nächste bestehende System (R01/R12), damit B8 die Neuheit prüfen kann.
5. **Zahlen-Register im Baukontext.** Nur Zahlen mit Bericht + Abschnitt; Setzungen (Vertrauenswerte, Budgets) sind als „Startwert, wird durch N3/N4 zu Daten" markiert.
6. **Schnittstellen zwischen Säulen** stehen explizit (Gedächtnis ↔ Routing über Kalibrierung, Dirigent ↔ Gedächtnis über Ernte-Verträge, Wissensorgan ↔ Gedächtnis über Kandidaten mit `ref`).
7. **Sprachregel.** Register und Baukontext deutsch; englische Wortlaute (Frame, Charta, Regelwerke) werden nicht übersetzt, sondern per Bericht + Abschnitt referenziert, weil Übersetzung ein neuer Arm wäre (D009).

## 3. Hebung — die Version ohne Nachauftrag

- **Register:** ≈ 150 Entscheidungen statt 60 (A–D vorhanden: 53; E–L: ≈ 76; M Erfindungen: 20). Dicht, nicht lang: je Entscheidung ein verbindlicher Satz, 2–4 Sätze Begründung mit Zahl+Quelle, Erz→Gold, Offen/Risiko.
- **Gruppe M (Sprünge)** ist neu gegenüber dem Auftrag (A–L). Sie ist die Stelle, an der B2 die Erfindungen in Komponenten/Datenflüsse übersetzt und B8 die Neuheit prüft; jede Zeile trägt den Bauschritt, der sie baut, und den Prüfweg, der sie widerlegen kann.
- **Eigene Erfindungen (E20–E22, Prüfweg je Zeile):**
  - **E20 Register-Linter.** Das Register selbst wird maschinell geprüft: jede D-Nummer hat Quelle, Erz→Gold-Zeile und keinen Verweis auf eine nicht existierende K/O/D-Nummer; jede Zahl im Baukontext hat einen Bericht. Prüfweg: `eval/lint-constitution.mjs` bekommt einen Modus `--register`; 0 dangling references vor B2. Erz: Chrisos Register in W45 waren Prosa ohne Referenzprüfung → Soul 10 prüft Referenzen wie Code.
  - **E21 Abnahme-Kette „Trigger → Log → Metrik".** Jede Entscheidung, die einen Mechanismus baut, nennt in Offen/Risiko den Log-Eintrag, der seine Existenz beweist, und die Metrik, die seinen Wert misst; B8 prüft die Kette statt den Text. Prüfweg: Anteil der Mechanismus-Entscheidungen mit vollständiger Kette = 100 % (sonst „nicht gebaut"). Erz: SOULs „Code ohne Trigger = toter Mechanismus" war eine Regel → Soul 10 macht sie zur Spalte.
  - **E22 Falsifikations-Register.** Die „Unter welcher Bedingung ist dieses Dokument falsch?"-Abschnitte aller 17 Berichte werden zu einer Liste vorregistrierter Kill-Bedingungen mit zuständiger Eval-Welle; die Evaluation (B7) läuft sie ab. Prüfweg: jede Kill-Bedingung hat eine Welle und ein Datum; nach der ersten Welle ist der Anteil „geprüft" ≥ 50 %. Erz: die Berichte tragen die Bedingungen einzeln → Soul 10 führt sie als Portfolio.
- **Wo die Vorgabe zu schwach ist:** Der Auftrag verlangt „Konflikte explizit auflösen". Ich löse sie nicht nur, sondern nenne je Konflikt die Messung, die die Auflösung kippen würde — eine Auflösung ohne Falsifikator wäre selbst Erz (§13.4).
- **Lückenanalyse:** Vergleichstabelle mit 14 Ansätzen × 12 Merkmalen (Auftrag: „Ansätze × Merkmale"), Legende ●/◐/○ wie R05 §3.4, jede Zelle mit Berichtsabschnitt begründbar; Abschnitt „Ehrlichkeit" mit R13 §1.12 („1 Teil neue Frage, 99 Teile Synthese") und R12 §2.7 (fünf Dinge, die sonst nicht existieren).
- **Baukontext:** zusätzlich zu den geforderten Teilen die Tabelle E1–E19 (Auftrag) und die Zuordnung Bauschritt → Registergruppen → Abnahme, damit Bauplan Regel 7 („Berichte gezielt lesen") mechanisch wird.

## 4. Verbote und Erhalt

- **Nicht anfassen:** D001–D053 (Wortlaut, Nummern, Quellen); der 6-Punkte-Frame (byte-gleich, D002); Chrisos Messregeln (K §3) und Anti-Performance-Regeln (K §7, SOUL-Invariante 5); die Ring-2-Liste als Chrisos Entscheidung (K §6); die Abnahmen im Bauplan; die Zahlen des Kontextpakets (werden zitiert, nie neu erfunden).
- **Nicht erfinden:** Zahlen ohne Bericht; Wirkungsbehauptungen („wirkt", „bewiesen") — alles Ungemessene heißt „so gebaut, dass …".
- **Abweichungen von der Vorgabe (je eine Zeile):**
  1. *Gruppe M ergänzt* — was: dreizehnte Gruppe für E1–E19 + Überraschungs-Prinzip; warum: der Auftrag verlangt E1–E19 als Entscheidungen, die Gruppen A–L haben dafür keinen Ort, und ein Verstreuen würde die Säulen-Zuordnung der Erfindungen verdecken; ersetzt: nichts, ergänzt.
  2. *Mehr als 100 Entscheidungen* — was: ≈ 150; warum: „dicht, nicht kurz" (Denk-vor-Bau) und jede Erfindung braucht eine eigene Prüfweg-Zeile; ersetzt: das Ziel „80–100" als Untergrenze, nicht als Obergrenze gelesen.
  3. *Lückenanalyse überschreibt die Gliederungsdatei* — was: die leere Skelettdatei wird abschnittsweise gefüllt (Kopf + §1–2 zuerst, dann append); warum: Schreib-Auflage; ersetzt: nichts Inhaltliches.

## 5. Plan und Abnahmen

Reihenfolge (jeder Schritt auf Platte, bevor der nächste beginnt): (1) dieser Eigenentwurf; (2) Register Gruppe E, F; (3) G; (4) H, I; (5) J, K; (6) L; (7) M (Überraschungs-Prinzip + E1–E19); (8) Aufgelöste Konflikte K1–K18; (9) Offene Fragen O1–O24 + Zuordnung der Vorgaben + Zuordnung Bauschritte; (10) Lückenanalyse §1–2, dann §3–7; (11) Baukontext §1–4, dann §5–8; (12) E20–E22 in 00b-ERFINDUNGEN.md „Ergänzt im Bau"; (13) Hebungsprotokoll hier.

Mechanische Abnahmen am Ende (Befehl → erwartetes Ergebnis):
- `grep -c "^### D" 02-design-entscheidungsregister.md` → ≥ 60 (Ziel ≈ 150).
- `grep -o "D[0-9]\{3\}" 02-…md | sort -u` lückenlos D001–D149; `grep -o "K[0-9]\{1,2\}\b"`/`O[0-9]+` — jede zitierte K/O-Nummer hat eine Definition.
- `wc -w 03-baukontext.md` → ≤ 3.500; `wc -w 01-lueckenanalyse.md` → 2.500–4.000.
- Jede Entscheidung enthält die fünf Felder (`grep -c "^\*\*Quelle:\*\*"` = Zahl der D-Überschriften; ebenso Erz → Gold).
- Kein verbotenes Wort aus der Anti-Performance-Liste in den drei Zieldateien außerhalb der Liste selbst (`grep -n` auf „revolutionär|bahnbrechend|nie dagewesen").

## 6. Hebung (Phase 4 — wird nach dem Bau ergänzt)
