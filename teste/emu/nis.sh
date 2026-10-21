#!/usr/bin/env bash
# Emulatorët e vërtetë të Firebase për testet e teste/emu/ (s'janë pjesë e regresionit; përdori kur ndryshon logjika që
# varet nga sjellja e Firestore-it të vërtetë: kopjet e pajisjes, metadata, rregullat). Kërkon Java dhe internet herën e parë.
#   bash teste/emu/nis.sh            → instalon (npm ci), ndërton SDK-në (12.19.0), nis Auth 9099 + Firestore 8089
#   node teste/emu/grupi-v243.mjs    → testet në node (ekipa.js + SDK + rregullat nga SHENIME)
#   node teste/emu/grupi-e2e-v243.js → faqet e vërteta (tel + PC) në Chromium; kërkon teste/server-cloudflare.py në 8765
#   bash teste/emu/nis.sh ndal       → i ndal emulatorët
set -e
cd "$(dirname "$0")"
if [ "$1" = "ndal" ]; then
  [ -f .emu.pid ] && kill "$(cat .emu.pid)" 2>/dev/null || true
  rm -f .emu.pid; echo "U ndalën."; exit 0
fi
[ -d node_modules/firebase ] || npm ci --no-audit --no-fund
[ -f fb-krejt.bundle.js ] || node_modules/.bin/esbuild fb-krejt.js --bundle --format=esm --minify --outfile=fb-krejt.bundle.js --log-level=warning
if curl -s -o /dev/null http://127.0.0.1:8089/ && curl -s -o /dev/null http://127.0.0.1:9099/; then echo "Emulatorët punojnë tashmë."; exit 0; fi
setsid nohup node_modules/.bin/firebase emulators:start --only auth,firestore --project demo-stoku > emu.log 2>&1 &
echo $! > .emu.pid
for i in $(seq 1 90); do
  if curl -s -o /dev/null http://127.0.0.1:8089/ && curl -s -o /dev/null http://127.0.0.1:9099/; then echo "Gati: Auth 9099, Firestore 8089."; exit 0; fi
  sleep 1
done
echo "Emulatorët s'u nisën (shih teste/emu/emu.log)."; exit 1
