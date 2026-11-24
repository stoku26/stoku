#!/usr/bin/env bash
# Nënshkrimi i AAB-së për Google Play (versioni "play" i vendas/). Play Store e rinënshkruan vetë me çelësin e vet (Play App Signing);
# ky është vetëm "çelësi i ngarkimit" (upload key): i njëjti çelës i ri i tel/ (tel/celesi-i-ri.p12.enc, i enkriptuar me sekretin
# APK_FJALEKALIMI), jo çelësi i vjetër publik me të cilin e nënshkruan Gradle-i. S'krijohet asnjë sekret i ri.
# Përdorimi:  P=<sekreti APK_FJALEKALIMI> bash .github/apk/aab.sh hyrja.aab dalja.aab
set -euo pipefail
IN="$1"; OUT="$2"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ENC="$ROOT/tel/celesi-i-ri.p12.enc"
if [ -z "${P:-}" ]; then echo "::error::Mungon sekreti APK_FJALEKALIMI."; exit 1; fi
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -in "$ENC" -out "$TMP/k.p12" -pass env:P
cp "$IN" "$TMP/a.aab"
# Hiq nënshkrimin e Gradle-it (çelësi i vjetër publik): Play pranon vetëm një nënshkrues
zip -q -d "$TMP/a.aab" 'META-INF/*.SF' 'META-INF/*.RSA' 'META-INF/*.DSA' 'META-INF/*.EC' 'META-INF/MANIFEST.MF' || true
jarsigner -sigalg SHA256withRSA -digestalg SHA-256 -keystore "$TMP/k.p12" -storetype PKCS12 -storepass:env P "$TMP/a.aab" stoku > /dev/null
jarsigner -verify -certs "$TMP/a.aab" | tail -3
RI="$(keytool -list -v -keystore "$TMP/k.p12" -storepass:env P -alias stoku | awk '/SHA256:/ {print $2; exit}')"
NE="$(keytool -printcert -jarfile "$TMP/a.aab" | awk '/SHA256:/ {print $2; exit}')"
N="$(keytool -printcert -jarfile "$TMP/a.aab" | grep -c 'SHA256:')"
if [ "$RI" != "$NE" ] || [ "$N" != "1" ]; then echo "::error::AAB-ja s'është e nënshkruar vetëm me çelësin e ngarkimit."; exit 1; fi
# Rregullat e Play: versioni "play" s'ka lejen e instalimit të aplikacioneve (s'përditësohet vetë jashtë Play-it)
if unzip -p "$TMP/a.aab" base/manifest/AndroidManifest.xml | grep -aq REQUEST_INSTALL_PACKAGES; then
  echo "::error::AAB-ja për Play ka lejen REQUEST_INSTALL_PACKAGES."; exit 1
fi
# Pronari (24.11.2026): paketa e versionit play është com.stoku.app
if ! unzip -p "$TMP/a.aab" base/manifest/AndroidManifest.xml | grep -aq 'com.stoku.app'; then
  echo "::error::AAB-ja për Play s'e ka paketën com.stoku.app."; exit 1
fi
cp "$TMP/a.aab" "$OUT"
echo "OK: AAB e nënshkruar me çelësin e ngarkimit. Gjurma (për Play Console, 'Upload key'):"
keytool -list -v -keystore "$TMP/k.p12" -storepass:env P -alias stoku | grep -E "SHA1:|SHA256:"
