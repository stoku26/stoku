#!/usr/bin/env bash
# Nënshkrimi përfundimtar i APK-së (thirret nga vendas-apk.yml me çelësat e tel/ dhe nga ora-apk.yml, pas Gradle-it).
# - Pa çelës të ri në repo: APK-ja mbetet ashtu siç e nënshkroi Gradle-i (çelësi i vjetër).
# - Me çelës të ri (krijuar një herë nga apk-celesat.yml): v2 me çelësin e vjetër (Android 8), v3 me çelësin e ri
#   + zinxhirin e ndërrimit (Android 9+). Kështu aplikacioni përditësohet pa u çinstaluar.
# Përdorimi:  P=<sekreti APK_FJALEKALIMI> bash .github/apk/nenshkruaj.sh tel|ora hyrja.apk dalja.apk
set -euo pipefail
a="$1"; IN="$2"; OUT="$3"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ENC="$ROOT/$a/celesi-i-ri.p12.enc"
LIN="$ROOT/$a/celesi.lineage"
if [ ! -f "$ENC" ]; then
  echo "Pa çelës të ri për '$a': APK-ja mbetet e nënshkruar me çelësin e vjetër."
  cp "$IN" "$OUT"
  exit 0
fi
if [ ! -f "$LIN" ]; then echo "::error::Mungon $a/celesi.lineage (zinxhiri i ndërrimit)."; exit 1; fi
if [ -z "${P:-}" ]; then
  echo "::error::Mungon sekreti APK_FJALEKALIMI (Settings → Secrets and variables → Actions)."
  exit 1
fi
AS="$(ls -d "$ANDROID_HOME"/build-tools/*/ | sort -V | tail -1)apksigner"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -in "$ENC" -out "$TMP/k.p12" -pass env:P
"$AS" sign --ks "$ROOT/$a/stoku-$a.jks" --ks-key-alias stoku --ks-pass "pass:stoku$a" --key-pass "pass:stoku$a" \
  --next-signer --ks "$TMP/k.p12" --ks-key-alias stoku --ks-pass env:P \
  --lineage "$LIN" --rotation-min-sdk-version 28 --out "$OUT" "$IN"
"$AS" verify -v --print-certs "$OUT"
# Kontrolli: Android 9+ duhet ta shohë çelësin e ri (jo të vjetrin)
RI="$(keytool -list -v -keystore "$TMP/k.p12" -storepass:env P -alias stoku | awk '/SHA256:/ {print $2; exit}' | tr -d ':' | tr 'A-F' 'a-f')"
"$AS" verify --print-certs --min-sdk-version 28 "$OUT" | tee "$TMP/v28.txt"
if ! grep -qi "$RI" "$TMP/v28.txt"; then
  echo "::error::APK-ja s'është e nënshkruar me çelësin e ri për Android 9+."
  exit 1
fi
echo "OK: v3 me çelësin e ri ($RI) dhe zinxhirin e ndërrimit."
