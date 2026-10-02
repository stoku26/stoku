# Stoku për sahat (Galaxy Watch / Wear OS)

Aplikacion i vogël që tregon produktet që skadojnë sot, me:
- **Tile** (rrëshqit ekranin e orës): numri i produkteve që skadojnë sot.
- **Komplikacion** (numri në fytyrën e orës).
- **Listë**: prek një produkt për ta shënuar "u hoq nga rafti" (me "Zhbëj"); heqja zbatohet te telefoni/PC sapo hapet Stoku.

Të dhënat vijnë nga Worker-i `stoku-push` (rrugët `/ora/*`, nga versioni 157).

## Ndërtimi
GitHub Actions (`.github/workflows/ora-apk.yml`) e ndërton APK-në në çdo ndryshim te `ora/`.
Në `main` del edhe si **Release** (`ora-vNN`).

## Instalimi në sahat
1. Sahati: **Settings → About watch → Software → Software version**: shtyp 5 herë → Developer options.
2. **Settings → Developer options**: ndiz **ADB debugging** dhe **Wireless debugging** (sahati dhe telefoni në të njëjtin Wi-Fi).
3. Te Wireless debugging: **Pair new device**: del IP:porta dhe kodi.
4. Në telefon instalo **Bugjaeger** (Play Store) ose përdor `adb` në kompjuter:
   ```
   adb pair IP:PORTA KODI
   adb connect IP:PORTA
   adb install -r stoku-ora-NN.apk
   ```
5. Hape **Stoku** në sahat: del kodi 6-shifror → në telefon: Stoku → Cilësimet → Njoftimet → Galaxy Watch → **Lidh sahatin**.
6. Tile: rrëshqit djathtas në sahat → **+ Shto tile** → Stoku. Komplikacioni: mbaj gishtin te fytyra e orës → Customize → zgjidh **Stoku: skadojnë sot**.
