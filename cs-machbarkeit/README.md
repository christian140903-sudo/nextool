# Kollateralsensitivität als kalibrierte Wahrscheinlichkeit

Methodische Vorarbeit zu einem Machbarkeitsnachweis. Ziel ist zu prüfen, ob sich
Kollateralsensitivität zwischen Antibiotika als **kalibrierte Wahrscheinlichkeit**
vorhersagen lässt, statt als binäre Ja/Nein-Eigenschaft.

Alles hier läuft mit `numpy` allein, in Sekunden, auf einem gewöhnlichen Laptop.
Es werden keine GPU, kein Cluster und keine 10 GB Arbeitsspeicher benötigt.

## Die Umdeutung, auf der alles beruht

Kollateralsensitivität ist zwischen unabhängigen Evolutionsreplikaten schlecht
reproduzierbar. Die Frage "zeigt Paar (A,B) Kollateralsensitivität?" hat deshalb
oft keine stabile Antwort. Die beantwortbare Frage lautet:

> Mit welcher Wahrscheinlichkeit zeigt ein **neues, ungesehenes** Replikat
> Kollateralsensitivität, und ist diese Wahrscheinlichkeit kalibriert?

Kalibriert heißt: Wenn das Modell 70 % sagt, tritt das Ereignis in 70 % der Fälle
ein. Das ist ein schwächerer, aber ehrlicher und nachweisbarer Anspruch.

**Der primäre Endpunkt ist die Kalibrierung, nicht die Treffergenauigkeit.**
Die biologische Obergrenze der Treffergenauigkeit liegt bei etwa 68 %. Ein Modell,
das weiß, wann es sicher ist und wann nicht, ist trotzdem brauchbar. Eines mit
70 % Trefferquote ohne Unsicherheitsangabe ist es nicht.

## Dateien

| Datei | Inhalt |
|---|---|
| `code/cs_modell.py` | Referenzimplementierung: Datenaufbereitung, hierarchisches Beta-Binomial-Modell, Baselines, Gütemaße, Negativkontrollen |
| `code/formelpruefung.py` | Prüft drei Formeln eines bestehenden Konzeptpapiers auf innere Konsistenz |
| `code/machbarkeit.py` | Gegen bekannte Grundwahrheit: trägt die statistische Kernidee? |
| `code/fallzahlplanung.py` | Wie viele Arzneimittelpaare braucht der Nachweis? |

Ausführen: `python3 code/machbarkeit.py`

## Bisherige Befunde

**Das hierarchische Modell wirkt.** Bei 1500 Paaren und nur drei Replikaten je Paar
sinkt der Kalibrierungsfehler gegenüber der naiven Häufigkeitsschätzung von 0.0374
auf 0.0025, also um den Faktor 15. Der Mechanismus ist partial pooling: Extreme
Schätzungen wie 0/3 oder 3/3 werden zur gemeinsamen Mitte gezogen, und zwar umso
stärker, je weniger Replikate vorliegen.

**Mindestumfang.** Für den Nachweis "besser als Zufall" sind rund 400 Arzneimittel-
paare im Testsatz nötig; dort liegt die Power bei 100 %. Unter 200 Paaren scheitert
die Studie häufig an ihrer eigenen Streuung. Der Kalibrierungsvorteil ist robuster
und bereits ab etwa 200 Paaren klar nachweisbar.

**Eine Falle, die unbedingt im Methodenteil adressiert gehört.** Der Brier-Vorteil
des hierarchischen Modells bleibt auch dann positiv, wenn in den Daten gar kein
Signal steckt. Das ist kein Fehler: Shrinkage hilft auch unter der Nullhypothese,
weil der naive Schätzer weiterhin falsche Sicherheit vortäuscht. Wer das nicht von
selbst erklärt, dessen Ergebnis wird als Scheineffekt gelesen. Die AUC fällt unter
der Nullhypothese korrekt auf 0.5 und ist deshalb die ehrlichere Signalanzeige.

## Drei Fehler im geprüften Konzeptpapier

1. **Widersprüchliche Vorzeichenkonvention.** Zwei Abschnitte definieren den
   Kollateralsensitivitäts-Index mit vertauschtem Zähler und Nenner. Für denselben
   Sachverhalt ergibt das +2.0 und −2.0. Jede Zahl wird dadurch uninterpretierbar.
   `cs_modell.cs_index()` legt **eine** Konvention fest: positiv bedeutet
   Kollateralsensitivität.

2. **Dimensional unzulässiger Stabilitätsindex.** `S = 1 − Var(CS)/|CS₀|` setzt
   quadrierte log2-Einheiten ins Verhältnis zu einfachen. S verlässt den Bereich
   von null bis eins schon bei moderater Streuung und divergiert, sobald die
   Ausgangs-CS nahe null liegt. Zwei dimensionskonsistente Alternativen stehen in
   `formelpruefung.py`.

3. **Falsch etikettierte Unsicherheit.** Die als "bayesianische Inferenz"
   bezeichnete Größe ist die gewöhnliche Stichproben-Standardabweichung. Bei drei
   Replikaten liegt deren 90-%-Bereich zwischen 0.23 und 1.73, wenn die Wahrheit
   1.0 beträgt. Genau hier ist ein hierarchisches Modell sachlich zwingend.

## Noch offen

Literaturstand zur Reproduzierbarkeit, Verfügbarkeit öffentlicher Datensätze,
Neuheitsprüfung gegen bestehende Modelle und die Förderwege werden derzeit geprüft.
Bis dahin sind die Simulationen hier gegen **synthetische** Grundwahrheit validiert,
nicht gegen reale Messdaten.
