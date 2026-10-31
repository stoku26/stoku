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
| `index.html` | Versioni për **telefon/PDA**: vetëm HTML (v238: kodi te `app-tel.js`, `fillimi-tel.js`, `firebase-tel.js`; CSP pa skripta inline). |
| `pc.html` | Versioni për **kompjuter**: vetëm HTML (v238: kodi te `app-pc.js`, `fillimi-pc.js`, `firebase-pc.js`); e njëjta bazë e të dhënave, UI ndryshe. |
| `afatet.js` | Logjika e përbashkët për "Afatet" (data, statuse, lexim AI, formatim). Përdoret nga të dy faqet **dhe** nga `sw.js` (për njoftimet në sfond). |
| `bashkimi.js` | Logjika e bashkimit të të dhënave mes pajisjeve (LWW me kohë, fshirjet si tombstones). E përbashkët. |
| `ruajtja.js` | Ndarja e dyqanit në Firestore në disa dokumente (shih më poshtë "Firebase"). |
| `skedaret.js` | v229: Excel dhe PDF nga telefoni/PDA-ja te PC-ja ("Dërgo në PC"; Firestore `dyqane/{uid}/skedaret`, copa ≤ 900 KB). E përbashkët. |
| `lejet.js` | v230: lejet e përdoruesve (katalogu i 21 lejeve, `lejet/{uid}`, gjendja e pajisjes me localStorage). E përbashkët; faqja "Përdoruesit" vetëm për administratorin. v231: çka s'lejohet zhduket pa asnjë mesazh. |
| `porta.js` | Ekrani i hyrjes/kyçjes (login gate) — hapet para faqes kryesore te të dyja versionet. |
| `njoftimet.js` | Njoftimet push për afatet (30 ditë para skadimit, dhe kur skadon) — logjikë e përbashkët për faqen dhe `sw.js`. |
| `teRejat.js` | Lista "Çka ka të re" (shënimet e versioneve) — tregohet në hyrje. **Shto këtu një hyrje për çdo ndryshim domethënës të ri**, shih udhëzimin brenda skedarit. |
| `xlsx.js` | Ndërton dhe lexon skedarë `.xlsx` pa librari të jashtme. |
| `sw.js` | Service worker: cache për punë pa internet + **përditësim automatik** (shih poshtë). |
| `404.html` | Faqja "Kjo faqe s'u gjet": GitHub Pages e shfaq për çdo adresë që s'ekziston (me adresa absolute, "/logo/…"). |
| `manifest.webmanifest` | PWA manifest (emri "Stoku", ikonat). |
| `css/` | Pamja (v126): `stoku-tokens.css` (fontet, ngjyrat e çelëta/errëta), `stoku.css` (telefoni), `stoku-pc.css` (kompjuteri). |
| `fonts/` | Onest dhe JetBrains Mono (woff2, OFL), që pamja të punojë edhe pa internet. |
| `logo/` | Logo e re (SVG, favicon, ikona "maskable"; edhe disa variante të logos që aplikacioni s'i përdor, si arkiv). |

## Rregulla teknike THEMELORE (mos i harro)

0. **PA VIZË TË GJATË ("—") në asnjë tekst që e sheh përdoruesi** (tituj, mesazhe, toast, "Çka ka të re",
   njoftime, placeholder). Përdoruesi e sheh si shenjë që teksti është shkruar me AI (v117 u pastruan krejt).
   Në fjali: presje, pikë, dy pika ose kllapa. Si ndarës: "·" (p.sh. "Sinkronizuar · 12:21") ose "•" (titulli
   i dritares: "Ekipa • Përmbledhja • Stoku"). Qelizë bosh në tabelë: "–" (vizë e shkurtër). Te komentet e kodit
   s'ka rëndësi. Kontrolli: `gjej-vizat.js` (scratchpad) duhet të japë "gjithsej 0".

0000000. **SHKRONJA TË VOGLA NË TELEFON (v272 = 1.46.0, 31.10.2026, vetëm web-i i telefonit)**: pronari: "Ne web app veq ne telefon te
   qato madhesi qe jan shtoje edhe ni opsion per shkronja te vogla". Cilësimet → Pamja → Madhësia e shkronjave: "E vogël" (`data-v="e_vogel"`,
   `#madhesiaEVogel`, "Aa" 15 px) para "Normale" dhe "E madhe"; `body[data-madhesi="e_vogel"] { zoom: .9 }` (si `e_madhe` 1.12, krejt
   faqja). `.ops-madhesia` tash 3 kolona (si `.ops-tema`); `opsione.madhesia` pranon `e_vogel`. Shiriti poshtë, butoni lundrues,
   dritaret dhe kamera e plotë u kontrolluan me .9 (mbeten në skajet e ekranit). PC-ja (`#opsMadhesia`) dhe Android-i s'u prekën.
   Testi `teste/v272.js`. S'është testuar në telefon të vërtetë.

0000000. **PA BUTONIN E SINKRONIZIMIT DHE PA MUAJIN (v271 = 1.45.3, 31.10.2026, telefoni + PC + Android Hyrja 31) + NJOFTIMET NË
   ANDROID**: pronari (foto e Afateve në Android): "Heqja qat buton nalt anen e djatht qe o per sinkronizim edhe daten, leje
   sinkronizimin me u bo pas qdo ndryshimi automatik. Ne web app edhe android app nese o naj kun edhe npc heke."
   - **Telefoni (web)**: `#afMuaji` ("Tetor 2026") dhe `#afSinkStatus` (ikona e cloud-it) u hoqën nga koka e Afateve, bashkë me
     `vendosStatusinEAfateve`, `IKONAT_SINK`, `MUAJT_PLOTE` dhe CSS-në `.af-sink`/`.sb-muaji`. Koka mbetet 44 e lartë
     (`#dlgAfatet .opsione-krye { height: 44px; box-sizing: content-box }`), kartat 72 nga lart si më parë.
   - **PC**: `#sinkStatus` ("Sinkronizuar · ora" nën emrin në anësore, prekja = sinkronizo tani) u hoq; `vendosStatusin` e shkruan
     statusin vetëm te Cilësimet (`#opsNavSub`, `#opsLlStatusi`, `#llStatusi`); "Dil" tash `grid-row: 1`.
   - **Android**: `AfatetEkrani`: pa muajin dhe pa `ButonIkone` e cloud-it (`Row(heightIn(min = 44.dp))`); ikonat `Ik.ReOk/RePune/ReGabim` u hoqën.
   - Sinkronizimi ishte tashmë automatik kudo: web `planifikoSinkronizimin` (1.5 s; afatet 300 ms), PC `sink.kohez` + riprovim pas
     15 s, Android `Dyqani.kurNdryshon → Sinkronizimi.planifiko(1500)`. "Sinkronizo tani" te Cilësimet → Llogaria mbetet (s'u kërkua).
   - **Njoftimet (Android, foto e dytë: "S'u lidh me serverin e njoftimeve" edhe pse "✓ Serveri punon")**: `gjendjaENjoftimeve`
     jepte "lokale" ("Aktive kur Stoku është hapur" + "Provo sërish lidhjen") edhe kur përdoruesi s'është në asnjë grup (ose grupi
     ende s'ishte ngarkuar): `Push.aktivizo` s'kishte çka të regjistronte, kthente "ok", `pushAktiv()` false → mesazhi i internetit.
     Tash: pa grup → "aktive"; `aktivizo` kthen "pa-grup" / "rregullat" (PERMISSION_DENIED i Firestore-it) / "rrjeti" dhe, si
     `aktivizoPush` te web-i, e pyet serverin (`serveri()`, që `push_server` të jetë i freskët); gjendja rillogaritet pas kontrollit të
     serverit dhe kur ndryshon `Grupi.gjendja`; mesazhet sipas arsyes. Web-i (`gjendjaENjoftimeve` te app-tel.js) s'u prek.
   - Testet: `teste/v271.js`; përshtatur v215-test (D: statusi te Cilësimet), v248, vizitor-test, v268 (pa `#afSinkStatus`).
     S'është testuar në pajisje të vërteta.

0000000. **ORA: KONTROLLI PËR GABIME (30.10.2026, vetëm `ora/` + CI, pa version të web-it)**: përdoruesi: "Tash kontrolloje appin e
   ores per bugs edhe rregulloji". Rishikim i kodit + **lint** (job i ri `lint` te `ora-apk.yml`, si te `vendas-apk.yml`: vetëm në degët
   e punës, s'e ndal CI-në, rezultatet në log si `LINT …`). U rregulluan:
   (1) **401 s'e fshin më lidhjen**: më parë çdo 401 (edhe i çastit, kur KV-ja e Cloudflare-it s'e kishte ende `ora-tok` në atë vend)
   thërriste `Api.shkeput` = POST `/ora/shkeput` (e fshinte lidhjen e vërtetë te serveri) + sekret i ri, pra duhej lidhur sërish me kod.
   Tash `Api.humbiLidhja` (PaLidhje te `ListaEkrani`/`ZgjedhKolegun`, parametri `kurHumbetLidhja`): vetëm `lidhur=false`, pa thirrje te
   serveri, me të njëjtin sekret; ekrani i kodit (`/ora/kodi` e kthen `lidhur: true` kur `ora-tok` ekziston) kthehet vetë te lista.
   `Api.shkeput` (vetëm Cilësimet → Shkëput orën) s'është më `suspend`: i fshin menjëherë prefs-at dhe e njofton serverin në sfond
   (`Api.sfondi`); më parë ekrani priste deri në 25 s pa internet. (2) **Heqja që dështonte te serveri**: produkti mbetej i fshehur me
   "Provo prapë" pa pasur si; tash `ngarko()` + `riktheTeKrejt(a)`. `postoHeqjen`: 5xx/429/408 (`provoMeVone`, p.sh. KV-ja ~1 shkrim/s
   për `ora-hequr:{uid}` kur "Zhbëj" shtypet menjëherë pas heqjes) provohen sërish pas 1.2 s, pastaj ruhen te radha si pa internet
   (`PA_INTERNET_HEQJA` tash "Pa lidhje me serverin: … dërgohet vetë më vonë."). Radha: 429/408 s'e hedhin më heqjen (më parë vetëm
   ≥ 500 mbetej), pushimi 1.1 s edhe pas një grupi. (3) **Gabimet që fshiheshin menjëherë**: "N heqje s'u ruajtën" dhe "Zhbërja s'u
   ruajt" vendoseshin para `ngarko()`, që i fshinte me `gabim = null`; tash pas tij. (4) **Tile-i/komplikacioni** numëronin edhe
   produktet që presin heqjen në radhë (`listaERuajtur`/`krejtERuajtur` tash me `paHequrat`); radha nga tile-i me kufijtë `shpejt`;
   gabimi i papritur te `onTileRequest` kthehet te sistemi (`setException`) në vend që ta rrëzojë aplikacionin. (5) **"Mbi 30 ditë" dhe
   kërkimi**: pas heqjes kthehesh aty ku ishe (`Pamja.Hequr.nga`, edhe "Zhbëj" dhe mbrapa); `krejt` ngarkohet vetëm kur hapen nga lista
   kryesore (`hapMeKrejt`), jo pas çdo produkti (serveri mund ta kthente produktin e sapohequr); "Hiqi krejt" i heq edhe nga `krejt`;
   "Zhbëj" e rikthen produktin edhe aty. (6) **Përditësimi**: `Perditesimi.kontrollo` kërkon deri në 5 faqe Releases (më parë vetëm 100 të
   parat: me shumë publikime `vendas-v*` pas versionit të fundit të orës, ora s'e gjente më); lidhjet mbyllen. (7) `sekreti`/`kodi`
   `@Synchronized`. Pa testim në orë të vërtetë (s'kemi orë).

0000000. **ANDROID: KONTROLLI I DYTË PËR GABIME (30.10.2026, vetëm `vendas/` + CI, Hyrja 30)**: përdoruesi: "Kontrolloje android appin per
   bugs edhe probleme, edhe rregulloji te gjitha". Rishikim i kodit + **lint** i Android-it (job i ri `lint` te `vendas-apk.yml`, vetëm
   në degët e punës, s'e ndal CI-në; rezultatet dalin në log si `LINT …`). U rregulluan:
   (1) `SasiaEDrejtperdrejte` (StokuEkrani): numri ruhej vetëm me "Done", tash edhe kur fusha humb fokusin (si `change` te web-i) dhe në
   prekje zgjidhet krejt numri (TextFieldValue). (2) `Skaneri.KameraPamja`: `mbyllur` te DisposableEffect: kamera e hapur dhe e mbyllur
   para se `ProcessCameraProvider` të gatitej s'lidhet më (mbetej e lidhur me aktivitetin, e ndezur në sfond); leximet e vonuara të ML Kit
   s'pranohen pas mbylljes; `fut.get()` me try. (3) Shpejtësia: `nrNeFolder` (Kryefaqja, më parë folder × produkte në çdo vizatim, edhe
   gjatë zvarritjes) dhe renditja/filtri i folderit me `remember` (s'renditet me Collator në çdo shkronjë të barkodit). (4) "Dil"
   (CilesimetEkrani): `MainScope` në vend të scope-it të ekranit (kalimi në një tab tjetër gjatë pritjes 9 s e anulonte daljen).
   (5) `Fotot.pergatit` në Android 8 (pa ImageDecoder): leximi me `inSampleSize` + `catch OutOfMemoryError` (rrëzim me foto të mëdha).
   (6) lint `StateFlowValueCalledInComposition` (NjoftimetUI): `perdoruesi` me `collectAsState`. Paralajmërimet e tjera të lint-it
   (POST_NOTIFICATIONS < 33 vetëm kur gjendja është "fikur", `commit()` te trajtuesi i rrëzimit, `StaticFieldLeak` me applicationContext,
   AutoboxingStateCreation) s'janë gabime. S'është testuar në telefon.

0000000. **KAMERA NË KREJT EKRANIN (v270 = 1.45.2, 29.10.2026, vetëm web telefoni)**: përdoruesi (2 foto, Skanim i shpejtë dhe
   kamera e zakonshme në web): "a pe sheh zi nalt ... mundohu mi eliminu let doket kamera komplet nqat hapsiren e zez".
   - Kamera e zakonshme: `#kamera .kamera-krye` tash `position: absolute` mbi kamerë (si Skanimi i shpejtë që te v264), pa shirit të zi
     më vete; kamera nga lart deri poshtë, kutia në mes (`index.html`).
   - Shiriti i orës (i zi, `theme-color` #000): faqja s'mund të vizatojë nën të në PWA të Android-it, prandaj `kameraNeEkranTePlote()`
     (Fullscreen API, `navigationUI: 'hide'`) thirret te `hapKamere()` nga prekja e përdoruesit, vetëm kur `(pointer: coarse)`; te
     `ndalKamere()` `kameraDilNgaEkraniIPlote()` del vetëm nëse ekranin e plotë e hapi kamera (kyçja e PDA-së s'preket). iPhone s'ka API:
     aty mbetet `black-translucent` + `viewport-fit=cover`. Android-i (vendas) e kishte tashmë kamerën nën shiritin e orës.
   - Testi `teste/v270.js`; `v264.js` pret edhe kamerën e zakonshme nga lart; `kamera-e-rreme.js` pranon `{ prekje: true }`.
     S'është testuar në pajisje të vërteta.

0000000. **FOLDERI: PYETJA E FSHIRJES SI TE ANDROID-I, TITULLI PA NUMËR, "KËRKO" ME 🔍 (v269 = 1.45.1, 29.10.2026, web telefoni
   + Android Hyrja 29)**: përdoruesi (3 foto): "Bone identik si ne android app qysh osht e thjesht qashtu" (pyetja "Të fshihen të
   gjitha?" te web-i dilte si dritare nga poshtë me butona teksti), "mos ta cekin sa produkte jan po veq emrin e folderit", pastaj për
   fushat Barkodi/Kërko zgjodhi nga 3 foto "opsionin 3".
   - Web `#dlgFshirje`: dritare në mes si `Konfirmo` (46 nga anët, rrezja 24, 22 brenda, titulli 20, teksti 15), "Anulo" `btn dyte`
     (0.7) + `#fshiKonfirmo` `btn kuqe` (1.3, e kuqe me shkronja të bardha, gri gjatë numërimit "Fshi të gjitha (5)"), 10 brenda që
     numri të mos pritet. Teksti `fshirjaTekst` pa shënimin "Nëse do një kopje… Excel" (si te Android-i). Android `Konfirmo` me
     `vonesa`: 0.7 / 1.3 dhe `Buton(brenda = 10.dp)` (parametër i ri, 16 si më parë).
   - Titulli i folderit vetëm emri (web `renderLista`, Android `FolderiEkrani`).
   - Fushat (opsioni 3): rreshti `.barkodi-rresht` = Barkodi + `#btnKerko` 50 × 50 (rrezja 14, 🔍 21; i kaltër `aktiv` kur hapet);
     `#kerkoFushe` `hidden` derisa prek 🔍 ose `#kerko` ka tekst (p.sh. skanimi pa leje "stokuNdrysho" e mbush). Prekja e dytë / Escape
     e mbyll dhe e pastron. Web `rifreskoKerkimin()` / `ndryshoKerkimin()` (thirret edhe nga `renderLista` dhe `hapFolderin`);
     Android `kerkoHapur` + `kerkoDuket = kerkoHapur || kerkimi.isNotEmpty()`, kursori te "Kërko" kur hapet.
   - Testi `teste/v269.js`; `v268.js` (pozicionet: lista 60 më lart), `fuzz-te-dhena.js`, `pda-tastiera-test.js`, `audit.js` prekin 🔍 para
     "Kërko". S'është testuar në pajisje të vërteta.

0000000. **BUTONI LUNDRUES I NDARË TE FOLDERI + TELEFONI SI ANDROID-I NË MADHËSI (v268 = 1.45.0, 29.10.2026, web telefoni + Android
   Hyrja 28)**: përdoruesi s'i deshi pllakat ("spom pelqen"), zgjodhi nga 10 idetë e reja të Claude Design idenë 5 ("butonat lundrues")
   si një buton i vetëm: "5 butonat lundrues bone ne nje buton gjys t'kalter gjys te verdh ... hiq veq me ikona", pastaj "perfekt osht
   tasht, bone nr 5" + "web appi ne telefon me madhesi te njejt si android appi ... per shkronjat edhe ui".
   - Folderi: poshtë djathtas `#skanFab` (web) / `ButoniLundrues` (Android, `StokuEkrani.kt`): 68 i lartë, rrezja 34, gjysma blu
     `#btnKamera` 76 (ikona 30) + vija 2 me ngjyrën e sfondit + gjysma e verdhë `#btnSkanimShpejt` #E8A92E (njësoj në temë të errët)
     76; vetëm ikona, emrat te `aria-label`. 20 nga djathtas dhe nga fundi. Pa leje
     "skanimShpejt" vetëm rrethi blu 68; pa "kamera" dhe në PDA s'del fare (PDA: "Fshih/Shfaq tastierën" `#btnTastiera` poshtë barkodit).
     `rifreskoFabin()` te `app-tel.js` (thirret nga `rifreskoPamjen`, `zbatoPda`, `zbatoLejet`); `html.me-fab` → `#lista` 100px poshtë.
   - "Eksporto Excel" / "Eksporto PDF": ikona 42 (gjelbër / kuqe) pranë titullit (`#kryeButonatFolderi`); mbrapa 42.
   - "Fshi të gjitha produktet": përdoruesi zgjodhi nga 3 foto opsionin 1 ("opsionin 1 bone, edhe leja veq 5 sekonda me tu aktivizu
     butoni kur te pyt a je i sigurt"): shiriti poshtë (`#footerFolderi`) u hoq; mbi listë koka `#listaKrye` "Produktet" (17/700)
     + lidhja e kuqe `#btnFshiTeGjitha` (kosh 16 + "Fshi të gjitha" 13/600, emri i plotë te title/aria-label, gri kur folderi është
     bosh), si "+ Folder i ri". Android: `TitulliISeksionit("Produktet") { … Ik.Kosh … }` + Hapesire(4). Butoni lundrues tash 20
     nga fundi (lista 104 poshtë). Pyetja: web `hapFshirjen()` 5 sekonda (ishte 10), "Fshi të gjitha (5)" … (1); Android
     `Konfirmo(…, vonesa = 5)` (parametër i ri, butonat 0.8 / 1.2 që teksti me numër të mos pritet).
   - Pllakat e v265/v267 u hoqën krejt (`#folderPllakat`, `.sb-pllaka*`, Android `PllakaVeprimi`, `PllakatDyNeRresht`); testet
     `v265.js`/`v267.js` u fshinë (dhe nga `regresioni.sh`).
   - Madhësitë si në Android (krahasuar pamje për pamje me `PamjetTest` në 2x): `.sb body { line-height: 1.275 }` (Onest
     0.97 + 0.305; "normal" i Chrome-it rrumbullakohej lart, p.sh. 12 px → 16 në vend të 15.3; barkodet mono 1.32), shiriti poshtë
     64 + vija (ikona 26, shenja 18), butonat lart 46 (Stoku, Grupi) / 42 (folderi) / 44 (cloud te Afatet), fushat 50 (ikona 20),
     rreshti i produktit 12 + 50 + 12, − / + 30, dritarja e produktit − / + 44×50, Afatet (koka 12 + 44, kartat 140/65, 16 px),
     "Afat i ri" (titulli 26, hapësira 14 si `Flete`, sasia 70, barkodi mono 18), titujt Cilësimet 26 / Grupi 28/800, "Fshi të
     gjitha produktet" 16 + 15 px + 16. Blloku në fund të `css/stoku.css` (v=54).
   - Testi `teste/v268.js`; `v263.js`, `v266.js`, `skedaret-e2e-v229.js` lexojnë `aria-label`; `tre-test.js` pret shiritin 65 (ishte 66);
     `kamera-e-rreme.js` pranon `{ dpr: 2 }`. Regresioni `teste/regresioni-v268.txt` njësoj si v267 (përveç testeve të reja/fshira).
     S'është testuar në pajisje të vërteta.

0000000. **EMRAT E QARTË TE PLLAKAT, NJË TEKST (v267 = 1.44.2, 29.10.2026, web telefoni + Android Hyrja 27)**: përdoruesi (foto e folderit):
   "Rregulloja emrat butonave, se sdi palidhje jan te emrume, edhe leje veq 1 font jo 2 tmadhe edhe tvogel". Pllakat e folderit kanë
   tash vetëm emrin, 15px/600: "Skano me kamerë", "Skanim i shpejtë", "Eksporto Excel", "Eksporto PDF" (PDA: "Fshih/Shfaq tastierën");
   u hoqën shpjegimet e vogla (`.sb-pllaka__n`; Android `PllakaVeprimi(ikona, ngjyra, emri, …)` pa `nentitulli`, emri deri 2 rreshta).
   Web: STATIKE `skanoKamer`, `skanimShpejt`, `pllExcel`, `pllPdf`; `css/stoku.css` v=52. Testi `teste/v267.js`; `v265.js`, `v263.js`,
   `skedaret-e2e-v229.js` me emrat e rinj; `PamjetTest.eksportet` klikon sërish "Eksporto Excel". S'është testuar në pajisje.

0000000. **KAMERA NJEH KREJT BARKODET PËRVEÇ QR; AFATET PA PLLAKA (v266 = 1.44.1, 29.10.2026, web telefoni + Android Hyrja 26)**:
   përdoruesi: "Veq te afatet mos e bo bine veq te stoku" dhe "mi njoft krejta barkodet qe egzistojn perveq qr code". (1) Afatet:
   `#afShto`/`#afExcel` (web) dhe `AfatetEkrani.kt` (Android, `KartaVeprimi`) u kthyen si para v265; `.sb-actions` sërish 1.4fr/1fr;
   pllakat mbeten vetëm te folderi. (2) Formatet: web `FORMATET_E_BARKODIT` = krejt formatet e standardit BarcodeDetector (shtuar
   `data_matrix`, `pdf417`, `aztec`); ZXing (iPhone) `FORMATET_E_BARKODIT_WASM` edhe `databar`, `databar_expanded`, `databar_limited`,
   `maxi_code` (me rikthim te lista standarde kur versioni s'i njeh; Micro QR / rMQR jo, janë QR); html5-qrcode edhe DATA_MATRIX,
   PDF_417, AZTEC, RSS_14, RSS_EXPANDED, MAXICODE; Android ML Kit edhe FORMAT_DATA_MATRIX, FORMAT_PDF417, FORMAT_AZTEC (ML Kit s'ka
   DataBar). QR-ja lexohet ende vetëm për njoftimin "Ke skenuar një kod QR". Kodet 2D kanë shpesh tekst të gjatë/me hapësira: nga
   kamera s'kontrollohen më me `duketSiDiçkaTjeter` (Android `hapBarkodin(.., "kamera")`, Skanimi i shpejtë web + Android), vetëm
   "::" (ndarësi i çelësit `folder::barkodi`) refuzohet; fusha e barkodit (skaneri i jashtëm/PDA) e mban kontrollin. Kamera e rreme
   ruan `window.__formatet`. Testi `teste/v266.js`; `v265.js` (Afatet pa pllaka). S'është testuar në pajisje (sidomos Data Matrix
   i vogël në kutinë e gjerë).

0000000. **PLLAKAT ME NGJYRA TE BUTONAT (v265 = 1.44.0, 29.10.2026, web telefoni + Android Hyrja 25)**: përdoruesi (foto e folderit, "shum
   tbajatshem") kërkoi 5 ide me Claude Design (faqja "Butonat e folderit: 5 ide", e çelët/e errët), pastaj: "Opsionin 4 bone jo veq te
   folderat po kudo qe jan kta butona". Ideja 4 = pllakë (sfond i bardhë/i errët, 1px vijë, 20px qoshe, min 76px) me katror 44px me
   ngjyrë (blu = theksi, e verdhë = `--stk-qelibar` me ikonë #2b2100, e gjelbër #1e7f45, e kuqe #c23030, gri), titull 15/700 dhe
   shpjegim 12px, dy nga dy. Web: `.sb-pllakat`/`.sb-pllaka` te `css/stoku.css` (v=50); folderi `#folderPllakat`: `#btnKamera` "Skano /
   Me kamerë", `#btnSkanimShpejt` "I shpejtë / Kamera s'mbyllet", `#btnTastiera` (vetëm PDA) "Fshih tastierën / Tastiera në ekran",
   `#btnEksport` "Excel / Tabela e stokut", `#btnEksportPdf` "PDF / Etiketat me barkod"; titujt te `#...T` (STATIKE `pllSkano`…,
   `zbatoTastieren`, "Duke krijuar…" i PDF-së). Afatet: `#afShto` "Shto / Afat i ri", `#afExcel` "Excel / Importo, eksporto" (menyja si
   më parë); `.sb-actions` 1.25fr/1fr. "Fotografo fletën" mbeti kartë e madhe blu. Android: `PllakaVeprimi` + `PllakatDyNeRresht`
   (Perberesit.kt), `Ik.Pdf`; `FolderiEkrani` dhe `AfatetEkrani` (`KartaVeprimi` u hoq; rreshti me `IntrinsicSize.Min`, karta blu
   `fillMaxHeight`). PC-ja s'u prek. Testet: `teste/v265.js` i ri; `pda-tastiera-test.js`, `skedaret-e2e-v229.js`, `v263.js` lexojnë
   titullin e pllakës; `PamjetTest.eksportet` klikon "Tabela e stokut". S'është testuar në pajisje.

0000000. **SKANIM I SHPEJTË: KAMERA MË E VOGËL, DERI LART (v264 = 1.43.1, 29.10.2026, web telefoni + Android Hyrja 24)**: përdoruesi
   (2 foto): Android "ngushtoje edhe pak heke hapsiren e kameres ... [poshtë tekstit] se nuk vyn ... kjo posht let zmadhohet" (edhe web);
   web "qajo pjesa zez [shiriti me 'Skanim i shpejtë', 1×, Mbyll] ... mu dok krejt kamer si ne android app". Android: lartësia e
   kamerës = shiriti i sipërm + `KONTROLLET_LART` (76 dp) + kutia (78% e gjerësisë × 0.55) + `NEN_KUTI` (68 dp); kutia fillon te
   `kutiaSiper` (parametri i ri i `KameraPamja` / `kutiaESkanimit` / `brendaKutise`; kamera e plotë: null, si më parë). U hoq
   ngushtimi me tastierën e hapur (kamera tash është gjithsesi e vogël). Web: `#kamera.shpejt` me `--ss-siper` (shiriti + 68px) dhe
   `--ss-kuti` (min(46vw, 185px)): `.kamera-krye` `position: absolute` mbi kamerë, `.kamera-video-shtrat` = siper + kuti + 68px,
   `.skan-mbulese` me kutinë lart. Kamera e zakonshme e web-it s'u prek (shiriti i zi mbetet aty). Testi `teste/v264.js`.
   S'është testuar në pajisje.

0000000. **ORA: U ANULUA NDRYSHIMI I v262 (28.10.2026, vetëm `ora/`)**: përdoruesi: "te aplikacioni ores kthej te mas qato
   ndryshimet e fundit ... qajo me ngjyre gri edhe te verdh se e ke keqkuptu". `MainActivity.kt` dhe `StokuKomplikacion.kt` u kthyen
   si para v262 (commit-i `7fb670f^`): "PËR T'U HEQUR · N" = skadojnë sot + kanë skaduar, seksioni gri "KËTË JAVË" u rikthye,
   komplikacioni sërish sot + të skaduarat. Pjesa e orës te hyrja v262 më poshtë s'vlen më.

0000000. **SKANIM I SHPEJTË NË WEB (v263 = 1.43.0, 28.10.2026, telefoni)**: si Android-i (Hyrja 22, shiko më poshtë), e njëjta
   kërkesë dhe zgjedhjet (ruhet menjëherë; +1 jo më shpesh se 1.5 s sa kohë shihet). `#btnSkanimShpejt` (nën rreshtin "Skano me
   kamerë"; fshihet në PDA te `zbatoPda` dhe pa `lejaSkanimShpejt()` = `kamera` + `stokuShto`/`stokuNdrysho` te `zbatoLejet`, që e
   mbyll edhe kur leja hiqet). `#kamera.shpejt`: kamera 42dvh lart (min 220px), `#skanShpejt` poshtë: `#ssGjithsej`, `#ssNen` (folderi ·
   produktet), `#ssMbaro`, `#ssBosh`, `#ssLista`. `kuSuksesiSkanimi` (pas votimit 7 nga 10, kutisë dhe QR-së) → `pranoShpejt` (i njëjti
   `nrBarkodi`/NUMRIM_INTERVALI_MS/NUMRIM_PUSHIMI_MS si numërimi) → `shtoShpejt(barkodi, sasia)`: i ri me `emriNgaProduktet`/
   `furnizuesiNgaAfatet` (pa `mesoNgaPerdoruesi`), ai që ekziston +N (s'bëhet negativ), lejet si te `ruajProduktin`, kontrolli
   `duketSiDiçkaTjeterVeçBarkod`. Rreshtat krijohen një herë (`krijoRreshtinShpejt`, `data-barkodi`, vetëm `textContent`): i riu lart,
   ai që ekziston mbetet në vend (`ss-fundit`), që fusha ku po shkruhet të mos e humbë fokusin; `scrollIntoView` vetëm kur s'po
   shkruhet. Fusha "+ copë": numër (edhe negativ), Enter ose "Shto" (klasa `me-tekst`). Selektori `.ss-rresht input.ss-shto`, sepse
   `input[type="text"]` e përgjithshëm ka `width: 100%`. `ndalKamere` → `mbyllSkanimShpejt` (X, "Mbaro", mbrapa); `renderLista`
   rivizaton panelin (edhe pas sinkronizimit). Testi `teste/v263.js` (kamera e rreme: i ri pa emër, 1.5 s, ekzistuesi, s'del dy
   herë, +5/-1, −/+, vetëm numra, jashtë kutisë, QR, Mbaro/X, kamera e zakonshme pa panel, PDA, lejet, versionet).
   **Pas provës së përdoruesit në Android** (foto, rrethi te numri): "anash numrit ja shton ato butonat plus minus" (web + Android) dhe
   "e shtin nlist aty te perdoruesit ... me ja nal e me ja lshu dikujt". Butonat **− / +** te çdo rresht (`sasia-hap-btn ss-pm` /
   `ButonPM`): ±1 te seanca dhe te stoku; "−" joaktiv kur sasia e seancës është 0. Leja e re **`skanimShpejt`** "Skanim i shpejtë"
   te `lejet.js` (v=5) dhe `Lejet.kt` (fikstura e re), grupi "Skanimi dhe skedarët", `prindi: 'kamera'`; si çdo leje e re, e
   lejuar kur mungon (krejt llogaritë e kanë). `lejaSkanimShpejt()` = `skanimShpejt` + (`stokuShto` ose `stokuNdrysho`); Android
   njësoj te `FolderiEkrani`, dhe `SkanimiShpejt.shto` e mbyll kur leja hiqet ndërkohë. Android: Hyrja 23. `kamera-e-rreme.js`:
   `hapFaqen(chromium, { uid, emri, lejet })` për llogari që s'janë administratori. **Shiriti i sipërm** (foto e dytë: ora/bateria
   mbi kamerë pa hije): Android, te Skanimi i shpejtë kamera tash zë edhe vendin nën shiritin e sipërm (`statusBars` + lartësia) dhe
   hijezohet si pjesa jashtë kutisë; kontrollet me `statusBarsPadding`. Arsyeja: kuadri i `PreviewView` (SurfaceView, FILL_CENTER)
   del jashtë kufijve të vet dhe dukej aty pa hije. Web: `rifreskoMetaTemen` e bën `theme-color` #000000 sa kohë `#kamera` është
   e hapur (thirret te `hapKamere`/`ndalKamere`), që shiriti i telefonit të mos dalë i çelët mbi kamerën e zezë. S'është testuar
   në pajisje.

0000000. **ANDROID: SKANIM I SHPEJTË BRENDA FOLDERIT (Hyrja 22, 28.10.2026, `vendas/`; web-i vjen me v263)**: përdoruesi (foto e
   folderit): "e shton ni buton Skanim i shpejt ... e qel kameren me engine e krejta te njejtat ... kutia ... me kon nalt edhe mos
   mu mshel kamera asniher ... posht ... produktet qka i ke skanu edhe sasin ... i njejti veq me ju shtu sasia ... pa pop up ...
   sa copa tjera ki me i shtu ... total ... pa emer ... veq te stoku" (jo te Afatet). Zgjedhjet e tij: ruhet **menjëherë**;
   përsëritja **si numërimi +/-** (+1 jo më shpesh se 1.5 s sa kohë shihet). `SkanimiShpejt.kt`: `Skaneri(shpejt, paneli)` (kamera
   ~44% lart, 30% me tastierën e hapur; paneli poshtë me `imePadding`), `KameraPamja` me `shpejt` s'vendos `perfunduar` (i njëjti
   votim 7 nga 10, vetëm brenda kutisë, `nrBarkodi`/NUMRIM_INTERVALI_MS si numërimi). `shto(barkodi, sasia)`: produkti i ri me
   `emriNgaBarkodi`/`furnizuesiNgaBarkodi` (përndryshe pa emër; s'mësohet te regjistri), ai që ekziston `vendosSasine` (+N, s'bëhet
   negativ); lejet `stokuShto`/`stokuNdrysho` si te dritarja. Lista: i riu lart, ai që ekziston mbetet në vend dhe shënohet
   (`accentTint`), lista shkon te ai (jo kur tastiera është hapur); fusha "+ copë" (edhe negativ, për korrigjim), "Shto" del vetëm
   me tekst; lart "Gjithsej: N copë", folderi · produktet, "Mbaro". Butoni te `FolderiEkrani` (nën "Skano me kamerë", jo në PDA,
   me lejen `kamera` + `stokuShto`/`stokuNdrysho`), gjendja `skanimiShpejt` te `Rrenja` (mbyllet kur njoftimi hap tab tjetër).
   Edhe: `ToastPamja` tash brenda `Skaneri` (njoftimet, p.sh. kodi QR, s'mbeteshin më nën kamerë). Prova: `PamjetTest.skanimiShpejt`
   (light-24-skanimi-shpejte). S'është testuar në pajisje.

0000000. **SKANIMI: 7 TË NJËJTA NGA 10 TENTIME, "SKANO PËRSËRI", VETËM BRENDA KUTISË; ORA: VETËM TË SKADUARAT (v262 = 1.42.2,
   28.10.2026, web + Android + ora)**: përdoruesi (2 foto: kutia e Android-it; web-i që kap barkodin poshtë kutisë): "prej 10
   tentimeve minimum ... 7 her barkodin e njejt ... perndryshe ... skano perseri edhe mos e le me bo sound", "mos e le jashta
   boxit me u marr kurgjo". **Votimi** (`krijoVotimin` te app-tel.js = `VotimiIBarkodit` te vendas/logjika, API e re `tentim(kodi|null)`):
   votimi nis me leximin e parë brenda kutisë; çdo kuadër i shqyrtuar pas tij është një **tentim** (edhe pa barkod: motori nativ/
   ZXing çdo `detect()`, html5-qrcode edhe `kuGabimiSkanimi`, ML Kit çdo `process()`); **7 të njëjta → pranohet** (bip); kur 7 s'arrihet
   dot më (maksimumi + tentimet e mbetura < 7) → **"Skano përsëri"** te `#skanHint` (klasa `perseri`, e kuqe, 1.5 s; Android: teksti
   nën kuti), **pa zë**, dhe votimi nis sërish me leximin e radhës. S'ka më pranim me 1 lexim (as EAN i saktë) dhe s'ka kohëmatës:
   "0.5 s" = 10 tentime në një telefon të zakonshëm; në telefona të ngadaltë (p.sh. html5-qrcode me 10 kuadra/s) 10 tentimet zgjasin
   më shumë, që skanimi të mos bllokohet (kufi i fortë 0.5 s do ta bënte të pamundur atje). **Vetëm brenda kutisë**: web
   `figuraNenKuti` llogarit edhe `kutiaNeFigure` (figura ka 10%/35% hapësirë rreth kutisë që i ndihmon detektorit), `barkodiBrendaKutise`
   pranon vetëm barkodin që është i tëri brenda (4% lejim), ai më afër mesit; Android: ML Kit lexon krejt kuadrin, prandaj kutia e
   barkodit (koordinatat e figurës së drejtë) kthehet në pikselat e `PreviewView` (FILL_CENTER: shkallë "cover" në mes; pamja dhe
   analiza me `AspectRatioStrategy.RATIO_16_9_FALLBACK_AUTO_STRATEGY`) dhe krahasohet me `kutiaESkanimit()` (e njëjta me vizatimin).
   QR njoftohet vetëm brenda kutisë. Testet: `teste/kamera-e-rreme.js` (i përbashkët), `v260.js`/`v261.js` me rregullin e ri, `v262.js`
   (brenda/jashtë/gjysmë/dy barkode/QR/stili/versionet), `VotimiTest.kt`. **Ora**: lista kryesore "PËR T'U HEQUR · N" numëron vetëm
   të skaduarat (më parë + "skadojnë sot"); u hoq krejt seksioni gri "KËTË JAVË"; komplikacioni ("Për t'u hequr nga rafti") vetëm të
   skaduarat. Tile-i ("skadojnë sot", "+N këtë javë") mbeti si ishte. Çka ka të re: web v262 (tel), Android Hyrja 21. S'është testuar
   në pajisje (sidomos përputhja e kutisë në Android dhe shpejtësia e 7 leximeve në telefona të ngadaltë).

0000000. **VOTIM MË I RREPTË: 5 VOTA NGA DERI NË 10 LEXIME (v261 = 1.42.1, 28.10.2026, web + Android)**: përdoruesi pyeti për
   10 lexime; i shpjegova se saktësia pothuajse s'rritet (leximet brenda 1 s s'janë të pavarura) dhe e ngadalëson skanimin, dhe
   i propozova më të dobishmet: Android vetëm brenda kutisë (tash ML Kit lexon krejt pamjen: mund të kapë barkodin e produktit
   ngjitur), vetëm formatet e produkteve (EAN/UPC + QR), zmadhimi automatik. Ai zgjodhi **vetëm "Votim më i rreptë"** (të
   tjerat jo tani: mos i bëj pa pyetur). `VOTIMI_MAKS = 10, VOTIMI_FITON = 5` (app-tel.js) dhe `VotimiIBarkodit(maks = 10,
   fiton = 5)`; rregullat e tjera si v260 (1 s, barazimi, 1 votë vetëm EAN/UPC i sigurt). Me kamerën e rreme: 5 lexime → dritarja
   pas ~0.25 s; 4 → pas sekondës. Testet: `teste/v261.js` (i ri), `teste/v260.js` dhe `VotimiTest.kt` me numrat e rinj.
   Çka ka të re: web v261 (tel), Android Hyrja 20. S'është testuar në pajisje.

0000000. **SKANIMI ME VOTIM: BARKODI LEXOHET DISA HERË DHE FITON MË I SHPESHTI (v260 = 1.42.0, 28.10.2026, web + Android)**:
   përdoruesi: "kape barkodin 4-5 her ... brenda 1 sekondi edhe boni bashk qato numra ... vendose qato qe e ka kap mas shumti ...
   ne krejt projektin". Rregulli (i njëjtë në të dy): nga leximi i parë, brenda 1 s mblidhen lexime; kodi me **3 vota fiton
   menjëherë** (nga 5 lexime s'e kalon dot më asnjë tjetër); pas **5 leximeve** fiton ai në krye nëse është vetëm (me barazim
   pritet); kur mbaron **sekonda** fiton ai në krye (barazim: i sigurti, pastaj i pari). Kodi me 1 votë pranohet vetëm kur është
   "i sigurt" (EAN-13/EAN-8/UPC-A me shifrën e kontrollit të saktë); Code 128/39 etj. duan 2 lexime të njëjta (si më parë).
   QR s'kalon nga votimi (njoftohet menjëherë). **Web** (`app-tel.js`, i vetmi vend me kamerë në web; PC s'ka skanim me kamerë):
   `krijoVotimin()` (edhe `window.StokuVotimi` për testet), `votoLeximin()` për motorin nativ, ZXing-WASM të iPhone-it dhe
   html5-qrcode (`leximiNgaHtml5`); kohëmatësi i skadimit fshihet te `hapKamere`/`ndalKamere` (`rinisVotimin`), që kamera e
   mbyllur të mos hapë dritaren më vonë. U hoq `leximiIKonfirmuar` (2 lexime rresht / EAN menjëherë). Numërimi i vazhdueshëm
   (+1) merr çdo vendim të votimit si "u pa". **Android** (`vendas/logjika/VotimiIBarkodit.kt`, `VotimiTest.kt` me të njëjtat
   raste si `teste/v260.js`): `Skaneri.kt` → `pranoje()` + `skadimi` (postDelayed), u hoq `hera/iFundit`. Ora s'ka kamerë.
   Testet me barkode EAN të vërteta (3800001000019/26/33). Çka ka të re: web v260 (tel), Android Hyrja 19. S'është testuar në pajisje.

0000000. **ANDROID: PROVA E PAMJEVE "EKSPORTET" PUNON PRAPË (28.10.2026, vetëm `vendas/`, vetëm prova)**: `PamjetTest.eksportet`
   dështonte që nga vendas-v74 (Excel-i te Afatet u bë meny "Excel" → Importo/Eksporto): kërkonte butonin e vjetër "Eksporto Excel"
   (shënimi te CI: "Failed to inject touch input"; puna s'ndalej). Tash klikon "Excel" para "Eksporto Excel" / "Importo Excel".
   Aplikacioni s'ndryshon (merge-i në main nxjerr vetëm një numër të ri versioni). Logoja e re (paketa Stoku_brand_assets) u bë dhe
   u anulua në të njëjtën ditë me kërkesë të përdoruesit ("e ka bo mut"): mos e rikthe pa kërkesë.

0000000. **ANDROID: KONTROLLI I PLOTË I APLIKACIONIT, MË I QËNDRUESHËM (27.10.2026, vetëm `vendas/`)**: përdoruesi: "Kontrolloje
   komplet appin android per bugs edhe permirsoj". Rishikimi s'gjeti rrëzime të sigurta (funksionet suspend kanë try/catch, cast-et
   janë të mbrojtura); u rregulluan këto: (1) `object Dita` (MainActivity.kt): dita e sotme si gjendje; ora e mesnatës (+2 s) dhe
   `onResume` e rifreskojnë, tabi vizatohet nga e para me `key(sot)` dhe `nAf` e ka `sot` te çelësat. Me një `Flete` të hapur
   (`Dita.hapura`, numërohet te `Flete` para kontrollit të skanerit) pret derisa të mbyllet, që të mos humbet çka po shkruhet.
   (2) `Merchandiseri.kontrolloGps`: `Toast.pastro(DUKE_GJETUR)` pas `pritPikat()` ("Duke e gjetur vendndodhjen…" s'mbetet 15 s kur
   del "Ku je?"); `Toast.pastro(t)` e heq vetëm atë tekst. (3) `Perditesimi`: kontrolli te `onResume` (jo më te `onCreate`, ku
   përsëritej), shkarkimi me AlertDialog + ProgressBar (MB, %), "Anulo" (AtomicBoolean), skedari i paplotë fshihet.
   (4) `ImportiAfateveFlete`: `lexoSkedarinEImportit` në `Dispatchers.IO` (leximi me kufi 40 MB gjatë leximit, `OutOfMemoryError` →
   "Skedari është shumë i madh për këtë telefon."), butoni "Duke e lexuar…", `plani` me `remember`. (5) Rrjeta e sigurisë:
   `StokuApp.trajtuesi(meToast)` (CoroutineExceptionHandler; ruan "gabimi_i_fundit", te testet e hedh gabimin) te scope-et e
   moduleve (Grupi, Merchandiseri, Push, Regjistri, Admini, Sinkronizimi, Llogaria: pa toast; Skedaret.fusha: me toast) dhe
   `rememberFusha()` (Perberesit.kt) në vend të `rememberCoroutineScope()` te krejt ekranet: "Diçka s'shkoi mirë. Provo përsëri.".
   Cilësimet: poshtë versionit "Një gabim u ndal pa e mbyllur aplikacionin · Shiko" (teksti + "Fshije"). Rrëzimet e vërteta mbeten
   te `rrezimi_i_fundit` / `EkraniIRrezimit`. Çka ka të re 18. S'është testuar në telefon.

0000000. **ANDROID: DRITARET NGA POSHTË S'SHKOJNË NËN KAMERË (27.10.2026, vetëm `vendas/`)**: përdoruesi (foto e "Çka ka të re"):
   "po shkon shum nalt permi kamer permirsoje". `Flete` (ModalBottomSheet) merr `Modifier.statusBarsPadding().padding(top = 16.dp)`:
   kur përmbajtja është e gjatë, dritara ndalet nën shiritin e orës (vlen për krejt `Flete`). Çka ka të re 17. S'është testuar në telefon.

0000000. **WEB: ADMINISTRATORI I FSHIN VETË PRODUKTET E PROVËS NGA "PRODUKTET E REJA" (v258 = 1.41.2, 27.10.2026)**: përdoruesi: "Te foto
   2 a mos e ke lon pa e rregullu edhe ne web a?". Web-i s'e kishte gabimin (porta.js e fshin 'stoku:kujtesa:v1' dhe e rinis faqen
   kur hyn pas provës; ekipa s'niset në faqen e vizitorit), por pastrimi i asaj që kishte hyrë ishte vetëm te Android-i (vendas-v72).
   Tash edhe `ekipa.js` (tel + PC): `PROVA_PRODUKTET` (13 barkodet me emrat e `mbushProven`) + `PROVA_FURNIZUESIT` (A/B/C),
   `eShembullIProves(k, x)`; `pastroProven()` në fund të `zbatoPritjet` (administratori: `K.fshij` / `K.fshijFurnizuesin`, fshirja
   s:1 shkon te regjistri) dhe `planifikoRegjistrin` i të tjerëve s'i dërgon te pritja. Vetëm kur barkodi dhe emri janë saktësisht
   si te prova. "Çka ka të re" v258 (vetemAdmini). Testi `teste/v258.js` (pa ndryshimin: 7 GABIM, si te fotoja; me të: krejt OK).
   S'është testuar me Firebase-in e vërtetë.

0000000. **ANDROID: AFATET PA "SKANO" + "EXCEL" NË NJË BUTON, FLLUSKA E ROLIT, PROVA S'HYN TE REGJISTRI (27.10.2026, vetëm `vendas/`)**:
   përdoruesi (3 foto): (1) roli te Kolegët dilte si toast poshtë: "ndreqe me dal si ne web app afer emrit"; (2) te web-i (Cilësimet →
   Stoku) "Furnizuesit e rinj 3" dhe "Produktet e reja 13" ishin të dhënat shembull të provës si vizitor: "mos i shti … vlen veq kur
   dikush do me provu"; (3) "hiqe wat butonin skano … importo excel dhe eksporto excel boni ne nje buton si ne web app".
   - **Afatet** (`AfatetEkrani.kt`): si `.sb-actions` (majtas "Fotografo fletën" 1.4, djathtas "Shto" + `MenyjaExcel`: "XLS Excel" me
     DropdownMenu "Importo Excel" / "Eksporto Excel", sipas lejeve afatetImporto/eksportExcel). Karta "Skano" u hoq.
   - **Roli** (`IkonaERolit` → `FlluskaERolit`): Popup me `PopupPositionProvider` (sipër ikonës, poshtë kur s'ka 72 dp lart, 12 dp nga
     skajet, shigjeta drejt ikonës si `--zhvendosja`), mbyllet me prekje tjetër ose pas 5 s (jo në testet: `StokuApp.neProve`).
   - **Shkaku i (2)**: te Android, gjatë provës `Regjistri.planifikoMesimin` ("plotëso") i mësonte produktet shembull në `kujtesa.json`;
     pas hyrjes me llogari `dergoRegjistrin` i dërgonte te `kujtesa_pritje/{uid}` dhe administratori i merrte "në pritje". Tash:
     `Dyqani.ProvaEVizitorit` (të dhënat shembull, edhe për `mbushProven`), `Regjistri.neProve()` (pronari VIZITOR ose vizitor) ndal
     krejt mësimin, `eShembull` i heq nga pritja, `pastroProven()`: administratori i fshin (si me dorë: tombstone s:1 → regjistri, zhduken
     edhe te web-i), të tjerët vetëm në telefon; një herë pas hyrjes dhe te çdo `zbatoPritjet`. Web-i s'ndryshoi (porta.js e fshin
     'stoku:kujtesa:v1' në hyrje dhe e rinis faqen, prandaj s'kishte këtë gabim).
   - Çka ka të re 16; pamja light-g8-roli, light-04-afatet. S'është testuar në telefon të vërtetë.

0000000. **ANDROID: "DIL" TE KARTA E PROFILIT (27.10.2026, vetëm `vendas/`)**: përdoruesi (me foton e Cilësimeve, rrethi i kuq djathtas
   te karta e profilit): "qite ni buton per me dal prej llogaris, hiqe ato mrena qe osht te llogaria". `Menyja` (`CilesimetEkrani.kt`):
   butoni "Dil" (ikona Dil, sfondi expTint) para "›" te karta e profilit, vetëm me llogari; konfirmimi "Të dilet nga llogaria?" me
   Push.caktivizo + Llogaria.dil u zhvendos këtu. Te `LlogariaFaqja` "Dil nga llogaria" u hoq. Web-i mbetet si ishte (`#cloudDilBtn`).
   Çka ka të re 15. S'është testuar në telefon të vërtetë.

0000000. **ANDROID: KREJT OPSIONET E WEB-IT TË TELEFONIT (27.10.2026, vetëm `vendas/` + fikstura e ekipa.js)**: përdoruesi: "Shtoj krejta
   opsionet qka i ka web appi mobile e qe sjan ne android app". Krahasimi u bë me funksionet e `app-tel.js`/`index.html` dhe me
   një skript që i kërkon tekstet e web-it te Kotlin-i. U shtuan (Çka ka të re 14):
   - **Kamera** (`ui/Skaneri.kt`): zmadhimi 1×/2×/3× (`DritaKamere.nivelet` nga `zoomState`, baza ≥ 1×, si `kontrolletKam`), drita vetëm
     kur ka blic, fokusi me prekje (`FocusMeteringAction`, 1.5 s), kodi QR = toast "Ke skenuar një kod QR…" (çdo 2 s) dhe kamera vazhdon,
     hint-i "Vendos vetëm një barkod brenda kutisë", **numërimi i vazhdueshëm** (`Skaneri(shtoNjeCope)`: produkti që ekziston në
     folder merr +1 jo më shpesh se 1.5 s sa kohë shihet, mbaron pas 3 s, "+N" mbi kornizë; lejet stokuNdrysho + stokuPlusMinus si
     `eLejuarSasiaShpejte`). `MainActivity`: `skanoMeNumerim` vetëm për folderin.
   - **Zvarritja e folderave** (`Kryefaqja`): `detectDragGesturesAfterLongPress`, karta ndjek gishtin (graphicsLayer), objektivi me
     vijë blu; në lëshim `Dyqani.renditFolderat` (para/pas si te web-i). Leja stokuFoldera.
   - **Fleta**: numrat e rreshtave mbi foton e zmadhuar (`NumratMbiFoton`, r.x/r.y si `vizatoNumratMbiFoton`); **"Ku do ta kontrollosh
     fletën?"** (`KuFletaDritarja`, me llogari + leja pc): AI këtu → `LeximiAI.fotoPerDergim` (JPEG < 800 000 shenja) →
     `LeximiAI.dergoFleten` = `dyqane/{uid}/fletet` { krijuarSe, nga, foto, rreshtat, lloji:"stok"? }, edhe për importin e stokut.
   - **Hyr si vizitor** (`Llogaria.vizitor`, pref "vizitor"; `Dyqani.mbushProven` = mbushProven i porta.js, pronari `Dyqani.VIZITOR`):
     porta ("ose", "Hyr si vizitor"/"Vazhdo provën si vizitor", pyetja kur ka të dhëna të një llogarie), shiriti "Vizitor · provë pa
     llogari…" + "Hyr", etiketa "Vizitor · provë", Cilësimet → Llogaria ("Je si vizitor", "Hyr ose krijo llogari", "Fillo nga e para"),
     Grupi "Grupi punon me llogari". Hyrja me llogari e mbyll provën (Sinkronizimi → `vendosPronarin` i fshin të dhënat e provës).
     Porta: "Më mbaj mend emrin e përdoruesit" (pref "mbaj_emrin", parazgjedhja po).
   - **Njoftimet**: `PyetjaENjoftimeve` (si dlgNjoftimet: Android 13+, pa leje dhe pa u pyetur, "Jo tani" = 3 ditë; pas "Çka ka të re";
     jo në testet e pamjeve: `StokuApp.neProve`) dhe "Lejo njoftimet në telefon" te zilja e Grupit.
   - **PDA**: "Afat i ri" pa butonin e kamerës, me "Skano barkodin me skanerin e PDA-së."; te folderi butoni "Fshih tastierën"/"Shfaq tastierën".
   - **Administratori te Grupi**: te afatet e kolegëve "Ktheje në raft"/"Shëno të hequr"/"Fshije" (`Grupi.adminNdryshoAfatin` me
     `Sinkronizimi.ndryshoDyqaninE` + `GrupiLogjika.ndryshoAfatinNeGjendje`, fikstura e re `grupi.adminAfat` te `vendas-fikstura.js`,
     `GrupiTest.adminAfat`; përmbledhja e kolegut, njoftimi "admin-afat" dhe aktiviteti), "Fshi" te Menaxho kolegët dhe "Llogaritë e
     tjera (vetëm administratori)" (Fto/Fshi, 15 + "Shfaq krejt"), `Admini.fshijLlogarine` = fshijLlogarine i ekipa.js.
   - **Llogaria e fshirë nga administratori** (`Llogaria.degjoFshirjen`, `ekipa_fshire/{uid}`): Push.caktivizo, fshirja e llogarisë
     së hyrjes (ose dalja), të dhënat hiqen (`vendosPronarin("llogari-e-fshire")`), porta: "Kjo llogari u fshi nga administratori."
   Mbeten jashtë qëllimisht: "Stoku" te Grupi (u hoq te web-i që te v183), instalimi i PWA-së, kyçja/rrotullimi i PDA-së i web-it.
   Pamjet e reja: light-37 (numrat), light-38/39/40 (vizitori). S'është testuar në telefon të vërtetë.

0000000. **ANDROID: MARKETI ME SHKRIM TE "AFAT I RI", KAMERA PA DRITAREN SIPËR (27.10.2026, vetëm `vendas/`)**: përdoruesi (2 foto
   të "Afat i ri" në Android): "Bone me shkru met dal marketi e jo si ne foto" (rreshti me çipa "Zgjidh marketin | Albi Market
   34 | …") dhe "Nuk u heka qekjo faqe kur klikoj me shtu afat permes kameres" (kamera hapej poshtë dritares).
   - `ZgjedhjaEMarketit` (`ui/MarketetUI.kt`): fushë me ikonën e vendit ("Shkruaj emrin e marketit"); në fokus/gjatë shkrimit
     del lista (`SUGJERIMET_MAKS` 6, "Edhe N të tjerë: shkruaj më shumë shkronja.", "Mbyll"), kërkimi pa shkronja të mëdha dhe pa
     ë/ç (`emriPerKerkim`, Normalizer NFD). Kur teksti përputhet saktë me një market, zgjidhet vetë; kur ndryshon nga emri i
     zgjedhur, marketi hiqet (ruajtja pyet sërish "Zgjidh marketin…"). "✕" e pastron. Web-i mbetet me `select#afatMarketi`.
   - Kamera: `Flete` (ModalBottomSheet = dritare më vete, prandaj dilte mbi `Skaneri`) s'vizatohet sa kohë
     `SkaneriIHapur.hapur` (vendoset nga `Skaneri`, që e fsheh edhe tastierën); gjendja e "Afat i ri" ruhet te `AfatiFlete`,
     pas skanimit dritarja del sërish me barkodin. Vlen për çdo `Flete`.
   - Çka ka të re 13; pamjet `afatiMeMarket` (light-34/35/36). S'është testuar në telefon të vërtetë.

0000000. **MARKETET FQINJE: GPS-I S'I DALLON → MBETET AKTIVI OSE "KU JE?" (v257 = 1.41.1, 27.10.2026)**: përdoruesi (me hartën
   satelitore, Viva Fly dhe Viva Fresh 110 matanë rrugës): "Me se shumti brenda 100m? Qka nese jem te njoni prej ktyne
   marketeve?", pastaj "Provoje a e kap … edhe testoje a bon mir a jo". Simulimi (marketet 55–65 m larg, 4000 matje GPS me
   gabim ±15…±60 m, në 5 vende brenda dy marketeve) tregoi se "më i afërti" zgjidhte fqinjin deri në 35% të rasteve me GPS
   të dobët brenda ndërtesës. Tash `gjejMarketin(l, poz, aktivId)` (marketet.js + `Marketet.kt`, fikstura "fqinjet" + `gjejM`):
   kur disa markete brenda rrezes ndryshojnë në largësi më pak se max(`PAQARTESIA_MIN_M` 10 m, `PAQARTESIA_K` 0.8 ×
   pasaktësia), mbetet aktivi (nëse është njëri prej tyre), përndryshe `{ paqarte, kandidatet }` → "Ku je?" me tekstin "Je afër
   disa marketeve dhe GPS-i s'i dallon dot. Zgjidh ku je: zgjedhja jote mbetet." (rregullat e vjetra: një herë në 3 orë pa
   e kërkuar). Rezultati: gabimet ≤ 10%, me marketin e duhur aktiv mbetet aty ≥ 88%. `gjej()` mbetet si ishte (fikstura).
   Testi `teste/v257.js` (njësitë, simulimi, telefoni). Android: `Merchandiseri.kontrolloGps`, `Dritarja.KuJe(paqarte)`,
   Çka ka të re 12. S'është testuar në telefon të vërtetë: koordinatat e vërteta të dy marketeve s'i kam (janë te Firebase).

0000000. **MARKETET + HARTA NË NJË FAQE, "JE TE" NË METRA, FOTOT E KOLEGËVE NË ANDROID (v256 = 1.41.0, 27.10.2026)**:
   përdoruesi (4 foto): (1) "fotografit e profilit qaty ku jan te rrethekum kolegt … nuk osht ka i qet ne app" (Grupi →
   Online tani në Android); (2) "i bon bashk harta dhe marketet, opsionin te cilesimet e len me emrin Marketet edhe me ikonen
   … brenda dyjave qka ka mrrena i ri-organizon"; (3) "nshpi jam ma qet marketin mat afert … kishe jom te viva fresh 2 …
   bone me metra nese sje nqat hapsir mos me ta qit".
   - **"Je te" (marketet.js + `logjika/Marketet.kt`, fikstura)**: `RREZJA_M` 250 → **60 m**, `PASAKTESIA_MAKS_M` 150 → **40 m**
     (më së shumti 100 m); me pasaktësi mbi `PASAKTESIA_E_PRANUESHME_M` (150 m) `gjej` = null. Zgjedhja me dorë (3 orë) bie kur
     GPS-i i saktë të tregon mbi `LARG_M` (300 m) + pasaktësia larg saj: `largNgaMarketi(l, id, poz)` → `pasGps(…, larg)`
     (app-tel.js `kontrolloGps`, `Merchandiseri.kontrolloGps`). Në shtëpi tash del "Krejt marketet" (dhe "Ku je?" sipas
     rregullit të vjetër, një herë në 3 orë).
   - **Web (telefoni)**: faqja `marketet` përmban gjithçka: `#mkIntro` (teksti sipas rolit), `#mkAktivKarta` (merchandiseri),
     harta (`#htHarta`, `htHapFaqen` kur hapet), `#htShtoKuti` (administratori), një listë e vetme `#htLista` (merchandiseri:
     "· je këtu" + afatet; administratori: ndryshimi i emrit / fshirja), `#mkShtoKuti` (merchandiseri, "Market i ri").
     `#tabHarta` dhe faqja `harta` u hoqën (`aktivizoTabin('harta')` → `marketet`); `#mkLista` s'ekziston më. Rreshti
     `#tabMarketet` (pa `data-leja`; klasa `leja-ndaluar` nga `lejaMarketet()` = administratori ose merchandiseri me Afatet),
     statusi i administratorit "Marketet në hartë". **PC**: skeda `opsSkedaHarta` quhet "Marketet" (ikona e gjelbër e
     marketeve), titulli i faqes "Marketet" (data-faqe mbetet `harta`). Testet e përshtatura: marketet-v241 (njësitë, zgjedhja
     me dorë 2 km larg tash bie, pritja pas "Gjej me GPS"), harta-v244/v247, v250, v251, v253, pikat-v246, v255; i ri `v256.js`.
   - **Android**: `ui/HartaUI.kt` (MapLibre Native `org.maplibre.gl:android-sdk:11.8.0`, stili i njëjtë si `harta.js`, sateliti
     me OkHttp që i shton Referer `https://stoku.site/` kërkesave të arcgis.com, `abiFilters` arm64-v8a + armeabi-v7a: APK-ja vendas-v56 është
     40 MB, më parë 32 MB; pa filtrin do të ishte shumë më e madhe), `MarketetFaqja` e bashkuar, administratori sheh "Marketet" (pikat i dëgjon edhe ai,
     `shtoPikenNgaAdmini`/`ndryshoEmrinEPikes`/`fshiPiken`). Në testet e pamjeve (Robolectric, pa OpenGL) harta del si kuti.
     Grupi: `Avatari`/`AvatariLehte` me `fotoEProfilit(uid ?: Fotot.uidPerEmrin(emri))`; `Fotot.rifresko()` kur hapet Grupi.
   - Regresioni v256: 77 me exit=0 (`skedaret-e2e-v229.js` dështon herë pas here te `page.goto` gjatë regresionit, edhe para
     këtyre ndryshimeve; vetëm kalon). S'është testuar në telefon të vërtetë (as harta në Android).

0000000. **APLIKACIONI I VJETËR I TELEFONIT (WEBVIEW) U FSHI (v255 = 1.40.0, 27.10.2026)**: përdoruesi: "A munesh me fshi
   gjithqka rreth appit tjeter qe sosht native aj webview qe osht, zhduke komplet, kto native app qe osht kto kem me perdor
   prej tash". U fshinë: kodi i `tel/` (`site.stoku.app`, MainActivity/Ura/FcmSherbimi/Perditesimi, Gradle), workflow-i
   `tel-apk.yml`, `android.js` (ura `window.StokuAndroid`: njoftimet, ndarja, tastiera e PDA-së, tokeni FCM), `android.json`
   (Firebase për APK-në e vjetër), `teste/android-test.js`, dhe te web-i: `ekipa.js` (FCM i WebView-it te `pajisjaPush`),
   `app-tel.js` (thirrjet `fshihTastieren`/`tastieraFshehur`, butoni "Kontrollo për përditësim" brenda WebView-it), SHELL i
   `sw.js`. Release-t `tel-vNN` (10 copë, tel-v3 deri tel-v23) dhe tag-et e tyre **i fshin pronari me dorë** te GitHub →
   Releases (sesioni s'kishte leje për fshirje); `android.html` s'i përdor më. **Mbeten qëllimisht te `tel/`**: `stoku-tel.jks`, `celesi-i-ri.p12.enc`,
   `celesi.lineage` (me to nënshkruhet aplikacioni `vendas/`: pa to telefonat s'e pranojnë përditësimin) + `tel/README.md`.
   **APP_ID-ja e Android-it te Firebase** (`1:107114545225:android:c661…`, e regjistruar për `site.stoku.app`) përdoret nga
   `vendas/` (`StokuApp.kt`): pronari s'duhet ta fshijë atë aplikacion te Firebase Console. `android.html` +
   `faqja-android.js` tash shkarkojnë APK-në më të re `vendas-vNN` ("Versioni 0.1.NN") dhe këshillojnë çinstalimin e të
   vjetrit; butoni i Chrome Android "Shkarko aplikacionin Android" mbetet. Worker-i s'ndryshoi (FCM i shërben `vendas/`).
   `apk-celesat.yml` nis tash `vendas-apk.yml`. Testi `teste/v255.js`; `pda-tastiera-v238.js` kontrollon që ura s'thirret.
   Shënimet e mëhershme për `tel/`, `android.js`, `android.json` më poshtë janë vetëm histori. S'është testuar në telefon.

0000000. **PA DATAT E SHPEJTA TE "AFAT I RI" (v254 = 1.39.2, 27.10.2026)**: përdoruesi (me foton e "Afat i ri" në Android):
   "Hekja qeto ne krejt projektin", pastaj zgjodhi "Datat e shpejta". U hoqën kutitë 1 javë / 2 javë / 1 muaj / 3 muaj:
   web-i i telefonit (`#afatDatat` te index.html, `AF_DATAT_SHPEJTA`/`dataEShpejte`/`vizatoDatatEShpejta` te app-tel.js,
   `.sb-date*` te css/stoku.css; `hapAfatin` thërret tani `rifreskoDatenEAfatit()` për "Skadon për N ditë") dhe aplikacioni
   Android (`AfatetEkrani.kt`, Çka ka të re 10). Kompjuteri s'i kishte. Fusha DD-MM-VV dhe teksti i ditëve mbeten.
   Testi `teste/v254.js`; seksioni B i `v215-test.js` (datat nga 31 janari) u hoq. S'është testuar në telefon të vërtetë.

0000000. **STOKU PËR ANDROID: CILËSIMET SI TE WEB-I (27.10.2026)**: kërkesa: "Kshyri edhe niher komplet cilesimet edhe i bon
   sa ma identik te mujshme". Cilësimet janë navigator me faqe të plota (`CilesimetEkrani.kt`: `faqja` + PRINDI si
   PRINDI_I_FAQES, BackHandler), menyja me profilin (foto), "Aplikacioni" (Pamja, Skenimi, Njoftimet, Ora e dorës, Marketet,
   Stoku, Përdoruesit; secili sipas lejes), "Llogaria", "Rreth Stoku", "Kontrollo për përditësim" dhe versioni. Pjesët e CSS-it
   (.ops-grupi, .kategori-rresht, .ops-radio, .ops-furn-rresht, .ops-furn-edit…) janë te `ui/CilesimetPerberes.kt`.
   Kujtesa e produkteve = `logjika/Kujtesa.kt` (krijoKujtesen e afatet.js, me `KujtesaTest` hap pas hapi nga fikstura.json,
   blloku "kujtesa" te `teste/vendas-fikstura.js`) + `logjika/Furnizuesit.kt` (listaEFurnizuesve, renditSipasRuajtjes,
   furnizuesiEkzistues, riemertoFurnizuesin; Collator-i i Java-s s'i llogarit hapësirat, prandaj `krahasoBaze` krahason fjalë
   pas fjale si ICU). `Regjistri.kt` = sinkronizimi i ekipa.js: `kujtesa/{p0..p9,px}` (administratori shkruan me merge vetëm
   çka ka kontrolluar), `kujtesa_pritje/{uid}` (të tjerët; administratori i dëgjon krejt), `grupet/{g}/kujtesa`,
   `publike/furnizuesit`; mëson nga afatet, stoku, importet (Excel, fotoja e fletës) dhe në sfond ("plotëso"). Skedari
   `kujtesa.json` te filesDir. Faqet Furnizuesit / Furnizuesit e rinj / Produktet e reja / Produktet = `ui/RegjistriUI.kt`.
   Foto e profilit = `Fotot.kt` (Worker-i: GET /fotot, PUT/DELETE /foto, JPEG 256×256). Kopja e të fshirave (v232) te
   `Dyqani.kt` (`kopja-fshirjeve.json`, 30 ditë, Rikthe / Hiq kopjen). **S'është bërë ende**: Harta (web-i: Cilësimet →
   Harta) dhe fshirja e llogarisë nga administratori. S'është testuar në telefon të vërtetë.

0000000. **STOKU PËR ANDROID: CILËSIMET → PËRDORUESIT (23.10.2026)**: vazhdim i "Shtoji te gjitha opsionet qe mungojn".
   `Admini.kt` (vetëm kur hyn mendurberisha: dëgjuesit e `perdoruesit` dhe `lejet`, ruajtja si `lejet.js ruaj`: { lejet: pastro(),
   kontrolluarSe, kontrolluarNga, emri }, llogaritë e reja si toast + "të parat" te pref "perdoruesit_pare"), `ui/AdminiUI.kt`
   (lista "Pa u kontrolluar"/"Të kontrolluar", lejet sipas grupeve me çelës, "U kontrollua", "Lejo krejt", "Ndalo krejt",
   "Shëno krejt…", afatet e llogarisë sipas marketeve me `Sinkronizimi.merrDyqanin`). Administratori s'del në listë dhe
   `Admini.ruaj` s'e prek kurrë. `Lejet.kt` mori grupin/përshkrimin e çdo leje dhe krejt/meZgjedhjet/teNdaluara/statusi
   (`LejetTest` me fikstura nga lejet.js). Fshirja e llogarisë nga administratori (ekipa.js fshijLlogarine) s'është shtuar.

0000000. **STOKU PËR ANDROID: NJOFTIMET PUSH, NJOFTIMI DITOR DHE ORA E DORËS (23.10.2026)**: vazhdim i "Shtoji te gjitha
   opsionet qe mungojn". `firebase-messaging` + `FcmSherbimi` (mesazhet "data" të Worker-it: titulli, teksti, tag, url →
   njoftimi; prekja hap tabin Grupi/Afatet), kanali "stoku", leja POST_NOTIFICATIONS (Android 13+). `Push.kt` = pjesa push e
   ekipa.js: pajisja te `grupet/{g}/push/{uid}_{hashTekst(endpoint)}` = { uid, emri, platforma: "tel", koha, endpoint: "fcm:…",
   fcm } (pa lejen "Grupi" hiqet), POST /orari (aktiv, ora, tz, pajisja), kopja e afateve { afatet: [{ i, e, b, d, s, f, mk }] }
   (hash + një herë në ditë, `vetemMeOrar` pa orar), statusi i serverit, rinovimi kur serveri e ka fshirë orarin, pastrimi në
   dalje (edhe pas daljes pa internet: pref "orari_pastro"), /ora/lidh me kod dhe /ora/hequrat në rikthim (çdo 2 min).
   Cilësimet → Njoftimet (gjendja, "Aktivizo njoftimet"/"Hap cilësimet e njoftimeve", njoftimi ditor me orë 24-orëshe nga
   TimePicker, kontrolli i serverit) dhe → Ora e dorës. **`rt` për orën**: Firebase-i i Android-it s'e jep refresh token-in,
   prandaj në hyrje (dhe pas ndryshimit të fjalëkalimit) merret një me REST `accounts:signInWithPassword` dhe ruhet te pref
   "ora_rt" (hiqet në dalje); llogaritë e hyra para këtij versioni e kanë bosh deri në hyrjen e radhës (ora punon, por pa
   kërkesat te Grupi). **FCM me paketën `site.stoku.vendas`**: APP_ID është i aplikacionit `site.stoku.app` në Firebase;
   nëse tokeni s'vjen (Cilësimet → Njoftimet: "Telefoni s'është lidhur ende me shërbimin e njoftimeve"), pronari duhet ta
   shtojë aplikacionin Android `site.stoku.vendas` te Firebase (Project settings → Add app) dhe APP_ID te StokuApp.kt ndërrohet.

0000000. **STOKU PËR ANDROID: EXCEL, PDF, IMPORTI DHE "DËRGO NË PC" (23.10.2026)**: vazhdim i "Shtoji te gjitha opsionet qe
   mungojn". Logjika e re në `vendas/logjika`: `Xlsx.kt` (= xlsx.js: build, buildWorkbook, read me deflate/sharedStrings, CSV si
   `lexoCsvTel`), `ImportiAfateve.kt` (= pjesa e importit te afatet.js: muajiNgaEmri, dataNgaQeliza, hamendesoKolonat, plani,
   afatetNgaPlani; me `tani` opsional për testet), `Barkodi.kt` (= JsBarcode: EAN13/UPC/EAN8 me shifrën e kontrollit, përndryshe
   CODE128 auto A/B/C). `ExcelTest` i krahason me kodin e web-it: `teste/vendas-fikstura.js` tash ekzekuton edhe xlsx.js `read()` në
   Chromium (Playwright, `teste/pw.js`, sepse kërkon DOMParser) dhe JsBarcode nga `teste/npm` (kërkon `npm ci` atje). Në JSON s'ruhet
   -0 (bëhet 0): mos e përdor në fikstura. Aplikacioni: `Eksportet.kt` (Excel-i i folderit, etiketat PDF me `PdfDocument`: A4 3×8,
   vijat e barkodit si vektor, Excel-i i afateve me AX_KOLONAT, kolonat e ruajtura te pref "afatet_excel_kolonat"), `Skedaret.kt`
   (protokolli i skedaret.js me `Blob`, copa 900 KB, 45 s për shkrim; "Ruaje në telefon" = MediaStore Downloads në Android 10+,
   "Ruaj si…" në 8/9; "Ndaje" me FileProvider `cache/eksportet/`), `ui/EksportetUI.kt` (SkedariFlete, AfatetExcelFlete,
   ImportiAfateveFlete). Butonat: folderi "Eksporto në Excel/PDF", Afatet "Importo Excel"/"Eksporto Excel", shiriti i zgjedhjes
   "Excel" dhe "Zgjidh të gjitha". Mbeten: "Dërgo në PC" për fotot e fletëve (dlgKuFleta), stoku i kolegut te Grupi.

0000000. **STOKU PËR ANDROID: CILËSIMET E PLOTA (23.10.2026)**: kërkesa: "Shtoji te gjitha opsionet qe mungojn" (krahasuar me
   web-in). Faza 1: `Opsionet.kt` (madhësia "normale"/"e_madhe" = dendësia ×1.12; PDA: ekrani portret, pa butonin e kamerës,
   kursori gjithmonë te barkodi; "Fshih tastierën" vetëm me PDA, te `Fusha` tastiera fshihet në fokus dhe në prekje; "Pa emër"
   me numërimin 5 s si te web-i, vetëm me lejen e stokut; tingulli; kursori te barkodi pas ruajtjes; parazgjedhjet si te web-i),
   Llogaria: ndrysho emrin (REST `accounts:update` me idToken, se SDK-ja s'ka `updateEmail` pa verifikim), ndrysho fjalëkalimin
   (me rihyrje me fjalëkalimin aktual kur Firebase e kërkon), "Rikthe nga cloud" (`Sinkronizimi.riktheNgaCloud`, harron
   fshirjet në pritje), "Çka ka të re" (`TeRejat.kt`: lista e aplikacionit, del vetë një herë për hyrjet e reja; instalimet e
   vjetra nisin nga nr 4). **Kujdes**: te `Fusha` parametri `tastiera` është `KeyboardType`; kontrolluesi i tastierës quhet
   `kontrolliTastieres` (emri i njëjtë e prishi ndërtimin). Fazat e ardhshme: Excel/PDF/importi/Dërgo në PC, njoftimet + ora,
   faqet e administratorit.

0000000. **SHKAKU I MBYLLJES PAS HYRJES: `(?U)` TE REGEX-I (23.10.2026, v25)**: fotoja e ekranit të mbylljes (v24):
   `ExceptionInInitializerError` te `StokuEkrani.Kryefaqja` ← `Afatet.<clinit>` (Afatet.kt:74) ← `PatternSyntaxException`
   te `(?U)[\s-]` (`HAPESIRA_VIZA`, shtuar me `normalizoRreshtin` për fletën me AI). Në JVM (testet, Robolectric) `(?U)` punon,
   në Android (ICU) jo: objekti `Afatet` s'krijohej dhe çdo ekran pas hyrjes mbyllte aplikacionin. U zëvendësua me klasën e
   hapësirave të JavaScript-it (`[\s\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF-]`, punon kudo).
   **Rregull**: në Kotlin-in e `vendas/` pa `(?U)`/`UNICODE_CHARACTER_CLASS` (ICU s'i njeh); testi `AndroidTest` (logjika)
   e kontrollon kodin. Kujdes: Robolectric përdor regex-in e JVM-it, prandaj pamjet s'e kapin këtë lloj gabimi.

0000000. **HYRJA TE APLIKACIONI ANDROID "S'PO BËHET" (23.10.2026)**: përdoruesi: "spo bohet as login". Firebase-i u
   kontrollua nga serveri (curl te identitytoolkit me çelësin, si web dhe si Android `site.stoku.vendas`/`site.stoku.app`):
   çelësi s'është i kufizuar, reCAPTCHA s'kërkohet (`ENFORCEMENT_STATE_UNSPECIFIED`), hyrja me llogari të panjohur jep
   `EMAIL_NOT_FOUND` (pra kërkesa pranohet). **Te Firebase s'duhet ndryshuar asgjë për aplikacionin e ri.** (Kujdes: 6 prova
   radhazi me llogari të rreme dhanë `TOO_MANY_ATTEMPTS_TRY_LATER` për IP-në e kontejnerit; mos provo më shumë se 2-3 herë.)
   Që shkaku të shihet pa telefon: gabimi i hyrjes tash shton poshtë arsyen teknike (`Klasa: mesazhi`), dhe kur aplikacioni
   mbyllet nga një gabim, `StokuApp` e ruan (prefs `rrezimi_i_fundit`, rreshti i parë + rreshtat `site.stoku`) dhe herën
   tjetër del dritarja "Aplikacioni u mbyll papritur herën e kaluar". Pritet përgjigjja e përdoruesit (çka shkruan saktë).
   Përgjigjja e parë: "Kur i shkrujt user pass hi hyr mshelet krejt appi" (mbyllet menjëherë pas "Hyr"). Prandaj (v23):
   pas një mbylljeje, `StokuApp` s'i nis modulet (Dyqani, Sinkronizimi me Llogarinë, Merchandiseri, Grupi) derisa përdoruesi
   ta shohë ekranin e plotë `EkraniIRrezimit` (thread-i, 4 rreshtat e parë, "Caused by" + 2 rreshta, rreshtat `site.stoku`)
   dhe të shtypë "Vazhdo" (`StokuApp.nisModulet()`); përndryshe me llogarinë e ruajtur aplikacioni mbyllej prapë para se
   të lexohej arsyeja. Dyshimet: puna e rëndë e bashkimit në thread-in kryesor (Sinkronizimi: `njofto`, `zbatoBashkimin`,
   `Bashkimi.eNjejte` për dyqane të mëdha), ose të dhëna reale që s'janë në fikstura.

0000000. **APLIKACIONI ANDROID `vendas/` QUHET "STOKU" (23.10.2026)**: përdoruesi: "nderroja appit native komplet emrin kudo qe e ke shkru
   stoku native ... ja len veq Stoku ... per arsyje qe appi webview android aj ka me u fshi". Emri i aplikacionit `vendas/`
   (`app_name`), Cilësimet ("Aplikacioni Stoku", teksti poshtë), mesazhi i lejes së kamerës, README, workflow-i ("Stoku APK",
   Release "Stoku për Android NN", skedari `stoku-NN.apk`, artifact `stoku-apk`) dhe skedari i përditësimit (`stoku.apk`).
   Paketa mbetet `site.stoku.vendas` dhe tag-u `vendas-vNN` (përndryshe telefonat s'e marrin përditësimin vetë).
   **Aplikacioni WebView `tel/` (`site.stoku.app`) u fshi te v255** (vendim i pronarit): mos e propozo dhe mos e rikthe.

0000000. **STOKU PËR ANDROID: APLIKACIONI PA WEBVIEW (`vendas/`, faza 1; APK `vendas-vNN`)**: kërkesa: "krijoma 100% native
   android aplikacion jo webview, mundohu sa ma identik me bo, te kamera ta perdorin google lens". Pa ndryshim në web.
   - **Projekti** `vendas/` (Gradle: `:app` Android + Compose, `:logjika` Kotlin pa Android). Paketa **`site.stoku.vendas`**,
     emri "Stoku" (deri më 23.10.2026 "Stoku Native"; i ndarë nga `site.stoku.app` i `tel/`, i cili do të fshihet).
     Nënshkrimi si `tel/` (`nenshkruaj.sh tel`). Workflow `vendas-apk.yml`: `:logjika:test` + APK; main → Release
     `vendas-vNN`; `Perditesimi.kt` e kërkon vetë (`vendas-v`).
   - **Firebase**: i njëjti projekt (`stoku-appi`), opsionet në kod (`StokuApp.kt`, appId i Android-it nga `android.json`, çelësi
     publik). Hyrja `emri@stoku-app.local`; `perdoruesit/{uid}` (perdoruesi, kycurSe; regjistrimi: krijuarSe + merchandiser);
     flamuri merchandiser si v251 (vetëm nga serveri; "po" s'kthehet në "jo"); `lejet/{uid}` (si lejet.js, ruhen edhe në telefon).
   - **Logjika = web-i**: `Bashkimi.kt` (bashkimi.js), `Ruajtja.kt` (bashkoPjeset, ndajNePjese, hash FNV-1a si `Math.imul`,
     pjesaKanonike), `Afatet.kt`, `Lejet.kt`, `Js.kt` (objektet si te JS: Map me renditje, numrat Long/Double, JSON, kanonik,
     renditja e çelësave-indeks si `Object.keys`, localeCompare e përafërt). Testet në `vendas/logjika/src/test` e krahasojnë me
     kodin e vërtetë të web-it (`fikstura.json` nga `node teste/vendas-fikstura.js`: 150 bashkime të rastësishme, ndarja në pjesë,
     dyqan me 6000 produkte, hash-i, afatet, datat, lejet). **Kur ndryshon bashkimi.js/ruajtja.js/afatet.js/lejet.js, rikrijo
     fiksturat dhe përshtat Kotlinin.** Lokalisht: Gradle + Kotlin JVM (Maven Central) te një projekt në scratchpad me
     `srcDir` te `vendas/logjika`; Android-i (AGP/AndroidX nga Google Maven) kompilohet vetëm te GitHub Actions.
   - **Sinkronizimi** (`Sinkronizimi.kt`, si app-tel.js): hyrja (telefon i paprekur → gjendja e cloud-it; përndryshe bashkim),
     transaksion lexim+bashkim+shkrim pas 1.5 s (afatet 0.3 s), vetëm pjesët e ndryshuara, dëgjuesi i kryesorit + `pjeset` (me
     `remoteNePritje`), riprovim 15 s, `NetworkCallback`, dërgim kur aplikacioni del në sfond. Dyqani në telefon: `dyqani.json`
     (pronari = uid; hyrja me llogari tjetër i fshin të dhënat e vjetra, si porta.js).
   - **Pamja** (si web-i i telefonit): ngjyrat e `stoku-tokens.css` (e çelët/e errët/automatike), Onest + JetBrains Mono (ttf nga
     woff2), ikonat e `index.html` (`Ikonat.kt`), logoja; tabet Stoku · Afatet · Cilësimet; porta (Hyr/Krijo llogari, merchandiser,
     "Ke harruar fjalëkalimin?" me Worker-in `/fjalekalimi/*`); Stoku (karta e numrave, folderat 3 në rresht me ikona, "Ndryshuar
     së fundi", kërkimi global, folderi me +/-/sasi, dritarja e produktit, zhvendosja, fshirja, folder i ri me ikonë); Afatet
     (kartat me ngjyra, kutia e ditëve, filtrat dhe muajt, grupimi sipas furnizuesit te "Afër skadimit", afat i ri/ndryshim me
     datat e shpejta, "U hoq nga rafti"/"Rikthe si aktiv", zgjedhja me shtypje të gjatë + fshirja); Cilësimet (pamja, renditja,
     llogaria, versioni). Merchandiseri pa furnizues (si v252). Regjistri i përbashkët `kujtesa/*` për emrin/furnizuesin nga barkodi.
   - **Kamera**: CameraX + ML Kit Barcode Scanning (i njëjti motor si Google Lens, pa internet): EAN/UPC me shifrën e kontrollit
     të saktë pranohet menjëherë, të tjerat pas 2 leximeve; bip + dridhje; drita.
   - **"Fotografo fletën"** (`LeximiAI.kt` + `ui/FletaEkrani.kt`, si lexoFleten te app-tel.js): kamera e sistemit (TakePicture,
     skedari te `cache/fleta/` përmes FileProvider; leja CAMERA kërkohet para, sepse manifesti e ka për skanerin) ose galeria →
     JPEG si `pergatitFoton` (≤ 16.7 MP, ana ≤ 8192, cilësia 95→85, pastaj zvogëlim, kthimi sipas EXIF) → POST
     `stoku-afatet.mendurb.workers.dev` `{image, mime, sot}` me `Authorization: Bearer <ID token>` dhe **`Origin: https://stoku.site`**
     (Worker-i mund ta kontrollojë origjinën; nëse kthen "origjina", pronari duhet ta lejojë) → `Afatet.normalizoRreshtin` (= web-i,
     me fikstura) → "Kontrollo fletën" (fotoja, statusi, rreshtat me shiritin e ngjyrës, "⚠ kontrolloje", "Në fletë: …", "+ Shto
     rresht me dorë", "Ruaj N afate" me kontrollin e përsëritjeve dhe `ngaFoto: true`). Pa "Dërgo në PC" dhe pa marketin (ende).
   - **Marketet**: `Marketet.kt` = marketet.js (v253 përfshirë; 120 raste me fikstura). Ekrani i merchandiserit (`Merchandiseri.kt`
     + `ui/MarketetUI.kt`): pikat `pikat/{id}` me kopje në pajisje (`KoleksioniMeKopje.kt`, vetëm ndryshimet nga `ndryshuarSe`),
     sinkronizimi me pikat, marketi aktiv (prefs `marketi_aktiv`), GPS me `LocationManagerCompat.getCurrentLocation` (më e mira
     brenda 15 s; kur hapet aplikacioni, jo më shpesh se 2 min), "Ku je?" me "Afër teje", "Je te: …", "Market i ri" (vetëm me
     vendndodhje të saktë, jo mbi një market ekzistues), afatet sipas marketit (grupimi + shenja te karta + zgjedhja te afati),
     Cilësimet → Marketet.
   - **Grupi** (si tabi "Grupi" i web-it, ekipa.js): `GrupiLogjika.kt` (funksionet e pastra: prania, koha relative, përmbledhja e
     afateve, heqjet e kolegëve në pritje, kalendari, statistikat, tekstet e aktivitetit/njoftimeve, kërkesat; `GrupiTest` me
     fikstura nga ekipa.js, ora UTC) + `Grupi.kt` (Firestore: treguesi `perdoruesit/{uid}.grupi` me rikthimin e v243, anëtarët,
     `grupet/{g}/afatet/{uid}` me përmbledhjen e afateve të mia pas 1.5 s, aktiviteti `feed` (afatet e reja mblidhen 20 s),
     prania çdo 90 s, ftesat, kërkesat për t'u futur, njoftimet personale, heqja e afatit të kolegut me miratimin e pronarit,
     "Kërko heqje nga rafti", krijo/riemërto/largohu/hiq/bëje admin, pastrimi i aktivitetit) + `ui/GrupiEkrani.kt` (Përmbledhja,
     Afatet, Aktiviteti, Kalendari, Kolegët, zilja, pa grup). Pa njoftimet e sistemit (push) dhe pa veprimet e administratorit
     `mendurberisha` (fshirja e llogarive, ndryshimi i afateve të të tjerëve): ato mbeten te web-i.
   - **Pamjet pa telefon**: `PamjetTest.kt` (Robolectric + Roborazzi, 390×844 dp) → job-i `pamjet` i workflow-t i ruan PNG-të si
     blob-e (`::notice title=pamjet::emri=sha`); lexohen me `gh api repos/stoku26/stoku/check-runs/<job>/annotations` dhe
     `gh api repos/stoku26/stoku/git/blobs/<sha> --jq .content | base64 -d`. Krahasuar me pamjet e web-it: pothuajse identike
     (titujt 26 px si `.sb .opsione-krye h2`, brenda folderit pa tabe). Kujdes: `/*` brenda një komenti Kotlin hap koment të ri.
     Testi i fletës (foto provë + `LeximiAI.lexoPerProve`) gjeti një gabim të vërtetë: `BitmapFactory.decodeStream` me
     `inJustDecodeBounds` kthen gjithmonë null (vlejnë vetëm outWidth/outHeight). Në Robolectric skedari i fotos duhet
     regjistruar (`registerInputStreamSupplier`); FileProvider mban dosjen e testit të parë (prandaj `uri` mund të jetë null).
   - **Importi i stokut nga foto** (dy butonat lart te Stoku, si `btnImportGaleria`/`btnImportStok`): i njëjti ekran me
     `stok = true` ("Kontrollo listën", `synim: 'stok'` te Worker-i, zgjedhja e folderit + "+ Folder i ri…", "Importo N
     produkte"; sasia i shtohet produktit me të njëjtin barkod, emri/furnizuesi ekzistues mbeten, si te web-i).
   - **Mungon ende** (vendas/README.md): importet nga Excel, Excel/PDF, "Dërgo në PC", push (njoftimet e sistemit), ora,
     harta e marketeve, faqet e administratorit.

0000000. **MARKETE AFËR NJËRI-TJETRIT (v253 = 1.39.1)**: pronari (administratori, Cilësimet → Harta, "+ Shto market në hartë",
   me foto): "dy markete … nuk po len aq afer me u kon … spo muj me shtu marketin ne te djatht" (Viva Fly dhe marketi matanë
   rrugës, rreth 55 m: v250 s'lejonte asnjë market brenda `LIDHJA_M` = 60 m).
   - **`MK.AFER_M` = 20 m** = "i njëjti vend". Administratori (tel + PC, `htShtoRuaj`): s'shton vetëm kur një pikë është brenda 20 m
     (`MK.pikaShumeAfer` → "Këtu është tashmë marketi "X" (N m). Vendose shenjën mbi marketin e ri.").
   - **Merchandiseri (`kontrolloShtimin`)**: ≤ 20 m → `ekziston` (zgjidhet ai, si më parë); deri në 20 m + pasaktësia e GPS-it
     (më së shumti 60 m) → arsye e re **`afer`** {emri, largesia, sakt}: "Afër (N m) është marketi "X" dhe vendndodhja ka pasaktësi
     rreth S m. Nëse je te ai, zgjidhe te "Ku je?". Përndryshe prit pak brenda marketit dhe provo sërish." (s'zgjidhet vetë: s'dihet
     a je te ai apo te fqinji); më larg → shtohet.
   - **`pikaPerMarketin`** (marketi i vjetër pa pikë, edhe te `sinkronizoMePikat`): brenda 20 m çfarëdo emri, ose brenda 60 m vetëm
     me të njëjtin emër (që marketi i vjetër i një fqinji të mos lidhet me pikën e gabuar).
   - Teste: `teste/v253.js` (njësitë; administratori tel + PC: 10 m jo, 55 m/35 m po; merchandiseri: "afer", zgjedhja e më të
     afërtit, shtimi 60 m larg; "Çka ka të re" vetëm për merchandiserët/administratorin). `v250.js` u përshtat (27 m me pasaktësi
     20 m = "afer"; 14 m = "ekziston").
   - Regresioni v253: 76/76 me exit=0, asnjë `GABIM` (si v252 + `v253.js`).

0000000. **KOPJA E MARKETEVE/REGJISTRIT NË PAJISJE + MERCHANDISERI PA FURNIZUES + SUGJERIMET E FURNIZUESIT + PUNA PA INTERNET
   (v252 = 1.39.0; Android tel + ora: APK e re)**: kërkesat: (a) "ok bone" (telefoni i mban marketet dhe listën e produkteve në
   memorie, merr vetëm ndryshimet: leximet e Firebase-it); (b) merchandiseri pa furnizues "kur shton ni afat ose qka do tjeter";
   (c) të tjerët: furnizuesi "me mujt me shkru nese so ne list, edhe me mujt me mbyll qat faqe"; (d) "android app, ora, web app
   i instaluar: offline mode, qdo ndryshim … me u rujt sync meniher si te lidhet".
   - **(a) `degjoMeKopje` (ekipa.js)** për `pikat` (`stoku:kopja:pikat`), regjistrin `kujtesa/*` (`stoku:kopja:regjistri`) dhe
     kujtesën e grupit (`stoku:kopja:grupi`, me `pronari` = grupi; e fshin porta kur ndërrohet llogaria): kopja del menjëherë
     (`info.ngaKopja`, edhe pa internet); pastaj vetëm `where('ndryshuarSe', '>', sinkSe - 1 orë)` (dëgjues) +
     `getCountFromServer` (1 lexim për 1000; numër ndryshe = fshirje → lexim i plotë); kopja > 24 orë → lexim i plotë. `serveri`
     = true vetëm kur numri përputhet (heqja e marketeve të pikave të fshira). Regjistri/kujtesa e grupit: thirrja nga kopja vetëm
     plotëson emrat, dërgimi pret serverin. `getCountFromServer` u shtua te firebase-tel/pc.js dhe te Firestore-i i rremë (bashkë me
     `where '>'`). Matja (Firestore i rremë, 50 markete, grup me 10): hapja e parë 119 lexime, hapja tjetër rreth 40 (më parë 125).
   - **(b) `paFurnizues()` = `eshteMerchandiser()` (tel + PC)**: `body.pa-furnizues` fsheh `.furn-vetem` (forma e afatit, produkti,
     importi AI/stok, kolona e Excel-it dhe "Cili furnizues?", fletët e fotografuara, "Grupo sipas furnizuesit", lista e produkteve);
     ruajtja e mban furnizuesin që kishte afati/produkti (afati i ri: pa furnizues, edhe kur kujtesa e njeh); kartat pa furnizuesin;
     "Afër skadimit" pa grupim sipas furnizuesit; PC: kolona "Produkti", eksporti pa kolonën dhe pa fletën "Për furnizuesit".
   - **(c) Telefoni pa `<datalist>`** (`#afatFurnizuesi`, `#dlgFurnizuesi`): `sugjerimetEFurnizuesit(input, lista)` = lista mbi
     fushë (`.sugj-lista`, poshtë është tastiera), filtrim sipas shkronjave, "+ Furnizues i ri: "X"", "Mbyll"; mbyllet edhe me
     Enter/Escape/dalje nga fusha. Te Android-i datalist-a hapej si listë ku s'shkruhej dhe s'mbyllej. Fusha `#afatFurnizuesi`
     kishte lartësi të vogël (pa stil): tash 48 px. PC mbetet me datalist (shfletuesit e kompjuterit e mbyllin me Esc).
   - **(d) Pa internet**: `sw.js` e ruan Firebase-in (gstatic 12.19.0: app, auth, firestore) te `CDN_BIBLIOTEKA` (më parë humbte në
     çdo përditësim: hapja pa internet → pa Firebase → s'sinkronizonte as kur kthehej interneti); faqja pa Firebase rihapet vetë
     te ngjarja "online" (pas 10 s nga hapja, pa dritare të hapur a fushë aktive, më së shumti 1 herë në 5 min). Android (tel/):
     `ACCESS_NETWORK_STATE` (WebView-i i jep faqes "online"/"offline"), pa internet `LOAD_CACHE_ELSE_NETWORK`, `NetworkCallback`:
     faqja "pa internet" rihapet vetë kur kthehet rrjeti. Ora (ora/): heqjet/zhbërjet pa internet ruhen te `radha` (prefs, me
     renditje) dhe dërgohen vetë (para çdo `merrListen`/`merrKrejt`, tile/komplikacioni, `NetworkCallback` → `Rikthimi.n++`);
     zhbërja e një heqjeje ende në radhë e anulon; lista e serverit shfaqet pa produktet në radhë; "Pa internet: heqja u ruajt në
     orë…". `hiqShume` kthen -1 kur u ruajt në radhë. Kotlin s'kompilohet këtu: e kontrollon GitHub Actions.
   - Teste: `teste/v252.js` (kopja: pyetja e ndryshimeve, emri i ri, fshirja, 24 orë; merchandiseri pa furnizues tel + PC;
     sugjerimet; Firebase te SW; rihapja pa Firebase).
   - Regresioni v252: 75/75 me exit=0, asnjë `GABIM`. Emulatori (SDK-ja e vërtetë + rregullat): `teste/emu/merch-e2e-v251.js` tash
     kontrollon edhe kopjen e pikave (hapja e dytë vetëm me ndryshimet, numërimi lejohet nga rregullat). APK-të tel + ora u
     ndërtuan pa gabime te GitHub Actions (dega).

0000000. **RREGULLAT E FIRESTORE v250 TË VENDOSURA (22.10.2026)**: pronari e ngjiti krejt tekstin e rregullave (seksioni "Rregullat
   e Firestore", i njëjti për v250 dhe v251) te Firebase dhe tha "i vendosa rregullat". Tash funksionojnë në prodhim: pikat e
   përbashkëta (`pikat/{id}`, v246), marketet e njëjta për krejt merchandiserët (v250) dhe vetëm administratori i ndryshon/fshin.
   Pa ndryshim kodi (vetëm SHENIME).

0000000. **ÇIPI I MARKETIT ("JE TE") S'ZHDUKET + MERCHANDISERI NGA ADMINISTRATORI MERR MARKETET (v251 = 1.38.1)**: përdoruesi:
   "pse ne android app so tu e qit hiq, amo po ka raste edhe ne web app po heket kjo qe e zgjedh marketin ku je" (me llogari
   merchandiser, jo me administratorin). Tri shkaqe:
   - **Flamuri "merchandiser" nga leximi i memories**: `lexoMerchandiserin` (firebase-tel/pc.js) bënte një `getDoc` të vetëm
     pas hyrjes; kur vinte nga memoria e pajisjes (internet i dobët, WebView sapo hapur; në emulator ndodhi 1 herë në 4) dokumenti
     s'e kishte `merchandiser` → `stoku:merchandiser` = false → pa çip (Android: kurrë; web: çipi dilte nga vlera e ruajtur dhe
     zhdukej pas leximit). Tash: `onSnapshot(perdoruesit/{uid}, includeMetadataChanges)` që nga `onAuthStateChanged`, vetëm
     fotografitë nga serveri (`!metadata.fromCache`); "po" e pajisjes s'kthehet kurrë në "jo" nga dokumenti (dokumenti s'e heq
     zgjedhjen; administratori e fik te `lejet/{uid}.marketet`); kur dokumenti s'e ka por pajisja po → shkruhet `merchandiser:
     true` (vetëm kur dokumenti ekziston).
   - **Merchandiseri i ndezur nga administratori (lejet)**: `lejetG.ndryshoi` vendoste `__merchPara` vetë, ndaj
     `rifreskoMerchandiserin` s'thirrej: pa `nisPikat` (marketet e Stoku-t s'vinin kurrë), pa GPS, pa "Harta" (tel + PC).
     Tash `ndryshoi` thërret `rifreskoMerchandiserin`, që nis edhe `nisPikat`.
   - **Gjendja e cloud-it në pajisje të re** (`zbatoGjendjenNgaCloud` te telefoni, `sinkronizoNeHyrje`/"Rikthe nga cloud" te PC)
     e mbishkruante listën me marketet e dyqanit (p.sh. []) pas sinkronizimit me pikat: tash `pasPikave` thirret sërish.
   - Administratori (mendurberisha) mbetet pa çip (s'është merchandiser; s'del te Përdoruesit).
   - Teste: `teste/v251.js` (Firestore i rremë; në main: 6 gabime, tash 0) dhe `teste/emu/merch-e2e-v251.js` (SDK-ja e vërtetë +
     emulatorët: regjistrimi në web, hyrja në pajisje të pastër si Android, dokumenti pa flamur, ndezja nga administratori;
     3 herë rresht pa gabime).
   - Regresioni v251: 74/74 me exit=0, asnjë `GABIM` (si v250 + `v251.js`).

0000000. **MARKETET E STOKU-T TË NJËJTAT PËR KREJT MERCHANDISERËT + SHTIMI VETËM BRENDA MARKETIT + ADMINI SHTON NË HARTË
   (v250 = 1.38.0, RREGULLA TË REJA: `pikat` update vetëm administratori)**: kërkesa: "mos i lejo merchandiser me i fshi marketet
   ose me ja u ndryshu emrat … lejoja vetem … me shtu ndonje market te ri, nese ne ate lokacion veq eshte vendosur nje market mos
   lejo shtim tjeter … administratorit lejoja shtimin manual ne maps … merchandisereve lejoja vetem kur jan ne market … marketet
   duhet te shihen nga te gjithe merchandiseret … sync … mos lejo shtim marketi me approximate location po vetem kur osht precise".
   - **Lista e merchandiserit = pikat e Stoku-t** (`MK.sinkronizoMePikat(l, pikat, afatet, serveri)`, tel + PC, `pasPikave()`
     në çdo ndryshim të `pikat` dhe pas bashkimit me cloud-in): çdo pikë → market me id **`'k' + pika.id`** (i njëjti në krejt
     pajisjet, pa dyfishe); emri/vendndodhja vijnë nga pika; marketi i vjetër me vendndodhje pa pikë lidhet me pikën në të njëjtin
     vend (≤ `LIDHJA_M` = 60 m); dy markete për një pikë → mbetet ai me afate. Marketi i një pike të fshirë hiqet (me shënim te
     `fshira.marketet`) VETËM kur lista vjen nga serveri (`degjoPikat` me `includeMetadataChanges`, `info.serveri`), lista ka
     < 3000 pika, marketi s'ka afate dhe s'është krijuar/ndryshuar në 10 minutat e fundit (`FRESKET_MS`); përndryshe mbetet.
     Telefoni lidh marketet e vjetra me vendndodhje me pikë (`lidhMePike`); PC jo (s'ka GPS, që të mos krijohen pika të dyfishta).
   - **Shtimi (vetëm telefoni)**: Cilësimet → Marketet ("Shto"), "Në cilin market je?", "Ku je?" → "+ Market i ri": gjithmonë
     me vendndodhjen ku je (`shtoMarketKetu`); hiqet zgjedhja "Jam brenda" (`mkrVendi`) dhe marketi pa vendndodhje.
     `MK.kontrolloShtimin(poz, marketet, pikat)`: saktësia > `SAKTESIA_MAKS_M` = 100 m → "Vendndodhja s'është e saktë (rreth N m).
     Lejo "vendndodhjen e saktë"…" (Android: "e përafërt" jep ±1-3 km); një market ose pikë ≤ 60 m → s'krijohet, zgjidhet ai
     ("Këtu është tashmë marketi …"). Emri unik në krejt Stoku-n (`marketet` + `pikat`); emri i një marketi të vjetër pa
     vendndodhje e merr vendndodhjen (s'krijohet i dyti).
   - **Merchandiseri s'riemërton, s'fshin, s'zhvendos**: Cilësimet → Marketet vetëm për t'u parë ("Me vendndodhje" / "Pa
     vendndodhje: shtoje sërish me këtë emër kur je brenda tij"); Harta (tel + PC) një listë e vetme, pa laps. "Ku je?": "Afër
     teje" me marketet e listës deri 2 km (largësia + afatet), pastaj "Marketet e tjera"; butoni `mkdMenaxho` = "Marketet".
   - **Administratori shton market me dorë** (tel + PC, Cilësimet → Harta, `#htShtoKuti` vetëm për të): "+ Shto market në hartë" →
     shenja portokalli në mes të hartës (`inst.shenjestra(true)`, `inst.qendra()` te `harta.js`), emri, "Ruaj këtu" (Enter; PC
     Escape mbyll): zmadhimi ≥ 15, emri unik, asnjë pikë ≤ 60 m → `ekipa.shtoPiken` (krijuarNga = administratori). Riemërtimi i
     adminit kontrollon edhe emrin unik. Fshirja: "Të fshihet marketi?" (hiqet nga lista e merchandiserëve pa afate aty).
   - **Rregullat** (SHENIME + `fs-server.js` + `teste/emu/pikat-v246.mjs`, provuar në emulator): `allow update` te `pikat/{id}`
     vetëm `eshteAdmin()` (krijuesi s'e ndryshon më). Pronari i vendosi më 22.10.2026 (bashkë me ato të v246).
   - CSP te Cloudflare: pronari e ngjiti vlerën më 22.10.2026, identike me `CSP_CLOUDFLARE` (Esri i lejuar).
   - Teste: `teste/v250.js` i ri (njësitë, besa shton te Albi, drini e merr vetë, e përafërt 800 m, 30 m nga Albi, emri, pikat e
     fshira, admini shton në hartë tel + PC); përshtatur: `pikat-v246.js`, `marketet-v241.js`, `marketi-ri-v242.js`,
     `harta-v244.js`, `harta-v247.js`.
   - Regresioni v250: 73/73 me exit=0, asnjë `GABIM` (si v249 + `v250.js`). Pas tij: `typeof PK` mbrojtje te thirrja e
     `pasPikave` pas bashkimit me cloud-in (tel + PC); `v250.js`, `pikat-v246.js`, `marketet-v241.js` u provuan sërish.

0000000. **SATELITI AKTIV: ÇELËSI I ESRI-T (v249 = 1.37.0)**: pronari krijoi te location.arcgis.com (portali `stoku`) kredencialet
   "stoku": API key, **Public application**, pa item access, privilegjet vetëm **Basemaps** (Basemap styles service + Static
   basemap tiles), referrer `https://stoku.site`, skadon rreth **21.10.2027**. "API key 1" është te `harta.js` (`ESRI_CELESI`,
   publik si ai i Firebase-it); "API key 2" mbetet rezervë: para skadimit pronari e gjeneron, e vendosim te `ESRI_CELESI`, pastaj
   ai e fshin të parin. Butoni "Satelit" tash del te krejt hartat (administratori dhe merchandiserët). **Pronari duhet ta ketë
   ndryshuar CSP-në te Cloudflare** (`https://ibasemaps-api.arcgis.com`, rreshti `CSP_CLOUDFLARE`), përndryshe sateliti
   kthehet vetë te "Hartë" me mesazhin "Pamja satelitore s'u hap…". Kontejneri s'e arrin `ibasemaps-api.arcgis.com` (proxy 403):
   çelësi s'u provua dot këtu; `harta-v247.js` kontrollon që është vendosur.

0000000. **PC PA "MIRË SE ERDHE" PAS RIFRESKIMIT + AFATET SIPAS MARKETEVE + PRODUKTET E KONTROLLUARA S'KTHEHEN (v248 = 1.36.1)**:
   pronari: (1) PC, i kyçur: pas rifreskimit për rreth 1 s del faqja "pa llogari" (karta "Mirë se erdhe" me hyrjen, "Hyr ·
   Vetëm në këtë kompjuter"), pastaj faqja e vërtetë; (2) merchandiserëve (vetëm atyre) afatet s'duhet t'u përzihen: të ndara
   sipas marketeve/pikave, dhe te kartat me ngjyra të shihet në cilin market është afati; (3) te telefoni i administratorit
   "Produktet e reja" i nxori sërish për kontroll produkte të kontrolluara më herët ("nga tonnyaliu").
   - **(1) Shkaku:** Firebase e kthen hyrjen (IndexedDB) pas ~1 s; `renderPermbledhjen` e shfaqte `#kartaMireseardhje` kur
     `__stokuCloud` ekzistonte pa përdorues, edhe para `authGati`. **Rregullimi (`app-pc.js`, `porta.js`):** `hyrjaNePritje()` =
     `StokuPorta.hyrjaEFundit()` (KEY_HYRJA `stoku:porta:hyrja`, vetëm kur `stoku:pronari-uid` është i njëjti; hiqet me "Dil")
     derisa `authGati`, jo vizitor, jo më shumë se 10 s (`HYRJA_PRITJA_MS`; pastaj rivizatohet). Gjatë saj: pa kartën, emri te
     `#perdoruesiCip`/`#sbpBrandNen`/avatari, `#sinkTekst` "Duke u lidhur…" (pika "pune"), "Llogaria: X" te përmbledhja.
   - **(2) Afatet (tel + PC, vetëm `kaMarkete()`):** çdo kartë (tel `.af-market`, çip i gjelbër me ikonën e pikës) / rresht (PC
     `.af-prod-mk`) e ka marketin, edhe kur je te një market; afati pa market: "Pa market". Te "Krejt marketet" lista ndahet
     me `MK.grupo` (renditja e marketeve, "Pa market" në fund): tel `.af-grup-krye.af-grup-market` "Albi · 2", PC
     `tr.af-grup-market` "Albi · 2 produkte"; brenda tyre grupimi sipas furnizuesit ("Afër skadimit" te tel, "Grupo" te PC) si
     nëngrupe (`af-grup-krye--nen`, `tr.af-grup-nen`).
   - **(3) Shkaku (më i mundshëm, s'u pa në Firebase të vërtetë):** kujtesa e pajisjes ka kufi 20 000 hyrje
     (`KUJTESA_MAKS`) dhe kur mbushej hiqte më të VJETRAT, pra shpesh produktet e kontrolluara para shumë kohësh. Pastaj pritja e
     kolegut (`kujtesa_pritje/{uid}`, p.sh. tonnyaliu me produktet e skanuara dikur) i shtonte si të reja (pa `s`, "nga X"),
     derisa regjistri të ndryshonte sërish. Edhe pajisja e kolegut i dërgonte për kontroll kur kishte një kopje të
     administratorit më të re se regjistri (p.sh. nga kujtesa e grupit). **Rregullimi:** `afatet.js` `shkruaj`: kur kujtesa
     kalon kufirin hiqen së pari hyrjet e mësuara vetë, pastaj të kolegëve, të fundit të administratorit (`klasaEHyrjes`, pastaj
     koha). `ekipa.js`: `vendosurNgaAdmini(b)` (regjistri e ka me `s`): administratori s'e merr nga pritjet (`zbatoPritjet`;
     pritjet që vijnë para regjistrit ruhen te `regj.pritjet` dhe zbatohen pas tij, ose pas gabimit të regjistrit), dhe
     kolegët s'e dërgojnë te pritja e tyre. Te telefoni i administratorit, ato që tash dalin gabimisht kthehen vetë te Produktet
     me ndryshimin e radhës të regjistrit.
   - **Testi `teste/v248.js`**: kujtesa plot në node (i kontrolluari mbetet); regjistri + pritja e vjetër e tonnyaliu-t:
     administratori (telefon i ri dhe PC me kujtesë plot) sheh vetëm produktin vërtet të ri; pritja e re e tonnyaliu-t pa to;
     afatet sipas marketit (tel + PC); PC me `__stokuCloud` pa `authGati` (me/pa hyrje të fundit, 10 s). Kodi i vjetër (v247)
     dështon në 8 kontrolle. S'u testua në telefon/PC të vërtetë as me Firebase të vërtetë.

0000000. **HARTA: SATELITI (ESRI) + KREJT MARKETET PËR MERCHANDISERIN + "KU JE?" ME PIKAT AFËR (v247 = 1.36.0, SHËRBIM I RI I
   JASHTËM: CSP + CLOUDFLARE + ÇELËS)**: pronari: "bone me Esri" (sateliti; Google u refuzua: kartë bankare, s'lejon përzierjen me
   OpenStreetMap); "te Harta shkruaje marketet, e shohin vetëm administratori dhe merchandiserët; Marketet në hartë, jo Marketet e
   tua në hartë"; "opsionet e pikës mos u hiqen kurrë: edhe kur GPS-i e di ku je, te Stoku dhe te Afatet me mujt me ndryshu me dorë".
   - **Sateliti (`harta.js`)**: `ESRI_CELESI` (çelës API i ArcGIS Location Platform, privilegji Basemaps, i kufizuar te
     `https://stoku.site/*` si referrer; publik si ai i Firebase-it, s'është sekret). Pa çelës (`''`) butoni s'del dhe s'ka
     burim satelitor. Me çelës: burimi raster `satelit` = `https://ibasemaps-api.arcgis.com/arcgis/rest/services/World_Imagery/
     MapServer/tile/{z}/{y}/{x}?token=…` (256 px, maxzoom 19), shtresa `satelit` pas `sfondi`, `visibility: none` derisa zgjidhet
     (shtresa e fshehur s'kërkon pllaka). Butoni `.ht-pamja-btn` ("Satelit" / "Hartë", grup kontrolli i MapLibre-s poshtë
     zmadhimit), zgjedhja te `stoku:harta:pamja` (kjo pajisje). Mbi satelit: uji, lumenjtë dhe rrugët fshihen; emrat e
     vendbanimeve të bardhë me kufi të errët (`NGJYRAT.satelit`). Atribuimi i Esri-t te burimi (`Powered by Esri | Esri, Vantor,
     Earthstar Geographics, and the GIS User Community`) + etiketa `.ht-esri` "Powered by Esri" që s'palohet (fshihet vetëm kur
     burimet janë të hapura). Pllakat refuzohen (401/403) ose ≥4 gabime: kthehet te "Hartë" pa e fshirë zgjedhjen +
     `kurSkaSatelit` ("Pamja satelitore s'u hap…"). Free tier i Esri-t: 2 milionë pllaka në muaj (sipas faqes së çmimeve).
     Çelësat e rinj të ArcGIS-it kanë datë skadimi (deri 1 vit): kur skadon, sateliti kthehet vetë te harta me mesazhin; pronari
     krijon një të ri dhe e ndërrojmë te `ESRI_CELESI` (version i ri i web-it).
   - **CSP**: `connect-src` + `https://ibasemaps-api.arcgis.com` te 5 faqet dhe te `CSP_CLOUDFLARE`. **PRONARI duhet: (1) të krijojë
     çelësin te location.arcgis.com dhe të ma japë; (2) ta ndryshojë rregullën "siguria" te Cloudflare.** Deri atëherë butoni s'del.
     Privatësia: Esri te "Ku ruhen" (vetëm kur zgjedh "Satelit"). SW s'i ruan pllakat (kalojnë drejt).
   - **Merchandiseri (tel + PC)**: harta i ka të vetat (si më parë, i riemërton te telefoni) + pikat e të tjerëve (`tjeter: true`,
     ngjyrë gri `pikaTjeter`, "E shtoi X" / "E shtove ti", pa ndryshim emri; prekja vetëm e zgjedh në hartë), me titujt "Marketet e
     mia" / "Marketet e tjera të Stoku-t". PC tash e dëgjon `pikat` edhe për merchandiserin. Nëntitulli i rreshtit te Cilësimet:
     "Marketet në hartë" (tel `#tabHartaStatus`, PC `#opsHartaNen`, edhe për administratorin). Harta dhe Marketet: vetëm
     administratori dhe merchandiserët (si më parë; testi e kontrollon).
   - **"Ku je?" (telefoni)**: `PK.poz` = vendndodhja e fundit, VETËM në memorie (15 min, `pozEFundit`). Çipi (Stoku dhe Afatet)
     hap `zgjidhMarketin('zgjidh', pozEFundit())`: "Afër teje" me pikat deri 2 km edhe kur GPS-i e ka gjetur marketin; nëntitulli
     "…Nëse GPS-i s'e ka gjetur mirë, zgjidhe vetë." Teksti "S'je te asnjë market i njohur…" vetëm kur pyet vetë (`panjohur`).
     Çipi s'fshihet kurrë për merchandiserin (as më parë).
   - **Teste**: `teste/harta-v247.js` (njësitë e stilit me/pa çelës përmes `vm`, CSP 5 faqe + Cloudflare; shfletuesi me harta.js
     me çelës prove përmes `ctx.route`: pa kërkesa te Esri para "Satelit", token, "Powered by Esri", emrat mbi satelit, zgjedhja pas
     rifreskimit, 401 → kthim; PC; agim pa Harta/Marketet; "Ku je?" nga çipi me "Afër teje"); `harta-v244.js` pret krejt marketet te
     merchandiseri. S'u testua me pllaka të vërteta të Esri-t (kontejneri s'arrin internetin) as në telefon të vërtetë.

0000000. **DALJA NGA GRUPI + MARKETI KU JE + PIKAT E PËRBASHKËTA + ATRIBUIMI I HARTËS (v246 = 1.35.0, RREGULLA TË REJA: `pikat`)**:
   pronari: (1) "kur përdoruesi kërkon me dalë prej grupit, s'mundet, prap e kthen në grup; nëse je i fundit fshije komplet grupin";
   (2) "aplikacioni s'shfaq opsion në cilën pikë je, as s'të kërkon leje për lokacionin" (vetëm llogaritë "Punoj si merchandiser",
   p.sh. testmorina); (3) atribuimi i hartës ("OpenFreeMap © OpenMapTiles Data from OpenStreetMap") "me ia zhduk"; (4) sateliti.
   - **Grupi (`ekipa.js`)**: shkaku: `mundTeLargohet` e ndalte adminin e vetëm me kolegë ("Je admini i vetëm… bëje dikë tjetër
     admin"); pronari e lexonte si "s'po më lë me dalë". Tash kthen `{ ok, trashegimtari, trashegimtariEmri }`: admin bëhet kolegu me
     `kycurSe` (= `hyriSe` i anëtarësisë) më të vjetër. `largohu(fshiGrupin, paTregues, trashegimtari)`: SË PARI `perditesoAnetarin`
     (batch `update`, roli 'pronar'), pa sukses s'largohet (`arsye: 'trashegimtari'`); pastaj njoftimi `admin-i-ri` te
     `perdoruesit/{trashegimtari}/njoftimet` ("X u largua nga grupi dhe tash ti je admini i grupit."), pastaj largimi si më parë.
     Edhe `pranoFtesen` (kalimi te një grup tjetër) e merr trashëgimtarin. I fundit: si më parë, grupi fshihet krejt (feed, afatet,
     push, ftesat, kërkesat, grupi, `grupet_publike`; kujtesa mbetet, v198). Admini i ri e publikon vetë grupin me emrin e vet te
     `grupet_publike`. `grupet/{g}.pronarUid` mbetet i themeluesit: `gjejGrupinTim` e kontrollon anëtarësinë, s'e rikthen.
     Tekstet e pyetjes (tel + PC): "Je admini i grupit: kur largohesh, admin bëhet X." / "Je i fundit në grup: grupi fshihet komplet".
   - **Pikat e përbashkëta `pikat/{id}`** (`ekipa.js`: `degjoPikat` (limit 3000), `shtoPiken`, `ndryshoPiken(id, te, ngaAdmini)`,
     `fshiPiken`): `{ emri, lat, lng, krijuarNga, krijuarNgaEmri, krijuarSe, ndryshuarSe, emriNgaAdmini? }`. Marketi i
     merchandiserit me vendndodhje lidhet me një pikë (`m.p`, `marketet.js`): pika ekzistuese me të njëjtin emër (normalizuar)
     brenda `LIDHJA_M` = 60 m, ose krijohet e re; pika e krijuesit ndjek vendndodhjen e marketit. Emri i pikës fiton
     (`emratNgaPikat`): kur e ndryshon administratori (`emriNgaAdmini: true`, pastaj krijuesi s'e ndryshon më) ose krijuesi.
     Vetëm administratori i fshin. Te Cilësimet → Marketet, marketi i lidhur me pikën e dikujt tjetër s'riemërtohet (tekst
     "Këtë market e shtoi X…" / "…e ka caktuar administratori").
   - **Merchandiseri (telefoni, `app-tel.js`, `kontrolloGps`)**: vetëm `eshteMerchandiser()`. Sa hapet aplikacioni (1,2 s) dhe kur
     kthehet në pamje (jo më shpesh se `KONTROLLI_MS` = 2 min) kërkohet vendndodhja (leja e telefonit del këtu herën e parë; te
     aplikacioni Android duhet APK v241+). Marketi im brenda `RREZJA_M` → "Je te: X"; përndryshe pika e Stoku-t afër → shtohet te
     marketet e mia (`shtoNgaPika`) + "Je te: X (u shtua te marketet e tua)"; përndryshe (jo nëse e zgjodhi me dorë ose u pyet
     brenda `DORE_MS` = 3 orë, `stoku:marketet:kuje`, dhe jo mbi një dritare tjetër) "Ku je?" me seksionin "Afër teje" (pikat deri
     2 km që s'i kam, `.mk-afer`, zgjedhja "p:" + id) dhe "Marketet e mia"; pa markete dhe pa pika afër: "Në cilin market je?".
     Llogaritë jo-merchandiser: asgjë (as GPS). Rregullat para v246 (pa `pikat`): `degjoPikat` dështon, marketet punojnë si më parë.
   - **Harta (administratori, tel + PC)**: pikat vijnë nga `pikat` (jo më nga dyqanet e merchandiserëve: `mblidhPikat`/`riemerto` u
     hoqën), riemërtimi = `ndryshoPiken(id, { emri }, true)` → te merchandiserët përmes `emratNgaPikat`; "Fshije pikën". Atribuimi:
     s'hiqet (licenca ODbL e OpenStreetMap + OpenMapTiles e kërkojnë); `compact` dhe palohet vetë te (i) pas 5 s ose në lëvizjen e
     parë të hartës (`palosBurimet`), si te udhëzimet e OSMF-së. **Sateliti: s'u bë** (pret vendimin e pronarit; opsioni më i
     mirë: Esri World Imagery me çelës falas ArcGIS Location Platform, 2 milionë pllaka/muaj, lejon përdorim komercial; do
     të duhej CSP + Cloudflare).
   - **Rregullat**: `pikaOk` + `match /pikat/{id}` (më poshtë; pronari i vendosi më 22.10.2026, me v250). Pa to merchandiserët s'i shohin
     pikat e të tjerëve dhe harta e administratorit mbetet bosh). Teste: `teste/pikat-v246.js` (Firestore i rremë: shtimi vetë te
     pika e njohur, "Afër teje", migrimi, riemërtimi/fshirja nga admini, leja e ndaluar, jo-merchandiser), `teste/grupi-dalja-v246.js`
     (admini largohet → admin kolegu më i vjetër + njoftimi, rifreskimi s'e kthen, i fundit → grupi fshihet), emulatori:
     `teste/emu/pikat-v246.mjs` (rregullat) dhe `teste/emu/grupi-dalja-v246.js`; `grupet-test.js` hapi 11 tash pret
     "admin bëhet agim" (dhe lexon `STOKU_B`). S'u testua në telefon/Firebase të vërtetë.

0000000. **HARTA: EMRAT E LAGJEVE (v245 = 1.34.1)**: pronari (pas Cloudflare-it): "hartën po e shoh, po emrat e lagjeve s'janë".
   - **Shkaku (jo gabim i kodit):** pllakat e OpenFreeMap (Planetiler, profili OpenMapTiles, `Place.java`) e kanë `minzoom`:
     qytet/qytezë 7 (ose sipas rank-ut), fshat 8, `hamlet`/`suburb` 11, **`quarter`/`neighbourhood`/`isolated_dwelling` 14**;
     deri në z12 edhe një kufi etiketash për rrjetë (`LABEL_GRID_LIMITS`). Vetëm nyjet `place=*` (`osm_city_point`; klasat
     city, town, village, hamlet, borough, suburb, quarter, neighbourhood, isolated_dwelling); lagjet e vizatuara vetëm si
     sipërfaqe pa nyje s'dalin fare. Harta hapej te pamja e pikave (shpesh z12-13) → pa lagje.
   - **Ndryshimi (`harta.js?v=245`):** `borough` te VENDBANIMET; `LAGJET` (borough, suburb, quarter, neighbourhood) me shkronja
     të mëdha, `text-letter-spacing` 0.08, ngjyrë më e butë (`tekstiLagje`); nën `ZOOM_LAGJET` = 14 butoni `.ht-udhezim`
     "Zmadho për emrat e lagjeve" (sipër majtas në hartë, `easeTo` z14), fshihet në z14+. CSS te stoku.css v43 / stoku-pc.css v35.
   - **Testi** `harta-v244.js`: butoni nën z14, prekja → z14, emri i lagjes në hartë; pllakat e rreme kanë edhe `borough` "Qendra".
     S'u pa me pllaka të vërteta (kontejneri s'arrin OpenFreeMap): nëse në z14+ ende s'ka lagje në një vend, ato s'janë në OSM si nyje.

0000000. **HARTA E MARKETEVE TE CILËSIMET (v244 = 1.34.0, SHËRBIM I RI I JASHTËM: CSP + CLOUDFLARE)**: pronari: "shto te cilësimet
   opsion për maps; kur një pikë emërohet nga dikush, unë me mujt me ia ndërru emrin pikës në sistemin e Stoku-t; maps me i përdor
   emrat vetëm të qyteteve, qytezave, fshatrave edhe lagjeve, kurgjë tjetër mos me qenë në maps përveç pikave ose marketeve".
   - **`harta.js` (i ri, tel + PC, `StokuHarta`)**: MapLibre GL JS **5.24.0** (UMD, jo 6.x që është vetëm ESM pa SRI) nga jsDelivr
     me SRI, ngarkohet vetëm kur hapet harta; `css/maplibre-gl.css` = kopje e paketës (BSD-3) me një koment në krye. Pllakat:
     **OpenFreeMap** (`https://tiles.openfreemap.org/planet`, skema OpenMapTiles, falas, pa çelës, lejon përdorim komercial;
     shkronjat `.../fonts/Noto Sans Regular|Bold/...`). **Stili është YNI** (`stili()`): sfondi, `water`, `waterway`,
     `transportation` (vetëm vija, pa emra), `boundary` (admin_level ≤ 2) dhe nga `place` VETËM klasat `city, town, village,
     hamlet, suburb, quarter, neighbourhood` (emri `name:sq` ose `name`); asnjë shtresë tjetër me emra (poi, transportation_name,
     water_name, housenumber, mountain_peak, aerodrome_label, shtete, rajone). Pikat: burim GeoJSON `pikat` (rreth + emri),
     e zgjedhura portokalli. Kontrollet e MapLibre-s me tekste shqip (`locale`), pa rrotullim/pjerrësi; atribuimi (OpenFreeMap,
     OpenMapTiles, OpenStreetMap) del vetë (i detyrueshëm). `api.eFundit` = harta e fundit (testet).
   - **Kush e sheh**: Cilësimet → **Harta** (tel `#tabHarta`, PC `#opsSkedaHarta`) vetëm administratori dhe merchandiserët.
     Administratori: pikat e krejt merchandiserëve (`pdLista().filter(pdMerchandiser)` → `merrDyqaninEPerdoruesit`, 4 njëherësh,
     `mblidhPikat`, kujtesa 60 s), lista "Nga X" + "Pa vendndodhje"; prekja e pikës (ose e rreshtit) e zgjedh, harta shkon aty dhe
     hapet ndryshimi i emrit. **Riemërtimi** (`riemerto`): `ndryshoDyqaninEPerdoruesit(uid, fn)` (transaksion; `fn` mund të
     thirret sërish, flamujt rivendosen) → `marketet[i].emri` + `ndryshuarSe`; bashkimi.js (fiton `ndryshuarSe` më i ri) e çon te
     pajisjet e merchandiserit. S'pranohet emri që ai e ka te një market tjetër ("X e ka edhe një market me këtë emër"); pika e
     fshirë hiqet nga lista. Merchandiseri: vetëm marketet e veta (telefoni i riemërton si te Marketet; PC vetëm i sheh).
     Pa WebGL / pa internet: mesazh + "Provo sërish"; lista mbetet.
   - **CSP**: `connect-src` + `https://tiles.openfreemap.org` te 5 faqet dhe te `CSP_CLOUDFLARE` (PRONARI duhet ta ndryshojë te
     Cloudflare, përndryshe harta s'i merr pllakat). Worker-i i MapLibre-s është `blob:` (i lejuar). SW s'i ruan pllakat (kalojnë
     drejt), e ruan MapLibre-n nga jsDelivr si libraritë e tjera. Privatësia: OpenFreeMap te "Ku ruhen"; admini i sheh marketet në hartë.
   - **Testi `harta-v244.js`**: MapLibre nga `teste/npm` (shtuar: maplibre-gl 5.24.0, geojson-vt, vt-pbf, smp-noto-glyphs),
     `teste/harta-pllakat.js` = pllaka të rreme të Prishtinës (edhe "Kosova" si shtet, rajon, POI, emra rrugësh e uji, që s'duhet
     të dalin) + shkronjat; Chromium me `--enable-unsafe-swiftshader --use-angle=swiftshader` (WebGL pa GPU). Kontrollon
     `queryRenderedFeatures`: vetëm `vendbanimet` (klasat e lejuara) dhe `pikat-emri`; riemërtimi (tel + PC) te dyqani dhe te
     telefoni i merchandiserit; pa shkelje CSP (header-i si Cloudflare). Kontejneri s'arrin `tiles.openfreemap.org` (proxy 403):
     **harta me pllaka të vërteta s'është parë kurrë këtu**.

0000000. **GRUPI QË "FSHIHEJ" PAS RIFRESKIMIT + KËRKIMI QË S'E GJENTE (v243 = 1.33.1, NJË RREGULL E RE)**: pronari (foto:
   testmorina kërkon "Albi Market 34" → "S'u gjet asnjë grup me këtë emër"): "grupi me qat emër ekziston po s'u gjet; kur dikush
   krijon grup, grupi fshihet masi ta bon refresh; gjeje menjëherë edhe rregulloje 100%".
   - **Shkaku (ekzistonte që nga v164, s'e kapte Firestore-i i rremë):** në hapje `regjistroTani` shkruan `setDoc(perdoruesit/{uid},
     {perdoruesi, kycurSe}, {merge:true})`. Firestore-i i vërtetë (kujtesa në memorie) ia jep dëgjuesit të `perdoruesit/{uid}`
     MENJËHERË kopjen lokale të pjesshme (`fromCache: true`, `hasPendingWrites: true`) PA fushën `grupi`. `degjoGrupin` e merrte si
     "llogari pa tregues" → `provoGrupinEVjeter` (s'gjente anëtarësi te "ekipa") → shkruante `grupi: ''`. Kështu çdo grup i krijuar
     me `krijoGrupin` (ose i pranuar me ftesë/kërkesë) e humbte treguesin në rifreskim; grupi "ekipa" s'preku sepse rigjendej.
     Pronari i grupit, pa tregues, s'e publikonte më grupin (`siguroGrupinPublik` vetëm për pronarin brenda grupit) dhe grupet e
     krijuara para v242 s'ishin fare te `grupet_publike` → "S'u gjet". U vërtetua me emulatorët e vërtetë dhe SDK 12.19.0
     (edhe v241 e kishte gabimin).
   - **Rregullimi (`ekipa.js?v=243`):** dëgjuesi me `{ includeMetadataChanges: true }`; snapshot `fromCache` pa fushën `grupi`
     injorohet (pritet serveri; pa `includeMetadataChanges` llogaria e re ngecte, sepse konfirmimi i serverit pa ndryshim të
     dhënash është vetëm metadata). Para se të shkruhet `''`, `provoGrupinEVjeterNjeHere` e pyet serverin (`getDoc`).
   - **Rikthimi i treguesve të humbur:** kur treguesi është `''` (një herë për dëgjues), `gjejGrupinTim` provon (≤10): grupi i
     fundit i pajisjes (`stoku:grupi:ifundit` {uid, g}, ruhet kur je anëtar, fshihet kur largohesh/të heqin), grupet me
     `pronarUid == uid` (RREGULLA E RE `allow list` te `grupet/{g}`) dhe `grupet_publike` me `pronarEmri == emri`; vlen vetëm ai ku
     `grupet/{g}/anetaret/{uid}` ekziston. Anëtari (jo pronar) pa tregues: "Kërko të hysh" te ai grup → `dergoKerkesen` sheh që
     anëtarësia ekziston → `vendosTreguesin(g)`, `{ ok, rikthyer }`, toast "U ktheve në grupin X (ishe ende anëtar)", pa kërkesë.
   - **Kërkimi:** `normalizoEmrin` heq shenjat (çdo jo-shkronjë/numër = hapësirë), `perputhet` (nënvarg, pa hapësira, krejt fjalët
     në çfarëdo renditje), lista ruhet 15 s dhe lexohet sërish kur s'gjendet asgjë (>2 s), që grupi i sapokrijuar të dalë.
   - **Rregulla e re (pronari e vendosi më 21.10.2026):** te `match /grupet/{g}` shtohet `allow list: if request.auth != null &&
     resource.data.pronarUid == request.auth.uid;` (si `allow` më vete: brenda `allow read` me `||` query-ja ndalohej, sepse
     `anetarIGrupit(g)` s'llogaritet për lista). Pa të, pronari i grupit të vjetër (pa listë publike, pa pajisje) s'rikthehet vetë.
   - **Testet:** `teste/grupi-tregues-v243.js` (fs i rremë me metadata, si SDK-ja: kopja e pjesshme te `setDoc`; me ekipa.js e
     vjetër jep 5 GABIM); **`teste/emu/` (i ri, jashtë regresionit):** emulatorët e vërtetë (Auth 9099 + Firestore 8089 nga
     `firebase-tools`), SDK 12.19.0 e ndërtuar me esbuild, rregullat nxirren nga ky skedar (`rregullat.js`): `bash teste/emu/nis.sh`,
     `node teste/emu/grupi-v243.mjs` (rregulla + rikthimi), `node teste/emu/grupi-e2e-v243.js` (faqet e vërteta tel + PC:
     rifreskimet, rikthimi nga lista publike dhe nga pronarUid, merchandiseri, kërkesa/pranimi, "Kërko të hysh" = rikthim, PC).
     Përdore sa herë ndryshon diçka që varet nga sjellja e Firestore-it të vërtetë (kopjet e pajisjes, metadata, rregullat).

0000000. **HYR NË GRUP ME KËRKESË + REGJISTRI I PËRBASHKËT + MARKETI I PARË (v242 = 1.33.0, RREGULLA TË REJA)**: tri kërkesa të
   pronarit: (1) "useri i ri vetëm krijon grup; bone edhe me hy në një grup: me lyp me emër, me çu kërkesë, admini i grupit e
   aprovon"; (2) "useri i ri s'ka furnizues as produkte te lista; kushdo që ka llogari duhet t'i shohë, kur skanon me dalë emri
   nëse është në regjistër, dhe produktet e reja të kujtdo me dalë për kontroll te admini (Cilësimet → Stoku)"; (3) "merchandiseri
   te useri i ri s'po funksionon: s'e qet asnjë lokacion, s'të pyet për emër të marketit".
   - **(1) Kërkesat për grup** (`ekipa.js?v=242`): lista publike `grupet_publike/{g}` {emri, pronarEmri, ndryshuarSe}: e shkruan
     pronari (`publikoGrupin` pas krijimit/riemërtimit; grupet e vjetra: `siguroGrupinPublik` një herë për emër/pajisje,
     `stoku:grupi:publikuar`), fshihet me grupin (pas grupit: rregulli e lejon kur grupi s'ekziston; edhe kërkuesi e heq kur
     kërkesa refuzohet sepse grupi s'ekziston). Kërkimi: `kerkoGrupet` (lista ≤ 2000 lexohet një herë në 60 s, kërkimi pa
     dallim shkronjash/ë/ç, ≥ 2 shkronja, ≤ 30 rezultate). Kërkesa `kerkesat_grupi/{g}_{uid}` {gid, grupiEmri, uid, emri,
     koha}; pronari: `pranoKerkesen` = ftesë (`ftesat/{g}_{emri}`, rregulli ekzistues) + fshirja e kërkesës në një batch;
     `refuzoKerkesen` = fshirja. Kërkuesi: grupet e kërkuara te `stoku:grupi:kerkuar` {uid, g}; `provoPranimetAuto` e pranon
     vetë ftesën e grupit të kërkuar kur je pa grup (edhe kur hapet më vonë); kërkesa që zhduket pa ftesë (pas 3 s, kur të
     dy dëgjuesit janë gati) = refuzim → njoftim "Admini i grupit "X" s'e pranoi kërkesën tënde."; anulimi s'del si refuzim.
     Krijimi i grupit / pranimi i një ftese fshin kërkesat e mia (`fshijKerkesatEMia`). Pronari: dëgjuesi `kerkesatEGrupit`
     (kur je në grup), njoftim një herë, shenja (`numriKerkesave` + kërkesat), tel: pulti + Kolegët (`.ek-kerkesa-grupi`),
     PC: Pulti (`#ekPultKerkesat`), Kolegët (`#ekKerkesatEGrupit`), anësorja "1 kërkesë". UI pa grup: tel "Hyr në një grup"
     (`#ekGrupiKerko`, `#ekGrupiRezultatet`, kërkesat e mia me "Anulo"; dërgimi e lëshon fushën që pamja të rifreskohet), PC
     karta `#ekHyrKarta` + "Ose krijo grupin tënd". Llogaria e fshirë nga admini: fshihen edhe kërkesat dhe pritja e saj.
   - **(2) Regjistri i përbashkët**: `kujtesa/{p0..p9,px}` (si kujtesa e grupit) e lexon kushdo me llogari (`degjoRegjistrin`
     → `K.bashko`), e shkruan VETËM administratori dhe vetëm çka ka kontrolluar (hyrjet me `s` dhe pa `r`, edhe fshirjet e tij);
     herën e parë (pasi dihet që është admin, `regjistriPasAdminit`) dërgon `K.perDergim(regjistri)` të filtruar. Të tjerët:
     `kujtesa_pritje/{uid}` {p, emri, ndryshuarSe} = çka di pajisja dhe s'është (ose s'fiton) te regjistri, pa fshirjet, ≤ 3000
     më të rejat, zëvendësohet krejt (pa merge) vetëm kur ndryshon (`stoku:kujtesa:pritja` = hash), 2,5 s pas ndryshimit.
     Administratori dëgjon krejt pritjet (`degjoPritjet`): çdo hyrje pa `s` (një `s` i falsifikuar s'e kalon kontrollin), me
     `n` = autori → del te "Produktet e reja" "nga X"; pasi e ruan, kalon te regjistri dhe del vetë nga pritja e autorit.
     Kujtesa e grupit mbetet si ishte (kolegët shohin edhe çka pret kontrollin brenda grupit). Tekstet te Cilësimet → Stoku:
     "Regjistri i Stoku-t…", "Furnizuesit e regjistrit të Stoku-t…". Pa rregullat e reja: kujtesa e pajisjes + grupi si më parë.
   - **(3) Merchandiseri**: GABIMI: `#dlgMarketi` ("Ku je?") s'kishte z-index → dilte PRAPA faqes së Afateve (`.faqe-e-plote`
     21 > `.mbulese` 20): në telefon çipi dukej sikur s'bën asgjë. Tash `#dlgMarketi, #dlgMarketiRi { z-index: 24 }`. E reja:
     pa asnjë market merchandiseri sheh çipin "Marketi / Shto marketin ku punon" (Afatet + kryefaqja); herën e parë që hap Afatet
     (`stoku:marketet:pyetur` = uid) del vetë `#dlgMarketiRi` "Në cilin market je?" (emri + "Jam brenda këtij marketi tani" =
     ruaj vendndodhjen me GPS, kërkon lejen); te "Ku je?" butoni "+ Market i ri" (`#mkdIRi`). `shtoMarketERi` /
     `ruajVendinEMarketit` të përbashkëta me Cilësimet → Marketet.
   - **Rregullat e reja** (blloku më poshtë: `kujtesa`, `kujtesa_pritje`, `grupet_publike`, `kerkesat_grupi`) **i vendos
     pronari te Firebase**. Pa to: kërkimi tregon "s'është gati ende", regjistri s'punon (asgjë s'prishet).
   - Testet: `grupi-kerkesa-v242.js` (52: kërkimi, kërkesa, pranimi vetë, refuzimi, anulimi, tel + PC, siguria, lista publike),
     `regjistri-v242.js` (24: llogari e re pa grup sheh produktet/furnizuesit dhe emrin kur skanon, pritja, kontrolli i adminit,
     siguria), `marketi-ri-v242.js` (20: çipi, pyetja e parë, GPS, "+ Market i ri", dritaret mbi Afatet, jo-merchandiseri).
     `marketet-v241.js`: merchandiseri pa markete sheh "Shto marketin ku punon"; `kujtesa-grupi-test.js`: shkrimet numërohen
     vetëm te grupi. `fs-server.js`: rregullat e katër koleksioneve.
0000000. **MARKETET PËR MERCHANDISERËT (v241 = 1.32.0, Worker 167)**: pronari: "projekti deri tash ishte për 1 grup në 1 market; tash
   edhe merchandiserët (kolegë jashtë nesh) që punojnë në shumë markete brenda ditës: afatet sipas marketeve me emra që i
   shkruajnë vetë, te marketi 1 afatet e marketit 1…, njoftimet sipas marketeve". Vendimet e pronarit (pyetje me opsione):
   marketi njihet **automatikisht me GPS**; **admini i sheh afatet e tyre**, ata hapin **grupin e vet** (grupet ekzistuese) dhe
   kolegët e grupit ia shohin afatet njëri-tjetrit; **një njoftim ditor i ndarë sipas marketeve**; **Stoku (folderat, sasitë) s'ndahet**.
   - **`marketet.js`** (i ri, tel + PC + teste): `pastro`, `largesia` (haversine), `gjej` (rrezja 250 m + pasaktësia e GPS-it
     deri 150 m, më i afërti), `filtro`, `meEmra` (kopje me `mk` = emri), `vendosPaMarket`, `grupo`, marketi aktiv i pajisjes
     `stoku:marketi:aktiv` {id|null, menyra 'gps'|'dore', koha, kontrolluarSe}, `pasGps` (zgjedhja me dorë fiton 3 orë; jashtë
     krejt marketeve → null = "Krejt marketet"), `pozita` (getCurrentPosition, **maximumAge 0**: një pikë e vjetër e ngatërronte
     marketin, testi e kapi), GPS-i kontrollohet në hapje/visibilitychange jo më shpesh se 2 min dhe **vetëm kur një market ka
     vendndodhje** (pa markete s'pyetet kurrë).
   - **Të dhënat**: `marketet: [{id, emri, lat, lng, ndryshuarSe}]` te dyqani (kryesori, `ruajtja.js` i ruan fushat e panjohura),
     `bashkimi.js?v=241` i bashkon si folderat + `fshira.marketet`, `eNjejte` i sheh marketet dhe `afat.m`. Afati: fusha `m` (id).
     Lokalisht `stoku:marketet:v1`; `porta.js` i fshin të dy çelësat kur ndërrohet llogaria. Kolegët (`FUSHAT_E_PERMBLEDHJES` +
     'mk') dhe serveri (`/orari` `mk` ≤ 60, ekipa.js, edhe kopja e `kontrolloNjoftimet`) marrin emrin e marketit.
   - **Telefoni**: Cilësimet → **Marketet** (data-leja afatet): shto (emri ≤ 60, pa dyfishe), prek → riemërto / **"Ruaj
     vendndodhjen këtu"** / fshi (afatet mbeten pa market). Marketi i parë merr krejt afatet pa market. Çipi **"Je te: X ▾"**
     (`#afMarketi`, edhe te kryefaqja; "Po sheh: Krejt marketet") → dritarja `#dlgMarketi` (marketet me numrat, Krejt, "Gjej me
     GPS", "Marketet e mia"). Afatet, numrat, shenja e tabit dhe eksporti = marketi aktiv (`afatetEMarketit()`); te "Krejt"
     karta e tregon marketin. "Afat i ri": `#afatMarketi` (i detyrueshëm kur ka markete); importi nga Excel dhe fleta nga foto
     → marketi aktiv, ose pyet `zgjidhMarketin('te-reja')`; përsëritja e fletës krahasohet brenda të njëjtit market.
   - **Admini**: Përdoruesit → përdoruesi → **"Afatet e X"** (tel: nënfaqja `perdoruesiAfatet`; PC: `#pdAfatetBtn` → `#dlgPdAfatet`):
     `merrDyqaninEPerdoruesit` (rregullat e lejojnë për adminin), grupuar me `MK.grupo`, vetëm lexim, "Shfaq edhe të hequrat".
   - **PC**: marketet menaxhohen te telefoni; PC ka `#afMarketiPc` (zgjedhje me dorë, pa GPS), filtrimin, `#afdMarketi`, emrin
     e marketit te rreshti (Krejt). Importi/fleta me "Krejt marketet" → toast "Zgjidh marketin" (s'ruhet).
   - **Privatësia** (21.10.2026): marketet + vendndodhja e marketeve; vendndodhja e personit krahasohet vetëm në telefon.
   - **Worker 167** (e ngjit pronari te Cloudflare; aplikacioni pret 167): `/orari` ruan `mk` (≤ 60); `njoftimiDitor` me
     markete: "3 produkte skadojnë sot. Albi Mall: Kos, Bukë · Viva Fresh: Jogurt." (deri 4 për market, "+N", ≤ 220 shenja; pa
     markete si më parë); `/ora/sot` dhe `/ora/krejt` e kthejnë `mk` (ora). Testi `teste/wp/marketet-prova.mjs`.
   - **VETËM PËR MERCHANDISERËT** (pronari: "mos e lësho për përdoruesit aktualë, vetëm për ata që hapin llogari nga ky moment
     me opsionin 'Punoj si merchandiser'; si admin te Përdoruesit me mujt me ja lejt ose nal, nëse e ka zgjedh gabim"):
     - Porta (`porta.js`): te "Krijo llogari" kutia **"Punoj si merchandiser (në disa markete)"** (`#pkMerch`, e pazgjedhur;
       kalimi te "Hyr" e heq) → `cloud.regjistrohu(emri, fj, { merchandiser })`. Pronari: "Më mbaj mend emrin e përdoruesit"
       s'duhet te "Krijo llogari" → `#pkMbajLbl` vetëm te "Hyr" (zgjedhja e ruajtur vlen njësoj edhe pas krijimit).
     - `firebase-tel.js` / `firebase-pc.js?v=241`: `regjistrohu` shkruan `perdoruesit/{uid}.merchandiser = true` (vetëm kur
       zgjidhet) dhe `localStorage 'stoku:merchandiser' = {uid, v}`; `regjistroTani` pas çdo hyrjeje e lexon
       (`lexoMerchandiserin`, getDoc) dhe njofton `stoku-merchandiser` vetëm kur ndryshon. Çelësi s'është te
       `CELESAT_E_TE_DHENAVE` (lidhet me uid-in). `ekipa.js` `degjoKrejtLlogarite` jep `merchandiser`.
     - `lejet.js?v=4`: leja e re **"Merchandiser (disa markete)"** `marketet` (`prindi: 'afatet'`, **`zgjedhje: true`**): ndryshe
       nga të tjerat, **mungon = e fikur** (`lejohet`), `pastro` e ruan vetëm kur caktohet, `krejt()` s'e prek, `meZgjedhjet()`
       e ruan vlerën e mëparshme te "Lejo krejt" / "Ndalo krejt" / "U kontrollua", `teNdaluara` s'e numëron, `zgjedhja()`
       kthen true/false/null. Rregullat e Firestore s'ndryshojnë (admini e shkruan te `lejet/{uid}` si leje tjetër).
     - Aplikacioni (`app-tel.js`, `app-pc.js`): `eshteMerchandiser()` = i kyçur + Afatet + (zgjedhja e adminit te lejet, ose
       flamuri i regjistrimit); `leja('marketet')` e përdor atë; `kaMarkete()` = merchandiser + të paktën një market.
       Cilësimet → Marketet `data-leja="marketet"`. Ndryshimi (event-i, hyrja, admini) → `rifreskoMerchandiserin()` /
       `zbatoLejet()` në kohë reale. Jo-merchandiserët: asnjë çip, asnjë pyetje për GPS, krejt afatet (edhe nëse dyqani ka
       markete), "Çka ka të re" pa hyrjet për marketet (`FJALET_E_LEJEVE` + `['marketet', /market/i]`; admini i sheh).
     - Admini (tel + PC): te lejet e përdoruesit "Merchandiser" (i ndezur sipas regjistrimit derisa ta ndryshojë),
       "merchandiser" te rreshti i listës dhe "Merchandiser" te të dhënat e llogarisë.
   - **Android (`tel/`)**: ACCESS_FINE/COARSE_LOCATION, WebView `setGeolocationEnabled(true)`, `onGeolocationPermissionsShowPrompt`
     vetëm për stoku.site (kërkon lejen e Android-it, `L_VENDI = 24`). **Ora (`ora/`)**: `Afat.marketi` (`mk` nga serveri)
     para datës te lista dhe në kërkim. APK-të i ndërton GitHub Actions.
   - **U krye nga pronari (21.10.2026)**: Worker 167 te Cloudflare; Cloudflare, rregulla "siguria", `Permissions-Policy` =
     `camera=(self), geolocation=(self), microphone=(), payment=(), usb=()` (njësoj si `teste/server-cloudflare.py`); APK-të
     e reja (telefoni v21, ora v49).
   - Testi `teste/marketet-v241.js` (95 OK): njësitë (+ lejet me zgjedhje, "Çka ka të re"), telefoni (GPS i simuluar me
     Playwright: dy markete, ndërrimi, zgjedhja me dorë, "Gjej me GPS", jashtë marketeve, sinkronizimi, /orari me `mk`,
     fshirja), llogari e vjetër me markete në dyqan (asnjë ndryshim, asnjë pyetje GPS), admini (afatet; "Merchandiser" ndez/fik
     në kohë reale, "Lejo krejt" s'e prek), PC, porta (kutia → `{ merchandiser }`, marketet po/jo pas hyrjes).
     `lejet-e2e-v231.js` / `lejet-pc-e2e-v231.js`: numërimet pa lejet me zgjedhje. `fs-server.js` e lexon `merchandiser` si
     firebase-tel.js.

0000000. **SASIA E SHPEJTË (+/-) SI LEJE TE PËRDORUESIT + TESTET NË REPO + CLAUDE.md (v240 = 1.31.0)**: pronari (foto e
   PC-së te Grupi → Anëtarët, kolona "+/-"): "hiqe prej qaty, qite te Cilësimet → Përdoruesit, me ja leju ose jo, bone
   aktive për të gjithë dhe çdo user të ri".
   - `lejet.js?v=3`: leja e re `stokuPlusMinus` "Sasia e shpejtë (+/-)" (butonat +/- te lista dhe numërimi me kamerë kur
     skanohet një produkt që ekziston), `prindi: 'stokuNdrysho'`; `lejohet()` e ndjek krejt zinxhirin e prindërve
     (+/- → Ndrysho produktet → Stoku). Çelësi që mungon = i lejuar, prandaj vlen për krejt llogaritë (edhe dokumentet e
     lejeve të ruajtura para v240), llogaritë e reja dhe vizitorin. "Ndrysho produktet" s'i përmend më butonat +/-.
     Rregullat e Firestore s'ndryshojnë (`lejet` ≤ 60 çelësa).
   - `eLejuarSasiaShpejte()` (app-tel.js, app-pc.js) = `leja('stokuNdrysho') && leja('stokuPlusMinus')`. U hoqën: emrat
     "farë" (`SASIA_SHPEJTE_EMRAT`, `EMRAT_FARE_SASIA`), `localStorage 'stoku:leja:sasia-shpejte'` (fshihet në hapje),
     ngjarja `stoku-leja-ndryshoi`, leximi/shkrimi i `perdoruesit/{uid}.sasiaShpejte` (firebase-*.js), `vendosLejen` dhe
     `sasiaShpejte` te `ekipa.js` (fusha e vjetër te `grupet/{g}/anetaret` injorohet; rregullat ende e lejojnë), kolona
     `#ekKolLeja`/`.k-leja` te PC (pc.html, `stoku-pc.css?v=32`) dhe "Butonat +/- te lista" te Grupi i telefonit.
   - teRejat 1.31.0: tel + PC (butonat për të gjithë; tel edhe numërimi me kamerë) dhe një hyrje `vetemAdmini` (ku është leja).
   - Testi `teste/plusminus-v240.js`: zinxhiri i lejeve, Grupi pa "+/-" (PC 7 kolona, tel pa "Butonat +/-"), llogari e
     vjetër dhe e re i kanë +/-, admini e ndal/kthen në kohë reale, pa "Ndrysho produktet" çelësi çaktivizohet.
   - **Testet në repo** (`teste/`, shih "Konventat e testimit") dhe **`CLAUDE.md`** (Claude e lexon vetë në fillim të çdo
     bisede: e dërgon te ky skedar, rregullat kryesore, rrjedha e punës). `_config.yml`: `exclude` teste/, CLAUDE.md,
     SHENIME.md (s'publikohen më në stoku.site; repo-ja mbetet publike në GitHub).
   - Siguria, gjendja përfundimtare (pronari, 21.10.2026): HSTS 12 muaj, DKIM `*._domainkey` `v=DKIM1; p=`, Protego A+
     91/100 (mbeten vetëm HSTS includeSubDomains/preload, me qëllim), securityheaders.com A+.

0000000. **SIGURIA: HEADER-AT E CLOUDFLARE + PORTA (v239 = 1.30.1)**: pronari solli raportet e skanerëve pas lidhjes së
   `stoku.site` me Cloudflare (securityheaders.com A+, pentest-tools Low, Protego D 57/100).
   - **Cloudflare (i vendos PRONARI, unë s'kam qasje)**: nameservers `amy`/`lamar.ns.cloudflare.com` (Hostinger), SSL Full, TLS 1.3
     minimum, HSTS (No-Sniff), Managed Transforms "Add security headers" (X-Frame-Options SAMEORIGIN, X-XSS-Protection, Referrer-Policy
     same-origin, Expect-CT), DNSSEC aktiv (DS te Hostinger: Key Tag 2371, Algorithm 13, Digest Type 2), CAA `letsencrypt.org` +
     `pki.goog`, SPF `v=spf1 -all`, DMARC `_dmarc` `v=DMARC1; p=reject;` (domaini s'dërgon email), Domain lock + Privacy protection.
     Transform Rule "siguria" (Rules → response header, "Set static"): `Permissions-Policy: camera=(self), geolocation=(self), microphone=(),
     payment=(), usb=()` (v241: `geolocation=(self)` për marketet me GPS, e ndryshoi pronari më 21.10.2026) (kamera vetëm për vetë stoku.site, për skanerin; testuar me `getUserMedia`: kamera po, mikrofoni jo),
     `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: same-origin` dhe CSP e plotë si header (bashkimi i
     meta-ve të 5 faqeve + `frame-ancestors 'none'`; më parë vetëm `frame-ancestors 'none'`, skanerët ankoheshin "pa default-src,
     script-src, base-uri, object-src" sepse meta s'e lexojnë). **RREGULL: shërbim i ri i jashtëm = shtoje te meta e 5 faqeve DHE
     te rreshti `CSP_CLOUDFLARE` më poshtë DHE kërkoji pronarit ta ndryshojë te Cloudflare** (header-i dhe meta zbatohen të dyja: ajo
     që mungon te njëra bllokohet). `siguria-v239.js` kontrollon që `CSP_CLOUDFLARE` = bashkimi i meta-ve + frame-ancestors.
     CSP_CLOUDFLARE: `default-src 'self'; script-src 'self' https://cdn.jsdelivr.net https://www.gstatic.com https://apis.google.com 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' data: blob: https://*.googleapis.com https://*.mendurb.workers.dev https://cdn.jsdelivr.net https://fastly.jsdelivr.net https://www.gstatic.com https://tiles.openfreemap.org https://ibasemaps-api.arcgis.com https://api.github.com; frame-src https://stoku-appi.firebaseapp.com; worker-src 'self' blob:; media-src 'self' data: blob:; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`
     (v244: + `https://tiles.openfreemap.org` te connect-src për hartën; pronari e ndryshoi te Cloudflare më 21.10.2026.)
     Testuar me një server lokal që i shton këto header-a çdo përgjigjeje (`cf-csp/server.py`): regresioni i plotë + service
     worker-i (instalimi, pa internet, kërkesat e lejuara pa shkelje, `example.com` bllokohet nga connect-src i SW-së).
     `siguria-v234.js`: me frame-ancestors si header shfletuesi s'e ngarkon fare faqen në iframe të huaj (korniza = faqe gabimi);
     testi e pranon edhe këtë ("bllokuar"), përveç fshehjes nga `kornize.js` (pa header, p.sh. GitHub Pages direkt).
   - **Protego "Hardcoded Password" (high)**: s'ishte fjalëkalim. Porta.js e vendoste `autocomplete` me dy vargje të plota
     ("new-..." / "current-..." me fjalën password, të ndara me ` : `), që modeli i skanerit e lexon si fjalëkalim = "...". Tash `(krijo ? 'new' : 'current') + '-password'`.
     `siguria-v239.js` kontrollon krejt skedarët që shërbehen (pa tel/, ora/, worker/) për modelet `password|passwd|pwd` = "...".
     Çelësi `apiKey` i Firebase në firebase-*.js/android.json është publik me qëllim (e mbrojnë rregullat), s'është sekret.
   - Të tjerat nga raportet: "Server/technology disclosed" (Cloudflare, GitHub Pages, Fastly) s'fshihet; "API endpoint
     manifest.webmanifest" = alarm i rremë; DKIM mungon sepse s'ka email (opsionale: `*._domainkey` TXT `v=DKIM1; p=`); HSTS 12 muaj
     (pronari); HSTS preload NUK u bë (e vështirë të kthehet, kërkon includeSubDomains); COEP NUK vendoset (bllokon jsDelivr/Firebase);
     CSP report-uri jo (vetëm info).

0000000. **ORA: PA "PAMJA", "KËRKO" SI BUTON, PA "8 DERI 30 DITË" (vetëm aplikacioni i orës, pa version të web-it)**: pronari
   (pas v238, me foto nga ora): (1) Cilësimet → "Pamja" (ngjyra kryesore) u hoq krejt: ngjyrat duhet të ndjekin datën e afatit;
   `Tema.theks` = gjithmonë e verdha e Stoku-t, `Tema.ngarko` fshin zgjedhjen e vjetër (`stoku-pamja`); u hoqën `Pamja.Ngjyrat`,
   `PamjaEkrani`, `RrethiNgjyres`, `NGJYRAT`. (2) "Kërko" s'është më chip: `ButoniKerko` (thjerrëza `IkonaKerko`) në rreshtin e
   poshtëm, mes `ButoniRifresko` dhe `ButoniCilesimet`. (3) "8 deri 30 ditë" u hoq (dalin lart te lista kryesore); mbetet vetëm
   "Mbi 30 ditë" (`Pamja.Grupi("gjelber")`). Pa ndryshim te Worker-i dhe web-i. Pa testim në orë të vërtetë.
   (4) Kërkimi: me `BasicTextField` shkronjat e fshira mbeteshin (tastiera e orës në ekran të plotë s'ia kalonte fshirjet) dhe
   rezultatet dilnin gjatë shkrimit. Tash `KerkoEkrani` përdor hyrjen e sistemit të orës (`android.app.RemoteInput` me intent-in
   "android.support.wearable.input.action.REMOTE_INPUT", si te mesazhet; tastierë ose zë): rezultatet vetëm pas konfirmimit;
   chip-i me pyetjen e rihap hyrjen, "✕ Pastro" e zbraz. Hapet vetë herën e parë. MOS përdor fusha teksti brenda aplikacionit të orës.

0000000. **KONTROLLI PËR ÇDO PRODUKT/FURNIZUES, CSP E PLOTË, LOGOJA, PDA, ORA (v238 = 1.30.0, Worker 166)**: kërkesat e pronarit:
   (1) "te Cilësimet > Stoku më janë shtuar furnizues e produkte pa dalë për kontroll... çdo import (foto e fletës, skedar, skanim,
   shkrim me dorë) të dalë për kontroll"; (2) raporti i tretë i sigurisë (UpGuard): "CSP implemented unsafely"; (3) logoja në PC:
   hapësira djathtas saj njihej si logo ("Përmbledhja"); klikimi i logos = rifreskim + risinkronizim (PC, web, Android); (4) PDA:
   "Fshih tastierën" aktiv = asnjë tastierë në ekran askund; (5) ora: krejt produktet, të gjelbrat (>30 ditë) te një buton në fund,
   kërkimi sipas produktit/furnizuesit/barkodit.
   - **(1) Shkaku**: (a) mësimi në sfond (`planifikoMesimin` → `mesoShume(..., 'plotëso')` nga afatet, stoku dhe afatet e kolegëve)
     krijonte hyrje automatike (`a:1`) pa autor = të kontrolluara, direkt te Produktet; (b) `ruajFurnizuesitEMiratuar` (sfondi i
     administratorit) i ruante si të KONTROLLUAR furnizuesit e afateve/stokut pa hyrje; (c) `listaEFurnizuesve`: furnizuesi pa hyrje
     dilte i kontrolluar sapo kishte një afat/produkt; (d) shkrimi pa autor (llogaria ende e panjohur) s'priste kontrollin.
     **afatet.js?v=238**: `eshteNePritje(x) = !x.x && (x.s ? x.r : (x.n || x.r))` (r edhe pa s); 'plotëso' i ri ose mbi një në
     pritje → `r:1`; 'mbishkruaj' pa autor ose mbi një në pritje → `r:1`; `vendos`/`regjistroIRi` pa autor → `r:1`;
     `siguroFurnizuesitNePritje` (produkt pa autor) → furnizuesi me `r:1`; `hyrjaEPastruar`/`hyrjePerGrup` e ruajnë `r` edhe pa `s`;
     metodë e re `regjistroFurnizuesitNePritje(emrat)` (vetëm administratori, kohë 1, vetëm emrat pa asnjë hyrje, as të fshirë), që
     e zëvendëson `regjistroFurnizuesit` te `ruajFurnizuesitEMiratuar` (tel + PC); `listaEFurnizuesve`: pa hyrje = në pritje
     (`r.pritje = !r.regjistruar`). Migrimi një herë për pajisje (`stoku:kujtesa:kontrolli-v238`): të mësuarat vetë (`a`, pa m/s/n/r)
     e 30 ditëve të fundit → `r:1` (vetëm lokalisht, koha s'ndryshon). Lista publike e sugjerimeve (`publikoFurnizuesit`) ka vetëm të
     kontrolluarit. Testi `kontrolli-v238-njesi.js` (24; me kodin e vjetër 9 gabime); u përditësuan kujtesa-njesi, kujtesa-test,
     kujtesa-grupi-test, harro-sync-test (furnizuesi i kontrolluar te `grupet/g1/kujtesa/px`), furn-ruaj-test, furn-sugjerim-test.
   - **(2) CSP pa 'unsafe-inline'**: krejt skriptat inline u nxorën në skedarë: `kornize.js` (kundër iframe), `fillimi-tel.js` /
     `fillimi-pc.js` (koka), **`app-tel.js` (KODI KRYESOR I TELEFONIT, ~7270 rreshta) / `app-pc.js` (i kompjuterit, ~6010)**,
     `firebase-tel.js` / `firebase-pc.js` (moduli), emri i dyqanit poshtë logos te `fillimi-*.js` (MutationObserver, para
     vizatimit të parë; një skript i jashtëm në body e vonte: ikonat-test "logoja e qëndrueshme"), `es2020.js` (zëvendëson `new Function` te
     porta.js: `window.__stokuES2020`), `tema.js` (404 + privatësia), `faqja-404.js`, `faqja-android.js`. CSP në meta te 5 faqet:
     `default-src 'self'; script-src 'self' cdn.jsdelivr.net www.gstatic.com apis.google.com 'wasm-unsafe-eval'` (ZXing),
     style 'unsafe-inline', img https:/data:/blob:, connect *.googleapis.com, *.mendurb.workers.dev, jsDelivr (+ api.github.com
     te android.html), frame-src stoku-appi.firebaseapp.com, object-src 'none', base-uri/form-action 'self'. **RREGULL I RI: s'ka më
     skripta inline as `onclick=` në HTML; kodi i ri shkon te app-tel.js/app-pc.js (rrit ?v= te faqja dhe sw.js). Shërbim i ri i
     jashtëm = shtoje te CSP-ja e 5 faqeve.** Testi `csp-v238.js` (asnjë shkelje: porta, Cilësimet, PDF, ZXing, html5-qrcode,
     404/android/privatësia; skripti/onerror i injektuar s'ekzekutohet).
   - **(3) Logoja**: `#logoButon` = vetë `.stk-etiketa` (tel te `#logoSlika`, PC te `#logo`), `title="Rifresko dhe sinkronizo"`;
     `rifreskoMeLogo()` (app-tel/app-pc): `kryeSinkronizimin()` (≤ 5 s) + `reg.update()` (≤ 1,5 s) + `location.reload()`. PC
     `#logo` s'ka më kursor/rol/"Përmbledhja". CSS te stoku-tokens.css?v=6. Testi `logo-v238.js`.
   - **(4) PDA**: `MutationObserver` (`vezhgoFushatERe`) u jep `inputmode="none"` fushave të reja para fokusit; `pointerdown`
     readonly 120 ms edhe kur fusha është e fokusuar; `mbyllTastierenMeVonese` (0/60/250 ms) te pointerdown/focusin/click;
     aplikacioni Android (APK e re): `StokuAndroid.tastieraFshehur(po)` (SOFT_INPUT_STATE_ALWAYS_HIDDEN) dhe
     `StokuAndroid.fshihTastieren()` (WindowInsets ime + InputMethodManager). Testi `pda-tastiera-v238.js`.
   - **(5) Ora**: Worker 166 `GET /ora/krejt` → `{ dita, d7, d30, krejt }` (krejt afatet aktive, sipas datës) + fusha `f`
     (furnizuesi ≤ 80) te `/orari` (ekipa.js e dërgon). Ora: `Afat.furnizuesi`, `Krejt`, `Api.merrKrejt/krejtERuajtur`
     (kopje "krejt"); në fund të listës `ChipGrupi`: "8 deri 30 ditë", "Mbi 30 ditë" (e gjelbër), "Kërko"; `ListaEGrupit`,
     `KerkoEkrani` (BasicTextField, pa dallim shkronjash/shenjash); `Pamja.Detaji(nga)` kthehet te ekrani nga erdhi. Testi
     `wp/ora-krejt-prova.mjs`. Duhet: Worker 166 te Cloudflare + APK e re e orës (GitHub Actions).
   - Pa testim në pajisje të vërtetë (as ora, as PDA, as aplikacioni Android).

0000000. **PRIVATËSIA + SECURITY.TXT (v237 = 1.29.4)**: pronari: kontakti publik `mendurb@gmail.com`, emri i biznesit "Stoku".
   - `privatesia.html` (adresa absolute si 404.html, tema e çelët/errët, CSP minimale): çka ruhet (llogaria, dyqani, skedarët 7 ditë,
     grupi, foto e profilit, njoftimet/ora, lejet, kodi i fjalëkalimit), leximi me AI (Gemini/Claude/Workers AI, pa ruajtje), pajisja
     (localStorage, pa cookies/reklama/gjurmim), kush e sheh (vetë, grupi, administratori), ku ruhet (Firebase, Cloudflare, GitHub
     Pages, jsDelivr), afatet e mbajtjes, të drejtat + AIP e Kosovës. **Përditësoje kur Stoku fillon të ruajë diçka të re.**
   - Lidhjet: `<link rel="privacy-policy">` te index/pc, porta (`.pk-fund`, poshtë kartës, `target=_blank`), tel Cilësimet → Rreth
     Stoku `#opsPrivatesia`, PC poshtë majtas te Cilësimet `#opsPrivatesia` (`window.open(..., '_blank', 'noopener')`). porta.js?v=237.
   - `/.well-known/security.txt` (Contact, **Expires 2027-10-01: rinovoje para kësaj date**, Canonical) + `_config.yml`
     (`include: [".well-known"]`, pa të Jekyll i GitHub Pages i injoron dosjet me ".").
   - Testi: `privatesia-v237.js`.

0000000. **PENTEST-TOOLS (v236, pa hyrje te "Çka ka të re")**: raporti "Light" i pentest-tools.com (20.10.2026): rreziku **Low**, 0
   critical/high/medium. Gjetjet: CSP pa `script-src`/`default-src` (CSP-ja minimale e v234 në meta; e plotë s'vendoset, shih v234),
   pa `X-Content-Type-Options` dhe `Strict-Transport-Security` (GitHub Pages; zgjidhja: Cloudflare Transform Rules + HSTS, pronari
   po e lidh `stoku.site` me Cloudflare: nameservers `amy`/`lamar.ns.cloudflare.com` te Hostinger), "Suspicious Comment" (komenti
   HTML `<!-- v230: vetëm administratori (mendurberisha)… -->` te faqja "Përdoruesit": **u hoq** nga index.html dhe pc.html;
   **mos shkruaj emra llogarish ose fjalë si "admin" në komente HTML**, se shihen në burimin e faqes), teknologjitë (info),
   `security.txt` mungon (pritet email-i i kontaktit nga pronari), "API endpoint" `manifest.webmanifest` (gabim i skanerit).
   CACHE `stoku-v236`.

0000000. **LIBRARITË E PËRDITËSUARA (v235 = 1.29.3)**: pronari dërgoi raporte nga skanerë online (Sucuri, ImmuniWeb, pentest-tools).
   ImmuniWeb: "4 outdated dependencies". `npm audit` me versionet e Stoku-t: **jsPDF 3.0.3 kishte 10 këshilla sigurie** (1 critical:
   path traversal vetëm në Node; në shfletues: injektim në AcroForm/addJS/FreeText, DoS me BMP/GIF, "HTML injection in New Window
   paths"), të ndrequra te 4.2.1. Stoku përdor vetëm text/rect/line/addImage/addPage/output, por përditësimi është i lirë.
   - jsPDF 3.0.3 → **4.2.1**, JsBarcode 3.11.5 → **3.12.3**, barcode-detector 3.2.2 → **3.2.3** me zxing-wasm 3.1.3 → **3.1.6** (ponyfill-i
     3.2.3 e pret 3.1.6; `WASM_ZXING` te index.html duhet të përputhet). Me SRI të ri (hash-et nga `npm pack`), sw.js `CDN_BIBLIOTEKA`.
   - **Firebase mbetet 12.19.0** (versioni i fundit 12.x). 13.0.0 (7 tetor 2026) është version i madh dhe shumë i ri; këshillat e
     `npm audit` për firebase vijnë nga `@grpc/grpc-js` (vetëm Node), jo nga build-i i shfletuesit.
   - Testi: `librarite-v235.js` (PC: PDF lista + etiketat shkarkohen, me figura; tel: ZXing 3.1.6 e lexon EAN-13 të vizatuar me
     JsBarcode 3.12.3). Kopjet lokale te `scratchpad/npm` u përditësuan (kopja e vjetër: `npm-vjeter-v234`).
   - Pjesa tjetër e raporteve: header-at (HSTS, X-Frame-Options, CSP si header, X-Content-Type-Options, Referrer-Policy,
     Permissions-Policy) dhe "Website Firewall" kërkojnë Cloudflare para GitHub Pages (Transform Rules), e bën pronari. GDPR: s'ka
     faqe privatësie (pritet përgjigjja e pronarit për të dhënat e kontaktit). PCI DSS: Stoku s'merr pagesa me kartelë.

0000000. **SIGURIA (v234 = 1.29.2, Worker 165)**: pronari: "disa faqe online thonë që ky web app ka shumë vulnerabilities".
   Kontroll i plotë (klienti, rregullat e Firestore, Worker-i, sw.js, sekretet në repo). Të ndrequra:
   - **Worker 165, fjalëkalimi i harruar**: `/fjalekalimi/verifiko|ndrysho` e lexonte `provat` dhe e shkruante pas krahasimit,
     prandaj kërkesat njëkohësisht e anashkalonin kufirin e 5 provave (riprodhuar: 60 prova paralele, krejt 60 krahasoheshin,
     edhe kodi i saktë pranohej). Tani prova shkruhet PARA krahasimit me `currentDocument.updateTime` (shkrim me kusht;
     `lexoDoc` jep `_versioni`, `vendosDoc(rruga, obj, token, kushti)` kthen `updateTime`); kërkesat që humbin garën marrin
     429 `zene` (porta: "Diçka shkoi keq te serveri. Provo përsëri pas pak."). Kodi i saktë e kthen provën mbrapsht (me kusht).
     `ekipa.js?v=234` pret Worker 165 (administratori sheh "ngjite kodin e ri" derisa ta vendosë).
   - **SRI** (`integrity="sha384-…"`) te 4 skriptat e jsDelivr (html5-qrcode, barcode-detector, JsBarcode, jsPDF), te index.html
     dhe pc.html. Hash-et nga tarball-et e npm (të njëjtat bajte që jep jsDelivr). sw.js i ruan si përgjigje CORS (`cache.add`),
     prandaj SRI kalon edhe pa internet. Kur ndërrohet versioni i një librarie, DUHET ndërruar edhe hash-i (përndryshe s'ngarkohet).
   - **Kundër "clickjacking"**: GitHub Pages s'lejon header-a (X-Frame-Options / frame-ancestors s'punojnë në meta), prandaj
     `<style id="paKornize">html{display:none}` hiqet vetëm kur `window.self === window.top`; në iframe provon `top.location`.
   - **CSP minimale** në meta: `object-src 'none'; base-uri 'self'; form-action 'self'` + `referrer` strict-origin-when-cross-origin.
     CSP e plotë (script-src) NUK u vendos: kodi ka shumë skripta inline, porta.js përdor `new Function` për ta njohur shfletuesin e
     vjetër, ZXing kërkon `wasm-unsafe-eval`, Firebase Auth ngarkon iframe nga firebaseapp.com; gabim aty = Stoku s'hapet.
   - **sw.js**: `notificationclick` hap vetëm adresa të së njëjtës origjinë.
   - Testi: `siguria-v234.js` (SRI ngarkon/refuzon skriptin e ndryshuar, iframe nga origjinë tjetër në portin 8766 = e fshehur,
     sw), `wp/fjalekalimi-prova.mjs` 8–8c (gara). Pa testim në pajisje të vërtetë.
   - **Jo dobësi (raportet automatike i shënojnë gabimisht)**: çelësi `AIza…` i Firebase-it në HTML është publik sipas dizajnit
     (mbrojtja = rregullat e Firestore). Mund të kufizohet te Google Cloud Console (API restrictions), jo me referrer (Worker-i dhe
     aplikacioni Android e përdorin pa referrer).
   - **Të mbetura (vendim i pronarit)**: lejet (lejet.js) zbatohen vetëm në aplikacion, jo te rregullat e `dyqane/{uid}`; një llogari
     mund ta vendosë vetë `perdoruesit/{uid}.sasiaShpejte` (butonat +/-, vetëm te dyqani i vet); `/fjalekalimi/kerko` tregon a ekziston
     një emër; fjalëkalimi minimum 6 shenja; `tel/stoku-tel.jks` dhe `ora/stoku-ora.jks` në repo (të mbrojtura me `APK_FJALEKALIMI`).

0000000. **DYQANI S'MBETET PA FOLDERA (v233 = 1.29.1)**: pronari, pas v232: folderat e pda34 "po i heken", edhe pse s'ia
   ka ndaluar t'i ketë (pda34 s'ka lejen "Krijo dhe ndrysho folderat", prandaj s'ka as "Folder i ri"). **Shkaku**: 4
   folderat e parazgjedhur kanë të njëjtat id në krejt llogaritë (`ushqimore`, `pije`, `higjiene`, `fresh`) dhe s'kanë
   `ndryshuarSe` (koha 0). Në cloud-in e pda34 kishte shënime fshirjeje për ta, të ardhura nga llogaria e administratorit
   përmes gabimit të dy dritareve (v232; administratori i ka fshirë 4 të parazgjedhurit). Shënimet mbahen 120 ditë dhe çdo
   shënim fiton ndaj kohës 0, prandaj sa herë që aplikacioni i krijonte (pajisje e re, ose `zbatoGjendjenNgaCloud` kur
   cloud-i s'ka foldera), bashkimi i hiqte pas 200 ms (riprodhuar: `[4, 0]`, tel dhe PC). v232 e ndal rrjedhjen e re, por
   shënimet e vjetra mbetën.
   - **bashkimi.js?v=233**: `sigurojFolderat(g, tani)`. Kur gjendja e bashkuar s'ka asnjë folder, kthehen 4 të parazgjedhurit
     me `ndryshuarSe: tani` (fitojnë ndaj shënimeve të vjetra) dhe hiqen shënimet e fshirjeve për id-të e tyre (edhe ato me
     kohë në të ardhmen, nga një orë e gabuar). Përjashtim: një shënim fshirjeje folderi nga 10 minutat e fundit
     (`FSHIRJE_E_FRESKET_MS`, me vlerë absolute): dikush sapo i fshiu qëllimisht, prandaj s'kthehen menjëherë; pas 10
     minutash, në sinkronizimin e radhës, kthehen. Llogaria me foldera s'preket (p.sh. administratori, që i ka fshirë 4 të
     parazgjedhurit dhe ka folderat e vet).
   - Thirret pas çdo bashkimi me cloud-in: tel `bashkoPaFshirje` (transaksioni, hyrja, dëgjuesi, `zbatoRemoteNePritje`), PC
     `bashkoMeCloud` (`kryeSinkronizimin`, `zbatoNgaCloud`, `zbatoRemoteNePritje`). Kthimi shkon në cloud në të njëjtin
     transaksion, pa dridhje në ekran. Vlen për krejt llogaritë, pa varësi nga lejet.
   - Testet: `folderat-v233-njesi.js` (9: pda34, pajisja tjetër me shënimet lokale, dyqan bosh, fshirja e freskët, pas 10
     minutash, llogari me foldera, ora e gabuar) dhe `folderat-v233.js` (telefoni i pda34 me 0 foldera dhe pa lejen
     `stokuFoldera`, pajisje e re, rifreskim, PC me 0 foldera, PC i ri, fshirja e qëllimshme e krejt folderave nga X: s'kthehet
     as nga Y, pas 10 minutash kthehet). Me kodin e v232 dështojnë 11 kontrolle (`[4, 0]`). Pa testim në pajisje të vërtetë.

0000000. **FOLDERAT S'HUMBIN MË (v232 = 1.29.0)**: pronari: "Gjej problemin pse i hup folderat" (llogaria pda34 te Chrome i
   telefonit: 0 foldera, 0 produkte). **Shkaku**: aplikacioni i instaluar nga Chrome dhe skeda e Chrome-it (ose dy skeda) e
   ndajnë `localStorage`-in dhe hyrjen e Firebase-it. Kur në njërën ndërrohej llogaria, porta aty i fshinte të dhënat e vjetra
   dhe shkruante pronarin e ri (`stoku:pronari-uid`), por dritarja tjetër merrte vetëm ndryshimin e hyrjes: pronari ishte
   tashmë i riu, s'rifreskohej dhe sinkronizonte në llogarinë e re të dhënat e llogarisë së vjetër që i kishte në memorie
   (bashkë me shënimet e fshirjeve, `fshira`). Kështu folderat përziheshin mes llogarive ose fshiheshin (p.sh. fshirjet e 4
   folderave të parazgjedhur të administratorit kalonin te pda34). Telefoni punon nga memoria (`gjendjaPerCloud`), prandaj
   preket ai; PC-ja i lexon nga `localStorage` (provuar, s'u prek, por mbrohet njësoj).
   - **porta.js?v=232**: `pronariIFaqes` = pronari i të dhënave në memorie (lexohet në hapje, bëhet uid-i në hyrjen e parë).
     `kontrollo`: kur pronari i ruajtur është tashmë uid-i i ri, por faqja ka të dhënat e një llogarie tjetër, faqja vetëm
     rifreskohet (me `stopImmediatePropagation`, para sinkronizimit). Dëgjuesi `storage`: çdo faqe me llogari (jo vetëm prova)
     rifreskohet sapo `stoku:pronari-uid` ndryshon nga pronari i saj. `StokuPorta.teDhenatELlogarise(uid)`: tel
     `perdoruesiAktual()` dhe PC `perdoruesi()` kthejnë `null` derisa faqja të rifreskohet (s'sinkronizon, s'dërgon afate).
     `stoku:kopja-fshirjeve:v1` hyri te `CELESAT_E_TE_DHENAVE` (fshihet me ndërrimin e llogarisë).
   - **Kopja e të fshirave** (tel + PC): kur sinkronizimi heq foldera ose produkte që ishin në këtë pajisje
     (`ruajTeFshiratNeKopje`, para se të zbatohet gjendja e re: tel `zbatoBashkimin` / `zbatoGjendjenNgaCloud`, PC
     `zbatoNgaCloud`), ato ruhen te `stoku:kopja-fshirjeve:v1` (`{uid, foldera, produktet, koha}`, 30 ditë, deri 20000
     produkte). Produkti i zhvendosur (i njëjti barkod në folder tjetër) s'llogaritet i fshirë; folderi i parazgjedhur bosh e
     i paprekur (pa `ndryshuarSe`) s'ruhet; pajisja e paprekur dhe "Rikthe nga cloud" (tel `zbatoGjendjenNgaCloud(te, true)`)
     s'bëjnë kopje. Te Cilësimet → Llogaria (tel `#llKopjaSeksion`, PC `#opsKopja`) del "Të fshira nga një pajisje tjetër"
     me çka mungon tani (`teMungueshmetNgaKopja`); "Rikthe" i kthen me kohë të re (`ndryshuarSe` / `prekurSe`, hiqen shënimet
     e fshirjeve), pra fitojnë edhe në cloud dhe në pajisjet e tjera; "Hiq kopjen" e heq. Kur krejt çka ishte në kopje është
     sërish këtu (p.sh. u rikthye nga një pajisje tjetër), kopja hiqet vetë (`rifreskoKopjen`, pas zbatimit të gjendjes).
   - Pa ndryshim në rregullat e Firestore, Worker, `bashkimi.js`, `ruajtja.js`. Të dhënat e humbura para v232 s'kthehen
     vetë: në cloud mbeten vetëm shënimet e fshirjeve (id-të dhe kohët), pa emra e sasi. Një pajisje që i ka ende në memorie
     dhe e hap v232 para se të sinkronizojë, i ruan në kopje kur i heq, dhe kthehen me "Rikthe".
   - Testet: `dy-skeda-llogari.js` (telefoni: dy faqe në një kontekst, ndërrimi i llogarisë: pda34 i mban 4 folderat, asnjë
     folder i administratorit s'kalon, aplikacioni rifreskohet, fshirja e pda34 s'kalon te administratori; dështonte para
     v232), `dy-skeda-llogari-pc.js` (njësoj për PC), `kopja-v232.js` (2 telefona + PC: kopja, teksti, "Rikthe" nga telefoni
     dhe nga PC-ja, "Hiq kopjen", folderi i parazgjedhur bosh, ndërrimi i llogarisë). `fs-server.js` (scratchpad):
     `__fsNdrroLlogarine(uid, email)` dhe `__fsLlogaria` (llogaria e ndërruar vlen edhe pas rifreskimit). Pa testim në
     pajisje të vërtetë.

0000000. **LEJET PA ASNJË MESAZH (v231 = 1.28.1)**: kërkesa e pronarit: kur ndalohet një opsion, i zhduket krejt përdoruesit,
   që ai të mos e dijë as që ekziston; jo mesazhe si "e ke të ndaluar nga administratori".
   - **U hoqën**: `lejaOse` (njoftimi "Kjo s'të lejohet… Pyete administratorin."; çdo kontroll tani është `leja(k)`, pa zë),
     njoftimi "Administratori t'i ndryshoi lejet e llogarisë.", seksioni "Lejet e llogarisë" te Cilësimet → Llogaria (tel
     `#llLejetSeksion`, PC `#opsLejet`), karta "Stoku s'është i lejuar" (tel), mbulesa `#lejaPcMbulese` (PC), shënimi
     "Vetëm për t'u parë…" te afati (dritarja mbetet vetëm për lexim, pa shënim), "Pyete administratorin" te mungesa e folderave.
   - **Telefoni pa `stoku`**: s'del as tabi "Stoku" (`#tabStoku` me `data-leja`). Faqja bazë (`faqjaBaze()`): Afatet, ose
     Grupi, ose Cilësimet kur s'ka asnjërën; hapet si kryefaqe (`hapFaqenBaze()`, nga `zbatoLejet` dhe në hapje). S'numërohet
     si nivel te `niveletEHapura()` ("mbrapa" aty del nga aplikacioni, si te kryefaqja); kur mbyllet një tab tjetër
     (`mbyllAfatetFaqe` / `mbyllEkipiFaqe` / `mbyllOpsionet` → `pasMbylljesSeTabit()`, mikrodetyrë), rihapet faqja bazë
     nëse s'u hap tjetër në vend të tij.
   - **Pa `pc`**: në kompjuter hapet versioni i telefonit, pa dritare. Koka e `pc.html` lexon `stoku:lejet:v1` dhe bën
     `location.replace('./')` para vizatimit; gjatë punës `zbatoLejet` → `kaloTeTelefoni()` (vetëm kur leja e ruajtur ka
     `pc:false`, që të mos ketë qark). Koka e `index.html`: në kompjuter s'ridrejton te `pc.html` kur leja e ruajtur ka
     `pc:false` (`window.__stokuPaPc`); kur leja kthehet (ose dilet nga llogaria), `ndryshoi` → `pc.html`. Në PC `leja(k)`
     s'lejon asgjë pa `pc`. "Dërgo në PC" (tel) kërkon edhe `pc` (`lejaDergoNePc()`); fleta me AI vazhdon direkt në telefon.
   - **Skanimi pa leje, neutral**: barkodi që ekziston pa `stokuNdrysho` filtrohet në listë/tabelë (pa dritare); barkodi i ri
     pa `stokuShto`: "Ky barkod s'është në këtë folder."; rreshti i produktit pa `stokuNdrysho` s'hapet; PC: kërkimi global
     dhe "Ndryshuar së fundi" të çojnë te folderi i filtruar (`shfaqOseHapProduktin`).
   - **Edhe**: pa `afatet` s'del "Të skaduara" (tel kryefaqja, PC Përmbledhja). Tel, Cilësimet: "Skanimi" fshihet pa Stok dhe
     pa Afate, "Produkte pa emër" pa Stok, "Njoftimet" pa Afate dhe pa Grup, "Njoftimi ditor për afatet" pa Afate. PC:
     shkurtoret e tastierës vetëm për çka lejohet (`LEJA_E_SHKURTORES`); pa asnjë pjesë, `#pamjaMbyllur` ka vetëm logon.
   - **Jashtë faqes** (`zbatoLejetJashte()`, tel + PC, në çdo ndryshim lejesh dhe te `stoku-cloud-gati` /
     `stoku-auth-ndryshoi`): pa `grupi` pajisja s'regjistrohet te `grupet/{g}/push` (ekipa.js `lejoPushinEGrupit(false)` →
     `hiqPajisjenNgaGrupi()`; `aktivizoPush` s'e regjistron, as kur leja hiqet gjatë regjistrimit), pra Worker-i s'i
     dërgon asnjë kërkesë a njoftim të grupit (edhe Android/FCM); `njoftoNgaEkipa` / `ekNjofto` s'nxjerrin asgjë; te
     Njoftimet gjendja `aktive` pa tekst për Grupin. Pa `afatet`: `dergoAfatetPerOrarin([])` (tel `afatetPerServerin()`,
     PC `lejaELlogarise('afatet')`), pra s'vjen njoftimi ditor dhe ora e dorës s'tregon produkte; kur leja kthehet,
     dërgohet lista e vërtetë. Në PC për këto përdoret leja e llogarisë pa kushtin `pc` (`lejaELlogarise`).
   - **"Çka ka të re"**: fusha e re `vetemAdmini` te `teRejat.js` (`teRejatPas(v, platforma, admin, lejohet)`); hyrjet v230
     dhe v231 i sheh vetëm administratori. Me `lejohet(k)` (tel `lejaPerTeRejat`, PC `leja`) s'dalin as hyrjet që flasin
     për një pjesë të ndaluar: `lejetEHyrjes(h)` i gjen pjesët nga teksti me `FJALET_E_LEJEVE` (fjalë kyçe; "Stoku" me
     shkronjë të madhe është emri i aplikacionit). Hyrje e re që flet për një pjesë duhet ta përmendë me fjalët kyçe. Te faqja e administratorit (detajet e përdoruesit): "Çka s'i lejohet, i zhduket krejt, pa
     asnjë mesazh." `lejet.js?v=2`: vetëm përshkrimet e `pc` dhe `dergoNePc`; `ekipa.js?v=231`. Rregullat e Firestore dhe
     Worker-i s'ndryshuan (mbeten v230 dhe 164).
   - Testet: `lejet-e2e-v231.js` (telefoni, 82 kontrolle: asnjë "lejohet/lejuar/administrator/ndaluar" në faqe e njoftime,
     faqja bazë, "mbrapa", skanimi, pa PC, "Çka ka të re") dhe `lejet-pc-e2e-v231.js` (PC, 64: PC → telefon → PC, faqja bosh,
     shkurtoret, fusha e barkodit, kërkimi), `lejet-push-v231.js` (pa Grup: pajisja jashtë `grupet/{g}/push`, pa njoftim
     të grupit; pa Afate: lista bosh te serveri; kthimi i lejeve). Pa testim në pajisje të vërtetë.

0000000. **LEJET E PËRDORUESVE (v230 = 1.28.0)**: kërkesa e pronarit: te Cilësimet, te grupi "Aplikacioni", një opsion që
   e sheh VETËM administratori `mendurberisha`, me krejt përdoruesit; brenda secilit, krejt veçoritë e Stoku-t për t'i
   lejuar ose ndaluar. Llogaritë e reja i kanë KREJT lejet derisa administratori t'i kontrollojë, dhe dalin aty për kontroll.
   - **`lejet.js`** (i ri, i përbashkët): `KATALOGU` me 21 leje në 5 grupe (Stoku: `stoku`, `stokuShto`, `stokuNdrysho`,
     `stokuFshi`, `stokuFoldera`, `stokuImporto`; Afatet: `afatet`, `afatetShto`, `afatetNdrysho`, `afatetFshi`, `afatetAI`,
     `afatetImporto`; Grupi: `grupi`, `grupiHeq`, `grupiKerkesat`; Skanimi dhe skedarët: `kamera`, `eksportExcel`,
     `eksportPdf`, `dergoNePc`; Pajisjet: `ora`, `pc`). `prindi`: pa pjesën (p.sh. `afatet`) s'ka as veprimet e saj.
     Firestore `lejet/{uid}` = `{ lejet: {çelësi: bool}, kontrolluarSe, kontrolluarNga, emri }`; pa dokument = "Pa u
     kontrolluar" = krejt të lejuara; çelësi që mungon = i lejuar (leje të reja në të ardhmen s'ndalojnë asgjë).
     `krijoGjendjen`: dëgjon dokumentin e llogarisë, e ruan te `localStorage` `stoku:lejet:v1` ({uid, lejet}) që kufizimet
     të vlejnë që në hapje (edhe para se Firebase të dijë a je hyrë, edhe pa internet); me daljen fshihet. Administratori
     dhe vizitori: pa kufizime. Gabim leximi (p.sh. rregullat para v230) = mbeten lejet e ruajtura (ose krejt të lejuara).
   - **Zbatimi** (v231 i hoqi krejt mesazhet e mëposhtme, shih hyrjen v231) (vetëm në aplikacion, jo në rregullat e
     dyqanit): butonat me `data-leja="çelësi"` marrin `.leja-ndaluar`
     (`display:none !important`); çdo veprim kontrollohet edhe vetë me `leja(k)` / `lejaOse(k)` (njoftimi "Kjo s'të lejohet
     në këtë llogari. Pyete administratorin."), që shkurtoret, njoftimet dhe thirrjet e drejtpërdrejta të mos e anashkalojnë.
     Ndryshimi nga administratori vjen në kohë reale ("Administratori t'i ndryshoi lejet e llogarisë."): faqet e ndaluara
     mbyllen, listat rivizatohen. Te Cilësimet → Llogaria (tel `#llLejetSeksion`, PC `#opsLejet`) shkruan çka s'lejohet.
     Pa `stoku` s'del as Cilësimet → Stoku; "Prano/Refuzo" për heqjen që e bëri një koleg kërkon `afatetNdrysho`.
     - Telefoni: pa `stoku` kryefaqja tregon kartën "Stoku s'është i lejuar" (pa kërkim, import, foldera); pa `afatet` /
       `grupi` tabi s'del (edhe njoftimi s'e hap); pa `afatetNdrysho` afati hapet vetëm për t'u parë (`#dlgAfat.vetem-lexim`);
       butonat +/- dhe numërimi me kamerë kërkojnë edhe `stokuNdrysho`; pa `dergoNePc` eksporti shkarkohet/ndahet direkt
       (pa `#dlgKuSkedari`); pa `ora` s'del "Ora e dorës" dhe heqjet nga ora s'zbatohen; pa `afatet` s'ka njoftime skadimi.
     - PC: pamja që s'lejohet kalon te pjesa e parë e lejuar (Stoku → Afatet → Grupi), pa asnjë: `#pamjaMbyllur`; pa `pc`:
       mbulesa `#lejaPcMbulese` (s'mbyllet me Esc/klik, vetëm "Dil nga llogaria"); menuja e folderit, dritarja e eksportit,
       rreshtat e tabelave dhe fletët nga telefoni tregojnë vetëm çka lejohet.
   - **Cilësimet → Përdoruesit** (vetëm administratori; tel: rreshti `#tabPerdoruesit` te "Aplikacioni", faqet `perdoruesit`
     dhe nënfaqja `perdoruesi`; PC: skeda `#opsSkedaPerdoruesit`, faqja `#pdPamja` me listë → detaje). Dy dëgjues
     (`ekipa.degjoKrejtLlogarite` + `lejet.degjoKrejt`) që nisin 2,5 s pas hyrjes së administratorit. Lista: "Pa u
     kontrolluar" (më e reja e para) dhe "Të kontrolluar"; detajet: çelës për çdo leje (ruhet menjëherë dhe e shënon
     llogarinë të kontrolluar), "U kontrollua", "Lejo krejt", "Ndalo krejt" (me pyetje), "Shëno krejt si të kontrolluar".
     Llogari e re = pa dokument lejesh dhe e pa parë në këtë pajisje (`stoku:perdoruesit:pare`; herën e parë llogaritë
     e vjetra pa `krijuarSe` s'njoftohen): njoftim "Llogari e re: X" (PC me "Shiko") + shenja te tabi Cilësimet (tel).
     `perdoruesit/{uid}.krijuarSe` shkruhet në regjistrim (tel + PC); `degjoKrejtLlogarite` e kthen. Fshirja e llogarisë
     nga administratori fshin edhe `lejet/{uid}` (ekipa.js).
   - **Rregullat e Firestore v230** (te "Rregullat e Firestore" më poshtë, `match /lejet/{uid}`): lexon llogaria vetë ose
     administratori; shkruan/fshin VETËM administratori, me fushat e lejuara dhe `lejet` map ≤ 60. PA PUBLIKIMIN E TYRE
     lejet s'lexohen e s'ruhen (faqja e administratorit e thotë; krejt llogaritë mbeten me krejt lejet).
   - Kufizim i ditur: lejet i zbaton aplikacioni (fsheh dhe bllokon veprimet); rregullat e dyqanit (`dyqane/{uid}`) s'i
     njohin, sepse stoku dhe afatet janë në të njëjtat dokumente. Mjafton për punëtorët, jo për dikë që e ndryshon kodin.
   - Testet: `emu/lejet-prova.mjs` (emulatori i vërtetë, rregullat v230 + `lejet.js`), `lejet-e2e-v230.js` (telefoni:
     llogari e kufizuar, llogari e re, administratori, kohë reale, rregullat para v230), `lejet-pc-e2e-v230.js` (PC).
     Pa testim në pajisje të vërtetë.
0000000. **EXCEL DHE PDF: "DËRGO NË PC" PËR TË GJITHË (v229 = 1.27.0)**: pas kthimit të v227 (v228), pronari e sqaroi: jo vetëm
   për PDA dhe jo me çelës te Cilësimet, por për krejt, me zgjedhje sa herë klikohen "Eksporto në Excel"/"Eksporto në PDF";
   në PC skedari del me "Shkarko". Fullscreen-i i PDA-së MBETET si në v226 (heqja e tij s'u kërkua sërish).
   - **Telefoni** (`index.html`): `ndajOseShkarko(f, titulli)` hap dritaren `#dlgKuSkedari` ("Excel-i/PDF-ja është gati":
     emri + madhësia, "Dërgo në PC" `#ksPc`, "Shkarko këtu" `#ksKetu`, "Anulo"), si `#dlgKuFleta`. Vlen për të katër
     eksportet (Excel i folderit, PDF me etiketa, Excel i afateve, Excel i stokut të kolegut). "Shkarko këtu" =
     `ndajOseShkarkoKetu` (ndarja/shkarkimi si më parë). "Dërgo në PC" = `skedaret.dergo`: gjendjet "Duke e dërguar…",
     "U dërgua në PC" (mbyllet vetë pas 2,5 s), gabim (internet / rregullat / mbi 15 MB) me "Provo sërish në PC" dhe
     "Shkarko këtu". Pa llogari (vizitor): "Dërgo në PC" i çaktivizuar, me shpjegim. Premtimi mbaron kur mbyllet dritarja.
   - **PC** (`pc.html`, si në v227): kartat `#skedaretTel` te Përmbledhja (Shkarko/Fshi, "U shkarkua"), numri
     `#stokTabSkedaret` te pllaka Stoku, njoftim me "Shkarko" kur mbërrin; të skaduarit (7 ditë) i fshin PC-ja.
   - **`skedaret.js`** (i njëjti si në v227): `dyqane/{uid}/skedaret/{id}` + copat `…/pjeset/000…` (Bytes ≤ 900 KB,
     maksimumi 15 MB); copat të parat, dokumenti i fundit; dështimi i pastron copat; afat 45 s për shkrim.
   - **Rregullat e Firestore v229** (të njëjtat me v227, te "Rregullat e Firestore" më poshtë): PA PUBLIKIMIN E TYRE
     "Dërgo në PC" s'punon (dritarja thotë "rregullat duhet të përditësohen").
   - Testet: `skedaret-njesi.js` (25), `emu/skedaret-prova.mjs` (38, emulatori), `skedaret-e2e-v229.js` (tel → PC me
     Firestore të simuluar), `tre-test.js` (eksporti i afateve kalon nga "Shkarko këtu"). Pa testim në pajisje të vërtetë.
0000000. **KTHIMI I PLOTË I v227 (CACHE `stoku-v228`, pa hyrje te "Çka ka të re")**: me kërkesë të pronarit ("ktheje te mas
   komplet qeto se s'e ke bo mirë") v227 (PR #173) u kthye krejt me `git revert`: PDA-ja kalon sërish në fullscreen për ta
   kyçur portretin (si deri në v226), dhe "Excel dhe PDF në PC" (`skedaret.js`, çelësi te Cilësimet, kartat në PC,
   rregullat `match /skedaret`) s'ekziston më. Kodi është identik me v226 (1da8106); ndryshon vetëm CACHE (v228), që pajisjet
   me v227 të kthehen vetë. Pa hyrje te teRejat: versioni që shihet mbetet 1.25.2 dhe hyrjet e 1.26.0 u hoqën bashkë me
   kodin. Përjashtim i vetëm nga rregulli "CACHE = v i hyrjes së fundit": versioni i ardhshëm është **v229**. Pronari s'tha
   çka saktësisht s'ishte mirë: MOS i rikthe këto dy ndryshime pa kërkesë të re dhe të qartë.
0000000. **SHIRITI POSHTË I ERRËT (v226 = 1.25.2, Stoku i instaluar nga Chrome)**: v225 (pa `theme_color`) s'mjaftoi.
   Më 15 tetor, pasi Chrome e përditësoi WebAPK-në, vija e lëvizjes poshtë u bë e bardhë (Chrome s'i jep më ngjyrë
   shiritit), por shiriti mbeti #f6f5f2. Shkaku: Chrome i ri e lë shiritin të tejdukshëm dhe poshtë tij duket dritarja e
   aplikacionit, që merr `background_color` të manifestit (po ajo ngjyrë edhe për ekranin e nisjes). Faqja s'mund të
   vizatojë poshtë shiritit në aplikacionin e instaluar (`viewport-fit=cover` s'vlen aty), dhe manifesti s'ka variant të
   errët që Chrome ta lexojë. Zgjidhja: `theme_color` dhe `background_color` = `#0f1115` (`manifest.webmanifest?v=87`):
   shiriti poshtë del i errët me vijë të bardhë në çdo temë. Kostoja e pranuar: në temën e çelët shiriti poshtë dhe
   ekrani i nisjes janë të errët. Shiriti sipër ndjek ende `metaTema` (i çelët / i errët). Aplikacioni Android (tel/)
   s'preket. Chrome e merr manifestin e ri kur e përditëson WebAPK-në (zakonisht brenda një dite); te `chrome://webapks`
   shihen ngjyrat që i ka ruajtur. MOS i kthe ngjyrat e manifestit në të çelëta. Pa testim në pajisje të vërtetë.
0000000. **SHIRITI POSHTË NË TEMËN E ERRËT (v225 = 1.25.1, vetëm Stoku i instaluar nga Chrome)**: në telefonin me temë të
   errët, Stoku i instaluar nga Chrome (jo aplikacioni Android) kishte poshtë një shirit të bardhë (#f6f5f2) te vija e
   lëvizjes, ndërsa sipër ishte i errët. Shkaku: versionet e reja të Chrome-it e ngjyrosin shiritin e navigimit të
   aplikacionit të instaluar me `theme_color` të manifestit (një vlerë e vetme, pa variant të errët); më 6 tetor ishte ende
   i zi. U hoq `theme_color` nga `manifest.webmanifest` (?v=86): pa të, Chrome e lë shiritin sipas temës së telefonit.
   Shiriti sipër s'preket: e ndjek `<meta name="theme-color" id="metaTema">` (rifreskoMetaTemen), si më parë. Aplikacioni
   Android (tel/) s'preket: aty të dy shiritat i ngjyros `StokuAndroid.ngjyrat()`. Chrome e merr manifestin e ri kur e
   përditëson WebAPK-në (zakonisht brenda një dite ose dy, pa e riinstaluar). Nuk mjaftoi: shih v226 më sipër.
0000000. **PDA: "FSHIH TASTIERËN" (v224 = 1.25.0, vetëm telefoni)**: kërkesë e pronarit (PDA Zebra me tastierë fizike):
   kur është ndezur PDA, te folderi del `#btnTastiera` ("Fshih tastierën" / "Shfaq tastierën", në rreshtin e kamerës që
   fshihet në PDA) dhe te Cilësimet → Skanimi `#opsTastiera` (`#seksionTastiera`, vetëm në PDA). `opsione.tastieraFshehur`
   ruhet te `stoku:opsione:v1`; vlen vetëm me `opsione.pda` (`tastieraEFshehur()`), prandaj fikja e PDA-së e rikthen
   tastierën. `zbatoTastieren()` (thirret nga `zbatoPda`): krejt fushat e shkrimit (input text/search/tel/number/email/
   url/password, textarea) marrin `inputmode="none"` + `virtualkeyboardpolicy="manual"` (inputmode-i i vjetër ruhet te
   `data-im-orig` dhe rikthehet); `focusin`/`pointerdown` (capture) e bëjnë njësoj për fushat e reja (dritaret, porta) dhe
   `navigator.virtualKeyboard.hide()`; në prekje fusha është `readonly` për 120 ms (disa Zebra e injorojnë inputmode-in).
   Ka pasur diçka të ngjashme deri më 24 shtator (butoni ⌨️ te barkodi), që u hoq me një ngarkim të ri të skedarit. Nëse
   prapë del tastiera te ndonjë model: Settings → System → Languages & input → Physical keyboard → "Use on-screen
   keyboard" OFF (vlen për krejt pajisjen). Testi: `pda-tastiera-test.js` (scratchpad).
0000000. **FAQJA 404 (pa version të aplikacionit: s'preket asnjë skedar i tij)**: `404.html` në rrënjë; GitHub Pages e shfaq
   (me statusin 404) për çdo adresë që s'ekziston, p.sh. `visitor.html` ose `beta/` të fshira, në vend të faqes angleze
   të GitHub-it. Logo dhe ngjyrat e Stoku-t, tema si te aplikacioni (`stoku:tema`, përndryshe e sistemit), "Kjo faqe s'u
   gjet" + butoni "Hap Stoku-n" (`/`, që e zgjedh vetë telefonin ose kompjuterin) dhe ridrejtim vetë pas 6 s. Çregjistron
   service worker-at jashtë rrënjës (scope ≠ "/"): e merr përsipër pastrimin që e bënte `beta/` (Stoku ka vetëm SW-në te
   "/"). Krejt adresat absolute (faqja shfaqet në çdo dosje). Testi: `faqja404-test.js` (scratchpad, server si GitHub
   Pages), 15 kontrolle.
0000000. **PASTRIMI I SKEDARËVE (v223, pa hyrje te "Çka ka të re": s'shihet nga përdoruesit)**: me kërkesë të pronarit u
   fshinë skedarët që s'i përdorte askush: `visitor.html` (faqja e provës së vizitorit, 12 tetor, ishte vetëm ridrejtim),
   `beta/index.html` + `beta/sw.js` (pastruesi i Stoku Beta, që ishte gjallë vetëm 30 shtator deri 1 tetor), `logo.png`
   (kopje e saktë e `logo/stoku-logo.png`) dhe `logo/stoku-icon.svg`: dy të fundit s'dilnin askund, vetëm shkarkoheshin
   kot nga `sw.js`. `sw.js`: `CACHE = 'stoku-v223'`, pa këto dy te SHELL (përndryshe instalimi i ri dështonte), pa
   përjashtimin e `/beta/` te `fetch`. Mbeten qëllimisht: `tel|ora/*.jks` + `celesi-i-ri.p12.enc` + `celesi.lineage`
   (nënshkrimi i APK-ve), `android.json` (Firebase për Android-in), `fonts/OFL-*.txt` (licenca), `CNAME`, variantet e
   logos te `logo/` (arkiv; pronari zgjodhi t'i mbajë) dhe gjeneruesi i çelësave `apk-celesat.yml` + `celesat.sh`.
0000000. **HISTORIKU PA CHAT (v222 = 1.24.2)**: me kërkesë të pronarit ("po hiqi edhe ato te historiku"), te `teRejat.js` u
   hoqën përmendjet e chat-it nga 13 shënime të vjetra (v109 deri v188): pikat dhe titujt u shkurtuan (p.sh. v182 "Ekipa:
   Përmbledhja e re", v130 tel "Njoftimet edhe në orë", v109 "Ekipa: afatet, aktiviteti dhe më shumë", v110 "Unë e hoqa"
   s'humbet pa internet); dy shënimet që ishin vetëm për chat-in (v111 "chat-i lart djathtas" dhe v130 PC) u hoqën krejt.
   Ndryshuan vetëm `teRejat.js?v=222` dhe `CACHE` (pa kod tjetër). SHENIME (historiku teknik) mbetet siç është.
0000000. **CHAT-I U HOQ KREJT (v221 = 1.24.1, Worker 164, rregullat pa chat)**: chat-i ishte fshehur nga UI në v182; tani
   s'ka më asnjë gjurmë në kod. Web (tel + PC): pa `#ekChatBtn`/`#ekChatFund`/`#navEkChat`/`#ekVChat`/`#ekAdminPastroChat`,
   pa CSS-në e mesazheve (`.ek-mesazh`, `.ek-dita`, `.ek-chat-*`, edhe te `css/stoku.css` v39 dhe `css/stoku-pc.css` v30);
   pamja 'chat' s'ekziston më (PC: `EK_NENET` pa të; adresat e vjetra `#/ekipa/chat` dhe `#ekipa-chat` → Pulti/Grupi).
   Teksti i vizitorit te Grupi: "afatet e përbashkëta dhe aktiviteti" (tel), "ndani afatet dhe aktivitetin" (PC). PC: butoni
   i administratorit "Pastro krejt aktivitetin" me dëgjues të vetin. `ekipa.js`: pa `dergoMesazh`/`degjoChatin`/
   `fshijMesazhin`/`hapChatin`/`mbyllChatin`/`kaChatTePalexuar`/`shenoChatinTeLexuar`/`pastroChatin`/`njoftoPushChat`, pa
   `KEY_CHAT_LEXUAR`, `gj.chat*`, `mesazhiFundit`; radha pa `kohaEDergimit` (`shtoNeRadhe(rruga, te, opt)`, `dergoOp(op)`);
   migrimi s'kopjon `ekipa_chat`; fshirja e grupit pastron vetëm `feed`/`afatet`/`push`; `pastroKoleksionin` vetëm 'feed';
   `VERSIONI_WORKER: 164`. `sw.js`: çdo push del si njoftim (u hoq përjashtimi "Stoku përpara" që vlente vetëm për chat-in).
   **Worker 164**: pa `/chat` (404 `rruga`); adresa e njoftimit gjithmonë `#ekipa-njoftimet` / `#/ekipa/njoftimet`.
   **Android (tel/)**: `FcmSherbimi` s'e shikon më llojin, u hoq `MainActivity.nePerpara` (del APK e re e telefonit; ora
   s'preket). **Rregullat** (seksioni më poshtë): pa `ekipa_chat` dhe `grupet/{g}/chat`, i vendos përdoruesi; mesazhet e
   vjetra, nëse ka, fshihen vetëm nga Console. Historiku (teRejat, SHENIME) mbetet siç ishte. Provat: push-test.js,
   grupet-test.js, orari-test.js (5a3), wp/prova.mjs, wp/grupi-prova.mjs, wp/fcm-prova.mjs, wp/v216-prova.mjs (tubacioni i
   njoftimeve tani provohet me `/kerkese`), wp/fjalekalimi-prova.mjs (versioni 163+).
   **Fjalëkalimi (kërkesë e pronarit):** njoftimi i kodit (push + zilja, Worker 164) mbaron te "(vlen 30 minuta)." pa
   fjalinë "Jepja vetëm pasi ta njohësh personin."; edhe "Çka ka të re" v220 pa "pasi të të njohë" (porta.js v221: vetëm
   komenti). Njoftimet e vjetra te zilja e ruajnë tekstin e vjetër derisa të fshihen.
0000000. **FJALËKALIMI I HARRUAR (v220 = 1.24.0, Worker 163)**: llogaritë janë `emri@stoku-app.local` (pa email të vërtetë),
   prandaj Firebase s'dërgon dot link rikthimi. **Porta** (`porta.js`): "Ke harruar fjalëkalimin?" (vetëm te "Hyr") hap
   `#pkRiv` me tre hapa: emri → `POST /fjalekalimi/kerko`; kodi 6-shifror → `/verifiko`; fjalëkalimi i ri dy herë →
   `/ndrysho`, pastaj `cloud.hyr` me fjalëkalimin e ri (+ `ruajKredencialet`), pjesa tjetër si te hyrja e zakonshme. Me
   `gjendja.rivendosje`, `kontrollo` (pa përdorues) dhe `shfaqFormen` s'e mbulojnë; `mbyll()` e mbyll. Worker-i i vjetër
   (401 `pa-hyrje` / 404 `rruga`) → "s'është aktivizuar ende te serveri". **Worker 163** (`trajtoFjalekalimin`, para
   kontrollit të tokenit): `tokeniAdmin` = llogaria e shërbimit `FCM_SA` me scope `cloud-platform` (Identity Toolkit
   `accounts:lookup`/`accounts:update` + Firestore pa rregullat e aplikacionit). `kerko`: llogaria ekziston (jo e
   çaktivizuar, jo `ekipa_fshire`); një kërkesë aktive për llogari (`rivendosjet/{emri}`: `uid`, `hash` = SHA-256(uid:kodi),
   `skadon` 30 min, `provat`); kodi i ri vetëm pasi të skadojë i vjetri (edhe pas 5 provave); njoftimi
   `perdoruesit/{admin}/njoftimet/fj…` (`lloji: 'fjalekalimi'`, me kodin) + push te pajisjet e administratorit
   (`grupet/{grupi}/push`, FCM + Web Push). `verifiko`/`ndrysho`: 5 prova, `skadoi` 410, `shume-prova` 429; `ndrysho`
   (6 deri 100 shenja, `WEAK_PASSWORD` → `i-dobet`) fshin kodin dhe i lë administratorit shënimin "e vendosi fjalëkalimin
   e ri" (pa push). Koleksioni `rivendosjet` s'ka rregull: aplikacioni s'e lexon (rregullat s'ndryshojnë). `ekipa.js`:
   titulli "Stoku · Fjalëkalimi", `VERSIONI_WORKER: 163`. Provat: `wp/fjalekalimi-prova.mjs` (Worker, 35),
   `rivendos-test.js` (porta tel + PC, 24). Nëse e harron vetë administratori, kodi i vjen te pajisjet e tij ku është ende i kyçur.
0000000. **VULA E RE E APK-VE (telefoni + ora, pa version të web-it)**: çelësat e vjetër (`tel/stoku-tel.jks`,
   `ora/stoku-ora.jks`, fjalëkalimet te `build.gradle.kts`) janë publikë, prandaj u shtua ndërrimi me APK Signature Scheme v3.
   **Një herë**: workflow-i "Çelësat e rinj të APK-ve (një herë)" (`apk-celesat.yml`, vetëm me dorë) thërret
   `.github/apk/celesat.sh`: krijon vulën e re (RSA 4096, PKCS12) brenda GitHub Actions, zinxhirin `apksigner rotate` vjetër → i
   ri me `--set-rollback false`, e enkripton (`openssl enc -aes-256-cbc -pbkdf2 -iter 600000`) me sekretin `APK_FJALEKALIMI`
   (≥ 24 shenja, e di vetëm pronari; s'duhet humbur as ndërruar), shkruan në main `<app>/celesi-i-ri.p12.enc` +
   `<app>/celesi.lineage` dhe nis `tel-apk.yml` + `ora-apk.yml`; s'krijon dy herë. **Çdo build**: `.github/apk/nenshkruaj.sh`
   (pas Gradle-it): pa vulë të re APK-ja mbetet si më parë; me të: `apksigner sign` vjetër + `--next-signer` i ri + `--lineage`
   + `--rotation-min-sdk-version 28` = v2 me çelësin e vjetër (Android 8), v3 me vulën e re (Android 9+), dhe kontroll që
   Android 9+ sheh vulën e re. **Provuar** në GitHub Actions me vula të rreme (workflow i përkohshëm, i hequr): Android i emuluar
   API 30: përditësimi me vulën e re pranohet, APK me vetëm çelësin e vjetër refuzohet (`INSTALL_FAILED_UPDATE_INCOMPATIBLE`);
   API 27: përditësimi pranohet, çelësi i vjetër mbetet i pranuar (Android 8 s'e njeh zinxhirin: kufizim i ditur, tel minSdk 26).
   `adb install --incremental` (v4, vetëm për zhvillim) dështon herën e parë dhe `adb` kalon vetë te instalimi i zakonshëm.
   Gjurmët e vulës së re (SHA-1/SHA-256) i shtyp log-u i workflow-it; duhen vetëm nëse çelësi i API-së në Google Cloud
   kufizohet me SHA-1. Udhëzimi: `tel/README.md` → Nënshkrimi.
0000000. **WORKER 162 NË CLOUDFLARE (v219 = 1.23.2)**: pronari e ngjiti Worker-in 162 (adresa e Worker-it tregon
   `"versioni":162`), prandaj aplikacioni tash e pret 162 (`ekipa.js` `VERSIONI_WORKER: 162`): te Cilësimet → Njoftimet, statusi i
   njoftimit ditor paralajmëron "Serveri (Cloudflare) ka kodin e vjetër" kur serveri është më i vjetër se 162 (për 161 pa arsye
   shtesë në tekst). Veçoritë e 162 (Cron me deri në 3 prova, `/ora/hiq` me `ids`, `ora-ka` si listë, `/orari` heq oraret e
   llogarive të tjera të së njëjtës pajisje) tash punojnë. `orari-test.js`: serveri "i ri" në provë = 162, plus 161 → paralajmërim.
0000000. **PORTA: TEKSTET NËN "HYR" DHE "HYR SI VIZITOR" (v218 = 1.23.1)**: me kërkesën e pronarit, `#pkShenim` (tabi "Hyr")
   = "Rekomandohet hapja e një llogarie, që të dhënat të ruhen në cloud." (tabi "Krijo llogari" i mban rregullat e emrit dhe
   fjalëkalimit); `#pkVizitorShenim` = "Hyr si vizitor për të parë si funksionojnë shërbimet e Stoku-t (kujdes: të dhënat nuk
   ruhen në cloud)." dhe, kur prova ekziston, "Prova jote si vizitor është ende në këtë pajisje (kujdes: të dhënat nuk ruhen në
   cloud)." `.pk-shenim` me `text-wrap: balance` (pa fjalë të vetme në rreshtin e fundit; shfletuesit e vjetër e injorojnë).
0000000. **HYR SI VIZITOR (v217 = 1.23.0, pa ndryshim në Worker ose Firebase)**: porta (`porta.js`) ka "Hyr si vizitor" në telefon
   dhe kompjuter (edhe në aplikacionin Android, sepse ai e hap web-in). **Gjendja**: `stoku:vizitor` = '1' dhe `stoku:pronari-uid` =
   'vizitor'; `eVizitor()` i kërkon të dyja. `ngaVizitori` caktohet një herë në ngarkimin e faqes dhe s'ndryshon deri në rifreskim:
   të dhënat e asaj faqeje janë shembull, prandaj sinkronizimi (`kryeSinkronizimin`, `sinkronizoNeHyrje`), Grupi (`ekNisOseNdal` →
   `ndalGjithmone`), pyetja për njoftimet dhe "Çka ka të re" s'nisen kurrë në të, edhe nëse dikush hyn me llogari në një skedë tjetër.
   **Hyrja me llogari bëhet vetëm te porta**: `StokuPorta.hapHyrjen()` heq `stoku:vizitor` dhe e hap portën; format e hyrjes brenda
   aplikacionit (tel: `#cloudHyrjeSeksion.si-vizitor` fsheh `.ll-forma` dhe tregon `.ll-vizitor`; tel `kryeRregjistrimHyrje`, PC
   `hyrOseKrijo`/`hapLlogarine`) e hapin portën. `kontrollo` me përdorues: kur pronari ≠ uid ose `ngaVizitori`, fshin
   `CELESAT_E_TE_DHENAVE` dhe bën `location.reload()` (me `stopImmediatePropagation`), kështu të dhënat shembull s'arrijnë kurrë në
   cloud. "Vazhdo provën si vizitor" e kthen provën pa e fshirë. **Të dhënat shembull** (`mbushProven`): 4 folderat e paracaktuar,
   12 produkte (barkode 2000100000014 deri 2000400000035, njëri me sasi 0, furnizuesit A, B, C, `prekurSe` të shpërndara në 5 ditët
   e fundit) dhe 7 afate (`prova1` deri `prova7`: skaduar, sot, +2, +6, +21, +150 ditë dhe një i hequr). Kur pajisja ka të dhënat e
   një llogarie (pronari = uid), porta pyet para se t'i heqë (në cloud mbeten); shfletuesi që s'ruan (Safari privat, memorie plot) →
   gabim, prova s'hapet. **Pamja**: tel: shiriti `#vizShirit` ("Vizitor · provë pa llogari…" + "Hyr"), "Vizitor · provë" nën logo,
   Cilësimet → Llogaria "Je si vizitor" ("Hyr ose krijo llogari", "Fillo nga e para"), Grupi "Grupi punon me llogari" + buton;
   PC: karta `#kartaVizitori` te Përmbledhja (në vend të mirëseardhjes), anësorja "Vizitor · provë" dhe "Provë pa llogari",
   Cilësimet → Llogaria "Je si vizitor" + "Fillo provën nga e para", Grupi me tekstin e vizitorit (edhe "poshtë majtas" në vend të
   "lart djathtas" për butonin e hyrjes). Testi: `vizitor-test.js` (tel, PC, paralajmërimi, Grupi, asnjë shkrim në cloud).
0000000. **KONTROLLI I PLOTË ME RISHIKIM TË KODIT (v216 = 1.22.2, Worker 162)**: rishikim skedar për skedar (web, Worker,
   tel/, ora/, CSS, workflows) dhe rregullimet. **Përbashkëta**: `pergatitFoton` me `Math.floor` (iOS refuzonte kanavacën 1 piksel
   mbi kufirin); `dataNgaQeliza`: zeroja që Excel-i e heq kthehet vetëm te x.1 → x.10 ("12.10" = 12 tetor, jo janar) dhe x.20y → x.20y0
   (muaji.viti); "12.5", "15.3", "5.2026" lexohen si më parë; kolona
   "Furnitori" njihet; `ditetParaTekst` ("para 5 ditësh", "para 1 dite"); `riemertoFurnizuesin` njëson hapësirat; kujtesa:
   `indeksiIFurnizuesve` një herë për veprim (bashkimi me grupin/`mesoShume` ishin O(rreshta × hyrje), sekonda në PDA);
   `fshijFurnizuesin` harron produktin pa emër; `afatetNgaPlani` me hartë (jo n²); `xlsx` emri i fletës pa apostrof në skaje pas
   shkurtimit, `DecompressionStream('deflate-raw')` i pambështetur → 'pa-dekompresim'. `njoftimet.js`: një lidhje IndexedDB,
   `tx.onabort` (memoria plot ngecte zinxhirin), `pastro()` pas daljes nga llogaria (index: `stoku-auth-ndryshoi`). `sw.js`:
   navigimi vetëm për /, /index.html, /pc, /pc.html (android.html zinte vendin e index.html në cache); instalimi paralel;
   `notificationclick` e njeh dritaren e PC-së edhe nga "#/". `ruajtja.js`: kryesori s'rishkruhet kur ndryshon vetëm `koha`
   (`kryesoriKanonik`); mënyra e vjetër (pa pjesë) vetëm kur kryesori lexohet e p0 jo (`rregullaTeVjetra`). **ekipa.js**:
   `fshijAnetaresine` (largimi/heqja nga grupi "ekipa" heq edhe `ekipa_anetaret` në një batch); nënshkrimi i publikimit përfshin
   grupin (+ ripublikim pas ndryshimit të grupit); "U krye"/vendimi për heqjen kalojnë nga radha (`shtoNeRadhe` me
   `{id, perditeso}` = `batch.update`, s'rikrijon njoftimin e fshirë), s'ngecin pa internet; `caktivizoPush`/`dil` me afat (8 s/5 s); dalja pa internet lë `stoku:orari:pastro` → `pastroOrarinEJetim`
   në hyrjen tjetër (Worker: `pastroPajisjen`, me `edheTimin` kur kjo llogari s'ka orar këtu); `provoGrupinEVjeter` një herë njëkohësisht; `ndryshoRolin`/`vendosLejen` me
   `update` (s'rikrijojnë anëtarin e hequr); `fshijLlogarine` fshin edhe ftesat e emrit; `shenoTeLexuara` toleron njoftimet e
   fshira. **Worker 162** (duhet ngjitur te Cloudflare): gabimet e papritura → JSON me CORS (`kv-limit`); freskia sipas
   `createTime` të Firestore-it (jo ora e pajisjes); më së shumti 36 pajisje për push (kufiri 50 kërkesa); Cron-i: dita shënohet
   vetëm pas suksesit/asgjë/404-410, deri në 3 prova; `/orari` (pas kontrollit të të dhënave) heq oraret e llogarive të tjera për të njëjtën pajisje dhe
   s'e rishkruan indeksin pa ndryshim; `/ora/hiq` pranon `ids`; `ora-ka:{uid}` = lista e orëve të lidhura (JSON), `/ora/shkeput`
   heq vetëm orën e vet (`ora-hequr` mbetet për telefonin; vlera e vjetër "1" mbetet); formatuesit e zonave kohore ruhen (vetëm
   të vlefshmit, ≤ 300). Aplikacioni pret ende 161 (s'del paralajmërim); veçoritë e reja punojnë pasi të ngjitet 162. **Telefoni**: seanca
   e kamerës (`seancaKamere`): mbyllja gjatë nisjes e ndal rrjedhën që vjen më vonë; `ruajBaze`/`ruajAfatet` sinkronizojnë edhe
   kur localStorage është plot; Kolegët: rindërtimi pritet gjatë shkrimit dhe tekstet rikthehen (`ekTeShkruarat`); sasia ≤ 6
   shifra (dialogu + +/-); numërimi +/- s'ndodh kur kamera është për afatin; "Mbrapa" mbyll dialogun e sipërm (`__rendiDialogeve`);
   `oraEZgjedhur` me try; produkti në folder të fshirë → mesazh, jo "null::"; afati i fshirë ndërkohë → ruhet si i ri; skanimi
   me dritare të hapur e zbraz fushën; leximi me AI me numër seance; dëgjuesi i cloud-it rinis pas gabimit (15 s → 5 min);
   ndërrimi i ditës rivizaton afatet/kryefaqen/Grupin; `stoku-leja-ndryshoi` → `renderLista`; "Rikthe nga cloud" dallon gabimin nga
   cloud-i bosh; Z-A me produktet pa emër në fund; flluska e rolit mbyllet me prekjen e dytë; shënimet e fshirjeve me shumicë
   ruhen një herë; kryefaqja s'vizatohet brenda folderit; fshirja e llogarisë nga administratori çaktivizon njoftimin ditor.
   **Kompjuteri**: leximi me AI me numër seance (s'mbishkruan fletën e telefonit); "Zhbëj" prek vetëm folderat e vetë veprimit;
   Enter te filtri zbaton filtrin e pritur; sasia ≤ 6 shifra; kutiza e rreshtit (pa `preventDefault`); Ctrl+E/I te Afatet =
   eksporti/importi i afateve, te Grupi asgjë; ankora e Shift-it me çelës; `hashIDekoduar`/`pamjaNgaHash` (një "%" s'e ndal
   faqen, "chat"/"stoku" → Pulti, adresa korrigjohet); shkurtoret me një shkronjë pas 45 ms (`veproPasPak`); importi njëson
   emrat e folderave pa dallim shkronjash; kërkimi global rihapet vetëm me fokus; `normalizo` te Grupi/Cilësimet; pas
   sinkronizimit s'rishkruhet krejt dyqani; dëgjuesi rinis pas gabimit; çdo minutë vetëm qelizat e kohës te tabela.
   **Android (tel/)**: `restoreState` null → `loadUrl`; historia pastrohet pas ngarkimeve të aplikacionit (njoftimi, "Provo
   sërish" me `#stoku-riprovo`); `onRenderProcessGone` → WebView e re (`recreate`); WebView `destroy` në `onDestroy`;
   përditësimi: pas dështimit riprovohet pas 30 min (jo 6 orë, as në çdo rikthim), `isDestroyed`, APK-ja në pritje te prefs
   bashkë me numrin e versionit (e vjetëruara fshihet), "Po kontrollohet…" kur një kontroll është në rrugë. **Ora**: `Api.hiq` hedh gabim kur serveri s'e
   ruajti; `hiqShume` (një kërkesë, rezervë 1.1 s njëra pas tjetrës me Worker-in e vjetër); "Zhbëj" pret heqjen (`join`);
   `CancellationException` s'kapet si gabim; `javaN` zbret; "Mbrapa" nga kolegët kthehet te produkti; çelësat e listës unikë;
   tile/komplikacioni me afate të shkurtra dhe kopje të freskët (< 3 min);
   lista e ndryshuar në orë ruhet si kopje (`ruajListen`); `allowBackup=false`; etiketa e komplikacionit.
   **CSS**: rregulli ≤ 360px pas bazës; ikonat e folderave pa `opacity .85` në temën e errët; "Fshi" i shiritit të zgjedhjes
   lexohet në temën e errët (PC). **Workflows**: `!tel/**/*.md`, `!ora/**/*.md`; ndërtimi me `contents: read`, Release-i në punë
   më vete (vetëm main). **Mbetur (s'u ndryshuan, kërkojnë vendim)**: çelësat e nënshkrimit të APK-ve janë në repo publik
   (`tel/stoku-tel.jks`, `ora/stoku-ora.jks` + fjalëkalimet te build.gradle.kts): duhen kaluar te GitHub Secrets dhe ndërruar
   (instalim i ri një herë); action-at e GitHub me SHA; `fshira` brenda kryesorit (kufiri 1 MB pas shumë fshirjeve);
   rritja e `n` rishpërndan pjesët; transaksioni lexon krejt pjesët; indeksi i KV-së (`orari-indeksi`) me shkrime njëkohësisht;
   rrëshqitja djathtas te ora mbyll aplikacionin nga ekranet e brendshme (do `SwipeToDismissBox`, kërkon provë në orë).
   Testet: v216-njesi.js (22), v216-test.js (19), wp/v216-prova.mjs (21). U kontrollua edhe vetë ndryshimi me rishikim kodi.
0000000. **RREGULLI I FTESËS (rregullat v216, pa ndryshim në aplikacion)**: te `grupet/{g}/anetaret/{u}` (create, roli
   'anetar' me ftesë) u shtua `&& !existsAfter(/databases/$(database)/documents/ftesat/$(g + '_' + emriIm()))`: ftesa duhet të
   fshihet në të njëjtin batch me hyrjen, që një ftesë e vjetër të mos përdoret dy herë (p.sh. pasi pronari e heq kolegun) nga
   një klient i modifikuar. Aplikacioni e bën këtë që nga v164 (`pranoFtesen`: `b.set(anetaret) + b.delete(ftesat)`), pra
   krejt versionet punojnë njësoj; migrimi i grupit "ekipa" (dega `g == 'ekipa'`) s'preket. Mock-u `fs-server.js` e ndjek me
   `!pas('ftesat/…')`. Testi: ftesa-test.js (6; pa rregullin dështojnë 3). **Vendosja: rregullat e reja te Firebase.**
0000000. **KONTROLLI I PLOTË: DREJTSHKRIMI + BUGS (v215 = 1.22.1)**: (1) Drejtshkrimi/gramatika në krejt tekstet (web, tel/,
   ora/): "Fshi" (jo "Fshij") te butonat, "furnizues" (jo "furnitor"), njëjës/shumës me `nrEmer(n, nje, shume)` (index.html pas
   FJALORI-t; pc.html pas `produkteTekst`, me `num`), Kotlin-i i orës ("1 e skaduar", "1 koleg", "1 ka skaduar"), tekste të
   vjetra të chat-it u hoqën nga Njoftimet. (2) Bugs: telefoni `ruajAfatin` krahasonte furnizuesin me `afatNeDialog.furnizuesi`
   (`afatNeDialog` është id-ja) → çdo ruajtje e një afati të vjetër e kthente në pritje një furnizues të fshirë; tash merret nga
   vetë afati (si te PC `afPara`). `kujtesa.mesoShume` (mbishkruaj): rreshti pa barkod me furnizues → `regjistroIRi` (importet e
   afateve pa barkod); `plotëso` jo. `shkruaj()` i kujtesës: kur kalon 20 000, s'hiqen kurrë çelësat "furnizuesi …" (kanë kohën 1,
   ishin të parët që hiqeshin). Datat e shpejta "1/3 muaj" (telefoni `dataEShpejte`): 31.01 → 28.02 (jo 03.03). Sinkronizimi (tel
   `kryeSinkronizimin`, PC `sink.duke`): try/catch rreth `bashkoDheRuaj`, që një gabim i papritur s'e ngec "Duke sinkronizuar…".
   `konfirmo()` (tel + PC): pyetja e mëparshme e pa përgjigjur merr `false`. Telefoni: pas ri-identifikimit toast-i sipas veprimit
   (emri / fjalëkalimi); "Njoftimi ditor" pa `Notification` (Safari jo i instaluar) jep mesazh, jo ReferenceError. PC: shkronjat e
   një skanimi USB (≥ 2 shenja brenda 60 ms) s'janë shkurtore ("N" hapte "Produkt i ri" në mes të barkodit); "Rikthe nga cloud"
   kalon nga `pastroFolderat/Produktet/Afatet`; zvarritja e folderit kontrollon që të dy ekzistojnë. Ora (Wear OS): `Rikthimi.perpara`
   (onResume/onPause): ekrani i lidhjes s'pyet serverin dhe s'krijon kode të reja kur ekrani është fikur (më parë: kod i ri çdo 15 s
   + kërkesë çdo 3 s pa fund, harxhonte baterinë dhe kufirin ditor të shkrimeve të KV-së). Testet: v215-njesi.js, v215-test.js (A-E).
   Pa ndryshime në Firebase/Worker (rregulli i ftesës u shtua pas, te "rregullat v216").
0000000. **FURNIZUESIT E RINJ RUHEN MË VETE + KONTROLLI EDHE PËR ADMINISTRATORIN (v214 = 1.22.0)**: problemi: furnizuesi i
   ri i një kolegu dilte te "Furnizuesit e rinj" vetëm nga produktet e tij në pritje; kur administratori i fshinte ato, zhdukej.
   Tash (afatet.js, kujtesa): `regjistroIRi` (nga `mesoNje`, `vendos`, `regjistroFurnizuesinERi`) i jep çdo furnizuesi të ri
   (të panjohur pa dallim shkronjash) hyrjen e vet "furnizuesi X" NË PRITJE: i kolegut `{e, k, n}`, i administratorit
   `{e, k, s:1, r:1, n}`. `eshteNePritje(x)` = `!x && (s ? r : n)`; fusha e re `r` ("rishiko") ruhet në `hyrjaEPastruar` dhe
   shkon te grupi (`hyrjePerGrup` me `r: 0/1`). Produkti i ri (ose me emër/furnizues të ndryshuar) i administratorit merr `r`
   (pret kontrollin); një i njohur me të njëjtin emër (p.sh. vetëm sasia te stoku) s'kalon në pritje. "Ruaj" te Cilësimet
   (`vendos`, `regjistroFurnizuesit(.., true)`, riemërtimi) e heq `r`. Sfondi (`regjistroFurnizuesit` pa detyro, koha 1) ruan si të
   kontrolluar vetëm emrat pa asnjë hyrje (të vjetrit). Migrimi: `siguroFurnizuesitNePritje` (në `bashko`) krijon hyrjen në pritje
   për produktet në pritje pa të (përveç kur furnizuesi u fshi pas produktit). Sinkronizimi: për çelësat e furnizuesve, "i fshirë"
   kundër "në pritje" fiton më i riu (`hyrjaFiton(r, l, b)`), që një i fshirë del sërish në pritje kur dikush e shkruan sërish.
   `listaEFurnizuesve`: hyrja më vete vendos gjendjen (e kontrolluar / në pritje). Lista publike (`publikoFurnizuesit`) pa ata në
   pritje. Aktiviteti (ekipa.js `tekstiNgjarjes`): "Ti e fshive/e hoqe/e ktheve" (`FJALA_E_VEPRIMIT_TI`), "e hoqe ti",
   "e kishe hequr ti", "me kërkesën tënde". Testet: furn-pritje-test.js (i ri); u përditësuan kujtesa-njesi, kujtesa-test,
   furn-ruaj-test, stok-furn-test (sjellja e re: të rejat e administratorit presin kontrollin).
0000000. **PC: ANËSORJA ME TRI PLLAKA (v213 = 1.21.0)**: akordioni (Stoku/Afatet/Grupi me shigjeta) u zëvendësua me
   `.sbp-pllakat`: tri butona `role="tab"` me id-të e vjetra `btnAkordStoku/Afatet/Ekipi` (ikonë, emër, `#pllStokuNen` = numri i
   produkteve, `#pllAfatetNen` = "N skaduar" (kuqe) / "N afër" (verdhë) / numri i afateve, `#pllEkipiNen` = teksti i
   `#ekNavOnline` ose "Pa grup"; shenjat `#stokTabFleta`, `#afPllFleta` (kopje e `#afTabFleta`), `#ekAkordShenja` në qoshe, pa ikonë).
   Poshtë: `.sbp-moduli` (`#akordStokuTrupi`, `#akordAfatetTrupi`, `#akordEkipiTrupi`), vetëm ai i pamjes aktuale pa `hidden`
   (`vendosPllakat()` nga `renderAnesoren`; `rifreskoPllakat()` edhe nga `renderAfatetAnesore` dhe `ekShenjat`). Klikimi: te pllaka
   tjetër të çon te faqja e fundit e saj (Stoku: `faqjaEFunditEStokut`, folder/të gjitha/përmbledhja; Afatet: filtri i fundit;
   Grupi: nënfaqja e fundit); te pllaka aktive: te faqja kryesore (Përmbledhja / "Afatet e produkteve" / Përmbledhja e grupit).
   Rreshtat e menysë kanë sërish ikona (`.sbp-moduli .nav-rresht > svg`), "FOLDERAT" si titull i vogël. CSS-ja e akordionit u
   hoq (pc.html + stoku-pc.css). Telefoni s'ndryshon. Testi: pllakat-test.js (zëvendëson anesorja-v117.js dhe akord-mbyll.js).
0000000. **FURNITORI TE PRODUKTET E STOKUT + RENDITJA E RE (v212 = 1.20.0)**: produkti i stokut ka fushën opsionale
   `furnizuesi` (mungon kur s'ka; s'ruhet asnjëherë si varg bosh). Dialogu i produktit: PC `#prFurnizuesi` (datalist
   `afdFurnizuesit`), telefoni `#dlgFurnizuesi` (datalist `afFurnizuesit`, fshihet me `paEmer`); produkt i ri: nga kujtesa/afatet,
   përndryshe bosh; fusha e zbrazur te një produkt ekzistues e heq. Ruhet edhe kur zhvendoset në folder tjetër (tel + PC). Importi
   Excel/CSV në PC: `#imKolFurnizuesi` (hamendësohet nga titulli); me "shto"/"kalo" mbetet ai i produktit, me "zëvendëso" fiton i
   skedarit. Eksportet Excel (PC `fletaFolderi`/`fletaMeFolder`, telefoni `StokuXlsx.build`, `fletetEStokut` e ekipës): kolona
   "Furnizuesi" pas "Sasia"; PDF-raporti e shton kolonën vetëm kur të paktën një produkt ka furnitor. Lista (tel) dhe tabela (PC,
   `.k-furn`) e tregojnë; kërkimi e gjen. Renditja te Cilësimet → Stoku: `AF.renditSipasRuajtjes` (afatet.js), të ruajturat nga
   administratori në krye sipas kohës (furnizuesit: `koha` e regjistrit, 1 = në sfond = e panjohur; produktet: hyrjet `s` jo
   automatike), të tjerat pas tyre sipas alfabetit. `regjistroFurnizuesinEAdminit`: furnitori i ri te një afat pa barkod
   regjistrohet me kohën e tanishme (vetëm kur ndryshon te afati). Testi: stok-furn-test.js.
0000000. **FURNIZUESIT SI SUGJERIM PËR KREJT + FSHIRJA E NJOFTIMEVE (v211 = 1.19.4)**: `furnizuesitPerSugjerim()` (tel + PC)
   bashkon pa dublikata (pa dallim shkronjash) afatet e veta, furnizuesit e miratuar të kujtesës (grupi) dhe listën publike të
   administratorit `publike/furnizuesit` (cache `stoku:furnizuesit:publike`, lexohet në hyrje dhe më së shumti çdo 30 min). Kjo
   mbush datalist-at e "Furnitori"; shfletuesi i filtron sipas shkronjave. Administratori e publikon listën (`publikoFurnizuesit`,
   3 s pas `ruajFurnizuesitEMiratuar`, vetëm kur ndryshon). KËRKON RREGULLAT E REJA (blloku `match /publike/furnizuesit` më
   poshtë); pa to leximi dështon në heshtje dhe mbeten vetëm afatet e veta + grupi. Njoftimet: ✕ për rresht dhe "Fshiji të
   gjitha" (`ekK.fshijNjoftimet(ids)`, batch delete te `perdoruesit/{uid}/njoftimet`; rregullat ekzistuese e lejojnë). Testi:
   furn-sugjerim-test.js.
0000000. **PC: TEKSTET E FLETËVE NGA TELEFONI (v210 = 1.19.3)**: njoftimi në hapje "Ke 1 fletë … që pret kontrollin" /
   "Ke N fleta … që presin kontrollin"; rreshti i fletës "1 rresht pret kontrollin" / "N rreshta presin kontrollin"; pas "Anulo"
   te një fletë stoku: "E gjen te "Përmbledhja"" (jo "Afatet e produkteve"). Testet: fleta-numri-test.js, fleta-pritje-test.js.
0000000. **IMPORTET NË KONTROLL + "FSHIJE" (v209 = 1.19.2)**: dy rrugë importi s'e shënonin autorin te kujtesa (produktet
   mësoheshin vetëm në sfond si "automatike", pra dilnin direkt te lista): importi i afateve nga Excel në telefon (`aiBtn`) dhe
   importi i stokut nga Excel/CSV në PC (`imBtn`). Tash thërrasin `mesoShume(..., 'mbishkruaj')` si importet nga foto: te
   kolegët presin kontrollin, te administratori ruhen si të kontrolluara. `ruajFurnizuesitEMiratuar` ruan vetëm furnizuesit e
   afateve/stokut të administratorit dhe të produkteve me `s` (jo ata që Stoku i mësoi vetë nga afatet e kolegëve, që të
   rinjtë të presin kontrollin). Butoni "Harroje" te Produktet (tel + PC) quhet "Fshije". Testi: import-pritje-test.js.
0000000. **PC: FOLDER I RI TE IMPORTI I FLETËS (v208 = 1.19.1)**: `#lxFolderKuti` (`.lexim-folderi`): titulli dhe zgjedhja në një
   rresht, zgjedhja 260px. Opsioni "+ Folder i ri…" (`LX_FOLDER_RI`) hap `dlgFolder` (z-index 52, mbi `dlgLexim`) me
   `hapFolderIRi(pasKrijimit)`: folderi i ri zgjidhet te importi pa u hapur faqja e tij; me "Anulo" mbetet folderi i mëparshëm.
   `dialogISiperm` merr parasysh z-index (Esc mbyll dritaren e sipërme). Pa folder: "Zgjidh folderin". Testi: lx-folder-test.js.
0000000. **FURNIZUESIT E RUAJTUR MË VETE (v207 = 1.19.0)**: kujtesa ka edhe hyrje furnizuesish me çelës `"furnizuesi " + emri`
   (me hapësirë: s'përzihen me barkodet, versionet e vjetra i injorojnë; sinkronizohen te `grupet/{g}/kujtesa` si produktet).
   Vetëm administratori i ruan: me çdo ruajtje të tij me furnizues, kur e miraton/riemërton një furnizues, dhe automatikisht
   (`ruajFurnizuesitEMiratuar`, në sfond, me kohën 1 që s'mund ta mundë një fshirje) krejt furnizuesit e miratuar.
   `listaEFurnizuesve(..., regjistri)`: të ruajturit dalin edhe pa produkte ("Pa produkte"); të fshirët (pa dallim shkronjash)
   s'dalin më, përveç kur një koleg e shkruan sërish (pret kontrollin). `fshijFurnizuesin`: shënim i fshirë `{x,s}` + produktet
   mbeten pa furnizues (afatet s'preken). Riemërtimi fshin të vjetrin dhe ruan të riun. UI: "Fshije" te forma e furnizuesit
   (tel + PC), "Ruaj" për furnizuesit e rinj (PC me një klik; tel me formën pa ndryshim emri). Testi: furn-ruaj-test.js,
   kujtesa-njesi +12. Pa ndryshime në Firebase.
0000000. **"HARROJE" QË S'KTHEHET (v206 = 1.18.5)**: shkaku: shënimi "i harruar" (`{x:1}`) kishte klasën 1, ndërsa hyrja e
   administratorit (`s`) klasën 2, kështu që `hyrjaFiton` mbante versionin e vjetër të administratorit: pajisjet e tjera s'e
   pranonin harrimin dhe ia kthenin grupit produktin. Tash `fshij` / `vendos` bosh nga administratori ruajnë `{x:1, s:1}`
   (klasa 2, fiton më i riu); `hyrjaEPastruar` dhe `hyrjePerGrup` e ruajnë `s` te të harruarat; kolegët s'e rikthejnë një
   produkt të harruar nga administratori (`meso` refuzon mbi `x+s`). Furnizuesit (riemërtimi) ishin në rregull: u provua
   me dy pajisje. Testi: harro-sync-test.js (PC + telefon i administratorit + koleg), kujtesa-njesi +10.
0000000. **FURNIZUESIT E GRUPIT + FURNIZUESIT E RINJ (v205 = 1.18.4)**: `listaEFurnizuesve(afatet, produktet, kujtesa)` merr
   edhe `K.lista()`: furnizuesit e produkteve të grupit dalin te të gjithë (produkte = barkode të ndryshme stoku + kujtesa).
   `nePritje` kur furnizuesi del vetëm te produktet në pritje të kolegëve (`nga` = autorët) → tel nënfaqja `furnPritje`
   (rreshti `#stFurnPritje`), PC karta `#opsFurnPritjeSeksion`. Administratori mund ta riemërtojë (edhe bashkim); kalon te
   Furnizuesit kur ruhen produktet e tij. Rregullim: "Ruaj" me një klik te Produktet e reja (PC) merr gjendjen e tanishme
   (`KJ().merr`), dhe pas riemërtimit të furnizuesit rifreskohen edhe produktet. Pa ndryshime në Firebase.
0000000. **PC: BUTONI I DALJES TE ANËSORJA (v204 = 1.18.3)**: `#sbpDil` te `.sbp-account` (kolona 2, mbi të dy rreshtat),
   vetëm ikonë; teksti "Dil nga llogaria" del me `::after` (`data-tip`) kur mausi qëndron mbi të. Thërret `dil()` (pyet para
   daljes). Fshihet pa llogari. Nën 1180px karta bëhet pak më kompakte që statusi i sinkronizimit të mos pritet.
   stoku-pc.css v26. Testi: dil-pc.js.
0000000. **"SHFAQ EDHE …" TE PRODUKTET (v203 = 1.18.2)**: listat e kujtesës (tel 100, PC 150 në fillim) kanë në fund butonin
   `butoniMeShume` që shton edhe aq (`kujSaShfaqen`, `pritjeSaShfaqen`; kthehen në fillim kur hapet faqja ose ndryshon
   kërkimi). `rifreskoKujtesen` ruan pozicionin e scroll-it (tel `.opsione-trup`, PC listat + `.ops-djathtas`) dhe thërret
   `vizatoKujtesen`. css stoku v36, stoku-pc v25. Testi: meshume-test.js.
0000000. **TEL: STOKU ME NËNFAQE (v202 = 1.18.1)**: te Cilësimet → Stoku (tel) mbetet vetëm Renditja + rreshtat
   `#stokuHyrjet` (`data-nenfaqe`: furnizuesit, pritje, produktet; numrat te `rifreskoHyrjetEStokut`, "Produktet e reja"
   fshihet kur s'ka). Secili hap `.opsione-faqe` më vete (`faqjaEOpsioneve`, `PRINDI_I_FAQES`, `TITULLI_I_NENFAQES`); "←" dhe
   "mbrapa" i Android-it (`niveletEHapura` +1, `mbyllShtresenMeTeFundit`) kthehen te Stoku. Ndryshimet nga grupi / llogaria:
   `rifreskoStokunNeCilesime` (vetëm faqja që shihet). PC s'ndryshon. css/stoku.css v35.
0000000. **PRODUKTET E REJA NË PRITJE (v201 = 1.18.0)**: kujtesa: hyrja është "në pritje" kur ka autor (`n`) dhe s'është e
   administratorit (`!s`) (`eshteNePritje`, `lista()[].nePritje`, `numriNePritje()`). Autori ruhet vetëm kur dikush e shkruan
   produktin për herë të parë ose e ndryshon (i njëjti emër/furnizues s'e kalon në pritje); riemërtimi i furnizuesit nga
   administratori s'e miraton hyrjen në pritje. Cilësimet → Stoku: seksioni i ri "Produktet e reja" (tel `#kujPritjeSeksion`,
   PC karta `#opsKujPritjeSeksion`, e palosshme) para Produkteve; fshihet kur s'ka asgjë. Administratori: "Ndrysho" / "Ruaj"
   (PC edhe me një klik) → `vendos` → s=1 → kalon te Produktet. Të tjerët e shohin vetëm për t'u parë. Menyja: tel
   `tabListaStatus`, PC `opsStokuNen` tregojnë "N produkte të reja për kontroll" (vetëm administratori). Plotësimi gjatë
   skanimit s'ndryshon (edhe ato në pritje plotësojnë). Rregullat e Firebase s'ndryshojnë. css stoku v34, stoku-pc v24.
0000000. **PC: KARTAT E PALOSSHME + X JASHTË (v200 = 1.17.3)**: te Cilësimet → Stoku (PC) kartat Furnizuesit dhe Produktet
   kanë klasën `mbyllur` (lista + kërkimi te `.ops-furn-trup` fshihen), hapen me klikim te `.ops-furn-krye` / `.ops-palos`
   (`palosKarten`, aria-expanded) dhe mbyllen sërish sa herë hapet skeda (`zgjidhSkeden('stoku')`). Numri te `opsFurnNumri` /
   `opsKujNumri`. X-i (`.ops-mbyll`) u zhvendos nga `.ops-djathtas` (që lëviz) te `.ops-dlg` (`overflow: visible`, rrumbullakimi
   te `.opsione-trup`): djathtas jashtë dritares; nën 1100px mbi dritare; nën 1100px dhe 720px lartësi brenda, në cep.
   stoku-pc.css v23. Testi: palos-pc.js (5 madhësi/tema, edhe "E madhe").
0000000. **CILËSIMET → STOKU PËR TË GJITHË (v199 = 1.17.2)**: kategoria Stoku (tel `#tabLista`, PC skeda `stoku`) del
   sërish për këdo; u hoq `rifreskoQasjenEStokut`. Renditja fillestare e ndryshon secili. Furnizuesit dhe Produktet shfaqen
   për këdo, por te jo-administratori rreshtat janë vetëm për t'u parë (tel `div` pa laps, PC pa butonin "Ndrysho"), teksti
   shpjegues ndryshon sipas rolit (`furnIntro`/`kujtesaIntro`, PC `opsFurnHint`/`opsKujHint`), dhe ruajtja/harrimi kontrollojnë
   sërish `eshteAdminiIStokut()`. Te `stoku-auth-ndryshoi` listat rifreskohen nëse faqja është hapur. css/stoku.css v33.
0000000. **KUJTESA: VETËM ADMINISTRATORI E RREGULLON (v198 = 1.17.1)**: Cilësimet → Stoku (tel `#tabLista`, PC skeda `stoku`)
   vetëm për `eshteAdminiIStokut()` (mendurberisha): `rifreskoQasjenEStokut` + mbrojtje te `aktivizoTabin` / `zgjidhSkeden`.
   Kujtesa: fusha e re `s` (nga administratori) dhe `n` (kush e shtoi); `K.vendosAutorin(emri, admin)` thirret nga `KJ()` te
   faqet. Klasat: s (2) > përdoruesi / e harruar (1) > automatike (0). Ruajtja e një kolegu s'e mbishkruan hyrjen e
   administratorit (afati i kolegut ruhet me emrin e tij, kujtesa jo). Produktet e reja të kolegëve dalin te lista "nga {emri}".
   Kujtesa s'fshihet më me grupin (`kol` pa 'kujtesa') dhe kopja e pajisjes s'pastrohet kur ndërrohet grupi. Rregullat e
   Firebase s'ndryshojnë (s/n janë brenda map-it p). Testet: kujtesa-njesi.js (+10), kujtesa-grupi-test.js (16: agim tel +
   mendurberisha PC), kujtesa-test.js (si administrator).
0000000. **KUJTESA E GRUPIT (v197 = 1.17.0, rregullat v197)**: kujtesa e produkteve sinkronizohet me
   `grupet/{g}/kujtesa/{p0..p9,px}` (sipas shifrës së fundit të barkodit; `{ p: { barkodi: {e,f,k,a,m,x} }, ndryshuarSe }`).
   ekipa.js: `degjoKujtesen` (onSnapshot i koleksionit) → `K.bashko(remote)`; ndryshimet lokale (`K.degjo`) → `pritje` → pas 2 s
   `ruajKujtesen` (setDoc merge për çdo pjesë të prekur; hyrjet me krejt fushat a/m/x 0|1, që bashkimi i thellë i Firestore-it
   të mos lërë mbetje). Hera e parë në grup: `K.perDergim(remote)` (çka di pajisja më mirë). Rregulli i fituesit (`hyrjaFiton`):
   hyrja e përdoruesit (pa `a`) mbi atë automatike; e njëjta klasë → më e reja. 'plotëso' s'prek më hyrjet e përdoruesit (vetëm
   të rejat ose automatiket). Ndërrimi i grupit (`stoku:kujtesa:grupi`) e pastron kopjen e pajisjes. Fshirja e grupit fshin edhe
   `kujtesa`. Faqet: `thirr('kujtesa')` rifreskon vetëm listën Produktet nëse është hapur. Rregulli i ri te `grupet/{g}`:
   `match /kujtesa/{pjesa}` (lexim/shkrim anëtarët, `pjesa` p0-9/px, vetëm fushat p + ndryshuarSe). Mock-u fs-server: merge i
   thellë (si Firestore) + rregulli. Testet: kujtesa-njesi.js (+9), kujtesa-grupi-test.js (11, agim tel + besa PC).
   **Vendosja: rregullat e reja te Firebase** (pa to, kujtesa mbetet vetëm në pajisje, pa gabime).
0000000. **KUJTESA E PRODUKTEVE (v196 = 1.16.0)**: barkodi → { emri, furnizuesi } vetëm në pajisje (localStorage
   `stoku:kujtesa:v1`, JO Firebase/Cloudflare), `AF.kujtesa()` / `AF.krijoKujtesen(ruajtja)` te afatet.js. Hyrja `{e, f, k, m}`
   (m = ndryshuar me dorë) ose `{x:1, k}` = harruar ("Harroje"); maks 20000 (hiqen më të vjetrat). Mësimi: `meso(..., 'mbishkruaj')`
   kur përdoruesi ruan afatin / produktin / leximin me foto / importin e stokut; `mesoShume(..., 'plotëso')` në sfond
   (`planifikoMesimin`, 1,5 s pas çdo ruajtjeje dhe në hapje) nga afatet (më të rejat të parat), stoku dhe `ekK.anetaretMeAfate()`
   (kolegët). 'plotëso' s'prek hyrjet me dorë/të harruara. Kërkimi: `emriNgaProduktet`/`furnizuesiNgaAfatet` (tel) dhe
   `emriNgaBarkodi`/`furnizuesiNgaBarkodi` (PC) pyesin kujtesën të parën; Stoku → produkt i ri merr emrin (fokusi te sasia).
   Riemërtimi i furnizuesit (admin) ndryshon edhe kujtesën. Cilësimet → Stoku → "Produktet" (për të gjithë, jo vetëm admin):
   kërkim, ndrysho (emri + furnitori), Harroje. porta.js: çelësi hiqet kur në pajisje hyn një llogari tjetër.
   Bug i vjetër i rregulluar: ruajtja e produktit (tel `ruajProduktin`, PC `ruajProduktin`) e rishkruante objektin dhe humbte
   `furnizuesi`; tash `Object.assign`. Testet: kujtesa-njesi.js (19), kujtesa-test.js (17, tel + PC).
0000000. **NJOFTIMET E GRUPIT ME STOKU TË MBYLLUR (v195 = 1.15.0, Worker 161, rregullat v195)**: më parë vetëm kërkesat
   "Hiqe nga rafti" (feed → /kerkese) vinin si push; njoftimet personale (`perdoruesit/{uid}/njoftimet`: `hequr` që pret
   miratimin, `heqje-pranuar`/`heqje-refuzuar`, `admin-afat`, `lajmerim`) dilnin vetëm kur hapej aplikacioni (dëgjuesi i
   Firestore-it). Tash: ekipa.js `dergoOp` → pas shkrimit të njoftimit `njoftoPushNjoftim(id, per, grupi)` → Worker
   `POST /njoftim {id, per, grupi}`: e lexon dokumentin ME TOKENIN E DËRGUESIT (rregulli i ri `allow get` kur
   `resource.data.uid == request.auth.uid`), kontrollon uid/grupi/freskinë (< 3 min) dhe që s'është `kerkese-*`, ndërton tekstin
   (`tekstiINjoftimit`, i njëjti me `tekstiNjoftimit`) dhe e dërgon vetëm te pajisjet e marrësit në `grupet/{g}/push` (vetëm
   anëtarë të tanishëm). Tag-u `ek-nj-{id}` = ai i njoftimit lokal, ndaj s'dyfishohet. `kontrolloServerin` ruan `versioni`
   (`stoku:push:versioni`); `pushPerNjoftimet()` (push aktiv + Worker ≥ 161) → njoftimi lokal në sfond lihet (`vetemNePerpara`).
   VERSIONI_WORKER 161 (Cilësimet → Njoftimet: "ngjite kodin e ri… që të vijnë edhe njoftimet e Grupit"). sw.js: veprimi
   "Hap njoftimet" (jo më "Hap chat-in"). Testet: wp/njoftim-prova.mjs (17), njoftim-push-test.js (5).
   **Vendosja (përdoruesi): 1) rregullat e reja te Firebase (blloku më poshtë, rreshti `allow get` te njoftimet), 2) Worker-i
   `worker/stoku-push.js` te Cloudflare.** Pa rregullat, /njoftim kthen 403 `rregullat` dhe njoftimet vijnë si më parë vetëm në hapje.
0000000. **ANËTARËT → KOLEGËT (v194 = 1.14.7)**: vetëm tekstet e dukshme te index.html dhe pc.html (skripti anetar-koleg.py:
   anëtar/anëtari/anëtarë/anëtarët/anëtarëve → koleg/kolegu/kolegë/kolegët/kolegëve; "je anëtari i fundit" → "je i fundit në grup";
   "mbetet anëtar i thjeshtë" → "mbetet koleg pa rol admini"). Identifikuesit (`anetaret`, `#/ekipa/anetaret`, Firestore
   `grupet/{g}/anetaret`) s'u prekën; kodi-krahaso: 0 ndryshime kodi. Ora, Android dhe Worker s'kishin tekst "anëtar" të dukshëm.
0000000. **TABELA E ANËTARËVE (v193 = 1.14.6, pc)**: v192 e bënte edhe `.tabela-mbajtese` overflow: visible kur hapej flluska, dhe
   kjo nxori jashtë kartës butonat e kolonës `.k-av`, që ishte e ngushtë (195px) për tre butona (~270px) që kur u shtua "Fshij"
   (ishin të prerë edhe pa flluskë: "Fshij" s'shihej). Tash: vetëm `td` merr `.me-flluske`; kornizat e tjera janë kufi (lart →
   poshtë → `anash`, djathtas ikonës). `#ekTabAnetaret .k-av` 300px (≤1366px: 262px + butona me padding 8px), `.k-leja` 60px
   pa "…"; te `.ek-anetar-qeliza` emri shkurtohet me "…" dhe ikonat mbeten `flex: none`. Provuar 1947/1366/1280/1180px + grup
   me një anëtar.
0000000. **FLLUSKA E ROLIT NË TABELË (v192 = 1.14.5, pc)**: flluska (fëmijë i `.ek-roli`) mbetej e prerë nga `td { overflow: hidden }`
   dhe `.tabela-mbajtese { overflow: hidden }`. Tash `ekTregoFlluskeRoli` u vë klasën `.me-flluske` (overflow: visible) paraardhësve
   me overflow hidden/clip sa kohë është e hapur (hiqet te `ekMbyllFlluske`); paraardhësit me auto/scroll mbeten kufi. Në tabelë s'del
   mbi `thead` (kalon poshtë ikonës). Qoshet e sipërme të `th` të rrumbullakuara (16px), që të mos dalin katrore.
0000000. **GRUPI PA BUTON MBRAPA (v191 = 1.14.4, tel)**: `#ekipiPrapa` fshihet gjithmonë te `vizatoEkipen` (më parë dilte te
   çdo pamje përveç Përmbledhjes). Navigimi bëhet me pllakat sipër; mbrapa i sistemit (popstate, klasa `ne-anetar`) kthen ende te
   Përmbledhja.
0000000. **KONTROLL I PLOTË I PROJEKTIT (v190 = 1.14.3)**: ESLint (no-undef, no-unused-vars etj.) mbi krejt JS-në + skriptet
   inline, zvarritësi (686 klikime tel+PC, e çelët/e errët: 0 gabime konsole), regresioni + testet e vjetra, leximi i Kotlin-it
   (tel/ora) dhe i Worker-it. Rregullime: " (ti)"/"ti" pas emrit u hoq (tel titulli i afateve të anëtarit, PC KPI "Online tani",
   kolona e pronarit te afatet e grupit); `cloudRiktheTani` tash e kontrollon `dukeRikthyerNgaCloud` (ishte vendosur por s'lexohej);
   kodi i vdekur: `vizatoChatin`, `ekPllakaEl`, `chatNisurSe`, `admin` i papërdorur; `#impRuaj`/`#lxRuaj` me tekst fillestar.
   Ora: tile-i shkruan "Pa lidhje · lista e DD.MM" kur `dita` e listës së ruajtur s'është sot. Testi wp/orari-prova kishte
   `iat` të biletës 2 ditë para kohës reale, ndërsa koha e testit është 6 tetor: pas 8 tetorit Worker-i e refuzonte (401).
   S'ishte bug i serverit; në test `iat` u bë 400 ditë më parë.
0000000. **IKONAT E ROLEVE VETËM TE ANËTARËT (v189 = 1.14.2)**: përdoruesi s'i do ikonat e vogla nën avatar (dukeshin keq).
   U hoqën nga "Online tani" (tel), pulti dhe kartat e Afateve (PC); mbeten vetëm te lista e Anëtarëve (tel `vizatoAnetaret`,
   PC tabela `#ekAnetaretTrup`). U hoq varianti `vogel` (`.ek-roli.vogel`, `.ek-rrip-rolet`) nga `ekIkonaRoli` dhe CSS.
0000000. **IKONAT E ROLEVE KUDO + KONTROLLI I PROJEKTIT (v188 = 1.14.1)**: `ekIkonaRoli(roli, krijo, njofto, vogel)`; ikonat e vogla
   (`.ek-roli.vogel`) nën avatar te "Online tani" (`.ek-rrip-rolet`, tel) dhe te anëtarët e pultit + kartat KPI (PC), pa " (ti)".
   Kontrolli: `releases?per_page=100` (tel/Perditesimi.kt, ora/Perditesimi.kt, android.html), se me shumë publikime `ora-v*`
   `tel-v*` dilte jashtë 40 të parave dhe përditësimi s'gjendej. ekipa.js: u hoq dëgjuesi `chatFundit` (chat-i u hoq në v182,
   ishte lexim i kotë + njoftim "Chat" që s'hapej). Tekstet e Grupit (tel: prania "sot 00:03", "Sipas anëtarëve", ftesat, leja e sasisë): `.kodi.ek-stat-nen` pa shkronjën mono.
0000000. **EKIPA → GRUPI, PA "PRONAR" (v187 = 1.14.0)**: përdoruesi do "Grupi" kudo. Vetëm tekstet u ndryshuan (tel, PC,
   ekipa.js, ora, kanali i njoftimeve në Android, teksti i push-it te Worker-i pa ndryshim versioni): ekipa→grupi, ekipën→grupin,
   ekipës→grupit, ekipë→grup, "Krijo grupin tënd", "Grupi yt", "Emri i grupit të ri", "e këtij grupi", "Secili grup".
   Roli: "pronar" → "admin i grupit" (Bëje admin / Hiqe si admin / Ti je admin i grupit); flluskat: "Admin i Grupit",
   "Administrator". Fallback-et e emrit (pronari i afatit) → "Kolegu/kolegut".
   - MOS i ndrysho: identifikuesit (`ekipa`, `ekK`, `ekGrupi*`, `#ekipa-`), çelësat `stoku:ekipa:*` (gjendja e ruajtur),
     id-ja e grupit të vjetër "ekipa" dhe emri i tij 'Ekipa' në migrim (të dhëna). U verifikua me kodi-krahaso: 0 ndryshime kodi.
0000000. **FLLUSKA BRENDA IKONËS + FADE TE FILTRAT (v186 = 1.13.4)**: flluska (fixed) dilte e zhvendosur te aplikacioni Android;
   tash është fëmijë i `.ek-roli` (position: absolute, bottom: 100% + 10px), `--zhvendosja` e mban brenda ekranit, poshtë kur s'ka vend
   nën kokë; mbyllet pas 5 s. `.af-filtrat`: klasat `fade-majtas/fade-djathtas` (scroll + ResizeObserver + MutationObserver) → mask-image.
0000000. **FLLUSKA E ROLIT + FILTRAT BRENDA VIJAVE (v185 = 1.13.3)**: `ekTregoFlluskeRoli` (tel + PC): `.ek-flluska` fixed mbi/nën
   ikonën, shigjeta te `--shigjeta-x`, mbyllet me prekje/scroll ose pas 3.5 s. `.sb .af-filtrat` pa margin negative (-20px):
   rreshtat e statusit/muajve rrëshqasin brenda gutter-it 20px.
0000000. **ROLET SI IKONA (v184 = 1.13.2)**: `ekIkonaRoli(roli, krijo, njofto)` (tel + PC): kurora (pronar, `--sb-near`) dhe mburoja
   (admin, `--sb-accent`), 22px, title/aria-label, prekja → toast me shpjegimin. Shenja "ti" u hoq kudo (edhe rripi Online tregon emrin).
0000000. **EKIPA: PA STOKUN, IKONA OFFLINE (v183 = 1.13.1)**: `#ekChipStoku` (tel) dhe `#ekSegStoku` (PC) gjithmonë të fshehur, pamja
   'stoku' → përmbledhja/pulti, edhe për adminin. `praniaIkone` offline: ikona e pajisjes (IK_TEL/IK_PC) + `.pk` gri në vend të IK_OFF
   (wifi e prerë); përdoruesi zgjodhi "Pajisja gri + pikë gri".
0000000. **EKIPA: PËRMBLEDHJA, PA CHAT, MENYJA E PALËVIZSHME (v182 = 1.13.0)**:
   - Chat-i u hoq nga UI (tel + PC): `#ekChatBtn`/`#navEkChat`/`ekAdminPastroChat` të fshehur, pamja 'chat' → përmbledhja,
     njoftimet me pamja 'chat' injorohen, s'ka pikë chat-i. Kodi i chat-it te ekipa.js mbeti (s'thirret nga UI).
   - Tel: `ekPamja` = permbledhja | afatet | aktiviteti | kalendari | anetaret | stoku; shtëpia = 'permbledhja'
     (`vizatoPermbledhjen`: 6 numra të prekshëm + kërko heqje + online + duhet hequr + këtë javë + aktiviteti i fundit (3)
     + `ekSeksionetEStatistikave`). 'statistika' u hoq; 'afatet' pa anëtar = krejt ekipa ("Afatet").
   - Menyja `#ekMenu` gjithmonë në kokë (u hoq `.ek-shtepi .ek-menu-kuti {display:none}` dhe `.ek-pult-pllakat` brenda
     listës, pa `scrollIntoView`), koka me min-height e njëjtë → menyja s'lëviz kur ndërron pamjen. css v25.
0000000. **EKIPA (TEL): PA HERO, MENYJA ME IKONA (v181 = 1.12.2)**: `vizatoPultin` s'e ka më `.ek-pult-hero`. `.ek-pllakat` (#ekMenu)
   dhe `.ek-pult-pllakat`: kuti 46px me SVG-në `.ek-pl-ik` (ishte e fshehur) + emri poshtë; aktiv = `--sb-accent`. css v24. Vetëm tel.
0000000. **NJOFTIMI I HEQJES PA FJALI SHTESË (v180 = 1.12.1)**: `tekstiNjoftimit` (hequr) s'ka më "Pranoje që të hiqet..." /
   "E pranove/E refuzove"; vendimi del vetëm te butonat (✓ E pranove / ✕ E refuzove).
0000000. **HEQJA NGA KOLEGU ME MIRATIM (v179 = 1.12.0, pa ndryshim rregullash)**: më parë "Unë e hoqa" te afati i kolegut e
   hiqte vetë te pronari (`zbatoHeqjet` nga dëgjuesi i njoftimeve). Tash:
   - Kolegu: i njëjti njoftim `hequr` + ngjarje `hequr` (me pronariUid). `mbivendosHeqjen` s'e shfaq më të hequr, por
     `nePritjeNga/nePritjeUid/nePritjeSe` → "Në pritje" (tel: `ek-kart-pritje`, `ek-pill-pritje`; PC: `.ek-pritje`).
   - Pronari: s'ka zbatim automatik. Zilja: `ekButonatEHeqjes` (Prano / Refuzo) → `ekK.vendosPerHeqjen(nj, pranoj)` →
     njoftimi i vet {vendim, vendosurSe, lexuar}, njoftim te kolegu `heqje-pranuar|heqje-refuzuar`, ngjarje me të njëjtin
     lloji te feed-i (pronariUid, afatId, kerkuesUid/Emri). Pranimi → `o.zbatoHeqjet([nj])` (pa kushtin "ka skaduar").
   - `ePritur` mban të palexuar `hequr` pa vendim (shenja e ziljes mbetet). Test: `miratimi-test.js` (tel + PC).
0000000. **ORA: KARTELAT E KUQE/TË VERDHA (v178 = 1.11.6)**: `RreshtiAfatit` s'është më gri: e skaduar = sfond #3A1513 + vijë e
   kuqe, afër (sot/këtë javë) = #33280A + vijë e verdhë (`AfatAfer`, fikse, s'ndjek ngjyrën e Pamjes).
0000000. **ORA: RIFRESKO SILLET, CILËSIMET PA MBRAPA (v177 = 1.11.5)**: `ButoniRifresko` s'çaktivizohet më dhe s'ndërrohet me
   spinner (dukej si bug): ikona rrotullohet (Animatable, 800 ms/rrotullim, përfundon drejt), ngarkimi zgjat ≥700 ms. `Koka` vetëm
   titull: Wear OS ka butonin fizik + rrëshqitjen për mbrapa (`ButoniMbrapa`/`ShigjetaMbrapa` u hoqën).
0000000. **ORA: RIFRESKIM VETËM NË HYRJE + BUTONI RIFRESKO (v176 = 1.11.4)**: u hoq cikli 60 s dhe rreshti "prek për
   rifreskim"; mbetet `Rikthimi.n` (onResume). Poshtë listës: `ButoniRifresko` (majtas, rrotullim gjatë ngarkimit) + `ButoniCilesimet`.
0000000. **ORA: PA PULLREFRESH, INGRANAZH, VERSIONI NË FUND (v175 = 1.11.3)**: rrëshqitja poshtë në orë hapte panelin e
   sistemit → u hoq `pullRefresh` (dhe varësia compose-material). Tash `Rikthimi` (onResume → n++, rifreskim) + çdo 60 s kur
   lista është në ekran + rreshti "Rifreskuar HH:mm · prek për rifreskim". `ButoniCilesimet` (ImageVector nga SVG-ja e
   ingranazhit të telefonit, me PathParser; pikë kur ka version të ri). Cilësimet: llogaria + "Stoku për orë · 1.0.N" në fund.
0000000. **HERO E ÇELËT NË TEMËN E ÇELËT (v174 = 1.11.2)**: `.sb-summary` (tel) dhe `.kpi-hero` (PC) ishin `--sb-hero`
   (#14161b) edhe në temën e çelët; tash `html.sb(p):not([data-tema="dark"])` → `--sb-surface` + vijë. `.sb-scan` (afati i ri) mbeti i errët.
0000000. **#oraKodi PA NUMËR SHEMBULL (v173 = 1.11.1)**: placeholder "482913" dukej si kod i vërtetë → "Kodi nga ora"
   (::placeholder pa letter-spacing, css v21); mesazhi i gabimit pa shembull numri.
0000000. **ORA: PAMJA, MBRAPA, RRËSHQIT PËR RIFRESKIM, KODI ÇDO 15 S (v172 = 1.11.0)**: `ora/Tema.kt`: `Tema` (8 ngjyra,
   prefs "stoku-pamja"/"ngjyra"), `Verdhe` tash getter i `Tema.theks` (tile mbetet e verdhë), `ButoniMbrapa` (ImageVector i njëjtë
   me SVG-në e telefonit), ekrani `PamjaEkrani` te Cilësimet. Lista: `pullRefresh` (androidx.compose.material) në vend
   të chip-it "Rifresko". Lidhja: `Api.kodiIRi` çdo 15 s me numërim; kodet e vjetra vlejnë sa i lë Worker-i (15 min, pa ndryshim).
0000000. **SHIGJETA MBRAPA SVG (v171 = 1.10.2)**: "←" (germë) brenda rrethit dukej keq; tash SVG chevron (`M15 18l-6-6 6-6`, 20px,
   stroke 2.4) te #btnMbrapa, #opsPrapa, #afPrapa, #ekipiPrapa, #impPrapa, #lxPrapa (+ aria-label "Mbrapa"); css/stoku.css v20.
0000000. **CILËSIMET MË TË PASTRA (v170 = 1.10.1, ora pa ndryshim funksional)**: përdoruesi: "Ora dhe aplikacioni" të ketë
   vetëm orën; kontrolli i përditësimit të aplikacionit si buton i hollë mes "Çka ka të re" dhe versionit; "←" me rreth.
   - Kategoria `#tabOra` → "Ora e dorës" (status "Galaxy Watch, Apple Watch"), faqja vetëm me orën (karta Android u hoq).
   - `#njAndroidBtn.ops-app-btn` (css/stoku.css, pill i hollë me kufi) para `.ops-fundi`: brenda aplikacionit "Kontrollo
     për përditësim" → `StokuAndroid.kontrolloPerditesimin()` (Toast-i i Android-it jep përgjigjen); Chrome Android "Shkarko
     aplikacionin Android" → android.html; tjetërkund i fshehur. Listener-i vendoset NJË herë (jashtë `hapOpsionet`).
   - css/stoku.css: `#opsPrapa/#afPrapa/#ekipiPrapa/#btnMbrapa` s'janë më transparente: rreth si `.btn-ikone` (40px).
   - Ora: tekstet e rrugës → "Cilësimet → Ora e dorës".
0000000. **CILËSIMET "ORA DHE APLIKACIONI" + EKIPA PA "GRUP" + ORA: CILËSIMET (v169 = 1.10.0)**: përdoruesi s'e kuptonte
   pse lidhja e orës dhe shkarkimi i aplikacionit ishin te Njoftimet, dhe "Ekipa / Anëtarët / Grupi" i dukeshin tri gjëra.
   - Telefoni: kategori e re te Cilësimet `#tabOra` → faqja `data-faqe="ora"` ("Ora e dorës": `#segOra`, `#oraKodi`,
     `#oraLidh`, udhëzimet Galaxy/Apple; "Aplikacioni Android": `#njAndroidGrupi` + `#njAndroidKarta`). Njoftimet kanë
     vetëm njoftimet. Statusi i kategorisë `#tabOraStatus` sipas pajisjes (aplikacioni + versioni / Chrome Android / iPhone).
     Në Android karta e aplikacionit del E PARA (hapi 1 i Galaxy: "më lart në këtë faqe"). Pa Android (iPhone, shfletues
     tjetër): kategoria quhet "Ora e dorës" (`FJALORI.tabOra` + `.kat-tekst`), `#oraIntro` pa aplikacionin.
   - BUG i rregulluar (nga v167): blloku i kartës Android ishte BRENDA `hapOpsionet()` → çdo hapje e Cilësimeve shtonte
     edhe një "click" te `#njAndroidBtn` (3 hapje = 3 dritare "Shkarko" / 3 kontrolle). Tash ekzekutohet një herë.
   - Ekipa: në UI s'ka më "grup": kudo "ekipa" (tel + PC + ekipa.js + teRejat): "Krijo ekipën tënde", "Fto një shok në
     ekipë", "Pronari i ekipës", "Largohu nga ekipa", "Pa ekipë" etj. Kodi/Firestore mbeten `grupet/{g}`, `grupiInfo`,
     `ekGrupi*` (vetëm tekstet u ndryshuan; u verifikua me krahasim të kodit pa stringje/komente: 0 ndryshime kodi).
     Struktura: Ekipa (titulli = emri i ekipës) → Anëtarët = "Ekipa jote" (karta) + fto + "Anëtarët" + largohu.
   - Ora (`ora/`): ekran `Pamja.Cilesimet` (chip-i i fundit i listës, në vend të "Shkëput orën"): versioni, llogaria,
     "Kontrollo për përditësim" → "Përditëso tani" (`Perditesimi.kontrollo(detyro = true)` / `instalo`), mesazhi
     "S'u kontrollua: s'ka internet" kur `Perditesimi.deshtoi`, "Shkëput orën" me dy prekje. Rruga te telefoni:
     "Cilësimet → Ora dhe aplikacioni → Lidh orën".
0000000. **"SAHAT" → "ORA" + KONTROLL I PLOTË (v168 = 1.9.1)**: përdoruesi s'e do fjalën "sahat" (krahinore); kudo (web
   tel/PC, teRejat, ora/, worker, README, SHENIME) u zëvendësua sipas gramatikës: sahati → ora, sahatin → orën, sahatit →
   orës, sahat → orë (p.sh. "Lidh orën", "Shkëput orën", "Stoku në orë"). MOS e përdor më "sahat" në asnjë tekst.
   - Android: `onNewIntent` → `window.__stokuHapNgaNjoftimi(hash)` (index.html) hap chat-in/afatet pa ringarkim; kontrolli i
     versionit edhe në `onResume` (6 orë); fotot e përkohshme të kamerës fshihen pas 1 dite. Udhëzimi i orës (Galaxy) tregon
     aplikacionin Android si hapin e parë.
   - Kontrolli: regresioni + testet e vjetra + zvarritësi (çdo buton, tel/PC, temë e çelët/e errët) + offline (SW v168).
     Testet e vjetruara (para grupeve/dizajnit të ri, s'janë gabime): `ekipa-admin-paemri-test.js`,
     `kerkesat-v115-paemri.js`, `fshirja-v116-paemri.js`, `v133.js` (KPI), `sw-root.js` (#logoSlika), `flete.js` (s'është test).
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

- **v240: krejt testet janë te `teste/`** (më parë në scratchpad-in e sesionit, që humbte në çdo bisedë të re):
  `bash teste/regresioni.sh > teste/regresioni-vNNN.txt` (rreth 30 min). Herën e parë: `(cd teste/npm && npm ci)` dhe
  `(cd teste/wp && npm ci)`. Serveri `teste/server-cloudflare.py` (8765) i shton header-at e Cloudflare (CSP nga
  `CSP_CLOUDFLARE` më lart); `teste/keq/` (8766) është faqja "e huaj" për testin e iframe-it. Testet e reja shkojnë
  te `teste/` dhe te lista e `regresioni.sh`; dalja (`*.png`, `r5-*.txt`) është te `.gitignore`. Shtigjet janë
  relative (`STOKU_DIR`, `__dirname/..`), Playwright nga `teste/pw.js`. Testet e Worker-it krijojnë çelësa prove vetë.
- Server lokal (për prova të shpejta): `python3 -m http.server 8765` (ose port tjetër) brenda rrënjës së repo-s.
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
- **Emulatorët e vërtetë në repo (v243): `teste/emu/`** (Auth + Firestore nga `firebase-tools`, SDK-ja e njëjtë si stoku.site,
  rregullat nga ky skedar). `bash teste/emu/nis.sh` (herën e parë `npm ci` + shkarkimi i JAR-it), pastaj testet `teste/emu/*`.
  Faqet e vërteta lidhen me emulatorët vetëm në test (`e2e.js`: route i gstatic → SDK-ja e ndërtuar, pa CSP, `connect*Emulator`).
  S'janë në regresion (kërkojnë Java dhe ~1 min nisje). Firestore-i i rremë (`fs-server.js`) s'i imiton kopjet lokale të
  pjesshme të SDK-së: gabimi i v243 u gjet vetëm këtu.
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

- Pllakat me ngjyra (ideja 4, v265/v267) edhe brenda folderit: "spom pelqen" → u zëvendësuan me butonin lundrues të ndarë (v268).
- Pllakat me ngjyra (ideja 4) te Afatet ("Shto", "Excel"), v265 → u hoqën te v266: "veq te stoku". Pllakat vetëm brenda folderit.
- Ora (v262, u anulua 28.10.2026): "Për t'u hequr" vetëm me të skaduarat (pa të verdhat "skadojnë sot") dhe hiqja e seksionit
  gri "KËTË JAVË" ("e ke keqkuptu"). Lista e orës mbetet si para v262; mos e ndrysho pa pyetur çka do saktësisht.
- Logoja e re (28.10.2026): 20 idetë e Claude Design ("asnjona s'po m'pëlqen", faqja u fshi) dhe paketa `Stoku_brand_assets.zip`
  (dy gjashtëkëndësha blu #2563FF / cian #00D4FF si "S", "Stoku" në Arial Bold): u vendos në web, Android dhe orë, pastaj u anulua
  para merge-it ("ktheje te mas komplet qysh u kon logo"). Logoja mbetet ajo me barkod + shufrën e verdhë.
- Opsioni "Mos dil kur i fshin të dhënat" te Cilësimet → Llogaria dhe udhëzimi "shtyp Ruaj" te porta (v165, u hoq
  te v166): "hiq bash kurgjo ske bo, hiqe fshije".
- Chat-i i Grupit (u fsheh te v182, u hoq krejt te v221: "zhduke 100% se e kemi hek chatin"; te v222 edhe nga historiku
  "Çka ka të re"): mos e rikthe as si emër, as si buton, as në tekste, as në Worker/rregulla.
- Fjalia "Jepja vetëm pasi ta njohësh personin" (dhe "pasi të të njohë") te kodi i fjalëkalimit të harruar (u hoq te
  v221: "heke krejt se s'duhet"). Njoftimi i kodit mbaron te "(vlen 30 minuta)."

- Marking/vijëzim automatik i rreshtave në fletë (u keqkuptua kërkesa origjinale; u zëvendësua me "laps"
  të kuq të vizatuar me dorë nga përdoruesi mbi foton, që mbetet gjatë zoom-it).
- Butoni "versioni për telefon" te pc.html (u hoq krejt).
- Font i veçantë / numra më të mëdhenj te Afatet (v121/v122, u kthyen si më parë te v123).
- Pamje/dizajne të mia (dy raunde u refuzuan); pamja e sotme (v126) është dizajni i vetë përdoruesit nga Claude Design.
- Çdo gjë për furnizuesin si mesazh/lajmërim (v121 + v122): "Lajmëro furnizuesin", "Lajmërova", "Dërgo listën",
  "Kopjo mesazhin për furnizuesin". Grupimi sipas furnizuesit mbetet (vetëm si listë).
- Aplikacioni i vjetër i telefonit me WebView (`tel/`, `site.stoku.app`, `android.js`/`window.StokuAndroid`, Release-t
  `tel-vNN`): u fshi krejt te v255 ("zhduke komplet"). Mbetet vetëm aplikacioni `vendas/`. Mos e rikthe.
- Datat e shpejta te "Afat i ri" (1 javë, 2 javë, 1 muaj, 3 muaj): u hoqën te v254 nga web-i dhe aplikacioni Android
  ("Hekja qeto ne krejt projektin"). Mos i rikthe.
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

## Rregullat e Firestore (v250 pikat vetëm administratori i ndryshon, v246 pikat e marketeve, v243 rikthimi i grupit (pronarUid), v242 regjistri + kërkesat për grup, v164 grupet, v221 pa chat, v229 skedarët në PC, v230 lejet; më parë v116 + v130 ekipa_push + v140 admini nga llogaria): i vendos PËRDORUESI (unë s'kam qasje)

**Gjendja:** rregullat **v250** (krejt teksti më poshtë: v246 `pikaOk` + `pikat/{id}` dhe v250 `allow update` te `pikat` vetëm për administratorin) i vendosi pronari në Firebase më **22.10.2026** (i konfirmoi vetë pas v251). Më parë: v243 më 21.10.2026.

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
**v221 (pa chat):** u hoqën `ekipa_chat/{id}` dhe `grupet/{g}/chat/{id}`: askush s'lexon/shkruan më aty (as aplikacioni i
vjetër: krijimi refuzohet, fshirja e grupit vazhdon pa to). Mesazhet e vjetra, nëse ka, fshihen vetëm nga Console.
**v230 (lejet):** `lejet/{uid}`: e lexon vetë llogaria (për t'i zbatuar) ose administratori (faqja "Përdoruesit"); e
shkruan dhe e fshin VETËM administratori. Testi: `emu/lejet-prova.mjs` (scratchpad, emulatori i vërtetë).
**v242:** `kujtesa/{p0..p9,px}` = regjistri i përbashkët (lexon kushdo me llogari, shkruan VETËM administratori);
`kujtesa_pritje/{uid}` = çka mëson/shkruan secili, për kontroll (vetja + administratori); `grupet_publike/{g}` = emri i grupit
dhe admini për kërkimin (lexon kushdo; shkruan pronari i grupit; fshin pronari/admini ose kushdo kur grupi s'ekziston më);
`kerkesat_grupi/{g}_{uid}` = kërkesa për t'u futur (e krijon vetë kërkuesi, jo anëtar, grupi duhet të ekzistojë; e lexojnë
kërkuesi dhe anëtarët e grupit; e fshin kërkuesi ose pronari). Pranimi = ftesë (rregulli ekzistues i `ftesat`).

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
    // v246: pika e përbashkët e një marketi (emri + vendndodhja)
    function pikaOk(d) {
      return d.keys().hasOnly(['emri', 'lat', 'lng', 'krijuarNga', 'krijuarNgaEmri', 'krijuarSe', 'ndryshuarSe', 'emriNgaAdmini'])
        && d.emri is string && d.emri.size() >= 1 && d.emri.size() <= 60
        && d.lat is number && d.lat >= -90 && d.lat <= 90 && d.lng is number && d.lng >= -180 && d.lng <= 180;
    }
    match /dyqane/{kodi} {
      allow read, write: if request.auth != null && ((request.auth.uid == kodi && !uFshi(kodi)) || eshteAdmin());
      match /pjeset/{pjesa} {
        allow read, write: if request.auth != null && ((request.auth.uid == kodi && !uFshi(kodi)) || eshteAdmin());
      }
      match /fletet/{fleta} {
        allow read, write: if request.auth != null && ((request.auth.uid == kodi && !uFshi(kodi)) || eshteAdmin());
      }
      // v229: skedarët (Excel, PDF) që telefoni/PDA-ja ia dërgon PC-së së vet; copat te /pjeset (Bytes ≤ 900 KB)
      match /skedaret/{sk} {
        allow read, delete: if request.auth != null && request.auth.uid == kodi;
        allow create: if request.auth != null && request.auth.uid == kodi && !uFshi(kodi)
          && request.resource.data.keys().hasOnly(['emri', 'lloji', 'titulli', 'pajisja', 'madhesia', 'pjeset', 'krijuarSe', 'skadon'])
          && request.resource.data.emri is string && request.resource.data.emri.size() > 0 && request.resource.data.emri.size() <= 150
          && request.resource.data.madhesia is int && request.resource.data.madhesia > 0 && request.resource.data.madhesia <= 15728640
          && request.resource.data.pjeset is int && request.resource.data.pjeset > 0 && request.resource.data.pjeset <= 20;
        allow update: if request.auth != null && request.auth.uid == kodi && !uFshi(kodi)
          && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['shkarkuarSe']);
        match /pjeset/{p} {
          allow read, delete: if request.auth != null && request.auth.uid == kodi;
          allow create: if request.auth != null && request.auth.uid == kodi && !uFshi(kodi)
            && request.resource.data.keys().hasOnly(['i', 'b']) && request.resource.data.b is bytes
            && request.resource.data.b.size() <= 1000000;
        }
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
        // v195: dërguesi e lexon njoftimin që e shkroi vetë (Worker-i, me tokenin e tij, e dërgon si push te marrësi)
        allow get: if request.auth != null && resource.data.uid == request.auth.uid;
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
    // v230: lejet e secilës llogari (çka mund të përdorë në Stoku). I ndryshon vetëm administratori (Cilësimet →
    // Përdoruesit); llogaria lexon vetëm të vetat. Pa dokument = llogari e pakontrolluar, me krejt lejet.
    match /lejet/{uid} {
      allow read: if request.auth != null && (request.auth.uid == uid || eshteAdmin());
      allow create, update: if request.auth != null && eshteAdmin()
        && request.resource.data.keys().hasOnly(['lejet', 'kontrolluarSe', 'kontrolluarNga', 'emri'])
        && request.resource.data.lejet is map && request.resource.data.lejet.size() <= 60;
      allow delete: if request.auth != null && eshteAdmin();
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
    match /ekipa_push/{id} {
      allow read: if request.auth != null && neEkipe();
      allow create, update: if request.auth != null && neEkipe() && request.resource.data.uid == request.auth.uid
        && id.matches(request.auth.uid + '_[A-Za-z0-9]+');
      allow delete: if request.auth != null && neEkipe();
    }
    // v164: grupet. Anëtarët te grupet/{g}/anetaret/{uid} (roli 'pronar' | 'anetar'); treguesi te perdoruesit/{uid}.grupi
    match /grupet/{g} {
      allow read: if request.auth != null && (anetarIGrupit(g) || eshteAdmin());
      allow list: if request.auth != null && resource.data.pronarUid == request.auth.uid; // v243: pronari e gjen grupin e vet (rikthimi)
      allow create: if request.auth != null && (eshteAdmin() || (!uFshi(request.auth.uid)
        && request.resource.data.pronarUid == request.auth.uid && request.resource.data.pronarEmri == emriIm()
        && request.resource.data.keys().hasOnly(['emri', 'pronarUid', 'pronarEmri', 'krijuarSe'])
        && emriIGrupitOk(request.resource.data) && g != 'ekipa'));
      allow update: if request.auth != null && (eshteAdmin() || (pronarIGrupit(g)
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['emri']) && emriIGrupitOk(request.resource.data)));
      allow delete: if request.auth != null && (pronarIGrupit(g) || eshteAdmin());
      match /anetaret/{u} {
        allow read: if request.auth != null && (request.auth.uid == u || anetarIGrupit(g) || eshteAdmin());
        // Hyrja vetë: pronari vetëm bashkë me krijimin e grupit (i njëjti batch); anëtari vetëm me ftesë, që fshihet
        // në të njëjtin batch (v216: një ftesë s'përdoret dy herë);
        // anëtari i ekipës së vjetër te grupi "ekipa". Administratori shton kë të dojë (migrimi).
        allow create: if request.auth != null && (eshteAdmin() || (request.auth.uid == u && !uFshi(u)
          && request.resource.data.emri == emriIm()
          && request.resource.data.keys().hasOnly(['emri', 'roli', 'hyriSe', 'aktivSe', 'online', 'platforma'])
          && ((request.resource.data.roli == 'pronar' && !exists(/databases/$(database)/documents/grupet/$(g))
                && getAfter(/databases/$(database)/documents/grupet/$(g)).data.pronarUid == u)
              || (request.resource.data.roli == 'anetar' && exists(/databases/$(database)/documents/grupet/$(g))
                && exists(/databases/$(database)/documents/ftesat/$(g + '_' + emriIm()))
                && !existsAfter(/databases/$(database)/documents/ftesat/$(g + '_' + emriIm())))
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
      // v197: kujtesa e produkteve e grupit (barkodi → emri, furnizuesi), e ndarë sipas shifrës së fundit: p0..p9, px
      match /kujtesa/{pjesa} {
        allow read: if request.auth != null && (anetarIGrupit(g) || eshteAdmin());
        allow create, update: if request.auth != null && (anetarIGrupit(g) || eshteAdmin())
          && pjesa.matches('p[0-9x]') && request.resource.data.keys().hasOnly(['p', 'ndryshuarSe'])
          && request.resource.data.p is map;
        allow delete: if request.auth != null && (anetarIGrupit(g) || eshteAdmin());
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
    // v242: regjistri i përbashkët i produkteve dhe furnizuesve (barkodi → emri, furnizuesi): e lexon kushdo me llogari,
    // e shkruan vetëm administratori (çka ka kontrolluar). I ndarë si kujtesa e grupit: p0..p9, px.
    match /kujtesa/{pjesa} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null && eshteAdmin() && pjesa.matches('p[0-9x]')
        && request.resource.data.keys().hasOnly(['p', 'ndryshuarSe']) && request.resource.data.p is map;
      allow delete: if request.auth != null && eshteAdmin();
    }
    // v242: produktet dhe furnizuesit që secili i mëson/shkruan, për kontrollin e administratorit
    match /kujtesa_pritje/{u} {
      allow read: if request.auth != null && (request.auth.uid == u || eshteAdmin());
      allow create, update: if request.auth != null && request.auth.uid == u && !uFshi(u)
        && request.resource.data.keys().hasOnly(['p', 'emri', 'ndryshuarSe']) && request.resource.data.p is map
        && request.resource.data.p.size() <= 4000 && request.resource.data.emri == emriIm();
      allow delete: if request.auth != null && (request.auth.uid == u || eshteAdmin());
    }
    // v242: grupet për kërkimin "Hyr në një grup" (emri i grupit dhe admini); i shkruan pronari i grupit
    match /grupet_publike/{g} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null && pronarIGrupit(g) && !uFshi(request.auth.uid)
        && request.resource.data.keys().hasOnly(['emri', 'pronarEmri', 'ndryshuarSe'])
        && emriIGrupitOk(request.resource.data) && request.resource.data.pronarEmri == emriIm();
      allow delete: if request.auth != null && (pronarIGrupit(g) || eshteAdmin()
        || !exists(/databases/$(database)/documents/grupet/$(g)));
    }
    // v246: pikat e përbashkëta të marketeve (v250: marketet e Stoku-t, të njëjtat për krejt merchandiserët). I lexon kushdo me
    // llogari; i krijon merchandiseri në emër të vet (kur është brenda marketit) ose administratori (me dorë në hartë);
    // v250: emrin/vendndodhjen i ndryshon dhe i fshin VETËM administratori.
    match /pikat/{id} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && !uFshi(request.auth.uid) && pikaOk(request.resource.data)
        && request.resource.data.krijuarNga == request.auth.uid && request.resource.data.krijuarNgaEmri == emriIm()
        && !('emriNgaAdmini' in request.resource.data);
      allow update: if request.auth != null && eshteAdmin() && pikaOk(request.resource.data);
      allow delete: if request.auth != null && eshteAdmin();
    }
    // v242: kërkesat për t'u futur në një grup. Id = {grupi}_{uid}. Pronari e pranon me një ftesë (ftesat).
    match /kerkesat_grupi/{id} {
      allow read: if request.auth != null
        && (resource.data.uid == request.auth.uid || anetarIGrupit(resource.data.gid) || eshteAdmin());
      allow create, update: if request.auth != null && !uFshi(request.auth.uid)
        && request.resource.data.uid == request.auth.uid && request.resource.data.emri == emriIm()
        && id == request.resource.data.gid + '_' + request.auth.uid
        && request.resource.data.keys().hasOnly(['gid', 'grupiEmri', 'uid', 'emri', 'koha'])
        && request.resource.data.gid is string
        && exists(/databases/$(database)/documents/grupet/$(request.resource.data.gid))
        && !anetarIGrupit(request.resource.data.gid)
        && request.resource.data.get('grupiEmri', '') is string && request.resource.data.get('grupiEmri', '').size() <= 60;
      allow delete: if request.auth != null
        && (resource.data.uid == request.auth.uid || pronarIGrupit(resource.data.gid) || eshteAdmin());
    }
    // v211: furnizuesit e administratorit, si sugjerim për krejt përdoruesit (edhe jashtë grupit)
    match /publike/furnizuesit {
      allow read: if request.auth != null;
      allow create, update: if eshteAdmin()
        && request.resource.data.keys().hasOnly(['lista', 'ndryshuarSe'])
        && request.resource.data.lista is list && request.resource.data.lista.size() <= 3000;
    }
  }
}
```

Pas vendosjes: admin-i duhet ta hapë aplikacionin një herë (telefon ose PC) me v164: ekipa e vjetër bëhet grupi "Ekipa"
(anëtarët, aktiviteti, afatet). Anëtarët e vjetër hyjnë vetë aty; të tjerët s'shohin askënd derisa të krijojnë
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
