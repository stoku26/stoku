# Stoku në Google Play: udhëzuesi

Aplikacioni ndërtohet në dy versione nga i njëjti kod (`vendas/app/build.gradle.kts`, `productFlavors`):

| Versioni | Ku shkon | Përditësimi |
|---|---|---|
| **github** | APK te GitHub Releases (`vendas-vNN`), si deri tani | vetë aplikacioni (Perditesimi.kt), nga Releases |
| **play** | AAB për Google Play (`stoku-play-NN.aab`), paketa **`app.stoku.android`**, nis në **anglisht** | VETËM nga Google Play (PerditesimiPlay.kt, "Play In-App Updates") |

Versioni **play** s'e ka shkarkimin e APK-së nga GitHub dhe as lejen `REQUEST_INSTALL_PACKAGES` (rregullat e Play-it e ndalojnë
përditësimin jashtë Play-it). Kur ka version të ri në Play, aplikacioni e hap vetë faqen e përditësimit të Play-it.
Versioni **github** mbetet i pandryshuar (paketa `site.stoku.vendas`, nis në shqip) dhe s'fshihet.

**Paketa (pronari, 24.11.2026):** versioni play ka `applicationId = "app.stoku.android"` (vetëm te `productFlavors` → `play`); kodi
(namespace `site.stoku.vendas`, klasat) s'ndryshon dhe çdo vend që do paketën e merr nga `packageName` / `${applicationId}`
(FileProvider `app.stoku.android.skedaret`, ikonat e jashtme, lidhja e Play-it). Në telefon është aplikacion më vete nga versioni github
(mund të jenë të dy të instaluar). Pasi të publikohet në Play, paketa s'mund të ndryshohet më kurrë.
**Gjuha:** versioni play nis në anglisht (kur s'ka zgjedhje të ruajtur); shqipja te Settings → Appearance → Language.
Testi `PlayTest` (vetëm play, CI "Versioni Play") e kontrollon paketën, anglishten dhe që asnjë ekran s'ka tekst shqip.

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
2. **Krijo aplikacionin**: emri `Stoku`, gjuha bazë **English (United States) – en-US**, App, Falas. Paketa merret vetë nga
   AAB-ja e parë: `app.stoku.android`.
3. **Play App Signing**: lëre si e propozon Google ("Google generates and manages the app signing key"). Ngarko
   `stoku-play-NN.aab`; Google e pranon çelësin e ngarkimit më lart.
4. **Firebase: s'duhet asgjë.** Aplikacioni lidhet me Firebase me REST (si web-i), pa e dërguar paketën as SHA-1, prandaj një
   kufizim i çelësit sipas aplikacioneve Android do ta bllokonte edhe versionin github që punon. Paketa e re `app.stoku.android`
   punon njësoj (hyrja, të dhënat, njoftimet). S'ka nevojë për *Add app* te Firebase as për google-services.json.
5. **Përmbajtja e aplikacionit** (*Policy → App content*): krejt përgjigjet janë te pjesa "Përgjigjet për App content" më poshtë.
6. **Faqja te Play Store** (*Grow → Store listing*): tekstet më poshtë dhe figurat te `vendas/play/`:
   - Ikona: `vendas/play/ikona-512.png` (512 x 512)
   - Banda: `vendas/play/banda-1024x500.png`
   - Pamjet e telefonit (anglisht, 950 x 1688, 9:16): `vendas/play/pamjet-en/1-home.png`, `2-expiry-dates.png`, `3-stock.png`,
     `4-settings.png` (nga `PlayTest`, anët e zgjatura që raporti të jetë brenda kufirit 2:1 të Play-it; Grupi s'futet se pa
     server del vetëm "Connecting to the group..."). Linku: https://github.com/stoku26/stoku/tree/main/vendas/play/pamjet-en Pamjet shqip `vendas/play/pamjet/*.png` janë për listën shqip (opsionale, *Add translations → Albanian*).
7. **Publikimi**, me radhë (llogari personale e re):
   1. **Internal testing** (opsional, për provë të shpejtë): *Test and release → Testing → Internal testing → Create new release*
      → ngarko `stoku-play-NN.aab` → shënimet → *Next* → *Save and publish*. Testuesit (email Gmail) e marrin brenda pak minutash.
   2. **Closed testing** (i detyrueshëm para Production): *Closed testing → Create track* (ose "Alpha") →
      *Countries/regions*: Kosova, Shqipëria, Maqedonia e Veriut, Gjermania, Zvicra (ose krejt vendet) →
      *Testers*: listë me **të paktën 12** llogari Gmail (më mirë 14-15) → *Create new release* → *Add from library* (AAB-ja e fundit)
      → *Next* → *Save* → *Send for review*. Pas miratimit, secili testues e hap linkun e testit, shtyp *Become a tester* dhe e instalon.
   3. **14 ditë** pa ndërprerje me të paktën 12 testues të regjistruar (opted-in). Mos e çinstalojnë gjatë kësaj kohe.
   4. **Production**: *Dashboard → Apply for production* → pyetjet e Google-it për testin → pas miratimit *Production → Create new
      release* → *Add from library* → *Send for review*.
   - *Publishing overview → Send changes for review* hapet vetëm pasi të publikohet Internal testing ose të dërgohet Closed testing.
   - Paralajmërimet për "deobfuscation file" dhe "debug symbols" janë vetëm këshilla (s'duhen).

## Përditësimet e mëvonshme
Pas çdo ndryshimi në `main`: merr `stoku-play-NN.aab` nga Release-i më i ri dhe ngarkoje te Play Console si release i ri. Numri i versionit
(`versionCode`) rritet vetë me çdo ndërtim. Telefonat me versionin nga Play e marrin përditësimin vetëm nga Play.

## Versioni github dhe ai i Play-it në të njëjtin telefon
Kanë paketa të ndryshme (`site.stoku.vendas` dhe `app.stoku.android`), prandaj për telefonin janë dy aplikacione të ndara: mund të
jenë të dy të instaluar njëkohësisht. Te versioni nga Play hyhet sërish me llogarinë; malli, afatet, grupi dhe pamja janë te llogaria
(cloud) dhe dalin njësoj. Cilësimet e vetë telefonit (p.sh. ora e njoftimit, gjuha) zgjidhen sërish. Kush kalon krejt te Play, mund ta
çinstalojë versionin github pasi të hyjë te versioni i Play-it.

## Përgjigjet për App content (Play Console → Policy → App content)
- **Privacy policy:** `https://stoku.site/privacy.html` (shqip: `privatesia.html`)
- **App access (Sign in details):** *Is any part of your app restricted?* **Yes** → *Add instructions*:
  - Name `Test account`, Username / Password të një llogarie prove (p.sh. `googletest`) që e krijon pronari, e bën admin të një grupi
    dhe i shton disa produkte e afate. Mos e fshij dhe mos ia ndrysho fjalëkalimin. Kurrë llogarinë e administratorit.
  - *Any other information:*
    ```
    Only the username and password above are needed. There is no 2-step verification, code or payment.
    The test account is the admin of a group, so all sections are available (stock, expiry dates, group, activity, settings).
    Barcode scanning uses the camera, but barcodes can also be typed by hand.
    Location is optional and only used for the "Markets" section; markets can also be added without location.
    The smartwatch app is optional and not needed for the review.
    ```
- **Ads:** *No, my app does not contain ads*. Nëse shtohen reklama më vonë: ndryshoje në *Yes* para atij versioni dhe përditëso Data safety.
- **Content rating:** Email `mendurb@gmail.com`, Category **All Other App Types**, prano IARC Terms.
  - Downloaded App (ratings-relevant content): **No**
  - User Content Sharing: interact/exchange content **Yes**; UGC primary source **No**; public nudity **No**; public graphic violence
    **No**; block users **Yes** (admini e heq kolegun, kushdo largohet vetë); report users **No**; chat moderation **No**;
    limited to invited friends only **Yes**
  - Online Content: krejt **No**. Age-Restricted Products: krejt **No**. Miscellaneous: krejt **No**.
- **Target audience:** vetëm **18 and over**; *Appeal to children* **No**.
- **Data safety:** shih "Data safety (përgjigjet)" më poshtë.
- **Government apps:** **No**. **Financial features:** *My app doesn't provide any financial features*. **Health:** asnjë.
- **App category:** App, **Business**. **Contact:** email `mendurb@gmail.com`, website `https://stoku.site`.

## Tekstet për Play Store (anglisht, gjuha bazë)
**Name:** Stoku

**Short description (≤ 80 characters):**
Stock and expiry dates under control: scan, track and work with your team.

**Full description:**
Stoku is an app for keeping track of stock and expiry dates in stores and for merchandisers.

• Stock: folders, products with barcodes, quantity with +/-, search and Excel.
• Expiry dates: add a date by scanning the barcode, see what has expired and what expires soon, mark "Removed from the shelf".
• Photograph the sheet: expiry dates are read automatically from a photo of the sheet.
• Group: work together with colleagues, see the whole group's expiry dates, removal requests and activity.
• Notifications: a daily notification about expiry dates at the time you choose.
• Merchandisers: markets, "You're at" and expiry dates by market.
• PDF for printing, Excel and a photo of the expiry dates.
• Works offline too; your data is saved in the cloud and you see it on every device, also at stoku.site.
• Light and dark, with the colors you choose.
• English and Albanian.

You can delete your account yourself at any time in Settings → Account.

## Tekstet për Play Store (shqip, përkthim opsional)
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
- Mbledh të dhëna: **Po**. Të enkriptuara gjatë dërgimit: **Po**. Krijimi i llogarisë: **Username and password**.
- Përdoruesi mund të kërkojë fshirjen: **Po**, URL `https://stoku.site/privacy.html#fshirja` (në aplikacion: Settings → Account → Delete account).
- Të dhënat (krejt për "App functionality", asnjë për reklama, asnjë s'shitet):
  - *Personal info → User IDs*: emri i përdoruesit (i detyrueshëm).
  - *Photos*: fotoja e profilit (opsionale) dhe foto e fletës që lexohet me AI (opsionale, s'ruhet).
  - *Location → Precise location*: vendndodhja e marketit kur e shton (vetëm merchandiserët, opsionale).
  - *App activity → Other user-generated content*: produktet, afatet, aktiviteti i grupit.
  - *Device or other IDs*: tokeni i njoftimeve (Firebase Cloud Messaging).
- Ndarja me palë të treta: Jo (Firebase/Google dhe Cloudflare janë "service providers" që punojnë për Stoku-n).

## Lejet e aplikacionit (versioni play)
Interneti, kamera (skanimi dhe foto e fletës), vendndodhja (vetëm kur aplikacioni është i hapur, për marketet), njoftimet, dridhja.
