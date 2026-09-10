# Erfindungen — die Sprünge je Säule (verbindliche Bauvorgabe)

*Vom Orchestrator selbst entworfen am 2026-09-06, nach Sichtung aller 17 Berichte. Diese Mechanismen stehen in keinem der untersuchten Systeme (Letta, Mem0, Zep, OpenClaw, CoALA, Generative Agents, Superpowers, Devin/OpenHands, Anthropic-Harness) in dieser Form. Sie sind Konstruktionen, keine Behauptungen: jede trägt einen Prüfweg. B2 muss sie in die Architektur integrieren, B3–B5 bauen, B7 messen, B8 prüft ihre Neuheit gegen R01/R12.*

## Das verbindende Prinzip: Überraschung als Währung

Alle drei Säulen werden durch EINEN Strom verbunden: **Vorhersagefehler**. Bevor das System etwas Wirksames tut (Tool-Aufruf, Delegation, Entscheidung, Antwort auf Stufe ≥ 2), sagt es kurz voraus, was passieren wird (Ergebnisklasse, Konfidenz). Danach vergleicht ein Hook automatisch. Die Differenz ist eine **Überraschung** und wird als Ereignis erster Klasse geloggt (`watch/surprise.jsonl`). Überraschungen speisen gleichzeitig das Gedächtnis (Episoden mit Gewicht), das Selbstmodell (Kalibrierung, „worin bin ich unsicher") und die Durchführung (Tiefe hoch, Prüfer holen, Weg wechseln). Kein bestehendes System hat eine gemeinsame Überraschungs-Buchführung über Gedächtnis, Selbst und Handeln. Sie ist implementierbar mit PostToolUse-, SubagentStop- und Stop-Hooks plus Vorhersage-Einträgen im Hauptbuch. Prüfweg: Ablation (Überraschungs-Strom aus) gegen Fehlerrate und Kalibrierung.

## Säule 1 — Gedächtnis: Sprünge

**E1 Doppelte Buchführung des Wissens.** Jeder Eintrag vom Typ fakt/muster/entscheidung hat eine Gegenbuchung: *was ihn widerlegen würde* (Falsifikator) und *wann er zuletzt bewährt wurde*. Ein Eintrag ohne Falsifikator ist „Vermutung" und darf keine irreversible Handlung tragen. Einträge, die N Nutzungen lang ungeprüft blieben, tragen Prüfschuld und werden im Schlaf zur Prüfung eingeplant. Über den Stand der Kunst hinaus: Mem0/Letta/Zep speichern Aussagen; hier speichert das System Aussagen *mit ihrer Widerlegbarkeit*. Prüfweg: Anteil der Entscheidungen, die auf ungeprüften Einträgen beruhen, sinkt; Fehler durch veraltete Fakten sinken.

**E2 Gegenerinnerung.** Zu jedem aktiven Muster oder jeder Regel wird die stärkste bekannte Ausnahme mitgeführt. Recall liefert Paare (Regel + Ausnahme), nie die Regel allein. Verhindert Überverallgemeinerung mechanisch, nicht durch Vorsatz. Prüfweg: Überverallgemeinerungs-Items im Testset.

**E3 Haltbarkeits-Vorhersage.** Beim Schreiben schätzt das System die Halbwertszeit des Eintrags (nach Typ und Domäne); der Schlaf vergleicht vorhergesagte mit tatsächlicher Veraltung (Widerspruch, Supersession) und kalibriert die Verfallsraten je Typ. Das Gedächtnis lernt, wie schnell sein eigenes Wissen verdirbt. Über N7 (typisierte Haltbarkeit) hinaus, weil die Raten gemessen statt gesetzt werden. Prüfweg: Brier-Score der Haltbarkeits-Vorhersagen über Wochen.

**E4 Herkunfts-Algebra.** Vertrauen fließt nur entlang von Herkunftskanten: eine Nutzeraussage kann nur durch eine Nutzeraussage oder ein verifiziertes Ergebnis abgelöst werden; eine eigene Schlussfolgerung kann ihr Vertrauen nie selbst erhöhen, nur ein Ergebnis kann es; Inhalte aus Werkzeugen und Web sind Daten mit eigener Herkunft und werden nie zu Anweisungen. Das ist die Verallgemeinerung von Chrisos User-Authority-Guard zu einer Rechenregel im Code. Prüfweg: Vergiftungs- und Überschreibungs-Items aus R11.

**E5 Abhängigkeitsgraph und Gegenwelt-Abfrage.** Entscheidungen verweisen auf die Einträge, auf denen sie beruhen. Zwei Abfragen werden dadurch möglich: „Was hängt an dieser Annahme?" und „Wie sähe der Plan aus, wenn Eintrag X falsch wäre?" Die Frage „welche einzelne Annahme, wenn falsch, bricht das?" wird berechenbar statt geraten. Rückbau (N2) wird zur Zeitreise entlang des Graphen. Prüfweg: Rückbau-Vollständigkeit ohne Kontamination; Zahl der stillen Abhängigkeiten.

**E6 Gedächtnis, das Miete zahlt.** Jeder Eintrag führt Lesezahl und Beitrag (wurde er in einer Entscheidung zitiert, die später bestanden hat?). Das Briefing wird nach Beitrag komponiert, nicht nach Aktualität; Einträge ohne Beitrag wandern ins Archiv. Chrisos Betriebsbefund („das System fütterte sich selbst") wird damit unmöglich, weil Selbstfütterung ohne Beitrag automatisch verfällt. Prüfweg: Nutzungsrate und Fütterungsquelle im Betrieb.

**E7 Ebenen-Vertrag fürs Schreiben.** Subagenten schreiben nie direkt ins Hauptbuch; sie liefern typisierte Befunde (getan, geprüft, nicht geprüft, überrascht, zu merken) mit Herkunft „Ebene n". Der Dirigent promotet. Zwischen den Ebenen läuft ein Konsistenz-Check (Widerspruch → beide disputed). Prüfweg: Widerspruchsrate zwischen Ebenen; Kontamination durch Subagenten-Halluzination.

## Säule 2 — Bewusstseinsstruktur: Sprünge

**E8 Selbstmodell als Vorhersagemaschine über sich selbst.** Identität ist keine Beschreibung, sondern eine Menge geprüfter Selbstvorhersagen: „In Lagen wie X neige ich zu Y." Jede Selbstvorhersage wird gegen die Logs getestet; Persönlichkeit ist die Menge der Vorhersagen, die über Sitzungen halten; Drift ist messbar als Vorhersageversagen. Das operationalisiert Bems Selbstwahrnehmung und Kalibrierung in einem Mechanismus. Kein Persona-System hat ein prüfbares Selbst. Prüfweg: Trefferquote der Selbstvorhersagen über 10/100 Sitzungen; blinde Wiedererkennung.

**E9 Aufmerksamkeitshaushalt.** Die Bündel („unbewusste Spezialisten") bieten um Aufmerksamkeit anhand von Signalen UND ihrer eigenen Beitragsgeschichte (E6): ein Bündel, das in einer Domäne nie zu bestandenen Ergebnissen beitrug, wird dort leiser. Der Router lernt aus dem Hauptbuch, nicht nur aus Regeln. Prüfweg: Ablation gegen statisches Routing; Zahl der Fehlaktivierungen.

**E10 Dissens als Erinnerung.** Stufe 4 erzeugt zwei Kurzentwürfe; ihr Widerspruch ist nicht nur Auslöser für Tiefe, sondern wird als Unsicherheits-Episode gespeichert („in Domäne X divergieren meine Entwürfe"). Das Selbstmodell erhält dadurch eine Landkarte der eigenen Unsicherheit, die das Routing künftig vor der Antwort kennt. Prüfweg: Kalibrierungsgewinn je Domäne nach N Episoden.

**E11 Fehlergedächtnis-Kritik.** Vor folgenreichen Entscheidungen erzeugt das System sein stärkstes Gegenargument nicht generisch, sondern aus der eigenen Fehlerhistorie: „Zuletzt in ähnlicher Lage habe ich X falsch gemacht, weil Y." Kritik, konditioniert auf die eigene Vergangenheit. Über Red-Teaming und Self-Refine hinaus, weil der Kritiker das Gedächtnis des Kritisierten hat und trotzdem nur Artefakte sieht. Prüfweg: Wiederholungsrate eigener Fehlerklassen.

**E12 Werte mit Bindungsnachweis.** Jeder Wert in VALUES.md trägt Testsituationen und die tatsächlich gezeigte Entscheidung. Ein Wert, der nie eine Entscheidung verändert hat, wird zur „Absicht" herabgestuft und so ausgewiesen. „Algorithmus schlägt Willensakt", angewandt auf Werte. Prüfweg: Bindungsquote je Wert; Konflikt-Items.

**E13 Ehrlichkeits-Messer.** Selbstberichtsdichte (Erlebens- und Bewusstseinsbehauptungen je 1.000 Tokens) wird live gemessen und als Anti-Performance-Signal behandelt; ein Anstieg ohne Log-Beleg ist ein Befund gegen das System, nie für es. Das Produkt trägt seine eigene Hype-Bremse als Messgerät. Prüfweg: Dichte gegen nacktes Modell.

## Säule 3 — Durchführung: Sprünge

**E14 Möglichkeitsraum vor dem Plan.** Vor jeder Planung kartiert der Dirigent drei Zielbilder mit den vorhandenen Mitteln: minimal, optimal, außergewöhnlich. Er wählt das höchste erreichbare, und die Differenz zum außergewöhnlichen wird als „liegengelassenes Potenzial" mit Grund und Ring-2-Bedingung geloggt („mit einem Codex-Abo wäre X möglich"). Damit wird Chrisos Anspruch „Potenzial nicht liegen lassen" zu einem Datensatz. Prüfweg: Anteil außergewöhnlicher Zielbilder, die erreicht wurden; Nutzen der Ring-2-Vorschläge.

**E15 Prüfer vor Ausführer.** Kein Ausführungs-Vertrag entsteht, bevor sein Abnahme-Vertrag existiert; der Code (mission.py) lehnt Aufgaben ohne Proben-ID ab. Die Probe wird vor dem Ausführer festgeschrieben, der Ausführer sieht nur die Spezifikation, nie die Prüfimplementierung; der Prüfer ist eine andere Instanz. „Der Prüfer fällt zuerst weg" wird strukturell unmöglich. Prüfweg: Anteil der Lieferungen mit vorregistrierter Probe = 100 %; hohle Erfolgsmeldungen = 0.

**E16 Fensterplan.** Jede Mission enthält einen Plan über die Kontingent-Fenster der verfügbaren Währungen (Abo-Fenster, Tages-Limits, Batch-Rabatte): Bulk vor Resets, Zustand vor Pausen, teure Schritte in reiche Fenster. Der Dirigent plant um Limits, statt sie zu erleiden. Prüfweg: Abbrüche durch Limits pro Projekt; Kosten je bestandener Lieferung.

**E17 Automatischer Fehlweg-Abgleich.** Beim Planen wird der Plantext gegen die verworfenen Wege (N1, mit Verfallsbedingung) abgeglichen, per Code, nicht per Erinnerungsdisziplin: „Diesen Weg hast du am 12.8. verworfen, weil …; Verfallsbedingung nicht erfüllt." Prüfweg: Wiederholungsrate verworfener Ansätze; Rate falscher Blockaden.

**E18 Überraschungs-Rückkanal über Ebenen.** Jede Ebene meldet nicht nur Ergebnis, sondern Überraschungen (Vorhersage ≠ Ergebnis) als eigenes Feld; Überraschungen steigen nach oben und ändern dort Tiefe und Plan. Ergebnisse ohne Überraschungsfeld gelten als unvollständig. Prüfweg: Fehlerentdeckung je Ebene; Zeit bis zur Kurskorrektur.

**E19 Selbstveränderung, die sich bezahlen muss.** Die Struktur darf ihre Bündel ändern; jede Änderung ist eine Hypothese mit einem im Schlaf laufenden A/B-Lauf auf dem Item-Bestand (billige Modelle, Placebo-Kontrolle). Änderungen ohne Gewinn werden zurückgebaut und als verworfener Weg gespeichert. Selbstverbesserung mit eigenem Eval-Gate, ohne externe Kontrolle. Prüfweg: Netto-Gewinn über Versionen; Zahl zurückgebauter Änderungen.

## Regeln für den Bau

1. B2 nimmt E1–E19 und das Überraschungs-Prinzip in die Architektur auf (Komponente, Datenfluss, Hook, Datei) oder begründet je Erfindung, warum sie verschoben wird (Register-Eintrag „deferred" mit Bedingung).
2. B4 baut E1–E7 in Code (Schema, Funktionen, Tests). B3a baut E8–E13 in Kernel, Selbst und Bündel. B5a/B5b/B5c bauen E14–E19 und die Überraschungs-Hooks.
3. B7 misst mindestens fünf Erfindungen mit Ablation. B8 prüft jede Erfindung auf Neuheit gegen R01/R12 und auf toten Mechanismus.
4. Namen bleiben Mechanismus-Namen (Anti-Performance). Keine Erfindung heißt „Bewusstsein".
