#!/usr/bin/env bash
# Krijon NJË HERË çelësat e rinj të nënshkrimit të APK-ve (tel dhe ora) dhe "zinxhirin e ndërrimit" (APK Signature
# Scheme v3) nga çelësi i vjetër te i riu. Çelësi i vjetër (tel/stoku-tel.jks, ora/stoku-ora.jks) është publik në repo,
# prandaj i komprometuar: pas përditësimit me çelësin e ri, Android 9+ s'pranon më APK të nënshkruara vetëm me të
# vjetrin (zinxhiri pa "rollback"). Çelësi i ri ruhet në repo vetëm i enkriptuar (AES-256, PBKDF2) me sekretin
# APK_FJALEKALIMI, dhe nuk del kurrë jashtë GitHub Actions i pa enkriptuar.
# Thirret nga .github/workflows/apk-celesat.yml:  P=<sekreti> bash .github/apk/celesat.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
export P="${P:-}"
if [ "${#P}" -lt 24 ]; then
  echo "::error::Sekreti APK_FJALEKALIMI mungon ose ka më pak se 24 shenja (Settings → Secrets and variables → Actions)."
  exit 1
fi
for a in tel ora; do
  if [ -e "$ROOT/$a/celesi-i-ri.p12.enc" ] || [ -e "$ROOT/$a/celesi.lineage" ]; then
    echo "::error::Çelësi i ri i '$a' ekziston tashmë. S'krijohet sërish: do t'i prishte përditësimet e aplikacionit."
    exit 1
  fi
done
AS="$(ls -d "$ANDROID_HOME"/build-tools/*/ | sort -V | tail -1)apksigner"
echo "apksigner $("$AS" version)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
for a in tel ora; do
  K="$TMP/$a.p12"
  keytool -genkeypair -keystore "$K" -storetype PKCS12 -alias stoku -keyalg RSA -keysize 4096 -sigalg SHA256withRSA \
    -validity 36500 -dname "CN=Stoku $a, O=Stoku, C=XK" -storepass:env P
  # Zinxhiri: çelësi i vjetër e autorizon të riun; pa "rollback" (APK me çelësin e vjetër s'instalohet më sipër)
  "$AS" rotate --out "$ROOT/$a/celesi.lineage" \
    --old-signer --ks "$ROOT/$a/stoku-$a.jks" --ks-key-alias stoku --ks-pass "pass:stoku$a" --key-pass "pass:stoku$a" \
    --set-rollback false \
    --new-signer --ks "$K" --ks-key-alias stoku --ks-pass env:P
  "$AS" lineage --in "$ROOT/$a/celesi.lineage" --print-certs -v
  openssl enc -aes-256-cbc -pbkdf2 -iter 600000 -salt -in "$K" -out "$ROOT/$a/celesi-i-ri.p12.enc" -pass env:P
  openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -in "$ROOT/$a/celesi-i-ri.p12.enc" -out "$TMP/kontroll.p12" -pass env:P
  cmp "$K" "$TMP/kontroll.p12"
  echo "== Gjurmët e çelësit të ri të '$a' (publike: duhen vetëm nëse çelësi i API-së në Google Cloud kufizohet me SHA-1):"
  keytool -list -v -keystore "$K" -storepass:env P -alias stoku | grep -E "SHA1:|SHA256:"
done
