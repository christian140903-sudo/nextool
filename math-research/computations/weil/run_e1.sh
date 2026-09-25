#!/bin/sh
run() { python3 -u e1_epstein_window.py $1 $2 $3 > ../results/weil_e1_epstein_L$1.json 2> ../results/weil_e1_epstein_L$1.log; }
( run 0.5 20 40; run 0.8 30 50 ) &
( run 0.6 24 40; run 1.0 40 70 ) &
( run 0.7 26 45; run 0.9 34 60 ) &
wait
