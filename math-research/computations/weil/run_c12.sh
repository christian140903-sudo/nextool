#!/bin/sh
run() { python3 -u c12_certify_finite.py $1 $2 $3 $4 > ../results/weil_c12_L$1-$2_N$3.json 2> ../results/weil_c12_L$1-$2_N$3.log; }
( run 4 5 30 240; run 4 5 50 300 ) &
( run 1 1 40 300; run 11 10 46 400 ) &
( run 5 4 56 560 ) &
wait
