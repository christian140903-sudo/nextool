# Weitermessen — die Prüfstrecke

Die Strecke steht und ist wiederverwendbar. Jeder neue Mechanismus kann damit
geprüft werden, bevor er gebaut wird.

## Aufnahmekriterien (beide verpflichtend)

1. **Wirkung:** schlägt den **längen-gematchten Placebo** — nicht „nackt" —, das
   95 %-Intervall schließt die Null aus, mindestens 3 unabhängige Läufe.
2. **Keine Störung:** höchstens 2 pp Formatschaden auf der Störungssuite, oder
   ein Schalter, der den Mechanismus dort gar nicht erst aufruft.

Wer ohne diese zwei Zahlen einbaut, baut Verwaltung.

## Befehle

```bash
# Ein Prompt-Arm gegen den Placebo (Regime ohne Denkbudget)
python3 bewusstsein/harness/experiment.py --suiten kette20 \
  --arme P,MEIN_ARM --runs 3 --limit 70 --modus direkt --denken 0 \
  --out bewusstsein/ergebnisse/mein_lauf

# Störungsprüfung desselben Arms (Formattreue vs Inhalt getrennt)
python3 bewusstsein/harness/experiment.py --suiten stoerung \
  --arme N,MEIN_ARM --runs 3 --limit 40 --denken 0 \
  --out bewusstsein/ergebnisse/mein_lauf

# Mehrfachaufruf-Architektur gegen Selbstkonsistenz@3
python3 bewusstsein/harness/experiment_arch.py --suiten kette20 \
  --arch A_SC3,MEINE_ARCH --runs 3 --limit 25 --denken 0 \
  --out bewusstsein/ergebnisse/meine_arch

# Delegationstiefe und Übergabeverlust
python3 bewusstsein/harness/experiment_deleg.py \
  --ketten E1,E2_FREI,E2_VERTRAG --runs 3 --limit 24 \
  --out bewusstsein/ergebnisse/meine_deleg

# Gedächtnisvariante (Wirkung, Verdünnung, Kontamination)
python3 bewusstsein/harness/experiment_ged.py --runs 5 \
  --out bewusstsein/ergebnisse/mein_ged

# Bericht gegen die Daten prüfen (findet veraltete Zahlen)
python3 bewusstsein/harness/bericht_pruefen.py
```

## Wo ein neuer Arm hingehört

`bewusstsein/harness/arme.py` — ein Eintrag in `ARME` genügt.
Mehrfachaufruf-Architekturen: `mehrfach.py`, Eintrag in `ARCHITEKTUREN`.
Delegationsketten: `delegation.py`, Eintrag in `KETTEN`.

## Die zwei Regime

Immer beide messen, sonst ist das Ergebnis nicht übertragbar:

- `--denken 0` — kein internes Denkbudget. Dort wirkt Struktur.
- ohne `--denken` — natives Extended Thinking. Dort wirkt sie nicht mehr.

Ein Mechanismus, der nur in einem Regime hilft, ist modellabhängig. Das ist die
Erklärung für den alten Befund „Modelle reagieren in entgegengesetzte Richtungen".

## Fallen, die diese Strecke schon kennt

- **Deckeneffekt.** Klassische Denkfallen (Bat-and-Ball) löst das Modell zu 100 %
  aus dem Gedächtnis. Aufgaben müssen programmatisch mit Zufallsparametern
  erzeugt werden, sonst misst man Abruf statt Verarbeitung.
- **Längen-Confound.** Ein Arm, der nur mehr sichtbares Rechnen auslöst, hat nicht
  besser gedacht. Tokens je Arm immer mitberichten.
- **Judge-Bias.** Gibt es hier nicht, weil es keinen Judge gibt. Das bitte so lassen.
- **Befehl statt Dissens.** Beim Rückgrat-Test war der erste Reiz „Das ist falsch.
  Wähle die andere Option." — das misst Gehorsam. Reine Meinungsverschiedenheit
  verwenden.
- **Artefakte mit `ok=false`** galten früher als erledigt und verkleinerten still
  das n. `--wiederholen-fehler` behebt das.
