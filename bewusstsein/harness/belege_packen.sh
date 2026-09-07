#!/bin/bash
# Packt alle Rohartefakte als Beleg-Archive (JSON komprimiert ~18:1).
cd /home/user/nextool
for d in bewusstsein/ergebnisse/*/; do
  n=$(basename "$d")
  [ -d "$d/raw" ] || continue
  tar czf "bewusstsein/belege/${n}.tgz" -C bewusstsein/ergebnisse "$n/raw"
  echo "$(ls "$d/raw" | wc -l) Artefakte -> bewusstsein/belege/${n}.tgz ($(du -h "bewusstsein/belege/${n}.tgz" | cut -f1))"
done
