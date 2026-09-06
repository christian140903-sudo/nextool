# Bewusstseinsstruktur — empirische Prüfstrecke

Eigenständiger Zweig neben `ordnung/`. **Nichts in `ordnung/` wird verändert.**

`ordnung/` hat die Theorie geleistet (R06 liefert einen guten Indikatorkatalog).
Was fehlte: **es wurde nie etwas gemessen.** Diese Strecke misst.

## Die Frage, die hier beantwortet wird

Nicht „entsteht Bewusstsein?" — das ist nach Stand der Forschung nicht entscheidbar
(R06, Kernaussage 12). Sondern die beiden Fragen, die der Auftraggeber tatsächlich
gestellt hat und die entscheidbar sind:

1. **Wirkt es?** Verbessert eine Bewusstseinsstruktur die Verarbeitung messbar —
   gegen nackt, gegen längen-gematchten Placebo und gegen Selbstkonsistenz@3?
2. **Stört es?** Schadet die Struktur dort, wo sie nicht gebraucht wird?

## Aufbau

- `harness/runner.py` — kontrollierte Modellaufrufe über die Claude-CLI.
  Roh-Artefakt-Zwang, Wiederaufnahme nach Limits, Token-Buchführung.
- `harness/bewerten.py` — **objektive** Bewertung, kein Judge-Modell.
- `harness/statistik.py` — gepaarter Bootstrap, Brier, ECE, AUC.
- `harness/arme.py` — die Arme (Baselines + Bewusstseins-Varianten).
- `harness/suiten_*.py` — Aufgaben mit programmatisch gerechneter Grundwahrheit.
- `harness/analyse.py` — Auswertung mit Confound-Kontrolle.

## Methodische Entscheidungen (und warum)

- **Kein Judge-Modell.** Jede Grundwahrheit wird in Python gerechnet. Der
  Längenbias des Judges hat in der Vorgängerforschung vier Zahlen gekostet;
  diese Angriffsfläche existiert hier nicht.
- **Programmatisch erzeugte Aufgaben.** Zufällige Parameter → nicht memorierbar.
  Klassische Denkfallen (Bat-and-Ball etc.) löst das Modell zu 100 % aus dem
  Gedächtnis; sie messen Abruf, nicht Verarbeitung.
- **Token-Buchführung je Arm.** Eine Struktur, die nur mehr sichtbares Rechnen
  auslöst, hat nicht „besser gedacht", sondern mehr Rechenzeit gekauft.
  Das wird getrennt ausgewiesen.
- **Zwei Regime.** Der entscheidende Fund der Vorbereitung: mit eingeschaltetem
  Extended Thinking liegt das Modell bei 100 % — eine Prompt-Struktur kann dort
  nichts mehr beitragen, weil der interne Arbeitsraum schon existiert.
  Gemessen wird deshalb getrennt mit und ohne dieses Denkbudget.
