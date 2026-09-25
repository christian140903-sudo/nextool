#!/bin/sh
run() { python3 -u e1_epstein_window.py $1 $2 $3 > ../results/weil_e1_epstein_L$1.json 2> ../results/weil_e1_epstein_L$1.log; }
( run 1.25 50 45; run 2.0 70 50 ) &
( run 1.5 56 45; run 2.5 86 60 ) &
wait
