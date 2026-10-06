# Der Türöffner: TransCal-AMR

> KI-unterstützter Plan, Stand 2026-10-06. Der Neuheitsanspruch (Abschnitt 3)
> steht unter Vorbehalt von Schritt 0 (Prior-Art-Scan). Nichts hier ist als
> gesicherte Weltneuheit zu lesen, bevor dieser Scan gelaufen ist.

## 0. Was das hier ist

Der eine, ehrliche Erstbeitrag, den du **allein, auf öffentlichen Daten, auf
deinem Laptop** bauen kannst, und der die Rampe zu etwas Großem ist: nicht die
Weltrettung, sondern der Baustein, den jedes einsetzbare Resistenz-Vorhersage-
Produkt braucht und den bisher niemand sauber geliefert hat.

## 1. Die Forschungsfrage in einem Satz

> Bleibt eine Resistenzvorhersage **ehrlich (kalibriert)**, wenn das Modell in ein
> **fremdes Krankenhaus** kommt, und wenn nicht: kann es das **selbst erkennen**
> (abstention), **mit wie wenig lokalen Daten** wird es wieder vertrauenswürdig,
> und was passiert, wenn der **Messwert selbst unsicher** ist (Heteroresistenz)?

## 2. Warum genau diese Frage

Das ganze Feld misst, wie gut ein Modell Fälle *unterscheidet* (AUC). Für den
Einsatz am Patienten ist aber die *Ehrlichkeit* der Wahrscheinlichkeit
entscheidend, und die bricht, sobald man das Modell woanders einsetzt. Die
Zulassungsbehörden verlangen genau das inzwischen ausdrücklich (FDA-Entwurf 1/2025
nennt „calibration drift" und „domain shift" als Pflicht-Überwachung; EU AI Act
Hochrisiko; TRIPOD+AI). Es ist also Rückenwind, keine Nische.

## 3. Der eigene, neue, kreative Ansatz

Nicht eine Einzelmetrik, sondern **vier Bausteine, die zusammen bisher niemand
als Paket geliefert hat** — und die alle aus einem einzigen Gedanken stammen:
**ehrlicher Umgang mit Unsicherheit** auf drei Ebenen.

1. **Kalibrierung zuerst, über Standorte hinweg.** Standort-übergreifend Trenn-
   schärfe UND Kalibrierung getrennt berichten. Der stärkste Konkurrent (ETH,
   DRIAMS) misst standortübergreifend *keine* Kalibrierung. Das ist die Lücke.
2. **Selektive Vorhersage (Abstention).** Das Modell darf „hier weiß ich es nicht"
   sagen, statt eine falsch-sichere Zahl auszugeben. Das löst direkt das klinische
   Schaden-Nutzen-Problem: lieber schweigen als in die Irre führen.
3. **Rekalibrierungs-Ökonomie.** Wie *wenige* lokale Proben braucht ein neues
   Krankenhaus, um dem Modell wieder zu trauen? Diese Deployment-Kostenfrage
   quantifiziert fast niemand, und sie ist kommerziell direkt relevant.
4. **Label-Rauschen bewusst modelliert.** Der Resistenz-Messwert selbst ist
   unsicher (Heteroresistenz, Wert nahe der Grenze) — der blinde Fleck, den die
   Kritik im alten Projekt aufdeckte. Das als Unsicherheit zu modellieren ist der
   originellste Dreh, und dein log2-MIC + hierarchisches Bayes-Setup ist dafür
   wie gemacht.

**Der rote Faden, der es intelligent und eigen macht:** alles ist
Unsicherheitsquantifizierung — über Standorte (Hierarchie), über Messwerte
(Messmodell) und über die eigene Kompetenz (Abstention). Genau das ist die Stärke
deines vorhandenen Prototyps. Das ist dein Alleinstellungsmerkmal.

**Das lauffähige Gerüst existiert schon:** `code/transcal_benchmark.py` zeigt alle
vier Bausteine auf synthetischen Mehr-Standort-Daten in vier Sekunden. Die Demo
belegt: AUC bleibt gut, Kalibrierung bricht über Standorte, Abstention hilft,
wenige Dutzend lokale Proben stellen die Ehrlichkeit wieder her, Label-Rauschen
verschlechtert sie sichtbar.

## 4. Warum das der Türöffner zu etwas Großem ist

Es ist exakt die Vorbedingung, die ein zulassbares Resistenz-Vorhersage-Produkt
(SaMD) braucht und die Käufer und Behörden verlangen. Ein sauberer, offener
Vergleichsmaßstab plus Methode hier ist zitierfähig, verteidigbar und der
Glaubwürdigkeits-Keil, mit dem du einen klinisch-regulatorischen Mitgründer und
einen Datenpartner gewinnst. Der Markt dahinter ist real (klinische
Entscheidungs-Software mehrere Milliarden, AMR-Diagnostik mehrere Milliarden).

**Ehrlich dabei bleiben:** Der Benchmark ist der Keil, nicht die Garantie. Der
Sprung zum Millionen-Produkt braucht danach Partner, klinische Daten, Zulassung
und Kapital. Das ist eine Ressourcenlücke, keine Wissenslücke.

## 5. Öffentliche Daten (ohne Antrag, solo)

Zu bestätigen in Schritt 0 auf Zugang und Inhalt: DRIAMS (Dryad, offen),
AMR-UTI (PhysioNet), ARMD Stanford/MGB, Pfizer ATLAS. Mehrere Standorte/Regionen,
mit Resistenzlabels und teils MIC/Breakpoints, was das Label-Rauschen-Modell
(Baustein 4) überhaupt erst möglich macht.

## 6. Acht-Wochen-Plan

- **Schritt 0 (Woche 1): Prior-Art-Scan + Datenzugang.** Belegen, dass genau dieses
  Vier-Baustein-Paket noch frei ist, und zwei Datensätze tatsächlich herunterladen.
  Das entscheidet Go oder Nein. Ehrlich: Wenn eine Gruppe das Paket schon hat,
  schärfen wir den Fokus (z.B. nur Baustein 3+4), statt zu überclaimen.
- **Woche 1: Präregistrierung** auf OSF (Hypothesen, Endpunkte, Leave-one-site-out,
  Abbruchkriterien), **bevor** du auf echten Daten rechnest.
- **Woche 2–3:** Echte Daten in die bestehende Schnittstelle, erste
  Standort-übergreifende Kalibrierungsergebnisse.
- **Woche 4–5:** Abstention und Rekalibrierungs-Ökonomie auf echten Daten.
- **Woche 6:** Label-Rauschen/Heteroresistenz-Modell auf den Datensätzen mit MIC.
- **Woche 7:** Negativkontrollen, Robustheitsanalysen, Abbildungen.
- **Woche 8:** Preprint schreiben, Code + Daten als Zenodo-DOI einfrieren,
  öffentliches Repo mit offener Lizenz. Das ist gleichzeitig der NLnet-Antragskern.

## 7. Was danach kommt

Preprint und offener Benchmark in der Hand → die drei europäischen Gruppen
anschreiben, die am nächsten dran sind (fachliche Einschätzung erbitten, nicht
Geld) → mit Interesse eines Partners den NLnet-Antrag und später den Gründer-/
Zulassungsweg. In dieser Reihenfolge, nicht anders.
