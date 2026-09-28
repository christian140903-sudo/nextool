# eval/ — die Prüfstrecke ist Teil des Produkts

Soul 10 misst sich mit der Strecke unter `bewusstsein/harness/` (Runner über die Claude-CLI,
objektive Grundwahrheit in Python, gepaarter Bootstrap, Roh-Artefakt-Zwang). Nichts davon
wird hier dupliziert. Jeder neue Mechanismus bekommt zuerst einen Arm dort; die
Aufnahmekriterien stehen in `bewusstsein/uebergabe/04-WEITERMESSEN.md`.

## Die drei Messungen dieser Bauphase (vorregistriert in `../ENTSCHEIDUNG.md` §4)

```bash
# M1 — Überraschung als Schalter (Architektur A_UEBERRASCHUNG, mehrfach.py)
python3 bewusstsein/harness/experiment_arch.py --suiten kette20 \
  --arch A_SC3,A_PRUEFER,A_UEBERRASCHUNG --runs 3 --limit 25 --denken 0 --modus direkt \
  --out bewusstsein/ergebnisse/m1_ueberraschung
python3 bewusstsein/harness/analyse_ueberraschung.py

# M2 — Nahtprotokoll (Verfahren ZERLEGT_NAHT, zerlegung.py)
python3 bewusstsein/harness/experiment_zerlegung.py --verfahren GANZ,ZERLEGT_CODE,ZERLEGT_NAHT \
  --runs 3 --limit 12 --teile 10 --denken "" --out bewusstsein/ergebnisse/m2_naht

# M3 — das gebaute Hauptbuch rendert die gemessene Herkunft (nach dem Bau)
python3 ordnung/soul10/eval/m3_hauptbuch.py
```

Die Zahlen wandern nach `bewusstsein/ergebnisse/ENDZAHLEN.json` und in
`bewusstsein/uebergabe/01-BEFUNDE.md`; `bewusstsein/harness/bericht_pruefen.py` prüft, dass
Bericht und Daten übereinstimmen.
