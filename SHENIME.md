# Shënime për Claude — Stoku (stoku.site)

Ky skedar ekziston që **çdo bisedë e re** (edhe nëse s'e ka memorien e bisedave të kaluara) të mund ta
lexojë dhe ta kuptojë menjëherë projektin: çka është, si punon, çka është bërë deri tash, dhe çka duhet
respektuar kur shtohet diçka e re. Lexoje këtë skedar TË PARIN, para se të bësh çfarëdo ndryshimi.

Përditësoje këtë skedar sa herë bën një ndryshim domethënës (jo për çdo "typo fix", por për çdo veçori
të re, ndryshim arkitekture, apo mësim të rëndësishëm) — në të njëjtin PR me ndryshimin, ose në një PR
më vete menjëherë pas.

## Çka është Stoku

App web (PWA) për menaxhimin e stokut në një market/dyqan: skanim barkodesh, foldera/kategori, eksport
Excel/PDF, dhe modulin "Afatet" (datat e skadimit të produkteve, me lexim automatik të fletëve të
shkruara me dorë përmes AI-së). Pronari (menaxherja) e përdor kryesisht në kompjuter; punëtorët e
telefonit/PDA-së skanojnë mallin. Të dhënat sinkronizohen automatikisht mes pajisjeve përmes Firebase.

- **Faqja e vërtetë:** https://stoku.site (GitHub Pages, degë `main`, skedari `CNAME`)
- **Repo:** stoku26/stoku
- **Gjuha:** vetëm shqip, edhe në UI edhe në kod (komente, emra ndryshoresh/funksionesh). Mos e ndrysho
  këtë — as identifikuesit teknikë s'janë në anglisht, është vendim i qëllimshëm.
- **Përdoruesi (pronari i repo-s) flet shqip (dialekti i Kosovës), joformal, shkurt.** Përgjigju gjithmonë
  shqip, në të njëjtin regjistër — jo shqipe letrare e ngurtë.

## Struktura e skedarëve

| Skedar | Çka është |
|---|---|
| `index.html` | Versioni për **telefon/PDA** (~5000+ rreshta: HTML+CSS+JS gjithçka në një skedar). |
| `pc.html` | Versioni për **kompjuter** (~4600+ rreshta, e njëjta bazë e të dhënave, UI ndryshe: tabelë, shirit anësor, shkurtore tastiere). |
| `afatet.js` | Logjika e përbashkët për "Afatet" (data, statuse, lexim AI, formatim). Përdoret nga të dy faqet **dhe** nga `sw.js` (për njoftimet në sfond). |
| `bashkimi.js` | Logjika e bashkimit të të dhënave mes pajisjeve (LWW me kohë, fshirjet si tombstones). E përbashkët. |
| `ruajtja.js` | Ndarja e dyqanit në Firestore në disa dokumente (shih më poshtë "Firebase"). |
| `porta.js` | Ekrani i hyrjes/kyçjes (login gate) — hapet para faqes kryesore te të dyja versionet. |
| `njoftimet.js` | Njoftimet push për afatet (30 ditë para skadimit, dhe kur skadon) — logjikë e përbashkët për faqen dhe `sw.js`. |
| `teRejat.js` | Lista "Çka ka të re" (shënimet e versioneve) — tregohet në hyrje. **Shto këtu një hyrje për çdo ndryshim domethënës të ri**, shih udhëzimin brenda skedarit. |
| `xlsx.js` | Ndërton dhe lexon skedarë `.xlsx` pa librari të jashtme. |
| `sw.js` | Service worker: cache për punë pa internet + **përditësim automatik** (shih poshtë). |
| `manifest.webmanifest` | PWA manifest (emri "Stoku", ikonat). |
| `css/` | Pamja (v126): `stoku-tokens.css` (fontet, ngjyrat e çelëta/errëta), `stoku.css` (telefoni), `stoku-pc.css` (kompjuteri). |
| `fonts/` | Onest dhe JetBrains Mono (woff2, OFL), që pamja të punojë edhe pa internet. |
| `logo/` | Logo e re (SVG, favicon, ikona "maskable"). |
| `beta/` | Vetëm ridrejtim te Stoku (Beta u hoq te v126). |

## Rregulla teknike THEMELORE (mos i harro)

0. **PA VIZË TË GJATË ("—") në asnjë tekst që e sheh përdoruesi** (tituj, mesazhe, toast, "Çka ka të re",
   njoftime, placeholder). Përdoruesi e sheh si shenjë që teksti është shkruar me AI (v117 u pastruan krejt).
   Në fjali: presje, pikë, dy pika ose kllapa. Si ndarës: "·" (p.sh. "Sinkronizuar · 12:21") ose "•" (titulli
   i dritares: "Ekipa • Përmbledhja • Stoku"). Qelizë bosh në tabelë: "–" (vizë e shkurtër). Te komentet e kodit
   s'ka rëndësi. Kontrolli: `gjej-vizat.js` (scratchpad) duhet të japë "gjithsej 0".

0000000. **SAHATI: TË SKADUARAT NË KRYE (ora, pa ndryshim në web)**: lista e orës tash fillon me "KANË SKADUAR" (të kuqe),
   pastaj "SKADOJNË SOT", "KËTË JAVË"; titulli "PËR T'U HEQUR · n" (sot + të skaduara). Detaji i të skaduarës: "Skadoi më
   dd.MM" + "✓ E hoqa nga rafti"; me 2+ të skaduara chip "Hiqi krejt nga rafti" → konfirmim (`Pamja.HiqKrejt`, `/ora/hiq` për
   secilën). Tile: rresht i kuq "n kanë skaduar"; komplikacioni = sot + të skaduara. Serveri (`/ora/sot` skaduaraL) s'ndryshoi.
0000000. **APLIKACIONI ANDROID `tel/` (v167 = 1.9.0, Worker 160, APK `tel-vNN`)**: përdoruesi s'donte të dilte kur fshin
   "Cookies, cache, and other site data" në Chrome Android (dhe njoftimet ndaleshin). Asnjë faqe s'e mbijeton atë fshirje,
   prandaj: aplikacion Android (WebView me hapësirë të vetën) që e hap stoku.site. Paketa `site.stoku.app`, minSdk 26,
   çelësi `tel/stoku-tel.jks` (fjalëkalimi `stokutel`, në repo si te ora). Workflow `tel-apk.yml` → Release `tel-v{run}`.
   - Kotlin: `MainActivity` (WebView vetëm për stoku.site, të tjerat hapen jashtë; kamera me leje; zgjedhësi i skedarëve
     me foto nga kamera; faqe "pa internet"), `Ura` (`window.StokuAndroid`: tokenFcm, leja, kerkoLejen, njofto, ndaj,
     ngjyrat, versioni, kontrolloPerditesimin), `FcmSherbimi`, `Njoftimet` (kanali "stoku"), `Perditesimi` (GitHub API
     → "Version i ri" → shkarkim + instalues; 1 herë në 6 orë), `StokuApp` (Firebase nis nga `android.json` i faqes).
   - Firebase për Android NUK është në APK: `android.json` (rrënja e faqes) {projectId, senderId, apiKey, appId}; pa
     `appId` (Android App ID nga Firebase Console) aplikacioni punon pa push. Worker-i: sekreti `FCM_SA` (service account
     JSON) → OAuth RS256 → FCM HTTP v1, mesazhe "data" me prioritet të lartë; 404/UNREGISTERED → pajisja fshihet.
   - Web: `android.js` (i pari te index.html, s'bën asgjë në shfletues): polyfill `Notification` + `showNotification` →
     njoftimet e Android-it, `navigator.share`/`<a download>` blob → "Ndaj", `navigator.standalone`, ngjyra e shiritave
     sipas `#metaTema`, ngjarja `stoku-android-token` → `aktivizoPush(true)`. ekipa.js: `pajisjaPush()` = Web Push
     {endpoint,p256dh,auth} ose Android {endpoint:'fcm:'+t, fcm:t} (dokumenti te `grupet/{g}/push`, `/orari` pajisja).
   - Cilësimet → Njoftimet: karta "Aplikacioni Stoku për Android" (Chrome Android: shkarko → `android.html`, faqe që
     gjen APK-në e fundit; brenda aplikacionit: versioni + "Kontrollo për version të ri").
   - Ora (`ora/`): `Perditesimi.kt` + chip "Përditëso" te lista kur ka `ora-vNN` më të ri (FileProvider, leje instalimi).
   - Testet: `android-test.js` (urë e simuluar, 12 OK), `wp/fcm-prova.mjs` (10 OK). APK-të ndërtohen vetëm në GitHub
     (dl.google.com është i bllokuar këtu); gabimet shihen me `gh api .../actions/runs/{id}/jobs` + logs.
0000000. **v166 = 1.8.2: U HOQ "MOS DIL KUR I FSHIN TË DHËNAT" (v165)**: karta te Cilësimet → Llogaria (fjalëkalimi →
   `credentials.store`) dhe udhëzimi te porta ("shtyp Ruaj") u hoqën me kërkesë të përdoruesit: në Chrome Android
   (Delete browsing data → "Cookies, cache, and other site data") prapë dilte. porta.js, index.html, pc.html = si te v164
   (mbetet vetëm `credentials.store` pas hyrjes me formë dhe `credentials.get` në portë, pa asnjë tekst/opsion).
   E vërteta teknike: ajo fshirje heq KREJT të dhënat e faqes (IndexedDB i Firebase-it, localStorage, service worker-in
   dhe abonimin push), pra dalja + humbja e njoftimeve s'ndalohen dot nga brenda faqes. Mos u mundo me "ruajtje që i
   mbijeton fshirjes" (cache/supercookie): është teknikë gjurmimi dhe s'bëhet. Zgjidhja e vërtetë: aplikacion Android
   me hapësirë të vetën (WebView), që Chrome s'e prek; i propozuar përdoruesit, pret përgjigjen.
0000000. **GRUPET TE EKIPA (v164 = 1.8.0, Worker 159, RREGULLA TË REJA)**: kush sapo regjistrohet s'sheh askënd derisa
   ta krijojë një grup ose ta pranojë një ftesë. Një përdorues = një grup.
   - Të dhënat: `grupet/{g}` {emri, pronarUid, pronarEmri, krijuarSe}; `grupet/{g}/anetaret/{uid}` {emri, roli
     'pronar'|'anetar', hyriSe, aktivSe, online, platforma, sasiaShpejte?}; nënkoleksionet `afatet`, `feed`, `chat`, `push`
     (si `ekipa_*` më parë); `ftesat/{g}_{emri}` {gid, grupiEmri, perdoruesi, ngaUid, ngaEmri, koha}. Treguesi
     `perdoruesit/{uid}.grupi`: '' = pa grup; pa fushën fare = ende pa kaluar (provohet ekipa e vjetër një herë).
     Njoftimet (`perdoruesit/{u}/njoftimet`) kanë fushën `grupi` (rregullat: dërguesi dhe marrësi në të njëjtin grup).
   - Ekipa e vjetër = grupi me id `ekipa` (emri "Ekipa"). Admini, kur e hap versionin e ri, e migron një herë
     (`migroEkipenEVjeter`, shenja `perdoruesit/{admin}.grupetMigruarSe`): anëtarët e `ekipa_anetaret`, 150 mesazhet/ngjarjet
     e fundit, `ekipa_afatet`; admini bëhet pronar. Anëtari i vjetër hyn vetë te `ekipa` (`provoGrupinEVjeter`, rregulla:
     ekziston `ekipa_anetaret/{uid}`); kur largohet ose hiqet nga "ekipa", fshihet edhe `ekipa_anetaret/{uid}` (s'rihyn).
   - Pronari: fton (me emrin e përdoruesit), anulon ftesat, heq anëtarë (edhe afatet dhe pajisjet e tyre për push),
     ndryshon rolin (gjithmonë të paktën një pronar), riemërton, lajmëron grupin, pastron chat-in/aktivitetin, jep lejen e
     +/- (`sasiaShpejte` te anëtarësia). Admini global (mendurberisha) mban vetëm: fshirjen e llogarive ("Llogaritë e
     tjera", lista e `perdoruesit` lejohet vetëm për të) dhe pamjen e stokut. Kur fshin pronarin e vetëm, anëtari më i
     vjetër bëhet pronar.
   - Krijimi i grupit: grupi + anëtarësia e pronarit në NJË batch (rregulla me `getAfter`: pronari hyn vetë vetëm në
     çastin e krijimit, që themeluesi i hequr mos ta rimarrë grupin). Pranimi i ftesës: së pari anëtarësia e re + fshirja
     e ftesës (batch), pastaj largimi nga grupi i vjetër (i fundit → grupi fshihet krejt), pastaj treguesi; ftesa e
     anuluar → `arsye: 'ftesa-skadoi'` dhe mbetesh ku ishe. Kur pronari të heq, aplikacioni yt e pastron treguesin.
   - Worker 159: `/chat` dhe `/kerkese` marrin `grupi` (rrugët `grupet/{g}/chat|feed|push`; pa të: `ekipa_*` për
     versionet e vjetra); push vetëm te pajisjet e anëtarëve të tanishëm (të tjerat fshihen). `/ora/*` sipas
     `perdoruesit/{uid}.grupi`: '' ose i hequr nga grupi → s'ka kolegë (jo "rilidh").
   - UI pa grup: tel "Ose krijo grupin tënd" + ftesat (Prano/Refuzo); PC `#ekPaGrup`, dhe `ekShenjat` i fsheh nën-faqet e
     Ekipës te anësorja, "Kërko heqje" dhe "Chat" (mbetet Përmbledhja me ftesat).
   - Pa rregullat e reja: Ekipa tregon "Grupet s'janë gati ende" (stoku/afatet punojnë). Testet: `grupet-test.js`
     (3 përdorues + admini, tel + PC, siguria), `wp/grupi-prova.mjs`, mock-u `fs-server.js` me rregullat e grupeve
     (edhe `getAfter` te batch-i).
0000000. **EXCEL SIPAS FURNIZUESIT, HYRJA PAS FSHIRJES, TABET NË iPHONE (v163 = 1.7.0)**:
   - `afatet.js`: `furnizuesitELista(lista)` (emrat pa dallim shkronjash/hapësirash, "Pa furnizues" = `__pa__` në fund)
     dhe `celesiFurnizuesit(a)`. Tel: `#axFurn` te dritarja e eksportit (lista sipas muajit të zgjedhur; fshihet me < 2
     furnizues), fleta dhe skedari marrin emrin e furnizuesit. PC: `#aeFurn`, `afatetPerEksport(muaji, furn)`, edhe fleta
     "Për furnizuesit" filtrohet.
   - Hyrja: fshirja e të dhënave të shfletuesit e fshin edhe sesionin e Firebase-it (s'ka vend tjetër në faqe ku të ruhet).
     `porta.js`: pas hyrjes `navigator.credentials.store(new PasswordCredential({id, password}))` (Chrome / Google
     Password Manager); kur porta hapet pa hyrje, `credentials.get({password: true, mediation: 'optional'})` një herë →
     hyn vetë ose Chrome pyet me një prekje; pas "Dil" me dorë (`StokuPorta.dilMeDore`: `preventSilentAccess` + LS
     `stoku:porta:dil`) vetëm `silent`. Ndryshimi i fjalëkalimit e përditëson kredencialin. Safari s'e ka API-n: forma ka
     `autocomplete="username"`/`"current-password"` për iCloud Keychain; aplikacioni i instaluar në iPhone (ekrani kryesor)
     ka hapësirë të veçantë, që s'fshihet me "Clear History and Website Data" të Safari-t.
   - iPhone në Safari (jo i instaluar): Safari (iOS 26) e raporton `env(safe-area-inset-bottom)` edhe pse shiriti i tij
     e mbulon zonën poshtë → tabet ngriheshin. Klasa `ios-shfletues` (skript në `<head>`) e bën `--sab: 0px`; krejt
     `env(safe-area-inset-bottom)` te index.html/stoku.css → `var(--sab)`.
0000000. **KËRKESAT NGA SAHATI (v162 = 1.6.0, Worker 158)**: te `/ora/lidh` telefoni dërgon edhe `rt`
   (`auth.currentUser.refreshToken`), i ruajtur te `ora-tok:*`; Worker-i e kthen në ID token (securetoken.googleapis.com,
   çelësi publik i Firebase) dhe vepron SI PËRDORUESI, pra rregullat e Firestore vlejnë njësoj: `GET /ora/koleget`
   (ekipa_anetaret pa veten), `POST /ora/kerkese {produktet, perUid, perEmri}` shkruan `ekipa_feed/{id}` +
   `perdoruesit/{u}/njoftimet/*` (të njëjtat fusha si `kerkoHeqjen` te ekipa.js) dhe dërgon push përmes `W.fetch('/kerkese')`.
   Pa `rt` (lidhje e vjetër) → 403 `rilidh`. `POST /ora/shkeput` e fshin lidhjen. `/ora/sot` kthen edhe `skaduaraL` dhe
   `ekipa`. Ora: prekja e produktit hap detajin (✓ U hoq / Kërko heqje → Krejt ekipa ose koleg), seksioni "Kanë skaduar";
   ikona opsioni 5 (gri e ndritshme, gradient #4B505B→#2A2D34, shufra të bardha + një e verdhë).
0000000. **IKONA E SAHATIT (v161 = 1.5.1)**: ikona adaptive e `ora/` kishte sfond #14161B (s'dukej mbi sfondin e zi
   të Galaxy Watch); tash sfond #F5B70A me shufrat e barkodit të zeza (+ kënde skanimi), shkallë 1.08 (këndet brenda rrethit të dukshëm). `lidhOrenMeKod`:
   `arsye 'rruga'` (Worker i vjetër pa `/ora/*`) → mesazh "ngjite kodin e ri".
0000000. **STOKU PËR SAHAT (v160 = 1.5.0, Worker 157)**: aplikacion Wear OS te `ora/` (Kotlin + Compose for Wear OS:
   lista e sotme me ✓/Zhbëj, tile, komplikacion SHORT_TEXT). APK ndërtohet nga `.github/workflows/ora-apk.yml`
   (artifact; në main edhe Release `ora-vNN`), i nënshkruar me `ora/stoku-ora.jks` (në repo, që përditësimet të
   instalohen sipër). Worker 157: `POST /ora/kodi` (ora: kodi 6-shifror + sekret 64-hex, `ora-kodi:*` TTL 15 min),
   `POST /ora/lidh` (telefoni, me llogari → `ora-tok:{sha256(sekret)}` = uid, `ora-ka:{uid}`), `GET /ora/sot?tz=`
   (header `X-Stoku-Ora`), `POST /ora/hiq {i, zhbej}` → `ora-hequr:{uid}`, `POST /ora/hequrat {pastro}` (telefoni/PC i
   zbatojnë si heqje dhe i pastrojnë; ato që s'gjenden lokalisht mbeten). Afatet e dërguara kanë tash `i` (id) dhe `s`
   (sasia); dërgohen nga çdo pajisje me `vetemMeOrar` kur s'ka orar këtu (serveri i ruan nëse ka orar ose orë;
   `paOrar` mbahet 10 min në LS). Njoftimi ditor i përjashton të hequrat nga ora. UI: `#oraKodi`/`#oraLidh` te
   Njoftimet → Galaxy Watch.
0000000. **KONTROLLI I PLOTË + AFATET NGA PC (v159 = 1.4.10, Worker 156)**: zvarritësi (416 klikime, tel + PC, temë e
   çelët + e errët) pa asnjë problem; regresioni krejt OK. Mangësia e gjetur: serveri e merrte listën e afateve vetëm nga
   telefoni (kur hapej), kështu afati i shtuar në PC që skadon sot s'dilte te njoftimi ditor. Tash `shkruajLokalisht` te
   pc.html thërret `dergoAfatetPerNjoftiminDitor` (pritje 4 s) → `dergoAfatetPerOrarin(afatet, true)` me `vetemMeOrar`;
   Worker 156 i ruan vetëm nëse uid-i ka orar në ndonjë pajisje (`paOrar` përndryshe, pa shkrim në KV). Worker 155 i
   ruan gjithsesi, prandaj `VERSIONI_WORKER` te aplikacioni mbetet 155 (s'del "kodi i vjetër").
0000000. **NJOFTIMI DITOR VETËM PËR SOT (v158 = 1.4.9, Worker 155)**: sipas kërkesës, `njoftimiDitor` s'bën më
   përmbledhje (të skaduarat + java): merr vetëm afatet me `d === sot` ("X skadon sot. Hiqe nga rafti." / "N produkte
   skadojnë sot: …", titulli "Stoku · Skadon sot"); pa to kthen `null` dhe `rez = 'asgje'`, pa njoftim. `shtoDite` u hoq.
   Te Cilësimet "Përmbledhje çdo ditë" → "Njoftimi ditor", teksti ndihmës dhe "Sot s'skadon asnjë produkt".
   `VERSIONI_WORKER: 155`.
0000000. **DIAGNOZA E CRON-IT (v157 = 1.4.8, Worker 154)**: shenja `orari-cron` s'u rifreskua pas ndryshimit të Cron-it
   në "Every minute" (mbeti 18:00:49 me `0,15,30,45`), ndërsa Metrics s'tregonte gabime: Worker 153 e shkruante shenjën
   në fund të `dergoNjoftimetDitore` dhe çdo gabim (edhe `put` i KV-së) gëlltitej. Worker 154: `scheduled()` e shkruan
   shenjën SË PARI (`shenoCronin`), `console.log('stoku-push cron: …')` për Logs, gabimet ruhen te `orari-cron-gabim`
   (`shenoGabimin`: i njëjti mesazh më së shumti një herë në 10 min, që Cron-i çdo minutë të mos e harxhojë limitin 1000
   shkrime/ditë) dhe dalin te health si `cronGabim`. `GET /?kv=1` provon një shkrim (`kv-prove`, maks një herë në 10 min)
   e kthen `kv: {ok, mesazh}`, që të dallohet limiti ditor i KV-së (atëherë as gabimi s'ruhet dot). Aplikacioni:
   `cronMeFjale` ("çdo 15 minuta" në vend të yjeve që s'shfaqeshin), `cronVonesaMaks` (Cron i ndalur sipas shpeshtësisë,
   jo 45 min fikse), `gabimiICronit`, dhe `provoKV()` (ekipa.js) thirret vetëm kur Cron-i duket i ndalur.
   `VERSIONI_WORKER: 154`.
0000000. **ORARI RIREGJISTROHET VETË (v156 = 1.4.7)**: te Metrics u pa `fcm.googleapis.com 4xx` (adresa push e vjetër, pas
   riinstalimit) → Worker-i e fshin orarin (404/410), por telefoni mbetej "i ndezur". `ekipa.js
   rinovoOrarinNesesMungon(detyro, stNjohur)`: nëse orari lokal është aktiv dhe `/orari {statusi}` thotë `!ekziston` →
   `vendosOrarin` sërish (+ afatet). Thirret pas `kontrolloServerin` te `aktivizoPush` (maks 1 herë/3 orë) dhe te
   Cilësimet → Njoftimet (menjëherë). Cron-i i përdoruesit tani "Every minute".

0000000. **PA NJOFTIME TË TEPËRTA NË HAPJE (v155 = 1.4.6)**: me orar aktiv, `kontrolloNjoftimet` e vendoste flamurin e
   IndexedDB ('orari') para se `kontrolloServerin()` (në `aktivizoPush`) të shkruante `cron-ok` → në hapje dilte
   "34 produkte skadojnë brenda 30 ditëve". Tani, kur orari është aktiv dhe `orariPunon()` s'është konfirmuar, pritet
   `kontrolloServerin()` (maks 6 s) para vendimit. Njoftimi "Chrome · Stoku · Tap to copy the URL for this app" është i
   Chrome-it: del kur Stoku është i shtuar si shkurtore (jo WebAPK); s'varet nga kodi.

0000000. **ORA E RE VLEN QË SOT (v154 = 1.4.5, Worker 153)**: `/orari` me orë të re: `dita = ''` kur ora e re s'ka kaluar
   sot (më parë, nëse sot ishte dërguar/kontrolluar një herë, mbetej `dita = sot` → asgjë deri nesër); e njëjta orë
   sërish → asgjë s'ndryshon. App: paralajmërim kur ora te serveri (`im.ora`) ≠ ora te telefoni. Përdoruesi kishte
   ende Cron `0,15,30,45 * * * *` → minutat jashtë tyre s'kapeshin; duhet `* * * * *`.

0000000. **ORA 24-ORËSHE (v153 = 1.4.4)**: `input type=time` tregonte AM/PM sipas gjuhës së telefonit → `#njOra` tani
   `type=text inputmode=numeric maxlength=5`; gjatë shkrimit vetëm shifra dhe ":" pas orës; `oraNgaTeksti()` ("9" →
   09:00, "905" → 09:05, "1705" → 17:05; jashtë 00:00–23:59 refuzohet). Ruhet te `change` (blur/Enter).

0000000. **ORA E LIRË NË MINUTË (v152 = 1.4.3)**: `#njOra` = `<input type="time" step="60">` (çdo minutë). Worker 152:
   `ORA_RE` pranon HH:MM; Cron-i duhet **`* * * * *`** (çdo minutë) — kështu e ka vendosur përdoruesi; `orari-cron` tani
   JSON {koha, shprehja} (nga `event.cron`) dhe shkruhet vetëm kur ndryshon shprehja ose çdo 10 min (kufiri 1000
   shkrime/ditë i KV-së falas); GET `/` kthen edhe `cronShprehja`. App: `cronKapMinuten(shprehja, ora)` → paralajmërim
   kur Cron-i s'e kap minutën e zgjedhur; serveri i vjetër kthen 400 'ora' për minutat jashtë :00/:15/:30/:45.

0000000. **NJOFTIMI DITOR: DIAGNOZA + RRUGËDALJA (v151 = 1.4.2)**: përdoruesi s'mori njoftim (Galaxy Watch). Gabim imi:
   me orar aktiv, njoftimet lokale ndaleshin edhe kur Cron-i/kodi i ri s'ishte vendosur → asgjë s'vinte. Tani:
   - Worker `VERSIONI_WORKER = 151`; GET `/` kthen edhe `versioni` dhe `cron` (koha e ekzekutimit të fundit të
     `scheduled()`, KV `orari-cron`). Indeksi ruan `rez` ('derguar' | 'asgje' | 'gabim-<status>') dhe `kohaRez`.
     POST `/orari {statusi:true, pajisja}` → { ekziston, ora, dita, rez, kohaRez, cron, afatet }.
   - `ekipa.js`: `shenoCronin(health)` → LS `stoku:orari:cron-ok` (versioni ≥ 151, KV, Cron < 45 min); `orariPunon()`
     (orar aktiv + cron-ok < 36 orë). Vetëm atëherë `StokuNjoftimet.vendosOrarin(true)` (ndalen njoftimet lokale).
     `statusiIOrarit()` për Cilësimet.
   - Tel, Cilësimet → Njoftimet: `#njOraServer` (jeshile/portokalli): kodi i vjetër, mungon KV, mungon/ndalur Cron-i,
     pajisja s'ka orar te serveri, ose "✓ Sot u dërgua në 08:00" / "s'kishte afate".
   **Kodi i Worker-it duhet ngjitur sërish.**

0000000. **KONTROLLI I PLOTË (v150 = 1.4.1)**: zvarritësi `zv2.js` (416 klikime, tel + PC, e çelët + e errët; shtuar
   cil-njoftimet, ekipa-kerko, ekipa-zile; `zv-lib.js KONTROLLO` tani i kalon elementet me `visibility:hidden`, që
   jepnin alarme të rreme për dritaret e mbyllura jashtë ekranit), `tur-errët.js` (pamje me llogari, 2 tema), lint,
   krejt testet e regresionit. Rregullime:
   - Kërkesat `kerkese-heqje` të pakryera s'shënohen të lexuara kur hapet lista (mbeten te zilja deri "E hoqa");
     `kryeresiIKerkeses(nj)` (njoftimi im `kryer` ose feed `kerkese-kryer` me të njëjtin `kerkeseId`) → "✓ E hoqi X";
     `numriNjoftimeve` s'i numëron kërkesat e kryera nga një koleg.
   - Tel: `.ek-pllakat/.ek-pult-pllakat` me `flex-wrap` + padding më i vogël (në 375px "Statistika" pritej).
   - PC: `#ekPultTabela` kolona anësore më të ngushta (emri i produktit kishte ~80px; "Furnizuesi" pritej).
   - Tel: lidhja e shkarkimit (Excel) `display:none`; hoqa `NGJYRAT_FOLDERAVE` të papërdorur.

0000000. **NJOFTIMI DITOR NË ORËN E ZGJEDHUR + PA PROVË (v149 = 1.4.0)**:
   - Hoqa "Dërgo njoftim provë" (butoni, `provoPush`, rruga `/prove` te Worker-i); hapat e orës s'e përmendin më.
   - Telefoni, Cilësimet → Njoftimet: "Përmbledhje çdo ditë" (`#njDitor`) + "Ora e njoftimit" (`#njOra`, çdo 15 min, 96
     opsione; parazgjedhur 08:00, ora e zgjedhur mbahet te `stoku:orari:ora-zgjedhur`). Kërkon leje njoftimesh + hyrje.
   - `ekipa.js` cloud: `vendosOrarin({aktiv, ora})` → POST `/orari` {aktiv, ora, tz (Intl), platforma, pajisja (abonimi
     push)}; `orariIm()` (LS `stoku:orari`, për uid-in aktual); `dergoAfatetPerOrarin(afatet)` → POST `/orari` {afatet:
     [{e,b,d}]} (pa të hequrat; vetëm kur ndryshon hash-i ose 1 herë/ditë; thirret te `kontrolloNjoftimet`). `caktivizoPush`
     (dalja) e fik orarin e pajisjes. `aktivizoPush` e rinovon orarin kur ndryshon endpoint-i.
   - `njoftimet.js vendosOrarin(aktiv)` (IndexedDB 'orari'): me orar aktiv `kontrollo()` s'nxjerr njoftimet e menjëhershme
     për afatet (as nga periodicsync), që të mos dalin në orë të rastit.
   - Worker: POST `/orari` (token i VERIFIKUAR RS256) → KV (i njëjti binding `FOTO`): `orari:{uid}:{hash endpoint}`
     {uid, ora, tz, platforma, pajisja}, `orari-indeksi` {celes: {ora, tz, dita}}, `orari-afatet:{uid}`. `scheduled()`
     (Cron Trigger "0,15,30,45 * * * *", e shton PËRDORUESI te Cloudflare): për çdo orar, kur ora lokale (tz) është
     brenda [ora, ora+60 min) dhe s'është dërguar sot → `njoftimiDitor(afatet, sot)`: "Kos ka skaduar. Hiqe nga rafti." /
     "3 produkte kanë skaduar: A, B, C. 2 skadojnë këtë javë." (asgjë kur s'ka); 404/410 → orari fshihet. URL: afatet.
   - Testet: `orari-test.js` (UI + thirrjet), `wp/orari-prova.mjs` (Worker-i: tekstet, zona kohore, cron, 410).
   - Kufizim: kopja e afateve te serveri rifreskohet nga telefoni me orar (kur hapet/ndryshon); ndryshimet e bëra vetëm në
     PC arrijnë kur telefoni hapet herën tjetër.

0000000. **KËRKO HEQJE: ZGJEDHJE NGA LISTA (v148 = 1.3.1)**: pa fushë teksti; `ekipa.js zgjedhesIKerkeses(rrenja, burimet,
   kurNdryshon)` (tabet "Të skaduarat" = afatet e mia me statusi 'skaduar', "Produktet e mia" = stoku; kërkim + shenja,
   maks 30). Kërkesa ka `produktet: [{ produkti, barkodi, data }]` (produkti/barkodi = i pari, për të vjetrat);
   `listaEKerkeses(k)`, `rreshtiIProduktit(x)`; teksti me disa: "3 produkte (A, B, C)". Te njoftimet del lista
   `.ek-nj-produktet`. Worker: `vleraNga` lexon edhe `arrayValue`; teksti i push-it me listën. `kerkesaNgaTeksti` u hoq.
   **Kodi i Worker-it duhet ngjitur sërish** (pa të, push-i për disa produkte tregon vetëm të parin).

0000000. **KËRKO HEQJE NGA RAFTI (v147 = 1.3.0)**: çdo anëtar i kërkon një kolegu (ose krejt ekipës) ta heqë nga rafti
   një produkt, edhe pa afat në Stoku. S'ka rregulla të reja Firestore (përdor ekipa_feed + perdoruesit/{uid}/njoftimet).
   - `ekipa.js` cloud: `kerkoHeqjen(k, listaUid)` → `ekipa_feed` {lloji:'kerkese-heqje', produkti, barkodi, shenim, perUid,
     perEmri} + njoftim te secili marrës {lloji:'kerkese-heqje', kerkeseId, perKrejt}; `kryejKerkesen(nj)` → njoftimi i vet
     {kryer:true} (setDoc merge), njoftim te kërkuesi {lloji:'kerkese-kryer'} + feed {lloji:'kerkese-kryer', kerkuesUid}.
     Pas shkrimit të feed-it me lloji `kerkese-*` → push `/kerkese {id}`. Kontrolluesi: `koleget()`, `kerkoHeqjen`,
     `kryejKerkesen`. `kerkesaNgaTeksti(tekst, produktet)` (emri / barkodi / "Emri · barkodi" → produkt i njohur).
     Njoftimi lokal i sistemit për `kerkese-*` s'del kur push-i është aktiv (`vetemNePerpara`), si te chat-i.
   - Worker: `POST /kerkese {id}`: lexon ekipa_feed/{id} me tokenin e dërguesit, kërkon uid = dërguesi, lloji kerkese-*,
     koha < 3 min; marrësit: perUid ose krejt përveç dërguesit; "u krye" → vetëm kerkuesUid. URL: tel
     `./index.html#ekipa-njoftimet`, PC `./pc.html#/ekipa/njoftimet` (edhe chat-i tani `#ekipa-chat`). sw.js: pamja
     'njoftimet' → hapet Ekipa + dritarja e njoftimeve (tel `hapEkipenNgaNjoftimi`, PC mesazhi + hash në nisje).
     **Kërkon që përdoruesi ta ngjisë sërish kodin e Worker-it** (pa binding të ri); pa të, njoftimi brenda aplikacionit punon.
   - Telefoni: karta `#ekKerkoHeqje` te pulti i Ekipës, `#dlgKerkese`; PC: butoni "Kërko heqje" te koka e Ekipës.
     Te Njoftimet: "E hoqa nga rafti" / "✓ E hoqe nga rafti". Testet: `kerkese-test.js`, `wp/kerkese-prova.mjs`.

0000000. **PA IKONË TE VERSIONI (v146 = 1.2.2)**: hoqa ikonën e Stoku-t te fundi i Cilësimeve (tel `.ops-fundi`,
   PC `.ops-versioni`); mbeti vetëm "Stoku 1.x.x".

0000000. **HAPJA PA "DUKE HYRË SI…" (v145 = 1.2.1)**: në Android (PWA e instaluar) pas splash-it të sistemit (ikona e
   madhe në `background_color`, s'mund të hiqet) dilte edhe karta e portës "Duke hyrë si X…" → dukej si dy ekrane.
   Tani `porta.js`: nëse `stoku:porta:hyrja.uid === stoku:pronari-uid`, porta fshihet menjëherë (pa animacion) dhe
   `stoku-porta-hapur` dërgohet pas `load` (që dëgjuesit e faqes të jenë regjistruar). Firebase konfirmon në sfond:
   pa përdorues → `hap()`; llogari tjetër → pastrim + rinisje (si më parë). Pas "Dil" hyrja fshihet → porta del normalisht.
   Test: `porta-shpejt.js`.

0000000. **IKONAT E FOLDERAVE + LOGOJA PA DRIDHJE (v144 = 1.2.0)**:
   - `afatet.js`: `IKONAT_FOLDERAVE` (16 ikona, `d` = path-at SVG, `ngj` = klasa `.ngj-*`), `ikonaEFolderit(f)` (`f.ikona` ose
     sipas emrit me regex, përndryshe "kutia"), `svgEIkones(ik, masa)`, `zgjedhesIIkonave(cont, emriFn)` (rrjetë radio;
     sugjeron sipas emrit derisa përdoruesi zgjedh me dorë). Folderi ruan `ikona` (opsionale; undefined s'ruhet).
     `bashkimi.js eNjejte` përfshin `ikona` (që ndryshimi i ikonës të rivizatohet te pajisja tjetër).
   - Telefoni: `.folder-ikona` në vend të katrorëve me ngjyrë; "Folder i ri" ka `#dlgFolderIkonat`. PC: `.sbp-fik` te
     anësorja; `#dlgFolder` ka `#flIkonat` edhe për "Ndrysho emrin / ikonën…" (ish "Riemërto…"). Telefoni s'ka ende
     ndryshim të folderit ekzistues. Ngjyrat e tjera të folderave në PC (çipat, shiritat) mbetën si ishin.
   - Logoja dridhej në hapje: (1) `#titulli` "STOKU" ishte i dukshëm derisa `renderFolderat` e fshihte (shtynte logon
     51px) → tani `display:none` në HTML; (2) teksti kalonte "Vetëm në këtë telefon" → emri → tani skript inline lexon
     `stoku:porta:hyrja.emri` menjëherë, dhe teksti i parazgjedhur vendoset vetëm kur `authGati` pa përdorues
     (`emriNeKrye()` tel, `rifreskoLlogarine` PC); (3) `.stk-etiketa` gjerësi fikse 152px; preload JetBrains Mono.
     Test: `ikonat-test.js` (mat pozicionin/tekstin e logos çdo frame gjatë 3 s).

0000000. **MË MBAJ MEND EMRIN (v143 = 1.1.2)**: porta (`porta.js`) ka kutinë `#pkMbaj` "Më mbaj mend emrin e përdoruesit"
   (e shënuar si parazgjedhje). `stoku:porta:mbaj-emrin` = '0' kur hiqet shenja → `stoku:porta:emri` fshihet menjëherë
   dhe s'shkruhet më (as te hyrja, as te `kontrollo`). Fjalëkalimi s'ruhet kurrë. Test: `mbaj-test.js`.

0000000. **LOGOJA NË KRYE (v142 = 1.1.1)**: varianti nr 14 "Etiketë barkodi" (zgjedhur nga 20 në Claude Design):
   `.stk-etiketa` te `css/stoku-tokens.css` (e përbashkët tel + PC): STOKU 18/800, barkodi SVG (shufra `currentColor`,
   një `--stk-qelibar`), poshtë emri i përdoruesit me JetBrains Mono. Telefoni: `#logoSlika` (teksti `#sbDyqani`);
   PC: `#logo` (teksti `#sbpBrandNen`: emri ose "Stoku dhe afatet"). Ikona e jashtme e aplikacionit s'preket.

0000000. **FOTOT E PROFILIT (v141 = 1.1.0)**, pa Firebase: ruhen te Cloudflare KV përmes të njëjtit Worker `stoku-push`.
   - Worker-i (`worker/stoku-push.js`): binding KV me emrin `FOTO` (namespace `stoku-foto`, e krijon PËRDORUESI te
     Cloudflare). `GET /foto/{uid}?v=koha` publike (uid s'merret me mend; me `?v=` cache 1 vit, immutable),
     `GET /fotot` → `{uid: koha}` (çelësi KV `indeksi`), `PUT /foto` (trupi = fotoja, maks 150KB, JPEG/PNG/WebP nga
     bajtët e parë), `DELETE /foto`. Tri të fundit kërkojnë `Authorization: Bearer <ID token>`, që Worker-i e VERIFIKON
     vetë (RS256 me çelësat publikë të Google `securetoken@system`, `iss/aud = stoku-appi`, `exp/iat`) → uid = `sub`;
     secili ndryshon vetëm foton e vet. Pa binding → 500 `mungon-kv`. GET `/` tregon `fotot: true/false`.
   - Klienti (`ekipa.js`): `StokuEkipa.Fotot` (moduli): `apliko(el, {uid, emri} | emri)` vendos `data-foto-uid/-emri`,
     klasën `.me-foto` dhe `background-image` (shkronja mbetet poshtë, `color: transparent`); `riapliko()` kur ndryshon
     indeksi ose harta emër→uid (nga `degjoAnetaret`). Indeksi + emrat te localStorage (`stoku:fotot:*`).
     `pergatit(file)` → katror 256×256 (prerë në mes), JPEG 0.82 (~10KB). Cloud: `rifreskoFotot()` (në hyrje dhe kur
     faqja bëhet e dukshme, maks 1 herë / 10 min), `ngarkoFoton(file)`, `hiqFoton()`. Ngjarja `stoku-fotot-ndryshuan`.
   - Telefoni: Cilësimet → Llogaria "Shto foto / Ndrysho foton / Hiq foton" (+ klik te avatari); avatarët: karta e
     profilit, Llogaria, `ekAvatar`, `ekAv`. PC: Llogaria rreshti "Fotoja e profilit"; `#sbpAvatar`, `#opsNavAv`,
     `#opsLlAv`, `ekAvatar`. Testet: `foto-test.js` (Worker i simuluar, tel + PC), `wp/foto-prova.mjs` (Worker-i real).

0000000. **ADMINI NGA LLOGARIA (v140 = 1.0.2)**: përdoruesi s'mund të bënte asgjë si admin (s'fshinte llogari etj.) —
   admini njihej VETËM nga `perdoruesit/{uid}.emri == 'mendurberisha'` (fushë që vendoset vetëm nga Console, që
   te ai mungonte). Tani: ekipa.js `eshteAdmin()` → true nëse emri i llogarisë (email-i i hyrjes) është
   `mendurberisha`, përndryshe si më parë; lista e anëtarëve/kërkesave e njeh adminin edhe nga `perdoruesi`. Rregullat:
   `eshteAdmin()` = `request.auth.token.email == 'mendurberisha@stoku-app.local' || ...data.get('emri','') == ...`
   (email-i s'falsifikohet; `perdoruesi` mbrohet nga rregullat). Emulatori `fs-server.js` njësoj. Testet:
   `ekipa-admin-paemri-test.js`, `fshirja-v116-paemri.js`, `kerkesat-v115-paemri.js` (admin pa fushën `emri`).

0000000. **ZGJEDHJA E TEKSTIT (v139 = 1.0.1)**: telefoni — `html.sb body` ka `user-select: none` + `-webkit-touch-callout:
   none` (shtypja e gjatë zgjidhte krejt faqen, foto e përdoruesit); zgjidhen vetëm `input/textarea/select`,
   `.artikull .emri/.kodi`, `.sb-row__name/__code`, `.kodi-dialog`, `.ek-mesazh .flluska` (inputet DUHET të kenë `text`,
   përndryshe iOS s'lejon shkrim). Kartat e afateve mbeten pa zgjedhje (shtypja e gjatë = zgjedhje e shumë afateve).
   PC — `none` vetëm te anësorja, butonat, KPI, titujt, filtrat, dialog-krye; tabela ishte tashmë pa zgjedhje teksti
   (barkodi kopjohet nga dritarja e produktit). Testet: `zgjedhja.js`, `zg3.js` (scratchpad).

0000000. **FURNIZUESIT TE CILËSIMET (v137 = Stoku 1.1)**, vetëm për `mendurberisha` (kontroll me emrin e llogarisë së kyçur;
   të dhënat janë të dyqanit lokal, s'ka rrezik sigurie): telefoni — kategoria "Lista" u quajt "Stoku" (`tabLista`),
   seksioni `#furnSeksion` (lista `#furnLista`, kërkimi `#furnKerko` vetëm me 8+ furnizues, editim në rresht); PC —
   Cilësimet → Stoku, karta `#opsFurnSeksion` (`#opsFurnLista`, `#opsFurnKerko`, Enter = ruaj, Escape = anulo vetëm
   editimin). Logjika e përbashkët te afatet.js: `listaEFurnizuesve(afatet, produktet)`, `furnizuesiEkzistues(lista, emri,
   pervec)` (pa dallim shkronjash), `riemertoFurnizuesin(...)` (afatet: `ndryshuarSe = tani`; produktet: `prekurSe + 1`
   që të fitojnë sinkronizimin pa u ngjitur te "Ndryshuar së fundi"). Bashkimi (emër që ekziston pa dallim shkronjash)
   pyet me `konfirmo` dhe të dy grupet marrin saktësisht emrin e shkruar. Testi: `furn-test.js` (scratchpad).

0000000. **EMRI I VERSIONIT (MAJOR.MINOR.PATCH, nga v138 = "Stoku 1.0.0")**, me kërkesë të përdoruesit: çdo hyrje e re
   te teRejat.js ka fushën `versioni` ("1.0.1"); `emriVersionit(v)` e merr nga hyrja me atë `v` (hyrjet pa `versioni`,
   para 1.0.0, shfaqen vetëm me datë). RREGULLI për hyrjet e ardhshme: rregullim i vogël/gabim/tekst → rrit të fundit
   (1.0.0 → 1.0.1); diçka e re që përdoret → rrit të mesit dhe i fundit 0 (→ 1.1.0); ndryshim i madh i krejt
   aplikacionit → 2.0.0. Hyrjet tel + pc me të njëjtin `v` kanë të njëjtin `versioni`. Gjithmonë i thuhet përdoruesit
   cili version u bë. Historia: v135 "2.9" dhe v136/v137 "1.0"/"1.1" (numra të shkurtër) u zëvendësuan nga kjo skemë.
   Numri i brendshëm (`v`, CACHE, `?v=`) vazhdon si më parë për përditësimet.

0000000. **PA "SASI E ULËT" (v134)**, me kërkesë, telefon + PC: u hoq krejt koncepti 1–5 copë (`eshtePak`, `ops.pragu`,
   `PRAGU_PAK`, filtri `data-f="pak"`, KPI, ngjyra portokalli `.pak`/`--near`/`sasia--pak`). Mbetet vetëm "Sasi 0" (e kuqe).
   PC: karta "Sasia më e ulët" → **"Pa stok"** (`#permbTeUleta`, sasi 0, më të ndryshuarat lart, numri te `#permbPaStokNr`,
   "Shih të gjitha" → filtri `zero`); 3 KPI. Telefoni: karta e kryefaqes ka [Folderat, Sasi 0, Të skaduara] (afatet e
   skaduara + pa datë, nga `StokuAfatet.numero(afatet)`). Renditja "Sasia: nga më e vogla" mbetet (s'është "sasi e ulët").

0000000. **ANËSORJA E PC-SË (v133)**, me kërkesë: u hoq ⚙ te karta e llogarisë (rreshti "Cilësimet" i anësores mori id-në
   `#btnOpsione`); u hoq `#btnImport` ("Importo nga Excel / CSV") nga `.anesore-fund` (importi i stokut: menyja e
   folderit "Importo në këtë folder…" + Ctrl+I); u hoq cilësimi "Kufiri i sasisë së ulët" (`#opsPragu`) — `ops.pragu`
   mbetet fiks 5 (si `PRAGU_PAK` te telefoni), vlera e ruajtur injorohet.

0000000. **"E MADHE" NË PC + BUTONI CILËSIMET (v132)**: me `madhesia: 'e_madhe'` pc.html vinte `zoom: 1.12` te `body` →
   `.trupi` (100dvh) bëhej 12% më e lartë se ekrani; `body` ka `overflow: hidden`, prandaj kur fokusi kthehej te butoni
   poshtë (p.sh. pas mbylljes së Cilësimeve) shfletuesi e zhvendoste faqen lart dhe s'kishte kthim me scroll (foto e
   përdoruesit: pa logo/kërkim, KPI të prera). Tani zoom-i vendoset te `.trupi > aside`, `.trupi > main`, `.mbulese > *`,
   `.toast` (JO te body dhe jo te `.menu`, që pozicionohet me koordinatat e mausit); anësorja 296/278/260/246px me
   E madhe; `.ops-dlg` lartësia `min(700px, 92vh - 24px)` (me E madhe ndahet me 1.12). Telefoni s'e kishte problemin
   (faqja = ekrani, u mat). Zvarritësi (`zv-lib.js`) kontrollon tani edhe "faqja më e lartë se ekrani" dhe `scrollY > 0`.
   PC: rresht "Cilësimet" (`#btnCilesimetAnes`) te `.anesore-fund`, pranë ikonës ⚙ te karta e llogarisë.

0000000. **APPLE WATCH (v131)**: iPhone (iOS 16.4+, Stoku i shtuar në ekranin bazë nga Safari) merr Web Push nga i njëjti
   Worker; Apple Watch i pasqyron vetë (Watch → Njoftimet → "Mirror iPhone Alerts From" → Stoku). Ndryshime: JWT VAPID
   me afat 1 orë (Apple refuzon afat të gjatë; ruhet deri 10 min para skadimit); `sw.js` në Apple (iPhone/iPad/Safari)
   tregon GJITHMONË njoftim për çdo push (përndryshe Apple e anulon regjistrimin); `fetch` pa `keepalive`. Cilësimet →
   Njoftimet: karta "Njoftimet në orë" me `#segOra` (Galaxy Watch / Apple Watch, zgjidhet vetë sipas pajisjes).
   Testi: `sw-push-ios.js` (UA i iPhone-it në nivel shfletuesi, që ta shohë edhe SW-ja).

0000000. **NJOFTIMET PUSH TË CHAT-IT + ORA (v130)**: mesazhet e chat-it vijnë si njoftim edhe kur Stoku është krejt i mbyllur.
   - Serveri: `worker/stoku-push.js` (Cloudflare Worker "stoku-push" → `https://stoku-push.mendurb.workers.dev`), pa varësi.
     Secrets: `VAPID_PUBLIC`, `VAPID_PRIVATE` (VETËM te Cloudflare, kurrë në repo), `VAPID_SUBJECT`. POST `/chat {id}` me
     `Authorization: Bearer <ID token i Firebase>`: lexon `ekipa_chat/{id}` me tokenin e dërguesit (Firestore REST → rregullat
     vlejnë), kërkon `uid` = dërguesi dhe `koha` < 3 min, lexon `ekipa_push` dhe dërgon Web Push (RFC 8291 aes128gcm + VAPID
     RFC 8292) secilës pajisje përveç dërguesit (një herë për endpoint; 404/410 → fshihet). POST `/prove {vonesa}` → vetëm te
     pajisjet e veta (me vonesë deri 10 s, që të fiket ekrani). GET → `{ok, celesat}` (kontrolli i shëndetit).
   - Klienti (`ekipa.js` → krijoCloud): `aktivizoPush()` (me leje: `pushManager.subscribe` me `PUSH_VAPID`, shkruan
     `ekipa_push/{uid}_{hash}`; rishkruan vetëm kur ndryshon ose çdo 7 ditë), `caktivizoPush()` (në dalje), `pushAktiv()`
     (pajisja e regjistruar + Worker-i u përgjigj mirë brenda 7 ditëve — vetëm atëherë hiqet njoftimi lokal i chat-it, pa
     dyfishim; pa Worker punohet si më parë), `provoPush()`. Pas çdo mesazhi të dërguar (edhe nga radha offline) →
     `/chat`. Thirret vetë kur qasja në ekipë është 'ok' dhe pas dhënies së lejes.
   - `sw.js`: `push` → `showNotification` (badge `logo/badge-96.png` monokrom, vibrim, veprimi "Hap chat-in", url sipas
     platformës: pc → `pc.html#/ekipa/chat`); nëse dritarja e Stoku-t është përpara dhe aktive, chat-i s'nxjerr njoftim.
   - Telefoni: Cilësimet → **Njoftimet** (`data-faqe="njoftimet"`): gjendja (Aktive / kur është hapur / të fikura /
     të bllokuara / s'mbështeten), "Aktivizo njoftimet", "Dërgo njoftim provë" (8 s), udhëzimi për Galaxy Watch (Galaxy
     Wearable → Njoftimet → Njoftimet e aplikacioneve → Stoku). Ora i pasqyron vetë njoftimet e sistemit të telefonit.
   - Testet (scratchpad): `push-test.js` (dy përdorues, Firestore i simuluar me rregullat e reja), `sw-push.js` (SW i
     vërtetë, CDP `ServiceWorker.deliverPushMessage`), `wp/prova.mjs` (Worker-i: enkriptimi verifikohet me `http_ece`).

0000000. **KONTROLLI I PLOTË (v129)**: zvarritës automatik (379 klikime në çdo buton, tel + PC) pa asnjë gabim JS, kontroll
   i kontrastit (tel + PC, i çelët + i errët), 23 testet e regresionit në rregull. Rregullime:
   - `.af-sink` (reja e sinkronizimit te Afatet) kishte ende stilin e header-it blu (e bardhë mbi të bardhë) → stil i ri te stoku.css.
   - Te folderi (telefon) sasia 0 = `.sasia--zero` (e kuqe), 1–5 = `.sasia--pak` (portokalli), me `PRAGU_PAK` si te kryefaqja.
   - Faqet e plota të mbyllura (`#dlgOpsione`, `.faqe-e-plote`) marrin `visibility: hidden` (me vonesë pas animacionit):
     Tab-i/skaneri s'futet më në fusha të fshehura.
   - PC: numrat/titujt e anësores me `--sb-muted` (ishin `--sb-faint`, kontrast i ulët).
   - Telefoni: u hoq "Versioni për kompjuter" nga Cilësimet (+ `.lidhje-pc`).

0000000. **CILËSIMET E REJA + AFATET ME NGJYRA (v128)**:
   - U HOQËN "Ngjyra kryesore" (telefon + PC) dhe "Motivi i sfondit" (telefon): markup, CSS, JS dhe `data-aksent`/`data-sfond`
     s'vendosen më (opsionet e vjetra `aksent`/`sfondi` në localStorage injorohen). Stoku ka vetëm blunë e dizajnit.
   - Telefoni (index.html, `#dlgOpsione`): karta e profilit `#opsProfil` (avatari, emri, statusi i sinkronizimit), grupe
     si karta (`.ops-grupi`, `.ops-grupi-titull`) me ikona me ngjyrë (`.ngj-blu/vjollce/portokalli/gjelber/roze/gri/kuqe`,
     tokenat `--sb-ic-*` te stoku-tokens.css), "Çka ka të re" (`#opsTeRejat`, 6 versionet e fundit) dhe versioni në fund.
     Pamja: shembull i një karte afati + tema me mostra (`.ops-tema`/`.ops-mock`) + madhësia "Aa". Skenimi: rreshta me
     ikonë dhe shpjegim. Lista: rreshta me rreth (`#rendiLista`) që ndryshojnë select-in e fshehur `#opsRendi`.
     Llogaria: avatari + statusi, emri/fjalëkalimi në një kartë, "Dil nga llogaria". `rregulloVijatNdarese()` punon
     edhe brenda `.ops-grupi`. CSS: seksioni "Cilësimet (v128)" te css/stoku.css.
   - Kompjuteri (pc.html): dialogu `.ops-dlg` (940px): menyja majtas me profil, ikona dhe "Çka ka të re"; faqet me
     titull + karta; tema/dendësia/madhësia me mostra (`.ops-zgjedhje`). CSS te css/stoku-pc.css.
   - Afatet: kartat e telefonit dhe rreshtat e tabelës në PC kanë ngjyra të lehta sipas statusit (tokenat
     `--sb-card-exp/near/ok/rem` + `-line`).
   - CSS `?v=2`, CACHE `stoku-v128`.

0000000. **LOGO BARKODI (v127)**: logoja "S me pikë" u zëvendësua me barkodin (nr. 5 nga 20 propozimet): katror
   `#14161b`, 8 vija të bardha, vija e 5-të e verdhë `#f5b942`, plus një vijë e hollë e bardhë (16%) rreth katrorit që
   të duket në temën e errët (jo te PNG-të e aplikacionit). Krejt `logo/` + `icon-192/512.png`, `apple-touch-icon.png`,
   `logo.png` u rikrijuan; referencat kaluan në `?v=3` (index, pc, manifest, sw.js SHELL, porta.js?v=119,
   njoftimet.js?v=119). Fjala "stoku" në `stoku-logo(-dark).svg` mbeti e njëjtë.

0000000. **PAMJA E RE (v126), nga Claude Design ("Stoku Premium" / "Stoku PC", paketa "stoku_publikimi"), DIREKT te
   Stoku (telefon + kompjuter). Beta (/beta/, v124–v125) U HOQ me kërkesë të përdoruesit ("Heke beta").**
   - Skedarët: `css/stoku-tokens.css` (fontet Onest + JetBrains Mono nga `fonts/`, ngjyrat e temës së çelët dhe të
     errët: tema e errët = `html[data-tema="dark"]`, që e vendos vetë aplikacioni nga cilësimi Tema; ngjyrat e
     aksentit jo-blu vijnë nga `--primar`), `css/stoku.css` (telefoni, gjithçka nën `html.sb`), `css/stoku-pc.css`
     (kompjuteri, nën `html.sbp`). Ngarkohen PAS stilit të brendshëm dhe e mbishkruajnë atë (variablat e vjetra
     `--sfond`, `--tekst`, `--karta`… marrin vlerat e tokenave). Ngjyrat VETËM nga tokenat `var(--sb-…)`.
   - Logo e re (S me pikë të verdhë): `logo/` (svg + favicon + maskable); `icon-192.png`, `icon-512.png`,
     `apple-touch-icon.png`, `logo.png` u zëvendësuan (me `?v=2` kudo: SW i kopjon skedarët me të njëjtën adresë
     nga cache-i i vjetër, pa `?v` të ri telefonat do mbanin ikonat e vjetra). Hyrja (porta.js) me `logo/stoku-logo(-dark).svg`.
   - Telefoni (index.html): header i çelët me logo katrore + emri i llogarisë (`#logoSlika` = `.sb-brand`); kryefaqja
     `vizatoKryefaqen()` brenda `#folderaLista` (karta e errët me numrat, "Folderat" + "+ Folder i ri", katrori me ngjyrë
     te folderat, "Ndryshuar së fundi"); folderat mbeten rrjetë (zvarritja punon). Afatet: "Fotografo fletën" e madhe +
     galeria, Shto, "Excel" me menu (`#afExcel` → `#afImporto`/`#afEksporto`), filtrat me numra, karta me kutinë e
     ditëve `kutiaEDiteve()` (edhe te Ekipa). "Afat i ri": karta e errët e skanimit (barkodi + emri), datat e shpejta
     (1 javë, 2 javë, 1 muaj, 3 muaj) + "Skadon për N ditë", sasia − / +, "Ruaj afatin"; Anulo lart djathtas.
     Dialogët si "bottom sheet". Pragu "Sasi e ulët" në telefon = 5 (s'ka cilësim).
   - Kompjuteri (pc.html): header-i blu U HOQ; logo + "Kërko kudo" (Ctrl K) në krye të anësores, menyja lëviz
     (`.sbp-menyja`), poshtë: Importo, Shkurtoret, "Tema: E çelët/E errët" (`#sbpTema`, ndërron `ops.tema`) dhe
     karta e llogarisë (`#btnLlogaria` me avatar, `#btnOpsione` ingranazhi, `#sinkStatus`). Përmbledhja: 4 numrat e
     dizajnit (kartela e errët "Produkte gjithsej" + "+N sot", Sasi e ulët, Sasi 0, Të skaduara në raft), 3 kartat.
     Ngjyrat e folderave me radhë `ngjyraEFolderit()`/`folderCip()` (anësore, shirita, tabela). Tabela: sasia me ngjyrë
     (pa "Pa stok"/"E ulët"), filtrat si "chips". Afatet: pa rreshtin e numrave, numrat te filtrat (me pikë ngjyre),
     "Grupo sipas furnizuesit" si çelës, "Shëno të hequr" (butoni i errët). Ekipa: skedat me vijë poshtë.
   - **Kthimi mbrapa** (nëse duhet pamja e vjetër): gjendja para ridizajnit = commit `b66a98b` (main pas PR #66, v125).
     Tag-u `para-ridizajnit` s'u pranua nga proxy-ja e git-it. Kthimi: rikthe skedarët nga `b66a98b` dhe rrit CACHE te sw.js.
   - Mbeti me vendim të përdoruesit: kolona "Ditët e mbetura" (jo "Çfarë duhet bërë" e dizajnit), teksti i afatit
     (pershkrimi) në telefon.
   - /beta/: `beta/index.html` vetëm e kthen te Stoku dhe çregjistron SW-në e betës; `beta/sw.js` fshin cache-t
     `stoku-beta-*`, çregjistrohet dhe i kthen dritaret te `../`. sw.js i rrënjës i fshin krejt cache-t e tjera dhe
     s'e trajton /beta/ (që faqja e ridrejtimit të mos ruhet si index.html).
   - Testet (scratchpad): `tel-shot.js` (BW, TEMA), `pc-shot.js` (PW, PH, TEMA, FAQET), `dlg-shot.js` (krejt dialogët,
     TEMA) + `flete.js` (fletë kontakti), `dizajn-funk.js` (zvarritja, sasia − / +, datat, tema, Ctrl K, KPI),
     `swtest/sw-test3.js` (përditësimi v125 → v126), `sw-root.js` (pa internet), `md-shot.js` (PDA, "E madhe", dendësia),
     `porta-shot.js`. `audit.js` u përditësua (Excel te afatet në PC hap dialogun e muajit; s'ka më "Lajmërova").

000000. **v122, kërkesë e përdoruesit:** Ekipa tregon praninë me IKONA (jo tekst): `EK.praniaIkone()` në ekipa.js
   (telefon/monitor + pikë e gjelbër kur është online; wifi-off gri + koha kur s'është), klasa `.ek-prania.on/.off`
   në të dy faqet. Te telefoni, shkronjat e afateve janë në madhësinë e VJETËR (përdoruesi s'i deshi më të mëdha);
   **v123: edhe NUMRAT u kthyen si para v121** (fonti i zakonshëm, madhësitë e vjetra, telefon + PC); fonti
   `numrat.woff2` (StokuNumrat) u fshi krejt, edhe nga SHELL i sw.js. MOS I RIKTHE fonte/madhësi të reja pa pyetur. Kolona "Çfarë duhet bërë" u bë "Ditët e mbetura" (`AF.ditetEMbetura()` →
   {para, nr, pas}, qeliza `qelizaEDiteve()` në pc.html; "Skadoi para" del si rresht i vogël mbi numrin); nën datë
   s'shfaqen më ditët (përveç Pultit). Nën 1180px fshihet kolona "Statusi" te #afTabela/#ekTabela që emri të mos zhduket.

00000. **Afatet (v121), kërkesë e përdoruesit:** U HOQ krejt lajmërimi i furnizuesit nga UI ("Lajmëro furnizuesin", "…sa më
   parë", butoni "Lajmërova", "Shëno si të lajmëruara", kolonat e Excel-it). MOS I RIKTHE pa pyetur. (Fusha `lajmeruarSe`
   mbetet në të dhënat e vjetra, s'përdoret.) Te v122 u hoqën edhe "Dërgo listën" (tel) dhe "Kopjo mesazhin për
   furnizuesin" (PC), bashkë me `mesazhiFurnizuesit` në afatet.js. MOS I RIKTHE pa pyetur. (Fonti i numrave i v121
   u hoq te v123 me kërkesë të përdoruesit; te PC tekstet e tabelës së afateve mbetën pak më të mëdha.)
0000. **Afatet: importi nga Excel + muajt (v120)**: logjika e përbashkët në `afatet.js`: `muajiNgaEmri` ("Nëntor2" → 11,
   numrat/shenjat harrohen; "Marketi" s'është muaj), `dataNgaQeliza` (serial Excel, tekst, ose vetëm dita + muaji i
   fletës), `hamendesoKolonatEAfateve` (sipas titujve ose përmbajtjes), `planiImportitAfateve` (ekzistuese = i njëjti
   barkod/emër + datë, kalohen; të përsëriturat bashkohen, sasitë mblidhen), `afatetNgaPlani`, `muajtELista`,
   `celesiMuajit`. PC: `#afBtnImport` → `#dlgAfImport`, filtri `af.muaji` (`#afMuajt`), eksporti `#dlgAfEksport`.
   Telefon: `#afImporto`/`#afEksporto`, `afMuaji`, `#dlgAfImport`, muaji te `#dlgAfExcel` (`axKrejt`). Filtri i
   muajit është sipas DATËS SË SKADIMIT (jo foldera). Testet: `import-af-njesi.js`, `import-af-pc.js`, `import-af-tel.js`.
000. **"Çka ka të re" (v119)**: shfaqet me `tregoTeRejatKurGati()`: jo kur faqja është në sfond, jo kur një service
   worker po instalohet (pret rifreskimin); shënohet si e parë (`stoku:te-rejat:pare`) VETËM kur dritarja mbyllet
   (MutationObserver te `#dlgTeRejat`), jo kur shfaqet. Më parë rifreskimi i përditësimit e zhdukte dhe s'dilte më.
   Testi me service worker real: `swtest/sw-test2.js` (scratchpad, server në portin 8766).
00. **Tabelat e PC-së me `table-layout: fixed`**: kolona e emrit s'ka gjerësi, merr çka mbetet. Nëse kolonat fikse
   i kalojnë gjerësisë së tabelës, emri ZHDUKET pa asnjë gabim (ndodhi te 1024–1280px, v118). Kur shton kolonë
   fikse, kontrollo me `skano-gjeresi.js` (scratchpad, `GJ=1024,1280,1366`) dhe shto rregull te blloqet
   `@media (max-width: 1440/1366/1180px)` në fund të stilit të pc.html. Rrjetet (grid) me `minmax(0, 1fr)`, jo `1fr`.

1. **Cache-busting është MANUAL dhe i domosdoshëm.** Kur ndryshon një skedar JS të përbashkët
   (`afatet.js`, `bashkimi.js`, `ruajtja.js`, `porta.js`, `njoftimet.js`, `teRejat.js`, `xlsx.js`), duhet
   me dorë:
   - të rrisësh numrin `?v=NN` te çdo `<script src="...">` që e ngarkon (index.html, pc.html) **dhe**
     te lista `SHELL` në `sw.js` **dhe** te `importScripts(...)` në krye të `sw.js` nëse skedari importohet
     atje (afatet.js dhe njoftimet.js importohen nga sw.js).
   - të rrisësh `var CACHE = 'stoku-vNN'` në `sw.js` (numri kryesor i versionit të krejt aplikacionit).
   - **NUK duhet të harmonizosh numrat `?v=` të skedarëve të ndryshëm me njëri-tjetrin** — secili ka
     numrin e vet, i pavarur nga numri i CACHE dhe nga numrat e skedarëve të tjerë. P.sh. tani (shih
     `git log` për numrin aktual) CACHE mund të jetë v9x ndërsa `xlsx.js?v=58`, `bashkimi.js?v=81`, etj.
     Kontrollo numrat AKTUALË me `grep -n "CACHE = \|\.js?v=" sw.js index.html pc.html` para se të fillosh,
     mos supozo bazuar në këtë skedar (mund të jetë vjetëruar).
   - Nëse harron ndonjë nga këto, telefonat/kompjuterat me app-in e instaluar (PWA) do të vazhdojnë të
     përdorin kopjen e vjetër të ruajtur, sepse service worker-i shërben nga cache.

2. **Përditësimi automatik (që nga versioni ~91):** aplikacioni tani e kontrollon vetë në sfond (në hyrje,
   kur rikthehesh në skedë, dhe çdo 30 min) a ka version të ri të `sw.js`. Nëse ka, e shkarkon dhe **rinis
   vetë faqen** në çastin e parë të qetë (pa dialog të hapur, pa fushë ku po shkruhet, pa ruajtje në cloud
   në pritje) ose sapo kalon në sfond. **Kjo do të thotë: pas çdo merge në `main`, brenda ~10 minutash
   (koha e cache-it HTTP të GitHub Pages) çdo pajisje e hap vetë versionin e ri, pa u dashur me e mbyllë
   dhe rihapë me dorë.** Kjo ishte kërkesë eksplicite e përdoruesit (s'donte "background sync" për vetë
   idenë e sfondit — donte thjesht mos me pritë deri sa cache të skadojë vetë).

3. **"Çka ka të re" (teRejat.js):** sa herë shton një ndryshim që ia vlen përdoruesi ta dijë (veçori e re,
   përmirësim i dukshëm), SHTO NJË HYRJE në krye të `LISTA` në `teRejat.js`, me `v` = numri i ri i CACHE,
   `data`, `titulli` i shkurtër, dhe `pikat` — fjali të thjeshta për punëtorë/menaxhere, jo teknike, në
   shqip. Kjo shfaqet automatikisht si dritare "Çka ka të re" në hyrje të parë pas versionit të ri.
   **Që nga v109: `platforma: 'tel'` ose `'pc'`** te hyrjet që vlejnë vetëm për njërën (p.sh. "Kompjuteri: …"
   → `'pc'`); pa `platforma` = të dyja. Telefoni thërret `teRejatPas(v, 'tel')`, PC-ja `teRejatPas(v, 'pc')`
   — kërkesë e përdoruesit: "në telefon mos i shfaq të rejat e PC-së, dhe anasjelltas".

4. **Firebase (projekti `stoku-appi`):**
   - Auth me emër përdoruesi (jo email): shndërrohet vetë në `emri@stoku-app.local` për Firebase Auth,
     përdoruesi kurrë s'e sheh/shkruan email.
   - Firestore, `initializeFirestore(app, { ignoreUndefinedProperties: true })`.
   - **Sharding:** dyqani (produktet + afatet) NUK është në një dokument të vetëm (kufiri 1MB i Firestore),
     por i ndarë: `dyqane/{uid}` (kryesori: foldera, fshira, rendiKoha, numri i pjesëve) +
     `dyqane/{uid}/pjeset/p0..pN` (produktet/afatet, ~600KB/pjesë). Logjika është në `ruajtja.js`.
     Kompatibël prapa: dokument i vjetër (para sharding) lexohet dhe migrohet vetë.
   - `dyqane/{uid}/fletet` — fletët e fotografuara në telefon, dërguar për kontroll në PC (jo hapen
     automatikisht, del si njoftim/kartë).
   - Rregullat e Firestore i mban dhe i vendos vetë përdoruesi (unë s'kam akses direkt); duhet lejuar
     nënkoleksioni `pjeset` dhe `fletet`, plus rregulla ekzistuese për `perdoruesit/{uid}` dhe admin
     (`mendurberisha`). **Mos i propozoj kurrë rregulla që heqin admin-in ose `perdoruesit`.**
   - **Që nga "Ekipi" (v105):** klienti SHKRUAN vetë te `perdoruesit/{uid}` (`{perdoruesi, kycurSe}` — kurrë
     `emri`) në çdo `regjistrohu`/`hyr`/`onAuthStateChanged` (pa dyfishim: `regjistroPerdoruesin` mban një
     premtim për uid, v110).
   - **Që nga v110 dyqani (`dyqane/{uid}` + `pjeset`) lexohet sërish VETËM nga pronari dhe admin-i.** Kolegët
     s'e lexojnë më stokun e tjetrit: Ekipa lexon `ekipa_afatet/{uid}` (përmbledhje vetëm e afateve, shih pikën 10).
     Shih rregullat aktuale në fund të këtij skedari.
   - **ruajtja.js (v110):** një pjesë rishkruhet vetëm nëse ndryshoi — krahasimi bëhet me `pjesaKanonike()`
     (fushat e renditura + listat pa rend), sepse Firestore i kthen fushat me rend tjetër nga objekti lokal
     (me `JSON.stringify` çdo sinkronizim i rishkruante KREJT pjesët dhe çdo pajisje i shkarkonte sërish).
     Leximet e pjesëve në transaksion bëhen njëkohësisht (`Promise.all`).
   - **S'kam Firebase real as pajisje reale për testim.** Krejt testimi bëhet me Playwright + mock
     `window.__stokuCloud` (shih "Testimi" poshtë).

5. **Bashkimi i të dhënave (bashkimi.js):** LWW (last-write-wins) sipas kohës (`prekurSe`/`ndryshuarSe`);
   fshirjet ruhen si "tombstones" (kohë fshirjeje) 120 ditë, që një pajisje me kopje të vjetër të mos
   "ringjallë" diçka të fshirë; asgjë që thjesht mungon (pa u fshi qëllimisht) s'fshihet kurrë.
   **Pastrimi (v113):** `bashko()` i pastron vetë hyrjet (`pastroFolderat`/`pastroProduktet`/`pastroAfatet` — rreshtat
   null/pa id hiqen, sasia tekst → numër, barkodi numër → tekst); faqet i përdorin edhe kur lexojnë localStorage dhe
   kur marrin gjendjen e cloud-it "ashtu siç është" (pajisje e re). Më parë një `null` te folderat e rrëzonte telefonin.
   Testi: `fuzz-te-dhena.js` (scratchpad). "Dil" pa internet paralajmëron (porta i fshin të dhënat lokale kur hyn
   llogari tjetër).
   Dy ndryshime të njëkohshme të sasisë së TË NJËJTIT produkt nga dy pajisje: fiton më i riu (s'mblidhen) —
   vendim i qëllimshëm (bashkimi me 3 anë do të kërkonte "bazën" për çdo produkt dhe rrezikon dyfishime).
   **Dëgjuesi i cloud-it (v110, tel `__remoteNePritje` / PC `sink.remoteNePritje`):** një gjendje nga cloud-i
   që mbërrin ndërsa ruajtja jonë është në rrugë NUK hidhet më — ruhet dhe bashkohet sapo mbaron ruajtja
   (më parë ndryshimi i një pajisjeje tjetër, i ruajtur menjëherë pas nesh, s'shfaqej deri në ndryshimin e
   radhës). Kur pret vetëm kohëmatësi i ruajtjes, gjendja e cloud-it bashkohet menjëherë (bashkimi s'humb
   asgjë lokale). Testi: `sink-pritje.js` (scratchpad).

6. **Porta (porta.js):** ekran hyrjeje i detyrueshëm para faqes kryesore (telefon dhe PC). Lejon punë pa
   internet vetëm nëse kjo pajisje ka hyrë më parë. Kur hyn një llogari tjetër në të njëjtën pajisje, të
   dhënat lokale të llogarisë së mëparshme hiqen (janë të ruajtura në cloud-in e saj).
   **v115 ("userat s'po mund të kyçen"):** Firebase v12 kërkon ES2020 (Chrome/WebView 80+, Safari 13.1+) —
   në shfletues të vjetër moduli s'ngarkohet fare; porta e zbulon (`SHFLETUES_I_VJETER`, provë me `?.`/`??`)
   dhe thotë "përditëso Chrome / Android System WebView", jo "s'ka internet". Kur Firebase vonon (>7 s),
   mesazhi është "lidhja po zgjat" dhe "Hyr" PRET deri 25 s (`pritCloudin`) në vend që të dështojë menjëherë.
   Gabimet e panjohura tregojnë kodin (p.sh. "(auth/…)") që përdoruesi ta raportojë. Nëse shkrimi i
   `stoku:pronari-uid` dështon (memoria plot) gjatë ndërrimit të llogarisë, pronari zbrazet → pa rifreskime
   pa fund. Testi: `porta-v115.js` + `porta-test.js` (scratchpad). Kujdes: me rregullat v110+ një llogari e re
   HYN normalisht, por Ekipa i thotë "Në pritje të miratimit" derisa administratori ta pranojë — v115 i tregon
   adminit një baner "X pret miratimin · Prano" në krye të Pultit (tel + PC). Migrimi (një herë) tani i pranon
   krejt llogaritë që mungojnë, jo vetëm kur `ekipa_anetaret` është bosh. Testi: `kerkesat-v115.js`.

7. **Butoni "mbrapa" i Android-it / historia e shfletuesit** (index.html): çdo "shtresë" e hapur (folder,
   dialog, kamerë, tab) i shton një hyrje historisë; "mbrapa" mbyll vetëm shtresën e fundit, kurrë s'del
   nga app-i. Logjika: `niveletEHapura()`, `sinkronizoHistorineEDritareve()`, `ANULO_SIPAS_DIALOGUT`.
   Kur shtohet një dialog/tab i ri, duhet përfshirë në këtë logjikë (shiko si janë `dlgTeRejat`,
   `dlgNjoftimet` etj. në `ANULO_SIPAS_DIALOGUT`).

8. **Shiriti me tabe (telefon, që nga v90; 4 tabe që nga v105):** navigimi kryesor në telefon tani është
   4 tabe poshtë ekranit (Stoku / Afatet / Ekipi / Cilësimet), jo butona në kokë. Shiriti fshihet
   automatikisht brenda një folderi, te kamera, te leximi i fletës, dhe kur një fushë ka fokusin
   (tastiera hapur). Shiko `#tabet` në CSS/JS të index.html nëse ndryshon navigimin.

9. **"Opsionet" quhet tani "Cilësimet"** (që nga v90) — mos e kthe mbrapsht pa u pyetur.

10. **"Ekipa" (v105 si "Ekipi"; rindërtuar krejt në v109; siguria në v110).** Tab/seksion për llogaritë e Stoku-t
    si një ekip i vetëm (s'ka ftesa/grupe — kërkesë eksplicite). **Vetëm afatet, jo stoku** (v109, kërkesë e
    përdoruesit).
    - **Anëtarësia me miratim (v110):** regjistrimi është i hapur për këdo, prandaj një llogari e re e sheh Ekipën
      vetëm pasi ta pranojë administratori (`mendurberisha`) — `ekipa_anetaret/{uid}` (e shkruan vetëm admin-i).
      Llogaria në pritje sheh "Në pritje të miratimit"; stoku/afatet e saj punojnë normalisht. Admin-i sheh
      kërkesat te Ekipa → Anëtarët ("Prano" / "Prano krejt"), shenjë te tabi/anësorja dhe një njoftim; "Hiq nga
      ekipa" (tel: poshtë listës së anëtarit; PC: kolona e fundit te Anëtarët). **Migrimi:** herën e parë që
      aplikacioni i admin-it gjen rregullat e reja dhe `ekipa_anetaret` bosh, i pranon krejt llogaritë ekzistuese
      njëherësh (shënohet `perdoruesit/{admin}.ekipaMigruarSe`, bëhet vetëm një herë). "X u bashkua me ekipën" te
      aktiviteti e shkruan admin-i kur pranon (`anetariUid`/`anetariEmri`), jo më llogaria e re.
      **Me rregullat e vjetra** (para se përdoruesi t'i vendosë): `ekipa_anetaret` s'lexohet → `anetaresia =
      'pa-rregulla'` → gjithçka punon si në v109 (krejt llogaritë = ekipa, afatet nga dyqanet).
    - **`ekipa_afatet/{uid}` (v110):** përmbledhja e afateve të secilit (`permbledhjaEAfateve`: vetëm fushat që
      duhen, afatet në raft + të hequrat e 40 ditëve, ≤700 KB), e publikon pronari pas çdo sinkronizimi të
      suksesshëm (`ekK.publikoAfatet(afatet)`, vetëm kur ndryshon nënshkrimi). Ekipa e dëgjon në kohë reale.
      Koleg pa përmbledhje (s'e ka hapur ende versionin e ri) → provohet dyqani i tij (vetëm me rregullat e
      vjetra/admin); ndryshe "Pa të dhëna ende".
    - **Radha e dërgimit (v110):** aktiviteti, chat-i dhe njoftimet shkruhen me `setDoc` me id të caktuar dhe
      ruhen te `stoku:ekipa:radha:{uid}` derisa serveri t'i pranojë → pa internet s'humbin, edhe nëse
      aplikacioni mbyllet. Rregullat lejojnë vetëm krijimin, kështu një ridërgim i së njëjtës id refuzohet (s'ka
      dyfishime) dhe hiqet nga radha. "Unë e hoqa" pa internet: "njoftohet sapo të ketë internet".
    - **Emrat s'falsifikohen (rregullat v110):** `emri` te aktiviteti/chat-i/njoftimet dhe `perdoruesi` te
      `perdoruesit/{uid}` duhet të jenë = emri i llogarisë (`request.auth.token.email`). Admin-i mund të fshijë
      çdo mesazh të chat-it.
    - Heqja e mbivendosur (`mbivendosHeqjen`) vlen vetëm për afate të SKADUARA — njësoj si `duhetZbatuarHeqja`.
    - **Administratori 100% (v112)** — vetëm `mendurberisha` (`ekK.eshteAdmin()`): (1) pamja "Stoku" (tel: çipi
      `#ekChipStoku`, PC: segmenti `#ekSegStoku`, `#/ekipa/stoku`) — stoku i plotë i secilit, vetëm lexim, + Excel
      (`fletetEStokut`); (2) te afatet e kolegëve: "Shëno të hequr"/"Ktheje"/"Fshije" (`adminNdryshoAfatin` →
      `__stokuCloud.ndryshoDyqaninEPerdoruesit(uid, fn)` = transaksion direkt në dyqanin e tij, `ndryshoAfatinNeGjendje`
      me `ndryshuarSe`/tombstone që bashkimi te pronari ta pranojë; pastaj ripublikon `ekipa_afatet/{uid}` dhe e
      njofton pronarin `lloji:'admin-afat'`); (3) te Anëtarët: leja +/- për secilin (`perdoruesit/{uid}.sasiaShpejte`,
      `false` = e hequr qëllimisht — "fara" me emër s'e rikthen; lokalisht `stoku:leja:sasia-shpejte = '!uid'`; vlen
      herën tjetër që hapet aplikacioni); (4) njoftim për krejt ekipën (`lloji:'lajmerim'` te zilja e secilit + aktiviteti)
      dhe "Pastro krejt chat-in/aktivitetin". Testi: `ekipa-admin-test.js` (scratchpad). Telefon: tabi i tretë `#btnEkipi`/`#dlgEkipi`; PC: seksioni i tretë i akordionit
    (`#btnAkordEkipi`) me nën-zëra `[data-ek]`, faqja `#pamjaEkipi`, adresa `#/ekipa[/<nën-pamja>]`
    (`#/ekipi` i vjetër pranohet). ID-të e brendshme mbetën "ekipi" — vetëm tekstet u bënë "Ekipa".
    - **`ekipa.js` (i ri, i përbashkët tel+PC)**: (1) `krijoCloud(fs, db, auth, platforma)` → `__stokuCloud.ekipa`
      (prania, aktiviteti, chat-i, njoftimet personale); (2) funksione të pastra të testueshme me node
      (`kohaRelative`, `eshteOnline`, `kalendari`, `statistikat`, `tekstiNgjarjes`, `duhetZbatuarHeqja`…);
      (3) `krijoKontrollues(o)` — mban gjendjen + dëgjuesit; faqet (index/pc) VETËM vizatojnë kur thirret
      `o.ndryshoi(cfare)`. Çdo ndryshim logjike bëje TE ekipa.js, jo dy herë.
    - **Firestore**: `perdoruesit/{uid}` (+ `aktivSe`, `online`, `platforma` për praninë — rrahje çdo 90 s kur
      aplikacioni është përpara; "online" = `online:true` dhe rrahja < 4 min), `perdoruesit/{uid}/njoftimet`
      (njoftimet personale; pronari i lexon/shënon `lexuar`), `ekipa_feed` (aktiviteti), `ekipa_chat`.
      Asnjë indeks i përbërë s'nevojitet (vetëm `orderBy('koha')` ose `where('lexuar','==',false)`).
    - **Dyqani i secilit mbetet i PRONARIT.** "Unë e hoqa" te një afat i SKADUAR i kolegut: shkruan një
      njoftim te `perdoruesit/{pronari}/njoftimet` + një ngjarje te `ekipa_feed`. Aplikacioni i pronarit (kur
      hapet, ose menjëherë nëse është hapur) e zbaton vetë (`zbatoHeqjetEKolegeve` tel / `ekZbatoHeqjet` PC):
      `statusi:'hequr'`, `hequrNga` = emri i kolegut — VETËM nëse `duhetZbatuarHeqja()` (afati ka skaduar
      vërtet dhe s'është ndryshuar pas heqjes). Deri atëherë, të tjerët e shohin si "të hequr" nga aktiviteti
      (`mbivendosHeqjen`). Kështu askush s'ka nevojë për leje shkrimi te dyqani i tjetrit.
    - **Aktiviteti** mbushet nga: `shenoHequr`, `shenoLajmeruar`/lista e furnizuesit, `riktheAktiv`, afatet e
      reja (mblidhen 20 s → "shtoi N afate"), anëtar i ri. Afatet e kolegëve lexohen (jo dëgjohen) kur hapet
      Ekipa, dhe rifreskohen vetëm për kolegun që ka një ngjarje të re (stoku ndryshon shpesh — s'ia vlen).
    - **Zilja** = njoftimet personale; **njoftim i sistemit** vetëm kur aplikacioni është HAPUR në sfond (s'ka
      server/FCM — kur aplikacioni është krejt i mbyllur, njoftimi del te zilja herën tjetër që hapet).
      SW-ja (`notificationclick`) i dërgon dritares `hap-ekipa` (tel: `#ekipa-<pamja>`, PC: `#/ekipa/…`).
    - **Dizajni "Pulti" (v114, opsioni A nga 5 dizajne që përdoruesi i zgjodhi — mos e ndrysho pa pyetur):**
      tel: faqja kryesore e Ekipës = `ekEshteShtepi()` (pamja 'afatet' pa anëtar) → `vizatoPultin()`: koka blu me datën
      (`#ekipiData`), karta e madhe me 3 numrat + shiritin me ngjyra (klik → lista e krejt ekipës me filtër), pllakat me
      ikona (`.ek-pult-pllakat`, `ekPllaka()`), "Online tani" (`.ek-online-rrip`, klik → afatet e atij), "Duhet hequr nga
      rafti" (me "Unë e hoqa") dhe "Skadojnë këtë javë". Në çdo pamje tjetër pllakat dalin si shirit sipër (`#ekMenu`, i
      fshehur te faqja kryesore) dhe `ne-anetar` e bën "mbrapa" të kthehet te Pulti. PC: nën-pamja `pulti` ("Përmbledhja",
      e parazgjedhura; `#/ekipa` = pulti, `#/ekipa/afatet` = afatet) me 4 KPI, tabelën "Duhet vepruar" (`ekRreshtAfati(x, true,
      true)`) dhe listën e anëtarëve djathtas.
    - **Pamjet** (tel: pllakat `#ekMenu`; PC: `.segmente#ekMenu` + anësorja): Afatet (kartat e anëtarëve →
      lista/tabela me "Unë e hoqa"), Aktiviteti, Chat, Kalendari (ngjyra për ditë: e kuqe/verdhë/gjelbër,
      e ndërprerë = të hequra), Anëtarët (online/parë së fundi, pajisja), Statistika. **Chat-i (v111) s'është më çip te menuja:** hapet nga ikona/butoni lart djathtas pranë ziles (`#ekChatBtn`, pika `#ekChatPike`; prekja sërish kthen te pamja e mëparshme) — kërkesë e përdoruesit. Dizajni përdor VETËM pjesët
      ekzistuese (folder-karta, af-numer, af-karta, artikull, af-filtrat / kpi, segmente, tabela, shiritat e
      Përmbledhjes) — 5 dizajne të veçanta u refuzuan si "palidhje" para këtij.
    - Testi me dy përdorues: `ekipa-server.js` (Firebase i simuluar në node, `exposeBinding`) +
      `ekipa-tel-test.js` / `ekipa-pc-test.js` (scratchpad) — agimi në telefon, blerta në PC.
    - **Testi me kodin e VËRTETË (v110):** `fs-server.js` (scratchpad) = Firestore i simuluar me rregullat
      (`rregullat: 'reja'` ose `'vjetra'`); faqet përdorin `ruajtja.js` + `ekipa.js` të vërteta mbi një `fs` të rremë
      (`__stokuCloud` ndërtohet te `DOMContentLoaded`). `ekipa-v110-test.js` (miratimi, migrimi, përmbledhjet,
      radha offline me rihapje, mashtrimet e refuzuara, admin-i) dhe `ekipa-v110-vjetra-test.js` (rregullat e vjetra).

11. **Leja e "sasisë së shpejtë" (butonat +/- te lista) ndjek LLOGARINË, jo emrin (v108).** Më parë ishte e
    lidhur me emrin `albidepo34` në kod — kur ai e ndërroi emrin në `tonnyaliu`, e humbi. Tani: flamuri
    `sasiaShpejte:true` te `perdoruesit/{uid}` + kopje lokale `stoku:leja:sasia-shpejte` (= uid). Emrat në
    `SASIA_SHPEJTE_EMRAT`/`EMRAT_FARE_SASIA` (vetëm `tonnyaliu` që nga v110 — `albidepo34` u hoq, sepse emri u
    lirua dhe kushdo që regjistrohej me të do ta merrte lejen) janë vetëm "farë": sapo llogaria hyn me
    njërin, flamuri ruhet dhe e mban edhe pas çdo ndërrimi emri. Për t'ia dhënë këtë leje dikujt tjetër:
    shto emrin e tij në të dyja listat (index.html + pc.html), ose vendos `sasiaShpejte: true` te dokumenti i tij
    në Firebase. `ndryshoEmrin()` tani përditëson menjëherë `perdoruesit/{uid}.perdoruesi` (lista e Ekipit).
    Rregulla: kurrë mos lidh leje/veçori me emër përdoruesi — përdor uid ose flamur te `perdoruesit/{uid}`.

## Historiku i shkurtër i veçorive kryesore (kronologjik, PR-të kryesore)

- Skanimi i barkodeve: BarcodeDetector nativ (Android), ZXing-WASM me rezolucion të plotë për iPhone
  (html5-qrcode ishte shumë i ngadaltë/i pasaktë për Safari — historia e vjetër).
- Foldera/kategori, eksport Excel (xlsx.js vetjak, pa librari), eksport PDF me etiketa+barkod (JsBarcode).
- Sinkronizim automatik telefon↔PC↔PDA përmes Firebase, me sharding (pika 4 lart) pasi u arrit kufiri 1MB.
- Moduli "Afatet": foto → lexim me AI (Cloudflare Worker, jo në këtë repo) → kontroll nga përdoruesi →
  ruaj. Ngjyra: e kuqe=skaduar, e verdhë=brenda 30 ditësh, e gjelbër=ok, gri=hequr nga rafti.
- "U hoq nga rafti" — buton që del VETËM për produktet e skaduara (jo për "afër skadimit").
- Data e skadimit shkruhet me vit 2-shifror (`DD-MM-VV`, p.sh. `01-12-26` = 2026); pranohet edhe 4-shifror.
- Eksport Excel i afateve të zgjedhura, me zgjedhje të kolonave (checkbox-a, mbahen mend).
- Njoftime push (Notification API) për afatet — 30 ditë para dhe kur skadon, jo më shpesh se 1x/produkt/datë.
- Login i detyrueshëm (porta.js) para faqes kryesore.
- Ridizajnimi i Opsioneve/Cilësimeve në telefon (grupe, ikona me ngjyra) — **u ANULUA** një herë me kërkesë
  të përdoruesit ("palidhje"), pastaj u ri-implementua ndryshe (shirit tabesh) dhe u pranua.
- Shiriti me tabe poshtë ekranit (telefon), riemërtimi "Cilësimet".
- Përditësimi automatik në sfond + "Çka ka të re" (kjo bisedë/PR më e fundit, ~v91).
- Skedar shënimesh `SHENIME.md` (ky skedar).
- Importi i stokut nga foto (faqja kryesore, ikonat lart djathtas): fotografo/zgjidh nga galeria →
  AF.lexoMeAI() (i njëjti endpoint AI si Afatet, me `ekstra: {synim:'stok'}` — Worker-i aktual s'e
  përdor ende, është përgatitje) → kontrollo/korrigjo rreshtat (barkodi+emri+sasia+furnizuesi, jo
  data) → zgjidh folderin (ose "+ Folder i ri…" aty për aty, hap dlgFolder mbi dlgImportStok) → ruaj
  (bashkohet me barkodin ekzistues në atë folder: sasia mblidhet, emri/furnizuesi ekzistues mbeten
  nëse janë vendosur). **Konfirmuar me AI real** (~19 rreshta të lexuar saktë nga një faturë e vërtetë).
  Pas fotos, telefoni pyet "Ku do ta kontrollosh fletën?" (dialogu i përbashkët `dlgKuFleta`, njësoj si
  te Afatet): "Vazhdo këtu" → dlgImportStok si më sipër; "Dërgo në PC" → e lexon këtu (me
  `synim:'stok'`), e dërgon te `dyqane/{uid}/fletet` me `lloji:'stok'`, dhe kompjuteri (i njëjti
  llogari) e hap vetë dialogun ekzistues `dlgLexim` në "modin stok" (`lx.lloji`): heq kolonën e
  datës, shton kutinë e zgjedhjes së folderit (`#lxFolderKuti`/`#lxFolderi`, kujtohet si
  `stoku:import-stok:folderi`), dhe ruajtja (`ruajLeximinStok()`) bashkohet me `produktet` njësoj si
  në telefon. Folderi NUK zgjidhet në telefon para dërgimit — zgjidhet vetëm në anën ku kontrollohet
  (telefon ose PC). (~v94; furnizuesi + dërgo-në-PC janë ~v94, pjesa bazë ~v92-93.)
  **Radhitja e rreshtave në fotot me disa kolona**: udhëzimi (`UDHEZIMI`) i Worker-it (kopja lokale në
  scratchpad, JO në këtë depo) u përditësua për të kërkuar leximin kolonë-për-kolonë (majtas→djathtas,
  secila kolonë lart→poshtë) në vend të rresht-për-rresht përgjatë gjithë gjerësisë. **Kjo ËSHTË
  DEPLOYED** (përdoruesi e konfirmoi "version saved" pas kopjimit të kodit në Cloudflare).
- **Numrat mbi foto** (~v96-97, i njëjti update i Worker-it si radhitja më sipër — **gjithashtu DEPLOYED**):
  Worker-i tani i kërkohet edhe pozicionin `x`/`y` (0..1, fraksion i gjerësisë/lartësisë) të secilit
  rresht në foto — shtuar te `SKEMA`, `UDHEZIMI` dhe të tri format-hints-et (`meWorkersAI`/`meGemini`/
  `meClaude`) të kopjes lokale të Worker-it. `AF.normalizoRreshtin()` (afatet.js) i kalon tej si `r.x`/
  `r.y` (ose `null` nëse mungojnë/kopje e vjetër e Worker-it). Klienti (telefon: `vizatoNumratMbiFoton()`
  në index.html, mbi `#impFoto`/`#lxFoto`; PC: `fotoPamja.vendosNumrat()` në pc.html, si SVG e veçantë
  `lexim-numrat` mbi lapsin, me TË NJËJTIN transform zoom/pan si foto+lapsi) vizaton nga këto koordinata
  një numër (1, 2, 3…, sipas rendit në tabelë/listë) të kuq mbi foto, pranë fillimit të rreshtit — që
  përdoruesi ta krahasojë lehtë rreshtin e tabelës me rreshtin në foto. Rreshtat pa `x`/`y` (shtuar me
  dorë, ose lexuar me kopje të vjetër të Worker-it) thjesht s'kanë numër mbi foto — nuk është gabim.
  **Deri sa Worker-i i ri të vendoset (deploy), fusha `x`/`y` do të vijnë bosh nga AI-ja aktuale dhe
  asnjë numër s'do të shfaqet** — kodi klientit është gati dhe pret vetëm updatin e Worker-it.
- **Furnizuesi i shpikur**: përdoruesi raportoi që AI-ja po vendoste TË NJËJTIN emër furnizuesi (të
  shpikur, s'ekzistonte në fletë) te ÇDO rresht. Udhëzimi (`UDHEZIMI`, fusha `furnizuesi`) u fortësua
  eksplicit: "KURRË MOS E SHPIK... lëre bosh te ÇDO rresht" nëse s'shkruhet askund në fletë.
- **Saktësia e `y`**: me fleta të gjata (50+ rreshta reale), numrat mbi foto dilnin dukshëm mbi rreshtin e
  vet (jo saktë në vijë). Udhëzimi i `y` u bë më eksplicit: "SAKTËSISHT në QENDRËN E SHKRONJAVE, jo maja
  e rreshtit", dhe theksohet të mos llogaritet si distancë e barabartë mes rreshtash (shkrimi dorë s'është
  i barabartë) — çdo rresht të kontrollohet veç e veç.
  **As furnizuesi-i-shpikur, as saktësia e `y` NUK janë ende të konfirmuara si deployed** — ia dhashë
  përdoruesit skedarin e ri (të konsoliduar me krejt ndryshimet deri tash), por s'e kam konfirmimin
  "u ngjit" për këta të dy specifikisht (ndryshe nga radhitja+x/y bazë, që u konfirmua me "version saved").

## Konventat e testimit (S'KA Firebase real, s'ka telefon real)

Meqë s'ka akses te Firebase-i i vërtetë as te pajisje fizike, çdo veçori testohet me **Playwright**:

- Server lokal: `python3 -m http.server 8765` (ose port tjetër) brenda `/home/user/stoku`.
- Mock i cloud-it: `page.addInitScript(() => { window.__stokuCloud = { authGati: true,
  perdoruesiAktual: () => ({...}), merr: async () => ({ok:true, gjendja:...}), bashkoDheRuaj: async fn =>
  {...}, degjo: () => () => {} }; localStorage.setItem('stoku:pronari-uid', 'u1');
  localStorage.setItem('stoku:porta:hyrja', '1'); })` — kjo e anashkalon `porta.js` (login gate) dhe
  Firebase-in e vërtetë.
- CDN-të e jashtme (jsdelivr, workers.dev) bllokohen te rrjeti i vërtetë i kësaj mjedisi — route-ohen te
  kopje lokale (npm/node_modules) me `ctx.route(...)`.
- Për të testuar **service worker-in real** (përditësimin automatik, cache): duhet `serviceWorkers: 'allow'`
  (jo `'block'`) dhe një kopje e vërtetë e skedarëve në disk (jo route-im), sepse SW punon me `fetch` të
  vërtetë ndaj serverit lokal. Shih historinë e bisedës për skriptet `perditesim.js`/`perditesim2.js` si
  shembull (simulojnë ndryshimin e `CACHE` në `sw.js` dhe kontrollojnë rinisjen).
  - viewport telefoni: `{ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }`,
    userAgent Android Chrome.
  - viewport PC: `{ width: 1280-1600, height: 700-800 }`, pa userAgent special (ridrejtohet vetë te
    pc.html sipas rregullit "kompjuter = ka maus / s'është touch-only").
- **Rregullat e Firestore me emulatorin e vërtetë** (v164): Java është në mjedis; JAR-i shkarkohet nga
  `https://storage.googleapis.com/firebase-preview-drop/emulator/cloud-firestore-emulator-v1.19.9.jar` (~64 MB),
  `npm i @firebase/rules-unit-testing@4 firebase@11` në një dosje të scratchpad-it (`emu/`), nisja
  `java -jar firestore-emu.jar --host=127.0.0.1 --port=8089`, provat `node rregullat-prova.mjs` (lexon `firestore.rules`
  të nxjerrë nga ky skedar). v164: 105 prova OK (krijimi i grupit me `getAfter`, ftesat me query `gid ==`, njoftimet
  brenda grupit, heqja/rihyrja, llogaria pa profil). Scratchpad-i s'mbetet mes bisedave: rikrijoje kur ndryshojnë rregullat.
- **Gjithmonë bëhet edhe një regresion i plotë** (folderat, skanimi, eksporti, afatet, sinkronizimi) para
  se të hapet PR, jo vetëm testi i veçorisë së re — disa gabime u zbuluan kështu (jo nga testi i
  synuar, por nga regresioni i plotë).
- Screenshot-et u dërgohen përdoruesit (SendUserFile) si provë vizuale — e vlerëson shumë këtë, sidomos
  për ndryshime UI.

## Rrjedha e punës (git/PR)

- Branch pune: `claude/qysh-funksionon-ilbmdw` (emër fiks, mos e ndrysho pa u kërkuar).
- Pas çdo ndryshimi: commit + push + hap PR, pastaj shpjegoj shqip çka ndryshoi dhe pse, thjesht, si për dikë
  jo-teknik. Kur përdoruesi e kërkon ("bone merge"), e bëj vetë merge-in me mjetin e GitHub-it
  (p.sh. PR #45–#50 u bënë merge kështu).
- Nëse PR paraardhëse u bë merge para se të fillonte puna e re: `git fetch origin main` dhe
  `git checkout -B claude/qysh-funksionon-ilbmdw origin/main` (rifillo nga main i pastër), mos vazhdo mbi
  histori të vjetruar.
- Commits/PR MOS përfshijnë identifikues modeli (asnjë "Claude Opus/Sonnet/...", "generated by model X")
  brenda mesazhit apo kodit — vetëm rreshtat e atribuimit standarde në fund (Co-Authored-By / Claude-Session
  / linku "Generated with Claude Code") sipas udhëzimit të sistemit në atë bisedë.
- Çdo PR duhet përshkrim të plotë shqip: çka ndryshoi, si u testua, çfarë numrash versioni u prekën.

## Gjëra që përdoruesi i ka refuzuar/anuluar shprehimisht (mos i propozo/rikthe pa pyetur)

- Opsioni "Mos dil kur i fshin të dhënat" te Cilësimet → Llogaria dhe udhëzimi "shtyp Ruaj" te porta (v165, u hoq
  te v166): "hiq bash kurgjo ske bo, hiqe fshije".

- Marking/vijëzim automatik i rreshtave në fletë (u keqkuptua kërkesa origjinale; u zëvendësua me "laps"
  të kuq të vizatuar me dorë nga përdoruesi mbi foton, që mbetet gjatë zoom-it).
- Butoni "versioni për telefon" te pc.html (u hoq krejt).
- Font i veçantë / numra më të mëdhenj te Afatet (v121/v122, u kthyen si më parë te v123).
- Pamje/dizajne të mia (dy raunde u refuzuan); pamja e sotme (v126) është dizajni i vetë përdoruesit nga Claude Design.
- Çdo gjë për furnizuesin si mesazh/lajmërim (v121 + v122): "Lajmëro furnizuesin", "Lajmërova", "Dërgo listën",
  "Kopjo mesazhin për furnizuesin". Grupimi sipas furnizuesit mbetet (vetëm si listë).
- Placeholder-a tip "p.sh." në fusha — përdoruesi i pëlqen hint-e përshkruese, jo shembuj konkretë.
- Teksti "ose komercialistin" te mesazhet e afateve — u hoq, mbetet vetëm "furnizuesin".
- Zoom me pinch-to-zoom në telefon — u ç'aktivizua (maximum-scale=1, user-scalable=no, touch-action).
- Kompjuteri, ndarja Stoku/Afatet — HISTORIA (mos e rifillo pa pyetur, thjesht respekto gjendjen aktuale):
  1) taba lart me `#tabStoku`/`#tabAfatet` (PR #32) → 2) u ANULUA ("tepër palidhje", PR #33, mbrapa te
  `#navAfatet` në fund të anësores) → 3) u kërkua sërish (PR #37, tabet lart) → 4) u ANULUA PËRSËRI
  ("tmerr u doka") dhe u kërkua "Stoku"/"Afatet" si dy tituj statikë në anësore, secili me nën-artikujt
  gjithmonë të dukshëm poshtë emrit (PR #38) → 5) u kërkua NJË RREGULLIM I FUNDIT: jo dy seksione
  gjithmonë të hapura njëkohësisht (dukeshin "të ndara"/larg njëra-tjetrës) — në vend të kësaj, **AKORDION**:
  të dyja titujt ("Stoku"/"Afatet", butona `#btnAkordStoku`/`#btnAkordAfatet`, klasë `.akordion-krye`,
  me shigjetë `.akordion-shigjeta` që rrotullohet) ngjitur njëri pas tjetrit lart në anësore; kliko njërin
  → hapet VETËM ai (nën-artikujt e tij shfaqen poshtë, brenda `.akordion-trup.hapur`) dhe tjetri mbyllet
  automatikisht; gjendja e hapur/mbyllur ndiqet nga `pamja` (`vendosAkordionin()`, e thirrur nga
  `renderAnesoren()`). **v117 (kërkesë e përdoruesit):** secili titull (Stoku/Afatet/Ekipa) është
  `div.akordion-krye.ak-{stoku|afatet|ekipi}` me DY butona: emri `#btnAkordX` (`.akordion-emri`, me ikonë me
  ngjyrë `.akordion-ikona`: blu/portokalli/jeshile) të çon te kategoria (ose e hap/mbyll kur je aty), dhe
  shigjeta `#btnAkordXShigjeta` (`.akordion-shigjeta-btn`, me kornizë) vetëm e hap/mbyll PA navigim. Vijë
  ndarëse sipër çdo kategorie (përveç të parës). Testi: `anesorja-v117.js`. "Stoku" i hapur → kthehet gjithmonë te "Përmbledhja" (jo te pamja e fundit — u hoq
  qëllimisht kompleksiteti i `fundiPamjesStoku`). `#navAfatet` mbetet brenda `#akordAfatetTrupi`.
  **PAS PROVËS REALE, 3 rregullime shtesë (~v102-103)**: (a) tranzicioni u bë "slide" i vërtetë me
  `grid-template-rows: 0fr→1fr` (jo `max-height` që s'animohet në CSS) + `.anesore-fund{margin-top:auto}`
  që footer-i të mbetet gjithmonë në fund; (b) të dyja seksionet mund të jenë të hapura NJËKOHËSISHT tani
  (`akordoniStokuHapur`/`akordoniAfatetHapur`, dy boolean të pavarur — jo më "vetëm njëri i hapur"; klikimi
  i titullit kur je TASHMË te ajo pamje thjesht e hap/mbyll atë, pa e prekur tjetrin; navigimi nga një pamje
  tjetër e hap tjetrin PA e mbyllur këtë); (c) nën "Afatet" u shtuan edhe "Të skaduara"/"Afër skadimit"
  (`#navAfSkaduara`/`#navAfAfer`, vendosin `af.filtri` dhe lundrojnë te 'afatet'); (d) **RREGULLIM I
  RËNDËSISHËM**: fletët e dërguara nga telefoni ndaheshin vetëm me TEKST ("Fletë stoku" vs "Fletë afatesh")
  por të dyja llojet shfaqeshin GJITHMONË brenda faqes së Afateve (`#afFletetTel`, i vetmi kontejner që
  ekzistonte) — përdoruesi e pa këtë si "gabim, fletë stoku po del te Afatet". Tani ka DY kontejnerë të
  veçantë: `#stokFletetTel` (brenda `#pamjaPermbledhja`, vetëm fletë `lloji==='stok'`) dhe `#afFletetTel`
  (vetëm afatet), me badge-e të veçanta `#stokTabFleta` (mbi titullin "Stoku") dhe `#afTabFleta`, filtruar
  brenda `renderFletetETelefonit()`.
  **KJO ËSHTË GJENDJA PËRFUNDIMTARE (~v103)**. Testet Playwright që lidhen me këtë zonë duhet të klikojnë
  `#btnAkordStoku`/`#btnAkordAfatet` PARA se të klikojnë diçka brenda tyre (p.sh. `#navPermbledhja`,
  `#afBtnShto`) — një seksion i mbyllur mund të hapet pa e mbyllur tjetrin, por elementet brenda TIJ vetë
  s'janë të klikueshme derisa të hapet.
  Nëse ndonjëherë duket sikur duhet ndryshuar përsëri kjo zonë, PYET së pari çka saktësisht don ndryshe,
  në vend që të provosh dizajne të reja vetë — kjo zonë ka ndryshuar 4 herë tashmë.

## Rregullat e Firestore (v164 grupet; më parë v116 + v130 ekipa_push + v140 admini nga llogaria) — i vendos PËRDORUESI (unë s'kam qasje)

Teksti i plotë që iu dha përdoruesit (zëvendëson krejt skedarin e rregullave). Dyqani lexohet vetëm nga pronari/admin-i;
`emri`/`perdoruesi` s'falsifikohen (= emri i llogarisë); aplikacioni s'mund ta shtojë/ndryshojë fushën `emri` te
`perdoruesit/{uid}` (admin-i ndreqet vetëm nga Console).
**v116 (fshirja e llogarisë nga admin-i):** `ekipa_fshire/{uid}` (shkruan vetëm admin-i, lexon vetë llogaria): llogaria e
shënuar s'ka më qasje te dyqani/profili/afatet; admin-i fshin `perdoruesit/{uid}`, njoftimet, anëtarësinë në grup dhe
pajisjet e tij. Aplikacioni i llogarisë së fshirë (`degjoFshirjen`) i fshin të dhënat lokale, thërret `deleteUser` dhe
tregon "Kjo llogari u fshi nga administratori." te porta. Testi: `fshirja-v116.js` (scratchpad).
**v164 (grupet):** Ekipa = `grupet/{g}` me anëtarësinë, ftesat te `ftesat/{g}_{emri}`; lista e `perdoruesit` vetëm për
admin-in; njoftimet vetëm brenda grupit (fusha `grupi`). Koleksionet e vjetra `ekipa_*` mbeten vetëm për aplikacionin
e vjetër (para përditësimit). Mock-u në scratchpad (`fs-server.js`, `rregullat: 'reja'`) i ndjek këto rregulla.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Administratori: llogaria "mendurberisha" (email-i i hyrjes, s'falsifikohet) ose, si më parë, fusha `emri`
    // te perdoruesit/{uid} e vendosur nga Console (v140)
    function eshteAdmin() {
      return request.auth != null && (request.auth.token.email == 'mendurberisha@stoku-app.local'
        || get(/databases/$(database)/documents/perdoruesit/$(request.auth.uid)).data.get('emri', '') == 'mendurberisha');
    }
    // Anëtar i ekipës së vjetër (para grupeve): vetëm për versionet e vjetra të aplikacionit
    function neEkipe() {
      return exists(/databases/$(database)/documents/ekipa_anetaret/$(request.auth.uid)) || eshteAdmin();
    }
    // Llogari e fshirë nga administratori: s'ka më qasje në asgjë
    function uFshi(uid) {
      return exists(/databases/$(database)/documents/ekipa_fshire/$(uid));
    }
    // Emri i llogarisë (emri@stoku-app.local), s'mund të falsifikohet nga aplikacioni
    function emriIm() {
      return request.auth.token.email.split('@')[0];
    }
    // v164: grupet
    function anetarIGrupit(g) {
      return exists(/databases/$(database)/documents/grupet/$(g)/anetaret/$(request.auth.uid));
    }
    function pronarIGrupit(g) {
      return anetarIGrupit(g)
        && get(/databases/$(database)/documents/grupet/$(g)/anetaret/$(request.auth.uid)).data.get('roli', '') == 'pronar';
    }
    function emriIGrupitOk(d) {
      return d.emri is string && d.emri.size() >= 2 && d.emri.size() <= 60;
    }
    match /dyqane/{kodi} {
      allow read, write: if request.auth != null && ((request.auth.uid == kodi && !uFshi(kodi)) || eshteAdmin());
      match /pjeset/{pjesa} {
        allow read, write: if request.auth != null && ((request.auth.uid == kodi && !uFshi(kodi)) || eshteAdmin());
      }
      match /fletet/{fleta} {
        allow read, write: if request.auth != null && ((request.auth.uid == kodi && !uFshi(kodi)) || eshteAdmin());
      }
    }
    match /perdoruesit/{uid} {
      allow get: if request.auth != null && (request.auth.uid == uid || neEkipe());
      // v164: lista e krejt llogarive vetëm për administratorin
      allow list: if request.auth != null && eshteAdmin();
      allow create: if request.auth != null && request.auth.uid == uid && !uFshi(uid)
        && !request.resource.data.keys().hasAny(['emri'])
        && (!('perdoruesi' in request.resource.data) || request.resource.data.perdoruesi == emriIm());
      allow update: if request.auth != null && ((request.auth.uid == uid && !uFshi(uid)
        && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['emri'])
        && (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['perdoruesi'])
            || request.resource.data.perdoruesi == emriIm()))
        || (eshteAdmin() && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['sasiaShpejte'])));
      allow delete: if request.auth != null && eshteAdmin();
      match /njoftimet/{nid} {
        allow read, delete: if request.auth != null && (request.auth.uid == uid || eshteAdmin());
        allow update: if request.auth != null && request.auth.uid == uid;
        // v164: dërguesi dhe marrësi në të njëjtin grup (fusha `grupi`), ose administratori
        allow create: if request.auth != null
          && request.resource.data.uid == request.auth.uid && request.resource.data.emri == emriIm()
          && ((request.resource.data.get('grupi', '') is string && request.resource.data.get('grupi', '') != ''
               && anetarIGrupit(request.resource.data.grupi)
               && exists(/databases/$(database)/documents/grupet/$(request.resource.data.grupi)/anetaret/$(uid)))
              || eshteAdmin());
      }
    }
    match /ekipa_fshire/{uid} {
      allow read: if request.auth != null && (request.auth.uid == uid || eshteAdmin());
      allow write: if request.auth != null && eshteAdmin();
    }
    // Ekipa e vjetër (para grupeve): mbetet për versionet e vjetra të aplikacionit
    match /ekipa_anetaret/{uid} {
      allow read: if request.auth != null && (request.auth.uid == uid || neEkipe());
      allow write: if request.auth != null && eshteAdmin();
      // v164: largimi nga grupi "ekipa" (vetë) ose heqja nga pronari i tij
      allow delete: if request.auth != null && (request.auth.uid == uid || pronarIGrupit('ekipa'));
    }
    match /ekipa_afatet/{uid} {
      allow read: if request.auth != null && neEkipe();
      allow write: if request.auth != null && ((request.auth.uid == uid && !uFshi(uid)) || eshteAdmin());
    }
    match /ekipa_feed/{id} {
      allow read: if request.auth != null && neEkipe();
      allow create: if request.auth != null && neEkipe()
        && request.resource.data.uid == request.auth.uid && request.resource.data.emri == emriIm();
      allow delete: if request.auth != null && (resource.data.uid == request.auth.uid || eshteAdmin());
    }
    match /ekipa_chat/{id} {
      allow read: if request.auth != null && neEkipe();
      allow create: if request.auth != null && neEkipe()
        && request.resource.data.uid == request.auth.uid && request.resource.data.emri == emriIm()
        && request.resource.data.tekst is string
        && request.resource.data.tekst.size() > 0 && request.resource.data.tekst.size() <= 2000;
      allow delete: if request.auth != null && (resource.data.uid == request.auth.uid || eshteAdmin());
    }
    match /ekipa_push/{id} {
      allow read: if request.auth != null && neEkipe();
      allow create, update: if request.auth != null && neEkipe() && request.resource.data.uid == request.auth.uid
        && id.matches(request.auth.uid + '_[A-Za-z0-9]+');
      allow delete: if request.auth != null && neEkipe();
    }
    // v164: grupet. Anëtarët te grupet/{g}/anetaret/{uid} (roli 'pronar' | 'anetar'); treguesi te perdoruesit/{uid}.grupi
    match /grupet/{g} {
      allow read: if request.auth != null && (anetarIGrupit(g) || eshteAdmin());
      allow create: if request.auth != null && (eshteAdmin() || (!uFshi(request.auth.uid)
        && request.resource.data.pronarUid == request.auth.uid && request.resource.data.pronarEmri == emriIm()
        && request.resource.data.keys().hasOnly(['emri', 'pronarUid', 'pronarEmri', 'krijuarSe'])
        && emriIGrupitOk(request.resource.data) && g != 'ekipa'));
      allow update: if request.auth != null && (eshteAdmin() || (pronarIGrupit(g)
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['emri']) && emriIGrupitOk(request.resource.data)));
      allow delete: if request.auth != null && (pronarIGrupit(g) || eshteAdmin());
      match /anetaret/{u} {
        allow read: if request.auth != null && (request.auth.uid == u || anetarIGrupit(g) || eshteAdmin());
        // Hyrja vetë: pronari vetëm bashkë me krijimin e grupit (i njëjti batch); anëtari vetëm me ftesë;
        // anëtari i ekipës së vjetër te grupi "ekipa". Administratori shton kë të dojë (migrimi).
        allow create: if request.auth != null && (eshteAdmin() || (request.auth.uid == u && !uFshi(u)
          && request.resource.data.emri == emriIm()
          && request.resource.data.keys().hasOnly(['emri', 'roli', 'hyriSe', 'aktivSe', 'online', 'platforma'])
          && ((request.resource.data.roli == 'pronar' && !exists(/databases/$(database)/documents/grupet/$(g))
                && getAfter(/databases/$(database)/documents/grupet/$(g)).data.pronarUid == u)
              || (request.resource.data.roli == 'anetar' && exists(/databases/$(database)/documents/grupet/$(g))
                && exists(/databases/$(database)/documents/ftesat/$(g + '_' + emriIm())))
              || (g == 'ekipa' && request.resource.data.roli == 'anetar'
                && exists(/databases/$(database)/documents/ekipa_anetaret/$(u))))));
        // Vetë: prania. Pronari: roli dhe leja e +/- (sasiaShpejte).
        allow update: if request.auth != null && (eshteAdmin()
          || (request.auth.uid == u && request.resource.data.emri == emriIm()
              && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['emri', 'aktivSe', 'online', 'platforma']))
          || (pronarIGrupit(g) && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['roli', 'sasiaShpejte'])
              && request.resource.data.roli in ['pronar', 'anetar']));
        allow delete: if request.auth != null && (request.auth.uid == u || pronarIGrupit(g) || eshteAdmin());
      }
      match /afatet/{u} {
        allow read: if request.auth != null && (anetarIGrupit(g) || eshteAdmin());
        allow write: if request.auth != null && ((request.auth.uid == u && !uFshi(u) && anetarIGrupit(g)) || eshteAdmin());
        allow delete: if request.auth != null && (request.auth.uid == u || pronarIGrupit(g));
      }
      match /feed/{id} {
        allow read: if request.auth != null && (anetarIGrupit(g) || eshteAdmin());
        allow create: if request.auth != null && (eshteAdmin() || (anetarIGrupit(g)
          && request.resource.data.uid == request.auth.uid && request.resource.data.emri == emriIm()));
        allow delete: if request.auth != null && (resource.data.uid == request.auth.uid || pronarIGrupit(g) || eshteAdmin());
      }
      match /chat/{id} {
        allow read: if request.auth != null && (anetarIGrupit(g) || eshteAdmin());
        allow create: if request.auth != null && (eshteAdmin() || (anetarIGrupit(g)
          && request.resource.data.uid == request.auth.uid && request.resource.data.emri == emriIm()
          && request.resource.data.tekst is string
          && request.resource.data.tekst.size() > 0 && request.resource.data.tekst.size() <= 2000));
        allow delete: if request.auth != null && (resource.data.uid == request.auth.uid || pronarIGrupit(g) || eshteAdmin());
      }
      // Pajisjet për push (Worker-i i lexon me tokenin e dërguesit). Id = {uid}_{hash i endpoint-it}.
      match /push/{id} {
        allow read: if request.auth != null && (anetarIGrupit(g) || eshteAdmin());
        allow create, update: if request.auth != null && anetarIGrupit(g) && request.resource.data.uid == request.auth.uid
          && id.matches(request.auth.uid + '_[A-Za-z0-9]+');
        allow delete: if request.auth != null && (anetarIGrupit(g) || eshteAdmin());
      }
    }
    // v164: ftesat. Id = {grupi}_{emri i përdoruesit}. I ftuari i sheh me pyetjen perdoruesi == emri i tij,
    // anëtarët e grupit me gid == grupi.
    match /ftesat/{id} {
      allow read: if request.auth != null
        && (resource.data.perdoruesi == emriIm() || anetarIGrupit(resource.data.gid) || eshteAdmin());
      allow create, update: if request.auth != null && pronarIGrupit(request.resource.data.gid)
        && id == request.resource.data.gid + '_' + request.resource.data.perdoruesi
        && request.resource.data.perdoruesi is string && request.resource.data.perdoruesi.matches('[a-z0-9_.-]{3,40}')
        && request.resource.data.ngaUid == request.auth.uid && request.resource.data.ngaEmri == emriIm()
        && request.resource.data.keys().hasOnly(['gid', 'grupiEmri', 'perdoruesi', 'ngaUid', 'ngaEmri', 'koha'])
        && request.resource.data.get('grupiEmri', '') is string && request.resource.data.get('grupiEmri', '').size() <= 60;
      allow delete: if request.auth != null
        && (resource.data.perdoruesi == emriIm() || pronarIGrupit(resource.data.gid) || eshteAdmin());
    }
  }
}
```

Pas vendosjes: admin-i duhet ta hapë aplikacionin një herë (telefon ose PC) me v164: ekipa e vjetër bëhet grupi "Ekipa"
(anëtarët, chat-i, aktiviteti, afatet). Anëtarët e vjetër hyjnë vetë aty; të tjerët s'shohin askënd derisa të krijojnë
grup ose të pranojnë ftesë. Pa këto rregulla, Ekipa tregon "Grupet s'janë gati ende" (stoku/afatet punojnë).

## Kontakte/aksese që s'i kam

- Cloudflare Worker-i që lexon fotot me AI (`afatet-worker.js`) — **s'është në këtë repo**; përdoruesi e
  bën deploy vetë manualisht kur i jap kodin. Mos supozo qasje direkte në Cloudflare.
- Cloudflare Worker-i i njoftimeve (`worker/stoku-push.js`, NË repo) — e vendos përdoruesi te Cloudflare; çelësi privat
  VAPID i është dhënë vetëm atij (s'ruhet në repo). Nëse humbet: gjenero çift të ri, ndrysho `PUSH_VAPID` te ekipa.js
  dhe secrets te Worker-i (pajisjet riregjistrohen vetë, sepse çelësi ndryshon).
- Firebase console (rregullat, konfigurimi) — vetëm përdoruesi ka qasje; unë i jap tekstin e rregullave,
  ai i ngjit vetë.
- Pajisje reale (telefon/PDA/tablet) — asnjë provë s'është bërë në pajisje fizike, gjithçka është
  Playwright/mock. Thuaje këtë çdo herë kur raportosh se diçka "u testua" — sqaro se s'është provuar në
  pajisje reale.
