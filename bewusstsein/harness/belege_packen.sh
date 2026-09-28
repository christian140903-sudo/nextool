#!/bin/bash
# Packt alle Rohartefakte als Beleg-Archive (JSON komprimiert ~18:1).
cd /home/user/nextool
# Fehlversuche (Aufrufe, die am Sitzungslimit abgebrochen sind) wandern mit ins
# Archiv: sie sind der Beleg dafuer, dass nichts still aus der Auswertung faellt.
for d in bewusstsein/ergebnisse/*/; do
  n=$(basename "$d")
  [ -d "$d/raw" ] || continue
  teile="$n/raw"
  [ -d "$d/fehlversuche" ] && teile="$teile $n/fehlversuche"
  tar czf "bewusstsein/belege/${n}.tgz" -C bewusstsein/ergebnisse $teile
  fv=0
  [ -d "$d/fehlversuche" ] && fv=$(ls "$d/fehlversuche" | wc -l)
  echo "$(ls "$d/raw" | wc -l) Artefakte + $fv Fehlversuche -> bewusstsein/belege/${n}.tgz ($(du -h "bewusstsein/belege/${n}.tgz" | cut -f1))"
done
