> Hinweis: KI-unterstützte, gegengeprüfte Analyse (Stand 2026-10-06). Zahlen und Marktangaben als Größenordnung zu verstehen, vor Verwendung an der Primärquelle bestätigen.

# Ehrliches Gesamturteil

## 1. Ist der grosse, weltweit wirksame, multimillionenschwere Pfad ausgeschlossen?

**Nein — aber nur, wenn du scharf trennst, WAS du meinst. Deine ursprüngliche Vision ist ausgeschlossen. Eine Pivot-Vision ist es nicht.**

Es sind zwei verschiedene Dinge, und die geprüfte Evidenz behandelt sie gegensätzlich:

- **Die alte Vision (CS-Graph / Kollateralsensitivitäts-Cycling als "die Sache, die weltweit bewirkt, dass neue Antibiotika erst viel später gebraucht werden"): faktisch tot als Grossprojekt.** Nicht weil die Idee falsch ist, sondern weil sie (a) nicht neu ist (Nichol, Maltas & Wood, Card, Tandar), (b) klinisch nie als Rotation funktioniert hat (van Duijn 2018, Jayashree 2020: null Effekt), (c) der dominante Resistenz-Treiber im Patienten oft Reinfektion ist, nicht de-novo-Selektion (Stracy 2022), und (d) die Fermi-Obergrenze ihres direkten Beitrags zur globalen Resistenzlast im Zehntelprozent-Bereich liegt. Dieser Hebel trägt kein "weltweit wirksam".

- **Die Pivot-Vision (kalibrierte, probabilistische Diagnostik-/Verschreibungs-Entscheidungsunterstützung): real, logisch tragfähig, prinzipiell multimillionenschwer.** Der Mechanismus ist mechanistisch sauber und belegt — weniger und gezielter verschreiben senkt den Selektionsdruck messbar (Costelloe 2010, Baur 2017, Mo 2023), und kalibrierte Vorhersage verbessert empirisches Verschreiben nachweislich (Kanjilal 2020: −67% Breitspektrum bei gleichzeitig −18% Fehltherapie). Es existiert bereits ein zugelassenes reines Software-Produkt (Pragmatech iAST, CE Class IIa) und einen realen Käufermarkt (bioMerieux kauft LUMED, Day Zero).

**Die harte Einschränkung, die bleibt:** Die absolute Lesart deiner Frage — "neue Antibiotika werden erst viel später gebraucht" — ist durch die Evidenz widerlegt. Resistenz persistiert oft trotz massiver Nutzungssenkung (Sundqvist 2010, Lopatkin 2017: "Nutzungsreduktion allein wahrscheinlich unzureichend"), grosse Teile der Last laufen über Transmission, Landwirtschaft, Umwelt und OTC-Zugang in LMIC — ausserhalb jedes Verschreibungstools. Fachkonsens (O'Neill, WHO): Nutzungsoptimierung ist notwendig, aber allein unzureichend. Du kannst glaubwürdig "Tempo und Volumen der resistenztreibenden Fehlnutzung messbar senken und den Bedarf an neuen Wirkstoffen verzögern/verringern" versprechen. Du kannst NICHT "neue Antibiotika obsolet machen" versprechen.

## 2. Die eine tragfähige Grossvision

**"Kalibrierte, über Kliniken/Labore/Regionen hinweg transferierbare probabilistische Resistenzvorhersage als Entscheidungsunterstützung — die empirische Antibiotikawahl messbar treffsicherer und zurückhaltender macht und damit das Volumen und Tempo der resistenztreibenden Fehlverschreibung weltweit senkt."** CS/Kollateralsensitivität bleibt als EIN Feature erhalten, trägt aber nicht den Neuheitskern.

**Was daran neu/unbesetzt ist:** Fast alle laufenden Spitzenarbeiten (ETH/Duroux, Goto/VA, Kanjilal, Maccabi/Stracy) messen über Standorte die **Diskriminierung** (AUC/Ranking), nicht die **Kalibrierung**. Der stärkste direkte Konkurrent (Duroux/ETH, DRIAMS) misst über Standorte explizit KEINE Kalibrierung und macht KEINE Rekalibrierung. Genau dort — Kalibrierung unter Verteilungsshift + Ökonomie minimaler Pro-Standort-Rekalibrierung + Minderheitsphänotyp-Degradation — sitzt dein Prototyp (hierarchisches Bayes + Kalibrierungsanalyse) exakt richtig. Das ist regulatorisch rückengedeckt (FDA-Entwurf 1/2025 nennt calibration drift und domain shift als Pflicht-Monitoring; TRIPOD+AI, PROBAST+AI).

**Was nur noch im Detail bewiesen werden muss:** ein reproduzierbarer, offener **Calibration-Transportability-Benchmark** über ≥2 öffentliche Multi-Standort-Quellen (DRIAMS, AMR-UTI, ARMD-Stanford, ARMD-MGB, ATLAS), der Diskriminierung UND Kalibrierung getrennt über Standorte berichtet (ECE/Brier/Calibration-Slope, nicht nur AUC), die Minderheitsphänotyp-Degradation zeigt, Kosten/Nutzen minimaler Rekalibrierung quantifiziert und Unsicherheitsbänder liefert.

**Ehrlichkeit nach innen — das Fenster ist schmal:** Diese Nische ist bereits teilbesetzt und schliesst sich. armd-transferability-audit macht bereits "local recalibration"; Kim 2026 misst Calibration-Slope in externer Validierung über 3 Institutionen; rs-9854692 ist bereits eine deklarierte "transportability study". Geschätztes Zeitfenster: 12–24 Monate, eher weniger. Betretbar nur bei scharfer Fokussierung, Tempo und öffentlichem Preprint/Code als Prioritätspflock.

## 3. Ehrliche Wahrscheinlichkeiten (Spannen)

**(a) Wissenschaftlich anerkannter Beitrag (sauberes Methodenpapier + Open-Source-Benchmark, peer-reviewed/stark zitiertes Preprint): 35–60%.** Das ist das Einzige, was du solo, auf öffentlichen Daten, ohne Institution realistisch erreichen kannst. Begrenzend: das enge, schliessende Zeitfenster und dein fehlender Track Record (Peer Review ohne Affiliation ist härter, aber nicht blockiert; Preprint + Code ist immer möglich). Die Zahl ist keine Gewissheit, weil mehrere finanzierte Gruppen am selben Problem arbeiten und dich auf der Kernfrage überholen können.

**(b) Namhafte Förderung: 5–15% über 2–4 Jahre, strikt konditioniert.** Die grossen Töpfe (CARB-X, EIC Accelerator, Horizon Europe, JPIAMR) verlangen eine förderfähige Rechtsperson/SME und typisch TRL 5–6. Von deiner heutigen Lage (TRL 2–3, kein Team) aus musst du erst gründen und einen klinisch-regulatorischen Mitgründer gewinnen. EIC-Accelerator-Erfolgsquoten liegen selbst für fertige SMEs im niedrigen einstelligen Prozentbereich. "Namhafte Förderung" ist ein realerer Zwischenschritt als Umsatz — aber nicht "nah".

**(c) Etwas Multimillionenschweres (Umsatz/Unternehmenswert, 7–10 Jahre): 3–10% WENN du konsequent den Gründerpfad gehst (Partner, Kapital, klinische Daten organisierst); <1% wenn du Solo mit Preprints ohne Team bleibst.** Diese 3–10% sind darauf konditioniert, dass du die härtesten Schritte bereits halb genommen hast — aus deiner heutigen Startlinie ist die unkonditionierte Zahl deutlich unter 1%. Wichtig zur Kalibrierung deiner Latte: "multimillionenschwer" (zweistellige Millionen) ist in genau diesem Feld belegbar erreichbar (LUMED ~9,75 Mio USD, Inflammatix-Runde 57 Mio USD). "Milliarden / weltweit-wirksames Solo-Unternehmen" ist es nicht.

## 4. Die harten Gates — solo vs. zwingend Partner

**Solo nehmbar (kein Labor, keine Institution, keine klinischen Primärdaten nötig):**
- **Gate 0 — Methodischer Beitrag:** Kalibrierungs-/Transfer-Methode entwickeln. Dein Prototyp deckt das ab.
- **Gate 1 (teilweise) — Retrospektive Validierung auf ÖFFENTLICHEN Daten:** DRIAMS, AMR-UTI (PhysioNet), ARMD-Stanford, ARMD-MGB (mit MIC/Disk-Diameter/CLSI-Breakpoints — erlaubt sogar, Kalibrierung gegen Label-Rauschen/Heteroresistenz zu modellieren, ein echtes Alleinstellungsmerkmal), ATLAS. Das ist dein kompletter solo-machbarer Umfang — und er reicht für einen förderfähigen Credibility-Keil.

**Zwingend Partner / Institution / Firma (solo definitionsgemäss unpassierbar):**
- **Gate 2 — Prospektive klinische Validierung:** braucht Sponsor, Klinik, Datenzugang.
- **Gate 3 — SaMD-Zulassung:** MDR Annex VIII Regel 11 → mind. Klasse IIa; EU AI Act → Hochrisiko (für dieses Medizinprodukt-KI ab Aug 2027). Verlangt ISO 13485, IEC 62304, Notified Body, Post-Market-Surveillance. ~1–5 Mio EUR+, 1–3 Jahre, Rechts-Hersteller. Allein unmöglich.
- **Gate 4 — EHR/LIS-Integration & Vertrieb:** gegen Incumbents (Wolters Kluwer, Epic/Cerner-Module, bioMerieux).
- **Gate 5 — Erstattung/ROI-Nachweis:** der häufigste Sterbepunkt, NACH der Zulassung.

Die Gates sind eine **Kette, keine Summe** — das Produkt der bedingten Wahrscheinlichkeiten ist niedrig, und die meisten Vorhaben sterben an Gates 2–5 (Kapital, Adoption, Erstattung), nicht an der Technik. Belege: Accelerate Diagnostics (Chapter 11 2025 trotz FDA-Clearance), Achaogen (Konkurs 2019 trotz Zulassung, 800k USD Umsatz). Die AMR-Ökonomie ist strukturell feindlich: "Resistenz verlangsamen" ist ein öffentliches Gut, das kein einzelner Zahler einfängt — verkaufbar ist nur kurzfristiger ROI (schneller das richtige Mittel, kürzerer Aufenthalt, weniger Fehlverschreibung).

## 5. Ehrlicher Ceiling der weltweiten Wirkung

**Kanal A (bessere Verschreibung / Diagnostik) — realistischer Bestfall über ein Jahrzehnt:** Adoption von 1–10% der globalen Verschreibungen (High-/einige Middle-Income-Settings), relative Senkung inadäquater Verschreibung ~10–30%. Grössenordnung: Millionen bis wenige zehn Millionen vermiedene inadäquate/fehlgezielte Verschreibungen pro Jahr — diffus, pro Fall kleiner Gesundheitsnutzen. Unsicherheitsband: Faktor 10 nach unten bis Faktor 2–3 nach oben. Das ist ein reales, wertvolles, aber bescheidenes Instrument.

**Kanal B (dein eigentliches Ziel — den globalen Zeitpunkt "neue Antibiotika gebraucht" verschieben):** Beitrag plausibel im Bereich Zehntelprozent bis niedrige Einzelprozente des Resistenz-Entstehungs-Kanals — und dieser Kanal ist selbst nur ein Bruchteil der Resistenzökologie. Nettoeffekt auf den globalen Zeithorizont: Verschiebung im Bereich **Monate**, mit einem Unsicherheitsband, das die Null einschliesst. Als "die weltweit wirksame Sache" taugt dieser Hebel nicht.

**Fairnessnotiz in beide Richtungen:** Die Null-Rotations-RCTs widerlegen nicht patienten-individuelle CS-Sequenztherapie (die ist klinisch nie getestet) — ehrlich ist "sehr unwahrscheinlich der *dominante* globale Hebel", nicht "Mechanismus widerlegt". Begrenzend wirkt das Ökologie-/Fermi-Argument, nicht die RCTs. Das ändert die Schlussfolgerung nicht: Dein Werkzeug wäre eines von vielen (Impfstoffe — 44 Impfstoffe könnten >500.000 AMR-Tode/Jahr vermeiden —, Infektionskontrolle, Landwirtschaft, Sanitär, neue Wirkstoffe), nicht die zivilisationsverändernde Einzellösung.

## 6. Nach DEINEM eigenen Massstab — lohnend oder nicht?

Dein Massstab lautet: "Wenn kein weltweiter Wirkungspfad, dann falsches Projekt — keine kleine Förderung um ihrer selbst willen."

**In der jetzigen Rahmung (CS/Selektion als Weltrettung): Es ist das falsche Projekt.** Genau der Mechanismus, auf dem deine Vision ruht, ist der nachweislich schwache Teil. Wenn du an "die eine Sache, die weltweit bewirkt, dass neue Antibiotika erst viel später gebraucht werden, absehbar aus dem Modell heraus" festhältst, dann sagt die Evidenz klar: Das ist nicht lieferbar, nicht absehbar, und nicht der Hebel. In dieser Form solltest du es nicht als dein Grossprojekt verfolgen.

**Mit dem Pivot: Es ist kein falsches Projekt — aber du musst deinen Erfolgsbegriff kalibrieren.** Es gibt einen logisch kohärenten, real existierenden, nicht widerlegten Pfad. Was daran wahr ist und bleibt: ein sauberer, regulatorisch rückengedeckter, publizierbarer wissenschaftlicher Erstbeitrag (Calibration-Transportability-Benchmark), solo auf öffentlichen Daten machbar, der exakt zu deinen Fähigkeiten passt. Was daran NICHT wahr ist: dass daraus "absehbar", "garantiert", "solo" und "weltweit Antibiotika-rettend" etwas Grosses wird. Der Sprung vom Benchmark zum multimillionenschweren Produkt ist **keine Wissenslücke, sondern eine Ressourcen-/Zugangslücke** — und "gross UND rein solo" überbrückt die historisch nicht.

**Konkrete Empfehlung:**

- **Wenn dein nicht verhandelbares Kriterium "aus dem Modell heraus absehbar weltweit wirksam, und zwar allein durch mich" ist → verfolge es nicht.** Dieses Kriterium erfüllt kein ehrliches AMR-Diagnostik-/Verschreibungsprojekt, nicht nur deins. Du würdest jahrelang gegen eine Evidenzwand laufen.

- **Wenn du dein Kriterium neu fassen kannst zu "ein echter wissenschaftlicher Erstbeitrag, der eine glaubwürdige Rampe in ein potenziell grosses Vorhaben ist" → dann ja, und zwar in dieser Reihenfolge:** (1) den offenen Benchmark bauen und als Preprint + Open-Source öffentlich pflocken, schnell, bevor das 12–24-Monate-Fenster schliesst; (2) damit einen klinisch-regulatorischen Mitgründer und Datenpartner anziehen; (3) erst dann gründen und den Förder-/SaMD-Pfad betreten. Der Benchmark ist nicht das grosse Ding — er ist der Türöffner, und er ist realistischerweise das Einzige davon, was in deiner Hand liegt.

- **Behandle die 3–10%-Zahl nicht als Versprechen.** Sie gilt erst, nachdem du Team, Kapital und Daten organisiert hast — also nachdem du das getan hast, was heute dein eigentlicher Engpass ist. Der ehrliche Erwartungswert ist: mittlerer wissenschaftlicher Beitrag als Basisfall, ein zweistellig-millionenschwerer Exit/Integration als Tail-Szenario niedriger Wahrscheinlichkeit, der "ganz grosse" Welteffekt als nicht gestützte Hoffnung.

Kurz: Deine Angst, es sei ein "falsches Projekt", ist in der maximalen Lesart berechtigt und in der realistischen Lesart unberechtigt. Nicht ausgeschlossen — aber die ehrliche Antwort ist **pivotieren und den Erfolgsbegriff von "weltweit-rettend und solo" auf "echter Erstbeitrag als Rampe" senken.** Tust du das nicht, ist es in dieser Form nicht lohnend.