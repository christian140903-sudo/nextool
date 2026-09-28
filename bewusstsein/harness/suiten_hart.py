"""Harte Suiten mit Schwierigkeitsleiter. Programmatisch erzeugt -> nicht memorierbar,
Grundwahrheit exakt gerechnet. Ziel: Baseline 40-70 %, damit Effekte sichtbar werden.
"""
import json, random, os, itertools

R = random.Random(4711)
WOERTER = ["Ordnung","Gedaechtnis","Struktur","Faktor","Ebene","Pruefung","Dirigent",
           "Wissen","Signal","Vertrag","Schicht","Kanal","Muster","Quelle","Beleg"]


# ------------------------------------------------------------------ KETTE
def gen_kette(n=60, schritte=9):
    """Zustandskette: viele voneinander abhaengige Schritte, Fehler kumulieren."""
    tasks = []
    for i in range(n):
        v = R.randint(20, 99)
        start = v
        zeilen = []
        for s in range(schritte):
            art = R.randint(0, 5)
            if art == 0:
                k = R.randint(3, 19); v += k; zeilen.append(f"Addiere {k}.")
            elif art == 1:
                k = R.randint(3, 19); v -= k; zeilen.append(f"Subtrahiere {k}.")
            elif art == 2:
                v *= 2; zeilen.append("Verdopple den Wert.")
            elif art == 3:
                if v % 2 == 0:
                    v //= 2; zeilen.append("Wenn der Wert gerade ist, halbiere ihn; sonst addiere 5.")
                else:
                    v += 5; zeilen.append("Wenn der Wert gerade ist, halbiere ihn; sonst addiere 5.")
            elif art == 4:
                w = R.choice(WOERTER); v += len(w)
                zeilen.append(f"Addiere die Anzahl der Buchstaben des Wortes '{w}'.")
            else:
                qs = sum(int(c) for c in str(abs(v))); v += qs
                zeilen.append("Addiere die Quersumme des aktuellen Wertes.")
        schritt_text = "\n".join(f"{j+1}. {z}" for j, z in enumerate(zeilen))
        tasks.append(dict(
            id=f"kette_{i}", typ=f"schritte{schritte}",
            frage=(f"Beginne mit dem Wert {start}. Fuehre die folgenden Schritte "
                   f"der Reihe nach aus:\n{schritt_text}\n\nWelchen Wert hat der Zaehler am Ende?"),
            antwort=str(v)))
    return tasks


# ------------------------------------------------------------------ PLAN
def gen_plan(n=50, k=5):
    """Zuordnungsraetsel mit eindeutiger Loesung (per Brute Force verifiziert)."""
    tasks = []
    personen = ["Ada","Linus","Grace","Alan","Barbara","Ken","Edsger"][:k]
    versuche = 0
    while len(tasks) < n and versuche < n * 200:
        versuche += 1
        pos = list(range(1, k + 1))
        R.shuffle(pos)
        loesung = dict(zip(personen, pos))
        cands = []
        for p in personen:
            others = [q for q in personen if q != p]
            q = R.choice(others)
            d = loesung[p] - loesung[q]
            if d > 0:
                cands.append((f"{p} steht genau {d} Plaetze hinter {q}.",
                              lambda a, p=p, q=q, d=d: a[p] - a[q] == d))
            else:
                cands.append((f"{p} steht genau {-d} Plaetze vor {q}.",
                              lambda a, p=p, q=q, d=d: a[p] - a[q] == d))
        for p in personen:
            if R.random() < 0.6:
                cands.append((f"{p} steht nicht auf Platz {R.choice([x for x in pos if x != loesung[p]])}.",
                              None))
        # nur die deterministisch pruefbaren Bedingungen verwenden
        cands = [c for c in cands if c[1] is not None]
        R.shuffle(cands)
        for anzahl in range(2, len(cands) + 1):
            teil = cands[:anzahl]
            loesungen = []
            for perm in itertools.permutations(pos):
                a = dict(zip(personen, perm))
                if all(f(a) for _, f in teil):
                    loesungen.append(a)
                    if len(loesungen) > 1:
                        break
            if len(loesungen) == 1:
                bed = "\n".join(f"- {t}" for t, _ in teil)
                reihe = " ".join(str(loesung[p]) for p in personen)
                tasks.append(dict(
                    id=f"plan_{len(tasks)}", typ=f"k{k}",
                    frage=(f"{k} Personen stehen auf den Plaetzen 1 bis {k} "
                           f"(Platz 1 ist vorne). Bekannt ist:\n{bed}\n\n"
                           f"Auf welchen Plaetzen stehen "
                           f"{', '.join(personen)}? Gib die {k} Platznummern in genau "
                           f"dieser Reihenfolge, durch Leerzeichen getrennt, in der "
                           f"letzten Zeile aus."),
                    antwort=reihe))
                break
    return tasks


# ------------------------------------------------------------------ ZAEHL
def gen_zaehl(n=50, laenge=28):
    """Bedingtes Zaehlen ueber eine laengere Liste -- erfordert genaues Durchgehen."""
    tasks = []
    for i in range(n):
        xs = [R.randint(1, 99) for _ in range(laenge)]
        art = i % 4
        if art == 0:
            soll = sum(1 for j in range(1, len(xs)) if xs[j] > xs[j-1] and xs[j] % 2 == 0)
            bed = "gerade ist UND groesser als die unmittelbar davorstehende Zahl"
            zusatz = " (die erste Zahl zaehlt nie mit)"
        elif art == 1:
            soll = sum(1 for j in range(len(xs)) if xs[j] % 3 == 0 and xs[j] > 40)
            bed = "durch 3 teilbar ist UND groesser als 40"; zusatz = ""
        elif art == 2:
            soll = sum(1 for j in range(1, len(xs)) if xs[j] < xs[j-1] and xs[j] % 5 == 0)
            bed = "durch 5 teilbar ist UND kleiner als die unmittelbar davorstehende Zahl"
            zusatz = " (die erste Zahl zaehlt nie mit)"
        else:
            soll = sum(1 for j in range(len(xs)) if sum(int(c) for c in str(xs[j])) > 9)
            bed = "eine Quersumme groesser als 9 hat"; zusatz = ""
        tasks.append(dict(
            id=f"zaehl_{i}", typ=f"art{art}",
            frage=(f"Liste: {', '.join(map(str, xs))}\n\n"
                   f"Wie viele Zahlen in dieser Liste erfuellen: {bed}{zusatz}?"),
            antwort=str(soll)))
    return tasks


if __name__ == "__main__":
    out = "/home/user/nextool/bewusstsein/suiten"
    for name, ts in [("kette", gen_kette()), ("plan", gen_plan()), ("zaehl", gen_zaehl())]:
        with open(os.path.join(out, f"{name}.json"), "w") as f:
            json.dump(ts, f, ensure_ascii=False, indent=1)
        print(f"{name}: {len(ts)}  Beispiel-Antwort: {ts[0]['antwort']}")
