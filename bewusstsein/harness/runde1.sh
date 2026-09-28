#!/bin/bash
# Runde 1: Regime "sofort" (denken=0). Primaertest der Bewusstseinsstruktur.
cd /home/user/nextool
ARME="N,M,P,F,V1_FAKTOREN,V2_WORKSPACE,V3_SELBST,V4_VORHERSAGE,V5_MONITOR,SC3"
for S in kette20 plan stoerung; do
  echo "########## $S ##########"
  python3 bewusstsein/harness/experiment.py --suiten $S --arme "$ARME" \
    --runs 3 --limit 30 --workers 8 --modus direkt --denken 0 \
    --out bewusstsein/ergebnisse/runde1_sofort 2>&1
done
echo "RUNDE1 FERTIG"
