#!/bin/sh
run() { python3 c5_coercivity.py $1 $2 $3 10 > ../results/weil_c5b_L$1.json 2> ../results/weil_c5b_L$1.log; }
( run 0.8 50 50; run 1.0 40 70 ) &
( run 0.9 34 60; run 1.1 46 85 ) &
wait
