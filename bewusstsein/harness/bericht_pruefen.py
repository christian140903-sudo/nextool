"""Prueft, ob die Zahlen im Bericht noch zu ENDZAHLEN.json passen.

Anlass: Zwei Tabellenzeilen des Berichts stammten aus Zwischenstaenden noch
laufender Laeufe und waren nach deren Ende falsch. Dieser Test findet genau das:
Fuer jeden Arm jedes Blocks wird geprueft, ob seine Genauigkeit (deutsche
Schreibweise, eine Nachkommastelle) irgendwo im Berichtstext vorkommt.

Kein Beweis der Korrektheit -- ein Arm kann im Bericht bewusst fehlen, und eine
Zahl kann zufaellig an anderer Stelle stehen. Aber jede stille Veraltung faellt auf.
"""
import json, sys, os, re

WURZEL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ZAHLEN = os.path.join(WURZEL, "ergebnisse", "ENDZAHLEN.json")
BERICHTE = [os.path.join(WURZEL, "berichte", "01-BEFUNDE.md"),
            os.path.join(WURZEL, "berichte", "03-RUNDE4-BAU.md")]

# Bloecke, deren Arme im Bericht als Tabelle stehen -> dort wird geprueft.
# Bloecke ohne Eintrag sind Hilfsrechnungen und werden nicht erwartet.
ERWARTET = {
    "sofort_kette20", "stoerung", "sonnet_kette20", "denken_kette60",
    "arch_kette20", "arch_stoerung",
    "m1_arch_kette20", "m2_zerlegung", "m3_hauptbuch",
}


def de(x):
    return f"{x*100:.1f}".replace(".", ",")


def main():
    R = json.load(open(ZAHLEN, encoding="utf-8"))
    text = "\n".join(open(b, encoding="utf-8").read() for b in BERICHTE if os.path.exists(b))
    fehlend = []
    geprueft = 0
    for block, inhalt in R.items():
        if block not in ERWARTET or "arme" not in inhalt:
            continue
        for arm, e in inhalt["arme"].items():
            if "genauigkeit" not in e:
                continue
            geprueft += 1
            if de(e["genauigkeit"]) not in text:
                fehlend.append((block, arm, de(e["genauigkeit"]), e["n"]))
    print(f"{geprueft} Armzahlen aus ENDZAHLEN.json gegen den Bericht geprueft.")
    if not fehlend:
        print("Alle im Bericht wiedergefunden.")
        return 0
    print(f"\n{len(fehlend)} Zahlen stehen NICHT im Bericht "
          f"(entweder dort veraltet oder bewusst weggelassen):")
    for b, a, w, n in fehlend:
        print(f"  {b:16s} {a:18s} {w} %  (n={n})")
    return 1


if __name__ == "__main__":
    sys.exit(main())
