#!/bin/sh
# L N dps
run() { python3 c2_chain.py $1 $2 $3 > ../results/weil_c2_L$1.json 2> ../results/weil_c2_L$1.log; }
( run 0.6 24 40; run 0.9 34 60; run 1.1 46 85 ) &
( run 0.7 26 45; run 1.0 40 70; run 1.2824746787307683693 60 120 ) &
wait
