#!/bin/sh
# Prüft alle Lean-Dateien der Forschungsakte gegen eine Mathlib-Installation.
# Aufruf: MATHLIB_DIR=/pfad/zu/mathlib4 ./check.sh
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
: "${MATHLIB_DIR:?MATHLIB_DIR auf ein gebautes mathlib4-Checkout setzen (lake exe cache get)}"
mkdir -p "$HERE/.build"
cd "$MATHLIB_DIR"
lake env sh -c "lean --root='$HERE' '$HERE/RHTarget.lean' -o '$HERE/.build/RHTarget.olean' && \
  LEAN_PATH=\"\$LEAN_PATH:$HERE/.build\" lean --root='$HERE' '$HERE/HurwitzReduction.lean'"
