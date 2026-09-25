#!/usr/bin/env python3
"""Rigorose Lokalisierung aller Nullstellen der Epstein-ζ (x²+5y²) in [0.51,3]×[1,100]."""
import json, sys, time
import certify as C
from localize import localize
from epstein import epstein
C.set_prec(128)
t=time.time()
boxes = localize(epstein, 0.51, 3.0, 1.0, 100.0, min_size=2e-3)
res={"function":"Epstein zeta Z(s)=sum' (m^2+5n^2)^(-s) = zeta(s)L(s,chi_-20)+L(s,chi_-4)L(s,chi_5)",
     "region":[[0.51,3.0],[1.0,100.0]],"total_winding":sum(b["winding"] for b in boxes),
     "boxes":boxes,"all_boxes_right_of_line":all(b["sigma"][0]>0.5 for b in boxes),"seconds":round(time.time()-t,1)}
json.dump(res, sys.stdout, indent=1)
