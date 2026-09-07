# Übergabe an den Bau-Chat — so geht's

## Der eine Satz für das bauende Modell

> Lies `bewusstsein/uebergabe/06-AUFTRAG.md` vollständig, danach
> `bewusstsein/uebergabe/01-BEFUNDE.md` und `ordnung/docs/research/`.
> Dann entscheide selbst, was gebaut wird — du darfst jeden Befund und jeden
> Entwurf umstoßen, solange für alles, was trägt, eine Zahl oder ein laufender
> Test existiert.

## Was wo liegt

| Pfad | Was |
|---|---|
| `bewusstsein/uebergabe/06-AUFTRAG.md` | **Einstieg.** Ziel, Vertrauensgrade, Vollmacht, Bauordnung |
| `bewusstsein/uebergabe/01-BEFUNDE.md` | alle Messwerte mit Belegpfad |
| `bewusstsein/uebergabe/02-BAUVORGABEN.md` | bauen / weglassen, je mit Zahl |
| `bewusstsein/uebergabe/03-OFFENE-FRAGEN.md` | was ungeprüft ist, nach Wert sortiert |
| `bewusstsein/uebergabe/04-WEITERMESSEN.md` | wie man einen neuen Mechanismus prüft |
| `bewusstsein/uebergabe/05-VORGEHEN.md` | Umgangsweisen je Thema + die Fallen |
| `bewusstsein/harness/` | die Prüfstrecke, lauffähig |
| `bewusstsein/werkzeuge/bestandsaufnahme.py` | Geräte-Erkennung, läuft |
| `bewusstsein/belege/` | Rohdaten aller ~10 500 Modellaufrufe |
| `ordnung/` | die Entwurfsarbeit des Vorgängers — **unverändert** |

## Prüfen, ob alles stimmt

```bash
python3 bewusstsein/harness/bericht_pruefen.py      # Zahlen gegen die Daten
python3 bewusstsein/werkzeuge/bestandsaufnahme.py   # Geräte-Erkennung
```
