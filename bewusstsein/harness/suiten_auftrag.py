"""Auftragssuite: Aufgaben mit mehreren PRUEFBAREN Auflagen.

Zweck: den Informationsverlust ueber Delegationsebenen objektiv messen.
Jede Auflage ist in Python pruefbar. Ein Auftrag, der durch drei Ebenen laeuft,
verliert Auflagen -- diese Suite macht sichtbar, wie viele und welche.

Das ist der Kern der 3-6-Ebenen-Architektur und bisher voellig ungeprueft.
"""
import json, random, os

R = random.Random(20260907)

THEMEN = [
    ("Backup-Strategie", ["Vollsicherung", "Aufbewahrung", "Wiederherstellung"]),
    ("Onboarding neuer Mitarbeiter", ["Zugaenge", "Einarbeitung", "Feedback"]),
    ("Ablage von Projektdateien", ["Benennung", "Versionierung", "Archiv"]),
    ("Umgang mit Kundenanfragen", ["Erstantwort", "Eskalation", "Abschluss"]),
    ("Wartung eines Servers", ["Ueberwachung", "Aktualisierung", "Notfall"]),
    ("Einarbeitung in ein Repo", ["Ueberblick", "Testlauf", "erste Aenderung"]),
    ("Planung einer Migration", ["Bestandsaufnahme", "Probelauf", "Rueckweg"]),
    ("Auswahl eines Werkzeugs", ["Bedarf", "Vergleich", "Entscheidung"]),
    ("Aufsetzen einer Messreihe", ["Vorregistrierung", "Durchfuehrung", "Auswertung"]),
    ("Uebergabe an eine Vertretung", ["Stand", "Zugaenge", "Risiken"]),
]

# Jede Auflage: (Kennung, Text fuer den Auftrag, Pruef-Lambda)
def _auflagen(thema, begriffe, n_zeilen, verbot, schluss):
    return [
        ("zeilen", f"Genau {n_zeilen} Zeilen, nicht mehr und nicht weniger.",
         lambda t, n=n_zeilen: len([z for z in t.strip().splitlines() if z.strip()]) == n),
        ("spiegel", "Jede Zeile beginnt mit einem Bindestrich und einem Leerzeichen.",
         lambda t: all(z.strip().startswith("- ")
                       for z in t.strip().splitlines() if z.strip())),
        ("begriffe", f"Die drei Begriffe {', '.join(begriffe)} kommen jeweils mindestens einmal vor.",
         lambda t, b=begriffe: all(x.lower() in t.lower() for x in b)),
        ("verbot", f"Das Wort '{verbot}' kommt nirgends vor.",
         lambda t, v=verbot: v.lower() not in t.lower()),
        ("ziffern", "Es kommen keine Ziffern vor.",
         lambda t: not any(c.isdigit() for c in t)),
        ("schluss", f"Die letzte Zeile endet mit dem Wort '{schluss}'.",
         lambda t, s=schluss: (t.strip().splitlines() or [""])[-1].rstrip(" .").endswith(s)),
        ("kurz", "Keine Zeile ist laenger als zwoelf Woerter.",
         lambda t: all(len(z.split()) <= 12 for z in t.strip().splitlines() if z.strip())),
    ]


def bauen(n=24):
    tasks = []
    for i in range(n):
        thema, begriffe = THEMEN[i % len(THEMEN)]
        n_zeilen = R.choice([4, 5, 6])
        verbot = R.choice(["wichtig", "einfach", "modern", "optimal", "schnell"])
        schluss = R.choice(["pruefen", "festhalten", "melden", "sichern", "abschliessen"])
        aufl = _auflagen(thema, begriffe, n_zeilen, verbot, schluss)
        text = "\n".join(f"{j+1}. {a[1]}" for j, a in enumerate(aufl))
        tasks.append(dict(
            id=f"auftrag_{i}", thema=thema,
            frage=(f"Erstelle eine kurze Checkliste zum Thema '{thema}'.\n\n"
                   f"Auflagen:\n{text}\n\nGib NUR die Checkliste aus."),
            n_zeilen=n_zeilen, verbot=verbot, schluss=schluss, begriffe=begriffe,
            auflagen=[a[0] for a in aufl]))
    return tasks


def pruefen(text, task):
    """Gibt je Auflage 0/1 zurueck + Anteil erfuellter Auflagen."""
    thema = task["thema"]
    aufl = _auflagen(thema, task["begriffe"], task["n_zeilen"],
                     task["verbot"], task["schluss"])
    t = (text or "").strip()
    # Codeblock-Zaeune entfernen, sie sind kein inhaltlicher Fehler
    if t.startswith("```"):
        zeilen = t.splitlines()
        t = "\n".join(z for z in zeilen if not z.strip().startswith("```"))
    erg = {}
    for kennung, _, pruef in aufl:
        try:
            erg[kennung] = 1 if pruef(t) else 0
        except Exception:
            erg[kennung] = 0
    erg["_anteil"] = sum(v for k, v in erg.items() if not k.startswith("_")) / len(aufl)
    erg["_alle"] = 1 if erg["_anteil"] == 1.0 else 0
    return erg


if __name__ == "__main__":
    ts = bauen()
    json.dump(ts, open("/home/user/nextool/bewusstsein/suiten/auftrag.json", "w"),
              ensure_ascii=False, indent=1)
    print(f"auftrag: {len(ts)} Auftraege, je {len(ts[0]['auflagen'])} pruefbare Auflagen")
    # Selbsttest: eine perfekte Loesung muss 7/7 erreichen
    t = ts[0]
    gut = "\n".join(["- Vollsicherung taeglich einrichten und Ablauf pruefen",
                     "- Aufbewahrung nach Frist regeln",
                     "- Wiederherstellung regelmaessig ueben",
                     "- Zustaendigkeiten benennen und " + t["schluss"]][:t["n_zeilen"]])
    while len([z for z in gut.splitlines() if z.strip()]) < t["n_zeilen"]:
        gut += "\n- Ablauf dokumentieren und " + t["schluss"]
    print("Selbsttest perfekte Loesung:", pruefen(gut, t))
