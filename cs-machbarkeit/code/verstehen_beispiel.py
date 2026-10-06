# -*- coding: utf-8 -*-
"""
Was macht dein Programm eigentlich? Ein Beispiel zum Anfassen.

Stell dir vor, ein Labor hat fuenf Antibiotika-Paare untersucht. Fuer jedes Paar
wurde das Experiment mehrmals wiederholt. Jede Wiederholung sagt entweder
"ja, Kollateralsensitivitaet trat auf" oder "nein".

Diese Zahlen sind HIER erfunden, aber in der Groessenordnung realistisch. Es geht
nur darum, dass du siehst, was die Rechnung tut.
"""
import sys
sys.path.insert(0, "/home/user/nextool/cs-machbarkeit/code")
import cs_modell as m
import numpy as np

# Paarname, wie oft "ja" herauskam, wie oft insgesamt getestet
paare = [
    ("Gentamicin -> Ampicillin",      3, 3),   # immer ja
    ("Ciprofloxacin -> Aztreonam",    4, 5),   # fast immer ja
    ("Tetracyclin -> Colistin",       2, 4),   # haelftig
    ("Erythromycin -> Meropenem",     1, 6),   # selten
    ("Rifampicin -> Tobramycin",      0, 3),   # nie beobachtet
]
namen = [p[0] for p in paare]
k = np.array([p[1] for p in paare], float)   # Anzahl "ja"
n = np.array([p[2] for p in paare], float)   # Anzahl Versuche

# Das Modell lernt aus ALLEN Paaren gemeinsam, wie stark es einzelne Werte
# zur Mitte ziehen muss. Deshalb braucht es in echt viele Paare; hier nur zur Schau.
mod = m.BetaBinomialHierarchisch().fit(k, n)
p_naiv = k / n                               # einfaches Abzaehlen
p_modell = mod.predict_proba(k, n)           # dein Verfahren
lo, hi = mod.predict_intervall(k, n, breite=0.90)

print("="*78)
print("WAS DIE ZWEI METHODEN AUS DENSELBEN DATEN MACHEN")
print("="*78)
print(f"{'Antibiotika-Paar':<30}{'Versuche':>10}{'Einfach':>10}{'Dein Modell':>14}{'Unsicherheit':>16}")
print("-"*78)
for i, name in enumerate(namen):
    print(f"{name:<30}{int(k[i])}/{int(n[i]):<8}{p_naiv[i]*100:>8.0f}%{p_modell[i]*100:>12.0f}%"
          f"     {lo[i]*100:>3.0f}% bis {hi[i]*100:>3.0f}%")
print("-"*78)

print("""
SO LIEST DU DAS:

 'Einfach' ist blosses Abzaehlen. Beim letzten Paar sagt es '0 %' -- also:
 Kollateralsensitivitaet tritt NIE auf. Aber das Experiment wurde nur dreimal
 gemacht. Drei Versuche koennen unmoeglich '0 %' beweisen. Das ist falsche
 Sicherheit. Genauso beim ersten Paar: 3 von 3 heisst nicht '100 % sicher'.

 'Dein Modell' zieht diese uebertriebenen Werte vorsichtig zur Mitte, und zwar
 umso staerker, je weniger Versuche es gab. Aus '0 %' wird eine kleine, aber
 von null verschiedene Wahrscheinlichkeit. Aus '100 %' wird 'sehr wahrscheinlich,
 aber nicht sicher'.

 'Unsicherheit' ist der ehrliche Teil: eine Spanne statt einer einzelnen Zahl.
 Beim Paar in der Mitte reicht sie fast von 0 bis 100 % -- das Modell sagt dir
 damit offen: 'aus so wenig Daten weiss ich es schlicht nicht'.
""")

print("="*78)
print("WARUM DAS DER EIGENTLICHE PUNKT IST")
print("="*78)
print("""
 Das Wertvolle ist nicht, moeglichst oft richtig zu raten. Das Wertvolle ist,
 zu WISSEN, wann man sich sicher sein darf und wann nicht.

 Ein Arzt kann mit 'bei diesem Paar bin ich zu 85 % sicher, bei jenem ist es
 Muenzwurf' etwas anfangen. Mit einer nackten Zahl ohne Unsicherheit nicht.

 Genau diese Frage -- 'wie viele Versuche braucht man, damit die Wahrscheinlichkeit
 ehrlich ist?' -- hat in der Fachwelt bisher niemand sauber beantwortet.
 Das ist der freie Platz, auf den du zielst.
""")
