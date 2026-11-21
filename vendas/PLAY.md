# Stoku në Google Play: udhëzuesi

Aplikacioni ndërtohet në dy versione nga i njëjti kod (`vendas/app/build.gradle.kts`, `productFlavors`):

| Versioni | Ku shkon | Përditësimi |
|---|---|---|
| **github** | APK te GitHub Releases (`vendas-vNN`), si deri tani | vetë aplikacioni (Perditesimi.kt), nga Releases |
| **play** | AAB për Google Play (`stoku-play-NN.aab`) | VETËM nga Google Play (PerditesimiPlay.kt, "Play In-App Updates") |

Versioni **play** s'e ka shkarkimin e APK-së nga GitHub dhe as lejen `REQUEST_INSTALL_PACKAGES` (rregullat e Play-it e ndalojnë
përditësimin jashtë Play-it). Kur ka version të ri në Play, aplikacioni e hap vetë faqen e përditësimit të Play-it.
Versioni **github** mbetet i pandryshuar dhe s'fshihet.

## Ku e gjen skedarin .aab
Çdo ndryshim në `main` krijon Release-in `vendas-vNN` me dy skedarë: `stoku-NN.apk` (github) dhe **`stoku-play-NN.aab`** (Play).
Edhe te GitHub → Actions → "Stoku APK" → run-i → Artifacts → `stoku-play-aab`.

Nënshkrimi i AAB-së: me "çelësin e ngarkimit" (upload key), që është çelësi i ri i `tel/` (`tel/celesi-i-ri.p12.enc`, i enkriptuar me
sekretin `APK_FJALEKALIMI`; `.github/apk/aab.sh`). Gjurmët e tij (publike):

- SHA-1: `CE:78:DC:C7:F6:5D:1D:F9:E4:9E:58:45:B7:E3:64:DF:88:DD:F6:87`
- SHA-256: `E7:E5:38:84:E3:58:9F:81:8A:DC:68:51:E2:6D:1D:CC:8D:2B:E1:E8:17:9E:92:01:BD:DD:9C:19:7C:2C:B6:52`

## Hapat te Play Console (një herë)
1. **Llogaria e zhvilluesit**: https://play.google.com/console → regjistrimi (25 $ një herë) dhe verifikimi i identitetit.
   Kujdes: llogaritë personale të reja duhet ta testojnë aplikacionin së pari me **të paktën 12 testues për 14 ditë**
   ("Closed testing") para se ta publikojnë për të gjithë. Llogaria e organizatës (biznesit) s'e ka këtë kusht.
2. **Krijo aplikacionin**: emri `Stoku`, gjuha bazë Shqip (sq), App, Falas.
3. **Play App Signing**: lëre si e propozon Google ("Google generates and manages the app signing key"). Ngarko
   `stoku-play-NN.aab`; Google e pranon çelësin e ngarkimit më lart.
4. **Firebase**: nëse çelësi i API-së te Google Cloud është i kufizuar sipas aplikacioneve Android (SHA-1), shto edhe SHA-1 e
   "App signing key" që e tregon Play Console te *Setup → App integrity* (paketa `site.stoku.vendas`). Pa kufizim s'duhet asgjë.
5. **Përmbajtja e aplikacionit** (*Policy → App content*):
   - Politika e privatësisë: `https://stoku.site/privatesia.html`
   - Fshirja e llogarisë (*Data deletion*): `https://stoku.site/privatesia.html#fshirja` (në aplikacion: Cilësimet → Llogaria →
     Fshi llogarinë).
   - *App access*: hyrja kërkon llogari. Krijo një llogari prove (p.sh. `provagoogle` me një fjalëkalim) dhe shkruaji te
     "Instructions": "Hyr me emrin e përdoruesit dhe fjalëkalimin. S'ka kod tjetër."
   - Reklama: Jo. Vlerësimi i përmbajtjes: aplikacion pune (Utility/Productivity), pa dhunë, pa blerje.
   - Publiku: 18+ (aplikacion pune).
   - *Data safety*: shih më poshtë.
6. **Faqja te Play Store** (*Grow → Store listing*): tekstet më poshtë dhe figurat te `vendas/play/`:
   - Ikona: `vendas/play/ikona-512.png` (512 x 512)
   - Banda: `vendas/play/banda-1024x500.png`
   - Pamjet e telefonit: `vendas/play/pamjet/*.png` (1080 x 2160; zgjidh 2 deri në 8)
7. **Publikimi**: *Testing → Closed testing* (ose *Production*) → *Create release* → ngarko `stoku-play-NN.aab` → shënimet e versionit
   (nga "Çka ka të re" te Release-i) → *Review* → *Rollout*.

## Përditësimet e mëvonshme
Pas çdo ndryshimi në `main`: merr `stoku-play-NN.aab` nga Release-i më i ri dhe ngarkoje te Play Console si release i ri. Numri i versionit
(`versionCode`) rritet vetë me çdo ndërtim. Telefonat me versionin nga Play e marrin përditësimin vetëm nga Play.

## Kalimi nga versioni github te ai i Play-it
Versioni github dhe ai i Play-it kanë të njëjtën paketë, por nënshkrim tjetër (Play e nënshkruan vetë), prandaj s'mund të instalohet
njëri mbi tjetrin: kush do të kalojë te Play e çinstalon së pari versionin github dhe hyn sërish me llogarinë. Të dhënat (stoku, afatet,
grupi) janë në cloud dhe s'humbin; humbin vetëm cilësimet e atij telefoni.

## Tekstet për Play Store
**Emri:** Stoku

**Përshkrimi i shkurtër (≤ 80 shenja):**
Malli dhe afatet e skadimit, nën kontroll: skano, shëno dhe puno me grupin.

**Përshkrimi i plotë:**
Stoku është aplikacion për regjistrimin e mallit dhe të afateve të skadimit në dyqan dhe për merchandiserët.

• Malli: folderat, produktet me barkod, sasia me +/-, kërkimi dhe Excel-i.
• Afatet: shto afatin me skanimin e barkodit, shiko çka ka skaduar dhe çka skadon së shpejti, shëno "U hoq nga rafti".
• Fotografo fletën: afatet lexohen vetë nga foto e fletës.
• Grupi: puno bashkë me kolegët, shiko afatet e krejt grupit, kërkesat për heqje nga rafti dhe aktivitetin.
• Njoftimet: njoftimi ditor për afatet në orën që zgjedh.
• Merchandiserët: marketet, "Je te" dhe afatet sipas marketit.
• PDF për printim, Excel dhe foto e afateve.
• Punon edhe pa internet; të dhënat ruhen në cloud dhe i sheh në çdo pajisje, edhe te stoku.site.
• E çelët dhe e errët, me ngjyrat që i zgjedh vetë.

Llogarinë mund ta fshish vetë në çdo kohë te Cilësimet → Llogaria.

## Data safety (përgjigjet)
- Mbledh të dhëna: **Po**. Të enkriptuara gjatë dërgimit: **Po**. Përdoruesi mund të kërkojë fshirjen: **Po** (në aplikacion).
- Të dhënat (krejt për "App functionality", asnjë për reklama, asnjë s'shitet):
  - *Personal info → User IDs*: emri i përdoruesit (i detyrueshëm).
  - *Photos*: fotoja e profilit (opsionale) dhe foto e fletës që lexohet me AI (opsionale, s'ruhet).
  - *Location → Precise location*: vendndodhja e marketit kur e shton (vetëm merchandiserët, opsionale).
  - *App activity → Other user-generated content*: produktet, afatet, aktiviteti i grupit.
  - *Device or other IDs*: tokeni i njoftimeve (Firebase Cloud Messaging).
- Ndarja me palë të treta: Jo (Firebase/Google dhe Cloudflare janë "service providers" që punojnë për Stoku-n).

## Lejet e aplikacionit (versioni play)
Interneti, kamera (skanimi dhe foto e fletës), vendndodhja (vetëm kur aplikacioni është i hapur, për marketet), njoftimet, dridhja.
