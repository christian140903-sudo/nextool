#!/bin/sh
run() { python3 c4_structure.py $1 $2 $3 10 > ../results/weil_c4_L$1.json 2> ../results/weil_c4_L$1.log; }
( run 0.6 24 40; run 0.9 34 60 ) &
( run 0.7 26 45; run 1.0 40 70 ) &
( run 1.1 46 85 ) &
wait
