#!/usr/bin/env python3
"""Kontrollen der Epstein-Formel und rigorose Zählung der Nullstellen rechts der Geraden (Aufruf: epstein_probe.py T)."""
import certify as C
from flint import acb, arb
from epstein import epstein
C.set_prec(128)
# Kontrolle 1: direkte Gittersumme bei s=3 (absolut konvergent)
import math
def lattice(s,R=400):
    tot=0.0
    for m in range(-R,R+1):
        for n in range(-R,R+1):
            if m==0 and n==0: continue
            tot+= (m*m+5*n*n)**(-s)
    return tot
print('Epstein(3) Formel:', epstein(acb(3)).real.str(15), ' Gitter (R=400, Abbruchfehler ~1e-5):', lattice(3.0))
# Kontrolle 2: Funktionalgleichung Lambda(s)=(sqrt(20)/(2pi))^s Gamma(s) Z(s) = Lambda(1-s)
def Lam(s): return (acb(20).sqrt()/(2*acb.pi()))**s * s.gamma() * epstein(s)
for z in [complex(0.3,7.0), complex(0.8,40.0)]:
    s=C.pt(z); print('FE-Residuum', z, (Lam(s)-Lam(acb(1)-s)).abs_upper().str(5), '|Lam|', Lam(s).abs_upper().str(5))

import time, sys
t0=time.time()
st={}
T=float(sys.argv[1]) if len(sys.argv)>1 else 100.0
w=C.winding_number(epstein, 0.51, 3.0, 1.0, T, pieces=64, stats=st)
print('Nullstellen in [0.51,3]x[1,%g]:'%T, w, st, round(time.time()-t0,1),'s')
