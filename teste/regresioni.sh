#!/bin/bash
# Regresioni i plotë i Stoku-t (rreth 30 minuta). Nga rrënja e repo-s:
#   bash teste/regresioni.sh > teste/regresioni-vNNN.txt
# Herën e parë në një kontejner të ri: (cd teste/npm && npm ci) && (cd teste/wp && npm ci)
# Krahasimi me një regresion të mëparshëm: diff <(grep -E "exit=|gabim=" vjeter.txt) <(grep -E "exit=|gabim=" i-ri.txt)
# Kujdes: "gabim=N" numëron edhe rreshtat "pa gabime"; numri i vërtetë: grep -c '^GABIM' teste/r5-EMRI.txt
# Mos i ndrysho skedarët e repo-s ndërsa punon (testet i lexojnë drejtpërdrejt).
cd "$(dirname "$0")"
RR="$(cd .. && pwd)"
export STOKU_DIR="$RR"
for t in furn-test.js ikonat-test.js foto-test.js kerkese-test.js orari-test.js push-test.js fuzz-te-dhena.js dil-test.js pllakat-test.js tur-errët.js ora-test.js pc-afatet-orari.js tre-test.js grupet-test.js miratimi-test.js njoftim-push-test.js kujtesa-njesi.js kujtesa-test.js kujtesa-grupi-test.js palos-pc.js nenfaqe-tel.js meshume-test.js dil-pc.js furn-grupi-test.js harro-sync-test.js furn-ruaj-test.js lx-folder-test.js import-pritje-test.js fleta-numri-test.js fleta-pritje-test.js furn-sugjerim-test.js stok-furn-test.js furn-pritje-test.js v215-njesi.js v215-test.js ftesa-test.js v216-njesi.js v216-test.js vizitor-test.js rivendos-test.js pda-tastiera-test.js v226-manifest-test.js skedaret-njesi.js skedaret-e2e-v229.js lejet-e2e-v231.js lejet-pc-e2e-v231.js lejet-push-v231.js dy-skeda-llogari.js dy-skeda-llogari-pc.js kopja-v232.js folderat-v233-njesi.js folderat-v233.js siguria-v234.js librarite-v235.js privatesia-v237.js kontrolli-v238-njesi.js csp-v238.js logo-v238.js pda-tastiera-v238.js siguria-v239.js plusminus-v240.js marketet-v241.js grupi-kerkesa-v242.js regjistri-v242.js marketi-ri-v242.js grupi-tregues-v243.js harta-v244.js pikat-v246.js grupi-dalja-v246.js harta-v247.js v248.js v250.js v251.js v252.js v253.js v254.js v255.js v256.js v257.js v258.js v260.js v261.js v262.js v263.js v264.js v265.js v266.js v267.js; do
  curl -s -o /dev/null http://localhost:8766/tel.html || (setsid nohup python3 -m http.server 8766 --directory "$PWD/keq" > /dev/null 2>&1 &)
  curl -s -o /dev/null http://127.0.0.1:8765/ || (setsid nohup python3 "$PWD/server-cloudflare.py" 8765 "$RR" > /dev/null 2>&1 &)
  sleep 0.5
  timeout 420 node $t > r5-$t.txt 2>&1; echo "$t exit=$? ok=$(grep -cE '^OK|^✓|^  ✓' r5-$t.txt) gabim=$(grep -ciE 'GABIM|pageerror|✗|FAIL' r5-$t.txt)"
done
for t in wp/prova.mjs wp/foto-prova.mjs wp/kerkese-prova.mjs wp/orari-prova.mjs wp/ora-prova.mjs wp/grupi-prova.mjs wp/fcm-prova.mjs wp/njoftim-prova.mjs wp/v216-prova.mjs wp/fjalekalimi-prova.mjs wp/ora-krejt-prova.mjs wp/marketet-prova.mjs; do (cd wp && cp "$RR/worker/stoku-push.js" worker.mjs && node $(basename $t) > ../r5-$(basename $t).txt 2>&1); echo "$t gabim=$(grep -c GABIM r5-$(basename $t).txt)"; done
echo FUND
