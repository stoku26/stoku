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
# Play Console ("you've not uploaded debug symbols"): libraritë native vijnë të zhveshura nga Maven (MapLibre, ML Kit, CameraX), prandaj
# AGP (debugSymbolLevel) s'nxjerr asgjë. Tabelat e simboleve që kanë (.dynsym) futen si skedarë simbolesh te BUNDLE-METADATA (Play i
# përdor vetëm për raportet e rrëzimeve; s'shkojnë në telefon).
python3 - "$TMP/a.aab" <<'PY'
import sys, zipfile
p = sys.argv[1]; z = zipfile.ZipFile(p)
emrat = set(z.namelist()); shto = []
for n in emrat:
    if n.startswith('base/lib/') and n.endswith('.so'):
        abi, emri = n.split('/')[2], n.split('/')[3]
        d = 'BUNDLE-METADATA/com.android.tools.build.debugsymbols/' + abi + '/' + emri + '.sym'
        if d not in emrat: shto.append((d, z.read(n)))
z.close()
if shto:
    with zipfile.ZipFile(p, 'a', zipfile.ZIP_DEFLATED) as w:
        for d, b in shto: w.writestr(d, b)
print('simbolet native:', len(shto), 'skedarë')
PY
jarsigner -sigalg SHA256withRSA -digestalg SHA-256 -keystore "$TMP/k.p12" -storetype PKCS12 -storepass:env P "$TMP/a.aab" stoku > /dev/null
jarsigner -verify -certs "$TMP/a.aab" | tail -3
RI="$(keytool -list -v -keystore "$TMP/k.p12" -storepass:env P -alias stoku | awk '/SHA256:/ {print $2; exit}')"
NE="$(keytool -printcert -jarfile "$TMP/a.aab" | awk '/SHA256:/ {print $2; exit}')"
N="$(keytool -printcert -jarfile "$TMP/a.aab" | grep -c 'SHA256:')"
if [ "$RI" != "$NE" ] || [ "$N" != "1" ]; then echo "::error::AAB-ja s'është e nënshkruar vetëm me çelësin e ngarkimit."; exit 1; fi
# Rregullat e Play: versioni "play" s'ka lejen e instalimit të aplikacioneve (s'përditësohet vetë jashtë Play-it)
# (pa "| grep -q" mbi unzip: me pipefail, grep -q e mbyll tubin herët dhe rezultati del gabim edhe kur e gjen vargun)
unzip -p "$TMP/a.aab" base/manifest/AndroidManifest.xml > "$TMP/manifest.bin"
unzip -p "$TMP/a.aab" 'base/dex/*.dex' > "$TMP/dex.bin"
unzip -l "$TMP/a.aab" > "$TMP/lista.txt"
if grep -aq REQUEST_INSTALL_PACKAGES "$TMP/manifest.bin"; then
  echo "::error::AAB-ja për Play ka lejen REQUEST_INSTALL_PACKAGES."; exit 1
fi
# Pronari (24.11.2026): paketa e versionit play është app.stoku.android
if ! grep -aq 'app.stoku.android' "$TMP/manifest.bin"; then
  echo "::error::AAB-ja për Play s'e ka paketën app.stoku.android."; exit 1
fi
# Rregullat e Play (pajisja dhe rrjeti): versioni "play" s'ka kod që shkarkon ose instalon APK jashtë Play-it, as adresën e Releases
# (vetë-përditësimi është vetëm te github/Perditesimi.kt)
for x in 'api.github.com/repos/stoku26' 'application/vnd.android.package-archive' 'MANAGE_UNKNOWN_APP_SOURCES'; do
  if grep -aq "$x" "$TMP/dex.bin"; then echo "::error::AAB-ja për Play ka kod të vetë-përditësimit: $x"; exit 1; fi
done
# Google Play: libraritë native 64-bit duhet të kenë segmente të rreshtuara në 16 KB (Android 15+, "16 KB page size");
# përndryshe Play Console e refuzon ngarkimin. 32-bit (armeabi-v7a) s'kontrollohen (Play s'i kërkon).
python3 - "$TMP/a.aab" <<'PY'
import struct, sys, zipfile
z = zipfile.ZipFile(sys.argv[1]); keq = []
for i in z.infolist():
    if not (i.filename.endswith('.so') and ('/arm64-v8a/' in i.filename or '/x86_64/' in i.filename)): continue
    b = z.read(i.filename)
    if b[:4] != b'\x7fELF' or b[4] != 2: continue
    phoff = struct.unpack_from('<Q', b, 0x20)[0]; phentsize, phnum = struct.unpack_from('<HH', b, 0x36)
    al = [struct.unpack_from('<Q', b, phoff + k * phentsize + 48)[0] for k in range(phnum) if struct.unpack_from('<I', b, phoff + k * phentsize)[0] == 1]
    print(('OK ' if al and min(al) >= 16384 else 'KEQ ') + str(min(al) if al else 0) + ' ' + i.filename)
    if not al or min(al) < 16384: keq.append(i.filename)
if keq: print('::error::Libraritë pa faqe 16 KB (Google Play s\'e pranon): ' + ', '.join(keq)); sys.exit(1)
PY
# R8 (versioni play): ML Kit-i s'duhet riemërtuar (rrëzimi i kamerës te 0.1.347, NullPointerException te BarcodeScanning.getClient)
unzip -p "$TMP/a.aab" 'BUNDLE-METADATA/com.android.tools.build.obfuscation/proguard.map' > "$TMP/map.txt" || true
if awk '/^com\.google\.mlkit[^ ]* -> /{ if ($1 != substr($3, 1, length($3) - 1)) { print "riemërtuar: " $0; k = 1 } } END { exit !k }' "$TMP/map.txt"; then
  echo "::error::R8 e ka riemërtuar ML Kit-in (kamera mbyllet). Shih vendas/app/proguard-play.pro."; exit 1
fi
# Play Console: simbolet e kodit native (pa to del paralajmërimi "you've not uploaded debug symbols")
grep 'debugsymbols' "$TMP/lista.txt" || true
# (vetëm kur AAB-ja ka kod native: ora mund të mos ketë fare)
if grep -q 'base/lib/.*\.so$' "$TMP/lista.txt" && ! grep -q 'BUNDLE-METADATA/com.android.tools.build.debugsymbols/' "$TMP/lista.txt"; then
  echo "::error::AAB-ja s'i ka simbolet e kodit native (debugSymbolLevel)."; exit 1
fi
cp "$TMP/a.aab" "$OUT"
echo "OK: AAB e nënshkruar me çelësin e ngarkimit. Gjurma (për Play Console, 'Upload key'):"
keytool -list -v -keystore "$TMP/k.p12" -storepass:env P -alias stoku | grep -E "SHA1:|SHA256:"
