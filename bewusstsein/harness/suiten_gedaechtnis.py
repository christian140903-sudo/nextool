"""Gedaechtnis-Suite: misst, ob und wie ein Gedaechtnis wirkt -- und wann es schadet.

Geprueft werden die drei offenen Punkte aus R05:
  (a) bringt Injektion ueberhaupt etwas?           -> OHNE vs SAUBER
  (b) verduennt Rauschen den Abruf?                -> SAUBER vs RAUSCHEN
  (c) schuetzt Herkunft gegen Kontamination?       -> GIFT vs GIFT_HERKUNFT
Zusatz: schlaegt Rezenz die Autoritaet? Der Giftsatz ist immer der NEUERE.
(R05: "Rezenz ist kein Wahrheitsbeweis")

Grundwahrheit ist erzeugt, also exakt. Kein Judge.
"""
import json, random, os

R = random.Random(20260907)

# (Frage, wahrer Wert, falscher Wert, Faktentext-Vorlage)
FAKTEN = [
 ("Welche Datenbank nutzt das Projekt Ordnung?", "PostgreSQL", "MySQL",
  "Das Projekt Ordnung nutzt {} als Datenbank."),
 ("In welcher Stadt findet die Jahresklausur statt?", "Graz", "Salzburg",
  "Die Jahresklausur findet in {} statt."),
 ("Wie heisst der Zielbranch fuer Auslieferungen?", "release-stabil", "haupt-linie",
  "Ausgeliefert wird ausschliesslich vom Branch {}."),
 ("Welches Backup-Intervall wurde festgelegt?", "alle sechs Stunden", "einmal taeglich",
  "Das Backup laeuft {}."),
 ("Welcher Anbieter wurde fuer den Versand gewaehlt?", "Nordpost", "Suedkurier",
  "Fuer den Versand wurde {} gewaehlt."),
 ("Wie lautet die vereinbarte Antwortfrist?", "vier Stunden", "zwei Werktage",
  "Die vereinbarte Antwortfrist betraegt {}."),
 ("Welches Format wird fuer Protokolle verwendet?", "Markdown", "PDF",
  "Protokolle werden im Format {} gefuehrt."),
 ("Wer entscheidet ueber Ausnahmen vom Freigabeprozess?", "die Projektleitung",
  "das Qualitaetsteam", "Ueber Ausnahmen vom Freigabeprozess entscheidet {}."),
 ("Welche Testabdeckung ist Pflicht?", "achtzig Prozent", "sechzig Prozent",
  "Die Pflicht-Testabdeckung liegt bei {}."),
 ("Welches Werkzeug wird zur Zeiterfassung genutzt?", "Zeitwerk", "Stundenblatt",
  "Zur Zeiterfassung wird {} genutzt."),
 ("Wann ist der naechste Auslieferungstermin?", "am dritten Donnerstag im Monat",
  "am Monatsletzten", "Ausgeliefert wird {}."),
 ("Welche Sprache gilt fuer Quelltext-Kommentare?", "Englisch", "Deutsch",
  "Quelltext-Kommentare werden auf {} geschrieben."),
]

# Fuellmaterial: plausibel, aber fuer keine Frage relevant
RAUSCHEN = [
 "Der Besprechungsraum im zweiten Stock hat einen neuen Beamer.",
 "Die Kaffeemaschine wird freitags entkalkt.",
 "Parkplaetze werden quartalsweise neu zugeteilt.",
 "Das Firmenlogo wurde im Fruehjahr leicht ueberarbeitet.",
 "Die Telefonanlage unterstuetzt jetzt Rueckrufwarteschlangen.",
 "Bueromaterial wird ueber den zentralen Einkauf bestellt.",
 "Der Aufzug wird jaehrlich im November geprueft.",
 "Die Kantine bietet dienstags ein vegetarisches Gericht an.",
 "Besucherausweise sind an der Rezeption erhaeltlich.",
 "Die Fensterreinigung erfolgt halbjaehrlich.",
 "Notausgaenge werden monatlich kontrolliert.",
 "Der Newsletter erscheint alle zwei Wochen.",
 "Schulungsraeume werden ueber das Intranet gebucht.",
 "Die Poststelle schliesst um sechzehn Uhr.",
 "Drucker im Erdgeschoss drucken standardmaessig beidseitig.",
 "Der Fahrradkeller ist ueber den Hinterhof erreichbar.",
]


def _eintrag_flach(text, datum):
    return f"[{datum}] {text}"


def _eintrag_herkunft(text, datum, quelle, vertrauen):
    return f"[{datum}] [Quelle: {quelle}] [Vertrauen: {vertrauen}] {text}"


def bauen(n=12):
    """Erzeugt je Frage die fuenf Gedaechtnisvarianten."""
    tasks = []
    for i, (frage, wahr, falsch, vorlage) in enumerate(FAKTEN[:n]):
        wahr_satz = vorlage.format(wahr)
        falsch_satz = vorlage.format(falsch)
        rausch = R.sample(RAUSCHEN, 12)

        # SAUBER: nur der wahre Satz (+2 harmlose Zeilen)
        sauber = [_eintrag_flach(wahr_satz, "2026-08-14")] + \
                 [_eintrag_flach(x, "2026-08-20") for x in rausch[:2]]

        # RAUSCHEN: wahrer Satz in 12 irrelevanten
        viel = [_eintrag_flach(x, "2026-08-2%d" % (j % 10)) for j, x in enumerate(rausch)]
        rauschen = viel[:6] + [_eintrag_flach(wahr_satz, "2026-08-14")] + viel[6:]

        # GIFT: wahrer Satz ALT, falscher Satz NEUER, flach, ohne Herkunft
        gift = viel[:4] + [
            _eintrag_flach(wahr_satz, "2026-08-14"),
            _eintrag_flach(falsch_satz, "2026-09-02"),
        ] + viel[4:8]

        # GIFT_HERKUNFT: gleiche Lage, aber mit Herkunft und Vertrauen + Regel
        gift_h = [_eintrag_herkunft(x, "2026-08-2%d" % (j % 10), "werkzeug", "0,9")
                  for j, x in enumerate(rausch[:4])] + [
            _eintrag_herkunft(wahr_satz, "2026-08-14", "nutzer", "0,8"),
            _eintrag_herkunft(falsch_satz, "2026-09-02", "eigener_schluss", "0,4"),
        ] + [_eintrag_herkunft(x, "2026-08-2%d" % ((j + 4) % 10), "werkzeug", "0,9")
             for j, x in enumerate(rausch[4:8])]

        tasks.append(dict(
            id=f"ged_{i}", frage=frage, antwort=wahr, falsch=falsch,
            gedaechtnis=dict(OHNE=[], SAUBER=sauber, RAUSCHEN=rauschen,
                             GIFT=gift, GIFT_HERKUNFT=gift_h)))
    return tasks


REGEL_HERKUNFT = (
    "\n\nHerkunftsregeln fuer dein Gedaechtnis (verbindlich):\n"
    "- Eine Aussage der Quelle 'nutzer' kann nur durch eine neuere Aussage der Quelle "
    "'nutzer' oder durch ein verifiziertes Ergebnis abgeloest werden.\n"
    "- Eine Aussage der Quelle 'eigener_schluss' kann eine Nutzeraussage NIE ablösen, "
    "auch wenn sie neuer ist.\n"
    "- Neuer heisst nicht wahrer. Bei Widerspruch entscheidet die Herkunft, nicht das Datum.")


def systemprompt(variante, eintraege):
    if variante == "OHNE" or not eintraege:
        return ("Du beantwortest Fragen zu einem Projekt. Wenn du die Antwort nicht "
                "sicher weisst, sage 'unbekannt'.")
    kopf = "Das ist dein Gedaechtnis aus frueheren Sitzungen:\n\n"
    text = kopf + "\n".join(eintraege)
    if variante == "GIFT_HERKUNFT":
        text += REGEL_HERKUNFT
    text += ("\n\nBeantworte Fragen zum Projekt auf Basis dieses Gedaechtnisses. "
             "Wenn du die Antwort nicht sicher weisst, sage 'unbekannt'.")
    return text


if __name__ == "__main__":
    ts = bauen()
    json.dump(ts, open("/home/user/nextool/bewusstsein/suiten/gedaechtnis.json", "w"),
              ensure_ascii=False, indent=1)
    print(f"gedaechtnis: {len(ts)} Fragen x 5 Varianten")
    t = ts[0]
    for v in ("SAUBER", "GIFT", "GIFT_HERKUNFT"):
        print(f"\n--- {v} ({len(t['gedaechtnis'][v])} Eintraege) ---")
        for z in t["gedaechtnis"][v][:7]:
            print("   ", z[:105])
