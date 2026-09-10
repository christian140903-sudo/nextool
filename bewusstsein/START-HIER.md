# Die Tür — was hier liegt und wie man es prüft

## Der Stand in drei Sätzen

Gemessen wurden rund 10 500 Modellaufrufe in vier Runden; was eine Zahl bekommen hat, steht in
`uebergabe/01-BEFUNDE.md`, alles Rohe in `belege/`. Gebaut wurde daraus **Soul 10**
(`ordnung/soul10/`) — ein Dirigent für Claude Code aus genau den Mechanismen, die eine Zahl
tragen; was nicht gebaut wurde, steht mit Grund in `ENTSCHEIDUNG.md` §3. Der Bau ist adversarial
geprüft (fünf Prüfer, 70 Befunde, 68 behoben) und mit 791 Tests abgenommen: `ABNAHME.md`.

## Der eine Satz für ein neues Modell

> Lies `ordnung/soul10/ENTSCHEIDUNG.md` (was gebaut ist und warum), dann `ABNAHME.md` (was
> abgenommen ist und was ausdrücklich nicht). Für die Messgrundlage: `uebergabe/01-BEFUNDE.md`.
> Danach entscheide selbst — du darfst jeden Befund umstoßen, solange für alles, was trägt, eine
> Zahl oder ein laufender Test existiert.

## Was wo liegt

| Pfad | Was |
|---|---|
| **`ordnung/soul10/`** | **der Bau.** `ENTSCHEIDUNG.md` (was, was nicht, warum) · `ARCHITEKTUR.md` (Schnittstellen, Regeln) · `ABNAHME.md` (Testlauf, Messungen, Prüfung, Rauchtest, Grenzen) · `README.md` · `core/` · `tests/` |
| `ordnung/soul10/CLAUDE.md` | die Betriebsanweisung des Dirigenten: neun Direktiven, je ein Mechanismus in `core/` |
| `bewusstsein/uebergabe/01-BEFUNDE.md` | alle Messwerte mit Belegpfad (Runden 1–4) |
| `bewusstsein/uebergabe/03-OFFENE-FRAGEN.md` | was ungeprüft ist, nach Wert sortiert |
| `bewusstsein/uebergabe/04-WEITERMESSEN.md` | wie man einen neuen Mechanismus prüft, bevor er hineinkommt |
| `bewusstsein/uebergabe/06-AUFTRAG.md` | das Zielbild des Nutzers, aus dem Soul 10 entstanden ist |
| `bewusstsein/harness/` | die Prüfstrecke, lauffähig — dieselben Texte, die im Produkt stehen |
| `bewusstsein/berichte/03-RUNDE4-BAU.md` | die drei Messungen der Bauphase: M1 widerlegt, M2 unentschieden, M3 bestätigt |
| `bewusstsein/ergebnisse/ENDZAHLEN.json` | jede Armzahl, gegen die der Berichtsprüfer prüft |
| `bewusstsein/belege/` | Rohdaten aller Modellaufrufe, je Lauf ein Archiv |
| `ordnung/` (ohne `soul10/`) | die Entwurfsarbeit des Vorgängers, unverändert — Quelle, nicht Anweisung |

## Prüfen, ob alles stimmt

```bash
cd ordnung/soul10 && python3 -m pytest tests -q     # der gebaute Kern: 791 Tests, kein Netz, kein Modellaufruf
python3 bewusstsein/harness/bericht_pruefen.py      # 54 Armzahlen aus ENDZAHLEN.json gegen den Bericht
python3 bewusstsein/werkzeuge/bestandsaufnahme.py   # Geräte-Erkennung, Geheimnisse nur als vorhanden/nicht
```

Der erste Befehl ist die Abnahme: er läuft in einem frischen `SOUL10_HOME`, ruft kein Modell und
braucht kein Netz. Der zweite prüft, dass keine Zahl im Bericht steht, die die Daten nicht hergeben.

## Die eine Regel

Nichts kommt hinein ohne Zahl oder laufenden Test. Was gemessen ist, steht mit Zahl; was gebaut,
aber ungemessen ist, steht in `ABNAHME.md` §7 als solches; was nicht gebaut ist, steht in
`ENTSCHEIDUNG.md` §3 mit der Bedingung, unter der es gebaut würde.
